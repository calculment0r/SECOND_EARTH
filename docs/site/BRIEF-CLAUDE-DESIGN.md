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
- L'inventaire complet avec vignettes : `media/inventaire/` (fait le 25/11/2026 : 98 vidéos, 60 images ; page publiée sous `inventaire-medias/`).
- Les couleurs de la planète : étoile orange, végétation pourpre en haut et verte dessous, lumière magenta sous les arbres, déserts ocre, mer gris-vert, lacs roses, nuits lumineuses bleues. Les images actuelles sont dominées par le rouge corail, le blanc et les brumes pâles.
- Les vidéos seront servies depuis Cloudflare, pas depuis le dépôt.

### Sélection de départ (tirée de l'inventaire du 25/11/2026)

Chemins dans les dossiers de Cal. Les vidéos font 1470 × 630 (21:9), 15 ou 30 s, avec son ; elles seront servies depuis Cloudflare. Les vignettes sont dans `media/inventaire/vignettes/`, la page complète dans `media/inventaire/index.html` (filtres par état, personnage, lieu).
Toutes les vidéos ci-dessous sont marquées « bon ». Rob1 est trop grand dans beaucoup de vidéos avec Seed : ne pas utiliser une vidéo « bon en partie » hors du passage indiqué dans sa fiche.

- **Grande vidéo d'ouverture** (21 possibles) :
  - `FAUNE_FLORE/escargot_verre.mp4` : Un escargot transparent à chair rose et coquille pointue en verre avance dans des collines vertes plantées d'arbres ronds vert clair à tronc jaune. Images fixes : 1 s, 4.5 s.
  - `FAUNE_FLORE/geant_plumes_serie1.mp4` : Un grand animal à quatre pattes, à longs poils blancs, crête de plumes, tête bleue et deux longues cornes de côté, marche sur une plaine de buissons rouges. Images fixes : 4 s, 1 s.
  - `FAUNE_FLORE/oiseau_pois.mp4` : Des oiseaux coureurs à plumes blanches à pois noirs, orange et bleu sombre, à grande crête, marchent dans une lande rouge avec des arbres jaunes en forme de toupie. Images fixes : 2 s, 3.2 s.
  - `FAUNE_FLORE/oreilles_ailes.mp4` : Un animal blanc et mince, à longue queue et à deux très grandes oreilles tendues comme des ailes, court sur une plaine rouge sous un ciel d'orage. Images fixes : 1.5 s, 5.5 s.
  - `FAUNE_FLORE/ours_rouge_blanc.mp4` : Un très gros animal proche d'un ours, à poils rouges et blancs, avec deux crocs en bas, marche dans un vallon d'herbe bleue sous des arches de roche rouge. Images fixes : 2.5 s, 11 s.
  - `FAUNE_FLORE/reptile_volant.mp4` : Un reptile volant à long bec et ailes orangées vole et se pose dans un désert de sable blanc avec de gros dômes roses et des champignons roses géants. Images fixes : 1 s, 4 s.
  - `FAUNE_FLORE/rhino.mp4` : Un gros animal à peau blanche tachée, dos couvert d'écailles ou de plumes rouges, avec une très grande corne courbée vers l'arrière, marche dans une eau peu profonde. Images fixes : 2 s, 6 s.
  - `FAUNE_FLORE/rouge_noir_cornes.mp4` : Un gros animal à longs poils rouges et noirs, pattes blanches, deux petites cornes et longue queue, traverse une plaine d'herbe rose avec des pics de roche sombre. Images fixes : 3.5 s, 13 s.
  - `SEED/04_lagon_de_nacre.mp4` : Seed et Rob1, accroupis sur un rocher au milieu d'une eau calme, touchent l'eau ; autour, de grandes arches blanches et nacrées. Images fixes : 1.5 s, 13 s.
  - `SEED/09_entre_les_geants.mp4` : Seed et Rob1, tout petits, avancent courbés entre les pattes d'un troupeau d'animaux géants rouges à défenses, dans la poussière. Images fixes : 2 s, 7 s.
  - `SEED/14_escalade.mp4` : Seed grimpe une haute paroi jaune avec Rob1 accroché dans son dos, puis on voit ses jambes posées au sommet, face au vide. Images fixes : 2 s, 8 s.
  - `SEED/C12_colonne_de_lave_meduses.mp4` : Une colonne de lave tombe sur un sol percé de bassins ronds ; Seed court sur les rebords de lave en portant Rob1 dans ses bras, puis tombe à genoux sur la roche noire. Images fixes : 3 s, 24 s.
  - `SEED/C20_foret_arbres_rouges_champignons_blancs.mp4` : Seed et Rob1 jouent à cache-cache autour d'un tronc rouge dans une forêt d'arbres rouges au sol couvert de champignons blancs, puis partent en courant main dans la main. Images fixes : 4 s, 14 s.
  - `SEED/X1_entree_vue_de_derriere.mp4` : Une capsule conique claire entre en feu dans l'atmosphère au-dessus d'une planète aux terres rouges, roses et turquoise. Images fixes : 1 s, 6.5 s.
  - `SPACE/D.mp4` : Une capsule conique blanche entre dans l'atmosphère en feu, descend sous trois ballons blancs et se pose sur un sol blanc entre des dômes roses. Images fixes : 3.5 s, 6.5 s.
  - `SPACE/O.mp4` : La station de modules hexagonaux vue de haut au-dessus de la Terre, puis un gros plan qui longe la coque jusqu'au mot MOTHER. Images fixes : 4 s, 14 s.
  - `SPACE/P.mp4` : Le vaisseau à voile ronde vu de face, puis vu de loin au-dessus d'une planète aux taches roses, rouges, jaunes et blanches, près d'une étoile rouge. Images fixes : 3 s, 12 s.
  - `SPACE/V3.mp4` : Vu de loin au-dessus d'une planète bleue, le vaisseau ouvre sa voile dorée en pétales pendant que la vue s'approche, puis il est vu de côté voile ouverte. Images fixes : 1 s, 8 s.
  - `SPACE/a1.mp4` : Le vaisseau à voile dorée, sa coque couverte de givre, une capsule conique dans une soute, puis la capsule lâchée qui s'enflamme. Images fixes : 4 s, 7.5 s.
  - `SPACE/d1.mp4` : La station et le vaisseau au-dessus d'une planète bleue, un gros plan sur la station, le vaisseau qui s'en détache, puis sa voile dorée qui s'ouvre. Images fixes : 1.5 s, 7.5 s.
  - `SPACE/d2.mp4` : Le vaisseau à voile dorée vu de face et de côté, la station au-dessus d'une planète, le mot PERSEPHORA sur la coque, puis le vaisseau qui disparaît en un point de lumière. Images fixes : 1 s, 7.5 s.

- **L'espace, le vaisseau, l'arrivée** (10) :
  - `SEED/X1_entree_vue_de_derriere.mp4` : Une capsule conique claire entre en feu dans l'atmosphère au-dessus d'une planète aux terres rouges, roses et turquoise. Images fixes : 1 s, 6.5 s.
  - `SEED/X2c_interieur_rob1_calme.mp4` : Rob1 est assis, sanglé, dans une cabine sombre aux deux hublots orange, puis sa tête en gros plan se tourne vers la caméra. Images fixes : 2 s, 8.6 s.
  - `SPACE/D.mp4` : Une capsule conique blanche entre dans l'atmosphère en feu, descend sous trois ballons blancs et se pose sur un sol blanc entre des dômes roses. Images fixes : 3.5 s, 6.5 s.
  - `SPACE/O.mp4` : La station de modules hexagonaux vue de haut au-dessus de la Terre, puis un gros plan qui longe la coque jusqu'au mot MOTHER. Images fixes : 4 s, 14 s.
  - `SPACE/P.mp4` : Le vaisseau à voile ronde vu de face, puis vu de loin au-dessus d'une planète aux taches roses, rouges, jaunes et blanches, près d'une étoile rouge. Images fixes : 3 s, 12 s.
  - `SPACE/V1.mp4` : Le vaisseau à voile dorée vu de côté sur fond noir, puis vu de dos au-dessus d'une planète bleue avec le soleil. Images fixes : 6 s, 12 s.
  - `SPACE/V3.mp4` : Vu de loin au-dessus d'une planète bleue, le vaisseau ouvre sa voile dorée en pétales pendant que la vue s'approche, puis il est vu de côté voile ouverte. Images fixes : 1 s, 8 s.
  - `SPACE/a1.mp4` : Le vaisseau à voile dorée, sa coque couverte de givre, une capsule conique dans une soute, puis la capsule lâchée qui s'enflamme. Images fixes : 4 s, 7.5 s.
  - `SPACE/d1.mp4` : La station et le vaisseau au-dessus d'une planète bleue, un gros plan sur la station, le vaisseau qui s'en détache, puis sa voile dorée qui s'ouvre. Images fixes : 1.5 s, 7.5 s.
  - `SPACE/d2.mp4` : Le vaisseau à voile dorée vu de face et de côté, la station au-dessus d'une planète, le mot PERSEPHORA sur la coque, puis le vaisseau qui disparaît en un point de lumière. Images fixes : 1 s, 7.5 s.

- **Seed et Rob1** (14) :
  - `SEED/04_lagon_de_nacre.mp4` : Seed et Rob1, accroupis sur un rocher au milieu d'une eau calme, touchent l'eau ; autour, de grandes arches blanches et nacrées. Images fixes : 1.5 s, 13 s.
  - `SEED/09_entre_les_geants.mp4` : Seed et Rob1, tout petits, avancent courbés entre les pattes d'un troupeau d'animaux géants rouges à défenses, dans la poussière. Images fixes : 2 s, 7 s.
  - `SEED/13_nuit_dans_l_arbre.mp4` : De nuit, Seed dort allongée dans la fourche d'un gros arbre rouge avec Rob1 contre elle ; des animaux aux oreilles à pointes lumineuses passent au pied des arbres ; Seed ouvre les yeux. Images fixes : 9.5 s, 5.5 s.
  - `SEED/14_escalade.mp4` : Seed grimpe une haute paroi jaune avec Rob1 accroché dans son dos, puis on voit ses jambes posées au sommet, face au vide. Images fixes : 2 s, 8 s.
  - `SEED/16b_neige_et_rochers_bleus.mp4` : Une petite silhouette avance dans une tempête de neige devant de grands cristaux de glace bleus, puis on voit de près le visage de Seed dans une capuche de fourrure. Images fixes : 1 s, 8.5 s.
  - `SEED/17_glissade_neige.mp4` : Seed glisse sur le dos en riant sur une pente blanche, Rob1 roule à côté d'elle ; ils s'arrêtent, Rob1 s'assoit et de la neige lui tombe sur la tête. Images fixes : 2 s, 11 s.
  - `SEED/20_feu_de_camp.mp4` : Seed dort près d'un petit feu dans une forêt de nuit, Rob1 assis contre elle, le grand robot debout derrière ; puis deux petits animaux à grandes oreilles assis près du feu. Images fixes : 5 s, 13 s.
  - `SEED/21_le_grand_timide.mp4` : Seed tend la main vers un très gros animal couvert de mousse et de poils verts, à bec rouge et longues griffes, puis pose la main sur sa patte ; Rob1 regarde à distance. Images fixes : 1 s, 13.5 s.
  - `SEED/22_la_flore.mp4` : Une main touche une plante à longues pointes bleu sombre à points blancs ; puis le visage de Seed de face derrière la plante, Rob1 flou à côté d'elle. Images fixes : 2 s, 10 s.
  - `SEED/23_rob1_refuse_qu_on_le_porte.mp4` : Au bord d'une rivière entre des rochers rouges, Rob1 grimpe sur un rocher et croise les bras ; Seed le soulève puis traverse l'eau en le portant. Images fixes : 5 s, 12 s.
  - `SEED/C12_colonne_de_lave_meduses.mp4` : Une colonne de lave tombe sur un sol percé de bassins ronds ; Seed court sur les rebords de lave en portant Rob1 dans ses bras, puis tombe à genoux sur la roche noire. Images fixes : 3 s, 24 s.
  - `SEED/C20_foret_arbres_rouges_champignons_blancs.mp4` : Seed et Rob1 jouent à cache-cache autour d'un tronc rouge dans une forêt d'arbres rouges au sol couvert de champignons blancs, puis partent en courant main dans la main. Images fixes : 4 s, 14 s.
  - `SEED/M2_attaques_2.mp4` : Seed, à quatre pattes sur un sol rouge avec Rob1, regarde des cailloux ; un troupeau d'animaux rouges à cornes arrive sous un ciel d'orage ; elle se couche sur Rob1 pendant que le troupeau passe. Images fixes : 0.2 s, 8 s.
  - `SECOND EARTH PANO/VIDEO/outpaint_00003.mp4` : Un paysage de roche sombre couvert de coussins rouges et de plantes à boules jaunes, puis Seed de face qui regarde autour d'elle, puis Seed de dos face au soleil. Images fixes : 1.5 s, 11.5 s.

- **Bestiaire** (22 vidéos d'animaux) :
  - `FAUNE_FLORE/bete_mousse.mp4` : Un gros animal couvert de poils verts comme de la mousse, à face rouge et longues griffes, sur une pente de roche sombre devant un volcan. Images fixes : 2 s, 6.5 s.
  - `FAUNE_FLORE/bleue_pois.mp4` : Un gros animal bleu-vert à ronds clairs sur le dos et les épaules, qui marche parmi de grands champignons bleus et des rochers rouges. Images fixes : 2.5 s, 7.5 s.
  - `FAUNE_FLORE/canide_oreilles_serie2.mp4` : Un animal proche d'un chien, à fourrure blanche et grise et à longues oreilles droites dont le bout brille, dans un paysage de volcans. Images fixes : 1.5 s, 4.5 s.
  - `FAUNE_FLORE/canide_oreilles_serie3.mp4` : Un animal proche d'un chien, à fourrure blanche et grise et à longues oreilles au bout lumineux, devant une montagne en cône couverte de masses rondes, sous un ciel rose. Images fixes : 1.5 s, 9 s.
  - `FAUNE_FLORE/carapace_noire_serie2.mp4` : Un petit animal à carapace noire bombée et pattes orange, de nuit, parmi de grands champignons plats blancs qui luisent en orange par-dessous. Images fixes : 1.5 s, 7.5 s.
  - `FAUNE_FLORE/colosse_blanc_rouge_serie1.mp4` : Un très gros animal à quatre pattes, couvert de plaques blanches et rouges, avec des défenses, qui marche sous de grandes arches blanches. Images fixes : 1.5 s, 5 s.
  - `FAUNE_FLORE/cornes_v_blanc_serie1.mp4` : Un animal à longue fourrure blanche et à deux cornes sombres en V, sur une plaine pâle et brumeuse avec de grands champignons rouges plats. Images fixes : 1.5 s, 5 s.
  - `FAUNE_FLORE/cou_rouge.mp4` : Un animal haut sur pattes, à long cou et à fourrure rouge, avec une tête noire en bec et une crête de pointes, sur un sol clair devant des champignons rouges. Images fixes : 3 s, 10 s.
  - `FAUNE_FLORE/crabe_nacre.mp4` : Un crabe à carapace blanc nacré et dessus rouge, sur une plage de sable clair au bord d'une eau calme, entre de grandes arches blanches translucides. Images fixes : 1.5 s, 4.5 s.
  - `FAUNE_FLORE/dos_bleu_perle.mp4` : Un animal à corps bleu-noir bombé et à longues pattes orange courbées, de nuit, parmi des coupes blanches posées au sol qui luisent en orange. Images fixes : 1.5 s, 4.5 s.
  - `FAUNE_FLORE/echassier_crete_serie1.mp4` : Un oiseau haut sur pattes, à long bec fin, plumage crème tacheté de noir et d'orange et crête de plumes, au bord d'une eau calme sous d'énormes formes blanches et roses. Images fixes : 3 s, 9 s.
  - `FAUNE_FLORE/epines_turquoise_variee.mp4` : De gros reptiles turquoise au dos couvert d'épines orange marchent dans un canyon semé de boules roses. Images fixes : 2.5 s, 11.5 s.
  - `FAUNE_FLORE/escargot_verre.mp4` : Un escargot transparent à chair rose et coquille pointue en verre avance dans des collines vertes plantées d'arbres ronds vert clair à tronc jaune. Images fixes : 1 s, 4.5 s.
  - `FAUNE_FLORE/geant_plumes_serie1.mp4` : Un grand animal à quatre pattes, à longs poils blancs, crête de plumes, tête bleue et deux longues cornes de côté, marche sur une plaine de buissons rouges. Images fixes : 4 s, 1 s.
  - `FAUNE_FLORE/geant_zebre_variee.mp4` : De gros animaux rayés noir et beige, au dos à pointes et à grande corne droite sur le nez, vivent dans un désert blanc sous de grandes arches blanches et orange. Images fixes : 1.5 s, 5.3 s.
  - `FAUNE_FLORE/mammouth.mp4` : Gros plan fixe sur la tête d'un gros animal à poils blancs et roux, nez bleu-gris, petites cornes sur le front ; il cligne des yeux. Images fixes : 1 s, 13.5 s.
  - `FAUNE_FLORE/oiseau_pois.mp4` : Des oiseaux coureurs à plumes blanches à pois noirs, orange et bleu sombre, à grande crête, marchent dans une lande rouge avec des arbres jaunes en forme de toupie. Images fixes : 2 s, 3.2 s.
  - `FAUNE_FLORE/oreilles_ailes.mp4` : Un animal blanc et mince, à longue queue et à deux très grandes oreilles tendues comme des ailes, court sur une plaine rouge sous un ciel d'orage. Images fixes : 1.5 s, 5.5 s.
  - `FAUNE_FLORE/ours_rouge_blanc.mp4` : Un très gros animal proche d'un ours, à poils rouges et blancs, avec deux crocs en bas, marche dans un vallon d'herbe bleue sous des arches de roche rouge. Images fixes : 2.5 s, 11 s.
  - `FAUNE_FLORE/reptile_volant.mp4` : Un reptile volant à long bec et ailes orangées vole et se pose dans un désert de sable blanc avec de gros dômes roses et des champignons roses géants. Images fixes : 1 s, 4 s.
  - `FAUNE_FLORE/rhino.mp4` : Un gros animal à peau blanche tachée, dos couvert d'écailles ou de plumes rouges, avec une très grande corne courbée vers l'arrière, marche dans une eau peu profonde. Images fixes : 2 s, 6 s.
  - `FAUNE_FLORE/rouge_noir_cornes.mp4` : Un gros animal à longs poils rouges et noirs, pattes blanches, deux petites cornes et longue queue, traverse une plaine d'herbe rose avec des pics de roche sombre. Images fixes : 3.5 s, 13 s.

- **Bandeaux très larges** (35 images, rapport d'environ 4,7:1, 2900 à 6700 px de large) :
  - `SECOND EARTH PANO/STILLS/01 (1) · étendre.png` : Une plaine blanche avec un petit cours d'eau, des plantes rouges en forme de corail au premier plan, des dômes blancs et des formes blanches en champignon sur des collines sombres.
  - `SECOND EARTH PANO/STILLS/01_decor_D07_bassins_verts_soufre · étendre.png` : Des bassins d'eau verte bordés de croûtes blanches, avec des anneaux jaunes, sur une plaine brune ; au fond, des amas blancs et jaunes.
  - `SECOND EARTH PANO/STILLS/04_board_2_deploiement_4 · recadrée 1619… · étendre.png` : Une planète bleue couverte de nuages blancs, vue d'orbite, avec au centre un petit vaisseau à voile dorée ronde et quelques petits engins autour.
  - `SECOND EARTH PANO/STILLS/06_decor_C13_spheres_et_bassins_rouille · étendre.png` : Au ras du sol, un amas de boules sombres granuleuses, des bassins ronds couleur rouille, des filaments orange et des flaques sombres ; au fond, une colonne de vapeur et des collines floues.
  - `SECOND EARTH PANO/STILLS/07_decor_190_decor · étendre.png` : Une étendue blanche couverte d'une fine couche d'eau, des buissons rouges, et des formes rouges en boule percée posées sur un pied ; le soleil est bas derrière les nuages.
  - `SECOND EARTH PANO/STILLS/197_4_85mm · étendre.png` : Seed, vue de près, met la main en visière au-dessus de ses yeux ; derrière elle, un sol rouge, une pente sombre et des formes blanches en colonnes, floues.
  - `SECOND EARTH PANO/STILLS/198_4_85mm · étendre.png` : Seed rit, les yeux fermés, sous des gouttes d'eau près d'une cascade ; autour, des rochers couverts de mousse et deux formes à chapeau rouge sur des tiges bleues.
  - `SECOND EARTH PANO/STILLS/bleue_pois_case2 · recadrée 1613×689 · étendre.png` : Un gros animal à quatre pattes, bleu-gris avec de grands pois crème, marche dans une herbe bleutée, parmi de grands arbres en forme de champignons bleus et des rochers rouges.
  - `SECOND EARTH PANO/STILLS/collé-20261122-201515 · étendre.png` : Le visage de Seed en très gros plan, une larme sur la joue, devant un fond rouge sombre rempli de sphères orange floues.
  - `SECOND EARTH PANO/STILLS/collé-20261122-204213 · étendre.png` : Un animal trapu à longs poils verts et blancs, face rouge et longues griffes, sur un sol de roche grise couvert de fibres cuivrées ; derrière lui, un volcan qui fume avec des coulées rouges.
  - `SECOND EARTH PANO/STILLS/collé-20261123-141136 · étendre.png` : Seed, enveloppée dans une grosse fourrure brune, serre Rob1 contre elle ; elle regarde droit vers nous, le sol derrière est blanc de neige ou de givre.
  - `SECOND EARTH PANO/STILLS/collé-20261123-142136 · étendre.png` : Seed marche dans une eau turquoise peu profonde, parmi des coussins blanc-bleu à base orange ; derrière elle, un grand robot sombre courbé porte Rob1 sur son dos.
  - `SECOND EARTH PANO/STILLS/collé-20261123-142938 · étendre.png` : Seed debout, Rob1 assis à sa droite et un grand robot à sa gauche, sur un rebord de roche jaune, entre de hautes parois jaunes à couches ; ciel bleu.
  - `SECOND EARTH PANO/STILLS/collé-20261123-143218 · étendre.png` : Très gros plan sur la tête d'un animal à poils gris et blancs, avec un œil ambre et de grosses cornes courbes et striées.
  - `SECOND EARTH PANO/STILLS/collé-20261123-143305 · étendre.png` : Des animaux à longs poils blancs, avec deux grandes cornes en V, avancent vers nous dans la poussière, devant de grandes formes brun-rouge en champignon.
  - `SECOND EARTH PANO/STILLS/collé-20261123-143403 · étendre.png` : Gros plan sur la tête d'un animal à long bec noir, œil rouge, deux cornes noires et plumes ou poils rouges et noirs, devant des rochers gris flous et un ciel bleu.
  - `SECOND EARTH PANO/STILLS/collé-20261123-151948 · étendre.png` : Gros plan sur la tête d'un oiseau à plumes blanches, orange et noires, bec sombre crochu, placé à droite ; les deux tiers gauches sont un fond flou clair.
  - `SECOND EARTH PANO/STILLS/collé-20261123-152036 · étendre.png` : Un oiseau blanc tacheté à longue queue noire marche sur du sable blanc au bord d'un bassin d'eau calme, entouré de formations blanches en forme de corail et d'arches translucides.
  - `SECOND EARTH PANO/STILLS/collé-20261123-152132 · étendre.png` : Un grand animal blanc à taches bleues, avec une trompe, deux longues défenses et deux cornes, vu de face sur un sol rouge avec des buissons morts ; derrière lui une colonne de nuage sombre.
  - `SECOND EARTH PANO/STILLS/collé-20261123-152257 · étendre.png` : Le même grand animal blanc à taches bleues, avec trompe, défenses et cornes, sous la pluie, de trois quarts ; derrière lui une colonne de nuage sombre.
  - `SECOND EARTH PANO/STILLS/collé-20261123-152717 · étendre.png` : Quatre oiseaux à plumes orange, blanches et tachetées de noir sur un chemin de terre, au milieu de buissons rouges et de gros buissons jaunes en boule ; celui de devant baisse la tête, plumes dressées.
  - `SECOND EARTH PANO/STILLS/collé-20261123-152817 · étendre.png` : Un animal clair à long cou et à très grandes oreilles tendues à l'horizontale, mouillé, debout sous la pluie derrière des rochers noirs.
  - `SECOND EARTH PANO/STILLS/collé-20261123-152937 · étendre.png` : Deux grands singes à long poil crème et brun, un grand et un plus petit serré contre lui, dans une pente d'herbe bleue ; au fond des rochers dans la brume.
  - `SECOND EARTH PANO/STILLS/collé-20261123-153149 · étendre.png` : Un gros animal couvert de longs poils blancs et de mousse verte, à face rouge et griffes violettes, avance sur un sol de lave refroidie parcouru de filaments cuivrés ; au fond des volcans avec des coulées et de la fumée.
  - `SECOND EARTH PANO/STILLS/collé-20261123-153352 · étendre.png` : Un animal à quatre pattes, gris et blanc, à très longues oreilles noires dont les pointes brillent, gueule ouverte montrant les dents, devant un grand monticule éclairé d'orange au coucher du jour.
  - `SECOND EARTH PANO/STILLS/dos_bleu_perle_2_seul · recadrée 3106×1344 · étendre.png` : Un petit animal à carapace bleu sombre avec des perles rouges et de longues pattes orange courbes, sur un sol noir couvert de formes blanches en corolle dont le centre brille en orange.
  - `SECOND EARTH PANO/STILLS/hf_20261123_090404_ed1741a2-78aa-46b6-8546-4c1abb0ead8c.fb28afe923bd86dac4486d94982517616f1baecf946d30deae3712bb886ff86e.png` : Une capsule conique blanche descend sous trois grands ballons blancs au-dessus d'une forêt rouge couverte de nuages.
  - `SECOND EARTH PANO/STILLS/image · étendre (2).png` : Dans une immense caverne sombre, une petite silhouette en bas jaune descend le long d'une corde, entre de grandes masses en forme de nuage portées par des faisceaux de filaments.
  - `SECOND EARTH PANO/STILLS/images_196_2_35mm · étendre.png` : Seed, à genoux sur une plage de sable noir, souffle sur une poudre blanche dans sa main devant un buisson bleu couvert de givre ; mer agitée et ciel sombre percé par l'étoile.
  - `SECOND EARTH PANO/STILLS/mother_dessus · étendre.png` : Une station faite de modules hexagonaux blancs et dorés, avec des panneaux solaires aux deux bouts, vue de dessus au-dessus de la Terre ; à gauche le bord de la planète et le noir de l'espace.
  - `SECOND EARTH PANO/STILLS/nic007_alien_planet_red_and_yellow_and_b… · étendre.png` : Vue de très haut d'un grand cratère dans lequel coule un filet de lave, entouré de végétation rouge sombre et de neige ; l'horizon est courbe et une fumée noire monte au fond.
  - `SECOND EARTH PANO/STILLS/nic007_httpss.mj.run-t-eKAoG3yU_cinemati… · étendre.png` : Une vallée d'herbe verte entre de hautes falaises, avec un grand rocher en forme d'œuf au centre, des arbres à cime plate et des souches ou pierres ocre au sol.
  - `SECOND EARTH PANO/STILLS/rapace_case4 · recadrée 1620×688 · étendre.png` : Gros plan sur un animal volant à tête de rapace, écailles ou plumes bleues, touffes rouges et bec gris, ailes ouvertes ; la moitié gauche est un fond flou gris et rouge.
  - `SECOND EARTH PANO/STILLS/rapace_case4 · recadrée 1621×687 · étendre.png` : Un animal volant bleu et blanc à tête de rapace et longue queue vole au ras d'une eau calme où il se reflète, entre des rives de roche claire et des arbres rouges.
  - `SECOND EARTH PANO/STILLS/rouge_noir_cornes_case2 · recadrée 1617×… · étendre.png` : Un animal à long poil rouge et noir, pattes blanches, petites cornes et longue queue, debout au bord d'une mare où il se reflète, dans des collines d'herbe rose avec des pics de roche sombre.

- **Seed et Rob1, à utiliser seulement sur le passage indiqué** (31) : voir la page d'inventaire, filtre « Bon en partie ».
- **Ce qui manque** : aucun fichier sur la naissance de Seed, la capsule qui tombe dans le gouffre, les lacs roses et pourpres, les Titans, le message vers la Terre ; une seule bonne vidéo avec le grand robot (20_feu_de_camp). Prévoir des emplacements vides pour ces moments.

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
