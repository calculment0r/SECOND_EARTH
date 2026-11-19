# Site du projet (site-projet/)

Fait le 19/11/2026 à la demande de Cal : un site très visuel par catégories (logline, synopsis, personnages…), éditable en ligne sur le principe de son site NirvaLabWeb, avec le script à corriger et à commenter.

Le même jour, Cal a demandé **les mêmes fonctions d'édition que NirvaLabWeb** (« pour pouvoir fine-tuner »). Le dépôt `calculment0r/NirvaLabWeb` a été lu (README « In-page editor », GUIDE.md partie 3, HANDOFF.md, `assets/js/editor.js`, `store.js`) ; ses gestes sont portés dans `js/editeur.js`. Le code est récrit pour les blocs de ce site ; en sont repris presque tels quels : le calcul du recadrage et du zoom autour du pointeur, la mise en forme des mots sélectionnés, la signature Cloudflare R2. Rien de NirvaLabWeb n'est copié qui soit un secret : ni `deploy-key.json`, ni les empreintes de `auth.js`, ni jeton.

Publié par `tools/build_site.py` dans `_site/projet/` (adresse : `/projet/`). Thème : le kit étude (`presentation/kit/`), aucune couleur écrite hors de ses jetons.

## Les fichiers

| Fichier | Rôle |
|---|---|
| `index.html`, `script.html`, `admin.html` | Gabarits. La construction y pose le contenu publié (`<!--PUBLIE-->`) et le script découpé (`<!--SCRIPT-->`). |
| `projet.css` | La mise en page : ouverture plein écran, bandeaux 21:9, carrousels, script, tableau de bord. |
| `js/depot.js` | Contenu publié, brouillon local (localStorage, IndexedDB pour les médias), rôles par code (PBKDF2), jeton GitHub chiffré (AES-GCM), publication en un commit (API Git de GitHub). |
| `js/commun.js` | Éléments, panneaux, connexion, barre du bas (pastille de brouillon, « Éditer la page »). |
| `js/page.js` | La page des catégories : dessin des blocs, champs, médias (dépôt, double-clic, adresse), carrousels. |
| `js/editeur.js`, `editeur.css` | L'éditeur sur la page (gestes de NirvaLabWeb) : texte riche et barre typographique, mise en page des blocs, éléments libres, ligne d'insertion, clic droit, « + Ajouter », recadrage et zoom, dupliquer / copier / coller, parallaxe, format et hauteur des carrousels. Chargé par `index.html` seulement. |
| `js/script.js` | La page du script : lecture, correction par paragraphe, commentaires en marge. |
| `js/admin.js` | Le tableau de bord : accès, brouillon, publier, Cloudflare R2, sécurité. |
| `content/site-content.json` | Le contenu des catégories. Préparé une fois par `tools/prepa_site_projet.py` ; ensuite c'est le site qui l'écrit (« Publier »). Ne pas relancer le script de préparation sans `--force`, et jamais après une publication de Cal. |
| `content/script-modifs.json` | Les corrections de Cal sur le script : `{id du paragraphe: {texte, date, auteur, historique}}`. `docs/film/01-recit-docx.md` n'est jamais modifié. |
| `content/commentaires.json` | Les fils de commentaires : `{fils: [{id, para, extrait, auteur, date, texte, regle, reponses}]}`. |
| `content/acces.json` | Les empreintes des codes (admin, invité). Jamais de code en clair. |
| `content/deploy-key.json` | Absent par défaut. Le jeton GitHub chiffré, seulement si Cal coche la case dans le tableau de bord. |
| `content/media/` | Les images publiées (WebP, bord long 2560 px). Les vidéos n'y vont pas. |

## Les gestes (mode édition, admin)

| Geste | Effet |
|---|---|
| Clic sur un texte | Édition directe ; la barre typographique s'ouvre au-dessus |
| Barre typographique | Police (Literata, Norelli, Chakra Petch, Azeret Mono), taille en px (− / +), ↺ ; couleurs du kit (encre, encre douce, pâle, corail, ambre, bleu d'encre, « sans ») sur les seuls mots sélectionnés. Police et taille : sur la sélection, ou sur le champ entier sans sélection |
| Survol d'un bloc | Poignée en haut à droite : ▲ ▼ (ordre), ✥ (déplacer ; aimant au retour à zéro, Alt pour le couper), A− / A+ (échelle), ↺ (mise en page d'origine), ⧉ (dupliquer), ⇅ (parallaxe, textes et citations), ✕ (retirer) |
| Poignées de bord et de coin | Bord droit : largeur (en % de la colonne) ; bord bas : hauteur (celle du cadre pour un bandeau image) ; coin : les deux |
| Survol entre deux blocs | Ligne ambre « + insérer » ; clic : la liste des blocs à insérer là |
| Clic droit dans un bloc | Un texte ou une image posés à l'endroit du clic (élément libre : ✥, poignées, ⧉, ⇅, ✕) ; insérer un bloc au-dessus ou dessous ; coller. Clic droit entre les blocs : insérer à cet endroit. Maj + clic droit : le menu du navigateur |
| « + Ajouter » (barre du bas) | Insère un bloc sous le bloc choisi, sinon à la fin de la catégorie à l'écran |
| Glisser dans une image ou une vidéo | Recadrer |
| Alt + molette sur une image ou une vidéo | Zoom lent autour du pointeur (jamais sous 1 : le cadre reste couvert) ; la molette seule fait défiler la page |
| Double-clic sur un cadre | Remplacer le fichier (sur le texte « ici : … » d'un cadre vide, le double-clic édite ce texte) |
| Glisser-déposer un fichier | Remplacer ; image ou vidéo détectée seule |
| ⧉, Ctrl+D, Ctrl+C / Ctrl+V | Dupliquer le bloc ou l'élément choisi (un clic sur son fond le choisit) ; Ctrl+C / Ctrl+V dans un texte restent ceux du texte |
| Suppr | Retire l'élément libre choisi |
| Vignette de carrousel | Bord droit : le format, partagé par toutes ; bord bas : la hauteur ; × : retirer ; tuile pointillée : des images (plusieurs à la fois, ou déposées) ou une tuile vide ; les boutons 21:9 / 16:9 / 4:5 reprennent un format fixe |
| Échap | Ferme le menu, quitte le texte, désélectionne |

Ce que l'éditeur écrit dans un bloc (tout est facultatif) : `mise` {x, y, w, h, s}, `para`, `libres` [{id, genre, x %, y px, w %, h px, texte ou media}], `riche` {champ: HTML limité à des `<span>` de police, taille et couleur du kit}, `typo` {champ: {f, s}} ; dans un média `zoom` ; dans un carrousel `ratio` et `hauteur`. Le texte brut de chaque champ reste à jour à côté du HTML.

## Cloudflare R2 (préparé, non branché)

Le chemin de NirvaLabWeb : réglages du bucket (point d'accès S3, bucket, adresse publique) dans le navigateur, paire de clés R2 dans le même coffre chiffré que le jeton GitHub (format `{gh, r2}` ; l'ancien format, le jeton seul, reste lu). À la publication, si tout est réglé, une vidéo déposée est envoyée sur R2 (PUT signé AWS V4, charge non signée) et son adresse publique remplace l'adresse locale ; sinon elle reste dans le brouillon. La signature est vérifiée contre un calcul de référence indépendant ; elle n'a jamais parlé à un vrai bucket (aucun compte, aucune clé au 19/11/2026). Il faudra une règle CORS du bucket qui accepte le PUT depuis l'adresse du site.

## Règles

- Claude ne change pas un mot du script (règle 8 du brief) : l'outil sert à Cal. Une correction publiée vit dans `script-modifs.json`, avec l'ancien texte dans `historique`.
- L'identité d'un paragraphe = sa partie + une empreinte de son texte d'origine (`script_paragraphes` dans `build_site.py`). Si le docx est réexporté et qu'un paragraphe change, sa correction et ses commentaires deviennent orphelins (les commentaires s'affichent en fin de page).
- Types de blocs : `ouverture`, `texte`, `media`, `carrousel`, `chiffres`, `citation`, `liens`. Statut d'un bloc : `proposé`, `validé`, `manque` ou vide.
- Aucun secret dans le dépôt ni dans un message : le code admin est choisi par Cal dans le tableau de bord, le jeton GitHub y est collé par lui seul.
- La publication écrit sur la branche par défaut du dépôt (celle que Pages publie), sauf si une branche est saisie dans le tableau de bord.

## Ce qui reste faible

- Jamais publié pour de vrai : la publication est testée à blanc seulement (pas de jeton dans la session). Le premier « Publier » de Cal est le vrai test.
- Un invité ne peut pas publier ses commentaires : il les copie, Cal les importe.
- Deux admins qui publient en même temps : le dernier gagne (pas de fusion).
- Les vidéos : rien n'est branché côté Cloudflare ; le lien Cloudflare Stream est transformé en lecteur intégré sans avoir été essayé avec un vrai compte.
- Pas d'annulation (Ctrl+Z ne défait que la frappe en cours) ; « Abandonner le brouillon » revient à la version publiée.
- Mise en forme limitée à la police, la taille et la couleur des mots (pas de gras ni de lien dans un paragraphe).
- Ce qui n'est pas porté de NirvaLabWeb : la grille magnétique 12 colonnes (seul un aimant simple existe), les rôles typographiques, le voile de lisibilité, l'aperçu par appareil, les effets au scroll autres que la parallaxe, les logos posés sur une image, le diaporama, la piste musicale, le défilement automatique des carrousels, le masquage réversible.
- ✥ déplace un bloc entier (ou un élément libre), pas un titre seul à l'intérieur d'un bloc.
- Un élément libre peut déborder de son bloc (rien ne l'en empêche) ; la hauteur du bloc ne le suit pas.
- Testé à 2000 × 1125 dans Chromium seulement (pas sur téléphone, pas dans Safari).
