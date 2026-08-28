const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('MythBot CTAs fail closed and expose a bilingual email fallback', () => {
  for (const page of ['mythbot/index.html', 'inscripcion/confirmacion/index.html']) {
    const html = read(page);
    assert.match(html, /data-mythbot-transport/);
    assert.match(html, /data-mythbot-cta hidden/);
    assert.match(html, /data-mythbot-fallback/);
    assert.match(html, /projection@harmonicbeacon\.com/);
    assert.match(html, /assets\/mythbot-transport\.js/);
  }
});

test('transport controller only reveals CTAs after canonical WhatsApp readiness', () => {
  const script = read('assets/mythbot-transport.js');
  assert.match(script, /https:\/\/bot\.harmonicbeacon\.com\/ready/);
  assert.match(script, /payload\?\.components\?\.whatsapp === 'ready'/);
  assert.match(script, /credentials: 'omit'/);
  assert.match(script, /cache: 'no-store'/);
  assert.match(script, /cta\.hidden = !ready/);
  assert.match(script, /fallback\.hidden = ready/);
});

test('all public MythBot CTAs target the current Meta Cloud number', () => {
  const pages = [read('mythbot/index.html'), read('inscripcion/confirmacion/index.html')];
  assert.equal(pages.some((html) => html.includes('wa.me/50663551803')), false);
  assert.equal(pages.every((html) => html.includes('wa.me/5493547469632')), true);
});
