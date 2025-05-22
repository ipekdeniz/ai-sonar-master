#!/bin/bash
set -e  # Script stops if any command fails

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Error handling function
handle_error() {
    log "ERROR: $1"
    exit 1
}

# Check environment variables
if [ -z "$PROJECT_KEY" ]; then
    handle_error "PROJECT_KEY is required"
fi

log "=== Starting Sonar Analysis Job ==="
log "Project Key: $PROJECT_KEY"
log "Issue Key: $ISSUE_KEY"
log "Issue Types: $ISSUE_TYPES"
log "Workspace: $WORKSPACE"

# Define API URLs using container names for Docker networking
API_URL="http://$SonarAnalyzerURL:3000/api/analyze"
RESULTS_URL="http://$SonarAnalyzerURL:3000/api/results.zip"

# Create request body
if [ -n "$ISSUE_KEY" ]; then
    log "=== Analyzing Single Issue ==="
    REQUEST_BODY="{\"projectKey\":\"$PROJECT_KEY\",\"issueKey\":\"$ISSUE_KEY\"}"
else
    log "=== Analyzing Issues by Type ==="
    REQUEST_BODY="{\"projectKey\":\"$PROJECT_KEY\",\"issueTypes\":\"$ISSUE_TYPES\"}"
fi

log "Request Body: $REQUEST_BODY"

# Call API and process streaming response
log "=== Calling Analysis API ==="
log "Waiting for API response..."

# Create temporary file for API response
TEMP_RESPONSE=$(mktemp)

# Call API in streaming mode and process each line
curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Accept: text/event-stream" \
    -H "Connection: keep-alive" \
    -N \
    -d "$REQUEST_BODY" \
    "$API_URL" > "$TEMP_RESPONSE" &

CURL_PID=$!

# Initialize current event
current_event=""

while kill -0 $CURL_PID 2>/dev/null; do
    if [ -s "$TEMP_RESPONSE" ]; then
        while IFS= read -r line; do
            if [[ $line == event:* ]]; then
                current_event=$(echo "$line" | cut -d' ' -f2)
            elif [[ $line == data:* ]]; then
                json_data=$(echo "$line" | sed 's/^data: //')

                case $current_event in
                    "started")
                        log "Analysis started..."
                        ;;
                    "progress")
                        current=$(echo "$json_data" | grep -o '"current":[0-9]*' | cut -d':' -f2)
                        total=$(echo "$json_data" | grep -o '"total":[0-9]*' | cut -d':' -f2)
                        issue_key=$(echo "$json_data" | grep -o '"currentIssueKey":"[^"]*"' | cut -d'"' -f4)
                        message=$(echo "$json_data" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
                        log "Progress: $current/$total - $message ($issue_key)"
                        ;;
                    "issueProcessed")
                        issue_key=$(echo "$json_data" | grep -o '"issueKey":"[^"]*"' | cut -d'"' -f4)
                        status=$(echo "$json_data" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
                        type=$(echo "$json_data" | grep -o '"issueType":"[^"]*"' | cut -d'"' -f4)
                        severity=$(echo "$json_data" | grep -o '"severity":"[^"]*"' | cut -d'"' -f4)
                        component=$(echo "$json_data" | grep -o '"component":"[^"]*"' | cut -d'"' -f4)
                        line=$(echo "$json_data" | grep -o '"line":[0-9]*' | cut -d':' -f2)

                        log "Issue Processed: $issue_key | $type ($severity) @ $component:$line"
                        ;;
                    "error")
                        message=$(echo "$json_data" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
                        log "Error: $message"
                        ;;
                    "complete")
                        total_issues=$(echo "$json_data" | grep -o '"totalIssues":[0-9]*' | cut -d':' -f2)
                        analyzed_issues=$(echo "$json_data" | grep -o '"analyzedIssues":[0-9]*' | cut -d':' -f2)
                        log "=== Analysis Complete ==="
                        log "Total Issues: $total_issues | Analyzed: $analyzed_issues"
                        ;;
                    *)
                        log "Unknown event: $current_event"
                        ;;
                esac
            fi
        done < "$TEMP_RESPONSE"
        > "$TEMP_RESPONSE"
    fi
    sleep 0.5
done

wait $CURL_PID || true
CURL_EXIT_CODE=$?

# Clean up temporary file
rm -f "$TEMP_RESPONSE"

if [ $CURL_EXIT_CODE -ne 0 ]; then
    handle_error "Failed to call API (Exit code: $CURL_EXIT_CODE)"
fi

# Create results directory
log "=== Creating Results Directory ==="
mkdir -p "${WORKSPACE}/results"
log "Created directory: ${WORKSPACE}/results"

# Download zip file
log "=== Downloading Results Zip ==="
log "Downloading from: ${RESULTS_URL}"
curl -L -o "${WORKSPACE}/results.zip" "${RESULTS_URL}" || handle_error "Failed to download results zip"

# Check zip file existence and size
if [ ! -f "${WORKSPACE}/results.zip" ] || [ ! -s "${WORKSPACE}/results.zip" ]; then
    handle_error "results.zip is empty or does not exist"
fi

ZIP_SIZE=$(du -h "${WORKSPACE}/results.zip" | cut -f1)
log "Zip file size: $ZIP_SIZE"

# Check zip contents
log "=== Checking Zip Contents ==="
log "Zip file contents:"
unzip -l "${WORKSPACE}/results.zip" || handle_error "Failed to list zip contents"

# Extract zip file
log "=== Extracting Zip File ==="
log "Extracting to: ${WORKSPACE}"
unzip -o "${WORKSPACE}/results.zip" -d "${WORKSPACE}" || handle_error "Failed to extract zip file"

# Clean up zip file
log "=== Cleaning Up ==="
rm -f "${WORKSPACE}/results.zip"
log "Removed results.zip"

# Check results directory
if [ ! -d "${WORKSPACE}/results" ]; then
    handle_error "Results directory was not created"
fi

log "=== Job Complete ==="
TOTAL_REPORTS=$(find "${WORKSPACE}/results" -type f -name "*.html" | wc -l)
log "Total reports processed: $TOTAL_REPORTS"
log "Results directory: ${WORKSPACE}/results"

exit 0