/**
 * Script to create test users for demo, professional, and enterprise tiers
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUsers() {
    try {
        console.log('🔄 Creating test users...\n');
        
        const testUsers = [
            {
                email: 'demo@flahasoil.com',
                name: 'Demo User',
                tier: 'FREE',
                password: 'demo123'
            },
            {
                email: 'pro@flahasoil.com',
                name: 'Professional User',
                tier: 'PROFESSIONAL',
                password: 'pro123'
            },
            {
                email: 'enterprise@flahasoil.com',
                name: 'Enterprise User',
                tier: 'ENTERPRISE',
                password: 'enterprise123'
            }
        ];

        for (const userData of testUsers) {
            try {
                // Check if user already exists
                const existingUser = await prisma.user.findUnique({
                    where: { email: userData.email }
                });

                if (existingUser) {
                    console.log(`⚠️  User ${userData.email} already exists - updating tier to ${userData.tier}`);
                    
                    // Update existing user's tier
                    await prisma.user.update({
                        where: { email: userData.email },
                        data: { 
                            tier: userData.tier,
                            usageCount: 0,
                            usageResetDate: new Date()
                        }
                    });
                    console.log(`✅ Updated ${userData.email} to ${userData.tier} tier\n`);
                } else {
                    // Hash password
                    const hashedPassword = await bcrypt.hash(userData.password, 12);
                    
                    // Create new user
                    const newUser = await prisma.user.create({
                        data: {
                            email: userData.email,
                            name: userData.name,
                            password: hashedPassword,
                            tier: userData.tier,
                            emailVerified: true,
                            usageCount: 0,
                            planSelectedAt: new Date(),
                            usageResetDate: new Date()
                        }
                    });
                    
                    console.log(`✅ Created user: ${userData.email} (${userData.tier})`);
                    console.log(`   - Password: ${userData.password}`);
                    console.log(`   - ID: ${newUser.id}\n`);
                }
            } catch (userError) {
                console.error(`❌ Error with user ${userData.email}:`, userError.message);
            }
        }

        // Show final user list
        console.log('📊 Final user list:');
        const allUsers = await prisma.user.findMany({
            select: {
                email: true,
                name: true,
                tier: true,
                usageCount: true,
                emailVerified: true
            }
        });

        allUsers.forEach(user => {
            console.log(`👤 ${user.email} (${user.tier}) - Usage: ${user.usageCount}`);
        });

    } catch (error) {
        console.error('❌ Error creating test users:', error);
        console.error('Full error:', error.message);
    } finally {
        await prisma.$disconnect();
        console.log('\n🔌 Database connection closed');
    }
}

// Run the script
createTestUsers();
