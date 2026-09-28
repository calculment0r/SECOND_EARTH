# Site de présentation Second Earth · spécification

Un site statique hébergé sur GitHub (GitHub Pages) qui présente le projet et héberge les outils de fabrication. L'outil de prompts vient en premier (`site-spec/outil-prompts.md`).

**Construit le 28/09/2026** : voir CLAUDE.md, section 10. Cal a tranché dans le chat : tout se publie (« la bible, le bestiaire etc, mais aussi le script, tout »), dépôt public `calculment0r/SECOND_EARTH`, thème Verdant (`site-spec/charte.md`). Les sections ci-dessous restent comme spécification d'origine.

## 1. Publication et confidentialité (à trancher par Cal en QCM)

Faits à lui présenter (vérifiés le 28/09/2026 sur la documentation GitHub, à revérifier) :
- **GitHub Free** : Pages seulement depuis un dépôt **public**.
- **GitHub Pro / Team** : Pages possible depuis un dépôt privé, mais **le site publié est public** (toute personne qui a l'adresse le lit).
- **GitHub Enterprise Cloud** : seul plan où l'on peut restreindre l'accès au site publié.

Le contenu contient des éléments non annoncés (récit complet, découpage, notes pour la cliente, montant du grant visé). Options à présenter avec leurs conséquences :
1. Tout public.
2. Public sans le récit, le découpage ni les notes pour Nina.
3. Seulement l'outil de prompts et la carte en ligne ; le reste en local.
4. Accès restreint (Enterprise Cloud, ou un autre hébergeur avec mot de passe).

**Dans tous les cas, `sources/` ne se publie pas** (docx de Cal, archives, PDF de février) et n'entre pas dans le dépôt : le `.gitignore` du dossier l'exclut déjà.

## 2. Structure proposée

```
/                      Accueil : Second Earth en une page (le film, la planète, l'expo)
/prompts/              L'outil de prompts Midjourney (priorité 1)
/monde/                Korê : le système, la planète, la vie, l'histoire profonde, lumière et couleurs, lunes et marées
/carte/                La carte interactive v3 (carte/carte-kore.html, déjà prête)
/biomes/               Les 10 biomes du trajet dans l'ordre du voyage, puis les 8 hors trajet
/bestiaire/            Les 66 espèces et 7 Titans (fiches, filtres par biome)
/flore/                Les 42 plantes
/science/              L'étude Phosphore, biomasse et seconde Terre ; la note science
/film/                 Architecture 25 / 55, séquencier, modules (selon la décision de confidentialité)
/expo/                 Salle immersive (esquisse), cartels par acte, principe SUR TERRE / SUR KORÊ / POURQUOI
/arbitrages/           Le registre des décisions (lecture) et la page QCM des rounds
```

Chaque page reprend le contenu des fichiers de `docs/` sans le réécrire. Les statuts (validé avec son round, proposé) restent visibles.

## 3. Technique

- HTML, CSS et JavaScript simples, sans framework obligatoire. Si un générateur est utile, le choisir léger et le justifier à Cal (un script Python qui transforme `docs/*.md` et `data/*.json` en pages suffit).
- Publication : branche `main`, dossier `/site` ou `/docs` du dépôt, ou une GitHub Action qui construit puis publie.
- Pas de dépendance à un service extérieur au moment de la lecture, hors Google Fonts.
- Chaque page suit `site-spec/charte.md` (thème clair, accent `#ff5200`, recette iOS, pas de bascule sombre).
- La carte (`carte/carte-kore.html`) est déjà autonome : la copier telle quelle ; son générateur (`carte/*.py`) sert seulement si la carte change.

## 4. Mise à jour du contenu

Les documents vivants sont dans Claude Docs (compte de Cal). Quand ils changent :
1. réexporter les onglets concernés en Markdown (`tools/xml2md.py` convertit la lecture d'un document Claude Docs) ;
2. relancer `python3 tools/build_data.py` ;
3. reconstruire les pages.

## 5. Ordre de travail

1. QCM de départ (CLAUDE.md section 8).
2. Outil de prompts, testé.
3. Dépôt, `.gitignore` (dont `sources/`), GitHub Pages.
4. Accueil, carte, bestiaire, flore, biomes.
5. Monde, science, expo, film selon la décision de confidentialité.
