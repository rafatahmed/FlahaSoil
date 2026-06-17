/**
 * @flaha/soil-interpretation — calibration profile resolver.
 *
 * The safety contract for Phase 10C-A:
 *   - A missing / empty selection resolves to FLAHA_DEFAULT (the only
 *     ACTIVE profile). The engine therefore never changes behaviour by
 *     accident.
 *   - Selecting a known but non-ACTIVE profile (REFERENCE / EXPERIMENTAL)
 *     is rejected by {@link resolveCalibrationProfile} — those profiles
 *     are metadata-only and must not silently alter results. Their
 *     metadata is still readable via {@link getCalibrationProfileMetadata}.
 *   - An unknown selection is always rejected.
 */

import { CALIBRATION_PROFILES, FLAHA_DEFAULT } from "./calibrationProfiles";
import type { ScientificCalibrationProfile } from "./calibrationTypes";

/** Returns the active baseline profile (always FLAHA_DEFAULT). */
export function getActiveCalibrationProfile(): ScientificCalibrationProfile {
	return FLAHA_DEFAULT;
}

/** Returns every registered profile (active and metadata-only). */
export function listCalibrationProfiles(): ScientificCalibrationProfile[] {
	return Object.values(CALIBRATION_PROFILES);
}

/**
 * Reads the metadata for any KNOWN profile regardless of status (for
 * audit / comparison UIs). Throws on an unknown id.
 */
export function getCalibrationProfileMetadata(
	profileId: string
): ScientificCalibrationProfile {
	const profile = CALIBRATION_PROFILES[profileId as keyof typeof CALIBRATION_PROFILES];
	if (!profile) {
		throw new Error(`Unknown calibration profile: "${profileId}"`);
	}
	return profile;
}

/**
 * Resolves the profile the ENGINE should apply.
 *
 *   undefined / null / "" → FLAHA_DEFAULT
 *   known + ACTIVE        → that profile
 *   known + non-ACTIVE    → throws (metadata-only; not applicable)
 *   unknown               → throws
 *
 * @param profileId optional caller selection (e.g. an API query param).
 */
export function resolveCalibrationProfile(
	profileId?: string | null
): ScientificCalibrationProfile {
	if (profileId == null || profileId === "") {
		return FLAHA_DEFAULT;
	}
	const profile = CALIBRATION_PROFILES[profileId as keyof typeof CALIBRATION_PROFILES];
	if (!profile) {
		throw new Error(`Unknown calibration profile: "${profileId}"`);
	}
	if (profile.status !== "ACTIVE") {
		throw new Error(
			`Calibration profile "${profileId}" is ${profile.status} ` +
				`(metadata-only); only FLAHA_DEFAULT is active in Phase 10C-A.`
		);
	}
	return profile;
}

/** True when the given id is a known, ACTIVE profile. */
export function isCalibrationProfileActive(profileId: string): boolean {
	const profile = CALIBRATION_PROFILES[profileId as keyof typeof CALIBRATION_PROFILES];
	return profile?.status === "ACTIVE";
}
