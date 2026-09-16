// Scroll-in reveal for .reveal sections/cards and a count-up animation for
// [data-countup] numbers (currency/hour values already localized by
// i18n.js). Both degrade to "just show the final state" when JS is slow,
// disabled, or the visitor prefers reduced motion — see the .js-gated CSS
// in landing.css and the <noscript> fallback in index.html.
(function () {
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var revealTargets = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealTargets.length) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    revealTargets.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealTargets.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  // "€90,53" -> { prefix: "€", value: 90.53, decimals: 2, sep: ",", suffix: "" }
  // Only handles a single decimal group (no thousands separators) — the only
  // shape our example numbers ever take.
  function parseDisplayNumber(text) {
    var match = text.match(/^([^\d]*)([\d.,]+)([^\d]*)$/);
    if (!match) return null;
    var prefix = match[1];
    var numStr = match[2];
    var suffix = match[3];
    var lastComma = numStr.lastIndexOf(',');
    var lastDot = numStr.lastIndexOf('.');
    var decIndex = Math.max(lastComma, lastDot);
    if (decIndex === -1) {
      return { prefix: prefix, suffix: suffix, value: parseInt(numStr, 10) || 0, decimals: 0, sep: '.' };
    }
    var sep = numStr.charAt(decIndex);
    var intPart = numStr.slice(0, decIndex).replace(/[.,]/g, '');
    var fracPart = numStr.slice(decIndex + 1);
    return {
      prefix: prefix,
      suffix: suffix,
      value: parseFloat(intPart + '.' + fracPart) || 0,
      decimals: fracPart.length,
      sep: sep,
    };
  }

  function formatDisplayNumber(n, parsed) {
    var out = n.toFixed(parsed.decimals);
    if (parsed.sep !== '.') out = out.replace('.', parsed.sep);
    return parsed.prefix + out + parsed.suffix;
  }

  function animateCountUp(el) {
    var parsed = parseDisplayNumber(el.textContent.trim());
    if (!parsed) return;
    var duration = 900;
    var start = null;

    function frame(timestamp) {
      if (start === null) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      el.textContent = formatDisplayNumber(parsed.value * eased, parsed);
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var countupTargets = document.querySelectorAll('[data-countup]');
  if (prefersReducedMotion || !('IntersectionObserver' in window) || !countupTargets.length) return;

  var countupObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animateCountUp(entry.target);
        countupObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.6 }
  );
  countupTargets.forEach(function (el) {
    countupObserver.observe(el);
  });
})();
