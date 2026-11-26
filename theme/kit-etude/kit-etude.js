/* KIT ÉTUDE — les comportements. Sans dépendance, sans bundler : un seul objet, window.KitEtude.
   Tout ce qui porte une classe du kit se monte seul au chargement (KitEtude.monter(racine) pour un morceau ajouté plus tard).
   Trois règles tenues partout : le clavier fait le même geste que la main ; rien ne bouge sans la main ; la molette n'est jamais volée
   (un zoom demande Ctrl + molette, ou le pincement ; la molette seule laisse défiler la page).
   Chaque composant réglable émet « ke:change » (detail.valeur) sur son élément. */
(function () {
  'use strict';
  var KE = window.KitEtude = {};
  var NS = 'http://www.w3.org/2000/svg';
  var calme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Les outils ── */
  function el(nom, attrs, enfants) {
    var n = document.createElement(nom), k;
    for (k in attrs || {}) { if (k === 'text') n.textContent = attrs[k]; else if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]); }
    (enfants || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function svg(nom, attrs) { var n = document.createElementNS(NS, nom), k; for (k in attrs || {}) n.setAttribute(k, attrs[k]); return n; }
  function borne(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function mix(a, b, x) { return a + (b - a) * x; }
  function seg(t, a, b) { var x = borne((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function tous(racine, sel) { return [].slice.call((racine || document).querySelectorAll(sel)); }
  function emettre(n, nom, detail) { n.dispatchEvent(new CustomEvent(nom, { bubbles: true, detail: detail })); }
  function inerte(n) { return n.getAttribute('aria-disabled') === 'true'; }
  /* tirer : un geste de pointeur, capturé jusqu'au lâcher */
  function tirer(n, debut, bouge, fin) {
    n.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      var ctx = debut(e); if (ctx === false) return;
      e.preventDefault(); try { n.setPointerCapture(e.pointerId); } catch (x) { /* un pointeur de synthèse n'a rien à capturer */ }
      function mv(ev) { bouge(ev, ctx); }
      function up(ev) { n.removeEventListener('pointermove', mv); n.removeEventListener('pointerup', up); n.removeEventListener('pointercancel', up); if (fin) fin(ev, ctx); }
      n.addEventListener('pointermove', mv); n.addEventListener('pointerup', up); n.addEventListener('pointercancel', up);
    });
  }
  /* une valeur bornée, à pas : le modèle commun du curseur, du potard et du fader */
  function modele(n) {
    var d = n.dataset, min = d.min !== undefined ? +d.min : 0, max = d.max !== undefined ? +d.max : 100, pas = +d.pas || 1;
    var dec = (String(pas).split('.')[1] || '').length;
    return {
      min: min, max: max, pas: pas, unite: d.unite || '',
      rond: function (x) { return +(borne(Math.round((x - min) / pas) * pas + min, min, max)).toFixed(dec); },
      frac: function (x) { return (x - min) / (max - min); },
      de: function (f) { return min + borne(f, 0, 1) * (max - min); },
      dire: function (x) { return (x < 0 ? '−' + Math.abs(x).toFixed(dec) : x.toFixed(dec)).replace('.', ','); }
    };
  }
  function touchePas(e, m) {   /* la même table de touches pour tout ce qui se règle */
    var gros = Math.max(m.pas, (m.max - m.min) / 10), fin = e.shiftKey ? m.pas : m.pas;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowUp': return fin;
      case 'ArrowLeft': case 'ArrowDown': return -fin;
      case 'PageUp': return gros; case 'PageDown': return -gros;
      case 'Home': return -Infinity; case 'End': return Infinity;
    }
    return null;
  }

  /* ════ Le curseur : simple, à deux poignées (data-valeur2), vertical (data-vertical), à crans (data-crans="0,25,50") ════ */
  KE.curseur = function (n) {
    if (n._ke) return n._ke;
    var m = modele(n), vertical = n.hasAttribute('data-vertical'), deux = n.dataset.valeur2 !== undefined;
    var v = [m.rond(+n.dataset.valeur || m.min)]; if (deux) v.push(m.rond(+n.dataset.valeur2));
    var depart = v.slice(), nom = n.getAttribute('aria-label') || '';
    var zone = el('span', { class: 'ke-c-zone' }, [el('span', { class: 'ke-c-voie' }), el('span', { class: 'ke-c-plein' })]);
    if (n.dataset.crans) { var crans = el('span', { class: 'ke-c-crans' }); n.dataset.crans.split(',').forEach(function (c) { var f = m.frac(+c) * 100; crans.appendChild(el('i', { style: (vertical ? 'bottom:' : 'left:') + f + '%' }, [el('b', { text: m.dire(+c) })])); }); zone.appendChild(crans); }
    var mains = v.map(function (_, i) {
      var h = el('span', { class: 'ke-c-main', role: 'slider', tabindex: inerte(n) ? '-1' : '0', 'aria-valuemin': m.min, 'aria-valuemax': m.max, 'aria-orientation': vertical ? 'vertical' : 'horizontal', 'aria-label': deux ? nom + (i ? ', fin' : ', début') : nom });
      h.addEventListener('keydown', function (e) { var p = touchePas(e, m); if (p === null) return; e.preventDefault(); poser(i, p === Infinity ? m.max : p === -Infinity ? m.min : v[i] + p, true); });
      zone.appendChild(h); return h;
    });
    n.removeAttribute('aria-label'); n.appendChild(zone);
    var sortie = n.closest('.ke-reglage') && n.closest('.ke-reglage').querySelector('output');
    function peindre() {
      n.style.setProperty('--a', deux ? m.frac(v[0]) : 0); n.style.setProperty('--b', m.frac(v[deux ? 1 : 0]));
      mains.forEach(function (h, i) { h.style.setProperty('--p', m.frac(v[i])); h.setAttribute('aria-valuenow', v[i]); h.setAttribute('aria-valuetext', m.dire(v[i]) + (m.unite ? ' ' + m.unite : '')); });
      if (sortie) sortie.textContent = v.map(m.dire).join(' – ') + (m.unite ? ' ' + m.unite : '');
    }
    function poser(i, x, dit) {
      x = m.rond(x); if (deux) x = i === 0 ? Math.min(x, v[1]) : Math.max(x, v[0]);
      if (x === v[i]) return; v[i] = x; peindre(); if (dit) emettre(n, 'ke:change', { valeur: deux ? v.slice() : v[0] });
    }
    function lire(e) { var r = zone.getBoundingClientRect(); return m.de(vertical ? (r.bottom - e.clientY) / r.height : (e.clientX - r.left) / r.width); }
    tirer(n, function (e) {
      if (inerte(n)) return false;
      var x = lire(e), i = deux && Math.abs(x - v[1]) < Math.abs(x - v[0]) ? 1 : deux && x > v[1] ? 1 : 0;
      mains[i].focus({ preventScroll: true }); mains[i].classList.add('tenu'); n.classList.add('tenu'); poser(i, x, true); return { i: i };
    }, function (e, c) { poser(c.i, lire(e), true); }, function (e, c) { mains[c.i].classList.remove('tenu'); n.classList.remove('tenu'); });
    n.addEventListener('dblclick', function () { if (inerte(n)) return; depart.forEach(function (x, i) { v[i] = x; }); peindre(); emettre(n, 'ke:change', { valeur: deux ? v.slice() : v[0] }); });
    peindre();
    return (n._ke = { valeur: function (x) { if (x === undefined) return deux ? v.slice() : v[0]; [].concat(x).forEach(function (y, i) { v[i] = m.rond(y); }); peindre(); } });
  };

  /* ════ Le potard : un arc de 270°, la valeur au centre. On tire vers le haut ; Maj affine ; double-clic revient ; data-crans="5" pose des crans,
     data-centre fait partir l'arc du milieu (une balance) ════ */
  function pointArc(a, r) { var t = (a - 90) * Math.PI / 180; return [50 + r * Math.cos(t), 50 + r * Math.sin(t)]; }
  function arc(a0, a1, r) { if (a1 < a0) { var z = a0; a0 = a1; a1 = z; } var p = pointArc(a0, r), q = pointArc(a1, r); return 'M' + p[0].toFixed(2) + ' ' + p[1].toFixed(2) + 'A' + r + ' ' + r + ' 0 ' + (a1 - a0 > 180 ? 1 : 0) + ' 1 ' + q[0].toFixed(2) + ' ' + q[1].toFixed(2); }
  KE.potard = function (n) {
    if (n._ke) return n._ke;
    var m = modele(n), v = m.rond(n.dataset.valeur !== undefined ? +n.dataset.valeur : m.min), depart = v, centre = n.hasAttribute('data-centre'), R = 43;
    var nbCrans = +n.dataset.crans || 0, crans = [];
    var s = svg('svg', { viewBox: '0 0 100 100', 'aria-hidden': 'true' }), voie = svg('path', { class: 'ke-p-voie', d: arc(-135, 135, R) }), val = svg('path', { class: 'ke-p-arc' }), prise = svg('circle', { class: 'ke-p-prise', r: 3.6 });
    s.appendChild(voie);
    for (var i = 0; i < nbCrans; i++) { var a = -135 + 270 * i / (nbCrans - 1), p = pointArc(a, R + 4), q = pointArc(a, R + 8), c = svg('line', { class: 'ke-p-cran', x1: p[0], y1: p[1], x2: q[0], y2: q[1] }); crans.push(c); s.appendChild(c); }
    s.appendChild(val); s.appendChild(prise);
    var sortie = el('output'), cadran = el('span', { class: 'ke-p-cadran' }, [s]);
    var legende = n.querySelector('.ke-petit'); n.insertBefore(cadran, n.firstChild);
    if (n.classList.contains('petit')) n.insertBefore(sortie, legende); else cadran.appendChild(sortie);
    n.setAttribute('role', 'slider'); n.setAttribute('tabindex', inerte(n) ? '-1' : '0'); n.setAttribute('aria-valuemin', m.min); n.setAttribute('aria-valuemax', m.max);
    if (!n.getAttribute('aria-label') && legende) n.setAttribute('aria-label', legende.textContent);
    function peindre() {
      var f = m.frac(v), a = -135 + 270 * f, p = pointArc(a, R);
      val.setAttribute('d', arc(centre ? 0 : -135, a === (centre ? 0 : -135) ? a + .01 : a, R)); prise.setAttribute('cx', p[0]); prise.setAttribute('cy', p[1]);
      crans.forEach(function (c, i) { c.classList.toggle('ici', Math.abs(i / (nbCrans - 1) - f) < .5 / (nbCrans - 1) / 2); });
      sortie.textContent = ''; sortie.appendChild(document.createTextNode(m.dire(v))); if (m.unite) sortie.appendChild(el('small', { text: m.unite }));
      n.setAttribute('aria-valuenow', v); n.setAttribute('aria-valuetext', m.dire(v) + (m.unite ? ' ' + m.unite : ''));
    }
    function poser(x, dit) { x = m.rond(x); if (x === v) return; v = x; peindre(); if (dit) emettre(n, 'ke:change', { valeur: v }); }
    tirer(n, function (e) { if (inerte(n)) return false; n.focus({ preventScroll: true }); n.classList.add('tenu'); return { y: e.clientY, f: m.frac(v) }; },
      function (e, c) { poser(m.de(c.f + (c.y - e.clientY) / (e.shiftKey ? 800 : 180)), true); },
      function () { n.classList.remove('tenu'); });
    n.addEventListener('keydown', function (e) { var p = touchePas(e, m); if (p === null) return; e.preventDefault(); poser(p === Infinity ? m.max : p === -Infinity ? m.min : v + p, true); });
    n.addEventListener('dblclick', function () { if (!inerte(n)) poser(depart, true); });
    /* la molette ne règle que le potard qui a le focus : survolé seulement, la page défile */
    n.addEventListener('wheel', function (e) { if (document.activeElement !== n || inerte(n)) return; e.preventDefault(); poser(v + (e.deltaY < 0 ? 1 : -1) * m.pas, true); }, { passive: false });
    peindre();
    return (n._ke = { valeur: function (x) { if (x === undefined) return v; v = m.rond(x); peindre(); } });
  };

  /* ════ Le fader d'une console (vertical, des repères en dB) et le vu-mètre en traits ════ */
  KE.fader = function (n) {
    if (n._ke) return n._ke;
    var m = modele(n), v = m.rond(n.dataset.valeur !== undefined ? +n.dataset.valeur : m.min), depart = v;
    var zone = el('span', { class: 'ke-f-zone' }, [el('span', { class: 'ke-f-voie' })]);
    (n.dataset.reperes || '').split(',').filter(Boolean).forEach(function (r) { zone.appendChild(el('span', { class: 'ke-f-repere' + (+r === 0 ? ' zero' : ''), style: '--y:' + m.frac(+r) }, [el('b', { text: (+r < 0 ? '−' : '') + Math.abs(+r) })])); });
    var main = el('span', { class: 'ke-f-main', role: 'slider', tabindex: inerte(n) ? '-1' : '0', 'aria-orientation': 'vertical', 'aria-valuemin': m.min, 'aria-valuemax': m.max, 'aria-label': n.getAttribute('aria-label') || '' });
    n.removeAttribute('aria-label'); zone.appendChild(main); n.appendChild(zone);
    function peindre() { n.style.setProperty('--p', m.frac(v)); main.setAttribute('aria-valuenow', v); main.setAttribute('aria-valuetext', m.dire(v) + ' ' + m.unite); }
    function poser(x, dit) { x = m.rond(x); if (x === v) return; v = x; peindre(); if (dit) emettre(n, 'ke:change', { valeur: v }); }
    tirer(n, function (e) {
      if (inerte(n)) return false; main.focus({ preventScroll: true }); main.classList.add('tenu');
      var r = zone.getBoundingClientRect(), surMain = e.target === main; if (!surMain) poser(m.de((r.bottom - e.clientY) / r.height), true);
      return { y: e.clientY, f: m.frac(v), h: r.height };
    }, function (e, c) { poser(m.de(c.f + (c.y - e.clientY) / c.h / (e.shiftKey ? 4 : 1)), true); }, function () { main.classList.remove('tenu'); });
    main.addEventListener('keydown', function (e) { var p = touchePas(e, m); if (p === null) return; e.preventDefault(); poser(p === Infinity ? m.max : p === -Infinity ? m.min : v + p, true); });
    n.addEventListener('dblclick', function () { if (!inerte(n)) poser(depart, true); });
    peindre();
    return (n._ke = { valeur: function (x) { if (x === undefined) return v; v = m.rond(x); peindre(); }, dire: m.dire });
  };
  /* vu(n).niveau([gauche, droite]) : des niveaux de 0 à 1 ; au-delà de data-haut (0,86 par défaut) les traits passent à l'orange */
  KE.vu = function (n) {
    if (n._ke) return n._ke;
    var voies = +n.dataset.voies || 2, nb = +n.dataset.traits || 30, haut = +n.dataset.haut || .86, cols = [], cretes = [];
    for (var c = 0; c < voies; c++) { var col = el('span', { class: 'ke-vu-voie' }); for (var i = 0; i < nb; i++) col.appendChild(el('i', i / nb >= haut ? { class: 'haut' } : {})); cols.push(col); cretes.push(0); n.appendChild(col); }
    n.setAttribute('role', 'img');
    function niveau(x) {
      [].concat(x).forEach(function (f, c) {
        if (!cols[c]) return; var k = Math.round(borne(f, 0, 1) * nb); cretes[c] = Math.max(cretes[c] - .4, k);
        [].forEach.call(cols[c].children, function (t, i) { t.classList.toggle('on', i < k); t.classList.toggle('crete', i === Math.round(cretes[c]) - 1 && i >= k); });
      });
    }
    if (n.dataset.niveau) niveau(n.dataset.niveau.split(',').map(Number));
    return (n._ke = { niveau: niveau });
  };

  /* ════ Les onglets ════ flèches, Début, Fin ; l'onglet choisi montre son panneau (aria-controls) */
  KE.onglets = function (n) {
    if (n._ke) return; n._ke = true;
    var tabs = tous(n, '[role="tab"]');
    function choisir(t, focus) {
      if (inerte(t)) return;
      tabs.forEach(function (x) { var oui = x === t; x.setAttribute('aria-selected', oui ? 'true' : 'false'); x.tabIndex = oui ? 0 : -1; var p = document.getElementById(x.getAttribute('aria-controls')); if (p) p.hidden = !oui; });
      if (focus) t.focus(); emettre(n, 'ke:change', { valeur: t.id || tabs.indexOf(t) });
    }
    tabs.forEach(function (t, i) {
      t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1;
      t.addEventListener('click', function () { choisir(t); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0, j = i;
        if (e.key === 'Home') j = 0; else if (e.key === 'End') j = tabs.length - 1; else if (d) { do { j = (j + d + tabs.length) % tabs.length; } while (inerte(tabs[j]) && j !== i); } else return;
        e.preventDefault(); choisir(tabs[j], true);
      });
    });
  };

  /* ════ Le menu et la liste de choix ════ un bouton ouvre la liste ; flèches, Entrée, Échap, première lettre ; clic dehors ferme */
  function listeClavier(liste, items, fermer, choisir) {
    liste.addEventListener('keydown', function (e) {
      var actifs = items().filter(function (x) { return !inerte(x); }), i = actifs.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); actifs[(i + 1) % actifs.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); actifs[(i - 1 + actifs.length) % actifs.length].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); actifs[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); actifs[actifs.length - 1].focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fermer(true); }
      else if (e.key === 'Tab') fermer(false);
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (i >= 0) choisir(actifs[i]); }
      else if (e.key.length === 1) { var c = e.key.toLowerCase(), s = actifs.filter(function (x) { return x.textContent.trim().toLowerCase().charAt(0) === c; }); if (s.length) s[(s.indexOf(document.activeElement) + 1) % s.length].focus(); }
    });
  }
  KE.menu = function (n) {
    if (n._ke) return; n._ke = true;
    var bouton = n.querySelector('button'), liste = n.querySelector('.ke-menu-liste'), estChoix = n.classList.contains('ke-choix');
    var sel = estChoix ? '[role="option"]' : '[role^="menuitem"]';
    function items() { return tous(liste, sel); }
    items().forEach(function (x) { x.tabIndex = -1; });
    function ouvrir() { liste.hidden = false; bouton.setAttribute('aria-expanded', 'true'); var it = items().filter(function (x) { return !inerte(x); }), cur = it.filter(function (x) { return x.getAttribute('aria-selected') === 'true'; })[0]; (cur || it[0]).focus(); document.addEventListener('pointerdown', dehors, true); }
    function fermer(rendre) { if (liste.hidden) return; liste.hidden = true; bouton.setAttribute('aria-expanded', 'false'); document.removeEventListener('pointerdown', dehors, true); if (rendre) bouton.focus(); }
    function dehors(e) { if (!n.contains(e.target)) fermer(false); }
    function choisir(x) {
      if (inerte(x)) return;
      if (estChoix) { items().forEach(function (y) { y.setAttribute('aria-selected', y === x ? 'true' : 'false'); }); bouton.firstChild.textContent = x.firstChild.textContent; }
      else if (x.getAttribute('role') === 'menuitemcheckbox') { x.setAttribute('aria-checked', x.getAttribute('aria-checked') === 'true' ? 'false' : 'true'); }
      else if (x.getAttribute('role') === 'menuitemradio') { items().forEach(function (y) { if (y.getAttribute('role') === 'menuitemradio') y.setAttribute('aria-checked', y === x ? 'true' : 'false'); }); }
      emettre(n, 'ke:change', { valeur: x.dataset.valeur || x.firstChild.textContent.trim() }); fermer(true);
    }
    bouton.setAttribute('aria-expanded', 'false');
    bouton.addEventListener('click', function () { if (liste.hidden) ouvrir(); else fermer(true); });
    bouton.addEventListener('keydown', function (e) { if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && liste.hidden) { e.preventDefault(); ouvrir(); } });
    liste.addEventListener('click', function (e) { var x = e.target.closest(sel); if (x) choisir(x); });
    listeClavier(liste, items, fermer, choisir);
  };
  /* la liste à choisir (role="listbox") : flèches et Entrée, un seul choisi */
  KE.liste = function (n) {
    if (n._ke) return; n._ke = true;
    var items = tous(n, '[role="option"]');
    function choisir(x) { if (inerte(x)) return; items.forEach(function (y) { y.setAttribute('aria-selected', y === x ? 'true' : 'false'); y.tabIndex = y === x ? 0 : -1; }); emettre(n, 'ke:change', { valeur: x.dataset.valeur || x.firstChild.textContent.trim() }); }
    items.forEach(function (x, i) {
      x.tabIndex = x.getAttribute('aria-selected') === 'true' ? 0 : -1;
      x.addEventListener('click', function () { choisir(x); });
      x.addEventListener('keydown', function (e) { var d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0; if (!d) return; e.preventDefault(); var j = i; do { j = (j + d + items.length) % items.length; } while (inerte(items[j]) && j !== i); items[j].focus(); choisir(items[j]); });
    });
    if (!items.some(function (x) { return x.tabIndex === 0; }) && items[0]) items[0].tabIndex = 0;
  };

  /* ════ La lecture : une forme d'onde en traits, une tête orange. Rien ne joue sans la main (aucun son : le kit ne fait que le geste).
     KitEtude.lecture(n, { duree: 190, onde: [0..1, …] }) ; sans onde, une forme régulière est dessinée depuis data-graine. ════ */
  function formeOnde(nb, graine) {
    var t = [], a = graine || 7;
    function h() { a = (a * 16807) % 2147483647; return a / 2147483647; }
    var e = .2; for (var i = 0; i < nb; i++) { var x = i / nb, env = .25 + .75 * Math.pow(Math.sin(Math.PI * Math.min(1, x * 1.15)), .6) * (.55 + .45 * Math.sin(x * 21 + 1)); e = mix(e, h(), .55); t.push(borne(env * (.35 + .65 * e), .04, 1)); }
    return t;
  }
  function temps(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
  KE.lecture = function (n, o) {
    if (n._ke) return n._ke; o = o || {};
    var duree = o.duree || +n.dataset.duree || 180, onde = n.querySelector('.ke-onde, .ke-defile'), estOnde = onde.classList.contains('ke-onde');
    var bouton = n.querySelector('[data-ke-lire]'), aff = n.querySelector('.ke-l-temps'), t = +n.dataset.depart || 0, joue = false, dernier = 0, traits = [];
    if (estOnde) (o.onde || formeOnde(+onde.dataset.traits || 150, +onde.dataset.graine)).forEach(function (h, i) { var b = el('i', { style: '--h:' + h.toFixed(3) + ';--i:' + i }); traits.push(b); onde.appendChild(b); });
    else { onde.appendChild(el('u')); onde.appendChild(el('b')); }
    onde.setAttribute('role', 'slider'); onde.tabIndex = 0; onde.setAttribute('aria-valuemin', 0); onde.setAttribute('aria-valuemax', duree); if (!onde.getAttribute('aria-label')) onde.setAttribute('aria-label', 'Position de lecture');
    function peindre() {
      var f = t / duree; onde.style.setProperty('--t', f); onde.setAttribute('aria-valuenow', Math.round(t)); onde.setAttribute('aria-valuetext', temps(t) + ' sur ' + temps(duree));
      traits.forEach(function (b, i) { b.classList.toggle('lu', (i + .5) / traits.length <= f); });
      if (aff) { aff.firstChild.textContent = temps(t); }
      emettre(n, 'ke:temps', { t: t, duree: duree });
    }
    function aller(x) { t = borne(x, 0, duree); peindre(); }
    function pas(ts) { if (!joue) return; if (dernier) aller(t + (ts - dernier) / 1000); dernier = ts; if (t >= duree) { jouer(false); return; } requestAnimationFrame(pas); }
    function jouer(oui) { joue = oui; dernier = 0; if (bouton) { bouton.setAttribute('aria-pressed', oui ? 'true' : 'false'); bouton.textContent = oui ? 'Pause' : 'Lire'; } if (oui) { if (t >= duree) t = 0; requestAnimationFrame(pas); } emettre(n, 'ke:lecture', { joue: joue }); }
    function lire(e) { var r = onde.getBoundingClientRect(); return borne((e.clientX - r.left) / r.width, 0, 1); }
    tirer(onde, function (e) { onde.focus({ preventScroll: true }); aller(lire(e) * duree); return {}; }, function (e) { aller(lire(e) * duree); });
    onde.addEventListener('pointermove', function (e) { onde.style.setProperty('--vise', lire(e)); });
    onde.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') aller(t + (e.shiftKey ? 1 : 5)); else if (e.key === 'ArrowLeft') aller(t - (e.shiftKey ? 1 : 5)); else if (e.key === 'Home') aller(0); else if (e.key === 'End') aller(duree); else if (e.key === ' ' || e.key === 'Enter') jouer(!joue); else return; e.preventDefault();
    });
    if (bouton) bouton.addEventListener('click', function () { jouer(!joue); });
    if (aff && !aff.firstChild) aff.appendChild(document.createTextNode(''));
    if (aff && aff.firstChild.nodeType !== 3) aff.insertBefore(document.createTextNode(''), aff.firstChild);
    peindre();
    return (n._ke = { aller: aller, jouer: jouer, temps: function () { return t; } });
  };

  /* ════ Le montage : des pistes, des blocs qu'on glisse dans le temps, une tête de lecture. Ctrl + molette zoome le temps sous le pointeur.
     KitEtude.montage(n, { duree: 90, pas: 10, pistes: [{ nom, clips: [{ nom, debut, duree, deduit }] }] }) ════ */
  KE.montage = function (n, o) {
    if (n._ke) return n._ke;
    var e0 = +n.dataset.echelle || 14, ech = e0, tete = o.tete || 0, choisi = null;
    var noms = el('div', { class: 'ke-m-noms' }), vue = el('div', { class: 'ke-m-vue', tabindex: '-1' }), fond = el('div', { class: 'ke-m-fond' }), regle = el('div', { class: 'ke-m-regle', role: 'slider', tabindex: '0', 'aria-label': 'Tête de lecture', 'aria-valuemin': 0, 'aria-valuemax': o.duree }), aig = el('div', { class: 'ke-m-tete' });
    fond.appendChild(regle);
    for (var s = 0; s <= o.duree; s += (o.pas || 10)) regle.appendChild(el('i', { style: 'left:calc(' + s + ' * var(--e))' }, [el('b', { text: temps(s) })]));
    n.style.setProperty('--duree', o.duree);
    function dire(c, p) { emettre(n, 'ke:change', { clip: c, piste: p, phrase: '« ' + c.nom + ' » commence à ' + temps(c.debut) + ' et dure ' + String(c.duree).replace('.', ',') + ' s.' }); }
    o.pistes.forEach(function (p) {
      noms.appendChild(el('p', { text: p.nom })); var ligne = el('div', { class: 'ke-m-piste' });
      p.clips.forEach(function (c) {
        var b = el('div', { class: 'ke-clip' + (c.deduit ? ' deduit' : ''), tabindex: '0', role: 'option', 'aria-selected': 'false', text: c.nom });
        function peindre() { b.style.setProperty('--d', c.debut); b.style.setProperty('--l', c.duree); b.setAttribute('aria-label', c.nom + ', ' + p.nom + ', à ' + temps(c.debut)); }
        function prendre() { if (choisi) choisi.setAttribute('aria-selected', 'false'); choisi = b; b.setAttribute('aria-selected', 'true'); dire(c, p); }
        function poser(x) { c.debut = borne(Math.round(x * 2) / 2, 0, o.duree - c.duree); peindre(); dire(c, p); }
        tirer(b, function (e) { b.focus({ preventScroll: true }); prendre(); b.classList.add('tenu'); return { x: e.clientX, d: c.debut }; }, function (e, k) { poser(k.d + (e.clientX - k.x) / ech); }, function () { b.classList.remove('tenu'); });
        b.addEventListener('focus', prendre);
        b.addEventListener('keydown', function (e) { var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return; e.preventDefault(); poser(c.debut + d * (e.shiftKey ? .5 : 1)); });
        peindre(); ligne.appendChild(b);
      });
      fond.appendChild(ligne);
    });
    fond.appendChild(aig); vue.appendChild(fond); n.appendChild(noms); n.appendChild(vue);
    function peindreTete() { n.style.setProperty('--tete', tete); regle.setAttribute('aria-valuenow', Math.round(tete)); regle.setAttribute('aria-valuetext', temps(tete)); }
    function allerTete(x) { tete = borne(x, 0, o.duree); peindreTete(); emettre(n, 'ke:temps', { t: tete }); }
    function lire(e) { return (e.clientX - fond.getBoundingClientRect().left) / ech; }
    tirer(regle, function (e) { regle.focus({ preventScroll: true }); allerTete(lire(e)); return {}; }, function (e) { allerTete(lire(e)); });
    regle.addEventListener('keydown', function (e) { var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return; e.preventDefault(); allerTete(tete + d * (e.shiftKey ? .5 : 1)); });
    function zoom(k, cx) { var r = vue.getBoundingClientRect(), x = cx === undefined ? r.width / 2 : cx - r.left, sous = (vue.scrollLeft + x) / ech; ech = borne(ech * k, 3, 80); n.style.setProperty('--e', ech + 'px'); vue.scrollLeft = sous * ech - x; }
    vue.addEventListener('wheel', function (e) { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); zoom(Math.pow(.9985, e.deltaY), e.clientX); }, { passive: false });
    n.style.setProperty('--e', ech + 'px'); peindreTete();
    return (n._ke = { zoom: zoom, tete: allerTete });
  };

  /* ════ Le schéma nodal : des nœuds qu'on déplace, des ports qu'on relie, un zoom (Ctrl + molette, pincement, + et −), un fond qu'on glisse.
     À la main : on tire d'un port vers un autre ; les ports possibles s'allument, le port de départ reste ambre, le câble attend en pointillé.
     Au clavier : Entrée sur un port le tient, Tab jusqu'à un port allumé, Entrée branche, Échap revient. Suppr retire le câble ou le nœud choisi.
     KitEtude.nodal(n, { noeuds: [{ id, nom, sous, x, y, entrees: [{ id, nom }], sorties: [...] }], cables: [{ de: 'noeud.port', a: 'noeud.port', deduit }] }) ════ */
  KE.nodal = function (n, o) {
    if (n._ke) return n._ke;
    var vue = { x: 0, y: 0, k: 1 }, N = {}, cables = (o.cables || []).map(function (c) { return { de: c.de, a: c.a, deduit: !!c.deduit }; });
    var monde = el('div', { class: 'ke-n-monde' }), fils = svg('svg', { class: 'ke-n-cables' }), dit = el('div', { class: 'ke-n-dit', 'aria-live': 'polite' }, [el('small'), el('p')]);
    var zoomDit = el('output'), outils = el('div', { class: 'ke-n-outils' }, [
      el('button', { type: 'button', class: 'ke-btn', 'data-z': '-', 'aria-label': 'Reculer', text: 'reculer' }), zoomDit,
      el('button', { type: 'button', class: 'ke-btn', 'data-z': '+', 'aria-label': 'Approcher', text: 'approcher' }),
      el('button', { type: 'button', class: 'ke-btn', 'data-z': '0', text: 'tout voir' })]);
    monde.appendChild(fils); n.appendChild(monde); n.appendChild(dit); n.appendChild(outils);
    n.tabIndex = 0; n.setAttribute('role', 'application'); if (!n.getAttribute('aria-label')) n.setAttribute('aria-label', 'Schéma : nœuds et câbles');
    var tenu = null, choisi = null, repos = o.repos || ['Rien n’est tenu', 'Tire d’un port vers un autre, ou prends un nœud.'];
    function parler(a, b) { dit.firstChild.textContent = a; dit.lastChild.textContent = b; }
    function nomPort(ref) { var p = ref.split('.'), nd = N[p[0]], pt = nd.ports[p[1]]; return nd.d.nom + ' (' + pt.nom + ')'; }
    function appliquer() { monde.style.transform = 'translate(' + vue.x + 'px,' + vue.y + 'px) scale(' + vue.k + ')'; zoomDit.textContent = Math.round(vue.k * 100) + ' %'; }
    function centrePort(ref) { var p = ref.split('.'), b = N[p[0]].ports[p[1]].el.getBoundingClientRect(), m = monde.getBoundingClientRect(); return [(b.left + b.width / 2 - m.left) / vue.k, (b.top + b.height / 2 - m.top) / vue.k]; }
    function courbe(a, b) { var dx = Math.max(40, Math.abs(b[0] - a[0]) * .5); return 'M' + a[0] + ' ' + a[1] + 'C' + (a[0] + dx) + ' ' + a[1] + ' ' + (b[0] - dx) + ' ' + b[1] + ' ' + b[0] + ' ' + b[1]; }
    function tracer() {
      tous(fils, '.ke-cable:not(.fantome), .ke-cable-prise').forEach(function (p) { p.remove(); });
      tous(monde, '.ke-port').forEach(function (p) { p.classList.remove('branche'); });
      cables.forEach(function (c) {
        var d = courbe(centrePort(c.de), centrePort(c.a)), vif = choisi && choisi.noeud && (c.de.split('.')[0] === choisi.noeud || c.a.split('.')[0] === choisi.noeud);
        var p = svg('path', { class: 'ke-cable' + (c.deduit ? ' deduit' : '') + (choisi && choisi.cable === c ? ' choisi' : vif ? ' vif' : ''), d: d });
        var prise = svg('path', { class: 'ke-cable-prise', d: d, tabindex: '0', role: 'button', 'aria-label': 'Câble de ' + nomPort(c.de) + ' vers ' + nomPort(c.a) + (c.deduit ? ', proposé' : '') });
        function prendre() { choisir({ cable: c }); parler(c.deduit ? 'Câble proposé, pas encore gardé' : 'Câble tenu', nomPort(c.de) + ' vers ' + nomPort(c.a) + '. Suppr le retire' + (c.deduit ? ', Entrée le garde.' : '.')); }
        prise.addEventListener('pointerdown', function (e) { e.stopPropagation(); e.preventDefault(); prise.focus(); });
        prise.addEventListener('focus', function () { if (!choisi || choisi.cable !== c) prendre(); });
        prise.addEventListener('keydown', function (e) {
          if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); cables.splice(cables.indexOf(c), 1); choisi = null; tracer(); parler('Câble retiré', nomPort(c.de) + ' n’est plus relié à ' + nomPort(c.a) + '.'); n.focus(); changer(); }
          else if (e.key === 'Enter' && c.deduit) { e.preventDefault(); c.deduit = false; var i = cables.indexOf(c); tracer(); tous(fils, '.ke-cable-prise')[i].focus(); parler('Câble gardé', nomPort(c.de) + ' vers ' + nomPort(c.a) + '.'); changer(); }
        });
        fils.appendChild(p); fils.appendChild(prise);
        [c.de, c.a].forEach(function (r) { var q = r.split('.'); N[q[0]].ports[q[1]].el.classList.add('branche'); });
      });
    }
    function changer() { emettre(n, 'ke:change', { cables: cables.map(function (c) { return { de: c.de, a: c.a, deduit: c.deduit }; }), noeuds: Object.keys(N).map(function (k) { return { id: k, x: N[k].d.x, y: N[k].d.y }; }) }); }
    function choisir(c) {
      choisi = c; tous(monde, '.ke-noeud').forEach(function (x) { x.classList.toggle('choisi', !!c && c.noeud === x.dataset.id); });
      var ps = tous(fils, '.ke-cable:not(.fantome)'); cables.forEach(function (k, i) { if (!ps[i]) return; var vif = c && c.noeud && (k.de.split('.')[0] === c.noeud || k.a.split('.')[0] === c.noeud); ps[i].classList.toggle('choisi', !!c && c.cable === k); ps[i].classList.toggle('vif', !!vif); });
    }
    /* tenir un port : les cibles possibles s'allument (l'autre sens, un autre nœud) */
    function tenir(ref) {
      var p = ref.split('.'), sens = N[p[0]].ports[p[1]].sens; tenu = { ref: ref, sens: sens }; n.classList.add('tire');
      Object.keys(N).forEach(function (id) { Object.keys(N[id].ports).forEach(function (pid) { var q = N[id].ports[pid]; q.el.classList.toggle('cible', id !== p[0] && q.sens !== sens); q.el.classList.toggle('depart', id === p[0] && pid === p[1]); }); });
      parler('Câble tenu depuis ' + nomPort(ref), 'Les ports allumés peuvent le recevoir. Lâche sur l’un d’eux, ou Entrée. Échap revient.');
    }
    function lacher() { tenu = null; n.classList.remove('tire'); tous(monde, '.ke-port').forEach(function (x) { x.classList.remove('cible', 'depart', 'visee'); }); var f = fils.querySelector('.fantome'); if (f) f.remove(); }
    function brancher(cible) {
      var de = tenu.sens === 'sortie' ? tenu.ref : cible, a = tenu.sens === 'sortie' ? cible : tenu.ref;
      cables = cables.filter(function (c) { return c.a !== a; });   /* une entrée ne reçoit qu'un câble : le nouveau remplace l'ancien */
      cables.push({ de: de, a: a, deduit: false }); lacher(); tracer(); parler('Branché', nomPort(de) + ' vers ' + nomPort(a) + '.'); changer();
    }
    (o.noeuds || []).forEach(function (d) {
      var ports = {}, gauche = el('div'), droite = el('div');
      function rang(p, sens) {
        var b = el('button', { type: 'button', class: 'ke-port', 'data-ref': d.id + '.' + p.id, 'aria-label': (sens === 'entree' ? 'Entrée ' : 'Sortie ') + p.nom + ' de ' + d.nom });
        ports[p.id] = { el: b, nom: p.nom, sens: sens };
        tirer(b, function (e) { e.stopPropagation(); b.focus({ preventScroll: true }); tenir(d.id + '.' + p.id); var f = svg('path', { class: 'ke-cable fantome' }); fils.appendChild(f); return { f: f, a: centrePort(d.id + '.' + p.id), bouge: false }; },
          function (e, c) {
            c.bouge = true; var sous = document.elementFromPoint(e.clientX, e.clientY), cible = sous && sous.closest && sous.closest('.ke-port.cible');
            tous(monde, '.ke-port.visee').forEach(function (x) { x.classList.remove('visee'); });
            var m = monde.getBoundingClientRect(), fin = [(e.clientX - m.left) / vue.k, (e.clientY - m.top) / vue.k];
            if (cible) { cible.classList.add('visee'); fin = centrePort(cible.dataset.ref); parler('Lâcher ici brancherait', (tenu.sens === 'sortie' ? nomPort(tenu.ref) + ' vers ' + nomPort(cible.dataset.ref) : nomPort(cible.dataset.ref) + ' vers ' + nomPort(tenu.ref)) + '.'); }
            c.f.classList.toggle('pret', !!cible); c.f.setAttribute('d', tenu.sens === 'sortie' ? courbe(c.a, fin) : courbe(fin, c.a));
          },
          function (e, c) {
            var v = monde.querySelector('.ke-port.visee');
            if (v) brancher(v.dataset.ref); else if (c.bouge) { lacher(); parler('Revenu', 'Lâché hors de tout port : rien n’a changé.'); } else { var f = fils.querySelector('.fantome'); if (f) f.remove(); }
          });
        b.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (tenu && b.classList.contains('cible')) brancher(d.id + '.' + p.id); else if (tenu && tenu.ref === d.id + '.' + p.id) { lacher(); parler(repos[0], repos[1]); } else { lacher(); tenir(d.id + '.' + p.id); } }
          e.stopPropagation();
        });
        b.addEventListener('focus', function () { if (tenu && b.classList.contains('cible')) { tous(monde, '.ke-port.visee').forEach(function (x) { x.classList.remove('visee'); }); b.classList.add('visee'); } });
        return el('div', { class: 'ke-n-rang' }, [b, el('span', { text: p.nom })]);
      }
      (d.entrees || []).forEach(function (p) { gauche.appendChild(rang(p, 'entree')); });
      (d.sorties || []).forEach(function (p) { droite.appendChild(rang(p, 'sortie')); });
      var nd = el('div', { class: 'ke-noeud', tabindex: '0', 'data-id': d.id, role: 'group', 'aria-label': 'Nœud ' + d.nom }, [el('p', { class: 'ke-n-nom', text: d.nom }), d.sous ? el('p', { class: 'ke-n-sous', text: d.sous }) : null, el('div', { class: 'ke-n-ports' }, [gauche, droite])]);
      function placer() { nd.style.left = d.x + 'px'; nd.style.top = d.y + 'px'; }
      function prendre() { choisir({ noeud: d.id }); parler(d.nom, (d.sous ? d.sous + '. ' : '') + 'Ses câbles s’allument. Les flèches le déplacent.'); }
      tirer(nd, function (e) { if (e.target.closest('.ke-port')) return false; e.stopPropagation(); nd.focus({ preventScroll: true }); prendre(); nd.classList.add('tenu'); return { x: e.clientX, y: e.clientY, dx: d.x, dy: d.y }; },
        function (e, c) { d.x = Math.round(c.dx + (e.clientX - c.x) / vue.k); d.y = Math.round(c.dy + (e.clientY - c.y) / vue.k); placer(); tracer(); },
        function () { nd.classList.remove('tenu'); changer(); });
      nd.addEventListener('focus', function () { if (!choisi || choisi.noeud !== d.id) prendre(); });
      nd.addEventListener('keydown', function (e) {
        if (e.target !== nd) return; var p = e.shiftKey ? 1 : 12, dx = e.key === 'ArrowRight' ? p : e.key === 'ArrowLeft' ? -p : 0, dy = e.key === 'ArrowDown' ? p : e.key === 'ArrowUp' ? -p : 0;
        if (dx || dy) { e.preventDefault(); e.stopPropagation(); d.x += dx; d.y += dy; placer(); tracer(); changer(); }
      });
      N[d.id] = { d: d, el: nd, ports: ports }; placer(); monde.appendChild(nd);
    });
    function zoomer(k, cx, cy) { var r = n.getBoundingClientRect(), x = cx === undefined ? r.width / 2 : cx - r.left, y = cy === undefined ? r.height / 2 : cy - r.top, nk = borne(vue.k * k, .25, 2.5), q = nk / vue.k; vue.x = x - (x - vue.x) * q; vue.y = y - (y - vue.y) * q; vue.k = nk; appliquer(); }
    function toutVoir() {
      var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; Object.keys(N).forEach(function (k) { var d = N[k].d, e = N[k].el; x0 = Math.min(x0, d.x); y0 = Math.min(y0, d.y); x1 = Math.max(x1, d.x + e.offsetWidth); y1 = Math.max(y1, d.y + e.offsetHeight); });
      var r = n.getBoundingClientRect(), k = borne(Math.min((r.width - 160) / (x1 - x0), (r.height - 220) / (y1 - y0)), .25, 1.25); vue.k = k; vue.x = (r.width - (x1 - x0) * k) / 2 - x0 * k; vue.y = (r.height - 60 - (y1 - y0) * k) / 2 - y0 * k; appliquer();
    }
    tirer(n, function (e) { if (e.target.closest('.ke-noeud, .ke-n-outils')) return false; n.focus({ preventScroll: true }); n.classList.add('glisse'); if (tenu) lacher(); choisir(null); parler(repos[0], repos[1]); return { x: e.clientX, y: e.clientY, vx: vue.x, vy: vue.y }; },
      function (e, c) { vue.x = c.vx + e.clientX - c.x; vue.y = c.vy + e.clientY - c.y; appliquer(); }, function () { n.classList.remove('glisse'); });
    n.addEventListener('wheel', function (e) { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); zoomer(Math.pow(.9985, e.deltaY), e.clientX, e.clientY); }, { passive: false });
    n.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && tenu) { e.preventDefault(); var d = N[tenu.ref.split('.')[0]].ports[tenu.ref.split('.')[1]].el; lacher(); d.focus(); parler('Revenu', 'Le câble n’a pas été branché.'); return; }
      if ((e.key === 'Delete' || e.key === 'Backspace') && choisi && choisi.noeud && e.target.classList.contains('ke-noeud')) { e.preventDefault(); var id = choisi.noeud, nom = N[id].d.nom; cables = cables.filter(function (c) { return c.de.split('.')[0] !== id && c.a.split('.')[0] !== id; }); N[id].el.remove(); delete N[id]; choisi = null; tracer(); parler('Nœud retiré', nom + ' et ses câbles ont quitté le schéma.'); n.focus(); changer(); return; }
      if (e.target !== n) return;
      if (e.key === '+' || e.key === '=') zoomer(1.2); else if (e.key === '-') zoomer(1 / 1.2); else if (e.key === '0') toutVoir();
      else if (e.key === 'ArrowLeft') { vue.x += 40; appliquer(); } else if (e.key === 'ArrowRight') { vue.x -= 40; appliquer(); } else if (e.key === 'ArrowUp') { vue.y += 40; appliquer(); } else if (e.key === 'ArrowDown') { vue.y -= 40; appliquer(); } else return;
      e.preventDefault();
    });
    outils.addEventListener('click', function (e) { var z = e.target.closest('[data-z]'); if (!z) return; if (z.dataset.z === '+') zoomer(1.2); else if (z.dataset.z === '-') zoomer(1 / 1.2); else toutVoir(); });
    outils.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    function pret() { toutVoir(); tracer(); parler(repos[0], repos[1]); }
    pret(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(pret);
    window.addEventListener('resize', tracer);
    return (n._ke = { zoomer: zoomer, toutVoir: toutVoir, tracer: tracer, cables: function () { return cables.slice(); } });
  };

  /* ════ Le canevas infini à zoom sémantique. La même matière à trois hauteurs : de loin, un trait par objet sous le nom du groupe ;
     plus près, les traits s'écartent et deviennent des noms ; de près, chaque nom dit sa phrase et d'où elle vient.
     Ce qu'on vise reste sous le pointeur. Ctrl + molette ou pincement ; + et − ; 1, 2, 3 ; le rail nommé à droite ; on glisse le fond.
     KitEtude.canevas(n, { niveaux: ['l’ensemble', 'les noms', 'le détail'], groupes: [{ nom, objets: [{ nom, dit, source, poids, deduit }] }] }) ════ */
  KE.canevas = function (n, o) {
    if (n._ke) return n._ke;
    var K = [.34, 1, 2.1], vue = { x: 0, y: 0, k: K[0] }, objets = [], groupes = [], tenu = null, anim = 0;
    var COL = 330, RANG = 54, PARCOL = 6, ECART = 1080;
    var dit = el('div', { class: 'ke-n-dit', 'aria-live': 'polite' }, [el('small'), el('p')]);
    var rail = el('div', { class: 'ke-rail', role: 'group', 'aria-label': 'Hauteur' }, (o.niveaux || ['l’ensemble', 'les noms', 'le détail']).map(function (t, i) { return el('button', { type: 'button', 'data-n': i }, [t, el('i')]); }));
    n.tabIndex = 0; n.setAttribute('role', 'application'); if (!n.getAttribute('aria-label')) n.setAttribute('aria-label', 'Canevas à zoom');
    o.groupes.forEach(function (g, gi) {
      var titre = el('p', { class: 'ke-cv-groupe', text: g.nom }); n.appendChild(titre);
      var G = { d: g, el: titre, x: gi * ECART, y: 0 }; groupes.push(G);
      g.objets.forEach(function (d, i) {
        var b = el('button', { type: 'button' }, [el('b', { text: d.nom }), el('span', { text: d.dit }), el('small', { text: d.source || '' })]);
        var e = el('div', { class: 'ke-cv-objet' + (d.deduit ? ' deduit' : ''), style: '--h:' + (d.poids === undefined ? .5 : d.poids) }, [el('i'), b]);
        var O = { d: d, g: G, el: e, b: b, i: i, lx: i * 30, ly: 0, px: Math.floor(i / PARCOL) * COL, py: 90 + (i % PARCOL) * RANG };
        b.addEventListener('click', function () { prendre(O); });
        b.addEventListener('focus', function () { prendre(O); });
        objets.push(O); n.appendChild(e);
      });
    });
    n.appendChild(dit); n.appendChild(rail);
    function niveau() { return vue.k < .62 ? 0 : vue.k < 1.5 ? 1 : 2; }
    function parler() {
      var nv = niveau();
      if (tenu) { dit.firstChild.textContent = tenu.g.d.nom + ' · ' + tenu.d.nom; dit.lastChild.textContent = tenu.d.dit; }
      else { dit.firstChild.textContent = ['De loin', 'À mi-hauteur', 'De près'][nv]; dit.lastChild.textContent = (o.phrases || ['Un trait par chose. Sa hauteur dit sa place.', 'Les traits sont devenus des noms.', 'Chaque nom dit sa phrase, et d’où elle vient.'])[nv]; }
    }
    function prendre(O) { if (tenu) tenu.el.classList.remove('tenu'); tenu = O; if (O) O.el.classList.add('tenu'); parler(); }
    function peindre() {
      var k = vue.k, ouvre = seg(k, .42, .9), detail = seg(k, 1.35, 1.9), nv = niveau();
      groupes.forEach(function (G) {
        G.el.style.transform = 'translate(' + (G.x * k + vue.x) + 'px,' + (G.y * k + vue.y - mix(72, 26 - 90 * k, ouvre)) + 'px) translateY(-100%) scale(' + mix(.72, .5, ouvre) + ')';
        G.el.style.opacity = String(mix(1, .6, ouvre));
      });
      objets.forEach(function (O) {
        var x = O.g.x * k + vue.x + mix(O.lx, O.px * k, ouvre), y = O.g.y * k + vue.y + mix(O.ly, O.py * k, ouvre);
        O.el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
        O.el.firstChild.style.opacity = String(1 - ouvre); O.el.firstChild.style.transform = 'scaleY(' + mix(1, .12, ouvre) + ')';
        O.b.style.opacity = String(ouvre); O.b.style.pointerEvents = ouvre > .5 ? 'auto' : 'none'; O.b.tabIndex = ouvre > .5 ? 0 : -1;
        O.b.style.transform = 'translateY(' + mix(-10, -14, detail) + 'px) scale(' + mix(.9, 1, ouvre) + ')'; O.b.style.transformOrigin = '0 0';
        O.b.children[1].style.opacity = String(detail); O.b.children[2].style.opacity = String(detail);
        O.b.children[1].style.display = O.b.children[2].style.display = detail > .01 ? 'block' : 'none';
      });
      [].forEach.call(rail.children, function (b, i) { b.classList.toggle('ici', i === nv); b.setAttribute('aria-current', i === nv ? 'true' : 'false'); });
      parler();
    }
    function zoomer(nk, cx, cy) { var r = n.getBoundingClientRect(), x = cx === undefined ? r.width / 2 : cx - r.left, y = cy === undefined ? r.height / 2 : cy - r.top; nk = borne(nk, .22, 3); var q = nk / vue.k; vue.x = x - (x - vue.x) * q; vue.y = y - (y - vue.y) * q; vue.k = nk; peindre(); }
    /* un bond sec vers une hauteur : 380 ms, ou tout de suite si le mouvement est réduit */
    function bond(but, cible) {
      cancelAnimationFrame(anim); var r = n.getBoundingClientRect(), a = { x: vue.x, y: vue.y, k: vue.k }, b = cible || cadrer(but), t0 = 0;
      if (calme) { vue = b; peindre(); return; }
      function pas(ts) { if (!t0) t0 = ts; var t = seg((ts - t0) / 380, 0, 1); vue.k = Math.exp(mix(Math.log(a.k), Math.log(b.k), t)); vue.x = mix(a.x, b.x, t); vue.y = mix(a.y, b.y, t); peindre(); if (t < 1) anim = requestAnimationFrame(pas); }
      anim = requestAnimationFrame(pas); void r;
    }
    function cadrer(k) {
      var r = n.getBoundingClientRect();
      if (k < .62) { var w = (groupes.length - 1) * ECART * k + 300; return { k: k, x: (r.width - w) / 2, y: r.height * .52 }; }
      var G = tenu ? tenu.g : groupes[plusPres()], cx = G.x + (tenu && k > 1.5 ? tenu.px + 150 : k > 1.5 ? 330 : 480), cy = tenu && k > 1.5 ? tenu.py + 30 : 90 + RANG * 2.6;
      return { k: k, x: r.width * .46 - cx * k, y: r.height * .46 - cy * k };
    }
    function plusPres() { var r = n.getBoundingClientRect(), m = 0, dm = Infinity; groupes.forEach(function (G, i) { var d = Math.abs(G.x * vue.k + vue.x + 200 - r.width / 2); if (d < dm) { dm = d; m = i; } }); return m; }
    tirer(n, function (e) { if (e.target.closest('button')) return false; n.focus({ preventScroll: true }); cancelAnimationFrame(anim); n.classList.add('glisse'); return { x: e.clientX, y: e.clientY, vx: vue.x, vy: vue.y, b: false }; },
      function (e, c) { c.b = true; vue.x = c.vx + e.clientX - c.x; vue.y = c.vy + e.clientY - c.y; peindre(); }, function (e, c) { n.classList.remove('glisse'); if (!c.b) prendre(null); });
    n.addEventListener('wheel', function (e) { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); cancelAnimationFrame(anim); zoomer(vue.k * Math.pow(.9982, e.deltaY), e.clientX, e.clientY); }, { passive: false });
    n.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && tenu) { prendre(null); n.focus(); e.preventDefault(); return; }
      if (e.target !== n && !/^[123+\-=]$/.test(e.key)) return;
      if (e.key === '+' || e.key === '=') zoomer(vue.k * 1.25); else if (e.key === '-') zoomer(vue.k / 1.25); else if (/^[123]$/.test(e.key)) bond(K[+e.key - 1]);
      else if (e.key === 'ArrowLeft') { vue.x += 60; peindre(); } else if (e.key === 'ArrowRight') { vue.x -= 60; peindre(); } else if (e.key === 'ArrowUp') { vue.y += 60; peindre(); } else if (e.key === 'ArrowDown') { vue.y -= 60; peindre(); } else return;
      e.preventDefault();
    });
    rail.addEventListener('click', function (e) { var b = e.target.closest('[data-n]'); if (b) bond(K[+b.dataset.n]); });
    rail.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    function pret() { vue = cadrer(vue.k); peindre(); }
    pret(); window.addEventListener('resize', peindre);
    return (n._ke = { bond: function (i) { bond(K[i]); }, zoomer: zoomer, poser: function (i) { vue = cadrer(K[i]); peindre(); }, tenir: function (i) { prendre(objets[i]); } });
  };

  /* ════ Les chiffres ════ */
  /* une rangée de traits : KitEtude.traits(n, [{ t: 'ce que dit le trait', h: 0..1, garde: true }], lu) ; le trait visé se lit dans « lu » */
  KE.traits = function (n, donnees, lu) {
    var traits = [];
    function montrer(i) { traits.forEach(function (t, j) { t.classList.toggle('ici', j === i); }); if (lu) { lu.textContent = ''; if (donnees[i].sur) lu.appendChild(el('small', { text: donnees[i].sur })); lu.appendChild(document.createTextNode(donnees[i].t)); } emettre(n, 'ke:change', { valeur: i }); }
    donnees.forEach(function (d, i) {
      var t = el('i', { tabindex: '0', role: 'img', 'aria-label': d.t, class: d.garde ? 'garde' : null, style: d.h !== undefined ? '--h:' + d.h : null });
      t.addEventListener('mouseenter', function () { montrer(i); }); t.addEventListener('focus', function () { montrer(i); });
      t.addEventListener('keydown', function (e) { var k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (k && traits[i + k]) { e.preventDefault(); traits[i + k].focus(); } });
      traits.push(t); n.appendChild(t);
    });
    return { montrer: montrer };
  };
  /* des arches : des liens entre des crans d'une ligne. KitEtude.arches(n, { crans: 13, liens: [{ de, a, t, deduit }] }, lu) */
  KE.arches = function (n, o, lu) {
    var W = 1000, H = 300, sol = 250, m = 30, pas = (W - 2 * m) / (o.crans - 1), nums = [];
    var s = svg('svg', { class: 'ke-arches', viewBox: '0 0 ' + W + ' ' + H, role: 'group', 'aria-label': n.getAttribute('aria-label') || 'Arches' });
    s.appendChild(svg('line', { class: 'sol', x1: m, y1: sol, x2: W - m, y2: sol }));
    for (var i = 0; i < o.crans; i++) { var x = m + i * pas; s.appendChild(svg('line', { class: 'cran', x1: x, y1: sol - 4, x2: x, y2: sol + 5 })); var t = svg('text', { x: x, y: sol + 34 }); t.textContent = String(i + 1); nums.push(t); s.appendChild(t); }
    var arcs = o.liens.map(function (l) {
      var x1 = m + (l.de - 1) * pas, x2 = m + (l.a - 1) * pas, r = Math.abs(x2 - x1) / 2, d = 'M' + x1 + ' ' + sol + 'A' + r + ' ' + Math.min(r, sol - 14) + ' 0 0 1 ' + x2 + ' ' + sol;
      var a = svg('path', { class: 'arche' + (l.deduit ? ' deduit' : ''), d: d }), p = svg('path', { class: 'prise', d: d, tabindex: '0', role: 'img', 'aria-label': l.t });
      function vif(oui) { a.classList.toggle('vif', oui); s.classList.toggle('vise', oui); nums[l.de - 1].classList.toggle('vif', oui); nums[l.a - 1].classList.toggle('vif', oui); if (oui && lu) { lu.textContent = ''; lu.appendChild(el('small', { text: (l.deduit ? 'déduit · ' : '') + 'de ' + l.de + ' à ' + l.a })); lu.appendChild(document.createTextNode(l.t)); } }
      p.addEventListener('mouseenter', function () { vif(true); }); p.addEventListener('mouseleave', function () { vif(false); }); p.addEventListener('focus', function () { vif(true); }); p.addEventListener('blur', function () { vif(false); });
      s.appendChild(a); return p;
    });
    arcs.forEach(function (p) { s.appendChild(p); });   /* les prises au-dessus des tracés */
    n.appendChild(s);
  };
  /* une ligne fine : KitEtude.ligne(n, { points: [..], deduit: [..] (la suite, en pointillé), unite, noms: ['janv.', …] }) */
  KE.ligne = function (n, o) {
    var W = Math.max(320, n.clientWidth || 600), H = 240, m = 8, tout = o.points.concat(o.deduit || []), max = Math.max.apply(null, tout), min = Math.min.apply(null, tout), N = tout.length;
    function X(i) { return m + i * (W - 2 * m - 90) / (N - 1); } function Y(v) { return H - 34 - (v - min) / (max - min || 1) * (H - 70); }
    var s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': n.getAttribute('aria-label') || 'Courbe' });
    s.appendChild(svg('line', { class: 'sol', x1: m, y1: H - 34, x2: W - m, y2: H - 34 }));
    function chemin(a, b) { var d = ''; for (var i = a; i <= b; i++) d += (i === a ? 'M' : 'L') + X(i).toFixed(1) + ' ' + Y(tout[i]).toFixed(1); return d; }
    s.appendChild(svg('path', { class: 'trace', d: chemin(0, o.points.length - 1) }));
    if (o.deduit && o.deduit.length) s.appendChild(svg('path', { class: 'trace deduit', d: chemin(o.points.length - 1, N - 1) }));
    var viseur = svg('line', { class: 'viseur', y1: 10, y2: H - 34 }), point = svg('circle', { class: 'point', r: 4.5 }), val = svg('text', { class: 'valeur' }), nom = svg('text', {});
    [viseur, point, val, nom].forEach(function (x) { s.appendChild(x); });
    function viser(i) {
      var x = X(i), y = Y(tout[i]); viseur.setAttribute('x1', x); viseur.setAttribute('x2', x); point.setAttribute('cx', x); point.setAttribute('cy', y);
      val.setAttribute('x', x + 12); val.setAttribute('y', y - 10); val.textContent = String(tout[i]).replace('.', ',') + (o.unite ? ' ' + o.unite : '');
      nom.setAttribute('x', x + 12); nom.setAttribute('y', H - 12); nom.textContent = (o.noms ? o.noms[i] : '') + (i >= o.points.length ? ' · déduit' : '');
    }
    n.tabIndex = 0; var ici = o.points.length - 1;
    n.addEventListener('pointermove', function (e) { var r = s.getBoundingClientRect(), i = borne(Math.round(((e.clientX - r.left) / r.width * W - m) / ((W - 2 * m - 90) / (N - 1))), 0, N - 1); ici = i; n.classList.add('vise'); viser(i); });
    n.addEventListener('pointerleave', function () { n.classList.remove('vise'); ici = o.points.length - 1; viser(ici); });
    n.addEventListener('keydown', function (e) { var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return; e.preventDefault(); ici = borne(ici + d, 0, N - 1); n.classList.add('vise'); viser(ici); });
    n.addEventListener('blur', function () { n.classList.remove('vise'); });
    n.appendChild(s); viser(ici);
  };

  /* ════ La piste : la page s'arrête, la scène se joue au défilement, puis la page repart.
     <div class="ke-piste" data-pas="4" data-niveaux="a|b|c|d"><figure class="ke-scene">…</figure></div>
     La scène reçoit --t (0 à 1) et --pas ; ses enfants [data-de="2"] arrivent au pas 2 ; scene._t = function (t) {} pour dessiner soi-même ;
     l'événement « ke:piste » porte { t, pas }. Le rail nommé se pose seul sur le bord droit. ════ */
  var pistes = [];
  KE.piste = function (p) {
    if (p._ke) return; p._ke = true;
    var sc = p.querySelector('.ke-scene'), nb = +p.dataset.pas || 1, noms = (p.dataset.niveaux || '').split('|').filter(Boolean);
    var rail = el('div', { class: 'ke-rail' + (noms.length ? '' : ' traits'), 'aria-hidden': 'true' });
    for (var i = 0; i < nb; i++) rail.appendChild(noms[i] ? el('span', {}, [noms[i], el('i')]) : el('b'));
    sc.appendChild(rail); p.style.height = 'calc(' + nb + ' * ' + (p.dataset.course || 62) + 'vh + 100vh)';
    pistes.push({ p: p, sc: sc, nb: nb, pas: -1, rail: rail });
  };
  function jouer() {
    var haut = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--barre-h')) || 0;
    pistes.forEach(function (o) {
      var r = o.p.getBoundingClientRect(), course = r.height - (window.innerHeight - haut), t = borne((haut - r.top) / course, 0, 1);
      o.sc.style.setProperty('--t', t.toFixed(4)); if (o.sc._t) o.sc._t(t);
      var pas = Math.min(o.nb - 1, Math.floor(t * o.nb));
      if (pas !== o.pas) {
        o.pas = pas; o.sc.style.setProperty('--pas', pas);
        tous(o.sc, '[data-de]').forEach(function (x) { x.classList.toggle('la', +x.dataset.de <= pas && (x.dataset.a === undefined || pas <= +x.dataset.a)); });
        [].forEach.call(o.rail.children, function (b, k) { b.classList.toggle('ici', k === pas); b.classList.toggle('passe', k < pas); });
      }
      emettre(o.sc, 'ke:piste', { t: t, pas: pas });
    });
  }
  var demande = 0;
  window.addEventListener('scroll', function () { if (pistes.length && !demande) demande = requestAnimationFrame(function () { demande = 0; jouer(); }); }, { passive: true });
  window.addEventListener('resize', function () { if (pistes.length) jouer(); });
  KE.rejouer = jouer;

  /* ════ La présentation : une diapositive à la fois. → ↓ Espace Page suivante avancent ; ← ↑ reculent ; Début, Fin ; F plein écran ; l'adresse garde la page (#3) ════ */
  KE.presentation = function (n) {
    if (n._ke) return n._ke;
    var diapos = tous(n, '.ke-d'), ici = -1, avance = n.querySelector('.ke-avance i');
    var rail = el('nav', { class: 'ke-rail', 'aria-label': 'Les diapositives' }, diapos.map(function (d, i) { return el('button', { type: 'button', 'data-i': i }, [d.dataset.nom || String(i + 1), el('i')]); }));
    n.appendChild(rail);
    diapos.forEach(function (d, i) { var p = d.querySelector('.pied'); if (p && !p.querySelector('.page')) p.appendChild(el('span', { class: 'page', text: (i + 1) + ' / ' + diapos.length })); });
    function aller(i, garder) {
      i = borne(i, 0, diapos.length - 1); if (i === ici) return; ici = i;
      diapos.forEach(function (d, k) { d.classList.toggle('ici', k === i); d.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
      [].forEach.call(rail.children, function (b, k) { b.classList.toggle('ici', k === i); b.classList.toggle('passe', k < i); b.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      if (avance) avance.style.width = ((i + 1) / diapos.length * 100) + '%';
      if (garder !== false) { try { history.replaceState(null, '', '#' + (i + 1)); } catch (x) { /* une page ouverte en fichier n'a pas d'historique à écrire */ } }
      emettre(n, 'ke:change', { valeur: i });
    }
    document.addEventListener('keydown', function (e) {
      if (e.target.closest && e.target.closest('input, textarea, [contenteditable]')) return;
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].indexOf(e.key) >= 0) aller(ici + 1); else if (['ArrowLeft', 'ArrowUp', 'PageUp'].indexOf(e.key) >= 0) aller(ici - 1);
      else if (e.key === 'Home') aller(0); else if (e.key === 'End') aller(diapos.length - 1);
      else if (e.key === 'f' || e.key === 'F') { if (document.fullscreenElement) document.exitFullscreen(); else if (n.requestFullscreen) n.requestFullscreen(); } else return;
      e.preventDefault();
    });
    rail.addEventListener('click', function (e) { var b = e.target.closest('[data-i]'); if (b) aller(+b.dataset.i); });
    n.addEventListener('click', function (e) { if (e.target.closest('button, a, .ke-rail')) return; aller(ici + (e.clientX < window.innerWidth * .3 ? -1 : 1)); });
    aller((parseInt(location.hash.slice(1), 10) || 1) - 1, false);
    return (n._ke = { aller: aller });
  };

  /* ════ Le thème : deux boutons [data-t="sombre"|"clair"] dans .ke-bascule ; le choix tient dans la page (localStorage, clé « kit-etude.theme ») ════ */
  KE.theme = function (clair, garder) {
    if (clair) document.documentElement.setAttribute('data-theme', 'light'); else document.documentElement.removeAttribute('data-theme');
    tous(document, '.ke-bascule button[data-t]').forEach(function (b) { b.setAttribute('aria-pressed', (b.dataset.t === 'clair') === clair ? 'true' : 'false'); });
    if (garder) { try { localStorage.setItem('kit-etude.theme', clair ? 'light' : 'dark'); } catch (e) { /* sans mémoire, le thème tient le temps de la page */ } }
    emettre(document, 'ke:theme', { clair: clair });
  };

  /* ════ Monter tout ce qui se reconnaît à sa classe ════ */
  KE.monter = function (racine) {
    tous(racine, '.ke-curseur').forEach(KE.curseur); tous(racine, '.ke-potard').forEach(KE.potard); tous(racine, '.ke-fader').forEach(KE.fader); tous(racine, '.ke-vu').forEach(KE.vu);
    tous(racine, '.ke-onglets').forEach(KE.onglets); tous(racine, '.ke-menu, .ke-choix').forEach(KE.menu); tous(racine, '.ke-liste[role="listbox"]').forEach(KE.liste);
    tous(racine, '.ke-lecture').forEach(function (n) { KE.lecture(n); }); tous(racine, '.ke-piste').forEach(KE.piste); tous(racine, '.ke-presentation').forEach(KE.presentation);
    tous(racine, '.ke-bascule button[data-t]').forEach(function (b) { if (b._ke) return; b._ke = true; b.addEventListener('click', function () { KE.theme(b.dataset.t === 'clair', true); }); });
    if (pistes.length) jouer();
  };
  KE.outils = { el: el, svg: svg, seg: seg, mix: mix, borne: borne, temps: temps, tirer: tirer };
  /* la modalité : après un geste de pointeur, pas de cadre de focus (un focus posé par le code en porterait un) ; il revient à la première touche */
  document.addEventListener('pointerdown', function () { document.documentElement.setAttribute('data-main', 'pointeur'); }, true);
  document.addEventListener('keydown', function (e) { if (!e.ctrlKey && !e.metaKey && !e.altKey) document.documentElement.removeAttribute('data-main'); }, true);
  function debut() { KE.theme(document.documentElement.getAttribute('data-theme') === 'light', false); KE.monter(document); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', debut); else debut();
})();
