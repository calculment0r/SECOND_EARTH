/* KIT ÉTUDE · la dataviz en trois dimensions. Un module ES, three.js r147 (public/vendor/three), aucun réseau.
   Neuf composants : KitEtude.viz3d.cretes, nappe, constellation, globe, ville, spirale, delta, couches, particules — tous (el, donnees, options).

   Les règles tenues par le socle (scene) :
     · aucune couleur écrite : les matériaux lisent les jetons du thème, et les relisent sur « ke:theme » ;
     · rien ne tourne seul : on tire pour tourner (avec un peu d'élan), Ctrl + molette ou pincement pour approcher, flèches, + et −,
       double-clic ou 0 pour revenir ; la molette seule laisse défiler la page ;
     · on ne rend une image que quand quelque chose change ;
     · la profondeur se dit par l'effacement (les traits lointains pâlissent, les points rapetissent), jamais par une autre teinte ;
     · le texte reste en DOM, posé sur la scène ; ce qu'on vise se lit dans une phrase (aria-live), et se parcourt au clavier (Tab) ;
     · une scène ne se monte que quand elle approche de l'écran. */
import { THREE } from './vendor/three/three.module.js';

const KE = window.KitEtude = window.KitEtude || {};
const V = KE.viz3d = {};
const calme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const borne = (x, a, b) => Math.max(a, Math.min(b, x));
const mix = (a, b, t) => a + (b - a) * t;
const lisse = (t, a, b) => { const x = borne((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
const fr = (x, d = 0) => (x < 0 ? '−' : '') + Math.abs(x).toFixed(d).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
function el(nom, attrs, enfants) {
  const n = document.createElement(nom);
  for (const k in attrs || {}) { if (k === 'text') n.textContent = attrs[k]; else if (attrs[k] != null) n.setAttribute(k, attrs[k]); }
  (enfants || []).forEach(c => { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
  return n;
}
/* un hasard qui se répète : la même graine donne la même scène */
V.hasard = function (graine) { let a = graine >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };

/* ── Les jetons : une sonde lit la couleur calculée d'un jeton (les mélanges color-mix compris) ── */
function jeton(racine, nom) {
  const s = el('i', { style: 'position:absolute;width:0;height:0;visibility:hidden;color:var(' + nom + ')' }); racine.appendChild(s);
  const c = getComputedStyle(s).color, n = (c.match(/-?[\d.]+(?:e-?\d+)?/g) || []).map(Number); s.remove();
  const k = /^rgb/.test(c) ? 255 : 1; return new THREE.Vector3((n[0] || 0) / k, (n[1] || 0) / k, (n[2] || 0) / k);
}

/* ── Les matières : un seul programme pour les traits, les points et les plans. k va de 0 (pâle) à 1 (encre) puis 2 (l'accent). ── */
const VS = `
attribute float k; attribute float taille; attribute float dist; attribute float voile;
uniform float uPx, uNear, uFar, uMin;
varying float vK; varying float vF; varying float vD;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float f = smoothstep(uNear, uFar, -mv.z);
  vK = k; vD = dist; vF = mix(1.0, uMin, f) * (1.0 - voile);
  gl_PointSize = max(1.0, taille * uPx * mix(1.3, 0.5, f));
}`;
const FS = `
uniform vec3 uA; uniform vec3 uB; uniform vec3 uC;
uniform float uOp, uDash, uRond;
varying float vK; varying float vF; varying float vD;
void main(){
  float a = uOp * vF;
  if (uRond > 0.5) { float d = length(gl_PointCoord - 0.5); a *= smoothstep(0.5, 0.38, d); }
  if (uDash > 0.0 && mod(vD, uDash * 2.0) > uDash) discard;
  if (a < 0.004) discard;
  vec3 c = vK <= 1.0 ? mix(uA, uB, clamp(vK, 0.0, 1.0)) : mix(uB, uC, clamp(vK - 1.0, 0.0, 1.0));
  gl_FragColor = vec4(c, a);
}`;

/* ── Le socle d'une scène ── */
function scene(racine, o) {
  o = o || {};
  const S = { el: racine, mats: [], noms: [], cibles: [], avant: [], ici: -1, surVise: null, prendre: null, tenir: null, lacher: null, surTheme: [] };
  racine.classList.add('v3'); if (o.mot) racine.setAttribute('data-mot', o.mot);
  const vue = el('div', { class: 'v3-vue', tabindex: '0', role: 'application', 'aria-label': (o.titre || 'Scène') + ' : tire pour tourner, Ctrl et la molette pour approcher, Tab pour parcourir' });
  const noms = el('div', { class: 'v3-noms', 'aria-hidden': 'true' });
  const tete = el('div', { class: 'v3-tete' }, [o.num ? el('p', { class: 'ke-sur' }, [el('b', { text: o.num }), o.sur || '']) : null, el('h2', {}), o.geste ? el('p', { class: 'ke-petit', text: o.geste }) : null]);
  tete.querySelector('h2').innerHTML = '';
  (o.titre || '').split('*').forEach((t, i) => tete.querySelector('h2').appendChild(i % 2 ? el('em', { text: t }) : document.createTextNode(t)));
  const lu = el('div', { class: 'v3-lu', 'aria-live': 'polite' }, [el('small'), el('p')]);
  const reglages = el('div', { class: 'v3-reglages' });
  const liste = el('ol', { class: 'ke-cache', style: 'left:50%;top:50%' });   /* au milieu de la scène : le focus y amène la page, pas ailleurs */
  racine.appendChild(vue); racine.appendChild(noms); racine.appendChild(tete); racine.appendChild(lu); racine.appendChild(reglages); racine.appendChild(liste);
  S.vue = vue; S.reglages = reglages;
  S.dire = (petit, phrase) => { lu.firstChild.textContent = petit || ''; lu.lastChild.textContent = phrase || ''; };

  /* le contexte WebGL : créé quand la scène approche de l'écran, rendu quand elle s'en éloigne (un navigateur n'en tient qu'une poignée).
     Les géométries et les matières restent : un nouveau contexte les recharge de lui-même. */
  let renderer = null;
  function creer() {
    if (renderer) return true;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); }
    catch (e) { return false; }
    renderer.setClearColor(0, 0); renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    vue.insertBefore(renderer.domElement, vue.firstChild); S.renderer = renderer; return true;
  }
  function liberer() { if (!renderer) return; const c = renderer.domElement; renderer.dispose(); renderer.forceContextLoss(); c.remove(); renderer = null; S.renderer = null; }
  if (!creer()) { racine.appendChild(el('p', { class: 'v3-sans', text: 'Cette scène a besoin de WebGL, que ce navigateur n’ouvre pas ici. Les autres pages du kit s’en passent.' })); S.mort = true; return S; }
  S.liberer = liberer;
  const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(o.angle || 30, 1, 0.1, 200);
  S.scene = sc; S.cam = cam; S.rayon = o.rayon || 4;
  const depart = Object.assign({ az: 0, el: 0.4, d: 10, x: 0, y: 0, z: 0 }, o.vue || {});
  const orb = S.orbite = Object.assign({}, depart), limites = { el: o.el || [-0.15, 1.45], d: o.d || [depart.d * 0.45, depart.d * 1.9] };
  let W = 1, H = 1, px = 1;

  /* les matières lisent des noms de jetons ; S.mat({ a, b, c, op, rond, tiret, min }) */
  S.mat = function (m) {
    m = Object.assign({ a: '--trait-vu', b: '--ink', c: '--or', op: 1, rond: 0, tiret: 0, min: 0.16 }, m || {});
    const mat = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uA: { value: new THREE.Vector3() }, uB: { value: new THREE.Vector3() }, uC: { value: new THREE.Vector3() }, uOp: { value: m.op }, uDash: { value: m.tiret }, uRond: { value: m.rond ? 1 : 0 }, uPx: { value: 1 }, uNear: { value: 1 }, uFar: { value: 20 }, uMin: { value: m.min } } });
    mat.userData.jetons = [m.a, m.b, m.c]; S.mats.push(mat); teindre(mat); return mat;
  };
  /* un voile : il n'écrit que la profondeur (il ne peint rien : zéro fois sa couleur, une fois ce qui est dessous), et cache ce qui passe derrière lui */
  S.cacheDepth = (decale) => new THREE.MeshBasicMaterial({ transparent: true, depthWrite: true, blending: THREE.CustomBlending, blendSrc: THREE.ZeroFactor, blendDst: THREE.OneFactor, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: decale || 1, polygonOffsetUnits: decale || 1 });
  function teindre(mat) { const j = mat.userData.jetons; if (!j) return; ['uA', 'uB', 'uC'].forEach((u, i) => { if (mat.uniforms[u] && j[i]) mat.uniforms[u].value.copy(jeton(racine, j[i])); }); if (mat.uniforms.uFond) mat.uniforms.uFond.value.copy(jeton(racine, '--panel')); }
  S.suivre = (mat, jetons) => { mat.userData.jetons = jetons; S.mats.push(mat); teindre(mat); return mat; };
  function theme() { S.mats.forEach(teindre); S.surTheme.forEach(f => f()); S.rendre(); }
  document.addEventListener('ke:theme', theme);

  /* un nom posé sur la scène : S.nom('texte', 'dit') → { el, p (Vector3), on, obj } */
  S.nom = function (texte, classe, obj) { const n = { el: el('p', { class: 'v3-nom ' + (classe || ''), text: texte }), p: new THREE.Vector3(), on: true, dx: 0, dy: 0, obj: obj || null, fond: true }; n.el.style.opacity = '0'; noms.appendChild(n.el); S.noms.push(n); return n; };
  /* ce qui se vise : S.cible(i, [Vector3…], obj) ; S.clavier(['libellé', …]) pose la liste que Tab parcourt */
  S.cible = (i, pts, obj) => { S.cibles.push({ i, pts, obj: obj || null }); };
  S.clavier = function (libelles, indices) {
    liste.textContent = '';
    libelles.forEach((t, i) => { const b = el('button', { type: 'button', text: t }); b.addEventListener('focus', () => { racine.classList.add('clavier'); viser(indices ? indices[i] : i); }); b.addEventListener('blur', () => racine.classList.remove('clavier')); liste.appendChild(el('li', {}, [b])); });
  };
  function viser(i) { if (i === S.ici) return; S.ici = i; if (S.surVise) S.surVise(i); S.rendre(); }
  S.viser = viser;

  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  function placer() {
    const ce = Math.cos(orb.el), d = orb.d;
    cam.position.set(orb.x + d * ce * Math.sin(orb.az), orb.y + d * Math.sin(orb.el), orb.z + d * ce * Math.cos(orb.az)); cam.lookAt(orb.x, orb.y, orb.z); cam.updateMatrixWorld();
    const near = Math.max(0.1, d - S.rayon), far = d + S.rayon;
    S.mats.forEach(m => { m.uniforms.uNear.value = near; m.uniforms.uFar.value = far; if (m.uniforms.uPx) m.uniforms.uPx.value = px; });
    S.near = near; S.far = far;
  }
  function ecran(p, obj, out) { tmp.copy(p); if (obj) tmp.applyMatrix4(obj.matrixWorld); tmp2.copy(tmp).applyMatrix4(cam.matrixWorldInverse); const z = -tmp2.z; tmp.project(cam); out.x = (tmp.x * 0.5 + 0.5) * W; out.y = (-tmp.y * 0.5 + 0.5) * H; out.z = z; out.ok = tmp.z < 1 && z > 0; return out; }
  S.ecran = ecran;
  const E = { x: 0, y: 0, z: 0, ok: true };
  function piquer() {
    let mieux = -1, dm = 30 * 30;
    S.cibles.forEach(c => { for (let j = 0; j < c.pts.length; j++) { ecran(c.pts[j], c.obj, E); if (!E.ok || (S.cache && S.cache(c.pts[j], c.obj))) continue; const dx = E.x - souris.x, dy = E.y - souris.y, d2 = dx * dx + dy * dy; if (d2 < dm) { dm = d2; mieux = c.i; } } });
    viser(mieux);
  }
  S.plusProche = function (pts, obj, x, y) { let m = -1, dm = Infinity; for (let j = 0; j < pts.length; j++) { ecran(pts[j], obj, E); if (!E.ok) continue; const d2 = (E.x - x) * (E.x - x) + (E.y - y) * (E.y - y); if (d2 < dm) { dm = d2; m = j; } } return { i: m, d: Math.sqrt(dm) }; };

  let demande = 0, aPiquer = false, mode = null, anim = null; const souris = { x: -999, y: -999 }, elan = { a: 0, e: 0 };
  function image(ts) {
    demande = 0;
    if (!renderer) return;
    if (anim) { const t = calme ? 1 : lisse((ts - anim.t0) / 380, 0, 1); ['az', 'el', 'd', 'x', 'y', 'z'].forEach(k => { orb[k] = mix(anim.de[k], anim.a[k], t); }); if (t >= 1) anim = null; else S.rendre(); }
    if (!mode && (Math.abs(elan.a) > 0.0004 || Math.abs(elan.e) > 0.0004)) { orb.az += elan.a; orb.el = borne(orb.el + elan.e, limites.el[0], limites.el[1]); elan.a *= 0.92; elan.e *= 0.92; S.rendre(); }
    sc.updateMatrixWorld(); placer();
    if (aPiquer) { aPiquer = false; piquer(); }
    S.avant.forEach(f => f(ts));
    renderer.render(sc, cam);
    S.noms.forEach(n => {
      if (!n.on) { if (n.vu !== 0) { n.el.style.opacity = '0'; n.vu = 0; } return; }
      ecran(n.p, n.obj, E); const cache = !E.ok || (n.dos && n.dos());
      const op = cache ? 0 : (n.fond ? mix(1, 0.25, lisse(E.z, S.near, S.far)) : 1) * (n.op == null ? 1 : n.op);
      n.el.style.transform = 'translate(' + (E.x + n.dx).toFixed(1) + 'px,' + (E.y + n.dy).toFixed(1) + 'px)' + (n.ancre || ''); n.el.style.opacity = op.toFixed(3); n.vu = 1;
    });
  }
  S.rendre = () => { if (!demande) demande = requestAnimationFrame(image); };
  S.revenir = () => { anim = { t0: performance.now(), de: Object.assign({}, orb), a: depart }; elan.a = elan.e = 0; S.rendre(); };

  function taille() { const r = vue.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height); if (renderer) renderer.setSize(W, H, false); cam.aspect = W / H; cam.setViewOffset(W, H, -W * (o.droite == null ? 0.07 : o.droite), H * (o.haut == null ? 0.03 : o.haut), W, H); cam.updateProjectionMatrix(); px = Math.min(2, window.devicePixelRatio || 1) * H / 900; S.W = W; S.H = H; S.rendre(); }
  new ResizeObserver(taille).observe(vue);
  if ('IntersectionObserver' in window) new IntersectionObserver(es => {
    const pres = es[es.length - 1].isIntersecting;
    if (pres && !renderer) { if (creer()) taille(); } else if (!pres && renderer) liberer();
  }, { rootMargin: '60% 0px' }).observe(racine);

  /* la main : tourner, pincer, ou tenir ce que la scène donne à tenir (S.prendre rend vrai) */
  const doigts = new Map(); let pince = null, bouge = false;
  function local(e) { const r = vue.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  vue.addEventListener('pointerdown', e => {
    if (e.button) return; vue.focus({ preventScroll: true }); try { vue.setPointerCapture(e.pointerId); } catch (x) { /* pointeur de synthèse */ }
    doigts.set(e.pointerId, { x: e.clientX, y: e.clientY }); anim = null; bouge = false;
    if (doigts.size === 1) { if (S.prendre && S.prendre(local(e), e)) { mode = 'prise'; racine.classList.add('prise'); } else { mode = 'orbite'; racine.classList.add('glisse'); } elan.a = elan.e = 0; }
    else { const p = [...doigts.values()]; mode = 'pince'; pince = { d: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y), o: orb.d }; }
    e.preventDefault();
  });
  vue.addEventListener('pointermove', e => {
    const d = doigts.get(e.pointerId);
    if (!d) { const l = local(e); souris.x = l.x; souris.y = l.y; aPiquer = true; S.rendre(); return; }
    const dx = e.clientX - d.x, dy = e.clientY - d.y; d.x = e.clientX; d.y = e.clientY; if (Math.abs(dx) + Math.abs(dy) > 0) bouge = true;
    if (mode === 'orbite') { elan.a = -dx * 0.006; elan.e = dy * 0.005; orb.az += elan.a; orb.el = borne(orb.el + elan.e, limites.el[0], limites.el[1]); }
    else if (mode === 'prise') { if (S.tenir) S.tenir(local(e), e); }
    else if (mode === 'pince' && doigts.size > 1) { const p = [...doigts.values()], dist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); orb.d = borne(pince.o * pince.d / Math.max(1, dist), limites.d[0], limites.d[1]); }
    S.rendre();
  });
  function fin(e) { if (!doigts.has(e.pointerId)) return; doigts.delete(e.pointerId); if (doigts.size) return; if (mode === 'prise' && S.lacher) S.lacher(); if (mode !== 'orbite' || calme || !bouge) elan.a = elan.e = 0; mode = null; racine.classList.remove('glisse', 'prise'); S.rendre(); }
  vue.addEventListener('pointerup', fin); vue.addEventListener('pointercancel', fin);
  vue.addEventListener('pointerleave', () => { if (!doigts.size && !racine.classList.contains('clavier')) viser(-1); });
  vue.addEventListener('wheel', e => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); orb.d = borne(orb.d * Math.pow(1.0016, e.deltaY), limites.d[0], limites.d[1]); S.rendre(); }, { passive: false });
  vue.addEventListener('dblclick', S.revenir);
  vue.addEventListener('keydown', e => {
    const p = e.shiftKey ? 0.02 : 0.08;
    if (e.key === 'ArrowLeft') orb.az -= p; else if (e.key === 'ArrowRight') orb.az += p; else if (e.key === 'ArrowUp') orb.el = borne(orb.el + p, limites.el[0], limites.el[1]); else if (e.key === 'ArrowDown') orb.el = borne(orb.el - p, limites.el[0], limites.el[1]);
    else if (e.key === '+' || e.key === '=') orb.d = borne(orb.d / 1.12, limites.d[0], limites.d[1]); else if (e.key === '-') orb.d = borne(orb.d * 1.12, limites.d[0], limites.d[1]); else if (e.key === '0' || e.key === 'Home') { S.revenir(); e.preventDefault(); return; } else return;
    e.preventDefault(); S.rendre();
  });
  /* les réglages : un curseur du kit, ou des mots soulignés */
  S.curseur = function (nom, attrs, surChange) {
    const c = el('div', Object.assign({ class: 'ke-curseur', 'aria-label': nom }, attrs)), r = el('div', { class: 'ke-reglage' }, [el('p', { class: 'ke-petit' }, [el('span', { text: nom }), el('output')]), c]);
    reglages.appendChild(r); const api = KE.curseur ? KE.curseur(c) : null; c.addEventListener('ke:change', e => { surChange(e.detail.valeur); S.rendre(); }); return api;
  };
  S.mots = function (mots, surChoix, choisi) {
    const rang = el('div', { class: 'ke-rang', role: 'group' }); const bs = mots.map((m, i) => { const b = el('button', { type: 'button', class: 'ke-btn', 'aria-pressed': i === choisi ? 'true' : 'false', text: m }); b.addEventListener('click', () => { bs.forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); surChoix(i); S.rendre(); }); rang.appendChild(b); return b; });
    reglages.appendChild(rang); return bs;
  };
  taille(); return S;
}
/* monter une scène seulement quand elle approche de l'écran */
function paresseux(racine, monter) {
  if (!('IntersectionObserver' in window)) { monter(); return; }
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); monter(); } }, { rootMargin: '400px 0px' }); io.observe(racine);
}
/* petites aides de géométrie */
function geo(positions, attrs) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(positions, 3)); for (const k in attrs || {}) g.setAttribute(k, new THREE.BufferAttribute(attrs[k], 1)); return g; }
function rempli(n, v) { return new Float32Array(n).fill(v); }
function poser(attr, v, de, a) { const t = attr.array; for (let i = de == null ? 0 : de; i < (a == null ? t.length : a); i++) t[i] = v; attr.needsUpdate = true; }
function liste(t) { return t.length > 1 ? t.slice(0, -1).join(', ') + ' et ' + t[t.length - 1] : t[0] || ''; }

/* ════ 1 · LES CRÊTES ════ des lignes de relief empilées en profondeur ; chaque ligne cache celles de derrière (un voile invisible sous elle).
   donnees : { lignes: [{ nom, v: [0..1, …] }], axe: ['début', 'fin'], unite, dire(ligne, iMax) } */
V.cretes = (racine, D, o) => paresseux(racine, () => {
  o = o || {};
  const S = scene(racine, Object.assign({ titre: 'Les *crêtes*', mot: 'Crêtes', vue: { az: -0.2, el: 0.5, d: 14, y: 0.2 }, rayon: 4.2, geste: 'Survole une ligne. Tire pour tourner, Ctrl et la molette pour approcher.' }, o)); if (S.mort) return;
  const L = D.lignes, n = L.length, m = L[0].v.length, LX = 8, LZ = 6.4, HY = 1.45, g = new THREE.Group(); S.scene.add(g);
  const mat = S.mat({ a: '--ink3', b: '--ink', min: 0.22 }), voile = S.cacheDepth(1.5), lignes = [];
  L.forEach((l, j) => {
    const z = (j / (n - 1) - 0.5) * LZ, p = new Float32Array(m * 3), q = new Float32Array(m * 6), idx = [], pts = []; let iMax = 0;
    for (let i = 0; i < m; i++) { const x = (i / (m - 1) - 0.5) * LX, y = l.v[i] * HY; p.set([x, y, z], i * 3); q.set([x, -0.02, z, x, y, z], i * 6); if (l.v[i] > l.v[iMax]) iMax = i; if (i % 3 === 0) pts.push(new THREE.Vector3(x, y, z)); if (i) idx.push(i * 2 - 2, i * 2 - 1, i * 2, i * 2 - 1, i * 2 + 1, i * 2); }
    const gl = geo(p, { k: rempli(m, 1) }), ligne = new THREE.Line(gl, mat), gv = geo(q); gv.setIndex(idx); const rideau = new THREE.Mesh(gv, voile); rideau.renderOrder = -1;
    g.add(rideau); g.add(ligne); lignes.push({ k: gl.attributes.k, iMax, sommet: new THREE.Vector3((iMax / (m - 1) - 0.5) * LX, l.v[iMax] * HY, z) }); S.cible(j, pts, g);
  });
  const nom = S.nom('', 'dit', g), val = S.nom('', 'val', g), bords = [S.nom(L[0].nom, '', g), S.nom(L[n - 1].nom, '', g)]; bords[1].on = false;
  bords[0].p.set(LX / 2 + 0.25, 0, -LZ / 2); bords[1].p.set(LX / 2 + 0.25, 0, LZ / 2); bords.forEach(b => { b.ancre = ' translate(0,-50%)'; b.fond = false; });
  const axe = (D.axe || []).map((t, i) => { const a = S.nom(t, '', g); a.p.set((i / Math.max(1, D.axe.length - 1) - 0.5) * LX, 0, -LZ / 2 - 0.3); a.ancre = ' translate(-50%,-100%)'; a.fond = false; return a; });
  nom.fond = val.fond = false; val.ancre = ' translate(-50%,-150%)'; nom.ancre = ' translate(-50%,-330%)'; void axe;
  const repos = D.repos == null ? Math.round(n * 0.6) : D.repos;
  S.surVise = i => {
    const j = i < 0 ? repos : i;
    lignes.forEach((l, q) => poser(l.k, q === j ? 2 : (i < 0 ? 1 : 0.5)));
    const l = lignes[j]; nom.p.copy(l.sommet); val.p.copy(l.sommet); nom.el.textContent = L[j].nom; val.el.textContent = ''; val.el.appendChild(document.createTextNode(fr(L[j].v[l.iMax] * (D.max || 100)))); if (D.unite) val.el.appendChild(el('small', { text: D.unite }));
    nom.el.classList.add('or'); S.dire(L[j].nom, D.dire ? D.dire(L[j], l.iMax) : 'Son point haut : ' + fr(L[j].v[l.iMax] * (D.max || 100)) + '.');
  };
  S.clavier(L.map(l => l.nom));
  S.curseur('le relief', { 'data-min': 20, 'data-max': 200, 'data-pas': 5, 'data-valeur': 100, 'data-unite': '%' }, v => { g.scale.y = v / 100; });
  S.surVise(-1); S.rendre();
});

/* ════ 2 · LA NAPPE ════ une surface en fil de fer très fin, ses courbes de niveau, et une coupe qu'on déplace.
   donnees : { n, f(u, v) → 0..1 (u, v de 0 à 1), niveaux: [..], max, unite } */
V.nappe = (racine, D, o) => paresseux(racine, () => {
  o = o || {};
  const S = scene(racine, Object.assign({ titre: 'La *nappe*', mot: 'Nappe', vue: { az: 0.62, el: 0.5, d: 13, y: 0.5 }, rayon: 4.6, geste: 'Déplace la coupe avec le curseur. Survole la surface pour lire un point.' }, o)); if (S.mort) return;
  const N = D.n || 72, LX = 7.4, HY = 2.3, g = new THREE.Group(); S.scene.add(g);
  const h = new Float32Array(N * N); for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) h[j * N + i] = D.f(i / (N - 1), j / (N - 1));
  const X = i => (i / (N - 1) - 0.5) * LX, P = (i, j) => [X(i), h[j * N + i] * HY, X(j)];
  /* le voile : la surface, écrite dans la seule profondeur */
  const pv = new Float32Array(N * N * 3), idx = []; for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { pv.set(P(i, j), (j * N + i) * 3); if (i && j) { const a = (j - 1) * N + i - 1, b = a + 1, c = j * N + i - 1, d = c + 1; idx.push(a, c, b, b, c, d); } }
  const gv = geo(pv); gv.setIndex(idx); const voile = new THREE.Mesh(gv, S.cacheDepth(2)); voile.renderOrder = -1; g.add(voile);
  /* le fil de fer : une ligne sur trois, dans les deux sens */
  const seg = [], ks = [], pas = 3;
  for (let j = 0; j < N; j += pas) for (let i = 1; i < N; i++) { seg.push(...P(i - 1, j), ...P(i, j)); ks.push(h[j * N + i - 1], h[j * N + i]); }
  for (let i = 0; i < N; i += pas) for (let j = 1; j < N; j++) { seg.push(...P(i, j - 1), ...P(i, j)); ks.push(h[(j - 1) * N + i], h[j * N + i]); }
  g.add(new THREE.LineSegments(geo(new Float32Array(seg), { k: new Float32Array(ks.map(v => 0.15 + v * 0.5)) }), S.mat({ a: '--trait-vu', b: '--ink2', op: 0.55, min: 0.2 })));
  /* les courbes de niveau : carrés en marche */
  const cs = [];
  (D.niveaux || [0.2, 0.35, 0.5, 0.65, 0.8]).forEach(nv => {
    for (let j = 0; j < N - 1; j++) for (let i = 0; i < N - 1; i++) {
      const a = h[j * N + i], b = h[j * N + i + 1], c = h[(j + 1) * N + i + 1], d = h[(j + 1) * N + i], pts = [];
      const t = (u, v, x0, z0, x1, z1) => { if ((u < nv) !== (v < nv)) { const r = (nv - u) / (v - u); pts.push(mix(X(x0), X(x1), r), nv * HY + 0.012, mix(X(z0), X(z1), r)); } };
      t(a, b, i, j, i + 1, j); t(b, c, i + 1, j, i + 1, j + 1); t(c, d, i + 1, j + 1, i, j + 1); t(d, a, i, j + 1, i, j);
      if (pts.length === 6) cs.push(...pts); else if (pts.length === 12) cs.push(...pts);
    }
  });
  g.add(new THREE.LineSegments(geo(new Float32Array(cs), { k: rempli(cs.length / 3, 1) }), S.mat({ a: '--ink3', b: '--ink', min: 0.3 })));
  /* la coupe : un profil orange, et ses fils d'aplomb */
  const pc = new Float32Array(N * 3), gc = geo(pc, { k: rempli(N, 2) }), coupe = new THREE.Line(gc, S.mat({ min: 1 })); coupe.renderOrder = 2; coupe.material.depthTest = false; g.add(coupe);
  const pa = new Float32Array(N * 6), ga = geo(pa, { k: rempli(N * 2, 2) }), aplomb = new THREE.LineSegments(ga, S.mat({ op: 0.22, min: 1 })); g.add(aplomb);
  const sol = new Float32Array([-LX / 2, 0, -LX / 2, LX / 2, 0, -LX / 2, LX / 2, 0, -LX / 2, LX / 2, 0, LX / 2, LX / 2, 0, LX / 2, -LX / 2, 0, LX / 2, -LX / 2, 0, LX / 2, -LX / 2, 0, -LX / 2]);
  g.add(new THREE.LineSegments(geo(sol, { k: rempli(8, 0.4) }), S.mat({ a: '--trait', b: '--ink3', min: 0.5 })));
  const vMax = S.nom('', 'val or', g), vPt = S.nom('', 'dit', g);
  vMax.fond = vPt.fond = false; vMax.ancre = ' translate(-50%,-140%)'; vPt.ancre = ' translate(14px,-50%)'; vPt.on = false;
  let ic = Math.round(N * 0.42), max = D.max || 10;
  function couper() {
    let jm = 0; for (let j = 0; j < N; j++) { const p = P(ic, j); pc.set([p[0], p[1] + 0.015, p[2]], j * 3); pa.set([p[0], 0, p[2], p[0], p[1], p[2]], j * 6); if (h[j * N + ic] > h[jm * N + ic]) jm = j; }
    gc.attributes.position.needsUpdate = true; ga.attributes.position.needsUpdate = true; const p = P(ic, jm); vMax.p.set(p[0], p[1], p[2]); vMax.el.textContent = fr(h[jm * N + ic] * max, 1);
    if (S.ici < 0) S.dire('La coupe, à ' + Math.round(ic / (N - 1) * 100) + ' sur 100', 'Son point haut vaut ' + fr(h[jm * N + ic] * max, 1) + (D.unite ? ' ' + D.unite : '') + ', sur ' + fr(max, 0) + ' au plus.');
  }
  const grille = []; for (let j = 0; j < N; j += 4) for (let i = 0; i < N; i += 4) grille.push([i, j]);
  grille.forEach((c, q) => { const p = P(c[0], c[1]); S.cible(q, [new THREE.Vector3(p[0], p[1], p[2])], g); });
  const dessus = new Float32Array(3), gp = geo(dessus, { k: rempli(1, 1), taille: rempli(1, 7) }), point = new THREE.Points(gp, S.mat({ rond: 1, min: 1 })); point.visible = false; point.material.depthTest = false; g.add(point);
  S.surVise = q => {
    if (q < 0) { vPt.on = false; point.visible = false; couper(); return; }
    const c = grille[q], p = P(c[0], c[1]), v = h[c[1] * N + c[0]] * max; dessus.set(p); gp.attributes.position.needsUpdate = true; point.visible = true; vPt.on = true; vPt.p.set(p[0], p[1], p[2]); vPt.el.textContent = fr(v, 1);
    S.dire('Un point de la nappe', fr(v, 1) + (D.unite ? ' ' + D.unite : '') + ', à ' + Math.round(c[0] / (N - 1) * 100) + ' en large et ' + Math.round(c[1] / (N - 1) * 100) + ' en long.');
  };
  S.curseur('la coupe', { 'data-min': 0, 'data-max': 100, 'data-valeur': Math.round(ic / (N - 1) * 100) }, v => { ic = Math.round(v / 100 * (N - 1)); couper(); });
  S.curseur('le relief', { 'data-min': 20, 'data-max': 160, 'data-pas': 5, 'data-valeur': 100, 'data-unite': '%' }, v => { g.scale.y = v / 100; });
  couper(); S.rendre();
});

/* ════ 3 · LA CONSTELLATION ════ des points nommés et leurs liens. Au repos un seul fil se voit ; les autres viennent quand on vise un point.
   donnees : { points: [{ nom, x, y, z, poids (0..1), grand }], liens: [[a, b]], fil: [indices du fil qui compte] } */
V.constellation = (racine, D, o) => paresseux(racine, () => {
  o = o || {};
  const S = scene(racine, Object.assign({ titre: 'La *constellation*', mot: 'Ciel', vue: { az: 0.5, el: 0.22, d: 13 }, rayon: 4.4, el: [-1.2, 1.4], geste: 'Vise un point : ses liens viennent. Au repos, un seul fil se voit.' }, o)); if (S.mort) return;
  const P = D.points, n = P.length, g = new THREE.Group(); S.scene.add(g);
  const pp = new Float32Array(n * 3), tailles = new Float32Array(n), kp = new Float32Array(n);
  P.forEach((p, i) => { pp.set([p.x, p.y, p.z], i * 3); tailles[i] = p.grand ? 11 : 3.4 + (p.poids || 0) * 4.2; kp[i] = p.grand ? 1 : 0.7; });
  const gpts = geo(pp, { k: kp, taille: tailles }); g.add(new THREE.Points(gpts, S.mat({ a: '--ink3', b: '--ink', rond: 1, min: 0.2 })));
  if (D.poussiere) { const h = V.hasard(4), pd = new Float32Array(D.poussiere * 3); for (let i = 0; i < D.poussiere; i++) { const a = h() * 6.2832, b = Math.acos(h() * 2 - 1), r = 3.2 + h() * 2.6; pd.set([Math.sin(b) * Math.cos(a) * r, Math.cos(b) * r * 0.8, Math.sin(b) * Math.sin(a) * r], i * 3); } g.add(new THREE.Points(geo(pd, { k: rempli(D.poussiere, 0.4), taille: rempli(D.poussiere, 1.5) }), S.mat({ a: '--trait-vu', b: '--ink3', rond: 1, min: 0.1 }))); }
  const dansFil = new Set(); (D.fil || []).forEach((a, i) => { if (i) dansFil.add(Math.min(a, D.fil[i - 1]) + '-' + Math.max(a, D.fil[i - 1])); });
  const vus = new Set(), liens = D.liens.filter(l => { const c = Math.min(l[0], l[1]) + '-' + Math.max(l[0], l[1]); if (l[0] === l[1] || vus.has(c)) return false; vus.add(c); return true; }); dansFil.forEach(c => { if (!liens.some(l => Math.min(l[0], l[1]) + '-' + Math.max(l[0], l[1]) === c)) liens.push(c.split('-').map(Number)); });
  const pl = new Float32Array(liens.length * 6), kl = new Float32Array(liens.length * 2), vl = new Float32Array(liens.length * 2), voisins = P.map(() => []);
  liens.forEach((l, q) => { pl.set([P[l[0]].x, P[l[0]].y, P[l[0]].z, P[l[1]].x, P[l[1]].y, P[l[1]].z], q * 6); voisins[l[0]].push(l[1]); voisins[l[1]].push(l[0]); });
  const gl = geo(pl, { k: kl, voile: vl }); g.add(new THREE.LineSegments(gl, S.mat({ a: '--ink3', b: '--ink2', min: 0.25 })));
  const noms = P.map((p, i) => { const nm = S.nom(p.nom, p.grand ? 'nom' : 'dit', g); nm.p.set(p.x, p.y, p.z); nm.dx = 12; nm.ancre = ' translate(0,-50%)'; nm.on = !!p.grand; if (p.grand) nm.fond = false; return nm; });
  P.forEach((p, i) => S.cible(i, [new THREE.Vector3(p.x, p.y, p.z)], g));
  S.surVise = i => {
    liens.forEach((l, q) => { const fil = dansFil.has(Math.min(l[0], l[1]) + '-' + Math.max(l[0], l[1])), tenu = i >= 0 && (l[0] === i || l[1] === i); kl[q * 2] = kl[q * 2 + 1] = tenu ? 2 : fil ? 1 : 0.2; vl[q * 2] = vl[q * 2 + 1] = tenu || fil ? 0 : 1; });
    gl.attributes.k.needsUpdate = true; gl.attributes.voile.needsUpdate = true;
    P.forEach((p, q) => { kp[q] = q === i ? 2 : p.grand || (i >= 0 && voisins[i].indexOf(q) >= 0) ? 1 : (i >= 0 ? 0.3 : 0.7); noms[q].on = !!p.grand || q === i || (i >= 0 && voisins[i].indexOf(q) >= 0); noms[q].el.classList.toggle('or', q === i); noms[q].fond = q !== i && !p.grand; });
    gpts.attributes.k.needsUpdate = true;
    if (i < 0) S.dire(D.reposPetit || 'Au repos', D.repos || 'Un seul fil se voit : celui qui relie les grands noms.');
    else S.dire(P[i].nom, voisins[i].length ? (voisins[i].length > 1 ? 'Ses liens : ' : 'Son lien : ') + liste(voisins[i].map(q => P[q].nom)) + '.' : 'Aucun lien, pour l’instant.');
  };
  S.clavier(P.map(p => p.nom)); S.surVise(-1); S.rendre();
});

/* ════ 4 · LE GLOBE ════ une sphère en parallèles et en points, des arcs entre lieux ; l'arc visé en orange, l'arc déduit en pointillé d'ambre.
   donnees : { lieux: [{ nom, lat, lon }], arcs: [{ de, a (indices), deduit }], rayonKm } */
V.globe = (racine, D, o) => paresseux(racine, () => {
  o = o || {};
  const S = scene(racine, Object.assign({ titre: 'Le *globe*', mot: 'Globe', vue: { az: 0.05, el: 0.42, d: 12.4 }, rayon: 2.9, el: [-1.35, 1.35], geste: 'Tourne le globe. Vise un arc : il dit ses deux lieux et la distance.' }, o)); if (S.mort) return;
  const R = 2.7, g = new THREE.Group(); S.scene.add(g);
  const V3 = (lat, lon, r) => { const a = lat * Math.PI / 180, b = lon * Math.PI / 180; return new THREE.Vector3(Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)).multiplyScalar(r == null ? R : r); };
  const boule = new THREE.Mesh(new THREE.SphereGeometry(R * 0.992, 64, 40), S.cacheDepth(1)); boule.renderOrder = -1; g.add(boule);
  const gr = [], kg = [];
  for (let lat = -75; lat <= 75; lat += 15) for (let i = 0; i < 120; i++) { const a = V3(lat, i * 3 - 180), b = V3(lat, i * 3 - 177); gr.push(a.x, a.y, a.z, b.x, b.y, b.z); kg.push(lat === 0 ? 0.7 : 0.18, lat === 0 ? 0.7 : 0.18); }
  for (let lon = -180; lon < 180; lon += 15) for (let i = 0; i < 56; i++) { const a = V3(-84 + i * 3, lon), b = V3(-81 + i * 3, lon); gr.push(a.x, a.y, a.z, b.x, b.y, b.z); kg.push(0.18, 0.18); }
  g.add(new THREE.LineSegments(geo(new Float32Array(gr), { k: new Float32Array(kg) }), S.mat({ a: '--trait', b: '--ink3', min: 0.45 })));
  /* les terres : un champ de bruit à graine sur la sphère, relevé autour de chaque lieu (un lieu est toujours sur la terre) ;
     la côte est la courbe de niveau du champ, tracée par carrés marchants sur une grille de latitudes et de longitudes */
  const graine = (o.graine || D.graine || 7) | 0;
  const hache = (x, y, z) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177) ^ Math.imul(graine, 2246822519); h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  const lisse3 = t => t * t * (3 - 2 * t);
  function bruit3(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), u = lisse3(x - xi), v = lisse3(y - yi), w = lisse3(z - zi);
    const c = (i, j, k) => hache(xi + i, yi + j, zi + k);
    return mix(mix(mix(c(0, 0, 0), c(1, 0, 0), u), mix(c(0, 1, 0), c(1, 1, 0), u), v), mix(mix(c(0, 0, 1), c(1, 0, 1), u), mix(c(0, 1, 1), c(1, 1, 1), u), v), w);
  }
  const dirs = D.lieux.map(l => V3(l.lat, l.lon, 1));
  function terre(x, y, z) {   /* un point de la sphère unité → la « hauteur » ; la côte est à 0 */
    let f = 0, a = 0.5, q = 1.35;
    for (let k = 0; k < 5; k++) { f += a * bruit3(x * q + 11.3, y * q + 4.1, z * q + 7.7); a *= 0.5; q *= 2.03; }
    let pres = 0; dirs.forEach(d => { const c = x * d.x + y * d.y + z * d.z; pres = Math.max(pres, Math.exp((c - 1) / 0.018)); });
    return f - 0.6 + 0.34 * pres - 0.1 * Math.pow(Math.abs(y), 4);
  }
  /* la peau : des points réguliers (spirale de Fibonacci) ; ceux des terres plus nets, ceux de la mer à peine */
  const NP = 6400, sp = new Float32Array(NP * 3), kp = new Float32Array(NP), tp = new Float32Array(NP);
  for (let i = 0; i < NP; i++) { const y = 1 - (i + 0.5) / NP * 2, r = Math.sqrt(1 - y * y), t = i * 2.399963, x = Math.cos(t) * r, z = Math.sin(t) * r, f = terre(x, y, z); sp.set([x * R, y * R, z * R], i * 3); kp[i] = f > 0 ? 0.62 + Math.min(0.38, f * 2.2) : 0.05; tp[i] = f > 0 ? 1.7 : 1.1; }
  g.add(new THREE.Points(geo(sp, { k: kp, taille: tp }), S.mat({ a: '--trait', b: '--ink2', rond: 1, min: 0.5 })));
  const PAS = 2, NLAT = 180 / PAS, NLON = 360 / PAS, champ = new Float32Array((NLAT + 1) * (NLON + 1));
  for (let j = 0; j <= NLAT; j++) for (let i = 0; i <= NLON; i++) { const v = V3(-90 + j * PAS, -180 + i * PAS, 1); champ[j * (NLON + 1) + i] = terre(v.x, v.y, v.z); }
  const cote = [], RC = R * 1.002, F = (j, i) => champ[j * (NLON + 1) + i];
  const sur = (j0, i0, j1, i1) => { const a = F(j0, i0), b = F(j1, i1), t = a / (a - b); return V3(-90 + mix(j0, j1, t) * PAS, -180 + mix(i0, i1, t) * PAS, RC); };
  for (let j = 0; j < NLAT; j++) for (let i = 0; i < NLON; i++) {
    const a = F(j, i) > 0, b = F(j, i + 1) > 0, c = F(j + 1, i + 1) > 0, d = F(j + 1, i) > 0, cas = (a ? 1 : 0) | (b ? 2 : 0) | (c ? 4 : 0) | (d ? 8 : 0);
    if (!cas || cas === 15) continue;
    const bas = () => sur(j, i, j, i + 1), droite = () => sur(j, i + 1, j + 1, i + 1), haut = () => sur(j + 1, i, j + 1, i + 1), gauche = () => sur(j, i, j + 1, i);
    const paires = { 1: [[gauche, bas]], 2: [[bas, droite]], 3: [[gauche, droite]], 4: [[droite, haut]], 5: [[gauche, haut], [bas, droite]], 6: [[bas, haut]], 7: [[gauche, haut]], 8: [[haut, gauche]], 9: [[haut, bas]], 10: [[gauche, bas], [droite, haut]], 11: [[haut, droite]], 12: [[droite, gauche]], 13: [[droite, bas]], 14: [[bas, gauche]] }[cas];
    paires.forEach(pq => { const p = pq[0](), q = pq[1](); cote.push(p.x, p.y, p.z, q.x, q.y, q.z); });
  }
  g.add(new THREE.LineSegments(geo(new Float32Array(cote), { k: rempli(cote.length / 3, 1) }), S.mat({ a: '--ink3', b: '--ink2', min: 0.35 })));
  const L = D.lieux, pos = L.map(l => V3(l.lat, l.lon)), lp = new Float32Array(L.length * 3), kl = rempli(L.length, 1); pos.forEach((p, i) => lp.set([p.x, p.y, p.z], i * 3));
  const glx = geo(lp, { k: kl, taille: rempli(L.length, 6.5) }); g.add(new THREE.Points(glx, S.mat({ rond: 1, min: 0.8 })));
  const camDir = new THREE.Vector3(), w = new THREE.Vector3();
  const dos = p => () => { w.copy(p).applyMatrix4(g.matrixWorld); camDir.copy(S.cam.position).sub(w); return w.dot(camDir) < 0.05 * R; };
  const noms = L.map((l, i) => { const nm = S.nom(l.nom, 'lieu', g); nm.p.copy(pos[i]).multiplyScalar(1.03); nm.dx = 10; nm.ancre = ' translate(0,-50%)'; nm.dos = dos(pos[i]); nm.fond = false; return nm; });
  S.cache = p => { w.copy(p).normalize().multiplyScalar(R).applyMatrix4(g.matrixWorld); camDir.copy(S.cam.position).sub(w); return w.dot(camDir) < 0; };
  const mArc = S.mat({ a: '--ink3', b: '--ink', min: 0.5 }), mDed = S.mat({ a: '--amb', b: '--amb', tiret: 0.07, min: 0.6 });
  const arcs = D.arcs.map((a, q) => {
    const u = pos[a.de].clone().normalize(), v = pos[a.a].clone().normalize(), ang = u.angleTo(v), M = 72, p = new Float32Array((M + 1) * 3), dist = new Float32Array(M + 1), pts = [];
    for (let i = 0; i <= M; i++) { const t = i / M, s = Math.sin(ang), x = u.clone().multiplyScalar(Math.sin((1 - t) * ang) / s).add(v.clone().multiplyScalar(Math.sin(t * ang) / s)).multiplyScalar(R * (1 + Math.sin(Math.PI * t) * (0.06 + ang * 0.11))); p.set([x.x, x.y, x.z], i * 3); dist[i] = t * ang * R; if (i % 4 === 0) pts.push(x); }
    const ga = geo(p, { k: rempli(M + 1, 0.75), dist }), ligne = new THREE.Line(ga, a.deduit ? mDed : mArc); g.add(ligne); S.cible(q, pts, g);
    return { k: ga.attributes.k, km: ang * (D.rayonKm || 6371), a };
  });
  S.surVise = q => {
    arcs.forEach((a, i) => poser(a.k, i === q ? 2 : q < 0 ? 0.75 : 0.25));
    L.forEach((l, i) => { const tenu = q >= 0 && (D.arcs[q].de === i || D.arcs[q].a === i); kl[i] = tenu ? 2 : 1; noms[i].el.className = 'v3-nom ' + (tenu ? 'dit or' : 'lieu'); noms[i].op = q < 0 || tenu ? 1 : 0.35; }); glx.attributes.k.needsUpdate = true;
    if (q < 0) S.dire(fr(L.length) + ' lieux, ' + fr(arcs.length) + ' arcs', D.repos || 'Chaque arc relie deux lieux par le plus court chemin.');
    else { const a = arcs[q]; S.dire(a.a.deduit ? 'Un arc déduit, pas encore confirmé' : 'Un arc', L[a.a.de].nom + ' – ' + L[a.a.a].nom + ' : ' + fr(Math.round(a.km / 10) * 10) + ' km à vol d’oiseau.'); }
  };
  if (o.tourne) g.rotation.y = o.tourne;
  S.clavier(D.arcs.map(a => L[a.de].nom + ' – ' + L[a.a].nom)); S.surVise(-1); S.rendre();
});

/* ════ 5 · LA VILLE ════ un champ de barres fines vu en plongée ; la rangée visée s'éclaire, la barre visée passe à l'orange.
   donnees : { rangs: ['lundi', …], colonnes: ['0 h', …], v: [rang][colonne] 0..1, max, unite, repereCol: 6 } */
V.ville = (racine, D, o) => paresseux(racine, () => {
  o = o || {};
  const S = scene(racine, Object.assign({ titre: 'La *ville*', mot: 'Ville', vue: { az: -0.5, el: 0.62, d: 15.5, y: 0.5 }, rayon: 5, el: [0.12, 1.5], geste: 'Vise une barre : sa rangée s’éclaire.' }, o)); if (S.mort) return;
  const NR = D.rangs.length, NC = D.colonnes.length, LX = 8.6, LZ = 5.4, HY = 2.4, g = new THREE.Group(); S.scene.add(g);
  const X = c => (c / (NC - 1) - 0.5) * LX, Z = r => (r / (NR - 1) - 0.5) * LZ, N = NR * NC, w = Math.min(LX / NC, LZ / NR) * 0.21;
  /* chaque barre : ses arêtes seules (quatre montants, le carré du toit), et son ombre portée au sol, trois traits couchés vers la lumière.
     Un voile invisible (des boîtes qui n'écrivent que la profondeur) cache les arêtes qui passent derrière une barre plus proche. */
  const AV = 16, OV = 6, ar = new Float32Array(N * AV * 3), ka = new Float32Array(N * AV), om = new Float32Array(N * OV * 3), ko = new Float32Array(N * OV), base = new Float32Array(N);
  const voile = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), S.cacheDepth(1.2), N), m4 = new THREE.Matrix4(), LUM = [0.62, 0.34];   /* la lumière vient du fond à gauche : l'ombre part vers la droite et vers nous */
  for (let r = 0; r < NR; r++) for (let c = 0; c < NC; c++) {
    const i = r * NC + c, x = X(c), z = Z(r), h = 0.02 + D.v[r][c] * HY, x0 = x - w, x1 = x + w, z0 = z - w, z1 = z + w, sw = h * 0.42;
    const sg = [x0, 0, z0, x0, h, z0, x1, 0, z0, x1, h, z0, x1, 0, z1, x1, h, z1, x0, 0, z1, x0, h, z1, x0, h, z0, x1, h, z0, x1, h, z0, x1, h, z1, x1, h, z1, x0, h, z1, x0, h, z1, x0, h, z0];
    ar.set(sg, i * AV * 3); base[i] = 0.16 + 0.6 * D.v[r][c]; ka.fill(base[i], i * AV, (i + 1) * AV);
    om.set([x1, 0.004, z0, x1 + sw * LUM[0], 0.004, z0 + sw * LUM[1], x1, 0.004, z1, x1 + sw * LUM[0], 0.004, z1 + sw * LUM[1], x + w * 0.1, 0.004, z, x + w * 0.1 + sw * LUM[0] * 0.9, 0.004, z + sw * LUM[1] * 0.9], i * OV * 3); ko.fill(0.18, i * OV, (i + 1) * OV);
    m4.makeScale(w * 1.96, h, w * 1.96).setPosition(x, h / 2, z); voile.setMatrixAt(i, m4);
    S.cible(i, [new THREE.Vector3(x, h, z)], g);
  }
  voile.renderOrder = -1; g.add(voile);
  const garetes = geo(ar, { k: ka }), gombres = geo(om, { k: ko });
  g.add(new THREE.LineSegments(gombres, S.mat({ a: '--trait-vu', b: '--ink2', min: 0.5 })));
  const aretes = new THREE.LineSegments(garetes, S.mat({ a: '--trait-vu', b: '--ink', c: '--or', min: 0.3 })); aretes.renderOrder = 1; g.add(aretes);
  /* le toit de la barre visée : un plan plein, orange, pour qu'on la trouve d'un coup d'œil */
  const toit = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), S.mat({ a: '--or', b: '--or', op: 0.55, min: 1 })); toit.geometry.setAttribute('k', new THREE.BufferAttribute(rempli(4, 1), 1)); toit.visible = false; toit.renderOrder = 3; toit.material.depthTest = false; g.add(toit);
  /* la barre visée passe devant tout : on la retrouve même cachée derrière une plus haute */
  const gvise = geo(new Float32Array(AV * 3), { k: rempli(AV, 2) }), vise = new THREE.LineSegments(gvise, S.mat({ min: 1 })); vise.material.depthTest = false; vise.renderOrder = 4; vise.visible = false; vise.frustumCulled = false; g.add(vise);
  const sol = [], ks = []; for (let r = 0; r < NR; r++) { sol.push(X(0) - 0.2, 0, Z(r), X(NC - 1) + 0.2, 0, Z(r)); ks.push(0.5, 0.5); }
  const gs = geo(new Float32Array(sol), { k: new Float32Array(ks) }); g.add(new THREE.LineSegments(gs, S.mat({ a: '--trait', b: '--ink2', min: 0.4 })));
  const pasCol = D.repereCol || 6; for (let c = 0; c < NC; c += pasCol) { const a = S.nom(D.colonnes[c], '', g); a.p.set(X(c), 0, Z(0) - 0.45); a.ancre = ' translate(-50%,-100%)'; a.fond = false; }
  const nomRang = S.nom('', 'nom', g), val = S.nom('', 'val', g); nomRang.ancre = ' translate(-100%,-50%)'; nomRang.dx = -14; nomRang.fond = val.fond = false; val.ancre = ' translate(-50%,-125%)';
  const max = D.max || 100;
  S.surVise = q => {
    const r = q < 0 ? -1 : Math.floor(q / NC), c = q < 0 ? -1 : q % NC;
    for (let i = 0; i < N; i++) { const kk = i === q ? 2 : r < 0 ? base[i] : Math.floor(i / NC) === r ? 1 : base[i] * 0.42; ka.fill(kk, i * AV, (i + 1) * AV); ko.fill(r < 0 || Math.floor(i / NC) === r ? 0.18 + (i === q ? 0.5 : 0) : 0.08, i * OV, (i + 1) * OV); }
    garetes.attributes.k.needsUpdate = true; gombres.attributes.k.needsUpdate = true;
    toit.visible = vise.visible = q >= 0; if (q >= 0) { gvise.attributes.position.array.set(ar.subarray(q * AV * 3, (q + 1) * AV * 3)); gvise.attributes.position.needsUpdate = true; gvise.computeBoundingSphere(); toit.scale.set(w * 1.96, 1, w * 1.96); toit.position.set(X(q % NC), 0.02 + D.v[Math.floor(q / NC)][q % NC] * HY + 0.002, Z(Math.floor(q / NC))); }
    for (let i = 0; i < NR; i++) gs.attributes.k.array[i * 2] = gs.attributes.k.array[i * 2 + 1] = i === r ? 1 : 0.5; gs.attributes.k.needsUpdate = true;
    nomRang.on = val.on = q >= 0;
    if (q < 0) { S.dire(fr(NR) + ' rangées de ' + fr(NC), D.repos || 'Chaque barre est une heure ; sa hauteur, ce qui s’y passe.'); return; }
    const v = D.v[r][c]; let cm = 0; D.v[r].forEach((x, i) => { if (x > D.v[r][cm]) cm = i; });
    nomRang.p.set(X(0) - 0.2, 0, Z(r)); nomRang.el.textContent = D.rangs[r]; val.p.set(X(c), 0.02 + v * HY, Z(r)); val.el.textContent = fr(v * max); val.el.classList.add('or');
    S.dire(D.rangs[r] + ', ' + D.colonnes[c], fr(v * max) + (D.unite ? ' ' + D.unite : '') + '. ' + (cm === c ? 'C’est le plus haut de la rangée.' : 'Le plus haut de la rangée est à ' + D.colonnes[cm] + ' : ' + fr(D.v[r][cm] * max) + '.'));
  };
  const lib = []; for (let r = 0; r < NR; r++) { let cm = 0; D.v[r].forEach((x, i) => { if (x > D.v[r][cm]) cm = i; }); lib.push([r * NC + cm, D.rangs[r]]); }
  /* au clavier, Tab passe d'une rangée à l'autre : on vise le plus haut de chacune */
  S.clavier(lib.map(l => l[1]), lib.map(l => l[0]));
  S.surVise(-1); S.rendre();
});

/* ════ 6 · LA SPIRALE DU TEMPS ════ une hélice : un tour par an, un point par jour, le rayon dit la valeur. On tire la tête de lecture.
   donnees : { tours, parTour, v: [0..1 …], max, unite, date(i) → 'le 14 mars, an 2', reperes: ['janv.', …] } */
V.spirale = (racine, D, o) => paresseux(racine, () => {
  o = o || {};
  const S = scene(racine, Object.assign({ titre: 'La *spirale* du temps', mot: 'Temps', vue: { az: 0.3, el: 0.5, d: 13.5 }, rayon: 4, el: [-0.3, 1.5], geste: 'Tire la tête de lecture le long de la spirale, ou le curseur. Le même jour des autres tours s’y relie.' }, o)); if (S.mort) return;
  const T = D.tours, PT = D.parTour, n = D.v.length, R0 = 1.6, DR = 0.95, HY = 4.4, g = new THREE.Group(); S.scene.add(g);
  const pt = i => { const a = i / PT * Math.PI * 2, r = R0 + D.v[i] * DR; return new THREE.Vector3(Math.sin(a) * r, (i / (n - 1) - 0.5) * HY, Math.cos(a) * r); };
  const pts = []; const p = new Float32Array(n * 3), k = new Float32Array(n); for (let i = 0; i < n; i++) { const v = pt(i); pts.push(v); p.set([v.x, v.y, v.z], i * 3); }
  const gh = geo(p, { k }); g.add(new THREE.Line(gh, S.mat({ a: '--trait-vu', b: '--ink', min: 0.3 })));
  /* l'âme de la spirale : le tour sans valeur, très pâle, pour lire l'écart */
  const pa = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = i / PT * Math.PI * 2; pa.set([Math.sin(a) * R0, (i / (n - 1) - 0.5) * HY, Math.cos(a) * R0], i * 3); }
  g.add(new THREE.Line(geo(pa, { k: rempli(n, 0.3) }), S.mat({ a: '--trait', b: '--ink3', op: 0.7, min: 0.3 })));
  const pe = new Float32Array(T * 6), ge = geo(pe, { k: rempli(T * 2, 2) }), echos = new THREE.LineSegments(ge, S.mat({ op: 0.55, min: 1 })); echos.material.depthTest = false; g.add(echos);
  const pm = new Float32Array(T * 3), gm = geo(pm, { k: rempli(T, 2), taille: rempli(T, 5) }), marques = new THREE.Points(gm, S.mat({ rond: 1, min: 1 })); marques.material.depthTest = false; g.add(marques);
  const val = S.nom('', 'val or', g), autres = []; for (let t = 0; t < T; t++) { const a = S.nom('', '', g); a.fond = false; a.dx = 12; a.ancre = ' translate(0,-50%)'; autres.push(a); }
  val.fond = false; val.dx = 16; val.ancre = ' translate(0,-50%)';
  const NR = (D.reperes || []).length, reperes = (D.reperes || []).map(t => { const a = S.nom(t, '', g); a.ancre = ' translate(-50%,-50%)'; return a; });
  let tete = D.depart == null ? Math.round(n * 0.62) : D.depart, api = null; const max = D.max || 100;
  function poserTete(i, deLaMain) {
    tete = borne(i, 0, n - 1); for (let q = 0; q < n; q++) k[q] = q <= tete ? 1 : 0.12; gh.attributes.k.needsUpdate = true;
    const jour = tete % PT, tour = Math.floor(tete / PT), y = pts[tete].y;
    for (let t = 0; t < T; t++) { const q = Math.min(n - 1, t * PT + jour), v = pts[q]; pm.set([v.x, v.y, v.z], t * 3); gm.attributes.taille.array[t] = t === tour ? 10 : 5; const ame = new THREE.Vector3(pa[q * 3], pa[q * 3 + 1], pa[q * 3 + 2]); pe.set([ame.x, ame.y, ame.z, v.x, v.y, v.z], t * 6); autres[t].on = t !== tour; autres[t].p.copy(v); autres[t].el.textContent = fr(D.v[q] * max); }
    gm.attributes.position.needsUpdate = true; gm.attributes.taille.needsUpdate = true; ge.attributes.position.needsUpdate = true;
    val.p.copy(pts[tete]); val.el.textContent = fr(D.v[tete] * max);
    reperes.forEach((a, q) => { const an = q / NR * Math.PI * 2; a.p.set(Math.sin(an) * (R0 + DR + 0.55), y, Math.cos(an) * (R0 + DR + 0.55)); });
    const avant = tour > 0 ? D.v[tete - PT] * max : null;
    S.dire(D.date ? D.date(tete) : 'Jour ' + (tete + 1), fr(D.v[tete] * max) + (D.unite ? ' ' + D.unite : '') + '.' + (avant == null ? '' : ' Un tour plus tôt, le même jour : ' + fr(avant) + '.'));
    if (!deLaMain && api) api.valeur(tete); S.rendre();
  }
  const E = { x: 0, y: 0, z: 0, ok: true };
  S.prendre = l => { S.ecran(pts[tete], g, E); return Math.hypot(E.x - l.x, E.y - l.y) < 34; };
  S.tenir = l => { const r = S.plusProche(pts, g, l.x, l.y); if (r.i >= 0) poserTete(r.i); };
  api = S.curseur('la tête de lecture', { 'data-min': 0, 'data-max': n - 1, 'data-valeur': tete }, v => poserTete(v, true));
  const out = racine.querySelector('.v3-reglages output'); if (out) out.hidden = true;
  poserTete(tete, true); S.rendre();
});

/* ════ 7 · LE DELTA ════ un arbre de flux, à la manière d'un fleuve : chaque source est un fil ; les fils courent côte à côte et se rejoignent,
   du petit au grand. L'épaisseur d'un bras, c'est le nombre de fils qu'il porte : rien d'autre ne la dessine.
   donnees : { bras: [{ parent (indice ou -1), pts: [[x, z] …] (du confluent vers l'amont), nom }], unite: 'sources' } — V.delta.pousser(graine) en fabrique un. */
V.delta = (racine, D, o) => paresseux(racine, () => {
  o = o || {};
  const S = scene(racine, Object.assign({ titre: 'Le *delta*', mot: 'Delta', vue: { az: 0.0, el: 1.0, d: 17, z: -0.25 }, rayon: 5.5, el: [0.25, 1.53], geste: 'Vise un bras : ses fils s’allument, des sources jusqu’à l’embouchure.' }, o)); if (S.mort) return;
  const B = D.bras, g = new THREE.Group(), PAS = o.pas || 0.017, M = 16; S.scene.add(g);
  const enfants = B.map(() => []); B.forEach((b, q) => { if (b.parent >= 0) enfants[b.parent].push(q); });
  /* les sources de chaque bras, de gauche à droite : l'ordre des fils dans le faisceau */
  const sources = B.map(() => []); let nSources = 0;
  (function compter(q) { if (!enfants[q].length) { sources[q] = [nSources++]; return; } enfants[q].forEach(e => { compter(e); sources[q] = sources[q].concat(sources[e]); }); })(0);
  /* l'axe de chaque bras, échantillonné ; un enfant part du bout de son parent, décalé à la place de son faisceau */
  const axes = B.map(() => null), niveau = B.map((b, q) => { let n = 0; for (let x = b.parent; x >= 0; x = B[x].parent) n++; return n; }), PENTE = o.pente == null ? 0.16 : o.pente;
  (function tracer(q, ox, oz) {
    const b = B[q], c = new THREE.CatmullRomCurve3(b.pts.map(p => new THREE.Vector3(p[0] + ox, 0, p[1] + oz))), pts = [], nor = [];
    for (let i = 0; i <= M; i++) { const t = i / M, p = c.getPoint(t), tg = c.getTangent(t), l = Math.hypot(tg.x, tg.z) || 1; p.y = (niveau[q] + t) * PENTE; pts.push(p); nor.push([-tg.z / l, tg.x / l]); }
    axes[q] = { pts, nor }; b.milieu = pts[M >> 1]; b.bout = pts[M];
    let rang = 0; const n = sources[q].length;
    enfants[q].forEach(e => { const ne = sources[e].length, dec = (rang + (ne - 1) / 2 - (n - 1) / 2) * PAS; rang += ne; const fin = b.pts[b.pts.length - 1], deb = B[e].pts[0]; tracer(e, pts[M].x + nor[M][0] * dec - deb[0], pts[M].z + nor[M][1] * dec - deb[1]); void fin; });
    S.cible(q, pts.filter((p, i) => i % 3 === 1), g);
  })(0, 0, 0);
  /* un fil par source : il suit chaque bras de son chemin, à sa place dans le faisceau */
  const mat = S.mat({ a: '--ink3', b: '--ink', min: 0.3 }), fils = [];
  for (let s = 0; s < nSources; s++) {
    let q = 0; const chemin = [0]; while (enfants[q].length) { q = enfants[q].find(e => sources[e].indexOf(s) >= 0); chemin.push(q); }
    const p = [];
    chemin.forEach(b => { const a = axes[b], n = sources[b].length, dec = (sources[b].indexOf(s) - (n - 1) / 2) * PAS; for (let i = b === 0 ? 0 : 1; i <= M; i++) p.push(a.pts[i].x + a.nor[i][0] * dec, a.pts[i].y, a.pts[i].z + a.nor[i][1] * dec); });
    const gf = geo(new Float32Array(p), { k: rempli(p.length / 3, 0.8) }); g.add(new THREE.Line(gf, mat)); fils.push(gf.attributes.k);
  }
  const noms = B.map((b, q) => { if (!b.nom || q > 0) return null; const a = S.nom(b.nom, 'nom', g);   /* seule l'embouchure porte son nom sur la scène ; les bras se nomment dans la lecture */ const ax = axes[q], m2 = M >> 1, l = sources[q].length * PAS / 2 + 0.16; if (q === 0) { a.p.copy(ax.pts[0]); a.dy = 16; a.ancre = ' translate(-50%,0)'; } else { a.p.set(ax.pts[m2].x + ax.nor[m2][0] * l, ax.pts[m2].y, ax.pts[m2].z + ax.nor[m2][1] * l); a.ancre = ' translate(0,-50%)'; a.on = false; } a.fond = false; return a; });
  const val = S.nom('', 'val or', g); val.fond = false; val.ancre = ' translate(-50%,-125%)';
  S.surVise = q => {
    const tenus = q < 0 ? null : new Set(sources[q]); let confluents = 0; const chemin = new Set(); for (let x = q; x >= 0; x = B[x].parent) { chemin.add(x); if (x !== q) confluents++; }
    fils.forEach((k, s) => poser(k, tenus ? (tenus.has(s) ? 2 : 0.3) : 0.8));
    noms.forEach((a, i) => { if (a) { a.el.classList.toggle('or', chemin.has(i)); a.on = i === 0 || chemin.has(i); a.op = q < 0 || chemin.has(i) ? 1 : 0.4; } });
    val.on = q > 0;
    if (q < 0) { S.dire(fr(nSources) + ' ' + (D.unite || 'sources') + ', une embouchure', D.repos || 'Chaque source est un fil. Les fils se rejoignent : l’épaisseur d’un bras, c’est ce qu’il porte.'); return; }
    const n = sources[q].length; val.p.copy(B[q].milieu); val.el.textContent = fr(n);
    S.dire((B[q].nom || (enfants[q].length ? 'Un bras' : 'Une source')) + ' · ' + fr(n) + ' sur ' + fr(nSources),
      (q === 0 ? 'C’est l’embouchure : tout y passe.' : (n > 1 ? 'Il réunit ' + fr(n) + ' sources. ' : 'Un seul fil. ') + (confluents === 1 ? 'Un confluent plus bas, c’est l’embouchure.' : fr(confluents) + ' confluents plus bas, c’est l’embouchure.')));
  };
  S.clavier(B.map((b, q) => b.nom || (enfants[q].length ? 'bras ' : 'source ') + (q + 1))); S.surVise(-1); S.rendre();
});
/* fabriquer un delta : on part de l'embouchure et on remonte ; à chaque confluent les sources se partagent ; l'éventail se resserre en montant */
V.delta.pousser = function (graine, o) {
  o = Object.assign({ sources: 96, noms: [] }, o || {}); const h = V.hasard(graine || 3), B = []; let nNom = 0;
  (function bras(x, z, dir, n, niveau, parent, ouvert, depart) {
    const lg = (0.8 + h() * 0.5) * (niveau === 0 ? 1.5 : Math.pow(0.9, niveau)) * (0.8 + 0.5 * Math.sqrt(n / o.sources)), pts = [[x, z]]; let cx = x, cz = z, d = depart == null ? dir : depart;
    cx += Math.sin(d) * lg * 0.14; cz -= Math.cos(d) * lg * 0.14; pts.push([cx, cz]);   /* un bras quitte son confluent dans le sens du courant, puis s'en écarte */
    for (let i = 1; i <= 3; i++) { d = (depart == null ? dir : depart + (dir - depart) * Math.min(1, i / 2)) + (h() - 0.5) * 0.3; cx += Math.sin(d) * lg / 3; cz -= Math.cos(d) * lg / 3; pts.push([cx, cz]); }
    const moi = B.length; B.push({ parent, pts, nom: niveau === 0 ? (o.embouchure || null) : niveau === 1 && nNom < o.noms.length ? o.noms[nNom++] : null });
    if (n <= 1) return;
    const trois = n >= 9 && h() < 0.3, r = 0.32 + h() * 0.36; let parts = trois ? [r * 0.6, 0.4, (1 - r) * 0.6] : [r, 1 - r];
    let ns = parts.map(p => Math.max(1, Math.round(p * n))); ns[ns.length - 1] = Math.max(1, n - ns.slice(0, -1).reduce((a, b) => a + b, 0)); if (ns.reduce((a, b) => a + b, 0) !== n) ns = [Math.floor(n / 2), n - Math.floor(n / 2)];
    const k = ns.length; ns.forEach((ne, i) => bras(cx, cz, d + ((i + 0.5) / k - 0.5) * ouvert * (1 + 0.25 * (h() - 0.5)), ne, niveau + 1, moi, ouvert * 0.76, d));
  })(0, 3.6, 0, o.sources, 0, -1, 1.35, null);
  return { bras: B };
};

/* ════ 8 · LES COUCHES ════ des plans empilés, un par famille ; on les écarte d'un geste ; les liens passent d'un plan à l'autre.
   donnees : { plans: [{ nom, points: [{ nom, x, z }] }], liens: [[plan, i, plan, j]], fil: [indices de liens du fil qui compte] } */
V.couches = (racine, D, o) => paresseux(racine, () => {
  o = o || {};
  const S = scene(racine, Object.assign({ titre: 'Les *couches*', mot: 'Couches', vue: { az: -0.62, el: 0.4, d: 16.5 }, rayon: 5, el: [-0.2, 1.45], geste: 'Écarte les plans avec le curseur. Vise un point : sa chaîne traverse les couches.' }, o)); if (S.mort) return;
  const PL = D.plans, NPL = PL.length, LX = 6.4, LZ = 4.2, g = new THREE.Group(); S.scene.add(g); let ecart = 0.966;
  const Y = i => (i - (NPL - 1) / 2) * ecart;
  const mPlan = S.mat({ a: '--trait-vu', b: '--ink3', op: 0.16, min: 0.6 }), mCoin = S.mat({ a: '--ink3', b: '--ink', min: 0.5 }), mPts = S.mat({ a: '--ink3', b: '--ink', rond: 1, min: 0.45 });
  const plans = PL.map((pl, i) => {
    const gp = new THREE.Group(); g.add(gp);
    const q = new Float32Array([-LX / 2, 0, -LZ / 2, LX / 2, 0, -LZ / 2, LX / 2, 0, LZ / 2, -LX / 2, 0, LZ / 2]), gq = geo(q, { k: rempli(4, 0) }); gq.setIndex([0, 1, 2, 0, 2, 3]); gp.add(new THREE.Mesh(gq, mPlan));
    const c = 0.32, coins = []; [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(s => { const x = s[0] * LX / 2, z = s[1] * LZ / 2; coins.push(x, 0, z, x - s[0] * c, 0, z, x, 0, z, x, 0, z - s[1] * c); });
    const gc = geo(new Float32Array(coins), { k: rempli(16, 0.6) }); gp.add(new THREE.LineSegments(gc, mCoin));
    const pp = new Float32Array(pl.points.length * 3); pl.points.forEach((p, j) => pp.set([p.x * LX / 2, 0.01, p.z * LZ / 2], j * 3));
    const gpts = geo(pp, { k: rempli(pl.points.length, 0.7), taille: rempli(pl.points.length, 6) }); gp.add(new THREE.Points(gpts, mPts));
    const nom = S.nom(pl.nom, 'nom', gp); nom.p.set(-LX / 2, 0, LZ / 2); nom.dx = -14; nom.ancre = ' translate(-100%,-50%)'; nom.fond = false;
    const noms = pl.points.map((p, j) => { const a = S.nom(p.nom, 'dit', gp); a.p.set(p.x * LX / 2, 0, p.z * LZ / 2); a.dx = 11; a.ancre = ' translate(0,-50%)'; a.on = false; a.fond = false; return a; });
    return { gp, gpts, coinK: gc.attributes.k, nom, noms };
  });
  const base = []; let cpt = 0; PL.forEach((pl, i) => { base.push(cpt); pl.points.forEach((p, j) => { S.cible(cpt++, [new THREE.Vector3(p.x * LX / 2, 0, p.z * LZ / 2)], plans[i].gp); }); });
  const NL = D.liens.length, M = 14, pl = new Float32Array(NL * M * 6), kl = new Float32Array(NL * M * 2), vl = new Float32Array(NL * M * 2), gl = geo(pl, { k: kl, voile: vl }); g.add(new THREE.LineSegments(gl, S.mat({ a: '--ink3', b: '--ink', min: 0.5 })));
  const fil = new Set(D.fil || []);
  function tendre() {
    plans.forEach((p, i) => { p.gp.position.y = Y(i); });
    D.liens.forEach((l, q) => {
      const a = PL[l[0]].points[l[1]], b = PL[l[2]].points[l[3]], ya = Y(l[0]), yb = Y(l[2]); let px = a.x * LX / 2, py = ya, pz = a.z * LZ / 2;
      for (let i = 1; i <= M; i++) { const t = i / M, s = t * t * (3 - 2 * t), x = mix(a.x, b.x, s) * LX / 2, y = mix(ya, yb, t), z = mix(a.z, b.z, s) * LZ / 2; pl.set([px, py, pz, x, y, z], (q * M + i - 1) * 6); px = x; py = y; pz = z; }
    });
    gl.attributes.position.needsUpdate = true;
  }
  const adj = {}; D.liens.forEach((l, q) => { const a = base[l[0]] + l[1], b = base[l[2]] + l[3]; (adj[a] = adj[a] || []).push([b, q]); (adj[b] = adj[b] || []).push([a, q]); });
  const ou = c => { let i = NPL - 1; while (base[i] > c) i--; return [i, c - base[i]]; };
  S.surVise = c => {
    const pts = new Set(), ls = new Set();
    if (c >= 0) { const file = [c]; pts.add(c); while (file.length) { const x = file.pop(); (adj[x] || []).forEach(v => { ls.add(v[1]); if (!pts.has(v[0])) { pts.add(v[0]); file.push(v[0]); } }); } }
    for (let q = 0; q < NL; q++) { const tenu = ls.has(q), v = tenu ? 2 : fil.has(q) ? 1 : 0.3, cache = tenu || (c < 0 && fil.has(q)) ? 0 : (ecart > 1.6 && c < 0 ? 0.82 : 1); for (let j = q * M * 2; j < (q + 1) * M * 2; j++) { kl[j] = v; vl[j] = cache; } }
    gl.attributes.k.needsUpdate = true; gl.attributes.voile.needsUpdate = true;
    plans.forEach((p, i) => { const k = p.gpts.attributes.k.array; PL[i].points.forEach((pt, j) => { const id = base[i] + j; k[j] = id === c ? 2 : pts.has(id) ? 1 : c < 0 ? 0.7 : 0.25; p.noms[j].on = pts.has(id); p.noms[j].el.classList.toggle('or', id === c); }); p.gpts.attributes.k.needsUpdate = true; });
    if (c < 0) { S.dire(fr(NPL) + ' couches', D.repos || 'Un seul fil se voit : celui qui traverse tout. Écarte les plans pour deviner les autres.'); return; }
    const w = ou(c), relies = [...pts].filter(x => x !== c).map(x => { const z = ou(x); return PL[z[0]].points[z[1]].nom + ' (' + PL[z[0]].nom + ')'; });
    S.dire(PL[w[0]].points[w[1]].nom + ' · ' + PL[w[0]].nom, relies.length ? 'Sa chaîne passe par ' + liste(relies.slice(0, 5)) + (relies.length > 5 ? ', et ' + fr(relies.length - 5) + ' autres' : '') + '.' : 'Rien ne le relie encore aux autres couches.');
  };
  const lib = []; PL.forEach(p => p.points.forEach(pt => lib.push(pt.nom + ', ' + p.nom))); S.clavier(lib);
  S.curseur('écarter les plans', { 'data-min': 0, 'data-max': 100, 'data-valeur': 46 }, v => { ecart = v / 100 * 2.1; tendre(); S.surVise(S.ici); });
  tendre(); S.surVise(-1); S.rendre();
});

/* ════ 9 · LES PARTICULES ════ un même nuage de points qui se range en plusieurs dispositions, sous un curseur. Rien ne s'ajoute : la matière se déplace.
   donnees : { n, dispositions: [{ nom, dit, p(i, n, hasard) → [x, y, z] }] } */
V.particules = (racine, D, o) => paresseux(racine, () => {
  o = o || {};
  const S = scene(racine, Object.assign({ titre: 'Le nuage *se range*', mot: 'Nuage', vue: { az: 0.5, el: 0.36, d: 14 }, rayon: 4.4, el: [-0.4, 1.45], geste: 'Tire le curseur : les mêmes points passent d’une disposition à l’autre.' }, o)); if (S.mort) return;
  const n = D.n || 3600, ND = D.dispositions.length, h = V.hasard(11), formes = D.dispositions.map(d => { const t = new Float32Array(n * 3), hh = V.hasard(7); for (let i = 0; i < n; i++) t.set(d.p(i, n, hh), i * 3); return t; });
  const retard = new Float32Array(n); for (let i = 0; i < n; i++) retard[i] = h();
  const p = new Float32Array(n * 3), tailles = new Float32Array(n), k = new Float32Array(n); for (let i = 0; i < n; i++) { tailles[i] = 1.6 + h() * 2.2; k[i] = 0.35 + h() * 0.65; }
  const g = geo(p, { k, taille: tailles }); S.scene.add(new THREE.Points(g, S.mat({ a: '--ink3', b: '--ink', rond: 1, min: 0.18 })));
  function ranger(v) {
    const a = Math.min(ND - 2, Math.floor(v)), f = v - a, A = formes[a], B = formes[a + 1];
    for (let i = 0; i < n; i++) { const t = lisse(f * 1.5 - retard[i] * 0.5, 0, 1), j = i * 3; p[j] = mix(A[j], B[j], t); p[j + 1] = mix(A[j + 1], B[j + 1], t); p[j + 2] = mix(A[j + 2], B[j + 2], t); }
    g.attributes.position.needsUpdate = true; const pres = Math.round(v), d = D.dispositions[pres];
    S.dire(Math.abs(v - pres) < 0.08 ? d.nom : 'Entre ' + D.dispositions[a].nom.toLowerCase() + ' et ' + D.dispositions[a + 1].nom.toLowerCase(), Math.abs(v - pres) < 0.08 ? d.dit : 'Les ' + fr(n) + ' points sont en chemin : aucun n’est ajouté, aucun n’est retiré.');
  }
  S.curseur('la disposition', { 'data-min': 0, 'data-max': (ND - 1) * 100, 'data-valeur': 0 }, v => ranger(v / 100));
  const out = racine.querySelector('.v3-reglages output'); if (out) out.hidden = true;
  S.mots(D.dispositions.map(d => d.nom.toLowerCase()), i => { const c = racine.querySelector('.ke-curseur'); if (c && c._ke) c._ke.valeur(i * 100); ranger(i); }, 0);
  ranger(0); S.rendre();
});

document.dispatchEvent(new CustomEvent('ke:viz3d'));
