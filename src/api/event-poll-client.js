import { state } from '../state/store.js';
import { logDiagnostic, setSseStatus } from '../lib/diagnostics.js';
import { pollEvents } from './client.js';
import { connectEventWebSocket } from './event-websocket-client.js';

const POLL_TIMEOUT_MS = 15000;
const MAX_RECONNECT_DELAY = 30000;
const SUPPORTED_EVENT_TYPES = new Set([
  'command.hold_all',
  'command.release_all',
  'target.assigned',
  'bonus.locked',
  'attack_pass.issued',
  'defense.alert',
  'presence.updated',
]);
const PANEL_SHELL_SELECTOR = '#ucm-chain-panel-root .ucm-panel-shell';

let disposed = true;
let isPolling = false;
let reconnectAttempts = 0;
let reconnectTimer = null;
let onEventCallback = null;
let lastEventId = 0;
let webSocketController = null;

function updateLastEventId(eventId) {
  const parsedId = Number(eventId) || 0;
  if (parsedId > lastEventId) {
    lastEventId = parsedId;
  }
  if (parsedId > state.eventCursor) {
    state.eventCursor = parsedId;
  }
}

function dispatchEvent(evt) {
  if (!evt || !SUPPORTED_EVENT_TYPES.has(evt.eventType)) return;

  const eventId = Number(evt.id) || 0;
  if (eventId > 0 && eventId <= lastEventId) return;

  const shell = document.querySelector(PANEL_SHELL_SELECTOR);
  const shellWasHidden = Boolean(shell?.hidden);

  try {
    const parsed = JSON.parse(evt.payloadJson || '{}');
    updateLastEventId(eventId);
    onEventCallback(evt.eventType, parsed, eventId);
  } catch (error) {
    logDiagnostic('warn', 'events', 'failed to parse poll event', {
      eventType: evt.eventType,
      eventId: evt.id,
      message: error?.message || 'unknown error',
    });
  } finally {
    if (shellWasHidden && shell) {
      shell.hidden = true;
    }
  }
}

function scheduleReconnect() {
  if (disposed) return;
  const base = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
  const jitter = Math.floor(Math.random() * 500);
  const delayMs = base + jitter;
  reconnectAttempts += 1;
  setSseStatus('reconnecting', {
    transport: 'poll',
    reconnectAttempts,
    delayMs,
    lastEventId,
  });
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void pollLoop();
  }, delayMs);
}

function startPollFallback(reason = 'fallback') {
  if (disposed) return;
  webSocketController = null;
  setSseStatus('connecting', {
    transport: 'poll',
    fallbackReason: reason,
    lastEventId,
  });
  void pollLoop();
}

async function pollLoop() {
  if (disposed || isPolling) return;
  isPolling = true;

  try {
    while (!disposed) {
      const result = await pollEvents(lastEventId, POLL_TIMEOUT_MS);
      if (disposed) break;

      reconnectAttempts = 0;

      for (const evt of result?.events || []) {
        dispatchEvent(evt);
      }

      if (typeof result?.lastEventId === 'number') {
        updateLastEventId(result.lastEventId);
      }
    }
  } catch (error) {
    if (!disposed) {
      logDiagnostic('warn', 'events', 'event poll failed', {
        message: error?.message || 'unknown error',
        lastEventId,
      });
      scheduleReconnect();
    }
  } finally {
    isPolling = false;
  }
}

export function connectEventPolling(onEvent) {
  if (!disposed && onEventCallback === onEvent) {
    return;
  }

  onEventCallback = onEvent;
  disposed = false;
  reconnectAttempts = 0;
  lastEventId = Math.max(lastEventId, Number(state.eventCursor) || 0);

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  webSocketController = connectEventWebSocket(dispatchEvent, {
    lastEventId,
    onCursor: updateLastEventId,
    onFallback: startPollFallback,
  });

  if (!webSocketController) {
    startPollFallback('websocket_unavailable');
  }
}

export function disconnectEventPolling() {
  disposed = true;
  reconnectAttempts = 0;
  webSocketController?.close();
  webSocketController = null;
  setSseStatus('disconnected', { transport: 'poll', lastEventId });

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}
