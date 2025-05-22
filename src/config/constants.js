const path = require('path');

const PATHS = {
    RESULTS_DIR: path.join(__dirname, '..', '..', 'results'),
    STATIC_DIR: path.join(__dirname, '..', '..', 'static')
};

const SEVERITY_COLORS = {
    BLOCKER: '#FF0000',
    CRITICAL: '#FF4500',
    MAJOR: '#FFA500',
    MINOR: '#FFD700',
    INFO: '#90EE90',
    DEFAULT: '#666666'
};

const TYPE_ICONS = {
    BUG: '🐛',
    VULNERABILITY: '🔒',
    CODE_SMELL: '👃',
    SECURITY_HOTSPOT: '⚠️',
    DEFAULT: '📝'
};

const VALID_ISSUE_TYPES = ['BUG', 'VULNERABILITY', 'CODE_SMELL', 'SECURITY_HOTSPOT'];

module.exports = {
    PATHS,
    SEVERITY_COLORS,
    TYPE_ICONS,
    VALID_ISSUE_TYPES
}; 