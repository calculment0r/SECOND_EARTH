/* KIT ÉTUDE · LA DATAVIZ EN DEUX DIMENSIONS — la suite : le tout et ses parts, les liens, la distribution, les pièces communes.
   Mêmes règles que dataviz.js (à charger avant). */
(function () {
  'use strict';
  var V = window.KitEtude.viz, U = V.outils, su = U.su, S = U.S, H = U.H, lin = U.lin, borne = U.borne, fr = U.fr, somme = U.somme, quantile = U.quantile, beaux = U.beaux, brise = U.brise, douce = U.douce, aire = U.aire, polaire = U.polaire, secteur = U.secteur, P = U.P, base = U.base, nav = U.nav, axeX = U.axeX, forme = U.forme;

  /* ════════ LE TOUT ET SES PARTS ════════ */

  /* ranger des rectangles au plus carré (squarify) */
  function carres(items, x, y, w, h) {
    var out = [], rest = items.slice().sort(function (a, b) { return b.v - a.v; }), tot = somme(rest.map(function (d) { return d.v; }));
    while (rest.length) {
      var court = Math.min(w, h), k = w * h / tot, row = [], sum = 0, best = Infinity, d, s2, cote, pire, i;
      for (; ;) { d = rest[row.length]; if (!d) break; s2 = sum + d.v; cote = s2 * k / court; pire = 0; for (i = 0; i <= row.length; i++) { var a = (i < row.length ? row[i].v : d.v) * k / cote; pire = Math.max(pire, cote / a, a / cote); } if (pire > best) break; best = pire; row.push(d); sum = s2; }
      cote = sum * k / court; var off = 0; row.forEach(function (q) { var len = q.v * k / cote; out.push(w >= h ? { d: q, x: x, y: y + off, w: cote, h: len } : { d: q, x: x + off, y: y, w: len, h: cote }); off += len; });
      if (w >= h) { x += cote; w -= cote; } else { y += cote; h -= cote; } tot -= sum; rest = rest.slice(row.length);
    }
    return out;
  }
  /* 17 · la mosaïque : mosaique(el, { groupes: [{ nom, enfants: [{ nom, v, inconnu }] }], unite }) : des joints, pas de cadres */
  forme('mosaique', function (el, d, o) {
    var c = base(el, o, 400), hach = c.hachures(), tot = 0, marks = [], infos = [], tons = ['dv-f3', 'dv-f2', 'dv-f1', 'dv-f2'];
    var gs = d.groupes.map(function (g, i) { var v = somme(g.enfants.map(function (e) { return e.v; })); tot += v; return { g: g, v: v, i: i }; });
    carres(gs, 0, 0, c.W, c.H).forEach(function (R) {
      S('text', { class: 'dv-nomcap', x: R.x + 2, y: R.y + 14 }, c.svg, R.d.g.nom);
      carres(R.d.g.enfants, R.x, R.y + 22, R.w - 3, R.h - 25).forEach(function (r) {
        var g = S('g', { role: 'img', 'aria-label': r.d.nom + ', ' + R.d.g.nom + ' : ' + fr(r.d.v) }, c.svg), w = Math.max(1, r.w - 2), h = Math.max(1, r.h - 2);
        var m = S('rect', { class: 'dv-f ' + (r.d.inconnu ? '' : tons[R.d.i % tons.length]), x: r.x, y: r.y, width: w, height: h, fill: r.d.inconnu ? hach : null }, g), t1 = null, t2 = null;
        if (w > 74 && h > 44) { t1 = S('text', { class: 'dv-nomtxt dv-encre', x: r.x + 10, y: r.y + 22, 'pointer-events': 'none' }, g, r.d.nom); t2 = S('text', { class: 'dv-val', x: r.x + 10, y: r.y + 42, 'pointer-events': 'none', 'font-size': w > 150 && h > 80 ? 26 : 15, dy: w > 150 && h > 80 ? 10 : 0 }, g, fr(r.d.v)); }
        marks.push(g); infos.push({ m: m, r: r, grp: R.d.g, t: [t1, t2] });
      });
    });
    nav(c, marks, function (i, oui) { var f = infos[i]; if (!f.r.d.inconnu) f.m.classList.toggle('vif', oui); f.t.forEach(function (t) { if (t) t.style.fill = oui && !f.r.d.inconnu ? 'var(--on-or)' : ''; }); if (oui) c.dire({ boite: { x0: f.r.x, y0: f.r.y, x1: f.r.x + f.r.w, y1: f.r.y + f.r.h }, sur: f.grp.nom + ' · ' + f.r.d.nom, val: fr(f.r.d.v) + (d.unite ? ' ' + d.unite : ''), txt: f.r.d.inconnu ? 'une estimation : on ne sait pas' : 'sur ' + fr(tot) + ' en tout' }); }, { pos: infos.map(function (f) { return [f.r.x + f.r.w / 2, f.r.y + f.r.h / 2]; }) });
  });

  /* 18 · le soleil : soleil(el, { groupes: [{ nom, enfants: [{ nom, v }] }], unite }) : deux anneaux, le nombre au centre */
  forme('soleil', function (el, d, o) {
    var c = base(el, o, 400), cx = c.W / 2, cy = c.H / 2, R = Math.min(c.W, c.H) / 2 - 8, tot = somme(d.groupes.map(function (g) { return somme(g.enfants.map(function (e) { return e.v; })); })), a = -Math.PI / 2, marks = [], infos = [], pad = .012;
    var gros = S('text', { class: 'dv-grand', x: cx, y: cy + 8, 'text-anchor': 'middle' }, c.svg, fr(tot)), petit = S('text', { x: cx, y: cy + 30, 'text-anchor': 'middle' }, c.svg, (d.unite ? d.unite + ' ' : '') + 'en tout');
    d.groupes.forEach(function (g, gi) {
      var vg = somme(g.enfants.map(function (e) { return e.v; })), ag = vg / tot * 2 * Math.PI, a0 = a;
      var m = S('path', { class: 'dv-f dv-f4', d: secteur(cx, cy, R * .46, R * .68, a0 + pad, a0 + ag - pad), role: 'img', 'aria-label': g.nom + ' : ' + fr(vg) }, c.svg); marks.push(m); infos.push({ nom: g.nom, v: vg, sur: 'le groupe', g: gi });
      var am = a0 + ag / 2, q = polaire(cx, cy, R * .57, am); if (ag * R * .57 > g.nom.length * 10.5 + 12) S('text', { class: 'dv-nomcap', x: q[0], y: q[1] + 4, 'text-anchor': 'middle', 'pointer-events': 'none', style: 'fill:var(--bg)' }, c.svg, g.nom);
      g.enfants.forEach(function (e, k) { var ae = e.v / tot * 2 * Math.PI, me = S('path', { class: 'dv-f ' + (k % 2 ? 'dv-f2' : 'dv-f3'), d: secteur(cx, cy, R * .71, R, a + pad / 2, a + ae - pad / 2), role: 'img', 'aria-label': e.nom + ', ' + g.nom + ' : ' + fr(e.v) }, c.svg); marks.push(me); infos.push({ nom: e.nom, v: e.v, sur: g.nom, g: gi }); a += ae; });
    });
    nav(c, marks, function (i, oui) { var f = infos[i]; marks[i].classList.toggle('vif', oui); gros.textContent = fr(oui ? f.v : tot); petit.textContent = oui ? f.nom : (d.unite ? d.unite + ' ' : '') + 'en tout'; if (oui) c.dire({ sur: f.sur + ' · ' + f.nom, val: fr(f.v) + (d.unite ? ' ' + d.unite : ''), txt: 'sur ' + fr(tot) }); });
  });

  /* 19 · la gaufre : gaufre(el, { parts: [{ nom, n, inconnu, deduit }] }) : cent cases, une case = une chose sur cent */
  forme('gaufre', function (el, d, o) {
    var c = base(el, o, 250), hach = c.hachures(), pas = Math.min(24, (c.H - 6) / 10), cote = pas - 4, k = 0, tons = ['dv-f5', 'dv-f3', 'dv-f2', 'dv-f1'], groupes = [], lignes = [], x1 = pas * 10 + 34;
    d.parts.forEach(function (p, pi) {
      var cases = [], i; for (i = 0; i < p.n; i++, k++) cases.push(S('rect', { class: p.deduit ? 'dv-ded-c dv-f' : 'dv-f ' + (p.inconnu ? '' : tons[pi % 4]), fill: p.inconnu ? hach : null, x: (k % 10) * pas, y: Math.floor(k / 10) * pas + 3, width: cote, height: cote }, c.svg));
      var y = 22 + pi * 46, g = S('g', { role: 'img', 'aria-label': p.nom + ' : ' + p.n + ' sur cent' }, c.svg); S('rect', { x: x1, y: y - 22, width: Math.max(10, c.W - x1), height: 44, fill: 'transparent' }, g);
      S('text', { class: 'dv-grand', x: x1, y: y + 12, 'font-size': 32 }, g, String(p.n)); lignes.push(S('text', { class: 'dv-nomtxt dv-e' + (p.inconnu ? ' it' : p.deduit ? ' dv-amb' : ''), x: x1 + 54, y: y + 8 }, g, p.nom));
      groupes.push({ cases: cases, g: g, p: p });
    });
    nav(c, groupes.map(function (q) { return q.g; }), function (i, oui) { var q = groupes[i]; if (!q.p.inconnu) q.cases.forEach(function (r) { r.classList.toggle('vif', oui); }); lignes[i].classList.toggle('vif', oui); c.el.classList.toggle('estompe', oui); groupes.forEach(function (z, j) { z.cases.forEach(function (r) { r.style.opacity = oui && j !== i ? .3 : ''; }); }); if (oui) c.dire({ sur: q.p.nom, val: q.p.n + ' sur cent', txt: q.p.inconnu ? 'on ne sait pas' : q.p.deduit ? 'déduit, à confirmer' : '' }); });
    groupes.forEach(function (q, i) { q.cases.forEach(function (r) { r.addEventListener('pointerenter', function () { q.g.dispatchEvent(new Event('pointerenter')); }); r.addEventListener('pointerleave', function () { q.g.dispatchEvent(new Event('pointerleave')); }); }); });
  });

  /* 20 · la barre découpée : barreDecoupee(el, { parts: [{ nom, v, inconnu, deduit }], unite }) : une seule barre, chaque part nommée contre elle */
  forme('barreDecoupee', function (el, d, o) {
    var c = base(el, o, 170), hach = c.hachures(), tot = somme(d.parts.map(function (p) { return p.v; })), x = 0, yb = 86, hb = 22, tons = ['dv-f5', 'dv-f4', 'dv-f3', 'dv-f2', 'dv-f1'], marks = [], infos = [];
    d.parts.forEach(function (p, i) {
      var w = p.v / tot * c.W, g = S('g', { role: 'img', 'aria-label': p.nom + ' : ' + fr(p.v) }, c.svg), haut = i % 2 === 0, xm = x + Math.min(w / 2, 14);
      var m = S('rect', { class: p.deduit ? 'dv-ded-c dv-f' : 'dv-f ' + (p.inconnu ? '' : tons[Math.min(i, 4)]) + (o.tenu === i && !p.inconnu ? ' tenu' : ''), fill: p.inconnu ? hach : null, x: x, y: yb, width: Math.max(1, w - 2), height: hb }, g);
      S('line', { class: 'dv-filet', x1: xm, y1: haut ? yb - 4 : yb + hb + 4, x2: xm, y2: haut ? yb - 30 : yb + hb + 30 }, g);
      var t = S('text', { class: 'dv-nomtxt dv-e' + (p.inconnu ? ' it' : '') + (o.tenu === i ? ' tenu' : ''), x: xm + 7, y: haut ? yb - 36 : yb + hb + 32 }, g, p.nom), tv = S('text', { class: 'dv-val' + (p.deduit ? ' dv-amb' : ''), x: xm + 7, y: haut ? yb - 16 : yb + hb + 52 }, g, p.inconnu ? '?' : fr(p.v));
      if (xm + 7 + p.nom.length * 7.6 > c.W) { t.setAttribute('text-anchor', 'end'); tv.setAttribute('text-anchor', 'end'); t.setAttribute('x', xm - 7); tv.setAttribute('x', xm - 7); }
      marks.push(g); infos.push({ m: m, t: t, p: p, x: x + w / 2 }); x += w;
    });
    nav(c, marks, function (i, oui) { var f = infos[i]; if (!f.p.inconnu) f.m.classList.toggle('vif', oui); f.t.classList.toggle('vif', oui); if (oui) c.dire({ sur: f.p.nom + (f.p.deduit ? ' · déduit' : ''), val: f.p.inconnu ? 'on ne sait pas' : fr(f.p.v) + (d.unite ? ' ' + d.unite : ''), txt: 'sur ' + fr(tot) + ' en tout' }); });
  });

  /* ════════ LES LIENS ════════ */

  /* 21 · les arcs : arcs(el, { noeuds: [noms], liens: [{ a, b, v, deduit }] }) : les nœuds sur une ligne, les liens au-dessus */
  forme('arcs', function (el, d, o) {
    var c = base(el, o, 330), M = { l: 24, r: 24, b: 96 }, n = d.noeuds.length, X = lin(0, n - 1, M.l, c.W - M.r), sol = c.H - M.b, vmax = Math.max.apply(null, d.liens.map(function (l) { return l.v || 1; })), arcs, noms = [], marks = [];
    S('line', { class: 'dv-sol', x1: M.l, y1: sol, x2: c.W - M.r, y2: sol }, c.svg);
    arcs = d.liens.map(function (l) { var x1 = X(Math.min(l.a, l.b)), x2 = X(Math.max(l.a, l.b)), r = (x2 - x1) / 2; return S('path', { class: 'dv-t ' + (l.deduit ? 'ded' : 'pale'), d: 'M' + x1 + ' ' + sol + 'A' + r + ' ' + Math.min(r, sol - 12) + ' 0 0 1 ' + x2 + ' ' + sol, 'stroke-width': l.deduit ? 1.6 : .8 + (l.v || 1) / vmax * 2.2 }, c.svg); });
    d.noeuds.forEach(function (nom, i) { var deg = d.liens.filter(function (l) { return l.a === i || l.b === i; }).length, g = S('g', { role: 'img', 'aria-label': nom + ' : ' + deg + ' liens' }, c.svg); S('circle', { cx: X(i), cy: sol, r: 13, fill: 'transparent' }, g); S('circle', { class: 'dv-f dv-f5' + (o.tenu === i ? ' tenu' : ''), cx: X(i), cy: sol, r: 2.5 + Math.min(4, deg) }, g); noms.push(S('text', { class: 'dv-nomtxt dv-e', x: X(i), y: sol + 22, transform: 'rotate(38 ' + X(i) + ' ' + (sol + 22) + ')' }, g, nom)); marks.push(g); });
    nav(c, marks, function (i, oui) {
      var lies = {}; d.liens.forEach(function (l, k) { var mien = l.a === i || l.b === i; arcs[k].classList.toggle('vif', oui && mien); arcs[k].style.opacity = oui && !mien ? .25 : ''; if (mien) lies[l.a === i ? l.b : l.a] = 1; });
      noms.forEach(function (t, k) { t.classList.toggle('vif', oui && (k === i || lies[k])); }); marks[i].querySelector('.dv-f').classList.toggle('vif', oui);
      if (oui) c.dire({ sur: d.noeuds[i], val: Object.keys(lies).length + (Object.keys(lies).length > 1 ? ' liens' : ' lien'), txt: 'avec ' + Object.keys(lies).map(function (k) { return d.noeuds[k]; }).join(', ') });
    });
  });

  /* 22 · les accords : accords(el, { noms, m: [[…]], deduits: [[i, j]], inconnus: [i] }, { marge }) : qui échange avec qui.
     Au repos, l'arc extérieur porte le poids ; les échanges ne sont qu'un fil pâle. Sous la main, les rubans du nom visé sortent, les autres s'effacent. */
  forme('accords', function (el, d, o) {
    var c = base(el, o, 420), hach = c.hachures(), marge = o.marge === undefined ? 110 : o.marge, cx = c.W / 2, cy = c.H / 2, R = Math.max(30, Math.min(c.W / 2 - marge, c.H / 2 - (o.marge === undefined ? 26 : 6))), n = d.noms.length;
    var tot = somme(d.m.map(somme)), pad = .045, a = -Math.PI / 2, K = (2 * Math.PI - pad * n) / tot, sub = [], grp = [], liens = [], marks = [], noms = [], vmax = 0, ded = {}, inc = {};
    (d.deduits || []).forEach(function (p) { ded[Math.min(p[0], p[1]) + '-' + Math.max(p[0], p[1])] = 1; }); (d.inconnus || []).forEach(function (i) { inc[i] = 1; });
    d.m.forEach(function (ligne, i) { var a0 = a; sub[i] = []; ligne.forEach(function (v, j) { sub[i][j] = [a, a + v * K]; a += v * K; }); grp[i] = [a0, a]; a += pad; });
    var r = R - 12;
    function ruban(i, j) { var s1 = sub[i][j], t = sub[j][i], A = polaire(cx, cy, r, s1[0]), B = polaire(cx, cy, r, s1[1]), C = polaire(cx, cy, r, t[0]), D = polaire(cx, cy, r, t[1]); return 'M' + P(A) + 'A' + r + ' ' + r + ' 0 0 1 ' + P(B) + 'Q' + cx + ' ' + cy + ' ' + P(C) + 'A' + r + ' ' + r + ' 0 0 1 ' + P(D) + 'Q' + cx + ' ' + cy + ' ' + P(A) + 'Z'; }
    function fil(i, j) { var s1 = sub[i][j], t = sub[j][i], A = polaire(cx, cy, r, (s1[0] + s1[1]) / 2), C = polaire(cx, cy, r, (t[0] + t[1]) / 2); return 'M' + P(A) + 'Q' + cx + ' ' + cy + ' ' + P(C); }
    for (var i = 0; i < n; i++) for (var j = i; j < n; j++) { var v = d.m[i][j] + d.m[j][i]; if (v > 0) { vmax = Math.max(vmax, v); liens.push({ i: i, j: j, v: v, ded: !!ded[i + '-' + j] }); } }
    var gR = S('g', { class: 'dv-rubans' }, c.svg), gF = S('g', { class: 'dv-fils' }, c.svg);
    liens.forEach(function (l) {
      l.p = S('path', { class: 'dv-ruban' + (l.ded ? ' ded' : ''), d: ruban(l.i, l.j) }, gR);
      l.f = S('path', { class: 'dv-t ' + (l.ded ? 'ded' : 'pale'), d: fil(l.i, l.j), 'stroke-width': l.ded ? 1.4 : (.5 + l.v / vmax * 1.7).toFixed(2), style: l.ded ? null : 'stroke-opacity:.75' }, gF);
    });
    grp.forEach(function (g, i) {
      var m = S('path', { class: 'dv-f ' + (inc[i] ? 'dv-inc-m' : 'dv-f5') + (o.tenu === i ? ' tenu' : ''), d: secteur(cx, cy, R - 9, R, g[0], g[1]), style: inc[i] ? 'fill:' + hach : null }, c.svg), am = (g[0] + g[1]) / 2, q = polaire(cx, cy, R + 14, am);
      S('path', { class: 'dv-prise', d: secteur(cx, cy, R - 20, R + 14, g[0], g[1]), style: 'pointer-events:all' }, c.svg)._m = m;
      if (marge >= 40) noms.push(S('text', { class: 'dv-nomtxt dv-e' + (inc[i] ? ' it' : ''), x: q[0], y: q[1] + 5, 'text-anchor': Math.abs(q[0] - cx) < 12 ? 'middle' : q[0] > cx ? 'start' : 'end' }, c.svg, d.noms[i] + (inc[i] ? ' ?' : ''))); else noms.push(null);
      marks.push(m);
    });
    var prises = [].slice.call(c.svg.querySelectorAll('.dv-prise')); prises.forEach(function (p, i) { p.setAttribute('role', 'img'); p.setAttribute('aria-label', d.noms[i] + (inc[i] ? ' : on ne sait pas' : ' : ' + fr(somme(d.m[i])))); });
    nav(c, prises, function (i, oui) {
      if (!inc[i]) marks[i].classList.toggle('vif', oui); if (noms[i]) noms[i].classList.toggle('vif', oui); c.el.classList.toggle('vise', oui);
      liens.forEach(function (l) { var mien = l.i === i || l.j === i; l.p.classList.toggle('sort', oui && mien); l.f.classList.toggle('tait', oui); if (noms[l.i === i ? l.j : l.i]) noms[l.i === i ? l.j : l.i].classList.toggle('lie', oui && mien); });
      marks.forEach(function (m, k) { m.classList.toggle('loin', oui && k !== i && !liens.some(function (l) { return (l.i === i && l.j === k) || (l.j === i && l.i === k); })); });
      if (oui) { var best = 0, bj = -1, dd = false; d.m[i].forEach(function (v, j) { if (j !== i && v + d.m[j][i] > best) { best = v + d.m[j][i]; bj = j; } }); liens.forEach(function (l) { if ((l.i === i || l.j === i) && l.ded) dd = true; }); var am = (grp[i][0] + grp[i][1]) / 2, q = polaire(cx, cy, R + 4, am); /* l'infobulle va dans le coin du quart où se trouve le nom : hors du cercle, jamais sur ses rubans */ var bas = Math.sin(am) > 0, kx = Math.cos(am) >= 0 ? c.W : 0, ky = bas ? c.H - 4 : 4; c.dire({ boite: { x0: kx, y0: ky, x1: kx, y1: ky }, cotes: bas ? ['dessus'] : ['dessous'], sur: d.noms[i] + (inc[i] ? ' · on ne sait pas' : ''), val: inc[i] ? '?' : fr(somme(d.m[i])), txt: bj >= 0 ? 'surtout avec ' + d.noms[bj] + ' (' + fr(best) + ')' + (dd ? ' · un lien déduit' : '') : '' }); }
    });
  });

  /* 23 · le flux : flux(el, { sources: [{ nom, v, vers }], milieux: [{ nom }], fin: 'nom', unite }) : des ruisseaux, des rivières, un fleuve */
  forme('flux', function (el, d, o) {
    var c = base(el, o, 420), M = { l: Math.min(170, c.W * .22), r: 150, t: 10, b: 10 }, tot = somme(d.sources.map(function (s) { return s.v; })), nm = d.milieux.length, jeu = 9, jeuM = 26;
    var K = (c.H - M.t - M.b - jeu * (d.sources.length - 1) - 0) / tot, xa = M.l, xm = M.l + (c.W - M.l - M.r) * .5, xb = c.W - M.r, ordre = d.sources.map(function (s, i) { return { s: s, i: i }; }).sort(function (p, q) { return p.s.vers - q.s.vers || q.s.v - p.s.v; });
    var vm = d.milieux.map(function (_, k) { return somme(d.sources.filter(function (s) { return s.vers === k; }).map(function (s) { return s.v; })); }), hM = somme(vm) * K + jeuM * (nm - 1), yM = [], y = M.t + (c.H - M.t - M.b - hM) / 2;
    vm.forEach(function (v) { yM.push(y); y += v * K + jeuM; });
    var yF = M.t + (c.H - M.t - M.b - tot * K) / 2, cumM = vm.map(function () { return 0; }), cumF = 0, ys = M.t, marks = [], infos = [], bandesM = [];
    function bande(x1, y1, x2, y2, h) { var mx = (x1 + x2) / 2; return 'M' + x1 + ' ' + y1 + 'C' + mx + ' ' + y1 + ' ' + mx + ' ' + y2 + ' ' + x2 + ' ' + y2 + 'L' + x2 + ' ' + (y2 + h) + 'C' + mx + ' ' + (y2 + h) + ' ' + mx + ' ' + (y1 + h) + ' ' + x1 + ' ' + (y1 + h) + 'Z'; }
    d.milieux.forEach(function (m, k) { var h = vm[k] * K; bandesM.push(S('path', { class: 'dv-f dv-f2', d: bande(xm + 3, yM[k], xb, yF + cumF, h) }, c.svg)); cumF += h; S('rect', { class: 'dv-f5', x: xm, y: yM[k], width: 3, height: h }, c.svg); S('text', { class: 'dv-nomcap', x: xm + 12, y: yM[k] - 7 }, c.svg, m.nom + '  ' + fr(vm[k])); });
    ordre.forEach(function (q) {
      var s = q.s, h = Math.max(1, s.v * K), k = s.vers, g = S('g', { role: 'img', 'aria-label': s.nom + ' : ' + fr(s.v) + ', vers ' + d.milieux[k].nom }, c.svg);
      var b = S('path', { class: 'dv-f ' + (s.deduit ? '' : 'dv-f1'), style: s.deduit ? 'fill:var(--amb-bg)' : null, d: bande(xa + 3, ys, xm, yM[k] + cumM[k], h) }, g); S('rect', { class: s.deduit ? 'dv-amb' : 'dv-f5', x: xa, y: ys, width: 3, height: h }, g);
      var t = S('text', { class: 'dv-nomtxt dv-e' + (s.deduit ? ' dv-amb it' : ''), x: xa - 12, y: ys + h / 2 + 5, 'text-anchor': 'end' }, g, s.nom);
      marks.push(g); infos.push({ s: s, b: b, t: t, k: k, y: ys + h / 2, boite: { x0: xa, y0: Math.min(ys, yM[k] + cumM[k]), x1: xm, y1: Math.max(ys, yM[k] + cumM[k]) + h } }); cumM[k] += h; ys += h + jeu;
    });
    S('rect', { class: 'dv-f5', x: xb, y: yF, width: 3, height: tot * K }, c.svg); S('text', { class: 'dv-grand', x: xb + 16, y: yF + tot * K / 2 + 6 }, c.svg, fr(tot)); S('text', { x: xb + 16, y: yF + tot * K / 2 + 28 }, c.svg, d.fin);
    nav(c, marks, function (i, oui) { var f = infos[i]; if (!f.s.deduit) f.b.classList.toggle('vif', oui); f.t.classList.toggle('vif', oui); bandesM[f.k].setAttribute('class', 'dv-f ' + (oui ? 'dv-f3' : 'dv-f2')); c.el.classList.toggle('estompe', oui); if (oui) c.dire({ boite: f.boite, cotes: ['droite', 'dessous', 'dessus'], sur: f.s.nom + ' → ' + d.milieux[f.k].nom + (f.s.deduit ? ' · déduit' : ''), val: fr(f.s.v) + (d.unite ? ' ' + d.unite : ''), txt: 'sur ' + fr(tot) + ' en tout' }); });
  });

  /* 24 · l'arbre radial : arbre(el, { nom, enfants: [{ nom, enfants: […] }] }) */
  forme('arbre', function (el, d, o) {
    var c = base(el, o, 460), cx = c.W / 2, cy = c.H / 2, R = Math.min(c.W / 2 - 100, c.H / 2 - 70), feuilles = [], noeuds = [], prof = 0;
    (function marche(n, p, parent) { n._p = p; n._parent = parent; prof = Math.max(prof, p); noeuds.push(n); if (n.enfants && n.enfants.length) n.enfants.forEach(function (e) { marche(e, p + 1, n); }); else feuilles.push(n); })(d, 0, null);
    feuilles.forEach(function (f, i) { f._a = i / feuilles.length * 2 * Math.PI - Math.PI / 2; });
    (function angle(n) { if (n.enfants && n.enfants.length) { n.enfants.forEach(angle); n._a = (n.enfants[0]._a + n.enfants[n.enfants.length - 1]._a) / 2; } })(d);
    noeuds.forEach(function (n) { n._r = n._p / prof * R; n._xy = polaire(cx, cy, n._r, n._a); });
    var marks = [];
    noeuds.forEach(function (n) { if (!n._parent) return; var p = n._parent, rm = (p._r + n._r) / 2, A = p._xy, B = polaire(cx, cy, rm, p._a), C = polaire(cx, cy, rm, n._a); n._l = S('path', { class: 'dv-t ' + (n.deduit ? 'ded' : 'pale'), d: 'M' + P(A) + 'C' + P(B) + ' ' + P(C) + ' ' + P(n._xy) }, c.svg); });   /* un rattachement déduit : ambre, en pointillé */
    noeuds.forEach(function (n) {
      var g = S('g', { role: 'img', 'aria-label': n.nom }, c.svg), feuille = !n.enfants || !n.enfants.length, deg = n._a * 180 / Math.PI, droite = Math.cos(n._a) >= 0;
      S('circle', { cx: n._xy[0], cy: n._xy[1], r: 11, fill: 'transparent' }, g); n._c = S('circle', { class: n.inconnu ? 'dv-creux dv-f' : n.deduit ? 'dv-ded-c dv-f' : 'dv-f ' + (feuille ? 'dv-f4' : 'dv-f5'), cx: n._xy[0], cy: n._xy[1], r: n.inconnu || n.deduit ? 3.5 : n._p === 0 ? 5 : feuille ? 2.5 : 3.5 }, g);   /* une feuille inconnue : un rond creux, son nom en italique pâle */
      if (n._p === 0) n._t = S('text', { class: 'dv-nomcap', x: cx, y: cy - 14, 'text-anchor': 'middle' }, g, n.nom);
      else if (feuille) n._t = S('text', { class: 'dv-e' + (n.inconnu ? ' dv-inc' : n.deduit ? ' dv-amb' : ''), x: n._xy[0], y: n._xy[1] + 4, 'text-anchor': droite ? 'start' : 'end', transform: 'rotate(' + (droite ? deg : deg + 180) + ' ' + n._xy[0] + ' ' + n._xy[1] + ') translate(' + (droite ? 9 : -9) + ' 0)' }, g, n.nom);
      else n._t = S('text', { class: 'dv-nomtxt dv-e', x: n._xy[0] + (droite ? 9 : -9), y: n._xy[1] - 8, 'text-anchor': droite ? 'start' : 'end' }, g, n.nom);
      marks.push(g);
    });
    nav(c, marks, function (i, oui) { var n = noeuds[i], chemin = [], q = n; while (q) { chemin.unshift(q.nom); if (q._l) q._l.classList.toggle('vif', oui); q._c.classList.toggle('vif', oui); q._t.classList.toggle('vif', oui); q = q._parent; } if (oui) c.dire({ sur: 'depuis ' + d.nom + (n.deduit ? ' · rattaché par déduction' : ''), val: n.nom + (n.inconnu ? ' ?' : ''), txt: chemin.join(' › ') + (n.inconnu ? ' · on ne sait pas combien' : '') }); });
  });

  /* 25 · la matrice : matrice(el, { noms, m: [[…]] }) : une case par paire ; la ligne et la colonne se lisent ensemble */
  forme('matrice', function (el, d, o) {
    var n = d.noms.length, W0 = Math.max(260, el.clientWidth || 600), ml = 112, mt = 84, pas = Math.min(30, (W0 - ml) / n), c = base(el, { h: Math.round(mt + n * pas + 4), lu: o.lu, repos: o.repos, nom: o.nom }, 0), hach = c.hachures(), max = Math.max.apply(null, d.m.map(function (r) { return Math.max.apply(null, r.filter(su)); })), marks = [], infos = [], rl = [], cl = [], ded = {};
    (d.deduits || []).forEach(function (q) { ded[q[0] + '-' + q[1]] = ded[q[1] + '-' + q[0]] = 1; });   /* une paire déduite : la case est cernée d'ambre en pointillé ; null : on ne sait pas, des hachures */
    var bh = S('rect', { class: 'dv-bande', x: ml, width: n * pas, height: pas, opacity: 0 }, c.svg), bv = S('rect', { class: 'dv-bande', y: mt, width: pas, height: n * pas, opacity: 0 }, c.svg);
    d.noms.forEach(function (nom, i) { rl.push(S('text', { class: 'dv-e', x: ml - 10, y: mt + i * pas + pas / 2 + 4, 'text-anchor': 'end' }, c.svg, nom)); cl.push(S('text', { class: 'dv-e', x: ml + i * pas + pas / 2, y: mt - 10, transform: 'rotate(-48 ' + (ml + i * pas + pas / 2) + ' ' + (mt - 10) + ')' }, c.svg, nom)); });
    d.m.forEach(function (ligne, i) { ligne.forEach(function (v, j) { var niv = v ? 1 + Math.min(4, Math.floor(v / max * 4.999)) : 0, x = ml + j * pas, y = mt + i * pas, dd = ded[i + '-' + j]; if (dd) S('rect', { class: 'dv-ded-c', x: x + .75, y: y + .75, width: pas - 1.5, height: pas - 1.5 }, c.svg); if (!su(v)) { marks.push(S('rect', { class: 'dv-f', x: x + 1.5, y: y + 1.5, width: pas - 3, height: pas - 3, fill: hach, role: 'img', 'aria-label': d.noms[i] + ' et ' + d.noms[j] + ' : on ne sait pas' }, c.svg)); infos.push({ i: i, j: j, v: null, x: x, y: y }); return; } marks.push(v ? S('rect', { class: 'dv-f dv-f' + niv, x: x + 1.5, y: y + 1.5, width: pas - 3, height: pas - 3, role: 'img', 'aria-label': d.noms[i] + ' et ' + d.noms[j] + ' : ' + fr(v) }, c.svg) : S('rect', { class: 'dv-f', x: x + pas / 2 - 1, y: y + pas / 2 - 1, width: 2, height: 2, style: 'fill:var(--dv-2)', role: 'img', 'aria-label': d.noms[i] + ' et ' + d.noms[j] + ' : rien' }, c.svg)); infos.push({ i: i, j: j, v: v, x: x, y: y, ded: dd }); }); });
    marks.forEach(function (m, k) { var f = infos[k]; S('rect', { class: 'dv-prise', x: f.x, y: f.y, width: pas, height: pas, style: 'pointer-events:all' }, c.svg); });
    var prises = [].slice.call(c.svg.querySelectorAll('.dv-prise'));
    nav(c, prises, function (k, oui) { var f = infos[k]; if (f.v && su(f.v)) marks[k].classList.toggle('vif', oui); rl[f.i].classList.toggle('vif', oui); cl[f.j].classList.toggle('vif', oui); bh.setAttribute('opacity', oui ? 1 : 0); bv.setAttribute('opacity', oui ? 1 : 0); bh.setAttribute('y', f.y); bv.setAttribute('x', f.x); if (oui) c.dire({ boite: { x0: f.x, y0: f.y, x1: f.x + pas, y1: f.y + pas }, sur: d.noms[f.i] + ' · ' + d.noms[f.j] + (f.ded ? ' · déduit' : ''), val: !su(f.v) ? 'on ne sait pas' : f.v ? fr(f.v) : 'rien', txt: f.i === f.j ? 'avec soi-même' : '' }); }, { dx: 1, dy: n });
  });

  /* 26 · le réseau : reseau(el, { noeuds: [{ nom, poids }], liens: [{ a, b, v }] }) : au repos, un seul fil se voit ; les autres viennent sous la main */
  forme('reseau', function (el, d, o) {
    var c = base(el, o, 440), hach = c.hachures(), n = d.noeuds.length, pos = d.noeuds.map(function (_, i) { var a = i / n * 2 * Math.PI; return [c.W / 2 + Math.cos(a) * c.W * .3, c.H / 2 + Math.sin(a) * c.H * .3]; }), it, i, j;
    for (it = 0; it < 320; it++) {   /* une mise en place calme, toujours la même : des ressorts sur les liens, une répulsion entre tous */
      var f = pos.map(function () { return [0, 0]; }), t = 1 - it / 320;
      for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) { var dx = pos[i][0] - pos[j][0], dy = pos[i][1] - pos[j][1], d2 = Math.max(80, dx * dx + dy * dy), k = 22000 / d2, dd = Math.sqrt(d2); f[i][0] += dx / dd * k; f[i][1] += dy / dd * k; f[j][0] -= dx / dd * k; f[j][1] -= dy / dd * k; }
      d.liens.forEach(function (l) { var dx = pos[l.b][0] - pos[l.a][0], dy = pos[l.b][1] - pos[l.a][1], dd = Math.sqrt(dx * dx + dy * dy) || 1, k = (dd - 130) * .03 * (.6 + (l.v || 1) * .2); f[l.a][0] += dx / dd * k; f[l.a][1] += dy / dd * k; f[l.b][0] -= dx / dd * k; f[l.b][1] -= dy / dd * k; });
      pos.forEach(function (p, q) { p[0] = borne(p[0] + f[q][0] * t * 6 + (c.W / 2 - p[0]) * .012, 50, c.W - 90); p[1] = borne(p[1] + f[q][1] * t * 6 * (c.H / c.W + .2) + (c.H / 2 - p[1]) * .02, 22, c.H - 22); });
    }
    var fort = 0; d.liens.forEach(function (l, k) { if ((l.v || 1) > (d.liens[fort].v || 1)) fort = k; });
    var fils = d.liens.map(function (l, k) { return S('line', { class: 'dv-t ' + (l.deduit ? 'ded' : 'fin'), x1: pos[l.a][0], y1: pos[l.a][1], x2: pos[l.b][0], y2: pos[l.b][1], opacity: k === fort ? 1 : 0, 'stroke-width': .8 + (l.v || 1) * .5 }, c.svg); }), marks = [], noms = [], ronds = [];
    d.noeuds.forEach(function (nd, q) { var g = S('g', { role: 'img', 'aria-label': nd.nom }, c.svg), r = 3 + (nd.poids || 1) * 1.6; S('circle', { cx: pos[q][0], cy: pos[q][1], r: r + 9, fill: 'transparent' }, g); ronds.push(S('circle', { class: nd.inconnu ? 'dv-f dv-inc-m' : 'dv-f dv-f4' + (o.tenu === q ? ' tenu' : ''), cx: pos[q][0], cy: pos[q][1], r: r, style: nd.inconnu ? 'fill:' + hach : null }, g));   /* un lieu dont on ne sait rien : creux, hachuré */ var grand = (nd.poids || 1) >= 3 || q === d.liens[fort].a || q === d.liens[fort].b; noms.push(S('text', { class: 'dv-nomtxt dv-e dv-halo', x: pos[q][0] + r + 7, y: pos[q][1] + 5, opacity: grand ? 1 : 0, 'data-grand': grand ? 1 : 0 }, g, nd.nom)); marks.push(g); });
    nav(c, marks, function (q, oui) {
      var lies = {}; d.liens.forEach(function (l, k) { var mien = l.a === q || l.b === q; fils[k].setAttribute('opacity', oui ? (mien ? 1 : 0) : (k === fort ? 1 : 0)); fils[k].classList.toggle('vif', oui && mien && !l.deduit); if (mien) lies[l.a === q ? l.b : l.a] = 1; });
      noms.forEach(function (t, k) { var mien = k === q || lies[k]; t.setAttribute('opacity', oui ? (mien ? 1 : .15) : +t.getAttribute('data-grand')); t.classList.toggle('vif', oui && mien); ronds[k].style.opacity = oui && !mien ? .25 : ''; }); ronds[q].classList.toggle('vif', oui);
      if (oui) { var v = Object.keys(lies), dd = d.liens.filter(function (l) { return l.deduit && (l.a === q || l.b === q); }).length; c.dire({ sur: d.noeuds[q].nom + (d.noeuds[q].inconnu ? ' · on ne sait rien' : ''), val: v.length + (v.length > 1 ? ' fils' : ' fil'), txt: (v.length ? 'vers ' + v.map(function (k) { return d.noeuds[k].nom; }).join(', ') : 'seul') + (dd ? ' · ' + dd + ' déduit' + (dd > 1 ? 's' : '') : '') }); }
    }, { pos: pos });
  });

  /* ════════ LA DISTRIBUTION ════════ */

  /* la brosse : une plage qu'on tire, deux poignées de 16 px. brosse(c, y, x0, x1, { a, b } (0 à 1), fn(a, b)) */
  function brosse(c, y, x0, x1, etat, fn) {
    var g = S('g', {}, c.svg), plage = S('rect', { class: 'dv-brosse-plage', y: 0, height: y }, g), poignees = [0, 1].map(function (k) { return S('circle', { class: 'dv-poignee', cy: y, r: 8, tabindex: 0, role: 'slider', 'aria-label': k ? 'Fin de la plage' : 'Début de la plage', 'aria-valuemin': 0, 'aria-valuemax': 100 }, g); });
    function peindre() { var xa = x0 + etat.a * (x1 - x0), xb = x0 + etat.b * (x1 - x0); plage.setAttribute('x', xa); plage.setAttribute('width', Math.max(0, xb - xa)); poignees[0].setAttribute('cx', xa); poignees[1].setAttribute('cx', xb); poignees[0].setAttribute('aria-valuenow', Math.round(etat.a * 100)); poignees[1].setAttribute('aria-valuenow', Math.round(etat.b * 100)); fn(etat.a, etat.b); }
    function lire(e) { var r = c.svg.getBoundingClientRect(); return borne(((e.clientX - r.left) * c.W / r.width - x0) / (x1 - x0), 0, 1); }
    function tirer(n, debut, bouge) { n.addEventListener('pointerdown', function (e) { if (e.button) return; e.preventDefault(); var ctx = debut(e); try { n.setPointerCapture(e.pointerId); } catch (x) { /* pointeur de synthèse */ } n.classList.add('tenu'); function mv(ev) { bouge(ev, ctx); peindre(); } function up() { n.classList.remove('tenu'); n.removeEventListener('pointermove', mv); n.removeEventListener('pointerup', up); n.removeEventListener('pointercancel', up); } n.addEventListener('pointermove', mv); n.addEventListener('pointerup', up); n.addEventListener('pointercancel', up); }); }
    poignees.forEach(function (p, k) {
      tirer(p, function () { p.focus(); return {}; }, function (e) { var f = lire(e); if (k) etat.b = Math.max(f, etat.a + .02); else etat.a = Math.min(f, etat.b - .02); });
      p.addEventListener('keydown', function (e) { var s = (e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0) * (e.shiftKey ? .1 : .02); if (!s) return; e.preventDefault(); if (k) etat.b = borne(etat.b + s, etat.a + .02, 1); else etat.a = borne(etat.a + s, 0, etat.b - .02); peindre(); });
    });
    tirer(plage, function (e) { return { f: lire(e), a: etat.a, b: etat.b }; }, function (e, ctx) { var dlt = borne(lire(e) - ctx.f, -ctx.a, 1 - ctx.b); etat.a = ctx.a + dlt; etat.b = ctx.b + dlt; });
    peindre(); return g;
  }
  V.outils.brosse = brosse;

  /* 27 · l'histogramme en traits, avec sa brosse : histogramme(el, { v: [valeurs], unite }, { cases, plage: [a, b] }) */
  forme('histogramme', function (el, d, o) {
    var c = base(el, o, 260), M = { l: 14, r: 14, t: 24, b: 40 }, tri = d.v.slice().sort(function (a, b) { return a - b; }), cr = beaux(tri[0], tri[tri.length - 1], 6), min = cr[0], max = cr[cr.length - 1], nb = o.cases || 48, pasV = (max - min) / nb, cpt = [], i;
    for (i = 0; i < nb; i++) cpt.push(0); d.v.forEach(function (v) { cpt[Math.min(nb - 1, Math.floor((v - min) / pasV))]++; });
    var X = lin(min, max, M.l, c.W - M.r), sol = c.H - M.b, Y = lin(0, Math.max.apply(null, cpt), sol, M.t), etat = o._etat || (o._etat = { a: (o.plage ? o.plage[0] : quantile(tri, .25)) / (max - min) - min / (max - min), b: (o.plage ? o.plage[1] : quantile(tri, .75)) / (max - min) - min / (max - min) }), traits = [];
    var med = quantile(tri, .5);
    function lire(a, b) {
      var va = min + a * (max - min), vb = min + b * (max - min), dedans = d.v.filter(function (v) { return v >= va && v <= vb; }).length;
      traits.forEach(function (t, k) { var m = min + (k + .5) * pasV; t.setAttribute('class', 'dv-t ' + (m >= va && m <= vb ? '' : 'pale')); });
      c.dire({ sur: 'entre ' + fr(va) + ' et ' + fr(vb) + (d.unite ? ' ' + d.unite : ''), val: fr(dedans), txt: 'sur ' + fr(d.v.length) + ' : ' + (dedans / d.v.length > .5 ? 'plus de la moitié' : dedans / d.v.length > .25 ? 'plus du quart' : 'moins du quart') });
    }
    /* la brosse d'abord (sa plage passe derrière), puis les traits, qui ne prennent pas le pointeur : les poignées restent saisissables */
    brosse(c, sol, M.l, c.W - M.r, etat, lire);
    cpt.forEach(function (n, k) { var x = X(min + (k + .5) * pasV); traits.push(S('line', { class: 'dv-t', x1: x, y1: sol, x2: x, y2: n ? Y(n) : sol, 'stroke-width': Math.max(2, (c.W - M.l - M.r) / nb - 4), 'stroke-linecap': 'butt', 'pointer-events': 'none' }, c.svg)); });
    axeX(c, sol, M.l, c.W - M.r, cr.map(function (v) { return { x: X(v), t: fr(v) }; })).setAttribute('pointer-events', 'none');
    S('line', { class: 'dv-t tirets', x1: X(med), y1: 12, x2: X(med), y2: sol, 'pointer-events': 'none' }, c.svg); S('text', { x: X(med) + 6, y: 12, 'pointer-events': 'none' }, c.svg, 'médiane ' + fr(med));
    c.svg.appendChild(c.svg.querySelector('.dv-poignee').parentNode.children[1]); c.svg.appendChild(c.svg.querySelector('.dv-poignee'));   /* les deux poignées repassent devant */
    lire(etat.a, etat.b);
  });

  function resume(v) { var t = v.slice().sort(function (a, b) { return a - b; }), q1 = quantile(t, .25), q3 = quantile(t, .75), e = (q3 - q1) * 1.5; return { t: t, q1: q1, med: quantile(t, .5), q3: q3, bas: t.filter(function (x) { return x >= q1 - e; })[0], haut: t.filter(function (x) { return x <= q3 + e; }).pop(), loin: t.filter(function (x) { return x < q1 - e || x > q3 + e; }) }; }
  function densite(t, x0, x1, n, bw) { var out = [], i; for (i = 0; i < n; i++) { var x = x0 + (x1 - x0) * i / (n - 1), s = 0; t.forEach(function (v) { var u = (x - v) / bw; s += Math.exp(-.5 * u * u); }); out.push([x, s / t.length]); } return out; }

  /* 28 · les violons : violons(el, { groupes: [{ nom, v }], unite }) : la forme entière de chaque groupe */
  forme('violons', function (el, d, o) {
    var c = base(el, o, 340), M = { l: 46, r: 10, t: 14, b: 44 }, tout = [].concat.apply([], d.groupes.map(function (g) { return g.v; })), cr = beaux(Math.min.apply(null, tout), Math.max.apply(null, tout), 5), Y = lin(cr[0], cr[cr.length - 1], c.H - M.b, M.t), ng = d.groupes.length, wg = (c.W - M.l - M.r) / ng, marks = [], els = [];
    U.axeY(c, M.l, c.W - M.r, cr.map(function (v) { return { y: Y(v), t: fr(v) }; }));
    d.groupes.forEach(function (g, k) {
      var r = resume(g.v), cx = M.l + wg * (k + .5), dens = densite(r.t, cr[0], cr[cr.length - 1], 44, (cr[cr.length - 1] - cr[0]) / 22), dm = Math.max.apply(null, dens.map(function (p) { return p[1]; })), demi = Math.min(wg * .38, 70), G = S('g', { role: 'img', 'aria-label': g.nom + ' : médiane ' + fr(r.med) }, c.svg);
      var gauche = dens.map(function (p) { return [cx - p[1] / dm * demi, Y(p[0])]; }), droite = dens.map(function (p) { return [cx + p[1] / dm * demi, Y(p[0])]; });
      var f = S('path', { class: 'dv-bande', d: aire(gauche, droite) }, G), t = S('path', { class: 'dv-t fin' + (g.deduit ? ' ded' : ''), d: douce(gauche) + 'L' + P(droite[droite.length - 1]) + U.segs(droite.slice().reverse()) + 'Z' }, G);
      S('line', { class: 'dv-t', x1: cx, y1: Y(r.q1), x2: cx, y2: Y(r.q3), 'stroke-width': 1 }, G); var m = S('line', { class: 'dv-t', x1: cx - 9, y1: Y(r.med), x2: cx + 9, y2: Y(r.med), 'stroke-width': 2 }, G);
      var nom = S('text', { class: 'dv-nomtxt dv-e', x: cx, y: c.H - 18, 'text-anchor': 'middle' }, G, g.nom); S('text', { x: cx, y: c.H - 2, 'text-anchor': 'middle' }, G, fr(g.v.length) + ' mesures');
      marks.push(G); els.push({ t: t, m: m, nom: nom, r: r, g: g, cx: cx }); void f;
    });
    nav(c, marks, function (k, oui) { var e = els[k]; e.t.classList.toggle('vif', oui); e.m.classList.toggle('vif', oui); e.nom.classList.toggle('vif', oui); if (oui) c.dire({ x: e.cx + 40, y: Y(e.r.med), sur: e.g.nom + ' · médiane', val: fr(e.r.med) + (d.unite ? ' ' + d.unite : ''), txt: 'la moitié entre ' + fr(e.r.q1) + ' et ' + fr(e.r.q3) }); });
  });

  /* 29 · les boîtes fines : boites(el, { groupes: [{ nom, v }], unite }) */
  forme('boites', function (el, d, o) {
    var hr = 40, c = base(el, { h: d.groupes.length * hr + 40, lu: o.lu, repos: o.repos, nom: o.nom }, 0), hach = c.hachures(), M = { l: Math.min(150, c.W * .3), r: 14 }, tout = [].concat.apply([], d.groupes.filter(function (g) { return !g.inconnu; }).map(function (g) { return g.v; })), cr = beaux(Math.min.apply(null, tout), Math.max.apply(null, tout), 5), X = lin(cr[0], cr[cr.length - 1], M.l, c.W - M.r), marks = [], els = [];
    d.groupes.forEach(function (g, k) {
      var r = resume(g.v), y = k * hr + hr / 2, G = S('g', { role: 'img', 'aria-label': g.nom + (g.inconnu ? ' : on ne sait pas' : ' : médiane ' + fr(r.med) + (g.deduit ? ', déduite' : '')) }, c.svg), tenu = o.tenu === k ? ' tenu' : ''; S('rect', { x: 0, y: y - hr / 2, width: c.W, height: hr, fill: 'transparent' }, G);
      var nom = S('text', { class: 'dv-nomtxt dv-e' + tenu + (g.inconnu ? ' it' : g.deduit ? ' dv-amb' : ''), x: 0, y: y + 5 }, G, g.nom), b, m;
      if (g.inconnu) { b = S('rect', { class: 'dv-trou', x: M.l, y: y - 5, width: c.W - M.r - M.l, height: 10, fill: hach }, G); m = S('line', { class: 'dv-t fin', x1: 0, y1: 0, x2: 0, y2: 0 }, G); }   /* un groupe sans mesure : des hachures sur toute l'étendue */
      else {
        S('line', { class: 'dv-t ' + (g.deduit ? 'ded' : 'fin'), x1: X(r.bas), y1: y, x2: X(r.haut), y2: y }, G);
        b = S('rect', { class: g.deduit ? 'dv-ded-c dv-f' : 'dv-f dv-f3' + tenu, x: X(r.q1), y: y - 3, width: X(r.q3) - X(r.q1), height: 6 }, G); S('rect', { class: 'dv-f0', x: X(r.med) - 3, y: y - 5, width: 6, height: 10 }, G); m = S('line', { class: 'dv-t' + (g.deduit ? ' ded' : '') + tenu, x1: X(r.med), y1: y - 8, x2: X(r.med), y2: y + 8, 'stroke-width': 2 }, G);
        r.loin.forEach(function (v) { S('circle', { class: g.deduit ? 'dv-ded-c' : 'dv-creux', cx: X(v), cy: y, r: 2.5 }, G); });
      }
      marks.push(G); els.push({ nom: nom, b: b, m: m, r: r, g: g, y: y });
    });
    axeX(c, d.groupes.length * hr + 6, M.l, c.W - M.r, cr.map(function (v) { return { x: X(v), t: fr(v) }; }));
    nav(c, marks, function (k, oui) { var e = els[k]; e.b.classList.toggle('vif', oui); e.m.classList.toggle('vif', oui); e.nom.classList.toggle('vif', oui); if (oui && e.g.inconnu) { c.dire({ x: c.W / 2, y: e.y - 30, sur: e.g.nom, val: 'on ne sait pas', txt: 'aucune mesure' }); return; } if (oui) c.dire({ x: X(e.r.med), y: e.y - 30, sur: e.g.nom + ' · médiane' + (e.g.deduit ? ' · déduite' : ''), val: fr(e.r.med) + (d.unite ? ' ' + d.unite : ''), txt: 'la moitié entre ' + fr(e.r.q1) + ' et ' + fr(e.r.q3) + (e.r.loin.length ? ', ' + e.r.loin.length + ' à l’écart' : '') }); });
  });

  /* 30 · la bande de densité : bandes(el, { groupes: [{ nom, v }], unite }) : un trait par mesure ; là où ils se serrent, la bande fonce */
  forme('bandes', function (el, d, o) {
    var hr = 38, c = base(el, { h: d.groupes.length * hr + 34, lu: o.lu, repos: o.repos, nom: o.nom }, 0), M = { l: Math.min(150, c.W * .3), r: 14 }, tout = [].concat.apply([], d.groupes.map(function (g) { return g.v; })), cr = beaux(Math.min.apply(null, tout), Math.max.apply(null, tout), 5), X = lin(cr[0], cr[cr.length - 1], M.l, c.W - M.r), marks = [], els = [];
    d.groupes.forEach(function (g, k) {
      var y = k * hr + 4, G = S('g', { role: 'img', 'aria-label': g.nom + ' : ' + g.v.length + ' mesures' }, c.svg), t = S('g', { opacity: Math.max(.12, Math.min(.6, 26 / g.v.length)) }, G); S('rect', { x: 0, y: y, width: c.W, height: hr - 8, fill: 'transparent' }, G);
      g.v.forEach(function (v) { S('line', { class: 'dv-t', x1: X(v), y1: y, x2: X(v), y2: y + hr - 14, 'stroke-width': 1.2, 'stroke-linecap': 'butt' }, t); });
      var moy = somme(g.v) / g.v.length, m = S('path', { class: 'dv-f dv-f5', d: 'M' + (X(moy) - 5) + ' ' + (y - 4) + 'L' + (X(moy) + 5) + ' ' + (y - 4) + 'L' + X(moy) + ' ' + (y + 3) + 'Z' }, G), nom = S('text', { class: 'dv-nomtxt dv-e', x: 0, y: y + hr / 2 - 1 }, G, g.nom);
      marks.push(G); els.push({ t: t, m: m, nom: nom, moy: moy, g: g, y: y });
    });
    axeX(c, d.groupes.length * hr, M.l, c.W - M.r, cr.map(function (v) { return { x: X(v), t: fr(v) }; }));
    nav(c, marks, function (k, oui) { var e = els[k]; e.m.classList.toggle('vif', oui); e.nom.classList.toggle('vif', oui); e.t.querySelectorAll('line').forEach(function (l) { l.classList.toggle('vif', oui); }); if (oui) c.dire({ x: X(e.moy), y: e.y - 30, sur: e.g.nom + ' · moyenne', val: fr(e.moy, 1) + (d.unite ? ' ' + d.unite : ''), txt: fr(e.g.v.length) + ' mesures, de ' + fr(Math.min.apply(null, e.g.v)) + ' à ' + fr(Math.max.apply(null, e.g.v)) }); });
  });

  /* ════════ LES PIÈCES COMMUNES ════════ */

  /* le tableau qui double un graphique : tableau(el, { colonnes: [noms], lignes: [{ nom, v: [série], deduit, inconnu }], unite }) */
  V.tableau = function (el, d) {
    el.textContent = ''; var t = H('table', { class: 'dv-tab' }, el), tr = H('tr', {}, H('thead', {}, t)), tb = H('tbody', {}, t), max = Math.max.apply(null, d.lignes.map(function (l) { return l.v ? Math.max.apply(null, l.v) : 0; }));
    d.colonnes.forEach(function (n, i) { H('th', i > 1 ? { class: 'n' } : {}, tr, n); });
    d.lignes.forEach(function (l) {
      var r = H('tr', { tabindex: 0 }, tb); H('td', {}, r, l.nom); var cell = H('td', {}, r);
      if (l.inconnu) { H('td', { class: 'n manque' }, r, 'on ne sait pas'); H('td', { class: 'n manque' }, r, '—'); H('td', { class: 'n manque' }, r, '—'); cell.className = 'manque'; cell.textContent = 'aucune mesure'; return; }
      var n = l.v.length, s = S('svg', { viewBox: '0 0 150 26', role: 'img', 'aria-label': 'de ' + fr(l.v[0]) + ' à ' + fr(l.v[n - 1]) }, cell), X = lin(0, n - 1, 2, 144), Y = lin(Math.min.apply(null, l.v), Math.max.apply(null, l.v), 23, 3),   /* chaque petite courbe a sa propre échelle : on y lit une forme, pas une hauteur */ nr = l.deduit ? n - l.deduit : n, pts = l.v.map(function (v, i) { return [X(i), Y(v)]; });
      S('path', { class: 'dv-t fin', d: douce(pts.slice(0, nr)) }, s); if (l.deduit) S('path', { class: 'dv-t ded', d: douce(pts.slice(nr - 1)) }, s); S('circle', { class: l.deduit ? 'dv-ded-c' : 'dv-f5', cx: X(n - 1), cy: Y(l.v[n - 1]), r: 2.5 }, s);
      H('td', { class: 'n' + (l.deduit ? ' ded' : '') }, r, fr(l.v[n - 1])); var e = l.v[n - 1] - l.v[0]; H('td', { class: 'n' }, r, (e >= 0 ? '+' : '') + fr(e)); H('td', { class: 'n' }, r).appendChild(H('small', {}, null, 'au plus ' + fr(Math.max.apply(null, l.v))));
    });
  };
  /* la légende : legende(el, [{ nom, marque: 'trait' | 'fin' | 'tirets' | 'ded' | 'point' | 'creux' | 'tenu' | 'hach' | 'f1'…'f5' | 'bande' }]) */
  V.legende = function (el, items) {
    el.textContent = ''; el.classList.add('dv-legende'); var u = 0;
    items.forEach(function (it) {
      var li = H('li', {}, el), s = S('svg', { viewBox: '0 0 26 12', 'aria-hidden': 'true' }, li), m = it.marque;
      if (m === 'point') S('circle', { class: 'dv-f5', cx: 13, cy: 6, r: 4 }, s); else if (m === 'creux') S('circle', { class: 'dv-creux', cx: 13, cy: 6, r: 4 }, s); else if (m === 'tenu') S('circle', { class: 'dv-point', cx: 13, cy: 6, r: 4.5 }, s);
      else if (m === 'hach') { var id = 'dvl' + (++u) + Math.round(Math.random() * 1e6), p = S('pattern', { id: id, width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, S('defs', {}, s)); S('line', { class: 'dv-hl', x1: 0, y1: 0, x2: 0, y2: 6 }, p); S('rect', { x: 2, y: 0, width: 22, height: 12, fill: 'url(#' + id + ')' }, s); }
      else if (/^f\d$/.test(m) || m === 'bande') S('rect', { class: m === 'bande' ? 'dv-bande' : 'dv-' + m, x: 2, y: 0, width: 22, height: 12 }, s);
      else S('line', { class: 'dv-t ' + (m === 'trait' ? '' : m), x1: 1, y1: 6, x2: 25, y2: 6 }, s);
      H('span', {}, li, it.nom);
    });
  };
})();
