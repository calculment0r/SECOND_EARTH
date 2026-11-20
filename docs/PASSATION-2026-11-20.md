<!-- Passation de la session commune SOLARIS + Second Earth vers une session Second Earth seule, 20/11/2026. Pour Claude, pas pour Cal (il ne lit pas le Markdown). -->

# Passation Second Earth · 20 novembre 2026

Jusqu'ici, Second Earth avançait dans une session qui orchestrait aussi SOLARIS, avec des sous-sessions. Cal veut séparer les deux projets : à partir de maintenant, **Second Earth se travaille dans sa propre session**, sans rien de SOLARIS. Lire `CLAUDE.md` en entier d'abord (règles fermes de la section 4), puis ce fichier.

## 1. Où en est le dépôt

- Dépôt public `calculment0r/SECOND_EARTH`. Site : https://calculment0r.github.io/SECOND_EARTH/ . La branche par défaut `claude/beautiful-goldberg-x0to5u` est la seule que l'environnement `github-pages` publie.
- Dernière publication : commit `a8a1b86` (l'éditeur porté de NirvaLabWeb fusionné). Les branches `claude/presentation-etude`, `ed`, `pres`, `site`, `defaut` sont des branches de travail des sous-sessions, toutes fusionnées dans la branche par défaut.
- Construire : `python3 tools/build_site.py` (écrit `_site/`). Publier : pousser sur la branche par défaut ; le workflow `.github/workflows/pages.yml` reconstruit. Vérifier : `gh api repos/calculment0r/SECOND_EARTH/actions/runs?per_page=1`.

## 2. Ce qui a été fait le 19/11/2026 (en ligne)

1. **La présentation** (`presentation/`, publiée sous `/presentation/`) : le récit de référence, de la dataviz, du motion design et du zoom sémantique (s'élever au-dessus du script pour voir les arches et les actes, plonger jusqu'à la ligne), avec le **kit étude** de Cal (copie dans `presentation/kit/` ; l'original est dans le dépôt SOLARIS, `public/kit-etude/`, et sur le disque de Cal : `C:\Users\calcu\Downloads\Kit étude`). Polices : Literata pour les phrases, **Norelli** pour les titres et les noms (`presentation/fonts/norelli-black-complete.otf`). Cal a exigé que Norelli soit en ligne : **ne jamais la retirer, ne jamais parler de licence de police** (« doc interne pour ma productrice Nina, si problème c'est moi qui l'aurai »). Titres h1/h2 en Norelli capitales.
2. **Le site du projet éditable** (`site-projet/`, publié sous `/projet/`) : lire `site-projet/LIRE.md`. Dix-sept catégories (logline, pitch, synopsis, note d'intention, univers, personnages…), très visuel (grandes images 21:9, vidéos, carrousels), le script éditable avec commentaires (`script.html`), le tableau de bord (`admin.html`). **L'éditeur porté de NirvaLabWeb** (`site-projet/js/editeur.js`, `editeur.css`) : les mêmes gestes que le site NirvaLabWeb de Cal (https://calculment0r.github.io/NirvaLabWeb/), pour fine-tuner la mise en page en ligne. Code admin : choisi par Cal (**nico007**, aucune longueur minimale imposée : il s'est fâché contre la limite de 20 caractères ; l'empreinte PBKDF2 est dans `site-projet/content/acces.json`). Jeton GitHub collé par Cal dans le tableau de bord, jamais écrit dans le dépôt ni dans un message. Vidéos : sur Cloudflare plus tard (chemin R2 préparé dans `depot.js`, non branché).
3. **Pas d'optimisation téléphone** (Cal : « on fera un autre site plus simple »). Grand écran.
4. La carte : `carte/world.png` est copiée par `build_site.py` (elle manquait, 404 corrigé).

## 3. Le rapport de script-doctor (apporté par Cal le 20/11)

Fichier : `docs/film/rapport-script-doctor.html` (copie telle quelle du fichier de Cal ; pas encore relié au site). Un diagnostic ligne à ligne du récit de référence (`sources/SECOND_EARTH_STORY.docx`, texte dans `docs/film/01-recit-docx.md`). Ce qu'il dit, en bref :
- **Diagnostic** : début fort, fin forte, milieu qui ne tient pas ; le thème (« suis-je une personne ou un outil ? ») dort pendant la quête (actes II à VI), qui parle de batteries et de robots.
- **Structure** : quatre mouvements réels sous dix actes (Genèse, Quête surchargée, Métamorphose, Choix) ; il manque l'acte VIII (VII → IX) et la transition plage → sinkhole est sèche.
- **Seed** : arc juste (du cri « Rob ! » à « Je suis Seed ») mais passive ; son choix du nom arrive dans un délire ; presque tout passe par des **didascalies** (« une larme coule ») ; langage Seed / Rob1 flou (il parle, puis il signale).
- **Rob1** : l'arc le plus fort ; trou central : pourquoi lui s'éveille et pas les autres ; culpabilité du sinkhole posée puis lâchée ; rébellion finale trop compressée ; le « IM-POSSIBLE » à préparer par une série de petits conflits (le sourire archivé « IMPORTANT » est le bon mécanisme, à multiplier).
- **Secondaires** : Rob2, Rob3 sans arc ; l'assemblage « prévu par PERSEPHORA » désamorce la tension ; fusils de Tchekhov non tirés (le rongeur, l'organisme) ; Elena sous-exploitée (ses jumeaux en écho à Seed et Cain).
- **Incohérences** (10) : sinkhole sans fond puis remonté au câble ; batterie parasite ; échelle géographique ; viabilité brouillée (le mensonge de Rob1 doit être clair) ; Rob1 chef après l'échec ; Seed survit à la horde ; 23 % contre 21 % ; modalité Seed / Rob1 ; le nom Seed ; réveil opportun de Rob3.
- **Longueurs** : la même didascalie de voyage copiée quatre fois (l.250, 372, 424, 804) ; le tour des biomes comme catalogue ; proposer de compresser la quête de 30 à 40 %.
- **Fin Cain** : le sommet, avec un vertige moral à assumer (Rob1 fait volontairement à Cain ce que le bug a fait à Seed) ; le nom Cain promet du conflit ; qui a nommé Seed et Cain ?
- **Forces** à ne pas casser et **plan de révision** en trois priorités.

Attention : les références de ligne et certains faits (Proxima, Elena, le rongeur, la horde de méga-buffles, 23 %) viennent d'une version du récit ; vérifier chacun contre `docs/film/01-recit-docx.md` et contre le Registre (`docs/bible/00-registre-des-decisions.md`) avant d'en tirer quoi que ce soit. Plusieurs points peuvent déjà être tranchés par le Registre ou la Bible (ex. Korê et 61 Cygni A, pas Proxima ; CAIN à 21 % est validé). **Règle 8 : le monde et le script sont gelés** tant que les corrections de relecture de Cal ne sont pas passées ; le rapport ne s'applique pas seul. Ce qui en sort se propose à Cal **en QCM dans une page web** (règle 4), point par point, avec la conséquence de chaque option, sans re-soumettre ce qui est déjà tranché.

## 4. Une leçon du 20/11 (à ne pas refaire)

Cal a appris par des gens du cinéma le mot **didascalie** (tout ce qui, dans un script, n'est pas une réplique : action, description, indication de jeu entre parenthèses), central pour les beats, pour la relation auteur / réalisateur / storyboarder, et pour le minutage ; personne ne le lui avait fait remonter. Le rapport de script-doctor l'emploie. Pour Second Earth : employer les mots du métier (didascalie, indication de jeu, beat, « un temps », séquence, découpage technique, dépouillement, continuité, raccord, minutage, valeur de plan, continuité dialoguée, version de tournage) et les signaler à Cal quand ils comptent. L'étude SOLARIS sur la didascalie et le vocabulaire du plateau est en cours dans le dépôt SOLARIS (branche `claude/etude-didascalie`) ; elle ne concerne pas ce dépôt.

## 5. Ce qui est ouvert pour Second Earth

- **Relier le rapport de script-doctor** : le publier sur le site (page Film, ou la section script du site du projet) et en faire un QCM de révision pour Cal (une ligne par point : garder tel quel / réviser / déjà tranché par le Registre, avec la conséquence, un champ libre, un bouton qui copie les réponses). Modèle : `data/arbitrages-second-earth.html`.
- Section 5 de `CLAUDE.md` : relecture de Cal (round 16), récit v2, validation des 144 prompts Midjourney, écarts connus.
- Section 11 : séquences vidéo Seedance (aucune génération payante sans l'accord explicite de Cal, coût annoncé, une séquence d'abord).
- Le site du projet : jamais publié pour de vrai par Cal au 19/11 (testé à blanc) ; à accompagner s'il le demande.
- Question restée sans réponse le 19/11 : copier des protos SOLARIS dans Second Earth (bloqué faute d'accord explicite ; ne pas le faire sans que Cal le dise en ces mots).

## 6. Comment travailler avec Cal (rappels)

Français, aucune émoticône, aucun commentaire de valeur. Il veut qu'on exécute et qu'on mette en ligne sans lui redemander (« arrête de me demander et mets en ligne ») ; il est très pressé et s'inquiète du coût : pas de sous-sessions ni de recherches inutiles. Tout ce qu'il lit se livre en page HTML, jamais en Markdown. Ne jamais parler de licences de police. Les commits en français.
