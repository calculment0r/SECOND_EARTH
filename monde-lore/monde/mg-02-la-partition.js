/* SOLARIS · LE MONDE, EN GRAPHIQUE · MG-02 · La partition.
   Une seule chose : sur quelles règles du monde chaque séquence s'appuie. Onze règles, onze portées ; le film passe de gauche à droite, à sa vraie durée ;
   une séquence qui s'appuie sur une règle y pose une note. Une liaison relie deux notes de la même règle. Deux notes sont barrées : là où le film
   force sa propre règle, et la portée s'interrompt.
   Dit (note pleine) : la séquence où la règle paraît, celles que ses faits citent, le moment qui la pose ou la force.
   Déduit (note en pointillé ambre) : ce qui se passe dans la séquence la fait jouer (un objet dans le casier, une inscription, le Maître à l'œuvre…). */
(function () {
  'use strict';
  var M = MG.monde, seg = MG.seg, mix = MG.mix, doux = MG.doux, C = MG.C, N = MG.duree;
  var MAITRE = 'per.masque.le-maitre', ASSANE = 'per.assane-diop', ACCUSENT = ['per.delvaux', 'per.victor-andre', 'per.kevin-dubois', 'per.aude-rivants', 'fac.meute'];
  function inscrit(m) { return m.objets.some(function (o) { return o.indexOf('obj.insc.') === 0; }); }
  /* ce qui fait jouer une règle dans une séquence, quand le texte ne le dit pas lui-même */
  var DEDUIRE = {
    'reg.casier-assane-regle': function (m) { return m.lieu === 'lie.casier-assane'; },
    'reg.signature-latine': inscrit,
    'reg.anagramme-exacte': function (m, si) { return si >= 5 && inscrit(m); },
    'reg.objet-rendu': function (m) { return /restitution|offre/.test(m.id); },
    'reg.pas-de-mot': function (m, si) { return si >= 9 && m.qui.indexOf(MAITRE) >= 0; },
    'reg.jamais-violence': function (m, si) { return si >= 9 && m.qui.indexOf(MAITRE) >= 0; },
    'reg.un-coup-avance': function (m) { return m.qui.indexOf(MAITRE) >= 0; },
    'reg.preuve-incrimine': function (m, si) { return si >= 2 && m.qui.indexOf(ASSANE) >= 0 && m.qui.some(function (q) { return ACCUSENT.indexOf(q) >= 0; }); },
    'reg.deuxieme-couverture': function (m) { return inscrit(m) && m.objets.some(function (o) { return /livre|carnet/.test(o); }); },
    'reg.rien-par-hasard': function (m) { return m.id === 'evt.s4-confrontation-livres'; },
  };

  var regles = M.choses.filter(function (c) { return c.type === 'RÈGLE'; }).map(function (r) {
    var notes = {};
    function note(si) { return notes[si] || (notes[si] = { seq: si, n: 0, dit: false, nee: false, forcee: null }); }
    note(MG.rangSeq[r.vu]).dit = true;
    r.faits.forEach(function (f) { if (f.a in MG.rangSeq) note(MG.rangSeq[f.a]).dit = true; });
    M.liens.forEach(function (l) {
      if (l.vers !== r.id || !MG.moment[l.de]) return;
      var m = MG.moment[l.de], si = MG.rangSeq[m.seq]; if (si === undefined) return;
      if (l.lien === 'INSTAURE_REGLE') { note(si).dit = true; note(si).pose = m; }
      if (l.lien === 'VIOLE_REGLE') { note(si).dit = true; note(si).forcee = m; }
    });
    M.moments.forEach(function (m) { var si = MG.rangSeq[m.seq]; if (si === undefined || !DEDUIRE[r.id] || !DEDUIRE[r.id](m, si)) return; note(si).n++; });
    var liste = Object.keys(notes).map(function (k) { return notes[k]; }).sort(function (a, b) { return a.seq - b.seq; });
    liste[0].nee = true;
    return { id: r.id, nom: r.nom, notes: liste, de: liste[0].seq };
  });
  regles.sort(function (a, b) { return a.de - b.de || b.notes.length - a.notes.length; });
  regles.forEach(function (r, i) { r.rang = i; });
  regles.slice().sort(function (a, b) { return b.notes.length - a.notes.length || a.rang - b.rang; }).forEach(function (r, i) { r.poids = i; });
  var forcees = []; regles.forEach(function (r) { r.notes.forEach(function (n) { if (n.forcee) forcees.push({ regle: r, note: n }); }); });
  var seule = regles.filter(function (r) { return r.notes.length === 1; }), plus = regles.slice().sort(function (a, b) { return a.poids - b.poids; })[0];
  var parSeq = M.sequences.map(function (s, si) { return regles.filter(function (r) { return r.notes.some(function (n) { return n.seq === si; }); }); });

  var ox = 0, oy = 0, U = 1;
  function X(x) { return ox + x * U; } function Y(y) { return oy + y * U; }
  var X0 = 590, X1 = 1790, Y0 = 262, PASY = 50;
  function xs(s) { return X0 + (X1 - X0) * s / N; }
  function xn(si) { var s = M.sequences[si]; return xs((s.d0 + s.d1) / 2); }
  function composer(L, H, u) { U = u; ox = (L - 2000 * u) / 2; oy = (H - 1069 * u) / 2; }

  var T_JEU0 = 0.04, T_JEU1 = 0.64, T_POIDS = 0.68, T_FIN = 0.84;

  function dessiner(g, t, L, H) {
    var jeu = seg(t, T_JEU0, T_JEU1), poids = doux(seg(t, T_POIDS, T_FIN)), fin = doux(seg(t, T_FIN, 0.99)), joue = jeu > 0 && jeu < 1;
    var teteS = jeu * N, teteX = jeu >= 1 ? X1 + 40 : jeu <= 0 ? X0 - 1 : xs(teteS), seqIci = -1;
    if (joue) M.sequences.forEach(function (s, si) { if (teteS >= s.d0 && teteS < s.d1) seqIci = si; });
    function yr(r) { return Y0 + mix(r.rang, r.poids, poids) * PASY; }

    /* les mesures : une barre fine à chaque changement de séquence, son numéro au-dessus */
    M.sequences.forEach(function (s, si) {
      MG.trait(g, X(xs(s.d0)), Y(Y0 - 30), X(xs(s.d0)), Y(Y0 + 10 * PASY + 30), { encre: C.ink, alpha: 0.09 });
      MG.ecrire(g, String(s.n), X(xn(si)), Y(Y0 - 44), 15 * U, { encre: si === seqIci ? C.or : C.pale, aligne: 'center', graisse: si === seqIci ? 500 : 300 });
    });
    MG.trait(g, X(X1), Y(Y0 - 30), X(X1), Y(Y0 + 10 * PASY + 30), { encre: C.ink, alpha: 0.09 });

    regles.forEach(function (r) {
      var y = yr(r), xNee = xn(r.de), casse = null, tenue = joue && r.notes.some(function (n) { return n.seq === seqIci; }), lourd = 1 + poids * (r.notes.length - 1) * 0.42;
      r.notes.forEach(function (n) { if (n.forcee && xn(n.seq) <= teteX) casse = n; });
      /* le nom, à gauche ; un fil très pâle le relie à l'endroit où la règle naît */
      MG.ecrire(g, r.nom, X(X0 - 34), Y(y + 5), 17 * U, { aligne: 'right', encre: C.ink, alpha: tenue || !joue ? 1 : 0.5, italique: true });
      MG.trait(g, X(X0 - 18), Y(y), X(xNee), Y(y), { encre: C.ink, alpha: 0.1 });
      /* la portée : elle commence où la règle paraît ; forcée, elle s'interrompt et ne revient que pâle */
      var fx = Math.min(teteX, X1);
      if (fx > xNee) {
        if (casse && xn(casse.seq) < fx) {
          MG.trait(g, X(xNee), Y(y), X(xn(casse.seq)), Y(y), { encre: C.ink, alpha: 0.62, gras: lourd * U });
          MG.trait(g, X(xn(casse.seq) + 34), Y(y), X(fx), Y(y), { encre: C.ink, alpha: 0.2, points: [2 * U, 5 * U] });
        } else MG.trait(g, X(xNee), Y(y), X(fx), Y(y), { encre: C.ink, alpha: 0.62, gras: lourd * U });
      }
      /* les liaisons : d'une note à la suivante, sur la même règle */
      for (var k = 1; k < r.notes.length; k++) {
        var a = r.notes[k - 1], b = r.notes[k], xa = xn(a.seq), xb = xn(b.seq); if (xb > teteX) break;
        var haut = Math.min(40, 12 + (xb - xa) * 0.07), deduit = !a.dit || !b.dit;
        g.save(); g.strokeStyle = deduit ? C.amb : C.ink; g.globalAlpha = deduit ? 0.8 : 0.5; g.lineWidth = U; if (deduit) g.setLineDash([2 * U, 4 * U]);
        g.beginPath(); g.moveTo(X(xa), Y(y)); g.quadraticCurveTo(X((xa + xb) / 2), Y(y - haut * 2), X(xb), Y(y)); g.stroke(); g.restore();
      }
      /* les notes */
      r.notes.forEach(function (n) {
        var x = xn(n.seq); if (x > teteX) return;
        var ray = (5.5 + Math.min(4, n.n) * 1.5) * U, ici = n.seq === seqIci, encre = ici || (fin > 0.5 && n.forcee) ? C.or : n.dit ? C.ink : C.amb;
        g.save(); g.translate(X(x), Y(y));
        if (n.dit) { g.fillStyle = encre; g.beginPath(); g.arc(0, 0, ray, 0, 6.3); g.fill(); }
        else { g.fillStyle = C.bg; g.beginPath(); g.arc(0, 0, ray, 0, 6.3); g.fill(); g.strokeStyle = encre; g.lineWidth = 1.4 * U; g.setLineDash([2.5 * U, 3 * U]); g.beginPath(); g.arc(0, 0, ray, 0, 6.3); g.stroke(); }
        if (n.nee) { g.setLineDash([]); g.strokeStyle = encre; g.globalAlpha = 0.55; g.lineWidth = U; g.beginPath(); g.arc(0, 0, ray + 6 * U, 0, 6.3); g.stroke(); g.globalAlpha = 1; }
        if (n.forcee) { g.setLineDash([]); g.strokeStyle = encre; g.lineWidth = 1.6 * U; g.beginPath(); g.moveTo(-ray - 9 * U, ray + 9 * U); g.lineTo(ray + 9 * U, -ray - 9 * U); g.stroke(); }
        g.restore();
        if (n.forcee && fin > 0) {
          MG.ecrire(g, n.forcee.nom, X(x), Y(y + 34), 15 * U, { aligne: 'center', italique: true, encre: C.or, alpha: fin });
        }
      });
    });

    /* l'accord : dans la séquence qu'on joue, un trait fin relie les règles qui sonnent ensemble */
    if (seqIci >= 0 && parSeq[seqIci].length) {
      var ys = parSeq[seqIci].map(yr), xc = xn(seqIci);
      MG.trait(g, X(xc), Y(Math.min.apply(null, ys)), X(xc), Y(Math.max.apply(null, ys)), { encre: C.or, alpha: 0.8, gras: U });
    }
    /* la tête de lecture */
    if (joue) MG.trait(g, X(teteX), Y(Y0 - 30), X(teteX), Y(Y0 + 10 * PASY + 30), { encre: C.or, alpha: 0.35 });

    /* le mot immense : avant que le film se joue, puis ce qu'il laisse */
    var avant = 1 - doux(seg(t, T_JEU0 - 0.02, T_JEU0 + 0.04));
    if (avant > 0) MG.ecrire(g, 'ONZE RÈGLES', X(X1), Y(190), 104 * U, { nom: true, aligne: 'right', alpha: avant });
    if (fin > 0) MG.ecrire(g, forcees.length === 2 ? 'DEUX ENTORSES' : forcees.length + ' ENTORSES', X(X1), Y(190), 104 * U, { nom: true, aligne: 'right', alpha: fin });
  }

  var MOTS = ['Aucune', 'Une', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept', 'Huit', 'Neuf', 'Dix', 'Onze'];
  function dire(t) {
    var jeu = seg(t, T_JEU0, T_JEU1);
    if (jeu <= 0) return { k: 'La portée', b: 'Onze règles tiennent ce monde. Chacune est une ligne, qui commence là où le film la pose.' };
    if (jeu < 1) {
      var si = 0; M.sequences.forEach(function (s, k) { if (jeu * N >= s.d0) si = k; });
      var s = M.sequences[si], rs = parSeq[si], f = forcees.filter(function (x) { return x.note.seq === si; })[0];
      return { k: 'Séquence ' + s.n + ' · ' + s.titre, b: rs.length ? MOTS[rs.length] + (rs.length > 1 ? ' règles jouent ensemble.' : ' règle joue : « ' + rs[0].nom + ' ».') : 'Aucune règle ne joue.',
        ouvert: f ? 'Ici le film force sa propre règle, « ' + f.regle.nom + ' » : ' + MG.bas(f.note.forcee.nom) + '.' : '' };
    }
    return { k: 'Ce qui pèse', b: '« ' + plus.nom + ' » joue dans ' + MOTS[plus.notes.length].toLowerCase() + ' séquences sur treize' + (seule.length ? ' ; « ' + seule[0].nom + ' », une seule fois.' : '.'),
      ouvert: 'Déduit : une note en pointillé vient de ce qui se passe dans la séquence, pas d’une phrase qui le dit.' };
  }

  document.getElementById('mg-fin').textContent = 'Le film pose onze règles et en force ' + (forcees.length === 2 ? 'deux' : forcees.length) + ' : ' + forcees.map(function (f) { return '« ' + f.regle.nom + ' », séquence ' + M.sequences[f.note.seq].n + ' (' + MG.bas(f.note.forcee.nom) + ')'; }).join(' ; ') + '. Ce sont les deux endroits où l’auteur a choisi de plier son monde.';
  MG.scene({ pas: ['les séquences 1 à 6', 'les séquences 7 à 13', 'ce qui pèse'], course: 120, composer: composer, dessiner: dessiner, dire: dire });
})();
