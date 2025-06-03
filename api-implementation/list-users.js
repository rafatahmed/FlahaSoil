const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        tier: true,
        name: true,
        emailVerified: true
      }
    });
    
    console.log('📋 Available Users:');
    users.forEach(user => {
      console.log(`   • ${user.email} - ${user.tier} - ${user.name || 'No name'} - Verified: ${user.emailVerified}`);
    });
  } catch (error) {
    console.error('❌ Error listing users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
