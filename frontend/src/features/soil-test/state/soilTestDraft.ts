/**
 * FlahaSOIL v2 — soil-test wizard draft state.
 *
 * The draft is a partial, in-progress version of the inputs that the
 * wizard collects. It is shaped so that, on submit, it can be packed
 * into a `CreateSoilTestRequest` (from `@flaha/shared-types`) without
 * any value transformation — every field already matches the contract.
 *
 * Phase 5 keeps the state local (React `useState`); persistence and a
 * proper store come later.
 */
import {
	type CreateSoilChemistryInputPayload,
	type CreateSoilSampleRequest,
	type CreateSoilTestRequest,
	type CreateSoilTextureInputPayload,
	SoilTestLevel,
	SoilValueSource,
} from "@flaha/shared-types";

/**
 * Draft shape used while the wizard is being filled in. `projectId` is
 * required on `CreateSoilSampleRequest` (every soil sample must belong
 * to a project — Phase 8A), but the wizard naturally starts with no
 * selection and the user picks the owning project in the first step,
 * so the draft widens the field to `string | null` and the submit
 * handler guards against `null` before the create call.
 */
export interface SoilTestDraftSampleInfo
	extends Omit<CreateSoilSampleRequest, "projectId"> {
	projectId: string | null;
}

export type SoilTestDraftTextureInput = Partial<CreateSoilTextureInputPayload>;

export type SoilTestDraftChemistryInput =
	Partial<CreateSoilChemistryInputPayload>;

export interface SoilTestDraft {
	sampleInfo: SoilTestDraftSampleInfo;
	testLevel: SoilTestLevel;
	textureInput: SoilTestDraftTextureInput;
	chemistryInput: SoilTestDraftChemistryInput;
	labName?: string | null;
	labReference?: string | null;
	notes?: string | null;
}

export const EMPTY_DRAFT: SoilTestDraft = {
	sampleInfo: {
		projectId: null,
		locationName: null,
		latitude: null,
		longitude: null,
		depthFromCm: null,
		depthToCm: null,
		sampleDate: null,
	},
	testLevel: SoilTestLevel.PRELIMINARY,
	textureInput: { source: SoilValueSource.LAB },
	chemistryInput: { source: SoilValueSource.LAB },
	labName: null,
	labReference: null,
	notes: null,
};

/**
 * Pack the draft into a `CreateSoilTestRequest`. Phase 5 calls this
 * only against the mock client; Phase 6 will wire it to the real one.
 *
 * `sampleId` is supplied separately because the sample is created by
 * the first wizard step and its id is not part of the draft itself.
 */
export function toCreateSoilTestRequest(
	draft: SoilTestDraft,
	sampleId: string
): CreateSoilTestRequest {
	const request: CreateSoilTestRequest = {
		sampleId,
		testLevel: draft.testLevel,
		labName: draft.labName ?? null,
		labReference: draft.labReference ?? null,
		notes: draft.notes ?? null,
	};

	if (hasAnyValue(draft.textureInput)) {
		request.textureInput = packTextureInput(draft.textureInput);
	}
	if (hasAnyValue(draft.chemistryInput)) {
		request.chemistryInput = packChemistryInput(draft.chemistryInput);
	}
	return request;
}

function hasAnyValue(obj: Record<string, unknown>): boolean {
	return Object.entries(obj).some(
		([key, value]) =>
			key !== "source" && value !== null && value !== undefined && value !== ""
	);
}

function packTextureInput(
	input: SoilTestDraftTextureInput
): CreateSoilTextureInputPayload {
	return {
		source: input.source ?? SoilValueSource.LAB,
		sandPercent: input.sandPercent ?? null,
		siltPercent: input.siltPercent ?? null,
		clayPercent: input.clayPercent ?? null,
		organicMatterPercent: input.organicMatterPercent ?? null,
		bulkDensity: input.bulkDensity ?? null,
		gravelPercent: input.gravelPercent ?? null,
	};
}

function packChemistryInput(
	input: SoilTestDraftChemistryInput
): CreateSoilChemistryInputPayload {
	return {
		source: input.source ?? SoilValueSource.LAB,
		pH: input.pH ?? null,
		ecDsM: input.ecDsM ?? null,
		tdsMgL: input.tdsMgL ?? null,
		cec: input.cec ?? null,
		ca: input.ca ?? null,
		mg: input.mg ?? null,
		k: input.k ?? null,
		na: input.na ?? null,
		cl: input.cl ?? null,
		n: input.n ?? null,
		p: input.p ?? null,
		fe: input.fe ?? null,
		mn: input.mn ?? null,
		zn: input.zn ?? null,
		cu: input.cu ?? null,
		b: input.b ?? null,
		mo: input.mo ?? null,
		s: input.s ?? null,
		carbonate: input.carbonate ?? null,
		bicarbonate: input.bicarbonate ?? null,
		sar: input.sar ?? null,
		esp: input.esp ?? null,
		heavyMetalsJson: input.heavyMetalsJson ?? null,
		fullNutrientPanelJson: input.fullNutrientPanelJson ?? null,
	};
}
