# Charte des interfaces · thème Verdant (Showrunner UI Kit)

Le 28/09/2026, Cal a fourni le Showrunner UI Kit (thème **Verdant**, rev 5.0, NIRVALAB) et demandé de l'appliquer au site. Il remplace, pour le site, le thème « Oblivion clair » (fond clair, accent `#ff5200`, Instrument Serif + DM Mono) décrit dans les versions précédentes de ce fichier.

- Référence visuelle : `theme/showrunner-ui-kit/` (13 pages ; point d'entrée `kit-ui-sommaire.html` ; `kit-ui-systeme.html` pour les composants). Ces pages utilisent un petit moteur React chargé depuis unpkg (`support.js`) : elles servent de modèle, le site ne les réutilise pas telles quelles.
- Mise en œuvre sur le site : `site/assets/site.css` (jetons et composants), `site/assets/site.js` (menu, copie, filtres), gabarit dans `tools/build_site.py`.
- La carte (`carte/carte-kore.html`) et la page QCM (`data/arbitrages-second-earth.html`) gardent leur CSS d'origine (Oblivion clair) dans le dépôt ; la construction du site les convertit en Verdant (fonction `verdantize` de `tools/build_site.py` : jetons remplacés, polices, contrastes des boutons, étiquettes de la carte).

## Règles

- Fond presque noir `#0a0d0b`, panneaux `#101413` / `#151a18` / `#1b211e`. Pas de bascule clair / sombre.
- Deux familles de couleur : **rampe corail** `#f0b49b → #e59578 → #d47a5c → #a3502f → #7a3a22` (blocs empilés, action principale) et **vert profond** `#2f6b4a → #24543b → #1a3f2c` (tuiles, statut validé). Accent `#e0674a` ; encre bleutée `#b9cfd8` (liens, sous-titres).
- L'accent corail marque l'action principale : bouton Copier, onglet ou rubrique active, focus.
- Typographie :
  - **Venus Rising** pour les titres, les noms de page et les chiffres (fichier `site/assets/fonts/venus-rising.otf`, fourni avec le kit) ;
  - **Chakra Petch** pour le texte courant et les boutons ;
  - **Azeret Mono** pour les micro-étiquettes : 8.5–9.5 px, majuscules, `letter-spacing` .14–.22em.
  - Google Fonts : `https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=Saira+Semi+Condensed:wght@400;500;600;700&family=Azeret+Mono:wght@300;400;500&display=swap`
- Blocs pleins, filets de 1 px, rayons 10–18 px, pas de dégradé (la trame de points des blocs corail est un motif, pas un dégradé), pas d'ombre lourde, contraste d'au moins 4,5 sur couleur pleine (texte `#170c08` sur corail).
- Statuts visibles partout : pastille verte « validé », pastille corail en filet « proposé », filet gris « origine » / « recalé », filet bleuté « nouveau ».
- Surbrillance : on voit ce que c'est (une fiche lisible), pas seulement une pastille ; un clic maintient, un clic dans le vide relâche.
- Aucune émoticône.

## Jetons

```css
:root{
  color-scheme: dark;
  --bg:#0a0d0b; --panel:#101413; --panel2:#151a18; --panel3:#1b211e;
  --ink:#e6eae7; --body:#c9d2cd; --ink2:#9ca8a2; --ink3:#7c8884; --cy:#b9cfd8;
  --or:#e0674a; --or-ink:#170c08;
  --c1:#f0b49b; --c2:#e59578; --c3:#d47a5c; --c4:#a3502f; --c5:#7a3a22;
  --g1:#2f6b4a; --g2:#24543b; --g3:#1a3f2c;
  --display:'Venus Rising','Chakra Petch',sans-serif;
  --text:'Chakra Petch',sans-serif;
  --mono:'Azeret Mono',ui-monospace,monospace;
}
```

## App iOS

Constaté par Cal (17/08/2026) : la visionneuse de l'app iOS repeint le fond de `html`/`body` en sombre. Avec un thème sombre, ce n'est plus un risque de texte illisible ; la feuille garde pourtant un fond explicite (`html,body{background-color:var(--bg)!important}` et `body::before`) pour que le rendu ne dépende pas de la visionneuse. Un filtre sur `html` casse `position:fixed` : les barres collantes sont en `position:sticky`.

## Mise en page

- Ordinateur : barre du haut collante ; colonne de navigation de ~268 px collante à gauche (sommaire de la rubrique et titres de la page), contenu jusqu'à ~1320 px, texte courant limité à ~78 caractères.
- Téléphone (< 820 px) : une colonne, marges de 16 px, menu replié en haut, sommaire de la rubrique repliable, aucun défilement horizontal de la page (les tableaux défilent seuls).
- Boutons : filet clair, rayon plein ; bouton principal fond corail, texte `#170c08`.
