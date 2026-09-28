<!-- Source : Claude Docs, « Planches de dessin », doc 1c3a90ba-19c3-42de-ae72-1357d30b5c80, node c9b70f1b-ddb1, exporté le 28/09/2026 -->
# Planches de dessin

2026-09-27 · calculmentor

Une fiche par personnage, machine, animal et plante du film : silhouette et proportions, matières et couleurs, les trois traits qui la rendent reconnaissable, les poses clés, ce qui ne doit jamais changer d'un plan à l'autre, et un prompt d'image prêt à copier. D'après le docx, la Bible, le Bestiaire et la Flore. Proposé.

## Comment lire une planche

Chaque fiche a six lignes : **Silhouette** (la forme lisible en ombre chinoise, avec la taille sur l'échelle commune), **Matières et couleurs** (sous la lumière de Korê, ~4 500 K : voir la Bible, Lumière et couleurs), **Trois traits** (ce qui la rend reconnaissable à dix mètres), **Poses et états** (ce que le film lui demande), **Invariants** (ce qui ne change jamais d'un plan à l'autre, la liste à contrôler en sortie de génération), **Prompt** (un bloc entier en anglais, à copier tel quel ; on le réécrit en entier quand on le corrige, jamais par morceaux).

Règles des prompts : descriptions de forme, de matière et de lumière uniquement ; aucun nom d'artiste, de studio, de film ou de personnage existant ; le style est fixé par une phrase commune en tête de chaque prompt, à remplacer une fois pour toutes si la direction artistique change : *« painterly science-fiction concept art, realistic proportions, soft volumetric light from a warm orange star, no text, no watermark »*. Vue de référence : trois-quarts face, fond neutre gris clair, pour la planche ; les vues en situation viennent après.

**Échelle commune** (Bestiaire, validée) : Seed 1,60 m ; Rob1 1 m ; Rob2 ~2,2 m ; Rob3 ~2 m ; Rob4 ~3 m ; Rob1/2 ~2,5 m debout ; tank Rob1/2/3 ~3,5 m de long ; drone porteur ~2 m d'envergure ; robopod ~2,5 m ; buffle albinos ~2,5 m au garrot ; oiseau-prédateur 8–10 m d'envergure ; Créature 4–5 m de long. Chaque planche porte Seed en silhouette à côté du sujet.

## Seed

**Silhouette.** 1,60 m, quinze ans apparents, fine sans être frêle ; cheveux blancs mi-longs, souvent en désordre, qui font la silhouette à eux seuls. Debout, légèrement penchée en avant, comme quelqu'un qui écoute. Elle porte Rob1 sur le dos à l'Acte II : la silhouette double (une tête, deux sacs) est à tenir.

**Matières et couleurs.** Peau claire, ivoire sous l'étoile orange, rose sous la canopée magenta ; cheveux blancs, le seul blanc pur du film avec le caillou et les buffles ; yeux sombres (ceux d'Elena). Combinaison de survie du XENOPOD, gris chaud, sans logo, manches retroussées, salie et déchirée au fil des actes (état 1 : neuve, Acte I ; état 2 : usée, Actes II–VI ; état 3 : déchirée et blessée, Acte VII ; état 4 : marquée, Actes VIII–X). Après Rob4 : des cicatrices lumineuses, des veines fines bleu-violet sur les bras, le cou et une tempe, visibles surtout la nuit.

**Trois traits.** Les cheveux blancs ; les mains, cadrées souvent seules (ce sont celles d'Elena) ; le mutisme : la bouche fermée, le regard qui fait tout.

**Poses et états.** Sortie de la cuve (mouillée, mal assurée) ; devant l'écran d'Elena ; portant Rob1 ; boire au fleuve ; accrochée au dos de Rob1/2 ; endormie dans le harnais ; le sourire au rongeur ; le demi-tour vers le petit ; le cri ; à demi dans l'eau rouge ; la fièvre ; flottant dans Rob4 ; « Korê » ; « Je suis Seed ». Une seule expression à interdire : la peur ouverte. Seed a peur les poings serrés.

**Invariants.** Longueur et blancheur des cheveux ; la combinaison et son état par acte ; les cicatrices à partir de 7-26 seulement, et toujours aux mêmes endroits ; pas de bijou, pas d'objet sauf le caillou blanc.

**Prompt.**

```
painterly science-fiction concept art, realistic proportions, soft volumetric light from a warm orange star, no text, no watermark. Character sheet, three-quarter front view on a neutral light grey background: a fifteen-year-old girl, 1.60 m, slender, with shoulder-length pure white untidy hair and dark eyes, closed mouth, attentive listening posture leaning slightly forward. She wears a warm grey survival jumpsuit with rolled sleeves, no logos, slightly worn. Ivory skin under warm light. Beside her, a small one-metre child-sized robot with a cylindrical backpack for scale.
```

Variante après la mer d'arsenic : ajouter à la fin *« thin faintly glowing blue-violet vein-like scars on her forearms, neck and left temple, jumpsuit torn at one sleeve and one knee »*.

## Rob1

**Silhouette.** 1 m, un petit enfant de métal : tête-écran large, torse compact, gros sac à dos cylindrique intégré (l'unité de calcul), bras longs et précis, petites jambes courtes. En ombre chinoise : une tête rectangulaire arrondie sur un corps en poire, un cylindre dans le dos.

**Matières et couleurs.** Blocs arrondis gris foncé mat, joints plus clairs, aucune couleur vive sauf l'écran-visage : fond noir, glyphes et animations en orange ambré (la couleur d'accent du film). Le métal se raye et se salit au fil du voyage.

**Trois traits.** L'écran-visage qui écrit au lieu de parler ; le sac à dos cylindrique ; les mains, fines, de manipulateur d'échantillons.

**Poses et états.** Devant l'incubateur ; porté sur le dos de Seed ; grimpant sur Rob2 ; replié en pilote sur le tank ; le feu à l'arc électrique ; l'antenne sectionnée ; la silhouette contre l'étoile. États de l'écran : rapport (texte), alerte (rouge ambré), animation (détermination, fierté, joie, le rire de l'Acte VIII), PROCESSING, et le IM/POSSIBLE qui pulse.

**Invariants.** La taille (1 m, exactement la moitié de Seed plus dix centimètres) ; le sac cylindrique ; l'écran noir à glyphes ambre ; jamais de bouche ni d'yeux dessinés.

**Prompt.**

```
painterly science-fiction concept art, realistic proportions, soft volumetric light from a warm orange star, no text, no watermark. Character sheet, three-quarter front view on a neutral light grey background: a small one-metre companion robot shaped like a child, rounded matte dark-grey metal blocks, a wide rectangular screen-face showing amber glyphs on black, a large cylindrical backpack integrated into its torso, long precise articulated arms with fine fingers, short legs. Worn and scratched metal. A 1.60 m girl with white hair stands beside it for scale.
```

## Rob2

**Silhouette.** ~2,2 m, un robot de terrain : jambes puissantes à genoux inversés, châssis large et bas, petits bras atrophiés terminés par des outils de forage et de minage, une plateforme plate sur le dos (là où Rob1 s'assemble). Pas de tête : un bloc capteurs à l'avant.

**Matières et couleurs.** Métal gris-vert olive, plaques épaisses, poussière de guano et de calcaire incrustée ; voyants de batterie sur le flanc, ambre puis rouge.

**Trois traits.** Les jambes ; les bras trop petits ; la plateforme dorsale à connecteurs.

**Poses et états.** Tournant en rond dans la caverne ; assemblé avec Rob1 ; à 4 %, puis +5 % ; descendant en rappel dans le sinkhole.

**Invariants.** Les genoux inversés ; la plateforme dorsale ; les outils aux bras.

**Prompt.**

```
painterly science-fiction concept art, realistic proportions, soft volumetric light from a warm orange star, no text, no watermark. Character sheet, three-quarter front view on a neutral light grey background: a 2.2 m heavy field robot with powerful digitigrade legs, a wide low chassis in olive grey-green thick metal plates, a flat docking platform with connectors on its back, two small atrophied arms ending in drilling and mining tools, a sensor block instead of a head, dusty with pale limestone and guano. A 1.60 m girl with white hair stands beside it for scale.
```

## Rob3

**Silhouette.** ~2 m, un gros bloc-ventre suspendu entre deux grands bras qui descendent jusqu'au sol, chacun terminé par une grosse roue molle. En mouvement, une bascule.

**Matières et couleurs.** Métal gris clair, roues en gomme sombre à crampons ; colonisé par une mousse gris-vert à reflets de rouille qui a gagné tout un flanc (état « éteint »), puis nettoyé mais taché (état « réveillé »).

**Trois traits.** Les deux roues molles ; le ventre ; la mousse.

**Poses et états.** Éteint et couvert de mousse ; nettoyé au coucher de l'étoile ; assemblé sous Rob2 pour former le tank.

**Invariants.** Deux roues, jamais plus ; la trace de mousse sur le flanc gauche après nettoyage.

**Prompt.**

```
painterly science-fiction concept art, realistic proportions, soft volumetric light from a warm orange star, no text, no watermark. Character sheet, three-quarter front view on a neutral light grey background: a 2 m exploration robot made of a large rounded belly-block suspended between two long arms that reach the ground, each ending in a big soft cleated wheel, light grey metal, one side overgrown with grey-green moss with rust-coloured highlights. A 1.60 m girl with white hair stands beside it for scale.
```

## Rob4

**Silhouette (avant).** ~3 m, hydrodynamique, un fuseau à coque transparente sur ossature rigide, nageoires-stabilisateurs, pas de membres.

**Silhouette (après, hybride).** La même ossature, mais la coque est devenue une membrane souple et transparente, gonflée d'un liquide lumineux bleu-violet-rose, où flottent des milliers de filaments qui pulsent vert-orange-rouge et s'entrelacent dans la structure comme des racines. Une section de la membrane s'ouvre comme une lèvre.

**Matières et couleurs.** Ossature gris sombre ; membrane transparente irisant ; liquide bleu-violet-rose ; filaments vert-orange-rouge. La nuit, Rob4 est une lanterne dans les vagues.

**Trois traits.** Le fuseau ; la transparence ; les filaments qui pulsent.

**Poses et états.** Émergeant de la mer gris-vert ; le langage de lumière ; la membrane ouverte ; Seed en cocon à l'intérieur ; reculant dans l'eau.

**Invariants.** L'ossature reste visible ; les couleurs des filaments (jamais bleu-vert, réservé aux plantes-chant) ; la taille.

**Prompt (hybride).**

```
painterly science-fiction concept art, realistic proportions, soft volumetric light from a warm orange star, no text, no watermark. Character sheet, three-quarter view on a neutral light grey background: a 3 m streamlined marine robot whose rigid dark grey skeleton is wrapped in a soft transparent membrane filled with glowing blue-violet-pink liquid, thousands of thin organic filaments pulsing green, orange and red intertwined through the structure like roots, small stabilizer fins, one section of the membrane parting like an opening. A 1.60 m girl with white hair stands beside it for scale.
```

## Rob1/2, le coureur

**Silhouette.** ~2,5 m debout : les jambes de Rob2, le torse de Rob1 pivoté et verrouillé sur la plateforme dorsale, ses bras longs devenus les bras de l'ensemble ; l'écran-visage de Rob1 est la tête. Entre les épaules, un siège-harnais où Seed s'assoit, dos au dos. En course, le corps se penche à 45°, comme un oiseau coureur.

**Matières et couleurs.** Les deux gris (foncé de Rob1, olive de Rob2) restent visibles : on doit voir que ce sont deux machines. Le harnais est une sangle orange, la seule pièce colorée.

**Trois traits.** La tête-écran petite sur un grand corps ; la posture penchée ; Seed dans le dos.

**Poses et états.** La fusion (click, click, click) ; le bond sur la paroi ; la course ; Seed endormie ; à l'arrêt, redressé.

**Invariants.** L'écran de Rob1 reste l'unique visage ; le harnais orange ; les genoux inversés de Rob2.

**Prompt.**

```
painterly science-fiction concept art, realistic proportions, soft volumetric light from a warm orange star, no text, no watermark. Character sheet, side and three-quarter views on a neutral light grey background: a 2.5 m running biped machine made of two docked robots, powerful olive-green digitigrade legs and low chassis below, a small dark-grey child-like torso locked on top with a wide screen-face showing amber glyphs, long articulated arms, an orange strap seat between the shoulders where a white-haired 1.60 m girl sits back-to-back, body leaning forward at 45 degrees in a running stride.
```

## Rob1/2/3, le tank

**Silhouette.** ~3,5 m de long, 2 m de haut : Rob3 en dessous (ses deux roues molles écartées, son ventre devenu châssis), Rob2 assis dessus, jambes repliées en suspensions, Rob1 à l'avant en pilote, torse sorti comme une tourelle. Une moto-tank à deux roues, large, basse.

**Matières et couleurs.** Les trois gris ; les roues sombres ; poussière ocre du canyon, cendre noire des laves, sel blanc des lacs selon l'acte.

**Trois traits.** Deux roues seulement ; les trois corps lisibles ; Rob1 en tourelle.

**Poses et états.** L'assemblage dans la panique ; à contresens de la horde ; emporté ; surgissant des buissons ; la course à pleine vitesse ; dévalant vers la mer ; en rappel au sinkhole.

**Invariants.** L'ordre d'empilement (3, 2, 1) ; deux roues ; Seed installée à l'avant entre Rob1 et Rob2.

**Prompt.**

```
painterly science-fiction concept art, realistic proportions, soft volumetric light from a warm orange star, no text, no watermark. Vehicle sheet, three-quarter front view on a neutral light grey background: a 3.5 m two-wheeled machine assembled from three docked robots, a light grey belly-block chassis riding on two big soft cleated wheels, a heavy olive-green robot seated on top with its legs folded as suspension, a small dark-grey child-like robot with an amber screen-face mounted at the front like a turret, a white-haired girl seated between them, dust and ash on the plates.
```

## Le drone porteur

**Silhouette.** Aile volante de ~2 m d'envergure, épaisse au centre (la soute de 15 kg), sans queue ; deux hélices carénées. Posé, il ressemble à une raie.

**Matières et couleurs.** Composite gris pâle, ventre noir ; un voyant ambre au bord d'attaque. Cassé au fond du sinkhole : une aile pliée, la soute ouverte.

**Trois traits.** L'aile sans queue ; la soute renflée ; les hélices carénées.

**Prompt.**

```
painterly science-fiction concept art, realistic proportions, soft volumetric light from a warm orange star, no text, no watermark. Object sheet, top and three-quarter views on a neutral light grey background: a 2 m tailless flying-wing cargo drone with a thick central payload bay, two shrouded propellers, pale grey composite skin with a black underside and one amber light on the leading edge, resting on the ground like a ray fish. A 1.60 m girl with white hair stands beside it for scale.
```

## Le robopod

**Silhouette.** ~2,5 m, une capsule posée sur trois pieds, ouverte d'un côté (l'abri et l'outillage), un mât-relais télescopique de 4 m, un parasol photovoltaïque déplié comme une fleur à six pétales. Trois exemplaires identiques : celui de Rob2 brisé au fond de la crevasse, celui de Rob3 habité par les rongeurs, celui de Rob4 sur la plage noire.

**Matières et couleurs.** Coque blanc cassé brunie par l'entrée atmosphérique, pétales bleu sombre, mât gris.

**Trois traits.** Le parasol-fleur ; le mât ; les trois pieds.

**Prompt.**

```
painterly science-fiction concept art, realistic proportions, soft volumetric light from a warm orange star, no text, no watermark. Object sheet, three-quarter view on a neutral light grey background: a 2.5 m landed capsule on three legs, off-white hull scorched brown by atmospheric entry, one side open as a shelter with tools, a 4 m telescopic relay mast, and a deployed six-petal dark-blue photovoltaic parasol like a flower. A 1.60 m girl with white hair stands beside it for scale.
```

## Le XENOPOD-01

**Silhouette.** ~8 m, une capsule trapue à bouclier ablatif, quatre pieds stabilisateurs, un mât-relais, une baie latérale (les trois trappes des robopods), un panneau qui coulisse sur l'incubateur ; une fois au sol, un nœud de mission avec parasol.

**Matières et couleurs.** Blanc cassé et brun de rentrée ; intérieur gris clair, lumière bleutée de la cuve ; le compartiment cryogénique aux milliers de boîtes, vapeur blanche.

**Trois traits.** Les quatre pieds qui s'enfoncent ; la cuve bleutée ; le mât.

**Prompt.**

```
painterly science-fiction concept art, realistic proportions, soft volumetric light from a warm orange star, no text, no watermark. Vehicle sheet, three-quarter view on a neutral light grey background: an 8 m squat landing capsule with a scorched ablative shield, four wide stabilizer feet sinking slightly into mossy ground, a tall relay mast, three closed side hatches, a sliding panel revealing a cylindrical transparent incubation tank with soft blue light inside. A 1.60 m girl with white hair stands beside it for scale.
```

## PERSEPHORA

**Silhouette.** ~200 m, une semeuse : architecture modulaire en épi, baies ventrales où sont sanglés les XENOPOD (deux vides, un plein), antennes longue base, et à l'arrière l'anneau du moteur à fusion, entouré de la structure du warp.

**Matières et couleurs.** Gris métallique et blanc, sans fenêtre ; l'anneau moteur bleu-blanc à l'allumage ; la bulle de warp comme une légère distorsion de l'espace, pas un effet de couleur.

**Trois traits.** L'épi ; les baies ventrales ; l'anneau.

**Prompt.**

```
painterly science-fiction concept art, realistic proportions, deep space lighting with a warm orange star in the distance, no text, no watermark. Spacecraft sheet, three-quarter view: a 200 m autonomous seeder probe, modular spine with stacked modules, ventral bays holding one squat landing capsule with two empty bays beside it, long-baseline antennas, a large glowing blue-white fusion ring at the rear surrounded by a lattice structure, grey and white hull with no windows.
```

## Les animaux du film

### Buffle albinos (HP-01)

**Silhouette.** ~2,5 m au garrot, massif, épaules hautes, tête basse ; laine épaisse qui arrondit tout ; deux cornes courtes en crochet. En horde : une mer blanche.

**Matières et couleurs.** Laine blanc cassé (un des trois blancs du film), museau gris, yeux bleus énormes, presque électriques, cinq fois plus grands que ceux d'un buffle terrestre.

**Trois traits.** La laine ; les yeux ; la masse.

**Invariants.** Six pattes ou quatre : le Bestiaire laisse libre, mais une fois choisi, toujours le même nombre ; les cornes courtes.

```
painterly science-fiction concept art, realistic proportions, soft volumetric light from a warm orange star, no text, no watermark. Creature sheet, side and three-quarter views on a neutral light grey background: a massive 2.5 m tall albino grazing beast with thick rounded off-white wool, high shoulders, low head, two short hooked horns, grey muzzle and enormous electric-blue eyes, four sturdy legs. A 1.60 m girl with white hair stands beside it for scale.
```

### Rongeur à l'oreille abîmée (FB-01)

**Silhouette.** 25–30 cm, rond, six pattes (quatre pour courir, deux pour saisir), queue semi-préhensile, grandes oreilles rondes mobiles. Le jeune : plus petit, l'oreille gauche entaillée.

**Matières et couleurs.** Fourrure brun-gris à reflets bleutés, grands yeux noirs, ventre clair.

**Trois traits.** Les oreilles rondes ; les deux petites mains ; l'entaille de l'oreille.

```
painterly science-fiction concept art, realistic proportions, soft volumetric light from a warm orange star, no text, no watermark. Creature sheet, three-quarter view on a neutral light grey background: a round 25 cm rodent-like animal with brown-grey fur showing bluish highlights, large black eyes, big round mobile ears with a notch torn out of the left ear, six limbs (four running legs and two small grasping hands), a semi-prehensile tail, holding a small round white pebble.
```

### Oiseau-prédateur (HP-02)

**Silhouette.** 8–10 m d'envergure, membranes translucides sans plumes portées par un doigt allongé, corps fuselé, bec long denté, queue rigide. Vu de dessous : une ombre en croix.

**Matières et couleurs.** Dos gris-brun, ventre clair, membranes qui laissent passer la lumière orange.

**Trois traits.** Les membranes translucides ; le bec denté ; l'envergure.

```
painterly science-fiction concept art, realistic proportions, soft volumetric light from a warm orange star, no text, no watermark. Creature sheet, view from below and side view on a neutral light grey background: a 9 m wingspan flying predator with translucent featherless wing membranes stretched on one elongated finger, streamlined body, long toothed beak, rigid tail, grey-brown back and pale belly, warm light glowing through the membranes.
```

### La Créature (TR-01)

**Silhouette.** 4–5 m de long, 2 m de haut ; carapace segmentée ; six membres trop longs qui raclent le sol ; pas d'yeux ; gueule large.

**Matières et couleurs.** Carapace noire luisante, humide ; de la gueule coule une pulpe bleu-vert lumineuse (les plantes-chant digérées) : la seule lumière du plan.

**Trois traits.** Pas d'yeux ; les membres trop longs ; la pulpe lumineuse.

```
painterly science-fiction concept art, realistic proportions, dark cave lighting with a single blue-green glow, no text, no watermark. Creature sheet, three-quarter view on a dark grey background: a 5 m long cave predator with a glossy wet black segmented carapace, six overly long limbs that scrape the ground, no eyes, a wide mouth from which glowing blue-green pulp drips, the pulp being the only light source. A 1.60 m girl with white hair stands beside it for scale.
```

### Oiseau des salins (LS-01)

**Silhouette.** ~60 cm, échassier à longues pattes, cou courbé, bec fin recourbé vers le bas ; en colonie de milliers.

**Matières et couleurs.** Plumage gris clair qui rosit aux ailes (les microbes du sel qu'il mange), pattes noires. Le cri à deux notes : Ko-rê.

```
painterly science-fiction concept art, realistic proportions, soft volumetric light from a warm orange star, no text, no watermark. Creature sheet, side view on a neutral light grey background: a 60 cm wading bird with long black legs, a curved neck, a thin down-curved beak, light grey plumage blushing pink on the wings, standing in shallow purple brine on a white salt crust, with a flock taking off behind it.
```

### Oiseau-reptile (FB-03)

**Silhouette.** ~40 cm, corps de petit reptile arboricole, ailes membraneuses courtes, queue longue, bec corné.

**Matières et couleurs.** Écailles vert-bronze, gorge orangée ; il mange le fruit violet sans dommage.

```
painterly science-fiction concept art, realistic proportions, soft volumetric light from a warm orange star, no text, no watermark. Creature sheet, three-quarter view on a neutral light grey background: a 40 cm tree-dwelling reptile-bird with bronze-green scales, an orange throat, short membranous wings, a long tail and a horny beak, perched on a branch eating a glossy purple-red pear-shaped fruit.
```

### Fleurs-papillons (JP-01)

**Silhouette.** 10–15 cm, posées ailes ouvertes à plat sur les plateaux de nectar des arbustes-perchoirs : on les prend pour des fleurs. En vol par milliers : une nuée.

**Matières et couleurs.** Ailes pourpre clair à cœur blanc, comme une corolle ; dessous argenté.

```
painterly science-fiction concept art, realistic proportions, soft volumetric light from a warm orange star, no text, no watermark. Creature sheet on a neutral light grey background: a 12 cm butterfly-like insect resting with its wings spread flat like a five-petal flower, light purple wings with a white centre and silvery undersides, several of them sitting on a shrub's flat nectar platforms so that the shrub looks like it is in bloom, and a cloud of them taking flight.
```

### Filaments de Rob4 (MA-05, JK-47B)

**Silhouette.** Filaments de 20 cm à 2 m, semi-transparents, qui se regroupent en structures et s'enroulent autour d'un hôte ; en masse, un cocon.

**Matières et couleurs.** Bleu-violet-rose, pulsant vert-orange-rouge au rythme du cœur de l'hôte.

```
painterly science-fiction concept art, underwater lighting, no text, no watermark. Detail sheet on a dark blue-violet background: thousands of thin semi-transparent organic filaments, 20 cm to 2 m long, glowing blue-violet-pink and pulsing green, orange and red, gently wrapping around a sleeping white-haired girl suspended in luminous liquid like a cocoon, her skin showing faint glowing vein-like marks.
```

## Les plantes du film

### Plantes-chant, organisme-batterie (FL-TR-01)

**Silhouette.** Touffes de 30 cm à 2 m de tiges translucides, membranes fines tendues entre les tiges comme des voiles, racines dans la roche nue.

**Matières et couleurs.** Gel bleu-vert lumineux dans les tiges (490 nm : la couleur de la caverne), membranes presque incolores qui vibrent ; éteintes, elles sont gris laiteux.

```
painterly science-fiction concept art, dark cave lighting, no text, no watermark. Botanical sheet on a dark grey background: a clump of translucent stems from 30 cm to 2 m tall filled with glowing blue-green gel, thin colourless membranes stretched between the stems like small sails, roots gripping bare limestone rock, one small sample of the plant in a transparent container beside it.
```

### Arbre-cathédrale (FL-FA-01)

**Silhouette.** 100–115 m, contreforts en nef de dix mètres, tronc qui monte droit, branches en arcs qui se rejoignent ; on cadre presque toujours le pied, Seed adossée.

**Matières et couleurs.** Écorce rousse fibreuse, canopée pourpre profond, brouillard dans les branches.

```
painterly science-fiction concept art, realistic proportions, soft volumetric light from a warm orange star through fog, no text, no watermark. Botanical sheet: the base of a 110 m giant tree with ten-metre buttress roots forming arches like a cathedral nave, fibrous russet bark, deep purple foliage far above, fog drifting between the roots, a 1.60 m girl with white hair sitting against the trunk for scale.
```

### Poirier électrique (FL-FA-02)

**Silhouette.** 8–12 m, port étalé, fruits en poire par grappes.

**Matières et couleurs.** Feuilles pourpres, fruit violet-rouge laqué, brillant, avec une pulpe claire quand on le mord.

```
painterly science-fiction concept art, realistic proportions, soft volumetric light from a warm orange star, no text, no watermark. Botanical sheet on a neutral light grey background: a 10 m spreading tree with purple leaves bearing clusters of glossy lacquered purple-red pear-shaped fruit, one fruit shown close up bitten open to reveal pale translucent flesh.
```

### Arbres cristallins (FL-VC-01)

**Silhouette.** 10–25 m, troncs à facettes, branches raides, feuilles en aiguilles rigides.

**Matières et couleurs.** Écorce vitreuse qui réfracte la lumière en irisations, feuilles gris-vert ; des arbres vivants, pas des pierres.

```
painterly science-fiction concept art, realistic proportions, soft volumetric light from a warm orange star, no text, no watermark. Botanical sheet on a neutral light grey background: a living 20 m tree with a faceted glassy bark that refracts light into soft iridescent colours, stiff branches with rigid grey-green needle leaves, a forest of them behind on dark volcanic soil.
```

### Arbres-cheminées (FL-FB-01)

**Silhouette.** 20–30 m, troncs creux et pâles autour de sources tièdes, sans feuilles : des lamelles en éventail à la place des branches, clairsemés.

**Matières et couleurs.** Tronc blanc crème ; lamelles bleu électrique la nuit, grisâtres le jour ; vapeur des sources.

```
painterly science-fiction concept art, night lighting with no moon, no text, no watermark. Botanical sheet on a black background: a sparse forest of 25 m pale cream hollow-trunked trees growing around steaming warm springs, with no leaves but fan-shaped gill-like lamellae glowing electric blue in the dark, a moss-covered wheeled robot resting between two trunks for scale.
```
