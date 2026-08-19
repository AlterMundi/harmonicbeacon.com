const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const cycle = fs.readFileSync('ciclo/index.html', 'utf8');
const email = fs.readFileSync('emails/del-otro-lado-del-umbral-2026/index.html', 'utf8');
const build = fs.readFileSync('build.js', 'utf8');

test('cycle exposes the four canonical 16:00 UTC starts', () => {
  for (const start of [
    '2026-08-22T16:00:00Z',
    '2026-08-29T16:00:00Z',
    '2026-09-05T16:00:00Z',
    '2026-09-12T16:00:00Z',
  ]) {
    assert.equal(cycle.split(start).length - 1, 1, `${start} should appear exactly once`);
  }
});

test('cycle offers automatic and manual timezone conversion', () => {
  assert.match(cycle, /id="timezone-select"/);
  assert.match(cycle, /Intl\.DateTimeFormat/);
  assert.match(cycle, /resolvedOptions\(\)\.timeZone/);
  assert.match(cycle, /America\/Santiago/);
  assert.match(cycle, /America\/Mexico_City/);
  assert.match(cycle, /Europe\/Madrid/);
  assert.match(cycle, /searchParams\.set\('tz'/);
});

test('cycle explains where access and reminders arrive', () => {
  assert.match(cycle, /https:\/\/live\.harmonicbeacon\.com\//);
  assert.match(cycle, /Ingresar a las salas/);
  assert.match(cycle, /canal de WhatsApp compartimos recordatorios y novedades del ciclo/);
  assert.match(cycle, /https:\/\/whatsapp\.com\/channel\/0029VbCuGepBFLgWCFA0BP34/);
});

test('email links to the future selector without embedding interactive controls', () => {
  assert.match(email, /https:\/\/harmonicbeacon\.com\/ciclo\//);
  assert.match(email, /https:\/\/live\.harmonicbeacon\.com\//);
  assert.match(email, /Ver el horario en mi país/);
  assert.doesNotMatch(email, /<select\b/i);
  assert.doesNotMatch(email, /<script\b/i);
});

test('review-only cycle and email stay outside the public build', () => {
  assert.doesNotMatch(build, /['"]ciclo['"]/);
  assert.doesNotMatch(build, /['"]emails['"]/);
});
