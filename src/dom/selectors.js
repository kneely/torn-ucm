import { CONFIG } from '../config.js';

export function isAttackPage() {
  try {
    const url = new URL(window.location.href);
    return url.pathname === '/page.php' && url.searchParams.get('sid') === 'attack';
  } catch {
    return false;
  }
}

/**
 * 4-tier attack button selector fallback strategy.
 * Returns the button element or null.
 */

/** Tier 1: Semantic selector inside defender modal */
export function findBySemanticSelector() {
  const defenderModal = findDefenderModal();
  if (!defenderModal) return null;

  const buttons = defenderModal.querySelectorAll('button[type="submit"]');
  for (const btn of buttons) {
    if (isVisible(btn) && isStartFightButton(btn)) {
      return btn;
    }
  }
  return null;
}

/** Tier 2: Exact CSS selector from settings */
export function findByCssSelector() {
  try {
    const btn = document.querySelector(CONFIG.SELECTORS.CSS);
    if (btn && isAttackButton(btn)) return btn;
  } catch (e) { /* selector may be invalid */ }
  return null;
}

/** Tier 3: XPath fallback */
export function findByXpath() {
  try {
    const result = document.evaluate(
      CONFIG.SELECTORS.XPATH,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    const btn = result.singleNodeValue;
    if (btn && isAttackButton(btn)) return btn;
  } catch (e) { /* xpath may not match */ }
  return null;
}

/** Tier 4: Last resort text match */
export function findByTextMatch() {
  const defenderModal = findDefenderModal();
  if (!defenderModal) return null;

  const buttons = defenderModal.querySelectorAll('button');
  for (const btn of buttons) {
    if (isStartFightButton(btn) && isVisible(btn)) {
      return btn;
    }
  }
  return null;
}

/**
 * Try all 4 tiers in order, return first match.
 */
export function findAttackButton() {
  return findBySemanticSelector()
    || findByCssSelector()
    || findByXpath()
    || findByTextMatch();
}

export function findDefenderModal() {
  const modals = document.querySelectorAll('[class*="defender"]');
  for (const modal of modals) {
    if (isVisible(modal)) return modal;
  }
  return null;
}

export function isAttackButton(btn) {
  return isStartFightButton(btn)
    && isVisible(btn)
    && Boolean(btn.closest('[class*="defender"]'));
}

function isStartFightButton(btn) {
  return btn.textContent.trim().toLowerCase() === 'start fight';
}

function isVisible(el) {
  if (!el) return false;
  const style = window.getComputedStyle(el);
  return style.display !== 'none'
    && style.visibility !== 'hidden'
    && style.opacity !== '0'
    && el.offsetParent !== null;
}
