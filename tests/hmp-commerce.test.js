const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const contract = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', 'contracts', 'registration-catalog', 'v1', 'catalog.fixture.json'),
  'utf8'
));

function runtime(fetchImpl, overrides = {}, registrationOpen = true) {
  const values = new Map();
  const sessionStorage = {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
  const window = {
    AbortController,
    clearTimeout,
    crypto: {randomUUID: () => '10000000-0000-4000-8000-000000000001'},
    fetch: fetchImpl,
    sessionStorage,
    setTimeout,
    ...overrides
  };
  const context = vm.createContext({URL, window});
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'assets', 'hmp-commerce.js'),
    'utf8'
  );
  const evaluatedSource = registrationOpen
    ? source
    : source.replace('const REGISTRATION_OPEN = true;', 'const REGISTRATION_OPEN = false;');
  vm.runInContext(evaluatedSource, context);
  return {api: window.HMPCommerce, values};
}

const payload = {
  first_name: 'Alma',
  last_name: 'Pérez',
  email: 'alma@example.test',
  event_code: 'hmp-2026-08-08',
  session_code: 'es-0830-cr',
  locale: 'es',
  terms_version: 'registration-v3',
  terms_accepted: true
};
const checkoutContext = `ctx_v1_${'A'.repeat(43)}`;
const statusToken = `st_v1_${'S'.repeat(43)}`;
const checkout = {
  metadata_name: 'registration_context',
  metadata_value: checkoutContext,
  widget_url: `https://tickets.harmonicbeacon.com/checkout/view-event/id/8804105/chk/widget-fixture/?modal_widget=true&widget=true&preset_data=1#p[meta_registration_context]=${checkoutContext}`
};

test('closed override rejects registration before any network request', async () => {
  let requested = false;
  const {api} = runtime(async () => { requested = true; }, {}, false);

  assert.equal(api.REGISTRATION_OPEN, false);
  assert.equal(api.supportedRegistration('hmp-2026-08-08', 'es-0830-cr'), false);
  await assert.rejects(api.register(payload), error => error.code === 'registration_unavailable');
  assert.equal(requested, false);
});

test('only accepts the exact configured Ticket Tailor widget for the selected session', () => {
  const {api} = runtime(async () => {});
  assert.equal(api.validCheckoutUrl(checkout.widget_url, payload, checkout), true);
  assert.equal(api.validCheckoutUrl(checkout.widget_url.replace('8804105', '8804106'), payload, checkout), false);
  assert.equal(api.validCheckoutUrl(checkout.widget_url.replace('/checkout/view-event/id/8804105/chk/widget-fixture/', '/checkout/x/'), payload, checkout), false);
  assert.equal(api.validCheckoutUrl(checkout.widget_url.replace('/chk/widget-fixture', ''), payload, checkout), false);
  assert.equal(api.validCheckoutUrl(checkout.widget_url.replace('widget-fixture', 'REPLACE_WITH_EVENT_WIDGET_TOKEN'), payload, checkout), false);
  assert.equal(api.validCheckoutUrl(checkout.widget_url.replace('tickets.harmonicbeacon.com', 'tickets.harmonicbeacon.com:8443'), payload, checkout), false);
  assert.equal(api.validCheckoutUrl(checkout.widget_url.replace('tickets.harmonicbeacon.com', 'tickets.harmonicbeacon.com.attacker.test'), payload, checkout), false);
  assert.equal(api.validCheckoutUrl(checkout.widget_url.replace('preset_data=1', 'preset_data=1&redirect=evil'), payload, checkout), false);
  assert.equal(api.validCheckoutUrl(checkout.widget_url.replace('preset_data=1', 'preset_data=1&preset_data=0'), payload, checkout), false);
  assert.equal(api.validCheckoutUrl(checkout.widget_url.replace('widget=true', 'widget=false'), payload, checkout), false);
  assert.equal(api.validCheckoutUrl(checkout.widget_url, payload, {...checkout, metadata_value: `${checkoutContext}x`}), false);
});

test('accepts both official event-specific widget path variants', () => {
  const {api} = runtime(async () => {});
  const newSession = {
    ...checkout,
    widget_url: `https://tickets.harmonicbeacon.com/checkout/new-session/id/8804105/chk/widget-fixture/?ref=website_widget&preset_data=1#p[meta_registration_context]=${checkoutContext}`
  };
  assert.equal(api.validCheckoutUrl(newSession.widget_url, payload, newSession), true);
});

test('matches the stable registration catalog contract and rejects series ids', () => {
  const {api} = runtime(async () => {});
  const sessions = contract.events['hmp-2026-08-08'].sessions;

  assert.equal(api.CHECKOUTS['hmp-2026-08-08'].sessions['es-0830-cr'], sessions['es-0830-cr'].ticket_tailor_checkout_event_id);
  assert.equal(api.CHECKOUTS['hmp-2026-08-08'].sessions['en-1400-cr'], sessions['en-1400-cr'].ticket_tailor_checkout_event_id);
  assert.equal(api.validCheckoutUrl(checkout.widget_url.replace('8804105', '2334890'), payload, checkout), false);
});

test('supports only registration dates and sessions in the coordinated catalog', () => {
  const {api} = runtime(async () => {});
  assert.equal(api.registrationEvent('2026-08-08').date, '2026-08-08');
  assert.equal(api.registrationEvent('2026-08-01'), null);
  assert.equal(api.supportedRegistration('hmp-2026-08-08', 'es-0830-cr'), true);
  assert.equal(api.supportedRegistration('hmp-2026-08-08', 'unknown'), false);
  assert.equal(api.supportedRegistration('hmp-2026-08-01', 'es-0830-cr'), false);
});

test('keeps the idempotency key when registration outcome is unknown', async () => {
  const {api, values} = runtime(async () => { throw new Error('network'); });
  await assert.rejects(api.register(payload), /network/);
  assert.equal(
    values.get('hb-registration-v3-idempotency-key'),
    '10000000-0000-4000-8000-000000000001'
  );
});

test('stores a separate status token only after a valid registration response', async () => {
  let observed;
  const {api, values} = runtime(async (url, options) => {
    observed = {url, options};
    return {
      ok: true,
      json: async () => ({
        schema_version: 'registration.response.v1',
        registration_id: '20000000-0000-4000-8000-000000000001',
        commerce_status_token: statusToken,
        checkout
      })
    };
  });
  const result = await api.register(payload);

  assert.equal(observed.url, 'https://bot.harmonicbeacon.com/v1/registrations');
  assert.equal(observed.options.mode, 'cors');
  assert.equal(observed.options.headers['Idempotency-Key'], '10000000-0000-4000-8000-000000000001');
  assert.equal(values.has('hb-registration-v3-idempotency-key'), false);
  assert.equal(api.readStatusContext().commerce_status_token, statusToken);
  assert.match(result.checkout.widget_url, /^https:\/\/tickets\.harmonicbeacon\.com\//);
});

test('rejects malformed registration ids and status tokens before storing context', async () => {
  const malformed = async () => ({
    ok: true,
    json: async () => ({
      schema_version: 'registration.response.v1',
      registration_id: '------------------------------------',
      commerce_status_token: 'not-a-status-token',
      checkout
    })
  });
  const {api, values} = runtime(malformed);

  await assert.rejects(api.register(payload), /invalid_registration_response/);
  assert.equal(values.has(api.STATUS_CONTEXT_KEY), false);
});

test('ignores malformed status context from session storage', () => {
  const {api, values} = runtime(async () => {});
  values.set(api.STATUS_CONTEXT_KEY, JSON.stringify({
    schema_version: 'registration-status-context.v1',
    registration_id: '------------------------------------',
    commerce_status_token: 'not-a-status-token'
  }));

  assert.equal(api.readStatusContext(), null);
});

test('aborts a stalled registration and keeps its idempotency key for a safe retry', async () => {
  const stalledFetch = (_url, options) => new Promise((_resolve, reject) => {
    if (options.signal.aborted) return reject(new Error('aborted'));
    options.signal.addEventListener('abort', () => reject(new Error('aborted')), {once: true});
  });
  const {api, values} = runtime(stalledFetch, {
    setTimeout: callback => { callback(); return 1; },
    clearTimeout: () => {}
  });

  await assert.rejects(api.register(payload), error => error.code === 'registration_timeout');
  assert.equal(
    values.get('hb-registration-v3-idempotency-key'),
    '10000000-0000-4000-8000-000000000001'
  );
});

test('commerce status uses the private token and no credentials', async () => {
  let observed;
  const {api} = runtime(async (url, options) => {
    observed = {url, options};
    return {
      ok: true,
      json: async () => ({
        schema_version: 'commerce-status.response.v1',
        state: 'PAYMENT_CONFIRMED'
      })
    };
  });
  const result = await api.commerceStatus({
    registration_id: '20000000-0000-4000-8000-000000000001',
    commerce_status_token: statusToken
  });

  assert.equal(result.state, 'PAYMENT_CONFIRMED');
  assert.equal(observed.options.credentials, 'omit');
  assert.equal(observed.options.headers['X-Registration-Status-Token'], statusToken);
});

test('aborts a stalled commerce status request with a distinct error code', async () => {
  const stalledFetch = (_url, options) => new Promise((_resolve, reject) => {
    if (options.signal.aborted) return reject(new Error('aborted'));
    options.signal.addEventListener('abort', () => reject(new Error('aborted')), {once: true});
  });
  const {api} = runtime(stalledFetch, {
    setTimeout: callback => { callback(); return 1; },
    clearTimeout: () => {}
  });

  await assert.rejects(api.commerceStatus({
    registration_id: '20000000-0000-4000-8000-000000000001',
    commerce_status_token: statusToken
  }), error => error.code === 'commerce_status_timeout');
});
