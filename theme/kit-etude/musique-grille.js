/* KIT ÉTUDE · LA GRILLE (id « grille »), à la manière du Launchpad et de la vue Session d'Ableton : huit pistes, huit rangées de boucles,
   une colonne qui lance toute une rangée, une rangée qui arrête. Un pad armé ATTEND le début de la mesure (hachures d'ambre), puis JOUE
   (orange, avec son trait d'avancement) et remplace celui qui jouait dans sa colonne. Toutes les boucles sont en la mineur et suivent
   l'horloge commune : tout va ensemble. Pas de couleur par piste : l'encre dit « il y a une boucle », l'orange « elle joue », l'ambre
   « elle attend ». Les flèches parcourent la grille, Entrée ou Espace arme. Aucun fichier son ; les jetons du kit, aucune couleur écrite. */
(function () {
  'use strict';
  var KE = window.KitEtude, S = KE.son, M = KE.musique; if (!M) return;
  var el = M.el, svg = M.svg, H = S.horloge;
  var V = M.percus;   /* les voix : musique-percus.js, communes aux trois instruments */

  /* ── écrire une boucle ── */
  var DEMI = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  function midi(n) { var m = /^([a-g])(#?)(\d)$/.exec(n); return 12 * (+m[3] + 1) + DEMI[m[1]] + (m[2] ? 1 : 0); }
  var ACCORDS = { la: ['a3', 'c4', 'e4', 'g4'], fa: ['f3', 'a3', 'c4', 'e4'], 'do': ['g3', 'c4', 'e4', 'b4'], mi: ['g3', 'b3', 'd4', 'e4'], la9: ['a3', 'e4', 'g4', 'b4', 'c5'], fa9: ['f3', 'c4', 'e4', 'g4', 'a4'] };
  var PERCUS = {
    gc: [function (c, d, t, v) { return V.grosse(c, d, t, v, { ton: .46, chute: .4 }); }, 7.2], cc: [function (c, d, t, v) { return V.claire(c, d, t, v, { ton: .5, claquant: .58 }); }, 5.6],
    cf: [function (c, d, t, v) { return V.charley(c, d, t, v * .85, { ton: .5 }); }, 2], co: [function (c, d, t, v) { return V.charley(c, d, t, v * .85, { ouvert: true, chute: .4 }); }, 1],
    cy: [function (c, d, t, v) { return V.cymbale(c, d, t, v, { ton: .5, chute: .5 }); }, 0], ma: [function (c, d, t, v) { return V.mains(c, d, t, v, { chute: .4 }); }, 4],
    cl: [function (c, d, t, v) { return V.cloche(c, d, t, v * .8, { ton: .5 }); }, 2.5], tg: [function (c, d, t, v) { return V.tom(c, d, t, v, { base: 82, chute: .45 }); }, 6.6], tm: [function (c, d, t, v) { return V.tom(c, d, t, v, { base: 124, chute: .4 }); }, 5.2],
    ta: [function (c, d, t, v) { return V.tom(c, d, t, v, { base: 176, chute: .35 }); }, 3.8], bc: [function (c, d, t, v) { return V.bord(c, d, t, v, { ton: .5 }); }, 3], mr: [function (c, d, t, v) { return V.maracas(c, d, t, v); }, 1.4]
  };
  /* une boucle = { nom, n (pas), ev: [{ s, y (hauteur du trait, 0..8), l (longueur en pas), j(c, d, t, v, d16) }] } */
  function percus(nom, lignes) {
    var ev = []; Object.keys(lignes).forEach(function (k) { lignes[k].split('').forEach(function (ch, s) { if (ch === '.') return; var f = ch === 'X' ? .95 : .6, p = PERCUS[k]; ev.push({ s: s, y: p[1], l: 1, coupe: k === 'cf' || k === 'co', ouvert: k === 'co', j: function (c, d, t) { return p[0](c, d, t, f); } }); }); });
    return { nom: nom, n: 16, ev: ev };
  }
  function ligne(nom, texte, voix, opt) {   /* « a1 . . a1:3 » : une note par pas, « . » rien, « :3 » tenue trois pas */
    opt = opt || {}; var jetons = texte.trim().split(/\s+/), ev = [], bas = 999, haut = 0, avant = null;
    jetons.forEach(function (j, s) { if (j === '.') return; var q = j.split(':'), m = midi(q[0]); bas = Math.min(bas, m); haut = Math.max(haut, m); ev.push({ s: s, m: m, l: +q[1] || 1 }); });
    ev.forEach(function (e) { e.y = haut === bas ? 4 : 7.4 - (e.m - bas) / (haut - bas) * 6.6; var dep = opt.lie && avant !== null && avant !== e.m ? avant : null; avant = e.m; e.j = function (c, d, t, v, d16) { return voix(c, d, t, v * (opt.force || .8), { note: e.m, duree: e.l * d16 * .92, depuis: dep, chute: opt.chute === undefined ? .35 : opt.chute, filtre: opt.filtre === undefined ? .55 : opt.filtre, mordant: opt.mordant || 0 }); }; });
    return { nom: nom, n: jetons.length, ev: ev };
  }
  function accords(nom, n, liste, opt) {   /* [[pas, 'la', tenue en pas], …] */
    opt = opt || {}; var ordre = Object.keys(ACCORDS);
    return { nom: nom, n: n, ev: liste.map(function (a) { var notes = ACCORDS[a[1]].map(midi); return { s: a[0], l: a[2] || 1, y: 1.5 + ordre.indexOf(a[1]) % 4 * 1.6, epais: true, j: function (c, d, t, v, d16) { return V.accord(c, d, t, v * (opt.force || .8), { notes: notes, duree: (a[2] || 1) * d16 * .9, filtre: opt.filtre === undefined ? .6 : opt.filtre, attaque: opt.attaque }); } }; }) };
  }
  function effet(nom, n, liste) { return { nom: nom, n: n, ev: liste.map(function (a) { return { s: a[0], l: a[2] || 4, y: 4, j: function (c, d, t, v) { return a[1](c, d, t, v); } }; }) }; }

  var PISTES = [
    { nom: 'Caisse', boucles: [
      percus('quatre temps', { gc: 'X...X...X...X...' }), percus('avec la claire', { gc: 'X...X...X...X...', cc: '....X.......X...' }), percus('brisé', { gc: 'X.....x...X..x..', cc: '....X.......X...' }),
      percus('demi-temps', { gc: 'X.........x.....', cc: '........X.......' }), percus('roulement', { gc: 'X...X...X...X...', cc: '....X..x.x..XxXX' }), null, percus('pied seul', { gc: 'X.......X.......' }), null] },
    { nom: 'Charleston', boucles: [
      percus('croches', { cf: 'X.x.X.x.X.x.X.x.' }), percus('doubles', { cf: 'xxXxxxXxxxXxxxXx' }), percus('contretemps', { co: '..X...X...X...X.' }), percus('ouvert, fermé', { cf: 'xx.xxx.xxx.xxx.x', co: '..X...x...X...x.' }),
      percus('cymbale', { cy: 'X...............', cf: '..x...x...x...x.' }), null, null, percus('maracas', { mr: 'x.xxx.xxx.xxx.xx' })] },
    { nom: 'Percussions', boucles: [
      percus('mains', { ma: '....X.......X...' }), percus('cloche', { cl: 'x..x..x...x..x..' }), percus('toms', { tg: '..........x...x.', tm: '........x....x..', ta: '......x.....x...' }), percus('bord', { bc: '..x....x..x..x..' }),
      null, percus('mains doublées', { ma: '....X..x....X.x.' }), null, null] },
    { nom: 'Basse', boucles: [
      ligne('pédale', 'a1 . . a1 . . a1 . . . a1 . a1 . . .', V.basse, { mordant: .4 }), ligne('octaves', 'a1 . a2 . a1 . a2 . a1 . a2 . a1 . a2 a1', V.basse, { mordant: .5, chute: .2 }),
      ligne('marche', 'a1 . . a1 . . c2 . . . d2 . . e2 . g1', V.basse, { mordant: .4, lie: true }), ligne('tenue', 'a1:7 . . . . . . . g1:5 . . . . . e1:2 .', V.basse, { filtre: .35 }),
      ligne('syncope', '. . a1 . . a1 . . a1 . . . g1 . a1 .', V.basse, { mordant: .6, chute: .25 }), ligne('fa, sol', 'f1 . . f1 . . f1 . g1 . . g1 . . g1 .', V.basse, { mordant: .4 }), null, null] },
    { nom: 'Accords', boucles: [
      accords('plaqué', 16, [[0, 'la', 3]]), accords('contretemps', 16, [[2, 'la', 1], [6, 'la', 1], [10, 'la', 1], [14, 'la', 1]], { filtre: .75 }),
      accords('quatre accords', 64, [[0, 'la', 3], [6, 'la', 2], [16, 'fa', 3], [22, 'fa', 2], [32, 'do', 3], [38, 'do', 2], [48, 'mi', 3], [54, 'mi', 2]]),
      accords('syncopé', 16, [[0, 'la', 2], [3, 'la', 2], [6, 'la', 2], [8, 'fa', 2], [11, 'fa', 2], [14, 'fa', 1]], { filtre: .7 }), null, accords('la, fa', 32, [[0, 'la9', 6], [16, 'fa9', 6]], { filtre: .5 }), null, null] },
    { nom: 'Arpège', boucles: [
      ligne('montant', 'a3 c4 e4 a4 c5 e4 a4 c4 a3 c4 e4 g4 c5 e4 g4 c4', V.pique, { force: .7 }), ligne('descendant', 'e5 c5 a4 e4 c5 a4 e4 c4 d5 c5 a4 e4 c5 g4 e4 c4', V.pique, { force: .7 }),
      ligne('large', 'a2 . a3 . e4 . a4 . c5 . a4 . e4 . a3 .', V.pique, { force: .75, chute: .6 }), null, ligne('verre', 'e5 . . . . . c5 . . . a4 . . . . .', V.verre, { force: .7, chute: .4 }),
      ligne('pluie', 'a4 e5 a4 e5 g4 e5 g4 e5 f4 c5 f4 c5 g4 d5 g4 d5', V.pique, { force: .6, chute: .2 }), null, null] },
    { nom: 'Chant', boucles: [
      ligne('appel', 'e5:3 . . . d5:2 . c5:3 . . . a4:4 . . . . . . . . . . . . . . . . . . . . .', V.voix, { lie: true }), null,
      ligne('réponse', '. . . . . . . . . . . . . . . . a4:2 . c5:2 . d5:3 . . . e5:2 . g5:5 . . . . .', V.voix, { lie: true }), ligne('tenue', 'a4:12 . . . . . . . . . . . . . . . g4:12 . . . . . . . . . . . . . . .', V.voix, { filtre: .3 }),
      null, ligne('haut', 'a5:2 . . g5 . . e5:2 . . d5 . . e5:3 . . .', V.voix, { lie: true, filtre: .7 }), null, null] },
    { nom: 'Nappe', boucles: [
      accords('la mineur', 32, [[0, 'la9', 30]], { attaque: .9, filtre: .35, force: .7 }), accords('fa', 32, [[0, 'fa9', 30]], { attaque: .9, filtre: .35, force: .7 }), null,
      accords('quatre accords', 64, [[0, 'la9', 15], [16, 'fa9', 15], [32, 'do', 15], [48, 'mi', 15]], { attaque: .6, filtre: .4, force: .7 }),
      effet('souffle', 64, [[52, function (c, d, t, v) { return V.vent(c, d, t, v * .7, { chute: .75, filtre: .7 }); }, 12]]), null, effet('chute', 32, [[0, function (c, d, t, v) { return V.chute(c, d, t, v * .6, { chute: .8, note: 93 }); }, 3]]), null] }
  ];

  M.definir('grille', {
    nom: 'La', accent: 'grille', sous: 'huit pistes, soixante-quatre cases', maniere: 'du Launchpad',
    geste: 'Un clic arme une boucle : elle attend le début de la mesure, puis joue et remplace celle de sa colonne. La colonne de droite lance toute une rangée. Les flèches parcourent la grille, Entrée arme.',
    monter: function (corps, voie) {
      var NP = PISTES.length, NR = 8, etat = [], cases = [], scenes = [], arrets = [], bus = null, voies = [], niveaux = [], robinets = [], tout, dit;
      for (var p = 0; p < NP; p++) { etat.push({ joue: null, debut: 0, attente: undefined }); niveaux.push(.8); cases.push([]); }
      function sortie(p) {
        if (!bus) { var e = voie.ouvrir(); if (!e) return null; bus = S.ctx.createGain(); bus.gain.value = .8; bus.connect(e); }
        if (!voies[p]) { voies[p] = S.ctx.createGain(); voies[p].gain.value = niveaux[p]; voies[p].connect(bus); } return voies[p];
      }

      /* ── peindre ── */
      function peindre() {
        var joue = 0, attend = 0;
        for (var p = 0; p < NP; p++) {
          var e = etat[p]; if (e.joue !== null) joue++; if (typeof e.attente === 'number') attend++;
          for (var r = 0; r < NR; r++) { var b = cases[p][r]; b.classList.toggle('joue', e.joue === r && !!PISTES[p].boucles[r]); b.classList.toggle('attente', e.attente === r && !!PISTES[p].boucles[r]); if (e.joue !== r) b.style.removeProperty('--av'); }
          arrets[p].classList.toggle('attente', e.attente === 'arret' && e.joue !== null); arrets[p].disabled = e.joue === null && typeof e.attente !== 'number';
        }
        scenes.forEach(function (b, r) { var n = 0, t = 0; for (var p = 0; p < NP; p++) if (PISTES[p].boucles[r]) { t++; if (etat[p].joue === r) n++; } b.classList.toggle('joue', t > 0 && n === t); });
        tout.disabled = !joue && !attend;
        dit.textContent = joue || attend ? (joue ? joue + (joue > 1 ? ' boucles jouent' : ' boucle joue') : 'rien ne joue encore') + (attend ? ' · ' + attend + (attend > 1 ? ' attendent' : ' attend') + ' la mesure' : '') : 'rien ne joue · arme une boucle, ou lance une rangée';
      }
      function armer(p, r) {
        S.ouvrir(); var e = etat[p], b = PISTES[p].boucles[r];
        if (!b) { if (e.joue !== null || e.attente !== undefined) e.attente = e.joue === null ? undefined : 'arret'; }   /* une case vide arrête la colonne */
        else if (e.attente === r) e.attente = undefined;                                   /* un second clic désarme */
        else if (e.joue === r) e.attente = e.attente === 'arret' ? undefined : 'arret';     /* cliquer la boucle qui joue : elle s'arrêtera à la mesure */
        else e.attente = r;
        peindre(); if (!H.joue && etat.some(function (x) { return typeof x.attente === 'number'; })) H.jouer();
      }
      function arreter(p) { var e = etat[p]; if (e.joue !== null) e.attente = e.attente === 'arret' ? undefined : 'arret'; else e.attente = undefined; peindre(); }
      function scene(r) { S.ouvrir(); for (var p = 0; p < NP; p++) { var e = etat[p]; if (PISTES[p].boucles[r]) e.attente = e.joue === r ? undefined : r; else e.attente = e.joue === null ? undefined : 'arret'; } peindre(); if (!H.joue) H.jouer(); }

      /* ── la façade ── */
      function glyphe(b) {   /* la boucle en petit : un trait par note, sa hauteur dit la note, sa longueur la tenue */
        var s = svg('svg', { viewBox: '0 0 128 18', preserveAspectRatio: 'none', 'aria-hidden': 'true' }), d = '', k = 128 / b.n;
        b.ev.forEach(function (e) { var x = e.s * k, w = Math.max(1.6, e.l * k - 1.2), y = 1 + e.y * 1.9, h = e.epais ? 4.4 : 2.2; d += 'M' + x.toFixed(1) + ' ' + y.toFixed(1) + 'h' + w.toFixed(1) + 'v' + h + 'h-' + w.toFixed(1) + 'z'; });
        s.appendChild(svg('path', { d: d })); return s;
      }
      var grille = el('div', { class: 'mu-grille', role: 'grid', 'aria-label': 'La grille des boucles' }), tous = [];
      function naviguer(b, col, rang) {
        b.dataset.c = col; b.dataset.r = rang; b.tabIndex = col === 0 && rang === 0 ? 0 : -1; tous.push(b);
        b.addEventListener('keydown', function (e) {
          var dc = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0, dr = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0; if (!dc && !dr) return; e.preventDefault();
          var c = col + dc, r = rang + dr, v = null; while (c >= 0 && c <= NP && r >= 0 && r <= NR && !v) { v = tous.filter(function (x) { return +x.dataset.c === c && +x.dataset.r === r && !x.disabled; })[0]; c += dc; r += dr; }
          if (v) { tous.forEach(function (x) { x.tabIndex = -1; }); v.tabIndex = 0; v.focus(); }
        });
      }
      var entete = el('div', { class: 'mu-grille-rang entete', role: 'row' });
      PISTES.forEach(function (P, p) { entete.appendChild(el('span', { class: 'mu-grille-piste', role: 'columnheader' }, [el('b', { text: ('0' + (p + 1)).slice(-2) }), P.nom])); });
      entete.appendChild(el('span', { class: 'mu-grille-piste scene', role: 'columnheader', text: 'Rangée' })); grille.appendChild(entete);
      for (var r = 0; r < NR; r++) (function (r) {
        var rang = el('div', { class: 'mu-grille-rang', role: 'row' });
        PISTES.forEach(function (P, p) {
          var b = P.boucles[r], x = el('button', { type: 'button', class: 'mu-pad mu-grille-pad' + (b ? ' pleine' : ' vide'), role: 'gridcell', 'aria-label': P.nom + ', rangée ' + (r + 1) + ' : ' + (b ? b.nom : 'vide (arrête la piste)') }, b ? [el('i', { text: b.nom }), glyphe(b), el('u')] : []);
          x.addEventListener('click', function () { armer(p, r); }); naviguer(x, p, r); cases[p].push(x); rang.appendChild(x);
        });
        var s = el('button', { type: 'button', class: 'mu-grille-scene', 'aria-label': 'Lancer la rangée ' + (r + 1) }, [el('b', { text: String(r + 1) }), el('span', { text: 'lancer' })]);
        s.addEventListener('click', function () { scene(r); }); naviguer(s, NP, r); scenes.push(s); rang.appendChild(s); grille.appendChild(rang);
      })(r);
      var pied = el('div', { class: 'mu-grille-rang pied', role: 'row' });
      PISTES.forEach(function (P, p) { var a = el('button', { type: 'button', class: 'mu-grille-arret', disabled: '', 'aria-label': 'Arrêter ' + P.nom, text: 'arrêter' }); a.addEventListener('click', function () { arreter(p); }); naviguer(a, p, NR); arrets.push(a); pied.appendChild(a); });
      tout = el('button', { type: 'button', class: 'mu-grille-arret tout', disabled: '', text: 'tout arrêter' }); tout.addEventListener('click', function () { for (var p = 0; p < NP; p++) arreter2(p); peindre(); }); naviguer(tout, NP, NR); pied.appendChild(tout); grille.appendChild(pied);
      function arreter2(p) { var e = etat[p]; e.attente = e.joue !== null ? 'arret' : undefined; }
      var rangNiv = el('div', { class: 'mu-grille-rang niveaux' });
      PISTES.forEach(function (P, p) { var c = el('div', { class: 'ke-curseur', 'data-min': 0, 'data-max': 100, 'data-valeur': 80, 'aria-label': 'Niveau de ' + P.nom }); KE.curseur(c); c.addEventListener('ke:change', function (e) { niveaux[p] = e.detail.valeur / 100; if (voies[p]) voies[p].gain.setTargetAtTime(niveaux[p], S.ctx.currentTime, .02); }); rangNiv.appendChild(c); });
      rangNiv.appendChild(el('span', { class: 'mu-etiq', text: 'les niveaux' })); grille.appendChild(rangNiv);
      dit = el('p', { class: 'mu-grille-dit', 'aria-live': 'polite' });
      var mesure = el('div', { class: 'mu-mesure mu-grille-mesure', 'aria-hidden': 'true' }); for (var k = 0; k < 4; k++) mesure.appendChild(el('i'));
      corps.appendChild(el('div', { class: 'mu-grille-haut' }, [dit, el('span', { class: 'mu-etiq', text: 'la mineur · quatre mesures' }), mesure]));
      corps.appendChild(grille);

      /* ── suivre l'horloge : on change de boucle au début d'une mesure, jamais au milieu ── */
      H.surPas(function (pas, quand, d16) {
        var change = false, av = [];
        if (pas % 16 === 0) etat.forEach(function (e) { if (e.attente === undefined) return; e.joue = e.attente === 'arret' ? null : e.attente; e.debut = pas; e.attente = undefined; change = true; });
        etat.forEach(function (e, p) {
          if (e.joue === null) return; var b = PISTES[p].boucles[e.joue], s = (pas - e.debut) % b.n, d = sortie(p); av.push([p, e.joue, (s + 1) / b.n]); if (!d) return;
          b.ev.forEach(function (x) {
            if (x.s !== s) return; if (x.coupe && robinets[p]) { robinets[p](quand); robinets[p] = null; }
            var y = x.j(S.ctx, d, quand, 1, d16); if (x.ouvert && y && y.etouffe) robinets[p] = y.etouffe;
          });
        });
        H.aLInstant(quand, function () { if (!H.joue) return; if (change) peindre(); av.forEach(function (a) { if (etat[a[0]].joue === a[1]) cases[a[0]][a[1]].style.setProperty('--av', a[2]); }); [].forEach.call(mesure.children, function (x, k) { x.classList.toggle('ici', k === Math.floor(pas / 16) % 4); }); });
      });
      /* à l'arrêt, ce qui jouait reste armé : « Lire » le relance */
      document.addEventListener('ke:horloge', function (e) { if (e.detail.joue) return; etat.forEach(function (x) { if (x.joue !== null && x.attente === undefined) x.attente = x.joue; else if (x.attente === 'arret') x.attente = undefined; x.joue = null; }); [].forEach.call(mesure.children, function (x) { x.classList.remove('ici'); }); peindre(); });
      peindre();
      return {};
    }
  });
})();
