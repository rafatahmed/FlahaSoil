/**
 * FlahaSOIL v2 — page context bar (Phase 8C-A).
 *
 * Rendered just below the top app bar to display breadcrumb trail and
 * a one-line page subtitle. Hidden when neither is present (e.g.
 * landing page).
 */
import {
	Box,
	Breadcrumbs,
	Link as MuiLink,
	Typography,
	useTheme,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Link as RouterLink } from "react-router-dom";

import { usePageHeaderState } from "../PageHeaderContext";

export function PageContextBar() {
	const theme = useTheme();
	const { breadcrumbs, subtitle } = usePageHeaderState();
	const items = breadcrumbs ?? [];
	if (items.length === 0 && !subtitle) return null;

	return (
		<Box
			sx={{
				px: { xs: 2, md: 4 },
				py: 1.25,
				borderBottom: `1px solid ${theme.palette.divider}`,
				backgroundColor: theme.palette.background.paper,
			}}
		>
			{items.length > 0 && (
				<Breadcrumbs
					separator={<NavigateNextIcon fontSize="small" />}
					aria-label="breadcrumb"
					sx={{ fontSize: 13 }}
				>
					{items.map((crumb, idx) => {
						const isLast = idx === items.length - 1;
						if (isLast || !crumb.to) {
							return (
								<Typography
									key={`${crumb.label}-${idx}`}
									color={isLast ? "text.primary" : "text.secondary"}
									sx={{ fontSize: 13, fontWeight: isLast ? 600 : 400 }}
								>
									{crumb.label}
								</Typography>
							);
						}
						return (
							<MuiLink
								key={`${crumb.label}-${idx}`}
								component={RouterLink}
								to={crumb.to}
								underline="hover"
								color="text.secondary"
								sx={{ fontSize: 13 }}
							>
								{crumb.label}
							</MuiLink>
						);
					})}
				</Breadcrumbs>
			)}
			{subtitle && (
				<Typography variant="body2" color="text.secondary" sx={{ mt: items.length > 0 ? 0.5 : 0 }}>
					{subtitle}
				</Typography>
			)}
		</Box>
	);
}
