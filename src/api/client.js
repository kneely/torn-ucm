import { CONFIG } from '../config.js';
import { state } from '../state/store.js';
import { storageRemove, storageSet } from '../lib/storage.js';

const REFRESH_SESSION_PATH = '/auth/refresh-session';
let refreshSessionPromise = null;

class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function parseBody(contentType, text) {
  if (!text) return null;

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

async function parseFetchResponse(resp) {
  const contentType = resp.headers.get('content-type') || '';

  if (resp.status === 204) {
    return null;
  }

  try {
    const text = await resp.text();
    return parseBody(contentType, text);
  } catch {
    return null;
  }
}

function parseGmResponse(response) {
  const contentTypeMatch = response.responseHeaders?.match(/^content-type:\s*([^\r\n]+)/im);
  const contentType = contentTypeMatch?.[1] || '';

  if (response.status === 204) {
    return null;
  }

  return parseBody(contentType, response.responseText || '');
}

function getUserscriptRequest() {
  if (typeof GM_xmlhttpRequest === 'function') {
    return GM_xmlhttpRequest;
  }

  if (typeof GM !== 'undefined' && typeof GM.xmlHttpRequest === 'function') {
    return GM.xmlHttpRequest.bind(GM);
  }

  return null;
}

function requestViaUserscript(method, url, opts) {
  const gmRequest = getUserscriptRequest();
  if (!gmRequest) return null;

  return new Promise((resolve, reject) => {
    gmRequest({
      method,
      url,
      headers: opts.headers,
      data: opts.body,
      responseType: 'text',
      onload: (response) => {
        resolve({
          ok: response.status >= 200 && response.status < 300,
          status: response.status,
          data: parseGmResponse(response),
        });
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

/**
 * Make an authenticated request to the UCM backend.
 */
async function requestOnce(method, path, body = null) {
  const url = `${CONFIG.BACKEND_URL}${path}`;
  const isOnboardRequest = path === '/auth/onboard-member';
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (state.sessionToken) {
    opts.headers.Authorization = `Bearer ${state.sessionToken}`;
  }

  if (body) {
    opts.body = JSON.stringify(body);
  }

  if (isOnboardRequest) {
    console.log('[UCM][api] onboarding request start', {
      method,
      url,
      hasUserscriptRequest: Boolean(getUserscriptRequest()),
      timezone: body?.timezone,
      scriptVersion: body?.scriptVersion,
      apiKeyLength: body?.apiKey?.length || 0,
    });
  }

  try {
    const gmResponse = await requestViaUserscript(method, url, opts);
    if (gmResponse) {
      if (isOnboardRequest) {
        console.log('[UCM][api] onboarding userscript request completed', {
          status: gmResponse.status,
          ok: gmResponse.ok,
          hasSessionToken: Boolean(gmResponse.data?.sessionToken),
        });
      }

      if (!gmResponse.ok) {
        const message = gmResponse.data?.error || gmResponse.data?.message || `Request failed: ${gmResponse.status}`;
        throw new ApiError(message, gmResponse.status, gmResponse.data);
      }

      return gmResponse.data;
    }
  } catch (err) {
    if (isOnboardRequest) {
      console.error('[UCM][api] onboarding userscript request failed', {
        message: err?.message || 'unknown error',
      });
    }

    if (err instanceof ApiError) {
      throw err;
    }

    if (getUserscriptRequest()) {
      throw new Error(err?.message || 'Userscript network request failed.');
    }
  }

  let resp;
  try {
    resp = await fetch(url, opts);
  } catch (err) {
    if (isOnboardRequest) {
      console.error('[UCM][api] onboarding fetch request failed', {
        message: err?.message || 'unknown error',
      });
    }
    throw new Error(`Network request failed: ${err?.message || 'unknown error'}`);
  }

  const data = await parseFetchResponse(resp);

  if (isOnboardRequest) {
    console.log('[UCM][api] onboarding fetch request completed', {
      status: resp.status,
      ok: resp.ok,
      hasSessionToken: Boolean(data?.sessionToken),
    });
  }

  if (!resp.ok) {
    const message = data?.error || data?.message || `Request failed: ${resp.status}`;
    throw new ApiError(message, resp.status, data);
  }

  return data;
}

function persistSession(data) {
  state.sessionToken = data.sessionToken;
  state.memberId = data.member?.id || '';
  state.factionId = data.faction?.id || '';
  state.permissions = data.permissions || [];

  storageSet(CONFIG.STORAGE.SESSION_TOKEN, data.sessionToken);
  storageSet(CONFIG.STORAGE.MEMBER_ID, state.memberId);
  storageSet(CONFIG.STORAGE.FACTION_ID, state.factionId);
  storageSet(CONFIG.STORAGE.PERMISSIONS, JSON.stringify(state.permissions));
}

function clearSession() {
  state.sessionToken = null;
  state.memberId = null;
  state.factionId = null;
  state.permissions = [];

  storageRemove(CONFIG.STORAGE.SESSION_TOKEN);
  storageRemove(CONFIG.STORAGE.MEMBER_ID);
  storageRemove(CONFIG.STORAGE.FACTION_ID);
  storageRemove(CONFIG.STORAGE.PERMISSIONS);
}

function canRefreshSession(path) {
  return Boolean(state.sessionToken) &&
    path !== '/auth/onboard-member' &&
    path !== REFRESH_SESSION_PATH;
}

async function refreshSession() {
  if (!refreshSessionPromise) {
    refreshSessionPromise = (async () => {
      const data = await requestOnce('POST', REFRESH_SESSION_PATH);
      if (!data?.sessionToken) {
        throw new Error('Session refresh failed: missing session token.');
      }

      persistSession(data);
      console.log('[UCM][api] session refreshed', {
        memberId: state.memberId || null,
        factionId: state.factionId || null,
        permissionCount: state.permissions.length,
      });

      return data;
    })()
      .catch((error) => {
        clearSession();
        throw error;
      })
      .finally(() => {
        refreshSessionPromise = null;
      });
  }

  return refreshSessionPromise;
}

async function request(method, path, body = null, hasRetried = false) {
  try {
    return await requestOnce(method, path, body);
  } catch (error) {
    if (!hasRetried && error?.status === 401 && canRefreshSession(path)) {
      await refreshSession();
      return request(method, path, body, true);
    }

    throw error;
  }
}

export async function onboard(apiKey, timezone, scriptVersion) {
  return request('POST', '/auth/onboard-member', {
    apiKey,
    timezone,
    clientHost: 'tornpda',
    scriptVersion,
  });
}

/**
 * Normalize chain response fields from .NET backend (camelCase) to the
 * property names the UI templates expect.
 */
function normalizeChain(raw) {
  if (!raw) return null;
  return {
    ...raw,
    status: raw.chainStatus ?? raw.status,
    commandMode: raw.commandMode,
  };
}

export async function getCurrentChain() {
  const data = await request('GET', '/chains/current');
  return { chain: normalizeChain(data?.chain ?? data) };
}

export async function listChains() {
  const data = await request('GET', '/chains');
  const items = Array.isArray(data) ? data : [];
  return { chains: items.map(normalizeChain) };
}

export async function getChain(chainId) {
  const data = await request('GET', `/chains/${chainId}`);
  return { chain: normalizeChain(data) };
}

export async function createChain(payload) {
  const data = await request('POST', '/chains', payload);
  return { chain: normalizeChain(data) };
}

export async function rsvp(chainId, payload) {
  return request('POST', `/chains/${chainId}/rsvp`, payload);
}

export async function checkIn(chainId, presenceState, energy, pageTelemetry) {
  return request('POST', `/chains/${chainId}/presence/check-in`, {
    presenceState,
    energy,
    clientHost: 'tornpda',
    pageTelemetry,
  });
}

export async function heartbeat(chainId, presenceState, energy, pageTelemetry) {
  return request('POST', `/chains/${chainId}/presence/heartbeat`, {
    presenceState,
    energy,
    pageTelemetry,
  });
}

export async function holdAll(chainId, payload) {
  return request('POST', `/chains/${chainId}/commands/hold-all`, payload);
}

export async function releaseAll(chainId, payload) {
  return request('POST', `/chains/${chainId}/commands/release-all`, payload);
}

export async function assignTarget(chainId, payload) {
  return request('POST', `/chains/${chainId}/commands/assign-target`, payload);
}

export async function issuePass(chainId, payload) {
  return request('POST', `/chains/${chainId}/commands/issue-one-time-pass`, payload);
}

export async function addWatchlistEntry(chainId, payload) {
  return request('POST', `/chains/${chainId}/watchlist`, payload);
}

export async function removeWatchlistEntry(chainId, entryId) {
  return request('DELETE', `/chains/${chainId}/watchlist/${entryId}`);
}

export async function defenseAlert(chainId, payload) {
  return request('POST', `/chains/${chainId}/alerts/defense`, payload);
}

export async function listMembers(chainId = '') {
  const query = chainId ? `?chainId=${encodeURIComponent(chainId)}` : '';
  return request('GET', `/members${query}`);
}

export async function startChain(chainId) {
  return request('POST', `/chains/${chainId}/start`, {});
}

export async function endChain(chainId, payload) {
  return request('POST', `/chains/${chainId}/end`, payload);
}
