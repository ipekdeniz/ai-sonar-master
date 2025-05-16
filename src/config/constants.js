const path = require('path');

module.exports = {
    VALID_ISSUE_TYPES: ['BUG', 'VULNERABILITY', 'CODE_SMELL', 'SECURITY_HOTSPOT'],
    SEVERITY_COLORS: {
        'BLOCKER': '#FF0000',
        'CRITICAL': '#FF4500',
        'MAJOR': '#FFA500',
        'MINOR': '#FFD700',
        'INFO': '#90EE90'
    },
    TYPE_ICONS: {
        'BUG': '🐛',
        'VULNERABILITY': '🔒',
        'CODE_SMELL': '👃',
        'SECURITY_HOTSPOT': '⚠️'
    },
    PATHS: {
        RESULTS_DIR: path.join(__dirname, '..', '..', 'results'),
        STATIC_DIR: path.join(__dirname, '..', '..', 'static')
    }
}; 