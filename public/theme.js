// Wires up every [data-theme-toggle] button on the page. The actual class
// (light/dark) is already set by the inline blocking script in <head> before
// this file loads, so there's no flash — this just adds the click behavior
// and keeps aria-pressed in sync.
(function () {
  var KEY = 'splittip-theme';

  function current() {
    try {
      return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  }

  function apply(theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    });
  }

  apply(current());

  document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(KEY, next);
      } catch {
        // localStorage unavailable (e.g. private mode) — preference just won't persist
      }
      apply(next);
    });
  });
})();
