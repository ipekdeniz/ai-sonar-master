require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const hljs = require('highlight.js');
const swaggerSpec = require('./config/swagger');
const analyzerRoutes = require('./routes/analyzerRoutes');
const { PATHS } = require('./config/constants');
const { RESULTS_DIR, STATIC_DIR } = PATHS;

const app = express();
app.use(express.json());

// Create necessary directories
[RESULTS_DIR, STATIC_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Copy highlight.js files
const highlightJsPath = path.join(__dirname, '..', 'node_modules', 'highlight.js');
const highlightJsFiles = [
    { src: 'lib/core.js', dest: 'highlight.js' },
    { src: 'styles/github.css', dest: 'github.css' }
];

highlightJsFiles.forEach(file => {
    fs.copyFileSync(
        path.join(highlightJsPath, file.src),
        path.join(STATIC_DIR, file.dest)
    );
});

// Static dosyaları serve et
app.use('/static', express.static(STATIC_DIR));

// Swagger tanımlaması
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Sonar Issue Analyzer API',
            version: '1.0.0',
            description: 'Sonar issue\'larını Ollama AI modeli ile analiz eden API',
            contact: {
                name: 'API Support'
            }
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3000}`,
                description: 'Development server'
            }
        ],
        components: {
            schemas: {
                AnalyzeRequest: {
                    type: 'object',
                    required: ['projectKey'],
                    properties: {
                        projectKey: {
                            type: 'string',
                            description: 'Sonar proje anahtarı'
                        },
                        issueTypes: {
                            type: 'array',
                            items: {
                                type: 'string',
                                enum: ['BUG', 'VULNERABILITY', 'CODE_SMELL', 'SECURITY_HOTSPOT']
                            },
                            description: 'Analiz edilecek issue tipleri (opsiyonel)'
                        }
                    }
                },
                AnalyzeResponse: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string'
                        },
                        totalIssues: {
                            type: 'integer'
                        },
                        issueTypes: {
                            type: 'string'
                        },
                        resultsDirectory: {
                            type: 'string'
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string'
                        },
                        details: {
                            type: 'string'
                        }
                    }
                }
            }
        }
    },
    apis: ['./src/index.js']
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const SONAR_URL = process.env.SONAR_URL;
const SONAR_TOKEN = process.env.SONAR_TOKEN;
const OLLAMA_URL = process.env.OLLAMA_URL;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL;

// Geçerli issue tipleri
const VALID_ISSUE_TYPES = ['BUG', 'VULNERABILITY', 'CODE_SMELL', 'SECURITY_HOTSPOT'];

// HTML karakterlerini escape et
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// HTML template oluştur
function generateHtmlTemplate(projectKey, issue, solution) {
    const severityColors = {
        'BLOCKER': '#FF0000',
        'CRITICAL': '#FF4500',
        'MAJOR': '#FFA500',
        'MINOR': '#FFD700',
        'INFO': '#90EE90'
    };

    const typeIcons = {
        'BUG': '🐛',
        'VULNERABILITY': '🔒',
        'CODE_SMELL': '👃',
        'SECURITY_HOTSPOT': '⚠️'
    };

    // Çözüm metnini formatla
    const formattedSolution = solution.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
        const trimmedCode = code.trim();
        const highlightedCode = language ? 
            hljs.highlight(trimmedCode, { language }).value :
            hljs.highlightAuto(trimmedCode).value;
        return `<pre class="code-block ${language || ''}"><code>${highlightedCode}</code></pre>`;
    });

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
            .code-example {
                margin: 15px 0;
                padding: 15px;
                background-color: #f8f9fa;
                border-radius: 4px;
                border-left: 4px solid #2c3e50;
            }
            .code-example-title {
                font-weight: bold;
                margin-bottom: 10px;
                color: #2c3e50;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${typeIcons[issue.type] || '📝'} Sonar Issue Analysis</h1>
                <p>Project: ${projectKey}</p>
            </div>
            
            <div class="issue-info">
                <h2>Issue Details</h2>
                <p>
                    <span class="badge" style="background-color: ${severityColors[issue.severity] || '#666'}">
                        ${issue.severity}
                    </span>
                    <span class="badge" style="background-color: #2c3e50">
                        ${issue.type}
                    </span>
                </p>
                <p><strong>Message:</strong> ${issue.message}</p>
                <p><strong>Component:</strong> ${issue.component}</p>
                <p><strong>Line:</strong> ${issue.line}</p>
            </div>

            <div class="solution">
                <h2>AI-Generated Solution</h2>
                <div class="solution-text">${formattedSolution}</div>
            </div>

            <div class="metadata">
                <p><strong>Issue Key:</strong> ${issue.key}</p>
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
    </html>
    `;
}

// Sonuçları dosyaya yaz
function writeResultToFile(projectKey, issue, solution) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseFileName = `${projectKey}_${issue.key}_${timestamp}`;
    
    // JSON dosyası
    const jsonFilePath = path.join(RESULTS_DIR, `${baseFileName}.json`);
    const jsonResult = {
        timestamp,
        projectKey,
        issue,
        solution
    };
    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonResult, null, 2));
    
    // HTML dosyası
    const htmlFilePath = path.join(RESULTS_DIR, `${baseFileName}.html`);
    const htmlContent = generateHtmlTemplate(projectKey, issue, solution);
    fs.writeFileSync(htmlFilePath, htmlContent);
    
    console.log(`Results written to: ${baseFileName}.json and ${baseFileName}.html`);
}

// Sonar'dan issue'ları al
async function getSonarIssues(projectKey, issueTypes = []) {
    try {
        const params = {
            componentKeys: projectKey,
            resolved: 'false',
            ps: 100
        };

        if (issueTypes && issueTypes.length > 0) {
            params.types = issueTypes.join(',');
        }

        const response = await axios.get(`${SONAR_URL}/api/issues/search`, {
            params,
            headers: {
                'Authorization': `Bearer ${SONAR_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data.issues;
    } catch (error) {
        console.error('Error fetching Sonar issues:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        throw error;
    }
}

// Ollama'ya issue'yu gönder ve çözüm önerisi al
async function getOllamaSolution(issue) {
    try {
        const prompt = `Analyze this Sonar issue and provide a solution:
        Type: ${issue.type}
        Severity: ${issue.severity}
        Message: ${issue.message}
        Component: ${issue.component}
        Line: ${issue.line}
        
        Please provide a detailed solution:`;

        console.log(`Analyzing issue: ${issue.key} - ${issue.message}`);
        const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
            model: OLLAMA_MODEL,
            prompt: prompt,
            stream: false
        });

        console.log(`Analysis completed for issue: ${issue.key}`);
        return response.data.response;
    } catch (error) {
        console.error('Error getting Ollama solution:', error.message);
        throw error;
    }
}

app.use('/api', analyzerRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Sonar URL:', SONAR_URL);
    console.log('Ollama URL:', OLLAMA_URL);
    console.log('Results will be saved in:', RESULTS_DIR);
    console.log('Valid issue types:', VALID_ISSUE_TYPES.join(', '));
    console.log('Swagger documentation available at: http://localhost:' + PORT + '/api-docs');
}); 