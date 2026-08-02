(() => {
  'use strict';

  const REGISTRATION_OPEN = false;
  const API_ORIGIN = 'https://bot.harmonicbeacon.com';
  const IDEMPOTENCY_KEY = 'hb-registration-v3-idempotency-key';
  const STATUS_CONTEXT_KEY = 'hb-registration-v3-status-context';
  const REGISTRATION_TIMEOUT_MS = 15000;
  const STATUS_TIMEOUT_MS = 8000;
  const REGISTRATION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const STATUS_TOKEN_PATTERN = /^st_v1_[A-Za-z0-9_-]{40,64}$/;
  const CHECKOUTS = Object.freeze({
    'hmp-2026-08-08': Object.freeze({
      date: '2026-08-08',
      label_es: 'sábado 8 de agosto',
      label_en: 'Saturday, August 8',
      sessions: Object.freeze({
        'es-0830-cr': '8804105',
        'en-1400-cr': '8804106'
      })
    })
  });

  function storage() {
    return window.sessionStorage;
  }

  function getOrCreateIdempotencyKey() {
    let key = storage().getItem(IDEMPOTENCY_KEY);
    if (!key) {
      key = window.crypto.randomUUID();
      storage().setItem(IDEMPOTENCY_KEY, key);
    }
    return key;
  }

  function registrationEvent(date) {
    return CHECKOUTS[`hmp-${date}`] || null;
  }

  function supportedRegistration(eventCode, sessionCode) {
    return REGISTRATION_OPEN && Boolean(CHECKOUTS[eventCode]?.sessions[sessionCode]);
  }

  function validWidgetPath(pathname, eventId) {
    const parts = pathname.split('/').filter(Boolean);
    return Boolean(
      parts.length === 6 &&
      parts[0] === 'checkout' &&
      (parts[1] === 'view-event' || parts[1] === 'new-session') &&
      parts[2] === 'id' &&
      parts[3] === eventId &&
      parts[4] === 'chk' &&
      /^[A-Za-z0-9_-]{2,128}$/.test(parts[5]) &&
      parts[5] !== 'REPLACE_WITH_EVENT_WIDGET_TOKEN'
    );
  }

  function validWidgetQuery(url) {
    const query = [...url.searchParams.entries()];
    const keys = new Set(query.map(([key]) => key));
    if (keys.size !== query.length) return false;
    if ([...keys].some(key => !['preset_data', 'widget', 'modal_widget', 'ref'].includes(key))) {
      return false;
    }
    if (url.searchParams.get('preset_data') !== '1') return false;
    for (const name of ['widget', 'modal_widget']) {
      if (url.searchParams.has(name) && url.searchParams.get(name) !== 'true') return false;
    }
    const ref = url.searchParams.get('ref');
    return ref === null || /^[A-Za-z0-9._-]{1,128}$/.test(ref);
  }

  function validCheckoutUrl(value, payload, checkout) {
    try {
      const url = new URL(value);
      const eventId = CHECKOUTS[payload?.event_code]?.sessions[payload?.session_code];
      const context = checkout?.metadata_value;
      return Boolean(
        eventId &&
        url.origin === 'https://tickets.harmonicbeacon.com' &&
        !url.username &&
        !url.password &&
        validWidgetPath(url.pathname, eventId) &&
        validWidgetQuery(url) &&
        checkout?.metadata_name === 'registration_context' &&
        typeof context === 'string' &&
        /^ctx_v1_[A-Za-z0-9_-]{40,64}$/.test(context) &&
        url.hash === `#p[meta_registration_context]=${context}`
      );
    } catch (_) {
      return false;
    }
  }

  async function fetchWithTimeout(url, options, timeoutMs, timeoutCode) {
    const controller = new window.AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await window.fetch(url, {...options, signal: controller.signal});
    } catch (error) {
      if (controller.signal.aborted) {
        const timeoutError = new Error(timeoutCode);
        timeoutError.code = timeoutCode;
        throw timeoutError;
      }
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function register(payload) {
    if (!supportedRegistration(payload?.event_code, payload?.session_code)) {
      const error = new Error('registration_unavailable');
      error.code = 'registration_unavailable';
      throw error;
    }
    const response = await fetchWithTimeout(`${API_ORIGIN}/v1/registrations`, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': getOrCreateIdempotencyKey()
      },
      body: JSON.stringify(payload)
    }, REGISTRATION_TIMEOUT_MS, 'registration_timeout');
    if (!response.ok) throw new Error(`registration_${response.status}`);
    const result = await response.json();
    if (
      result.schema_version !== 'registration.response.v1' ||
      !REGISTRATION_ID_PATTERN.test(result.registration_id || '') ||
      !STATUS_TOKEN_PATTERN.test(result.commerce_status_token || '') ||
      !validCheckoutUrl(result.checkout && result.checkout.widget_url, payload, result.checkout)
    ) {
      throw new Error('invalid_registration_response');
    }
    storage().setItem(STATUS_CONTEXT_KEY, JSON.stringify({
      schema_version: 'registration-status-context.v1',
      registration_id: result.registration_id,
      commerce_status_token: result.commerce_status_token,
      locale: payload.locale,
      session_code: payload.session_code
    }));
    storage().removeItem(IDEMPOTENCY_KEY);
    return result;
  }

  function readStatusContext() {
    try {
      const value = JSON.parse(storage().getItem(STATUS_CONTEXT_KEY) || 'null');
      return value &&
        value.schema_version === 'registration-status-context.v1' &&
        REGISTRATION_ID_PATTERN.test(value.registration_id || '') &&
        STATUS_TOKEN_PATTERN.test(value.commerce_status_token || '')
        ? value
        : null;
    } catch (_) {
      return null;
    }
  }

  async function commerceStatus(context) {
    const response = await fetchWithTimeout(
      `${API_ORIGIN}/v1/registrations/${encodeURIComponent(context.registration_id)}/commerce-status`,
      {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        headers: {'X-Registration-Status-Token': context.commerce_status_token}
      },
      STATUS_TIMEOUT_MS,
      'commerce_status_timeout'
    );
    if (!response.ok) throw new Error(`commerce_status_${response.status}`);
    const result = await response.json();
    if (result.schema_version !== 'commerce-status.response.v1') {
      throw new Error('invalid_commerce_status_response');
    }
    return result;
  }

  window.HMPCommerce = {
    API_ORIGIN,
    CHECKOUTS,
    REGISTRATION_OPEN,
    REGISTRATION_TIMEOUT_MS,
    STATUS_TIMEOUT_MS,
    STATUS_CONTEXT_KEY,
    commerceStatus,
    fetchWithTimeout,
    getOrCreateIdempotencyKey,
    readStatusContext,
    registrationEvent,
    register,
    supportedRegistration,
    validCheckoutUrl,
    validWidgetPath,
    validWidgetQuery
  };
})();
