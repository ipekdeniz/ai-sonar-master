const axios = require('axios');

class SonarService {
    constructor() {
        this.client = axios.create({
            baseURL: process.env.SONAR_URL,
            auth: {
                username: process.env.SONAR_TOKEN,
                password: ''
            }
        });
    }

    async getIssues(projectKey, issueTypes) {
        try {
            const response = await this.client.get('/api/issues/search', {
                params: {
                    componentKeys: projectKey,
                    types: issueTypes.join(','),
                    statuses: 'OPEN,CONFIRMED,REOPENED',
                    ps: 100
                }
            });

            return response.data.issues;
        } catch (error) {
            console.error('Error fetching Sonar issues:', error.message);
            throw error;
        }
    }

    async getIssue(issueKey) {
        try {
            const response = await this.client.get('/api/issues/search', {
                params: {
                    issues: issueKey,
                    statuses: 'OPEN,CONFIRMED,REOPENED'
                }
            });
            if (response.data.issues && response.data.issues.length > 0) {
                return response.data.issues[0];
            }
            throw new Error(`Issue with key ${issueKey} not found`);
        } catch (error) {
            console.error('Error fetching Sonar issue:', error.message);
            throw error;
        }
    }
}

module.exports = new SonarService(); 