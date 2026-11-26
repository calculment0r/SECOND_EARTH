/* KIT ÉTUDE · le canevas infini et sa famille de cartes.
     KitEtude.carte(d)                         fabrique une carte (un élément), d.type parmi KitEtude.cartes.types
     KitEtude.canevas2(el, { cartes, liens, groupes })
   Une carte : { id, type, x, y, w, titre, meta, plus: [[mot, valeur, 'deduit'|'manque']], … selon sa nature }.
   Un lien : { de, a }. Un groupe : { nom, cartes: [id, …] }.
   « depart: [0, 1] » cadre d'abord ces groupes-là plutôt que tout le canevas.
   Chaque changement gardé émet « ke:change » (detail : { cartes, liens, groupes }).
   Les gestes : voir la table de touches en bas du fichier (TOUCHES), reprise dans la page. */
(function () {
  'use strict';
  var KE = window.KitEtude, U = KE.outils, el = U.el, svg = U.svg, seg = U.seg, mix = U.mix, borne = U.borne, tirer = U.tirer;
  var calme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function tous(r, s) { return [].slice.call(r.querySelectorAll(s)); }
  function copie(o) { return JSON.parse(JSON.stringify(o)); }
  function temps(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }

  /* ════ LES CARTES ════ chaque nature rend { avant, milieu, corps } ; le reste (le sur-titre, le titre, la suite, les poignées) est commun */
  function vue(n, attrs) { var a = attrs || {}; a.class = 'cv-vue v' + (n || 1) + (a.class ? ' ' + a.class : ''); return el('span', a); }
  function onde(nb, graine, t) {
    var o = el('div', { class: 'cv-onde', style: '--t:' + t, tabindex: '0', role: 'slider', 'aria-label': 'Position dans le son', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.round(t * 100), 'data-geste': '' }), a = graine || 3, e = .3;
    for (var i = 0; i < nb; i++) { a = (a * 16807) % 2147483647; var x = i / nb, env = .3 + .7 * Math.pow(Math.sin(Math.PI * Math.min(1, x * 1.1)), .7) * (.6 + .4 * Math.sin(x * 17 + graine)); e = mix(e, a / 2147483647, .55); o.appendChild(el('i', { style: '--h:' + borne(env * (.35 + .65 * e), .05, 1).toFixed(3), class: (i + .5) / nb <= t ? 'lu' : null })); }
    return o;
  }
  function plan(graine) {   /* un morceau de carte en traits : des courbes de niveau, une eau, une voie, un point */
    var s = svg('svg', { viewBox: '0 0 320 180', preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': 'true' }), g = graine || 1;
    function courbe(cx, cy, r, k) { var d = ''; for (var i = 0; i <= 24; i++) { var a = i / 24 * Math.PI * 2, rr = r * (1 + .16 * Math.sin(a * 3 + g + k) + .09 * Math.cos(a * 5 - g * 2 + k)); d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr * 1.5).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1); } return d + 'Z'; }
    for (var n = 0; n < 5; n++) s.appendChild(svg('path', { class: 'niveau', d: courbe(210 - g * 7, 62 + g * 4, 16 + n * 15, n * .4) }));
    s.appendChild(svg('path', { class: 'eau', d: 'M-10 ' + (132 + g * 3) + 'C60 ' + (112 - g * 4) + ' 110 ' + (168 - g * 2) + ' 180 138S290 ' + (104 + g * 5) + ' 330 124' }));
    s.appendChild(svg('path', { class: 'voie', d: 'M-10 60L70 78L124 ' + (104 + g) + 'L330 ' + (86 - g * 3) }));
    s.appendChild(svg('path', { class: 'voie deduit', d: 'M124 ' + (104 + g) + 'L150 190' }));
    s.appendChild(svg('circle', { class: 'halo', cx: 124, cy: 104 + g, r: 11 })); s.appendChild(svg('circle', { class: 'point', cx: 124, cy: 104 + g, r: 4 }));
    return el('span', { class: 'cv-plan' }, [s]);
  }
  var TYPES = {
    note: function (d) { return { corps: [el('p', { text: d.texte })] }; },
    citation: function (d) { return { corps: [el('div', { class: 'cv-qui' }, [el('b', { text: d.qui }), el('span', { text: d.ou || '' })])] }; },
    image: function (d) { return { avant: vue(d.vue, { role: 'img', 'aria-label': d.titre }) }; },
    planche: function (d) { return { avant: el('span', { class: 'cv-grille' }, (d.vues || [1, 2, 3, 4, 5, 6]).map(function (v) { return vue(v); })) }; },
    video: function (d) {
      var t = d.t === undefined ? .3 : d.t, tete = el('div', { class: 'cv-tete', style: '--t:' + t, tabindex: '0', role: 'slider', 'aria-label': 'Position dans la vidéo', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.round(t * 100), 'data-geste': '' }, [el('u'), el('b')]);
      var lu = el('b', { text: temps(t * d.duree) });
      tete._ecrit = function (f) { lu.textContent = temps(f * d.duree); };
      return { avant: el('span', {}, [vue(d.vue || 3, { style: 'aspect-ratio:16/9;margin-bottom:8px' }), el('span', { style: 'display:block;margin:0 0 12px' }, [tete])]), corps: [el('div', { class: 'cv-temps' }, [lu, el('span', { text: 'sur ' + temps(d.duree) })])] };
    },
    son: function (d) {
      var t = d.t === undefined ? .3 : d.t, o = onde(64, d.graine || 4, t), lu = el('b', { text: temps(t * d.duree) });
      o._ecrit = function (f) { lu.textContent = temps(f * d.duree); tous(o, 'i').forEach(function (b, i, l) { b.classList.toggle('lu', (i + .5) / l.length <= f); }); };
      return { corps: [o, el('div', { class: 'cv-temps' }, [lu, el('span', { text: 'sur ' + temps(d.duree) })])] };
    },
    personne: function (d) { return { avant: el('span', { class: 'cv-initiale', 'aria-hidden': 'true', text: d.titre.charAt(0) }), corps: [el('p', { text: d.texte })] }; },
    lieu: function (d) { return { avant: plan(d.graine), corps: d.texte ? [el('p', { text: d.texte })] : null }; },
    palette: function (d) {
      var t = d.teintes || [['--bg', 'la nuit'], ['--ink3', 'le quai'], ['--amb', 'la lampe'], ['--or', 'elle'], ['--ink', 'la neige']];
      return { avant: el('span', { class: 'cv-teintes' }, t.map(function (c) { return el('i', { style: '--c:var(' + c[0] + ')' }); })), corps: [el('div', { class: 'cv-noms' }, t.map(function (c) { return el('span', { text: c[1] }); }))] };
    },
    lien: function (d) { return { corps: [el('p', { text: d.texte })] }; },
    liste: function (d) {
      var av = el('div', { class: 'cv-avance', 'aria-hidden': 'true' }, d.points.map(function (p) { return el('i', { class: p[1] ? 'fait' : null }); }));
      var l = el('div', { class: 'cv-points' }, d.points.map(function (p, i) {
        var c = el('input', { type: 'checkbox' }); c.checked = !!p[1];
        c.addEventListener('change', function () { p[1] = c.checked ? 1 : 0; av.children[i].classList.toggle('fait', c.checked); c.dispatchEvent(new CustomEvent('cv:garde', { bubbles: true })); });
        return el('label', { class: 'ke-case' }, [c, el('i'), el('span', { text: p[0] })]);
      }));
      return { corps: [l, av] };
    },
    chiffre: function (d) { return { milieu: el('p', { class: 'cv-nombre' }, [String(d.nombre), d.unite ? el('small', { text: d.unite }) : null]) }; },
    tableau: function (d) {
      return { corps: [el('table', { class: 'cv-table' }, [el('tbody', {}, d.lignes.map(function (l) { return el('tr', { class: l[2] === 'tenu' ? 'tenu' : null }, [el('td', { text: l[0] }), el('td', {}, [l[2] === 'manque' ? el('span', { class: 'ke-manque', text: l[1] }) : l[2] === 'deduit' ? el('span', { class: 'ke-deduit', text: l[1] }) : l[1]])]); }))])] };
    },
    fil: function (d) { return { corps: [el('div', { class: 'cv-voix' }, d.voix.map(function (v) { return el('div', { class: v[2] ? 'toi' : null }, [el('b', { text: v[0] }), el('p', { text: v[1] })]); }))] }; },
    document: function (d) {
      var page = el('div', { class: 'cv-page', 'aria-hidden': 'true' }, [el('i', { class: 't' })]); for (var i = 0; i < 11; i++) page.appendChild(el('i', { class: i % 4 === 3 ? 'c' : null }));
      return { corps: [el('div', { class: 'cv-doc' }, [page, el('ol', { class: 'cv-sommaire' }, d.plan.map(function (p, i) { return el('li', { class: i === d.ici ? 'ici' : null, text: p }); }))])] };
    },
    sequence: function (d) { return { avant: el('span', { class: 'cv-bande' }, (d.vues || [1, 3, 4, 6, 5, 2]).map(function (v, i) { return el('span', { class: i === d.ici ? 'ici' : null }, [vue(v), el('b', { text: String(i + 1) })]); })) }; },
    code: function (d) {
      if (d.formule) return { corps: [el('p', { class: 'cv-formule', text: d.formule })] };
      var pre = el('pre', { class: 'cv-code' }); d.lignes.forEach(function (l, i) { if (i) pre.appendChild(document.createTextNode('\n')); (typeof l === 'string' ? [[l]] : l).forEach(function (m) { pre.appendChild(m[1] ? el(m[1], { text: m[0] }) : document.createTextNode(m[0])); }); });
      return { corps: [pre] };
    },
    manque: function (d) { return { corps: d.texte ? [el('p', { text: d.texte })] : null }; },
    proposee: function (d) {
      return { corps: [d.texte ? el('p', { text: d.texte }) : null, el('div', { class: 'cv-choix' }, [el('button', { type: 'button', class: 'ke-btn', 'data-choix': 'garder', text: 'Garder' }), el('button', { type: 'button', class: 'ke-btn discret', 'data-choix': 'ecarter', text: 'Écarter' })])] };
    }
  };
  var NOMS = { note: 'note', citation: 'citation', image: 'image', planche: 'planche', video: 'vidéo', son: 'son', personne: 'personne', lieu: 'lieu', palette: 'palette', lien: 'lien', liste: 'liste', chiffre: 'chiffre', tableau: 'tableau', fil: 'fil', document: 'document', sequence: 'séquence', code: 'code', manque: 'il manque', proposee: 'proposé' };
  /* ce qu'on pose quand on demande « ajouter » */
  var MODELES = {
    note: { titre: 'Une note', texte: 'Écris ici.' }, citation: { titre: '« Ce qui est dit. »', qui: 'Quelqu’un' }, image: { titre: 'Une image', vue: 1 }, planche: { titre: 'Une planche' }, video: { titre: 'Une vidéo', duree: 90, vue: 3 },
    son: { titre: 'Un son', duree: 140 }, personne: { titre: 'Un nom', meta: 'son rôle', texte: 'Ce qu’on sait d’elle.' }, lieu: { titre: 'Un lieu', graine: 2 }, palette: { titre: 'Une palette' }, lien: { titre: 'Un lien', meta: 'exemple.org', texte: 'Ce qu’on y trouve.' },
    liste: { titre: 'À faire', points: [['Une première chose', 0], ['Une seconde', 0]] }, chiffre: { titre: 'ce que ça compte', nombre: 12 }, tableau: { titre: 'Un tableau', lignes: [['une ligne', '1'], ['une autre', '2']] }, fil: { titre: 'Un fil', voix: [['Toi', 'On en parle ?', 1]] },
    document: { titre: 'Un document', plan: ['Le début', 'Le milieu', 'La fin'], ici: 0 }, sequence: { titre: 'Une séquence', ici: 0 }, code: { titre: 'Une formule', formule: 'a² + b² = c²' }, manque: { titre: 'Qu’est-ce qui manque ici ?' }, proposee: { titre: 'Une proposition', texte: 'À garder, ou à écarter.' }
  };
  KE.cartes = { types: Object.keys(TYPES), noms: NOMS, modeles: MODELES };
  KE.carte = function (d) {
    var r = TYPES[d.type](d), c = el('article', { class: 'cv-carte ' + d.type, tabindex: '0', 'data-id': d.id || null, 'aria-label': NOMS[d.type] + ' : ' + d.titre });
    if (d.w) c.style.setProperty('--w', d.w + 'px'); if (d.h) c.style.minHeight = d.h + 'px';
    if (r.avant) { r.avant.classList.add('cv-avant'); c.appendChild(r.avant); }
    c.appendChild(el('p', { class: 'cv-sur' }, [el('span', { text: NOMS[d.type] + (d.meta ? ' · ' + d.meta : '') }), d.num ? el('b', { text: d.num }) : null]));
    if (r.milieu) c.appendChild(r.milieu);
    c.appendChild(el('h3', { class: 'cv-titre', text: d.titre }));
    if (r.corps) c.appendChild(el('div', { class: 'cv-corps' }, r.corps));
    if (d.plus) c.appendChild(el('div', { class: 'cv-plus' }, [el('dl', {}, [].concat.apply([], d.plus.map(function (p) { return [el('dt', { text: p[0] }), el('dd', { class: p[2] || null, text: p[1] })]; })))]));
    c.appendChild(el('span', { class: 'cv-poignee lien', 'aria-hidden': 'true', 'data-bulle': 'Tire pour relier' })); c.appendChild(el('span', { class: 'cv-poignee taille', 'aria-hidden': 'true' }));
    if (d.etat === 'inerte') c.setAttribute('aria-disabled', 'true'); if (d.etat === 'en-cours') c.setAttribute('aria-busy', 'true');
    /* la tête de lecture et l'onde se règlent dans la carte, à la main et aux flèches */
    tous(c, '.cv-tete, .cv-onde').forEach(function (t) {
      function poser(f) { f = borne(f, 0, 1); t.style.setProperty('--t', f); t.setAttribute('aria-valuenow', Math.round(f * 100)); d.t = f; if (t._ecrit) t._ecrit(f); }
      function lire(e) { var b = t.getBoundingClientRect(); return (e.clientX - b.left) / b.width; }
      tirer(t, function (e) { e.stopPropagation(); t.focus({ preventScroll: true }); poser(lire(e)); return {}; }, function (e) { poser(lire(e)); });
      t.addEventListener('keydown', function (e) { var k = e.key === 'ArrowRight' ? .02 : e.key === 'ArrowLeft' ? -.02 : 0; if (!k) return; e.preventDefault(); e.stopPropagation(); poser((d.t === undefined ? .3 : d.t) + k); });
    });
    return c;
  };

  /* ════ LE CANEVAS ════ */
  var HAUTEURS = [['les traits', .24], ['les titres', .37], ['les cartes', .8], ['le détail', 1.9]], KMIN = .05, KMAX = 8;
  KE.canevas2 = function (root, donnees) {
    if (root._ke) return root._ke;
    var S = { cartes: copie(donnees.cartes || []), liens: copie(donnees.liens || []), groupes: copie(donnees.groupes || []) };
    var vue = { x: 0, y: 0, k: 1 }, C = {}, choix = [], lienChoisi = null, attente = null, tenuLien = null, modeCadre = false, anim = 0, pile = [], rang = -1, serie = 0, OFF = {}, t3vu = -1, titresK = -1, titresSale = true, enCours = null;
    root.classList.add('ke-canevas2'); root.tabIndex = 0; root.setAttribute('role', 'application'); if (!root.getAttribute('aria-label')) root.setAttribute('aria-label', 'Canevas');
    var monde = el('div', { class: 'cv-monde' }), fils = svg('svg', { class: 'cv-liens' }), dit = el('div', { class: 'cv-dit', 'aria-live': 'polite' }, [el('small'), el('p')]);
    var rail = el('div', { class: 'ke-rail', role: 'group', 'aria-label': 'Hauteur' }, HAUTEURS.map(function (h, i) { return el('button', { type: 'button', 'data-h': i }, [h[0], el('i')]); }));
    var mini = el('div', { class: 'cv-mini', tabindex: '0', role: 'img', 'aria-label': 'Mini-carte : clique pour y aller' }), zoomDit = el('output', { class: 'cv-zoom' });
    var bAnnuler = el('button', { type: 'button', class: 'ke-btn', 'data-o': 'annuler', text: 'annuler' }), bRefaire = el('button', { type: 'button', class: 'ke-btn', 'data-o': 'refaire', text: 'refaire' }), bCadre = el('button', { type: 'button', class: 'ke-btn', 'data-o': 'cadre', 'aria-pressed': 'false', text: 'cadrer' }), bPlein = el('button', { type: 'button', class: 'ke-btn', 'data-o': 'plein', 'aria-pressed': 'false', text: 'plein écran' });
    var listeAjout = el('ul', { class: 'ke-menu-liste ke-flotte', role: 'menu', hidden: '' }, KE.cartes.types.map(function (t) { return el('li', { role: 'menuitem', tabindex: '-1', 'data-type': t, text: NOMS[t] === 'il manque' ? 'une place vide' : NOMS[t] === 'proposé' ? 'une proposition' : NOMS[t] }); }));
    var bAjout = el('button', { type: 'button', class: 'ke-btn', 'aria-haspopup': 'menu', 'aria-expanded': 'false', text: 'ajouter' });
    var outils = el('div', { class: 'cv-outils' }, [el('button', { type: 'button', class: 'ke-btn', 'data-o': 'tout', text: 'tout voir' }), bAnnuler, bRefaire, bCadre, el('div', { class: 'ke-menu' }, [bAjout, listeAjout]), bPlein]);
    var barre = el('div', { class: 'cv-attente ke-flotte', hidden: '' }, [el('span'), el('button', { type: 'button', class: 'ke-btn', 'data-a': 'revenir', text: 'Revenir' }), el('button', { type: 'button', class: 'ke-btn plein', 'data-a': 'garder', text: 'Garder' })]);
    monde.appendChild(fils); [monde, outils, rail, mini, zoomDit, dit, barre].forEach(function (n) { root.appendChild(n); });

    function parler(a, b) { dit.firstChild.textContent = a; dit.lastChild.textContent = b; }
    function repos() { parler(['De très loin', 'De loin', 'À hauteur de carte', 'De près'][niveau()], ['Un trait par carte, sous le nom de son groupe.', 'Les traits sont devenus des titres.', 'Prends une carte, tire-la, relie-la.', 'La carte s’ouvre : d’où elle vient, ce qu’on en sait.'][niveau()]); }
    function niveau() { return vue.k < .285 ? 0 : vue.k < .45 ? 1 : vue.k < 1.4 ? 2 : 3; }
    function dire(d) { var t = d.titre; return /^«/.test(t) ? t : '« ' + t + ' »'; }
    function carte(id) { for (var i = 0; i < S.cartes.length; i++) if (S.cartes[i].id === id) return S.cartes[i]; }
    function boite(d) { var e = C[d.id]; return { x: d.x, y: d.y + (OFF[d.id] || 0), w: e.offsetWidth, h: e.offsetHeight }; }
    function versMonde(e) { var r = root.getBoundingClientRect(); return [(e.clientX - r.left - vue.x) / vue.k, (e.clientY - r.top - vue.y) / vue.k]; }

    /* ── dessiner ── */
    function rendre() {
      tous(monde, '.cv-carte, .cv-groupe').forEach(function (n) { n.remove(); }); C = {};
      S.groupes.forEach(function (g) { g._el = el('p', { class: 'cv-groupe', text: g.nom, 'aria-hidden': 'true' }); g._el._g = g; monde.insertBefore(g._el, fils); });
      S.cartes.forEach(function (d) { var c = KE.carte(d); C[d.id] = c; monde.appendChild(c); }); t3vu = -1; titresSale = true; ecarter(); S.cartes.forEach(placer);
      choix = choix.filter(function (id) { return C[id]; }); marquerChoix(); tracer();
    }
    function placer(d) { var c = C[d.id]; c.style.transform = 'translate(' + d.x + 'px,' + (d.y + (OFF[d.id] || 0)) + 'px)'; if (d.w) c.style.setProperty('--w', d.w + 'px'); c.style.minHeight = d.h ? d.h + 'px' : ''; titresSale = true; }
    /* la carte ouverte pousse les voisines du dessous (assez pour garder l'écart d'origine) ; à la fermeture, elles reviennent */
    function ecarter() {
      var t3 = seg(vue.k, 1.25, 1.65); if (Math.abs(t3 - t3vu) < .002) return false; t3vu = t3;
      var M = {}; S.cartes.forEach(function (d) { var c = C[d.id]; if (!c) return; var p = c.querySelector('.cv-plus'); M[d.id] = { w: c.offsetWidth, h: c.offsetHeight, p: p ? p.offsetHeight * t3 : 0 }; });
      var l = S.cartes.filter(function (d) { return M[d.id]; }).sort(function (a, b) { return a.y - b.y; }), vu = [];
      l.forEach(function (b) {
        var mb = M[b.id], o = 0;
        vu.forEach(function (a) { var ma = M[a.id], gN = b.y - (a.y + ma.h); if (gN < 0 || a.x >= b.x + mb.w || a.x + ma.w <= b.x) return; o = Math.max(o, (OFF[a.id] || 0) + ma.p - Math.max(0, gN - 24)); });
        OFF[b.id] = Math.round(Math.max(0, o)); vu.push(b);
      });
      return true;
    }
    /* à hauteur des titres : deux titres qui se recouvrent s'écartent ; le plus bas descend sous l'autre */
    function titres() {
      var k = vue.k, t1 = seg(k, .26, .31), t2 = seg(k, .40, .50), actif = t1 > 0 && t2 < 1;
      if (!actif) { if (titresK >= 0) { tous(monde, '.cv-titre').forEach(function (t) { t.style.removeProperty('--dy'); }); titresK = -1; } return; }
      if (k === titresK && !titresSale) return; titresK = k; titresSale = false;
      var kt = 1 + (Math.max(1, 12.5 / (24 * k)) - 1) * (1 - t2), marge = 5 / k, pris = [];
      var l = S.cartes.map(function (d) { var t = C[d.id] && C[d.id].querySelector('.cv-titre'); return t ? { t: t, x: d.x + t.offsetLeft, y: d.y + (OFF[d.id] || 0) + t.offsetTop, w: t.offsetWidth * kt, h: t.offsetHeight * kt } : null; }).filter(Boolean).sort(function (a, b) { return a.y - b.y; });
      l.forEach(function (a) {
        var y = a.y, n = 0, bouge = true;
        while (bouge && n++ < 40) { bouge = false; pris.forEach(function (b) { if (a.x < b.x + b.w && a.x + a.w > b.x && y < b.y + b.h + marge && y + a.h + marge > b.y) { y = b.y + b.h + marge; bouge = true; } }); }
        a.t.style.setProperty('--dy', (y - a.y).toFixed(1) + 'px'); a.y = y; pris.push(a);
      });
    }
    function bornesGroupe(g) {
      var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      g.cartes.forEach(function (id) { var d = carte(id); if (!d) return; var b = boite(d); x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h); });
      return { x: x0 - 40, y: y0 - 40, w: x1 - x0 + 80, h: y1 - y0 + 80 };
    }
    function bord(b, o) {   /* le point d'attache d'un lien : le milieu du côté qui regarde l'autre carte */
      var cx = b.x + b.w / 2, cy = b.y + b.h / 2, ox = o.x + o.w / 2, oy = o.y + o.h / 2, dx = ox - cx, dy = oy - cy;
      if (Math.abs(dx) * b.h > Math.abs(dy) * b.w) return dx > 0 ? [b.x + b.w, cy, 1, 0] : [b.x, cy, -1, 0];
      return dy > 0 ? [cx, b.y + b.h, 0, 1] : [cx, b.y, 0, -1];
    }
    function chemin(a, b) { var t = Math.max(40, Math.hypot(b[0] - a[0], b[1] - a[1]) * .4); return 'M' + a[0] + ' ' + a[1] + 'C' + (a[0] + a[2] * t) + ' ' + (a[1] + a[3] * t) + ' ' + (b[0] + b[2] * t) + ' ' + (b[1] + b[3] * t) + ' ' + b[0] + ' ' + b[1]; }
    function tracer() {
      tous(fils, '.cv-lien:not(.fantome), .cv-lien-prise, .cv-bout').forEach(function (n) { n.remove(); });
      var liens = S.liens.slice(); if (attente && attente.type === 'lien') liens.push({ de: attente.de, a: attente.a, _attente: true });
      liens.forEach(function (l) {
        var A = carte(l.de), B = carte(l.a); if (!A || !B) return;
        var ba = boite(A), bb = boite(B), a = bord(ba, bb), b = bord(bb, ba), d = chemin(a, b), vif = choix.indexOf(l.de) >= 0 || choix.indexOf(l.a) >= 0;
        var cl = l._attente ? ' attente' : l === lienChoisi ? ' choisi' : vif ? ' vif' : '';
        fils.appendChild(svg('path', { class: 'cv-lien' + cl, d: d }));
        var bout = svg('circle', { class: 'cv-bout' + cl, cx: b[0], cy: b[1], r: 3 }); bout.style.r = 'calc(3.5px * var(--ik))'; fils.appendChild(bout);
        if (l._attente) return;
        var prise = svg('path', { class: 'cv-lien-prise', d: d, tabindex: '0', role: 'button', 'aria-label': 'Lien de ' + dire(A) + ' vers ' + dire(B) + '' });
        prise._lien = l; fils.appendChild(prise);
      });
      S.groupes.forEach(function (g) { if (!g._el) return; var b = bornesGroupe(g); g._b = b; if (!isFinite(b.x)) { g._el.hidden = true; return; } g._el.hidden = false; g._el.style.left = b.x + 'px'; g._el.style.top = (b.y - 10) + 'px'; });
      /* deux noms de groupe ne se chevauchent pas : chacun se tient avant le nom suivant sur sa ligne */
      S.groupes.forEach(function (g) { if (!g._el || g._el.hidden) return; var b = g._b, place = Infinity; S.groupes.forEach(function (o) { if (o === g || !o._b || !isFinite(o._b.x) || o._el.hidden) return; if (o._b.x > b.x + 1 && Math.abs(o._b.y - b.y) < 220) place = Math.min(place, o._b.x - b.x - 40); }); g._el.style.setProperty('--kmax', isFinite(place) ? (place / Math.max(1, g._el.offsetWidth)).toFixed(3) : 9); });
      titres(); peindreMini();
    }
    function peindreVue() {
      var k = vue.k, t2 = seg(k, .40, .50);
      monde.style.transform = 'translate(' + vue.x + 'px,' + vue.y + 'px) scale(' + k + ')';
      root.style.setProperty('--k', k); root.style.setProperty('--ik', 1 / k); root.style.setProperty('--t1', seg(k, .26, .31).toFixed(3)); root.style.setProperty('--t2', t2.toFixed(3)); root.style.setProperty('--t3', seg(k, 1.25, 1.65).toFixed(3));
      root.style.setProperty('--kt', (1 + (Math.max(1, 12.5 / (24 * k)) - 1) * (1 - t2)).toFixed(3)); root.style.setProperty('--kg', borne(60 / (200 * k), 1, 1.4).toFixed(3));
      var nv = niveau(); [].forEach.call(rail.children, function (b, i) { b.classList.toggle('ici', i === nv); b.setAttribute('aria-current', i === nv ? 'true' : 'false'); });
      root.dataset.hauteur = nv; zoomDit.textContent = Math.round(k * 100) + ' %';
      tous(monde, '.cv-plus').forEach(function (p) { p.style.pointerEvents = k > 1.45 ? 'auto' : 'none'; });
      if (ecarter()) { S.cartes.forEach(placer); tracer(); } else titres();
      peindreMini(); if (!choix.length && !attente && !tenuLien) repos();
    }
    function etendue() { var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; S.cartes.forEach(function (d) { var b = boite(d); x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y - 20); x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h); }); S.groupes.forEach(function (g) { if (g._b && isFinite(g._b.y)) y0 = Math.min(y0, g._b.y - 190); }); return isFinite(x0) ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : { x: 0, y: 0, w: 100, h: 100 }; }
    function peindreMini() {
      var r = root.getBoundingClientRect(), e = etendue(), v = { x: -vue.x / vue.k, y: -vue.y / vue.k, w: r.width / vue.k, h: r.height / vue.k };
      var x0 = Math.min(e.x, v.x), y0 = Math.min(e.y, v.y), x1 = Math.max(e.x + e.w, v.x + v.w), y1 = Math.max(e.y + e.h, v.y + v.h), s = Math.min(190 / (x1 - x0), 118 / (y1 - y0)), ox = (190 - (x1 - x0) * s) / 2, oy = (118 - (y1 - y0) * s) / 2;
      mini._g = { x0: x0, y0: y0, s: s, ox: ox, oy: oy }; while (mini.firstChild) mini.removeChild(mini.firstChild);
      S.cartes.forEach(function (d) { var b = boite(d); mini.appendChild(el('i', { class: choix.indexOf(d.id) >= 0 ? 'choisie' : null, style: 'left:' + (ox + (b.x - x0) * s) + 'px;top:' + (oy + (b.y - y0) * s) + 'px;width:' + b.w * s + 'px;height:' + b.h * s + 'px' })); });
      mini.appendChild(el('b', { style: 'left:' + (ox + (v.x - x0) * s) + 'px;top:' + (oy + (v.y - y0) * s) + 'px;width:' + v.w * s + 'px;height:' + v.h * s + 'px' }));
    }

    /* ── la vue : zoom ancré, bonds, tout voir ── */
    function zoomer(nk, cx, cy) { var r = root.getBoundingClientRect(), x = cx === undefined ? r.width / 2 : cx - r.left, y = cy === undefined ? r.height / 2 : cy - r.top; nk = borne(nk, KMIN, KMAX); var q = nk / vue.k; vue.x = x - (x - vue.x) * q; vue.y = y - (y - vue.y) * q; vue.k = nk; peindreVue(); }
    function aller(but) {
      cancelAnimationFrame(anim); if (calme) { vue = but; peindreVue(); return; }
      var a = { x: vue.x, y: vue.y, k: vue.k }, r = root.getBoundingClientRect(), t0 = 0, cx = r.width / 2, cy = r.height / 2;
      var wa = [(cx - a.x) / a.k, (cy - a.y) / a.k], wb = [(cx - but.x) / but.k, (cy - but.y) / but.k];   /* on interpole le point visé et l'échelle, pas la translation : le bond reste droit */
      function pas(ts) { if (!t0) t0 = ts; var t = seg((ts - t0) / 380, 0, 1), k = Math.exp(mix(Math.log(a.k), Math.log(but.k), t)), wx = mix(wa[0], wb[0], t), wy = mix(wa[1], wb[1], t); vue = { k: k, x: cx - wx * k, y: cy - wy * k }; peindreVue(); if (t < 1) anim = requestAnimationFrame(pas); }
      anim = requestAnimationFrame(pas);
    }
    /* la zone libre : l'écran moins les outils en haut, le rail et la mini-carte à droite, la phrase en bas. Tout cadrage s'y tient. */
    function zone() { var r = root.getBoundingClientRect(), z = { x0: 34, y0: 74, x1: r.width - 262, y1: r.height - 118 }; z.cx = (z.x0 + z.x1) / 2; z.cy = (z.y0 + z.y1) / 2; z.w = z.x1 - z.x0; z.h = z.y1 - z.y0; return z; }
    function cadrer(b, kmax, kmin) { var z = zone(), k = borne(Math.min(z.w / b.w, z.h / b.h), kmin || KMIN, kmax || 1); return { k: k, x: z.cx - (b.x + b.w / 2) * k, y: z.y0 + Math.max(0, (z.h - b.h * k) / 2) - b.y * k }; }
    function toutVoir() { aller(cadrer(etendue(), 1)); }
    function hauteur(i) {
      var k = HAUTEURS[i][1], z = zone(), d = choix.length ? carte(choix[0]) : null;
      if (i === 0) { aller(cadrer(etendue(), .25)); return; }   /* de très loin : tout le canevas, ses groupes lus par leur nom */
      if (d) { var b = boite(d); aller({ k: k, x: z.cx - (b.x + b.w / 2) * k, y: z.cy - (b.y + b.h / 2) * k }); }
      else { var cx = (z.cx - vue.x) / vue.k, cy = (z.cy - vue.y) / vue.k; aller({ k: k, x: z.cx - cx * k, y: z.cy - cy * k }); }
    }
    function yAller(d) { var b = boite(d), z = zone(), k = vue.k < .75 ? 1 : vue.k < 1.5 ? 1.9 : 1, p = C[d.id].querySelector('.cv-plus'), h = b.h + (k > 1.5 && p ? p.offsetHeight : 0); aller({ k: k, x: z.cx - (b.x + b.w / 2) * k, y: Math.max(z.y0 - b.y * k, z.cy - (b.y + h / 2) * k) }); }

    /* ── choisir ── */
    function marquerChoix() {
      Object.keys(C).forEach(function (id) { C[id].classList.toggle('choisie', choix.indexOf(id) >= 0); });
      tous(fils, '.cv-lien-prise').forEach(function (p) { var l = p._lien, i = [].indexOf.call(fils.children, p), tr = fils.children[i - 2], bo = fils.children[i - 1], vif = choix.indexOf(l.de) >= 0 || choix.indexOf(l.a) >= 0; [tr, bo].forEach(function (n) { n.classList.toggle('vif', vif && l !== lienChoisi); n.classList.toggle('choisi', l === lienChoisi); }); });
      peindreMini();
    }
    function choisir(ids, garderLien) {
      choix = ids; if (!garderLien) lienChoisi = null; marquerChoix();
      if (choix.length === 1) { var d = carte(choix[0]), n = S.liens.filter(function (l) { return l.de === d.id || l.a === d.id; }).length, g = S.groupes.filter(function (x) { return x.cartes.indexOf(d.id) >= 0; })[0]; parler((g ? g.nom + ' · ' : '') + NOMS[d.type], dire(d) + '' + (n ? ', ' + n + (n > 1 ? ' liens.' : ' lien.') : ', sans lien.')); }
      else if (choix.length > 1) parler('Plusieurs cartes', choix.length + ' cartes tenues ensemble. Elles se déplacent d’un seul geste.');
      else if (!lienChoisi) repos();
    }

    /* ── l'historique : annuler, refaire ── */
    function etat() { return JSON.stringify({ cartes: S.cartes, liens: S.liens, groupes: S.groupes.map(function (g) { return { nom: g.nom, cartes: g.cartes }; }) }); }
    function garder(quoi) { pile = pile.slice(0, rang + 1); pile.push(etat()); rang = pile.length - 1; boutons(); if (quoi !== false) root.dispatchEvent(new CustomEvent('ke:change', { bubbles: true, detail: JSON.parse(pile[rang]) })); }
    function remonter(pas) { if (attente) resoudre(false); var r = rang + pas; if (r < 0 || r >= pile.length) return; rang = r; var e = JSON.parse(pile[rang]); S.cartes = e.cartes; S.liens = e.liens; S.groupes = e.groupes; lienChoisi = null; rendre(); boutons(); parler(pas < 0 ? 'Annulé' : 'Refait', pas < 0 ? 'Le canevas est revenu un geste en arrière.' : 'Le geste est rejoué.'); root.dispatchEvent(new CustomEvent('ke:change', { bubbles: true, detail: e })); }
    function boutons() { bAnnuler.setAttribute('aria-disabled', rang <= 0 ? 'true' : 'false'); bRefaire.setAttribute('aria-disabled', rang >= pile.length - 1 ? 'true' : 'false'); }

    /* ── l'attente : posé, pas encore gardé. Garder (Entrée) ou Revenir (Échap) ── */
    function attendre(a, phrase) { attente = a; barre.firstChild.textContent = phrase; barre.hidden = false; parler('En attente', phrase + ' Entrée garde, Échap revient.'); tracer(); }
    function resoudre(oui) {
      var a = attente; if (!a) return; attente = null; barre.hidden = true;
      if (a.type === 'lien') { if (oui) { S.liens.push({ de: a.de, a: a.a }); garder(); parler('Relié', dire(carte(a.de)) + ' mène à ' + dire(carte(a.a)) + '.'); } else parler('Revenu', 'Le lien n’a pas été gardé.'); tracer(); marquerChoix(); }
      else if (a.type === 'groupe') {
        a.ids.forEach(function (id) { C[id].classList.remove('attente'); });
        if (oui) { S.groupes.forEach(function (g) { g.cartes = g.cartes.filter(function (id) { return a.ids.indexOf(id) < 0; }); }); a.groupe.cartes = a.groupe.cartes.concat(a.ids); garder(); tracer(); parler('Gardé', (a.ids.length > 1 ? a.ids.length + ' cartes sont' : dire(carte(a.ids[0])) + ' est') + ' dans « ' + a.groupe.nom + ' ».'); }
        else { ressort(a.ids, a.avant); parler('Revenu', 'Rien n’a changé de groupe.'); }
      }
    }
    function ressort(ids, avant) {   /* le petit ressort du retour */
      var de = ids.map(function (id) { var d = carte(id); return [d.x, d.y]; }), t0 = 0;
      function poser(t) { ids.forEach(function (id, i) { var d = carte(id); d.x = mix(de[i][0], avant[i][0], t); d.y = mix(de[i][1], avant[i][1], t); placer(d); }); tracer(); }
      if (calme) { poser(1); return; }
      (function pas(ts) { if (!t0) t0 = ts; var t = Math.min(1, (ts - t0) / 260), e = 1 - Math.pow(1 - t, 3) * Math.cos(t * 4.2); poser(e); if (t < 1) requestAnimationFrame(pas); else poser(1); })(performance.now());
    }

    /* ── les gestes de la main ── */
    var guides = [];
    function oterGuides() { guides.forEach(function (g) { g.remove(); }); guides = []; }
    function guide(sens, v) { var g = el('div', { class: 'cv-guide ' + sens, style: (sens === 'v' ? 'left:' : 'top:') + (v * vue.k + (sens === 'v' ? vue.x : vue.y)) + 'px' }); root.appendChild(g); guides.push(g); }
    function sousPointeur(e, sel) { var n = document.elementFromPoint(e.clientX, e.clientY); return n && n.closest ? n.closest(sel) : null; }
    /* pincer à deux doigts : le zoom suit l'écart des doigts, le canevas suit leur milieu ; le geste d'un doigt en cours s'efface */
    var doigts = {}, pince = null;
    function nbDoigts() { return Object.keys(doigts).length; }
    function milieu() { var p = Object.keys(doigts).map(function (i) { return doigts[i]; }); return { x: (p[0][0] + p[1][0]) / 2, y: (p[0][1] + p[1][1]) / 2, d: Math.max(8, Math.hypot(p[0][0] - p[1][0], p[0][1] - p[1][1])) }; }
    root.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'touch') return; doigts[e.pointerId] = [e.clientX, e.clientY];
      if (nbDoigts() !== 2) return;
      e.stopImmediatePropagation(); e.preventDefault(); cancelAnimationFrame(anim);
      if (enCours) enCours.pince = true; defaire(enCours);
      var m = milieu(), r = root.getBoundingClientRect(); pince = { d: m.d, k: vue.k, w: [(m.x - r.left - vue.x) / vue.k, (m.y - r.top - vue.y) / vue.k] };
      parler('Pincer', 'Écarte les doigts pour approcher, rapproche-les pour t’éloigner.');
    }, true);
    root.addEventListener('pointermove', function (e) {
      if (!doigts[e.pointerId]) return; doigts[e.pointerId] = [e.clientX, e.clientY]; if (!pince || nbDoigts() < 2) return;
      e.stopImmediatePropagation(); var m = milieu(), r = root.getBoundingClientRect(), k = borne(pince.k * m.d / pince.d, KMIN, KMAX);
      vue = { k: k, x: m.x - r.left - pince.w[0] * k, y: m.y - r.top - pince.w[1] * k }; peindreVue();
    }, true);
    function lever(e) { if (!doigts[e.pointerId]) return; delete doigts[e.pointerId]; if (pince && nbDoigts() < 2) { pince = null; e.stopImmediatePropagation(); } }
    root.addEventListener('pointerup', lever, true); root.addEventListener('pointercancel', lever, true);
    function defaire(c) {   /* un geste commencé à un doigt, interrompu par le second */
      root.classList.remove('glisse'); oterGuides(); if (!c) return;
      if (c.ombre) c.ombre.remove(); if (c.b) c.b.remove(); if (c.f) c.f.remove(); if (c.p) c.p.classList.remove('tenue');
      if (c.type === 'lien') finLien();
      if (c.type === 'carte') { choix.forEach(function (id) { if (C[id]) C[id].classList.remove('tenue'); }); S.groupes.forEach(function (g) { if (g._el) g._el.classList.remove('cible', 'visee'); g._b0 = null; }); if (c.bouge) { choix.forEach(function (id, i) { var d = carte(id); d.x = c.avant[i][0]; d.y = c.avant[i][1]; placer(d); }); tracer(); } }
    }
    tirer(root, function (e) {
      var t = e.target; enCours = null;
      if (pince || t.closest('.cv-outils, .ke-rail, .cv-mini, .cv-attente, .ke-menu-liste, [contenteditable="true"]')) return false;
      var ctx = debutGeste(e, t); enCours = ctx || null; return ctx;
    }, function (e, c) { if (!c.pince) bougeGeste(e, c); }, function (e, c) { enCours = null; if (c.pince) return; finGeste(e, c); });
    function debutGeste(e, t) {
      fermerMenu();
      cancelAnimationFrame(anim); if (attente) resoudre(false);
      var c = t.closest('.cv-carte'), p = t.closest('.cv-poignee'), prise = t.closest('.cv-lien-prise');
      if (prise) { lienChoisi = prise._lien; choisir([], true); prise.focus({ preventScroll: true }); parler('Lien tenu', prise.getAttribute('aria-label') + '. Suppr le retire.'); return false; }
      if (c && c.getAttribute('aria-disabled') === 'true') { c.focus({ preventScroll: true }); choisir([c.dataset.id]); return false; }
      if (c && !p && t.closest('button, input, label, a, [data-geste]')) { if (choix.indexOf(c.dataset.id) < 0) choisir([c.dataset.id]); return false; }
      if (p && p.classList.contains('lien')) {
        var de = c.dataset.id; choisir([de]); p.classList.add('tenue'); debutLien(de);
        var f = svg('path', { class: 'cv-lien fantome' }); fils.appendChild(f); return { type: 'lien', de: de, f: f, p: p };
      }
      if (p) { var d0 = carte(c.dataset.id); choisir([d0.id]); p.classList.add('tenue'); C[d0.id].style.minHeight = ''; var h0 = C[d0.id].offsetHeight; placer(d0); return { type: 'taille', d: d0, x: e.clientX, y: e.clientY, w: C[d0.id].offsetWidth, h: C[d0.id].offsetHeight, h0: h0, p: p }; }
      if (c) {
        var id = c.dataset.id; c.focus({ preventScroll: true });
        if (e.shiftKey) { choisir(choix.indexOf(id) >= 0 ? choix.filter(function (x) { return x !== id; }) : choix.concat(id)); return false; }
        if (choix.indexOf(id) < 0) choisir([id]);
        return { type: 'carte', id: id, x: e.clientX, y: e.clientY, avant: choix.map(function (i) { var d = carte(i); return [d.x, d.y]; }), bouge: false, vx: 0, vy: 0, t: e.timeStamp };
      }
      root.focus({ preventScroll: true });
      if (modeCadre || e.shiftKey) { var r = root.getBoundingClientRect(), b = el('div', { class: 'cv-cadre' }); root.appendChild(b); return { type: 'cadre', x: e.clientX - r.left, y: e.clientY - r.top, b: b }; }
      root.classList.add('glisse'); return { type: 'fond', x: e.clientX, y: e.clientY, vx: vue.x, vy: vue.y, bouge: false };
    }
    function bougeGeste(e, c) {
      if (c.type === 'fond') { c.bouge = true; vue.x = c.vx + e.clientX - c.x; vue.y = c.vy + e.clientY - c.y; peindreVue(); }
      else if (c.type === 'cadre') {
        var r = root.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, bx = Math.min(x, c.x), by = Math.min(y, c.y), bw = Math.abs(x - c.x), bh = Math.abs(y - c.y);
        c.b.style.cssText = 'left:' + bx + 'px;top:' + by + 'px;width:' + bw + 'px;height:' + bh + 'px';
        var m = { x: (bx - vue.x) / vue.k, y: (by - vue.y) / vue.k, w: bw / vue.k, h: bh / vue.k };
        choisir(S.cartes.filter(function (d) { var b = boite(d); return b.x < m.x + m.w && b.x + b.w > m.x && b.y < m.y + m.h && b.y + b.h > m.y; }).map(function (d) { return d.id; }));
      }
      else if (c.type === 'taille') { c.d.w = Math.round(borne(c.w + (e.clientX - c.x) / vue.k, 200, 760)); var nh = Math.round(borne(c.h + (e.clientY - c.y) / vue.k, 60, 1600)); if (nh > c.h0 + 2 || c.d.h) c.d.h = nh; placer(c.d); if (C[c.d.id].offsetHeight > nh + 2) { delete c.d.h; placer(c.d); } t3vu = -1; if (ecarter()) S.cartes.forEach(placer); tracer(); parler('Taille', dire(c.d) + ' : ' + c.d.w + ' × ' + C[c.d.id].offsetHeight + ' px.'); }
      else if (c.type === 'lien') {
        var cible = sousPointeur(e, '.cv-carte.cible'), w = versMonde(e), A = boite(carte(c.de));
        tous(monde, '.cv-carte.visee').forEach(function (n) { n.classList.remove('visee'); });
        var fin = [w[0], w[1], 0, 0]; if (cible) { cible.classList.add('visee'); var B = boite(carte(cible.dataset.id)); fin = bord(B, A); parler('Lâcher ici relierait', dire(carte(c.de)) + ' à ' + dire(carte(cible.dataset.id)) + '.'); }
        var dep = bord(A, { x: fin[0], y: fin[1], w: 0, h: 0 }); c.f.classList.toggle('pret', !!cible); c.f.setAttribute('d', chemin(dep, fin)); c.fin = fin; c.dep = dep;
      }
      else if (c.type === 'carte') {
        var dx = (e.clientX - c.x) / vue.k, dy = (e.clientY - c.y) / vue.k; if (!c.bouge && Math.hypot(e.clientX - c.x, e.clientY - c.y) < 4) return;
        if (!c.bouge) { c.bouge = true; choix.forEach(function (id) { C[id].classList.add('tenue'); }); }
        /* les guides : seulement pendant le geste, sur les bords et les milieux des autres cartes */
        var d = carte(c.id), i0 = choix.indexOf(c.id), b = boite(d), nx = c.avant[i0][0] + dx, ny = c.avant[i0][1] + dy, seuil = 7 / vue.k, mx = null, my = null, gx = null, gy = null;
        oterGuides();
        S.cartes.forEach(function (o) {
          if (choix.indexOf(o.id) >= 0) return; var ob = boite(o);
          [[ob.x, 0], [ob.x + ob.w / 2, b.w / 2], [ob.x + ob.w, b.w], [ob.x, b.w], [ob.x + ob.w, 0]].forEach(function (p) { var v = p[0] - p[1]; if (Math.abs(v - nx) < seuil && (mx === null || Math.abs(v - nx) < Math.abs(mx - nx))) { mx = v; gx = p[0]; } });
          [[ob.y, 0], [ob.y + ob.h / 2, b.h / 2], [ob.y + ob.h, b.h], [ob.y, b.h], [ob.y + ob.h, 0]].forEach(function (p) { var v = p[0] - p[1]; if (Math.abs(v - ny) < seuil && (my === null || Math.abs(v - ny) < Math.abs(my - ny))) { my = v; gy = p[0]; } });
        });
        if (mx !== null) { dx += mx - nx; guide('v', gx); } if (my !== null) { dy += my - ny; guide('h', gy); } c.colle = mx !== null || my !== null;
        var dt = Math.max(1, e.timeStamp - c.t); c.vx = mix(c.vx, (dx - (c.dx || 0)) / dt, .5); c.vy = mix(c.vy, (dy - (c.dy || 0)) / dt, .5); c.t = e.timeStamp; c.dx = dx; c.dy = dy;
        choix.forEach(function (id, i) { var o = carte(id); o.x = Math.round(c.avant[i][0] + dx); o.y = Math.round(c.avant[i][1] + dy); placer(o); });
        tracer();
        /* un autre groupe sous le pointeur : il s'allume ; lâcher là, c'est proposer d'y entrer */
        var w2 = versMonde(e), vise = null;
        S.groupes.forEach(function (g) { var dedans = g.cartes.indexOf(c.id) >= 0, gb = g._b0 || (g._b0 = g._b); g._el.classList.toggle('cible', !dedans); var sur = !dedans && w2[0] > gb.x && w2[0] < gb.x + gb.w && w2[1] > gb.y - 160 && w2[1] < gb.y + gb.h; g._el.classList.toggle('visee', sur); if (sur) vise = g; });
        c.groupe = vise; if (vise) parler('Lâcher ici', dire(d) + ' passerait dans « ' + vise.nom + ' ».'); else parler('Tenue', dire(d) + '. Le départ reste marqué.');
        if (!c.ombre) { c.ombre = el('div', { class: 'cv-carte depart', style: 'transform:translate(' + c.avant[i0][0] + 'px,' + c.avant[i0][1] + 'px);--w:' + b.w + 'px;height:' + b.h + 'px;pointer-events:none;opacity:.5', 'aria-hidden': 'true' }); monde.insertBefore(c.ombre, fils.nextSibling); }
      }
    }
    function finGeste(e, c) {
      root.classList.remove('glisse'); oterGuides();
      if (c.type === 'fond') { if (!c.bouge) { lienChoisi = null; choisir([]); } }
      else if (c.type === 'cadre') { c.b.remove(); }
      else if (c.type === 'taille') { c.p.classList.remove('tenue'); garder(); }
      else if (c.type === 'lien') {
        c.p.classList.remove('tenue'); var v = monde.querySelector('.cv-carte.visee'), de = c.de; finLien();
        if (v) { c.f.remove(); proposerLien(de, v.dataset.id); }
        else if (c.fin && !calme) { var t0 = 0, f = c.f, fin = c.fin, dep = c.dep; (function pas(ts) { if (!t0) t0 = ts; var t = Math.min(1, (ts - t0) / 200); f.setAttribute('d', chemin(dep, [mix(fin[0], dep[0], t), mix(fin[1], dep[1], t), 0, 0])); if (t < 1) requestAnimationFrame(pas); else f.remove(); })(performance.now()); parler('Revenu', 'Lâché hors de toute carte : aucun lien.'); }
        else { c.f.remove(); }
      }
      else if (c.type === 'carte') {
        choix.forEach(function (id) { C[id].classList.remove('tenue'); }); if (c.ombre) c.ombre.remove();
        S.groupes.forEach(function (g) { g._el.classList.remove('cible', 'visee'); g._b0 = null; });
        if (!c.bouge) return;
        if (c.groupe) { choix.forEach(function (id) { C[id].classList.add('attente'); }); attendre({ type: 'groupe', ids: choix.slice(), avant: c.avant, groupe: c.groupe }, (choix.length > 1 ? choix.length + ' cartes passeraient' : dire(carte(c.id)) + ' passerait') + ' dans « ' + c.groupe.nom + ' ».'); return; }
        var v2 = Math.hypot(c.vx, c.vy);
        if (!calme && !c.colle && v2 > .25 && e.timeStamp - c.t < 60) {   /* une inertie légère : la carte glisse encore un peu */
          var ids = choix.slice(), de2 = ids.map(function (id) { var d = carte(id); return [d.x, d.y]; }), gx = borne(c.vx * 90, -160, 160), gy = borne(c.vy * 90, -160, 160), t1 = 0;
          (function pas(ts) { if (!t1) t1 = ts; var t = Math.min(1, (ts - t1) / 240), q = 1 - Math.pow(1 - t, 3); ids.forEach(function (id, i) { var d = carte(id); if (!d) return; d.x = Math.round(de2[i][0] + gx * q); d.y = Math.round(de2[i][1] + gy * q); placer(d); }); tracer(); if (t < 1) requestAnimationFrame(pas); else garder(); })(performance.now());
        } else garder();
        choisir(choix);
      }
    }
    function debutLien(de) { tenuLien = de; Object.keys(C).forEach(function (id) { C[id].classList.toggle('depart', id === de); C[id].classList.toggle('cible', id !== de && C[id].getAttribute('aria-disabled') !== 'true'); }); parler('Lien tenu depuis ' + dire(carte(de)) + '', 'Les autres cartes peuvent le recevoir. Lâche sur l’une d’elles ; au clavier, Tab puis Entrée. Échap revient.'); }
    function finLien() { tenuLien = null; tous(monde, '.cv-carte').forEach(function (n) { n.classList.remove('depart', 'cible', 'visee'); }); }
    function proposerLien(de, a) {
      if (S.liens.some(function (l) { return (l.de === de && l.a === a) || (l.de === a && l.a === de); })) { parler('Déjà relié', dire(carte(de)) + ' et ' + dire(carte(a)) + ' le sont déjà.'); return; }
      attendre({ type: 'lien', de: de, a: a }, 'Relier ' + dire(carte(de)) + ' à ' + dire(carte(a)) + ' ?');
    }
    root.addEventListener('dblclick', function (e) {   /* le pointeur est capturé par le canevas : on regarde ce qui est vraiment sous lui */
      var n = document.elementFromPoint(e.clientX, e.clientY) || e.target; if (!root.contains(n)) return; var gn = n.closest('.cv-groupe'); if (gn && gn._g) { e.preventDefault(); renommer(gn._g); return; } var c = n.closest('.cv-carte'); if (c && !n.closest('button, input, label, [data-geste]')) yAller(carte(c.dataset.id)); });
    function molette(e) { if (!(e.ctrlKey || e.metaKey || root.classList.contains('plein'))) return; e.preventDefault(); cancelAnimationFrame(anim); zoomer(vue.k * Math.pow(.9982, e.deltaY), e.clientX, e.clientY); }
    root.addEventListener('wheel', molette, { passive: false });

    /* ── la carte proposée, les cases d'une liste ── */
    monde.addEventListener('click', function (e) {
      var b = e.target.closest('[data-choix]'); if (!b) return; var c = b.closest('.cv-carte'), d = carte(c.dataset.id);
      if (b.dataset.choix === 'garder') { d.type = 'note'; d.texte = d.texte || ''; rendre(); garder(); choisir([d.id]); C[d.id].focus({ preventScroll: true }); parler('Gardée', dire(d) + ' est maintenant une note du canevas.'); }
      else retirer([d.id], 'Écartée');
    });
    monde.addEventListener('cv:garde', function () { garder(); });
    monde.addEventListener('focusin', function (e) {
      var c = e.target.closest('.cv-carte'), p = e.target.closest('.cv-lien-prise');
      if (p) { if (lienChoisi !== p._lien) { lienChoisi = p._lien; choisir([], true); parler('Lien tenu', p.getAttribute('aria-label') + '. Suppr le retire.'); } return; }
      if (!c || e.target !== c) return;
      if (tenuLien) { tous(monde, '.cv-carte.visee').forEach(function (n) { n.classList.remove('visee'); }); if (c.classList.contains('cible')) { c.classList.add('visee'); parler('Entrée relierait', dire(carte(tenuLien)) + ' à ' + dire(carte(c.dataset.id)) + '.'); } return; }
      if (choix.indexOf(c.dataset.id) < 0) choisir([c.dataset.id]);
    });

    /* ── retirer, dupliquer, ajouter ── */
    function retirer(ids, mot) { if (!ids.length) return; var nom = ids.length === 1 ? dire(carte(ids[0])) + '' : ids.length + ' cartes'; S.cartes = S.cartes.filter(function (d) { return ids.indexOf(d.id) < 0; }); S.liens = S.liens.filter(function (l) { return ids.indexOf(l.de) < 0 && ids.indexOf(l.a) < 0; }); S.groupes.forEach(function (g) { g.cartes = g.cartes.filter(function (id) { return ids.indexOf(id) < 0; }); }); choix = []; rendre(); garder(); root.focus({ preventScroll: true }); parler(mot || 'Retiré', nom + (ids.length > 1 ? ' ont' : ' a') + ' quitté le canevas. Ctrl Z ' + (ids.length > 1 ? 'les' : 'la') + ' ramène.'); }
    function neuf() { return 'c' + Date.now().toString(36) + (serie++); }
    function dupliquer(ids) { var n = ids.map(function (id) { var d = copie(carte(id)); d.id = neuf(); d.x += 36; d.y += 36; S.cartes.push(d); S.groupes.forEach(function (g) { if (g.cartes.indexOf(id) >= 0) g.cartes.push(d.id); }); return d.id; }); rendre(); garder(); choisir(n); if (C[n[0]]) C[n[0]].focus({ preventScroll: true }); }
    function ajouter(type, ou) { var r = root.getBoundingClientRect(), d = copie(MODELES[type]); d.id = neuf(); d.type = type; d.w = 300; d.x = Math.round(ou ? ou[0] : (r.width / 2 - vue.x) / vue.k - 150); d.y = Math.round(ou ? ou[1] : (r.height / 2 - vue.y) / vue.k - 80); S.cartes.push(d); rendre(); garder(); choisir([d.id]); C[d.id].focus({ preventScroll: true }); if (vue.k < .5) yAller(d); }

    /* ── les groupes : en faire un des cartes tenues, le renommer (double-clic sur son nom) ── */
    function grouper(ids) {
      if (!ids.length) return; S.groupes.forEach(function (g) { g.cartes = g.cartes.filter(function (id) { return ids.indexOf(id) < 0; }); });
      var g = { nom: 'Un groupe', cartes: ids.slice() }; S.groupes.push(g); rendre(); garder(); renommer(g);
    }
    function renommer(g) {
      var n = g._el; if (!n || n.isContentEditable) return; var avant = g.nom, fini = false;
      n.contentEditable = 'true'; n.classList.add('nomme'); n.removeAttribute('aria-hidden'); n.setAttribute('role', 'textbox'); n.setAttribute('aria-label', 'Nom du groupe'); n.spellcheck = false;
      parler('Renommer', 'Écris le nom du groupe. Entrée garde, Échap revient.');
      var z = zone(), kg = parseFloat(getComputedStyle(root).getPropertyValue('--kg')) || 1, haut = vue.y + (g._b.y - 10 - 185 * kg) * vue.k;   /* le nom à écrire doit se voir */
      if (haut < z.y0 || haut > z.y1 - 60) { cancelAnimationFrame(anim); vue.y += z.y0 + 10 - haut; peindreVue(); }
      var sel = window.getSelection(), rg = document.createRange(); n.focus({ preventScroll: true }); rg.selectNodeContents(n); sel.removeAllRanges(); sel.addRange(rg);
      function finir(oui) {
        if (fini) return; fini = true; n.removeEventListener('keydown', touche); n.removeEventListener('blur', quitter);
        var nom = n.textContent.replace(/\s+/g, ' ').trim(); n.contentEditable = 'false'; n.removeAttribute('contenteditable'); n.classList.remove('nomme'); n.setAttribute('aria-hidden', 'true'); n.removeAttribute('role'); n.removeAttribute('aria-label');
        if (oui && nom && nom !== avant) { g.nom = nom; n.textContent = nom; garder(); parler('Renommé', '« ' + avant + ' » s’appelle maintenant « ' + nom + ' ».'); }
        else { n.textContent = avant; parler('Revenu', 'Le groupe garde son nom.'); }
        tracer(); root.focus({ preventScroll: true });
      }
      function touche(e) { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); finir(true); } else if (e.key === 'Escape') { e.preventDefault(); finir(false); } }
      function quitter() { finir(true); }
      n.addEventListener('keydown', touche); n.addEventListener('blur', quitter);
    }
    function groupeDe(id) { return S.groupes.filter(function (g) { return g.cartes.indexOf(id) >= 0; })[0]; }

    /* ── le menu contextuel (celui du kit) ── */
    var menu = null;
    function fermerMenu() { if (menu) { menu.remove(); menu = null; } if (!listeAjout.hidden) { listeAjout.hidden = true; bAjout.setAttribute('aria-expanded', 'false'); } }
    function ouvrirMenu(x, y, entrees) {
      fermerMenu(); var r = root.getBoundingClientRect();
      menu = el('ul', { class: 'ke-menu-liste ke-flotte', role: 'menu' }, entrees.map(function (en) { return en ? el('li', { role: 'menuitem', tabindex: '-1', 'aria-disabled': en[2] ? 'true' : null }, [en[0], en[3] ? el('kbd', { text: en[3] }) : null]) : el('li', { class: 'filet', role: 'separator' }); }));
      root.appendChild(menu); menu.style.left = borne(x - r.left, 8, r.width - menu.offsetWidth - 8) + 'px'; menu.style.top = borne(y - r.top, 8, r.height - menu.offsetHeight - 8) + 'px';
      var actifs = tous(menu, '[role="menuitem"]:not([aria-disabled])'), faire = entrees.filter(function (en) { return en && !en[2]; });
      actifs.forEach(function (li, i) { li.addEventListener('click', function () { fermerMenu(); faire[i][1](); }); });
      menu.addEventListener('keydown', function (e) { var i = actifs.indexOf(document.activeElement); e.stopPropagation(); if (e.key === 'ArrowDown') actifs[(i + 1) % actifs.length].focus(); else if (e.key === 'ArrowUp') actifs[(i - 1 + actifs.length) % actifs.length].focus(); else if (e.key === 'Enter' || e.key === ' ') { if (i >= 0) actifs[i].click(); } else if (e.key === 'Escape' || e.key === 'Tab') { fermerMenu(); root.focus({ preventScroll: true }); } else return; e.preventDefault(); });
      menu.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
      if (actifs[0]) actifs[0].focus({ preventScroll: true });
    }
    function menuDe(c, x, y) {
      if (c) { var d = carte(c.dataset.id); if (choix.indexOf(d.id) < 0) choisir([d.id]); var ids = choix.slice();
        var gd = groupeDe(d.id);
        ouvrirMenu(x, y, [['Y aller', function () { yAller(d); }, 0, 'Entrée'], ['Relier à…', function () { debutLien(d.id); C[d.id].focus({ preventScroll: true }); }, 0, 'L'], ['Dupliquer', function () { dupliquer(ids); }, 0, 'Ctrl D'], null, [ids.length > 1 ? 'Faire un groupe des ' + ids.length + ' cartes' : 'Faire un groupe de cette carte', function () { grouper(ids); }, 0, 'G'], ['Renommer « ' + (gd ? gd.nom : '') + ' »', function () { renommer(gd); }, !gd], null, ['Retirer', function () { retirer(ids); }, 0, 'Suppr']]); }
      else { var r = root.getBoundingClientRect(), w = [(x - r.left - vue.x) / vue.k, (y - r.top - vue.y) / vue.k], gs = g0;
        ouvrirMenu(x, y, (gs ? [['Renommer « ' + gs.nom + ' »', function () { renommer(gs); }], null] : []).concat([['Une note ici', function () { ajouter('note', w); }], ['Une place vide ici', function () { ajouter('manque', w); }], null, ['Tout voir', toutVoir, 0, '0'], ['Annuler', function () { remonter(-1); }, rang <= 0, 'Ctrl Z']])); }
    }
    var g0 = null;
    root.addEventListener('contextmenu', function (e) { if (e.target.closest('.cv-outils, .ke-rail, .cv-mini, .cv-attente, [contenteditable="true"]')) return; e.preventDefault(); var gn = e.target.closest('.cv-groupe'); g0 = gn && gn._g || null; menuDe(e.target.closest('.cv-carte'), e.clientX, e.clientY); g0 = null; });

    /* ── le clavier : le même geste que la main ── */
    root.addEventListener('keydown', function (e) {
      var c = e.target.closest && e.target.closest('.cv-carte'), surCarte = c && e.target === c, mod = e.ctrlKey || e.metaKey, k = e.key;
      if (e.target.closest && (e.target.closest('[contenteditable="true"]') || (k !== 'Escape' && (e.target.closest('input, [data-geste]') || (e.target.closest('.cv-outils') && !mod))))) return;
      if (k === 'Escape') { if (menu || !listeAjout.hidden) fermerMenu(); else if (attente) resoudre(false); else if (tenuLien) { var d0 = tenuLien; finLien(); C[d0].focus({ preventScroll: true }); parler('Revenu', 'Le lien n’a pas été tiré.'); } else if (choix.length || lienChoisi) { lienChoisi = null; choisir([]); root.focus({ preventScroll: true }); } else if (root.classList.contains('plein')) plein(false); else return; e.preventDefault(); return; }
      if (attente && k === 'Enter') { e.preventDefault(); resoudre(true); return; }
      if (mod && (k === 'z' || k === 'Z')) { e.preventDefault(); remonter(e.shiftKey ? 1 : -1); return; }
      if (mod && (k === 'y' || k === 'Y')) { e.preventDefault(); remonter(1); return; }
      if (mod && (k === 'a' || k === 'A')) { e.preventDefault(); choisir(S.cartes.map(function (d) { return d.id; })); return; }
      if (mod && (k === 'd' || k === 'D')) { e.preventDefault(); if (choix.length) dupliquer(choix.slice()); return; }
      if (mod) return;
      if ((k === 'Delete' || k === 'Backspace')) { if (lienChoisi) { var l = lienChoisi; S.liens.splice(S.liens.indexOf(l), 1); lienChoisi = null; tracer(); garder(); root.focus({ preventScroll: true }); parler('Lien retiré', 'Ctrl Z le ramène.'); e.preventDefault(); } else if (choix.length && (surCarte || e.target === root)) { retirer(choix.slice()); e.preventDefault(); } return; }
      if (k === 'ContextMenu' || (k === 'F10' && e.shiftKey)) { e.preventDefault(); var b = (c || root).getBoundingClientRect(); menuDe(c, b.left + 30, b.top + 30); return; }
      if (surCarte) {
        var id = c.dataset.id, d = carte(id);
        if (k === 'Enter') { e.preventDefault(); if (tenuLien && c.classList.contains('cible')) { var de = tenuLien; finLien(); proposerLien(de, id); } else if (!tenuLien) yAller(d); return; }
        if (k === 'g' || k === 'G') { e.preventDefault(); grouper(choix.indexOf(id) >= 0 ? choix.slice() : [id]); return; }
        if ((k === 'l' || k === 'L') && c.getAttribute('aria-disabled') !== 'true') { e.preventDefault(); if (tenuLien) { finLien(); choisir([id]); } else debutLien(id); return; }
        var p = e.shiftKey ? 1 : 12, dx = k === 'ArrowRight' ? p : k === 'ArrowLeft' ? -p : 0, dy = k === 'ArrowDown' ? p : k === 'ArrowUp' ? -p : 0;
        if ((dx || dy) && c.getAttribute('aria-disabled') !== 'true') { e.preventDefault(); if (choix.indexOf(id) < 0) choisir([id]); choix.forEach(function (i) { var o = carte(i); o.x += dx; o.y += dy; placer(o); }); tracer(); clearTimeout(root._g); root._g = setTimeout(garder, 400); return; }
      }
      if (/^[1-4]$/.test(k)) { e.preventDefault(); hauteur(+k - 1); return; }
      if (k === '+' || k === '=') { e.preventDefault(); zoomer(vue.k * 1.25); return; } if (k === '-') { e.preventDefault(); zoomer(vue.k / 1.25); return; }
      if (k === '0') { e.preventDefault(); toutVoir(); return; }
      if (k === 'f' || k === 'F') { e.preventDefault(); plein(!root.classList.contains('plein')); return; }
      if (e.target === root) { var q = 70; if (k === 'ArrowLeft') vue.x += q; else if (k === 'ArrowRight') vue.x -= q; else if (k === 'ArrowUp') vue.y += q; else if (k === 'ArrowDown') vue.y -= q; else return; e.preventDefault(); peindreVue(); }
    });

    /* ── les outils en mots, le rail, la mini-carte, l'attente ── */
    function plein(oui) { root.classList.toggle('plein', oui); bPlein.setAttribute('aria-pressed', String(oui)); bPlein.textContent = oui ? 'sortir du plein écran' : 'plein écran'; document.documentElement.style.overflow = oui ? 'hidden' : ''; peindreVue(); parler(oui ? 'Plein écran' : 'Dans la page', oui ? 'La molette seule zoome. Échap en sort.' : 'Ctrl + molette zoome ; la molette seule fait défiler la page.'); if (oui) root.focus({ preventScroll: true }); }
    outils.addEventListener('click', function (e) {
      var li = e.target.closest('[data-type]'); if (li) { fermerMenu(); ajouter(li.dataset.type); return; }
      if (e.target === bAjout) { var ouvert = listeAjout.hidden; fermerMenu(); if (ouvert) { listeAjout.hidden = false; bAjout.setAttribute('aria-expanded', 'true'); listeAjout.firstChild.focus({ preventScroll: true }); } return; }
      var b = e.target.closest('[data-o]'); if (!b || b.getAttribute('aria-disabled') === 'true') return; var o = b.dataset.o;
      if (o === 'tout') toutVoir(); else if (o === 'annuler') remonter(-1); else if (o === 'refaire') remonter(1); else if (o === 'plein') plein(!root.classList.contains('plein'));
      else if (o === 'cadre') { modeCadre = !modeCadre; bCadre.setAttribute('aria-pressed', String(modeCadre)); root.classList.toggle('cadre', modeCadre); parler(modeCadre ? 'Cadrer' : 'Glisser', modeCadre ? 'Tire sur le fond : tout ce que le cadre touche est tenu.' : 'Tire sur le fond : le canevas glisse. Maj + tirer cadre aussi.'); }
    });
    listeAjout.addEventListener('keydown', function (e) { var it = tous(listeAjout, 'li'), i = it.indexOf(document.activeElement); e.stopPropagation(); if (e.key === 'ArrowDown') it[(i + 1) % it.length].focus(); else if (e.key === 'ArrowUp') it[(i - 1 + it.length) % it.length].focus(); else if (e.key === 'Enter' || e.key === ' ') { fermerMenu(); ajouter(it[i].dataset.type); } else if (e.key === 'Escape') { fermerMenu(); bAjout.focus(); } else return; e.preventDefault(); });
    rail.addEventListener('click', function (e) { var b = e.target.closest('[data-h]'); if (b) hauteur(+b.dataset.h); });
    barre.addEventListener('click', function (e) { var b = e.target.closest('[data-a]'); if (b) { resoudre(b.dataset.a === 'garder'); root.focus({ preventScroll: true }); } });
    function allerMini(e) { var g = mini._g, b = mini.getBoundingClientRect(), r = root.getBoundingClientRect(), wx = (e.clientX - b.left - g.ox) / g.s + g.x0, wy = (e.clientY - b.top - g.oy) / g.s + g.y0; vue.x = r.width / 2 - wx * vue.k; vue.y = r.height / 2 - wy * vue.k; peindreVue(); }
    tirer(mini, function (e) { cancelAnimationFrame(anim); allerMini(e); return {}; }, allerMini);
    mini.addEventListener('keydown', function (e) { var q = 90; if (e.key === 'ArrowLeft') vue.x += q; else if (e.key === 'ArrowRight') vue.x -= q; else if (e.key === 'ArrowUp') vue.y += q; else if (e.key === 'ArrowDown') vue.y -= q; else return; e.preventDefault(); e.stopPropagation(); peindreVue(); });

    /* ── le départ ── */
    /* le départ : un groupe en largeur, assez près pour lire les cartes (autour de 70 %), le haut du groupe sous les outils */
    function depart() {
      var e = etendue(), b = null; (donnees.depart || []).forEach(function (i) { var g = S.groupes[i] && S.groupes[i]._b; if (!g) return; b = b ? { x: Math.min(b.x, g.x), y: Math.min(b.y, g.y), w: Math.max(b.x + b.w, g.x + g.w) - Math.min(b.x, g.x), h: Math.max(b.y + b.h, g.y + g.h) - Math.min(b.y, g.y) } : { x: g.x, y: g.y, w: g.w, h: g.h }; });
      if (!b) { vue = cadrer(e, .8, .44); peindreVue(); return; }
      var z = zone(), k = borne(z.w / b.w, .6, .72); vue = { k: k, x: z.cx - (b.x + b.w / 2) * k, y: z.y0 + 30 - b.y * k }; peindreVue();
    }
    function pret() { rendre(); depart(); }
    pret(); garder(false);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { tracer(); if (rang === 0) depart(); });
    window.addEventListener('resize', peindreVue);
    return (root._ke = { toutVoir: toutVoir, hauteur: hauteur, zoomer: zoomer, ajouter: ajouter, annuler: function () { remonter(-1); }, refaire: function () { remonter(1); }, plein: plein, choisir: function (ids) { choisir(ids); }, poser: function (v) { cancelAnimationFrame(anim); vue = v; peindreVue(); }, vue: function () { return { x: vue.x, y: vue.y, k: vue.k }; }, etat: function () { return JSON.parse(etat()); } });
  };

  /* la table des gestes, pour la page et pour qui reprend le kit */
  KE.canevas2.TOUCHES = [
    ['tirer le fond', 'le canevas glisse', 'flèches'], ['Ctrl + molette, pincer à deux doigts', 'zoom sous le pointeur, ou entre les doigts (la molette seule en plein écran)', '+  −'], ['le rail à droite', 'un bond d’une hauteur à l’autre', '1  2  3  4'],
    ['« tout voir »', 'tout le canevas dans l’écran', '0'], ['tirer une carte', 'elle suit, les guides apparaissent, le départ reste marqué', 'flèches (Maj : 1 px)'], ['lâcher sur un autre groupe', 'la carte y attend : Garder ou Revenir', 'Entrée, Échap'],
    ['tirer le rond à droite', 'un lien vers une autre carte, qui attend : Garder ou Revenir', 'L, Tab, Entrée'], ['tirer le carré en bas', 'la largeur et la hauteur de la carte', ''], ['double-clic', 'y aller, puis l’ouvrir', 'Entrée'],
    ['Maj + clic', 'ajouter une carte à ce qu’on tient', 'Ctrl A : tout'], ['« cadrer », ou Maj + tirer', 'le cadre de sélection', ''], ['clic droit', 'le menu de la carte ou du fond', 'Maj F10'],
    ['', 'dupliquer · retirer', 'Ctrl D · Suppr'], ['clic droit, « faire un groupe »', 'un groupe des cartes tenues, à nommer', 'G'], ['double-clic sur le nom d’un groupe', 'le renommer', 'Entrée garde, Échap revient'], ['« annuler », « refaire »', 'un geste en arrière, en avant', 'Ctrl Z · Ctrl Maj Z'], ['« plein écran »', 'le canevas prend tout l’écran', 'F · Échap']];
})();
