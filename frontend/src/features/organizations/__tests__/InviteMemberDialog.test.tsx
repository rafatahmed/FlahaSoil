/**
 * FlahaSOIL v2 — InviteMemberDialog unit tests (Phase 9B-G fe).
 *
 * Covers the three behaviours the dialog owns:
 *   1. Pre-flight email validation surfaces an error without calling
 *      the API (the server is authoritative, but we want to catch typos
 *      before the round-trip).
 *   2. Valid submission canonicalises the email (trim + lowercase) and
 *      forwards (organizationId, { email, role }) to `createInvitation`.
 *   3. The `allowedRoles` prop scopes the role picker, so an ADMIN
 *      caller can't accidentally try to grant OWNER.
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { OrganizationRole } from "@flaha/shared-types";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InviteMemberDialog } from "../components/InviteMemberDialog";

const createInvitation = vi.fn();

vi.mock("../../../services/apiClientProvider", () => ({
	getApiClient: () => ({ createInvitation }),
}));

const theme = createTheme();

function renderDialog(
	overrides: Partial<React.ComponentProps<typeof InviteMemberDialog>> = {}
) {
	const onClose = vi.fn();
	const onCreated = vi.fn();
	render(
		<ThemeProvider theme={theme}>
			<InviteMemberDialog
				open
				organizationId="org_test"
				onClose={onClose}
				onCreated={onCreated}
				{...overrides}
			/>
		</ThemeProvider>
	);
	return { onClose, onCreated };
}

beforeEach(() => {
	createInvitation.mockReset();
});

describe("InviteMemberDialog", () => {
	it("rejects invalid emails before hitting the API", async () => {
		renderDialog();
		const email = screen.getByLabelText(/email/i) as HTMLInputElement;
		fireEvent.change(email, { target: { value: "not-an-email" } });
		await act(async () => {
			screen.getByRole("button", { name: /send invitation/i }).click();
		});
		expect(createInvitation).not.toHaveBeenCalled();
		expect(screen.getByText(/valid email/i)).toBeTruthy();
	});

	it("canonicalises email + submits the chosen role", async () => {
		createInvitation.mockResolvedValueOnce({ invitation: { id: "inv_1" } });
		const { onCreated } = renderDialog();

		fireEvent.change(screen.getByLabelText(/email/i), {
			target: { value: "  NEW.User@Example.COM  " },
		});
		await act(async () => {
			screen.getByRole("button", { name: /send invitation/i }).click();
		});

		await waitFor(() => {
			expect(createInvitation).toHaveBeenCalledTimes(1);
		});
		expect(createInvitation).toHaveBeenCalledWith("org_test", {
			email: "new.user@example.com",
			role: OrganizationRole.ADMIN,
		});
		expect(onCreated).toHaveBeenCalled();
	});

	it("scopes the role picker to allowedRoles", () => {
		renderDialog({
			allowedRoles: [
				OrganizationRole.AGRONOMIST,
				OrganizationRole.VIEWER,
			],
		});
		// The default selection is the first allowed role; the OWNER option
		// must never appear in the menu trigger label even when MUI's
		// Select renders just the current value.
		expect(screen.getByText(/AGRONOMIST/i)).toBeTruthy();
		// The trigger label should not include OWNER or ADMIN copy.
		expect(screen.queryByText(/^OWNER$/)).toBeNull();
		expect(screen.queryByText(/^ADMIN$/)).toBeNull();
	});

	it("surfaces server errors without calling onCreated", async () => {
		createInvitation.mockRejectedValueOnce(new Error("email already invited"));
		const { onCreated } = renderDialog();

		fireEvent.change(screen.getByLabelText(/email/i), {
			target: { value: "dup@example.com" },
		});
		await act(async () => {
			screen.getByRole("button", { name: /send invitation/i }).click();
		});

		await waitFor(() => {
			expect(screen.getByText(/email already invited/i)).toBeTruthy();
		});
		expect(onCreated).not.toHaveBeenCalled();
	});
});
