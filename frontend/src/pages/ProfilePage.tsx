/**
 * FlahaSOIL v2 — user profile (Phase 8C-A).
 *
 * Lightweight workspace view for the current dev-session user.
 * Sections:
 *   - Identity: name, email, role, avatar.
 *   - Platform Activity: projects + samples derived from the project
 *     list. Test/report counts are deferred until a per-user index
 *     endpoint exists.
 *   - Session Information: dev-session vs. production mode, API mode.
 *   - Future Features: clearly-tagged placeholders for the next
 *     authentication, organisation, and API-access milestones.
 */
import {
	Avatar,
	Box,
	Card,
	CardContent,
	CardHeader,
	Chip,
	Divider,
	Stack,
	Typography,
} from "@mui/material";
import ApiIcon from "@mui/icons-material/Api";
import BusinessIcon from "@mui/icons-material/Business";
import LockIcon from "@mui/icons-material/Lock";
import { useEffect, useState } from "react";
import type { ProjectSummaryDTO } from "@flaha/shared-types";

import { usePageHeader } from "../layouts/PageHeaderContext";
import { getApiClient, getApiClientMode } from "../services/apiClientProvider";
import { useAuth } from "../auth";
import { flahaSoilColors } from "../theme/flahaSoilTheme";

interface FuturePlaceholder {
	title: string;
	detail: string;
	icon: typeof LockIcon;
}

const FUTURE: FuturePlaceholder[] = [
	{
		title: "Account Security",
		detail: "Password, multi-factor authentication, and session controls.",
		icon: LockIcon,
	},
	{
		title: "Organisation Settings",
		detail: "Teams, member roles, and project sharing across the organisation.",
		icon: BusinessIcon,
	},
	{
		title: "API Access",
		detail: "Personal access tokens, API rate limits, and audit logs.",
		icon: ApiIcon,
	},
];

function initials(name: string): string {
	const parts = name.trim().split(/\s+/);
	const head = parts[0]?.[0] ?? "?";
	const tail = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
	return (head + tail).toUpperCase();
}

export function ProfilePage() {
	const { user, status, activeOrganization } = useAuth();
	const role = user?.role ?? null;
	const apiMode = getApiClientMode();
	const [projects, setProjects] = useState<ProjectSummaryDTO[] | null>(null);

	usePageHeader({
		title: "User Workspace",
		subtitle: user ? `${user.displayName} · profile` : "Profile",
		breadcrumbs: [
			{ label: "Home", to: "/" },
			{ label: "Dashboard", to: "/dashboard" },
			{ label: "Profile" },
		],
	});

	useEffect(() => {
		if (status !== "authenticated") return;
		let cancelled = false;
		getApiClient()
			.listProjects({})
			.then((res) => {
				if (!cancelled) setProjects(res.projects);
			})
			.catch(() => {
				if (!cancelled) setProjects([]);
			});
		return () => {
			cancelled = true;
		};
	}, [status]);

	const sampleCount =
		projects === null ? null : projects.reduce((s, p) => s + p.sampleCount, 0);

	return (
		<Box>
			<Box
				sx={{
					display: "grid",
					gap: 3,
					gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
					mb: 3,
				}}
			>
				<Card>
					<CardHeader title="Identity" titleTypographyProps={{ variant: "h6" }} />
					<Divider />
					<CardContent>
						<Stack direction="row" spacing={2} alignItems="center">
							<Avatar
								sx={{
									width: 64,
									height: 64,
									bgcolor: flahaSoilColors.organicGreen,
									fontSize: 24,
								}}
							>
								{user ? initials(user.displayName) : "?"}
							</Avatar>
							<Box>
								<Typography variant="h6">
									{user?.displayName ?? "Unknown user"}
								</Typography>
								<Typography variant="body2" color="text.secondary">
									{user?.email ?? "No email on session"}
								</Typography>
								<Stack direction="row" spacing={1} sx={{ mt: 1 }}>
									{role && <Chip label={role} size="small" color="primary" />}
									{activeOrganization && (
										<Chip
											label={activeOrganization.name}
											size="small"
											variant="outlined"
										/>
									)}
								</Stack>
							</Box>
						</Stack>
					</CardContent>
				</Card>

				<Card>
					<CardHeader
						title="Session Information"
						titleTypographyProps={{ variant: "h6" }}
					/>
					<Divider />
					<CardContent>
						<Stack spacing={1.5}>
							<Row
								label="API mode"
								value={apiMode === "real" ? "Live backend" : "Demonstration mode"}
							/>
							<Row
								label="Status"
								value={status === "authenticated" ? "Signed in" : status}
							/>
							<Row label="User id" value={user?.id ?? "—"} />
							<Row
								label="Organization"
								value={activeOrganization?.name ?? "—"}
							/>
						</Stack>
					</CardContent>
				</Card>
			</Box>

			<PlatformActivity
				projectCount={projects === null ? null : projects.length}
				sampleCount={sampleCount}
			/>

			<Typography variant="h6" sx={{ mb: 1.5 }}>
				Future features
			</Typography>
			<Box
				sx={{
					display: "grid",
					gap: 2,
					gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
				}}
			>
				{FUTURE.map((f) => {
					const Icon = f.icon;
					return (
						<Card key={f.title} sx={{ height: "100%", opacity: 0.85 }}>
							<CardContent>
								<Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
									<Icon sx={{ color: "text.secondary" }} />
									<Typography variant="subtitle1">{f.title}</Typography>
									<Chip
										label="Available in future release"
										size="small"
										variant="outlined"
										sx={{ ml: "auto" }}
									/>
								</Stack>
								<Typography variant="body2" color="text.secondary">
									{f.detail}
								</Typography>
							</CardContent>
						</Card>
					);
				})}
			</Box>
		</Box>
	);
}

function Row({ label, value }: { label: string; value: string }) {
	return (
		<Stack direction="row" justifyContent="space-between">
			<Typography variant="body2" color="text.secondary">
				{label}
			</Typography>
			<Typography variant="body2">{value}</Typography>
		</Stack>
	);
}

interface PlatformActivityProps {
	projectCount: number | null;
	sampleCount: number | null;
}

function PlatformActivity({ projectCount, sampleCount }: PlatformActivityProps) {
	return (
		<Card sx={{ mb: 3 }}>
			<CardHeader
				title="Platform Activity"
				titleTypographyProps={{ variant: "h6" }}
				subheader="Aggregated across your accessible projects"
				subheaderTypographyProps={{ variant: "caption" }}
			/>
			<Divider />
			<CardContent>
				<Box
					sx={{
						display: "grid",
						gap: 2,
						gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
					}}
				>
					<Stat label="Projects" value={projectCount} />
					<Stat label="Samples" value={sampleCount} />
					<Stat label="Tests" value="Per project" muted />
					<Stat label="Reports" value="Per project" muted />
				</Box>
			</CardContent>
		</Card>
	);
}

function Stat({
	label,
	value,
	muted,
}: {
	label: string;
	value: number | string | null;
	muted?: boolean;
}) {
	return (
		<Box>
			<Typography variant="caption" color="text.secondary">
				{label}
			</Typography>
			<Typography
				variant="h5"
				sx={{ color: muted ? "text.secondary" : "text.primary", fontWeight: 600 }}
			>
				{value ?? "—"}
			</Typography>
		</Box>
	);
}
