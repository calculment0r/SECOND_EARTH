/* SOLARIS · NOS RECHERCHES · LE MONDE, EN GRAPHIQUE · le moteur commun aux cinq essais.
   Le geste (Cal, 18 novembre) : la page s'arrête, une animation se joue à la molette, puis la page repart. Une piste plus haute que l'écran, une scène
   collée, un avancement de 0 à 1 ; le dessin est refait à chaque image, sur une toile. Rien ne bouge au chargement : seul le défilement fait avancer. */
/* Ctrl + molette (et le pincement du pavé tactile) appartiennent à la page : jamais le zoom du navigateur, dès le chargement et partout sur l'écran. */
window.addEventListener('wheel', function (e) { if (e.ctrlKey || e.metaKey) e.preventDefault(); }, { passive: false, capture: true });

(function () {
  'use strict';
  var MG = (window.MG = {});
  var borne = (MG.borne = function (v, a, b) { return v < a ? a : v > b ? b : v; });
  MG.mix = function (a, b, t) { return a + (b - a) * t; };
  /* un morceau de l'avancement, ramené entre 0 et 1 */
  MG.seg = function (t, a, b) { return borne((t - a) / (b - a), 0, 1); };
  MG.doux = function (t) { return t * t * (3 - 2 * t); };
  MG.sortie = function (t) { return 1 - Math.pow(1 - t, 3); };
  MG.entree = function (t) { return t * t * t; };

  /* ── Le monde, rangé pour être lu vite ── */
  var M = window.MG_MONDE;
  MG.monde = M;
  MG.chose = {}; M.choses.forEach(function (c) { MG.chose[c.id] = c; });
  MG.moment = {}; M.moments.forEach(function (m) { MG.moment[m.id] = m; });
  MG.rangSeq = {}; M.sequences.forEach(function (s, i) { MG.rangSeq[s.a] = i; });
  MG.duree = M.sequences[M.sequences.length - 1].d1;
  MG.min = function (s) { var m = Math.floor(s / 60), r = Math.round(s % 60); return m ? m + ' min' + (r ? ' ' + (r < 10 ? '0' : '') + r : '') : r + ' s'; };
  /* un nom au milieu d'une phrase : sa première lettre en bas de casse, le reste intact */
  MG.bas = function (n) { return /^(Le |La |Les |L['’]|Un |Une )/.test(n) ? n.charAt(0).toLowerCase() + n.slice(1) : n; };
  /* une date du monde, dans les mots de tout le monde (« J8 jour — novembre 1995 » : « jour 8, novembre 1995 ») */
  MG.date = function (d) { return d.replace(/J(\d+) jour\b/g, 'jour $1').replace(/J(\d+)/g, 'jour $1').replace(' — ', ', '); };
  /* un nom sans son article, pour l'écrire en grand */
  MG.nu = function (n) { return n.replace(/^(Le |La |Les |L['’])/, ''); };

  /* ── Les couleurs : lues dans les jetons, relues quand le thème change (de la page ou de l'extérieur) ── */
  var C = (MG.C = {});
  var sonde = document.createElement('span'); sonde.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  function lire() {
    if (!sonde.parentNode) document.body.appendChild(sonde);
    [['bg', 'var(--bg)'], ['panel', 'var(--panel)'], ['ink', 'var(--ink)'], ['ink2', 'var(--ink2)'], ['ink3', 'var(--ink3)'], ['or', 'var(--or)'], ['amb', 'var(--amb)'],
      ['pale', 'var(--mg-pale)'], ['voile', 'var(--mg-voile)'], ['trait', 'var(--mg-trait)'], ['fantome', 'var(--mg-fantome)']].forEach(function (p) {
      sonde.style.color = p[1]; C[p[0]] = getComputedStyle(sonde).color;
    });
  }
  function theme(t, garder) {
    if (t === 'clair') document.documentElement.setAttribute('data-theme', 'light'); else document.documentElement.removeAttribute('data-theme');
    if (garder) { try { localStorage.setItem('supervisio.theme-v2', t === 'clair' ? 'light' : 'dark'); } catch (e) { /* sans mémoire, le thème tient le temps de la page */ } }
  }

  /* ── Écrire sur la toile ── */
  MG.police = function (taille, o) { o = o || {}; return (o.italique ? 'italic ' : '') + (o.graisse || 300) + ' ' + taille + 'px ' + (o.nom ? 'Norelli' : 'Literata') + ', Georgia, serif'; };
  MG.ecrire = function (g, s, x, y, taille, o) {
    o = o || {};
    g.save(); g.font = MG.police(taille, o); g.fillStyle = o.encre || C.ink; g.globalAlpha *= o.alpha === undefined ? 1 : o.alpha;
    g.textAlign = o.aligne || 'left'; g.textBaseline = o.ligne || 'alphabetic';
    if ('letterSpacing' in g) g.letterSpacing = (o.espace || 0) + 'px';
    /* un liseré de la couleur du fond, pour qu'un mot posé sur un trait reste lisible */
    if (o.lisere) { g.strokeStyle = C.panel; g.lineWidth = o.lisere; g.lineJoin = 'round'; g.strokeText(s, x, y); }
    if (o.tourne) { g.translate(x, y); g.rotate(o.tourne); g.fillText(s, 0, 0); } else g.fillText(s, x, y);
    g.restore();
  };
  MG.large = function (g, s, taille, o) { g.save(); g.font = MG.police(taille, o); if ('letterSpacing' in g) g.letterSpacing = ((o && o.espace) || 0) + 'px'; var w = g.measureText(s).width; g.restore(); return w; };
  /* un trait : plein (dit), pointillé ambre (déduit) */
  MG.trait = function (g, x0, y0, x1, y1, o) {
    o = o || {};
    g.save(); g.strokeStyle = o.encre || C.ink; g.lineWidth = o.gras || 1; g.globalAlpha *= o.alpha === undefined ? 1 : o.alpha; if (o.points) g.setLineDash(o.points); g.lineCap = o.bout || 'butt';
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.restore();
  };

  /* la ponctuation haute ne part jamais seule à la ligne */
  function insecable(s) { return (s || '').replace(/ ([:;?!»])/g, '\u00a0$1').replace(/« /g, '«\u00a0'); }

  /* ── La scène : MG.scene({ pas: ['…'], course: 80, dessiner(g, t, L, H, u), dire(t, pas) }) ── */
  MG.scene = function (o) {
    var piste = document.querySelector('.mg-piste'), scene = piste.querySelector('.mg-scene'), toile = scene.querySelector('canvas'), g = toile.getContext('2d');
    var dit = scene.querySelector('.mg-dit'), nb = o.pas.length, L = 0, H = 0, vise = 0, vu = -1, pasVu = -1, image = 0, pret = false, ditVu = '';
    var calme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    piste.style.height = 'calc(' + nb * (o.course || 85) + 'vh + 100vh)';

    var rail = document.createElement('ol'); rail.className = 'mg-rail'; rail.setAttribute('aria-label', 'Les temps de la scène');
    o.pas.forEach(function (nom, i) {
      var li = document.createElement('li'), b = document.createElement('button'); b.type = 'button'; b.appendChild(document.createTextNode(nom)); b.appendChild(document.createElement('i'));
      b.addEventListener('click', function () { aller((i + 0.62) / nb); }); li.appendChild(b); rail.appendChild(li);
    });
    scene.appendChild(rail);

    function haut() { return document.documentElement.classList.contains('en-cadre') ? 0 : parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0; }
    function course() { return piste.getBoundingClientRect().height - (window.innerHeight - haut()); }
    function aller(t) { window.scrollTo(0, piste.getBoundingClientRect().top + window.scrollY - haut() + t * course()); }
    function mesurer() { var r = piste.getBoundingClientRect(); return borne((haut() - r.top) / Math.max(1, course()), 0, 1); }
    function tailler() {
      var r = scene.getBoundingClientRect(); if (r.width < 40 || r.height < 40) return false;
      var d = Math.min(2, window.devicePixelRatio || 1);
      L = r.width; H = r.height; toile.width = Math.round(L * d); toile.height = Math.round(H * d); g.setTransform(d, 0, 0, d, 0, 0); return true;
    }
    function peindre(t) {
      if (!L) return;
      g.clearRect(0, 0, L, H);
      o.dessiner(g, t, L, H, Math.min(L / 2000, H / 1069));
      var pas = Math.min(nb - 1, Math.floor(t * nb));
      if (pas !== pasVu) { pasVu = pas; [].forEach.call(rail.querySelectorAll('button'), function (b, k) { b.setAttribute('aria-current', k === pas ? 'true' : 'false'); }); }
      if (dit && o.dire) {
        var d = o.dire(t, pas) || {}, cle = (d.k || '') + '|' + (d.b || '') + '|' + (d.ouvert || '');
        if (cle !== ditVu) { ditVu = cle; dit.querySelector('.k').textContent = insecable(d.k); dit.querySelector('b').textContent = insecable(d.b); dit.querySelector('.ouvert').textContent = insecable(d.ouvert); }
      }
    }
    /* le dessin rattrape la molette en douceur ; il s'arrête dès qu'il l'a rejointe */
    function suivre() {
      image = 0;
      var ecart = vise - vu;
      if (calme || Math.abs(ecart) < 0.0006) vu = vise; else vu += ecart * 0.2;
      peindre(vu);
      if (vu !== vise) image = requestAnimationFrame(suivre);
    }
    function bouger() { vise = mesurer(); if (!pret) return; if (!image) image = requestAnimationFrame(suivre); }
    function poser() { if (!tailler()) return; lire(); vise = mesurer(); vu = vise; pasVu = -1; ditVu = ''; if (o.composer) o.composer(L, H, Math.min(L / 2000, H / 1069)); pret = true; peindre(vu); }

    window.addEventListener('scroll', bouger, { passive: true });
    window.addEventListener('resize', poser);
    if (window.ResizeObserver) new ResizeObserver(function () { var r = scene.getBoundingClientRect(); if (Math.abs(r.width - L) > 1 || Math.abs(r.height - H) > 1) poser(); }).observe(scene);
    /* le thème : les deux boutons de la barre, et ce que « Nos recherches » impose de l'extérieur dans ses cadres */
    [].forEach.call(document.querySelectorAll('.gx-theme button'), function (b) { b.addEventListener('click', function () { theme(b.dataset.t, true); }); });
    function suivreTheme() {
      var clair = document.documentElement.getAttribute('data-theme') === 'light';
      [].forEach.call(document.querySelectorAll('.gx-theme button'), function (b) { b.setAttribute('aria-pressed', String((b.dataset.t === 'clair') === clair)); });
      lire(); if (pret) peindre(vu);
    }
    new MutationObserver(suivreTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    suivreTheme();
    poser();
    /* les lettres arrivent après la première image : on redessine quand elles sont là */
    if (document.fonts && document.fonts.load) {
      Promise.all(['300 20px Literata', 'italic 300 20px Literata', '500 20px Literata', 'italic 500 20px Literata', '20px Norelli'].map(function (f) { return document.fonts.load(f, 'Éàœ'); }))
        .then(function () { if (pret) { if (o.composer) o.composer(L, H, Math.min(L / 2000, H / 1069)); peindre(vu); } });
    }
    return { aller: aller };
  };
})();
