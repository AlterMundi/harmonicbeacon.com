const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const homepage = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const virtualGatherings = homepage.match(/<section class="section" id="virtuales"[\s\S]*?<\/section>/)?.[0] || '';

test('homepage sends recurring weekend gathering CTAs to Live', () => {
  assert.match(virtualGatherings, /Virtual gatherings every weekend/);
  assert.match(virtualGatherings, /Encuentros virtuales todos los fines de semana/);
  assert.match(virtualGatherings, /href="https:\/\/live\.harmonicbeacon\.com\/"/);
  assert.doesNotMatch(virtualGatherings, /August 8 and 15|8 y 15 de agosto/);
  assert.doesNotMatch(virtualGatherings, /Registration open|Inscripción abierta/);
});

test('homepage hero Events CTA points to Live, not the editorial archive', () => {
  const hero = homepage.match(/<section class="hero"[\s\S]*?<\/section>/)?.[0] || '';
  assert.match(hero, /href="https:\/\/live\.harmonicbeacon\.com\/" class="btn btn-ghost"/);
  assert.doesNotMatch(hero, /href="\/eventos\/" class="btn btn-ghost"/);
});
