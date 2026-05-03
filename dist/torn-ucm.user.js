// ==UserScript==
// @name         Torn UCM - Ultimate Chain Manager
// @namespace    https://github.com/kneely/torn-ucm-userscript
// @version      0.0.12
// @description  Faction chain coordination for Torn - real-time commands, attack blocking, and presence tracking
// @author       kneely
// @match        https://www.torn.com/*
// @grant        GM_xmlhttpRequest
// @require      https://esm.run/posthog-js@1.372.6/dist/array.js
// @connect      ucm.neelyinno.com
// @connect      us.i.posthog.com
// @connect      us-assets.i.posthog.com
// @run-at       document-idle
// ==/UserScript==
(function() {
	//#region src/lib/posthog.js
	var APP_NAME = "torn-ucm-userscript";
	var RELEASE = `${APP_NAME}@0.0.11`;
	var SENSITIVE_KEY_PATTERN = /apiKey|apikey|key|token|sessionToken|secret|authorization/i;
	var SENSITIVE_URL_PATTERN = /([?&][^=]*(?:token|key|secret)[^=]*=)[^&\s]+/gi;
	var initRequested = false;
	function redactValue(key, value) {
		if (SENSITIVE_KEY_PATTERN.test(key)) return value ? "***" : value;
		if (/url|href/i.test(key) && typeof value === "string") return value.replace(SENSITIVE_URL_PATTERN, "$1***");
		return value;
	}
	function redactObject(value) {
		if (!value || typeof value !== "object") return value;
		if (Array.isArray(value)) return value.map(redactObject);
		const redacted = {};
		for (const [key, entryValue] of Object.entries(value)) if (entryValue && typeof entryValue === "object") redacted[key] = redactObject(entryValue);
		else redacted[key] = redactValue(key, entryValue);
		return redacted;
	}
	function mapLogLevel(level) {
		if (level === "ok") return "info";
		if (level === "warn") return "warn";
		if (level === "error") return "error";
		return "info";
	}
	function getPostHog() {
		if (typeof window !== "undefined" && window.posthog) return window.posthog;
		if (typeof globalThis !== "undefined" && globalThis.posthog) return globalThis.posthog;
		if (typeof unsafeWindow !== "undefined" && unsafeWindow.posthog) return unsafeWindow.posthog;
	}
	function callPostHog(methodName, ...args) {
		const posthog = getPostHog();
		const method = posthog?.[methodName];
		if (typeof method !== "function") return;
		try {
			method.apply(posthog, args);
		} catch {}
	}
	function initPostHog() {
		if (initRequested) return;
		initRequested = true;
		const posthog = getPostHog();
		if (!posthog || typeof posthog.init !== "function") return;
		posthog.init("phc_wnMwPVFMsUHMGA2BJ2rHfeYPEp24jC38DX4LA49EAYfg", {
			api_host: "https://us.i.posthog.com",
			defaults: "2026-01-30",
			capture_exceptions: {
				capture_unhandled_errors: true,
				capture_unhandled_rejections: true,
				capture_console_errors: true
			},
			logs: {
				serviceName: APP_NAME,
				environment: "production",
				serviceVersion: "0.0.11",
				maxLogsPerInterval: 500
			},
			before_send(event) {
				if (event?.properties) event.properties = redactObject(event.properties);
				return event;
			},
			loaded(posthog) {
				try {
					posthog.register({
						app: APP_NAME,
						app_version: "0.0.11",
						release: RELEASE,
						runtime: "userscript"
					});
					posthog.capture("ucm_posthog_loaded", {
						release: RELEASE,
						href: typeof window !== "undefined" ? window.location.href : ""
					});
				} catch {}
			}
		});
	}
	initPostHog();
	function captureDiagnostic(entry) {
		const attributes = redactObject({
			level: entry.level,
			area: entry.area,
			details: entry.details,
			ts: entry.ts,
			release: RELEASE
		});
		callPostHog("captureLog", {
			body: `[${entry.area}] ${entry.message}`,
			level: mapLogLevel(entry.level),
			attributes
		});
		callPostHog("capture", "ucm_diagnostic", {
			...attributes,
			message: entry.message
		});
	}
	function captureUcmException(error, context = {}) {
		const properties = redactObject({
			source: "ucm",
			release: RELEASE,
			...context.tags || {},
			...context.extra || {}
		});
		callPostHog("captureException", error, properties);
		callPostHog("captureLog", {
			body: error?.message || "unknown error",
			level: "error",
			attributes: properties
		});
		callPostHog("capture", "ucm_exception", {
			message: error?.message || "unknown error",
			...properties
		});
	}
	function updatePostHogUserContext({ memberId, factionId, permissionCount } = {}) {
		if (memberId) callPostHog("identify", String(memberId), {
			faction_id: factionId ? String(factionId) : null,
			permission_count: Number(permissionCount || 0)
		});
		callPostHog("register", {
			faction_id: factionId ? String(factionId) : "none",
			permission_count: Number(permissionCount || 0),
			has_member: Boolean(memberId),
			has_faction: Boolean(factionId)
		});
	}
	//#endregion
	//#region src/lib/storage.js
	function getCookie(name) {
		try {
			const encoded = encodeURIComponent(name) + "=";
			const cookies = document.cookie ? document.cookie.split("; ") : [];
			for (const cookie of cookies) if (cookie.startsWith(encoded)) return decodeURIComponent(cookie.slice(encoded.length));
		} catch {}
		return null;
	}
	function setCookie(name, value) {
		try {
			document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(String(value))}; path=/; max-age=${3600 * 24 * 365}; SameSite=Lax`;
			return true;
		} catch {
			return false;
		}
	}
	function storageGet(key) {
		try {
			const value = window.localStorage.getItem(key);
			if (value !== null) return value;
		} catch {}
		return getCookie(key);
	}
	function storageSet(key, value) {
		try {
			window.localStorage.setItem(key, value);
			return true;
		} catch {
			return setCookie(key, value);
		}
	}
	function storageRemove(key) {
		try {
			window.localStorage.removeItem(key);
		} catch {}
		try {
			document.cookie = `${encodeURIComponent(key)}=; path=/; max-age=0; SameSite=Lax`;
		} catch {}
	}
	//#endregion
	//#region src/config.js
	function resolveBackendURL() {
		const override = storageGet("ucm_backend_url");
		if (override) return override;
		return "https://ucm.neelyinno.com";
	}
	/**
	* UCM Userscript Configuration
	*/
	var CONFIG = {
		BACKEND_URL: resolveBackendURL(),
		PASS_DEFAULT_TTL_SECONDS: 45,
		MUTATION_OBSERVER_DEBOUNCE_MS: 100,
		SELECTORS: {
			CSS: "#react-root > div > div.playersModelWrap___dkqHO > div > div:nth-child(2) > div.playerArea___AEVBU > div.playerWindow___aDeDI > div.modal___lMj6N.defender___niX1M > div > div > div > button",
			XPATH: "/html/body/div[6]/div/div[2]/div[1]/div/div[2]/div/div[2]/div[3]/div[2]/div[2]/div/div/div/button"
		},
		STORAGE: {
			SESSION_TOKEN: "ucm_session_token",
			MEMBER_ID: "ucm_member_id",
			FACTION_ID: "ucm_faction_id",
			EVENT_CURSOR: "ucm_event_cursor",
			PERMISSIONS: "ucm_permissions"
		}
	};
	//#endregion
	//#region src/state/store.js
	/**
	* UCM local state store.
	* Single source of truth for the userscript's view of the world.
	*/
	var state = {
		sessionToken: null,
		memberId: null,
		factionId: null,
		permissions: [],
		members: [],
		currentChain: null,
		currentChainId: null,
		commandMode: "free",
		myActivePass: null,
		myAssignment: null,
		bonusLockAssigneeMemberId: null,
		eventCursor: 0,
		rsvps: {}
	};
	function saveSession(sessionToken, memberId, factionId, permissions = []) {
		state.sessionToken = sessionToken;
		state.memberId = memberId;
		state.factionId = factionId;
		state.permissions = permissions;
	}
	/**
	* Determine if the current member's attack button should be blocked.
	*/
	function isBlocked() {
		if (state.commandMode === "free" || state.commandMode === "controlled") return false;
		const hasExempt = state.permissions.includes("attack.block.exempt");
		if (state.commandMode === "hold_all") {
			if (hasExempt) return false;
			if (state.myActivePass) return false;
			return true;
		}
		if (state.commandMode === "bonus_lock") {
			if (hasExempt) return false;
			if (state.bonusLockAssigneeMemberId === state.memberId) return false;
			if (state.myActivePass) return false;
			return true;
		}
		return false;
	}
	/**
	* Get the reason string for the current block.
	*/
	function getBlockReason() {
		if (state.commandMode === "hold_all") return "Hold active";
		if (state.commandMode === "bonus_lock") return `Bonus hit reserved`;
		return "Blocked by Ultimate Chain Manager";
	}
	//#endregion
	//#region src/lib/diagnostics.js
	var MAX_ENTRIES = 150;
	var SENSITIVE_QUERY_KEYS = new Set([
		"apiKey",
		"apikey",
		"key",
		"token",
		"sessionToken",
		"access_token"
	]);
	var entries = [];
	var listeners = /* @__PURE__ */ new Set();
	var lastTransport = "unknown";
	var sseStatus = "idle";
	function getConsoleMethod(level) {
		if (level === "error") return "error";
		if (level === "warn") return "warn";
		return "log";
	}
	function notify() {
		for (const listener of listeners) try {
			listener(entries);
		} catch {}
	}
	function safeString(value) {
		if (value == null) return "";
		if (typeof value === "string") return value;
		try {
			return JSON.stringify(value);
		} catch {
			return String(value);
		}
	}
	function formatConsoleDetails(details) {
		if (details === void 0) return "";
		const text = safeString(details);
		return text ? ` ${text}` : "";
	}
	function redactUrl(value) {
		if (!value) return "";
		try {
			const url = new URL(String(value), window.location.href);
			for (const key of Array.from(url.searchParams.keys())) if (SENSITIVE_QUERY_KEYS.has(key) || /token|key|secret/i.test(key)) url.searchParams.set(key, "***");
			const query = url.searchParams.toString();
			return `${url.host}${url.pathname}${query ? `?${query}` : ""}`;
		} catch {
			return String(value).replace(/([?&][^=]*(?:token|key|secret)[^=]*=)[^&\s]+/gi, "$1***");
		}
	}
	function redactDetails(details = {}) {
		const redacted = {};
		for (const [key, value] of Object.entries(details || {})) if (/^(apiKey|apikey|key|token|sessionToken|secret|authorization)$/i.test(key)) redacted[key] = value ? "***" : value;
		else if (/url/i.test(key)) redacted[key] = redactUrl(value);
		else redacted[key] = value;
		return redacted;
	}
	function logDiagnostic(level, area, message, details = void 0) {
		const normalizedLevel = [
			"ok",
			"info",
			"warn",
			"error"
		].includes(level) ? level : "info";
		const entry = {
			id: Date.now() + Math.random(),
			ts: (/* @__PURE__ */ new Date()).toISOString(),
			level: normalizedLevel,
			area: area || "app",
			message: message || "",
			details: details === void 0 ? void 0 : redactDetails(details)
		};
		entries.push(entry);
		if (entries.length > MAX_ENTRIES) entries.shift();
		const consoleMethod = getConsoleMethod(normalizedLevel);
		console[consoleMethod](`[UCM][${entry.area}] ${entry.message}${formatConsoleDetails(entry.details)}`);
		captureDiagnostic(entry);
		if (normalizedLevel === "error") captureUcmException(/* @__PURE__ */ new Error(`[${entry.area}] ${entry.message}`), {
			tags: { area: entry.area },
			extra: { details: entry.details }
		});
		notify();
		return entry;
	}
	function setLastTransport(transport) {
		lastTransport = transport || "unknown";
	}
	function setSseStatus(status, details = void 0) {
		sseStatus = status || "unknown";
		logDiagnostic(status === "error" ? "error" : "info", "events", `Events ${sseStatus}`, details);
	}
	function getDiagnosticsEntries() {
		return [...entries];
	}
	function clearDiagnostics() {
		entries.length = 0;
		notify();
	}
	function getPlatformInfo() {
		const hasPdaGet = typeof PDA_httpGet === "function";
		const hasPdaPost = typeof PDA_httpPost === "function";
		const hasGmXmlHttpRequest = typeof GM_xmlhttpRequest === "function";
		const hasGmNamespaceRequest = typeof GM !== "undefined" && typeof GM.xmlHttpRequest === "function";
		const scriptVersion = typeof GM_info !== "undefined" && GM_info?.script?.version || "unknown";
		return {
			platform: hasPdaGet || hasPdaPost ? "TornPDA" : "Userscript manager",
			backendUrl: CONFIG.BACKEND_URL,
			scriptVersion,
			href: typeof window !== "undefined" ? window.location.href : "",
			readyState: typeof document !== "undefined" ? document.readyState : "",
			isTopWindow: typeof window !== "undefined" ? window.top === window.self : true,
			hasPdaGet,
			hasPdaPost,
			hasGmXmlHttpRequest,
			hasGmNamespaceRequest,
			hasFetch: typeof fetch === "function",
			lastTransport,
			sseStatus,
			hasSessionToken: Boolean(state.sessionToken),
			sessionTokenLength: state.sessionToken?.length || 0,
			memberId: state.memberId || null,
			factionId: state.factionId || null,
			permissionCount: Array.isArray(state.permissions) ? state.permissions.length : 0,
			currentChainId: state.currentChainId || null,
			commandMode: state.commandMode || null
		};
	}
	function serializeDiagnostics() {
		const platform = getPlatformInfo();
		const lines = [
			"UCM diagnostics",
			`Generated: ${(/* @__PURE__ */ new Date()).toISOString()}`,
			`Platform: ${platform.platform}`,
			`Backend: ${redactUrl(platform.backendUrl)}`,
			`Script version: ${platform.scriptVersion}`,
			`Transport: ${platform.lastTransport}`,
			`Events: ${platform.sseStatus}`,
			`Session: ${platform.hasSessionToken ? `present (${platform.sessionTokenLength})` : "missing"}`,
			`Member: ${platform.memberId || "-"}`,
			`Faction: ${platform.factionId || "-"}`,
			"",
			"Recent entries:"
		];
		for (const entry of entries) {
			const details = entry.details === void 0 ? "" : ` ${safeString(entry.details)}`;
			lines.push(`${entry.ts} ${entry.level.toUpperCase()} [${entry.area}] ${entry.message}${details}`);
		}
		return lines.join("\n");
	}
	if (typeof window !== "undefined") window.__UCM_DIAGNOSTICS__ = {
		clear: clearDiagnostics,
		entries: getDiagnosticsEntries,
		info: getPlatformInfo,
		text: serializeDiagnostics
	};
	//#endregion
	//#region src/lib/transport.js
	function getGmRequest() {
		if (typeof GM_xmlhttpRequest === "function") return GM_xmlhttpRequest;
		if (typeof GM !== "undefined" && typeof GM.xmlHttpRequest === "function") return GM.xmlHttpRequest.bind(GM);
		return null;
	}
	function getPdaTransport(method) {
		const normalized = String(method || "GET").toUpperCase();
		if (normalized === "GET" && typeof PDA_httpGet === "function") return PDA_httpGet;
		if (normalized === "POST" && typeof PDA_httpPost === "function") return PDA_httpPost;
		return null;
	}
	function responseTextFrom(value) {
		if (typeof value?.responseText === "string") return value.responseText;
		if (typeof value?.body === "string") return value.body;
		if (typeof value?.data === "string") return value.data;
		if (typeof value === "string") return value;
		return "";
	}
	function responseHeadersFrom(value) {
		if (typeof value?.responseHeaders === "string") return value.responseHeaders;
		if (typeof value?.headers === "string") return value.headers;
		if (value?.headers && typeof value.headers.forEach === "function") {
			const rows = [];
			value.headers.forEach((headerValue, headerName) => {
				rows.push(`${headerName}: ${headerValue}`);
			});
			return rows.join("\r\n");
		}
		return "";
	}
	function normalizeResponse(response, transport) {
		if (!response) throw new Error(`${transport} returned an empty response.`);
		const status = Number(response?.status || 0);
		return {
			ok: status >= 200 && status < 300,
			status,
			responseText: responseTextFrom(response),
			responseHeaders: responseHeadersFrom(response),
			transport
		};
	}
	function requestViaPda(method, url, opts) {
		const pdaTransport = getPdaTransport(method);
		if (!pdaTransport) return null;
		if (String(method || "GET").toUpperCase() === "GET") return pdaTransport(url).then((response) => normalizeResponse(response, "pda"));
		return pdaTransport(url, opts.headers || {}, opts.body || "").then((response) => normalizeResponse(response, "pda"));
	}
	function requestViaGm(method, url, opts) {
		const gmRequest = getGmRequest();
		if (!gmRequest) return null;
		return new Promise((resolve, reject) => {
			gmRequest({
				method,
				url,
				headers: opts.headers,
				data: opts.body,
				responseType: "text",
				onload: (response) => {
					resolve(normalizeResponse(response, "gm"));
				},
				onerror: () => {
					reject(/* @__PURE__ */ new Error("Userscript network request failed."));
				},
				ontimeout: () => {
					reject(/* @__PURE__ */ new Error("Userscript network request timed out."));
				}
			});
		});
	}
	async function requestViaFetch(method, url, opts) {
		const response = await fetch(url, opts);
		const responseText = response.status === 204 ? "" : await response.text();
		return normalizeResponse({
			status: response.status,
			responseText,
			headers: response.headers
		}, "fetch");
	}
	function getTransportCapabilities(method = "GET") {
		return {
			hasPdaTransport: Boolean(getPdaTransport(method)),
			hasGmTransport: Boolean(getGmRequest()),
			hasFetch: typeof fetch === "function"
		};
	}
	async function httpRequest(method, url, opts = {}) {
		const normalizedMethod = String(method || "GET").toUpperCase();
		const started = performance.now();
		const redactedUrl = redactUrl(url);
		const attempts = [];
		const preferPda = opts.preferPda !== false;
		const silent = opts.silent === true;
		if (!silent) logDiagnostic("info", "api", `${normalizedMethod} ${redactedUrl} start`, {
			hasPdaTransport: Boolean(getPdaTransport(normalizedMethod)),
			hasGmTransport: Boolean(getGmRequest()),
			hasFetch: typeof fetch === "function",
			preferPda
		});
		const runAttempt = async (name, requestFn) => {
			attempts.push(name);
			try {
				const response = await requestFn();
				setLastTransport(response.transport);
				const ms = Math.round(performance.now() - started);
				if (!silent) logDiagnostic(response.ok ? "ok" : "warn", "api", `${normalizedMethod} ${redactedUrl} -> ${response.status || "ERR"}`, {
					transport: response.transport,
					ms
				});
				return response;
			} catch (error) {
				const ms = Math.round(performance.now() - started);
				if (!silent) logDiagnostic("warn", "api", `${normalizedMethod} ${redactedUrl} ${name} failed`, {
					transport: name,
					ms,
					message: error?.message || "unknown error"
				});
				throw error;
			}
		};
		if (preferPda && getPdaTransport(normalizedMethod)) return runAttempt("pda", () => requestViaPda(normalizedMethod, url, opts));
		if (getGmRequest()) return runAttempt("gm", () => requestViaGm(normalizedMethod, url, opts));
		if (typeof fetch === "function") return runAttempt("fetch", () => requestViaFetch(normalizedMethod, url, opts));
		logDiagnostic("error", "api", `${normalizedMethod} ${redactedUrl} no transport available`, { attempts });
		throw new Error("No compatible network transport is available.");
	}
	//#endregion
	//#region src/api/client.js
	var REFRESH_SESSION_PATH = "/auth/refresh-session";
	var refreshSessionPromise = null;
	var ApiError = class extends Error {
		constructor(message, status, data = null) {
			super(message);
			this.name = "ApiError";
			this.status = status;
			this.data = data;
		}
	};
	function parseBody(contentType, text) {
		if (!text) return null;
		if (contentType.includes("application/json")) try {
			return JSON.parse(text);
		} catch {
			return null;
		}
		try {
			return JSON.parse(text);
		} catch {
			return { error: text };
		}
	}
	function parseTransportResponse(response) {
		const contentType = (response.responseHeaders?.match(/^content-type:\s*([^\r\n]+)/im))?.[1] || "";
		if (response.status === 204) return null;
		return parseBody(contentType, response.responseText || "");
	}
	function appendQueryToken(url) {
		if (!state.sessionToken) return url;
		try {
			const nextUrl = new URL(url);
			if (!nextUrl.searchParams.has("token")) nextUrl.searchParams.set("token", state.sessionToken);
			return nextUrl.toString();
		} catch {
			return `${url}${url.includes("?") ? "&" : "?"}token=${encodeURIComponent(state.sessionToken)}`;
		}
	}
	/**
	* Make an authenticated request to the UCM backend.
	*/
	async function requestOnce(method, path, body = null, options = {}) {
		let url = `${CONFIG.BACKEND_URL}${path}`;
		const isOnboardRequest = path === "/auth/onboard-member";
		const opts = {
			method,
			headers: { "Content-Type": "application/json" }
		};
		if (state.sessionToken) opts.headers.Authorization = `Bearer ${state.sessionToken}`;
		const capabilities = getTransportCapabilities(method);
		let usesQueryToken = false;
		if (method === "GET" && state.sessionToken && capabilities.hasPdaTransport) {
			url = appendQueryToken(url);
			usesQueryToken = true;
		}
		if (body) opts.body = JSON.stringify(body);
		if (isOnboardRequest) logDiagnostic("info", "onboarding", "onboarding request start", {
			method,
			url,
			...capabilities,
			usesQueryToken,
			timezone: body?.timezone,
			scriptVersion: body?.scriptVersion,
			apiKeyLength: body?.apiKey?.length || 0
		});
		let response;
		try {
			response = await httpRequest(method, url, {
				...opts,
				preferPda: options.preferPda,
				silent: options.silent
			});
		} catch (err) {
			if (isOnboardRequest) logDiagnostic("error", "onboarding", "onboarding request failed", { message: err?.message || "unknown error" });
			throw new Error(`Network request failed: ${err?.message || "unknown error"}`);
		}
		const data = parseTransportResponse(response);
		if (isOnboardRequest) logDiagnostic(response.ok ? "ok" : "warn", "onboarding", "onboarding request completed", {
			status: response.status,
			ok: response.ok,
			transport: response.transport,
			hasSessionToken: Boolean(data?.sessionToken)
		});
		if (!response.ok) throw new ApiError(data?.error || data?.message || `Request failed: ${response.status}`, response.status, data);
		return data;
	}
	function persistSession$1(data) {
		state.sessionToken = data.sessionToken;
		state.memberId = data.member?.id || "";
		state.factionId = data.faction?.id || "";
		state.permissions = data.permissions || [];
		storageSet(CONFIG.STORAGE.SESSION_TOKEN, data.sessionToken);
		storageSet(CONFIG.STORAGE.MEMBER_ID, state.memberId);
		storageSet(CONFIG.STORAGE.FACTION_ID, state.factionId);
		storageSet(CONFIG.STORAGE.PERMISSIONS, JSON.stringify(state.permissions));
	}
	function clearSession() {
		state.sessionToken = null;
		state.memberId = null;
		state.factionId = null;
		state.permissions = [];
		storageRemove(CONFIG.STORAGE.SESSION_TOKEN);
		storageRemove(CONFIG.STORAGE.MEMBER_ID);
		storageRemove(CONFIG.STORAGE.FACTION_ID);
		storageRemove(CONFIG.STORAGE.PERMISSIONS);
	}
	function canRefreshSession(path) {
		return Boolean(state.sessionToken) && path !== "/auth/onboard-member" && path !== REFRESH_SESSION_PATH;
	}
	async function refreshSession() {
		if (!refreshSessionPromise) refreshSessionPromise = (async () => {
			const data = await requestOnce("POST", REFRESH_SESSION_PATH);
			if (!data?.sessionToken) throw new Error("Session refresh failed: missing session token.");
			persistSession$1(data);
			logDiagnostic("ok", "api", "session refreshed", {
				memberId: state.memberId || null,
				factionId: state.factionId || null,
				permissionCount: state.permissions.length
			});
			return data;
		})().catch((error) => {
			clearSession();
			throw error;
		}).finally(() => {
			refreshSessionPromise = null;
		});
		return refreshSessionPromise;
	}
	async function request(method, path, body = null, hasRetried = false, options = {}) {
		try {
			return await requestOnce(method, path, body, options);
		} catch (error) {
			if (!hasRetried && error?.status === 401 && canRefreshSession(path)) {
				logDiagnostic("warn", "api", "request unauthorized; refreshing session", { path });
				await refreshSession();
				return request(method, path, body, true, options);
			}
			throw error;
		}
	}
	async function onboard(apiKey, timezone, scriptVersion) {
		return request("POST", "/auth/onboard-member", {
			apiKey,
			timezone,
			clientHost: "tornpda",
			scriptVersion
		});
	}
	/**
	* Normalize chain response fields from .NET backend (camelCase) to the
	* property names the UI templates expect.
	*/
	function normalizeChain(raw) {
		if (!raw) return null;
		return {
			...raw,
			status: raw.chainStatus ?? raw.status,
			commandMode: raw.commandMode
		};
	}
	async function getCurrentChain() {
		const data = await request("GET", "/chains/current");
		return { chain: normalizeChain(data?.chain ?? data) };
	}
	async function listChains() {
		const data = await request("GET", "/chains");
		return { chains: (Array.isArray(data) ? data : []).map(normalizeChain) };
	}
	async function getChain(chainId) {
		return { chain: normalizeChain(await request("GET", `/chains/${chainId}`)) };
	}
	async function createChain(payload) {
		return { chain: normalizeChain(await request("POST", "/chains", payload)) };
	}
	async function rsvp(chainId, payload) {
		return request("POST", `/chains/${chainId}/rsvp`, payload);
	}
	async function holdAll(chainId, payload) {
		return request("POST", `/chains/${chainId}/commands/hold-all`, payload);
	}
	async function releaseAll(chainId, payload) {
		return request("POST", `/chains/${chainId}/commands/release-all`, payload);
	}
	async function assignTarget(chainId, payload) {
		return request("POST", `/chains/${chainId}/commands/assign-target`, payload);
	}
	async function issuePass(chainId, payload) {
		return request("POST", `/chains/${chainId}/commands/issue-one-time-pass`, payload);
	}
	async function addWatchlistEntry(chainId, payload) {
		return request("POST", `/chains/${chainId}/watchlist`, payload);
	}
	async function pollEvents(after = 0, timeoutMs = 15e3) {
		return request("GET", `/events/poll?${new URLSearchParams({
			after: String(Math.max(0, Number(after) || 0)),
			timeoutMs: String(timeoutMs)
		}).toString()}`, null, false, {
			preferPda: false,
			silent: true
		});
	}
	async function listMembers(chainId = "") {
		return request("GET", `/members${chainId ? `?chainId=${encodeURIComponent(chainId)}` : ""}`);
	}
	async function startChain(chainId) {
		return request("POST", `/chains/${chainId}/start`, {});
	}
	async function endChain(chainId, payload) {
		return request("POST", `/chains/${chainId}/end`, payload);
	}
	//#endregion
	//#region src/ui/onboarding.js
	var MODAL_ID = "ucm-onboarding-modal";
	var EMPTY_SESSION_VALUES = new Set([
		"",
		"undefined",
		"null"
	]);
	var routeWatcherInstalled = false;
	var onboardingDismissed = false;
	function normalizeSessionToken(value) {
		if (value == null) return null;
		const normalized = String(value).trim();
		if (EMPTY_SESSION_VALUES.has(normalized.toLowerCase())) return null;
		return normalized || null;
	}
	function hasValidSessionToken(value) {
		return Boolean(normalizeSessionToken(value));
	}
	function isOnboardingEligibleRoute(locationHref = "") {
		try {
			const { hostname } = new URL(locationHref);
			return hostname === "www.torn.com";
		} catch {
			return false;
		}
	}
	function logOnboarding(message, details = void 0, level = "log") {
		logDiagnostic(level === "error" ? "error" : level === "warn" ? "warn" : "info", "onboarding", message, details);
	}
	function isOnboardingRoute() {
		return isOnboardingEligibleRoute(window.location.href);
	}
	function createModalMarkup() {
		return `
    <div class="ucm-onboarding-backdrop">
      <div class="ucm-onboarding-card" role="dialog" aria-modal="true" aria-labelledby="ucm-onboarding-title">
        <h2 id="ucm-onboarding-title">Ultimate Chain Manager</h2>
        <p class="ucm-onboarding-subtitle">Connect your Torn account to enable chain controls in TornPDA.</p>
        <p>Please use the following link to generate a Torn API key with the required permissions: <a href="https://www.torn.com/preferences.php#tab=api?step=addNewKey&user=faction,personalstats,profile,bars,cooldowns,inventory,refills,revives,revivesfull,travel,attacks&title=Ultimate Chain Manager" target="_blank" rel="noopener">link</a></p>

        <form id="ucm-onboarding-form" class="ucm-onboarding-form u-flex u-flex-col u-gap-ucm-2">
          <label for="ucm-api-key">Torn API Key</label>
          <input
            id="ucm-api-key"
            type="password"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            placeholder="Paste your API key"
            required
          />

          <button id="ucm-onboarding-submit" type="submit">Connect</button>
          <button id="ucm-onboarding-dismiss" class="ucm-secondary-button" type="button">Not now</button>
          <button id="ucm-onboarding-copy-diagnostics" class="ucm-secondary-button" type="button">Copy Diagnostics</button>
          <p id="ucm-onboarding-status" class="ucm-onboarding-status" aria-live="polite"></p>
        </form>
      </div>
    </div>
  `;
	}
	function mountModal() {
		if (!document.body) {
			logOnboarding("mountModal skipped: document.body not ready yet");
			return null;
		}
		const existing = document.getElementById(MODAL_ID);
		if (existing) {
			logOnboarding("mountModal reused existing modal root");
			return existing;
		}
		const root = document.createElement("div");
		root.id = MODAL_ID;
		root.innerHTML = createModalMarkup();
		document.body.appendChild(root);
		logOnboarding("mountModal created and appended modal root");
		return root;
	}
	function setStatus(text, kind = "info") {
		const statusEl = document.getElementById("ucm-onboarding-status");
		if (!statusEl) return;
		statusEl.textContent = text;
		statusEl.dataset.kind = kind;
	}
	function setPending(isPending) {
		const button = document.getElementById("ucm-onboarding-submit");
		const input = document.getElementById("ucm-api-key");
		if (button) {
			button.disabled = isPending;
			button.textContent = isPending ? "Connecting..." : "Connect";
		}
		if (input) input.disabled = isPending;
	}
	function dismissOnboardingModal() {
		onboardingDismissed = true;
		document.getElementById(MODAL_ID)?.remove();
		logOnboarding("modal dismissed by user");
	}
	function persistSession(data) {
		saveSession(data.sessionToken, data.member?.id, data.faction?.id, data.permissions || []);
		const okToken = storageSet(CONFIG.STORAGE.SESSION_TOKEN, data.sessionToken);
		const okMember = storageSet(CONFIG.STORAGE.MEMBER_ID, data.member?.id || "");
		const okFaction = storageSet(CONFIG.STORAGE.FACTION_ID, data.faction?.id || "");
		const okPerms = storageSet(CONFIG.STORAGE.PERMISSIONS, JSON.stringify(data.permissions || []));
		const tokenAfterWrite = storageGet(CONFIG.STORAGE.SESSION_TOKEN);
		const persisted = okToken && okMember && okFaction && okPerms;
		logOnboarding("persistSession write result", {
			persisted,
			okToken,
			okMember,
			okFaction,
			okPerms,
			tokenReadableAfterWrite: Boolean(tokenAfterWrite),
			tokenLength: tokenAfterWrite?.length || 0,
			memberId: data.member?.id || null,
			factionId: data.faction?.id || null,
			permissionCount: Array.isArray(data.permissions) ? data.permissions.length : 0
		});
		return persisted;
	}
	async function submitOnboarding(apiKey) {
		const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
		const scriptVersion = typeof GM_info !== "undefined" && GM_info?.script?.version || "0.1.0";
		logOnboarding("submitOnboarding request start", {
			backendUrl: CONFIG.BACKEND_URL,
			timezone,
			scriptVersion,
			apiKeyLength: apiKey.length
		});
		const response = await onboard(apiKey, timezone, scriptVersion);
		logOnboarding("submitOnboarding request success", {
			hasSessionToken: Boolean(response?.sessionToken),
			memberId: response?.member?.id || null,
			factionId: response?.faction?.id || null,
			permissionCount: Array.isArray(response?.permissions) ? response.permissions.length : 0
		});
		return response;
	}
	function bindFormIfNeeded() {
		const form = document.getElementById("ucm-onboarding-form");
		const apiKeyInput = document.getElementById("ucm-api-key");
		const dismissButton = document.getElementById("ucm-onboarding-dismiss");
		const copyDiagnosticsButton = document.getElementById("ucm-onboarding-copy-diagnostics");
		if (!form || !apiKeyInput) {
			logOnboarding("bindFormIfNeeded skipped: missing form or API key input", {
				hasForm: Boolean(form),
				hasInput: Boolean(apiKeyInput)
			});
			return;
		}
		if (form.dataset.ucmBound === "1") {
			logOnboarding("bindFormIfNeeded reused existing submit binding");
			apiKeyInput.focus();
			return;
		}
		form.dataset.ucmBound = "1";
		apiKeyInput.focus();
		logOnboarding("bindFormIfNeeded attached submit listener");
		dismissButton?.addEventListener("click", dismissOnboardingModal);
		copyDiagnosticsButton?.addEventListener("click", async () => {
			try {
				await navigator.clipboard.writeText(serializeDiagnostics());
				logOnboarding("diagnostics copied");
				setStatus("Diagnostics copied.", "success");
			} catch (err) {
				logOnboarding("diagnostics copy failed", { message: err?.message || "unknown error" }, "warn");
				setStatus("Unable to copy diagnostics. Use console __UCM_DIAGNOSTICS__.text().", "error");
			}
		});
		form.addEventListener("submit", async (event) => {
			event.preventDefault();
			const apiKey = apiKeyInput.value.trim();
			if (!apiKey) {
				logOnboarding("submit blocked: empty API key");
				setStatus("Please enter your Torn API key.", "error");
				return;
			}
			logOnboarding("submit started", {
				apiKeyLength: apiKey.length,
				href: window.location.href,
				readyState: document.readyState
			});
			setPending(true);
			setStatus("Connecting to UCM…");
			try {
				const response = await submitOnboarding(apiKey);
				if (!response?.sessionToken) throw new Error("Onboarding failed: missing session token.");
				if (!persistSession(response)) {
					logOnboarding("submit finished with storage persistence failure", { href: window.location.href }, "warn");
					setStatus("Connected, but storage is blocked in this context. Open this page in the main TornPDA view and try again.", "error");
					setPending(false);
					return;
				}
				logOnboarding("submit completed successfully; reloading page");
				setStatus("Connected. Reloading…", "success");
				setTimeout(() => {
					window.location.reload();
				}, 600);
			} catch (err) {
				logOnboarding("submit failed", {
					message: err?.message || "unknown error",
					stack: err?.stack || null
				}, "error");
				setStatus(err?.message || "Onboarding failed. Please try again.", "error");
				setPending(false);
			}
		});
	}
	function showOnboardingModalForTornPda() {
		const routeEligible = isOnboardingRoute();
		const rawSessionToken = storageGet(CONFIG.STORAGE.SESSION_TOKEN);
		const hasSession = hasValidSessionToken(rawSessionToken);
		logOnboarding("eligibility check", {
			href: window.location.href,
			routeEligible,
			hasSessionToken: hasSession,
			sessionTokenLength: rawSessionToken?.length || 0,
			isTopWindow: window.top === window.self,
			readyState: document.readyState
		});
		if (hasSession) return false;
		if (!routeEligible) return false;
		if (onboardingDismissed) {
			logOnboarding("modal skipped: dismissed for current page load");
			return false;
		}
		const modalRoot = mountModal();
		logOnboarding("modal mount result", {
			mounted: Boolean(modalRoot),
			bodyReady: Boolean(document.body)
		});
		if (!modalRoot) return false;
		bindFormIfNeeded();
		return true;
	}
	function initOnboardingRouteWatcherForTornPda() {
		if (routeWatcherInstalled) {
			logOnboarding("route watcher already installed; skipping duplicate init");
			return;
		}
		routeWatcherInstalled = true;
		logOnboarding("installing route watcher");
		const tryShow = (reason = "manual") => {
			logOnboarding("route watcher trigger", {
				reason,
				href: window.location.href
			});
			showOnboardingModalForTornPda();
		};
		tryShow("initial");
		setTimeout(() => tryShow("retry-250ms"), 250);
		setTimeout(() => tryShow("retry-1000ms"), 1e3);
		setTimeout(() => tryShow("retry-2500ms"), 2500);
		window.addEventListener("hashchange", () => tryShow("hashchange"));
		window.addEventListener("popstate", () => tryShow("popstate"));
		const wrapHistory = (methodName) => {
			const original = history[methodName];
			if (typeof original !== "function") return;
			history[methodName] = function wrappedHistoryState(...args) {
				const result = original.apply(this, args);
				setTimeout(() => tryShow(`history.${methodName}`), 0);
				return result;
			};
			logOnboarding("wrapped history method", { methodName });
		};
		wrapHistory("pushState");
		wrapHistory("replaceState");
		if (document.readyState === "loading") {
			logOnboarding("document still loading; adding DOMContentLoaded retry");
			document.addEventListener("DOMContentLoaded", () => tryShow("DOMContentLoaded"), { once: true });
		}
	}
	//#endregion
	//#region src/ui/styles.js
	/**
	* Inject UCM styles into the page.
	*/
	function injectStyles() {
		const style = document.createElement("style");
		style.textContent = `
    :root {
      --ucm-font-display: "Avenir Next Condensed", "Arial Narrow", "Franklin Gothic Medium", sans-serif;
      --ucm-font-body: "Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif;
      --ucm-surface-base: #0b1317;
      --ucm-surface-panel: #101b21;
      --ucm-surface-strong: #15242c;
      --ucm-surface-muted: rgba(18, 33, 40, 0.82);
      --ucm-surface-soft: rgba(13, 22, 28, 0.72);
      --ucm-border-soft: rgba(180, 210, 218, 0.14);
      --ucm-border-strong: rgba(182, 230, 224, 0.28);
      --ucm-text-main: #eef6f3;
      --ucm-text-muted: #9eb3b3;
      --ucm-text-faint: #6f8688;
      --ucm-accent: #79e0c3;
      --ucm-accent-strong: #4ec3a1;
      --ucm-accent-warm: #f2b66d;
      --ucm-danger: #ff7d73;
      --ucm-success: #9df2bb;
      --ucm-info: #8cdbff;
      --ucm-shadow-panel: 0 28px 72px rgba(0, 0, 0, 0.44);
      --ucm-shadow-card: 0 14px 32px rgba(0, 0, 0, 0.22);
      --ucm-radius-xs: 10px;
      --ucm-radius-sm: 14px;
      --ucm-radius-md: 18px;
      --ucm-radius-lg: 26px;
      --ucm-space-1: 6px;
      --ucm-space-2: 10px;
      --ucm-space-3: 14px;
      --ucm-space-4: 18px;
      --ucm-space-5: 24px;
      --ucm-space-6: 32px;
      --ucm-panel-max-width: 32rem;
      --ucm-anim-fast: 140ms ease;
      --ucm-anim-panel: 220ms cubic-bezier(0.22, 1, 0.36, 1);
    }

    #ucm-block-banner {
      background: linear-gradient(135deg, #d84b3b 0%, #c22f3d 100%);
      color: #fff5f4;
      padding: 10px 16px;
      text-align: center;
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 0.02em;
      border-radius: var(--ucm-radius-xs);
      margin-bottom: 8px;
      z-index: 99999;
      font-family: var(--ucm-font-body);
      box-shadow: 0 10px 24px rgba(136, 22, 33, 0.28);
    }

    .ucm-notification {
      position: fixed;
      top: 12px;
      right: 12px;
      background: linear-gradient(180deg, rgba(16, 27, 33, 0.96) 0%, rgba(11, 19, 23, 0.98) 100%);
      color: var(--ucm-text-main);
      padding: 12px 16px;
      border-radius: var(--ucm-radius-sm);
      border: 1px solid var(--ucm-border-soft);
      font-size: 13px;
      font-family: var(--ucm-font-body);
      z-index: 100000;
      max-width: 22rem;
      box-shadow: var(--ucm-shadow-card);
      animation: ucm-slide-in 0.28s ease-out;
    }

    @keyframes ucm-slide-in {
      from { transform: translate3d(0, -8px, 0); opacity: 0; }
      to { transform: translate3d(0, 0, 0); opacity: 1; }
    }

    @keyframes ucm-slide-out {
      from { transform: translate3d(0, 0, 0); opacity: 1; }
      to { transform: translate3d(0, -8px, 0); opacity: 0; }
    }

    @keyframes ucm-panel-rise {
      from { transform: translate3d(0, 20px, 0); opacity: 0; }
      to { transform: translate3d(0, 0, 0); opacity: 1; }
    }

    @keyframes ucm-panel-slide-desktop {
      from { transform: translate3d(20px, 0, 0); opacity: 0; }
      to { transform: translate3d(0, 0, 0); opacity: 1; }
    }

    button[data-ucm-blocked="true"] {
      opacity: 0.5;
      cursor: not-allowed !important;
    }

    #ucm-onboarding-modal .ucm-onboarding-backdrop {
      position: fixed;
      inset: 0;
      z-index: 100001;
      background: rgba(6, 10, 12, 0.76);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18px;
    }

    #ucm-onboarding-modal .ucm-onboarding-card {
      width: min(420px, 100%);
      background: linear-gradient(180deg, #101b21 0%, #0b1317 100%);
      border: 1px solid var(--ucm-border-soft);
      border-radius: var(--ucm-radius-md);
      box-shadow: var(--ucm-shadow-panel);
      padding: 18px;
      color: var(--ucm-text-main);
      font-family: var(--ucm-font-body);
    }

    #ucm-onboarding-modal h2 {
      margin: 0;
      font-size: 20px;
      line-height: 1;
      font-weight: 700;
      color: var(--ucm-text-main);
      font-family: var(--ucm-font-display);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    #ucm-onboarding-modal .ucm-onboarding-subtitle {
      margin: 8px 0 14px;
      color: var(--ucm-text-muted);
      font-size: 13px;
      line-height: 1.5;
    }


    #ucm-onboarding-modal label,
    #ucm-chain-panel-root label {
      display: block;
      margin-bottom: 6px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ucm-text-faint);
    }

    #ucm-onboarding-modal input,
    #ucm-chain-panel-root .ucm-create-chain-form input,
    #ucm-chain-panel-root .ucm-create-chain-form textarea,
    #ucm-chain-panel-root .ucm-create-chain-form select,
    #ucm-chain-panel-root .ucm-subsection-card input,
    #ucm-chain-panel-root .ucm-subsection-card textarea,
    #ucm-chain-panel-root .ucm-subsection-card select,
    #ucm-chain-panel-root .ucm-command-modal-card input,
    #ucm-chain-panel-root .ucm-command-modal-card textarea,
    #ucm-chain-panel-root .ucm-command-modal-card select {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid transparent;
      background: rgba(7, 13, 16, 0.94);
      color: var(--ucm-text-main);
      border-radius: 12px;
      padding: 12px 14px;
      font-size: 14px;
      font-family: var(--ucm-font-body);
      outline: none;
      transition: border-color var(--ucm-anim-fast), box-shadow var(--ucm-anim-fast), background var(--ucm-anim-fast), transform var(--ucm-anim-fast);
      box-shadow: inset 0 0 0 1px rgba(180, 210, 218, 0.05);
    }

    #ucm-onboarding-modal input::placeholder,
    #ucm-chain-panel-root .ucm-create-chain-form input::placeholder,
    #ucm-chain-panel-root .ucm-create-chain-form textarea::placeholder,
    #ucm-chain-panel-root .ucm-subsection-card input::placeholder,
    #ucm-chain-panel-root .ucm-subsection-card textarea::placeholder,
    #ucm-chain-panel-root .ucm-command-modal-card input::placeholder,
    #ucm-chain-panel-root .ucm-command-modal-card textarea::placeholder {
      color: rgba(158, 179, 179, 0.72);
    }

    #ucm-onboarding-modal input:focus,
    #ucm-chain-panel-root .ucm-create-chain-form input:focus,
    #ucm-chain-panel-root .ucm-create-chain-form textarea:focus,
    #ucm-chain-panel-root .ucm-create-chain-form select:focus,
    #ucm-chain-panel-root .ucm-subsection-card input:focus,
    #ucm-chain-panel-root .ucm-subsection-card textarea:focus,
    #ucm-chain-panel-root .ucm-subsection-card select:focus,
    #ucm-chain-panel-root .ucm-command-modal-card input:focus,
    #ucm-chain-panel-root .ucm-command-modal-card textarea:focus,
    #ucm-chain-panel-root .ucm-command-modal-card select:focus {
      border-color: var(--ucm-border-strong);
      box-shadow: 0 0 0 3px rgba(121, 224, 195, 0.16);
      background: rgba(10, 18, 22, 0.98);
    }

    #ucm-onboarding-modal button,
    #ucm-chain-panel-root button {
      font-family: var(--ucm-font-body);
    }

    #ucm-onboarding-modal button,
    #ucm-chain-panel-root .ucm-create-chain-form button,
    #ucm-chain-panel-root .ucm-subsection-card button,
    #ucm-chain-panel-root .ucm-command-modal-card button,
    #ucm-chain-panel-root .ucm-inline-actions > button,
    #ucm-chain-panel-root .ucm-detail-tab,
    #ucm-chain-panel-root .ucm-floating-button,
    #ucm-chain-panel-root .ucm-primary-button {
      border: 0;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.02em;
      transition: transform var(--ucm-anim-fast), filter var(--ucm-anim-fast), opacity var(--ucm-anim-fast), background var(--ucm-anim-fast), color var(--ucm-anim-fast);
    }

    #ucm-onboarding-modal button,
    #ucm-chain-panel-root .ucm-create-chain-form button,
    #ucm-chain-panel-root .ucm-subsection-card button:not(.ucm-secondary-button),
    #ucm-chain-panel-root .ucm-command-modal-card button:not(.ucm-secondary-button),
    #ucm-chain-panel-root .ucm-inline-actions > button,
    #ucm-chain-panel-root .ucm-floating-button,
    #ucm-chain-panel-root .ucm-primary-button {
      padding: 12px 16px;
      background: linear-gradient(135deg, var(--ucm-accent) 0%, var(--ucm-accent-strong) 100%);
      color: #04110f;
      box-shadow: 0 10px 24px rgba(78, 195, 161, 0.26);
    }

    #ucm-chain-panel-root .ucm-secondary-button,
    #ucm-onboarding-modal .ucm-secondary-button,
    #ucm-chain-panel-root .ucm-command-modal-card .ucm-secondary-button,
    #ucm-chain-panel-root .ucm-detail-tab {
      padding: 11px 14px;
      background: rgba(255, 255, 255, 0.04);
      color: var(--ucm-text-muted);
      border: 1px solid var(--ucm-border-soft);
      box-shadow: none;
    }

    #ucm-chain-panel-root .ucm-detail-tab.is-active {
      background: rgba(121, 224, 195, 0.14);
      border-color: rgba(121, 224, 195, 0.34);
      color: var(--ucm-text-main);
      box-shadow: inset 0 0 0 1px rgba(121, 224, 195, 0.08);
    }

    #ucm-chain-panel-root button:hover:not(:disabled),
    #ucm-onboarding-modal button:hover:not(:disabled) {
      transform: translateY(-1px);
      filter: brightness(1.04);
    }

    #ucm-chain-panel-root button:active:not(:disabled),
    #ucm-onboarding-modal button:active:not(:disabled) {
      transform: translateY(0);
      filter: brightness(0.98);
    }

    #ucm-chain-panel-root button:focus-visible,
    #ucm-onboarding-modal button:focus-visible {
      outline: 2px solid rgba(121, 224, 195, 0.88);
      outline-offset: 2px;
    }

    #ucm-onboarding-modal button:disabled,
    #ucm-chain-panel-root button:disabled,
    #ucm-chain-panel-root input:disabled,
    #ucm-chain-panel-root textarea:disabled,
    #ucm-chain-panel-root select:disabled {
      opacity: 0.48;
      cursor: not-allowed;
    }

    #ucm-onboarding-modal .ucm-onboarding-status,
    #ucm-chain-panel-root .ucm-modal-status {
      min-height: 18px;
      margin: 0;
      font-size: 12px;
      color: var(--ucm-info);
    }

    #ucm-onboarding-modal .ucm-onboarding-status[data-kind="success"],
    #ucm-chain-panel-root .ucm-modal-status[data-kind="success"] {
      color: var(--ucm-success);
    }

    #ucm-onboarding-modal .ucm-onboarding-status[data-kind="error"],
    #ucm-chain-panel-root .ucm-modal-status[data-kind="error"] {
      color: var(--ucm-danger);
    }

    #ucm-chain-panel-root .ucm-floating-button {
      position: fixed;
      right: 16px;
      bottom: 18px;
      z-index: 100000;
      min-height: 48px;
      padding-inline: 18px;
      background: linear-gradient(135deg, #95f0cd 0%, #58cda8 100%);
      color: #06211b;
      font-family: var(--ucm-font-display);
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.34);
    }

    #ucm-chain-panel-root .ucm-panel-shell[hidden] {
      display: none;
    }

    #ucm-chain-panel-root .ucm-panel-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(4, 7, 9, 0.66);
      backdrop-filter: blur(8px);
      z-index: 100001;
    }

    #ucm-chain-panel-root .ucm-panel {
      position: fixed;
      inset: auto 0 0 0;
      z-index: 100002;
      display: flex;
      flex-direction: column;
      gap: var(--ucm-space-4);
      width: 100%;
      max-height: min(92vh, 58rem);
      overflow: auto;
      padding: max(16px, env(safe-area-inset-top)) 16px calc(20px + env(safe-area-inset-bottom));
      box-sizing: border-box;
      border-top-left-radius: var(--ucm-radius-lg);
      border-top-right-radius: var(--ucm-radius-lg);
      border: 1px solid rgba(182, 230, 224, 0.12);
      border-bottom: 0;
      background:
        radial-gradient(circle at top right, rgba(121, 224, 195, 0.12), transparent 32%),
        linear-gradient(180deg, rgba(19, 35, 42, 0.98) 0%, rgba(11, 19, 23, 0.985) 100%);
      color: var(--ucm-text-main);
      box-shadow: var(--ucm-shadow-panel);
      font-family: var(--ucm-font-body);
      animation: ucm-panel-rise var(--ucm-anim-panel);
      overscroll-behavior: contain;
    }

    #ucm-chain-panel-root .ucm-panel-hero,
    #ucm-chain-panel-root .ucm-panel-toolbar {
      position: sticky;
      z-index: 2;
    }

    #ucm-chain-panel-root .ucm-panel-hero {
      top: calc(-1 * max(16px, env(safe-area-inset-top)));
      padding-top: max(16px, env(safe-area-inset-top));
      background: linear-gradient(180deg, rgba(16, 27, 33, 0.98) 70%, rgba(16, 27, 33, 0));
    }

    #ucm-chain-panel-root .ucm-panel-toolbar {
      top: 68px;
      padding-bottom: 8px;
      background: linear-gradient(180deg, rgba(16, 27, 33, 0.98) 68%, rgba(16, 27, 33, 0));
    }

    #ucm-chain-panel-root .ucm-panel-kicker {
      margin: 0 0 4px;
      color: var(--ucm-accent-warm);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    #ucm-chain-panel-root .ucm-panel h2,
    #ucm-chain-panel-root .ucm-panel h3,
    #ucm-chain-panel-root .ucm-panel h4 {
      margin: 0;
      color: var(--ucm-text-main);
    }

    #ucm-chain-panel-root .ucm-panel h2 {
      font-family: var(--ucm-font-display);
      font-size: clamp(1.75rem, 5vw, 2.25rem);
      line-height: 0.94;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      max-width: 10ch;
    }

    #ucm-chain-panel-root .ucm-panel h3 {
      font-size: 15px;
      letter-spacing: 0.02em;
    }

    #ucm-chain-panel-root .ucm-panel h4 {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--ucm-text-muted);
    }

    #ucm-chain-panel-root .ucm-panel-subtitle,
    #ucm-chain-panel-root .ucm-section-copy,
    #ucm-chain-panel-root .ucm-state-note,
    #ucm-chain-panel-root .ucm-empty-state p,
    #ucm-chain-panel-root .ucm-chain-list-cta {
      margin: 0;
      font-size: 13px;
      line-height: 1.5;
      color: var(--ucm-text-muted);
    }

    #ucm-chain-panel-root .ucm-modal-close {
      width: 42px;
      height: 42px;
      border-radius: 999px;
      border: 1px solid var(--ucm-border-soft);
      background: rgba(255, 255, 255, 0.04);
      color: var(--ucm-text-main);
      font-size: 24px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      box-shadow: none;
    }

    #ucm-chain-panel-root .ucm-panel-section,
    #ucm-chain-panel-root .ucm-subsection-card {
      border: 1px solid var(--ucm-border-soft);
      border-radius: var(--ucm-radius-md);
      background: linear-gradient(180deg, rgba(18, 33, 40, 0.78) 0%, rgba(12, 20, 24, 0.82) 100%);
      box-shadow: var(--ucm-shadow-card);
    }

    #ucm-chain-panel-root .ucm-panel-section {
      padding: 16px;
    }

    #ucm-chain-panel-root .ucm-panel-section-emphasis {
      border-color: rgba(121, 224, 195, 0.18);
      background:
        linear-gradient(180deg, rgba(22, 38, 45, 0.92) 0%, rgba(13, 22, 27, 0.88) 100%),
        linear-gradient(120deg, rgba(121, 224, 195, 0.04), transparent 48%);
    }

    #ucm-chain-panel-root .ucm-inline-actions-wrap {
      flex-wrap: wrap;
    }

    #ucm-chain-panel-root .ucm-section-heading {
      display: grid;
      gap: 6px;
      margin-bottom: 14px;
    }

    #ucm-chain-panel-root .ucm-state-note {
      padding: 10px 12px;
      border-radius: 12px;
      background: rgba(242, 182, 109, 0.1);
      border: 1px solid rgba(242, 182, 109, 0.16);
      color: #e7c08e;
    }


    #ucm-chain-panel-root .ucm-chain-list-item {
      width: 100%;
      padding: 16px;
      border: 1px solid rgba(121, 224, 195, 0.12);
      border-radius: 16px;
      background:
        linear-gradient(180deg, rgba(14, 25, 30, 0.98) 0%, rgba(12, 20, 24, 0.94) 100%),
        linear-gradient(90deg, rgba(121, 224, 195, 0.08), transparent 40%);
      color: var(--ucm-text-main);
      text-align: left;
      display: grid;
      gap: 8px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
    }

    #ucm-chain-panel-root .ucm-chain-list-item:hover {
      border-color: rgba(121, 224, 195, 0.28);
      background: linear-gradient(180deg, rgba(16, 29, 35, 0.99) 0%, rgba(12, 20, 24, 0.98) 100%);
    }

    #ucm-chain-panel-root .ucm-chain-list-eyebrow {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--ucm-text-faint);
    }

    #ucm-chain-panel-root .ucm-chain-list-title {
      font-family: var(--ucm-font-display);
      font-size: 20px;
      line-height: 0.98;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }


    #ucm-chain-panel-root .ucm-status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 28px;
      padding: 0 10px;
      border-radius: 999px;
      background: rgba(121, 224, 195, 0.12);
      color: var(--ucm-accent);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      border: 1px solid rgba(121, 224, 195, 0.16);
      width: fit-content;
    }

    #ucm-chain-panel-root .ucm-empty-state {
      padding: 18px;
      border-radius: 16px;
      border: 1px dashed rgba(180, 210, 218, 0.16);
      background: rgba(7, 13, 16, 0.52);
      display: grid;
      gap: 6px;
      color: var(--ucm-text-muted);
    }

    #ucm-chain-panel-root .ucm-empty-state strong {
      font-family: var(--ucm-font-display);
      font-size: 18px;
      line-height: 1;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--ucm-text-main);
    }


    #ucm-chain-panel-root .ucm-summary-item {
      padding: 12px;
      border-radius: 14px;
      background: rgba(7, 13, 16, 0.56);
      border: 1px solid rgba(180, 210, 218, 0.08);
      display: grid;
      gap: 4px;
    }

    #ucm-chain-panel-root .ucm-summary-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--ucm-text-faint);
    }

    #ucm-chain-panel-root .ucm-summary-item strong {
      font-size: 14px;
      font-weight: 700;
      color: var(--ucm-text-main);
    }

    #ucm-chain-panel-root .ucm-summary-notes {
      margin: 0;
      padding: 14px;
      border-radius: 14px;
      background: rgba(7, 13, 16, 0.46);
      color: var(--ucm-text-muted);
      white-space: pre-wrap;
      line-height: 1.55;
      border: 1px solid rgba(180, 210, 218, 0.08);
    }

    #ucm-chain-panel-root .ucm-detail-switcher {
      margin-bottom: 14px;
    }

    #ucm-chain-panel-root .ucm-detail-section {
      animation: ucm-slide-in 0.18s ease;
    }

    #ucm-chain-panel-root .ucm-subsection-card {
      padding: 14px;
      display: grid;
      gap: 12px;
    }

    #ucm-chain-panel-root .ucm-checkbox-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 0;
      font-size: 13px;
      color: var(--ucm-text-main);
    }

    #ucm-chain-panel-root .ucm-checkbox-row input {
      width: auto;
      margin: 0;
      accent-color: var(--ucm-accent-strong);
      box-shadow: none;
    }

    #ucm-chain-panel-root .ucm-command-list {
      display: grid;
      gap: 10px;
    }

    #ucm-chain-panel-root .ucm-command-row {
      width: 100%;
      min-height: 58px;
      padding: 10px 12px;
      border: 1px solid rgba(180, 210, 218, 0.1);
      border-radius: 14px;
      background: rgba(7, 13, 16, 0.52);
      color: var(--ucm-text-main);
      display: grid;
      grid-template-columns: 38px 1fr;
      align-items: center;
      gap: 12px;
      text-align: left;
      box-shadow: none;
    }

    #ucm-chain-panel-root .ucm-command-row.is-danger {
      border-color: rgba(255, 125, 115, 0.22);
      background: rgba(255, 125, 115, 0.08);
    }

    #ucm-chain-panel-root .ucm-command-icon {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: rgba(121, 224, 195, 0.12);
      color: var(--ucm-accent);
      font-size: 17px;
    }

    #ucm-chain-panel-root .ucm-command-row strong,
    #ucm-chain-panel-root .ucm-member-card strong {
      display: block;
      color: var(--ucm-text-main);
      font-size: 13px;
      line-height: 1.2;
    }

    #ucm-chain-panel-root .ucm-command-row small,
    #ucm-chain-panel-root .ucm-member-card span,
    #ucm-chain-panel-root .ucm-member-stat-grid small {
      display: block;
      color: var(--ucm-text-muted);
      font-size: 11px;
      line-height: 1.35;
      letter-spacing: 0;
      text-transform: none;
    }

    #ucm-chain-panel-root .ucm-command-modal[hidden] {
      display: none;
    }

    #ucm-chain-panel-root .ucm-command-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 100003;
      background: rgba(4, 7, 9, 0.72);
      backdrop-filter: blur(6px);
    }

    #ucm-chain-panel-root .ucm-command-modal-card {
      position: fixed;
      left: 12px;
      right: 12px;
      bottom: max(12px, env(safe-area-inset-bottom));
      z-index: 100004;
      max-height: min(82vh, 38rem);
      overflow: auto;
      display: grid;
      gap: 14px;
      padding: 16px;
      border-radius: 20px;
      border: 1px solid rgba(182, 230, 224, 0.16);
      background: linear-gradient(180deg, rgba(19, 35, 42, 0.98) 0%, rgba(11, 19, 23, 0.99) 100%);
      color: var(--ucm-text-main);
      box-shadow: var(--ucm-shadow-panel);
      animation: ucm-panel-rise var(--ucm-anim-panel);
    }

    #ucm-chain-panel-root .ucm-command-modal-body {
      display: grid;
      gap: 12px;
    }

    #ucm-chain-panel-root .ucm-command-modal-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 14px;
    }

    #ucm-chain-panel-root .ucm-member-grid {
      display: grid;
      gap: 10px;
    }

    #ucm-chain-panel-root .ucm-member-section {
      display: grid;
      gap: 12px;
    }

    #ucm-chain-panel-root .ucm-member-card {
      display: grid;
      gap: 12px;
      padding: 12px;
      border-radius: 16px;
      border: 1px solid rgba(180, 210, 218, 0.1);
      background: rgba(7, 13, 16, 0.5);
    }

    #ucm-chain-panel-root .ucm-member-card.is-online {
      border-color: rgba(157, 242, 187, 0.22);
      background:
        linear-gradient(180deg, rgba(15, 35, 27, 0.44), rgba(7, 13, 16, 0.5));
    }

    #ucm-chain-panel-root .ucm-member-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    #ucm-chain-panel-root .ucm-presence-dot {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: var(--ucm-text-faint);
      margin-top: 4px;
      box-shadow: 0 0 0 4px rgba(111, 134, 136, 0.12);
    }

    #ucm-chain-panel-root .ucm-member-card.is-online .ucm-presence-dot {
      background: var(--ucm-success);
      box-shadow: 0 0 0 4px rgba(157, 242, 187, 0.12);
    }

    #ucm-chain-panel-root .ucm-member-stat-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    #ucm-chain-panel-root .ucm-diagnostics-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    #ucm-chain-panel-root .ucm-diagnostics-kv {
      min-width: 0;
      padding: 10px;
      border-radius: 12px;
      background: rgba(7, 13, 16, 0.54);
      border: 1px solid rgba(180, 210, 218, 0.08);
    }

    #ucm-chain-panel-root .ucm-diagnostics-kv span {
      display: block;
      margin-bottom: 4px;
      color: var(--ucm-text-faint);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    #ucm-chain-panel-root .ucm-diagnostics-kv strong {
      display: block;
      min-width: 0;
      color: var(--ucm-text-main);
      font-size: 12px;
      line-height: 1.35;
      overflow-wrap: anywhere;
    }

    #ucm-chain-panel-root .ucm-diagnostics-log {
      display: grid;
      gap: 8px;
      max-height: 340px;
      overflow: auto;
      padding-right: 2px;
    }

    #ucm-chain-panel-root .ucm-diagnostics-entry {
      display: grid;
      grid-template-columns: auto auto minmax(0, 1fr);
      gap: 6px;
      align-items: baseline;
      padding: 9px 10px;
      border-radius: 12px;
      background: rgba(7, 13, 16, 0.56);
      border: 1px solid rgba(180, 210, 218, 0.08);
      color: var(--ucm-text-muted);
      font-size: 11px;
    }

    #ucm-chain-panel-root .ucm-diagnostics-entry span {
      color: var(--ucm-text-faint);
      font-variant-numeric: tabular-nums;
    }

    #ucm-chain-panel-root .ucm-diagnostics-entry b {
      color: var(--ucm-text-main);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 10px;
    }

    #ucm-chain-panel-root .ucm-diagnostics-entry p {
      min-width: 0;
      margin: 0;
      overflow-wrap: anywhere;
    }

    #ucm-chain-panel-root .ucm-diagnostics-entry code {
      grid-column: 1 / -1;
      display: block;
      padding: 6px 8px;
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.24);
      color: var(--ucm-text-muted);
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 10px;
      line-height: 1.45;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    #ucm-chain-panel-root .ucm-diagnostics-entry-ok {
      border-color: rgba(157, 242, 187, 0.18);
    }

    #ucm-chain-panel-root .ucm-diagnostics-entry-warn {
      border-color: rgba(242, 182, 109, 0.22);
    }

    #ucm-chain-panel-root .ucm-diagnostics-entry-error {
      border-color: rgba(255, 125, 115, 0.28);
    }

    #ucm-chain-panel-root .ucm-member-stat-grid span {
      display: grid;
      gap: 2px;
      padding: 8px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.035);
    }

    #ucm-chain-panel-root .ucm-member-stat-grid b {
      color: var(--ucm-text-main);
      font-size: 12px;
      font-weight: 700;
    }

    #ucm-chain-panel-root .ucm-member-command {
      width: 100%;
    }

    @media (min-width: 720px) {
      #ucm-chain-panel-root .ucm-floating-button {
        right: 22px;
        bottom: 22px;
      }

      #ucm-chain-panel-root .ucm-panel {
        inset: 14px 14px 14px auto;
        width: min(var(--ucm-panel-max-width), calc(100vw - 28px));
        max-height: calc(100vh - 28px);
        border-radius: 24px;
        border: 1px solid rgba(182, 230, 224, 0.14);
        animation: ucm-panel-slide-desktop var(--ucm-anim-panel);
        padding: 18px 18px 20px;
      }

      #ucm-chain-panel-root .ucm-panel-hero {
        top: -18px;
        padding-top: 18px;
      }

      #ucm-chain-panel-root .ucm-command-modal-card {
        left: auto;
        right: 32px;
        bottom: 32px;
        width: min(420px, calc(100vw - 64px));
      }

      #ucm-chain-panel-root .ucm-member-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      #ucm-chain-panel-root .ucm-panel-toolbar {
        top: 74px;
      }

      #ucm-chain-panel-root .ucm-form-grid,
      #ucm-chain-panel-root .ucm-detail-stack {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      #ucm-chain-panel-root .ucm-detail-stack .ucm-subsection-card:last-child:nth-child(odd) {
        grid-column: 1 / -1;
      }
    }

    @media (max-width: 479px) {
      #ucm-chain-panel-root .ucm-summary-grid {
        grid-template-columns: 1fr;
      }

      #ucm-chain-panel-root .ucm-panel h2 {
        max-width: none;
      }
    }

    #ucm-chain-panel-root .ucm-danger-zone {
      border-color: rgba(220, 80, 80, 0.3);
    }

    #ucm-chain-panel-root .ucm-danger-button {
      padding: 11px 14px;
      background: rgba(220, 80, 80, 0.18);
      color: #e06060;
      border: 1px solid rgba(220, 80, 80, 0.35);
      border-radius: var(--ucm-radius);
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease, transform 0.1s ease;
      box-shadow: none;
    }

    #ucm-chain-panel-root .ucm-danger-button:hover:not(:disabled) {
      background: rgba(220, 80, 80, 0.28);
    }
  `;
		document.head.appendChild(style);
	}
	//#endregion
	//#region src/api/event-websocket-client.js
	var OPEN_TIMEOUT_MS = 5e3;
	function buildEventWebSocketUrl(backendUrl, sessionToken, after = 0) {
		const url = new URL("/events/ws", backendUrl);
		url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
		url.searchParams.set("token", sessionToken || "");
		url.searchParams.set("after", String(Math.max(0, Number(after) || 0)));
		return url.toString();
	}
	function parseWebSocketEvent(data) {
		const text = typeof data === "string" ? data : String(data || "");
		if (!text) return null;
		const parsed = JSON.parse(text);
		if (parsed?.type === "keepalive") return null;
		if (!parsed?.eventType) return null;
		return parsed;
	}
	function connectEventWebSocket(onEvent, options = {}) {
		const WebSocketCtor = globalThis.WebSocket;
		if (typeof WebSocketCtor !== "function" || !state.sessionToken) return null;
		const lastEventId = Math.max(0, Number(options.lastEventId) || 0);
		const url = buildEventWebSocketUrl(CONFIG.BACKEND_URL, state.sessionToken, lastEventId);
		let opened = false;
		let closedByClient = false;
		let fallbackStarted = false;
		let socket;
		let openTimer = null;
		const startFallback = (reason, details = {}) => {
			if (fallbackStarted || closedByClient) return;
			fallbackStarted = true;
			if (openTimer) {
				clearTimeout(openTimer);
				openTimer = null;
			}
			try {
				socket?.close();
			} catch {}
			logDiagnostic("warn", "events", "websocket falling back to polling", {
				reason,
				...details
			});
			options.onFallback?.(reason);
		};
		try {
			socket = new WebSocketCtor(url);
		} catch (error) {
			logDiagnostic("warn", "events", "websocket creation failed", { message: error?.message || "unknown error" });
			return null;
		}
		setSseStatus("connecting", {
			transport: "websocket",
			lastEventId,
			url: redactUrl(url)
		});
		openTimer = setTimeout(() => {
			if (!opened) startFallback("open_timeout", { timeoutMs: OPEN_TIMEOUT_MS });
		}, OPEN_TIMEOUT_MS);
		socket.onopen = () => {
			opened = true;
			if (openTimer) {
				clearTimeout(openTimer);
				openTimer = null;
			}
			setSseStatus("connected", {
				transport: "websocket",
				lastEventId
			});
		};
		socket.onmessage = (message) => {
			try {
				const evt = parseWebSocketEvent(message?.data);
				if (!evt) return;
				onEvent(evt);
				options.onCursor?.(evt.id);
			} catch (error) {
				logDiagnostic("warn", "events", "failed to parse websocket event", { message: error?.message || "unknown error" });
			}
		};
		socket.onerror = () => {
			if (!opened) startFallback("error_before_open");
		};
		socket.onclose = (event) => {
			if (openTimer) {
				clearTimeout(openTimer);
				openTimer = null;
			}
			if (!closedByClient) startFallback(opened ? "closed" : "closed_before_open", {
				code: event?.code,
				reason: event?.reason || ""
			});
		};
		return { close() {
			closedByClient = true;
			if (openTimer) {
				clearTimeout(openTimer);
				openTimer = null;
			}
			try {
				socket.close();
			} catch {}
		} };
	}
	//#endregion
	//#region src/api/event-poll-client.js
	var POLL_TIMEOUT_MS = 15e3;
	var MAX_RECONNECT_DELAY = 3e4;
	var SUPPORTED_EVENT_TYPES = new Set([
		"command.hold_all",
		"command.release_all",
		"target.assigned",
		"bonus.locked",
		"attack_pass.issued",
		"defense.alert",
		"presence.updated"
	]);
	var PANEL_SHELL_SELECTOR = "#ucm-chain-panel-root .ucm-panel-shell";
	var disposed = true;
	var isPolling = false;
	var reconnectAttempts = 0;
	var reconnectTimer = null;
	var onEventCallback = null;
	var lastEventId = 0;
	var webSocketController = null;
	function updateLastEventId(eventId) {
		const parsedId = Number(eventId) || 0;
		if (parsedId > lastEventId) lastEventId = parsedId;
		if (parsedId > state.eventCursor) state.eventCursor = parsedId;
	}
	function dispatchEvent(evt) {
		if (!evt || !SUPPORTED_EVENT_TYPES.has(evt.eventType)) return;
		const eventId = Number(evt.id) || 0;
		if (eventId > 0 && eventId <= lastEventId) return;
		const shell = document.querySelector(PANEL_SHELL_SELECTOR);
		const shellWasHidden = Boolean(shell?.hidden);
		try {
			const parsed = JSON.parse(evt.payloadJson || "{}");
			updateLastEventId(eventId);
			onEventCallback(evt.eventType, parsed, eventId);
		} catch (error) {
			logDiagnostic("warn", "events", "failed to parse poll event", {
				eventType: evt.eventType,
				eventId: evt.id,
				message: error?.message || "unknown error"
			});
		} finally {
			if (shellWasHidden && shell) shell.hidden = true;
		}
	}
	function scheduleReconnect() {
		if (disposed) return;
		const delayMs = Math.min(1e3 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY) + Math.floor(Math.random() * 500);
		reconnectAttempts += 1;
		setSseStatus("reconnecting", {
			transport: "poll",
			reconnectAttempts,
			delayMs,
			lastEventId
		});
		reconnectTimer = setTimeout(() => {
			reconnectTimer = null;
			pollLoop();
		}, delayMs);
	}
	function startPollFallback(reason = "fallback") {
		if (disposed) return;
		webSocketController = null;
		setSseStatus("connecting", {
			transport: "poll",
			fallbackReason: reason,
			lastEventId
		});
		pollLoop();
	}
	async function pollLoop() {
		if (disposed || isPolling) return;
		isPolling = true;
		try {
			while (!disposed) {
				const result = await pollEvents(lastEventId, POLL_TIMEOUT_MS);
				if (disposed) break;
				reconnectAttempts = 0;
				for (const evt of result?.events || []) dispatchEvent(evt);
				if (typeof result?.lastEventId === "number") updateLastEventId(result.lastEventId);
			}
		} catch (error) {
			if (!disposed) {
				logDiagnostic("warn", "events", "event poll failed", {
					message: error?.message || "unknown error",
					lastEventId
				});
				scheduleReconnect();
			}
		} finally {
			isPolling = false;
		}
	}
	function connectEventPolling(onEvent) {
		if (!disposed && onEventCallback === onEvent) return;
		onEventCallback = onEvent;
		disposed = false;
		reconnectAttempts = 0;
		lastEventId = Math.max(lastEventId, Number(state.eventCursor) || 0);
		if (reconnectTimer) {
			clearTimeout(reconnectTimer);
			reconnectTimer = null;
		}
		webSocketController = connectEventWebSocket(dispatchEvent, {
			lastEventId,
			onCursor: updateLastEventId,
			onFallback: startPollFallback
		});
		if (!webSocketController) startPollFallback("websocket_unavailable");
	}
	function disconnectEventPolling() {
		disposed = true;
		reconnectAttempts = 0;
		webSocketController?.close();
		webSocketController = null;
		setSseStatus("disconnected", {
			transport: "poll",
			lastEventId
		});
		if (reconnectTimer) {
			clearTimeout(reconnectTimer);
			reconnectTimer = null;
		}
	}
	//#endregion
	//#region src/api/realtime-diagnostics.js
	var PROBE_TIMEOUT_MS = 5e3;
	var GRPC_WEB_CONTENT_TYPE = "application/grpc-web+proto";
	function encodeVarint(value) {
		let next = Math.max(0, Number(value) || 0);
		const bytes = [];
		while (next > 127) {
			bytes.push(next & 127 | 128);
			next = Math.floor(next / 128);
		}
		bytes.push(next);
		return bytes;
	}
	function decodeVarint(bytes, offset) {
		let result = 0;
		let shift = 0;
		let index = offset;
		while (index < bytes.length) {
			const byte = bytes[index++];
			result += (byte & 127) * Math.pow(2, shift);
			if ((byte & 128) === 0) return {
				value: result,
				offset: index
			};
			shift += 7;
		}
		throw new Error("invalid protobuf varint");
	}
	function encodeStringField(fieldNumber, value) {
		const encoded = new TextEncoder().encode(String(value || ""));
		return [
			fieldNumber << 3 | 2,
			...encodeVarint(encoded.length),
			...encoded
		];
	}
	function buildGrpcWebPingUrl(backendUrl) {
		return new URL("/tornucm.diagnostics.Diagnostics/Ping", backendUrl).toString();
	}
	function encodeGrpcWebPingRequest(client = "ucm-userscript") {
		const message = new Uint8Array(encodeStringField(1, client));
		const frame = new Uint8Array(5 + message.length);
		frame[0] = 0;
		new DataView(frame.buffer).setUint32(1, message.length, false);
		frame.set(message, 5);
		return frame;
	}
	function decodePingReplyMessage(message) {
		const reply = {
			status: "",
			transport: "",
			serverUnixMs: 0
		};
		let offset = 0;
		const decoder = new TextDecoder();
		while (offset < message.length) {
			const tag = message[offset++];
			const fieldNumber = tag >> 3;
			const wireType = tag & 7;
			if (wireType === 2) {
				const length = decodeVarint(message, offset);
				offset = length.offset;
				const valueBytes = message.slice(offset, offset + length.value);
				offset += length.value;
				const value = decoder.decode(valueBytes);
				if (fieldNumber === 1) reply.status = value;
				if (fieldNumber === 2) reply.transport = value;
				continue;
			}
			if (wireType === 0) {
				const value = decodeVarint(message, offset);
				offset = value.offset;
				if (fieldNumber === 3) reply.serverUnixMs = value.value;
				continue;
			}
			throw new Error(`unsupported protobuf wire type ${wireType}`);
		}
		return reply;
	}
	function decodeGrpcWebPingReply(buffer) {
		const bytes = new Uint8Array(buffer);
		let offset = 0;
		while (offset + 5 <= bytes.length) {
			const frameType = bytes[offset];
			const length = new DataView(bytes.buffer, bytes.byteOffset + offset + 1, 4).getUint32(0, false);
			offset += 5;
			const message = bytes.slice(offset, offset + length);
			offset += length;
			if ((frameType & 128) === 0) return decodePingReplyMessage(message);
		}
		throw new Error("gRPC-Web response did not include a data frame");
	}
	function withTimeout(promise, timeoutMs, label) {
		let timer;
		const timeout = new Promise((_, reject) => {
			timer = setTimeout(() => reject(/* @__PURE__ */ new Error(`${label} timed out`)), timeoutMs);
		});
		return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
	}
	async function probeWebSocket() {
		if (typeof WebSocket !== "function") throw new Error("WebSocket constructor is unavailable");
		if (!state.sessionToken) throw new Error("session token is missing");
		const url = buildEventWebSocketUrl(CONFIG.BACKEND_URL, state.sessionToken, state.eventCursor || 0);
		const started = performance.now();
		return withTimeout(new Promise((resolve, reject) => {
			let socket;
			try {
				socket = new WebSocket(url);
			} catch (error) {
				reject(error);
				return;
			}
			socket.onopen = () => {
				const ms = Math.round(performance.now() - started);
				socket.close();
				resolve({
					ok: true,
					transport: "websocket",
					ms
				});
			};
			socket.onerror = () => reject(/* @__PURE__ */ new Error("WebSocket error before open"));
			socket.onclose = (event) => {
				if (event?.code && event.code !== 1e3) reject(/* @__PURE__ */ new Error(`WebSocket closed with ${event.code}`));
			};
		}), PROBE_TIMEOUT_MS, "WebSocket probe").catch((error) => {
			throw new Error(`${error?.message || "unknown error"} (${redactUrl(url)})`);
		});
	}
	async function probeGrpcWeb() {
		if (typeof fetch !== "function") throw new Error("fetch is unavailable");
		if (!state.sessionToken) throw new Error("session token is missing");
		const url = buildGrpcWebPingUrl(CONFIG.BACKEND_URL);
		const started = performance.now();
		const response = await withTimeout(fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${state.sessionToken}`,
				"Content-Type": GRPC_WEB_CONTENT_TYPE,
				Accept: GRPC_WEB_CONTENT_TYPE,
				"X-Grpc-Web": "1"
			},
			body: encodeGrpcWebPingRequest("ucm-userscript")
		}), PROBE_TIMEOUT_MS, "gRPC-Web probe");
		const grpcStatus = response.headers?.get?.("grpc-status");
		if (!response.ok || grpcStatus && grpcStatus !== "0") throw new Error(`gRPC-Web HTTP ${response.status} grpc-status ${grpcStatus || "missing"}`);
		const reply = decodeGrpcWebPingReply(await response.arrayBuffer());
		const ms = Math.round(performance.now() - started);
		return {
			ok: reply.status === "ok",
			transport: reply.transport || "grpc-web",
			ms,
			reply
		};
	}
	async function runNamedProbe(name, probe) {
		try {
			const result = await probe();
			logDiagnostic(result.ok ? "ok" : "warn", "diagnostics", `${name} probe ${result.ok ? "passed" : "failed"}`, result);
			return {
				name,
				...result
			};
		} catch (error) {
			const result = {
				name,
				ok: false,
				message: error?.message || "unknown error"
			};
			logDiagnostic("warn", "diagnostics", `${name} probe failed`, result);
			return result;
		}
	}
	async function runRealtimeTransportTests() {
		logDiagnostic("info", "diagnostics", "realtime transport probes started");
		const [websocket, grpcWeb] = await Promise.all([runNamedProbe("WebSocket", probeWebSocket), runNamedProbe("gRPC-Web", probeGrpcWeb)]);
		logDiagnostic("info", "diagnostics", "realtime transport probes completed", {
			websocket: websocket.ok,
			grpcWeb: grpcWeb.ok
		});
		return {
			websocket,
			grpcWeb
		};
	}
	//#endregion
	//#region src/dom/selectors.js
	function isAttackPage() {
		try {
			const url = new URL(window.location.href);
			return url.pathname === "/page.php" && url.searchParams.get("sid") === "attack";
		} catch {
			return false;
		}
	}
	/**
	* 4-tier attack button selector fallback strategy.
	* Returns the button element or null.
	*/
	/** Tier 1: Semantic selector inside defender modal */
	function findBySemanticSelector() {
		const defenderModal = findDefenderModal();
		if (!defenderModal) return null;
		const buttons = defenderModal.querySelectorAll("button[type=\"submit\"]");
		for (const btn of buttons) if (isVisible(btn) && isStartFightButton(btn)) return btn;
		return null;
	}
	/** Tier 2: Exact CSS selector from settings */
	function findByCssSelector() {
		try {
			const btn = document.querySelector(CONFIG.SELECTORS.CSS);
			if (btn && isAttackButton(btn)) return btn;
		} catch (e) {}
		return null;
	}
	/** Tier 3: XPath fallback */
	function findByXpath() {
		try {
			const btn = document.evaluate(CONFIG.SELECTORS.XPATH, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
			if (btn && isAttackButton(btn)) return btn;
		} catch (e) {}
		return null;
	}
	/** Tier 4: Last resort text match */
	function findByTextMatch() {
		const defenderModal = findDefenderModal();
		if (!defenderModal) return null;
		const buttons = defenderModal.querySelectorAll("button");
		for (const btn of buttons) if (isStartFightButton(btn) && isVisible(btn)) return btn;
		return null;
	}
	/**
	* Try all 4 tiers in order, return first match.
	*/
	function findAttackButton() {
		return findBySemanticSelector() || findByCssSelector() || findByXpath() || findByTextMatch();
	}
	function findDefenderModal() {
		const modals = document.querySelectorAll("[class*=\"defender\"]");
		for (const modal of modals) if (isVisible(modal)) return modal;
		return null;
	}
	function isAttackButton(btn) {
		return isStartFightButton(btn) && isVisible(btn) && Boolean(btn.closest("[class*=\"defender\"]"));
	}
	function isStartFightButton(btn) {
		return btn.textContent.trim().toLowerCase() === "start fight";
	}
	function isVisible(el) {
		if (!el) return false;
		const style = window.getComputedStyle(el);
		return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0" && el.offsetParent !== null;
	}
	//#endregion
	//#region src/dom/banner.js
	var BANNER_ID = "ucm-block-banner";
	/**
	* Show a contextual banner above the attack button.
	*/
	function showBanner(message) {
		const existing = document.getElementById(BANNER_ID);
		if (existing) {
			if (existing.textContent !== message) existing.textContent = message;
			return;
		}
		const banner = document.createElement("div");
		banner.id = BANNER_ID;
		banner.textContent = message;
		banner.style.cssText = `
    background: #e74c3c;
    color: white;
    padding: 8px 16px;
    text-align: center;
    font-weight: bold;
    font-size: 14px;
    border-radius: 4px;
    margin-bottom: 8px;
    z-index: 99999;
  `;
		const defenderModal = document.querySelector("[class*=\"defender\"]");
		if (defenderModal) defenderModal.insertBefore(banner, defenderModal.firstChild);
		else {
			banner.style.cssText += "position: fixed; top: 0; left: 0; right: 0;";
			document.body.prepend(banner);
		}
	}
	/**
	* Remove the UCM banner from the DOM.
	*/
	function removeBanner() {
		const existing = document.getElementById(BANNER_ID);
		if (existing) existing.remove();
	}
	//#endregion
	//#region src/dom/attack-button.js
	var blockedButtonRef = null;
	var clickGuardInstalled = false;
	var lastMissingButtonLogAt = 0;
	/**
	* Block the attack button: disable it, mark it, show tooltip and banner.
	*/
	function blockButton() {
		if (!isAttackPage()) {
			removeBanner();
			return;
		}
		const btn = findAttackButton();
		if (!btn) {
			const now = Date.now();
			if (now - lastMissingButtonLogAt > 5e3) {
				lastMissingButtonLogAt = now;
				logDiagnostic("info", "attack", "attack page detected, but no attack button found yet");
			}
			return;
		}
		if (!(btn.getAttribute("data-ucm-blocked") === "true" && btn.disabled && btn.getAttribute("aria-disabled") === "true")) logDiagnostic("ok", "attack", "blocking attack button");
		btn.disabled = true;
		btn.setAttribute("data-ucm-blocked", "true");
		btn.title = "Blocked by Ultimate Chain Manager";
		btn.style.pointerEvents = "none";
		btn.setAttribute("aria-disabled", "true");
		blockedButtonRef = new WeakRef(btn);
		showBanner(getBlockReason());
	}
	/**
	* Unblock the attack button: re-enable it, remove markers and banner.
	*/
	function unblockButton() {
		if (!isAttackPage()) {
			blockedButtonRef = null;
			removeBanner();
			return;
		}
		const btn = getBlockedButton() || findAttackButton();
		if (!btn) return;
		btn.disabled = false;
		btn.removeAttribute("data-ucm-blocked");
		btn.title = "";
		btn.style.pointerEvents = "";
		btn.removeAttribute("aria-disabled");
		blockedButtonRef = null;
		logDiagnostic("ok", "attack", "unblocking attack button");
		removeBanner();
	}
	/**
	* Get the currently blocked button via WeakRef, if still in DOM.
	*/
	function getBlockedButton() {
		if (!blockedButtonRef) return null;
		const btn = blockedButtonRef.deref();
		if (!btn || !btn.isConnected) {
			blockedButtonRef = null;
			return null;
		}
		return btn;
	}
	/**
	* Re-apply block if state says we should be blocked.
	* Called by MutationObserver after DOM changes.
	*/
	function reapplyIfNeeded(shouldBlock) {
		if (!isAttackPage()) {
			if (getBlockedButton()) unblockButton();
			else removeBanner();
			return;
		}
		if (shouldBlock) blockButton();
		else if (getBlockedButton()) unblockButton();
	}
	function installAttackClickGuard(isBlockedFn) {
		if (clickGuardInstalled) return;
		clickGuardInstalled = true;
		document.addEventListener("click", (event) => {
			if (!isAttackPage()) return;
			if (!isBlockedFn()) return;
			const button = event.target instanceof Element ? event.target.closest("button") : null;
			if (!button) return;
			if (button.getAttribute("data-ucm-blocked") === "true" || isAttackButton(button)) {
				logDiagnostic("warn", "attack", "blocked attack click intercepted");
				event.preventDefault();
				event.stopPropagation();
				event.stopImmediatePropagation();
				blockButton();
			}
		}, true);
		document.addEventListener("submit", (event) => {
			if (!isAttackPage()) return;
			if (!isBlockedFn()) return;
			const form = event.target instanceof HTMLFormElement ? event.target : null;
			if (!form) return;
			const blockedButton = findAttackButton();
			if (!blockedButton) return;
			if (!form.contains(blockedButton)) return;
			logDiagnostic("warn", "attack", "blocked attack form submit intercepted");
			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();
			blockButton();
		}, true);
	}
	//#endregion
	//#region src/ui/notifications.js
	var notificationCount = 0;
	/**
	* Show a toast notification that auto-dismisses after 10 seconds.
	*/
	function showNotification(message, durationMs = 1e4) {
		const id = `ucm-notification-${++notificationCount}`;
		const el = document.createElement("div");
		el.id = id;
		el.className = "ucm-notification";
		el.textContent = message;
		const topOffset = 10 + document.querySelectorAll(".ucm-notification").length * 60;
		el.style.top = `${topOffset}px`;
		document.body.appendChild(el);
		setTimeout(() => {
			el.style.animation = "ucm-slide-out 0.3s ease-in forwards";
			setTimeout(() => el.remove(), 300);
		}, durationMs);
	}
	//#endregion
	//#region src/events/handler.js
	/**
	* Handle a single event from the backend event transport.
	* Called with (type, payload, eventId) from the polling client.
	*/
	function handleEvent(type, payload, eventId) {
		if (eventId && eventId > state.eventCursor) state.eventCursor = eventId;
		switch (type) {
			case "command.hold_all":
				handleHoldAll(payload);
				break;
			case "command.release_all":
				handleReleaseAll(payload);
				break;
			case "target.assigned":
				handleTargetAssigned(payload);
				break;
			case "bonus.locked":
				handleBonusLocked(payload);
				break;
			case "attack_pass.issued":
				handlePassIssued(payload);
				break;
			case "defense.alert":
				handleDefenseAlert(payload);
				break;
			case "presence.updated": break;
			default: logDiagnostic("warn", "events", "unknown event type", { type });
		}
	}
	function handleHoldAll(payload) {
		state.commandMode = "hold_all";
		if (!state.permissions.includes("attack.block.exempt")) {
			blockButton();
			showBanner(payload.reason || "Hold active");
		}
	}
	function handleReleaseAll(payload) {
		state.commandMode = "free";
		state.myActivePass = null;
		unblockButton();
		removeBanner();
	}
	function handleTargetAssigned(payload) {
		if (payload.assigneeMemberId === state.memberId) {
			state.myAssignment = {
				hitNumber: payload.hitNumber,
				enemyTornUserId: payload.enemyTornUserId
			};
			showNotification(`You are assigned hit #${payload.hitNumber}`);
		}
	}
	function handleBonusLocked(payload) {
		state.commandMode = "bonus_lock";
		state.bonusLockAssigneeMemberId = payload.assigneeMemberId;
		const isAssignee = payload.assigneeMemberId === state.memberId;
		const isExempt = state.permissions.includes("attack.block.exempt");
		if (!isAssignee && !isExempt) {
			blockButton();
			showBanner(`Bonus hit #${payload.hitNumber} reserved`);
		}
	}
	function handlePassIssued(payload) {
		state.myActivePass = {
			id: payload.attackPassId,
			expiresAt: new Date(payload.expiresAt)
		};
		unblockButton();
		removeBanner();
		showBanner(`One-time pass active — ${payload.reason || "Go!"}`);
		const ttlMs = new Date(payload.expiresAt).getTime() - Date.now();
		if (ttlMs > 0) setTimeout(() => {
			if (state.myActivePass && state.myActivePass.id === payload.attackPassId) {
				state.myActivePass = null;
				blockButton();
				showBanner(state.commandMode === "bonus_lock" ? "Bonus lock active" : "Hold active");
			}
		}, ttlMs);
	}
	function handleDefenseAlert(payload) {
		showNotification(`\u26A0 ${payload.memberName} is being attacked by ${payload.attackerName}`);
	}
	//#endregion
	//#region src/ui/chain-list.js
	/**
	* Client-rendered chain list component.
	* Replaces the SSR GET /ui/chains endpoint.
	*/
	function hasSchedulePermission() {
		return Array.isArray(state.permissions) && state.permissions.includes("chain.schedule");
	}
	function formatScheduledTime(isoString) {
		if (!isoString) return "Not scheduled";
		try {
			return new Date(isoString).toLocaleString(void 0, {
				month: "short",
				day: "numeric",
				hour: "numeric",
				minute: "2-digit"
			});
		} catch {
			return isoString;
		}
	}
	function statusPillColor(status) {
		switch (status) {
			case "active": return "var(--ucm-success)";
			case "scheduled": return "var(--ucm-accent)";
			case "completed": return "var(--ucm-text-faint)";
			case "cancelled": return "var(--ucm-danger)";
			default: return "var(--ucm-text-muted)";
		}
	}
	/**
	* Render chain list HTML from API data.
	* Returns the HTML string for embedding into the panel shell.
	*/
	async function renderChainListHTML() {
		const chains = (await listChains())?.chains || [];
		if (chains.length === 0) return `
      <div class="ucm-empty-state">
        <strong>No chains</strong>
        <p>No chains have been scheduled yet.${hasSchedulePermission() ? " Create one to get started." : ""}</p>
      </div>
      ${hasSchedulePermission() ? "<button id=\"ucm-add-chain-button\" class=\"ucm-primary-button\" type=\"button\">New Chain</button>" : ""}
    `;
		return `
    <div class="ucm-chain-list u-grid u-gap-3">
      ${chains.map((chain) => {
			const pillColor = statusPillColor(chain.status);
			return `
      <button class="ucm-chain-list-item" data-chain-id="${chain.id}" type="button">
        <span class="ucm-chain-list-eyebrow">${formatScheduledTime(chain.scheduledStartUtc)}</span>
        <span class="ucm-chain-list-title">${escapeHtml$1(chain.title || "Untitled Chain")}</span>
        <div class="ucm-chain-list-row u-flex u-items-center u-justify-between u-gap-ucm-3">
          <span class="ucm-status-pill" style="color: ${pillColor}; border-color: ${pillColor}33; background: ${pillColor}1a;">
            ${escapeHtml$1(chain.status || "unknown")}
          </span>
          ${chain.expectedDurationMinutes ? `<span class="ucm-chain-list-cta">${chain.expectedDurationMinutes}m</span>` : ""}
        </div>
      </button>
    `;
		}).join("")}
    </div>
    ${hasSchedulePermission() ? "<button id=\"ucm-add-chain-button\" class=\"ucm-primary-button\" type=\"button\">New Chain</button>" : ""}
  `;
	}
	function escapeHtml$1(str) {
		const div = document.createElement("div");
		div.textContent = str;
		return div.innerHTML;
	}
	//#endregion
	//#region src/ui/chain-create.js
	/**
	* Client-rendered chain creation form.
	* Replaces the SSR GET /ui/chains/new endpoint.
	*/
	function formatDateTimeLocal(date) {
		return (/* @__PURE__ */ new Date(date.getTime() - date.getTimezoneOffset() * 6e4)).toISOString().slice(0, 16);
	}
	/**
	* Render chain creation form HTML.
	* Returns the HTML string for embedding into the panel shell.
	*/
	function renderChainCreateHTML() {
		return `
    <form id="ucm-create-chain-form" class="ucm-create-chain-form">
      <div class="ucm-form-grid u-grid u-gap-3">
        <div>
          <label for="ucm-chain-title">Title</label>
          <input id="ucm-chain-title" name="title" type="text" maxlength="120" placeholder="Example: Evening chain" required />
        </div>

        <div>
          <label for="ucm-chain-start">Start Time</label>
          <input id="ucm-chain-start" name="scheduledStartUtc" type="datetime-local" value="${formatDateTimeLocal(new Date(Date.now() + 300 * 1e3))}" required />
        </div>

        <div>
          <label for="ucm-chain-duration">Duration (minutes)</label>
          <input id="ucm-chain-duration" name="expectedDurationMinutes" type="number" min="1" step="1" value="30" required />
        </div>

        <div>
          <label class="ucm-checkbox-row" for="ucm-chain-war-mode">
            <input id="ucm-chain-war-mode" name="warMode" type="checkbox" />
            <span>War mode</span>
          </label>
        </div>

        <div>
          <label for="ucm-chain-enemy-faction">Enemy Faction ID</label>
          <input id="ucm-chain-enemy-faction" name="enemyFactionTornId" type="number" min="1" step="1" placeholder="Optional" />
        </div>

        <div class="u-col-span-full">
          <label for="ucm-chain-notes">Notes</label>
          <textarea id="ucm-chain-notes" name="notes" rows="3" maxlength="1000" placeholder="Optional notes"></textarea>
        </div>
      </div>

      <div class="ucm-form-actions u-flex u-items-center u-justify-between u-gap-ucm-2 u-flex-wrap u-mt-ucm-3">
        <button id="ucm-back-to-chains" class="ucm-secondary-button" type="button">Cancel</button>
        <button id="ucm-create-chain-submit" type="submit">Create Chain</button>
      </div>
      <p id="ucm-chain-panel-status" class="ucm-modal-status" aria-live="polite"></p>
    </form>
  `;
	}
	function parseOptionalNumber(value) {
		const trimmed = value.trim();
		if (!trimmed) return null;
		const parsed = Number(trimmed);
		if (!Number.isInteger(parsed) || parsed <= 0) throw new Error("Enemy faction ID must be a positive integer.");
		return parsed;
	}
	/**
	* Build and validate the chain creation payload from form data.
	*/
	function buildChainPayload(formData) {
		const title = String(formData.get("title") || "").trim();
		const scheduledStartLocal = String(formData.get("scheduledStartUtc") || "").trim();
		const duration = Number(formData.get("expectedDurationMinutes"));
		const notes = String(formData.get("notes") || "").trim();
		const warMode = formData.get("warMode") === "on";
		const enemyFactionTornId = parseOptionalNumber(String(formData.get("enemyFactionTornId") || ""));
		if (!title) throw new Error("Title is required.");
		if (!scheduledStartLocal) throw new Error("Start time is required.");
		const scheduledStart = new Date(scheduledStartLocal);
		if (Number.isNaN(scheduledStart.getTime())) throw new Error("Start time is invalid.");
		if (!Number.isInteger(duration) || duration <= 0) throw new Error("Duration must be a positive number of minutes.");
		return {
			title,
			scheduledStartUtc: scheduledStart.toISOString(),
			expectedDurationMinutes: duration,
			warMode,
			enemyFactionTornId,
			notes: notes || null
		};
	}
	/**
	* Submit the chain creation form.
	* Returns the created chain response on success.
	*/
	async function submitChainCreate(formData) {
		const payload = buildChainPayload(formData);
		const response = await createChain(payload);
		state.currentChainId = response?.chain?.id || null;
		showNotification(`Chain created: ${payload.title}`);
		return response;
	}
	//#endregion
	//#region src/ui/chain-panel.js
	var CHAIN_PANEL_ROOT_ID = "ucm-chain-panel-root";
	var DEFAULT_DETAIL_SECTION = "primary";
	var activeDetailSection = DEFAULT_DETAIL_SECTION;
	function hasAnyChainControlPermission() {
		return Array.isArray(state.permissions) && (state.permissions.includes("chain.schedule") || state.permissions.includes("chain.lead") || state.permissions.includes("overwatch.view"));
	}
	function escapeHtml(value) {
		const div = document.createElement("div");
		div.textContent = value == null ? "" : String(value);
		return div.innerHTML;
	}
	function formatDate(isoString) {
		if (!isoString) return "—";
		try {
			return new Date(isoString).toLocaleString(void 0, {
				month: "short",
				day: "numeric",
				hour: "numeric",
				minute: "2-digit"
			});
		} catch {
			return isoString;
		}
	}
	function formatRelativeTime(isoString) {
		if (!isoString) return "No recent check-in";
		const diffMs = Date.now() - new Date(isoString).getTime();
		if (!Number.isFinite(diffMs)) return "Unknown";
		if (diffMs < 6e4) return "Just now";
		const minutes = Math.floor(diffMs / 6e4);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		return formatDate(isoString);
	}
	function presenceLabel(member) {
		if (member.isOnline) return "Online";
		return String(member.presenceState || "").replaceAll("_", " ") || "Offline";
	}
	function formatEnergy(member) {
		return member.energy == null ? "—" : `${member.energy}e`;
	}
	function formatHealth(member) {
		if (member.lifeCurrent == null || member.lifeMax == null) return "—";
		return `${member.lifeCurrent}/${member.lifeMax}`;
	}
	function getElements() {
		return {
			root: document.getElementById(CHAIN_PANEL_ROOT_ID),
			shell: document.getElementById("ucm-chain-panel-shell"),
			button: document.getElementById("ucm-chain-panel-button"),
			close: document.getElementById("ucm-chain-panel-close"),
			refresh: document.getElementById("ucm-chain-panel-refresh"),
			diagnostics: document.getElementById("ucm-chain-panel-diagnostics"),
			status: document.getElementById("ucm-chain-panel-status"),
			addChain: document.getElementById("ucm-add-chain-button"),
			back: document.getElementById("ucm-back-to-chains"),
			backSecondary: document.getElementById("ucm-back-to-chains-secondary"),
			createForm: document.getElementById("ucm-create-chain-form"),
			rsvpForm: document.getElementById("ucm-rsvp-form"),
			rsvpEdit: document.getElementById("ucm-rsvp-edit"),
			commandButtons: Array.from(document.querySelectorAll("[data-ucm-command]")),
			commandModal: document.getElementById("ucm-command-modal"),
			commandModalBody: document.getElementById("ucm-command-modal-body"),
			commandModalTitle: document.getElementById("ucm-command-modal-title"),
			commandModalClose: document.getElementById("ucm-command-modal-close"),
			commandModalCancel: document.getElementById("ucm-command-modal-cancel"),
			commandModalForm: document.getElementById("ucm-command-modal-form"),
			chainButtons: Array.from(document.querySelectorAll(".ucm-chain-list-item")),
			sectionTabs: Array.from(document.querySelectorAll("[data-ucm-section]")),
			sectionPanels: Array.from(document.querySelectorAll("[data-ucm-section-panel]"))
		};
	}
	function setChainPanelStatus(message, kind = "info") {
		const { status } = getElements();
		if (!status) return;
		status.textContent = message;
		status.dataset.kind = kind;
	}
	function getCurrentView() {
		return document.getElementById("ucm-chain-panel-shell")?.dataset.ucmView || "list";
	}
	function getCurrentChainId() {
		return document.getElementById("ucm-chain-panel-shell")?.dataset.chainId || "";
	}
	function applyDetailSection(section = DEFAULT_DETAIL_SECTION) {
		const { sectionTabs, sectionPanels } = getElements();
		if (!sectionTabs.length || !sectionPanels.length) return;
		activeDetailSection = section;
		for (const tab of sectionTabs) {
			const isActive = tab.dataset.ucmSection === section;
			tab.classList.toggle("is-active", isActive);
			tab.setAttribute("aria-selected", isActive ? "true" : "false");
			tab.tabIndex = isActive ? 0 : -1;
		}
		for (const panel of sectionPanels) panel.hidden = panel.dataset.ucmSectionPanel !== section;
	}
	function buildPanelShell(innerHTML, view = "list", chainId = "") {
		return `
    <button id="ucm-chain-panel-button" class="ucm-floating-button" type="button" aria-haspopup="dialog">
      Chain Manager
    </button>
    <div id="ucm-chain-panel-shell" class="ucm-panel-shell" data-ucm-view="${view}" data-chain-id="${chainId}" hidden>
      <div class="ucm-panel-backdrop" data-ucm-close="panel"></div>
      <div class="ucm-panel" role="dialog" aria-modal="true">
        <div class="ucm-panel-hero u-flex u-items-start u-justify-between u-gap-ucm-2">
          <div>
            <p class="ucm-panel-kicker">Chain Manager</p>
            <h2>UCM</h2>
          </div>
          <div class="u-flex u-gap-2">
            <button id="ucm-chain-panel-diagnostics" class="ucm-modal-close" type="button" aria-label="Diagnostics" title="Diagnostics">i</button>
            <button id="ucm-chain-panel-refresh" class="ucm-modal-close" type="button" aria-label="Refresh" title="Refresh">\u21BB</button>
            <button id="ucm-chain-panel-close" class="ucm-modal-close" type="button" aria-label="Close">\u00D7</button>
          </div>
        </div>
        ${innerHTML}
        <p id="ucm-chain-panel-status" class="ucm-modal-status" aria-live="polite"></p>
      </div>
      <div id="ucm-command-modal" class="ucm-command-modal" hidden>
        <div class="ucm-command-modal-backdrop" data-ucm-close-command="1"></div>
        <div class="ucm-command-modal-card" role="dialog" aria-modal="true" aria-labelledby="ucm-command-modal-title">
          <div class="u-flex u-items-center u-justify-between u-gap-ucm-2">
            <h3 id="ucm-command-modal-title">Command</h3>
            <button id="ucm-command-modal-close" class="ucm-modal-close" type="button" aria-label="Close">\u00D7</button>
          </div>
          <form id="ucm-command-modal-form">
            <div id="ucm-command-modal-body" class="ucm-command-modal-body"></div>
            <div class="ucm-command-modal-actions">
              <button id="ucm-command-modal-cancel" class="ucm-secondary-button" type="button">Cancel</button>
              <button id="ucm-command-modal-submit" type="submit">Submit</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
	}
	function formatPlatformValue(value) {
		if (value === true) return "yes";
		if (value === false) return "no";
		if (value == null || value === "") return "—";
		return String(value);
	}
	function buildDiagnosticsHTML() {
		const platform = getPlatformInfo();
		const entries = getDiagnosticsEntries().slice(-80).reverse();
		return `
    <div class="ucm-panel-toolbar u-flex u-items-start u-justify-between u-gap-ucm-2 u-flex-wrap">
      <button id="ucm-back-to-chains-secondary" class="ucm-secondary-button" type="button">\u2190 Chains</button>
      <span class="ucm-status-pill">Diagnostics</span>
    </div>
    <section class="ucm-subsection-card">
      <div class="u-flex u-items-center u-justify-between u-gap-ucm-2 u-flex-wrap">
        <h3>Diagnostics</h3>
        <div class="u-flex u-gap-2">
          <button id="ucm-diagnostics-test-realtime" class="ucm-secondary-button" type="button">Test Realtime</button>
          <button id="ucm-diagnostics-copy" class="ucm-secondary-button" type="button">Copy</button>
          <button id="ucm-diagnostics-clear" class="ucm-secondary-button" type="button">Clear</button>
        </div>
      </div>
      <div class="ucm-diagnostics-grid">
        ${[
			["Platform", platform.platform],
			["Backend", platform.backendUrl],
			["Script", platform.scriptVersion],
			["Transport", platform.lastTransport],
			["Events", platform.sseStatus],
			["Session", platform.hasSessionToken ? `present (${platform.sessionTokenLength})` : "missing"],
			["Member", platform.memberId],
			["Faction", platform.factionId],
			["PDA GET", platform.hasPdaGet],
			["PDA POST", platform.hasPdaPost],
			["GM XHR", platform.hasGmXmlHttpRequest || platform.hasGmNamespaceRequest],
			["Fetch", platform.hasFetch]
		].map(([label, value]) => `
    <div class="ucm-diagnostics-kv">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(formatPlatformValue(value))}</strong>
    </div>
  `).join("")}
      </div>
    </section>
    <section class="ucm-subsection-card">
      <h4>Recent Events</h4>
      <div class="ucm-diagnostics-log">
        ${entries.length ? entries.map((entry) => {
			const time = entry.ts ? new Date(entry.ts).toLocaleTimeString() : "";
			const details = entry.details === void 0 ? "" : `<code>${escapeHtml(JSON.stringify(entry.details))}</code>`;
			return `
      <div class="ucm-diagnostics-entry ucm-diagnostics-entry-${escapeHtml(entry.level)}">
        <span>${escapeHtml(time)}</span>
        <b>${escapeHtml(entry.area)}</b>
        <p>${escapeHtml(entry.message)}</p>
        ${details}
      </div>
    `;
		}).join("") : "<p class=\"ucm-section-copy\">No diagnostics recorded yet.</p>"}
      </div>
    </section>
  `;
	}
	function commandButton(action, icon, label, description, danger = false) {
		return `
    <button class="ucm-command-row${danger ? " is-danger" : ""}" data-ucm-command="${action}" type="button">
      <span class="ucm-command-icon" aria-hidden="true">${icon}</span>
      <span>
        <strong>${escapeHtml(label)}</strong>
        <small>${escapeHtml(description)}</small>
      </span>
    </button>
  `;
	}
	function buildCommandList(chain, canLead) {
		if (!canLead) return "";
		if (chain.status === "active") return `
      <div class="ucm-command-list">
        ${commandButton("hold", "⏸", "Hold All", "Pause hits and optionally block attacks.")}
        ${commandButton("release", "▶", "Release All", "Return the chain to free command mode.")}
        ${commandButton("pass", "🎫", "Issue Pass", "Let one member bypass the current block briefly.")}
        ${commandButton("target", "◎", "Assign Target", "Assign a hit and optional lock mode to a member.")}
        ${commandButton("watchlist", "☆", "Add Watchlist", "Track a target for chain leaders.")}
        ${commandButton("end", "✕", "End Chain", "Complete or cancel this chain.", true)}
      </div>
    `;
		if (chain.status === "scheduled") return `
      <div class="ucm-command-list">
        ${commandButton("start", "▶", "Start Chain", "Move this scheduled chain to active.")}
        ${commandButton("cancel", "✕", "Cancel Chain", "Cancel this scheduled chain.", true)}
      </div>
    `;
		return "";
	}
	async function buildOnlineMembersHTML(chainId, chain, canLead, canViewOverwatch) {
		if (!chainId || !["active", "forming"].includes(chain.status)) return "";
		if (!canLead && !canViewOverwatch) return "";
		try {
			const data = await listMembers(chainId);
			const sorted = (Array.isArray(data?.members) ? data.members : []).sort((a, b) => Number(b.isOnline) - Number(a.isOnline) || String(a.playerName || "").localeCompare(String(b.playerName || "")));
			if (sorted.length === 0) return `
        <section class="ucm-member-section">
          <h4>Online Members</h4>
          <p class="ucm-section-copy">No active faction members found.</p>
        </section>
      `;
			const cards = sorted.map((member) => `
      <article class="ucm-member-card${member.isOnline ? " is-online" : ""}">
        <div class="ucm-member-card-header">
          <div>
            <strong>${escapeHtml(member.playerName || member.tornUserId || "Unknown")}</strong>
            <span>${escapeHtml(presenceLabel(member))} · ${escapeHtml(formatRelativeTime(member.lastSeenAt))}</span>
          </div>
          <span class="ucm-presence-dot" aria-hidden="true"></span>
        </div>
        <div class="ucm-member-stat-grid">
          <span><small>Energy</small><b>${escapeHtml(formatEnergy(member))}</b></span>
          <span><small>Health</small><b>${escapeHtml(formatHealth(member))}</b></span>
          <span><small>Drug CD</small><b>${escapeHtml(member.drugCooldown || "—")}</b></span>
          <span><small>Status</small><b>${member.underAttackFlag ? "Under attack" : member.hospitalUntil ? "Hospital" : "Ready"}</b></span>
        </div>
        ${canLead ? `
          <button
            class="ucm-secondary-button ucm-member-command"
            data-ucm-command="pass"
            data-member-id="${escapeHtml(member.id)}"
            data-member-name="${escapeHtml(member.playerName || "")}"
            type="button"
          >Issue Command</button>
        ` : ""}
      </article>
    `).join("");
			return `
      <section class="ucm-member-section">
        <div class="u-flex u-items-center u-justify-between u-gap-ucm-2">
          <h4>Online Members</h4>
          <span class="ucm-status-pill">${sorted.filter((member) => member.isOnline).length} online</span>
        </div>
        <div class="ucm-member-grid">
          ${cards}
        </div>
      </section>
    `;
		} catch (error) {
			return `
      <section class="ucm-member-section">
        <h4>Online Members</h4>
        <p class="ucm-state-note">Unable to load member presence: ${escapeHtml(error?.message || "Unknown error")}</p>
      </section>
    `;
		}
	}
	async function renderChainDetailHTML(chainId) {
		const chain = (await getChain(chainId))?.chain;
		if (!chain) return buildPanelShell(`
      <div class="ucm-empty-state">
        <strong>Chain not found</strong>
        <p>This chain may have been deleted.</p>
      </div>
      <button id="ucm-back-to-chains" class="ucm-secondary-button" type="button">Back to Chains</button>
    `, "detail", chainId);
		const canLead = state.permissions.includes("chain.lead");
		const canViewOverwatch = state.permissions.includes("overwatch.view");
		const commandsHTML = buildCommandList(chain, canLead);
		const membersHTML = await buildOnlineMembersHTML(chainId, chain, canLead, canViewOverwatch);
		const summaryHTML = `
    <div class="ucm-chain-summary u-grid u-gap-3">
      <div class="ucm-summary-grid u-grid u-grid-cols-2 u-gap-3">
        <div class="ucm-summary-item">
          <span class="ucm-summary-label">Status</span>
          <strong>${escapeHtml(chain.status || "unknown")}</strong>
        </div>
        <div class="ucm-summary-item">
          <span class="ucm-summary-label">Scheduled</span>
          <strong>${formatDate(chain.scheduledStartUtc)}</strong>
        </div>
        <div class="ucm-summary-item">
          <span class="ucm-summary-label">Duration</span>
          <strong>${chain.expectedDurationMinutes || "—"}m</strong>
        </div>
        <div class="ucm-summary-item">
          <span class="ucm-summary-label">Mode</span>
          <strong>${chain.warMode ? "War" : "Normal"}</strong>
        </div>
      </div>
      ${chain.notes ? `<pre class="ucm-summary-notes">${escapeHtml(chain.notes)}</pre>` : ""}
    </div>
  `;
		const existingRsvp = state.rsvps[chainId] || null;
		let rsvpHTML;
		if (existingRsvp) rsvpHTML = `
      <div class="ucm-subsection-card">
        <div class="u-flex u-items-center u-justify-between u-gap-ucm-2">
          <h4>RSVP</h4>
          <button id="ucm-rsvp-edit" class="ucm-secondary-button" type="button">Edit</button>
        </div>
        <div class="ucm-summary-grid u-grid u-grid-cols-2 u-gap-3">
          <div class="ucm-summary-item">
            <span class="ucm-summary-label">Response</span>
            <strong>${escapeHtml({
			yes: "Yes",
			maybe: "Maybe",
			no: "No"
		}[existingRsvp.response] || existingRsvp.response)}</strong>
          </div>
          <div class="ucm-summary-item">
            <span class="ucm-summary-label">Late</span>
            <strong>${existingRsvp.lateMinutes ? existingRsvp.lateMinutes + "m" : "—"}</strong>
          </div>
        </div>
        ${existingRsvp.note ? `<p class="ucm-state-note">${escapeHtml(existingRsvp.note)}</p>` : ""}
      </div>
    `;
		else rsvpHTML = `
      <div class="ucm-subsection-card">
        <h4>RSVP</h4>
        <form id="ucm-rsvp-form">
          <div class="ucm-form-grid u-grid u-gap-3">
            <div>
              <label for="ucm-rsvp-response">Response</label>
              <select id="ucm-rsvp-response" name="response" required>
                <option value="yes">Yes</option>
                <option value="maybe">Maybe</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label for="ucm-rsvp-late">Late (minutes)</label>
              <input id="ucm-rsvp-late" name="lateMinutes" type="number" min="0" placeholder="0" />
            </div>
            <div class="u-col-span-full">
              <label for="ucm-rsvp-note">Note</label>
              <input id="ucm-rsvp-note" name="note" type="text" maxlength="200" placeholder="Optional" />
            </div>
          </div>
          <button type="submit" class="u-mt-ucm-2">Save RSVP</button>
        </form>
      </div>
    `;
		const primaryContent = `
    <div data-ucm-section-panel="primary" class="ucm-detail-section">
      <div class="ucm-detail-stack u-grid u-gap-3">
        ${summaryHTML}
        ${rsvpHTML}
        ${membersHTML}
      </div>
    </div>
  `;
		const advancedContent = commandsHTML ? `
    <div data-ucm-section-panel="advanced" class="ucm-detail-section" hidden>
      <div class="ucm-detail-stack u-grid u-gap-3">
        <div class="ucm-subsection-card">
          <h4>Commands</h4>
          ${commandsHTML}
        </div>
      </div>
    </div>
  ` : "";
		const tabsHTML = commandsHTML ? `
    <div class="ucm-detail-switcher u-grid u-grid-cols-2 u-gap-ucm-2">
      <button class="ucm-detail-tab is-active" data-ucm-section="primary" type="button" role="tab" aria-selected="true">Overview</button>
      <button class="ucm-detail-tab" data-ucm-section="advanced" type="button" role="tab" aria-selected="false" tabindex="-1">Commands</button>
    </div>
  ` : "";
		return buildPanelShell(`
    <div class="ucm-panel-toolbar u-flex u-items-start u-justify-between u-gap-ucm-2 u-flex-wrap">
      <button id="ucm-back-to-chains-secondary" class="ucm-secondary-button" type="button">\u2190 Chains</button>
      <span class="ucm-status-pill">${escapeHtml(chain.status || "unknown")}</span>
    </div>
    <h3>${escapeHtml(chain.title || "Untitled Chain")}</h3>
    ${tabsHTML}
    ${primaryContent}
    ${advancedContent}
  `, "detail", chainId);
	}
	async function renderIntoRoot(html) {
		if (!document.body) return null;
		let root = document.getElementById(CHAIN_PANEL_ROOT_ID);
		if (!root) {
			root = document.createElement("div");
			root.id = CHAIN_PANEL_ROOT_ID;
			document.body.appendChild(root);
		}
		const previousShell = document.getElementById("ucm-chain-panel-shell");
		const wasOpen = previousShell ? !previousShell.hidden : false;
		root.innerHTML = html;
		delete root.dataset.ucmBound;
		const nextShell = document.getElementById("ucm-chain-panel-shell");
		if (nextShell) nextShell.hidden = !wasOpen;
		return root;
	}
	async function renderListView() {
		return renderIntoRoot(buildPanelShell(await renderChainListHTML(), "list"));
	}
	async function renderCreateView() {
		return renderIntoRoot(buildPanelShell(renderChainCreateHTML(), "create"));
	}
	async function renderDetailView(chainId) {
		return renderIntoRoot(await renderChainDetailHTML(chainId));
	}
	async function renderDiagnosticsView() {
		return renderIntoRoot(buildPanelShell(buildDiagnosticsHTML(), "diagnostics"));
	}
	async function renderDefaultView() {
		let current;
		try {
			current = await getCurrentChain();
		} catch (error) {
			logDiagnostic("warn", "ui", "unable to load current chain for default view", { message: error?.message || "unknown error" });
			return renderListView();
		}
		const liveStatuses = new Set([
			"active",
			"forming",
			"scheduled"
		]);
		const currentChain = current?.chain;
		if (currentChain?.id && liveStatuses.has(currentChain.status)) {
			activeDetailSection = DEFAULT_DETAIL_SECTION;
			try {
				return await renderDetailView(currentChain.id);
			} catch (error) {
				logDiagnostic("warn", "ui", "unable to render current chain detail; falling back to chain list", {
					chainId: currentChain.id,
					status: currentChain.status,
					message: error?.message || "unknown error"
				});
				return renderListView();
			}
		}
		return renderListView();
	}
	function closePanel() {
		const { shell, button } = getElements();
		if (!shell) return;
		shell.hidden = true;
		button?.focus();
	}
	function closeCommandModal() {
		const { commandModal, commandModalBody, commandModalForm } = getElements();
		if (!commandModal) return;
		commandModal.hidden = true;
		if (commandModalBody) commandModalBody.innerHTML = "";
		commandModalForm?.removeAttribute("data-command-action");
	}
	function modalFields(action, defaults = {}) {
		const memberId = escapeHtml(defaults.memberId || "");
		const memberName = escapeHtml(defaults.memberName || "");
		switch (action) {
			case "hold": return `
        <input type="hidden" name="action" value="hold" />
        <label for="ucm-modal-hold-reason">Reason</label>
        <input id="ucm-modal-hold-reason" name="reason" type="text" maxlength="200" placeholder="Optional" />
        <label class="ucm-checkbox-row" for="ucm-modal-hold-block">
          <input id="ucm-modal-hold-block" name="blockAttackButton" type="checkbox" checked />
          <span>Block attack button</span>
        </label>
      `;
			case "release": return `
        <input type="hidden" name="action" value="release" />
        <label for="ucm-modal-release-reason">Reason</label>
        <input id="ucm-modal-release-reason" name="reason" type="text" maxlength="200" placeholder="Optional" />
      `;
			case "pass": return `
        <input type="hidden" name="action" value="pass" />
        ${memberName ? `<p class="ucm-state-note">Issuing pass for ${memberName}</p>` : ""}
        <label for="ucm-modal-pass-member">Member ID</label>
        <input id="ucm-modal-pass-member" name="memberId" type="text" value="${memberId}" required />
        <label for="ucm-modal-pass-ttl">TTL (seconds)</label>
        <input id="ucm-modal-pass-ttl" name="ttlSeconds" type="number" min="10" value="45" required />
        <label for="ucm-modal-pass-reason">Reason</label>
        <input id="ucm-modal-pass-reason" name="reason" type="text" maxlength="200" placeholder="Optional" />
      `;
			case "target": return `
        <input type="hidden" name="action" value="target" />
        <label for="ucm-modal-target-assignee">Assignee Member ID</label>
        <input id="ucm-modal-target-assignee" name="assigneeMemberId" type="text" value="${memberId}" required />
        <label for="ucm-modal-target-enemy">Enemy Torn User ID</label>
        <input id="ucm-modal-target-enemy" name="enemyTornUserId" type="number" min="1" required />
        <label for="ucm-modal-target-hit">Hit Number</label>
        <input id="ucm-modal-target-hit" name="hitNumber" type="number" min="1" required />
        <label for="ucm-modal-target-lock">Lock Mode</label>
        <select id="ucm-modal-target-lock" name="lockMode">
          <option value="target_only">Target Only</option>
          <option value="bonus_hit_lock">Bonus Hit Lock</option>
        </select>
        <label for="ucm-modal-target-note">Note</label>
        <input id="ucm-modal-target-note" name="note" type="text" maxlength="200" placeholder="Optional" />
      `;
			case "watchlist": return `
        <input type="hidden" name="action" value="watchlist" />
        <label for="ucm-modal-wl-enemy">Enemy Torn User ID</label>
        <input id="ucm-modal-wl-enemy" name="enemyTornUserId" type="number" min="1" required />
        <label for="ucm-modal-wl-label">Label</label>
        <input id="ucm-modal-wl-label" name="label" type="text" maxlength="120" placeholder="Optional" />
        <label for="ucm-modal-wl-priority">Priority</label>
        <input id="ucm-modal-wl-priority" name="priority" type="number" min="1" value="100" />
      `;
			case "start": return "<input type=\"hidden\" name=\"action\" value=\"start\" /><p class=\"ucm-section-copy\">Start this chain now and open the live event stream.</p>";
			case "cancel": return `
        <input type="hidden" name="action" value="cancel" />
        <label for="ucm-modal-cancel-reason">Reason</label>
        <input id="ucm-modal-cancel-reason" name="reason" type="text" maxlength="200" placeholder="Optional" />
      `;
			case "end": return `
        <input type="hidden" name="action" value="end" />
        <label for="ucm-modal-end-outcome">Outcome</label>
        <select id="ucm-modal-end-outcome" name="outcome">
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <label for="ucm-modal-end-reason">Reason</label>
        <input id="ucm-modal-end-reason" name="reason" type="text" maxlength="200" placeholder="Optional" />
      `;
			default: return "";
		}
	}
	function openCommandModal(action, defaults = {}) {
		const { commandModal, commandModalBody, commandModalTitle, commandModalForm } = getElements();
		if (!commandModal || !commandModalBody || !commandModalForm) return;
		commandModalTitle.textContent = {
			hold: "Hold All",
			release: "Release All",
			pass: "Issue Pass",
			target: "Assign Target",
			watchlist: "Add Watchlist",
			start: "Start Chain",
			cancel: "Cancel Chain",
			end: "End Chain"
		}[action] || "Command";
		commandModalForm.dataset.commandAction = action;
		commandModalBody.innerHTML = modalFields(action, defaults);
		commandModal.hidden = false;
		commandModal.querySelector("input:not([type=\"hidden\"]), select, button")?.focus();
	}
	async function openPanel() {
		const { shell } = getElements();
		if (shell) shell.hidden = false;
		try {
			if (getCurrentView() === "detail" && getCurrentChainId()) await renderDetailView(getCurrentChainId());
			else if (getCurrentView() === "create") await renderCreateView();
			else await renderDefaultView();
			const { shell: nextShell } = getElements();
			if (nextShell) nextShell.hidden = false;
			bindEvents(true);
		} catch (error) {
			logDiagnostic("error", "ui", "unable to open chain panel", { message: error?.message || "unknown error" });
		}
	}
	async function refreshCurrentView() {
		const currentView = getCurrentView();
		if (currentView === "create") await renderCreateView();
		else if (currentView === "detail" && getCurrentChainId()) await renderDetailView(getCurrentChainId());
		else await renderListView();
		const { shell } = getElements();
		if (shell) shell.hidden = false;
		bindEvents(true);
	}
	async function refreshAfterAction(message = "", view = "detail", chainId = "") {
		if (view === "list") await renderListView();
		else if (view === "create") await renderCreateView();
		else if (chainId) await renderDetailView(chainId);
		else await renderListView();
		const { shell } = getElements();
		if (shell) shell.hidden = false;
		bindEvents(true);
		if (message) showNotification(message);
	}
	function finishCommandWithoutRefresh(message, commandMode = "") {
		activeDetailSection = "advanced";
		if (commandMode) {
			state.commandMode = commandMode;
			if (state.currentChain) state.currentChain.commandMode = commandMode;
		}
		closeCommandModal();
		setChainPanelStatus(message, "success");
		showNotification(message);
	}
	async function submitCreate(event) {
		event.preventDefault();
		const data = new FormData(event.currentTarget);
		setChainPanelStatus("Creating chain...");
		try {
			const response = await submitChainCreate(data);
			activeDetailSection = DEFAULT_DETAIL_SECTION;
			await refreshAfterAction("Chain created.", "detail", response?.chain?.id || "");
		} catch (error) {
			setChainPanelStatus(error?.message || "Unable to create chain.", "error");
		}
	}
	async function submitRSVP(event) {
		event.preventDefault();
		const chainId = getCurrentChainId();
		if (!chainId) {
			setChainPanelStatus("No chain selected.", "error");
			return;
		}
		const data = new FormData(event.currentTarget);
		const lateValue = String(data.get("lateMinutes") || "").trim();
		setChainPanelStatus("Saving RSVP...");
		const payload = {
			response: String(data.get("response") || ""),
			lateMinutes: lateValue ? Number(lateValue) : null,
			note: String(data.get("note") || "").trim() || null
		};
		try {
			await rsvp(chainId, payload);
			state.rsvps[chainId] = payload;
			await refreshAfterAction("RSVP saved.", "detail", chainId);
		} catch (error) {
			setChainPanelStatus(error?.message || "Unable to save RSVP.", "error");
		}
	}
	async function submitCommandModal(event) {
		event.preventDefault();
		const chainId = getCurrentChainId();
		if (!chainId) {
			setChainPanelStatus("No chain selected.", "error");
			return;
		}
		const form = event.currentTarget;
		const data = new FormData(form);
		const action = form.dataset.commandAction || String(data.get("action") || "");
		setChainPanelStatus("Submitting command...");
		try {
			if (action === "hold") {
				await holdAll(chainId, {
					reason: String(data.get("reason") || "").trim(),
					blockAttackButton: data.get("blockAttackButton") === "on"
				});
				finishCommandWithoutRefresh("Hold all applied.", "hold_all");
				return;
			}
			if (action === "release") {
				await releaseAll(chainId, { reason: String(data.get("reason") || "").trim() });
				finishCommandWithoutRefresh("Released hold.", "free");
				return;
			}
			if (action === "pass") {
				await issuePass(chainId, {
					memberId: String(data.get("memberId") || ""),
					ttlSeconds: Number(data.get("ttlSeconds")) || 45,
					reason: String(data.get("reason") || "").trim() || null
				});
				activeDetailSection = "advanced";
				closeCommandModal();
				await refreshAfterAction("Pass issued.", "detail", chainId);
				return;
			}
			if (action === "target") {
				await assignTarget(chainId, {
					assigneeMemberId: String(data.get("assigneeMemberId") || ""),
					enemyTornUserId: Number(data.get("enemyTornUserId")),
					hitNumber: Number(data.get("hitNumber")),
					lockMode: String(data.get("lockMode") || "target_only"),
					note: String(data.get("note") || "").trim() || null
				});
				activeDetailSection = "advanced";
				closeCommandModal();
				await refreshAfterAction("Target assigned.", "detail", chainId);
				return;
			}
			if (action === "watchlist") {
				await addWatchlistEntry(chainId, {
					enemyTornUserId: Number(data.get("enemyTornUserId")),
					label: String(data.get("label") || "").trim() || null,
					priority: Number(data.get("priority")) || 100
				});
				activeDetailSection = "advanced";
				closeCommandModal();
				await refreshAfterAction("Watchlist entry added.", "detail", chainId);
				return;
			}
			if (action === "start") {
				await startChain(chainId);
				connectEventPolling(handleEvent);
				activeDetailSection = DEFAULT_DETAIL_SECTION;
				closeCommandModal();
				await refreshAfterAction("Chain started.", "detail", chainId);
				return;
			}
			if (action === "cancel" || action === "end") {
				const outcome = action === "cancel" ? "cancelled" : String(data.get("outcome") || "completed");
				await endChain(chainId, {
					outcome,
					reason: String(data.get("reason") || "").trim() || null
				});
				disconnectEventPolling();
				closeCommandModal();
				await refreshAfterAction(`Chain ${outcome}.`, "list");
				return;
			}
			throw new Error("Unknown command.");
		} catch (error) {
			setChainPanelStatus(error?.message || "Unable to submit command.", "error");
		}
	}
	function bindEvents(force = false) {
		const { root, button, close, refresh, diagnostics, addChain, back, backSecondary, createForm, rsvpForm, rsvpEdit, commandButtons, commandModal, commandModalClose, commandModalCancel, commandModalForm, chainButtons, shell, sectionTabs } = getElements();
		if (!root || !force && root.dataset.ucmBound === "1") return;
		root.dataset.ucmBound = "1";
		button?.addEventListener("click", openPanel);
		close?.addEventListener("click", closePanel);
		refresh?.addEventListener("click", async () => {
			try {
				if (getCurrentView() === "diagnostics") {
					await renderDiagnosticsView();
					const { shell: nextShell } = getElements();
					if (nextShell) nextShell.hidden = false;
					bindEvents(true);
				} else await refreshCurrentView();
			} catch (error) {
				setChainPanelStatus(error?.message || "Unable to refresh view.", "error");
			}
		});
		diagnostics?.addEventListener("click", async () => {
			try {
				await renderDiagnosticsView();
				const { shell: nextShell } = getElements();
				if (nextShell) nextShell.hidden = false;
				bindEvents(true);
			} catch (error) {
				setChainPanelStatus(error?.message || "Unable to open diagnostics.", "error");
			}
		});
		addChain?.addEventListener("click", async () => {
			try {
				await renderCreateView();
				const { shell: nextShell } = getElements();
				if (nextShell) nextShell.hidden = false;
				bindEvents(true);
			} catch (error) {
				setChainPanelStatus(error?.message || "Unable to open create view.", "error");
			}
		});
		const backToList = async () => {
			try {
				await renderListView();
				const { shell: nextShell } = getElements();
				if (nextShell) nextShell.hidden = false;
				bindEvents(true);
			} catch (error) {
				setChainPanelStatus(error?.message || "Unable to return to chains.", "error");
			}
		};
		back?.addEventListener("click", backToList);
		backSecondary?.addEventListener("click", backToList);
		document.getElementById("ucm-diagnostics-clear")?.addEventListener("click", async () => {
			clearDiagnostics();
			logDiagnostic("info", "diagnostics", "diagnostics cleared");
			await renderDiagnosticsView();
			const { shell: nextShell } = getElements();
			if (nextShell) nextShell.hidden = false;
			bindEvents(true);
		});
		document.getElementById("ucm-diagnostics-copy")?.addEventListener("click", async () => {
			const text = serializeDiagnostics();
			try {
				await navigator.clipboard.writeText(text);
				setChainPanelStatus("Diagnostics copied.", "success");
				logDiagnostic("ok", "diagnostics", "diagnostics copied");
			} catch (error) {
				setChainPanelStatus("Unable to copy diagnostics. Use console __UCM_DIAGNOSTICS__.text().", "error");
				logDiagnostic("warn", "diagnostics", "diagnostics copy failed", { message: error?.message || "unknown error" });
			}
		});
		document.getElementById("ucm-diagnostics-test-realtime")?.addEventListener("click", async () => {
			setChainPanelStatus("Testing realtime transports...");
			let finalMessage = "";
			let finalKind = "info";
			try {
				const result = await runRealtimeTransportTests();
				finalMessage = `${result.websocket?.ok ? "WebSocket ok" : "WebSocket failed"}; ${result.grpcWeb?.ok ? "gRPC-Web ok" : "gRPC-Web failed"}.`;
				finalKind = result.websocket?.ok || result.grpcWeb?.ok ? "success" : "error";
			} catch (error) {
				finalMessage = error?.message || "Realtime test failed.";
				finalKind = "error";
			} finally {
				await renderDiagnosticsView();
				const { shell } = getElements();
				if (shell) shell.hidden = false;
				bindEvents(true);
				setChainPanelStatus(finalMessage, finalKind);
			}
		});
		for (const chainButton of chainButtons) chainButton.addEventListener("click", async () => {
			try {
				activeDetailSection = DEFAULT_DETAIL_SECTION;
				await renderDetailView(chainButton.dataset.chainId);
				const { shell: nextShell } = getElements();
				if (nextShell) nextShell.hidden = false;
				bindEvents(true);
			} catch (error) {
				setChainPanelStatus(error?.message || "Unable to load chain.", "error");
			}
		});
		for (const tab of sectionTabs) tab.addEventListener("click", () => {
			applyDetailSection(tab.dataset.ucmSection || DEFAULT_DETAIL_SECTION);
		});
		for (const commandButtonEl of commandButtons) commandButtonEl.addEventListener("click", () => {
			openCommandModal(commandButtonEl.dataset.ucmCommand, {
				memberId: commandButtonEl.dataset.memberId || "",
				memberName: commandButtonEl.dataset.memberName || ""
			});
		});
		createForm?.addEventListener("submit", submitCreate);
		rsvpForm?.addEventListener("submit", submitRSVP);
		rsvpEdit?.addEventListener("click", () => {
			const chainId = getCurrentChainId();
			if (chainId) {
				delete state.rsvps[chainId];
				refreshCurrentView();
			}
		});
		commandModalForm?.addEventListener("submit", submitCommandModal);
		commandModalClose?.addEventListener("click", closeCommandModal);
		commandModalCancel?.addEventListener("click", closeCommandModal);
		commandModal?.addEventListener("click", (event) => {
			if (event.target instanceof HTMLElement && event.target.dataset.ucmCloseCommand === "1") closeCommandModal();
		});
		shell?.addEventListener("click", (event) => {
			if (event.target instanceof HTMLElement && event.target.dataset.ucmClose === "panel") closePanel();
		});
		if (getCurrentView() === "detail") applyDetailSection(activeDetailSection);
	}
	async function initChainPanel() {
		const root = await renderIntoRoot(buildPanelShell(`
    <div class="ucm-empty-state">
      <strong>Loading UCM</strong>
      <p>Preparing chain controls.</p>
    </div>
  `, "loading"));
		bindEvents(true);
		if (!hasAnyChainControlPermission()) {
			logDiagnostic("warn", "ui", "chain panel opened without chain-control permissions", {
				permissionCount: Array.isArray(state.permissions) ? state.permissions.length : 0,
				permissions: Array.isArray(state.permissions) ? state.permissions : []
			});
			await renderIntoRoot(buildPanelShell(`
      <div class="ucm-empty-state">
        <strong>UCM active</strong>
        <p>No chain-control permissions are available in this session.</p>
      </div>
      ${buildDiagnosticsHTML()}
    `, "diagnostics"));
			bindEvents(true);
			return document.getElementById(CHAIN_PANEL_ROOT_ID);
		}
		try {
			const nextRoot = await renderDefaultView();
			if (!nextRoot) return root;
			bindEvents(true);
			return nextRoot;
		} catch (error) {
			logDiagnostic("error", "ui", "unable to render chain panel", { message: error?.message || "unknown error" });
			await renderIntoRoot(buildPanelShell(`
      <div class="ucm-empty-state">
        <strong>UCM panel error</strong>
        <p>${escapeHtml(error?.message || "Unable to render chain controls.")}</p>
      </div>
      ${buildDiagnosticsHTML()}
    `, "diagnostics"));
			bindEvents(true);
			return document.getElementById(CHAIN_PANEL_ROOT_ID);
		}
	}
	//#endregion
	//#region src/dom/mutation-observer.js
	var observer = null;
	var debounceTimer = null;
	var isApplying = false;
	/**
	* Initialize the MutationObserver to re-apply attack button state
	* after React re-renders.
	*/
	function initMutationObserver() {
		const target = document.getElementById("react-root") || document.body;
		observer = new MutationObserver(() => {
			if (isApplying) return;
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => {
				isApplying = true;
				try {
					reapplyIfNeeded(isBlocked());
				} finally {
					isApplying = false;
				}
			}, CONFIG.MUTATION_OBSERVER_DEBOUNCE_MS);
		});
		observer.observe(target, {
			childList: true,
			subtree: true
		});
	}
	//#endregion
	//#region src/main.js
	/**
	* UCM Userscript Entry Point
	*
	* Initialization sequence:
	* 1. Load session from localStorage
	* 2. Inject styles
	* 3. Connect event polling for real-time events
	* 4. Initialize MutationObserver
	*/
	(function ucmInit() {
		"use strict";
		if (window.__UCM_INITIALIZED__) return;
		window.__UCM_INITIALIZED__ = true;
		logDiagnostic("info", "startup", "Ultimate Chain Manager initializing", {
			href: window.location.href,
			readyState: document.readyState,
			backendUrl: CONFIG.BACKEND_URL,
			isTopWindow: window.top === window.self
		});
		state.sessionToken = normalizeSessionToken(storageGet(CONFIG.STORAGE.SESSION_TOKEN));
		state.memberId = storageGet(CONFIG.STORAGE.MEMBER_ID);
		state.factionId = storageGet(CONFIG.STORAGE.FACTION_ID);
		const storedPerms = storageGet(CONFIG.STORAGE.PERMISSIONS);
		if (storedPerms) try {
			state.permissions = JSON.parse(storedPerms);
		} catch (e) {
			logDiagnostic("warn", "startup", "failed to parse stored permissions JSON; resetting permissions", { error: e?.message || "unknown" });
			state.permissions = [];
		}
		logDiagnostic("info", "startup", "session bootstrap state", {
			hasSessionToken: hasValidSessionToken(state.sessionToken),
			sessionTokenLength: state.sessionToken?.length || 0,
			memberId: state.memberId || null,
			factionId: state.factionId || null,
			permissionCount: state.permissions.length
		});
		updatePostHogUserContext({
			memberId: state.memberId,
			factionId: state.factionId,
			permissionCount: state.permissions.length
		});
		injectStyles();
		if (!hasValidSessionToken(state.sessionToken)) {
			logDiagnostic("info", "startup", "no valid session found; enabling onboarding prompt", {
				href: window.location.href,
				hasSessionToken: false,
				isTopWindow: window.top === window.self
			});
			initOnboardingRouteWatcherForTornPda();
			return;
		}
		if (window.top !== window.self) {
			logDiagnostic("info", "startup", "session found, but skipping active controls in embedded context");
			return;
		}
		installAttackClickGuard(isBlocked);
		getCurrentChain().then((data) => {
			const chain = data?.chain || null;
			state.currentChain = chain;
			state.currentChainId = chain?.id || null;
			state.commandMode = chain?.commandMode || "free";
			initChainPanel().finally(() => {
				if (chain?.status === "active") connectEventPolling(handleEvent);
				else logDiagnostic("info", "events", "event polling deferred until a chain is active", { currentChainStatus: chain?.status || null });
			});
			initMutationObserver();
			if (isAttackPage()) reapplyIfNeeded(isBlocked());
			logDiagnostic("ok", "startup", "initialized successfully");
		}).catch((error) => {
			logDiagnostic("error", "startup", "unable to sync current chain state", { message: error?.message || "unknown error" });
			initChainPanel();
			initMutationObserver();
			if (isAttackPage()) reapplyIfNeeded(isBlocked());
		});
	})();
	//#endregion
})();

(function() {	try {		if (typeof document != "undefined") {			var elementStyle = document.createElement("style");			elementStyle.appendChild(document.createTextNode(".u-grid{display:grid;}.u-col-span-full{grid-column:1/-1;}.u-grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr));}.u-mt-ucm-2{margin-top:var(--ucm-space-2);}.u-mt-ucm-3{margin-top:var(--ucm-space-3);}.u-flex{display:flex;}.u-flex-col{flex-direction:column;}.u-flex-wrap{flex-wrap:wrap;}.u-items-start{align-items:flex-start;}.u-items-center{align-items:center;}.u-justify-between{justify-content:space-between;}.u-gap-2{gap:0.5rem;}.u-gap-3{gap:0.75rem;}.u-gap-ucm-2{gap:var(--ucm-space-2);}.u-gap-ucm-3{gap:var(--ucm-space-3);}/*$vite$:1*/"));			document.head.appendChild(elementStyle);		}	} catch (e) {		console.error("vite-plugin-css-injected-by-js", e);	}})();