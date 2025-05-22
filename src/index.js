require('dotenv').config();

const express = require('express');
const fs = require('fs');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const analyzerRoutes = require('./routes/analyzerRoutes');
const { PATHS, VALID_ISSUE_TYPES } = require('./config/constants');
const { RESULTS_DIR, STATIC_DIR } = PATHS;

const app = express();
app.use(express.json());

// Create necessary directories
[RESULTS_DIR, STATIC_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Copy highlight.js files
const highlightJsPath = path.join(__dirname, '..', 'node_modules', 'highlight.js');
const highlightJsFiles = [
    { src: 'lib/core.js', dest: 'highlight.js' },
    { src: 'styles/github.css', dest: 'github.css' }
];

highlightJsFiles.forEach(file => {
    fs.copyFileSync(
        path.join(highlightJsPath, file.src),
        path.join(STATIC_DIR, file.dest)
    );
});

// Serve static files
app.use('/static', express.static(STATIC_DIR));
// Configure results folder for static file serving
app.use('/results', express.static(PATHS.RESULTS_DIR));

// Configure Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api', analyzerRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Sonar URL:', process.env.SONAR_URL);
    console.log('Ollama URL:', process.env.OLLAMA_URL);
    console.log('Results will be saved in:', RESULTS_DIR);
    console.log('Valid issue types:', VALID_ISSUE_TYPES.join(', '));
    console.log('Swagger documentation available at: http://localhost:' + PORT + '/api-docs');
}); 