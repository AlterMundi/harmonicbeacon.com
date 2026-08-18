const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const page = fs.readFileSync(path.join(__dirname, '..', 'eventos', 'index.html'), 'utf8');
const build = fs.readFileSync(path.join(__dirname, '..', 'build.js'), 'utf8');
const cycle = page.match(/<article class="ev-feat reveal" id="ciclo-umbral-2026"[\s\S]*?<\/article>/)?.[0] || '';

test('publishes the complete free Spanish four-Saturday cycle', () => {
  assert.match(cycle, /ciclo de eventos de Proyección Armónica del Mito/);
  assert.match(cycle, /Gratis/);
  assert.match(cycle, /Virtual · sincrónico · en castellano/);
  for (const date of ['2026-08-22', '2026-08-29', '2026-09-05', '2026-09-12']) {
    assert.match(cycle, new RegExp(`data-event-date="${date}"`));
  }
  assert.equal((cycle.match(/Ingresar al evento/g) || []).length, 4);
});

test('keeps context and access separate and removes registration commerce', () => {
  assert.match(cycle, /href="\/proyeccion-armonica-del-mito\/"/);
  assert.match(cycle, /Leer más/);
  assert.match(cycle, /Beacon Account/);
  assert.doesNotMatch(cycle, /inscrip|ticket.?tailor|comprar|tienda/i);
});

test('uses Saturday September 12 and never publishes the mistaken Sunday date', () => {
  assert.match(cycle, /12 de septiembre de 2026/);
  assert.doesNotMatch(cycle, /13 de septiembre|2026-09-13/);
});

test('ships both the event page and its read-more destination', () => {
  assert.match(build, /'eventos'/);
  assert.match(build, /'proyeccion-armonica-del-mito'/);
});
