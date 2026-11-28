# Prompts d'images du début du film (27-28/11/2026, session ALLY)

Pour les images clés qui manquent : incubation, séisme, réveil, gouffre. Aucun n'a été essayé par Claude.

## Ce qu'on a appris le 28/11 (Cal)

- **Les huit prompts K1 à K8** de la page `data/chantiers-2026-11-27.html` sont jugés mauvais par Cal (« de la merde ») : ils racontent une histoire (« elle vient de sortir », « tendre ») au lieu de décrire une image. Une image essayée de K1 : salle immense, deux tiers du cadre noirs, Rob1 de dos, rien à regarder.
- **La méthode qui marche** (prompt d'exemple donné par Cal, qui marche « même avec Z-Image ») : décrire l'image comme un plan de film déjà tourné, au présent, sans ordres ni mots d'ambiance :
  1. une phrase de cadre : quel film, quel sujet, sur quoi ;
  2. la chaîne de prise de vue : caméra, focale, ouverture, filtre de diffusion, étalonnage, brillances, noirs, exposition, part de chaque couleur en pourcentage, hauteur et distance de la caméra ;
  3. chaque élément **placé dans le cadre** (à gauche du centre, remplit 70 % du cadre, en bas à droite…), avec sa matière décrite en détail ;
  4. le fond flou, forme par forme, avec couleur et place ;
  5. la lumière : d'où, quelle zone est la plus claire, où sont les ombres les plus profondes ;
  6. une phrase finale qui redit le rendu.
- Son exemple cite un réalisateur et des marques de caméra et de pellicule. La règle 10 de `CLAUDE.md` les interdit dans les prompts : à lui demander s'il la lève pour Seedream.
- **Références dans Seedream** : Rob1 s'appelle `@element1` ; les autres images `@image1`, `@image2`… dans l'ordre où on les joint. **Pas de planche d'échelle quand Seed n'est pas dans l'image** (sinon Seedream ajoute Seed). Rob1 fait 1 m (round 18).
- Pour une scène dans la capsule : **décrire l'intérieur dans le texte**, ne pas joindre la planche extérieure du XENOPOD (elle ouvre l'espace en hangar).
- Quand on veut garder une image existante et y ajouter un personnage : prompt très court, sans description du décor (voir le prompt 2).

## 1. Midjourney · le caisson d'incubation seul (Cal a généré une image à partir de lui : caisson en verre, fœtus, parois rembourrées crème, à garder comme référence)

```
photorealistic and cinematic photography of a human incubation tank inside a very cramped space capsule compartment, a vertical glass cylinder about one metre tall filled with clear fluid, a tiny human fetus curled up and floating in the centre, a thin soft cord linking it to the top of the tank, fine bubbles rising, the tank wedged between curved off-white padded hull panels, bundles of thin tubes and cables pressed against the glass, a low ceiling just above it, the compartment as narrow as a closet, soft pulsing blue light from inside the tank as the only light source, deep shadows, condensation on the glass, 35 mm lens at eye level, shallow depth of field, quiet and tender mood --ar 21:9 --raw --stylize 400 --chaos 15 --hd --v 8.2 --no text, logo, people, robot
```

## 2. Seedream · Rob1 regarde le caisson (avec l'image du caisson en référence)

`@image1` = l'image du caisson ; `@element1` = Rob1.

```
Keep @image1 exactly as it is: same set, same light, same framing. Add @element1 in the foreground on the left, seen from three-quarter back, looking at the fetus in the tank.
```

Variante, ses yeux visibles :

```
Keep @image1 exactly as it is: same set, same light, same framing. Add @element1 on the right, behind the tank, his face close to the glass, looking at the fetus.
```

Si le décor change trop : monter la force de la référence, ou commencer par `Edit @image1:`.

## 3. Midjourney · la tenue d'incubation de Seed (demande de Cal : une tenue de science-fiction, une autre que sa tenue d'aventure)

```
photorealistic and cinematic photography of a slim fifteen-year-old girl with very short white buzz-cut hair and pale skin, barefoot, wearing a thin close-fitting incubation suit made of pearl-white ribbed technical fabric, soft translucent panels on the arms and legs, a row of small round metal ports along the spine and the collarbones where tubes were plugged in, still wet, sheet with 3 view of same character : front view, side view, back view on white background --chaos 15 --ar 2:1 --raw --stylize 400 --hd --v 8.2
```

## 4. Seedream · le réveil dans la capsule (méthode « description d'image »)

`@image1` = la planche de Seed ; `@image2` = la tenue d'incubation (prompt 3) ; `@element1` = Rob1. Option : l'image du caisson en `@image3`.

Scène voulue par Cal : Seed titube, Rob1 est paniqué, fumée blanche, alarmes de panique dans la capsule, on ne voit pas le XENOPOD de l'extérieur.

```
A frame of live-action footage from a big-budget science-fiction feature, showing a full-scale practical capsule interior filled with white smoke, a soaked girl and a small robot. It is shot on a large-format digital cinema camera with a vintage 50mm anamorphic prime at T2.8 through a light mist diffusion filter and finished in an amber and cyan grade. Highlights carry a gentle bloom, blacks sit lifted to a warm dark brown, and the image is slightly soft. Exposure is dim. Amber covers about 55 percent of the frame, cold cyan about 25 percent, the rest is near black. The camera sits one metre above the floor, level and close.

The girl of @image1, in the incubation suit of @image2, stands right of center and fills the frame from the top edge to two thirds down. Her body tilts fifteen degrees toward frame left, knees bent, weight falling forward. Her left hand grips a quilted wall panel at the right edge of the frame, knuckles pale. Her right hand is flat over her right ear, her head pulled into her shoulder, eyes squeezed almost shut, mouth open. Her very short white hair is flattened and wet. Clear fluid hangs in strings from her chin and elbows. The suit is soaked, clinging, darker in the folds, with small round metal ports along the collarbones.

@element1 stands in the lower left third, one metre tall, his head at the height of her ribs, seen three-quarter front. Both arms are raised, hands open toward her waist, torso leaning back. His two blue eyes are wide perfect circles, the brightest blue points in the frame. Amber reflections streak across his dark helmet.

At center, behind them and heavily blurred, an open glass tank glows cold cyan from below, its door swung to the left. It is the brightest area of the frame and turns the smoke around their outlines into a pale halo. Dense white smoke rolls along the low padded ceiling in the top third, pouring from a ruptured hose at upper left. An amber alarm beacon at upper right is a large out-of-focus oval and throws hard orange light from frame right onto her cheek, her shoulder and his helmet. A second beacon glows dull orange inside the smoke at left. The walls are off-white quilted padding, stained, hung with cable bundles, sixty centimetres from them on each side. Two centimetres of fluid cover the floor, reflecting amber and cyan streaks, rippling around her bare feet.

Shadows are deep warm brown, deepest under her arm and behind the robot. A thin horizontal blue flare crosses the tank. Slight motion blur on her free elbow and on the hose. Focus is on her face and falls off just behind her ear. A dim, smoky frame, mostly amber with a cold cyan core, two figures cut out against the glowing tank, gentle mist-filter bloom, lifted warm blacks, oval highlights, fine grain.
```

## Reste à faire

Réécrire de la même façon les sept autres images (séisme vu de la clairière, incubation qui s'arrête, Seed qui ouvre les yeux, le XENOPOD qui bascule, seuls au bord du gouffre…), si Cal valide la méthode du prompt 4.
