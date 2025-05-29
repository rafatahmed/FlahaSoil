const express = require('express');
const router = express.Router();
const GitHubService = require('../services/githubService');
const LinearService = require('../services/linearService');
const authMiddleware = require('../middleware/auth');

// Initialize services
const githubService = new GitHubService();
const linearService = new LinearService();

/**
 * @route GET /api/v1/integrations/status
 * @desc Get integration status for GitHub and Linear
 * @access Private
 */
router.get('/status', authMiddleware, async (req, res) => {
    try {
        const [githubStatus, linearStatus] = await Promise.allSettled([
            githubService.getStatus(),
            linearService.getStatus()
        ]);

        res.json({
            success: true,
            integrations: {
                github: {
                    enabled: process.env.ENABLE_GITHUB_INTEGRATION === 'true',
                    status: githubStatus.status === 'fulfilled' ? githubStatus.value : { connected: false, error: githubStatus.reason?.message }
                },
                linear: {
                    enabled: process.env.ENABLE_LINEAR_INTEGRATION === 'true',
                    status: linearStatus.status === 'fulfilled' ? linearStatus.value : { connected: false, error: linearStatus.reason?.message }
                }
            }
        });
    } catch (error) {
        console.error('Integration status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get integration status'
        });
    }
});

/**
 * @route POST /api/v1/integrations/github/webhook
 * @desc Handle GitHub webhook events
 * @access Public (but verified)
 */
router.post('/github/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const signature = req.get('X-Hub-Signature-256');
        const event = req.get('X-GitHub-Event');
        
        if (!signature || !event) {
            return res.status(400).json({ error: 'Missing required headers' });
        }

        // Verify webhook signature
        const isValid = githubService.verifyWebhookSignature(req.body, signature);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // Parse payload
        const payload = JSON.parse(req.body.toString());
        
        // Process webhook
        const result = await githubService.processWebhook(event, payload);
        
        res.json({
            success: true,
            event,
            result
        });
    } catch (error) {
        console.error('GitHub webhook error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process GitHub webhook'
        });
    }
});

/**
 * @route POST /api/v1/integrations/linear/webhook
 * @desc Handle Linear webhook events
 * @access Public (but verified)
 */
router.post('/linear/webhook', express.json(), async (req, res) => {
    try {
        const signature = req.get('Linear-Signature');
        
        if (!signature) {
            return res.status(400).json({ error: 'Missing signature header' });
        }

        // Verify webhook signature
        const payload = JSON.stringify(req.body);
        const isValid = linearService.verifyWebhookSignature(payload, signature);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // Process webhook
        const result = await linearService.processWebhook(req.body);
        
        res.json({
            success: true,
            result
        });
    } catch (error) {
        console.error('Linear webhook error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process Linear webhook'
        });
    }
});

/**
 * @route GET /api/v1/integrations/github/issues
 * @desc Get GitHub issues
 * @access Private
 */
router.get('/github/issues', authMiddleware, async (req, res) => {
    try {
        const { state = 'open', labels, page = 1, per_page = 30 } = req.query;
        
        const issues = await githubService.getIssues(state, labels, parseInt(page), parseInt(per_page));
        
        res.json({
            success: true,
            data: issues
        });
    } catch (error) {
        console.error('GitHub issues error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch GitHub issues'
        });
    }
});

/**
 * @route POST /api/v1/integrations/github/issues
 * @desc Create GitHub issue
 * @access Private
 */
router.post('/github/issues', authMiddleware, async (req, res) => {
    try {
        const { title, body, labels = [], assignees = [] } = req.body;
        
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }
        
        const issue = await githubService.createIssue(title, body, labels, assignees);
        
        res.json({
            success: true,
            data: issue
        });
    } catch (error) {
        console.error('GitHub create issue error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create GitHub issue'
        });
    }
});

/**
 * @route GET /api/v1/integrations/linear/issues
 * @desc Get Linear issues
 * @access Private
 */
router.get('/linear/issues', authMiddleware, async (req, res) => {
    try {
        const { first = 50, state } = req.query;
        
        const filter = {};
        if (state) {
            filter.state = { name: { eq: state } };
        }
        
        const issues = await linearService.getIssues(parseInt(first), filter);
        
        res.json({
            success: true,
            data: issues
        });
    } catch (error) {
        console.error('Linear issues error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch Linear issues'
        });
    }
});

/**
 * @route POST /api/v1/integrations/linear/issues
 * @desc Create Linear issue
 * @access Private
 */
router.post('/linear/issues', authMiddleware, async (req, res) => {
    try {
        const { title, description, priority = 0, labels = [] } = req.body;
        
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }
        
        const issue = await linearService.createIssue(title, description, priority, labels);
        
        res.json({
            success: true,
            data: issue
        });
    } catch (error) {
        console.error('Linear create issue error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create Linear issue'
        });
    }
});

/**
 * @route GET /api/v1/integrations/github/repository
 * @desc Get GitHub repository information
 * @access Private
 */
router.get('/github/repository', authMiddleware, async (req, res) => {
    try {
        const repository = await githubService.getRepository();
        
        res.json({
            success: true,
            data: repository
        });
    } catch (error) {
        console.error('GitHub repository error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch repository information'
        });
    }
});

/**
 * @route GET /api/v1/integrations/linear/team
 * @desc Get Linear team information
 * @access Private
 */
router.get('/linear/team', authMiddleware, async (req, res) => {
    try {
        const team = await linearService.getTeam();
        
        res.json({
            success: true,
            data: team
        });
    } catch (error) {
        console.error('Linear team error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch team information'
        });
    }
});

module.exports = router;
