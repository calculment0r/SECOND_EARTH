/* KIT ÉTUDE · LA DATAVIZ EN DEUX DIMENSIONS — le socle, le temps, la comparaison. (La suite : dataviz-2.js.)
   Chaque forme est un appel : KitEtude.viz.nom(element, donnees, options). Du SVG écrit à la main, aucune bibliothèque.
   Options communes : h (hauteur), lu (un élément aria-live où s'écrit ce qu'on vise), repos ({ sur, val, txt } : ce que « lu » dit au repos),
   tenu (l'indice d'une marque tenue : elle reste orange). Dans les données : deduit (ambre pointillé), inconnu (hachures).
   Tout graphique a sa couche de survol ; le clavier fait le même geste (Tab entre, les flèches vont d'une marque à l'autre, Échap sort).
   Rien ne bouge au chargement. Les couleurs sont des classes de dataviz.css, donc des jetons. */
(function () {
  'use strict';
  var KE = window.KitEtude = window.KitEtude || {}, V = KE.viz = {}, NS = 'http://www.w3.org/2000/svg', uid = 0, refaire = [];

  /* ── les outils ── */
  function S(t, a, p, txt) { var n = document.createElementNS(NS, t), k; for (k in a || {}) if (a[k] !== null && a[k] !== undefined) n.setAttribute(k, a[k]); if (txt !== undefined && txt !== null) n.textContent = txt; if (p) p.appendChild(n); return n; }
  function H(t, a, p, txt) { var n = document.createElement(t), k; for (k in a || {}) if (a[k] !== null && a[k] !== undefined) n.setAttribute(k, a[k]); if (txt !== undefined && txt !== null) n.textContent = txt; if (p) p.appendChild(n); return n; }
  function lin(d0, d1, r0, r1) { var k = (r1 - r0) / ((d1 - d0) || 1); return function (v) { return r0 + (v - d0) * k; }; }
  function borne(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function fr(v, d) { if (v === null || v === undefined || isNaN(v)) return '—'; var s = Math.abs(v).toFixed(d || 0).split('.'); s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' '); return (v < 0 ? '−' : '') + s.join(','); }
  function alea(g) { var a = g || 7; return function () { a = a * 16807 % 2147483647; return a / 2147483647; }; }
  function somme(t) { return t.reduce(function (s, x) { return s + x; }, 0); }
  function quantile(tri, q) { var p = (tri.length - 1) * q, b = Math.floor(p); return tri[b] + ((tri[b + 1] !== undefined ? tri[b + 1] : tri[b]) - tri[b]) * (p - b); }
  function beaux(min, max, n) { var pas = Math.pow(10, Math.floor(Math.log10((max - min) / (n || 4) || 1))), e = (max - min) / (n || 4) / pas; pas *= e >= 5 ? 5 : e >= 2 ? 2 : 1; var t = [], v = Math.floor(min / pas + 1e-9) * pas, fin = Math.ceil(max / pas - 1e-9) * pas; for (; v <= fin + pas * 1e-6; v += pas) t.push(+v.toFixed(6)); return t; }   /* des cotes rondes qui couvrent toute l'étendue */
  function P(p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }
  function su(v) { return v !== null && v !== undefined && !(typeof v === 'number' && isNaN(v)); }
  /* les suites d'indices connus, et les trous (null = on ne sait pas) : [[a, b], …] */
  function suites(v, a, b, trous) { var r = [], i, d = -1; a = a || 0; b = b === undefined ? v.length - 1 : b; for (i = a; i <= b + 1; i++) { var k = i <= b && (trous ? !su(v[i]) : su(v[i])); if (k && d < 0) d = i; if (!k && d >= 0) { r.push([d, i - 1]); d = -1; } } return r; }
  /* une courbe monotone (Fritsch-Carlson) : douce, sans jamais dépasser ses points ; pour les bandes qui ne doivent pas mentir */
  function monotone(pts) {
    var n = pts.length, i; if (n < 3) return brise(pts);
    var dx = [], m = [], t = [];
    for (i = 0; i < n - 1; i++) { dx[i] = pts[i + 1][0] - pts[i][0]; m[i] = (pts[i + 1][1] - pts[i][1]) / (dx[i] || 1); }
    t[0] = m[0]; t[n - 1] = m[n - 2];
    for (i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : 3 * (dx[i - 1] + dx[i]) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
    var d = 'M' + P(pts[0]); for (i = 0; i < n - 1; i++) { var h = dx[i] / 3; d += 'C' + P([pts[i][0] + h, pts[i][1] + t[i] * h]) + ' ' + P([pts[i + 1][0] - h, pts[i + 1][1] - t[i + 1] * h]) + ' ' + P(pts[i + 1]); }
    return d;
  }
  function brise(pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + P(p); }).join(''); }
  /* une courbe douce qui passe par ses points (Catmull-Rom vers Bézier) ; segs() sans le M de tête, pour refermer une aire */
  function segs(pts) { var d = '', i, p0, p1, p2, p3; for (i = 0; i < pts.length - 1; i++) { p0 = pts[i - 1] || pts[i]; p1 = pts[i]; p2 = pts[i + 1]; p3 = pts[i + 2] || p2; d += 'C' + P([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]) + ' ' + P([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]) + ' ' + P(p2); } return d; }
  function douce(pts) { return 'M' + P(pts[0]) + segs(pts); }
  function aire(haut, bas) { var r = bas.slice().reverse(); return 'M' + P(haut[0]) + segs(haut) + 'L' + P(r[0]) + segs(r) + 'Z'; }
  function polaire(cx, cy, r, a) { return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
  function secteur(cx, cy, r0, r1, a0, a1) { var g = a1 - a0 > Math.PI ? 1 : 0, A = polaire(cx, cy, r1, a0), B = polaire(cx, cy, r1, a1), C = polaire(cx, cy, r0, a1), D = polaire(cx, cy, r0, a0); return 'M' + P(A) + 'A' + r1 + ' ' + r1 + ' 0 ' + g + ' 1 ' + P(B) + 'L' + P(C) + 'A' + r0 + ' ' + r0 + ' 0 ' + g + ' 0 ' + P(D) + 'Z'; }

  /* ── le cadre commun : le svg, l'infobulle, la phrase de lecture ── */
  function base(el, o, h) {
    el.textContent = ''; el.classList.add('dv'); el.classList.remove('vise', 'estompe');
    var W = Math.max(260, Math.round(el.clientWidth || 600)), HH = o.h || h;
    var svg = S('svg', { viewBox: '0 0 ' + W + ' ' + HH, role: 'group', 'aria-label': o.nom || el.getAttribute('aria-label') || 'Graphique' }, el);
    var bulle = H('div', { class: 'dv-bulle', 'aria-hidden': 'true' }, el); H('small', {}, bulle); H('b', {}, bulle); H('span', {}, bulle);
    var c = { el: el, svg: svg, W: W, H: HH, o: o, lu: o.lu || null };
    function ecrire(n, d) { n.children[0].textContent = d.sur || ''; n.children[1].textContent = d.val !== undefined && d.val !== null ? d.val : ''; n.children[2].textContent = d.txt || ''; }
    if (c.lu && c.lu.children.length < 3) { c.lu.textContent = ''; H('small', {}, c.lu); H('b', {}, c.lu); H('span', {}, c.lu); }
    /* dire : ce qu'on vise, dans l'infobulle (près de la marque) et dans la phrase de lecture */
    c.dire = function (d) {
      if (d.x !== undefined || d.boite) { ecrire(bulle, d); poser(d); bulle.classList.add('la'); }
      if (c.lu) ecrire(c.lu, d);
    };
    /* l'infobulle se pose du côté libre : à droite de la marque, sinon à gauche, sinon dessus, sinon dessous ; jamais sur la marque visée.
       d.boite = { x0, y0, x1, y1 } (la marque entière, en unités du dessin) ; sinon le point d.x, d.y. */
    function poser(d) {
      var b = d.boite || { x0: d.x, x1: d.x, y0: d.y, y1: d.y }, sr = svg.getBoundingClientRect(), er = el.getBoundingClientRect(), s = sr.width / W || 1, ox = sr.left - er.left, oy = sr.top - er.top;
      var bw = bulle.offsetWidth, bh = bulle.offsetHeight, ew = el.clientWidth, eh = el.clientHeight, g = 14, x0 = ox + b.x0 * s, x1 = ox + b.x1 * s, y0 = oy + b.y0 * s, y1 = oy + b.y1 * s, xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
      var droite = [x1 + g, ym - bh / 2], gauche = [x0 - g - bw, ym - bh / 2], dessus = [xm - bw / 2, y0 - g - bh], dessous = [xm - bw / 2, y1 + g];
      var noms = { droite: droite, gauche: gauche, dessus: dessus, dessous: dessous }, essais = d.cotes ? d.cotes.map(function (k) { return noms[k]; }) : (x0 + x1) / 2 > ew * .62 ? [gauche, droite, dessus, dessous] : [droite, gauche, dessus, dessous], pris = null, moins = Infinity;
      essais.forEach(function (p) { if (pris) return; var deb = Math.max(0, -p[0]) + Math.max(0, p[0] + bw - ew) + Math.max(0, -p[1] - 40) + Math.max(0, p[1] + bh - eh - 40); if (deb < 1) pris = p; else if (deb < moins) { moins = deb; pris = null; essais.meilleur = p; } });
      pris = pris || essais.meilleur || droite;
      bulle.style.left = Math.round(borne(pris[0], -8, Math.max(0, ew - bw + 8))) + 'px'; bulle.style.top = Math.round(pris[1]) + 'px';
    }
    c.taire = function () { bulle.classList.remove('la'); if (c.lu) ecrire(c.lu, o.repos || {}); };
    c.hachures = function () { var id = 'dvh' + (++uid), d = S('defs', {}, svg), p = S('pattern', { id: id, width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, d); S('line', { class: 'dv-hl', x1: 0, y1: 0, x2: 0, y2: 6 }, p); return 'url(#' + id + ')'; };
    if (c.lu) ecrire(c.lu, o.repos || {});
    return c;
  }
  /* aller d'une marque à l'autre : le survol et le clavier font le même appel. pas : { dx, dy } pour une grille */
  function nav(c, marks, vise, pas) {
    var ici = -1, dx = pas && pas.dx || 1, dy = pas && pas.dy || 1, pos = pas && pas.pos;
    /* pas.pos : la place de chaque marque ; les flèches vont alors à la plus proche dans leur direction (nuage, réseau, mosaïque) */
    function voisin(i, sens) {
      var p = pos[i], best = -1, bc = Infinity, repli = -1, rc = Infinity;
      pos.forEach(function (q, j) {
        if (j === i) return; var ex = q[0] - p[0], ey = q[1] - p[1], av = sens === 'd' ? ex : sens === 'g' ? -ex : sens === 'b' ? ey : -ey, cote = sens === 'd' || sens === 'g' ? Math.abs(ey) : Math.abs(ex);
        if (av <= .5) return; var cout = av + cote * 2; if (cote <= av * 1.6 && cout < bc) { bc = cout; best = j; } if (cout < rc) { rc = cout; repli = j; }
      });
      return best >= 0 ? best : repli;
    }
    function on(i) { if (ici >= 0 && ici !== i) { vise(ici, false); marks[ici].classList.remove('ici'); } ici = i; marks[i].classList.add('ici'); vise(i, true); }
    function off() { if (ici >= 0) { vise(ici, false); marks[ici].classList.remove('ici'); } ici = -1; c.taire(); }
    marks.forEach(function (m, i) {
      m.setAttribute('tabindex', i ? -1 : 0); m.classList.add('dv-m');
      m.addEventListener('pointerenter', function () { on(i); }); m.addEventListener('pointerleave', function () { if (document.activeElement !== m) off(); });
      m.addEventListener('focus', function () { on(i); }); m.addEventListener('blur', off);
      m.addEventListener('keydown', function (e) {
        var j = i, f = { ArrowRight: 'd', ArrowLeft: 'g', ArrowDown: 'b', ArrowUp: 'h' }[e.key];
        if (pos && f) { j = voisin(i, f); if (j < 0) { e.preventDefault(); return; } }
        else if (pas && pas.page && (e.key === 'PageDown' || e.key === 'PageUp')) j = pas.page(i, e.key === 'PageDown' ? 1 : -1);
        else if (e.key === 'ArrowRight') j = i + dx; else if (e.key === 'ArrowLeft') j = i - dx; else if (e.key === 'ArrowDown') j = i + dy; else if (e.key === 'ArrowUp') j = i - dy; else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = marks.length - 1; else if (e.key === 'Escape') { m.blur(); return; } else return;
        e.preventDefault(); if (j < 0 || j >= marks.length) return; marks[i].setAttribute('tabindex', -1); marks[j].setAttribute('tabindex', 0); marks[j].focus();
      });
    });
  }
  /* le viseur : une ligne qui suit le pointeur, de cran en cran ; au clavier, les flèches */
  function viseur(c, n, X, y0, y1, x0, x1, fn) {
    var g = S('g', { class: 'dv-viseur' }, c.svg), l = S('line', { class: 'dv-vl', y1: y0, y2: y1 }, g), pts = S('g', { class: 'pts' }, g), i = -1;
    var zone = S('rect', { class: 'dv-zone', x: x0, y: Math.min(y0, 0), width: x1 - x0, height: c.H, fill: 'transparent', tabindex: 0, role: 'slider', 'aria-label': 'Parcourir le graphique', 'aria-valuemin': 0, 'aria-valuemax': n - 1 }, c.svg);
    function va(j) { i = borne(j, 0, n - 1); l.setAttribute('x1', X(i)); l.setAttribute('x2', X(i)); c.el.classList.add('vise'); zone.setAttribute('aria-valuenow', i); pts.textContent = ''; fn(i, pts); }
    function off() { c.el.classList.remove('vise'); i = -1; c.taire(); fn(-1, pts); }
    zone.addEventListener('pointermove', function (e) { var r = c.svg.getBoundingClientRect(), x = (e.clientX - r.left) * c.W / r.width, b = 0, bd = 1e9, k, d; for (k = 0; k < n; k++) { d = Math.abs(X(k) - x); if (d < bd) { bd = d; b = k; } } if (b !== i) va(b); });
    zone.addEventListener('pointerleave', function () { if (document.activeElement !== zone) off(); });
    zone.addEventListener('focus', function () { if (i < 0) va(n - 1); }); zone.addEventListener('blur', off);
    zone.addEventListener('keydown', function (e) { var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : e.key === 'Home' ? -1e6 : e.key === 'End' ? 1e6 : 0; if (e.key === 'Escape') { zone.blur(); return; } if (!d) return; e.preventDefault(); va(i + d); });
    return { g: g, va: va };
  }
  /* l'axe du bas : un trait, des crans, des cotes */
  function axeX(c, y, x0, x1, crans) { var g = S('g', {}, c.svg); S('line', { class: 'dv-sol', x1: x0, y1: y, x2: x1, y2: y }, g); crans.forEach(function (k) { S('line', { class: 'dv-cran', x1: k.x, y1: y, x2: k.x, y2: y + 5 }, g); if (k.t !== undefined) S('text', { x: k.x, y: y + 20, 'text-anchor': k.a || 'middle' }, g, k.t); }); return g; }
  function axeY(c, x0, x1, crans) { var g = S('g', {}, c.svg); crans.forEach(function (k) { S('line', { class: 'dv-grille-l', x1: x0, y1: k.y, x2: x1, y2: k.y }, g); S('text', { x: x0 - 10, y: k.y + 4, 'text-anchor': 'end' }, g, k.t); }); return g; }
  /* déclarer une forme : elle se redessine quand la largeur change */
  function forme(nom, fn) {
    V[nom] = function (el, d, o) { o = o || {}; var w = 0; function tracer() { w = el.clientWidth; return fn(el, d, o); } refaire.push(function () { if (el.isConnected && Math.abs(el.clientWidth - w) > 2) tracer(); }); return tracer(); };
  }
  var minuterie = 0; window.addEventListener('resize', function () { clearTimeout(minuterie); minuterie = setTimeout(function () { refaire.forEach(function (f) { f(); }); }, 160); });
  V.outils = { su: su, suites: suites, monotone: monotone, S: S, H: H, lin: lin, borne: borne, fr: fr, alea: alea, somme: somme, quantile: quantile, beaux: beaux, brise: brise, douce: douce, segs: segs, aire: aire, polaire: polaire, secteur: secteur, P: P, base: base, nav: nav, viseur: viseur, axeX: axeX, axeY: axeY, forme: forme };

  /* ── les états sans données ── */
  V.vide = function (el, phrase, h) { el.textContent = ''; el.className = 'dv-etat'; el.style.setProperty('--h', (h || 160) + 'px'); H('p', {}, el, phrase || 'Rien à montrer ici pour l’instant.'); };
  V.attente = function (el, phrase, h) { el.textContent = ''; el.className = 'dv-etat attente'; el.setAttribute('aria-busy', 'true'); el.style.setProperty('--h', (h || 160) + 'px'); H('p', {}, el, phrase || 'Les données arrivent.'); };

  /* ════════ LE TEMPS ════════ */

  /* 01 · la courbe : KitEtude.viz.courbe(el, { noms, v, bas, haut, deduit: [{ v, bas, haut }], unite, note: { i, txt } }) */
  forme('courbe', function (el, d, o) {
    var c = base(el, o, 300), M = { l: 46, r: 96, t: 26, b: 34 }, nr = d.v.length, ded = d.deduit || [], n = nr + ded.length, hach = c.hachures();
    var tout = d.v.concat(ded.map(function (x) { return x.v; })), bas = (d.bas || d.v).concat(ded.map(function (x) { return x.bas; })), haut = (d.haut || d.v).concat(ded.map(function (x) { return x.haut; }));
    var cr = beaux(Math.min.apply(null, bas.filter(su)), Math.max.apply(null, haut.filter(su)), 4), X = lin(0, n - 1, M.l, c.W - M.r), Y = lin(cr[0], cr[cr.length - 1], c.H - M.b, M.t);
    function xy(t, a, b) { var p = [], i; for (i = a; i <= b; i++) if (su(t[i])) p.push([X(i), Y(t[i])]); return p; }
    axeY(c, M.l, c.W - M.r, cr.map(function (v) { return { y: Y(v), t: fr(v) }; }));
    var pasN = Math.ceil(n / Math.max(2, Math.floor((c.W - M.l - M.r) / 90)));
    axeX(c, c.H - M.b, M.l, c.W - M.r, d.noms.map(function (t, i) { return i % pasN ? null : { x: X(i), t: t }; }).filter(Boolean));
    /* un trou (on ne sait pas) : des hachures sur toute la hauteur, la courbe s'interrompt */
    suites(d.v, 0, nr - 1, true).forEach(function (t) { var xa = X(Math.max(0, t[0] - 1)), xb = X(Math.min(nr - 1, t[1] + 1)); S('rect', { class: 'dv-trou', x: xa, y: M.t, width: xb - xa, height: c.H - M.b - M.t, fill: hach }, c.svg); S('text', { class: 'dv-nomtxt it', x: (xa + xb) / 2, y: M.t - 8, 'text-anchor': 'middle' }, c.svg, 'on ne sait pas'); });
    suites(d.v, 0, nr - 1).forEach(function (r) { if (r[1] <= r[0]) return; if (d.bas) S('path', { class: 'dv-bande', d: aire(xy(haut, r[0], r[1]), xy(bas, r[0], r[1])) }, c.svg); S('path', { class: 'dv-t', d: douce(xy(tout, r[0], r[1])) }, c.svg); });
    if (ded.length) S('path', { class: 'dv-bande ded', d: aire(xy(haut, nr - 1, n - 1), xy(bas, nr - 1, n - 1)) }, c.svg);
    if (ded.length) { S('path', { class: 'dv-t ded', d: douce(xy(tout, nr - 1, n - 1)) }, c.svg); S('text', { class: 'dv-amb', x: X(n - 1) + 10, y: Y(tout[n - 1]) + 4 }, c.svg, 'déduit'); }
    S('circle', { class: 'dv-f5', cx: X(nr - 1), cy: Y(tout[nr - 1]), r: 3.5 }, c.svg);
    S('text', { class: 'dv-val', x: X(nr - 1) + 9, y: Y(tout[nr - 1]) - 9 }, c.svg, fr(tout[nr - 1]) + (d.unite ? ' ' + d.unite : ''));
    if (d.note) { var nx = X(d.note.i), ny = Y(tout[d.note.i]); S('line', { class: 'dv-filet', x1: nx, y1: ny - 7, x2: nx, y2: M.t - 6 }, c.svg); S('text', { class: 'dv-nomtxt it', x: nx + 8, y: M.t - 2 }, c.svg, d.note.txt); S('circle', { class: 'dv-creux', cx: nx, cy: ny, r: 4 }, c.svg); }
    viseur(c, n, X, M.t, c.H - M.b, M.l - 6, c.W - M.r + 12, function (i, g) {
      if (i < 0) return; if (!su(tout[i])) { c.dire({ x: X(i), y: M.t + 30, sur: d.noms[i], val: 'on ne sait pas', txt: 'aucune mesure ce jour-là' }); return; } S('circle', { class: 'dv-point', cx: X(i), cy: Y(tout[i]), r: 4.5 }, g);
      c.dire({ x: X(i), y: Y(tout[i]) - 34, sur: d.noms[i] + (i >= nr ? ' · déduit' : ''), val: fr(tout[i]) + (d.unite ? ' ' + d.unite : ''), txt: d.bas ? 'entre ' + fr(bas[i]) + ' et ' + fr(haut[i]) : '' });
    });
  });

  /* 02 · le fleuve (aires empilées, centrées) : fleuve(el, { noms, series: [{ nom, v }], unite }) */
  forme('fleuve', function (el, d, o) {
    var c = base(el, o, 300), M = { l: 8, r: 8, t: 14, b: 30 }, n = d.noms.length, tot = d.noms.map(function (_, i) { return somme(d.series.map(function (s) { return s.v[i]; })); }), max = Math.max.apply(null, tot);
    var X = lin(0, n - 1, M.l, c.W - M.r), K = (c.H - M.t - M.b) / max, mil = M.t + (c.H - M.t - M.b) / 2, cum = tot.map(function (t) { return -t / 2; }), marks = [], infos = [], tons = ['dv-f2', 'dv-f3', 'dv-f1'];
    var pasN = Math.ceil(n / Math.max(2, Math.floor(c.W / 90)));
    d.series.forEach(function (s, k) {
      var haut = [], bas = [], gros = 0, gi = 0;
      s.v.forEach(function (v, i) { var a = mil + cum[i] * K, b = mil + (cum[i] + v) * K; haut.push([X(i), a]); bas.push([X(i), b]); if (v > gros && i > 0 && i < n - 1) { gros = v; gi = i; } cum[i] += v; });
      var p = S('path', { class: 'dv-f dv-joint ' + tons[k % tons.length] + (o.tenu === k ? ' tenu' : ''), d: aire(haut, bas), role: 'img', 'aria-label': s.nom + ', ' + fr(somme(s.v)) + ' en tout' }, c.svg);
      marks.push(p); infos.push({ s: s, haut: haut, bas: bas, gi: gi, ep: gros * K });
    });
    var labels = infos.map(function (f) { return f.ep > 20 ? S('text', { class: 'dv-nomtxt dv-encre dv-e', x: X(f.gi), y: (f.haut[f.gi][1] + f.bas[f.gi][1]) / 2 + 5, 'text-anchor': 'middle', 'pointer-events': 'none' }, c.svg, f.s.nom) : null; });
    axeX(c, c.H - M.b + 6, M.l, c.W - M.r, d.noms.map(function (t, i) { return i % pasN ? null : { x: X(i), t: t, a: i === 0 ? 'start' : 'middle' }; }).filter(Boolean));
    function dire(k, i) { var f = infos[k]; c.dire({ x: X(i), y: (f.haut[i][1] + f.bas[i][1]) / 2, sur: f.s.nom + ' · ' + d.noms[i], val: fr(f.s.v[i]) + (d.unite ? ' ' + d.unite : ''), txt: 'sur ' + fr(tot[i]) + ' en tout' }); }
    nav(c, marks, function (k, oui) { marks[k].classList.toggle('vif', oui); c.el.classList.toggle('estompe', oui); if (labels[k]) labels[k].classList.toggle('vif', oui); if (oui) dire(k, infos[k].gi); });
    marks.forEach(function (p, k) { p.addEventListener('pointermove', function (e) { var r = c.svg.getBoundingClientRect(); dire(k, borne(Math.round((((e.clientX - r.left) * c.W / r.width) - M.l) / ((c.W - M.l - M.r) / (n - 1))), 0, n - 1)); }); });
  });

  /* 03 · les crêtes : cretes(el, { noms, series: [{ nom, v }] }) : une ligne par série, elles se recouvrent */
  forme('cretes', function (el, d, o) {
    var ns = d.series.length, pas = o.pas || 30, c = base(el, { h: o.h || (ns - 1) * pas + 110, lu: o.lu, repos: o.repos, nom: o.nom }, 0), M = { l: o.ml || 132, r: 10, t: 70, b: 30 }, n = d.noms.length;
    var max = Math.max.apply(null, d.series.map(function (s) { return Math.max.apply(null, s.v.filter(su)); })), X = lin(0, n - 1, M.l, c.W - M.r), amp = pas * 2.3 / max, marks = [], noms = [], hach = c.hachures();
    /* une série déduite : son trait est ambre, en pointillé ; un trou (null) : la ligne s'arrête, des hachures disent qu'on ne sait pas */
    d.series.forEach(function (s, k) {
      var y0 = M.t + k * pas, g = S('g', { role: 'img', 'aria-label': s.nom + (s.deduit ? ', déduite' : '') }, c.svg), cl = s.deduit ? ' ded' : ' fin';
      suites(s.v).forEach(function (r) { var pts = []; for (var i = r[0]; i <= r[1]; i++) pts.push([X(i), y0 - s.v[i] * amp]); if (pts.length < 2) return; S('path', { class: 'dv-f0', d: douce(pts) + 'L' + P([pts[pts.length - 1][0], y0]) + 'L' + P([pts[0][0], y0]) + 'Z' }, g); S('path', { class: 'dv-t' + cl + (o.tenu === k ? ' tenu' : ''), d: douce(pts) }, g); });
      suites(s.v, 0, n - 1, true).forEach(function (t) { var xa = X(Math.max(0, t[0] - 1)), xb = X(Math.min(n - 1, t[1] + 1)); S('rect', { class: 'dv-trou', x: xa, y: y0 - pas * .9, width: xb - xa, height: pas * .9, fill: hach }, g); });
      S('line', { class: 'dv-grille-l', x1: M.l, y1: y0, x2: c.W - M.r, y2: y0 }, g);
      noms.push(S('text', { class: 'dv-nomtxt dv-e' + (o.tenu === k ? ' tenu' : '') + (s.deduit ? ' dv-amb it' : ''), x: M.l - 16, y: y0 - 2, 'text-anchor': 'end' }, c.svg, s.nom)); marks.push(g);
    });
    var pasN = Math.ceil(n / Math.max(2, Math.floor((c.W - M.l) / 90)));
    d.noms.forEach(function (t, i) { if (i % pasN === 0) S('text', { x: X(i), y: c.H - 8, 'text-anchor': i ? 'middle' : 'start' }, c.svg, t); });
    nav(c, marks, function (k, oui) {
      marks[k].querySelector('.dv-t').classList.toggle('vif', oui); noms[k].classList.toggle('vif', oui);
      if (oui) { var s = d.series[k], m = Math.max.apply(null, s.v.filter(su)), i = s.v.indexOf(m), trou = s.v.some(function (v) { return !su(v); }); c.dire({ x: X(i), y: M.t + k * pas - m * amp - 26, sur: s.nom + (s.deduit ? ' · déduite' : '') + (trou ? ' · un trou' : ''), val: fr(m) + (d.unite ? ' ' + d.unite : ''), txt: 'au plus haut, ' + d.noms[i] }); }
    });
  });

  /* 04 · l'horizon : horizon(el, { noms, series: [{ nom, v }] }) : trois bandes repliées ; ce qui monte part du bas, ce qui descend pend du haut */
  forme('horizon', function (el, d, o) {
    var ns = d.series.length, hr = o.rang || 34, c = base(el, { h: ns * (hr + 8) + 34, lu: o.lu, repos: o.repos, nom: o.nom }, 0), M = { l: 132, r: 70, t: 4, b: 30 }, n = d.noms.length, X = lin(0, n - 1, M.l, c.W - M.r);
    var max = Math.max.apply(null, d.series.map(function (s) { return Math.max.apply(null, s.v.filter(su).map(Math.abs)); })), pasB = max / 3, valeurs = [], defs = S('defs', {}, c.svg), hach = c.hachures();
    /* trois bandes nettes (des courbes monotones : douces, sans dépasser la mesure) ; un trou : des hachures ; la part déduite : un filet ambre */
    d.series.forEach(function (s, k) {
      var y0 = M.t + k * (hr + 8), id = 'dvc' + (++uid), v0 = s.v.map(function (v) { return su(v) ? v : 0; }); S('rect', { x: M.l, y: y0, width: c.W - M.l - M.r, height: hr }, S('clipPath', { id: id }, defs));
      var g = S('g', { 'clip-path': 'url(#' + id + ')' }, c.svg), b, sens;
      for (sens = 1; sens >= -1; sens -= 2) for (b = 0; b < 3; b++) {
        var pts = v0.map(function (v, i) { var e = borne((v * sens - b * pasB) / pasB, 0, 1) * hr; return [X(i), sens > 0 ? y0 + hr - e : y0 + e]; }), bord = sens > 0 ? y0 + hr : y0;
        S('path', { class: 'dv-hz ' + ['dv-f2', 'dv-f4', 'dv-f5'][b], d: monotone(pts) + 'L' + P([X(n - 1), bord]) + 'L' + P([X(0), bord]) + 'Z' }, g);
      }
      suites(s.v, 0, n - 1, true).forEach(function (t) { var xa = X(Math.max(0, t[0] - 1)), xb = X(Math.min(n - 1, t[1] + 1)); S('rect', { class: 'dv-f0', x: xa, y: y0, width: xb - xa, height: hr }, g); S('rect', { class: 'dv-trou', x: xa, y: y0, width: xb - xa, height: hr, fill: hach }, g); });
      if (s.deduitDepuis !== undefined) { var xd = X(s.deduitDepuis); S('rect', { class: 'dv-voile-ded', x: xd, y: y0, width: c.W - M.r - xd, height: hr }, g); S('line', { class: 'dv-t ded', x1: xd, y1: y0, x2: xd, y2: y0 + hr }, g); }
      S('line', { class: 'dv-grille-l', x1: M.l, y1: y0 + hr + .5, x2: c.W - M.r, y2: y0 + hr + .5 }, c.svg);
      S('text', { class: 'dv-nomtxt' + (s.deduitDepuis !== undefined ? ' dv-amb it' : ''), x: M.l - 16, y: y0 + hr - 9, 'text-anchor': 'end' }, c.svg, s.nom);
      valeurs.push(S('text', { class: 'dv-val', x: c.W - M.r + 12, y: y0 + hr - 9 }, c.svg, fr(s.v[n - 1])));
    });
    /* la légende des bandes : ce que vaut chaque teinte, et le sens */
    var leg = H('ul', {}, el); V.legende(leg, [{ nom: 'jusqu’à ' + fr(pasB), marque: 'f2' }, { nom: 'jusqu’à ' + fr(2 * pasB), marque: 'f4' }, { nom: 'jusqu’à ' + fr(max), marque: 'f5' }, { nom: 'au-dessus de la moyenne : depuis le bas ; en dessous : pend du haut', marque: 'fin' }].concat(d.series.some(function (s) { return s.v.some(function (v) { return !su(v); }); }) ? [{ nom: 'on ne sait pas', marque: 'hach' }] : []).concat(d.series.some(function (s) { return s.deduitDepuis !== undefined; }) ? [{ nom: 'déduit', marque: 'ded' }] : []));
    var pasN = Math.ceil(n / Math.max(2, Math.floor((c.W - M.l - M.r) / 90)));
    d.noms.forEach(function (t, i) { if (i % pasN === 0) S('text', { x: X(i), y: c.H - 8, 'text-anchor': i ? 'middle' : 'start' }, c.svg, t); });
    viseur(c, n, X, M.t, c.H - M.b, M.l, c.W - M.r, function (i) {
      var j = i < 0 ? n - 1 : i; valeurs.forEach(function (t, k) { var v = d.series[k].v[j]; t.textContent = su(v) ? fr(v) : '?'; });
      if (i >= 0) { var hi = 0; d.series.forEach(function (s, k) { if (Math.abs(s.v[i] || 0) > Math.abs(d.series[hi].v[i] || 0)) hi = k; }); c.dire({ sur: d.noms[i], val: fr(d.series[hi].v[i]), txt: 'le plus fort écart : ' + d.series[hi].nom }); }
    });
  });

  /* 05 · le calendrier : calendrier(el, { annee, v: [une valeur par jour, null = on ne sait pas], deduitDepuis, unite }) */
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  forme('calendrier', function (el, d, o) {
    var W0 = Math.max(260, el.clientWidth || 600), pas = Math.min(26, (W0 - 34) / 53), cote = pas - 2.5, c = base(el, { h: Math.round(pas * 7 + 34), lu: o.lu, repos: o.repos, nom: o.nom }, 0), hach = c.hachures();
    var j0 = (new Date(d.annee, 0, 1).getDay() + 6) % 7, connus = d.v.filter(function (x) { return x !== null; }).sort(function (a, b) { return a - b; }), seuils = [.2, .4, .6, .8].map(function (q) { return quantile(connus, q); }), marks = [];
    ['L', '', 'M', '', 'V', '', 'D'].forEach(function (t, k) { if (t) S('text', { x: 0, y: 28 + k * pas + cote * .75 }, c.svg, t); });
    d.v.forEach(function (v, i) {
      var jour = new Date(d.annee, 0, 1 + i), col = Math.floor((i + j0) / 7), lig = (i + j0) % 7, x = 22 + col * pas, y = 26 + lig * pas, ded = d.deduitDepuis !== undefined && i >= d.deduitDepuis;
      if (jour.getDate() === 1) S('text', { x: x, y: 14 }, c.svg, ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'][jour.getMonth()]);
      var niv = v === null ? 0 : 1 + seuils.filter(function (s) { return v > s; }).length;
      var r = S('rect', { class: ded ? 'dv-ded-c dv-f' : 'dv-f ' + (v === null ? '' : 'dv-f' + niv), x: x, y: y, width: cote, height: cote, fill: v === null && !ded ? hach : null, role: 'img', 'aria-label': jour.getDate() + ' ' + MOIS[jour.getMonth()] + ' : ' + (v === null ? 'on ne sait pas' : fr(v)) }, c.svg);
      r._d = { boite: { x0: x, y0: y, x1: x + cote, y1: y + cote }, sur: jour.getDate() + (jour.getDate() === 1 ? 'ᵉʳ ' : ' ') + MOIS[jour.getMonth()] + (ded ? ' · déduit' : ''), val: v === null ? 'on ne sait pas' : fr(v) + (d.unite ? ' ' + d.unite : ''), txt: '' }; marks.push(r);
    });
    /* les flèches : un jour (haut, bas), une semaine (gauche, droite) ; Page : le même jour, un mois plus tôt ou plus tard */
    nav(c, marks, function (i, oui) { marks[i].classList.toggle('vif', oui); if (oui) c.dire(marks[i]._d); }, { dx: 7, dy: 1, page: function (i, sens) { var j = new Date(d.annee, 0, 1 + i), m = new Date(d.annee, j.getMonth() + sens, 1), fin = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate(), b = new Date(m.getFullYear(), m.getMonth(), Math.min(j.getDate(), fin)); return borne(Math.round((b - new Date(d.annee, 0, 1)) / 864e5), 0, marks.length - 1); } });
  });

  /* 06 · la spirale : spirale(el, { v: [une valeur par semaine], an0, unite }) : un tour par an, les mêmes semaines se font face */
  forme('spirale', function (el, d, o) {
    var c = base(el, o, 380), cx = c.W / 2, cy = c.H / 2 + 4, tours = d.v.length / 52, R1 = Math.min(c.W, c.H) / 2 - 34, R0 = 34, pasR = (R1 - R0) / tours, max = Math.max.apply(null, d.v), marks = [];
    function pos(i, plus) { var a = i / 52 * 2 * Math.PI - Math.PI / 2; return polaire(cx, cy, R0 + i / 52 * pasR + (plus || 0), a); }
    var fil = []; for (var i = 0; i <= d.v.length; i++) fil.push(pos(i)); S('path', { class: 'dv-grille-l', d: brise(fil) }, c.svg);
    MOIS.forEach(function (m, k) { var a = k / 12 * 2 * Math.PI - Math.PI / 2, p = polaire(cx, cy, R1 + 16, a); S('text', { x: p[0], y: p[1] + 4, 'text-anchor': 'middle' }, c.svg, m.slice(0, 1).toUpperCase()); });
    d.v.forEach(function (v, i) {
      var a = pos(i), b = pos(i, v === null ? pasR * .5 : 2 + v / max * (pasR - 7)), ded = d.deduitDepuis !== undefined && i >= d.deduitDepuis;
      var l = S('line', { class: 'dv-t ' + (ded ? 'ded' : v === null ? 'pale' : ''), x1: a[0], y1: a[1], x2: b[0], y2: b[1], 'stroke-width': ded ? 1.6 : 2.4, role: 'img', 'aria-label': 'semaine ' + (i % 52 + 1) + ' de ' + (d.an0 + Math.floor(i / 52)) + ' : ' + fr(v) }, c.svg);
      S('line', { class: 'dv-prise', x1: a[0], y1: a[1], x2: b[0], y2: b[1], 'stroke-width': 9 }, c.svg)._l = l; marks.push(l);
    });
    for (var t = 0; t < tours; t++) { var q = pos(t * 52); S('text', { 'pointer-events': 'none', class: 'dv-val dv-halo', x: q[0] - 7, y: q[1] + 16, 'text-anchor': 'end' }, c.svg, String(d.an0 + t)); }
    var centre = S('text', { class: 'dv-grand', x: cx, y: cy + 12, 'text-anchor': 'middle', 'font-size': 26 }, c.svg, '');
    var prises = [].slice.call(c.svg.querySelectorAll('.dv-prise'));
    nav(c, prises, function (i, oui) { marks[i].classList.toggle('vif', oui); centre.textContent = oui ? fr(d.v[i]) : ''; if (oui) c.dire({ sur: 'semaine ' + (i % 52 + 1) + ' · ' + (d.an0 + Math.floor(i / 52)), val: fr(d.v[i]) + (d.unite ? ' ' + d.unite : ''), txt: i >= 52 ? 'un an plus tôt : ' + fr(d.v[i - 52]) : '' }); });
  });

  /* 07 · la frise de travail (Gantt léger) : gantt(el, { fin, aujourdhui, pas, unite, lignes: [{ nom, d, f, deduit, jalon, apres }] }) */
  forme('gantt', function (el, d, o) {
    var hr = 30, c = base(el, { h: d.lignes.length * hr + 44, lu: o.lu, repos: o.repos, nom: o.nom }, 0), M = { l: 170, r: 14, t: 30 }, X = lin(0, d.fin, M.l, c.W - M.r), marks = [], deps = [], noms = [];
    for (var s = 0; s <= d.fin; s += d.pas || 4) { S('line', { class: 'dv-grille-l', x1: X(s), y1: M.t - 6, x2: X(s), y2: c.H - 6 }, c.svg); S('text', { x: X(s) + 5, y: 12 }, c.svg, (d.unite || 's.') + ' ' + s); }
    d.lignes.forEach(function (l, k) {
      var y = M.t + k * hr + hr / 2, g = S('g', { role: 'img', 'aria-label': l.nom + (l.jalon ? ', jalon, ' : ', de ' + l.d + ' à ' + l.f + ', ') + (l.deduit ? 'déduit' : '') }, c.svg);
      S('rect', { x: M.l, y: y - hr / 2, width: c.W - M.l - M.r, height: hr, fill: 'transparent' }, g);
      if (l.apres !== undefined) { var p = d.lignes[l.apres], py = M.t + l.apres * hr + hr / 2, px = X(p.jalon ? p.d : p.f); deps.push(S('path', { class: 'dv-t tirets', opacity: 0, d: 'M' + px + ' ' + py + 'L' + (px + 9) + ' ' + py + 'L' + (px + 9) + ' ' + y + 'L' + (X(l.d) - 3) + ' ' + y }, c.svg)); } else deps.push(null);
      if (l.jalon) S('rect', { class: l.deduit ? 'dv-ded-c' : 'dv-f dv-f5', x: X(l.d) - 5, y: y - 5, width: 10, height: 10, transform: 'rotate(45 ' + X(l.d) + ' ' + y + ')' }, g);
      else if (l.deduit) S('line', { class: 'dv-t ded', x1: X(l.d), y1: y, x2: X(l.f), y2: y, 'stroke-width': 2.5 }, g);
      else { var fait = borne(d.aujourdhui, l.d, l.f); if (fait > l.d) S('rect', { class: 'dv-f dv-f5', x: X(l.d), y: y - 2.5, width: X(fait) - X(l.d), height: 5 }, g); if (fait < l.f) S('rect', { class: 'dv-f dv-f3', x: X(fait), y: y - 2.5, width: X(l.f) - X(fait), height: 5 }, g); }
      noms.push(S('text', { class: 'dv-nomtxt dv-e' + (l.deduit ? ' it' : ''), x: 0, y: y + 5 }, c.svg, l.nom)); marks.push(g);
    });
    var xa = X(d.aujourdhui); S('line', { class: 'dv-t tenu', x1: xa, y1: M.t - 8, x2: xa, y2: c.H - 6, 'stroke-width': 1 }, c.svg); S('text', { class: 'tenu', x: xa + 6, y: M.t - 4 }, c.svg, 'aujourd’hui');
    nav(c, marks, function (k, oui) {
      var l = d.lignes[k]; marks[k].querySelectorAll('.dv-f,.dv-t').forEach(function (m) { m.classList.toggle('vif', oui); }); noms[k].classList.toggle('vif', oui); if (deps[k]) deps[k].setAttribute('opacity', oui ? 1 : 0);
      if (oui) c.dire({ x: X(l.jalon ? l.d : (l.d + l.f) / 2), y: M.t + k * hr - 22, sur: l.nom + (l.deduit ? ' · déduit' : ''), val: l.jalon ? (d.unite || 's.') + ' ' + l.d : fr(l.f - l.d) + ' sem.', txt: l.apres !== undefined ? 'après « ' + d.lignes[l.apres].nom + ' »' : l.jalon ? 'un jalon' : 'de ' + l.d + ' à ' + l.f });
    });
  });

  /* 08 · les petits multiples : multiples(el, { noms, series: [{ nom, v }], unite }, { colonnes }) : la même échelle partout, un seul viseur pour tous */
  forme('multiples', function (el, d, o) {
    var cols = o.colonnes || 4, ligs = Math.ceil(d.series.length / cols), hc = o.case || 96, c = base(el, { h: ligs * (hc + 30), lu: o.lu, repos: o.repos, nom: o.nom }, 0), n = d.noms.length, wc = (c.W - (cols - 1) * 34) / cols;
    var max = Math.max.apply(null, d.series.map(function (s) { return Math.max.apply(null, s.v); })), cases = [];
    d.series.forEach(function (s, k) {
      var x0 = (k % cols) * (wc + 34), y0 = Math.floor(k / cols) * (hc + 30), X = lin(0, n - 1, x0, x0 + wc), Y = lin(0, max, y0 + hc, y0 + 30), g = S('g', {}, c.svg);
      S('line', { class: 'dv-grille-l', x1: x0, y1: y0 + hc + .5, x2: x0 + wc, y2: y0 + hc + .5 }, g);
      var t = S('path', { class: 'dv-t fin' + (o.tenu === k ? ' tenu' : ''), d: douce(s.v.map(function (v, i) { return [X(i), Y(v)]; })) }, g), pt = S('circle', { class: 'dv-point', r: 3.5, opacity: 0 }, g);
      S('text', { class: 'dv-nomtxt', x: x0, y: y0 + 16 }, g, s.nom); var val = S('text', { class: 'dv-val', x: x0 + wc, y: y0 + 16, 'text-anchor': 'end' }, g, fr(s.v[n - 1]));
      var z = S('rect', { class: 'dv-zone', x: x0, y: y0, width: wc, height: hc, fill: 'transparent', tabindex: k ? -1 : 0, role: 'slider', 'aria-label': s.nom, 'aria-valuemin': 0, 'aria-valuemax': n - 1 }, g);
      cases.push({ X: X, Y: Y, t: t, pt: pt, val: val, z: z, s: s, x0: x0, wc: wc, y0: y0 });
    });
    var ici = -1;
    function va(k, i) {
      ici = i; cases.forEach(function (q, j) { var a = i < 0 ? n - 1 : i; q.val.textContent = fr(q.s.v[a]); q.pt.setAttribute('opacity', i < 0 ? 0 : 1); q.pt.setAttribute('cx', q.X(a)); q.pt.setAttribute('cy', q.Y(q.s.v[a])); q.t.classList.toggle('vif', j === k && i >= 0); });
      if (i >= 0) { var q = cases[k]; c.dire({ sur: q.s.nom + ' · ' + d.noms[i], val: fr(q.s.v[i]) + (d.unite ? ' ' + d.unite : ''), txt: 'toutes les cases lisent le même moment' }); } else c.taire();
    }
    cases.forEach(function (q, k) {
      q.z.addEventListener('pointermove', function (e) { var r = c.svg.getBoundingClientRect(), x = (e.clientX - r.left) * c.W / r.width; va(k, borne(Math.round((x - q.x0) / q.wc * (n - 1)), 0, n - 1)); });
      q.z.addEventListener('pointerleave', function () { if (document.activeElement !== q.z) va(k, -1); }); q.z.addEventListener('focus', function () { va(k, ici < 0 ? n - 1 : ici); }); q.z.addEventListener('blur', function () { va(k, -1); });
      q.z.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') va(k, borne(ici + 1, 0, n - 1)); else if (e.key === 'ArrowLeft') va(k, borne(ici - 1, 0, n - 1)); else if (e.key === 'ArrowDown' && cases[k + 1]) cases[k + 1].z.focus(); else if (e.key === 'ArrowUp' && cases[k - 1]) cases[k - 1].z.focus(); else if (e.key === 'Escape') q.z.blur(); else return; e.preventDefault();
      });
    });
  });

  /* ════════ LA COMPARAISON ════════ */

  /* 09 · les barres fines : barres(el, { lignes: [{ nom, v, deduit, inconnu }], unite }, { tris: true }) : le tri se change d'un mot */
  forme('barres', function (el, d, o) {
    var hr = 34, filtres = null;
    if (o.tris) { filtres = H('div', { class: 'dv-filtres', role: 'group', 'aria-label': 'Ranger' }); }
    var c = base(el, { h: d.lignes.length * hr + 6, lu: o.lu, repos: o.repos, nom: o.nom }, 0), hach = c.hachures(), M = { l: Math.min(190, c.W * .34), r: 90 }, max = Math.max.apply(null, d.lignes.map(function (l) { return l.v || 0; })), X = lin(0, max, M.l, c.W - M.r), rangs = [], marks = [];
    d.lignes.forEach(function (l, k) {
      var g = S('g', { class: 'dv-rang', role: 'img', 'aria-label': l.nom + ' : ' + (l.inconnu ? 'on ne sait pas' : fr(l.v) + (l.deduit ? ', déduit' : '')) }, c.svg);
      S('rect', { x: 0, y: 0, width: c.W, height: hr, fill: 'transparent' }, g); S('line', { class: 'dv-grille-l', x1: 0, y1: hr - .5, x2: c.W, y2: hr - .5 }, g);
      var nom = S('text', { class: 'dv-nomtxt dv-e' + (o.tenu === k ? ' tenu' : '') + (l.inconnu ? ' it' : ''), x: 0, y: hr / 2 + 5 }, g, l.nom), m;
      if (l.inconnu) { m = S('rect', { x: M.l, y: hr / 2 - 5, width: c.W - M.r - M.l, height: 10, fill: hach }, g); S('text', { class: 'dv-nomtxt it', x: c.W, y: hr / 2 + 5, 'text-anchor': 'end' }, g, 'on ne sait pas'); }
      else if (l.deduit) { m = S('line', { class: 'dv-t ded', x1: M.l, y1: hr / 2, x2: X(l.v), y2: hr / 2, 'stroke-width': 2.5 }, g); S('text', { class: 'dv-val dv-amb', x: X(l.v) + 10, y: hr / 2 + 5 }, g, fr(l.v) + ' · déduit'); }
      else { m = S('rect', { class: 'dv-f dv-f4' + (o.tenu === k ? ' tenu' : ''), x: M.l, y: hr / 2 - 1.5, width: Math.max(1, X(l.v) - M.l), height: 3 }, g); S('text', { class: 'dv-val', x: X(l.v) + 10, y: hr / 2 + 5 }, g, fr(l.v) + (d.unite && k === 0 ? ' ' + d.unite : '')); }
      rangs.push({ g: g, l: l, k: k, m: m, nom: nom }); marks.push(g);
    });
    function ranger(mode) { var t = rangs.slice(); if (mode === 'valeur') t.sort(function (a, b) { return (b.l.v || -1) - (a.l.v || -1); }); else if (mode === 'nom') t.sort(function (a, b) { return a.l.nom.localeCompare(b.l.nom, 'fr'); }); t.forEach(function (r, i) { r.i = i; r.g.style.transform = 'translateY(' + i * hr + 'px)'; }); c.taire(); }
    ranger(o.tri || 'valeur');
    if (filtres) {
      el.insertBefore(filtres, c.svg);
      [['valeur', 'du plus grand au plus petit'], ['nom', 'par nom'], ['ordre', 'dans l’ordre donné']].forEach(function (f) { var b = H('button', { type: 'button', 'aria-pressed': String((o.tri || 'valeur') === f[0]) }, filtres, f[1]); b.addEventListener('click', function () { o.tri = f[0]; [].forEach.call(filtres.children, function (x) { x.setAttribute('aria-pressed', String(x === b)); }); ranger(f[0]); }); });
    }
    nav(c, marks, function (k, oui) { var r = rangs[k]; if (r.m.classList.contains('dv-f') || r.m.classList.contains('dv-t')) r.m.classList.toggle('vif', oui); r.nom.classList.toggle('vif', oui); var xf = r.l.inconnu ? c.W : X(r.l.v) + (r.l.deduit ? 110 : 70); if (oui) c.dire({ boite: { x0: xf, y0: r.i * hr, x1: xf, y1: r.i * hr + hr }, cotes: ['droite', 'dessous', 'dessus'], sur: r.l.nom + (r.l.deduit ? ' · déduit' : ''), val: r.l.inconnu ? 'on ne sait pas' : fr(r.l.v) + (d.unite ? ' ' + d.unite : ''), txt: r.l.inconnu ? 'aucune mesure' : fr(r.l.v / max * 100) + ' pour cent du plus grand' }); });
  });

  /* 10 · les haltères : halteres(el, { noms: ['avant', 'après'], lignes: [{ nom, a, b }], unite }) */
  forme('halteres', function (el, d, o) {
    var hr = 32, c = base(el, { h: d.lignes.length * hr + 40, lu: o.lu, repos: o.repos, nom: o.nom }, 0), M = { l: Math.min(180, c.W * .32), r: 44, t: 30 }, tout = [].concat.apply([], d.lignes.map(function (l) { return [l.a, l.b]; })), cr = beaux(Math.min.apply(null, tout), Math.max.apply(null, tout), 4), X = lin(cr[0], cr[cr.length - 1], M.l, c.W - M.r), marks = [], els = [];
    cr.forEach(function (v) { S('line', { class: 'dv-grille-l', x1: X(v), y1: M.t - 6, x2: X(v), y2: c.H - 4 }, c.svg); S('text', { x: X(v), y: 12, 'text-anchor': 'middle' }, c.svg, fr(v)); });
    d.lignes.slice().sort(function (p, q) { return (q.b - q.a) - (p.b - p.a); }).forEach(function (l, k) {
      var y = M.t + k * hr + hr / 2, g = S('g', { role: 'img', 'aria-label': l.nom + ' : de ' + fr(l.a) + ' à ' + fr(l.b) }, c.svg); S('rect', { x: 0, y: y - hr / 2, width: c.W, height: hr, fill: 'transparent' }, g);
      var nom = S('text', { class: 'dv-nomtxt dv-e', x: 0, y: y + 5 }, g, l.nom), t = S('line', { class: 'dv-t fin', x1: X(l.a), y1: y, x2: X(l.b), y2: y }, g), a = S('circle', { class: 'dv-creux', cx: X(l.a), cy: y, r: 4.5 }, g), b = S('circle', { class: 'dv-f dv-f5', cx: X(l.b), cy: y, r: 5 }, g);
      S('text', { class: 'dv-val', x: X(l.b) + (l.b >= l.a ? 12 : -12), y: y + 5, 'text-anchor': l.b >= l.a ? 'start' : 'end' }, g, fr(l.b));
      marks.push(g); els.push({ l: l, nom: nom, t: t, a: a, b: b, y: y });
    });
    nav(c, marks, function (k, oui) { var e = els[k]; [e.t, e.a, e.b, e.nom].forEach(function (m) { m.classList.toggle('vif', oui); }); if (oui) c.dire({ x: Math.max(X(e.l.a), X(e.l.b)) + 40, y: e.y, sur: e.l.nom, val: (e.l.b >= e.l.a ? '+' : '') + fr(e.l.b - e.l.a) + (d.unite ? ' ' + d.unite : ''), txt: d.noms[0] + ' ' + fr(e.l.a) + ', ' + d.noms[1] + ' ' + fr(e.l.b) }); });
  });

  /* écarter des étiquettes qui se touchent : on les trie, on pousse */
  function ecarter(ys, min, y0, y1) { var o = ys.map(function (y, i) { return { y: y, i: i }; }).sort(function (a, b) { return a.y - b.y; }), k, pass; for (pass = 0; pass < 40; pass++) { for (k = 1; k < o.length; k++) if (o[k].y - o[k - 1].y < min) { var m = (min - (o[k].y - o[k - 1].y)) / 2; o[k].y += m; o[k - 1].y -= m; } o[0].y = Math.max(o[0].y, y0); o[o.length - 1].y = Math.min(o[o.length - 1].y, y1); } var r = []; o.forEach(function (q) { r[q.i] = q.y; }); return r; }

  /* 11 · les pentes : pentes(el, { noms: ['2024', '2026'], lignes: [{ nom, a, b }] }) */
  forme('pentes', function (el, d, o) {
    var c = base(el, o, 380), hach = c.hachures(), M = { t: 44, b: 16 }, xa = c.W * .34, xb = c.W * .66, tout = [].concat.apply([], d.lignes.map(function (l) { return [l.a, l.b]; })).filter(su), Y = lin(Math.min.apply(null, tout), Math.max.apply(null, tout), c.H - M.b - 8, M.t + 8);
    S('line', { class: 'dv-sol', x1: xa, y1: M.t - 8, x2: xa, y2: c.H - M.b }, c.svg); S('line', { class: 'dv-sol', x1: xb, y1: M.t - 8, x2: xb, y2: c.H - M.b }, c.svg);
    S('text', { class: 'dv-nomcap', x: xa, y: 16, 'text-anchor': 'middle' }, c.svg, d.noms[0]); S('text', { class: 'dv-nomcap', x: xb, y: 16, 'text-anchor': 'middle' }, c.svg, d.noms[1]);
    /* une ligne déduite : ambre, en pointillé ; une arrivée inconnue (b: null) : la pente s'arrête au milieu, des hachures à la place du point */
    var ym = (M.t + c.H - M.b) / 2, yB = function (l) { return su(l.b) ? Y(l.b) : ym; };
    var ya = ecarter(d.lignes.map(function (l) { return Y(l.a); }), 19, M.t, c.H - M.b), yb = ecarter(d.lignes.map(yB), 19, M.t, c.H - M.b), marks = [], els = [];
    d.lignes.forEach(function (l, k) {
      var inc = !su(l.b), g = S('g', { role: 'img', 'aria-label': l.nom + ' : de ' + fr(l.a) + (inc ? ', on ne sait pas où' : ' à ' + fr(l.b)) + (l.deduit ? ', déduit' : '') }, c.svg), cl = o.tenu === k ? ' tenu' : '';
      var x2 = inc ? (xa + xb) / 2 : xb, y2 = inc ? Y(l.a) : Y(l.b);
      var t = S('line', { class: 'dv-t ' + (l.deduit ? 'ded' : inc ? 'tirets' : 'fin') + cl, x1: xa, y1: Y(l.a), x2: x2, y2: y2 }, g); S('line', { class: 'dv-prise', x1: xa, y1: Y(l.a), x2: x2, y2: y2, 'stroke-width': 14 }, g);
      S('circle', { class: 'dv-f dv-f5' + cl, cx: xa, cy: Y(l.a), r: 3 }, g);
      if (inc) S('rect', { class: 'dv-trou', x: x2, y: y2 - 6, width: xb - x2, height: 12, fill: hach }, g); else S('circle', { class: l.deduit ? 'dv-ded-c dv-f' : 'dv-f dv-f5' + cl, cx: xb, cy: Y(l.b), r: 3 }, g);
      var ta = S('text', { class: 'dv-nomtxt dv-e' + cl, x: xa - 14, y: ya[k] + 5, 'text-anchor': 'end' }, g, l.nom + '  ' + fr(l.a)), tb = S('text', { class: 'dv-nomtxt dv-e' + cl + (inc ? ' it' : l.deduit ? ' dv-amb' : ''), x: xb + 14, y: yb[k] + 5 }, g, (inc ? '?' : fr(l.b) + (l.deduit ? ' déduit' : '')) + '  ' + l.nom);
      marks.push(g); els.push({ t: t, ta: ta, tb: tb, l: l, g: g });
    });
    nav(c, marks, function (k, oui) { var e = els[k], inc = !su(e.l.b); e.g.querySelectorAll('.dv-t,.dv-f,text').forEach(function (m) { m.classList.toggle('vif', oui); }); c.el.classList.toggle('estompe', oui); if (oui) c.dire({ sur: e.l.nom + (e.l.deduit ? ' · déduit' : ''), val: inc ? 'on ne sait pas' : (e.l.b >= e.l.a ? '+' : '') + fr(e.l.b - e.l.a), txt: inc ? 'parti de ' + fr(e.l.a) + ', pas encore mesuré' : 'de ' + fr(e.l.a) + ' à ' + fr(e.l.b) }); });
  });

  /* 12 · le classement qui bouge : classement(el, { noms, series: [{ nom, rangs }] }) */
  forme('classement', function (el, d, o) {
    var ns = d.series.length, c = base(el, { h: o.h || ns * 30 + 46, lu: o.lu, repos: o.repos, nom: o.nom }, 0), M = { l: 150, r: 150, t: 34, b: 12 }, n = d.noms.length, X = lin(0, n - 1, M.l, c.W - M.r), Y = lin(1, ns, M.t, c.H - M.b), marks = [];
    d.noms.forEach(function (t, i) { S('text', { x: X(i), y: 12, 'text-anchor': 'middle' }, c.svg, t); });
    d.series.forEach(function (s, k) {
      var g = S('g', { role: 'img', 'aria-label': s.nom + ' : du rang ' + s.rangs[0] + ' au rang ' + s.rangs[n - 1] }, c.svg), cl = o.tenu === k ? ' tenu' : '', dd = '', i, mx, fin = s.deduitDepuis === undefined ? n - 1 : s.deduitDepuis;
      /* un rang inconnu (null) : la ligne s'interrompt ; à partir de deduitDepuis, la suite est déduite (ambre, pointillé) */
      function bout(a, b) { var p = 'M' + X(a) + ' ' + Y(s.rangs[a]); for (var q = a + 1; q <= b; q++) { var m2 = (X(q - 1) + X(q)) / 2; p += 'C' + m2 + ' ' + Y(s.rangs[q - 1]) + ' ' + m2 + ' ' + Y(s.rangs[q]) + ' ' + X(q) + ' ' + Y(s.rangs[q]); } return p; }
      suites(s.rangs, 0, fin).forEach(function (r) { if (r[1] > r[0]) dd += bout(r[0], r[1]); });
      if (fin < n - 1) suites(s.rangs, fin, n - 1).forEach(function (r) { if (r[1] > r[0]) S('path', { class: 'dv-t ded', d: bout(r[0], r[1]) }, g); });
      suites(s.rangs, 0, n - 1, true).forEach(function (t) { var a = Math.max(0, t[0] - 1), b = Math.min(n - 1, t[1] + 1); if (su(s.rangs[a]) && su(s.rangs[b])) S('path', { class: 'dv-t tirets', d: 'M' + X(a) + ' ' + Y(s.rangs[a]) + 'L' + X(b) + ' ' + Y(s.rangs[b]), style: 'opacity:.5' }, g); S('text', { class: 'dv-nomtxt it', x: X(t[0]), y: Y(su(s.rangs[a]) ? s.rangs[a] : 1) - 8, 'text-anchor': 'middle', 'font-size': 12 }, g, '?'); });
      S('path', { class: 'dv-t fin' + cl, d: dd || 'M0 0' }, g); S('path', { class: 'dv-prise', d: dd || 'M0 0', 'stroke-width': 16 }, g);
      s.rangs.forEach(function (r, i2) { if (su(r)) S('circle', { class: (i2 > fin ? 'dv-ded-c' : 'dv-creux') + (cl ? ' vif' : ''), cx: X(i2), cy: Y(r), r: 3.5 }, g); });
      S('text', { class: 'dv-nomtxt dv-e' + cl, x: M.l - 16, y: Y(s.rangs[0]) + 5, 'text-anchor': 'end' }, g, s.nom); S('text', { class: 'dv-nomtxt dv-e' + cl, x: c.W - M.r + 16, y: Y(s.rangs[n - 1]) + 5 }, g, s.rangs[n - 1] + '  ' + s.nom);
      marks.push(g);
    });
    nav(c, marks, function (k, oui) { var s = d.series[k]; marks[k].querySelectorAll('.dv-t,.dv-creux,text').forEach(function (m) { m.classList.toggle('vif', oui); }); marks[k].classList.toggle('vif', oui); c.el.classList.toggle('estompe', oui); if (oui) { c.svg.appendChild(marks[k]); var e = s.rangs[0] - s.rangs[n - 1]; c.dire({ sur: s.nom, val: e === 0 ? 'même rang' : (e > 0 ? 'gagne ' : 'perd ') + Math.abs(e) + (Math.abs(e) > 1 ? ' rangs' : ' rang'), txt: 'du rang ' + s.rangs[0] + ' au rang ' + s.rangs[n - 1] + ', au mieux ' + Math.min.apply(null, s.rangs) }); } });
  });

  /* 13 · l'essaim : essaim(el, { points: [{ nom, v }], unite }) : chaque point est une chose, aucun ne cache l'autre */
  forme('essaim', function (el, d, o) {
    var c = base(el, o, 230), M = { l: 14, r: 14, b: 34 }, r = o.r || 4.5, vs = d.points.map(function (p) { return p.v; }), cr = beaux(Math.min.apply(null, vs), Math.max.apply(null, vs), 6), X = lin(cr[0], cr[cr.length - 1], M.l, c.W - M.r), mil = (c.H - M.b) / 2, poses = [], marks = [];
    var tri = d.points.map(function (p, i) { return { p: p, i: i, x: X(p.v) }; }).sort(function (a, b) { return a.x - b.x; });
    tri.forEach(function (q) { var k = 0, y, ok; for (; ;) { y = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * (r * 1.05); ok = poses.every(function (z) { return Math.pow(z.x - q.x, 2) + Math.pow(z.y - y, 2) >= Math.pow(2 * r + 1, 2); }); if (ok) break; k++; } q.y = y; poses.push(q); });
    axeX(c, c.H - M.b, M.l, c.W - M.r, cr.map(function (v) { return { x: X(v), t: fr(v) }; }));
    var med = quantile(vs.slice().sort(function (a, b) { return a - b; }), .5); S('line', { class: 'dv-t tirets', x1: X(med), y1: 16, x2: X(med), y2: c.H - M.b }, c.svg); S('text', { x: X(med) + 6, y: 12 }, c.svg, 'médiane ' + fr(med));
    tri.forEach(function (q) { marks.push(S('circle', { class: 'dv-f ' + (q.p.inconnu ? 'dv-creux' : q.p.deduit ? 'dv-ded-c' : 'dv-f4') + (o.tenu === q.i ? ' tenu' : ''), cx: q.x, cy: mil + q.y, r: r, role: 'img', 'aria-label': q.p.nom + ' : ' + fr(q.p.v) }, c.svg)); });
    nav(c, marks, function (k, oui) { marks[k].classList.toggle('vif', oui); if (oui) c.dire({ x: tri[k].x, y: mil + tri[k].y - 34, sur: tri[k].p.nom, val: fr(tri[k].p.v) + (d.unite ? ' ' + d.unite : ''), txt: tri[k].p.v >= med ? 'au-dessus de la médiane' : 'sous la médiane' }); });
  });

  /* 14 · le nuage à deux mesures, avec ses marges : nuage(el, { points: [{ nom, x, y }], x: 'nom', y: 'nom' }) */
  forme('nuage', function (el, d, o) {
    var c = base(el, o, 400), M = { l: 54, r: 46, t: 46, b: 40 }, xs = d.points.map(function (p) { return p.x; }), ys = d.points.map(function (p) { return p.y; }), cx = beaux(Math.min.apply(null, xs), Math.max.apply(null, xs), 5), cy = beaux(Math.min.apply(null, ys), Math.max.apply(null, ys), 4);
    var X = lin(cx[0], cx[cx.length - 1], M.l, c.W - M.r), Y = lin(cy[0], cy[cy.length - 1], c.H - M.b, M.t), marks = [];
    axeY(c, M.l, c.W - M.r, cy.map(function (v) { return { y: Y(v), t: fr(v) }; })); axeX(c, c.H - M.b, M.l, c.W - M.r, cx.map(function (v) { return { x: X(v), t: fr(v) }; }));
    S('text', { class: 'dv-nomtxt it', x: c.W - M.r, y: c.H - 4, 'text-anchor': 'end' }, c.svg, d.x + ' →'); S('text', { class: 'dv-nomtxt it', x: 0, y: 14 }, c.svg, '↑ ' + d.y);
    /* les marges : un trait par chose, en haut et à droite */
    d.points.forEach(function (p) { S('line', { class: 'dv-t pale', x1: X(p.x), y1: M.t - 20, x2: X(p.x), y2: M.t - 10 }, c.svg); S('line', { class: 'dv-t pale', x1: c.W - M.r + 10, y1: Y(p.y), x2: c.W - M.r + 20, y2: Y(p.y) }, c.svg); });
    var vh = S('line', { class: 'dv-vl' }, c.svg), vv = S('line', { class: 'dv-vl' }, c.svg);
    var ordre = d.points.map(function (p, i) { return i; }).sort(function (a, b) { return d.points[a].x - d.points[b].x; });
    ordre.forEach(function (i) { var p = d.points[i]; marks.push(S('circle', { class: 'dv-f ' + (p.deduit ? 'dv-ded-c' : 'dv-f4') + (o.tenu === i ? ' tenu' : ''), cx: X(p.x), cy: Y(p.y), r: 4.5, role: 'img', 'aria-label': p.nom + ' : ' + fr(p.x) + ', ' + fr(p.y) }, c.svg)); if (p.dit) { S('line', { class: 'dv-filet', x1: X(p.x) + 5, y1: Y(p.y) - 5, x2: X(p.x) + 18, y2: Y(p.y) - 18 }, c.svg); S('text', { class: 'dv-nomtxt it', x: X(p.x) + 22, y: Y(p.y) - 20 }, c.svg, p.nom); } });
    nav(c, marks, function (k, oui) { var p = d.points[ordre[k]]; marks[k].classList.toggle('vif', oui); c.el.classList.toggle('vise', oui); if (oui) { vh.setAttribute('x1', M.l); vh.setAttribute('x2', X(p.x)); vh.setAttribute('y1', Y(p.y)); vh.setAttribute('y2', Y(p.y)); vv.setAttribute('x1', X(p.x)); vv.setAttribute('x2', X(p.x)); vv.setAttribute('y1', Y(p.y)); vv.setAttribute('y2', c.H - M.b); c.dire({ boite: { x0: X(p.x) - 6, y0: Y(p.y) - 6, x1: X(p.x) + 6, y1: Y(p.y) + 6 }, sur: p.nom + (p.deduit ? ' · déduit' : ''), val: fr(p.x) + ' · ' + fr(p.y), txt: d.x + ', ' + d.y }); } }, { pos: ordre.map(function (i) { return [X(d.points[i].x), Y(d.points[i].y)]; }) });
  });

  /* 15 · les coordonnées parallèles : paralleles(el, { axes: [{ nom, min, max }], lignes: [{ nom, v }] }) */
  forme('paralleles', function (el, d, o) {
    var c = base(el, o, 330), M = { l: 30, r: 30, t: 46, b: 30 }, na = d.axes.length, X = lin(0, na - 1, M.l, c.W - M.r), Ys = d.axes.map(function (a) { return lin(a.min, a.max, c.H - M.b, M.t); }), marks = [], vals = [];
    d.axes.forEach(function (a, k) { S('line', { class: 'dv-sol', x1: X(k), y1: M.t, x2: X(k), y2: c.H - M.b }, c.svg); S('text', { class: 'dv-nomcap', x: X(k), y: 14, 'text-anchor': k === 0 ? 'start' : k === na - 1 ? 'end' : 'middle' }, c.svg, a.nom); S('text', { x: X(k) + (k === na - 1 ? -8 : 8), y: M.t + 4, 'text-anchor': k === na - 1 ? 'end' : 'start' }, c.svg, fr(a.max)); S('text', { x: X(k) + (k === na - 1 ? -8 : 8), y: c.H - M.b, 'text-anchor': k === na - 1 ? 'end' : 'start' }, c.svg, fr(a.min)); vals.push(S('text', { class: 'dv-val', x: X(k), y: c.H - 6, 'text-anchor': k === 0 ? 'start' : k === na - 1 ? 'end' : 'middle' }, c.svg, '')); });
    d.lignes.forEach(function (l, i) { var pts = l.v.map(function (v, k) { return [X(k), Ys[k](v)]; }), g = S('g', { role: 'img', 'aria-label': l.nom + ' : ' + l.v.map(function (v, k) { return d.axes[k].nom + ' ' + fr(v); }).join(', ') }, c.svg); S('path', { class: 'dv-t pale' + (o.tenu === i ? ' tenu' : ''), d: brise(pts), style: 'stroke-opacity:.7' }, g); S('path', { class: 'dv-prise', d: brise(pts), 'stroke-width': 10 }, g); marks.push(g); });
    nav(c, marks, function (i, oui) { var l = d.lignes[i]; marks[i].firstChild.classList.toggle('vif', oui); if (oui) c.svg.insertBefore(marks[i], vals[0]); vals.forEach(function (t, k) { t.textContent = oui ? fr(l.v[k]) : ''; }); if (oui) c.dire({ sur: l.nom, val: '', txt: l.v.map(function (v, k) { return d.axes[k].nom + ' ' + fr(v); }).join(' · ') }); });
  });

  /* 16 · le radar en fil : radar(el, { axes: [noms], max, profils: [{ nom, v, style: '' | 'tirets' | 'ded' }] }) : aucun aplat */
  forme('radar', function (el, d, o) {
    var c = base(el, o, 380), hach = c.hachures(), cx = c.W / 2, cy = c.H / 2 + 6, R = Math.min(c.W / 2 - 110, c.H / 2 - 38), n = d.axes.length, marks = [], infos = [];
    function pt(k, v) { return polaire(cx, cy, R * v / d.max, k / n * 2 * Math.PI - Math.PI / 2); }
    [1 / 3, 2 / 3, 1].forEach(function (f) { S('path', { class: 'dv-grille-l', d: brise(d.axes.map(function (_, k) { return pt(k, d.max * f); })) + 'Z' }, c.svg); });
    d.axes.forEach(function (a, k) { var p = pt(k, d.max), q = pt(k, d.max * 1.13); S('line', { class: 'dv-grille-l', x1: cx, y1: cy, x2: p[0], y2: p[1] }, c.svg); S('text', { class: 'dv-nomtxt', x: q[0], y: q[1] + 5, 'text-anchor': Math.abs(q[0] - cx) < 8 ? 'middle' : q[0] > cx ? 'start' : 'end' }, c.svg, a); });
    d.profils.forEach(function (p, j) {
      /* une mesure inconnue (null) : le fil s'interrompt de part et d'autre ; à sa place, un rond creux hachuré au centre de l'axe */
      var trou = p.v.some(function (v) { return !su(v); });
      if (!trou) S('path', { class: 'dv-t ' + (p.style || '') + (o.tenu === j ? ' tenu' : ''), d: brise(p.v.map(function (v, k) { return pt(k, v); })) + 'Z' }, c.svg);
      else p.v.forEach(function (v, k) { var w = p.v[(k + 1) % n]; if (su(v) && su(w)) S('path', { class: 'dv-t ' + (p.style || '') + (o.tenu === j ? ' tenu' : ''), d: brise([pt(k, v), pt((k + 1) % n, w)]) }, c.svg); });
      p.v.forEach(function (v, k) { if (!su(v)) { var z = pt(k, d.max / 2), cr = S('circle', { class: 'dv-f dv-inc-m', cx: z[0], cy: z[1], r: 6, style: 'fill:' + hach, role: 'img', 'aria-label': p.nom + ', ' + d.axes[k] + ' : on ne sait pas' }, c.svg); marks.push(cr); infos.push({ p: p, k: k, v: null, q: z }); return; } var q = pt(k, v); marks.push(S('circle', { class: p.style === 'ded' ? 'dv-ded-c dv-f' : 'dv-f ' + (j ? 'dv-creux' : 'dv-f5'), cx: q[0], cy: q[1], r: 4, role: 'img', 'aria-label': p.nom + ', ' + d.axes[k] + ' : ' + fr(v) }, c.svg)); infos.push({ p: p, k: k, v: v, q: q }); });
    });
    nav(c, marks, function (i, oui) { var f = infos[i]; marks[i].classList.toggle('vif', oui); if (oui) c.dire({ x: f.q[0], y: f.q[1] - 36, sur: f.p.nom + ' · ' + d.axes[f.k] + (f.p.style === 'ded' ? ' · déduit' : ''), val: su(f.v) ? fr(f.v) : 'on ne sait pas', txt: su(f.v) ? 'sur ' + fr(d.max) : 'aucune mesure' }); });
  });
})();
