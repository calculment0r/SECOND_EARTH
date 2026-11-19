/* SOLARIS · LE MONDE, EN GRAPHIQUE · MG-05 · Les strates.
   Une seule chose : ce qui traverse les âges du film. Quatre âges, quatre strates, la plus ancienne en bas. Chaque strate est faite de ses moments :
   un trait par moment daté, posé sur le précédent comme un dépôt (plus appuyé quand le moment fait basculer l'histoire).
   Chaque chose du monde est un fil debout : il part de l'âge où elle naît et monte jusqu'à celui où elle s'arrête. Là où une chose se tait pendant
   tout un âge, son fil s'interrompt : elle dort dessous, et remonte plus haut.
   Dit : les âges de chaque chose sont écrits dans la bible du monde. Déduit (pointillé ambre) : la bible donne la chose elle-même pour déduite. */
(function () {
  'use strict';
  var M = MG.monde, seg = MG.seg, mix = MG.mix, doux = MG.doux, C = MG.C;
  var AGES = ['heritage', 'soupcon', 'code', 'ombres'], TYPES = ['PERSONNAGE', 'FACTION', 'LIEU', 'OBJET', 'RÈGLE'];
  var X0 = 640, X1 = 1630, YB = 884, PAS = 9.1, ENTRE = 24;

  /* ── les strates : les 54 moments, du plus ancien (en bas) au plus récent ── */
  var moments = M.moments.slice().sort(function (a, b) { return a.jour - b.jour; }), y = YB, strates = {};
  moments.forEach(function (m, i) {
    if (i && m.ere !== moments[i - 1].ere) y -= ENTRE;
    m.y = y; m.rang = i; y -= PAS;
    var s = strates[m.ere] || (strates[m.ere] = { bas: m.y, n: 0, de: i }); s.haut = m.y; s.n++;
  });
  var YH = y + PAS;
  AGES.forEach(function (a) { strates[a].chose = MG.chose['ere.' + a]; strates[a].seqs = M.sequences.filter(function (s) { return M.moments.some(function (m) { return m.seq === s.a && m.ere === a && m.jour >= 1; }); }).length; });
  /* le pli commun à toutes les couches : elles se suivent, comme un dépôt */
  function pli(x, prof) { return (13 * Math.sin(x / 250 + 0.7) + 6 * Math.sin(x / 91 + 2.1)) * (0.55 + 0.45 * prof); }

  /* ── les fils : une chose du monde chacun (les âges eux-mêmes sont les strates) ── */
  var choses = M.choses.filter(function (c) { return c.type !== 'ÈRE'; });
  choses.forEach(function (c) {
    var ages = AGES.filter(function (a) { return c.eres.indexOf(a) >= 0; }), siens = moments.filter(function (m) { return m.qui.indexOf(c.id) >= 0 || m.objets.indexOf(c.id) >= 0 || m.lieu === c.id; });
    c.troncons = ages.map(function (a, k) {
      var s = strates[a], dedans = siens.filter(function (m) { return m.ere === a; }), bas = s.bas + 5, haut = s.haut - 5;
      if (k === 0 && dedans.length) bas = dedans[0].y + 4;
      if (k === ages.length - 1 && dedans.length) haut = dedans[dedans.length - 1].y - 4;
      if (bas - haut < 14) { var mi = (bas + haut) / 2; bas = mi + 7; haut = mi - 7; }
      return { age: a, bas: bas, haut: haut };
    });
    c.de = AGES.indexOf(ages[0]); c.a = AGES.indexOf(ages[ages.length - 1]); c.nAges = ages.length;
    c.dort = c.a - c.de + 1 > ages.length;          /* un âge manque au milieu : la chose dort sous le film */
    c.sommet = c.troncons[c.troncons.length - 1].haut; c.pied = c.troncons[0].bas;
  });
  choses.sort(function (a, b) { return TYPES.indexOf(a.type) - TYPES.indexOf(b.type) || a.de - b.de || b.a - a.a || a.pied - b.pied; });
  var NOMS = { PERSONNAGE: 'les gens', FACTION: 'les groupes', LIEU: 'les lieux', OBJET: 'les objets', 'RÈGLE': 'les règles' }, familles = [];
  (function () {
    var trous = 4 * 26, pas = (X1 - X0 - 40 - trous) / (choses.length - 1), x = X0 + 20;
    choses.forEach(function (c, i) {
      if (i && c.type !== choses[i - 1].type) x += 26;
      if (!i || c.type !== choses[i - 1].type) familles.push({ nom: NOMS[c.type], x0: x, x1: x });
      c.x = x; familles[familles.length - 1].x1 = x; x += pas;
    });
  })();
  var entier = choses.filter(function (c) { return c.nAges === AGES.length; }), dormeurs = choses.filter(function (c) { return c.dort; });

  var ox = 0, oy = 0, U = 1;
  function X(v) { return ox + v * U; } function Y(v) { return oy + v * U; }
  function composer(L, H, u) { U = u; ox = (L - 2000 * u) / 2; oy = (H - 1069 * u) / 2; }
  var T_0 = 0.03, T_1 = 0.5, T_TRAV = 0.55, T_FIN = 0.78;

  function dessiner(g, t, L, H) {
    var depot = seg(t, T_0, T_1) * moments.length, trav = doux(seg(t, T_TRAV, T_TRAV + 0.1)), fin = doux(seg(t, T_FIN, 0.98));
    var ici = depot > 0 && depot < moments.length ? moments[Math.floor(depot)] : null, front = depot <= 0 ? YB + 20 : depot >= moments.length ? YH - 300 : ici.y - PAS * (depot % 1);

    /* les strates : un trait par moment, tiré de gauche à droite */
    moments.forEach(function (m) {
      if (m.rang > depot) return;
      var part = m === ici ? depot % 1 : 1, prof = 1 - m.rang / moments.length, x1 = mix(X0, X1, part);
      g.save(); g.strokeStyle = m === ici ? C.or : C.ink; g.lineWidth = (m.pivot ? 1.3 : 0.8) * U; g.globalAlpha = m === ici ? 1 : (m.pivot ? 0.5 : 0.26) * mix(1, 0.7, fin);
      g.beginPath();
      for (var x = X0; x <= x1 + 0.1; x += 14) { var yy = m.y + pli(x, prof); if (x === X0) g.moveTo(X(x), Y(yy)); else g.lineTo(X(x), Y(yy)); }
      g.stroke(); g.restore();
    });
    /* le nom de chaque âge, quand son dépôt commence */
    AGES.forEach(function (a) {
      var s = strates[a], al = depot > 0 ? doux(seg(depot, s.de, s.de + 2.5)) : 0; if (al <= 0) return;
      var ym = (s.bas + s.haut) / 2 + pli(X1, 0.5);
      MG.ecrire(g, s.chose.nom.replace('Avant — l', 'L'), X(X1 + 26), Y(ym + 4), 18 * U, { alpha: al, italique: true });
      MG.ecrire(g, s.n + ' moments' + (s.seqs ? ' · ' + s.seqs + (s.seqs > 1 ? ' séquences' : ' séquence') : ' · hors du film'), X(X1 + 26), Y(ym + 26), 13.5 * U, { alpha: al, encre: C.pale });
    });

    /* les fils : ils poussent avec le dépôt, jamais plus haut que lui */
    g.save(); g.beginPath(); g.rect(0, Y(front - 30), L, H); g.clip();
    choses.forEach(function (c) {
      var tenu = fin > 0 && c.dort, traverse = c.nAges > 1, deduit = c.canon === 'deduit';
      var al = tenu ? 1 : traverse ? mix(0.85, 0.7, fin) : mix(0.85, 0.3, Math.max(trav, fin)), encre = tenu ? C.or : deduit ? C.amb : C.ink, plif = pli(c.x, 0.5);
      g.save(); g.globalAlpha = al; g.strokeStyle = encre; g.fillStyle = encre; g.lineWidth = (tenu ? 2 : traverse ? mix(1.1, 1.7, trav) : 1.1) * U; if (deduit) g.setLineDash([3 * U, 3 * U]);
      c.troncons.forEach(function (tr, k) {
        g.beginPath(); g.moveTo(X(c.x), Y(tr.bas + plif)); g.lineTo(X(c.x), Y(tr.haut + plif)); g.stroke();
        /* le sommeil : entre deux tronçons qui ne se touchent pas, un fil à peine visible */
        var suiv = c.troncons[k + 1];
        if (suiv && AGES.indexOf(suiv.age) - AGES.indexOf(tr.age) > 1) { g.save(); g.setLineDash([1 * U, 6 * U]); g.globalAlpha = al * 0.7; g.lineWidth = U; g.beginPath(); g.moveTo(X(c.x), Y(tr.haut + plif)); g.lineTo(X(c.x), Y(suiv.bas + plif)); g.stroke(); g.restore(); }
      });
      g.setLineDash([]);
      g.beginPath(); g.arc(X(c.x), Y(c.pied + plif), 2.8 * U, 0, 6.3); g.fill();
      g.beginPath(); g.moveTo(X(c.x - 5), Y(c.sommet + plif)); g.lineTo(X(c.x + 5), Y(c.sommet + plif)); g.stroke();
      g.restore();
    });
    g.restore();
    /* les noms, debout au-dessus de chaque fil, dès que le dépôt l'a dépassé */
    choses.forEach(function (c) {
      var plif = pli(c.x, 0.5), la = doux(seg(front, c.sommet + 6, c.sommet - 30)); if (la <= 0) return;
      var tenu = fin > 0 && c.dort, traverse = c.nAges > 1;
      /* un fil très pâle monte du sommet jusqu'à la ligne des noms */
      MG.trait(g, X(c.x), Y(c.sommet + plif - 4), X(c.x), Y(YH - 26), { encre: tenu ? C.or : C.ink, alpha: la * (tenu ? 0.5 : 0.1), points: [1 * U, 4 * U] });
      MG.ecrire(g, c.nom, X(c.x + 4.5), Y(YH - 32), 12.5 * U, { tourne: -Math.PI / 2, italique: true, encre: tenu ? C.or : traverse ? C.voile : C.pale, alpha: la * (tenu ? 1 : traverse ? mix(1, 0.75, fin) : mix(1, 0.35, Math.max(trav, fin))), graisse: tenu ? 500 : 300 });
    });
    /* les familles, sous la plus ancienne strate */
    familles.forEach(function (f) {
      MG.trait(g, X(f.x0 - 4), Y(YB + 44), X(f.x1 + 4), Y(YB + 44), { encre: C.ink, alpha: 0.3 });
      MG.ecrire(g, f.nom, X(f.x0 - 4), Y(YB + 65), 13.5 * U, { encre: C.pale, italique: true });
    });

    /* le mot immense */
    var avant = 1 - doux(seg(t, T_0 - 0.03, T_0 + 0.03));
    [['QUATRE', 'ÂGES', avant], ['CE QUI', 'DORT', fin]].forEach(function (m) { if (m[2] <= 0) return; MG.ecrire(g, m[0], X(96), Y(520), 124 * U, { nom: true, alpha: m[2] }); MG.ecrire(g, m[1], X(96), Y(632), 124 * U, { nom: true, alpha: m[2] }); });
  }

  var MOTS = ['Aucune', 'Une', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept', 'Huit'];
  function liste(a) { var n = a.map(function (c, i) { return i ? MG.bas(c.nom) : c.nom; }); return n.length > 1 ? n.slice(0, -1).join(', ') + ' et ' + n[n.length - 1] : n[0]; }
  function dire(t) {
    var depot = seg(t, T_0, T_1) * moments.length;
    if (depot <= 0) return { k: 'Le fond', b: 'Quatre âges se déposent l’un sur l’autre. Le plus ancien est en bas : tout ce qui s’est passé avant le premier plan.' };
    if (depot < moments.length) { var m = moments[Math.floor(depot)]; return { k: MG.chose['ere.' + m.ere].nom + ' · ' + MG.date(m.date), b: m.nom + '.', ouvert: /indéterminé/.test(m.date) ? 'Manque : la date. La bible du monde la laisse ouverte.' : '' }; }
    if (t < T_FIN) return { k: 'Ce qui traverse', b: (entier.length === 1 ? 'Une seule chose traverse les quatre âges : ' + entier[0].nom + '.' : entier.length + ' choses traversent les quatre âges.') + ' ' + choses.filter(function (c) { return c.nAges === 1; }).length + ' ne vivent que dans un seul.' };
    return { k: 'Ce qui dort', b: MOTS[dormeurs.length] + ' choses nées avant le film se taisent pendant tout le soupçon, puis remontent quand Assane déchiffre.', ouvert: 'Déduit : ' + liste(choses.filter(function (c) { return c.canon === 'deduit'; })) + ', que le film ne fait que nommer.' };
  }

  document.getElementById('mg-fin').textContent = 'Le soupçon tout entier se joue au-dessus de ce qui dort : ' + dormeurs.length + ' choses du monde sont là depuis le début, sous les pieds de tout le monde, et aucune scène de cet âge ne les touche.';
  MG.scene({ pas: ['le soupçon', 'le code', 'ce qui traverse', 'ce qui dort'], course: 100, composer: composer, dessiner: dessiner, dire: dire });
})();
