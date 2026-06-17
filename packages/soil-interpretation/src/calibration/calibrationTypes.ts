/**
 * @flaha/soil-interpretation — calibration type contracts (local mirror).
 *
 * These interfaces are a structurally-aligned local copy of the public
 * vocabulary published by `@flaha/shared-types`
 * (`scientificCalibration.ts`). The engine packages are intentionally
 * free of cross-package dependencies and `soil-interpretation` emits
 * with `rootDir: src`, so importing the shared-types source here would
 * trip TS6059. The two definitions MUST stay structurally in sync; any
 * change here requires the same change in shared-types (and vice-versa).
 *
 * Phase 10C-A — metadata only. No executable thresholds live here.
 */

/** Stable identifiers for the calibration profiles known to the registry. */
export const CALIBRATION_PROFILE_IDS = [
	"FLAHA_DEFAULT",
	"USDA_EXTENSION",
	"ALBRECHT_BEAR",
	"EUROFINS_STYLE",
	"MENA_ARID_REGION",
	"CUSTOM_ORGANIZATION",
] as const;

export type CalibrationProfileId = (typeof CALIBRATION_PROFILE_IDS)[number];

/** Lifecycle status of a calibration profile (only ACTIVE is wired). */
export type CalibrationProfileStatus =
	| "ACTIVE"
	| "REFERENCE_ONLY"
	| "PROVISIONAL"
	| "FUTURE"
	| "DEPRECATED";

/** Engine layer / data domain a method or profile calibrates. */
export type CalibrationProfileScope =
	| "PHYSICS"
	| "CHEMISTRY"
	| "INTERPRETATION"
	| "FULL";

/** Provenance record for a single scientific method / threshold set. */
export interface CalibrationMethod {
	key: string;
	name: string;
	domain: CalibrationProfileScope;
	source: string;
	peerReviewed: boolean;
	notes?: string;
}

/** A named calibration profile (metadata describing applied methods). */
export interface ScientificCalibrationProfile {
	id: CalibrationProfileId;
	displayName: string;
	status: CalibrationProfileStatus;
	scope: CalibrationProfileScope;
	description: string;
	methods: CalibrationMethod[];
	introducedDate: string;
	lastReviewedDate: string;
}
