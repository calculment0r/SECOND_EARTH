// Les trois essais de lecture du film : l'axe du temps, les calculs, les gestes, les pages.
// node --test                            vérifie (depuis la racine du dépôt)
// node --test --test-update-snapshots    réécrit site/essais/*.html puis vérifie
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../tools/build_film.mjs';
import { pages, DOSSIER, ESSAIS, filmPourPage } from '../tools/build_essais.mjs';

const require = createRequire(import.meta.url);
const E = require('../tools/essais/commun.js');
const promesses = require('../tools/essais/promesses.js');
const savoir = require('../tools/essais/savoir.js');
const toile = require('../tools/essais/toile.js');

const RACINE = dirname(dirname(fileURLToPath(import.meta.url)));
const donnees = JSON.parse(readFileSync(join(RACINE, 'data', 'essais.json'), 'utf8'));
const d = { film: filmPourPage(build()), docs: donnees.docs, promesses: donnees.promesses, savoir: donnees.savoir, toile: donnees.toile };
const promesse = (id) => E.parId(d.promesses, id);
const fait = (id) => E.parId(d.savoir.faits, id);
const ax25 = E.axe(d.film, '25', 'apres-m4');
const ax55 = E.axe(d.film, '55', 'apres-m4');
const axPre = E.axe(d.film, '55', 'pregenerique');

// Joue une suite d'actions et rend la vue après chacune : aucune zone ne doit porter de valeur manquante.
function jouer(essai, actions, gardes = []) {
  let e = essai.init(d, gardes);
  const vues = [essai.vue(d, e)];
  for (const a of actions) { e = essai.reduire(d, e, a); vues.push(essai.vue(d, e)); }
  for (const v of vues) {
    for (const [zone, html] of Object.entries(v)) {
      assert.equal(typeof html, 'string', zone);
      assert.doesNotMatch(html, /undefined|NaN|\[object|null/, zone);
    }
  }
  return { e, v: vues[vues.length - 1] };
}

test('axe : 25:00 pour le 25, 52:00 pour le 55, quelle que soit la place de M9', () => {
  assert.equal(ax25.total, 25 * 60);
  assert.equal(ax55.total, 52 * 60);
  assert.equal(axPre.total, 52 * 60);
  assert.equal(Object.keys(ax25.module).length, 0);
  assert.equal(Object.keys(ax55.module).length, 9);
  assert.equal(axPre.module.M9.t0, 0);
  // chaque module suit le plan de sa charnière ; M9 suit M4
  for (const c of d.film.charnieres) if (c.module !== 'M9') assert.ok(ax55.module[c.module].t0 >= ax55.plan[c.plan].t1, c.id);
  assert.equal(ax55.module.M9.t0, ax55.module.M4.t1);
  assert.equal(ax55.actes.at(-1).t1, ax55.total);
  const f = E.fenetre(ax55, '7');
  assert.equal(f.t1 - f.t0, (4 * 60 + 15) + 3 * 60);
});

test('promesses : les quatre états, lus sur les documents', () => {
  const totem25 = promesses.etatPromesse(ax25, promesse('totem'), []);
  assert.equal(totem25.mot, 'posée');
  assert.deepEqual(totem25.ailleurs.map(E.nomPoint), ['M5']);
  const totem55 = promesses.etatPromesse(ax55, promesse('totem'), []);
  assert.equal(totem55.mot, 'payée');
  assert.equal(totem55.distance, ax55.module.M5.t0 - ax55.plan['4-12'].t0);
  assert.equal(promesses.etatPromesse(ax25, promesse('drone-casse'), []).mot, 'due');
  assert.equal(promesses.etatPromesse(ax55, promesse('drone-casse'), []).mot, 'due');
  assert.equal(promesses.etatPromesse(ax25, promesse('rob4-ici'), []).mot, 'payée sans avoir été posée');
  const caillou = promesses.etatPromesse(ax25, promesse('caillou-blanc'), []);
  assert.equal(caillou.mot, 'payée');
  assert.equal(caillou.distance, ax25.plan['7-03'].t0 - ax25.plan['5-09'].t0);
});

test('promesses : un paiement qui précède sa promesse est signalé', () => {
  const inverse = (ax, id) => promesses.etatPromesse(ax, promesse(id), []).inverse.map((x) => E.nomPoint(x.p));
  assert.deepEqual(inverse(ax55, 'compteur-87'), ['7-20']);
  assert.deepEqual(inverse(ax55, 'mot-kore'), ['8-02']);
  assert.deepEqual(inverse(ax55, 'squelette-couche'), ['7-18']);
  assert.deepEqual(inverse(axPre, 'squelette-couche'), ['3-02', '7-18']);
  assert.deepEqual(inverse(ax55, 'totem'), []);
  for (const pr of d.promesses) assert.deepEqual(inverse(ax25, pr.id), [], pr.id);
});

test('promesses : les gestes passent par l\'attente, Garder les retient, Revenir les rend', () => {
  let { e } = jouer(promesses, [{ type: 'sel', id: 'drone-casse' }, { type: 'assumer' }]);
  assert.equal(e.attente.length, 1);
  assert.equal(e.gardes.length, 0);
  assert.equal(promesses.prepare(d, e).liste.find((x) => x.pr.id === 'drone-casse').et.mot, 'assumée');
  ({ e } = jouer(promesses, [{ type: 'sel', id: 'drone-casse' }, { type: 'assumer' }, { type: 'revenir' }]));
  assert.equal(e.attente.length, 0);
  assert.equal(promesses.prepare(d, e).liste.find((x) => x.pr.id === 'drone-casse').et.mot, 'due');
  const r = jouer(promesses, [
    { type: 'sel', id: 'regard-mer' }, { type: 'armer' }, { type: 'zoom', id: '9' }, { type: 'case', plan: '9-01' },
    { type: 'garder' }, { type: 'version', v: '55' }, { type: 'm9', v: 'pregenerique' }, { type: 'filtre', v: 'regarder' },
    { type: 'case', module: 'M5' }, { type: 'zoom', id: '' }, { type: 'filtre', v: 'due' },
  ]);
  assert.deepEqual(r.e.gardes, [{ type: 'paiement', promesse: 'regard-mer', cible: { plan: '9-01' } }]);
  assert.match(promesses.texte(d, r.e), /« Le regard vers la mer et la fosse » : payée en 9-01/);
  assert.match(promesses.texte(d, r.e), /en prégénérique/);
  assert.equal(jouer(promesses, [{ type: 'retirer', i: '0' }], r.e.gardes).e.gardes.length, 0);
  // sans promesse choisie, une case s'ouvre en fiche et n'arme rien
  assert.match(jouer(promesses, [{ type: 'zoom', id: '5' }, { type: 'case', plan: '5-09' }]).v.cote, /Plan 5-09/);
});

test('promesses : toutes les fiches se rendent, dans les deux versions', () => {
  for (const pr of d.promesses) jouer(promesses, [{ type: 'version', v: '55' }, { type: 'sel', id: pr.id }, { type: 'zoom', id: '7' }, { type: 'version', v: '25' }]);
});

test('savoir : les écarts se nomment d\'après qui sait avant qui', () => {
  const ec = (ax, id) => savoir.ecarts(ax, fait(id), []).map((x) => [x.sur, x.mot, x.de, x.ouvert ? 'fin' : x.a].join(' '));
  assert.deepEqual(ec(ax25, 'sol'), ['seed suspense 1-15 1-18', 'rob1 suspense 1-15 1-19']);
  assert.deepEqual(ec(ax25, 'totem'), ['seed ironie 4-12 fin', 'rob1 ironie 4-12 fin']);
  assert.deepEqual(ec(ax25, 'cobaye'), ['spectateur surprise 1-03 1-16']);
  assert.deepEqual(ec(ax25, 'reserves'), ['seed suspense 5-11 7-26', 'seed secret 5-12 7-26']);
  assert.deepEqual(ec(ax25, 'abandon'), ['seed ironie 9-09 fin', 'seed secret 9-14 fin']);
  assert.deepEqual(ec(ax25, 'rongeurs'), ['rob1 non écrit  ']);
  assert.deepEqual(ec(ax55, 'rongeurs'), ['seed ironie M6 fin', 'rob1 non écrit  ']);
  assert.deepEqual(ec(ax25, 'clone'), ['spectateur surprise 1-06 1-11']);
  assert.deepEqual(ec(ax25, 'charte'), ['seed non écrit  ', 'rob1 non écrit  ']);
});

test('savoir : poser un « apprend » dit ce que l\'écart deviendrait', () => {
  const p = savoir.prevoir(d, ax25, { type: 'apprend', fait: 'abandon', portee: 'seed', plan: '9-15' }, []);
  assert.equal(p.phrase, 'Seed apprendrait « PERSEPHORA ne reviendra pas : Seed est jugée incomplète, non qualifiée » en 9-15');
  assert.equal(p.suites.length, 3);
  const duree = E.mmss(ax25.plan['9-15'].t0 - ax25.plan['9-09'].t0);
  assert.equal(p.suites[0], `L'écart « ironie » sur Seed durerait ${duree}, au lieu de jusqu'à la fin.`);
  assert.match(p.suites[2], /Seed dirait .*Je suis Seed.* \(9-15\) en le sachant\./);
  const q = savoir.prevoir(d, ax25, { type: 'apprend', fait: 'reserves', portee: 'seed', plan: '5-11' }, []);
  assert.ok(q.suites.includes('L\'écart « suspense » sur Seed disparaît (il durait ' + E.mmss(ax25.plan['7-26'].t0 - ax25.plan['5-11'].t0) + ').'));
  assert.ok(q.suites.includes('L\'écart « secret » sur Seed disparaît (il durait ' + E.mmss(ax25.plan['7-26'].t0 - ax25.plan['5-12'].t0) + ').'));
});

test('savoir : le geste passe par l\'attente ; toutes les fiches se rendent', () => {
  const r = jouer(savoir, [
    { type: 'sel', id: 'abandon' }, { type: 'armer' }, { type: 'case', plan: '9-15' }, { type: 'zoom', id: '9' },
    { type: 'case', plan: '9-15', portee: 'seed' }, { type: 'garder' }, { type: 'version', v: '55' }, { type: 'case', module: 'M6' },
  ]);
  assert.deepEqual(r.e.gardes, [{ type: 'apprend', fait: 'abandon', portee: 'seed', plan: '9-15' }]);
  assert.equal(savoir.portee(ax25, fait('abandon'), 'seed', r.e.gardes).quand, '9-15');
  assert.match(savoir.texte(d, r.e), /Seed l'apprendrait en 9-15/);
  for (const f of d.savoir.faits) jouer(savoir, [{ type: 'sel', id: f.id }, { type: 'zoom', id: '1' }, { type: 'version', v: '55' }, { type: 'armer' }]);
});

test('toile : la relation qui vaut à un plan est la dernière posée avant lui', () => {
  const a = (plan, de, vers) => {
    const p = toile.paires(d, E.index(d.film).plan[plan].ordre, []).find((x) => x.de === de && x.vers === vers);
    return p && p.actif ? p.actif.mot : null;
  };
  assert.equal(a('1-08', 'seed', 'rob1'), null);
  assert.equal(a('2-01', 'seed', 'rob1'), 'le porte');
  assert.equal(a('6-13', 'seed', 'rob1'), 'le rattrape : humain + machine');
  assert.equal(a('6-14', 'seed', 'rob1'), "l'appelle : son premier mot");
  assert.equal(a('10-06', 'rob1', 'seed'), 'choisit pour elle, et lui ment');
  assert.equal(a('10-06', 'cain', 'seed'), 'refait à sa mesure');
  assert.equal(a('10-06', 'seed', 'cain'), null);
});

test('toile : tirer un lien demande un personnage, un mot et le plan du curseur', () => {
  const r = jouer(toile, [
    { type: 't', v: '150' }, { type: 'pas', v: '1' }, { type: 'aller', plan: '10-05' }, { type: 'armer' }, { type: 'noeud', id: 'cain' },
    { type: 'attendre', texte: '   ' }, { type: 'attendre', texte: ' ne sait pas  qu\'il existe ' }, { type: 'garder' }, { type: 'noeud', id: 'rob1' }, { type: 'pas', v: '-1' },
  ]);
  assert.deepEqual(r.e.gardes, [{ type: 'lien', de: 'seed', vers: 'cain', mot: "ne sait pas qu'il existe", depuis: '10-05' }]);
  assert.equal(r.e.t, 148);
  assert.match(toile.texte(d, r.e), /Seed → CAIN, depuis 10-05 : « ne sait pas qu'il existe »/);
  const p = toile.paires(d, 150, r.e.gardes).find((x) => x.de === 'seed' && x.vers === 'cain');
  assert.equal(p.actif.src, 'choix');
  for (const n of d.toile.noeuds) jouer(toile, [{ type: 'noeud', id: n.id }, { type: 't', v: '75' }, { type: 'armer' }, { type: 'revenir' }]);
});

test('montage : un clic envoie l\'action, la vue se rend, Garder écrit dans le stockage local', () => {
  const stock = {};
  const ecouteurs = { racine: {}, document: {} };
  const zones = ['phrase', 'outils', 'figure', 'cote', 'choix'].map((nom) => ({ nom, innerHTML: '', getAttribute: () => nom }));
  const racine = {
    querySelectorAll: () => zones, querySelector: () => null, contains: () => true,
    addEventListener: (type, f) => { ecouteurs.racine[type] = f; },
  };
  globalThis.localStorage = { getItem: (k) => stock[k] || null, setItem: (k, v) => { stock[k] = v; } };
  globalThis.document = { activeElement: null, addEventListener: (type, f) => { ecouteurs.document[type] = f; } };
  const clic = (attrs) => ecouteurs.racine.click({ target: { closest: () => ({ disabled: false, hasAttribute: () => false, getAttribute: (k) => (k in attrs ? attrs[k] : null) }) } });
  try {
    const m = E.monter('promesses', racine, d);
    const zone = (nom) => zones.find((z) => z.nom === nom).innerHTML;
    assert.match(zone('phrase'), /Clique une promesse/);
    clic({ 'data-act': 'sel', 'data-id': 'suite' });
    assert.equal(m.etat().sel, 'suite');
    assert.match(zone('cote'), /NOUVEAU SUJET : CAIN/);
    clic({ 'data-act': 'assumer' });
    assert.match(zone('phrase'), /^1 en attente/);
    assert.equal(stock['se.essais.promesses.v1'], undefined);
    ecouteurs.document.keydown({ key: 'Enter', target: { tagName: 'BODY', getAttribute: () => null }, preventDefault() {} });
    assert.deepEqual(JSON.parse(stock['se.essais.promesses.v1']), [{ type: 'assumer', promesse: 'suite' }]);
    ecouteurs.document.keydown({ key: 'Escape', target: { tagName: 'BODY', getAttribute: () => null } });
    assert.equal(E.monter('promesses', racine, d).etat().gardes.length, 1);
  } finally {
    delete globalThis.localStorage;
    delete globalThis.document;
  }
});

test('pages : à jour, autonomes, une zone par morceau de vue', (t) => {
  const p = pages();
  assert.deepEqual(Object.keys(p), ['index.html', ...ESSAIS.map((e) => e.nom + '.html')]);
  const vues = { promesses, savoir, toile };
  for (const [nom, html] of Object.entries(p)) {
    t.assert.fileSnapshot(html, join(DOSSIER, nom), { serializers: [(s) => s] });
    assert.equal(html.split('<!--SITE_HEADER-->').length, 2, nom);
    assert.doesNotMatch(html.replace(/<script[\s\S]*?<\/script>/g, ''), /undefined|NaN|\[object/, nom);
    assert.doesNotMatch(html, /<script[^>]+src=|<link[^>]+href="(?!https:\/\/fonts\.)/, `${nom} : aucune ressource locale liée`);
    const essai = nom.replace('.html', '');
    if (!vues[essai]) continue;
    const json = /<script type="application\/json" id="data-essai">(.*?)<\/script>/s.exec(html)[1];
    const dPage = JSON.parse(json);
    const v = vues[essai].vue(dPage, vues[essai].init(dPage, []));
    for (const zone of Object.keys(v)) assert.ok(html.includes(`data-zone="${zone}"`), `${nom} : zone ${zone}`);
    assert.equal(html.split('</script>').length, 3, `${nom} : deux blocs de script, pas un de plus`);
  }
  assert.match(p['index.html'], /10 éléments sur 32 promesses, 16 faits et 52 relations/);
});
