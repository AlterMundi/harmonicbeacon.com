(function () {
  'use strict';

  var data = Array.isArray(window.HMP_REVIEW_DATA) ? window.HMP_REVIEW_DATA : [];
  var root = document.documentElement;
  var grid = document.getElementById('peopleGrid');
  var count = document.getElementById('resultCount');
  var search = document.getElementById('voiceSearch');
  var filters = [].slice.call(document.querySelectorAll('[data-filter]'));
  var dialog = document.getElementById('profileDialog');
  var dialogContent = document.getElementById('dialogContent');
  var closeButton = document.getElementById('dialogClose');
  var activeFilter = 'all';

  function language() {
    return root.getAttribute('data-active-lang') === 'en' ? 'en' : 'es';
  }

  function label(es, en) {
    return language() === 'en' ? en : es;
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
    var searchable = [person.name, person.context || ''].concat(person.clips.map(function (clip) {
      return [clip.title, clip.summary, clip.quote].join(' ');
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

  function clipView(clip, person) {
    var article = el('article', 'clip');
    var video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.poster = person.avatar;
    video.src = clip.video;
    video.setAttribute('aria-label', clip.title + ' — ' + person.name);
    var copy = el('div', 'clip-copy');
    var heading = el('div', 'clip-heading');
    heading.appendChild(el('span', 'clip-kicker', kindLabel(clip.kind) + ' · ' + clip.dateLabel));
    if (clip.language === 'en') heading.appendChild(el('span', 'clip-badge', label('Audio en inglés', 'English audio')));
    if (clip.newCut) heading.appendChild(el('span', 'clip-badge', label('Nuevo corte', 'New clip')));
    copy.appendChild(heading);
    copy.appendChild(el('h3', '', clip.title));
    copy.appendChild(el('p', 'clip-summary', clip.summary));
    copy.appendChild(el('blockquote', '', '“' + clip.quote + '”'));
    article.appendChild(video);
    article.appendChild(copy);
    return article;
  }

  function openProfile(person) {
    var head = el('div', 'dialog-head');
    var image = document.createElement('img');
    image.className = 'dialog-avatar';
    image.src = person.avatar;
    image.alt = label('Retrato ilustrado de ', 'Illustrated portrait of ') + person.name;
    var copy = el('div');
    copy.appendChild(el('span', 'eyebrow', person.context || label('Participante', 'Participant')));
    var title = el('h2', 'dialog-title', person.name);
    title.id = 'dialogTitle';
    copy.appendChild(title);
    copy.appendChild(el('p', 'dialog-intro', person.intro));
    copy.appendChild(el('span', 'ai-label', label('Retrato ilustrado generado con IA', 'AI-generated illustrated portrait')));
    head.appendChild(image);
    head.appendChild(copy);
    var clips = el('div', 'clips');
    person.clips.slice().sort(function (a, b) { return a.date.localeCompare(b.date) || a.code.localeCompare(b.code); }).forEach(function (clip) {
      clips.appendChild(clipView(clip, person));
    });
    dialogContent.replaceChildren(head, clips);
    dialog.showModal();
    closeButton.focus();
  }

  function closeDialog() {
    dialog.querySelectorAll('video').forEach(function (video) { video.pause(); });
    dialog.close();
  }

  function render() {
    var visible = data.filter(matches);
    grid.replaceChildren();
    visible.forEach(function (person) { grid.appendChild(card(person)); });
    if (!visible.length) grid.appendChild(el('p', 'empty', label('No encontramos voces con ese filtro.', 'No voices match that filter.')));
    count.textContent = visible.length + ' / ' + data.length;
    search.setAttribute('aria-label', label('Buscar una persona', 'Find a person'));
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

  new MutationObserver(render).observe(root, { attributes: true, attributeFilter: ['data-active-lang'] });
  render();
}());
