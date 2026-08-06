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

test('events page opens the confirmed August 8 and August 9 sessions', () => {
  const page = read('eventos/index.html');
  assert.match(page, /online todos los fines de semana/);
  assert.match(page, /online every weekend/);
  assert.match(page, /Guardá esta página para consultar la agenda vigente/);
  assert.equal((page.match(/data-event-date="2026-08-08"/g) || []).length, 1);
  assert.match(page, /2026-08-08T14:30:00Z/);
  assert.equal((page.match(/data-event-date="2026-08-09"/g) || []).length, 1);
  assert.match(page, /2026-08-09T22:00:00Z/);
  assert.match(page, /Domingo 9 de agosto|Sunday, August 9/);
  assert.doesNotMatch(page, /2026-08-08T20:00:00Z/);
  assert.doesNotMatch(page, /Sábado 8 de agosto · 14:00|Saturday, August 8 · 2:00 p\.m\./);
  assert.match(page, /Inscripción abierta/);
  assert.match(page, /Registration open/);
  assert.equal((page.match(/Inscripción abierta/g) || []).length, 2);
  assert.equal((page.match(/Registration open/g) || []).length, 2);
  assert.equal((page.match(/href="\/inscripcion\/\?fecha=2026-08-08&amp;idioma=/g) || []).length, 1);
  assert.match(page, /href="\/inscripcion\/\?fecha=2026-08-08&amp;idioma=es"/);
  assert.doesNotMatch(page, /2026-08-11/);
  assert.doesNotMatch(page, /Martes 11 de agosto|Tuesday, August 11/);
  assert.match(page, /href="\/inscripcion\/\?fecha=2026-08-09&amp;idioma=en"/);
  assert.doesNotMatch(page, /data-event-date="2026-08-09" aria-disabled="true"/);
  assert.doesNotMatch(page, /data-event-date="2026-08-15"/);
  assert.doesNotMatch(page, /Sábado 15 de agosto|Saturday, August 15/);
  assert.match(page, /fecha y horario por confirmar/);
  assert.match(page, /date and time to be confirmed/);
});

test('Annie editorial refinements stay aligned in Spanish and English', () => {
  const page = read('eventos/index.html');
  const pairedCopy = [
    [/detalles de acceso confirmados/, /confirmed time, language and access details/],
    [/las voces del grupo y una presencia compartida/, /group’s voices and a shared sense of presence/],
    [/narrativa personal de cada participante/, /through their personal narrative/],
    [/la práctica corporal, la escucha y el trabajo simbólico/, /embodied practice, listening and symbolic work/],
    [/un carácter íntimo y arraigado/, /an intimate, grounded quality/],
    [/encontrarse con el cuerpo en movimiento/, /meet the moving body/],
    [/sentadas oreja con oreja/, /sitting ear to ear/],
    [/vínculos que dieron forma al resto de nuestro recorrido/, /relationships that shaped the rest of our journey/],
    [/ofrecer una sesión al personal de enfermería y salud/, /hold a session for nursing and healthcare staff/],
    [/recibirnos y abrirle espacio a la propuesta/, /welcoming us and our proposal/]
  ];
  pairedCopy.forEach(([spanish, english]) => {
    assert.match(page, spanish);
    assert.match(page, english);
  });
  assert.equal(
    (page.match(/data-lang="es"/g) || []).length,
    (page.match(/data-lang="en"/g) || []).length
  );
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
  assert.match(page, /id="hb-meta-consent-mount"/);
  assert.ok(
    page.indexOf('name="registrationTermsAccepted"') <
      page.indexOf('id="hb-meta-consent-mount"') &&
      page.indexOf('id="hb-meta-consent-mount"') <
      page.indexOf('id="continueButton"')
  );
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
  assert.match(page, /id="paymentButton"[^>]+form="registrationForm"/);
  assert.equal((page.match(/data-session="/g) || []).length, 2);
  assert.match(page, /data-session="en"/);
  assert.match(page, /<b>ENGLISH<\/b>[\s\S]*?Sunday · Costa Rica time[\s\S]*?<b>16:00<\/b>[\s\S]*?US\$50/);
  assert.match(page, /id="changeDetails"/);
  assert.match(page, /classList\.add\('is-session-choice'\)/);
  assert.match(page, /\.booking-panel\.is-session-choice \.form-zone\{display:none\}/);
  assert.match(page, /\.booking-panel\.is-form-only \.session-zone\{display:none\}/);
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
  assert.match(page, /catalogEvent=window\.HMPCommerce\.CHECKOUTS\['hmp-'\+fecha\]/);
  assert.match(page, /registrationClosed'\)\.hidden=eventAvailable/);
  assert.match(page, /registrationFlow'\)\.hidden=!eventAvailable/);
  assert.match(page, /fecha=params\.get\('fecha'\)\|\|'2026-08-09'/);
  assert.match(page, /value="hmp-2026-08-09"/);
  assert.match(page, /DOMINGO 9 DE AGOSTO/);
  assert.match(page, /SUNDAY, AUGUST 9/);
  assert.match(page, /INSCRIPCIÓN Y PAGO/);
  assert.match(page, /REGISTRATION AND PAYMENT/);
  assert.doesNotMatch(page, /Registration will open soon|Las inscripciones abrirán próximamente/);
  assert.doesNotMatch(page, /MARTES 11 DE AGOSTO|TUESDAY, AUGUST 11/);
  assert.match(page, /catalogEvent\.options\?\.\[button\.dataset\.session\]/);
  assert.match(page, /option\.session_code/);
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
  assert.match(page, /window\.HMPCommerce\.commerceStatusV2\(context\)/);
  assert.ok(
    page.indexOf('window.HMPCommerce.commerceClaim(context, orderId)') <
      page.indexOf('window.HMPCommerce.commerceStatusV2(context)')
  );
  assert.match(page, /state === 'PAYMENT_CONFIRMED' \|\| state === 'ACCESS_READY'/);
  assert.match(page, /id="retryStatus"/);
  assert.match(page, /commerce_status_timeout/);
  assert.match(page, /STATUS_TIMEOUT/);
  assert.match(page, /retryableClaimErrors/);
  assert.match(page, /renderState\('REVIEW_REQUIRED'\);[\s\S]*?return;/);
});

test('Meta Purchase uses only canonical paid conversion facts', () => {
  const pixel = read('assets/meta-pixel.js');
  const confirmation = read('inscripcion/confirmacion/index.html');
  assert.match(pixel, /window\.fbq\('track', 'Purchase'/);
  assert.match(pixel, /value: normalized\.amountMinor \/ 100/);
  assert.match(pixel, /currency: normalized\.currency/);
  assert.match(pixel, /eventID: normalized\.conversionId/);
  assert.match(confirmation, /if \(result\.purchase\) announcePurchase\(result\.purchase\)/);
  assert.doesNotMatch(pixel, /englishSession \? 50 : 20/);
  assert.doesNotMatch(pixel, /tt_order_id/);
});

test('Meta CompleteRegistration is gated by the canonical registration event', () => {
  const commerce = read('assets/hmp-commerce.js');
  const pixel = read('assets/meta-pixel.js');
  assert.match(commerce, /result\?\.registration_status === 'REGISTERED'/);
  assert.match(commerce, /hb:registration-completed/);
  assert.match(pixel, /trackCompletedRegistration/);
  assert.match(pixel, /'CompleteRegistration'/);
  assert.doesNotMatch(pixel, /detail\.email|detail\.firstName|detail\.lastName/);
});

test('Meta consent stays in document flow and pending events expire after 24 hours', () => {
  const pixel = read('assets/meta-pixel.js');
  assert.doesNotMatch(pixel, /\.hb-consent\{position:fixed/);
  assert.match(pixel, /footer\.before\(panel\)/);
  assert.match(pixel, /const PENDING_MAX_AGE_MS = 24 \* 60 \* 60 \* 1000/);
  assert.match(pixel, /clearPendingEvents\(\)/);
  assert.match(pixel, /document\.querySelector\('#hb-meta-consent-mount'\)/);
  assert.match(pixel, /mount\.append\(panel\)/);
  assert.match(pixel, /data-hb-consent-toggle/);
  assert.match(pixel, /Aceptado: la medición de Meta está activada/);
  assert.match(pixel, /No aceptado: continuarás sin medición de Meta/);
  assert.doesNotMatch(pixel, /Revisar preferencias de privacidad/);
});

test('Meta commerce contracts have a valid committed manifest', () => {
  const directory = path.join(root, 'contracts', 'meta-commerce', 'v1');
  const lines = read('contracts/meta-commerce/v1/SHA256SUMS').trim().split('\n');
  assert.equal(lines.length, 5);
  for (const line of lines) {
    const [expected, fileName] = line.split(/\s+/);
    const bytes = fs.readFileSync(path.join(directory, fileName));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), expected, fileName);
  }
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
