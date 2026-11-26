/* KIT ÉTUDE · la page de la dataviz : les planches et leurs données d'exemple (fabriquées, neutres, toujours les mêmes). */
(function () {
  'use strict';
  var V = window.KitEtude.viz, U = V.outils, H = U.H, S = U.S, alea = U.alea, r = alea(11);
  var MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  var LIEUX = ['Nord', 'Rive', 'Port', 'Halle', 'Gare', 'Colline', 'Canal', 'Parc', 'Fort', 'Marais', 'Phare', 'Verger'];
  function serie(n, base, amp, tend, g) { var a = alea(g), v = base, t = []; for (var i = 0; i < n; i++) { v += (a() - .5) * amp + tend; t.push(Math.max(0, Math.round(v))); } return t; }
  function vague(n, c, l, h, g) { var a = alea(g), t = []; for (var i = 0; i < n; i++) t.push(Math.max(0, Math.round(h * Math.exp(-Math.pow((i - c) / l, 2)) + a() * h * .08))); return t; }
  function normale(a) { return (a() + a() + a() + a() - 2) / .58; }
  function tirage(n, m, e, g, q) { var a = alea(g), t = []; for (var i = 0; i < n; i++) t.push(Math.round(m + normale(a) * e + (q && a() < .12 ? q : 0))); return t; }
  var semaines = []; for (var w = 0; w < 30; w++) semaines.push('s. ' + (w + 1));
  var mois24 = []; for (var m = 0; m < 24; m++) mois24.push(MOIS[m % 12] + (m % 12 === 0 ? ' ' + (2025 + m / 12) : ''));

  var cv = serie(22, 40, 14, 3.2, 5), cb = cv.map(function (v, i) { return Math.round(v - 6 - i * .5); }), ch = cv.map(function (v, i) { return Math.round(v + 6 + i * .5); });
  var jours = (function () { var a = alea(21), t = []; for (var i = 0; i < 365; i++) { var j = (i + 3) % 7; t.push(i > 130 && i < 142 ? null : Math.round((j > 4 ? 6 : 22) + a() * 26 + 14 * Math.sin(i / 58))); } return t; })();
  var spir = (function () { var a = alea(8), t = []; for (var i = 0; i < 156; i++) t.push(Math.round(30 + 24 * Math.sin((i % 52) / 52 * 2 * Math.PI - 1.2) + a() * 14 + i * .12)); return t; })();
  var pts = (function () { var a = alea(31), t = []; for (var i = 0; i < 64; i++) { var x = 10 + a() * 80; t.push({ nom: LIEUX[i % 12] + ' ' + (1 + Math.floor(i / 12)), x: Math.round(x), y: Math.round(20 + x * .7 + normale(a) * 14) }); } t[7].dit = 1; t[40].dit = 1; t[58].deduit = 1; return t; })();
  var mesures = tirage(600, 46, 13, 4, 30);
  var groupesV = [{ nom: 'le matin', v: tirage(140, 34, 7, 2) }, { nom: 'le midi', v: tirage(180, 52, 11, 3, 26) }, { nom: 'le soir', v: tirage(160, 44, 15, 6) }, { nom: 'la nuit', v: tirage(60, 22, 6, 9, 30) }];
  var ARBRE = { nom: 'Le tout', enfants: [{ nom: 'Rive nord', enfants: [{ nom: 'Port', v: 34 }, { nom: 'Halle', v: 21 }, { nom: 'Phare', v: 9 }, { nom: 'Quai neuf', v: 6, deduit: true }] }, { nom: 'Centre', enfants: [{ nom: 'Gare', v: 42 }, { nom: 'Parc', v: 17 }, { nom: 'Marché', v: 13 }, { nom: 'Fort', v: 8, inconnu: true }, { nom: 'Cour', v: 5 }] }, { nom: 'Hauts', enfants: [{ nom: 'Colline', v: 19 }, { nom: 'Verger', v: 11 }, { nom: 'Source', v: 4 }] }, { nom: 'Rive sud', enfants: [{ nom: 'Canal', v: 24 }, { nom: 'Marais', v: 12 }, { nom: 'Écluse', v: 7 }] }] };
  var RES = (function () { var a = alea(17), n = LIEUX.concat(['Source', 'Écluse', 'Marché', 'Cour', 'Quai', 'Pont']), nd = n.map(function (x, i) { return { nom: x, poids: 1 }; }), l = [], i; for (i = 1; i < nd.length; i++) { var b = Math.floor(a() * i * .7); l.push({ a: i, b: b, v: 1 + Math.floor(a() * 3) }); nd[i].poids++; nd[b].poids++; } for (i = 0; i < 7; i++) { var p = Math.floor(a() * nd.length), q = Math.floor(a() * nd.length); if (p !== q) { l.push({ a: p, b: q, v: 1 }); nd[p].poids++; nd[q].poids++; } } l[3].v = 5; l.push({ a: 4, b: 15, v: 1, deduit: true }); nd[11].inconnu = true; return { noeuds: nd, liens: l }; })();
  var MAT = (function () { var a = alea(13), n = 12, m = []; for (var i = 0; i < n; i++) { m.push([]); for (var j = 0; j < n; j++) m[i].push(0); } for (i = 0; i < n; i++) for (j = i; j < n; j++) { var memeBloc = Math.floor(i / 4) === Math.floor(j / 4), v = a() < (memeBloc ? .85 : .16) ? Math.ceil(a() * (memeBloc ? 9 : 4)) : 0; m[i][j] = m[j][i] = i === j ? 0 : v; } m[3][9] = m[9][3] = null; return m; })();

  var PLANCHES = [
    /* ── le temps ── */
    { f: 'temps', l: 7, nom: 'la courbe', titre: 'Où va la courbe ?', geste: 'Parcours-la ; au clavier, les flèches.', fn: 'courbe', o: { h: 330 }, repos: { sur: 'aujourd’hui, semaine 22', val: cv[21] + ' pages', txt: 'la bande dit la marge ; la suite, en ambre, est déduite' },
      d: { noms: semaines, v: cv, bas: cb, haut: ch, unite: 'pages', note: { i: 9, txt: 'la reprise' }, deduit: [1, 2, 3, 4, 5, 6, 7, 8].map(function (k) { var v = cv[21] + k * 3.4; return { v: Math.round(v), bas: Math.round(v - 12 - k * 2.6), haut: Math.round(v + 12 + k * 2.6) }; }) } },
    { f: 'temps', l: 5, nom: 'les crêtes', titre: 'Quand chacun culmine-t-il ?', geste: 'Survole une ligne.', fn: 'cretes', repos: { sur: 'sept lieux, vingt-quatre heures', txt: 'chaque ligne est un lieu ; le phare est déduit, le parc a un trou' },
      d: { unite: 'passages', noms: ['0 h', '', '', '3 h', '', '', '6 h', '', '', '9 h', '', '', 'midi', '', '', '15 h', '', '', '18 h', '', '', '21 h', '', ''].map(function (t, i) { return t || (i + ' h'); }), series: [['La gare', 8, 3, 60], ['Le marché', 10, 2.5, 48], ['La halle', 12.5, 2, 70], ['Le parc', 15, 4, 40], ['Le port', 17.5, 3, 55], ['Le canal', 20, 2.5, 66], ['Le phare', 22, 1.8, 30]].map(function (s, k) { var v = vague(24, s[1], s[2], s[3], 40 + k); if (k === 3) { v[9] = v[10] = v[11] = null; } return { nom: s[0], v: v, deduit: k === 6 }; }) } },
    { f: 'temps', l: 7, nom: 'le fleuve', titre: 'Qui prend la place, et quand ?', geste: 'Survole une couche ; Tab puis flèches.', fn: 'fleuve', o: { h: 320 }, repos: { sur: 'cinq voix, vingt-quatre mois', txt: 'l’épaisseur d’une couche est sa part ; le tout s’épaissit et s’amincit autour d’un axe' },
      d: { unite: 'heures', noms: mois24, series: [['les cordes', 4, 5, 30], ['la voix', 9, 4, 44], ['le piano', 13, 6, 36], ['les cuivres', 17, 3.5, 40], ['la basse', 21, 5, 28]].map(function (s, k) { return { nom: s[0], v: vague(24, s[1], s[2], s[3], 60 + k).map(function (v) { return v + 6; }) }; }) } },
    { f: 'temps', l: 5, nom: 'l’horizon', titre: 'Où l’écart est-il le plus fort ?', geste: 'Parcours ; les valeurs suivent à droite.', fn: 'horizon', repos: { sur: 'l’écart à la moyenne', txt: 'ce qui monte part du bas, ce qui descend pend du haut ; plus l’encre est forte, plus c’est loin' },
      d: { noms: mois24, series: LIEUX.slice(0, 7).map(function (n, k) { var a = alea(80 + k), v = 0, t = mois24.map(function (_, i) { v = v * .7 + (a() - .5) * 26; return Math.round(v + 10 * Math.sin(i / 3 + k)); }); if (k === 2) t[13] = t[14] = null; return k === 5 ? { nom: n, v: t, deduitDepuis: 18 } : { nom: n, v: t }; }) } },
    { f: 'temps', l: 12, nom: 'le calendrier', titre: 'Quels jours comptent ?', geste: 'Une case par jour. Flèches : un jour, une semaine.', fn: 'calendrier', repos: { sur: 'une année', txt: 'plus la case porte d’encre, plus le jour est plein ; hachuré, on ne sait pas ; en pointillé d’ambre, ce qui est prévu' }, d: { annee: 2026, v: jours, deduitDepuis: 322, unite: 'passages' } },
    { f: 'temps', l: 4, nom: 'la spirale', titre: 'Est-ce que ça revient ?', geste: 'Un tour par an. Survole un trait.', fn: 'spirale', repos: { sur: 'trois ans, semaine par semaine', txt: 'les mêmes semaines se font face d’un tour à l’autre' }, d: { v: spir, an0: 2024, unite: 'entrées', deduitDepuis: 148 } },
    { f: 'temps', l: 8, nom: 'la frise de travail', titre: 'Qu’est-ce qui attend quoi ?', geste: 'Survole une ligne : ce qu’elle attend se trace.', fn: 'gantt', repos: { sur: 'vingt-quatre semaines', txt: 'encre : fait ; gris : à faire ; ambre pointillé : déduit ; le losange est un jalon' },
      d: { fin: 24, aujourdhui: 9.5, pas: 4, lignes: [{ nom: 'Écrire', d: 0, f: 6 }, { nom: 'Relire', d: 5, f: 8, apres: 0 }, { nom: 'Texte arrêté', d: 8, jalon: true, apres: 1 }, { nom: 'Dessiner', d: 8, f: 14, apres: 2 }, { nom: 'Enregistrer', d: 10, f: 13 }, { nom: 'Monter', d: 14, f: 19, apres: 3 }, { nom: 'Mixer', d: 18, f: 21, deduit: true, apres: 5 }, { nom: 'Livrer', d: 22, jalon: true, deduit: true, apres: 6 }] } },
    { f: 'temps', l: 12, nom: 'les petits multiples', titre: 'Qui suit le même chemin ?', geste: 'Un seul viseur pour toutes les cases.', fn: 'multiples', o: { colonnes: 6 }, repos: { sur: 'douze lieux, la même échelle', txt: 'la même échelle partout : on compare les formes d’un coup d’œil' },
      d: { unite: 'passages', noms: mois24, series: LIEUX.map(function (n, k) { return { nom: n, v: serie(24, 44 + (k * 7) % 30, 9, (k % 5 - 1.6) * .9, 100 + k) }; }) } },
    /* ── la comparaison ── */
    { f: 'comparer', l: 6, nom: 'les barres fines', titre: 'Qui pèse le plus ?', geste: 'Change le tri d’un mot.', fn: 'barres', o: { tris: true, tenu: 2 }, repos: { sur: 'dix lieux', txt: 'la barre est un trait ; le nombre s’écrit contre elle' },
      d: { unite: 'heures', lignes: [['La gare', 42], ['Le port', 34], ['Le canal', 24], ['La halle', 21], ['La colline', 19], ['Le parc', 17], ['Le marais', 12, 'd'], ['Le verger', 11], ['Le phare', 9], ['Le fort', 0, 'i']].map(function (x) { return { nom: x[0], v: x[1], deduit: x[2] === 'd', inconnu: x[2] === 'i' }; }) } },
    { f: 'comparer', l: 6, nom: 'les haltères', titre: 'Qu’est-ce qui a changé ?', geste: 'Du rond creux au rond plein.', fn: 'halteres', repos: { sur: 'avant, après', txt: 'creux : avant ; plein : après ; rangé du plus grand gain à la plus grande perte' },
      d: { noms: ['avant', 'après'], unite: 'points', lignes: LIEUX.slice(0, 10).map(function (n, k) { var a = 20 + (k * 17) % 50; return { nom: n, a: a, b: a + [22, 14, 9, 6, 3, -2, -5, -9, 12, -14][k] }; }) } },
    { f: 'comparer', l: 5, nom: 'les pentes', titre: 'Qui monte, qui descend ?', geste: 'Survole une pente.', fn: 'pentes', o: { tenu: 3 }, repos: { sur: 'deux dates', txt: 'la pente dit le sens et la force ; Verger est déduit, Fort pas encore mesuré' },
      d: { noms: ['2024', '2026'], lignes: [['Gare', 62, 71], ['Port', 55, 48], ['Canal', 41, 58], ['Halle', 38, 66], ['Parc', 30, 27], ['Phare', 22, 35], ['Fort', 15, null], ['Verger', 9, 20, 1]].map(function (x) { return { nom: x[0], a: x[1], b: x[2], deduit: !!x[3] }; }) } },
    { f: 'comparer', l: 7, nom: 'le classement', titre: 'Qui passe devant ?', geste: 'Survole une ligne : elle passe au premier plan.', fn: 'classement', o: { tenu: 4 }, repos: { sur: 'huit saisons', txt: 'les croisements disent qui double qui ; la fin d’une ligne est déduite, un rang manque' },
      d: { noms: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'], series: (function () { var noms = LIEUX.slice(0, 8), ordre = [0, 1, 2, 3, 4, 5, 6, 7], a = alea(3), s = noms.map(function (n) { return { nom: n, rangs: [] }; }); for (var t = 0; t < 8; t++) { ordre.forEach(function (k, rg) { s[k].rangs.push(rg + 1); }); for (var e = 0; e < 3; e++) { var p = Math.floor(a() * 7), x = ordre[p]; ordre[p] = ordre[p + 1]; ordre[p + 1] = x; } } s[6].rangs[3] = null; s[2].deduitDepuis = 6; return s; })() } },
    { f: 'comparer', l: 7, nom: 'l’essaim', titre: 'Où se serrent-ils ?', geste: 'Chaque point est une chose.', fn: 'essaim', o: { h: 260 }, repos: { sur: 'cent quarante mesures', txt: 'aucun point n’en cache un autre : l’épaisseur de l’essaim dit le nombre' },
      d: { unite: 'min', points: tirage(140, 48, 14, 15, 28).map(function (v, i) { return { nom: 'mesure ' + (i + 1), v: v, deduit: i % 37 === 5 }; }) } },
    { f: 'comparer', l: 5, nom: 'le radar en fil', titre: 'Quel profil ?', geste: 'Survole un sommet.', fn: 'radar', repos: { sur: 'six mesures, trois profils', txt: 'trait plein : celui-ci ; tirets : l’habitude ; ambre : ce qui est visé' },
      d: { axes: ['durée', 'voix', 'lieux', 'nuit', 'musique', 'silence'], max: 10, profils: [{ nom: 'celui-ci', v: [8, 5, 6, 9, 4, 7] }, { nom: 'l’habitude', v: [5, 7, null, 3, 6, 4], style: 'tirets' }, { nom: 'visé', v: [7, 6, 7, 8, 6, 8], style: 'ded' }] }, legende: [{ nom: 'celui-ci', marque: 'trait' }, { nom: 'l’habitude', marque: 'tirets' }, { nom: 'visé, déduit', marque: 'ded' }, { nom: 'on ne sait pas', marque: 'hach' }] },
    { f: 'comparer', l: 6, nom: 'le nuage', titre: 'Les deux vont-ils ensemble ?', geste: 'Survole un point : il se lit sur les deux axes.', fn: 'nuage', repos: { sur: 'deux mesures, soixante-quatre lieux', txt: 'dans les marges, un trait par point : chaque mesure seule' }, d: { points: pts, x: 'la durée', y: 'le nombre de voix' } },
    { f: 'comparer', l: 6, nom: 'les coordonnées parallèles', titre: 'Qui se ressemble sur tout ?', geste: 'Survole une ligne : ses cinq valeurs s’écrivent.', fn: 'paralleles', o: { h: 400 }, repos: { sur: 'cinq mesures, quarante lieux', txt: 'une ligne par lieu ; les faisceaux serrés sont des familles' },
      d: { axes: [{ nom: 'durée', min: 0, max: 100 }, { nom: 'voix', min: 0, max: 12 }, { nom: 'lieux', min: 0, max: 30 }, { nom: 'nuit', min: 0, max: 100 }, { nom: 'silence', min: 0, max: 60 }], lignes: (function () { var a = alea(44), t = []; for (var i = 0; i < 40; i++) { var fam = i % 3, b = [[70, 9, 8, 80, 12], [35, 4, 22, 30, 40], [55, 6, 14, 55, 25]][fam]; t.push({ nom: LIEUX[i % 12] + ' ' + (1 + Math.floor(i / 12)), v: b.map(function (v, k) { var mx = [100, 12, 30, 100, 60][k]; return Math.round(Math.max(0, Math.min(mx, v + normale(a) * mx * .09))); }) }); } return t; })() } },
    /* ── les parts ── */
    { f: 'parts', l: 7, nom: 'la mosaïque', titre: 'De quoi le tout est-il fait ?', geste: 'Survole une pièce.', fn: 'mosaique', o: { h: 420 }, repos: { sur: 'quatre quartiers, quinze lieux', txt: 'la surface est la part ; des joints, pas de cadres ; hachuré, une estimation' }, d: { groupes: ARBRE.enfants, unite: 'heures' } },
    { f: 'parts', l: 5, nom: 'le soleil', titre: 'Quelle part, dans quelle part ?', geste: 'Le nombre visé s’écrit au centre.', fn: 'soleil', o: { h: 420 }, repos: { sur: 'deux anneaux', txt: 'dedans les quartiers, dehors leurs lieux' }, d: { groupes: ARBRE.enfants, unite: 'heures' } },
    { f: 'parts', l: 5, nom: 'la gaufre', titre: 'Combien sur cent ?', geste: 'Survole un nom.', fn: 'gaufre', repos: { sur: 'cent cases', txt: 'une case, une chose sur cent : on compte au lieu d’estimer un angle' }, d: { parts: [{ nom: 'écrit', n: 46 }, { nom: 'commencé', n: 21 }, { nom: 'prévu', n: 14, deduit: true }, { nom: 'on ne sait pas', n: 19, inconnu: true }] } },
    { f: 'parts', l: 7, nom: 'la barre découpée', titre: 'Où va le temps ?', geste: 'Chaque part est nommée contre elle.', fn: 'barreDecoupee', o: { h: 190 }, repos: { sur: 'une seule barre', txt: 'pour peu de parts, une barre suffit : les longueurs se comparent mieux que des angles' }, d: { unite: 'heures', parts: [{ nom: 'écrire', v: 46 }, { nom: 'relire', v: 22 }, { nom: 'dessiner', v: 18 }, { nom: 'enregistrer', v: 12 }, { nom: 'monter', v: 9, deduit: true }, { nom: 'le reste', v: 7, inconnu: true }] } },
    /* ── les liens ── */
    { f: 'liens', l: 7, nom: 'le flux', titre: 'D’où vient ce qui arrive ?', geste: 'Survole un ruisseau : il se suit jusqu’au fleuve.', fn: 'flux', o: { h: 460 }, repos: { sur: 'douze sources, trois rivières, un fleuve', txt: 'du petit au grand : l’épaisseur se garde d’un bout à l’autre' },
      d: { fin: 'heures, en tout', unite: 'heures', milieux: [{ nom: 'Le nord' }, { nom: 'Le centre' }, { nom: 'Le sud' }], sources: [['Port', 34, 0], ['Halle', 21, 0], ['Phare', 9, 0], ['Quai neuf', 6, 0, 1], ['Gare', 42, 1], ['Parc', 17, 1], ['Marché', 13, 1], ['Cour', 5, 1], ['Canal', 24, 2], ['Marais', 12, 2], ['Écluse', 7, 2], ['Source', 4, 2, 1]].map(function (x) { return { nom: x[0], v: x[1], vers: x[2], deduit: !!x[3] }; }) } },
    { f: 'liens', l: 5, nom: 'les accords', titre: 'Qui échange avec qui ?', geste: 'Survole un nom : ses rubans sortent.', fn: 'accords', o: { h: 460 }, repos: { sur: 'six lieux', txt: 'au repos, un fil pâle par échange ; l’arc dit le poids ; l’ambre, un échange déduit' },
      d: { noms: LIEUX.slice(0, 6), m: [[0, 12, 4, 2, 8, 1], [12, 0, 9, 3, 2, 5], [4, 9, 0, 14, 3, 2], [2, 3, 14, 0, 7, 6], [8, 2, 3, 7, 0, 10], [1, 5, 2, 6, 10, 0]], deduits: [[2, 3]] } },
    { f: 'liens', l: 7, nom: 'les arcs', titre: 'Qu’est-ce qui se répond ?', geste: 'Survole un nœud.', fn: 'arcs', o: { h: 360 }, repos: { sur: 'treize moments, onze rappels', txt: 'la ligne est le temps ; un arc relie ce qui se répond ; en ambre, un rappel déduit' },
      d: { noeuds: ['l’ouverture', 'le quai', 'le billet', 'le banc', 'le veilleur', 'le buffet', 'deux cafés', 'la rue', 'la neige', 'le passage', 'le jour', 'le wagon', 'le départ'], liens: [[0, 6, 3], [1, 3, 2], [2, 4, 1], [4, 12, 3], [5, 6, 2], [7, 11, 1, 1], [8, 10, 2], [0, 12, 2], [3, 9, 1], [5, 9, 1, 1], [9, 11, 2]].map(function (x) { return { a: x[0], b: x[1], v: x[2], deduit: !!x[3] }; }) } },
    { f: 'liens', l: 5, nom: 'la matrice', titre: 'Qui va avec qui ?', geste: 'Flèches : de case en case.', fn: 'matrice', repos: { sur: 'douze lieux, par paires', txt: 'les blocs sont des familles ; un point, c’est rien ; hachures : on ne sait pas' }, d: { noms: LIEUX, m: MAT, deduits: [[1, 6]] } },
    { f: 'liens', l: 6, nom: 'l’arbre radial', titre: 'Par où passe-t-on ?', geste: 'Survole une feuille : son chemin s’allume.', fn: 'arbre', o: { h: 500 }, repos: { sur: 'un tout, quatre branches, quinze feuilles', txt: 'le centre est le tout ; on lit un chemin, du centre vers le bord' }, d: ARBRE },
    { f: 'liens', l: 6, nom: 'le réseau', titre: 'Qui tient à qui ?', geste: 'Survole un point : ses fils viennent.', fn: 'reseau', o: { h: 500 }, repos: { sur: 'dix-huit lieux', txt: 'au repos, un seul fil se voit : le plus fort ; les autres viennent sous la main' }, d: RES },
    /* ── la distribution ── */
    { f: 'distribution', l: 7, nom: 'l’histogramme et sa brosse', titre: 'Combien dans cette plage ?', geste: 'Tire la plage ou ses poignées ; flèches au clavier.', fn: 'histogramme', o: { h: 300 }, d: { v: mesures, unite: 'min' } },
    { f: 'distribution', l: 5, nom: 'les violons', titre: 'Quelle forme a chaque groupe ?', geste: 'Survole un groupe.', fn: 'violons', o: { h: 330 }, repos: { sur: 'quatre moments', txt: 'la largeur dit où les mesures se serrent ; le trait gras, la médiane' }, d: { groupes: groupesV, unite: 'min' } },
    { f: 'distribution', l: 6, nom: 'les boîtes fines', titre: 'Où est le milieu de chacun ?', geste: 'Survole une ligne.', fn: 'boites', repos: { sur: 'quatre moments', txt: 'le trait épais tient la moitié des mesures ; les ronds creux sont à l’écart' }, d: { groupes: groupesV, unite: 'min' } },
    { f: 'distribution', l: 6, nom: 'les bandes de densité', titre: 'Où ça se serre ?', geste: 'Un trait par mesure.', fn: 'bandes', repos: { sur: 'quatre moments', txt: 'là où les traits se serrent, la bande se remplit ; le triangle est la moyenne' }, d: { groupes: groupesV, unite: 'min' } }
  ];

  var n = 0;
  PLANCHES.forEach(function (p) {
    var grille = document.querySelector('[data-famille="' + p.f + '"]'), art = H('article', { class: 'dv-p', style: '--l:' + p.l }, grille), tete = H('header', {}, art), pt = H('p', { class: 'ke-petit' }, tete);
    H('b', {}, pt, ('0' + (++n)).slice(-2)); pt.appendChild(document.createTextNode(p.nom)); H('h3', {}, tete, p.titre); H('p', { class: 'dv-geste' }, tete, p.geste);
    var el = H('div', { 'aria-label': p.titre }, art), lu = H('p', { class: 'dv-lu', 'aria-live': 'polite' }, art), o = p.o || {}; o.lu = lu; o.repos = p.repos || {};
    p.el = el; V[p.fn](el, p.d, o);
    if (p.legende) V.legende(H('ul', {}, art), p.legende);
  });

  /* ── les états : six formes de cinq familles, chacune en cinq états (vide, en attente, une marque tenue, une part déduite, une part inconnue) ── */
  var ge = document.querySelector('[data-famille="etats"]'), base5 = [['La gare', 42], ['Le port', 34], ['Le canal', 24], ['La halle', 21], ['Le parc', 17]];
  ge.classList.add('dv-etats'); ge.style.gridTemplateColumns = '';
  var ETATS = ['vide', 'en attente', 'une marque tenue', 'une part déduite', 'une part inconnue'];
  H('span', {}, ge); ETATS.forEach(function (t) { H('p', { class: 'ke-petit dv-etat-tete' }, ge, t); });
  var cr4 = [['La gare', 6, 2.4, 50], ['Le port', 8, 2, 40], ['Le canal', 10, 2.6, 56], ['Le parc', 12, 2, 36]];
  function cretes4(q) { return { noms: ['6 h', '', '', '', '10 h', '', '', '', 'midi', '', '', '', '16 h', '', '', ''].map(function (t, i) { return t || (6 + i) + ' h'; }), series: cr4.map(function (x, k) { var v = vague(16, x[1], x[2], x[3], 90 + k); if (q === 'inconnu' && k === 2) v[8] = v[9] = v[10] = null; return { nom: x[0], v: v, deduit: q === 'deduit' && k === 3 }; }) }; }
  var parts4 = [['le jour', 38], ['l’aube', 14], ['la nuit', 26], ['le soir', 22]];
  var M5 = [[0, 8, 3, 1, 5], [8, 0, 6, 2, 1], [3, 6, 0, 9, 2], [1, 2, 9, 0, 6], [5, 1, 2, 6, 0]];
  var G3 = [{ nom: 'le matin', v: tirage(60, 34, 7, 12) }, { nom: 'le midi', v: tirage(60, 50, 10, 13, 22) }, { nom: 'le soir', v: tirage(60, 42, 13, 14) }];
  var FORMES = [
    ['les crêtes', 'temps', 'cretes', function (q) { return cretes4(q); }, { pas: 22, ml: 72 }],
    ['les barres', 'comparer', 'barres', function (q) { return { lignes: base5.map(function (x, i) { return { nom: x[0], v: x[1], deduit: q === 'deduit' && i > 2, inconnu: q === 'inconnu' && (i === 2 || i === 4) }; }) }; }, { tri: 'ordre' }],
    ['les pentes', 'comparer', 'pentes', function (q) { return { noms: ['2024', '2026'], lignes: base5.map(function (x, i) { return { nom: x[0].replace(/^L[ae] /, ''), a: x[1], b: q === 'inconnu' && i === 1 ? null : x[1] + [8, -9, 14, 6, -5][i], deduit: q === 'deduit' && i === 2 }; }) }; }, { h: 190 }],
    ['la barre découpée', 'parts', 'barreDecoupee', function (q) { return { parts: parts4.map(function (x, i) { return { nom: x[0], v: x[1], deduit: q === 'deduit' && i === 3, inconnu: q === 'inconnu' && i === 1 }; }) }; }, { h: 170 }],
    ['les accords', 'liens', 'accords', function (q) { return { noms: base5.map(function (x) { return x[0]; }), m: M5, deduits: q === 'deduit' ? [[0, 4], [1, 2]] : [], inconnus: q === 'inconnu' ? [3] : [] }; }, { h: 180, marge: 10 }],
    ['les boîtes', 'distribution', 'boites', function (q) { return { groupes: G3.map(function (g, i) { return { nom: g.nom, v: g.v, deduit: q === 'deduit' && i === 2, inconnu: q === 'inconnu' && i === 1 }; }) }; }, {}]
  ];
  FORMES.forEach(function (f) {
    var t = H('div', { class: 'dv-etat-nom' }, ge); H('b', {}, t, f[0]); H('span', {}, t, f[1]);
    ETATS.forEach(function (e, k) {
      var cel = H('div', { class: 'dv-etat-case', 'aria-label': f[0] + ', ' + e }, ge), o = {}, kk; for (kk in f[4]) o[kk] = f[4][kk];
      if (k === 0) { V.vide(cel, 'Rien sur cette période.', 150); return; }
      if (k === 1) { V.attente(cel, 'Les données arrivent.', 150); return; }
      if (k === 2) o.tenu = 1;
      V[f[2]](cel, f[3](k === 3 ? 'deduit' : k === 4 ? 'inconnu' : ''), o);
    });
  });

  /* ── la grammaire, en tête ── */
  var gram = document.getElementById('grammaire');
  [['trait', 'L’encre', 'ce qui est mesuré, en cinq valeurs'], ['tenu', 'L’orange', 'ce qu’on vise, ce qu’on tient'], ['ded', 'L’ambre pointillé', 'ce qui est déduit, ou prévu'], ['hach', 'Les hachures', 'ce qu’on ne sait pas']].forEach(function (g) {
    var li = H('li', {}, gram), s = S('svg', { viewBox: '0 0 200 34', preserveAspectRatio: 'none', 'aria-hidden': 'true' }, li);
    if (g[0] === 'trait') [1, 2, 3, 4, 5].forEach(function (k) { S('rect', { class: 'dv-f' + k, x: (k - 1) * 40, y: 6, width: 37, height: 22 }, s); });
    else if (g[0] === 'tenu') { S('line', { class: 'dv-t pale', x1: 0, y1: 17, x2: 200, y2: 17 }, s); S('rect', { class: 'dv-point', x: 82, y: 6, width: 37, height: 22 }, s); }
    else if (g[0] === 'ded') { S('line', { class: 'dv-t', x1: 0, y1: 17, x2: 90, y2: 17, 'vector-effect': 'non-scaling-stroke' }, s); S('line', { class: 'dv-t ded', x1: 90, y1: 17, x2: 200, y2: 17, 'vector-effect': 'non-scaling-stroke' }, s); }
    else { var p = S('pattern', { id: 'gramh', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, S('defs', {}, s)); S('line', { class: 'dv-hl', x1: 0, y1: 0, x2: 0, y2: 6 }, p); S('rect', { x: 0, y: 6, width: 200, height: 22, fill: 'url(#gramh)' }, s); }
    H('b', {}, li, g[1]); H('span', {}, li, g[2]);
  });

  /* ── les pièces communes ── */
  var gp = document.querySelector('[data-famille="pieces"]');
  function piece(l, titre, f) { var art = H('article', { class: 'dv-p', style: '--l:' + l }, gp), t = H('header', {}, art); H('p', { class: 'ke-petit' }, t, titre); return f(H('div', {}, art), art); }
  piece(4, 'l’axe et ses graduations', function (el) {
    var c = U.base(el, {}, 160), X = U.lin(0, 100, 10, c.W - 10);
    U.axeX(c, 22, 10, c.W - 10, [0, 25, 50, 75, 100].map(function (v) { return { x: X(v), t: String(v) }; }));
    U.axeX(c, 76, 10, c.W - 10, MOIS.map(function (m, i) { return { x: X(i / 11 * 100), t: i % 2 ? undefined : m }; }));
    U.axeY(c, 50, c.W - 10, [0, 500, 1000].map(function (v, i) { return { y: 150 - i * 22, t: U.fr(v) }; }));
  });
  piece(4, 'la légende : un mot et sa marque', function (el) { V.legende(H('ul', {}, el), [{ nom: 'mesuré', marque: 'trait' }, { nom: 'secondaire', marque: 'fin' }, { nom: 'l’habitude', marque: 'tirets' }, { nom: 'déduit', marque: 'ded' }, { nom: 'une chose', marque: 'point' }, { nom: 'avant', marque: 'creux' }, { nom: 'visé', marque: 'tenu' }, { nom: 'on ne sait pas', marque: 'hach' }, { nom: 'la marge', marque: 'bande' }, { nom: 'peu', marque: 'f1' }, { nom: '', marque: 'f2' }, { nom: '', marque: 'f3' }, { nom: '', marque: 'f4' }, { nom: 'beaucoup', marque: 'f5' }]); });
  piece(4, 'l’infobulle de graphique', function (el) { var b = H('div', { class: 'dv-bulle pose' }, el); H('small', {}, b, 'La gare · semaine 12'); H('b', {}, b, '42 heures'); H('span', {}, b, 'entre 36 et 49'); el.style.minHeight = '110px'; });
  piece(4, 'le viseur et l’annotation', function (el) {
    var c = U.base(el, {}, 170), v = [20, 26, 24, 38, 44, 40, 58, 66, 62, 80], X = U.lin(0, 9, 10, c.W - 60), Y = U.lin(0, 90, 150, 30), p = v.map(function (y, i) { return [X(i), Y(y)]; });
    S('path', { class: 'dv-t', d: U.douce(p) }, c.svg); S('line', { class: 'dv-vl', style: 'opacity:1', x1: X(6), y1: 22, x2: X(6), y2: 150 }, c.svg); S('circle', { class: 'dv-point', cx: X(6), cy: Y(58), r: 4.5 }, c.svg); S('text', { class: 'dv-val', x: X(6) + 10, y: Y(58) + 18 }, c.svg, '58');
    S('line', { class: 'dv-filet', x1: X(3), y1: Y(38) - 7, x2: X(3), y2: 18 }, c.svg); S('circle', { class: 'dv-creux', cx: X(3), cy: Y(38), r: 4 }, c.svg); S('text', { class: 'dv-nomtxt it', x: X(3) + 8, y: 20 }, c.svg, 'ce qui s’est passé ici'); S('line', { class: 'dv-sol', x1: 10, y1: 150, x2: c.W - 60, y2: 150 }, c.svg);
  });
  piece(4, 'la brosse : une plage, deux poignées de 16 px', function (el, art) {
    var lu = H('p', { class: 'dv-lu' }, art), c = U.base(el, { lu: lu }, 110); S('line', { class: 'dv-sol', x1: 12, y1: 70, x2: c.W - 12, y2: 70 }, c.svg);
    for (var i = 0; i <= 10; i++) { S('line', { class: 'dv-cran', x1: 12 + i * (c.W - 24) / 10, y1: 70, x2: 12 + i * (c.W - 24) / 10, y2: 75 }, c.svg); S('text', { x: 12 + i * (c.W - 24) / 10, y: 92, 'text-anchor': 'middle' }, c.svg, String(i * 10)); }
    U.brosse(c, 70, 12, c.W - 12, { a: .3, b: .65 }, function (a, b) { c.dire({ sur: 'la plage tenue', val: Math.round(a * 100) + ' – ' + Math.round(b * 100), txt: 'tire le milieu pour la déplacer' }); });
  });
  piece(4, 'les filtres : des mots soulignés', function (el) { var f = H('div', { class: 'dv-filtres', role: 'group', 'aria-label': 'Période' }, el); ['la semaine', 'le mois', 'l’année', 'tout'].forEach(function (t, i) { var b = H('button', { type: 'button', 'aria-pressed': String(i === 1) }, f, t); b.addEventListener('click', function () { [].forEach.call(f.children, function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }); }); });
  piece(12, 'le tableau qui double un graphique', function (el) {
    V.tableau(el, { colonnes: ['le lieu', 'la forme, sur vingt-quatre mois', 'aujourd’hui', 'écart', ''], lignes: LIEUX.slice(0, 6).map(function (nm, k) { return k === 4 ? { nom: nm, inconnu: true } : { nom: nm, v: serie(24, 44 + (k * 7) % 30, 9, (k % 5 - 1.6) * .9, 100 + k), deduit: k === 2 ? 5 : 0 }; }) });
  });
})();
