/**
 * FlahaSOIL v2 — soil-test wizard stepper.
 *
 * Pure presentation: receives the visible step list and the current
 * index, renders an MUI Stepper. The wizard page owns navigation.
 */
import { Step, StepLabel, Stepper } from "@mui/material";

import type { WizardStepMeta } from "../utils/soilTestDefaults";

interface SoilTestStepperProps {
	steps: WizardStepMeta[];
	activeStep: number;
}

export function SoilTestStepper({ steps, activeStep }: SoilTestStepperProps) {
	return (
		<Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
			{steps.map((step) => (
				<Step key={step.key}>
					<StepLabel>{step.label}</StepLabel>
				</Step>
			))}
		</Stepper>
	);
}
