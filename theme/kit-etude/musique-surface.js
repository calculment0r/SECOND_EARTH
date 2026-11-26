/* KIT ÉTUDE · la surface et l'écho. Une surface tactile : la note en travers (calée sur une gamme), l'éclat du filtre en hauteur ;
   puis un écho à bande à trois têtes, avec son pleurage. Le sillage du doigt reste le temps de la note. */
(function () {
  'use strict';
  var KE = window.KitEtude, S = KE.son, M = KE.musique, el = M.el, svg = M.svg, borne = KE.outils.borne;
  var GAMMES = [['mineure', [0, 2, 3, 5, 7, 8, 10]], ['majeure', [0, 2, 4, 5, 7, 9, 11]], ['cinq notes', [0, 3, 5, 7, 10]], ['dorienne', [0, 2, 3, 5, 7, 9, 10]], ['toutes', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]]];
  M.definir('surface', {
    nom: 'La surface', accent: 'et l’écho', sous: 'un doigt, une note, et ce qui en revient', maniere: 'du Kaoss Pad et de l’écho à bande',
    geste: 'Touche la surface et glisse : la note en travers, l’éclat en hauteur. Au clavier : les flèches déplacent le point, Espace le fait sonner. Les têtes de l’écho se frappent.',
    monter: function (corps, voie) {
      var etat = { gamme: 0, onde: 0, tenir: false, base: 45, x: .35, y: .55, temps: .32, retour: .5, pleurage: .25, ton: .6, melange: .45, tetes: [true, false, true], glisse: .04 };
      var N = null, sonne = false, notes = [];
      function degres() { var g = GAMMES[etat.gamme][1], l = []; for (var o = 0; o < 2; o++) g.forEach(function (d) { l.push(etat.base + o * 12 + d); }); l.push(etat.base + 24); return l; }
      function coupure(y) { return 180 * Math.pow(2, y * 5.6); }
      /* ── le son ── */
      function graphe() {
        if (N) return N; var c = S.ouvrir(), out = voie.ouvrir();
        var o1 = c.createOscillator(), o2 = c.createOscillator(), sub = c.createOscillator(), mix = c.createGain(), f = c.createBiquadFilter(), amp = c.createGain(), sec = c.createGain(), mouille = c.createGain();
        o1.type = o2.type = 'sawtooth'; sub.type = 'triangle'; o2.detune.value = 9; mix.gain.value = .22; f.type = 'lowpass'; f.Q.value = 7; amp.gain.value = 0;
        var gs = c.createGain(); gs.gain.value = .5; o1.connect(mix); o2.connect(mix); sub.connect(gs); gs.connect(mix); mix.connect(f); f.connect(amp); amp.connect(sec); sec.connect(out);
        /* l'écho : une ligne à retard, trois têtes, le retour passe par un filtre (la bande s'assourdit), un oscillateur lent fait pleurer */
        var entree = c.createGain(), tetes = [1, 2, 3].map(function () { return c.createDelay(4); }), gt = tetes.map(function () { return c.createGain(); }), somme = c.createGain(), ton = c.createBiquadFilter(), retour = c.createGain(), lfo = c.createOscillator(), gl = c.createGain();
        ton.type = 'lowpass'; lfo.frequency.value = .9; lfo.connect(gl);
        amp.connect(entree); tetes.forEach(function (d, i) { entree.connect(d); d.connect(gt[i]); gt[i].connect(somme); gl.connect(d.delayTime); });
        somme.connect(ton); ton.connect(retour); retour.connect(entree); ton.connect(mouille); mouille.connect(out);
        [o1, o2, sub, lfo].forEach(function (o) { o.start(); });
        N = { c: c, o1: o1, o2: o2, sub: sub, f: f, amp: amp, sec: sec, mouille: mouille, tetes: tetes, gt: gt, ton: ton, retour: retour, gl: gl };
        regler(); return N;
      }
      function regler() {
        if (!N) return; var t = N.c.currentTime;
        N.tetes.forEach(function (d, i) { d.delayTime.setTargetAtTime(etat.temps * (i + 1), t, .08); N.gt[i].gain.setTargetAtTime(etat.tetes[i] ? .8 : 0, t, .02); });
        N.retour.gain.setTargetAtTime(etat.retour * .62, t, .03); N.gl.gain.setTargetAtTime(etat.pleurage * .004, t, .05);
        N.ton.frequency.setTargetAtTime(500 * Math.pow(2, etat.ton * 4.2), t, .03); N.mouille.gain.setTargetAtTime(etat.melange, t, .03); N.sec.gain.setTargetAtTime(1 - etat.melange * .5, t, .03);
        var type = ['sawtooth', 'square', 'triangle'][etat.onde]; N.o1.type = N.o2.type = type;
      }
      function viser(net) {
        var l = degres(), i = borne(Math.floor(etat.x * l.length), 0, l.length - 1), m = l[i], fc = coupure(etat.y);
        if (N) { var t = N.c.currentTime, fr = S.freq(m), g = net ? .001 : etat.glisse; N.o1.frequency.setTargetAtTime(fr, t, g); N.o2.frequency.setTargetAtTime(fr, t, g); N.sub.frequency.setTargetAtTime(fr / 2, t, g); N.f.frequency.setTargetAtTime(fc, t, .02); }
        note.textContent = S.nom(m); cote.textContent = 'éclat ' + Math.round(fc) + ' Hz · ' + GAMMES[etat.gamme][0];
        zone.style.setProperty('--x', etat.x); zone.style.setProperty('--y', etat.y);
        vx.setAttribute('x1', etat.x * 100); vx.setAttribute('x2', etat.x * 100); vy.setAttribute('y1', (1 - etat.y) * 100); vy.setAttribute('y2', (1 - etat.y) * 100);
        zone.setAttribute('aria-valuetext', S.nom(m) + ', éclat ' + Math.round(fc) + ' hertz'); return m;
      }
      function debut() { graphe(); sonne = true; viser(true); N.amp.gain.cancelScheduledValues(N.c.currentTime); N.amp.gain.setTargetAtTime(.8, N.c.currentTime, .012); zone.classList.add('tenue'); trace = [[etat.x, etat.y]]; osc.reveiller(); echo(); }
      function fin(force) { if (!N || !sonne) return; if (etat.tenir && !force) return; sonne = false; N.amp.gain.setTargetAtTime(0, N.c.currentTime, .05); zone.classList.remove('tenue'); sillage.setAttribute('points', ''); }
      /* ── la surface ── */
      var note = el('b', { text: '—' }), cote = el('span', { text: '' }), lu = el('div', { class: 'mu-surface-lu' }, [note, cote]), point = el('i', { class: 'mu-surface-point' }), noms = el('div', { class: 'mu-surface-noms' });
      var dessin = svg('svg', { viewBox: '0 0 100 100', preserveAspectRatio: 'none', 'aria-hidden': 'true' }), gGrille = svg('g'), sillage = svg('polyline', { class: 'sillage' }), vx = svg('line', { class: 'visee', y1: 0, y2: 100 }), vy = svg('line', { class: 'visee', x1: 0, x2: 100 });
      [gGrille, sillage, vx, vy].forEach(function (x) { dessin.appendChild(x); });
      var zone = el('div', { class: 'mu-surface-zone', tabindex: '0', role: 'slider', 'aria-label': 'Surface : la note en travers, l’éclat en hauteur' }, [dessin, noms, lu, point]);
      function grille() {
        while (gGrille.firstChild) gGrille.removeChild(gGrille.firstChild); while (noms.firstChild) noms.removeChild(noms.firstChild);
        var l = degres(); l.forEach(function (m, i) { var x = i / l.length * 100; gGrille.appendChild(svg('line', { class: 'degre' + ((m - etat.base) % 12 === 0 ? ' tonique' : ''), x1: x, x2: x, y1: 0, y2: 100 })); if ((m - etat.base) % 12 === 0 || l.length < 14) noms.appendChild(el('span', { text: S.nom(m).replace(' dièse', '♯'), style: 'left:' + ((i + .5) / l.length * 100) + '%' })); });
        [25, 50, 75].forEach(function (y) { gGrille.appendChild(svg('line', { class: 'niveau', x1: 0, x2: 100, y1: y, y2: y })); });
      }
      var trace = [];
      function lire(e) { var r = zone.getBoundingClientRect(); etat.x = borne((e.clientX - r.left) / r.width, 0, .9999); etat.y = borne(1 - (e.clientY - r.top) / r.height, 0, 1); }
      KE.outils.tirer(zone, function (e) { zone.focus({ preventScroll: true }); lire(e); if (sonne && etat.tenir) { fin(true); return false; } debut(); return {}; },
        function (e) { lire(e); viser(false); trace.push([etat.x, etat.y]); if (trace.length > 90) trace.shift(); sillage.setAttribute('points', trace.map(function (p) { return (p[0] * 100).toFixed(2) + ',' + ((1 - p[1]) * 100).toFixed(2); }).join(' ')); },
        function () { fin(false); });
      zone.addEventListener('keydown', function (e) {
        var p = e.shiftKey ? .01 : 1 / degres().length, d = { ArrowRight: [p, 0], ArrowLeft: [-p, 0], ArrowUp: [0, .05], ArrowDown: [0, -.05] }[e.key];
        if (d) { e.preventDefault(); etat.x = borne(etat.x + d[0], 0, .9999); etat.y = borne(etat.y + d[1], 0, 1); viser(false); }
        else if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); if (sonne && etat.tenir) fin(true); else debut(); }
      });
      zone.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') fin(false); });
      zone.addEventListener('blur', function () { if (!etat.tenir) fin(true); });
      /* ── l'écho : la bande ── */
      var bande = el('div', { class: 'mu-bande', 'aria-hidden': 'true' }, [el('p', { class: 'mu-etiq', text: 'la bande · la tête qui écrit, les trois qui lisent' }), el('i', { class: 'ecrit' })]), lits = [1, 2, 3].map(function (k) { var b = el('i', { class: 'lit', style: '--t:' + (k / 3.4) }, [el('b', { text: String(k) })]); bande.appendChild(b); return b; });
      var calme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches, pastilles = [], anime = false;
      function echo() { if (calme) return; var p = el('i', { class: 'echo' }); bande.appendChild(p); pastilles.push({ n: p, t0: performance.now() }); if (!anime) { anime = true; requestAnimationFrame(defiler); } }
      function defiler(ts) {
        var total = etat.temps * 3.4 * 1000; pastilles = pastilles.filter(function (p) { var x = (ts - p.t0) / total; if (x > 1) { p.n.remove(); return false; } p.n.style.left = (x * 100) + '%'; p.n.style.opacity = String(1 - x * .7); return true; });
        if (pastilles.length) requestAnimationFrame(defiler); else anime = false;
      }
      var tetes = el('div', { class: 'mu-tetes' }), padsT = M.pads(tetes, { colonnes: 3, rangs: 1, noms: ['un', 'deux', 'trois'], numeros: false, surFrappe: function (i) { etat.tetes[i] = !etat.tetes[i]; peindreTetes(); regler(); } });
      function peindreTetes() { etat.tetes.forEach(function (on, i) { padsT.etat(i, 'on', on); lits[i].classList.toggle('on', on); }); }
      /* ── l'écran ── */
      var trait = svg('path', {}), ecranSvg = svg('svg', { viewBox: '0 0 300 70', preserveAspectRatio: 'none' }); ecranSvg.appendChild(trait);
      var ecran = el('div', { class: 'mu-ecran', style: 'min-height:0' }, [ecranSvg]);
      var osc = { reveiller: function () { if (!osc._o && voie.analyseur) osc._o = S.oscillo(trait, voie.analyseur, 300, 70); if (osc._o) osc._o.reveiller(); } };
      trait.setAttribute('d', 'M0 35L300 35');
      /* ── la façade ── */
      function bascule(nom, positions, v, fn, couchee) { var b = el('div', { class: 'mu-bascule' + (couchee ? ' couchee' : ''), 'data-positions': positions, 'data-valeur': v, 'aria-label': nom }); M.bascule(b); b.addEventListener('ke:change', function (e) { fn(e.detail.valeur); }); return el('div', {}, [b, el('p', { class: 'mu-etiq', text: nom, style: 'text-align:left' })]); }
      var sel = el('div', { class: 'mu-selecteur', 'data-positions': GAMMES.map(function (g) { return g[0]; }).join('|'), 'data-valeur': '0', 'aria-label': 'Gamme', style: '--d:120px' }); M.selecteur(sel);
      sel.addEventListener('ke:change', function (e) { etat.gamme = e.detail.valeur; grille(); viser(false); });
      var gauche = M.bloc('La surface', [zone], 'large');
      var reglages = M.bloc('Le timbre', [el('div', { class: 'mu-surface-reglages' }, [el('div', {}, [sel, el('p', { class: 'mu-etiq', text: 'la gamme' })]),
        bascule('l’onde', 'scie|carré|triangle', 0, function (v) { etat.onde = v; regler(); }),
        bascule('le doigt', 'relâche|tient', 0, function (v) { etat.tenir = !!v; if (!v) fin(true); }),
        M.potard('le glissé', { min: 0, max: 100, valeur: 20, taille: 'petit', nom: 'Glissé' }, function (v) { etat.glisse = .005 + v / 100 * .18; }),
        M.potard('la tonique', { min: 33, max: 57, valeur: 45, pas: 1, taille: 'petit', nom: 'Tonique (note)' }, function (v) { etat.base = v; grille(); viser(false); })])]);
      var echoBloc = M.bloc('L’écho à bande', [bande, M.organes([el('div', {}, [tetes, el('p', { class: 'mu-etiq', text: 'les têtes', style: 'margin-top:8px' })]),
        M.potard('le temps', { min: 60, max: 900, valeur: 320, pas: 5, unite: 'ms', nom: 'Temps de l’écho' }, function (v) { etat.temps = v / 1000; regler(); }),
        M.potard('les retours', { min: 0, max: 100, valeur: 50, nom: 'Retours' }, function (v) { etat.retour = v / 100; regler(); }),
        M.potard('le pleurage', { min: 0, max: 100, valeur: 25, nom: 'Pleurage' }, function (v) { etat.pleurage = v / 100; regler(); }),
        M.potard('le ton', { min: 0, max: 100, valeur: 60, nom: 'Ton de la bande' }, function (v) { etat.ton = v / 100; regler(); }),
        M.potard('le mélange', { min: 0, max: 100, valeur: 45, nom: 'Mélange' }, function (v) { etat.melange = v / 100; regler(); })]),
        el('p', { class: 'mu-titre', text: 'Ce qui sort', style: 'margin-top:30px' }), ecran], 'large');
      corps.appendChild(el('div', { class: 'mu-rangee' }, [gauche, reglages, echoBloc]));
      grille(); peindreTetes(); viser(false); note.textContent = S.nom(degres()[Math.floor(etat.x * degres().length)]);
      /* le clavier de l'ordinateur : k demi-tons depuis la tonique, calé sur la surface */
      var tenues = [];
      return {
        toucheClavier: function (k) { var l = degres(), m = etat.base + k, i = 0, dm = 99; l.forEach(function (x, j) { if (Math.abs(x - m) < dm) { dm = Math.abs(x - m); i = j; } }); etat.x = (i + .5) / l.length; tenues.push(k); if (sonne) viser(false); else debut(); },
        relacheClavier: function (k) { tenues = tenues.filter(function (x) { return x !== k; }); if (!tenues.length) fin(false); }
      };
    }
  });
})();
