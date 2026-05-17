/**
 * FlahaSOIL v2 — New project dialog (Phase 8A).
 *
 * Modal form used by `ProjectsListPage` and the wizard's project
 * selector to create a project on the fly. Issues
 * `createProject` against the active API client and invokes
 * `onCreated(projectId)` so the caller can navigate or refresh.
 */
import {
	Alert,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Stack,
	TextField,
} from "@mui/material";
import { useState } from "react";

import { getApiClient } from "../../../services/apiClientProvider";

interface NewProjectDialogProps {
	open: boolean;
	onClose: () => void;
	onCreated: (projectId: string) => void;
	userId: string;
}

export function NewProjectDialog(props: NewProjectDialogProps) {
	const { open, onClose, onCreated, userId } = props;
	const [name, setName] = useState("");
	const [code, setCode] = useState("");
	const [locationName, setLocationName] = useState("");
	const [description, setDescription] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const reset = () => {
		setName("");
		setCode("");
		setLocationName("");
		setDescription("");
		setError(null);
		setSubmitting(false);
	};

	const handleClose = () => {
		if (submitting) return;
		reset();
		onClose();
	};

	const handleSubmit = async () => {
		if (name.trim().length === 0) {
			setError("Project name is required.");
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			const res = await getApiClient().createProject({
				userId,
				name: name.trim(),
				code: code.trim() || null,
				locationName: locationName.trim() || null,
				description: description.trim() || null,
			});
			reset();
			onCreated(res.project.id);
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
			setSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
			<DialogTitle>New project</DialogTitle>
			<DialogContent>
				<Stack spacing={2} sx={{ mt: 1 }}>
					{error && <Alert severity="error">{error}</Alert>}
					<TextField
						label="Project name"
						required
						fullWidth
						autoFocus
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
					<TextField
						label="Project code"
						fullWidth
						helperText="Optional short identifier (e.g. DOHA-01). Must be unique per user."
						value={code}
						onChange={(e) => setCode(e.target.value)}
					/>
					<TextField
						label="Location"
						fullWidth
						value={locationName}
						onChange={(e) => setLocationName(e.target.value)}
					/>
					<TextField
						label="Description"
						fullWidth
						multiline
						minRows={2}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
					/>
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose} disabled={submitting}>
					Cancel
				</Button>
				<Button
					variant="contained"
					onClick={handleSubmit}
					disabled={submitting || name.trim().length === 0}
				>
					{submitting ? "Creating…" : "Create project"}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
