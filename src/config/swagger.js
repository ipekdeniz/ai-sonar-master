const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Sonar Issue Analyzer API',
            version: '1.0.0',
            description: 'API that analyzes Sonar issues using Ollama AI model',
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
                        projectKey: { type: 'string', description: 'Sonar project key' },
                        issueKey: { type: 'string', description: 'Only analyze this issue key (optional)' },
                        issueTypes: {
                            type: 'array',
                            items: { type: 'string', enum: ['BUG', 'VULNERABILITY', 'CODE_SMELL', 'SECURITY_HOTSPOT'] },
                            description: 'Issue types to analyze (optional)'
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
    apis: ['./src/routes/*.js']
};

module.exports = swaggerJsdoc(swaggerOptions); 