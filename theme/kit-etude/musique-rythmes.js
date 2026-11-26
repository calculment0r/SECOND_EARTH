/* KIT ÉTUDE · LA BOÎTE À RYTHMES (id « rythmes »), à la manière de la TR-808 : onze voix synthétisées, onze rangées de seize pas,
   deux forces par pas (posé, accentué), quatre motifs qu'on enchaîne. Elle suit l'horloge commune (KitEtude.son.horloge).
   À la main : un clic pose un pas, un second l'accentue, un troisième l'ôte (Maj + clic : accent tout de suite) ; on glisse pour en poser plusieurs.
   Au clavier : les flèches parcourent la grille, Espace pose / accentue / ôte. Les jetons du kit, aucun fichier son. */
(function () {
  'use strict';
  var KE = window.KitEtude, S = KE.son, M = KE.musique; if (!M) return;
  var el = M.el, svg = M.svg, H = S.horloge;
  var V = M.percus;   /* les voix : musique-percus.js, communes aux trois instruments */

  var VOIX = [
    { id: 'gc', nom: 'Grosse caisse', regs: [['ton', 46], ['chute', 42]], joue: function (c, d, t, v, r) { return V.grosse(c, d, t, v, r); } },
    { id: 'cc', nom: 'Caisse claire', regs: [['ton', 50], ['claquant', 58]], joue: function (c, d, t, v, r) { return V.claire(c, d, t, v, r); } },
    { id: 'tg', nom: 'Tom grave', regs: [['ton', 50], ['chute', 45]], joue: function (c, d, t, v, r) { r.base = 82; return V.tom(c, d, t, v, r); } },
    { id: 'tm', nom: 'Tom médium', regs: [['ton', 50], ['chute', 40]], joue: function (c, d, t, v, r) { r.base = 124; return V.tom(c, d, t, v, r); } },
    { id: 'ta', nom: 'Tom aigu', regs: [['ton', 50], ['chute', 35]], joue: function (c, d, t, v, r) { r.base = 176; return V.tom(c, d, t, v, r); } },
    { id: 'bc', nom: 'Bord de caisse', regs: [['ton', 50]], joue: function (c, d, t, v, r) { return V.bord(c, d, t, v, r); } },
    { id: 'ma', nom: 'Mains', regs: [['chute', 40]], joue: function (c, d, t, v, r) { return V.mains(c, d, t, v, r); } },
    { id: 'cl', nom: 'Cloche', regs: [['ton', 50]], joue: function (c, d, t, v, r) { return V.cloche(c, d, t, v, r); } },
    { id: 'cy', nom: 'Cymbale', regs: [['ton', 50], ['chute', 45]], joue: function (c, d, t, v, r) { return V.cymbale(c, d, t, v, r); } },
    { id: 'co', nom: 'Charleston ouvert', regs: [['chute', 42]], joue: function (c, d, t, v, r) { r.ouvert = true; return V.charley(c, d, t, v, r); } },
    { id: 'cf', nom: 'Charleston fermé', regs: [['ton', 50]], joue: function (c, d, t, v, r) { return V.charley(c, d, t, v, r); } }
  ];
  /* quatre motifs d'exemple : « . » rien, « x » posé, « X » accentué */
  var EXEMPLES = {
    A: { gc: 'X...x...X...x...', cc: '....X.......X...', bc: '..x....x..x.....', ma: '....x.......x..x', co: '..X...x...X...x.', cf: 'xx.xxx.xxx.xxx.x' },
    B: { gc: 'X...x...X..xx...', cc: '....X.......X.x.', tg: '..............x.', ta: '.............x..', ma: '....X.......X...', cl: 'x..x..x...x..x..', co: '..X...x...X...x.', cf: 'xx.xxx.xxx.xxx.x' },
    C: { gc: 'X.....x...X..x..', cc: '....X.......X...', bc: '.......x.x......', ma: '....x.......x...', cl: '..x...x..x....x.', cy: 'X...............', co: '..............X.', cf: 'x.x.X.x.x.x.X.x.' },
    D: { gc: 'X...x...X...x...', cc: '....X..x.x..XxXX', tg: '..........x...x.', tm: '........x....x..', ta: '......x.....x...', ma: '....x.......x...', cy: 'X...............', cf: 'x.x.x.x.........' }
  };
  var LETTRES = ['A', 'B', 'C', 'D'];

  M.definir('rythmes', {
    nom: 'La boîte à', accent: 'rythmes', sous: 'onze voix, seize pas', maniere: 'de la TR-808',
    geste: 'Un clic pose un pas, un second l’accentue, un troisième l’ôte. On glisse pour en poser plusieurs. Les flèches parcourent la grille, Espace pose. Le carré à gauche d’une rangée frappe la voix.',
    monter: function (corps, voie) {
      var motifs = {}, courant = 'A', attendu = null, chaine = 0, tenue = 0, accent = .6, general = .8, bus = null, robinet = null, regs = {}, rangs = [], tuiles = {}, colonnes = [], nums = [], pasIci = -1;
      LETTRES.forEach(function (L) { motifs[L] = VOIX.map(function (v) { var s = EXEMPLES[L][v.id] || '................'; return s.split('').map(function (ch) { return ch === 'X' ? 2 : ch === 'x' ? 1 : 0; }); }); });
      VOIX.forEach(function (v) { regs[v.id] = { niveau: .8 }; v.regs.forEach(function (r) { regs[v.id][r[0]] = r[1] / 100; }); });
      function sortie() { if (!bus) { var e = voie.ouvrir(); if (!e) return null; bus = S.ctx.createGain(); bus.gain.value = general * .9; bus.connect(e); } return bus; }

      /* ── sonner ── */
      function sonner(i, t, force) {
        var d = sortie(); if (!d) return; var v = VOIX[i], r = {}, k; for (k in regs[v.id]) r[k] = regs[v.id][k];
        var vel = (force === 2 ? .62 + accent * .38 : force === 1 ? .62 : force) * r.niveau;
        if ((v.id === 'cf' || v.id === 'co') && robinet) { robinet(t); robinet = null; }   /* le fermé étouffe l'ouvert ; un ouvert étouffe le précédent */
        var x = v.joue(S.ctx, d, t, vel, r); if (v.id === 'co') robinet = x.etouffe;
      }
      function eclair(i) { var p = rangs[i].pad; p.classList.add('frappe'); setTimeout(function () { p.classList.remove('frappe'); }, 90); }

      /* ── la rangée du haut : les motifs, la voix tenue, les gestes, l'accent ── */
      var ecran = el('div', { class: 'mu-ecran mu-rythmes-ecran', 'aria-live': 'polite' }, [el('span', { class: 'petit', text: 'la voix tenue' }), el('span', { class: 'grand' }), el('span', { class: 'ligne' }), el('span', { class: 'petit' })]);
      var blocMotifs = el('div', { class: 'mu-rythmes-motifs', role: 'group', 'aria-label': 'Les motifs' });
      LETTRES.forEach(function (L) {
        var mini = svg('svg', { viewBox: '0 0 67 32', 'aria-hidden': 'true' }), p1 = svg('path', { class: 'pose' }), p2 = svg('path', { class: 'fort' }), tete = svg('rect', { class: 'tete', y: 0, width: 3, height: 32, x: 0, visibility: 'hidden' }); mini.appendChild(tete); mini.appendChild(p1); mini.appendChild(p2);
        var b = el('button', { type: 'button', class: 'mu-rythmes-motif', 'aria-pressed': 'false', 'aria-label': 'Motif ' + L }, [el('b', { text: L }), mini, el('small')]);
        b.addEventListener('click', function () { choisirMotif(L); });
        tuiles[L] = { b: b, p1: p1, p2: p2, tete: tete, petit: b.lastChild }; blocMotifs.appendChild(b);
      });
      function peindreTuile(L) {
        var a = '', f = '', n = 0; motifs[L].forEach(function (rg, i) { rg.forEach(function (x, s) { if (!x) return; n++; var d = 'M' + (s * 4 + Math.floor(s / 4)) + ' ' + (i * 3) + 'h3v2h-3z'; if (x === 2) f += d; else a += d; }); });
        tuiles[L].p1.setAttribute('d', a); tuiles[L].p2.setAttribute('d', f); tuiles[L].petit.textContent = n ? n + ' pas' : 'vide';
      }
      function peindreTuiles() { LETTRES.forEach(function (L) { var t = tuiles[L]; t.b.setAttribute('aria-pressed', L === courant ? 'true' : 'false'); t.b.classList.toggle('attente', L === attendu); if (L !== courant) t.tete.setAttribute('visibility', 'hidden'); }); }
      function choisirMotif(L) { if (H.joue) { attendu = L === courant ? null : L; peindreTuiles(); } else { courant = L; attendu = null; peindreTuiles(); peindreGrille(); } }
      var enchainer = el('div', { class: 'mu-bascule couchee', 'data-positions': 'un seul|A puis B|les quatre', 'data-valeur': '0', 'aria-label': 'Enchaîner les motifs' });
      enchainer.addEventListener('ke:change', function (e) { chaine = e.detail.valeur; });
      function mot(t, fn, bulle) { var b = el('button', { type: 'button', class: 'ke-btn petit', text: t, 'data-bulle': bulle || null }); b.addEventListener('click', fn); return b; }
      var gestes = el('div', { class: 'mu-rythmes-gestes' }, [
        mot('remplir la voix', function () { var rg = motifs[courant][tenue], n = rg.filter(Boolean).length, pas = n >= 16 ? 0 : n >= 8 ? 1 : n >= 4 ? 2 : 4; rg.forEach(function (_, s) { rg[s] = pas && s % pas === 0 ? (s % 4 === 0 ? 2 : 1) : 0; }); apres(); }, 'Des noires, puis des croches, puis des doubles.'),
        mot('vider la voix', function () { motifs[courant][tenue].fill(0); apres(); }),
        mot('hasard', function () { var dens = [.3, .16, .06, .06, .06, .1, .12, .1, .03, .12, .5]; motifs[courant].forEach(function (rg, i) { rg.forEach(function (_, s) { var p = dens[i] * (i === 0 && s % 4 === 0 ? 3 : i === 1 && s % 8 === 4 ? 6 : 1); rg[s] = Math.random() < p ? (Math.random() < .3 ? 2 : 1) : 0; }); }); apres(); }, 'Un motif tiré au sort, pour partir de quelque chose.'),
        mot('vider le motif', function () { motifs[courant].forEach(function (rg) { rg.fill(0); }); apres(); })]);
      function apres() { peindreGrille(); peindreTuile(courant); dire(); }
      var pAccent = M.potard('accent', { valeur: 60, taille: 'petit', nom: 'Force de l’accent' }, function (x) { accent = x / 100; });
      var pGeneral = M.potard('général', { valeur: 80, taille: 'petit', nom: 'Niveau général de la boîte' }, function (x) { general = x / 100; if (bus) bus.gain.setTargetAtTime(general * .9, S.ctx.currentTime, .02); });
      corps.appendChild(el('div', { class: 'mu-rangee' }, [
        M.bloc('Les motifs', [blocMotifs, enchainer], 'large'),
        M.bloc('La voix', [ecran]),
        M.bloc('Les gestes', [gestes]),
        M.bloc('La force', [M.organes([pAccent, pGeneral])])]));

      /* ── la grille : onze rangées de seize pas ── */
      var grille = el('div', { class: 'mu-rythmes-grille', role: 'grid', 'aria-label': 'La grille des pas' });
      var entete = el('div', { class: 'mu-rythmes-rang entete', 'aria-hidden': 'true' }, [el('span'), el('span', { class: 'mu-rythmes-regs' }), el('span'), el('div', { class: 'mu-pas-nums q16' })]);
      for (var s = 0; s < 16; s++) { var nn = el('span', { text: String(s + 1), style: 'grid-column:' + (s + 1 + Math.floor(s / 4)) }); nums.push(nn); entete.lastChild.appendChild(nn); colonnes.push([]); }
      grille.appendChild(entete);
      var peint = null;
      function poser(i, s, x) { motifs[courant][i][s] = x; peindrePas(i, s); peindreTuile(courant); if (i === tenue) dire(); }
      function suivant(x, maj) { return maj ? (x === 2 ? 0 : 2) : (x + 1) % 3; }
      function peindrePas(i, s) { var b = rangs[i].pas[s], x = motifs[courant][i][s]; b.setAttribute('aria-pressed', x ? 'true' : 'false'); b.classList.toggle('fort', x === 2); b.setAttribute('aria-label', VOIX[i].nom + ', pas ' + (s + 1) + (x === 2 ? ', accentué' : x ? ', posé' : ', vide')); }
      function peindreGrille() { rangs.forEach(function (r, i) { r.pas.forEach(function (_, s) { peindrePas(i, s); }); }); }
      function tenir(i) { tenue = i; rangs.forEach(function (r, k) { r.n.classList.toggle('tenue', k === i); r.nom.setAttribute('aria-pressed', k === i ? 'true' : 'false'); }); dire(); }
      function dire() {
        var v = VOIX[tenue], r = regs[v.id], rg = motifs[courant][tenue], n = rg.filter(Boolean).length, f = rg.filter(function (x) { return x === 2; }).length;
        ecran.children[1].textContent = v.nom; ecran.children[2].textContent = ['niveau ' + Math.round(r.niveau * 100)].concat(v.regs.map(function (g) { return g[0] + ' ' + Math.round(r[g[0]] * 100); })).join(' · ');
        ecran.children[3].textContent = 'motif ' + courant + ' · ' + (n ? n + ' pas' + (f ? ', dont ' + f + ' accentué' + (f > 1 ? 's' : '') : '') : 'aucun pas');
      }
      VOIX.forEach(function (v, i) {
        var nom = el('button', { type: 'button', class: 'mu-rythmes-nom', 'aria-pressed': 'false', text: v.nom }), zone = el('div', { class: 'mu-rythmes-regs' }), pad = el('button', { type: 'button', class: 'mu-pad mu-rythmes-frappe', 'aria-label': 'Frapper : ' + v.nom }), ligne = el('div', { class: 'mu-pas mu-rythmes-pas q16', role: 'row' }), pas = [];
        [['niveau', 80]].concat(v.regs).forEach(function (g) {
          var p = el('div', { class: 'ke-potard petit', 'data-min': 0, 'data-max': 100, 'data-valeur': g[1], 'aria-label': v.nom + ', ' + g[0] });
          KE.potard(p); p.addEventListener('ke:change', function (e) { regs[v.id][g[0]] = e.detail.valeur / 100; tenir(i); }); p.addEventListener('focus', function () { tenir(i); });
          zone.appendChild(el('div', { class: 'mu-rythmes-reg' }, [p, el('span', { text: g[0] })]));
        });
        nom.addEventListener('click', function () { tenir(i); });
        pad.addEventListener('pointerdown', function (e) { e.preventDefault(); pad.focus({ preventScroll: true }); S.ouvrir(); tenir(i); var r = pad.getBoundingClientRect(), dx = (e.clientX - r.left) / r.width - .5, dy = (e.clientY - r.top) / r.height - .5; sonner(i, S.ctx.currentTime + .004, Math.max(.35, 1 - Math.sqrt(dx * dx + dy * dy) * 1.2)); eclair(i); });
        pad.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); S.ouvrir(); tenir(i); sonner(i, S.ctx.currentTime + .004, .8); eclair(i); } });
        for (var s = 0; s < 16; s++) (function (s) {
          var b = el('button', { type: 'button', 'aria-pressed': 'false', tabindex: i === 0 && s === 0 ? '0' : '-1', role: 'gridcell', style: 'grid-column:' + (s + 1 + Math.floor(s / 4)) });
          b.addEventListener('pointerdown', function (e) { e.preventDefault(); b.focus({ preventScroll: true }); if (i !== tenue) tenir(i); peint = suivant(motifs[courant][i][s], e.shiftKey); poser(i, s, peint); });
          b.addEventListener('pointerenter', function (e) { if (peint !== null && e.buttons) poser(i, s, peint); });
          b.addEventListener('focus', function () { if (i !== tenue) tenir(i); });
          b.addEventListener('keydown', function (e) {
            var di = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0, ds = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
            if (di || ds) { var c = rangs[i + di] && rangs[i + di].pas[s + ds]; e.preventDefault(); if (c) { b.tabIndex = -1; c.tabIndex = 0; c.focus(); } }
            else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); poser(i, s, suivant(motifs[courant][i][s], e.shiftKey)); }
          });
          pas.push(b); colonnes[s].push(b); ligne.appendChild(b);
        })(s);
        var n = el('div', { class: 'mu-rythmes-rang', role: 'presentation' }, [nom, zone, pad, ligne]); rangs.push({ n: n, nom: nom, pad: pad, pas: pas }); grille.appendChild(n);
      });
      window.addEventListener('pointerup', function () { peint = null; });
      corps.appendChild(grille);

      /* ── suivre l'horloge ── */
      function montrer(s) {
        if (pasIci >= 0) { colonnes[pasIci].forEach(function (b) { b.classList.remove('ici'); }); nums[pasIci].classList.remove('ici'); }
        pasIci = s; if (s >= 0) { colonnes[s].forEach(function (b) { b.classList.add('ici'); }); nums[s].classList.add('ici'); tuiles[courant].tete.setAttribute('x', s * 4 + Math.floor(s / 4)); tuiles[courant].tete.setAttribute('visibility', 'visible'); } else LETTRES.forEach(function (L) { tuiles[L].tete.setAttribute('visibility', 'hidden'); });
      }
      H.surPas(function (pas, quand) {
        var s = pas % 16, change = null;
        if (s === 0 && pas > 0) { if (attendu) { change = attendu; attendu = null; } else if (chaine === 1) change = courant === 'A' ? 'B' : 'A'; else if (chaine === 2) change = LETTRES[(LETTRES.indexOf(courant) + 1) % 4]; }
        var m = motifs[change || courant], frappes = [];
        m.forEach(function (rg, i) { if (rg[s]) { sonner(i, quand, rg[s]); frappes.push(i); } });
        if (change) courant = change;
        H.aLInstant(quand, function () { if (!H.joue) return; if (change) { peindreTuiles(); peindreGrille(); dire(); } montrer(s); frappes.forEach(eclair); });
      });
      document.addEventListener('ke:horloge', function (e) { if (!e.detail.joue) { montrer(-1); if (attendu) { courant = attendu; attendu = null; peindreGrille(); } peindreTuiles(); } });

      M.bascule(enchainer); LETTRES.forEach(peindreTuile); peindreTuiles(); peindreGrille(); tenir(0);
      return { arreter: function () {} };
    }
  });
})();
