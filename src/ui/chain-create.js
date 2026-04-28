import { createChain } from '../api/client.js';
import { state } from '../state/store.js';
import { showNotification } from './notifications.js';

/**
 * Client-rendered chain creation form.
 * Replaces the SSR GET /ui/chains/new endpoint.
 */

function formatDateTimeLocal(date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

/**
 * Render chain creation form HTML.
 * Returns the HTML string for embedding into the panel shell.
 */
export function renderChainCreateHTML() {
  const defaultStart = formatDateTimeLocal(new Date(Date.now() + 5 * 60 * 1000));

  return `
    <form id="ucm-create-chain-form" class="ucm-create-chain-form">
      <div class="ucm-form-grid u-grid u-gap-3">
        <div>
          <label for="ucm-chain-title">Title</label>
          <input id="ucm-chain-title" name="title" type="text" maxlength="120" placeholder="Example: Evening chain" required />
        </div>

        <div>
          <label for="ucm-chain-start">Start Time</label>
          <input id="ucm-chain-start" name="scheduledStartUtc" type="datetime-local" value="${defaultStart}" required />
        </div>

        <div>
          <label for="ucm-chain-duration">Duration (minutes)</label>
          <input id="ucm-chain-duration" name="expectedDurationMinutes" type="number" min="1" step="1" value="30" required />
        </div>

        <div>
          <label class="ucm-checkbox-row" for="ucm-chain-war-mode">
            <input id="ucm-chain-war-mode" name="warMode" type="checkbox" />
            <span>War mode</span>
          </label>
        </div>

        <div>
          <label for="ucm-chain-enemy-faction">Enemy Faction ID</label>
          <input id="ucm-chain-enemy-faction" name="enemyFactionTornId" type="number" min="1" step="1" placeholder="Optional" />
        </div>

        <div class="u-col-span-full">
          <label for="ucm-chain-notes">Notes</label>
          <textarea id="ucm-chain-notes" name="notes" rows="3" maxlength="1000" placeholder="Optional notes"></textarea>
        </div>
      </div>

      <div class="ucm-form-actions u-flex u-items-center u-justify-between u-gap-ucm-2 u-flex-wrap u-mt-ucm-3">
        <button id="ucm-back-to-chains" class="ucm-secondary-button" type="button">Cancel</button>
        <button id="ucm-create-chain-submit" type="submit">Create Chain</button>
      </div>
      <p id="ucm-chain-panel-status" class="ucm-modal-status" aria-live="polite"></p>
    </form>
  `;
}

function parseOptionalNumber(value) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('Enemy faction ID must be a positive integer.');
  }
  return parsed;
}

/**
 * Build and validate the chain creation payload from form data.
 */
export function buildChainPayload(formData) {
  const title = String(formData.get('title') || '').trim();
  const scheduledStartLocal = String(formData.get('scheduledStartUtc') || '').trim();
  const duration = Number(formData.get('expectedDurationMinutes'));
  const notes = String(formData.get('notes') || '').trim();
  const warMode = formData.get('warMode') === 'on';
  const enemyFactionTornId = parseOptionalNumber(String(formData.get('enemyFactionTornId') || ''));

  if (!title) {
    throw new Error('Title is required.');
  }

  if (!scheduledStartLocal) {
    throw new Error('Start time is required.');
  }

  const scheduledStart = new Date(scheduledStartLocal);
  if (Number.isNaN(scheduledStart.getTime())) {
    throw new Error('Start time is invalid.');
  }

  if (!Number.isInteger(duration) || duration <= 0) {
    throw new Error('Duration must be a positive number of minutes.');
  }

  return {
    title,
    scheduledStartUtc: scheduledStart.toISOString(),
    expectedDurationMinutes: duration,
    warMode,
    enemyFactionTornId,
    notes: notes || null,
  };
}

/**
 * Submit the chain creation form.
 * Returns the created chain response on success.
 */
export async function submitChainCreate(formData) {
  const payload = buildChainPayload(formData);
  const response = await createChain(payload);
  state.currentChainId = response?.chain?.id || null;
  showNotification(`Chain created: ${payload.title}`);
  return response;
}
