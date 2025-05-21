const sonarService = require('./sonarService');
const ollamaService = require('./ollamaService');
const { getIssueDirectory } = require('../utils/fileUtils');
const { generateHtmlTemplate } = require('../utils/htmlUtils');
const { VALID_ISSUE_TYPES, PATHS } = require('../config/constants');
const path = require('path');
const fs = require('fs');

async function analyzeIssues(projectKey, issueKey, issueTypes) {
    try {
        // Get issues from Sonar
        const issues = await sonarService.getIssues(projectKey, issueKey, issueTypes);
        console.log(`Found ${issues.length} issues to analyze`);

        // Analyze each issue individually
        for (const issue of issues) {
            try {
                console.log(`Analyzing issue: ${issue.key}`);
                
                // Get solution from Ollama
                const solution = await ollamaService.analyzeIssue(issue);
                console.log(`Got solution for issue: ${issue.key}`);

                // Add solution to the issue
                issue.solution = solution;

                // Create report directory
                const issueDir = getIssueDirectory(projectKey, issue.key);
                fs.mkdirSync(issueDir, { recursive: true });

                // Generate and save HTML report
                const reportPath = path.join(issueDir, 'report.html');
                const htmlContent = generateHtmlTemplate(issue, solution);
                fs.writeFileSync(reportPath, htmlContent);

                console.log(`Created report for issue: ${issue.key}`);
            } catch (error) {
                console.error(`Error analyzing issue ${issue.key}:`, error);
                issue.error = error.message;
            }
        }

        return issues;
    } catch (error) {
        console.error('Error in analyzeIssues:', error);
        throw error;
    }
}

module.exports = {
    analyzeIssues
}; 