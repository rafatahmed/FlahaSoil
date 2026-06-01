/**
 * FlahaSOIL v2 — top application bar (Phase 8C-A).
 *
 * Displays the FlahaSOIL brand, the current page title, an optional
 * active project context, a global search placeholder, a session user
 * chip, and a "New soil test" quick action. The bar reads page state
 * from `PageHeaderContext`, so it stays in sync with whichever route
 * is mounted without prop drilling.
 *
 * On mobile (<md) the menu button becomes the drawer toggle and the
 * search field collapses to free up space.
 */
import {
	AppBar,
	Box,
	Button,
	IconButton,
	InputAdornment,
	Stack,
	TextField,
	Toolbar,
	Tooltip,
	Typography,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";

import { SessionUserChip } from "../../session";
import { FlahaLogo } from "./FlahaLogo";
import { usePageHeaderState } from "../PageHeaderContext";

interface TopAppBarProps {
	drawerWidth: number;
	onMenuClick: () => void;
}

export function TopAppBar({ drawerWidth, onMenuClick }: TopAppBarProps) {
	const theme = useTheme();
	const navigate = useNavigate();
	const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
	const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
	const header = usePageHeaderState();

	return (
		<AppBar
			position="fixed"
			elevation={0}
			sx={{
				zIndex: theme.zIndex.drawer + 1,
				width: { md: `calc(100% - ${drawerWidth}px)` },
				ml: { md: `${drawerWidth}px` },
				borderBottom: `1px solid ${theme.palette.divider}`,
			}}
		>
			<Toolbar sx={{ gap: 2, minHeight: 64 }}>
				{!isDesktop && (
					<IconButton
						color="inherit"
						edge="start"
						onClick={onMenuClick}
						aria-label="Open navigation"
					>
						<MenuIcon />
					</IconButton>
				)}

				{!isDesktop && <FlahaLogo size={26} variant={isPhone ? "mark" : "full"} />}

				<Box sx={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
					<Typography
						variant="subtitle1"
						sx={{
							color: "inherit",
							fontWeight: 600,
							lineHeight: 1.2,
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
						}}
					>
						{header.title}
					</Typography>
					{header.projectContext && (
						<Typography
							variant="caption"
							sx={{
								color: "inherit",
								opacity: 0.8,
								lineHeight: 1.2,
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							Project · {header.projectContext.name}
							{header.projectContext.code ? ` (${header.projectContext.code})` : ""}
						</Typography>
					)}
				</Box>

				{!isPhone && (
					<TextField
						size="small"
						placeholder="Search projects, samples, tests…"
						disabled
						sx={{
							width: { sm: 220, md: 320 },
							"& .MuiInputBase-root": {
								backgroundColor: "rgba(255,255,255,0.12)",
								color: "inherit",
							},
							"& .MuiInputBase-input::placeholder": {
								color: "rgba(255,255,255,0.7)",
								opacity: 1,
							},
						}}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon sx={{ color: "inherit", opacity: 0.7 }} fontSize="small" />
								</InputAdornment>
							),
						}}
					/>
				)}

				<Tooltip title="Start a new soil test">
					<Button
						variant="contained"
						color="primary"
						size="small"
						startIcon={!isPhone ? <AddIcon /> : undefined}
						onClick={() => navigate("/soil-tests/new")}
						sx={{ whiteSpace: "nowrap" }}
					>
						{isPhone ? <AddIcon fontSize="small" /> : "New soil test"}
					</Button>
				</Tooltip>

				<Stack direction="row" alignItems="center" sx={{ pl: 1 }}>
					<SessionUserChip />
				</Stack>
			</Toolbar>
		</AppBar>
	);
}
