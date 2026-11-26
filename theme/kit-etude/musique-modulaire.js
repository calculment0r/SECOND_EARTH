/* KIT ÉTUDE · LE MODULAIRE — un rack de modules qu'on relie par des câbles (à la manière de l'Eurorack).
   Chaque câble refait le graphe audio pour de bon : la sortie d'un module entre dans un autre, comme son (elle s'entend) ou comme modulation
   (elle fait bouger un réglage). Une hauteur vaut un volt par octave ; une « porte » est un ordre (ouvre, ferme) et ne se branche que sur une porte.
   À la main : tirer d'une prise à une autre. Au clavier : Entrée sur une prise la tient, Entrée sur une prise allumée branche, Échap revient,
   Suppr retire le câble choisi (Tab s'arrête sur chaque câble). Une entrée ne reçoit qu'un câble ; une sortie en nourrit autant qu'on veut. */
(function () {
  'use strict';
  var KE = window.KitEtude, M = KE.musique, S = KE.son, el = M.el, svg = M.svg, tirer = KE.outils.tirer;
  function borne(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function expo(v, a, b) { return a * Math.pow(b / a, v / 100); }
  var FORMES = ['sawtooth', 'square', 'triangle', 'sine'], NOMS_FORMES = 'scie|carré|triangle|sinus';

  /* la façade de chaque module : [id, nom, sous-titre, largeur, potards [id, étiquette, min, max, valeur, options], entrées [id, nom, type], sorties] */
  var MODULES = [
    { id: 'seq', nom: 'Séquenceur', sous: 'huit pas', l: 3.1, pots: [['porte', 'porte', 5, 100, 55, { unite: '%' }]], ins: [], outs: [['hauteur', 'hauteur', 'cv'], ['porte', 'porte', 'porte']] },
    { id: 'oscA', nom: 'Oscillateur', sous: 'le premier', l: 1.5, forme: 0, pots: [['accord', 'accord', -24, 24, 0, { centre: true }], ['fin', 'fin', -50, 50, 0, { centre: true }], ['mod', 'modulation', 0, 100, 0]], ins: [['hauteur', 'hauteur', 'cv'], ['mod', 'mod', 'cv']], outs: [['son', 'son', 'son']] },
    { id: 'oscB', nom: 'Oscillateur', sous: 'le second', l: 1.5, forme: 1, pots: [['accord', 'accord', -24, 24, -12, { centre: true }], ['fin', 'fin', -50, 50, 7, { centre: true }], ['mod', 'modulation', 0, 100, 8]], ins: [['hauteur', 'hauteur', 'cv'], ['mod', 'mod', 'cv']], outs: [['son', 'son', 'son']] },
    { id: 'bruit', nom: 'Bruit', sous: 'du souffle', l: .9, pots: [['couleur', 'couleur', 0, 100, 70]], ins: [], outs: [['son', 'son', 'son']] },
    { id: 'mel', nom: 'Mélangeur', sous: 'trois voies', l: 1.5, pots: [['n1', 'un', 0, 100, 70], ['n2', 'deux', 0, 100, 55], ['n3', 'trois', 0, 100, 40]], ins: [['e1', 'un', 'son'], ['e2', 'deux', 'son'], ['e3', 'trois', 'son']], outs: [['son', 'son', 'son']] },
    { id: 'filtre', nom: 'Filtre', sous: 'passe-bas', l: 1.5, pots: [['coupure', 'coupure', 0, 100, 34], ['reso', 'résonance', 0, 100, 58], ['mod', 'modulation', 0, 100, 62]], ins: [['son', 'son', 'son'], ['mod', 'mod', 'cv']], outs: [['son', 'son', 'son']] },
    { id: 'env', nom: 'Enveloppe', sous: 'quatre temps', l: 1.6, pots: [['a', 'attaque', 0, 100, 2], ['d', 'chute', 0, 100, 34], ['s', 'tenue', 0, 100, 18], ['r', 'relâche', 0, 100, 30]], ins: [['porte', 'porte', 'porte']], outs: [['cv', 'sortie', 'cv']] },
    { id: 'lent', nom: 'Lent', sous: 'il ondule', l: 1.2, forme: 2, pots: [['vitesse', 'vitesse', 0, 100, 28]], ins: [], outs: [['cv', 'sortie', 'cv']] },
    { id: 'ampli', nom: 'Ampli', sous: 'il ouvre', l: 1.2, pots: [['niveau', 'niveau', 0, 100, 0], ['mod', 'modulation', 0, 100, 100]], ins: [['son', 'son', 'son'], ['mod', 'mod', 'cv']], outs: [['son', 'son', 'son']] },
    { id: 'sortie', nom: 'Sortie', sous: 'ce qu’on entend', l: 1.4, pots: [['volume', 'volume', 0, 100, 70]], ins: [['son', 'son', 'son']], outs: [] }];
  var EXEMPLE = [['seq.hauteur', 'oscA.hauteur'], ['seq.hauteur', 'oscB.hauteur'], ['oscA.son', 'mel.e1'], ['oscB.son', 'mel.e2'], ['mel.son', 'filtre.son'], ['seq.porte', 'env.porte'], ['env.cv', 'filtre.mod'], ['env.cv', 'ampli.mod'], ['filtre.son', 'ampli.son'], ['ampli.son', 'sortie.son'], ['lent.cv', 'oscB.mod']];
  var NOTES_EXEMPLE = [0, 0, 12, 0, 7, 0, 10, 3], ACTIFS_EXEMPLE = [1, 1, 1, 0, 1, 1, 1, 1];

  M.definir('modulaire', {
    nom: 'Le', accent: 'modulaire', sous: 'des modules, et des câbles qui pendent', maniere: 'de l’Eurorack',
    geste: 'Tire un câble d’une sortie à une entrée : il rebranche le son pour de bon. « Lire » fait tourner le séquenceur. Suppr retire le câble choisi.',
    monter: function (corps, voie) {
      var P = {}, forme = {}, prises = {}, cables = [], A = null, tenu = null, choisi = null, notes = NOTES_EXEMPLE.slice(), actifs = ACTIFS_EXEMPLE.slice(), division = 2, scope = null, portesClavier = 0;
      MODULES.forEach(function (m) { P[m.id] = {}; m.pots.forEach(function (p) { P[m.id][p[0]] = p[4]; }); if (m.forme !== undefined) forme[m.id] = m.forme; });

      /* ── le son : les modules existent dès le premier geste ; ils ne s'entendent que si un chemin mène à la sortie ── */
      function construire() {
        if (A) return A; var c = S.ouvrir(); if (!c) return null; var a = A = { ins: {}, outs: {}, env: null };
        function osc(id) {
          var o = c.createOscillator(), h = c.createGain(), md = c.createGain(); h.gain.value = 1200; h.connect(o.detune); md.connect(o.detune); o.start();
          a[id] = { o: o, md: md }; a.ins[id + '.hauteur'] = h; a.ins[id + '.mod'] = md; a.outs[id + '.son'] = o;
        }
        osc('oscA'); osc('oscB');
        var b = c.createBufferSource(), bf = c.createBiquadFilter(), bg = c.createGain(); b.buffer = S.bruit(); b.loop = true; bf.type = 'lowpass'; bg.gain.value = .5; b.connect(bf); bf.connect(bg); b.start(); a.bruit = { f: bf }; a.outs['bruit.son'] = bg;
        var somme = c.createGain(); somme.gain.value = .7; a.mel = {}; [1, 2, 3].forEach(function (i) { var g = c.createGain(); g.connect(somme); a.mel['n' + i] = g; a.ins['mel.e' + i] = g; }); a.outs['mel.son'] = somme;
        var f = c.createBiquadFilter(), fm = c.createGain(); f.type = 'lowpass'; fm.connect(f.detune); a.filtre = { f: f, md: fm }; a.ins['filtre.son'] = f; a.ins['filtre.mod'] = fm; a.outs['filtre.son'] = f;
        var e = c.createConstantSource(); e.offset.value = 0; e.start(); a.env = e; a.outs['env.cv'] = e;
        var l = c.createOscillator(); l.start(); a.lent = l; a.outs['lent.cv'] = l;
        var v = c.createGain(), vm = c.createGain(); vm.connect(v.gain); a.ampli = { g: v, md: vm }; a.ins['ampli.son'] = v; a.ins['ampli.mod'] = vm; a.outs['ampli.son'] = v;
        var h = c.createConstantSource(); h.offset.value = 0; h.start(); a.hauteur = h; a.outs['seq.hauteur'] = h;
        var s = c.createGain(), doux = c.createWaveShaper(), n = 512, cb = new Float32Array(n); for (var i = 0; i < n; i++) { var x = i / (n - 1) * 2 - 1; cb[i] = Math.tanh(x * 1.4); } doux.curve = cb; s.connect(doux); doux.connect(voie.ouvrir()); a.sortie = s; a.ins['sortie.son'] = s;
        MODULES.forEach(function (m) { m.pots.forEach(function (p) { appliquer(m.id, p[0], true); }); if (m.forme !== undefined) poserForme(m.id); });
        cables.forEach(function (k) { relier(k, true); });
        if (!scope && voie.analyseur) scope = S.oscillo(trace, voie.analyseur, 120, 54);
        return a;
      }
      function appliquer(id, p, net) {
        if (!A) return; var v = P[id][p], t = S.ctx.currentTime, k = net ? .001 : .02;
        function vers(param, x) { param.setTargetAtTime(x, t, k); }
        if (id === 'oscA' || id === 'oscB') { if (p === 'mod') vers(A[id].md.gain, v * 24); else vers(A[id].o.frequency, 110 * Math.pow(2, P[id].accord / 12 + P[id].fin / 1200)); }
        else if (id === 'bruit') vers(A.bruit.f.frequency, expo(v, 200, 16000));
        else if (id === 'mel') vers(A.mel[p].gain, v / 100);
        else if (id === 'filtre') { if (p === 'coupure') vers(A.filtre.f.frequency, expo(v, 50, 12000)); else if (p === 'reso') vers(A.filtre.f.Q, .5 + v / 100 * 17); else vers(A.filtre.md.gain, v * 72); }
        else if (id === 'lent') vers(A.lent.frequency, expo(v, .05, 24));
        else if (id === 'ampli') { if (p === 'niveau') vers(A.ampli.g.gain, v / 100 * .8); else vers(A.ampli.md.gain, v / 100); }
        else if (id === 'sortie') vers(A.sortie.gain, v / 100 * .32);
      }
      function poserForme(id) { if (!A) return; (id === 'lent' ? A.lent : A[id].o).type = FORMES[forme[id]]; }
      function relier(k, oui) {
        if (!A || type(k.de) === 'porte') return; var s = A.outs[k.de], d = A.ins[k.a]; if (!s || !d) return;
        try { if (oui) s.connect(d); else s.disconnect(d); } catch (e) { /* déjà défait */ }
      }
      function temps(v, max) { var u = v / 100; return .001 + u * u * max; }
      function ouvrirPorte(t) { var p = A.env.offset, a = temps(P.env.a, 2), d = temps(P.env.d, 3); if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t); else p.cancelScheduledValues(t); p.setTargetAtTime(1, t, a / 4); p.setTargetAtTime(P.env.s / 100, t + a, d / 3); }
      function fermerPorte(t) { A.env.offset.setTargetAtTime(0, t, temps(P.env.r, 3) / 3); }
      function porteBranchee() { return cables.some(function (k) { return k.de === 'seq.porte' && k.a === 'env.porte'; }); }

      /* ── la façade ── */
      corps.classList.add('mu-modulaire');
      var rack = el('div', { class: 'mu-mod-rack' }), fils = svg('svg', { class: 'mu-mod-cables', 'aria-hidden': 'false' }), dit = el('div', { class: 'mu-mod-dit', 'aria-live': 'polite' }, [el('small'), el('p')]);
      var trace = svg('path', {}), voyants = [], curseurs = [];
      function parler(a, b) { dit.firstChild.textContent = a; dit.lastChild.textContent = b; }
      function nomPrise(ref) { var p = prises[ref]; return p.module + ' (' + p.nom + ')'; }
      function type(ref) { return prises[ref].type; }

      MODULES.forEach(function (m) {
        var organes = [];
        if (m.id === 'seq') {
          var colonnes = el('div', { class: 'mu-mod-pas' });
          notes.forEach(function (n, i) {
            var c = el('div', { class: 'ke-curseur', 'data-vertical': '', 'data-min': 0, 'data-max': 24, 'data-pas': 1, 'data-valeur': n, 'aria-label': 'Note du pas ' + (i + 1), style: '--h:104px' }), api = KE.curseur(c), v = el('span', { class: 'mu-voyant' }), nom = el('span', { class: 'note', text: S.nom(45 + n).replace(/ -?\d+$/, '').replace(' dièse', '♯') });
            c.addEventListener('ke:change', function (e) { notes[i] = e.detail.valeur; nom.textContent = S.nom(45 + notes[i]).replace(/ -?\d+$/, '').replace(' dièse', '♯'); });
            voyants.push(v); curseurs.push({ api: api, nom: nom, c: c }); colonnes.appendChild(el('div', { class: 'mu-mod-col' }, [v, c, nom]));
          });
          var pasEl = el('div', { 'aria-label': 'Pas joués' }), pasApi = M.pas(pasEl, { n: 8, valeurs: actifs, nom: 'Séquenceur', surChange: function (i, oui) { actifs[i] = oui ? 1 : 0; } });
          var div = el('div', { class: 'mu-bascule couchee', 'data-positions': 'noire|croche|double', 'data-valeur': '1', 'aria-label': 'Durée d’un pas' }); M.bascule(div); div.addEventListener('ke:change', function (e) { division = [4, 2, 1][e.detail.valeur]; });
          organes.push(colonnes, pasEl, el('div', { class: 'mu-mod-seqbas' }, [div, potard(m, m.pots[0])]));
          m._pas = pasApi;
        } else {
          if (m.forme !== undefined) { var b = el('div', { class: 'mu-bascule', 'data-positions': NOMS_FORMES, 'data-valeur': m.forme, 'aria-label': 'Forme d’onde, ' + m.nom + ' ' + m.sous }); M.bascule(b); b.addEventListener('ke:change', function (e) { forme[m.id] = e.detail.valeur; poserForme(m.id); }); m._forme = b; organes.push(el('div', { class: 'mu-mod-forme' }, [b])); }
          if (m.id === 'sortie') { var s = svg('svg', { viewBox: '0 0 120 54', class: 'mu-mod-scope', preserveAspectRatio: 'none', 'aria-hidden': 'true' }); s.appendChild(trace); trace.setAttribute('d', 'M0 27L120 27'); organes.push(el('div', { class: 'mu-ecran mu-mod-sortie' }, [s])); }
          organes.push(el('div', { class: 'mu-mod-pots' }, m.pots.map(function (p) { return potard(m, p); })));
        }
        function rangPrises(liste, sens) {
          if (!liste.length) return null;
          return el('div', { class: 'mu-mod-prises ' + sens }, liste.map(function (p) {
            var ref = m.id + '.' + p[0], b = el('button', { type: 'button', class: 'mu-prise', 'data-ref': ref, 'aria-label': (sens === 'entree' ? 'Entrée ' : 'Sortie ') + p[1] + ', ' + m.nom + ' ' + m.sous });
            prises[ref] = { el: b, nom: p[1], type: p[2], sens: sens, module: m.nom.toLowerCase() + (m.id === 'oscB' ? ' second' : '') };
            brancherPrise(b, ref); return el('div', { class: 'mu-mod-prise' + (p[2] === 'porte' ? ' porte' : '') }, [el('span', { text: p[1] }), b]);
          }));
        }
        rack.appendChild(el('div', { class: 'mu-mod', 'data-module': m.id, style: 'flex:' + m.l + ' 1 0' }, [
          el('p', { class: 'mu-mod-nom', text: m.nom }), el('p', { class: 'mu-mod-sous', text: m.sous }), el('div', { class: 'mu-mod-corps' }, organes),
          el('div', { class: 'mu-mod-bas' }, [rangPrises(m.ins, 'entree'), rangPrises(m.outs, 'sortie')])]));
      });
      function potard(m, p) { var o = p[5] || {}, n = M.potard(p[1], { taille: 'petit', min: p[2], max: p[3], valeur: P[m.id][p[0]], unite: o.unite, centre: o.centre, nom: p[1] + ', ' + m.nom + ' ' + m.sous }, function (v) { P[m.id][p[0]] = v; appliquer(m.id, p[0]); }); m['_' + p[0]] = n; return n; }
      rack.appendChild(fils);
      var mots = el('div', { class: 'mu-mod-mots' }), bVide = el('button', { type: 'button', class: 'ke-btn petit', text: 'tout débrancher' }), bEx = el('button', { type: 'button', class: 'ke-btn petit', text: 'le patch d’exemple' });
      mots.appendChild(bEx); mots.appendChild(bVide);
      corps.appendChild(rack); corps.appendChild(el('div', { class: 'mu-mod-pied' }, [dit, mots]));

      /* ── les câbles ── */
      function centre(ref) { var b = prises[ref].el.getBoundingClientRect(), r = rack.getBoundingClientRect(); return [b.left + b.width / 2 - r.left, b.top + b.height / 2 - r.top]; }
      function pendre(a, b) { var dx = Math.abs(b[0] - a[0]), s = borne(46 + dx * .22, 50, 132); return 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + 'C' + a[0].toFixed(1) + ' ' + (a[1] + s).toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + (b[1] + s).toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1); }
      function tracer() {
        [].slice.call(fils.querySelectorAll('.mu-cable:not(.fantome), .mu-mod-touche')).forEach(function (p) { p.remove(); });
        Object.keys(prises).forEach(function (r) { prises[r].el.classList.remove('branchee'); });
        cables.forEach(function (k) {
          var d = pendre(centre(k.de), centre(k.a)), p = svg('path', { class: 'mu-cable' + (type(k.de) === 'porte' ? ' porte' : type(k.de) === 'cv' ? ' cv' : '') + (choisi === k ? ' choisi' : ''), d: d });
          var t = svg('path', { class: 'mu-mod-touche', d: d, tabindex: '0', role: 'button', 'aria-label': 'Câble de ' + nomPrise(k.de) + ' vers ' + nomPrise(k.a) });
          function prendre() { choisi = k; [].forEach.call(fils.querySelectorAll('.mu-cable'), function (x) { x.classList.remove('choisi'); }); p.classList.add('choisi'); parler('Câble tenu', nomPrise(k.de) + ' vers ' + nomPrise(k.a) + '. Suppr le retire.'); }
          t.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); t.focus(); });
          t.addEventListener('focus', prendre); t.addEventListener('blur', function () { if (choisi === k) { choisi = null; p.classList.remove('choisi'); } });
          t.addEventListener('keydown', function (e) { if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); retirer(k); parler('Câble retiré', nomPrise(k.de) + ' ne nourrit plus ' + nomPrise(k.a) + '.'); prises[k.a].el.focus(); } });
          fils.appendChild(p); fils.appendChild(t); prises[k.de].el.classList.add('branchee'); prises[k.a].el.classList.add('branchee');
        });
      }
      function retirer(k) { var i = cables.indexOf(k); if (i < 0) return; relier(k, false); cables.splice(i, 1); if (choisi === k) choisi = null; tracer(); changer(); }
      function brancher(de, a) {
        cables.filter(function (k) { return k.a === a; }).forEach(retirer);   /* une entrée ne reçoit qu'un câble : le nouveau remplace l'ancien */
        var k = { de: de, a: a }; cables.push(k); construire(); relier(k, true); tracer(); parler('Branché', nomPrise(de) + ' vers ' + nomPrise(a) + (type(a) === 'cv' && type(de) !== 'cv' ? ' : il module.' : '.')); changer();
      }
      function changer() { corps.dispatchEvent(new CustomEvent('ke:change', { bubbles: true, detail: { cables: cables.map(function (k) { return [k.de, k.a]; }) } })); }
      function accepte(a, b) { var A1 = prises[a], B1 = prises[b]; if (A1.sens === B1.sens || a.split('.')[0] === b.split('.')[0]) return false; return (A1.type === 'porte') === (B1.type === 'porte'); }
      function tenir(ref) { tenu = ref; rack.classList.add('tire'); Object.keys(prises).forEach(function (r) { prises[r].el.classList.toggle('cible', accepte(ref, r)); prises[r].el.classList.toggle('depart', r === ref); }); parler('Câble tenu depuis ' + nomPrise(ref), 'Les prises allumées peuvent le recevoir. Lâche sur l’une d’elles, ou Entrée. Échap revient.'); }
      function lacher() { tenu = null; rack.classList.remove('tire'); Object.keys(prises).forEach(function (r) { prises[r].el.classList.remove('cible', 'depart', 'visee'); }); var f = fils.querySelector('.fantome'); if (f) f.remove(); }
      function poser(cible) { var s = prises[tenu].sens === 'sortie' ? tenu : cible, e = prises[tenu].sens === 'sortie' ? cible : tenu; lacher(); brancher(s, e); }
      function brancherPrise(b, ref) {
        tirer(b, function () { S.ouvrir(); b.focus({ preventScroll: true }); if (tenu && tenu !== ref) lacher(); tenir(ref); var f = svg('path', { class: 'mu-cable fantome' }); fils.appendChild(f); return { f: f, a: centre(ref), bouge: false }; },
          function (e, c) {
            c.bouge = true; var sous = document.elementFromPoint(e.clientX, e.clientY), cible = sous && sous.closest && sous.closest('.mu-prise.cible'), r = rack.getBoundingClientRect(), fin = [e.clientX - r.left, e.clientY - r.top];
            [].forEach.call(rack.querySelectorAll('.mu-prise.visee'), function (x) { x.classList.remove('visee'); });
            if (cible) { cible.classList.add('visee'); fin = centre(cible.dataset.ref); parler('Lâcher ici brancherait', (prises[tenu].sens === 'sortie' ? nomPrise(tenu) + ' vers ' + nomPrise(cible.dataset.ref) : nomPrise(cible.dataset.ref) + ' vers ' + nomPrise(tenu)) + '.'); }
            c.f.classList.toggle('pret', !!cible); c.f.setAttribute('d', pendre(c.a, fin));
          },
          function (e, c) { var v = rack.querySelector('.mu-prise.visee'); if (v) poser(v.dataset.ref); else if (c.bouge) { lacher(); parler('Revenu', 'Lâché hors de toute prise : rien n’a changé.'); } else { var f = fils.querySelector('.fantome'); if (f) f.remove(); } });
        b.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); S.ouvrir(); if (tenu && b.classList.contains('cible')) poser(ref); else if (tenu === ref) { lacher(); repos(); } else { lacher(); tenir(ref); } }
          else if (e.key === 'Escape' && tenu) { e.preventDefault(); var d = prises[tenu].el; lacher(); d.focus(); parler('Revenu', 'Le câble n’a pas été branché.'); }
          else if ((e.key === 'Delete' || e.key === 'Backspace') && !tenu) { var miens = cables.filter(function (k) { return k.a === ref || k.de === ref; }); if (miens.length === 1) { e.preventDefault(); retirer(miens[0]); parler('Câble retiré', 'La prise ' + nomPrise(ref) + ' est libre.'); } }
        });
        b.addEventListener('focus', function () { if (tenu && b.classList.contains('cible')) { [].forEach.call(rack.querySelectorAll('.mu-prise.visee'), function (x) { x.classList.remove('visee'); }); b.classList.add('visee'); } });
        b.addEventListener('pointerenter', function () { [].forEach.call(fils.querySelectorAll('.mu-cable:not(.fantome)'), function (p, i) { p.classList.toggle('vif', cables[i] && (cables[i].de === ref || cables[i].a === ref)); }); });
        b.addEventListener('pointerleave', function () { [].forEach.call(fils.querySelectorAll('.mu-cable.vif'), function (p) { p.classList.remove('vif'); }); });
      }
      function repos() { parler(cables.length + (cables.length > 1 ? ' câbles' : ' câble'), cables.length ? 'Tire d’une prise à une autre. Une porte ne va que sur une porte.' : 'Plus rien n’est branché : plus rien ne sonne.'); }
      function patch(liste) { cables.slice().forEach(function (k) { relier(k, false); }); cables = liste.map(function (k) { return { de: k[0], a: k[1] }; }); if (A) cables.forEach(function (k) { relier(k, true); }); tracer(); changer(); repos(); }
      bVide.addEventListener('click', function () { patch([]); });
      bEx.addEventListener('click', function () {
        patch(EXEMPLE); notes = NOTES_EXEMPLE.slice(); actifs = ACTIFS_EXEMPLE.slice();
        curseurs.forEach(function (c, i) { c.api.valeur(notes[i]); c.nom.textContent = S.nom(45 + notes[i]).replace(/ -?\d+$/, '').replace(' dièse', '♯'); });
        MODULES.forEach(function (m) { if (m._pas) actifs.forEach(function (v, i) { m._pas.valeur(i, !!v); }); m.pots.forEach(function (p) { P[m.id][p[0]] = p[4]; m['_' + p[0]]._api.valeur(p[4]); appliquer(m.id, p[0]); }); if (m._forme) { forme[m.id] = m.forme; m._forme._mu.valeur(m.forme); poserForme(m.id); } });
      });
      rack.addEventListener('keydown', function (e) { if (e.key === 'Escape' && tenu) { var d = prises[tenu].el; lacher(); d.focus(); parler('Revenu', 'Le câble n’a pas été branché.'); } });

      /* ── le séquenceur suit l'horloge commune ── */
      var pasVu = -1;
      S.horloge.surPas(function (pas, quand, duree) {
        if (pas % division) return; var a = construire(); if (!a) return; var i = (pas / division) % 8;
        if (actifs[i]) { a.hauteur.offset.setValueAtTime(notes[i] / 12, quand); if (porteBranchee()) { ouvrirPorte(quand); fermerPorte(quand + duree * division * P.seq.porte / 100); } }
        S.horloge.aLInstant(quand, function () { if (pasVu >= 0) { voyants[pasVu].classList.remove('joue'); curseurs[pasVu].c.classList.remove('ici'); } pasVu = i; if (!S.horloge.joue) return; voyants[i].classList.add(actifs[i] ? 'joue' : 'on'); voyants[i].classList.toggle('on', !actifs[i]); curseurs[i].c.classList.add('ici'); if (scope) scope.reveiller(); });
      });
      document.addEventListener('ke:horloge', function (e) { if (!e.detail.joue) { voyants.forEach(function (v) { v.classList.remove('joue', 'on'); }); curseurs.forEach(function (c) { c.c.classList.remove('ici'); }); pasVu = -1; if (A) fermerPorte(S.ctx.currentTime); } });

      cables = EXEMPLE.map(function (k) { return { de: k[0], a: k[1] }; });
      function pret() { tracer(); repos(); }
      pret(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(tracer);
      window.addEventListener('resize', tracer); if (window.ResizeObserver) new ResizeObserver(tracer).observe(rack);
      corps.addEventListener('pointerdown', function () { setTimeout(function () { if (S.ctx) { construire(); if (scope) scope.reveiller(); } }, 30); }, true);

      return {
        /* le clavier de l'ordinateur prend la main sur la hauteur et la porte du séquenceur */
        toucheClavier: function (k) { var a = construire(); if (!a) return; var t = S.ctx.currentTime; a.hauteur.offset.setValueAtTime(k / 12, t); portesClavier++; if (porteBranchee()) ouvrirPorte(t); if (scope) scope.reveiller(); },
        relacheClavier: function () { if (!A) return; portesClavier = Math.max(0, portesClavier - 1); if (!portesClavier) fermerPorte(S.ctx.currentTime); },
        cables: function () { return cables.map(function (k) { return [k.de, k.a]; }); }
      };
    }
  });
})();
