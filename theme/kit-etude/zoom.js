/* KIT ÉTUDE · LE ZOOM SÉMANTIQUE — KitEtude.zoom. Un seul geste porte tout : la hauteur.
   Ctrl + molette (ou le pincement), la prise du rail, + et −, les chiffres. Hors Ctrl, la molette laisse défiler la page.
   Le moteur est celui des protos (La descente) : une hauteur continue h suit un ressort vers sa cible ; tout est posé depuis h, à chaque image.
     KitEtude.zoom.moteur(zone, { crans, depart, pose(h), viser(pt, h), fleche(sens), surCran(i), surCible(i) })
     KitEtude.zoom.vue(zone, monde, { K, tout(), marge, redessiner })      la caméra : ce qu'on vise reste sous le pointeur
     KitEtude.zoom.livre | liste | plan | calendrier | tissu | chacun | sousLigne | savoir (el, donnees, options)      huit navigations
     KitEtude.zoom.planche(el, fabrique, noms)                              les hauteurs figées, côte à côte
   L'événement « ke:hauteur » ({ h, cran, id }) part de la zone à chaque cran franchi. */
(function () {
  'use strict';
  var KE = window.KitEtude || (window.KitEtude = {}), Z = KE.zoom = {};
  var calme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* le verrou : Ctrl + molette ne zoome jamais le navigateur, dès le chargement, partout */
  window.addEventListener('wheel', function (e) { if (e.ctrlKey || e.metaKey) e.preventDefault(); }, { passive: false, capture: true });

  function el(nom, cls, txt, dans) { var e = document.createElement(nom); if (cls) e.className = cls; if (txt != null) e.textContent = txt; if (dans) dans.appendChild(e); return e; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function mix(a, b, t) { return a + (b - a) * t; }
  function ss(v, a, b) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function vars(zone, o) { for (var k in o) zone.style.setProperty('--' + k, (+o[k]).toFixed(3)); }
  function echelle(zone) { var w = zone.offsetWidth; return w ? zone.getBoundingClientRect().width / w : 1; }
  function liste(t) { return t.length > 1 ? t.slice(0, -1).join(', ') + ' et ' + t[t.length - 1] : t[0] || ''; }
  var NOMBRES = ['aucune', 'une', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze'];
  function hasard(g) { var a = g || 7; return function () { a = (a * 16807) % 2147483647; return a / 2147483647; }; }
  /* la page attend d'avoir sa taille (et ses polices) avant de se composer ; elle se recompose quand la zone change de taille */
  function quand(zone, composer) {
    var fait = false, attente = 0, l = 0;
    function essai() { if (!zone.clientWidth) return; l = zone.clientWidth; fait = true; composer(); }
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { requestAnimationFrame(essai); });
    if (window.ResizeObserver) new ResizeObserver(function () { if (!fait) { essai(); return; } if (zone.clientWidth === l) return; clearTimeout(attente); attente = setTimeout(essai, 140); }).observe(zone);
  }

  /* ════ LE MOTEUR : une hauteur continue, des crans nommés, un ressort, la poignée ════ */
  Z.moteur = function (zone, o) {
    var n = o.crans.length, h = o.depart || 0, T = h, v = 0, tourne = false, dernier = 0, cran = -1, geste = 0, cumul = 0, fige = o.fige !== undefined;
    if (!o.nu) zone.classList.add('zm-zone');
    if (fige) { h = T = o.fige; zone.setAttribute('aria-hidden', 'true'); }
    else { zone.tabIndex = 0; zone.setAttribute('role', 'application'); }
    var rail = null, boutons = [], prise = null;
    if (!fige && o.rail !== false) {
      rail = el('div', 'zm-rail', null, zone); rail.setAttribute('role', 'group'); rail.setAttribute('aria-label', 'La hauteur');
      el('i', 'zm-rail-fil', null, rail);
      boutons = o.crans.map(function (c, i) {
        var b = el('button', 'zm-cran', null, rail); b.type = 'button'; b.style.top = (n > 1 ? i / (n - 1) * 100 : 50) + '%';
        var nom = el('span', 'nom', c.nom, b); if (c.sous) el('small', null, c.sous, nom); el('span', 'pt', null, b).appendChild(document.createElement('i'));
        b.addEventListener('click', function () { aller(i, null); }); return b;
      });
      prise = el('span', 'zm-prise', null, rail); prise.tabIndex = 0; prise.setAttribute('role', 'slider'); prise.setAttribute('aria-label', 'La hauteur'); prise.setAttribute('aria-orientation', 'vertical'); prise.setAttribute('aria-valuemin', 1); prise.setAttribute('aria-valuemax', n);
      var tire = null;
      prise.addEventListener('pointerdown', function (e) { if (e.button) return; e.preventDefault(); e.stopPropagation(); tire = 1; rail.classList.add('tire'); try { prise.setPointerCapture(e.pointerId); } catch (x) { /* pointeur de synthèse */ } viser(null); });
      prise.addEventListener('pointermove', function (e) { if (!tire) return; var r = rail.getBoundingClientRect(); T = clamp((e.clientY - r.top) / r.height, -.04, 1.04) * (n - 1); if (calme) { T = clamp(Math.round(T), 0, n - 1); h = T; v = 0; poser(); } else demander(); });
      function lacher() { if (!tire) return; tire = null; rail.classList.remove('tire'); cibler(clamp(Math.round(T), 0, n - 1)); }
      prise.addEventListener('pointerup', lacher); prise.addEventListener('pointercancel', lacher);
      prise.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') aller(Math.round(T) + 1, null); else if (e.key === 'ArrowUp') aller(Math.round(T) - 1, null); else return; e.preventDefault(); e.stopPropagation(); });
      rail.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    }
    function poser() {
      o.pose(h);
      if (prise) prise.style.top = (clamp(h, 0, n - 1) / (n - 1) * 100) + '%';
      var c = clamp(Math.round(h), 0, n - 1);
      if (c !== cran) {
        cran = c;
        boutons.forEach(function (b, i) { b.classList.toggle('ici', i === c); if (i === c) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
        if (prise) { prise.setAttribute('aria-valuenow', c + 1); prise.setAttribute('aria-valuetext', o.crans[c].nom); }
        if (o.surCran) o.surCran(c);
        if (!fige) zone.dispatchEvent(new CustomEvent('ke:hauteur', { bubbles: true, detail: { h: h, cran: c, id: o.crans[c].id } }));
      }
    }
    function boucle(t) {
      var dt = dernier ? Math.min(.034, (t - dernier) / 1000) : .016; dernier = t;
      var w = 13, zeta = .8, pas = Math.max(1, Math.ceil(dt / .008)), d = dt / pas;
      for (var i = 0; i < pas; i++) { v += (w * w * (T - h) - 2 * zeta * w * v) * d; h += v * d; }
      if (Math.abs(T - h) < .0008 && Math.abs(v) < .002) { h = T; v = 0; }
      poser();
      if (h !== T || v !== 0) requestAnimationFrame(boucle); else tourne = false;
    }
    function demander() { if (calme) { h = T; v = 0; poser(); return; } if (!tourne) { tourne = true; dernier = 0; requestAnimationFrame(boucle); } }
    function viser(pt) { if (o.viser) o.viser(pt, h); }
    function cibler(i) { T = i; if (o.surCible) o.surCible(i); demander(); }
    function aller(i, pt) { i = clamp(i, 0, n - 1); viser(pt === undefined ? null : pt); cibler(i); }
    function point(e) { var r = zone.getBoundingClientRect(), k = echelle(zone); return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k }; }
    if (!fige) {
      zone.addEventListener('wheel', function (e) {
        if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault();
        var pt = point(e);
        if (calme) { cumul += e.deltaY; if (Math.abs(cumul) < 60) return; var s = cumul > 0 ? -1 : 1; cumul = 0; aller(Math.round(T) + s, pt); return; }
        if (!geste) viser(pt); clearTimeout(geste);
        var d = -e.deltaY * .0055; if (T + d < 0 || T + d > n - 1) d *= .3;          /* la résistance aux deux bouts */
        T = clamp(T + d, -.22, n - 1 + .22);
        geste = setTimeout(function () { geste = 0; cibler(clamp(Math.round(T), 0, n - 1)); }, 170); demander();
      }, { passive: false });
      zone.addEventListener('keydown', function (e) {
        if (e.target.closest && e.target.closest('input, textarea')) return; var k = e.key;
        if (k === '+' || k === '=' || k === 'PageDown') aller(Math.round(T) + 1); else if (k === '-' || k === 'PageUp') aller(Math.round(T) - 1);
        else if (/^[1-9]$/.test(k) && +k <= n) aller(+k - 1); else if (k === 'Home') aller(0); else if (k === 'End') aller(n - 1); else if (k === 'Escape') aller(o.depart || 0);
        else if (k.indexOf('Arrow') === 0 && o.fleche) o.fleche(k.slice(5)); else return;
        e.preventDefault();
      });
      /* le pincement, à deux doigts */
      var doigts = {}, base = null;
      zone.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'touch') return; doigts[e.pointerId] = e; var ids = Object.keys(doigts); if (ids.length === 2) { var a = doigts[ids[0]], b = doigts[ids[1]]; base = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1, T: T }; viser(point({ clientX: (a.clientX + b.clientX) / 2, clientY: (a.clientY + b.clientY) / 2 })); } });
      zone.addEventListener('pointermove', function (e) { if (!doigts[e.pointerId]) return; doigts[e.pointerId] = e; var ids = Object.keys(doigts); if (ids.length !== 2 || !base) return; var a = doigts[ids[0]], b = doigts[ids[1]]; T = clamp(base.T + Math.log2((Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1) / base.d) * 1.3, -.22, n - 1 + .22); demander(); });
      function leve(e) { if (!doigts[e.pointerId]) return; delete doigts[e.pointerId]; if (base) { base = null; cibler(clamp(Math.round(T), 0, n - 1)); } }
      zone.addEventListener('pointerup', leve); zone.addEventListener('pointercancel', leve);
      zone.addEventListener('dblclick', function (e) { if (e.target.closest('.zm-rail')) return; aller(Math.round(T) + 1, point(e)); });
    }
    return { zone: zone, h: function () { return h; }, cible: function () { return T; }, aller: aller, point: point, redessiner: poser, poser: function (x) { h = T = x; v = 0; cran = -1; poser(); } };
  };

  /* ════ LA VUE : un monde qu'on approche. Ce qu'on vise reste sous le pointeur ; « tout voir » (h = 0) recadre l'ensemble. ════ */
  Z.vue = function (zone, monde, o) {
    var V = { k: 1, tx: 0, ty: 0, wx: 0, wy: 0, ax: 0, ay: 0, h: 0 }, anim = 0;
    function kDe(h) { var n = o.K.length, i = clamp(Math.floor(h), 0, n - 2); return Math.exp(mix(Math.log(o.K[i]), Math.log(o.K[i + 1]), h - i)); }
    V.kDe = kDe; V.K = o.K; V.regler = function (a) { o.K.length = 0; a.forEach(function (x) { o.K.push(x); }); };
    V.marge = o.marge || { g: 80, d: 270, h: 90, b: 130 };
    V.tout = function () {
      var b = o.tout(), W = zone.clientWidth, H = zone.clientHeight, m = V.marge, lw = W - m.g - m.d, lh = H - m.h - m.b, k = Math.min(lw / b.w, lh / b.h);
      return { k: k, tx: m.g + (lw - b.w * k) / 2 - b.x * k, ty: m.h + (lh - b.h * k) / 2 - b.y * k };
    };
    V.appliquer = function (h) {
      var k = kDe(h), tx = V.ax - V.wx * k, ty = V.ay - V.wy * k, w = ss(h, 0, 1);
      if (w < 1) { var f = V.tout(); tx = mix(f.tx, tx, w); ty = mix(f.ty, ty, w); }
      V.k = k; V.tx = tx; V.ty = ty; V.h = h;
      monde.style.transform = 'translate(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px) scale(' + k.toFixed(5) + ')';
      zone.style.setProperty('--ik', (1 / k).toFixed(5));
    };
    V.ecran = function (wx, wy) { return { x: V.tx + wx * V.k, y: V.ty + wy * V.k }; };
    V.monde = function (x, y) { return { x: (x - V.tx) / V.k, y: (y - V.ty) / V.k }; };
    /* tenir le point du monde qui est sous (x, y), sans rien faire bouger */
    V.ancrer = function (x, y) {
      var w = ss(V.h, 0, 1), txa = V.tx, tya = V.ty;
      if (w > .05 && w < 1) { var f = V.tout(); txa = (V.tx - (1 - w) * f.tx) / w; tya = (V.ty - (1 - w) * f.ty) / w; }
      V.wx = (x - txa) / V.k; V.wy = (y - tya) / V.k; V.ax = x; V.ay = y;
    };
    V.poserSur = function (wx, wy, sx, sy) { V.wx = wx; V.wy = wy; V.ax = sx; V.ay = sy; };
    V.decaler = function (dx, dy) {
      cancelAnimationFrame(anim); if (calme) { V.ax += dx; V.ay += dy; o.redessiner(); return; }
      var fait = 0, t0 = 0;
      function pas(ts) { if (!t0) t0 = ts; var f = ss((ts - t0) / 360, 0, 1), d = f - fait; fait = f; V.ax += dx * d; V.ay += dy * d; o.redessiner(); if (f < 1) anim = requestAnimationFrame(pas); }
      anim = requestAnimationFrame(pas);
    };
    /* à la hauteur visée, faire tenir un rectangle du monde dans l'écran : le plus petit déplacement, ou centré s'il déborde */
    V.contenir = function (r, m, h, centre) {
      var k = kDe(h), W = zone.clientWidth, H = zone.clientHeight, x = V.ax + (r.x - V.wx) * k, y = V.ay + (r.y - V.wy) * k, w = r.w * k, hh = r.h * k, lw = W - m.g - m.d, lh = H - m.h - m.b, dx = 0, dy = 0;
      if (w > lw || centre) dx = m.g + (lw - w) / 2 - x; else if (x < m.g) dx = m.g - x; else if (x + w > W - m.d) dx = W - m.d - (x + w);
      if (hh > lh || centre) dy = m.h + (lh - hh) / 2 - y; else if (y < m.h) dy = m.h - y; else if (y + hh > H - m.b) dy = H - m.b - (y + hh);
      if (Math.abs(dx) + Math.abs(dy) > 3) V.decaler(dx, dy);
    };
    /* glisser le fond déplace le monde (pas à « tout voir ») */
    zone.addEventListener('pointerdown', function (e) {
      if (e.button || e.pointerType === 'touch' || V.h < .5 || e.target.closest('.zm-rail, button')) return;
      var r = zone.getBoundingClientRect(), x0 = e.clientX, y0 = e.clientY, bouge = false; V.ancrer(e.clientX - r.left, e.clientY - r.top); var ax = V.ax, ay = V.ay;
      function mv(ev) { if (!bouge && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 5) return; bouge = true; zone.classList.add('glisse'); V.ax = ax + ev.clientX - x0; V.ay = ay + ev.clientY - y0; o.redessiner(); }
      function up() { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); zone.classList.remove('glisse'); if (bouge) { zone._glisse = 1; setTimeout(function () { zone._glisse = 0; }, 0); } }
      window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
    });
    return V;
  };
  /* ════ LES LETTRES QUI VOYAGENT (d'après le titre d'« ez-d » : « Crator viden » devient « Victor André »).
     KitEtude.zoom.lettres(el, depuis, vers, t, { aligne: 'centre' | 'gauche', arc }) : les lettres communes (sans accent ni casse) sont appariées
     au plus près de leur place relative ; elles voyagent sur un petit arc, et prennent leur forme d'arrivée à mi-chemin ; celles qui sont de trop
     tombent et s'éteignent, celles qui manquent montent et s'allument. Les places sont mesurées sur de vrais spans, dans la police de el.
     Rend { poser(t), mesurer() } ; un second appel sur le même el avec les mêmes mots ne refait rien. ════ */
  function base(c) { return c.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  Z.lettres = function (cont, depuis, vers, t, o) {
    o = o || {};
    if (cont._lettres && cont._lettres.a === depuis && cont._lettres.b === vers) { cont._lettres.poser(t === undefined ? cont._lettres.t : t); return cont._lettres; }
    cont.textContent = ''; cont.classList.add('zm-lettres');
    var mesure = el('span', 'zm-l-mesure', null, cont), la = el('span', null, null, mesure), lb = el('span', null, null, mesure), sa = [], sb = [];
    function remplir(ligne, mot, l) { mot.split('').forEach(function (c) { var s = el('span', null, c, ligne); l.push({ c: c, el: s }); }); }
    remplir(la, depuis, sa); remplir(lb, vers, sb);
    var voy = [], usage = sa.map(function () { return false; });
    var L = { a: depuis, b: vers, t: t || 0, cont: cont };
    function lettre(c) { var s = el('span', 'zm-l', c, cont); s.setAttribute('aria-hidden', 'true'); return s; }
    cont.setAttribute('aria-label', vers);
    L.mesurer = function () {
      var r0 = cont.getBoundingClientRect(), wa = la.getBoundingClientRect().width || 1, wb = lb.getBoundingClientRect().width || 1, k = cont.offsetHeight ? r0.height / cont.offsetHeight : 1;
      sa.forEach(function (x) { var r = x.el.getBoundingClientRect(); x.x = (r.left - la.getBoundingClientRect().left) / k; x.w = r.width / k; });
      sb.forEach(function (x) { var r = x.el.getBoundingClientRect(); x.x = (r.left - lb.getBoundingClientRect().left) / k; x.w = r.width / k; });
      L.wa = wa / k; L.wb = wb / k;
      if (!voy.length) {
        /* l'appariement : chaque lettre d'arrivée prend la lettre de départ libre la plus proche de sa place relative */
        sb.forEach(function (B, j) {
          if (B.c === ' ') return; var best = -1, d = Infinity;
          sa.forEach(function (A, i) { if (usage[i] || A.c === ' ' || base(A.c) !== base(B.c)) return; var dd = Math.abs(A.x / L.wa - B.x / L.wb); if (dd < d) { d = dd; best = i; } });
          if (best >= 0) { usage[best] = true; voy.push({ a: sa[best], b: B, el: lettre(sa[best].c), sens: voy.length % 2 ? 1 : -1, j: j }); } else voy.push({ b: B, el: lettre(B.c), entre: true, j: j });
        });
        sa.forEach(function (A, i) { if (!usage[i] && A.c !== ' ') voy.push({ a: A, el: lettre(A.c), sort: true, j: i }); });
      }
      L.poser(L.t);
    };
    L.poser = function (x) {
      L.t = x = clamp(x, 0, 1); if (L.wa === undefined) return;
      var ga = o.aligne === 'gauche' ? 0 : -L.wa / 2, gb = o.aligne === 'gauche' ? 0 : -L.wb / 2, n = voy.length, arc = o.arc === undefined ? .62 : o.arc, hz = parseFloat(getComputedStyle(cont).fontSize) || 20;
      voy.forEach(function (V, k) {
        var s = V.el.style;
        if (V.sort) { var f = ss(x, .02, .42); s.transform = 'translate(' + (ga + V.a.x).toFixed(2) + 'px,' + (f * hz * .5).toFixed(2) + 'px)'; s.opacity = (1 - f).toFixed(3); return; }
        if (V.entre) { var g = ss(x, .58, .98); s.transform = 'translate(' + (gb + V.b.x).toFixed(2) + 'px,' + ((1 - g) * -hz * .5).toFixed(2) + 'px)'; s.opacity = g.toFixed(3); return; }
        var d0 = .06 + .3 * (n > 1 ? V.j / (n - 1) : 0), p = ss(x, d0, d0 + .58), xa = ga + V.a.x, xb = gb + V.b.x;
        s.transform = 'translate(' + mix(xa, xb, p).toFixed(2) + 'px,' + (Math.sin(Math.PI * p) * V.sens * arc * hz).toFixed(2) + 'px)'; s.opacity = '1';
        var c = p < .5 ? V.a.c : V.b.c; if (V.el.textContent !== c) V.el.textContent = c;
      });
      cont.style.setProperty('--l-t', x.toFixed(3));
    };
    cont._lettres = L;
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { L.mesurer(); });
    requestAnimationFrame(L.mesurer);
    return L;
  };

  function dire(dit, a, b, c) { dit.firstChild.textContent = a; var p = dit.lastChild; p.textContent = b; if (c) { p.appendChild(document.createTextNode(' ')); el('em', null, c, p); } }
  function faireDit(zone) { var d = el('div', 'zm-dit', null, zone); d.setAttribute('aria-live', 'polite'); el('small', null, '', d); el('p', null, '', d); return d; }
  function sous(zone, pt) { var r = zone.getBoundingClientRect(), k = echelle(zone); return document.elementFromPoint(r.left + pt.x * k, r.top + pt.y * k); }

  /* ════ 1 · LE LIVRE (d'après La descente et La saison) : le livre en traits, le chapitre, la page, la phrase, le mot et ce qui est dessous.
     donnees : { titre, chapitres: [{ nom, paragraphes: [[phrase, phrase…], …] }] } ; options : { depart, suivi: [chapitre, phrase], mot, fige } ════ */
  Z.livre = function (zone, D, o) {
    o = o || {};
    var LC = 252, GAP = 84, crans = [{ id: 'livre', nom: 'le livre' }, { id: 'chapitre', nom: 'le chapitre' }, { id: 'page', nom: 'la page' }, { id: 'phrase', nom: 'la phrase' }, { id: 'mot', nom: 'le mot', sous: 'et ce qui est dessous' }];
    var monde = el('div', 'zm-monde', null, zone), dit = faireDit(zone), cols = [], PH = [], haut = 0, S = { ph: 0, mot: 0 }, pret = false;
    if (D.titre) zone.setAttribute('data-titre', D.titre);
    function norme(m) { return m.toLowerCase().replace(/^[a-zà-ÿ]{1,2}[’']/, '').replace(/[^a-zà-ÿœ-]/g, ''); }
    D.chapitres.forEach(function (c, ci) {
      var col = el('section', 'zl-col', null, monde); col.style.left = ci * (LC + GAP) + 'px'; col.style.width = LC + 'px';
      el('div', 'zl-papier', null, col);
      var nom = el('div', 'zm-et zl-nom', null, col), p = el('p', null, null, nom), nph = 0;
      el('b', null, 'chapitre ' + (ci + 1), p); p.appendChild(document.createTextNode(c.nom));
      var C = { el: col, d: c, phs: [], x: ci * (LC + GAP), traits: null };
      c.paragraphes.forEach(function (par) {
        var pe = el('p', 'zl-par', null, col);
        par.forEach(function (t, k) {
          if (k) pe.appendChild(document.createTextNode(' '));
          var s = el('span', 'zl-ph' + (k ? '' : ' prem'), null, pe), P = { el: s, c: ci, t: t, mots: [], traits: [], i: PH.length };
          t.split(' ').forEach(function (m, j) { if (j) s.appendChild(document.createTextNode(' ')); var me = el('span', 'zl-mot', m, s); P.mots.push({ el: me, t: m, n: norme(m) }); });
          PH.push(P); C.phs.push(P); nph++;
        });
      });
      el('span', null, NOMBRES[c.paragraphes.length] + ' paragraphes · ' + nph + ' phrases', p);
      C.traits = el('div', 'zl-traits', null, col); cols.push(C);
    });
    var notes = el('div', 'zm-et zl-notes', null, monde), notesIn = el('div', null, null, notes);
    if (o.suivi) { S.ph = cols[o.suivi[0]].phs[o.suivi[1]].i; }
    if (o.mot !== undefined) S.mot = o.mot;

    var V = Z.vue(zone, monde, { K: [.4, .8, 1.3, 2.5, 5.2], tout: function () { return { x: 0, y: -80, w: cols.length * (LC + GAP) - GAP, h: haut + 80 }; }, redessiner: function () { M.redessiner(); } });
    function mesurer() {
      monde.style.transform = 'none'; zone.style.setProperty('--ik', '1');
      var e = echelle(zone), r0 = monde.getBoundingClientRect(); haut = 0;
      function rel(r) { return { x: (r.left - r0.left) / e, y: (r.top - r0.top) / e, w: r.width / e, h: r.height / e }; }
      cols.forEach(function (C) {
        C.h = C.el.offsetHeight; haut = Math.max(haut, C.h); C.traits.textContent = '';
        C.phs.forEach(function (P) {
          P.rects = [].map.call(P.el.getClientRects(), rel); P.traits = [];
          P.rects.forEach(function (r) { var b = el('i', P.el.classList.contains('prem') ? 'prem' : null, null, C.traits); b.style.left = (r.x - C.x) + 'px'; b.style.top = (r.y + r.h / 2 - 3) + 'px'; b.style.width = Math.max(4, r.w - 5) + 'px'; P.traits.push(b); });
          var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; P.rects.forEach(function (r) { x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h); });
          P.b = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; P.cx = P.rects[0].x + P.rects[0].w / 2; P.cy = P.rects[0].y + P.rects[0].h / 2;
          P.mots.forEach(function (m) { m.r = rel(m.el.getBoundingClientRect()); });
        });
      });
      var W = zone.clientWidth, H = zone.clientHeight;
      V.marge = o.fige !== undefined ? { g: 70, d: 70, h: 110, b: 90 } : { g: 80, d: 270, h: 100, b: 140 };
      V.K[0] = V.tout().k; V.K[1] = clamp((H - 270) / haut, V.K[0] * 1.3, 1.05); V.K[2] = Math.max(1.5, V.K[1] * 1.4); V.K[3] = V.K[2] * 1.75; V.K[4] = V.K[2] * 3.4;
    }
    function suivre(ph, mot) {
      S.ph = ph; var P = PH[ph]; S.mot = clamp(mot === undefined ? Math.min(P.mots.length - 1, 2) : mot, 0, P.mots.length - 1);
      PH.forEach(function (Q) { var oui = Q === P; Q.el.classList.toggle('suivie', oui); Q.traits.forEach(function (b) { b.classList.toggle('suivie', oui); if (!Q.el.classList.contains('prem')) b.classList.remove('prem'); }); Q.mots.forEach(function (m, j) { m.el.classList.toggle('suivi', oui && j === S.mot); }); });
      cols.forEach(function (C, i) { C.el.classList.toggle('suivi', i === P.c); });
      var m = P.mots[S.mot]; if (m.r) { notes.style.left = m.r.x + 'px'; notes.style.top = (m.r.y + m.r.h) + 'px'; }
      /* ce qui est dessous le mot : compté dans le texte, jamais inventé */
      var ou = cols.map(function (C) { return C.phs.reduce(function (a, Q) { return a + Q.mots.filter(function (x) { return x.n === m.n; }).length; }, 0); }), total = ou.reduce(function (a, b) { return a + b; }, 0), ch = [], fort = 0;
      ou.forEach(function (x, i) { if (x) ch.push(String(i + 1)); if (x > ou[fort]) fort = i; });
      notesIn.textContent = '';
      if (total > 1) { var p1 = el('p', null, null, notesIn); el('b', null, String(total), p1); p1.appendChild(document.createTextNode('fois dans le livre · chapitre' + (ch.length > 1 ? 's ' : ' ') + liste(ch))); if (ou[fort] > 1 && ch.length > 1) el('p', 'deduit', 'Il revient surtout au chapitre ' + (fort + 1) + ', « ' + D.chapitres[fort].nom + ' ».', notesIn); }
      else el('p', 'manque', 'Il ne paraît qu’ici.', notesIn);
      S.total = total; parler();
    }
    function parler() {
      var c = clamp(Math.round(M ? M.cible() : 0), 0, 4), P = PH[S.ph], C = cols[P.c];
      if (c === 0) dire(dit, D.titre + ' · ' + NOMBRES[cols.length] + ' chapitres', 'Un trait par phrase. Un seul est tenu.');
      else if (c === 1) dire(dit, 'chapitre ' + (P.c + 1) + ' · ' + C.d.nom, 'Chaque paragraphe dit sa première phrase. Le reste attend en traits.');
      else if (c < 4) dire(dit, 'chapitre ' + (P.c + 1) + ' · ' + C.d.nom, P.t);
      else dire(dit, '« ' + P.t + ' »', P.mots[S.mot].t.replace(/[.,;:!?]/g, ''), S.total > 1 ? 'revient ' + S.total + ' fois' : 'ne paraît qu’ici');
    }
    function pose(h) {
      V.appliquer(h);
      vars(zone, { 'gras': 1 - ss(h, 1.15, 1.8), 'gras-prem': 1 - ss(h, .4, 1.05), 'o-tetes': ss(h, .45, 1), 'o-lettres': ss(h, 1.2, 1.75), 'o-traits': 1 - ss(h, 1.3, 1.8), 'o-papier': ss(h, 1.45, 2) * (1 - ss(h, 2.5, 3.1)), 'o-autres': Math.max(0, 1 - .55 * ss(h, .35, 1) - .37 * ss(h, 1.3, 2)),
        'o-phrases': mix(1, .1, ss(h, 2.3, 3)) * mix(1, .45, ss(h, 3.3, 4)), 'o-mots': mix(1, .16, ss(h, 3.3, 3.9)), 'o-notes': ss(h, 3.5, 4), 'o-noms': 1 - ss(h, 1.5, 2.1), 'o-titre': 1 - ss(h, .15, .8) });
      zone.classList.toggle('zl-mot-tenu', h > 3.4);
    }
    function centre(h) { var P = PH[S.ph], m = P.mots[S.mot]; return h > 3.4 ? { x: m.r.x + m.r.w / 2, y: m.r.y + m.r.h / 2 } : { x: P.cx, y: P.cy }; }
    function cadrer(i) {
      if (!pret) return; var P = PH[S.ph], C = cols[P.c], m = P.mots[S.mot].r;
      if (i === 1) V.contenir({ x: C.x, y: -90, w: LC, h: C.h + 90 }, { g: 90, d: 270, h: 40, b: 130 }, i);
      else if (i === 2) V.contenir(P.b, { g: 110, d: 290, h: 90, b: 150 }, i);
      else if (i === 3) V.contenir(P.b, { g: 90, d: 280, h: 90, b: 160 }, i);
      else if (i === 4) V.contenir(m, { g: 110, d: 430, h: 110, b: 240 }, i);
      parler();
    }
    var M = Z.moteur(zone, { crans: crans, depart: o.depart === undefined ? 2 : o.depart, fige: o.fige, pose: pose, surCible: cadrer, surCran: function () { parler(); },
      viser: function (pt, h) {
        if (!pret) return; var W = zone.clientWidth, H = zone.clientHeight;
        if (pt) {
          var c = sous(zone, pt), mot = c && c.closest && c.closest('.zl-mot'), ph = c && c.closest && c.closest('.zl-ph'), col = c && c.closest && c.closest('.zl-col'), w = V.monde(pt.x, pt.y);
          if (ph) { var P = PH.filter(function (Q) { return Q.el === ph; })[0]; suivre(P.i, mot ? P.mots.map(function (x) { return x.el; }).indexOf(mot) : undefined); }
          else if (col) { var C = cols.filter(function (X) { return X.el === col; })[0], best = C.phs[0], d = Infinity; C.phs.forEach(function (Q) { var dd = Math.hypot(Q.cx - w.x, Q.cy - w.y); if (dd < d) { d = dd; best = Q; } }); suivre(best.i); }
          V.ancrer(pt.x, pt.y); return;
        }
        var q = centre(h), s = V.ecran(q.x, q.y);
        if (s.x > 40 && s.x < W - 40 && s.y > 40 && s.y < H - 40) V.ancrer(s.x, s.y); else V.poserSur(q.x, q.y, W * .38, H * .42);
      },
      fleche: function (sens) {
        var h = M.cible(), d = sens === 'Right' || sens === 'Down' ? 1 : -1, P = PH[S.ph];
        if (h >= 3.5) suivre(S.ph, clamp(S.mot + d, 0, P.mots.length - 1));
        else if (h >= 1.5) suivre(clamp(S.ph + d, 0, PH.length - 1));
        else { var c = clamp(P.c + d, 0, cols.length - 1); if (c !== P.c) suivre(cols[c].phs[0].i); }
        var q = centre(h), s = V.ecran(q.x, q.y); V.poserSur(q.x, q.y, s.x, s.y); cadrer(Math.round(h));
      } });
    if (o.fige === undefined) zone.addEventListener('click', function (e) {
      if (zone._glisse) return; var mot = e.target.closest('.zl-mot'), ph = e.target.closest('.zl-ph'); if (!ph) return;
      var P = PH.filter(function (Q) { return Q.el === ph; })[0]; suivre(P.i, mot && M.cible() >= 2.5 ? P.mots.map(function (x) { return x.el; }).indexOf(mot) : undefined);
    });
    quand(zone, function () {
      mesurer(); pret = true; suivre(S.ph, S.mot);
      var W = zone.clientWidth, H = zone.clientHeight, h = M.cible(), q = centre(h), P = PH[S.ph], C = cols[P.c];
      if (o.fige !== undefined) { if (h < 1.5) V.poserSur(C.x + LC / 2, C.h / 2 - 30, W * .5, H * .5); else if (h > 3.4) V.poserSur(q.x, q.y, W * .34, H * .4); else V.poserSur(P.b.x + P.b.w / 2, P.b.y + P.b.h / 2, W * .5, H * .46); }
      else V.poserSur(q.x, q.y, W * .36, H * .42);
      M.poser(h);
    });
    return M;
  };

  /* ════ 2 · LA LISTE (d'après Les cases prennent leur temps) : des lignes, des cases, des cases dont la largeur dit la durée, un morceau ouvert.
     donnees : { nom, items: [{ nom, duree (s), parts: [{ nom, poids, fort }] }] } ════ */
  function duree(s) { return Math.floor(s / 60) + ':' + ('0' + Math.round(s % 60)).slice(-2); }
  Z.liste = function (zone, D, o) {
    o = o || {};
    var crans = [{ id: 'liste', nom: 'la liste' }, { id: 'cases', nom: 'les cases' }, { id: 'temps', nom: 'le temps' }, { id: 'un', nom: 'un morceau' }];
    var dit = faireDit(zone), items = [], suivi = o.suivi || 4, A = null, R = [], regle = el('div', 'zt-regle', null, zone), total = el('p', 'zt-total', null, zone), pret = false, som = 0, dec = { x: 0, y: 0 };
    D.items.forEach(function (d) { som += d.duree; });
    D.items.forEach(function (d, i) {
      var it = el('div', 'zt-item', null, zone); it.tabIndex = -1;
      var I = { el: it, d: d, i: i, boite: el('div', 'zt-boite', null, it), parts: el('div', 'zt-parts', null, it), tenu: el('i', 'zt-tenu', null, it), filet: el('i', 'zt-filet', null, it), num: el('p', 'zt-num', ('0' + (i + 1)).slice(-2), it), nom: el('p', 'zt-nom', d.nom, it), dur: el('p', 'zt-dur', duree(d.duree), it) };
      d.parts.forEach(function (p) { var s = el('span', p.fort ? 'fort' : null, null, I.parts); s.style.setProperty('--f', p.poids); el('small', null, duree(d.duree * p.poids / d.parts.reduce(function (a, b) { return a + b.poids; }, 0)), s); el('em', null, p.nom, s); });
      it.addEventListener('click', function () { suivre(i); });
      items.push(I);
    });
    total.appendChild(document.createTextNode(Math.round(som / 60) + ' min')); el('small', null, NOMBRES[items.length] + ' morceaux, bout à bout', total);
    function suivre(i) { var avant = suivi; suivi = clamp(i, 0, items.length - 1); items.forEach(function (I, k) { I.el.classList.toggle('suivi', k === suivi); }); parler(); if (pret && avant !== suivi) { composer(); if (M) M.redessiner(); } }
    function parler() {
      var c = clamp(Math.round(M ? M.cible() : 0), 0, 3), d = items[suivi].d;
      if (c === 0) dire(dit, D.nom + ' · ' + NOMBRES[items.length] + ' morceaux', 'Une ligne par morceau.');
      else if (c === 1) dire(dit, 'les mêmes, en cases', 'Toutes pareilles : on ne voit pas encore le temps.');
      else if (c === 2) dire(dit, Math.round(som / 60) + ' minutes', 'La largeur d’une case dit sa durée.');
      else dire(dit, 'morceau ' + (suivi + 1) + ' · ' + duree(d.duree), d.nom);
    }
    /* la place de chaque morceau à chaque cran, et celle de ses trois mots. L'ordre de haut en bas ne change jamais : rien ne se croise.
       la liste : une ligne ; les cases : la ligne se tasse en une case, à gauche ; le temps : chaque case prend la largeur de sa durée
       et glisse à son heure de début (une cascade, bout à bout) ; un morceau : le tenu s'ouvre sur toute la largeur, les autres s'aplatissent en filets. */
    function composer() {
      var W = zone.clientWidth, H = zone.clientHeight, n = items.length, X0 = Math.round(W * .06), XN = 52, lc = Math.min(1180, W - X0 - 300), rh = Math.min(46, Math.floor((H - 300) / n)), Y0 = Math.round((H - 130 - rh * n) / 2 + 30);
      var cw0 = 250, pps = (lc - XN - 260) / som, lw = Math.min(820, lc) - XN, ch = rh - 8;
      var hU = 156, tU = 118, fin = 7, gap = 6, Yu = Math.round((H - 130 - (n - 1) * (fin + gap) - hU - tU) / 2 + 40);
      R = []; var debut = 0;
      items.forEach(function (I, i) {
        var nw = I.nom.offsetWidth || 120, w2 = Math.max(6, I.d.duree * pps - 2), x2 = debut * pps, y = Y0 + i * rh, yu = i < suivi ? Yu + i * (fin + gap) : i === suivi ? Yu + i * (fin + gap) + tU : Yu + (i - 1) * (fin + gap) + tU + hU + 18;
        R.push([
          { x: X0 + XN, y: y, w: lw, h: rh, num: [-XN, rh / 2 - 9, 1, 1], nom: [0, rh / 2 - 15, 1, 1], dur: [lw - 64, rh / 2 - 15, 1, 1] },
          { x: X0 + XN, y: y + 4, w: cw0, h: ch, num: [-XN, ch / 2 - 9, 1, 1], nom: [12, ch / 2 - 12, .8, 1], dur: [cw0 + 14, ch / 2 - 12, .8, 1] },
          { x: X0 + XN + x2, y: y + 4, w: w2, h: ch, num: [-XN - x2, ch / 2 - 9, 1, 1], nom: [w2 + 12, ch / 2 - 11, .7, 1], dur: [w2 + 26 + nw * .7, ch / 2 - 9, .58, 1] },
          i === suivi ? { x: X0 + XN, y: yu, w: lc - XN, h: hU, num: [-XN, -tU + 10, 1, 1], nom: [0, -tU + 30, 2.6, 1], dur: [lc - XN - 132, -tU + 36, 2.4, 1] }
            : { x: X0 + XN + x2, y: yu, w: w2, h: fin, num: [-XN - x2, -6, .8, .55], nom: [w2 + 10, -8, .5, 0], dur: [8, -4, .4, 0] }
        ]);
        debut += I.d.duree;
      });
      regle.textContent = ''; regle._y = Y0 - 30; regle._x = X0 + XN;
      for (var mm = 0; mm * 60 <= som; mm += 5) { var tk = el('i', null, null, regle); tk.style.left = (mm * 60 * pps) + 'px'; el('b', null, duree(mm * 60), tk); }
      total._x = X0 + XN; total._y = Y0 - 130; pret = true; ZT = { W: W, H: H };
    }
    var ZT = { W: 0, H: 0 };
    function rect(i, h) {
      var a = clamp(Math.floor(h), 0, 2), f = clamp(h - a, 0, 1); f = ss(clamp(f * 1.2 - i * .016, 0, 1), 0, 1);
      var p = R[i][a], q = R[i][a + 1], r = { x: mix(p.x, q.x, f), y: mix(p.y, q.y, f), w: mix(p.w, q.w, f), h: mix(p.h, q.h, f) };
      ['num', 'nom', 'dur'].forEach(function (k) { r[k] = [mix(p[k][0], q[k][0], f), mix(p[k][1], q[k][1], f), mix(p[k][2], q[k][2], f), mix(p[k][3], q[k][3], f)]; });
      return r;
    }
    function pose(h) {
      if (!pret) return;
      var rs = items.map(function (I, i) { return rect(i, h); }), s = rs[suivi], x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      rs.forEach(function (r) { x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h); });
      /* le morceau tenu garde sa place à l'écran, tant que l'ensemble tient dans la zone */
      var dx = 0, dy = 0, mg = 30, md = 290, mh = 40 + 90 * ss(h, 1.4, 2) * (1 - ss(h, 2.3, 2.8)), mb = 130;
      if (A) { dx = A.x - (s.x + s.w / 2); dy = A.y - (s.y + s.h / 2); }
      dx = x1 - x0 > ZT.W - mg - md ? mg - x0 : clamp(dx, mg - x0, ZT.W - md - x1); dy = y1 - y0 > ZT.H - mh - mb ? mh - y0 : clamp(dy, mh - y0, ZT.H - mb - y1);
      dec.x = dx; dec.y = dy;
      items.forEach(function (I, i) {
        var r = rs[i];
        I.el.style.transform = 'translate(' + (r.x + dx).toFixed(1) + 'px,' + (r.y + dy).toFixed(1) + 'px)';
        I.boite.style.width = I.parts.style.width = r.w.toFixed(1) + 'px'; I.boite.style.height = I.parts.style.height = r.h.toFixed(1) + 'px';
        I.filet.style.width = I.tenu.style.width = r.w.toFixed(1) + 'px'; I.filet.style.top = (r.h - 1).toFixed(1) + 'px';
        ['num', 'nom', 'dur'].forEach(function (k) { I[k].style.transform = 'translate(' + r[k][0].toFixed(1) + 'px,' + r[k][1].toFixed(1) + 'px) scale(' + r[k][2].toFixed(3) + ')'; I[k].style.opacity = r[k][3].toFixed(3); });
        I.cur = r;
      });
      regle.style.transform = 'translate(' + (regle._x + dx) + 'px,' + (regle._y + dy) + 'px)'; total.style.transform = 'translate(' + (total._x + dx) + 'px,' + (total._y + dy) + 'px)';
      vars(zone, { 'o-boite': ss(h, .15, .8), 'o-filet': 1 - ss(h, .1, .6), 'o-parts': ss(h, 1.55, 2), 'o-ouvert': ss(h, 2.55, 3), 'o-regle': ss(h, 1.5, 2) * (1 - ss(h, 2.05, 2.4)) });
    }
    var M = Z.moteur(zone, { crans: crans, depart: o.depart || 0, fige: o.fige, pose: pose, surCran: parler,
      viser: function (pt) {
        if (!pret) return;
        if (pt) { var c = sous(zone, pt), it = c && c.closest && c.closest('.zt-item'); if (it) suivre(items.map(function (I) { return I.el; }).indexOf(it)); }
        var r = items[suivi].cur; if (r) A = { x: r.x + dec.x + r.w / 2, y: r.y + dec.y + r.h / 2 };
      },
      fleche: function (sens) { A = null; suivre(suivi + (sens === 'Right' || sens === 'Down' ? 1 : -1)); M.redessiner(); } });
    quand(zone, function () { composer(); suivre(suivi); A = null; M.poser(M.cible()); });
    return M;
  };

  /* ════ 3 · LE PLAN (d'après Le plan de salle et La scène vue de dessus) : la salle, les tables, une table, une place.
     donnees : { nom, groupes: [nom…], tables: [{ nom, x, y, places: [{ nom, groupe }] }], reperes: [{ nom, x, y }], l, h } ════ */
  Z.plan = function (zone, D, o) {
    o = o || {};
    var crans = [{ id: 'salle', nom: 'la salle' }, { id: 'tables', nom: 'les tables' }, { id: 'table', nom: 'une table' }, { id: 'place', nom: 'une place' }];
    var monde = el('div', 'zm-monde', null, zone), dit = faireDit(zone), RT = 74, P = [], S = o.suivi || 0, fils = el('div', null, null, monde), pret = false;
    if (D.titre) zone.setAttribute('data-titre', D.titre);
    var salle = el('div', 'zp-salle', null, monde); salle.style.width = D.l + 'px'; salle.style.height = D.h + 'px';
    (D.reperes || []).forEach(function (r) { var e = el('div', 'zm-et zp-repere', null, monde); e.style.left = r.x + 'px'; e.style.top = r.y + 'px'; el('p', null, r.nom, e); });
    D.tables.forEach(function (t, ti) {
      var te = el('div', 'zp-table', null, monde); te.style.left = (t.x - RT) + 'px'; te.style.top = (t.y - RT) + 'px'; te.style.width = te.style.height = 2 * RT + 'px';
      var tn = el('div', 'zm-et zp-tn', null, monde); tn.style.left = t.x + 'px'; tn.style.top = t.y + 'px'; var tp = el('p', null, null, tn); el('b', null, String(ti + 1), tp); t.nomEl = el('i', null, t.nom, tp); el('span', null, NOMBRES[t.places.length] + ' couverts', tp);
      t.el = te; t.tn = tn;
      t.places.forEach(function (p, k) {
        var a = (k + .5) / t.places.length * Math.PI * 2 - Math.PI / 2, x = t.x + Math.cos(a) * (RT + 22), y = t.y + Math.sin(a) * (RT + 22), cote = Math.cos(a) >= 0 ? 'd' : 'g';
        var s = el('button', 'zp-siege', null, monde); s.type = 'button'; s.style.left = x + 'px'; s.style.top = y + 'px'; s.setAttribute('aria-label', p.nom + ', ' + t.nom);
        var ne = el('div', 'zm-et zp-nom ' + cote, null, monde); ne.style.left = x + 'px'; ne.style.top = y + 'px'; var np = el('p', null, p.nom, ne); np.style[cote === 'd' ? 'left' : 'right'] = '15px'; el('span', null, D.groupes[p.groupe], np);
        var Q = { d: p, t: ti, k: k, x: x, y: y, x1: x, y1: y, cx: t.x, cy: t.y, cote: cote, siege: s, nom: ne, i: P.length };
        s.addEventListener('click', function (e) { e.stopPropagation(); suivre(Q.i); });
        P.push(Q);
      });
    });
    var fiche = el('div', 'zm-et zp-fiche', null, monde), ficheIn = el('div', null, null, fiche), mue = el('div', 'zp-mue', null, zone), mueL = el('div', null, null, mue), muer = null, h4 = null;
    function ligne(a, b, cls) { var f = el('i', 'zp-fil' + (cls ? ' ' + cls : ''), null, fils), dx = b.x - a.x, dy = b.y - a.y; f.style.left = a.x + 'px'; f.style.top = a.y + 'px'; f.style.width = Math.hypot(dx, dy) + 'px'; f.style.transform = 'rotate(' + Math.atan2(dy, dx) + 'rad)'; }
    function suivre(i) {
      S = (i + P.length) % P.length; var Q = P[S], T = D.tables[Q.t], n = T.places.length;
      var connus = P.filter(function (X) { return X !== Q && X.d.groupe === Q.d.groupe; }), ici = connus.filter(function (X) { return X.t === Q.t; });
      S_connus = connus; tisser();
      P.forEach(function (X) { var c = connus.indexOf(X) >= 0, loin = X.t !== Q.t; [X.siege, X.nom].forEach(function (e) { e.classList.toggle('suivi', X === Q); e.classList.toggle('connu', c); e.classList.toggle('loin', loin); }); });
      D.tables.forEach(function (t, k) { t.el.classList.toggle('suivie', k === Q.t); t.tn.classList.toggle('suivie', k === Q.t); });
      var g = P.filter(function (X) { return X.t === Q.t && X.k === (Q.k + n - 1) % n; })[0], d = P.filter(function (X) { return X.t === Q.t && X.k === (Q.k + 1) % n; })[0];
      fiche.className = 'zm-et zp-fiche ' + Q.cote; fiche.style.left = Q.x + 'px'; fiche.style.top = Q.y + 'px'; ficheIn.textContent = ''; ficheIn.style[Q.cote === 'd' ? 'left' : 'right'] = '30px'; ficheIn.style[Q.cote === 'd' ? 'right' : 'left'] = 'auto';
      h4 = el('h4', null, Q.d.nom, ficheIn); muer = Z.lettres(mueL, T.nom, Q.d.nom, 0, { aligne: 'gauche' });
      var p1 = el('p', null, T.nom.toLowerCase() + ' · ' + D.groupes[Q.d.groupe], ficheIn); void p1;
      var p2 = el('p', null, 'à sa gauche ', ficheIn); el('b', null, g.d.nom, p2); p2.appendChild(document.createTextNode(' · à sa droite ')); el('b', null, d.d.nom, p2);
      if (ici.length) { var p3 = el('p', null, 'connaît à cette table ', ficheIn); el('b', null, liste(ici.map(function (X) { return X.d.nom; })), p3); }
      var ailleurs = connus.length - ici.length, dedu = '';
      if (!ici.length) dedu = 'Ne connaît personne à cette table.'; else if (ailleurs > ici.length) { var tt = {}; connus.forEach(function (X) { if (X.t !== Q.t) tt[X.t] = (tt[X.t] || 0) + 1; }); var best = Object.keys(tt).sort(function (a, b) { return tt[b] - tt[a]; })[0]; dedu = 'Placé loin des siens : ' + NOMBRES[tt[best]] + ' sont à « ' + D.tables[best].nom + ' ».'; }
      if (dedu) el('p', 'deduit', dedu, ficheIn);
      S_dedu = dedu; S_ici = ici.length; parler();
    }
    var S_dedu = '', S_ici = 0, S_connus = [], ouvert = -1;
    function tisser() { fils.textContent = ''; var Q = P[S]; S_connus.forEach(function (X) { ligne(Q, X); }); }
    /* le rond de la table s'ouvre : les places partent du centre et gagnent leur cercle */
    function ouvrir(e) {
      if (Math.abs(e - ouvert) < .002) return; ouvert = e;
      P.forEach(function (Q) { Q.x = mix(Q.cx, Q.x1, e); Q.y = mix(Q.cy, Q.y1, e); Q.siege.style.left = Q.nom.style.left = Q.x + 'px'; Q.siege.style.top = Q.nom.style.top = Q.y + 'px'; });
      D.tables.forEach(function (t) { t.el.style.transform = 'scale(' + mix(.1, 1, e).toFixed(4) + ')'; });
      var F = P[S]; fiche.style.left = F.x + 'px'; fiche.style.top = F.y + 'px'; tisser();
    }
    function parler() {
      var c = clamp(Math.round(M ? M.cible() : 0), 0, 3), Q = P[S], T = D.tables[Q.t];
      if (c === 0) dire(dit, D.nom + ' · ' + P.length + ' couverts', 'Un point par personne. Les fils partent de celle qu’on tient.');
      else if (c === 1) dire(dit, NOMBRES[D.tables.length] + ' tables', 'Les prénoms viennent. En encre pleine, ceux qu’elle connaît.');
      else if (c === 2) dire(dit, T.nom, NOMBRES[T.places.length] + ' couverts, dont ' + NOMBRES[S_ici + 1] + ' du même cercle.');
      else dire(dit, T.nom + ' · ' + D.groupes[Q.d.groupe], Q.d.nom, S_dedu);
    }
    var V = Z.vue(zone, monde, { K: [.7, 1.4, 3, 5.6], tout: function () { return { x: 0, y: 0, w: D.l, h: D.h }; }, redessiner: function () { M.redessiner(); } });
    /* le nom de la table devient le nom de la place, lettre à lettre, en allant de la table à la fiche */
    function texte(n) { var r = document.createRange(); r.selectNodeContents(n); return r.getBoundingClientRect(); }
    function muter(h) {
      var o2 = ss(h, 1.55, 1.85); zone.style.setProperty('--o-mue', o2.toFixed(3)); if (!muer || o2 <= 0 || !h4) { mue.style.opacity = '0'; return; }
      var t = ss(h, 2.12, 2.9), T = D.tables[P[S].t], z = zone.getBoundingClientRect(), k = echelle(zone), a = texte(T.nomEl), b = texte(h4), H0 = mueL.offsetHeight || 74;
      var sa = a.height / k / H0, sb = b.height / k / H0, x = mix((a.left - z.left) / k, (b.left - z.left) / k, t), y = mix((a.top - z.top) / k, (b.top - z.top) / k, t);
      mue.style.opacity = o2.toFixed(3); mue.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + mix(sa, sb, t).toFixed(4) + ')'; muer.poser(t);
    }
    function pose(h) { V.appliquer(h); ouvrir(ss(h, .02, .92)); muter(h); vars(zone, { 'o-ouvre': ss(h, .02, .92), 'o-noms': ss(h, .62, 1.05), 'o-table': ss(h, 1.4, 2.1), 'o-loin': 1 - .78 * ss(h, 1.5, 2.2), 'o-place': ss(h, 2.5, 3), 'o-fichep': ss(h, 2.78, 3), 'o-mue2': ss(h, 2.05, 2.3), 'o-fils': 1 - .8 * ss(h, 2.3, 2.9), 'o-tables': 1 - ss(h, 2.4, 2.9), 'o-titre': 1 - ss(h, .15, .8) }); }
    function cadrer(i) {
      if (!pret) return; var Q = P[S], T = D.tables[Q.t], W = zone.clientWidth;
      if (i === 1) V.contenir({ x: T.x - RT - 150, y: T.y - RT - 60, w: 2 * RT + 300, h: 2 * RT + 120 }, { g: 60, d: 250, h: 50, b: 130 }, i);
      else if (i === 2) V.contenir({ x: T.x - RT - 130, y: T.y - RT - 46, w: 2 * RT + 260, h: 2 * RT + 92 }, { g: 60, d: 250, h: 40, b: 120 }, i);
      else if (i === 3) V.contenir({ x: Q.x - 6, y: Q.y - 6, w: 12, h: 12 }, Q.cote === 'd' ? { g: 240, d: Math.max(560, W * .42), h: 230, b: 300 } : { g: 620, d: 420, h: 230, b: 300 }, i);
      parler();
    }
    var M = Z.moteur(zone, { crans: crans, depart: o.depart || 0, fige: o.fige, pose: pose, surCible: cadrer, surCran: parler,
      viser: function (pt) {
        if (!pret) return;
        if (pt) { var w = V.monde(pt.x, pt.y), best = S, d = 150; P.forEach(function (X, i) { var dd = Math.hypot(X.x1 - w.x, X.y1 - w.y); if (dd < d) { d = dd; best = i; } }); if (best !== S) suivre(best); V.ancrer(pt.x, pt.y); return; }
        var s = V.ecran(P[S].x, P[S].y); V.ancrer(s.x, s.y);
      },
      fleche: function (sens) {
        var Q = P[S], n = D.tables[Q.t].places.length;
        if (sens === 'Left' || sens === 'Right') suivre(Q.i - Q.k + (Q.k + (sens === 'Right' ? 1 : n - 1)) % n);
        else { var t = (Q.t + (sens === 'Down' ? 1 : D.tables.length - 1)) % D.tables.length; suivre(P.filter(function (X) { return X.t === t; })[Math.min(Q.k, D.tables[t].places.length - 1)].i); }
        var s = V.ecran(P[S].x, P[S].y); V.poserSur(P[S].x, P[S].y, s.x, s.y); cadrer(Math.round(M.cible()));
      } });
    quand(zone, function () { var f = V.tout().k; V.regler([f, f * 1.95, f * 4.2, f * 7.4]); pret = true; suivre(S); var s = P[S]; V.poserSur(s.x, s.y, zone.clientWidth * .4, zone.clientHeight * .46); M.poser(M.cible()); });
    return M;
  };

  /* ════ 4 · LE CALENDRIER : l'année en cases, le mois, la semaine, le jour, l'heure.
     donnees : { annee, jours: { 'm-j': [{ nom, lieu, de, a (heures), type: 'fort' | 'pris' | 'aconf', avec }] } } ; la matière dit l'état : plein, fixé ; pointillé d'ambre, à confirmer ; creux, libre ════ */
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'], JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  function heure(x) { var hh = Math.floor(x), m = Math.round((x - hh) * 60); return hh + ' h' + (m ? ' ' + ('0' + m).slice(-2) : ''); }
  Z.calendrier = function (zone, D, o) {
    o = o || {};
    var crans = [{ id: 'annee', nom: 'l’année' }, { id: 'mois', nom: 'le mois' }, { id: 'semaine', nom: 'la semaine' }, { id: 'jour', nom: 'le jour' }, { id: 'heure', nom: 'l’heure' }];
    /* une seule matière : la case du jour. Au mois elle prend son chiffre ; à la semaine, les sept cases de la rangée tenue s'allongent en colonnes
       (ce qui est dessous et à côté se pousse) et leurs rendez-vous, des points, s'étirent en traits de leur durée ; au jour, la case tenue
       s'élargit en page, les traits deviennent des pavés nommés ; à l'heure, le pavé tenu grandit jusqu'à devenir sa fiche. */
    var monde = el('div', 'zm-monde', null, zone), dit = faireDit(zone), J = [], S = 0, EV = 0, pret = false, PAS = 50, C = 44, LM = 350, HM = 340, moisEl = [], sjEl = [];
    var GH = 170, DW = 236, DH = 96, T0 = 34, H0 = 8, H1 = 24;
    zone.setAttribute('data-titre', String(D.annee));
    for (var m = 0; m < 12; m++) {
      var mx = (m % 4) * (LM + 80), my = Math.floor(m / 4) * (HM + 70), me = el('div', 'zm-et zc-mois', null, monde); me.style.left = mx + 'px'; me.style.top = (my + 30) + 'px'; el('p', null, MOIS[m], me); moisEl.push({ el: me, x: mx, y: my + 30, m: m });
      var sj = el('div', 'zm-et zc-sj', null, monde); sj.style.left = mx + 'px'; sj.style.top = (my + 40) + 'px'; JOURS.forEach(function (n, k) { var s = el('span', null, n.slice(0, 3), sj); s.style.left = 'calc(' + (k * PAS + 5) + 'px / var(--ik))'; }); sjEl.push({ el: sj, x: mx, y: my + 40, m: m });
      var nb = new Date(D.annee, m + 1, 0).getDate(), w0 = (new Date(D.annee, m, 1).getDay() + 6) % 7;
      for (var d = 1; d <= nb; d++) {
        var wd = (w0 + d - 1) % 7, rg = Math.floor((w0 + d - 1) / 7), evs = D.jours[m + '-' + d] || [], x = mx + wd * PAS, y = my + 40 + rg * PAS;
        var type = evs.some(function (e) { return e.type === 'fort'; }) ? 'fort' : evs.some(function (e) { return e.type === 'pris'; }) ? 'pris' : evs.length ? 'aconf' : '';
        var je = el('div', 'zc-jour' + (type ? ' ' + type : ''), null, monde); je.style.left = x + 'px'; je.style.top = y + 'px';
        var ne = el('div', 'zm-et zc-n', null, je); el('b', null, String(d), ne); el('i', null, JOURS[wd], ne); if (evs.length) el('span', null, evs[evs.length > 1 && evs[1].type === 'fort' ? 1 : 0].mot || evs[0].nom, ne);
        J.push({ el: je, m: m, d: d, wd: wd, rg: rg, x: x, y: y, mx: mx, my: my, evs: evs, i: J.length, E: [] });
      }
    }
    /* les heures : des filets qui naissent du bord gauche de la case tenue */
    var heures = el('div', 'zc-heures', null, monde), HL = [];
    for (var hh = H0; hh <= H1; hh += 2) { var l = el('i', null, null, heures), n = el('div', 'zm-et zc-hn', null, heures); el('span', null, heure(hh % 24), n); HL.push({ l: l, n: n, h: hh }); }
    function sem(X) { var Q = J[S]; return X.m === Q.m && X.rg === Q.rg; }
    /* la géométrie de chaque case à la hauteur h : rien ne glisse que ce qui est poussé */
    function geo(h) { return { g: GH * ss(h, 1.25, 2.1), dw: DW * ss(h, 2.2, 3.05), dh: DH * ss(h, 2.2, 3.05) }; }
    function rect(X, G) {
      var Q = J[S], cq = Q.m % 4, rq = Math.floor(Q.m / 4), cx = X.m % 4, rx = Math.floor(X.m / 4), x = X.x, y = X.y;
      if (X.m === Q.m && X.wd > Q.wd) x += G.dw; if (rx === rq && cx > cq) x += G.dw;
      if (X.m === Q.m && X.rg > Q.rg) y += G.g + G.dh; if (rx > rq) y += G.g + G.dh;
      return { x: x, y: y, w: C + (X === Q ? G.dw : 0), h: C + (sem(X) ? G.g : 0) + (X === Q ? G.dh : 0) };
    }
    function bloc(m, G) { var Q = J[S], dx = (Math.floor(m / 4) === Math.floor(Q.m / 4) && m % 4 > Q.m % 4) ? G.dw : 0, dy = Math.floor(m / 4) > Math.floor(Q.m / 4) ? G.g + G.dh : 0; return { dx: dx, dy: dy }; }
    function suivre(i, ev) {
      var avant = J[S]; S = clamp(i, 0, J.length - 1); var Q = J[S]; EV = clamp(ev === undefined ? Math.max(0, Q.evs.map(function (e) { return e.type; }).indexOf('fort')) : ev, 0, Math.max(0, Q.evs.length - 1));
      J.forEach(function (X) { X.el.classList.toggle('suivi', X === Q); X.el.classList.toggle('hm', X.m !== Q.m); X.el.classList.toggle('hs', X.m === Q.m && X.rg !== Q.rg); X.el.classList.toggle('hj', sem(X) && X !== Q); X.el.classList.toggle('sem', sem(X)); });
      moisEl.forEach(function (e) { e.el.classList.toggle('suivi', e.m === Q.m); });
      /* les rendez-vous de la semaine tenue : un seul élément chacun, du point au pavé, du pavé à la fiche */
      J.forEach(function (X) { X.E.forEach(function (e) { e.el.remove(); }); X.E = []; });
      J.filter(sem).forEach(function (X) {
        X.evs.forEach(function (e, k) {
          var b = el('div', 'zc-ev' + (e.type === 'aconf' ? ' aconf' : '') + (e.type === 'fort' ? ' fort' : '') + (X === Q && k === EV ? ' suivi' : ''), null, X.el), lab = el('div', 'zc-evn', null, b), p = el('p', null, e.nom, lab);
          el('small', null, heure(e.de) + ' à ' + heure(e.a) + (e.lieu ? ' · ' + e.lieu : ''), p);
          var fi = null;
          if (X === Q && k === EV) {
            fi = el('div', 'zc-fi', null, b); var p1 = el('p', null, null, fi); el('b', null, 'de ' + heure(e.de) + ' à ' + heure(e.a), p1); if (e.lieu) p1.appendChild(document.createTextNode(' · ' + e.lieu));
            if (e.avec) el('p', null, 'avec ' + e.avec, fi);
            var av = X.evs.filter(function (x) { return x.a <= e.de; }).sort(function (a, c) { return c.a - a.a; })[0];
            if (e.type === 'aconf') el('p', 'deduit', 'Pas encore confirmé : la case reste en pointillé.', fi); else if (av) el('p', 'deduit', heure(e.de - av.a) + ' entre « ' + av.nom + ' » et ceci.', fi);
          }
          b.addEventListener('click', function (x) { x.stopPropagation(); if (X !== Q || k !== EV) suivre(X.i, k); });
          X.E.push({ el: b, lab: lab, fi: fi, d: e, k: k, tenu: X === Q && k === EV });
        });
      });
      if (pret && M) M.redessiner();
      parler();
    }
    function parler() {
      var c = clamp(Math.round(M ? M.cible() : 1), 0, 4), Q = J[S], pris = J.filter(function (X) { return X.evs.length; }).length, E = Q.evs[EV];
      if (c === 0) dire(dit, D.annee + ' · ' + pris + ' jours pris', 'Plein : fixé. Creux : libre.', 'Pointillé : à confirmer.');
      else if (c === 1) dire(dit, MOIS[Q.m] + ' · ' + J.filter(function (X) { return X.m === Q.m && X.evs.length; }).length + ' jours pris', 'Les jours prennent leur chiffre, puis un mot.');
      else if (c === 2) dire(dit, 'la semaine du ' + J.filter(sem)[0].d + ' ' + MOIS[Q.m], 'Les cases s’allongent : chaque rendez-vous est un trait de sa durée.');
      else if (c === 3) dire(dit, JOURS[Q.wd] + ' ' + Q.d + ' ' + MOIS[Q.m], Q.evs.length ? NOMBRES[Q.evs.length].replace(/^u/, 'U').replace(/^d/, 'D').replace(/^t/, 'T') + ' rendez-vous, de ' + heure(Q.evs[0].de) + ' à ' + heure(Q.evs[Q.evs.length - 1].a) + '.' : 'Rien ce jour-là.');
      else dire(dit, JOURS[Q.wd] + ' ' + Q.d + ' ' + MOIS[Q.m] + (E ? ' · ' + heure(E.de) : ''), E ? E.nom : 'Une heure libre.');
    }
    var V = Z.vue(zone, monde, { K: [.5, 1.9, 3.4, 4, 5], tout: function () { return { x: 0, y: 0, w: 4 * LM + 3 * 80, h: 3 * HM + 2 * 70 }; }, redessiner: function () { M.redessiner(); } });
    function pose(h) {
      V.appliquer(h);
      var G = geo(h), Q = J[S], pts = ss(h, 1.05, 1.5), etire = ss(h, 1.45, 2.15), large = ss(h, 2.2, 3.05), fiche = ss(h, 3.15, 3.95);
      J.forEach(function (X) { var r = rect(X, G), s = X.el.style; s.left = r.x + 'px'; s.top = r.y + 'px'; s.width = r.w + 'px'; s.height = r.h + 'px'; X.r = r; });
      moisEl.forEach(function (e) { var b = bloc(e.m, G); e.el.style.left = (e.x + b.dx) + 'px'; e.el.style.top = (e.y + b.dy) + 'px'; });
      sjEl.forEach(function (e) { var b = bloc(e.m, G); e.el.style.left = (e.x + b.dx) + 'px'; e.el.style.top = (e.y + b.dy) + 'px'; });
      /* les rendez-vous : un point à son heure, puis un trait de sa durée, puis un pavé ; le tenu devient sa fiche */
      J.filter(sem).forEach(function (X) {
        var r = X.r, A = r.h - T0 - 6, inner = r.w - 14;
        X.E.forEach(function (E) {
          var e = E.d, ty = T0 + (e.de - H0) / (H1 - H0) * A, th = (e.a - e.de) / (H1 - H0) * A, s = E.el.style, w, hh, top = ty, left = 7;
          var p = X === Q ? large : 0;
          w = mix(mix(5, 3, etire), inner, p); hh = mix(5, Math.max(5, th), etire);
          if (E.tenu) { var fh = Math.max(th, A * .5), ft = clamp(ty - (fh - th) * .3, T0, T0 + A - fh); top = mix(ty, ft, fiche); hh = mix(hh, fh, fiche); }
          s.left = left + 'px'; s.top = top.toFixed(2) + 'px'; s.width = w.toFixed(2) + 'px'; s.height = hh.toFixed(2) + 'px';
          s.opacity = (pts * (X === Q || !E.tenu ? 1 : 1) * (X === Q && !E.tenu ? 1 - .82 * fiche : 1)).toFixed(3);
          E.el.style.setProperty('--fs', (E.tenu ? mix(mix(12.5, 17, p), 46, fiche) : mix(12.5, 17, p)).toFixed(2));
          E.el.style.setProperty('--lab', (ss(h, 1.6, 2.05) * (X === Q ? 1 : 1 - ss(h, 2.3, 2.7))).toFixed(3));
          E.el.style.setProperty('--fi', ss(h, 3.72, 3.99).toFixed(3));
          E.el.classList.toggle('pave', p > .5); E.el.style.setProperty('--p', p.toFixed(3));
          var pl = ss(p, .55, .95); E.lab.style.left = mix(w + 6 / V.k, 12 / V.k, pl).toFixed(2) + 'px'; E.lab.style.top = mix(-2 / V.k, 7 / V.k, pl).toFixed(2) + 'px';
        });
      });
      /* les filets d'heure naissent du bord gauche de la page du jour */
      var r = Q.r, A2 = r.h - T0 - 6;
      HL.forEach(function (L) { var y = r.y + T0 + (L.h - H0) / (H1 - H0) * A2; L.l.style.left = r.x + 'px'; L.l.style.top = y + 'px'; L.l.style.width = (r.w * large) + 'px'; L.n.style.left = r.x + 'px'; L.n.style.top = y + 'px'; });
      vars(zone, { 'o-num': ss(h, .5, 1.1), 'o-mot': ss(h, .8, 1.4) * (1 - ss(h, 1.4, 1.8)), 'o-jn': ss(h, 1.6, 2.1), 'o-sj': ss(h, .5, 1) * (1 - ss(h, 1.3, 1.7)), 'o-mois': 1 - ss(h, 2.2, 2.8), 'o-heures': large, 'o-hn': ss(h, 2.75, 3.05), 'o-hm': 1 - .74 * ss(h, .45, 1.1), 'o-hs': 1 - .8 * ss(h, 1.4, 2.1), 'o-hj': 1 - .72 * ss(h, 2.4, 3.1), 'o-titre': 1 - ss(h, .15, .8), 'o-plein': 1 - large });
    }
    function cadrer(i) {
      if (!pret) return; var Q = J[S], G = geo(i), r = rect(Q, G), W = zone.clientWidth;
      if (i === 1) V.contenir({ x: Q.mx, y: Q.my, w: LM - 6, h: HM }, { g: 70, d: 260, h: 40, b: 120 }, i, true);
      else if (i === 2) V.contenir({ x: Q.mx - 4, y: Q.y - 30, w: LM, h: C + GH + 40 }, { g: 70, d: 260, h: 70, b: 150 }, i, true);
      else if (i >= 3) V.contenir({ x: r.x - 60, y: r.y - 6, w: r.w + 66, h: r.h + 12 }, { g: 100, d: 270, h: 40, b: 200 }, i, true);
      void W; parler();
    }
    var M = Z.moteur(zone, { crans: crans, depart: o.depart === undefined ? 1 : o.depart, fige: o.fige, pose: pose, surCible: cadrer, surCran: parler,
      viser: function (pt) {
        if (!pret) return;
        if (pt) { var c = sous(zone, pt), je = c && c.closest && c.closest('.zc-jour'); if (je && M.h() < 2.3) { var k = J.map(function (X) { return X.el; }).indexOf(je); if (k !== S) suivre(k); } V.ancrer(pt.x, pt.y); return; }
        var Q = J[S], s = V.ecran(Q.x + 22, Q.y + 22); V.ancrer(s.x, s.y);
      },
      fleche: function (sens) {
        var h = M.cible(), Q = J[S];
        if (h >= 2.5 && (sens === 'Up' || sens === 'Down')) suivre(S, EV + (sens === 'Down' ? 1 : -1)); else suivre(S + (sens === 'Right' ? 1 : sens === 'Left' ? -1 : sens === 'Down' ? 7 : -7));
        Q = J[S]; var s = V.ecran(Q.x + 22, Q.y + 22); V.poserSur(Q.x + 22, Q.y + 22, s.x, s.y); cadrer(Math.round(h));
      } });
    quand(zone, function () {
      var W = zone.clientWidth, H = zone.clientHeight, f = V.tout().k, km = clamp((H - 230) / HM, f * 1.6, 2.4), ks = Math.min((W - 400) / LM, (H - 260) / (C + GH + 40)), kj = Math.min((W - 440) / (C + DW + 66), (H - 250) / (C + GH + DH + 12));
      V.regler([f, km, Math.max(km * 1.2, ks), kj, kj * 1.001]); pret = true;
      if (!S) { var k = 0; J.forEach(function (X, i) { if (!k && (o.suivi ? X.m === o.suivi[0] && X.d === o.suivi[1] : X.m === 5 && X.evs.some(function (e) { return e.type === 'fort'; }))) k = i; }); S = k; }
      suivre(S); var Q = J[S]; V.poserSur(Q.mx + LM / 2, Q.my + HM / 2, (W - 200) / 2, H * .47); M.poser(M.cible());
    });
    return M;
  };

  /* ════ 5 · LE TISSU (d'après Le tissu) : les lignes du texte sont la trame, les fils sont des mots qui reviennent et passent dessus ou dessous.
     En montant, chaque ligne s'épaissit en trait d'encre, puis les fils tombent ; tout en haut, le livre entier en bandes.
     En descendant sur une ligne, la perle du fil tenu se couche et devient le soulignement de son mot.
     donnees : { titre, chapitres (comme le livre), fils: [{ nom, mots: ['cloche', …] }] } ; « dessus » est compté dans le texte, jamais écrit à la main ════ */
  Z.tissu = function (zone, D, o) {
    o = o || {};
    var crans = [{ id: 'tissu', nom: 'le tissu' }, { id: 'trame', nom: 'la trame' }, { id: 'page', nom: 'la page' }];
    var monde = el('div', 'zm-monde', null, zone), dit = faireDit(zone), LW = 600, LH = 31, L = [], C = [], F = [], y = 0, S = { f: o.fil || 0, l: 0 }, pret = false, HT = 0;
    if (D.titre) zone.setAttribute('data-titre', D.titre);
    function norme(m) { return m.toLowerCase().replace(/^[a-zà-ÿ]{1,2}[’']/, '').replace(/[^a-zà-ÿœ-]/g, ''); }
    D.chapitres.forEach(function (c, ci) {
      var ce = el('div', 'zm-et zw-chap', null, monde); ce.style.left = '-28px'; ce.style.top = (y + 4) + 'px'; el('p', null, c.nom, ce);
      var CH = { y: y, d: c, el: ce, l0: L.length };
      c.paragraphes.forEach(function (par) { par.forEach(function (t) {
        var p = el('p', 'zw-l', null, monde), Q = { el: p, y: y, c: ci, t: t, mots: [], i: L.length }; p.style.top = y + 'px';
        t.split(' ').forEach(function (m, j) { if (j) p.appendChild(document.createTextNode(' ')); Q.mots.push({ el: el('span', null, m, p), n: norme(m) }); });
        L.push(Q); y += LH;
      }); y += 9; });
      CH.h = y - CH.y; C.push(CH); y += 40;
    });
    HT = y - 40;
    D.fils.forEach(function (f, fi) {
      var x = 46 + fi * (LW - 92) / (D.fils.length - 1), fe = el('i', 'zw-fil', null, monde), ne = el('div', 'zm-et zw-nomfil', null, monde), Q = { d: f, x: x, el: fe, nom: ne, perles: [], dessus: [] };
      fe.style.left = x + 'px'; fe.style.height = (HT + 60) + 'px'; ne.style.left = x + 'px'; var b = el('button', null, f.nom, ne); b.type = 'button'; b.addEventListener('click', function (e) { e.stopPropagation(); tenir(fi, undefined); });
      L.forEach(function (ln) {
        var m = ln.mots.filter(function (w) { return f.mots.some(function (r) { return w.n.indexOf(r) === 0; }); })[0]; if (!m) return;
        var pe = el('i', 'zw-perle', null, monde); pe.addEventListener('click', function (e) { e.stopPropagation(); tenir(fi, ln.i); });
        Q.perles.push({ el: pe, l: ln, mot: m }); Q.dessus.push(ln.i);
      });
      F.push(Q);
    });
    function mesurer() {
      monde.style.transform = 'none'; zone.style.setProperty('--ik', '1'); var e = echelle(zone), r0 = monde.getBoundingClientRect();
      F.forEach(function (Q) { Q.perles.forEach(function (p) { var r = p.mot.el.getBoundingClientRect(); p.mx = (r.left - r0.left) / e; p.mw = r.width / e; }); });
      L.forEach(function (ln) { ln.w = ln.el.offsetWidth; });
      /* le dessous : là où une ligne couvre le fil et qu'il n'y passe pas dessus, le fil s'interrompt sous le trait (en creux) */
      var fs = parseFloat(getComputedStyle(L[0].el).fontSize) || 17, b0 = LH - .8 * fs - 3, b1 = LH - .3 * fs + 3;
      F.forEach(function (Q) {
        var arr = [], y0 = 60, H = HT + 60;
        L.forEach(function (ln) { if (Q.x > ln.w - 2 || Q.dessus.indexOf(ln.i) >= 0) return; var a2 = ln.y + 60 + b0, c2 = ln.y + 60 + b1; arr.push('var(--zw-f) ' + (y0 / H * 100).toFixed(3) + '%', 'var(--zw-f) ' + (a2 / H * 100).toFixed(3) + '%', 'transparent ' + (a2 / H * 100).toFixed(3) + '%', 'transparent ' + (c2 / H * 100).toFixed(3) + '%'); y0 = c2; });
        arr.push('var(--zw-f) ' + (y0 / H * 100).toFixed(3) + '%', 'var(--zw-f) 100%');
        Q.el.style.backgroundImage = 'linear-gradient(to bottom,var(--zw-f) 0,' + arr.join(',') + ')';
      });
    }
    function tenir(f, l) {
      S.f = (f + F.length) % F.length; var Q = F[S.f];
      if (l === undefined || Q.dessus.indexOf(l) < 0) { var best = Q.dessus[0], d = Infinity; Q.dessus.forEach(function (i) { var dd = Math.abs(i - (l === undefined ? S.l : l)); if (dd < d) { d = dd; best = i; } }); l = best; }
      S.l = l;
      F.forEach(function (X, a) { [X.el, X.nom].forEach(function (n) { n.classList.toggle('tenu', a === S.f); }); X.perles.forEach(function (p) { p.el.classList.toggle('tenu', a === S.f); p.el.classList.toggle('ici', a === S.f && p.l.i === S.l); }); });
      L.forEach(function (ln) { ln.el.classList.toggle('dessus', Q.dessus.indexOf(ln.i) >= 0); ln.el.classList.toggle('tenue', ln.i === S.l); ln.mots.forEach(function (w) { w.el.classList.remove('fil'); }); });
      Q.perles.forEach(function (p) { p.mot.el.classList.add('fil'); });
      C.forEach(function (c, k) { c.el.classList.toggle('ici', k === L[S.l].c); });
      parler(); if (pret && M) M.redessiner();
    }
    function parler() {
      var c = clamp(Math.round(M ? M.cible() : 1), 0, 2), Q = F[S.f], ln = L[S.l], ch = C[ln.c], ici = Q.dessus.filter(function (i) { return L[i].c === ln.c; }).length;
      if (c === 0) dire(dit, D.titre + ' · ' + L.length + ' lignes, ' + NOMBRES[F.length] + ' fils', Q.d.nom + ' passe dessus ' + Q.dessus.length + ' fois.');
      else if (c === 1) dire(dit, 'chapitre ' + (ln.c + 1) + ' · ' + ch.d.nom, Q.d.nom + ' y passe dessus ' + NOMBRES[ici] + ' fois, dessous le reste du temps.');
      else dire(dit, Q.d.nom + ' · ligne ' + (S.l + 1), ln.t);
    }
    var V = Z.vue(zone, monde, { K: [.2, 1, 1.7], tout: function () { return { x: -210, y: -150, w: LW + 240, h: HT + 190 }; }, redessiner: function () { M.redessiner(); } });
    function pose(h) {
      V.appliquer(h);
      var chute = 1 - ss(h, 1.22, 1.85), couche = ss(h, 1.3, 1.95), g = 1 - ss(h, 1.12, 1.75);
      vars(zone, { 'gras': g, 'o-fil': chute, 'o-chap': 1 - ss(h, 1.5, 2), 'o-titre': 1 - ss(h, .15, .8) });
      F.forEach(function (Q, a) {
        Q.el.style.transform = 'scaleY(' + chute.toFixed(4) + ')';
        Q.perles.forEach(function (p) {
          var yl = p.l.y, s = p.el.style;
          if (a === S.f) {     /* la perle du fil tenu se couche sous son mot : elle devient le soulignement */
            s.left = mix(Q.x - 3.5, p.mx, couche).toFixed(1) + 'px'; s.width = mix(7, p.mw, couche).toFixed(1) + 'px'; s.top = mix(yl + 5, yl + LH - 7, couche).toFixed(1) + 'px'; s.height = mix(LH - 12, 1.6, couche).toFixed(2) + 'px'; s.opacity = '1';
          } else {             /* les autres remontent avec leur fil */
            s.left = (Q.x - 3.5) + 'px'; s.width = '7px'; s.top = (yl + 5) + 'px'; s.height = (LH - 12) + 'px'; s.opacity = clamp((chute * (HT + 60) - (yl + 60)) / 50, 0, 1).toFixed(3);
          }
        });
      });
    }
    var parPointeur = false;
    function cadrer(i) {
      if (!pret) return; var ln = L[S.l], ch = C[ln.c];
      if (parPointeur) { parPointeur = false; parler(); return; }   /* au pointeur, ce qu'on vise reste dessous : on ne recadre jamais pendant ni après le geste */
      if (i === 1) V.contenir({ x: -200, y: ch.y - 130, w: LW + 220, h: ch.h + 150 }, { g: 60, d: 280, h: 30, b: 150 }, i, true);
      else if (i === 2) V.contenir({ x: 0, y: ln.y - 150, w: LW, h: 330 }, { g: 110, d: 300, h: 60, b: 160 }, i);
      parler();
    }
    var M = Z.moteur(zone, { crans: crans, depart: o.depart === undefined ? 1 : o.depart, fige: o.fige, pose: pose, surCible: cadrer, surCran: parler,
      viser: function (pt, h) {
        if (!pret) return;
        if (pt) {
          var w = V.monde(pt.x, pt.y), f = S.f, d = 60, l = S.l, dl = Infinity;
          if (h < 1.6) F.forEach(function (Q, a) { var dd = Math.abs(Q.x - w.x); if (dd < d) { d = dd; f = a; } });
          F[f].dessus.forEach(function (i) { var dd = Math.abs(L[i].y + LH / 2 - w.y); if (dd < dl) { dl = dd; l = i; } });
          if (f !== S.f || l !== S.l) tenir(f, l); V.ancrer(pt.x, pt.y); parPointeur = true; return;
        }
        var e = V.ecran(F[S.f].x, L[S.l].y + LH / 2); V.ancrer(e.x, e.y);
      },
      fleche: function (sens) {
        var Q = F[S.f], k = Q.dessus.indexOf(S.l);
        if (sens === 'Left' || sens === 'Right') tenir(S.f + (sens === 'Right' ? 1 : -1), S.l); else tenir(S.f, Q.dessus[clamp(k + (sens === 'Down' ? 1 : -1), 0, Q.dessus.length - 1)]);
        var e = V.ecran(LW / 2, L[S.l].y + LH / 2); V.poserSur(LW / 2, L[S.l].y + LH / 2, e.x, e.y); cadrer(Math.round(M.cible()));
      } });
    if (o.fige === undefined) zone.addEventListener('click', function (e) { if (zone._glisse) return; var p = e.target.closest('.zw-l'); if (!p) return; var i = L.map(function (x) { return x.el; }).indexOf(p); if (F[S.f].dessus.indexOf(i) >= 0) tenir(S.f, i); });
    quand(zone, function () {
      mesurer(); var H = zone.clientHeight, f = V.tout().k, kt = clamp((H - 250) / (C[0].h + 150), f * 1.8, 1.25); V.regler([f, kt, Math.max(1.7, kt * 1.7)]); pret = true;
      S.l = o.ligne === undefined ? F[S.f].dessus[Math.floor(F[S.f].dessus.length / 2)] : o.ligne; tenir(S.f, S.l);
      var ch = C[L[S.l].c]; V.poserSur(LW / 2 - 90, ch.y + ch.h / 2 - 40, (zone.clientWidth - 250) / 2, H * .46); M.poser(M.cible());
    });
    return M;
  };

  /* ════ 7 · SOUS LA LIGNE (d'après le proto du même nom) : on plonge d'un cran sur une ligne ; celles du dessus ne bougent pas,
     celles du dessous descendent d'un bloc, et le même papier s'ouvre entre elles. Ce qui s'y lit est compté dans le texte.
     donnees : { lignes: [phrase…], fils: [{ nom, mots }], chapitre } ════ */
  Z.sousLigne = function (zone, D, o) {
    o = o || {};
    var crans = [{ id: 'page', nom: 'la page' }, { id: 'dessous', nom: 'sous la ligne', sous: 'ce qu’elle porte' }];
    var dit = faireDit(zone), papier = el('div', 'zs-papier', null, zone), L = [], S = o.ligne || 0, dessous = el('div', 'zs-dessous', null, papier), dedans = el('div', null, null, dessous), pret = false, hn = 0;
    function norme(m) { return m.toLowerCase().replace(/^[a-zà-ÿ]{1,2}[’']/, '').replace(/[^a-zà-ÿœ-]/g, ''); }
    el('p', 'zs-chap', D.chapitre, papier);
    D.lignes.forEach(function (t, i) { var p = el('p', 'zs-l', null, papier); p.tabIndex = -1; t.split(' ').forEach(function (m, j) { if (j) p.appendChild(document.createTextNode(' ')); el('span', null, m, p); }); p.addEventListener('click', function () { tenir(i); }); L.push({ el: p, t: t, mots: t.split(' ').map(norme) }); });
    function tenir(i) {
      S = clamp(i, 0, L.length - 1); var Q = L[S];
      L.forEach(function (X, k) { X.el.classList.toggle('tenue', k === S); X.el.classList.toggle('apres', k > S); });
      Q.el.after(dessous); dedans.textContent = '';
      /* ce qu'elle porte : les fils qui y passent (plein), leur retour (déduit, compté), et ce qui n'est pas noté (un blanc) */
      var ici = D.fils.filter(function (f) { return Q.mots.some(function (w) { return f.mots.some(function (r) { return w.indexOf(r) === 0; }); }); });
      [].forEach.call(Q.el.children, function (s, j) { s.classList.toggle('fil', ici.some(function (f) { return f.mots.some(function (r) { return Q.mots[j].indexOf(r) === 0; }); })); });
      var a = el('div', 'zs-n', null, dedans); el('small', null, 'ce qui y passe', a);
      if (ici.length) el('p', null, liste(ici.map(function (f) { return f.nom.toLowerCase(); })), a); else el('p', 'manque', 'aucun fil ne passe ici', a);
      var b = el('div', 'zs-n deduit', null, dedans); el('small', null, 'déduit du texte', b);
      if (ici.length) { var f = ici[0], apres = -1, n = 0; L.forEach(function (X, k) { var oui = X.mots.some(function (w) { return f.mots.some(function (r) { return w.indexOf(r) === 0; }); }); if (oui) { n++; if (k > S && apres < 0) apres = k; } }); el('p', null, f.nom + ' passe ' + NOMBRES[Math.min(n, 12)] + ' fois dans la page' + (apres >= 0 ? ' ; la prochaine, ' + NOMBRES[apres - S] + ' ligne' + (apres - S > 1 ? 's' : '') + ' plus bas.' : ' ; c’est la dernière.'), b); }
      else el('p', null, 'Une ligne de passage : elle ne tient à rien d’autre.', b);
      var c = el('div', 'zs-n', null, dedans); el('small', null, 'ce qu’elle tait', c); el('p', 'manque', 'rien n’est noté · à écrire', c);
      hn = dedans.offsetHeight; parler(); if (pret && M) M.redessiner();
    }
    function parler() { var c = clamp(Math.round(M ? M.cible() : 0), 0, 1); if (c === 0) dire(dit, D.chapitre + ' · ' + L.length + ' lignes', 'Une ligne est tenue. Descends dessus.'); else dire(dit, 'sous la ligne ' + (S + 1), L[S].t); }
    function pose(h) {
      var e = clamp(h, -.06, 1.06), y = e * hn;
      dessous.style.height = Math.max(0, y).toFixed(1) + 'px'; dedans.style.opacity = ss(h, .25, .9).toFixed(3); dedans.style.transform = 'translateY(' + ((1 - ss(h, 0, 1)) * -14).toFixed(1) + 'px)';
      /* la ligne tenue reste où elle est : le papier remonte de ce que le dessous prend, au-delà du milieu */
      var r = L[S].el.offsetTop, H = zone.clientHeight, cible = clamp(H * .3 - r, H - 150 - papier.offsetHeight, 60);
      papier.style.transform = 'translateY(' + mix(clamp(H * .42 - r, H - 150 - (papier.offsetHeight - y), 60), cible, ss(h, 0, 1)).toFixed(1) + 'px)';
      vars(zone, { 'o-autres': 1 - .55 * ss(h, .1, 1) });
    }
    var M = Z.moteur(zone, { crans: crans, depart: o.depart || 0, fige: o.fige, pose: pose, surCran: parler,
      viser: function (pt) { if (!pt) return; var c = sous(zone, pt), p = c && c.closest && c.closest('.zs-l'); if (p) tenir(L.map(function (X) { return X.el; }).indexOf(p)); },
      fleche: function (sens) { tenir(S + (sens === 'Down' || sens === 'Right' ? 1 : -1)); } });
    quand(zone, function () { pret = true; tenir(S); M.poser(M.cible()); });
    return M;
  };

  /* ════ 8 · CE QUE CHACUN SAIT (d'après le proto du même nom) : au milieu, des phrases ; autour, des noms.
     On s'approche d'un nom : il grandit et vient en haut, les phrases se trient (au-dessus ce qu'il sait, dessous ce qu'il ignore) ;
     un cran plus bas, ce qu'il est seul à savoir vient au centre, en grand.
     donnees : { gens: [nom…], faits: [{ t, sait: [indices] }] } ════ */
  Z.savoir = function (zone, D, o) {
    o = o || {};
    var crans = [{ id: 'tous', nom: 'tout le monde' }, { id: 'un', nom: 'un nom', sous: 'ce qui est su, ce qui est ignoré' }, { id: 'seul', nom: 'lui seul' }];
    var dit = faireDit(zone), S = o.suivi || 0, N = [], Fa = [], ligne = el('i', 'zk-ligne', null, zone), haut = el('p', 'zk-cote', 'ce qui est su', zone), bas = el('p', 'zk-cote', 'ce qui est ignoré', zone), pret = false, G = null;
    D.gens.forEach(function (n, i) { var b = el('button', 'zk-nom', n, zone); b.type = 'button'; b.addEventListener('click', function (e) { e.stopPropagation(); tenir(i); if (M.cible() < .5) M.aller(1, null); }); N.push({ el: b, nom: n, i: i }); });
    D.faits.forEach(function (f) { var p = el('p', 'zk-fait', f.t, zone); Fa.push({ el: p, d: f }); });
    function composer() {
      var W = zone.clientWidth - 250, H = zone.clientHeight - 90, cx = W / 2 + 10, cy = H / 2 + 6, rx = Math.min(W * .4, 560), ry = H * .37, lf = 300, n = N.length;
      N.forEach(function (X, i) { var a = i / n * Math.PI * 2 - Math.PI / 2; X.p0 = { x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry, k: 1 }; });
      /* le repos : les phrases en trois colonnes serrées au milieu, petites */
      Fa.forEach(function (X, i) { var col = i % 3, rg = Math.floor(i / 3), nr = Math.ceil(Fa.length / 3); X.p0 = { x: cx + (col - 1) * 215, y: cy + (rg - (nr - 1) / 2) * 44, k: .62, o: .5 }; });
      /* un nom tenu : lui en haut au centre, les autres en bas ; les phrases en deux rangs de part et d'autre d'un trait */
      var sait = Fa.filter(function (X) { return X.d.sait.indexOf(S) >= 0; }), ignore = Fa.filter(function (X) { return X.d.sait.indexOf(S) < 0; }), seul = sait.filter(function (X) { return X.d.sait.length === 1; });
      var autres = N.filter(function (X, i) { return i !== S; });
      N.forEach(function (X, i) { if (i === S) X.p1 = { x: cx, y: 74, k: 2.6 }; else { var q = autres.indexOf(X); X.p1 = { x: cx + (q - (autres.length - 1) / 2) * Math.min(230, (W - 120) / autres.length), y: H - 120, k: .78 }; } X.p2 = X.p1; });
      /* chaque rangée garde l'ordre de gauche à droite du tas de départ : les trajets ne se croisent pas */
      function trier(l) { return l.slice().sort(function (a, b) { return a.p0.x - b.p0.x || a.p0.y - b.p0.y; }); }
      sait = trier(sait); ignore = trier(ignore);
      function rang(l, y0, sens, op) { var par = Math.max(1, Math.min(4, Math.floor((W - 60) / (lf + 30)))); l.forEach(function (X, i) { var c = i % par, r = Math.floor(i / par), nb = Math.min(par, l.length - r * par); X.p1 = { x: cx + (c - (nb - 1) / 2) * (lf + 30), y: y0 + sens * r * 62, k: 1, o: op }; }); }
      var ym = cy + 10; rang(sait, ym - 54, -1, 1); rang(ignore, ym + 54, 1, .42);
      sait.forEach(function (X, i) { X.r = sait.length > 1 ? i / (sait.length - 1) : 0; }); ignore.forEach(function (X, i) { X.r = ignore.length > 1 ? i / (ignore.length - 1) : 0; });
      Fa.forEach(function (X) { X.sait = sait.indexOf(X) >= 0; X.seul = seul.indexOf(X) >= 0; X.el.classList.toggle('ignore', !X.sait); X.el.classList.toggle('seul', X.seul); });
      /* lui seul : ce qu'il est seul à savoir vient au centre, en grand ; le reste s'écarte et pâlit */
      Fa.forEach(function (X) { X.p2 = { x: X.p1.x + (X.p1.x - cx) * .22, y: X.p1.y + (X.sait ? -64 : 78), k: .8, o: X.sait ? .3 : .16 }; });
      seul.forEach(function (X, i) { X.p2 = { x: cx, y: ym - 10 + (i - (seul.length - 1) / 2) * 138, k: 2.1, o: 1 }; });
      G = { cx: cx, ym: ym, W: W, seul: seul.length, sait: sait.length, ignore: ignore.length }; pret = true;
    }
    function tenir(i) { S = (i + N.length) % N.length; N.forEach(function (X, k) { X.el.classList.toggle('tenu', k === S); }); composer(); parler(); if (M) M.redessiner(); }
    function parler() {
      var c = clamp(Math.round(M ? M.cible() : 0), 0, 2), n = N[S].nom;
      if (c === 0) dire(dit, NOMBRES[N.length] + ' noms, ' + NOMBRES[Math.min(12, Fa.length)] + ' phrases', 'Approche-toi d’un nom.');
      else if (c === 1) dire(dit, n, 'Sait ' + NOMBRES[G.sait] + ' choses, en ignore ' + NOMBRES[G.ignore] + '.');
      else dire(dit, n + ' · ce que ce nom est seul à savoir', G.seul ? Fa.filter(function (X) { return X.seul; })[0].d.t : 'Rien : tout ce qui est su ici, un autre le sait aussi.', G.seul > 1 ? 'et ' + NOMBRES[G.seul - 1] + ' autre' + (G.seul > 2 ? 's' : '') : '');
    }
    /* les noms d'abord, puis ce qui est ignoré descend, puis ce qui est su monte : trois temps, pour que rien ne se croise en même temps */
    function entre(X, h) {
      var a = h < 1 ? X.p0 : X.p1, b = h < 1 ? X.p1 : X.p2, u = h < 1 ? h : h - 1, t;
      if (h < 1) t = X.nom ? ss(u, 0, .42) : X.sait ? ss(u, .56 + X.r * .14, .86 + X.r * .14) : ss(u, .3 + X.r * .12, .62 + X.r * .12);
      else t = X.nom ? ss(u, 0, .5) : X.seul ? ss(u, .35, 1) : ss(u, 0, .55);
      return { x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), k: mix(a.k, b.k, t), o: a.o === undefined ? 1 : mix(a.o, b.o, t) };
    }
    function pose(h) {
      if (!pret) return;
      N.forEach(function (X, i) { var p = entre(X, h); X.el.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px) translate(-50%,-50%) scale(' + p.k.toFixed(3) + ')'; X.el.style.opacity = (i === S ? 1 : mix(1, .5, ss(h, .2, 1))).toFixed(3); X.el.style.fontVariationSettings = "'wght' " + Math.round(i === S ? mix(400, 300, ss(h, 0, 1)) : 400); });
      Fa.forEach(function (X) { var p = entre(X, h); X.el.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px) translate(-50%,-50%) scale(' + p.k.toFixed(3) + ')'; X.el.style.opacity = p.o.toFixed(3); });
      var t = ss(h, .35, 1) * (1 - ss(h, 1.2, 1.8)); ligne.style.transform = 'translate(' + (G.cx - G.W * .4 * t) + 'px,' + G.ym + 'px) scaleX(' + t.toFixed(4) + ')'; ligne.style.width = (G.W * .8) + 'px';
      haut.style.opacity = bas.style.opacity = t.toFixed(3); haut.style.transform = 'translate(' + (G.cx - G.W * .4) + 'px,' + (G.ym - 26) + 'px)'; bas.style.transform = 'translate(' + (G.cx - G.W * .4) + 'px,' + (G.ym + 10) + 'px)';
      vars(zone, { 'o-barre': ss(h, .5, 1) });
    }
    var M = Z.moteur(zone, { crans: crans, depart: o.depart || 0, fige: o.fige, pose: pose, surCran: parler,
      viser: function (pt) { if (!pt || !pret) return; var best = S, d = 170; N.forEach(function (X, i) { var p = entre(X, M.h()), dd = Math.hypot(p.x - pt.x, p.y - pt.y); if (dd < d) { d = dd; best = i; } }); if (best !== S) tenir(best); },
      fleche: function (sens) { tenir(S + (sens === 'Right' || sens === 'Down' ? 1 : -1)); } });
    quand(zone, function () { tenir(S); M.poser(M.cible()); });
    return M;
  };

  /* ════ 6 · CHACUN SON ÉCHELLE (d'après le proto du même nom) : plusieurs objets côte à côte, chacun à sa hauteur ; un seul descend.
     el : le rang ; donnees : { items: [{ nom, duree, parts: [{ nom, poids, fort, accords: [..] }] }] } ; options : { departs: [0, 1, 0, 0] } ════ */
  Z.chacun = function (rang, D, o) {
    o = o || {}; rang.classList.add('ze-rang');
    var NOMS = ['un trait', 'ses parties', 'ses mesures', 'une mesure'], rnd = hasard(11);
    return D.items.map(function (d, i) {
      var col = el('section', 'ze-col', null, rang), tete = el('header', null, null, col); el('h3', null, d.nom, tete); var p = el('p', null, null, tete); el('b', null, duree(d.duree), p);
      var corps = el('div', 'ze-corps', null, col), mes = [], n = 0, pied = el('div', 'ze-pied', null, col), nomH = el('i', null, NOMS[0], pied), traits = el('span', null, null, pied), tr = NOMS.map(function () { return el('b', null, null, traits); });
      d.parts.forEach(function (pt) {
        var pe = el('div', 'ze-part' + (pt.fort ? ' fort' : ''), null, corps); pe.style.setProperty('--f', pt.poids); el('em', null, pt.nom, pe);
        for (var k = 0; k < pt.poids; k++) { n++; var me = el('div', 'ze-mes', null, pe); me.style.setProperty('--d', (.35 + rnd() * .65).toFixed(2)); el('b', null, pt.accords[k % pt.accords.length], me); el('span', null, 'mesure ' + n + ' · ' + pt.nom, me); mes.push(me); }
      });
      p.appendChild(document.createTextNode(n + ' mesures')); col.setAttribute('aria-label', d.nom + '. Ctrl et la molette, ou plus et moins, pour changer de hauteur.');
      var tenue = Math.floor(n * .4);
      function tenir(k) { tenue = clamp(k, 0, mes.length - 1); mes.forEach(function (m, q) { m.classList.toggle('suivie', q === tenue); m.style.setProperty('--g', q === tenue ? 1 : 0); }); }
      mes.forEach(function (m, q) { m.addEventListener('click', function () { tenir(q); }); });
      tenir(tenue);
      var M = Z.moteur(col, { nu: true, rail: false, crans: NOMS.map(function (x, k) { return { id: 'h' + k, nom: x }; }), depart: (o.departs || [])[i] || 0,
        pose: function (h) { vars(col, { h: h, p: ss(h, .1, 1), m: ss(h, 1, 2), u: ss(h, 2, 3) }); },
        surCran: function (c) { nomH.textContent = NOMS[c]; col.classList.toggle('bas', c > 0); tr.forEach(function (b, k) { b.className = k === c ? 'ici' : k < c ? 'passe' : ''; }); },
        viser: function (pt) { if (!pt) return; var r = col.getBoundingClientRect(), c = document.elementFromPoint(r.left + pt.x, r.top + pt.y), m = c && c.closest && c.closest('.ze-mes'); if (m) tenir(mes.indexOf(m)); },
        fleche: function (sens) { tenir(tenue + (sens === 'Right' || sens === 'Down' ? 1 : -1)); } });
      requestAnimationFrame(function () { M.poser(M.cible()); });
      return M;
    });
  };

  /* ════ LA PLANCHE : les hauteurs d'une navigation, figées côte à côte (pour une diapositive). fabrique(zone, hauteur) construit la navigation figée. ════ */
  Z.planche = function (cible, fabrique, noms) {
    cible.classList.add('zm-planche');
    noms.forEach(function (nom, i) {
      var f = el('figure', null, null, cible), v = el('div', 'zm-vignette', null, f), zone = el('div', null, null, v), c = el('figcaption', null, null, f); el('b', null, String(i + 1), c); c.appendChild(document.createTextNode(nom));
      function taille() { zone.style.transform = 'scale(' + (v.clientWidth / 1280).toFixed(4) + ')'; }
      fabrique(zone, i); taille(); if (window.ResizeObserver) new ResizeObserver(taille).observe(v);
    });
  };

  /* ════ La page : les exemples, écrits pour elle ════ */
  function debut() {
    function par(id) { return document.getElementById(id); }
    Z.ici = {};   /* les navigations de la page, par id : KitEtude.zoom.ici['z-livre'].aller(2) */
    var LIVRE = { titre: 'Le bac', chapitres: [
      { nom: 'Le quai', paragraphes: [['Le bac part à six heures, quand la lumière touche à peine l’eau.', 'Sur le quai, une femme compte ses caisses à voix basse.', 'Personne ne lui demande ce qu’elles contiennent.'], ['Le passeur la connaît depuis trente ans.', 'Il lui tend la main sans un mot, et elle monte.'], ['Derrière eux, la ville s’éveille lentement.', 'Une cloche sonne, puis une autre.', 'L’eau garde le silence.']] },
      { nom: 'Le fleuve', paragraphes: [['Au milieu du fleuve, le courant change de couleur.', 'Le passeur dit que l’eau se souvient de tout ce qu’elle a porté.', 'La femme sourit sans le croire.'], ['Un enfant s’est caché entre les caisses.', 'Il regarde la rive s’éloigner, les yeux grands ouverts.'], ['Le vent se lève.', 'Les cordes chantent contre le mât.', 'Le bac tient son cap.']] },
      { nom: 'L’enfant', paragraphes: [['On le découvre quand il éternue.', 'Il dit qu’il veut voir l’autre rive, celle dont parle son père.', 'Le passeur hausse les épaules et lui confie une corde.'], ['L’enfant la tient à deux mains.', 'Il n’a jamais rien tenu d’aussi lourd, ni d’aussi vivant.'], ['La femme ouvre une caisse.', 'Elle en sort une lanterne, et la lui donne pour la nuit.']] },
      { nom: 'La brume', paragraphes: [['La brume tombe d’un coup, comme un drap.', 'On ne voit plus ni la rive ni l’eau.', 'Le passeur ferme les yeux pour mieux entendre.'], ['L’enfant allume la lanterne.', 'Sa lumière ne va pas loin, mais elle suffit à compter les caisses.'], ['Quelque part, une cloche répond.', 'C’est l’autre rive, dit la femme.', 'Elle a reconnu sa voix.']] },
      { nom: 'L’autre rive', paragraphes: [['Le bac touche le quai sans un bruit.', 'Des mains attrapent la corde que l’enfant leur lance.', 'Il ne veut plus la lâcher.'], ['La femme descend la première.', 'Elle laisse une caisse au passeur, la plus petite.'], ['Dans la caisse, il y a une cloche.', 'Elle sonnera pour le prochain départ.']] },
      { nom: 'Le retour', paragraphes: [['Le soir, le bac repart à vide.', 'Le passeur accroche la cloche au mât.', 'L’eau la fait tinter doucement.'], ['Sur la rive, l’enfant lève sa lanterne.', 'Sa lumière traverse le fleuve mieux que lui.'], ['Le passeur répond d’un coup de cloche.', 'Puis la brume referme le passage.']] }] };
    var GAB = [['intro', 2, 0, ['Am']], ['couplet', 8, 0, ['Am', 'F', 'C', 'G']], ['refrain', 8, 1, ['F', 'C', 'G', 'Am']], ['couplet', 8, 0, ['Am', 'F', 'C', 'G']], ['refrain', 8, 1, ['F', 'C', 'G', 'Am']], ['pont', 4, 0, ['Dm', 'E']], ['refrain', 8, 1, ['F', 'C', 'G', 'Am']], ['fin', 2, 0, ['Am']]];
    function parts(nb) { return GAB.slice(0, nb).concat(nb < GAB.length ? [GAB[GAB.length - 1]] : []).map(function (g) { return { nom: g[0], poids: g[1], fort: !!g[2], accords: g[3] }; }); }
    var ALBUM = { nom: 'Le bac, l’album', items: [['Ouverture', 95, 2], ['Le quai', 214, 7], ['Six heures', 187, 5], ['La corde', 243, 8], ['Entre deux rives', 301, 8], ['Lanterne', 176, 5], ['La brume', 268, 8], ['Cloche', 152, 4], ['Le passage', 229, 7], ['À vide', 198, 6], ['L’autre rive', 255, 8], ['Retour', 142, 3]].map(function (t) { return { nom: t[0], duree: t[1], parts: parts(t[2]) }; }) };
    var PRENOMS = 'Ada,Basile,Camille,Dario,Élise,Farid,Gaëlle,Hugo,Inès,Jonas,Katia,Léo,Maya,Nour,Octave,Paula,Quentin,Rosa,Sacha,Théa,Ugo,Vera,Wassim,Xénia,Yann,Zoé,Abel,Bianca,Côme,Dalia,Enzo,Flore,Gaspard,Hana,Ilan,Jade,Kenzo,Lila,Marin,Nina,Oscar,Perle,Rémi,Salomé,Tom,Uma,Victor,Wanda'.split(',');
    var GROUPES = ['la famille', 'les amis d’enfance', 'le bureau', 'les voisins', 'les musiciens', 'les cousins'], TABLES = [];
    GROUPES.forEach(function (g, t) { var pl = []; for (var k = 0; k < 8; k++) pl.push({ nom: '', groupe: k < 6 ? t : (t + 1) % 6 }); TABLES.push({ nom: 'Table ' + ['un', 'deux', 'trois', 'quatre', 'cinq', 'six'][t], x: 300 + (t % 3) * 500, y: 270 + Math.floor(t / 3) * 430, places: pl }); });
    var q = 0; GROUPES.forEach(function (g, gi) { TABLES.forEach(function (t) { t.places.forEach(function (p) { if (p.groupe === gi && !p.nom) p.nom = PRENOMS[q++]; }); }); });
    TABLES.forEach(function (t) { t.places = [t.places[0], t.places[6], t.places[1], t.places[2], t.places[3], t.places[7], t.places[4], t.places[5]]; });
    var SALLE = { nom: 'Le dîner', titre: 'Dîner', l: 1600, h: 960, groupes: GROUPES, tables: TABLES, reperes: [{ nom: 'la scène', x: 800, y: 44 }, { nom: 'l’entrée', x: 800, y: 920 }] };
    var VILLES = ['Lyon', 'Nantes', 'Lille', 'Bordeaux', 'Marseille', 'Rennes', 'Strasbourg', 'Toulouse'], rnd = hasard(5), JOURSD = {}, AN = 2027;
    for (var m = 0; m < 12; m++) { var nb = new Date(AN, m + 1, 0).getDate(); for (var d = 1; d <= nb; d++) {
      var wd = (new Date(AN, m, d).getDay() + 6) % 7, evs = [], r = rnd(), r2 = rnd(), r3 = rnd();
      if (r3 < .05) evs.push({ nom: 'Radio', mot: 'radio ?', lieu: 'à confirmer', de: 11, a: 12, type: 'aconf', avec: 'la voix seule' });
      if ((wd === 4 || wd === 5) && r2 < .4) { var v = VILLES[Math.floor(rnd() * VILLES.length)]; evs.push({ nom: 'Balance', mot: 'balance', lieu: v, de: 16, a: 17.5, type: 'pris', avec: 'toute l’équipe' }); evs.push({ nom: 'Concert à ' + v, mot: v, lieu: 'la grande salle', de: 20.5, a: 22.5, type: 'fort', avec: 'les six musiciens' }); }
      else if (wd < 5 && r < .15) evs.push({ nom: 'Répétition', mot: 'répétition', lieu: 'le studio', de: 14, a: 18, type: 'pris', avec: 'les cordes et le piano' });
      if (evs.length) JOURSD[m + '-' + d] = evs.sort(function (a, b) { return a.de - b.de; });
    } }
    var FILS = [['La cloche', ['cloche']], ['L’eau', ['eau', 'fleuve', 'courant']], ['La lanterne', ['lanterne', 'lumière']], ['Le passeur', ['passeur']], ['L’enfant', ['enfant']], ['La femme', ['femme', 'elle']], ['La corde', ['corde']], ['La rive', ['rive', 'quai']], ['Les caisses', ['caisse']]].map(function (f) { return { nom: f[0], mots: f[1] }; });
    var SAVOIR = { gens: ['Le passeur', 'La femme', 'L’enfant', 'Le père', 'La ville', 'Le lecteur'], faits: [
      ['Le bac part à six heures.', [0, 1, 4, 5]], ['Les caisses contiennent des lanternes et une cloche.', [1, 5]], ['Un enfant s’est caché à bord.', [2, 5]], ['L’eau se souvient de ce qu’elle porte.', [0]],
      ['Il existe une autre rive.', [0, 1, 2, 3, 5]], ['La cloche répondra depuis l’autre rive.', [1]], ['L’enfant ne reviendra pas ce soir.', [5]], ['Le passeur la connaît depuis trente ans.', [0, 1, 5]],
      ['La plus petite caisse est pour le passeur.', [1]], ['Son fils est parti voir l’autre rive.', [3, 2]], ['La brume tombe sans prévenir.', [0, 4]], ['Une lumière a traversé le fleuve.', [0, 2, 4, 5]]].map(function (f) { return { t: f[0], sait: f[1] }; }) };
    if (par('z-livre')) Z.ici['z-livre'] = Z.livre(par('z-livre'), LIVRE, { suivi: [3, 3], mot: 3 });
    if (par('z-liste')) Z.ici['z-liste'] = Z.liste(par('z-liste'), ALBUM, { suivi: 4 });
    if (par('z-plan')) Z.ici['z-plan'] = Z.plan(par('z-plan'), SALLE, { suivi: 9 });
    if (par('z-cal')) Z.ici['z-cal'] = Z.calendrier(par('z-cal'), { annee: AN, jours: JOURSD }, {});
    if (par('z-tissu')) Z.ici['z-tissu'] = Z.tissu(par('z-tissu'), { titre: 'Le bac', chapitres: LIVRE.chapitres, fils: FILS }, { fil: 0 });
    if (par('z-sous')) Z.ici['z-sous'] = Z.sousLigne(par('z-sous'), { chapitre: 'La brume', lignes: [].concat.apply([], LIVRE.chapitres[3].paragraphes.concat(LIVRE.chapitres[4].paragraphes)), fils: FILS }, { ligne: 3 });
    if (par('z-savoir')) Z.ici['z-savoir'] = Z.savoir(par('z-savoir'), SAVOIR, { suivi: 1 });
    if (par('z-lettres')) (function () {
      var c = par('z-lettres'), g = el('div', 'zm-mots-grille', null, c), L = [], PAIRES = [['Le bac', 'câble', 'une anagramme'], ['Marie', 'aimer', 'la majuscule change de place'], ['la nacre', 'l’écran', 'une lettre de trop, une qui manque'], ['Table deux', 'Quentin', 'ce qui reste d’un nom dans l’autre']];
      PAIRES.forEach(function (p) { var f = el('figure', null, null, g), m = el('div', null, null, f); el('figcaption', null, p[0] + ' → ' + p[1] + ' · ' + p[2], f); L.push(Z.lettres(m, p[0], p[1], 0)); });
      var r = el('div', 'ke-reglage', null, c), lp = el('p', 'ke-petit', null, r); el('span', null, 'de l’un à l’autre', lp); el('output', null, '0 %', lp);
      var cu = el('div', 'ke-curseur', null, r); cu.setAttribute('data-min', '0'); cu.setAttribute('data-max', '100'); cu.setAttribute('data-valeur', '0'); cu.setAttribute('data-unite', '%'); cu.setAttribute('aria-label', 'De l’un à l’autre');
      if (KE.curseur) KE.curseur(cu);
      cu.addEventListener('ke:change', function (e) { var t = e.detail.valeur / 100; L.forEach(function (x) { x.poser(t); }); });
      Z.ici['z-lettres'] = { poser: function (t) { L.forEach(function (x) { x.poser(t); }); }, aller: function () {} };
    })();
    if (par('z-chacun')) Z.ici['z-chacun'] = Z.chacun(par('z-chacun'), { items: [ALBUM.items[1], ALBUM.items[4], ALBUM.items[7], ALBUM.items[10]] }, { departs: [0, 1, 0, 0] });
    if (par('z-planche')) Z.planche(par('z-planche'), function (zone, i) { Z.livre(zone, LIVRE, { fige: i, suivi: [3, 3], mot: 3 }); }, ['le livre', 'le chapitre', 'la page', 'la phrase', 'le mot']);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', debut); else debut();
})();
