import { CONFIG } from '../config.js';
import { state } from '../state/store.js';
import { captureDiagnostic, captureUcmException } from './posthog.js';

const MAX_ENTRIES = 150;
const SENSITIVE_QUERY_KEYS = new Set([
  'apiKey',
  'apikey',
  'key',
  'token',
  'sessionToken',
  'access_token',
]);

const entries = [];
const listeners = new Set();

let lastTransport = 'unknown';
let sseStatus = 'idle';

function getConsoleMethod(level) {
  if (level === 'error') return 'error';
  if (level === 'warn') return 'warn';
  return 'log';
}

function notify() {
  for (const listener of listeners) {
    try {
      listener(entries);
    } catch {
      // Diagnostics must never break the userscript.
    }
  }
}

function safeString(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function formatConsoleDetails(details) {
  if (details === undefined) return '';
  const text = safeString(details);
  return text ? ` ${text}` : '';
}

export function redactUrl(value) {
  if (!value) return '';

  try {
    const url = new URL(String(value), window.location.href);
    for (const key of Array.from(url.searchParams.keys())) {
      if (SENSITIVE_QUERY_KEYS.has(key) || /token|key|secret/i.test(key)) {
        url.searchParams.set(key, '***');
      }
    }

    const query = url.searchParams.toString();
    return `${url.host}${url.pathname}${query ? `?${query}` : ''}`;
  } catch {
    return String(value).replace(/([?&][^=]*(?:token|key|secret)[^=]*=)[^&\s]+/gi, '$1***');
  }
}

export function redactDetails(details = {}) {
  const redacted = {};
  for (const [key, value] of Object.entries(details || {})) {
    if (/^(apiKey|apikey|key|token|sessionToken|secret|authorization)$/i.test(key)) {
      redacted[key] = value ? '***' : value;
    } else if (/url/i.test(key)) {
      redacted[key] = redactUrl(value);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

export function logDiagnostic(level, area, message, details = undefined) {
  const normalizedLevel = ['ok', 'info', 'warn', 'error'].includes(level) ? level : 'info';
  const entry = {
    id: Date.now() + Math.random(),
    ts: new Date().toISOString(),
    level: normalizedLevel,
    area: area || 'app',
    message: message || '',
    details: details === undefined ? undefined : redactDetails(details),
  };

  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.shift();

  const consoleMethod = getConsoleMethod(normalizedLevel);
  console[consoleMethod](`[UCM][${entry.area}] ${entry.message}${formatConsoleDetails(entry.details)}`);

  captureDiagnostic(entry);
  if (normalizedLevel === 'error') {
    captureUcmException(new Error(`[${entry.area}] ${entry.message}`), {
      tags: { area: entry.area },
      extra: { details: entry.details },
    });
  }

  notify();
  return entry;
}

export function setLastTransport(transport) {
  lastTransport = transport || 'unknown';
}

export function setSseStatus(status, details = undefined) {
  sseStatus = status || 'unknown';
  logDiagnostic(status === 'error' ? 'error' : 'info', 'sse', `SSE ${sseStatus}`, details);
}

export function getDiagnosticsEntries() {
  return [...entries];
}

export function clearDiagnostics() {
  entries.length = 0;
  notify();
}

export function subscribeDiagnostics(listener) {
  if (typeof listener !== 'function') return () => {};
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPlatformInfo() {
  const hasPdaGet = typeof PDA_httpGet === 'function';
  const hasPdaPost = typeof PDA_httpPost === 'function';
  const hasGmXmlHttpRequest = typeof GM_xmlhttpRequest === 'function';
  const hasGmNamespaceRequest = typeof GM !== 'undefined' && typeof GM.xmlHttpRequest === 'function';
  const scriptVersion = (typeof GM_info !== 'undefined' && GM_info?.script?.version) || 'unknown';

  return {
    platform: hasPdaGet || hasPdaPost ? 'TornPDA' : 'Userscript manager',
    backendUrl: CONFIG.BACKEND_URL,
    scriptVersion,
    href: typeof window !== 'undefined' ? window.location.href : '',
    readyState: typeof document !== 'undefined' ? document.readyState : '',
    isTopWindow: typeof window !== 'undefined' ? window.top === window.self : true,
    hasPdaGet,
    hasPdaPost,
    hasGmXmlHttpRequest,
    hasGmNamespaceRequest,
    hasFetch: typeof fetch === 'function',
    lastTransport,
    sseStatus,
    hasSessionToken: Boolean(state.sessionToken),
    sessionTokenLength: state.sessionToken?.length || 0,
    memberId: state.memberId || null,
    factionId: state.factionId || null,
    permissionCount: Array.isArray(state.permissions) ? state.permissions.length : 0,
    currentChainId: state.currentChainId || null,
    commandMode: state.commandMode || null,
  };
}

export function serializeDiagnostics() {
  const platform = getPlatformInfo();
  const lines = [
    'UCM diagnostics',
    `Generated: ${new Date().toISOString()}`,
    `Platform: ${platform.platform}`,
    `Backend: ${redactUrl(platform.backendUrl)}`,
    `Script version: ${platform.scriptVersion}`,
    `Transport: ${platform.lastTransport}`,
    `SSE: ${platform.sseStatus}`,
    `Session: ${platform.hasSessionToken ? `present (${platform.sessionTokenLength})` : 'missing'}`,
    `Member: ${platform.memberId || '-'}`,
    `Faction: ${platform.factionId || '-'}`,
    '',
    'Recent entries:',
  ];

  for (const entry of entries) {
    const details = entry.details === undefined ? '' : ` ${safeString(entry.details)}`;
    lines.push(`${entry.ts} ${entry.level.toUpperCase()} [${entry.area}] ${entry.message}${details}`);
  }

  return lines.join('\n');
}

if (typeof window !== 'undefined') {
  window.__UCM_DIAGNOSTICS__ = {
    clear: clearDiagnostics,
    entries: getDiagnosticsEntries,
    info: getPlatformInfo,
    text: serializeDiagnostics,
  };
}
