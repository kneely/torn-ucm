import { CONFIG } from '../config.js';
import { state } from '../state/store.js';
import { logDiagnostic, setSseStatus } from '../lib/diagnostics.js';
import { getStreamingUserscriptRequest } from '../lib/transport.js';

/**
 * SSE client implemented on top of GM_xmlhttpRequest.
 *
 * The native EventSource API is subject to the page's Content Security Policy,
 * and Torn's CSP does not whitelist our backend in `connect-src`. Routing the
 * stream through the userscript manager (which respects `@connect` metadata)
 * is the only way to keep a long-lived connection open on torn.com.
 *
 * We read the text response incrementally via `onprogress` and parse the SSE
 * wire format manually: blocks separated by a blank line, each with `event:`,
 * `data:`, and (optionally) `id:` fields.
 */

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

let currentRequest = null;
let reconnectAttempts = 0;
let disposed = false;
let onEventCallback = null;
let lastEventId = 0;

function scheduleReconnect() {
  if (disposed) return;
  const base = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
  const jitter = Math.floor(Math.random() * 500);
  reconnectAttempts += 1;
  setSseStatus('reconnecting', {
    reconnectAttempts,
    delayMs: base + jitter,
    lastEventId,
  });
  setTimeout(() => {
    if (!disposed) openStream();
  }, base + jitter);
}

function dispatchBlock(block) {
  let eventType = 'message';
  const dataLines = [];
  let id = '0';

  for (const rawLine of block.split('\n')) {
    const line = rawLine.replace(/\r$/, '');
    if (!line) continue;
    if (line.startsWith(':')) continue; // comment / keepalive

    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? '' : line.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);

    if (field === 'event') eventType = value;
    else if (field === 'data') dataLines.push(value);
    else if (field === 'id') id = value;
  }

  if (dataLines.length === 0) return;
  if (!SUPPORTED_EVENT_TYPES.has(eventType)) return;

  const payload = dataLines.join('\n');
  try {
    const parsed = JSON.parse(payload);
    const parsedId = parseInt(id, 10) || 0;
    if (parsedId > lastEventId) {
      lastEventId = parsedId;
    }
    onEventCallback(eventType, parsed, parsedId);
    logDiagnostic('ok', 'sse', `event ${eventType}`, {
      eventId: parsedId,
      lastEventId,
    });
  } catch (err) {
    logDiagnostic('warn', 'sse', 'failed to parse SSE event', {
      message: err?.message || 'unknown error',
    });
  }
}

function openStream() {
  const gmRequest = getStreamingUserscriptRequest();
  if (!gmRequest) {
    setSseStatus('error', {
      message: 'Streaming userscript transport unavailable. TornPDA may not expose GM_xmlhttpRequest for SSE.',
      hasPdaHttpGet: typeof PDA_httpGet === 'function',
    });
    return;
  }

  const url = `${CONFIG.BACKEND_URL}/events/stream?token=${encodeURIComponent(state.sessionToken)}`;
  let buffer = '';
  let lastTextLength = 0;
  let announcedOpen = false;

  const markOpen = () => {
    if (announcedOpen) return;
    announcedOpen = true;
    reconnectAttempts = 0;
    setSseStatus('connected', { lastEventId });
  };

  const ingest = (response) => {
    const text = response?.responseText || '';
    if (text.length <= lastTextLength) return;
    const chunk = text.slice(lastTextLength);
    lastTextLength = text.length;
    buffer += chunk;

    // SSE blocks are separated by a blank line (LF LF or CRLF CRLF).
    const separator = /\r?\n\r?\n/;
    let match;
    while ((match = separator.exec(buffer)) !== null) {
      const block = buffer.slice(0, match.index);
      buffer = buffer.slice(match.index + match[0].length);
      if (block.length > 0) dispatchBlock(block);
    }
  };

  currentRequest = gmRequest({
    method: 'GET',
    url,
    headers: {
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
      ...(lastEventId > 0 ? { 'Last-Event-ID': String(lastEventId) } : {}),
    },
    responseType: 'text',
    onloadstart: markOpen,
    onprogress: (response) => {
      markOpen();
      ingest(response);
    },
    onload: (response) => {
      ingest(response);
      if (disposed) return;
      logDiagnostic('warn', 'sse', 'SSE stream ended', { lastEventId });
      scheduleReconnect();
    },
    onerror: () => {
      if (disposed) return;
      logDiagnostic('warn', 'sse', 'SSE connection error', { lastEventId });
      scheduleReconnect();
    },
    ontimeout: () => {
      if (disposed) return;
      logDiagnostic('warn', 'sse', 'SSE timed out', { lastEventId });
      scheduleReconnect();
    },
  });
}

export function connectSSE(onEvent) {
  if (currentRequest && onEventCallback === onEvent && !disposed) {
    return;
  }

  onEventCallback = onEvent;
  disposed = false;
  reconnectAttempts = 0;
  setSseStatus('connecting', { lastEventId });

  if (currentRequest && typeof currentRequest.abort === 'function') {
    try { currentRequest.abort(); } catch { /* ignore */ }
  }
  currentRequest = null;

  openStream();
}

export function disconnectSSE() {
  disposed = true;
  reconnectAttempts = 0;
  setSseStatus('disconnected', { lastEventId });
  if (currentRequest && typeof currentRequest.abort === 'function') {
    try { currentRequest.abort(); } catch { /* ignore */ }
  }
  currentRequest = null;
}
