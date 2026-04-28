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

/** Tier 1: Exact CSS selector from settings */
export function findByCssSelector() {
  try {
    const btn = document.querySelector(CONFIG.SELECTORS.CSS);
    if (btn && isStartFightButton(btn)) return btn;
  } catch (e) { /* selector may be invalid */ }
  return null;
}

/** Tier 2: Semantic selector inside defender modal */
export function findBySemanticSelector() {
  // Look for visible defender modal, find submit button with "Start fight" text
  const buttons = document.querySelectorAll('button[type="submit"]');
  for (const btn of buttons) {
    if (isVisible(btn) && isStartFightButton(btn)) {
      return btn;
    }
  }
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
    if (btn && isStartFightButton(btn)) return btn;
  } catch (e) { /* xpath may not match */ }
  return null;
}

/** Tier 4: Last resort text match */
export function findByTextMatch() {
  const buttons = document.querySelectorAll('button');
  for (const btn of buttons) {
    if (btn.textContent.trim() === 'Start fight' && isVisible(btn)) {
      return btn;
    }
  }
  return null;
}

/**
 * Try all 4 tiers in order, return first match.
 */
export function findAttackButton() {
  return findByCssSelector()
    || findBySemanticSelector()
    || findByXpath()
    || findByTextMatch();
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
