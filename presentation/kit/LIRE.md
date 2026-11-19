# Kit étude

Un kit d'interface statique (HTML, CSS, JS, sans bundler), sombre et clair, dans l'écriture du livre « L'étude ».
Il est fait pour servir ailleurs : rien n'y parle de SOLARIS, et il ne dépend d'aucun autre fichier du dépôt que les polices.

Fait le 18 novembre 2026, à la demande de Cal. Il suit `conception/CHARTE-INTERFACE.md` (les poignées visibles de 16 px, le clavier qui fait le même geste que la main, la molette jamais volée, rien qui bouge au chargement, les jetons seulement) et `conception/LA-METHODE.md` (4.10 : la typographie fait l'image, la matière dit l'état, au repos un seul fil se voit).

## Les fichiers

| Fichier | Ce que c'est |
|---|---|
| `kit-etude.css` | Le thème entier : les polices, les jetons (sombre et clair), tous les composants. |
| `kit-etude.js` | Les comportements : un seul objet, `window.KitEtude`. Tout se monte seul au chargement. |
| `index.html` | La vitrine : quinze chapitres, chaque composant avec ses états, un sélecteur sombre / clair. |
| `vitrine.css`, `vitrine.js` | Ce qui ne sert qu'à la vitrine (la mise en page des exemples, leurs données). À ne pas emporter. |
| `presentation.html` | Un gabarit de présentation plein écran, prêt à recopier. |

## S'en servir pour un autre projet

1. Recopier `kit-etude.css`, `kit-etude.js` et le dossier des polices (`public/fonts/` : Literata, Norelli, Chakra Petch, Azeret Mono, avec leurs licences). La feuille les cherche dans `../fonts/` : garder cette place, ou changer les huit lignes `@font-face` en tête de la feuille.
2. Dans la page : `<link rel="stylesheet" href="kit-etude.css">` et `<script src="kit-etude.js" defer></script>`. Rien d'autre.
3. Le thème : sombre par défaut ; clair avec `<html data-theme="light">`. Deux boutons `data-t="sombre"` et `data-t="clair"` dans un `.ke-bascule` font la bascule et la gardent en mémoire. Un morceau de page peut forcer son thème : `<div class="ke-theme" data-theme="light">`.
4. Pour une présentation : recopier `presentation.html`, remplacer les textes. Une `section.ke-d` par diapositive. Flèches, Espace, Début, Fin, F pour le plein écran. L'impression donne une page par diapositive.

Changer de couleurs, c'est changer les deux blocs de jetons en tête de `kit-etude.css`, et rien d'autre : aucun composant n'écrit une couleur.

## Les règles de l'écriture

- **Deux corps très éloignés.** Un mot immense (`--c-immense`, `--c-titre`), de petites phrases pâles (`.ke-petit`). Rien entre 32 et 64 px.
- **Aucun cadre, aucune bordure.** Les filets sont des `box-shadow`. Les angles sont droits (seuls les prises, les ports et les points sont ronds).
- **Un seul accent.** L'orange (`--or`) : ce qu'on tient, là où l'on est. L'ambre en pointillé (`--amb`) : ce qui est déduit, ou en attente. L'italique pâle : ce qui manque. Classes : `.ke-tenu`, `.ke-deduit`, `.ke-manque`.
- **Un seul bouton plein par écran** (`.ke-btn.plein`). Les autres sont des mots soulignés.
- **Rien ne bouge au chargement.** Le mouvement vient de la main : un geste, ou le défilement. `prefers-reduced-motion` coupe transitions et animations.
- **La molette n'est jamais volée.** Un zoom demande Ctrl + molette (ou le pincement). La molette seule fait défiler la page. Un potard n'écoute la molette que s'il a le focus.
- **Le survol et le clavier disent la même chose.** Tout ce qui se révèle au survol se révèle au focus.

## Les composants

Chaque composant réglable émet `ke:change` (avec `detail.valeur`) sur son élément.

| Chapitre | Composant | Comment |
|---|---|---|
| 01 Les lettres | l'échelle, les quatre voix, la provenance | `h1`, `h2`, `.ke-chapo`, `.ke-dit`, `.ke-texte`, `.ke-nom`, `.ke-petit`, `.ke-machine` ; le mot immense : `data-mot="…"` |
| 02 Les couleurs | les jetons | les deux blocs en tête de la feuille |
| 03 Les boutons | plein, mot souligné, petit, discret | `.ke-btn` ; états : `:hover`, `:focus-visible`, `aria-pressed`, `disabled`, `aria-busy` |
| 04 Les champs | champ, texte long, liste de choix, liste, case, rond, interrupteur | `.ke-champ` (variantes `.a-revoir`, `.deduit`), `.ke-choix`, `.ke-liste`, `.ke-case` (`.rond`), `.ke-inter` |
| 05 Les curseurs | simple, à deux poignées, à crans, vertical | `.ke-curseur` avec `data-min`, `data-max`, `data-pas`, `data-valeur`, `data-valeur2`, `data-crans`, `data-vertical`, `data-unite` ; dans un `.ke-reglage`, la valeur s'écrit dans `<output>` |
| 06 Les potards | grand, normal, petit ; crans ; valeur au centre ; balance | `.ke-potard` (`.grand`, `.petit`), `data-crans="7"`, `data-centre` |
| 07 La console | tranche, fader, vu-mètre debout ou couché | `.ke-tranche`, `.ke-fader` (`data-reperes`), `.ke-vu` puis `KitEtude.vu(n).niveau([g, d])` |
| 08 Naviguer | onglets, rail nommé, rail en traits, menu, infobulle | `.ke-onglets`, `.ke-rail` (`.traits`), `.ke-menu`, `data-bulle="…"` |
| 09 Dire | note (quatre natures), avis avec retour, tableau, cartes, chiffres | `.ke-note` (`.tenu`, `.deduit`, `.manque`), `.ke-avis`, `.ke-table`, `.ke-carte`, `.ke-chiffres` |
| 10 Le temps | frise, journal, lecture, forme d'onde, tête de lecture, montage | `.ke-frise`, `.ke-journal`, `.ke-lecture` + `.ke-onde` ou `.ke-defile`, `KitEtude.montage(n, {…})` |
| 11 Le schéma | nœuds, ports, câbles ; déplacer, brancher, zoomer | `KitEtude.nodal(n, { noeuds, cables })` |
| 12 Le canevas | infini, zoom sémantique à trois hauteurs | `KitEtude.canevas(n, { groupes })` |
| 13 Les chiffres | rangée de traits, cases, arches, barres fines, ligne | `KitEtude.traits`, `KitEtude.arches`, `.ke-barres`, `KitEtude.ligne` |
| 14 La piste | une scène qui se joue au défilement | `<div class="ke-piste" data-pas="4" data-niveaux="a\|b\|c\|d"><figure class="ke-scene">` ; la scène reçoit `--t` (0 à 1) et `--pas` ; `data-de="2"` fait arriver un élément au pas 2 ; `scene._t = function (t) {…}` pour dessiner soi-même |
| 15 Les diapositives | titre, chapitre, citation, chiffre seul, deux colonnes, image pleine | `.ke-diapo > .ke-d.titre` (ou `.chapitre`, `.citation`, `.chiffre`, `.colonnes`, `.image`) ; `.ke-presentation` pour le plein écran |

Les états montrés dans la vitrine (`.est-survol`, `.est-focus`, `.est-tenu`, `.est-actif`) ne servent qu'à figer un état pour une capture.

### Les gestes

| Composant | À la main | Au clavier |
|---|---|---|
| curseur, fader | tirer la prise ; cliquer la voie ; double-clic : valeur de départ | flèches, Page préc. / suiv., Début, Fin |
| potard | tirer vers le haut ou le bas (180 px pour toute la course ; Maj : 800 px) ; double-clic | flèches ; molette quand il a le focus |
| menu, liste de choix | clic ; clic dehors ferme | flèches, Entrée, Échap, première lettre |
| onde, tête de lecture | cliquer, tirer | Espace lit ; flèches ± 5 s (Maj : 1 s) |
| montage | tirer un bloc ; tirer dans la règle ; Ctrl + molette zoome le temps | flèches ± 1 s (Maj : 0,5 s) |
| schéma | tirer d'un port à un autre ; tirer un nœud ; tirer le fond ; Ctrl + molette | Tab ; Entrée sur un port le tient, Entrée sur un port allumé branche, Échap revient ; Suppr retire ; flèches déplacent le nœud ; + − 0 |
| canevas | tirer le fond ; Ctrl + molette (ce qu'on vise reste sous le pointeur) ; le rail | 1, 2, 3 ; + − ; flèches ; Tab sur les noms |
| présentation | clic à droite avance, à gauche recule ; le rail | flèches, Espace, Début, Fin, F |

## Ce qui a été vérifié, et comment

- Captures Playwright de chaque chapitre, en sombre et en clair, à 1600 × 900 puis 2000 × 1125, regardées une à une.
- Les gestes joués pour de vrai dans Chromium : potard tiré puis réglé aux flèches, curseur à deux poignées au clavier, fader tiré, menu et liste de choix au clavier, lecture, bloc de montage glissé et zoom du temps, câble tiré d'un port à un autre puis branché au clavier, nœud déplacé, canevas aux trois hauteurs, présentation. L'ancrage du zoom du canevas : le nom visé bouge de 2 px pour un zoom de × 1,5.
- Aucune couleur écrite hors des deux blocs de jetons (cherché dans les cinq fichiers).
- `npx vitest run tests/ux-gestes.test.mjs` et `npx tsc --noEmit` passent. Le test ne lit que `public/css/*.css` : il ne regarde donc pas ce dossier. La règle qu'il tient (pas de « X:hover .y { opacity:1 } » sans son `:focus-within`) est appliquée à la main : l'infobulle s'ouvre au survol et au focus ; le rail et le sélecteur de thème de la présentation aussi (`:focus-within`). Seul le repère gris sous le pointeur, dans l'onde, ne vient qu'au survol : c'est une information, pas un contrôle.

## Ce qui reste faible

- **La fluidité n'a pas été vue.** La machine de travail n'a pas de carte graphique : le zoom du canevas, le schéma et la scène au défilement sont à regarder sur un vrai écran.
- **Le canevas déplace des éléments un par un** (une trentaine ici). Au-delà de quelques centaines d'objets il faudra un autre moteur.
- **Le schéma est simple** : une entrée ne reçoit qu'un câble, pas de sélection multiple, pas de groupes, pas d'annulation, les câbles ne s'évitent pas. Les deux ports d'un nœud étroit peuvent se gêner.
- **La lecture ne joue aucun son** : elle fait le geste et l'affichage. La forme d'onde d'exemple est fabriquée, pas lue d'un fichier.
- **L'image pleine n'a pas d'image** : un ciel fait des jetons tient la place.
- **Le milieu de la scène au défilement** (les mots en vol) se croise un instant ; le début et la fin sont propres.
- **Les petites diapositives** de la vitrine ont des légendes de 8 px : c'est voulu (tout est proportionnel), mais illisible en vignette.
- **Pas de dialogue modal, pas de dépôt de fichier, pas de panneaux redimensionnables** : voir plus bas.
- Le clair reprend les valeurs du thème de SHOWRUNNER (contraste AA mesuré là-bas). Les encres dérivées par mélange (`--pale`, `--voile`) n'ont pas été remesurées une à une.

## Le relevé du kit SHOWRUNNER

Lu le 18 novembre 2026 dans `calculment0r/SHOWRUNNER_TOOLS` (lecture seule, rien n'y a été écrit).

**Il n'y a pas, là-bas, de page « kit UI » qui montre tout.** Ce qui en tient lieu :
- `commun/theme.html` (avec `theme-editor.js`) : l'éditeur des jetons, avec un aperçu des composants du portail (boutons, segments, champs, pastilles, rack, vignettes, moniteur, modale, dalles, tuiles, carte héro) et les contrastes mesurés. Aucun potard, fader, câble ni timeline dans cet aperçu.
- `character_factory/theme.html` : l'ancêtre, la vitrine du thème de Character Factory.
- `character_factory/legacy/hacker-uikit.html` : un vrai kit en dix-sept sections, mais d'un autre thème (cyan), que plus rien n'appelle. Un vestige.

Les composants eux-mêmes sont dans les outils. Tout ce que Cal a cité existe :

| Cité par Cal | Où, chez SHOWRUNNER | Dans ce kit |
|---|---|---|
| le schéma nodal | `musique/nodal.js` (ODIO), `ideation/canvas.js`, `ports.js`, `wires.js` ; le câble commun : `commun/wire.js` | repris : chapitre 11 |
| les canevas interactifs | `ideation/canvas.js` (zoom de 8 % à 3200 %, lasso, mini-carte, trame) | repris autrement : chapitre 12 |
| ODIO, blocs et câbles, zoom | `musique/nodal.js`, zoom sémantique dans `machines/tile/legible.js` | repris : chapitres 11 et 12 |
| les potards rotatifs | `musique/ui.js` (`knob`, `dial`), `machines/interaction/knob.js` | repris : chapitre 06 |
| les sliders, les faders | `commun/curseur.css` (le fader couché), `musique/ui.js` (`fader`) | repris : chapitres 05 et 07 |
| les vu-mètres | `musique/ui.js` (`vu`), `musique/console.js` | repris : chapitre 07 |
| les timelines | `montage/timeline.js`, `musique/timeline.js`, `commun/tete.js`, `commun/molette.js` | repris, en simple : chapitre 10 |
| la forme d'onde | `commun/onde.js` | reprise, en traits : chapitre 10 |
| les diapositives | `ideation/diapo/`, `ideation/presentation/`, `ideation/gabarits/` | reprises : chapitre 15 |

### Ce qui a été repris, et comment

- **Les jetons** : les mêmes noms et les mêmes valeurs (`--bg`, `--panel` à `--panel3`, `--ink` à `--ink3`, `--or`, `--amb`, `--line…`), sombre et clair. Un autre projet de la maison peut donc passer de l'un à l'autre.
- **Les règles dures** : aucune couleur écrite, deux thèmes par les seuls jetons, des filets jamais des bordures, un seul bouton orange par écran.
- **Le câble** : la même courbe (Bézier horizontale, poignées à la moitié de l'écart, 40 px au moins), la même zone de clic transparente de 16 px, le câble tiré qui devient plein quand il s'accroche. Ici le trait fait 1 px au lieu de 2, et il se tait au repos.
- **Le potard** : le même arc de 270°, le même geste (tirer vers le haut, 180 px pour la course, Maj pour affiner, double-clic pour revenir, flèches). Ici la valeur est au centre, en lettres, et il n'y a ni disque ni aiguille.
- **Le fader** : sauter à la valeur en cliquant la voie, glisser en relatif en prenant la prise, Maj quatre fois plus fin, Page préc. / suiv. à dix pour cent.
- **Le zoom** : ancré sous le pointeur, sur un seul calque transformé.
- **Les gestes de timeline** : tirer dans la règle déplace la tête ; le zoom du temps se fait sous le pointeur.

### Ce qui a été changé, et pourquoi

- **Les lettres.** Là-bas : Venus Rising pour l'affichage, Chakra Petch partout, des capitales mono pour les étiquettes. Ici : Literata pour presque tout, Norelli pour les noms, Chakra et le mono seulement en tout petit. C'est ce que Cal demande (« l'élégance de la page l'étude ») et ce qu'il refuse (le look techno).
- **Les couleurs de piste.** ODIO teinte chaque piste, chaque câble, chaque port (la rampe corail, les verts). Ici une seule encre et un seul orange : la couleur ne dit plus « quelle piste » mais « ce que je tiens ».
- **Le vu-mètre.** Là-bas une colonne verte qui passe à l'ambre. Ici une pile de traits d'encre, l'orange au-dessus du seuil.
- **La molette.** Là-bas, sur un canevas, la molette seule zoome. Ici il faut Ctrl : la vitrine est une page qui défile, et la charte interdit de voler la molette. Dans un outil plein écran, on pourra rendre la molette au zoom.
- **Les ports** restent à leur place sur le bord du nœud ; chez ODIO ils glissent le long du pourtour.

### Ce que SHOWRUNNER a et que ce kit n'a pas repris

| Non repris | Pourquoi |
|---|---|
| le segment (`.seg`), les pastilles (`.pill`), les étiquettes (`.tag`) | des boîtes à coins : les onglets et les mots soulignés font le même travail sans cadre |
| les dalles, les tuiles de chiffres, la carte héro, `.statcard` | c'est le tableau de bord que Cal refuse ; il reste `.ke-chiffres` et la diapositive « chiffre seul » |
| la jauge (`.meter`) | la charte : jamais de jauge ni de score ; les barres fines disent une durée, pas une note |
| la modale et son voile, le tiroir | pas faits, faute de temps : à ajouter si la présentation en a besoin |
| le dock d'assets, la fenêtre détachée, les panneaux redimensionnables (`split.js`) | de la coquille d'outil, pas de la présentation |
| la zone de dépôt de fichiers, les mentions @, le champ « Entrées » | liés aux outils de fabrication |
| le spectre (`spectre.js`), les mesures d'image (parade, vectorscope, histogramme) | de la mesure d'ingénieur ; et le spectre a besoin d'une rampe de cinq couleurs |
| le piano roll, le séquenceur de pas, le lanceur de clips, le rack d'appareils, les courbes d'égaliseur et de compresseur, les arcs peints à la main | propres à un logiciel de musique ; le kit donne les briques (potards, faders, console, montage), pas ODIO |
| les outils de montage (rasoir, rognage, fondus, sous-titres, masques) | pareil : le montage du kit ne fait que glisser des blocs |
| dans le canevas : le lasso, la mini-carte, la trame de points, les groupes, les guides d'aimant | la trame et la mini-carte font « schéma d'ingénieur » ; le reste n'a pas été fait |
| les ports qui glissent, les losanges de notes, les câbles en tirets par nature, les étiquettes sur les câbles | une seule nature de câble suffit à une présentation ; le pointillé est réservé à « déduit » |
| l'éditeur de thème et la mesure des contrastes | utile, mais c'est un outil à part |
| l'éditeur de courbe d'animation, les transitions de diapositives, les gabarits animés | une seule transition, sobre |
| les rayons paramétriques (`--r0` à `--r4`) | angles droits ici, par règle |
| le toast, tel quel | repris sous une autre forme : `.ke-avis`, avec son retour |
