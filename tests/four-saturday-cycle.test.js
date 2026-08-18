const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const page = fs.readFileSync(path.join(__dirname, '..', 'eventos', 'index.html'), 'utf8');
const build = fs.readFileSync(path.join(__dirname, '..', 'build.js'), 'utf8');

test('presents news as the informal Harmonic Beacon journal', () => {
  assert.match(page, /<span data-lang="es">Novedades<\/span>/);
  assert.match(page, /Esta es nuestra bitácora informal/);
  assert.match(page, /This is our informal journal/);
});

test('removes the four-Saturday event promotion from the journal', () => {
  assert.doesNotMatch(page, /ciclo-umbral-2026/);
  assert.doesNotMatch(page, /Agenda y novedades/);
  assert.doesNotMatch(page, /Ingresar al evento/);
  assert.doesNotMatch(page, /Beacon Account/);
});

test('ships the news page', () => {
  assert.match(build, /'eventos'/);
});
