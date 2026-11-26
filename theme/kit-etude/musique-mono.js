/* KIT ÉTUDE · LE MONO — une seule voix, trois oscillateurs, un filtre passe-bas à quatre pôles, deux contours.
   L'archétype du synthé monophonique des années soixante-dix, redessiné : priorité à la dernière note, jeu lié (legato), glissé.
   Tout le graphe est construit au premier geste et reste en place ; une note ne fait qu'ouvrir la porte. */
(function () {
  'use strict';
  var KE = window.KitEtude, S = KE.son, M = KE.musique;
  var PIEDS = [-2, -1, 0, 1, 2], FORMES = ['triangle', 'sawtooth', 'square', 'impulsion'];
  function temps(v) { return .001 * Math.pow(10, v / 10 * 3.7); }                 /* 0 → 1 ms, 10 → 5 s */
  function coupure(v) { return 28 * Math.pow(2, v / 10 * 9.2); }                   /* 0 → 28 Hz, 10 → 16 kHz */
  function tenir(p, t) { if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t); else { var v = p.value; p.cancelScheduledValues(t); p.setValueAtTime(v, t); } }

  var scope = function (path, an, W, H, periode) { return S.oscillo(path, an, W, H, periode); };   /* l'oscilloscope du socle, calé sur deux périodes de la note */

  M.definir('mono', {
    nom: 'Le mono', sous: 'une voix, trois oscillateurs, un filtre qui chante', maniere: 'du Minimoog',
    geste: 'Joue le clavier (glisse d’une touche à l’autre pour lier). Les sélecteurs se tournent en tirant vers le haut, ou aux flèches. Z et X changent d’octave au clavier de l’ordinateur.',
    monter: function (corps, voie, M) {
      var el = M.el, svg = M.svg;
      var P = { accord: 0, glisse: 2, modOsc: 1, modFiltre: 0, vitesse: 5.5,
        osc: [{ pied: 2, forme: 1, fin: 0, niv: 8, on: 1 }, { pied: 2, forme: 1, fin: .08, niv: 6, on: 1 }, { pied: 1, forme: 2, fin: -.06, niv: 5, on: 1 }],
        bruit: { niv: 2, on: 0, rose: 0 }, coupure: 5.2, emphase: 4, contour: 5.5, fA: .5, fD: 5, fS: 3, vA: .3, vD: 5.5, vS: 7, chute: 1, volume: 7 };
      var G = null, tenues = [], note = 53, porte = false, molette = 0, mod = 0, base = 48, oscillo = null;
      corps.classList.add('mu-mono');

      /* ── le son ── */
      function graphe() {
        if (G) return G; var c = S.ouvrir(), sortie = voie.ouvrir(); if (!c) return null;
        var re = new Float32Array(32), im = new Float32Array(32); for (var k = 1; k < 32; k++) im[k] = 2 / (k * Math.PI) * Math.sin(k * Math.PI * .22);
        G = { c: c, imp: c.createPeriodicWave(re, im), oscs: [], gains: [], melange: c.createGain(), f1: c.createBiquadFilter(), f2: c.createBiquadFilter(), vca: c.createGain(), vol: c.createGain(),
          lfo: c.createOscillator(), modO: c.createGain(), modF: c.createGain(), bruit: c.createBufferSource(), bruitF: c.createBiquadFilter(), bruitG: c.createGain(), forme: c.createWaveShaper() };
        var courbe = new Float32Array(257); for (k = 0; k < 257; k++) { var x = k / 128 - 1; courbe[k] = Math.tanh(x * 1.6) / Math.tanh(1.6); } G.forme.curve = courbe;   /* une saturation douce avant le filtre, comme un mélangeur poussé */
        G.melange.gain.value = .5; G.f1.type = G.f2.type = 'lowpass'; G.f1.Q.value = .5; G.vca.gain.value = 0;
        P.osc.forEach(function (o, i) { var os = c.createOscillator(), g = c.createGain(); os.connect(g); g.connect(G.melange); G.modO.connect(os.detune); os.start(); G.oscs.push(os); G.gains.push(g); });
        G.bruit.buffer = S.bruit(); G.bruit.loop = true; G.bruitF.type = 'lowpass'; G.bruit.connect(G.bruitF); G.bruitF.connect(G.bruitG); G.bruitG.connect(G.melange); G.bruit.start();
        G.lfo.type = 'triangle'; G.lfo.connect(G.modO); G.lfo.connect(G.modF); G.modF.connect(G.f1.detune); G.modF.connect(G.f2.detune); G.lfo.start();
        G.melange.connect(G.forme); G.forme.connect(G.f1); G.f1.connect(G.f2); G.f2.connect(G.vca); G.vca.connect(G.vol); G.vol.connect(sortie);
        G.vol.gain.value = P.volume / 10 * .6; G.f1.frequency.value = G.f2.frequency.value = 200; G.gains.forEach(function (g) { g.gain.value = 0; }); G.bruitG.gain.value = 0; G.modO.gain.value = 0; G.modF.gain.value = 0;
        regler(); accorder(c.currentTime, 0);
        if (voie.analyseur) oscillo = scope(trace, voie.analyseur, 300, 84, function () { return 1 / (S.freq(note + P.accord) * Math.pow(2, PIEDS[P.osc[0].pied])); });
        return G;
      }
      function regler() {
        if (!G) return; var t = G.c.currentTime;
        P.osc.forEach(function (o, i) { if (FORMES[o.forme] === 'impulsion') G.oscs[i].setPeriodicWave(G.imp); else G.oscs[i].type = FORMES[o.forme]; G.gains[i].gain.setTargetAtTime(o.on ? o.niv / 10 * .5 : 0, t, .015); });
        G.bruitG.gain.setTargetAtTime(P.bruit.on ? P.bruit.niv / 10 * .35 : 0, t, .015); G.bruitF.frequency.setTargetAtTime(P.bruit.rose ? 900 : 18000, t, .02);
        G.f2.Q.setTargetAtTime(.6 + P.emphase / 10 * 17, t, .02); G.vol.gain.setTargetAtTime(P.volume / 10 * .6, t, .02);
        G.lfo.frequency.setTargetAtTime(P.vitesse, t, .05); G.modO.gain.setTargetAtTime(P.modOsc ? mod * 60 : 0, t, .03); G.modF.gain.setTargetAtTime(P.modFiltre ? mod * 2400 : 0, t, .03);
        G.oscs.forEach(function (os) { os.detune.setTargetAtTime(molette * 200, t, .01); });
        filtrer(t, .03);
      }
      function fBase() { return Math.min(18000, coupure(P.coupure) * Math.pow(2, (note - 60) / 12 * .33)); }
      function fContour(x) { return Math.min(19000, fBase() * Math.pow(2, P.contour / 10 * 7 * x)); }
      function filtrer(t, tc) { var f = porte ? fContour(P.fS / 10) : fBase(); [G.f1, G.f2].forEach(function (b) { tenir(b.frequency, t); b.frequency.setTargetAtTime(f, t, tc); }); }
      function accorder(t, tc) { G.oscs.forEach(function (os, i) { var o = P.osc[i], f = S.freq(note + P.accord + (i ? o.fin : 0)) * Math.pow(2, PIEDS[o.pied]); if (tc > .002) os.frequency.setTargetAtTime(f, t, tc); else os.frequency.setValueAtTime(f, t); }); }
      function ouvrirPorte(force) {
        var t = G.c.currentTime, a = temps(P.vA), d = temps(P.vD), fa = temps(P.fA), fd = temps(P.fD), niv = .55 + .45 * force; porte = true;
        tenir(G.vca.gain, t); G.vca.gain.setTargetAtTime(niv, t, a / 4 + .0015); G.vca.gain.setTargetAtTime(niv * P.vS / 10, t + a + .003, d / 3);
        [G.f1, G.f2].forEach(function (b) { tenir(b.frequency, t); b.frequency.setTargetAtTime(fContour(1), t, fa / 4 + .001); b.frequency.setTargetAtTime(fContour(P.fS / 10), t + fa + .003, fd / 3); });
      }
      function fermerPorte() {
        var t = G.c.currentTime, r = P.chute ? temps(P.vD) : .012, fr = P.chute ? temps(P.fD) : .012; porte = false;
        tenir(G.vca.gain, t); G.vca.gain.setTargetAtTime(0, t, r / 3 + .003);
        [G.f1, G.f2].forEach(function (b) { tenir(b.frequency, t); b.frequency.setTargetAtTime(fBase(), t, fr / 3 + .003); });
      }
      function jouer(m, force) {
        if (!graphe()) return; var lie = tenues.length > 0; tenues = tenues.filter(function (x) { return x !== m; }); tenues.push(m); note = m;
        accorder(G.c.currentTime, lie || P.glisse > 0 ? .004 + (lie || porte ? 1 : .35) * temps(P.glisse) * .12 * (P.glisse > 0 ? 1 : 0) : 0);
        if (!lie) ouvrirPorte(force === undefined ? .8 : force);                      /* jeu lié : la note change, les contours ne repartent pas */
        dire(); if (oscillo) oscillo.reveiller();
      }
      function finir(m) {
        if (!G) return; tenues = tenues.filter(function (x) { return x !== m; });
        if (tenues.length) { note = tenues[tenues.length - 1]; accorder(G.c.currentTime, .004 + temps(P.glisse) * .12 * (P.glisse > 0 ? 1 : 0)); dire(); } else { fermerPorte(); dire(); }
      }

      /* ── la façade ── */
      function pot(etiq, cle, a, obj) { obj = obj || P; var p = M.potard(etiq, { min: a.min === undefined ? 0 : a.min, max: a.max === undefined ? 10 : a.max, pas: a.pas || .1, valeur: obj[cle], taille: a.taille, centre: a.centre, nom: a.nom || etiq }, function (v) { obj[cle] = v; regler(); if (a.apres) a.apres(); }); if (a.d) p.style.setProperty('--d', a.d + 'px'); return p; }
      function sel(nom, positions, court, obj, cle, d) { var n = el('div', { class: 'mu-selecteur', 'data-positions': positions, 'data-court': court, 'data-valeur': obj[cle], 'aria-label': nom, style: '--d:' + (d || 84) + 'px' }); M.selecteur(n); n.addEventListener('ke:change', function (e) { obj[cle] = e.detail.valeur; regler(); if (G) accorder(G.c.currentTime, .01); }); return n; }
      function basc(nom, positions, obj, cle, inverse) { var n = el('div', { class: 'mu-bascule', 'data-positions': positions, 'data-valeur': inverse ? 1 - obj[cle] : obj[cle], 'aria-label': nom }); M.bascule(n); n.addEventListener('ke:change', function (e) { obj[cle] = inverse ? 1 - e.detail.valeur : e.detail.valeur; regler(); }); return n; }
      function avec(n, etiq) { return el('div', { class: 'mu-mono-org' }, [n, el('p', { class: 'mu-etiq', text: etiq })]); }

      var oscs = el('div', { class: 'mu-mono-oscs' }, [el('span'), el('p', { class: 'mu-etiq', text: 'pied' }), el('p', { class: 'mu-etiq', text: 'accord' }), el('p', { class: 'mu-etiq', text: 'forme' })]);
      P.osc.forEach(function (o, i) {
        oscs.appendChild(el('b', { class: 'mu-mono-num', text: String(i + 1) }));
        oscs.appendChild(sel('Pied de l’oscillateur ' + (i + 1), '32 pieds|16 pieds|8 pieds|4 pieds|2 pieds', '32|16|8|4|2', o, 'pied'));
        if (i === 0) oscs.appendChild(pot('', 'accord', { min: -7, max: 7, pas: .1, centre: true, d: 80, nom: 'Accord général', apres: function () { if (G) accorder(G.c.currentTime, .01); } }));
        else oscs.appendChild(pot('', 'fin', { min: -7, max: 7, pas: .01, centre: true, d: 80, nom: 'Accord de l’oscillateur ' + (i + 1), apres: function () { if (G) accorder(G.c.currentTime, .01); } }, o));
        oscs.appendChild(sel('Forme de l’oscillateur ' + (i + 1), 'triangle|scie|carré|impulsion', 'tri|scie|car|imp', o, 'forme'));
      });
      var mel = el('div', { class: 'mu-mono-mel' }, [el('p', { class: 'mu-etiq', text: 'niveau' }), el('span')]);
      P.osc.forEach(function (o, i) { mel.appendChild(pot('', 'niv', { d: 72, nom: 'Niveau de l’oscillateur ' + (i + 1) }, o)); mel.appendChild(basc('Oscillateur ' + (i + 1), 'entre|coupé', o, 'on', true)); });
      var bruit = el('div', { class: 'mu-mono-bruit' }, [avec(pot('', 'niv', { d: 72, nom: 'Niveau du bruit' }, P.bruit), 'bruit'), basc('Bruit', 'entre|coupé', P.bruit, 'on', true), basc('Couleur du bruit', 'blanc|rose', P.bruit, 'rose')]);

      var trace = svg('path', {}), ecran = el('div', { class: 'mu-ecran mu-mono-ecran' }, [el('span', { class: 'petit', text: 'la note' }), el('span', { class: 'grand', text: '—' }), (function () { var s = svg('svg', { viewBox: '0 0 300 84', 'aria-hidden': 'true' }); s.appendChild(trace); return s; })()]);
      trace.setAttribute('d', 'M0 42L300 42');
      function dire() { ecran.children[1].textContent = tenues.length ? S.nom(note) : '—'; }

      var molH = el('div', { 'aria-label': 'Molette de hauteur' }), molM = el('div', { 'aria-label': 'Molette de modulation' });
      M.molette(molH, { retour: true }); M.molette(molM, {});
      molH.addEventListener('ke:change', function (e) { molette = e.detail.valeur; regler(); }); molM.addEventListener('ke:change', function (e) { mod = e.detail.valeur; graphe(); regler(); });
      var clavier = el('div', { 'aria-label': 'Clavier du mono, de fa 1 à do 5' });
      M.piano(clavier, { de: 41, a: 84, surNote: jouer, surFin: finir });

      corps.appendChild(el('div', { class: 'mu-rangee' }, [
        M.bloc('Commandes', [el('div', { class: 'mu-mono-col' }, [pot('glissé', 'glisse', { d: 72 }), pot('vitesse', 'vitesse', { min: .2, max: 20, pas: .1, d: 72, nom: 'Vitesse de la modulation' }), avec(basc('La molette module les oscillateurs', 'oui|non', P, 'modOsc', true), 'vers les oscillateurs'), avec(basc('La molette module le filtre', 'oui|non', P, 'modFiltre', true), 'vers le filtre')])]),
        M.bloc('Oscillateurs', [oscs]),
        M.bloc('Mélangeur', [el('div', { class: 'mu-mono-deux' }, [mel, bruit])]),
        M.bloc('Filtre', [el('div', { class: 'mu-mono-trois' }, [pot('coupure', 'coupure', { d: 88 }), pot('emphase', 'emphase', { d: 88 }), pot('contour', 'contour', { d: 88 }), pot('attaque', 'fA', { d: 76, nom: 'Attaque du filtre' }), pot('chute', 'fD', { d: 76, nom: 'Chute du filtre' }), pot('tenue', 'fS', { d: 76, nom: 'Tenue du filtre' })])]),
        M.bloc('Volume', [el('div', { class: 'mu-mono-trois' }, [pot('attaque', 'vA', { d: 76, nom: 'Attaque du volume' }), pot('chute', 'vD', { d: 76, nom: 'Chute du volume' }), pot('tenue', 'vS', { d: 76, nom: 'Tenue du volume' }), ecran, el('div', { class: 'mu-mono-col' }, [pot('volume', 'volume', { d: 72 }), basc('Chute après la note', 'chute|sèche', P, 'chute', true)])])])
      ]));
      corps.appendChild(el('div', { class: 'mu-rangee mu-mono-bas' }, [
        M.bloc('', [el('div', { class: 'mu-mono-molettes' }, [avec(molH, 'hauteur'), avec(molM, 'modulation')])]),
        M.bloc('', [clavier], 'large')
      ]));
      return { toucheClavier: function (k, f) { clavier.focus({ preventScroll: true }); jouer(base + k, f); clavierVu(base + k, true); }, relacheClavier: function (k) { finir(base + k); clavierVu(base + k, false); }, octave: function (d) { base = Math.max(36, Math.min(72, base + d * 12)); } };
      function clavierVu(m, oui) { var t = clavier.querySelector('[data-m="' + m + '"]'); if (t) t.classList.toggle('tenue', oui); }
    }
  });
})();
