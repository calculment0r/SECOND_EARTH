# Axe 3 · LA SALLE

À lire après le brief général. Cet axe est l'une des trois propositions de l'étape 1 (trois écrans fixes).

## L'idée en une phrase

Le site est un lieu qu'on visite : la planète en est le centre, on s'en approche, on y entre, et chaque page est une salle où des objets en 3D se manipulent.

## Ce qu'on ressent

On est chef de mission, comme dans la salle immersive. On explore à son rythme, on touche, on tourne les choses. C'est l'axe le plus proche de la maquette CONTINUUM du site NirvaLab (`https://calculment0r.github.io/NirvaLabWeb/work/continuum/`) : la planète en points, la frise du temps, la caméra qui cadre toute seule chaque temps fort, les étiquettes fines posées sur le relief. Ici, cette mécanique devient le site entier.

## Mise en page

- Une scène en profondeur derrière la page : la planète, puis les lieux, puis les objets. L'interface est une couche fine et nette posée devant.
- Les contenus sont des panneaux légers qui s'ouvrent près de l'objet concerné : une étape du voyage, un animal, un vaisseau.
- Les panoramiques sont des fenêtres sur le lieu : courbés autour du visiteur, ou ouverts en grand quand on entre dans une étape.
- Toujours un chemin simple pour qui veut seulement lire : un sommaire clair, et une version à plat de chaque page.

## Typographie et couleurs

- Une police sans empattement, contemporaine, très lisible en petit ; des chiffres soignés.
- Fond sombre profond, mais pas noir : un bleu-nuit ou un vert très sombre tiré de la planète. Deux accents : l'orange de l'étoile et le pourpre de la végétation.
- Des panneaux à peine teintés, des traits fins, des coins doux. Pas de décor de tableau de bord.
- Point de départ possible dans le dépôt : le thème « Verdant » (`site/assets/site.css`).

## Mouvement

Tout a un poids et une distance.
- On passe d'une page à l'autre par un déplacement : on recule vers la planète, on plonge vers une étape, on s'approche d'un objet.
- La planète tourne avec de l'inertie ; les objets répondent au geste avec un léger retard, puis se posent.
- Les panneaux s'ouvrent depuis l'objet auquel ils appartiennent.
- Micro-animations sur tout ce qui se touche : un point qui respire, un trait qui se tend, un chiffre qui s'ajuste.

## L'interaction signature

**La planète comme sommaire.** Le visiteur fait tourner Korê ; le trajet de Seed s'y dessine en douze étapes. Un clic sur une étape : on descend vers le sol, le panoramique du lieu s'ouvre autour de soi, avec ses animaux à faire tourner en 3D.

## Les outils de données, dans cet axe

Ils sont dans l'espace et se manipulent : on fait glisser un curseur pour passer de la Terre à Korê et la scène change (la longueur du jour, la hauteur d'un saut, la marée qui monte) ; les orbites et les deux lunes tournent en vrai ; l'échelle de tailles aligne les objets 3D côte à côte.

## Les objets 3D

Ils sont le cœur de cet axe : Seed, Rob1, Rob2, Rob3, les animaux, MOTHER, PERSEPHORA, la capsule. Chacun a sa place dans la scène, se saisit, se tourne, se compare aux autres.

## Les trois écrans de l'étape 1

- **Accueil** : la planète en grand, le titre devant, le début du trajet visible, une vidéo panoramique qui s'ouvre en bandeau.
- **Le voyage** : la planète tournée sur une étape, le panneau de l'étape ouvert, le panoramique du lieu derrière.
- **La fiche** : l'objet 3D au centre, le curseur Terre / Korê, l'échelle de tailles avec les autres objets.

## À éviter

Le jeu vidéo, le tableau de bord de vaisseau, la 3D qui ralentit tout, le visiteur perdu sans savoir où cliquer, le contenu inaccessible sans la 3D.
