(() => {
  'use strict';

  const PIXEL_ID = '2232853310607122';
  const CONSENT_KEY = 'hb-meta-consent';
  const PENDING_KEY = 'hb-meta-pending-events-v1';
  const PENDING_MAX_AGE_MS = 24 * 60 * 60 * 1000;
  const GRANTED = 'granted';
  const DENIED = 'denied';
  const REGISTRATION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,256}$/;
  const CONVERSION_ID_PATTERN = /^cnv_v1_[A-Za-z0-9_-]{22}$/;
  const sentRegistrationIds = new Set();
  const sentConversionIds = new Set();
  let pixelLoaded = false;
  let pageViewTracked = false;

  const readConsent = () => {
    try {
      const value = localStorage.getItem(CONSENT_KEY);
      return value === GRANTED || value === DENIED ? value : null;
    } catch (_) {
      return null;
    }
  };

  const saveConsent = (value) => {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch (_) {}
  };

  const currentLanguage = () => {
    const language = document.documentElement.lang || navigator.language || 'es';
    return language.toLowerCase().startsWith('en') ? 'en' : 'es';
  };

  const copy = {
    es: {
      label: 'Preferencias de privacidad',
      title: 'Medición y publicidad',
      text: 'Usamos el píxel de Meta para medir visitas, inscripciones completadas y compras pagas, y mejorar nuestras campañas. Meta puede usar cookies y datos del dispositivo. Podés aceptar o continuar sin esta medición.',
      policy: 'Ver política de privacidad',
      reject: 'No aceptar',
      accept: 'Aceptar',
      settings: 'Revisar preferencias de privacidad'
    },
    en: {
      label: 'Privacy preferences',
      title: 'Measurement and advertising',
      text: 'We use the Meta pixel to measure visits, completed registrations and paid purchases and improve our campaigns. Meta may use cookies and device data. You can accept or continue without this measurement.',
      policy: 'View privacy policy',
      reject: 'Decline',
      accept: 'Accept',
      settings: 'Review privacy preferences'
    }
  };

  function normalizeRegistration(detail) {
    if (
      !detail ||
      !REGISTRATION_ID_PATTERN.test(detail.registrationId || '') ||
      !CODE_PATTERN.test(detail.eventCode || '') ||
      !CODE_PATTERN.test(detail.sessionCode || '')
    ) return null;
    return {
      registrationId: detail.registrationId,
      eventCode: detail.eventCode,
      sessionCode: detail.sessionCode,
      contentId: `${detail.eventCode}:${detail.sessionCode}`
    };
  }

  function normalizePurchase(detail) {
    if (
      !detail ||
      detail.kind !== 'PAID_PURCHASE' ||
      !CONVERSION_ID_PATTERN.test(detail.conversion_id || '') ||
      !Number.isInteger(detail.amount_minor) ||
      detail.amount_minor <= 0 ||
      detail.currency !== 'USD' ||
      !CODE_PATTERN.test(detail.event_code || '') ||
      !CODE_PATTERN.test(detail.session_code || '') ||
      !CODE_PATTERN.test(detail.content_id || '') ||
      detail.content_id !== `${detail.event_code}:${detail.session_code}`
    ) return null;
    return {
      kind: 'PAID_PURCHASE',
      conversionId: detail.conversion_id,
      amountMinor: detail.amount_minor,
      currency: detail.currency,
      eventCode: detail.event_code,
      sessionCode: detail.session_code,
      contentId: detail.content_id
    };
  }

  function pendingIdentity(event) {
    return event.kind === 'CompleteRegistration'
      ? `registration:${event.detail.registrationId}`
      : `purchase:${event.detail.conversionId}`;
  }

  function readPendingEvents() {
    let values = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
      if (Array.isArray(parsed)) values = parsed;
    } catch (_) {}
    const cutoff = Date.now() - PENDING_MAX_AGE_MS;
    const current = values.filter((event) => (
      event &&
      ['CompleteRegistration', 'Purchase'].includes(event.kind) &&
      Number.isFinite(event.createdAt) &&
      event.createdAt >= cutoff &&
      event.createdAt <= Date.now() &&
      (event.kind === 'CompleteRegistration'
        ? normalizeRegistration(event.detail)
        : normalizePurchase({
          kind: event.detail?.kind,
          conversion_id: event.detail?.conversionId,
          amount_minor: event.detail?.amountMinor,
          currency: event.detail?.currency,
          event_code: event.detail?.eventCode,
          session_code: event.detail?.sessionCode,
          content_id: event.detail?.contentId
        }))
    ));
    if (current.length !== values.length) writePendingEvents(current);
    return current;
  }

  function writePendingEvents(events) {
    try {
      if (events.length) localStorage.setItem(PENDING_KEY, JSON.stringify(events));
      else localStorage.removeItem(PENDING_KEY);
    } catch (_) {}
  }

  function clearPendingEvents() {
    try {
      localStorage.removeItem(PENDING_KEY);
    } catch (_) {}
  }

  function queuePendingEvent(kind, detail) {
    if (readConsent() !== null) return;
    const normalized = kind === 'CompleteRegistration'
      ? normalizeRegistration(detail)
      : normalizePurchase(detail);
    if (!normalized) return;
    const candidate = {kind, createdAt: Date.now(), detail: normalized};
    const identity = pendingIdentity(candidate);
    const pending = readPendingEvents().filter(event => pendingIdentity(event) !== identity);
    pending.push(candidate);
    writePendingEvents(pending.slice(-20));
  }

  function loadPixel() {
    if (readConsent() !== GRANTED) return;
    if (!pixelLoaded) {
      pixelLoaded = true;

      /* Meta Pixel base code */
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window,document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');

      window.fbq('consent', 'grant');
      window.fbq('init', PIXEL_ID);
    } else if (typeof window.fbq === 'function') {
      window.fbq('consent', 'grant');
    }
    if (!pageViewTracked && typeof window.fbq === 'function') {
      pageViewTracked = true;
      window.fbq('track', 'PageView');
    }
    flushPendingEvents();
    if (window.__hbCompletedRegistration) trackCompletedRegistration(window.__hbCompletedRegistration);
    if (window.__hbCanonicalPurchase) trackPurchase(window.__hbCanonicalPurchase);
  }

  function trackCompletedRegistration(detail) {
    const normalized = normalizeRegistration(detail);
    if (readConsent() !== GRANTED || typeof window.fbq !== 'function' || !normalized) return;
    const registrationKey = `hb-meta-registration-${normalized.registrationId}`;
    if (sentRegistrationIds.has(normalized.registrationId)) return;
    let sentInCurrentTab = false;
    try {
      sentInCurrentTab = Boolean(sessionStorage.getItem(registrationKey));
    } catch (_) {}
    try {
      if (localStorage.getItem(registrationKey)) return;
      if (sentInCurrentTab) localStorage.setItem(registrationKey, 'sent');
    } catch (_) {}
    if (sentInCurrentTab) return;
    for (const browserStorage of [sessionStorage, localStorage]) {
      try {
        browserStorage.setItem(registrationKey, 'sent');
      } catch (_) {}
    }
    sentRegistrationIds.add(normalized.registrationId);
    window.fbq('track', 'CompleteRegistration', {
      content_name: 'Harmonic Myth Projection',
      content_ids: [normalized.contentId],
      content_type: 'product'
    });
  }

  function trackPurchase(detail) {
    const normalized = normalizePurchase(detail);
    if (readConsent() !== GRANTED || typeof window.fbq !== 'function' || !normalized) return;
    const conversionKey = `hb-meta-purchase-${normalized.conversionId}`;
    if (sentConversionIds.has(normalized.conversionId)) return;
    try {
      if (localStorage.getItem(conversionKey)) return;
      localStorage.setItem(conversionKey, 'sent');
    } catch (_) {}
    sentConversionIds.add(normalized.conversionId);
    window.fbq('track', 'Purchase', {
      content_name: 'Harmonic Myth Projection',
      content_ids: [normalized.contentId],
      content_type: 'product',
      value: normalized.amountMinor / 100,
      currency: normalized.currency
    }, {eventID: normalized.conversionId});
  }

  function flushPendingEvents() {
    if (readConsent() !== GRANTED || typeof window.fbq !== 'function') return;
    const pending = readPendingEvents();
    clearPendingEvents();
    for (const event of pending) {
      if (event.kind === 'CompleteRegistration') trackCompletedRegistration(event.detail);
      if (event.kind === 'Purchase') {
        trackPurchase({
          kind: event.detail.kind,
          conversion_id: event.detail.conversionId,
          amount_minor: event.detail.amountMinor,
          currency: event.detail.currency,
          event_code: event.detail.eventCode,
          session_code: event.detail.sessionCode,
          content_id: event.detail.contentId
        });
      }
    }
  }

  function receiveRegistration(detail) {
    window.__hbCompletedRegistration = detail;
    if (readConsent() === GRANTED) trackCompletedRegistration(detail);
    else queuePendingEvent('CompleteRegistration', detail);
  }

  function receivePurchase(detail) {
    window.__hbCanonicalPurchase = detail;
    if (readConsent() === GRANTED) trackPurchase(detail);
    else queuePendingEvent('Purchase', detail);
  }

  window.addEventListener('hb:registration-completed', event => receiveRegistration(event.detail));
  window.addEventListener('hb:purchase-confirmed', event => receivePurchase(event.detail));

  function revokePixel() {
    if (typeof window.fbq === 'function') window.fbq('consent', 'revoke');
    ['_fbp', '_fbc'].forEach((name) => {
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
      document.cookie = `${name}=; Max-Age=0; path=/; domain=.harmonicbeacon.com; SameSite=Lax`;
    });
  }

  function addStyles() {
    if (document.querySelector('#hb-meta-consent-styles')) return;
    const style = document.createElement('style');
    style.id = 'hb-meta-consent-styles';
    style.textContent = `
      .hb-consent{position:relative;width:min(760px,calc(100% - 36px));margin:44px auto 24px;padding:22px;border:1px solid rgba(255,255,255,.24);border-radius:16px;color:#f7f4e8;background:#0b1715;font:15px/1.55 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .hb-consent[hidden],.hb-consent-settings[hidden]{display:none!important}.hb-consent__title{margin:0 0 8px;color:#fff9e9;font:700 20px/1.25 Inter,ui-sans-serif,system-ui,sans-serif}.hb-consent__text{margin:0;color:#d1ddd4}.hb-consent__link{display:inline-block;margin-top:10px;color:#ffd875;text-decoration:underline;text-underline-offset:3px}.hb-consent__actions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}.hb-consent__button{min-height:44px;padding:0 16px;border:1px solid rgba(255,255,255,.4);border-radius:999px;color:#f7f4e8;background:transparent;font:700 13px Inter,ui-sans-serif,system-ui,sans-serif;cursor:pointer}.hb-consent__button--accept{border-color:#c8ff7a;color:#07120f;background:#c8ff7a}.hb-consent__button:focus-visible,.hb-consent-settings:focus-visible{outline:3px solid #7ceaff;outline-offset:3px}.hb-consent-settings{display:block;position:relative;width:max-content;max-width:calc(100% - 36px);min-height:38px;margin:28px auto 18px;padding:0 14px;border:1px solid currentColor;border-radius:999px;color:inherit;background:transparent;font:700 11px Inter,ui-sans-serif,system-ui,sans-serif;cursor:pointer}
      @media(max-width:520px){.hb-consent{width:calc(100% - 20px);padding:19px}.hb-consent__actions{display:grid;grid-template-columns:1fr 1fr}.hb-consent__button{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function createInterface() {
    addStyles();
    const text = copy[currentLanguage()];
    const panel = document.createElement('section');
    panel.className = 'hb-consent';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', text.label);
    panel.innerHTML = `
      <h2 class="hb-consent__title">${text.title}</h2>
      <p class="hb-consent__text">${text.text}</p>
      <a class="hb-consent__link" href="/politica/">${text.policy}</a>
      <div class="hb-consent__actions">
        <button class="hb-consent__button" type="button" data-hb-consent="deny">${text.reject}</button>
        <button class="hb-consent__button hb-consent__button--accept" type="button" data-hb-consent="grant">${text.accept}</button>
      </div>
    `;
    const settings = document.createElement('button');
    settings.className = 'hb-consent-settings';
    settings.type = 'button';
    settings.textContent = text.settings;
    settings.hidden = !readConsent();

    const closePanel = () => {
      panel.hidden = true;
      settings.hidden = false;
    };
    panel.querySelector('[data-hb-consent="grant"]').addEventListener('click', () => {
      saveConsent(GRANTED);
      closePanel();
      loadPixel();
    });
    panel.querySelector('[data-hb-consent="deny"]').addEventListener('click', () => {
      saveConsent(DENIED);
      clearPendingEvents();
      revokePixel();
      closePanel();
    });
    settings.addEventListener('click', () => {
      panel.hidden = false;
      settings.hidden = true;
      panel.querySelector('[data-hb-consent="grant"]').focus();
    });

    const footer = document.querySelector('footer');
    if (footer && typeof footer.before === 'function') footer.before(panel, settings);
    else document.body.append(panel, settings);
    if (readConsent()) panel.hidden = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createInterface, {once: true});
  } else {
    createInterface();
  }

  if (readConsent() === GRANTED) loadPixel();
  else if (readConsent() === null) {
    if (window.__hbCompletedRegistration) queuePendingEvent('CompleteRegistration', window.__hbCompletedRegistration);
    if (window.__hbCanonicalPurchase) queuePendingEvent('Purchase', window.__hbCanonicalPurchase);
  }
})();
