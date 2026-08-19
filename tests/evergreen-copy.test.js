const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const homepage = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const liveGatherings = homepage.match(/<div class="live-invite[\s\S]*?<\/div>\s*<div class="voices-head/)?.[0] || '';

test('homepage sends live gathering access to the Live app, never to the editorial journal', () => {
  assert.match(liveGatherings, /Free virtual and synchronous group experimentation events/);
  assert.match(liveGatherings, /Eventos gratuitos de experimentación grupal, virtual y sincrónica/);
  assert.match(liveGatherings, /En estos encuentros en vivo exploramos esta composición/);
  assert.match(liveGatherings, /href="https:\/\/live\.harmonicbeacon\.com\/"/);
  assert.doesNotMatch(liveGatherings, /href="\/eventos\/"/);
});

test('homepage hero has one primary action and a local orientation link', () => {
  const hero = homepage.match(/<section class="hero"[\s\S]*?<\/section>/)?.[0] || '';
  assert.match(hero, /href="https:\/\/listen\.harmonicbeacon\.com\/" class="btn btn-primary"/);
  assert.match(hero, /href="#programa" class="btn btn-ghost"/);
  assert.doesNotMatch(hero, /href="\/eventos\/"|href="https:\/\/live\.harmonicbeacon\.com\/"/);
});
