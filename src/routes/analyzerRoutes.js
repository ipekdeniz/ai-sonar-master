const express = require('express');
const router = express.Router();
const sonarService = require('../services/sonarService');
const ollamaService = require('../services/ollamaService');
const { writeFile, getIssueDirectory } = require('../utils/fileUtils');
const { generateHtmlTemplate } = require('../utils/htmlUtils');
const { VALID_ISSUE_TYPES } = require('../config/constants');

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
    try {
        const { projectKey, issueKey, issueTypes = VALID_ISSUE_TYPES } = req.body;

        if (!projectKey) {
            return res.status(400).json({ error: 'Project key is required' });
        }

        let issues = [];
        if (issueKey) {
            // Sadece tek bir issue getir
            const issue = await sonarService.getIssue(issueKey);
            issues = issue ? [issue] : [];
        } else {
            // Tip filtresi varsa ona göre, yoksa hepsini getir
            issues = await sonarService.getIssues(projectKey, issueTypes);
        }

        const results = [];
        for (const issue of issues) {
            try {
                const solution = await ollamaService.analyzeIssue(issue);
                const issueDir = getIssueDirectory(projectKey, issue.key);

                await writeFile(`${issueDir}/solution.md`, solution);
                const htmlContent = generateHtmlTemplate(issue, solution);
                await writeFile(`${issueDir}/report.html`, htmlContent);

                results.push({
                    key: issue.key,
                    type: issue.type,
                    severity: issue.severity,
                    message: issue.message,
                    solution: solution
                });
            } catch (error) {
                results.push({ key: issue.key, error: error.message });
            }
        }

        res.json({
            projectKey,
            totalIssues: issues.length,
            analyzedIssues: results.length,
            results
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 