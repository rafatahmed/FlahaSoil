/**
 * One-time script to reset usage count for all users
 * Run this script when you need to reset usage counts during development/testing
 *
 * @format
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function resetAllUsageCounts() {
	try {
		console.log("🔄 Checking database connection...");

		// First, check if there are any users
		const userCount = await prisma.user.count();
		console.log(`📊 Found ${userCount} users in database`);

		if (userCount === 0) {
			console.log("ℹ️  No users found in database. Nothing to reset.");
			return;
		}

		// Show current user stats before reset
		const usersBefore = await prisma.user.findMany({
			select: {
				id: true,
				email: true,
				name: true,
				tier: true,
				usageCount: true,
				usageResetDate: true,
			},
		});

		console.log("\n📊 Current user stats BEFORE reset:");
		usersBefore.forEach((user) => {
			console.log(`- ${user.email} (${user.tier}): ${user.usageCount} uses`);
		});

		console.log("\n🔄 Resetting usage counts for all users...");

		// Reset usage count to 0 for all users
		const result = await prisma.user.updateMany({
			data: {
				usageCount: 0,
				usageResetDate: new Date(),
			},
		});

		console.log(`✅ Successfully reset usage count for ${result.count} users`);

		// Show current user stats after reset
		const usersAfter = await prisma.user.findMany({
			select: {
				id: true,
				email: true,
				name: true,
				tier: true,
				usageCount: true,
				usageResetDate: true,
			},
		});

		console.log("\n📊 Current user stats AFTER reset:");
		usersAfter.forEach((user) => {
			console.log(`- ${user.email} (${user.tier}): ${user.usageCount} uses`);
		});
	} catch (error) {
		console.error("❌ Error resetting usage counts:", error);
		console.error("Full error:", error.message);
	} finally {
		await prisma.$disconnect();
		console.log("🔌 Database connection closed");
	}
}

// Run the script
resetAllUsageCounts();
