import { findAttackButton, isAttackPage } from './selectors.js';
import { showBanner, removeBanner } from './banner.js';
import { getBlockReason } from '../state/store.js';

let blockedButtonRef = null;
let clickGuardInstalled = false;

/**
 * Block the attack button: disable it, mark it, show tooltip and banner.
 */
export function blockButton() {
  if (!isAttackPage()) {
    removeBanner();
    return;
  }

  const btn = findAttackButton();
  if (!btn) {
    console.debug('[UCM] Attack page detected, but no attack button found yet.');
    return;
  }

  const alreadyBlocked = btn.getAttribute('data-ucm-blocked') === 'true'
    && btn.disabled
    && btn.getAttribute('aria-disabled') === 'true';

  if (!alreadyBlocked) {
    console.log('Blocking attack button');
  }

  btn.disabled = true;
  btn.setAttribute('data-ucm-blocked', 'true');
  btn.title = 'Blocked by Ultimate Chain Manager';
  btn.style.pointerEvents = 'none';
  btn.setAttribute('aria-disabled', 'true');

  blockedButtonRef = new WeakRef(btn);

  showBanner(getBlockReason());
}

/**
 * Unblock the attack button: re-enable it, remove markers and banner.
 */
export function unblockButton() {
  if (!isAttackPage()) {
    blockedButtonRef = null;
    removeBanner();
    return;
  }

  const btn = getBlockedButton() || findAttackButton();
  if (!btn) return;

  btn.disabled = false;
  btn.removeAttribute('data-ucm-blocked');
  btn.title = '';
  btn.style.pointerEvents = '';
  btn.removeAttribute('aria-disabled');

  blockedButtonRef = null;

  removeBanner();
}

/**
 * Get the currently blocked button via WeakRef, if still in DOM.
 */
export function getBlockedButton() {
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
export function reapplyIfNeeded(shouldBlock) {
  if (!isAttackPage()) {
    const btn = getBlockedButton();
    if (btn) {
      unblockButton();
    } else {
      removeBanner();
    }
    return;
  }

  if (shouldBlock) {
    blockButton();
  } else {
    // Check if there's a UCM-blocked button that shouldn't be blocked
    const btn = getBlockedButton();
    if (btn) {
      unblockButton();
    }
  }
}

export function installAttackClickGuard(isBlockedFn) {
  if (clickGuardInstalled) return;
  clickGuardInstalled = true;

  document.addEventListener('click', (event) => {
    if (!isAttackPage()) return;
    if (!isBlockedFn()) return;

    const button = event.target instanceof Element
      ? event.target.closest('button')
      : null;
    if (!button) return;

    if (button.getAttribute('data-ucm-blocked') === 'true' || button.textContent.trim().toLowerCase() === 'start fight') {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      blockButton();
    }
  }, true);

  document.addEventListener('submit', (event) => {
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
