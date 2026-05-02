import posthog from 'posthog-js';

const APP_NAME = 'torn-ucm-userscript';
const RELEASE = `${APP_NAME}@${__UCM_VERSION__}`;
const SENSITIVE_KEY_PATTERN = /apiKey|apikey|key|token|sessionToken|secret|authorization/i;
const SENSITIVE_URL_PATTERN = /([?&][^=]*(?:token|key|secret)[^=]*=)[^&\s]+/gi;

let initRequested = false;

function redactValue(key, value) {
  if (SENSITIVE_KEY_PATTERN.test(key)) {
    return value ? '***' : value;
  }

  if (/url|href/i.test(key) && typeof value === 'string') {
    return value.replace(SENSITIVE_URL_PATTERN, '$1***');
  }

  return value;
}

function redactObject(value) {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(redactObject);

  const redacted = {};
  for (const [key, entryValue] of Object.entries(value)) {
    if (entryValue && typeof entryValue === 'object') {
      redacted[key] = redactObject(entryValue);
    } else {
      redacted[key] = redactValue(key, entryValue);
    }
  }
  return redacted;
}

function mapLogLevel(level) {
  if (level === 'ok') return 'info';
  if (level === 'warn') return 'warn';
  if (level === 'error') return 'error';
  return 'info';
}

function callPostHog(methodName, ...args) {
  const method = posthog?.[methodName];
  if (typeof method !== 'function') return;

  try {
    method.apply(posthog, args);
  } catch {
    // PostHog must never break the userscript.
  }
}

export function initPostHog() {
  if (initRequested) return;
  initRequested = true;

  posthog.init('phc_wnMwPVFMsUHMGA2BJ2rHfeYPEp24jC38DX4LA49EAYfg', {
    api_host: 'https://us.i.posthog.com',
    defaults: '2026-01-30',
    capture_exceptions: {
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true,
      capture_console_errors: true,
    },
    logs: {
      serviceName: APP_NAME,
      environment: 'production',
      serviceVersion: __UCM_VERSION__,
      maxLogsPerInterval: 500,
    },
    before_send(event) {
      if (event?.properties) {
        event.properties = redactObject(event.properties);
      }
      return event;
    },
    loaded(posthog) {
      try {
        posthog.register({
          app: APP_NAME,
          app_version: __UCM_VERSION__,
          release: RELEASE,
          runtime: 'userscript',
        });

        posthog.capture('ucm_posthog_loaded', {
          release: RELEASE,
          href: typeof window !== 'undefined' ? window.location.href : '',
        });
      } catch {
        // PostHog callbacks are best effort.
      }
    },
  });
}

initPostHog();

export function captureDiagnostic(entry) {
  const attributes = redactObject({
    level: entry.level,
    area: entry.area,
    details: entry.details,
    ts: entry.ts,
    release: RELEASE,
  });

  callPostHog('captureLog', {
    body: `[${entry.area}] ${entry.message}`,
    level: mapLogLevel(entry.level),
    attributes,
  });

  callPostHog('capture', 'ucm_diagnostic', {
    ...attributes,
    message: entry.message,
  });
}

export function captureUcmException(error, context = {}) {
  const properties = redactObject({
    source: 'ucm',
    release: RELEASE,
    ...(context.tags || {}),
    ...(context.extra || {}),
  });

  callPostHog('captureException', error, properties);
  callPostHog('captureLog', {
    body: error?.message || 'unknown error',
    level: 'error',
    attributes: properties,
  });
  callPostHog('capture', 'ucm_exception', {
    message: error?.message || 'unknown error',
    ...properties,
  });
}

export function updatePostHogUserContext({ memberId, factionId, permissionCount } = {}) {
  if (memberId) {
    callPostHog('identify', String(memberId), {
      faction_id: factionId ? String(factionId) : null,
      permission_count: Number(permissionCount || 0),
    });
  }

  callPostHog('register', {
    faction_id: factionId ? String(factionId) : 'none',
    permission_count: Number(permissionCount || 0),
    has_member: Boolean(memberId),
    has_faction: Boolean(factionId),
  });
}
