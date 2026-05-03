import { CONFIG } from '../config.js';
import { state } from '../state/store.js';
import { logDiagnostic, redactUrl, setSseStatus } from '../lib/diagnostics.js';

const OPEN_TIMEOUT_MS = 5000;

export function buildEventWebSocketUrl(backendUrl, sessionToken, after = 0) {
  const url = new URL('/events/ws', backendUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.searchParams.set('token', sessionToken || '');
  url.searchParams.set('after', String(Math.max(0, Number(after) || 0)));
  return url.toString();
}

export function parseWebSocketEvent(data) {
  const text = typeof data === 'string' ? data : String(data || '');
  if (!text) return null;

  const parsed = JSON.parse(text);
  if (parsed?.type === 'keepalive') return null;
  if (!parsed?.eventType) return null;
  return parsed;
}

export function connectEventWebSocket(onEvent, options = {}) {
  const WebSocketCtor = globalThis.WebSocket;
  if (typeof WebSocketCtor !== 'function' || !state.sessionToken) {
    return null;
  }

  const lastEventId = Math.max(0, Number(options.lastEventId) || 0);
  const url = buildEventWebSocketUrl(CONFIG.BACKEND_URL, state.sessionToken, lastEventId);
  let opened = false;
  let closedByClient = false;
  let fallbackStarted = false;
  let socket;
  let openTimer = null;

  const startFallback = (reason, details = {}) => {
    if (fallbackStarted || closedByClient) return;
    fallbackStarted = true;
    if (openTimer) {
      clearTimeout(openTimer);
      openTimer = null;
    }
    try {
      socket?.close();
    } catch {
      // Ignore close errors during fallback.
    }
    logDiagnostic('warn', 'events', 'websocket falling back to polling', {
      reason,
      ...details,
    });
    options.onFallback?.(reason);
  };

  try {
    socket = new WebSocketCtor(url);
  } catch (error) {
    logDiagnostic('warn', 'events', 'websocket creation failed', {
      message: error?.message || 'unknown error',
    });
    return null;
  }

  setSseStatus('connecting', {
    transport: 'websocket',
    lastEventId,
    url: redactUrl(url),
  });

  openTimer = setTimeout(() => {
    if (!opened) {
      startFallback('open_timeout', { timeoutMs: OPEN_TIMEOUT_MS });
    }
  }, OPEN_TIMEOUT_MS);

  socket.onopen = () => {
    opened = true;
    if (openTimer) {
      clearTimeout(openTimer);
      openTimer = null;
    }
    setSseStatus('connected', {
      transport: 'websocket',
      lastEventId,
    });
  };

  socket.onmessage = (message) => {
    try {
      const evt = parseWebSocketEvent(message?.data);
      if (!evt) return;
      onEvent(evt);
      options.onCursor?.(evt.id);
    } catch (error) {
      logDiagnostic('warn', 'events', 'failed to parse websocket event', {
        message: error?.message || 'unknown error',
      });
    }
  };

  socket.onerror = () => {
    if (!opened) {
      startFallback('error_before_open');
    }
  };

  socket.onclose = (event) => {
    if (openTimer) {
      clearTimeout(openTimer);
      openTimer = null;
    }
    if (!closedByClient) {
      startFallback(opened ? 'closed' : 'closed_before_open', {
        code: event?.code,
        reason: event?.reason || '',
      });
    }
  };

  return {
    close() {
      closedByClient = true;
      if (openTimer) {
        clearTimeout(openTimer);
        openTimer = null;
      }
      try {
        socket.close();
      } catch {
        // Ignore close errors during teardown.
      }
    },
  };
}
