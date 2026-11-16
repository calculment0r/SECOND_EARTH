#!/usr/bin/env node
// Met le script du film de 25 min en données : data/film.json.
//
// Lit, sans rien réécrire, quatre documents de docs/film/ :
//   20-decoupage-25-min.md    les 150 plans (durée, cadre, action, son, fabrication, tags, note)
//   11-sequencier-25-min.md   par acte : séquences-cœur, compression, science, crochet du 55
//   10-architecture-25-55.md  les neuf charnières E1 à E9 et les durées du 25 et du 55
//   12-modules-du-55.md       les neuf modules M1 à M9
//
// Rien n'est interprété : chaque champ est une cellule d'une table, ou un repère relevé
// tel quel dans une cellule (charnière « E3 », « Mot 2 », « Crochet de M9 », « dôme »,
// carton de jour). Les lignes du récit, ce que chaque personnage sait et les relations
// ne sont dans aucune table : elles ne sont pas dans ce fichier.
//
// Usage : node tools/build_film.mjs   (écrit data/film.json)
// Vérification : node --test   (--test-update-snapshots réécrit le fichier)

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RACINE = dirname(dirname(fileURLToPath(import.meta.url)));
export const SORTIE = join(RACINE, 'data', 'film.json');

const DECOUPAGE = 'docs/film/20-decoupage-25-min.md';
const SEQUENCIER = 'docs/film/11-sequencier-25-min.md';
const ARCHITECTURE = 'docs/film/10-architecture-25-55.md';
const MODULES = 'docs/film/12-modules-du-55.md';

const ACTES = ['Prologue', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const idActe = (nom) => (nom === 'Prologue' ? 'P' : String(ACTES.indexOf(nom)));
const NOM = '(Prologue|[IVX]+)';

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

function splitRow(ligne) {
  let l = ligne.trim();
  if (l.startsWith('|')) l = l.slice(1);
  if (l.endsWith('|') && !l.endsWith('\\|')) l = l.slice(0, -1);
  const cells = [];
  let cur = '';
  for (let i = 0; i < l.length; i++) {
    if (l[i] === '\\' && l[i + 1] === '|') { cur += '|'; i++; continue; }
    if (l[i] === '|') { cells.push(cur.trim()); cur = ''; } else cur += l[i];
  }
  cells.push(cur.trim());
  return cells.map(stripMd);
}

// -> [{section, headers, rows}] : les tables d'un document, avec le titre « ## » qui les précède
function tables(chemin) {
  const lignes = readFileSync(join(RACINE, chemin), 'utf8').split('\n');
  const out = [];
  let section = null;
  for (let i = 0; i < lignes.length; i++) {
    const l = lignes[i];
    if (l.startsWith('## ')) section = l.slice(3).trim();
    else if (l.startsWith('|') && /^\|\s*-{3}/.test(lignes[i + 1] || '')) {
      const headers = splitRow(l);
      const rows = [];
      i += 2;
      while (i < lignes.length && lignes[i].startsWith('|')) rows.push(splitRow(lignes[i++]));
      i--;
      out.push({ section, headers, rows });
    }
  }
  return out;
}

function secondes(mmss) {
  const m = /^(\d+):(\d\d)$/.exec(mmss.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

const col = (row, i) => row[i] ?? '';

function lireDecoupage() {
  const actes = [];
  const plans = [];
  let debut = 0;
  const titre = new RegExp(`^(?:Acte\\s+)?${NOM}\\s*·\\s*(\\d+:\\d\\d)\\s*·\\s*(\\d+) plans?$`);
  for (const t of tables(DECOUPAGE)) {
    const m = titre.exec(t.section || '');
    if (!m || t.headers[0] !== 'N°' || t.headers[1] !== 's') continue;
    const acte = idActe(m[1]);
    actes.push({ id: acte, nom: m[1], duree_s: secondes(m[2]), nb_plans: Number(m[3]), debut_s: debut });
    for (const row of t.rows) {
      const [n, s, cadre, action, son, fab, tags, note] = Array.from({ length: 8 }, (_, i) => col(row, i));
      const charniere = /(?<![\p{L}\p{N}])E([1-9])(?![\p{L}\p{N}])/u.exec(note);
      const mot = /\bMot ([1-4])\b/.exec(note);
      const cartons = [];
      for (const champ of [action, son]) {
        for (const bloc of champ.matchAll(/[Cc]artons?\s+((?:«[^»]+»(?:,\s*)?)+)/g)) {
          for (const c of bloc[1].matchAll(/«([^»]+)»/g)) cartons.push(c[1].trim());
        }
      }
      plans.push({
        n, acte, ordre: plans.length + 1,
        debut_s: debut, duree_s: Number(s),
        cadre, action, son_ecran: son === '—' ? '' : son,
        fab, tags: tags.split(' ').filter(Boolean), note,
        dome: note.includes('dôme'),
        charniere: charniere ? 'E' + charniere[1] : null,
        mot: mot ? Number(mot[1]) : null,
        crochet_de: note.includes('Crochet') ? note.match(/M[1-9]/g) || [] : [],
        cartons,
      });
      debut += Number(s);
    }
  }
  return { actes, plans };
}

function lireSequencier(actes) {
  const tete = new RegExp(`^${NOM}\\s*·\\s*\\d+:\\d\\d$`);
  for (const t of tables(SEQUENCIER)) {
    for (const row of t.rows) {
      const m = tete.exec(col(row, 0));
      if (!m) continue;
      Object.assign(actes.find((a) => a.id === idActe(m[1])), {
        coeur: col(row, 1), compresse: col(row, 2), science: col(row, 3), crochet_55: col(row, 4),
      });
    }
  }
}

function lireArchitecture(actes) {
  const charnieres = [];
  const tete = new RegExp(`^${NOM}\\s*:\\s*(.+)$`);
  for (const t of tables(ARCHITECTURE)) {
    if (t.section === 'Les emplacements') {
      for (const row of t.rows) {
        const module = /^(M[1-9])\b/.exec(col(row, 3));
        charnieres.push({
          id: col(row, 0), ou_docx: col(row, 1), dans_25: col(row, 2), dans_55: col(row, 3),
          module: module ? module[1] : null, crochet: col(row, 4),
        });
      }
    } else if (t.section === 'Les durées') {
      for (const row of t.rows) {
        const m = tete.exec(col(row, 0));
        if (!m) continue;
        Object.assign(actes.find((a) => a.id === idActe(m[1])), {
          // « M9 Les Titans 2:00 (placé après M4) » : seul le module en tête de terme compte
          titre: m[2],
          modules_55: [...col(row, 2).matchAll(/(?:^|\+\s*)(M[1-9])\b/g)].map((x) => x[1]),
          duree_55_s: secondes(col(row, 3)),
        });
      }
    }
  }
  return charnieres;
}

function lireModules() {
  const modules = [];
  for (const t of tables(MODULES)) {
    for (const row of t.rows) {
      const m = /^(M[1-9])\s*·\s*(.+)$/.exec(col(row, 0));
      if (!m) continue;
      const charniere = /^(E[1-9])\b/.exec(col(row, 1));
      modules.push({
        id: m[1], titre: m[2], insere_a: col(row, 1), charniere: charniere ? charniere[1] : null,
        duree_s: secondes(col(row, 2)), contenu: col(row, 3), enjeu: col(row, 4), expo: col(row, 5),
      });
    }
  }
  return modules;
}

export function build() {
  const { actes, plans } = lireDecoupage();
  lireSequencier(actes);
  const charnieres = lireArchitecture(actes);
  const modules = lireModules();
  for (const c of charnieres) c.plan = plans.find((p) => p.charniere === c.id)?.n ?? null;
  for (const a of actes) a.charnieres = plans.filter((p) => p.acte === a.id && p.charniere).map((p) => p.charniere);
  const mots = plans.filter((p) => p.mot).map((p) => ({ rang: p.mot, plan: p.n, texte: p.son_ecran }));
  mots.sort((a, b) => a.rang - b.rang);
  return {
    titre: 'Second Earth · film de 25 min',
    statut: 'proposé (découpage du 27/09/2026 ; le docx fait foi pour le récit)',
    sources: [DECOUPAGE, SEQUENCIER, ARCHITECTURE, MODULES],
    duree_s: plans.reduce((s, p) => s + p.duree_s, 0),
    nb_plans: plans.length,
    actes, plans, charnieres, modules, mots,
  };
}

export const texte = (donnees) => JSON.stringify(donnees, null, 1) + '\n';

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const donnees = build();
  writeFileSync(SORTIE, texte(donnees));
  console.log(`film.json : ${donnees.actes.length} actes, ${donnees.nb_plans} plans, ${donnees.duree_s} s`);
}
