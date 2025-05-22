const fs = require('fs');
const path = require('path');
const { PATHS } = require('../config/constants');
const { generateHtmlTemplate } = require('./htmlUtils');

function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function getIssueDirectory(projectKey, issueKey) {
    // Directory for issue details
    const dirPath =  path.join(PATHS.RESULTS_DIR, projectKey, issueKey);
    ensureDirectoryExists(dirPath);
    return dirPath;
}

/**
 * Cleans and recreates project directory
 * @param {string} projectKey - Sonar project key
 * @returns {void}
 */
function cleanProjectDirectory() {
    const resultsDir = PATHS.RESULTS_DIR;
    if (fs.existsSync(resultsDir)) {
        console.log('Removing existing directory:', resultsDir);
        fs.rmSync(resultsDir, { recursive: true, force: true });
    }
    
    // Create fresh directory
    console.log('Creating fresh directory:', resultsDir);
    fs.mkdirSync(resultsDir, { recursive: true });
}

/**
 * Writes analysis result to a file
 * @param {string} projectKey - Sonar project key
 * @param {Object} issue - Sonar issue object
 * @param {string} solution - AI-generated solution
 * @returns {Promise<void>}
 */
async function writeResultToFile(projectKey, issue, solution) {
    try {
        // Get directory for this issue
        const dirPath = getIssueDirectory(projectKey, issue.key);
        
        // Generate HTML content
        const htmlContent = generateHtmlTemplate(projectKey, issue, solution);
        
        // Write HTML file
        const filePath = path.join(dirPath, 'report.html');
        await fs.promises.writeFile(filePath, htmlContent, 'utf8');
        
        console.log(`Report written to: ${filePath}`);
    } catch (error) {
        console.error('Error writing result to file:', error);
        throw error;
    }
}

module.exports = {
    ensureDirectoryExists,
    getIssueDirectory,
    writeResultToFile,
    cleanProjectDirectory
}; 