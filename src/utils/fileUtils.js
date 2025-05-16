const fs = require('fs');
const path = require('path');
const { PATHS } = require('../config/constants');

function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function getIssueDirectory(projectKey, issueKey) {
    const issueDir = path.join(PATHS.RESULTS_DIR, projectKey, issueKey);
    ensureDirectoryExists(issueDir);
    return issueDir;
}

function writeFile(filePath, content) {
    fs.writeFileSync(filePath, content);
}

module.exports = {
    ensureDirectoryExists,
    getIssueDirectory,
    writeFile
}; 