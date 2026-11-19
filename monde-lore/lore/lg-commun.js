/* Ctrl + molette (et le pincement du pavé tactile) appartiennent à la page : jamais le zoom du navigateur, dès le chargement et partout sur l'écran. */
window.addEventListener('wheel', function (e) { if (e.ctrlKey || e.metaKey) e.preventDefault(); }, { passive: false, capture: true });
/* Le thème vient aussi de l'extérieur (« Nos recherches » le change dans ses cadres) : la page appuie alors sur son propre bouton, qui relit toutes ses couleurs, celles du dessin compris. */
new MutationObserver(function () { var t = document.documentElement.getAttribute('data-theme') === 'light' ? 'clair' : 'sombre', b = document.querySelector('.gx-theme button[data-t="' + t + '"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

/* SOLARIS · NOS RECHERCHES · LE LORE, GRAPHIQUE · le moteur commun aux cinq essais LG-01 à LG-05.
   Le geste : la page s'arrête, la scène se joue à la molette (ou aux flèches, à Espace, à Page suivante : c'est le défilement de la page),
   puis la page repart. Rien ne bouge au chargement : l'avancement t (0 à 1) ne vient que du défilement.
   LG.scene({ pas: [noms du rail], dessin: function (ctx, L, H, t, C) {…}, dire: function (t) { return '…' } })
   C : les couleurs lues dans les jetons (C.ink, C.ink2, C.ink3, C.or, C.amb, C.bg, C.panel), à passer à LG.c(couleur, opacité). */
(function () {
  'use strict';
  var LG = window.LG = {};
  LG.borne = function (x, a, b) { return x < a ? a : x > b ? b : x; };
  LG.mel = function (a, b, t) { return a + (b - a) * t; };
  /* de 0 à 1 entre a et b, en douceur */
  LG.lisse = function (a, b, x) { var t = LG.borne((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  LG.sortie = function (t) { t = LG.borne(t, 0, 1); return 1 - Math.pow(1 - t, 3); };
  LG.c = function (c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a === undefined ? 1 : Math.max(0, Math.min(1, a)).toFixed(3)) + ')'; };

  var sonde = document.createElement('i'); sonde.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden';
  function jeton(nom) {
    sonde.style.color = 'var(' + nom + ')'; var m = getComputedStyle(sonde).color.match(/[\d.]+/g) || [0, 0, 0];
    return [+m[0], +m[1], +m[2]];
  }
  function couleurs() {
    document.body.appendChild(sonde);
    var C = { ink: jeton('--ink'), ink2: jeton('--ink2'), ink3: jeton('--ink3'), or: jeton('--or'), amb: jeton('--amb'), bg: jeton('--bg'), panel: jeton('--panel'), panel3: jeton('--panel3') };
    C.clair = document.documentElement.getAttribute('data-theme') === 'light';
    sonde.remove(); return C;
  }

  /* Le thème : les deux boutons de la barre ; gardé en mémoire comme partout dans « Nos recherches ». */
  var redessiner = function () {};
  function theme(t) {
    if (t === 'clair') document.documentElement.setAttribute('data-theme', 'light'); else document.documentElement.removeAttribute('data-theme');
    try { localStorage.setItem('supervisio.theme-v2', t === 'clair' ? 'light' : 'dark'); } catch (e) {}
    [].forEach.call(document.querySelectorAll('.gx-theme button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.t === t)); });
    redessiner(true);
  }
  [].forEach.call(document.querySelectorAll('.gx-theme button'), function (b) { b.addEventListener('click', function () { theme(b.dataset.t); }); });
  [].forEach.call(document.querySelectorAll('.gx-theme button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.t === (document.documentElement.getAttribute('data-theme') === 'light' ? 'clair' : 'sombre'))); });

  /* Écrire dans le canevas. o : { p: 'lit' | 'nor' | 'mono' | 'ui', c: corps, g: graisse, it: italique, col, a, al: alignement, esp: interlettrage en px, base, halo: une couleur de fond autour des lettres } */
  var POLICES = { lit: "'Literata', Georgia, serif", nor: "'Norelli', 'Literata', serif", mono: "'Azeret Mono', monospace", ui: "'Chakra Petch', sans-serif" };
  LG.police = function (ctx, o) {
    ctx.font = (o.it ? 'italic ' : '') + (o.g || 400) + ' ' + o.c + 'px ' + POLICES[o.p || 'lit'];
    if ('letterSpacing' in ctx) ctx.letterSpacing = (o.esp || 0) + 'px';
  };
  LG.mot = function (ctx, s, x, y, o) {
    LG.police(ctx, o); ctx.textAlign = o.al || 'left'; ctx.textBaseline = o.base || 'alphabetic';
    if (o.halo) { ctx.strokeStyle = LG.c(o.halo, o.a === undefined ? 1 : o.a); ctx.lineWidth = o.c * .42; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
    ctx.fillStyle = LG.c(o.col, o.a === undefined ? 1 : o.a); ctx.fillText(s, x, y);
  };
  /* un paragraphe coupé à la largeur l ; rend la hauteur écrite */
  LG.texte = function (ctx, s, x, y, l, o) {
    LG.police(ctx, o); var mots = String(s).split(' '), ligne = '', n = 0, il = o.il || o.c * 1.36;
    ctx.textAlign = o.al || 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = LG.c(o.col, o.a === undefined ? 1 : o.a);
    for (var i = 0; i < mots.length; i++) {
      var essai = ligne ? ligne + ' ' + mots[i] : mots[i];
      if (ligne && ctx.measureText(essai).width > l) { ctx.fillText(ligne, x, y + n * il); n++; ligne = mots[i]; } else ligne = essai;
    }
    if (ligne) { ctx.fillText(ligne, x, y + n * il); n++; }
    return n * il;
  };
  /* une lueur douce : un disque qui s'éteint vers son bord */
  LG.lueur = function (ctx, x, y, r, col, a) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, LG.c(col, a)); g.addColorStop(1, LG.c(col, 0));
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  };

  LG.scene = function (o) {
    var piste = document.getElementById('piste'), scene = document.getElementById('scene'), cv = scene.querySelector('canvas'), ctx = cv.getContext('2d');
    var ligne = document.getElementById('ligne'), rail = document.getElementById('rail');
    var reduit = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    var C = couleurs(), L = 0, H = 0, dpr = 1, vise = 0, t = 0, demande = 0, dit = null, pasIci = -1;
    piste.style.height = 'calc(' + (o.course || o.pas.length * 78) + 'vh + 100vh)';
    (o.pas || []).forEach(function (n) { var li = document.createElement('li'); li.textContent = n; rail.appendChild(li); });
    function taille() {
      var r = scene.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
      L = Math.round(r.width); H = Math.round(r.height); cv.width = L * dpr; cv.height = H * dpr;
      if (o.taille) o.taille(L, H);
    }
    function mesure() {
      var haut = scene.offsetTop ? 0 : 0, r = piste.getBoundingClientRect(), barre = parseFloat(getComputedStyle(scene).top) || 0;
      var course = r.height - (window.innerHeight - barre); return LG.borne((barre - r.top) / course, 0, 1) + haut;
    }
    function dessin() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, L, H);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      o.dessin(ctx, L, H, t, C);
      var p = Math.min(o.pas.length - 1, Math.floor(t * o.pas.length * .9999));
      if (o.pasDe) p = o.pasDe(t);
      if (p !== pasIci) { pasIci = p; [].forEach.call(rail.children, function (li, k) { li.classList.toggle('ici', k === p); }); }
      if (o.dire) { var d = o.dire(t); if (d !== dit) { dit = d; ligne.innerHTML = d; } }
    }
    function image() {
      demande = 0; var d = vise - t;
      if (reduit || Math.abs(d) < .0006) t = vise; else t += d * .2;
      dessin(); if (t !== vise) demande = requestAnimationFrame(image);
    }
    function suivre() { vise = mesure(); if (!demande) demande = requestAnimationFrame(image); }
    redessiner = function (tout) { if (tout) C = couleurs(); taille(); vise = t = mesure(); dessin(); };
    window.addEventListener('scroll', suivre, { passive: true });
    window.addEventListener('resize', function () { redessiner(); });
    redessiner(true);
    if (document.fonts && document.fonts.ready) {
      ["300 italic 20px 'Literata'", "400 20px 'Literata'", "300 20px 'Literata'", "400 20px 'Norelli'", "400 12px 'Azeret Mono'", "400 12px 'Chakra Petch'"].forEach(function (f) { try { document.fonts.load(f); } catch (e) {} });
      document.fonts.ready.then(function () { redessiner(); });
      setTimeout(function () { redessiner(); }, 600);
    }
    LG.redessiner = redessiner;
  };
})();
