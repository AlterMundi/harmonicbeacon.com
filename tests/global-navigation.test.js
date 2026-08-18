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
  assert.match(asset, /https:\/\/account-staging\.harmonicbeacon\.com/);
  assert.match(asset, /https:\/\/live-staging\.harmonicbeacon\.com/);
  assert.match(asset, /host === 'account-staging\.harmonicbeacon\.com'/);
  assert.match(asset, /en: 'Events', es: 'Eventos'/);
  assert.match(asset, /en: 'Listen', es: 'Escuchar'/);
  assert.match(asset, /en: 'News', es: 'Novedades'/);
  assert.match(asset, /customElements\.define\(ELEMENT_NAME/);
  assert.match(asset, /window\.self !== window\.top/);
  assert.match(asset, /get\('surface'\) === 'cockpit'/);
  assert.match(asset, /this\.hidden = true/);
  assert.match(asset, /new URL\('\/account', ACCOUNT_STAGING_ORIGIN\)/);
  assert.match(asset, /function accountControlAvailable\(\)/);
  assert.doesNotMatch(asset, /https:\/\/account\.harmonicbeacon\.com/);
  assert.match(asset, /return \['data-account-signed-in'\]/);
  assert.match(asset, /this\.hasAttribute\('data-account-signed-in'\)/);
  assert.match(asset, /User menu, signed in/);
  assert.match(asset, /Menú de usuario, sesión iniciada/);
  assert.match(asset, /account-trigger\.signed-in::after/);
  assert.doesNotMatch(asset, /document\.cookie[^\n]*account/i);
  assert.doesNotMatch(asset, /fetch\(/);
  assert.match(asset, /class="account-trigger/);
  assert.match(asset, /beaconMarkPath\(\)/);
  assert.match(asset, /Math\.cos\(angle \* 3\)/);
  assert.match(asset, /Math\.sin\(angle \* 2\)/);
  assert.match(asset, /index <= 280/);
  assert.match(asset, /<svg class="mark"/);
  assert.match(asset, /<circle cx="12" cy="8" r="3\.25">/);
  assert.match(asset, /aria-haspopup="menu"/);
  assert.match(asset, /class="account-menu"/);
  assert.match(asset, /role="menuitem"/);
  assert.match(asset, /accountMenu\.hidden = !open/);
  assert.match(asset, /event\.key !== 'ArrowDown'/);
  assert.doesNotMatch(asset, /class="account-link"/);
  assert.doesNotMatch(asset, /<iframe/);
  assert.doesNotMatch(asset, /\/favicon\.svg/);
  assert.doesNotMatch(asset, /allow-same-origin/);
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

test('keeps the 44px mobile menu reachable across narrow phone viewports', () => {
  assert.match(asset, /@media \(max-width:365px\) \{ \.wordmark \{ display:none; \} \}/);
  assert.match(asset, /\.toggle \{ display:none; width:44px; height:44px;/);
  assert.ok(asset.includes('.toggle { display:block; }'));
});

test('legacy chrome remains a fail-soft fallback with the same destinations', () => {
  assert.match(legacy, /if \(!document\.querySelector\('hb-global-nav'\)\)/);
  assert.match(legacy, /https:\/\/live\.harmonicbeacon\.com/);
  assert.match(legacy, /https:\/\/listen\.harmonicbeacon\.com/);
  assert.match(legacy, /en: 'News',\s+es: 'Novedades'/);
});
