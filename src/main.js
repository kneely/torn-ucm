import './lib/sentry.js';
import 'virtual:uno.css';
import { CONFIG } from './config.js';
import { state } from './state/store.js';
import { storageGet } from './lib/storage.js';
import { logDiagnostic } from './lib/diagnostics.js';
import { updateSentryUserContext } from './lib/sentry.js';
import { normalizeSessionToken, hasValidSessionToken, initOnboardingRouteWatcherForTornPda } from './ui/onboarding.js';
import { injectStyles } from './ui/styles.js';
import { initChainPanel } from './ui/chain-panel.js';
import { initMutationObserver } from './dom/mutation-observer.js';
import { installAttackClickGuard, reapplyIfNeeded } from './dom/attack-button.js';
import { isAttackPage } from './dom/selectors.js';
import { connectSSE } from './api/sse-client.js';
import { handleEvent } from './events/handler.js';
import { getCurrentChain } from './api/client.js';
import { isBlocked } from './state/store.js';

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
  'use strict';

  if (window.__UCM_INITIALIZED__) return;
  window.__UCM_INITIALIZED__ = true;

  logDiagnostic('info', 'startup', 'Ultimate Chain Manager initializing', {
    href: window.location.href,
    readyState: document.readyState,
    backendUrl: CONFIG.BACKEND_URL,
    isTopWindow: window.top === window.self,
  });

  // 1. Load stored session
  state.sessionToken = normalizeSessionToken(storageGet(CONFIG.STORAGE.SESSION_TOKEN));
  state.memberId = storageGet(CONFIG.STORAGE.MEMBER_ID);
  state.factionId = storageGet(CONFIG.STORAGE.FACTION_ID);

  const storedPerms = storageGet(CONFIG.STORAGE.PERMISSIONS);
  if (storedPerms) {
    try {
      state.permissions = JSON.parse(storedPerms);
    } catch (e) {
      logDiagnostic('warn', 'startup', 'failed to parse stored permissions JSON; resetting permissions', {
        error: e?.message || 'unknown',
      });
      state.permissions = [];
    }
  }

  logDiagnostic('info', 'startup', 'session bootstrap state', {
    hasSessionToken: hasValidSessionToken(state.sessionToken),
    sessionTokenLength: state.sessionToken?.length || 0,
    memberId: state.memberId || null,
    factionId: state.factionId || null,
    permissionCount: state.permissions.length,
  });
  updateSentryUserContext({
    memberId: state.memberId,
    factionId: state.factionId,
    permissionCount: state.permissions.length,
  });

  // 2. Inject styles (UnoCSS utilities are injected via virtual:uno.css import + vite-plugin-css-injected-by-js)
  injectStyles();

  if (!hasValidSessionToken(state.sessionToken)) {
    logDiagnostic('info', 'startup', 'no valid session found; enabling onboarding prompt', {
      href: window.location.href,
      hasSessionToken: false,
      isTopWindow: window.top === window.self,
    });
    initOnboardingRouteWatcherForTornPda();
    return;
  }

  if (window.top !== window.self) {
    logDiagnostic('info', 'startup', 'session found, but skipping active controls in embedded context');
    return;
  }

  installAttackClickGuard(isBlocked);

  getCurrentChain()
    .then((data) => {
      const chain = data?.chain || null;
      state.currentChain = chain;
      state.currentChainId = chain?.id || null;
      state.commandMode = chain?.commandMode || 'free';

      initChainPanel()
        .finally(() => {
          if (chain?.status === 'active') {
            connectSSE(handleEvent);
          } else {
            logDiagnostic('info', 'sse', 'SSE stream deferred until a chain is active', {
              currentChainStatus: chain?.status || null,
            });
          }
        });

      // 4. Initialize MutationObserver for React re-render handling
      initMutationObserver();

      if (isAttackPage()) {
        reapplyIfNeeded(isBlocked());
      }

      logDiagnostic('ok', 'startup', 'initialized successfully');
    })
    .catch((error) => {
      logDiagnostic('error', 'startup', 'unable to sync current chain state', {
        message: error?.message || 'unknown error',
      });
      initChainPanel();
      initMutationObserver();
      if (isAttackPage()) {
        reapplyIfNeeded(isBlocked());
      }
    });
})();
