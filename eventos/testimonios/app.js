(function () {
  'use strict';

  var data = Array.isArray(window.HMP_REVIEW_DATA) ? window.HMP_REVIEW_DATA : [];
  var translations = window.HMP_TESTIMONIAL_TRANSLATIONS || { profiles: {}, clips: {} };
  var root = document.documentElement;
  var grid = document.getElementById('peopleGrid');
  var count = document.getElementById('resultCount');
  var search = document.getElementById('voiceSearch');
  var toolsRegion = document.getElementById('voiceTools');
  var filtersRegion = document.getElementById('voiceFilters');
  var filters = [].slice.call(document.querySelectorAll('[data-filter]'));
  var dialog = document.getElementById('profileDialog');
  var dialogContent = document.getElementById('dialogContent');
  var closeButton = document.getElementById('dialogClose');
  var activeFilter = 'all';
  var activePerson = null;

  function language() {
    return root.getAttribute('data-active-lang') === 'en' ? 'en' : 'es';
  }

  function label(es, en) {
    return language() === 'en' ? en : es;
  }

  function profileCopy(person) {
    return translations.profiles[person.name] || {};
  }

  function clipCopy(clip) {
    return translations.clips[clip.code] || {};
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (typeof text === 'string') node.textContent = text;
    return node;
  }

  function kinds(person) {
    return person.clips.reduce(function (set, clip) {
      set[clip.kind] = true;
      if (clip.language === 'en') set.english = true;
      if (clip.newCut) set.new = true;
      return set;
    }, {});
  }

  function hasEnglish(person) {
    return person.clips.some(function (clip) { return clip.language === 'en'; });
  }

  function hasNewCut(person) {
    return person.clips.some(function (clip) { return clip.newCut; });
  }

  function matches(person) {
    var query = (search.value || '').trim().toLocaleLowerCase();
    var profileTranslation = profileCopy(person);
    var searchable = [person.name, person.context || '', person.intro, profileTranslation.introEn || '', profileTranslation.testimonyEs || '', profileTranslation.testimonyEn || ''].concat(person.clips.map(function (clip) {
      var translated = clipCopy(clip);
      return [clip.title, clip.summary, clip.quote, translated.titleEn, translated.summaryEn, translated.quoteEn].join(' ');
    })).join(' ').toLocaleLowerCase();
    var hasFilter = activeFilter === 'all' || kinds(person)[activeFilter];
    return hasFilter && (!query || searchable.indexOf(query) !== -1);
  }

  function card(person) {
    var button = el('button', 'person-card');
    button.type = 'button';
    button.setAttribute('aria-label', label('Abrir perfil de ', 'Open profile for ') + person.name);
    var portrait = el('span', 'portrait');
    var image = document.createElement('img');
    image.src = person.avatar;
    image.alt = label('Retrato ilustrado de ', 'Illustrated portrait of ') + person.name;
    image.loading = 'lazy';
    portrait.appendChild(image);
    if (person.faceless) portrait.appendChild(el('span', 'faceless', label('Sin rostro', 'Faceless')));
    var copy = el('span', 'person-copy');
    copy.appendChild(el('h2', '', person.name));
    var meta = el('span', 'person-meta');
    meta.appendChild(el('span', '', person.clips.length + ' ' + label(person.clips.length === 1 ? 'corto' : 'cortos', person.clips.length === 1 ? 'clip' : 'clips')));
    if (hasEnglish(person)) meta.appendChild(el('span', 'clip-badge', label('En inglés', 'In English')));
    if (hasNewCut(person)) meta.appendChild(el('span', 'clip-badge', label('Nuevo', 'New')));
    meta.appendChild(el('span', 'open', label('Conocer su voz →', 'Meet their voice →')));
    copy.appendChild(meta);
    button.appendChild(portrait);
    button.appendChild(copy);
    button.addEventListener('click', function () { openProfile(person); });
    return button;
  }

  function kindLabel(kind) {
    if (kind === 'beacon') return label('El Beacon', 'The Beacon');
    if (kind === 'myth') return label('El mito', 'The myth');
    return label('La experiencia', 'The experience');
  }

  function dateLabel(clip) {
    if (language() !== 'en') return clip.dateLabel;
    return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(clip.date + 'T12:00:00Z'));
  }

  function clipView(clip, person) {
    var translated = clipCopy(clip);
    var article = el('article', 'clip');
    var video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.poster = person.avatar;
    video.src = clip.video;
    video.setAttribute('aria-label', label(clip.title, translated.titleEn || clip.title) + ' — ' + person.name);
    var copy = el('div', 'clip-copy');
    var heading = el('div', 'clip-heading');
    heading.appendChild(el('span', 'clip-kicker', kindLabel(clip.kind) + ' · ' + dateLabel(clip)));
    if (clip.language === 'en') heading.appendChild(el('span', 'clip-badge', label('Audio en inglés', 'English audio')));
    if (clip.newCut) heading.appendChild(el('span', 'clip-badge', label('Nuevo corte', 'New clip')));
    copy.appendChild(heading);
    copy.appendChild(el('h3', '', label(clip.title, translated.titleEn || clip.title)));
    copy.appendChild(el('p', 'clip-summary', label(clip.summary, translated.summaryEn || clip.summary)));
    copy.appendChild(el('blockquote', '', '“' + label(clip.quote, translated.quoteEn || clip.quote) + '”'));
    article.appendChild(video);
    article.appendChild(copy);
    return article;
  }

  function openProfile(person) {
    activePerson = person;
    var translated = profileCopy(person);
    var head = el('div', 'dialog-head');
    var figure = el('figure', 'myth-figure');
    var image = document.createElement('img');
    image.className = 'dialog-avatar';
    image.src = person.mythImage || person.avatar;
    image.alt = label('Imagen inspirada en el relato de ', 'Image inspired by the account of ') + person.name;
    figure.appendChild(image);
    figure.appendChild(el('figcaption', 'myth-caption', label('Imagen inspirada en su relato', 'Image inspired by their account')));
    var copy = el('div');
    copy.appendChild(el('span', 'eyebrow', person.context || label('Participante', 'Participant')));
    var title = el('h2', 'dialog-title', person.name);
    title.id = 'dialogTitle';
    copy.appendChild(title);
    copy.appendChild(el('p', 'dialog-intro', label(person.intro, translated.introEn || person.intro)));
    copy.appendChild(el('span', 'ai-label', label('Interpretación visual generada con IA', 'AI-generated visual interpretation')));
    var testimony = el('div', 'testimony-text');
    testimony.appendChild(el('span', 'testimony-label', label('En su propia voz', 'In their own words')));
    testimony.appendChild(el('blockquote', '', '“' + label(translated.testimonyEs || '', translated.testimonyEn || translated.testimonyEs || '') + '”'));
    testimony.appendChild(el('span', 'translation-note', label('Traducción al inglés disponible en EN', 'Editorial translation from the original testimony')));
    copy.appendChild(testimony);
    head.appendChild(figure);
    head.appendChild(copy);
    var clips = el('div', 'clips');
    person.clips.slice().sort(function (a, b) { return a.date.localeCompare(b.date) || a.code.localeCompare(b.code); }).forEach(function (clip) {
      clips.appendChild(clipView(clip, person));
    });
    dialogContent.replaceChildren(head, clips);
    if (!dialog.open) dialog.showModal();
    closeButton.focus();
  }

  function closeDialog() {
    dialog.querySelectorAll('video').forEach(function (video) { video.pause(); });
    dialog.close();
    activePerson = null;
  }

  function render() {
    var visible = data.filter(matches);
    grid.replaceChildren();
    visible.forEach(function (person) { grid.appendChild(card(person)); });
    if (!visible.length) grid.appendChild(el('p', 'empty', label('No encontramos voces con ese filtro.', 'No voices match that filter.')));
    count.textContent = visible.length + ' / ' + data.length;
    search.setAttribute('aria-label', label('Buscar una persona', 'Find a person'));
    toolsRegion.setAttribute('aria-label', label('Explorar testimonios', 'Explore testimonials'));
    filtersRegion.setAttribute('aria-label', label('Filtrar testimonios', 'Filter testimonials'));
    closeButton.setAttribute('aria-label', label('Cerrar', 'Close'));
  }

  filters.forEach(function (button) {
    button.addEventListener('click', function () {
      activeFilter = button.getAttribute('data-filter');
      filters.forEach(function (item) { item.setAttribute('aria-pressed', item === button ? 'true' : 'false'); });
      render();
    });
  });
  search.addEventListener('input', render);
  closeButton.addEventListener('click', closeDialog);
  dialog.addEventListener('click', function (event) { if (event.target === dialog) closeDialog(); });
  dialog.addEventListener('cancel', function (event) { event.preventDefault(); closeDialog(); });

  new MutationObserver(function () {
    render();
    if (dialog.open && activePerson) openProfile(activePerson);
  }).observe(root, { attributes: true, attributeFilter: ['data-active-lang'] });
  render();
}());
