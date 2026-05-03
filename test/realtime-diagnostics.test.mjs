import assert from 'node:assert/strict';
import test from 'node:test';

globalThis.__UCM_VERSION__ = 'test';
globalThis.window = {
  location: { href: 'https://www.torn.com/' },
  localStorage: {
    getItem() {
      return null;
    },
  },
};
globalThis.document = { cookie: '' };

const {
  buildGrpcWebPingUrl,
  decodeGrpcWebPingReply,
  encodeGrpcWebPingRequest,
} = await import('../src/api/realtime-diagnostics.js');

test('builds gRPC-Web diagnostic ping URL', () => {
  const url = buildGrpcWebPingUrl('https://ucm.example.com/');

  assert.equal(url, 'https://ucm.example.com/tornucm.diagnostics.Diagnostics/Ping');
});

test('encodes gRPC-Web ping request frame', () => {
  const frame = encodeGrpcWebPingRequest('ucm');

  assert.deepEqual(Array.from(frame), [
    0, 0, 0, 0, 5,
    10, 3, 117, 99, 109,
  ]);
});

test('decodes gRPC-Web ping reply frame', () => {
  const frame = new Uint8Array([
    0, 0, 0, 0, 18,
    10, 2, 111, 107,
    18, 8, 103, 114, 112, 99, 45, 119, 101, 98,
    24, 123,
  ]);

  const reply = decodeGrpcWebPingReply(frame.buffer);

  assert.deepEqual(reply, {
    status: 'ok',
    transport: 'grpc-web',
    serverUnixMs: 123,
  });
});
