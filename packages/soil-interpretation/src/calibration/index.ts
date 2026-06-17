/**
 * @flaha/soil-interpretation — calibration module barrel.
 *
 * Phase 10C-A foundation: types, the FLAHA_DEFAULT method audit, the
 * profile registry, and the resolver. Metadata only — no scientific
 * behaviour change.
 */

export type {
	CalibrationProfileId,
	CalibrationProfileStatus,
	CalibrationProfileScope,
	CalibrationMethod,
	ScientificCalibrationProfile,
} from "./calibrationTypes";
export { CALIBRATION_PROFILE_IDS } from "./calibrationTypes";

export { FLAHA_DEFAULT_METHODS } from "./calibrationMetadata";
export { CALIBRATION_PROFILES, FLAHA_DEFAULT } from "./calibrationProfiles";
export {
	getActiveCalibrationProfile,
	listCalibrationProfiles,
	getCalibrationProfileMetadata,
	resolveCalibrationProfile,
	isCalibrationProfileActive,
} from "./calibrationResolver";
