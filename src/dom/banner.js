const BANNER_ID = 'ucm-block-banner';

/**
 * Show a contextual banner above the attack button.
 */
export function showBanner(message) {
  const existing = document.getElementById(BANNER_ID);
  if (existing) {
    if (existing.textContent !== message) {
      existing.textContent = message;
    }
    return;
  }

  const banner = document.createElement('div');
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

  // Try to insert above the attack button area
  const defenderModal = document.querySelector('[class*="defender"]');
  if (defenderModal) {
    defenderModal.insertBefore(banner, defenderModal.firstChild);
  } else {
    // Fallback: prepend to body as a fixed banner
    banner.style.cssText += 'position: fixed; top: 0; left: 0; right: 0;';
    document.body.prepend(banner);
  }
}

/**
 * Remove the UCM banner from the DOM.
 */
export function removeBanner() {
  const existing = document.getElementById(BANNER_ID);
  if (existing) {
    existing.remove();
  }
}
