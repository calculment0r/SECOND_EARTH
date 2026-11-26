/* KIT ÉTUDE · LA BOÎTE À BOUCLES (id « groove »), à la manière d'une MPC ou d'une groovebox : seize pads sensibles à la force, un écran
   en lettres qui montre la vraie forme d'onde du pad tenu, quatre encodeurs, huit pistes de pas visibles à la fois (seize en tout),
   la répétition de note, l'enregistrement pendant la lecture, un motif d'une, deux ou quatre mesures. Elle suit l'horloge commune.
   Chaque son est fabriqué en Web Audio : aucun fichier. Les jetons du kit, aucune couleur écrite. */
(function () {
  'use strict';
  var KE = window.KitEtude, S = KE.son, M = KE.musique; if (!M) return;
  var el = M.el, svg = M.svg, H = S.horloge;
  var V = M.percus;   /* les voix : musique-percus.js, communes aux trois instruments */

  function borne(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function ton(r) { return borne(.5 + r.h / 24, 0, 1); }
  /* seize pads : huit percussions, puis des notes, des accords et des effets, tous en la mineur */
  var PADS = [
    { nom: 'grosse caisse', c: 45, j: function (c, d, t, v, r) { return V.grosse(c, d, t, v, { ton: ton(r), chute: r.c }); } },
    { nom: 'caisse claire', c: 55, j: function (c, d, t, v, r) { return V.claire(c, d, t, v, { ton: ton(r), claquant: r.c }); } },
    { nom: 'charleston', c: 30, j: function (c, d, t, v, r) { return V.charley(c, d, t, v, { ton: ton(r), chute: r.c }); } },
    { nom: 'charleston ouvert', c: 45, j: function (c, d, t, v, r) { return V.charley(c, d, t, v, { ouvert: true, ton: ton(r), chute: r.c }); } },
    { nom: 'mains', c: 40, j: function (c, d, t, v, r) { return V.mains(c, d, t, v, { chute: r.c }); } },
    { nom: 'tom', c: 45, j: function (c, d, t, v, r) { return V.tom(c, d, t, v, { base: 112, ton: ton(r), chute: r.c }); } },
    { nom: 'bord de caisse', c: 30, j: function (c, d, t, v, r) { return V.bord(c, d, t, v, { ton: ton(r) }); } },
    { nom: 'maracas', c: 30, j: function (c, d, t, v) { return V.maracas(c, d, t, v); } },
    { nom: 'basse, la', c: 40, f: 70, j: function (c, d, t, v, r) { return V.basse(c, d, t, v, { note: 33 + r.h, chute: r.c, filtre: .55, mordant: .4 }); } },
    { nom: 'basse, mi', c: 40, f: 70, j: function (c, d, t, v, r) { return V.basse(c, d, t, v, { note: 40 + r.h, chute: r.c, filtre: .55, mordant: .4 }); } },
    { nom: 'accord, la mineur', c: 45, f: 72, e: 25, j: function (c, d, t, v, r) { return V.accord(c, d, t, v, { notes: [57, 60, 64, 67].map(function (m) { return m + r.h; }), chute: r.c, filtre: .7 }); } },
    { nom: 'accord, fa', c: 45, f: 72, e: 25, j: function (c, d, t, v, r) { return V.accord(c, d, t, v, { notes: [53, 57, 60, 64].map(function (m) { return m + r.h; }), chute: r.c, filtre: .7 }); } },
    { nom: 'piqué, la', c: 40, e: 35, j: function (c, d, t, v, r) { return V.pique(c, d, t, v, { note: 69 + r.h, chute: r.c }); } },
    { nom: 'piqué, mi', c: 40, e: 35, j: function (c, d, t, v, r) { return V.pique(c, d, t, v, { note: 76 + r.h, chute: r.c }); } },
    { nom: 'verre', c: 45, e: 40, j: function (c, d, t, v, r) { return V.verre(c, d, t, v, { note: 81 + r.h, chute: r.c }); } },
    { nom: 'souffle', c: 50, e: 30, j: function (c, d, t, v, r) { return V.vent(c, d, t, v, { chute: r.c, filtre: ton(r) }); } }
  ];
  var EXEMPLE = { 0: 'X.....x...X.....', 1: '....X.......X...', 2: 'x.x.X.x.x.x.X.x.', 3: '..............x.', 8: 'X..x..x.........', 9: '..........x..x..', 10: 'x...............', 12: '..x..x..x..x..x.' };
  function coupure(f) { return 170 * Math.pow(2, f * 6.9); }

  M.definir('groove', {
    nom: 'La boîte à', accent: 'boucles', sous: 'seize pads, huit pistes', maniere: 'd’une MPC',
    geste: 'Frappe un pad : près du centre, plus fort. Tiens-le avec « répéter » pour un roulement. « Enregistrer », puis « Lire » : ce que tu frappes se pose sur le pas le plus proche. Les touches de l’ordinateur frappent aussi les pads.',
    monter: function (corps, voie) {
      var NB = 16, pat = [], regs = [], tenu = 0, page = 0, mes = 1, mesVue = 0, repete = 0, enreg = false, pile = [], tenus = {}, saute = {}, bus = null, echo = null, robinet = null, minuterie = 0, lignes = [], pasIci = -1;
      PADS.forEach(function (p, i) { regs.push({ h: 0, c: (p.c === undefined ? 45 : p.c) / 100, f: (p.f === undefined ? 100 : p.f) / 100, e: (p.e || 0) / 100 }); var l = []; for (var s = 0; s < 64; s++) { var ch = EXEMPLE[i] ? EXEMPLE[i].charAt(s % 16) : '.'; l.push(ch === 'X' ? 1 : ch === 'x' ? .62 : 0); } pat.push(l); });
      function longueur() { return mes * 16; }
      function memoire() { pile.push(JSON.stringify({ pat: pat, mes: mes })); if (pile.length > 60) pile.shift(); bAnnuler.disabled = false; }

      /* ── le son ── */
      function sortie() {
        if (bus) return bus; var e = voie.ouvrir(); if (!e) return null; var c = S.ctx;
        bus = c.createGain(); bus.gain.value = .85; bus.connect(e);
        var entree = c.createGain(), retard = c.createDelay(2), retour = c.createGain(), doux = c.createBiquadFilter(), mouille = c.createGain();
        retard.delayTime.value = Math.min(1.9, H.duree() * 3); retour.gain.value = .36; doux.type = 'lowpass'; doux.frequency.value = 2600; mouille.gain.value = .7;
        entree.connect(retard); retard.connect(doux); doux.connect(retour); retour.connect(retard); retard.connect(mouille); mouille.connect(bus);
        echo = { entree: entree, retard: retard }; return bus;
      }
      document.addEventListener('ke:tempo', function () { if (echo) echo.retard.delayTime.setTargetAtTime(Math.min(1.9, H.duree() * 3), S.ctx.currentTime, .05); });
      function frapper(i, t, v) {
        var d = sortie(); if (!d) return; var c = S.ctx, r = regs[i], lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(coupure(r.f), c.sampleRate * .45); lp.Q.value = .7 + (1 - r.f) * 3; lp.connect(d);
        var env = null; if (r.e > .01) { env = c.createGain(); env.gain.value = r.e * .8; lp.connect(env); env.connect(echo.entree); }
        if ((i === 2 || i === 3) && robinet) { robinet(t); robinet = null; }
        var x = PADS[i].j(c, lp, t, v, r), fin = typeof x === 'number' ? x : x.fin; if (i === 3) robinet = x.etouffe;
        setTimeout(function () { lp.disconnect(); if (env) env.disconnect(); }, Math.max(0, (fin - c.currentTime) * 1000) + 400);
      }

      /* ── l'écran : le numéro en très grand, le nom, la vraie forme d'onde du pad (rendue hors ligne, sans rien faire sonner) ── */
      var num = el('span', { class: 'mu-groove-num' }), nom = el('span', { class: 'mu-groove-nom' }), etat = el('span', { class: 'petit' }), duree = el('span', { class: 'petit mu-groove-duree' });
      var onde = svg('svg', { viewBox: '0 0 480 110', preserveAspectRatio: 'none', 'aria-hidden': 'true' }), trace = svg('path', {}), sol = svg('path', { class: 'pale', d: 'M0 55H480' }); onde.appendChild(sol); onde.appendChild(trace);
      var ecran = el('div', { class: 'mu-ecran mu-groove-ecran', 'aria-live': 'polite' }, [num, el('div', { class: 'mu-groove-droite' }, [el('div', { class: 'mu-groove-qui' }, [el('div', {}, [el('span', { class: 'petit', text: 'le pad tenu' }), nom]), etat]), el('div', { class: 'mu-groove-onde' }, [onde, duree])])]);
      var jeton = 0, attente = 0;
      function dessiner() {
        clearTimeout(attente); attente = setTimeout(function () {
          var OC = window.OfflineAudioContext || window.webkitOfflineAudioContext; if (!OC) return; var mien = ++jeton, sr = 22050, c = new OC(1, Math.floor(sr * 1.6), sr), r = regs[tenu];
          var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(coupure(r.f), sr * .45); lp.connect(c.destination);
          try { PADS[tenu].j(c, lp, 0, .9, r); } catch (e) { return; }
          c.startRendering().then(function (buf) {
            if (mien !== jeton) return; var d = buf.getChannelData(0), fin = d.length - 1; while (fin > 200 && Math.abs(d[fin]) < .004) fin--; fin = Math.min(d.length, Math.floor(fin * 1.06) + 200);
            var N = 120, s = '', pas = fin / N, max = .001, cretes = []; for (var k = 0; k < N; k++) { var m = 0; for (var q = Math.floor(k * pas); q < (k + 1) * pas; q++) { var a = Math.abs(d[q] || 0); if (a > m) m = a; } cretes.push(m); if (m > max) max = m; }
            cretes.forEach(function (m, k) { var h = Math.max(.6, m / max * 50); s += 'M' + (k * 4 + 2) + ' ' + (55 - h).toFixed(1) + 'V' + (55 + h).toFixed(1); });
            trace.setAttribute('d', s); duree.textContent = (fin / sr).toFixed(2).replace('.', ',') + ' s';
          });
        }, 90);
      }
      function dire() {
        var n = 0, L = longueur(); for (var s = 0; s < L; s++) if (pat[tenu][s]) n++;
        num.textContent = ('0' + (tenu + 1)).slice(-2); nom.textContent = PADS[tenu].nom; etat.textContent = (n ? n + ' pas sur ' + L : 'aucun pas') + ' · mesure ' + (mesVue + 1) + ' sur ' + mes;
      }

      /* ── les pads ── */
      var zonePads = el('div', { class: 'mu-groove-pads', 'aria-label': 'Les seize pads' });
      var pads = M.pads(zonePads, { colonnes: 4, rangs: 4, noms: PADS.map(function (p) { return p.nom; }), surFrappe: function (i, f) { frappeMain(i, f); }, surFin: function (i) { lever(i); } });
      function tenir(i) {
        if (i === tenu && num.textContent) return; tenu = i; pads.pads.forEach(function (p, k) { p.classList.toggle('choisi', k === i); });
        var r = regs[i]; pH._api.valeur(r.h); pC._api.valeur(Math.round(r.c * 100)); pF._api.valeur(Math.round(r.f * 100)); pE._api.valeur(Math.round(r.e * 100));
        if (Math.floor(i / 8) !== page) { page = Math.floor(i / 8); bPage._mu.valeur(page); } peindrePistes(); dire(); dessiner();
      }
      function poserEnregistre(i, f) {
        var L = longueur(), pos = H.position(), k = Math.round(pos), s = ((k % L) + L) % L;
        pat[i][s] = f; if (k >= H.aVenir()) saute[k + ':' + i] = 1; peindrePistes(); dire();
      }
      function frappeMain(i, f) {
        tenir(i); frapper(i, S.ctx.currentTime + .003, f); tenus[i] = f;
        if (H.joue && enreg) { memoire(); poserEnregistre(i, f); }
        if (repete && !H.joue && !minuterie) minuterie = setInterval(function () { Object.keys(tenus).forEach(function (k) { frapper(+k, S.ctx.currentTime + .004, tenus[k]); pads.frappe(+k, 50); }); }, H.duree() * 1000 * [1, 1, 2 / 3, .5][repete]);
      }
      function lever(i) { delete tenus[i]; if (!Object.keys(tenus).length && minuterie) { clearInterval(minuterie); minuterie = 0; } }

      /* ── les encodeurs et les commandes ── */
      function regle(cle, k) { return function (x) { regs[tenu][cle] = x * k; dessiner(); }; }
      var pH = M.potard('hauteur', { min: -12, max: 12, valeur: 0, centre: true, nom: 'Hauteur, en demi-tons' }, regle('h', 1));
      var pC = M.potard('chute', { valeur: 45, nom: 'Chute' }, regle('c', .01));
      var pF = M.potard('filtre', { valeur: 100, nom: 'Filtre' }, regle('f', .01));
      var pE = M.potard('écho', { valeur: 0, nom: 'Envoi vers l’écho' }, function (x) { regs[tenu].e = x / 100; });
      var bRepete = el('div', { class: 'mu-bascule', 'data-positions': 'non|à la double|en triolet|à la triple', 'data-valeur': '0', 'aria-label': 'Répéter la note tant qu’on tient le pad' });
      bRepete.addEventListener('ke:change', function (e) { repete = e.detail.valeur; if (!repete && minuterie) { clearInterval(minuterie); minuterie = 0; } });
      var bLong = el('div', { class: 'mu-bascule', 'data-positions': 'une mesure|deux|quatre', 'data-valeur': '0', 'aria-label': 'Longueur du motif' });
      bLong.addEventListener('ke:change', function (e) {
        memoire(); var avant = mes; mes = [1, 2, 4][e.detail.valeur];
        if (mes > avant) pat.forEach(function (l) { var vide = true, s; for (s = avant * 16; s < mes * 16; s++) if (l[s]) vide = false; if (vide) for (s = avant * 16; s < mes * 16; s++) l[s] = l[s % (avant * 16)]; });   /* une mesure neuve reprend ce qui précède */
        if (mesVue >= mes) mesVue = 0; peindreMesures(); peindrePistes(); dire();
      });
      var voyant = el('span', { class: 'mu-voyant' }), bEnreg = el('button', { type: 'button', class: 'ke-btn petit', 'aria-pressed': 'false' }, [voyant, ' enregistrer']);
      bEnreg.addEventListener('click', function () { enreg = !enreg; bEnreg.setAttribute('aria-pressed', String(enreg)); voyant.classList.toggle('joue', enreg); });
      var bAnnuler = el('button', { type: 'button', class: 'ke-btn petit', text: 'annuler', disabled: '' });
      bAnnuler.addEventListener('click', function () { var x = pile.pop(); if (!x) return; x = JSON.parse(x); pat = x.pat; mes = x.mes; bLong._mu.valeur([1, 2, 4].indexOf(mes)); if (mesVue >= mes) mesVue = 0; bAnnuler.disabled = !pile.length; peindreMesures(); peindrePistes(); dire(); });
      var bVider = el('button', { type: 'button', class: 'ke-btn petit', text: 'vider la piste' });
      bVider.addEventListener('click', function () { memoire(); pat[tenu].fill(0); peindrePistes(); dire(); });

      corps.appendChild(el('div', { class: 'mu-rangee' }, [
        M.bloc('Les pads', [zonePads]),
        M.bloc('L’écran', [ecran, M.organes([pH, pC, pF, pE])], 'large mu-groove-centre'),
        M.bloc('Le jeu', [el('div', { class: 'mu-groove-jeu' }, [el('div', {}, [bRepete, el('p', { class: 'mu-etiq', text: 'répéter' })]), el('div', {}, [bLong, el('p', { class: 'mu-etiq', text: 'le motif' })]), el('div', { class: 'mu-groove-mots' }, [bEnreg, bAnnuler, bVider])])], 'mu-groove-jeubloc')]));
      M.bascule(bRepete); M.bascule(bLong);

      /* ── les pistes : huit rangées de seize pas, une mesure à la fois ── */
      var bPage = el('div', { class: 'mu-bascule couchee', 'data-positions': 'pads 1 à 8|pads 9 à 16', 'data-valeur': '0', 'aria-label': 'Les pistes montrées' });
      bPage.addEventListener('ke:change', function (e) { page = e.detail.valeur; peindrePistes(); });
      var zMes = el('div', { class: 'mu-groove-mesures', role: 'group', 'aria-label': 'La mesure montrée' }), bMes = [];
      for (var b = 0; b < 4; b++) (function (b) { var x = el('button', { type: 'button', class: 'ke-btn petit', 'aria-pressed': 'false', text: String(b + 1) }); x.addEventListener('click', function () { mesVue = b; peindreMesures(); peindrePistes(); dire(); }); bMes.push(x); zMes.appendChild(x); })(b);
      function peindreMesures() { bMes.forEach(function (x, b) { x.disabled = b >= mes; x.setAttribute('aria-pressed', b === mesVue ? 'true' : 'false'); }); }
      var numeros = el('div', { class: 'mu-pas-nums mu-groove-pas' }), nums = []; for (var s = 0; s < 16; s++) { var nn = el('span', { text: String(s + 1), style: 'grid-column:' + (s + 1 + Math.floor(s / 4)) }); nums.push(nn); numeros.appendChild(nn); }
      var pistes = el('div', { class: 'mu-groove-pistes' }, [el('div', { class: 'mu-pas-rang mu-groove-rang entete' }, [el('span', {}, [el('small', { text: 'mesure' }), zMes]), numeros])]);
      for (var r = 0; r < 8; r++) (function (r) {
        var bNom = el('button', { type: 'button', class: 'mu-groove-piste' }), z = el('div', { class: 'mu-groove-pas' });
        var api = M.pas(z, { n: 16, surChange: function (s, oui, e) { var p = page * 8 + r; memoire(); pat[p][mesVue * 16 + s] = oui ? (e && e.shiftKey ? 1 : .62) : 0; api.classe(s, 'fort', oui && e && e.shiftKey); pads.etat(p, 'on', pat[p].slice(0, longueur()).some(Boolean)); if (p === tenu) dire(); } });
        api.boutons.forEach(function (x, s) { x.style.gridColumn = String(s + 1 + Math.floor(s / 4)); });
        bNom.addEventListener('click', function () { tenir(page * 8 + r); });
        lignes.push({ api: api, nom: bNom, n: null }); var n = el('div', { class: 'mu-pas-rang mu-groove-rang' }, [el('span', {}, [bNom]), z]); lignes[r].n = n; pistes.appendChild(n);
      })(r);
      function peindrePistes() {
        lignes.forEach(function (l, r) {
          var p = page * 8 + r; l.nom.textContent = ''; l.nom.appendChild(el('b', { text: ('0' + (p + 1)).slice(-2) })); l.nom.appendChild(document.createTextNode(PADS[p].nom)); l.n.classList.toggle('tenue', p === tenu);
          for (var s = 0; s < 16; s++) { var v = pat[p][mesVue * 16 + s]; l.api.valeur(s, v > 0); l.api.classe(s, 'fort', v > .9); l.api.boutons[s].setAttribute('aria-label', PADS[p].nom + ', pas ' + (s + 1)); }
        });
        var L = longueur(); for (var p = 0; p < NB; p++) pads.etat(p, 'on', pat[p].slice(0, L).some(Boolean));
      }
      corps.appendChild(el('div', { class: 'mu-rangee' }, [M.bloc('Les pistes', [bPage, pistes], 'large')]));
      M.bascule(bPage);

      /* ── suivre l'horloge ── */
      function montrer(s) {
        if (pasIci >= 0) { lignes.forEach(function (l) { l.api.ici(-1); }); nums[pasIci % 16].classList.remove('ici'); }
        pasIci = s; if (s < 0) return; if (Math.floor(s / 16) !== mesVue) { mesVue = Math.floor(s / 16); peindreMesures(); peindrePistes(); dire(); }
        lignes.forEach(function (l) { l.api.ici(s % 16); }); nums[s % 16].classList.add('ici');
      }
      H.surPas(function (pas, quand, d) {
        if (minuterie) { clearInterval(minuterie); minuterie = 0; }
        var L = longueur(), s = pas % L, frappes = [], pris = false;
        for (var p = 0; p < NB; p++) {
          if (repete && tenus[p] !== undefined) {
            /* 1 : à la double croche · 2 : en triolet (trois coups par croche) · 3 : à la triple croche (deux coups par double croche) */
            if (repete === 2) { if (pas % 2 === 0) { frapper(p, quand, tenus[p]); frapper(p, quand + d * 2 / 3, tenus[p] * .8); } else frapper(p, quand + d / 3, tenus[p] * .8); }
            else { frapper(p, quand, tenus[p]); if (repete === 3) frapper(p, quand + d / 2, tenus[p] * .8); }
            frappes.push(p);
            if (enreg) { if (!pris) { pris = true; } pat[p][s] = tenus[p]; }
          } else if (pat[p][s]) { if (saute[pas + ':' + p]) delete saute[pas + ':' + p]; else { frapper(p, quand, pat[p][s]); frappes.push(p); } }
        }
        H.aLInstant(quand, function () { if (!H.joue) return; montrer(s); frappes.forEach(function (p) { pads.frappe(p, 70); }); if (pris) { peindrePistes(); dire(); } });
      });
      document.addEventListener('ke:horloge', function (e) { if (!e.detail.joue) { montrer(-1); saute = {}; } });

      peindreMesures(); tenir(0);
      return { toucheClavier: function (k, v) { if (k < NB) pads.frapper(k, v); }, relacheClavier: function (k) { if (k < NB) pads.lever(k); } };
    }
  });
})();
