# Grille d'inventaire Second Earth (la même pour tous)

Tu regardes des médias du projet Second Earth (film de science-fiction, planète Korê) et tu remplis une fiche par fichier.
Tout se fait en local : aucun envoi vers un service extérieur, aucune génération. Ne modifie rien dans `C:\SECOND EARTH\VISUAL` ni dans `C:\SECOND EARTH\repo`.

## Comment regarder
Ta liste (JSON) donne pour chaque fichier : `id`, `fichier`, mesures, et `_lecture` = les planches à lire avec l'outil Read (toutes, sans en sauter).
- Vidéo : chaque planche montre 8 images, une toutes les 2 secondes, avec le minutage incrusté en jaune. Les images marquées « apres coupe » sont prises juste après un changement de plan détecté automatiquement. `coupes_detectees_s` donne ces changements à la seconde près : sers-t'en pour le minutage des plans, mais vérifie à l'œil (un mouvement rapide peut être pris pour une coupe, un fondu peut être manqué).
- Image : la planche montre l'image entière en haut, puis sa moitié gauche et sa moitié droite agrandies.
- En cas de doute sur un passage, tu peux extraire d'autres images avec ffmpeg (par exemple `ffmpeg -ss 6 -t 2 -i "<_path>" -vf "fps=4,scale=800:-2" C:\SECOND EARTH\_travail_inventaire\extra\<id>_%02d.jpg`) et les lire. Fais-le quand un défaut est possible (taille de Rob1, visage, mains, objet qui apparaît).
- Limite à garder en tête : tu juges sur des images fixes. Un mouvement cassé entre deux images peut t'échapper. Si tu n'as pas vérifié, écris-le dans `incertitudes`.

## Qui est qui
- Seed : adolescente, cheveux blancs courts, tenue claire, bas jaune.
- Rob1 : petit robot humanoïde sombre, visière avec deux yeux bleus lumineux. Il doit faire environ 75 cm : le haut du casque juste sous la hanche de Seed. S'il est plus grand ou change de taille d'un plan à l'autre, c'est un défaut à noter.
- grand robot : grand robot bipède (joue Rob2).
- XENOPOD : la capsule qui a porté l'embryon de Seed.
- PERSEPHORA : le vaisseau parti de la Terre. D'après les noms de fichiers, le vaisseau à grande voile dorée ronde semble être PERSEPHORA, et la station faite de modules hexagonaux blancs et dorés au-dessus de la Terre semble être MOTHER. Ce n'est écrit nulle part dans la Bible : si tu emploies ces noms, dis dans `incertitudes` que c'est déduit.
- Biomes de la Bible : lis l'en-tête et le début de chaque fichier `C:\SECOND EARTH\repo\docs\bible\1*.md`, `20-biomes-hors-trajet.md` et `33-lumiere-et-couleurs.md` avant de commencer. Valeurs permises pour `biome` (exactement) : "Jungle", "Pitons karstiques", "Cavernes", "Massifs et glaciers", "Forêt bioluminescente", "Hautes Plaines", "Forêt ancienne", "Course volcanique", "Mer d'arsenic et fosse", "Lacs salés pourpres", "Hors trajet", "Espace", "Pas clair". Ne rattache à un biome que si c'est clair ; sinon "Pas clair".

## Fiche à écrire (JSON, clés exactes)
Pour une VIDÉO :
{
 "id": "...",
 "description": "ce qu'on voit, une phrase simple",
 "plans": "un" ou "plusieurs",
 "plans_detail": [{"debut_s": 0, "fin_s": 5.0, "description": "..."}],   // toujours rempli, même pour un seul plan
 "a_l_ecran": [...],   // parmi : "Seed","Rob1","grand robot","XENOPOD","PERSEPHORA","MOTHER","animal","plante","paysage seul"
 "lieu": "le lieu en mots simples",
 "biome": "...",
 "couleurs": ["rouge", "blanc", ...],   // 2 à 4 couleurs dominantes, mots simples
 "etat": "bon" ou "bon en partie" ou "raté",
 "etat_bon_de_s": null, "etat_bon_a_s": null,   // remplis si "bon en partie" : le passage utilisable
 "etat_raison": "pourquoi, en faits : Rob1 trop grand à 8 s, visage déformé, texte parasite, objet en trop, mouvement cassé... ou 'aucun défaut vu sur les images extraites'",
 "meilleurs_moments": [{"t_s": 4.0, "pourquoi": "..."}],   // 1 à 3 instants pour en tirer une image fixe panoramique
 "usages": [...],   // parmi : "grande vidéo d'ouverture","fond de section","carrousel","vignette"
 "incertitudes": "ce qui n'est pas clair ou pas vérifié ; chaîne vide si rien"
}
Pour une IMAGE :
{
 "id": "...", "description": "...", "a_l_ecran": [...], "lieu": "...", "biome": "...", "couleurs": [...],
 "etat": "bon" ou "bon en partie" ou "raté",
 "etat_raison": "...",   // regarde surtout les bords : ces images ont été élargies (« étendre »), cherche raccords visibles, répétitions, flou, déformations, texte parasite
 "usages": [...],   // parmi : "bandeau très large","carrousel","fiche"
 "incertitudes": "..."
}

## Règles d'écriture
- Français, phrases courtes, mots simples, pas de jargon de cinéma ou d'informatique.
- Aucun émoticône.
- Aucun jugement de valeur : pas de « beau », « superbe », « réussi », « impressionnant ». Seulement des faits visibles.
- Ne rien inventer. Si un plan n'est pas clair, l'écrire.
- "paysage seul" seulement s'il n'y a ni personnage, ni animal, ni vaisseau.

## Livraison
Écris un tableau JSON valide (UTF-8), une fiche par fichier de ta liste, dans le fichier de sortie qu'on t'indique. Écris-le au fur et à mesure (par exemple toutes les 8 fiches) pour ne rien perdre. À la fin, vérifie avec python que le JSON se charge et que chaque `id` de ta liste a sa fiche. Ta réponse finale : le nombre de fiches, et en trois lignes au plus ce qui t'a posé problème.
