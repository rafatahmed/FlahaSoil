/**
 * FlahaSOIL v2 — Soil-test wizard page.
 *
 * Owns the draft state and step navigation. The visible step list is
 * derived from `draft.testLevel`. Submit chains create-sample →
 * create-test → calculate against the active API client.
 *
 * The wizard always runs inside a `Project`. A `?projectId`
 * search parameter preselects the project; otherwise the user picks
 * one in the sample-info step. The "Next" button on that step is
 * disabled until a project is selected so we never call
 * `createSoilSample` without an owning project.
 */
import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SoilTestLevel } from "@flaha/shared-types";

import { AdvancedInputStep } from "../features/soil-test/components/AdvancedInputStep";
import { ModerateInputStep } from "../features/soil-test/components/ModerateInputStep";
import { PreliminaryInputStep } from "../features/soil-test/components/PreliminaryInputStep";
import { ReviewStep } from "../features/soil-test/components/ReviewStep";
import { SampleInfoStep } from "../features/soil-test/components/SampleInfoStep";
import { SoilTestStepper } from "../features/soil-test/components/SoilTestStepper";
import { TestLevelStep } from "../features/soil-test/components/TestLevelStep";
import {
	EMPTY_DRAFT,
	type SoilTestDraft,
	toCreateSoilTestRequest,
} from "../features/soil-test/state/soilTestDraft";
import { visibleStepsForLevel } from "../features/soil-test/utils/soilTestDefaults";
import { getApiClient } from "../services/apiClientProvider";

export function SoilTestWizardPage() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const preselectedProjectId = searchParams.get("projectId");

	const [draft, setDraft] = useState<SoilTestDraft>(() => ({
		...EMPTY_DRAFT,
		sampleInfo: {
			...EMPTY_DRAFT.sampleInfo,
			projectId: preselectedProjectId ?? null,
		},
	}));
	const [activeStep, setActiveStep] = useState(0);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Keep the draft in sync if the user lands on the wizard with a
	// different `?projectId` query (e.g. from a different project).
	useEffect(() => {
		if (
			preselectedProjectId &&
			draft.sampleInfo.projectId !== preselectedProjectId
		) {
			setDraft((d) => ({
				...d,
				sampleInfo: { ...d.sampleInfo, projectId: preselectedProjectId },
			}));
		}
	}, [preselectedProjectId, draft.sampleInfo.projectId]);

	const steps = useMemo(
		() => visibleStepsForLevel(draft.testLevel),
		[draft.testLevel]
	);
	const current = steps[activeStep];
	const isLast = activeStep === steps.length - 1;
	const projectSelected = !!draft.sampleInfo.projectId;
	const canAdvance =
		current?.key === "sample-info" ? projectSelected : true;

	const next = () => setActiveStep((s) => Math.min(s + 1, steps.length - 1));
	const back = () => setActiveStep((s) => Math.max(s - 1, 0));

	const handleSubmit = async () => {
		if (!draft.sampleInfo.projectId) {
			setError("Please select a project before submitting the soil test.");
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			const client = getApiClient();
			const sample = await client.createSoilSample({
				...draft.sampleInfo,
				projectId: draft.sampleInfo.projectId,
			});
			const test = await client.createSoilTest(
				toCreateSoilTestRequest(draft, sample.sample.id)
			);
			// Kick off calculation so the detail page has results to show.
			// Failures here surface to the user but the test itself is
			// already persisted, so the detail page will still render.
			//
			// PRELIMINARY soil tests collect pH/EC/TDS only — they do
			// not capture CEC or Ca/Mg/K/Na, so requesting the chemistry
			// engine for them is a known mismatch (it would either
			// throw "resolved CEC is zero" or be silently skipped by
			// the backend). MODERATE and ADVANCED carry the cation
			// panel needed by the chemistry engine.
			const runChemistry =
				draft.testLevel !== SoilTestLevel.PRELIMINARY;
			await client.calculateSoilTest(test.soilTest.id, {
				runPhysics: true,
				runChemistry,
				runInterpretation: true,
				calculationMode: "LAB",
			});
			navigate(`/soil-tests/${test.soilTest.id}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Box>
			<Typography variant="h4" gutterBottom>
				New Soil Test
			</Typography>
			{preselectedProjectId && (
				<Typography color="text.secondary" sx={{ mb: 2 }}>
					Project preselected from project detail page.
				</Typography>
			)}

			{error && (
				<Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
					{error}
				</Alert>
			)}

			<SoilTestStepper steps={steps} activeStep={activeStep} />

			<Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
				{current?.key === "sample-info" && (
					<SampleInfoStep
						value={draft.sampleInfo}
						onChange={(sampleInfo) => setDraft({ ...draft, sampleInfo })}
					/>
				)}
				{current?.key === "test-level" && (
					<TestLevelStep
						value={draft.testLevel}
						onChange={(testLevel) => setDraft({ ...draft, testLevel })}
					/>
				)}
				{current?.key === "preliminary" && (
					<PreliminaryInputStep draft={draft} onChange={setDraft} />
				)}
				{current?.key === "moderate" && (
					<ModerateInputStep draft={draft} onChange={setDraft} />
				)}
				{current?.key === "advanced" && (
					<AdvancedInputStep draft={draft} onChange={setDraft} />
				)}
				{current?.key === "review" && <ReviewStep draft={draft} />}
			</Paper>

			<Stack direction="row" spacing={2} justifyContent="flex-end">
				<Button onClick={back} disabled={activeStep === 0}>
					Back
				</Button>
				{!isLast && (
					<Button
						variant="contained"
						onClick={next}
						disabled={!canAdvance}
					>
						Next
					</Button>
				)}
				{isLast && (
					<Button
						variant="contained"
						color="primary"
						onClick={handleSubmit}
						disabled={submitting || !projectSelected}
					>
						{submitting ? "Submitting…" : "Submit soil test"}
					</Button>
				)}
			</Stack>
		</Box>
	);
}
