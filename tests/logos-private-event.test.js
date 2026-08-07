const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'logos', 'index.html'), 'utf8');

test('LOGOS is an unindexed, exact private invitation', () => {
  assert.match(page, /name="robots" content="noindex, nofollow, noarchive"/);
  assert.match(page, /invitación privada para LOGOS/);
  assert.match(page, /Harmonic Myth Projection/);
  assert.match(page, /viernes 7 de agosto/);
  assert.match(page, /<strong>16:00<\/strong><span>Costa Rica<\/span>/);
  assert.match(page, /<strong>virtual<\/strong>/);
  assert.match(page, /<strong>sin costo<\/strong>/);
  assert.match(page, /1 entrada por persona/);
});

test('LOGOS enters the canonical Harmonic Beacon registration flow', () => {
  assert.match(page, /href="\/inscripcion\/\?fecha=logos-2026-08-07&amp;idioma=es"/);
  assert.match(page, /Completá la inscripción en Harmonic Beacon/);
  assert.match(page, /elegí LOGOS y confirmá tu correo/);
  assert.match(page, /volver a nuestra página de confirmación/);
  assert.match(page, /no se solicita tarjeta/);
  assert.doesNotMatch(page, /cdn\.tickettailor\.com|ticketTailorWidget|showCheckout/);
  assert.doesNotMatch(page, /checkout\/view-event|id="accessForm"|id="accessCode"/);
  assert.doesNotMatch(page, /LOGOS-[A-Z0-9]{8}/);
  assert.doesNotMatch(page, /LOGOS100/);
});

test('LOGOS has no duplicate inline checkout controller', () => {
  const scripts = [...page.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 0);
});

test('LOGOS remains absent from public navigation and event listings', () => {
  for (const relative of ['index.html', 'eventos/index.html']) {
    const publicPage = fs.readFileSync(path.join(root, relative), 'utf8');
    assert.doesNotMatch(publicPage, /href=["']\/logos\/?["']/);
    assert.doesNotMatch(publicPage, /hmp-logos-2026-08-07/);
  }
  const registration = fs.readFileSync(path.join(root, 'inscripcion', 'index.html'), 'utf8');
  assert.doesNotMatch(registration, /href=["']\/logos\/?["']/);
});

test('the production build includes the private LOGOS route', () => {
  const build = fs.readFileSync(path.join(root, 'build.js'), 'utf8');
  assert.match(build, /\['inscripcion', 'logos'\]/);
});
