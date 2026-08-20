const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const why = fs.readFileSync(path.join(root, 'porque-funciona', 'index.html'), 'utf8');
const main = fs.readFileSync(path.join(root, 'assets', 'hb-main.js'), 'utf8');
const build = fs.readFileSync(path.join(root, 'build.js'), 'utf8');

test('the homepage keeps the former project catalogue paused and replaces it with an experiential narrative', () => {
  assert.match(home, /id="trabajo" hidden aria-hidden="true" data-public-state="paused"/);
  assert.match(home, /id="programa"/);
  assert.match(home, /3 h/);
  assert.match(home, /gratuitas por semana/);
  assert.match(home, /USD 5/);
  assert.match(home, /por mes para acceder a Listen sin límite de horas/);
  assert.doesNotMatch(home, /La armonía se vuelve una experiencia que podés habitar/);
  assert.doesNotMatch(home, /class="program-visual reveal"/);
  assert.doesNotMatch(home, /id="harmonicLissajous"/);
  assert.doesNotMatch(main, /drawHarmonicField/);
  assert.doesNotMatch(home, /beacon-instrumento\.jpg/);
  assert.match(home, /Te invito a escuchar/);
  assert.match(home, /elemento resonante excitado de forma continua/);
});

test('the homepage offers a selectable cloud of accounts without public identities', () => {
  const voices = home.match(/<div class="voice-cloud"[\s\S]*?<dialog class="voice-dialog"/)?.[0] || '';
  assert.equal((voices.match(/class="voice-chip reveal"/g) || []).length, 10);
  assert.equal((voices.match(/<template id="voice-/g) || []).length, 10);
  assert.doesNotMatch(voices, /Participante anónima|Anonymous participant/);
  assert.match(voices, /El sonido cobró otra dimensión/);
  assert.match(voices, /Realmente fue una catarsis de integración/);
  assert.match(voices, /Sentí que abrazaba a mi hijo/);
  assert.doesNotMatch(voices, /Doris|Argentina|México|Costa Rica/);
  assert.match(home, /id="voiceDialog"/);
  assert.match(main, /voiceDialog\.showModal/);
  assert.doesNotThrow(() => new vm.Script(main, {filename: 'hb-main.js'}));
});

test('the team is a compact profile list with one concrete contribution per person', () => {
  assert.match(home, /class="team-constellation"/);
  assert.equal((home.match(/class="portrait" data-initials=/g) || []).length, 7);
  assert.doesNotMatch(home, /class="member reveal"/);
  for (const name of ['Nicolás Echániz', 'Mariano Fernández Méndez', 'Julián De La Reta', 'Anabella Scigliano Mattiauda', 'Saira Asúa', 'Federico Bonino', 'John Sanborn']) {
    assert.match(home, new RegExp(name));
  }
  assert.equal((home.match(/class="story"/g) || []).length, 0);
  assert.match(home, /Desarrollo acústico y conceptual del Beacon/);
  assert.match(home, /Proyección del Mito Personal, psicodrama y facilitación/);
  assert.match(home, /Los agentes de IA forman parte del equipo de trabajo/);
});

test('the deep explanation remains its own page and labels knowledge boundaries', () => {
  assert.match(build, /'porque-funciona'/);
  assert.match(why, /Qué significa una proporción en el sonido/);
  assert.match(why, /La armonía natural y la música temperada responden a necesidades distintas/);
  assert.match(why, /Los grillos escuchan mientras cantan/);
  assert.match(why, /Su alcance es específico: describe el ajuste temporal en ciertos coros/);
  assert.match(why, /Harmonically Aware Technology · HAT/);
  assert.match(why, /Corazófono/);
  assert.match(why, /HarMoCAP/);
  assert.match(why, /PsicopoMPo/);
  assert.match(why, /No establecido/);
  assert.match(why, /data-tone-ratio="1\.25"/);
  assert.match(why, /Escuchamos polifónicamente/);
  assert.ok(why.indexOf('id="evidencia"') < why.indexOf('id="tecnologias"'));
});

test('the ecosystem preserves distinct genealogies and keeps HAT at its wider scale', () => {
  assert.match(home, /Estas sondas no nacieron como aplicaciones de una doctrina terminada/);
  assert.doesNotMatch(home, /La rama Beacon/);
  assert.doesNotMatch(home, /Una convergencia independiente/);
  assert.match(home, /Queremos crear tecnología armónicamente consciente/);
  assert.match(home, /proporciones, consonancia y los principios relacionales que desarrolla HIT/);
  assert.match(home, /Harmonic Beacon[\s\S]*Phideus[\s\S]*LibreAgro[\s\S]*Conectividad/);
  assert.match(home, /Suscribite a Listen · USD 5\/mes/);
  assert.doesNotMatch(home, /HAT[\s\S]{0,500}abre líneas como Corazófono/);
  assert.match(why, /HAT es un programa de investigación de AlterMundi/);
  assert.match(why, /incluido el dominio subsónico/);
});

test('the sound comparison controller compiles and remains user initiated', () => {
  const inlineScripts = [...why.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.ok(inlineScripts.length > 0);
  inlineScripts.forEach((match, index) => {
    assert.doesNotThrow(() => new vm.Script(match[1], {filename: `porque-funciona#${index + 1}`}));
  });
  assert.match(why, /button\.addEventListener\('click'/);
  assert.doesNotMatch(why, /autoplay/);
});

test('the ecosystem stays concise while the practice section explains experimentation', () => {
  assert.match(home, /Estas sondas no nacieron como aplicaciones de una doctrina terminada/);
  assert.match(home, /<b>Phideus<\/b>/);
  assert.match(home, /una experiencia pareidólica que cada persona organiza de manera singular/);
  assert.match(home, /surge al abrir ese campo a la experimentación/);
  assert.match(home, /búsqueda de visión y psicodrama/);
  assert.match(home, /Un campo para explorar la presencia/);
  assert.match(home, /Eventos gratuitos de experimentación grupal, virtual y sincrónica/);
  assert.doesNotMatch(home, /<video/);
  assert.doesNotMatch(home, /\/assets\/beacon-gente\.mp4/);
  assert.doesNotMatch(home, /class="ecosystem-path/);
});

test('the HIT book is presented as a real open publication, not a stray external link', () => {
  assert.match(home, /class="book-feature/);
  assert.match(home, /hit-foundations-book\.webp/);
  assert.match(home, /Hay un libro detrás de esta investigación/);
  assert.match(home, /Mariano Fernández Méndez y Nicolás Echániz/);
  assert.match(home, /ISBN 978-631-91761-0-0/);
  assert.match(home, /CC BY 4\.0/);
  assert.match(home, /versión Markdown preparada para lectura asistida por IA/);
});

test('the spectral visualization is explicitly educational and Nico music framing stays bounded', () => {
  assert.match(why, /harmonic-series-spectrogram\.png/);
  assert.match(why, /beacon-spatializer-interface\.webp/);
  assert.match(why, /fundamental de 40 Hz y despliega sus múltiplos enteros/);
  assert.match(why, /Es una síntesis didáctica, no una grabación ni una medición del Beacon/);
  assert.match(why, /La música construye un recorrido\. El Beacon sostiene un presente/);
  assert.match(why, /no la prueba de un menor gasto de energía en el cuerpo/);
});
