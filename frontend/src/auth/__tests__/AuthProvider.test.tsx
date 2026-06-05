/**
 * FlahaSOIL v2 — AuthProvider integration tests (Phase 9A-G).
 *
 * Covers the auth state machine end-to-end through React Testing
 * Library, with the API client provider stubbed so no network is
 * touched. Each scenario exercises one transition:
 *
 *   - silent refresh on mount → authenticated
 *   - silent refresh 401      → unauthenticated
 *   - login                   → authenticated + access token stored
 *   - logout                  → unauthenticated + access token cleared
 */
import { act, render, screen, waitFor } from "@testing-library/react";
import {
	MembershipStatus,
	OrganizationRole,
	OrganizationStatus,
	OrganizationType,
	UserRole,
	type AuthSessionDTO,
} from "@flaha/shared-types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearAccessToken, getAccessToken } from "../accessTokenStore";
import { AuthProvider } from "../AuthProvider";
import { useAuth } from "../useAuth";
import { ApiClientError } from "../../services/realApiV2Client";

/** Plain DOM assertion — avoids depending on the jest-dom matcher
 * augmentation in the typecheck step. */
function expectStatus(value: string): void {
	expect(screen.getByTestId("status").textContent).toBe(value);
}

const SESSION: AuthSessionDTO = {
	accessToken: "jwt-access-1",
	accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
	user: {
		id: "user_1",
		email: "alice@example.com",
		displayName: "Alice",
		role: UserRole.AGRONOMIST,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		archivedAt: null,
	},
	activeOrganization: {
		id: "org_1",
		name: "Alice's Workspace",
		slug: "alice-workspace",
		type: OrganizationType.COMPANY,
		status: OrganizationStatus.ACTIVE,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	memberships: [
		{
			id: "mem_1",
			organizationId: "org_1",
			userId: "user_1",
			role: OrganizationRole.OWNER,
			status: MembershipStatus.ACTIVE,
			invitedById: null,
			invitedAt: null,
			acceptedAt: new Date().toISOString(),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		},
	],
};

const client = {
	register: vi.fn(),
	login: vi.fn(),
	refresh: vi.fn(),
	logout: vi.fn(),
	switchOrganization: vi.fn(),
	listMyOrganizations: vi.fn(),
};

vi.mock("../../services/apiClientProvider", () => ({
	getApiClient: () => client,
	getApiClientMode: () => "real",
	setApiClientModeForTesting: () => {},
}));

function Probe() {
	const { status, user, activeOrganization, actions } = useAuth();
	return (
		<div>
			<div data-testid="status">{status}</div>
			<div data-testid="user">{user?.email ?? "—"}</div>
			<div data-testid="org">{activeOrganization?.name ?? "—"}</div>
			<button
				type="button"
				onClick={() =>
					void actions.login({ email: "a@b.test", password: "pw" }).catch(() => {})
				}
			>
				login
			</button>
			<button type="button" onClick={() => void actions.logout()}>
				logout
			</button>
		</div>
	);
}

beforeEach(() => {
	client.register.mockReset();
	client.login.mockReset();
	client.refresh.mockReset();
	client.logout.mockReset();
	client.switchOrganization.mockReset();
	client.listMyOrganizations.mockReset();
});

afterEach(() => {
	// Defence in case a test fails mid-transition before the provider
	// got a chance to clear the token.
	clearAccessToken();
});

describe("AuthProvider", () => {
	it("hydrates from a successful silent refresh on mount", async () => {
		client.refresh.mockResolvedValueOnce({ session: SESSION });

		render(
			<AuthProvider>
				<Probe />
			</AuthProvider>
		);

		await waitFor(() => expectStatus("authenticated"));
		expect(screen.getByTestId("user").textContent).toBe("alice@example.com");
		expect(screen.getByTestId("org").textContent).toBe("Alice's Workspace");
		expect(getAccessToken()?.token).toBe("jwt-access-1");
	});

	it("settles on unauthenticated when the silent refresh returns 401", async () => {
		client.refresh.mockRejectedValueOnce(
			new ApiClientError(401, "UNAUTHORIZED", "no session", undefined)
		);

		render(
			<AuthProvider>
				<Probe />
			</AuthProvider>
		);

		await waitFor(() => expectStatus("unauthenticated"));
		expect(getAccessToken()).toBeNull();
	});

	it("login stores the access token and flips status", async () => {
		client.refresh.mockRejectedValueOnce(
			new ApiClientError(401, "UNAUTHORIZED", "no session", undefined)
		);
		client.login.mockResolvedValueOnce({ session: SESSION });

		render(
			<AuthProvider>
				<Probe />
			</AuthProvider>
		);

		await waitFor(() => expectStatus("unauthenticated"));

		await act(async () => {
			screen.getByText("login").click();
		});

		await waitFor(() => expectStatus("authenticated"));
		expect(getAccessToken()?.token).toBe("jwt-access-1");
	});

	it("logout clears the access token even if the API call fails", async () => {
		client.refresh.mockResolvedValueOnce({ session: SESSION });
		client.logout.mockRejectedValueOnce(new Error("network down"));

		render(
			<AuthProvider>
				<Probe />
			</AuthProvider>
		);

		await waitFor(() => expectStatus("authenticated"));

		await act(async () => {
			screen.getByText("logout").click();
		});

		await waitFor(() => expectStatus("unauthenticated"));
		expect(getAccessToken()).toBeNull();
	});
});
