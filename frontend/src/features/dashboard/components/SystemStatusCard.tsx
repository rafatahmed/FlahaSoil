/**
 * FlahaSOIL v2 — Dashboard system-status card.
 *
 * Shows the active API mode and a live liveness probe against
 * `/health` on the configured backend. The card only pings the real
 * backend when the app is running against it (`apiMode === "real"`);
 * in mock mode it reports "Mock client" so the indicator can never be
 * mistaken for a real backend signal.
 */
import {
	Card,
	CardContent,
	CardHeader,
	Chip,
	Divider,
	Stack,
	Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import { useEffect, useState } from "react";

import type { ApiClientMode } from "../../../services/apiClientProvider";

interface SystemStatusCardProps {
	apiMode: ApiClientMode;
}

type Status = "loading" | "ok" | "error" | "skipped";

interface HealthState {
	status: Status;
	detail: string;
}

function getApiBaseUrl(): string {
	const fromEnv = import.meta.env.VITE_API_BASE_URL;
	if (typeof fromEnv === "string" && fromEnv.length > 0) {
		return fromEnv.replace(/\/+$/, "");
	}
	return "http://localhost:3002/api/v2";
}

function healthUrl(): string {
	// `/health` lives at the server root, not under `/api/v2`.
	return getApiBaseUrl().replace(/\/api\/v2$/, "") + "/health";
}

export function SystemStatusCard({ apiMode }: SystemStatusCardProps) {
	const [health, setHealth] = useState<HealthState>(
		apiMode === "real"
			? { status: "loading", detail: "Checking backend…" }
			: { status: "skipped", detail: "Demonstration mode — sample data only." }
	);

	useEffect(() => {
		if (apiMode !== "real") return;
		let cancelled = false;
		setHealth({ status: "loading", detail: "Checking backend…" });
		fetch(healthUrl(), { method: "GET" })
			.then(async (res) => {
				if (cancelled) return;
				if (!res.ok) {
					setHealth({
						status: "error",
						detail: `HTTP ${res.status}`,
					});
					return;
				}
				const body = (await res.json().catch(() => null)) as
					| { status?: string; service?: string }
					| null;
				setHealth({
					status: "ok",
					detail: body?.service ?? "healthy",
				});
			})
			.catch((err: unknown) => {
				if (cancelled) return;
				setHealth({
					status: "error",
					detail: err instanceof Error ? err.message : String(err),
				});
			});
		return () => {
			cancelled = true;
		};
	}, [apiMode]);

	return (
		<Card variant="outlined">
			<CardHeader title="System status" />
			<Divider />
			<CardContent>
				<Stack spacing={2}>
					<Row label="API mode">
						<Chip
							label={apiMode === "real" ? "Live backend" : "Demonstration mode"}
							color={apiMode === "real" ? "primary" : "default"}
							size="small"
						/>
					</Row>
					<Row label="Backend health">
						<HealthChip health={health} />
					</Row>
					<Row label="API endpoint">
						<Typography variant="body2" color="text.secondary">
							{getApiBaseUrl()}
						</Typography>
					</Row>
				</Stack>
			</CardContent>
		</Card>
	);
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<Stack direction="row" justifyContent="space-between" alignItems="center">
			<Typography variant="body2" color="text.secondary">
				{label}
			</Typography>
			{children}
		</Stack>
	);
}

function HealthChip({ health }: { health: HealthState }) {
	if (health.status === "skipped") {
		return <Chip label={health.detail} size="small" />;
	}
	if (health.status === "loading") {
		return (
			<Chip icon={<HourglassEmptyIcon />} label="Checking…" size="small" />
		);
	}
	if (health.status === "ok") {
		return (
			<Chip
				icon={<CheckCircleIcon />}
				label={health.detail}
				color="success"
				size="small"
			/>
		);
	}
	return (
		<Chip
			icon={<ErrorIcon />}
			label={health.detail}
			color="error"
			size="small"
		/>
	);
}
