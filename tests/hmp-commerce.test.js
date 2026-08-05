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
    CustomEvent: class CustomEvent {
      constructor(type, options = {}) {
        this.type = type;
        this.detail = options.detail;
      }
    },
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
  return {api: window.HMPCommerce, values, window};
}

function widgetDom() {
  const created = [];
  const document = {
    createElement(tagName) {
      const listeners = new Map();
      const element = {
        tagName,
        attributes: new Map(),
        children: [],
        append(...children) { this.children.push(...children); },
        addEventListener(type, listener) { listeners.set(type, listener); },
        setAttribute(name, value) { this.attributes.set(name, String(value)); },
        dispatch(type) { listeners.get(type)?.(); }
      };
      created.push(element);
      return element;
    }
  };
  const container = {
    children: [],
    replaceChildren(...children) { this.children = children; }
  };
  return {container, created, document};
}

const payload = {
  first_name: 'Alma',
  last_name: 'Pérez',
  email: 'alma@example.test',
  event_code: 'hmp-2026-08-08',
  session_code: 'es-0830-cr',
  locale: 'es',
  terms_version: 'registration-v4',
  terms_accepted: true
};
const checkoutContext = `ctx_v1_${'A'.repeat(43)}`;
const statusToken = `st_v1_${'S'.repeat(43)}`;
const checkout = {
  metadata_name: 'registration_context',
  metadata_value: checkoutContext,
  widget_url: `https://tickets.harmonicbeacon.com/checkout/view-event/id/8804105/chk/widget-fixture/?modal_widget=true&widget=true&preset_data=1#p[meta_registration_context]=${checkoutContext}`
};
const registrationId = '20000000-0000-4000-8000-000000000001';
const challengeId = '30000000-0000-4000-8000-000000000002';
const verification = {
  schema_version: 'registration.email-verification.v1',
  registration_id: registrationId,
  registration_status: 'EMAIL_VERIFICATION_REQUIRED',
  commerce_status_token: statusToken,
  email_verification: {
    challenge_id: challengeId,
    expires_at: '2026-08-04T23:00:00Z',
    masked_destination: 'a***@example.test'
  }
};

test('closed override rejects registration before any network request', async () => {
  let requested = false;
  const {api} = runtime(async () => { requested = true; }, {}, false);

  assert.equal(api.REGISTRATION_OPEN, false);
  assert.equal(api.supportedRegistration('hmp-2026-08-08', 'es-0830-cr'), false);
  await assert.rejects(api.register(payload), error => error.code === 'registration_unavailable');
  assert.equal(requested, false);
});

test('rejects common email domain typos before creating a registration', async () => {
  let requested = false;
  const {api} = runtime(async () => { requested = true; });

  assert.equal(api.suggestedEmailCorrection('AsuaSaira@Gmial.com'), 'asuasaira@gmail.com');
  assert.equal(api.suggestedEmailCorrection('alma@example.com'), null);
  await assert.rejects(
    api.register({...payload, email: 'asuasaira@gmial.com'}),
    error => error.code === 'email_domain_typo' &&
      error.suggestedEmail === 'asuasaira@gmail.com'
  );
  assert.equal(requested, false);
});

test('surfaces the backend email correction when server validation catches it', async () => {
  const {api} = runtime(async () => ({
    ok: false,
    status: 422,
    json: async () => ({
      detail: {
        code: 'email_domain_typo',
        suggested_email: 'alma@gmail.com'
      }
    })
  }));

  await assert.rejects(
    api.register({...payload, email: 'alma@gnail.com'}),
    error => error.code === 'email_domain_typo' && error.suggestedEmail === 'alma@gmail.com'
  );
});

test('surfaces an email domain that cannot receive mail', async () => {
  const {api} = runtime(async () => ({
    ok: false,
    status: 422,
    json: async () => ({detail: {code: 'email_domain_unreachable'}})
  }));

  await assert.rejects(
    api.register({...payload, email: 'alma@monicca.com'}),
    error => error.code === 'email_domain_unreachable'
  );
});

test('surfaces temporary DNS validation failure as retryable', async () => {
  const {api} = runtime(async () => ({
    ok: false,
    status: 503,
    json: async () => ({detail: {code: 'email_domain_validation_unavailable'}})
  }));

  await assert.rejects(
    api.register(payload),
    error => error.code === 'email_domain_validation_unavailable'
  );
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

test('mounts the validated checkout URL through the official inline widget', () => {
  const dom = widgetDom();
  const {api} = runtime(async () => {}, {document: dom.document});
  const script = api.mountCheckoutWidget(dom.container, payload, checkout);

  assert.equal(dom.container.children.length, 1);
  assert.equal(dom.container.children[0].className, 'tt-widget');
  assert.equal(script.src, 'https://cdn.tickettailor.com/js/widgets/min/widget.js');
  const mountedUrl = new URL(script.attributes.get('data-url'));
  assert.equal(mountedUrl.searchParams.get('preset_data'), '1');
  assert.equal(mountedUrl.searchParams.has('widget'), false);
  assert.equal(mountedUrl.searchParams.has('modal_widget'), false);
  assert.equal(script.attributes.get('data-type'), 'inline');
  assert.equal(script.attributes.get('data-inline-minimal'), 'true');
  assert.equal(script.attributes.get('data-inline-ref'), 'website_widget');
  const mountedHash = new URLSearchParams(mountedUrl.hash.slice(1));
  assert.equal(mountedHash.get('p[meta_registration_context]'), checkoutContext);
  assert.equal(mountedHash.get('p[first_name]'), payload.first_name);
  assert.equal(mountedHash.get('p[last_name]'), payload.last_name);
  assert.equal(mountedHash.get('p[email]'), payload.email);
  assert.equal(dom.created.some(element => element.tagName === 'a'), false);
});

test('fails closed when the widget script cannot load', () => {
  const dom = widgetDom();
  const {api} = runtime(async () => {}, {document: dom.document});
  let failed = false;
  const script = api.mountCheckoutWidget(
    dom.container,
    payload,
    checkout,
    () => { failed = true; }
  );

  script.dispatch('error');
  assert.equal(failed, true);
  assert.deepEqual(dom.container.children, []);
});

test('refuses to mount an unvalidated checkout URL', () => {
  const dom = widgetDom();
  const {api} = runtime(async () => {}, {document: dom.document});
  assert.throws(
    () => api.mountCheckoutWidget(dom.container, payload, {
      ...checkout,
      widget_url: checkout.widget_url.replace('tickets.harmonicbeacon.com', 'example.test')
    }),
    /invalid_checkout_widget_url/
  );
  assert.deepEqual(dom.container.children, []);
});

test('matches the stable registration catalog contract and rejects series ids', () => {
  const {api} = runtime(async () => {});
  const sessions = contract.events['hmp-2026-08-08'].sessions;

  assert.equal(api.CHECKOUTS['hmp-2026-08-08'].sessions['es-0830-cr'], sessions['es-0830-cr'].ticket_tailor_checkout_event_id);
  assert.equal(api.CHECKOUTS['hmp-2026-08-08'].sessions['en-1400-cr'], sessions['en-1400-cr'].ticket_tailor_checkout_event_id);
  const august11 = contract.events['hmp-2026-08-11'].sessions;
  assert.equal(api.CHECKOUTS['hmp-2026-08-11'].sessions['en-1600-cr'], august11['en-1600-cr'].ticket_tailor_checkout_event_id);
  assert.equal(api.validCheckoutUrl(checkout.widget_url.replace('8804105', '2334890'), payload, checkout), false);
});

test('supports only registration dates and sessions in the coordinated catalog', () => {
  const {api} = runtime(async () => {});
  assert.equal(api.registrationEvent('2026-08-08').date, '2026-08-08');
  assert.equal(api.registrationEvent('2026-08-11').date, '2026-08-11');
  assert.equal(api.registrationEvent('2026-08-01'), null);
  assert.equal(api.supportedRegistration('hmp-2026-08-08', 'es-0830-cr'), true);
  assert.equal(api.supportedRegistration('hmp-2026-08-08', 'unknown'), false);
  assert.equal(api.supportedRegistration('hmp-2026-08-11', 'en-1600-cr'), true);
  assert.equal(api.supportedRegistration('hmp-2026-08-11', 'es-0830-cr'), false);
  assert.equal(api.supportedRegistration('hmp-2026-08-01', 'es-0830-cr'), false);
});

test('keeps the idempotency key when registration outcome is unknown', async () => {
  const {api, values} = runtime(async () => { throw new Error('network'); });
  await assert.rejects(api.register(payload), /network/);
  assert.equal(
    values.get('hb-registration-v4-idempotency-key'),
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
        registration_id: registrationId,
        registration_status: 'REGISTERED',
        commerce_status_token: statusToken,
        checkout
      })
    };
  });
  const result = await api.register(payload);

  assert.equal(observed.url, 'https://bot.harmonicbeacon.com/v1/registrations');
  assert.equal(observed.options.mode, 'cors');
  assert.equal(observed.options.headers['Idempotency-Key'], '10000000-0000-4000-8000-000000000001');
  assert.equal(values.has('hb-registration-v4-idempotency-key'), false);
  assert.equal(api.readStatusContext().commerce_status_token, statusToken);
  assert.match(result.checkout.widget_url, /^https:\/\/tickets\.harmonicbeacon\.com\//);
});

test('announces CompleteRegistration only after a canonical REGISTERED response', async () => {
  const events = [];
  const {api, window} = runtime(async () => ({
    ok: true,
    json: async () => ({
      schema_version: 'registration.response.v1',
      registration_status: 'REGISTERED',
      registration_id: '20000000-0000-4000-8000-000000000001',
      commerce_status_token: statusToken,
      checkout
    })
  }), {
    dispatchEvent: event => { events.push(event); return true; }
  });

  await api.register(payload);

  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'hb:registration-completed');
  assert.deepEqual(
    JSON.parse(JSON.stringify(events[0].detail)),
    {
      registrationId: '20000000-0000-4000-8000-000000000001',
      eventCode: 'hmp-2026-08-08',
      sessionCode: 'es-0830-cr'
    }
  );
  assert.equal(window.__hbCompletedRegistration.registrationId, events[0].detail.registrationId);
});

test('an analytics listener failure never rejects a valid registration response', async () => {
  const {api} = runtime(async () => ({
    ok: true,
    json: async () => ({
      schema_version: 'registration.response.v1',
      registration_status: 'REGISTERED',
      registration_id: '20000000-0000-4000-8000-000000000001',
      commerce_status_token: statusToken,
      checkout
    })
  }), {
    dispatchEvent: () => { throw new Error('analytics unavailable'); }
  });

  const result = await api.register(payload);

  assert.equal(result.registration_status, 'REGISTERED');
  assert.equal(result.checkout.widget_url, checkout.widget_url);
});

test('an analytics listener failure never blocks the validated checkout widget', async () => {
  const dom = widgetDom();
  const {api} = runtime(async () => ({
    ok: true,
    json: async () => ({
      schema_version: 'registration.response.v1',
      registration_status: 'REGISTERED',
      registration_id: '20000000-0000-4000-8000-000000000001',
      commerce_status_token: statusToken,
      checkout
    })
  }), {
    document: dom.document,
    dispatchEvent: () => { throw new Error('analytics unavailable'); }
  });

  const result = await api.register(payload);
  const script = api.mountCheckoutWidget(dom.container, payload, result.checkout);
  const mountedUrl = new URL(script.attributes.get('data-url'));
  const mountedHash = new URLSearchParams(mountedUrl.hash.slice(1));

  assert.equal(dom.container.children.length, 1);
  assert.equal(script.src, 'https://cdn.tickettailor.com/js/widgets/min/widget.js');
  assert.equal(mountedHash.get('p[meta_registration_context]'), checkoutContext);
  assert.equal(mountedHash.get('p[first_name]'), payload.first_name);
  assert.equal(mountedHash.get('p[last_name]'), payload.last_name);
  assert.equal(mountedHash.get('p[email]'), payload.email);
});

test('rejects a response without canonical REGISTERED status and emits no event', async () => {
  const events = [];
  const {api} = runtime(async () => ({
    ok: true,
    json: async () => ({
      schema_version: 'registration.response.v1',
      registration_status: 'VERIFYING',
      registration_id: '20000000-0000-4000-8000-000000000001',
      commerce_status_token: statusToken,
      checkout
    })
  }), {
    dispatchEvent: event => { events.push(event); return true; }
  });

  await assert.rejects(api.register(payload), /invalid_registration_response/);
  assert.equal(events.length, 0);
});

test('rejects malformed registration ids and status tokens before storing context', async () => {
  const malformed = async () => ({
    ok: true,
    json: async () => ({
      schema_version: 'registration.response.v1',
      registration_id: '------------------------------------',
      registration_status: 'REGISTERED',
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

test('reads a valid v3 status context after the v4 cutover', () => {
  const {api, values} = runtime(async () => {});
  values.set('hb-registration-v3-status-context', JSON.stringify({
    schema_version: 'registration-status-context.v1',
    registration_id: '20000000-0000-4000-8000-000000000001',
    commerce_status_token: statusToken,
    locale: 'es',
    session_code: 'es-0830-cr'
  }));

  assert.equal(api.readStatusContext().commerce_status_token, statusToken);
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
    values.get('hb-registration-v4-idempotency-key'),
    '10000000-0000-4000-8000-000000000001'
  );
});

test('stores a pending email verification without exposing checkout', async () => {
  const events = [];
  const {api, values} = runtime(
    async () => ({ok: true, json: async () => verification}),
    {dispatchEvent: event => { events.push(event); return true; }}
  );

  const result = await api.register(payload);
  const stored = JSON.parse(values.get(api.STATUS_CONTEXT_KEY));

  assert.equal(result.registration_status, 'EMAIL_VERIFICATION_REQUIRED');
  assert.equal(result.checkout, undefined);
  assert.equal(stored.schema_version, 'registration-status-context.v2');
  assert.equal(stored.registration_id, registrationId);
  assert.deepEqual(stored.email_verification, verification.email_verification);
  assert.equal(stored.registration_payload.email, payload.email);
  assert.equal(events.length, 0);
});

test('verifies the code and stores the checkout context', async () => {
  let observed;
  const events = [];
  const completed = {
    schema_version: 'registration.response.v1',
    registration_id: registrationId,
    registration_status: 'REGISTERED',
    commerce_status_token: statusToken,
    checkout
  };
  const {api} = runtime(async (url, options) => {
    observed = {url, options};
    return {ok: true, json: async () => completed};
  }, {
    dispatchEvent: event => { events.push(event); return true; }
  });

  const result = await api.verifyEmail(verification, '123456', payload);
  const stored = api.readStatusContext();

  assert.equal(observed.url, `https://bot.harmonicbeacon.com/v1/registrations/${registrationId}/email-verification`);
  assert.equal(observed.options.headers['X-Registration-Status-Token'], statusToken);
  assert.deepEqual(JSON.parse(observed.options.body), {challenge_id: challengeId, code: '123456'});
  assert.equal(result.registration_status, 'REGISTERED');
  assert.equal(stored.checkout_context, checkoutContext);
  assert.equal(stored.email_verification, null);
  assert.equal(stored.registration_payload, null);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'hb:registration-completed');
  assert.equal(events[0].detail.eventCode, payload.event_code);
});

test('surfaces invalid verification code with remaining attempts', async () => {
  const {api} = runtime(async () => ({
    ok: false,
    status: 422,
    json: async () => ({
      detail: {code: 'email_verification_code_invalid', attempts_remaining: 3}
    })
  }));

  await assert.rejects(
    api.verifyEmail(verification, '999999', payload),
    error => error.code === 'email_verification_code_invalid' && error.attemptsRemaining === 3
  );
});

test('resends email verification with status token and replaces challenge', async () => {
  let observed;
  const resent = {
    ...verification,
    email_verification: {
      ...verification.email_verification,
      challenge_id: '40000000-0000-4000-8000-000000000004'
    }
  };
  const {api} = runtime(async (url, options) => {
    observed = {url, options};
    return {ok: true, json: async () => resent};
  });

  const result = await api.resendEmailVerification(verification, payload);

  assert.equal(observed.url, `https://bot.harmonicbeacon.com/v1/registrations/${registrationId}/email-verification/resend`);
  assert.equal(observed.options.headers['X-Registration-Status-Token'], statusToken);
  assert.equal(result.email_verification.challenge_id, resent.email_verification.challenge_id);
  assert.equal(api.readStatusContext().email_verification.challenge_id, resent.email_verification.challenge_id);
});

test('claims a returned order with the opaque checkout context', async () => {
  let observed;
  const context = {
    registration_id: registrationId,
    commerce_status_token: statusToken,
    checkout_context: checkoutContext
  };
  const {api} = runtime(async (url, options) => {
    observed = {url, options};
    return {
      ok: true,
      json: async () => ({
        schema_version: 'commerce-claim.response.v1',
        registration_id: registrationId,
        outcome: 'LINKED'
      })
    };
  });

  const result = await api.commerceClaim(context, '80659999');

  assert.equal(observed.url, `https://bot.harmonicbeacon.com/v1/registrations/${registrationId}/commerce-claim`);
  assert.equal(observed.options.method, 'PUT');
  assert.equal(observed.options.headers['X-Registration-Status-Token'], statusToken);
  assert.deepEqual(JSON.parse(observed.options.body), {
    external_order_id: '80659999',
    checkout_context: checkoutContext
  });
  assert.equal(result.outcome, 'LINKED');
});

test('refuses a browser claim without the checkout context', async () => {
  let requested = false;
  const {api} = runtime(async () => { requested = true; });

  await assert.rejects(
    api.commerceClaim({registration_id: registrationId, commerce_status_token: statusToken}, '80659999'),
    error => error.code === 'commerce_claim_input_invalid'
  );
  assert.equal(requested, false);
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

test('commerce status v2 accepts only the canonical paid purchase contract', async () => {
  let observed;
  const purchase = {
    kind: 'PAID_PURCHASE',
    conversion_id: `cnv_v1_${'A'.repeat(22)}`,
    amount_minor: 2000,
    currency: 'USD',
    event_code: 'hmp-2026-08-08',
    session_code: 'es-0830-cr',
    content_id: 'hmp-2026-08-08:es-0830-cr'
  };
  const {api} = runtime(async (url, options) => {
    observed = {url, options};
    return {
      ok: true,
      json: async () => ({
        schema_version: 'commerce-status.response.v2',
        registration_id: registrationId,
        state: 'PAYMENT_CONFIRMED',
        purchase
      })
    };
  });

  const result = await api.commerceStatusV2({
    registration_id: registrationId,
    commerce_status_token: statusToken
  });

  assert.equal(observed.url, `https://bot.harmonicbeacon.com/v2/registrations/${registrationId}/commerce-status`);
  assert.equal(observed.options.credentials, 'omit');
  assert.equal(observed.options.headers['X-Registration-Status-Token'], statusToken);
  assert.equal(result.purchase.conversion_id, purchase.conversion_id);
  assert.equal(api.validPaidPurchase(purchase), true);
});

test('commerce status v2 rejects malformed purchase facts and accepts purchase null', async () => {
  const responses = [
    {
      schema_version: 'commerce-status.response.v2',
      registration_id: registrationId,
      state: 'REVIEW_REQUIRED',
      purchase: null
    },
    {
      schema_version: 'commerce-status.response.v2',
      registration_id: registrationId,
      state: 'PAYMENT_CONFIRMED',
      purchase: {
        kind: 'PAID_PURCHASE',
        conversion_id: `cnv_v1_${'A'.repeat(22)}`,
        amount_minor: 2000,
        currency: 'EUR',
        event_code: 'hmp-2026-08-08',
        session_code: 'es-0830-cr',
        content_id: 'hmp-2026-08-08:es-0830-cr'
      }
    }
  ];
  const {api} = runtime(async () => ({ok: true, json: async () => responses.shift()}));
  const context = {registration_id: registrationId, commerce_status_token: statusToken};

  assert.equal((await api.commerceStatusV2(context)).purchase, null);
  await assert.rejects(api.commerceStatusV2(context), /invalid_commerce_status_response/);
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
