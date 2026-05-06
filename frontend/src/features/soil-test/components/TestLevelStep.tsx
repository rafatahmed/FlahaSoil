/**
 * FlahaSOIL v2 — wizard step: test level selection.
 *
 * Drives which subsequent steps are shown. See
 * `visibleStepsForLevel` in `soilTestDefaults`.
 */
import {
	FormControl,
	FormControlLabel,
	FormLabel,
	Radio,
	RadioGroup,
	Typography,
} from "@mui/material";
import { SoilTestLevel } from "@flaha/shared-types";

import { TEST_LEVEL_OPTIONS } from "../utils/soilTestDefaults";

interface TestLevelStepProps {
	value: SoilTestLevel;
	onChange: (next: SoilTestLevel) => void;
}

export function TestLevelStep({ value, onChange }: TestLevelStepProps) {
	return (
		<FormControl>
			<FormLabel id="test-level-label">
				<Typography variant="h6" gutterBottom>
					Test level
				</Typography>
			</FormLabel>
			<RadioGroup
				aria-labelledby="test-level-label"
				value={value}
				onChange={(e) => onChange(e.target.value as SoilTestLevel)}
			>
				{TEST_LEVEL_OPTIONS.map((opt) => (
					<FormControlLabel
						key={opt.value}
						value={opt.value}
						control={<Radio />}
						label={
							<>
								<Typography component="span" fontWeight={600}>
									{opt.label}
								</Typography>
								<Typography
									component="div"
									variant="body2"
									color="text.secondary"
								>
									{opt.description}
								</Typography>
							</>
						}
						sx={{ alignItems: "flex-start", py: 1 }}
					/>
				))}
			</RadioGroup>
		</FormControl>
	);
}
