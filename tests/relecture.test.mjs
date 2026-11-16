// relecture/choix-de-relecture.html : l'outil de choix de la relecture (round 16).
// La page est écrite à la main et autonome ; ces vérifications lisent ses données et ses fonctions sans écran.
// node --test   (depuis la racine du dépôt)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../tools/build_film.mjs';

const RACINE = dirname(dirname(fileURLToPath(import.meta.url)));
const page = readFileSync(join(RACINE, 'relecture', 'choix-de-relecture.html'), 'utf8');
const bloc = (id) => {
  const m = page.match(new RegExp(`<script[^>]*id="${id}"[^>]*>([\\s\\S]*?)</script>`));
  assert.ok(m, `bloc ${id} absent`);
  return m[1];
};
const D = JSON.parse(bloc('data-relecture'));
const { zoneDe, bilan, texteChoix, choisi } = new Function(bloc('logique') + '\nreturn { zoneDe, bilan, texteChoix, choisi };')();
const film = build();

const norm = (s) => s
  .replace(/<br>/g, ' ')
  .replaceAll('**', '')
  .replace(/\\([|*_\-])/g, '$1')
  .replace(/[   ]/g, ' ')
  .replace(/[’‘]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/\s+/g, ' ')
  .trim();
const textes = Object.fromEntries(Object.entries(D.docs).map(([cle, d]) => [cle, norm(readFileSync(join(RACINE, d.f), 'utf8'))]));
const plans = new Set(film.plans.map((p) => p.n));
const zones = new Set([...D.actes.map((a) => a.id), ...D.modules.map((m) => m.id)]);

test('la page est autonome : aucune ressource réseau, aucune émoticône', () => {
  assert.doesNotMatch(page, /https?:\/\//);
  assert.doesNotMatch(page, /\p{Extended_Pictographic}/u);
  assert.doesNotMatch(bloc('data-relecture'), /<\/|<!--/);
});

test('les actes et les modules sont ceux du script', () => {
  assert.deepEqual(D.actes.map((a) => [a.id, a.d]), film.actes.map((a) => [a.id, a.duree_s]));
  assert.deepEqual(D.modules.map((m) => [m.id, m.d]), film.modules.map((m) => [m.id, m.duree_s]));
  assert.equal(D.actes.reduce((s, a) => s + a.d, 0), 25 * 60);
  assert.equal(D.modules.reduce((s, m) => s + m.d, 0), 27 * 60);
});

test('chaque choix : un groupe, une question, des options avec leur conséquence', () => {
  const groupes = new Set(D.groupes.map((g) => g.id));
  const ids = D.choix.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(D.choix.length, 23);
  for (const g of groupes) assert.ok(D.choix.some((c) => c.g === g), `groupe ${g} vide`);
  for (const c of D.choix) {
    assert.ok(groupes.has(c.g), c.id);
    for (const champ of ['titre', 'q', 'ctx']) assert.ok(c[champ] && c[champ].length > 10, `${c.id} : ${champ}`);
    assert.ok(c.opts.length >= 2, `${c.id} : au moins deux options`);
    assert.ok(c.opts.some((o) => !o.r), `${c.id} : une option qui tranche`);
    for (const o of c.opts) {
      assert.ok(o.l && o.h && o.h.length > 20, `${c.id} : option sans conséquence écrite`);
      for (const k of o.t) assert.ok(zones.has(k), `${c.id} : zone ${k} inconnue`);
      for (const p of o.prod) assert.ok(D.produits[p], `${c.id} : produit ${p} inconnu`);
      if (o.r) assert.deepEqual([o.t, o.docs, o.prod], [[], [], []], `${c.id} : une option qui laisse ouvert ne change rien`);
    }
    for (const n of c.plans) assert.ok(plans.has(n), `${c.id} : plan ${n} inconnu`);
    if (c.avis.o !== null) assert.ok(c.opts[c.avis.o], `${c.id} : avis sur une option qui existe`);
    if (c.avis.o !== null) assert.ok(c.avis.t.length > 20, `${c.id} : un avis dit pourquoi`);
  }
});

test('chaque citation se retrouve mot pour mot dans le document nommé', () => {
  for (const c of D.choix) {
    assert.ok(c.dit.length > 0, `${c.id} : sans citation`);
    for (const x of c.dit) {
      assert.ok(textes[x.d], `${c.id} : document « ${x.d} » inconnu`);
      assert.ok(textes[x.d].includes(norm(x.c)), `${c.id} : « ${x.c} » introuvable dans ${D.docs[x.d].n}`);
    }
  }
});

test('les plans nommés dans le texte des choix existent dans le découpage', () => {
  for (const c of D.choix) {
    const texte = [c.ctx, ...c.opts.map((o) => o.h)].join(' ');
    for (const m of texte.matchAll(/\b(P|10|[1-9])-(\d\d)\b/g)) assert.ok(plans.has(m[0]), `${c.id} : plan ${m[0]} inconnu`);
  }
});

test('ce que la page affirme sur le découpage reste vrai', () => {
  const avecCarton = film.plans.filter((p) => /carton|cartons/i.test(p.son_ecran) && /Jour/.test(p.son_ecran)).map((p) => p.n);
  assert.deepEqual(D.choix.find((c) => c.id === 'R3').plans, avecCarton);
  assert.equal(film.plans.filter((p) => /dôme/.test(p.note)).length, 19);
  assert.deepEqual(film.plans.filter((p) => /^Mot \d/.test(p.note)).map((p) => p.n), ['6-14', '7-13', '8-02', '9-15']);
  // les cinq crochets de C2 viennent après le plan de leur charnière
  const rang = Object.fromEntries(film.plans.map((p, i) => [p.n, i]));
  const charniere = Object.fromEntries(film.charnieres.map((c) => [c.module, c.plan]));
  for (const [plan, module] of [['1-10', 'M1'], ['4-09', 'M4'], ['7-20', 'M7'], ['8-02', 'M8']]) {
    assert.ok(rang[plan] > rang[charniere[module]], `${plan} après la charnière de ${module}`);
  }
  assert.ok(rang['7-18'] > rang[charniere.M4]);
});

test('zoneDe : les actes des plans cités et de toutes les options, dans l\'ordre du film', () => {
  const c = D.choix.find((x) => x.id === 'F3');
  assert.deepEqual(zoneDe(c), ['4', 'M5', 'M8']);
  assert.deepEqual(zoneDe(D.choix.find((x) => x.id === 'D4')), []);
});

test('bilan : rien au départ, puis les actes, documents et produits des options choisies', () => {
  const vide = bilan(D, {});
  assert.deepEqual([vide.tranches, vide.ouverts, vide.sans], [0, 0, 23]);
  assert.deepEqual(vide.lignes, []);
  assert.ok(vide.attente['7'] >= 5);
  const b = bilan(D, { R2: { c: 0, t: '' }, C1: { c: 2, t: '' }, F3: { c: 0, t: 'x' }, G1: { c: 9, t: '' } });
  assert.deepEqual([b.tranches, b.ouverts, b.sans], [2, 1, 20]);
  assert.deepEqual(b.zones['1'], ['R2']);
  assert.deepEqual(b.zones.M8, ['F3']);
  assert.deepEqual(b.docs.Registre, ['R2']);
  assert.deepEqual(b.prod['55'], ['R2', 'F3']);
  assert.deepEqual(b.lignes.map((x) => [x.id, x.r]), [['R2', false], ['F3', false], ['C1', true]]);
  assert.equal(choisi(D.choix.find((c) => c.id === 'G1'), { G1: { c: 9 } }), -1);
});

test('texteChoix : les choix, les précisions, et ce qui reste sans réponse', () => {
  const t = texteChoix(D, { R2: { c: 0, t: ' ' }, G1: { c: -1, t: 'Une correction libre.' } }, '16/11/2026');
  assert.match(t, /^SECOND EARTH · relecture · mes choix \(16\/11\/2026\)/);
  assert.match(t, /R2 · Ce que Rob1 sait des autres Robs après le gouffre\nChoix : Valider les balises\n/);
  assert.match(t, /G1 · Et après : le gel du monde\nPrécision : Une correction libre\./);
  assert.match(t, /Sans réponse : R1, R3, /);
  assert.doesNotMatch(t, /undefined|null|NaN/);
  const tout = Object.fromEntries(D.choix.map((c) => [c.id, { c: 0, t: '' }]));
  assert.match(texteChoix(D, tout, 'x'), /Tous les choix ont une réponse\.$/);
});
