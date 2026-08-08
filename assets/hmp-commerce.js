(() => {
  'use strict';

  const REGISTRATION_OPEN = true;
  const REGISTRATION_BLOCKED_EVENTS = new Set();
  const API_ORIGIN = 'https://bot.harmonicbeacon.com';
  const IDEMPOTENCY_KEY = 'hb-registration-v4-idempotency-key';
  const STATUS_CONTEXT_KEY = 'hb-registration-v4-status-context';
  const LEGACY_STATUS_CONTEXT_KEYS = Object.freeze(['hb-registration-v3-status-context']);
  const REGISTRATION_TIMEOUT_MS = 15000;
  const STATUS_TIMEOUT_MS = 8000;
  const EMAIL_VERIFICATION_TIMEOUT_MS = 10000;
  const TICKET_TAILOR_WIDGET_SCRIPT = 'https://cdn.tickettailor.com/js/widgets/min/widget.js';
  const REGISTRATION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const STATUS_TOKEN_PATTERN = /^st_v1_[A-Za-z0-9_-]{40,64}$/;
  const CHECKOUT_CONTEXT_PATTERN = /^ctx_v1_[A-Za-z0-9_-]{40,64}$/;
  const CONVERSION_ID_PATTERN = /^cnv_v1_[A-Za-z0-9_-]{22}$/;
  const VERIFICATION_CODE_PATTERN = /^[0-9]{6}$/;
  const EMAIL_DOMAIN_CORRECTIONS = Object.freeze({
    'gmai.com': 'gmail.com',
    'gmail.co': 'gmail.com',
    'gmail.con': 'gmail.com',
    'gmial.com': 'gmail.com',
    'gmal.com': 'gmail.com',
    'hotmai.com': 'hotmail.com',
    'hotnail.com': 'hotmail.com',
    'icloud.con': 'icloud.com',
    'outlook.con': 'outlook.com',
    'yahoo.con': 'yahoo.com'
  });
  const CHECKOUTS = Object.freeze({
    'hmp-2026-08-08': Object.freeze({
      date: '2026-08-08',
      label_es: 'sábado 8 de agosto',
      label_en: 'Saturday, August 8',
      sessions: Object.freeze({
        'es-0830-cr': '8804105',
        'en-1400-cr': '8804106'
      }),
      options: Object.freeze({
        es: Object.freeze({ session_code: 'es-0830-cr', label: 'Español · 08:30 Costa Rica · US$20', time: '08:30', price: 'US$20' })
      })
    }),
    'hmp-2026-08-09': Object.freeze({
      date: '2026-08-09',
      label_es: 'domingo 9 de agosto',
      label_en: 'Sunday, August 9',
      free: true,
      sessions: Object.freeze({
        'en-1600-cr': '8820853'
      }),
      options: Object.freeze({
        en: Object.freeze({ session_code: 'en-1600-cr', label: 'English · 16:00 Costa Rica · FREE', time: '16:00', price: 'FREE' })
      })
    }),
    'hmp-logos-2026-08-07': Object.freeze({
      date: 'logos-2026-08-07',
      label_es: 'viernes 7 de agosto · LOGOS',
      label_en: 'Friday, August 7 · LOGOS',
      starts_at: '2026-08-07T16:00:00-06:00',
      ends_at: '2026-08-07T20:00:00-06:00',
      private: true,
      free: true,
      sessions: Object.freeze({
        'es-1600-cr': '8828041'
      }),
      options: Object.freeze({
        es: Object.freeze({
          session_code: 'es-1600-cr',
          label: 'LOGOS · 16:00 Costa Rica · gratis',
          name: 'LOGOS',
          detail_es: 'Harmonic Myth Projection · invitación privada',
          detail_en: 'Harmonic Myth Projection · private invitation',
          time: '16:00',
          price: 'GRATIS'
        })
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
    const eventCode = `hmp-${date}`;
    return REGISTRATION_BLOCKED_EVENTS.has(eventCode) ? null : CHECKOUTS[eventCode] || null;
  }

  function supportedRegistration(eventCode, sessionCode) {
    return REGISTRATION_OPEN && !REGISTRATION_BLOCKED_EVENTS.has(eventCode) && Boolean(CHECKOUTS[eventCode]?.sessions[sessionCode]);
  }

  function eventInProgress(eventCode, now = Date.now()) {
    const event = CHECKOUTS[eventCode];
    const observedAt = typeof now === 'number' ? now : Number.NaN;
    const startsAt = Date.parse(event?.starts_at || '');
    const endsAt = Date.parse(event?.ends_at || '');
    return Boolean(
      Number.isFinite(observedAt) &&
      Number.isFinite(startsAt) &&
      Number.isFinite(endsAt) &&
      startsAt <= observedAt &&
      observedAt < endsAt
    );
  }

  function suggestedEmailCorrection(value) {
    const email = String(value || '').trim().toLowerCase();
    const separator = email.lastIndexOf('@');
    if (separator <= 0) return null;
    const correctedDomain = EMAIL_DOMAIN_CORRECTIONS[email.slice(separator + 1)];
    return correctedDomain ? `${email.slice(0, separator)}@${correctedDomain}` : null;
  }

  function emailTypoError(suggestedEmail) {
    const error = new Error('email_domain_typo');
    error.code = 'email_domain_typo';
    error.suggestedEmail = suggestedEmail;
    return error;
  }

  function registrationError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
  }

  function announceCompletedRegistration(result, payload) {
    const completedRegistration = Object.freeze({
      registrationId: result.registration_id,
      eventCode: payload.event_code,
      sessionCode: payload.session_code
    });
    window.__hbCompletedRegistration = completedRegistration;
    if (typeof window.CustomEvent === 'function' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(new window.CustomEvent('hb:registration-completed', {
          detail: completedRegistration
        }));
      } catch (_) {}
    }
  }

  function storeStatusContext(payload, result) {
    const emailVerification = result.email_verification || null;
    const checkoutContext = result.checkout?.metadata_value || null;
    storage().setItem(STATUS_CONTEXT_KEY, JSON.stringify({
      schema_version: 'registration-status-context.v2',
      registration_id: result.registration_id,
      commerce_status_token: result.commerce_status_token,
      locale: payload.locale,
      event_code: payload.event_code,
      session_code: payload.session_code,
      checkout_context: checkoutContext,
      email_verification: emailVerification,
      registration_payload: emailVerification ? payload : null
    }));
  }

  function validEmailVerificationResult(result) {
    const verification = result?.email_verification;
    return Boolean(
      result?.schema_version === 'registration.email-verification.v1' &&
      result?.registration_status === 'EMAIL_VERIFICATION_REQUIRED' &&
      REGISTRATION_ID_PATTERN.test(result.registration_id || '') &&
      STATUS_TOKEN_PATTERN.test(result.commerce_status_token || '') &&
      REGISTRATION_ID_PATTERN.test(verification?.challenge_id || '') &&
      typeof verification?.expires_at === 'string' &&
      !Number.isNaN(Date.parse(verification.expires_at)) &&
      typeof verification?.masked_destination === 'string' &&
      verification.masked_destination.length >= 5
    );
  }

  function validCompletedRegistration(result, payload) {
    return Boolean(
      result?.schema_version === 'registration.response.v1' &&
      result?.registration_status === 'REGISTERED' &&
      REGISTRATION_ID_PATTERN.test(result.registration_id || '') &&
      STATUS_TOKEN_PATTERN.test(result.commerce_status_token || '') &&
      validCheckoutUrl(result.checkout?.widget_url, payload, result.checkout)
    );
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
        CHECKOUT_CONTEXT_PATTERN.test(context) &&
        url.hash === `#p[meta_registration_context]=${context}`
      );
    } catch (_) {
      return false;
    }
  }

  function mountCheckoutWidget(container, payload, checkout, onError = () => {}) {
    if (!container || typeof container.replaceChildren !== 'function') {
      throw new Error('checkout_widget_container_unavailable');
    }
    if (!validCheckoutUrl(checkout?.widget_url, payload, checkout)) {
      throw new Error('invalid_checkout_widget_url');
    }

    const widget = window.document.createElement('div');
    widget.className = 'tt-widget';

    const script = window.document.createElement('script');
    script.src = TICKET_TAILOR_WIDGET_SCRIPT;
    script.async = true;
    // The provider script adds its own `widget=true`. The canonical URL returned
    // by the API is also valid as a modal fallback and already contains that
    // flag, so handing it through unchanged creates duplicate widget modes in
    // the iframe query. Keep the signed path and metadata fragment, but let the
    // inline widget own its transport flags.
    const inlineUrl = new URL(checkout.widget_url);
    inlineUrl.searchParams.delete('widget');
    inlineUrl.searchParams.delete('modal_widget');
    const prefill = [
      ['p[first_name]', payload.first_name],
      ['p[last_name]', payload.last_name],
      ['p[email]', payload.email]
    ];
    const hashParts = inlineUrl.hash.slice(1).split('&').filter(Boolean);
    for (const [name, value] of prefill) {
      hashParts.push(`${name}=${encodeURIComponent(String(value || ''))}`);
    }
    inlineUrl.hash = hashParts.join('&');
    script.setAttribute('data-url', inlineUrl.toString());
    script.setAttribute('data-type', 'inline');
    script.setAttribute('data-inline-minimal', 'true');
    script.setAttribute('data-inline-show-logo', 'false');
    script.setAttribute('data-inline-bg-fill', 'false');
    script.setAttribute('data-inline-inherit-ref-from-url-param', '');
    script.setAttribute('data-inline-ref', 'website_widget');
    script.addEventListener('error', () => {
      container.replaceChildren();
      onError();
    }, {once: true});

    container.replaceChildren(widget);
    widget.append(script);
    return script;
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
    const suggestedEmail = suggestedEmailCorrection(payload?.email);
    if (suggestedEmail) throw emailTypoError(suggestedEmail);
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
    if (!response.ok) {
      let detail = null;
      try {
        detail = (await response.json())?.detail;
      } catch (_) {
        // Keep the generic HTTP error when the server did not return JSON.
      }
      if (
        response.status === 422 &&
        detail?.code === 'email_domain_typo' &&
        typeof detail.suggested_email === 'string'
      ) {
        throw emailTypoError(detail.suggested_email);
      }
      if (response.status === 422 && detail?.code === 'email_domain_unreachable') {
        throw registrationError('email_domain_unreachable');
      }
      if (
        response.status === 503 &&
        detail?.code === 'email_domain_validation_unavailable'
      ) {
        throw registrationError('email_domain_validation_unavailable');
      }
      throw new Error(`registration_${response.status}`);
    }
    const result = await response.json();
    if (!validEmailVerificationResult(result) && !validCompletedRegistration(result, payload)) {
      throw new Error('invalid_registration_response');
    }
    storeStatusContext(payload, result);
    storage().removeItem(IDEMPOTENCY_KEY);
    if (validCompletedRegistration(result, payload)) announceCompletedRegistration(result, payload);
    return result;
  }

  async function verifyEmail(result, code, payload) {
    if (!validEmailVerificationResult(result) || !VERIFICATION_CODE_PATTERN.test(code || '')) {
      throw registrationError('email_verification_input_invalid');
    }
    const response = await fetchWithTimeout(
      `${API_ORIGIN}/v1/registrations/${encodeURIComponent(result.registration_id)}/email-verification`,
      {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'X-Registration-Status-Token': result.commerce_status_token
        },
        body: JSON.stringify({
          challenge_id: result.email_verification.challenge_id,
          code
        })
      },
      EMAIL_VERIFICATION_TIMEOUT_MS,
      'email_verification_timeout'
    );
    if (!response.ok) {
      let detail = null;
      try {
        detail = (await response.json())?.detail;
      } catch (_) {
        // Keep the generic verification error when the server did not return JSON.
      }
      const error = registrationError(detail?.code || `email_verification_${response.status}`);
      if (Number.isInteger(detail?.attempts_remaining)) {
        error.attemptsRemaining = detail.attempts_remaining;
      }
      throw error;
    }
    const completed = await response.json();
    if (!validCompletedRegistration(completed, payload)) {
      throw registrationError('invalid_email_verification_response');
    }
    storeStatusContext(payload, completed);
    announceCompletedRegistration(completed, payload);
    return completed;
  }

  async function resendEmailVerification(result, payload) {
    if (!validEmailVerificationResult(result)) {
      throw registrationError('email_verification_input_invalid');
    }
    const response = await fetchWithTimeout(
      `${API_ORIGIN}/v1/registrations/${encodeURIComponent(result.registration_id)}/email-verification/resend`,
      {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        headers: {'X-Registration-Status-Token': result.commerce_status_token}
      },
      EMAIL_VERIFICATION_TIMEOUT_MS,
      'email_verification_timeout'
    );
    if (!response.ok) {
      let detail = null;
      try {
        detail = (await response.json())?.detail;
      } catch (_) {
        // Keep the generic resend error when the server did not return JSON.
      }
      const error = registrationError(detail?.code || `email_verification_${response.status}`);
      if (Number.isInteger(detail?.retry_after_seconds)) {
        error.retryAfterSeconds = detail.retry_after_seconds;
      }
      throw error;
    }
    const resent = await response.json();
    if (!validEmailVerificationResult(resent)) {
      throw registrationError('invalid_email_verification_response');
    }
    storeStatusContext(payload, resent);
    return resent;
  }

  function readStatusContext() {
    for (const key of [STATUS_CONTEXT_KEY, ...LEGACY_STATUS_CONTEXT_KEYS]) {
      try {
        const value = JSON.parse(storage().getItem(key) || 'null');
        if (
          value &&
          ['registration-status-context.v1', 'registration-status-context.v2'].includes(value.schema_version) &&
          REGISTRATION_ID_PATTERN.test(value.registration_id || '') &&
          STATUS_TOKEN_PATTERN.test(value.commerce_status_token || '') &&
          (!value.checkout_context || CHECKOUT_CONTEXT_PATTERN.test(value.checkout_context))
        ) return value;
      } catch (_) {}
    }
    return null;
  }

  function clearStatusContext() {
    for (const key of [STATUS_CONTEXT_KEY, ...LEGACY_STATUS_CONTEXT_KEYS]) {
      storage().removeItem(key);
    }
  }

  async function commerceClaim(context, externalOrderId) {
    if (
      !context ||
      !REGISTRATION_ID_PATTERN.test(context.registration_id || '') ||
      !STATUS_TOKEN_PATTERN.test(context.commerce_status_token || '') ||
      !CHECKOUT_CONTEXT_PATTERN.test(context.checkout_context || '') ||
      !/^(or_)?[0-9]{1,32}$/.test(externalOrderId || '')
    ) {
      throw registrationError('commerce_claim_input_invalid');
    }
    const response = await fetchWithTimeout(
      `${API_ORIGIN}/v1/registrations/${encodeURIComponent(context.registration_id)}/commerce-claim`,
      {
        method: 'PUT',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'X-Registration-Status-Token': context.commerce_status_token
        },
        body: JSON.stringify({
          external_order_id: externalOrderId,
          checkout_context: context.checkout_context
        })
      },
      STATUS_TIMEOUT_MS,
      'commerce_claim_timeout'
    );
    if (!response.ok) {
      let detail = null;
      try {
        detail = (await response.json())?.detail;
      } catch (_) {
        // Keep the generic claim error when the server did not return JSON.
      }
      throw registrationError(detail?.code || `commerce_claim_${response.status}`);
    }
    const result = await response.json();
    if (
      result?.schema_version !== 'commerce-claim.response.v1' ||
      result?.registration_id !== context.registration_id ||
      !['LINKED', 'REPLAYED'].includes(result?.outcome)
    ) {
      throw registrationError('invalid_commerce_claim_response');
    }
    return result;
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

  function validPaidPurchase(purchase) {
    return Boolean(
      purchase &&
      purchase.kind === 'PAID_PURCHASE' &&
      CONVERSION_ID_PATTERN.test(purchase.conversion_id || '') &&
      Number.isInteger(purchase.amount_minor) &&
      purchase.amount_minor > 0 &&
      purchase.currency === 'USD' &&
      typeof purchase.event_code === 'string' &&
      purchase.event_code.length >= 1 &&
      purchase.event_code.length <= 128 &&
      typeof purchase.session_code === 'string' &&
      purchase.session_code.length >= 1 &&
      purchase.session_code.length <= 128 &&
      typeof purchase.content_id === 'string' &&
      purchase.content_id.length >= 3 &&
      purchase.content_id.length <= 257 &&
      purchase.content_id === `${purchase.event_code}:${purchase.session_code}`
    );
  }

  async function commerceStatusV2(context) {
    const response = await fetchWithTimeout(
      `${API_ORIGIN}/v2/registrations/${encodeURIComponent(context.registration_id)}/commerce-status`,
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
    if (
      result?.schema_version !== 'commerce-status.response.v2' ||
      result?.registration_id !== context.registration_id ||
      !['VERIFYING', 'PAYMENT_CONFIRMED', 'ACCESS_READY', 'REVIEW_REQUIRED', 'NOT_PAID', 'REVOKED'].includes(result?.state) ||
      (result.purchase !== null && (
        !['PAYMENT_CONFIRMED', 'ACCESS_READY'].includes(result.state) ||
        !validPaidPurchase(result.purchase)
      ))
    ) {
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
    clearStatusContext,
    commerceClaim,
    commerceStatus,
    commerceStatusV2,
    eventInProgress,
    fetchWithTimeout,
    getOrCreateIdempotencyKey,
    mountCheckoutWidget,
    readStatusContext,
    registrationEvent,
    register,
    resendEmailVerification,
    suggestedEmailCorrection,
    supportedRegistration,
    verifyEmail,
    validCheckoutUrl,
    validPaidPurchase,
    validWidgetPath,
    validWidgetQuery
  };
})();
