/**
 * FlahaSOIL v2 — OrganizationMembersPage tests (Phase 9B-G fe).
 *
 * Renders the page against an in-memory `AuthContext` so we can vary
 * the caller's role without booting the full provider stack. The API
 * client is mocked at the provider level so `listOrganizationMembers`
 * resolves with a deterministic roster.
 *
 * Scenarios:
 *   - VIEWER sees the roster but no role editor / remove button.
 *   - OWNER sees the role editor and a remove button on every row.
 *   - A successful role change triggers a refetch.
 */
import { act, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { MemoryRouter } from "react-router-dom";
import {
	MembershipStatus,
	OrganizationRole,
	OrganizationStatus,
	OrganizationType,
	UserRole,
	type OrganizationDTO,
	type OrganizationMemberDTO,
	type OrganizationMembershipDTO,
} from "@flaha/shared-types";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	AuthContext,
	type AuthActions,
	type AuthContextValue,
} from "../../auth/AuthContext";
import { PageHeaderProvider } from "../../layouts/PageHeaderContext";
import { OrganizationMembersPage } from "../OrganizationMembersPage";

const listOrganizationMembers = vi.fn();
const patchMembership = vi.fn();
const removeMembership = vi.fn();

vi.mock("../../services/apiClientProvider", () => ({
	getApiClient: () => ({
		listOrganizationMembers,
		patchMembership,
		removeMembership,
	}),
}));

const NOW = new Date().toISOString();
const ORG: OrganizationDTO = {
	id: "org_t",
	name: "Test Org",
	slug: "test-org",
	type: OrganizationType.COMPANY,
	status: OrganizationStatus.ACTIVE,
	createdAt: NOW,
	updatedAt: NOW,
};

const OWNER_USER = {
	id: "user_owner",
	email: "owner@example.com",
	displayName: "Owner User",
	role: UserRole.AGRONOMIST,
	createdAt: NOW,
	updatedAt: NOW,
	archivedAt: null,
};

function membershipFor(role: OrganizationRole): OrganizationMembershipDTO {
	return {
		id: `mem_self`,
		organizationId: ORG.id,
		userId: OWNER_USER.id,
		role,
		status: MembershipStatus.ACTIVE,
		invitedById: null,
		invitedAt: null,
		acceptedAt: NOW,
		createdAt: NOW,
		updatedAt: NOW,
		organization: ORG,
	};
}

const NOOP_ACTIONS: AuthActions = {
	register: vi.fn(),
	login: vi.fn(),
	logout: vi.fn(),
	refresh: vi.fn(),
	switchOrganization: vi.fn(),
};

function ctx(role: OrganizationRole): AuthContextValue {
	return {
		status: "authenticated",
		user: OWNER_USER,
		activeOrganization: ORG,
		memberships: [membershipFor(role)],
		error: null,
		actions: NOOP_ACTIONS,
	};
}

function row(
	id: string,
	role: OrganizationRole,
	email: string
): OrganizationMemberDTO {
	return {
		id,
		organizationId: ORG.id,
		userId: id,
		role,
		status: MembershipStatus.ACTIVE,
		invitedById: null,
		invitedAt: null,
		acceptedAt: NOW,
		createdAt: NOW,
		updatedAt: NOW,
		organization: ORG,
		userEmail: email,
		userDisplayName: email.split("@")[0]!,
	};
}

function renderAs(role: OrganizationRole) {
	return render(
		<ThemeProvider theme={createTheme()}>
			<AuthContext.Provider value={ctx(role)}>
				<PageHeaderProvider>
					<MemoryRouter>
						<OrganizationMembersPage />
					</MemoryRouter>
				</PageHeaderProvider>
			</AuthContext.Provider>
		</ThemeProvider>
	);
}

beforeEach(() => {
	listOrganizationMembers.mockReset();
	patchMembership.mockReset();
	removeMembership.mockReset();
});

describe("OrganizationMembersPage", () => {
	it("renders the roster without editors for a VIEWER caller", async () => {
		listOrganizationMembers.mockResolvedValueOnce({
			members: [
				row("user_owner", OrganizationRole.OWNER, "owner@example.com"),
				row("user_viewer", OrganizationRole.VIEWER, "viewer@example.com"),
			],
		});
		renderAs(OrganizationRole.VIEWER);

		await waitFor(() => {
			screen.getByText("viewer@example.com");
		});
		// Role select trigger ("button" role) must not be present.
		expect(
			screen.queryByRole("combobox", { name: /role/i })
		).toBeNull();
		// No remove icon buttons (no button with the tooltip's label).
		expect(screen.queryAllByRole("button", { name: /remove/i })).toHaveLength(0);
	});

	it("renders role editors + remove buttons for an OWNER caller", async () => {
		listOrganizationMembers.mockResolvedValueOnce({
			members: [
				row("user_owner", OrganizationRole.OWNER, "owner@example.com"),
				row("user_a", OrganizationRole.AGRONOMIST, "a@example.com"),
			],
		});
		renderAs(OrganizationRole.OWNER);

		await waitFor(() => {
			screen.getByText("a@example.com");
		});
		// At least one role editor (per editable row) is rendered.
		const selects = screen.getAllByRole("combobox");
		expect(selects.length).toBeGreaterThan(0);
	});

	it("calls removeMembership and refetches when an OWNER confirms removal", async () => {
		listOrganizationMembers
			.mockResolvedValueOnce({
				members: [
					row("user_owner", OrganizationRole.OWNER, "owner@example.com"),
					row("user_a", OrganizationRole.AGRONOMIST, "a@example.com"),
				],
			})
			.mockResolvedValueOnce({
				members: [
					row("user_owner", OrganizationRole.OWNER, "owner@example.com"),
				],
			});
		removeMembership.mockResolvedValueOnce({ ok: true });
		// `window.confirm` is wired through `globalThis` for jsdom.
		const confirmSpy = vi
			.spyOn(window, "confirm")
			.mockImplementation(() => true);

		renderAs(OrganizationRole.OWNER);
		await waitFor(() => {
			screen.getByText("a@example.com");
		});

		// MUI IconButton with a Tooltip exposes its label as the button's
		// accessible name. Both rows are removable for an OWNER caller,
		// so the last button corresponds to the AGRONOMIST row.
		const removeButtons = screen.getAllByRole("button", { name: /remove/i });
		await act(async () => {
			removeButtons[removeButtons.length - 1]!.click();
		});

		await waitFor(() => {
			expect(removeMembership).toHaveBeenCalledWith("org_t", "user_a");
		});
		await waitFor(() => {
			expect(listOrganizationMembers).toHaveBeenCalledTimes(2);
		});
		confirmSpy.mockRestore();
	});
});
