const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const page = readFileSync('eventos/testimonios/index.html', 'utf8');
const app = readFileSync('eventos/testimonios/app.js', 'utf8');
const publicSource = `${page}\n${app}`;

test('Mythbot gallery explains the artwork and remains a private review', () => {
  assert.match(page, /Galería de arte del Mythbot/);
  assert.match(page, /El Mythbot escucha los relatos/);
  assert.match(page, /No son registros documentales ni reproducciones literales/);
  assert.match(page, /Las obras se presentan sin nombres/);
  assert.match(page, /Vista privada de revisión · todavía no publicada/);
  assert.match(page, /name="robots" content="noindex,nofollow,noarchive"/);
});

test('gallery uses canonical branding and bilingual copy', () => {
  assert.match(page, /<hb-global-nav><\/hb-global-nav>/);
  assert.match(page, /\/assets\/hb-brand\.css/);
  assert.match(page, /The Mythbot art gallery/);
  assert.match(page, /The works are presented without names/);
  assert.ok(page.indexOf('/assets/hb-global-nav.js') < page.indexOf('/assets/hb-main.js'));
});

test('public scaffold contains no testimonial identity or playback UI', () => {
  assert.doesNotMatch(publicSource, /person\.name|profile|avatar|testimony|blockquote|<video|mailto:|tel:/i);
  assert.doesNotMatch(publicSource, /Buscar una persona|Find a person|Todas las voces|All voices/);
  assert.doesNotMatch(page, /translations\.js/);
});

test('each work is rendered with only its image and localized date', () => {
  assert.match(app, /window\.HMP_GALLERY_DATA/);
  assert.match(app, /new Intl\.DateTimeFormat/);
  assert.match(app, /button\.appendChild\(frame\)/);
  assert.match(app, /button\.appendChild\(date\)/);
  assert.doesNotMatch(app, /work\.name|work\.title|work\.quote|work\.summary/);
});

test('gallery is chronological and images load lazily', () => {
  assert.match(app, /a\.date\.localeCompare\(b\.date\)/);
  assert.match(app, /image\.loading = 'lazy'/);
  assert.match(app, /image\.decoding = 'async'/);
});

test('artwork lightbox is keyboard-friendly and language-aware', () => {
  assert.match(page, /<dialog class="lightbox"/);
  assert.match(app, /lightbox\.showModal\(\)/);
  assert.match(app, /lightbox\.addEventListener\('cancel'/);
  assert.match(app, /new MutationObserver\(render\)/);
});
