/**
 * Script to check existing users and their authentication details
 *
 * @format
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function checkUsers() {
	try {
		console.log("🔍 Checking users in database...\n");

		// Get all users
		const users = await prisma.user.findMany({
			select: {
				id: true,
				email: true,
				name: true,
				tier: true,
				usageCount: true,
				emailVerified: true,
				planSelectedAt: true,
				createdAt: true,
				password: true, // We'll check if password exists
			},
		});

		if (users.length === 0) {
			console.log("❌ No users found in database");
			return;
		}

		console.log(`📊 Found ${users.length} users:\n`);

		for (const user of users) {
			console.log(`👤 User: ${user.email}`);
			console.log(`   - Name: ${user.name}`);
			console.log(`   - Tier: ${user.tier}`);
			console.log(`   - Usage: ${user.usageCount}`);
			console.log(`   - Email Verified: ${user.emailVerified}`);
			console.log(`   - Has Password: ${user.password ? "Yes" : "No"}`);
			console.log(`   - Created: ${user.createdAt}`);
			console.log(`   - Plan Selected: ${user.planSelectedAt || "Not set"}`);
			console.log("");
		}

		// Check if the specific users we need exist
		const requiredUsers = [
			"demo@flahasoil.com",
			"pro@flahasoil.com",
			"enterprise@flahasoil.com",
		];

		console.log("🎯 Checking required users:");
		for (const email of requiredUsers) {
			const user = users.find((u) => u.email === email);
			if (user) {
				console.log(`✅ ${email} - EXISTS (${user.tier})`);
			} else {
				console.log(`❌ ${email} - MISSING`);
			}
		}
	} catch (error) {
		console.error("❌ Error checking users:", error);
		console.error("Full error:", error.message);
	} finally {
		await prisma.$disconnect();
		console.log("\n🔌 Database connection closed");
	}
}

// Run the script
checkUsers();
