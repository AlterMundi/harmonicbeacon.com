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
});

test('confirmation starts neutral and unlocks content from canonical status', () => {
  const page = read('inscripcion/confirmacion/index.html');
  assert.match(page, /<title>Verificando pago · Harmonic Beacon<\/title>/);
  assert.match(page, /id="confirmedContent" hidden/);
  assert.match(page, /window\.HMPCommerce\.commerceStatus\(context\)/);
  assert.match(page, /state === 'PAYMENT_CONFIRMED' \|\| state === 'ACCESS_READY'/);
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
