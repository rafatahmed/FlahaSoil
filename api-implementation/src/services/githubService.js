const crypto = require('crypto');
const fetch = require('node-fetch');

class GitHubService {
    constructor() {
        this.token = process.env.GITHUB_TOKEN;
        this.webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
        this.repoOwner = process.env.GITHUB_REPO_OWNER;
        this.repoName = process.env.GITHUB_REPO_NAME;
        this.baseURL = 'https://api.github.com';
    }

    /**
     * Verify GitHub webhook signature
     */
    verifyWebhookSignature(payload, signature) {
        if (!this.webhookSecret) {
            throw new Error('GitHub webhook secret not configured');
        }

        const expectedSignature = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(payload)
            .digest('hex');

        const actualSignature = signature.replace('sha256=', '');
        
        return crypto.timingSafeEqual(
            Buffer.from(expectedSignature, 'hex'),
            Buffer.from(actualSignature, 'hex')
        );
    }

    /**
     * Make authenticated GitHub API request
     */
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'FlahaSoil-App',
            ...options.headers
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`GitHub API error: ${response.status} - ${error}`);
        }

        return response.json();
    }

    /**
     * Create a new issue
     */
    async createIssue(title, body, labels = [], assignees = []) {
        const endpoint = `/repos/${this.repoOwner}/${this.repoName}/issues`;
        
        return this.makeRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify({
                title,
                body,
                labels,
                assignees
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Update an existing issue
     */
    async updateIssue(issueNumber, updates) {
        const endpoint = `/repos/${this.repoOwner}/${this.repoName}/issues/${issueNumber}`;
        
        return this.makeRequest(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(updates),
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Get repository information
     */
    async getRepository() {
        const endpoint = `/repos/${this.repoOwner}/${this.repoName}`;
        return this.makeRequest(endpoint);
    }

    /**
     * Get issues from repository
     */
    async getIssues(state = 'open', labels = null, page = 1, perPage = 30) {
        let endpoint = `/repos/${this.repoOwner}/${this.repoName}/issues?state=${state}&page=${page}&per_page=${perPage}`;
        
        if (labels) {
            endpoint += `&labels=${labels}`;
        }
        
        return this.makeRequest(endpoint);
    }

    /**
     * Create a pull request
     */
    async createPullRequest(title, head, base, body = '') {
        const endpoint = `/repos/${this.repoOwner}/${this.repoName}/pulls`;
        
        return this.makeRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify({
                title,
                head,
                base,
                body
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Get commits from repository
     */
    async getCommits(sha = null, path = null, page = 1, perPage = 30) {
        let endpoint = `/repos/${this.repoOwner}/${this.repoName}/commits?page=${page}&per_page=${perPage}`;
        
        if (sha) {
            endpoint += `&sha=${sha}`;
        }
        
        if (path) {
            endpoint += `&path=${path}`;
        }
        
        return this.makeRequest(endpoint);
    }

    /**
     * Process webhook events
     */
    async processWebhook(event, payload) {
        console.log(`Processing GitHub webhook: ${event}`);
        
        switch (event) {
            case 'issues':
                return this.handleIssueEvent(payload);
            case 'pull_request':
                return this.handlePullRequestEvent(payload);
            case 'push':
                return this.handlePushEvent(payload);
            case 'release':
                return this.handleReleaseEvent(payload);
            default:
                console.log(`Unhandled GitHub event: ${event}`);
                return { processed: false, event };
        }
    }

    /**
     * Handle issue events
     */
    async handleIssueEvent(payload) {
        const { action, issue } = payload;
        
        console.log(`Issue ${action}: #${issue.number} - ${issue.title}`);
        
        // You can add custom logic here, such as:
        // - Notifying team members
        // - Creating Linear tickets
        // - Updating project status
        
        return {
            processed: true,
            action,
            issue: {
                number: issue.number,
                title: issue.title,
                state: issue.state
            }
        };
    }

    /**
     * Handle pull request events
     */
    async handlePullRequestEvent(payload) {
        const { action, pull_request } = payload;
        
        console.log(`Pull Request ${action}: #${pull_request.number} - ${pull_request.title}`);
        
        return {
            processed: true,
            action,
            pullRequest: {
                number: pull_request.number,
                title: pull_request.title,
                state: pull_request.state
            }
        };
    }

    /**
     * Handle push events
     */
    async handlePushEvent(payload) {
        const { ref, commits } = payload;
        
        console.log(`Push to ${ref}: ${commits.length} commits`);
        
        return {
            processed: true,
            ref,
            commitCount: commits.length
        };
    }

    /**
     * Handle release events
     */
    async handleReleaseEvent(payload) {
        const { action, release } = payload;
        
        console.log(`Release ${action}: ${release.tag_name}`);
        
        return {
            processed: true,
            action,
            release: {
                tagName: release.tag_name,
                name: release.name
            }
        };
    }

    /**
     * Get integration status
     */
    async getStatus() {
        try {
            const repo = await this.getRepository();
            return {
                connected: true,
                repository: {
                    name: repo.name,
                    fullName: repo.full_name,
                    private: repo.private,
                    stars: repo.stargazers_count,
                    forks: repo.forks_count
                }
            };
        } catch (error) {
            return {
                connected: false,
                error: error.message
            };
        }
    }
}

module.exports = GitHubService;
