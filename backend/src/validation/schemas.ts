/**
 * FlahaSOIL v2 API — zod request schemas.
 *
 * Mirrors the request DTOs from `@flaha/shared-types` plus the
 * cross-field validation rules documented in `docs/v2-api-contracts.md`.
 * The shapes are kept loose where the wire DTO is loose (e.g. nullable
 * vs missing) and tightened by a `superRefine` block where the spec
 * adds business rules (texture sum, test-level requirements).
 */

import {
	OrganizationRole,
	OrganizationType,
	ProjectStatus,
	SoilTestLevel,
	SoilValueSource,
} from "@flaha/shared-types";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Primitive helpers
// ---------------------------------------------------------------------------

const optionalNullableNumber = z.number().nullable().optional();
const optionalNullableString = z.string().nullable().optional();
const optionalIsoString = z.string().datetime({ offset: true }).nullable().optional();

const valueSourceSchema = z.nativeEnum(SoilValueSource);
const testLevelSchema = z.nativeEnum(SoilTestLevel);
const projectStatusSchema = z.nativeEnum(ProjectStatus);

// ---------------------------------------------------------------------------
// 0. POST /projects (Phase 8A)
// ---------------------------------------------------------------------------

// Phase 8B / 9A-E: `userId` was removed from the body — the controller
// pulls the owning user + tenant from `req.authSession` (authSession
// middleware).
export const createProjectSchema = z.object({
	name: z.string().min(1, "name is required").max(200),
	code: z.string().min(1).max(80).nullable().optional(),
	description: optionalNullableString,
	locationName: optionalNullableString,
	status: projectStatusSchema.optional(),
});

export type CreateProjectParsed = z.infer<typeof createProjectSchema>;

export const listProjectsQuerySchema = z.object({
	status: projectStatusSchema.optional(),
});

export type ListProjectsQueryParsed = z.infer<typeof listProjectsQuerySchema>;

// ---------------------------------------------------------------------------
// 1. POST /soil-samples
// ---------------------------------------------------------------------------

// Phase 8B / 9A-E: `userId` was removed from the body — the owning
// user + tenant are pulled from `req.authSession` (authSession
// middleware). `projectId` remains required for newly created samples;
// the nullable variant on the read DTO is kept for back-compat with
// pre-Project-model rows.
export const createSoilSampleSchema = z
	.object({
		projectId: z.string().min(1, "projectId is required"),
		locationName: optionalNullableString,
		latitude: z.number().gte(-90).lte(90).nullable().optional(),
		longitude: z.number().gte(-180).lte(180).nullable().optional(),
		depthFromCm: z.number().gte(0).nullable().optional(),
		depthToCm: z.number().gte(0).nullable().optional(),
		sampleDate: optionalIsoString,
	})
	.superRefine((val, ctx) => {
		if (
			typeof val.depthFromCm === "number" &&
			typeof val.depthToCm === "number" &&
			val.depthToCm < val.depthFromCm
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["depthToCm"],
				message: "depthToCm must be greater than or equal to depthFromCm",
			});
		}
	});

export type CreateSoilSampleParsed = z.infer<typeof createSoilSampleSchema>;

// ---------------------------------------------------------------------------
// Texture / chemistry / lab-value sub-schemas (used inside SoilTest creation)
// ---------------------------------------------------------------------------

export const textureInputSchema = z.object({
	sandPercent: z.number().gte(0).lte(100).nullable().optional(),
	siltPercent: z.number().gte(0).lte(100).nullable().optional(),
	clayPercent: z.number().gte(0).lte(100).nullable().optional(),
	organicMatterPercent: z.number().gte(0).lte(100).nullable().optional(),
	bulkDensity: z.number().positive().nullable().optional(),
	gravelPercent: z.number().gte(0).lte(100).nullable().optional(),
	source: valueSourceSchema,
});

const optionalNonNegative = z.number().gte(0).nullable().optional();

export const chemistryInputSchema = z.object({
	pH: z.number().gte(0).lte(14).nullable().optional(),
	ecDsM: optionalNonNegative,
	tdsMgL: optionalNonNegative,

	cec: optionalNonNegative,
	ca: optionalNonNegative,
	mg: optionalNonNegative,
	k: optionalNonNegative,
	na: optionalNonNegative,
	cl: optionalNonNegative,
	n: optionalNonNegative,
	p: optionalNonNegative,

	fe: optionalNonNegative,
	mn: optionalNonNegative,
	zn: optionalNonNegative,
	cu: optionalNonNegative,
	b: optionalNonNegative,
	mo: optionalNonNegative,
	s: optionalNonNegative,

	carbonate: optionalNonNegative,
	bicarbonate: optionalNonNegative,
	sar: optionalNonNegative,
	esp: z.number().gte(0).lte(100).nullable().optional(),

	heavyMetalsJson: z.record(z.unknown()).nullable().optional(),
	fullNutrientPanelJson: z.record(z.unknown()).nullable().optional(),

	source: valueSourceSchema,
});

export const labValueSchema = z.object({
	fieldKey: z.string().min(1),
	rawLabValue: z.string().min(1),
	rawUnit: z.string().min(1),
	convertedStandardValue: z.number().nullable().optional(),
	standardUnit: optionalNullableString,
	method: optionalNullableString,
	notes: optionalNullableString,
	measuredAt: optionalIsoString,
});

// ---------------------------------------------------------------------------
// 3. POST /soil-tests
// ---------------------------------------------------------------------------


const TEXTURE_SUM_TARGET = 100;
const TEXTURE_SUM_TOLERANCE = 0.5;

export const createSoilTestSchema = z
	.object({
		sampleId: z.string().min(1, "sampleId is required"),
		testLevel: testLevelSchema,
		labName: optionalNullableString,
		labReference: optionalNullableString,
		testDate: optionalIsoString,
		notes: optionalNullableString,
		textureInput: textureInputSchema.optional(),
		chemistryInput: chemistryInputSchema.optional(),
		labValues: z.array(labValueSchema).optional(),
	})
	.superRefine((val, ctx) => {
		const tx = val.textureInput;
		if (
			tx &&
			typeof tx.sandPercent === "number" &&
			typeof tx.siltPercent === "number" &&
			typeof tx.clayPercent === "number"
		) {
			const sum = tx.sandPercent + tx.siltPercent + tx.clayPercent;
			if (Math.abs(sum - TEXTURE_SUM_TARGET) > TEXTURE_SUM_TOLERANCE) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["textureInput"],
					message: `sand + silt + clay must equal 100 ± ${TEXTURE_SUM_TOLERANCE} (received ${sum.toFixed(2)})`,
				});
			}
		}

		validateTestLevelRequirements(val, ctx);
	});

export type CreateSoilTestParsed = z.infer<typeof createSoilTestSchema>;

function validateTestLevelRequirements(
	val: {
		testLevel: SoilTestLevel;
		textureInput?: z.infer<typeof textureInputSchema> | undefined;
		chemistryInput?: z.infer<typeof chemistryInputSchema> | undefined;
	},
	ctx: z.RefinementCtx
): void {
	const { testLevel, textureInput, chemistryInput } = val;

	const requirePreliminary = () => {
		if (!textureInput) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["textureInput"],
				message: `${testLevel} requires textureInput`,
			});
			return;
		}
		const requiredTexture: Array<keyof typeof textureInput> = [
			"sandPercent",
			"siltPercent",
			"clayPercent",
			"organicMatterPercent",
		];
		for (const field of requiredTexture) {
			if (typeof textureInput[field] !== "number") {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["textureInput", String(field)],
					message: `${testLevel} requires textureInput.${String(field)}`,
				});
			}
		}
		const ph = chemistryInput?.pH;
		const ec = chemistryInput?.ecDsM;
		const tds = chemistryInput?.tdsMgL;
		if (
			typeof ph !== "number" &&
			typeof ec !== "number" &&
			typeof tds !== "number"
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["chemistryInput"],
				message: `${testLevel} requires at least one of chemistryInput.pH, ecDsM, tdsMgL`,
			});
		}
	};

	const requireModerate = () => {
		const required: Array<"ca" | "mg" | "k" | "na" | "n" | "p"> = [
			"ca",
			"mg",
			"k",
			"na",
			"n",
			"p",
		];
		for (const field of required) {
			if (typeof chemistryInput?.[field] !== "number") {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["chemistryInput", field],
					message: `${testLevel} requires chemistryInput.${field}`,
				});
			}
		}
	};

	if (testLevel === SoilTestLevel.PRELIMINARY) {
		requirePreliminary();
	} else if (testLevel === SoilTestLevel.MODERATE) {
		requirePreliminary();
		requireModerate();
	} else {
		// ADVANCED
		requirePreliminary();
		requireModerate();
		// Advanced fields are optional; nothing further to require here.
	}
}

// ---------------------------------------------------------------------------
// 5. POST /soil-tests/:soilTestId/calculate
// ---------------------------------------------------------------------------

export const calculateSoilTestSchema = z.object({
	runPhysics: z.boolean(),
	runChemistry: z.boolean(),
	runInterpretation: z.boolean(),
	calculationMode: z.enum(["LAB", "ESTIMATED"]).optional(),
	includeTrace: z.boolean().optional(),
});

export type CalculateSoilTestParsed = z.infer<typeof calculateSoilTestSchema>;

// ---------------------------------------------------------------------------
// 7. POST /soil-tests/:soilTestId/reports
// ---------------------------------------------------------------------------

export const createSoilReportSchema = z.object({
	reportType: z.string().min(1).optional(),
	includeTrace: z.boolean().optional(),
	includeRawLabValues: z.boolean().optional(),
	title: z.string().min(1).max(200).optional(),
	reportNumber: z.string().min(1).max(64).optional(),
	cover: z
		.object({
			clientName: z.string().max(200).optional(),
			consultantName: z.string().max(200).optional(),
			consultantRole: z.string().max(200).optional(),
		})
		.optional(),
});

export type CreateSoilReportParsed = z.infer<typeof createSoilReportSchema>;

// ---------------------------------------------------------------------------
// Phase 8D: PATCH /reports/:reportId
// ---------------------------------------------------------------------------

export const patchReportSchema = z.object({
	title: z.string().min(1).max(200).optional(),
	archived: z.boolean().optional(),
});

export type PatchReportParsed = z.infer<typeof patchReportSchema>;

// ---------------------------------------------------------------------------
// Phase 9A-C — Auth endpoints
//
// Password POLICY (length + character classes) is enforced separately
// by `auth/password.ts` so the rule lives in exactly one place. These
// schemas only check structural shape + obvious bounds.
// ---------------------------------------------------------------------------

const emailSchema = z
	.string()
	.trim()
	.min(3, "email is required")
	.max(254)
	.email("email must be a valid address");

const passwordSchema = z.string().min(1, "password is required").max(512);

export const registerSchema = z.object({
	email: emailSchema,
	password: passwordSchema,
	displayName: z.string().trim().min(1, "displayName is required").max(120),
	organizationName: z.string().trim().min(1).max(200).optional(),
});

export type RegisterParsed = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
	email: emailSchema,
	password: passwordSchema,
});

export type LoginParsed = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Phase 9A-H — POST /api/v2/auth/switch-organization
// ---------------------------------------------------------------------------

export const switchOrganizationSchema = z.object({
	organizationId: z.string().trim().min(1, "organizationId is required").max(60),
});

export type SwitchOrganizationParsed = z.infer<typeof switchOrganizationSchema>;

// ---------------------------------------------------------------------------
// Phase 9B — Organization administration
//
// The schemas below mirror the request DTOs from
// `@flaha/shared-types/organizations.ts`. Server-side authorisation
// (caller must be ADMIN/OWNER of the path-target org, may not invite a
// role higher than their own) lives in the service layer because it
// depends on the resolved auth session, not the request body alone.
// ---------------------------------------------------------------------------

const orgRoleSchema = z.nativeEnum(OrganizationRole);
const orgTypeSchema = z.nativeEnum(OrganizationType);

// PATCH /organizations/:organizationId — partial update. At least one
// field must be present; an empty body is a 400 (no-op patches usually
// indicate a frontend bug, not a legitimate intent).
export const patchOrganizationSchema = z
	.object({
		name: z.string().trim().min(1).max(200).optional(),
		type: orgTypeSchema.optional(),
	})
	.refine((v) => v.name !== undefined || v.type !== undefined, {
		message: "At least one field (name, type) must be provided.",
	});

export type PatchOrganizationParsed = z.infer<typeof patchOrganizationSchema>;

// PATCH /organizations/:organizationId/members/:userId — only role
// changes are supported in 9B. Status transitions (SUSPEND/REMOVE) are
// surfaced as DELETE.
export const patchMembershipSchema = z.object({
	role: orgRoleSchema,
});

export type PatchMembershipParsed = z.infer<typeof patchMembershipSchema>;

// POST /organizations/:organizationId/invitations
export const createInvitationSchema = z.object({
	email: emailSchema,
	role: orgRoleSchema.refine((r) => r !== OrganizationRole.OWNER, {
		message: "Cannot invite a user as OWNER. Transfer ownership separately.",
	}),
});

export type CreateInvitationParsed = z.infer<typeof createInvitationSchema>;

// POST /invitations/accept
export const acceptInvitationSchema = z.object({
	token: z.string().min(1, "token is required").max(512),
});

export type AcceptInvitationParsed = z.infer<typeof acceptInvitationSchema>;
