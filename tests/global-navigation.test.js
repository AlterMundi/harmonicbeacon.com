import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const asset = readFileSync(new URL('../assets/hb-global-nav.js', import.meta.url), 'utf8');
const legacy = readFileSync(new URL('../assets/hb-main.js', import.meta.url), 'utf8');
const brandedPages = [
  '../index.html',
  '../eventos/index.html',
  '../el-beacon/index.html',
  '../porque-funciona/index.html',
  '../proyeccion-armonica-del-mito/index.html',
  '../app-beacon/index.html',
  '../bonobos/index.html',
  '../mythbot/index.html',
  '../psicopompo/index.html',
  '../umbral/index.html',
];

test('one canonical asset owns the exact cross-product destinations', () => {
  assert.match(asset, /https:\/\/live\.harmonicbeacon\.com/);
  assert.match(asset, /https:\/\/listen\.harmonicbeacon\.com/);
  assert.match(asset, /https:\/\/harmonicbeacon\.com/);
  assert.match(asset, /https:\/\/account\.harmonicbeacon\.com/);
  assert.match(asset, /https:\/\/account-staging\.harmonicbeacon\.com/);
  assert.match(asset, /en: 'Events', es: 'Eventos'/);
  assert.match(asset, /en: 'Listen', es: 'Escuchar'/);
  assert.match(asset, /en: 'News', es: 'Novedades'/);
  assert.match(asset, /customElements\.define\(ELEMENT_NAME/);
  assert.match(asset, /window\.self !== window\.top/);
  assert.match(asset, /get\('surface'\) === 'cockpit'/);
  assert.match(asset, /this\.hidden = true/);
  assert.match(asset, /new URL\('\/nav-slot', accountOrigin\(\)\)/);
  assert.match(asset, /new URL\('\/account', accountOrigin\(\)\)/);
  assert.match(asset, /referrerpolicy="no-referrer"/);
  assert.match(asset, /sandbox="allow-scripts allow-same-origin"/);
  assert.match(asset, /pointer-events:none/);
  assert.doesNotMatch(asset, /allow-top-navigation/);
  assert.doesNotMatch(asset, /Domain=\.harmonicbeacon\.com/);
  assert.equal(
    asset.match(/persistLanguage\(/g)?.length,
    3,
    'loading the header must not turn an inferred document language into a stored user preference',
  );
});

test('every canonical branded page loads global navigation before local chrome', () => {
  for (const relative of brandedPages) {
    const html = readFileSync(new URL(relative, import.meta.url), 'utf8');
    const globalIndex = html.indexOf('/assets/hb-global-nav.js');
    const localIndex = html.indexOf('/assets/hb-main.js');
    assert.ok(globalIndex >= 0, `${relative} loads global navigation`);
    assert.ok(localIndex > globalIndex, `${relative} loads global navigation first`);
  }
});

test('legacy chrome remains a fail-soft fallback with the same destinations', () => {
  assert.match(legacy, /if \(!document\.querySelector\('hb-global-nav'\)\)/);
  assert.match(legacy, /https:\/\/live\.harmonicbeacon\.com/);
  assert.match(legacy, /https:\/\/listen\.harmonicbeacon\.com/);
  assert.match(legacy, /en: 'News',\s+es: 'Novedades'/);
});
