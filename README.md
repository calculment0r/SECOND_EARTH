# Second Earth

Film de science-fiction (25 min, puis 55 min), salle immersive et exposition pour le Science Centre Singapore. Une planète inventée, Korê (61 Cygni Ab), construite comme un système physique avant d'être un décor.

Site : https://calculment0r.github.io/SECOND_EARTH/

Ce dépôt réunit le monde, les espèces, la science, le film et les outils de fabrication du projet, dont l'outil de prompts Midjourney, et le site qui les présente.

- Brief de reprise pour Claude : `CLAUDE.md` (section 10 pour le site)
- Même brief en page lisible : `BRIEF.html`
- Spécifications : `site-spec/`
- Données : `data/`
- Documents exportés : `docs/`
- Carte interactive : `carte/carte-kore.html`
- Thème du site (Verdant, Showrunner UI Kit) : `site/assets/`, référence dans `theme/showrunner-ui-kit/`

## Construire le site

```
python3 tools/build_site.py
```

Le site est écrit dans `_site/` (ouvrir `_site/index.html`). Sur GitHub, `.github/workflows/pages.yml` le reconstruit et le publie à chaque push ; réglage à faire une fois : Settings > Pages > Build and deployment > Source : GitHub Actions.

Le dossier `sources/` contient les documents d'origine de l'auteur. Il ne se publie pas et n'entre pas dans le dépôt.

NIRVALAB · 2026
