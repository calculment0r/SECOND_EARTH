/* SOLARIS · LE LORE, GRAPHIQUE · LG-03 · Ce qu'on croyait.
   Une croyance fausse est une ligne tendue au-dessus du film, de la séquence où quelqu'un se met à y croire jusqu'à celle où la vérité arrive.
   Là, la ligne lâche et tombe sur le film, comme une eau. Trois grandes phrases, mot pour mot dans le script, et treize lignes : une par personnage qui y croit.
   Plein : le script le dit. Pointillé ambre : le script le laisse entendre. Les lignes de Delvaux ne tombent pas : elles sortent de l'écran.
   La table (qui croit quoi, de quelle séquence à quelle séquence) est celle des essais « Ce que chacun sait » (LO-D) et « Qui sait quoi » (ML-03), recopiée telle quelle.
   Le trait orange est le présent : la molette le fait avancer dans le film. */
(function () {
  'use strict';
  var LG = window.LG, M = window.LG_MONDE, lisse = LG.lisse, mel = LG.mel, c = LG.c;
  var SEQ = M.sequences, FIN = SEQ[SEQ.length - 1].a;
  function temps(n, part) { var q = SEQ[n - 1]; return q.de + part * (q.a - q.de); }

  /* de : le moment où il se met à y croire ; a : le moment où ça tombe (null : jamais) ; ded : le script le laisse entendre */
  var GROUPES = [
    { t: 'Une simple affaire de vols scolaires.', y: .1, vrai: '« Assane Diop. »', rang: 1, lignes: [
      { qui: 'Assane', de: temps(1, 0), a: temps(8, .55) }, { qui: 'le spectateur', de: temps(1, 0), a: temps(8, .55) },
      { qui: 'Juliette', de: temps(2, 0), a: temps(8, .55), ded: true }, { qui: 'Benjamin', de: temps(2, 0), a: temps(8, .55), ded: true },
      { qui: 'Delvaux', de: temps(1, .7), a: null, ded: true }] },
    { t: 'On sait tous que c’est toi !', y: .33, vrai: '« les deux seuls amis qui lui restent fidèles »', rang: 0, lignes: [
      { qui: 'Juliette', de: temps(2, 0), a: temps(7, .08) }, { qui: 'Benjamin', de: temps(2, 0), a: temps(7, .08) },
      { qui: 'Delvaux', de: temps(1, .7), a: null }] },
    { t: 'Le livre combat la mort.', y: .51, vrai: '« C’était une dédicace cryptée. »', rang: 1, lignes: [
      { qui: 'Assane', de: temps(1, 0), a: temps(12, .7) }, { qui: 'le spectateur', de: temps(4, .4), a: temps(12, .7) }] },
    { petit: true, t: 'Encore une de tes théories farfelues ?', y: .615, vrai: '« la terrible vérité »', rang: 0, lignes: [{ qui: 'Benjamin', de: temps(7, .25), a: temps(9, .6) }] },
    { petit: true, t: 'Et nous devrions croire à cette histoire d’anagrammes ?', y: .665, lignes: [{ qui: 'Delvaux', de: temps(8, .25), a: null }] },
    { petit: true, t: 'Gilbert… Gilbert Phinelerau', y: .725, vrai: '« À Hubert Pellegrini »', rang: 0, lignes: [{ qui: 'Assane', de: temps(12, .3), a: temps(12, .7) }] }
  ];

  var PAS = ['ce que tout le monde croit', 'les amis lâchent', 'le nom sur la montre', 'la dédicace', 'celui qui croit encore'];
  function ou(t) { return lisse(.04, .9, t) * FIN; }
  function pasDe(t) { var s = ou(t); return s < temps(7, 0) ? 0 : s < temps(8, .4) ? 1 : s < temps(11, 0) ? 2 : t < .93 ? 3 : 4; }

  function dessin(ctx, L, H, t, C) {
    var u = L / 2000, x0 = L * .15, x1 = L * .87, sol = H * .76, pas = 19 * u, chute = 80 * u;
    function xf(s) { return mel(x0, x1, s / FIN); }
    var xp = xf(ou(t)), fin = lisse(.93, 1, t);

    /* le film, au sol */
    ctx.strokeStyle = c(C.ink, .5); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, sol); ctx.lineTo(x1, sol); ctx.stroke();
    SEQ.forEach(function (q) {
      var x = xf(q.de); ctx.beginPath(); ctx.moveTo(x, sol); ctx.lineTo(x, sol + 7 * u); ctx.stroke();
      LG.mot(ctx, String(q.n), xf((q.de + q.a) / 2), sol + 24 * u, { p: 'mono', c: 10.5 * u, col: xp >= xf(q.de) && xp < xf(q.a) ? C.ink : C.ink3, al: 'center' });
    });

    GROUPES.forEach(function (G) {
      var yT = H * G.y, corps = (G.petit ? 17 : 54) * u, y0 = yT + (G.petit ? 14 : 34) * u;
      var debut = Math.min.apply(null, G.lignes.map(function (l) { return l.de; })), xT = G.petit ? xf(debut) : x0;
      var tombes = G.lignes.filter(function (l) { return l.a !== null; }), dernier = tombes.length ? Math.max.apply(null, tombes.map(function (l) { return l.a; })) : null;
      var barre = dernier === null ? 0 : lisse(xf(dernier), xf(dernier) + chute, xp), vu = lisse(xf(debut) - 30 * u, xf(debut) + 40 * u, xp + (G.petit ? 0 : 60 * u));
      /* la phrase : immense tant qu'on y croit, barrée d'un filet quand elle est tombée */
      if (vu > 0) {
        LG.mot(ctx, G.t, xT, yT, { p: 'lit', c: corps, it: true, g: 300, col: C.ink, a: vu * mel(1, .34, barre) });
        if (barre > 0) { LG.police(ctx, { p: 'lit', c: corps, it: true, g: 300 }); var l = ctx.measureText(G.t).width; ctx.strokeStyle = c(C.ink, .8); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xT - 6 * u, yT - corps * .27); ctx.lineTo(xT - 6 * u + (l + 12 * u) * barre, yT - corps * .27); ctx.stroke(); }
      }
      G.lignes.forEach(function (l, k) {
        var y = y0 + k * pas, xa = xf(l.de); if (xp < xa) return;
        var jamais = l.a === null, xc = jamais ? L * .975 : xf(l.a), f = jamais ? 0 : lisse(xc, xc + chute, xp), col = l.ded ? C.amb : C.ink;
        var force = mel(.92, .36, f) * (fin > 0 && !jamais ? mel(1, .7, fin) : 1);
        /* la ligne : tendue, puis qui tombe à la séquence où la vérité arrive */
        function tracer() {
          ctx.beginPath(); ctx.moveTo(xa, y);
          if (f <= 0) ctx.lineTo(jamais ? mel(xp, xc, fin) : Math.min(xp, xc), y);
          else { var xe = xc + (k + 1) * 7 * u; ctx.lineTo(Math.max(xa, xc - 120 * u), y); ctx.bezierCurveTo(xc - 20 * u, y, mel(xc, xe, f), y + (sol - y) * .3 * f, mel(xc, xe, f), mel(y, sol, f)); }
        }
        if (f < 1) { ctx.strokeStyle = c(col, .07 * (1 - f)); ctx.lineWidth = 11 * u; ctx.setLineDash([]); tracer(); ctx.stroke(); }
        ctx.strokeStyle = c(col, force); ctx.lineWidth = l.ded ? 1 : 1.2; ctx.setLineDash(l.ded ? [4 * u, 4 * u] : []); tracer(); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = c(col, force); ctx.beginPath(); ctx.arc(xa, y, 2.4 * u, 0, 7); ctx.fill();
        if (f >= 1) { ctx.beginPath(); ctx.arc(xc + (k + 1) * 7 * u, sol, 2 * u, 0, 7); ctx.fill(); }
        LG.mot(ctx, l.qui.toUpperCase(), xa - 12 * u, y + 4 * u, { p: 'nor', c: 12.5 * u, col: jamais && fin > 0 ? C.ink : l.ded ? C.amb : C.ink2, a: Math.max(force, .55), al: 'right', halo: C.bg });
        
      });
      /* ce qui la fait tomber, mot pour mot, posé au sol là où elle tombe */
      if (dernier !== null && G.vrai) {
        var xv = xf(dernier), av = lisse(xv + chute * .6, xv + chute * 1.5, xp);
        if (av > 0) {
          var yv = sol + (50 + 24 * G.rang) * u; ctx.strokeStyle = c(C.ink, .35 * av); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xv + 4 * u, sol + 32 * u); ctx.lineTo(xv + 4 * u, yv - 13 * u); ctx.stroke();
          LG.mot(ctx, G.vrai, xv + 4 * u, yv, { p: 'lit', c: 14 * u, it: true, g: 400, col: C.ink, a: av, al: 'center' });
        }
      }
    });

    /* le présent : un seul trait orange */
    LG.lueur(ctx, xp, sol - 180 * u, 150 * u, C.or, C.clair ? .05 : .08);
    ctx.strokeStyle = c(C.or, 1); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(xp, H * .045); ctx.lineTo(xp, sol + 10 * u); ctx.stroke();
  }

  function dire(t) {
    var s = ou(t), n = 1; SEQ.forEach(function (q) { if (s >= q.de) n = q.n; });
    var tete = '<small>Séquence ' + n + ' · ' + SEQ[n - 1].titre + '</small>';
    if (t < .04) return '<small>Le premier plan</small>Trois phrases vont tenir le collège. Chacune est une ligne tendue, et chaque ligne a quelqu’un qui y croit.';
    if (t >= .93) return '<small>Le dernier plan</small>Tout est tombé, sauf Delvaux. Trois lignes à lui sortent du film sans lâcher.<em>Il n’apprendra jamais la vérité.</em>';
    if (s < temps(7, 0)) return tete + 'Tout le monde y croit : des vols d’écoliers, et un coupable tout trouvé.<em>Pour Juliette et Benjamin, le script le laisse entendre : leurs silences.</em>';
    if (s < temps(8, .4)) return tete + 'À la fontaine, les deux amis lâchent les premiers. Ils ne disent plus « c’est toi ».';
    if (s < temps(11, 0)) return tete + 'Au dos de la montre, son propre nom. Ce n’était pas une affaire de vols : quatre lignes tombent d’un coup.';
    if (s < temps(12, .6)) return tete + 'Une phrase tient encore, depuis le premier plan. Assane la prend pour un conseil de son père.';
    return tete + 'Ce n’était pas un conseil : c’était une dédicace. La plus vieille ligne du film tombe la dernière.';
  }
  LG.scene({ pas: PAS, pasDe: pasDe, course: 420, dessin: dessin, dire: dire });
})();
