const crypto = require('crypto');
const fetch = require('node-fetch');

class LinearService {
    constructor() {
        this.apiKey = process.env.LINEAR_API_KEY;
        this.webhookSecret = process.env.LINEAR_WEBHOOK_SECRET;
        this.teamId = process.env.LINEAR_TEAM_ID;
        this.baseURL = 'https://api.linear.app/graphql';
    }

    /**
     * Verify Linear webhook signature
     */
    verifyWebhookSignature(payload, signature) {
        if (!this.webhookSecret) {
            throw new Error('Linear webhook secret not configured');
        }

        const expectedSignature = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(payload)
            .digest('hex');

        return crypto.timingSafeEqual(
            Buffer.from(expectedSignature, 'hex'),
            Buffer.from(signature, 'hex')
        );
    }

    /**
     * Make authenticated Linear GraphQL request
     */
    async makeRequest(query, variables = {}) {
        const response = await fetch(this.baseURL, {
            method: 'POST',
            headers: {
                'Authorization': this.apiKey,
                'Content-Type': 'application/json',
                'User-Agent': 'FlahaSoil-App'
            },
            body: JSON.stringify({
                query,
                variables
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Linear API error: ${response.status} - ${error}`);
        }

        const result = await response.json();
        
        if (result.errors) {
            throw new Error(`Linear GraphQL error: ${JSON.stringify(result.errors)}`);
        }

        return result.data;
    }

    /**
     * Create a new issue
     */
    async createIssue(title, description, priority = 0, labels = []) {
        const query = `
            mutation IssueCreate($input: IssueCreateInput!) {
                issueCreate(input: $input) {
                    success
                    issue {
                        id
                        identifier
                        title
                        description
                        priority
                        state {
                            name
                        }
                        assignee {
                            name
                            email
                        }
                        createdAt
                        updatedAt
                    }
                }
            }
        `;

        const variables = {
            input: {
                title,
                description,
                priority,
                teamId: this.teamId,
                labelIds: labels
            }
        };

        const result = await this.makeRequest(query, variables);
        return result.issueCreate;
    }

    /**
     * Update an existing issue
     */
    async updateIssue(issueId, updates) {
        const query = `
            mutation IssueUpdate($id: String!, $input: IssueUpdateInput!) {
                issueUpdate(id: $id, input: $input) {
                    success
                    issue {
                        id
                        identifier
                        title
                        description
                        priority
                        state {
                            name
                        }
                        assignee {
                            name
                            email
                        }
                        updatedAt
                    }
                }
            }
        `;

        const variables = {
            id: issueId,
            input: updates
        };

        const result = await this.makeRequest(query, variables);
        return result.issueUpdate;
    }

    /**
     * Get issues from team
     */
    async getIssues(first = 50, filter = {}) {
        const query = `
            query Issues($first: Int!, $filter: IssueFilter) {
                issues(first: $first, filter: $filter) {
                    nodes {
                        id
                        identifier
                        title
                        description
                        priority
                        state {
                            name
                            type
                        }
                        assignee {
                            name
                            email
                        }
                        labels {
                            nodes {
                                name
                                color
                            }
                        }
                        createdAt
                        updatedAt
                    }
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
                }
            }
        `;

        const variables = {
            first,
            filter: {
                team: { id: { eq: this.teamId } },
                ...filter
            }
        };

        const result = await this.makeRequest(query, variables);
        return result.issues;
    }

    /**
     * Get team information
     */
    async getTeam() {
        const query = `
            query Team($id: String!) {
                team(id: $id) {
                    id
                    name
                    key
                    description
                    members {
                        nodes {
                            id
                            name
                            email
                            active
                        }
                    }
                    states {
                        nodes {
                            id
                            name
                            type
                            color
                        }
                    }
                    labels {
                        nodes {
                            id
                            name
                            color
                            description
                        }
                    }
                }
            }
        `;

        const variables = { id: this.teamId };
        const result = await this.makeRequest(query, variables);
        return result.team;
    }

    /**
     * Get current user information
     */
    async getViewer() {
        const query = `
            query Viewer {
                viewer {
                    id
                    name
                    email
                    active
                    admin
                    teams {
                        nodes {
                            id
                            name
                            key
                        }
                    }
                }
            }
        `;

        const result = await this.makeRequest(query);
        return result.viewer;
    }

    /**
     * Process webhook events
     */
    async processWebhook(payload) {
        console.log('Processing Linear webhook:', payload.type);
        
        switch (payload.type) {
            case 'Issue':
                return this.handleIssueEvent(payload);
            case 'Comment':
                return this.handleCommentEvent(payload);
            default:
                console.log(`Unhandled Linear event: ${payload.type}`);
                return { processed: false, type: payload.type };
        }
    }

    /**
     * Handle issue events
     */
    async handleIssueEvent(payload) {
        const { action, data } = payload;
        
        console.log(`Issue ${action}: ${data.identifier} - ${data.title}`);
        
        // You can add custom logic here, such as:
        // - Creating GitHub issues
        // - Notifying team members
        // - Updating project status
        
        return {
            processed: true,
            action,
            issue: {
                id: data.id,
                identifier: data.identifier,
                title: data.title,
                state: data.state?.name
            }
        };
    }

    /**
     * Handle comment events
     */
    async handleCommentEvent(payload) {
        const { action, data } = payload;
        
        console.log(`Comment ${action} on issue: ${data.issue?.identifier}`);
        
        return {
            processed: true,
            action,
            comment: {
                id: data.id,
                body: data.body,
                issueId: data.issue?.id
            }
        };
    }

    /**
     * Get integration status
     */
    async getStatus() {
        try {
            const viewer = await this.getViewer();
            const team = await this.getTeam();
            
            return {
                connected: true,
                user: {
                    name: viewer.name,
                    email: viewer.email,
                    admin: viewer.admin
                },
                team: {
                    name: team.name,
                    key: team.key,
                    memberCount: team.members.nodes.length
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

module.exports = LinearService;
