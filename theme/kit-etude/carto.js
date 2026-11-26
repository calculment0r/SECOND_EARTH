/* KIT ÉTUDE · LA CARTOGRAPHIE — window.KitEtude.carto
   Tout est fabriqué dans la page : aucun réseau, aucune tuile. Un monde inventé, déterministe (une graine), lu à cinq hauteurs.
     KitEtude.carto.carte(el, options)   la carte : zoom sémantique continu, repères, fiche, habillage, outils (trajet, zone)
     KitEtude.carto.fond(el, options)    un petit fond pour une diapositive : 'points', 'latitudes', 'niveaux'
     KitEtude.carto.flux(el, options)    une carte de flux : des arcs entre des lieux, l'épaisseur dit le volume
     KitEtude.carto.echelle / rose / legende / cartouche / couches   l'habillage, pièce par pièce
   Les couleurs viennent des jetons, lus par getComputedStyle et relus sur « ke:theme ». La molette seule laisse défiler la page :
   le zoom se fait avec Ctrl + molette (ou le pincement du pavé), deux doigts qui pincent, + et −, les chiffres 1 à 5, ou le rail ; la mini-carte se pilote aussi au clavier. */
(function () {
  'use strict';
  var KE = window.KitEtude = window.KitEtude || {}, U = KE.outils, el = U.el, svg = U.svg, borne = U.borne, mix = U.mix, seg = U.seg;
  var C = KE.carto = {};
  var calme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LARG = 1.6, KM = 4162.5, PAS = 110 / (KM * 1000);            /* le monde : 1,6 × 1 unité ; 1 unité = 4 162 km ; une rue tous les 110 m */
  var HAUTEURS = [1, 9, 260, 3200, 22000], NOMS_H = ['le monde', 'la région', 'la ville', 'la rue', 'le lieu'];

  /* ══ Le bruit : une valeur par point entier, lissée ══ */
  function h3(i, j, s) { var h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(s, 1274126177); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function bruit(x, y, s) {
    var i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * fx * (fx * (fx * 6 - 15) + 10), v = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
    var a = h3(i, j, s), b = h3(i + 1, j, s), c = h3(i, j + 1, s), d = h3(i + 1, j + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function alea(g) { return function () { g = (g + 0x6D2B79F5) | 0; var t = Math.imul(g ^ (g >>> 15), 1 | g); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /* ══ Le monde ══ */
  var REGIONS = ['Haute-Marche', 'Les Ardes', 'Val-Noir', 'Côte des Vents', 'Le Grand Plateau', 'Terres Basses', 'L’Échine', 'Pays d’Aune'];
  var MERS = ['mer des Calmes', 'golfe du Levant', 'baie des Sept-Îles', 'mer du Ponant', 'détroit de l’Aiguille', 'grand large'];
  var FLEUVES = ['la Sorgue', 'l’Aune', 'le Lézat', 'la Vire', 'l’Orbe', 'la Dore', 'le Nant', 'la Brune', 'l’Arvan', 'la Seille', 'le Gardon', 'la Loue', 'l’Ouche', 'la Veyle', 'le Thoré', 'la Bièvre', 'l’Isle', 'la Claie'];
  var VILLES = ['Port-Clair', 'Valmont', 'Saint-Aubin', 'Roquefeuil', 'Montaigu', 'Aiguebelle', 'Les Essarts', 'Vieux-Bourg', 'Sainte-Luce', 'Belcastel', 'Font-Romeu', 'La Chaume', 'Pontarlier', 'Mirepoix', 'Castelnau', 'Le Tréport', 'Hautecombe', 'Saint-Véran', 'Clairvaux', 'La Ferté', 'Rochebrune', 'Villeneuve', 'Le Châtelet', 'Bonneval', 'Sauveterre', 'Marsanne', 'La Bastide', 'Entraigues', 'Peyrolles', 'Grandval', 'Les Salines', 'Malaucène', 'Tournemire', 'Beaulieu', 'Fontenay', 'Lussan', 'Le Monastier', 'Orcières', 'Val-d’Azur', 'Saint-Loup'];
  var QUARTIERS = ['Les Halles', 'La Butte', 'Le Port', 'Saint-Roch', 'Les Tanneurs', 'Bellevue', 'La Citadelle', 'Le Faubourg', 'Les Chartreux', 'La Croix-Verte', 'Le Marais', 'Les Quais', 'Saint-Just', 'La Vigie'];
  var RUES = ['des Tanneurs', 'du Levant', 'Haute', 'du Puits', 'des Carmes', 'de la Halle', 'du Cadran', 'des Lavandières', 'Neuve', 'de l’Arsenal', 'du Rempart', 'des Deux-Ponts', 'de la Monnaie', 'du Phare', 'des Orfèvres', 'Longue', 'du Moulin', 'de l’Écluse', 'des Cordiers', 'du Petit-Port', 'de la Vigie', 'Saint-Roch', 'des Récollets', 'du Clos', 'de la Glacière', 'des Platanes', 'de l’Observatoire', 'du Four', 'des Veilleurs', 'de la Corderie'];
  var JARDINS = ['jardin des Simples', 'parc du Rempart', 'jardin de l’Évêché', 'clos des Tilleuls', 'parc de la Vigie'], PLACES = ['place du Cadran', 'place aux Herbes', 'place de la Halle', 'place Neuve', 'place des Carmes'];
  var BATIS = ['atelier', 'librairie', 'immeuble d’habitation', 'école', 'café', 'entrepôt', 'imprimerie', 'théâtre de quartier', 'boulangerie', 'maison de ville', 'hôtel particulier', 'manufacture'];
  var mondes = {};
  function monde(graine) {
    if (mondes[graine]) return mondes[graine];
    var M = mondes[graine] = { graine: graine }, R = alea(graine), G = graine | 0;
    function alt(x, y, oct) {
      var n = 0, a = 1, f = 2.1, o; for (o = 0; o < oct; o++) { n += a * (bruit(x * f + 17.3, y * f + 5.1, G + o) - .5); a *= .5; f *= 2.07; }
      var bx = Math.abs(x - .8) / .8, by = Math.abs(y - .5) / .5, d = Math.sqrt(bx * bx + by * by), e = n * 1.3 + .07 - Math.pow(Math.max(0, d - .34), 2) * 1.5 - Math.pow(Math.max(bx, by), 6) * .7;
      return e > 0 ? Math.pow(e, 1.4) * 7800 : e * 5200;
    }
    M.alt = alt;
    /* les fleuves : on remplit les cuvettes depuis la mer (chaque case de terre reçoit sa pente vers l'aval), puis on compte l'eau qui passe.
       Un fleuve est une case où il en passe beaucoup : le réseau se ramifie tout seul, du ruisseau à l'embouchure. */
    var GX = 320, GY = 200, gc = LARG / GX, NB = GX * GY, ga = new Float32Array(NB), aval = new Int32Array(NB).fill(-1), vu_ = new Uint8Array(NB), ordre = [], tas = [], i, j, q;
    for (j = 0; j < GY; j++) for (i = 0; i < GX; i++) ga[j * GX + i] = alt((i + .5) * gc, (j + .5) * gc, 6);
    function monter(e, id) { var k = tas.length; tas.push([e, id]); while (k > 0) { var p = (k - 1) >> 1; if (tas[p][0] <= tas[k][0]) break; var t = tas[p]; tas[p] = tas[k]; tas[k] = t; k = p; } }
    function tirer_() { var haut = tas[0], der = tas.pop(), k = 0; if (tas.length) { tas[0] = der; for (;;) { var l = 2 * k + 1, r = l + 1, m = k; if (l < tas.length && tas[l][0] < tas[m][0]) m = l; if (r < tas.length && tas[r][0] < tas[m][0]) m = r; if (m === k) break; var t = tas[m]; tas[m] = tas[k]; tas[k] = t; k = m; } } return haut; }
    for (q = 0; q < NB; q++) if (ga[q] < 0) { vu_[q] = 1; var qi = q % GX, qj = (q / GX) | 0, bord = false; for (var dj = -1; dj <= 1; dj++) for (var di = -1; di <= 1; di++) { var ni = qi + di, nj = qj + dj; if (ni >= 0 && nj >= 0 && ni < GX && nj < GY && ga[nj * GX + ni] >= 0) bord = true; } if (bord) monter(ga[q], q); }
    while (tas.length) { var cur = tirer_(), ci = cur[1] % GX, cj = (cur[1] / GX) | 0; for (dj = -1; dj <= 1; dj++) for (di = -1; di <= 1; di++) { ni = ci + di; nj = cj + dj; if (ni < 0 || nj < 0 || ni >= GX || nj >= GY) continue; var nq = nj * GX + ni; if (vu_[nq]) continue; vu_[nq] = 1; aval[nq] = cur[1]; ordre.push(nq); monter(Math.max(ga[nq], cur[0] + .01) + (di && dj ? .4 : 0), nq); } }
    var debit = new Float32Array(NB); for (q = 0; q < NB; q++) if (ga[q] >= 0) debit[q] = .6 + Math.min(1.6, ga[q] / 1400);   /* il pleut plus en montagne */
    for (q = ordre.length - 1; q >= 0; q--) if (aval[ordre[q]] >= 0) debit[aval[ordre[q]]] += debit[ordre[q]];
    var SEUIL = 34, amont = new Uint8Array(NB), pris = new Uint8Array(NB); for (q = 0; q < NB; q++) if (ga[q] >= 0 && debit[q] > SEUIL && aval[q] >= 0 && ga[aval[q]] >= 0 && debit[aval[q]] > SEUIL) amont[aval[q]] = 1;
    function centre(id) { var ii = id % GX, jj = (id / GX) | 0; return [(ii + .5 + (h3(ii, jj, G + 71) - .5) * .7) * gc, (jj + .5 + (h3(ii, jj, G + 72) - .5) * .7) * gc]; }
    function adoucir(P, W) { for (var tour = 0; tour < 2; tour++) { var Q = [P[0]], V = [W[0]], k; for (k = 0; k < P.length - 1; k++) { Q.push([P[k][0] * .75 + P[k + 1][0] * .25, P[k][1] * .75 + P[k + 1][1] * .25], [P[k][0] * .25 + P[k + 1][0] * .75, P[k][1] * .25 + P[k + 1][1] * .75]); V.push(W[k] * .75 + W[k + 1] * .25, W[k] * .25 + W[k + 1] * .75); } Q.push(P[P.length - 1]); V.push(W[W.length - 1]); P = Q; W = V; } return [P, W]; }
    function meandres(P, Wd, graineF, pasM) {
      var L = [0], k, out = [], ow = []; for (k = 1; k < P.length; k++) L.push(L[k - 1] + Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]));
      var tot = L[L.length - 1], d, c = 1; if (tot < pasM * 3) return [P, Wd];
      for (d = 0; d <= tot; d += pasM) { while (c < L.length - 1 && L[c] < d) c++; var t = (d - L[c - 1]) / ((L[c] - L[c - 1]) || 1), dx = P[c][0] - P[c - 1][0], dy = P[c][1] - P[c - 1][1], dn = Math.hypot(dx, dy) || 1, bout = Math.min(1, d / .0016, (tot - d) / .0007);
        var o = ((bruit(d / .0042, graineF * .37, 61) - .5) * .0013 + (bruit(d / .0011, graineF * .37, 62) - .5) * .00036 + (bruit(d / .0004, graineF * .37, 63) - .5) * .0001) * Math.max(0, bout);
        out.push([P[c - 1][0] + dx * t - dy / dn * o, P[c - 1][1] + dy * t + dx / dn * o]); ow.push(Wd[c - 1] + (Wd[c] - Wd[c - 1]) * t); }
      out.push(P[P.length - 1]); ow.push(Wd[Wd.length - 1]); return [out, ow];
    }
    var sourcesF = []; for (q = 0; q < NB; q++) if (ga[q] >= 0 && debit[q] > SEUIL && !amont[q]) sourcesF.push(q);
    sourcesF.sort(function (a, b) { var fa = 0, fb = 0, x; for (x = a; x >= 0 && ga[x] >= 0; x = aval[x]) fa++; for (x = b; x >= 0 && ga[x] >= 0; x = aval[x]) fb++; return fb - fa; });   /* les plus longs d'abord : ce sont les fleuves, les autres s'y jettent */
    M.fleuves = [];
    sourcesF.forEach(function (src) {
      var P = [], Wd = [], x = src, mer = false, fin = 0;
      while (x >= 0) { P.push(centre(x)); Wd.push(Math.sqrt(debit[x])); fin = debit[x]; if (ga[x] < 0) { mer = true; break; } if (pris[x]) break; pris[x] = 1; x = aval[x]; }
      if (P.length < 4) return; var A = adoucir(P, Wd), Ms = meandres(A[0], A[1], src, P.length > 14 ? .00013 : .0006), xa = 9, xb = -9, ya = 9, yb = -9;
      Ms[0].forEach(function (p) { xa = Math.min(xa, p[0]); xb = Math.max(xb, p[0]); ya = Math.min(ya, p[1]); yb = Math.max(yb, p[1]); });
      M.fleuves.push({ pts: Ms[0], w: Ms[1], nom: null, mer: mer, debit: fin, long: P.length, bo: [xa, ya, xb, yb] });
    });
    M.fleuves.filter(function (f) { return f.mer && f.long > 14; }).sort(function (a, b) { return b.long - a.long; }).forEach(function (f, n) { if (n < FLEUVES.length) f.nom = FLEUVES[n]; });
    M.debitMax = Math.sqrt(Math.max.apply(null, M.fleuves.map(function (f) { return f.debit; }).concat([1])));
    /* les villes : aux embouchures d'abord, le long des fleuves, sur les côtes, dans les terres */
    var cand = [];
    M.fleuves.forEach(function (f) { if (!f.nom) return; var p = f.pts[Math.max(0, f.pts.length - 7)]; cand.push([p[0], p[1], 0]); var m = f.pts[Math.floor(f.pts.length * .55)]; cand.push([m[0], m[1], 1]); });
    for (i = 0; i < 2600; i++) { var cx = R() * LARG, cy = R(), ca = alt(cx, cy, 6); if (ca > 6 && ca < 90) cand.push([cx, cy, 2]); else if (ca > 120 && ca < 900 && R() < .35) cand.push([cx, cy, 3]); }
    cand.sort(function (a, b) { return a[2] - b[2]; });
    M.villes = [];
    cand.forEach(function (c) { if (M.villes.length >= 38 || alt(c[0], c[1], 7) < 4) return; var ec = c[2] < 2 ? .07 : .056; if (M.villes.every(function (v) { return Math.hypot(v.x - c[0], v.y - c[1]) > ec; })) M.villes.push({ x: c[0], y: c[1] }); });
    M.villes.sort(function (a, b) { return Math.hypot(a.x - .8, a.y - .5) - Math.hypot(b.x - .8, b.y - .5); });
    var cap = 0; M.villes.forEach(function (v, n) { if (alt(v.x, v.y, 6) < 60 && cap === 0 && n < 8) cap = n; });
    M.villes.unshift(M.villes.splice(cap, 1)[0]);
    M.villes.forEach(function (v, n) {
      v.nom = VILLES[n % VILLES.length]; v.rang = n === 0 ? 0 : n < 8 ? 1 : n < 20 ? 2 : 3; v.r = [.0021, .0014, .00095, .0006][v.rang]; v.theta = R() * Math.PI; v.h = 3 + n * 7.31; v.id = n;
      v.quartiers = []; var nq = [7, 5, 3, 0][v.rang];
      for (var q = 0; q < nq; q++) { var an = v.theta + q / nq * 6.283 + R() * .5, ra = q === 0 ? 0 : v.r * (.34 + R() * .3); v.quartiers.push({ nom: QUARTIERS[(n * 3 + q) % QUARTIERS.length], x: v.x + Math.cos(an) * ra, y: v.y + Math.sin(an) * ra }); }
    });
    /* les routes : chaque ville rejoint ses deux ou trois voisines, par la terre */
    M.routes = []; var vues = {};
    M.villes.forEach(function (a) {
      M.villes.filter(function (b) { return b !== a; }).sort(function (b, c) { return Math.hypot(b.x - a.x, b.y - a.y) - Math.hypot(c.x - a.x, c.y - a.y); }).slice(0, a.rang < 2 ? 3 : 2).forEach(function (b) {
        var cle = Math.min(a.id, b.id) + '-' + Math.max(a.id, b.id); if (vues[cle]) return; vues[cle] = 1;
        var pts = [], n = 26, L = Math.hypot(b.x - a.x, b.y - a.y), nx = -(b.y - a.y) / L, ny = (b.x - a.x) / L, sec = true, t;
        for (t = 0; t <= n; t++) { var u = t / n, o = Math.sin(Math.PI * u) * ((bruit(a.h + u * 2.2, b.h, 55) - .5) * .34 + (bruit(a.h + u * 9, b.h, 56) - .5) * .08) * L, px = mix(a.x, b.x, u) + nx * o, py = mix(a.y, b.y, u) + ny * o; if (alt(px, py, 6) < -4) sec = false; pts.push([px, py]); }
        if (sec && L < .3) M.routes.push({ pts: pts, a: a, b: b, grande: Math.max(a.rang, b.rang) <= 1 });
      });
    });
    /* les régions et les mers : des points éloignés les uns des autres */
    function loin(test, nb, ecart) { var t = [], essais = 0; while (t.length < nb && essais++ < 6000) { var x = .08 + R() * (LARG - .16), y = .08 + R() * .84; if (test(alt(x, y, 5)) && t.every(function (p) { return Math.hypot(p[0] - x, p[1] - y) > ecart; })) t.push([x, y]); } return t; }
    M.regions = loin(function (a) { return a > 60; }, 8, .26).map(function (p, n) { return { x: p[0], y: p[1], nom: REGIONS[n] }; });
    M.mers = loin(function (a) { return a < -500; }, 6, .34).map(function (p, n) { return { x: p[0], y: p[1], nom: MERS[n] }; });
    /* les sommets : les points hauts de la grille */
    var hauts = []; for (j = 1; j < 60; j++) for (i = 1; i < 96; i++) { var hx = i / 96 * LARG, hy = j / 60, ha = alt(hx, hy, 7); if (ha > 1300) hauts.push([hx, hy, ha]); }
    hauts.sort(function (a, b) { return b[2] - a[2]; }); M.sommets = []; hauts.forEach(function (s) { if (M.sommets.length < 9 && M.sommets.every(function (g) { return Math.hypot(g[0] - s[0], g[1] - s[1]) > .11; })) M.sommets.push(s); });
    /* les repères d'exemple : des lieux de la capitale, des autres villes, de la côte et des hauteurs */
    var c0 = M.villes[0], P = M.reperes = [];
    function dans(v, a, r, nom, genre, dit) { P.push({ x: v.x + Math.cos(a) * v.r * r, y: v.y + Math.sin(a) * v.r * r, nom: nom, genre: genre, dit: dit, sur: v.nom }); }
    dans(c0, .2, .12, 'Halle aux grains', 'point', 'Le marché couvert, ouvert chaque matin.'); dans(c0, 1.9, .3, 'Théâtre du Cadran', 'point', 'Six cents places, une scène à l’italienne.');
    dans(c0, 3.4, .42, 'Gare maritime', 'anneau', 'Les départs pour les Sept-Îles.'); dans(c0, 4.6, .26, 'Pont Vieux', 'point', 'Trois arches, le plus ancien passage.');
    dans(c0, 5.5, .5, 'Observatoire', 'estime', 'Emplacement estimé d’après un plan ancien.'); dans(c0, 2.6, .58, 'Les Abattoirs', 'manque', 'Cité dans les textes, jamais situé.');
    dans(c0, .9, .5, 'Bibliothèque', 'anneau', 'Ouverte jusqu’à minuit.'); dans(c0, 4.1, .62, 'Arsenal', 'point', 'Les anciens chantiers, côté quai.');
    M.villes.slice(1, 8).forEach(function (v, n) { dans(v, n * 1.3, .2, ['Beffroi', 'Vieux marché', 'Citadelle', 'Écluse', 'Abbaye', 'Fort', 'Halle'][n] + ' de ' + v.nom, n % 3 === 1 ? 'anneau' : 'point', 'Le repère de ' + v.nom + '.'); });
    M.sommets.slice(0, 5).forEach(function (s, n) { P.push({ x: s[0], y: s[1], nom: ['Pic du Lézat', 'Dent de l’Aune', 'Grand Signal', 'Roc Noir', 'Tête de la Brune'][n], genre: n === 3 ? 'estime' : 'point', dit: (Math.round(s[2] / 10) * 10) + ' m' + (n === 3 ? ', altitude estimée.' : ', le point haut du massif.'), sur: 'sommet' }); });
    M.villes.slice(8, 13).forEach(function (v, n) { P.push({ x: v.x + .006, y: v.y - .004, nom: ['Phare de l’Aiguille', 'Gué du Nant', 'Carrière', 'Moulin des Roches', 'Refuge du col'][n], genre: n === 1 ? 'manque' : n === 2 ? 'estime' : 'anneau', dit: n === 1 ? 'On sait qu’il existe, pas où.' : 'À une lieue de ' + v.nom + '.', sur: 'campagne' }); });
    return M;
  }

  /* ══ Le plan d'une ville ══
     Une ville ancienne qui a grandi : une place d'où partent des rues courbes, des îlots inégaux ; le rempart devenu boulevard ; une ou deux
     percées droites ; l'extension en damier le long des routes ; les faubourgs ; la gare et son faisceau ; le fleuve, ses quais, ses ponts.
     En mètres autour du centre, tiré de la graine. Les axes (légers) servent aussi au réseau des trajets ; les îlots se calculent à la demande. */
  var UM = KM * 1000, TAU = Math.PI * 2, QUAI = 15;
  var PONTS = ['pont Neuf', 'pont au Change', 'pont des Tanneurs', 'pont Saint-Roch', 'passerelle des Arts', 'pont de la Halle', 'pont Vieux', 'pont de Pierre', 'pont des Moulins', 'pont du Levant', 'pont de l’Arsenal', 'passerelle du Cadran'];
  var PERCEES = ['rue Nationale', 'boulevard Neuf', 'rue Impériale', 'cours de la Liberté', 'rue de la République'];
  var BOULEVARDS = ['boulevard des Remparts', 'cours des Lices', 'boulevard de la Citadelle', 'mail des Tilleuls', 'boulevard du Levant', 'cours du Midi', 'boulevard de l’Arsenal', 'boulevard des Tanneurs'];
  var CEINTURES = ['boulevard de Ceinture', 'boulevard des Octrois', 'boulevard Saint-Roch', 'boulevard des Vignes', 'boulevard du Ponant', 'boulevard des Carmes', 'boulevard de la Vigie'];
  var QUAIS = ['quai des Tanneurs', 'quai aux Fleurs', 'quai du Port', 'quai des Célestins', 'quai de la Pêcherie', 'quai des Moulins', 'quai Saint-Roch', 'quai de la Halle', 'quai des Lavandières', 'quai du Levant'];
  var EDIFICES = ['cathédrale Saint-Aubin', 'église Sainte-Luce', 'collégiale Saint-Roch', 'église des Carmes'];
  function tour(a) { a %= TAU; return a < 0 ? a + TAU : a; }
  function coupeDemi(P, nx, ny, d) {   /* garde ce qui est du côté x·n ≥ d */
    var out = [], n = P.length, i; for (i = 0; i < n; i++) { var a = P[i], b = P[(i + 1) % n], da = a[0] * nx + a[1] * ny - d, db = b[0] * nx + b[1] * ny - d; if (da >= 0) out.push(a); if ((da >= 0) !== (db >= 0)) { var t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); } } return out;
  }
  function aire(P) { var s = 0, i, n = P.length; for (i = 0; i < n; i++) { var a = P[i], b = P[(i + 1) % n]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
  function centroide(P) { var x = 0, y = 0, i; for (i = 0; i < P.length; i++) { x += P[i][0]; y += P[i][1]; } return [x / P.length, y / P.length]; }
  function retrait(P, e) {   /* rentre chaque côté de e mètres : la rue est le vide entre deux îlots */
    var s = aire(P) > 0 ? 1 : -1, Q = P, i, n = P.length;
    for (i = 0; i < n && Q.length > 2; i++) { var a = P[i], b = P[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy); if (L < .5) continue; var nx = -dy / L * s, ny = dx / L * s; Q = coupeDemi(Q, nx, ny, a[0] * nx + a[1] * ny + e); }
    return Q;
  }
  function seau(G) {   /* une grille de seaux : ce qui est près d'un point, vite */
    var m = new Map(), tic = 1;
    return { m: m, G: G,
      mettre: function (x0, y0, x1, y1, v) { var i, j; for (j = Math.floor(y0 / G); j <= Math.floor(y1 / G); j++) for (i = Math.floor(x0 / G); i <= Math.floor(x1 / G); i++) { var k = i * 65536 + j, l = m.get(k); if (!l) m.set(k, l = []); l.push(v); } },
      voir: function (x0, y0, x1, y1, f) { tic++; var i, j, z; for (j = Math.floor(y0 / G); j <= Math.floor(y1 / G); j++) for (i = Math.floor(x0 / G); i <= Math.floor(x1 / G); i++) { var l = m.get(i * 65536 + j); if (l) for (z = 0; z < l.length; z++) if (l[z]._t !== tic) { l[z]._t = tic; f(l[z]); } } } };
  }
  /* le cours d'un fleuve tel qu'on le dessine (une spline par les milieux), en points du monde, avec sa largeur */
  function rive(M, f) {
    if (f.sp) return f.sp; var P = f.pts, n = P.length, out = [[P[0][0], P[0][1], f.w[0]]], i, t;
    for (i = 1; i < n - 1; i++) { var a = [(P[i - 1][0] + P[i][0]) / 2, (P[i - 1][1] + P[i][1]) / 2], b = [(P[i][0] + P[i + 1][0]) / 2, (P[i][1] + P[i + 1][1]) / 2]; for (t = 0; t < 4; t++) { var s = t / 4; out.push([(1 - s) * (1 - s) * a[0] + 2 * s * (1 - s) * P[i][0] + s * s * b[0], (1 - s) * (1 - s) * a[1] + 2 * s * (1 - s) * P[i][1] + s * s * b[1], f.w[i]]); } }
    out.push([P[n - 1][0], P[n - 1][1], f.w[n - 1]]); return (f.sp = out);
  }
  function polyBoite(P) { var b = [1e9, 1e9, -1e9, -1e9]; P.forEach(function (p) { b[0] = Math.min(b[0], p[0]); b[1] = Math.min(b[1], p[1]); b[2] = Math.max(b[2], p[0]); b[3] = Math.max(b[3], p[1]); }); return b; }

  /* les axes d'une ville : les rues qui rayonnent, le rempart, la ceinture, les percées, les places, la gare, l'eau */
  function axes(M, c) {
    if (c.ax) return c.ax;
    var hc = (c.h * 10) | 0, Rm = c.r * UM, rg = c.rang, i, k, ax = {};
    function A(a, b) { return h3(a, b, hc + 400); }
    function lim(t) { return .8 + .4 * bruit(Math.cos(t) * 1.6 + c.h, Math.sin(t) * 1.6, 93); }
    var r1 = Rm * [.27, .3, .38, .5][rg], r2 = rg < 2 ? Rm * [.6, .64][rg] : 0;
    function R1(t) { return r1 * (.86 + .28 * bruit(Math.cos(t) * 1.1 + c.h, Math.sin(t) * 1.1, 97)); }
    function R2(t) { return r2 * (.9 + .2 * bruit(Math.cos(t) * 1.4 + c.h, Math.sin(t) * 1.4, 99)); }
    function Rout(t) { return Rm * lim(t); }
    function Rext(t) { return r2 ? R2(t) : Rout(t) * .62; }
    function sec(x, y) { return M.alt(c.x + x / UM, c.y + y / UM, 8) > 1.5; }
    /* les portes : les routes qui arrivent, puis assez de rues pour qu'aucun côté ne reste sans issue */
    var dirs = [], gardes = [];
    M.routes.forEach(function (r) { if (r.a !== c && r.b !== c) return; var p = r.a === c ? r.pts[1] : r.pts[r.pts.length - 2], o2 = r.a === c ? r.b : r.a; dirs.push({ t: tour(Math.atan2(p[1] - c.y, p[0] - c.x)), vers: o2.nom, route: r }); });
    dirs.forEach(function (d) { var pres = null; gardes.forEach(function (e) { var g = Math.abs(d.t - e.t); if (Math.min(g, TAU - g) < .42) pres = e; }); if (pres) pres.aussi.push(d.route); else { d.aussi = []; gardes.push(d); } });
    var nr = [7, 6, 5, 4][rg], tri = function (a, b) { return a.t - b.t; };
    while (gardes.length < nr) {
      if (!gardes.length) { gardes.push({ t: A(1, 1) * TAU, aussi: [] }); continue; }
      gardes.sort(tri); var gm = -1, im = 0; for (i = 0; i < gardes.length; i++) { var a1 = i + 1 < gardes.length ? gardes[i + 1].t : gardes[0].t + TAU; if (a1 - gardes[i].t > gm) { gm = a1 - gardes[i].t; im = i; } }
      gardes.push({ t: tour(gardes[im].t + gm * (.5 + (A(gardes.length, 3) - .5) * .16)), aussi: [] });
    }
    gardes.sort(tri);
    var rads = gardes.map(function (d, n2) { return { t0: d.t, amp: (A(n2, 5) - .5) * .32, fr: 700 + A(n2, 6) * 900, ph: A(n2, 7) * 9, fin: Rout(d.t) * 1.18, vers: d.vers || null, route: d.route || null, aussi: d.aussi }; });
    function angR(r, rho) { var u = Math.min(1, rho / r.fin); return r.t0 + r.amp * Math.sin(Math.PI * u) * .6 + (bruit(rho / r.fr + r.ph, c.h, 61) - .5) * .14 * (1 - u); }
    var nR = rads.length;
    function secteur(rho, th) { if (nR < 2) return 0; for (var s = 0; s < nR; s++) { var a = angR(rads[s], rho), w = tour(angR(rads[(s + 1) % nR], rho) - a); if (tour(th - a) < w) return s; } return 0; }
    /* les tracés, chacun avec sa demi-largeur (m) */
    var obst = [];
    function ajout(o) { o.id = obst.length; obst.push(o); return o; }
    rads.forEach(function (r, n2) {
      var p = [], hw = [], z = [], rho; for (rho = 0; rho <= r.fin; rho += 40) { var t = angR(r, rho); p.push([Math.cos(t) * rho, Math.sin(t) * rho]); var zz = rho < R1(t) ? 0 : rho < Rext(t) ? 1 : 2; z.push(zz); hw.push([8, 11, 7][zz]); }
      r.pts = p; r.z = z; ajout({ pts: p, hw: hw, bord: true, genre: 'radiale', r: r });
    });
    function anneau(Rf, hw, genre) { var p = [], h = [], t; for (k = 0; k <= 240; k++) { t = k / 240 * TAU; var rr = Rf(t); p.push([Math.cos(t) * rr, Math.sin(t) * rr]); h.push(hw); } return ajout({ pts: p, hw: h, bord: true, genre: genre, ferme: true }); }
    ax.rempart = anneau(R1, 20, 'rempart'); if (r2) ax.ceinture = anneau(R2, 14, 'ceinture');
    var nP = [2, 1, 1, 0][rg]; ax.percees = [];
    for (k = 0; k < nP; k++) {
      var phi = A(k, 11) * Math.PI + k * 1.3, off = (A(k, 12) - .5) * r1 * .5; off += off < 0 ? -r1 * .1 : r1 * .1;
      var dx = Math.cos(phi), dy = Math.sin(phi), pp = [], hp = [], prev = null, s2;
      for (s2 = -r1 * 1.5; s2 <= r1 * 1.5; s2 += 40) { var x = -dy * off + dx * s2, y = dx * off + dy * s2, dedans = Math.hypot(x, y) < R1(Math.atan2(y, x)) + 6; if (dedans) { if (!pp.length && prev) { pp.push(prev); hp.push(12); } pp.push([x, y]); hp.push(12); } else if (pp.length) { pp.push([x, y]); hp.push(12); break; } prev = [x, y]; }
      if (pp.length > 3) ax.percees.push(ajout({ pts: pp, hw: hp, bord: false, genre: 'percee', nom: PERCEES[(hc + k) % PERCEES.length] }));
    }
    /* dans le vieux centre : des rues courbes qui rayonnent sans toucher la place, et le tracé de la première enceinte */
    function largeurA(s2, rho) { return nR < 2 ? TAU : tour(angR(rads[(s2 + 1) % nR], rho) - angR(rads[s2], rho)); }
    ax.ruelles = [];
    for (var s3 = 0; s3 < nR; s3++) {
      var nS = Math.max(0, Math.floor(largeurA(s3, r1) * r1 / 520));
      for (k = 0; k < nS; k++) {
        var f0 = (k + 1 + (A(s3 * 17 + k, 31) - .5) * .5) / (nS + 1), r0 = 150 + A(s3 * 17 + k, 34) * 340, wg = A(s3 * 17 + k, 35) * 9, pr = [], hr = [], rho3;
        for (rho3 = r0; rho3 < r1 * 1.25; rho3 += 30) { var f3 = f0 + (bruit(rho3 / 330 + wg, s3 * 1.3, 33) - .5) * .55 / (nS + 1), t3 = angR(rads[s3], rho3) + largeurA(s3, rho3) * f3; pr.push([Math.cos(t3) * rho3, Math.sin(t3) * rho3]); hr.push(5); if (rho3 > R1(t3)) break; }
        if (pr.length > 4) ax.ruelles.push(ajout({ pts: pr, hw: hr, bord: false, genre: 'ruelle', nom: 'rue ' + RUES[Math.floor(A(s3 * 11 + k, 42) * RUES.length)] }));
      }
    }
    var rF = r1 * (.48 + A(3, 3) * .1), pf = [], hf = [], nF = 0;
    for (k = 0; k <= 180; k++) { var tf = k / 180 * TAU, on = bruit(tf * 1.7, c.h, 36) > .36, rr3 = rF * (.9 + .2 * bruit(Math.cos(tf) * 1.3 + c.h, Math.sin(tf) * 1.3, 37)); if (on) { pf.push([Math.cos(tf) * rr3, Math.sin(tf) * rr3]); hf.push(6); } if ((!on || k === 180) && pf.length) { if (pf.length > 6) ax.ruelles.push(ajout({ pts: pf, hw: hf, bord: false, genre: 'ruelle', nom: ['rue des Fossés', 'rue du Vieux-Mur', 'rue des Lices-Vieilles', 'rue de l’Enceinte'][nF++ % 4] })); pf = []; hf = []; } }
    /* les places : au centre, et à certaines portes du rempart */
    ax.places = [{ x: 0, y: 0, r: [115, 95, 75, 58][rg], nom: PLACES[hc % PLACES.length], centre: true }];
    rads.forEach(function (r, n2) { if (A(n2, 13) < .42) return; var rr = R1(r.t0), t = angR(r, rr); rr = R1(t); ax.places.push({ x: Math.cos(t) * rr, y: Math.sin(t) * rr, r: 34 + A(n2, 14) * 16, nom: r.vers ? 'place de la Porte-de-' + r.vers.replace(/^(Les |Le |La )/, '') : 'place de la ' + ['Porte-Haute', 'Porte-Neuve', 'Porte-Basse', 'Barrière'][n2 % 4] }); });
    /* la gare : hors les murs, dans le secteur le plus large ; son faisceau part vers la campagne */
    if (rg < 3 && nR > 1) {
      var sm = 0, wm = -1; for (k = 0; k < nR; k++) { var w2 = tour(rads[(k + 1) % nR].t0 - rads[k].t0); if (w2 > wm) { wm = w2; sm = k; } }
      var tg = rads[sm].t0 + wm * (.5 + (A(21, 2) - .5) * .2), rhoG = R1(tg) + (Rext(tg) - R1(tg)) * .42, hw0 = [62, 50, 36][rg], L1 = [650, 520, 380][rg], cb = (A(21, 1) - .5) * .5;
      var gp = [], gh = [], rho2;
      for (rho2 = rhoG - 80; rho2 < Rout(tg) * 1.32; rho2 += 40) { var tt = tg + cb * Math.max(0, rho2 - rhoG) / Rm, sg = rho2 - rhoG; gp.push([Math.cos(tt) * rho2, Math.sin(tt) * rho2]); gh.push(sg < L1 ? hw0 : sg < L1 + 360 ? mix(hw0, 8, seg(sg, L1, L1 + 360)) : 8); }
      var ux = Math.cos(tg), uy = Math.sin(tg), Gx = ux * rhoG, Gy = uy * rhoG, vx = -uy, vy = ux, bw = hw0 + 6;
      ax.gare = { o: ajout({ pts: gp, hw: gh, bord: false, genre: 'voie' }), G: [Gx, Gy], u: [ux, uy], hw0: hw0, L1: L1, nT: [9, 7, 5][rg], nom: rg ? 'la gare' : 'la gare Centrale',
        bat: [[Gx - ux * 66 + vx * bw, Gy - uy * 66 + vy * bw], [Gx - ux * 34 + vx * bw, Gy - uy * 34 + vy * bw], [Gx - ux * 34 - vx * bw, Gy - uy * 34 - vy * bw], [Gx - ux * 66 - vx * bw, Gy - uy * 66 - vy * bw]] };
      ax.places.push({ x: Gx - ux * 112, y: Gy - uy * 112, r: 40, nom: 'place de la Gare' });
    }
    ax.places.forEach(function (p) { ajout({ rond: true, x: p.x, y: p.y, rr: p.r, bord: true, genre: 'place' }); });
    /* l'eau qui traverse : la spline du fleuve, sa demi-largeur, et la place du quai */
    ax.fleuves = [];
    M.fleuves.forEach(function (f) {
      var mg = c.r * 1.6; if (f.bo[2] < c.x - mg || f.bo[0] > c.x + mg || f.bo[3] < c.y - mg || f.bo[1] > c.y + mg) return; var run = null;
      rive(M, f).forEach(function (p) { var x = (p[0] - c.x) * UM, y = (p[1] - c.y) * UM; if (Math.hypot(x, y) < Rm * 1.45) { if (!run) { run = { f: f, pts: [], lit: [] }; ax.fleuves.push(run); } run.pts.push([x, y]); run.lit.push((12 + 62 * p[2] / M.debitMax) / 2); } else run = null; });
    });
    ax.fleuves = ax.fleuves.filter(function (r) { return r.pts.length > 2; });
    ax.fleuves.forEach(function (r) { r.o = ajout({ pts: r.pts, hw: r.lit.map(function (l) { return l + QUAI; }), bord: false, genre: 'eau', run: r }); });
    /* les segments de tout cela, rangés en seaux */
    var os = seau(120);
    obst.forEach(function (o) {
      if (o.rond) { os.mettre(o.x - o.rr, o.y - o.rr, o.x + o.rr, o.y + o.rr, { o: o }); return; }
      for (var q = 0; q < o.pts.length - 1; q++) { var a = o.pts[q], b = o.pts[q + 1], hm = Math.max(o.hw[q], o.hw[q + 1]); os.mettre(Math.min(a[0], b[0]) - hm, Math.min(a[1], b[1]) - hm, Math.max(a[0], b[0]) + hm, Math.max(a[1], b[1]) + hm, { o: o, q: q, a: a, b: b, ha: o.hw[q], hb: o.hw[q + 1], deb: q === 0 && !o.ferme, fin: q === o.pts.length - 2 && !o.ferme }); }
    });
    ax.A = A; ax.Rm = Rm; ax.r1 = r1; ax.r2 = r2; ax.R1 = R1; ax.R2 = R2; ax.Rout = Rout; ax.Rext = Rext; ax.rads = rads; ax.angR = angR; ax.secteur = secteur; ax.obst = obst; ax.os = os; ax.sec = sec; ax.hc = hc;
    return (c.ax = ax);
  }
  /* un polygone, taillé par les grands tracés : un boulevard garde le côté de l'îlot ; un fleuve, une percée, une voie coupent en deux */
  function tailler(P, ax, ref) {
    var g = ref || centroide(P), R = 0, b = polyBoite(P), best = {}, ids = [];
    P.forEach(function (p) { R = Math.max(R, Math.hypot(p[0] - g[0], p[1] - g[1])); });
    ax.os.voir(b[0] - 70, b[1] - 70, b[2] + 70, b[3] + 70, function (s) {
      var o = s.o; if (o.rond) { var dr = Math.hypot(g[0] - o.x, g[1] - o.y); if (dr < o.rr + R) { best[o.id] = { s: s, d: dr }; ids.push(o.id); } return; }
      var dx = s.b[0] - s.a[0], dy = s.b[1] - s.a[1], L2 = dx * dx + dy * dy || 1, t = ((g[0] - s.a[0]) * dx + (g[1] - s.a[1]) * dy) / L2, tc = borne(t, 0, 1), qx = s.a[0] + dx * tc, qy = s.a[1] + dy * tc, d = Math.hypot(g[0] - qx, g[1] - qy);
      if ((s.deb && t < 0) || (s.fin && t > 1)) return;
      var e = best[o.id]; if (!e) ids.push(o.id); if (!e || d < e.d) best[o.id] = { s: s, d: d, t: tc, q: [qx, qy], n: [-dy / Math.sqrt(L2), dx / Math.sqrt(L2)] };
    });
    var pieces = [P];
    ids.forEach(function (id) {
      var e = best[id], o = e.s.o, sortie = [];
      if (o.rond) { if (e.d < 1) { pieces = []; return; } var nx = (g[0] - o.x) / e.d, ny = (g[1] - o.y) / e.d; pieces.forEach(function (Q) { var A2 = coupeDemi(Q, nx, ny, o.x * nx + o.y * ny + o.rr); if (A2.length > 2) sortie.push(A2); }); pieces = sortie; return; }
      var hw = mix(e.s.ha, e.s.hb, e.t), n = e.n, cst = e.q[0] * n[0] + e.q[1] * n[1], cote = (g[0] - e.q[0]) * n[0] + (g[1] - e.q[1]) * n[1];
      if (Math.abs(cote) > hw + R) return;
      pieces.forEach(function (Q) {
        if (!o.bord || cote >= 0) { var A2 = coupeDemi(Q, n[0], n[1], cst + hw); if (A2.length > 2) sortie.push(A2); }
        if (!o.bord || cote < 0) { var B2 = coupeDemi(Q, -n[0], -n[1], -cst + hw); if (B2.length > 2) sortie.push(B2); }
      });
      pieces = sortie;
    });
    return pieces;
  }
  /* près d'une côte : l'îlot recule jusqu'au quai */
  function rivage(Q, ax) {
    for (var tour2 = 0; tour2 < 4; tour2++) {
      var g = centroide(Q), mouille = -1, i; for (i = 0; i < Q.length; i++) if (!ax.sec(Q[i][0], Q[i][1])) { mouille = i; break; } if (mouille < 0) return Q;
      var a = 0, b = 1, v = Q[mouille], z; for (z = 0; z < 6; z++) { var m = (a + b) / 2; if (ax.sec(mix(g[0], v[0], m), mix(g[1], v[1], m))) a = m; else b = m; }
      var px = mix(g[0], v[0], a), py = mix(g[1], v[1], a), d = Math.hypot(g[0] - px, g[1] - py); if (d < 12) return null;
      var nx = (g[0] - px) / d, ny = (g[1] - py) / d; Q = coupeDemi(Q, nx, ny, px * nx + py * ny + 9); if (Q.length < 3) return null;
    }
    return Q;
  }

  /* les îlots d'une ville, ses rues à nommer, ses ponts : calculés une fois, au premier passage */
  function ilots(M, c) {
    if (c.il) return c.il;
    var ax = axes(M, c), A = ax.A, Rm = ax.Rm, rads = ax.rads, nR = rads.length, k, i, j, s, q;
    var cellules = [], chaines = [];
    function polaire(rho, t) { return [Math.cos(t) * rho, Math.sin(t) * rho]; }
    function largeur(s2, rho) { return nR < 2 ? TAU : tour(ax.angR(rads[(s2 + 1) % nR], rho) - ax.angR(rads[s2], rho)); }
    function angF(s2, f, rho) { return ax.angR(rads[s2], rho) + largeur(s2, rho) * f; }
    var rP = ax.places[0].r;
    function voronoi(G, ka) {   /* à chaque germe son îlot ; la distance compte moins le long des rues qui rayonnent (ka), les îlots s'allongent vers la place */
      var sx = seau(200), out = []; G.forEach(function (g) { sx.mettre(g[0], g[1], g[0], g[1], g); });
      G.forEach(function (g) {
        if (g[3] < 0) { out.push([]); return; }
        var B = g[2] * 1.5 * ka, P = [[g[0] - B, g[1] - B], [g[0] + B, g[1] - B], [g[0] + B, g[1] + B], [g[0] - B, g[1] + B]], V = [], z;
        sx.voir(g[0] - B * 2, g[1] - B * 2, g[0] + B * 2, g[1] + B * 2, function (h) { if (h !== g) V.push([Math.hypot(h[0] - g[0], h[1] - g[1]), h]); });
        V.sort(function (a, b) { return a[0] - b[0]; });
        for (z = 0; z < V.length && P.length > 2; z++) {
          var d = V[z][0], h = V[z][1], R2 = 0; if (d < 1e-6) continue; P.forEach(function (p) { R2 = Math.max(R2, Math.hypot(p[0] - g[0], p[1] - g[1])); }); if (d > 2 * R2 * ka) break;
          var mx = (g[0] + h[0]) / 2, my = (g[1] + h[1]) / 2, rm = Math.hypot(mx, my) || 1, ph = Math.atan2(my, mx) + (bruit(mx / 650 + c.h, my / 650, 39) - .5) * 1.9, ex = Math.cos(ph), ey = Math.sin(ph), dx = g[0] - h[0], dy = g[1] - h[1], dr = (dx * ex + dy * ey) / (ka * ka), dt = -dx * ey + dy * ex, nx = dr * ex - dt * ey, ny = dr * ey + dt * ex, nl = Math.hypot(nx, ny) || 1;
          nx /= nl; ny /= nl; P = coupeDemi(P, nx, ny, mx * nx + my * ny);
        }
        out.push(P);
      });
      return out;
    }
    /* — le vieux centre : des germes semés en bandes autour de la place, à chacun son îlot (secteur par secteur) — */
    for (s = 0; s < nR; s++) {
      var germes = [], ra = rP + 8, bi = 0, KA = 1.45;
      while (ra < ax.r1 * 1.2) {
        var sp = 50 + 48 * Math.min(1, ra / ax.r1), rb = ra + sp * KA * (.75 + A(s * 41 + bi, 32) * .5), rm = (ra + rb) / 2, nb = Math.max(1, Math.round(largeur(s, rm) * rm / sp));
        for (q = 0; q < nb; q++) { var f = (q + .5 + (A(s * 131 + bi, q + 50) - .5) * .7) / nb, rr0 = rm + (A(s * 37 + q, bi + 70) - .5) * .6 * (rb - ra), t0 = angF(s, f, rr0); if (rr0 > ax.R1(t0) - 12) continue; germes.push([Math.cos(t0) * rr0, Math.sin(t0) * rr0, sp, s * 100000 + bi * 300 + q]); }
        ra = rb; bi++;
      }
      /* des reflets de l'autre côté des grandes rues, du rempart et de la place : la limite des îlots tombe juste sur elles */
      var reflets = [];
      germes.forEach(function (g) { var rr = Math.hypot(g[0], g[1]), t = Math.atan2(g[1], g[0]), m = g[2] * 1.6, z, ta;
        for (z = 0; z < 2; z++) { ta = ax.angR(rads[(s + z) % nR], rr); var dt = Math.abs(tour(t - ta + Math.PI) - Math.PI); if (dt * rr < m) reflets.push([Math.cos(2 * ta - t) * rr, Math.sin(2 * ta - t) * rr, g[2], -1]); }
        var r1t = ax.R1(t); if (r1t - rr < m * KA) reflets.push([Math.cos(t) * (2 * r1t - rr), Math.sin(t) * (2 * r1t - rr), g[2], -1]);
        if (rr - rP < m * KA) reflets.push([Math.cos(t) * Math.max(2, 2 * rP - rr), Math.sin(t) * Math.max(2, 2 * rP - rr), g[2], -1]); });
      voronoi(germes.concat(reflets), KA).forEach(function (P, n2) { if (n2 < germes.length && P.length > 2) cellules.push([P, 0, germes[n2][3], germes[n2]]); });
    }
    ax.ruelles.forEach(function (o) { chaines.push({ pts: o.pts, nom: o.nom, l: 10 }); });
    /* — l'extension et les faubourgs : un damier par secteur, aligné sur sa grande rue — */
    var fusion = {};
    for (s = 0; s < nR; s++) {
      var rA = rads[s], rho0 = ax.R1(rA.t0), al = ax.angR(rA, (ax.r1 + Rm) / 2) + (A(s, 51) - .5) * .22, ga = 165 + 85 * A(s, 52), gb = 105 + 55 * A(s, 53), cu = Math.cos(al), su = Math.sin(al);
      var ox = Math.cos(rA.t0) * rho0, oy = Math.sin(rA.t0) * rho0, umin = 1e9, umax = -1e9, vmin = 1e9, vmax = -1e9, rho;
      for (rho = ax.r1 * .8; rho < Rm * 1.3; rho += 200) for (q = 0; q <= 8; q++) { var pq = polaire(rho, angF(s, q / 8, rho)), uu = (pq[0] - ox) * cu + (pq[1] - oy) * su, vv = -(pq[0] - ox) * su + (pq[1] - oy) * cu; umin = Math.min(umin, uu); umax = Math.max(umax, uu); vmin = Math.min(vmin, vv); vmax = Math.max(vmax, vv); }
      var i0 = Math.floor(umin / ga) - 1, i1 = Math.ceil(umax / ga) + 1, j0 = Math.floor(vmin / gb) - 1, j1 = Math.ceil(vmax / gb) + 1;
      var nd = function (ii, jj) { var u = ii * ga + (A(ii * 31 + s, jj * 17 + 3) - .5) * 14, v = jj * gb + (A(ii * 29 + s, jj * 13 + 5) - .5) * 14; return [ox + u * cu - v * su, oy + u * su + v * cu]; };
      var fus = function (ii, jj) { var key = s + ':' + ii + ':' + jj; if (fusion[key] === undefined) fusion[key] = A(ii * 7 + s * 3, jj * 13 + 11) < .16 && !fus(ii - 1, jj); return fusion[key]; };
      var dedansExt = function (p) { var rr = Math.hypot(p[0], p[1]), t = Math.atan2(p[1], p[0]); return rr > ax.R1(t) + 25 && rr < ax.Rext(t) - 10 && ax.secteur(rr, t) === s; };
      for (j = j0; j < j1; j++) for (i = i0; i < i1; i++) {
        if (fus(i - 1, j)) continue; var i2 = fus(i, j) ? i + 2 : i + 1, P = [nd(i, j), nd(i2, j), nd(i2, j + 1), nd(i, j + 1)], g = centroide(P), rr = Math.hypot(g[0], g[1]), t = Math.atan2(g[1], g[0]);
        if (rr < ax.R1(t) || rr > ax.Rout(t) * 1.16 || ax.secteur(rr, t) !== s) continue;
        var zl = ax.Rext(t), z = rr < zl ? 1 : 2;
        if (z === 1 && !ax.r2 && rr > zl * .82 && A(i * 3 + s, j * 5) < seg(rr / zl, .82, 1) * .5) continue;
        if (z === 2) {
          var dR = 1e9; rads.forEach(function (r2) { var d = Math.abs(tour(t - ax.angR(r2, rr) + Math.PI) - Math.PI) * rr; if (d < dR) dR = d; });
          if (dR > 120 + 240 * bruit(rr / 800 + s, t * 2, 77) && rr > zl + 260 * bruit(t * 3, c.h, 78)) continue;
          if (A(i * 7 + s, j * 11 + 1) < seg(rr / (ax.Rout(t) * 1.16), .5, 1) * .9) continue;
        }
        cellules.push([P, z, 500000 + s * 20000 + (j - j0) * 150 + (i - i0)]);
      }
      /* les rues du damier, pour les nommer : les lignes de nœuds qui restent dans l'extension */
      for (j = j0; j <= j1; j++) { var run = []; for (i = i0; i <= i1; i++) { var p2 = nd(i, j); if (dedansExt(p2)) run.push(p2); else { if (run.length > 3) chaines.push({ pts: run, nom: (j % 4 === 0 ? 'avenue ' : 'rue ') + RUES[Math.floor(A(s * 13 + j, 43) * RUES.length)], l: j % 4 === 0 ? 16 : 12 }); run = []; } } if (run.length > 3) chaines.push({ pts: run, nom: (j % 4 === 0 ? 'avenue ' : 'rue ') + RUES[Math.floor(A(s * 13 + j, 43) * RUES.length)], l: j % 4 === 0 ? 16 : 12 }); }
      for (i = i0; i <= i1; i++) { var run2 = []; for (j = j0; j <= j1; j++) { var p3 = nd(i, j); if (dedansExt(p3) && !fus(i - 1, j)) run2.push(p3); else { if (dedansExt(p3)) run2.push(p3); if (run2.length > 3) chaines.push({ pts: run2, nom: 'rue ' + RUES[Math.floor(A(s * 17 + i, 44) * RUES.length)], l: 12 }); run2 = []; } } if (run2.length > 3) chaines.push({ pts: run2, nom: 'rue ' + RUES[Math.floor(A(s * 17 + i, 44) * RUES.length)], l: 12 }); }
    }
    /* — les cellules deviennent des îlots : rentrées de la demi-rue, taillées par les grands tracés, gardées hors de l'eau — */
    var blocs = [], seaux = seau(400), plusGrand = null;
    cellules.forEach(function (cl) {
      var P = retrait(cl[0], [4.5, 6, 5][cl[1]]); if (P.length < 3) return;
      tailler(P, ax, cl[3]).forEach(function (Q, n2) {
        if (Math.abs(aire(Q)) < 240) return; var g = centroide(Q); if (!ax.sec(g[0], g[1])) return; Q = rivage(Q, ax); if (!Q || Q.length < 3) return; var a2 = Math.abs(aire(Q)); if (a2 < 240) return;
        var h = A(cl[2] + n2 * 7, 61), z = cl[1], rr = Math.hypot(g[0], g[1]), t = Math.atan2(g[1], g[0]), nat = 0;
        if (z === 0) nat = h < .03 ? 2 : h < .06 ? 1 : 0;
        else if (z === 1) nat = bruit(g[0] / 650 + c.h, g[1] / 650, 79) > .74 || (rr < ax.R1(t) + 130 && bruit(t * 2.2, c.h, 80) > .62) ? 1 : h < .02 ? 2 : h < .045 ? 1 : 0;
        else nat = h < .1 ? 1 : 0;
        var b = { p: Q, z: z, g: g, h: h, nat: nat, id: blocs.length, a: a2, bo: polyBoite(Q) };
        if (z === 0 && nat === 0 && rr < rP + 240 && (!plusGrand || a2 > plusGrand.a)) plusGrand = b;
        blocs.push(b); seaux.mettre(g[0], g[1], g[0], g[1], b);
      });
    });
    if (plusGrand) { plusGrand.nat = 3; plusGrand.nom = EDIFICES[ax.hc % EDIFICES.length]; }
    /* — l'eau : quais, ponts — */
    var fs = seau(150);
    ax.fleuves.forEach(function (r) { for (q = 0; q < r.pts.length - 1; q++) { var a = r.pts[q], b = r.pts[q + 1], hm = r.lit[q] + QUAI; fs.mettre(Math.min(a[0], b[0]) - hm, Math.min(a[1], b[1]) - hm, Math.max(a[0], b[0]) + hm, Math.max(a[1], b[1]) + hm, { r: r, q: q, a: a, b: b }); } });
    function mouille(x, y) { var m = false; fs.voir(x, y, x, y, function (s2) { if (m) return; var dx = s2.b[0] - s2.a[0], dy = s2.b[1] - s2.a[1], L2 = dx * dx + dy * dy || 1, t = borne(((x - s2.a[0]) * dx + (y - s2.a[1]) * dy) / L2, 0, 1); if (Math.hypot(x - s2.a[0] - dx * t, y - s2.a[1] - dy * t) < s2.r.lit[s2.q] + QUAI * .6) m = true; }); return m; }
    /* les grandes rues à nommer : par morceau, selon le quartier qu'elles traversent */
    rads.forEach(function (r, n2) {
      var noms = r.vers ? ['rue de ' + r.vers, 'avenue de ' + r.vers, 'route de ' + r.vers] : n2 === 0 ? ['Grande-Rue', 'avenue de la Grande-Rue', 'chemin des Prés'] : ['rue ' + RUES[(ax.hc + n2 * 3) % RUES.length], 'avenue ' + RUES[(ax.hc + n2 * 3 + 1) % RUES.length], 'chemin ' + RUES[(ax.hc + n2 * 3 + 2) % RUES.length]], cur = [], zc = r.z[0];
      r.pts.forEach(function (p, q2) { if (r.z[q2] !== zc) { if (cur.length > 2) chaines.push({ pts: cur, nom: noms[zc], l: [16, 22, 14][zc], grand: true }); cur = [cur[cur.length - 1] || p]; zc = r.z[q2]; } if (q2 * 40 > rP) cur.push(p); });
      if (cur.length > 2) chaines.push({ pts: cur, nom: noms[zc], l: [16, 22, 14][zc], grand: true });
    });
    [[ax.rempart, BOULEVARDS, 40], [ax.ceinture, CEINTURES, 28]].forEach(function (an) {
      if (!an[0]) return; var P = an[0].pts, coupesA = rads.map(function (r) { return Math.round(tour(ax.angR(r, ax.R1(r.t0))) / TAU * 240); }).sort(function (a, b) { return a - b; });
      coupesA.forEach(function (k0, n2) { var k1 = n2 + 1 < coupesA.length ? coupesA[n2 + 1] : coupesA[0] + 240, p = [], z; for (z = k0; z <= k1; z++) p.push(P[z % 240]); if (p.length > 4) chaines.push({ pts: p, nom: an[1][(ax.hc + n2) % an[1].length], l: an[2], grand: true }); });
    });
    ax.percees.forEach(function (o) { chaines.push({ pts: o.pts, nom: o.nom, l: 24, grand: true }); });
    /* les quais : deux traits le long de l'eau, là où la ville est dense ; un nom par tronçon */
    var quais = [];
    ax.fleuves.forEach(function (r, n2) {
      [1, -1].forEach(function (sg) {
        var cur = [], lg = 0, num = 0, z;
        for (z = 0; z < r.pts.length; z++) {
          var a = r.pts[Math.max(0, z - 1)], b = r.pts[Math.min(r.pts.length - 1, z + 1)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, p = r.pts[z], rr = Math.hypot(p[0], p[1]), t = Math.atan2(p[1], p[0]);
          var ville = rr < ax.Rext(t) * 1.04, o2 = r.lit[z] + QUAI, pq = [p[0] - dy / L * o2 * sg, p[1] + dx / L * o2 * sg];
          if (ville) { cur.push(pq); if (cur.length > 1) lg += Math.hypot(pq[0] - cur[cur.length - 2][0], pq[1] - cur[cur.length - 2][1]); }
          if ((!ville || lg > 850 || z === r.pts.length - 1) && cur.length > 2) { quais.push(cur); chaines.push({ pts: cur.map(function (p4) { return [p4[0] + dy / L * QUAI * .5 * sg, p4[1] - dx / L * QUAI * .5 * sg]; }), nom: QUAIS[(ax.hc + n2 * 5 + num++ * 2 + (sg > 0 ? 0 : 1)) % QUAIS.length], l: QUAI, quai: true }); cur = ville ? [pq] : []; lg = 0; }
          else if (!ville) cur = [];
        }
      });
    });
    /* les ponts : là où une rue rencontre l'eau ; les grandes toujours, les petites s'il n'y a pas de pont à moins de 420 m */
    var ponts = [], cand = [];
    function croise(P, l, grand, nom, voie) {
      for (var z = 0; z < P.length - 1; z++) { var a = P[z], b = P[z + 1]; fs.voir(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), function (s2) {
        var r1x = b[0] - a[0], r1y = b[1] - a[1], r2x = s2.b[0] - s2.a[0], r2y = s2.b[1] - s2.a[1], den = r1x * r2y - r1y * r2x; if (Math.abs(den) < 1e-9) return;
        var t = ((s2.a[0] - a[0]) * r2y - (s2.a[1] - a[1]) * r2x) / den, u = ((s2.a[0] - a[0]) * r1y - (s2.a[1] - a[1]) * r1x) / den; if (t < 0 || t > 1 || u < 0 || u > 1) return;
        var L1 = Math.hypot(r1x, r1y), L2 = Math.hypot(r2x, r2y), sn = Math.abs(den) / (L1 * L2); if (sn < .35) return;
        cand.push({ x: a[0] + r1x * t, y: a[1] + r1y * t, u: [r1x / L1, r1y / L1], lg: (s2.r.lit[s2.q] + 5) / sn, l: l, grand: grand, nom: nom, voie: voie, eau: s2.r.lit[s2.q] });
      }); }
    }
    ax.obst.forEach(function (o) { if (o.genre === 'radiale' || o.genre === 'rempart' || o.genre === 'ceinture' || o.genre === 'percee') croise(o.pts, o.genre === 'rempart' ? 40 : o.genre === 'ceinture' ? 28 : o.genre === 'percee' ? 24 : 18, true); });
    if (ax.gare) croise(ax.gare.o.pts, 14, true, null, true);
    chaines.forEach(function (ch) { if (!ch.grand && !ch.quai) croise(ch.pts, ch.l, false); });
    cand.forEach(function (p) { if (!p.grand && ponts.some(function (o) { return Math.hypot(o.x - p.x, o.y - p.y) < 420; })) return; if (ponts.some(function (o) { return Math.hypot(o.x - p.x, o.y - p.y) < 40; })) return; if (!p.voie) p.nom = PONTS[(ax.hc + ponts.length * 3) % PONTS.length]; ponts.push(p); });
    /* les noms des petites rues s'arrêtent au bord de l'eau */
    var coupe2 = []; chaines.forEach(function (ch) { if (ch.grand || ch.quai) { coupe2.push(ch); return; } var cur = []; ch.pts.forEach(function (p) { if (mouille(p[0], p[1])) { if (cur.length > 2) coupe2.push({ pts: cur, nom: ch.nom, l: ch.l }); cur = []; } else cur.push(p); }); if (cur.length > 2) coupe2.push({ pts: cur, nom: ch.nom, l: ch.l }); });
    chaines = coupe2; chaines.forEach(function (ch) { ch.bo = polyBoite(ch.pts); });
    /* les arbres du mail, sur l'ancien rempart */
    var arbres = [];
    [ax.rempart].forEach(function (o) { var P = o.pts, z, d = 0; for (z = 0; z < P.length - 1; z++) { var a = P[z], b = P[z + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L, t; for (t = (14 - d % 14); t < L; t += 14) { var x = a[0] + (b[0] - a[0]) * t / L, y = a[1] + (b[1] - a[1]) * t / L; [13, -13].forEach(function (of) { var X2 = x + nx * of, Y2 = y + ny * of; if (ax.sec(X2, Y2) && !mouille(X2, Y2)) arbres.push(X2, Y2); }); } d += L; } });
    /* le faisceau de la gare : les voies s'écartent devant les quais, puis se rejoignent en une double voie */
    var voies = [];
    if (ax.gare) { var gr = ax.gare, GP = gr.o.pts, nT = gr.nT, kk, z2; for (kk = 0; kk < nT; kk++) { var bout = kk === 0 || kk === nT - 1, lig = []; for (z2 = 0; z2 < GP.length; z2++) { var sg2 = z2 * 40 - 80; if (sg2 < 0) continue; if (!bout && sg2 > gr.L1 + 360) break; var a3 = GP[Math.max(0, z2 - 1)], b3 = GP[Math.min(GP.length - 1, z2 + 1)], dx3 = b3[0] - a3[0], dy3 = b3[1] - a3[1], L3 = Math.hypot(dx3, dy3) || 1, off0 = (kk - (nT - 1) / 2) * gr.hw0 * 1.7 / (nT - 1), off = mix(off0, kk < nT / 2 ? -2.5 : 2.5, seg(sg2, gr.L1, gr.L1 + 360)); lig.push([GP[z2][0] - dy3 / L3 * off, GP[z2][1] + dx3 / L3 * off]); } if (lig.length > 1) voies.push(lig); } }
    /* les chemins à dessiner : de loin, la ville entière d'un trait ; de près, par seaux de 400 m */
    var loin = new Path2D(), loinJ = new Path2D();
    function poser(path, P) { path.moveTo(P[0][0], P[0][1]); for (var z = 1; z < P.length; z++) path.lineTo(P[z][0], P[z][1]); path.closePath(); }
    blocs.forEach(function (b) { if (b.nat === 0 || b.nat === 3) poser(loin, b.p); else if (b.nat === 1) poser(loinJ, b.p); });
    seaux.m.forEach(function (l) { var bati = new Path2D(), jard = new Path2D(), place = new Path2D(); l.forEach(function (b) { poser(b.nat === 1 ? jard : b.nat === 2 ? place : bati, b.p); }); l.bati = bati; l.jardin = jard; l.place = place; });
    return (c.il = { voies: voies, blocs: blocs, seaux: seaux, chaines: chaines, ponts: ponts, quais: quais, arbres: new Float32Array(arbres), loin: loin, loinJ: loinJ, poser: poser });
  }
  /* les parcelles d'un îlot : des bâtiments sur rue, l'angle tenu, une cour au milieu */
  function lotir(b, A) {
    if (b.lots) return b.lots; var P = b.p, n = P.length, out = [], sg = aire(P) > 0 ? 1 : -1, per = 0, i;
    for (i = 0; i < n; i++) per += Math.hypot(P[(i + 1) % n][0] - P[i][0], P[(i + 1) % n][1] - P[i][1]);
    var large = 2 * b.a / per, dp = Math.min([14, 17, 12][b.z] + b.h * 4, large * .46), fr = [[7, 15], [11, 21], [9, 17]][b.z], vide = b.z === 2 ? .3 : .07;
    if (b.nat === 3 || large < 15 || b.a < 900) { out.push(P); return (b.lots = out); }
    /* les angles : là où le contour tourne vraiment */
    var coins = []; for (i = 0; i < n; i++) { var a = P[(i - 1 + n) % n], o = P[i], c2 = P[(i + 1) % n], t1 = Math.atan2(o[1] - a[1], o[0] - a[0]), t2 = Math.atan2(c2[1] - o[1], c2[0] - o[0]), d = Math.abs(tour(t2 - t1 + Math.PI) - Math.PI); if (d > .42) coins.push(i); }
    if (coins.length < 3) { coins = []; for (i = 0; i < 4; i++) coins.push(Math.floor(i * n / 4)); }
    /* à chaque angle : le point intérieur où se croisent les deux profondeurs ; les bâtiments sur rue s'arrêtent là, celui de l'angle le remplit */
    var num = 0, ang = coins.map(function (ci) {
      var V = P[ci], a = P[(ci - 1 + n) % n], c2 = P[(ci + 1) % n], lp = Math.hypot(V[0] - a[0], V[1] - a[1]) || 1, ln = Math.hypot(c2[0] - V[0], c2[1] - V[1]) || 1, ep = [(V[0] - a[0]) / lp, (V[1] - a[1]) / lp], en = [(c2[0] - V[0]) / ln, (c2[1] - V[1]) / ln], np = [-ep[1] * sg, ep[0] * sg], nn = [-en[1] * sg, en[0] * sg];
      var cr = ep[0] * en[1] - ep[1] * en[0], wx = (nn[0] - np[0]) * dp, wy = (nn[1] - np[1]) * dp, t = Math.abs(cr) < .05 ? 0 : borne((wx * en[1] - wy * en[0]) / cr, -2.5 * dp, 2.5 * dp), I = [V[0] + np[0] * dp + ep[0] * t, V[1] + np[1] * dp + ep[1] * t];
      return { V: V, I: I, sIn: Math.max(2, (V[0] - I[0]) * ep[0] + (V[1] - I[1]) * ep[1]), sOut: Math.max(2, (I[0] - V[0]) * en[0] + (I[1] - V[1]) * en[1]), ep: ep, en: en };
    });
    coins.forEach(function (ci, cn) {
      var cj = coins[(cn + 1) % coins.length], A0 = ang[cn], A1 = ang[(cn + 1) % coins.length], cote = [], z = ci; while (true) { cote.push(P[z]); if (z === cj) break; z = (z + 1) % n; if (cote.length > n + 1) break; }
      var coin = [[A0.V[0], A0.V[1]], [A0.V[0] + A0.en[0] * A0.sOut, A0.V[1] + A0.en[1] * A0.sOut], [A0.I[0], A0.I[1]], [A0.V[0] - A0.ep[0] * A0.sIn, A0.V[1] - A0.ep[1] * A0.sIn]]; coin.n = 1 + num * 2; num++; if (A(b.id * 5 + cn, 93) > vide * .5) out.push(coin);
      var L = [0]; for (z = 1; z < cote.length; z++) L.push(L[z - 1] + Math.hypot(cote[z][0] - cote[z - 1][0], cote[z][1] - cote[z - 1][1])); var tot = L[L.length - 1], t0 = A0.sOut, t1 = tot - A1.sIn; if (t1 - t0 < 4) return;
      var pt = function (d) { var k = 1; while (k < L.length - 1 && L[k] < d) k++; var t = (d - L[k - 1]) / ((L[k] - L[k - 1]) || 1), a = cote[k - 1], bb = cote[k], dx = bb[0] - a[0], dy = bb[1] - a[1], l2 = Math.hypot(dx, dy) || 1; return [a[0] + dx * t, a[1] + dy * t, -dy / l2 * sg, dx / l2 * sg, k]; };
      var t = t0, k2 = 0;
      while (t < t1 - 1) {
        var w = fr[0] + A(b.id * 7 + k2, num + 90) * (fr[1] - fr[0]), t2 = Math.min(t1, t + w); if (t1 - t2 < fr[0] * .6) t2 = t1;
        var pa = pt(t), pb = pt(t2), prof = dp * (.8 + A(b.id * 3 + k2, num + 91) * .2), poly = [[pa[0], pa[1]]];
        for (z = pa[4]; z < pb[4]; z++) poly.push([cote[z][0], cote[z][1]]);
        poly.push([pb[0], pb[1]], [pb[0] + pb[2] * prof, pb[1] + pb[3] * prof], [pa[0] + pa[2] * prof, pa[1] + pa[3] * prof]);
        if (A(b.id * 13 + k2, num + 92) > vide) { poly.n = 1 + num * 2; out.push(poly); }
        num++; k2++; t = t2;
      }
    });
    return (b.lots = out);
  }
  function rueProche(il, x, y) { var m = null, dm = 1e9; il.chaines.forEach(function (ch) { if (x < ch.bo[0] - 80 || x > ch.bo[2] + 80 || y < ch.bo[1] - 80 || y > ch.bo[3] + 80) return; for (var z = 0; z < ch.pts.length; z++) { var d = Math.hypot(ch.pts[z][0] - x, ch.pts[z][1] - y); if (d < dm) { dm = d; m = ch; } } }); return m ? m.nom : 'rue sans nom'; }
  function dansPoly(P, p) { var d = false, a, b; for (a = 0, b = P.length - 1; a < P.length; b = a++) if ((P[a][1] > p[1]) !== (P[b][1] > p[1]) && p[0] < (P[b][0] - P[a][0]) * (p[1] - P[a][1]) / (P[b][1] - P[a][1]) + P[a][0]) d = !d; return d; }

  /* ══ Le réseau : les routes entre les villes et les grandes rues des villes ; le chemin le plus court en temps ══
     Vitesses en km/h, à pied, à vélo, en voiture ; la pente ralentit ; hors du réseau, on marche, et c'est « estimé ». */
  var VIT = { nationale: [4.5, 18, 85], departementale: [4.5, 16, 60], route: [4.5, 15, 45], avenue: [4.5, 15, 35], boulevard: [4.5, 16, 38], rue: [4.5, 12, 22], hors: [3, 4, 4] };
  function reseau(M) {
    if (M.res) return M.res;
    var X = [], Y = [], Z = [], adj = [], grille = seau(.003);
    function noeud(x, y) { var i = X.length; X.push(x); Y.push(y); Z.push(Math.max(0, M.alt(x, y, 7))); adj.push([]); grille.mettre(x, y, x, y, { i: i }); return i; }
    function lier(a, b, g) { if (a !== b) { adj[a].push(b, g); adj[b].push(a, g); } }
    function suite(ids, g) { for (var z = 0; z < ids.length - 1; z++) lier(ids[z], ids[z + 1], typeof g === 'string' ? g : g[z]); }
    M.villes.forEach(function (c) {
      var ax = axes(M, c), L = [], nR = ax.rads.length;
      function w(p) { return [c.x + p[0] / UM, c.y + p[1] / UM]; }
      ax.rads.forEach(function (r) { L.push({ p: r.pts, g: r.z.map(function (z) { return ['rue', 'avenue', 'route'][z]; }), r: r }); });
      L.push({ p: ax.rempart.pts, g: 'boulevard', ferme: true }); if (ax.ceinture) L.push({ p: ax.ceinture.pts, g: 'boulevard', ferme: true });
      ax.percees.forEach(function (o) { L.push({ p: o.pts, g: 'avenue' }); }); ax.ruelles.forEach(function (o) { L.push({ p: o.pts, g: 'rue' }); });
      /* les carrefours : là où deux tracés se coupent */
      var sg = seau(160); L.forEach(function (l, li) { l.ev = l.p.map(function () { return []; }); for (var q = 0; q < l.p.length - 1; q++) { var a = l.p[q], b = l.p[q + 1]; sg.mettre(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), { li: li, q: q }); } });
      L.forEach(function (l, li) { for (var q = 0; q < l.p.length - 1; q++) { var a = l.p[q], b = l.p[q + 1]; sg.voir(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), function (o) {
        if (o.li <= li) return; var m = L[o.li], c2 = m.p[o.q], d2 = m.p[o.q + 1], r1x = b[0] - a[0], r1y = b[1] - a[1], r2x = d2[0] - c2[0], r2y = d2[1] - c2[1], den = r1x * r2y - r1y * r2x; if (Math.abs(den) < 1e-9) return;
        var t = ((c2[0] - a[0]) * r2y - (c2[1] - a[1]) * r2x) / den, u = ((c2[0] - a[0]) * r1y - (c2[1] - a[1]) * r1x) / den; if (t < 0 || t > 1 || u < 0 || u > 1) return;
        var id = noeud.apply(null, w([a[0] + r1x * t, a[1] + r1y * t])); l.ev[q].push([t, id]); m.ev[o.q].push([u, id]);
      }); } });
      var centre = noeud(c.x, c.y);
      L.forEach(function (l, li) {
        var ids = [], gs = [], q, prem = null;
        for (q = 0; q < l.p.length; q++) {
          var id = q === 0 && li < nR ? centre : l.ferme && q === l.p.length - 1 ? prem : noeud.apply(null, w(l.p[q])); if (q === 0) prem = id;
          if (q > 0) gs.push(typeof l.g === 'string' ? l.g : l.g[q - 1]); ids.push(id);
          if (q < l.p.length - 1) l.ev[q].sort(function (e1, e2) { return e1[0] - e2[0]; }).forEach(function (e) { gs.push(typeof l.g === 'string' ? l.g : l.g[q]); ids.push(e[1]); });
        }
        suite(ids, gs); if (l.r) l.r.bout = ids[ids.length - 1];
      });
      c.noeud = centre;
    });
    /* les routes : d'une porte à l'autre ; les longs tronçons sont recoupés, pour que les isochrones suivent la route */
    M.routes.forEach(function (r) {
      function porte(v) { var ax = axes(M, v), t = null; ax.rads.forEach(function (rd) { if (rd.route === r || rd.aussi.indexOf(r) >= 0) t = rd; }); return t && t.bout !== undefined ? t.bout : v.noeud; }
      var ids = [porte(r.a)], q, n = r.pts.length;
      for (q = 1; q < n; q++) {
        var a = q === 1 ? [X[ids[0]], Y[ids[0]]] : r.pts[q - 1], b = q === n - 1 ? [X[porte(r.b)], Y[porte(r.b)]] : r.pts[q], nb = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / .0005)), z;
        for (z = 1; z < nb; z++) ids.push(noeud(mix(a[0], b[0], z / nb), mix(a[1], b[1], z / nb)));
        ids.push(q === n - 1 ? porte(r.b) : noeud(b[0], b[1]));
      }
      suite(ids, r.grande ? 'nationale' : 'departementale');
    });
    return (M.res = { X: X, Y: Y, Z: Z, adj: adj, grille: grille, n: X.length });
  }
  function vHors(M, x, y, md) { return VIT.hors[md] / (1 + Math.max(0, M.alt(x, y, 6)) / 1500); }
  function proches(M, R, p, md) {   /* les nœuds les plus proches d'un point, et le temps pour les rejoindre à pied */
    var out = [], r = .003; while (!out.length && r < .05) { R.grille.voir(p[0] - r, p[1] - r, p[0] + r, p[1] + r, function (o) { var d = Math.hypot(R.X[o.i] - p[0], R.Y[o.i] - p[1]); if (d < r) out.push([o.i, d]); }); r *= 2.5; }
    out.sort(function (a, b) { return a[1] - b[1]; }); var v = vHors(M, p[0], p[1], md);
    return out.slice(0, 4).map(function (e) { return [e[0], e[1] * KM / v, e[1]]; });
  }
  function cout(R, a, b, g, md) { var dk = Math.hypot(R.X[b] - R.X[a], R.Y[b] - R.Y[a]) * KM, gr = (R.Z[b] - R.Z[a]) / Math.max(1, dk * 1000); return dk / VIT[g][md] * (md === 2 ? 1 + Math.abs(gr) * 3 : 1 + Math.max(0, gr) * (md ? 14 : 10) + Math.max(0, -gr) * 2); }
  function dijkstra(R, src, md, cibles, tmax) {
    var g = new Float64Array(R.n).fill(Infinity), prev = new Int32Array(R.n).fill(-1), hc = [], hi = [], best = Infinity, fin = -1;
    function pousser(c, i) { var k = hc.length; hc.push(c); hi.push(i); while (k > 0) { var p = (k - 1) >> 1; if (hc[p] <= hc[k]) break; var t = hc[p]; hc[p] = hc[k]; hc[k] = t; t = hi[p]; hi[p] = hi[k]; hi[k] = t; k = p; } }
    function tirer() { var c = hc[0], i = hi[0], lc = hc.pop(), li = hi.pop(), k = 0; if (hc.length) { hc[0] = lc; hi[0] = li; for (;;) { var l = 2 * k + 1, r = l + 1, m = k; if (l < hc.length && hc[l] < hc[m]) m = l; if (r < hc.length && hc[r] < hc[m]) m = r; if (m === k) break; var t = hc[m]; hc[m] = hc[k]; hc[k] = t; t = hi[m]; hi[m] = hi[k]; hi[k] = t; k = m; } } return [c, i]; }
    src.forEach(function (s) { if (s[1] < g[s[0]]) { g[s[0]] = s[1]; pousser(s[1], s[0]); } });
    while (hc.length) {
      var e = tirer(), c = e[0], i = e[1]; if (c > g[i]) continue; if (c >= best || c > tmax) break;
      if (cibles && cibles.has(i) && c + cibles.get(i) < best) { best = c + cibles.get(i); fin = i; }
      var A = R.adj[i]; for (var z = 0; z < A.length; z += 2) { var j = A[z], nc = c + cout(R, i, j, A[z + 1], md); if (nc < g[j]) { g[j] = nc; prev[j] = i; pousser(nc, j); } }
    }
    return { g: g, prev: prev, best: best, fin: fin };
  }
  function itineraire(M, A, B, md) {   /* d'un point à l'autre : le réseau, et à pied au bout ; sinon tout droit, estimé */
    var R = reseau(M), sa = proches(M, R, A, md), sb = proches(M, R, B, md), direct = Math.hypot(B[0] - A[0], B[1] - A[1]) * KM / vHors(M, (A[0] + B[0]) / 2, (A[1] + B[1]) / 2, md);
    if (!sa.length || !sb.length) return { pts: [A, B], hors: [true], h: direct };
    var cib = new Map(); sb.forEach(function (s) { cib.set(s[0], s[1]); }); var dj = dijkstra(R, sa, md, cib, direct * 8);
    if (dj.fin < 0 || (dj.best >= direct && Math.hypot(B[0] - A[0], B[1] - A[1]) * KM < .25)) return { pts: [A, B], hors: [true], h: direct };   /* tout droit seulement si le réseau n'y mène pas, ou pour quelques pas */
    var ch = [], i = dj.fin; while (i >= 0) { ch.push([R.X[i], R.Y[i]]); i = dj.prev[i]; } ch.reverse();
    var pts = [A].concat(ch, [B]), hors = pts.slice(1).map(function (p, z) { return z === 0 || z === pts.length - 2; });
    if (Math.hypot(ch[0][0] - A[0], ch[0][1] - A[1]) * KM < .02) hors[0] = false; if (Math.hypot(ch[ch.length - 1][0] - B[0], ch[ch.length - 1][1] - B[1]) * KM < .02) hors[hors.length - 1] = false;
    return { pts: pts, hors: hors, h: dj.best };
  }
  /* des courbes d'égal temps sur une grille d'écran : carrés marchants, puis les segments mis bout à bout */
  function isolignes(T, nx, ny, L, cell) {
    var seg2 = [], i, j;
    for (j = 0; j < ny - 1; j++) for (i = 0; i < nx - 1; i++) {
      var v0 = T[j * nx + i], v1 = T[j * nx + i + 1], v2 = T[(j + 1) * nx + i + 1], v3 = T[(j + 1) * nx + i], x = i * cell, y = j * cell;
      var c = (v0 < L ? 1 : 0) | (v1 < L ? 2 : 0) | (v2 < L ? 4 : 0) | (v3 < L ? 8 : 0); if (c === 0 || c === 15) continue;
      var f = function (a, b) { return a === b ? .5 : borne((L - a) / (b - a), 0, 1); }, t = [x + f(v0, v1) * cell, y], r = [x + cell, y + f(v1, v2) * cell], bb = [x + f(v3, v2) * cell, y + cell], l = [x, y + f(v0, v3) * cell];
      var P = { 1: [l, t], 14: [l, t], 2: [t, r], 13: [t, r], 3: [l, r], 12: [l, r], 4: [r, bb], 11: [r, bb], 6: [t, bb], 9: [t, bb], 7: [l, bb], 8: [l, bb], 5: [l, t, r, bb], 10: [t, r, l, bb] }[c];
      seg2.push([P[0], P[1]]); if (P.length > 2) seg2.push([P[2], P[3]]);
    }
    var bout = new Map(), lignes = [], pris = new Uint8Array(seg2.length);
    function cle(p) { return Math.round(p[0] * 8) + ',' + Math.round(p[1] * 8); }
    seg2.forEach(function (s, k) { [0, 1].forEach(function (e) { var kk = cle(s[e]), l = bout.get(kk); if (!l) bout.set(kk, l = []); l.push(k); }); });
    seg2.forEach(function (s, k) {
      if (pris[k]) return; pris[k] = 1; var ligne = [s[0], s[1]];
      [1, 0].forEach(function (sens) { for (;;) { var p = sens ? ligne[ligne.length - 1] : ligne[0], l = bout.get(cle(p)) || [], suiv = -1, z; for (z = 0; z < l.length; z++) if (!pris[l[z]]) { suiv = l[z]; break; } if (suiv < 0) break; pris[suiv] = 1; var q = seg2[suiv], autre = cle(q[0]) === cle(p) ? q[1] : q[0]; if (sens) ligne.push(autre); else ligne.unshift(autre); } });
      lignes.push(ligne);
    });
    return lignes;
  }

  /* ══ Les jetons, lus dans la page ══ */
  var NOMS_J = { bg: '--bg', panel: '--panel', panel2: '--panel2', panel3: '--panel3', ink: '--ink', ink2: '--ink2', ink3: '--ink3', or: '--or', amb: '--amb', cy: '--cy', pale: '--pale', voile: '--voile', trait: '--trait', traitvu: '--trait-vu', fantome: '--fantome', line: '--line' };
  function jetons(n) {
    var p = el('i', { style: 'position:absolute;visibility:hidden;pointer-events:none' }), T = {}, k; n.appendChild(p);
    for (k in NOMS_J) { p.style.color = 'var(' + NOMS_J[k] + ')'; var s = getComputedStyle(p).color, m = s.match(/-?[\d.]+(?:e-?\d+)?/g).map(Number), f = s.indexOf('color(') === 0 ? 255 : 1; T[k] = [m[0] * f, m[1] * f, m[2] * f, m[3] === undefined ? 1 : m[3]]; }
    p.remove(); T.sombre = (T.bg[0] * .3 + T.bg[1] * .59 + T.bg[2] * .11) < 128; return T;
  }
  function css(c, a) { return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + (c[3] * (a === undefined ? 1 : a)).toFixed(3) + ')'; }
  var polices = null;
  function police() { if (!polices) { var s = getComputedStyle(document.documentElement); polices = { texte: s.getPropertyValue('--f-texte').trim() || 'serif', nom: s.getPropertyValue('--f-nom').trim() || 'serif', ui: s.getPropertyValue('--f-ui').trim() || 'sans-serif' }; } return polices; }

  /* ══ Les mots ══ */
  function espace(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function dist(km) { return km < 1 ? Math.round(km * 1000 / 5) * 5 + ' m' : km < 10 ? km.toFixed(1).replace('.', ',') + ' km' : espace(km) + ' km'; }
  function lon(x) { return (x - .8) * 37.5 + 4; } function lat(y) { return 46 - (y - .5) * 37.5; }
  function dms(d, pos, neg, fin) { var s = d < 0 ? neg : pos, tot = Math.round(Math.abs(d) * (fin ? 3600 : 60)), g = Math.floor(tot / (fin ? 3600 : 60)), mi = fin ? Math.floor(tot % 3600 / 60) : tot % 60, se = tot % 60; return g + '° ' + ('0' + mi).slice(-2) + '′ ' + (fin ? ('0' + se).slice(-2) + '″ ' : '') + s; }
  function duree(h) { if (h < 1) return Math.max(5, Math.round(h * 60 / 5) * 5) + ' min'; if (h < 24) { var m = Math.round((h % 1) * 6) * 10; return Math.floor(h) + ' h' + (m && h < 10 ? ' ' + ('0' + m).slice(-2) : ''); } return Math.floor(h / 24) + ' j ' + Math.round(h % 24) + ' h'; }
  function sansAccent(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  /* ══ Le relief : une grille d'altitudes sur la vue, puis l'estompage, les courbes, la côte ══ */
  var INTERVALLES = [[0, 500], [2.6, 250], [6, 100], [22, 50], [80, 20], [300, 10], [1100, 5]];
  function relief(ctx, M, vue, W, H, T, a) {
    var S = vue.S, cell = (vue.k > 1500 ? 14 : vue.k > 300 ? 10 : 7) * (a.brouillon ? 1.8 : 1), cw = cell / S, x0 = vue.cx - W / 2 / S, y0 = vue.cy - H / 2 / S;
    var gx0 = Math.floor(x0 / cw) - 1, gy0 = Math.floor(y0 / cw) - 1, nx = Math.ceil(W / cell) + 4, ny = Math.ceil(H / cell) + 4, oct = borne(Math.floor(Math.log2(S / 20)) + 1, 4, 12);
    var g = new Float32Array(nx * ny), i, j, mer = false, terre = false;
    for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) { var v = M.alt((gx0 + i) * cw, (gy0 + j) * cw, oct); g[j * nx + i] = v; if (v < 0) mer = true; else terre = true; }
    var ox = (gx0 * cw - x0) * S, oy = (gy0 * cw - y0) * S;
    /* l'estompage : la lumière vient du nord-ouest ; chaque pente prend sa valeur par paliers fins, sur une grille plus fine que celle des courbes */
    if (terre && a.terre > .01) {
      var ce = a.brouillon || vue.k > 100 ? cell : 5, cwe = ce / S, ex0 = Math.floor(x0 / cwe) - 1, ey0 = Math.floor(y0 / cwe) - 1, enx = Math.ceil(W / ce) + 4, eny = Math.ceil(H / ce) + 4, ge = g;
      if (ce !== cell) { ge = new Float32Array(enx * eny); for (j = 0; j < eny; j++) for (i = 0; i < enx; i++) ge[j * enx + i] = M.alt((ex0 + i) * cwe, (ey0 + j) * cwe, oct); } else { enx = nx; eny = ny; ex0 = gx0; ey0 = gy0; }
      var gl = new Float32Array(enx * eny); for (j = 0; j < eny; j++) for (i = 0; i < enx; i++) { var sm = 0, z1, z2; for (z2 = -1; z2 <= 1; z2++) for (z1 = -1; z1 <= 1; z1++) sm += ge[borne(j + z2, 0, eny - 1) * enx + borne(i + z1, 0, enx - 1)] * (z1 && z2 ? 1 : z1 || z2 ? 2 : 12); gl[j * enx + i] = sm / 24; }   /* un léger flou : le bruit de valeur ne montre plus sa grille */
      var off = relief.off || (relief.off = document.createElement('canvas')); off.width = enx; off.height = eny; var o2 = off.getContext('2d'), im = o2.createImageData(enx, eny), d = im.data, q = 0;
      var sb = T.sombre, base = sb ? T.panel3 : T.panel2, clair = sb ? T.ink : T.panel, ombre = sb ? T.bg : T.ink, kc = sb ? .34 : 1.4, ko = sb ? 1.2 : .34;
      var E = Math.pow(vue.k, .8) / 22 / S * 2.6 * a.ombre, Lx = -.5774, Ly = -.5774, Lz = .5774, PL = 1 / 18;
      for (j = 0; j < eny; j++) for (i = 0; i < enx; i++, q += 4) {
        var hh = ge[j * enx + i]; if (hh < -30) { d[q + 3] = 0; continue; }
        var gxx = (gl[j * enx + Math.min(enx - 1, i + 1)] - gl[j * enx + Math.max(0, i - 1)]) / (2 * cwe) * E, gyy = (gl[Math.min(eny - 1, j + 1) * enx + i] - gl[Math.max(0, j - 1) * enx + i]) / (2 * cwe) * E;
        var nl = Math.sqrt(gxx * gxx + gyy * gyy + 1), lam = (-gxx * Lx - gyy * Ly + Lz) / nl - Lz, pal = Math.round(lam / PL) * PL, vers = pal >= 0 ? clair : ombre, m = Math.min(.62, pal >= 0 ? pal * kc : -pal * ko) + (sb ? Math.min(1, Math.max(0, hh) / 3200) * .05 : 0);
        d[q] = base[0] + (vers[0] - base[0]) * m; d[q + 1] = base[1] + (vers[1] - base[1]) * m; d[q + 2] = base[2] + (vers[2] - base[2]) * m; d[q + 3] = 255 * a.terre * Math.min(1, (hh + 30) / 60);
      }
      o2.putImageData(im, 0, 0); ctx.imageSmoothingEnabled = ce > 3; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(off, (ex0 * cwe - x0) * S - ce / 2, (ey0 * cwe - y0) * S - ce / 2, enx * ce, eny * ce);
    }
    if (!mer && a.courbes < .01) return { terre: terre, mer: mer };
    /* les courbes : un intervalle par hauteur ; les nouvelles naissent entre les anciennes */
    var b = 0; while (b < INTERVALLES.length - 1 && vue.k >= INTERVALLES[b + 1][0]) b++;
    var I = INTERVALLES[b][1], Ig = b > 0 ? INTERVALLES[b - 1][1] : I * 2, tIn = b > 0 ? seg(Math.log(vue.k), Math.log(INTERVALLES[b][0]), Math.log(INTERVALLES[b][0] * 1.8)) : 1, Im = I * 5;
    var fin = [], gros = [], neuf = [], cote = [], eau = [], rives = [-I * .22, -I * .55, -I * 1.05];
    function coupe(v0, v1, v2, v3, L, x, y, out) {   /* un carré de la grille, un niveau : zéro, un ou deux segments */
      var c = (v0 > L ? 1 : 0) | (v1 > L ? 2 : 0) | (v2 > L ? 4 : 0) | (v3 > L ? 8 : 0); if (c === 0 || c === 15) return;
      var t = x + (L - v0) / (v1 - v0) * cell, r = y + (L - v1) / (v2 - v1) * cell, bb = x + (L - v3) / (v2 - v3) * cell, l = y + (L - v0) / (v3 - v0) * cell, xe = x + cell, ye = y + cell;
      switch (c) {
        case 1: case 14: out.push(x, l, t, y); break; case 2: case 13: out.push(t, y, xe, r); break; case 3: case 12: out.push(x, l, xe, r); break;
        case 4: case 11: out.push(xe, r, bb, ye); break; case 6: case 9: out.push(t, y, bb, ye); break; case 7: case 8: out.push(x, l, bb, ye); break;
        case 5: out.push(x, l, t, y, xe, r, bb, ye); break; case 10: out.push(t, y, xe, r, x, l, bb, ye); break;
      }
    }
    for (j = 0; j < ny - 1; j++) for (i = 0; i < nx - 1; i++) {
      var p = j * nx + i, v0 = g[p], v1 = g[p + 1], v2 = g[p + nx + 1], v3 = g[p + nx], lo = Math.min(v0, v1, v2, v3), hi = Math.max(v0, v1, v2, v3), x = ox + i * cell, y = oy + j * cell, L;
      if (lo <= 0 && hi > 0) coupe(v0, v1, v2, v3, 0, x, y, cote);
      if (hi > 0 && a.courbes > .01) for (L = Math.max(I, Math.ceil(lo / I) * I); L < hi; L += I) coupe(v0, v1, v2, v3, L, x, y, L % Im === 0 ? gros : L % Ig === 0 ? fin : neuf);
      if (lo < 0 && a.eau > .01) { for (var r = 0; r < 3; r++) if (lo < rives[r] && hi > rives[r]) coupe(v0, v1, v2, v3, rives[r], x, y, eau[r] || (eau[r] = [])); for (L = Math.ceil(lo / (I * 4)) * I * 4; L < Math.min(hi, -I * 2); L += I * 4) coupe(v0, v1, v2, v3, L, x, y, eau[3] || (eau[3] = [])); }
    }
    function trace(t, style, lw) { if (!t || !t.length) return; ctx.beginPath(); for (var q = 0; q < t.length; q += 4) { ctx.moveTo(t[q], t[q + 1]); ctx.lineTo(t[q + 2], t[q + 3]); } ctx.strokeStyle = style; ctx.lineWidth = lw; ctx.stroke(); }
    ctx.lineCap = 'round';
    trace(eau[3], css(T.cy, .16 * a.eau), 1); trace(eau[2], css(T.cy, .14 * a.eau), 1); trace(eau[1], css(T.cy, .26 * a.eau), 1); trace(eau[0], css(T.cy, .42 * a.eau), 1);
    trace(neuf, css(T.ink3, .5 * a.courbes * tIn), .8); trace(fin, css(T.ink3, .52 * a.courbes), .8); trace(gros, css(T.ink2, .8 * a.courbes), 1.15);
    trace(cote, css(T.ink, .9 * Math.max(a.eau, .35)), 1.25);
    return { terre: terre, mer: mer, I: I };
  }

  /* un texte le long d'un tracé (points d'écran), centré à mi-longueur ; rend la boîte qu'il occupe */
  function longueurs(pts) { var L = [0], i; for (i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return L; }
  function pointA(pts, L, d) { var i = 1; while (i < L.length - 1 && L[i] < d) i++; var t = (d - L[i - 1]) / ((L[i] - L[i - 1]) || 1); return [mix(pts[i - 1][0], pts[i][0], t), mix(pts[i - 1][1], pts[i][1], t), Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])]; }
  function texteLong(ctx, pts, texte, inter, centre, halo, essai) {
    if (pts.length < 2) return null; if (pts[pts.length - 1][0] < pts[0][0]) pts = pts.slice().reverse();
    var L = longueurs(pts), tot = L[L.length - 1], larg = [], w = 0, i; for (i = 0; i < texte.length; i++) { var cw = ctx.measureText(texte[i]).width + inter; larg.push(cw); w += cw; }
    if (w > tot * .92) return null; var d = (centre === undefined ? tot / 2 : centre) - w / 2; if (d < 0 || d + w > tot) return null;
    var a = pointA(pts, L, d), b = pointA(pts, L, d + w); if (b[0] < a[0]) { pts = pts.slice().reverse(); L = longueurs(pts); d = tot - d - w; a = pointA(pts, L, d); b = pointA(pts, L, d + w); }
    var boite = [Math.min(a[0], b[0]) - 6, Math.min(a[1], b[1]) - 9, Math.max(a[0], b[0]) + 6, Math.max(a[1], b[1]) + 9];
    if (essai && !essai(boite)) return null;
    for (var passe = halo ? 0 : 1; passe < 2; passe++) { var dd = d; for (i = 0; i < texte.length; i++) { var p = pointA(pts, L, dd + larg[i] / 2); ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(p[2]); if (passe === 0) ctx.strokeText(texte[i], -larg[i] / 2 + inter / 2, 0); else ctx.fillText(texte[i], -larg[i] / 2 + inter / 2, 0); ctx.restore(); dd += larg[i]; } }
    return boite;
  }

  /* ══ L'habillage, pièce par pièce (chaque pièce sert aussi seule) ══ */
  C.echelle = function (n, kmParPx) {
    n.classList.add('carto-echelle'); if (!n.firstChild) { n.appendChild(el('i')); n.appendChild(el('b')); n.appendChild(el('span')); n.appendChild(el('output')); }
    var cible = kmParPx * 150, p = Math.pow(10, Math.floor(Math.log10(cible))), m = cible / p, v = (m >= 5 ? 5 : m >= 2 ? 2 : 1) * p;
    n.style.setProperty('--l', (v / kmParPx).toFixed(1) + 'px'); n.children[1].textContent = '0'; var mi = v / 2 < 1 ? v * 500 : v / 2; n.children[2].textContent = (mi % 1 ? mi.toFixed(1).replace('.', ',') : espace(mi)); n.children[3].textContent = dist(v);
    n.setAttribute('aria-label', 'Échelle : ' + dist(v));
  };
  C.rose = function (n) {
    n.classList.add('carto-rose'); var s = svg('svg', { viewBox: '-60 -60 120 120', 'aria-hidden': 'true' }), i;
    s.appendChild(svg('circle', { r: 44, class: 'cercle' })); s.appendChild(svg('circle', { r: 30, class: 'cercle fin' }));
    for (i = 0; i < 72; i++) { var a = i * 5 * Math.PI / 180, r0 = i % 18 === 0 ? 30 : i % 9 === 0 ? 36 : i % 3 === 0 ? 40 : 42; s.appendChild(svg('line', { x1: Math.sin(a) * r0, y1: -Math.cos(a) * r0, x2: Math.sin(a) * 44, y2: -Math.cos(a) * 44, class: i % 9 === 0 ? 'cran fort' : 'cran' })); }
    s.appendChild(svg('path', { d: 'M0 -44L4.5 0L0 44L-4.5 0Z', class: 'aiguille' })); s.appendChild(svg('path', { d: 'M0 -44L4.5 0L-4.5 0Z', class: 'nord' })); s.appendChild(svg('path', { d: 'M-44 0L0 -3.2L44 0L0 3.2Z', class: 'aiguille fine' }));
    [['N', 0, -49], ['E', 52, 4], ['S', 0, 58], ['O', -52, 4]].forEach(function (t) { var x = svg('text', { x: t[1], y: t[2], class: t[0] === 'N' ? 'n' : '' }); x.textContent = t[0]; s.appendChild(x); });
    n.appendChild(s); n.setAttribute('role', 'img'); n.setAttribute('aria-label', 'Le nord est en haut');
  };
  C.legende = function (n) {
    n.classList.add('carto-legende');
    [['capitale', 'la capitale'], ['ville', 'une ville'], ['route', 'une grande route'], ['fleuve', 'un fleuve'], ['courbe', 'une courbe de niveau'], ['estime', 'estimé'], ['tenu', 'ce qu’on tient']].forEach(function (l) { n.appendChild(el('li', {}, [el('i', { class: l[0] }), l[1]])); });
  };
  C.cartouche = function (n, o) {
    n.classList.add('carto-cartouche'); if (!n.firstChild) { n.appendChild(el('p', { class: 'ke-petit' })); n.appendChild(el('p', { class: 'carto-titre' })); n.appendChild(el('p', { class: 'carto-sous' }, [el('output'), el('em')])); }
    n.children[0].textContent = o.sur; n.children[1].textContent = o.titre; n.children[2].firstChild.textContent = o.rapport; n.children[2].lastChild.textContent = o.hauteur;
  };
  C.couches = function (n, etat, change) {
    n.classList.add('carto-couches'); n.setAttribute('role', 'group'); n.setAttribute('aria-label', 'Les couches');
    [['relief', 'le relief'], ['eau', 'l’eau'], ['routes', 'les routes'], ['noms', 'les noms'], ['grille', 'la grille']].forEach(function (c) {
      var b = el('button', { type: 'button', class: 'ke-btn petit', 'aria-pressed': String(etat[c[0]] !== false), text: c[1] });
      b.addEventListener('click', function () { etat[c[0]] = etat[c[0]] === false; b.setAttribute('aria-pressed', String(etat[c[0]])); if (change) change(c[0], etat[c[0]]); }); n.appendChild(b);
    });
  };

  /* ══ LA CARTE ══ */
  C.carte = function (n, o) {
    if (n._carto) return n._carto; o = o || {};
    var M = monde(o.graine || 1911), T = jetons(n), F = police(), W = 0, H = 0, dpr = 1, s0 = 1;
    var vue = { cx: .8, cy: .5, k: 1, S: 1 }, couches = { relief: true, eau: true, routes: true, noms: true, grille: true }, anim = 0, attente = 0;
    var hab = o.habillage === undefined ? ['cartouche', 'echelle', 'coords', 'rose', 'mini', 'rail', 'couches', 'legende', 'recherche'] : o.habillage;
    function a(x) { return hab.indexOf(x) >= 0; }
    n.classList.add('carto'); if (o.outil) n.classList.add('outil'); n.tabIndex = 0; n.setAttribute('role', 'application'); if (!n.getAttribute('aria-label')) n.setAttribute('aria-label', 'Carte');
    var toile = el('canvas', { class: 'carto-fond', 'aria-hidden': 'true' }), ctx = toile.getContext('2d'), dessus = svg('svg', { class: 'carto-dessus', 'aria-hidden': 'true' }), calque = el('div', { class: 'carto-reperes' }), mire = el('i', { class: 'carto-mire', 'aria-hidden': 'true' });
    var fiche = el('div', { class: 'carto-fiche', hidden: '' }), dit = el('p', { class: 'ke-cache', 'aria-live': 'polite' });
    [toile, dessus, calque, mire, fiche, dit].forEach(function (x) { n.appendChild(x); });
    /* l'habillage */
    var H_ = {};
    if (a('cartouche')) n.appendChild(H_.cartouche = el('div', {}));
    if (a('recherche')) {
      H_.champ = el('input', { type: 'text', placeholder: 'chercher un lieu', role: 'combobox', 'aria-expanded': 'false', 'aria-autocomplete': 'list', 'aria-label': 'Chercher un lieu', autocomplete: 'off', spellcheck: 'false' });
      H_.liste = el('ul', { class: 'ke-menu-liste ke-flotte', role: 'listbox', hidden: '' }); n.appendChild(H_.recherche = el('div', { class: 'carto-recherche' }, [el('label', { class: 'ke-champ' }, [H_.champ]), H_.liste]));
    }
    if (a('legende')) { n.appendChild(H_.legende = el('ul', {})); C.legende(H_.legende); }
    var pied = el('div', { class: 'carto-pied' }); n.appendChild(pied);
    if (a('echelle')) pied.appendChild(H_.echelle = el('div', {}));
    if (a('coords')) pied.appendChild(H_.coords = el('p', { class: 'carto-coords' }, [el('output'), el('span')]));
    if (a('couches')) { pied.appendChild(H_.couches = el('div', {})); C.couches(H_.couches, couches, function () { demander(); }); }
    if (a('rose')) { n.appendChild(H_.rose = el('div', {})); C.rose(H_.rose); }
    if (a('mini')) { H_.miniToile = el('canvas', { 'aria-hidden': 'true' }); H_.miniVue = el('i'); H_.miniCadre = el('i', { class: 'cadre', hidden: '' }); n.appendChild(H_.mini = el('div', { class: 'carto-mini', tabindex: '0', role: 'application', 'aria-label': 'Mini-carte. Flèches : déplacer le cadre. Entrée : y aller. Échap : laisser.' }, [H_.miniToile, H_.miniVue, H_.miniCadre])); }
    if (a('rail')) {
      H_.rail = el('div', { class: 'ke-rail', role: 'group', 'aria-label': 'La hauteur' }, NOMS_H.map(function (t, i) { return el('button', { type: 'button', 'data-h': i }, [t, el('i')]); }));
      H_.zoom = el('div', { class: 'carto-zoom' }, [el('button', { type: 'button', class: 'ke-btn petit', 'data-z': '-', 'aria-label': 'Monter', text: 'monter' }), el('button', { type: 'button', class: 'ke-btn petit', 'data-z': '+', 'aria-label': 'Descendre', text: 'descendre' })]);
      n.appendChild(H_.rail); n.appendChild(H_.zoom);
    }

    /* ── la vue ── */
    function X(x) { return W / 2 + (x - vue.cx) * vue.S; } function Y(y) { return H / 2 + (y - vue.cy) * vue.S; }
    function versMonde(sx, sy) { return [vue.cx + (sx - W / 2) / vue.S, vue.cy + (sy - H / 2) / vue.S]; }
    var brouillon = false, fini = 0;
    function poser(cx, cy, k) { brouillon = true; clearTimeout(fini); fini = setTimeout(function () { brouillon = false; demander(); }, 140); vue.k = borne(k, .75, 60000); vue.S = s0 * vue.k; var mx = W / 2 / vue.S, my = H / 2 / vue.S; vue.cx = borne(cx, Math.min(mx, LARG / 2) - .15, Math.max(LARG - mx, LARG / 2) + .15); vue.cy = borne(cy, Math.min(my, .5) - .12, Math.max(1 - my, .5) + .12); demander(); }
    function zoomer(k, sx, sy) { var p = versMonde(sx === undefined ? W / 2 : sx, sy === undefined ? H / 2 : sy); k = borne(k, .75, 60000); var S2 = s0 * k; poser(p[0] - ((sx === undefined ? W / 2 : sx) - W / 2) / S2, p[1] - ((sy === undefined ? H / 2 : sy) - H / 2) / S2, k); }
    function niveau() { var m = 0, dm = 99, i; for (i = 0; i < HAUTEURS.length; i++) { var d = Math.abs(Math.log(vue.k / HAUTEURS[i])); if (d < dm) { dm = d; m = i; } } return m; }
    function aller(cx, cy, k, ms, fin) {
      cancelAnimationFrame(anim); var d0 = { cx: vue.cx, cy: vue.cy, k: vue.k }, t0 = 0, ecart = Math.abs(Math.log(k / d0.k)); ms = ms === undefined ? 420 + ecart * 110 : ms;
      if (calme || ms <= 0) { poser(cx, cy, k); if (fin) fin(); return; }
      function pas(ts) {
        if (!t0) t0 = ts; var t = seg((ts - t0) / ms, 0, 1), kk = Math.exp(mix(Math.log(d0.k), Math.log(k), t)), u = ecart < .02 ? t : (1 / kk - 1 / d0.k) / (1 / k - 1 / d0.k);
        poser(mix(d0.cx, cx, u), mix(d0.cy, cy, u), kk); if (t < 1) anim = requestAnimationFrame(pas); else if (fin) fin();
      }
      anim = requestAnimationFrame(pas);
    }
    function villePres(x, y) { var m = null, dm = 1e9; M.villes.forEach(function (v) { var d = Math.hypot(v.x - x, v.y - y) / (v.rang < 2 ? 1.6 : 1); if (d < dm) { dm = d; m = v; } }); return m; }
    function hauteur(i) {   /* un bond vers une hauteur : plus bas que la région, on vise la ville la plus proche */
      i = borne(i, 0, HAUTEURS.length - 1); var k = HAUTEURS[i], cx = vue.cx, cy = vue.cy;
      if (i === 0) { cx = LARG / 2; cy = .5; k = Math.max(.86, Math.min(1, (W / LARG) / s0)); }
      if (i === 1 && M.alt(cx, cy, 6) < 40) { var vr = villePres(cx, cy); cx = vr.x; cy = vr.y; }
      if (i >= 2) { var v = villePres(vue.cx, vue.cy), loin = Math.hypot(v.x - vue.cx, v.y - vue.cy) > v.r * .8; if (loin || i === 2) { cx = v.x; cy = v.y; } if (i === 2) k = HAUTEURS[2] * .0021 / v.r * .8; }
      aller(cx, cy, k, undefined, function () { parler(NOMS_H[i]); });
    }
    function parler(t) { dit.textContent = t; }

    /* ── le dessin ── */
    var batis = [], boites = [], tenu = null, batiTenu = null;
    var reserves = [];
    function reserver() { var r0 = n.getBoundingClientRect(); reserves = []; ['cartouche', 'recherche', 'legende', 'rose', 'mini', 'rail', 'echelle', 'coords', 'couches'].forEach(function (c) { if (!H_[c]) return; var r = H_[c].getBoundingClientRect(); if (r.width) reserves.push([r.left - r0.left - 8, r.top - r0.top - 6, r.right - r0.left + 8, r.bottom - r0.top + 6]); }); }
    function libre(b, marge) { var m = marge || 0, i; for (i = 0; i < boites.length; i++) { var q = boites[i]; if (b[0] - m < q[2] && b[2] + m > q[0] && b[1] - m < q[3] && b[3] + m > q[1]) return false; } return true; }
    function prendre(b) { boites.push(b); }
    function mot(texte, x, y, o2) {   /* une étiquette droite : mesurée, essayée, dessinée */
      ctx.font = o2.font; if (ctx.letterSpacing !== undefined) ctx.letterSpacing = (o2.inter || 0) + 'px';
      var w = ctx.measureText(texte).width, h = o2.h || 14, ax = o2.ancre === 'centre' ? x - w / 2 : x, b = [ax - 3, y - h * .8, ax + w + 3, y + h * .35];
      if (!o2.libre) { if (!libre(b, o2.marge)) return false; prendre(b); }
      if (o2.halo) { ctx.strokeStyle = css(T.bg, o2.halo); ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.strokeText(texte, ax, y); }
      ctx.fillStyle = o2.couleur; ctx.fillText(texte, ax, y); return true;
    }
    function dessiner() {
      attente = 0; if (!W) return;
      var k = vue.k, S = vue.S, i; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); boites = reserves.slice(); batis = [];
      var x0 = vue.cx - W / 2 / S, x1 = vue.cx + W / 2 / S, y0 = vue.cy - H / 2 / S, y1 = vue.cy + H / 2 / S, mar = 40 / S;
      function vu(x, y, m) { m = m || mar; return x > x0 - m && x < x1 + m && y > y0 - m && y < y1 + m; }
      /* 1 · le relief, la mer, la côte */
      var aRelief = couches.relief ? 1 - seg(k, 500, 2600) * .86 : 0;
      relief(ctx, M, vue, W, H, T, { brouillon: brouillon, terre: 1, ombre: couches.relief ? 1 - seg(k, 120, 700) : 0, courbes: aRelief * mix(.55, 1, seg(k, 1.2, 3.2)), eau: couches.eau ? 1 : 0 });
      if (o.densite) densite(x0, y0, x1, y1);
      var aBois = couches.relief && !brouillon ? seg(k, 3.5, 7) * (1 - seg(k, 160, 420)) : 0;
      if (aBois > .01) { var pb2 = Math.pow(2, Math.round(Math.log2(7.5 / S))), fi, fj; ctx.fillStyle = css(T.ink2, .5 * aBois); for (fj = Math.floor(y0 / pb2); fj <= Math.ceil(y1 / pb2); fj++) for (fi = Math.floor(x0 / pb2); fi <= Math.ceil(x1 / pb2); fi++) { var bx2 = (fi + h3(fi, fj, 81)) * pb2, by2 = (fj + h3(fi, fj, 82)) * pb2; if (bruit(bx2 * 34, by2 * 34, 201) * .62 + bruit(bx2 * 120, by2 * 120, 202) * .38 < .57) continue; var ba = M.alt(bx2, by2, 4); if (ba < 25 || ba > 1700) continue; ctx.fillRect(X(bx2), Y(by2), 1.3, 1.3); } }
      /* 2 · la grille des méridiens et des parallèles */
      if (couches.grille) {
        var degPx = 37.5 / S, PASG = [10, 5, 2, 1, .5, 1 / 6, 1 / 12, 1 / 30, 1 / 60, 1 / 120, 1 / 360, 1 / 720, 1 / 1800, 1 / 3600], pg = PASG[PASG.length - 1]; for (i = 0; i < PASG.length; i++) if (PASG[i] / degPx < 420) { pg = PASG[i]; break; }
        ctx.beginPath(); ctx.font = '10.5px ' + F.ui; if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '.4px'; ctx.fillStyle = css(T.pale, .9); var fin = pg < 1 / 60, g;
        for (g = Math.ceil(lon(x0) / pg) * pg; g < lon(x1); g += pg) { var gx = Math.round(X((g - 4) / 37.5 + .8)) + .5; ctx.moveTo(gx, 0); ctx.lineTo(gx, H); if (gx > 240 && gx < W - 200) ctx.fillText(dms(g + 1e-9, 'E', 'O', fin), gx + 6, H - 64); }
        for (g = Math.ceil(lat(y1) / pg) * pg; g < lat(y0); g += pg) { var gy = Math.round(Y(.5 - (g - 46) / 37.5)) + .5; ctx.moveTo(0, gy); ctx.lineTo(W, gy); if (gy > 130 && gy < H - 90) ctx.fillText(dms(g + 1e-9, 'N', 'S', fin), W - 250, gy - 6); }
        ctx.strokeStyle = css(T.line, .8); ctx.lineWidth = 1; ctx.stroke();
      }
      /* 4 · les routes entre les villes */
      var aRoute = couches.routes ? seg(k, 2.4, 6) * (1 - seg(k, 500, 1400)) : 0;
      if (aRoute > .01) M.routes.forEach(function (r) {
        if (!r.grande && k < 7) return; var dedans = false, q, n2 = r.pts.length; ctx.beginPath(); for (q = 0; q < n2; q++) { var p = r.pts[q];
          if (q === 0 || q === n2 - 1) { var v2 = q ? r.b : r.a, p2 = r.pts[q ? n2 - 2 : 1], lg = Math.hypot(p2[0] - v2.x, p2[1] - v2.y), fr = v2.r * 1.12 * seg(k, 20, 120) / lg; p = [mix(v2.x, p2[0], fr), mix(v2.y, p2[1], fr)]; }   /* dans la ville, la route devient sa grande rue */ if (vu(p[0], p[1], 300 / S)) dedans = true; if (q) ctx.lineTo(X(p[0]), Y(p[1])); else ctx.moveTo(X(p[0]), Y(p[1])); }
        if (!dedans) return; ctx.lineJoin = 'round';
        if (r.grande) { ctx.strokeStyle = css(T.ink2, .85 * aRoute); ctx.lineWidth = 2.6; ctx.stroke(); ctx.strokeStyle = css(T.bg, 1); ctx.lineWidth = 1; ctx.stroke(); }
        else { ctx.strokeStyle = css(T.ink3, .7 * aRoute * seg(k, 7, 14)); ctx.lineWidth = 1; ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]); }
      });
      /* 5 · les villes : les îlots pleins (la rue est le vide entre eux), les parcelles de près ; la gare, le mail, les quais */
      var px = PAS * S, mpx = S / UM, aTrame = couches.routes ? seg(px, 1.1, 3) : 0, aIlot = seg(px, 12, 30), aBati = seg(px, 46, 110), nomsRues = [], nomsLieux = [], neuves = 0, villesVues = [];
      if (aTrame > .01) M.villes.forEach(function (c) {
        var ax = axes(M, c); if (!vu(c.x, c.y, ax.Rm * 1.45 / UM)) return;
        if (!c.il && neuves++ > 0) { demander(); return; }   /* une ville neuve par image : les autres suivent */
        var il = ilots(M, c), ox = X(c.x), oy = Y(c.y), u1 = 1 / mpx, lx0 = (x0 - c.x) * UM, lx1 = (x1 - c.x) * UM, ly0 = (y0 - c.y) * UM, ly1 = (y1 - c.y) * UM, A = ax.A;
        function vuM(b, m) { m = m || 0; return b[2] > lx0 - m && b[0] < lx1 + m && b[3] > ly0 - m && b[1] < ly1 + m; }
        function ecran(P) { return P.map(function (p) { return [ox + p[0] * mpx, oy + p[1] * mpx]; }); }
        villesVues.push(c);
        ctx.save(); ctx.setTransform(dpr * mpx, 0, 0, dpr * mpx, dpr * ox, dpr * oy); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        var fond = (T.sombre ? .17 : .14) * aTrame, aBloc = 1 - aBati * .5;
        if (px < 12) {
          ctx.fillStyle = css(T.ink, fond); ctx.fill(il.loin); ctx.fillStyle = css(T.ink2, fond * .42); ctx.fill(il.loinJ);
          ctx.strokeStyle = css(T.bg, aTrame * (1 - aIlot)); ctx.lineWidth = .7 * u1; ctx.stroke(il.loin);
        }
        if (px >= 12 || aIlot > .01) {
          var G = il.seaux.G, bi, bj, vus = [];
          for (bj = Math.floor((ly0 - 300) / G); bj <= Math.floor((ly1 + 300) / G); bj++) for (bi = Math.floor((lx0 - 300) / G); bi <= Math.floor((lx1 + 300) / G); bi++) { var l = il.seaux.m.get(bi * 65536 + bj); if (l) vus.push(l); }
          if (px >= 12) vus.forEach(function (l) {
            ctx.fillStyle = css(T.ink, fond * aBloc); ctx.fill(l.bati); ctx.strokeStyle = css(T.ink3, .55 * aIlot * aBloc); ctx.lineWidth = .8 * u1; ctx.stroke(l.bati);
            ctx.fillStyle = css(T.ink2, fond * .32); ctx.fill(l.jardin); ctx.setLineDash([1 * u1, 4 * u1]); ctx.strokeStyle = css(T.ink3, .6 * aIlot); ctx.stroke(l.jardin); ctx.setLineDash([]);
            ctx.strokeStyle = css(T.ink3, .22 * aIlot); ctx.stroke(l.place);
          });
          /* de près : les parcelles, d'un seul chemin par seau */
          if (aBati > .01) vus.forEach(function (l) {
            if (!l.lots) { l.lots = new Path2D(); l.forEach(function (b) { if (b.nat === 0 || b.nat === 3) lotir(b, A).forEach(function (q) { il.poser(l.lots, q); }); }); }
            ctx.fillStyle = css(T.ink, (T.sombre ? .13 : .1) * aBati); ctx.fill(l.lots); ctx.strokeStyle = css(T.ink2, .72 * aBati); ctx.lineWidth = u1; ctx.stroke(l.lots);
          });
          /* les jardins : un semis ; les lieux nommés */
          if (px > 22) { ctx.fillStyle = css(T.ink3, .6 * seg(px, 22, 40)); vus.forEach(function (l) { l.forEach(function (b) { if (b.nat !== 1 || !vuM(b.bo)) return; var nb = Math.min(90, b.a / 260), z; for (z = 0; z < nb; z++) { var u = h3(z, b.id, 31), v = h3(z, b.id, 32), p = [mix(b.bo[0], b.bo[2], u), mix(b.bo[1], b.bo[3], v)]; if (dansPoly(b.p, p)) ctx.fillRect(p[0], p[1], 1.3 * u1, 1.3 * u1); } }); }); }
          if (px > 60) vus.forEach(function (l) { l.forEach(function (b) { if (!vuM(b.bo) || (b.nat !== 1 && b.nat !== 3) || b.a < 4000) return; nomsLieux.push([b.nom || JARDINS[Math.floor(b.h * 1000) % JARDINS.length], [ox + b.g[0] * mpx, oy + b.g[1] * mpx], b.nat === 1 ? 1 : 2]); }); });
          /* ce qu'on touche : les parcelles visibles, en coordonnées d'écran */
          if (aBati > .5) vus.forEach(function (l) { l.forEach(function (b) { if ((b.nat !== 0 && b.nat !== 3) || !vuM(b.bo, 20)) return; lotir(b, A).forEach(function (q, z) { batis.push({ cle: c.id + ':' + b.id + ':' + z, p: ecran(q), m: q, c: c, h: h3(b.id, z, 77), n: q.n || 1, edifice: b.nat === 3 ? b.nom : null }); }); }); });
        }
        /* le mail : deux rangs d'arbres sur l'ancien rempart */
        if (px > 20) { var aA = seg(px, 20, 40), ar = il.arbres, z; ctx.beginPath(); for (z = 0; z < ar.length; z += 2) { if (ar[z] < lx0 - 20 || ar[z] > lx1 + 20 || ar[z + 1] < ly0 - 20 || ar[z + 1] > ly1 + 20) continue; ctx.moveTo(ar[z] + Math.max(3, 1.6 * u1), ar[z + 1]); ctx.arc(ar[z], ar[z + 1], Math.max(3, 1.6 * u1), 0, 6.3); } ctx.fillStyle = css(T.ink2, .5 * aA * aTrame); ctx.fill(); }
        /* les quais : le trait qui borde la rue au bord de l'eau */
        if (couches.eau && px > 3) { ctx.beginPath(); il.quais.forEach(function (Q) { ctx.moveTo(Q[0][0], Q[0][1]); for (var z2 = 1; z2 < Q.length; z2++) ctx.lineTo(Q[z2][0], Q[z2][1]); }); ctx.strokeStyle = css(T.ink3, .75 * seg(px, 3, 8)); ctx.lineWidth = u1; ctx.stroke(); }
        /* la gare : le bâtiment, le faisceau ; de loin, la voie hachurée */
        if (ax.gare) {
          var gr = ax.gare; ctx.beginPath(); il.voies.forEach(function (V) { ctx.moveTo(V[0][0], V[0][1]); for (var z3 = 1; z3 < V.length; z3++) ctx.lineTo(V[z3][0], V[z3][1]); });
          ctx.strokeStyle = css(T.ink2, .8 * aTrame); ctx.lineWidth = Math.max(1.2, .8 * u1); ctx.stroke();
          if (px < 30) { var V0 = gr.o.pts; ctx.beginPath(); ctx.moveTo(V0[2][0], V0[2][1]); for (z = 3; z < V0.length; z++) ctx.lineTo(V0[z][0], V0[z][1]); ctx.setLineDash([1.2 * u1, 6 * u1]); ctx.lineWidth = 4.5 * u1; ctx.strokeStyle = css(T.ink2, .75 * aTrame * (1 - seg(px, 14, 30))); ctx.stroke(); ctx.setLineDash([]); }
          var Bt = gr.bat; ctx.beginPath(); ctx.moveTo(Bt[0][0], Bt[0][1]); for (z = 1; z < 4; z++) ctx.lineTo(Bt[z][0], Bt[z][1]); ctx.closePath(); ctx.fillStyle = css(T.ink, (T.sombre ? .32 : .26) * aTrame); ctx.fill(); ctx.strokeStyle = css(T.ink2, .9 * aTrame); ctx.lineWidth = u1; ctx.stroke();
          if (px > 7 && couches.noms) nomsLieux.push([gr.nom, [ox + (gr.G[0] - gr.u[0] * 50) * mpx, oy + (gr.G[1] - gr.u[1] * 50) * mpx - Math.max(14, 40 * mpx)], 3]);
        }
        ctx.restore();
        /* le bâtiment tenu */
        if (batiTenu && batiTenu.c === c) { var pt2 = ecran(batiTenu.m); ctx.beginPath(); pt2.forEach(function (p, z4) { if (z4) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.closePath(); ctx.fillStyle = css(T.or, .22); ctx.fill(); ctx.strokeStyle = css(T.or, 1); ctx.lineWidth = 1.8; ctx.stroke(); }
        if (px > 260 && couches.noms) { ctx.font = '10.5px ' + F.ui; if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '0px'; ctx.fillStyle = css(T.pale, seg(px, 260, 360)); batis.forEach(function (b) { if (b.c !== c || b.edifice) return; var p = b.p; if (Math.hypot(p[1][0] - p[0][0], p[1][1] - p[0][1]) < 24) return; ctx.fillText(String(b.n), (p[0][0] + p[1][0]) / 2 + (p[p.length - 1][0] - p[0][0]) * .35 - 5, (p[0][1] + p[1][1]) / 2 + (p[p.length - 1][1] - p[0][1]) * .35 + 4); }); }
        /* les places */
        if (px > 70 && couches.noms) ax.places.forEach(function (p) { if (vuM([p.x - 50, p.y - 50, p.x + 50, p.y + 50])) nomsLieux.push([p.nom, [ox + p.x * mpx, oy + p.y * mpx], 0]); });
        /* les rues à nommer : leurs morceaux visibles, en coordonnées d'écran */
        if (couches.noms && px > 16) il.chaines.forEach(function (ch, n2) {
          if (!vuM(ch.bo, 40) || (!ch.grand && !ch.quai && px < 80)) return; var cur = [], z5;
          for (z5 = 0; z5 < ch.pts.length; z5++) { var p = ch.pts[z5], sx = ox + p[0] * mpx, sy = oy + p[1] * mpx; if (sx > -80 && sx < W + 80 && sy > -80 && sy < H + 80) cur.push([sx, sy]); else { if (cur.length > 2) nomsRues.push([ch.nom, cur, !!ch.grand || !!ch.quai, ch.l * mpx, n2 + c.id * 977]); cur = []; } }
          if (cur.length > 2) nomsRues.push([ch.nom, cur, !!ch.grand || !!ch.quai, ch.l * mpx, n2 + c.id * 977]);
        });
      });
      /* 3 · les fleuves */
      var aEau = couches.eau ? 1 : 0, ecrFleuves = [];
      if (aEau > .01) M.fleuves.forEach(function (f) {
        if (f.bo[2] < x0 - mar || f.bo[0] > x1 + mar || f.bo[3] < y0 - mar || f.bo[1] > y1 + mar) return; var petit = f.debit < 90; if (petit && k < 3.2) return;
        var saut = Math.max(1, Math.floor(2.2 / (Math.hypot(f.pts[1][0] - f.pts[0][0], f.pts[1][1] - f.pts[0][1]) * S || 1))), nb = f.pts.length, gr = Math.min(2.3, .85 + Math.log10(Math.max(1, k)) * .5), q, r, ecr = [], al = aEau * (petit ? seg(k, 3.2, 6) : 1);
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        for (q = 0; q < nb - 1; q += saut * 8) {
          var fin = Math.min(nb - 1, q + saut * 8), dedans = false, wq = f.w[Math.min(nb - 1, q + saut * 4)] / M.debitMax; ctx.beginPath();
          var ix = []; for (r = q; r < fin; r += saut) ix.push(r); ix.push(fin);   /* une spline par les milieux, sans couture d'un morceau à l'autre */
          var pa = [X(f.pts[q][0]), Y(f.pts[q][1])], pv = q > 0 ? f.pts[Math.max(0, q - saut)] : null; if (pv) ctx.moveTo((X(pv[0]) + pa[0]) / 2, (Y(pv[1]) + pa[1]) / 2); else ctx.moveTo(pa[0], pa[1]);
          for (r = 1; r < ix.length; r++) { var p = f.pts[ix[r]]; if (vu(p[0], p[1], 120 / S)) dedans = true; var pb = [X(p[0]), Y(p[1])]; ctx.quadraticCurveTo(pa[0], pa[1], (pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2); pa = pb; }
          if (fin === nb - 1) ctx.lineTo(pa[0], pa[1]);
          if (!dedans) continue; var trait = (.5 + 1.7 * wq) * gr, lit = (12 + 62 * wq) / (KM * 1000) * S;
          if (lit > trait + 2.5) { ctx.strokeStyle = css(T.cy, .6 * al); ctx.lineWidth = lit + 2.2; ctx.stroke(); ctx.strokeStyle = css(T.bg, 1); ctx.lineWidth = lit; ctx.stroke(); }
          else { ctx.strokeStyle = css(T.cy, (.36 + .44 * wq) * al); ctx.lineWidth = trait; ctx.stroke(); }
        }
        if (f.nom) { for (q = 0; q < nb; q += saut * 3) ecr.push([X(f.pts[q][0]), Y(f.pts[q][1])]); ecrFleuves.push([f, ecr]); }
      });
      /* les ponts, par-dessus l'eau */
      if (aEau > .01 && px > 2.5) villesVues.forEach(function (c) {
        var il = c.il, ox = X(c.x), oy = Y(c.y); il.ponts.forEach(function (p) {
          if (!p.grand && px < 9) return; var sx = ox + p.x * mpx, sy = oy + p.y * mpx; if (sx < -80 || sx > W + 80 || sy < -80 || sy > H + 80) return;
          var hl = p.lg * mpx + 2.5, hw = Math.max(p.l / 2 * mpx, p.grand ? 2.2 : 1.6), ux = p.u[0], uy = p.u[1], vx = -uy, vy = ux;
          ctx.beginPath(); ctx.moveTo(sx - ux * hl + vx * hw, sy - uy * hl + vy * hw); ctx.lineTo(sx + ux * hl + vx * hw, sy + uy * hl + vy * hw); ctx.lineTo(sx + ux * hl - vx * hw, sy + uy * hl - vy * hw); ctx.lineTo(sx - ux * hl - vx * hw, sy - uy * hl - vy * hw); ctx.closePath(); ctx.fillStyle = css(T.bg, 1); ctx.fill();
          ctx.beginPath(); ctx.moveTo(sx - ux * hl + vx * hw, sy - uy * hl + vy * hw); ctx.lineTo(sx + ux * hl + vx * hw, sy + uy * hl + vy * hw); ctx.moveTo(sx - ux * hl - vx * hw, sy - uy * hl - vy * hw); ctx.lineTo(sx + ux * hl - vx * hw, sy + uy * hl - vy * hw);
          if (p.voie) { ctx.moveTo(sx - ux * hl, sy - uy * hl); ctx.lineTo(sx + ux * hl, sy + uy * hl); }
          ctx.strokeStyle = css(T.ink2, .95 * seg(px, 2.5, 5)); ctx.lineWidth = p.grand ? 1.3 : 1; ctx.stroke();
          if (p.nom && px > 70 && couches.noms) nomsLieux.push([p.nom, [sx + vx * (hw + 16) * (vy < 0 ? -1 : 1), sy + vy * (hw + 16) * (vy < 0 ? -1 : 1)], 4]);
        });
      });
      /* 6 · les noms : d'abord la place des repères nommés, pour qu'aucun nom ne passe dessous */
      if (vue.k > 30 && reperes.length) groupes.forEach(function (G) { var sx = X(G.x), sy = Y(G.y); if (sx < -40 || sx > W + 40 || sy < -40 || sy > H + 40) return; if (G.lw === undefined) { var sp = G.el.querySelector('span'); G.lw = sp ? sp.offsetWidth : 0; } prendre([sx - 9, sy - 12, sx + 17 + G.lw, sy + 12]); });
      if (couches.noms) {
        ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
        /* les villes : un signe et un nom, par rang ; de près, le nom devient le mot immense derrière la ville */
        M.villes.forEach(function (c) {
          if (!vu(c.x, c.y, 600 / S)) return; var seuil = [0, .8, 4.5, 11][c.rang], ap = seg(k, seuil, seuil * 1.5 + .05), part = 1 - seg(k, 50, 140), sx = X(c.x), sy = Y(c.y);
          if (ap * part > .01) {
            ctx.fillStyle = css(T.ink, ap * part); ctx.strokeStyle = css(T.ink, ap * part); ctx.lineWidth = 1.2;
            if (c.rang === 0) { ctx.fillRect(sx - 3.5, sy - 3.5, 7, 7); ctx.strokeRect(sx - 6.5, sy - 6.5, 13, 13); } else if (c.rang === 1) { ctx.beginPath(); ctx.arc(sx, sy, 3.4, 0, 6.3); ctx.fill(); } else if (c.rang === 2) { ctx.beginPath(); ctx.arc(sx, sy, 3, 0, 6.3); ctx.fillStyle = css(T.bg, 1); ctx.fill(); ctx.stroke(); } else { ctx.beginPath(); ctx.arc(sx, sy, 1.8, 0, 6.3); ctx.fill(); }
            prendre([sx - 7, sy - 7, sx + 7, sy + 7]);
            var taille = [19, 16, 14, 13][c.rang] + Math.min(5, Math.log2(Math.max(1, k / Math.max(1, seuil))) * 1.1);
            mot(c.nom, sx + 15, sy + taille * .34, { font: (c.rang < 2 ? '500 ' : c.rang === 3 ? 'italic 400 ' : '400 ') + taille.toFixed(1) + 'px ' + F.texte, couleur: css(c.rang < 2 ? T.ink : T.voile, ap * part), h: taille, halo: ap * part, marge: 2 });
          }
          var gr = seg(k, 60, 150) * (1 - seg(k, 1500, 4200));
          if (gr > .01) { var tg = borne(c.r * S * .34, 30, 260); mot(c.nom.toUpperCase(), sx, sy - c.r * S * .5, { font: '400 ' + tg.toFixed(0) + 'px ' + F.nom, inter: tg * .05, couleur: css(T.ink, gr * mix(.5, .1, seg(tg, 40, 150))), ancre: 'centre', libre: true }); }
          if (c.quartiers.length) { var aq = seg(k, 150, 300) * (1 - seg(k, 5000, 12000)), tq = borne(11 + Math.log2(k / 200) * 2.2, 11, 24); if (aq > .01) c.quartiers.forEach(function (qr) { if (vu(qr.x, qr.y)) mot(qr.nom.toUpperCase(), X(qr.x), Y(qr.y), { font: '400 ' + tq.toFixed(1) + 'px ' + F.nom, inter: tq * .16, couleur: css(T.ink2, aq * .9), ancre: 'centre', h: tq, halo: aq, marge: 6 }); }); }
        });
        /* les sommets */
        var aS = seg(k, 4, 8) * (1 - seg(k, 120, 300)); if (aS > .01) M.sommets.forEach(function (s) { if (!vu(s[0], s[1])) return; var sx = X(s[0]), sy = Y(s[1]); ctx.beginPath(); ctx.moveTo(sx - 4, sy + 3); ctx.lineTo(sx, sy - 4); ctx.lineTo(sx + 4, sy + 3); ctx.closePath(); ctx.fillStyle = css(T.ink2, aS); ctx.fill(); mot(espace(Math.round(s[2] / 10) * 10), sx + 8, sy + 4, { font: '11px ' + F.ui, inter: .4, couleur: css(T.pale, aS), h: 11, halo: aS }); });
        /* les fleuves : l'italique de l'eau, le long du cours */
        var aF = seg(k, 3.5, 7) * (1 - seg(k, 2500, 6000)); if (aF > .01) { var tf = borne(13 + Math.log2(k / 4) * 1.1, 13, 21); ctx.font = 'italic 400 ' + tf.toFixed(1) + 'px ' + F.texte; if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '0px'; ctx.fillStyle = css(T.cy, aF); ctx.strokeStyle = css(T.bg, .85 * aF); ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; ctx.textBaseline = 'middle'; ecrFleuves.forEach(function (ef) { var vis = ef[1].filter(function (p) { return p[0] > 40 && p[0] < W - 40 && p[1] > 40 && p[1] < H - 40; }); if (vis.length > 6) { var dec = vis.map(function (p) { return [p[0], p[1] - tf * .78]; }); texteLong(ctx, dec, ef[0].nom, tf * .14, undefined, true, function (b) { if (!libre(b, 4)) return false; prendre(b); return true; }); } }); ctx.textBaseline = 'alphabetic'; }
        /* les rues et les lieux */
        if (nomsRues.length) { ctx.textBaseline = 'middle'; ctx.lineWidth = 3.2; ctx.lineJoin = 'round'; nomsRues.forEach(function (r) { var aN = r[2] ? seg(px, 16, 30) : seg(px, 80, 120); if (aN < .02) return; ctx.strokeStyle = css(T.bg, .85 * aN); var tr = borne(r[3] * .8, r[2] ? 10.5 : 10, r[2] ? 15 : 13.5); ctx.font = (r[2] ? '500 ' : '400 ') + tr.toFixed(1) + 'px ' + F.ui; if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '0px'; ctx.fillStyle = css(r[2] ? T.ink2 : T.pale, aN); var Lg = longueurs(r[1]), tot = Lg[Lg.length - 1], pasN = Math.max(560, ctx.measureText(r[0]).width * 2.6), d0 = (h3(r[4], 3, 5) * .6 + .2) * Math.min(pasN, tot), d; for (d = d0; d < tot - 30; d += pasN) { var p = pointA(r[1], Lg, d); if (p[0] > 60 && p[0] < W - 60 && p[1] > 40 && p[1] < H - 40) texteLong(ctx, r[1], r[0], tr * .06, d, true, function (b) { if (!libre(b, 3)) return false; prendre(b); return true; }); } }); ctx.textBaseline = 'alphabetic'; }
        nomsLieux.forEach(function (l) { var g = l[2] === 3, aL = g ? seg(px, 7, 14) : seg(px, 60, 100), t = g ? borne(px * .5, 12.5, 16) : l[2] === 4 ? borne(px * .07, 10.5, 14) : borne(px * .085, 11, 17); mot(g ? l[0].charAt(3).toUpperCase() + l[0].slice(4) : l[0], l[1][0], l[1][1] + 4, { font: (g ? '500 ' : 'italic 400 ') + t.toFixed(1) + 'px ' + F.texte, couleur: css(g ? T.ink : l[2] === 1 ? T.voile : l[2] === 4 ? T.cy : T.ink2, aL), ancre: 'centre', h: t, halo: aL, marge: 4 }); });
        /* les régions : petites et lisibles de haut, immenses et pâles quand on descend ; les mers en italique */
        var aR = 1 - seg(k, 22, 70); if (aR > .01) M.regions.forEach(function (r) { if (!vu(r.x, r.y, 900 / S)) return; var t = borne(15 * Math.pow(k, .92), 15, 250), gd = seg(t, 26, 90); mot(r.nom.toUpperCase(), X(r.x), Y(r.y), { font: '400 ' + t.toFixed(0) + 'px ' + F.nom, inter: t * mix(.34, .08, gd), couleur: css(T.ink, aR * mix(.62, .085, gd)), ancre: 'centre', h: t, libre: gd > .3, marge: 6 }); });
        var aM = (1 - seg(k, 14, 40)) * (couches.eau ? 1 : 0); if (aM > .01) M.mers.forEach(function (m) { if (!vu(m.x, m.y, 500 / S)) return; var t = borne(15 * Math.pow(k, .5), 15, 46); mot(m.nom, X(m.x), Y(m.y), { font: 'italic 300 ' + t.toFixed(0) + 'px ' + F.texte, inter: t * .12, couleur: css(T.cy, aM * .8), ancre: 'centre', h: t, marge: 4 }); });
        if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '0px';
      }
      dessus_(); placer(); habiller();
      if (o.surVue) o.surVue(api);
    }
    function demander() { if (!attente) attente = requestAnimationFrame(dessiner); }

    /* la densité (outil « zone ») : des points ou des hachures, ancrés au monde, jamais un arc-en-ciel */
    function dens(x, y) { var d = 0, i; for (i = 0; i < M.villes.length; i++) { var c = M.villes[i], s = .011 + (3 - c.rang) * .009, q = ((c.x - x) * (c.x - x) + (c.y - y) * (c.y - y)) / (2 * s * s); if (q < 8) d += [1, .7, .42, .24][c.rang] * Math.exp(-q); } return d; }
    function densite(x0, y0, x1, y1) {
      var pasM = Math.pow(2, Math.round(Math.log2(11 / vue.S))), i0 = Math.floor(x0 / pasM), i1 = Math.ceil(x1 / pasM), j0 = Math.floor(y0 / pasM), j1 = Math.ceil(y1 / pasM), i, j;
      if (o.densite === 'points') { ctx.fillStyle = css(T.ink, .62); for (j = j0; j <= j1; j++) for (i = i0; i <= i1; i++) { var x = (i + h3(i, j, 41)) * pasM, y = (j + h3(i, j, 42)) * pasM, d = dens(x, y); if (d < .16 || M.alt(x, y, 5) < 0) continue; var r = .45 + Math.min(1, d) * 1.5; ctx.beginPath(); ctx.arc(X(x), Y(y), r, 0, 6.3); ctx.fill(); } }
      else { ctx.beginPath(); for (var c = i0 + j0 - 1; c <= i1 + j1 + 1; c++) { var seuil = [.2, .8, .45, .8][((c % 4) + 4) % 4]; for (i = i0; i <= i1; i++) { var xa = i * pasM, ya = (c - i) * pasM; if (ya < y0 - pasM || ya > y1 + pasM) continue; if (dens(xa + pasM / 2, ya - pasM / 2) > seuil && M.alt(xa + pasM / 2, ya - pasM / 2, 5) > 0) { ctx.moveTo(X(xa), Y(ya)); ctx.lineTo(X(xa + pasM), Y(ya - pasM)); } } } ctx.strokeStyle = css(T.ink2, .6); ctx.lineWidth = 1; ctx.stroke(); }
    }

    /* ── l'habillage qui suit la vue ── */
    function ou() { var lv = niveau(); if (lv === 0) return ['Carte générale', 'Les Terres du Levant']; var v = villePres(vue.cx, vue.cy), d = Math.hypot(v.x - vue.cx, v.y - vue.cy); if (lv >= 2 && d < v.r * 1.6) { if (lv >= 3 && v.quartiers.length) { var q = v.quartiers.slice().sort(function (a2, b2) { return Math.hypot(a2.x - vue.cx, a2.y - vue.cy) - Math.hypot(b2.x - vue.cx, b2.y - vue.cy); })[0]; return [v.nom, q.nom]; } return ['Plan de ville', v.nom]; } var r = M.regions.slice().sort(function (a2, b2) { return Math.hypot(a2.x - vue.cx, a2.y - vue.cy) - Math.hypot(b2.x - vue.cx, b2.y - vue.cy); })[0]; return ['Feuille régionale', r.nom]; }
    var dernier = [.8, .5];
    function habiller() {
      var lv = niveau(), kmPx = KM / vue.S;
      if (H_.cartouche) { var w = ou(), rap = kmPx * 1000 / .0002646, p = Math.pow(10, Math.floor(Math.log10(rap))), r2 = Math.round(rap / p * 2) / 2 * p; C.cartouche(H_.cartouche, { sur: w[0] + ' · graine ' + M.graine, titre: w[1], rapport: '1 : ' + espace(r2), hauteur: NOMS_H[lv] }); }
      if (H_.echelle) C.echelle(H_.echelle, kmPx);
      if (H_.rail) [].forEach.call(H_.rail.children, function (b, i) { b.classList.toggle('ici', i === lv); b.classList.toggle('passe', i < lv); b.setAttribute('aria-current', i === lv ? 'true' : 'false'); });
      if (H_.mini) { var mw = H_.mini.clientWidth, mh = H_.mini.clientHeight, vw = W / vue.S / LARG * mw, vh = H / vue.S * mh, pt = vw < 7; H_.miniVue.classList.toggle('point', pt); H_.miniVue.hidden = vw > mw * .96 && vh > mh * .96; H_.miniVue.style.cssText = pt ? 'left:' + (vue.cx / LARG * mw) + 'px;top:' + (vue.cy * mh) + 'px' : 'left:' + ((vue.cx / LARG) * mw - vw / 2) + 'px;top:' + (vue.cy * mh - vh / 2) + 'px;width:' + vw + 'px;height:' + vh + 'px'; }
      cadreMini(); coords(dernier[0], dernier[1]); reserver();
    }
    var cadre = null;   /* le cadre que l'on promène sur la mini-carte au clavier, avant d'y aller */
    function cadreMini() {
      if (!H_.mini) return; H_.miniCadre.hidden = !cadre; if (!cadre) return; var mw = H_.mini.clientWidth, mh = H_.mini.clientHeight, vw = Math.max(13, W / vue.S / LARG * mw), vh = Math.max(13, H / vue.S * mh);
      H_.miniCadre.style.cssText = 'left:' + (cadre[0] / LARG * mw - vw / 2) + 'px;top:' + (cadre[1] * mh - vh / 2) + 'px;width:' + vw + 'px;height:' + vh + 'px';
    }
    function coords(x, y) { if (!H_.coords) return; dernier = [x, y]; var fin = vue.k > 400, al = M.alt(x, y, 9); H_.coords.firstChild.textContent = dms(lat(y), 'N', 'S', fin) + '   ' + dms(lon(x), 'E', 'O', fin); H_.coords.lastChild.textContent = al < 0 ? 'fond, ' + espace(-al) + ' m' : 'altitude, ' + espace(al) + ' m'; }
    function miniature() { if (!H_.mini) return; var c = H_.miniToile, w = H_.mini.clientWidth, h = H_.mini.clientHeight; c.width = w * dpr; c.height = h * dpr; var x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); peindreFond(x, M, T, w, h, 'points', { pas: 4, r: .9 }); }

    /* ── les repères : six formes ; ils se regroupent quand on recule ── */
    var reperes = (o.reperes === undefined ? M.reperes : o.reperes || []).map(function (r, i) { return { d: r, i: i }; }), groupes = [], kGroupes = 0;
    function grouper() {
      kGroupes = vue.k; calque.textContent = ''; groupes = []; var pris = {}, S = vue.S;
      reperes.forEach(function (r) {
        if (pris[r.i]) return; var g = [r]; pris[r.i] = 1;
        reperes.forEach(function (q) { if (!pris[q.i] && Math.hypot(q.d.x - r.d.x, q.d.y - r.d.y) * S < 36) { g.push(q); pris[q.i] = 1; } });
        var gx = 0, gy = 0; g.forEach(function (q) { gx += q.d.x; gy += q.d.y; });
        var G = { x: gx / g.length, y: gy / g.length, m: g }, seul = g.length === 1, d = r.d, estTenu = seul && tenu === r;
        var b = el('button', { type: 'button', class: 'carto-repere ' + (seul ? d.genre : 'groupe'), 'aria-pressed': String(estTenu), 'aria-label': seul ? d.nom + (d.genre === 'estime' ? ', emplacement estimé' : d.genre === 'manque' ? ', emplacement manquant' : '') : g.length + ' lieux, approcher pour les séparer' }, [el('i', {}, seul ? [] : [String(g.length)]), el('span', { text: seul ? d.nom : g.length + ' lieux' })]);
        b.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
        b.addEventListener('click', function () {
          if (seul) { tenir(estTenu && !fiche.hidden ? null : r); return; }
          var xa = 1e9, xb = -1e9, ya = 1e9, yb = -1e9; g.forEach(function (q) { xa = Math.min(xa, q.d.x); xb = Math.max(xb, q.d.x); ya = Math.min(ya, q.d.y); yb = Math.max(yb, q.d.y); });
          aller((xa + xb) / 2, (ya + yb) / 2, Math.min(40000, Math.min(W * .5 / Math.max(1e-9, xb - xa), H * .5 / Math.max(1e-9, yb - ya)) / s0), undefined, function () { parler(g.length + ' lieux séparés'); });
        });
        G.el = b; groupes.push(G); calque.appendChild(b);
      });
    }
    function placer() {
      if (reperes.length && Math.abs(Math.log(vue.k / (kGroupes || 1e-9))) > .12) grouper();
      var aRep = seg(vue.k, 2, 3.4); calque.style.opacity = aRep.toFixed(2); calque.style.pointerEvents = aRep < .5 ? 'none' : ''; calque.style.visibility = aRep < .02 ? 'hidden' : '';
      groupes.forEach(function (G) { var sx = X(G.x), sy = Y(G.y), dehors = sx < -40 || sx > W + 40 || sy < -40 || sy > H + 40; G.el.style.display = dehors ? 'none' : ''; if (!dehors) { G.el.style.transform = 'translate(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px)'; G.el.classList.toggle('nomme', vue.k > 30 || G.m.length > 1); } });
      if (!fiche.hidden && fiche._p) { var fx = X(fiche._p[0]), fy = Y(fiche._p[1]), g = fx > W - 400; fiche.classList.toggle('gauche', g); fiche.style.transform = 'translate(' + fx.toFixed(1) + 'px,' + fy.toFixed(1) + 'px)'; fiche.style.visibility = fx < -20 || fx > W + 20 || fy < 0 || fy > H ? 'hidden' : ''; }
    }
    /* la fiche de lieu : contre le repère tenu, sans cadre */
    function ouvrir(p, f) {
      fiche.textContent = ''; fiche._p = p; var corps = el('div', { class: 'carto-fiche-corps' }); fiche.appendChild(corps);
      corps.appendChild(el('p', { class: 'ke-petit', text: f.sur })); corps.appendChild(el('p', { class: 'carto-fiche-nom', text: f.nom })); if (f.dit) corps.appendChild(el('p', { class: 'carto-fiche-dit' + (f.genre === 'estime' ? ' ke-deduit' : f.genre === 'manque' ? ' ke-manque' : ''), text: f.dit }));
      corps.appendChild(el('p', { class: 'ke-petit', text: dms(lat(p[1]), 'N', 'S', true) + ' · ' + dms(lon(p[0]), 'E', 'O', true) + ' · ' + espace(Math.max(0, M.alt(p[0], p[1], 9))) + ' m' }));
      var act = el('p', { class: 'carto-fiche-gestes' }), b1 = el('button', { type: 'button', class: 'ke-btn petit', text: 's’approcher' }), b2 = el('button', { type: 'button', class: 'ke-btn petit', text: 'lâcher' });
      b1.addEventListener('click', function () { aller(p[0], p[1], Math.min(40000, Math.max(vue.k * 6, HAUTEURS[3]))); }); b2.addEventListener('click', function () { tenir(null); n.focus(); });
      act.appendChild(b1); act.appendChild(b2); corps.appendChild(act); fiche.hidden = false; placer(); parler(f.nom + '. ' + (f.dit || ''));
    }
    function tenir(r) {
      tenu = r; batiTenu = null; if (!r) { fiche.hidden = true; grouper(); demander(); return; }
      grouper(); ouvrir([r.d.x, r.d.y], { sur: (r.d.genre === 'estime' ? 'estimé · ' : r.d.genre === 'manque' ? 'manquant · ' : '') + r.d.sur, nom: r.d.nom, dit: r.d.dit, genre: r.d.genre }); demander();
      var b = groupes.filter(function (G) { return G.m.length === 1 && G.m[0] === r; })[0]; if (b) b.el.focus({ preventScroll: true });
    }
    function tenirBati(b) {
      tenu = null; batiTenu = b; var g = centroide(b.m), w = [b.c.x + g[0] / UM, b.c.y + g[1] / UM], il = ilots(M, b.c);
      ouvrir(w, b.edifice ? { sur: 'édifice · ' + b.c.nom, nom: b.edifice, dit: 'Bâti entre ' + (1180 + Math.floor(b.h * 900) % 160) + ' et ' + (1320 + Math.floor(b.h * 700) % 200) + '.' } : { sur: BATIS[Math.floor(b.h * 997) % BATIS.length] + ' · ' + b.c.nom, nom: b.n + ', ' + rueProche(il, g[0], g[1]), dit: 'Bâti en ' + (1780 + Math.floor(b.h * 1200) % 190) + ', ' + (2 + Math.floor(b.h * 77) % 5) + ' niveaux.' }); grouper(); demander();
    }
    function batiSous(sx, sy) { for (var i = batis.length - 1; i >= 0; i--) { var p = batis[i].p, d = false, a2, b2; for (a2 = 0, b2 = p.length - 1; a2 < p.length; b2 = a2++) if ((p[a2][1] > sy) !== (p[b2][1] > sy) && sx < (p[b2][0] - p[a2][0]) * (sy - p[a2][1]) / (p[b2][1] - p[a2][1]) + p[a2][0]) d = !d; if (d) return batis[i]; } return null; }

    /* ── les outils : le trajet et la zone (les tracés vivent dans le SVG du dessus) ── */
    var outil = o.outil || null, pts = (o.points || []).map(function (p) { return p.slice(); }), iso = o.isochrone ? o.isochrone.slice() : null, poignees = el('div', { class: 'carto-poignees' }); n.appendChild(poignees);
    var gTrace = svg('g', {}); dessus.appendChild(gTrace);
    function lisse(P, ferme) {   /* une courbe qui passe par les points (Catmull-Rom), échantillonnée */
      if (P.length < 2) return P.slice(); var out = [], nb = P.length, i, t, lim = ferme ? nb : nb - 1;
      for (i = 0; i < lim; i++) { var p0 = P[ferme ? (i - 1 + nb) % nb : Math.max(0, i - 1)], p1 = P[i], p2 = P[(i + 1) % nb], p3 = P[ferme ? (i + 2) % nb : Math.min(nb - 1, i + 2)]; for (t = 0; t < 18; t++) { var s = t / 18, s2 = s * s, s3 = s2 * s; out.push([.5 * (2 * p1[0] + (p2[0] - p0[0]) * s + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * s2 + (3 * p1[0] - p0[0] - 3 * p2[0] + p3[0]) * s3), .5 * (2 * p1[1] + (p2[1] - p0[1]) * s + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * s2 + (3 * p1[1] - p0[1] - 3 * p2[1] + p3[1]) * s3)]); } }
      if (!ferme) out.push(P[nb - 1]); return out;
    }
    function chemin(P, ferme) { return P.map(function (p, i) { return (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); }).join('') + (ferme ? 'Z' : ''); }
    var mesure = null, repereProfil = null, mode = o.mode === undefined ? 2 : o.mode;
    function mesurer() {
      if (outil === 'trajet') {   /* chaque étape suit le réseau ; les bouts à pied sont estimés */
        var brut = [pts[0]], hb = [], heures = 0, i, z, etapesP = [0];
        for (i = 0; i < pts.length - 1; i++) { var it = itineraire(M, pts[i], pts[i + 1], mode); heures += it.h; for (z = 1; z < it.pts.length; z++) { brut.push(it.pts[z]); hb.push(it.hors[z - 1]); } etapesP.push(brut.length - 1); }
        var lg = 0; for (i = 1; i < brut.length; i++) lg += Math.hypot(brut[i][0] - brut[i - 1][0], brut[i][1] - brut[i - 1][1]) * KM; var pasK = Math.max(.15, lg / 1800);
        var L = [brut[0]], hors = [], km = [0], alts = [Math.max(0, M.alt(brut[0][0], brut[0][1], 9))], dp = 0, dm = 0, etapes = [0];
        for (i = 1; i < brut.length; i++) { var a0 = brut[i - 1], b0 = brut[i], dk = Math.hypot(b0[0] - a0[0], b0[1] - a0[1]) * KM, nb = Math.max(1, Math.ceil(dk / pasK)); for (z = 1; z <= nb; z++) { var q = [mix(a0[0], b0[0], z / nb), mix(a0[1], b0[1], z / nb)], al = Math.max(0, M.alt(q[0], q[1], 9)), dz = al - alts[alts.length - 1]; L.push(q); hors.push(hb[i - 1]); km.push(km[km.length - 1] + dk / nb); alts.push(al); if (dz > 0) dp += dz; else dm -= dz; } if (etapesP.indexOf(i) > 0) etapes.push(km[km.length - 1]); }
        mesure = { L: L, km: km, alts: alts, total: km[km.length - 1] || 0, dp: dp, dm: dm, etapes: etapes, heures: heures, hors: hors, horsKm: hors.reduce(function (s2, h, z2) { return s2 + (h ? km[z2 + 1] - km[z2] : 0); }, 0) };
      } else if (outil === 'zone') {
        var aire = 0, per = 0, nb = pts.length; for (i = 0; i < nb; i++) { var p = pts[i], q = pts[(i + 1) % nb]; aire += p[0] * q[1] - q[0] * p[1]; per += Math.hypot(q[0] - p[0], q[1] - p[1]); }
        mesure = { aire: Math.abs(aire) / 2 * KM * KM, per: per * KM };
      }
      U && n.dispatchEvent(new CustomEvent('ke:change', { bubbles: true, detail: { outil: outil, points: pts.map(function (p) { return p.slice(); }), mesure: mesure } }));
    }
    var isoCache = null;
    function isochrones() {   /* le temps depuis un point, en voiture sur le réseau puis à pied : des courbes d'égal temps qui suivent les routes */
      var R = reseau(M), kmVue = W / vue.S * KM, pasH = [.25, .5, 1, 2, 4, 8, 16].filter(function (h) { return h * 55 > kmVue / 9; })[0] || 16, Tmax = pasH * 3, cle = iso[0] + ',' + iso[1] + ',' + Tmax;
      if (!isoCache || isoCache.cle !== cle) isoCache = { cle: cle, g: dijkstra(R, proches(M, R, iso, 2), 2, null, Tmax).g };
      var g = isoCache.g, cell = 9, nx = Math.ceil(W / cell) + 2, ny = Math.ceil(H / cell) + 2, Tg = new Float32Array(nx * ny).fill(Infinity), kmPx = KM / vue.S, vh = VIT.hors[2], i;
      function poser2(sx, sy, t) { var rp = (Tmax - t) * vh / kmPx, i0 = Math.max(0, Math.floor((sx - rp) / cell)), i1 = Math.min(nx - 1, Math.ceil((sx + rp) / cell)), j0 = Math.max(0, Math.floor((sy - rp) / cell)), j1 = Math.min(ny - 1, Math.ceil((sy + rp) / cell)), a2, b2; for (b2 = j0; b2 <= j1; b2++) for (a2 = i0; a2 <= i1; a2++) { var d = Math.hypot(a2 * cell - sx, b2 * cell - sy), t2 = t + d * kmPx / vh; if (t2 < Tg[b2 * nx + a2]) Tg[b2 * nx + a2] = t2; } }
      poser2(X(iso[0]), Y(iso[1]), 0);
      for (i = 0; i < R.n; i++) { if (g[i] >= Tmax) continue; var sx = X(R.X[i]), sy = Y(R.Y[i]); if (sx < -200 || sx > W + 200 || sy < -200 || sy > H + 200) continue; if (M.alt(R.X[i], R.Y[i], 5) < 0) continue; poser2(sx, sy, g[i]); }
      return { pas: pasH, c: [1, 2, 3].map(function (m) { return isolignes(Tg, nx, ny, pasH * m, cell).filter(function (l) { return l.length > 3; }); }) };
    }
    function dessus_() {
      gTrace.textContent = ''; if (!outil) return;
      if (outil === 'trajet' && pts.length) {
        if (!mesure) mesurer(); var L = mesure.L;
        var dR = '', dH = '', z, h0 = null; for (z = 0; z < L.length - 1; z++) { var h = !!mesure.hors[z], seg3 = (h0 === h ? '' : 'M' + X(L[z][0]).toFixed(1) + ' ' + Y(L[z][1]).toFixed(1)) + 'L' + X(L[z + 1][0]).toFixed(1) + ' ' + Y(L[z + 1][1]).toFixed(1); if (h) dH += seg3; else dR += seg3; h0 = h; }
        gTrace.appendChild(svg('path', { class: 'carto-trajet-fond', d: chemin(L) })); if (dR) gTrace.appendChild(svg('path', { class: 'carto-trajet', d: dR })); if (dH) gTrace.appendChild(svg('path', { class: 'carto-trajet estime', d: dH }));
        if (repereProfil !== null && L[repereProfil]) gTrace.appendChild(svg('circle', { class: 'carto-trajet-ici', cx: X(L[repereProfil][0]), cy: Y(L[repereProfil][1]), r: 7 }));
      }
      if (outil === 'zone') {
        if (!mesure) mesurer();
        if (iso) { var I2 = isochrones(), etiq = [[X(iso[0]), Y(iso[1])]]; I2.c.forEach(function (ls, i) { var lo = null, dl = -1; ls.forEach(function (l) { gTrace.appendChild(svg('path', { class: 'carto-iso', d: l.map(function (p, q) { return (q ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(''), style: 'opacity:' + (1 - i * .22) })); l.forEach(function (p) { var d2 = Math.hypot(p[0] - X(iso[0]), p[1] - Y(iso[1])); if (d2 > dl && p[0] > 30 && p[0] < W - 120 && p[1] > 30 && p[1] < H - 30 && etiq.every(function (e) { return Math.hypot(e[0] - p[0], e[1] - p[1]) > 90; })) { dl = d2; lo = p; } }); }); if (lo) { etiq.push(lo); var t = svg('text', { class: 'carto-iso-nom', x: lo[0] + 8, y: lo[1] - 6 }); t.textContent = duree(I2.pas * (i + 1)); gTrace.appendChild(t); } }); }
        if (pts.length > 1) { var Lz = lisse(pts, true); gTrace.appendChild(svg('path', { class: 'carto-zone', d: chemin(pts.length > 2 ? Lz : pts, pts.length > 2) })); }
      }
      /* les poignées : des ronds de 16 px qu'on tire ; la première est carrée */
      var liste = pts.map(function (p, i) { return { p: p, i: i }; }); if (iso) liste.push({ p: iso, i: -1 });
      while (poignees.children.length > liste.length) poignees.lastChild.remove();
      liste.forEach(function (h, q) {
        var b = poignees.children[q]; if (!b) { b = el('button', { type: 'button', class: 'carto-poignee' }); poignees.appendChild(b); brancherPoignee(b); }
        b._h = h; b.classList.toggle('centre', h.i === -1); b.classList.toggle('depart', h.i === 0 && outil === 'trajet'); b.classList.toggle('arrivee', outil === 'trajet' && h.i === pts.length - 1 && h.i > 0);
        b.setAttribute('aria-label', h.i === -1 ? 'Centre des isochrones' : (outil === 'trajet' ? 'Point ' : 'Sommet ') + (h.i + 1) + ' sur ' + pts.length + '. Flèches pour le déplacer, Suppr pour le retirer.');
        b.style.transform = 'translate(' + X(h.p[0]).toFixed(1) + 'px,' + Y(h.p[1]).toFixed(1) + 'px)';
      });
    }
    function brancherPoignee(b) {
      U.tirer(b, function (e) { e.stopPropagation(); b.focus({ preventScroll: true }); b.classList.add('tenu'); return {}; }, function (e) { var r = n.getBoundingClientRect(), w = versMonde(e.clientX - r.left, e.clientY - r.top); b._h.p[0] = w[0]; b._h.p[1] = w[1]; mesure = null; demander(); }, function () { b.classList.remove('tenu'); });
      b.addEventListener('keydown', function (e) {
        var pas = (e.shiftKey ? 2 : 14) / vue.S, dx = e.key === 'ArrowRight' ? pas : e.key === 'ArrowLeft' ? -pas : 0, dy = e.key === 'ArrowDown' ? pas : e.key === 'ArrowUp' ? -pas : 0;
        if (dx || dy) { b._h.p[0] += dx; b._h.p[1] += dy; mesure = null; demander(); e.preventDefault(); e.stopPropagation(); }
        else if ((e.key === 'Delete' || e.key === 'Backspace') && b._h.i >= 0 && pts.length > (outil === 'zone' ? 3 : 2)) { pts.splice(b._h.i, 1); mesure = null; demander(); n.focus(); e.preventDefault(); e.stopPropagation(); parler('Point retiré'); }
      });
      b.addEventListener('dblclick', function (e) { e.stopPropagation(); if (b._h.i >= 0 && pts.length > (outil === 'zone' ? 3 : 2)) { pts.splice(b._h.i, 1); mesure = null; demander(); } });
    }
    function ajouter(w) { pts.push([w[0], w[1]]); mesure = null; demander(); parler(outil === 'trajet' ? 'Point posé' : 'Sommet posé'); }

    /* ── les gestes ── */
    var doigts = new Map(), glisse = null, pince = null;   /* un doigt (ou la souris) fait glisser ; deux doigts pincent */
    function milieu() { var t = [], r = n.getBoundingClientRect(); doigts.forEach(function (p) { t.push(p); }); return { x: (t[0][0] + t[1][0]) / 2 - r.left, y: (t[0][1] + t[1][1]) / 2 - r.top, d: Math.hypot(t[0][0] - t[1][0], t[0][1] - t[1][1]) || 1 }; }
    n.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || e.target.closest('button, input, .carto-mini, .carto-fiche, .ke-menu-liste')) return;
      cancelAnimationFrame(anim); n.focus({ preventScroll: true }); try { n.setPointerCapture(e.pointerId); } catch (x) { /* pointeur de synthèse */ }
      doigts.set(e.pointerId, [e.clientX, e.clientY]);
      if (doigts.size === 2) { var m = milieu(); pince = { d: m.d, k: vue.k, w: versMonde(m.x, m.y) }; if (glisse) glisse.b = true; n.classList.add('glisse'); return; }
      if (doigts.size === 1) glisse = { x: e.clientX, y: e.clientY, cx: vue.cx, cy: vue.cy, b: false, id: e.pointerId };
    });
    n.addEventListener('pointermove', function (e) {
      if (!doigts.has(e.pointerId)) return; doigts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pince && doigts.size >= 2) { var m = milieu(), k = borne(pince.k * m.d / pince.d, .75, 60000), S2 = s0 * k; poser(pince.w[0] - (m.x - W / 2) / S2, pince.w[1] - (m.y - H / 2) / S2, k); return; }
      var d = glisse; if (!d || d.id !== e.pointerId) return; if (!d.b && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 4) return; d.b = true; n.classList.add('glisse'); poser(d.cx - (e.clientX - d.x) / vue.S, d.cy - (e.clientY - d.y) / vue.S, vue.k);
    });
    function lacher(e) {
      if (!doigts.has(e.pointerId)) return; doigts.delete(e.pointerId);
      if (pince) { if (doigts.size < 2) { pince = null; var reste = null; doigts.forEach(function (p, id) { reste = [id, p]; }); glisse = reste ? { x: reste[1][0], y: reste[1][1], cx: vue.cx, cy: vue.cy, b: true, id: reste[0] } : null; if (!reste) n.classList.remove('glisse'); parler(NOMS_H[niveau()]); } return; }
      var d = glisse; if (!d || d.id !== e.pointerId) return; glisse = null; n.classList.remove('glisse'); if (d.b || e.type === 'pointercancel') return;
      var r = n.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top;
      if (outil) { ajouter(versMonde(sx, sy)); return; }
      var b = batiSous(sx, sy); if (b) tenirBati(b); else if (tenu || batiTenu) { tenu = null; batiTenu = null; fiche.hidden = true; grouper(); demander(); }
    }
    n.addEventListener('pointerup', lacher); n.addEventListener('pointercancel', lacher);
    n.addEventListener('pointermove', function (e) { var r = n.getBoundingClientRect(), w = versMonde(e.clientX - r.left, e.clientY - r.top); coords(w[0], w[1]); });
    n.addEventListener('dblclick', function (e) { if (outil || e.target.closest('button, input, .carto-mini, .carto-fiche')) return; var r = n.getBoundingClientRect(); var p = versMonde(e.clientX - r.left, e.clientY - r.top); aller(p[0], p[1], vue.k * 3, 320); });
    n.addEventListener('wheel', function (e) { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); cancelAnimationFrame(anim); var r = n.getBoundingClientRect(); zoomer(vue.k * Math.pow(.9965, e.deltaY), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
    n.addEventListener('keydown', function (e) {
      if (e.target.closest('input')) return;
      if (e.key === 'Escape') { if (tenu || batiTenu) { tenu = null; batiTenu = null; fiche.hidden = true; grouper(); demander(); n.focus(); e.preventDefault(); } return; }
      if (e.target !== n) return; var p = (e.shiftKey ? 20 : 90) / vue.S;
      if (e.key === 'ArrowLeft') poser(vue.cx - p, vue.cy, vue.k); else if (e.key === 'ArrowRight') poser(vue.cx + p, vue.cy, vue.k); else if (e.key === 'ArrowUp') poser(vue.cx, vue.cy - p, vue.k); else if (e.key === 'ArrowDown') poser(vue.cx, vue.cy + p, vue.k);
      else if (e.key === '+' || e.key === '=') aller(vue.cx, vue.cy, vue.k * 1.8, 200); else if (e.key === '-') aller(vue.cx, vue.cy, vue.k / 1.8, 200); else if (/^[1-5]$/.test(e.key)) hauteur(+e.key - 1);
      else if (e.key === 'Enter' && outil) ajouter([vue.cx, vue.cy]); else if (e.key === 'Enter' && batis.length) { var b = batiSous(W / 2, H / 2); if (b) tenirBati(b); }
      else if (e.key === 'Backspace' && outil && pts.length > (outil === 'zone' ? 3 : 1)) { pts.pop(); mesure = null; demander(); parler('Dernier point retiré'); } else return;
      coords(vue.cx, vue.cy); e.preventDefault();
    });
    if (H_.rail) { H_.rail.addEventListener('click', function (e) { var b = e.target.closest('[data-h]'); if (b) hauteur(+b.dataset.h); }); H_.zoom.addEventListener('click', function (e) { var b = e.target.closest('[data-z]'); if (b) aller(vue.cx, vue.cy, vue.k * (b.dataset.z === '+' ? 2.4 : 1 / 2.4), 260); }); }
    if (H_.mini) {
      H_.mini.addEventListener('keydown', function (e) {
        var pas = e.shiftKey ? .012 : .05, dx = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0, dy = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
        if (dx || dy) { if (!cadre) cadre = [vue.cx, vue.cy]; cadre = [borne(cadre[0] + dx * pas * LARG, 0, LARG), borne(cadre[1] + dy * pas, 0, 1)]; cadreMini(); var v = villePres(cadre[0], cadre[1]); parler(Math.hypot(v.x - cadre[0], v.y - cadre[1]) < .03 ? 'vers ' + v.nom : 'cadre déplacé'); }
        else if (e.key === 'Enter' && cadre) { var c2 = cadre; cadre = null; cadreMini(); aller(c2[0], c2[1], vue.k, undefined, function () { parler(ou()[1]); }); }
        else if (e.key === 'Escape' && cadre) { cadre = null; cadreMini(); }
        else return;
        e.preventDefault(); e.stopPropagation();
      });
      H_.mini.addEventListener('blur', function () { cadre = null; cadreMini(); });
    }
    if (H_.mini) { var versMini = function (e) { var r = H_.mini.getBoundingClientRect(); poser((e.clientX - r.left) / r.width * LARG, (e.clientY - r.top) / r.height, vue.k); }; H_.mini.addEventListener('pointerdown', function (e) { e.stopPropagation(); cancelAnimationFrame(anim); try { H_.mini.setPointerCapture(e.pointerId); } catch (x) { /* pointeur de synthèse */ } versMini(e); var mv = function (ev) { versMini(ev); }, up = function () { H_.mini.removeEventListener('pointermove', mv); H_.mini.removeEventListener('pointerup', up); }; H_.mini.addEventListener('pointermove', mv); H_.mini.addEventListener('pointerup', up); }); }
    /* la recherche : les villes, les quartiers, les repères, les régions */
    if (H_.champ) {
      var index = []; M.villes.forEach(function (v) { index.push({ nom: v.nom, sur: v.rang === 0 ? 'capitale' : 'ville', x: v.x, y: v.y, k: HAUTEURS[2] * .0021 / v.r * .8 }); v.quartiers.forEach(function (q) { index.push({ nom: q.nom, sur: 'quartier · ' + v.nom, x: q.x, y: q.y, k: HAUTEURS[3] * .6 }); }); });
      M.reperes.forEach(function (r, i) { index.push({ nom: r.nom, sur: r.sur, x: r.x, y: r.y, k: HAUTEURS[3], r: i }); }); M.regions.forEach(function (r) { index.push({ nom: r.nom, sur: 'région', x: r.x, y: r.y, k: 6 }); }); M.fleuves.forEach(function (f) { if (!f.nom) return; var p = f.pts[Math.floor(f.pts.length / 2)]; index.push({ nom: f.nom, sur: 'fleuve', x: p[0], y: p[1], k: 14 }); });
      index.forEach(function (x) { x.cle = sansAccent(x.nom); });
      var trouves = [], actif = -1;
      var lister = function () {
        var q = sansAccent(H_.champ.value.trim()); H_.liste.textContent = ''; trouves = q ? index.filter(function (x) { return x.cle.indexOf(q) >= 0; }).sort(function (a2, b2) { return (a2.cle.indexOf(q) ? 1 : 0) - (b2.cle.indexOf(q) ? 1 : 0); }).slice(0, 7) : []; actif = trouves.length ? 0 : -1;
        if (q && !trouves.length) H_.liste.appendChild(el('li', { class: 'ke-petit', text: 'aucun lieu de ce nom' }));
        trouves.forEach(function (x, i) { var li = el('li', { role: 'option', id: 'carto-r' + i, 'aria-selected': String(i === actif) }, [x.nom, el('kbd', { text: x.sur })]); li.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); choisir(i); }); H_.liste.appendChild(li); });
        H_.liste.hidden = !q; H_.champ.setAttribute('aria-expanded', String(!!q)); H_.champ.setAttribute('aria-activedescendant', actif >= 0 ? 'carto-r0' : '');
      }, marquer = function () { [].forEach.call(H_.liste.querySelectorAll('[role=option]'), function (li, i) { li.setAttribute('aria-selected', String(i === actif)); li.classList.toggle('est-survol', i === actif); }); H_.champ.setAttribute('aria-activedescendant', actif >= 0 ? 'carto-r' + actif : ''); },
        choisir = function (i) { var x = trouves[i]; if (!x) return; H_.champ.value = x.nom; H_.liste.hidden = true; H_.champ.setAttribute('aria-expanded', 'false'); aller(x.x, x.y, x.k, undefined, function () { if (x.r !== undefined) tenir(reperes[x.r]); parler(x.nom); }); };
      H_.champ.addEventListener('input', function () { lister(); marquer(); });
      H_.champ.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' && trouves.length) { actif = (actif + 1) % trouves.length; marquer(); e.preventDefault(); } else if (e.key === 'ArrowUp' && trouves.length) { actif = (actif - 1 + trouves.length) % trouves.length; marquer(); e.preventDefault(); } else if (e.key === 'Enter') { choisir(actif); e.preventDefault(); } else if (e.key === 'Escape') { H_.champ.value = ''; lister(); e.preventDefault(); } e.stopPropagation(); });
      H_.champ.addEventListener('blur', function () { H_.liste.hidden = true; H_.champ.setAttribute('aria-expanded', 'false'); });
      H_.recherche.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    }

    /* ── la taille, le thème ── */
    function mesurerTaille() { var r = n.getBoundingClientRect(); if (!r.width || !r.height) return; W = r.width; H = r.height; dpr = Math.min(2, window.devicePixelRatio || 1); toile.width = Math.round(W * dpr); toile.height = Math.round(H * dpr); s0 = Math.min(W / LARG, H) * (o.remplir ? Math.max(W / LARG, H) / Math.min(W / LARG, H) : 1); vue.S = s0 * vue.k; miniature(); grouper(); demander(); }
    if (window.ResizeObserver) new ResizeObserver(mesurerTaille).observe(n); else window.addEventListener('resize', mesurerTaille);
    document.addEventListener('ke:theme', function () { T = jetons(n); miniature(); demander(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { polices = null; F = police(); demander(); });
    var api = n._carto = {
      monde: M, vue: function () { return { cx: vue.cx, cy: vue.cy, k: vue.k }; }, aller: aller, poser: poser, hauteur: hauteur, niveau: niveau, zoomer: zoomer, redessiner: demander,
      points: function (p) { if (p) { pts = p.map(function (q) { return q.slice(); }); mesure = null; demander(); } return pts; }, mesure: function () { if (!mesure) mesurer(); return mesure; },
      mode: function (m) { if (m !== undefined && m !== mode) { mode = m; mesure = null; demander(); } return mode; }, densite: function (g) { o.densite = g; demander(); }, isochrone: function (p) { iso = p; demander(); }, ici: function (i) { repereProfil = i; demander(); },
      tenir: function (i) { tenir(i === null ? null : reperes[i]); }, ville: function (i) { return M.villes[i]; }, versEcran: function (x, y) { return [X(x), Y(y)]; },
      chrono: function () { var t = performance.now(); brouillon = false; dessiner(); return performance.now() - t; }
    };
    mesurerTaille(); var d = o.vue; if (d) { vue.cx = d.cx; vue.cy = d.cy; vue.k = d.k; vue.S = s0 * d.k; } else if (W) { vue.k = Math.max(.86, Math.min(1, (W / LARG) / s0)); vue.S = s0 * vue.k; }
    grouper(); demander();
    return api;
  };

  /* ══ Les petits fonds de carte, pour une diapositive ══ */
  function peindreFond(x, M, T, w, h, genre, o) {
    o = o || {}; var v = o.vue || { cx: LARG / 2, cy: .5, k: 1 }, S = Math.min(w / LARG, h) * v.k * (o.remplir === false ? 1 : Math.max(w / LARG, h) / Math.min(w / LARG, h)), i, j;
    function wx(sx) { return v.cx + (sx - w / 2) / S; } function wy(sy) { return v.cy + (sy - h / 2) / S; }
    x.clearRect(0, 0, w, h);
    if (genre === 'points') { var p = o.pas || 9, r = o.r || 1.5; for (j = p / 2; j < h; j += p) for (i = p / 2; i < w; i += p) { var a = M.alt(wx(i), wy(j), 6); if (a <= 0) continue; x.fillStyle = css(T.ink, .28 + Math.min(.72, a / 2600)); x.beginPath(); x.arc(i, j, r * (.75 + Math.min(.6, a / 4000)), 0, 6.3); x.fill(); } }
    else if (genre === 'latitudes') {   /* des parallèles soulevés par le relief ; chaque ligne cache celles de derrière */
      var pl = o.pas || 11, amp = o.amp || 26; x.lineWidth = 1; x.lineJoin = 'round';
      for (j = pl; j < h + amp; j += pl) { var pts = [], terre = false; for (i = 0; i <= w; i += 3) { var al = Math.max(0, M.alt(wx(i), wy(j), 7)); if (al > 0) terre = true; pts.push([i, j - Math.pow(al / 3000, .8) * amp * 2.4, al]); }
        if (!terre) { x.beginPath(); x.moveTo(0, j); x.lineTo(w, j); x.strokeStyle = css(T.cy, .1); x.stroke(); continue; }
        x.beginPath(); x.moveTo(0, j + 2); pts.forEach(function (q) { x.lineTo(q[0], q[1]); }); x.lineTo(w, j + 2); x.closePath(); x.fillStyle = css(T.bg, 1); x.fill();
        for (i = 1; i < pts.length; i++) { var t2 = pts[i][2] > 0 || pts[i - 1][2] > 0; x.beginPath(); x.moveTo(pts[i - 1][0], pts[i - 1][1]); x.lineTo(pts[i][0], pts[i][1]); x.strokeStyle = t2 ? css(T.ink, .34 + Math.min(.6, pts[i][2] / 2400)) : css(T.cy, .1); x.stroke(); } }
    } else relief(x, M, { cx: v.cx, cy: v.cy, k: v.k, S: S }, w, h, T, { terre: o.terre === undefined ? 1 : o.terre, ombre: 1, courbes: 1, eau: 1 });
  }
  C.fond = function (n, o) {
    o = o || {}; var M = monde(o.graine || 1911), c = el('canvas', { 'aria-hidden': 'true' }), T; n.classList.add('carto-fondu'); n.insertBefore(c, n.firstChild);
    function peindre() { var r = n.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1); if (!r.width) return; T = jetons(n); c.width = r.width * d; c.height = r.height * d; var x = c.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); peindreFond(x, M, T, r.width, r.height, o.genre || 'points', o); }
    if (window.ResizeObserver) new ResizeObserver(peindre).observe(n); document.addEventListener('ke:theme', peindre); peindre(); return { peindre: peindre };
  };

  /* ══ La carte de flux : des arcs entre des lieux ; l'épaisseur dit le volume ══ */
  C.flux = function (n, o) {
    o = o || {}; var M = monde(o.graine || 1911), fond = C.fond(n, { genre: 'points', pas: 8, r: 1.1, remplir: false }), s = svg('svg', { class: 'carto-flux-arcs', role: 'group', 'aria-label': 'Les flux' }), lu = o.lu; n.classList.add('carto-flux'); n.appendChild(s);
    var liens = o.liens || [[0, 1, 12400], [0, 2, 8200], [0, 3, 9600], [0, 5, 4100], [1, 4, 3300], [2, 6, 2700], [3, 7, 5200], [0, 9, 1800], [5, 11, 1500], [4, 12, 900], [6, 14, 1200], [0, 16, 2400]], max = Math.max.apply(null, liens.map(function (l) { return l[2]; }));
    function peindre() {
      var r = n.getBoundingClientRect(), w = r.width, h = r.height, S = Math.min(w / LARG, h); if (!w) return; s.textContent = ''; s.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      function P(v) { return [w / 2 + (v.x - LARG / 2) * S, h / 2 + (v.y - .5) * S]; }
      liens.forEach(function (l) {
        var A = M.villes[l[0]], B = M.villes[l[1]]; if (!A || !B) return; var a = P(A), b = P(B), dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), cx = (a[0] + b[0]) / 2 - dy * .22, cy = (a[1] + b[1]) / 2 + dx * .22 - L * .12, d = 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + 'Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1);
        var arc = svg('path', { class: 'arc', d: d, 'stroke-width': (1 + l[2] / max * 8).toFixed(1) }), prise = svg('path', { class: 'prise', d: d, tabindex: '0', role: 'img', 'aria-label': A.nom + ' vers ' + B.nom + ', ' + espace(l[2]) + ' par jour' });
        function vif(oui) { arc.classList.toggle('vif', oui); s.classList.toggle('vise', oui); if (oui && lu) { lu.textContent = ''; lu.appendChild(el('small', { text: A.nom + ' → ' + B.nom })); lu.appendChild(document.createTextNode(espace(l[2]) + ' par jour')); } }
        prise.addEventListener('mouseenter', function () { vif(true); }); prise.addEventListener('mouseleave', function () { vif(false); }); prise.addEventListener('focus', function () { vif(true); }); prise.addEventListener('blur', function () { vif(false); });
        s.appendChild(arc); s.appendChild(prise);
      });
      var vus = {}; liens.forEach(function (l) { [l[0], l[1]].forEach(function (i) { if (vus[i] || !M.villes[i]) return; vus[i] = 1; var p = P(M.villes[i]), gene = liens.some(function (x) { return [x[0], x[1]].some(function (j) { if (j === i || !M.villes[j]) return false; var q = P(M.villes[j]); return q[0] > p[0] && q[0] - p[0] < 130 && Math.abs(q[1] - p[1]) < 16; }); }); s.appendChild(svg(i === 0 ? 'rect' : 'circle', i === 0 ? { class: 'lieu', x: p[0] - 4, y: p[1] - 4, width: 8, height: 8 } : { class: 'lieu', cx: p[0], cy: p[1], r: 3.2 })); var t = svg('text', { x: p[0] + (gene ? -9 : 9), y: p[1] + 4, 'text-anchor': gene ? 'end' : 'start' }); t.textContent = M.villes[i].nom; s.appendChild(t); }); });
    }
    if (window.ResizeObserver) new ResizeObserver(peindre).observe(n); peindre(); return { peindre: peindre, fond: fond };
  };

  /* ══ Le profil d'un trajet : l'altitude le long du chemin, les étapes ; il désigne le point sur la carte ══ */
  C.profil = function (n, carte) {
    n.classList.add('carto-profil'); n.tabIndex = 0; n.setAttribute('role', 'slider'); n.setAttribute('aria-label', 'Position le long du trajet');
    var s = svg('svg', { preserveAspectRatio: 'none', 'aria-hidden': 'true' }), lu = el('p', { class: 'carto-profil-lu' }), ici = 0, m = null, Wp = 1000, Hp = 150;
    n.appendChild(s); n.appendChild(lu);
    function peindre() {
      m = carte.mesure(); if (!m || !m.L || m.L.length < 2) { s.textContent = ''; lu.textContent = 'Pose deux points sur la carte.'; return; }
      Wp = Math.max(300, n.clientWidth); s.setAttribute('viewBox', '0 0 ' + Wp + ' ' + Hp); s.textContent = '';
      var max = Math.max.apply(null, m.alts), min = Math.min.apply(null, m.alts), e = Math.max(60, max - min), d = '', i;
      function x(i2) { return m.km[i2] / m.total * Wp; } function y(a) { return Hp - 26 - (a - min) / e * (Hp - 50); }
      for (i = 0; i < m.L.length; i++) d += (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(m.alts[i]).toFixed(1);
      s.appendChild(svg('path', { class: 'aire', d: d + 'L' + Wp + ' ' + (Hp - 26) + 'L0 ' + (Hp - 26) + 'Z' })); s.appendChild(svg('line', { class: 'sol', x1: 0, y1: Hp - 26, x2: Wp, y2: Hp - 26 })); s.appendChild(svg('path', { class: 'trace', d: d }));
      m.etapes.filter(function (k2) { return k2 < m.total * .93; }).concat([m.total]).forEach(function (k, q, t) { var px = k / m.total * Wp; s.appendChild(svg('line', { class: 'etape', x1: px, y1: Hp - 30, x2: px, y2: Hp - 21 })); var tx = svg('text', { x: Math.min(Wp - 2, Math.max(2, px)), y: Hp - 6, 'text-anchor': q === 0 ? 'start' : q === t.length - 1 ? 'end' : 'middle' }); tx.textContent = q === 0 ? 'départ' : q === t.length - 1 ? dist(k) : dist(k); s.appendChild(tx); });
      var im = m.alts.indexOf(max), th = svg('text', { class: 'haut', x: Math.min(Wp - 60, x(im) + 6), y: Math.max(12, y(max) - 6) }); th.textContent = espace(max) + ' m'; s.appendChild(th);
      ici = Math.min(ici, m.L.length - 1); viser(ici, false);
    }
    var viseur = null, point = null;
    function viser(i, montrer) {
      if (!m || !m.L) return; ici = borne(i, 0, m.L.length - 1); var max = Math.max.apply(null, m.alts), min = Math.min.apply(null, m.alts), e = Math.max(60, max - min), px = m.km[ici] / m.total * Wp, py = Hp - 26 - (m.alts[ici] - min) / e * (Hp - 50);
      if (viseur) { viseur.remove(); point.remove(); } viseur = svg('line', { class: 'viseur', x1: px, x2: px, y1: 4, y2: Hp - 26 }); point = svg('circle', { class: 'point', cx: px, cy: py, r: 4.5 }); s.appendChild(viseur); s.appendChild(point);
      lu.textContent = ''; lu.appendChild(el('b', { text: dist(m.km[ici]) })); lu.appendChild(document.createTextNode(' du départ · ' + espace(m.alts[ici]) + ' m')); n.setAttribute('aria-valuenow', Math.round(m.km[ici])); n.setAttribute('aria-valuetext', dist(m.km[ici]) + ', ' + espace(m.alts[ici]) + ' mètres');
      n.classList.toggle('vise', !!montrer); carte.ici(montrer ? ici : null);
    }
    function lire(e) { var r = s.getBoundingClientRect(), k = borne((e.clientX - r.left) / r.width, 0, 1) * m.total, i = 0; while (i < m.km.length - 1 && m.km[i] < k) i++; return i; }
    n.addEventListener('pointermove', function (e) { if (m && m.L) viser(lire(e), true); }); n.addEventListener('pointerleave', function () { viser(ici, false); });
    n.addEventListener('keydown', function (e) { var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d || !m) return; e.preventDefault(); viser(ici + d * (e.shiftKey ? 1 : 4), true); }); n.addEventListener('blur', function () { viser(ici, false); });
    if (window.ResizeObserver) new ResizeObserver(peindre).observe(n);
    return { peindre: peindre };
  };
  C.plan = function (graine, i) { var M = monde(graine || 1911); return { ville: M.villes[i], axes: axes(M, M.villes[i]), ilots: ilots(M, M.villes[i]) }; };   /* pour les essais */
  C.mots = { dist: dist, duree: duree, espace: espace, dms: dms, HAUTEURS: HAUTEURS, NOMS: NOMS_H, KM: KM };

  /* ══ La page du kit : les planches de démonstration (ne fait rien si les éléments n'y sont pas) ══ */
  function par(id) { return document.getElementById(id); }
  function page() {
    if (par('carte')) C.carte(par('carte'), { remplir: false });
    /* le trajet */
    if (par('carte-trajet')) {
      var M = monde(1911), c0 = M.villes[0], route = M.routes.filter(function (r) { return r.a === c0 || r.b === c0; }).sort(function (a, b) { return b.pts.length * Math.hypot(b.a.x - b.b.x, b.a.y - b.b.y) - a.pts.length * Math.hypot(a.a.x - a.b.x, a.a.y - a.b.y); })[0];
      var cible = M.sommets.slice().sort(function (a, b) { return Math.hypot(a[0] - c0.x, a[1] - c0.y) - Math.hypot(b[0] - c0.x, b[1] - c0.y); })[0], pt;
      if (route) { var rp = route.a === c0 ? route.pts : route.pts.slice().reverse(); pt = [0, 7, 13, 20, 26].map(function (i) { return rp[i].slice(); }); }   /* par défaut : la grande route qui part de la capitale */
      else pt = [[c0.x, c0.y], [cible[0], cible[1]]];
      var dep = pt[0], arr = pt[pt.length - 1], mx = (dep[0] + arr[0]) / 2, my = (dep[1] + arr[1]) / 2, el2 = par('carte-trajet');
      var mode = 0, profil;
      var ct = C.carte(el2, { outil: 'trajet', mode: 0, points: pt, reperes: null, habillage: ['echelle', 'coords', 'rail'] }), r = el2.getBoundingClientRect();
      ct.poser(mx, my, borne(Math.min(r.width * .5 / Math.max(.004, Math.abs(arr[0] - dep[0])), r.height * .45 / Math.max(.004, Math.abs(arr[1] - dep[1]))) / Math.min(r.width / LARG, r.height), 3, 60));
      profil = C.profil(par('profil-trajet'), ct);
      var lire = function () { var m = ct.mesure(); par('trajet-dist').textContent = dist(m.total); par('trajet-duree').textContent = duree(m.heures || 0); par('trajet-denivele').textContent = '+ ' + espace(m.dp) + ' m · − ' + espace(m.dm) + ' m'; par('trajet-etapes').textContent = (ct.points().length - 1) + (ct.points().length > 2 ? ' étapes' : ' étape') + (m.horsKm > .05 ? ' · ' + dist(m.horsKm) + ' hors route, estimé' : ''); profil.peindre(); };
      el2.addEventListener('ke:change', function () { requestAnimationFrame(lire); });
      [].forEach.call(document.querySelectorAll('[data-mode]'), function (b) { b.addEventListener('click', function () { mode = +b.dataset.mode; ct.mode(mode); [].forEach.call(document.querySelectorAll('[data-mode]'), function (x) { x.setAttribute('aria-pressed', String(x === b)); }); lire(); }); });
      par('trajet-effacer').addEventListener('click', function () { ct.points([ct.points()[0]]); }); par('trajet-revenir').addEventListener('click', function () { var p = ct.points(); if (p.length > 1) { p.pop(); ct.points(p); } });
      lire();
    }
    /* les zones */
    if (par('carte-zone')) {
      var M2 = monde(1911), v = M2.villes[0], R2 = .03, poly = [0, 1, 2, 3, 4, 5].map(function (i) { var a = i / 6 * 6.283 + .4, rr = R2 * (.75 + .5 * h3(i, 3, 9)); return [v.x + .006 + Math.cos(a) * rr * 1.25, v.y + .02 + Math.sin(a) * rr]; });
      var cz = C.carte(par('carte-zone'), { outil: 'zone', points: poly, isochrone: [v.x, v.y], densite: 'points', reperes: null, habillage: ['echelle', 'coords', 'rail'], vue: { cx: v.x + .004, cy: v.y + .018, k: 13 } });
      var lz = function () { var m = cz.mesure(); par('zone-aire').textContent = espace(m.aire) + ' km²'; par('zone-tour').textContent = dist(m.per); };
      par('carte-zone').addEventListener('ke:change', function () { requestAnimationFrame(lz); });
      [].forEach.call(document.querySelectorAll('[data-dens]'), function (b) { b.addEventListener('click', function () { cz.densite(b.dataset.dens || null); [].forEach.call(document.querySelectorAll('[data-dens]'), function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }); });
      var bi = par('zone-iso'); bi.addEventListener('click', function () { var on = bi.getAttribute('aria-pressed') !== 'true'; bi.setAttribute('aria-pressed', String(on)); cz.isochrone(on ? [cz.vue().cx, cz.vue().cy] : null); });
      lz();
    }
    /* l'habillage, pièce par pièce */
    [['ech-1', 3.4], ['ech-2', .12], ['ech-3', .0009]].forEach(function (e) { if (par(e[0])) C.echelle(par(e[0]), e[1]); });
    if (par('rose-seule')) C.rose(par('rose-seule')); if (par('legende-seule')) C.legende(par('legende-seule'));
    if (par('cartouche-seul')) C.cartouche(par('cartouche-seul'), { sur: 'Feuille régionale · graine 1911', titre: 'Haute-Marche', rapport: '1 : 500 000', hauteur: 'la région' });
    if (par('couches-seules')) C.couches(par('couches-seules'), { relief: true, eau: true, routes: false, noms: true, grille: false });
    /* les fonds et les flux */
    [].forEach.call(document.querySelectorAll('[data-carto-fond]'), function (f) { var M3 = monde(1911), s = M3.sommets[0]; C.fond(f, f.dataset.cartoFond === 'niveaux' ? { genre: 'niveaux', vue: { cx: s[0], cy: s[1] + .01, k: 11 } } : { genre: f.dataset.cartoFond, pas: f.dataset.cartoFond === 'points' ? 8 : 10, r: 1.3 }); });
    if (par('flux')) C.flux(par('flux'), { lu: par('flux-lu') });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', page); else page();
})();
