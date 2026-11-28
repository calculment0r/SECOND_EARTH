# Compte rendu ALLY

Session Claude sur l'ordinateur de Cal (machine « Ally »), du 25 au 28 novembre 2026. Branche `claude/beautiful-goldberg-x0to5u` du dépôt `calculment0r/SECOND_EARTH`. Écrit le 28/11 pour l'audit croisé avec les autres sessions.

Ce fichier dit : ce qui est fait, où c'est, ce qui reste, et les points où ce travail peut contredire celui d'une autre session.

---

## 1. Ce qui est fait

### 1.1 L'inventaire des images et des vidéos (25/11)

- **98 vidéos et 60 images** relevées dans `C:\SECOND EARTH\VISUAL` (dossiers FAUNE_FLORE, SEED, SPACE, SECOND EARTH PANO). Pour chacune : mesures, description, plans et minutage, personnages, lieu, couleurs, état (bon / bon en partie / raté), meilleurs moments, usages possibles.
- Résultat : vidéos **46 bonnes, 50 bonnes en partie, 2 ratées** (`15_grotte_bioluminescente`, `18_la_musique_de_rob1`) ; images **35 bonnes, 25 bonnes en partie**.
- Dans le dépôt : `media/inventaire/inventaire.json`, `media/inventaire/vignettes/` (158), `media/inventaire/index.html` (la page avec filtres), `media/inventaire/outils/` (les scripts et la grille de visionnage).
- Méthode : images fixes toutes les 2 secondes, lues par 8 sous-agents. Le son n'a pas été écouté. Un défaut de mouvement entre deux images peut avoir échappé.
- **Coût** : environ 2 millions de jetons, tout le forfait Fable de Cal en 15 minutes. Règle gardée en mémoire depuis : annoncer le coût et demander avant de lancer plusieurs sous-agents ; jamais de session ni de sous-agent sur Fable.

### 1.2 Les médias en ligne

- **Cloudflare R2**, espace `nirvalab`, adresse publique `https://pub-34c30250aeb24f53b99da979a52a6c52.r2.dev/` :
  - les **98 vidéos** sous `second-earth/video/<dossier>/<nom>.mp4` (fichiers d'origine, seulement réorganisés pour démarrer vite sur le web), avec une image d'attente chacune sous `second-earth/affiche/<dossier>/<nom>.jpg` ;
  - les **60 panoramiques** sous `second-earth/pano/<nom>.jpg` (4 096 px de large au plus) et `second-earth/pano/original/<nom>.png`.
  - Les adresses sont dans l'inventaire (`video_url`, `affiche_url`, `image_url`, `original_url`). Les 2 vidéos ratées sont en ligne mais n'ont pas d'adresse dans l'inventaire.
- **Showrunner** (machine DGX2) : les 98 vidéos sont dans la bibliothèque Asset, Team « SECOND_EARTH_NICO_00 (1) », Workspace « Général », en trois dossiers : « SECOND EARTH · SEED » (avec les 2 panoramiques vidéo), « SECOND EARTH · SPACE », « SECOND EARTH · FAUNE FLORE ». Des copies plus anciennes de certaines vidéos étaient déjà dans ce Workspace hors dossier : doublons acceptés par Cal. Pas vérifié à l'écran dans Showrunner.

### 1.3 Les briefs pour Claude Design (25-26/11)

- `docs/site/BRIEF-CLAUDE-DESIGN.md` : le tronc commun (le projet, le matériel, neuf pages avec une chose à manipuler sur chacune, l'ordre du travail : trois écrans fixes par axe, puis le kit avec les outils de données, puis l'intégration ; three.js et objets en gaussian splatting). En annexe : la sélection de vidéos et d'images marquées « bon », avec leurs adresses.
- Trois axes, proposés par Claude, **non tranchés** : `BRIEF-AXE-1-ATLAS.md` (clair, éditorial), `BRIEF-AXE-2-ECRAN.md` (noir, cinéma), `BRIEF-AXE-3-SALLE.md` (lieu en 3D, proche de CONTINUUM).
- La maquette CONTINUUM est décrite avec son adresse en ligne (`https://calculment0r.github.io/NirvaLabWeb/work/continuum/`).
- `docs/site/briefs.html` : les quatre briefs avec un bouton Copier, refaite par `tools/build_briefs_site.py`.
- **Le kit étude complet** de Cal (dataviz, HUD, cartes, 3D, canevas, zoom, musique) est copié dans `theme/kit-etude/` et cité comme base des outils de données. Le dépôt est public : le kit l'est donc aussi.
- Pas encore collé dans Claude Design : aucune maquette n'existe.

### 1.4 Le deck de Nina (27/11, lu, rien écrit dans le dépôt)

« Second.Earth - Global Distribution deck » (PDF chez Cal, 13 pages, texte lu, images non regardées). Il raconte une version plus ancienne : pas de Seed, robots Patch, Bastion, Ripple, Forge, vaisseau « Mother », Proxima b, la Terre qui s'effondre, une fin sans le mensonge de Rob1 ; ni exposition ni salle immersive. Sa partie commerciale (offre pour les lieux, options éducation et boutique) n'existe pas dans le dépôt.

### 1.5 Les chantiers du 27/11 et les choix de Cal (round 18)

- Page à choix : `data/chantiers-2026-11-27.html` (aussi en artefact privé : https://claude.ai/artifact/RVWUNroABaSTA5SG3Kydyi). Ses sources : `docs/site/chantiers-2026-11-27/` (`personnages.json` et `solaris.json` sont les deux enquêtes Opus ; `moi.json` les prompts et les questions sur le site).
- Deux enquêtes en Opus : les personnages, la quête et la fin (13 questions) ; les outils de SOLARIS (7 questions). Coût : environ 170 000 et 310 000 jetons.
- **Les 29 réponses de Cal sont dans le Registre**, `docs/bible/00-registre-des-decisions.md`, section « Round 18 (27/11/2026) ». Les principales :
  - **Seed** : elle sait sans avoir senti, puis elle sent ; ses 23 % de mémoire sont des images et des sons, sans savoir ; cheveux blancs courts, tenue blanche, bas jaune (comme dans les vidéos).
  - **Rob1** : celui qui doit inventer ; apparence des vidéos (yeux bleus sur la visière), **taille 1 m**.
  - Scènes : l'alarme qui fait mal au réveil, coupée par Rob1 ; Rob1 qui choisit d'arrêter l'incubation au séisme ; Rob1 qui refuse d'être porté, boude, puis accepte ; la musique du vent dans les fleurs ; la danse de Rob1 aux lacs salés ; les trois rencontres de Robs rendues différentes ; « Phase 3 : colonie » montrée tôt ; « cobaye » qui s'efface ; Rob1 qui doit lâcher Seed chez Rob4.
  - Monde : MOTHER est la station de départ ; la horde est dans les Hautes Plaines ; le site compte en jours de Korê.
  - Site : un site, deux étages (ouvert et réservé à Nina) ; un code simple plus un accès invité ; un deck pour les lieux en premier ; anglais d'abord ; nom de domaine **secondearth.net** (acheté par Cal chez Cloudflare).
- Idée de Cal, **non tranchée** : une anomalie magnétique due à un second noyau décentré (le reste de fer d'un astre entré en collision).

### 1.6 Le récit (27/11)

- `docs/film/00-recit-v2.md` : **21 passages marqués [ajout du 27/11]** : les décisions du round 18, plus le voyage de PERSEPHORA dans le système solaire (Mars, Jupiter, les anneaux de Saturne, Titan, les Robs en veille, une planète sans étoile, le réveil de Rob1), demandé par Cal.
- Inventé par Claude et signalé à Cal : le passage qui relie le campement de Rob3 aux Hautes Plaines (Rob3 tire son robopod avec les rongeurs, ils ne s'assemblent pas pour garder le chargeur) ; Jupiter et la planète sans étoile ; le réveil de Rob1 ; trois lignes d'écran (« CONTINUER / ARRÊTER », l'alarme barrée, « J'ATTENDS »).
- Page de relecture avec une case par passage : `data/recit-ajouts-2026-11-27.html` (artefact privé : https://claude.ai/artifact/RSVWNa4wygwtzkioFQZUyw). **Cal relit ; ses remarques ne sont pas encore revenues.**
- Décision de Cal (27/11) : fixer le récit en français avant toute traduction.

### 1.7 Le site du projet (27/11)

- C'est `site-projet/`, publié sous `/projet/`, qui a déjà le mode édition repris de NirvaLab et les accès par code. `tools/medias_site_projet.py` y a posé les vidéos et panoramiques en ligne (cinq ouvertures, quatre carrousels) et un texte « Seed et Rob1 » marqué « proposé » ; les fiches de Seed et de Rob1 sont corrigées. 41 médias en ligne posés.
- Regardé dans un navigateur sur une copie locale : la vidéo d'ouverture joue, les panoramiques s'affichent. La mise en ligne automatique sur GitHub Pages n'a pas été vérifiée.
- `tools/build_site.py` publie aussi l'inventaire sous `inventaire-medias/`.

### 1.8 Les prompts d'images (27-28/11)

- `docs/film/prompts-images-2026-11-28.md` : le caisson d'incubation (Midjourney), Rob1 qui regarde le caisson (Seedream, avec l'image du caisson en référence), la tenue d'incubation de Seed (Midjourney), le réveil dans la capsule (Seedream, écrit avec la méthode du prompt d'exemple de Cal).
- Les huit prompts K1 à K8 de la page des chantiers sont **jugés mauvais par Cal** : ils racontent au lieu de décrire l'image. La méthode qui marche est écrite dans le fichier.

---

## 2. Ce qui reste à faire

**Pour lundi 30/11**
1. Recevoir les remarques de Cal sur les 21 passages du récit, et les appliquer.
2. La version anglaise du site (anglais d'abord, bouton français), après le récit fixé en français.
3. Faire pointer **secondearth.net** vers le site.
4. L'étage réservé à Nina : code simple, accès invité, et le deck pour les lieux.

**Ensuite**
5. Dans Claude Docs (compte de Cal) : corriger la planche de Rob1 (1 m, yeux bleus) et celle de Seed (cheveux courts, tenue blanche), ajouter MOTHER au Glossaire, mettre à jour la descente de Rob2 dans le Trajet, puis réexporter.
6. Les cartons de jours du récit en jours de Korê (décision S06), ou dire qu'ils restent en jours terrestres.
7. Réécrire les sept autres prompts d'images avec la méthode du 28/11, si Cal la valide ; lui demander s'il lève la règle « aucune marque, aucun nom » pour Seedream.
8. Coller les briefs dans Claude Design ; choisir un axe après les trois écrans fixes.
9. Un composant qui dessine les orbites et les deux lunes (aucun n'existe dans le kit).
10. Écrire la bible de Second Earth au format du kit SOLARIS (décision S08, après lundi).
11. Trancher l'anomalie magnétique. Vérifier aussi la remarque de Cal sur une « gravitation plus faible » : la gravité validée de Korê est **plus forte** (1,13 g).
12. Revoir les états « Rob1 trop grand » de l'inventaire (voir 3.1).
13. Effacer à la main le dossier `C:\SECOND EARTH\_nirvalabweb` (copie du dépôt NirvaLab, la suppression a été refusée par une sécurité).

---

## 3. Points à vérifier dans l'audit (contradictions possibles)

1. **La taille de Rob1.** Le round 18 fixe 1 m. Mais l'inventaire du 25/11 a jugé les vidéos avec une règle de **75 cm** (« le haut du casque juste sous la hanche de Seed ») : beaucoup de « bon en partie » viennent de « Rob1 trop grand ». À 1 m, une partie de ces jugements tombe. Les prompts Seedance du 05/11 (`video/seedance/prompts/`) disent aussi 75 cm. La règle 15 de `CLAUDE.md` est mise à jour à 1 m.
2. **Seed.** La planche de la Bible (`data/planches.json`, Claude Docs) dit « cheveux mi-longs », « combinaison grise » ; Cal dit que cela n'a jamais été voulu (cheveux courts, incubée en accéléré). Toute session qui a utilisé la planche de la Bible pour des prompts ou des textes a la mauvaise Seed.
3. **Le nom et le rôle de MOTHER.** Station de départ (round 18) ; dans le deck de Nina, c'est le vaisseau.
4. **Le deck de Nina** contre le récit : noms des robots, destination, Seed absente, fin.
5. **La horde** : déplacée dans les Hautes Plaines dans le récit le 27/11 ; une session qui a travaillé sur la forêt bioluminescente ou l'Acte VI avant cette date a la version d'avant.
6. **Les jours** : site en jours de Korê, récit en jours terrestres.
7. **Le kit étude** : deux versions dans le dépôt, `presentation/kit/` (ancienne, 18/11) et `theme/kit-etude/` (complète, 19/11). Le site du projet utilise encore l'ancienne.
8. **Le contenu du site du projet** (`site-projet/content/site-content.json`) : modifié par un script le 27/11. Si Cal ou une autre session a publié depuis le site entre-temps, l'une des deux versions a écrasé l'autre.
9. **Les branches** : tout ce travail est sur `claude/beautiful-goldberg-x0to5u`. Les branches `claude/editeur-nirva`, `claude/site-editable` et `claude/presentation-etude` (19/11) n'ont pas été fusionnées ni regardées dans cette session.
10. **Les briefs** : les anciennes pistes A et B du brief Claude Design sont remplacées par les trois axes. Une session qui aurait déjà lancé Claude Design avec l'ancien brief a un autre cadre.
11. **La Team Showrunner** : « SECOND_EARTH_NICO_00 (1) » a été prise parce que c'est la seule dont le nom contient « Second Earth ». Si la Team « secondearth » dont parle Cal est une autre, les vidéos ne sont pas au bon endroit.

---

## 4. Où sont les choses hors du dépôt

- Les fichiers originaux : `C:\SECOND EARTH\VISUAL` (ordinateur de Cal).
- Le dossier de travail de cette session : `C:\SECOND EARTH\_travail_inventaire` (images extraites, planches de lecture, copies web envoyées sur Cloudflare). Peut être effacé : tout ce qui compte est dans le dépôt ou sur Cloudflare.
- Les artefacts privés (compte de Cal) : la page des chantiers et la page de relecture du récit (adresses plus haut).
- La mémoire de Claude pour ce projet : `C:\Users\calcu\.claude\projects\C--SECOND-EARTH\memory\` (règle sur le coût des sous-agents).
