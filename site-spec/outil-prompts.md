# Outil de prompts Midjourney · spécification

Demande de Cal (28/09/2026), dans ses mots : une page HTML pour faire les prompts Midjourney ; en haut, une ligne qui gère les indications de prompt (`--16:9`, `--hd`, `--sref 15684`, etc.) pour les mettre une fois et que chaque prompt les ajoute automatiquement ; une organisation par onglets, d'abord le Bestiaire, les paysages dans un autre onglet ; tout rangé de façon très claire ; un bouton pour copier le prompt à chaque fois.

---

## 1. Forme

- Une page HTML **autonome** (CSS et JS dans le fichier), qui marche ouverte depuis le disque et publiée sur GitHub Pages.
- Les données viennent de `data/*.json`. Comme `fetch()` ne marche pas en `file://`, prévoir un petit script de construction (Python ou Node) qui **injecte les JSON dans la page** (`<script type="application/json" id="data-bestiaire">…</script>`). La page lit ces blocs ; sur le site, elle peut aussi relire les JSON à jour.
- Thème Oblivion clair, accent `#ff5200`, pas de bascule sombre (`site-spec/charte.md`).
- Aucune émoticône, ni dans l'interface ni dans les libellés (« Copié », pas de coche décorative).
- Téléphone : marges de 16 px, aucun défilement horizontal de la page (la barre d'onglets peut défiler seule).

---

## 2. La barre des réglages globaux (en haut, collante)

C'est le cœur de la demande : on règle une fois, chaque prompt en hérite.

### 2.1 La ligne de paramètres

Un champ texte unique, pleine largeur, où Cal tape comme il en a l'habitude :
```
--16:9 --hd --sref 15684
```
La page **normalise** ce qu'il tape et montre en dessous la ligne réellement ajoutée aux prompts :
```
--ar 16:9 --hd --sref 15684 --v 8.2
```
Règles de normalisation :
- `--16:9`, `--21:9`, `--9:16`, `--1:1`, `--4:5`… deviennent `--ar 16:9` etc. Midjourney n'accepte que des entiers : `2.39:1` devient `239:100`.
- `--aspect` devient `--ar`, `--stylize` `--s`, `--chaos` `--c`, `--weird` `--w`, `--version` `--v`, `--quality` `--q`, `--profile` `--p`.
- Un paramètre en double : le dernier gagne.
- Plusieurs codes `--sref` se mettent à la suite : `--sref 15684 2291034` (et `--sw` pour le poids).
- Tout ce qui n'est pas reconnu est gardé tel quel à la fin et signalé en gris (« non reconnu, conservé »).

À côté de la ligne, des **contrôles rapides** qui écrivent dans la même ligne (synchronisation dans les deux sens) :
- Format : 16:9 (défaut, master du film validé A04), 21:9, 2.39:1, 9:16, 1:1, 4:5, 3:2, 2:1.
- Version : 8.2, 8.1, 7 (défaut à faire trancher par Cal, voir CLAUDE.md section 8).
- `--hd` (interrupteur).
- `--style raw` (interrupteur).
- `--sref` (codes ou URL), `--sw` (0–1000), `--sv`.
- `--s` (0–1000), `--c` (0–100), `--w` (0–3000), `--exp` (0–100).
- `--no` (liste libre, séparée par des virgules), `--seed`, `--p`.

### 2.2 Compatibilités à signaler (sans bloquer)

État au 28/09/2026, à revérifier en début de session sur la documentation officielle Midjourney :
- V8.2 est la version par défaut depuis le 24/07/2026 ; V8.1 reste sélectionnable ; V7 aussi.
- `--hd` : valide en V8 (image native en 2048 px, coûte plus de temps GPU, ratio maximal réduit à 4:1).
- `--q` : V7 seulement ; en V8 afficher « --q ignoré en V8 ».
- `--oref` / `--ow` (Omni Reference) et `--cref` : absents de la famille V8 (remplacés par `--edit`) ; avertir si présents avec `--v 8.x`.
- Multi-prompts (`::`) : non pris en charge en V8.
- `--sref` accepte des codes numériques et des URL d'image ; `--sv` choisit la version du système de style.

Sources à relire : https://docs.midjourney.com/hc/en-us/articles/32859204029709-Parameter-List ; https://blakecrosley.com/guides/midjourney (V8.2, tableau des paramètres) ; https://midjourney-v8.com/blog/midjourney-v8-hd-mode-guide

### 2.3 La phrase de style (préfixe global)

Deuxième champ de la barre, repliable : la phrase de style commune à tous les prompts. Les Planches de dessin (proposé) la fixent ainsi, « à remplacer une fois pour toutes si la direction artistique change » :
```
painterly science-fiction concept art, realistic proportions, soft volumetric light from a warm orange star, no text, no watermark
```
Six des 24 prompts existants changent la lumière (grotte, nuit sans lune, sous l'eau, espace, brouillard). L'outil sépare donc cette phrase en trois parties :
- le **préfixe global** : `painterly science-fiction concept art, realistic proportions` ;
- la **lumière**, propre à chaque fiche (`prompt_lumiere`, par défaut `soft volumetric light from a warm orange star`) ;
- le **négatif**, passé en paramètre plutôt qu'en texte : `--no text, watermark`.

Un bouton « Revenir à la phrase des Planches » restaure les valeurs d'origine.

### 2.4 Jeux de réglages

- Enregistrer la barre complète sous un nom (« Planche 16:9 », « Paysage 21:9 sref 15684 »…), la rappeler d'un clic.
- Tout est gardé dans `localStorage`, dans des `try/catch` (la page doit marcher sans).
- Exporter / importer les réglages et les prompts modifiés en un fichier JSON (pour passer d'un ordinateur à l'autre : Cal travaille sur trois machines et un téléphone).

---

## 3. Les onglets

Dans cet ordre :

| Onglet | Données | Groupes |
| --- | --- | --- |
| **Bestiaire** (ouvert par défaut) | `bestiaire.json` (66) | les 10 biomes du trajet dans l'ordre du voyage, puis hors trajet, continents B, C, D, espèces transversales |
| **Paysages** | `paysages.json` (18) + `palette-flore.json` (10 biomes du trajet ; rien pour les hors trajet) | trajet (10, dans l'ordre), hors trajet (8) |
| **Flore** | `flore.json` (42) | mêmes groupes que le Bestiaire |
| **Personnages et machines** | `planches.json`, catégories personnage et machine (11) | Seed, les Robs, les machines |
| **Titans** | `titans.json` (7) | un seul groupe |

Chaque onglet affiche son nombre de fiches et le nombre de prompts prêts (ex. « Bestiaire 66 · 8 prompts »).

### Dans chaque onglet

- Une colonne de navigation à gauche (collante sur ordinateur, repliée en liste déroulante sur téléphone) : les groupes, avec leur nombre.
- Une recherche (code, nom, nom latin, texte des fiches), des filtres : « prompt prêt / à rédiger », statut (les valeurs réelles des données : validé avec son round, proposé, origine, recalé, nouveau, non indiqué).
- Les fiches en liste, groupées sous des titres de biome.

---

## 4. La fiche (une par espèce, plante, paysage, personnage)

De haut en bas :

1. **En-tête** : code (DM Mono), nom français, nom latin en italique, étiquette de statut, biome. Si la fiche a un `ecart_planche`, une ligne d'alerte orange « Écart planche / Bestiaire » qui déplie le texte ; si elle a un `voir_aussi`, un lien vers l'autre fiche.
2. **Repères** (repliables, ouverts par défaut sur ordinateur) : taille ; à dessiner ; vie ; jumeau terrestre. Pour les plantes : forme et taille, couleurs, ce qui l'explique. Pour les personnages : silhouette, matières, trois traits, invariants. Ces textes sont en français, tels que dans les documents.
3. **Vue** (boutons radio) : « Planche » (vue de référence trois-quarts sur fond gris clair, avec la silhouette de Seed pour l'échelle, comme dans les Planches) / « En situation » (dans son biome, sous la lumière de ce biome) / « Libre » (le corps du prompt seul). La vue change la phrase d'ouverture du corps du prompt ; elle ne touche pas au sujet.
4. **Prompt** (anglais, zone de texte modifiable) : le corps du prompt (`prompt_corps`) et sa lumière (`prompt_lumiere`). Une modification est gardée localement, marquée « modifié », avec un bouton « Rétablir ».
5. **Aperçu du prompt complet**, en une ligne qui se replie, avec les trois parties distinguées par la couleur du texte : préfixe global, sujet, paramètres globaux.
6. **Bouton « Copier »**, bien visible, qui copie le prompt complet. Retour : le bouton affiche « Copié » deux secondes. Un second bouton plus discret : « Copier sans paramètres ».

Fiches sans prompt : zone vide marquée « à rédiger », avec un bouton « Brouillon depuis la fiche » qui assemble un premier jet à partir des champs (voir section 6) ; le brouillon reste marqué « proposé ».

### Composition du prompt copié

```
{phrase de style}, {lumière}. {ouverture de la vue} {corps} {paramètres globaux}
```
Exemple, avec la barre `--ar 16:9 --hd --sref 15684 --v 8.2 --no text, watermark` :
```
painterly science-fiction concept art, realistic proportions, soft volumetric light from a warm orange star. Creature sheet, side and three-quarter views on a neutral light grey background: a massive … --ar 16:9 --hd --sref 15684 --v 8.2 --no text, watermark
```
Le champ `prompt_en` garde le prompt d'origine complet, tel qu'écrit dans les Planches ; un réglage « Prompt d'origine tel quel » permet de copier celui-là, suivi des seuls paramètres.

---

## 5. L'onglet Paysages

Un paysage par biome : les 10 du trajet dans l'ordre du voyage, puis les 8 hors trajet.

Repères de la fiche : les sections de la fiche de biome (leurs titres varient : « Où et pourquoi », « Le milieu », « Climat, lumière et couleurs »…), dominante / accents / ce qui bouge (`palette-flore.json`, biomes du trajet), les espèces du biome (liens vers leurs fiches du Bestiaire et de la Flore).

Variantes de moment (boutons) qui changent la lumière du prompt, d'après `docs/bible/33-lumiere-et-couleurs.md` :
- **Jour** : warm 4 500 K light all day like a late Earth afternoon, pale milky turquoise-grey sky, never deep blue.
- **Crépuscule** : long deep red dusk (plus d'une heure).
- **Nuit ambrée** : amber night light from a bright orange companion star, double shadows when a moon is up.
- **Saison noire** : moonless black night where bioluminescence is the only light.
- **Sous la canopée** (jungle, forêts) : magenta light under a purple canopy, green understory almost black except in clearings.

Cadrage : plan large d'établissement, avec Seed (1,60 m) ou le Rob fusionné en silhouette minuscule pour l'échelle quand le biome est sur le trajet.

---

## 6. Prompts manquants

À la date du brief : les 11 personnages et machines ont un prompt ; au Bestiaire 9 lignes sur 66 (dont TR-05, qui reprend celui de FL-TR-01) ; à la Flore 5 sur 42. Il manque 57 lignes du Bestiaire (TR-F reprendra le prompt du Titan volant), 37 plantes, 7 Titans et les 18 paysages.

Quatre prompts existants (JP-01, HP-01, LS-01, FB-03) suivent la planche de dessin, qui ne décrit pas l'animal comme le Bestiaire (champ `ecart_planche`). L'outil affiche l'écart sur la fiche ; la correction se fait par QCM avec Cal (garder la planche / aligner sur le Bestiaire).

Règles pour rédiger (celles des Planches de dessin, document au statut proposé, appliquées aux 24 prompts existants) :
- en anglais ; formes, matières, couleurs, lumière ; **aucun nom d'artiste, de studio, de film, de personnage, de marque** ;
- partir du champ « À dessiner » (animaux), « Forme et taille » + « Couleurs » (plantes), les sections de la fiche de biome (« Où et pourquoi » ou « Le milieu ») + la palette quand elle existe (paysages ; pour les hors trajet, tirer les couleurs du texte de la fiche) ; garder les tailles en mètres ou centimètres ; ajouter l'échelle (silhouette de Seed, 1,60 m) pour les planches ;
- tenir les règles du monde : 1,13 g (grands animaux trapus, pattes en colonne), air dense (grands volants plausibles), pourpre en haut / vert dessous, couleurs de structure chez les animaux, bioluminescence en saison noire ;
- un prompt se réécrit en entier quand on le corrige.

Procédure : rédiger par lots (un biome à la fois), les marquer « proposé » dans les données, et faire valider par Cal avec un QCM en page web (une ligne par prompt : garder / corriger + champ libre), jamais en lui demandant de relire du Markdown.

---

## 7. Critères d'acceptation

- Taper `--16:9 --hd --sref 15684` dans la barre : chaque bouton Copier de chaque onglet copie un prompt qui finit par `--ar 16:9 --hd --sref 15684` (plus la version et le négatif si réglés).
- Changer la phrase de style une fois change tous les prompts.
- Recharger la page : la barre, les jeux de réglages et les prompts modifiés sont toujours là ; en navigation privée, la page marche quand même.
- Le Bestiaire s'ouvre par défaut ; ses groupes suivent l'ordre du trajet.
- La recherche « buffle » trouve HP-01 ; « Megabos » aussi.
- Aucune émoticône dans le fichier (`grep` sur les plages Unicode des émoticônes).
- À 390 px de large : pas de défilement horizontal, bouton Copier atteignable au pouce.
- Test automatique conseillé : Playwright (onglets, copie via `navigator.clipboard` simulé, normalisation de la barre).
