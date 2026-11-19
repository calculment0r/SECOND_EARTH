/* Second Earth · site du projet · l'éditeur sur la page.
   Les gestes sont ceux du site NirvaLabWeb de Cal (GUIDE.md, partie 3, et README « In-page editor ») :
   le principe et une partie du code (recadrage par glisser, zoom Alt + molette autour du pointeur, mise en
   forme des mots sélectionnés) en sont repris et récrits pour les blocs de ce site.

   Ce que ce fichier ajoute au contenu d'un bloc (tout est facultatif, un ancien contenu reste lisible) :
     b.mise   = {x, y, w, h, s}   déplacement (px), largeur (%), hauteur (px), échelle
     b.para   = true              parallaxe (textes seulement, jamais pendant l'édition)
     b.libres = [{id, genre: 'texte'|'image', x (%), y (px), w (%), h (px), texte, riche, typo, media, para}]
     objet.riche = {cle: html}    les mots mis en forme (police, taille, couleur du kit) d'un champ
     objet.typo  = {cle: {f, s}}  la police et la taille d'un champ entier
     media.zoom                   le zoom du cadrage (1 = l'image couvre juste le cadre)
     carrousel.ratio, .hauteur    le format partagé des vignettes et la hauteur du carrousel */
(function () {
  'use strict';
  var D = window.Depot, C = window.Commun, el = C.el;
  var ctx = null;            // ce que la page prête : garder, redessiner, contenu, media, neuf, TYPES
  var calme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* les polices du kit étude, et ses jetons de couleur : rien d'autre n'est accepté */
  var FONTES = [['', 'Police'], ['texte', 'Literata'], ['nom', 'Norelli'], ['ui', 'Chakra Petch'], ['mono', 'Azeret Mono']];
  var COULEURS = [['ink', 'Encre'], ['ink2', 'Encre douce'], ['pale', 'Pâle'], ['or', 'Corail'], ['amb', 'Ambre'], ['cy', 'Bleu d\'encre']];
  var RE_F = /\bpj-f-(texte|nom|ui|mono)\b/, RE_C = /^var\(--(ink|ink2|pale|or|amb|cy)\)$/, RE_S = /^(\d{1,3}(?:\.\d+)?)px$/;

  function edition() { return C.enEdition(); }
  function avis(t) { C.avis(t, 2600); }
  function garder() { ctx.garder(); }
  function redessiner() { ctx.redessiner(); }

  /* ═════════════ 1. Le texte riche : seulement des <span> de police, de taille, de couleur ═════════════ */
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function attrsSpan(n) {
    var f = (n.getAttribute('class') || '').match(RE_F), s = (n.style.fontSize || '').match(RE_S), c = (n.style.color || '').replace(/\s/g, '').match(RE_C);
    var st = (s ? 'font-size:' + s[1] + 'px;' : '') + (c ? 'color:var(--' + c[1] + ');' : '');
    if (!f && !st) return '';
    return (f ? ' class="pj-f-' + f[1] + '"' : '') + (st ? ' style="' + st + '"' : '');
  }
  /* lit un champ tel que le navigateur l'a laissé : le texte brut (pour la recherche, le tableau de bord), et le HTML nettoyé */
  function lireChamp(n) {
    var html = '', txt = '';
    (function marche(x) {
      Array.prototype.forEach.call(x.childNodes, function (c) {
        if (c.nodeType === 3) { var t = c.data.replace(/ /g, ' '); html += esc(t); txt += t; return; }
        if (c.nodeType !== 1 || c.classList.contains('pj-ui')) return;
        var t2 = c.tagName;
        if (t2 === 'BR') { html += '\n'; txt += '\n'; }
        else if (t2 === 'DIV' || t2 === 'P') { if (txt && !/\n$/.test(txt)) { html += '\n'; txt += '\n'; } marche(c); }
        else if (t2 === 'SPAN') { var a = attrsSpan(c); if (a) { html += '<span' + a + '>'; marche(c); html += '</span>'; } else marche(c); }
        else marche(c);
      });
    })(n);
    txt = txt.replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '');
    html = html.replace(/\n{3,}/g, '\n\n').replace(/[\s\n]+$/, '');
    return { texte: txt, html: /<span/.test(html) ? html : null };
  }
  /* pose un HTML enregistré dans un champ : jamais d'innerHTML, chaque nœud est recopié à la main */
  function remplirChamp(n, html) {
    var doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html');
    (function copier(src, dst) {
      Array.prototype.forEach.call(src.childNodes, function (c) {
        if (c.nodeType === 3) dst.appendChild(document.createTextNode(c.data));
        else if (c.nodeType === 1 && c.tagName === 'SPAN') {
          var s = document.createElement('span'), f = (c.getAttribute('class') || '').match(RE_F), z = (c.style.fontSize || '').match(RE_S), k = (c.style.color || '').replace(/\s/g, '').match(RE_C);
          if (f) s.className = 'pj-f-' + f[1]; if (z) s.style.fontSize = z[1] + 'px'; if (k) s.style.color = 'var(--' + k[1] + ')';
          copier(c, s); dst.appendChild(s);
        } else if (c.nodeType === 1) copier(c, dst);
      });
    })(doc.body, n);
  }
  function typoChamp(n, objet, cle) {
    var t = objet.typo && objet.typo[cle];
    n.className = n.className.replace(/\s*\bpj-f-[a-z]+\b/g, '');
    n.style.fontSize = '';
    if (!t) return;
    if (t.f) n.classList.add('pj-f-' + t.f);
    if (t.s) n.style.fontSize = t.s + 'px';
  }
  function engager(n) {
    var o = n._lien; if (!o) return;
    var r = lireChamp(n);
    o.objet[o.cle] = r.texte;
    if (r.html) { o.objet.riche = o.objet.riche || {}; o.objet.riche[o.cle] = r.html; }
    else if (o.objet.riche) { delete o.objet.riche[o.cle]; if (!Object.keys(o.objet.riche).length) delete o.objet.riche; }
    garder();
  }

  /* un champ de texte : lisible pour tous, éditable sur place pour l'admin en mode édition */
  function texte(sel, objet, cle, vide) {
    var html = objet.riche && objet.riche[cle];
    if (!edition() && !objet[cle] && !html) return null;
    var n = el(sel + '.pj-t');
    if (html) remplirChamp(n, html); else n.textContent = objet[cle] || '';
    typoChamp(n, objet, cle);
    if (!edition()) return n;
    n._lien = { objet: objet, cle: cle };
    n.setAttribute('contenteditable', 'true'); n.setAttribute('spellcheck', 'true'); n.classList.add('pj-editable');
    if (vide) n.setAttribute('data-vide', vide);
    n.addEventListener('input', function () { engager(n); });
    n.addEventListener('paste', function (e) { e.preventDefault(); document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain')); });
    n.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); document.execCommand('insertLineBreak'); }
      if ((e.ctrlKey || e.metaKey) && /^[biu]$/i.test(e.key)) e.preventDefault();   // pas de gras sauvage : la barre typographique fait foi
    });
    n.addEventListener('focus', function () { montrerTypo(n); });
    return n;
  }

  /* ═════════════ 2. La barre typographique ═════════════ */
  var barre = null, cible = null, dernier = null;
  function plage() {
    if (!cible) return null;
    var s = window.getSelection();
    if (s && s.rangeCount && !s.isCollapsed && cible.contains(s.anchorNode) && cible.contains(s.focusNode)) return s.getRangeAt(0);
    if (dernier && cible.contains(dernier.startContainer) && cible.contains(dernier.endContainer) && !dernier.collapsed) return dernier;
    return null;
  }
  document.addEventListener('selectionchange', function () {
    if (!cible) return;
    var s = window.getSelection(); if (!s || !s.rangeCount) return;
    if (!cible.contains(s.anchorNode) || !cible.contains(s.focusNode)) return;
    dernier = s.isCollapsed ? null : s.getRangeAt(0).cloneRange();
    if (barre) { placerTypo(); lireTypo(); }
  });
  /* enveloppe les mots choisis dans un <span> qui porte la nouvelle valeur ; une valeur null retire la propriété */
  function appliquerMots(patch) {
    var r = plage(), cible = window.Editeur._cible(); if (!r || !cible) return false;
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    var sp = document.createElement('span');
    sp.appendChild(r.extractContents());
    Array.prototype.slice.call(sp.querySelectorAll('span')).forEach(function (i) {
      if ('f' in patch) i.className = i.className.replace(/\bpj-f-[a-z]+\b/g, '').trim();
      if ('s' in patch) i.style.fontSize = '';
      if ('c' in patch) i.style.color = '';
      if (!i.getAttribute('class')) i.removeAttribute('class');
      if (!i.getAttribute('style')) i.removeAttribute('style');
      if (!i.attributes.length) { while (i.firstChild) i.parentNode.insertBefore(i.firstChild, i); i.remove(); }
    });
    if (patch.f) sp.className = 'pj-f-' + patch.f;
    if (patch.s) sp.style.fontSize = patch.s + 'px';
    if (patch.c) sp.style.color = 'var(--' + patch.c + ')';
    r.insertNode(sp);
    /* deux applications de suite ne doivent pas empiler des <span> vides l'un dans l'autre */
    var up = sp.parentNode;
    while (up && up !== cible && up.tagName === 'SPAN' && up.textContent === sp.textContent) {
      var next = up.parentNode;
      if (!('c' in patch) && up.style.color && !sp.style.color) sp.style.color = up.style.color;
      if (!('s' in patch) && up.style.fontSize && !sp.style.fontSize) sp.style.fontSize = up.style.fontSize;
      if (!('f' in patch) && RE_F.test(up.className) && !RE_F.test(sp.className)) sp.className = up.className;
      up.parentNode.insertBefore(sp, up); up.remove(); up = next;
    }
    if (!sp.getAttribute('class')) sp.removeAttribute('class');
    if (!sp.getAttribute('style')) sp.removeAttribute('style');
    var r2 = document.createRange();
    if (!sp.attributes.length) { r2.setStartBefore(sp.firstChild || sp); r2.setEndAfter(sp.lastChild || sp); while (sp.firstChild) sp.parentNode.insertBefore(sp.firstChild, sp); sp.remove(); }
    else r2.selectNodeContents(sp);
    s.removeAllRanges(); s.addRange(r2); dernier = r2.cloneRange();
    cible.normalize();
    engager(cible);
    return true;
  }
  function champEntier(patch) {
    var o = cible._lien; o.objet.typo = o.objet.typo || {};
    var t = Object.assign({}, o.objet.typo[o.cle] || {});
    Object.keys(patch).forEach(function (k) { if (patch[k]) t[k] = patch[k]; else delete t[k]; });
    if (Object.keys(t).length) o.objet.typo[o.cle] = t; else { delete o.objet.typo[o.cle]; if (!Object.keys(o.objet.typo).length) delete o.objet.typo; }
    typoChamp(cible, o.objet, o.cle); garder();
  }
  function construireTypo() {
    if (barre) return;
    var fonte = el('select.pj-ty-f', { title: 'Police : sur les mots sélectionnés, ou sur tout le champ sans sélection', 'aria-label': 'Police' },
      FONTES.map(function (f) { return el('option', { value: f[0] }, f[1]); }));
    var taille = el('input.pj-ty-s', { type: 'number', min: '8', max: '400', step: '1', title: 'Taille en px', 'aria-label': 'Taille en pixels' });
    var moins = el('button.pj-ty-b', { type: 'button', title: 'Plus petit (1 px)' }, '−'), plus = el('button.pj-ty-b', { type: 'button', title: 'Plus grand (1 px)' }, '+');
    var rst = el('button.pj-ty-b', { type: 'button', title: 'Revenir : la police et la taille d\'origine (des mots sélectionnés, ou du champ entier)' }, '↺');
    var pastilles = el('span.pj-ty-c', {}, COULEURS.map(function (c) {
      return el('button.pj-ty-pastille', { type: 'button', title: c[1] + ' (sur les mots sélectionnés)', 'aria-label': c[1], 'data-c': c[0], style: 'background:var(--' + c[0] + ')' });
    }), el('button.pj-ty-b.pj-ty-sans', { type: 'button', title: 'Retirer la couleur des mots sélectionnés' }, 'sans'));
    barre = el('div.pj-typo.pj-ui', { role: 'toolbar', 'aria-label': 'Typographie' }, fonte, moins, taille, el('span.ke-machine', {}, 'px'), plus, rst, pastilles);
    /* les boutons ne doivent pas voler la sélection ; le menu et le champ de taille la prennent, d'où « dernier » */
    barre.addEventListener('mousedown', function (e) { if (e.target.tagName === 'BUTTON') e.preventDefault(); });
    fonte.addEventListener('change', function () { var v = fonte.value || null; if (!appliquerMots({ f: v })) champEntier({ f: v }); lireTypo(); revenir(); });
    function poserTaille(v) { v = Math.max(8, Math.min(400, Math.round(v))); if (!appliquerMots({ s: v })) champEntier({ s: v }); lireTypo(); }
    taille.addEventListener('change', function () { if (taille.value) poserTaille(+taille.value); });
    taille.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); revenir(); } });   // quitter le champ déclenche « change »
    moins.addEventListener('click', function () { poserTaille(tailleIci() - 1); });
    plus.addEventListener('click', function () { poserTaille(tailleIci() + 1); });
    rst.addEventListener('click', function () {
      if (!appliquerMots({ f: null, s: null })) champEntier({ f: null, s: null });
      avis(plage() ? 'Les mots sélectionnés reprennent la police et la taille du champ.' : 'Le champ reprend sa police et sa taille d\'origine.'); lireTypo();
    });
    pastilles.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var c = b.getAttribute('data-c') || null;
      if (!appliquerMots({ c: c })) avis('Sélectionner d\'abord les mots à colorer : la couleur ne s\'applique qu\'à eux.');
    });
    barre.addEventListener('focusout', function () {
      setTimeout(function () { var a = document.activeElement; if (cible && a !== cible && !barre.contains(a)) cacherTypo(); }, 0);
    });
    document.body.appendChild(barre);
  }
  /* rendre la main au texte, avec la même sélection, après le menu des polices ou le champ de taille */
  function revenir() {
    if (!cible) return;
    var avant = dernier; cible.focus({ preventScroll: true });
    var r = dernier || avant;          // « change » a pu partir pendant le focus et poser une nouvelle sélection
    if (r && !r.collapsed) { var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); dernier = r; }
  }
  function sonde() {
    var r = plage(); if (!r) return cible;
    var n = r.startContainer; if (n.nodeType === 3) n = n.parentNode;
    return cible.contains(n) ? n : cible;
  }
  function tailleIci() { return parseFloat(getComputedStyle(sonde()).fontSize) || 16; }
  function lireTypo() {
    if (!barre || !cible) return;
    var n = sonde(), f = '';
    var run = n.closest && n.closest('[class*="pj-f-"]');
    if (run && cible.contains(run) || run === cible) f = (run.className.match(RE_F) || [])[1] || '';
    barre.querySelector('.pj-ty-f').value = f;
    var t = barre.querySelector('.pj-ty-s'); if (document.activeElement !== t) t.value = Math.round(tailleIci());
  }
  function placerTypo() {
    if (!barre || !cible) return;
    var r = plage(), b = (r && r.getBoundingClientRect().width ? r : cible).getBoundingClientRect(), h = barre.offsetHeight || 40;
    var top = b.top - h - 10; if (top < 56) top = Math.min(window.innerHeight - h - 8, b.bottom + 10);
    var left = Math.max(8, Math.min(window.innerWidth - barre.offsetWidth - 8, b.left));
    barre.style.top = top + 'px'; barre.style.left = left + 'px';
  }
  function montrerTypo(n) { construireTypo(); if (cible !== n) { cible = n; dernier = null; } barre.hidden = false; lireTypo(); placerTypo(); }
  function cacherTypo() { if (barre) barre.hidden = true; cible = null; dernier = null; }
  document.addEventListener('focusout', function (e) {
    if (!cible || e.target !== cible) return;
    if (e.relatedTarget && barre && barre.contains(e.relatedTarget)) return;
    setTimeout(function () { if (cible && document.activeElement !== cible && !(barre && barre.contains(document.activeElement))) cacherTypo(); }, 0);
  });
  window.addEventListener('scroll', function () { if (cible) placerTypo(); }, { passive: true });

  /* ═════════════ 3. Le cadrage d'une image ou d'une vidéo ═════════════
     object-fit: cover, object-position (px %, py %) et un zoom posé autour du même point : le bord gauche
     de l'image est alors à (W − dw·z)·px, comme dans NirvaLabWeb. Le zoom ne descend jamais sous 1 :
     l'image couvre toujours le cadre, jamais de bande vide. */
  function lireCadre(m) {
    var p = String(m.cadre || '50% 50%').match(/(-?[\d.]+)%\s+(-?[\d.]+)%/) || [0, 50, 50];
    return { px: Math.min(1, Math.max(0, p[1] / 100)), py: Math.min(1, Math.max(0, p[2] / 100)), z: Math.min(6, Math.max(1, m.zoom || 1)) };
  }
  function poserCadre(boite, f) {
    var v = boite.querySelector('img,video'); if (!v) return;
    var pos = (f.px * 100).toFixed(2) + '% ' + (f.py * 100).toFixed(2) + '%';
    v.style.objectPosition = pos; v.style.transformOrigin = pos;
    v.style.transform = f.z > 1.0005 ? 'scale(' + f.z.toFixed(4) + ')' : '';
  }
  function geometrie(boite, f) {
    var v = boite.querySelector('img,video'); if (!v) return null;
    var nw = v.naturalWidth || v.videoWidth, nh = v.naturalHeight || v.videoHeight; if (!nw || !nh) return null;
    var W = boite.clientWidth, H = boite.clientHeight, cover = Math.max(W / nw, H / nh);
    return { W: W, H: H, dw: nw * cover, dh: nh * cover };
  }
  function cadrage(boite, m) {
    poserCadre(boite, lireCadre(m));
    if (!edition() || boite._cadrage) return;
    boite._cadrage = true;
    boite.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || e.target.closest('button,input,[contenteditable],.pj-outils-media,.pj-grip')) return;
      var f = lireCadre(m), g = geometrie(boite, f); if (!g) return;
      e.preventDefault();
      var sx = e.clientX, sy = e.clientY, px0 = f.px, py0 = f.py, bouge = 0;
      boite.setPointerCapture(e.pointerId); boite.classList.add('cadre-en-cours');
      function mv(ev) {
        var dx = ev.clientX - sx, dy = ev.clientY - sy; bouge = Math.max(bouge, Math.abs(dx) + Math.abs(dy));
        var Dw = g.dw * f.z, Dh = g.dh * f.z;
        if (Dw > g.W + 0.5) f.px = Math.min(1, Math.max(0, px0 - dx / (Dw - g.W)));
        if (Dh > g.H + 0.5) f.py = Math.min(1, Math.max(0, py0 - dy / (Dh - g.H)));
        poserCadre(boite, f);
      }
      function fin() {
        boite.removeEventListener('pointermove', mv); boite.removeEventListener('pointerup', fin); boite.removeEventListener('pointercancel', fin);
        boite.classList.remove('cadre-en-cours');
        if (bouge > 3) { m.cadre = Math.round(f.px * 1000) / 10 + '% ' + Math.round(f.py * 1000) / 10 + '%'; garder(); avis('Cadrage gardé'); }
      }
      boite.addEventListener('pointermove', mv); boite.addEventListener('pointerup', fin); boite.addEventListener('pointercancel', fin);
    });
    var minuterie = null;
    boite.addEventListener('wheel', function (e) {
      if (!e.altKey) return;                              // la molette seule fait défiler la page
      var f = lireCadre(m), g = geometrie(boite, f); if (!g) return;
      e.preventDefault(); e.stopPropagation();
      var z2 = Math.min(6, Math.max(1, f.z * Math.exp(-e.deltaY * 0.0006)));   // lent, pour viser juste
      if (Math.abs(z2 - f.z) < 0.0001) return;
      var r = boite.getBoundingClientRect(), cx = e.clientX - r.left, cy = e.clientY - r.top;
      var Dw = g.dw * f.z, Dh = g.dh * f.z, ux = (cx - (g.W - Dw) * f.px) / Dw, uy = (cy - (g.H - Dh) * f.py) / Dh;
      var Dw2 = g.dw * z2, Dh2 = g.dh * z2;
      f.px = Dw2 > g.W + 0.5 ? Math.min(1, Math.max(0, (cx - ux * Dw2) / (g.W - Dw2))) : 0.5;
      f.py = Dh2 > g.H + 0.5 ? Math.min(1, Math.max(0, (cy - uy * Dh2) / (g.H - Dh2))) : 0.5;
      f.z = z2; poserCadre(boite, f);
      m.cadre = Math.round(f.px * 1000) / 10 + '% ' + Math.round(f.py * 1000) / 10 + '%';
      if (f.z > 1.0005) m.zoom = Math.round(f.z * 1000) / 1000; else delete m.zoom;
      clearTimeout(minuterie); minuterie = setTimeout(function () { garder(); avis('Zoom gardé · ×' + (m.zoom || 1).toFixed(2)); }, 500);
    }, { passive: false });
  }

  /* ═════════════ 4. La mise en page d'un bloc : déplacer, redimensionner, échelle ═════════════ */
  function cibleHauteur(d, b) {
    if (b.type === 'media') return d.querySelector('.pj-media');
    return d;
  }
  function appliquerMise(d, b) {
    var l = b.mise || {};
    d.classList.add('pj-mis');
    d.style.setProperty('--mx', (l.x || 0) + 'px'); d.style.setProperty('--my', (l.y || 0) + 'px');
    d.classList.toggle('pj-decale', !!(l.x || l.y));
    d.style.width = l.w ? l.w + '%' : ''; d.style.maxWidth = l.w ? 'none' : '';
    d.style.zoom = l.s && l.s !== 1 ? l.s : '';
    var h = cibleHauteur(d, b);
    if (h) { if (b.type === 'media') { h.style.height = l.h ? l.h + 'px' : ''; h.style.aspectRatio = l.h ? 'auto' : ''; } else h.style.minHeight = l.h ? l.h + 'px' : ''; }
  }
  function nettoyerMise(b) {
    var l = b.mise || {}, o = {};
    if (Math.round(l.x)) o.x = Math.round(l.x);
    if (Math.round(l.y)) o.y = Math.round(l.y);
    if (l.w) o.w = Math.round(l.w * 10) / 10;
    if (l.h) o.h = Math.round(l.h);
    if (l.s && Math.abs(l.s - 1) > 0.001) o.s = Math.round(l.s * 100) / 100;
    if (Object.keys(o).length) b.mise = o; else delete b.mise;
  }
  /* tire un geste au pointeur : f(dx, dy, ev) à chaque pas, fin() au relâchement */
  function tirer(e, poignee, f, fin) {
    e.preventDefault(); e.stopPropagation();
    var sx = e.clientX, sy = e.clientY;
    poignee.setPointerCapture(e.pointerId);
    document.documentElement.classList.add('pj-tire');
    function mv(ev) { f(ev.clientX - sx, ev.clientY - sy, ev); }
    function up() {
      poignee.removeEventListener('pointermove', mv); poignee.removeEventListener('pointerup', up); poignee.removeEventListener('pointercancel', up);
      document.documentElement.classList.remove('pj-tire'); fin();
    }
    poignee.addEventListener('pointermove', mv); poignee.addEventListener('pointerup', up); poignee.addEventListener('pointercancel', up);
  }
  function btn(txt, titre, action, classe) {
    return el('button.pj-ch-b' + (classe ? '.' + classe : ''), { type: 'button', title: titre, 'aria-label': titre, onclick: function (e) { e.stopPropagation(); action(e); } }, txt);
  }
  function grips(hote, quoi) {
    return ['e', 's', 'se'].map(function (c) {
      var g = el('span.pj-grip.pj-grip-' + c + '.pj-ui', { title: c === 'e' ? 'Tirer : la largeur' : c === 's' ? 'Tirer : la hauteur' : 'Tirer : largeur et hauteur', 'data-g': c });
      g.addEventListener('pointerdown', function (e) { if (e.button === 0) quoi(e, g, c); });
      hote.appendChild(g); return g;
    });
  }
  var TEXTUELS = { texte: 1, citation: 1 };

  function bloc(env, d, b, sec) {
    appliquerMise(d, b);
    if (b.para && TEXTUELS[b.type]) d.setAttribute('data-para', '');
    env.setAttribute('data-id', b.id);
    libres(env, b, sec);
    if (!edition()) return;

    var ch = el('div.pj-chrome.pj-ui', { contenteditable: 'false' });
    var tenir = el('span.pj-ch-h', { title: 'Tirer : déplacer ce bloc (Alt : sans aimant)', 'aria-label': 'Déplacer' }, '✥');
    ch.appendChild(el('span.pj-ch-nom', {}, ctx.TYPES[b.type] || b.type));
    function deplacer(k) {
      var j = sec.blocs.indexOf(b), n2 = j + k;
      if (n2 < 0 || n2 >= sec.blocs.length) { avis(k < 0 ? 'Déjà en haut de la catégorie' : 'Déjà en bas de la catégorie'); return; }
      sec.blocs.splice(n2, 0, sec.blocs.splice(j, 1)[0]); choisir('bloc', b.id); garder(); redessiner();
    }
    ch.appendChild(btn('▲', 'Monter ce bloc', function () { deplacer(-1); }));
    ch.appendChild(btn('▼', 'Descendre ce bloc', function () { deplacer(1); }));
    ch.appendChild(tenir);
    function echelle(k) { b.mise = b.mise || {}; b.mise.s = Math.min(2.5, Math.max(0.4, (b.mise.s || 1) + k)); appliquerMise(d, b); nettoyerMise(b); garder(); }
    ch.appendChild(btn('A−', 'Plus petit', function () { echelle(-0.05); }));
    ch.appendChild(btn('A+', 'Plus grand', function () { echelle(0.05); }));
    ch.appendChild(btn('↺', 'Revenir : position, taille et échelle d\'origine', function () { delete b.mise; appliquerMise(d, b); garder(); avis('Mise en page d\'origine'); }));
    ch.appendChild(btn('⧉', 'Dupliquer ce bloc (Ctrl+D)', function () { dupliquerBloc(sec, b); }));
    if (TEXTUELS[b.type]) ch.appendChild(btn('⇅', 'Parallaxe sur ce texte (visible hors édition)', function (e) {
      b.para = !b.para; if (!b.para) delete b.para; e.currentTarget.setAttribute('aria-pressed', b.para ? 'true' : 'false'); garder();
      avis(b.para ? 'Parallaxe posée : elle se voit hors du mode édition' : 'Parallaxe retirée');
    }, b.para ? 'actif' : ''));
    ch.appendChild(btn('✕', 'Retirer ce bloc', function () {
      if (!confirm('Retirer ce bloc du brouillon ? La version publiée reste intacte tant que vous ne publiez pas.')) return;
      sec.blocs.splice(sec.blocs.indexOf(b), 1); garder(); redessiner();
    }, 'x'));
    env.appendChild(ch);

    /* ✥ : déplacer, avec un aimant au retour sur la position d'origine */
    tenir.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      choisir('bloc', b.id);
      var l = Object.assign({ x: 0, y: 0 }, b.mise || {}), x0 = l.x || 0, y0 = l.y || 0;
      env.classList.add('pj-tire-bloc');
      tirer(e, tenir, function (dx, dy, ev) {
        b.mise = b.mise || {};
        var x = x0 + dx, y = y0 + dy;
        if (!ev.altKey) { if (Math.abs(x) < 10) x = 0; if (Math.abs(y) < 10) y = 0; }
        b.mise.x = x; b.mise.y = y; appliquerMise(d, b);
        ch.setAttribute('data-v', Math.round(x) + ', ' + Math.round(y) + ' px');
      }, function () { env.classList.remove('pj-tire-bloc'); ch.removeAttribute('data-v'); nettoyerMise(b); garder(); avis('Position gardée'); });
    });

    /* poignées de bord et de coin : la largeur (en % de la colonne), la hauteur (px) */
    grips(d, function (e, g, c) {
      choisir('bloc', b.id);
      var r = d.getBoundingClientRect(), z = (b.mise && b.mise.s) || 1, parent = d.parentNode.getBoundingClientRect();
      var cs = getComputedStyle(d.parentNode), largeurCol = parent.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      var h = cibleHauteur(d, b), h0 = (h || d).getBoundingClientRect().height, w0 = r.width;
      env.classList.add('pj-tire-bloc');
      tirer(e, g, function (dx, dy) {
        b.mise = b.mise || {};
        if (c !== 's') b.mise.w = Math.min(100, Math.max(10, (w0 + dx) / z / largeurCol * 100));
        if (c !== 'e') b.mise.h = Math.max(60, (h0 + dy) / z);
        appliquerMise(d, b);
        g.setAttribute('data-v', (c !== 's' ? Math.round(b.mise.w) + ' %' : '') + (c === 'se' ? ' · ' : '') + (c !== 'e' ? Math.round(b.mise.h) + ' px' : ''));
      }, function () { env.classList.remove('pj-tire-bloc'); g.removeAttribute('data-v'); nettoyerMise(b); garder(); avis('Taille gardée'); });
    });
  }

  /* ═════════════ 5. Les éléments libres : un texte ou une image posés à l'endroit du clic ═════════════ */
  function libres(env, b, sec) {
    if (!b.libres || !b.libres.length) return;
    var couche = el('div.pj-libres');
    b.libres.forEach(function (a) {
      var n = el('div.pj-libre', { 'data-genre': a.genre, 'data-id': a.id });
      n.style.left = (a.x || 0) + '%'; n.style.top = (a.y || 0) + 'px'; n.style.width = (a.w || 30) + '%';
      if (a.genre === 'image') { n.style.height = (a.h || 240) + 'px'; n.appendChild(ctx.media(a.media, 'libre')); }
      else { if (a.h) n.style.minHeight = a.h + 'px'; var t = texte('div.pj-libre-texte', a, 'texte', 'texte'); if (t) n.appendChild(t); if (a.para) n.setAttribute('data-para', ''); }
      if (edition()) chromeLibre(n, a, b, sec);
      couche.appendChild(n);
    });
    env.appendChild(couche);
  }
  function chromeLibre(n, a, b, sec) {
    var ch = el('div.pj-chrome.pj-chrome-libre.pj-ui', { contenteditable: 'false' });
    var tenir = el('span.pj-ch-h', { title: 'Tirer : déplacer (Alt : sans aimant)', 'aria-label': 'Déplacer' }, '✥');
    ch.appendChild(tenir);
    ch.appendChild(btn('⧉', 'Dupliquer (Ctrl+D)', function () { dupliquerLibre(b, a); }));
    if (a.genre === 'texte') ch.appendChild(btn('⇅', 'Parallaxe sur ce texte (visible hors édition)', function (e) {
      a.para = !a.para; if (!a.para) delete a.para; e.currentTarget.setAttribute('aria-pressed', a.para ? 'true' : 'false'); garder();
      avis(a.para ? 'Parallaxe posée : elle se voit hors du mode édition' : 'Parallaxe retirée');
    }, a.para ? 'actif' : ''));
    ch.appendChild(btn('✕', 'Retirer (Suppr)', function () { retirerLibre(b, a); }, 'x'));
    n.appendChild(ch);
    tenir.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      choisir('libre', a.id);
      var couche = n.parentNode.getBoundingClientRect(), x0 = a.x || 0, y0 = a.y || 0;
      tirer(e, tenir, function (dx, dy, ev) {
        var x = x0 + dx / couche.width * 100, y = y0 + dy;
        if (!ev.altKey) { /* aimant : les bords et le milieu du bloc */ [0, 50 - (a.w || 30) / 2, 100 - (a.w || 30)].forEach(function (v) { if (Math.abs(x - v) < 0.8) x = v; }); }
        a.x = Math.round(x * 10) / 10; a.y = Math.round(y);
        n.style.left = a.x + '%'; n.style.top = a.y + 'px';
      }, function () { garder(); });
    });
    grips(n, function (e, g, c) {
      choisir('libre', a.id);
      var couche = n.parentNode.getBoundingClientRect(), w0 = a.w || 30, h0 = n.getBoundingClientRect().height;
      tirer(e, g, function (dx, dy) {
        if (c !== 's') { a.w = Math.round(Math.min(100, Math.max(3, w0 + dx / couche.width * 100)) * 10) / 10; n.style.width = a.w + '%'; }
        if (c !== 'e') { a.h = Math.round(Math.max(24, h0 + dy)); if (a.genre === 'image') n.style.height = a.h + 'px'; else n.style.minHeight = a.h + 'px'; }
        g.setAttribute('data-v', (c !== 's' ? a.w + ' %' : '') + (c === 'se' ? ' · ' : '') + (c !== 'e' ? a.h + ' px' : ''));
      }, function () { g.removeAttribute('data-v'); garder(); });
    });
  }
  function nouveauLibre(b, genre, x, y) {
    var a = { id: D.uid('lb'), genre: genre, x: Math.round(x * 10) / 10, y: Math.round(y) };
    if (genre === 'texte') { a.w = 30; a.texte = 'Texte'; }
    else { a.w = 28; a.h = 260; a.media = { src: '', genre: 'image', attendu: 'ici : une image', poster: '', cadre: '50% 50%' }; }
    (b.libres = b.libres || []).push(a);
    choisir('libre', a.id, genre === 'texte');
    garder(); redessiner();
  }
  function retirerLibre(b, a) {
    b.libres = (b.libres || []).filter(function (x) { return x !== a && x.id !== a.id; });
    if (!b.libres.length) delete b.libres;
    choix = null; garder(); redessiner(); avis('Élément retiré');
  }

  /* ═════════════ 6. La sélection, dupliquer, copier, coller ═════════════ */
  var choix = null, aFocaliser = false;      // {genre: 'bloc'|'libre', id}
  function choisir(genre, id, focaliser) { choix = genre ? { genre: genre, id: id } : null; aFocaliser = !!focaliser; peindreChoix(); }
  function peindreChoix() {
    Array.prototype.forEach.call(document.querySelectorAll('.pj-choisi'), function (n) { n.classList.remove('pj-choisi'); });
    if (!choix) return;
    var n = document.querySelector((choix.genre === 'bloc' ? '.pj-bloc' : '.pj-libre') + '[data-id="' + choix.id + '"]');
    if (n) n.classList.add('pj-choisi');
  }
  function trouver() {
    if (!choix) return null;
    var c = ctx.contenu(), r = null;
    c.sections.forEach(function (sec) {
      sec.blocs.forEach(function (b) {
        if (choix.genre === 'bloc' && b.id === choix.id) r = { sec: sec, b: b };
        (b.libres || []).forEach(function (a) { if (choix.genre === 'libre' && a.id === choix.id) r = { sec: sec, b: b, a: a }; });
      });
    });
    return r;
  }
  function renouveler(o) {
    o.id = D.uid(o.id ? String(o.id).split('-')[0] : 'x');
    (o.items || []).forEach(function (x) { x.id = D.uid('i'); });
    (o.libres || []).forEach(function (x) { x.id = D.uid('lb'); });
    return o;
  }
  function dupliquerBloc(sec, b) {
    var c = renouveler(D.clone(b)); sec.blocs.splice(sec.blocs.indexOf(b) + 1, 0, c);
    choisir('bloc', c.id); garder(); redessiner(); avis('Bloc dupliqué');
  }
  function dupliquerLibre(b, a) {
    var c = renouveler(D.clone(a)); c.x = Math.min(95, (c.x || 0) + 2); c.y = (c.y || 0) + 24;
    b.libres.push(c); choisir('libre', c.id); garder(); redessiner(); avis('Élément dupliqué');
  }
  var CLE_PRESSE = 'se-projet.presse';
  function copier() {
    var t = trouver(); if (!t) return false;
    var p = t.a ? { genre: 'libre', donnees: t.a } : { genre: 'bloc', donnees: t.b };
    try { localStorage.setItem(CLE_PRESSE, JSON.stringify(p)); } catch (e) { return false; }
    avis(t.a ? 'Élément copié : Ctrl+V pour le coller' : 'Bloc copié : Ctrl+V pour le coller sous le bloc choisi');
    return true;
  }
  function presse() { try { return JSON.parse(localStorage.getItem(CLE_PRESSE) || 'null'); } catch (e) { return null; } }
  function coller(cibleBloc, x, y) {
    var p = presse(); if (!p) return false;
    var t = trouver(), c = ctx.contenu();
    if (p.genre === 'bloc') {
      var o = renouveler(D.clone(p.donnees)), sec = t ? t.sec : sectionVue(c), at = t ? sec.blocs.indexOf(t.b) + 1 : sec.blocs.length;
      sec.blocs.splice(at, 0, o); choisir('bloc', o.id);
    } else {
      var b = cibleBloc || (t && t.b); if (!b) { avis('Choisir d\'abord le bloc où coller'); return false; }
      var a = renouveler(D.clone(p.donnees));
      if (x != null) { a.x = x; a.y = y; } else { a.x = Math.min(95, (a.x || 0) + 2); a.y = (a.y || 0) + 24; }
      (b.libres = b.libres || []).push(a); choisir('libre', a.id);
    }
    garder(); redessiner(); avis('Collé'); return true;
  }
  function dansChamp(n) { return n && n.closest && n.closest('[contenteditable="true"],input,textarea,select'); }

  document.addEventListener('keydown', function (e) {
    if (!edition()) return;
    var mod = e.ctrlKey || e.metaKey, champ = dansChamp(e.target);
    if (e.key === 'Escape') { fermerMenu(); if (champ && champ.blur) champ.blur(); choisir(null); return; }
    if (mod && (e.key === 'd' || e.key === 'D')) {
      var t = trouver(); if (!t) return;
      e.preventDefault(); if (t.a) dupliquerLibre(t.b, t.a); else dupliquerBloc(t.sec, t.b); return;
    }
    if (champ) return;                                     // dans un texte, Ctrl+C / Ctrl+V restent ceux du texte
    if (mod && (e.key === 'c' || e.key === 'C')) { if (copier()) e.preventDefault(); return; }
    if (mod && (e.key === 'v' || e.key === 'V')) { if (coller()) e.preventDefault(); return; }
    if ((e.key === 'Delete' || e.key === 'Backspace') && choix && choix.genre === 'libre') { var u = trouver(); if (u) { e.preventDefault(); retirerLibre(u.b, u.a); } }
  });
  document.addEventListener('pointerdown', function (e) {
    if (!edition() || e.button !== 0) return;
    if (e.target.closest('.pj-menu,.pj-typo,.pj-bas,dialog,.pj-avis')) return;
    var lib = e.target.closest('.pj-libre'), blo = e.target.closest('.pj-bloc');
    if (!e.target.closest('.pj-menu')) fermerMenu();
    if (lib) choisir('libre', lib.getAttribute('data-id'));
    else if (blo) choisir('bloc', blo.getAttribute('data-id'));
    else if (!e.target.closest('.pj-insert')) choisir(null);
  }, true);

  /* ═════════════ 7. Insérer : la ligne entre deux blocs, le clic droit, « + Ajouter » ═════════════ */
  var menu = null;
  function fermerMenu() { if (menu) { menu.remove(); menu = null; } }
  function ouvrirMenu(entrees, x, y) {
    fermerMenu();
    menu = el('div.pj-menu.pj-ui', { role: 'menu' });
    entrees.forEach(function (en) {
      if (!en) return;
      if (en.titre) { menu.appendChild(el('p.ke-machine', {}, en.titre)); return; }
      menu.appendChild(el('button', { type: 'button', role: 'menuitem', onclick: function (ev) { ev.stopPropagation(); fermerMenu(); en.faire(); } }, en.nom));
    });
    document.body.appendChild(menu);
    var w = menu.offsetWidth, h = menu.offsetHeight;
    menu.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, x)) + 'px';
    menu.style.top = Math.max(8, Math.min(window.innerHeight - h - 8, y)) + 'px';
    var premier = menu.querySelector('button'); if (premier) premier.focus();
  }
  function entreesBlocs(sec, at) {
    return [{ titre: 'Insérer un bloc ici' }].concat(Object.keys(ctx.TYPES).map(function (t) {
      return { nom: ctx.TYPES[t], faire: function () { var nb = ctx.neuf(t); sec.blocs.splice(at, 0, nb); choisir('bloc', nb.id); garder(); redessiner(); avis(ctx.TYPES[t] + ' inséré'); } };
    }));
  }
  /* la ligne d'insertion : au survol entre deux blocs, un clic ouvre la liste des blocs */
  function ligne(sec, at) {
    if (!edition()) return null;
    var l = el('div.pj-insert.pj-ui', { title: 'Cliquer : insérer un bloc ici', role: 'button', tabindex: '0', 'aria-label': 'Insérer un bloc ici' }, el('i'), el('span', {}, '+ insérer'));
    function ouvrir(e) { var r = l.getBoundingClientRect(); ouvrirMenu(entreesBlocs(sec, at), e && e.clientX ? e.clientX : r.left + r.width / 2, r.top + r.height / 2 + 8); }
    l.addEventListener('click', function (e) { e.stopPropagation(); ouvrir(e); });
    l.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ouvrir(); } });
    return l;
  }
  /* le clic droit : créer un texte ou une image à l'endroit du clic (Maj + clic droit : le menu du navigateur) */
  document.addEventListener('contextmenu', function (e) {
    if (!edition() || e.shiftKey) return;
    if (e.target.closest('.pj-menu,.pj-typo,.pj-bas,dialog,header,footer')) return;
    var env = e.target.closest('.pj-bloc'), secN = e.target.closest('.pj-section');
    if (!secN) return;
    e.preventDefault();
    var c = ctx.contenu(), sec = c.sections.filter(function (s) { return s.id === secN.id; })[0]; if (!sec) return;
    if (!env) {
      var at = sec.blocs.length;
      Array.prototype.some.call(secN.querySelectorAll(':scope > .pj-bloc'), function (n, k) { var r = n.getBoundingClientRect(); if (e.clientY < r.top + r.height / 2) { at = k; return true; } return false; });
      ouvrirMenu(entreesBlocs(sec, at), e.clientX, e.clientY); return;
    }
    var b = sec.blocs.filter(function (x) { return x.id === env.getAttribute('data-id'); })[0]; if (!b) return;
    var r = env.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 100, y = e.clientY - r.top, idx = sec.blocs.indexOf(b);
    var p = presse();
    ouvrirMenu([
      { titre: 'À l\'endroit du clic' },
      { nom: 'Un texte ici', faire: function () { nouveauLibre(b, 'texte', x, y); } },
      { nom: 'Une image ou une vidéo ici', faire: function () { nouveauLibre(b, 'image', x, y); } },
      p && p.genre === 'libre' ? { nom: 'Coller l\'élément copié ici', faire: function () { coller(b, Math.round(x * 10) / 10, Math.round(y)); } } : null,
      { titre: 'Un bloc entier' },
      { nom: 'Insérer un bloc au-dessus…', faire: function () { ouvrirMenu(entreesBlocs(sec, idx), e.clientX, e.clientY); } },
      { nom: 'Insérer un bloc dessous…', faire: function () { ouvrirMenu(entreesBlocs(sec, idx + 1), e.clientX, e.clientY); } },
      p && p.genre === 'bloc' ? { nom: 'Coller le bloc copié dessous', faire: function () { choisir('bloc', b.id); coller(); } } : null,
      { nom: 'Dupliquer ce bloc', faire: function () { dupliquerBloc(sec, b); } }
    ], e.clientX, e.clientY);
  });
  function sectionVue(c) {
    var best = null, dmin = Infinity;
    Array.prototype.forEach.call(document.querySelectorAll('.pj-section'), function (s) {
      var r = s.getBoundingClientRect(), d = r.top > window.innerHeight / 2 ? r.top - window.innerHeight / 2 : r.bottom < window.innerHeight / 2 ? window.innerHeight / 2 - r.bottom : 0;
      if (d < dmin) { dmin = d; best = s.id; }
    });
    return c.sections.filter(function (s) { return s.id === best; })[0] || c.sections[c.sections.length - 1];
  }
  /* « + Ajouter », dans la barre du bas : sous le bloc choisi, sinon à la fin de la catégorie qu'on regarde */
  function boutonAjouter() {
    return el('button.ke-btn.petit.pj-ajouter', { type: 'button', 'aria-haspopup': 'menu', onclick: function (e) {
      e.stopPropagation();
      var c = ctx.contenu(), t = trouver(), sec = t ? t.sec : sectionVue(c), at = t ? sec.blocs.indexOf(t.b) + 1 : sec.blocs.length;
      var r = e.currentTarget.getBoundingClientRect(), es = entreesBlocs(sec, at);
      es[0] = { titre: t ? 'Sous le bloc choisi' : 'À la fin de « ' + sec.nom + ' »' };
      ouvrirMenu(es, r.left, r.top - 12 - 36 * es.length);
    } }, '+ Ajouter');
  }

  /* ═════════════ 8. Les carrousels : format partagé, hauteur ═════════════ */
  var RATIOS = { '21:9': 21 / 9, '16:9': 16 / 9, '4:5': 4 / 5 };
  function carrousel(n, b) {
    if (b.ratio || b.hauteur) {
      n.classList.add('regle');
      n.style.setProperty('--car-r', b.ratio || RATIOS[b.format || '21:9']);
      n.style.setProperty('--car-h', (b.hauteur || 420) + 'px');
    }
    if (!edition()) return;
    Array.prototype.forEach.call(n.querySelectorAll('.pj-tuile:not(.pj-ajout) > .pj-media'), function (m) {
      ['e', 's'].forEach(function (c) {
        var g = el('span.pj-grip.pj-car-grip-' + c + '.pj-ui', { title: c === 'e' ? 'Tirer : le format, partagé par toutes les vignettes' : 'Tirer : la hauteur du carrousel' });
        m.appendChild(g);
        g.addEventListener('pointerdown', function (e) {
          if (e.button !== 0) return;
          var r = m.getBoundingClientRect(), r0 = r.width / r.height, h0 = r.height;
          tirer(e, g, function (dx, dy) {
            var rr = c === 'e' ? Math.min(4, Math.max(0.4, (r.width + dx) / h0)) : (b.ratio || r0), hh = c === 's' ? Math.min(1100, Math.max(120, h0 + dy)) : h0;
            b.ratio = Math.round(rr * 1000) / 1000; b.hauteur = Math.round(hh);
            n.classList.add('regle'); n.style.setProperty('--car-r', b.ratio); n.style.setProperty('--car-h', b.hauteur + 'px');
            g.setAttribute('data-v', c === 'e' ? b.ratio.toFixed(2).replace('.', ',') + ' : 1' : b.hauteur + ' px');
          }, function () { g.removeAttribute('data-v'); garder(); avis(c === 'e' ? 'Format gardé pour toutes les vignettes' : 'Hauteur du carrousel gardée'); });
        });
      });
    });
  }

  /* ═════════════ 9. Après chaque dessin : la sélection, la parallaxe ═════════════ */
  var paras = [], rafPara = null;
  function bougerPara() {
    rafPara = null;
    paras.forEach(function (n) {
      var r = n.parentNode.getBoundingClientRect(), dv = (r.top + r.height / 2 - window.innerHeight / 2) * -0.12;
      n.style.setProperty('--para', dv.toFixed(1) + 'px');
    });
  }
  window.addEventListener('scroll', function () { if (paras.length && !rafPara) rafPara = requestAnimationFrame(bougerPara); }, { passive: true });
  function apresDessin() {
    cacherTypo();
    paras = edition() || calme ? [] : Array.prototype.slice.call(document.querySelectorAll('[data-para]'));
    bougerPara();
    peindreChoix();
    if (aFocaliser && choix) {
      aFocaliser = false;
      var t = document.querySelector('.pj-libre[data-id="' + choix.id + '"] [contenteditable="true"]');
      if (t) { t.focus(); var r = document.createRange(); r.selectNodeContents(t); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
    }
  }

  window.Editeur = {
    brancher: function (c) { ctx = c; }, _cible: function () { return cible; }, texte: texte, cadrage: cadrage, bloc: bloc, ligne: ligne, carrousel: carrousel,
    apresDessin: apresDessin, boutonAjouter: boutonAjouter, choisir: choisir
  };
})();
