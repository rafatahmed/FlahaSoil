const { PrismaClient } = require('@prisma/client');

// Create Prisma client instance
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Database connection helper
async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
  }
}

// Health check
async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error.message, 
      timestamp: new Date().toISOString() 
    };
  }
}

// Database seeding for development
async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...');
    
    // Create sample users
    const sampleUsers = [
      {
        email: 'demo@flahasoil.com',
        name: 'Demo User',
        password: 'demo123', // In production, this would be hashed
        tier: 'FREE'
      },
      {
        email: 'pro@flahasoil.com',
        name: 'Professional User',
        password: 'pro123',
        tier: 'PROFESSIONAL'
      },
      {
        email: 'enterprise@flahasoil.com',
        name: 'Enterprise User',
        password: 'enterprise123',
        tier: 'ENTERPRISE'
      }
    ];
    
    for (const userData of sampleUsers) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      if (!existingUser) {
        await prisma.user.create({
          data: userData
        });
        console.log(`✅ Created user: ${userData.email}`);
      }
    }
    
    // Create sample soil analyses
    const demoUser = await prisma.user.findUnique({
      where: { email: 'demo@flahasoil.com' }
    });
    
    if (demoUser) {
      const sampleAnalyses = [
        {
          userId: demoUser.id,
          sand: 33,
          clay: 33,
          silt: 34,
          organicMatter: 2.5,
          densityFactor: 1.0,
          fieldCapacity: 28.5,
          wiltingPoint: 12.3,
          plantAvailableWater: 16.2,
          saturation: 47.8,
          saturatedConductivity: 15.2,
          textureClass: 'Loam',
          calculationSource: 'api'
        },
        {
          userId: demoUser.id,
          sand: 60,
          clay: 15,
          silt: 25,
          organicMatter: 1.8,
          densityFactor: 1.1,
          fieldCapacity: 18.2,
          wiltingPoint: 8.1,
          plantAvailableWater: 10.1,
          saturation: 42.3,
          saturatedConductivity: 45.7,
          textureClass: 'Sandy Loam',
          calculationSource: 'api'
        }
      ];
      
      for (const analysis of sampleAnalyses) {
        await prisma.soilAnalysis.create({
          data: analysis
        });
      }
      console.log(`✅ Created sample soil analyses`);
    }
    
    console.log('🌱 Database seeding completed');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

// Analytics helpers
async function getUsageStats(timeframe = '7d') {
  try {
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    const [totalUsers, activeUsers, totalAnalyses, recentAnalyses] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          usageRecords: {
            some: {
              timestamp: {
                gte: startDate
              }
            }
          }
        }
      }),
      prisma.soilAnalysis.count(),
      prisma.soilAnalysis.count({
        where: {
          createdAt: {
            gte: startDate
          }
        }
      })
    ]);
    
    return {
      timeframe,
      totalUsers,
      activeUsers,
      totalAnalyses,
      recentAnalyses,
      period: {
        start: startDate,
        end: now
      }
    };
    
  } catch (error) {
    console.error('Error getting usage stats:', error);
    throw error;
  }
}

module.exports = {
  prisma,
  connectDatabase,
  disconnectDatabase,
  checkDatabaseHealth,
  seedDatabase,
  getUsageStats
};
