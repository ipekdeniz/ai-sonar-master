const axios = require('axios');

class OllamaService {
    constructor() {
        this.client = axios.create({
            baseURL: process.env.OLLAMA_URL
        });
    }

    async analyzeIssue(issue) {
        try {
            const prompt = this.buildPrompt(issue);
            const response = await this.client.post('/api/generate', {
                model: process.env.OLLAMA_MODEL,
                prompt: prompt,
                stream: false
            });

            return response.data.response;
        } catch (error) {
            console.error('Error analyzing issue with Ollama:', error.message);
            throw error;
        }
    }

    buildPrompt(issue) {
        return `
Analyze this Sonar issue and provide a detailed solution:

Issue Type: ${issue.type}
Severity: ${issue.severity}
Message: ${issue.message}
Component: ${issue.component}
Line: ${issue.line}

Please provide:
1. A detailed explanation of the issue
2. A step-by-step solution
3. Code examples showing how to fix the issue
4. Best practices to prevent similar issues

Format your response with markdown code blocks for code examples.
`;
    }
}

module.exports = new OllamaService(); 