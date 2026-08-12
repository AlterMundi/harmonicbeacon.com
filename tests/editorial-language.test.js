const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const hmp = fs.readFileSync(path.join(root, 'proyeccion-armonica-del-mito/index.html'), 'utf8');
const psicopompo = fs.readFileSync(path.join(root, 'psicopompo/index.html'), 'utf8');
const main = fs.readFileSync(path.join(root, 'assets/hb-main.js'), 'utf8');

test('uses canonical identities and keeps PMP genealogy independent', () => {
  const targetCopy = `${hmp}\n${psicopompo}`;
  assert.doesNotMatch(targetCopy, /Psychopomp|Psicopompo/);
  assert.match(targetCopy, /PsicopoMPo/);
  assert.match(hmp, /Personal Myth Projection/);
  assert.match(hmp, /Created by Julián De La Reta/);
  assert.match(hmp, /Harmonic Myth Projection brings two independent paths/);
});

test('describes Beacon as a relational harmonic field', () => {
  assert.match(hmp, /relationships among tones, harmonics, partials, resonances and interference/);
  assert.match(hmp, /relaciones entre tonos, armónicos, parciales, resonancias e interferencias/);
  assert.doesNotMatch(hmp, /guardrail|guardarraíl|sound bath|baño sonoro/i);
});

test('localizes HMP metadata, image alternatives and controls', () => {
  assert.match(hmp, /data-title-en=/);
  assert.match(hmp, /data-content-en=/);
  assert.match(hmp, /data-alt-en=/);
  assert.match(hmp, /data-aria-en=/);
  assert.match(main, /\[data-title-en\]\[data-title-es\]/);
  assert.match(main, /\[data-alt-en\]\[data-alt-es\]/);
  assert.match(main, /\[data-aria-en\]\[data-aria-es\]/);
});

test('keeps product copy separate from prototype internals', () => {
  const targetCopy = `${hmp}\n${psicopompo}`;
  assert.doesNotMatch(targetCopy, /adapter|backchannel|RAG|Gemma|Groq|tests automatizados|automated tests/i);
  assert.doesNotMatch(targetCopy, /Where it is today|Dónde está hoy|next step|próximo paso/i);
});
