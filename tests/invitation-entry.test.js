import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const invitation = readFileSync(new URL('../invitacion/index.html', import.meta.url), 'utf8');

function archivedSnapshotAt(now) {
  const originalNow = Date.now;
  Date.now = () => now;
  try {
    return {
      timestamp: Date.now(),
      ended: /Este encuentro finalizó[\s\S]+This gathering has ended/.test(invitation),
      canSubmit: /<form\b|type="submit"|\/api\/auth\/ticket/.test(invitation),
      hasSessionRedirect: /live\.harmonicbeacon\.com|\/session\//.test(invitation),
    };
  } finally {
    Date.now = originalNow;
  }
}

test('the August 2 invitation is a bilingual archive with a current-schedule CTA', () => {
  assert.match(invitation, /<title>Encuentro finalizado · Harmonic Beacon<\/title>/);
  assert.match(invitation, /Archivo del encuentro virtual de Harmonic Beacon del domingo 2 de agosto de 2026/);
  assert.match(invitation, /<meta name="robots" content="noindex, follow">/);
  assert.match(invitation, /Este encuentro finalizó/);
  assert.match(invitation, /This gathering has ended/);
  assert.match(invitation, /Domingo 2 de agosto de 2026/);
  assert.match(invitation, /Sunday, August 2, 2026/);
  assert.match(invitation, /href="\/eventos\/#virtuales"/);
  assert.match(invitation, /Ver próximos encuentros/);
  assert.match(invitation, /See upcoming gatherings/);
});

test('the archived NICO100 campaign cannot submit or redirect to an expired room', () => {
  assert.match(invitation, /NICO100[\s\S]+está cerrada/);
  assert.doesNotMatch(invitation, /<form\b/);
  assert.doesNotMatch(invitation, /name="code"/);
  assert.doesNotMatch(invitation, /type="submit"/);
  assert.doesNotMatch(invitation, /\/api\/auth\/ticket/);
  assert.doesNotMatch(invitation, /live\.harmonicbeacon\.com/);
  assert.doesNotMatch(invitation, /\/session\//);
});

test('the permanent archive cannot reopen before, during, or after the old event', () => {
  const checkpoints = [
    Date.UTC(2026, 7, 2, 16, 49, 59),
    Date.UTC(2026, 7, 2, 16, 50, 0),
    Date.UTC(2026, 7, 2, 17, 0, 0),
    Date.UTC(2026, 7, 3, 17, 0, 0),
  ];

  for (const now of checkpoints) {
    assert.deepEqual(archivedSnapshotAt(now), {
      timestamp: now,
      ended: true,
      canSubmit: false,
      hasSessionRedirect: false,
    });
  }

  assert.doesNotMatch(invitation, /ACCESS_OPENS_AT|EVENT_STARTS_AT|setInterval\(updateAccess/);
});
