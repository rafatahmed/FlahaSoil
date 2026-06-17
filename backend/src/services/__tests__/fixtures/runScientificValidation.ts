/**
 * FlahaSOIL v2 — Phase 10C-C validation harness.
 *
 * Runs one benchmark soil through the EXACT production pipeline used by the
 * golden/matrix regressions:
 *
 *   calculateSoilTest → buildSoilTestReport → composeProfessionalReport
 *     → DefaultReportRenderer
 *
 * No scientific logic lives here — it only wires existing services against
 * an in-memory Prisma store seeded with the benchmark dataset. FLAHA_DEFAULT
 * is the implicit control: the pipeline runs in LAB mode with all engines on,
 * exactly as Phase 10C-A closed it.
 */
import type {
	ProfessionalReportDTO,
	SoilReportEnvelope,
} from "@flaha/shared-types";

import { setPrismaClientForTesting } from "../../../prisma/client";
import { calculateSoilTest } from "../../calculation.service";
import { buildSoilTestReport } from "../../report.service";
import { composeProfessionalReport } from "../../report/composeProfessionalReport";
import { DefaultReportRenderer } from "../../report/renderer";

import { createGoldenStore } from "./goldenPrismaStore";
import { GOLDEN_TS, type GoldenSoilTest } from "./goldenSoilTests";
import { ALL_BENCHMARKS, type BenchmarkSoil } from "./scientificValidationDataset";

export interface BenchmarkRunResult {
	envelope: SoilReportEnvelope;
	dto: ProfessionalReportDTO;
	html: string;
}

/** Shared context rows for every benchmark (only the lab panel varies). */
const BENCH_CONTEXT = {
	user: {
		id: "u_bench",
		email: "validation@flahasoil.test",
		displayName: "Validation Harness",
		role: "Auditor",
		createdAt: GOLDEN_TS,
		updatedAt: GOLDEN_TS,
	},
	project: {
		id: "p_bench",
		userId: "u_bench",
		name: "Scientific Validation Dataset",
		code: "BENCH",
		clientName: "FlahaSOIL Labs",
		status: "ACTIVE",
		createdAt: GOLDEN_TS,
		updatedAt: GOLDEN_TS,
	},
	sample: {
		id: "s_bench",
		userId: "u_bench",
		projectId: "p_bench",
		locationName: "Benchmark Plot",
		depthFromCm: 0,
		depthToCm: 30,
		sampleDate: GOLDEN_TS,
		createdAt: GOLDEN_TS,
		updatedAt: GOLDEN_TS,
	},
};

/** Converts a BenchmarkSoil into the GoldenSoilTest shape the store expects. */
function benchmarkToGolden(b: BenchmarkSoil): GoldenSoilTest {
	const base = {
		id: b.id,
		sampleId: "s_bench",
		testLevel: b.level,
		labName: "Benchmark Lab",
		labReference: b.id,
		testDate: GOLDEN_TS,
		createdAt: GOLDEN_TS,
		updatedAt: GOLDEN_TS,
	};
	return {
		id: b.id,
		level: b.level,
		base,
		sample: BENCH_CONTEXT.sample,
		project: BENCH_CONTEXT.project,
		user: BENCH_CONTEXT.user,
		textureInput: {
			id: `tex_${b.id}`,
			soilTestId: b.id,
			source: "LAB",
			...b.texture,
			createdAt: GOLDEN_TS,
			updatedAt: GOLDEN_TS,
		},
		chemistryInput: b.chemistry
			? {
					id: `che_${b.id}`,
					soilTestId: b.id,
					source: "LAB",
					...b.chemistry,
					createdAt: GOLDEN_TS,
					updatedAt: GOLDEN_TS,
			  }
			: null,
		meta: {
			reportNumber: b.id,
			reportTitle: b.name,
			reportDate: GOLDEN_TS,
		},
	};
}

/** Runs a single benchmark soil case through the full production pipeline. */
export async function runBenchmarkSoilCase(
	benchmark: BenchmarkSoil
): Promise<BenchmarkRunResult> {
	const seed = ALL_BENCHMARKS.map(benchmarkToGolden);
	setPrismaClientForTesting(createGoldenStore(seed));

	const full = benchmarkToGolden(benchmark);
	try {
		await calculateSoilTest(benchmark.id, {
			runPhysics: true,
			runChemistry: true,
			runInterpretation: true,
			calculationMode: "LAB",
			includeTrace: true,
		});
		const envelope = await buildSoilTestReport(benchmark.id);
		const dto = composeProfessionalReport({
			envelope,
			sampleRow: full.sample,
			projectRow: full.project,
			userRow: full.user,
			chemistryInputRow: full.chemistryInput,
			textureInputRow: full.textureInput,
			meta: full.meta,
		});
		const { html } = new DefaultReportRenderer().render(dto);
		return { envelope, dto, html };
	} finally {
		setPrismaClientForTesting(null);
	}
}
