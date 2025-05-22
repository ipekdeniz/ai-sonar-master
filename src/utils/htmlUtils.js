const hljs = require('highlight.js');
const { SEVERITY_COLORS, TYPE_ICONS } = require('../config/constants');

/**
 * Escapes HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatCodeBlock(code, language) {
    const trimmedCode = code.trim();
    const highlightedCode = language ? 
        hljs.highlight(trimmedCode, { language }).value :
        hljs.highlightAuto(trimmedCode).value;
    return `<pre class="code-block ${language || ''}"><code>${highlightedCode}</code></pre>`;
}

function formatSolution(solution) {
    return solution.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
        return formatCodeBlock(code, language);
    });
}

function getSeverityColor(severity) {
    return SEVERITY_COLORS[severity] || SEVERITY_COLORS.DEFAULT;
}

function getTypeIcon(type) {
    return TYPE_ICONS[type] || TYPE_ICONS.DEFAULT;
}

function generateHtmlTemplate(projectKey, issue, solution) {
    const severityColor = getSeverityColor(issue.severity);
    const typeIcon = getTypeIcon(issue.type);
    const formattedSolution = formatSolution(solution);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sonar Issue Analysis - ${issue.key}</title>
    <link rel="stylesheet" href="/static/highlight.css">
    <script src="/static/highlight.js"></script>
    <script src="/static/languages/javascript.js"></script>
    <script src="/static/languages/java.js"></script>
    <script src="/static/languages/python.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background-color: #2c3e50;
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            margin: -20px -20px 20px -20px;
        }
        .issue-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        .solution {
            background-color: #e8f4f8;
            padding: 20px;
            border-radius: 4px;
            border-left: 4px solid #2c3e50;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            color: white;
            font-size: 0.9em;
            margin-right: 10px;
        }
        .metadata {
            color: #666;
            font-size: 0.9em;
            margin-top: 20px;
        }
        .code-block {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
            margin: 15px 0;
            border: 1px solid #e1e4e8;
        }
        .code-block code {
            font-family: 'Fira Code', 'Consolas', monospace;
            font-size: 14px;
            line-height: 1.5;
        }
        .timestamp {
            color: #666;
            font-size: 0.8em;
            text-align: right;
        }
        .solution-text {
            white-space: pre-wrap;
            font-family: inherit;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${typeIcon} Sonar Issue Analysis</h1>
            <p>Project: ${escapeHtml(projectKey)}</p>
        </div>
        
        <div class="issue-info">
            <h2>Issue Details</h2>
            <p>
                <span class="badge" style="background-color: ${severityColor}">
                    ${escapeHtml(issue.severity)}
                </span>
                <span class="badge" style="background-color: #2c3e50">
                    ${escapeHtml(issue.type)}
                </span>
            </p>
            <p><strong>Message:</strong> ${escapeHtml(issue.message)}</p>
            <p><strong>Component:</strong> ${escapeHtml(issue.component)}</p>
            <p><strong>Line:</strong> ${issue.line}</p>
        </div>

        <div class="solution">
            <h2>AI-Generated Solution</h2>
            <div class="solution-text">${formattedSolution}</div>
        </div>

        <div class="metadata">
            <p><strong>Issue Key:</strong> ${escapeHtml(issue.key)}</p>
            <p><strong>Created:</strong> ${new Date(issue.creationDate).toLocaleString()}</p>
            <p class="timestamp">Analysis performed: ${new Date().toLocaleString()}</p>
        </div>
    </div>
    <script>
        document.addEventListener('DOMContentLoaded', (event) => {
            document.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        });
    </script>
</body>
</html>`;
}

module.exports = {
    escapeHtml,
    formatCodeBlock,
    formatSolution,
    getSeverityColor,
    getTypeIcon,
    generateHtmlTemplate
}; 