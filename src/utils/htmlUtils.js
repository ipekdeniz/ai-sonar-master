const hljs = require('highlight.js');
const { SEVERITY_COLORS, TYPE_ICONS } = require('../config/constants');

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

function generateHtmlTemplate(issue, solution) {
    const severityColor = getSeverityColor(issue.severity);
    const typeIcon = getTypeIcon(issue.type);
    const formattedSolution = formatSolution(solution);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Issue Analysis - ${issue.key}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .issue-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .info-item {
            background: #fff;
            padding: 15px;
            border-radius: 6px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .info-item h3 {
            margin: 0 0 10px 0;
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
        }
        .info-item p {
            margin: 0;
            font-size: 1.1em;
        }
        .severity {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            color: white;
            font-weight: bold;
        }
        .solution {
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .code-block {
            background: #f6f8fa;
            border-radius: 6px;
            padding: 16px;
            overflow-x: auto;
            margin: 16px 0;
        }
        .code-block code {
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
            font-size: 14px;
            line-height: 1.5;
        }
        .hljs {
            background: transparent;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Sonar Issue Analysis</h1>
        <p>Issue Key: ${escapeHtml(issue.key)}</p>
    </div>

    <div class="issue-info">
        <div class="info-item">
            <h3>Type</h3>
            <p>${typeIcon} ${escapeHtml(issue.type)}</p>
        </div>
        <div class="info-item">
            <h3>Severity</h3>
            <p><span class="severity" style="background-color: ${severityColor}">${escapeHtml(issue.severity)}</span></p>
        </div>
        <div class="info-item">
            <h3>Component</h3>
            <p>${escapeHtml(issue.component)}</p>
        </div>
        <div class="info-item">
            <h3>Line</h3>
            <p>${issue.line || 'N/A'}</p>
        </div>
    </div>

    <div class="info-item">
        <h3>Message</h3>
        <p>${escapeHtml(issue.message)}</p>
    </div>

    <div class="solution">
        <h2>Solution</h2>
        ${formattedSolution}
    </div>
</body>
</html>`;
}

function generateHtmlReport(issue) {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Issue Report - ${escapeHtml(issue.key)}</title>
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
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .issue-key {
            font-size: 24px;
            color: #333;
            margin: 0;
        }
        .issue-type {
            color: #666;
            margin: 5px 0;
        }
        .details {
            margin: 20px 0;
        }
        .detail-item {
            margin: 10px 0;
        }
        .detail-label {
            font-weight: bold;
            color: #555;
        }
        .message {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .solution {
            background-color: #e8f5e9;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .solution p {
            color: #333;
            margin: 10px 0;
        }
        pre, code {
            background: #272822;
            color: #f8f8f2;
            padding: 10px;
            border-radius: 4px;
            font-family: 'Fira Mono', 'Consolas', 'Monaco', monospace;
            font-size: 15px;
            overflow-x: auto;
            margin: 10px 0;
        }
        .severity-high {
            color: #d32f2f;
        }
        .severity-medium {
            color: #f57c00;
        }
        .severity-low {
            color: #7cb342;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="issue-key">${escapeHtml(issue.key)}</h1>
            <p class="issue-type">Type: ${escapeHtml(issue.type)}</p>
        </div>
        
        <div class="details">
            <div class="detail-item">
                <span class="detail-label">Severity:</span>
                <span class="severity-${issue.severity ? escapeHtml(issue.severity.toLowerCase()) : ''}">${escapeHtml(issue.severity)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Component:</span>
                <span>${escapeHtml(issue.component)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Line:</span>
                <span>${escapeHtml(issue.line ? issue.line.toString() : '')}</span>
            </div>
        </div>

        <div class="message">
            <h3>Issue Message</h3>
            <p>${escapeHtml(issue.message)}</p>
        </div>

        ${issue.solution ? `
        <div class="solution">
            <h3>Proposed Solution</h3>
            ${formatSolution(issue.solution)}
        </div>
        ` : ''}
    </div>
</body>
</html>`;

    return htmlContent;
}

module.exports = {
    escapeHtml,
    formatCodeBlock,
    formatSolution,
    getSeverityColor,
    getTypeIcon,
    generateHtmlTemplate,
    generateHtmlReport
}; 