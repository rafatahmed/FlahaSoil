const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createProUser() {
  try {
    const hashedPassword = await bcrypt.hash('pro123', 10);
    
    const user = await prisma.user.upsert({
      where: { email: 'pro@flahasoil.com' },
      update: {
        tier: 'PROFESSIONAL',
        password: hashedPassword
      },
      create: {
        email: 'pro@flahasoil.com',
        name: 'Professional User',
        password: hashedPassword,
        tier: 'PROFESSIONAL',
        emailVerified: true
      }
    });
    
    console.log('✅ Pro user created/updated:', user.email, 'Tier:', user.tier);
  } catch (error) {
    console.error('❌ Error creating pro user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createProUser();
