# Site du projet (site-projet/)

Fait le 19/11/2026 à la demande de Cal : un site très visuel par catégories (logline, synopsis, personnages…), éditable en ligne sur le principe de son site NirvaLabWeb, avec le script à corriger et à commenter. Le code est écrit pour ce dépôt ; aucun fichier de NirvaLabWeb n'y est recopié (l'accès à ce dépôt a été refusé à la session, le principe vient de la description donnée).

Publié par `tools/build_site.py` dans `_site/projet/` (adresse : `/projet/`). Thème : le kit étude (`presentation/kit/`), aucune couleur écrite hors de ses jetons.

## Les fichiers

| Fichier | Rôle |
|---|---|
| `index.html`, `script.html`, `admin.html` | Gabarits. La construction y pose le contenu publié (`<!--PUBLIE-->`) et le script découpé (`<!--SCRIPT-->`). |
| `projet.css` | La mise en page : ouverture plein écran, bandeaux 21:9, carrousels, script, tableau de bord. |
| `js/depot.js` | Contenu publié, brouillon local (localStorage, IndexedDB pour les médias), rôles par code (PBKDF2), jeton GitHub chiffré (AES-GCM), publication en un commit (API Git de GitHub). |
| `js/commun.js` | Éléments, panneaux, connexion, barre du bas (pastille de brouillon, « Éditer la page »). |
| `js/page.js` | La page des catégories : dessin des blocs, édition sur place, dépôt de médias, carrousels. |
| `js/script.js` | La page du script : lecture, correction par paragraphe, commentaires en marge. |
| `js/admin.js` | Le tableau de bord : accès, brouillon, publier, Cloudflare, sécurité. |
| `content/site-content.json` | Le contenu des catégories. Préparé une fois par `tools/prepa_site_projet.py` ; ensuite c'est le site qui l'écrit (« Publier »). Ne pas relancer le script de préparation sans `--force`, et jamais après une publication de Cal. |
| `content/script-modifs.json` | Les corrections de Cal sur le script : `{id du paragraphe: {texte, date, auteur, historique}}`. `docs/film/01-recit-docx.md` n'est jamais modifié. |
| `content/commentaires.json` | Les fils de commentaires : `{fils: [{id, para, extrait, auteur, date, texte, regle, reponses}]}`. |
| `content/acces.json` | Les empreintes des codes (admin, invité). Jamais de code en clair. |
| `content/deploy-key.json` | Absent par défaut. Le jeton GitHub chiffré, seulement si Cal coche la case dans le tableau de bord. |
| `content/media/` | Les images publiées (WebP, bord long 2560 px). Les vidéos n'y vont pas. |

## Règles

- Claude ne change pas un mot du script (règle 8 du brief) : l'outil sert à Cal. Une correction publiée vit dans `script-modifs.json`, avec l'ancien texte dans `historique`.
- L'identité d'un paragraphe = sa partie + une empreinte de son texte d'origine (`script_paragraphes` dans `build_site.py`). Si le docx est réexporté et qu'un paragraphe change, sa correction et ses commentaires deviennent orphelins (les commentaires s'affichent en fin de page).
- Types de blocs : `ouverture`, `texte`, `media`, `carrousel`, `chiffres`, `citation`, `liens`. Statut d'un bloc : `proposé`, `validé`, `manque` ou vide.
- Aucun secret dans le dépôt ni dans un message : le code admin est choisi par Cal dans le tableau de bord, le jeton GitHub y est collé par lui seul.
- La publication écrit sur la branche par défaut du dépôt (celle que Pages publie), sauf si une branche est saisie dans le tableau de bord.

## Ce qui reste faible

- Jamais publié pour de vrai : la publication est testée à blanc seulement (pas de jeton dans la session). Le premier « Publier » de Cal est le vrai test.
- Un invité ne peut pas publier ses commentaires : il les copie, Cal les importe.
- Deux admins qui publient en même temps : le dernier gagne (pas de fusion).
- Les vidéos : rien n'est branché côté Cloudflare ; le lien Cloudflare Stream est transformé en lecteur intégré sans avoir été essayé avec un vrai compte.
- Pas d'annulation (Ctrl+Z ne défait que la frappe en cours) ; « Abandonner le brouillon » revient à la version publiée.
- Texte brut seulement dans les blocs (pas de gras ni de lien dans un paragraphe).
