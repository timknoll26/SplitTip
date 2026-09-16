// Wires up every [data-lang-toggle] button and applies window.SPLITTIP_TRANSLATIONS
// (loaded first, see index.html) to every [data-i18n]/[data-i18n-html]/[data-i18n-aria]
// element. Shares the same localStorage key (and zustand-persist JSON shape) as the
// React app's language store, so a preference set on either side carries over to the
// other since both live under the same origin.
(function () {
  var KEY = 'splittip-language';

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return 'de';
      var parsed = JSON.parse(raw);
      return parsed && parsed.state && parsed.state.language === 'en' ? 'en' : 'de';
    } catch {
      return 'de';
    }
  }

  function write(lang) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ state: { language: lang }, version: 0 }));
    } catch {
      // localStorage unavailable (e.g. private mode) — preference just won't persist
    }
  }

  function apply(lang) {
    var dict = (window.SPLITTIP_TRANSLATIONS && window.SPLITTIP_TRANSLATIONS[lang]) || {};
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var text = dict[el.getAttribute('data-i18n')];
      if (text != null) el.textContent = text;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var html = dict[el.getAttribute('data-i18n-html')];
      if (html != null) el.innerHTML = html;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var text = dict[el.getAttribute('data-i18n-aria')];
      if (text != null) el.setAttribute('aria-label', text);
    });

    document.querySelectorAll('[data-lang-toggle]').forEach(function (btn) {
      btn.textContent = lang.toUpperCase();
      btn.setAttribute('aria-label', dict['langToggle.switchTo'] || 'Switch language');
    });
  }

  apply(read());

  document.querySelectorAll('[data-lang-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = read() === 'de' ? 'en' : 'de';
      write(next);
      apply(next);
    });
  });
})();
