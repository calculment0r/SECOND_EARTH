/* SOLARIS · LE LORE, GRAPHIQUE · LG-05 · Le fil.
   Le script entier, en treize pages posées côte à côte (une par séquence, large comme sa durée) : chaque ligne du script est un trait gris, long comme elle.
   À gauche, avant le film : la main inconnue, Babakar, sa mort, le livre reçu. Un seul fil orange part de là et traverse tout.
   Il passe SOUS les pages (pointillé ambre : le livre est là, le film ne le montre pas) et remonte À la ligne exacte où le script touche la dédicace.
   La molette fait avancer le fil. La matière : le script (script-maitre.js), ligne par ligne ; chaque phrase citée y est retrouvée mot pour mot, sinon elle n'apparaît pas. */
(function () {
  'use strict';
  var LG = window.LG, M = window.LG_MONDE, S = window.SCRIPT, lisse = LG.lisse, mel = LG.mel, c = LG.c;
  var SEQ = M.sequences, FIN = SEQ[SEQ.length - 1].a;
  var PAGES = (S && S.sequences || []).map(function (q) { return q.blocs; });

  /* Là où le script touche la dédicace : la séquence, la ligne, les mots (retrouvés tels quels), et s'ils s'écrivent à côté. */
  var TOUCHES = [
    [4, 126, 'le livre que son père lui a laissé', false], [4, 128, 'Liber pugna theleri', false], [4, 131, 'Le livre combat la mort.', true],
    [11, 381, 'Liber pugna theleri', true], [12, 419, 'À HUBERT PELLEGRINI', true], [12, 421, 'C\'était une dédicace cryptée.', false],
    [12, 425, 'Le livre n\'a jamais appartenu à son père à l\'origine.', false], [13, 447, 'exactement au même emplacement', true]
  ].filter(function (T) { var b = (PAGES[T[0] - 1] || []).filter(function (x) { return x.ligne === T[1]; })[0]; return b && b.texte.indexOf(T[2]) >= 0; });
  var AVANT = [
    { x: .058, t: 'avant 1995', d: 'quelqu’un écrit dix-sept lettres dans un livre', trou: true },
    { x: .112, t: '1995', d: 'Babakar choisit ce livre chez son patron' },
    { x: .162, t: '6 octobre', d: 'il meurt en cellule' },
    { x: .212, t: 'octobre', d: 'Assane reçoit le livre' }
  ];
  var PAS = ['avant le film', 'le livre ouvert', 'sous les pages', 'la dernière anagramme', 'le dernier plan'];
  var etape = 0;

  var mise = null;
  function mettreEnPage(ctx, L, H) {
    if (mise && mise.L === L && mise.H === H) return mise;
    var u = L / 2000, xF = L * .262, x1 = L * .885, haut = H * .12, maxH = H * .5, pas = 4.6 * u, k = 1.2 * u, cols, plus;
    function xf(s) { return mel(xF, x1, s / FIN); }
    function essai(k) {
      plus = 0;
      return SEQ.map(function (q, i) {
        var xa = xf(q.de) + 5 * u, w = xf(q.a) - xf(q.de) - 10 * u, cpr = Math.max(8, Math.floor(w / k)), y = haut, lignes = {}, traits = [];
        (PAGES[i] || []).forEach(function (b) {
          var n = b.texte.length, ret = b.genre === 'replique' ? .16 : b.genre === 'personnage' || b.genre === 'didascalie' ? .36 : 0, cp = Math.max(4, Math.floor(cpr * (1 - 2 * ret))), y0 = y;
          while (n > 0) { var m = Math.min(n, cp); traits.push([xa + w * ret, y, m * k * (w * (1 - 2 * ret) / (cp * k)), b.ligne, b.genre]); y += pas; n -= m; }
          y += pas * .7; lignes[b.ligne] = { x: xa + w * ret, y: (y0 + y - pas * 1.7) / 2, w: w * (1 - 2 * ret) };
        });
        plus = Math.max(plus, y - haut); return { xa: xa, w: w, traits: traits, lignes: lignes, bas: y };
      });
    }
    for (var z = 0; z < 40; z++) { cols = essai(k); if (plus >= maxH * .93) break; k *= 1.07; }
    /* le chemin du fil : avant le film, puis sous les pages, puis à chaque ligne touchée */
    var yA = H * .5, yS = H * .7, W = [];
    AVANT.forEach(function (a, i) { W.push({ x: L * a.x, y: yA, plein: i > 1, avant: a, pas: 0 }); });
    W.push({ x: xF + 6 * u, y: yS, plein: false, pas: 0 });
    var dernier = 0;
    TOUCHES.forEach(function (T, i) {
      var col = cols[T[0] - 1], l = col.lignes[T[1]], meme = i && TOUCHES[i - 1][0] === T[0], suit = i && TOUCHES[i - 1][0] === T[0] - 1;
      var rang = TOUCHES.filter(function (X, j) { return X[0] === T[0] && j < i; }).length, nb = TOUCHES.filter(function (X) { return X[0] === T[0]; }).length;
      if (!meme && !suit) { if (dernier) W.push({ x: cols[dernier - 1].xa + cols[dernier - 1].w + 14 * u, y: yS, plein: true, pas: 2 }); W.push({ x: col.xa - 12 * u, y: yS, plein: false, pas: T[0] < 6 ? 0 : 2 }); }
      W.push({ x: col.xa + col.w * (rang + 1) / (nb + 1), y: l.y, plein: true, touche: T, col: col, pas: T[0] === 4 ? 1 : T[0] === 13 ? 4 : 3 }); dernier = T[0];
    });
    W.push({ x: x1 + 30 * u, y: W[W.length - 1].y, plein: true, bout: true, pas: 4 });
    /* le chemin en petits pas, avec sa longueur */
    var pts = [], long = 0;
    for (var i = 1; i < W.length; i++) {
      var a = W[i - 1], b = W[i], dx = Math.max(Math.abs(b.x - a.x) * .5, 26 * u);
      for (var j = (i === 1 ? 0 : 1); j <= 26; j++) {
        var t = j / 26, m = 1 - t, X = m * m * m * a.x + 3 * m * m * t * (a.x + dx) + 3 * m * t * t * (b.x - dx) + t * t * t * b.x, Y = m * m * m * a.y + 3 * m * m * t * a.y + 3 * m * t * t * b.y + t * t * t * b.y;
        if (pts.length) long += Math.hypot(X - pts[pts.length - 1][0], Y - pts[pts.length - 1][1]);
        pts.push([X, Y, long, i]);
      }
      b.long = long;
    }
    W[0].long = 0;
    return (mise = { L: L, H: H, u: u, xF: xF, x1: x1, haut: haut, cols: cols, W: W, pts: pts, long: long, yA: yA, yS: yS, xf: xf });
  }

  function dessin(ctx, L, H, t, C) {
    var m = mettreEnPage(ctx, L, H), u = m.u, W = m.W, p = lisse(.02, .96, t) * m.long, fin = lisse(.95, 1, t), i;
    var touchees = {}; W.forEach(function (w) { if (w.touche && w.long <= p) touchees[w.touche[1]] = true; });
    etape = 0; W.forEach(function (w) { if (w.long <= p + 1) etape = w.pas; });

    LG.mot(ctx, '1995', L * .045, m.yA + 250 * u, { p: 'nor', c: 190 * u, col: C.ink, a: .05 });

    /* les pages : chaque ligne du script, un trait */
    m.cols.forEach(function (col, n) {
      LG.mot(ctx, String(n + 1), col.xa, m.haut - 16 * u, { p: 'mono', c: 10.5 * u, col: C.ink3 });
      for (var z = 0; z < col.traits.length; z++) {
        var T = col.traits[z], vif = touchees[T[3]];
        ctx.fillStyle = c(C.ink, vif ? 1 : T[4] === 'entete' ? .5 : T[4] === 'replique' ? .2 : .29); ctx.fillRect(T[0], T[1], T[2], vif ? 1.6 * u : 1.1 * u);
      }
    });
    LG.mot(ctx, 'le script, ligne par ligne', m.xF - 22 * u, m.haut + 6 * u, { p: 'lit', c: 13 * u, it: true, g: 300, col: C.ink3, al: 'right' });

    /* avant le film : quatre moments, de petites phrases */
    W.forEach(function (w, k) {
      if (!w.avant) return; var la = lisse(w.long - 30 * u, w.long + 10 * u, p + (k ? 0 : 40 * u)), dessus = k % 2 === 0;
      var yt = w.y + (dessus ? -92 : 52) * u;
      LG.mot(ctx, w.avant.t, w.x, yt, { p: 'lit', c: 15 * u, g: 400, col: C.ink, a: mel(.5, 1, la), al: 'center' });
      LG.texte(ctx, w.avant.d, w.x, yt + 20 * u, 108 * u, { p: 'lit', c: 12.5 * u, it: true, g: 300, col: w.avant.trou ? C.amb : C.ink2, a: la, al: 'center', il: 16 * u });
    });

    /* le fil : pointillé ambre quand on le déduit ou quand le film ne le montre pas, plein orange quand le script le dit */
    function tracer(plein) {
      ctx.beginPath(); var ouvert = false;
      for (var z = 1; z < m.pts.length; z++) {
        var a = m.pts[z - 1], b = m.pts[z]; if (a[2] >= p) break;
        if (W[b[3]].plein !== plein) { ouvert = false; continue; }
        var f = b[2] > p ? (p - a[2]) / (b[2] - a[2]) : 1;
        if (!ouvert) { ctx.moveTo(a[0], a[1]); ouvert = true; }
        ctx.lineTo(mel(a[0], b[0], f), mel(a[1], b[1], f));
      }
    }
    ctx.lineCap = 'round';
    ctx.strokeStyle = c(C.amb, .95); ctx.lineWidth = 1.2 * u; ctx.setLineDash([5 * u, 5 * u]); tracer(false); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = c(C.or, .2); ctx.lineWidth = 7 * u; tracer(true); ctx.stroke();
    ctx.strokeStyle = c(C.or, 1); ctx.lineWidth = 1.8 * u; tracer(true); ctx.stroke(); ctx.lineCap = 'butt';

    /* la tête du fil : une lueur */
    var tete = m.pts[0]; for (i = 1; i < m.pts.length; i++) { if (m.pts[i][2] > p) { var a = m.pts[i - 1], b = m.pts[i], f = (p - a[2]) / (b[2] - a[2] || 1); tete = [mel(a[0], b[0], f), mel(a[1], b[1], f)]; break; } tete = m.pts[i]; }
    LG.lueur(ctx, tete[0], tete[1], 130 * u, C.or, C.clair ? .1 : .16);
    ctx.fillStyle = c(C.or, 1); ctx.beginPath(); ctx.arc(tete[0], tete[1], 3.6 * u, 0, 7); ctx.fill();

    /* les nœuds : le trou de départ, les moments d'avant, les lignes touchées et leurs mots */
    W.forEach(function (w, k) {
      if (w.avant) {
        ctx.beginPath(); ctx.arc(w.x, w.y, (w.avant.trou ? 6 : 3.4) * u, 0, 7);
        if (w.avant.trou) { ctx.fillStyle = c(C.bg, 1); ctx.fill(); ctx.strokeStyle = c(C.amb, 1); ctx.lineWidth = 1.3; ctx.stroke(); }
        else { ctx.fillStyle = c(w.long <= p ? C.or : C.ink3, 1); ctx.fill(); }
      }
      if (w.touche && w.long <= p) {
        var la = lisse(w.long, w.long + 60 * u, p);
        ctx.fillStyle = c(C.or, 1); ctx.beginPath(); ctx.arc(w.x, w.y, 3.4 * u, 0, 7); ctx.fill();
        if (w.touche[3]) {
          var grand = w.touche[2] === 'À HUBERT PELLEGRINI', gauche = w.touche[0] >= 11, txt = grand ? w.touche[2] : '« ' + w.touche[2].replace(/'/g, '’') + ' »';
          if (w.touche[0] === 13) {
            ctx.strokeStyle = c(C.ink, .45 * la); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(w.x, w.y + 7 * u); ctx.lineTo(w.x, w.col.bas + 12 * u); ctx.stroke();
            LG.mot(ctx, txt, w.x + 4 * u, w.col.bas + 32 * u, { p: 'lit', c: 16 * u, it: true, g: 400, col: C.ink, a: la, al: 'right' });
          } else LG.mot(ctx, txt, w.x + (gauche ? -14 : 14) * u, w.y + (grand ? 9 : 5) * u, { p: grand ? 'nor' : 'lit', c: (grand ? 30 : 16) * u, it: !grand, g: 400, col: C.ink, a: la, al: gauche ? 'right' : 'left', halo: C.bg });
        }
      }
    });
    if (fin > 0) LG.mot(ctx, 'le fil continue', m.x1 + 42 * u, W[W.length - 1].y + 4 * u, { p: 'lit', c: 13 * u, it: true, g: 300, col: C.amb, a: fin });
  }

  function dire() {
    if (etape === 0) return '<small>Avant le film</small>Quelqu’un écrit une phrase latine dans un livre. Babakar le choisit pour son fils, meurt, et le livre arrive dans une chambre du dix-neuvième.<em>Qui écrit ? Quand ? La bible du monde garde la case vide.</em>';
    if (etape === 1) return '<small>Séquence 4 · Deux livres, deux inscriptions</small>Assane l’ouvre et traduit sans y penser : « Le livre combat la mort. » Il prend la phrase pour un conseil de son père.';
    if (etape === 2) return '<small>Séquences 5 à 10</small>Six séquences sans un mot sur le livre. Le fil passe sous les pages.<em>Le livre reste dans la chambre : on le déduit, le script ne le montre pas.</em>';
    if (etape === 3) return '<small>Séquences 11 et 12</small>La même phrase, glissée dans son casier. Puis les lettres retombent autrement : ce n’était pas un conseil, c’était une dédicace.';
    return '<small>Séquence 13 · Le dernier plan</small>Une main écrit dans un carnet, « exactement au même emplacement ». Le fil ne s’arrête pas avec le film.<em>Qui est Hubert Pellegrini pour la famille Diop ? Le film ouvre la question et la laisse.</em>';
  }
  LG.scene({ pas: PAS, pasDe: function () { return etape; }, course: 400, dessin: dessin, dire: dire });
})();
