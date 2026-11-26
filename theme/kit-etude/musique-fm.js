/* KIT ÉTUDE · LE SIX OPÉRATEURS — un synthé à modulation de fréquence (l'archétype du DX7, redessiné).
   Six oscillateurs sinus. Un « porteur » s'entend ; un « modulateur » fait trembler la fréquence d'un autre (gain en hertz = indice × sa fréquence).
   L'algorithme dit qui module qui : c'est le schéma au centre. Seize voix. Les réglages d'un opérateur valent pour les notes à venir. */
(function () {
  'use strict';
  var KE = window.KitEtude, M = KE.musique, S = KE.son, el = M.el, svg = M.svg;
  function borne(x, a, b) { return Math.max(a, Math.min(b, x)); }

  /* p : les porteurs ; l : [modulateur, cible] ; pos : [colonne, étage] (l'étage 0 est en bas, là où l'on entend) */
  var ALGOS = [
    { nom: 'deux piles', p: [1, 3], l: [[2, 1], [4, 3], [5, 4], [6, 5]], pos: { 1: [0, 0], 2: [0, 1], 3: [1, 0], 4: [1, 1], 5: [1, 2], 6: [1, 3] } },
    { nom: 'deux fois trois', p: [1, 4], l: [[2, 1], [3, 2], [5, 4], [6, 5]], pos: { 1: [0, 0], 2: [0, 1], 3: [0, 2], 4: [1, 0], 5: [1, 1], 6: [1, 2] } },
    { nom: 'trois paires', p: [1, 3, 5], l: [[2, 1], [4, 3], [6, 5]], pos: { 1: [0, 0], 2: [0, 1], 3: [1, 0], 4: [1, 1], 5: [2, 0], 6: [2, 1] } },
    { nom: 'l’éventail', p: [1, 3, 4, 5], l: [[2, 1], [6, 3], [6, 4], [6, 5]], pos: { 1: [0, 0], 2: [0, 1], 3: [1, 0], 4: [2, 0], 5: [3, 0], 6: [2, 1] } },
    { nom: 'la pyramide', p: [1], l: [[2, 1], [3, 1], [4, 2], [5, 3], [6, 5]], pos: { 1: [1, 0], 2: [0, 1], 3: [2, 1], 4: [0, 2], 5: [2, 2], 6: [2, 3] } },
    { nom: 'une paire, quatre voix', p: [1, 2, 3, 4, 5], l: [[6, 5]], pos: { 1: [0, 0], 2: [1, 0], 3: [2, 0], 4: [3, 0], 5: [4, 0], 6: [4, 1] } },
    { nom: 'la colonne et deux', p: [1, 2, 3], l: [[4, 3], [5, 4], [6, 5]], pos: { 1: [0, 0], 2: [1, 0], 3: [2, 0], 4: [2, 1], 5: [2, 2], 6: [2, 3] } },
    { nom: 'six voix', p: [1, 2, 3, 4, 5, 6], l: [], pos: { 1: [0, 0], 2: [1, 0], 3: [2, 0], 4: [3, 0], 5: [4, 0], 6: [5, 0] } }];
  /* un timbre : l'algorithme, la réaction (0 à 7), puis par opérateur [rapport, niveau 0-99, attaque, chute, tenue 0-1, relâche] en secondes */
  var TIMBRES = [
    { nom: 'piano électrique', algo: 2, fb: 3, ops: [[1, 99, .002, 1.7, 0, .28], [14, 56, .002, .22, 0, .2], [1, 95, .002, 2.3, 0, .3], [1, 66, .002, 1.2, .08, .3], [1, 90, .002, 2, 0, .3], [1, 60, .002, 1.5, .12, .3]] },
    { nom: 'cloche', algo: 2, fb: 0, ops: [[1, 95, .002, 3.6, 0, 1.6], [3.5, 74, .002, 2.6, 0, 1.6], [1, 90, .002, 3, 0, 1.6], [7, 64, .002, 1.8, 0, 1.2], [2, 80, .002, 2.5, 0, 1.6], [11.5, 52, .002, .8, 0, .8]] },
    { nom: 'basse', algo: 1, fb: 5, ops: [[1, 99, .002, .7, .3, .12], [1, 78, .002, .26, .1, .1], [2, 58, .002, .12, 0, .1], [.5, 95, .002, .9, .4, .12], [1, 66, .002, .3, .1, .1], [1, 50, .002, .15, 0, .1]] },
    { nom: 'cuivre', algo: 0, fb: 6, ops: [[1, 99, .06, .3, .8, .2], [1, 76, .09, .4, .6, .2], [1, 92, .07, .3, .8, .2], [1, 68, .1, .5, .5, .2], [2, 50, .08, .3, .4, .2], [1, 46, .08, .3, .4, .2]] },
    { nom: 'marimba', algo: 2, fb: 0, ops: [[1, 99, .001, .6, 0, .3], [4, 68, .001, .12, 0, .1], [1, 88, .001, .8, 0, .3], [10, 48, .001, .06, 0, .05], [2, 60, .001, .3, 0, .2], [1, 0, .001, .1, 0, .1]] },
    { nom: 'nappe', algo: 5, fb: 2, ops: [[1, 88, .8, 1, .8, 1.6], [1, 88, .9, 1, .8, 1.6], [2, 62, 1.1, 1.4, .6, 1.6], [.5, 78, .7, 1, .8, 1.6], [1, 82, .9, 1, .8, 1.6], [3, 58, 1.3, 2, .5, 1.6]] },
    { nom: 'orgue de verre', algo: 7, fb: 0, ops: [[.5, 90, .01, .2, 1, .15], [1, 95, .01, .2, 1, .15], [2, 76, .01, .2, 1, .15], [3, 62, .01, .2, 1, .15], [4, 54, .01, .2, 1, .15], [6, 46, .01, .2, 1, .15]] },
    { nom: 'cordes pincées', algo: 3, fb: 4, ops: [[1, 96, .001, 1.2, 0, .3], [3, 74, .001, .4, 0, .2], [1, 88, .001, 1.5, 0, .3], [2, 76, .001, 1, 0, .3], [4, 62, .001, .6, 0, .2], [5, 68, .001, .3, 0, .2]] }];
  /* l'aplomb des timbres : mesuré (l'énergie des 300 ms les plus fortes d'un accord tenu), chacun ramené à la même hauteur ;
     les sons qui s'éteignent vite (cordes pincées, marimba) et les attaques lentes (la nappe) sont remontés, le cuivre descendu */
  var NIV = [.9, 1.46, 1.17, .62, 1.78, 2.07, 2.24, 2.75];
  var TMAX = { a: 2, d: 4, r: 4 };

  /* le schéma d'un algorithme : des carrés numérotés, reliés à angle droit ; les porteurs pleins, posés sur le trait de sortie */
  function dessiner(s, A, o) {
    while (s.firstChild) s.removeChild(s.firstChild);
    var cols = 0, rangs = 0, k; for (k in A.pos) { cols = Math.max(cols, A.pos[k][0] + 1); rangs = Math.max(rangs, A.pos[k][1] + 1); }
    var C = 40, PX = 66, PY = 60, R = o.mini ? o.rangs : rangs, W = (o.cols || cols) * PX - (PX - C) + 30, Hh = R * PY - (PY - C) + 26, x0 = (W - (cols * PX - (PX - C))) / 2;
    s.setAttribute('viewBox', '-6 -6 ' + (W + 12) + ' ' + (Hh + 12));
    function X(i) { return x0 + A.pos[i][0] * PX; } function Y(i) { return (R - 1 - A.pos[i][1]) * PY; }
    var ySortie = R * PY - (PY - C) + 14;
    s.appendChild(svg('line', { class: 'sortie', x1: 0, y1: ySortie, x2: W, y2: ySortie }));
    A.p.forEach(function (i) { s.appendChild(svg('line', { class: 'lien porte', x1: X(i) + C / 2, y1: Y(i) + C, x2: X(i) + C / 2, y2: ySortie })); });
    A.l.forEach(function (l) {
      var x1 = X(l[0]) + C / 2, y1 = Y(l[0]) + C, x2 = X(l[1]) + C / 2, y2 = Y(l[1]), ym = y1 + (y2 - y1) / 2;
      s.appendChild(svg('path', { class: 'lien' + (o.regle === l[0] || o.regle === l[1] ? ' vif' : ''), d: 'M' + x1 + ' ' + y1 + 'V' + ym + 'H' + x2 + 'V' + y2 }));
    });
    if (o.fb) { var x = X(6), y = Y(6); s.appendChild(svg('path', { class: 'lien boucle' + (o.regle === 6 ? ' vif' : ''), d: 'M' + (x + C) + ' ' + (y + C - 10) + 'h11v' + (-C - 2) + 'h' + (-C / 2 - 11) + 'v12' })); }
    for (var i = 1; i <= 6; i++) (function (i) {
      var porteur = A.p.indexOf(i) >= 0, g = svg('g', { class: 'op' + (porteur ? ' porteur' : '') + (o.regle === i ? ' regle' : '') });
      g.appendChild(svg('rect', { x: X(i), y: Y(i), width: C, height: C }));
      if (!o.mini) { var t = svg('text', { x: X(i) + C / 2, y: Y(i) + C / 2 + 8, 'text-anchor': 'middle' }); t.textContent = String(i); g.appendChild(t); }
      if (o.surChoix) { g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button'); g.setAttribute('aria-label', 'Opérateur ' + i + (porteur ? ', porteur' : ', modulateur')); g.addEventListener('click', function () { o.surChoix(i); }); g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); o.surChoix(i); } }); }
      s.appendChild(g);
    })(i);
  }

  function rangsDe(A) { var c = 0, k; for (k in A.pos) c = Math.max(c, A.pos[k][1] + 1); return c; }
  function colsDe(A) { var c = 0, k; for (k in A.pos) c = Math.max(c, A.pos[k][0] + 1); return c; }
  /* le grand schéma garde une seule échelle : la grille du plus grand algorithme, chaque algorithme centré et posé sur la sortie */
  var COLS = Math.max.apply(null, ALGOS.map(colsDe)), RANGS = Math.max.apply(null, ALGOS.map(rangsDe));

  M.definir('fm', {
    nom: 'Le six', accent: 'opérateurs', sous: 'des sinus qui se font trembler', maniere: 'du DX7',
    geste: 'Joue le clavier. Choisis un timbre, un algorithme. Touche un carré du schéma : son opérateur s’allume, tire les points de son enveloppe.',
    monter: function (corps, voie) {
      var etat = { algo: 2, fb: 3, regle: 1, timbre: 0, ops: [], octave: 0 }, voix = {}, ordre = [], bus = null, lfo = null, lfoGain = null, courbure = 0;
      function charger(i) { var T = TIMBRES[i]; etat.timbre = i; if (bus) bus.gain.setTargetAtTime(.2 * NIV[i], bus.context.currentTime, .05); etat.algo = T.algo; etat.fb = T.fb; etat.ops = T.ops.map(function (o) { return { rapport: o[0], niveau: o[1], a: o[2], d: o[3], s: o[4], r: o[5], fin: 0 }; }); }
      charger(0);

      /* ── le son ── */
      function sortie() {
        if (bus) return bus; var c = S.ouvrir(); bus = c.createGain(); bus.gain.value = .2 * NIV[etat.timbre]; bus.connect(voie.ouvrir());
        lfo = c.createOscillator(); lfo.frequency.value = 5.6; lfoGain = c.createGain(); lfoGain.gain.value = 0; lfo.connect(lfoGain); lfo.start(); return bus;
      }
      function niv(n) { return n <= 0 ? 0 : Math.pow(2, (n - 99) / 9); }
      function couper(v, t, vite) {
        if (v.fini) return; v.fini = true; var long = 0;
        v.gains.forEach(function (g, i) { var r = vite ? .02 : etat.ops[i].r; long = Math.max(long, r); if (g.gain.cancelAndHoldAtTime) g.gain.cancelAndHoldAtTime(t); else g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0, t, r / 3.2); });
        var fin = t + long * 1.7 + .06; v.oscs.forEach(function (o) { o.stop(fin); });
        v.oscs[0].onended = function () { v.oscs.concat(v.gains, v.autres).forEach(function (n) { try { n.disconnect(); } catch (e) { /* déjà libre */ } }); };
        var k = ordre.indexOf(v); if (k >= 0) ordre.splice(k, 1); if (voix[v.m] === v) delete voix[v.m];
      }
      function jouer(m, force) {
        var c = S.ouvrir(); if (!c) return; var out = sortie(), t = c.currentTime, A = ALGOS[etat.algo], f = S.freq(m + etat.octave * 12);
        if (voix[m]) couper(voix[m], t, true); while (ordre.length >= 16) couper(ordre[0], t, true);
        var v = { m: m, oscs: [], gains: [], autres: [] }, nbP = A.p.length;
        etat.ops.forEach(function (o, i) {
          var osc = c.createOscillator(), g = c.createGain(), fo = f * o.rapport, porteur = A.p.indexOf(i + 1) >= 0;
          osc.frequency.value = fo; osc.detune.value = o.fin + courbure; lfoGain.connect(osc.detune); g.gain.value = 0; osc.connect(g);
          var crete = porteur ? niv(o.niveau) * Math.pow(force, 1.3) * .9 / Math.sqrt(nbP) : 11 * niv(o.niveau) * (.5 + .5 * force) * fo;
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(crete, t + Math.max(.0015, o.a)); g.gain.setTargetAtTime(crete * o.s, t + Math.max(.0015, o.a), Math.max(.01, o.d) / 3);
          v.oscs.push(osc); v.gains.push(g);
        });
        A.l.forEach(function (l) { v.gains[l[0] - 1].connect(v.oscs[l[1] - 1].frequency); });
        A.p.forEach(function (i) { v.gains[i - 1].connect(out); });
        if (etat.fb > 0) {   /* la réaction : l'opérateur 6 se module lui-même ; Web Audio demande un retard dans toute boucle (un bloc de calcul) */
          var d = c.createDelay(.02), fg = c.createGain(); d.delayTime.value = 0; fg.gain.value = etat.fb / 7 * 1.4 * f * etat.ops[5].rapport * niv(etat.ops[5].niveau + 20 > 99 ? 99 : etat.ops[5].niveau + 20);
          v.oscs[5].connect(d); d.connect(fg); fg.connect(v.oscs[5].frequency); v.autres.push(d, fg);
        }
        v.oscs.forEach(function (o) { o.start(t); }); voix[m] = v; ordre.push(v); dire();
        if (scope) scope.reveiller();
      }
      function finir(m) { var v = voix[m]; if (v && S.ctx) couper(v, S.ctx.currentTime, false); dire(); }

      /* ── la façade ── */
      corps.classList.add('mu-fm');
      /* l'écran et les timbres */
      var eGrand = el('span', { class: 'grand' }), eLigne = el('span', { class: 'ligne' }), ePetit = el('span', { class: 'petit' }), trace = svg('path', {}), eSvg = svg('svg', { viewBox: '0 0 300 46', 'aria-hidden': 'true' }); eSvg.appendChild(trace);
      var ecran = el('div', { class: 'mu-ecran', 'aria-live': 'polite' }, [ePetit, eGrand, eLigne, eSvg]), scope = null;
      var timbres = el('div', { class: 'mu-fm-timbres', role: 'radiogroup', 'aria-label': 'Les timbres' });
      TIMBRES.forEach(function (T, i) {
        var b = el('button', { type: 'button', role: 'radio', 'aria-checked': 'false', tabindex: i ? '-1' : '0' }, [el('b', { text: String(i + 1) }), T.nom]);
        b.addEventListener('click', function () { charger(i); toutPeindre(); });
        b.addEventListener('keydown', function (e) { var d = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? -1 : 0; if (!d) return; e.preventDefault(); var j = (i + d + TIMBRES.length) % TIMBRES.length; timbres.children[j].focus(); timbres.children[j].click(); });
        timbres.appendChild(b);
      });
      /* l'algorithme : le grand schéma, et les huit en petit */
      var grand = svg('svg', { class: 'mu-fm-schema', role: 'group', 'aria-label': 'Schéma de l’algorithme' }), minis = el('div', { class: 'mu-fm-minis', role: 'radiogroup', 'aria-label': 'Les algorithmes' }), nomAlgo = el('p', { class: 'mu-fm-nomalgo' });
      ALGOS.forEach(function (A, i) {
        var s = svg('svg', { 'aria-hidden': 'true' }); dessiner(s, A, { mini: true, cols: 6, rangs: 4 });
        var b = el('button', { type: 'button', role: 'radio', 'aria-checked': 'false', 'aria-label': 'Algorithme ' + (i + 1) + ' : ' + A.nom, tabindex: i ? '-1' : '0' }, [s, el('b', { text: String(i + 1) })]);
        b.addEventListener('click', function () { etat.algo = i; toutPeindre(); });
        b.addEventListener('keydown', function (e) { var d = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? -1 : 0; if (!d) return; e.preventDefault(); var j = (i + d + ALGOS.length) % ALGOS.length; minis.children[j].focus(); minis.children[j].click(); });
        minis.appendChild(b);
      });
      var pReaction = M.potard('la réaction', { min: 0, max: 7, valeur: etat.fb, crans: 8 }, function (v) { etat.fb = v; peindreSchema(); });
      var bOct = el('div', { class: 'mu-bascule couchee', 'data-positions': '−1|0|+1', 'data-valeur': '1', 'aria-label': 'Octave' }); M.bascule(bOct); bOct.addEventListener('ke:change', function (e) { etat.octave = e.detail.valeur - 1; });

      /* les six opérateurs */
      var colonnes = [];
      function colonne(i) {
        var W = 200, Hh = 84, seg = 54, tenue = 30, s = svg('svg', { class: 'mu-fm-env', viewBox: '-8 -8 ' + (W + 16) + ' ' + (Hh + 16), role: 'group', 'aria-label': 'Enveloppe de l’opérateur ' + (i + 1) });
        var sol = svg('line', { class: 'sol', x1: 0, y1: Hh, x2: W, y2: Hh }), aire = svg('path', { class: 'aire' }), trait = svg('path', { class: 'trait' }); s.appendChild(sol); s.appendChild(aire); s.appendChild(trait);
        function X(t, max) { return Math.sqrt(borne(t / max, 0, 1)) * seg; } function T(x, max) { var u = borne(x / seg, 0, 1); return u * u * max; }
        var o = function () { return etat.ops[i]; };
        var poignees = [['a', 'attaque'], ['d', 'chute et tenue'], ['r', 'relâche']].map(function (p) {
          var g = svg('circle', { class: 'prise', r: 5, tabindex: '0', role: 'slider', 'aria-label': p[1] + ', opérateur ' + (i + 1) });
          KE.outils.tirer(g, function (e) { e.stopPropagation(); regler(i); g.focus(); g.classList.add('tenu'); return {}; }, function (e) {
            var r = s.getBoundingClientRect(), k = (W + 16) / r.width, x = (e.clientX - r.left) * k - 8, y = (e.clientY - r.top) * k - 8, O = o();
            if (p[0] === 'a') O.a = Math.max(.001, T(x, TMAX.a)); else if (p[0] === 'd') { O.d = Math.max(.01, T(x - X(O.a, TMAX.a), TMAX.d)); O.s = borne(1 - y / Hh, 0, 1); } else O.r = Math.max(.01, T(x - X(O.a, TMAX.a) - X(O.d, TMAX.d) - tenue, TMAX.r));
            peindreEnv(); lire(i);
          }, function () { g.classList.remove('tenu'); });
          g.addEventListener('keydown', function (e) {
            var dx = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0, dy = e.key === 'ArrowUp' ? 1 : e.key === 'ArrowDown' ? -1 : 0, O = o(); if (!dx && !dy) return; e.preventDefault(); regler(i);
            if (p[0] === 'a') O.a = Math.max(.001, T(X(O.a, TMAX.a) + dx * 2, TMAX.a)); else if (p[0] === 'd') { O.d = Math.max(.01, T(X(O.d, TMAX.d) + dx * 2, TMAX.d)); O.s = borne(O.s + dy * .05, 0, 1); } else O.r = Math.max(.01, T(X(O.r, TMAX.r) + dx * 2, TMAX.r));
            peindreEnv(); lire(i);
          });
          s.appendChild(g); return g;
        });
        function peindreEnv() {
          var O = o(), xa = X(O.a, TMAX.a), xd = xa + X(O.d, TMAX.d), xt = xd + tenue, xr = xt + X(O.r, TMAX.r), ys = Hh - O.s * Hh, haut = Hh - Hh * (O.niveau / 99) * 0 - Hh;   /* la crête est toujours en haut : le niveau se lit au potard */
          var d = 'M0 ' + Hh + 'L' + xa.toFixed(1) + ' ' + (haut + Hh * 0).toFixed(1) + 'Q' + (xa + (xd - xa) * .3).toFixed(1) + ' ' + ys.toFixed(1) + ' ' + xd.toFixed(1) + ' ' + ys.toFixed(1) + 'H' + xt.toFixed(1) + 'Q' + (xt + (xr - xt) * .3).toFixed(1) + ' ' + Hh + ' ' + xr.toFixed(1) + ' ' + Hh;
          trait.setAttribute('d', d); aire.setAttribute('d', d + 'Z');
          poignees[0].setAttribute('cx', xa); poignees[0].setAttribute('cy', 0); poignees[1].setAttribute('cx', xd); poignees[1].setAttribute('cy', ys); poignees[2].setAttribute('cx', xr); poignees[2].setAttribute('cy', Hh);
          poignees[0].setAttribute('aria-valuetext', O.a.toFixed(2) + ' s'); poignees[1].setAttribute('aria-valuetext', O.d.toFixed(2) + ' s, tenue ' + Math.round(O.s * 100)); poignees[2].setAttribute('aria-valuetext', O.r.toFixed(2) + ' s');
        }
        var num = el('b', { class: 'num', text: String(i + 1) }), role = el('span', { class: 'role' }), temps = el('span', { class: 'temps' });
        var pR = M.potard('rapport', { taille: 'petit', min: .5, max: 16, pas: .5, valeur: 1, nom: 'Rapport de fréquence, opérateur ' + (i + 1) }, function (v) { etat.ops[i].rapport = v; regler(i); });
        var pF = M.potard('fin', { taille: 'petit', min: -50, max: 50, pas: 1, valeur: 0, centre: true, nom: 'Accord fin, opérateur ' + (i + 1) }, function (v) { etat.ops[i].fin = v; regler(i); });
        var pN = M.potard('niveau', { taille: 'petit', min: 0, max: 99, pas: 1, valeur: 50, nom: 'Niveau, opérateur ' + (i + 1) }, function (v) { etat.ops[i].niveau = v; regler(i); });
        var n = el('div', { class: 'mu-fm-op', 'data-op': i + 1 }, [el('div', { class: 'mu-fm-optete' }, [num, role, temps]), s, el('div', { class: 'mu-fm-potards' }, [pR, pF, pN])]);
        n.addEventListener('pointerdown', function () { regler(i); });
        n.addEventListener('focusin', function () { regler(i); });
        function lire() { var O = o(); temps.textContent = O.a.toFixed(2).replace('.', ',') + ' · ' + O.d.toFixed(2).replace('.', ',') + ' · ' + Math.round(O.s * 100) + ' · ' + O.r.toFixed(2).replace('.', ','); }
        return { n: n, peindre: function () { var O = o(), porteur = ALGOS[etat.algo].p.indexOf(i + 1) >= 0; role.textContent = porteur ? 'porteur' : 'modulateur'; n.classList.toggle('porteur', porteur); n.classList.toggle('regle', etat.regle === i + 1); n.classList.toggle('muet', O.niveau === 0); pR._api.valeur(O.rapport); pF._api.valeur(O.fin); pN._api.valeur(O.niveau); peindreEnv(); lire(); } };
      }
      function lire(i) { colonnes[i].peindre(); }
      function regler(i) { if (etat.regle === i + 1) return; etat.regle = i + 1; peindreSchema(); colonnes.forEach(function (c) { c.peindre(); }); }
      function peindreSchema() { dessiner(grand, ALGOS[etat.algo], { regle: etat.regle, fb: etat.fb > 0, cols: COLS, rangs: RANGS, surChoix: function (i) { regler(i - 1); } }); }
      function dire() { var n = ordre.length; ePetit.textContent = 'timbre ' + (etat.timbre + 1) + ' · ' + (n ? n + (n > 1 ? ' voix' : ' voix') + ' sur seize' : 'seize voix'); }
      function toutPeindre() {
        eGrand.textContent = TIMBRES[etat.timbre].nom; eLigne.textContent = 'algorithme ' + (etat.algo + 1) + ', ' + ALGOS[etat.algo].nom; nomAlgo.textContent = (etat.algo + 1) + ' · ' + ALGOS[etat.algo].nom;
        [].forEach.call(timbres.children, function (b, i) { b.setAttribute('aria-checked', i === etat.timbre ? 'true' : 'false'); b.tabIndex = i === etat.timbre ? 0 : -1; });
        [].forEach.call(minis.children, function (b, i) { b.setAttribute('aria-checked', i === etat.algo ? 'true' : 'false'); b.tabIndex = i === etat.algo ? 0 : -1; });
        pReaction._api.valeur(etat.fb); peindreSchema(); colonnes.forEach(function (c) { c.peindre(); }); dire();
      }
      var rangOps = el('div', { class: 'mu-fm-ops' }); for (var i = 0; i < 6; i++) { colonnes.push(colonne(i)); rangOps.appendChild(colonnes[i].n); }

      /* le clavier et les molettes */
      var cl = el('div', { 'aria-label': 'Clavier du six opérateurs' }), piano = M.piano(cl, { de: 36, a: 96, surNote: jouer, surFin: finir });
      var mH = el('div', { 'aria-label': 'Molette de hauteur' }), mM = el('div', { 'aria-label': 'Molette de vibrato' }); M.molette(mH, { retour: true }); M.molette(mM, {});
      mH.addEventListener('ke:change', function (e) { courbure = e.detail.valeur * 200; Object.keys(voix).forEach(function (m) { voix[m].oscs.forEach(function (o, i) { o.detune.setTargetAtTime(etat.ops[i].fin + courbure, S.ctx.currentTime, .01); }); }); });
      mM.addEventListener('ke:change', function (e) { sortie(); lfoGain.gain.setTargetAtTime(e.detail.valeur * 40, S.ctx.currentTime, .03); });

      corps.appendChild(el('div', { class: 'mu-rangee' }, [
        M.bloc('Le timbre', [ecran, timbres], 'mu-fm-btimbre'),
        M.bloc('L’algorithme', [el('div', { class: 'mu-fm-algo' }, [grand, el('div', {}, [nomAlgo, minis])])], 'large'),
        M.bloc('Le reste', [M.organes([pReaction]), el('div', { style: 'margin-top:22px' }, [bOct, el('p', { class: 'mu-etiq', text: 'octave', style: 'text-align:left' })])])]));
      corps.appendChild(el('div', { class: 'mu-rangee' }, [M.bloc('Les six opérateurs', [rangOps], 'large')]));
      corps.appendChild(el('div', { class: 'mu-rangee mu-fm-bas' }, [M.bloc('', [el('div', { class: 'mu-fm-molettes' }, [el('div', {}, [mH, el('p', { class: 'mu-etiq', text: 'hauteur' })]), el('div', {}, [mM, el('p', { class: 'mu-etiq', text: 'vibrato' })])])]), M.bloc('', [cl], 'large')]));
      toutPeindre();
      corps.addEventListener('pointerdown', function () { setTimeout(function () { if (!scope && S.ctx && voie.analyseur) scope = S.oscillo(trace, voie.analyseur, 300, 46); if (scope) scope.reveiller(); }, 30); }, true);
      trace.setAttribute('d', 'M0 23L300 23');

      var tenuesOrdi = {};
      return {
        toucheClavier: function (k, force) { var m = 60 + k; tenuesOrdi[k] = m; piano.allumer(m, true); jouer(m, force); if (!scope && S.ctx && voie.analyseur) scope = S.oscillo(trace, voie.analyseur, 300, 46); if (scope) scope.reveiller(); },
        relacheClavier: function (k) { var m = tenuesOrdi[k]; if (m === undefined) return; delete tenuesOrdi[k]; piano.allumer(m, false); finir(m); },
        octave: function (d) { etat.octave = borne(etat.octave + d, -1, 1); bOct._mu.valeur(etat.octave + 1); }
      };
    }
  });
})();
