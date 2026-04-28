import { isBlocked } from '../state/store.js';
import { reapplyIfNeeded } from './attack-button.js';
import { CONFIG } from '../config.js';

let observer = null;
let debounceTimer = null;
let isApplying = false;

/**
 * Initialize the MutationObserver to re-apply attack button state
 * after React re-renders.
 */
export function initMutationObserver() {
  const target = document.getElementById('react-root') || document.body;

  observer = new MutationObserver(() => {
    if (isApplying) return; // Prevent self-triggering

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
    subtree: true,
  });
}

/**
 * Temporarily disconnect the observer (e.g., while making DOM changes).
 */
export function disconnectObserver() {
  if (observer) observer.disconnect();
}

/**
 * Reconnect the observer after DOM changes.
 */
export function reconnectObserver() {
  if (observer) {
    const target = document.getElementById('react-root') || document.body;
    observer.observe(target, { childList: true, subtree: true });
  }
}
