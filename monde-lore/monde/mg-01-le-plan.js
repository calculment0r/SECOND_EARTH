/* SOLARIS · LE MONDE, EN GRAPHIQUE · MG-01 · Le plan.
   Une seule chose : où le film passe son temps. Le film dure dix minutes vingt : six cent vingt secondes, un trait par seconde.
   La molette range chaque seconde dans le lieu où elle se passe ; le ruban du film devient un plan en masses, puis le film repasse, séquence par séquence.
   Ce qui est dit : la durée de chaque séquence. Ce qui est déduit : dans une séquence, le temps est partagé à parts égales entre ses moments. */
(function () {
  'use strict';
  var M = MG.monde, seg = MG.seg, mix = MG.mix, doux = MG.doux, C = MG.C;

  /* ── chaque seconde du film : sa séquence, son lieu (les moments d'avant le film, racontés et jamais montrés, n'en prennent aucune) ── */
  var secondes = [];
  M.sequences.forEach(function (s, si) {
    var ms = M.moments.filter(function (m) { return m.seq === s.a && m.jour >= 1 && m.lieu; }), n = s.d1 - s.d0;
    for (var k = 0; k < n; k++) { var m = ms[Math.min(ms.length - 1, Math.floor(k * ms.length / n))]; secondes.push({ seq: si, lieu: m.lieu, moment: m }); }
  });
  var N = secondes.length;

  /* ── le plan : une masse par lieu. Ses colonnes sont choisies pour dire sa forme (le couloir est long, le casier étroit) ; sa surface, c'est son temps ── */
  var PAS = 10, HT = 42, RANG = 54;
  var MASSES = [
    { id: 'lie.couloir-casiers', x: 190, y: 300, cols: 41 },
    { id: 'lie.casier-assane', x: 630, y: 300, cols: 9 },
    { id: 'lie.cour-honneur', x: 190, y: 452, cols: 17 },
    { id: 'lie.college', x: 390, y: 452, cols: 20, nom: 'Les classes, les couloirs' },
    { id: 'lie.bureau-cpe', x: 740, y: 300, cols: 14 },
    { id: 'lie.college-nuit', x: 190, y: 752, cols: 70, nuit: true },
    { id: 'lie.chambre-assane', x: 1130, y: 300, cols: 33 },
    { id: 'lie.cafe-quartier-latin', x: 1130, y: 652, cols: 10 },
    { id: 'lie.bureau-boiseries', x: 1560, y: 300, cols: 7 },
  ];
  var parLieu = {};
  MASSES.forEach(function (m) { m.n = 0; m.arrives = 0; parLieu[m.id] = m; m.nom = m.nom || MG.chose[m.id].nom; });
  secondes.forEach(function (s) { var m = parLieu[s.lieu]; s.masse = m; s.rang = m.n++; });
  MASSES.forEach(function (m) { m.l = m.cols * PAS; m.rangs = Math.ceil(m.n / m.cols); m.h = (m.rangs - 1) * RANG + HT; });
  var premiere = MASSES.slice().sort(function (a, b) { return b.n - a.n; })[0];
  /* le lieu dont on parle et qu'on ne montre jamais */
  var jamais = M.choses.filter(function (c) { return c.type === 'LIEU' && !parLieu[c.id]; })[0];

  /* ── le chemin : une halte par passage du film dans un lieu ── */
  var haltes = [];
  secondes.forEach(function (s, i) { var h = haltes[haltes.length - 1]; if (!h || h.masse !== s.masse || h.seq !== s.seq) haltes.push({ masse: s.masse, seq: s.seq, de: i, a: i }); else h.a = i; });

  var ox = 0, oy = 0, U = 1;
  function X(x) { return ox + x * U; } function Y(y) { return oy + y * U; }
  function place(s) { return { x: s.masse.x + (s.rang % s.masse.cols) * PAS + PAS / 2, y: s.masse.y + Math.floor(s.rang / s.masse.cols) * RANG }; }
  haltes.forEach(function (h) { var a = place(secondes[h.de]), b = place(secondes[h.a]); h.x = (a.x + b.x) / 2; h.y = (a.y + b.y) / 2 + HT / 2; });
  /* le ruban du film : 620 traits côte à côte, un souffle entre deux séquences */
  var R0 = 150, R1 = 1790, RY = 470, RH = 150, SOUFFLE = 9;
  function ruban(i) { var s = secondes[i]; return R0 + (R1 - R0 - 12 * SOUFFLE) * (i + 0.5) / N + s.seq * SOUFFLE; }
  function composer(L, H, u) { U = u; ox = (L - 2000 * u) / 2; oy = (H - 1069 * u) / 2 - 44 * u; }

  /* les temps de la scène */
  var T_VOL0 = 0.22, T_VOL1 = 0.5, T_FIL0 = 0.52, T_FIL1 = 0.76, T_FIN = 0.8;

  function dessiner(g, t, L, H) {
    var vol = seg(t, T_VOL0, T_VOL1), chemin = seg(t, T_FIL0, T_FIL1), rejoue = chemin > 0 && chemin < 1, fin = doux(seg(t, T_FIN, 0.99));
    var tete = rejoue ? Math.min(N - 1, Math.floor(chemin * N)) : -1;
    var passe = seg(t, 0.015, T_VOL0 - 0.03), surRuban = passe > 0 && passe < 1;
    var seqIci = rejoue ? secondes[tete].seq : surRuban ? secondes[Math.min(N - 1, Math.floor(passe * N))].seq : (vol > 0 && vol < 1 ? secondes[Math.min(N - 1, Math.floor(vol * 1.12 * N))].seq : -1);
    MASSES.forEach(function (m) { m.arrives = 0; });

    /* le sol du collège : une seule nappe, à peine plus claire, où tiennent ses cinq lieux */
    var sol = doux(seg(t, T_VOL0, T_VOL0 + 0.12));
    if (sol > 0) {
      g.save(); g.globalAlpha = 0.045 * sol; g.fillStyle = C.ink; g.fillRect(X(150), Y(262), 780 * U, 590 * U); g.restore();
      MG.ecrire(g, MG.chose['lie.college'].nom, X(150), Y(246), 15 * U, { italique: true, encre: C.pale, alpha: sol });
    }

    /* le ruban : les titres des treize séquences, tant que le film est encore un ruban */
    var titres = 1 - doux(seg(t, T_VOL0, T_VOL0 + 0.1));
    if (titres > 0) {
      M.sequences.forEach(function (s, si) {
        var x0 = R0 + (R1 - R0 - 12 * SOUFFLE) * s.d0 / N + si * SOUFFLE, l = (R1 - R0 - 12 * SOUFFLE) * (s.d1 - s.d0) / N;
        MG.ecrire(g, String(s.n), X(x0), Y(RY - 16), 15 * U, { encre: si === seqIci ? C.or : C.ink, alpha: titres, graisse: 500 });
        var mots = s.titre.replace('Coda — ', '').split(' '), lignes = [''], taille = 13 * U;
        mots.forEach(function (w) { var essai = (lignes[lignes.length - 1] + ' ' + w).trim(); if (MG.large(g, essai, taille, { italique: true }) > l * U - 4 && lignes[lignes.length - 1]) lignes.push(w); else lignes[lignes.length - 1] = essai; });
        lignes.slice(0, 4).forEach(function (li, k) { MG.ecrire(g, li, X(x0), Y(RY + RH + 26 + k * 18), taille, { italique: true, encre: si === seqIci ? C.ink : C.pale, alpha: titres }); });
      });
      MG.ecrire(g, '0:00', X(R0), Y(RY - 56), 13 * U, { encre: C.pale, alpha: titres });
      MG.ecrire(g, '10:20', X(R1), Y(RY - 56), 13 * U, { encre: C.pale, alpha: titres, aligne: 'right' });
    }

    /* les 620 secondes : du ruban vers leur lieu, dans l'ordre du film */
    var nuit = parLieu['lie.college-nuit'], pose = new Float32Array(N * 4), etat = new Uint8Array(N);
    for (var i = 0; i < N; i++) {
      var s = secondes[i], d = doux(seg(vol, (i / N) * 0.86, (i / N) * 0.86 + 0.14)), a = place(s);
      pose[i * 4] = mix(ruban(i), a.x, d); pose[i * 4 + 1] = mix(RY, a.y, d) - Math.sin(d * Math.PI) * 60; pose[i * 4 + 2] = mix(RH, HT, d);
      if (d >= 1) s.masse.arrives++;
      /* 0 : l'encre ; 1 : l'encre qui attend son tour ; 2 : en creux dans la nuit ; 3 : l'orange, là où l'on est */
      var ici = rejoue || surRuban ? s.seq === seqIci : fin > 0.5 ? s.masse === premiere : s.seq === seqIci && d > 0 && d < 1;
      etat[i] = ici ? 3 : (s.masse.nuit && d >= 1) ? 2 : (rejoue && i > tete) ? 1 : 0;
    }
    /* la nuit : le même collège, retourné. Une bande pleine, où les secondes sont en creux */
    if (nuit.arrives) { g.save(); g.fillStyle = C.ink; g.globalAlpha = rejoue && seqIci < 9 ? 0.3 : 0.92; g.fillRect(X(nuit.x - 6), Y(nuit.y - 8), (Math.min(nuit.arrives, nuit.cols) * PAS + 12) * U, (HT + 16) * U); g.restore(); }
    g.save(); g.lineWidth = Math.max(1, 1.5 * U);
    [0, 1, 2, 3].forEach(function (passe) {
      g.beginPath();
      for (var i = 0; i < N; i++) { if (etat[i] !== passe) continue; g.moveTo(X(pose[i * 4]), Y(pose[i * 4 + 1])); g.lineTo(X(pose[i * 4]), Y(pose[i * 4 + 1] + pose[i * 4 + 2])); }
      g.strokeStyle = passe === 3 ? C.or : passe === 2 ? C.bg : C.ink; g.globalAlpha = passe === 0 ? 0.84 : passe === 1 ? 0.22 : 1; g.stroke();
    });
    g.restore();

    /* le chemin de la séquence qu'on rejoue : un seul fil, d'un lieu à l'autre, et rien d'autre */
    if (rejoue) {
      var hs = haltes.filter(function (h) { return h.seq === seqIci; });
      g.save(); g.strokeStyle = C.or; g.fillStyle = C.or; g.lineWidth = 1.2 * U;
      if (hs.length > 1) {
        g.beginPath(); g.moveTo(X(hs[0].x), Y(hs[0].y));
        for (var k = 1; k < hs.length; k++) { var p = hs[k - 1], q = hs[k], cx = (p.x + q.x) / 2, cy = Math.min(p.y, q.y) - 70 - Math.abs(q.x - p.x) * 0.12; g.quadraticCurveTo(X(cx), Y(cy), X(q.x), Y(q.y)); }
        g.stroke();
      }
      hs.forEach(function (h, k) { g.beginPath(); g.arc(X(h.x), Y(h.y), (k ? 3.5 : 5) * U, 0, 6.3); g.fill(); });
      g.restore();
    }

    /* les noms : chacun arrive quand sa masse se remplit ; dessous, son temps */
    MASSES.forEach(function (m) {
      var a = doux(seg(m.arrives / m.n, 0.3, 0.9)); if (a <= 0) return;
      var tenu = (rejoue && haltes.some(function (h) { return h.seq === seqIci && h.masse === m; })) || (fin > 0.5 && m === premiere), x = X(m.x), y = Y(m.y + m.h + 26);
      if (m.nuit) { x = X(m.x + m.l + 28); y = Y(m.y + 18); }
      MG.ecrire(g, m.nom, x, y, 16 * U, { encre: tenu ? C.or : C.ink, alpha: a, graisse: 400 });
      MG.ecrire(g, MG.min(m.n), x, y + 21 * U, 13.5 * U, { italique: true, encre: C.pale, alpha: a });
    });

    /* à la fin : le mot immense est la réponse, et ce qui manque se montre vide */
    if (fin > 0) {
      MG.ecrire(g, MG.nu(premiere.nom).split(' ')[0].toUpperCase(), X(premiere.x - 6), Y(premiere.y - 34), 118 * U, { nom: true, encre: C.ink, alpha: fin });
      if (jamais) {
        g.save(); g.globalAlpha = fin; g.strokeStyle = C.pale; g.lineWidth = 1; g.strokeRect(Math.round(X(1330)) + 0.5, Math.round(Y(652)) + 0.5, 150 * U, 150 * U); g.restore();
        MG.ecrire(g, jamais.nom, X(1330), Y(652 + 150 + 26), 16 * U, { italique: true, encre: C.pale, alpha: fin });
        MG.ecrire(g, 'on en parle, on n’y entre jamais', X(1330), Y(652 + 150 + 47), 13.5 * U, { italique: true, encre: C.pale, alpha: fin });
      }
    }
  }

  var apres = N - parLieu['lie.college-nuit'].n;
  function dire(t, pas) {
    var chemin = seg(t, T_FIL0, T_FIL1);
    var passe = seg(t, 0.015, T_VOL0 - 0.03);
    if (passe <= 0 || (passe >= 1 && t < T_VOL0)) return { k: 'Le film', b: 'Dix minutes vingt, treize séquences. Un trait par seconde : ' + N + ' traits.' };
    if (passe < 1) { var sq = M.sequences[secondes[Math.min(N - 1, Math.floor(passe * N))].seq]; return { k: 'Séquence ' + sq.n, b: sq.titre + ', ' + MG.min(sq.d1 - sq.d0) + '.' }; }
    if (t < T_FIL0) return { k: 'Les lieux', b: 'Chaque seconde va se ranger dans le lieu où elle se passe.', ouvert: 'Déduit : dans une séquence, le temps est partagé à parts égales entre ses moments.' };
    if (chemin < 1) {
      var i = Math.min(N - 1, Math.floor(chemin * N)), x = secondes[i], s = M.sequences[x.seq];
      return { k: 'Séquence ' + s.n + ' · ' + s.titre, b: x.moment.nom + ', ' + MG.bas(x.masse.nom) + '.' };
    }
    return { k: 'Ce qu’on voit', b: 'Un film de collège qui passe plus de temps dans ' + MG.bas(premiere.nom) + ' que partout ailleurs : ' + MG.min(premiere.n) + ' sur ' + MG.min(N) + '.',
      ouvert: jamais ? 'Manque : ' + MG.bas(jamais.nom) + ', d’où sort le livre du père. On en parle, on n’y entre jamais.' : '' };
  }

  document.getElementById('mg-fin').textContent = 'Le collège tient en cinq lieux et ' + MG.min(apres - premiere.n - parLieu['lie.cafe-quartier-latin'].n - parLieu['lie.bureau-boiseries'].n) + ' de jour ; la nuit en prend ' + MG.min(parLieu['lie.college-nuit'].n) + ' de plus. Mais c’est dans ' + MG.bas(premiere.nom) + ' que le film reste le plus longtemps : là où Assane comprend.';
  MG.scene({ pas: ['le film', 'les lieux', 'le chemin', 'ce qu’on voit'], course: 95, composer: composer, dessiner: dessiner, dire: dire });
})();
