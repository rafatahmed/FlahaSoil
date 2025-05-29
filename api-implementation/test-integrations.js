const GitHubService = require('./src/services/githubService');
const LinearService = require('./src/services/linearService');
require('dotenv').config();

async function testIntegrations() {
    console.log('🔧 Testing FlahaSoil Integrations...\n');

    // Test GitHub Integration
    console.log('📊 Testing GitHub Integration:');
    console.log('================================');
    
    const githubService = new GitHubService();
    
    try {
        // Test GitHub status
        const githubStatus = await githubService.getStatus();
        console.log('✅ GitHub Status:', JSON.stringify(githubStatus, null, 2));
        
        if (githubStatus.connected) {
            // Test getting issues
            try {
                const issues = await githubService.getIssues('open', null, 1, 5);
                console.log(`✅ GitHub Issues: Found ${issues.length} open issues`);
                
                if (issues.length > 0) {
                    console.log(`   Latest issue: #${issues[0].number} - ${issues[0].title}`);
                }
            } catch (error) {
                console.log('⚠️  GitHub Issues Error:', error.message);
            }
            
            // Test getting commits
            try {
                const commits = await githubService.getCommits(null, null, 1, 3);
                console.log(`✅ GitHub Commits: Found ${commits.length} recent commits`);
                
                if (commits.length > 0) {
                    console.log(`   Latest commit: ${commits[0].sha.substring(0, 7)} - ${commits[0].commit.message.split('\n')[0]}`);
                }
            } catch (error) {
                console.log('⚠️  GitHub Commits Error:', error.message);
            }
        }
    } catch (error) {
        console.log('❌ GitHub Integration Error:', error.message);
    }

    console.log('\n📈 Testing Linear Integration:');
    console.log('===============================');
    
    const linearService = new LinearService();
    
    try {
        // Test Linear status
        const linearStatus = await linearService.getStatus();
        console.log('✅ Linear Status:', JSON.stringify(linearStatus, null, 2));
        
        if (linearStatus.connected) {
            // Test getting issues
            try {
                const issues = await linearService.getIssues(5);
                console.log(`✅ Linear Issues: Found ${issues.nodes.length} issues`);
                
                if (issues.nodes.length > 0) {
                    console.log(`   Latest issue: ${issues.nodes[0].identifier} - ${issues.nodes[0].title}`);
                }
            } catch (error) {
                console.log('⚠️  Linear Issues Error:', error.message);
            }
            
            // Test getting team info
            try {
                const team = await linearService.getTeam();
                console.log(`✅ Linear Team: ${team.name} (${team.key}) with ${team.members.nodes.length} members`);
            } catch (error) {
                console.log('⚠️  Linear Team Error:', error.message);
            }
        }
    } catch (error) {
        console.log('❌ Linear Integration Error:', error.message);
    }

    console.log('\n🔧 Integration Configuration:');
    console.log('=============================');
    console.log('GitHub Integration Enabled:', process.env.ENABLE_GITHUB_INTEGRATION === 'true');
    console.log('Linear Integration Enabled:', process.env.ENABLE_LINEAR_INTEGRATION === 'true');
    console.log('GitHub Token Configured:', !!process.env.GITHUB_TOKEN);
    console.log('Linear API Key Configured:', !!process.env.LINEAR_API_KEY);
    console.log('GitHub Webhook Secret Configured:', !!process.env.GITHUB_WEBHOOK_SECRET);
    console.log('Linear Webhook Secret Configured:', !!process.env.LINEAR_WEBHOOK_SECRET);

    console.log('\n📋 Integration Endpoints:');
    console.log('=========================');
    console.log('Integration Status: GET /api/v1/integrations/status');
    console.log('GitHub Webhook: POST /api/v1/integrations/github/webhook');
    console.log('Linear Webhook: POST /api/v1/integrations/linear/webhook');
    console.log('GitHub Issues: GET/POST /api/v1/integrations/github/issues');
    console.log('Linear Issues: GET/POST /api/v1/integrations/linear/issues');
    console.log('GitHub Repository: GET /api/v1/integrations/github/repository');
    console.log('Linear Team: GET /api/v1/integrations/linear/team');

    console.log('\n✨ Integration Test Complete!');
    console.log('\n💡 Next Steps:');
    console.log('1. Configure GitHub Personal Access Token in .env');
    console.log('2. Configure Linear API Key in .env');
    console.log('3. Set up webhook secrets for both services');
    console.log('4. Test authenticated endpoints with valid JWT token');
    console.log('5. Configure webhook URLs in GitHub and Linear settings');
}

// Test webhook signature verification
function testWebhookSignatures() {
    console.log('\n🔐 Testing Webhook Signature Verification:');
    console.log('==========================================');
    
    const githubService = new GitHubService();
    const linearService = new LinearService();
    
    // Test GitHub signature verification
    try {
        const testPayload = '{"test": "payload"}';
        const testSecret = 'test-secret';
        
        // Temporarily set secret for testing
        githubService.webhookSecret = testSecret;
        
        const crypto = require('crypto');
        const signature = 'sha256=' + crypto.createHmac('sha256', testSecret).update(testPayload).digest('hex');
        
        const isValid = githubService.verifyWebhookSignature(testPayload, signature);
        console.log('✅ GitHub Signature Verification:', isValid ? 'PASSED' : 'FAILED');
    } catch (error) {
        console.log('❌ GitHub Signature Test Error:', error.message);
    }
    
    // Test Linear signature verification
    try {
        const testPayload = '{"test": "payload"}';
        const testSecret = 'test-secret';
        
        // Temporarily set secret for testing
        linearService.webhookSecret = testSecret;
        
        const crypto = require('crypto');
        const signature = crypto.createHmac('sha256', testSecret).update(testPayload).digest('hex');
        
        const isValid = linearService.verifyWebhookSignature(testPayload, signature);
        console.log('✅ Linear Signature Verification:', isValid ? 'PASSED' : 'FAILED');
    } catch (error) {
        console.log('❌ Linear Signature Test Error:', error.message);
    }
}

// Run tests
async function runTests() {
    try {
        await testIntegrations();
        testWebhookSignatures();
    } catch (error) {
        console.error('Test execution error:', error);
    }
}

// Execute if run directly
if (require.main === module) {
    runTests();
}

module.exports = { testIntegrations, testWebhookSignatures };
