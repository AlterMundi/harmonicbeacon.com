/* Photo language follows the existing Beacon language control. No new viewer or service. */
(function () {
  'use strict';
  var root = document.documentElement;
  function localizePhotos() {
    var english = root.getAttribute('data-active-lang') === 'en';
    document.querySelectorAll('[data-story-photo]').forEach(function (link) {
      var image = link.querySelector('img');
      var description = image.getAttribute(english ? 'data-alt-en' : 'data-alt-es');
      image.alt = description;
      link.setAttribute('aria-label', (english ? 'Enlarge photo: ' : 'Ampliar foto: ') + description);
    });
  }
  localizePhotos();
  new MutationObserver(localizePhotos).observe(root, { attributes: true, attributeFilter: ['data-active-lang'] });
})();
