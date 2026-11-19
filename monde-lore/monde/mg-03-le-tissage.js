/* SOLARIS · LE MONDE, EN GRAPHIQUE · MG-03 · Le tissage.
   Une seule chose : ce qui tient ce monde ensemble. Chaque chose du monde est un fil debout (la chaîne) ; chaque lien est une duite, un fil couché
   qui va de l'une à l'autre et passe dessus, dessous les fils qu'il croise. Cent liens, trois natures, tissés un par un à la molette.
   À la fin, on ne garde allumé que le fil par lequel passent le plus de liens.
   Dit : le lien est écrit dans la bible du monde. Déduit (pointillé ambre) : la bible elle-même le donne pour moins sûr. */
(function () {
  'use strict';
  var M = MG.monde, seg = MG.seg, mix = MG.mix, doux = MG.doux, C = MG.C;
  var VERBE = { PARENT_DE: 'est le père de', EMPLOIE: 'emploie', MEMBRE_DE: 'fait partie de', SITUE_DANS: 'se trouve dans', POSSEDE: 'possède', PORTE: 'porte', DESIGNE: 'désigne',
    ADMIRE: 'admire', PROTEGE: 'protège', SOUPCONNE: 'soupçonne', HAIT: 'hait', AIME: 'aime', MANIPULE: 'manipule', CRAINT: 'craint',
    CAUSE: 'entraîne', PERMET: 'permet', REVELE: 'révèle', INSTAURE_REGLE: 'pose la règle', VIOLE_REGLE: 'force la règle' };
  var NATURES = [['STRUCTUREL', 'ce qui est'], ['DRAMATIQUE', 'ce qu’on éprouve'], ['CAUSAL', 'ce qui entraîne']];
  var TYPES = ['PERSONNAGE', 'FACTION', 'LIEU', 'OBJET', 'RÈGLE'];
  function nom(id) { return (MG.chose[id] || MG.moment[id]).nom; }

  /* ── la chaîne : les choses que touche au moins un lien, par famille puis par entrée dans le film ; ensuite les moments, dans l'ordre du temps ── */
  var touche = {}; M.liens.forEach(function (l) { touche[l.de] = (touche[l.de] || 0) + 1; touche[l.vers] = (touche[l.vers] || 0) + 1; });
  var choses = M.choses.filter(function (c) { return touche[c.id]; }).sort(function (a, b) {
    return TYPES.indexOf(a.type) - TYPES.indexOf(b.type) || (a.sous > b.sous ? 1 : a.sous < b.sous ? -1 : 0) || MG.rangSeq[a.vu] - MG.rangSeq[b.vu];
  });
  var moments = M.moments.filter(function (m) { return touche[m.id]; }).sort(function (a, b) { return a.jour - b.jour; });
  function quand(m) { return m.jour < 1 ? 'avant' : String(M.sequences[MG.rangSeq[m.seq]].n); }
  var PAS_C = 17, PAS_M = 7.6, X0 = 600, col = {}, fils = [], x = X0;
  choses.forEach(function (c, i) { if (i && c.type !== choses[i - 1].type) x += 12; col[c.id] = fils.length; fils.push({ id: c.id, x: x, chose: c }); x += PAS_C; });
  x += 16;
  moments.forEach(function (m, i) { if (i && quand(m) !== quand(moments[i - 1])) x += 5; col[m.id] = fils.length; fils.push({ id: m.id, x: x, moment: m }); x += PAS_M; });
  var X1 = x - PAS_M;
  var premier = choses.slice().sort(function (a, b) { return touche[b.id] - touche[a.id]; })[0];

  /* ── la trame : cent duites, en trois bandes ; dans chaque bande, rangées pour que la main suive (de gauche à droite) ── */
  var Y0 = 372, Y1 = 872, ECART = 20, duites = [];
  NATURES.forEach(function (n, b) {
    M.liens.filter(function (l) { return l.nature === n[0]; }).sort(function (p, q) {
      return Math.min(col[p.de], col[p.vers]) - Math.min(col[q.de], col[q.vers]) || Math.max(col[p.de], col[p.vers]) - Math.max(col[q.de], col[q.vers]);
    }).forEach(function (l) { duites.push({ lien: l, bande: b, a: col[l.de], b: col[l.vers] }); });
  });
  var PAS_D = (Y1 - Y0 - 2 * ECART) / (duites.length - 1);
  duites.forEach(function (d, k) { d.k = k; d.y = Y0 + k * PAS_D + d.bande * ECART; d.tenu = d.lien.de === premier.id || d.lien.vers === premier.id; });
  var bandes = NATURES.map(function (n, b) { var ds = duites.filter(function (d) { return d.bande === b; }); return { nom: n[1], n: ds.length, y0: ds[0].y, y1: ds[ds.length - 1].y, de: ds[0].k }; });
  var nTenus = duites.filter(function (d) { return d.tenu; }).length;

  var ox = 0, oy = 0, U = 1;
  function X(v) { return ox + v * U; } function Y(v) { return oy + v * U; }
  function composer(L, H, u) { U = u; ox = (L - 2000 * u) / 2; oy = (H - 1069 * u) / 2; }

  var T_FIN = 0.82;
  /* la navette : chaque bande se tisse pendant son propre temps de la scène */
  function navette(t) { var n = 0; bandes.forEach(function (b, i) { n += seg(t, 0.2 + i * 0.2, 0.4 + i * 0.2 - 0.02) * b.n; }); return n; }

  function dessiner(g, t, L, H) {
    var tisse = navette(t), fin = doux(seg(t, T_FIN, 0.97)), pousse = seg(t, 0, 0.17), enCours = tisse > 0 && tisse < duites.length ? duites[Math.floor(tisse)] : null;

    /* la chaîne : un fil debout par chose, son nom couché au-dessus ; les moments restent sans nom, rangés par séquence */
    fils.forEach(function (f, fi) {
      var long = doux(seg(pousse, (fi / fils.length) * 0.8, (fi / fils.length) * 0.8 + 0.2)), tenu = f.id === premier.id, vise = enCours && (f.id === enCours.lien.de || f.id === enCours.lien.vers), a = tenu ? mix(0.3, 1, fin) : mix(0.3, 0.12, fin);
      MG.trait(g, X(f.x), Y(Y0 - 16), X(f.x), Y(mix(Y0 + 6, Y1 + 16, long)), { encre: tenu && fin > 0 ? C.or : C.ink, alpha: f.moment ? a * 0.7 : a, gras: tenu ? mix(1, 2.2, fin) * U : U });
      if (f.chose) MG.ecrire(g, f.chose.nom, X(f.x + 3), Y(Y0 - 26), 13.5 * U, { tourne: -Math.PI / 3.1, italique: true, encre: tenu && fin > 0 ? C.or : vise ? C.ink : C.pale, alpha: tenu || vise ? 1 : mix(1, 0.4, fin), graisse: tenu && fin > 0 ? 500 : 300 });
    });
    var vu = '';
    moments.forEach(function (m) { var f = fils[col[m.id]], e = quand(m); if (e === vu) return; vu = e; MG.ecrire(g, e, X(f.x - 2), Y(Y1 + 38), 13 * U, { encre: C.pale, italique: e === 'avant', aligne: e === 'avant' ? 'center' : 'left' }); });
    MG.ecrire(g, 'les moments, séquence par séquence', X(X1), Y(Y1 + 60), 13 * U, { encre: C.pale, italique: true, aligne: 'right' });

    /* les trois bandes, nommées quand la navette y entre */
    bandes.forEach(function (b) {
      var a = tisse > 0 ? doux(seg(tisse, b.de, b.de + 3)) * (1 - fin) : 0; if (a <= 0) return;
      MG.ecrire(g, b.nom, X(X0 - 34), Y((b.y0 + b.y1) / 2 + 2), 18 * U, { aligne: 'right', italique: true, alpha: a });
      MG.ecrire(g, b.n + ' liens', X(X0 - 34), Y((b.y0 + b.y1) / 2 + 24), 13.5 * U, { aligne: 'right', encre: C.pale, alpha: a });
    });

    /* la trame : chaque duite va d'un fil à l'autre ; elle passe dessus un fil sur deux, et dessous les autres */
    duites.forEach(function (d) {
      if (d.k >= tisse) return;
      var part = d === enCours ? Math.max(0.02, tisse - d.k) : 1, xa = fils[d.a].x, xb = fils[d.b].x, xj = mix(xa, xb, part), g0 = Math.min(xa, xj), g1 = Math.max(xa, xj);
      var deduit = d.lien.sur !== 'haute', encre = d === enCours ? C.or : deduit ? C.amb : C.ink, a = d === enCours ? 1 : d.tenu ? mix(0.74, 1, fin) : mix(0.74, 0.13, fin);
      g.save(); g.strokeStyle = encre; g.globalAlpha = a; g.lineWidth = (0.5 + d.lien.poids * 0.3) * U; if (deduit) g.setLineDash([3 * U, 3 * U]);
      g.beginPath();
      var debut = g0, lo = Math.min(d.a, d.b), hi = Math.max(d.a, d.b);
      for (var c = lo + 1; c < hi; c++) {
        var xc = fils[c].x; if (xc > g1) break;
        if ((c + d.k) % 2 === 0 && xc > g0) { g.moveTo(X(debut), Y(d.y)); g.lineTo(X(xc) - 2.2 * U, Y(d.y)); debut = xc + 2.2; }
      }
      g.moveTo(X(debut), Y(d.y)); g.lineTo(X(g1), Y(d.y)); g.stroke();
      g.setLineDash([]); g.fillStyle = encre;
      g.fillRect(X(xa) - 1.5 * U, Y(d.y) - 3 * U, 3 * U, 6 * U);
      if (part >= 1) { g.beginPath(); g.arc(X(xb), Y(d.y), 2.6 * U, 0, 6.3); g.fill(); }
      else { g.beginPath(); g.arc(X(xj), Y(d.y), 4.5 * U, 0, 6.3); g.fill(); }
      g.restore();
    });

    /* le mot immense : ce qu'on va tisser, puis le fil qui tient le plus */
    var avant = 1 - doux(seg(t, 0.15, 0.21));
    if (avant > 0) { MG.ecrire(g, 'CENT', X(96), Y(560), 150 * U, { nom: true, alpha: avant }); MG.ecrire(g, 'LIENS', X(96), Y(690), 150 * U, { nom: true, alpha: avant }); }
    if (fin > 0) {
      MG.ecrire(g, MG.nu(premier.nom).split(' ')[0].toUpperCase(), X(96), Y(600), 132 * U, { nom: true, encre: C.or, alpha: fin });
      MG.ecrire(g, nTenus + ' liens sur ' + duites.length + ' passent par lui', X(100), Y(640), 17 * U, { italique: true, encre: C.pale, alpha: fin });
    }
  }

  function phrase(l) { var b = nom(l.vers); return nom(l.de) + ' ' + VERBE[l.lien] + ' ' + (b.charAt(0) === '«' ? b : MG.bas(b)) + '.'; }
  function dire(t) {
    var tisse = navette(t);
    if (tisse <= 0) return { k: 'La chaîne', b: 'Un fil debout par chose du monde : les gens, les groupes, les lieux, les objets, les règles, puis les moments.' };
    if (tisse < duites.length) {
      var d = duites[Math.floor(tisse)];
      return { k: 'Lien ' + (d.k + 1) + ' sur ' + duites.length + ' · ' + bandes[d.bande].nom, b: phrase(d.lien), ouvert: d.lien.sur !== 'haute' ? 'Déduit : la bible du monde donne ce lien pour moins sûr que les autres.' : '' };
    }
    var seuls = choses.filter(function (c) { return touche[c.id] === 1; }).length;
    return { k: 'Ce qui tient', b: 'Sur cent liens, ' + nTenus + ' passent par ' + premier.nom + '. Qu’on tire ce fil, et l’étoffe vient avec.', ouvert: 'Reste ouvert : ' + seuls + ' choses du monde ne tiennent que par un seul lien.' };
  }

  document.getElementById('mg-fin').textContent = 'La bande du bas dessine un escalier : chaque moment entraîne le suivant, sans un seul retour en arrière. Au-dessus, presque tout ce qu’on éprouve dans ce film se dirige vers le même fil.';
  MG.scene({ pas: ['la chaîne', 'ce qui est', 'ce qu’on éprouve', 'ce qui entraîne', 'ce qui tient'], course: 80, composer: composer, dessiner: dessiner, dire: dire });
})();
