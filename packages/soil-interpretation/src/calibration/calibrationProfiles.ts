/**
 * @flaha/soil-interpretation — calibration profile registry.
 *
 * Phase 10C-A: `FLAHA_DEFAULT` is the single ACTIVE profile and is the
 * verified baseline that exactly mirrors the methods currently wired
 * into the pipeline (see {@link FLAHA_DEFAULT_METHODS}). Every other
 * entry is metadata-only (REFERENCE / EXPERIMENTAL) — documented for
 * audit and roadmap, but NOT wired to any engine. Introducing an
 * alternative profile here changes NO scientific behaviour.
 */

import { FLAHA_DEFAULT_METHODS } from "./calibrationMetadata";
import type {
	CalibrationProfileId,
	ScientificCalibrationProfile,
} from "./calibrationTypes";

/** The verified, deployed FlahaSOIL baseline. The only ACTIVE profile. */
export const FLAHA_DEFAULT: ScientificCalibrationProfile = {
	id: "FLAHA_DEFAULT",
	displayName: "FlahaSOIL Default (v2 baseline)",
	status: "ACTIVE",
	scope: "FULL",
	description:
		"The verified FlahaSOIL v2 scientific baseline: Saxton & Rawls (2006) " +
		"physics, standard soil-chemistry equations, and the Phase-2.3 / 8D / " +
		"10A interpretation thresholds. This is the only profile wired into " +
		"the production engine.",
	methods: FLAHA_DEFAULT_METHODS,
	introducedDate: "2025-01-01",
	lastReviewedDate: "2025-06-17",
};

/** USDA cooperative-extension interpretive ranges — reference only. */
const USDA_EXTENSION: ScientificCalibrationProfile = {
	id: "USDA_EXTENSION",
	displayName: "USDA Cooperative Extension ranges",
	status: "REFERENCE_ONLY",
	scope: "INTERPRETATION",
	description:
		"USDA cooperative-extension interpretive ranges (e.g. land-grant " +
		"university soil-test bulletins). Documented for comparison against " +
		"FLAHA_DEFAULT; not wired to any engine in Phase 10C-A.",
	methods: [],
	introducedDate: "2025-06-17",
	lastReviewedDate: "2025-06-17",
};

/** Albrecht / Base-Cation-Saturation-Ratio school — reference only. */
const ALBRECHT_BEAR: ScientificCalibrationProfile = {
	id: "ALBRECHT_BEAR",
	displayName: "Albrecht–Bear (BCSR) ratios",
	status: "REFERENCE_ONLY",
	scope: "CHEMISTRY",
	description:
		"The Albrecht / Bear Base-Cation-Saturation-Ratio (BCSR) school of " +
		"cation balance. Recorded for comparison; FLAHA_DEFAULT uses its own " +
		"cation-balance windows. Not wired to any engine.",
	methods: [],
	introducedDate: "2025-06-17",
	lastReviewedDate: "2025-06-17",
};

/** Commercial-lab (Eurofins-style) reporting bands — reference only. */
const EUROFINS_STYLE: ScientificCalibrationProfile = {
	id: "EUROFINS_STYLE",
	displayName: "Commercial lab (Eurofins-style) bands",
	status: "REFERENCE_ONLY",
	scope: "INTERPRETATION",
	description:
		"Commercial soil-laboratory reporting bands in the Eurofins style. " +
		"Documented for comparison against FLAHA_DEFAULT; not wired to any " +
		"engine in Phase 10C-A.",
	methods: [],
	introducedDate: "2025-06-17",
	lastReviewedDate: "2025-06-17",
};

/** MENA arid-region calibration — provisional, not yet validated. */
const MENA_ARID_REGION: ScientificCalibrationProfile = {
	id: "MENA_ARID_REGION",
	displayName: "MENA arid-region calibration",
	status: "PROVISIONAL",
	scope: "FULL",
	description:
		"Draft calibration tuned for MENA arid-region soils (high salinity / " +
		"sodicity, calcareous, low OM). Drafted on the roadmap but NOT yet " +
		"validated end-to-end and NOT active.",
	methods: [],
	introducedDate: "2025-06-17",
	lastReviewedDate: "2025-06-17",
};

/** Per-organization custom overrides — future, not yet defined. */
const CUSTOM_ORGANIZATION: ScientificCalibrationProfile = {
	id: "CUSTOM_ORGANIZATION",
	displayName: "Custom organization overrides",
	status: "FUTURE",
	scope: "FULL",
	description:
		"Placeholder for per-organization custom calibration overrides. Not " +
		"yet defined and NOT active; present to reserve the registry slot and " +
		"exercise the future-profile (non-active) path.",
	methods: [],
	introducedDate: "2025-06-17",
	lastReviewedDate: "2025-06-17",
};

/** The complete profile registry, keyed by {@link CalibrationProfileId}. */
export const CALIBRATION_PROFILES: Record<
	CalibrationProfileId,
	ScientificCalibrationProfile
> = {
	FLAHA_DEFAULT,
	USDA_EXTENSION,
	ALBRECHT_BEAR,
	EUROFINS_STYLE,
	MENA_ARID_REGION,
	CUSTOM_ORGANIZATION,
};
