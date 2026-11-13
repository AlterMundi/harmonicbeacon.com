const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const assetRoot = 'assets/brand/beacon-mark/';
const curve = file => read(file).match(/<path d="([^"]+)"/)[1];

test('all authored mark roles and favicon retain one selected centerline', () => {
  const geometry = JSON.parse(read(assetRoot + 'geometry.json'));
  assert.equal(geometry.source_image.sha256, '2483ec2ed9b9e9ebbbd354a846ca11b02eea1f9daf4aea5a01fb067cc2410790');
  assert.equal(geometry.original_input, 'ec8b8591-1e2e-4116-bc92-0b0d1a5aaa60');
  const master = curve(assetRoot + 'beacon-mark.svg');
  for (const role of Object.keys(geometry.palette)) {
    assert.equal(curve(assetRoot + `beacon-mark-${role}.svg`), master);
  }
  assert.equal(curve('favicon.svg'), master);
  assert.equal(curve(assetRoot + 'beacon-mark-small.svg'), master);
  assert.equal(curve(assetRoot + 'beacon-mark-symbol.svg'), master);
});

test('shared navigation preserves restrictive image CSP and uses the canonical path', () => {
  const nav = read('assets/hb-global-nav.js');
  assert.match(nav, /<svg class="mark"/);
  const exportedPath = curve(assetRoot + 'beacon-mark.svg');
  assert.ok(nav.includes('return \'' + exportedPath + '\';'));
  assert.doesNotMatch(nav, /<img class="mark"/);
  assert.doesNotMatch(nav, /Math\.cos\(angle/);
  assert.doesNotMatch(read('assets/hb-main.js'), /var MARK =/);
  for (const file of ['assets/hb-main.js', 'presentacion/index.html', 'seccionesvirtuales/index.html']) {
    assert.match(read(file), /\/assets\/brand\/beacon-mark\/beacon-mark-symbol\.svg#beacon-mark/);
  }
  assert.doesNotMatch(read('presentacion/index.html'), /function lissajousPath/);
});
