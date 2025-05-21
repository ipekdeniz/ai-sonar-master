const fs = require('fs');
const path = require('path');
const { PATHS } = require('../config/constants');

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

module.exports = {
    ensureDirectoryExists,
    getIssueDirectory
}; 