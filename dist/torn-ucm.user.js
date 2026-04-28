// ==UserScript==
// @name         Torn UCM - Ultimate Chain Manager
// @namespace    https://github.com/kneely/torn-ucm-userscript
// @version      2.0.0
// @description  Faction chain coordination for Torn - real-time commands, attack blocking, and presence tracking
// @author       kneely
// @match        https://www.torn.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      ucm.neelyinno.com
// @run-at       document-idle
// ==/UserScript==
(function() {
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
	async function parseFetchResponse(resp) {
		const contentType = resp.headers.get("content-type") || "";
		if (resp.status === 204) return null;
		try {
			return parseBody(contentType, await resp.text());
		} catch {
			return null;
		}
	}
	function parseGmResponse(response) {
		const contentType = (response.responseHeaders?.match(/^content-type:\s*([^\r\n]+)/im))?.[1] || "";
		if (response.status === 204) return null;
		return parseBody(contentType, response.responseText || "");
	}
	function getUserscriptRequest$1() {
		if (typeof GM_xmlhttpRequest === "function") return GM_xmlhttpRequest;
		if (typeof GM !== "undefined" && typeof GM.xmlHttpRequest === "function") return GM.xmlHttpRequest.bind(GM);
		return null;
	}
	function requestViaUserscript(method, url, opts) {
		const gmRequest = getUserscriptRequest$1();
		if (!gmRequest) return null;
		return new Promise((resolve, reject) => {
			gmRequest({
				method,
				url,
				headers: opts.headers,
				data: opts.body,
				responseType: "text",
				onload: (response) => {
					resolve({
						ok: response.status >= 200 && response.status < 300,
						status: response.status,
						data: parseGmResponse(response)
					});
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
	/**
	* Make an authenticated request to the UCM backend.
	*/
	async function requestOnce(method, path, body = null) {
		const url = `${CONFIG.BACKEND_URL}${path}`;
		const isOnboardRequest = path === "/auth/onboard-member";
		const opts = {
			method,
			headers: { "Content-Type": "application/json" }
		};
		if (state.sessionToken) opts.headers.Authorization = `Bearer ${state.sessionToken}`;
		if (body) opts.body = JSON.stringify(body);
		if (isOnboardRequest) console.log("[UCM][api] onboarding request start", {
			method,
			url,
			hasUserscriptRequest: Boolean(getUserscriptRequest$1()),
			timezone: body?.timezone,
			scriptVersion: body?.scriptVersion,
			apiKeyLength: body?.apiKey?.length || 0
		});
		try {
			const gmResponse = await requestViaUserscript(method, url, opts);
			if (gmResponse) {
				if (isOnboardRequest) console.log("[UCM][api] onboarding userscript request completed", {
					status: gmResponse.status,
					ok: gmResponse.ok,
					hasSessionToken: Boolean(gmResponse.data?.sessionToken)
				});
				if (!gmResponse.ok) throw new ApiError(gmResponse.data?.error || gmResponse.data?.message || `Request failed: ${gmResponse.status}`, gmResponse.status, gmResponse.data);
				return gmResponse.data;
			}
		} catch (err) {
			if (isOnboardRequest) console.error("[UCM][api] onboarding userscript request failed", { message: err?.message || "unknown error" });
			if (err instanceof ApiError) throw err;
			if (getUserscriptRequest$1()) throw new Error(err?.message || "Userscript network request failed.");
		}
		let resp;
		try {
			resp = await fetch(url, opts);
		} catch (err) {
			if (isOnboardRequest) console.error("[UCM][api] onboarding fetch request failed", { message: err?.message || "unknown error" });
			throw new Error(`Network request failed: ${err?.message || "unknown error"}`);
		}
		const data = await parseFetchResponse(resp);
		if (isOnboardRequest) console.log("[UCM][api] onboarding fetch request completed", {
			status: resp.status,
			ok: resp.ok,
			hasSessionToken: Boolean(data?.sessionToken)
		});
		if (!resp.ok) throw new ApiError(data?.error || data?.message || `Request failed: ${resp.status}`, resp.status, data);
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
			console.log("[UCM][api] session refreshed", {
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
	async function request(method, path, body = null, hasRetried = false) {
		try {
			return await requestOnce(method, path, body);
		} catch (error) {
			if (!hasRetried && error?.status === 401 && canRefreshSession(path)) {
				await refreshSession();
				return request(method, path, body, true);
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
	var TARGET_PATH = "/factions.php";
	var EMPTY_SESSION_VALUES = new Set([
		"",
		"undefined",
		"null"
	]);
	var routeWatcherInstalled = false;
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
			const { pathname, searchParams } = new URL(locationHref);
			return pathname === TARGET_PATH && searchParams.get("step") === "your" && searchParams.get("type") === "1";
		} catch {
			return false;
		}
	}
	function logOnboarding(message, details = void 0, level = "log") {
		const prefix = `[UCM][onboarding][${(/* @__PURE__ */ new Date()).toISOString()}] ${message}`;
		if (details !== void 0) console[level](prefix, details);
		else console[level](prefix);
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
		const routeMatch = isOnboardingRoute();
		const rawSessionToken = storageGet(CONFIG.STORAGE.SESSION_TOKEN);
		const hasSession = hasValidSessionToken(rawSessionToken);
		logOnboarding("eligibility check", {
			href: window.location.href,
			routeMatch,
			hasSessionToken: hasSession,
			sessionTokenLength: rawSessionToken?.length || 0,
			isTopWindow: window.top === window.self,
			readyState: document.readyState
		});
		if (hasSession) return false;
		if (!routeMatch) return false;
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
	//#region src/api/sse-client.js
	/**
	* SSE client implemented on top of GM_xmlhttpRequest.
	*
	* The native EventSource API is subject to the page's Content Security Policy,
	* and Torn's CSP does not whitelist our backend in `connect-src`. Routing the
	* stream through the userscript manager (which respects `@connect` metadata)
	* is the only way to keep a long-lived connection open on torn.com.
	*
	* We read the text response incrementally via `onprogress` and parse the SSE
	* wire format manually: blocks separated by a blank line, each with `event:`,
	* `data:`, and (optionally) `id:` fields.
	*/
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
	var currentRequest = null;
	var reconnectAttempts = 0;
	var disposed = false;
	var onEventCallback = null;
	var lastEventId = 0;
	function getUserscriptRequest() {
		if (typeof GM_xmlhttpRequest === "function") return GM_xmlhttpRequest;
		if (typeof GM !== "undefined" && typeof GM.xmlHttpRequest === "function") return GM.xmlHttpRequest.bind(GM);
		return null;
	}
	function scheduleReconnect() {
		if (disposed) return;
		const base = Math.min(1e3 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
		const jitter = Math.floor(Math.random() * 500);
		reconnectAttempts += 1;
		setTimeout(() => {
			if (!disposed) openStream();
		}, base + jitter);
	}
	function dispatchBlock(block) {
		let eventType = "message";
		const dataLines = [];
		let id = "0";
		for (const rawLine of block.split("\n")) {
			const line = rawLine.replace(/\r$/, "");
			if (!line) continue;
			if (line.startsWith(":")) continue;
			const colon = line.indexOf(":");
			const field = colon === -1 ? line : line.slice(0, colon);
			let value = colon === -1 ? "" : line.slice(colon + 1);
			if (value.startsWith(" ")) value = value.slice(1);
			if (field === "event") eventType = value;
			else if (field === "data") dataLines.push(value);
			else if (field === "id") id = value;
		}
		if (dataLines.length === 0) return;
		if (!SUPPORTED_EVENT_TYPES.has(eventType)) return;
		const payload = dataLines.join("\n");
		try {
			const parsed = JSON.parse(payload);
			const parsedId = parseInt(id, 10) || 0;
			if (parsedId > lastEventId) lastEventId = parsedId;
			onEventCallback(eventType, parsed, parsedId);
		} catch (err) {
			console.warn("[UCM] Failed to parse SSE event:", err);
		}
	}
	function openStream() {
		const gmRequest = getUserscriptRequest();
		if (!gmRequest) {
			console.error("[UCM] GM_xmlhttpRequest unavailable; cannot open SSE stream.");
			return;
		}
		const url = `${CONFIG.BACKEND_URL}/events/stream?token=${encodeURIComponent(state.sessionToken)}`;
		let buffer = "";
		let lastTextLength = 0;
		let announcedOpen = false;
		const markOpen = () => {
			if (announcedOpen) return;
			announcedOpen = true;
			reconnectAttempts = 0;
			console.log("[UCM] SSE connected");
		};
		const ingest = (response) => {
			const text = response?.responseText || "";
			if (text.length <= lastTextLength) return;
			const chunk = text.slice(lastTextLength);
			lastTextLength = text.length;
			buffer += chunk;
			const separator = /\r?\n\r?\n/;
			let match;
			while ((match = separator.exec(buffer)) !== null) {
				const block = buffer.slice(0, match.index);
				buffer = buffer.slice(match.index + match[0].length);
				if (block.length > 0) dispatchBlock(block);
			}
		};
		currentRequest = gmRequest({
			method: "GET",
			url,
			headers: {
				Accept: "text/event-stream",
				"Cache-Control": "no-cache",
				...lastEventId > 0 ? { "Last-Event-ID": String(lastEventId) } : {}
			},
			responseType: "text",
			onloadstart: markOpen,
			onprogress: (response) => {
				markOpen();
				ingest(response);
			},
			onload: (response) => {
				ingest(response);
				if (disposed) return;
				console.warn("[UCM] SSE stream ended, reconnecting...");
				scheduleReconnect();
			},
			onerror: () => {
				if (disposed) return;
				console.warn("[UCM] SSE connection error, reconnecting...");
				scheduleReconnect();
			},
			ontimeout: () => {
				if (disposed) return;
				console.warn("[UCM] SSE timed out, reconnecting...");
				scheduleReconnect();
			}
		});
	}
	function connectSSE(onEvent) {
		if (currentRequest && onEventCallback === onEvent && !disposed) return;
		onEventCallback = onEvent;
		disposed = false;
		reconnectAttempts = 0;
		if (currentRequest && typeof currentRequest.abort === "function") try {
			currentRequest.abort();
		} catch {}
		currentRequest = null;
		openStream();
	}
	function disconnectSSE() {
		disposed = true;
		reconnectAttempts = 0;
		if (currentRequest && typeof currentRequest.abort === "function") try {
			currentRequest.abort();
		} catch {}
		currentRequest = null;
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
	/** Tier 1: Exact CSS selector from settings */
	function findByCssSelector() {
		try {
			const btn = document.querySelector(CONFIG.SELECTORS.CSS);
			if (btn && isStartFightButton(btn)) return btn;
		} catch (e) {}
		return null;
	}
	/** Tier 2: Semantic selector inside defender modal */
	function findBySemanticSelector() {
		const buttons = document.querySelectorAll("button[type=\"submit\"]");
		for (const btn of buttons) if (isVisible(btn) && isStartFightButton(btn)) return btn;
		return null;
	}
	/** Tier 3: XPath fallback */
	function findByXpath() {
		try {
			const btn = document.evaluate(CONFIG.SELECTORS.XPATH, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
			if (btn && isStartFightButton(btn)) return btn;
		} catch (e) {}
		return null;
	}
	/** Tier 4: Last resort text match */
	function findByTextMatch() {
		const buttons = document.querySelectorAll("button");
		for (const btn of buttons) if (btn.textContent.trim() === "Start fight" && isVisible(btn)) return btn;
		return null;
	}
	/**
	* Try all 4 tiers in order, return first match.
	*/
	function findAttackButton() {
		return findByCssSelector() || findBySemanticSelector() || findByXpath() || findByTextMatch();
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
			console.debug("[UCM] Attack page detected, but no attack button found yet.");
			return;
		}
		if (!(btn.getAttribute("data-ucm-blocked") === "true" && btn.disabled && btn.getAttribute("aria-disabled") === "true")) console.log("Blocking attack button");
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
			if (button.getAttribute("data-ucm-blocked") === "true" || button.textContent.trim().toLowerCase() === "start fight") {
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
	* Handle a single event from the SSE stream.
	* Called with (type, payload, eventId) from the SSE client.
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
			default: console.log("[UCM] Unknown event type:", type);
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
	async function renderDefaultView() {
		const current = await getCurrentChain();
		const liveStatuses = new Set([
			"active",
			"forming",
			"scheduled"
		]);
		const currentChain = current?.chain;
		if (currentChain?.id && liveStatuses.has(currentChain.status)) {
			activeDetailSection = DEFAULT_DETAIL_SECTION;
			return renderDetailView(currentChain.id);
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
		try {
			if (getCurrentView() === "detail" && getCurrentChainId()) await renderDetailView(getCurrentChainId());
			else if (getCurrentView() === "create") await renderCreateView();
			else await renderDefaultView();
			const { shell } = getElements();
			if (shell) shell.hidden = false;
			bindEvents(true);
		} catch (error) {
			console.error("[UCM] Unable to open chain panel:", error?.message || error);
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
				activeDetailSection = "advanced";
				closeCommandModal();
				await refreshAfterAction("Hold all applied.", "detail", chainId);
				return;
			}
			if (action === "release") {
				await releaseAll(chainId, { reason: String(data.get("reason") || "").trim() });
				activeDetailSection = "advanced";
				closeCommandModal();
				await refreshAfterAction("Released hold.", "detail", chainId);
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
				connectSSE(handleEvent);
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
				disconnectSSE();
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
		const { root, button, close, refresh, addChain, back, backSecondary, createForm, rsvpForm, rsvpEdit, commandButtons, commandModal, commandModalClose, commandModalCancel, commandModalForm, chainButtons, shell, sectionTabs } = getElements();
		if (!root || !force && root.dataset.ucmBound === "1") return;
		root.dataset.ucmBound = "1";
		button?.addEventListener("click", openPanel);
		close?.addEventListener("click", closePanel);
		refresh?.addEventListener("click", async () => {
			try {
				await refreshCurrentView();
			} catch (error) {
				setChainPanelStatus(error?.message || "Unable to refresh view.", "error");
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
		if (!hasAnyChainControlPermission()) return null;
		try {
			const root = await renderDefaultView();
			if (!root) return null;
			bindEvents();
			return root;
		} catch (error) {
			console.error("[UCM] Unable to render chain panel:", error?.message || error);
			return null;
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
	* 3. Connect SSE for real-time events
	* 4. Initialize MutationObserver
	*/
	(function ucmInit() {
		"use strict";
		if (window.__UCM_INITIALIZED__) return;
		window.__UCM_INITIALIZED__ = true;
		console.log("[UCM] Ultimate Chain Manager initializing...", {
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
			console.warn("[UCM] Failed to parse stored permissions JSON; resetting permissions.", { error: e?.message || "unknown" });
			state.permissions = [];
		}
		console.log("[UCM] Session bootstrap state", {
			hasSessionToken: hasValidSessionToken(state.sessionToken),
			sessionTokenLength: state.sessionToken?.length || 0,
			memberId: state.memberId || null,
			factionId: state.factionId || null,
			permissionCount: state.permissions.length
		});
		injectStyles();
		if (!hasValidSessionToken(state.sessionToken)) {
			console.log("[UCM] No valid session found. Watching onboarding route...", {
				href: window.location.href,
				hasSessionToken: false,
				isTopWindow: window.top === window.self
			});
			initOnboardingRouteWatcherForTornPda();
			return;
		}
		if (window.top !== window.self) {
			console.log("[UCM] Session found, but skipping active controls in embedded context.");
			return;
		}
		installAttackClickGuard(isBlocked);
		getCurrentChain().then((data) => {
			const chain = data?.chain || null;
			state.currentChain = chain;
			state.currentChainId = chain?.id || null;
			state.commandMode = chain?.commandMode || "free";
			initChainPanel().finally(() => {
				if (chain?.status === "active") connectSSE(handleEvent);
				else console.log("[UCM] SSE stream deferred until a chain is active.", { currentChainStatus: chain?.status || null });
			});
			initMutationObserver();
			if (isAttackPage()) reapplyIfNeeded(isBlocked());
			console.log("[UCM] Initialized successfully.");
		}).catch((error) => {
			console.error("[UCM] Unable to sync current chain state:", error?.message || error);
			initChainPanel();
			initMutationObserver();
			if (isAttackPage()) reapplyIfNeeded(isBlocked());
		});
	})();
	//#endregion
})();

(function() {	try {		if (typeof document != "undefined") {			var elementStyle = document.createElement("style");			elementStyle.appendChild(document.createTextNode(".u-grid{display:grid;}.u-col-span-full{grid-column:1/-1;}.u-grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr));}.u-mt-ucm-2{margin-top:var(--ucm-space-2);}.u-mt-ucm-3{margin-top:var(--ucm-space-3);}.u-flex{display:flex;}.u-flex-col{flex-direction:column;}.u-flex-wrap{flex-wrap:wrap;}.u-items-start{align-items:flex-start;}.u-items-center{align-items:center;}.u-justify-between{justify-content:space-between;}.u-gap-2{gap:0.5rem;}.u-gap-3{gap:0.75rem;}.u-gap-ucm-2{gap:var(--ucm-space-2);}.u-gap-ucm-3{gap:var(--ucm-space-3);}/*$vite$:1*/"));			document.head.appendChild(elementStyle);		}	} catch (e) {		console.error("vite-plugin-css-injected-by-js", e);	}})();