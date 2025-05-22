const sonarService = require('./sonarService');
const ollamaService = require('./ollamaService');
const { writeResultToFile, cleanProjectDirectory } = require('../utils/fileUtils');

/**
 * Analyzes Sonar issues and generates reports
 * @param {string} projectKey - Sonar project key
 * @param {string} [issueKey] - Optional specific issue key to analyze
 * @param {string[]} [issueTypes] - Optional array of issue types to analyze
 * @param {Function} [onProgress] - Optional callback for progress updates
 * @returns {Promise<Object>} Analysis results
 */
async function analyzeIssues(projectKey, issueKey, issueTypes, onProgress) {
    try {
        // Validate projectKey
        if (!projectKey) {
            throw new Error('Project key is required');
        }

        // Clean results directory for the project
        cleanProjectDirectory();

        // Get issues from Sonar based on query parameters
        console.log('Fetching issues...');
        let issues = [];

        if (issueKey) {
            // If issueKey is provided, search for specific issue
            console.log(`Searching for specific issue: ${issueKey}`);
            issues = await sonarService.getSonarIssues(projectKey, [], issueKey);
        } else if (issueTypes && issueTypes.length > 0) {
            // If issueTypes are provided, search by types
            console.log(`Searching for issues with types: ${issueTypes.join(', ')}`);
            issues = await sonarService.getSonarIssues(projectKey, issueTypes);
        } else {
            // If no specific filters, get all issues for the project
            console.log('Searching for all issues in project');
            issues = await sonarService.getSonarIssues(projectKey);
        }

        console.log(`Found ${issues.length} issues`);
        
        if (issues.length === 0) {
            return {
                totalIssues: 0,
                analyzedIssues: 0,
                errors: [],
                message: 'No issues found for the given criteria'
            };
        }

        let analyzedCount = 0;
        const errors = [];

        // Analyze each issue separately
        for (const issue of issues) {
            try {
                console.log(`Processing issue: ${issue.key}`);
                
                // Send progress update
                if (onProgress) {
                    const finalMessage = issue.message.replace(/"/g, "'");
                    
                    // Send progress event
                    onProgress({
                        type: 'progress',
                        current: analyzedCount + 1,
                        total: issues.length,
                        currentIssueKey: issue.key,
                        message: `Analyzing issue: ${finalMessage}`
                    });
                }

                // Get solution from Ollama
                const solution = await ollamaService.getOllamaSolution(issue);
                console.log(`Got solution for issue: ${issue.key}`);

                // Add solution to the issue
                issue.solution = solution;

                // Generate and save reports
                await writeResultToFile(projectKey, issue, solution);
                
                // Send issue processed event
                if (onProgress) {
                    onProgress({
                        type: 'issueProcessed',
                        issueKey: issue.key,
                        status: issue.status,
                        issueType: issue.type,
                        severity: issue.severity,
                        component: issue.component,
                        line: issue.line
                    });
                }
                
                console.log(`Issue processed: ${issue.key}`);
                analyzedCount++;
            } catch (error) {
                console.error(`Error processing issue ${issue.key}:`, error);
                errors.push({
                    issueKey: issue.key,
                    error: error.message
                });
            }
        }

        return {
            totalIssues: issues.length,
            analyzedIssues: analyzedCount,
            errors: errors,
            message: `Completed analyzing ${analyzedCount} out of ${issues.length} issues`
        };
    } catch (error) {
        console.error('Error in analyzeIssues:', error);
        throw error;
    }
}

module.exports = {
    analyzeIssues
}; 