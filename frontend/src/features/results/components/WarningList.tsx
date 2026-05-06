/**
 * FlahaSOIL v2 — warning list.
 *
 * Renders the `warnings: string[]` field from a calculate-response
 * or the `warningsJson` from an interpretation. Empty list renders
 * nothing.
 */
import { Alert, Stack } from "@mui/material";

interface WarningListProps {
	warnings: readonly string[] | null | undefined;
	severity?: "info" | "warning" | "error";
}

export function WarningList({
	warnings,
	severity = "warning",
}: WarningListProps) {
	if (!warnings || warnings.length === 0) return null;
	return (
		<Stack spacing={1}>
			{warnings.map((w, i) => (
				<Alert key={i} severity={severity} variant="outlined">
					{w}
				</Alert>
			))}
		</Stack>
	);
}
