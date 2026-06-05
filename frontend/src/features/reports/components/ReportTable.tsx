/**
 * FlahaSOIL v2 — ReportTable (Phase 8D G.1).
 *
 * Lab-style two/three column table used by the physics, chemistry, and
 * appendix sections of the professional report. Renders blank rows as
 * an em-dash so the printable view never shows `null`/`undefined`.
 */
import {
	Box,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Typography,
} from "@mui/material";
import type { ReactNode } from "react";

import { flahaSoilColors } from "../../../theme/flahaSoilTheme";

export interface ReportTableRow {
	label: string;
	value: ReactNode | number | string | null | undefined;
	unit?: string;
	hint?: string;
}

export interface ReportTableProps {
	rows: ReportTableRow[];
	dense?: boolean;
	footnote?: string;
}

function formatValue(value: ReportTableRow["value"]): ReactNode {
	if (value === null || value === undefined || value === "") return "—";
	if (typeof value === "number") {
		if (!Number.isFinite(value)) return "—";
		return Number.isInteger(value) ? value.toString() : value.toFixed(2);
	}
	return value;
}

export function ReportTable({ rows, dense = true, footnote }: ReportTableProps) {
	return (
		<Box>
			<Table size={dense ? "small" : "medium"} aria-label="report table">
				<TableHead>
					<TableRow>
						<TableCell
							sx={{
								backgroundColor: flahaSoilColors.analyticalCream,
								color: flahaSoilColors.deepSoilBrown,
								fontWeight: 600,
								width: "55%",
							}}
						>
							Parameter
						</TableCell>
						<TableCell
							align="right"
							sx={{
								backgroundColor: flahaSoilColors.analyticalCream,
								color: flahaSoilColors.deepSoilBrown,
								fontWeight: 600,
							}}
						>
							Value
						</TableCell>
						<TableCell
							sx={{
								backgroundColor: flahaSoilColors.analyticalCream,
								color: flahaSoilColors.deepSoilBrown,
								fontWeight: 600,
								width: "20%",
							}}
						>
							Unit
						</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{rows.map((r) => (
						<TableRow key={r.label}>
							<TableCell>
								<Typography variant="body2">{r.label}</Typography>
								{r.hint && (
									<Typography variant="caption" color="text.secondary">
										{r.hint}
									</Typography>
								)}
							</TableCell>
							<TableCell align="right">
								<Typography variant="body2">{formatValue(r.value)}</Typography>
							</TableCell>
							<TableCell>
								<Typography variant="caption" color="text.secondary">
									{r.unit ?? ""}
								</Typography>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			{footnote && (
				<Typography
					variant="caption"
					color="text.secondary"
					sx={{ display: "block", mt: 1 }}
				>
					{footnote}
				</Typography>
			)}
		</Box>
	);
}
