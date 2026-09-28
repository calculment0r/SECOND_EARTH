#!/usr/bin/env python3
"""Construit la page de l'outil de prompts Midjourney de Second Earth.

Le gabarit tools/site/prompts.html contient trois marqueurs, remplacés ici :
  <!--SITE_CSS-->     la feuille commune site/assets/site.css, dans une balise <style>
  <!--SITE_HEADER-->  la barre de navigation du site (<header class="top">)
  <!--DATA-->         les données data/*.json, en blocs <script type="application/json">
La page lit ces blocs (fetch ne marche pas en file://).

Utilisation :
  build(root, header_html, site_css) -> str   (appelé par tools/build_site.py)
  python3 tools/build_prompts.py              (écrit _site/prompts/index.html pour essai)

Bibliothèque standard seulement.
"""
import json
import pathlib
import re
import shutil
import sys

TEMPLATE = pathlib.Path('tools') / 'site' / 'prompts.html'

# (id du bloc, fichier dans data/)
DATA_BLOCKS = [
    ('data-bestiaire', 'bestiaire.json'),
    ('data-flore', 'flore.json'),
    ('data-titans', 'titans.json'),
    ('data-planches', 'planches.json'),
    ('data-paysages', 'paysages.json'),
    ('data-palette-flore', 'palette-flore.json'),
]

MARKERS = ('SITE_CSS', 'SITE_HEADER', 'DATA')
MARKER_RE = re.compile(r'<!--(%s)-->' % '|'.join(MARKERS))

TEST_HEADER = ('<header class="top"><div class="top-in">'
               '<a class="brand" href="../index.html">Second Earth</a>'
               '</div></header>')


def _json_block(block_id, obj):
    """Bloc <script type="application/json"> sûr : aucun « </ » ni « <!-- » dans le texte."""
    text = json.dumps(obj, ensure_ascii=False, separators=(',', ':'))
    text = text.replace('</', '<\\/').replace('<!--', '<\\u0021--')
    return '<script type="application/json" id="%s">%s</script>' % (block_id, text)


def _fix_font_urls(css):
    """La page vit dans prompts/ : la police se trouve dans ../assets/fonts/."""
    css = css.replace("url('fonts/", "url('../assets/fonts/")
    css = css.replace('url("fonts/', 'url("../assets/fonts/')
    css = re.sub(r'url\(fonts/', 'url(../assets/fonts/', css)
    return css


def build(root, header_html, site_css):
    """Renvoie la page finale de l'outil de prompts.

    root        : racine du dépôt (pathlib.Path ou chaîne)
    header_html : barre de navigation du site (<header class="top">…</header>)
    site_css    : contenu de site/assets/site.css
    """
    root = pathlib.Path(root)
    template = (root / TEMPLATE).read_text(encoding='utf-8')
    for name in MARKERS:
        count = template.count('<!--%s-->' % name)
        if count != 1:
            raise ValueError('gabarit %s : marqueur <!--%s--> trouvé %d fois (attendu : 1)' % (TEMPLATE, name, count))

    blocks = []
    for block_id, filename in DATA_BLOCKS:
        data = json.loads((root / 'data' / filename).read_text(encoding='utf-8'))
        blocks.append(_json_block(block_id, data))

    parts = {
        'SITE_CSS': '<style>\n' + _fix_font_urls(site_css).strip() + '\n</style>',
        'SITE_HEADER': header_html,
        'DATA': '\n'.join(blocks),
    }
    # Un seul passage : le contenu inséré n'est jamais relu comme marqueur.
    return MARKER_RE.sub(lambda m: parts[m.group(1)], template)


def main():
    root = pathlib.Path(__file__).resolve().parent.parent
    site_css = (root / 'site' / 'assets' / 'site.css').read_text(encoding='utf-8')
    page = build(root, TEST_HEADER, site_css)
    out = root / '_site' / 'prompts' / 'index.html'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(page, encoding='utf-8')
    shutil.copytree(root / 'site' / 'assets', root / '_site' / 'assets', dirs_exist_ok=True)
    print('Écrit : %s (%d octets) ; assets copiés dans %s' % (
        out.relative_to(root), len(page.encode('utf-8')), (root / '_site' / 'assets').relative_to(root)))
    return 0


if __name__ == '__main__':
    sys.exit(main())
