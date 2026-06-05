/**
 * FlahaSOIL v2 API — Recommendation engine (Phase 8D D.1 + D.2).
 *
 * Pure, in-tree implementation of `runRecommendations`. Each rule is
 * declared in `rules.ts` with a stable `code` (e.g. `REC-SAL-001`),
 * severity, horizon, and trigger predicate. The engine evaluates every
 * rule against the supplied snapshot, groups matches by horizon, and
 * returns a `RecommendationSetDTO`.
 *
 * Hard rules:
 *   - No I/O. No mutation of inputs.
 *   - Engine never invents soil values — predicates only read the
 *     already-persisted envelope + raw lab inputs.
 *   - Copy text lives in one place (the rule registry). Callers
 *     reference rules by `code`.
 */

import type {
	RecommendationDTO,
	RecommendationSetDTO,
	SoilReportEnvelope,
} from "@flaha/shared-types";

import { RECOMMENDATION_RULES, type RecommendationContext } from "./rules";

export interface RunRecommendationsArgs {
	envelope: SoilReportEnvelope;
	chemistryInput: Record<string, unknown> | null;
	textureInput: Record<string, unknown> | null;
}

export function runRecommendations(
	args: RunRecommendationsArgs
): RecommendationSetDTO {
	const ctx: RecommendationContext = {
		envelope: args.envelope,
		chemistryInput: args.chemistryInput ?? {},
		textureInput: args.textureInput ?? {},
		num,
		str,
	};

	const matches: RecommendationDTO[] = [];
	for (const rule of RECOMMENDATION_RULES) {
		const hit = rule.evaluate(ctx);
		if (!hit) continue;
		const dto: RecommendationDTO = {
			code: rule.code,
			severity: rule.severity,
			horizon: rule.horizon,
			category: rule.category,
			title: rule.title,
			body: hit.body ?? rule.body,
			...(rule.bullets ? { bullets: rule.bullets } : {}),
			...(hit.context ? { context: hit.context } : {}),
		};
		matches.push(dto);
	}

	return {
		short: matches.filter((m) => m.horizon === "SHORT"),
		medium: matches.filter((m) => m.horizon === "MEDIUM"),
		long: matches.filter((m) => m.horizon === "LONG"),
	};
}

function num(value: unknown): number | undefined {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string") {
		const n = parseFloat(value);
		return Number.isFinite(n) ? n : undefined;
	}
	return undefined;
}

function str(value: unknown): string | undefined {
	return typeof value === "string" ? value : undefined;
}
