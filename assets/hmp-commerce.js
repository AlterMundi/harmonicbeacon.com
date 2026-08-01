(() => {
  'use strict';

  const API_ORIGIN = 'https://bot.harmonicbeacon.com';
  const IDEMPOTENCY_KEY = 'hb-registration-v3-idempotency-key';
  const STATUS_CONTEXT_KEY = 'hb-registration-v3-status-context';

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

  function validCheckoutUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && url.hostname === 'tickets.harmonicbeacon.com';
    } catch (_) {
      return false;
    }
  }

  async function register(payload) {
    const response = await window.fetch(`${API_ORIGIN}/v1/registrations`, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': getOrCreateIdempotencyKey()
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`registration_${response.status}`);
    const result = await response.json();
    if (
      result.schema_version !== 'registration.response.v1' ||
      !/^[0-9a-f-]{36}$/i.test(result.registration_id || '') ||
      !result.commerce_status_token ||
      !validCheckoutUrl(result.checkout && result.checkout.widget_url)
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
      return value && value.schema_version === 'registration-status-context.v1' ? value : null;
    } catch (_) {
      return null;
    }
  }

  async function commerceStatus(context) {
    const response = await window.fetch(
      `${API_ORIGIN}/v1/registrations/${encodeURIComponent(context.registration_id)}/commerce-status`,
      {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        headers: {'X-Registration-Status-Token': context.commerce_status_token}
      }
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
    STATUS_CONTEXT_KEY,
    commerceStatus,
    getOrCreateIdempotencyKey,
    readStatusContext,
    register,
    validCheckoutUrl
  };
})();
