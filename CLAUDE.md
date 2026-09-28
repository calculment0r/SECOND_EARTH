# SECOND EARTH · brief de reprise pour une session Claude

Ce dossier contient tout le développement de Second Earth au 28/09/2026 : le monde (Bible), les espèces, la science, le film, la carte, les arbitrages, les sources d'origine. Il sert à une nouvelle session Claude (Claude Code ou Cowork) qui construit un site hébergé sur GitHub pour présenter le projet, en commençant par un **outil de prompts Midjourney**.

Lire ce fichier en entier avant toute action. Puis lire `docs/bible/00-registre-des-decisions.md`.

**État au 28/09/2026 (fin de la session de construction du site)** : le dépôt `calculment0r/SECOND_EARTH` (public) contient ce dossier, le site et l'outil de prompts. Voir la section 10 avant de toucher au site.

---

## 1. La mission de cette session

1. **Priorité 1 : l'outil de prompts Midjourney** (spécification complète : `site-spec/outil-prompts.md`).
   Une page HTML statique, sans serveur :
   - en haut, **une barre de paramètres globaux** saisie une fois (ex. `--ar 16:9 --hd --sref 15684 --v 8.2`) et ajoutée automatiquement à la fin de chaque prompt ;
   - une organisation **par onglets** : d'abord **Bestiaire**, puis **Paysages** dans un autre onglet, puis Flore, Personnages et machines, Titans ;
   - une présentation très claire et rangée (groupes par biome, codes, statuts) ;
   - **un bouton « Copier » par prompt**, qui copie le prompt complet (phrase de style + sujet + paramètres globaux).
2. **Priorité 2 : le site de présentation du projet** sur GitHub Pages, qui héberge l'outil, la carte, le monde, les espèces, le film, la science (spécification : `site-spec/site.md`).
3. Tout le contenu vient de ce dossier. **Rien ne s'invente** : ce qui manque se propose à Cal (voir section 4) et reste marqué « proposé » tant qu'il ne l'a pas tranché.

Les données sont déjà extraites en JSON dans `data/` (section 7). Le script qui les produit : `tools/build_data.py`.

---

## 2. Le projet en bref

- **Auteur et réalisateur** : Cal (NIRVALAB). Écriture et conception avec Medhi Mejri (d'après Cal ; aucun document du dossier ne le mentionne).
- **Commanditaire** : Science Centre Singapore, projet porté par Nina Albani (aïo Creative Group, Singapour).
- **Produits** :
  - un **film de 25 min** maintenant, puis un **film de 55 min** conçu dès l'écriture du 25 pour se fabriquer par ajout, jamais par remontage (colonne vertébrale + 9 modules) ;
  - une **salle immersive** temps réel dans Unreal, développée avec **BoraBora Studios** : narration sans Seed, avec les Robs ; le visiteur est chef de mission, un peu d'interaction, surtout contemplatif, jamais scolaire ;
  - une **expo classique organisée par biome**, cartels en trois temps : SUR TERRE / SUR KORÊ / POURQUOI.
- **Financement visé** : une aide IA singapourienne qui ouvre en décembre (~120 k€), combinée à une licence anticipée du Science Centre (d'après Cal ; les documents parlent de l'« aide IA ~120 k€ » et du « dossier de décembre » : `docs/film/13-propositions.md`, `docs/film/30-notes-pour-nina.md`).
- **Fabrication des images** : deux chaînes, une direction artistique. Les séquences avec Seed passent par le pipeline génératif de NIRVALAB (sur ses machines) avec des planches qui fixent les invariants ; les séquences sans Seed (paysages, Robs, Titans, course) sont construites dans Unreal avec BoraBora. Midjourney sert à la recherche visuelle et aux planches.
- **Carton final du film** : « This is a fictional planet. Earth is the only world we know. Take care of it. »

### L'histoire (résumé)

2045 : le vaisseau-semeur PERSEPHORA quitte le système solaire. Il ne prend rien à la Terre : il porte des embryons et des machines. 2098 : il arrive à 61 Cygni A, 11,4 années-lumière. Il largue le XENOPOD-01 (la capsule qui porte l'embryon) et des collecteurs. Quatre robots, les Robs, vérifient en une seule sortie que la planète possède toutes les briques de la vie (carbone, eau, azote, phosphore, soufre, métaux) avant la naissance de Seed. Seed naît, 15 ans apparents, cheveux blancs, presque muette (quatre mots dans tout le film : « Rob ! », « Seed », « Korê », « Je suis Seed »). Le XENOPOD tombe dans un sinkhole. Seed et Rob1 partent chercher Rob2, Rob3, Rob4 à travers 12 biomes (~5 500 km ; « quelques semaines » validé, ~41 jours dans la Chronologie, proposé), rebaptisent la planète **Korê** d'après le cri d'un oiseau des salins, puis reviennent. La Phase 1 réussit : Korê a tout. Rob1 envoie pourtant « NON VIABLE » vers la Terre (« Terre : réception dans 11,4 ans ») : son mensonge protège un monde complet. Puis il modifie le protocole du second embryon, CAIN (ingénieur de terraformation, 35 ans, mémoire transférée à 100 %), ramené à 14 ans et 21 %.

Référence du récit : `sources/SECOND_EARTH_STORY.docx` fait foi. `sources/SECOND_EARTH_STORY_v2.docx` (le récit réécrit avec le monde, livré le 27/09) devient la référence **après la relecture de Cal** (round 14, R01). Version lisible : `docs/film/00-recit-v2.md`.

---

## 3. Korê, les chiffres

Tout est validé sauf ce qui est marqué (proposé).

| Donnée | Valeur |
| --- | --- |
| Étoile | 61 Cygni A, naine orange K5V, 4 400 K, 15 % de la luminosité du Soleil, ~6,1 milliards d'années, 11,4 années-lumière |
| Compagne | 61 Cygni B (K7), orbite de ~659 ans ; la nuit, un point orange plus brillant que la pleine Lune (nuits ambrées) |
| Planète | 61 Cygni Ab, rebaptisée Korê ; orbite ~0,41 UA ; année ~116 jours terrestres (69,6 jours de Korê) |
| Jour | ~40 h ; Seed dort deux fois par jour |
| Masse, rayon, gravité | ~1,5 M⊕, ~1,15 R⊕, **1,13 g** (sauts ~12 % moins hauts, chutes ~6 % plus rapides) |
| Air | type Carbonifère : **30 % O₂, 2 % CO₂, 1,3 bar** |
| Pluie | pH ~4,7 (karst, cavernes) |
| Eau | ~40 % de la surface ; 58 % de terres émergées ; déserts ~30 % des terres, jungles ~4 à 5 % |
| Saisons | inclinaison ~20–25°, quatre saisons d'environ 4 semaines ; saison noire (sans 61 Cygni B la nuit) = bioluminescence |
| Grande lune | 0,1 M⊕, ~3 300 km de rayon, ~443 000 km ; mois de 21 jours de Korê (35 jours terrestres) ; même diamètre apparent que l'étoile ; éclipses en cartel seulement |
| Petite lune | ~1 000 km, ~120 000 km, révolution 2,35 jours de Korê ; seconde marée (0,6) |
| Marées | vives-eaux ~7 fois la Terre ; Golfe 1 : 10–15 m ; Golfe 2 (mer de Rob4) calme |
| Lumière (proposé) | ~4 500 K à midi, ~90 % de l'éclairement terrestre ; ciel bleu pâle laiteux ; crépuscules rouges de plus d'une heure (onglet Lumière et couleurs, jamais validé en round) |
| Végétal | deux lignées : **pourpre en haut, vert dessous** ; sous la canopée la lumière est magenta |
| Géologie | tectonique active, plaques petites et rapides ; rift du Golfe 1, collision du massif, subduction plane de l'Océan 2 (arc volcanique ~1 200 km en arrière de la fosse), mer d'arsenic d'origine volcanique |
| Histoire profonde | Titans (géants) éteints il y a ~60 Ma par une pluie de comètes ; descendants : buffles albinos, Créature des profondeurs |
| Voyage | départ 2045, arrivée 2098, ~21 % de c (fusion + warp drive sous-luminique, Fuchs et al. 2024) |

Détail : `docs/bible/` (registre, biomes, lumière, lunes, géologie, Titans, continents, glossaire) et `docs/science/phosphore-biomasse-et-seconde-terre.md` (la thèse : le phosphore limite une biomasse finie ; pourquoi pas Mars ; le piège de l'arsenic).

---

## 4. Travailler avec Cal : règles fermes

Ces règles viennent de ses demandes répétées. Elles priment sur toute habitude.

1. **Langue** : français. Les prompts d'image sont en anglais.
2. **Jamais d'émoticône**, nulle part (réponses, fichiers, interface, commits).
3. **Pas de commentaire de valeur, pas de vente.** Exposer les faits, le laisser juger. Pas de « superbe », « puissant », « parfait ».
4. **Les arbitrages se font par QCM dans une page web** : options pré-rédigées avec leur conséquence écrite en face, un champ libre par décision, un bouton qui copie ses réponses en texte pour les recoller dans le chat. Modèle existant : `data/arbitrages-second-earth.html` (rounds 1 à 16). Au 28/09 elle ne contient plus de question ouverte (`GROUPS = []`, `Q = []`) mais tout le code est là : pour un nouveau round, remplir `GROUPS` et `Q` sur le modèle des décisions archivées, et changer la clé de stockage.
   - Relire le Registre (`docs/bible/00-registre-des-decisions.md`) **avant chaque QCM**.
   - Ne jamais re-soumettre un point déjà tranché ; ne jamais proposer une option qui contredit un point validé.
   - Ne jamais annoncer un QCM sans qu'il s'affiche dans le même tour.
5. **Les fichiers .md lui sont illisibles.** Tout ce qu'il doit lire se livre en page HTML ou en document (Word, Claude Docs), jamais en Markdown. Les .md de ce dossier sont pour Claude.
6. **Quand un prompt est corrigé, réécrire le bloc entier**, prêt à copier, jamais un morceau.
7. **Statuts** : chaque élément est « validé » (tranché par Cal, avec son round) ou « proposé ». Un point validé n'est plus remis en question. Le Registre fait foi. Le Bestiaire a ses propres étiquettes de ligne : **Origine** (bestiaire de février 2026, inchangé), **Recalé** (modifié pour respecter une règle), **Nouveau** (ajouté) ; ses règles, noms latins, recalages et Titans ont été validés au round 8. Certaines plantes portent « Validé (docx) » ou « Validé (biome) » : validées avec le docx ou avec la fiche du biome.
8. **Gel du monde** : au round 16 (N01), Cal a choisi « Relire et corriger » ; le Registre l'écrit ainsi : « Cal relit et corrige ; rien n'avance tant que ses corrections ne sont pas passées. » Tant que ses corrections de relecture ne sont pas intégrées, **ne pas ajouter de contenu au monde ni au script**. L'outil de prompts et le site sont de la fabrication demandée explicitement (28/09) : ils présentent le contenu existant, ils ne le modifient pas.
9. **Épigraphe du 55** : la phrase du docx est gardée pour l'instant. Ne pas proposer d'autre épigraphe sans demande.
10. **Prompts d'image** (règles écrites dans les Planches de dessin, document au statut proposé) : formes, matières et lumière uniquement ; **aucun nom d'artiste, de studio, de film, de personnage existant, ni de marque**. Même règle pour la musique.
11. **Direction artistique** : ne jamais reproduire une œuvre, un personnage ou un logo existants.

### Charte des interfaces (détail : `site-spec/charte.md`)

- **Site : thème « Verdant »** (Showrunner UI Kit, fourni par Cal le 28/09/2026 avec la demande de l'appliquer au site ; référence dans `theme/showrunner-ui-kit/`). Il remplace pour le site le thème « Oblivion clair » ci-dessous. Pas de bascule clair / sombre.
- Verdant : fond presque noir `#0a0d0b`, rampe corail `#f0b49b → #7a3a22`, vert profond `#2f6b4a → #1a3f2c`, accent `#e0674a`, encre bleutée `#b9cfd8` ; Venus Rising (titres, chiffres), Chakra Petch (texte, boutons), Azeret Mono (étiquettes).
- Ancien thème, encore dans le CSS source de la carte et de la page QCM (la construction du site les convertit) : « Oblivion clair », accent `#ff5200`, Instrument Serif + DM Mono.
- Surbrillance = on voit ce que c'est (fiche lisible), pas seulement des pastilles de couleur ; un clic maintient, un clic dans le vide relâche.

---

## 5. Ce qui est ouvert au 28/09/2026

- [ ] **Relecture de Cal** (round 16) : en attente de ses corrections. Rien n'avance côté monde et script avant.
- [ ] **Récit v2** : devient la référence après sa relecture.
- [ ] **Épigraphe du 55** : plus tard, à sa demande.
- [ ] **Dessin des nouvelles espèces** : quatre de la jungle, le grimpeur des cols, le Titan volant, l'oiseau des salins.
- [ ] **Prompts à rédiger** : les 11 personnages et machines ont un prompt (Planches de dessin, proposé). Au Bestiaire, 9 lignes sur 66 ont un prompt ; à la Flore, 5 sur 42 ; aucun des 7 Titans ni des 18 paysages. Voir `site-spec/outil-prompts.md`, section « Prompts manquants ».
- [ ] **Écarts connus dans les documents** (à signaler à Cal, pas à corriger seul) :
  - la Flore compte 42 lignes, le Registre dit 41 plantes ;
  - dans le document Claude Docs « Flore de Korê », les douze plantes des continents B, C, D sont encore marquées « Proposé » alors que le Registre les dit validées (round 16, F01) ; l'export de ce dossier est corrigé ;
  - les neuf espèces hors trajet (HT-01 à HT-09) n'ont pas de statut dans le Bestiaire ;
  - quatre planches de dessin (document au statut proposé) ne décrivent pas l'animal comme le Bestiaire (validé au round 8), et leurs prompts suivent la planche : JP-01 fleurs-papillons (10–15 cm posées sur les arbustes-perchoirs / 5–8 cm, fleur fermée sur une tige), HP-01 buffle albinos (~2,5 m, cornes courtes en crochet / 3–4 m, cornes larges incurvées), LS-01 oiseau des salins (~60 cm, gris clair / 1,4 m, pourpre), FB-03 oiseau-reptile (~40 cm, ailes membraneuses, vert-bronze / 15–25 cm, ailes à plumes, écailles irisées). Le détail est dans le champ `ecart_planche` des données ; l'outil doit l'afficher sur ces fiches ;
  - deux choses sont décrites deux fois : TR-F (Titan volant, fossile) au Bestiaire et aux Titans ; TR-05 (plantes-chant) au Bestiaire et FL-TR-01 à la Flore. Champ `voir_aussi` dans les données ; TR-05 reprend le prompt de FL-TR-01. Le Bestiaire compte donc 64 animaux distincts ;
  - les Notes pour Nina (27/09) parlent de 52 espèces et 29 plantes ; les chiffres ont grandi depuis (66 lignes au Bestiaire + 7 Titans ; 42 plantes).
- [ ] **Format de projection du 25** (dôme Omni-Theatre ou salle classique) : master 16:9 et adaptation dôme validés (A04) ; le calendrier dépend de BoraBora.

---

## 6. Inventaire du dossier

```
CLAUDE.md                  ce fichier
BRIEF.html                 le même brief, en page lisible par Cal
README.md                  une page d'accueil courte pour le dépôt
site-spec/
  outil-prompts.md         spécification de l'outil Midjourney (priorité 1)
  site.md                  plan du site GitHub Pages, publication, confidentialité
  charte.md                thème Oblivion clair, jetons CSS, recette iOS
data/
  bestiaire.json           66 lignes du Bestiaire (code, noms, taille, à dessiner, vie, jumeau, statut, biome, prompt)
  titans.json              7 Titans éteints
  flore.json               42 plantes
  palette-flore.json       13 lignes : couleur dominante par biome (10 du trajet + continents B, C, D ; rien pour les 8 hors trajet)
  planches.json            24 planches de dessin (personnages, machines, animaux, plantes) avec prompt EN
  paysages.json            18 biomes (10 du trajet, 8 hors trajet) avec leurs sections de texte
  arbitrages-second-earth.html   la page QCM (rounds 1 à 16 archivés, aucune question ouverte) : modèle pour les futurs QCM
docs/
  bible/                   le monde : registre des décisions (fait foi), trajet, chronologie,
                           10 fiches de biome du trajet, biomes hors trajet (+ 8 fiches),
                           Titans, continents et océans, cartels par acte, lumière et couleurs,
                           glossaire, lunes et marées, géologie et plaques
  especes/                 Bestiaire, Flore, Planches de dessin (fiches + prompts)
  science/                 étude Phosphore, biomasse et seconde Terre (la thèse du film)
  film/                    Récit v2, architecture 25/55, séquencier, modules du 55,
                           propositions, écarts docx/Bible, salle immersive,
                           découpage 25 min (150 plans), journal de Rob1, notes pour Nina
carte/
  carte-kore.html          la carte interactive v3 (planète + corridor, couche des plaques)
  world.png, corridor.png  les deux images de base
  *.py, map_meta.json, plates.json, map_template_v3.html   le générateur de la carte
sources/                   NE PAS PUBLIER (voir site-spec/site.md)
  SECOND_EARTH_STORY.docx  le récit de référence (Cal)
  SECOND_EARTH_STORY.txt   son texte brut
  SECOND_EARTH_STORY_v2.docx   le récit réécrit avec le monde (en attente de relecture)
  SYNOPSIS SECOND EARTH (ENG).md, Traitement 4 pages Second Earth.md   archives (ancienne version Proxima b / EPOCH)
  biome claude.pdf         le bestiaire de février 2026 (origine)
tools/
  xml2md.py                convertisseur Claude Docs -> Markdown utilisé pour l'export
  build_data.py            extraction des tables Markdown -> data/*.json
  build_brief_html.py      construit BRIEF.html à partir de CLAUDE.md et site-spec/
  brief_template.html      gabarit de BRIEF.html
  build_site.py            construit tout le site dans _site/ (section 10)
  build_prompts.py         construit l'outil de prompts (appelé par build_site.py)
  site/prompts.html        gabarit de l'outil de prompts
site/assets/               thème Verdant du site : site.css, site.js, icon.svg, fonts/venus-rising.otf
theme/showrunner-ui-kit/   le kit d'interface fourni par Cal (référence visuelle du thème)
.github/workflows/pages.yml   construction et publication GitHub Pages
.gitignore                 exclut sources/ et _site/ du dépôt
```

Ajout du 28/09 : `docs/film/01-recit-docx.md` est le texte du docx de référence (`sources/SECOND_EARTH_STORY.txt`), converti tel quel (titres de parties en `##`), pour publier « le script » à la demande de Cal ; les fichiers de `sources/` eux-mêmes restent hors du dépôt.

Chaque fichier de `docs/` commence par une ligne `<!-- Source : ... -->` qui donne le document Claude Docs d'origine et la date d'export. **Les documents vivants restent dans Claude Docs** (compte de Cal) ; ce dossier en est une copie au 28/09/2026. Si Cal modifie un document, réexporter plutôt que corriger la copie à la main.

Liens en ligne (privés, compte de Cal) : la carte https://claude.ai/artifact/PxfBWGF1dk4DJWuzUdXJvt ; le QCM https://claude.ai/artifact/GBg169jA4N56T1hG1jukoK.

### Codes et vocabulaire

- **Espèces** : `JP` jungle primordiale, `PK` pitons karstiques, `TR` terres rocheuses et cavernes, `MG` massifs et glaciers, `FB` forêt bioluminescente, `HP` Hautes Plaines, `FA` forêt ancienne, `ZT`/`VC` course volcanique et zones de transition, `MA` mer d'arsenic et fosse, `LS` lacs salés pourpres, `HT` hors trajet, `CB`/`CC`/`CD` continents B, C, D, `TX` transversales. Plantes : même code précédé de `FL-`.
- **Géographie** (codes de mission, validés) : continents A à D par surface (A = 60 % des terres, celui du trajet) ; Océans 1 à 3 ; Golfes 1 (ouest) et 2 (est, mer d'arsenic).
- **Machines** : PERSEPHORA (le vaisseau-semeur), XENOPOD-01 (la capsule de Seed), XENOPOD-02/-03/-04 (robopods collecteurs de Rob2, Rob3, Rob4), drones porteurs (~15 kg), Rob1 à Rob4, Rob1/2 (fusionné, bipède coureur ~2,5 m), Rob1/2/3 (le tank). CAIN : l'embryon de l'alvéole H-02, ingénieur de terraformation, que Rob1 ramène de 35 à 14 ans et de 100 % à 21 % de mémoire transférée.
- Glossaire complet : `docs/bible/34-glossaire.md`.

---

## 7. Les données JSON (pour l'outil et le site)

Toutes en UTF-8, champs en français, produits par `python3 tools/build_data.py`.

Champs communs à `bestiaire.json`, `flore.json` et `titans.json` :
```
code, nom, latin, section (titre de la section du document d'origine),
groupe (trajet | hors-trajet | continents | transversal | titans),
taille, jumeau, statut,
prompt_en      prompt d'origine complet (vide si à rédiger)
prompt_lumiere la clause de lumière du prompt d'origine
prompt_corps   le prompt d'origine sans la phrase de style ni la lumière ni « no text, no watermark »
prompt_statut  « proposé (Planches de dessin) » ou « à rédiger »
voir_aussi     (quelques fiches) code de la même chose dans un autre fichier
```
En plus :
- `bestiaire.json` : `biome_id`, `a_dessiner`, `vie` ; `biome` (texte « où ») seulement pour les hors trajet et les continents ; `ecart_planche` sur JP-01, HP-01, LS-01, FB-03.
- `flore.json` : `biome_id`, `couleurs`, `explication` ; `role` (« Dans le film », trajet seulement) ; `biome` (« Où », hors trajet et continents).
- `titans.json` : `vestiges`, `descendant`.
- `biome_id` vaut : jungle, pitons, cavernes, massifs, foret-bio, hautes-plaines, foret-ancienne, volcanique, mer-arsenic, lacs-sales, hors-trajet, continent-b, continent-c, continent-d, transversal.

`planches.json` : titre, codes, categorie (personnage | machine | animal | plante), silhouette, matieres, traits, poses, invariants (les trois derniers ne sont écrits que pour une partie des planches), statut (« proposé »), prompt_en, prompt_label (« Prompt », ou « Prompt (hybride) » pour Rob4), prompt_lumiere, prompt_corps.
`paysages.json` : id, groupe (trajet | hors-trajet), ordre_trajet (trajet seulement), titre, fichier, sections (titre de section -> premier paragraphe ; les titres varient d'une fiche à l'autre : « Où et pourquoi » pour la jungle, « Le milieu » ailleurs, « Les espèces », « Dans l'expo », « Cartels » pour les hors trajet).
`palette-flore.json` : biome, dominante, accents, mouvement (10 biomes du trajet + continents B, C, D).

Ordre du trajet (pour trier) : jungle, pitons, cavernes, massifs, forêt bioluminescente, Hautes Plaines, forêt ancienne, course volcanique, mer d'arsenic et fosse, lacs salés pourpres.

---

## 8. Décisions à faire trancher par Cal au démarrage (en QCM, page web)

Ne pas les trancher seul. Présenter un seul QCM au début, avec les conséquences :

1. **Visibilité du site** : dépôt public + GitHub Pages public (gratuit, tout le monde peut lire, y compris des éléments non encore annoncés au client) / dépôt privé + Pages (GitHub Pro ou Team : le code est privé mais **le site publié reste public**) / site à accès restreint (GitHub Enterprise Cloud seulement) / outil de prompts seul en ligne, le reste hors ligne.
2. **Ce qui se publie** : tout le monde et les espèces / sans le récit ni le découpage / seulement l'outil de prompts et la carte. Le dossier `sources/` ne se publie dans aucun cas (docx de Cal, archives).
3. **Langue du site** : français / anglais (Singapour) / les deux.
4. **Version de Midjourney par défaut** dans la barre : V8.2 (défaut actuel) / V7 (si ses `--sref` ou profils ont été faits en V7).
5. **Prompts manquants** : Claude les rédige par lots à partir des fiches (marqués « proposé », validés par Cal dans l'outil) / Cal les rédige lui-même dans l'outil.
6. **Nom et adresse** : nom du dépôt, domaine propre ou `github.io`.

Tranché par Cal dans le chat le 28/09/2026 (pas en QCM) : **tout se publie**, « la bible, le bestiaire etc, mais aussi le script, tout », sur GitHub Pages depuis le dépôt public `calculment0r/SECOND_EARTH` (points 1, 2 et 6) ; **thème Verdant** (Showrunner UI Kit). Appliqué par défaut, sans décision de Cal : site en français (le contenu l'est), V8.2 par défaut dans la barre de l'outil (modifiable), prompts manquants laissés « à rédiger » (gel du monde, règle 8). Restent à lui soumettre : langue (point 3), version par défaut (point 4), rédaction des prompts manquants (point 5), domaine propre.

---

## 9. Méthode de travail conseillée

1. Lire `CLAUDE.md`, le Registre, `site-spec/outil-prompts.md`.
2. Poser le QCM de la section 8.
3. Construire l'outil de prompts (fichier HTML autonome), le tester (Playwright est pratique : copier, onglets, barre de paramètres, recherche, rendu mobile).
4. Monter le dépôt et GitHub Pages selon la décision de visibilité.
5. Ajouter les pages du site une par une, en reprenant le contenu des `docs/` sans le réécrire.
6. Commits en français, sans émoticône.

---

## 10. Le site (état au 28/09/2026)

Adresse : https://calculment0r.github.io/SECOND_EARTH/ . GitHub Pages activé par Cal le 28/09/2026 (Settings > Pages > Build and deployment > Source : GitHub Actions). La branche par défaut du dépôt est `claude/beautiful-goldberg-x0to5u` (première branche poussée) ; l'environnement `github-pages` n'accepte que la branche par défaut.

- **Construction** : `python3 tools/build_site.py` (bibliothèque standard seulement) écrit le site dans `_site/` (ignoré par git). Ouvrir `_site/index.html` depuis le disque marche aussi (liens relatifs, données injectées).
- **Publication** : `.github/workflows/pages.yml` reconstruit et publie à chaque push sur `main` ou sur la branche de travail, et à la demande (workflow_dispatch).
- **Pages** : accueil ; `bible/` (registre, trajet, chronologie, continents, géologie, lumière, lunes, Titans, glossaire) ; `biomes/` (10 du trajet dans l'ordre, vue d'ensemble et 8 hors trajet) ; `bestiaire/` (fiches depuis `data/bestiaire.json` + `titans.json`, filtres, recherche ; `document.html` = le document complet) ; `flore/` (idem) ; `planches/` ; `carte/` (carte v3 dans un cadre + plein écran) ; `science/` ; `film/` (récit de référence, récit v2, journal de Rob1, architecture, séquencier, modules, découpage, propositions, écarts, notes pour Nina) ; `expo/` (cartels par acte, salle immersive) ; `arbitrages/` (statuts, lien vers le registre, page QCM) ; `prompts/` (l'outil).
- **Le contenu n'est pas réécrit** : chaque page de document est rendue depuis `docs/` par un petit convertisseur Markdown intégré à `build_site.py`. Il ajoute seulement : pastilles de statut sur « [validé] », « (proposé) »… ; liens sur les codes d'espèce (vers les fiches) et sur les noms des fiches hors trajet ; remplacement des liens d'artefacts Claude privés (carte, QCM) par les pages du site ; ligne « Source » sans les identifiants internes.
- **Plan du site** : listes `NAV` et `SECTIONS` en tête de `build_site.py` (ajouter une page = une ligne).
- **Mettre à jour le contenu** : réexporter le document Claude Docs dans `docs/`, relancer `python3 tools/build_data.py` si une table d'espèces change, puis pousser : le site se reconstruit.
