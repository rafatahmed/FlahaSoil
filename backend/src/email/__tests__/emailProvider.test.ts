/**
 * FlahaSOIL v2 API — EmailProvider unit tests (Phase 9B-E).
 *
 * Locks in the two safety contracts on `ConsoleEmailProvider`:
 *   1. In non-production it logs the rendered accept URL (the developer
 *      needs to be able to copy it).
 *   2. In production it REFUSES to log the accept URL and emits an
 *      error-level log so a missing real provider is loud.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { _resetEnvForTesting } from "../../config/env";
import { logger } from "../../utils/logger";
import {
	ConsoleEmailProvider,
	_resetEmailProviderForTesting,
	getEmailProvider,
	setEmailProvider,
	type EmailProvider,
	type InvitationEmailPayload,
} from "../emailProvider";

const payload: InvitationEmailPayload = {
	to: "invitee@example.com",
	organizationName: "Acme Soils",
	inviterDisplayName: "Owner User",
	role: "AGRONOMIST",
	acceptUrl: "https://app.example.com/invitations/accept?token=tok_secret",
	expiresAt: new Date("2026-12-31T00:00:00.000Z"),
};

const originalNodeEnv = process.env.NODE_ENV;

beforeEach(() => {
	_resetEnvForTesting();
	_resetEmailProviderForTesting();
});

afterEach(() => {
	process.env.NODE_ENV = originalNodeEnv;
	_resetEnvForTesting();
	_resetEmailProviderForTesting();
	vi.restoreAllMocks();
});

describe("ConsoleEmailProvider", () => {
	it("emits the accept URL via logger.info in development", async () => {
		process.env.NODE_ENV = "development";
		_resetEnvForTesting();
		const spy = vi.spyOn(logger, "info").mockImplementation(() => {});

		const provider = new ConsoleEmailProvider();
		await provider.sendInvitation(payload);

		expect(spy).toHaveBeenCalledTimes(1);
		const [msg, ctx] = spy.mock.calls[0]!;
		expect(msg).toBe("email.invitation.dispatched");
		expect((ctx as Record<string, unknown>)["acceptUrl"]).toBe(payload.acceptUrl);
		expect((ctx as Record<string, unknown>)["to"]).toBe(payload.to);
	});

	it("redacts the accept URL and logs at error level in production", async () => {
		process.env.NODE_ENV = "production";
		process.env.JWT_SECRET = "x".repeat(40);
		_resetEnvForTesting();
		const infoSpy = vi.spyOn(logger, "info").mockImplementation(() => {});
		const errorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

		const provider = new ConsoleEmailProvider();
		await provider.sendInvitation(payload);

		expect(infoSpy).not.toHaveBeenCalled();
		expect(errorSpy).toHaveBeenCalledTimes(1);
		const [msg, ctx] = errorSpy.mock.calls[0]!;
		expect(msg).toBe("email.console_provider_in_production");
		expect((ctx as Record<string, unknown>)["acceptUrl"]).toBeUndefined();
	});
});

describe("getEmailProvider / setEmailProvider", () => {
	it("returns a ConsoleEmailProvider by default", () => {
		const p = getEmailProvider();
		expect(p).toBeInstanceOf(ConsoleEmailProvider);
	});

	it("returns the same singleton on repeat access", () => {
		expect(getEmailProvider()).toBe(getEmailProvider());
	});

	it("setEmailProvider swaps the active provider", async () => {
		const calls: InvitationEmailPayload[] = [];
		const fake: EmailProvider = {
			async sendInvitation(p) {
				calls.push(p);
			},
		};
		setEmailProvider(fake);
		await getEmailProvider().sendInvitation(payload);
		expect(calls).toEqual([payload]);
	});
});
