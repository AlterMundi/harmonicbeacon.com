const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'assets', 'meta-pixel.js'), 'utf8');
const registration = {
  registrationId: '20000000-0000-4000-8000-000000000001',
  sessionCode: 'es-0830-cr'
};

function pixelRuntime(initialConsent = null, sessionValues = new Map(), localValues = new Map()) {
  if (initialConsent) localValues.set('hb-meta-consent', initialConsent);
  const listeners = new Map();
  const controls = new Map();
  const insertedScripts = [];
  const localStorage = {
    getItem: key => localValues.has(key) ? localValues.get(key) : null,
    setItem: (key, value) => localValues.set(key, String(value))
  };
  const sessionStorage = {
    getItem: key => sessionValues.has(key) ? sessionValues.get(key) : null,
    setItem: (key, value) => sessionValues.set(key, String(value))
  };
  const button = name => ({
    addEventListener: (type, callback) => controls.set(`${name}:${type}`, callback),
    focus() {}
  });
  const grant = button('grant');
  const deny = button('deny');
  const document = {
    body: {append() {}},
    cookie: '',
    documentElement: {lang: 'es'},
    head: {appendChild() {}},
    readyState: 'complete',
    querySelector: () => null,
    createElement: tag => {
      if (tag === 'section') {
        return {
          hidden: false,
          setAttribute() {},
          querySelector: selector => selector.includes('grant') ? grant : deny
        };
      }
      if (tag === 'button') {
        return {
          hidden: false,
          addEventListener: (type, callback) => controls.set(`settings:${type}`, callback)
        };
      }
      return {};
    },
    getElementsByTagName: () => [{
      parentNode: {insertBefore: script => insertedScripts.push(script)}
    }],
    addEventListener() {}
  };
  const window = {
    addEventListener: (type, callback) => listeners.set(type, callback),
    localStorage,
    sessionStorage
  };
  vm.runInNewContext(source, {
    document,
    localStorage,
    navigator: {language: 'es'},
    sessionStorage,
    window
  });
  const registrationHandler = listeners.get('hb:registration-completed');
  return {
    calls: () => window.fbq?.queue || [],
    controls,
    insertedScripts,
    sessionValues,
    triggerRegistration: detail => registrationHandler({detail}),
    window
  };
}

test('consent granted tracks CompleteRegistration once without PII', () => {
  const runtime = pixelRuntime('granted');

  runtime.triggerRegistration(registration);
  runtime.triggerRegistration(registration);

  const events = runtime.calls().filter(call => call[0] === 'track' && call[1] === 'CompleteRegistration');
  assert.equal(events.length, 1);
  assert.deepEqual(Array.from(events[0][2].content_ids), ['es-0830-cr']);
  assert.equal(events[0].length, 3);
  assert.equal(JSON.stringify(events[0]).includes('email'), false);
  assert.equal(JSON.stringify(events[0]).includes('Alma'), false);
});

test('PageView fires once per page load and is not repeated by consent re-grant', () => {
  const runtime = pixelRuntime('granted');

  let pageViews = runtime.calls().filter(call => call[0] === 'track' && call[1] === 'PageView');
  assert.equal(pageViews.length, 1);

  runtime.controls.get('deny:click')();
  runtime.controls.get('grant:click')();

  pageViews = runtime.calls().filter(call => call[0] === 'track' && call[1] === 'PageView');
  assert.equal(pageViews.length, 1);
});

test('refresh does not resend a completed registration in the same browser tab', () => {
  const sessionValues = new Map();
  const firstPage = pixelRuntime('granted', sessionValues);
  firstPage.triggerRegistration(registration);

  const refreshedPage = pixelRuntime('granted', sessionValues);
  refreshedPage.triggerRegistration(registration);

  const firstEvents = firstPage.calls().filter(call => call[0] === 'track' && call[1] === 'CompleteRegistration');
  const refreshedEvents = refreshedPage.calls().filter(call => call[0] === 'track' && call[1] === 'CompleteRegistration');
  assert.equal(firstEvents.length, 1);
  assert.equal(refreshedEvents.length, 0);
});

test('an idempotent response in another browser tab does not resend CompleteRegistration', () => {
  const localValues = new Map();
  const firstTab = pixelRuntime('granted', new Map(), localValues);
  firstTab.triggerRegistration(registration);

  const secondTab = pixelRuntime('granted', new Map(), localValues);
  secondTab.triggerRegistration(registration);

  const firstEvents = firstTab.calls().filter(call => call[0] === 'track' && call[1] === 'CompleteRegistration');
  const secondEvents = secondTab.calls().filter(call => call[0] === 'track' && call[1] === 'CompleteRegistration');
  assert.equal(firstEvents.length, 1);
  assert.equal(secondEvents.length, 0);
});

test('a legacy same-tab marker is migrated before another tab receives the response', () => {
  const key = `hb-meta-registration-${registration.registrationId}`;
  const localValues = new Map();
  const legacySessionValues = new Map([[key, 'sent']]);
  const migratedTab = pixelRuntime('granted', legacySessionValues, localValues);

  migratedTab.triggerRegistration(registration);
  assert.equal(localValues.get(key), 'sent');

  const secondTab = pixelRuntime('granted', new Map(), localValues);
  secondTab.triggerRegistration(registration);

  const migratedEvents = migratedTab.calls().filter(call => call[0] === 'track' && call[1] === 'CompleteRegistration');
  const secondEvents = secondTab.calls().filter(call => call[0] === 'track' && call[1] === 'CompleteRegistration');
  assert.equal(migratedEvents.length, 0);
  assert.equal(secondEvents.length, 0);
});

test('declined consent never loads Meta or tracks the registration', () => {
  const runtime = pixelRuntime('denied');

  runtime.triggerRegistration(registration);

  assert.equal(runtime.insertedScripts.length, 0);
  assert.equal(runtime.window.fbq, undefined);
  assert.equal(runtime.sessionValues.size, 0);
});

test('registration completed before consent is sent once after explicit grant', () => {
  const runtime = pixelRuntime();
  runtime.triggerRegistration(registration);

  assert.equal(runtime.window.fbq, undefined);
  runtime.controls.get('grant:click')();

  const events = runtime.calls().filter(call => call[0] === 'track' && call[1] === 'CompleteRegistration');
  assert.equal(events.length, 1);
});

test('consent can be revoked and granted again without reloading the page', () => {
  const runtime = pixelRuntime('granted');
  runtime.triggerRegistration(registration);

  runtime.controls.get('deny:click')();
  runtime.controls.get('grant:click')();

  const consentCalls = runtime.calls().filter(call => call[0] === 'consent');
  const events = runtime.calls().filter(call => call[0] === 'track' && call[1] === 'CompleteRegistration');
  assert.deepEqual(Array.from(consentCalls, call => call[1]), ['grant', 'revoke', 'grant']);
  assert.equal(events.length, 1);
});

test('a registration completed while consent is revoked is sent after a later grant', () => {
  const runtime = pixelRuntime('granted');
  runtime.controls.get('deny:click')();
  runtime.triggerRegistration(registration);

  let events = runtime.calls().filter(call => call[0] === 'track' && call[1] === 'CompleteRegistration');
  assert.equal(events.length, 0);

  runtime.controls.get('grant:click')();
  events = runtime.calls().filter(call => call[0] === 'track' && call[1] === 'CompleteRegistration');
  assert.equal(events.length, 1);
});

test('malformed identifiers never produce CompleteRegistration', () => {
  const runtime = pixelRuntime('granted');

  runtime.triggerRegistration({registrationId: 'not-a-uuid', sessionCode: 'es-0830-cr'});
  runtime.triggerRegistration({registrationId: registration.registrationId, sessionCode: '../private'});

  const events = runtime.calls().filter(call => call[0] === 'track' && call[1] === 'CompleteRegistration');
  assert.equal(events.length, 0);
});
