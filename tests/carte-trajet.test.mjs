// Le trajet sur la carte v3 : distances validées, et la place du totem par rapport au retour.
// Mêmes points et même transformation que carte/build_map_page_v3.py (repère de dessin -> km réels).
// node --test tests/carte-trajet.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const meta = JSON.parse(readFileSync(new URL('../carte/map_meta.json', import.meta.url), 'utf8'));
const source = readFileSync(new URL('../carte/build_map_page_v3.py', import.meta.url), 'utf8');
const { R0, k: KF, w: WS } = meta.transform;

const Tr = (r) => r + (KF - 1) * WS * Math.log1p(Math.exp(Math.max(Math.min((r - R0) / WS, 50), -50)));
const phys = ([x, y]) => {
  const r = Math.hypot(x, y);
  if (r === 0) return [0, 0];
  const f = Tr(r) / r;
  return [x * f, y * f];
};
const ecart = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const dense = (pts, n = 40) => {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    for (let j = 0; j < n; j++) {
      const t = j / n;
      out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};
const longueur = (pts) => pts.slice(1).reduce((s, p, i) => s + ecart(pts[i], p), 0);

// Le tracé est lu dans le générateur de la carte : pas de copie qui pourrait diverger.
const ligne = source.match(/^path_d = \[(.+)\]$/m);
assert.ok(ligne, 'path_d introuvable dans carte/build_map_page_v3.py');
const TRAJET = [...ligne[1].matchAll(/\((-?\d+),(-?\d+)\)/g)].map((m) => [Number(m[1]), Number(m[2])]);
const P = dense(TRAJET).map(phys);
const cumul = [0];
for (let i = 1; i < P.length; i++) cumul.push(cumul[i - 1] + ecart(P[i - 1], P[i]));
const indice = (d) => {
  const q = phys(d);
  let best = 0;
  for (let i = 1; i < P.length; i++) if (ecart(P[i], q) < ecart(P[best], q)) best = i;
  return best;
};
const au = (d) => cumul[indice(d)];
const dizaine = (v) => Math.round(v / 10) * 10;

const XENOPOD = [0, 0], ROB2 = [12, 222], COL = [32, 362], ROB3 = [95, 478], ROB4 = [700, 40], LACS = [335, -125];

test('le tracé de la carte redonne les distances validées au round 11', (t) => {
  const d = { rob2: au(ROB2), col: au(COL), rob3: au(ROB3), rob4: au(ROB4), lacs: au(LACS), boucle: cumul.at(-1) };
  t.diagnostic(Object.entries(d).map(([k, v]) => `${k} ${dizaine(v)} km`).join(' · '));
  const proche = (v, cible, marge) => assert.ok(Math.abs(v - cible) <= marge, `${dizaine(v)} km au lieu de ~${cible}`);
  proche(d.rob2, 250, 30);
  proche(d.col, 680, 40);
  proche(d.rob3, 1200, 60);
  proche(d.rob4, 3300, 100);
  proche(d.lacs, 4800, 100);
  proche(d.boucle, 5500, 100);
});

test('le totem est de l\'autre côté de la boucle : le retour ne peut pas passer devant', (t) => {
  // Le totem est posé « dans la descente » du col, « presque arrivés » chez Rob3 : quelque part entre le col et Rob3.
  const descente = dense([COL, ROB3], 60).map(phys);
  const retour = P.slice(indice(ROB4));
  const iLacs = indice(LACS) - indice(ROB4);
  const apresLacs = retour.slice(iLacs);

  // 1. Au plus près, à vol d'oiseau, entre le chemin du retour et la descente du col.
  let plusPres = Infinity;
  for (const a of retour) for (const b of descente) plusPres = Math.min(plusPres, ecart(a, b));

  // 2. Le crochet le plus court : quitter le retour après les lacs, aller au totem en ligne droite, revenir au même point.
  //    C'est un plancher : la ligne droite traverse le massif et ses glaciers.
  let crochet = Infinity;
  for (const a of apresLacs) for (const b of descente) crochet = Math.min(crochet, 2 * ecart(a, b));

  // 3. Refaire le chemin de l'aller à l'envers depuis le XENOPOD (cavernes, col) jusqu'au point le plus proche, et retour.
  const allerRetour = 2 * au(COL);

  // 4. Rentrer de Rob4 par le nord, en repassant par tout l'aller : les lacs salés ne sont plus sur le chemin.
  const parLeNord = au(ROB4);
  const parLeSud = cumul.at(-1) - au(ROB4);

  t.diagnostic(`au plus près du retour : ${dizaine(plusPres)} km à vol d'oiseau`);
  t.diagnostic(`crochet le plus court depuis le retour : + ${dizaine(crochet)} km (boucle ${dizaine(cumul.at(-1) + crochet)} km)`);
  t.diagnostic(`aller-retour depuis le XENOPOD par le col : + ${dizaine(allerRetour)} km au moins`);
  t.diagnostic(`retour par le nord ${dizaine(parLeNord)} km, par le sud (validé) ${dizaine(parLeSud)} km`);

  // À ~300 km par jour, un crochet de plus de 600 km ajoute deux jours et sort la boucle de ses ~5 500 km validés.
  assert.ok(plusPres > 600, `le retour passe à ${dizaine(plusPres)} km du totem`);
  assert.ok(crochet > 1200, `crochet de ${dizaine(crochet)} km`);
  assert.ok(allerRetour > 1200);
  assert.ok(parLeNord > parLeSud + 600);
});
