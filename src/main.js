import 'virtual:uno.css';
import { CONFIG } from './config.js';
import { state } from './state/store.js';
import { storageGet } from './lib/storage.js';
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

  console.log('[UCM] Ultimate Chain Manager initializing...', {
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
      console.warn('[UCM] Failed to parse stored permissions JSON; resetting permissions.', {
        error: e?.message || 'unknown',
      });
      state.permissions = [];
    }
  }

  console.log('[UCM] Session bootstrap state', {
    hasSessionToken: hasValidSessionToken(state.sessionToken),
    sessionTokenLength: state.sessionToken?.length || 0,
    memberId: state.memberId || null,
    factionId: state.factionId || null,
    permissionCount: state.permissions.length,
  });

  // 2. Inject styles (UnoCSS utilities are injected via virtual:uno.css import + vite-plugin-css-injected-by-js)
  injectStyles();

  if (!hasValidSessionToken(state.sessionToken)) {
    console.log('[UCM] No valid session found. Watching onboarding route...', {
      href: window.location.href,
      hasSessionToken: false,
      isTopWindow: window.top === window.self,
    });
    initOnboardingRouteWatcherForTornPda();
    return;
  }

  if (window.top !== window.self) {
    console.log('[UCM] Session found, but skipping active controls in embedded context.');
    return;
  }

  installAttackClickGuard(isBlocked);

  getCurrentChain()
    .then((data) => {
      const chain = data?.chain || null;
      state.currentChain = chain;
      state.currentChainId = chain?.id || null;
      state.commandMode = chain?.commandMode || 'free';

      if (chain?.status === 'active') {
        connectSSE(handleEvent);
      } else {
        console.log('[UCM] SSE stream deferred until a chain is active.', {
          currentChainStatus: chain?.status || null,
        });
      }

      initChainPanel();

      // 4. Initialize MutationObserver for React re-render handling
      initMutationObserver();

      if (isAttackPage()) {
        reapplyIfNeeded(isBlocked());
      }

      console.log('[UCM] Initialized successfully.');
    })
    .catch((error) => {
      console.error('[UCM] Unable to sync current chain state:', error?.message || error);
      initChainPanel();
      initMutationObserver();
      if (isAttackPage()) {
        reapplyIfNeeded(isBlocked());
      }
    });
})();
