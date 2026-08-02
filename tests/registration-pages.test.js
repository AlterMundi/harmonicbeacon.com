const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

test('registration form requires v3 terms and never bypasses its backend', () => {
  const page = read('inscripcion/index.html');
  assert.match(page, /registrationTermsVersion" value="registration-v3"/);
  assert.match(page, /registrationTermsAccepted" value="ACEPTO" required/);
  assert.match(page, /window\.HMPCommerce\.register\(payload\)/);
  assert.doesNotMatch(page, /mode:\s*['"]no-cors/);
  assert.doesNotMatch(page, /script\.google\.com\/macros/);
  assert.doesNotMatch(page, /buytickets\.at\/harmonicbeacon/);
  assert.match(page, /registrationEvent\(fecha\)/);
  assert.match(page, /if\(!eventAvailable\)/);
  assert.match(page, /fecha=params\.get\('fecha'\)\|\|'2026-08-08'/);
  assert.match(page, /value="hmp-2026-08-08"/);
  assert.doesNotMatch(page, /'2026-08-01':/);
  assert.doesNotMatch(page, /'2026-08-15':/);
  assert.match(page, /error\?\.code==='registration_timeout'/);
});

test('confirmation starts neutral and unlocks content from canonical status', () => {
  const page = read('inscripcion/confirmacion/index.html');
  assert.match(page, /<title>Verificando pago · Harmonic Beacon<\/title>/);
  assert.match(page, /id="confirmedContent" hidden/);
  assert.match(page, /window\.HMPCommerce\.commerceStatus\(context\)/);
  assert.match(page, /state === 'PAYMENT_CONFIRMED' \|\| state === 'ACCESS_READY'/);
  assert.match(page, /id="retryStatus"/);
  assert.match(page, /commerce_status_timeout/);
  assert.match(page, /STATUS_TIMEOUT/);
});

test('Meta Purchase is gated by the canonical commerce event', () => {
  const pixel = read('assets/meta-pixel.js');
  assert.match(pixel, /hb:commerce-confirmed/);
  assert.doesNotMatch(pixel, /tt_order_id/);
});

test('registration-v3 legal page hash is pinned for server-side evidence', () => {
  const bytes = fs.readFileSync(path.join(root, 'politica/index.html'));
  assert.equal(
    crypto.createHash('sha256').update(bytes).digest('hex'),
    '0d65e0c03acd635f08c3e04628a19ef0e674e08612e2ac2446502f3b10b6b54e'
  );
  assert.match(bytes.toString('utf8'), /Versión registration-v3/);
});
