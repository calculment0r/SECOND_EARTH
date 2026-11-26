/* KIT ÉTUDE · la page de la dataviz en trois dimensions : les données d'exemple, écrites pour la page (aucune n'est tirée d'un projet réel).
   Les composants sont dans viz3d.js ; ce fichier ne s'emporte pas. */
const V = window.KitEtude.viz3d, par = id => document.getElementById(id);
const gauss = (x, m, s) => Math.exp(-((x - m) * (x - m)) / (2 * s * s));
const fr = x => String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/* 1 · quarante-quatre semaines, une ligne par semaine : ce qui se passe au fil d'une journée */
(function () {
  const h = V.hasard(5), lignes = [], m = 150;
  for (let j = 0; j < 44; j++) {
    const c1 = 0.36 + 0.035 * Math.sin(j * 0.31) + (h() - 0.5) * 0.02, c2 = 0.66 + 0.05 * Math.sin(j * 0.22 + 1) + (h() - 0.5) * 0.02, a1 = 0.1 + 0.7 * gauss(j, 13, 7) + h() * 0.1, a2 = 0.08 + 0.86 * gauss(j, 30, 8) + h() * 0.08, s1 = 0.045, s2 = 0.055, v = []; let b = 0;
    for (let i = 0; i < m; i++) { const x = i / (m - 1), env = gauss(x, 0.5, 0.2); b = b * 0.7 + (h() - 0.5) * 0.3; v.push(Math.max(0.004, Math.min(1, a1 * gauss(x, c1, s1) + a2 * gauss(x, c2, s2) + env * 0.045 * (1 + b * 2.4) + 0.008 * Math.abs(b)))); }
    lignes.push({ nom: 'Semaine ' + (j + 1), v });
  }
  V.cretes(par('cretes'), { lignes, axe: ['minuit', '6 h', 'midi', '18 h', 'minuit'], max: 100, repos: 30,
    dire: (l, i) => { const heure = i / (m - 1) * 24, hh = Math.floor(heure), mm = Math.round((heure - hh) * 60 / 5) * 5 % 60; return 'Son point haut, ' + fr(l.v[i] * 100) + ', tombe vers ' + hh + ' h' + (mm ? ' ' + ('0' + mm).slice(-2) : '') + '.'; } }, { num: '01', sur: 'Des lignes de relief, empilées en profondeur' });
})();

/* 2 · une nappe : trois bosses et un creux */
V.nappe(par('nappe'), { n: 76, max: 10,
  f: (u, v) => Math.max(0.02, Math.min(1, 0.92 * Math.exp(-((u - 0.34) ** 2 + (v - 0.4) ** 2) / 0.022) + 0.62 * Math.exp(-((u - 0.7) ** 2 + (v - 0.62) ** 2) / 0.03) + 0.4 * Math.exp(-((u - 0.6) ** 2 + (v - 0.2) ** 2) / 0.012) + 0.1 + 0.05 * Math.sin(u * 9) * Math.cos(v * 7) - 0.12 * Math.exp(-((u - 0.2) ** 2 + (v - 0.8) ** 2) / 0.03))) },
  { num: '02', sur: 'Une surface, ses courbes de niveau, une coupe' });

/* 3 · un ciel : six amas, un fil entre leurs grands noms */
(function () {
  const h = V.hasard(21), GRANDS = ['Aube', 'Brume', 'Cendre', 'Dune', 'Écume', 'Givre'];
  const PETITS = 'l’anse,le bief,la combe,le duvet,l’éclat,la faille,le gué,la halte,l’îlot,le jonc,la lande,le mât,la nasse,l’orée,le pli,la rade,le seuil,la tourbe,l’urne,le val,la yole,le zeste,l’abri,la berge,le col,la digue,l’étier,le fanal,la grève,le hameau,l’isthme,le jusant,la lisière,le môle,la noue,l’ombre,le pertuis,la quille,le récif,la source,le talus,l’usine,le verger,la vigie,l’amer,le banc,la crique,le delta,l’écluse,le fjord,la garrigue,le havre,l’if,le jardin,la lagune,le marais,la nef,l’oasis,le phare,le quai,la ravine,le sentier,la tour,le vallon'.split(',');
  const centres = [[-2.6, 0.9, 0.4], [-0.9, -1.1, 1.5], [0.6, 1.3, -1.2], [2.3, -0.2, 0.9], [1.1, -1.5, -1.6], [-1.4, 0.3, -2.1]], points = [], liens = [], fil = []; let q = 0;
  centres.forEach((c, g) => {
    const debut = points.length; points.push({ nom: GRANDS[g], x: c[0], y: c[1], z: c[2], grand: true, poids: 1 }); fil.push(debut);
    for (let i = 0; i < 13; i++) { const r = 0.45 + h() * 0.95, a = h() * 6.283, b = (h() - 0.5) * 2.4; points.push({ nom: PETITS[q++ % PETITS.length], x: c[0] + Math.cos(a) * Math.cos(b) * r, y: c[1] + Math.sin(b) * r * 0.8, z: c[2] + Math.sin(a) * Math.cos(b) * r, poids: h() }); }
    for (let i = debut + 1; i < points.length; i++) { const d = points.slice(debut, points.length).map((p, j) => [Math.hypot(p.x - points[i].x, p.y - points[i].y, p.z - points[i].z), debut + j]).filter(x => x[1] !== i).sort((a, b) => a[0] - b[0]); liens.push([i, d[0][1]]); if (h() < 0.5) liens.push([i, d[1][1]]); }
  });
  for (let i = 0; i < 5; i++) liens.push([1 + Math.floor(h() * 13) + i * 14, 1 + Math.floor(h() * 13) + ((i + 2) % 6) * 14]);
  V.constellation(par('constellation'), { poussiere: 420, points, liens, fil: [0, 5, 2, 3, 4, 1].map(x => x * 14) }, { num: '03', sur: 'Des points nommés, des liens qui attendent' });
})();

/* 4 · quinze lieux du monde, treize arcs, dont un déduit */
V.globe(par('globe'), { rayonKm: 6371,
  lieux: [{ nom: 'Paris', lat: 48.86, lon: 2.35 }, { nom: 'Dakar', lat: 14.72, lon: -17.47 }, { nom: 'New York', lat: 40.71, lon: -74.01 }, { nom: 'São Paulo', lat: -23.55, lon: -46.63 }, { nom: 'Le Caire', lat: 30.04, lon: 31.24 }, { nom: 'Lagos', lat: 6.52, lon: 3.38 }, { nom: 'Le Cap', lat: -33.92, lon: 18.42 }, { nom: 'Reykjavik', lat: 64.15, lon: -21.94 }, { nom: 'Mumbai', lat: 19.08, lon: 72.88 }, { nom: 'Tokyo', lat: 35.68, lon: 139.69 }, { nom: 'Sydney', lat: -33.87, lon: 151.21 }, { nom: 'Mexico', lat: 19.43, lon: -99.13 }, { nom: 'Montréal', lat: 45.5, lon: -73.57 }, { nom: 'Istanbul', lat: 41.01, lon: 28.98 }, { nom: 'Nairobi', lat: -1.29, lon: 36.82 }],
  arcs: [{ de: 1, a: 0 }, { de: 0, a: 2 }, { de: 1, a: 3 }, { de: 0, a: 4 }, { de: 5, a: 1 }, { de: 5, a: 6 }, { de: 7, a: 12 }, { de: 4, a: 8 }, { de: 8, a: 9 }, { de: 9, a: 10 }, { de: 11, a: 2 }, { de: 13, a: 0 }, { de: 14, a: 4 }, { de: 3, a: 6, deduit: true }] },
  { num: '04', sur: 'Des lieux, des arcs, le plus court chemin' });

/* 5 · quatorze jours, vingt-quatre heures */
(function () {
  const h = V.hasard(9), JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'], rangs = [], v = [];
  for (let r = 0; r < 14; r++) { const j = r % 7, fin = j > 4; rangs.push(JOURS[j] + ' ' + (r + 3)); const ligne = []; for (let c = 0; c < 24; c++) { const x = fin ? 0.85 * gauss(c, 15.5, 3.4) + 0.3 * gauss(c, 22.5, 1.6) : 0.72 * gauss(c, 9, 1.5) + 0.95 * gauss(c, 18.2, 1.9) + 0.3 * gauss(c, 13, 1.2); ligne.push(Math.max(0.02, Math.min(1, x * (0.72 + h() * 0.36) + h() * 0.05))); } v.push(ligne); }
  V.ville(par('ville'), { rangs, colonnes: Array.from({ length: 24 }, (_, c) => c + ' h'), v, max: 100, repereCol: 6 }, { num: '05', sur: 'Un champ de barres, vu en plongée' });
})();

/* 6 · trois ans, jour après jour */
(function () {
  const h = V.hasard(14), T = 3, PT = 365, v = [], MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'], LG = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; let b = 0;
  for (let i = 0; i < T * PT; i++) { const a = (i % PT) / PT * Math.PI * 2; b = b * 0.94 + (h() - 0.5) * 0.07; v.push(Math.max(0.03, Math.min(1, 0.4 - 0.26 * Math.cos(a - 0.5) + 0.07 * Math.sin(a * 3) + i / (T * PT) * 0.2 + b))); }
  const date = i => { let j = i % PT, m = 0; while (j >= LG[m]) { j -= LG[m]; m++; } return 'Le ' + (j + 1 === 1 ? '1ᵉʳ' : j + 1) + ' ' + MOIS[m] + ', ' + ['première', 'deuxième', 'troisième'][Math.floor(i / PT)] + ' année'; };
  V.spirale(par('spirale'), { tours: T, parTour: PT, v, max: 100, date, reperes: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'], depart: 804 }, { num: '06', sur: 'Un tour par an, un point par jour' });
})();

/* 7 · un delta poussé depuis son embouchure */
V.delta(par('delta'), V.delta.pousser(17, { sources: 96, embouchure: 'L’embouchure', noms: ['Le bras du couchant', 'La vieille rivière', 'Le bras du levant'] }), { num: '07', sur: 'Du petit au grand : un fil par source' });

/* 8 · quatre couches : des lieux, des personnes, des objets, des jours */
(function () {
  const h = V.hasard(33), NOMS = [['les lieux', ['le quai', 'le pont', 'la halle', 'l’atelier', 'le phare', 'la place', 'le jardin', 'la gare']], ['les personnes', ['Anna', 'Louis', 'Mina', 'Octave', 'Rose', 'Sacha', 'Théo', 'Zoé']], ['les objets', ['la lettre', 'la clé', 'la montre', 'le carnet', 'la lampe', 'la carte', 'le billet', 'la bague']], ['les jours', ['lundi', 'mardi', 'jeudi', 'samedi', 'dimanche', 'le premier soir', 'la veille', 'le lendemain']]];
  const plans = NOMS.map(c => ({ nom: c[0], points: c[1].map((n, i) => ({ nom: n, x: ((i % 4) / 3 - 0.5) * 1.5 + (h() - 0.5) * 0.3, z: (Math.floor(i / 4) - 0.5) * 0.95 + (h() - 0.5) * 0.4 })) })), liens = [];
  for (let p = 0; p < 3; p++) for (let i = 0; i < 8; i++) { if (h() < 0.62) liens.push([p, i, p + 1, Math.floor(h() * 8)]); }
  const fil = [[0, 1, 1, 0], [1, 0, 2, 0], [2, 0, 3, 3]].map(l => liens.push(l) - 1);
  V.couches(par('couches'), { plans, liens, fil }, { num: '08', sur: 'Des plans empilés, des liens qui les traversent' });
})();

/* 9 · trois mille six cents points, quatre dispositions */
(function () {
  const COL = 24, poids = Array.from({ length: COL }, (_, c) => 0.25 + gauss(c, 7, 2.6) + 0.75 * gauss(c, 16, 3.2)), somme = poids.reduce((a, b) => a + b, 0);
  V.particules(par('particules'), { n: 3600, dispositions: [
    { nom: 'Le nuage', dit: 'Trois mille six cents points, sans ordre.', p: (i, n, h) => { let x, y, z; do { x = h() * 2 - 1; y = h() * 2 - 1; z = h() * 2 - 1; } while (x * x + y * y + z * z > 1); return [x * 3, y * 2.4, z * 3]; } },
    { nom: 'Le plan', dit: 'Les mêmes, rangés un par un : soixante par soixante.', p: (i) => [((i % 60) / 59 - 0.5) * 6.6, 0, (Math.floor(i / 60) / 59 - 0.5) * 6.6] },
    { nom: 'L’anneau', dit: 'Les mêmes, en cercle : le début rejoint la fin.', p: (i, n, h) => { const a = i / n * 6.2832, r = 0.42 * Math.sqrt(h()), b = h() * 6.2832; return [Math.cos(a) * (2.7 + Math.cos(b) * r), Math.sin(b) * r, Math.sin(a) * (2.7 + Math.cos(b) * r)]; } },
    { nom: 'Les colonnes', dit: 'Les mêmes, comptés : chaque colonne dit combien.', p: (function () { const bornes = []; let c = 0; poids.forEach(p => { c += p / somme; bornes.push(c); }); return (i, n) => { let col = 0; const f = (i + 0.5) / n; while (bornes[col] < f) col++; const debut = col ? bornes[col - 1] : 0, rang = Math.floor((f - debut) * n); return [(col / (COL - 1) - 0.5) * 7, -1.6 + Math.floor(rang / 8) * 0.085, ((rang % 8) / 7 - 0.5) * 0.9]; }; })() }] },
    { num: '09', sur: 'La même matière, quatre dispositions' });
})();

/* le rail des scènes : là où l'on est */
(function () {
  const liens = [].slice.call(document.querySelectorAll('.v3-rail a')), figs = liens.map(a => par(a.getAttribute('href').slice(1)));
  /* la scène courante : celle dont le centre est le plus près du milieu de l'écran (sous la barre) */
  function ou() {
    const barre = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--barre-h')) || 48, milieu = barre + (window.innerHeight - barre) / 2;
    let ici = 0, dm = Infinity; figs.forEach((f, i) => { const r = f.getBoundingClientRect(); if (!r.height) return; const d = Math.abs(r.top + r.height / 2 - milieu); if (d < dm) { dm = d; ici = i; } });
    liens.forEach((a, i) => { a.classList.toggle('ici', i === ici); a.classList.toggle('passe', i < ici); a.setAttribute('aria-current', i === ici ? 'true' : 'false'); });
  }
  window.addEventListener('scroll', ou, { passive: true }); window.addEventListener('resize', ou); window.addEventListener('load', ou);
  new ResizeObserver(ou).observe(document.querySelector('main')); ou();
})();
