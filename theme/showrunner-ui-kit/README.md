# Showrunner UI Kit — thème Verdant (export statique)

13 pages HTML autonomes. Ouvrir `kit-ui-sommaire.html` (point d'entrée), ou servir le dossier :

```
python3 -m http.server 8000
```

Les pages se lient entre elles par liens relatifs. `support.js` doit rester à la racine du dossier, `uploads/` aussi (fonte Venus Rising).

## Pages

| Fichier | Contenu |
|---|---|
| kit-ui-sommaire.html | Sommaire de la série, index des pages |
| kit-ui-systeme.html | Système : blocs, tuiles, chiffres, cadrans, contrôles |
| kit-ui-decoupage.html | Découpage / dépouillement |
| kit-storyboard.html | Storyboard |
| kit-image.html | Atelier image (calques, courbes, avant/après, export) |
| kit-montage.html | Montage (source/programme, timeline, scopes, étalonnage) |
| banc-nl-montage.html | Banc de montage NL |
| kit-musique.html | Station musique |
| station-nl-rack.html | Canvas modulaire + modules DR-9 / Spectra / Polynome + baie 19" |
| kit-voix.html | Cabine voix (prises, rythmo, spectre, ADR) |
| kit-3d.html | Atelier 3D |
| kit-canvas.html | Canvas nodal |
| kit-admin.html | Admin / production |

## Structure d'une page

Chaque fichier est un document HTML complet :

- `<style>` en tête : `@font-face`, variables CSS `:root` (palette), resets, règles `h1/h2/p`.
- `<x-dc>` : le markup, styles en inline uniquement.
- `<script data-dc-script>` : `class Component extends DCLogic { state, renderVals(), … }`. `renderVals()` renvoie les valeurs injectées dans les trous `{{ }}` du markup.
- `support.js` : petit runtime qui compile le markup en React et monte le composant.

## Direction artistique

- Fond `#0a0d0b`. Rampe corail `#f0b49b → #e59578 → #d47a5c → #a3502f → #7a3a22`, rampe vert profond `#2f6b4a → #24543b → #1a3f2c`, accent `#e0674a`, encre bleutée `#b9cfd8`.
- Typo : titres, noms de page et **tous les chiffres** en Venus Rising ; texte courant et boutons en Chakra Petch ; micro-étiquettes en Azeret Mono 8.5–9.5 px, uppercase, letter-spacing .14–.2em.
- Filets 1 px colorés, rayons 10–18 px, pas de dégradés, pas d'emoji, contraste ≥ 4.5 sur couleur pleine.
