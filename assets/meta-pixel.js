(() => {
  'use strict';

  const PIXEL_ID = '2232853310607122';
  const CONSENT_KEY = 'hb-meta-consent';
  const GRANTED = 'granted';
  const DENIED = 'denied';
  const REGISTRATION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const SESSION_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
  const sentRegistrationIds = new Set();
  let pixelLoaded = false;

  const readConsent = () => {
    try {
      return localStorage.getItem(CONSENT_KEY);
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
      settings: 'Privacidad'
    },
    en: {
      label: 'Privacy preferences',
      title: 'Measurement and advertising',
      text: 'We use the Meta pixel to measure visits, completed registrations and paid purchases and improve our campaigns. Meta may use cookies and device data. You can accept or continue without this measurement.',
      policy: 'View privacy policy',
      reject: 'Decline',
      accept: 'Accept',
      settings: 'Privacy'
    }
  };

  function loadPixel() {
    if (pixelLoaded || readConsent() !== GRANTED) return;
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
    window.fbq('track', 'PageView');
    if (window.__hbCompletedRegistration) trackCompletedRegistration(window.__hbCompletedRegistration);
  }

  function trackCompletedRegistration(detail) {
    if (
      !detail ||
      !REGISTRATION_ID_PATTERN.test(detail.registrationId || '') ||
      !SESSION_CODE_PATTERN.test(detail.sessionCode || '')
    ) return;
    const registrationKey = `hb-meta-registration-${detail.registrationId}`;
    if (sentRegistrationIds.has(detail.registrationId)) return;
    try {
      if (sessionStorage.getItem(registrationKey)) return;
      sessionStorage.setItem(registrationKey, 'sent');
    } catch (_) {}
    sentRegistrationIds.add(detail.registrationId);

    window.fbq('track', 'CompleteRegistration', {
      content_name: 'Harmonic Myth Projection',
      content_ids: [detail.sessionCode],
      content_type: 'product'
    });
  }

  // Purchase intentionally fails closed until commerce-status exposes an
  // authoritative paid conversion, real amount/currency and stable opaque ID.
  // registrationId + ACCESS_READY alone can also represent a zero-value access.

  window.addEventListener('hb:registration-completed', (event) => {
    window.__hbCompletedRegistration = event.detail;
    if (pixelLoaded) trackCompletedRegistration(event.detail);
  });

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
      .hb-consent{position:fixed;z-index:2147483646;right:18px;bottom:18px;width:min(440px,calc(100% - 36px));padding:22px;border:1px solid rgba(255,255,255,.24);border-radius:16px;color:#f7f4e8;background:#0b1715;box-shadow:0 24px 80px rgba(0,0,0,.55);font:15px/1.55 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .hb-consent[hidden]{display:none!important}.hb-consent__title{margin:0 0 8px;color:#fff9e9;font:700 20px/1.25 Inter,ui-sans-serif,system-ui,sans-serif}.hb-consent__text{margin:0;color:#d1ddd4}.hb-consent__link{display:inline-block;margin-top:10px;color:#ffd875;text-decoration:underline;text-underline-offset:3px}.hb-consent__actions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}.hb-consent__button{min-height:44px;padding:0 16px;border:1px solid rgba(255,255,255,.4);border-radius:999px;color:#f7f4e8;background:transparent;font:700 13px Inter,ui-sans-serif,system-ui,sans-serif;cursor:pointer}.hb-consent__button--accept{border-color:#c8ff7a;color:#07120f;background:#c8ff7a}.hb-consent__button:focus-visible,.hb-consent-settings:focus-visible{outline:3px solid #7ceaff;outline-offset:3px}.hb-consent-settings{position:fixed;z-index:2147483645;left:12px;bottom:12px;min-height:34px;padding:0 12px;border:1px solid rgba(255,255,255,.28);border-radius:999px;color:#e8eee9;background:rgba(7,18,15,.9);font:700 11px Inter,ui-sans-serif,system-ui,sans-serif;cursor:pointer}
      @media(max-width:520px){.hb-consent{right:10px;bottom:10px;width:calc(100% - 20px);padding:19px}.hb-consent__actions{display:grid;grid-template-columns:1fr 1fr}.hb-consent__button{width:100%}.hb-consent-settings{left:8px;bottom:8px}}
      @media(prefers-reduced-motion:reduce){.hb-consent,.hb-consent-settings{scroll-behavior:auto}}
    `;
    document.head.appendChild(style);
  }

  function createInterface() {
    addStyles();
    const language = currentLanguage();
    const text = copy[language];

    const panel = document.createElement('section');
    panel.className = 'hb-consent';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
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
      revokePixel();
      closePanel();
    });

    settings.addEventListener('click', () => {
      panel.hidden = false;
      settings.hidden = true;
      panel.querySelector('[data-hb-consent="grant"]').focus();
    });

    document.body.append(panel, settings);
    if (readConsent()) panel.hidden = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createInterface, { once: true });
  } else {
    createInterface();
  }

  if (readConsent() === GRANTED) loadPixel();
})();
