# Brief pour Claude Design · le site de Second Earth

## 1. Le projet

**Second Earth** : un film de 25 minutes (puis 55), une salle immersive et une exposition, pour le Science Centre Singapore. Auteur et réalisateur : Cal (NIRVALAB). Productrice : Nina Albani (aïo Creative Group, Singapour).

L'histoire en quatre phrases. En 2098, un vaisseau-semeur dépose une capsule sur une planète lointaine. Une adolescente y naît, Seed, cheveux blancs, presque muette, avec un petit robot, Rob1. Ils traversent la planète pour retrouver trois autres robots et lui donnent un nom : Korê. À la fin, Rob1 ment à la Terre pour protéger ce monde.

Dernière phrase du film : « This is a fictional planet. Earth is the only world we know. Take care of it. »

## 2. À quoi sert le site

Présenter le projet à des partenaires : le Science Centre, des financeurs, des studios, des diffuseurs. Il doit donner envie en dix secondes et rester clair pour quelqu'un qui ne connaît rien au projet.
Adresse : un nom de domaine acheté par Cal (à préciser par lui).
Langues : français et anglais (public de Singapour).

## 3. Ce que Cal veut

- Un site **très beau**, où l'image est reine : grandes vidéos en 21:9, images panoramiques très larges, carrousels.
- Il hésite entre deux directions et veut les voir côte à côte :
  - **Piste A, très graphique** : typographie forte, grilles visibles, étiquettes et chiffres de mission, données de la planète mises en scène ;
  - **Piste B, sobre** : presque rien autour des images, beaucoup de vide, texte discret, la typographie s'efface.
- Il ne sait pas encore s'il garde les directions artistiques déjà faites. Les deux existent dans le dépôt et peuvent servir de point de départ ou être abandonnées :
  - le thème sombre « Verdant » du site actuel (fond presque noir, corail et vert profond ; `site/assets/site.css`, `theme/showrunner-ui-kit/`) ;
  - le « kit étude » de la présentation (clair, Literata pour le texte, Norelli en capitales pour les titres ; `presentation/kit/`).
- **Une planète interactive** au cœur du site. Elle existe déjà : le globe 3D de la page CONTINUUM du site NirvaLab (un seul fichier, `assets/js/vendor/continuum-globe.js` du dépôt NirvaLabWeb, avec three.js ; note de reprise : `GLOBE-ENGINE.md`). À prévoir dans la maquette comme un grand bloc plein écran : la planète Korê, ses quatre continents, le trajet de Seed en douze étapes, un clic sur une étape ouvre son paysage et ses animaux. La carte en deux échelles existe aussi (`carte/carte-kore.html`).

## 4. Le matériel

- Vidéos 21:9 en trois familles : la faune et la flore ; Seed et Rob1 ; l'espace (le vaisseau PERSEPHORA et MOTHER). Certaines ont plusieurs plans, certaines sont ratées : n'utiliser que celles marquées « bon » dans l'inventaire.
- Images panoramiques (rapports de 2:1 à 3,3:1), d'autres à venir, dont des images tirées des vidéos.
- L'inventaire complet avec vignettes : `media/inventaire/` (en cours ; s'il n'est pas encore là, travailler avec des emplacements au bon format).
- Les couleurs de la planète : étoile orange, végétation pourpre en haut et verte dessous, lumière magenta sous les arbres, déserts ocre, mer gris-vert, lacs roses, nuits lumineuses bleues. Les images actuelles sont dominées par le rouge corail, le blanc et les brumes pâles.
- Les vidéos seront servies depuis Cloudflare, pas depuis le dépôt.

## 5. Le contenu

Tout est écrit dans le dépôt `calculment0r/SECOND_EARTH` ; ne rien inventer. Le site éditable actuel a déjà dix-sept parties (`site-projet/`, contenu dans `site-projet/content/site-content.json`) :
accueil, logline, pitch, synopsis, note d'intention, univers, personnages, voyage, bestiaire et flore, science, film, script, salle immersive, exposition, équipe, calendrier et financement, contact.
La logline, le pitch, les synopsis et la note d'intention sont des propositions à valider par Cal. L'équipe et le contact sont vides.
Sources : `CLAUDE.md` (résumé et chiffres de la planète), `docs/bible/`, `docs/film/00-recit-v2.md`, `data/bestiaire.json` (66 animaux), `data/flore.json` (42 plantes), `data/titans.json`.

## 6. Ce qu'on attend de toi

1. **Deux maquettes de la page d'accueil**, piste A et piste B, sur grand écran, avec les mêmes images, pour comparer.
2. Pour la piste retenue : la page d'accueil complète, une page « Le voyage » avec la planète interactive, une page « Bestiaire et flore », une page « Le film », une page courte « Contact et équipe ».
3. Le système : couleurs, deux ou trois polices, tailles, espacements, boutons, étiquettes, la façon de poser une vidéo 21:9 et un panoramique (plein écran, bandeau, carrousel), les mouvements (défilement, apparitions, lecture des vidéos).
4. Une version téléphone simple de la page d'accueil.

## 7. Contraintes

- Le site est en HTML, CSS et JavaScript simples, sans étape de fabrication, hébergé en pages statiques.
- Cal doit pouvoir modifier lui-même textes et images en ligne, comme sur son site NirvaLab : penser la page comme une pile de bandes horizontales, chacune avec ses textes et ses images (voir `site-projet/LIRE.md` et, dans NirvaLabWeb, `DESIGN-BRIEF.md`).
- Vidéos sans son au départ, lecture automatique, image fixe de remplacement, poids maîtrisé.
- Aucune émoticône. Ne reproduire aucun film, aucune marque, aucun personnage existant. Pas de vocabulaire technique dans les textes visibles.
- Le texte doit rester lisible sur les images : contraste vérifié.

## 8. Questions ouvertes pour Cal

Le nom de domaine ; la piste (A, B ou un mélange) ; garder ou non Verdant ou le kit étude ; français d'abord ou anglais d'abord ; ce qui reste privé (script, budget).
