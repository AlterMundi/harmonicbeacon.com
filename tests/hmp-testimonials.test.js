const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const page = readFileSync('eventos/testimonios/index.html', 'utf8');
const app = readFileSync('eventos/testimonios/app.js', 'utf8');
const reviewData = readFileSync('eventos/testimonios/review-data.js', 'utf8');
const translationsSource = readFileSync('eventos/testimonios/translations.js', 'utf8');

test('testimonial review page uses canonical branding and remains clearly private', () => {
  assert.match(page, /<hb-global-nav><\/hb-global-nav>/);
  assert.match(page, /\/assets\/hb-brand\.css/);
  assert.match(page, /Vista privada de revisión · todavía no publicada/);
  assert.match(page, /Relatos y testimonios de la Proyección Armónica del Mito/);
  assert.match(page, /Todavía no están autorizados para publicarse en redes sociales ni para difusión pública/);
  assert.match(page, /Ilustraciones creadas con IA/);
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

test('English-language clips can be found and are labeled before playback', () => {
  assert.match(page, /data-filter="english"/);
  assert.match(app, /clip\.language === 'en'/);
  assert.match(app, /Audio en inglés/);
});

test('new cuts have a dedicated review filter and visible label', () => {
  assert.match(page, /data-filter="new"/);
  assert.match(app, /clip\.newCut/);
  assert.match(app, /Nuevo corte/);
});

test('every profile and clip has English editorial copy', () => {
  const context = { window: {} };
  vm.runInNewContext(reviewData, context);
  vm.runInNewContext(translationsSource, context);
  const data = context.window.HMP_REVIEW_DATA;
  const translations = context.window.HMP_TESTIMONIAL_TRANSLATIONS;

  assert.equal(data.length, 18);
  for (const person of data) {
    const profile = translations.profiles[person.name];
    assert.ok(profile, `missing profile translation for ${person.name}`);
    assert.ok(profile.introEn);
    assert.ok(profile.testimonyEs);
    assert.ok(profile.testimonyEn);
    for (const clip of person.clips) {
      const translatedClip = translations.clips[clip.code];
      assert.ok(translatedClip, `missing clip translation for ${clip.code}`);
      assert.ok(translatedClip.titleEn);
      assert.ok(translatedClip.summaryEn);
      assert.ok(translatedClip.quoteEn);
    }
  }
});

test('profile dialog identifies the AI image as inspired by the account', () => {
  assert.match(app, /person\.mythImage \|\| person\.avatar/);
  assert.match(app, /Imagen inspirada en su relato/);
  assert.match(app, /testimonyEn/);
  assert.match(page, /translations\.js/);
});

test('an open profile follows the global language switch', () => {
  assert.match(app, /activePerson/);
  assert.match(app, /if \(dialog\.open && activePerson\) openProfile\(activePerson\)/);
  assert.match(app, /if \(!dialog\.open\) dialog\.showModal\(\)/);
});
