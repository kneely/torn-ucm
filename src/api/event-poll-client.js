import { state } from '../state/store.js';
import { logDiagnostic, setSseStatus } from '../lib/diagnostics.js';
import { pollEvents } from './client.js';

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

let disposed = true;
let isPolling = false;
let reconnectAttempts = 0;
let reconnectTimer = null;
let onEventCallback = null;
let lastEventId = 0;

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

  try {
    const parsed = JSON.parse(evt.payloadJson || '{}');
    updateLastEventId(evt.id);
    onEventCallback(evt.eventType, parsed, Number(evt.id) || 0);
    logDiagnostic('ok', 'events', `poll event ${evt.eventType}`, {
      eventId: Number(evt.id) || 0,
      lastEventId,
    });
  } catch (error) {
    logDiagnostic('warn', 'events', 'failed to parse poll event', {
      eventType: evt.eventType,
      eventId: evt.id,
      message: error?.message || 'unknown error',
    });
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

async function pollLoop() {
  if (disposed || isPolling) return;
  isPolling = true;
  setSseStatus('polling', { transport: 'poll', lastEventId });

  try {
    while (!disposed) {
      const result = await pollEvents(lastEventId, POLL_TIMEOUT_MS);
      if (disposed) break;

      reconnectAttempts = 0;
      setSseStatus('connected', {
        transport: 'poll',
        lastEventId,
      });

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
  setSseStatus('connecting', { transport: 'poll', lastEventId });

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  void pollLoop();
}

export function disconnectEventPolling() {
  disposed = true;
  reconnectAttempts = 0;
  setSseStatus('disconnected', { transport: 'poll', lastEventId });

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}
