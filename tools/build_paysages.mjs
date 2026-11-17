#!/usr/bin/env node
// Régénère data/paysages.json à partir des fiches de biome de la Bible.
//
// Même extraction que build_paysages() de tools/build_data.py, réécrite pour Node afin de
// pouvoir la vérifier et la relancer avec les tests : une fiche par fichier
// docs/bible/1x-biome-*.md (trajet) et docs/bible/hors-trajet/ht-*.md, et pour chaque
// section « ## » son texte à plat, coupé à 1 600 caractères. Rien n'est réécrit.
//
// Usage : node tools/build_paysages.mjs   (écrit data/paysages.json)
// Vérification : node --test   (--test-update-snapshots réécrit le fichier)

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RACINE = dirname(dirname(fileURLToPath(import.meta.url)));
export const SORTIE = join(RACINE, 'data', 'paysages.json');
const COUPE = 1600;

function stripMd(s) {
  return s
    .replace(/<br>/g, ' / ')
    .replaceAll('**', '')
    .replaceAll('\\|', '|')
    .replace(/(?<![\p{L}\p{N}_])\*([^*]+)\*(?![\p{L}\p{N}_])/gu, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

const echappe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Le texte d'une section : tout ce qui suit son titre, jusqu'au titre « ## » suivant.
function texteDeSection(md, titre) {
  const m = md.match(new RegExp('^## ' + echappe(titre) + '\\s*$\\n+([\\s\\S]+?)(?=\\n## |(?![\\s\\S]))', 'm'));
  return m ? stripMd(m[1]) : '';
}

function fiche(dossier, nom, champs) {
  const md = readFileSync(join(RACINE, dossier, nom), 'utf8');
  const sections = {};
  for (const m of md.matchAll(/^## (.+)$/gm)) {
    sections[m[1]] = Array.from(texteDeSection(md, m[1])).slice(0, COUPE).join('');
  }
  return { ...champs, titre: md.match(/^# (.+)$/m)[1], fichier: `${dossier}/${nom}`, sections };
}

const fichiers = (dossier, motif) => readdirSync(join(RACINE, dossier)).filter((f) => motif.test(f)).sort();

export function build() {
  const trajet = fichiers('docs/bible', /^1[0-9]-biome-.*\.md$/).map((nom, i) =>
    fiche('docs/bible', nom, { id: nom.slice(3, -3), ordre_trajet: i + 1, groupe: 'trajet' }));
  const hors = fichiers('docs/bible/hors-trajet', /^ht-.*\.md$/).map((nom) =>
    fiche('docs/bible/hors-trajet', nom, { id: nom.slice(0, -3), groupe: 'hors-trajet' }));
  return [...trajet, ...hors];
}

// Même mise en forme que json.dump(..., ensure_ascii=False, indent=1) : pas de saut de ligne final.
export const texte = (donnees) => JSON.stringify(donnees, null, 1);

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeFileSync(SORTIE, texte(build()));
  console.log(`${SORTIE} : ${build().length} fiches`);
}
