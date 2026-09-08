const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const page = readFileSync('eventos/testimonios/index.html', 'utf8');
const app = readFileSync('eventos/testimonios/app.js', 'utf8');

test('testimonial review page uses canonical branding and remains clearly private', () => {
  assert.match(page, /<hb-global-nav><\/hb-global-nav>/);
  assert.match(page, /\/assets\/hb-brand\.css/);
  assert.match(page, /Vista privada de revisión · todavía no publicada/);
  assert.match(page, /Retratos ilustrados con IA/);
  assert.ok(page.indexOf('/assets/hb-global-nav.js') < page.indexOf('/assets/hb-main.js'));
});

test('testimonial scaffold does not contain contact details or private source paths', () => {
  const trackedSource = `${page}\n${app}`;
  assert.doesNotMatch(trackedSource, /mailto:|tel:|@gmail\.com|CONSENTIMIENTO_PENDIENTE/);
  assert.doesNotMatch(trackedSource, /MATERIAL_PRIVADO|FRAGMENTOS_DESCRIPTIVOS|drive\.google\.com/);
});

test('profile experience is keyboard-friendly and groups clips by person', () => {
  assert.match(page, /<dialog class="profile-dialog"/);
  assert.match(page, /type="search"/);
  assert.match(app, /person\.clips\.slice\(\)\.sort/);
  assert.match(app, /dialog\.addEventListener\('cancel'/);
  assert.match(app, /video\.pause\(\)/);
});
