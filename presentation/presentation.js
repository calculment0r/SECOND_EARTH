/* Second Earth · présentation. Moteur des pistes : chaque .piste a une scène collée (sticky) ;
   p va de 0 à 1 pendant qu'on la traverse, et la scène se dessine à partir de p seulement. */
(function () {
  'use strict';
  var SE = window.SE;
  var NS = 'http://www.w3.org/2000/svg';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a), 0, 1); };
  var ease = function (t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
  var fr = function (v, d) { return v.toFixed(d === undefined ? 0 : d).replace('.', ','); };
  var milliers = function (v) { return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
  function el(tag, attrs, parent, svg) {
    var e = svg ? document.createElementNS(NS, tag) : document.createElement(tag);
    for (var k in attrs || {}) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(e);
    return e;
  }
  var sv = function (tag, attrs, parent) { return el(tag, attrs, parent, true); };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  /* ------------------------------------------------------------------ données de texte */

  // Ordre du trajet et jours passés dans chaque biome (Chronologie du voyage, proposé).
  var BIOMES = [
    { id: 'jungle', nom: 'Jungle primordiale', c: 'jungle', j: [0, 2], pal: 0 },
    { id: 'pitons', nom: 'Pitons karstiques', c: 'pitons', j: [2, 12], pal: 1 },
    { id: 'cavernes', nom: 'Terres rocheuses et cavernes', c: 'cavernes', j: [12, 15], pal: 2 },
    { id: 'massifs', nom: 'Massifs et glaciers', c: 'massifs', j: [15, 19], pal: 3 },
    { id: 'foret-bio', nom: 'Forêt bioluminescente', c: 'biolum', j: [19, 23], pal: 4 },
    { id: 'hautes-plaines', nom: 'Hautes Plaines', c: 'plaines', j: [23, 25], pal: 5 },
    { id: 'foret-ancienne', nom: 'Forêt ancienne', c: 'ancienne', j: [25, 28], pal: 6 },
    { id: 'volcanique', nom: 'Course volcanique', c: 'canyon', j: [28, 30], pal: 7 },
    { id: 'mer-arsenic', nom: "Mer d'arsenic et fosse", c: 'arsenic', j: [30, 32], pal: 8 },
    { id: 'lacs-sales', nom: 'Lacs salés pourpres', c: 'sel', j: [32, 39], pal: 9 },
    { id: 'sinkhole', nom: 'Retour au sinkhole', c: 'jungle', j: [39, 41], pal: null }
  ];
  function couleur(k) { return SE.couleurs[k]; }

  // Chronologie du voyage, « Jour par jour » (proposé), telle quelle.
  var CHRONO = [
    [0, 2, 'I', 'Jungle, 0 km', 'Naissance ; lumières sismiques ; le sinkhole avale le XENOPOD, le drone et le relais radio', 'Soirées ambrées : B se couche tôt'],
    [2, 12, 'II', 'Pitons, 250 km', 'Seed porte Rob1 le long du fleuve, ~25 km par jour ; le fleuve se perd dans les tours', 'La saison noire commence au jour 3'],
    [12, 15, 'II–III', 'Cavernes, 250 km', 'Rob2 piégé ; fusion Rob1+Rob2 ; la Créature ; le Titan volant dans la voûte', 'Nuit noire, caverne bioluminescente'],
    [15, 19, 'IV', 'Le col, 680 km', "Le Rob fusionné court ; le froid vide les batteries ; l'organisme-batterie", 'Nuits noires, glaciers sous les deux lunes'],
    [19, 23, 'V', 'Forêt bioluminescente, 1 200 km', 'Rob3 colonisé par la mousse ; la famille de rongeurs ; le feu de camp', 'Saison noire à son cœur : la forêt à son maximum'],
    [23, 25, 'VI', 'Hautes Plaines, ~1 700 km', 'La horde de buffles albinos fuit un feu et sépare Seed des Robs', "Nuits noires, feux de savane à l'horizon"],
    [25, 28, 'VII', 'Forêt ancienne, ~2 000 km', "Seed seule ; la rivière rouge qu'elle ne peut pas boire ; le fruit ; les visions d'Elena", 'Nuits noires, brouillard'],
    [28, 30, 'VII', 'La course, canyon, cristal, arc, ~3 300 km', 'Le tank (Rob1/2/3) la retrouve et fonce sans s\'arrêter : ~1 300 km en deux jours', 'Flammes bleues de soufre la nuit'],
    [30, 32, 'VII', "Mer d'arsenic, Rob4", 'Rob4 hybride ; Seed guérie dans son liquide ; cicatrices lumineuses', 'Jour 32 : première aube ambrée, quand Seed se réveille guérie'],
    [32, 39, 'Retour', 'Lacs salés pourpres, ~4 800 km', 'Le cri « Korê » d\'une colonie entière ; Rob1 et Seed rebaptisent la planète', 'Aubes ambrées de plus en plus longues'],
    [39, 41, 'IX–X', 'Sinkhole, ~5 500 km', 'Extraction du XENOPOD ; le drone cassé au fond ; le message de PERSEPHORA ; le mensonge de Rob1 ; CAIN', 'B se lève bien avant le soleil : la jungle retrouve ses nuits ambrées']
  ];
  // kilomètres le long du trajet -> jour (mêmes points que la chronologie)
  var KMJ = [[0, 0], [0, 2], [250, 12], [250, 15], [681, 17], [1184, 21], [1700, 23], [2000, 25], [2050, 28], [3308, 30], [3308, 32], [4784, 37], [5446, 41]];
  function jourDeKm(km) {
    for (var i = 1; i < KMJ.length; i++) {
      if (km <= KMJ[i][0]) {
        var a = KMJ[i - 1], b = KMJ[i];
        if (b[0] === a[0]) return a[1];
        return lerp(a[1], b[1], (km - a[0]) / (b[0] - a[0]));
      }
    }
    return 41;
  }

  /* ------------------------------------------------------------------ moteur */

  var SCENES = {};
  var pistes = [].slice.call(document.querySelectorAll('.piste'));
  pistes.forEach(function (s) {
    s.style.height = (parseFloat(s.dataset.len || 3) * 100 + 100) + 'vh';
    s._p = -1; s._cible = 0;
  });
  var chapEls = [].slice.call(document.querySelectorAll('[data-chap]'));
  var chapSpan = $('#chap'), progres = $('#progres');
  var reduit = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function cible() {
    var vh = innerHeight;
    pistes.forEach(function (s) {
      var r = s.getBoundingClientRect();
      var len = s.offsetHeight - vh;
      s._cible = clamp(-r.top / len, 0, 1);
      s._vis = r.bottom > -vh * .2 && r.top < vh * 1.2;
    });
    var tot = document.documentElement.scrollHeight - vh;
    progres.style.width = (100 * scrollY / Math.max(1, tot)) + '%';
    var cur = '';
    for (var i = 0; i < chapEls.length; i++) {
      if (chapEls[i].getBoundingClientRect().top < vh * .5) cur = chapEls[i].dataset.chap;
    }
    if (chapSpan.textContent !== cur) chapSpan.textContent = cur;
  }
  var enCours = false;
  function boucle() {
    var encore = false;
    pistes.forEach(function (s) {
      if (!s._vis && s._p >= 0) return;
      var t = s._p < 0 || reduit ? s._cible : lerp(s._p, s._cible, .16);
      if (Math.abs(t - s._cible) < .0004) t = s._cible; else encore = true;
      if (t !== s._p) {
        s._p = t;
        var f = SCENES[s.dataset.scene];
        if (f) f(t, s);
      }
    });
    if (encore) requestAnimationFrame(boucle); else enCours = false;
  }
  function relance() { cible(); if (!enCours) { enCours = true; requestAnimationFrame(boucle); } }
  addEventListener('scroll', relance, { passive: true });
  addEventListener('resize', function () { pistes.forEach(function (s) { s._p = -1; }); construireTout(); relance(); });

  /* thème */
  var bTheme = $('#theme');
  function majBouton() { bTheme.textContent = document.documentElement.getAttribute('data-theme') === 'clair' ? 'Sombre' : 'Clair'; }
  bTheme.addEventListener('click', function () {
    var t = document.documentElement.getAttribute('data-theme') === 'clair' ? 'sombre' : 'clair';
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('se-presentation-theme', t); } catch (e) {}
    majBouton(); pistes.forEach(function (s) { s._p = -1; }); construireTout(); relance();
  });
  majBouton();

  /* sommaire */
  (function () {
    var ol = $('#liste-sommaire');
    var vus = {};
    document.querySelectorAll('.chapitre').forEach(function (c) {
      var ch = c.dataset.chap, num = $('.num', c), h = $('h2', c);
      if (!ch || vus[ch] || !num || num.textContent === 'Sommaire') return;
      vus[ch] = 1;
      if (!c.id) c.id = 'ch-' + num.textContent;
      el('li', { html: '<span>' + esc(num.textContent) + '</span><a href="#' + c.id + '">' + esc(ch) + '</a><span>' + esc(h.textContent) + '</span>' }, ol);
    });
  })();

  /* ------------------------------------------------------------------ 00 ouverture */
  SCENES.ouverture = function (p) {
    var vh = innerHeight;
    var monte = $('#ouv-monte'), mot = $('#ouv-mot');
    var h = monte.offsetHeight;
    var y = lerp(vh * 1.02, -h - vh * .1, ease(seg(p, 0, .82)));
    monte.style.transform = 'translate(-50%,' + y + 'px)';
    [].forEach.call(monte.children, function (c) {
      var r = c.getBoundingClientRect(); var m = (r.top + r.height / 2) / vh;
      c.style.opacity = clamp(1 - Math.abs(m - .5) * 1.7, .06, 1);
    });
    mot.style.transform = 'translate(-50%,-50%) scale(' + lerp(1, .92, p) + ')';
    mot.style.color = p > .8 ? 'var(--encre)' : '';
    mot.style.opacity = p > .8 ? lerp(.1, 1, seg(p, .8, 1)) : 1;
    if (p > .8) mot.style.color = 'var(--encre)'; else mot.style.color = '';
    $('#ouv-fin').style.opacity = seg(p, .86, 1);
  };

  /* ------------------------------------------------------------------ 01 voyage */
  var voy = {};
  function construireVoyage() {
    var s = $('#voy-svg'); s.innerHTML = '';
    var w = s.getBoundingClientRect().width;
    voy.w = w;
    sv('line', { x1: 0, x2: w, y1: 30, y2: 30, stroke: css('--fil'), 'stroke-width': 1 }, s);
    for (var i = 0; i <= 53; i++) {
      var x = w * i / 53;
      sv('line', { x1: x, x2: x, y1: i % 10 === 5 ? 18 : 24, y2: 36, stroke: css('--fil'), 'stroke-width': 1 }, s);
    }
    voy.trait = sv('line', { x1: 0, x2: 0, y1: 30, y2: 30, stroke: css('--orange'), 'stroke-width': 2 }, s);
    voy.pt = sv('circle', { cx: 0, cy: 30, r: 6, fill: css('--orange') }, s);
    sv('circle', { cx: 0, cy: 30, r: 4, fill: css('--encre') }, s);
    sv('circle', { cx: w, cy: 30, r: 7, fill: 'none', stroke: css('--encre'), 'stroke-width': 1 }, s);
  }
  SCENES.voyage = function (p) {
    var t = ease(seg(p, .05, .85));
    var an = Math.round(2045 + 53 * t);
    $('#voy-annee').textContent = an;
    $('#voy-al').textContent = fr(11.4 * t, 1) + ' années-lumière';
    var x = voy.w * t;
    voy.trait.setAttribute('x2', x); voy.pt.setAttribute('cx', x);
    var d = $('#voy-dit');
    d.textContent = p < .45 ? 'Il porte des embryons et des machines.' : (p < .86 ? 'Environ 21 % de la vitesse de la lumière.' : '2098 : il largue le XENOPOD-01 et les collecteurs.');
  };

  /* ------------------------------------------------------------------ 02 chiffres */
  var CHIFFRES = [
    ['4 400', 'K', 'Une naine orange, 61 Cygni A', '15 % de la luminosité du Soleil, ~6,1 milliards d\'années. Sa compagne, 61 Cygni B, orbite en ~659 ans.'],
    ['11,4', 'al', 'La distance à la Terre', 'Un message de Rob1 met 11,4 ans à arriver.'],
    ['40', 'h', 'La longueur du jour', 'Seed dort deux fois par jour de Korê.'],
    ['116', 'jours', "L'année", 'Orbite à ~0,41 UA ; 69,6 jours de Korê.'],
    ['1,13', 'g', 'La gravité', '~1,5 masse terrestre, ~1,15 rayon terrestre. Sauts ~12 % moins hauts, chutes ~6 % plus rapides.'],
    ['30', '% O₂', "L'air", 'Type Carbonifère : 2 % de CO₂, 1,3 bar.'],
    ['4,7', 'pH', 'La pluie', 'Une pluie acide qui creuse le calcaire : karst, cavernes, sinkhole.'],
    ['40', '% d\'eau', 'La surface', '58 % de terres émergées ; déserts ~30 % des terres, jungles ~4 à 5 %.'],
    ['× 7', '', 'Les marées de vives-eaux', 'Sept fois celles de la Terre ; 10 à 15 m dans le Golfe 1.'],
    ['2', 'lunes', 'Une grande, une petite', 'La grande : ~3 300 km de rayon, un mois de 21 jours de Korê. La petite : ~1 000 km, une seconde marée.'],
    ['60', 'Ma', 'Les Titans', 'Des géants éteints par une pluie de comètes. Descendants : buffles albinos, Créature des profondeurs.'],
    ['4 500', 'K', 'La lumière à midi', '<span class="propose">Proposé</span> : ~90 % de l\'éclairement terrestre, ciel bleu pâle laiteux, crépuscules rouges de plus d\'une heure.']
  ];
  function construireChiffres() {
    var pose = $('#chi-pose'); pose.innerHTML = '';
    CHIFFRES.forEach(function (c) {
      el('div', { html: '<b>' + esc(c[0]) + ' ' + esc(c[1]) + '</b><span>' + esc(c[2]) + '</span>' }, pose);
    });
  }
  var chiCourant = -1;
  SCENES.chiffres = function (p) {
    var n = CHIFFRES.length, f = p * n * 1.04, i = clamp(Math.floor(f), 0, n - 1), loc = f - i;
    var rows = $('#chi-pose').children;
    for (var k = 0; k < n; k++) rows[k].classList.toggle('on', k < i || (k === i && loc > .72) || p > .97);
    var cur = $('#chi-courant');
    if (i !== chiCourant) {
      chiCourant = i;
      var c = CHIFFRES[i];
      $('.n', cur).innerHTML = esc(c[0]) + (c[1] ? '<span class="u">' + esc(c[1]) + '</span>' : '');
      $('.l', cur).textContent = c[2];
      $('.t', cur).innerHTML = c[3];
    }
    var a = clamp(Math.min(loc / .2, (1 - loc) / .22), 0, 1);
    if (p > .97) a = 0;
    cur.style.opacity = a;
    cur.style.transform = 'translateY(calc(-50% + ' + ((1 - a) * (loc < .5 ? 30 : -30)) + 'px))';
  };

  /* ------------------------------------------------------------------ 03 ciel */
  var cie = {};
  // jour du voyage -> angle sur l'orbite de 116 jours ; jour 0 en haut
  function angJour(d) { return -Math.PI / 2 + 2 * Math.PI * d / 116; }
  function arc(cx, cy, r, a0, a1) {
    var large = (a1 - a0) % (2 * Math.PI) > Math.PI ? 1 : 0;
    return 'M' + (cx + r * Math.cos(a0)) + ' ' + (cy + r * Math.sin(a0)) + ' A' + r + ' ' + r + ' 0 ' + large + ' 1 ' + (cx + r * Math.cos(a1)) + ' ' + (cy + r * Math.sin(a1));
  }
  var PHASES = [
    [-26, 3, 'Soirées ambrées', 'B se couche de plus en plus tôt après le soleil ; les fins de nuit sont noires.'],
    [3, 32, 'Saison noire', 'B est dans le ciel de jour, invisible : nuits noires, bioluminescence à son maximum.'],
    [32, 61, 'Aubes ambrées', 'B se lève avant le soleil, un peu plus tôt chaque jour.'],
    [61, 90, 'Nuits ambrées', 'B au-dessus de l\'horizon toute la nuit ; les nuits sont orangées, les ombres doubles.']
  ];
  var EVTS_CIEL = [
    [0, 'Jour 0', 'Naissance de Seed, sous les soirées ambrées.'],
    [7, 'Jour 7 · pleine lune', 'La grande lune pleine sur les pitons.'],
    [25, 'Jour 25 · nouvelle lune', 'Nouvelle lune sur les Hautes Plaines.'],
    [32, 'Jour 32 · première aube ambrée', 'Seed se réveille guérie dans la mer d\'arsenic.'],
    [41, 'Jour 41 · presque pleine', 'Retour au sinkhole ; la grande lune presque pleine.']
  ];
  function construireCiel() {
    var s = $('#cie-svg'); s.innerHTML = '';
    var W = innerWidth, H = innerHeight;
    var cx = W * .36, cy = H * .5, R = Math.min(H * .36, W * .26);
    cie.cx = cx; cie.cy = cy; cie.R = R;
    s.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    PHASES.forEach(function (ph, i) {
      var a0 = angJour(ph[0]) + .012, a1 = angJour(ph[1]) - .012;
      sv('path', { d: arc(cx, cy, R, a0, a1), fill: 'none', stroke: i === 1 ? css('--fil-fort') : css('--ambre'), 'stroke-width': i === 1 ? 1 : 1.2, 'stroke-dasharray': i === 1 ? '' : '2 5', opacity: i === 1 ? 1 : .8 }, s);
      var am = (angJour(ph[0]) + angJour(ph[1])) / 2, rl = R + 46;
      var t = sv('text', { x: cx + rl * Math.cos(am), y: cy + rl * Math.sin(am), 'text-anchor': Math.cos(am) > .2 ? 'start' : (Math.cos(am) < -.2 ? 'end' : 'middle'), 'dominant-baseline': 'middle', class: 'cote' }, s);
      t.textContent = ph[2] + ' · ~29 j';
    });
    for (var d = 0; d < 116; d++) {
      var a = angJour(d), l = d % 10 === 0 ? 9 : 4;
      sv('line', { x1: cx + (R - l) * Math.cos(a), y1: cy + (R - l) * Math.sin(a), x2: cx + R * Math.cos(a), y2: cy + R * Math.sin(a), stroke: css('--fil'), 'stroke-width': 1 }, s);
    }
    cie.voy = sv('path', { d: '', fill: 'none', stroke: css('--orange'), 'stroke-width': 3, 'stroke-linecap': 'round' }, s);
    cie.pt = sv('circle', { r: 6, fill: css('--orange') }, s);
    cie.evts = EVTS_CIEL.map(function (e) {
      var a = angJour(e[0]), r1 = R - 26;
      var g = sv('g', { opacity: 0 }, s);
      sv('line', { x1: cx + (R - 6) * Math.cos(a), y1: cy + (R - 6) * Math.sin(a), x2: cx + r1 * Math.cos(a), y2: cy + r1 * Math.sin(a), stroke: css('--encre'), 'stroke-width': 1 }, g);
      var t = sv('text', { x: cx + (r1 - 8) * Math.cos(a), y: cy + (r1 - 8) * Math.sin(a), 'text-anchor': Math.cos(a) > .3 ? 'end' : (Math.cos(a) < -.3 ? 'start' : 'middle'), 'dominant-baseline': Math.sin(a) > .3 ? 'auto' : 'hanging', class: 'cote-f' }, g);
      t.textContent = e[1];
      if (/lune/.test(e[1])) {
        var plein = /pleine/.test(e[1]);
        sv('circle', { cx: cx + (R + 18) * Math.cos(a), cy: cy + (R + 18) * Math.sin(a), r: 7, fill: plein ? css('--encre') : 'none', stroke: css('--encre'), 'stroke-width': 1 }, g);
      }
      return g;
    });
    cie.big = sv('text', { x: cx, y: cy - 6, 'text-anchor': 'middle', class: 'grand-chiffre', 'font-size': R * .5 }, s);
    var sub = sv('text', { x: cx, y: cy + R * .2, 'text-anchor': 'middle', class: 'cote' }, s);
    sub.textContent = 'jours du voyage, sur une année de 116';
  }
  SCENES.ciel = function (p) {
    var d = 41 * ease(seg(p, .06, .9));
    cie.voy.setAttribute('d', d > .05 ? arc(cie.cx, cie.cy, cie.R, angJour(0), angJour(d)) : '');
    var a = angJour(d);
    cie.pt.setAttribute('cx', cie.cx + cie.R * Math.cos(a)); cie.pt.setAttribute('cy', cie.cy + cie.R * Math.sin(a));
    cie.big.textContent = Math.round(d);
    EVTS_CIEL.forEach(function (e, i) { cie.evts[i].setAttribute('opacity', d >= e[0] - .01 ? 1 : 0); });
    var ph = PHASES[d < 3 ? 0 : (d < 32 ? 1 : 2)];
    var ev = null; EVTS_CIEL.forEach(function (e) { if (d >= e[0] - .01) ev = e; });
    $('#cie-panneau').innerHTML = '<p class="pale" style="font-size:13px;letter-spacing:.06em;text-transform:uppercase;margin:0 0 .6em">61 Cygni B · <span class="propose">proposé</span></p><h3>' + esc(ph[2]) + '</h3><p>' + esc(ph[3]) + '</p>' +
      (ev ? '<p class="pale" style="margin-top:2em">' + esc(ev[1]) + '</p><p>' + esc(ev[2]) + '</p>' : '');
  };

  /* ------------------------------------------------------------------ 04 marées */
  var mar = {};
  function construireMarees() {
    var s = $('#mar-svg'); s.innerHTML = '';
    var W = innerWidth, H = innerHeight;
    s.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var k = Math.min(H * .4, W * .22) / 10;
    mar.k = k;
    var cxT = W * .24, cxK = W * .64, cy = H * .5;
    function cercle(cx, v, cls) { return sv('circle', { cx: cx, cy: cy, r: v * k, fill: 'none', stroke: css(cls), 'stroke-width': 1 }, s); }
    function txt(x, y, t, cl, anc) { var e = sv('text', { x: x, y: y, class: cl || 'cote', 'text-anchor': anc || 'middle' }, s); e.textContent = t; return e; }
    mar.terre = sv('g', {}, s);
    var gT = mar.terre;
    sv('circle', { cx: cxT, cy: cy, r: 1 * k, fill: 'none', stroke: css('--encre'), 'stroke-width': 1 }, gT);
    sv('circle', { cx: cxT, cy: cy, r: .46 * k, fill: 'none', stroke: css('--fil-fort'), 'stroke-width': 1 }, gT);
    sv('circle', { cx: cxT, cy: cy, r: 1.46 * k, fill: 'none', stroke: css('--encre'), 'stroke-width': 1, 'stroke-dasharray': '2 4' }, gT);
    var t1 = sv('text', { x: cxT, y: cy - 1.46 * k - 16, class: 'cote-f', 'text-anchor': 'middle' }, gT); t1.textContent = 'Terre · vives-eaux 1,46';
    var t2 = sv('text', { x: cxT, y: cy + 1.46 * k + 26, class: 'cote', 'text-anchor': 'middle' }, gT); t2.textContent = 'Lune 1 · Soleil 0,46';
    mar.items = [
      { v: 5.3, t: 'Grande lune · 5,3', cls: '--encre', dash: '' },
      { v: 4.7, t: 'Étoile, 61 Cygni A à 0,41 UA · 4,7', cls: '--fil-fort', dash: '' },
      { v: .6, t: 'Petite lune · 0,6', cls: '--fil-fort', dash: '' },
      { v: 10, t: 'Vives-eaux, tout aligné · ~10', cls: '--orange', dash: '2 5' }
    ].map(function (it, i) {
      var g = sv('g', { opacity: 0 }, s);
      var c = sv('circle', { cx: cxK, cy: cy, r: 0, fill: 'none', stroke: css(it.cls), 'stroke-width': it.v === 10 ? 1.5 : 1, 'stroke-dasharray': it.dash }, g);
      var ang = [-.95, -.55, .3, -1.35][i];
      var tx = sv('text', { x: cxK + it.v * k * Math.cos(ang) + 12, y: cy + it.v * k * Math.sin(ang), class: it.v === 10 ? 'cote-f cote-or' : 'cote-f', 'text-anchor': 'start' }, g);
      tx.textContent = it.t;
      if (it.v === .6) tx.setAttribute('x', cxK + 30), tx.setAttribute('y', cy + 4);
      return { g: g, c: c, v: it.v };
    });
    mar.titre = txt(cxK, cy + 10 * k + 40, 'Korê', 'cote-f');
    mar.fois = sv('text', { x: W * .94, y: H * .2, class: 'grand-chiffre', 'font-size': H * .16, 'text-anchor': 'end', opacity: 0 }, s);
    mar.fois.textContent = '× 7';
  }
  SCENES.marees = function (p) {
    mar.terre.setAttribute('opacity', seg(p, 0, .12));
    var spans = [[.12, .32], [.32, .52], [.52, .62], [.66, .86]];
    mar.items.forEach(function (it, i) {
      var t = ease(seg(p, spans[i][0], spans[i][1]));
      it.g.setAttribute('opacity', t > 0 ? 1 : 0);
      it.c.setAttribute('r', it.v * mar.k * t);
    });
    mar.fois.setAttribute('opacity', seg(p, .86, .96));
  };

  /* ------------------------------------------------------------------ 05 trajet */
  var tra = {};
  function construireTrajet() {
    var T = SE.trajet, s = $('#tra-svg'); s.innerHTML = '';
    var defs = sv('defs', {}, s);
    var flou = sv('filter', { id: 'flou', x: '-20%', y: '-20%', width: '140%', height: '140%' }, defs);
    sv('feGaussianBlur', { stdDeviation: 14 }, flou);
    var mask = sv('mask', { id: 'masque', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: T.w, height: T.h }, defs);
    var d = 'M' + T.path.map(function (q) { return q[0] + ' ' + q[1]; }).join(' L');
    tra.mpath = sv('path', { d: d, fill: 'none', stroke: '#fff', 'stroke-width': 110, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', filter: 'url(#flou)' }, mask);
    // bords fondus : la carte se perd dans le fond de la page
    var rg = sv('radialGradient', { id: 'rg', gradientUnits: 'userSpaceOnUse', cx: 1025, cy: 530, r: 820, gradientTransform: 'translate(1025 530) scale(1 .56) translate(-1025 -530)' }, defs);
    sv('stop', { offset: '0.6', 'stop-color': '#fff' }, rg);
    sv('stop', { offset: '1', 'stop-color': '#fff', 'stop-opacity': 0 }, rg);
    var bord = sv('mask', { id: 'bord', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: T.w, height: T.h }, defs);
    sv('rect', { x: 0, y: 0, width: T.w, height: T.h, fill: 'url(#rg)' }, bord);
    var gb = sv('g', { mask: 'url(#bord)' }, s);
    sv('image', { href: 'img/corridor.jpg', x: 0, y: 0, width: T.w, height: T.h, preserveAspectRatio: 'none', style: 'filter:' + css('--carte-filtre') }, gb);
    sv('image', { href: 'img/corridor.jpg', x: 0, y: 0, width: T.w, height: T.h, preserveAspectRatio: 'none', mask: 'url(#masque)', style: 'filter:' + css('--carte-couleur') }, s);
    tra.path = sv('path', { d: d, fill: 'none', stroke: css('--orange'), 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s);
    tra.len = tra.path.getTotalLength();
    [tra.path, tra.mpath].forEach(function (q) { q.style.strokeDasharray = tra.len + ' ' + tra.len; q.style.strokeDashoffset = tra.len; });
    tra.tete = sv('circle', { r: 8, fill: css('--orange') }, s);
    // marques d'acte : position le long du tracé
    var cum = T.cum, tot = cum[cum.length - 1];
    tra.marques = T.acts.map(function (a) {
      var best = 0, bd = 1e9;
      T.path.forEach(function (q, i) { var dd = Math.hypot(q[0] - a.p[0], q[1] - a.p[1]); if (dd < bd && (a.id !== 'IX' || i > T.path.length / 2)) { bd = dd; best = i; } });
      var g = sv('g', { opacity: 0, class: 'marque' }, s);
      sv('circle', { cx: a.p[0], cy: a.p[1], r: 5, fill: css('--encre') }, g);
      var lb = a.id === 'P' ? '' : a.id;
      var t = sv('text', { x: a.p[0] + 12, y: a.p[1] - 10, class: 'cote-f', 'font-size': 24 }, g);
      t.textContent = lb === 'C' ? 'course' : (lb === 'R4' ? 'mer' : (lb === 'K' ? 'Korê' : lb));
      g.addEventListener('click', function () { montrerActe(a); });
      return { a: a, g: g, f: cum[best] / tot };
    });
    tra.robs = T.robs.map(function (r) {
      var g = sv('g', { opacity: 0 }, s);
      sv('circle', { cx: r.p[0], cy: r.p[1], r: 15, fill: 'none', stroke: css('--orange'), 'stroke-width': 1.5 }, g);
      var t = sv('text', { x: r.p[0] + 20, y: r.p[1] + 24, class: 'cote', 'font-size': 20 }, g); t.textContent = r.id;
      return g;
    });
    tra.tot = tot;
  }
  function montrerActe(a) {
    var box = $('#tra-acte');
    $('h3', box).textContent = a.t; $('p', box).textContent = a.d;
  }
  var traActe = null;
  SCENES.trajet = function (p) {
    var t = seg(p, .03, .94);
    var off = tra.len * (1 - t);
    tra.path.style.strokeDashoffset = off; tra.mpath.style.strokeDashoffset = off;
    var pt = tra.path.getPointAtLength(tra.len * t);
    tra.tete.setAttribute('cx', pt.x); tra.tete.setAttribute('cy', pt.y);
    var km = tra.tot * t;
    $('#tra-k').textContent = milliers(km) + ' km';
    $('#tra-j').textContent = 'Jour ' + Math.floor(jourDeKm(km) + 1e-6);
    var cur = tra.marques[0];
    tra.marques.forEach(function (m) { var on = t >= m.f - .002; m.g.setAttribute('opacity', on ? 1 : 0); if (on) cur = m; });
    if (t < .001) cur = tra.marques[0];
    tra.robs.forEach(function (g) { g.setAttribute('opacity', seg(p, 0, .05)); });
    if (cur !== traActe) { traActe = cur; montrerActe(cur.a); }
  };

  /* frise interactive */
  function construireFrise() {
    var j = $('#frise-jours'); j.innerHTML = '';
    BIOMES.forEach(function (b) {
      el('div', { class: 'bande', style: 'left:' + (100 * b.j[0] / 41) + '%;width:calc(' + (100 * (b.j[1] - b.j[0]) / 41) + '% - 2px);background:' + couleur(b.c), title: b.nom }, j);
    });
    [0, 10, 20, 30, 41].forEach(function (d) { el('div', { class: 'graduation', style: 'left:' + (100 * d / 41) + '%', text: 'jour ' + d }, j); });
    var cur = el('div', { class: 'curseur' }, j);
    var lect = $('#frise-lecture');
    function poser(d) {
      d = clamp(d, 0, 41);
      cur.style.left = (100 * d / 41) + '%';
      var r = CHRONO[0];
      CHRONO.forEach(function (c) { if (d >= c[0]) r = c; });
      lect.innerHTML = '<div><div class="t">Jour</div><div class="gros">' + Math.floor(d) + '</div></div>' +
        '<div><div class="t">Acte</div><div class="v">' + esc(r[2]) + '</div><div class="t" style="margin-top:14px">Où, distance</div><div class="v">' + esc(r[3]) + '</div></div>' +
        '<div><div class="t">Ce qui se passe</div><div class="v">' + esc(r[4]) + '</div></div>' +
        '<div><div class="t">Ciel</div><div class="v">' + esc(r[5]) + '</div></div>';
    }
    function depuis(e) { var rc = j.getBoundingClientRect(); poser(41 * (e.clientX - rc.left) / rc.width); }
    var tir = false;
    j.addEventListener('pointerdown', function (e) { tir = true; j.setPointerCapture(e.pointerId); depuis(e); });
    j.addEventListener('pointermove', function (e) { if (tir) depuis(e); });
    j.addEventListener('pointerup', function () { tir = false; });
    poser(7);
  }

  /* ------------------------------------------------------------------ 06 biomes */
  function construireBiomes() {
    var bb = $('#bio-bandes'); bb.innerHTML = '';
    BIOMES.forEach(function (b) {
      var d = el('div', { style: 'flex:' + (b.j[1] - b.j[0]) + ' 1 0' }, bb);
      el('div', { class: 'c', style: 'background:' + couleur(b.c) }, d);
      el('div', { class: 'n', text: b.nom }, d);
      el('div', { class: 'd', text: 'j ' + b.j[0] + '–' + b.j[1] }, d);
    });
  }
  var bioCourant = -1;
  SCENES.biomes = function (p) {
    var n = BIOMES.length, kids = $('#bio-bandes').children, cur = 0;
    for (var i = 0; i < n; i++) {
      var t = ease(seg(p, .04 + i * .075, .04 + i * .075 + .1));
      $('.c', kids[i]).style.height = (t * 100) + '%';
      $('.n', kids[i]).style.opacity = t;
      $('.d', kids[i]).style.opacity = t;
      if (t > .5) cur = i;
    }
    if (cur !== bioCourant) {
      bioCourant = cur;
      var b = BIOMES[cur], pal = b.pal !== null ? SE.palette[b.pal] : null;
      $('#bio-texte').innerHTML = '<div><div class="t">Jours ' + b.j[0] + ' à ' + b.j[1] + '</div><h3>' + esc(b.nom) + '</h3></div>' +
        (pal ? '<div><div class="t">Dominante</div><p>' + esc(pal.dominante) + '</p><div class="t" style="margin-top:12px">Accents</div><p>' + esc(pal.accents) + '</p></div><div><div class="t">Mouvement</div><p>' + esc(pal.mouvement) + '</p></div>'
          : '<div><p>Retour au point de départ : extraction du XENOPOD, message, CAIN.</p></div><div><p class="manque">Pas de ligne de palette : c\'est la jungle du début.</p></div>');
      [].forEach.call(kids, function (k, i) { k.style.opacity = i === cur ? 1 : .55; });
    }
  };

  /* ------------------------------------------------------------------ 07 espèces */
  var ORDRE = ['jungle', 'pitons', 'cavernes', 'massifs', 'foret-bio', 'hautes-plaines', 'foret-ancienne', 'volcanique', 'mer-arsenic', 'lacs-sales'];
  var TETES = { jungle: 'Jungle', pitons: 'Pitons', cavernes: 'Cavernes', massifs: 'Massifs', 'foret-bio': 'Forêt biolum.', 'hautes-plaines': 'Hautes Plaines', 'foret-ancienne': 'Forêt ancienne', volcanique: 'Course volcanique', 'mer-arsenic': "Mer d'arsenic", 'lacs-sales': 'Lacs salés' };
  function taillePx(m) {
    var H = innerHeight;
    if (m === null) return H * .0135;
    var t = clamp((Math.log10(m) + 3.2) / 4.4, 0, 1);
    return H * lerp(.013, .036, t);
  }
  function construireEspeces() {
    var pl = $('#esp-planche'); pl.innerHTML = '';
    ORDRE.forEach(function (b) {
      var col = el('div', { class: 'col' }, pl);
      el('div', { class: 'tete', text: TETES[b] }, col);
      SE.especes.filter(function (e) { return e.biome === b; })
        .sort(function (x, y) { return (y.m || 0) - (x.m || 0); })
        .forEach(function (e) {
          var n = el('div', { class: 'nm', style: 'font-size:' + taillePx(e.m) + 'px' + (e.m === null ? ';font-style:italic' : '') }, col);
          n.innerHTML = esc(e.nom) + '<small>' + esc(e.taille) + '</small>';
        });
    });
    var ht = SE.especes.filter(function (e) { return e.biome === 'hors-trajet'; }).length;
    var co = SE.especes.filter(function (e) { return /^continent/.test(e.biome); }).length;
    var tx = SE.especes.filter(function (e) { return e.biome === 'transversal'; }).length;
    $('#esp-ailleurs').innerHTML = 'Et ailleurs sur Korê : <b>' + ht + '</b> espèces hors trajet (sans statut dans le Bestiaire), <b>' + co + '</b> sur les continents B, C, D (validées, round 15), <b>' + tx + '</b> transversales. <b>' + SE.titans.length + '</b> Titans éteints, <b>' + SE.flore.length + '</b> plantes à la Flore.';
  }
  SCENES.especes = function (p) {
    var cols = $('#esp-planche').children;
    for (var i = 0; i < cols.length; i++) {
      var noms = cols[i].querySelectorAll('.nm');
      var a = .03 + i * .075;
      for (var k = 0; k < noms.length; k++) {
        var t = ease(seg(p, a + k * .008, a + k * .008 + .09));
        noms[k].style.opacity = t; noms[k].style.transform = 'translateY(' + (1 - t) * 18 + 'px)';
      }
    }
    $('#esp-ailleurs').style.opacity = seg(p, .85, .95);
  };

  /* ------------------------------------------------------------------ 08 titans */
  var tit = {};
  function construireTitans() {
    var e = $('#tit-echelle'); e.innerHTML = '';
    var items = [
      { nom: 'Rob1', m: .75, q: '~75 cm, le casque sous la hanche de Seed', k: 'robot' },
      { nom: 'Rob1/2, le Rob fusionné', m: 2.5, q: 'bipède coureur, ~2,5 m', k: 'robot' }
    ];
    var desc = SE.especes.filter(function (x) { return x.code === 'HP-01' || x.code === 'TR-01'; });
    desc.forEach(function (x) { items.push({ nom: x.nom, m: x.m, q: x.taille + ' · descendant', k: '' }); });
    SE.titans.forEach(function (t) { items.push({ nom: t.nom, m: t.m, q: t.taille, k: 'titan' }); });
    items.sort(function (a, b) { return a.m - b.m; });
    var H = e.getBoundingClientRect().height, n = items.length;
    tit.items = items.map(function (it, i) {
      var y = H * (i + .5) / n;
      var l = el('div', { class: 'ligne ' + it.k, style: 'top:' + y + 'px;width:0' }, e);
      var lab = el('div', { class: 'etq', style: 'top:' + y + 'px', html: esc(it.nom) + '<small>' + esc(it.q) + '</small>' }, e);
      lab.style.right = 'calc(100% + 18px)';
      var v = el('div', { class: 'val', style: 'top:' + y + 'px' }, e);
      return { it: it, l: l, lab: lab, v: v };
    });
    tit.W = e.getBoundingClientRect().width;
  }
  SCENES.titans = function (p) {
    var t = ease(seg(p, .04, .9));
    var maxV = Math.exp(lerp(Math.log(1), Math.log(21), t));
    var W = tit.W;
    tit.items.forEach(function (o) {
      var vis = clamp((maxV - o.it.m * .8) / (o.it.m * .2), 0, 1);
      var w = Math.min(o.it.m / maxV, 1.2) * W;
      o.l.style.width = w + 'px';
      o.l.style.opacity = vis;
      o.lab.style.opacity = vis;
      o.v.style.left = w + 'px'; o.v.style.opacity = vis;
      o.v.textContent = fr(o.it.m, o.it.m < 1 ? 2 : (o.it.m % 1 ? 1 : 0)) + ' m';
      o.l.style.height = o.it.k === 'titan' ? '3px' : (o.it.k === 'robot' ? '2px' : '1px');
    });
    var r = $('#tit-regle'); r.innerHTML = '';
    var pas = [.25, .5, 1, 2, 5, 10].filter(function (s) { return maxV / s <= 7; })[0] || 10;
    for (var x = 0; x <= maxV + 1e-6; x += pas) {
      var px = x / maxV * W;
      el('i', { style: 'left:' + px + 'px' }, r);
      el('span', { style: 'left:' + px + 'px', text: fr(x, pas < 1 ? 2 : 0) + ' m' }, r);
    }
  };

  /* ------------------------------------------------------------------ 09 science */
  var sci = {};
  function construireScience() {
    var s = $('#sci-svg'); s.innerHTML = '';
    var H = innerHeight, cell = Math.min(H * .045, 46), cols = 16;
    var w = cell * cols, h = cell * 8;
    s.setAttribute('width', w); s.setAttribute('height', h);
    sci.pts = [];
    for (var i = 0; i < 123; i++) {
      var x = (i % cols + .5) * cell, y = (Math.floor(i / cols) + .5) * cell;
      var kind = i < 106 ? 'C' : (i < 122 ? 'N' : 'P');
      var c = kind === 'P' ? sv('circle', { cx: x, cy: y, r: cell * .3, fill: css('--orange') }, s)
        : (kind === 'N' ? sv('circle', { cx: x, cy: y, r: cell * .2, fill: 'none', stroke: css('--encre'), 'stroke-width': 1.2 }, s)
          : sv('circle', { cx: x, cy: y, r: cell * .14, fill: css('--encre') }, s));
      c.setAttribute('opacity', 0);
      sci.pts.push({ c: c, k: kind, i: i });
    }
    $('#sci-compte').innerHTML = '<div class="c"><b>0</b>carbones</div><div class="n"><b>0</b>azotes</div><div class="p"><b>0</b>phosphore</div>';
  }
  SCENES.science = function (p) {
    var nC = Math.round(106 * ease(seg(p, .04, .45))), nN = Math.round(16 * seg(p, .48, .6)), nP = p > .68 ? 1 : 0;
    var dim = seg(p, .78, .9);
    sci.pts.forEach(function (o) {
      var on = o.k === 'C' ? o.i < nC : (o.k === 'N' ? o.i - 106 < nN : nP);
      var op = on ? (o.k === 'P' ? 1 : lerp(o.k === 'C' ? .85 : 1, .18, dim)) : 0;
      o.c.setAttribute('opacity', op);
    });
    var b = document.querySelectorAll('#sci-compte b');
    b[0].textContent = nC; b[1].textContent = nN; b[2].textContent = nP;
    $('#sci-dit').style.opacity = seg(p, .8, .92);
  };

  /* ------------------------------------------------------------------ 10 film */
  // Architecture 25 / 55 (validée, A01) : cœur de chaque acte, modules ajoutés.
  var ACTES = [
    { a: 'Prologue', t: 'Terre 2045, 61 Cygni, quatre capsules', c: 1.5, mods: [['M1', 'Elena, 2045', 3], ['M2', 'Phase 1', 5]] },
    { a: 'I', t: 'Naissance, Elena à l\'écran, le sinkhole', c: 3.75, mods: [] },
    { a: 'II', t: 'La marche, les pitons', c: 1.5, mods: [['M3', 'La marche', 3]] },
    { a: 'III', t: 'La caverne, la fusion, la Créature, la fuite', c: 3, mods: [] },
    { a: 'IV', t: 'Énergie critique, l\'organisme-batterie, le col', c: 2, mods: [['M4', 'Le col et l\'ombre', 3], ['M9', 'Il y a 60 millions d\'années (placé après M4)', 2]] },
    { a: 'V', t: 'Rob3, les rongeurs, le feu', c: 2.5, mods: [['M5', 'La nuit noire', 3]] },
    { a: 'VI', t: 'La horde', c: 2.5, mods: [['M6', 'Dans la horde', 2]] },
    { a: 'VII', t: 'Rivière rouge, fruit, visions, course, Rob4', c: 4.25, mods: [['M7', 'La course', 3]] },
    { a: 'VIII', t: 'Le retour, Korê (absent du docx)', c: .5, mods: [['M8', 'Korê', 3]] },
    { a: 'IX', t: 'L\'extraction, le message, le mensonge, « Je suis Seed »', c: 2.5, mods: [] },
    { a: 'X', t: 'CAIN, carton final', c: 1, mods: [] }
  ];
  // Séquencier 25 min : la science en image, par acte (texte tel quel).
  var SCIENCE = {
    'Prologue': '11,4 années-lumière : un carton « 2045 → 2098 », le temps du voyage',
    'I': 'Le sol karstique creux (le pied qui s\'enfonce), la pluie acide qui l\'a creusé',
    'II': 'Le fleuve qu\'elle boit : l\'eau de pluie acide est neutralisée par le calcaire',
    'III': 'Le squelette du Titan volant dans la voûte ; la chimiosynthèse (les plantes vivent de la roche, pas de la lumière)',
    'IV': 'Une batterie vivante : lithium, phosphates, 3,7 V ; le froid qui vide les batteries',
    'V': 'La forêt bioluminescente au maximum de la saison noire ; une mousse qui colonise une machine',
    'VI': 'Les buffles albinos : laine blanche, yeux énormes ; le feu de savane qui les fait fuir (30 % d\'oxygène)',
    'VII': 'L\'eau rouge (fer, acide) qu\'on ne peut pas boire ; la toxine ; la respiration liquide (fait réel, ventilation au perfluorocarbone)',
    'VIII': 'Les lacs salés colorés par des microbes pourpres',
    'IX': 'Le message met des semaines à revenir de PERSEPHORA, des années s\'il venait de la Terre (11,4 ans)',
    'X': 'Ce qu\'il faut de matière pour faire un corps : les quatre pourcentages'
  };
  // Les quatre mots parlés (A02) et l'acte où ils tombent (Séquencier).
  var MOTS = [['VI', '« Rob ! »'], ['VII', '« Seed »'], ['VIII', '« Korê »'], ['IX', '« Je suis Seed »']];
  var fil = {};
  function mmss(m) { var s = Math.round(m * 60); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
  function construireFilm() {
    var r = $('#fil-ruban');
    [].slice.call(r.querySelectorAll('.seg,.graduation')).forEach(function (x) { x.remove(); });
    fil.segs = [];
    ACTES.forEach(function (a) {
      var s = el('div', { class: 'seg coeur' }, r); el('span', { text: a.a }, s);
      fil.segs.push({ el: s, d: a.c, coeur: true, a: a });
      a.mods.forEach(function (m) {
        var s2 = el('div', { class: 'seg module' }, r); el('span', { text: m[0] }, s2);
        fil.segs.push({ el: s2, d: m[2], coeur: false, a: a, m: m });
      });
    });
    fil.W = r.getBoundingClientRect().width;
    var mots = $('#fil-mots'); mots.innerHTML = '';
    fil.mots = MOTS.map(function (m) { return { a: m[0], el: el('div', { class: 'm', text: m[1] }, mots) }; });
    fil.grads = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map(function (v) { return { v: v, el: el('div', { class: 'graduation', text: v + ' min' }, r) }; });
    fil.cur = null;
  }
  SCENES.film = function (p) {
    var grow = ease(seg(p, .58, .9));
    var tot = 0;
    fil.segs.forEach(function (s) { s.w = s.coeur ? s.d : s.d * grow; tot += s.w; });
    var k = fil.W / Math.max(25, tot), x = 0;
    fil.segs.forEach(function (s) {
      s.x = x; s.el.style.left = x * k + 'px'; s.el.style.width = s.w * k + 'px';
      s.el.style.display = s.w < .01 ? 'none' : '';
      x += s.w;
    });
    fil.grads.forEach(function (g) { g.el.style.left = g.v * k + 'px'; g.el.style.opacity = g.v <= tot + .01 ? 1 : 0; });
    // tête de lecture sur le 25, puis sur le 55 qui grandit
    var tete, actCur = null, modCur = null;
    if (p < .55) {
      var tm = 25 * ease(seg(p, .03, .52)), acc = 0;
      fil.segs.forEach(function (s) { if (!s.coeur) return; if (tm >= acc - 1e-6) actCur = s; acc += s.d; });
      tete = 0; var a2 = 0;
      fil.segs.forEach(function (s) { if (s.coeur) { var u = clamp(tm - a2, 0, s.d); if (tm > a2) tete = s.x + u; a2 += s.d; } });
      $('#fil-n').textContent = mmss(tm);
      $('#fil-t').textContent = 'le film de 25 minutes';
      fil.mots.forEach(function (m) {
        var s = fil.segs.filter(function (q) { return q.coeur && q.a.a === m.a; })[0];
        var acc3 = 0; fil.segs.forEach(function (q) { if (q.coeur && q.x < s.x) acc3 += q.d; });
        m.el.style.left = (s.x + s.w / 2) * k + 'px';
        m.el.style.opacity = tm >= acc3 + s.d / 2 ? 1 : 0;
      });
    } else {
      tete = x * seg(p, .58, .9);
      fil.segs.forEach(function (s) { if (s.x <= tete + 1e-6) { if (s.coeur) actCur = s; else modCur = s; if (s.coeur) modCur = null; } });
      $('#fil-n').textContent = mmss(tot);
      $('#fil-t').textContent = grow < .02 ? 'le film de 25 minutes' : '25 minutes de cœur, ' + mmss(tot - 25) + ' de modules';
      fil.mots.forEach(function (m) {
        var s = fil.segs.filter(function (q) { return q.coeur && q.a.a === m.a; })[0];
        m.el.style.left = (s.x + s.w / 2) * k + 'px'; m.el.style.opacity = 1 - grow * .6;
      });
    }
    $('#fil-tete').style.left = tete * k + 'px';
    var cle = (actCur ? actCur.a.a : '') + '|' + (modCur ? modCur.m[0] : '') + '|' + (p < .55);
    if (cle !== fil.cur) {
      fil.cur = cle;
      var a = actCur ? actCur.a : ACTES[0];
      var html = '<div><div class="t">' + (a.a === 'Prologue' ? 'Prologue' : 'Acte ' + a.a) + ' · ' + mmss(a.c) + '</div><h3>' + esc(a.t) + '</h3></div>';
      if (p < .55) {
        html += '<div><div class="t">Science en image</div><p>' + esc(SCIENCE[a.a]) + '</p></div>';
        html += '<div><div class="t">Modules du 55 à cet endroit</div><p>' + (a.mods.length ? a.mods.map(function (m) { return esc(m[0] + ' · ' + m[1]); }).join('<br>') : '<span class="manque">Aucun : la scène est écrite une fois, à sa longueur définitive.</span>') + '</p></div>';
      } else {
        html += '<div><div class="t">Ajouté dans le 55</div><p>' + (modCur ? esc(modCur.m[0] + ' · ' + modCur.m[1] + ' · ' + mmss(modCur.m[2])) : '<span class="manque">Rien : séquence-cœur, la même dans les deux films.</span>') + '</p></div>';
        html += '<div><div class="t">La règle</div><p>Le 55 s\'obtient par ajout, jamais par remontage. Les actes I, III et IX ne reçoivent aucun module.</p></div>';
      }
      $('#fil-lecture').innerHTML = html;
    }
  };

  /* ------------------------------------------------------------------ 11 script */
  function construireScript() {
    var m = $('#scr-monte'); m.innerHTML = '';
    SE.acte_ix.forEach(function (par) {
      var cls = /^\(/.test(par) ? 'didasc' : (/^«/.test(par) ? 'dial' : '');
      // les écrans de Rob1 (suites de mots en capitales) en caractères d'écran
      var h = esc(par).replace(/(?:[A-ZÀ-ÖØ-Þ0-9][A-ZÀ-ÖØ-Þ0-9\-,.%:\/+>]*(?: (?=[A-ZÀ-ÖØ-Þ0-9:>])|(?=[^a-zà-ÿ]|$)))+/g, function (x) {
        var t = x.trim();
        if (!/[A-ZÀ-ÖØ-Þ]{3,}/.test(t) || /[a-zà-ÿ]/.test(t)) return x;
        return '<span class="ecr">' + t + '</span>' + (x.length > t.length ? ' ' : '');
      });
      el('p', { class: cls, html: h }, m);
    });
  }
  SCENES.script = function (p) {
    var vh = innerHeight, m = $('#scr-monte'), h = m.offsetHeight;
    var y = lerp(vh * .9, -h + vh * .3, seg(p, .02, .97));
    m.style.transform = 'translate(-50%,' + y + 'px)';
    [].forEach.call(m.children, function (c) {
      var r = c.getBoundingClientRect(); var mm = (r.top + r.height / 2) / vh;
      var a = clamp(1 - Math.abs(mm - .5) * 2.1, 0, 1);
      c.style.opacity = lerp(.12, 1, a);
    });
    var mot = $('#scr-mot');
    var hot = [].filter.call(m.children, function (c) { var r = c.getBoundingClientRect(); return /NON VIABLE/.test(c.textContent) && r.top < vh * .7 && r.bottom > vh * .3; }).length;
    mot.style.color = hot ? 'color-mix(in srgb, var(--orange) 15%, transparent)' : '';
    mot.style.transform = 'translate(-50%,-50%) translateY(' + lerp(8, -8, p) + 'vh)';
  };

  /* ------------------------------------------------------------------ 12 journal */
  var ECHOS = ['FOUND', 'CRITICAL', 'IMPOSSIBLE', 'IM POSSIBLE', '11.4', 'KORÊ', 'ROB4', 'BATTERY', 'INCUBATION', '23 %', '21 %', 'NOT VIABLE', 'PERSEPHORA'];
  var GROUPES = { 'IM POSSIBLE': 'IMPOSSIBLE', '23 %': 'MEMORY', '21 %': 'MEMORY' };
  // Le sujet des phrases (Journal de Rob1, « Le registre de la voix »).
  var SUJETS = [
    ['P-01', '—', 'Actes I à IV : pas de sujet. Le rapport parle de lui-même.', 'Sample received. Analysis: pass.'],
    ['5-10', 'Seed', 'Acte V, à partir de l\'étiquette IMPORTANT : « the subject » devient « Seed ». Une seule fois d\'abord, puis toujours.', 'minor → IMPORTANT'],
    ['7-16', 'I', 'Acte VII, à la mer d\'arsenic : le premier « I ».', 'I have no antidote.'],
    ['9-11', 'we', 'Acte IX : « we ».', 'We are alone now.'],
    ['9-12', '—', 'Puis, dans le rapport officiel, le retour au registre sans sujet, pour mentir. Le mensonge est écrit dans la langue du début.', 'FINAL EVALUATION: NOT VIABLE.'],
    ['10-06', '—', 'Le carton final.', 'Take care of it.']
  ];
  var jou = {};
  function construireJournal() {
    var col = $('#jou-col'); col.innerHTML = '';
    jou.rows = SE.journal.map(function (r) {
      var h = esc(r.texte).replace(/ \/ /g, '<br>');
      ECHOS.forEach(function (w) {
        var re = new RegExp('(^|[^A-Z])(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?![A-Z])', 'g');
        h = h.replace(re, '$1<em class="ech" data-w="' + (GROUPES[w] || w) + '">$2</em>');
      });
      var d = el('div', { class: 'ec', html: '<span class="pl">' + esc(r.plan) + '</span><span class="tx">' + h + '</span>' }, col);
      return { el: d, r: r };
    });
    var svg = sv('svg', { class: 'arcs', width: 300, height: col.offsetHeight }, col);
    jou.arcs = [];
    var vus = {};
    col.querySelectorAll('em.ech').forEach(function (e) {
      var w = e.dataset.w; var y = e.offsetTop + e.offsetHeight / 2 + e.closest('.ec').offsetTop - e.closest('.ec').offsetTop;
      var ec = e.closest('.ec'); y = ec.offsetTop + e.offsetTop - ec.offsetTop + e.offsetHeight / 2;
      if (vus[w] !== undefined) {
        var y0 = vus[w].y, dy = y - y0;
        if (dy > 4) {
          var rx = Math.min(24 + dy * .16, 420);
          var pth = sv('path', { d: 'M8 ' + y0 + ' C ' + (8 + rx) + ' ' + y0 + ', ' + (8 + rx) + ' ' + y + ', 8 ' + y, fill: 'none', stroke: css('--fil-fort'), 'stroke-width': 1 }, svg);
          jou.arcs.push({ p: pth, y0: y0, y1: y, a: vus[w].e, b: e });
        }
      }
      vus[w] = { y: y, e: e };
    });
    jou.H = col.offsetHeight;
    jou.sujet = null;
  }
  SCENES.journal = function (p) {
    var vh = innerHeight, col = $('#jou-col');
    var y = lerp(vh * .55, -jou.H + vh * .45, seg(p, .02, .98));
    col.style.transform = 'translateY(' + y + 'px)';
    var centre = vh * .5 - y, actif = null;
    jou.rows.forEach(function (o) {
      var top = o.el.offsetTop, h = o.el.offsetHeight;
      var on = top <= centre && top + h > centre;
      o.el.classList.toggle('vif', on);
      if (top <= centre) actif = o;
    });
    var orange = css('--orange'), fil2 = css('--fil-fort');
    // un écho s'allume quand on lit l'un de ses deux mots
    jou.arcs.forEach(function (a) {
      a.on = Math.abs(centre - a.y0) < 90 || Math.abs(centre - a.y1) < 90;
      a.p.setAttribute('stroke', a.on ? orange : fil2);
      a.p.setAttribute('stroke-width', a.on ? 1.5 : 1);
      a.p.setAttribute('opacity', a.on ? 1 : .45);
      a.a.style.color = ''; a.b.style.color = '';
    });
    jou.arcs.forEach(function (a) { if (a.on) { a.a.style.color = orange; a.b.style.color = orange; } });
    // sujet courant
    var plan = actif ? actif.r.plan : 'P-01', idx = jou.rows.indexOf(actif), s = SUJETS[0];
    SUJETS.forEach(function (x) {
      var i = -1; jou.rows.forEach(function (o, k) { if (o.r.plan === x[0]) i = k; });
      if (idx >= i) s = x;
    });
    if (s !== jou.sujet) {
      jou.sujet = s;
      var b = $('#jou-sujet');
      $('.n', b).textContent = s[1]; $('p', b).textContent = s[2]; $('.ex', b).textContent = s[3];
      $('.n', b).style.color = s[1] === '—' ? 'var(--pale)' : 'var(--encre)';
    }
  };

  /* ------------------------------------------------------------------ 13 salle */
  var TEMPS = [
    ['1 · L\'orbite', 1.5, 'La planète entière, les codes de mission, les quatre signatures qui s\'allument sur le continent A ; les capsules qui descendent', 'Le visiteur choisit le site : les autres continents répondent « NON » avec leur raison ; A répond « OUI »'],
    ['2 · Phase 1', 4, 'Les Robs explorent, point de vue par point de vue : la grotte à guano, la forêt bioluminescente, la fosse ; les drones qui reviennent', 'Contemplatif ; le journal de Rob1 tient le fil'],
    ['3 · Le sinkhole', 1, 'Le sol qui cède, le mât-relais qui bascule ; le silence ; les balises des robopods qui clignotent seules', 'Rien : la salle s\'éteint presque'],
    ['4 · La lumière comme langue', 3, 'La caverne des plantes-chant, puis la forêt bioluminescente en saison noire', 'Le visiteur éclaire ; les plantes répondent par pulsations, avec le code de Rob4'],
    ['5 · Il y a 60 millions d\'années', 2, 'Les Titans vivants, l\'étoile de passage, la pluie de comètes, le squelette qui finit dans la voûte', 'Contemplatif'],
    ['6 · Korê', 2, 'La course volcanique vue du tank, la mer d\'arsenic, Rob4 qui remonte ; puis les lacs pourpres, la colonie qui décolle', 'Le rapport final de Rob1, NON VIABLE ; le carton final']
  ];
  var sal = {};
  function construireSalle() {
    var s = $('#sal-svg'); s.innerHTML = '';
    var W = innerWidth, H = innerHeight, cx = W / 2, cy = H / 2, R = Math.min(H * .3, W * .16);
    s.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    sal.g = sv('g', {}, s);
    var tot = 13.5, a = 0;
    sal.segs = TEMPS.map(function (t) {
      var a0 = a, a1 = a + 2 * Math.PI * t[1] / tot; a = a1;
      var pth = sv('path', { d: arc(0, 0, R, a0 + .02, a1 - .02), fill: 'none', stroke: css('--fil-fort'), 'stroke-width': 18 }, sal.g);
      var am = (a0 + a1) / 2;
      var tx = sv('text', { x: (R + 40) * Math.cos(am), y: (R + 40) * Math.sin(am), 'text-anchor': 'middle', 'dominant-baseline': 'middle', class: 'cote' }, sal.g);
      tx.textContent = t[0].split(' · ')[0];
      return { p: pth, am: am, t: t, tx: tx };
    });
    for (var m = 0; m < 13.5; m += .5) {
      var aa = 2 * Math.PI * m / tot, l = m % 1 === 0 ? 10 : 5;
      sv('line', { x1: (R - 22) * Math.cos(aa), y1: (R - 22) * Math.sin(aa), x2: (R - 22 - l) * Math.cos(aa), y2: (R - 22 - l) * Math.sin(aa), stroke: css('--fil'), 'stroke-width': 1 }, sal.g);
    }
    sal.g.setAttribute('transform', 'translate(' + cx + ' ' + cy + ')');
    // le regard du visiteur, vers le haut
    sv('path', { d: 'M' + cx + ' ' + cy + ' L' + (cx - R * .62) + ' ' + (cy - R * .9) + ' M' + cx + ' ' + cy + ' L' + (cx + R * .62) + ' ' + (cy - R * .9), stroke: css('--orange'), 'stroke-width': 1, opacity: .7 }, s);
    sal.cx = cx; sal.cy = cy;
    sal.cur = -1;
  }
  SCENES.salle = function (p) {
    var tot = 13.5, m = 13.5 * seg(p, .04, .96), i = 0, acc = 0;
    TEMPS.forEach(function (t, k) { if (m >= acc) i = k; acc += t[1]; });
    var rot = -90 - 360 * m / tot;
    sal.g.setAttribute('transform', 'translate(' + sal.cx + ' ' + sal.cy + ') rotate(' + rot + ')');
    sal.segs.forEach(function (s, k) {
      s.p.setAttribute('stroke', k === i ? css('--orange') : css('--fil-fort'));
      s.p.setAttribute('stroke-width', k === i ? 18 : 10);
      var ang = -rot;
      s.tx.setAttribute('transform', 'rotate(' + ang + ' ' + s.tx.getAttribute('x') + ' ' + s.tx.getAttribute('y') + ')');
    });
    $('#sal-centre .n').textContent = mmss(m);
    if (i !== sal.cur) {
      sal.cur = i;
      var t = TEMPS[i];
      $('#sal-g').innerHTML = '<p class="pale" style="font-size:13px;letter-spacing:.06em;text-transform:uppercase;margin:0 0 .6em">Temps ' + esc(t[0].split(' · ')[0]) + ' · ' + mmss(t[1]) + '</p><h3>' + esc(t[0].split(' · ')[1]) + '</h3><p>' + esc(t[2]) + '</p>';
      $('#sal-d').innerHTML = '<p class="pale" style="font-size:13px;letter-spacing:.06em;text-transform:uppercase;margin:0 0 .6em">Ce que fait le visiteur</p><p style="font-size:22px">' + esc(t[3]) + '</p>';
    }
  };

  /* ------------------------------------------------------------------ 14 expo */
  var CARTELS = [
    ['L\'élément le plus rare de la vie', 'le phosphore est dans chaque cellule, chaque os, chaque brin d\'ADN.', 'Rob2 le cherche dans les grottes.', 'c\'est le plus rare des six éléments du vivant, environ mille fois moins abondant que le carbone dans l\'univers.'],
    ['Un trésor qui fuit', 'le phosphore des engrais finit en mer, hors d\'atteinte pour des millions d\'années.', 'la tectonique soulève d\'anciens fonds marins et le rend à la surface.', 'le même cycle existe sur Terre, mais il est bien plus lent que notre consommation.'],
    ['Une île de phosphate', 'l\'île Christmas, administrée depuis Singapour jusqu\'en 1958, a été exploitée pour son phosphate.', 'les chauves-souris cristallines en fabriquent dans leurs grottes.', 'le guano, les déjections accumulées d\'oiseaux ou de chauves-souris, est l\'une des grandes sources naturelles de phosphate.'],
    ['Ne rien emporter', 'on imagine d\'envoyer des colons avec leurs réserves.', 'la mission n\'envoie que des embryons de quelques grammes.', 'chaque kilo de matière vivante pris sur Terre manque à la biosphère terrestre, et un adulte ne survivrait pas à 53 ans d\'apesanteur.'],
    ['Pourquoi pas Mars ?', 'on parle de terraformer Mars.', 'tout est déjà là.', 'Mars a du phosphore, mais presque pas d\'azote, une atmosphère cent fois trop fine et aucun bouclier magnétique.'],
    ['Le piège de l\'arsenic', 'une « vie à l\'arsenic » annoncée en 2010 s\'est révélée fausse.', 'la vie de la mer d\'arsenic sait le trier.', 'l\'arsenic imite le phosphore, mais ses liaisons se défont dans l\'eau.']
  ];
  function maj(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function construireCartels() {
    var c = $('#cartels'); c.innerHTML = '';
    CARTELS.forEach(function (k, i) {
      el('div', { class: 'cartel', html: '<h3>' + (i + 1) + '. ' + esc(k[0]) + '</h3><div><div class="t">SUR TERRE</div><p>' + esc(maj(k[1])) + '</p></div><div><div class="t">SUR KORÊ</div><p>' + esc(maj(k[2])) + '</p></div><div><div class="t">POURQUOI</div><p>' + esc(maj(k[3])) + '</p></div>' }, c);
    });
    el('div', { class: 'espace' }, c);
  }

  /* ------------------------------------------------------------------ fin */
  SCENES.fin = function (p) {
    var l = document.querySelectorAll('#fin .lignes div');
    for (var i = 0; i < l.length; i++) l[i].style.opacity = seg(p, .08 + i * .25, .25 + i * .25);
  };

  /* ------------------------------------------------------------------ démarrage */
  function construireTout() {
    construireVoyage(); construireChiffres(); chiCourant = -1; construireCiel(); construireMarees();
    construireTrajet(); traActe = null; construireFrise(); construireBiomes(); bioCourant = -1;
    construireEspeces(); construireTitans(); construireScience(); construireFilm();
    construireScript(); construireJournal(); construireSalle(); construireCartels();
  }
  function demarrer() { construireTout(); relance(); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(demarrer); else addEventListener('load', demarrer);
  // pour les captures : window.__allerA(id, p) place la page à l'instant p d'une piste
  window.__allerA = function (id, p) {
    var s = document.getElementById(id), len = s.offsetHeight - innerHeight;
    scrollTo(0, s.offsetTop + len * p); cible();
    pistes.forEach(function (q) { q._p = -1; });
    reduit = true; boucle(); reduit = false;
  };
})();
