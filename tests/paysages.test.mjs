// data/paysages.json : les fiches de biome de la Bible, à plat, pour l'outil de prompts et le site.
// node --test                            vérifie que le fichier suit les fiches
// node --test --test-update-snapshots    le réécrit puis vérifie
import test from 'node:test';
import assert from 'node:assert/strict';
import { build, texte, SORTIE } from '../tools/build_paysages.mjs';

const paysages = build();

test('data/paysages.json suit les fiches de biome de la Bible', (t) => {
  t.assert.fileSnapshot(paysages, SORTIE, { serializers: [texte] });
});

test('dix-huit fiches : dix du trajet dans l\'ordre, huit hors trajet', () => {
  const trajet = paysages.filter((p) => p.groupe === 'trajet');
  assert.equal(trajet.length, 10);
  assert.deepEqual(trajet.map((p) => p.ordre_trajet), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(paysages.filter((p) => p.groupe === 'hors-trajet').length, 8);
  for (const p of paysages) {
    assert.ok(p.titre && Object.keys(p.sections).length > 0, p.id);
    for (const [titre, corps] of Object.entries(p.sections)) assert.ok(corps.length > 0 && corps.length <= 1600, `${p.id} · ${titre}`);
  }
});
