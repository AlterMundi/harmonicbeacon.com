const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const homepage = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const virtualGatherings = homepage.match(/<section class="section" id="virtuales"[\s\S]*?<\/section>/)?.[0] || '';

test('homepage promotes recurring weekend gatherings through the stable events URL', () => {
  assert.match(virtualGatherings, /Virtual gatherings every weekend/);
  assert.match(virtualGatherings, /Encuentros virtuales todos los fines de semana/);
  assert.match(virtualGatherings, /href="\/eventos\/#virtuales"/);
  assert.doesNotMatch(virtualGatherings, /August 8 and 15|8 y 15 de agosto/);
  assert.doesNotMatch(virtualGatherings, /Registration open|Inscripción abierta/);
});
