/* KIT ÉTUDE · la page vitrine : les exemples, écrits pour la page (aucun n'est tiré d'un projet réel). Le kit lui-même est dans kit-etude.js. */
(function () {
  'use strict';
  var KE = window.KitEtude, U = KE.outils, el = U.el, seg = U.seg, mix = U.mix;
  function par(id) { return document.getElementById(id); }
  function tous(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }

  /* ── Où l'on est dans la page ── */
  var barre = par('avance'), parties = tous('[data-chapitre]'), rail = par('v-rail'), liens = [];
  parties.forEach(function (p) { if (p.id === 'ouverture') return; var a = el('a', { href: '#' + p.id, 'data-c': p.dataset.chapitre }, [(p.dataset.mot || p.id).toLowerCase(), el('i')]); liens.push(a); rail.appendChild(a); });
  function ou() {
    var h = document.documentElement, total = h.scrollHeight - window.innerHeight; barre.style.width = (total > 0 ? Math.min(100, h.scrollTop / total * 100) : 0) + '%';
    var ici = parties[0]; parties.forEach(function (p) { if (p.getBoundingClientRect().top < window.innerHeight * .45) ici = p; });
    liens.forEach(function (a) { a.classList.toggle('ici', a.dataset.c === ici.dataset.chapitre); }); rail.classList.toggle('la', ici.id !== 'ouverture');
  }
  window.addEventListener('scroll', ou, { passive: true }); window.addEventListener('resize', ou); ou();

  /* ── 02 · Les jetons, dans les deux thèmes côte à côte ── */
  var JETONS = [['--bg', 'le fond', 'le plus profond'], ['--panel', 'un plan', ''], ['--panel2', 'un plan relevé', 'ce qui flotte'], ['--panel3', 'le plus relevé', 'une infobulle'],
    ['--ink', 'l’encre', 'ce qui compte'], ['--voile', 'le voile', 'ce qui se lit'], ['--pale', 'le pâle', 'ce qui accompagne'], ['--ink3', 'l’encre trois', 'un filet, un repère'],
    ['--or', 'l’orange', 'ce qu’on tient'], ['--amb', 'l’ambre', 'ce qui est déduit'], ['--trait', 'un trait au repos', 'une marque'], ['--fantome', 'le fantôme', 'le mot immense'],
    ['--line', 'le filet', 'entre deux lignes', 1], ['--line-cy', 'le filet d’acier', 'un champ, une voie', 1], ['--line-or', 'le filet orange', 'là où l’on est', 1], ['--line-amb', 'le filet d’ambre', 'en attente', 1]];
  [['dark', 'Sombre'], ['light', 'Clair']].forEach(function (t) {
    var grille = el('div', { class: 'ke-jetons' });
    JETONS.forEach(function (j) { grille.appendChild(el('div', { class: 'ke-jeton' }, [el('i', { class: j[3] ? 'filet' : null, style: '--c:var(' + j[0] + ')' }), el('b', { text: j[1] }), el('span', { text: j[0] + (j[2] ? ' · ' + j[2] : '') })])); });
    par('jetons').appendChild(el('div', { class: 'ke-theme', 'data-theme': t[0] }, [el('p', { class: 'ke-jetons-titre', text: t[1] }), grille]));
  });

  /* ── Les états figés, pour la démonstration ── */
  tous('.ke-curseur[data-etat]').forEach(function (c) { var m = c.querySelector('.ke-c-main'); if (m) m.classList.add('est-' + c.dataset.etat); });
  tous('.v-partiel').forEach(function (c) { c.indeterminate = true; });

  /* ── 07 · La console ── */
  var TRANCHES = [['Voix', -4, .74], ['Cordes', -9, .55], ['Piano', -12, .48], ['Basse', -6, .66], ['Batterie', -3, .9], ['Général', 0, .8]];
  var consoleEl = par('console-demo'), tranches = [];
  TRANCHES.forEach(function (t, i) {
    var general = i === TRANCHES.length - 1, sortie = el('output');
    var fader = el('div', { class: 'ke-fader', 'data-min': '-48', 'data-max': '6', 'data-pas': '.5', 'data-valeur': t[1], 'data-unite': 'dB', 'data-reperes': '6,0,-6,-12,-24,-48', 'aria-label': 'Niveau de ' + t[0] });
    var vu = el('div', { class: 'ke-vu', 'aria-label': 'Niveau de ' + t[0] });
    var muet = el('button', { type: 'button', class: 'ke-btn', 'aria-pressed': 'false', text: 'muet' }), seul = general ? null : el('button', { type: 'button', class: 'ke-btn', 'aria-pressed': 'false', text: 'seul' });
    var tr = el('div', { class: 'ke-tranche' + (general ? ' general' : '') }, [el('p', { class: 'ke-nom', text: t[0] }), sortie, el('div', { class: 'ke-tr-corps' }, [fader, vu]), el('div', { class: 'ke-tr-mots' }, [muet, seul])]);
    consoleEl.appendChild(tr);
    var T = { tr: tr, f: KE.fader(fader), vu: KE.vu(vu), force: t[2], muet: false, seul: false, general: general, phase: i * 1.7 };
    function dire() { var v = T.f.valeur(); sortie.textContent = ''; sortie.appendChild(document.createTextNode(v <= -48 ? '−∞' : T.f.dire(v))); sortie.appendChild(el('small', { text: 'dB' })); }
    fader.addEventListener('ke:change', function () { dire(); figer(); });
    muet.addEventListener('click', function () { T.muet = !T.muet; muet.setAttribute('aria-pressed', String(T.muet)); tr.classList.toggle('muette', T.muet); figer(); });
    if (seul) seul.addEventListener('click', function () { T.seul = !T.seul; seul.setAttribute('aria-pressed', String(T.seul)); figer(); });
    dire(); tranches.push(T);
  });
  function gain(T) { var v = T.f.valeur(); return v <= -48 ? 0 : Math.pow(10, v / 20); }
  function niveaux(temps) {
    var unSeul = tranches.some(function (T) { return T.seul; }), somme = [0, 0];
    tranches.forEach(function (T) {
      if (T.general) return;
      var ouvert = !T.muet && (!unSeul || T.seul), b = temps === null ? 1 : .62 + .38 * Math.abs(Math.sin(temps * 3.1 + T.phase) * Math.sin(temps * 1.3 + T.phase * 2));
      var g = ouvert ? T.force * gain(T) * b : 0, d = ouvert ? T.force * gain(T) * (temps === null ? .94 : .6 + .4 * Math.abs(Math.sin(temps * 2.7 + T.phase + 1))) : 0;
      T.vu.niveau([g * 1.3, d * 1.3]); somme[0] += g * g; somme[1] += d * d;
    });
    var G = tranches[tranches.length - 1], k = G.muet ? 0 : gain(G) * .62; G.vu.niveau([Math.sqrt(somme[0]) * k, Math.sqrt(somme[1]) * k]);
  }
  function figer() { if (!sonne) niveaux(null); }
  var sonne = false, bSonner = par('console-jouer');
  function boucle(ts) { if (!sonne) return; niveaux(ts / 1000); requestAnimationFrame(boucle); }
  bSonner.addEventListener('click', function () { sonne = !sonne; bSonner.setAttribute('aria-pressed', String(sonne)); bSonner.textContent = sonne ? 'arrêter' : 'faire sonner'; if (sonne) requestAnimationFrame(boucle); else figer(); });
  figer();

  /* ── 10 · La frise, l'onde en attente, le montage ── */
  var frise = par('frise-demo'); frise.appendChild(el('u'));
  for (var k = 0; k < 13; k++) frise.appendChild(el('i', { class: k < 6 ? 'vu' : k === 6 ? 'ici' : null, style: 'left:' + (k / 12 * 100) + '%' }, [el('b', { text: String(k + 1) }), k === 2 ? el('em', { text: 'elle rate le train' }) : k === 6 ? el('em', { text: 'le buffet' }) : null]));
  frise.appendChild(el('i', { class: 'deduit', style: 'left:' + (9.5 / 12 * 100) + '%;top:-4px' }, [el('em', { text: 'il la reconnaît, sans doute ici' })]));
  var attente = par('onde-attente'); for (var a = 0; a < 90; a++) attente.appendChild(el('i', { style: '--h:.18;--i:' + a }));
  var lu = par('montage-lu');
  par('montage-demo').addEventListener('ke:change', function (e) { lu.textContent = ''; lu.appendChild(el('small', { text: e.detail.piste.nom })); lu.appendChild(document.createTextNode(e.detail.phrase)); });
  KE.montage(par('montage-demo'), { duree: 96, pas: 12, tete: 31, pistes: [
    { nom: 'Image', clips: [{ nom: 'Le quai', debut: 0, duree: 18 }, { nom: 'La salle d’attente', debut: 18, duree: 13 }, { nom: 'Le buffet', debut: 33, duree: 24 }, { nom: 'Le premier train', debut: 60, duree: 22, deduit: true }] },
    { nom: 'Voix', clips: [{ nom: 'Elle, seule', debut: 4, duree: 11 }, { nom: 'Le veilleur', debut: 35, duree: 19 }] },
    { nom: 'Musique', clips: [{ nom: 'Thème de la nuit', debut: 12, duree: 30 }, { nom: 'Reprise', debut: 58, duree: 26 }] },
    { nom: 'Ambiance', clips: [{ nom: 'Gare vide', debut: 0, duree: 33 }, { nom: 'Ville, au loin', debut: 33, duree: 49 }] }] });
  lu.appendChild(el('small', { text: 'Rien n’est tenu' })); lu.appendChild(document.createTextNode('Prends un bloc : il dit où il commence et combien il dure.'));

  /* ── 11 · Le schéma ── */
  KE.nodal(par('nodal-demo'), {
    noeuds: [
      { id: 'voix', nom: 'La voix', sous: 'ce qui entre', x: 0, y: 40, sorties: [{ id: 's', nom: 'son' }] },
      { id: 'piano', nom: 'Le piano', sous: 'ce qui entre', x: 0, y: 250, sorties: [{ id: 's', nom: 'son' }, { id: 'n', nom: 'notes' }] },
      { id: 'echo', nom: 'L’écho', sous: 'il répète, plus loin', x: 380, y: 0, entrees: [{ id: 'e', nom: 'son' }], sorties: [{ id: 's', nom: 'son' }] },
      { id: 'salle', nom: 'La salle', sous: 'elle donne de l’air', x: 380, y: 210, entrees: [{ id: 'e', nom: 'son' }, { id: 't', nom: 'taille' }], sorties: [{ id: 's', nom: 'son' }] },
      { id: 'sortie', nom: 'La sortie', sous: 'ce qu’on entend', x: 780, y: 110, entrees: [{ id: 'g', nom: 'gauche' }, { id: 'd', nom: 'droite' }] }],
    cables: [{ de: 'voix.s', a: 'echo.e' }, { de: 'echo.s', a: 'sortie.g' }, { de: 'piano.s', a: 'salle.e' }, { de: 'salle.s', a: 'sortie.d', deduit: true }]
  });

  /* ── 12 · Le canevas ── */
  function lieu(nom, dit, source, poids, deduit) { return { nom: nom, dit: dit, source: source, poids: poids, deduit: deduit }; }
  KE.canevas(par('canevas-demo'), { groupes: [
    { nom: 'Le printemps', objets: [lieu('Le marché', 'Les étals reviennent avant les clients.', 'dit, page 2', .8), lieu('Le canal', 'On y remet les barques à l’eau.', 'dit, page 3', .5), lieu('L’école', 'Les fenêtres sont rouvertes.', 'dit, page 3', .35), lieu('Le pont neuf', 'Personne ne s’y arrête encore.', 'déduit de la page 5', .3, true), lieu('La serre', 'Tout y a un mois d’avance.', 'dit, page 6', .6), lieu('Le kiosque', 'Le premier concert, sous la pluie.', 'dit, page 8', .9)] },
    { nom: 'L’été', objets: [lieu('La place', 'On y dîne jusqu’à minuit.', 'dit, page 11', 1), lieu('Les toits', 'C’est là qu’ils se parlent enfin.', 'dit, page 12', .85), lieu('La piscine', 'Fermée, et pourtant pleine.', 'dit, page 14', .4), lieu('Le cinéma', 'En plein air, contre un mur.', 'dit, page 15', .7), lieu('La gare', 'Les départs, tous les matins.', 'dit, page 17', .55), lieu('Le fleuve', 'Bas comme jamais.', 'déduit de la page 18', .3, true), lieu('Le garage', 'La seule ombre de la rue.', 'dit, page 19', .45), lieu('La colline', 'D’en haut, la ville se tait.', 'dit, page 21', .65)] },
    { nom: 'L’automne', objets: [lieu('Le lycée', 'La rentrée, sans lui.', 'dit, page 24', .75), lieu('Le parc', 'On ramasse ce qui est tombé.', 'dit, page 25', .5), lieu('L’atelier', 'La lumière s’allume plus tôt.', 'dit, page 27', .6), lieu('Le café', 'La même table, un seul couvert.', 'dit, page 28', .95), lieu('La digue', 'Le fleuve est remonté.', 'déduit de la page 30', .35, true)] },
    { nom: 'L’hiver', objets: [lieu('Le quai', 'Minuit moins deux : trop tard.', 'dit, page 33', 1), lieu('La salle d’attente', 'Un seul banc est occupé.', 'dit, page 34', .7), lieu('Le buffet', 'Encore ouvert, on ne sait pourquoi.', 'dit, page 36', .85), lieu('La rue haute', 'La neige n’y a pas été touchée.', 'dit, page 38', .45), lieu('Le wagon de queue', 'Le premier train, enfin.', 'dit, page 40', .9), lieu('Le passage', 'Il la reconnaît, peut-être.', 'déduit de la page 41', .4, true)] }] });

  /* ── 13 · Les chiffres ── */
  var SCENES = [['Le quai, vide', .5], ['Elle court', .25], ['Trop tard', .7, 1], ['La salle d’attente', .45], ['Un seul banc', .3], ['Le veilleur passe', .55, 1], ['Le buffet', 1, 1], ['Deux cafés', .6], ['Il parle du premier train', .8, 1], ['La rue haute', .4], ['La neige', .2], ['Le passage', .5], ['Il la reconnaît', .65, 1], ['Le jour vient', .35], ['Le wagon de queue', .75], ['Elle part', .45]];
  var traits = KE.traits(par('traits-demo'), SCENES.map(function (s, i) { return { sur: 'scène ' + (i + 1) + (s[2] ? ' · elle y parle' : ''), t: s[0] + ', ' + String(Math.round(s[1] * 50) / 10).replace('.', ',') + ' min', h: .2 + s[1] * .8, garde: !!s[2] }; }), par('traits-lu'));
  traits.montrer(6);
  KE.arches(par('arches-demo'), { crans: 13, liens: [
    { de: 1, a: 7, t: 'Elle promet de ne pas attendre. Au buffet, elle attend.' }, { de: 3, a: 5, t: 'Le billet perdu est retrouvé sous le banc.' },
    { de: 6, a: 13, t: 'Le veilleur annonce le premier train. Il arrive.' }, { de: 8, a: 12, t: 'Il dit l’avoir déjà vue. Elle s’en souviendrait, peut-être.', deduit: true }, { de: 9, a: 11, t: 'La neige annoncée tombe.' }] }, par('arches-lu'));
  var barres = par('barres-demo');
  [['Le buffet', 24, ''], ['Le quai', 18, 'tenu'], ['La salle d’attente', 13, ''], ['Le wagon de queue', 9, ''], ['La rue haute', 0, 'manque']].forEach(function (b) {
    barres.appendChild(el('div', { class: b[2] || null, tabindex: '0', role: 'img', 'aria-label': b[0] + (b[1] ? ' : ' + b[1] + ' minutes' : ' : pas encore écrit') }, [el('b', { text: b[0] }), el('span', { style: '--v:' + (b[1] / 24) }), el('output', { text: b[1] ? b[1] + ' min' : 'pas encore' })]));
  });
  KE.ligne(par('ligne-demo'), { points: [4, 9, 11, 18, 17, 26, 31, 38], deduit: [44, 51], unite: 'pages', noms: ['semaine 1', 'semaine 2', 'semaine 3', 'semaine 4', 'semaine 5', 'semaine 6', 'semaine 7', 'semaine 8', 'semaine 9', 'semaine 10'] });
  var cases = par('cases-demo'); for (var c = 0; c < 40; c++) cases.appendChild(el('i', { class: c < 17 ? 'garde' : c === 17 ? 'ici' : null, style: c > 17 && c < 24 ? 'background:var(--trait-vu)' : null }));

  /* ── 14 · La scène d'exemple : une phrase, ses mots descendent sur leurs lignes, puis se rangent en traits ; un seul reste allumé ── */
  (function () {
    var sc = par('scene-demo'); if (!sc) return;
    var MORCEAUX = [['Une nuit d’hiver', 'quand', .5], [', ', null], ['une ville endormie', 'où', .62], [', ', null], ['un train qui n’attend pas', 'quoi', .8], [', et ', null], ['quelqu’un sur le quai', 'qui', .7, 1], ['.', null]];
    var phrase = el('p', { class: 'sd-phrase' }), rangs = el('div', { class: 'sd-rangs' }), vols = [];
    MORCEAUX.forEach(function (m) {
      if (!m[1]) { phrase.appendChild(el('span', { text: m[0] })); return; }
      var mark = el('mark', { text: m[0] }), place = el('i', { text: m[0] }), trait = el('b', { style: 'width:' + (m[2] * 100) + '%' }), rang = el('div', { class: 'sd-rang' + (m[3] ? ' tenu' : '') }, [el('span', { text: m[1] }), el('p', {}, [place, trait])]);
      var vol = el('p', { class: 'sd-vol' + (m[3] ? ' tenu' : ''), text: m[0], 'aria-hidden': 'true' });
      phrase.appendChild(mark); rangs.appendChild(rang); vols.push({ mark: mark, place: place, trait: trait, vol: vol, rang: rang, tenu: !!m[3] });
    });
    var fin = el('p', { class: 'ke-sc-fin' }, [el('span', { text: 'Quatre choses dites, rangées.' }), 'Une seule reste ', el('em', { text: 'à écrire.' })]);
    sc.appendChild(phrase); sc.appendChild(rangs); vols.forEach(function (v) { sc.appendChild(v.vol); }); sc.appendChild(fin);
    var geo = null;
    function mesurer() { var s = sc.getBoundingClientRect(); geo = vols.map(function (v) { var a = v.mark.getBoundingClientRect(), b = v.place.getBoundingClientRect(); return { ax: a.left - s.left, ay: a.top - s.top, bx: b.left - s.left, by: b.top - s.top, k: b.height / a.height }; }); }
    sc._t = function (t) {
      if (!geo || t < .1) mesurer();   /* au repos, la phrase est en place : on la remesure (les polices peuvent arriver tard) */
      var part = seg(t, .1, .2), fondre = seg(t, .52, .74), dire = seg(t, .8, .95);
      tous('span', phrase).forEach(function (s) { s.style.opacity = String(1 - part); });
      vols.forEach(function (v, i) {
        var g = geo[i], d = seg(t, .12 + i * .05, .36 + i * .05);
        v.mark.classList.toggle('vole', t > .001);
        v.vol.style.visibility = t > .001 ? 'visible' : 'hidden';
        v.vol.style.transform = 'translate(' + mix(g.ax, g.bx, d) + 'px,' + mix(g.ay, g.by, d) + 'px) scale(' + mix(1, g.k, d) + ')';
        v.vol.style.opacity = String(v.tenu ? 1 : 1 - fondre);
        v.vol.classList.toggle('tenu', v.tenu && fondre > .5);
        v.trait.style.transform = 'scaleX(' + (v.tenu ? 0 : fondre) + ')';
        var o = String(seg(t, .12 + i * .05, .26 + i * .05)); v.rang.firstChild.style.opacity = o; v.rang.lastChild.style.opacity = o;
      });
      fin.style.opacity = String(dire); fin.style.transform = 'translateY(' + (1 - dire) * 20 + 'px)';
    };
    window.addEventListener('resize', function () { geo = null; KE.rejouer(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { geo = null; KE.rejouer(); });
    KE.rejouer();
  })();
})();
