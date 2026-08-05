(() => {
  'use strict';

  const API_URL = 'https://bot.harmonicbeacon.com/v1/commerce/catalog';
  const SCHEMA_VERSION = 'public-commerce-catalog.response.v1';
  const FETCH_TIMEOUT_MS = 8000;
  const ACTIVE_STATES = new Set(['OPEN', 'CLOSED', 'SOLD_OUT', 'CANCELLED', 'ENDED']);
  const LOCALES = new Set(['es', 'en']);
  const CODE_PATTERN = /^[A-Za-z0-9._:-]{1,257}$/;
  const TIME_ZONES = Object.freeze([
    ['America/Costa_Rica', 'Costa Rica'],
    ['America/Mexico_City', 'México (CDMX)'],
    ['America/Bogota', 'Colombia / Perú / Ecuador'],
    ['America/Santiago', 'Chile'],
    ['America/Argentina/Buenos_Aires', 'Argentina / Uruguay'],
    ['America/Sao_Paulo', 'Brasil (São Paulo)'],
    ['America/New_York', 'New York'],
    ['America/Los_Angeles', 'Los Angeles'],
    ['Europe/Madrid', 'España']
  ]);

  function validDateTime(value) {
    return typeof value === 'string' && value.length <= 40 && !Number.isNaN(Date.parse(value));
  }

  function validTimeZone(value) {
    if (typeof value !== 'string' || value.length > 100) return false;
    try {
      new Intl.DateTimeFormat('en', {timeZone: value}).format(0);
      return true;
    } catch (_) {
      return false;
    }
  }

  function validSession(eventCode, session) {
    if (!session || typeof session !== 'object' || Array.isArray(session)) return false;
    if (!CODE_PATTERN.test(eventCode) || eventCode.length > 128) return false;
    if (!CODE_PATTERN.test(session.session_code || '') || session.session_code.length > 128) return false;
    if (!CODE_PATTERN.test(session.content_id || '') || session.content_id.length > 257) return false;
    if (typeof session.title !== 'string' || !session.title.trim() || session.title.length > 200) return false;
    if (!LOCALES.has(session.locale) || session.modality !== 'ONLINE') return false;
    if (!Number.isInteger(session.amount_minor) || session.amount_minor < 1 || session.currency !== 'USD') return false;
    if (!ACTIVE_STATES.has(session.availability) || !validTimeZone(session.timezone)) return false;
    if (![session.registration_opens_at, session.registration_closes_at, session.starts_at, session.ends_at].every(validDateTime)) return false;
    const opens = Date.parse(session.registration_opens_at);
    const closes = Date.parse(session.registration_closes_at);
    const starts = Date.parse(session.starts_at);
    const ends = Date.parse(session.ends_at);
    return opens <= closes && closes <= starts && starts < ends;
  }

  function normalizeCatalog(document) {
    if (!document || document.schema_version !== SCHEMA_VERSION || !Array.isArray(document.events)) {
      throw new Error('invalid_catalog');
    }
    const sessions = [];
    const identities = new Set();
    for (const event of document.events) {
      if (!event || typeof event !== 'object' || !CODE_PATTERN.test(event.event_code || '') || !Array.isArray(event.sessions)) {
        throw new Error('invalid_catalog');
      }
      for (const session of event.sessions) {
        if (!validSession(event.event_code, session)) throw new Error('invalid_catalog');
        const identity = `${event.event_code}\u0000${session.session_code}`;
        if (identities.has(identity)) throw new Error('duplicate_session');
        identities.add(identity);
        sessions.push(Object.freeze({...session, event_code: event.event_code}));
      }
    }
    return Object.freeze(sessions.sort((left, right) =>
      Date.parse(left.starts_at) - Date.parse(right.starts_at) ||
      left.session_code.localeCompare(right.session_code)
    ));
  }

  function sessionState(session, now = Date.now()) {
    const current = typeof now === 'number' ? now : Date.parse(now);
    const opens = Date.parse(session.registration_opens_at);
    const closes = Date.parse(session.registration_closes_at);
    const ends = Date.parse(session.ends_at);
    if (session.availability === 'ENDED' || current >= ends) return 'ENDED';
    if (session.availability !== 'OPEN') return session.availability;
    if (current < opens) return 'PENDING';
    if (current >= closes) return 'CLOSED';
    return 'OPEN';
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function formatDate(session, locale) {
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-CR', {
      timeZone: session.timezone,
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(session.starts_at));
  }

  function formatPrice(session, locale) {
    return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-CR', {
      style: 'currency',
      currency: session.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(session.amount_minor / 100);
  }

  function labels(state) {
    return ({
      OPEN: ['Inscripción abierta', 'Registration open'],
      PENDING: ['Inscripción próximamente', 'Registration opens soon'],
      CLOSED: ['Inscripción cerrada', 'Registration closed'],
      SOLD_OUT: ['Entradas agotadas', 'Sold out'],
      CANCELLED: ['Sesión cancelada', 'Session cancelled']
    })[state];
  }

  function registrationDate(session) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: session.timezone,
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date(session.starts_at));
    const part = type => parts.find(item => item.type === type)?.value || '';
    return `${part('year')}-${part('month')}-${part('day')}`;
  }

  function languageLabel(locale) {
    return locale === 'en'
      ? ['Inglés', 'English']
      : ['Español', 'Spanish'];
  }

  function timeZoneLabel(value) {
    const parts = value.split('/');
    return parts[parts.length - 1].replace(/_/g, ' ');
  }

  function timeZoneOptions() {
    return TIME_ZONES.map(([value, label]) =>
      `<option value="${escapeHtml(value)}"${value === 'America/Costa_Rica' ? ' selected' : ''}>${escapeHtml(label)}</option>`
    ).join('');
  }

  function sessionMarkup(session, now) {
    const state = sessionState(session, now);
    if (state === 'ENDED') return '';
    const stateLabel = labels(state);
    const sessionLanguage = languageLabel(session.locale);
    const contentId = escapeHtml(session.content_id);
    const title = escapeHtml(session.title);
    const startsAt = escapeHtml(new Date(session.starts_at).toISOString());
    const timeZone = escapeHtml(session.timezone);
    const link = state === 'OPEN'
      ? `<a class="date-chip" data-registration-link href="/inscripcion/?fecha=${encodeURIComponent(registrationDate(session))}&amp;idioma=${encodeURIComponent(session.locale)}"><span class="dc-d"><span data-lang="es">Inscribirme</span><span data-lang="en">Register</span></span><span class="dc-a"><span data-lang="es">Continuar de forma segura</span><span data-lang="en">Continue securely</span></span></a>`
      : `<span class="date-chip date-chip-closed" aria-disabled="true"><span class="dc-d"><span data-lang="es">${escapeHtml(stateLabel[0])}</span><span data-lang="en">${escapeHtml(stateLabel[1])}</span></span><span class="dc-a"><span data-lang="es">Sin checkout activo</span><span data-lang="en">No active checkout</span></span></span>`;

    return `<article class="ev-feat catalog-session" data-catalog-session="${contentId}" data-availability="${state}">
      <div class="tags">
        <span class="pill"><span data-lang="es">${escapeHtml(stateLabel[0])}</span><span data-lang="en">${escapeHtml(stateLabel[1])}</span></span>
        <span class="pill pill-sky"><span class="d"></span> <span data-lang="es">Online · ${escapeHtml(sessionLanguage[0])}</span><span data-lang="en">Online · ${escapeHtml(sessionLanguage[1])}</span></span>
      </div>
      <h2>${title}</h2>
      <p class="when"><span data-lang="es">${escapeHtml(formatDate(session, 'es'))} · ${escapeHtml(formatPrice(session, 'es'))}</span><span data-lang="en">${escapeHtml(formatDate(session, 'en'))} · ${escapeHtml(formatPrice(session, 'en'))}</span></p>
      <p class="where" data-published-time-zone="${timeZone}"><span data-lang="es">Una experiencia en vivo dentro de la App del Beacon. La sala reúne el campo armónico, las voces del grupo y una presencia compartida; cada persona participa y escucha desde su propio dispositivo. El horario publicado corresponde a <b>${escapeHtml(timeZoneLabel(session.timezone))}</b>.</span><span data-lang="en">A live experience hosted in the Beacon App. The room brings together the harmonic field, the group’s voices and a shared sense of presence, while each person listens and participates from their own device. The published time uses <b>${escapeHtml(timeZoneLabel(session.timezone))}</b>.</span></p>
      <div class="tz" data-starts-at="${startsAt}">
        <span class="tz-lb"><span data-lang="es">Tu horario</span><span data-lang="en">Your time</span></span>
        <select aria-label="Zona horaria / Time zone">${timeZoneOptions()}</select>
        <span class="tz-out"><b class="tz-time">—</b> <span data-lang="es">hora local</span><span data-lang="en">local time</span></span>
      </div>
      <div class="dates">${link}</div>
    </article>`;
  }

  function agendaMarkup(sessions, now = Date.now()) {
    const visible = sessions.map(session => sessionMarkup(session, now)).filter(Boolean);
    if (visible.length) return visible.join('');
    return `<div class="catalog-empty" data-catalog-state="EMPTY"><p><span data-lang="es">Los próximos horarios todavía no fueron publicados. Volvé pronto para consultar la agenda vigente.</span><span data-lang="en">The next times have not been published yet. Check back soon for the current schedule.</span></p></div>`;
  }

  function unavailableMarkup() {
    return `<div class="catalog-empty" data-catalog-state="UNAVAILABLE" role="status"><p><span data-lang="es">No pudimos consultar la agenda ahora. Para protegerte de información vencida, no mostramos enlaces de inscripción hasta recuperar los horarios vigentes.</span><span data-lang="en">We could not retrieve the schedule right now. To protect you from stale information, registration links stay hidden until the current times are available.</span></p></div>`;
  }

  function bindTimeZoneControls(container) {
    container.querySelectorAll('.tz[data-starts-at]').forEach(box => {
      const startsAt = new Date(box.getAttribute('data-starts-at'));
      const select = box.querySelector('select');
      const output = box.querySelector('.tz-time');
      const paint = () => {
        try {
          output.textContent = new Intl.DateTimeFormat('es-AR', {
            timeZone: select.value, hour: '2-digit', minute: '2-digit', hour12: false
          }).format(startsAt);
        } catch (_) {
          output.textContent = '—';
        }
      };
      select.addEventListener('change', paint);
      paint();
    });
  }

  async function fetchCatalog(fetcher, signal) {
    const response = await fetcher(API_URL, {
      method: 'GET',
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      headers: {'Accept': 'application/json'},
      signal
    });
    if (!response.ok) throw new Error('catalog_unavailable');
    const contentType = response.headers?.get?.('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) throw new Error('invalid_catalog_content_type');
    return normalizeCatalog(await response.json());
  }

  async function mount(root = window, now = Date.now()) {
    const container = root.document?.getElementById('virtual-events-catalog');
    if (!container || typeof root.fetch !== 'function') return false;
    container.setAttribute('aria-busy', 'true');
    const controller = new AbortController();
    const timeout = root.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const sessions = await fetchCatalog(root.fetch.bind(root), controller.signal);
      container.innerHTML = agendaMarkup(sessions, now);
      bindTimeZoneControls(container);
      return true;
    } catch (_) {
      container.innerHTML = unavailableMarkup();
      return false;
    } finally {
      root.clearTimeout(timeout);
      container.removeAttribute('aria-busy');
    }
  }

  const api = Object.freeze({
    API_URL,
    normalizeCatalog,
    sessionState,
    agendaMarkup,
    unavailableMarkup,
    fetchCatalog,
    mount
  });
  window.HBEventsCatalog = api;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mount());
  } else {
    mount();
  }
})();
