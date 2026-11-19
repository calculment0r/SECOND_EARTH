/* SOLARIS · LE LORE, GRAPHIQUE · LG-04 · Les lettres en vol.
   Les six inscriptions du film, une par une. En haut la phrase latine, en bas le nom : les mêmes lettres. Sous la molette, chaque lettre quitte sa place
   et descend à la sienne, en laissant un fil. Le tressage des fils est la figure : aucune anagramme n'a le même.
   « Liber pugna theleri » a deux solutions : la première (Gilbert Phinelerau) est barrée, les lettres repartent vers la seconde, en orange : c'est la dédicace.
   « Spes donaia » redit Assane Diop sans que le film le signale : ses fils sont en pointillé ambre (on le déduit).
   Tout à la fin, les six tressages côte à côte. La matière : les inscriptions de la bible du monde, vérifiées lettre à lettre au chargement. */
(function () {
  'use strict';
  var LG = window.LG, lisse = LG.lisse, mel = LG.mel, c = LG.c;

  var ANA = [
    { de: 'MONAS HASTEN', a: 'ÉTHAN MASSON', latin: 'Monas hasten', ou: 'calligraphié sur les billets de théâtre de Victor André', dit: '« le moine pressé, ou un truc du genre »', vu: 3, lu: 6 },
    { de: 'CRATOR VIDEN', a: 'VICTOR ANDRÉ', latin: 'Crator viden', ou: 'à l’encre violette, dans le livre de Gilbert', dit: '« le créateur voit »', vu: 4, lu: 6 },
    { de: 'NUDA VERITAS', a: 'AUDE RIVANTS', latin: 'Nuda veritas', ou: 'gravé sous le socle d’une boîte à musique', dit: '« la vérité nue »', vu: 5, lu: 6 },
    { de: 'AD SE PIANOS', a: 'ASSANE DIOP', latin: 'Ad se pianos', ou: 'gravé au dos d’une montre de famille', dit: '', vu: 8, lu: 8 },
    { de: 'LIBER PUGNA THELERI', a: 'GILBERT PHINELERAU', b: 'À HUBERT PELLEGRINI', latin: 'Liber pugna theleri', ou: 'dans le livre du père, en deuxième de couverture', dit: '« le livre combat la mort »', vu: 4, lu: 12, tenu: true },
    { de: 'SPES DONAIA', a: 'ASSANE DIOP', latin: 'Spes donaia', ou: 'dans le carnet du Maître, au même endroit', dit: '« l’espoir donne »', vu: 13, lu: 0, deduit: true }
  ];
  function nu(ch) { return ch.normalize('NFD').replace(/[^A-Z]/g, ''); }
  /* pour chaque lettre de l'arrivée, de quelle lettre du départ elle vient (la première libre de la même sorte) */
  function apparier(de, a) {
    var pris = [], l = [];
    for (var i = 0; i < a.length; i++) {
      var ch = nu(a[i]); if (!ch) { l.push(-1); continue; }
      var j = -1; for (var k = 0; k < de.length; k++) if (!pris[k] && nu(de[k]) === ch) { j = k; break; }
      if (j < 0) return null; pris[j] = true; l.push(j);
    }
    return l;
  }
  ANA = ANA.filter(function (A) { A.va = apparier(A.de, A.a); if (A.b) A.vb = apparier(A.a, A.b); return A.va && (!A.b || A.vb); });

  /* Les temps : un vol par anagramme ; deux pour la dédicace ; puis la planche. */
  var VOLS = []; ANA.forEach(function (A, i) { VOLS.push({ A: A, i: i, k: 0 }); if (A.b) VOLS.push({ A: A, i: i, k: 1 }); });
  var NB = VOLS.length + 1;
  var PAS = ANA.map(function (A) { return A.latin; }).concat(['les six']);
  function pasDe(t) { var s = Math.min(NB - 1, Math.floor(t * NB * .9999)); return s >= VOLS.length ? ANA.length : VOLS[s].i; }

  /* la place de chaque lettre d'une ligne centrée en cx */
  function places(ctx, s, cx, corps) {
    LG.police(ctx, { p: 'nor', c: corps }); var l = [], x = 0, esp = corps * .035;
    for (var i = 0; i < s.length; i++) { var w = s[i] === ' ' ? corps * .3 : ctx.measureText(s[i]).width; l.push({ ch: s[i], x: x + w / 2, w: w }); x += w + esp; }
    x -= esp; l.forEach(function (p) { p.x += cx - x / 2; }); l.large = x; return l;
  }
  function corpsPour(ctx, s, large, max) { LG.police(ctx, { p: 'nor', c: 100 }); var w = ctx.measureText(s).width * 1.06; return Math.min(max, 100 * large / w); }

  /* un tressage : les lettres de `haut` (à yh) descendent à leur place dans `bas` (à yb) ; p de 0 à 1 */
  function tresse(ctx, C, o) {
    var H1 = places(ctx, o.haut, o.cx, o.corps), B = places(ctx, o.bas, o.cx, o.corps), n = B.length, vraies = 0, k = 0, i;
    for (i = 0; i < n; i++) if (o.va[i] >= 0) vraies++;
    var col = o.tenu ? C.or : o.deduit ? C.amb : C.ink, cap = o.corps * .7;
    for (i = 0; i < n; i++) {
      var j = o.va[i]; if (j < 0) continue;
      var d = k / vraies * .55, q = lisse(d, d + .45, o.p); k++;
      var xa = H1[j].x, xb = B[i].x, ya = o.yh + o.corps * .16, yb = o.yb - cap - o.corps * .12, m = Math.max(2, Math.round(34 * q)), z;
      /* le fil */
      if (q > 0) {
        ctx.strokeStyle = c(col, (o.tenu ? .9 : .62) * o.a); ctx.lineWidth = o.trait || 1; ctx.setLineDash(o.deduit ? [4, 4] : []);
        ctx.beginPath(); for (z = 0; z <= m; z++) { var w = z / m * q, s = w * w * (3 - 2 * w), X = mel(xa, xb, s), Y = mel(ya, yb, w); if (z) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); } ctx.stroke(); ctx.setLineDash([]);
      }
      /* la lettre : pâle à sa place de départ, en vol, puis posée */
      LG.mot(ctx, o.haut[j], xa, o.yh, { p: 'nor', c: o.corps, col: C.ink, a: mel(1, o.fantome === undefined ? .16 : o.fantome, lisse(0, .25, q)) * o.a, al: 'center' });
      if (q > 0 && !o.sansVol) {
        var sq = q * q * (3 - 2 * q), xv = mel(xa, xb, sq), yv = mel(o.yh, o.yb, q);
        if (q < 1) LG.mot(ctx, nu(o.bas[i]), xv, yv, { p: 'nor', c: o.corps, col: C.ink, a: o.a, al: 'center' });
        else LG.mot(ctx, o.bas[i], xb, o.yb, { p: 'nor', c: o.corps, col: C.ink, a: o.a * (o.barre ? mel(1, .3, o.barre) : 1), al: 'center' });
      } else if (o.sansVol && q >= 1) LG.mot(ctx, o.bas[i], xb, o.yb, { p: 'nor', c: o.corps, col: C.ink, a: o.a, al: 'center' });
    }
    if (o.barre) { var g = B[0].x - B[0].w / 2 - o.corps * .1, dr = B[n - 1].x + B[n - 1].w / 2 + o.corps * .1; ctx.strokeStyle = c(C.ink, .8 * o.a); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(g, o.yb - cap * .5); ctx.lineTo(mel(g, dr, o.barre), o.yb - cap * .5); ctx.stroke(); }
  }

  function dessin(ctx, L, H, t, C) {
    var u = L / 2000, cx = L * .47, large = L * .68, pos = t * NB, s = Math.min(NB - 1, Math.floor(pos * .9999)), f = pos - s; if (t >= 1) f = 1;
    function petit(txt, y, a, o) { LG.mot(ctx, txt, cx, y, { p: 'lit', c: (o && o.c || 17) * u, it: true, g: 300, col: o && o.col || C.ink2, a: a, al: 'center' }); }

    if (s < VOLS.length) {
      var V = VOLS[s], A = V.A, deux = !!A.b, entree = (V.k === 1 || s === 0) ? 1 : lisse(0, .1, f), sortie = (deux && V.k === 0) ? 1 : 1 - lisse(.93, 1, f), a = entree * sortie;
      var corps = corpsPour(ctx, A.b || A.a, large, 132 * u), p = lisse(.12, .86, f);
      var y1 = H * (deux ? .2 : .25), y2 = H * (deux ? .47 : .64), y3 = H * .74;
      petit(A.ou + ' · séquence ' + A.vu, y1 - corps * .95, a);
      if (A.dit) petit(A.dit, y1 - corps * .95 + 26 * u, a * .8, { c: 15, col: C.ink3 });
      if (!deux) {
        tresse(ctx, C, { haut: A.de, bas: A.a, va: A.va, cx: cx, corps: corps, yh: y1, yb: y2, p: p, a: a, deduit: A.deduit });
        if (p >= 1) petit(A.lu ? (A.lu === A.vu ? 'lu dans la même séquence' : 'lu à la séquence ' + A.lu) : 'le film ne le signale pas', y2 + 46 * u, a * lisse(.86, .92, f), { col: A.lu ? C.ink2 : C.amb });
      } else {
        var p1 = V.k === 0 ? p : 1, p2 = V.k === 0 ? 0 : p;
        tresse(ctx, C, { haut: A.de, bas: A.a, va: A.va, cx: cx, corps: corps, yh: y1, yb: y2, p: p1, a: a * (V.k ? .7 : 1), barre: V.k ? lisse(.02, .12, f) : 0 });
        if (V.k) tresse(ctx, C, { haut: A.a, bas: A.b, va: A.vb, cx: cx, corps: corps, yh: y2, yb: y3, p: p2, a: a, tenu: true, fantome: 0, trait: 1.5 * u });
        if (V.k === 0 && p >= 1) petit('la première solution : tout colle, et c’est faux', y2 + 46 * u, lisse(.86, .92, f));
        if (V.k === 1 && p >= 1) petit('lu à la séquence ' + A.lu + ' : ce n’était pas une maxime, c’était une dédicace', y3 + 46 * u, a * lisse(.86, .92, f), { col: C.ink });
      }
    } else {
      /* la planche : les six tressages, chacun sa signature */
      var av = lisse(0, .25, f);
      ANA.forEach(function (A, i) {
        var col = i % 3, rg = Math.floor(i / 3), x = L * (.2 + col * .27), y = H * (.14 + rg * .37), bas = A.b || A.a, corps = corpsPour(ctx, A.de.length > bas.length ? A.de : bas, L * .215, 34 * u);
        var va = A.b ? apparier(A.de, A.b) : A.va, p = lisse(i * .06, .5 + i * .06, f);
        tresse(ctx, C, { haut: A.de, bas: bas, va: va, cx: x, corps: corps, yh: y, yb: y + H * .25, p: p, a: av, tenu: A.tenu, deduit: A.deduit, fantome: .55, sansVol: true, trait: A.tenu ? 1.3 : .9 });
        LG.mot(ctx, A.latin, x, y - corps * 1.5, { p: 'lit', c: 15 * u, it: true, g: 300, col: C.ink2, a: av, al: 'center' });
      });
    }
  }

  function dire(t) {
    var s = Math.min(NB - 1, Math.floor(t * NB * .9999));
    if (s >= VOLS.length) return '<small>Les six</small>Six phrases, six tressages. Quatre désignent la prochaine victime ; une est une dédicace ; la dernière redit un nom.<em>« Spes donaia » : le film ne dit pas que c’est encore Assane Diop.</em>';
    var V = VOLS[s], A = V.A, n = nu(A.de).length;
    var tete = '<small>« ' + A.latin + ' » · ' + n + ' lettres</small>';
    if (A.b && V.k === 0) return tete + 'Assane cherche pendant des heures. Les lettres finissent par former un nom qu’il connaît : celui du garçon qui lui a laissé le premier livre.';
    if (A.b) return tete + 'Un courant d’air défait tout. Les mêmes dix-sept lettres retombent autrement : le patron de son père.<em>Qui a écrit cette dédicace, et quand ? Le script ne le dit pas.</em>';
    if (A.deduit) return tete + 'Dans le carnet du Maître, à l’endroit exact des deux autres. Les dix lettres du nom d’Assane, une deuxième fois.<em>Le film ne le signale pas : on le lit dans les lettres.</em>';
    if (A.vu === A.lu) return tete + 'Assane retourne la montre et lit son propre nom. Dix lettres : le voleur signe avec lui.';
    return tete + 'Montrée à la séquence ' + A.vu + ', lue à la ' + A.lu + '. Onze lettres : le nom de celui ou celle qu’on volera ensuite.';
  }
  LG.scene({ pas: PAS, pasDe: pasDe, course: NB * 82, dessin: dessin, dire: dire });
})();
