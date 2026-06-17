// FlahaSOIL v2 — Phase 10S browser smoke (CDP-driven).
//
// Spawns headless Chrome against the live SPA, programmatically logs
// the demo owner in via the SPA's own /auth/login flow, navigates to
// the soil-test detail page, clicks the Scientific Analysis tab, and
// reports what actually rendered (SVG count, sample-point anchors,
// console errors, network failures). Pure stdlib — no npm deps.
//
// Usage:
//   node scripts/browser-smoke-sa.mjs <soilTestId>

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SOIL_TEST_ID = process.argv[2];
if (!SOIL_TEST_ID) { console.error("usage: browser-smoke-sa.mjs <soilTestId>"); process.exit(2); }

const EMAIL = "owner@flahademo.test";
const PASSWORD = "FlahaDemo!2026";
const SPA = "http://localhost:5173";
const API = "http://localhost:3002/api/v2";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const USER_DIR = mkdtempSync(join(tmpdir(), "flaha-cdp-"));
const PORT = 9333;

const chrome = spawn(CHROME, [
	"--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
	`--remote-debugging-port=${PORT}`, `--user-data-dir=${USER_DIR}`, "about:blank",
], { stdio: "ignore" });

const cleanup = () => { try { chrome.kill(); } catch {} try { rmSync(USER_DIR, { recursive: true, force: true }); } catch {} };
process.on("exit", cleanup);

async function waitForCdp() {
	for (let i = 0; i < 50; i++) {
		try {
			const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
			if (r.ok) return (await r.json()).webSocketDebuggerUrl;
		} catch {}
		await new Promise((r) => setTimeout(r, 200));
	}
	throw new Error("Chrome CDP did not come up");
}

let nextId = 1;
const pending = new Map();
function send(ws, method, params = {}, sessionId) {
	const id = nextId++;
	const msg = { id, method, params, ...(sessionId ? { sessionId } : {}) };
	return new Promise((resolve, reject) => {
		pending.set(id, { resolve, reject });
		ws.send(JSON.stringify(msg));
	});
}

async function attachPageSession(ws) {
	const { targetInfos } = await send(ws, "Target.getTargets");
	const page = targetInfos.find((t) => t.type === "page");
	const { sessionId } = await send(ws, "Target.attachToTarget", { targetId: page.targetId, flatten: true });
	return sessionId;
}

const consoleMessages = [];
const networkFailures = [];

async function main() {
	const wsUrl = await waitForCdp();
	const ws = new WebSocket(wsUrl);
	await new Promise((r) => ws.addEventListener("open", r, { once: true }));
	ws.addEventListener("message", (ev) => {
		const m = JSON.parse(ev.data);
		if (m.id && pending.has(m.id)) { pending.get(m.id).resolve(m.result ?? m.error); pending.delete(m.id); return; }
		if (m.method === "Runtime.consoleAPICalled") {
			consoleMessages.push({ level: m.params.type, text: m.params.args.map((a) => a.value ?? a.description ?? "").join(" ") });
		}
		if (m.method === "Log.entryAdded") consoleMessages.push({ level: m.params.entry.level, text: m.params.entry.text });
		if (m.method === "Runtime.exceptionThrown") consoleMessages.push({ level: "exception", text: m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text });
		if (m.method === "Network.loadingFailed") networkFailures.push({ url: m.params.requestId, error: m.params.errorText });
		if (m.method === "Network.responseReceived" && m.params.response.status >= 400) {
			networkFailures.push({ url: m.params.response.url, status: m.params.response.status });
		}
	});

	const sid = await attachPageSession(ws);
	await send(ws, "Page.enable", {}, sid);
	await send(ws, "Runtime.enable", {}, sid);
	await send(ws, "Log.enable", {}, sid);
	await send(ws, "Network.enable", {}, sid);

	// Step 1: navigate to the SPA landing so we have an origin to write into.
	await send(ws, "Page.navigate", { url: `${SPA}/login` }, sid);
	await new Promise((r) => setTimeout(r, 1500));

	// Step 2: log in by calling /auth/login from the page context, store the
	// access token in window memory (the SPA's accessTokenStore reads from
	// memory, not localStorage). We then call setAccessToken via the SPA's
	// own module by triggering its login button instead.
	const loginScript = `
		(async () => {
			const r = await fetch("${API}/auth/login", {
				method: "POST", credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: "${EMAIL}", password: "${PASSWORD}" }),
			});
			if (!r.ok) return { ok: false, status: r.status };
			const data = await r.json();
			return { ok: true, hasToken: !!data.session?.accessToken };
		})();
	`;
	const login = await send(ws, "Runtime.evaluate", { expression: loginScript, awaitPromise: true, returnByValue: true }, sid);
	console.log("LOGIN:", JSON.stringify(login.result?.value));

	// Step 3: navigate to the soil test detail page (cookie now set, SPA will
	// silently refresh and mount).
	await send(ws, "Page.navigate", { url: `${SPA}/soil-tests/${SOIL_TEST_ID}` }, sid);
	await new Promise((r) => setTimeout(r, 4000));

	// Step 4: click the Scientific Analysis tab and wait for the panel.
	const clickScript = `
		(async () => {
			const tab = [...document.querySelectorAll('button[role="tab"]')].find((b) => /scientific/i.test(b.textContent || ""));
			if (!tab) return { error: "tab-not-found", tabs: [...document.querySelectorAll('button[role="tab"]')].map((b) => b.textContent) };
			tab.click();
			for (let i = 0; i < 40; i++) {
				const panel = document.querySelector('[data-testid="scientific-analysis-panel"]');
				if (panel) return { ok: true, html: panel.outerHTML.slice(0, 200) };
				const err = document.querySelector('[data-testid="scientific-analysis-error"]');
				if (err) return { ok: false, errorText: err.textContent };
				await new Promise((r) => setTimeout(r, 150));
			}
			const root = document.getElementById("root");
			return { ok: false, error: "panel-never-appeared", rootHtml: root ? root.innerHTML.slice(-500) : null };
		})();
	`;
	const click = await send(ws, "Runtime.evaluate", { expression: clickScript, awaitPromise: true, returnByValue: true }, sid);
	console.log("CLICK:", JSON.stringify(click.result?.value));

	// Step 5: inventory SVGs.
	const invScript = `({
		svgCount: document.querySelectorAll('[data-testid="scientific-analysis-panel"] svg').length,
		texturePoint: !!document.querySelector('[data-testid="texture-point"]'),
		retentionCurve: !!document.querySelector('[data-testid="retention-curve"]'),
		structurePoint: !!document.querySelector('[data-testid="structure-point"]'),
		panelBox: (() => { const p = document.querySelector('[data-testid="scientific-analysis-panel"]'); if (!p) return null; const r = p.getBoundingClientRect(); return { w: r.width, h: r.height }; })(),
		firstSvgBox: (() => { const s = document.querySelector('[data-testid="scientific-analysis-panel"] svg'); if (!s) return null; const r = s.getBoundingClientRect(); return { w: r.width, h: r.height }; })(),
	})`;
	const inv = await send(ws, "Runtime.evaluate", { expression: invScript, returnByValue: true }, sid);
	console.log("INVENTORY:", JSON.stringify(inv.result?.value));
	console.log("CONSOLE:", JSON.stringify(consoleMessages.filter((m) => m.level !== "log" && m.level !== "info").slice(0, 20)));
	console.log("NETWORK_FAILURES:", JSON.stringify(networkFailures.filter((f) => !String(f.url).includes("favicon")).slice(0, 20)));

	ws.close();
	cleanup();
}

main().catch((e) => { console.error("FATAL:", e); cleanup(); process.exit(1); });
