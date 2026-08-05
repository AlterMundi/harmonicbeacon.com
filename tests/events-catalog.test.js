const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'assets', 'events-catalog.js'), 'utf8');

function loadApi() {
  const document = {
    readyState: 'loading',
    addEventListener() {},
    getElementById() { return null; }
  };
  const window = {document};
  vm.runInNewContext(source, {
    window,
    document,
    Intl,
    Date,
    URL,
    URLSearchParams,
    AbortController,
    setTimeout,
    clearTimeout
  }, {filename: 'events-catalog.js'});
  return window.HBEventsCatalog;
}

function session(overrides = {}) {
  return {
    session_code: 'es-0830-cr',
    content_id: 'hmp-2026-08-08:es-0830-cr',
    title: 'Harmonic Myth Projection',
    registration_opens_at: '2026-08-01T00:00:00-06:00',
    registration_closes_at: '2026-08-08T08:30:00-06:00',
    starts_at: '2026-08-08T08:30:00-06:00',
    ends_at: '2026-08-08T11:30:00-06:00',
    timezone: 'America/Costa_Rica',
    locale: 'es',
    modality: 'ONLINE',
    amount_minor: 2000,
    currency: 'USD',
    availability: 'OPEN',
    ...overrides
  };
}

function catalog(sessions, eventCode = 'hmp-2026-08-08') {
  return {
    schema_version: 'public-commerce-catalog.response.v1',
    events: [{event_code: eventCode, sessions}]
  };
}

test('normalizes the exact public catalog and sorts sessions chronologically', () => {
  const api = loadApi();
  const normalized = api.normalizeCatalog(catalog([
    session({
      session_code: 'en-1400-cr',
      content_id: 'hmp-2026-08-08:en-1400-cr',
      locale: 'en',
      starts_at: '2026-08-08T14:00:00-06:00',
      registration_closes_at: '2026-08-08T14:00:00-06:00',
      ends_at: '2026-08-08T18:00:00-06:00',
      amount_minor: 5000
    }),
    session()
  ]));
  assert.deepEqual(Array.from(normalized, item => item.session_code), ['es-0830-cr', 'en-1400-cr']);
  assert.equal(normalized[0].event_code, 'hmp-2026-08-08');
});

test('fails closed on schema drift, malformed chronology, unsupported facts, and duplicates', () => {
  const api = loadApi();
  assert.throws(() => api.normalizeCatalog({...catalog([]), schema_version: 'v2'}), /invalid_catalog/);
  assert.throws(() => api.normalizeCatalog(catalog([session({currency: 'EUR'})])), /invalid_catalog/);
  assert.throws(() => api.normalizeCatalog(catalog([session({modality: 'IN_PERSON'})])), /invalid_catalog/);
  assert.throws(() => api.normalizeCatalog(catalog([session({availability: 'MAYBE'})])), /invalid_catalog/);
  assert.throws(() => api.normalizeCatalog(catalog([session({ends_at: '2026-08-08T07:00:00-06:00'})])), /invalid_catalog/);
  assert.throws(() => api.normalizeCatalog(catalog([session(), session()])), /duplicate_session/);
});

test('derives registration state from canonical availability and bounded timestamps', () => {
  const api = loadApi();
  const item = session();
  assert.equal(api.sessionState(item, Date.parse('2026-07-31T23:59:00-06:00')), 'PENDING');
  assert.equal(api.sessionState(item, Date.parse('2026-08-02T00:00:00-06:00')), 'OPEN');
  assert.equal(api.sessionState(item, Date.parse('2026-08-08T08:30:00-06:00')), 'CLOSED');
  assert.equal(api.sessionState({...item, availability: 'SOLD_OUT'}, Date.parse('2026-08-02T00:00:00-06:00')), 'SOLD_OUT');
  assert.equal(api.sessionState({...item, availability: 'CANCELLED'}, Date.parse('2026-08-02T00:00:00-06:00')), 'CANCELLED');
  assert.equal(api.sessionState(item, Date.parse('2026-08-08T11:30:00-06:00')), 'ENDED');
});

test('renders both language sessions without coupling product or price to page locale', () => {
  const api = loadApi();
  const sessions = api.normalizeCatalog(catalog([
    session(),
    session({
      session_code: 'en-1400-cr',
      content_id: 'hmp-2026-08-08:en-1400-cr',
      locale: 'en',
      starts_at: '2026-08-08T14:00:00-06:00',
      registration_closes_at: '2026-08-08T14:00:00-06:00',
      ends_at: '2026-08-08T18:00:00-06:00',
      amount_minor: 5000
    })
  ]));
  const markup = api.agendaMarkup(sessions, Date.parse('2026-08-05T09:00:00-06:00'));
  assert.equal((markup.match(/data-catalog-session=/g) || []).length, 2);
  assert.match(markup, /\$20/);
  assert.match(markup, /\$50/);
  assert.match(markup, /fecha=2026-08-08&amp;idioma=es/);
  assert.match(markup, /fecha=2026-08-08&amp;idioma=en/);
  assert.doesNotMatch(markup, /data-event-lang=/);
});

test('never renders an active registration link for pending, closed, sold-out, cancelled, or ended sessions', () => {
  const api = loadApi();
  const beforeOpen = api.agendaMarkup([session()], Date.parse('2026-07-31T00:00:00-06:00'));
  assert.doesNotMatch(beforeOpen, /data-registration-link/);
  for (const availability of ['CLOSED', 'SOLD_OUT', 'CANCELLED']) {
    const markup = api.agendaMarkup([session({availability})], Date.parse('2026-08-05T00:00:00-06:00'));
    assert.doesNotMatch(markup, /data-registration-link/);
    assert.match(markup, new RegExp(`data-availability="${availability}"`));
  }
  const ended = api.agendaMarkup([session({availability: 'ENDED'})], Date.parse('2026-08-09T00:00:00-06:00'));
  assert.doesNotMatch(ended, /2026-08-08|data-registration-link/);
  assert.match(ended, /data-catalog-state="EMPTY"/);
});

test('a new weekend replaces the old date without inherited links or metadata', () => {
  const api = loadApi();
  const next = session({
    session_code: 'es-next',
    content_id: 'hmp-2026-08-15:es-next',
    registration_opens_at: '2026-08-09T00:00:00-06:00',
    registration_closes_at: '2026-08-15T08:30:00-06:00',
    starts_at: '2026-08-15T08:30:00-06:00',
    ends_at: '2026-08-15T11:30:00-06:00'
  });
  const normalized = api.normalizeCatalog(catalog([next], 'hmp-2026-08-15'));
  const markup = api.agendaMarkup(normalized, Date.parse('2026-08-10T00:00:00-06:00'));
  assert.match(markup, /fecha=2026-08-15/);
  assert.match(markup, /hmp-2026-08-15:es-next/);
  assert.doesNotMatch(markup, /2026-08-08/);
});

test('escapes every server-controlled string before rendering it', () => {
  const api = loadApi();
  const malicious = session({
    title: '<img src=x onerror=alert(1)>',
    content_id: 'safe:id'
  });
  const markup = api.agendaMarkup([malicious], Date.parse('2026-08-05T00:00:00-06:00'));
  assert.doesNotMatch(markup, /<img/);
  assert.match(markup, /&lt;img src=x onerror=alert\(1\)&gt;/);
});

test('fetches without credentials and rejects non-JSON or invalid responses', async () => {
  const api = loadApi();
  let request;
  const valid = await api.fetchCatalog(async (url, options) => {
    request = {url, options};
    return {
      ok: true,
      headers: {get: () => 'application/json; charset=utf-8'},
      json: async () => catalog([session()])
    };
  });
  assert.equal(valid.length, 1);
  assert.equal(request.url, 'https://bot.harmonicbeacon.com/v1/commerce/catalog');
  assert.equal(request.options.credentials, 'omit');
  assert.equal(request.options.cache, 'no-store');
  await assert.rejects(() => api.fetchCatalog(async () => ({
    ok: true,
    headers: {get: () => 'text/html'},
    json: async () => catalog([])
  })), /invalid_catalog_content_type/);
});

test('network failure markup is honest and contains no stale registration link', () => {
  const api = loadApi();
  const markup = api.unavailableMarkup();
  assert.match(markup, /data-catalog-state="UNAVAILABLE"/);
  assert.match(markup, /información vencida/);
  assert.match(markup, /stale information/);
  assert.doesNotMatch(markup, /href=|checkout|2026-08-08/);
});

test('mount replaces the loading state with a fail-closed state after an HTTP failure', async () => {
  const api = loadApi();
  const attributes = new Map();
  const container = {
    innerHTML: '<a data-registration-link href="/stale">stale</a>',
    setAttribute(name, value) { attributes.set(name, value); },
    removeAttribute(name) { attributes.delete(name); },
    querySelectorAll() { return []; }
  };
  const root = {
    document: {getElementById: () => container},
    fetch: async () => ({ok: false, headers: {get: () => 'application/json'}}),
    location: {search: ''},
    setTimeout,
    clearTimeout
  };
  assert.equal(await api.mount(root, Date.parse('2026-08-05T00:00:00-06:00')), false);
  assert.match(container.innerHTML, /data-catalog-state="UNAVAILABLE"/);
  assert.doesNotMatch(container.innerHTML, /href=|\/stale/);
  assert.equal(attributes.has('aria-busy'), false);
});
