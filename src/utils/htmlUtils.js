const hljs = require('highlight.js');
const { SEVERITY_COLORS, TYPE_ICONS } = require('../config/constants');

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
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

function generateHtmlTemplate(issue, solution) {
    const severityColor = SEVERITY_COLORS[issue.severity] || '#666';
    const typeIcon = TYPE_ICONS[issue.type] || '⚠️';
    const formattedSolution = formatSolution(solution);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sonar Issue Analysis - ${issue.key}</title>
    <link rel="stylesheet" href="/static/github.min.css">
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

    <script src="/static/highlight.js"></script>
</body>
</html>`;
}

module.exports = {
    escapeHtml,
    formatCodeBlock,
    formatSolution,
    generateHtmlTemplate
}; 