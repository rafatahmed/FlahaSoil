/**
 * FlahaSOIL v2 — TenantSwitcher unit tests (Phase 9A-H).
 *
 * Renders the picker against a hand-rolled `AuthContext.Provider` so we
 * can control the `memberships` + `activeOrganization` props and assert
 * the rendered menu items + click behaviour without spinning up the
 * full `AuthProvider` + API client stack.
 */
import { act, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
	MembershipStatus,
	OrganizationRole,
	OrganizationStatus,
	OrganizationType,
	UserRole,
	type OrganizationDTO,
	type OrganizationMembershipDTO,
	type UserDTO,
} from "@flaha/shared-types";
import { describe, expect, it, vi } from "vitest";

import {
	AuthContext,
	type AuthActions,
	type AuthContextValue,
	type AuthStatus,
} from "../../../auth/AuthContext";
import { TenantSwitcher } from "../TenantSwitcher";

const theme = createTheme();
const NOW = new Date().toISOString();

const USER: UserDTO = {
	id: "user_1",
	email: "owner@example.com",
	displayName: "Owner",
	role: UserRole.AGRONOMIST,
	createdAt: NOW,
	updatedAt: NOW,
	archivedAt: null,
};

function makeOrg(id: string, name: string): OrganizationDTO {
	return {
		id,
		name,
		slug: id,
		type: OrganizationType.COMPANY,
		status: OrganizationStatus.ACTIVE,
		createdAt: NOW,
		updatedAt: NOW,
	};
}

function makeMembership(
	id: string,
	org: OrganizationDTO,
	role: OrganizationRole
): OrganizationMembershipDTO {
	return {
		id,
		organizationId: org.id,
		userId: USER.id,
		role,
		status: MembershipStatus.ACTIVE,
		invitedById: null,
		invitedAt: null,
		acceptedAt: NOW,
		createdAt: NOW,
		updatedAt: NOW,
		organization: org,
	};
}

function renderWith(value: AuthContextValue) {
	return render(
		<ThemeProvider theme={theme}>
			<AuthContext.Provider value={value}>
				<TenantSwitcher />
			</AuthContext.Provider>
		</ThemeProvider>
	);
}

function makeActions(
	overrides: Partial<AuthActions> = {}
): AuthActions {
	return {
		register: vi.fn(),
		login: vi.fn(),
		logout: vi.fn(),
		refresh: vi.fn(),
		switchOrganization: vi.fn(),
		...overrides,
	};
}

function makeContext(args: {
	status?: AuthStatus;
	memberships: OrganizationMembershipDTO[];
	activeOrganization: OrganizationDTO | null;
	actions?: AuthActions;
}): AuthContextValue {
	return {
		status: args.status ?? "authenticated",
		user: USER,
		activeOrganization: args.activeOrganization,
		memberships: args.memberships,
		error: null,
		actions: args.actions ?? makeActions(),
	};
}

describe("TenantSwitcher", () => {
	it("renders nothing for unauthenticated sessions", () => {
		const { container } = renderWith(
			makeContext({
				status: "unauthenticated",
				memberships: [],
				activeOrganization: null,
			})
		);
		// Plain DOM assertion — avoids depending on the jest-dom matcher
		// augmentation in the typecheck step (matches AuthProvider.test.tsx).
		expect(container.firstChild).toBeNull();
	});

	it("renders nothing when the user has fewer than 2 memberships", () => {
		const personal = makeOrg("org_personal", "Personal");
		const { container } = renderWith(
			makeContext({
				memberships: [
					makeMembership("mem_1", personal, OrganizationRole.OWNER),
				],
				activeOrganization: personal,
			})
		);
		expect(container.firstChild).toBeNull();
	});

	it("renders the active org label and every membership in the menu", async () => {
		const personal = makeOrg("org_personal", "Personal Workspace");
		const demo = makeOrg("org_demo", "Flaha Demo Organization");
		renderWith(
			makeContext({
				memberships: [
					makeMembership("mem_1", personal, OrganizationRole.OWNER),
					makeMembership("mem_2", demo, OrganizationRole.AGRONOMIST),
				],
				activeOrganization: personal,
			})
		);

		const trigger = screen.getByRole("button", {
			name: /switch organization/i,
		});
		expect(trigger.textContent ?? "").toContain("Personal Workspace");

		await act(async () => {
			trigger.click();
		});

		await waitFor(() => {
			// `getByText` throws when the node is missing — sufficient as
			// an existence assertion without jest-dom matchers.
			screen.getByText("Flaha Demo Organization");
		});
		// Role chips are humanised from SCREAMING_SNAKE_CASE.
		screen.getByText("Owner");
		screen.getByText("Agronomist");
	});

	it("calls actions.switchOrganization when a different org is picked", async () => {
		const personal = makeOrg("org_personal", "Personal Workspace");
		const demo = makeOrg("org_demo", "Flaha Demo Organization");
		const switchOrganization = vi.fn().mockResolvedValue(undefined);
		renderWith(
			makeContext({
				memberships: [
					makeMembership("mem_1", personal, OrganizationRole.OWNER),
					makeMembership("mem_2", demo, OrganizationRole.AGRONOMIST),
				],
				activeOrganization: personal,
				actions: makeActions({ switchOrganization }),
			})
		);

		await act(async () => {
			screen.getByRole("button", { name: /switch organization/i }).click();
		});
		await waitFor(() => {
			screen.getByText("Flaha Demo Organization");
		});

		await act(async () => {
			screen.getByText("Flaha Demo Organization").click();
		});

		await waitFor(() => {
			expect(switchOrganization).toHaveBeenCalledWith("org_demo");
		});
	});

	it("does not call switchOrganization when the active org is reselected", async () => {
		const personal = makeOrg("org_personal", "Personal Workspace");
		const demo = makeOrg("org_demo", "Flaha Demo Organization");
		const switchOrganization = vi.fn().mockResolvedValue(undefined);
		renderWith(
			makeContext({
				memberships: [
					makeMembership("mem_1", personal, OrganizationRole.OWNER),
					makeMembership("mem_2", demo, OrganizationRole.AGRONOMIST),
				],
				activeOrganization: personal,
				actions: makeActions({ switchOrganization }),
			})
		);

		await act(async () => {
			screen.getByRole("button", { name: /switch organization/i }).click();
		});
		// "Personal Workspace" is now rendered twice: once in the trigger
		// button and once as the selected menu item. Wait until the menu
		// is open (>=2 matches) before targeting the menu entry.
		await waitFor(() => {
			expect(screen.getAllByText("Personal Workspace").length).toBeGreaterThanOrEqual(2);
		});
		const menuItem = screen.getByRole("menuitem", {
			name: /Personal Workspace/,
		});

		await act(async () => {
			// MUI MenuItem with `selected` still receives the click; the
			// guard inside TenantSwitcher must short-circuit it.
			menuItem.click();
		});

		expect(switchOrganization).not.toHaveBeenCalled();
	});
});
