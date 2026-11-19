/* SOLARIS · LE LORE, GRAPHIQUE · LG-02 · Les marées.
   Huit lignes, une par personnage, le spectateur en bas. De gauche à droite, les treize séquences, à leur durée.
   Chaque fil est une phrase du script. Il court à plat tant qu'on l'ignore et se lève à la séquence où on l'apprend : plus quelqu'un sait, plus sa marée est haute.
   Plein : le script le dit. Pointillé ambre : le script le laisse entendre. Le trait orange est le présent : la molette le fait avancer dans le film.
   La table (qui sait quoi, à partir de quelle séquence) est celle de l'essai « Ce que chacun sait » (LO-D), recopiée telle quelle ; les croyances fausses n'y sont pas : elles ont leur essai (LG-03). */
(function () {
  'use strict';
  var LG = window.LG, M = window.LG_MONDE, lisse = LG.lisse, mel = LG.mel, c = LG.c;
  var SEQ = M.sequences, FIN = SEQ[SEQ.length - 1].a;

  /* avant : ce qu'il sait, il le sait avant le premier plan (le Maître a tout préparé ; Babakar est mort six semaines plus tôt) */
  var GENS = [
    { id: 'maitre', nom: 'Le Maître', avant: true }, { id: 'babakar', nom: 'Babakar', avant: true }, { id: 'gilbert', nom: 'Gilbert' }, { id: 'delvaux', nom: 'Delvaux' },
    { id: 'benjamin', nom: 'Benjamin' }, { id: 'juliette', nom: 'Juliette' }, { id: 'assane', nom: 'Assane' }, { id: 'spectateur', nom: 'Le spectateur' }
  ];
  /* nom → la séquence à partir de laquelle il le sait ; « ~ » : le script le laisse entendre */
  var PHRASES = [
    { t: 'Mon livre… mon livre a disparu !', qui: { gilbert: '1', assane: '1', delvaux: '1~', spectateur: '1', juliette: '2~', benjamin: '2~', maitre: '1~' } },
    { t: 'Tous connaissent la passion d’Assane pour les romans d’Arsène Lupin.', qui: { assane: '1', juliette: '1', benjamin: '1', gilbert: '1~', delvaux: '2~', spectateur: '1', maitre: '1~', babakar: '1~' } },
    { t: 'Rien n’arrive jamais par hasard.', qui: { babakar: '1', assane: '1', spectateur: '1' } },
    { t: 'Considère ça comme un cadeau.', qui: { gilbert: '1', assane: '1', spectateur: '1' } },
    { t: 'Et à chaque fois, c’est toi qui « trouves » les objets volés !', qui: { assane: '3', juliette: '3~', benjamin: '3', delvaux: '5~', spectateur: '3', maitre: '1~', gilbert: '3~' } },
    { t: 'Deux inscriptions latines, au même endroit précis.', qui: { assane: '4', spectateur: '4', maitre: '1~' } },
    { t: 'Tous les regards de l’école sont maintenant braqués sur lui.', qui: { assane: '5', benjamin: '5~', juliette: '5~', delvaux: '5~', spectateur: '5', maitre: '5~', gilbert: '5~' } },
    { t: 'Des anagrammes !', qui: { assane: '6', spectateur: '6', maitre: '1', juliette: '7', benjamin: '7' } },
    { t: 'Le mystérieux voleur vient de signer son dernier message avec le nom d’Assane lui-même.', qui: { assane: '8', spectateur: '8', maitre: '1', juliette: '9', benjamin: '9' } },
    { t: 'Une empreinte parfaite de la clé principale du collège.', qui: { assane: '8', spectateur: '8', juliette: '9', benjamin: '9' } },
    { t: 'Quelqu’un surveille Assane depuis le début.', qui: { assane: '11', spectateur: '11', maitre: '1' } },
    { t: 'C’était une dédicace cryptée.', qui: { assane: '12', spectateur: '12', maitre: '1~' } },
    { t: 'Un nouveau nom vient de rejoindre les rangs de l’École des Ombres.', qui: { maitre: '1', spectateur: '13' } },
    { t: 'Chaque détail de l’affaire du collège Saint-Maurice a été consigné, planifié, orchestré.', qui: { maitre: '1', spectateur: '13' } },
    { t: 'Sa démarche a cette grâce féline particulière.', qui: { spectateur: '13', maitre: '1' } }
  ];
  GENS.forEach(function (g) {
    g.fils = [];
    PHRASES.forEach(function (p, i) { var v = p.qui[g.id]; if (v) g.fils.push({ s: parseInt(v, 10), ded: v.indexOf('~') >= 0, p: p, i: i }); });
    g.fils.sort(function (a, b) { return a.s - b.s || a.i - b.i; });
  });
  var TOTAL = GENS.reduce(function (n, g) { return n + g.fils.length; }, 0);

  var PAS = ['avant le premier plan', 'le soupçon', 'le code', 'la traque', 'le dernier plan'];
  function seqA(t) { /* la séquence où est le présent (0 : avant le premier plan) */
    var p = lisse(.05, .93, t) * FIN; if (t < .05) return 0;
    for (var i = 0; i < SEQ.length; i++) if (p <= SEQ[i].a) return SEQ[i].n; return 13;
  }
  function pasDe(t) { var s = seqA(t); return s === 0 ? 0 : s <= 5 ? 1 : s <= 9 ? 2 : s <= 12 ? 3 : 4; }

  function dessin(ctx, L, H, t, C) {
    var u = L / 2000, x0 = L * .185, x1 = L * .89, haut = H * .1, bas = H * .78, marge = 96 * u, pli = 34 * u;
    function xf(s) { return mel(x0, x1, s / FIN); }
    function xs(n) { return xf((SEQ[n - 1].de + SEQ[n - 1].a) / 2); }
    var av = lisse(.05, .93, t), xp = mel(x0, x1, av), ici = seqA(t), fin = lisse(.94, 1, t);
    var pad = 30 * u, g = (bas - haut - GENS.length * pad) / TOTAL;

    /* le chiffre immense de la séquence, derrière, qui glisse avec le présent */
    if (ici > 0) LG.mot(ctx, String(ici), Math.min(xp - 26 * u, x1), bas - 40 * u, { p: 'nor', c: 560 * u, col: C.ink, a: .05, al: 'right' });

    /* les séquences, en bas : des graduations, les numéros */
    SEQ.forEach(function (q) {
      var x = xf(q.de); ctx.strokeStyle = c(C.ink, .4); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, bas + 8 * u); ctx.lineTo(x, bas + 15 * u); ctx.stroke();
      LG.mot(ctx, String(q.n), xs(q.n), bas + 30 * u, { p: 'mono', c: 10.5 * u, col: q.n === ici ? C.ink : C.ink3, al: 'center' });
    });
    LG.mot(ctx, 'avant', x0 - marge / 2, bas + 30 * u, { p: 'lit', c: 12.5 * u, it: true, g: 300, col: C.ink3, al: 'center' });

    var y = haut;
    GENS.forEach(function (G, gi) {
      var n = G.fils.length, base = y + n * g + pad; y = base;
      var deux = gi === 0 || gi === GENS.length - 1, force = 1 - fin * (deux ? 0 : .5);
      function leve(f, x) { var q = SEQ[f.s - 1], xl = G.avant ? x0 - marge * .55 : xf(q.de + .42 * (q.a - q.de)); return lisse(xl - pli, xl + pli, x); }
      function yFil(k, f, x) { return base - (k + 1) * g * leve(f, x); }
      var gauche = x0 - marge, pasX = 6 * u, x, k;

      /* la ligne de base, pâle, jusqu'au bout du film : ce qui n'est pas encore su */
      ctx.strokeStyle = c(C.ink, .2); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gauche, base); ctx.lineTo(x1, base); ctx.stroke();

      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, xp, H); ctx.clip();
      /* la marée : la lumière sous le fil le plus haut */
      if (n) {
        var hautG = base - n * g, gr = ctx.createLinearGradient(0, hautG, 0, base);
        gr.addColorStop(0, c(C.ink, (C.clair ? .26 : .34) * force)); gr.addColorStop(1, c(C.ink, .02));
        ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(gauche, base);
        for (x = gauche; x <= xp + pasX; x += pasX) { var m = base; for (k = 0; k < n; k++) m = Math.min(m, yFil(k, G.fils[k], x)); ctx.lineTo(x, m); }
        ctx.lineTo(Math.min(xp + pasX, x1), base); ctx.closePath(); ctx.fill();
      }
      /* les fils : une phrase chacun */
      G.fils.forEach(function (f, k) {
        ctx.strokeStyle = c(f.ded ? C.amb : C.ink, (f.ded ? .85 : .8) * force); ctx.lineWidth = f.ded ? .9 : .8; ctx.setLineDash(f.ded ? [3.5 * u, 3.5 * u] : []);
        ctx.beginPath(); for (x = gauche; x <= xp + pasX; x += pasX) { var yy = yFil(k, f, x); if (x === gauche) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); } ctx.stroke();
      });
      ctx.setLineDash([]); ctx.restore();

      /* là où le présent coupe la marée : un point */
      var sommet = base; G.fils.forEach(function (f, k) { sommet = Math.min(sommet, yFil(k, f, xp)); });
      ctx.fillStyle = c(C.ink, force); ctx.beginPath(); ctx.arc(xp, sommet, 2.6 * u, 0, 7); ctx.fill();

      LG.mot(ctx, G.nom.toUpperCase(), gauche - 26 * u, base, { p: 'nor', c: (deux ? 27 : 21) * u, col: C.ink, a: deux ? 1 : .82 * force, al: 'right', base: 'alphabetic' });
    });

    /* le présent : un seul trait orange, de haut en bas */
    LG.lueur(ctx, xp, (haut + bas) / 2, 120 * u, C.or, C.clair ? .05 : .08);
    ctx.strokeStyle = c(C.or, 1); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(xp, haut - 22 * u); ctx.lineTo(xp, bas + 12 * u); ctx.stroke();
    if (ici > 0) LG.mot(ctx, SEQ[ici - 1].titre, xp + (av > .8 ? -12 : 12) * u, haut - 26 * u, { p: 'lit', c: 15 * u, it: true, g: 300, col: C.ink, al: av > .8 ? 'right' : 'left', halo: C.bg });
    else LG.mot(ctx, 'avant le premier plan', xp + 12 * u, haut - 26 * u, { p: 'lit', c: 15 * u, it: true, g: 300, col: C.ink });
  }

  function noms(l) { return l.length > 1 ? l.slice(0, -1).join(', ') + ' et ' + l[l.length - 1] : l[0]; }
  function dire(t) {
    var s = seqA(t);
    if (s === 0) return '<small>Avant le premier plan</small>Le Maître tient déjà presque tout. Les autres lignes sont à plat : personne ne sait encore rien.<em>Ce qu’il sait, le script le laisse entendre : c’est lui qui écrit les phrases et qui pose les objets.</em>';
    if (t > .94) return '<small>Le dernier plan</small>Le spectateur a enfin tout. Assane s’arrête trois fils plus bas : il ne saura pas qui l’a choisi.<em>Delvaux n’a plus rien appris depuis la séquence 5.</em>';
    var appris = [], laisse = [];
    PHRASES.forEach(function (p) {
      var dits = [], deds = [];
      GENS.forEach(function (g) { var v = p.qui[g.id]; if (v && parseInt(v, 10) === s && !(g.avant)) (v.indexOf('~') >= 0 ? deds : dits).push(g.nom.replace(/^Le /, 'le ')); });
      if (dits.length) appris.push('« ' + p.t + ' » <span>' + noms(dits) + '.</span>'); else if (deds.length) laisse.push(noms(deds));
      if (dits.length && deds.length) laisse.push(noms(deds));
    });
    var q = SEQ[s - 1], tete = '<small>Séquence ' + s + ' · ' + q.titre + '</small>';
    if (!appris.length && !laisse.length) return tete + 'Ici, personne n’apprend rien de neuf. Les marées tiennent leur niveau.';
    return tete + (appris.length ? appris.slice(0, 2).join('<br>') : 'Rien n’est dit tout haut.') + (laisse.length ? '<em>Le script le laisse entendre pour ' + laisse[0] + '.</em>' : '');
  }
  LG.scene({ pas: PAS, pasDe: pasDe, course: 420, dessin: dessin, dire: dire });
})();
