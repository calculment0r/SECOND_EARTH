/* SOLARIS · LE MONDE, EN GRAPHIQUE · MG-04 · De main en main.
   Une seule chose : qui tient quoi, et quand. Une ligne par main ; le temps du monde va de gauche à droite ; chaque objet est une courbe qui suit
   la main qui le tient. Quand un objet porte une inscription, un fil droit va de l'objet à la personne que l'inscription désigne.
   Le livre du père est en orange : il part de la bibliothèque Pellegrini, et son inscription y retourne.
   Dit : le passage est un moment daté de la bible du monde. Déduit (pointillé ambre) : le film ne montre pas le geste (un objet volé sans qu'on voie
   le vol, un objet rendu sans qu'on voie le retour). Manque (rond vide) : le film dit lui-même qu'il ne montre rien. */
(function () {
  'use strict';
  var M = MG.monde, seg = MG.seg, mix = MG.mix, doux = MG.doux, C = MG.C;
  var H = 'per.hubert-pellegrini', B = 'per.babakar-diop', A = 'per.assane-diop', K = 'lie.casier-assane', G = 'per.gilbert-phinelerau', V = 'per.victor-andre',
    E = 'per.ethan-masson', R = 'per.aude-rivants', D = 'per.delvaux', X_ = 'per.masque.le-maitre', O = 'fac.ecole-des-ombres';
  var MAINS = [H, B, A, K, X_, G, V, E, R, D, O], rang = {}; MAINS.forEach(function (m, i) { rang[m] = i; });
  var PERE = 'obj.livre-gentleman', LARGE = 70;

  /* ── le chemin de chaque objet : [le moment (ou le jour, si le geste n'est pas montré), la main, déduit ?] ; « fin » : le jour où on cesse de le suivre ── */
  var CHEMINS = [
    { id: PERE, pas: [['evt.avant-dedicace', H], ['evt.avant-livre-choisi', B], ['evt.avant-livre-recu', A]], fin: 12.9 },
    { id: 'obj.livre-sholmes', pas: [[0.22, G], ['evt.avant-depot-livre', K, true], ['evt.s1-livre-dans-casier', A]], fin: 7.0 },
    { id: 'obj.billets-theatre', pas: [[5.72, V], ['evt.s3-vol-billets', X_], ['evt.s3-inscription-billets', K], ['evt.s3-restitution', V]], fin: 6.5 },
    { id: 'obj.boite-musique', pas: [[6.5, E], ['evt.s5-vol-boite', X_], ['evt.s5-nuda-veritas', K], [7.35, E, true]], fin: 7.7 },
    { id: 'obj.montre-aude', pas: [[7.5, R], [7.86, X_, true], [7.98, K, true], ['evt.s7-convocation', D], [8.55, R, true]], fin: 9.0 },
    { id: 'obj.trousseau-delvaux', pas: [[8.12, D]], fin: 8.5 },
    { id: 'obj.pate-a-fixe', pas: [['evt.s8-empreinte', A]], fin: 8.62 },
    { id: 'obj.clef-fabriquee', pas: [['evt.s9-decision-traque', A]], fin: 9.3 },
    { id: 'obj.bouton-alarme', pas: [['evt.s10-alarme', X_]], fin: 9.35 },
    { id: 'obj.lettres-decoupees', pas: [['evt.s12-lettres-decoupees', A]], fin: 12.8 },
    { id: 'obj.carnet-assane', pas: [['evt.s13-carnet', X_], ['evt.s13-coffre', O]], fin: 20.55 },
    { id: 'obj.fiche-cartonnee', pas: [['evt.s13-tampon-apte', X_], [20.27, O, true]], fin: 20.55 },
  ];
  /* ── le temps du monde n'est pas régulier : des années avant, puis douze jours serrés, puis un plus tard sans date. On le déplie : chaque instant
     où un objet bouge a sa place, et les passages de main en main en ont deux fois plus ── */
  var EPOQUES = [[-3.25, 0.15, 'avant le film', true], [0.15, 2, 'jour 1'], [5.65, 7.8, 'jours 6 et 7'], [7.8, 9.5, 'jours 8 et 9'], [11.8, 13, 'jour 12'], [19.8, 20.6, 'plus tard', true]];
  var X0 = 640, X1 = 1790, Y0 = 272, PASY = 53, instants = {};
  function instant(j, poids) { instants[j] = Math.max(instants[j] || 0, poids); }
  CHEMINS.forEach(function (c) {
    c.pas.forEach(function (p, i) { instant(typeof p[0] === 'string' ? MG.moment[p[0]].jour : p[0], i ? 2.6 : 1); }); instant(c.fin, 1);
    M.moments.forEach(function (m) { if (m.objets.indexOf(c.id) >= 0) instant(m.jour, 1); });
  });
  function epoque(j) { for (var i = 0; i < EPOQUES.length; i++) if (j >= EPOQUES[i][0] && j < EPOQUES[i][1]) return i; return -1; }
  var jours = Object.keys(instants).map(Number).sort(function (a, b) { return a - b; }), cumul = [], somme = 0;
  jours.forEach(function (j, i) { somme += i ? instants[j] + (epoque(j) !== epoque(jours[i - 1]) ? 2 : 0) : 0; cumul.push(somme); });
  function xj(j) {
    if (j <= jours[0]) return X0;
    for (var i = 1; i < jours.length; i++) if (j <= jours[i]) return X0 + (X1 - X0) * mix(cumul[i - 1], cumul[i], (j - jours[i - 1]) / (jours[i] - jours[i - 1])) / somme;
    return X1;
  }
  function ym(main) { return Y0 + rang[main] * PASY; }

  CHEMINS.forEach(function (c, k) {
    c.chose = MG.chose[c.id];
    c.pts = c.pas.map(function (p) { var m = typeof p[0] === 'string' ? MG.moment[p[0]] : null, j = m ? m.jour : p[0]; return { j: j, x: xj(j), y: ym(p[1]), main: p[1], deduit: !!p[2], moment: m }; });
    c.xfin = xj(c.fin);
    /* chaque fois que le film touche l'objet : un point sur sa courbe */
    c.touches = M.moments.filter(function (m) { return m.objets.indexOf(c.id) >= 0; }).map(function (m) { return { x: xj(m.jour), moment: m }; });
    /* un léger décalage, pour que deux objets dans la même main ne se recouvrent pas */
    c.discret = c.pts.length === 1 || c.id === 'obj.fiche-cartonnee';
    c.dy = c.id === PERE ? 0 : c.discret ? 9 : ((k % 3) - 1) * 5;
  });
  function hauteur(c, x) {   /* où est l'objet (quelle main) à cet endroit du temps */
    var y = c.pts[0].y;
    for (var i = 1; i < c.pts.length; i++) { var p = c.pts[i], l = Math.min(LARGE, (p.x - c.pts[i - 1].x) * 0.92); if (x >= p.x) y = p.y; else if (x > p.x - l) { var u = doux((x - (p.x - l)) / l); y = mix(c.pts[i - 1].y, p.y, u); break; } else break; }
    return y + c.dy;
  }
  /* ── les inscriptions : portées par un objet, elles désignent quelqu'un ── */
  var designe = [];
  M.liens.filter(function (l) { return l.lien === 'DESIGNE'; }).forEach(function (l) {
    var porte = M.liens.filter(function (p) { return p.lien === 'PORTE' && p.vers === l.de; })[0], c = CHEMINS.filter(function (c) { return porte && c.id === porte.de; })[0]; if (!c) return;
    var lus = M.moments.filter(function (m) { return m.jour >= 1 && m.objets.indexOf(l.de) >= 0 && m.objets.indexOf(c.id) >= 0; });
    if (l.de === 'obj.insc.liber-pugna-theleri') lus = [MG.moment[l.vers === H ? 'evt.s12-a-hubert-pellegrini' : 'evt.s12-gilbert-phinelerau']];
    if (!lus.length) return;
    designe.push({ insc: MG.chose[l.de], vers: l.vers, chemin: c, moment: lus[0], x: xj(lus[0].jour), fausse: l.de === 'obj.insc.liber-pugna-theleri' && l.vers !== H });
  });
  var fils = M.moments.filter(function (m) { return m.objets.some(function (o) { return CHEMINS.some(function (c) { return c.id === o; }); }); }).sort(function (a, b) { return a.jour - b.jour; });

  var ox = 0, oy = 0, U = 1;
  function X(v) { return ox + v * U; } function Y(v) { return oy + v * U; }
  function composer(L, Ht, u) { U = u; ox = (L - 2000 * u) / 2; oy = (Ht - 1069 * u) / 2; }
  var T_0 = 0.03, T_1 = 0.76, T_FIN = 0.8;

  function dessiner(g, t, L, Ht) {
    var av = seg(t, T_0, T_1), fin = doux(seg(t, T_FIN, 0.98)), tete = av <= 0 ? X0 - 2 : mix(X0, X1 + 4, av), YB = Y0 + (MAINS.length - 1) * PASY;

    /* les mains : une ligne très fine par personne ; le casier est un lieu, il est en italique */
    MAINS.forEach(function (m) {
      var y = ym(m), lieu = m === K, c = MG.chose[m];
      MG.trait(g, X(X0), Y(y), X(X1), Y(y), { encre: C.ink, alpha: lieu ? 0.2 : 0.1, points: lieu ? [1 * U, 5 * U] : null });
      MG.ecrire(g, c.nom, X(X0 - 34), Y(y + 5), 17 * U, { aligne: 'right', italique: lieu, encre: lieu ? C.pale : C.ink, alpha: fin > 0 && (m === H || m === A) ? 1 : mix(1, 0.6, fin) });
    });
    /* le temps : ce qui est daté en trait plein, ce qui ne l'est pas en trait interrompu */
    EPOQUES.forEach(function (e) {
      var js = jours.filter(function (j) { return j >= e[0] && j < e[1]; }), a = xj(js[0]) - 8, b = xj(js[js.length - 1]) + 8;
      MG.trait(g, X(a), Y(YB + 44), X(b), Y(YB + 44), { encre: C.ink, alpha: 0.4, points: e[3] ? [2 * U, 5 * U] : null });
      MG.ecrire(g, e[2], X(a), Y(YB + 66), 13.5 * U, { italique: !!e[3], encre: C.pale });
    });

    g.save(); g.beginPath(); g.rect(0, 0, X(tete), Ht); g.clip();
    /* ce que les inscriptions désignent : un fil droit, de l'objet vers la personne nommée */
    designe.forEach(function (d) {
      var y0 = hauteur(d.chemin, d.x), y1 = ym(d.vers), orange = d.chemin.id === PERE && !d.fausse, a = d.fausse ? 0.35 : orange ? 1 : 0.6;
      MG.trait(g, X(d.x), Y(y0), X(d.x), Y(y1), { encre: orange ? C.or : C.ink, alpha: a, gras: U });
      g.save(); g.globalAlpha = a; g.strokeStyle = orange ? C.or : C.ink; g.fillStyle = C.bg; g.lineWidth = 1.3 * U; g.beginPath(); g.arc(X(d.x), Y(y1), 5 * U, 0, 6.3); g.fill(); g.stroke(); g.restore();
      MG.ecrire(g, d.insc.nom, X(d.x + 10), Y(y1 > y0 ? y1 + 21 : y1 - 13), 13 * U, { lisere: 5 * U, italique: true, encre: orange ? C.or : C.pale, alpha: d.fausse ? 0.6 : 1 });
    });
    /* les objets : une courbe chacun, de main en main */
    CHEMINS.forEach(function (c) {
      var pere = c.id === PERE, encre = pere ? C.or : C.ink;
      for (var i = 0; i < c.pts.length; i++) {
        var p = c.pts[i], q = c.pts[i + 1], x0 = i ? p.x : p.x, x1 = q ? q.x - Math.min(LARGE, (q.x - p.x) * 0.92) : c.xfin;
        g.save(); g.strokeStyle = p.deduit ? C.amb : encre; g.lineWidth = (pere ? 2.4 : 1.3) * U; g.globalAlpha = pere ? 1 : mix(0.86, 0.5, fin); if (p.deduit) g.setLineDash([3 * U, 4 * U]);
        g.beginPath();
        if (i) { var o = c.pts[i - 1], l = Math.min(LARGE, (p.x - o.x) * 0.92), xa = p.x - l; g.moveTo(X(xa), Y(o.y + c.dy)); g.bezierCurveTo(X(xa + l * 0.55), Y(o.y + c.dy), X(p.x - l * 0.55), Y(p.y + c.dy), X(p.x), Y(p.y + c.dy)); }
        else g.moveTo(X(x0), Y(p.y + c.dy));
        g.lineTo(X(Math.max(x1, p.x)), Y(p.y + c.dy)); g.stroke(); g.restore();
      }
      /* le nom de l'objet, au départ de sa courbe ; les points où le film le touche */
      var d0 = c.pts[0];
      var pres = c.discret ? (av < 1 ? doux(1 - Math.min(1, Math.abs(tete - (d0.x + c.xfin) / 2) / 90)) : 0) : 1;
      if (pres > 0) MG.ecrire(g, c.chose.nom, X(d0.x > X1 - 220 ? c.xfin : d0.x), Y(c.discret ? d0.y + c.dy + 22 : d0.y + c.dy - 12), 13 * U, { lisere: 5 * U, aligne: d0.x > X1 - 220 ? 'right' : 'left', italique: true, encre: pere ? C.or : C.voile, alpha: pres * (pere ? 1 : mix(1, 0.4, fin)) });
      g.save(); g.fillStyle = encre; g.globalAlpha = pere ? 1 : mix(0.9, 0.4, fin);
      g.beginPath(); g.arc(X(d0.x), Y(d0.y + c.dy), 3.4 * U, 0, 6.3); g.fill();
      c.touches.forEach(function (tc) { g.beginPath(); g.arc(X(tc.x), Y(hauteur(c, tc.x)), 2.4 * U, 0, 6.3); g.fill(); });
      g.restore();
    });
    /* ce qui manque : entre l'empreinte du matin et la clef du soir, le film ne montre rien */
    var xm = (xj(8.62) + xj(MG.moment['evt.s9-decision-traque'].jour)) / 2, ymq = ym(A) + 9;
    g.save(); g.strokeStyle = C.pale; g.lineWidth = 1.2 * U; g.beginPath(); g.arc(X(xm), Y(ymq), 6 * U, 0, 6.3); g.stroke(); g.restore();
    g.restore();

    /* la tête de lecture : un trait fin, tant qu'on avance */
    if (av > 0 && av < 1) MG.trait(g, X(tete), Y(Y0 - 30), X(tete), Y(YB + 30), { encre: C.ink, alpha: 0.3 });

    /* le mot immense : ce que le livre du père disait depuis le début */
    if (fin > 0) MG.ecrire(g, MG.moment['evt.s12-a-hubert-pellegrini'].nom, X(X1), Y(200), 92 * U, { nom: true, aligne: 'right', alpha: fin });
    var avant = 1 - doux(seg(t, T_0 - 0.04, T_0 + 0.03));
    if (avant > 0) MG.ecrire(g, 'DOUZE OBJETS', X(X1), Y(200), 92 * U, { nom: true, aligne: 'right', alpha: avant });
  }

  function dire(t) {
    var av = seg(t, T_0, T_1), tete = mix(X0, X1 + 4, av);
    if (av <= 0) return { k: 'Les mains', b: 'Onze lignes : dix mains et un casier. Le temps du monde va de gauche à droite.', ouvert: 'Manque : la date d’avant le film, et celle d’après.' };
    if (av < 1) {
      var m = null; fils.forEach(function (f) { if (xj(f.jour) <= tete) m = f; });
      if (!m) return { k: 'Avant le film', b: 'Rien n’a encore bougé.' };
      var montre = m.jour < 1 || /montre jamais/.test(m.texte);
      return { k: MG.date(m.date) + (m.seq ? ' · séquence ' + M.sequences[MG.rangSeq[m.seq]].n : ''), b: m.nom + '.', ouvert: m.id === 'evt.avant-depot-livre' ? 'Déduit : le film ne montre jamais ce geste.' : m.id === 'evt.s9-decision-traque' ? 'Manque : entre l’empreinte du matin et la clef du soir, le film ne montre rien.' : '' };
    }
    return { k: 'Ce qu’on voit', b: 'Quatre objets volés passent par la même main, puis par le même casier. Le livre du père, lui, ne bouge plus : c’est son inscription qui remonte d’où il vient.',
      ouvert: 'Déduit : deux vols et deux retours que le film ne montre pas.' };
  }

  document.getElementById('mg-fin').textContent = 'Chaque objet volé porte le nom du suivant : le livre désigne Victor, ses billets désignent Éthan, sa boîte désigne Aude, sa montre désigne Assane. Et le seul livre qu’on ne lui a pas volé désignait, depuis toujours, l’homme chez qui son père l’avait pris.';
  MG.scene({ pas: ['le premier livre', 'les vols', 'la nuit', 'ce qu’on voit'], course: 100, composer: composer, dessiner: dessiner, dire: dire });
})();
