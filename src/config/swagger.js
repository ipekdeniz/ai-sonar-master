const swaggerJsdoc = require('swagger-jsdoc');

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
                        projectKey: { type: 'string', description: 'Sonar proje anahtarı' },
                        issueKey: { type: 'string', description: 'Sadece bu issue anahtarı analiz edilir (opsiyonel)' },
                        issueTypes: {
                            type: 'array',
                            items: { type: 'string', enum: ['BUG', 'VULNERABILITY', 'CODE_SMELL', 'SECURITY_HOTSPOT'] },
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
    apis: ['./src/routes/*.js']
};

module.exports = swaggerJsdoc(swaggerOptions); 