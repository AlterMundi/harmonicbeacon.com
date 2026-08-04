const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

test('events page announces only the August 8 virtual sessions while registration is closed', () => {
  const page = read('eventos/index.html');
  assert.match(page, /online todos los fines de semana/);
  assert.match(page, /online every weekend/);
  assert.match(page, /Guardala para consultar la agenda vigente/);
  assert.equal((page.match(/data-event-date="2026-08-08"/g) || []).length, 2);
  assert.match(page, /2026-08-08T14:30:00Z/);
  assert.match(page, /2026-08-08T20:00:00Z/);
  assert.match(page, /Inscripciones cerradas/);
  assert.match(page, /Registration closed/);
  assert.doesNotMatch(page, /Inscripción abierta/);
  assert.doesNotMatch(page, /Registration open/);
  assert.doesNotMatch(page, /href="\/inscripcion\//);
  assert.doesNotMatch(page, /data-event-date="2026-08-15"/);
});

test('registration form requires v3 terms and never bypasses its backend', () => {
  const page = read('inscripcion/index.html');
  const commerce = read('assets/hmp-commerce.js');
  assert.match(commerce, /const REGISTRATION_OPEN = false;/);
  assert.match(page, /id="registrationClosed"/);
  assert.match(page, /id="registrationFlow" hidden/);
  assert.match(page, /registrationOpen&&Boolean\(eventConfig\)/);
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

test('Meta Purchase fails closed without canonical paid conversion facts', () => {
  const pixel = read('assets/meta-pixel.js');
  assert.doesNotMatch(pixel, /fbq\('track', 'Purchase'/);
  assert.doesNotMatch(pixel, /englishSession \? 50 : 20/);
  assert.doesNotMatch(pixel, /en-1400-cr|es-0830-cr/);
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
