/* KIT ÉTUDE · LA LIGNE DE BASSE — un séquenceur de seize pas, une seule voix, un filtre résonant qui couine.
   L'archétype de la boîte à basses acide, redessiné : chaque pas a sa note, son octave, son accent, son glissé ou son silence.
   Elle suit l'horloge commune (KitEtude.son.horloge). Le glissé lie deux pas : la hauteur glisse, les contours ne repartent pas. */
(function () {
  'use strict';
  var KE = window.KitEtude, S = KE.son, M = KE.musique, H = S.horloge;
  var NOTES = ['do', 'do♯', 'ré', 'ré♯', 'mi', 'fa', 'fa♯', 'sol', 'sol♯', 'la', 'la♯', 'si', 'do'];
  function tenir(p, t) { if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t); else { var v = p.value; p.cancelScheduledValues(t); p.setValueAtTime(v, t); } }

  var scope = function (path, an, W, H, periode) { return S.oscillo(path, an, W, H, periode); };   /* l'oscilloscope du socle, calé sur deux périodes de la note */

  M.definir('acide', {
    nom: 'La ligne de basse', sous: 'seize pas, un filtre qui couine', maniere: 'de la TB-303',
    geste: 'Tire une note dans sa colonne, ou les flèches. Dessous : l’octave, l’accent, le glissé, le silence. « Lire », en haut de la page, la fait tourner.',
    monter: function (corps, voie, M) {
      var el = M.el, svg = M.svg;
      var P = { accord: 0, coupure: 38, reso: 78, env: 62, chute: 42, accent: 70, forme: 0, volume: 70 };
      /* le motif d'exemple : note (0 à 12 depuis le do), octave (−1, 0, 1), accent, glissé, joué */
      var MOTIF = [[0, 0, 1, 0, 1], [0, 0, 0, 0, 1], [12, 0, 0, 1, 1], [0, 0, 0, 0, 1], [3, 0, 1, 0, 1], [0, 0, 0, 0, 0], [10, 0, 0, 1, 1], [12, 0, 1, 0, 1],
        [0, -1, 0, 0, 1], [7, 0, 0, 0, 1], [0, 0, 0, 0, 1], [12, 1, 1, 1, 1], [3, 1, 0, 0, 1], [0, 0, 0, 0, 0], [10, 0, 1, 1, 1], [5, 0, 0, 0, 1]];
      var pas = MOTIF.map(function (m) { return { n: m[0], o: m[1], acc: m[2], gl: m[3], on: m[4] }; });
      var G = null, colonnes = [], octs = [], rAcc, rGl, rOn, oscillo = null, lie = false, ici = -1;
      corps.classList.add('mu-acide');

      /* ── le son ── */
      function graphe() {
        if (G) return G; var c = S.ouvrir(), sortie = voie.ouvrir(); if (!c) return null;
        G = { c: c, osc: c.createOscillator(), pre: c.createGain(), f1: c.createBiquadFilter(), f2: c.createBiquadFilter(), sat: c.createWaveShaper(), vca: c.createGain(), vol: c.createGain(), hp: c.createBiquadFilter() };
        var courbe = new Float32Array(513); for (var k = 0; k < 513; k++) { var x = k / 256 - 1; courbe[k] = Math.tanh(x * 2.4) / Math.tanh(2.4); } G.sat.curve = courbe; G.sat.oversample = '2x';
        G.osc.type = 'sawtooth'; G.pre.gain.value = .55; G.f1.type = G.f2.type = 'lowpass'; G.f1.Q.value = .7; G.vca.gain.value = 0; G.hp.type = 'highpass'; G.hp.frequency.value = 38;
        G.osc.connect(G.pre); G.pre.connect(G.f1); G.f1.connect(G.f2); G.f2.connect(G.sat); G.sat.connect(G.hp); G.hp.connect(G.vca); G.vca.connect(G.vol); G.vol.connect(sortie); G.osc.start(); G.vol.gain.value = P.volume / 100 * .34; G.f1.frequency.value = G.f2.frequency.value = fBase();
        regler(); if (voie.analyseur) oscillo = scope(trace, voie.analyseur, 300, 60, function () { return 1 / G.osc.frequency.value; }); return G;
      }
      function fBase() { return 70 * Math.pow(2, P.coupure / 100 * 6.2); }
      function regler() { if (!G) return; var t = G.c.currentTime; G.osc.type = P.forme ? 'square' : 'sawtooth'; G.pre.gain.setTargetAtTime(P.forme ? .4 : .55, t, .01); G.vol.gain.setTargetAtTime(P.volume / 100 * .34, t, .02); if (!H.joue) { [G.f1, G.f2].forEach(function (b) { b.frequency.setTargetAtTime(fBase(), t, .03); }); G.f2.Q.setTargetAtTime(1 + P.reso / 100 * 19, t, .03); } }
      function midi(p) { return 36 + P.accord + p.n + p.o * 12; }
      /* une note : quand, combien de temps, accentuée ou non, liée à la précédente ou non */
      function note(p, quand, duree, liee, tenue) {
        var f = S.freq(midi(p)), acc = p.acc ? P.accent / 100 : 0, base = fBase(), chute = p.acc ? .09 + .12 * (1 - acc) : .06 + Math.pow(P.chute / 100, 2) * 1.6;
        if (liee) G.osc.frequency.setTargetAtTime(f, quand, .028); else G.osc.frequency.setValueAtTime(f, quand);
        var crete = Math.min(17000, base * Math.pow(2, P.env / 100 * 4.6 + acc * 1.4));
        G.f2.Q.setTargetAtTime(1 + P.reso / 100 * 19 + acc * 6, quand, .004);
        if (!liee) {
          [G.f1, G.f2].forEach(function (b) { tenir(b.frequency, quand); b.frequency.setTargetAtTime(crete, quand, .003); b.frequency.setTargetAtTime(base, quand + .012, chute / 3); });
          tenir(G.vca.gain, quand); G.vca.gain.setTargetAtTime(.62 + acc * .38, quand, .003);
        } else if (p.acc) { [G.f1, G.f2].forEach(function (b) { tenir(b.frequency, quand); b.frequency.setTargetAtTime(crete * .7, quand, .01); b.frequency.setTargetAtTime(base, quand + .03, chute / 3); }); }
        if (!tenue) G.vca.gain.setTargetAtTime(0, quand + duree * .56, .012);          /* la porte se ferme un peu après la moitié du pas ; un glissé la tient jusqu'au pas suivant */
      }
      var arret = H.surPas(function (n, quand, d) {
        var i = n % 16, p = pas[i]; if (!graphe()) return;
        if (p.on) { note(p, quand, d, lie, !!p.gl && pas[(i + 1) % 16].on); lie = !!p.gl; if (oscillo) H.aLInstant(quand, oscillo.reveiller); } else { lie = false; }
        H.aLInstant(quand, function () { if (H.joue) montrer(i); });
      });
      document.addEventListener('ke:horloge', function (e) { if (!e.detail.joue) { montrer(-1); lie = false; if (G) { tenir(G.vca.gain, G.c.currentTime); G.vca.gain.setTargetAtTime(0, G.c.currentTime, .02); } } });
      function essayer(p) { if (H.joue || !graphe()) return; var t = G.c.currentTime + .005; note(p, t, .22, false, false); if (oscillo) oscillo.reveiller(); }

      /* ── la façade ── */
      function montrer(i) {
        if (ici >= 0) colonnes[ici].classList.remove('ici'); ici = i; if (i >= 0) colonnes[i].classList.add('ici');
        [rAcc, rGl, rOn].forEach(function (r) { r.ici(i); }); nums.forEach(function (x, k) { x.classList.toggle('ici', k === i); });
        lu.children[1].textContent = i >= 0 && pas[i].on ? NOTES[pas[i].n] : '—'; lu.children[2].textContent = i >= 0 ? 'pas ' + (i + 1) + (pas[i].acc ? ' · accent' : '') + (pas[i].gl ? ' · glissé' : '') : 'à l’arrêt';
      }
      function peindre(i) {
        var p = pas[i], c = colonnes[i]; c.style.setProperty('--n', p.n); c.classList.toggle('muet', !p.on); c.classList.toggle('fort', !!p.acc);
        c.setAttribute('aria-valuenow', p.n); c.setAttribute('aria-valuetext', NOTES[p.n] + (p.on ? '' : ', silence')); c.lastChild.textContent = NOTES[p.n];
        octs[i].textContent = p.o > 0 ? 'haut' : p.o < 0 ? 'bas' : '·'; octs[i].classList.toggle('pose', p.o !== 0); octs[i].setAttribute('aria-label', 'Octave du pas ' + (i + 1) + ' : ' + (p.o > 0 ? 'haute' : p.o < 0 ? 'basse' : 'médiane'));
        rAcc.valeur(i, !!p.acc); rGl.valeur(i, !!p.gl); rOn.valeur(i, !!p.on); lier();
      }
      /* les glissés : un trait fin de la note à la suivante, dessiné par-dessus la portée */
      function lier() {
        var r = grille.getBoundingClientRect(); if (!r.width) return; fils.setAttribute('viewBox', '0 0 ' + r.width + ' ' + r.height); while (fils.firstChild) fils.removeChild(fils.firstChild);
        colonnes.forEach(function (c, i) {
          var p = pas[i], q = pas[i + 1]; if (!q || !p.gl || !p.on || !q.on) return; var a = c.getBoundingClientRect(), b = colonnes[i + 1].getBoundingClientRect(), h = r.height / 13;
          var x1 = a.right - r.left - 2, y1 = r.height - (p.n + .5) * h, x2 = b.left - r.left + 2, y2 = r.height - (q.n + .5) * h, m = (x1 + x2) / 2;
          fils.appendChild(svg('path', { d: 'M' + (x1 - a.width * .25) + ' ' + y1 + 'L' + x1 + ' ' + y1 + 'C' + (m + 6) + ' ' + y1 + ' ' + (m - 6) + ' ' + y2 + ' ' + x2 + ' ' + y2 + 'L' + (x2 + b.width * .25) + ' ' + y2 }));
        });
      }
      var fils = svg('svg', { class: 'mu-acide-fils', 'aria-hidden': 'true' });
      window.addEventListener('resize', lier); if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(lier, 50); });
      var grille = el('div', { class: 'mu-acide-grille q16' }), echelle = el('div', { class: 'mu-acide-echelle', 'aria-hidden': 'true' }), nums = [];
      for (var k = 12; k >= 0; k--) echelle.appendChild(el('span', { class: S.noire(k) ? 'noire' : null, text: S.noire(k) ? '' : NOTES[k] }));
      pas.forEach(function (p, i) {
        var c = el('div', { class: 'mu-acide-col', tabindex: '0', role: 'slider', 'aria-orientation': 'vertical', 'aria-valuemin': 0, 'aria-valuemax': 12, 'aria-label': 'Note du pas ' + (i + 1) }, [el('i'), el('u'), el('b')]);
        function poser(n, son) { n = Math.max(0, Math.min(12, Math.round(n))); if (n === p.n && p.on) return; p.n = n; p.on = 1; peindre(i); if (son) essayer(p); }
        function lire(e) { var r = c.getBoundingClientRect(); return 12 - Math.floor((e.clientY - r.top) / r.height * 13); }
        KE.outils.tirer(c, function (e) { S.ouvrir(); c.focus({ preventScroll: true }); poser(lire(e), true); return {}; }, function (e) { poser(lire(e), true); });
        c.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowUp') poser(p.n + 1, true); else if (e.key === 'ArrowDown') poser(p.n - 1, true); else if (e.key === 'ArrowRight' && colonnes[i + 1]) colonnes[i + 1].focus(); else if (e.key === 'ArrowLeft' && colonnes[i - 1]) colonnes[i - 1].focus();
          else if (e.key === ' ' || e.key === 'Enter') { p.on = p.on ? 0 : 1; peindre(i); if (p.on) essayer(p); } else if (e.key === 'a' || e.key === 'A') { p.acc = p.acc ? 0 : 1; peindre(i); } else if (e.key === 'g' || e.key === 'G') { p.gl = p.gl ? 0 : 1; peindre(i); } else return; e.preventDefault();
        });
        colonnes.push(c); grille.appendChild(c);
        var o = el('button', { type: 'button', class: 'mu-acide-oct' }); o.addEventListener('click', function () { p.o = p.o === 0 ? 1 : p.o === 1 ? -1 : 0; peindre(i); essayer(p); }); octs.push(o);
        var nu = el('span', { text: String(i + 1) }); nums.push(nu);
      });
      var numsEl = el('div', { class: 'mu-pas-nums q16' }, nums), octEl = el('div', { class: 'mu-acide-octs q16' }, octs);
      function rang(nom, sous, cle) { var r = el('div'); var api = M.pas(r, { n: 16, nom: nom, valeurs: pas.map(function (p) { return p[cle]; }), surChange: function (i, oui) { pas[i][cle] = oui ? 1 : 0; peindre(i); } }); api.el = r; api.rang = el('div', { class: 'mu-pas-rang' }, [el('span', {}, [nom, el('small', { text: sous })]), r]); return api; }
      rAcc = rang('accent', 'plus fort, plus aigu', 'acc'); rGl = rang('glissé', 'lié au suivant', 'gl'); rOn = rang('joué', 'sinon, silence', 'on');

      var trace = svg('path', {}), lu = el('div', { class: 'mu-ecran mu-acide-ecran', 'aria-live': 'off' }, [el('span', { class: 'petit', text: 'la note' }), el('span', { class: 'grand', text: '—' }), el('span', { class: 'ligne', text: 'à l’arrêt' }), (function () { var s = svg('svg', { viewBox: '0 0 300 60', 'aria-hidden': 'true' }); s.appendChild(trace); return s; })()]);
      trace.setAttribute('d', 'M0 30L300 30');
      function pot(etiq, cle, a) { a = a || {}; var p = M.potard(etiq, { min: a.min === undefined ? 0 : a.min, max: a.max === undefined ? 100 : a.max, pas: 1, valeur: P[cle], centre: a.centre, nom: a.nom || etiq }, function (v) { P[cle] = v; regler(); }); p.style.setProperty('--d', (a.d || 112) + 'px'); return p; }
      var forme = el('div', { class: 'mu-bascule', 'data-positions': 'dent de scie|carré', 'data-valeur': 0, 'aria-label': 'Forme d’onde' }); M.bascule(forme); forme.addEventListener('ke:change', function (e) { P.forme = e.detail.valeur; regler(); });
      var hasard = el('button', { type: 'button', class: 'ke-btn petit', text: 'hasard' }), vider = el('button', { type: 'button', class: 'ke-btn petit', text: 'vider' }), exemple = el('button', { type: 'button', class: 'ke-btn petit', text: 'le motif d’exemple' });
      var GAMME = [0, 0, 0, 3, 5, 7, 10, 12, 12];
      hasard.addEventListener('click', function () { pas.forEach(function (p, i) { p.n = GAMME[Math.floor(Math.random() * GAMME.length)]; p.o = Math.random() < .14 ? 1 : Math.random() < .12 ? -1 : 0; p.on = Math.random() < .82 ? 1 : 0; p.acc = Math.random() < .3 ? 1 : 0; p.gl = Math.random() < .26 ? 1 : 0; peindre(i); }); });
      vider.addEventListener('click', function () { pas.forEach(function (p, i) { p.n = 0; p.o = 0; p.on = 0; p.acc = 0; p.gl = 0; peindre(i); }); });
      exemple.addEventListener('click', function () { MOTIF.forEach(function (m, i) { var p = pas[i]; p.n = m[0]; p.o = m[1]; p.acc = m[2]; p.gl = m[3]; p.on = m[4]; peindre(i); }); });

      corps.appendChild(el('div', { class: 'mu-rangee' }, [
        M.bloc('Le son', [el('div', { class: 'mu-acide-son' }, [lu, el('div', { class: 'mu-acide-forme' }, [forme, el('p', { class: 'mu-etiq', text: 'forme d’onde' })])])]),
        M.bloc('Le filtre', [el('div', { class: 'mu-acide-pots' }, [pot('accord', 'accord', { min: -12, max: 12, centre: true }), pot('coupure', 'coupure'), pot('résonance', 'reso'), pot('enveloppe', 'env'), pot('chute', 'chute'), pot('accent', 'accent')])], 'large'),
        M.bloc('Sortie', [pot('volume', 'volume', { d: 88 })])
      ]));
      corps.appendChild(el('div', { class: 'mu-rangee' }, [M.bloc('Le motif', [
        el('div', { class: 'mu-pas-rang' }, [el('span'), numsEl]),
        el('div', { class: 'mu-pas-rang mu-acide-portee' }, [echelle, grille]),
        el('div', { class: 'mu-pas-rang' }, [el('span', {}, ['octave', el('small', { text: 'bas, médiane, haut' })]), octEl]),
        rAcc.rang, rGl.rang, rOn.rang,
        el('div', { class: 'mu-acide-mots' }, [hasard, vider, exemple])
      ], 'large')]));
      grille.appendChild(fils); pas.forEach(function (p, i) { peindre(i); }); setTimeout(lier, 0);
      var focusCol = function () { var a = document.activeElement; return colonnes.indexOf(a); };
      return {
        toucheClavier: function (k) { var i = focusCol(); if (k > 12) k -= 12; if (i >= 0) { pas[i].n = k; pas[i].on = 1; peindre(i); essayer(pas[i]); if (colonnes[i + 1]) colonnes[i + 1].focus(); } else essayer({ n: k, o: 0, acc: 0, gl: 0, on: 1 }); },
        relacheClavier: function () {}, arreter: arret
      };
    }
  });
})();
