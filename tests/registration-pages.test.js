const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

test('registration inline scripts compile before publication', () => {
  for (const relative of ['inscripcion/index.html', 'inscripcion/confirmacion/index.html']) {
    const page = read(relative);
    const scripts = [...page.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    assert.ok(scripts.length > 0, `${relative} must include an inline controller`);
    scripts.forEach((match, index) => {
      assert.doesNotThrow(
        () => new vm.Script(match[1], {filename: `${relative}#inline-${index + 1}`}),
        `${relative} inline script ${index + 1} must compile`
      );
    });
  }
});

test('events page opens only the August 8 virtual sessions', () => {
  const page = read('eventos/index.html');
  assert.match(page, /online todos los fines de semana/);
  assert.match(page, /online every weekend/);
  assert.match(page, /Guardala para consultar la agenda vigente/);
  assert.equal((page.match(/data-event-date="2026-08-08"/g) || []).length, 2);
  assert.match(page, /2026-08-08T14:30:00Z/);
  assert.match(page, /2026-08-08T20:00:00Z/);
  assert.match(page, /Inscripción abierta/);
  assert.match(page, /Registration open/);
  assert.equal((page.match(/href="\/inscripcion\/\?fecha=2026-08-08&amp;idioma=/g) || []).length, 2);
  assert.doesNotMatch(page, /data-event-date="2026-08-15"/);
});

test('registration form requires v4 terms and never bypasses its backend', () => {
  const page = read('inscripcion/index.html');
  const commerce = read('assets/hmp-commerce.js');
  assert.match(commerce, /const REGISTRATION_OPEN = true;/);
  assert.match(page, /id="registrationClosed"/);
  assert.match(page, /id="registrationFlow" hidden/);
  assert.match(page, /registrationOpen&&Boolean\(eventConfig\)/);
  assert.match(page, /registrationTermsVersion" value="registration-v4"/);
  assert.match(page, /registrationTermsAccepted" value="ACEPTO" required/);
  assert.match(page, /window\.HMPCommerce\.register\(payload\)/);
  assert.match(page, /id="emailVerificationStep"/);
  assert.match(page, /id="registrationProgress"/);
  assert.equal((page.match(/data-flow-step="[1-4]"/g) || []).length, 4);
  assert.match(page, /Datos y sesión/);
  assert.match(page, /Confirmá tu email/);
  assert.match(page, /Entrada y pago/);
  assert.match(page, /function setFlowStage\(step\)/);
  assert.match(page, /function showVerification\(payload,result\).*setFlowStage\(2\)/);
  assert.match(page, /function showCheckout\(payload,result\).*setFlowStage\(3\)/);
  assert.match(page, /autocomplete="one-time-code"/);
  assert.match(page, /window\.HMPCommerce\.verifyEmail\(pendingVerification,code,pendingPayload\)/);
  assert.match(page, /window\.HMPCommerce\.resendEmailVerification\(pendingVerification,pendingPayload\)/);
  assert.match(page, /window\.HMPCommerce\.clearStatusContext\(\)/);
  assert.match(page, /window\.HMPCommerce\.mountCheckoutWidget\(widget,payload,result\.checkout/);
  assert.match(page, /id="ticketTailorWidget"/);
  assert.doesNotMatch(page, /location\.assign\(result\.checkout\.widget_url\)/);
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
  assert.match(page, /error\?\.code==='email_domain_unreachable'/);
  assert.match(page, /error\?\.code==='email_domain_validation_unavailable'/);
  assert.match(page, /No pudimos verificar que este dominio de correo pueda recibir mensajes/);
  assert.match(page, /We could not verify that this email domain can receive messages/);
});

test('confirmation starts neutral and unlocks content from canonical status', () => {
  const page = read('inscripcion/confirmacion/index.html');
  assert.match(page, /<title>Verificando pago · Harmonic Beacon<\/title>/);
  assert.match(page, /id="confirmedContent" hidden/);
  assert.match(page, /id="confirmationProgress"/);
  assert.match(page, /<li aria-current="step">.*<span class="confirmation-progress-number">04<\/span>/);
  assert.match(page, /window\.HMPCommerce\.commerceClaim\(context, orderId\)/);
  assert.match(page, /window\.HMPCommerce\.commerceStatus\(context\)/);
  assert.ok(
    page.indexOf('window.HMPCommerce.commerceClaim(context, orderId)') <
      page.indexOf('window.HMPCommerce.commerceStatus(context)')
  );
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

test('registration-v3 remains byte-exact as immutable historical evidence', () => {
  const bytes = fs.readFileSync(path.join(root, 'legal/terms/registration-v3.html'));
  assert.equal(
    crypto.createHash('sha256').update(bytes).digest('hex'),
    '0d65e0c03acd635f08c3e04628a19ef0e674e08612e2ac2446502f3b10b6b54e'
  );
  assert.match(bytes.toString('utf8'), /Versión registration-v3/);
});

test('registration-v4 discloses the three consent-gated Meta events without PII', () => {
  const bytes = fs.readFileSync(path.join(root, 'politica/index.html'));
  const immutableBytes = fs.readFileSync(path.join(root, 'legal/terms/registration-v4.html'));
  const policy = bytes.toString('utf8');
  assert.equal(
    crypto.createHash('sha256').update(bytes).digest('hex'),
    'c062b63921bf9a0d175a9770eaeaee647e65347bb3a1188285bc7c3706a1b773'
  );
  assert.deepEqual(bytes, immutableBytes);
  assert.match(policy, /Versión registration-v4/);
  assert.match(policy, /PageView/);
  assert.match(policy, /CompleteRegistration/);
  assert.match(policy, /Purchase/);
  assert.match(policy, /nunca enviamos a Meta los valores del formulario/);
  assert.match(policy, /we never send Meta form values/);
  assert.match(policy, /invitación, una cortesía o un acceso gratuito no bastan/);
  assert.match(policy, /an invitation, a complimentary place or free access is not enough/);
});
