const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

test('first-party analytics opt-out covers every Harmonic Beacon subdomain', () => {
  const page = readFileSync('analitica-y-privacidad/index.html', 'utf8');
  assert.match(page, /hb_analytics_disabled=1/);
  assert.match(page, /Domain=\.harmonicbeacon\.com/);
  assert.match(page, /Max-Age=31536000/);
  assert.match(page, /Home, Account, Listen y Live/);
  assert.doesNotMatch(page, /hb-meta-consent|fbq\(/);
});

