/**
 * FlahaSOIL v2 — soil-test wizard stepper.
 *
 * Pure presentation: receives the visible step list and the current
 * index, renders a Material-UI Stepper. The wizard page owns
 * navigation.
 *
 * Responsive: switches to a vertical, fully-labelled stepper on
 * small screens so step descriptions stay readable, and reverts to
 * a horizontal alternative-label layout on tablet and up. A small
 * "Step X of Y" caption sits above the stepper to give the user a
 * sense of progress without having to count the dots.
 */
import {
	Box,
	Step,
	StepContent,
	StepLabel,
	Stepper,
	Typography,
	useMediaQuery,
	useTheme,
} from "@mui/material";

import type { WizardStepMeta } from "../utils/soilTestDefaults";

interface SoilTestStepperProps {
	steps: WizardStepMeta[];
	activeStep: number;
}

export function SoilTestStepper({ steps, activeStep }: SoilTestStepperProps) {
	const theme = useTheme();
	const isCompact = useMediaQuery(theme.breakpoints.down("md"));
	const safeActive = Math.min(Math.max(activeStep, 0), steps.length - 1);
	const current = steps[safeActive];

	return (
		<Box sx={{ mb: 4 }}>
			<Typography
				variant="overline"
				color="text.secondary"
				sx={{ display: "block", mb: 1, letterSpacing: 1 }}
			>
				Step {safeActive + 1} of {steps.length}
				{current ? ` \u2014 ${current.label}` : ""}
			</Typography>

			<Stepper
				activeStep={safeActive}
				orientation={isCompact ? "vertical" : "horizontal"}
				alternativeLabel={!isCompact}
			>
				{steps.map((step) => (
					<Step key={step.key}>
						<StepLabel
							optional={
								step.description ? (
									<Typography variant="caption" color="text.secondary">
										{step.description}
									</Typography>
								) : null
							}
						>
							{step.label}
						</StepLabel>
						{isCompact && step.description ? (
							<StepContent>
								<Typography variant="body2" color="text.secondary">
									{step.description}
								</Typography>
							</StepContent>
						) : null}
					</Step>
				))}
			</Stepper>
		</Box>
	);
}
