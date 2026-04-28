import { CONFIG } from '../config.js';
import { onboard } from '../api/client.js';
import { saveSession } from '../state/store.js';
import { storageGet, storageSet } from '../lib/storage.js';

const MODAL_ID = 'ucm-onboarding-modal';
const TARGET_PATH = '/factions.php';
const EMPTY_SESSION_VALUES = new Set(['', 'undefined', 'null']);

let routeWatcherInstalled = false;

export function normalizeSessionToken(value) {
  if (value == null) return null;

  const normalized = String(value).trim();
  if (EMPTY_SESSION_VALUES.has(normalized.toLowerCase())) {
    return null;
  }

  return normalized || null;
}

export function hasValidSessionToken(value) {
  return Boolean(normalizeSessionToken(value));
}

export function isOnboardingEligibleRoute(locationHref = '') {
  try {
    const { pathname, searchParams } = new URL(locationHref);
    return pathname === TARGET_PATH
      && searchParams.get('step') === 'your'
      && searchParams.get('type') === '1';
  } catch {
    return false;
  }
}

function logOnboarding(message, details = undefined, level = 'log') {
  const ts = new Date().toISOString();
  const prefix = `[UCM][onboarding][${ts}] ${message}`;

  if (details !== undefined) {
    console[level](prefix, details);
  } else {
    console[level](prefix);
  }
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
    logOnboarding('mountModal skipped: document.body not ready yet');
    return null;
  }

  const existing = document.getElementById(MODAL_ID);
  if (existing) {
    logOnboarding('mountModal reused existing modal root');
    return existing;
  }

  const root = document.createElement('div');
  root.id = MODAL_ID;
  root.innerHTML = createModalMarkup();
  document.body.appendChild(root);
  logOnboarding('mountModal created and appended modal root');
  return root;
}

function setStatus(text, kind = 'info') {
  const statusEl = document.getElementById('ucm-onboarding-status');
  if (!statusEl) return;
  statusEl.textContent = text;
  statusEl.dataset.kind = kind;
}

function setPending(isPending) {
  const button = document.getElementById('ucm-onboarding-submit');
  const input = document.getElementById('ucm-api-key');

  if (button) {
    button.disabled = isPending;
    button.textContent = isPending ? 'Connecting...' : 'Connect';
  }

  if (input) {
    input.disabled = isPending;
  }
}

function persistSession(data) {
  saveSession(
    data.sessionToken,
    data.member?.id,
    data.faction?.id,
    data.permissions || []
  );

  const okToken = storageSet(CONFIG.STORAGE.SESSION_TOKEN, data.sessionToken);
  const okMember = storageSet(CONFIG.STORAGE.MEMBER_ID, data.member?.id || '');
  const okFaction = storageSet(CONFIG.STORAGE.FACTION_ID, data.faction?.id || '');
  const okPerms = storageSet(CONFIG.STORAGE.PERMISSIONS, JSON.stringify(data.permissions || []));

  const tokenAfterWrite = storageGet(CONFIG.STORAGE.SESSION_TOKEN);
  const persisted = okToken && okMember && okFaction && okPerms;

  logOnboarding('persistSession write result', {
    persisted,
    okToken,
    okMember,
    okFaction,
    okPerms,
    tokenReadableAfterWrite: Boolean(tokenAfterWrite),
    tokenLength: tokenAfterWrite?.length || 0,
    memberId: data.member?.id || null,
    factionId: data.faction?.id || null,
    permissionCount: Array.isArray(data.permissions) ? data.permissions.length : 0,
  });

  return persisted;
}

async function submitOnboarding(apiKey) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const scriptVersion = (typeof GM_info !== 'undefined' && GM_info?.script?.version) || '0.1.0';

  logOnboarding('submitOnboarding request start', {
    backendUrl: CONFIG.BACKEND_URL,
    timezone,
    scriptVersion,
    apiKeyLength: apiKey.length,
  });

  const response = await onboard(apiKey, timezone, scriptVersion);

  logOnboarding('submitOnboarding request success', {
    hasSessionToken: Boolean(response?.sessionToken),
    memberId: response?.member?.id || null,
    factionId: response?.faction?.id || null,
    permissionCount: Array.isArray(response?.permissions) ? response.permissions.length : 0,
  });

  return response;
}

function bindFormIfNeeded() {
  const form = document.getElementById('ucm-onboarding-form');
  const apiKeyInput = document.getElementById('ucm-api-key');

  if (!form || !apiKeyInput) {
    logOnboarding('bindFormIfNeeded skipped: missing form or API key input', {
      hasForm: Boolean(form),
      hasInput: Boolean(apiKeyInput),
    });
    return;
  }

  if (form.dataset.ucmBound === '1') {
    logOnboarding('bindFormIfNeeded reused existing submit binding');
    apiKeyInput.focus();
    return;
  }

  form.dataset.ucmBound = '1';
  apiKeyInput.focus();
  logOnboarding('bindFormIfNeeded attached submit listener');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      logOnboarding('submit blocked: empty API key');
      setStatus('Please enter your Torn API key.', 'error');
      return;
    }

    logOnboarding('submit started', {
      apiKeyLength: apiKey.length,
      href: window.location.href,
      readyState: document.readyState,
    });

    setPending(true);
    setStatus('Connecting to UCM\u2026');

    try {
      const response = await submitOnboarding(apiKey);
      if (!response?.sessionToken) {
        throw new Error('Onboarding failed: missing session token.');
      }

      const persisted = persistSession(response);
      if (!persisted) {
        logOnboarding('submit finished with storage persistence failure', {
          href: window.location.href,
        }, 'warn');
        setStatus('Connected, but storage is blocked in this context. Open this page in the main TornPDA view and try again.', 'error');
        setPending(false);
        return;
      }

      logOnboarding('submit completed successfully; reloading page');
      setStatus('Connected. Reloading\u2026', 'success');

      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err) {
      logOnboarding('submit failed', {
        message: err?.message || 'unknown error',
        stack: err?.stack || null,
      }, 'error');
      setStatus(err?.message || 'Onboarding failed. Please try again.', 'error');
      setPending(false);
    }
  });
}

export function showOnboardingModalForTornPda() {
  const routeMatch = isOnboardingRoute();
  const rawSessionToken = storageGet(CONFIG.STORAGE.SESSION_TOKEN);
  const hasSession = hasValidSessionToken(rawSessionToken);

  logOnboarding('eligibility check', {
    href: window.location.href,
    routeMatch,
    hasSessionToken: hasSession,
    sessionTokenLength: rawSessionToken?.length || 0,
    isTopWindow: window.top === window.self,
    readyState: document.readyState,
  });

  if (hasSession) return false;
  if (!routeMatch) return false;

  const modalRoot = mountModal();
  logOnboarding('modal mount result', {
    mounted: Boolean(modalRoot),
    bodyReady: Boolean(document.body),
  });
  if (!modalRoot) return false;

  bindFormIfNeeded();
  return true;
}

export function initOnboardingRouteWatcherForTornPda() {
  if (routeWatcherInstalled) {
    logOnboarding('route watcher already installed; skipping duplicate init');
    return;
  }

  routeWatcherInstalled = true;
  logOnboarding('installing route watcher');

  const tryShow = (reason = 'manual') => {
    logOnboarding('route watcher trigger', {
      reason,
      href: window.location.href,
    });
    showOnboardingModalForTornPda();
  };

  // Immediate + delayed retries for TornPDA SPA route hydration.
  tryShow('initial');
  setTimeout(() => tryShow('retry-250ms'), 250);
  setTimeout(() => tryShow('retry-1000ms'), 1000);
  setTimeout(() => tryShow('retry-2500ms'), 2500);

  window.addEventListener('hashchange', () => tryShow('hashchange'));
  window.addEventListener('popstate', () => tryShow('popstate'));

  const wrapHistory = (methodName) => {
    const original = history[methodName];
    if (typeof original !== 'function') return;

    history[methodName] = function wrappedHistoryState(...args) {
      const result = original.apply(this, args);
      setTimeout(() => tryShow(`history.${methodName}`), 0);
      return result;
    };

    logOnboarding('wrapped history method', { methodName });
  };

  wrapHistory('pushState');
  wrapHistory('replaceState');

  if (document.readyState === 'loading') {
    logOnboarding('document still loading; adding DOMContentLoaded retry');
    document.addEventListener('DOMContentLoaded', () => tryShow('DOMContentLoaded'), { once: true });
  }
}
