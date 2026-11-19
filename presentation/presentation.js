/* Second Earth · présentation « L'étude ». Les pistes sont celles du kit étude (KitEtude.piste) ;
   chaque scène se dessine à partir de t, de 0 à 1, et reste pleine et lisible à tout instant. */
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

  /* ------------------------------------------------------------------ moteur
     Les pistes sont celles du kit (KitEtude.piste) : chaque .ke-scene reçoit t de 0 à 1 par scene._t. */

  var SCENES = {};
  var NUM = ['P', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  var pistes = [].slice.call(document.querySelectorAll('.ke-piste[data-scene]'));
  function scene(id) { return document.querySelector('#' + id + ' .ke-scene'); }
  function largeur(id) { return scene(id).clientWidth; }
  function hauteur(id) { return scene(id).clientHeight; }
  // une couleur du thème, résolue (les attributs SVG ne lisent pas color-mix)
  var sonde = document.createElement('i'); sonde.style.display = 'none'; document.body.appendChild(sonde);
  function jeton(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function css(name) { sonde.style.color = 'var(' + name + ')'; return getComputedStyle(sonde).color; }

  /* où l'on est : la barre des parties, le trait d'avancée */
  var parties = [].slice.call(document.querySelectorAll('[data-chapitre][data-nom]'));
  var nav = $('#chapitres');
  parties.forEach(function (p, i) {
    if (p.dataset.chapitre === 'ouverture' || p.dataset.chapitre === 'fin') return;
    var num = p.querySelector('.ke-sur b');
    el('a', { href: '#' + p.id, 'data-c': p.dataset.chapitre, html: '<b>' + (num ? esc(num.textContent) : '00') + '</b><span>' + esc(p.dataset.nom) + '</span>' }, nav);
  });
  var liens = [].slice.call(nav.children), toutes = [].slice.call(document.querySelectorAll('[data-chapitre]'));
  function ou() {
    var h = document.documentElement, total = h.scrollHeight - innerHeight;
    $('#avance').style.width = (total > 0 ? Math.min(100, h.scrollTop / total * 100) : 0) + '%';
    var ici = toutes[0];
    toutes.forEach(function (p) { if (p.getBoundingClientRect().top < innerHeight * .45) ici = p; });
    liens.forEach(function (a) { a.classList.toggle('ici', a.dataset.c === ici.dataset.chapitre); });
  }
  addEventListener('scroll', ou, { passive: true });

  /* sommaire */
  (function () {
    var ol = $('#liste-sommaire');
    parties.forEach(function (p) {
      var num = p.querySelector('.ke-sur b'), h = p.querySelector('h2');
      if (!num || !h || p.id === 'sommaire') return;
      el('li', { html: '<b>' + esc(num.textContent) + '</b><a href="#' + p.id + '">' + esc(p.dataset.nom) + '<small>' + esc(h.textContent) + '</small></a>' }, ol);
    });
  })();

  /* ------------------------------------------------------------------ 00 ouverture */
  SCENES.ouverture = function (p) {
    var sc = scene('ouv').getBoundingClientRect(), vh = sc.height;
    var monte = $('#ouv-monte'), h = monte.offsetHeight;
    var y = lerp(vh * .38, -h - vh * .05, ease(seg(p, 0, .8)));
    monte.style.transform = 'translate(-50%,' + y + 'px)';
    [].forEach.call(monte.children, function (c) {
      var r = c.getBoundingClientRect(), m = (r.top + r.height / 2 - sc.top) / vh;
      c.style.opacity = clamp(1 - Math.abs(m - .45) * 1.6, .08, 1);
    });
    $('#ouv-mot').style.transform = 'translate(-50%,-50%) scale(' + lerp(1, .94, p) + ')';
    var f = seg(p, .78, .95), fin = $('#ouv-fin');
    fin.style.opacity = f; fin.style.transform = 'translateY(' + (1 - f) * 24 + 'px)';
  };

  /* ------------------------------------------------------------------ 01 voyage */
  var voy = {};
  function construireVoyage() {
    var s = $('#voy-svg'); s.innerHTML = '';
    var w = s.getBoundingClientRect().width;
    voy.w = w;
    sv('line', { x1: 0, x2: w, y1: 30, y2: 30, stroke: css('--trait-vu'), 'stroke-width': 1 }, s);
    for (var i = 0; i <= 53; i++) {
      var x = w * i / 53;
      sv('line', { x1: x, x2: x, y1: i % 10 === 5 ? 18 : 24, y2: 36, stroke: css('--trait-vu'), 'stroke-width': 1 }, s);
    }
    voy.trait = sv('line', { x1: 0, x2: 0, y1: 30, y2: 30, stroke: css('--or'), 'stroke-width': 2 }, s);
    voy.pt = sv('circle', { cx: 0, cy: 30, r: 6, fill: css('--or') }, s);
    sv('circle', { cx: 0, cy: 30, r: 4, fill: css('--ink') }, s);
    sv('circle', { cx: w, cy: 30, r: 7, fill: 'none', stroke: css('--ink'), 'stroke-width': 1 }, s);
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
    ['4 500', 'K', 'La lumière à midi', '<span class="ke-deduit">Proposé</span> : ~90 % de l\'éclairement terrestre, ciel bleu pâle laiteux, crépuscules rouges de plus d\'une heure.']
  ];
  function construireChiffres() {
    var pose = $('#chi-pose'); pose.innerHTML = '';
    CHIFFRES.forEach(function (c) {
      el('div', { html: '<b>' + esc(c[0]) + ' ' + esc(c[1]) + '</b><span>' + esc(c[2]) + '</span>' }, pose);
    });
  }
  var chiCourant = -1;
  SCENES.chiffres = function (p) {
    var n = CHIFFRES.length, f = p * n, i = clamp(Math.floor(f), 0, n - 1), loc = clamp(f - i, 0, 1);
    var rows = $('#chi-pose').children;
    for (var k = 0; k < n; k++) { rows[k].classList.toggle('passe', k < i); rows[k].classList.toggle('ici', k === i); }
    var cur = $('#chi-courant');
    if (i !== chiCourant) {
      chiCourant = i;
      var c = CHIFFRES[i];
      $('.n', cur).innerHTML = esc(c[0]) + (c[1] ? '<span class="u">' + esc(c[1]) + '</span>' : '');
      $('.l', cur).textContent = c[2];
      $('.t', cur).innerHTML = c[3];
    }
    // le chiffre se pose : il arrive d'un peu plus bas, puis reste
    var a = ease(clamp(loc / .3, 0, 1));
    cur.style.opacity = lerp(.35, 1, a);
    cur.style.transform = 'translateY(calc(-50% + ' + (1 - a) * 26 + 'px))';
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
    var W = largeur('cie'), H = hauteur('cie');
    var cx = W * .36, cy = H * .5, R = Math.min(H * .36, W * .26);
    cie.cx = cx; cie.cy = cy; cie.R = R;
    s.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    PHASES.forEach(function (ph, i) {
      var a0 = angJour(ph[0]) + .012, a1 = angJour(ph[1]) - .012;
      sv('path', { d: arc(cx, cy, R, a0, a1), fill: 'none', stroke: i === 1 ? css('--pale') : css('--amb'), 'stroke-width': i === 1 ? 1 : 1.2, 'stroke-dasharray': i === 1 ? '' : '2 5', opacity: i === 1 ? 1 : .8 }, s);
      var am = (angJour(ph[0]) + angJour(ph[1])) / 2, rl = R + 46;
      var t = sv('text', { x: cx + rl * Math.cos(am), y: cy + rl * Math.sin(am), 'text-anchor': Math.cos(am) > .2 ? 'start' : (Math.cos(am) < -.2 ? 'end' : 'middle'), 'dominant-baseline': 'middle', class: 'cote' }, s);
      t.textContent = ph[2] + ' · ~29 j';
    });
    for (var d = 0; d < 116; d++) {
      var a = angJour(d), l = d % 10 === 0 ? 9 : 4;
      sv('line', { x1: cx + (R - l) * Math.cos(a), y1: cy + (R - l) * Math.sin(a), x2: cx + R * Math.cos(a), y2: cy + R * Math.sin(a), stroke: css('--trait-vu'), 'stroke-width': 1 }, s);
    }
    cie.voy = sv('path', { d: '', fill: 'none', stroke: css('--or'), 'stroke-width': 3, 'stroke-linecap': 'round' }, s);
    cie.pt = sv('circle', { r: 6, fill: css('--or') }, s);
    cie.evts = EVTS_CIEL.map(function (e) {
      var a = angJour(e[0]), r1 = R - 26;
      var g = sv('g', { opacity: 0 }, s);
      sv('line', { x1: cx + (R - 6) * Math.cos(a), y1: cy + (R - 6) * Math.sin(a), x2: cx + r1 * Math.cos(a), y2: cy + r1 * Math.sin(a), stroke: css('--ink'), 'stroke-width': 1 }, g);
      var t = sv('text', { x: cx + (r1 - 8) * Math.cos(a), y: cy + (r1 - 8) * Math.sin(a), 'text-anchor': Math.cos(a) > .3 ? 'end' : (Math.cos(a) < -.3 ? 'start' : 'middle'), 'dominant-baseline': Math.sin(a) > .3 ? 'auto' : 'hanging', class: 'cote-f' }, g);
      t.textContent = e[1];
      if (/lune/.test(e[1])) {
        var plein = /pleine/.test(e[1]);
        sv('circle', { cx: cx + (R + 18) * Math.cos(a), cy: cy + (R + 18) * Math.sin(a), r: 7, fill: plein ? css('--ink') : 'none', stroke: css('--ink'), 'stroke-width': 1 }, g);
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
    EVTS_CIEL.forEach(function (e, i) { cie.evts[i].setAttribute('opacity', d >= e[0] - .01 ? 1 : .28); });
    var ph = PHASES[d < 3 ? 0 : (d < 32 ? 1 : 2)];
    var ev = null; EVTS_CIEL.forEach(function (e) { if (d >= e[0] - .01) ev = e; });
    var html = '<p class="ke-sur"><b>61 Cygni B</b><span class="ke-deduit">proposé</span></p><h3>' + esc(ph[2]) + '</h3><p class="ke-dit">' + esc(ph[3]) + '</p>' +
      (ev ? '<p class="ke-petit" style="margin-top:2.4em">' + esc(ev[1]) + '</p><p class="ke-texte" style="margin-top:6px">' + esc(ev[2]) + '</p>' : '');
    if (cie.html !== html) { cie.html = html; $('#cie-panneau').innerHTML = html; }
  };

  /* ------------------------------------------------------------------ 04 marées */
  var mar = {};
  function construireMarees() {
    var s = $('#mar-svg'); s.innerHTML = '';
    var W = largeur('mar'), H = hauteur('mar');
    s.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var k = Math.min(H * .4, W * .22) / 10;
    mar.k = k;
    var cxT = W * .24, cxK = W * .64, cy = H * .5;
    function cercle(cx, v, cls) { return sv('circle', { cx: cx, cy: cy, r: v * k, fill: 'none', stroke: css(cls), 'stroke-width': 1 }, s); }
    function txt(x, y, t, cl, anc) { var e = sv('text', { x: x, y: y, class: cl || 'cote', 'text-anchor': anc || 'middle' }, s); e.textContent = t; return e; }
    mar.terre = sv('g', {}, s);
    var gT = mar.terre;
    sv('circle', { cx: cxT, cy: cy, r: 1 * k, fill: 'none', stroke: css('--ink'), 'stroke-width': 1 }, gT);
    sv('circle', { cx: cxT, cy: cy, r: .46 * k, fill: 'none', stroke: css('--pale'), 'stroke-width': 1 }, gT);
    sv('circle', { cx: cxT, cy: cy, r: 1.46 * k, fill: 'none', stroke: css('--ink'), 'stroke-width': 1, 'stroke-dasharray': '2 4' }, gT);
    var t1 = sv('text', { x: cxT, y: cy - 1.46 * k - 16, class: 'cote-f', 'text-anchor': 'middle' }, gT); t1.textContent = 'Terre · vives-eaux 1,46';
    var t2 = sv('text', { x: cxT, y: cy + 1.46 * k + 26, class: 'cote', 'text-anchor': 'middle' }, gT); t2.textContent = 'Lune 1 · Soleil 0,46';
    mar.items = [
      { v: 5.3, t: 'Grande lune · 5,3', cls: '--ink', dash: '' },
      { v: 4.7, t: 'Étoile, 61 Cygni A à 0,41 UA · 4,7', cls: '--pale', dash: '' },
      { v: .6, t: 'Petite lune · 0,6', cls: '--pale', dash: '' },
      { v: 10, t: 'Vives-eaux, tout aligné · ~10', cls: '--or', dash: '2 5' }
    ].map(function (it, i) {
      sv('circle', { cx: cxK, cy: cy, r: it.v * k, fill: 'none', stroke: css('--trait'), 'stroke-width': 1, 'stroke-dasharray': '1 5' }, s);
      var g = sv('g', { opacity: .35 }, s);
      var c = sv('circle', { cx: cxK, cy: cy, r: 0, fill: 'none', stroke: css(it.cls), 'stroke-width': it.v === 10 ? 1.5 : 1, 'stroke-dasharray': it.dash }, g);
      var ang = [-.95, -.55, .3, -1.35][i];
      var tx = sv('text', { x: cxK + it.v * k * Math.cos(ang) + 12, y: cy + it.v * k * Math.sin(ang), class: it.v === 10 ? 'cote-f cote-or' : 'cote-f', 'text-anchor': 'start' }, g);
      tx.textContent = it.t;
      if (it.v === .6) tx.setAttribute('x', cxK + 30), tx.setAttribute('y', cy + 4);
      return { g: g, c: c, v: it.v };
    });
    mar.titre = txt(cxK, cy + 10 * k + 40, 'Korê', 'cote-f');
    mar.fois = sv('text', { x: W * .93, y: H * .24, class: 'grand-chiffre', 'font-size': H * .17, 'text-anchor': 'end', opacity: .15 }, s);
    mar.fois.textContent = '× 7';
  }
  SCENES.marees = function (p) {
    mar.terre.setAttribute('opacity', 1);
    var spans = [[.22, .42], [.47, .62], [.62, .7], [.75, .92]];
    mar.items.forEach(function (it, i) {
      var t = ease(seg(p, spans[i][0], spans[i][1]));
      it.g.setAttribute('opacity', lerp(.35, 1, t));
      it.c.setAttribute('r', it.v * mar.k * t);
    });
    mar.fois.setAttribute('opacity', lerp(.15, 1, seg(p, .82, .95)));
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
    sv('image', { href: 'img/corridor.jpg', x: 0, y: 0, width: T.w, height: T.h, preserveAspectRatio: 'none', style: 'filter:' + jeton('--carte-filtre') }, gb);
    sv('image', { href: 'img/corridor.jpg', x: 0, y: 0, width: T.w, height: T.h, preserveAspectRatio: 'none', mask: 'url(#masque)', style: 'filter:' + jeton('--carte-couleur') }, s);
    tra.path = sv('path', { d: d, fill: 'none', stroke: css('--or'), 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s);
    tra.len = tra.path.getTotalLength();
    [tra.path, tra.mpath].forEach(function (q) { q.style.strokeDasharray = tra.len + ' ' + tra.len; q.style.strokeDashoffset = tra.len; });
    tra.tete = sv('circle', { r: 8, fill: css('--or') }, s);
    // marques d'acte : position le long du tracé
    var cum = T.cum, tot = cum[cum.length - 1];
    tra.marques = T.acts.map(function (a) {
      var best = 0, bd = 1e9;
      T.path.forEach(function (q, i) { var dd = Math.hypot(q[0] - a.p[0], q[1] - a.p[1]); if (dd < bd && (a.id !== 'IX' || i > T.path.length / 2)) { bd = dd; best = i; } });
      var g = sv('g', { opacity: 0, class: 'marque' }, s);
      sv('circle', { cx: a.p[0], cy: a.p[1], r: 5, fill: css('--ink') }, g);
      var lb = a.id === 'P' ? '' : a.id;
      var t = sv('text', { x: a.p[0] + 12, y: a.p[1] - 10, class: 'cote-f', 'font-size': 24 }, g);
      t.textContent = lb === 'C' ? 'course' : (lb === 'R4' ? 'mer' : (lb === 'K' ? 'Korê' : lb));
      g.addEventListener('click', function () { montrerActe(a); });
      return { a: a, g: g, f: cum[best] / tot };
    });
    tra.robs = T.robs.map(function (r) {
      var g = sv('g', { opacity: 0 }, s);
      sv('circle', { cx: r.p[0], cy: r.p[1], r: 15, fill: 'none', stroke: css('--or'), 'stroke-width': 1.5 }, g);
      var t = sv('text', { x: r.p[0] + 20, y: r.p[1] + 24, class: 'cote', 'font-size': 20 }, g); t.textContent = r.id;
      return g;
    });
    tra.tot = tot;
  }
  function montrerActe(a) {
    var box = $('#tra-acte');
    $('.ke-sur', box).textContent = a.t; $('.ke-dit', box).textContent = a.d;
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
    tra.marques.forEach(function (m) { var on = t >= m.f - .002; m.g.setAttribute('opacity', on ? 1 : .3); if (on) cur = m; });
    if (t < .001) cur = tra.marques[0];
    tra.robs.forEach(function (g) { g.setAttribute('opacity', 1); });
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
      lect.innerHTML = '<div><p class="ke-petit">Jour</p><div class="gros">' + Math.floor(d) + '</div></div>' +
        '<div><p class="ke-petit">Acte</p><div class="v">' + esc(r[2]) + '</div><p class="ke-petit" style="margin-top:14px">Où, distance</p><div class="v">' + esc(r[3]) + '</div></div>' +
        '<div><p class="ke-petit">Ce qui se passe</p><div class="v">' + esc(r[4]) + '</div></div>' +
        '<div><p class="ke-petit">Ciel <span class="ke-deduit">proposé</span></p><div class="v">' + esc(r[5]) + '</div></div>';
    }
    function depuis(e) { var rc = j.getBoundingClientRect(); poser(41 * (e.clientX - rc.left) / rc.width); }
    var tir = false;
    j.addEventListener('pointerdown', function (e) { tir = true; j.setPointerCapture(e.pointerId); depuis(e); });
    j.addEventListener('pointermove', function (e) { if (tir) depuis(e); });
    j.addEventListener('pointerup', function () { tir = false; });
    poser(7);
  }

  /* ------------------------------------------------------------------ 06 biomes */
  // le ciel des 41 jours (Chronologie du voyage, proposé) : soirées ambrées, saison noire, aubes ambrées ;
  // la grande lune (validé, round 15) : pleine au jour 7, nouvelle au jour 25, presque pleine au retour
  var CIEL = [[0, 3, 'soirées ambrées'], [3, 32, 'saison noire'], [32, 41, 'aubes ambrées']];
  var LUNES = [[7, 'pleine'], [25, 'nouvelle'], [41, 'presque pleine']];
  function mixe(a, b, t) { return 'color-mix(in srgb, ' + a + ' ' + Math.round(t * 100) + '%, ' + b + ')'; }
  function construireBiomes() {
    var ciel = $('#bio-ciel'); ciel.innerHTML = '';
    CIEL.forEach(function (c) {
      var d = el('div', { class: 'phase' + (c[2] === 'saison noire' ? ' noire' : ''), style: 'left:' + (100 * c[0] / 41) + '%;width:' + (100 * (c[1] - c[0]) / 41) + '%' }, ciel);
      el('span', { text: c[2] }, d);
    });
    LUNES.forEach(function (l) { var d = el('div', { class: 'lune ' + (l[1] === 'nouvelle' ? 'nouvelle' : 'pleine'), style: 'left:' + (100 * l[0] / 41) + '%' }, ciel); el('span', { text: 'j' + l[0] + ' · ' + l[1] }, d); });
    var bb = $('#bio-bandes'); bb.innerHTML = '';
    var pourpre = couleur('jungle'), vert = couleur('ancienne');
    BIOMES.forEach(function (b) {
      var d = el('div', { style: 'flex:' + (b.j[1] - b.j[0]) + ' 1 0' }, bb);
      var c = couleur(b.c);
      // la lumière vient d'en haut ; les deux lignées végétales : pourpre en haut, vert dessous (Bible)
      el('div', { class: 'c', style: 'background:' +
        'radial-gradient(ellipse 120% 40% at 50% 0%, color-mix(in srgb, var(--ink) 22%, transparent), transparent 70%),' +
        'linear-gradient(180deg,' + mixe(pourpre, c, .45) + ' 0%,' + c + ' 26%,' + c + ' 70%,' + mixe(vert, c, .42) + ' 100%)' }, d);
      el('div', { class: 'n', text: 'j' + b.j[0] }, d);
    });
  }
  var bioCourant = -1;
  SCENES.biomes = function (p) {
    var n = BIOMES.length, kids = $('#bio-bandes').children, cur = clamp(Math.floor(p * n), 0, n - 1);
    for (var i = 0; i < n; i++) {
      var c = $('.c', kids[i]);
      c.style.height = (i === cur ? 100 : (i < cur ? 64 : 42)) + '%';
      c.style.opacity = i === cur ? 1 : (i < cur ? .8 : .5);
      kids[i].classList.toggle('ici', i === cur);
    }
    if (cur !== bioCourant) {
      bioCourant = cur;
      var b = BIOMES[cur], pal = b.pal !== null ? SE.palette[b.pal] : null;
      var ciel = CIEL.filter(function (c) { return b.j[0] >= c[0] && b.j[0] < c[1]; })[0];
      $('#bio-texte').innerHTML = '<div><p class="ke-sur"><b>' + String(cur + 1).padStart(2, '0') + '</b>jours ' + b.j[0] + ' à ' + b.j[1] + ' · <span class="ke-deduit">' + esc(ciel ? ciel[2] : '') + '</span></p><h3>' + esc(b.nom) + '</h3></div>' +
        (pal ? '<div><p class="ke-petit">Dominante</p><p class="v">' + esc(pal.dominante) + '</p><p class="ke-petit">Accents</p><p class="v">' + esc(pal.accents) + '</p></div><div><p class="ke-petit">Mouvement</p><p class="v">' + esc(pal.mouvement) + '</p></div>'
          : '<div><p class="v">Retour au point de départ : extraction du XENOPOD, message, CAIN.</p></div><div><p class="v ke-manque">Pas de ligne de palette : c\'est la jungle du début.</p></div>');
    }
  };

  /* ------------------------------------------------------------------ 07 espèces
     Une échelle de tailles (logarithmique, 0,1 mm à 20 m), une rangée par biome ; chaque espèce est un trait
     de sa plus petite à sa plus grande dimension, et un point à sa taille, à la couleur de son biome. */
  var ORDRE = ['jungle', 'pitons', 'cavernes', 'massifs', 'foret-bio', 'hautes-plaines', 'foret-ancienne', 'volcanique', 'mer-arsenic', 'lacs-sales', 'ailleurs'];
  var TETES = { jungle: 'Jungle', pitons: 'Pitons', cavernes: 'Cavernes', massifs: 'Massifs', 'foret-bio': 'Forêt bioluminescente', 'hautes-plaines': 'Hautes Plaines', 'foret-ancienne': 'Forêt ancienne', volcanique: 'Course volcanique', 'mer-arsenic': "Mer d'arsenic", 'lacs-sales': 'Lacs salés', ailleurs: 'Hors trajet, continents' };
  var COUL_BIOME = { jungle: 'jungle', pitons: 'pitons', cavernes: 'cavernes', massifs: 'massifs', 'foret-bio': 'biolum', 'hautes-plaines': 'plaines', 'foret-ancienne': 'ancienne', volcanique: 'canyon', 'mer-arsenic': 'arsenic', 'lacs-sales': 'sel' };
  var LMIN = Math.log10(1e-4), LMAX = Math.log10(20);
  var esp = {};
  function construireEspeces() {
    var s = $('#esp-svg'); s.innerHTML = '';
    var W = largeur('esp'), H = hauteur('esp');
    s.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var x0 = W * .2, x1 = W * .93, y0 = H * .3, y1 = H * .9, rh = (y1 - y0) / ORDRE.length;
    function X(m) { return x0 + (Math.log10(m) - LMIN) / (LMAX - LMIN) * (x1 - x0); }
    esp.X = X; esp.x0 = x0; esp.x1 = x1;
    // graduations : chaque trait multiplie par dix
    [[1e-4, '0,1 mm'], [1e-3, '1 mm'], [1e-2, '1 cm'], [.1, '10 cm'], [1, '1 m'], [10, '10 m']].forEach(function (g) {
      sv('line', { x1: X(g[0]), x2: X(g[0]), y1: y0 - 14, y2: y1, stroke: css('--line'), 'stroke-width': 1 }, s);
      var t = sv('text', { x: X(g[0]), y: y1 + 22, 'text-anchor': 'middle', class: 'cote' }, s); t.textContent = g[1];
    });
    // Rob1, ~75 cm : la mesure de la page
    sv('line', { x1: X(.75), x2: X(.75), y1: y0 - 30, y2: y1, stroke: css('--or'), 'stroke-width': 1, 'stroke-dasharray': '2 4', opacity: .8 }, s);
    var tr = sv('text', { x: X(.75) + 6, y: y0 - 34, class: 'cote cote-or' }, s); tr.textContent = 'Rob1 · 75 cm';
    esp.marques = [];
    ORDRE.forEach(function (b, r) {
      var y = y0 + rh * (r + .5);
      var lab = sv('text', { x: x0 - 22, y: y + 4, 'text-anchor': 'end', class: 'cote-f' }, s); lab.textContent = TETES[b];
      var liste = SE.especes.filter(function (e) { return b === 'ailleurs' ? !COUL_BIOME[e.biome] : e.biome === b; })
        .filter(function (e) { return e.b && e.b[1] !== null; }).sort(function (a2, b2) { return a2.b[1] - b2.b[1]; });
      var dernier = -1e9, rang = 0;
      liste.forEach(function (e) {
        var xa = X(e.b[0]), xb = X(e.b[1]);
        rang = (xb - dernier < 16) ? rang + 1 : 0; dernier = xb;
        var dy = [0, -9, 9, -17, 17][rang % 5], col = COUL_BIOME[b] ? couleur(COUL_BIOME[b]) : css('--pale');
        var rr = 2.5 + 7.5 * (Math.log10(e.b[1]) - LMIN) / (LMAX - LMIN);
        var g = sv('g', {}, s);
        if (xb - xa > 1) sv('line', { x1: xa, x2: xb, y1: y + dy, y2: y + dy, stroke: col, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: .75 }, g);
        var c = sv('circle', { cx: xb, cy: y + dy, r: rr, fill: col, 'fill-opacity': .85, stroke: css('--bg'), 'stroke-width': 1 }, g);
        esp.marques.push({ e: e, g: g, c: c, x: xb, y: y + dy, r: rr, b: b });
      });
    });
    // ce qui manque : pas de taille en mètres dans la fiche
    var manque = SE.especes.filter(function (e) { return !e.b || e.b[1] === null; }).map(function (e) { return e.nom + ' (' + e.taille.toLowerCase() + ')'; });
    var tm = sv('text', { x: x1, y: y1 + 52, 'text-anchor': 'end', class: 'cote', 'font-style': 'italic' }, s); tm.textContent = 'sans mesure : ' + manque.join(', ');
    esp.curseur = sv('line', { y1: y0 - 14, y2: y1 + 6, stroke: css('--ink'), 'stroke-width': 1 }, s);
    esp.etiq = sv('g', {}, s);
    esp.cur = null;
  }
  SCENES.especes = function (p) {
    var lm = lerp(LMIN + .15, LMAX - .02, p), m = Math.pow(10, lm), x = esp.X(m);
    esp.curseur.setAttribute('x1', x); esp.curseur.setAttribute('x2', x);
    // la marque la plus proche du curseur est celle qu'on lit
    var best = null, bd = 1e9;
    esp.marques.forEach(function (o) { var d = Math.abs(o.x - x); if (d < bd) { bd = d; best = o; } });
    esp.marques.forEach(function (o) {
      var proche = Math.abs(o.x - x) < 40;
      o.c.setAttribute('stroke', o === best ? css('--or') : css('--bg'));
      o.c.setAttribute('stroke-width', o === best ? 2.5 : 1);
      o.g.setAttribute('opacity', proche ? 1 : .55);
    });
    if (best !== esp.cur) {
      esp.cur = best;
      var b = $('#esp-lu');
      $('.ke-sur', b).innerHTML = '<b>' + esc(best.e.code) + '</b>' + esc(TETES[best.b] || '');
      $('.n', b).textContent = best.e.nom;
      $('.ke-dit', b).textContent = best.e.taille;
      esp.etiq.innerHTML = '';
      var t = sv('text', { x: best.x, y: best.y - best.r - 8, 'text-anchor': 'middle', class: 'cote-f' }, esp.etiq); t.textContent = best.e.nom;
    }
  };

  /* ------------------------------------------------------------------ 08 titans
     Des longueurs debout, toutes à la même échelle, posées sur un même sol : la plus grande derrière, la plus
     petite devant ; Rob1, 75 cm, tout devant. Le dôme dit une longueur, pas une forme d'animal. */
  var tit = {};
  function construireTitans() {
    var s = $('#tit-svg'); s.innerHTML = '';
    var W = largeur('tit'), H = hauteur('tit');
    s.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var items = [{ nom: 'Rob1', m: .75, q: '~75 cm, le casque sous la hanche de Seed', k: 'robot' }, { nom: 'Rob1/2, le Rob fusionné', m: 2.5, q: 'bipède coureur, ~2,5 m', k: 'robot' }];
    SE.especes.filter(function (x) { return x.code === 'HP-01' || x.code === 'TR-01'; }).forEach(function (x) { items.push({ nom: x.nom, m: x.m, q: x.taille + ' · descendant', k: 'desc' }); });
    SE.titans.forEach(function (t) { items.push({ nom: t.nom, m: t.m, q: t.taille + ' · ' + t.descendant, k: 'titan' }); });
    items.sort(function (a, b) { return b.m - a.m; });
    var x0 = W * .3, sol = H * .78, k = (W * .9 - x0) / 21;
    tit.k = k; tit.x0 = x0; tit.sol = sol;
    sv('line', { x1: x0 - 40, x2: W * .93, y1: sol, y2: sol, stroke: css('--trait-vu'), 'stroke-width': 1 }, s);
    for (var m = 0; m <= 20; m += 5) {
      sv('line', { x1: x0 + m * k, x2: x0 + m * k, y1: sol, y2: sol + 8, stroke: css('--trait-vu') }, s);
      var tg = sv('text', { x: x0 + m * k, y: sol + 26, 'text-anchor': 'middle', class: 'cote' }, s); tg.textContent = m + ' m';
    }
    var defs = sv('defs', {}, s);
    tit.items = items.map(function (it, i) {
      var L = it.m * k, h = L * .34;
      var id = 'tg' + i, gr = sv('linearGradient', { id: id, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      var c0 = it.k === 'robot' ? css('--or') : css('--ink');
      sv('stop', { offset: 0, 'stop-color': c0, 'stop-opacity': it.k === 'robot' ? .7 : .22 }, gr);
      sv('stop', { offset: 1, 'stop-color': c0, 'stop-opacity': it.k === 'robot' ? .35 : .04 }, gr);
      var d = 'M' + x0 + ' ' + sol + ' C ' + x0 + ' ' + (sol - h * 1.33) + ', ' + (x0 + L) + ' ' + (sol - h * 1.33) + ', ' + (x0 + L) + ' ' + sol + ' Z';
      var pth = sv('path', { d: d, fill: 'url(#' + id + ')', stroke: it.k === 'robot' ? css('--or') : css('--voile'), 'stroke-width': it.k === 'titan' ? 1 : 1.2, 'stroke-opacity': .7 }, s);
      return { it: it, p: pth, L: L, h: h };
    });
    tit.etq = sv('g', {}, s);
    tit.cur = -1;
  }
  SCENES.titans = function (p) {
    var n = tit.items.length, cur = clamp(n - 1 - Math.floor(p * n), 0, n - 1);   // du plus petit au plus grand
    cur = n - 1 - clamp(Math.floor(p * n), 0, n - 1);
    tit.items.forEach(function (o, i) {
      var ici = i === cur;
      o.p.setAttribute('stroke', ici ? css('--or') : (o.it.k === 'robot' ? css('--or') : css('--voile')));
      o.p.setAttribute('stroke-width', ici ? 2.5 : 1);
      o.p.setAttribute('stroke-opacity', ici ? 1 : .55);
    });
    if (cur !== tit.cur) {
      tit.cur = cur;
      var o = tit.items[cur], b = $('#tit-lu');
      $('.ke-sur', b).innerHTML = '<b>' + (n - cur) + ' / ' + n + '</b>' + esc(o.it.k === 'titan' ? 'Titan, éteint il y a ~60 Ma' : (o.it.k === 'robot' ? 'machine' : 'descendant vivant'));
      $('.n', b).textContent = o.it.nom;
      $('.ke-dit', b).textContent = o.it.q + (cur < n - 1 ? ' · ' + fr(o.it.m / .75, 0) + ' fois Rob1' : '');
      tit.etq.innerHTML = '';
      var t = sv('text', { x: tit.x0 + o.L, y: tit.sol - o.h - 14, 'text-anchor': 'middle', class: 'cote-f cote-or' }, tit.etq);
      t.textContent = fr(o.it.m, o.it.m < 1 ? 2 : (o.it.m % 1 ? 1 : 0)) + ' m';
    }
  };

  /* ------------------------------------------------------------------ 09 science */
  var sci = {};
  function construireScience() {
    var s = $('#sci-svg'); s.innerHTML = '';
    var H = hauteur('sci'), cell = Math.min(H * .05, 52), cols = 16;
    var w = cell * cols, h = cell * 8;
    s.setAttribute('width', w); s.setAttribute('height', h);
    sci.pts = [];
    for (var i = 0; i < 123; i++) {
      var x = (i % cols + .5) * cell, y = (Math.floor(i / cols) + .5) * cell;
      var kind = i < 106 ? 'C' : (i < 122 ? 'N' : 'P');
      var c = kind === 'P' ? sv('circle', { cx: x, cy: y, r: cell * .3, fill: css('--or') }, s)
        : (kind === 'N' ? sv('circle', { cx: x, cy: y, r: cell * .2, fill: 'none', stroke: css('--ink'), 'stroke-width': 1.2 }, s)
          : sv('circle', { cx: x, cy: y, r: cell * .14, fill: css('--ink') }, s));
      sci.pts.push({ c: c, k: kind, i: i });
    }
    $('#sci-compte').innerHTML = '<div class="c"><b>106</b>carbones</div><div class="n"><b>16</b>azotes</div><div class="p"><b>1</b>phosphore</div>';
  }
  // les 123 atomes sont là dès le début ; on lit les carbones, puis les azotes, puis le seul phosphore
  SCENES.science = function (p) {
    var pas = clamp(Math.floor(p * 3), 0, 2), fin = seg(p, .8, .95);
    sci.pts.forEach(function (o) {
      var mien = (o.k === 'C' && pas === 0) || (o.k === 'N' && pas === 1) || o.k === 'P';
      o.c.setAttribute('opacity', o.k === 'P' ? 1 : (mien ? lerp(1, .22, fin) : .22));
    });
    var d = document.querySelectorAll('#sci-compte div');
    for (var i = 0; i < 3; i++) d[i].classList.toggle('ici', i === pas);
    $('#sci-dit').style.opacity = lerp(.25, 1, seg(p, .66, .85));
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
  // échelle de plan : du très gros plan (1) au très plan large (6)
  var CADRE = { TGP: 1, GP: 2, 'ÉCR': 2.4, VS: 2.8, PR: 3, PM: 4, PA: 4.4, PL: 5, TPL: 6, 'Alterné': 3.5 };
  function hauteurCadre(c) { var k = c.split(/[ →+]/)[0]; return CADRE[k] || 3.5; }
  var PLANS_MOTS = { '6-14': '« Rob ! »', '7-15': '« Seed »', '8-03': '« Korê »', '9-14': '« Je suis Seed »' };
  function acteDePlan(n) { var a = n.split('-')[0]; return a === 'P' ? 0 : +a; }
  function construireFilm() {
    var s = $('#fil-svg'); s.innerHTML = '';
    var W = largeur('fil'), H = hauteur('fil');
    s.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    fil.W = W; fil.x0 = W * .06; fil.x1 = W * .92; fil.base = H * .56; fil.hmax = H * .2;
    // chaque plan : un trait vertical, large comme sa durée, haut comme son échelle de plan
    var t = 0;
    fil.plans = SE.plans.map(function (pl) {
      var o = { pl: pl, t0: t, t1: t + pl.s, a: acteDePlan(pl.n), h: hauteurCadre(pl.cadre) };
      t += pl.s; return o;
    });
    fil.total = t;
    var fab = { IA: '--ink', Unreal: '--voile', 'Écran': '--pale', Mixte: '--trait-vu' };
    fil.g = sv('g', {}, s);
    fil.plans.forEach(function (o) {
      var k = o.pl.fab.split(' ')[0];
      o.rect = sv('rect', { fill: PLANS_MOTS[o.pl.n] ? css('--or') : css(fab[k] || '--pale') }, fil.g);
      if (/\bE\d\b/.test(o.pl.note)) o.e = o.pl.note.match(/\bE\d\b/)[0];
    });
    // les modules du 55 : des volumes creux qui s'ouvrent aux charnières E1 à E9
    fil.mods = [['E1', 'M1', 180], ['E2', 'M2', 300], ['E3', 'M3', 180], ['E4', 'M4', 180], ['E4', 'M9', 120], ['E5', 'M5', 180], ['E6', 'M6', 120], ['E7', 'M7', 180], ['E8', 'M8', 180]].map(function (m) {
      var g = sv('g', {}, s);
      var r = sv('rect', { fill: css('--releve'), stroke: css('--voile'), 'stroke-width': 1, 'stroke-dasharray': '2 3' }, g);
      var tx = sv('text', { class: 'cote', 'text-anchor': 'middle' }, g); tx.textContent = m[1];
      return { e: m[0], nom: m[1], s: m[2], g: g, r: r, tx: tx };
    });
    fil.marques = sv('g', {}, s);
    fil.tete = sv('line', { stroke: css('--or'), 'stroke-width': 2 }, s);
    fil.cur = null;
  }
  SCENES.film = function (p) {
    var grow = ease(seg(p, .6, .92)), tot = fil.total + 1620 * grow;
    var k = (fil.x1 - fil.x0) / tot, x = fil.x0, base = fil.base, hm = fil.hmax;
    var vus = {}, posE = {};
    fil.marques.innerHTML = '';
    var acteVu = -1;
    fil.plans.forEach(function (o) {
      // un module s'insère juste après le plan qui porte sa charnière
      o.x = x; var w = o.pl.s * k;
      var h = hm * o.h / 6;
      o.rect.setAttribute('x', x); o.rect.setAttribute('width', Math.max(.6, w - .8));
      o.rect.setAttribute('y', base - h); o.rect.setAttribute('height', h);
      if (o.a !== acteVu) {
        acteVu = o.a;
        var tA = sv('text', { x: x, y: base + 26, class: 'cote-f' }, fil.marques); tA.textContent = NUM[o.a];
      }
      x += w;
      if (o.e && !vus[o.e]) {
        vus[o.e] = 1; posE[o.e] = x;
        var le = sv('line', { x1: x, x2: x, y1: base - hm - 30, y2: base + 6, stroke: css('--amb'), 'stroke-dasharray': '2 3', 'stroke-width': 1 }, fil.marques);
        var te = sv('text', { x: x, y: base - hm - 36, 'text-anchor': 'middle', class: 'cote' }, fil.marques); te.textContent = o.e;
        fil.mods.forEach(function (md) {
          if (md.e !== o.e) return;
          var mw = md.s * k * grow;
          md.r.setAttribute('x', x + 2); md.r.setAttribute('width', Math.max(0, mw - 4)); md.r.setAttribute('y', base - hm * .7); md.r.setAttribute('height', hm * .7);
          md.tx.setAttribute('x', x + mw / 2); md.tx.setAttribute('y', base - hm * .7 + 18);
          md.g.setAttribute('opacity', grow > .02 ? grow : 0);
          x += mw;
        });
      }
      if (PLANS_MOTS[o.pl.n]) {
        var tm = sv('text', { x: o.x + w / 2, y: base - h - 14, 'text-anchor': 'middle', class: 'cote-f cote-or' }, fil.marques); tm.textContent = PLANS_MOTS[o.pl.n];
      }
    });
    // la tête de lecture parcourt le 25 plan à plan
    var tt = fil.total * seg(p, .02, .56), cur = fil.plans[0];
    fil.plans.forEach(function (o) { if (tt >= o.t0) cur = o; });
    var xt = grow > 0 ? x : cur.x + (tt - cur.t0) * k;
    fil.tete.setAttribute('x1', xt); fil.tete.setAttribute('x2', xt); fil.tete.setAttribute('y1', base - hm - 50); fil.tete.setAttribute('y2', base + 40);
    fil.plans.forEach(function (o) { o.rect.setAttribute('opacity', grow > 0 ? .9 : (o === cur ? 1 : (o.t0 < tt ? .85 : .4))); });
    $('#fil-n').textContent = grow > 0 ? mmss(tot / 60) : mmss(tt / 60);
    $('#fil-t').textContent = grow > 0 ? '25 minutes de cœur, ' + mmss((tot - fil.total) / 60) + ' de modules' : 'le film de 25 minutes · 150 plans';
    var cle = grow > 0 ? 'm' + Math.round(grow * 9) : cur.pl.n;
    if (cle !== fil.cur) {
      fil.cur = cle;
      var html;
      if (grow > 0) {
        html = '<div><p class="ke-sur"><b>55</b>Le film long</p><h3>Neuf modules, aux charnières E1 à E9</h3></div>' +
          '<div><p class="ke-petit">La règle</p><p class="v">Le 55 s\'obtient par ajout, jamais par remontage : chaque module s\'ouvre à une charnière déjà présente dans le 25. Les actes I, III et IX n\'en reçoivent aucun.</p></div>' +
          '<div><p class="ke-petit">Les durées</p><p class="v">25 min de cœur, 27 min de modules : 52 min, 55 avec les génériques.</p></div>';
      } else {
        var pl = cur.pl;
        html = '<div><p class="ke-sur"><b>' + esc(pl.n) + '</b>' + pl.s + ' s · ' + esc(pl.cadre) + ' · ' + esc(pl.fab) + '</p><h3>' + esc(ACTES[cur.a].t) + '</h3></div>' +
          '<div><p class="ke-petit">Le plan</p><p class="v">' + esc(pl.action) + '</p></div>' +
          '<div><p class="ke-petit">Son, écran</p><p class="v">' + esc(pl.son) + '</p>' + (pl.note ? '<p class="ke-petit" style="margin-top:12px">Note</p><p class="v">' + esc(pl.note) + '</p>' : '') + '</div>';
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
    var sc = scene('scr').getBoundingClientRect(), vh = sc.height, m = $('#scr-monte'), h = m.offsetHeight;
    var y = lerp(vh * .14, -h + vh * .45, seg(p, 0, .98));
    m.style.transform = 'translate(-50%,' + y + 'px)';
    var chaud = false;
    [].forEach.call(m.children, function (c) {
      var r = c.getBoundingClientRect(), mm = (r.top + r.height / 2 - sc.top) / vh;
      c.style.opacity = lerp(.14, 1, clamp(1 - Math.abs(mm - .5) * 2.1, 0, 1));
      if (/NON VIABLE/.test(c.textContent) && r.top - sc.top < vh * .7 && r.bottom - sc.top > vh * .3) chaud = true;
    });
    var mot = $('#scr-mot');
    mot.style.color = chaud ? 'color-mix(in srgb, var(--or) 16%, var(--panel))' : '';
    mot.style.transform = 'translate(-50%,-50%) translateY(' + lerp(6, -6, p) + 'vh)';
  };

  /* ------------------------------------------------------------------ 11 le script en hauteur
     Une seule matière (le Récit v2, mis en page ligne à ligne) et une seule caméra :
     le texte -> la page -> les pages en bande -> les actes en volumes (largeur = durée) -> les arches
     -> le film de 25 puis 55 minutes -> la salle. La plongée refait le chemin à l'envers. */
  var PW = 600, PH = 860, MG = 70, LH = 19, FS = 15.5, GP = 60, GA = 200, NL = Math.floor((PH - 2 * MG) / LH);
  var DUREES = [1.5, 3.75, 1.5, 3, 2, 2.5, 2.5, 4.25, .5, 2.5, 1];
  // modules du 55 (architecture 25 / 55) : après quel acte ils s'insèrent
  var MODULES = [[0, 'M1', 3], [0, 'M2', 5], [2, 'M3', 3], [4, 'M4', 3], [4, 'M9', 2], [5, 'M5', 3], [6, 'M6', 2], [7, 'M7', 3], [8, 'M8', 3]];
  // la salle (esquisse) : six temps, et les modules ou actes qu'ils reprennent
  var SALLE = [['L’orbite', 1.5, []], ['Phase 1', 4, ['M2']], ['Le sinkhole', 1, ['I']], ['La lumière', 3, ['M5']], ['60 Ma', 2, ['M9']], ['Korê', 2, ['M7', 'M8']]];
  // les arches : ce qui se répond d'un acte à l'autre (indices d'acte) ; d = lecture proposée ; pend = ne se referme pas
  var ARCHES = [
    { nom: 'les quatre mots de Seed', a: [6, 7, 8, 9], mots: ['« Rob ! »', '« Seed »', '« Korê »', '« Je suis Seed »'], tenue: true },
    { nom: 'les quatre Robs retrouvés', a: [1, 3, 5, 7] },
    { nom: 'le XENOPOD : il tombe, il remonte', a: [1, 9], haut: 1.12 },
    { nom: 'Elena : la photo, les visions', a: [1, 7], haut: .78 },
    { nom: 'le caillou blanc', a: [5, 10], d: true },
    { nom: '« the subject » devient Seed, puis I, puis we', a: [5, 7, 9], d: true },
    { nom: 'le rapport de Rob1, du premier au mensonge', a: [1, 9], d: true, haut: 1.42 },
    { nom: 'le phosphore : Rob2, Rob4, 49 %', a: [3, 7, 10], d: true },
    { nom: 'CAIN', a: [10], pend: true }
  ];
  var HZ = { pret: false };

  function typer(par) {
    if (/^\(/.test(par)) return 'did';
    if (/^«/.test(par)) return 'dia';
    if (/^Carton/.test(par) || /^\d{4}( |$)/.test(par)) return 'car';
    return 'act';
  }
  function mettreEnPage() {
    var c = document.createElement('canvas').getContext('2d');
    var pages = [], actes = [], page = null, x = 0;
    function nouvellePage(ia) { page = { acte: ia, lignes: [], x: x }; pages.push(page); x += PW + GP; }
    function ligne(txt, ind, typ, ia) {
      if (page.lignes.length >= NL) nouvellePage(ia);
      page.lignes.push({ t: txt, ind: ind, typ: typ, w: 0, i: page.lignes.length });
      return page.lignes[page.lignes.length - 1];
    }
    SE.recit.forEach(function (a, ia) {
      if (ia) x += GA - GP;
      nouvellePage(ia);
      var debut = pages.length - 1;
      var titre = a.titre.toUpperCase();
      c.font = '600 ' + FS + 'px Literata';
      var l0 = ligne(titre, 0, 'tit', ia); l0.w = c.measureText(titre).width;
      ligne('', 0, 'vide', ia);
      a.pars.forEach(function (par) {
        var typ = typer(par), ind = typ === 'dia' ? 110 : (typ === 'did' ? 60 : 0), larg = typ === 'dia' ? 300 : (typ === 'did' ? 400 : PW - 2 * MG);
        c.font = (typ === 'did' || typ === 'car' ? 'italic ' : '') + FS + 'px Literata';
        var mots = par.split(/\s+/), cur = '';
        mots.forEach(function (m) {
          var essai = cur ? cur + ' ' + m : m;
          if (c.measureText(essai).width > larg && cur) { var l = ligne(cur, ind, typ, ia); l.w = c.measureText(cur).width; cur = m; } else cur = essai;
        });
        if (cur) { var l2 = ligne(cur, ind, typ, ia); l2.w = c.measureText(cur).width; }
        if (page.lignes.length < NL) ligne('', 0, 'vide', ia);
      });
      actes.push({ titre: a.titre, nom: (a.titre.split(' : ')[1] || a.titre), p0: debut, p1: pages.length - 1 });
    });
    HZ.pages = pages; HZ.actes = actes; HZ.TWrow = x - GP;
    // rangée : centre de chaque acte
    actes.forEach(function (a) { a.cxRow = (pages[a.p0].x + pages[a.p1].x + PW) / 2; });
  }
  // la ligne qu'on tient : la première ligne qui contient le motif, dans l'acte donné
  function trouver(ia, motif) {
    var res = null;
    HZ.pages.forEach(function (p, ip) { if (p.acte !== ia || res) return; p.lignes.forEach(function (l) { if (!res && l.t.indexOf(motif) >= 0) res = { ip: ip, il: l.i }; }); });
    return res;
  }
  // la disposition en volumes : largeur = durée ; g (0 à 1) fait entrer les modules du 55
  var TWV = 9000;
  function volumes(g) {
    var tot = 25 + 27 * g, k = TWV / tot, x = -TWV / 2, out = { actes: [], mods: [] };
    for (var i = 0; i < 11; i++) {
      out.actes.push({ x: x, w: DUREES[i] * k - 14 }); x += DUREES[i] * k;
      MODULES.forEach(function (m) { if (m[0] === i) { var w = m[2] * k * g; out.mods.push({ nom: m[1], x: x, w: Math.max(0, w - 14), apres: i }); x += w; } });
    }
    return out;
  }
  // le rectangle d'une page : m = 0 en bande, m = 1 debout dans son volume
  function rectPage(ip, m, vol) {
    var p = HZ.pages[ip], a = HZ.actes[p.acte], n = a.p1 - a.p0 + 1, k = ip - a.p0;
    var xr = p.x - HZ.TWrow / 2, v = vol.actes[p.acte];
    var xv = v.x + v.w * k / n, wv = v.w / n;
    return { x: lerp(xr, xv, m), y: 0, w: lerp(PW, wv, m), h: PH };
  }

  function preparer(id) {
    var cv = $('#' + id + '-canvas'), r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    return { cv: cv, ctx: cv.getContext('2d'), W: r.width, H: r.height, dpr: dpr };
  }
  function couleurs() {
    return { ink: css('--ink'), voile: css('--voile'), pale: css('--pale'), trait: css('--trait-vu'), fant: css('--fantome-scene'), or: css('--or'), amb: css('--amb'), releve: css('--releve'), line: css('--line') };
  }
  function construireHauteur() {
    if (!SE.recit) return;
    mettreEnPage();
    HZ.tenueE = trouver(8, 'Korê. »');
    HZ.tenueP = trouver(9, 'NON VIABLE');
    HZ.ele = preparer('ele'); HZ.plo = preparer('plo'); HZ.c = couleurs(); HZ.pret = true;
  }

  // dessine une hauteur : cam {s, cx, cy}, m (morph), a (arches), g (modules), sl (salle), tenue {ip, il}
  function dessinerHauteur(V, cam, m, a, g, sl, tenue, opts) {
    var ctx = V.ctx, C = HZ.c, W = V.W, H = V.H, s = cam.s;
    ctx.setTransform(V.dpr, 0, 0, V.dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    function X(x) { return (x - cam.cx) * s + W / 2; }
    function Y(y) { return (y - cam.cy) * s + H / 2; }
    var vol = volumes(g);
    // 1. le titre de l'acte, immense, derrière, à une autre vitesse
    var aT = clamp(Math.min((s - .05) / .1, (1.6 - s) / .9), 0, 1) * (1 - m * .85);
    if (aT > 0.01) {
      ctx.fillStyle = C.fant; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var fs = clamp(PH * s * 1.15, 120, H * .62);
      ctx.font = '300 ' + fs + 'px ' + '"Norelli", Literata, serif';
      ctx.globalAlpha = aT;
      HZ.actes.forEach(function (ac) {
        var cx = lerp(ac.cxRow - HZ.TWrow / 2, vol.actes[HZ.actes.indexOf(ac)].x + vol.actes[HZ.actes.indexOf(ac)].w / 2, m);
        var sx = (cx - cam.cx) * s * .62 + W / 2;
        if (sx < -W || sx > 2 * W) return;
        ctx.fillText(ac.nom.toUpperCase(), sx, Y(PH / 2) + (cam.cy - PH / 2) * s * .2);
      });
      ctx.globalAlpha = 1;
    }
    // 2. les pages : texte lisible, puis gris typographique, puis tranches des volumes
    var txtA = clamp((s * LH - 10) / 8, 0, 1) * (m < .02 ? 1 : 0);
    HZ.pages.forEach(function (p, ip) {
      var r = rectPage(ip, m, vol), x0 = X(r.x), y0 = Y(r.y), w = r.w * s, h = r.h * s;
      if (x0 > W || x0 + w < 0 || y0 > H || y0 + h < 0) return;
      ctx.fillStyle = C.releve; ctx.globalAlpha = .9 * (1 - m * .6); ctx.fillRect(x0, y0, w, h); ctx.globalAlpha = 1;
      var sx = w / PW, sy = h / PH, lh = LH * sy;
      if (lh < 1.1) { ctx.fillStyle = C.trait; ctx.globalAlpha = .9; ctx.fillRect(x0 + MG * sx, y0 + MG * sy, (PW - 2 * MG) * sx, p.lignes.length * lh); ctx.globalAlpha = 1; }
      else {
        p.lignes.forEach(function (l) {
          if (l.typ === 'vide') return;
          var ly = y0 + (MG + l.i * LH) * sy, lx = x0 + (MG + l.ind) * sx;
          if (ly > H || ly + lh < 0) return;
          var tenu = tenue && tenue.ip === ip && tenue.il === l.i;
          if (txtA < 1) {
            ctx.fillStyle = tenu ? C.or : (l.typ === 'tit' ? C.voile : C.trait);
            ctx.globalAlpha = tenu ? 1 : (1 - txtA);
            ctx.fillRect(lx, ly + lh * .32, Math.max(1, l.w * sx), Math.max(1, lh * .42));
          }
          if (txtA > 0) {
            ctx.globalAlpha = txtA;
            ctx.fillStyle = tenu ? C.or : (l.typ === 'did' ? C.pale : (l.typ === 'tit' ? C.ink : C.voile));
            ctx.font = (l.typ === 'tit' ? '600 ' : (l.typ === 'did' || l.typ === 'car' ? 'italic ' : '')) + (FS * sy) + 'px Literata';
            ctx.textAlign = 'left'; ctx.textBaseline = 'top';
            ctx.fillText(l.t, lx, ly + lh * .1);
          }
          ctx.globalAlpha = 1;
        });
      }
      if (tenue && tenue.ip === ip && lh < 1.1) { ctx.fillStyle = C.or; ctx.fillRect(x0, y0 + (MG + tenue.il * LH) * sy, Math.max(2, w), Math.max(2, lh * 2)); }
    });
    // 3. le rayon, les numéros d'acte, les durées
    if (m > 0.02) {
      ctx.globalAlpha = m; ctx.fillStyle = C.line; ctx.fillRect(X(-TWV / 2 - 200), Y(PH) + 1, (TWV + 400) * s, 1);
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      vol.actes.forEach(function (v, i) {
        ctx.fillStyle = (opts.focusActe === i) ? C.or : C.ink; ctx.font = '400 ' + clamp(150 * s, 11, 22) + 'px Literata';
        ctx.fillText(NUM[i], X(v.x + v.w / 2), Y(PH) + 12);
        ctx.fillStyle = C.pale; ctx.font = clamp(110 * s, 10, 14) + 'px "Chakra Petch", sans-serif';
        if (v.w * s > 34) ctx.fillText(mmssZ(DUREES[i]), X(v.x + v.w / 2), Y(PH) + 12 + clamp(150 * s, 11, 22) + 6);
      });
      ctx.globalAlpha = 1;
    }
    // 4. les modules du 55 : des volumes creux qui s'insèrent sans rien remonter
    if (g > 0.01) {
      vol.mods.forEach(function (md) {
        if (md.w < 1) return;
        var x0 = X(md.x), w = md.w * s;
        ctx.globalAlpha = g; ctx.strokeStyle = C.voile; ctx.lineWidth = 1; ctx.strokeRect(x0 + .5, Y(PH * .18) + .5, w, (PH * .82) * s);
        ctx.fillStyle = C.releve; ctx.fillRect(x0 + .5, Y(PH * .18) + .5, w, (PH * .82) * s);
        ctx.fillStyle = C.voile; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.font = clamp(120 * s, 10, 15) + 'px "Azeret Mono", monospace';
        if (w > 18) ctx.fillText(md.nom, x0 + w / 2, Y(PH * .18) + 8);
        ctx.globalAlpha = 1;
      });
    }
    // 5. les arches
    if (a > 0.01) {
      var lab = [];
      ARCHES.forEach(function (ar, k) {
        var t = clamp(a * ARCHES.length * .5 - k * .35, 0, 1); if (t <= 0) return;
        var col = ar.tenue ? C.or : (ar.d ? C.amb : C.voile);
        ctx.strokeStyle = col; ctx.lineWidth = ar.tenue ? 1.8 : 1.1; ctx.setLineDash(ar.d ? [2, 4] : []);
        ctx.globalAlpha = (opts.archesPales ? .35 : 1) * (1 - .55 * sl);
        function cx(i) { var v = vol.actes[i]; return v.x + v.w / 2; }
        if (ar.pend) {
          // CAIN : l'arche monte de l'Acte X et s'arrête dans le vide
          var x1 = cx(ar.a[0]), h0 = 1100, xe = x1 + 700 * t, ye = -h0 * .55;
          ctx.beginPath(); ctx.moveTo(X(x1), Y(0));
          ctx.bezierCurveTo(X(x1), Y(-h0), X(x1 + 700), Y(-h0), X(xe), Y(ye));
          ctx.stroke();
          ctx.setLineDash([]); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X(xe), Y(ye), 2.5, 0, 7); ctx.fill();
          lab.push([X(xe) - 10, Y(ye) - 14, 'CAIN : l’arche ne se referme pas', col, 'right']);
        } else {
          for (var j = 0; j < ar.a.length - 1; j++) {
            var xa = cx(ar.a[j]), xb = cx(ar.a[j + 1]), d = Math.abs(xb - xa), hh = Math.min(1900, 260 + d * .36) * (ar.haut || 1);
            var u = clamp(t * (ar.a.length - 1) - j, 0, 1); if (u <= 0) continue;
            ctx.beginPath(); ctx.moveTo(X(xa), Y(0));
            // une arche en Bézier, tracée jusqu'à u
            var p0 = [xa, 0], p1 = [xa, -hh], p2 = [xb, -hh], p3 = [xb, 0], N = 40;
            for (var q = 1; q <= N * u; q++) {
              var tt = q / N, mt = 1 - tt;
              var bx = mt * mt * mt * p0[0] + 3 * mt * mt * tt * p1[0] + 3 * mt * tt * tt * p2[0] + tt * tt * tt * p3[0];
              var by = mt * mt * mt * p0[1] + 3 * mt * mt * tt * p1[1] + 3 * mt * tt * tt * p2[1] + tt * tt * tt * p3[1];
              ctx.lineTo(X(bx), Y(by));
            }
            ctx.stroke();
            if (j === 0) lab.push([X((xa + xb) / 2), Y(-hh * .75) - 8, ar.nom, col, 'center']);
          }
          // les quatre mots, sous le rayon, en orange, à l'aplomb de leur acte
          if (ar.mots) ar.mots.forEach(function (mt2, i) { ctx.globalAlpha = t * (1 - (opts.archesPales ? .6 : 0)); ctx.fillStyle = C.or; ctx.font = 'italic ' + clamp(140 * s, 12, 19) + 'px Literata'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(mt2, X(cx(ar.a[i])), Y(PH) + 58 + (i % 2) * 22); });
        }
        ctx.setLineDash([]); ctx.globalAlpha = 1;
      });
      if (!opts.archesPales) lab.forEach(function (l) { ctx.globalAlpha = a; ctx.fillStyle = l[3]; ctx.font = '13px "Chakra Petch", sans-serif'; ctx.textAlign = l[4]; ctx.textBaseline = 'bottom'; ctx.fillText(l[2], l[0], l[1]); ctx.globalAlpha = 1; });
    }
    // 6. la salle : un troisième étage, six temps, reliés aux modules qu'ils reprennent
    if (sl > 0.01) {
      var tot = 13.5, ws = TWV * .62, xs = -ws / 2, ys = -3300;
      ctx.globalAlpha = sl;
      SALLE.forEach(function (tp) {
        var w = tp[1] / tot * ws;
        ctx.fillStyle = C.trait; ctx.fillRect(X(xs) + 1, Y(ys), w * s - 3, 120 * s);
        ctx.fillStyle = C.ink; ctx.font = 'italic ' + clamp(120 * s, 11, 17) + 'px Literata'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText(tp[0], X(xs + w / 2), Y(ys) - 8);
        tp[2].forEach(function (cible) {
          var tx = null;
          vol.mods.forEach(function (md) { if (md.nom === cible) tx = md.x + md.w / 2; });
          var ia = NUM.indexOf(cible); if (ia >= 0) tx = vol.actes[ia].x + vol.actes[ia].w / 2;
          if (tx === null) return;
          ctx.strokeStyle = C.amb; ctx.setLineDash([2, 4]); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(X(xs + w / 2), Y(ys + 120)); ctx.bezierCurveTo(X(xs + w / 2), Y(ys + 900), X(tx), Y(-1200), X(tx), Y(PH * .18)); ctx.stroke(); ctx.setLineDash([]);
        });
        xs += w;
      });
      ctx.fillStyle = C.pale; ctx.font = '13px "Chakra Petch", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('la salle immersive · 12 à 15 minutes · esquisse', X(0), Y(ys) - 40);
      ctx.globalAlpha = 1;
    }
  }
  function mmssZ(m) { var s = Math.round(m * 60); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
  // la position monde de la ligne tenue, pour la caméra
  function posTenue(tenue, m, g) {
    var r = rectPage(tenue.ip, m, volumes(g));
    return { x: r.x + (MG + 120) * r.w / PW, y: r.y + (MG + tenue.il * LH) * r.h / PH };
  }
  // interpolation de caméra entre deux états (échelle géométrique)
  function cameraEntre(A, B, u) {
    u = ease(clamp(u, 0, 1));
    return { s: Math.exp(lerp(Math.log(A.s), Math.log(B.s), u)), cx: lerp(A.cx, B.cx, u), cy: lerp(A.cy, B.cy, u) };
  }
  function chemin(K, t) {
    for (var i = 1; i < K.length; i++) if (t <= K[i].t) return cameraEntre(K[i - 1], K[i], (t - K[i - 1].t) / (K[i].t - K[i - 1].t));
    return K[K.length - 1];
  }
  function dire(id, sait, ouvert, ici) {
    var b = $('#' + id + '-sait'), cle = sait + ouvert;
    if (b._cle === cle) return; b._cle = cle;
    $('.ke-petit', b).textContent = ici; $('.ke-dit', b).textContent = sait; $('.ouvert', b).textContent = ouvert ? 'ouvert : ' + ouvert : '';
  }

  SCENES.elevation = function (t) {
    if (!HZ.pret) return;
    var V = HZ.ele, W = V.W, H = V.H, te = HZ.tenueE;
    var m = ease(seg(t, .4, .55)), a = seg(t, .57, .74), g = ease(seg(t, .76, .88)), sl = seg(t, .9, .98);
    var pt0 = posTenue(te, 0, 0), pg = HZ.pages[te.ip], ac = HZ.actes[pg.acte];
    var sRow = W * .9 / HZ.TWrow, sVol = W * .8 / TWV;
    var K = [
      { t: 0, s: 2.3, cx: pt0.x + 140, cy: pt0.y },
      { t: .08, s: 2.3, cx: pt0.x + 140, cy: pt0.y },
      { t: .2, s: H * .78 / PH, cx: pg.x - HZ.TWrow / 2 + PW / 2, cy: PH / 2 },
      { t: .3, s: W * .8 / ((ac.p1 - ac.p0 + 1) * (PW + GP) + 1600), cx: ac.cxRow - HZ.TWrow / 2, cy: PH / 2 },
      { t: .4, s: sRow, cx: 0, cy: PH / 2 },
      { t: .55, s: sVol, cx: 0, cy: PH * .2 },
      { t: .72, s: sVol * .92, cx: 0, cy: -520 },
      { t: .88, s: sVol * .92, cx: 0, cy: -520 },
      { t: 1, s: sVol * .76, cx: 0, cy: -1150 }
    ];
    var cam = chemin(K, t);
    dessinerHauteur(V, cam, m, a, g, sl, te, { focusActe: 8 });
    var niv = t < .14 ? 0 : t < .34 ? 1 : t < .56 ? 2 : t < .75 ? 3 : t < .9 ? 4 : 5;
    var TXT = [
      ['le texte', 'Une ligne : Seed dit « Korê », presque comme le cri de l’oiseau.', 'le Récit v2 attend la relecture de Cal'],
      ['la page', 'Une page de l’Acte VIII, la partie la plus courte du film : trente secondes.', 'Acte VIII absent du docx, ajouté depuis la Bible'],
      ['les actes', 'Onze parties, de 0:30 à 4:15 ; la durée fait la largeur, le texte fait la matière.', ''],
      ['les arches', 'Ce qui se répond d’un acte à l’autre ; l’orange suit les quatre mots de Seed.', 'CAIN : l’arche ne se referme pas dans le 25'],
      ['le film', '25 minutes, puis 52 : neuf modules s’insèrent, rien n’est remonté.', 'format de projection du 25 : dôme ou salle'],
      ['la salle', 'La salle reprend les modules sans Seed, construits une fois dans Unreal.', 'les six temps de la salle sont une esquisse']
    ][niv];
    dire('ele', TXT[1], TXT[2], TXT[0]);
  };

  SCENES.plongee = function (t) {
    if (!HZ.pret) return;
    var V = HZ.plo, W = V.W, H = V.H, tp = HZ.tenueP;
    // à l'envers : du film (volumes) vers la ligne
    var m = 1 - ease(seg(t, .18, .36)), g = 0, a = 1 - seg(t, .02, .18);
    var pg = HZ.pages[tp.ip], ac = HZ.actes[pg.acte], vol = volumes(0), v9 = vol.actes[9];
    var sVol = W * .8 / TWV, sRow = W * .9 / HZ.TWrow, pt = posTenue(tp, 0, 0);
    var K = [
      { t: 0, s: sVol * .92, cx: 0, cy: -520 },
      { t: .18, s: sVol, cx: 0, cy: PH * .3 },
      { t: .36, s: sRow, cx: 0, cy: PH / 2 },
      { t: .52, s: W * .8 / ((ac.p1 - ac.p0 + 1) * (PW + GP) + 1600), cx: ac.cxRow - HZ.TWrow / 2, cy: PH / 2 },
      { t: .68, s: H * .78 / PH, cx: pg.x - HZ.TWrow / 2 + PW / 2, cy: PH / 2 },
      { t: .86, s: 2.5, cx: pt.x + 150, cy: pt.y + 90 },
      { t: 1, s: 2.5, cx: pt.x + 150, cy: pt.y + 90 }
    ];
    // pendant la descente, la caméra suit l'acte IX en volume, puis la page en bande
    var cam = chemin(K, t);
    dessinerHauteur(V, cam, m, a, g, 0, tp, { focusActe: 9, archesPales: true });
    var niv = t < .25 ? 0 : t < .5 ? 1 : t < .75 ? 2 : 3;
    var TXT = [
      ['le film', 'Le film entier ; l’Acte IX, 2:30, porte le rapport de Rob1.', ''],
      ['l’acte IX', 'Le signal : PERSEPHORA déclare Seed incomplète et fait de Rob1 le chef de mission.', ''],
      ['la page', 'La page où Rob1 rédige son message, dans la langue des rapports.', ''],
      ['la ligne', 'Mot pour mot : ÉVALUATION FINALE : NON VIABLE. Il protège un monde complet.', 'le Récit v2 attend la relecture de Cal']
    ][niv];
    dire('plo', TXT[1], TXT[2], TXT[0]);
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
          var pth = sv('path', { d: 'M8 ' + y0 + ' C ' + (8 + rx) + ' ' + y0 + ', ' + (8 + rx) + ' ' + y + ', 8 ' + y, fill: 'none', stroke: css('--pale'), 'stroke-width': 1 }, svg);
          jou.arcs.push({ p: pth, y0: y0, y1: y, a: vus[w].e, b: e });
        }
      }
      vus[w] = { y: y, e: e };
    });
    jou.H = col.offsetHeight;
    jou.sujet = null;
  }
  SCENES.journal = function (p) {
    var vh = hauteur('jou'), col = $('#jou-col');
    var y = lerp(vh * .5, -jou.H + vh * .5, seg(p, 0, 1));
    col.style.transform = 'translateY(' + y + 'px)';
    var centre = vh * .5 - y, actif = null;
    jou.rows.forEach(function (o) {
      var top = o.el.offsetTop, h = o.el.offsetHeight;
      var on = top <= centre && top + h > centre;
      o.el.classList.toggle('vif', on);
      if (top <= centre) actif = o;
    });
    var orange = css('--or'), fil2 = css('--pale');
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
      $('.n', b).textContent = s[1]; $('.ke-dit', b).textContent = s[2]; $('.ex', b).textContent = s[3];
      $('.n', b).style.color = s[1] === '—' ? 'var(--pale)' : 'var(--ink)';
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
    var W = largeur('sal'), H = hauteur('sal'), cx = W / 2, cy = H / 2, R = Math.min(H * .32, W * .16);
    s.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    sal.g = sv('g', {}, s);
    var tot = 13.5, a = 0;
    sal.segs = TEMPS.map(function (t) {
      var a0 = a, a1 = a + 2 * Math.PI * t[1] / tot; a = a1;
      var pth = sv('path', { d: arc(0, 0, R, a0 + .02, a1 - .02), fill: 'none', stroke: css('--trait-vu'), 'stroke-width': 10 }, sal.g);
      var am = (a0 + a1) / 2;
      var tx = sv('text', { x: (R + 40) * Math.cos(am), y: (R + 40) * Math.sin(am), 'text-anchor': 'middle', 'dominant-baseline': 'middle', class: 'cote' }, sal.g);
      tx.textContent = t[0].split(' · ')[0];
      return { p: pth, am: am, t: t, tx: tx };
    });
    for (var m = 0; m < 13.5; m += .5) {
      var aa = 2 * Math.PI * m / tot, l = m % 1 === 0 ? 10 : 5;
      sv('line', { x1: (R - 22) * Math.cos(aa), y1: (R - 22) * Math.sin(aa), x2: (R - 22 - l) * Math.cos(aa), y2: (R - 22 - l) * Math.sin(aa), stroke: css('--trait-vu'), 'stroke-width': 1 }, sal.g);
    }
    sal.g.setAttribute('transform', 'translate(' + cx + ' ' + cy + ')');
    // le regard du visiteur, vers le haut
    sv('path', { d: 'M' + cx + ' ' + cy + ' L' + (cx - R * .62) + ' ' + (cy - R * .9) + ' M' + cx + ' ' + cy + ' L' + (cx + R * .62) + ' ' + (cy - R * .9), stroke: css('--or'), 'stroke-width': 1, opacity: .7 }, s);
    sal.cx = cx; sal.cy = cy;
    sal.cur = -1; sal.or = css('--or'); sal.repos = css('--trait-vu');
  }
  SCENES.salle = function (p) {
    var tot = 13.5, m = 13.5 * seg(p, .04, .96), i = 0, acc = 0;
    TEMPS.forEach(function (t, k) { if (m >= acc) i = k; acc += t[1]; });
    var rot = -90 - 360 * m / tot;
    sal.g.setAttribute('transform', 'translate(' + sal.cx + ' ' + sal.cy + ') rotate(' + rot + ')');
    sal.segs.forEach(function (s, k) {
      s.p.setAttribute('stroke', k === i ? sal.or : sal.repos);
      s.p.setAttribute('stroke-width', k === i ? 18 : 10);
      var ang = -rot;
      s.tx.setAttribute('transform', 'rotate(' + ang + ' ' + s.tx.getAttribute('x') + ' ' + s.tx.getAttribute('y') + ')');
    });
    $('#sal-centre .n').textContent = mmss(m);
    if (i !== sal.cur) {
      sal.cur = i;
      var t = TEMPS[i];
      $('#sal-g').innerHTML = '<p class="ke-sur"><b>' + esc(t[0].split(' · ')[0]) + '</b>Temps ' + esc(t[0].split(' · ')[0]) + ' · ' + mmss(t[1]) + ' · <span class="ke-deduit">esquisse</span></p><h3>' + esc(t[0].split(' · ')[1]) + '</h3><p class="ke-texte">' + esc(t[2]) + '</p>';
      $('#sal-d').innerHTML = '<p class="ke-sur">Ce que fait le visiteur</p><p class="ke-dit">' + esc(t[3]) + '</p>';
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
      el('div', { class: 'se-cartel', html: '<h3><b>' + String(i + 1).padStart(2, '0') + '</b>' + esc(k[0]) + '</h3><div><p class="ke-machine">Sur Terre</p><p class="v">' + esc(maj(k[1])) + '</p></div><div><p class="ke-machine">Sur Korê</p><p class="v">' + esc(maj(k[2])) + '</p></div><div><p class="ke-machine">Pourquoi</p><p class="v">' + esc(maj(k[3])) + '</p></div>' }, c);
    });
  }

  /* ------------------------------------------------------------------ fin */
  SCENES.fin = function (p) {
    var l = document.querySelectorAll('#fin .se-lignes div');
    for (var i = 0; i < l.length; i++) {
      var t = seg(p, i * .3, .22 + i * .3);
      l[i].style.opacity = lerp(.12, 1, t); l[i].style.transform = 'translateY(' + (1 - t) * 14 + 'px)';
    }
  };

  /* ------------------------------------------------------------------ démarrage */
  function construireTout() {
    construireVoyage(); construireChiffres(); chiCourant = -1; construireCiel(); construireMarees();
    construireTrajet(); traActe = null; construireFrise(); construireBiomes(); bioCourant = -1;
    construireEspeces(); construireTitans(); construireScience(); construireFilm();
    construireScript(); construireHauteur(); construireJournal(); construireSalle(); construireCartels();
  }
  // chaque scène se branche sur la piste du kit
  pistes.forEach(function (pi) {
    var sc = pi.querySelector('.ke-scene'), f = SCENES[pi.dataset.scene];
    if (sc && f) sc._t = function (t) { f(t); };
  });
  var pret = false;
  function rejouer() { if (pret && window.KitEtude) KitEtude.rejouer(); ou(); }
  function demarrer() { construireTout(); pret = true; rejouer(); }
  if (document.fonts && document.fonts.load) {
    Promise.all(['15px Literata', 'italic 15px Literata', '600 15px Literata', '13px "Chakra Petch"', '12px "Azeret Mono"'].map(function (f) { return document.fonts.load(f).catch(function () {}); }))
      .then(function () { return document.fonts.ready; }).then(demarrer);
  } else addEventListener('load', demarrer);
  var minuterie = 0;
  addEventListener('resize', function () { clearTimeout(minuterie); minuterie = setTimeout(function () { if (pret) { construireTout(); rejouer(); } }, 150); });
  document.addEventListener('ke:theme', function () { if (pret) { construireTout(); rejouer(); } });
  // pour les captures : window.__allerA(id, p) place la page à l'instant p d'une piste
  window.__allerA = function (id, p) {
    var s = document.getElementById(id), haut = 48, len = s.offsetHeight - (innerHeight - haut);
    var top = s.getBoundingClientRect().top + scrollY;
    scrollTo(0, top - haut + len * p); rejouer();
  };
})();
