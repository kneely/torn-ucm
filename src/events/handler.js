import { state } from '../state/store.js';
import { blockButton, unblockButton } from '../dom/attack-button.js';
import { showBanner, removeBanner } from '../dom/banner.js';
import { logDiagnostic } from '../lib/diagnostics.js';
import { showNotification } from '../ui/notifications.js';

/**
 * Handle a single event from the backend event transport.
 * Called with (type, payload, eventId) from the polling client.
 */
export function handleEvent(type, payload, eventId) {
  // Update cursor if we received a newer event ID
  if (eventId && eventId > state.eventCursor) {
    state.eventCursor = eventId;
  }

  switch (type) {
    case 'command.hold_all':
      handleHoldAll(payload);
      break;

    case 'command.release_all':
      handleReleaseAll(payload);
      break;

    case 'target.assigned':
      handleTargetAssigned(payload);
      break;

    case 'bonus.locked':
      handleBonusLocked(payload);
      break;

    case 'attack_pass.issued':
      handlePassIssued(payload);
      break;

    case 'defense.alert':
      handleDefenseAlert(payload);
      break;

    case 'presence.updated':
      // Informational — no DOM action needed for own presence
      break;

    default:
      logDiagnostic('warn', 'events', 'unknown event type', { type });
  }
}

function handleHoldAll(payload) {
  state.commandMode = 'hold_all';

  if (!state.permissions.includes('attack.block.exempt')) {
    blockButton();
    showBanner(payload.reason || 'Hold active');
  }
}

function handleReleaseAll(payload) {
  state.commandMode = 'free';
  state.myActivePass = null;

  unblockButton();
  removeBanner();
}

function handleTargetAssigned(payload) {
  if (payload.assigneeMemberId === state.memberId) {
    state.myAssignment = {
      hitNumber: payload.hitNumber,
      enemyTornUserId: payload.enemyTornUserId,
    };
    showNotification(`You are assigned hit #${payload.hitNumber}`);
  }
}

function handleBonusLocked(payload) {
  state.commandMode = 'bonus_lock';
  state.bonusLockAssigneeMemberId = payload.assigneeMemberId;

  const isAssignee = payload.assigneeMemberId === state.memberId;
  const isExempt = state.permissions.includes('attack.block.exempt');

  if (!isAssignee && !isExempt) {
    blockButton();
    showBanner(`Bonus hit #${payload.hitNumber} reserved`);
  }
}

function handlePassIssued(payload) {
  // This event is scoped to recipient — if we receive it, it's for us
  state.myActivePass = {
    id: payload.attackPassId,
    expiresAt: new Date(payload.expiresAt),
  };

  unblockButton();
  removeBanner();
  showBanner(`One-time pass active — ${payload.reason || 'Go!'}`);

  // Start countdown to re-block
  const ttlMs = new Date(payload.expiresAt).getTime() - Date.now();
  if (ttlMs > 0) {
    setTimeout(() => {
      if (state.myActivePass && state.myActivePass.id === payload.attackPassId) {
        state.myActivePass = null;
        blockButton();
        showBanner(state.commandMode === 'bonus_lock' ? 'Bonus lock active' : 'Hold active');
      }
    }, ttlMs);
  }
}

function handleDefenseAlert(payload) {
  showNotification(`\u26A0 ${payload.memberName} is being attacked by ${payload.attackerName}`);
}
