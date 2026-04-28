/**
 * Inject UCM styles into the page.
 */
export function injectStyles() {
  const style = document.createElement('style');
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
