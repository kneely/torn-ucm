/**
 * UCM local state store.
 * Single source of truth for the userscript's view of the world.
 */
export const state = {
  sessionToken: null,
  memberId: null,
  factionId: null,
  permissions: [],
  members: [],
  currentChain: null,
  currentChainId: null,
  commandMode: 'free',          // 'free' | 'controlled' | 'hold_all' | 'bonus_lock'
  myActivePass: null,            // { id, expiresAt } or null
  myAssignment: null,            // { hitNumber, enemyTornUserId } or null
  bonusLockAssigneeMemberId: null,
  eventCursor: 0,
  rsvps: {},                     // { [chainId]: { response, lateMinutes, note } }
};

export function saveSession(sessionToken, memberId, factionId, permissions = []) {
  state.sessionToken = sessionToken;
  state.memberId = memberId;
  state.factionId = factionId;
  state.permissions = permissions;
}

/**
 * Determine if the current member's attack button should be blocked.
 */
export function isBlocked() {
  if (state.commandMode === 'free' || state.commandMode === 'controlled') {
    return false;
  }

  const hasExempt = state.permissions.includes('attack.block.exempt');

  if (state.commandMode === 'hold_all') {
    if (hasExempt) return false;
    if (state.myActivePass) return false;
    return true;
  }

  if (state.commandMode === 'bonus_lock') {
    if (hasExempt) return false;
    if (state.bonusLockAssigneeMemberId === state.memberId) return false;
    if (state.myActivePass) return false;
    return true;
  }

  return false;
}

/**
 * Get the reason string for the current block.
 */
export function getBlockReason() {
  if (state.commandMode === 'hold_all') {
    return 'Hold active';
  }
  if (state.commandMode === 'bonus_lock') {
    return `Bonus hit reserved`;
  }
  return 'Blocked by Ultimate Chain Manager';
}
