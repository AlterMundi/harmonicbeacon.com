import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const home = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('the public homepage links visibly to the Listener app in both languages', () => {
  assert.match(
    home,
    /<a href="https:\/\/listen\.harmonicbeacon\.com\/" class="btn btn-primary">\s*<span data-lang="en">Listen to the Beacon<\/span><span data-lang="es">Escuchar el Beacon<\/span>/,
  );
  assert.match(home, /<section class="section program" id="programa">[\s\S]*?href="https:\/\/listen\.harmonicbeacon\.com\/"[\s\S]*?Listen or subscribe[\s\S]*?Escuchar o suscribirme/);
});
