import {
  addWatchlistEntry,
  assignTarget,
  endChain,
  getCurrentChain,
  getChain,
  holdAll,
  issuePass,
  listMembers,
  releaseAll,
  rsvp,
  startChain,
} from '../api/client.js';
import { connectSSE, disconnectSSE } from '../api/sse-client.js';
import { handleEvent } from '../events/handler.js';
import { state } from '../state/store.js';
import { showNotification } from './notifications.js';
import { renderChainListHTML } from './chain-list.js';
import { renderChainCreateHTML, submitChainCreate } from './chain-create.js';

const CHAIN_PANEL_ROOT_ID = 'ucm-chain-panel-root';
const DEFAULT_DETAIL_SECTION = 'primary';

let activeDetailSection = DEFAULT_DETAIL_SECTION;

function hasAnyChainControlPermission() {
  return Array.isArray(state.permissions) && (
    state.permissions.includes('chain.schedule') ||
    state.permissions.includes('chain.lead') ||
    state.permissions.includes('overwatch.view')
  );
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value == null ? '' : String(value);
  return div.innerHTML;
}

function formatDate(isoString) {
  if (!isoString) return '\u2014';
  try {
    return new Date(isoString).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

function formatRelativeTime(isoString) {
  if (!isoString) return 'No recent check-in';
  const diffMs = Date.now() - new Date(isoString).getTime();
  if (!Number.isFinite(diffMs)) return 'Unknown';
  if (diffMs < 60000) return 'Just now';
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return formatDate(isoString);
}

function presenceLabel(member) {
  if (member.isOnline) return 'Online';
  const stateLabel = String(member.presenceState || '').replaceAll('_', ' ');
  return stateLabel || 'Offline';
}

function formatEnergy(member) {
  return member.energy == null ? '\u2014' : `${member.energy}e`;
}

function formatHealth(member) {
  if (member.lifeCurrent == null || member.lifeMax == null) return '\u2014';
  return `${member.lifeCurrent}/${member.lifeMax}`;
}

function getElements() {
  return {
    root: document.getElementById(CHAIN_PANEL_ROOT_ID),
    shell: document.getElementById('ucm-chain-panel-shell'),
    button: document.getElementById('ucm-chain-panel-button'),
    close: document.getElementById('ucm-chain-panel-close'),
    refresh: document.getElementById('ucm-chain-panel-refresh'),
    status: document.getElementById('ucm-chain-panel-status'),
    addChain: document.getElementById('ucm-add-chain-button'),
    back: document.getElementById('ucm-back-to-chains'),
    backSecondary: document.getElementById('ucm-back-to-chains-secondary'),
    createForm: document.getElementById('ucm-create-chain-form'),
    rsvpForm: document.getElementById('ucm-rsvp-form'),
    rsvpEdit: document.getElementById('ucm-rsvp-edit'),
    commandButtons: Array.from(document.querySelectorAll('[data-ucm-command]')),
    commandModal: document.getElementById('ucm-command-modal'),
    commandModalBody: document.getElementById('ucm-command-modal-body'),
    commandModalTitle: document.getElementById('ucm-command-modal-title'),
    commandModalClose: document.getElementById('ucm-command-modal-close'),
    commandModalCancel: document.getElementById('ucm-command-modal-cancel'),
    commandModalForm: document.getElementById('ucm-command-modal-form'),
    chainButtons: Array.from(document.querySelectorAll('.ucm-chain-list-item')),
    sectionTabs: Array.from(document.querySelectorAll('[data-ucm-section]')),
    sectionPanels: Array.from(document.querySelectorAll('[data-ucm-section-panel]')),
  };
}

function setChainPanelStatus(message, kind = 'info') {
  const { status } = getElements();
  if (!status) return;
  status.textContent = message;
  status.dataset.kind = kind;
}

function getCurrentView() {
  return document.getElementById('ucm-chain-panel-shell')?.dataset.ucmView || 'list';
}

function getCurrentChainId() {
  return document.getElementById('ucm-chain-panel-shell')?.dataset.chainId || '';
}

function applyDetailSection(section = DEFAULT_DETAIL_SECTION) {
  const { sectionTabs, sectionPanels } = getElements();
  if (!sectionTabs.length || !sectionPanels.length) return;

  activeDetailSection = section;

  for (const tab of sectionTabs) {
    const isActive = tab.dataset.ucmSection === section;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    tab.tabIndex = isActive ? 0 : -1;
  }

  for (const panel of sectionPanels) {
    panel.hidden = panel.dataset.ucmSectionPanel !== section;
  }
}

function buildPanelShell(innerHTML, view = 'list', chainId = '') {
  return `
    <button id="ucm-chain-panel-button" class="ucm-floating-button" type="button" aria-haspopup="dialog">
      Chain Manager
    </button>
    <div id="ucm-chain-panel-shell" class="ucm-panel-shell" data-ucm-view="${view}" data-chain-id="${chainId}" hidden>
      <div class="ucm-panel-backdrop" data-ucm-close="panel"></div>
      <div class="ucm-panel" role="dialog" aria-modal="true">
        <div class="ucm-panel-hero u-flex u-items-start u-justify-between u-gap-ucm-2">
          <div>
            <p class="ucm-panel-kicker">Chain Manager</p>
            <h2>UCM</h2>
          </div>
          <div class="u-flex u-gap-2">
            <button id="ucm-chain-panel-refresh" class="ucm-modal-close" type="button" aria-label="Refresh" title="Refresh">\u21BB</button>
            <button id="ucm-chain-panel-close" class="ucm-modal-close" type="button" aria-label="Close">\u00D7</button>
          </div>
        </div>
        ${innerHTML}
        <p id="ucm-chain-panel-status" class="ucm-modal-status" aria-live="polite"></p>
      </div>
      <div id="ucm-command-modal" class="ucm-command-modal" hidden>
        <div class="ucm-command-modal-backdrop" data-ucm-close-command="1"></div>
        <div class="ucm-command-modal-card" role="dialog" aria-modal="true" aria-labelledby="ucm-command-modal-title">
          <div class="u-flex u-items-center u-justify-between u-gap-ucm-2">
            <h3 id="ucm-command-modal-title">Command</h3>
            <button id="ucm-command-modal-close" class="ucm-modal-close" type="button" aria-label="Close">\u00D7</button>
          </div>
          <form id="ucm-command-modal-form">
            <div id="ucm-command-modal-body" class="ucm-command-modal-body"></div>
            <div class="ucm-command-modal-actions">
              <button id="ucm-command-modal-cancel" class="ucm-secondary-button" type="button">Cancel</button>
              <button id="ucm-command-modal-submit" type="submit">Submit</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

function commandButton(action, icon, label, description, danger = false) {
  return `
    <button class="ucm-command-row${danger ? ' is-danger' : ''}" data-ucm-command="${action}" type="button">
      <span class="ucm-command-icon" aria-hidden="true">${icon}</span>
      <span>
        <strong>${escapeHtml(label)}</strong>
        <small>${escapeHtml(description)}</small>
      </span>
    </button>
  `;
}

function buildCommandList(chain, canLead) {
  if (!canLead) return '';
  if (chain.status === 'active') {
    return `
      <div class="ucm-command-list">
        ${commandButton('hold', '\u23F8', 'Hold All', 'Pause hits and optionally block attacks.')}
        ${commandButton('release', '\u25B6', 'Release All', 'Return the chain to free command mode.')}
        ${commandButton('pass', '\uD83C\uDFAB', 'Issue Pass', 'Let one member bypass the current block briefly.')}
        ${commandButton('target', '\u25CE', 'Assign Target', 'Assign a hit and optional lock mode to a member.')}
        ${commandButton('watchlist', '\u2606', 'Add Watchlist', 'Track a target for chain leaders.')}
        ${commandButton('end', '\u2715', 'End Chain', 'Complete or cancel this chain.', true)}
      </div>
    `;
  }

  if (chain.status === 'scheduled') {
    return `
      <div class="ucm-command-list">
        ${commandButton('start', '\u25B6', 'Start Chain', 'Move this scheduled chain to active.')}
        ${commandButton('cancel', '\u2715', 'Cancel Chain', 'Cancel this scheduled chain.', true)}
      </div>
    `;
  }

  return '';
}

async function buildOnlineMembersHTML(chainId, chain, canLead, canViewOverwatch) {
  if (!chainId || !['active', 'forming'].includes(chain.status)) return '';
  if (!canLead && !canViewOverwatch) return '';

  try {
    const data = await listMembers(chainId);
    const members = Array.isArray(data?.members) ? data.members : [];
    const sorted = members.sort((a, b) => Number(b.isOnline) - Number(a.isOnline)
      || String(a.playerName || '').localeCompare(String(b.playerName || '')));

    if (sorted.length === 0) {
      return `
        <section class="ucm-member-section">
          <h4>Online Members</h4>
          <p class="ucm-section-copy">No active faction members found.</p>
        </section>
      `;
    }

    const cards = sorted.map((member) => `
      <article class="ucm-member-card${member.isOnline ? ' is-online' : ''}">
        <div class="ucm-member-card-header">
          <div>
            <strong>${escapeHtml(member.playerName || member.tornUserId || 'Unknown')}</strong>
            <span>${escapeHtml(presenceLabel(member))} · ${escapeHtml(formatRelativeTime(member.lastSeenAt))}</span>
          </div>
          <span class="ucm-presence-dot" aria-hidden="true"></span>
        </div>
        <div class="ucm-member-stat-grid">
          <span><small>Energy</small><b>${escapeHtml(formatEnergy(member))}</b></span>
          <span><small>Health</small><b>${escapeHtml(formatHealth(member))}</b></span>
          <span><small>Drug CD</small><b>${escapeHtml(member.drugCooldown || '\u2014')}</b></span>
          <span><small>Status</small><b>${member.underAttackFlag ? 'Under attack' : member.hospitalUntil ? 'Hospital' : 'Ready'}</b></span>
        </div>
        ${canLead ? `
          <button
            class="ucm-secondary-button ucm-member-command"
            data-ucm-command="pass"
            data-member-id="${escapeHtml(member.id)}"
            data-member-name="${escapeHtml(member.playerName || '')}"
            type="button"
          >Issue Command</button>
        ` : ''}
      </article>
    `).join('');

    return `
      <section class="ucm-member-section">
        <div class="u-flex u-items-center u-justify-between u-gap-ucm-2">
          <h4>Online Members</h4>
          <span class="ucm-status-pill">${sorted.filter((member) => member.isOnline).length} online</span>
        </div>
        <div class="ucm-member-grid">
          ${cards}
        </div>
      </section>
    `;
  } catch (error) {
    return `
      <section class="ucm-member-section">
        <h4>Online Members</h4>
        <p class="ucm-state-note">Unable to load member presence: ${escapeHtml(error?.message || 'Unknown error')}</p>
      </section>
    `;
  }
}

async function renderChainDetailHTML(chainId) {
  const data = await getChain(chainId);
  const chain = data?.chain;

  if (!chain) {
    return buildPanelShell(`
      <div class="ucm-empty-state">
        <strong>Chain not found</strong>
        <p>This chain may have been deleted.</p>
      </div>
      <button id="ucm-back-to-chains" class="ucm-secondary-button" type="button">Back to Chains</button>
    `, 'detail', chainId);
  }

  const canLead = state.permissions.includes('chain.lead');
  const canViewOverwatch = state.permissions.includes('overwatch.view');
  const commandsHTML = buildCommandList(chain, canLead);
  const membersHTML = await buildOnlineMembersHTML(chainId, chain, canLead, canViewOverwatch);

  const summaryHTML = `
    <div class="ucm-chain-summary u-grid u-gap-3">
      <div class="ucm-summary-grid u-grid u-grid-cols-2 u-gap-3">
        <div class="ucm-summary-item">
          <span class="ucm-summary-label">Status</span>
          <strong>${escapeHtml(chain.status || 'unknown')}</strong>
        </div>
        <div class="ucm-summary-item">
          <span class="ucm-summary-label">Scheduled</span>
          <strong>${formatDate(chain.scheduledStartUtc)}</strong>
        </div>
        <div class="ucm-summary-item">
          <span class="ucm-summary-label">Duration</span>
          <strong>${chain.expectedDurationMinutes || '\u2014'}m</strong>
        </div>
        <div class="ucm-summary-item">
          <span class="ucm-summary-label">Mode</span>
          <strong>${chain.warMode ? 'War' : 'Normal'}</strong>
        </div>
      </div>
      ${chain.notes ? `<pre class="ucm-summary-notes">${escapeHtml(chain.notes)}</pre>` : ''}
    </div>
  `;

  const existingRsvp = state.rsvps[chainId] || null;
  let rsvpHTML;
  if (existingRsvp) {
    const responseLabel = { yes: 'Yes', maybe: 'Maybe', no: 'No' }[existingRsvp.response] || existingRsvp.response;
    rsvpHTML = `
      <div class="ucm-subsection-card">
        <div class="u-flex u-items-center u-justify-between u-gap-ucm-2">
          <h4>RSVP</h4>
          <button id="ucm-rsvp-edit" class="ucm-secondary-button" type="button">Edit</button>
        </div>
        <div class="ucm-summary-grid u-grid u-grid-cols-2 u-gap-3">
          <div class="ucm-summary-item">
            <span class="ucm-summary-label">Response</span>
            <strong>${escapeHtml(responseLabel)}</strong>
          </div>
          <div class="ucm-summary-item">
            <span class="ucm-summary-label">Late</span>
            <strong>${existingRsvp.lateMinutes ? existingRsvp.lateMinutes + 'm' : '\u2014'}</strong>
          </div>
        </div>
        ${existingRsvp.note ? `<p class="ucm-state-note">${escapeHtml(existingRsvp.note)}</p>` : ''}
      </div>
    `;
  } else {
    rsvpHTML = `
      <div class="ucm-subsection-card">
        <h4>RSVP</h4>
        <form id="ucm-rsvp-form">
          <div class="ucm-form-grid u-grid u-gap-3">
            <div>
              <label for="ucm-rsvp-response">Response</label>
              <select id="ucm-rsvp-response" name="response" required>
                <option value="yes">Yes</option>
                <option value="maybe">Maybe</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label for="ucm-rsvp-late">Late (minutes)</label>
              <input id="ucm-rsvp-late" name="lateMinutes" type="number" min="0" placeholder="0" />
            </div>
            <div class="u-col-span-full">
              <label for="ucm-rsvp-note">Note</label>
              <input id="ucm-rsvp-note" name="note" type="text" maxlength="200" placeholder="Optional" />
            </div>
          </div>
          <button type="submit" class="u-mt-ucm-2">Save RSVP</button>
        </form>
      </div>
    `;
  }

  const primaryContent = `
    <div data-ucm-section-panel="primary" class="ucm-detail-section">
      <div class="ucm-detail-stack u-grid u-gap-3">
        ${summaryHTML}
        ${rsvpHTML}
        ${membersHTML}
      </div>
    </div>
  `;

  const advancedContent = commandsHTML ? `
    <div data-ucm-section-panel="advanced" class="ucm-detail-section" hidden>
      <div class="ucm-detail-stack u-grid u-gap-3">
        <div class="ucm-subsection-card">
          <h4>Commands</h4>
          ${commandsHTML}
        </div>
      </div>
    </div>
  ` : '';

  const tabsHTML = commandsHTML ? `
    <div class="ucm-detail-switcher u-grid u-grid-cols-2 u-gap-ucm-2">
      <button class="ucm-detail-tab is-active" data-ucm-section="primary" type="button" role="tab" aria-selected="true">Overview</button>
      <button class="ucm-detail-tab" data-ucm-section="advanced" type="button" role="tab" aria-selected="false" tabindex="-1">Commands</button>
    </div>
  ` : '';

  return buildPanelShell(`
    <div class="ucm-panel-toolbar u-flex u-items-start u-justify-between u-gap-ucm-2 u-flex-wrap">
      <button id="ucm-back-to-chains-secondary" class="ucm-secondary-button" type="button">\u2190 Chains</button>
      <span class="ucm-status-pill">${escapeHtml(chain.status || 'unknown')}</span>
    </div>
    <h3>${escapeHtml(chain.title || 'Untitled Chain')}</h3>
    ${tabsHTML}
    ${primaryContent}
    ${advancedContent}
  `, 'detail', chainId);
}

async function renderIntoRoot(html) {
  if (!document.body) return null;

  let root = document.getElementById(CHAIN_PANEL_ROOT_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = CHAIN_PANEL_ROOT_ID;
    document.body.appendChild(root);
  }

  const previousShell = document.getElementById('ucm-chain-panel-shell');
  const wasOpen = previousShell ? !previousShell.hidden : false;
  root.innerHTML = html;

  const nextShell = document.getElementById('ucm-chain-panel-shell');
  if (nextShell) {
    nextShell.hidden = !wasOpen;
  }

  return root;
}

async function renderListView() {
  const listContent = await renderChainListHTML();
  const html = buildPanelShell(listContent, 'list');
  return renderIntoRoot(html);
}

async function renderCreateView() {
  const createContent = renderChainCreateHTML();
  const html = buildPanelShell(createContent, 'create');
  return renderIntoRoot(html);
}

async function renderDetailView(chainId) {
  const html = await renderChainDetailHTML(chainId);
  return renderIntoRoot(html);
}

async function renderDefaultView() {
  const current = await getCurrentChain();
  const liveStatuses = new Set(['active', 'forming', 'scheduled']);
  const currentChain = current?.chain;

  if (currentChain?.id && liveStatuses.has(currentChain.status)) {
    activeDetailSection = DEFAULT_DETAIL_SECTION;
    return renderDetailView(currentChain.id);
  }

  return renderListView();
}

function closePanel() {
  const { shell, button } = getElements();
  if (!shell) return;
  shell.hidden = true;
  button?.focus();
}

function closeCommandModal() {
  const { commandModal, commandModalBody, commandModalForm } = getElements();
  if (!commandModal) return;
  commandModal.hidden = true;
  if (commandModalBody) commandModalBody.innerHTML = '';
  commandModalForm?.removeAttribute('data-command-action');
}

function modalFields(action, defaults = {}) {
  const memberId = escapeHtml(defaults.memberId || '');
  const memberName = escapeHtml(defaults.memberName || '');
  switch (action) {
    case 'hold':
      return `
        <input type="hidden" name="action" value="hold" />
        <label for="ucm-modal-hold-reason">Reason</label>
        <input id="ucm-modal-hold-reason" name="reason" type="text" maxlength="200" placeholder="Optional" />
        <label class="ucm-checkbox-row" for="ucm-modal-hold-block">
          <input id="ucm-modal-hold-block" name="blockAttackButton" type="checkbox" checked />
          <span>Block attack button</span>
        </label>
      `;
    case 'release':
      return `
        <input type="hidden" name="action" value="release" />
        <label for="ucm-modal-release-reason">Reason</label>
        <input id="ucm-modal-release-reason" name="reason" type="text" maxlength="200" placeholder="Optional" />
      `;
    case 'pass':
      return `
        <input type="hidden" name="action" value="pass" />
        ${memberName ? `<p class="ucm-state-note">Issuing pass for ${memberName}</p>` : ''}
        <label for="ucm-modal-pass-member">Member ID</label>
        <input id="ucm-modal-pass-member" name="memberId" type="text" value="${memberId}" required />
        <label for="ucm-modal-pass-ttl">TTL (seconds)</label>
        <input id="ucm-modal-pass-ttl" name="ttlSeconds" type="number" min="10" value="45" required />
        <label for="ucm-modal-pass-reason">Reason</label>
        <input id="ucm-modal-pass-reason" name="reason" type="text" maxlength="200" placeholder="Optional" />
      `;
    case 'target':
      return `
        <input type="hidden" name="action" value="target" />
        <label for="ucm-modal-target-assignee">Assignee Member ID</label>
        <input id="ucm-modal-target-assignee" name="assigneeMemberId" type="text" value="${memberId}" required />
        <label for="ucm-modal-target-enemy">Enemy Torn User ID</label>
        <input id="ucm-modal-target-enemy" name="enemyTornUserId" type="number" min="1" required />
        <label for="ucm-modal-target-hit">Hit Number</label>
        <input id="ucm-modal-target-hit" name="hitNumber" type="number" min="1" required />
        <label for="ucm-modal-target-lock">Lock Mode</label>
        <select id="ucm-modal-target-lock" name="lockMode">
          <option value="target_only">Target Only</option>
          <option value="bonus_hit_lock">Bonus Hit Lock</option>
        </select>
        <label for="ucm-modal-target-note">Note</label>
        <input id="ucm-modal-target-note" name="note" type="text" maxlength="200" placeholder="Optional" />
      `;
    case 'watchlist':
      return `
        <input type="hidden" name="action" value="watchlist" />
        <label for="ucm-modal-wl-enemy">Enemy Torn User ID</label>
        <input id="ucm-modal-wl-enemy" name="enemyTornUserId" type="number" min="1" required />
        <label for="ucm-modal-wl-label">Label</label>
        <input id="ucm-modal-wl-label" name="label" type="text" maxlength="120" placeholder="Optional" />
        <label for="ucm-modal-wl-priority">Priority</label>
        <input id="ucm-modal-wl-priority" name="priority" type="number" min="1" value="100" />
      `;
    case 'start':
      return '<input type="hidden" name="action" value="start" /><p class="ucm-section-copy">Start this chain now and open the live event stream.</p>';
    case 'cancel':
      return `
        <input type="hidden" name="action" value="cancel" />
        <label for="ucm-modal-cancel-reason">Reason</label>
        <input id="ucm-modal-cancel-reason" name="reason" type="text" maxlength="200" placeholder="Optional" />
      `;
    case 'end':
      return `
        <input type="hidden" name="action" value="end" />
        <label for="ucm-modal-end-outcome">Outcome</label>
        <select id="ucm-modal-end-outcome" name="outcome">
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <label for="ucm-modal-end-reason">Reason</label>
        <input id="ucm-modal-end-reason" name="reason" type="text" maxlength="200" placeholder="Optional" />
      `;
    default:
      return '';
  }
}

function openCommandModal(action, defaults = {}) {
  const { commandModal, commandModalBody, commandModalTitle, commandModalForm } = getElements();
  if (!commandModal || !commandModalBody || !commandModalForm) return;

  const labels = {
    hold: 'Hold All',
    release: 'Release All',
    pass: 'Issue Pass',
    target: 'Assign Target',
    watchlist: 'Add Watchlist',
    start: 'Start Chain',
    cancel: 'Cancel Chain',
    end: 'End Chain',
  };

  commandModalTitle.textContent = labels[action] || 'Command';
  commandModalForm.dataset.commandAction = action;
  commandModalBody.innerHTML = modalFields(action, defaults);
  commandModal.hidden = false;
  commandModal.querySelector('input:not([type="hidden"]), select, button')?.focus();
}

async function openPanel() {
  try {
    if (getCurrentView() === 'detail' && getCurrentChainId()) {
      await renderDetailView(getCurrentChainId());
    } else if (getCurrentView() === 'create') {
      await renderCreateView();
    } else {
      await renderDefaultView();
    }
    const { shell } = getElements();
    if (shell) shell.hidden = false;
    bindEvents(true);
  } catch (error) {
    console.error('[UCM] Unable to open chain panel:', error?.message || error);
  }
}

async function refreshCurrentView() {
  const currentView = getCurrentView();
  if (currentView === 'create') {
    await renderCreateView();
  } else if (currentView === 'detail' && getCurrentChainId()) {
    await renderDetailView(getCurrentChainId());
  } else {
    await renderListView();
  }
  const { shell } = getElements();
  if (shell) shell.hidden = false;
  bindEvents(true);
}

async function refreshAfterAction(message = '', view = 'detail', chainId = '') {
  if (view === 'list') {
    await renderListView();
  } else if (view === 'create') {
    await renderCreateView();
  } else if (chainId) {
    await renderDetailView(chainId);
  } else {
    await renderListView();
  }
  const { shell } = getElements();
  if (shell) shell.hidden = false;
  bindEvents(true);
  if (message) showNotification(message);
}

async function submitCreate(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);

  setChainPanelStatus('Creating chain...');

  try {
    const response = await submitChainCreate(data);
    activeDetailSection = DEFAULT_DETAIL_SECTION;
    await refreshAfterAction('Chain created.', 'detail', response?.chain?.id || '');
  } catch (error) {
    setChainPanelStatus(error?.message || 'Unable to create chain.', 'error');
  }
}

async function submitRSVP(event) {
  event.preventDefault();
  const chainId = getCurrentChainId();
  if (!chainId) {
    setChainPanelStatus('No chain selected.', 'error');
    return;
  }
  const data = new FormData(event.currentTarget);
  const lateValue = String(data.get('lateMinutes') || '').trim();

  setChainPanelStatus('Saving RSVP...');

  const payload = {
    response: String(data.get('response') || ''),
    lateMinutes: lateValue ? Number(lateValue) : null,
    note: String(data.get('note') || '').trim() || null,
  };

  try {
    await rsvp(chainId, payload);
    state.rsvps[chainId] = payload;
    await refreshAfterAction('RSVP saved.', 'detail', chainId);
  } catch (error) {
    setChainPanelStatus(error?.message || 'Unable to save RSVP.', 'error');
  }
}

async function submitCommandModal(event) {
  event.preventDefault();
  const chainId = getCurrentChainId();
  if (!chainId) {
    setChainPanelStatus('No chain selected.', 'error');
    return;
  }

  const form = event.currentTarget;
  const data = new FormData(form);
  const action = form.dataset.commandAction || String(data.get('action') || '');

  setChainPanelStatus('Submitting command...');

  try {
    if (action === 'hold') {
      await holdAll(chainId, {
        reason: String(data.get('reason') || '').trim(),
        blockAttackButton: data.get('blockAttackButton') === 'on',
      });
      activeDetailSection = 'advanced';
      closeCommandModal();
      await refreshAfterAction('Hold all applied.', 'detail', chainId);
      return;
    }

    if (action === 'release') {
      await releaseAll(chainId, {
        reason: String(data.get('reason') || '').trim(),
      });
      activeDetailSection = 'advanced';
      closeCommandModal();
      await refreshAfterAction('Released hold.', 'detail', chainId);
      return;
    }

    if (action === 'pass') {
      await issuePass(chainId, {
        memberId: String(data.get('memberId') || ''),
        ttlSeconds: Number(data.get('ttlSeconds')) || 45,
        reason: String(data.get('reason') || '').trim() || null,
      });
      activeDetailSection = 'advanced';
      closeCommandModal();
      await refreshAfterAction('Pass issued.', 'detail', chainId);
      return;
    }

    if (action === 'target') {
      await assignTarget(chainId, {
        assigneeMemberId: String(data.get('assigneeMemberId') || ''),
        enemyTornUserId: Number(data.get('enemyTornUserId')),
        hitNumber: Number(data.get('hitNumber')),
        lockMode: String(data.get('lockMode') || 'target_only'),
        note: String(data.get('note') || '').trim() || null,
      });
      activeDetailSection = 'advanced';
      closeCommandModal();
      await refreshAfterAction('Target assigned.', 'detail', chainId);
      return;
    }

    if (action === 'watchlist') {
      await addWatchlistEntry(chainId, {
        enemyTornUserId: Number(data.get('enemyTornUserId')),
        label: String(data.get('label') || '').trim() || null,
        priority: Number(data.get('priority')) || 100,
      });
      activeDetailSection = 'advanced';
      closeCommandModal();
      await refreshAfterAction('Watchlist entry added.', 'detail', chainId);
      return;
    }

    if (action === 'start') {
      await startChain(chainId);
      connectSSE(handleEvent);
      activeDetailSection = DEFAULT_DETAIL_SECTION;
      closeCommandModal();
      await refreshAfterAction('Chain started.', 'detail', chainId);
      return;
    }

    if (action === 'cancel' || action === 'end') {
      const outcome = action === 'cancel' ? 'cancelled' : String(data.get('outcome') || 'completed');
      await endChain(chainId, {
        outcome,
        reason: String(data.get('reason') || '').trim() || null,
      });
      disconnectSSE();
      closeCommandModal();
      await refreshAfterAction(`Chain ${outcome}.`, 'list');
      return;
    }

    throw new Error('Unknown command.');
  } catch (error) {
    setChainPanelStatus(error?.message || 'Unable to submit command.', 'error');
  }
}

function bindEvents(force = false) {
  const {
    root,
    button,
    close,
    refresh,
    addChain,
    back,
    backSecondary,
    createForm,
    rsvpForm,
    rsvpEdit,
    commandButtons,
    commandModal,
    commandModalClose,
    commandModalCancel,
    commandModalForm,
    chainButtons,
    shell,
    sectionTabs,
  } = getElements();

  if (!root || (!force && root.dataset.ucmBound === '1')) return;
  root.dataset.ucmBound = '1';

  button?.addEventListener('click', openPanel);
  close?.addEventListener('click', closePanel);
  refresh?.addEventListener('click', async () => {
    try {
      await refreshCurrentView();
    } catch (error) {
      setChainPanelStatus(error?.message || 'Unable to refresh view.', 'error');
    }
  });
  addChain?.addEventListener('click', async () => {
    try {
      await renderCreateView();
      const { shell: nextShell } = getElements();
      if (nextShell) nextShell.hidden = false;
      bindEvents(true);
    } catch (error) {
      setChainPanelStatus(error?.message || 'Unable to open create view.', 'error');
    }
  });

  const backToList = async () => {
    try {
      await renderListView();
      const { shell: nextShell } = getElements();
      if (nextShell) nextShell.hidden = false;
      bindEvents(true);
    } catch (error) {
      setChainPanelStatus(error?.message || 'Unable to return to chains.', 'error');
    }
  };

  back?.addEventListener('click', backToList);
  backSecondary?.addEventListener('click', backToList);

  for (const chainButton of chainButtons) {
    chainButton.addEventListener('click', async () => {
      try {
        activeDetailSection = DEFAULT_DETAIL_SECTION;
        await renderDetailView(chainButton.dataset.chainId);
        const { shell: nextShell } = getElements();
        if (nextShell) nextShell.hidden = false;
        bindEvents(true);
      } catch (error) {
        setChainPanelStatus(error?.message || 'Unable to load chain.', 'error');
      }
    });
  }

  for (const tab of sectionTabs) {
    tab.addEventListener('click', () => {
      applyDetailSection(tab.dataset.ucmSection || DEFAULT_DETAIL_SECTION);
    });
  }

  for (const commandButtonEl of commandButtons) {
    commandButtonEl.addEventListener('click', () => {
      openCommandModal(commandButtonEl.dataset.ucmCommand, {
        memberId: commandButtonEl.dataset.memberId || '',
        memberName: commandButtonEl.dataset.memberName || '',
      });
    });
  }

  createForm?.addEventListener('submit', submitCreate);
  rsvpForm?.addEventListener('submit', submitRSVP);
  rsvpEdit?.addEventListener('click', () => {
    const chainId = getCurrentChainId();
    if (chainId) {
      delete state.rsvps[chainId];
      refreshCurrentView();
    }
  });

  commandModalForm?.addEventListener('submit', submitCommandModal);
  commandModalClose?.addEventListener('click', closeCommandModal);
  commandModalCancel?.addEventListener('click', closeCommandModal);
  commandModal?.addEventListener('click', (event) => {
    if (event.target instanceof HTMLElement && event.target.dataset.ucmCloseCommand === '1') {
      closeCommandModal();
    }
  });

  shell?.addEventListener('click', (event) => {
    if (event.target instanceof HTMLElement && event.target.dataset.ucmClose === 'panel') {
      closePanel();
    }
  });

  if (getCurrentView() === 'detail') {
    applyDetailSection(activeDetailSection);
  }
}

export function initChainPanel() {
  if (!hasAnyChainControlPermission()) return;

  renderDefaultView()
    .then((root) => {
      if (!root) return;
      bindEvents();
    })
    .catch((error) => {
      console.error('[UCM] Unable to render chain panel:', error?.message || error);
    });
}
