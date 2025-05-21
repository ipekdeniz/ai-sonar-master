const express = require('express');
const router = express.Router();
const sonarService = require('../services/sonarService');
const ollamaService = require('../services/ollamaService');
const { getIssueDirectory, ensureDirectoryExists } = require('../utils/fileUtils');
const { generateHtmlReport, generateHtmlTemplate } = require('../utils/htmlUtils');
const { VALID_ISSUE_TYPES, PATHS } = require('../config/constants');
const path = require('path');
const archiver = require('archiver');
const fs = require('fs');
const { analyzeIssues } = require('../services/analyzerService');

/**
 * Sends an event to the client through the event stream
 * @param {Response} res - Express response object
 * @param {string} type - Event type
 * @param {object} data - Event data
 */
function sendEvent(res, type, data) {
    try {
        const payload = { type, ...data };
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
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
        // Clean results directory
        const resultsDir = path.join(__dirname, '../../results', projectKey);
        if (fs.existsSync(resultsDir)) {
            fs.rmSync(resultsDir, { recursive: true, force: true });
        }

        // Set headers for streaming response
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        // Send initial response
        sendEvent(res, 'started', {});

        // Get issues from Sonar
        console.log('Fetching issues...');
        const issues = await sonarService.getIssues(projectKey, issueKey, issueTypes);
        console.log(`Found ${issues.length} issues`);
        
        if (issues.length === 0) {
            sendEvent(res, 'complete', {
                totalIssues: 0,
                analyzedIssues: 0,
                errors: [],
                message: 'No issues found for the given criteria'
            });
            return res.end();
        }
        
        // Send total issue count
        sendEvent(res, 'progress', {
            current: 0,
            total: issues.length,
            currentIssueKey: issues.length > 0 ? issues[0].key : null,
            message: `Processing issue: ${issues[0].key}`
        });

        let analyzedCount = 0;
        const errors = [];

        // Analyze each issue separately
        for (const issue of issues) {
            try {
                console.log(`Processing issue: ${issue.key}`);
                
                // Get solution from Ollama
                const solution = await ollamaService.analyzeIssue(issue);
                console.log(`Got solution for issue: ${issue.key}`);

                // Add solution to the issue
                issue.solution = solution;

                // Create report directory
                const issueDir = path.join(resultsDir, issue.key);
                ensureDirectoryExists(issueDir);

                // Generate and save HTML report
                const reportPath = path.join(issueDir, 'report.html');
                const htmlContent = generateHtmlReport(issue);
                fs.writeFileSync(reportPath, htmlContent);

                // Send issue processed information
                sendEvent(res, 'issueProcessed', {
                    issueKey: issue.key,
                    status: 'success',
                    details: {
                        type: issue.type,
                        severity: issue.severity,
                        component: issue.component,
                        line: issue.line,
                        solution: solution
                    }
                });
                
                console.log(`Issue processed: ${issue.key}`);
                analyzedCount++;
            } catch (error) {
                console.error(`Error processing issue ${issue.key}:`, error);
                errors.push({
                    issueKey: issue.key,
                    error: error.message
                });

                // Send error information
                sendEvent(res, 'error', {
                    issueKey: issue.key,
                    message: error.message
                });
            }

            // Send progress information
            const nextIndex = analyzedCount < issues.length ? analyzedCount : issues.length - 1;
            const nextKey = nextIndex >= 0 && nextIndex < issues.length ? issues[nextIndex].key : null;
            
            sendEvent(res, 'progress', {
                current: analyzedCount,
                total: issues.length,
                currentIssueKey: nextKey,
                message: analyzedCount < issues.length ? 
                    `Processing issue: ${nextKey}` : 'Processing complete'
            });
        }

        // Send final information when process is complete
        sendEvent(res, 'complete', {
            totalIssues: issues.length,
            analyzedIssues: analyzedCount,
            errors: errors,
            message: `Completed analyzing ${analyzedCount} out of ${issues.length} issues`
        });

        res.end();
    } catch (error) {
        console.error('Error in analyze endpoint:', error);
        sendEvent(res, 'error', {
            message: error.message
        });
        res.end();
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