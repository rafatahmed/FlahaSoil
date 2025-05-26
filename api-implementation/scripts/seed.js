const { seedDatabase, disconnectDatabase } = require('../src/config/database');

async function main() {
  try {
    console.log('🌱 Starting database seeding...');
    await seedDatabase();
    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

main();
