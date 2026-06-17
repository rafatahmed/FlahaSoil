/**
 * @flaha/shared-types — Scientific Calibration Framework (Phase 10C-A).
 *
 * Public type vocabulary for named calibration profiles. A calibration
 * profile is METADATA describing which scientific methods, thresholds,
 * and reference standards the engine applies — it does not itself hold
 * executable thresholds (those live in the engine packages).
 *
 * Phase 10C-A is a foundation-only change: `FLAHA_DEFAULT` is the single
 * ACTIVE profile and exactly mirrors the methods already shipped across
 * `@flaha/soil-physics`, `@flaha/soil-chemistry`, and
 * `@flaha/soil-interpretation`. All other profiles are metadata-only
 * (REFERENCE / EXPERIMENTAL) and are NOT wired to any engine. No
 * scientific behaviour changes in this phase.
 *
 * The registry in `@flaha/soil-interpretation` keeps a structurally
 * aligned local copy of these interfaces (the engine packages are
 * intentionally free of cross-package dependencies, and
 * `soil-interpretation` emits with `rootDir: src`). The two definitions
 * MUST stay structurally in sync.
 */

/**
 * Stable, machine-readable identifiers for the calibration profiles
 * known to the registry. Append new IDs here (do not renumber/remove
 * existing entries — they are part of the audit contract).
 */
export const CALIBRATION_PROFILE_IDS = [
	/** The verified, deployed FlahaSOIL baseline. The only ACTIVE profile. */
	"FLAHA_DEFAULT",
	/** USDA cooperative-extension interpretive ranges (reference only). */
	"USDA_EXTENSION",
	/** Albrecht / Base-Cation-Saturation-Ratio school (reference only). */
	"ALBRECHT_BEAR",
	/** Commercial-lab (Eurofins-style) reporting bands (reference only). */
	"EUROFINS_STYLE",
	/** MENA arid-region calibration (provisional — not yet validated). */
	"MENA_ARID_REGION",
	/** Per-organization custom overrides (future — not yet defined). */
	"CUSTOM_ORGANIZATION",
] as const;

export type CalibrationProfileId = (typeof CALIBRATION_PROFILE_IDS)[number];

/**
 * Lifecycle status of a calibration profile.
 *   - ACTIVE         deployed in the production engine.
 *   - REFERENCE_ONLY metadata-only; documented standard, not wired.
 *   - PROVISIONAL    drafted but not yet validated end-to-end; not wired.
 *   - FUTURE         placeholder / roadmap; not yet defined, not wired.
 *   - DEPRECATED     superseded; must not be used.
 *
 * Only ACTIVE profiles are applied by the engine. All other statuses are
 * metadata-only and are rejected by the resolver's apply path.
 */
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

/**
 * Provenance record for a single scientific method or threshold set
 * within a profile. This is the unit of scientific accountability: it
 * names the method, its source, and whether that source is peer-reviewed
 * / from a recognised standards body (vs a FlahaSOIL house convention).
 */
export interface CalibrationMethod {
	/** Stable key, e.g. "ph_classification", "salinity_severity". */
	key: string;
	/** Human-readable method name. */
	name: string;
	/** Domain this method operates on. */
	domain: CalibrationProfileScope;
	/** Bibliographic source or standard reference. */
	source: string;
	/**
	 * True when `source` is a peer-reviewed publication or a recognised
	 * standards body (e.g. FAO-29, Saxton & Rawls 2006). False when the
	 * thresholds are a FlahaSOIL house convention pending citation.
	 */
	peerReviewed: boolean;
	/** Optional applicability notes, caveats, or deviations. */
	notes?: string;
}

/**
 * A named calibration profile: the metadata describing which scientific
 * methods and reference standards a configuration applies.
 *
 * Only profiles with `status === "ACTIVE"` are wired into the engine.
 * Every other profile is a metadata-only record for audit, comparison,
 * and roadmap tracking.
 */
export interface ScientificCalibrationProfile {
	/** Stable machine-readable identifier. */
	id: CalibrationProfileId;
	/** Human-readable display name. */
	displayName: string;
	/** Lifecycle status. */
	status: CalibrationProfileStatus;
	/** Engine layer / domain this profile calibrates. */
	scope: CalibrationProfileScope;
	/** Short description of what this profile calibrates and why. */
	description: string;
	/** The methods / threshold-sets this profile documents. */
	methods: CalibrationMethod[];
	/** ISO-8601 (YYYY-MM-DD) date the profile entered the registry. */
	introducedDate: string;
	/** ISO-8601 (YYYY-MM-DD) date of last scientific review. */
	lastReviewedDate: string;
}

/** Convenience runtime type-guard for a {@link ScientificCalibrationProfile}. */
export function isScientificCalibrationProfile(
	value: unknown
): value is ScientificCalibrationProfile {
	if (typeof value !== "object" || value === null) return false;
	const v = value as Partial<ScientificCalibrationProfile>;
	return (
		typeof v.id === "string" &&
		typeof v.displayName === "string" &&
		typeof v.status === "string" &&
		typeof v.scope === "string" &&
		typeof v.description === "string" &&
		Array.isArray(v.methods) &&
		typeof v.introducedDate === "string" &&
		typeof v.lastReviewedDate === "string"
	);
}
