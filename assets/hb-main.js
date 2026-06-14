/* Harmonic Beacon + PMP — chrome compartido + interacciones (multi-página) */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var page = document.body.getAttribute('data-page') || 'home';

  /* ---- Símbolo Lissajous 3:2 (path canónico) ---- */
  var MARK = 'M 192.0 100.0 L 191.8 104.1 L 191.2 108.2 L 190.1 112.3 L 188.7 116.4 L 186.8 120.5 L 184.6 124.5 L 182.0 128.4 L 179.0 132.3 L 175.6 136.2 L 171.9 139.9 L 167.9 143.6 L 163.6 147.2 L 159.0 150.7 L 154.1 154.1 L 148.9 157.4 L 143.6 160.5 L 138.0 163.6 L 132.3 166.5 L 126.5 169.3 L 120.5 171.9 L 114.4 174.4 L 108.2 176.8 L 102.1 179.0 L 95.9 181.0 L 89.7 182.9 L 83.6 184.6 L 77.5 186.1 L 71.6 187.5 L 65.7 188.7 L 60.1 189.7 L 54.6 190.5 L 49.3 191.2 L 44.3 191.6 L 39.5 191.9 L 34.9 192.0 L 30.7 191.9 L 26.8 191.6 L 23.2 191.2 L 20.0 190.5 L 17.1 189.7 L 14.6 188.7 L 12.5 187.5 L 10.8 186.1 L 9.5 184.6 L 8.6 182.9 L 8.1 181.0 L 8.0 179.0 L 8.4 176.8 L 9.1 174.4 L 10.3 171.9 L 11.9 169.3 L 13.9 166.5 L 16.2 163.6 L 19.0 160.5 L 22.1 157.4 L 25.6 154.1 L 29.4 150.7 L 33.5 147.2 L 37.9 143.6 L 42.6 139.9 L 47.6 136.2 L 52.8 132.3 L 58.2 128.4 L 63.8 124.5 L 69.6 120.5 L 75.5 116.4 L 81.5 112.3 L 87.7 108.2 L 93.8 104.1 L 100.0 100.0 L 106.2 95.9 L 112.3 91.8 L 118.5 87.7 L 124.5 83.6 L 130.4 79.5 L 136.2 75.5 L 141.8 71.6 L 147.2 67.7 L 152.4 63.8 L 157.4 60.1 L 162.1 56.4 L 166.5 52.8 L 170.6 49.3 L 174.4 45.9 L 177.9 42.6 L 181.0 39.5 L 183.8 36.4 L 186.1 33.5 L 188.1 30.7 L 189.7 28.1 L 190.9 25.6 L 191.6 23.2 L 192.0 21.0 L 191.9 19.0 L 191.4 17.1 L 190.5 15.4 L 189.2 13.9 L 187.5 12.5 L 185.4 11.3 L 182.9 10.3 L 180.0 9.5 L 176.8 8.8 L 173.2 8.4 L 169.3 8.1 L 165.1 8.0 L 160.5 8.1 L 155.7 8.4 L 150.7 8.8 L 145.4 9.5 L 139.9 10.3 L 134.3 11.3 L 128.4 12.5 L 122.5 13.9 L 116.4 15.4 L 110.3 17.1 L 104.1 19.0 L 97.9 21.0 L 91.8 23.2 L 85.6 25.6 L 79.5 28.1 L 73.5 30.7 L 67.7 33.5 L 62.0 36.4 L 56.4 39.5 L 51.1 42.6 L 45.9 45.9 L 41.0 49.3 L 36.4 52.8 L 32.1 56.4 L 28.1 60.1 L 24.4 63.8 L 21.0 67.7 L 18.0 71.6 L 15.4 75.5 L 13.2 79.5 L 11.3 83.6 L 9.9 87.7 L 8.8 91.8 L 8.2 95.9 L 8.0 100.0 L 8.2 104.1 L 8.8 108.2 L 9.9 112.3 L 11.3 116.4 L 13.2 120.5 L 15.4 124.5 L 18.0 128.4 L 21.0 132.3 L 24.4 136.2 L 28.1 139.9 L 32.1 143.6 L 36.4 147.2 L 41.0 150.7 L 45.9 154.1 L 51.1 157.4 L 56.4 160.5 L 62.0 163.6 L 67.7 166.5 L 73.5 169.3 L 79.5 171.9 L 85.6 174.4 L 91.8 176.8 L 97.9 179.0 L 104.1 181.0 L 110.3 182.9 L 116.4 184.6 L 122.5 186.1 L 128.4 187.5 L 134.3 188.7 L 139.9 189.7 L 145.4 190.5 L 150.7 191.2 L 155.7 191.6 L 160.5 191.9 L 165.1 192.0 L 169.3 191.9 L 173.2 191.6 L 176.8 191.2 L 180.0 190.5 L 182.9 189.7 L 185.4 188.7 L 187.5 187.5 L 189.2 186.1 L 190.5 184.6 L 191.4 182.9 L 191.9 181.0 L 192.0 179.0 L 191.6 176.8 L 190.9 174.4 L 189.7 171.9 L 188.1 169.3 L 186.1 166.5 L 183.8 163.6 L 181.0 160.5 L 177.9 157.4 L 174.4 154.1 L 170.6 150.7 L 166.5 147.2 L 162.1 143.6 L 157.4 139.9 L 152.4 136.2 L 147.2 132.3 L 141.8 128.4 L 136.2 124.5 L 130.4 120.5 L 124.5 116.4 L 118.5 112.3 L 112.3 108.2 L 106.2 104.1 L 100.0 100.0 L 93.8 95.9 L 87.7 91.8 L 81.5 87.7 L 75.5 83.6 L 69.6 79.5 L 63.8 75.5 L 58.2 71.6 L 52.8 67.7 L 47.6 63.8 L 42.6 60.1 L 37.9 56.4 L 33.5 52.8 L 29.4 49.3 L 25.6 45.9 L 22.1 42.6 L 19.0 39.5 L 16.2 36.4 L 13.9 33.5 L 11.9 30.7 L 10.3 28.1 L 9.1 25.6 L 8.4 23.2 L 8.0 21.0 L 8.1 19.0 L 8.6 17.1 L 9.5 15.4 L 10.8 13.9 L 12.5 12.5 L 14.6 11.3 L 17.1 10.3 L 20.0 9.5 L 23.2 8.8 L 26.8 8.4 L 30.7 8.1 L 34.9 8.0 L 39.5 8.1 L 44.3 8.4 L 49.3 8.8 L 54.6 9.5 L 60.1 10.3 L 65.7 11.3 L 71.6 12.5 L 77.5 13.9 L 83.6 15.4 L 89.7 17.1 L 95.9 19.0 L 102.1 21.0 L 108.2 23.2 L 114.4 25.6 L 120.5 28.1 L 126.5 30.7 L 132.3 33.5 L 138.0 36.4 L 143.6 39.5 L 148.9 42.6 L 154.1 45.9 L 159.0 49.3 L 163.6 52.8 L 167.9 56.4 L 171.9 60.1 L 175.6 63.8 L 179.0 67.7 L 182.0 71.6 L 184.6 75.5 L 186.8 79.5 L 188.7 83.6 L 190.1 87.7 L 191.2 91.8 L 191.8 95.9 L 192.0 100.0';

  function markSvg(size) {
    return '<svg class="hb-mark" viewBox="0 0 200 200" width="' + size + '" height="' + size + '" fill="none" aria-hidden="true"><use href="#hbmark"/></svg>';
  }

  function L(en, es) { return '<span data-lang="en">' + en + '</span><span data-lang="es">' + es + '</span>'; }

  /* ---- NAV ---- */
  var links = [
    { href: '#experience', en: 'Experience', es: 'Experiencia', key: 'experience' },
    { href: '#hosts', en: 'For Hosts', es: 'Anfitriones', key: 'hosts' },
    { href: '#different', en: 'Difference', es: 'Diferencia', key: 'different' },
    { href: '#team', en: 'Team', es: 'Equipo', key: 'team' },
    { href: '#foundation', en: 'HIT', es: 'HIT', key: 'foundation' },
    { href: '#contact', en: 'Contact', es: 'Contacto', key: 'contact' }
  ];
  function linkItems() {
    return links.map(function (l) {
      var active = (l.key === page) ? ' aria-current="page"' : '';
      return '<li><a href="' + l.href + '"' + active + '>' + L(l.en, l.es) + '</a></li>';
    }).join('');
  }
  var navHtml =
    '<header class="nav" id="nav"><div class="nav-inner">' +
      '<a href="/" class="brandlock" aria-label="Harmonic Beacon + PMP">' + markSvg(30) +
        '<span class="hb-wordmark" style="font-size:13px;">Harmonic Beacon</span></a>' +
      '<ul class="nav-links">' + linkItems() + '</ul>' +
      '<div class="nav-right">' +
        '<button class="lang" id="lang" type="button" aria-label="Language / Idioma">' +
          '<span data-lang-tag="en">EN</span><span class="sep">/</span><span data-lang-tag="es">ES</span></button>' +
        '<a href="#contact" class="btn btn-primary nav-cta">' + L('Host a preview', 'Hostear una preview') + '</a>' +
        '<button class="nav-toggle" id="navToggle" type="button" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>' +
      '</div>' +
    '</div>' +
    '<div class="nav-mobile" id="navMobile"><ul>' + linkItems() +
      '<li><a href="#contact" class="mob-cta">' + L('Host a preview', 'Hostear una preview') + '</a></li>' +
    '</ul></div></header>';

  /* ---- FOOTER ---- */
  var footHtml =
    '<footer><div class="wrap foot-grid">' +
      '<div><a href="/" class="brandlock">' + markSvg(28) +
        '<span class="hb-wordmark" style="font-size:12px;">Harmonic Beacon + PMP</span></a>' +
        '<p class="boundary" style="margin-top:1.2rem;">' +
          L('Beacon + PMP is framed as wellness, not therapy. Participant reports are experiential accounts, not clinical evidence. The harmonic field is proprietary know-how, not a patent claim.',
            'Beacon + PMP se enmarca como bienestar, no como terapia. Los reportes de participantes son relatos experienciales, no evidencia clínica. El campo armónico es know-how propio, no un claim de patente.') +
        '</p></div>' +
      '<div class="foot-contact">' +
        '<p class="eyebrow" style="color:var(--ink-600);">Asociación Civil AlterMundi</p>' +
        '<p style="margin-top:.9rem;font-size:.92rem;"><a class="ulink" href="mailto:info@altermundi.net">info@altermundi.net</a></p>' +
        '<p style="margin-top:.4rem;font-size:.92rem;"><a class="ulink" href="https://wa.me/5493547469632" target="_blank" rel="noopener">WhatsApp +54 9 3547 46-9632</a></p>' +
        '<p style="margin-top:.9rem;font-size:.82rem;color:var(--ink-500);">© 2026 AlterMundi · Costa Rica</p>' +
      '</div>' +
    '</div></footer>';

  /* ---- Inyectar chrome ---- */
  document.body.insertAdjacentHTML('afterbegin', navHtml);
  document.body.insertAdjacentHTML('beforeend', footHtml);
  document.body.insertAdjacentHTML('beforeend',
    '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><path id="hbmark" d="' + MARK + '" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></defs></svg>');

  /* ---- i18n: ES/EN con persistencia ---- */
  function setLang(lang) {
    root.setAttribute('data-active-lang', lang);
    root.setAttribute('lang', lang);
    try { localStorage.setItem('hb-lang', lang); } catch (e) {}
    document.querySelectorAll('[data-lang-tag]').forEach(function (el) {
      var on = el.getAttribute('data-lang-tag') === lang;
      el.style.fontWeight = on ? '600' : '400';
      el.style.color = on ? 'var(--gold)' : 'var(--ink-500)';
    });
  }
  var saved;
  try { saved = localStorage.getItem('hb-lang'); } catch (e) {}
  if (!saved) saved = (navigator.language || 'en').toLowerCase().indexOf('es') === 0 ? 'es' : 'en';
  setLang(saved);
  var langBtn = document.getElementById('lang');
  if (langBtn) langBtn.addEventListener('click', function () {
    setLang(root.getAttribute('data-active-lang') === 'es' ? 'en' : 'es');
  });

  /* ---- Menú móvil ---- */
  var toggle = document.getElementById('navToggle');
  var mobile = document.getElementById('navMobile');
  if (toggle && mobile) {
    toggle.addEventListener('click', function () {
      var open = mobile.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.classList.toggle('x', open);
    });
    mobile.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobile.classList.remove('open');
        toggle.classList.remove('x');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---- Nav: fondo al hacer scroll ---- */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- Reveal on scroll ---- */
  var reveals = document.querySelectorAll('.reveal');
  var forceAll = location.search.indexOf('reveal=all') !== -1;
  if (forceAll) {
    root.style.scrollBehavior = 'auto';
    var heroEl = document.querySelector('.hero');
    if (heroEl) heroEl.style.minHeight = '860px';
  }
  if (forceAll || reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }
})();
