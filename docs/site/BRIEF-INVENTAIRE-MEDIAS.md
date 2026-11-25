# Brief · inventaire des images et des vidéos de Second Earth (session locale, sur l'ordinateur de Cal)

Pour une session Claude lancée sur l'ordinateur de Cal, là où sont les fichiers. La session cloud ne peut pas les voir.
Lire d'abord `CLAUDE.md` (règles 2, 3, 5, 16 : français, pas d'émoticône, pas de jugement de valeur dans les réponses à Cal, pages HTML pour lui, mots simples).

## But

Une liste complète de tout le matériel image et vidéo, pour construire le site de Second Earth. Cal doit pouvoir la parcourir d'un coup d'œil, et Claude Design doit savoir ce qui est utilisable.

## Où chercher

Demander à Cal les chemins s'ils ne sont pas donnés au lancement. Il y a :
- trois dossiers de vidéos en 21:9 : **faune / flore**, **Seed**, **SPACE** (PERSEPHORA et MOTHER) ;
- des images panoramiques (Midjourney, très larges), et d'autres à venir ; Cal extraira aussi des panoramiques des vidéos ;
- les 100 images du dossier « seedance input » ;
- les 5 planches de personnages (Seed, Rob1, grand robot, planche d'échelle, XENOPOD-01).

Déjà connu côté cloud : 12 images dans le dépôt NirvaLabWeb (`assets/images/projects/second-earth/`, `assets/uploads/second-earth/`) et 3 vidéos sur le stockage Cloudflare de Cal (`VIDEO_HERO/Second_Earth.mp4` et deux fichiers `assets/uploads/second-earth/b-*.mp4`).

## Ce qu'il faut relever

Pour **chaque vidéo** (avec `ffprobe`) : dossier, nom du fichier, durée, largeur × hauteur, format (21:9, 16:9…), images par seconde, poids, son ou pas.
Puis la regarder (extraire une image toutes les 2 secondes avec `ffmpeg`, les lire) et noter :
- ce qu'on voit, en une phrase simple ;
- **un seul plan ou plusieurs plans** (multi-shot) ; si plusieurs : le minutage de chaque plan ;
- qui est à l'écran : Seed, Rob1, grand robot, XENOPOD, PERSEPHORA, MOTHER, animal, plante, paysage seul ;
- le lieu, rattaché à un biome de la Bible si c'est clair (`docs/bible/`) ;
- les couleurs dominantes ;
- **l'état : bon / bon en partie (dire de quelle seconde à quelle seconde) / raté** et pourquoi (Rob1 qui change de taille, visage déformé, mouvement cassé, texte parasite, objet en trop…) ;
- les meilleurs moments pour en tirer une image fixe panoramique (minutage) ;
- usage possible sur le site : grande vidéo d'ouverture, fond de section, carrousel, vignette.

Pour **chaque image** : dossier, nom, largeur × hauteur, format, poids, ce qu'on voit, biome, couleurs, état, usage possible (bandeau très large, carrousel, fiche).

Ne rien inventer : si un plan n'est pas clair, l'écrire.

## Ce qu'il faut livrer

1. `media/inventaire/inventaire.json` : une entrée par fichier, avec tous les champs ci-dessus.
2. `media/inventaire/vignettes/` : une vignette légère par fichier (JPEG, 640 px de large, moins de 80 Ko) ; pour une vidéo, une planche de 6 à 8 images.
3. `media/inventaire/index.html` : la page pour Cal. Vignettes, filtres (dossier, état, personnage, biome, un plan / plusieurs plans), compteur par état, mots simples. Thème du site (voir `site/assets/site.css`).
4. Un résumé en tête de page : combien de vidéos et d'images, combien de bonnes, ce qui manque pour le site (par exemple : aucune bonne vidéo de tel moment de l'histoire).

**Ne pas mettre les vidéos ni les grandes images dans git** (trop lourd) : seulement le JSON, les vignettes et la page. Les vidéos iront sur Cloudflare.
Pousser sur la branche `claude/beautiful-goldberg-x0to5u` du dépôt `calculment0r/SECOND_EARTH`, puis donner le lien à Cal. La session cloud ajoutera la page au site et s'en servira pour le brief de Claude Design.

## Organisation

Trois sous-agents en parallèle, un par dossier de vidéos, plus un pour les images. Même grille pour tous. Un seul fichier JSON à la fin.
Aucune génération payante, aucun envoi vers un service extérieur.
