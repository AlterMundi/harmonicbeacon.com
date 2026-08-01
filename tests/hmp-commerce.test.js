const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function runtime(fetchImpl) {
  const values = new Map();
  const sessionStorage = {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
  const window = {
    crypto: {randomUUID: () => '10000000-0000-4000-8000-000000000001'},
    fetch: fetchImpl,
    sessionStorage
  };
  const context = vm.createContext({URL, window});
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'assets', 'hmp-commerce.js'),
    'utf8'
  );
  vm.runInContext(source, context);
  return {api: window.HMPCommerce, values};
}

const payload = {
  first_name: 'Alma',
  last_name: 'Pérez',
  email: 'alma@example.test',
  event_code: 'hmp-2026-08-01',
  session_code: 'es-0830-cr',
  locale: 'es',
  terms_version: 'registration-v3',
  terms_accepted: true
};

test('only accepts the configured HTTPS Ticket Tailor host', () => {
  const {api} = runtime(async () => {});
  assert.equal(api.validCheckoutUrl('https://tickets.harmonicbeacon.com/checkout/x'), true);
  assert.equal(api.validCheckoutUrl('https://tickets.harmonicbeacon.com.attacker.test/x'), false);
  assert.equal(api.validCheckoutUrl('http://tickets.harmonicbeacon.com/x'), false);
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
        commerce_status_token: 'st_v1_fixture',
        checkout: {
          widget_url: 'https://tickets.harmonicbeacon.com/checkout/x#p[meta_registration_context]=ctx_v1_fixture'
        }
      })
    };
  });
  const result = await api.register(payload);

  assert.equal(observed.url, 'https://bot.harmonicbeacon.com/v1/registrations');
  assert.equal(observed.options.mode, 'cors');
  assert.equal(observed.options.headers['Idempotency-Key'], '10000000-0000-4000-8000-000000000001');
  assert.equal(values.has('hb-registration-v3-idempotency-key'), false);
  assert.equal(api.readStatusContext().commerce_status_token, 'st_v1_fixture');
  assert.match(result.checkout.widget_url, /^https:\/\/tickets\.harmonicbeacon\.com\//);
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
    commerce_status_token: 'st_v1_fixture'
  });

  assert.equal(result.state, 'PAYMENT_CONFIRMED');
  assert.equal(observed.options.credentials, 'omit');
  assert.equal(observed.options.headers['X-Registration-Status-Token'], 'st_v1_fixture');
});
