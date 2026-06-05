/**
 * FlahaSOIL v2 — frontend password policy mirror (Phase 9A-G).
 *
 * Mirrors `backend/src/auth/password.ts` so the SPA can surface the
 * same constraints in form-level validation without a round-trip. The
 * backend remains the source of truth; if these constants diverge the
 * server still wins (the SPA just shows a less helpful error).
 */
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export interface PasswordPolicyError {
	message: string;
}

export function validatePassword(password: string): PasswordPolicyError | null {
	if (password.length < PASSWORD_MIN_LENGTH) {
		return {
			message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
		};
	}
	if (password.length > PASSWORD_MAX_LENGTH) {
		return {
			message: `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`,
		};
	}
	return null;
}
