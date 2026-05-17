/**
 * FlahaSOIL v2 — Project selector used by the soil-test wizard.
 *
 * Loads the user's projects through the active API client and exposes
 * them as a dropdown so the wizard never asks the user to type a raw
 * project id. A `+ Create project` shortcut opens the same
 * `NewProjectDialog` used by the Projects list page; the newly-created
 * project is preselected so the wizard can move on.
 */
import {
	Box,
	Button,
	CircularProgress,
	FormControl,
	FormHelperText,
	InputLabel,
	MenuItem,
	Select,
	Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useCallback, useEffect, useState } from "react";
import type { ProjectSummaryDTO } from "@flaha/shared-types";

import { getApiClient } from "../../../services/apiClientProvider";
import { NewProjectDialog } from "../../projects/components/NewProjectDialog";

interface ProjectSelectorProps {
	userId: string;
	value: string | null;
	onChange: (projectId: string) => void;
	disabled?: boolean;
}

export function ProjectSelector(props: ProjectSelectorProps) {
	const { userId, value, onChange, disabled } = props;
	const [projects, setProjects] = useState<ProjectSummaryDTO[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);

	const load = useCallback(() => {
		setError(null);
		getApiClient()
			.listProjects({ userId })
			.then((res) => setProjects(res.projects))
			.catch((err: unknown) =>
				setError(err instanceof Error ? err.message : String(err))
			);
	}, [userId]);

	useEffect(() => {
		load();
	}, [load]);

	const handleCreated = (projectId: string) => {
		setDialogOpen(false);
		load();
		onChange(projectId);
	};

	if (projects === null && !error) {
		return (
			<Stack direction="row" spacing={1} alignItems="center">
				<CircularProgress size={16} />
				<Box>Loading projects…</Box>
			</Stack>
		);
	}

	return (
		<>
			<Stack direction="row" spacing={1} alignItems="flex-start">
				<FormControl fullWidth required error={!!error}>
					<InputLabel id="wizard-project-label">Project</InputLabel>
					<Select
						labelId="wizard-project-label"
						label="Project"
						value={value ?? ""}
						onChange={(e) => onChange(String(e.target.value))}
						disabled={disabled || (projects?.length ?? 0) === 0}
					>
						{(projects ?? []).map((p) => (
							<MenuItem key={p.id} value={p.id}>
								{p.name}
								{p.code ? ` (${p.code})` : ""}
							</MenuItem>
						))}
					</Select>
					<FormHelperText>
						{error
							? `Failed to load projects: ${error}`
							: projects?.length === 0
							? "You have no projects yet — create one to continue."
							: "Every soil sample must belong to a project."}
					</FormHelperText>
				</FormControl>
				<Button
					variant="outlined"
					startIcon={<AddIcon />}
					onClick={() => setDialogOpen(true)}
					sx={{ mt: 1, whiteSpace: "nowrap" }}
				>
					New
				</Button>
			</Stack>
			<NewProjectDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				onCreated={handleCreated}
				userId={userId}
			/>
		</>
	);
}
