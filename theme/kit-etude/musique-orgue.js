/* KIT ÉTUDE · L'ORGUE À TIRETTES ET SON CLAVIER — à la manière d'un Hammond et d'un clavier maître.
   Neuf tirettes : neuf harmoniques (des sinus) dosées de 0 à 8. Chaque note est un oscillateur dont la forme d'onde est faite de ces neuf sinus
   (une onde périodique recalculée quand une tirette bouge : la même addition, un seul oscillateur par note). S'y ajoutent la percussion,
   le clic de touche, le vibrato ou le chœur (un retard qui ondule) et la cabine tournante (trémolo, panoramique, et l'inertie de son rotor). */
(function () {
  'use strict';
  var KE = window.KitEtude, M = KE.musique, S = KE.son, el = M.el, svg = M.svg;
  function borne(x, a, b) { return Math.max(a, Math.min(b, x)); }
  var PIEDS = ['16′', '5⅓′', '8′', '4′', '2⅔′', '2′', '1⅗′', '1⅓′', '1′'], RANGS = [1, 3, 2, 4, 6, 8, 10, 12, 16];   /* rangs d'harmonique, comptés depuis le 16′ */
  var TEINTE = ['sombre', 'sombre', 'claire', 'claire', 'noire', 'claire', 'noire', 'noire', 'claire'];
  var REGISTRES = [['le plein jeu', [8, 8, 8, 8, 0, 0, 0, 0, 0]], ['le jazz', [8, 8, 8, 0, 0, 0, 0, 0, 0]], ['la flûte', [0, 0, 8, 4, 0, 2, 0, 0, 0]], ['le gospel', [8, 8, 8, 8, 8, 8, 8, 8, 8]], ['la ballade', [0, 0, 6, 8, 0, 4, 0, 0, 3]], ['le rock', [8, 8, 8, 6, 0, 0, 0, 5, 8]]];
  var NOTES = ['do', 'do dièse', 'ré', 'mi bémol', 'mi', 'fa', 'fa dièse', 'sol', 'la bémol', 'la', 'si bémol', 'si'];
  var ACCORDS = [['', [0, 4, 7]], [' mineur', [0, 3, 7]], [' septième', [0, 4, 7, 10]], [' majeur septième', [0, 4, 7, 11]], [' mineur septième', [0, 3, 7, 10]], [' mineur, septième majeure', [0, 3, 7, 11]],
    [' sixte', [0, 4, 7, 9]], [' mineur sixte', [0, 3, 7, 9]], [' diminué', [0, 3, 6]], [' diminué septième', [0, 3, 6, 9]], [' demi-diminué', [0, 3, 6, 10]], [' augmenté', [0, 4, 8]],
    [' quarte suspendue', [0, 5, 7]], [' seconde suspendue', [0, 2, 7]], [' neuvième', [0, 2, 4, 7, 10]], [' majeur neuvième', [0, 2, 4, 7, 11]], [' mineur neuvième', [0, 2, 3, 7, 10]], [' neuvième ajoutée', [0, 2, 4, 7]], [' septième, quarte suspendue', [0, 5, 7, 10]], [' quinte', [0, 7]]];
  var INTERVALLES = ['unisson', 'seconde mineure', 'seconde majeure', 'tierce mineure', 'tierce majeure', 'quarte', 'triton', 'quinte', 'sixte mineure', 'sixte majeure', 'septième mineure', 'septième majeure'];
  var GAMMES = [['aucune', []], ['majeure', [0, 2, 4, 5, 7, 9, 11]], ['mineure', [0, 2, 3, 5, 7, 8, 10]], ['pentatonique', [0, 2, 4, 7, 9]], ['blues', [0, 3, 5, 6, 7, 10]], ['dorienne', [0, 2, 3, 5, 7, 9, 10]]];

  function nommer(notes) {   /* le nom de l'accord, en notes françaises ; la basse d'abord */
    if (!notes.length) return ['', '']; notes = notes.slice().sort(function (a, b) { return a - b; });
    var cl = []; notes.forEach(function (m) { var c = m % 12; if (cl.indexOf(c) < 0) cl.push(c); }); var basse = notes[0] % 12, liste = cl.map(function (c) { return NOTES[c]; }).join(' · ');
    if (cl.length === 1) return [NOTES[basse], notes.length > 1 ? 'à l’octave' : S.nom(notes[0])];
    if (cl.length === 2) { var iv = (cl.filter(function (c) { return c !== basse; })[0] - basse + 12) % 12; if (iv !== 7) return [NOTES[basse] + ', ' + INTERVALLES[iv], liste]; }
    var candidats = [basse].concat(cl.filter(function (c) { return c !== basse; }));
    for (var k = 0; k < candidats.length; k++) { var r = candidats[k], rel = cl.map(function (c) { return (c - r + 12) % 12; }).sort(function (a, b) { return a - b; }).join(',');
      for (var j = 0; j < ACCORDS.length; j++) if (ACCORDS[j][1].join(',') === rel) return [NOTES[r] + ACCORDS[j][0] + (r !== basse ? ', sur ' + NOTES[basse] : ''), liste]; }
    return [liste, cl.length + ' notes'];
  }

  M.definir('orgue', {
    nom: 'L’orgue à', accent: 'tirettes', sous: 'neuf sinus qu’on dose à la main', maniere: 'd’un Hammond',
    geste: 'Tire les tirettes vers le bas. Plaque un accord : l’écran le nomme. La cabine tourne, lente ou rapide.',
    monter: function (corps, voie) {
      var etat = { tirettes: [8, 8, 8, 0, 0, 0, 0, 0, 0], perc: 1, percH: 0, percD: 0, vib: 0, cabine: 1, octave: 0, tenue: false, gamme: 0, tonique: 0, courbure: 0, clic: 1 };
      var voix = {}, tenues = {}, gardees = {}, G = null, onde = null;

      /* ── le son ── */
      function graphe() {
        if (G) return G; var c = S.ouvrir(), g = G = {};
        g.somme = c.createGain(); g.somme.gain.value = .13;
        /* le vibrato / chœur : un retard de 4 ms qui ondule */
        g.sec = c.createGain(); g.mouille = c.createGain(); g.retard = c.createDelay(.05); g.retard.delayTime.value = .004; g.vLfo = c.createOscillator(); g.vLfo.frequency.value = 6.8; g.vProf = c.createGain(); g.vProf.gain.value = 0;
        g.vLfo.connect(g.vProf); g.vProf.connect(g.retard.delayTime); g.vLfo.start();
        g.somme.connect(g.sec); g.somme.connect(g.retard); g.retard.connect(g.mouille);
        /* un peu de grain : une courbe douce */
        g.grain = c.createWaveShaper(); var n = 1024, cb = new Float32Array(n); for (var i = 0; i < n; i++) { var x = i / (n - 1) * 2 - 1; cb[i] = Math.tanh(x * 1.6) / Math.tanh(1.6); } g.grain.curve = cb; g.grain.oversample = '2x';
        g.sec.connect(g.grain); g.mouille.connect(g.grain);
        /* la cabine : un rotor (un oscillateur lent) qui fait trembler le niveau, le panoramique et la hauteur */
        g.rotor = c.createOscillator(); g.rotor.frequency.value = .001; g.rotor.start();
        g.trem = c.createGain(); g.trem.gain.value = 1; g.tProf = c.createGain(); g.tProf.gain.value = 0; g.rotor.connect(g.tProf); g.tProf.connect(g.trem.gain);
        g.dop = c.createDelay(.02); g.dop.delayTime.value = .003; g.dProf = c.createGain(); g.dProf.gain.value = 0; g.rotor.connect(g.dProf); g.dProf.connect(g.dop.delayTime);
        g.pan = c.createStereoPanner ? c.createStereoPanner() : c.createGain(); g.pProf = c.createGain(); g.pProf.gain.value = 0; if (g.pan.pan) { g.rotor.connect(g.pProf); g.pProf.connect(g.pan.pan); }
        g.grain.connect(g.dop); g.dop.connect(g.trem); g.trem.connect(g.pan); g.pan.connect(voie.ouvrir());
        g.bruit = S.bruit(); reglerEffets(); refaireOnde(); return g;
      }
      function reglerEffets() {
        if (!G) return; var t = S.ctx.currentTime;
        G.sec.gain.setTargetAtTime(etat.vib === 1 ? 0 : 1, t, .02); G.mouille.gain.setTargetAtTime(etat.vib === 0 ? 0 : etat.vib === 1 ? 1 : .8, t, .02); G.vProf.gain.setTargetAtTime(etat.vib === 0 ? 0 : etat.vib === 1 ? .0007 : .0011, t, .05);
        /* l'inertie du rotor : il met plus d'une seconde à prendre sa vitesse, davantage à la perdre */
        var hz = [.001, .8, 6.6][etat.cabine], monte = hz > G.rotor.frequency.value; G.rotor.frequency.setTargetAtTime(hz, t, monte ? .7 : 1.3);
        var on = etat.cabine > 0; G.tProf.gain.setTargetAtTime(on ? .22 : 0, t, .3); G.pProf.gain.setTargetAtTime(on ? .55 : 0, t, .3); G.dProf.gain.setTargetAtTime(on ? .0005 : 0, t, .3);
      }
      function ampli(v) { return v <= 0 ? 0 : Math.pow(10, -(8 - v) * 3 / 20); }   /* un cran de tirette : trois décibels */
      function refaireOnde() {
        if (!S.ctx) return; var re = new Float32Array(18), im = new Float32Array(18), tout = 0; etat.tirettes.forEach(function (v, i) { im[RANGS[i]] = ampli(v); tout += ampli(v); });
        if (!tout) im[2] = 0; onde = S.ctx.createPeriodicWave(re, im, { disableNormalization: true });
        Object.keys(voix).forEach(function (m) { voix[m].osc.setPeriodicWave(onde); });
      }
      function jouer(m, force) {
        var c = S.ouvrir(); if (!c) return; var g = graphe(), t = c.currentTime, note = m + etat.octave * 12, f = S.freq(note);
        if (voix[m]) arreter(m, true);
        var seul = Object.keys(voix).length === 0, osc = c.createOscillator(), env = c.createGain(); osc.setPeriodicWave(onde); osc.frequency.value = f / 2; osc.detune.value = etat.courbure;
        env.gain.value = 0; env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(.42, t + .006); osc.connect(env); env.connect(g.somme); osc.start(t);
        voix[m] = { osc: osc, env: env };
        if (etat.clic) { var b = c.createBufferSource(), bg = c.createGain(), hp = c.createBiquadFilter(); b.buffer = g.bruit; hp.type = 'bandpass'; hp.frequency.value = 2600; hp.Q.value = .8; bg.gain.setValueAtTime(1.8 * (.5 + .5 * force), t); bg.gain.exponentialRampToValueAtTime(.002, t + .018); b.connect(hp); hp.connect(bg); bg.connect(g.somme); b.start(t, Math.random()); b.stop(t + .03); b.onended = function () { bg.disconnect(); }; }
        if (etat.perc && seul) {   /* la percussion ne frappe que la première note d'un accord, comme sur l'orgue */
          /* mesuré : l'ancienne chute (−60 dB en 0,2 s) ne s'entendait pas ; ici une constante de temps, courte (0,08 s) ou longue (0,3 s), et un niveau franc */
          var p = c.createOscillator(), pg = c.createGain(), d = etat.percD ? .3 : .08; p.frequency.value = f * (etat.percH ? 3 : 2); p.detune.value = etat.courbure; pg.gain.value = 0; pg.gain.setValueAtTime(0, t); pg.gain.linearRampToValueAtTime(1.5, t + .003); pg.gain.setTargetAtTime(0, t + .003, d); p.connect(pg); pg.connect(g.somme); p.start(t); p.stop(t + d * 7); p.onended = function () { pg.disconnect(); };
        }
      }
      function arreter(m, vite) {
        var v = voix[m]; if (!v || !S.ctx) return; delete voix[m]; var t = S.ctx.currentTime;
        if (v.env.gain.cancelAndHoldAtTime) v.env.gain.cancelAndHoldAtTime(t); else v.env.gain.cancelScheduledValues(t); v.env.gain.setTargetAtTime(0, t, vite ? .003 : .012); v.osc.stop(t + .12); v.osc.onended = function () { v.env.disconnect(); };
      }
      function noteOn(m, force) { tenues[m] = 1; delete gardees[m]; jouer(m, force); dire(); }
      function noteOff(m) { delete tenues[m]; if (etat.tenue) { gardees[m] = 1; setTimeout(function () { piano.allumer(m, true); }, 0); } else arreter(m); dire(); }   /* une note gardée par la tenue reste allumée */

      /* ── la façade ── */
      corps.classList.add('mu-orgue');
      var eNom = el('span', { class: 'grand' }), eNotes = el('span', { class: 'ligne' }), ePetit = el('span', { class: 'petit' });
      var rSvg = svg('svg', { viewBox: '0 0 360 96', 'aria-hidden': 'true', class: 'mu-orgue-registre' }), rBarres = [], rOnde = svg('path', { class: 'onde' });
      for (var i = 0; i < 9; i++) { var b = svg('rect', { class: 'barre', x: 4 + i * 13, width: 7, y: 0, height: 0 }); rBarres.push(b); rSvg.appendChild(b); }
      rSvg.appendChild(svg('line', { class: 'pale', x1: 0, y1: 88, x2: 122, y2: 88 })); rSvg.appendChild(svg('line', { class: 'pale', x1: 140, y1: 48, x2: 360, y2: 48 })); rSvg.appendChild(rOnde);
      var ecran = el('div', { class: 'mu-ecran', 'aria-live': 'polite' }, [ePetit, eNom, eNotes, rSvg]);
      function peindreRegistre() {
        etat.tirettes.forEach(function (v, i) { var h = v / 8 * 84; rBarres[i].setAttribute('y', 88 - h); rBarres[i].setAttribute('height', h); });
        var d = '', max = 0, pts = [], k; for (k = 0; k <= 110; k++) { var x = k / 110 * Math.PI * 4, y = 0; etat.tirettes.forEach(function (v, i) { y += ampli(v) * Math.sin(x * RANGS[i] / 2); }); pts.push(y); max = Math.max(max, Math.abs(y)); }
        pts.forEach(function (y, k) { d += (k ? 'L' : 'M') + (140 + k * 2).toFixed(1) + ' ' + (48 - (max ? y / max : 0) * 40).toFixed(1); }); rOnde.setAttribute('d', d);
        var nomReg = ''; REGISTRES.forEach(function (r) { if (r[1].join('') === etat.tirettes.join('')) nomReg = r[0] + ' · '; }); ePetit.textContent = nomReg + etat.tirettes.slice(0, 2).join('') + ' ' + etat.tirettes.slice(2, 6).join('') + ' ' + etat.tirettes.slice(6).join('');
      }
      function dire() { var l = Object.keys(voix).map(Number).map(function (m) { return m + etat.octave * 12; }), n = nommer(l); eNom.textContent = n[0] || 'silence'; eNom.classList.toggle('vide', !n[0]); eNotes.textContent = n[1] || 'plaque un accord'; }

      /* les neuf tirettes */
      var rangT = el('div', { class: 'mu-orgue-tirettes' }), tirettes = [];
      PIEDS.forEach(function (p, i) {
        var t = el('div', { class: 'mu-tirette ' + TEINTE[i], 'data-valeur': etat.tirettes[i], 'data-nom': String(etat.tirettes[i]), 'aria-label': 'Tirette ' + p }), api = M.tirette(t);
        t.addEventListener('ke:change', function (e) { etat.tirettes[i] = e.detail.valeur; t.firstElementChild.textContent = String(e.detail.valeur); refaireOnde(); peindreRegistre(); });
        tirettes.push({ n: t, api: api }); rangT.appendChild(el('div', { class: 'mu-orgue-t' }, [el('span', { class: 'pied', text: p }), t]));
      });
      function poserRegistre(r) { etat.tirettes = r.slice(); tirettes.forEach(function (t, i) { t.api.valeur(r[i]); t.n.firstElementChild.textContent = String(r[i]); }); refaireOnde(); peindreRegistre(); }
      var regs = el('div', { class: 'mu-orgue-regs' }); REGISTRES.forEach(function (r) { var b = el('button', { type: 'button', class: 'ke-btn petit', text: r[0] }); b.addEventListener('click', function () { poserRegistre(r[1]); }); regs.appendChild(b); });

      function bascule(nom, positions, valeur, sur, couchee) { var b = el('div', { class: 'mu-bascule' + (couchee ? ' couchee' : ''), 'data-positions': positions, 'data-valeur': valeur, 'aria-label': nom }); M.bascule(b); b.addEventListener('ke:change', function (e) { sur(e.detail.valeur); }); return el('div', { class: 'mu-orgue-org' }, [b, el('p', { class: 'mu-etiq', text: nom })]); }
      var bPerc = bascule('percussion', 'sans|avec', 1, function (v) { etat.perc = v; }), bPH = bascule('harmonique', 'deuxième|troisième', 0, function (v) { etat.percH = v; }), bPD = bascule('déclin', 'court|long', 0, function (v) { etat.percD = v; }), bClic = bascule('clic', 'sans|avec', 1, function (v) { etat.clic = v; });
      var bVib = bascule('vibrato', 'sans|vibrato|chœur', 0, function (v) { etat.vib = v; graphe(); reglerEffets(); });
      /* la cabine : son rotor tourne à l'écran seulement quand il tourne pour de vrai */
      var rotor = svg('svg', { viewBox: '0 0 60 60', class: 'mu-orgue-rotor', 'aria-hidden': 'true' }), aig = svg('line', { class: 'aig', x1: 30, y1: 30, x2: 30, y2: 6 }); rotor.appendChild(svg('circle', { class: 'voie', cx: 30, cy: 30, r: 24 })); rotor.appendChild(aig); rotor.appendChild(svg('circle', { class: 'axe', cx: 30, cy: 30, r: 2.5 }));
      var angle = 0, vitesse = 0, tourne = false, dernier = 0, calme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      function tourner(ts) {
        var dt = dernier ? Math.min(.05, (ts - dernier) / 1000) : 0; dernier = ts; var but = [0, .8, 6.6][etat.cabine]; vitesse += (but - vitesse) * dt / (but > vitesse ? .7 : 1.3); angle += vitesse * dt * 360;
        aig.setAttribute('transform', 'rotate(' + (angle % 360).toFixed(1) + ' 30 30)');
        if ((vitesse > .02 || but > 0) && Object.keys(voix).length + (S.horloge.joue ? 1 : 0) > 0 || vitesse > .05 && but === 0) requestAnimationFrame(tourner); else { tourne = false; dernier = 0; }
      }
      function lancerRotor() { if (!tourne && !calme) { tourne = true; requestAnimationFrame(tourner); } }
      var bCab = bascule('la cabine', 'arrêt|lente|rapide', 1, function (v) { etat.cabine = v; graphe(); reglerEffets(); lancerRotor(); });
      bCab.insertBefore(rotor, bCab.firstChild);

      /* la gamme : un point sur les touches */
      var sG = el('div', { class: 'mu-selecteur', 'data-positions': GAMMES.map(function (g) { return g[0]; }).join('|'), 'data-valeur': '0', 'aria-label': 'Gamme' }), sT = el('div', { class: 'mu-selecteur', 'data-positions': NOTES.join('|'), 'data-court': 'do|·|ré|·|mi|fa|·|sol|·|la|·|si', 'data-valeur': '0', 'aria-label': 'Tonique' });
      M.selecteur(sG); M.selecteur(sT);
      function poserGamme() { piano.gamme(GAMMES[etat.gamme][1].map(function (d) { return (d + etat.tonique) % 12; })); }
      sG.addEventListener('ke:change', function (e) { etat.gamme = e.detail.valeur; poserGamme(); }); sT.addEventListener('ke:change', function (e) { etat.tonique = e.detail.valeur; poserGamme(); });

      /* le clavier maître */
      var cl = el('div', { 'aria-label': 'Clavier de l’orgue, soixante et une touches' }), piano = M.piano(cl, { de: 36, a: 96, surNote: noteOn, surFin: noteOff });
      var mH = el('div', { 'aria-label': 'Molette de hauteur' }), mM = el('div', { 'aria-label': 'Molette d’expression' }); M.molette(mH, { retour: true }); M.molette(mM, {});
      mH.addEventListener('ke:change', function (e) { etat.courbure = e.detail.valeur * 200; Object.keys(voix).forEach(function (m) { voix[m].osc.detune.setTargetAtTime(etat.courbure, S.ctx.currentTime, .01); }); });
      mM.addEventListener('ke:change', function (e) { graphe(); G.somme.gain.setTargetAtTime(.13 * (1 - e.detail.valeur * .85), S.ctx.currentTime, .03); });
      var bOct = bascule('octave', '−1|0|+1', 1, function (v) { etat.octave = v - 1; }, true);
      var bTenue = el('button', { type: 'button', class: 'ke-btn petit', 'aria-pressed': 'false', text: 'la tenue' });
      bTenue.addEventListener('click', function () { etat.tenue = !etat.tenue; bTenue.setAttribute('aria-pressed', String(etat.tenue)); if (!etat.tenue) { Object.keys(gardees).forEach(function (m) { if (!tenues[m]) { arreter(+m); piano.allumer(+m, false); } }); gardees = {}; dire(); } });
      var bSilence = el('button', { type: 'button', class: 'ke-btn petit discret', text: 'tout lâcher' });
      bSilence.addEventListener('click', function () { Object.keys(voix).forEach(function (m) { arreter(+m); piano.allumer(+m, false); }); gardees = {}; dire(); });

      corps.appendChild(el('div', { class: 'mu-rangee' }, [
        M.bloc('Les tirettes', [rangT, regs], 'mu-orgue-btirettes'),
        M.bloc('L’accord', [ecran], 'large'),
        M.bloc('La percussion', [el('div', { class: 'mu-orgue-pile' }, [bPerc, bPH, bPD])]),
        M.bloc('Le vibrato', [el('div', { class: 'mu-orgue-pile' }, [bVib, bClic])]),
        M.bloc('La cabine', [bCab]),
        M.bloc('La gamme', [el('div', { class: 'mu-orgue-gamme' }, [el('div', {}, [sG, el('p', { class: 'mu-etiq', text: 'gamme' })]), el('div', {}, [sT, el('p', { class: 'mu-etiq', text: 'tonique' })])])])]));
      corps.appendChild(el('div', { class: 'mu-rangee mu-orgue-bas' }, [
        M.bloc('', [el('div', { class: 'mu-orgue-gauche' }, [el('div', { class: 'mu-orgue-molettes' }, [el('div', {}, [mH, el('p', { class: 'mu-etiq', text: 'hauteur' })]), el('div', {}, [mM, el('p', { class: 'mu-etiq', text: 'pédale' })])]), el('div', { class: 'mu-orgue-mots' }, [bOct, bTenue, bSilence])])]),
        M.bloc('', [cl], 'large')]));
      peindreRegistre(); dire();
      corps.addEventListener('pointerdown', function () { setTimeout(lancerRotor, 50); }, true);

      var ordi = {};
      return {
        toucheClavier: function (k, force) { var m = 60 + k; ordi[k] = m; piano.allumer(m, true); noteOn(m, force); lancerRotor(); },
        relacheClavier: function (k) { var m = ordi[k]; if (m === undefined) return; delete ordi[k]; if (!etat.tenue) piano.allumer(m, false); noteOff(m); },
        octave: function (d) { etat.octave = borne(etat.octave + d, -1, 1); bOct.firstChild._mu.valeur(etat.octave + 1); }
      };
    }
  });
})();
