/** @format */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createTestUser() {
	try {
		const hashedPassword = await bcrypt.hash("Test123!@#", 10);

		const user = await prisma.user.upsert({
			where: { email: "professional@test.com" },
			update: {
				tier: "PROFESSIONAL",
				password: hashedPassword,
			},
			create: {
				email: "professional@test.com",
				name: "Test Professional User",
				password: hashedPassword,
				tier: "PROFESSIONAL",
				emailVerified: true,
			},
		});

		console.log(
			"✅ Test user created/updated:",
			user.email,
			"Tier:",
			user.tier
		);
	} catch (error) {
		console.error("❌ Error creating test user:", error);
	} finally {
		await prisma.$disconnect();
	}
}

createTestUser();
