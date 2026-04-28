import { logDiagnostic, redactUrl, setLastTransport } from './diagnostics.js';

function getGmRequest() {
  if (typeof GM_xmlhttpRequest === 'function') {
    return GM_xmlhttpRequest;
  }

  if (typeof GM !== 'undefined' && typeof GM.xmlHttpRequest === 'function') {
    return GM.xmlHttpRequest.bind(GM);
  }

  return null;
}

function getPdaTransport(method) {
  const normalized = String(method || 'GET').toUpperCase();
  if (normalized === 'GET' && typeof PDA_httpGet === 'function') {
    return PDA_httpGet;
  }
  if (normalized === 'POST' && typeof PDA_httpPost === 'function') {
    return PDA_httpPost;
  }
  return null;
}

function responseTextFrom(value) {
  if (typeof value?.responseText === 'string') return value.responseText;
  if (typeof value?.body === 'string') return value.body;
  if (typeof value?.data === 'string') return value.data;
  if (typeof value === 'string') return value;
  return '';
}

function responseHeadersFrom(value) {
  if (typeof value?.responseHeaders === 'string') return value.responseHeaders;
  if (typeof value?.headers === 'string') return value.headers;
  if (value?.headers && typeof value.headers.forEach === 'function') {
    const rows = [];
    value.headers.forEach((headerValue, headerName) => {
      rows.push(`${headerName}: ${headerValue}`);
    });
    return rows.join('\r\n');
  }
  return '';
}

function normalizeResponse(response, transport) {
  if (!response) {
    throw new Error(`${transport} returned an empty response.`);
  }

  const status = Number(response?.status || 0);
  return {
    ok: status >= 200 && status < 300,
    status,
    responseText: responseTextFrom(response),
    responseHeaders: responseHeadersFrom(response),
    transport,
  };
}

function requestViaPda(method, url, opts) {
  const pdaTransport = getPdaTransport(method);
  if (!pdaTransport) return null;

  const normalized = String(method || 'GET').toUpperCase();
  if (normalized === 'GET') {
    return pdaTransport(url).then((response) => normalizeResponse(response, 'pda'));
  }

  return pdaTransport(url, opts.headers || {}, opts.body || '')
    .then((response) => normalizeResponse(response, 'pda'));
}

function requestViaGm(method, url, opts) {
  const gmRequest = getGmRequest();
  if (!gmRequest) return null;

  return new Promise((resolve, reject) => {
    gmRequest({
      method,
      url,
      headers: opts.headers,
      data: opts.body,
      responseType: 'text',
      onload: (response) => {
        resolve(normalizeResponse(response, 'gm'));
      },
      onerror: () => {
        reject(new Error('Userscript network request failed.'));
      },
      ontimeout: () => {
        reject(new Error('Userscript network request timed out.'));
      },
    });
  });
}

async function requestViaFetch(method, url, opts) {
  const response = await fetch(url, opts);
  const responseText = response.status === 204 ? '' : await response.text();
  return normalizeResponse({
    status: response.status,
    responseText,
    headers: response.headers,
  }, 'fetch');
}

export function getTransportCapabilities(method = 'GET') {
  return {
    hasPdaTransport: Boolean(getPdaTransport(method)),
    hasGmTransport: Boolean(getGmRequest()),
    hasFetch: typeof fetch === 'function',
  };
}

export async function httpRequest(method, url, opts = {}) {
  const normalizedMethod = String(method || 'GET').toUpperCase();
  const started = performance.now();
  const redactedUrl = redactUrl(url);
  const attempts = [];

  logDiagnostic('info', 'api', `${normalizedMethod} ${redactedUrl} start`, {
    hasPdaTransport: Boolean(getPdaTransport(normalizedMethod)),
    hasGmTransport: Boolean(getGmRequest()),
    hasFetch: typeof fetch === 'function',
  });

  const runAttempt = async (name, requestFn) => {
    attempts.push(name);
    try {
      const response = await requestFn();
      setLastTransport(response.transport);
      const ms = Math.round(performance.now() - started);
      logDiagnostic(response.ok ? 'ok' : 'warn', 'api', `${normalizedMethod} ${redactedUrl} -> ${response.status || 'ERR'}`, {
        transport: response.transport,
        ms,
      });
      return response;
    } catch (error) {
      const ms = Math.round(performance.now() - started);
      logDiagnostic('warn', 'api', `${normalizedMethod} ${redactedUrl} ${name} failed`, {
        transport: name,
        ms,
        message: error?.message || 'unknown error',
      });
      throw error;
    }
  };

  if (getPdaTransport(normalizedMethod)) {
    return runAttempt('pda', () => requestViaPda(normalizedMethod, url, opts));
  }

  if (getGmRequest()) {
    return runAttempt('gm', () => requestViaGm(normalizedMethod, url, opts));
  }

  if (typeof fetch === 'function') {
    return runAttempt('fetch', () => requestViaFetch(normalizedMethod, url, opts));
  }

  logDiagnostic('error', 'api', `${normalizedMethod} ${redactedUrl} no transport available`, {
    attempts,
  });
  throw new Error('No compatible network transport is available.');
}

export function getStreamingUserscriptRequest() {
  return getGmRequest();
}
