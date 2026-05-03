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
  buildEventWebSocketUrl,
  parseWebSocketEvent,
} = await import('../src/api/event-websocket-client.js');

test('builds an authenticated wss event URL with cursor', () => {
  const url = buildEventWebSocketUrl('https://ucm.example.com', 'session.jwt', 12);

  assert.equal(url, 'wss://ucm.example.com/events/ws?token=session.jwt&after=12');
});

test('builds a ws event URL for local http backends', () => {
  const url = buildEventWebSocketUrl('http://127.0.0.1:3000/', 'local token', 0);

  assert.equal(url, 'ws://127.0.0.1:3000/events/ws?token=local+token&after=0');
});

test('parses websocket event frames and ignores keepalives', () => {
  assert.equal(parseWebSocketEvent('{"type":"keepalive"}'), null);

  const evt = parseWebSocketEvent('{"id":42,"eventType":"command.hold_all","payloadJson":"{\\"reason\\":\\"hold\\"}"}');

  assert.equal(evt.id, 42);
  assert.equal(evt.eventType, 'command.hold_all');
  assert.equal(evt.payloadJson, '{"reason":"hold"}');
});
