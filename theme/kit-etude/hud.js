/* KIT ÉTUDE · LES HUD — window.KitEtude.hud. Chaque pièce se monte par data-hud="nom" (ses réglages en data-…), ou par
   KitEtude.hud.nom(element, options). Tout est en SVG ou en DOM, dessiné avec les classes de hud.css (les jetons, jamais une couleur).
   Trois règles : ce qui se règle se tire ET se règle aux flèches (role="slider") ; rien ne bouge avant « lancer » ;
   la molette n'est jamais volée (le zoom du viseur demande Ctrl + molette, ou + et −). */
(function () {
  'use strict';
  var KE = window.KitEtude, U = KE.outils, el = U.el, borne = U.borne, mix = U.mix, tirer = U.tirer;
  var H = KE.hud = {}, NS = 'http://www.w3.org/2000/svg', uid = 0;
  var calme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── les outils du trait ── */
  function S(nom, a, enfants) { var n = document.createElementNS(NS, nom), k; for (k in a || {}) { if (k === 'text') n.textContent = a[k]; else if (a[k] !== null && a[k] !== undefined) n.setAttribute(k, a[k]); } (enfants || []).forEach(function (c) { if (c) n.appendChild(c); }); return n; }
  function L(x1, y1, x2, y2, c) { return S('line', { x1: x1, y1: y1, x2: x2, y2: y2, class: c || 'hud-t' }); }
  function T(x, y, t, c, ancre, taille) { return S('text', { x: x, y: y, class: c || 'hud-p', 'text-anchor': ancre || 'start', 'font-size': taille || null, text: t }); }
  function P(d, c) { return S('path', { d: d, class: c || 'hud-t' }); }
  function C(cx, cy, r, c) { return S('circle', { cx: cx, cy: cy, r: r, class: c || 'hud-t' }); }
  function R(x, y, w, h, c) { return S('rect', { x: x, y: y, width: w, height: h, class: c || 'hud-t' }); }
  function G(a, enfants) { return S('g', a, enfants); }
  function pol(cx, cy, r, a) { a = (a - 90) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
  function arc(cx, cy, r, a0, a1) { var p = pol(cx, cy, r, a0), q = pol(cx, cy, r, a1); return 'M' + p[0].toFixed(2) + ' ' + p[1].toFixed(2) + 'A' + r + ' ' + r + ' 0 ' + (Math.abs(a1 - a0) > 180 ? 1 : 0) + ' ' + (a1 > a0 ? 1 : 0) + ' ' + q[0].toFixed(2) + ' ' + q[1].toFixed(2); }
  function rayon(cx, cy, r0, r1, a, c) { var p = pol(cx, cy, r0, a), q = pol(cx, cy, r1, a); return L(p[0], p[1], q[0], q[1], c); }
  function coins(x, y, w, h, l, c) { return P('M' + x + ' ' + (y + l) + 'V' + y + 'H' + (x + l) + 'M' + (x + w - l) + ' ' + y + 'H' + (x + w) + 'V' + (y + l) + 'M' + (x + w) + ' ' + (y + h - l) + 'V' + (y + h) + 'H' + (x + w - l) + 'M' + (x + l) + ' ' + (y + h) + 'H' + x + 'V' + (y + h - l), c); }
  function fr(x, d) { var s = Math.abs(x).toFixed(d || 0).replace('.', ','); return (x < 0 && +x.toFixed(d || 0) !== 0 ? '−' : '') + s; }
  function signe(x, d) { return (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(d || 0).replace('.', ','); }
  function deux(n) { return ('0' + Math.floor(n)).slice(-2); }
  function trois(n) { return ('00' + Math.round(((n % 360) + 360) % 360) % 360).slice(-3); }
  function ecart(a, b) { return ((a - b + 540) % 360) - 180; }   /* l'écart de cap, de −180 à 180 */
  function vider(n) { while (n.firstChild) n.removeChild(n.firstChild); return n; }
  function dire(n, nom, d) { n.dispatchEvent(new CustomEvent(nom, { bubbles: true, detail: d })); }
  function num(v, d) { return v === undefined || v === '' ? d : +v; }
  function svg(vb, attrs) { var a = { class: 'hud', viewBox: vb, 'aria-hidden': 'true' }, k; for (k in attrs || {}) a[k] = attrs[k]; return S('svg', a); }
  /* une valeur qu'on tire et qu'on règle aux flèches */
  function reglable(n, o) {
    n.classList.add('hud-regle'); n.tabIndex = n.getAttribute('data-etat') === 'arret' ? -1 : 0; n.setAttribute('role', 'slider'); if (n.getAttribute('data-etat') === 'chargement') n.setAttribute('aria-busy', 'true');
    if (o.min !== undefined) n.setAttribute('aria-valuemin', o.min); if (o.max !== undefined) n.setAttribute('aria-valuemax', o.max);
    tirer(n, function (e) { n.focus({ preventScroll: true }); n.classList.add('tenu'); return { x: e.clientX, y: e.clientY, v: o.get(), r: n.getBoundingClientRect() }; },
      function (e, c) { o.set(o.tire ? o.tire(e, c) : c.v + (o.axe === 'x' ? (c.x - e.clientX) : (c.y - e.clientY)) * o.parPx * (e.shiftKey ? .25 : 1)); },
      function () { n.classList.remove('tenu'); });
    n.addEventListener('keydown', function (e) {
      var p = o.pas * (e.shiftKey ? 10 : 1), d = (e.key === 'ArrowRight' || e.key === 'ArrowUp') ? p : (e.key === 'ArrowLeft' || e.key === 'ArrowDown') ? -p : e.key === 'PageUp' ? p * 10 : e.key === 'PageDown' ? -p * 10 : null;
      if (e.key === 'Home' && o.min !== undefined) { e.preventDefault(); o.set(o.min); return; } if (e.key === 'End' && o.max !== undefined) { e.preventDefault(); o.set(o.max); return; }
      if (d === null) return; e.preventDefault(); o.set(o.get() + (o.sens === -1 && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') ? -d : d));
    });
    if (o.depart !== undefined) n.addEventListener('dblclick', function () { o.set(o.depart); });
  }
  function aria(n, v, texte) { n.setAttribute('aria-valuenow', v); n.setAttribute('aria-valuetext', texte); }

  /* ════ 01 · LES CADRES DE VISÉE ════ data-type : coins, crochets, mires, graticule, regles, tiers, or, zones, points, formats */
  H.cadre = function (n, o) {
    var W = 320, Hh = 200, s = svg('0 0 320 200', { width: '100%' }), k, x, y;
    function a(x) { s.appendChild(x); return x; }
    switch (o.type) {
      case 'coins': a(coins(14, 14, 292, 172, 24, 'hud-f hud-cle')); a(coins(96, 60, 128, 80, 9, 'hud-t')); a(L(154, 100, 166, 100)); a(L(160, 94, 160, 106)); break;
      case 'crochets':
        a(P('M34 40H22V160H34M286 40H298V160H286', 'hud-f hud-cle')); a(P('M150 22V14H170V22M150 178V186H170V178', 'hud-t2'));
        for (k = 0; k < 7; k++) { a(L(22, 52 + k * 16, k % 3 ? 27 : 31, 52 + k * 16)); a(L(298, 52 + k * 16, k % 3 ? 293 : 289, 52 + k * 16)); }
        a(L(148, 100, 172, 100, 'hud-t2')); a(L(160, 88, 160, 112, 'hud-t2')); break;
      case 'mires':
        [[26, 24], [294, 24], [26, 176], [294, 176]].forEach(function (p) { a(C(p[0], p[1], 7, 'hud-t2 hud-cle')); a(L(p[0] - 13, p[1], p[0] + 13, p[1])); a(L(p[0], p[1] - 13, p[0], p[1] + 13)); });
        a(C(160, 100, 16, 'hud-t')); a(C(160, 100, 5, 'hud-t2 hud-cle')); a(L(130, 100, 190, 100)); a(L(160, 70, 160, 130));
        [[160, 14, 0, 8], [160, 186, 0, -8], [14, 100, 8, 0], [306, 100, -8, 0]].forEach(function (p) { a(L(p[0], p[1], p[0] + p[2], p[1] + p[3], 'hud-t2')); }); break;
      case 'graticule':
        for (x = 40; x < W; x += 40) a(L(x, 0, x, Hh, x === 160 ? 'hud-t' : 'hud-pale'));
        for (y = 20; y < Hh; y += 40) a(L(0, y, W, y, y === 100 ? 'hud-t' : 'hud-pale'));
        for (x = 8; x < W; x += 8) a(L(x, x % 40 ? 97 : 94, x, x % 40 ? 103 : 106, 'hud-t2 hud-cle'));
        for (y = 4; y < Hh; y += 8) a(L((y - 20) % 40 ? 157 : 154, y, (y - 20) % 40 ? 163 : 166, y, 'hud-t2 hud-cle')); break;
      case 'regles':
        for (x = 0; x <= W; x += 8) a(L(x, 0, x, x % 40 ? 6 : 13, x % 40 ? 'hud-t' : 'hud-t2 hud-cle'));
        for (y = 0; y <= Hh; y += 8) a(L(0, y, y % 40 ? 6 : 13, y, y % 40 ? 'hud-t' : 'hud-t2 hud-cle'));
        for (x = 40; x < W; x += 40) a(T(x + 4, 24, String(x / 4)));
        for (y = 40; y < Hh; y += 40) a(T(18, y + 4, String(y / 4)));
        a(P('M112 0V200M0 78H320', 'hud-or hud-tiret')).setAttribute('class', 'hud-t hud-tiret hud-cle'); a(T(118, 92, '28 × 19,5', 'hud-n', 'start', 17)); break;
      case 'tiers':
        a(P('M107 0V200M213 0V200M0 67H320M0 133H320', 'hud-t'));
        [[107, 67], [213, 67], [107, 133], [213, 133]].forEach(function (p) { a(C(p[0], p[1], 5, 'hud-t2 hud-cle')); }); a(coins(8, 8, 304, 184, 12, 'hud-t')); break;
      case 'or': (function () {
        var X = 18, Y = 12.5, w = 284, h = 175.5, d = '', lignes = '', i, c;
        for (i = 0; i < 8; i++) {
          c = i % 4;
          if (c === 0) { d += (i ? '' : 'M' + X + ' ' + (Y + h)) + 'A' + h + ' ' + h + ' 0 0 1 ' + (X + h) + ' ' + Y; lignes += 'M' + (X + h) + ' ' + Y + 'V' + (Y + h); X += h; w -= h; }
          else if (c === 1) { d += 'A' + w + ' ' + w + ' 0 0 1 ' + (X + w) + ' ' + (Y + w); lignes += 'M' + X + ' ' + (Y + w) + 'H' + (X + w); Y += w; h -= w; }
          else if (c === 2) { d += 'A' + h + ' ' + h + ' 0 0 1 ' + (X + w - h) + ' ' + (Y + h); lignes += 'M' + (X + w - h) + ' ' + Y + 'V' + (Y + h); w -= h; }
          else { d += 'A' + w + ' ' + w + ' 0 0 1 ' + X + ' ' + (Y + h - w); lignes += 'M' + X + ' ' + (Y + h - w) + 'H' + (X + w); h -= w; }
        }
        a(R(18, 12.5, 284, 175.5, 'hud-t')); a(P(lignes, 'hud-t')); a(P(d, 'hud-f hud-cle'));
      })(); break;
      case 'zones':
        a(R(.5, .5, 319, 199, 'hud-t')); a(R(11.2, 7, 297.6, 186, 'hud-t2 hud-cle')); a(R(32, 20, 256, 160, 'hud-t hud-tiret'));
        a(T(16, 20, 'action · 93 %')); a(T(37, 33, 'titre · 80 %')); a(L(152, 100, 168, 100, 'hud-t2')); a(L(160, 92, 160, 108, 'hud-t2')); break;
      case 'points':
        for (y = 0; y < 5; y++) for (x = 0; x < 9; x++) { if ((y === 0 || y === 4) && (x < 2 || x > 6)) continue; a(R(52 + x * 26 - 4, 48 + y * 26 - 4, 8, 8, x === 4 && y === 2 ? 'hud-plein3 hud-cle' : 'hud-t')); }
        a(coins(132, 76, 56, 48, 10, 'hud-f hud-cle')); a(coins(14, 14, 292, 172, 10, 'hud-t')); break;
      case 'formats':
        [[2.39, '2,39'], [1.85, '1,85'], [1.333, '1,33']].forEach(function (f, i) { var w = Math.min(296, 176 * f[0]), h = w / f[0]; a(R(160 - w / 2, 100 - h / 2, w, h, i === 0 ? 'hud-f hud-cle' : i === 1 ? 'hud-t2' : 'hud-t hud-tiret')); a(T(160 - w / 2 + 6, 100 - h / 2 + 15, f[1], i === 0 ? 'hud-p2' : 'hud-p')); });
        a(L(152, 100, 168, 100)); a(L(160, 92, 160, 108)); break;
    }
    n.insertBefore(s, n.firstChild);
    if (n.tagName === 'BUTTON') n.addEventListener('click', function () { var v = n.getAttribute('aria-pressed') !== 'true'; n.setAttribute('aria-pressed', String(v)); var i = n.querySelector('span i'); if (i) i.textContent = v ? 'tenu' : (i.dataset.repos || ''); });
  };

  /* ════ 02 · LES RÉTICULES ════ data-type : croix, point, tele, crans, suivi, verrou, duplex, chevron. Un clic verrouille : il se resserre. */
  H.reticuleTrace = function (type) {
    var g = G({ class: 'hud-serre' + (type === 'verrou' || type === 'suivi' ? '' : ' droit') }), fixe = G({}), i, a;
    function s(x) { g.appendChild(x); return x; } function f(x) { fixe.appendChild(x); return x; }
    switch (type) {
      case 'croix': s(P('M-62 0H-9M9 0H62M0 -62V-9M0 9V62', 'hud-t2 hud-cle')); f(C(0, 0, 1.4, 'hud-plein2 hud-cle')); [-62, 62].forEach(function (v) { s(L(v, -5, v, 5)); s(L(-5, v, 5, v)); }); break;
      case 'point': f(C(0, 0, 2.2, 'hud-plein2 hud-cle')); s(C(0, 0, 30, 'hud-t2 hud-cle')); for (i = 0; i < 4; i++) s(rayon(0, 0, 30, 42, i * 90, 'hud-t2 hud-cle')); s(C(0, 0, 58, 'hud-pale')); break;
      case 'tele':
        s(P('M-66 0H-6M6 0H66M0 6V66M0 -6V-30', 'hud-t2 hud-cle'));
        for (i = 1; i <= 5; i++) { s(L(-i * 11, -(i % 2 ? 3 : 5), -i * 11, (i % 2 ? 3 : 5))); s(L(i * 11, -(i % 2 ? 3 : 5), i * 11, (i % 2 ? 3 : 5))); s(L(-(7 - i) * 1.6 - 2, i * 11, (7 - i) * 1.6 + 2, i * 11)); if (i % 2 === 0) s(T(14, i * 11 + 4, String(i), 'hud-p')); }
        f(C(0, 0, 1.2, 'hud-plein2 hud-cle')); break;
      case 'crans': s(C(0, 0, 46, 'hud-t')); for (a = 0; a < 360; a += 10) s(rayon(0, 0, a % 90 === 0 ? 34 : a % 30 === 0 ? 39 : 43, 46, a, a % 90 === 0 ? 'hud-t2 hud-cle' : 'hud-t')); s(P('M-14 0H-4M4 0H14M0 -14V-4M0 4V14', 'hud-t2 hud-cle')); s(P('M0 -62L-4 -54H4Z', 'hud-plein2 hud-cle')); break;
      case 'suivi': s(coins(-34, -34, 68, 68, 13, 'hud-f hud-cle')); f(P('M0 -5L5 0L0 5L-5 0Z', 'hud-t2 hud-cle')); [[-48, 0, -40, 0], [40, 0, 48, 0], [0, -48, 0, -40], [0, 40, 0, 48]].forEach(function (p) { s(L(p[0], p[1], p[2], p[3], 'hud-t2')); }); break;
      case 'verrou': for (i = 0; i < 4; i++) { s(P(arc(0, 0, 52, i * 90 - 26, i * 90 + 26), 'hud-f hud-cle')); s(rayon(0, 0, 40, 52, i * 90, 'hud-t2 hud-cle')); } f(P('M-9 0H-3M3 0H9M0 -9V-3M0 3V9', 'hud-t2')); break;
      case 'duplex': s(P('M-66 0H-26M26 0H66M0 26V66', 'hud-ff hud-cle')); f(P('M-26 0H26M0 -40V26', 'hud-t2')); break;
      case 'chevron': s(P('M-16 14L0 0L16 14', 'hud-f hud-cle')); for (i = 1; i <= 4; i++) { s(L(-(6 + i * 3), 14 + i * 12, 6 + i * 3, 14 + i * 12, 'hud-t2')); s(T(12 + i * 3, 18 + i * 12, String(i * 2), 'hud-p')); } s(L(0, 22, 0, 62)); s(P('M-60 0H-34M34 0H60', 'hud-t')); break;
    }
    fixe.appendChild(C(0, 0, 3, 'hud-plein-or hud-coeur'));
    return G({}, [g, fixe]);
  };
  H.reticule = function (n, o) {
    var s = svg('-80 -80 160 160'); s.appendChild(H.reticuleTrace(o.type)); n.insertBefore(s, n.firstChild);
    var em = n.querySelector('em'); function etat() { if (em) em.textContent = n.getAttribute('aria-pressed') === 'true' ? 'verrouillé' : (em.dataset.repos || 'libre'); }
    if (n.tagName === 'BUTTON' && !n.disabled) n.addEventListener('click', function () { n.setAttribute('aria-pressed', n.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); etat(); });
    etat();
  };

  /* ════ 03 · LA CIBLE SUIVIE ════ un cadre suit un point ; sa route prévue en pointillé ambre ; son étiquette au bout d'un filet */
  H.suivi = function (n) {
    var W = 900, Hh = 330, s = svg('0 0 900 330', { role: 'img', 'aria-label': 'Une cible suivie, sa route prévue, sa distance' }), t = 3.1, x, y, i;
    for (x = 60; x < W; x += 60) s.appendChild(L(x, 0, x, Hh, 'hud-pale')); for (y = 60; y < Hh; y += 60) s.appendChild(L(0, y, W, y, 'hud-pale'));
    s.appendChild(coins(16, 16, W - 32, Hh - 32, 20, 'hud-t'));
    function pos(u) { return [450 + 280 * Math.sin(u * .52 + .4) + 40 * Math.sin(u * 1.7), 165 + 84 * Math.sin(u * .83 + 1.2) + 14 * Math.cos(u * 2.3)]; }
    var trace = P('', 'hud-t2'), prevu = P('', 'hud-amb'), fantome = coins(-22, -22, 44, 44, 9, 'hud-amb'), cadre = G({}, [coins(-26, -26, 52, 52, 11, 'hud-or'), P('M0 -4L4 0L0 4L-4 0Z', 'hud-plein-or')]);
    var fil = P('', 'hud-or'), nom = T(0, 0, 'Cible 01', 'hud-nom', 'start', 15), dist = T(0, 0, '', 'hud-n', 'start', 30), sous = T(0, 0, '', 'hud-p'), prevuT = T(0, 0, '', 'hud-p hud-c-amb');
    [trace, prevu, fantome, fil, cadre, nom, dist, sous, prevuT].forEach(function (e) { s.appendChild(e); });
    function peindre() {
      var p = pos(t), d = '', q, v, k, fin = pos(t + 2.6), aDroite = p[0] < 190 ? true : p[0] > 710 ? false : fin[0] < p[0], ex, ey;
      for (i = 0; i <= 30; i++) { q = pos(t - 1.8 + i * .06); d += (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); } trace.setAttribute('d', d);
      d = ''; for (i = 0; i <= 40; i++) { q = pos(t + i * .065); d += (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); } prevu.setAttribute('d', d);
      fantome.setAttribute('transform', 'translate(' + fin[0].toFixed(1) + ' ' + fin[1].toFixed(1) + ')');
      cadre.setAttribute('transform', 'translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ')');
      ex = p[0] + (aDroite ? 74 : -74); ey = (fin[1] < p[1] ? p[1] + 70 > 280 : p[1] - 62 > 50) ? p[1] - 62 : p[1] + 70; if (ey < 44) ey = p[1] + 70; if (ey > 284) ey = p[1] - 62; k = aDroite ? 1 : -1;
      fil.setAttribute('d', 'M' + (p[0] + k * 26) + ' ' + (p[1] + (ey < p[1] ? -26 : 26)) + 'L' + ex + ' ' + ey + 'H' + (ex + k * 150));
      [nom, dist, sous].forEach(function (e) { e.setAttribute('text-anchor', aDroite ? 'start' : 'end'); e.setAttribute('x', ex + k * 8); });
      nom.setAttribute('y', ey - 10); dist.setAttribute('y', ey + 32); sous.setAttribute('y', ey + 50);
      v = pos(t + .05); var vit = Math.hypot(v[0] - p[0], v[1] - p[1]) / .05;
      dist.textContent = fr(4.2 + 1.8 * Math.sin(t * .31), 2) + ' km'; sous.textContent = 'vitesse ' + fr(vit / 6, 1) + ' m/s · au ' + trois(62 + p[0] / 18);
      prevuT.setAttribute('x', fin[0] + 30); prevuT.setAttribute('y', fin[1] + 4); prevuT.textContent = 'dans 2,6 s';
    }
    n.appendChild(s); peindre();
    n._hud = { pas: function (dt) { t += dt; peindre(); } };
  };

  /* ════ 04 · L'ATTITUDE ════ l'horizon artificiel, le ruban de cap, les rubans verticaux */
  H.horizon = function (n, o) {
    var roulis = num(o.roulis, -8), tangage = num(o.tangage, 4), id = 'hud-h' + (++uid), s = svg('-160 -170 320 340'), R0 = 132, monde = G({}), i;
    s.appendChild(S('clipPath', { id: id }, [C(0, 0, R0)])); var clip = G({ 'clip-path': 'url(#' + id + ')' }, [monde]); s.appendChild(clip);
    s.appendChild(C(0, 0, R0, 'hud-t'));
    /* l'échelle de roulis, fixe, et son index mobile */
    [-60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60].forEach(function (a) { s.appendChild(rayon(0, 0, R0, R0 + (a % 30 === 0 ? 14 : 8), a, a === 0 ? 'hud-t2' : 'hud-t')); });
    [-60, -30, 30, 60].forEach(function (a) { var p = pol(0, 0, R0 + 26, a); s.appendChild(T(p[0], p[1] + 4, String(Math.abs(a)), 'hud-p', 'middle')); });
    var index = P('M0 ' + (-R0 + 2) + 'L-6 ' + (-R0 + 14) + 'H6Z', 'hud-plein hud-main'); s.appendChild(index);
    /* la maquette, fixe */
    s.appendChild(P('M-78 0H-30L-18 12M78 0H30L18 12', 'hud-f hud-main')); s.appendChild(R(-2.5, -2.5, 5, 5, 'hud-plein hud-main'));
    var lit = T(0, 158, '', 'hud-n', 'middle', 22); s.appendChild(lit);
    function peindre() {
      vider(monde); var k = 5.2, a;
      monde.setAttribute('transform', 'rotate(' + (-roulis) + ') translate(0 ' + (tangage * k) + ')');
      monde.appendChild(R(-400, 0, 800, 600, 'hud-voile')); monde.appendChild(L(-400, 0, 400, 0, 'hud-t2'));
      for (a = -90; a <= 90; a += 5) { if (!a || Math.abs(a - tangage) > 30) continue; var w = a % 10 ? 22 : 46, y = -a * k; monde.appendChild(P('M' + (-w) + ' ' + y + 'H-12M12 ' + y + 'H' + w + (a % 10 ? '' : 'M' + (-w) + ' ' + y + 'v' + (a > 0 ? 6 : -6) + 'M' + w + ' ' + y + 'v' + (a > 0 ? 6 : -6)), a < 0 ? 'hud-t hud-tiret' : 'hud-t2')); if (a % 10 === 0) { monde.appendChild(T(-w - 8, y + 4, String(Math.abs(a)), 'hud-p', 'end')); monde.appendChild(T(w + 8, y + 4, String(Math.abs(a)), 'hud-p')); } }
      index.setAttribute('transform', 'rotate(' + (-roulis) + ')');
      lit.textContent = 'roulis ' + signe(roulis) + '°  ·  assiette ' + signe(tangage) + '°';
      aria(n, roulis, 'roulis ' + roulis + ' degrés, assiette ' + tangage + ' degrés');
    }
    n.appendChild(s); n.classList.add('hud-regle'); n.tabIndex = 0; n.setAttribute('role', 'slider'); n.setAttribute('aria-label', n.getAttribute('aria-label') || 'Horizon artificiel');
    function poser(r, t) { roulis = Math.round(borne(r, -60, 60)); tangage = Math.round(borne(t, -30, 30) * 2) / 2; peindre(); dire(n, 'ke:change', { valeur: [roulis, tangage] }); }
    tirer(n, function (e) { n.focus({ preventScroll: true }); n.classList.add('tenu'); return { x: e.clientX, y: e.clientY, r: roulis, t: tangage }; }, function (e, c) { poser(c.r + (e.clientX - c.x) * .4, c.t - (e.clientY - c.y) * .15); }, function () { n.classList.remove('tenu'); });
    n.addEventListener('keydown', function (e) { var d = e.shiftKey ? 5 : 1; if (e.key === 'ArrowLeft') poser(roulis - d, tangage); else if (e.key === 'ArrowRight') poser(roulis + d, tangage); else if (e.key === 'ArrowUp') poser(roulis, tangage + d * .5); else if (e.key === 'ArrowDown') poser(roulis, tangage - d * .5); else if (e.key === 'Home') poser(0, 0); else return; e.preventDefault(); });
    n.addEventListener('dblclick', function () { poser(0, 0); });
    peindre(); return (n._hud = { poser: poser });
  };
  var ROSE = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SO', 270: 'O', 315: 'NO' };
  /* le ruban de cap, dans un groupe : (g, largeur, cap, pxParDegré, consigne, prévu) — sert aussi au viseur */
  function traceCap(g, W, cap, k, consigne, prevu, etat) {
    vider(g); var demi = W / 2 / k, a0 = Math.ceil((cap - demi) / 5) * 5, a, x, m;
    g.appendChild(L(-W / 2, 0, W / 2, 0, 'hud-t'));
    for (a = a0; a <= cap + demi; a += 5) { m = ((a % 360) + 360) % 360; x = (a - cap) * k; g.appendChild(L(x, 0, x, m % 10 ? 7 : 13, m % 90 === 0 ? 'hud-t2' : 'hud-t')); if (m % 10 === 0 && Math.abs(x) > 44) { if (ROSE[m] !== undefined) g.appendChild(T(x, 34, ROSE[m], 'hud-nom', 'middle', m % 90 ? 12 : 16)); else g.appendChild(T(x, 31, deux(m / 10), 'hud-p', 'middle')); } }
    if (prevu !== undefined && Math.abs(ecart(prevu, cap)) < demi) { x = ecart(prevu, cap) * k; g.appendChild(L(0, -9, x, -9, 'hud-amb')); g.appendChild(C(x, -9, 3.5, 'hud-amb')); }
    if (consigne !== undefined) { x = borne(ecart(consigne, cap) * k, -W / 2, W / 2); g.appendChild(P('M' + x + ' 0l-6 -9v-6h12v6z', 'hud-plein-or hud-vif')); }
    g.appendChild(R(-40, 14, 80, 30, 'hud-fond')); g.appendChild(P('M-40 46V16H-7L0 6L7 16H40V46Z', 'hud-f hud-main'));
    g.appendChild(T(0, 41, etat === 'perdu' ? '— —' : etat === 'chargement' ? '· · ·' : trois(cap), 'hud-n', 'middle', 26));
  }
  H.cap = function (n, o) {
    var cap = num(o.cap, 47), W = 760, k = 7, s = svg('-380 -22 760 84'), id = 'hud-c' + (++uid), g = G({ 'clip-path': 'url(#' + id + ')' });
    s.appendChild(S('clipPath', { id: id }, [R(-380, -22, 760, 84, '')])); s.appendChild(g); n.appendChild(s);
    function poser(v) { cap = ((Math.round(v * 2) / 2) % 360 + 360) % 360; traceCap(g, W, cap, k, o.consigne !== undefined ? +o.consigne : undefined, o.prevu !== undefined ? +o.prevu : undefined, o.etat); aria(n, cap, 'cap ' + trois(cap)); dire(n, 'ke:change', { valeur: cap }); }
    reglable(n, { get: function () { return cap; }, set: poser, axe: 'x', parPx: -1 / k, pas: 1, depart: cap });
    n.setAttribute('aria-label', n.getAttribute('aria-label') || 'Cap'); poser(cap); return (n._hud = { poser: poser });
  };
  /* un ruban vertical : (g, hauteur, valeur, {pxParUnite, pas, gros, dec, cote, consigne, prevu, min, max}) */
  function traceRuban(g, Hh, v, o) {
    vider(g); var c = o.cote === 'gauche' ? -1 : 1, demi = Hh / 2 / o.k, a0 = Math.ceil((v - demi) / o.pas) * o.pas, a, y, i = 0, gros;
    g.appendChild(L(0, -Hh / 2, 0, Hh / 2, 'hud-t'));
    for (a = a0; a <= v + demi + 1e-6; a += o.pas) { if ((o.min !== undefined && a < o.min - 1e-6) || (o.max !== undefined && a > o.max + 1e-6)) continue; y = -(a - v) * o.k; gros = Math.abs(a / o.gros - Math.round(a / o.gros)) < 1e-6; g.appendChild(L(0, y, c * (gros ? 13 : 7), y, gros ? 'hud-t2' : 'hud-t')); if (gros && Math.abs(y) > 24) g.appendChild(T(c * 20, y + 4, fr(a, o.decRep === undefined ? o.dec : o.decRep), 'hud-p', c > 0 ? 'start' : 'end')); if (++i > 400) break; }
    if (o.prevu !== undefined) { y = borne(-(o.prevu - v) * o.k, -Hh / 2, Hh / 2); g.appendChild(L(-c * 9, 0, -c * 9, y, 'hud-amb')); g.appendChild(C(-c * 9, y, 3.5, 'hud-amb')); }
    if (o.consigne !== undefined) { y = borne(-(o.consigne - v) * o.k, -Hh / 2, Hh / 2); g.appendChild(P('M0 ' + y + 'l' + (-c * 9) + ' -6h' + (-c * 6) + 'v12h' + (c * 6) + 'z', 'hud-plein-or hud-vif')); }
    g.appendChild(R(c > 0 ? 14 : -92, -17, 78, 34, 'hud-fond'));
    g.appendChild(P('M' + (c * 92) + ' -17H' + (c * 16) + 'L' + (c * 6) + ' 0L' + (c * 16) + ' 17H' + (c * 92), 'hud-f hud-main'));
    g.appendChild(T(c * 86, 9, o.perdu ? '— —' : o.charge ? '· · ·' : fr(v, o.dec), 'hud-n', c > 0 ? 'end' : 'start', 25));
  }
  H.ruban = function (n, o) {
    var v = num(o.valeur, 0), Hh = 340, id = 'hud-r' + (++uid), s = svg('-100 -196 200 392'), g = G({ 'clip-path': 'url(#' + id + ')' });
    var r = { k: num(o.k, 3), pas: num(o.pas, 5), gros: num(o.gros, 25), dec: num(o.dec, 0), cote: o.cote || 'droite', consigne: o.consigne !== undefined ? +o.consigne : undefined, prevu: o.prevu !== undefined ? +o.prevu : undefined, min: o.min !== undefined ? +o.min : undefined, max: o.max !== undefined ? +o.max : undefined, perdu: o.etat === 'perdu', charge: o.etat === 'chargement' };
    s.appendChild(S('clipPath', { id: id }, [R(-100, -170, 200, 340, '')])); s.appendChild(g);
    s.appendChild(T(0, -180, o.nom || '', 'hud-nom', 'middle', 14)); s.appendChild(T(0, 192, o.etat === 'chargement' ? 'en cours' : o.unite || '', 'hud-p', 'middle')); n.appendChild(s);
    function poser(x) { var q = Math.pow(10, r.dec); v = Math.round(borne(x, r.min === undefined ? -1e9 : r.min, r.max === undefined ? 1e9 : r.max) * q) / q; traceRuban(g, Hh, v, r); aria(n, v, fr(v, r.dec) + ' ' + (o.unite || '')); dire(n, 'ke:change', { valeur: v }); }
    reglable(n, { get: function () { return v; }, set: poser, axe: 'y', parPx: 1 / r.k, pas: num(o.pasClavier, r.pas / 5), min: r.min, max: r.max, depart: v });
    n.setAttribute('aria-label', n.getAttribute('aria-label') || o.nom || 'Ruban'); poser(v); return (n._hud = { poser: poser });
  };

  /* ════ 05 · LE RADAR ════ des anneaux, un balayage (après « lancer »), des échos qu'on choisit ; la portée se règle */
  H.radar = function (n, o) {
    var portee = num(o.portee, 20), R0 = 170, s = svg('-205 -205 410 410', { 'aria-hidden': null, role: 'group', 'aria-label': 'Radar' }), theta = 38, joue = false, tenu = null, i, a;
    var ECHOS = o.echos || [{ nom: 'Alpha', a: 24, d: 6.2, cap: 140, v: 12 }, { nom: 'Bravo', a: 78, d: 14.5, cap: 250, v: 31 }, { nom: 'Charlie', a: 141, d: 9.1, cap: 20, v: 8 }, { nom: 'Delta', a: 203, d: 17.8, cap: 95, v: 22 }, { nom: 'Écho', a: 262, d: 3.4, cap: 310, v: 5 }, { nom: 'Fox', a: 318, d: 31, cap: 180, v: 40 }, { nom: 'Golf', a: 349, d: 12.3, cap: 60, v: 16 }];
    var fixe = G({}), dyn = G({}), bal = G({}), pts = G({}); [fixe, dyn, bal, pts].forEach(function (g) { s.appendChild(g); });
    for (a = 0; a < 360; a += 5) fixe.appendChild(rayon(0, 0, R0, R0 + (a % 30 === 0 ? 12 : a % 10 === 0 ? 8 : 4), a, a % 90 === 0 ? 'hud-t2' : 'hud-t'));
    [0, 90, 180, 270].forEach(function (a) { var p = pol(0, 0, R0 + 26, a); fixe.appendChild(T(p[0], p[1] + 6, ROSE[a], 'hud-nom', 'middle', 16)); });
    [30, 60, 120, 150, 210, 240, 300, 330].forEach(function (a) { var p = pol(0, 0, R0 + 24, a); fixe.appendChild(T(p[0], p[1] + 4, deux(a / 10), 'hud-p', 'middle')); });
    fixe.appendChild(L(-R0, 0, R0, 0, 'hud-pale')); fixe.appendChild(L(0, -R0, 0, R0, 'hud-pale'));
    for (i = 1; i <= 4; i++) fixe.appendChild(C(0, 0, R0 * i / 4, i === 4 ? 'hud-t' : 'hud-pale'));
    fixe.appendChild(P('M0 -7L5 6H-5Z', 'hud-plein2'));
    for (i = 0; i < 14; i++) { var w = P(arc(0, 0, R0, -i * 3 - 3, -i * 3) + 'L0 0Z', 'hud-plein'); w.setAttribute('opacity', (.16 * (1 - i / 14)).toFixed(3)); bal.appendChild(w); }
    bal.appendChild(L(0, 0, 0, -R0, 'hud-t2'));
    var noeuds = ECHOS.map(function (e) {
      var g = G({ class: 'hud-echo', tabindex: '0', role: 'button', 'aria-label': 'Écho ' + e.nom }, [P('', 'hud-amb'), C(0, 0, 11, 'hud-e-an'), C(0, 0, 3.2, 'hud-e-pt'), C(0, 0, 16, 'hud-prise'), T(16, -10, e.nom, 'hud-nom', 'start', 12)]);
      g.addEventListener('click', function () { prendre(e); }); g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); prendre(e); } });
      pts.appendChild(g); return g;
    });
    function prendre(e) { tenu = tenu === e ? null : e; peindre(); dire(n, 'ke:change', { echo: tenu, portee: portee }); }
    function peindre() {
      vider(dyn); for (i = 1; i <= 4; i++) dyn.appendChild(T(5, -R0 * i / 4 + 13, fr(portee * i / 4, portee < 8 ? 1 : 0), 'hud-p'));
      bal.setAttribute('transform', 'rotate(' + theta + ')'); bal.style.opacity = joue ? '1' : '.55';
      ECHOS.forEach(function (e, k) {
        var g = noeuds[k], dedans = e.d <= portee, p = pol(0, 0, e.d / portee * R0, e.a), age = ((theta - e.a) % 360 + 360) % 360;
        g.style.display = dedans ? '' : 'none'; if (!dedans) { if (tenu === e) tenu = null; return; }
        g.setAttribute('transform', 'translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ')'); g.classList.toggle('tenu', tenu === e);
        g.children[2].setAttribute('opacity', tenu === e ? 1 : joue ? Math.max(.22, 1 - age / 300).toFixed(2) : .85);
        var q = pol(0, 0, Math.min(60, e.v * 1.6 * 20 / portee), e.cap); g.firstChild.setAttribute('d', tenu === e ? 'M0 0L' + q[0].toFixed(1) + ' ' + q[1].toFixed(1) : '');
      });
    }
    n.appendChild(s); if (o.tenu !== undefined) tenu = ECHOS[+o.tenu]; peindre();
    n.addEventListener('keydown', function (e) { if (e.key === '+' || e.key === '=') api.portee(portee / 2); else if (e.key === '-') api.portee(portee * 2); else if (e.key === 'Escape' && tenu) prendre(tenu); else return; e.preventDefault(); });
    var api = n._hud = { pas: function (dt) { joue = true; theta = (theta + dt * 90) % 360; peindre(); }, arret: function () { joue = false; peindre(); }, portee: function (p) { portee = borne(p, 5, 80); peindre(); dire(n, 'ke:change', { echo: tenu, portee: portee }); }, echos: ECHOS, tenu: function () { return tenu; } };
    return api;
  };

  /* ════ 06 · LES JAUGES ════ */
  /* l'arc : la valeur au centre, une consigne orange, une zone à ne pas passer en double trait */
  H.arc = function (n, o) {
    var min = num(o.min, 0), max = num(o.max, 100), v = num(o.valeur, 50), dec = num(o.dec, 0), A0 = -125, A1 = 125, R0 = 82, s = svg('-110 -104 220 190'), i;
    function ang(x) { return A0 + (A1 - A0) * (x - min) / (max - min); }
    s.appendChild(P(arc(0, 0, R0, A0, A1), 'hud-t'));
    for (i = 0; i <= 40; i++) s.appendChild(rayon(0, 0, R0 + 4, R0 + (i % 10 === 0 ? 14 : i % 5 === 0 ? 10 : 7), A0 + (A1 - A0) * i / 40, i % 10 === 0 ? 'hud-t2' : 'hud-t'));
    [0, .5, 1].forEach(function (f) { var p = pol(0, 0, R0 + 26, A0 + (A1 - A0) * f); s.appendChild(T(p[0], p[1] + 4, fr(min + (max - min) * f, 0), 'hud-p', 'middle')); });
    if (o.limite !== undefined) s.appendChild(P(arc(0, 0, R0 - 6, ang(+o.limite), A1), 'hud-t2'));
    if (o.prevu !== undefined) s.appendChild(P(arc(0, 0, R0 - 12, ang(v), ang(+o.prevu)), 'hud-amb hud-vif'));
    var plein = P('', 'hud-f hud-main hud-vif'), prise = C(0, 0, 4.5, 'hud-plein hud-main hud-vif'), lit = T(0, 14, '', 'hud-n', 'middle', 50); s.appendChild(plein); s.appendChild(prise);
    if (o.consigne !== undefined) { var p = pol(0, 0, R0 - 4, ang(+o.consigne)); s.appendChild(P('M0 0l-5 9h10z', 'hud-plein-or hud-vif')).setAttribute('transform', 'translate(' + p[0] + ' ' + p[1] + ') rotate(' + ang(+o.consigne) + ')'); }
    s.appendChild(lit); s.appendChild(T(0, 36, o.etat === 'chargement' ? 'en cours' : o.unite || '', 'hud-p', 'middle')); s.appendChild(T(0, 78, o.nom || '', 'hud-nom', 'middle', 14)); n.appendChild(s);
    var perdu = o.etat === 'perdu', charge = o.etat === 'chargement';
    function poser(x) { var q = Math.pow(10, dec); v = Math.round(borne(x, min, max) * q) / q; var a = ang(v), p = pol(0, 0, R0, a); plein.setAttribute('d', arc(0, 0, R0, A0, a === A0 ? A0 + .01 : a)); prise.setAttribute('cx', p[0]); prise.setAttribute('cy', p[1]); lit.textContent = perdu ? '— —' : charge ? '· · ·' : fr(v, dec); aria(n, v, fr(v, dec) + ' ' + (o.unite || '')); dire(n, 'ke:change', { valeur: v }); }
    reglable(n, { get: function () { return v; }, set: poser, axe: 'y', parPx: (max - min) / 180, pas: (max - min) / 100, min: min, max: max, depart: v });
    n.setAttribute('aria-label', n.getAttribute('aria-label') || o.nom || 'Jauge'); poser(v); return (n._hud = { poser: poser });
  };
  /* les segments : une barre de traits ; consigne en double cran orange ; le prévu en trame d'ambre */
  H.segments = function (n, o) {
    var nb = num(o.traits, 32), min = num(o.min, 0), max = num(o.max, 100), v = num(o.valeur, 40), seg = el('span', { class: 'seg' }), out = el('output'), traits = [], i;
    for (i = 0; i < nb; i++) { var t = el('i'); traits.push(t); seg.appendChild(t); } n.appendChild(seg); n.appendChild(out);
    function poser(x) {
      v = Math.round(borne(x, min, max)); var k = Math.round((v - min) / (max - min) * nb), c = o.consigne !== undefined ? Math.round((o.consigne - min) / (max - min) * nb) - 1 : -1, p = o.prevu !== undefined ? Math.round((o.prevu - min) / (max - min) * nb) : -1;
      traits.forEach(function (t, i) { t.className = (i < k ? 'on' : i < p ? 'pre' : '') + (i === c ? ' cons' : ''); });
      out.textContent = ''; out.appendChild(document.createTextNode(o.etat === 'perdu' ? '— —' : o.etat === 'chargement' ? '· · ·' : fr(v, 0))); out.appendChild(el('small', { text: o.etat === 'chargement' ? 'en cours' : o.unite || '' })); aria(n, v, v + ' ' + (o.unite || ''));
    }
    reglable(n, { get: function () { return v; }, set: poser, axe: 'x', parPx: -(max - min) / 300, pas: (max - min) / nb, min: min, max: max, depart: v, sens: 1 });
    n.setAttribute('aria-label', n.getAttribute('aria-label') || 'Niveau'); poser(v); return (n._hud = { poser: poser });
  };
  /* la barre à crans, debout : un index qui monte le long d'une échelle */
  H.crans = function (n, o) {
    var min = num(o.min, 0), max = num(o.max, 10), v = num(o.valeur, 6), dec = num(o.dec, 1), Hh = 200, s = svg('-70 -124 150 256'), i, y;
    for (i = 0; i <= 20; i++) { y = 100 - i * 10; s.appendChild(L(0, y, i % 10 === 0 ? 22 : i % 5 === 0 ? 15 : 9, y, i % 5 === 0 ? 'hud-t2' : 'hud-t')); if (i % 5 === 0) s.appendChild(T(30, y + 4, fr(min + (max - min) * i / 20, 0), 'hud-p')); }
    s.appendChild(L(0, -100, 0, 100, 'hud-t'));
    if (o.limite !== undefined) { y = 100 - (o.limite - min) / (max - min) * Hh; s.appendChild(L(-4, y, -4, -100, 'hud-t2')); }
    var prevu = L(-10, 0, -10, 0, 'hud-amb hud-vif'), index = P('M-2 0l-11 -7h-9v14h9z', 'hud-plein hud-main hud-vif'), lit = T(-28, 6, '', 'hud-n', 'end', 22); s.appendChild(prevu); s.appendChild(index); s.appendChild(lit);
    if (o.consigne !== undefined) { y = 100 - (o.consigne - min) / (max - min) * Hh; s.appendChild(P('M2 ' + y + 'l8 -5v10z', 'hud-plein-or hud-vif')); }
    s.appendChild(T(0, -112, o.nom || '', 'hud-nom', 'middle', 13)); s.appendChild(T(0, 124, o.etat === 'chargement' ? 'en cours' : o.unite || '', 'hud-p', 'middle')); n.appendChild(s);
    function poser(x) { var q = Math.pow(10, dec); v = Math.round(borne(x, min, max) * q) / q; y = 100 - (v - min) / (max - min) * Hh; index.setAttribute('transform', 'translate(0 ' + y + ')'); lit.setAttribute('y', y + 7); lit.textContent = o.etat === 'perdu' ? '—' : o.etat === 'chargement' ? '· · ·' : fr(v, dec); if (o.prevu !== undefined) { prevu.setAttribute('y1', y); prevu.setAttribute('y2', 100 - (o.prevu - min) / (max - min) * Hh); } aria(n, v, fr(v, dec) + ' ' + (o.unite || '')); }
    reglable(n, { get: function () { return v; }, set: poser, axe: 'y', parPx: (max - min) / Hh, pas: (max - min) / 100, min: min, max: max, depart: v });
    n.setAttribute('aria-label', n.getAttribute('aria-label') || o.nom || 'Barre à crans'); poser(v); return (n._hud = { poser: poser });
  };
  /* la règle couchée : une échelle fixe, un index qui glisse, la valeur au-dessus */
  H.regle = function (n, o) {
    var min = num(o.min, -50), max = num(o.max, 50), v = num(o.valeur, 12), dec = num(o.dec, 0), W = 420, s = svg('-230 -46 460 86'), i, x;
    for (i = 0; i <= 50; i++) { x = -W / 2 + i * W / 50; s.appendChild(L(x, 0, x, i % 25 === 0 ? 14 : i % 5 === 0 ? 10 : 6, i % 5 === 0 ? 'hud-t2' : 'hud-t')); if (i % 25 === 0) s.appendChild(T(x, 30, signe(min + (max - min) * i / 50, 0).replace('+0', '0'), 'hud-p', 'middle')); }
    s.appendChild(L(-W / 2, 0, W / 2, 0, 'hud-t'));
    var index = G({}, [P('M0 -2l-6 -9h12z', 'hud-plein hud-main hud-vif'), L(0, -2, 0, 14, 'hud-f hud-main hud-vif')]), lit = T(0, -20, '', 'hud-n', 'middle', 24), prevu = L(0, -6, 0, -6, 'hud-amb hud-vif'); s.appendChild(prevu); s.appendChild(index); s.appendChild(lit);
    if (o.consigne !== undefined) { x = -W / 2 + (o.consigne - min) / (max - min) * W; s.appendChild(P('M' + x + ' 16l-5 8h10z', 'hud-plein-or hud-vif')); }
    n.appendChild(s);
    function poser(val) { var q = Math.pow(10, dec); v = Math.round(borne(val, min, max) * q) / q; x = -W / 2 + (v - min) / (max - min) * W; index.setAttribute('transform', 'translate(' + x + ' 0)'); lit.setAttribute('x', x); lit.textContent = o.etat === 'perdu' ? '— —' : o.etat === 'chargement' ? '· · ·  en cours' : signe(v, dec) + (o.unite ? ' ' + o.unite : ''); if (o.prevu !== undefined) { prevu.setAttribute('x1', x); prevu.setAttribute('x2', -W / 2 + (o.prevu - min) / (max - min) * W); } aria(n, v, signe(v, dec) + ' ' + (o.unite || '')); }
    reglable(n, { get: function () { return v; }, set: poser, axe: 'x', parPx: -(max - min) / W, pas: (max - min) / 100, min: min, max: max, depart: v });
    n.setAttribute('aria-label', n.getAttribute('aria-label') || 'Règle'); poser(v); return (n._hud = { poser: poser });
  };
  /* le niveau à bulle : rond (deux axes) ou long (un axe) */
  H.niveau = function (n, o) {
    var long = o.forme === 'long', x = num(o.x, 1.2), y = num(o.y, -.6), s = long ? svg('-170 -40 340 86') : svg('-110 -110 220 236'), K = long ? 50 : 34, bulle = C(0, 0, long ? 15 : 13, 'hud-f hud-main'), reflet = C(0, 0, 2, 'hud-plein hud-main'), lit = T(0, long ? 40 : 116, '', 'hud-n', 'middle', 19), i;
    if (long) { s.appendChild(P('M-150 -18H150M-150 18H150', 'hud-t')); s.appendChild(P('M-150 -18v36M150 -18v36', 'hud-t2')); [-19, 19].forEach(function (v) { s.appendChild(L(v, -18, v, 18, 'hud-t2')); }); for (i = -5; i <= 5; i++) if (i) s.appendChild(L(i * 25, -18, i * 25, -12)); }
    else { s.appendChild(C(0, 0, 96, 'hud-t')); s.appendChild(C(0, 0, 17, 'hud-t2')); s.appendChild(C(0, 0, 48, 'hud-pale')); s.appendChild(P('M-96 0H-17M17 0H96M0 -96V-17M0 17V96', 'hud-pale')); for (i = 0; i < 360; i += 15) s.appendChild(rayon(0, 0, 90, 96, i)); }
    s.appendChild(bulle); s.appendChild(reflet); s.appendChild(lit); n.appendChild(s);
    function poser(nx, ny) {
      x = Math.round(borne(nx, -2.5, 2.5) * 10) / 10; y = long ? 0 : Math.round(borne(ny, -2.5, 2.5) * 10) / 10; if (!long && Math.hypot(x, y) > 2.4) { var h = Math.hypot(x, y); x = Math.round(x / h * 24) / 10; y = Math.round(y / h * 24) / 10; }
      bulle.setAttribute('cx', -x * K); bulle.setAttribute('cy', -y * K); reflet.setAttribute('cx', -x * K - 4); reflet.setAttribute('cy', -y * K - 4);
      var plat = Math.abs(x) < .15 && Math.abs(y) < .15; bulle.setAttribute('class', (plat ? 'hud-or' : 'hud-f hud-main'));
      lit.textContent = plat ? 'de niveau' : fr(Math.abs(x), 1) + '° ' + (x > 0 ? 'à droite' : 'à gauche') + (long || !y ? '' : ' · ' + fr(Math.abs(y), 1) + '° ' + (y > 0 ? 'vers l’avant' : 'vers l’arrière')); aria(n, x, lit.textContent);
    }
    n.classList.add('hud-regle'); n.tabIndex = 0; n.setAttribute('role', 'slider'); n.setAttribute('aria-label', n.getAttribute('aria-label') || 'Niveau à bulle');
    tirer(n, function (e) { n.focus({ preventScroll: true }); n.classList.add('tenu'); return { x: e.clientX, y: e.clientY, vx: x, vy: y }; }, function (e, c) { poser(c.vx - (e.clientX - c.x) / K, c.vy - (e.clientY - c.y) / K); }, function () { n.classList.remove('tenu'); });
    n.addEventListener('keydown', function (e) { var d = e.shiftKey ? .5 : .1; if (e.key === 'ArrowLeft') poser(x + d, y); else if (e.key === 'ArrowRight') poser(x - d, y); else if (e.key === 'ArrowUp') poser(x, y + d); else if (e.key === 'ArrowDown') poser(x, y - d); else if (e.key === 'Home') poser(0, 0); else return; e.preventDefault(); });
    n.addEventListener('dblclick', function () { poser(0, 0); }); poser(x, y); return (n._hud = { poser: poser });
  };
  /* la boussole : la rose tourne sous une ligne de foi fixe ; la consigne en orange sur la rose */
  H.boussole = function (n, o) {
    var cap = num(o.cap, 47), R0 = 104, s = svg('-135 -135 270 270'), rose = G({}), a;
    for (a = 0; a < 360; a += 5) rose.appendChild(rayon(0, 0, a % 30 === 0 ? R0 - 16 : a % 10 === 0 ? R0 - 10 : R0 - 6, R0, a, a % 90 === 0 ? 'hud-t2' : 'hud-t'));
    for (a = 0; a < 360; a += 30) { var p = pol(0, 0, R0 - 31, a), t = T(0, 5, ROSE[a] || deux(a / 10), ROSE[a] ? 'hud-nom' : 'hud-p', 'middle', ROSE[a] ? 17 : null); t.setAttribute('transform', 'translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ') rotate(' + a + ')'); rose.appendChild(t); }
    rose.appendChild(C(0, 0, R0, 'hud-t')); rose.appendChild(P('M0 ' + (-R0 - 2) + 'l-4 -8h8z', 'hud-plein2'));
    if (o.consigne !== undefined) rose.appendChild(P('M0 ' + (-R0 + 1) + 'l-6 10h12z', 'hud-plein-or hud-vif')).setAttribute('transform', 'rotate(' + (+o.consigne) + ')');
    if (o.prevu !== undefined) rose.appendChild(P(arc(0, 0, R0 + 9, cap, +o.prevu), 'hud-amb hud-vif'));
    s.appendChild(rose); s.appendChild(L(0, -R0 - 16, 0, -R0 + 22, 'hud-f hud-main')); s.appendChild(C(0, 0, 40, 'hud-pale'));
    var lit = T(0, 13, '', 'hud-n', 'middle', 40); s.appendChild(lit); n.appendChild(s);
    function poser(v) { cap = ((Math.round(v) % 360) + 360) % 360; rose.setAttribute('transform', 'rotate(' + (-cap) + ')'); lit.textContent = o.etat === 'perdu' ? '— —' : o.etat === 'chargement' ? '· · ·' : trois(cap); aria(n, cap, 'cap ' + trois(cap)); dire(n, 'ke:change', { valeur: cap }); }
    reglable(n, { get: function () { return cap; }, set: poser, pas: 1, depart: cap, axe: 'y', parPx: .5 });
    n.setAttribute('aria-label', n.getAttribute('aria-label') || 'Boussole'); poser(cap); return (n._hud = { poser: poser });
  };

  /* ════ 07 · LA TÉLÉMÉTRIE ════ */
  /* des lignes alignées sur la virgule : nom, entier, décimales, unité, min, max, tendance. état : tenu, predit, perdu */
  H.tele = function (n, lignes) {
    n.appendChild(el('div', { class: 't-tete' }, [el('span', { text: 'mesure' }), el('span'), el('span'), el('span'), el('span', { class: 't-min', text: 'min' }), el('span', { class: 't-max', text: 'max' }), el('span', { text: 'tendance' })]));
    var rangs = lignes.map(function (l, i) {
      var h = [], k, a = l.v; for (k = 0; k < 40; k++) { a = l.v + (l.amp || 1) * (Math.sin(k * .35 + i * 2) * .6 + Math.sin(k * .93 + i) * .4); h.push(a); }
      var ent = el('span', { class: 't-ent' }), dec = el('span', { class: 't-dec' }), mi = el('span', { class: 't-min' }), ma = el('span', { class: 't-max' }), chemin = S('path', {}), pt = S('circle', { r: 2.6 });
      var r = el('div', { class: l.etat || null, tabindex: '0', role: 'group' }, [el('span', { class: 't-nom', text: l.nom }), ent, dec, el('span', { class: 't-uni', text: l.unite || '' }), mi, ma, el('span', { class: 't-fil' }, [S('svg', { viewBox: '0 0 132 26', 'aria-hidden': 'true' }, [chemin, pt])])]);
      n.appendChild(r);
      function peindre() {
        var v = h[h.length - 1], lo = Math.min.apply(null, h), hi = Math.max.apply(null, h), d = l.dec === undefined ? 1 : l.dec, s = fr(v, d).split(','), p = '', k;
        ent.textContent = l.etat === 'perdu' ? '—' : l.etat === 'chargement' ? '· · ·' : s[0]; dec.textContent = l.etat === 'perdu' || l.etat === 'chargement' ? '' : (s[1] ? ',' + s[1] : ''); mi.textContent = fr(lo, d); ma.textContent = fr(hi, d);
        for (k = 0; k < h.length; k++) p += (k ? 'L' : 'M') + (k * 126 / (h.length - 1)).toFixed(1) + ' ' + (23 - (h[k] - lo) / (hi - lo || 1) * 20).toFixed(1);
        chemin.setAttribute('d', p); pt.setAttribute('cx', 126); pt.setAttribute('cy', (23 - (v - lo) / (hi - lo || 1) * 20).toFixed(1)); r.setAttribute('aria-label', l.nom + ' : ' + fr(v, d) + ' ' + (l.unite || ''));
      }
      peindre(); return { l: l, h: h, peindre: peindre, t: i * 3 };
    });
    var acc = 0;
    n._hud = { pas: function (dt) { acc += dt; if (acc < .12) return; acc = 0; rangs.forEach(function (r, i) { if (r.l.etat === 'perdu' || r.l.etat === 'chargement') return; r.t += .35; r.h.shift(); r.h.push(r.l.v + (r.l.amp || 1) * (Math.sin(r.t + i * 2) * .6 + Math.sin(r.t * 2.7 + i) * .4)); r.peindre(); }); } };
  };
  /* l'oscilloscope : un graticule, une trace ; fréquence et amplitude se règlent */
  H.oscillo = function (n, o) {
    var W = 640, Hh = 260, s = svg('0 0 640 260', { role: 'img', 'aria-label': 'Oscilloscope' }), f = num(o.frequence, 3), amp = num(o.amplitude, .6), ph = 0, x, y, i;
    for (i = 1; i < 10; i++) s.appendChild(L(i * 64, 0, i * 64, Hh, i === 5 ? 'hud-t' : 'hud-pale')); for (i = 1; i < 6; i++) s.appendChild(L(0, i * Hh / 6, W, i * Hh / 6, i === 3 ? 'hud-t' : 'hud-pale'));
    for (x = 12.8; x < W; x += 12.8) s.appendChild(L(x, 127, x, 133)); for (y = Hh / 30; y < Hh; y += Hh / 30) s.appendChild(L(317, y, 323, y));
    s.appendChild(coins(0, 0, W, Hh, 14, 'hud-t2'));
    var env = P('', 'hud-amb'), trace = P('', 'hud-f'), l1 = T(14, 24, '', 'hud-n', 'start', 19), l2 = T(W - 14, 24, '', 'hud-p', 'end'), seuil = L(0, 0, W, 0, 'hud-or hud-tiret'); [env, seuil, trace, l1, l2].forEach(function (e) { s.appendChild(e); });
    function peindre() {
      var d = '', e = '', v, m = 0; for (x = 0; x <= W; x += 2) { v = amp * (Math.sin((x / W) * f * 2 * Math.PI + ph) * .78 + Math.sin((x / W) * f * 6 * Math.PI + ph * 2.1) * .22); m = Math.max(m, Math.abs(v)); d += (x ? 'L' : 'M') + x + ' ' + (Hh / 2 - v * 110).toFixed(1); e += (x ? 'L' : 'M') + x + ' ' + (Hh / 2 - amp * 110 * (.78 + .22 * Math.cos((x / W) * 2 * Math.PI))).toFixed(1); }
      trace.setAttribute('d', d); env.setAttribute('d', e); seuil.setAttribute('y1', Hh / 2 - .5 * 110); seuil.setAttribute('y2', Hh / 2 - .5 * 110); seuil.style.opacity = m > .5 ? '1' : '.35';
      l1.textContent = fr(f * 100, 0) + ' Hz'; l2.textContent = 'crête ' + fr(m, 2) + ' V · seuil 0,50 V' + (m > .5 ? ' · passé' : '');
    }
    n.appendChild(s); peindre();
    return (n._hud = { pas: function (dt) { ph -= dt * 4; peindre(); }, regler: function (nf, na) { if (nf !== undefined) f = nf; if (na !== undefined) amp = na; peindre(); } });
  };
  /* le spectre en traits : la bande la plus forte en orange, une ligne de crête tenue */
  H.spectre = function (n, o) {
    var nb = num(o.traits, 56), t = 1.4, traits = [], cretes = [], i, pied = n.parentNode.querySelector('.hud-spectre-pied b');
    for (i = 0; i < nb; i++) { var b = el('i'); traits.push(b); cretes.push(0); n.appendChild(b); } n.setAttribute('role', 'img');
    function peindre() {
      var max = 0, im = 0, v = []; for (i = 0; i < nb; i++) { var x = i / nb, h = (.18 + .7 * Math.exp(-Math.pow((x - (.22 + .1 * Math.sin(t * .6))) / .11, 2)) + .42 * Math.exp(-Math.pow((x - .62) / .07, 2)) * (.6 + .4 * Math.sin(t * 1.9))) * (.72 + .28 * Math.sin(i * 1.9 + t * 3.1)); h = borne(h, .02, 1); v.push(h); if (h > max) { max = h; im = i; } }
      traits.forEach(function (b, k) { cretes[k] = Math.max(v[k], cretes[k] - .012); b.style.setProperty('--h', v[k].toFixed(3)); b.style.setProperty('--c', cretes[k].toFixed(3)); b.classList.toggle('haut', k === im); });
      if (pied) pied.textContent = fr(40 * Math.pow(2, im / nb * 9) / 1000, 2) + ' kHz'; n.setAttribute('aria-label', 'Spectre, crête à ' + (pied ? pied.textContent : ''));
    }
    peindre(); return (n._hud = { pas: function (dt) { t += dt; peindre(); } });
  };

  /* ════ 08 · LE TEMPS ════ */
  /* le code temporel (heures, minutes, secondes, images) ; data-rebours : il descend, « T − », puis « T + » en orange */
  H.code = function (n, o) {
    var ips = num(o.ips, 24), t = num(o.depart, 4367.33), rebours = o.rebours !== undefined, parts = (rebours ? ['min', 's', 'cent.'] : ['h', 'min', 's', 'im.']).map(function (nom, i) { var b = document.createTextNode('00'), sp = el('span', {}, [b, el('small', { text: nom })]); if (i) n.appendChild(el('i', { text: ':' })); n.appendChild(sp); return b; });
    if (rebours) n.classList.add('signe');
    function peindre() {
      var a = Math.abs(t), v = rebours ? [a / 60, a % 60, (a * 100) % 100] : [a / 3600, (a / 60) % 60, a % 60, (a * ips) % ips];
      parts.forEach(function (b, i) { b.nodeValue = deux(v[i]); }); n.classList.toggle('passe', rebours && t < 0);
      n.setAttribute('aria-valuetext', (rebours ? (t < 0 ? 'T plus ' : 'T moins ') : '') + parts.map(function (b) { return b.nodeValue; }).join(' ')); n.setAttribute('aria-valuenow', Math.round(t));
    }
    function poser(x) { t = rebours ? x : Math.max(0, x); peindre(); dire(n, 'ke:temps', { t: t }); }
    reglable(n, { get: function () { return t; }, set: poser, axe: 'x', parPx: -.1, pas: 1, depart: t }); n.setAttribute('aria-label', n.getAttribute('aria-label') || (rebours ? 'Compte à rebours' : 'Code temporel'));
    peindre(); return (n._hud = { pas: function (dt) { poser(t + (rebours ? -dt : dt)); }, poser: poser });
  };
  /* l'anneau : soixante crans, l'arc de ce qui est fait, le nombre au centre, le prévu en pointillé */
  H.anneau = function (n, o) {
    var total = num(o.total, 60), v = num(o.valeur, 22), R0 = 84, s = svg('-110 -110 220 220'), i;
    for (i = 0; i < 60; i++) s.appendChild(rayon(0, 0, R0 + 5, R0 + (i % 5 ? 9 : 14), i * 6, i % 15 === 0 ? 'hud-t2' : 'hud-t'));
    s.appendChild(C(0, 0, R0, 'hud-t')); var prevu = P('', 'hud-amb hud-vif'), fait = P('', 'hud-f hud-main hud-vif'), bout = C(0, 0, 4.5, 'hud-plein hud-main hud-vif'), lit = T(0, 16, '', 'hud-n', 'middle', 58), sous = T(0, 40, '', 'hud-p', 'middle');
    [prevu, fait, bout, lit, sous].forEach(function (e) { s.appendChild(e); }); n.appendChild(s);
    function poser(x) { v = borne(x, 0, total); var a = v / total * 359.9, p = pol(0, 0, R0, a); fait.setAttribute('d', arc(0, 0, R0, 0, Math.max(.01, a))); bout.setAttribute('cx', p[0]); bout.setAttribute('cy', p[1]); if (o.prevu !== undefined) prevu.setAttribute('d', arc(0, 0, R0 - 8, a, Math.max(a + .01, +o.prevu / total * 359.9))); lit.textContent = o.etat === 'perdu' ? '—' : o.etat === 'chargement' ? '· · ·' : String(Math.floor(v)); sous.textContent = o.etat === 'chargement' ? 'en cours' : 'sur ' + total + ' ' + (o.unite || 's'); aria(n, Math.floor(v), Math.floor(v) + ' sur ' + total); }
    reglable(n, { get: function () { return v; }, set: poser, axe: 'y', parPx: total / 200, pas: 1, min: 0, max: total, depart: v }); n.setAttribute('aria-label', n.getAttribute('aria-label') || 'Avancement');
    poser(v); return (n._hud = { pas: function (dt) { if (!o.etat) poser((v + dt) % total); }, poser: poser });
  };
  /* la chronologie : des phases nommées, des jalons, « maintenant » en orange, la fin prévue en pointillé */
  H.chrono = function (n, o) {
    var W = 1400, duree = o.duree, t = o.maintenant, s = svg('0 -64 1400 150'), k = W / duree;
    s.appendChild(L(0, 0, W, 0, 'hud-t'));
    o.phases.forEach(function (p) { var x = p.de * k; s.appendChild(L(x, -26, x, 8, 'hud-t2')); s.appendChild(T(x + 8, -12, p.nom, 'hud-nom', 'start', 15)); s.appendChild(T(x + 8, -36, U.temps(p.de), 'hud-p')); });
    s.appendChild(L(W, -26, W, 8, 'hud-t2'));
    for (var u = 0; u <= duree; u += o.cran || 30) s.appendChild(L(u * k, 0, u * k, u % ((o.cran || 30) * 4) ? 4 : 8));
    (o.jalons || []).forEach(function (j) { var x = j.t * k, g = G({}, [L(x, 0, x, 20, j.predit ? 'hud-amb' : 'hud-t2'), j.predit ? C(x, 0, 4, 'hud-amb') : P('M' + x + ' -4l4 4l-4 4l-4 -4z', 'hud-plein2'), T(x, 36, j.nom, j.predit ? 'hud-it hud-c-amb' : 'hud-it', j.fin ? 'end' : 'middle', 15), T(x, 52, (j.predit ? 'prévu · ' : '') + U.temps(j.t), 'hud-p', j.fin ? 'end' : 'middle')]); s.appendChild(g); });
    var fait = L(0, 0, 0, 0, 'hud-f'), tete = G({}, [L(0, -40, 0, 14, 'hud-or'), R(-4.5, -49, 9, 9, 'hud-plein-or'), T(8, -46, '', 'hud-n hud-c-or', 'start', 19)]); s.appendChild(fait); s.appendChild(tete); n.appendChild(s);
    function poser(x) { t = borne(x, 0, duree); fait.setAttribute('x2', t * k); tete.setAttribute('transform', 'translate(' + (t * k) + ' 0)'); var lab = tete.lastChild; lab.textContent = U.temps(t); lab.setAttribute('x', t * k > W - 70 ? -8 : 8); lab.setAttribute('text-anchor', t * k > W - 70 ? 'end' : 'start'); var ph = o.phases.filter(function (p) { return p.de <= t; }).pop(); aria(n, Math.round(t), U.temps(t) + ', ' + (ph ? ph.nom : '')); dire(n, 'ke:temps', { t: t, phase: ph }); }
    reglable(n, { get: function () { return t; }, set: poser, min: 0, max: duree, pas: 1, depart: t, tire: function (e, c) { return (e.clientX - c.r.left) / c.r.width * duree; } }); n.setAttribute('aria-label', n.getAttribute('aria-label') || 'Chronologie');
    poser(t); return (n._hud = { pas: function (dt) { poser(t + dt * 4 > duree ? 0 : t + dt * 4); }, poser: poser });
  };

  /* ════ 09 · LES APPELS ════ */
  /* une étiquette au bout d'un filet coudé : appel({x, y, dx, dy, titre, valeur, sous, ancre: 'rond'|'carre'|'croix', etat}) rend un <g> à poser dans un SVG */
  H.appel = function (o) {
    var k = o.dx >= 0 ? 1 : -1, ex = o.x + o.dx, ey = o.y + o.dy, lg = o.largeur || 150;
    var anc = o.ancre === 'carre' ? R(o.x - 4.5, o.y - 4.5, 9, 9, 'a-anc') : o.ancre === 'croix' ? P('M' + (o.x - 7) + ' ' + o.y + 'h14M' + o.x + ' ' + (o.y - 7) + 'v14', 'a-anc') : C(o.x, o.y, 5, 'a-anc');
    var g = G({ class: 'hud-appel' + (o.etat ? ' ' + o.etat : ''), tabindex: '0', role: 'button', 'aria-label': o.titre + ' : ' + (o.valeur || '') + (o.sous ? ', ' + o.sous : '') }, [
      P('M' + o.x + ' ' + o.y + 'L' + ex + ' ' + ey + 'H' + (ex + k * lg), 'a-fil'), anc,
      T(ex + k * 8, ey - 9, o.titre, 'a-t', k > 0 ? 'start' : 'end'), o.valeur ? T(ex + k * 8, ey + 26, o.valeur, 'a-v', k > 0 ? 'start' : 'end') : null, o.sous ? T(ex + k * 8, ey + (o.valeur ? 44 : 18), o.sous, 'a-s', k > 0 ? 'start' : 'end') : null,
      R(Math.min(ex, ex + k * lg), ey - 26, lg, 76, 'hud-prise')]);
    return g;
  };
  /* la cote : deux butées, un trait, la mesure au milieu ; l'angle : un arc entre deux rayons */
  H.cote = function (x1, y1, x2, y2, texte, c) { var a = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(a) * 7, ny = Math.cos(a) * 7, mx = (x1 + x2) / 2, my = (y1 + y2) / 2, t = T(0, -7, texte, 'hud-n', 'middle', 17); t.setAttribute('transform', 'translate(' + mx + ' ' + my + ') rotate(' + (a * 180 / Math.PI) + ')'); return G({}, [L(x1, y1, x2, y2, c || 'hud-t2'), L(x1 - nx, y1 - ny, x1 + nx, y1 + ny, c || 'hud-t2'), L(x2 - nx, y2 - ny, x2 + nx, y2 + ny, c || 'hud-t2'), t]); };
  H.angle = function (cx, cy, r, a0, a1, texte) { var m = pol(cx, cy, r + 20, (a0 + a1) / 2); return G({}, [rayon(cx, cy, 0, r + 12, a0, 'hud-t'), rayon(cx, cy, 0, r + 12, a1, 'hud-t'), P(arc(cx, cy, r, a0, a1), 'hud-t2'), T(m[0], m[1] + 5, texte, 'hud-n', 'middle', 17)]); };
  /* le menu radial : des secteurs ; flèches pour tourner, Entrée pour choisir ; le choix se lit au centre */
  H.radial = function (n, o) {
    var items = o.items, nb = items.length, s = svg('-150 -150 300 300', { 'aria-hidden': null }), pas = 360 / nb, vise = -1, choisi = num(o.choisi, -1), centre = T(0, 8, '', 'hud-it', 'middle', 21), sous = T(0, 30, '', 'hud-p', 'middle');
    s.appendChild(C(0, 0, 58, 'hud-pale'));
    var sect = items.map(function (it, i) {
      var a0 = i * pas - pas / 2 + 3, a1 = (i + 1) * pas - pas / 2 - 3, m = pol(0, 0, 96, i * pas), p0 = pol(0, 0, 66, a0), p1 = pol(0, 0, 128, a0), p2 = pol(0, 0, 128, a1), p3 = pol(0, 0, 66, a1);
      var g = G({ class: 'hud-secteur' + (it.inerte ? ' inerte' : ''), role: 'menuitemradio', 'aria-checked': 'false', 'aria-disabled': it.inerte ? 'true' : null, 'aria-label': it.nom + (it.inerte ? ', ' + it.inerte : '') }, [P(arc(0, 0, 128, a0, a1), 's-arc'), rayon(0, 0, 122, 134, a0, 'hud-t'), T(m[0], m[1] + 4, it.nom, null, 'middle'),
        P('M' + p0[0] + ' ' + p0[1] + 'L' + p1[0] + ' ' + p1[1] + 'A128 128 0 0 1 ' + p2[0] + ' ' + p2[1] + 'L' + p3[0] + ' ' + p3[1] + 'A66 66 0 0 0 ' + p0[0] + ' ' + p0[1] + 'Z', 'hud-prise')]);
      g.addEventListener('mouseenter', function () { viser(i); }); g.addEventListener('click', function () { viser(i); choisir(); }); s.appendChild(g); return g;
    });
    s.appendChild(centre); s.appendChild(sous); n.appendChild(s); n.tabIndex = 0; n.setAttribute('role', 'menu');
    function peindre() { sect.forEach(function (g, i) { g.classList.toggle('vise', i === vise); g.classList.toggle('choisi', i === choisi); g.setAttribute('aria-checked', String(i === choisi)); }); var i = vise >= 0 ? vise : choisi; centre.textContent = i >= 0 ? items[i].nom : 'choisir'; sous.textContent = i >= 0 ? (items[i].inerte || (i === choisi ? 'choisi' : 'Entrée pour choisir')) : 'flèches, Entrée'; }
    function viser(i) { vise = i; peindre(); } function choisir() { if (vise < 0 || items[vise].inerte) return; choisi = vise; peindre(); dire(n, 'ke:change', { valeur: items[choisi].nom }); }
    n.addEventListener('mouseleave', function () { vise = -1; peindre(); }); n.addEventListener('blur', function () { vise = -1; peindre(); }); n.addEventListener('focus', function () { if (vise < 0) viser(choisi >= 0 ? choisi : 0); });
    n.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowDown') viser((Math.max(0, vise) + 1) % nb); else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') viser((Math.max(0, vise) - 1 + nb) % nb); else if (e.key === 'Enter' || e.key === ' ') choisir(); else return; e.preventDefault(); });
    peindre();
  };

  /* ════ 10 · LE VISEUR ════ la scène composée. La souris porte le réticule ; on tire pour tourner ; un clic verrouille la cible visée.
     Clavier : flèches (Maj : plus vite), + et − pour la focale, Tab d'une cible à l'autre, Entrée verrouille, Échap libère, Espace lance. */
  H.viseur = function (n, o) {
    o = o || {}; var W = 1600, Hh = 900, cy = 450, Ht = 340, cap = num(o.cap, 71), site = num(o.site, 1.5), focale = num(o.focale, 35), mx = 800, my = 450, t = 0, joue = false, verrou = null, visee = null;
    var CIBLES = o.cibles || [{ nom: 'Le phare', cap: 62, site: 2.2, d: 4.2 }, { nom: 'Le relais', cap: 96, site: 4.6, d: 12.8 }, { nom: 'La balise', cap: 78, site: -.8, d: 2.1, mobile: 1 }, { nom: 'Le col', cap: 121, site: 6.4, d: 23.4 }, { nom: 'La jetée', cap: 34, site: .4, d: 1.3 }];
    var s = svg('0 0 1600 900', { 'aria-hidden': null }), id = 'hud-v' + (++uid);
    function champ() { return 2 * Math.atan(18 / focale) * 180 / Math.PI; } function kd() { return W / champ(); }
    function X(c) { return 800 + ecart(c, cap) * kd(); } function Y(e) { return cy - (e - site) * kd(); }
    var ciel = G({}), relief = G({}), echelle = G({}), gCap = G({ transform: 'translate(800 64)' }), gSite = G({ transform: 'translate(1492 450)' }), gFoc = G({ transform: 'translate(108 450)' }), cibles = G({}), ret = G({ class: 'v-ret' }), hors = G({}), fixe = G({}), mini = G({ transform: 'translate(1452 756)' }), tele = G({ transform: 'translate(64 690)' }), bande = G({ class: 'v-bande' });
    s.appendChild(S('clipPath', { id: id }, [R(480, 30, 640, 90, '')])); var clipR = R(-110, -170, 220, 340, ''); s.appendChild(S('clipPath', { id: id + 'b' }, [clipR]));
    var gCapClip = G({ 'clip-path': 'url(#' + id + ')' }, [gCap]), gSiteClip = G({ transform: 'translate(1492 450)' }, [G({ 'clip-path': 'url(#' + id + 'b)' }, [gSite])]), gFocClip = G({ transform: 'translate(108 450)' }, [G({ 'clip-path': 'url(#' + id + 'b)' }, [gFoc])]);
    gSite.removeAttribute('transform'); gFoc.removeAttribute('transform');
    [ciel, relief, echelle, cibles, fixe, gCapClip, gSiteClip, gFocClip, mini, tele, bande, hors, ret].forEach(function (g) { s.appendChild(g); });
    /* ce qui ne bouge pas : les coins, les règles de bord, le cartouche, le code temporel. Le cadre suit la forme de la zone. */
    var mode = T(64, 102, '', 'hud-it', 'start', 17), code = T(W - 64, 84, '', 'hud-n', 'end', 30), i;
    function cadrer() {
      var r = n.getBoundingClientRect(); Hh = Math.round(borne(W * (r.height || 900) / (r.width || 1600), 620, 1000)); cy = Math.round(Hh / 2); s.setAttribute('viewBox', '0 0 ' + W + ' ' + Hh);
      Ht = borne(2 * (Hh - 236 - cy), 200, 340); clipR.setAttribute('y', -Ht / 2); clipR.setAttribute('height', Ht);
      vider(fixe); fixe.appendChild(coins(28, 28, W - 56, Hh - 56, 34, 'hud-t2'));
      for (var i = -14; i <= 14; i++) { fixe.appendChild(L(28, cy + i * 16, i % 5 ? 33 : 38, cy + i * 16)); fixe.appendChild(L(W - 28, cy + i * 16, W - (i % 5 ? 33 : 38), cy + i * 16)); }
      fixe.appendChild(T(64, 78, 'Le viseur', 'hud-nom', 'start', 22)); fixe.appendChild(mode); fixe.appendChild(code); fixe.appendChild(T(W - 64, 104, 'h · min · s · im.', 'hud-p', 'end'));
      fixe.appendChild(T(1492, cy - Ht / 2 - 16, 'site', 'hud-nom', 'middle', 13)); fixe.appendChild(T(108, cy - Ht / 2 - 16, 'focale', 'hud-nom', 'middle', 13));
      gSiteClip.setAttribute('transform', 'translate(1492 ' + cy + ')'); gFocClip.setAttribute('transform', 'translate(108 ' + cy + ')'); mini.setAttribute('transform', 'translate(1462 ' + (Hh - 128) + ')'); tele.setAttribute('transform', 'translate(64 ' + (Hh - 160) + ')'); bande.setAttribute('transform', 'translate(400 ' + (Hh - 132) + ')');
      my = borne(my, 130, Hh - 60);
    }
    /* le réticule porté par la souris */
    ret.appendChild(P('M-54 0H-10M10 0H54M0 -54V-10M0 10V54', 'hud-t2')); ret.appendChild(C(0, 0, 26, 'hud-t')); ret.appendChild(C(0, 0, 1.6, 'hud-plein'));
    [-54, 54].forEach(function (v) { ret.appendChild(L(v, -5, v, 5, 'hud-t2')); ret.appendChild(L(-5, v, 5, v, 'hud-t2')); });
    var retLit = T(36, 48, '', 'hud-p2 hud-halo'); ret.appendChild(retLit);
    /* les étoiles : des points fixes dans le ciel, placés une fois */
    var etoiles = []; for (i = 0; i < 90; i++) etoiles.push([(i * 137.508) % 360, 6 + ((i * 53.7) % 30), .6 + (i % 5) * .25]);
    /* le relief : pour chaque plan, un bruit de valeur à graine, périodique sur les 360° du tour d'horizon (le réseau d'un octave
       a un nombre entier de nœuds par tour) ; les premiers octaves en crêtes (1 − |2v − 1|) pour les arêtes, les fins en bruit plein
       pour les éboulis. Les plans lointains sont plus hauts, plus amples, plus lisses ; les proches plus bas et plus heurtés. */
    var graine = num(o.graine, 1911), BASE = [6.4, 4.0, 2.1, .6, -1.2], AMP = [5.6, 4.0, 2.8, 1.9, 1.2], NB = [11, 16, 23, 31, 43], OCT = [7, 7, 7, 7, 7];
    function hache(a, b, c) { var h = Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ Math.imul(c, 1274126177) ^ Math.imul(graine, 2246822519); h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
    function bruit(k, oc, x, nb) { var f = x * nb, i = Math.floor(f), t = f - i; t = t * t * (3 - 2 * t); return mix(hache(k, oc, ((i % nb) + nb) % nb), hache(k, oc, (((i + 1) % nb) + nb) % nb), t); }
    function hauteur(k, c) {
      var x = (((c % 360) + 360) % 360) / 360, f = 0, a = 1, somme = 0, oc, v;
      /* bruit en crêtes multifractal : chaque octave pèse selon la hauteur déjà acquise (les sommets sont rugueux, les vallées lisses) */
      var poids = 1, b, plein = 0;
      for (oc = 0; oc < OCT[k]; oc++) { b = bruit(k, oc, x, NB[k] * Math.pow(2, oc)); v = 1 - Math.abs(2 * b - 1); v *= v * poids; poids = borne(v * 1.8, .25, 1); f += a * v; plein += a * b; somme += a; a *= .52; }
      f = (.62 * f + .38 * plein) / somme; return BASE[k] + AMP[k] * (f * 2.2 - .7);
    }
    var noeuds = CIBLES.map(function (c, k) {
      var g = G({ class: 'v-cible', tabindex: '0', role: 'button', 'aria-label': c.nom + ', ' + fr(c.d, 1) + ' kilomètres' }, [P('', 'hud-amb'), coins(-22, -22, 44, 44, 9, 'c-crochets'), P(arc(0, 0, 36, -28, 28) + arc(0, 0, 36, 62, 118) + arc(0, 0, 36, 152, 208) + arc(0, 0, 36, 242, 298) + 'M0 -36V-46M36 0H46M0 36V46M-36 0H-46', 'c-anneau'), P('M0 -7L7 0L0 7L-7 0Z', 'c-marque'), C(0, 0, 26, 'hud-prise'), T(30, -14, c.nom, 'hud-nom', 'start', 14), T(30, 6, fr(c.d, 1) + ' km', 'hud-p2'), T(0, 26, c.nom, 'hud-nom c-nom hud-halo', 'middle', 11.5)]);
      g.addEventListener('click', function (e) { e.stopPropagation(); verrouiller(verrou === c ? null : c); }); g.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); verrouiller(verrou === c ? null : c); } });
      g.addEventListener('focus', function () { if (!g._dedans) { cap = posCible(c)[0]; site = borne(c.site, -10, 20); } mx = X(posCible(c)[0]); my = Y(posCible(c)[1]); peindre(); });
      cibles.appendChild(g); return g;
    });
    var appel = G({}); s.insertBefore(appel, hors);
    function posCible(c) { return c.mobile ? [c.cap + 9 * Math.sin(t * .22), c.site + 1.2 * Math.sin(t * .37 + 1)] : [c.cap, c.site]; }
    var bas = el('div', { class: 'v-bas', 'aria-live': 'polite' }), bandeau = el('p', { class: 'hud-bandeau', style: 'margin:0' }); bas.appendChild(bandeau);
    var bLancer = el('button', { type: 'button', class: 'ke-btn', 'aria-pressed': 'false', text: 'lancer' }), bLibre = el('button', { type: 'button', class: 'ke-btn', text: 'libérer' }), outils = el('div', { class: 'v-outils' }, [bLancer, bLibre]);
    n.appendChild(s); n.appendChild(bas); n.appendChild(outils);
    function verrouiller(c) { verrou = c; peindre(); dire(n, 'ke:change', { cible: c ? c.nom : null }); }
    function peindre() {
      var k = kd(), ch = champ(), c, x, y, d, a, i, j;
      /* le ciel : les parallèles de site, les étoiles */
      vider(ciel); for (a = 5; a <= 60; a += 5) { y = Y(a); if (y > 150 && y < Hh - 20) ciel.appendChild(L(0, y, W, y, 'v-ciel')); }
      for (a = Math.ceil((cap - ch / 2) / 10) * 10; a <= cap + ch / 2; a += 10) { x = X(a); ciel.appendChild(L(x, 150, x, Y(0), 'v-ciel')); }
      etoiles.forEach(function (e) { x = X(e[0]); y = Y(e[1]); if (x > 40 && x < W - 40 && y > 40 && y < Hh - 40) ciel.appendChild(C(x, y, e[2], 'v-etoile')); });
      /* le relief : quatre crêtes, de la plus lointaine à la plus proche ; chacune cache ce qui est derrière */
      /* la perspective atmosphérique : le plan lointain se fond dans le ciel (plein clair, trait pâle), le proche est le plus sombre au trait le plus net */
      vider(relief); var pasX = Math.max(2, Math.min(5, 160 / k));
      for (j = 0; j < 5; j++) {
        d = 'M-10 ' + (Hh + 10); for (x = -10; x <= W + 10; x += pasX) d += 'L' + x.toFixed(1) + ' ' + Y(hauteur(j, cap + (x - 800) / k)).toFixed(1); d += 'L' + (W + 10) + ' ' + (Hh + 10) + 'Z';
        var p = P(d, 'v-relief v-plan' + j); relief.appendChild(p);
      }
      /* l'échelle de site, au centre */
      vider(echelle); echelle.appendChild(P('M' + (800 - 230) + ' ' + Y(0) + 'H' + (800 - 70) + 'M' + (800 + 70) + ' ' + Y(0) + 'H' + (800 + 230), 'hud-t2'));
      for (a = -20; a <= 30; a += 5) { if (!a) continue; y = Y(a); if (y < 150 || y > Hh - 110) continue; echelle.appendChild(P('M' + (800 - 130) + ' ' + y + 'h44M' + (800 + 86) + ' ' + y + 'h44', a < 0 ? 'hud-t hud-tiret' : 'hud-t')); echelle.appendChild(T(800 - 138, y + 4, signe(a), 'hud-p', 'end')); echelle.appendChild(T(800 + 138, y + 4, signe(a), 'hud-p')); }
      /* les rubans */
      traceCap(gCap, 640, cap, 640 / 64, verrou ? posCible(verrou)[0] : undefined);
      traceRuban(gSite, Ht, site, { k: 14, pas: 1, gros: 5, dec: 1, decRep: 0, cote: 'gauche', consigne: verrou ? posCible(verrou)[1] : undefined, min: -10, max: 20 });
      traceRuban(gFoc, Ht, focale, { k: 3.4, pas: 5, gros: 25, dec: 0, cote: 'droite', min: 18, max: 200 });
      /* les cibles */
      visee = null;
      CIBLES.forEach(function (c, i) {
        var q = posCible(c), g = noeuds[i]; x = X(q[0]); y = Y(q[1]); var dedans = x > 200 && x < W - 200 && y > 130 && y < Hh - 60;
        g.style.opacity = dedans ? '' : '0'; g.style.pointerEvents = dedans ? '' : 'none'; g._dedans = dedans; g.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')');
        var pres = dedans && Math.hypot(x - mx, y - my) < 34; if (pres && !visee) visee = c; g.classList.toggle('visee', pres && verrou !== c); g.classList.toggle('verrou', verrou === c);
        d = ''; if (c.mobile && verrou === c) for (j = 0; j <= 24; j++) { var u = t + j * .5, fx = (c.cap + 9 * Math.sin(u * .22) - q[0]) * k, fy = -(c.site + 1.2 * Math.sin(u * .37 + 1) - q[1]) * k; d += (j ? 'L' : 'M') + fx.toFixed(1) + ' ' + fy.toFixed(1); } g.firstChild.setAttribute('d', d);
      });
      /* l'appel de la cible verrouillée, ou sa flèche de bord si elle est sortie du cadre */
      vider(appel); vider(hors);
      if (verrou) {
        c = posCible(verrou); x = X(c[0]); y = Y(c[1]);
        if (x > 200 && x < W - 200 && y > 130 && y < Hh - 60) { var g = H.appel({ x: x + (x < 1100 ? 27 : -27), y: y - 27, dx: x < 1100 ? 64 : -64, dy: -58, titre: verrou.nom, valeur: fr(verrou.d, 1) + ' km', sous: 'au ' + trois(c[0]) + ' · site ' + signe(c[1], 1) + '°' + (verrou.mobile ? ' · en mouvement' : ''), etat: 'tenu', largeur: 190 }); g.removeAttribute('tabindex'); g.style.pointerEvents = 'none'; g.querySelector('.a-anc').remove(); appel.appendChild(g); }
        else { var g2 = x <= 60 || (ecart(c[0], cap) < 0 && x >= W - 60 ? false : x <= 60), cote = ecart(c[0], cap) < 0 ? -1 : 1, hx = cote < 0 ? 214 : W - 214, hy = borne(y, 170, Hh - 120); hors.appendChild(P('M' + hx + ' ' + hy + 'l' + (-cote * 16) + ' -10v20z', 'hud-plein-or')); hors.appendChild(T(hx - cote * 26, hy - 4, verrou.nom, 'hud-nom hud-c-or', cote < 0 ? 'start' : 'end', 14)); hors.appendChild(T(hx - cote * 26, hy + 16, fr(Math.abs(ecart(c[0], cap)), 0) + '° ' + (cote < 0 ? 'à gauche' : 'à droite'), 'hud-p2', cote < 0 ? 'start' : 'end')); void g2; }
      }
      /* le petit radar : le nord en haut, le champ en deux rayons, les cibles par leur cap et leur distance */
      vider(mini); mini.appendChild(C(0, 0, 70, 'hud-t')); mini.appendChild(C(0, 0, 35, 'hud-pale')); mini.appendChild(T(0, -78, 'N', 'hud-nom', 'middle', 13));
      mini.appendChild(rayon(0, 0, 0, 70, cap - ch / 2, 'hud-t2')); mini.appendChild(rayon(0, 0, 0, 70, cap + ch / 2, 'hud-t2')); mini.appendChild(P(arc(0, 0, 70, cap - ch / 2, cap + ch / 2), 'hud-f'));
      CIBLES.forEach(function (c) { var q = posCible(c), p = pol(0, 0, 12 + 52 * Math.log(1 + c.d) / Math.log(26), q[0]); mini.appendChild(C(p[0], p[1], verrou === c ? 4.5 : 2.6, verrou === c ? 'hud-plein-or' : 'hud-plein2')); });
      /* la bande des cibles : toutes, rangées par leur distance (échelle logarithmique), qu'elles soient dans le champ ou non */
      vider(bande); var BW = 800, lx = function (dk) { return BW * Math.log(dk / .5) / Math.log(64); };
      bande.appendChild(T(-14, 4, 'les cibles, par distance', 'hud-p hud-halo', 'end'));
      bande.appendChild(L(0, 0, BW, 0, 'hud-t')); [.5, 1, 2, 5, 10, 20].forEach(function (dk) { x = lx(dk); bande.appendChild(L(x, 0, x, 5, 'hud-t')); bande.appendChild(T(x, 19, fr(dk, dk < 1 ? 1 : 0) + (dk === 20 ? ' km' : ''), 'hud-p hud-halo', 'middle')); });
      CIBLES.slice().sort(function (a, b) { return a.d - b.d; }).forEach(function (c, r) {
        var cx = lx(c.d), dedans = noeuds[CIBLES.indexOf(c)]._dedans, etat = verrou === c ? ' verrou' : visee === c ? ' visee' : dedans ? '' : ' hors', hautT = r % 2 ? -28 : -12;
        var gc = G({ class: 'v-bande-c' + etat }, [L(cx, -4, cx, hautT + 4, 'b-fil'), P('M' + cx + ' -7l4 4l-4 4l-4 -4z', 'b-pt'), T(cx, hautT, c.nom, 'hud-nom b-nom hud-halo', 'middle', 11.5), C(cx, -4, 12, 'hud-prise')]);
        gc.addEventListener('pointerdown', function (e) { e.stopPropagation(); }); gc.addEventListener('click', function (e) { e.stopPropagation(); verrouiller(verrou === c ? null : c); });
        bande.appendChild(gc);
      });
      if (verrou) { x = lx(verrou.d); bande.appendChild(L(0, 0, x, 0, 'hud-or')); bande.appendChild(T(BW + 16, 6, fr(verrou.d, 1) + ' km', 'hud-n hud-c-or hud-halo', 'start', 17)); }
      /* la télémétrie, alignée */
      vider(tele); [['cap', trois(cap), '°'], ['site', signe(site, 1), '°'], ['champ', fr(ch, 1), '°'], ['cible', verrou ? fr(verrou.d, 1) : '—', verrou ? 'km' : '']].forEach(function (l, i) { tele.appendChild(T(0, i * 30, l[0], 'hud-p')); var v = T(128, i * 30, l[1], 'hud-n' + (i === 3 && verrou ? ' hud-c-or' : ''), 'end', 22); if (i === 3 && !verrou) v.setAttribute('font-style', 'italic'); tele.appendChild(v); tele.appendChild(T(134, i * 30, l[2], 'hud-p')); if (i < 3) tele.appendChild(L(0, i * 30 + 9, 160, i * 30 + 9, 'hud-pale')); });
      mode.textContent = verrou ? 'verrouillé sur ' + verrou.nom.toLowerCase() : 'libre'; mode.setAttribute('class', verrou ? 'hud-it hud-c-or' : 'hud-it');
      code.textContent = '00:' + deux(t / 60) + ':' + deux(t % 60) + ':' + deux((t * 24) % 24);
      peindreRet();
      bandeau.className = 'hud-bandeau' + (verrou ? ' tenu' : visee ? '' : ' perdu'); bandeau.textContent = '';
      bandeau.appendChild(el('small', { text: verrou ? 'verrouillé' : visee ? 'visé' : 'libre' })); bandeau.appendChild(document.createTextNode(verrou ? verrou.nom + ', à ' + fr(verrou.d, 1) + ' km, au ' + trois(posCible(verrou)[0]) + '. Échap libère.' : visee ? visee.nom + '. Un clic, ou Entrée, le verrouille.' : 'Rien n’est verrouillé. Tire pour tourner, vise une cible.'));
      bLibre.hidden = !verrou;
      n.setAttribute('aria-valuetext', 'cap ' + trois(cap) + ', site ' + fr(site, 1));
    }
    function peindreRet() {
      ret.setAttribute('transform', 'translate(' + mx.toFixed(1) + ' ' + my.toFixed(1) + ')'); retLit.textContent = trois(cap + (mx - 800) / kd()) + ' · ' + signe(site - (my - cy) / kd(), 1) + '°';
      var gauche = mx > W - 300, haut = my > Hh - 170; retLit.setAttribute('x', gauche ? -36 : 36); retLit.setAttribute('y', haut ? -40 : 48); retLit.setAttribute('text-anchor', gauche ? 'end' : 'start');
    }
    function souris(e) { var r = n.getBoundingClientRect(), sc = Math.max(r.width / W, r.height / Hh); mx = borne((e.clientX - r.left - r.width / 2) / sc + 800, 60, W - 60); my = borne((e.clientY - r.top - r.height / 2) / sc + cy, 130, Hh - 60); }
    function viseAvant() { var v = visee; visee = null; CIBLES.forEach(function (c, i) { var q = posCible(c); if (noeuds[i]._dedans && Math.hypot(X(q[0]) - mx, Y(q[1]) - my) < 34 && !visee) visee = c; }); return v !== visee; }
    n.addEventListener('pointermove', function (e) { if (n.classList.contains('glisse')) return; var dehors = !!(e.target.closest && e.target.closest('.v-outils, .v-bas, .v-bande-c')); ret.style.opacity = dehors ? '0' : ''; if (dehors) return; souris(e); if (viseAvant()) peindre(); else peindreRet(); });
    n.addEventListener('pointerleave', function () { ret.style.opacity = ''; });
    tirer(n, function (e) { if (e.target.closest('.v-outils')) return false; n.focus({ preventScroll: true }); souris(e); return { x: e.clientX, y: e.clientY, c: cap, s: site, b: false, r: n.getBoundingClientRect() }; },
      function (e, c) { var dx = e.clientX - c.x, dy = e.clientY - c.y; if (!c.b && Math.hypot(dx, dy) < 4) return; c.b = true; n.classList.add('glisse'); var sc = Math.max(c.r.width / W, c.r.height / Hh) * kd(); cap = ((c.c + dx / sc) % 360 + 360) % 360; site = borne(c.s - dy / sc, -10, 20); peindre(); },
      function (e, c) { n.classList.remove('glisse'); if (!c.b) { souris(e); viseAvant(); verrouiller(visee && visee !== verrou ? visee : visee ? null : verrou); } });
    n.addEventListener('wheel', function (e) { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); focale = borne(focale * Math.pow(.9985, e.deltaY), 18, 200); peindre(); }, { passive: false });
    n.addEventListener('keydown', function (e) {
      var d = e.shiftKey ? 5 : 1;
      if (e.key === 'ArrowLeft') cap = (cap - d + 360) % 360; else if (e.key === 'ArrowRight') cap = (cap + d) % 360; else if (e.key === 'ArrowUp') site = borne(site + d * .5, -10, 20); else if (e.key === 'ArrowDown') site = borne(site - d * .5, -10, 20);
      else if (e.key === '+' || e.key === '=') focale = borne(focale * 1.15, 18, 200); else if (e.key === '-') focale = borne(focale / 1.15, 18, 200); else if (e.key === 'Escape' && verrou) verrou = null;
      else if ((e.key === 'Enter') && e.target === n) { if (visee) verrou = verrou === visee ? null : visee; } else if (e.key === ' ' && e.target === n) lancer(!joue); else return;
      e.preventDefault(); mx = e.target === n && e.key.indexOf('Arrow') === 0 ? 800 : mx; my = e.target === n && e.key.indexOf('Arrow') === 0 ? cy : my; peindre();
    });
    var dernier = 0;
    function boucle(ts) { if (!joue) return; if (dernier) { t += Math.min(.1, (ts - dernier) / 1000); peindre(); } dernier = ts; requestAnimationFrame(boucle); }
    function lancer(oui) { if (calme) { t += 1; peindre(); return; } joue = oui; dernier = 0; bLancer.setAttribute('aria-pressed', String(oui)); bLancer.textContent = oui ? 'arrêter' : 'lancer'; if (oui) requestAnimationFrame(boucle); }
    bLancer.addEventListener('click', function () { lancer(!joue); }); bLibre.addEventListener('click', function () { verrouiller(null); n.focus(); });
    if (calme) bLancer.textContent = 'avancer d’une seconde';
    n.tabIndex = 0; n.setAttribute('role', 'application'); n.setAttribute('aria-label', n.getAttribute('aria-label') || 'Le viseur');
    cadrer(); my = cy; peindre(); window.addEventListener('resize', function () { cadrer(); peindre(); });
    return (n._hud = { verrouiller: function (i) { verrouiller(CIBLES[i] || null); }, poser: function (c, s2, f) { if (c !== undefined) cap = c; if (s2 !== undefined) site = s2; if (f !== undefined) focale = f; peindre(); }, lancer: lancer });
  };

  /* ════ Monter, et le mot « lancer » d'une planche ════ */
  H.monter = function (racine) {
    [].forEach.call((racine || document).querySelectorAll('[data-hud]'), function (n) { if (n._monte) return; var f = H[n.dataset.hud]; if (!f || n.dataset.hud === 'tele' || n.dataset.hud === 'chrono' || n.dataset.hud === 'radial') return; n._monte = true; f(n, n.dataset); });
    [].forEach.call((racine || document).querySelectorAll('[data-hud-lancer]'), function (b) {
      if (b._monte) return; b._monte = true; var joue = false, dernier = 0, repos = b.textContent;
      function pieces() { return [].filter.call(b.closest('.hud-planche').querySelectorAll('[data-hud]'), function (n) { return n._hud && n._hud.pas; }); }
      function boucle(ts) { if (!joue) return; var dt = dernier ? Math.min(.1, (ts - dernier) / 1000) : 0; dernier = ts; pieces().forEach(function (n) { n._hud.pas(dt); }); requestAnimationFrame(boucle); }
      if (calme) b.textContent = 'avancer d’un pas';
      b.addEventListener('click', function () {
        if (calme) { pieces().forEach(function (n) { n._hud.pas(.5); }); return; }
        joue = !joue; dernier = 0; b.setAttribute('aria-pressed', String(joue)); b.textContent = joue ? 'arrêter' : repos; if (joue) requestAnimationFrame(boucle); else pieces().forEach(function (n) { if (n._hud.arret) n._hud.arret(); });
      });
    });
  };
  H.monter(document);
})();
