(function () {
  'use strict';

  var works = Array.isArray(window.HMP_GALLERY_DATA) ? window.HMP_GALLERY_DATA.slice() : [];
  var root = document.documentElement;
  var grid = document.getElementById('artGrid');
  var count = document.getElementById('galleryCount');
  var lightbox = document.getElementById('artLightbox');
  var lightboxImage = document.getElementById('lightboxImage');
  var lightboxDate = document.getElementById('lightboxDate');
  var closeButton = document.getElementById('lightboxClose');
  var activeWork = null;

  function language() {
    return root.getAttribute('data-active-lang') === 'en' ? 'en' : 'es';
  }

  function label(es, en) {
    return language() === 'en' ? en : es;
  }

  function dateLabel(isoDate) {
    var parts = isoDate.split('-').map(Number);
    var date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return new Intl.DateTimeFormat(language() === 'en' ? 'en-US' : 'es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(date);
  }

  function artAlt(work) {
    return label(
      'Interpretación visual del Mythbot · ' + dateLabel(work.date),
      'Visual interpretation by the Mythbot · ' + dateLabel(work.date)
    );
  }

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (typeof text === 'string') node.textContent = text;
    return node;
  }

  function openWork(work) {
    activeWork = work;
    lightboxImage.src = work.src;
    lightboxImage.alt = artAlt(work);
    lightboxDate.dateTime = work.date;
    lightboxDate.textContent = dateLabel(work.date);
    lightbox.setAttribute('aria-label', artAlt(work));
    if (!lightbox.open) lightbox.showModal();
    closeButton.focus();
  }

  function closeLightbox() {
    lightbox.close();
    lightboxImage.removeAttribute('src');
    activeWork = null;
  }

  function card(work) {
    var button = element('button', 'art-card');
    button.type = 'button';
    button.setAttribute('aria-label', label('Ampliar obra del ', 'Enlarge work from ') + dateLabel(work.date));

    var frame = element('span', 'art-frame');
    var image = element('img');
    image.src = work.src;
    image.alt = artAlt(work);
    image.loading = 'lazy';
    image.decoding = 'async';
    image.width = 1254;
    image.height = 1254;
    frame.appendChild(image);

    var date = element('time', 'art-date', dateLabel(work.date));
    date.dateTime = work.date;
    button.appendChild(frame);
    button.appendChild(date);
    button.addEventListener('click', function () { openWork(work); });
    return button;
  }

  function render() {
    grid.replaceChildren();
    works.sort(function (a, b) { return a.date.localeCompare(b.date) || a.src.localeCompare(b.src); });
    works.forEach(function (work) { grid.appendChild(card(work)); });
    if (!works.length) grid.appendChild(element('p', 'empty', label('La galería todavía no tiene obras.', 'The gallery does not have any works yet.')));
    count.textContent = works.length + ' ' + label('obras', 'works');
    closeButton.setAttribute('aria-label', label('Cerrar', 'Close'));
    if (activeWork && lightbox.open) openWork(activeWork);
  }

  closeButton.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function (event) { if (event.target === lightbox) closeLightbox(); });
  lightbox.addEventListener('cancel', function (event) { event.preventDefault(); closeLightbox(); });

  new MutationObserver(render).observe(root, { attributes: true, attributeFilter: ['data-active-lang'] });
  render();
}());
