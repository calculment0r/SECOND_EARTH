// data/film.json : le script du 25 min en données, vérifié contre les documents.
// node --test                            vérifie (depuis la racine du dépôt)
// node --test --test-update-snapshots    réécrit data/film.json puis vérifie
import test from 'node:test';
import assert from 'node:assert/strict';
import { build, texte, SORTIE } from '../tools/build_film.mjs';

const film = build();
const rang = (prefixe, n) => Array.from({ length: n }, (_, i) => prefixe + (i + 1));

test('data/film.json est à jour', (t) => {
  t.assert.fileSnapshot(film, SORTIE, { serializers: [texte] });
});

test('totaux du découpage : 150 plans, 25:00, onze actes', () => {
  assert.equal(film.nb_plans, 150);
  assert.equal(film.duree_s, 25 * 60);
  assert.deepEqual(film.actes.map((a) => a.id), ['P', ...rang('', 10)]);
});

test('chaque acte tient sa durée, son compte et sa numérotation', () => {
  for (const acte of film.actes) {
    const plans = film.plans.filter((p) => p.acte === acte.id);
    assert.equal(plans.length, acte.nb_plans, acte.nom);
    assert.equal(plans.reduce((s, p) => s + p.duree_s, 0), acte.duree_s, acte.nom);
    assert.deepEqual(plans.map((p) => p.n), plans.map((_, i) => `${acte.id}-${String(i + 1).padStart(2, '0')}`));
    for (const champ of ['titre', 'coeur', 'compresse', 'science', 'crochet_55', 'duree_55_s']) {
      assert.ok(acte[champ], `${acte.nom} : ${champ} manque`);
    }
  }
});

test('chaque plan est complet et les débuts se suivent', () => {
  let debut = 0;
  for (const p of film.plans) {
    assert.equal(p.debut_s, debut, p.n);
    debut += p.duree_s;
    assert.ok(p.duree_s > 0 && p.cadre && p.action && p.fab, p.n);
    assert.ok(p.tags.includes('25') && p.tags.every((x) => ['25', '55', 'EXPO'].includes(x)), p.n);
  }
});

test('neuf charnières, chacune sur un plan ; E4 ouvre M4 puis M9, E9 aucun module (round 17)', () => {
  assert.deepEqual(film.charnieres.map((c) => c.id), rang('E', 9));
  assert.deepEqual(film.plans.filter((p) => p.charniere).map((p) => p.charniere).sort(), rang('E', 9));
  assert.deepEqual(film.charnieres.flatMap((c) => c.modules).sort(), rang('M', 9));
  const parId = Object.fromEntries(film.charnieres.map((c) => [c.id, c]));
  assert.deepEqual(parId.E4.modules, ['M4', 'M9']);
  assert.deepEqual(parId.E9.modules, []);
  for (const c of film.charnieres) {
    assert.ok(c.plan && c.crochet, c.id);
    if (c.id !== 'E4' && c.id !== 'E9') assert.deepEqual(c.modules, ['M' + c.id[1]], c.id);
  }
  assert.equal(film.modules.find((m) => m.id === 'M9').charniere, 'E4');
});

test('cartons : les six distances validées, aucun numéro de jour (round 17)', () => {
  const cartons = film.plans.flatMap((p) => p.cartons);
  for (const c of cartons) assert.doesNotMatch(c, /Jour/, c);
  assert.deepEqual(cartons.filter((c) => /km$/.test(c)), ['250 km', '680 km', '1 200 km', '3 300 km', '4 800 km', '5 500 km']);
  for (const p of film.plans) assert.doesNotMatch(p.son_ecran, /Jour\s[−-]?\d/, p.n);
});

test('neuf modules, 27:00 ; le 55 fait 52:00', () => {
  assert.deepEqual(film.modules.map((m) => m.id), rang('M', 9));
  assert.equal(film.modules.reduce((s, m) => s + m.duree_s, 0), 27 * 60);
  assert.equal(film.actes.reduce((s, a) => s + a.duree_55_s, 0), 52 * 60);
  assert.deepEqual(film.actes.flatMap((a) => a.modules_55).sort(), rang('M', 9));
});

test('les quatre mots, dans l\'ordre, sur les plans de la table', () => {
  assert.deepEqual(film.mots.map((m) => m.rang), [1, 2, 3, 4]);
  // L'en-tête du découpage est corrigé au round 17 (D4) : il suit la table.
  assert.deepEqual(film.mots.map((m) => m.plan), ['6-14', '7-13', '8-02', '9-15']);
  assert.match(film.mots[3].texte, /Je suis Seed/);
});

test('plans marqués « dôme »', () => {
  // L'en-tête du découpage est corrigé au round 17 (D4) : dix-neuf plans, comme la table.
  assert.equal(film.plans.filter((p) => p.dome).length, 19);
});
