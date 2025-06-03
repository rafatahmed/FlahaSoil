const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserAnalyses() {
  try {
    // Find the professional user
    const user = await prisma.user.findUnique({
      where: { email: 'pro@flahasoil.com' }
    });
    
    if (!user) {
      console.log('❌ Professional user not found');
      return;
    }
    
    console.log('✅ Professional user found:', user.id);
    console.log('   Name:', user.name);
    console.log('   Tier:', user.tier);
    console.log('');
    
    // Check soil analyses for this user
    const analyses = await prisma.soilAnalysis.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log('📊 Soil analyses count:', analyses.length);
    console.log('');
    
    if (analyses.length > 0) {
      console.log('📋 Latest analyses:');
      analyses.forEach((analysis, index) => {
        console.log(`  ${index + 1}. ID: ${analysis.id}`);
        console.log(`     Sand: ${analysis.sand}%, Clay: ${analysis.clay}%, Silt: ${analysis.silt}%`);
        console.log(`     Texture: ${analysis.textureClass || 'N/A'}`);
        console.log(`     Field Capacity: ${analysis.fieldCapacity || 'N/A'}%`);
        console.log(`     Wilting Point: ${analysis.wiltingPoint || 'N/A'}%`);
        console.log(`     PAW: ${analysis.plantAvailableWater || 'N/A'}%`);
        console.log(`     Ksat: ${analysis.saturatedConductivity || 'N/A'} mm/hr`);
        console.log(`     Created: ${analysis.createdAt}`);
        console.log('');
      });
    } else {
      console.log('❌ No soil analyses found for this user');
      console.log('💡 User needs to perform a soil analysis first on index.html');
      console.log('');
      
      // Check if there are any analyses in the database at all
      const totalAnalyses = await prisma.soilAnalysis.count();
      console.log(`📈 Total analyses in database: ${totalAnalyses}`);
      
      if (totalAnalyses > 0) {
        console.log('🔍 Sample analyses from other users:');
        const sampleAnalyses = await prisma.soilAnalysis.findMany({
          take: 3,
          include: {
            user: {
              select: { email: true, name: true }
            }
          }
        });
        
        sampleAnalyses.forEach((analysis, index) => {
          console.log(`  ${index + 1}. User: ${analysis.user?.email || 'Unknown'}`);
          console.log(`     Sand: ${analysis.sand}%, Clay: ${analysis.clay}%`);
          console.log(`     Created: ${analysis.createdAt}`);
          console.log('');
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserAnalyses();
