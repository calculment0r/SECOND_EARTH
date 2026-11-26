/* KIT ÉTUDE · le son. Un seul contexte audio pour toute la page, ouvert au premier geste (rien ne sonne sans la main).
   window.KitEtude.son :
     ouvrir()                 → le contexte (créé et réveillé ; à appeler dans un geste : pointerdown, keydown, click)
     ctx                      → le contexte, ou null tant que rien n'a été touché
     voie(nom)                → { entree, analyseur, niveau(0..1), muet(bool), etalon(x) } : l'entrée d'un instrument vers la sortie générale ;
                                 entree → étalon (le niveau d'aplomb de l'instrument, fixé une fois) → niveau et muet → analyseur → général
     maitre                   → { analyseur, niveau(0..1) } après ouverture ; le général passe par un compresseur doux, puis un limiteur
                                 et un écrêtage arrondi : la sortie ne dépasse jamais −1 dBFS, tous les instruments joués ensemble
     horloge                  → le tempo commun à tous les instruments (doubles croches) :
                                 .tempo(bpm?) .balance(0..0.6?) .jouer() .arreter() .joue
                                 .surPas(fn(pas, quand, duree)) → une fonction qui désabonne ; pas = 0, 1, 2… depuis « jouer »
                                 .duree()          → la durée d'une double croche, en secondes
                                 .position()       → où en est la lecture, en doubles croches (continu : 12,4 = un peu après le pas 12) ; −1 à l'arrêt
                                 .aVenir()         → le premier pas pas encore programmé (l'horloge programme ~120 ms d'avance)
                                 .aLInstant(quand, fn) → appelle fn au moment où le son programmé à « quand » se fait entendre (pour l'affichage)
     freq(midi)  nom(midi)    → la fréquence ; le nom français (« la 3 », « do dièse 4 »)
     bruit(secondes?)         → un tampon de bruit blanc
     env(param, quand, { a, d, s, r, crete, tenue })  → une enveloppe sur un AudioParam ; rend l'instant de fin
     niveau(analyseur)        → le niveau instantané 0..1 (pour un vu-mètre)
     oscillo(svgPath, analyseur, largeur, hauteur, periode?)
                              → dessine la forme d'onde dans un <path> tant que ça sonne, calée sur un passage à zéro ; la fenêtre couvre
                                deux périodes de la note (periode : une fonction qui rend la période en secondes, ou { periode, periodes }) ;
                                sans periode, elle la cherche dans le signal. Rend { reveiller(), stop() }
   Tout est fait de la seule Web Audio API : aucun échantillon, aucun fichier. */
(function () {
  'use strict';
  var KE = window.KitEtude = window.KitEtude || {};
  var S = KE.son = { ctx: null, maitre: null };
  var voies = {}, general, compresseur;

  S.ouvrir = function () {
    if (!S.ctx) {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      S.ctx = new AC({ latencyHint: 'interactive' });
      general = S.ctx.createGain(); general.gain.value = .8;
      compresseur = S.ctx.createDynamicsCompressor(); compresseur.threshold.value = -14; compresseur.knee.value = 8; compresseur.ratio.value = 3; compresseur.attack.value = .006; compresseur.release.value = .18;
      /* le limiteur, puis un écrêtage arrondi (tangente hyperbolique) dont le plafond est −1,4 dBFS : rien ne sature à la sortie */
      var limiteur = S.ctx.createDynamicsCompressor(); limiteur.threshold.value = -4; limiteur.knee.value = 0; limiteur.ratio.value = 20; limiteur.attack.value = .001; limiteur.release.value = .08;
      var plafond = S.ctx.createWaveShaper(), N = 2048, courbe = new Float32Array(N), L = Math.pow(10, -1.4 / 20), i;
      for (i = 0; i < N; i++) { var x = i / (N - 1) * 4 - 2; courbe[i] = L * Math.tanh(x / L); }
      plafond.curve = courbe; plafond.oversample = 'none';   /* sans suréchantillonnage : le plafond est tenu à l'échantillon près */
      var an = S.ctx.createAnalyser(); an.fftSize = 4096;
      general.connect(compresseur); compresseur.connect(limiteur); limiteur.connect(plafond); plafond.connect(an); an.connect(S.ctx.destination);
      S.maitre = { analyseur: an, entree: general, niveau: function (v) { general.gain.setTargetAtTime(v, S.ctx.currentTime, .02); } };
      Object.keys(voies).forEach(function (k) { brancher(voies[k]); });
      document.dispatchEvent(new CustomEvent('ke:son', { detail: { ouvert: true } }));
    }
    if (S.ctx.state === 'suspended') S.ctx.resume();
    return S.ctx;
  };
  function brancher(v) {
    if (v.entree || !S.ctx) return;
    v.entree = S.ctx.createGain(); v.entree.gain.value = v._etalon;
    v.reglage = S.ctx.createGain(); v.reglage.gain.value = v._muet ? 0 : v._niveau;
    v.analyseur = S.ctx.createAnalyser(); v.analyseur.fftSize = 4096;
    v.entree.connect(v.reglage); v.reglage.connect(v.analyseur); v.analyseur.connect(general);
  }
  S.voie = function (nom) {
    if (voies[nom]) return voies[nom];
    var v = voies[nom] = { nom: nom, entree: null, analyseur: null, _niveau: .8, _muet: false, _etalon: 1,
      niveau: function (x) { if (x === undefined) return v._niveau; v._niveau = x; if (v.reglage && !v._muet) v.reglage.gain.setTargetAtTime(x, S.ctx.currentTime, .02); },
      muet: function (m) { v._muet = m; if (v.reglage) v.reglage.gain.setTargetAtTime(m ? 0 : v._niveau, S.ctx.currentTime, .02); },
      etalon: function (x) { if (x === undefined) return v._etalon; v._etalon = x; if (v.entree) v.entree.gain.value = x; },
      ouvrir: function () { S.ouvrir(); brancher(v); return v.entree; } };
    brancher(v); return v;
  };

  /* ── les notes ── */
  var NOMS = ['do', 'do dièse', 'ré', 'ré dièse', 'mi', 'fa', 'fa dièse', 'sol', 'sol dièse', 'la', 'la dièse', 'si'];
  S.freq = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
  S.nom = function (m) { return NOMS[((m % 12) + 12) % 12] + ' ' + (Math.floor(m / 12) - 2); };
  S.noire = function (m) { return [1, 3, 6, 8, 10].indexOf(((m % 12) + 12) % 12) >= 0; };
  var tampon = null;
  S.bruit = function (sec) {
    var c = S.ouvrir(), n = Math.floor(c.sampleRate * (sec || 2)); if (tampon && tampon.length === n) return tampon;
    var b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    if (!sec) tampon = b; return b;
  };
  S.env = function (p, t, o) {
    var a = Math.max(.001, o.a || .001), d = Math.max(.001, o.d || .1), s = o.s === undefined ? 0 : o.s, r = Math.max(.005, o.r || .05), c = o.crete === undefined ? 1 : o.crete, base = o.base || 0, tenue = o.tenue === undefined ? 0 : o.tenue;
    p.cancelScheduledValues(t); p.setValueAtTime(base, t); p.linearRampToValueAtTime(base + c, t + a); p.setTargetAtTime(base + c * s, t + a, d / 3);
    var fin = t + a + d + tenue; p.setTargetAtTime(base, fin, r / 3); return fin + r * 1.6;
  };
  S.relacher = function (p, t, r, base) { p.cancelScheduledValues(t); p.setTargetAtTime(base || 0, t, Math.max(.005, r) / 3); };
  var tmp = null;
  S.niveau = function (an) {
    if (!an) return 0; if (!tmp || tmp.length !== an.fftSize) tmp = new Float32Array(an.fftSize);
    an.getFloatTimeDomainData(tmp); var m = 0; for (var i = 0; i < tmp.length; i += 4) { var x = Math.abs(tmp[i]); if (x > m) m = x; } return Math.min(1, m);
  };
  S.oscillo = function (path, an, W, H, periode) {
    var d = new Float32Array(an.fftSize), vivant = true, calme = 0, tourne = false, plat = 'M0 ' + H / 2 + 'L' + W + ' ' + H / 2, sr = an.context.sampleRate;
    var fn = typeof periode === 'function' ? periode : periode && periode.periode, nb = (periode && periode.periodes) || 2;
    function chercher() {   /* sans période donnée : l'écart moyen entre passages à zéro montants, avec un peu d'hystérésis */
      var arme = false, prec = -1, somme = 0, k = 0, i;
      for (i = 1; i < d.length; i++) { if (d[i] < -.02) arme = true; if (arme && d[i - 1] < 0 && d[i] >= 0) { if (prec >= 0) { somme += i - prec; k++; } prec = i; arme = false; } }
      return k ? somme / k / sr : .01;
    }
    function pas() {
      if (!vivant) return; if (d.length !== an.fftSize) d = new Float32Array(an.fftSize); an.getFloatTimeDomainData(d);
      var T = fn ? fn() : chercher(), n = Math.max(120, Math.min(d.length - 400, Math.round(T * sr * nb * 1.1))), z = 0, i, m = 0;
      for (i = 1; i < d.length - n; i++) if (d[i - 1] < 0 && d[i] >= 0) { z = i; break; }   /* on cale sur un passage à zéro : l'onde tient en place */
      for (i = 0; i < n; i += 4) if (Math.abs(d[z + i]) > m) m = Math.abs(d[z + i]);
      var k = m > .001 ? Math.min(1 / m, 6) * .44 : 0, s = '', saut = Math.max(1, Math.floor(n / 260));
      for (i = 0; i <= n; i += saut) s += (i ? 'L' : 'M') + (i / n * W).toFixed(1) + ' ' + (H / 2 - (d[z + i] || 0) * k * H).toFixed(1);
      path.setAttribute('d', m > .001 ? s : plat); calme = m < .002 ? calme + 1 : 0;
      if (calme < 30) requestAnimationFrame(pas); else { tourne = false; path.setAttribute('d', plat); }
    }
    path.setAttribute('d', plat);
    return { reveiller: function () { if (!tourne && vivant) { tourne = true; calme = 0; requestAnimationFrame(pas); } }, stop: function () { vivant = false; } };
  };

  /* ── l'horloge commune : des doubles croches, programmées un peu d'avance (le son ne dépend pas de l'affichage) ── */
  var H = S.horloge = { joue: false, _bpm: 120, _balance: 0, _abonnes: [], _pas: 0, _prochain: 0, _minuterie: 0 };
  H.tempo = function (b) { if (b === undefined) return H._bpm; H._bpm = Math.max(40, Math.min(240, b)); document.dispatchEvent(new CustomEvent('ke:tempo', { detail: { tempo: H._bpm } })); };
  H.balance = function (x) { if (x === undefined) return H._balance; H._balance = Math.max(0, Math.min(.6, x)); };
  H.duree = function () { return 60 / H._bpm / 4; };
  H.aVenir = function () { return H._pas; };   /* le premier pas qui n'est pas encore programmé (ceux d'avant sonnent déjà, ou vont sonner) */
  H.position = function () { var c = S.ctx; if (!H.joue || !c) return -1; return H._pas - (H._prochain - c.currentTime) / H.duree(); };
  H.surPas = function (fn) { H._abonnes.push(fn); return function () { var i = H._abonnes.indexOf(fn); if (i >= 0) H._abonnes.splice(i, 1); }; };
  function avancer() {
    var c = S.ctx; if (!H.joue || !c) return;
    while (H._prochain < c.currentTime + .12) {
      var d = H.duree(), quand = H._prochain + (H._pas % 2 ? d * H._balance : 0), pas = H._pas;
      H._abonnes.slice().forEach(function (fn) { try { fn(pas, quand, d); } catch (e) { /* un instrument en défaut ne doit pas arrêter les autres */ if (window.console) console.error(e); } });
      H._prochain += d; H._pas++;
    }
  }
  H.jouer = function () {
    var c = S.ouvrir(); if (!c || H.joue) return; H.joue = true; H._pas = 0; H._prochain = c.currentTime + .06;
    H._minuterie = setInterval(avancer, 25); avancer(); document.dispatchEvent(new CustomEvent('ke:horloge', { detail: { joue: true } }));
  };
  H.arreter = function () { if (!H.joue) return; H.joue = false; clearInterval(H._minuterie); document.dispatchEvent(new CustomEvent('ke:horloge', { detail: { joue: false } })); };
  /* dire à l'écran un pas programmé dans le futur, au bon moment */
  H.aLInstant = function (quand, fn) { var c = S.ctx, ms = Math.max(0, (quand - c.currentTime) * 1000); setTimeout(fn, ms); };
})();
