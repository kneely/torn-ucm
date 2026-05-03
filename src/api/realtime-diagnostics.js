import { CONFIG } from '../config.js';
import { state } from '../state/store.js';
import { logDiagnostic, redactUrl } from '../lib/diagnostics.js';
import { buildEventWebSocketUrl } from './event-websocket-client.js';

const PROBE_TIMEOUT_MS = 5000;
const GRPC_WEB_CONTENT_TYPE = 'application/grpc-web+proto';

function encodeVarint(value) {
  let next = Math.max(0, Number(value) || 0);
  const bytes = [];
  while (next > 127) {
    bytes.push((next & 0x7f) | 0x80);
    next = Math.floor(next / 128);
  }
  bytes.push(next);
  return bytes;
}

function decodeVarint(bytes, offset) {
  let result = 0;
  let shift = 0;
  let index = offset;

  while (index < bytes.length) {
    const byte = bytes[index++];
    result += (byte & 0x7f) * Math.pow(2, shift);
    if ((byte & 0x80) === 0) {
      return { value: result, offset: index };
    }
    shift += 7;
  }

  throw new Error('invalid protobuf varint');
}

function encodeStringField(fieldNumber, value) {
  const encoded = new TextEncoder().encode(String(value || ''));
  return [
    (fieldNumber << 3) | 2,
    ...encodeVarint(encoded.length),
    ...encoded,
  ];
}

export function buildGrpcWebPingUrl(backendUrl) {
  return new URL('/tornucm.diagnostics.Diagnostics/Ping', backendUrl).toString();
}

export function encodeGrpcWebPingRequest(client = 'ucm-userscript') {
  const message = new Uint8Array(encodeStringField(1, client));
  const frame = new Uint8Array(5 + message.length);
  frame[0] = 0;
  const view = new DataView(frame.buffer);
  view.setUint32(1, message.length, false);
  frame.set(message, 5);
  return frame;
}

function decodePingReplyMessage(message) {
  const reply = {
    status: '',
    transport: '',
    serverUnixMs: 0,
  };
  let offset = 0;
  const decoder = new TextDecoder();

  while (offset < message.length) {
    const tag = message[offset++];
    const fieldNumber = tag >> 3;
    const wireType = tag & 7;

    if (wireType === 2) {
      const length = decodeVarint(message, offset);
      offset = length.offset;
      const valueBytes = message.slice(offset, offset + length.value);
      offset += length.value;
      const value = decoder.decode(valueBytes);
      if (fieldNumber === 1) reply.status = value;
      if (fieldNumber === 2) reply.transport = value;
      continue;
    }

    if (wireType === 0) {
      const value = decodeVarint(message, offset);
      offset = value.offset;
      if (fieldNumber === 3) reply.serverUnixMs = value.value;
      continue;
    }

    throw new Error(`unsupported protobuf wire type ${wireType}`);
  }

  return reply;
}

export function decodeGrpcWebPingReply(buffer) {
  const bytes = new Uint8Array(buffer);
  let offset = 0;

  while (offset + 5 <= bytes.length) {
    const frameType = bytes[offset];
    const length = new DataView(bytes.buffer, bytes.byteOffset + offset + 1, 4).getUint32(0, false);
    offset += 5;
    const message = bytes.slice(offset, offset + length);
    offset += length;

    if ((frameType & 0x80) === 0) {
      return decodePingReplyMessage(message);
    }
  }

  throw new Error('gRPC-Web response did not include a data frame');
}

function withTimeout(promise, timeoutMs, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function probeWebSocket() {
  if (typeof WebSocket !== 'function') {
    throw new Error('WebSocket constructor is unavailable');
  }
  if (!state.sessionToken) {
    throw new Error('session token is missing');
  }

  const url = buildEventWebSocketUrl(CONFIG.BACKEND_URL, state.sessionToken, state.eventCursor || 0);
  const started = performance.now();

  return withTimeout(new Promise((resolve, reject) => {
    let socket;
    try {
      socket = new WebSocket(url);
    } catch (error) {
      reject(error);
      return;
    }

    socket.onopen = () => {
      const ms = Math.round(performance.now() - started);
      socket.close();
      resolve({ ok: true, transport: 'websocket', ms });
    };
    socket.onerror = () => reject(new Error('WebSocket error before open'));
    socket.onclose = (event) => {
      if (event?.code && event.code !== 1000) {
        reject(new Error(`WebSocket closed with ${event.code}`));
      }
    };
  }), PROBE_TIMEOUT_MS, 'WebSocket probe').catch((error) => {
    throw new Error(`${error?.message || 'unknown error'} (${redactUrl(url)})`);
  });
}

export async function probeGrpcWeb() {
  if (typeof fetch !== 'function') {
    throw new Error('fetch is unavailable');
  }
  if (!state.sessionToken) {
    throw new Error('session token is missing');
  }

  const url = buildGrpcWebPingUrl(CONFIG.BACKEND_URL);
  const started = performance.now();
  const response = await withTimeout(fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${state.sessionToken}`,
      'Content-Type': GRPC_WEB_CONTENT_TYPE,
      Accept: GRPC_WEB_CONTENT_TYPE,
      'X-Grpc-Web': '1',
    },
    body: encodeGrpcWebPingRequest('ucm-userscript'),
  }), PROBE_TIMEOUT_MS, 'gRPC-Web probe');

  const grpcStatus = response.headers?.get?.('grpc-status');
  if (!response.ok || (grpcStatus && grpcStatus !== '0')) {
    throw new Error(`gRPC-Web HTTP ${response.status} grpc-status ${grpcStatus || 'missing'}`);
  }

  const reply = decodeGrpcWebPingReply(await response.arrayBuffer());
  const ms = Math.round(performance.now() - started);
  return { ok: reply.status === 'ok', transport: reply.transport || 'grpc-web', ms, reply };
}

async function runNamedProbe(name, probe) {
  try {
    const result = await probe();
    logDiagnostic(result.ok ? 'ok' : 'warn', 'diagnostics', `${name} probe ${result.ok ? 'passed' : 'failed'}`, result);
    return { name, ...result };
  } catch (error) {
    const result = {
      name,
      ok: false,
      message: error?.message || 'unknown error',
    };
    logDiagnostic('warn', 'diagnostics', `${name} probe failed`, result);
    return result;
  }
}

export async function runRealtimeTransportTests() {
  logDiagnostic('info', 'diagnostics', 'realtime transport probes started');
  const [websocket, grpcWeb] = await Promise.all([
    runNamedProbe('WebSocket', probeWebSocket),
    runNamedProbe('gRPC-Web', probeGrpcWeb),
  ]);
  logDiagnostic('info', 'diagnostics', 'realtime transport probes completed', {
    websocket: websocket.ok,
    grpcWeb: grpcWeb.ok,
  });
  return { websocket, grpcWeb };
}
