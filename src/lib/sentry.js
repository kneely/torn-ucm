const SENTRY_DSN = 'https://46a733c137c10e55e43bad1e9e01632b@o507051.ingest.us.sentry.io/4511321247186944';
const APP_NAME = 'torn-ucm-userscript';
const RELEASE = `${APP_NAME}@${__UCM_VERSION__}`;
const BACKEND_ORIGIN = 'https://ucm.neelyinno.com';

const SENSITIVE_QUERY_KEYS = new Set([
  'apiKey',
  'apikey',
  'key',
  'token',
  'sessionToken',
  'access_token',
]);

let initRequested = false;

function getSentry() {
  return typeof window !== 'undefined' ? window.Sentry : null;
}

function runWhenReady(callback) {
  const sentry = getSentry();
  if (!sentry) return;

  try {
    if (typeof sentry.onLoad === 'function') {
      sentry.onLoad(() => callback(getSentry()));
      sentry.forceLoad?.();
      return;
    }

    callback(sentry);
  } catch {
    // Sentry must never break the userscript.
  }
}

function scrubUrl(value) {
  if (!value) return value;

  try {
    const url = new URL(String(value), window.location.href);
    for (const key of Array.from(url.searchParams.keys())) {
      if (SENSITIVE_QUERY_KEYS.has(key) || /token|key|secret/i.test(key)) {
        url.searchParams.set(key, '***');
      }
    }
    return url.toString();
  } catch {
    return String(value).replace(/([?&][^=]*(?:token|key|secret)[^=]*=)[^&\s]+/gi, '$1***');
  }
}

function isUcmStack(event) {
  const frames = event.exception?.values?.flatMap((value) => value.stacktrace?.frames || []) || [];
  return frames.some((frame) => /torn-ucm|ucm|userscript/i.test(frame.filename || ''));
}

function scrubEvent(event) {
  if (event.request?.url) {
    event.request.url = scrubUrl(event.request.url);
  }

  return event;
}

function buildIntegrations(sentry) {
  const integrations = [];

  if (typeof sentry?.browserTracingIntegration === 'function') {
    integrations.push(sentry.browserTracingIntegration({
      traceFetch: true,
      traceXHR: true,
      tracePropagationTargets: [
        BACKEND_ORIGIN,
        /^http:\/\/localhost(?::\d+)?/,
        /^http:\/\/127\.0\.0\.1(?::\d+)?/,
      ],
      shouldCreateSpanForRequest: (url) => !String(url).includes('/health'),
    }));
  }

  if (typeof sentry?.replayIntegration === 'function') {
    integrations.push(sentry.replayIntegration({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
      networkDetailDenyUrls: [
        /api\.torn\.com/i,
        /ingest\.us\.sentry\.io/i,
      ],
    }));
  }

  return integrations;
}

function initSentry() {
  if (initRequested) return;
  initRequested = true;

  runWhenReady((sentry) => {
    if (!sentry || typeof sentry.init !== 'function') return;

    sentry.init({
      dsn: SENTRY_DSN,
      environment: 'production',
      release: RELEASE,
      sendDefaultPii: false,
      attachStacktrace: true,
      maxBreadcrumbs: 75,
      integrations: buildIntegrations(sentry),
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 1.0,
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications.',
        /^Script error\.?$/,
      ],
      beforeSend(event) {
        const source = event.tags?.source;
        if (source !== 'ucm' && !isUcmStack(event)) {
          return null;
        }

        return scrubEvent(event);
      },
      beforeSendTransaction: scrubEvent,
      beforeBreadcrumb(breadcrumb) {
        if (breadcrumb.data?.url) {
          breadcrumb.data.url = scrubUrl(breadcrumb.data.url);
        }
        return breadcrumb;
      },
      initialScope: {
        tags: {
          app: APP_NAME,
          runtime: 'userscript',
        },
      },
    });
  });
}

initSentry();

function callSentry(methodName, ...args) {
  const sentry = getSentry();
  const method = sentry?.[methodName];
  if (typeof method !== 'function') return;

  try {
    method.apply(sentry, args);
  } catch {
    // Sentry must never break the userscript.
  }
}

function setSentryContext(callback) {
  runWhenReady((sentry) => {
    if (!sentry) return;

    try {
      callback(sentry);
    } catch {
      // Sentry context updates are best effort.
    }
  });
}

export function addUcmBreadcrumb(entry) {
  callSentry('addBreadcrumb', {
    category: `ucm.${entry.area || 'app'}`,
    level: entry.level === 'error' ? 'error' : entry.level === 'warn' ? 'warning' : 'info',
    message: entry.message || '',
    data: entry.details,
    timestamp: Date.parse(entry.ts) / 1000,
  });
}

export function captureUcmException(error, context = {}) {
  callSentry('captureException', error, {
    tags: {
      source: 'ucm',
      ...(context.tags || {}),
    },
    extra: context.extra,
  });
}

export function updateSentryUserContext({ memberId, factionId, permissionCount } = {}) {
  setSentryContext((sentry) => {
    sentry.setUser?.(memberId ? { id: String(memberId) } : null);
    sentry.setTags?.({
      faction_id: factionId ? String(factionId) : 'none',
    });
    sentry.setContext?.('ucm_session', {
      hasMember: Boolean(memberId),
      hasFaction: Boolean(factionId),
      permissionCount: Number(permissionCount || 0),
    });
  });
}
