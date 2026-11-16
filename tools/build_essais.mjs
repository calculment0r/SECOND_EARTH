#!/usr/bin/env node
// Construit les pages des essais de lecture du film : site/essais/*.html.
//
// Entrées : data/film.json (le script en données, via tools/build_film.mjs), data/essais.json
// (promesses, savoir, toile : écrits à la main, chaque élément avec sa provenance),
// tools/essais/*.js et essais.css, site/assets/site.css (thème Verdant).
//
// Chaque page est autonome (CSS, JS et données dans le fichier) : elle s'ouvre depuis le disque.
// tools/build_site.py les copie dans _site/essais/ en remplaçant <!--SITE_HEADER--> par la barre du site.
//
// Usage : node tools/build_essais.mjs
// Vérification : node --test   (--test-update-snapshots réécrit les pages)

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build as buildFilm } from './build_film.mjs';

const require = createRequire(import.meta.url);
const E = require('./essais/commun.js');
const promesses = require('./essais/promesses.js');
const savoir = require('./essais/savoir.js');

const RACINE = dirname(dirname(fileURLToPath(import.meta.url)));
export const DOSSIER = join(RACINE, 'site', 'essais');
const lire = (...chemin) => readFileSync(join(RACINE, ...chemin), 'utf8');

const FONTS = 'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&amp;family=Saira+Semi+Condensed:wght@400;500;600;700&amp;family=Azeret+Mono:wght@300;400;500&amp;display=swap';

const ESSAIS = [
  {
    nom: 'promesses', titre: 'Le livre des promesses', js: 'promesses.js', partie: 'promesses',
    lede: "Chaque promesse du film de 25 min : le plan où elle est posée, le plan ou le module qui la paie, la distance entre les deux. Le Récit v2 fait foi ; ce qui vient d'un autre document ou d'une déduction est marqué.",
    carte: "Les crochets que le 55 déplie et les promesses tenues à l'intérieur du 25 : posée, payée, due, assumée.",
    corps: `<div class="es-corps"><div class="es-gauche-col">
<div class="es-fig"><div class="es-fig-in" data-zone="figure"></div></div>
<div class="es-choix" data-zone="choix"></div>
</div><aside class="es-cote" data-zone="cote"></aside></div>`,
  },
  {
    nom: 'savoir', titre: 'La Partition du savoir', js: 'savoir.js', partie: 'savoir',
    lede: "Qui sait quoi, et depuis quel plan : le spectateur, Seed, Rob1, PERSEPHORA et la Terre. L'écart entre deux portées se dessine et se nomme d'un mot. Le Récit v2 fait foi ; ce qui est déduit ou manquant est marqué.",
    carte: 'Une portée par personnage et une pour le spectateur : ironie, suspense, surprise, secret.',
    corps: `<div class="es-corps"><div class="es-gauche-col">
<div class="es-fig"><div class="es-fig-in" data-zone="figure"></div></div>
<div class="es-faits" data-zone="liste"></div>
<div class="es-choix" data-zone="choix"></div>
</div><aside class="es-cote" data-zone="cote"></aside></div>`,
  },
  {
    nom: 'toile', titre: 'La toile des personnages', js: 'toile.js', partie: 'toile',
    lede: "Les personnages et ce que chacun est pour l'autre, plan par plan. Le curseur parcourt les 150 plans du film de 25 min ; chaque relation porte le plan depuis lequel elle vaut et sa citation du Récit v2.",
    carte: "Ce que A est pour B n'est pas ce que B est pour A : deux demi-liens, qui changent au fil des plans.",
    corps: `<div class="es-corps"><div class="es-gauche-col">
<div class="es-curseur" data-zone="curseur"></div>
<div class="es-plan" data-zone="plan"></div>
<div class="es-fig" data-zone="figure"></div>
<div class="es-choix" data-zone="choix"></div>
</div><aside class="es-cote" data-zone="cote"></aside></div>`,
  },
];

const esc = E.esc;

// Bloc de données sûr dans une page : aucun « </ » ni « <!-- » dans le texte.
function blocJson(objet) {
  const texte = JSON.stringify(objet).replaceAll('</', '<\\/').replaceAll('<!--', '<\\u0021--');
  return `<script type="application/json" id="data-essai">${texte}</script>`;
}

// Le film, réduit à ce que les essais lisent.
function filmPourPage(film) {
  return {
    duree_s: film.duree_s,
    actes: film.actes.map(({ id, nom, titre, duree_s }) => ({ id, nom, titre, duree_s })),
    plans: film.plans.map(({ n, acte, ordre, debut_s, duree_s, cadre, action, son_ecran, note, mot }) => ({ n, acte, ordre, debut_s, duree_s, cadre, action, son_ecran, note, mot })),
    charnieres: film.charnieres.map(({ id, plan, module, modules }) => ({ id, plan, module, modules })),
    modules: film.modules.map(({ id, titre, duree_s, contenu, enjeu }) => ({ id, titre, duree_s, contenu, enjeu })),
    mots: film.mots,
  };
}

function css() {
  const site = lire('site', 'assets', 'site.css').replaceAll("url('fonts/", "url('../assets/fonts/");
  return site.trim() + '\n' + lire('tools', 'essais', 'essais.css').trim();
}

function nav(actif) {
  const liens = [['index', 'Les essais', 'index.html'], ...ESSAIS.map((e) => [e.nom, e.titre, e.nom + '.html'])];
  return '<nav class="es-nav" aria-label="Essais">' + liens.map(([cle, nom, href]) => `<a${cle === actif ? ' class="on"' : ''} href="${href}">${esc(nom)}</a>`).join('') + '</nav>';
}

function page(titre, corps, queue = '') {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#0a0d0b">
<title>${esc(titre)} · Second Earth</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<style>
${css()}
</style>
</head>
<body>
<!--SITE_HEADER-->
<main class="wrap">
${corps}
</main>
<footer class="foot-site"><span class="lbl">Second Earth · NIRVALAB · 2026</span><span class="lbl">Essais de lecture du film · proposé · ils ne modifient pas le script</span></footer>
${queue}
</body>
</html>
`;
}

function tete(titre, lede) {
  return `<div class="head accent"><div class="meta"><span class="lbl or">Film · essai de lecture</span><span class="lbl">proposé · le Récit v2 fait foi</span></div><h1>${esc(titre)}</h1><p class="lede">${esc(lede)}</p></div>`;
}

function pageEssai(essai, film, donnees) {
  const d = { film: filmPourPage(film), docs: donnees.docs, [essai.partie]: donnees[essai.partie] };
  const corps = `<div class="es" id="essai">
${nav(essai.nom)}
${tete(essai.titre, essai.lede)}
<div class="es-phrase" data-zone="phrase" role="status" aria-live="polite"></div>
${essai.nom === 'toile' ? '' : '<div class="es-outils" data-zone="outils"></div>\n'}${essai.corps}
</div>`;
  const queue = `${blocJson(d)}
<script>
${lire('tools', 'essais', 'commun.js').trim()}
${lire('tools', 'essais', essai.js).trim()}
SE_ESSAIS.monter(${JSON.stringify(essai.nom)}, document.getElementById('essai'), JSON.parse(document.getElementById('data-essai').textContent));
</script>`;
  return page(essai.titre, corps, queue);
}

const liste = (items) => (items.length ? '<ul>' + items.map((x) => `<li>${x}</li>`).join('') + '</ul>' : '<p>Rien.</p>');

// La page d'accueil : les trois essais, puis tout ce qui est déduit, manquant ou à regarder, en clair.
function pageIndex(film, donnees) {
  const d = { film: filmPourPage(film), docs: donnees.docs, promesses: donnees.promesses, savoir: donnees.savoir, toile: donnees.toile };
  const nomPortee = (k) => E.parId(donnees.savoir.portees, k).nom;
  const nomNoeud = (id) => E.parId(donnees.toile.noeuds, id).nom;
  const deduit = [], manque = [];
  const range = (p, ou) => {
    if (p.src === 'infere') deduit.push(`<strong>${esc(ou)}</strong> : ${esc(p.pourquoi)} Fondé sur ${p.fonde.map(esc).join(', ')}.`);
    if (p.src === 'manquant') manque.push(`<strong>${esc(ou)}</strong> : ${esc(p.note)}`);
  };
  for (const pr of donnees.promesses) {
    range(pr.dit, `Promesse « ${pr.titre} », le lien entre la pose et le paiement`);
    pr.posee.forEach((pt) => range(pt, `Promesse « ${pr.titre} », le plan où elle est posée (${E.nomPoint(pt)})`));
    pr.payee.forEach((pt) => range(pt, `Promesse « ${pr.titre} », le paiement (${E.nomPoint(pt)})`));
  }
  for (const f of donnees.savoir.faits) {
    for (const [k, items] of Object.entries(f.portees)) items.forEach((it) => range(it, `Savoir « ${f.titre} », ${nomPortee(k)}`));
  }
  for (const r of donnees.toile.relations) range(r, `Relation ${nomNoeud(r.de)} → ${nomNoeud(r.vers)}, « ${r.mot} » (${r.depuis})`);

  const regarder = [], avant = [], dues = [];
  const ax55 = E.axe(d.film, '55');
  for (const pr of donnees.promesses) {
    for (const al of pr.alertes || []) regarder.push(`<strong>${esc(pr.titre)}</strong> : ${esc(al.texte)}`);
    const et = promesses.etatPromesse(ax55, pr, []);
    if (et.inverse.length) {
      avant.push(`<strong>${esc(pr.titre)}</strong> : ${esc(et.payee.map((y) => E.nomPoint(y.p)).join(', '))} passe avant le plan ${esc(et.inverse.map((y) => E.nomPoint(y.p)).join(', '))}.`);
    }
    if (et.mot === 'due') dues.push(`<strong>${esc(pr.titre)}</strong>, posée en ${esc(pr.posee.map(E.nomPoint).join(', '))}.`);
  }
  const ax25 = E.axe(d.film, '25', 'apres-m4');
  const ouverts = donnees.savoir.faits.flatMap((f) => savoir.ecarts(ax25, f, []).filter((x) => x.ouvert && x.sur === 'seed' && x.mot !== 'secret')
    .map((x) => {
      const pressent = (f.portees.seed || []).filter((it) => it.mode === 'pressent')[0];
      return `<strong>${esc(f.titre)}</strong> : ${pressent ? `Seed le pressent en ${esc(pressent.plan)}, sans les détails` : "Seed ne l'apprend pas dans le film"} (${esc(x.mot)} depuis ${esc(x.de)}).`;
    }));

  const cartes = ESSAIS.map((e, i) => `<a class="card" href="${e.nom}.html"><span class="lbl or">0${i + 1}</span><span class="name">${esc(e.titre)}</span><p>${esc(e.carte)}</p></a>`).join('');
  const corps = `<div class="es">
${nav('index')}
${tete('Essais de lecture du film', "Trois façons de regarder le film de 25 min à partir de son script : ses promesses, ce que chacun sait, ce que chacun est pour l'autre. Les essais lisent le script ; ils ne le modifient pas.")}
<div class="es-cartes">${cartes}</div>
<div class="prose">
<h2>Comment lire</h2>
<p>Le Récit v2 fait foi depuis la relecture du 16/11/2026 (round 17) ; le docx d'origine est une archive. Chaque élément porte sa provenance : une citation du Récit v2, marquée « récit » ; une citation d'un autre document du script (découpage, séquencier, architecture, modules), marquée « hors récit » ; une déduction, marquée « inféré », avec les plans qui la fondent ; ou « non écrit » quand aucun document ne le dit. Les citations sont vérifiées mot pour mot contre les documents à chaque construction.</p>
<p>Les numéros de plan sont ceux du découpage (150 plans, 25:00), au statut proposé. Dans le 55, chaque module est posé juste après le plan de sa charnière : c'est une convention des essais, les documents disent seulement « le 55 ouvre ici ». Le module des Titans (M9) suit celui du col (M4) : tranché au round 17.</p>
<p>Les gestes (marquer une promesse assumée, lui donner un paiement, poser un « apprend », tirer un lien) restent dans le navigateur. « Copier mes choix » en fait un texte à coller dans le chat.</p>
<h2>Ce qui est déduit</h2>
<p>${deduit.length} éléments sur ${donnees.promesses.length} promesses, ${donnees.savoir.faits.length} faits et ${donnees.toile.relations.length} relations.</p>
${liste(deduit)}
<h2>Ce qui n'est écrit nulle part</h2>
${liste(manque)}
<h2>Ce que les essais font remonter</h2>
<p>Des constats. Ceux du 16/11/2026 ont été tranchés par l'auteur au round 17 ; ce qui reste ouvert est dit ci-dessous.</p>
<h3>Crochet dans le 25, écho dans le 55</h3>
<p>Le plan qui pose la promesse reste à sa place dans le 55 ; le module s'ouvre à la charnière, avant lui. Tranché au round 17 : c'est assumé, le même plan annonce dans le 25 et rappelle dans le 55.</p>
${liste(avant)}
<h3>Promesses dues, dans le 25 comme dans le 55</h3>
<p>Aucun document ne dit où elles sont payées.</p>
${liste(dues)}
<h3>Écarts entre documents</h3>
${liste(regarder)}
<h3>Ce que Seed ne sait pas à la fin du 25</h3>
${liste(ouverts)}
</div>
</div>`;
  return page('Essais de lecture du film', corps);
}

export function pages() {
  const film = buildFilm();
  const donnees = JSON.parse(lire('data', 'essais.json'));
  const out = { 'index.html': pageIndex(film, donnees) };
  for (const essai of ESSAIS) out[essai.nom + '.html'] = pageEssai(essai, film, donnees);
  return out;
}

export { ESSAIS, filmPourPage };

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  mkdirSync(DOSSIER, { recursive: true });
  for (const [nom, html] of Object.entries(pages())) {
    writeFileSync(join(DOSSIER, nom), html);
    console.log(`site/essais/${nom} : ${Buffer.byteLength(html)} octets`);
  }
}
