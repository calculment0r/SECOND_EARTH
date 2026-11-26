/* KIT ÉTUDE · la musique : les organes communs et le montage des instruments. À charger après son.js et kit-etude.js.
   window.KitEtude.musique (M) :
     M.definir(id, { nom, accent, sous, maniere, geste, monter(corps, voie, M) })
        → l'instrument se monte dans <section class="mu-instrument" data-instrument="id">. « voie » vient de KitEtude.son.voie(id) :
          brancher ses sons sur voie.ouvrir() (à appeler dans un geste). monter() peut rendre { arreter(), toucheClavier(note, vel), relacheClavier(note) }.
     M.actif                  → l'id de l'instrument qu'on a touché en dernier (lui seul écoute le clavier de l'ordinateur)
     M.piano(el, { de, a, surNote(midi, force), surFin(midi), noms })       → { jouer(midi, force), finir(midi), surNote(fn), surFin(fn), allumer(midi, oui), gamme([midi…]) }
     M.pads(el, { colonnes, rangs, noms, surFrappe(i, force), surFin(i) })  → { frapper(i, force), lever(i), etat(i, 'on'|'joue'|'attente'|'', oui), frappe(i) (l'éclair seul), nom(i, texte) }
     M.pas(el, { n, valeurs, surChange(i, oui, e) })                        → { valeur(i, oui?), ici(i), toutes() }
     M.bascule(el)   <div class="mu-bascule" data-positions="scie|carré|triangle" data-valeur="0" aria-label="…">  → ke:change { valeur: indice, nom }
     M.selecteur(el) <div class="mu-selecteur" data-positions="a|b|c|d" data-valeur="0" aria-label="…">            → ke:change { valeur, nom }
     M.molette(el, { retour })  <div class="mu-molette" aria-label="…">     → ke:change { valeur: −1..1 ou 0..1 }
     M.tirette(el)   <div class="mu-tirette" data-valeur="0..8" data-nom="8′">  → ke:change { valeur }
     M.potard(etiquette, attrs, surChange), M.curseur(etiquette, attrs, surChange)  → un .ke-potard / un .ke-curseur du kit, déjà monté ;
                              M.curseur({ vertical: true, hauteur }) : la valeur au-dessus, la voie graduée, l'étiquette dessous
     M.touchesOrdi            → la rangée du clavier de l'ordinateur qui joue des notes (par position des touches, pas par lettre) */
(function () {
  'use strict';
  var KE = window.KitEtude, S = KE.son, U = KE.outils, el = U.el, svg = U.svg, tirer = U.tirer, borne = U.borne;
  var M = KE.musique = { actif: null, _defs: {}, _montes: {} };
  function emettre(n, d) { n.dispatchEvent(new CustomEvent('ke:change', { bubbles: true, detail: d })); }

  /* ── les touches : un clavier de piano qu'on joue à la main (glisser d'une touche à l'autre), au clavier de l'ordinateur, ou aux flèches ── */
  /* la rangée du milieu joue les blanches, celle du dessus les noires, à partir du do : par position (e.code), donc pareil en AZERTY et en QWERTY */
  M.touchesOrdi = { KeyA: 0, KeyW: 1, KeyS: 2, KeyE: 3, KeyD: 4, KeyF: 5, KeyT: 6, KeyG: 7, KeyY: 8, KeyH: 9, KeyU: 10, KeyJ: 11, KeyK: 12, KeyO: 13, KeyL: 14, KeyP: 15, Semicolon: 16 };
  M.piano = function (n, o) {
    var de = o.de || 48, a = o.a || 84, touches = {}, blanches = [], tenues = {}, curseur = de + 12;
    n.classList.add('mu-clavier'); n.tabIndex = 0; n.setAttribute('role', 'group'); if (!n.getAttribute('aria-label')) n.setAttribute('aria-label', 'Clavier');
    for (var m = de; m <= a; m++) if (!S.noire(m)) blanches.push(m);
    blanches.forEach(function (m) { var t = el('span', { class: 'mu-t' + (m % 12 === 0 ? ' do' : ''), 'data-m': m }); if (m % 12 === 0) t.appendChild(el('i', { text: 'do ' + (Math.floor(m / 12) - 2) })); touches[m] = t; n.appendChild(t); });
    for (m = de; m <= a; m++) if (S.noire(m)) { var i = blanches.indexOf(m + 1); if (i < 1) continue; var t = el('span', { class: 'mu-t noire', 'data-m': m, style: 'left:' + (i / blanches.length * 100) + '%;width:' + (62 / blanches.length) + '%' }); touches[m] = t; n.appendChild(t); }
    function jouer(m, force) { if (tenues[m] || !touches[m]) return; tenues[m] = 1; touches[m].classList.add('tenue'); if (o.surNote) o.surNote(m, force === undefined ? .8 : force); }
    function finir(m) { if (!tenues[m]) return; delete tenues[m]; touches[m].classList.remove('tenue'); if (o.surFin) o.surFin(m); }
    var parPointeur = {};
    function sous(e) { var t = document.elementFromPoint(e.clientX, e.clientY); return t && t.closest && n.contains(t) && t.closest('.mu-t'); }
    function force(e, t) { var r = t.getBoundingClientRect(); return borne(.35 + (e.clientY - r.top) / r.height * .65, .2, 1); }   /* plus bas sur la touche : plus fort */
    n.addEventListener('pointerdown', function (e) { var t = sous(e); if (!t) return; e.preventDefault(); S.ouvrir(); n.focus({ preventScroll: true }); try { n.setPointerCapture(e.pointerId); } catch (x) { /* pointeur de synthèse */ } parPointeur[e.pointerId] = +t.dataset.m; jouer(+t.dataset.m, force(e, t)); });
    n.addEventListener('pointermove', function (e) { if (parPointeur[e.pointerId] === undefined) return; var t = sous(e), m = t ? +t.dataset.m : null; if (m === parPointeur[e.pointerId]) return; finir(parPointeur[e.pointerId]); parPointeur[e.pointerId] = m; if (m !== null) jouer(m, force(e, t)); });
    function lever(e) { if (parPointeur[e.pointerId] === undefined) return; if (parPointeur[e.pointerId] !== null) finir(parPointeur[e.pointerId]); delete parPointeur[e.pointerId]; }
    n.addEventListener('pointerup', lever); n.addEventListener('pointercancel', lever);
    /* aux flèches : un curseur de note ; Espace ou Entrée la joue tant qu'on appuie */
    n.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); if (touches[curseur]) touches[curseur].classList.remove('visee'); curseur = borne(curseur + (e.key === 'ArrowRight' ? 1 : -1), de, a); n.setAttribute('aria-valuetext', S.nom(curseur)); }
      else if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); S.ouvrir(); jouer(curseur, .8); }
    });
    n.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') finir(curseur); });
    n.addEventListener('blur', function () { Object.keys(tenues).forEach(function (m) { finir(+m); }); });
    return { jouer: jouer, finir: finir, surNote: function (fn) { o.surNote = fn; }, surFin: function (fn) { o.surFin = fn; }, base: function () { return Math.floor(curseur / 12) * 12; },
      allumer: function (m, oui) { if (touches[m]) touches[m].classList.toggle('tenue', !!oui); },
      gamme: function (l) { Object.keys(touches).forEach(function (m) { touches[m].classList.toggle('gamme', (l || []).indexOf(+m % 12) >= 0); }); } };
  };

  /* ── les pads : une grille qu'on frappe ; plus près du centre, plus fort ; flèches pour se déplacer, Espace ou Entrée pour frapper ── */
  M.pads = function (n, o) {
    var col = o.colonnes || 4, rg = o.rangs || 4, pads = [];
    n.classList.add('mu-pads'); n.style.gridTemplateColumns = 'repeat(' + col + ',minmax(0,1fr))'; n.setAttribute('role', 'grid');
    for (var i = 0; i < col * rg; i++) (function (i) {
      var p = el('button', { type: 'button', class: 'mu-pad', 'data-i': i, tabindex: i ? '-1' : '0', 'aria-label': (o.noms && o.noms[i]) || 'Pad ' + (i + 1) }, [o.numeros === false ? null : el('b', { text: String(i + 1) }), el('i', { text: (o.noms && o.noms[i]) || '' })]);
      function frapper(f) { S.ouvrir(); p.classList.add('frappe'); if (o.surFrappe) o.surFrappe(i, f); }
      function lever() { if (!p.classList.contains('frappe')) return; p.classList.remove('frappe'); if (o.surFin) o.surFin(i); }
      p._frapper = frapper; p._lever = lever;
      p.addEventListener('pointerdown', function (e) { if (p.getAttribute('aria-disabled') === 'true') return; e.preventDefault(); p.focus({ preventScroll: true }); var r = p.getBoundingClientRect(), dx = (e.clientX - r.left) / r.width - .5, dy = (e.clientY - r.top) / r.height - .5; frapper(borne(1.05 - Math.sqrt(dx * dx + dy * dy) * 1.3, .3, 1)); try { p.setPointerCapture(e.pointerId); } catch (x) { /* pointeur de synthèse */ } });
      p.addEventListener('pointerup', lever); p.addEventListener('pointercancel', lever);
      p.addEventListener('keydown', function (e) {
        var j = i; if (e.key === 'ArrowRight') j = i + 1; else if (e.key === 'ArrowLeft') j = i - 1; else if (e.key === 'ArrowDown') j = i + col; else if (e.key === 'ArrowUp') j = i - col;
        else if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); frapper(.85); return; } else return;
        e.preventDefault(); if (pads[j]) { pads[i].tabIndex = -1; pads[j].tabIndex = 0; pads[j].focus(); }
      });
      p.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') lever(); });
      p.addEventListener('blur', lever);
      pads.push(p); n.appendChild(p);
    })(i);
    return { pads: pads,
      /* frapper(i, force) / lever(i) : le même geste que la main, depuis le code (le clavier de l'ordinateur, un séquenceur qui montre ce qu'il joue) */
      frapper: function (i, f) { if (pads[i]) pads[i]._frapper(f === undefined ? .85 : f); }, lever: function (i) { if (pads[i]) pads[i]._lever(); },
      etat: function (i, classe, oui) { if (!pads[i]) return; if (!classe) pads[i].classList.remove('on', 'joue', 'attente'); else pads[i].classList.toggle(classe, oui !== false); },
      frappe: function (i, ms) { if (!pads[i]) return; pads[i].classList.add('frappe'); setTimeout(function () { pads[i].classList.remove('frappe'); }, ms || 90); },
      nom: function (i, t) { if (pads[i]) { pads[i].lastChild.textContent = t; pads[i].setAttribute('aria-label', t || 'Pad ' + (i + 1)); } } };
  };

  /* ── une rangée de pas : on clique ou on glisse pour en poser plusieurs ; flèches, Espace ── */
  M.pas = function (n, o) {
    var nb = o.n || 16, bs = [], peint = null;
    n.classList.add('mu-pas'); if (nb === 16 || nb === 8) n.classList.add('q' + nb); n.style.setProperty('--n', nb); n.setAttribute('role', 'group');
    function poser(i, oui, e) { bs[i].setAttribute('aria-pressed', oui ? 'true' : 'false'); if (o.surChange) o.surChange(i, oui, e); }
    for (var i = 0; i < nb; i++) (function (i) {
      var b = el('button', { type: 'button', 'aria-pressed': o.valeurs && o.valeurs[i] ? 'true' : 'false', tabindex: i ? '-1' : '0', 'aria-label': (o.nom ? o.nom + ', ' : '') + 'pas ' + (i + 1) });
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); b.focus({ preventScroll: true }); peint = b.getAttribute('aria-pressed') !== 'true'; poser(i, peint, e); });
      b.addEventListener('pointerenter', function (e) { if (peint !== null && e.buttons) poser(i, peint, e); });
      b.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); var j = borne(i + (e.key === 'ArrowRight' ? 1 : -1), 0, nb - 1); b.tabIndex = -1; bs[j].tabIndex = 0; bs[j].focus(); }
        else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); poser(i, b.getAttribute('aria-pressed') !== 'true', e); }
      });
      bs.push(b); n.appendChild(b);
    })(i);
    window.addEventListener('pointerup', function () { peint = null; });
    var avant = -1;
    return { boutons: bs,
      valeur: function (i, oui) { if (oui === undefined) return bs[i].getAttribute('aria-pressed') === 'true'; bs[i].setAttribute('aria-pressed', oui ? 'true' : 'false'); },
      classe: function (i, c, oui) { bs[i].classList.toggle(c, !!oui); },
      ici: function (i) { if (avant >= 0 && bs[avant]) bs[avant].classList.remove('ici'); avant = i; if (i >= 0 && bs[i]) bs[i].classList.add('ici'); },
      toutes: function () { return bs.map(function (b) { return b.getAttribute('aria-pressed') === 'true'; }); } };
  };

  /* ── la bascule ── */
  M.bascule = function (n) {
    if (n._mu) return n._mu;
    var noms = (n.dataset.positions || 'non|oui').split('|'), v = +n.dataset.valeur || 0, couchee = n.classList.contains('couchee');
    var rail = el('span', { class: 'rail' }, [el('i')]), mots = el('span', { class: 'mots' }, noms.map(function (t) { return el('span', { text: t }); }));
    n.appendChild(rail); n.appendChild(mots); n.tabIndex = 0; n.setAttribute('role', 'slider'); n.setAttribute('aria-valuemin', 0); n.setAttribute('aria-valuemax', noms.length - 1);
    function peindre() { n.style.setProperty('--p', noms.length > 1 ? v / (noms.length - 1) : 0); [].forEach.call(mots.children, function (s, i) { s.classList.toggle('ici', i === v); }); n.setAttribute('aria-valuenow', v); n.setAttribute('aria-valuetext', noms[v]); }
    function poser(x, dit) { x = borne(Math.round(x), 0, noms.length - 1); if (x === v) return; v = x; peindre(); if (dit) emettre(n, { valeur: v, nom: noms[v] }); }
    function lire(e) { var r = rail.getBoundingClientRect(); return (couchee ? (e.clientX - r.left) / r.width : (e.clientY - r.top) / r.height) * (noms.length - 1); }
    tirer(n, function (e) { n.focus({ preventScroll: true }); var sur = e.target.closest('.mots span'); if (sur) { poser([].indexOf.call(mots.children, sur), true); return false; } return { x: e.clientX, y: e.clientY, b: false }; },
      function (e, c) { if (Math.abs(e.clientX - c.x) + Math.abs(e.clientY - c.y) > 4) c.b = true; if (c.b) poser(lire(e), true); },
      function (e, c) { if (!c.b) poser((v + 1) % noms.length, true); });
    n.addEventListener('keydown', function (e) { var d = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? -1 : 0; if (d) { e.preventDefault(); poser(v + d, true); } else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); poser((v + 1) % noms.length, true); } });
    peindre();
    return (n._mu = { valeur: function (x) { if (x === undefined) return v; v = borne(x, 0, noms.length - 1); peindre(); }, nom: function () { return noms[v]; } });
  };

  /* ── le sélecteur rotatif ── */
  M.selecteur = function (n) {
    if (n._mu) return n._mu;
    var noms = (n.dataset.positions || '').split('|'), N = noms.length, v = +n.dataset.valeur || 0, ouv = Math.min(270, (N - 1) * 54), a0 = -ouv / 2;
    function pt(a, r) { var t = (a - 90) * Math.PI / 180; return [50 + r * Math.cos(t), 50 + r * Math.sin(t)]; }
    var s = svg('svg', { viewBox: '0 0 100 100', 'aria-hidden': 'true' }), crans = [], textes = [], index = svg('line', { class: 'index' }), sortie = el('output');
    var p0 = pt(a0, 34), p1 = pt(a0 + ouv, 34); s.appendChild(svg('path', { class: 'voie', d: 'M' + p0[0] + ' ' + p0[1] + 'A34 34 0 ' + (ouv > 180 ? 1 : 0) + ' 1 ' + p1[0] + ' ' + p1[1] }));
    noms.forEach(function (t, i) {
      var a = a0 + (N > 1 ? ouv * i / (N - 1) : 0), q = pt(a, 34), r = pt(a, 40), l = pt(a, 49), c = svg('line', { class: 'cran', x1: q[0], y1: q[1], x2: r[0], y2: r[1] });
      var tx = svg('text', { x: l[0], y: l[1] + 3, 'text-anchor': Math.abs(a) < 12 ? 'middle' : a < 0 ? 'end' : 'start' }); tx.textContent = n.dataset.court ? n.dataset.court.split('|')[i] : String(i + 1);
      crans.push(c); textes.push(tx); s.appendChild(c); s.appendChild(tx);
    });
    s.appendChild(index); n.appendChild(s); n.appendChild(sortie);
    n.tabIndex = 0; n.setAttribute('role', 'slider'); n.setAttribute('aria-valuemin', 0); n.setAttribute('aria-valuemax', N - 1);
    function peindre() {
      var a = a0 + (N > 1 ? ouv * v / (N - 1) : 0), q = pt(a, 22), r = pt(a, 34); index.setAttribute('x1', q[0]); index.setAttribute('y1', q[1]); index.setAttribute('x2', r[0]); index.setAttribute('y2', r[1]);
      crans.forEach(function (c, i) { c.classList.toggle('ici', i === v); textes[i].classList.toggle('ici', i === v); });
      sortie.textContent = noms[v]; n.setAttribute('aria-valuenow', v); n.setAttribute('aria-valuetext', noms[v]);
    }
    function poser(x, dit) { x = borne(Math.round(x), 0, N - 1); if (x === v) return; v = x; peindre(); if (dit) emettre(n, { valeur: v, nom: noms[v] }); }
    tirer(n, function (e) { n.focus({ preventScroll: true }); return { y: e.clientY, v: v, b: false }; }, function (e, c) { if (Math.abs(e.clientY - c.y) > 4) c.b = true; poser(c.v + (c.y - e.clientY) / 22, true); }, function (e, c) { if (!c.b) poser((v + 1) % N, true); });
    n.addEventListener('keydown', function (e) { var d = (e.key === 'ArrowUp' || e.key === 'ArrowRight') ? 1 : (e.key === 'ArrowDown' || e.key === 'ArrowLeft') ? -1 : 0; if (d) { e.preventDefault(); poser(v + d, true); } });
    peindre();
    return (n._mu = { valeur: function (x) { if (x === undefined) return v; v = borne(x, 0, N - 1); peindre(); }, nom: function () { return noms[v]; } });
  };

  /* ── la molette ── */
  M.molette = function (n, o) {
    o = o || {}; var retour = !!o.retour, v = retour ? 0 : 0;
    n.classList.add('mu-molette'); n.appendChild(el('i')); n.tabIndex = 0; n.setAttribute('role', 'slider'); n.setAttribute('aria-orientation', 'vertical'); n.setAttribute('aria-valuemin', retour ? -1 : 0); n.setAttribute('aria-valuemax', 1);
    function peindre() { n.style.setProperty('--p', retour ? (v + 1) / 2 : v); n.setAttribute('aria-valuenow', v.toFixed(2)); }
    function poser(x, dit) { x = borne(x, retour ? -1 : 0, 1); if (x === v) return; v = x; peindre(); if (dit) emettre(n, { valeur: v }); }
    tirer(n, function (e) { n.focus({ preventScroll: true }); n.classList.add('tenu'); return { y: e.clientY, v: v }; }, function (e, c) { poser(c.v + (c.y - e.clientY) / 110 * (retour ? 2 : 1), true); }, function () { n.classList.remove('tenu'); if (retour) poser(0, true); });
    n.addEventListener('keydown', function (e) { var d = e.key === 'ArrowUp' ? .1 : e.key === 'ArrowDown' ? -.1 : 0; if (d) { e.preventDefault(); poser(v + d, true); } });
    n.addEventListener('keyup', function (e) { if (retour && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) poser(0, true); });
    peindre(); return { valeur: function () { return v; } };
  };

  /* ── la tirette d'orgue : neuf positions, de 0 (rentrée) à 8 (tirée) ── */
  M.tirette = function (n) {
    if (n._mu) return n._mu;
    var v = +n.dataset.valeur || 0, i = el('i', { text: n.dataset.nom || '' }); n.appendChild(i);
    n.tabIndex = 0; n.setAttribute('role', 'slider'); n.setAttribute('aria-orientation', 'vertical'); n.setAttribute('aria-valuemin', 0); n.setAttribute('aria-valuemax', 8); if (!n.getAttribute('aria-label')) n.setAttribute('aria-label', 'Tirette ' + (n.dataset.nom || ''));
    function peindre() { n.style.setProperty('--p', v / 8); n.setAttribute('aria-valuenow', v); }
    function poser(x, dit) { x = borne(Math.round(x), 0, 8); if (x === v) return; v = x; peindre(); if (dit) emettre(n, { valeur: v }); }
    tirer(n, function (e) { n.focus({ preventScroll: true }); n.classList.add('tenu'); return { y: e.clientY, v: v }; }, function (e, c) { poser(c.v + (e.clientY - c.y) / 16, true); }, function () { n.classList.remove('tenu'); });
    n.addEventListener('keydown', function (e) { var d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0; if (d) { e.preventDefault(); poser(v + d, true); } });
    peindre(); return (n._mu = { valeur: function (x) { if (x === undefined) return v; v = borne(x, 0, 8); peindre(); } });
  };

  /* ── des raccourcis pour fabriquer les organes du kit ── */
  M.potard = function (etiq, a, surChange) {
    var p = el('div', { class: 'ke-potard' + (a.taille ? ' ' + a.taille : ''), 'data-min': a.min === undefined ? 0 : a.min, 'data-max': a.max === undefined ? 100 : a.max, 'data-pas': a.pas || 1, 'data-valeur': a.valeur === undefined ? 50 : a.valeur, 'data-unite': a.unite || null, 'data-crans': a.crans || null, 'data-centre': a.centre ? '' : null, 'aria-label': a.nom || etiq }, [el('span', { class: 'ke-petit', text: etiq })]);
    var api = KE.potard(p); if (surChange) p.addEventListener('ke:change', function (e) { surChange(e.detail.valeur); }); p._api = api; return p;
  };
  M.curseur = function (etiq, a, surChange) {
    var c = el('div', { class: 'ke-curseur', 'data-min': a.min === undefined ? 0 : a.min, 'data-max': a.max === undefined ? 100 : a.max, 'data-pas': a.pas || 1, 'data-valeur': a.valeur === undefined ? 50 : a.valeur, 'data-vertical': a.vertical ? '' : null, 'data-crans': a.crans || null, 'data-unite': a.unite || null, 'aria-label': a.nom || etiq, style: a.vertical ? '--h:' + (a.hauteur || 150) + 'px' : null });
    /* couché : l'étiquette et la valeur au-dessus de la voie ; debout : la valeur au-dessus, la voie graduée, l'étiquette dessous */
    var r = a.vertical ? el('div', { class: 'ke-reglage mu-vertical' + (a.gradue === false ? '' : ' gradue') }, [el('output'), c, el('p', { class: 'mu-etiq', text: etiq })])
      : el('div', { class: 'ke-reglage' }, [el('p', { class: 'ke-petit' }, [el('span', { text: etiq }), el('output')]), c]);
    KE.curseur(c); if (surChange) c.addEventListener('ke:change', function (e) { surChange(e.detail.valeur); }); r._c = c; return r;
  };
  M.bloc = function (titre, enfants, classe) { return el('div', { class: 'mu-bloc' + (classe ? ' ' + classe : '') }, [titre ? el('p', { class: 'mu-titre', text: titre }) : null].concat(enfants || [])); };
  M.organes = function (enfants) { return el('div', { class: 'mu-organes' }, enfants); };
  M.el = el; M.svg = svg;

  /* ── l'aplomb : le niveau de chaque instrument, mesuré une fois (une phrase type, captée après la voie, son énergie moyenne quand il
     sonne) et ramené à −22 dB RMS à ±1 dB. Ainsi, tous les curseurs « volume » à leur place, aucun instrument n'écrase les autres.
     La mesure : scratchpad fin-musique/mesure.js (voir LIRE.md). ── */
  M.APLOMB = { mono: 1.35, poly: 2.6, fm: 1.33, orgue: .92, surface: .98, acide: 1.08, rythmes: 1.35, modulaire: 1.48, groove: .68, grille: .69 };
  /* ── le montage ── */
  M.definir = function (id, d) { M._defs[id] = d; monter(id); };
  function monter(id) {
    var n = document.querySelector('.mu-instrument[data-instrument="' + id + '"]'), d = M._defs[id]; if (!n || !d || M._montes[id]) return;
    var voie = S.voie(id); voie.etalon(M.APLOMB[id] || 1); var vu = el('div', { class: 'ke-vu couche', 'data-voies': '1', 'data-traits': '32', 'aria-label': 'Niveau de ' + d.nom }), muet = el('button', { type: 'button', class: 'ke-btn', 'aria-pressed': 'false', text: 'muet' });
    var titre = el('h2', {}, [d.nom, d.accent ? el('em', { text: d.accent }) : null]);
    n.appendChild(el('div', { class: 'mu-entete' }, [titre, d.sous ? el('span', { class: 'mu-sous', text: d.sous }) : null, d.maniere ? el('span', { class: 'mu-maniere', text: 'à la manière ' + d.maniere }) : null, el('div', { class: 'mu-droite' }, [vu, muet])]));
    if (d.geste) n.appendChild(el('p', { class: 'mu-geste', text: d.geste }));
    var corps = el('div', { class: 'mu-corps' }); n.appendChild(corps);
    var api = d.monter(corps, voie, M) || {}; M._montes[id] = api; KE.monter(n);
    var vuApi = KE.vu(vu), tourne = false, calme = 0;
    function suivre() { var x = S.niveau(voie.analyseur); vuApi.niveau([Math.pow(x, .6)]); calme = x < .003 ? calme + 1 : 0; if (calme < 50) requestAnimationFrame(suivre); else { tourne = false; vuApi.niveau([0]); } }
    function reveiller() { M.actif = id; document.querySelectorAll('.mu-instrument.actif').forEach(function (x) { if (x !== n) x.classList.remove('actif'); }); n.classList.add('actif'); if (!tourne && S.ctx) { voie.ouvrir(); tourne = true; calme = 0; requestAnimationFrame(suivre); } }
    n.addEventListener('pointerdown', function () { setTimeout(reveiller, 0); }, true); n.addEventListener('keydown', function () { setTimeout(reveiller, 0); }, true); n.addEventListener('focusin', function () { M.actif = id; });
    document.addEventListener('ke:horloge', function (e) { if (e.detail.joue) setTimeout(function () { if (!tourne && S.ctx) { voie.ouvrir(); tourne = true; calme = 0; requestAnimationFrame(suivre); } }, 60); });
    muet.addEventListener('click', function () { var m = muet.getAttribute('aria-pressed') !== 'true'; muet.setAttribute('aria-pressed', String(m)); voie.muet(m); });
  }
  /* le clavier de l'ordinateur joue l'instrument actif */
  var enfoncees = {};
  document.addEventListener('keydown', function (e) {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return; if (e.target.closest && e.target.closest('input, textarea, [contenteditable]')) return;
    var api = M._montes[M.actif]; if (!api || !api.toucheClavier) return; var k = M.touchesOrdi[e.code];
    if (k === undefined) { if (e.code === 'KeyZ' && api.octave) api.octave(-1); else if (e.code === 'KeyX' && api.octave) api.octave(1); return; }
    S.ouvrir(); enfoncees[e.code] = 1; api.toucheClavier(k, .8);
  });
  document.addEventListener('keyup', function (e) { if (!enfoncees[e.code]) return; delete enfoncees[e.code]; var api = M._montes[M.actif]; if (api && api.relacheClavier) api.relacheClavier(M.touchesOrdi[e.code]); });

  /* ── le transport ── */
  function transport() {
    var t = document.getElementById('mu-transport'); if (!t) return; var H = S.horloge;
    var lire = el('button', { type: 'button', class: 'ke-btn plein', text: 'Lire' }), tempo = el('p', { class: 'mu-tempo', style: 'margin:0' }, [el('span', { text: String(H.tempo()) }), el('small', { text: 'à la minute' })]);
    var mesure = el('div', { class: 'mu-mesure', 'aria-hidden': 'true' }); for (var i = 0; i < 16; i++) mesure.appendChild(el('i'));
    var cT = M.curseur('le tempo', { min: 60, max: 180, valeur: H.tempo(), nom: 'Tempo' }, function (v) { H.tempo(v); tempo.firstChild.textContent = String(v); });
    var cB = M.curseur('la balance', { min: 0, max: 60, valeur: 0, unite: '%', nom: 'Balance (swing)' }, function (v) { H.balance(v / 100); });
    var cV = M.curseur('le volume', { min: 0, max: 100, valeur: 80, nom: 'Volume général' }, function (v) { S.ouvrir(); S.maitre.niveau(v / 100); });
    var vu = el('div', { class: 'ke-vu couche', 'data-traits': '64', 'aria-label': 'Niveau général' }), nav = document.getElementById('mu-sommaire');
    if (nav) document.querySelectorAll('.mu-instrument[data-instrument]').forEach(function (n, k) { nav.appendChild(el('a', { href: '#' + n.id }, [el('b', { text: ('0' + (k + 1)).slice(-2) }), n.dataset.nom || n.dataset.instrument])); });
    [lire, tempo, mesure, cT, cB, cV, vu].forEach(function (x) { t.appendChild(x); });
    var vuApi = KE.vu(vu), tourne = false, calme = 0;
    function suivre() { var x = S.niveau(S.maitre.analyseur); vuApi.niveau([Math.pow(x, .6), Math.pow(x, .6)]); calme = x < .003 && !H.joue ? calme + 1 : 0; if (calme < 60) requestAnimationFrame(suivre); else { tourne = false; vuApi.niveau([0, 0]); } }
    document.addEventListener('ke:son', function () { if (!tourne) { tourne = true; requestAnimationFrame(suivre); } });
    document.addEventListener('pointerdown', function () { if (S.ctx && !tourne) { tourne = true; calme = 0; requestAnimationFrame(suivre); } }, true);
    lire.addEventListener('click', function () { if (H.joue) H.arreter(); else H.jouer(); });
    document.addEventListener('ke:horloge', function (e) { lire.textContent = e.detail.joue ? 'Arrêter' : 'Lire'; lire.setAttribute('aria-pressed', String(e.detail.joue)); if (!e.detail.joue) [].forEach.call(mesure.children, function (x) { x.classList.remove('ici'); }); });
    H.surPas(function (pas, quand) { H.aLInstant(quand, function () { if (!H.joue) return; [].forEach.call(mesure.children, function (x, k) { x.classList.toggle('ici', k === pas % 16); }); }); });
  }
  function debut() { transport(); Object.keys(M._defs).forEach(monter); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', debut); else debut();
})();
