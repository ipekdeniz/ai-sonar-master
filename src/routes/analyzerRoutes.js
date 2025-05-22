const express = require('express');
const router = express.Router();
const analyzerService = require('../services/analyzerService');
const { PATHS } = require('../config/constants');
const archiver = require('archiver');
const fs = require('fs');

/**
 * Sends an event to the client through the event stream
 * @param {Response} res - Express response object
 * @param {object} data - Event data
 */
function sendEvent(res, data) {
    try {
        // Extract event type
        const eventType = data.type;
        
        // Send proper SSE format with event and data
        res.write(`event: ${eventType}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
        console.error('Error sending event:', error);
    }
}

/**
 * @swagger
 * /api/analyze:
 *   post:
 *     summary: Analyze Sonar issues
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnalyzeRequest'
 *     responses:
 *       200:
 *         description: Analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalyzeResponse'
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/analyze', async (req, res) => {
    const { projectKey, issueKey, issueTypes } = req.body;
    
    if (!projectKey) {
        return res.status(400).json({ error: 'Project key is required' });
    }

    try {
        // Set headers for streaming response
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        // Send initial response
        sendEvent(res, { type: 'started' });

        // Convert issueTypes to array if it's a string
        const issueTypesArray = typeof issueTypes === 'string' ? 
            issueTypes.split(',').map(type => type.trim()) : 
            Array.isArray(issueTypes) ? issueTypes : [];

        // Start analysis with progress callback
        const result = await analyzerService.analyzeIssues(
            projectKey, 
            issueKey, 
            issueTypesArray,
            (eventData) => {
                // Send all event types directly
                sendEvent(res, eventData);
            }
        );

        // Send final information when process is complete
        sendEvent(res, {
            type: 'complete',
            ...result
        });

        // Give some time for events to be transmitted
        setTimeout(() => {
            res.end();
        }, 1000);
    } catch (error) {
        console.error('Error in analyze endpoint:', error);
        sendEvent(res, {
            type: 'error',
            message: error.message
        });
        
        // End response after a short delay
        setTimeout(() => {
            res.end();
        }, 1000);
    }
});

/**
 * @swagger
 * /api/results.zip:
 *   get:
 *     summary: Download analysis results as zip
 *     responses:
 *       200:
 *         description: Zip file containing analysis results
 *         content:
 *           application/zip:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Results not found
 *       500:
 *         description: Server error
 */
router.get('/results.zip', (req, res) => {
    try {
        // Check if results directory exists
        if (!fs.existsSync(PATHS.RESULTS_DIR)) {
            console.error('Results directory does not exist:', PATHS.RESULTS_DIR);
            return res.status(404).send('Results directory not found');
        }

        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        // Error handling
        archive.on('error', (err) => {
            console.error('Archive error:', err);
            res.status(500).send('Error creating zip file');
        });

        // On zip completion
        archive.on('end', () => {
            console.log('Archive created successfully');
        });

        // When adding files to zip
        archive.on('entry', (entry) => {
            console.log('Adding file to zip:', entry.name);
        });

        res.attachment('results.zip');
        archive.pipe(res);

        // Add results directory to zip
        archive.directory(PATHS.RESULTS_DIR, 'results');

        archive.finalize();
    } catch (error) {
        console.error('Error in zip endpoint:', error);
        res.status(500).send('Error creating zip file');
    }
});

module.exports = router; 