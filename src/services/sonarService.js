const axios = require('axios');

const SONAR_URL = process.env.SONAR_URL;
const SONAR_TOKEN = process.env.SONAR_TOKEN;

// Validate environment variables
console.log('Environment variables:');
console.log('SONAR_URL:', SONAR_URL);
console.log('SONAR_TOKEN:', SONAR_TOKEN ? '***' + SONAR_TOKEN.slice(-4) : 'not set');

/**
 * Fetches issues from SonarQube for a given project
 * @param {string} projectKey - Sonar project key
 * @param {string[]} [issueTypes] - Array of issue types to filter
 * @param {string} [issueKey] - Specific issue key to fetch
 * @returns {Promise<Array>} Array of Sonar issues
 */
async function getSonarIssues(projectKey, issueTypes = [], issueKey = null) {
    try {
        // Validate inputs
        if (!projectKey) {
            throw new Error('Project key is required');
        }

        if (!SONAR_URL) {
            throw new Error('SONAR_URL environment variable is not set');
        }

        if (!SONAR_TOKEN) {
            throw new Error('SONAR_TOKEN environment variable is not set');
        }

        const params = {
            componentKeys: projectKey,
            resolved: 'false',
            ps: 100
        };

        // Add issue types filter if provided
        if (issueTypes && issueTypes.length > 0) {
            params.types = issueTypes.join(',');
        }

        // Add issue key filter if provided
        if (issueKey) {
            params.issues = issueKey;
        }

        console.log('Fetching issues with params:', params);

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(SONAR_TOKEN + ':').toString('base64')}`
        };

        const response = await axios.get(`${SONAR_URL}/api/issues/search`, {
            params,
            headers
        });

        if (!response.data || !response.data.issues) {
            console.error('Invalid response from SonarQube:', response.data);
            throw new Error('Invalid response from SonarQube');
        }

        return response.data.issues;
    } catch (error) {
        console.error('Error fetching Sonar issues:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
            console.error('Request URL:', error.config.url);
            console.error('Request params:', error.config.params);
            console.error('Request headers:', error.config.headers);
        }
        throw error;
    }
}

module.exports = {
    getSonarIssues
}; 