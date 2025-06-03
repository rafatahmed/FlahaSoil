/** @format */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkSaturatedConductivity() {
	try {
		console.log("🔍 Checking saturatedConductivity field in database...");

		const analysis = await prisma.soilAnalysis.findFirst({
			where: { userId: "cmb9gnmgj000013l9lo1toam7" },
			select: {
				id: true,
				sand: true,
				clay: true,
				saturatedConductivity: true,
				saturation: true,
				createdAt: true,
			},
		});

		console.log("📊 Sample analysis with saturatedConductivity:");
		console.log(JSON.stringify(analysis, null, 2));

		// Get recent analyses to check saturatedConductivity
		const recentAnalyses = await prisma.soilAnalysis.findMany({
			where: { userId: "cmb9gnmgj000013l9lo1toam7" },
			select: {
				id: true,
				saturatedConductivity: true,
				createdAt: true,
			},
			orderBy: { createdAt: "desc" },
			take: 5,
		});

		console.log("📈 Recent analyses:");
		recentAnalyses.forEach((analysis, index) => {
			console.log(`   ${index + 1}. ID: ${analysis.id.substring(0, 8)}...`);
			console.log(`      Ksat: ${analysis.saturatedConductivity || "NULL"}`);
			console.log(`      Date: ${analysis.createdAt}`);
			console.log("");
		});
	} catch (error) {
		console.error("❌ Error:", error.message);
	} finally {
		await prisma.$disconnect();
	}
}

checkSaturatedConductivity();
