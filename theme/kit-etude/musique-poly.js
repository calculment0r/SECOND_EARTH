/* KIT ÉTUDE · LE POLY — six voix, un oscillateur par voix (scie, carré à largeur réglable, sous-octave, bruit), un passe-haut à crans,
   un passe-bas à résonance, une enveloppe, un chœur à deux boutons, un arpégiateur. L'archétype du polyphonique à curseurs des années
   quatre-vingt, redessiné : tout se règle par des curseurs verticaux. Chaque note fabrique sa voix et la libère à la fin de sa chute. */
(function () {
  'use strict';
  var KE = window.KitEtude, S = KE.son, M = KE.musique, H = S.horloge;
  var NOMS = ['do', 'do♯', 'ré', 'mi♭', 'mi', 'fa', 'fa♯', 'sol', 'la♭', 'la', 'si♭', 'si'];
  var ACCORDS = [['0,4,7', ''], ['0,3,7', ' mineur'], ['0,4,7,10', ' septième'], ['0,4,7,11', ' septième majeure'], ['0,3,7,10', ' mineur septième'], ['0,3,6', ' diminué'], ['0,4,8', ' augmenté'], ['0,5,7', ' quarte suspendue'], ['0,2,7', ' seconde suspendue'], ['0,7', ' quinte'], ['0,4,7,9', ' sixte'], ['0,3,7,9', ' mineur sixte'], ['0,4,7,10,2', ' neuvième'], ['0,3,6,9', ' septième diminuée'], ['0,3,6,10', ' demi-diminué']];
  function temps(v) { return .0015 * Math.pow(10, v / 10 * 3.5); }                 /* 0 → 1,5 ms, 10 → 4,7 s */
  function coupure(v) { return 40 * Math.pow(2, v / 10 * 8.6); }
  function tenir(p, t) { if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t); else { var v = p.value; p.cancelScheduledValues(t); p.setValueAtTime(v, t); } }
  function accord(notes) {
    if (!notes.length) return ['—', '']; var tri = notes.slice().sort(function (a, b) { return a - b; }), cl = []; tri.forEach(function (m) { var c = m % 12; if (cl.indexOf(c) < 0) cl.push(c); });
    if (cl.length === 1) return [NOMS[cl[0]], tri.length > 1 ? 'à l’octave' : S.nom(tri[0])];
    for (var r = 0; r < cl.length; r++) {                                             /* la basse d'abord, puis chaque note comme fondamentale possible */
      var f = cl[r], rel = cl.map(function (c) { return (c - f + 12) % 12; }).sort(function (a, b) { return a - b; }).join(',');
      for (var k = 0; k < ACCORDS.length; k++) if (ACCORDS[k][0].split(',').map(Number).sort(function (a, b) { return a - b; }).join(',') === rel) return [NOMS[f] + ACCORDS[k][1], r ? 'sur ' + NOMS[cl[0]] : tri.length + ' notes'];
    }
    return [cl.map(function (c) { return NOMS[c]; }).join(' · '), tri.length + ' notes'];
  }

  var scope = function (path, an, W, H, periode) { return S.oscillo(path, an, W, H, periode); };   /* l'oscilloscope du socle, calé sur deux périodes de la note */

  M.definir('poly', {
    nom: 'Le poly', sous: 'six voix, une forêt de curseurs, un chœur', maniere: 'du Juno-106',
    geste: 'Joue des accords : leur nom s’écrit à l’écran. Chaque curseur se tire ou se règle aux flèches. L’arpégiateur suit « Lire », en haut de la page.',
    monter: function (corps, voie, M) {
      var el = M.el, svg = M.svg;
      var P = { lVit: 4, lDelai: 0, oMod: 0, largeur: 5, scie: 1, carre: 0, sous: 3, bruit: 0, ph: 0, coupure: 6.2, reso: 2, env: 4.5, fMod: 0, suivi: 5, niveau: 7, A: .4, D: 5, S: 6.5, R: 5.2, choeur: 1, arp: 0, tenue: 0, portee: 1, octave: 0 };
      var G = null, voix = {}, ordre = [], tenues = [], arpNotes = [], arpI = 0, arpSens = 1, base = 48, oscillo = null, clavierApi;
      corps.classList.add('mu-poly');

      /* ── le son ── */
      function onde(c) { var n = 48, re = new Float32Array(n), im = new Float32Array(n), d = .5 - P.largeur / 10 * .42; for (var k = 1; k < n; k++) im[k] = 2 / (k * Math.PI) * Math.sin(k * Math.PI * d); return c.createPeriodicWave(re, im); }
      function graphe() {
        if (G) return G; var c = S.ouvrir(), sortie = voie.ouvrir(); if (!c) return null;
        G = { c: c, somme: c.createGain(), sec: c.createGain(), vol: c.createGain(), lfo: c.createOscillator(), lfoG: c.createGain(), mO: c.createGain(), mF: c.createGain(), carre: null, lignes: [] };
        G.somme.gain.value = .5; G.lfo.type = 'triangle'; G.lfo.connect(G.lfoG); G.lfoG.connect(G.mO); G.lfoG.connect(G.mF); G.lfo.start();
        /* le chœur : deux lignes à retard dont la longueur respire, une de chaque côté */
        [[-1, 0], [1, .5]].forEach(function (x) {
          var d = c.createDelay(.05), o = c.createOscillator(), g = c.createGain(), w = c.createGain(), pan = c.createStereoPanner ? c.createStereoPanner() : c.createGain();
          if (pan.pan) pan.pan.value = x[0] * .8; d.delayTime.value = .009; o.type = 'triangle'; o.connect(g); g.connect(d.delayTime); G.somme.connect(d); d.connect(w); w.connect(pan); pan.connect(G.vol); o.start(c.currentTime + x[1]);
          G.lignes.push({ d: d, o: o, g: g, w: w });
        });
        G.somme.connect(G.sec); G.sec.connect(G.vol); G.vol.connect(sortie);
        G.vol.gain.value = P.niveau / 10 * .62; G.mO.gain.value = 0; G.mF.gain.value = 0; G.lignes.forEach(function (l) { l.w.gain.value = 0; l.g.gain.value = .002; });
        G.carre = onde(c); regler(); if (voie.analyseur) oscillo = scope(trace, voie.analyseur, 300, 70, function () { var b = ordre.length ? Math.min.apply(null, ordre) : 60; return 1 / S.freq(b); }); return G;
      }
      function regler() {
        if (!G) return; var t = G.c.currentTime, ch = P.choeur;
        G.lfo.frequency.setTargetAtTime(.1 * Math.pow(2, P.lVit / 10 * 7.6), t, .05); G.mO.gain.setTargetAtTime(P.oMod / 10 * 80, t, .03); G.mF.gain.setTargetAtTime(P.fMod / 10 * 3000, t, .03);
        G.vol.gain.setTargetAtTime(P.niveau / 10 * .62, t, .02);
        G.lignes.forEach(function (l, i) { l.w.gain.setTargetAtTime(ch ? .5 : 0, t, .03); /* I : lent ; II : plus vif et plus profond ; I + II : les deux à la fois, une vitesse de chaque côté (le chœur double) */
          l.o.frequency.setTargetAtTime(ch === 1 ? .5 : ch === 2 ? .83 : (i ? .83 : .5), t, .05); l.g.gain.setTargetAtTime(ch === 1 ? .0022 : ch === 2 ? .0034 : (i ? .0034 : .0022), t, .05); });
        G.sec.gain.setTargetAtTime(ch ? .75 : 1, t, .03);
        Object.keys(voix).forEach(function (m) { var v = voix[m]; if (v.fini) return; v.gS.gain.setTargetAtTime(P.scie ? .5 : 0, t, .02); v.gC.gain.setTargetAtTime(P.carre ? .5 : 0, t, .02); v.gU.gain.setTargetAtTime(P.sous / 10 * .5, t, .02); v.gB.gain.setTargetAtTime(P.bruit / 10 * .3, t, .02); v.ph.frequency.setTargetAtTime([20, 240, 720, 1500][P.ph], t, .03); v.f2.Q.setTargetAtTime(.7 + P.reso / 10 * 13, t, .03); var f = fTenue(+m); [v.f1, v.f2].forEach(function (b) { tenir(b.frequency, t); b.frequency.setTargetAtTime(f, t, .04); }); });
      }
      function fBase(m) { return Math.min(18000, coupure(P.coupure) * Math.pow(2, (m - 60) / 12 * P.suivi / 10)); }
      function fCrete(m) { return Math.min(19000, fBase(m) * Math.pow(2, P.env / 10 * 6)); }
      function fTenue(m) { return Math.min(19000, fBase(m) * Math.pow(2, P.env / 10 * 6 * P.S / 10)); }
      function jouerVoix(m, force, quand) {
        if (!graphe()) return; var c = G.c, t = quand || c.currentTime;
        if (voix[m] && !voix[m].fini) couper(m, t, .012);
        if (ordre.length >= 6) { var vieux = ordre.shift(); couper(vieux, t, .02); }                      /* la septième note prend la voix la plus ancienne */
        var f = S.freq(m), v = { oS: c.createOscillator(), oC: c.createOscillator(), oU: c.createOscillator(), b: c.createBufferSource(), gS: c.createGain(), gC: c.createGain(), gU: c.createGain(), gB: c.createGain(), ph: c.createBiquadFilter(), f1: c.createBiquadFilter(), f2: c.createBiquadFilter(), vca: c.createGain(), fini: false };
        v.oS.type = 'sawtooth'; v.oC.setPeriodicWave(G.carre); v.oU.type = 'square'; v.oS.frequency.value = v.oC.frequency.value = f; v.oU.frequency.value = f / 2; v.b.buffer = S.bruit(); v.b.loop = true;
        v.gS.gain.value = P.scie ? .5 : 0; v.gC.gain.value = P.carre ? .5 : 0; v.gU.gain.value = P.sous / 10 * .5; v.gB.gain.value = P.bruit / 10 * .3;
        v.ph.type = 'highpass'; v.ph.frequency.value = [20, 240, 720, 1500][P.ph]; v.f1.type = v.f2.type = 'lowpass'; v.f1.Q.value = .6; v.f2.Q.value = .7 + P.reso / 10 * 13; v.vca.gain.value = 0;
        [[v.oS, v.gS], [v.oC, v.gC], [v.oU, v.gU], [v.b, v.gB]].forEach(function (x) { x[0].connect(x[1]); x[1].connect(v.ph); }); G.mO.connect(v.oS.detune); G.mO.connect(v.oC.detune); G.mO.connect(v.oU.detune); G.mF.connect(v.f1.detune); G.mF.connect(v.f2.detune);
        v.ph.connect(v.f1); v.f1.connect(v.f2); v.f2.connect(v.vca); v.vca.connect(G.somme);
        var a = temps(P.A), d = temps(P.D), niv = .5 + .5 * (force === undefined ? .8 : force);
        v.vca.gain.setValueAtTime(0, t); v.vca.gain.setTargetAtTime(niv, t, a / 4 + .0015); v.vca.gain.setTargetAtTime(niv * P.S / 10, t + a + .003, d / 3);
        [v.f1, v.f2].forEach(function (b) { b.frequency.setValueAtTime(fBase(m), t); b.frequency.setTargetAtTime(fCrete(m), t, a / 4 + .001); b.frequency.setTargetAtTime(fTenue(m), t + a + .003, d / 3); });
        if (P.lDelai > 0) { G.lfoG.gain.cancelScheduledValues(t); G.lfoG.gain.setValueAtTime(Object.keys(voix).length ? G.lfoG.gain.value : 0, t); G.lfoG.gain.setTargetAtTime(1, t + P.lDelai / 10 * 1.2, .3); } else G.lfoG.gain.setTargetAtTime(1, t, .02);
        [v.oS, v.oC, v.oU, v.b].forEach(function (o) { o.start(t); });
        voix[m] = v; ordre.push(m); if (oscillo) oscillo.reveiller();
      }
      function couper(m, t, r) {
        var v = voix[m]; if (!v || v.fini) return; v.fini = true; ordre = ordre.filter(function (x) { return x !== m; }); t = t || G.c.currentTime;
        tenir(v.vca.gain, t); v.vca.gain.setTargetAtTime(0, t, r / 3 + .003); [v.f1, v.f2].forEach(function (b) { tenir(b.frequency, t); b.frequency.setTargetAtTime(fBase(m), t, r / 3 + .003); });
        var fin = t + r * 1.8 + .1; [v.oS, v.oC, v.oU, v.b].forEach(function (o) { o.stop(fin); });
        v.oS.onended = function () { try { G.mO.disconnect(v.oS.detune); G.mO.disconnect(v.oC.detune); G.mO.disconnect(v.oU.detune); G.mF.disconnect(v.f1.detune); G.mF.disconnect(v.f2.detune); v.vca.disconnect(); } catch (e) { /* déjà débranchée */ } if (voix[m] === v) delete voix[m]; };
      }
      function relacherVoix(m, quand) { if (G) couper(m, quand, temps(P.R)); }

      /* ── les notes tenues, l'accord, l'arpège ── */
      function dire() { var a = accord(P.arp ? arpNotes : tenues); ecran.children[1].textContent = a[0]; ecran.children[2].textContent = a[1]; voyants.forEach(function (x, i) { x.classList.toggle('joue', i < Math.min(6, ordre.length)); }); }
      function appuyer(m, force) {
        if (tenues.indexOf(m) < 0) tenues.push(m);
        if (P.arp) { if (P.tenue && tenues.length === 1) arpNotes = []; if (arpNotes.indexOf(m) < 0) arpNotes.push(m); if (!H.joue) jouerVoix(m, force); } else jouerVoix(m, force);
        dire();
      }
      function lacher(m) {
        tenues = tenues.filter(function (x) { return x !== m; });
        if (P.arp) { if (!P.tenue) arpNotes = arpNotes.filter(function (x) { return x !== m; }); if (!H.joue) relacherVoix(m); } else if (!P.tenue) relacherVoix(m);
        dire();
      }
      H.surPas(function (n, quand, d) {
        if (!P.arp || !arpNotes.length || !G) return;
        var suite = arpNotes.slice().sort(function (a, b) { return a - b; }), tout = []; for (var o = 0; o < P.portee; o++) suite.forEach(function (m) { tout.push(m + o * 12); });
        if (P.arp === 2) tout.reverse(); if (P.arp === 3 && tout.length > 2) tout = tout.concat(tout.slice(1, -1).reverse());
        var m = tout[arpI % tout.length]; arpI++; if (m > 108) return;
        jouerVoix(m, n % 4 === 0 ? .95 : .7, quand); relacherVoix(m, quand + d * .8);
        H.aLInstant(quand, function () { clavierApi.allumer(m, true); dire(); setTimeout(function () { if (tenues.indexOf(m) < 0) clavierApi.allumer(m, false); }, d * 800); });
      });
      document.addEventListener('ke:horloge', function () { arpI = 0; });

      /* ── la façade : des curseurs verticaux, leur nom dessous, leur valeur au-dessus quand on les tient ── */
      function vert(etiq, cle, a) {
        a = a || {};
        return M.curseur(etiq, { vertical: true, hauteur: 150, min: a.min === undefined ? 0 : a.min, max: a.max === undefined ? 10 : a.max, pas: a.pas || .1, valeur: P[cle], crans: a.crans, nom: a.nom }, function (v) { P[cle] = v; if (cle === 'largeur' && G) { G.carre = onde(G.c); Object.keys(voix).forEach(function (m) { if (!voix[m].fini) voix[m].oC.setPeriodicWave(G.carre); }); } regler(); });
      }
      function touche(nom, cle, valeurOn, long) {                                    /* un bouton à voyant : le mot, et un petit carré qui s'allume */
        var b = el('button', { type: 'button', class: 'mu-poly-touche', 'aria-pressed': 'false' }, [el('i', { class: 'mu-voyant' }), long || nom]); b._cle = cle; b._on = valeurOn; b.setAttribute('aria-label', nom);
        b.addEventListener('click', function () { if (valeurOn === undefined) P[cle] = P[cle] ? 0 : 1; else if (cle === 'choeur') P.choeur = P.choeur ^ valeurOn; else P[cle] = P[cle] === valeurOn ? 0 : valeurOn; if (cle === 'arp') { arpI = 0; if (!P.arp) { Object.keys(voix).forEach(function (m) { if (tenues.indexOf(+m) < 0) relacherVoix(+m); }); arpNotes = []; } else arpNotes = tenues.slice(); } if (cle === 'tenue' && !P.tenue) { arpNotes = tenues.slice(); Object.keys(voix).forEach(function (m) { if (tenues.indexOf(+m) < 0) relacherVoix(+m); }); } graphe(); regler(); peindreTouches(); dire(); });
        touches.push(b); return b;
      }
      var touches = [];
      function peindreTouches() { touches.forEach(function (b) { var on = b._on === undefined ? !!P[b._cle] : b._cle === 'choeur' ? !!(P.choeur & b._on) : P[b._cle] === b._on; b.setAttribute('aria-pressed', String(on)); b.firstChild.classList.toggle('on', on); }); }
      var trace = svg('path', {}), voyants = [0, 1, 2, 3, 4, 5].map(function () { return el('i', { class: 'mu-voyant' }); });
      var ecran = el('div', { class: 'mu-ecran mu-poly-ecran' }, [el('span', { class: 'petit', text: 'l’accord' }), el('span', { class: 'grand', text: '—' }), el('span', { class: 'ligne', text: '' }), (function () { var s = svg('svg', { viewBox: '0 0 300 70', 'aria-hidden': 'true' }); s.appendChild(trace); return s; })(), el('span', { class: 'mu-poly-voix' }, [el('span', { class: 'petit', text: 'les six voix' })].concat(voyants))]);
      trace.setAttribute('d', 'M0 35L300 35');
      var portee = el('div', { class: 'mu-bascule', 'data-positions': 'une octave|deux|trois', 'data-valeur': 0, 'aria-label': 'Étendue de l’arpège' }); M.bascule(portee); portee.addEventListener('ke:change', function (e) { P.portee = e.detail.valeur + 1; });
      var clavier = el('div', { 'aria-label': 'Clavier du poly, cinq octaves' });
      clavierApi = M.piano(clavier, { de: 36, a: 96, surNote: appuyer, surFin: lacher });
      function col(enfants) { return el('div', { class: 'mu-poly-cols' }, enfants); }

      corps.appendChild(el('div', { class: 'mu-rangee' }, [
        M.bloc('Oscillateur lent', [col([vert('vitesse', 'lVit'), vert('retard', 'lDelai')])]),
        M.bloc('Oscillateur', [col([vert('vibrato', 'oMod'), vert('largeur', 'largeur', { nom: 'Largeur du carré' }), el('div', { class: 'mu-poly-pile' }, [touche('Dent de scie', 'scie', undefined, 'scie'), touche('Carré', 'carre', undefined, 'carré')]), vert('sous', 'sous', { nom: 'Sous-octave' }), vert('bruit', 'bruit')])]),
        M.bloc('Passe-haut', [col([vert('crans', 'ph', { min: 0, max: 3, pas: 1, crans: '0,1,2,3', nom: 'Filtre passe-haut' })])]),
        M.bloc('Filtre', [col([vert('coupure', 'coupure'), vert('résonance', 'reso'), vert('enveloppe', 'env'), vert('lent', 'fMod', { nom: 'Modulation du filtre par l’oscillateur lent' }), vert('suivi', 'suivi', { nom: 'Suivi du clavier' })])]),
        M.bloc('Ampli', [col([vert('niveau', 'niveau')])]),
        M.bloc('Enveloppe', [col([vert('attaque', 'A'), vert('chute', 'D'), vert('tenue', 'S'), vert('relâche', 'R')])]),
        M.bloc('Chœur', [el('div', { class: 'mu-poly-pile' }, [touche('Chœur un', 'choeur', 1, 'I'), touche('Chœur deux', 'choeur', 2, 'II')])])
      ]));
      corps.appendChild(el('div', { class: 'mu-rangee mu-poly-bas' }, [
        M.bloc('Arpège', [el('div', { class: 'mu-poly-arp' }, [el('div', { class: 'mu-poly-pile' }, [touche('Arpège montant', 'arp', 1, 'monte'), touche('Arpège descendant', 'arp', 2, 'descend'), touche('Arpège montant puis descendant', 'arp', 3, 'va et vient'), touche('Tenue des notes', 'tenue', undefined, 'tenue')]), portee])]),
        M.bloc('Écran', [ecran]),
        M.bloc('', [clavier], 'large')
      ]));
      peindreTouches();
      return { toucheClavier: function (k, f) { clavier.focus({ preventScroll: true }); appuyer(base + k, f); clavierApi.allumer(base + k, true); }, relacheClavier: function (k) { lacher(base + k); clavierApi.allumer(base + k, false); }, octave: function (d) { base = Math.max(36, Math.min(72, base + d * 12)); } };
    }
  });
})();
