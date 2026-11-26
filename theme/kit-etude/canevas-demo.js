/* KIT ÉTUDE · la page du canevas : les cartes d'exemple (écrites pour la page) et la planche à plat. Le composant est dans canevas.js. */
(function () {
  'use strict';
  var KE = window.KitEtude, el = KE.outils.el;
  function par(id) { return document.getElementById(id); }
  var D = {
    quai: { type: 'image', titre: 'Le quai, à minuit moins deux', vue: 1, meta: 'repérage', num: '01', plus: [['d’où', 'photo de repérage, voie 4'], ['quand', 'un mardi de janvier'], ['format', '2,39 : 1', 'deduit']] },
    note: { type: 'note', titre: 'Elle ne court pas', meta: 'mardi', texte: 'Elle voit le train partir et ralentit. C’est là qu’on comprend qu’elle voulait le rater.', plus: [['d’où', 'dit à la lecture du 12'], ['tient à', 'la scène 3']] },
    qui: { type: 'manque', titre: 'Qui l’attend à l’arrivée ?', texte: 'Personne ne l’a encore écrit.' },
    cit: { type: 'citation', titre: '« On ne rate jamais un train. On en prend un autre. »', qui: 'Le veilleur', ou: 'scène 9', plus: [['d’où', 'version 3, page 22'], ['redit', 'scène 14', 'deduit']] },
    veil: { type: 'personne', titre: 'Le veilleur', meta: 'il garde la gare', texte: 'Il sait l’heure de tous les trains, et ne monte dans aucun.', plus: [['âge', 'la soixantaine', 'deduit'], ['son nom', 'on ne le dit jamais', 'manque']] },
    gare: { type: 'lieu', titre: 'La gare du Nord', meta: 'à 400 m du fleuve', graine: 1, plus: [['d’où', 'dit page 4'], ['le chemin', 'par le pont, sans doute', 'deduit']] },
    vid: { type: 'video', titre: 'Essai, plan 12', meta: 'prise 3', duree: 96, vue: 3, t: .34, plus: [['d’où', 'tournage d’essai'], ['gardé', 'pas encore', 'manque']] },
    sept: { type: 'chiffre', titre: 'entre le dernier train et le premier', nombre: 7, unite: 'heures', plus: [['d’où', 'les horaires, page 4']] },
    pl: { type: 'planche', titre: 'La ville, la nuit', meta: '6 images', vues: [3, 1, 4, 6, 2, 5], plus: [['d’où', 'recherches de lumière']] },
    lien: { type: 'lien', titre: 'Les trains de nuit, 1962', meta: 'archives.exemple', texte: 'Horaires, tarifs, plans des voitures.', plus: [['lu', 'en partie']] },
    seq: { type: 'sequence', titre: 'Le buffet', meta: '6 plans', ici: 2, plus: [['durée', '2 min 40'], ['d’où', 'découpage du 14']] },
    tab: { type: 'tableau', titre: 'Les heures', lignes: [['le quai', 'minuit', 'tenu'], ['le buffet', 'trois heures'], ['le pont', 'vers cinq heures', 'deduit'], ['le wagon', 'on ne sait pas', 'manque']], plus: [['d’où', 'le script, version 3']] },
    doc: { type: 'document', titre: 'Le script, version 3', meta: '41 pages', plan: ['Elle rate le train', 'La ville endormie', 'Le buffet', 'Le premier train'], ici: 2, plus: [['écrit', 'le 9 novembre'], ['lu par', 'trois personnes']] },
    pal: { type: 'palette', titre: 'La nuit et la lampe', plus: [['d’où', 'tirée de la planche']] },
    son: { type: 'son', titre: 'Thème de la nuit', meta: 'piano', duree: 190, t: .32, graine: 4, plus: [['tempo', '72 à la noire'], ['d’où', 'maquette du 3']] },
    fil: { type: 'fil', titre: 'Faut-il la musique dès le quai ?', meta: '3 voix', voix: [['Le son', 'Pas avant le buffet. Le quai, c’est le silence.'], ['L’image', 'Une seule note, alors, quand le train part.'], ['À toi', 'Tu tranches ?', 1]], plus: [['ouvert', 'depuis lundi']] },
    code: { type: 'code', titre: 'La durée d’une nuit', formule: 'nuit = premier − dernier', plus: [['donne', '7 heures']] },
    prop: { type: 'proposee', titre: 'Un bruit de pas, avant qu’on la voie', meta: 'd’après le fil', texte: 'Déduit de « le quai, c’est le silence ».' },
    liste: { type: 'liste', titre: 'Avant la lecture', points: [['Relire la scène 9', 1], ['Choisir la prise du plan 12', 1], ['Écrire l’arrivée', 0], ['Nommer le veilleur', 0]], plus: [['pour', 'jeudi']] },
    amb: { type: 'son', titre: 'Gare vide, au loin', meta: 'ambiance', duree: 64, t: .6, graine: 9 },
    scr: { type: 'code', titre: 'Le calcul des heures', meta: 'un bout de code', lignes: [[['depart', 'b'], [' = '], ['"23:58"', 'u']], [['premier', 'b'], [' = '], ['"06:02"', 'u']], [['// la nuit, en minutes', 'i']], [['nuit', 'b'], [' = ecart(depart, premier)']]] }
  };
  Object.keys(D).forEach(function (k) { D[k].id = k; });
  var GROUPES = [['Le quai', [['quai', 'note', 'qui'], ['cit', 'veil', 'gare'], ['vid', 'sept']]], ['La ville', [['pl', 'lien'], ['seq', 'tab'], ['doc', 'pal']]], ['Le son', [['son', 'fil'], ['code', 'prop', 'scr'], ['liste', 'amb']]]];

  /* ranger : on mesure chaque carte hors canevas (les lettres chargées), puis on empile en colonnes serrées ; la carte ouverte poussera ses voisines */
  var cv = null;
  function poser() {
  var banc = el('div', { class: 'cv-plat', style: 'position:absolute;left:-9999px;top:0;width:320px;display:block' }); document.body.appendChild(banc);
  var cartes = [], groupes = [], X = 0, L = 300, G = 36;
  GROUPES.forEach(function (g) {
    g[1].forEach(function (col, ci) { var y = 0; col.forEach(function (id) { var d = D[id]; d.w = L; d.x = X + ci * (L + G); d.y = y; var c = KE.carte(d); c.style.width = L + 'px'; banc.appendChild(c); y += c.offsetHeight + G; cartes.push(d); }); });
    groupes.push({ nom: g[0], cartes: [].concat.apply([], g[1]) }); X += g[1].length * (L + G) + 150;
  });
  banc.remove();
  cv = window.kitCanevas = KE.canevas2(par('canevas'), { cartes: cartes, groupes: groupes, depart: [0], liens: [{ de: 'quai', a: 'cit' }, { de: 'cit', a: 'vid' }, { de: 'veil', a: 'gare' }, { de: 'gare', a: 'pl' }, { de: 'seq', a: 'doc' }, { de: 'son', a: 'vid' }, { de: 'fil', a: 'liste' }, { de: 'tab', a: 'sept' }] });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(poser); else poser();

  /* la famille, à plat */
  var ORDRE = ['note', 'cit', 'quai', 'pl', 'vid', 'son', 'veil', 'gare', 'pal', 'lien', 'liste', 'sept', 'tab', 'fil', 'doc', 'seq', 'code', 'scr', 'qui', 'prop'];
  function sans(d) { var c = JSON.parse(JSON.stringify(d)); delete c.id; delete c.w; return c; }
  ORDRE.forEach(function (id) { var c = KE.carte(sans(D[id])); c.tabIndex = -1; par('plat-famille').appendChild(el('div', {}, [c])); });

  /* les états */
  [['repos', ''], ['survol', 'survol'], ['clavier', 'est-focus'], ['choisie', 'choisie'], ['tenue', 'choisie tenue'], ['en attente', 'attente'], ['désactivée', 'inerte'], ['en cours', 'en-cours']].forEach(function (e) {
    [D.note].forEach(function (src, i) {
      var d = sans(src); if (e[1] === 'inerte' || e[1] === 'en-cours') d.etat = e[1]; delete d.plus;
      var c = KE.carte(d); c.tabIndex = -1; if (e[1] === 'survol') c.style.setProperty('--survol', 1);
      if (e[1] && d.etat === undefined && e[1] !== 'survol') e[1].split(' ').forEach(function (k) { c.classList.add(k); });
      if (e[1] === 'survol') c.classList.add('est-survol');
      par('plat-etats').appendChild(el('div', {}, [i ? null : el('p', { class: 'ke-petit', text: e[0] }), c]));
    });
  });
  /* deux rangées : on range par colonnes (un état par colonne) */
  ['', 'survol', 'choisie', 'attente', 'en-cours', 'inerte', 'depart', 'visee'].forEach(function (e, i) {
    var d = sans([D.quai, D.son, D.veil, D.vid, D.pl, D.doc, D.cit, D.tab][i]); delete d.plus; if (e === 'inerte' || e === 'en-cours') d.etat = e;
    var c = KE.carte(d); c.tabIndex = -1; if (e === 'survol') c.classList.add('est-survol'); else if (e && !d.etat) c.classList.add(e);
    par('plat-etats').appendChild(el('div', {}, [el('p', { class: 'ke-petit', text: ['repos', 'survol', 'choisie', 'en attente', 'en cours', 'désactivée', 'le départ d’un geste', 'la cible visée'][i] }), c]));
  });

  /* les quatre hauteurs, à leur vraie taille d'écran */
  var H = [['un trait · 24 %', .24, '--t1:0;--t2:0;--t3:0'], ['un titre · 37 %', .37, '--t1:1;--t2:0;--t3:0;--kt:' + (12.5 / (24 * .37)).toFixed(3)], ['la carte · 100 %', 1, '--t1:1;--t2:1;--t3:0'], ['la carte ouverte', 1, '--t1:1;--t2:1;--t3:1']];
  [D.cit, D.vid, D.tab].forEach(function (src, r) {
    H.forEach(function (h) {
      var c = KE.carte(sans(src)); c.tabIndex = -1; c.style.width = '320px';
      var boite = el('div', { style: h[2] + ';--ik:' + (1 / h[1]) + ';transform:scale(' + h[1] + ');transform-origin:0 0;width:320px' }, [c]), cale = el('div', {}, [boite]);
      par('plat-hauteurs').appendChild(el('div', {}, [r ? null : el('p', { class: 'ke-petit', text: h[0] }), cale]));
      requestAnimationFrame(function () { var p = c.querySelector('.cv-plus'), t3 = h[0] === 'la carte ouverte' && p ? p.offsetHeight : 0; cale.style.height = Math.ceil((c.offsetHeight + t3) * h[1]) + 'px'; });
    });
  });

  KE.canevas2.TOUCHES.forEach(function (t) { par('table-gestes').tBodies[0].appendChild(el('tr', {}, [el('td', { text: t[0] }), el('td', { text: t[1] }), el('td', {}, [el('small', { text: t[2] })])])); });
})();
