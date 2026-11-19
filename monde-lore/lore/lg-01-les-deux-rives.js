/* SOLARIS · LE LORE, GRAPHIQUE · LG-01 · Les deux rives.
   En haut, le temps du monde (les jours, d'avant 1995 à la coda). En bas, le temps du film (dix minutes, treize séquences).
   Chaque séquence est un faisceau entre le moment du monde qu'elle prend et la place que le film lui donne ; chaque fait est un fil.
   Sous le film, une arche par chose montrée avant d'être comprise. En orange, le seul fil qui traverse tout : la dédicace.
   La molette : le monde seul, puis les faisceaux tombent un à un, puis les arches, puis la dédicace. */
(function () {
  'use strict';
  var LG = window.LG, M = window.LG_MONDE, lisse = LG.lisse, mel = LG.mel, c = LG.c;
  var SEQ = M.sequences, EV = M.evenements, FIN = SEQ[SEQ.length - 1].a;

  /* L'échelle du monde : les jours, serrés là où il ne se passe rien (entre la nuit de la traque et le retour ; avant la coda). */
  var ANCRES = [[-3, 0], [-2, .055], [-1.4, .095], [-1.2, .115], [.4, .165], [1, .2], [1.4, .235], [2, .26], [5.5, .385], [5.9, .41], [7, .52], [8, .625], [9, .735], [9.3, .77], [12, .835], [12.7, .905], [20, .955], [20.4, 1]];
  function monde(j) {
    for (var i = 1; i < ANCRES.length; i++) if (j <= ANCRES[i][0]) { var a = ANCRES[i - 1], b = ANCRES[i]; return mel(a[1], b[1], (j - a[0]) / (b[0] - a[0])); }
    return 1;
  }
  var REPERES = [[-3, 'avant 1995'], [-1.4, '6 octobre'], [1.15, 'jour 1'], [3.75, 'jours 2 à 5'], [6.4, 'jour 6'], [7.3, 'jour 7'], [8.4, 'jour 8'], [9.12, 'la nuit'], [12.3, 'jour 12'], [20.2, 'plus tard']];
  /* Le moment du monde que prend chaque séquence (du premier au dernier de ses faits ; la rumeur dure du jour 2 au jour 5). */
  var PRISE = SEQ.map(function (q) {
    var js = EV.filter(function (e) { return e.seq === q.n && e.jour > 0.9; }).map(function (e) { return e.jour; });
    var a = Math.min.apply(null, js), b = Math.max.apply(null, js); if (q.n === 2) { a = 2; b = 5.5; }
    return [a - .04, b + .04];
  });
  /* La place de chaque fait dans le film : dans sa séquence, à son rang. */
  var parSeq = {}; EV.forEach(function (e) { if (e.seq) (parSeq[e.seq] = parSeq[e.seq] || []).push(e); });
  Object.keys(parSeq).forEach(function (n) {
    var l = parSeq[n].slice().sort(function (a, b) { return a.jour - b.jour; }), q = SEQ[n - 1];
    l.forEach(function (e, k) { e.film = q.de + (k + .5) / l.length * (q.a - q.de); });
  });
  function ev(id) { return EV.filter(function (e) { return e.id === id; })[0]; }
  var DEDICACE = ev('avant-dedicace'), LUE = ev('s12-a-hubert-pellegrini');
  DEDICACE.film = LUE.film;
  /* Montré, puis compris : le fait, et celui qui le fait comprendre. */
  var ARCHES = [['s3-inscription-billets', 's6-anagrammes'], ['s4-crator-viden', 's6-anagrammes'], ['s5-nuda-veritas', 's6-aude-rivants'], ['s4-confrontation-livres', 's12-a-hubert-pellegrini'], ['avant-depot-livre', 's13-tampon-apte']]
    .map(function (p) { return { de: ev(p[0]), a: ev(p[1]) }; }).filter(function (p) { return p.de && p.a && p.de.rev === p.a.seq; });
  var dansNeuf = EV.filter(function (e) { return e.jour >= 1 && e.jour < 9.5; }).length;
  var jamais = EV.filter(function (e) { return !e.seq; });

  var PAS = ['le monde', 'le film', 'montré, puis compris', 'la dédicace'];
  function pasDe(t) { return t < .13 ? 0 : t < .56 ? 1 : t < .78 ? 2 : 3; }

  function dessin(ctx, L, H, t, C) {
    var u = L / 2000, x0 = L * .075, x1 = L * .885, yM = H * .215, yF = H * .545, yBas = H * .82;
    function xm(j) { return mel(x0, x1, monde(j)); }
    function xf(s) { return mel(x0, x1, s / FIN); }
    var film = lisse(.09, .16, t), arches = lisse(.54, .6, t), fin = lisse(.76, .84, t), calme = 1 - .62 * fin;

    /* les deux mots immenses, derrière */
    LG.mot(ctx, 'LE MONDE', x0 - 6 * u, yM - 34 * u, { p: 'nor', c: 168 * u, col: C.ink, a: .055 });
    LG.mot(ctx, 'LE FILM', x1 + 6 * u, yF + 196 * u, { p: 'nor', c: 168 * u, col: C.ink, a: .055 * film, al: 'right' });

    /* la rive du monde */
    ctx.lineWidth = 1; ctx.strokeStyle = c(C.ink, .5); ctx.beginPath();
    ctx.moveTo(x0, yM); ctx.lineTo(xm(9.3), yM); ctx.moveTo(xm(12), yM); ctx.lineTo(xm(12.7), yM); ctx.moveTo(xm(20), yM); ctx.lineTo(x1, yM); ctx.stroke();
    ctx.setLineDash([1, 5]); ctx.strokeStyle = c(C.ink3, .8); ctx.beginPath(); ctx.moveTo(xm(9.3), yM); ctx.lineTo(xm(12), yM); ctx.moveTo(xm(12.7), yM); ctx.lineTo(xm(20), yM); ctx.stroke(); ctx.setLineDash([]);
    REPERES.forEach(function (r) { LG.mot(ctx, r[1], xm(r[0]), yM - 16 * u, { p: 'lit', c: 13 * u, it: true, g: 300, col: C.ink2, al: 'center' }); });
    EV.forEach(function (e) {
      var x = xm(e.jour), h = (e.rang === 'principal' ? 9 : 5) * u;
      ctx.strokeStyle = c(e.d === 'deduit' ? C.amb : C.ink, e.rang === 'figurant' ? .45 : .85); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, yM - h); ctx.lineTo(x, yM); ctx.stroke();
    });

    /* la rive du film */
    if (film > 0) {
      ctx.strokeStyle = c(C.ink, .5 * film); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, yF); ctx.lineTo(mel(x0, x1, film), yF); ctx.stroke();
      SEQ.forEach(function (q) {
        var x = xf(q.de); if (x > mel(x0, x1, film)) return;
        ctx.strokeStyle = c(C.ink, .5); ctx.beginPath(); ctx.moveTo(x, yF); ctx.lineTo(x, yF + 7 * u); ctx.stroke();
        LG.mot(ctx, String(q.n), xf((q.de + q.a) / 2), yF + 22 * u, { p: 'mono', c: 10.5 * u, col: C.ink3, al: 'center' });
      });
      LG.mot(ctx, 'dix minutes vingt', x1, yF + 44 * u, { p: 'lit', c: 13 * u, it: true, g: 300, col: C.ink2, a: film, al: 'right' });
      LG.mot(ctx, 'le premier plan', x0, yF + 44 * u, { p: 'lit', c: 13 * u, it: true, g: 300, col: C.ink2, a: film });
    }

    /* les faisceaux : un par séquence, du moment du monde à la place dans le film ; ils tombent un à un */
    function cote(xa, xb, p) { /* la courbe d'un fil, de la rive du monde à celle du film, dessinée jusqu'à la part p */
      var n = Math.max(2, Math.round(40 * p)), pts = [];
      for (var i = 0; i <= n; i++) { var k = i / n * p, s = k * k * (3 - 2 * k); pts.push([mel(xa, xb, s), mel(yM, yF, k)]); }
      return pts;
    }
    SEQ.forEach(function (q, i) {
      var p = lisse(.15 + i * .027, .15 + i * .027 + .085, t); if (p <= 0) return;
      var g = cote(xm(PRISE[i][0]), xf(q.de), p), d = cote(xm(PRISE[i][1]), xf(q.a), p), k;
      var gr = ctx.createLinearGradient(0, yM, 0, yF); gr.addColorStop(0, c(C.ink, (C.clair ? .2 : .26) * calme)); gr.addColorStop(1, c(C.ink, (i % 2 ? .035 : .075) * calme));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(g[0][0], g[0][1]);
      for (k = 1; k < g.length; k++) ctx.lineTo(g[k][0], g[k][1]);
      for (k = d.length - 1; k >= 0; k--) ctx.lineTo(d[k][0], d[k][1]);
      ctx.closePath(); ctx.fill();
      (parSeq[q.n] || []).forEach(function (e) {
        if (e === DEDICACE) return;
        var f = cote(xm(e.jour), xf(e.film), p), ded = e.d === 'deduit';
        ctx.strokeStyle = c(ded ? C.amb : C.ink, (e.rang === 'principal' ? .8 : e.rang === 'secondaire' ? .5 : .3) * calme); ctx.lineWidth = (e.rang === 'principal' ? 1.1 : .8);
        ctx.setLineDash(ded ? [4 * u, 4 * u] : []); ctx.beginPath(); ctx.moveTo(f[0][0], f[0][1]); for (k = 1; k < f.length; k++) ctx.lineTo(f[k][0], f[k][1]); ctx.stroke(); ctx.setLineDash([]);
      });
    });
    /* ce que le film ne montre jamais : le fil s'arrête dans le vide, sur un rond creux */
    jamais.forEach(function (e) {
      var p = lisse(.15, .24, t) * .3; if (p <= 0) return;
      var f = cote(xm(e.jour), xm(e.jour) + 30 * u, p), k, b = f[f.length - 1];
      ctx.strokeStyle = c(C.ink, .4 * calme); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(f[0][0], f[0][1]); for (k = 1; k < f.length; k++) ctx.lineTo(f[k][0], f[k][1]); ctx.stroke();
      ctx.beginPath(); ctx.arc(b[0], b[1] + 4 * u, 3.5 * u, 0, 7); ctx.strokeStyle = c(C.ink2, .9 * calme); ctx.stroke();
    });

    /* les arches : montré ici, compris là */
    var rMax = Math.max.apply(null, ARCHES.map(function (a) { return (xf(a.a.film) - xf(a.de.film)) / 2; }));
    ARCHES.forEach(function (a, i) {
      var p = lisse(.58 + i * .028, .58 + i * .028 + .08, t); if (p <= 0) return;
      var xa = xf(a.de.film), xb = xf(a.a.film), r = (xb - xa) / 2, prof = (yBas - yF) * Math.pow(r / rMax, .62), n = Math.round(60 * p), k;
      ctx.strokeStyle = c(a.de.d === 'deduit' ? C.amb : C.ink, .78 * calme); ctx.lineWidth = 1; ctx.setLineDash(a.de.d === 'deduit' ? [4 * u, 4 * u] : []);
      ctx.beginPath();
      for (k = 0; k <= n; k++) { var an = Math.PI * (k / 60), x = xa + r - r * Math.cos(an), y = yF + prof * Math.sin(an); if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = c(C.ink, .9 * calme); ctx.beginPath(); ctx.arc(xa, yF, 2.4 * u, 0, 7); ctx.fill();
      if (p >= 1) { ctx.beginPath(); ctx.arc(xb, yF, 2.4 * u, 0, 7); ctx.fill(); }
      if (p > .5) LG.mot(ctx, a.de.nom.replace(/^La découverte de /, ''), xa + r, yF + prof + (i === 3 ? -9 : 17) * u, { p: 'lit', c: 12.5 * u, it: true, g: 300, col: a.de.d === 'deduit' ? C.amb : C.ink2, a: (p - .5) * 2 * Math.max(calme, .6), al: 'center', halo: C.bg });
    });

    /* la dédicace : le seul fil qui traverse tout */
    var pd = lisse(.8, .97, t);
    var xd = xm(DEDICACE.jour);
    ctx.beginPath(); ctx.arc(xd, yM, 5 * u, 0, 7); ctx.fillStyle = c(C.bg, 1); ctx.fill(); ctx.strokeStyle = c(pd > 0 ? C.or : C.ink2, 1); ctx.lineWidth = 1.2; ctx.stroke();
    if (pd > 0) {
      var f = cote(xd, xf(DEDICACE.film), pd), k, b = f[f.length - 1];
      LG.lueur(ctx, b[0], b[1], 150 * u, C.or, (C.clair ? .1 : .16) * pd);
      ctx.strokeStyle = c(C.or, .22); ctx.lineWidth = 7 * u; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(f[0][0], f[0][1]); for (k = 1; k < f.length; k++) ctx.lineTo(f[k][0], f[k][1]); ctx.stroke();
      ctx.strokeStyle = c(C.or, 1); ctx.lineWidth = 1.8 * u; ctx.beginPath(); ctx.moveTo(f[0][0], f[0][1]); for (k = 1; k < f.length; k++) ctx.lineTo(f[k][0], f[k][1]); ctx.stroke(); ctx.lineCap = 'butt';
      ctx.beginPath(); ctx.arc(xd, yM, 5 * u, 0, 7); ctx.fillStyle = c(C.bg, 1); ctx.fill(); ctx.strokeStyle = c(C.or, 1); ctx.lineWidth = 1.2; ctx.stroke();
      if (pd >= 1) { ctx.fillStyle = c(C.or, 1); ctx.beginPath(); ctx.arc(b[0], b[1], 4.5 * u, 0, 7); ctx.fill(); }
      var am = lisse(.9, .98, t);
      LG.mot(ctx, 'Liber pugna theleri', xd + 16 * u, yM + 62 * u, { p: 'lit', c: 40 * u, it: true, g: 300, col: C.ink, a: lisse(.8, .86, t) });
      LG.mot(ctx, 'À HUBERT PELLEGRINI', xf(DEDICACE.film) + 14 * u, yF - 22 * u, { p: 'nor', c: 30 * u, col: C.ink, a: am, al: 'right', halo: C.bg });
    }
  }

  function dire(t) {
    var p = pasDe(t);
    if (p === 0) return '<small>Le monde, jour après jour</small>' + EV.length + ' faits, de la dédicace au dernier tampon. ' + dansNeuf + ' tiennent dans les neuf premiers jours, en novembre 1995.';
    if (p === 1) return '<small>Le film, dix minutes</small>Chaque séquence prend un moment du monde et lui donne une place. Quatre jours de rumeur tiennent en vingt-cinq secondes ; une heure de nuit en occupe soixante-dix.<em>Deux faits viennent de la série : le film ne les montre jamais.</em>';
    if (p === 2) return '<small>Montré, puis compris</small>Cinq choses passent devant nous avant qu’on les comprenne. Le livre dans le casier attend la toute fin : douze séquences.<em>Qui l’a posé là ? Le script ne le montre pas, on le déduit.</em>';
    return '<small>Le secret le mieux gardé</small>Écrite avant 1995, lue à la séquence 12. Ce n’était pas une maxime : c’était une dédicace.' + (DEDICACE.vide ? '<em>' + DEDICACE.vide + '</em>' : '');
  }
  LG.scene({ pas: PAS, pasDe: pasDe, course: 330, dessin: dessin, dire: dire });
})();
