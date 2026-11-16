// data/essais.json : les données des trois essais, vérifiées contre les documents.
// Chaque citation doit se retrouver mot pour mot dans le document nommé (pour le découpage :
// dans la ligne du plan nommé) ; chaque déduction doit nommer les plans qui la fondent.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../tools/build_film.mjs';

const RACINE = dirname(dirname(fileURLToPath(import.meta.url)));
const essais = JSON.parse(readFileSync(join(RACINE, 'data', 'essais.json'), 'utf8'));
const film = build();

const norm = (s) => s
  .replace(/<br>/g, ' ')
  .replaceAll('**', '')
  .replace(/\\([|*_\-])/g, '$1')
  .replace(/[  ]/g, ' ')
  .replace(/[’‘]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/\s+/g, ' ')
  .trim();

const textes = Object.fromEntries(Object.entries(essais.docs).map(([cle, d]) => [cle, norm(readFileSync(join(RACINE, d.fichier), 'utf8'))]));
const plan = Object.fromEntries(film.plans.map((p) => [p.n, p]));
const modules = new Set(film.modules.map((m) => m.id));
const ligne = (p) => norm([p.action, p.son_ecran, p.note].join(' | '));

// Vérifie une provenance ; `ou` sert au message d'erreur, `n` est le plan visé s'il y en a un.
function provenance(p, ou, n) {
  if (p.src === 'infere') {
    assert.ok(p.pourquoi && p.pourquoi.length > 20, `${ou} : une déduction dit pourquoi`);
    assert.ok(Array.isArray(p.fonde) && p.fonde.length > 0, `${ou} : une déduction nomme ses plans`);
    for (const f of p.fonde) assert.ok(plan[f], `${ou} : plan ${f} inconnu`);
    return;
  }
  if (p.src === 'manquant') {
    assert.ok(p.note, `${ou} : « manquant » dit ce qui manque`);
    if (p.voir) provenance(p.voir, ou + ' (voir)');
    return;
  }
  assert.ok(textes[p.src], `${ou} : document « ${p.src} » inconnu`);
  assert.ok(p.cit, `${ou} : citation absente`);
  assert.ok(textes[p.src].includes(norm(p.cit)), `${ou} : « ${p.cit} » introuvable dans ${essais.docs[p.src].nom}`);
  if (p.src === 'decoupage' && n) {
    assert.ok(ligne(plan[n]).includes(norm(p.cit)), `${ou} : « ${p.cit} » n'est pas dans la ligne du plan ${n}`);
  }
}

function point(pt, ou) {
  assert.ok(Boolean(pt.plan) !== Boolean(pt.module), `${ou} : un plan ou un module, pas les deux`);
  if (pt.plan) assert.ok(plan[pt.plan], `${ou} : plan ${pt.plan} inconnu`);
  if (pt.module) assert.ok(modules.has(pt.module), `${ou} : module ${pt.module} inconnu`);
  provenance(pt, ou, pt.plan);
}

test('le Récit v2 est la référence (round 17)', () => {
  assert.equal(essais.reference, 'recit');
  assert.equal(essais.docs.recit.fichier, 'docs/film/00-recit-v2.md');
  assert.ok(textes.recit.length > 10000);
  assert.ok(!essais.docs.docx, 'le docx d\'origine est une archive : plus aucune citation ne s\'y appuie');
});

test('promesses : identifiants uniques, points connus, provenance vérifiée', () => {
  const ids = essais.promesses.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const pr of essais.promesses) {
    assert.ok(pr.titre && ['crochet', 'interne'].includes(pr.genre), pr.id);
    provenance(pr.dit, `${pr.id} (dit)`);
    assert.ok(pr.posee.length + pr.payee.length > 0, pr.id);
    pr.posee.forEach((pt, i) => point(pt, `${pr.id} posée ${i + 1}`));
    pr.payee.forEach((pt, i) => point(pt, `${pr.id} payée ${i + 1}`));
    for (const al of pr.alertes || []) {
      assert.ok(al.texte && al.preuves.length > 0, pr.id);
      al.preuves.forEach((p, i) => provenance(p, `${pr.id} alerte, preuve ${i + 1}`));
    }
    if (pr.seulement_55) assert.ok(pr.posee.every((pt) => pt.module), `${pr.id} : posée dans un module`);
  }
});

test('promesses : chaque module a son crochet de l\'architecture, lu dans la case de sa charnière', () => {
  for (const c of film.charnieres) {
    for (const m of c.modules) {
      const pr = essais.promesses.find((p) => p.dit.src === 'architecture' && norm(c.crochet).includes(norm(p.dit.cit)) && p.payee.some((pt) => pt.module === m));
      assert.ok(pr, `${c.id} : aucun crochet de « ${c.crochet} » n'est payé par ${m}`);
    }
  }
  // Round 17 : le drone cassé et le regard vers la mer ne sont pas des crochets ; le mot « Korê » reste au cœur.
  for (const id of ['drone-casse', 'regard-mer', 'mot-kore']) assert.ok(!essais.promesses.some((p) => p.id === id), id);
});

test('savoir : portées connues, modes connus, provenance vérifiée', () => {
  const portees = essais.savoir.portees.map((p) => p.id);
  assert.deepEqual(portees, ['spectateur', 'seed', 'rob1', 'terre']);
  const modes = ['sait', 'apprend', 'pressent', 'croit à tort', 'ignore', 'manquant'];
  const ids = essais.savoir.faits.map((f) => f.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const f of essais.savoir.faits) {
    assert.ok(f.titre, f.id);
    assert.ok(f.portees.spectateur, `${f.id} : la portée du spectateur est obligatoire`);
    for (const [k, items] of Object.entries(f.portees)) {
      assert.ok(portees.includes(k), `${f.id} : portée ${k}`);
      assert.ok(items.length > 0, `${f.id} ${k}`);
      items.forEach((it, i) => {
        const ou = `${f.id} ${k} ${i + 1}`;
        assert.ok(modes.includes(it.mode), `${ou} : mode ${it.mode}`);
        if (it.mode === 'ignore' || it.mode === 'manquant') {
          assert.ok(!it.plan && !it.module, `${ou} : « ${it.mode} » n'a pas de plan`);
          assert.equal(it.mode === 'manquant', it.src === 'manquant', ou);
          provenance(it, ou);
        } else point(it, ou);
      });
    }
    if (f.cache) {
      assert.ok(plan[f.cache.plan] && f.portees[f.cache.de] && f.portees[f.cache.a], `${f.id} : cache`);
      provenance(f.cache, `${f.id} (cache)`);
    }
  }
});

test('toile : nœuds et relations connus, provenance vérifiée', () => {
  const ids = essais.toile.noeuds.map((n) => n.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const n of essais.toile.noeuds) assert.ok(plan[n.entre] && n.nom && n.x > 0 && n.y > 0 && n.r > 0, n.id);
  for (const r of essais.toile.relations) {
    const ou = `${r.de} → ${r.vers} depuis ${r.depuis}`;
    assert.ok(ids.includes(r.de) && ids.includes(r.vers) && r.de !== r.vers, ou);
    assert.ok(plan[r.depuis] && r.mot, ou);
    provenance(r, ou);
    for (const id of [r.de, r.vers]) {
      const n = essais.toile.noeuds.find((x) => x.id === id);
      assert.ok(plan[n.entre].ordre <= plan[r.depuis].ordre, `${ou} : ${id} n'est pas encore entré`);
    }
  }
});

test('ce qui est déduit ou manquant se compte', () => {
  const tout = [
    ...essais.promesses.flatMap((p) => [p.dit, ...p.posee, ...p.payee]),
    ...essais.savoir.faits.flatMap((f) => Object.values(f.portees).flat()),
    ...essais.toile.relations,
  ];
  const compte = (src) => tout.filter((p) => p.src === src).length;
  // Garde-fou : si ces nombres changent, la page d'accueil des essais doit le dire.
  assert.deepEqual({ infere: compte('infere'), manquant: compte('manquant'), recit: compte('recit') > 100 }, { infere: 9, manquant: 4, recit: true });
});
