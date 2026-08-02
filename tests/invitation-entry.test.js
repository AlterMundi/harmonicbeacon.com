import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const invitation = readFileSync(new URL('../invitacion/index.html', import.meta.url), 'utf8');

test('invitation collects identity and posts directly to the secure Beacon admission route', () => {
  assert.match(invitation, /<form[^>]+method="post"[^>]+action="https:\/\/live\.harmonicbeacon\.com\/api\/auth\/ticket"/);
  assert.match(invitation, /name="name"[^>]+autocomplete="name"[^>]+required/);
  assert.match(invitation, /name="email"[^>]+type="email"[^>]+autocomplete="email"[^>]+required/);
  assert.match(invitation, /name="code" value="NICO100"/);
  assert.match(invitation, /name="termsAccepted" value="accepted" required/);
  assert.match(invitation, />Entrar a la sala<\/button>/);
  assert.match(invitation, /termsAccepted && identityComplete && accessIsOpen/);
});

test('invitation no longer sends guests to the obsolete app or asks for an account', () => {
  assert.doesNotMatch(invitation, /beacon\.altermundi\.net/);
  assert.doesNotMatch(invitation, /iniciá sesión con tu cuenta/i);
  assert.doesNotMatch(invitation, /cuenta de la app/i);
  assert.match(invitation, /El ingreso estará habilitado diez minutos antes del inicio/);
  assert.match(invitation, /Entry will be enabled ten minutes before the start/);
});
