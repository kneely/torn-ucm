import { listChains } from '../api/client.js';
import { state } from '../state/store.js';

/**
 * Client-rendered chain list component.
 * Replaces the SSR GET /ui/chains endpoint.
 */

function hasSchedulePermission() {
  return Array.isArray(state.permissions) && state.permissions.includes('chain.schedule');
}

function formatScheduledTime(isoString) {
  if (!isoString) return 'Not scheduled';
  try {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

function statusPillColor(status) {
  switch (status) {
    case 'active': return 'var(--ucm-success)';
    case 'scheduled': return 'var(--ucm-accent)';
    case 'completed': return 'var(--ucm-text-faint)';
    case 'cancelled': return 'var(--ucm-danger)';
    default: return 'var(--ucm-text-muted)';
  }
}

/**
 * Render chain list HTML from API data.
 * Returns the HTML string for embedding into the panel shell.
 */
export async function renderChainListHTML() {
  const data = await listChains();
  const chains = data?.chains || [];

  if (chains.length === 0) {
    return `
      <div class="ucm-empty-state">
        <strong>No chains</strong>
        <p>No chains have been scheduled yet.${hasSchedulePermission() ? ' Create one to get started.' : ''}</p>
      </div>
      ${hasSchedulePermission() ? '<button id="ucm-add-chain-button" class="ucm-primary-button" type="button">New Chain</button>' : ''}
    `;
  }

  const items = chains.map((chain) => {
    const pillColor = statusPillColor(chain.status);
    return `
      <button class="ucm-chain-list-item" data-chain-id="${chain.id}" type="button">
        <span class="ucm-chain-list-eyebrow">${formatScheduledTime(chain.scheduledStartUtc)}</span>
        <span class="ucm-chain-list-title">${escapeHtml(chain.title || 'Untitled Chain')}</span>
        <div class="ucm-chain-list-row u-flex u-items-center u-justify-between u-gap-ucm-3">
          <span class="ucm-status-pill" style="color: ${pillColor}; border-color: ${pillColor}33; background: ${pillColor}1a;">
            ${escapeHtml(chain.status || 'unknown')}
          </span>
          ${chain.expectedDurationMinutes ? `<span class="ucm-chain-list-cta">${chain.expectedDurationMinutes}m</span>` : ''}
        </div>
      </button>
    `;
  }).join('');

  return `
    <div class="ucm-chain-list u-grid u-gap-3">
      ${items}
    </div>
    ${hasSchedulePermission() ? '<button id="ucm-add-chain-button" class="ucm-primary-button" type="button">New Chain</button>' : ''}
  `;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
