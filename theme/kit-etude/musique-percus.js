/* KIT ÉTUDE · LES PERCUSSIONS ET LES PETITES VOIX, communes à la boîte à rythmes, à la boîte à boucles et à la grille (KitEtude.musique.percus).
   Faites de la seule Web Audio API, aucun fichier. Chaque voix reçoit le contexte (le vrai, ou un contexte hors ligne pour dessiner sa forme
   d'onde), la sortie, l'heure, la force (0..1) et ses réglages (0..1) ; elle rend l'heure où elle se tait (le charleston rend { fin, etouffe }).
   Les niveaux sont étalonnés hors ligne : à force 1, chaque voix atteint la même énergie sur ses 120 ms les plus fortes (à ±2 dB). */
(function () {
  'use strict';
  var M = window.KitEtude && window.KitEtude.musique; if (!M) return;
  M.percus = (function () {
    var tampons = [];
    function bruit(c) {
      for (var i = 0; i < tampons.length; i++) if (tampons[i].c === c) return tampons[i].b;
      var n = Math.floor(c.sampleRate * 1.5), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      tampons.push({ c: c, b: b }); if (tampons.length > 3) tampons.shift(); return b;
    }
    function osc(c, type, f, t, fin) { var o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.start(t); o.stop(fin + .02); return o; }
    function souffle(c, t, fin) { var s = c.createBufferSource(); s.buffer = bruit(c); s.loop = true; s.start(t, Math.random()); s.stop(fin + .02); return s; }
    function gain(c, v) { var g = c.createGain(); g.gain.value = v === undefined ? 0 : v; return g; }
    function filtre(c, type, f, q) { var x = c.createBiquadFilter(); x.type = type; x.frequency.value = Math.min(f, c.sampleRate * .45); x.Q.value = q === undefined ? .7 : q; return x; }
    /* une frappe : montée en un millième et demi (pas de clic), chute exponentielle */
    function frappe(p, t, crete, chute) { p.setValueAtTime(0, t); p.linearRampToValueAtTime(crete, t + .0015); p.exponentialRampToValueAtTime(.0001, t + chute); p.setValueAtTime(0, t + chute + .002); return t + chute; }
    /* un corps : la même attaque, puis une chute en constante de temps (le métal garde de la matière au lieu de s'éteindre en un éclair) */
    function corps(p, t, crete, chute) { p.setValueAtTime(0, t); p.linearRampToValueAtTime(crete, t + .0015); p.setTargetAtTime(0, t + .0015, chute / 4.5); p.setValueAtTime(0, t + chute * 1.3); return t + chute * 1.3; }
    function chaine() { for (var i = 0; i < arguments.length - 1; i++) arguments[i].connect(arguments[i + 1]); return arguments[arguments.length - 1]; }
    function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    var METAL = [205.3, 304.4, 369.6, 522.7, 540, 800];   /* six carrés désaccordés : la matière des cymbales */
    function metal(c, t, fin, k) { var s = gain(c, .17); METAL.forEach(function (f) { osc(c, 'square', f * (k || 1), Math.max(0, t - .006), fin).connect(s); }); return s; }   /* lancés un peu avant : le saut de départ des carrés tombe sous un gain nul */
    var X = { hz: hz };
    X.grosse = function (c, d, t, v, r) {
      var f = 40 + (r.ton === undefined ? .5 : r.ton) * 26, dur = .16 + (r.chute === undefined ? .45 : r.chute) * 1.1, o = osc(c, 'sine', f, t, t + dur), g = gain(c);
      o.frequency.setValueAtTime(f * 4.4, t); o.frequency.exponentialRampToValueAtTime(f * 1.5, t + .022); o.frequency.exponentialRampToValueAtTime(f, t + .1);
      frappe(g.gain, t, v * .95, dur); chaine(o, g, d);
      var n = souffle(c, t, t + .02), gn = gain(c); frappe(gn.gain, t, v * .22, .014); chaine(n, filtre(c, 'lowpass', 2600), gn, d);   /* le claquement de la batte */
      return t + dur;
    };
    X.claire = function (c, d, t, v, r) {
      var k = .82 + (r.ton === undefined ? .5 : r.ton) * .42, cl = r.claquant === undefined ? .6 : r.claquant, fin = t + .12 + cl * .24;
      [[186 * k, .5, .12], [332 * k, .3, .07]].forEach(function (p) { var o = osc(c, 'triangle', p[0], t, t + p[2]), g = gain(c); o.frequency.setValueAtTime(p[0] * 1.35, t); o.frequency.exponentialRampToValueAtTime(p[0], t + .03); frappe(g.gain, t, v * p[1], p[2]); chaine(o, g, d); });
      var n = souffle(c, t, fin), g = gain(c); frappe(g.gain, t, v * (.28 + cl * .5), .1 + cl * .24); chaine(n, filtre(c, 'highpass', 1700), filtre(c, 'bandpass', 5200, .5), g, d);
      return fin;
    };
    X.tom = function (c, d, t, v, r) {
      var f = (r.base || 110) * (.8 + (r.ton === undefined ? .5 : r.ton) * .45), dur = .14 + (r.chute === undefined ? .4 : r.chute) * .7, o = osc(c, 'sine', f, t, t + dur), g = gain(c);
      o.frequency.setValueAtTime(f * 1.9, t); o.frequency.exponentialRampToValueAtTime(f, t + .07); frappe(g.gain, t, v * .8, dur); chaine(o, g, d);
      var n = souffle(c, t, t + .05), gn = gain(c); frappe(gn.gain, t, v * .1, .04); chaine(n, filtre(c, 'bandpass', f * 4, 1), gn, d); return t + dur;
    };
    X.bord = function (c, d, t, v, r) {
      var k = .8 + (r.ton === undefined ? .5 : r.ton) * .5, g = gain(c), hp = filtre(c, 'highpass', 500); corps(g.gain, t, v * .55, .026);
      osc(c, 'triangle', 1667 * k, Math.max(0, t - .006), t + .04).connect(hp); var o2 = osc(c, 'square', 455 * k, Math.max(0, t - .006), t + .04), g2 = gain(c, .35); chaine(o2, g2, hp); chaine(hp, g, d); return t + .04;
    };
    X.mains = function (c, d, t, v, r) {
      var q = .1 + (r.chute === undefined ? .4 : r.chute) * .4, fin = t + .034 + q, n = souffle(c, t, fin), g = gain(c), p = g.gain;
      p.setValueAtTime(0, t); for (var k = 0; k < 3; k++) { p.linearRampToValueAtTime(v * 1.2, t + k * .011 + .001); p.exponentialRampToValueAtTime(v * .14, t + k * .011 + .01); }
      p.linearRampToValueAtTime(v * 1.35, t + .034); p.exponentialRampToValueAtTime(.0001, fin); p.setValueAtTime(0, fin + .002);
      chaine(n, filtre(c, 'bandpass', 1150, 1.3), filtre(c, 'highpass', 650), g, d); return fin;
    };
    X.cloche = function (c, d, t, v, r) {
      var k = .8 + (r.ton === undefined ? .5 : r.ton) * .5, fin = t + .38, bp = filtre(c, 'bandpass', 2640 * k, 1.1), g = gain(c), p = g.gain;
      osc(c, 'square', 540 * k, Math.max(0, t - .006), fin).connect(bp); osc(c, 'square', 800 * k, Math.max(0, t - .006), fin).connect(bp);
      p.setValueAtTime(0, t); p.linearRampToValueAtTime(v * .6, t + .002); p.exponentialRampToValueAtTime(v * .17, t + .035); p.exponentialRampToValueAtTime(.0001, fin); p.setValueAtTime(0, fin + .002);
      chaine(bp, g, d); return fin;
    };
    /* le charleston rend aussi son robinet (etouffe) : le fermé coupe l'ouvert */
    X.charley = function (c, d, t, v, r) {
      var ton = r.ton === undefined ? .5 : r.ton, dur = r.ouvert ? .14 + (r.chute === undefined ? .45 : r.chute) * .75 : .03 + (r.chute === undefined ? .3 : r.chute) * .07, g = gain(c), rob = gain(c, 1);
      var fin = corps(g.gain, t, v * (r.ouvert ? 1.5 : 1.3), dur); chaine(metal(c, t, fin, .9 + ton * .25), filtre(c, 'bandpass', 8600 + ton * 3000, .7), filtre(c, 'highpass', 6800), g, rob, d);
      return { fin: fin, etouffe: function (q) { rob.gain.setValueAtTime(1, q); rob.gain.setTargetAtTime(0, q, .007); } };
    };
    X.cymbale = function (c, d, t, v, r) {
      var ton = r.ton === undefined ? .5 : r.ton, dur = .45 + (r.chute === undefined ? .5 : r.chute) * 1.7, m = metal(c, t, t + dur, .95 + ton * .2);
      var g1 = gain(c), g2 = gain(c); frappe(g1.gain, t, v * .95, dur); frappe(g2.gain, t, v * .8, dur * .28);
      chaine(m, filtre(c, 'bandpass', 3600 + ton * 3600, .6), filtre(c, 'highpass', 2900), g1, d); chaine(m, filtre(c, 'highpass', 8200), g2, d); return t + dur;
    };
    X.maracas = function (c, d, t, v) { var n = souffle(c, t, t + .075), g = gain(c), p = g.gain; p.setValueAtTime(0, t); p.linearRampToValueAtTime(v * .34, t + .012); p.setTargetAtTime(0, t + .012, .016); p.setValueAtTime(0, t + .068); chaine(n, filtre(c, 'highpass', 6200), g, d); return t + .07; };
    /* la basse : une scie et un carré à l'octave du dessous, un filtre qui s'ouvre puis se referme */
    X.basse = function (c, d, t, v, r) {
      var f = hz(r.note || 33), dur = r.duree || (.1 + (r.chute === undefined ? .4 : r.chute) * .6), fin = t + dur + .12, lp = filtre(c, 'lowpass', 300, 5 + (r.mordant || 0) * 8), g = gain(c), f0 = 160 + (r.filtre === undefined ? .5 : r.filtre) * 1500;
      var a = osc(c, 'sawtooth', f, t, fin), b = osc(c, 'square', f / 2, t, fin), gb = gain(c, .5);
      if (r.depuis) { a.frequency.setValueAtTime(hz(r.depuis), t); a.frequency.exponentialRampToValueAtTime(f, t + .06); b.frequency.setValueAtTime(hz(r.depuis) / 2, t); b.frequency.exponentialRampToValueAtTime(f / 2, t + .06); }
      lp.frequency.setValueAtTime(f0 * 4.5, t); lp.frequency.exponentialRampToValueAtTime(f0, t + .16);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * .44, t + .005); g.gain.setTargetAtTime(v * .33, t + .005, .05); g.gain.setTargetAtTime(0, t + dur, .03);
      a.connect(lp); chaine(b, gb, lp); chaine(lp, g, d); return fin;
    };
    /* l'accord : deux scies désaccordées par note, un filtre doux */
    X.accord = function (c, d, t, v, r) {
      var notes = r.notes || [57, 60, 64], dur = r.duree || (.12 + (r.chute === undefined ? .4 : r.chute) * 1.1), fin = t + dur + .5, lp = filtre(c, 'lowpass', 900, 1.2), g = gain(c), f0 = 500 + (r.filtre === undefined ? .5 : r.filtre) * 4200, att = r.attaque || .008;
      notes.forEach(function (m) { [-7, 7].forEach(function (ct) { var o = osc(c, 'sawtooth', hz(m), t, fin); o.detune.value = ct; o.connect(lp); }); });
      lp.frequency.setValueAtTime(f0 * (r.attaque ? .5 : 1.8), t); lp.frequency.linearRampToValueAtTime(f0, t + Math.max(.12, att));
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * .2 / Math.sqrt(notes.length), t + att); g.gain.setTargetAtTime(0, t + dur, r.attaque ? .14 : .09);
      chaine(lp, g, d); return fin;
    };
    X.pique = function (c, d, t, v, r) {
      var f = hz(r.note || 69), dur = .1 + (r.chute === undefined ? .4 : r.chute) * .5, lp = filtre(c, 'lowpass', 800, 2), g = gain(c), f0 = 700 + (r.filtre === undefined ? .6 : r.filtre) * 5000;
      osc(c, 'square', f, t, t + dur).connect(lp); osc(c, 'triangle', f * 2.003, t, t + dur).connect(lp);
      lp.frequency.setValueAtTime(f0 * 2.2, t); lp.frequency.exponentialRampToValueAtTime(Math.max(200, f0 * .25), t + dur * .7); frappe(g.gain, t, v * .26, dur); chaine(lp, g, d); return t + dur;
    };
    /* la cloche de verre : une porteuse et sa modulante (deux opérateurs) */
    X.verre = function (c, d, t, v, r) {
      var f = hz(r.note || 81), dur = .5 + (r.chute === undefined ? .5 : r.chute) * 1.6, p = osc(c, 'sine', f, t, t + dur), m = osc(c, 'sine', f * 3.5, t, t + dur), gm = gain(c), g = gain(c);
      gm.gain.setValueAtTime(f * 2.4, t); gm.gain.exponentialRampToValueAtTime(f * .05, t + dur * .6); chaine(m, gm, p.frequency); frappe(g.gain, t, v * .42, dur); chaine(p, g, d); return t + dur;
    };
    X.voix = function (c, d, t, v, r) {   /* une ligne qui chante : un carré adouci, un léger vibrato */
      var f = hz(r.note || 69), dur = r.duree || .3, fin = t + dur + .25, o = osc(c, 'square', f, t, fin), o2 = osc(c, 'sawtooth', f * 1.004, t, fin), lp = filtre(c, 'lowpass', 1500 + (r.filtre === undefined ? .5 : r.filtre) * 3000, 3), g = gain(c), l = osc(c, 'sine', 5.4, t, fin), gl = gain(c, f * .006);
      if (r.depuis) { o.frequency.setValueAtTime(hz(r.depuis), t); o.frequency.exponentialRampToValueAtTime(f, t + .07); o2.frequency.setValueAtTime(hz(r.depuis), t); o2.frequency.exponentialRampToValueAtTime(f * 1.004, t + .07); }
      chaine(l, gl, o.frequency); o.connect(lp); o2.connect(lp); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * .16, t + .012); g.gain.setTargetAtTime(0, t + dur, .06); chaine(lp, g, d); return fin;
    };
    X.vent = function (c, d, t, v, r) {   /* un souffle qui monte */
      var dur = .35 + (r.chute === undefined ? .5 : r.chute) * 1.4, n = souffle(c, t, t + dur), bp = filtre(c, 'bandpass', 300, 5), g = gain(c), p = g.gain;
      bp.frequency.setValueAtTime(260, t); bp.frequency.exponentialRampToValueAtTime(2500 + (r.filtre === undefined ? .6 : r.filtre) * 6000, t + dur * .9);
      p.setValueAtTime(0, t); p.linearRampToValueAtTime(v * .9, t + dur * .85); p.linearRampToValueAtTime(0, t + dur); chaine(n, bp, g, d); return t + dur;
    };
    X.chute = function (c, d, t, v, r) {   /* une note qui tombe */
      var dur = .12 + (r.chute === undefined ? .4 : r.chute) * .5, o = osc(c, 'sine', 2400, t, t + dur), g = gain(c); o.frequency.setValueAtTime(hz(r.note || 96), t); o.frequency.exponentialRampToValueAtTime(70, t + dur); frappe(g.gain, t, v * .4, dur); chaine(o, g, d); return t + dur;
    };
    /* l'étalonnage : mesuré hors ligne à force 1, sur les 30 ms les plus fortes ; le métal et les petits bruits remontés, la grosse caisse
       et les toms descendus, pour que la boîte sonne d'aplomb sans qu'on touche aux niveaux (cf. LIRE.md) */
    var NIV = { grosse: .72, claire: .85, tom: .74, bord: 1, mains: 1.5, cloche: .9, cymbale: 1.5, maracas: 1.25, accord: 1.19, verre: .82, voix: 1.15, vent: 1.26, chute: 1.1 };
    Object.keys(NIV).forEach(function (k) { var f = X[k]; X[k] = function (c, d, t, v, r) { return f(c, d, t, v * NIV[k], r); }; });
    var charley = X.charley; X.charley = function (c, d, t, v, r) { return charley(c, d, t, v * (r && r.ouvert ? 1.84 : 3.6), r); };
    return X;
  })();
})();
