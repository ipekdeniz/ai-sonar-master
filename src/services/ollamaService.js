const axios = require('axios');

const OLLAMA_URL = process.env.OLLAMA_URL;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL;

/**
 * Gets AI-generated solution for a Sonar issue using Ollama
 * @param {Object} issue - Sonar issue object
 * @returns {Promise<string>} AI-generated solution
 */
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

module.exports = {
    getOllamaSolution
}; 