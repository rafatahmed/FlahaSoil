/**
 * FlahaSOIL v2 — useActiveOrgAdmin hook tests (Phase 9B-G fe).
 *
 * Verifies the resolution rules the admin pages depend on:
 *   - `:organizationId` route param wins over the session's active org.
 *   - Falls back to the session's active org when no path param.
 *   - Derives the caller's role from `memberships` and exposes
 *     `isAdmin` / `isOwner` flags so admin-only UI can hide buttons.
 *   - Returns nulls when there is no active org at all.
 */
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import {
	MembershipStatus,
	OrganizationRole,
	OrganizationStatus,
	OrganizationType,
	UserRole,
	type OrganizationDTO,
	type OrganizationMembershipDTO,
} from "@flaha/shared-types";
import { describe, expect, it, vi } from "vitest";

import {
	AuthContext,
	type AuthActions,
	type AuthContextValue,
} from "../../../auth/AuthContext";
import { useActiveOrgAdmin } from "../useActiveOrgAdmin";

const NOW = new Date().toISOString();
const USER = {
	id: "user_1",
	email: "alice@example.com",
	displayName: "Alice",
	role: UserRole.AGRONOMIST,
	createdAt: NOW,
	updatedAt: NOW,
	archivedAt: null,
};

function makeOrg(id: string): OrganizationDTO {
	return {
		id,
		name: id,
		slug: id,
		type: OrganizationType.COMPANY,
		status: OrganizationStatus.ACTIVE,
		createdAt: NOW,
		updatedAt: NOW,
	};
}

function makeMembership(
	org: OrganizationDTO,
	role: OrganizationRole
): OrganizationMembershipDTO {
	return {
		id: `mem_${org.id}`,
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

const NOOP_ACTIONS: AuthActions = {
	register: vi.fn(),
	login: vi.fn(),
	logout: vi.fn(),
	refresh: vi.fn(),
	switchOrganization: vi.fn(),
};

function makeContext(
	memberships: OrganizationMembershipDTO[],
	activeOrganization: OrganizationDTO | null
): AuthContextValue {
	return {
		status: "authenticated",
		user: USER,
		activeOrganization,
		memberships,
		error: null,
		actions: NOOP_ACTIONS,
	};
}

function Probe() {
	const r = useActiveOrgAdmin();
	return (
		<div>
			<div data-testid="orgId">{r.organizationId ?? "—"}</div>
			<div data-testid="role">{r.role ?? "—"}</div>
			<div data-testid="isAdmin">{r.isAdmin ? "yes" : "no"}</div>
			<div data-testid="isOwner">{r.isOwner ? "yes" : "no"}</div>
		</div>
	);
}

function renderAt(path: string, value: AuthContextValue) {
	return render(
		<AuthContext.Provider value={value}>
			<MemoryRouter initialEntries={[path]}>
				<Routes>
					<Route path="/organizations/:organizationId/*" element={<Probe />} />
					<Route path="*" element={<Probe />} />
				</Routes>
			</MemoryRouter>
		</AuthContext.Provider>
	);
}

describe("useActiveOrgAdmin", () => {
	const orgA = makeOrg("org_a");
	const orgB = makeOrg("org_b");

	it("falls back to the session's active organization when no path param", () => {
		renderAt(
			"/somewhere",
			makeContext([makeMembership(orgA, OrganizationRole.OWNER)], orgA)
		);
		expect(screen.getByTestId("orgId").textContent).toBe("org_a");
		expect(screen.getByTestId("role").textContent).toBe(OrganizationRole.OWNER);
		expect(screen.getByTestId("isOwner").textContent).toBe("yes");
		expect(screen.getByTestId("isAdmin").textContent).toBe("yes");
	});

	it("prefers :organizationId from the route over the active org", () => {
		renderAt(
			"/organizations/org_b/members",
			makeContext(
				[
					makeMembership(orgA, OrganizationRole.OWNER),
					makeMembership(orgB, OrganizationRole.ADMIN),
				],
				orgA
			)
		);
		expect(screen.getByTestId("orgId").textContent).toBe("org_b");
		expect(screen.getByTestId("role").textContent).toBe(OrganizationRole.ADMIN);
		expect(screen.getByTestId("isAdmin").textContent).toBe("yes");
		expect(screen.getByTestId("isOwner").textContent).toBe("no");
	});

	it("returns nulls when no active org is resolvable", () => {
		renderAt("/dashboard", makeContext([], null));
		expect(screen.getByTestId("orgId").textContent).toBe("—");
		expect(screen.getByTestId("isAdmin").textContent).toBe("no");
	});
});
