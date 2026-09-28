/* Second Earth · comportements communs (menu, copie, filtres des fiches). Aucune dépendance. */
(function () {
  'use strict';

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () { return fallback(text); });
    }
    return fallback(text);
  }
  function fallback(text) {
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', '');
      ta.style.position = 'absolute'; ta.style.left = '-9999px';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? resolve() : reject(); } catch (e) { reject(e); }
      document.body.removeChild(ta);
    });
  }
  window.SE_copy = copyText;

  // Boutons « Copier » des blocs de prompt
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-copy]');
    if (!b) return;
    var box = b.closest('.prompt');
    var pre = box && box.querySelector('pre');
    if (!pre) return;
    var label = b.textContent;
    copyText(pre.textContent).then(function () {
      b.textContent = 'Copié'; b.classList.add('done');
      setTimeout(function () { b.textContent = label; b.classList.remove('done'); }, 2000);
    }, function () {
      b.textContent = 'Échec'; setTimeout(function () { b.textContent = label; }, 2000);
    });
  });

  // Colonne de navigation repliable sur téléphone
  document.querySelectorAll('.side-toggle').forEach(function (t) {
    t.addEventListener('click', function () {
      var s = t.closest('.side');
      var open = s.classList.toggle('open');
      t.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  // Menu du haut : fermer quand on clique ailleurs
  document.addEventListener('click', function (ev) {
    document.querySelectorAll('details.menu[open]').forEach(function (d) {
      if (!d.contains(ev.target)) d.removeAttribute('open');
    });
  });

  // Filtres des fiches (bestiaire, flore)
  var list = document.querySelector('[data-fiches]');
  if (list) {
    var q = document.querySelector('[data-q]');
    var chips = Array.prototype.slice.call(document.querySelectorAll('[data-grp]'));
    var groups = Array.prototype.slice.call(list.querySelectorAll('.grp'));
    var count = document.querySelector('[data-count]');
    var empty = document.querySelector('[data-empty]');
    var cur = 'tout';
    var norm = function (s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
    groups.forEach(function (g) {
      g.querySelectorAll('.fiche').forEach(function (f) { f._t = norm(f.textContent); });
    });
    function apply() {
      var t = norm(q ? q.value.trim() : '');
      var n = 0;
      groups.forEach(function (g) {
        var okG = cur === 'tout' || g.getAttribute('data-g') === cur;
        var k = 0;
        g.querySelectorAll('.fiche').forEach(function (f) {
          var ok = okG && (!t || f._t.indexOf(t) !== -1);
          f.hidden = !ok; if (ok) k++;
        });
        g.hidden = k === 0; n += k;
      });
      if (count) count.textContent = n + (n > 1 ? ' fiches' : ' fiche');
      if (empty) empty.hidden = n !== 0;
    }
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        cur = c.getAttribute('data-grp');
        chips.forEach(function (x) { x.classList.toggle('on', x === c); x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
        apply();
      });
    });
    if (q) q.addEventListener('input', apply);
    apply();
  }

  // Fiche ciblée par l'adresse : surbrillance maintenue, un clic dans le vide relâche
  function markTarget() {
    document.querySelectorAll('.fiche.hl').forEach(function (f) { f.classList.remove('hl'); });
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    var el = document.getElementById(id);
    if (el && el.classList.contains('fiche')) el.classList.add('hl');
  }
  window.addEventListener('hashchange', markTarget);
  markTarget();
  document.addEventListener('click', function (ev) {
    var f = ev.target.closest('.fiche');
    if (f) {
      document.querySelectorAll('.fiche.hl').forEach(function (x) { if (x !== f) x.classList.remove('hl'); });
      if (!ev.target.closest('a,button,summary')) f.classList.add('hl');
    } else if (!ev.target.closest('.tools')) {
      document.querySelectorAll('.fiche.hl').forEach(function (x) { x.classList.remove('hl'); });
    }
  });
})();
