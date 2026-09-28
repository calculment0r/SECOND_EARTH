#!/usr/bin/env python3
"""Construit le site Second Earth (GitHub Pages) dans _site/.

Entrées : docs/**/*.md, data/*.json, carte/carte-kore.html, data/arbitrages-second-earth.html,
site/assets/ (thème Verdant), tools/site/prompts.html (outil de prompts, via tools/build_prompts.py).
Bibliothèque standard seulement. Usage : python3 tools/build_site.py [--out _site]
"""
import html
import json
import re
import shutil
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / 'docs'
DATA = ROOT / 'data'
ASSETS = ROOT / 'site' / 'assets'
SITE_DATE = '28/09/2026'

FONTS_URL = ('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700'
             '&family=Saira+Semi+Condensed:wght@400;500;600;700&family=Azeret+Mono:wght@300;400;500&display=swap')

# ---------------------------------------------------------------------------
# Plan du site
# ---------------------------------------------------------------------------

NAV = [
    ('bible', 'Bible', 'bible/index.html'),
    ('biomes', 'Biomes', 'biomes/index.html'),
    ('bestiaire', 'Bestiaire', 'bestiaire/index.html'),
    ('flore', 'Flore', 'flore/index.html'),
    ('planches', 'Planches', 'planches/index.html'),
    ('carte', 'Carte', 'carte/index.html'),
    ('science', 'Science', 'science/index.html'),
    ('film', 'Film', 'film/index.html'),
    ('expo', 'Expo', 'expo/index.html'),
    ('arbitrages', 'Arbitrages', 'arbitrages/index.html'),
]

# (slug, fichier dans docs/, nom court, groupe de la colonne)
SECTIONS = {
    'bible': {
        'title': 'Bible', 'ref': '02_bible',
        'lede': "Le monde de Korê tel qu'il est validé : les décisions, le voyage, la planète, son histoire profonde et son vocabulaire. Les biomes ont leur propre rubrique.",
        'pages': [
            ('registre', 'bible/00-registre-des-decisions.md', 'Registre des décisions', 'Décisions'),
            ('trajet', 'bible/01-trajet-de-seed.md', 'Trajet de Seed', 'Le voyage'),
            ('chronologie', 'bible/02-chronologie-du-voyage.md', 'Chronologie du voyage', 'Le voyage'),
            ('continents-et-oceans', 'bible/31-continents-et-oceans.md', 'Continents et océans', 'La planète'),
            ('geologie-et-plaques', 'bible/36-geologie-et-plaques.md', 'Géologie et plaques', 'La planète'),
            ('lumiere-et-couleurs', 'bible/33-lumiere-et-couleurs.md', 'Lumière et couleurs', 'La planète'),
            ('lunes-marees-et-calendrier', 'bible/35-lunes-marees-et-calendrier.md', 'Lunes, marées et calendrier', 'La planète'),
            ('titans', 'bible/30-les-titans.md', 'Les Titans', 'Histoire profonde'),
            ('glossaire', 'bible/34-glossaire.md', 'Glossaire', 'Vocabulaire'),
        ],
    },
    'biomes': {
        'title': 'Biomes', 'ref': '03_biomes',
        'lede': "Les dix biomes du trajet de Seed, dans l'ordre du voyage, puis les huit biomes hors trajet que la planète doit avoir pour être crédible.",
        'pages': [
            ('jungle', 'bible/10-biome-01-jungle.md', 'Jungle primordiale', 'Le trajet'),
            ('pitons-karstiques', 'bible/11-biome-pitons-karstiques.md', 'Pitons karstiques', 'Le trajet'),
            ('cavernes', 'bible/12-biome-02-cavernes.md', 'Terres rocheuses et cavernes', 'Le trajet'),
            ('massifs-et-glaciers', 'bible/13-biome-massifs-et-glaciers.md', 'Massifs et glaciers', 'Le trajet'),
            ('foret-bioluminescente', 'bible/14-biome-foret-bioluminescente.md', 'Forêt bioluminescente', 'Le trajet'),
            ('hautes-plaines', 'bible/15-biome-hautes-plaines.md', 'Hautes Plaines', 'Le trajet'),
            ('foret-ancienne', 'bible/16-biome-foret-ancienne.md', 'Forêt ancienne', 'Le trajet'),
            ('course-volcanique', 'bible/17-biome-course-volcanique.md', 'Course vers la mer', 'Le trajet'),
            ('mer-d-arsenic-et-fosse', 'bible/18-biome-mer-d-arsenic-et-fosse.md', "Mer d'arsenic et fosse", 'Le trajet'),
            ('lacs-sales-pourpres', 'bible/19-biome-lacs-sales-pourpres.md', 'Lacs salés pourpres', 'Le trajet'),
            ('hors-trajet', 'bible/20-biomes-hors-trajet.md', "Vue d'ensemble", 'Hors trajet'),
            ('ht-1-grands-deserts', 'bible/hors-trajet/ht-1-grands-deserts.md', 'Grands déserts', 'Hors trajet'),
            ('ht-2-savanes-a-feu', 'bible/hors-trajet/ht-2-savanes-a-feu.md', 'Savanes à feu', 'Hors trajet'),
            ('ht-3-forets-des-moyennes-latitudes', 'bible/hors-trajet/ht-3-forets-des-moyennes-latitudes.md', 'Forêts des moyennes latitudes', 'Hors trajet'),
            ('ht-4-toundra-polaire', 'bible/hors-trajet/ht-4-toundra-polaire.md', 'Toundra polaire', 'Hors trajet'),
            ('ht-5-mangroves-et-cotes-a-marees', 'bible/hors-trajet/ht-5-mangroves-et-cotes-a-marees.md', 'Mangroves et côtes à marées', 'Hors trajet'),
            ('ht-6-recifs-de-silice', 'bible/hors-trajet/ht-6-recifs-de-silice.md', 'Récifs de silice', 'Hors trajet'),
            ('ht-7-remontees-et-iles-a-guano', 'bible/hors-trajet/ht-7-remontees-et-iles-a-guano.md', 'Remontées et îles à guano', 'Hors trajet'),
            ('ht-8-biosphere-profonde', 'bible/hors-trajet/ht-8-biosphere-profonde.md', 'Biosphère profonde', 'Hors trajet'),
        ],
    },
    'film': {
        'title': 'Film', 'ref': '07_film',
        'lede': "Le film de 25 minutes, construit pour que le 55 minutes se fabrique ensuite par ajout : le récit, l'architecture, le séquencier, les modules, le découpage plan par plan.",
        'pages': [
            ('recit-docx', 'film/01-recit-docx.md', 'Récit de référence (docx)', 'Le récit'),
            ('recit-v2', 'film/00-recit-v2.md', 'Récit v2', 'Le récit'),
            ('journal-de-rob1', 'film/21-journal-de-rob1.md', 'Journal de Rob1', 'Le récit'),
            ('architecture-25-55', 'film/10-architecture-25-55.md', 'Architecture 25 / 55', 'Le 25 et le 55'),
            ('sequencier-25-min', 'film/11-sequencier-25-min.md', 'Séquencier 25 min', 'Le 25 et le 55'),
            ('modules-du-55', 'film/12-modules-du-55.md', 'Modules du 55', 'Le 25 et le 55'),
            ('decoupage-25-min', 'film/20-decoupage-25-min.md', 'Découpage 25 min', 'Le 25 et le 55'),
            ('propositions', 'film/13-propositions.md', 'Propositions', 'Travail'),
            ('ecarts-docx-bible', 'film/14-ecarts-docx-bible.md', 'Écarts docx / Bible', 'Travail'),
            ('notes-pour-nina', 'film/30-notes-pour-nina.md', 'Notes pour Nina', 'Travail'),
        ],
    },
    'expo': {
        'title': 'Expo', 'ref': '08_expo',
        'lede': "La salle immersive temps réel et l'exposition organisée par biome, avec ses cartels en trois temps : SUR TERRE / SUR KORÊ / POURQUOI.",
        'pages': [
            ('cartels-par-acte', 'bible/32-cartels-par-acte.md', 'Cartels par acte', "L'exposition"),
            ('salle-immersive', 'film/15-salle-immersive-esquisse.md', 'Salle immersive, esquisse', 'La salle immersive'),
        ],
    },
    'science': {
        'title': 'Science', 'ref': '06_science',
        'lede': '',
        'pages': [('index', 'science/phosphore-biomasse-et-seconde-terre.md', 'Phosphore, biomasse et seconde Terre', 'Étude')],
        'single': True,
    },
    'planches': {
        'title': 'Planches', 'ref': '05_planches',
        'lede': '',
        'pages': [('index', 'especes/planches-de-dessin.md', 'Planches de dessin', 'Document')],
        'single': True,
    },
}

TRAJET_ORDER = ['jungle', 'pitons', 'cavernes', 'massifs', 'foret-bio', 'hautes-plaines',
                'foret-ancienne', 'volcanique', 'mer-arsenic', 'lacs-sales']
GROUP_ORDER = TRAJET_ORDER + ['hors-trajet', 'continent-b', 'continent-c', 'continent-d', 'transversal']
GROUP_NAMES = {
    'jungle': 'Jungle primordiale', 'pitons': 'Pitons karstiques', 'cavernes': 'Terres rocheuses et cavernes',
    'massifs': 'Massifs et glaciers', 'foret-bio': 'Forêt bioluminescente', 'hautes-plaines': 'Hautes Plaines',
    'foret-ancienne': 'Forêt ancienne', 'volcanique': 'Course volcanique et zones de transition',
    'mer-arsenic': "Mer d'arsenic et fosse", 'lacs-sales': 'Lacs salés pourpres',
    'hors-trajet': 'Hors trajet', 'continent-b': 'Continent B', 'continent-c': 'Continent C',
    'continent-d': 'Continent D', 'transversal': 'Espèces transversales', 'titans': 'Galerie des Titans',
}
BIOME_PAGE = {  # biome_id -> page de la rubrique Biomes
    'jungle': 'jungle', 'pitons': 'pitons-karstiques', 'cavernes': 'cavernes', 'massifs': 'massifs-et-glaciers',
    'foret-bio': 'foret-bioluminescente', 'hautes-plaines': 'hautes-plaines', 'foret-ancienne': 'foret-ancienne',
    'volcanique': 'course-volcanique', 'mer-arsenic': 'mer-d-arsenic-et-fosse', 'lacs-sales': 'lacs-sales-pourpres',
    'hors-trajet': 'hors-trajet',
}

# Liens d'artefacts Claude (privés) remplacés par les pages du site
ARTIFACT_LINKS = {
    'https://claude.ai/artifact/PxfBWGF1dk4DJWuzUdXJvt': 'carte/index.html',
    'https://claude.ai/artifact/GBg169jA4N56T1hG1jukoK': 'arbitrages/qcm.html',
}


# ---------------------------------------------------------------------------
# Outils
# ---------------------------------------------------------------------------

def esc(s):
    return html.escape(str(s or ''), quote=True)


def slugify(s):
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn').lower()
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s or 'section'


def load_json(name):
    return json.loads((DATA / name).read_text(encoding='utf-8'))


def excerpt(text, n=230):
    text = re.sub(r'\s+', ' ', text).strip()
    if len(text) <= n:
        return text
    cut = text[:n].rsplit(' ', 1)[0].rstrip(',;:')
    return cut + ' …'


def strip_md(s):
    s = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', s)
    s = s.replace('**', '').replace('\\*', '*')
    s = re.sub(r'(?<![\w*])\*([^*]+)\*(?![\w*])', r'\1', s)
    return s.replace('`', '')


# ---------------------------------------------------------------------------
# Markdown -> HTML (le sous-ensemble produit par tools/xml2md.py)
# ---------------------------------------------------------------------------

class Ctx:
    """Contexte de rendu d'une page : préfixe relatif et tables de liens."""

    def __init__(self, prefix, codes, doc_links):
        self.prefix = prefix
        self.codes = codes          # code -> chemin (depuis la racine du site)
        self.doc_links = doc_links  # texte exact -> chemin
        if codes:
            alt = '|'.join(re.escape(c) for c in sorted(codes, key=len, reverse=True))
            self.code_re = re.compile(r'(?<![\w-])(' + alt + r')(?![\w-])')
        else:
            self.code_re = None


STATUS_BRACKET = re.compile(r'\[((?:validé|validée|validés|validées|proposé|proposée|proposés|proposées|tranché)[^\[\]<>]{0,160})\]', re.I)
STATUS_PAREN = re.compile(r'\(((?:validé|validée|validés|validées|proposé|proposée|proposés|proposées)(?:[^()<>]{0,120}))\)', re.I)


def status_class(word):
    w = word.strip().lower()
    if w.startswith(('validé', 'validée', 'tranché')):
        return 'st-ok'
    if w.startswith(('proposé', 'proposée', 'à rédiger', 'à trancher')):
        return 'st-prop'
    if w.startswith(('nouveau', 'nouvelle')):
        return 'st-new'
    if w.startswith(('recalé', 'origine')):
        return 'st-off'
    return 'st-off'


def inline(text, ctx):
    """Rendu en ligne : échappement, code, liens, gras, italique, statuts, codes d'espèce."""
    keep = []

    def stash(h):
        keep.append(h)
        return '\x00%d\x00' % (len(keep) - 1)

    # échappements Markdown
    text = re.sub(r'\\([\\`*_\[\]()#+\-.!|>])', lambda m: stash(esc(m.group(1))), text)
    # code
    text = re.sub(r'`([^`]+)`', lambda m: stash('<code>%s</code>' % esc(m.group(1))), text)

    # liens
    def link(m):
        label, url = m.group(1), m.group(2).strip()
        if url in ARTIFACT_LINKS:
            href = ctx.prefix + ARTIFACT_LINKS[url]
            return stash('<a href="%s">%s</a>' % (esc(href), inline(label, ctx)))
        ext = url.startswith('http')
        attrs = ' target="_blank" rel="noopener"' if ext else ''
        return stash('<a href="%s"%s>%s</a>' % (esc(url), attrs, inline(label, ctx)))
    text = re.sub(r'\[([^\]]+)\]\(([^)\s]+)\)', link, text)

    text = esc(text).replace('&#x27;', "'")

    # gras, italique
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])', r'<em>\1</em>', text)

    # statuts
    text = STATUS_BRACKET.sub(lambda m: stash('<span class="st %s">%s</span>' % (status_class(m.group(1)), m.group(1))), text)
    text = STATUS_PAREN.sub(lambda m: stash('<span class="st %s">%s</span>' % (status_class(m.group(1)), m.group(1))), text)

    # références à d'autres documents (texte exact d'une cellule ou d'un fragment)
    for label, path in ctx.doc_links.items():
        e = esc(label).replace('&#x27;', "'")
        if e in text:
            text = text.replace(e, stash('<a href="%s">%s</a>' % (esc(ctx.prefix + path), e)))

    # codes d'espèce
    if ctx.code_re:
        def code(m):
            c = m.group(1)
            return stash('<a class="code" href="%s">%s</a>' % (esc(ctx.prefix + ctx.codes[c]), c))
        parts = re.split(r'(<[^>]+>)', text)
        text = ''.join(p if p.startswith('<') else ctx.code_re.sub(code, p) for p in parts)

    while '\x00' in text:
        text = re.sub(r'\x00(\d+)\x00', lambda m: keep[int(m.group(1))], text)
    return text


def split_row(line):
    line = line.strip()
    if line.startswith('|'):
        line = line[1:]
    if line.endswith('|') and not line.endswith('\\|'):
        line = line[:-1]
    cells, cur, i = [], '', 0
    while i < len(line):
        ch = line[i]
        if ch == '\\' and i + 1 < len(line) and line[i + 1] == '|':
            cur += '\\|'
            i += 2
            continue
        if ch == '|':
            cells.append(cur.strip())
            cur = ''
        else:
            cur += ch
        i += 1
    cells.append(cur.strip())
    return cells


def render_table(lines, ctx):
    head = split_row(lines[0])
    body = [split_row(l) for l in lines[2:]] if len(lines) > 1 and re.match(r'^\|?\s*:?-{3,}', lines[1].strip()) else [split_row(l) for l in lines[1:]]
    st_cols = {i for i, h in enumerate(head) if strip_md(h).strip().lower() in ('statut', 'verdict')}
    out = ['<div class="tbl"><table><thead><tr>']
    out += ['<th>%s</th>' % inline(h, ctx) for h in head]
    out.append('</tr></thead><tbody>')
    for row in body:
        out.append('<tr>')
        for i, cell in enumerate(row):
            if i in st_cols and cell and not STATUS_BRACKET.search(cell):
                plain = strip_md(cell)
                out.append('<td><span class="st %s">%s</span></td>' % (status_class(plain), inline(cell, ctx)))
            else:
                out.append('<td>%s</td>' % inline(cell, ctx))
        out.append('</tr>')
    out.append('</tbody></table></div>')
    return ''.join(out)


def parse_md(text):
    """Découpe le Markdown en blocs : (type, données)."""
    lines = text.replace('\r', '').split('\n')
    blocks = []
    i, n = 0, len(lines)
    comments = []

    def is_start(l):
        s = l.strip()
        return (not s or re.match(r'^#{1,6} ', s) or s.startswith('```') or s.startswith('|')
                or s.startswith('> ') or s == '>' or re.match(r'^[-*] ', s) or re.match(r'^\d+\. ', s)
                or re.match(r'^-{3,}$', s) or s.startswith('<!--'))

    while i < n:
        l = lines[i]
        s = l.strip()
        if not s:
            i += 1
            continue
        if s.startswith('<!--'):
            buf = s
            while '-->' not in buf and i + 1 < n:
                i += 1
                buf += ' ' + lines[i].strip()
            comments.append(re.sub(r'^<!--\s*|\s*-->$', '', buf))
            i += 1
            continue
        m = re.match(r'^(#{1,6}) (.*)$', s)
        if m:
            blocks.append(('h', (len(m.group(1)), m.group(2).strip())))
            i += 1
            continue
        if s.startswith('```'):
            buf = []
            i += 1
            while i < n and not lines[i].strip().startswith('```'):
                buf.append(lines[i])
                i += 1
            blocks.append(('code', '\n'.join(buf)))
            i += 1
            continue
        if s.startswith('|'):
            buf = []
            while i < n and lines[i].strip().startswith('|'):
                buf.append(lines[i])
                i += 1
            blocks.append(('table', buf))
            continue
        if s.startswith('>'):
            buf = []
            while i < n and lines[i].strip().startswith('>'):
                buf.append(re.sub(r'^>\s?', '', lines[i].strip()))
                i += 1
            blocks.append(('quote', buf))
            continue
        if re.match(r'^-{3,}$', s):
            blocks.append(('hr', None))
            i += 1
            continue
        lm = re.match(r'^([-*]|\d+\.) (.*)$', s)
        if lm:
            ordered = lm.group(1)[0].isdigit()
            pat = r'^\d+\. (.*)$' if ordered else r'^[-*] (.*)$'
            items = []
            while i < n:
                cur = lines[i].strip()
                mm = re.match(pat, cur)
                if mm:
                    items.append(mm.group(1))
                    i += 1
                    continue
                if cur and items and not is_start(lines[i]):
                    items[-1] += ' ' + cur
                    i += 1
                    continue
                if not cur:
                    j = i
                    while j < n and not lines[j].strip():
                        j += 1
                    if j < n and re.match(pat, lines[j].strip()):
                        i = j
                        continue
                break
            blocks.append(('ol' if ordered else 'ul', items))
            continue
        buf = [s]
        i += 1
        while i < n and lines[i].strip() and not is_start(lines[i]):
            buf.append(lines[i].strip())
            i += 1
        blocks.append(('p', ' '.join(buf)))
    return blocks, comments


def render_blocks(blocks, ctx, ids):
    out = []
    for kind, data in blocks:
        if kind == 'h':
            level, txt = data
            level = max(2, level)
            sid = slugify(strip_md(txt))
            base, k = sid, 2
            while sid in ids:
                sid = '%s-%d' % (base, k)
                k += 1
            ids.add(sid)
            out.append('<h%d id="%s">%s</h%d>' % (level, sid, inline(txt, ctx), level))
        elif kind == 'p':
            out.append('<p>%s</p>' % inline(data, ctx))
        elif kind == 'ul':
            out.append('<ul>%s</ul>' % ''.join('<li>%s</li>' % inline(x, ctx) for x in data))
        elif kind == 'ol':
            out.append('<ol>%s</ol>' % ''.join('<li>%s</li>' % inline(x, ctx) for x in data))
        elif kind == 'table':
            out.append(render_table(data, ctx))
        elif kind == 'quote':
            paras, cur = [], []
            for l in data:
                if l.strip():
                    cur.append(l.strip())
                elif cur:
                    paras.append(' '.join(cur))
                    cur = []
            if cur:
                paras.append(' '.join(cur))
            out.append('<blockquote>%s</blockquote>' % ''.join('<p>%s</p>' % inline(p, ctx) for p in paras))
        elif kind == 'code':
            out.append('<div class="prompt"><div class="prompt-bar"><span class="lbl">Prompt</span>'
                       '<button type="button" class="btn pri" data-copy>Copier</button></div>'
                       '<pre>%s</pre></div>' % esc(data))
        elif kind == 'hr':
            out.append('<hr>')
    return '\n'.join(out)


class Doc:
    def __init__(self, path):
        self.path = path
        text = path.read_text(encoding='utf-8')
        blocks, comments = parse_md(text)
        self.source = comments[0] if comments else ''
        self.title = ''
        self.meta = ''
        self.lede = ''
        if blocks and blocks[0][0] == 'h' and blocks[0][1][0] == 1:
            self.title = blocks.pop(0)[1][1]
        if blocks and blocks[0][0] == 'p' and re.match(r'^\d{4}-\d{2}-\d{2} · \S+$', blocks[0][1]):
            self.meta = blocks.pop(0)[1]
        if blocks and blocks[0][0] == 'p':
            self.lede = blocks.pop(0)[1]
        self.blocks = blocks
        self.h2 = [(b[1][1]) for b in blocks if b[0] == 'h' and b[1][0] == 2]

    def source_line(self):
        s = self.source
        s = re.sub(r',\s*(doc|node)\s+[0-9a-f-]+', '', s)
        return s


# ---------------------------------------------------------------------------
# Gabarit de page
# ---------------------------------------------------------------------------

def header(prefix, active):
    links = []
    for key, label, href in NAV:
        cls = ' class="on"' if key == active else ''
        links.append('<a%s href="%s%s">%s</a>' % (cls, prefix, href, label))
    cta_on = ' on' if active == 'prompts' else ''
    cta = '<a class="cta%s" href="%sprompts/index.html">Outil de prompts</a>' % (cta_on, prefix)
    mobile = ''.join('<a%s href="%s%s">%s</a>' % (' class="on"' if k == active else '', prefix, h, l) for k, l, h in NAV)
    mobile += '<a%s href="%sprompts/index.html">Prompts</a>' % (' class="on"' if active == 'prompts' else '', prefix)
    return ('<header class="top"><div class="top-in">'
            '<a class="brand" href="%sindex.html"><span class="brand-mark"></span><span>'
            '<span class="brand-name">Second Earth</span><span class="brand-sub">Korê · 61 Cygni Ab</span></span></a>'
            '<nav class="nav" aria-label="Rubriques">%s%s</nav>'
            '<details class="menu"><summary>Menu</summary><div class="menu-list">%s</div></details>'
            '</div></header>') % (prefix, ''.join(links), cta, mobile)


def footer():
    return ('<footer class="foot-site"><span class="lbl">Second Earth · NIRVALAB · 2026</span>'
            '<span class="lbl">Copie des documents de travail au %s</span></footer>') % SITE_DATE


def page(title, prefix, active, body, description=''):
    t = esc(title + (' · Second Earth' if title != 'Second Earth' else ''))
    return ('<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
            '<meta name="color-scheme" content="dark">\n<meta name="theme-color" content="#0a0d0b">\n'
            '<title>%s</title>\n%s'
            '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
            '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
            '<link rel="stylesheet" href="%s">\n'
            '<link rel="stylesheet" href="%sassets/site.css">\n'
            '<link rel="icon" href="%sassets/icon.svg" type="image/svg+xml">\n'
            '</head>\n<body>\n%s\n<main class="wrap">\n%s\n</main>\n%s\n'
            '<script src="%sassets/site.js"></script>\n</body>\n</html>\n') % (
        t, ('<meta name="description" content="%s">\n' % esc(description)) if description else '',
        esc(FONTS_URL), prefix, prefix, header(prefix, active), body, footer(), prefix)


# ---------------------------------------------------------------------------
# Pages de documents
# ---------------------------------------------------------------------------

def sidebar(section_key, sec, current_slug, doc_h2, prefix_to_section=''):
    groups = []
    for slug, _f, name, grp in sec['pages']:
        if not groups or groups[-1][0] != grp:
            groups.append((grp, []))
        groups[-1][1].append((slug, name))
    parts = []
    idx = 0
    single = sec.get('single')
    for grp, items in groups:
        if not single:
            parts.append('<div class="side-group">%s</div>' % esc(grp))
        parts.append('<ol>')
        for slug, name in items:
            idx += 1
            on = slug == current_slug
            parts.append('<li%s><a href="%s%s.html"><span class="n">%02d</span><span>%s</span></a>' % (
                ' class="on"' if on else '', prefix_to_section, slug, idx, esc(name)))
            if on and doc_h2:
                parts.append('<ol class="toc">%s</ol>' % ''.join(
                    '<li><a href="#%s">%s</a></li>' % (sid, esc(strip_md(t))) for sid, t in doc_h2))
            parts.append('</li>')
        parts.append('</ol>')
    current_name = next((n for s, _f, n, _g in sec['pages'] if s == current_slug), sec['title'])
    return ('<aside class="side">'
            '<button type="button" class="side-toggle" aria-expanded="false"><span class="lbl or">%s</span>'
            '<span class="lbl">%s · sommaire</span></button>'
            '<div class="side-head"><span class="lbl or">%s</span><a class="side-title" href="%sindex.html">%s</a></div>'
            '<div class="side-body">%s</div></aside>') % (
        esc(sec['ref']), esc(current_name), esc(sec['ref']), prefix_to_section, esc(sec['title']), ''.join(parts))


def doc_page(section_key, sec, i, ctx_factory, extra_head=''):
    slug, fname, name, grp = sec['pages'][i]
    doc = Doc(DOCS / fname)
    prefix = '../'
    ctx = ctx_factory(prefix)
    ids = set()
    body_html = render_blocks(doc.blocks, ctx, ids)
    h2 = []
    for b in re.finditer(r'<h2 id="([^"]+)">(.*?)</h2>', body_html):
        h2.append((b.group(1), re.sub(r'<[^>]+>', '', html.unescape(b.group(2)))))
    meta = []
    meta.append('<span class="lbl or">%s · %s</span>' % (esc(sec['title']), esc(grp)))
    if doc.meta:
        meta.append('<span class="lbl">%s</span>' % esc(doc.meta))
    head = ('<div class="head accent"><div class="meta">%s</div><h1>%s</h1>%s%s</div>') % (
        ''.join(meta), inline(doc.title or name, ctx),
        ('<p class="lede">%s</p>' % inline(doc.lede, ctx)) if doc.lede else '', extra_head)
    pager = ''
    if not sec.get('single'):
        prev_ = sec['pages'][i - 1] if i > 0 else None
        next_ = sec['pages'][i + 1] if i + 1 < len(sec['pages']) else None
        pager = '<nav class="pager">%s%s</nav>' % (
            ('<a href="%s.html"><span class="lbl">Précédent</span><span class="t">%s</span></a>' % (prev_[0], esc(prev_[2]))) if prev_ else '<span></span>',
            ('<a class="next" href="%s.html"><span class="lbl">Suivant</span><span class="t">%s</span></a>' % (next_[0], esc(next_[2]))) if next_ else '<span></span>')
    source = ('<div class="source">%s. Copie publiée le %s ; le document vivant reste dans Claude Docs.</div>' % (
        esc(doc.source_line()), SITE_DATE)) if doc.source else ''
    main = ('<div class="page">%s<article class="doc">%s<div class="prose">%s</div>%s%s</article></div>') % (
        sidebar(section_key, sec, slug, h2), head, body_html, pager, source)
    return page(name, prefix, section_key, main, description=strip_md(doc.lede)[:200]), doc


def section_index(section_key, sec, docs, extra_top='', extra_bottom=''):
    prefix = '../'
    groups = []
    for (slug, _f, name, grp), doc in zip(sec['pages'], docs):
        if not groups or groups[-1][0] != grp:
            groups.append((grp, []))
        groups[-1][1].append((slug, name, doc))
    parts = [extra_top]
    n = 0
    for grp, items in groups:
        parts.append('<section class="sec"><div class="sec-h"><h2>%s</h2><span class="k">%d</span></div><div class="cards">' % (esc(grp), len(items)))
        for slug, name, doc in items:
            n += 1
            parts.append('<a class="card" href="%s.html"><span class="lbl or">%02d</span><span class="name">%s</span><p>%s</p></a>' % (
                slug, n, esc(name), esc(excerpt(strip_md(doc.lede or ''), 220))))
        parts.append('</div></section>')
    parts.append(extra_bottom)
    head = ('<div class="head accent"><div class="meta"><span class="lbl or">%s</span></div><h1>%s</h1>'
            '<p class="lede">%s</p></div>') % (esc(sec['ref']), esc(sec['title']), esc(sec['lede']))
    body = '<div class="home">%s%s</div>' % (head, ''.join(parts))
    return page(sec['title'], prefix, section_key, body, description=sec['lede'])


# ---------------------------------------------------------------------------
# Fiches : bestiaire et flore
# ---------------------------------------------------------------------------

def md_sections_intro(path):
    """Premier paragraphe sous chaque titre ## d'un document (clé : titre)."""
    blocks, _ = parse_md(path.read_text(encoding='utf-8'))
    intro, cur = {}, None
    for kind, data in blocks:
        if kind == 'h' and data[0] == 2:
            cur = data[1]
            continue
        if cur and kind == 'p' and cur not in intro:
            intro[cur] = data
    return intro


def fiche_html(it, ctx, kind, planche_codes):
    code = it['code']
    rows = []
    if kind == 'bestiaire':
        fields = [('Taille', 'taille'), ('À dessiner', 'a_dessiner'), ('Vie', 'vie'), ('Jumeau', 'jumeau'), ('Où', 'biome')]
    elif kind == 'titans':
        fields = [('Taille', 'taille'), ('Vestiges', 'vestiges'), ('Descendant', 'descendant'), ('Jumeau', 'jumeau')]
    else:
        fields = [('Forme et taille', 'taille'), ('Couleurs', 'couleurs'), ('Ce qui l\'explique', 'explication'),
                  ('Dans le film', 'role'), ('Jumeau', 'jumeau'), ('Où', 'biome')]
    for label, key in fields:
        v = it.get(key)
        if v:
            rows.append('<dt>%s</dt><dd>%s</dd>' % (esc(label), inline(v, ctx)))
    statut = it.get('statut') or 'non indiqué'
    warn = ''
    if it.get('ecart_planche'):
        warn = ('<details class="warn"><summary>Écart planche / Bestiaire</summary><p>%s</p></details>' % inline(it['ecart_planche'], ctx))
    links = []
    if it.get('voir_aussi'):
        va = it['voir_aussi']
        target = ctx.codes.get(va)
        if target:
            links.append('<a href="%s%s">Voir aussi %s</a>' % (ctx.prefix, esc(target), esc(va)))
    ready = bool(it.get('prompt_en'))
    links.append('<a href="%sprompts/index.html#%s">%s</a>' % (ctx.prefix, esc(code), 'Prompt' if ready else 'Prompt à rédiger'))
    if code in planche_codes:
        links.append('<a href="%splanches/index.html#%s">Planche de dessin</a>' % (ctx.prefix, esc(planche_codes[code])))
    bid = it.get('biome_id')
    if bid in BIOME_PAGE:
        links.append('<a href="%sbiomes/%s.html">Biome</a>' % (ctx.prefix, BIOME_PAGE[bid]))
    return ('<article class="fiche" id="%s"><div class="fiche-top"><span class="code">%s</span>'
            '<span class="st %s">%s</span></div><h3>%s</h3>%s<dl>%s</dl>%s'
            '<div class="foot"><span class="st %s">%s</span>%s</div></article>') % (
        esc(code), esc(code), status_class(statut), esc(statut), esc(it['nom']),
        ('<div class="latin">%s</div>' % esc(it['latin'])) if it.get('latin') else '',
        ''.join(rows), warn, 'st-ok' if ready else 'st-off',
        'prompt prêt' if ready else 'prompt à rédiger', ''.join(links))


def fiches_page(kind, items_by_group, ctx, title, ref, lede, intros, palettes, doc_link, planche_codes, total_note):
    chips = ['<button type="button" class="chip on" data-grp="tout" aria-pressed="true">Tout<span class="c">%d</span></button>' % sum(len(v) for v in items_by_group.values())]
    groups_html = []
    for g, items in items_by_group.items():
        if not items:
            continue
        chips.append('<button type="button" class="chip" data-grp="%s" aria-pressed="false">%s<span class="c">%d</span></button>' % (
            esc(g), esc(GROUP_NAMES.get(g, g)), len(items)))
        extra = ''
        if g in intros:
            extra += '<p class="grp-intro">%s</p>' % inline(intros[g], ctx)
        if g in palettes:
            p = palettes[g]
            extra += ('<div class="pal"><span><b>Dominante</b>%s</span><span><b>Accents</b>%s</span><span><b>Ce qui bouge</b>%s</span></div>' % (
                esc(p['dominante']), esc(p['accents']), esc(p['mouvement'])))
        biome_link = ''
        if g in BIOME_PAGE:
            biome_link = '<a class="lbl" href="%sbiomes/%s.html">Fiche du biome</a>' % (ctx.prefix, BIOME_PAGE[g])
        kind_g = 'titans' if g == 'titans' else kind
        groups_html.append('<section class="grp" data-g="%s"><div class="grp-h"><h2>%s</h2><span class="count">%d</span>%s</div>%s<div class="fiches">%s</div></section>' % (
            esc(g), esc(GROUP_NAMES.get(g, g)), len(items), biome_link, extra,
            ''.join(fiche_html(it, ctx, kind_g, planche_codes) for it in items)))
    head = ('<div class="head accent"><div class="meta"><span class="lbl or">%s</span><span class="lbl">%s</span></div>'
            '<h1>%s</h1><p class="lede">%s</p><div class="meta"><a class="lbl" href="document.html">Lire le document complet</a>'
            '<a class="lbl" href="%sprompts/index.html">Outil de prompts</a></div></div>') % (
        esc(ref), esc(total_note), esc(title), inline(lede, ctx), ctx.prefix)
    tools = ('<div class="tools"><input class="search" type="search" data-q placeholder="Chercher un code, un nom, un nom latin, un mot des fiches" aria-label="Recherche">'
             '<div class="chips" role="toolbar" aria-label="Groupes">%s</div><span class="count" data-count></span></div>') % ''.join(chips)
    body = '<div class="doc">%s%s<div data-fiches>%s</div><p class="empty" data-empty hidden>Aucune fiche ne correspond.</p></div>' % (
        head, tools, ''.join(groups_html))
    return page(title, '../', kind, body, description=strip_md(lede)[:200])


# ---------------------------------------------------------------------------
# Carte et QCM : passage au thème Verdant
# ---------------------------------------------------------------------------

VERDANT_ROOT = """:root{
  color-scheme: dark;
  --bg:#0a0d0b; --bg2:#101413; --bg3:#1b211e; --field:#151a18;
  --line:rgba(185,207,216,.13); --line2:rgba(185,207,216,.26);
  --ink:#e6eae7; --muted:#9ca8a2; --dim:#7c8884;
  --or:#e0674a; --or-soft:rgba(224,103,74,.14); --or-line:rgba(224,103,74,.55);
  --ok:#8fd1a8; --ok-soft:rgba(47,107,74,.3);
  --serif:'Chakra Petch','Saira Semi Condensed',system-ui,sans-serif;
  --mono:'Azeret Mono',ui-monospace,Menlo,Consolas,monospace;
  --display:'Venus Rising','Chakra Petch',sans-serif;
}"""

VERDANT_TAIL = """
/* Thème Verdant (Showrunner UI Kit), appliqué à la construction du site */
@font-face{font-family:'Venus Rising';src:url('%(font)s') format('opentype');font-weight:400;font-display:swap}
body{-webkit-font-smoothing:antialiased}
h1{font-family:var(--display)!important;font-weight:400!important;text-transform:uppercase;letter-spacing:.05em!important;font-size:24px!important;line-height:1.15!important}
.eyebrow,.lt,.k{color:var(--dim)}
button.primary,.views button.on,.layers button.on,.opt:has(input:checked) .k,.opt.on .k{color:#170c08!important}
.views button,.layers button,.bar button,button{border-radius:999px!important}
.views button.on,.layers button.on{border-color:var(--or)!important}
.card,.q,.done,footer.out,.opt{border-radius:14px!important}
.stat b,.prog .num{font-family:var(--display)!important;letter-spacing:.03em}
.ghead h3,footer.out h3{font-family:var(--display)!important;text-transform:uppercase;letter-spacing:.06em;font-size:18px!important}
svg .lbl{fill:#0d0d11;stroke:rgba(255,255,255,.85)}
.mk circle{fill:#ffffff;stroke:#0d0d11}
.mk text{fill:#0d0d11}
.mk.rob circle{fill:var(--or);stroke:#0d0d11}
.li i{border-color:rgba(255,255,255,.18)}
.pli .pl.subduction,.pli .pl.transform{stroke:#c9d2cd}
.pli .tooth path{fill:#c9d2cd}
@media (max-width:860px){.legend{grid-template-columns:minmax(0,1fr)!important}}
.backlink{position:fixed;right:14px;bottom:14px;z-index:50;font-family:var(--mono);font-size:10px;letter-spacing:.16em;text-transform:uppercase;background:var(--or);color:#170c08;padding:9px 14px;border-radius:999px;text-decoration:none}
"""


def verdantize(src, font_url, backlink=None):
    s = src
    s = re.sub(r':root\{[^}]*\}', lambda m: VERDANT_ROOT, s, count=1)
    s = s.replace('content="only light"', 'content="dark"')
    s = re.sub(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com[^"]*">',
               '<link rel="stylesheet" href="%s">' % FONTS_URL.replace('&', '&amp;'), s)
    s = s.replace('</style>', VERDANT_TAIL % {'font': font_url} + '</style>', 1)
    if not s.lstrip().lower().startswith('<!doctype'):
        s = ('<!doctype html>\n<html lang="fr">\n<meta charset="utf-8">\n'
             '<meta name="viewport" content="width=device-width, initial-scale=1">\n') + s
    if backlink:
        s = s.replace('</body>', backlink + '</body>') if '</body>' in s else s + backlink
    return s


# ---------------------------------------------------------------------------
# Accueil
# ---------------------------------------------------------------------------

def home(counts):
    p = ''
    blocks = [
        ('k1', 'NL—01', 'Outil de prompts', 'Midjourney · réglages globaux · un bouton Copier par prompt', 'prompts/index.html', '%d fiches' % counts['fiches']),
        ('k2', 'NL—02', 'Carte de Korê', 'Planète et corridor de Seed · plaques · biomes', 'carte/index.html', '2 échelles'),
        ('k3', 'NL—03', 'Bible', 'Registre des décisions · trajet · planète · Titans', 'bible/index.html', '%d pages' % counts['bible']),
        ('k4', 'NL—04', 'Bestiaire', 'Espèces de Korê et galerie des Titans', 'bestiaire/index.html', '%d + %d' % (counts['bestiaire'], counts['titans'])),
        ('k5', 'NL—05', 'Film', 'Récit · architecture 25 / 55 · séquencier · découpage', 'film/index.html', '%d plans' % 150),
    ]
    tiles = [
        ('t1', 'NL—10', 'Biomes', '10 sur le trajet · 8 hors trajet', 'biomes/index.html'),
        ('t2', 'NL—11', 'Flore', '%d plantes · pourpre en haut, vert dessous' % counts['flore'], 'flore/index.html'),
        ('t1', 'NL—12', 'Planches', '%d planches de dessin · personnages, machines, animaux, plantes' % counts['planches'], 'planches/index.html'),
        ('t2', 'NL—13', 'Science', 'Phosphore, biomasse et seconde Terre', 'science/index.html'),
        ('t3', 'NL—14', 'Expo', 'Salle immersive · cartels par acte', 'expo/index.html'),
        ('t3', 'NL—15', 'Arbitrages', 'Registre des décisions · page QCM des rounds', 'arbitrages/index.html'),
        ('t2', 'NL—16', 'Glossaire', 'Codes de mission, machines, lieux', 'bible/glossaire.html'),
        ('t1', 'NL—17', 'Titans', 'Géants éteints il y a ~60 Ma', 'bible/titans.html'),
    ]
    figs = [
        ('11,4', 'al', '61 Cygni A, naine orange K5V, 4 400 K, 15 % de la luminosité du Soleil', 'o'),
        ('1,13', 'g', '~1,5 M⊕, ~1,15 R⊕ ; sauts ~12 % moins hauts, chutes ~6 % plus rapides', ''),
        ('30', '% O₂', 'Air de type Carbonifère : 30 % O₂, 2 % CO₂, 1,3 bar', 'g'),
        ('~40', 'h', 'Jour de Korê ; Seed dort deux fois par jour', ''),
        ('~116', 'j', 'Année : orbite ~0,41 UA, 69,6 jours de Korê', ''),
        ('~40', '%', "Surface d'eau ; déserts ~30 % des terres, jungles ~4 à 5 %", ''),
        ('2', 'lunes', 'Grande lune : mois de 21 jours de Korê ; petite lune : seconde marée', ''),
        ('~5 500', 'km', 'Le trajet de Seed à travers 12 biomes', 'o'),
    ]
    out = []
    out.append('<section class="hero"><div class="hero-main"><span class="lbl or">00_korê</span>'
               '<h1>Second Earth</h1>'
               "<p>Film de science-fiction (25 min, puis 55 min), salle immersive et exposition pour le Science Centre Singapore. "
               "Une planète inventée, Korê (61 Cygni Ab), construite comme un système physique avant d'être un décor.</p>"
               '<p>Ce site réunit le monde, les espèces, la science, le film et les outils de fabrication du projet, '
               'dont l’outil de prompts Midjourney.</p></div>'
               '<a class="hero-side" href="bible/trajet.html"><span class="lbl">Distance de la Terre</span>'
               '<span class="big">11,4</span><span class="lbl">années-lumière · départ 2045 · arrivée 2098</span></a></section>')
    out.append('<section class="sec"><div class="sec-h"><h2>Le projet</h2><span class="k">A</span></div><div class="stack">')
    for k, ref, name, sub, href, val in blocks:
        out.append('<a class="blk %s" href="%s%s"><span class="ref">%s</span><span class="main"><span class="name">%s</span><span class="sub">%s</span></span><span class="val">%s</span></a>' % (
            k, p, href, ref, esc(name), esc(sub), esc(val)))
    out.append('</div></section>')
    out.append('<section class="sec"><div class="sec-h"><h2>Rubriques</h2><span class="k">B</span><span class="r lbl">%d modules</span></div><div class="tiles">' % len(tiles))
    for k, ref, name, sub, href in tiles:
        out.append('<a class="tile %s" href="%s%s"><span class="row"><span class="ref">%s</span><span class="dot"></span></span><span class="name">%s</span><span class="sub">%s</span></a>' % (
            k, p, href, ref, esc(name), esc(sub)))
    out.append('</div></section>')
    out.append('<section class="sec"><div class="sec-h"><h2>Korê, les chiffres</h2><span class="k">C</span><span class="r lbl">validé sauf mention</span></div><div class="figs">')
    for v, unit, d, cls in figs:
        out.append('<div class="fig %s"><span class="v">%s<small>%s</small></span><span class="d">%s</span></div>' % (cls, esc(v), esc(unit), esc(d)))
    out.append('</div></section>')
    out.append('<section class="sec"><div class="sec-h"><h2>L\'histoire</h2><span class="k">D</span></div><div class="duo">'
               '<div class="panel"><span class="lbl or">Résumé</span>'
               "<p>2045 : le vaisseau-semeur PERSEPHORA quitte le système solaire. Il ne prend rien à la Terre : il porte des embryons et des machines. "
               "2098 : il arrive à 61 Cygni A, 11,4 années-lumière. Il largue le XENOPOD-01 (la capsule qui porte l'embryon) et des collecteurs. "
               "Quatre robots, les Robs, vérifient en une seule sortie que la planète possède toutes les briques de la vie (carbone, eau, azote, phosphore, soufre, métaux) avant la naissance de Seed.</p>"
               "<p>Seed naît, 15 ans apparents, cheveux blancs, presque muette (quatre mots dans tout le film : « Rob ! », « Seed », « Korê », « Je suis Seed »). "
               "Le XENOPOD tombe dans un sinkhole. Seed et Rob1 partent chercher Rob2, Rob3, Rob4 à travers 12 biomes (~5 500 km), "
               "rebaptisent la planète Korê d'après le cri d'un oiseau des salins, puis reviennent.</p>"
               "<p>La Phase 1 réussit : Korê a tout. Rob1 envoie pourtant « NON VIABLE » vers la Terre (« Terre : réception dans 11,4 ans ») : son mensonge protège un monde complet. "
               "Puis il modifie le protocole du second embryon, CAIN (ingénieur de terraformation, 35 ans, mémoire transférée à 100 %), ramené à 14 ans et 21 %.</p>"
               '<a class="lbl" href="film/recit-docx.html">Lire le récit de référence</a></div>'
               '<div class="panel"><span class="lbl or">Les produits</span>'
               "<h3>Film de 25 min, puis de 55 min</h3><p>Le 55 est conçu dès l'écriture du 25 pour se fabriquer par ajout, jamais par remontage : une colonne vertébrale et 9 modules.</p>"
               "<h3>Salle immersive</h3><p>Temps réel dans Unreal, avec BoraBora Studios : narration sans Seed, avec les Robs ; le visiteur est chef de mission, un peu d'interaction, surtout contemplatif, jamais scolaire.</p>"
               "<h3>Exposition par biome</h3><p>Cartels en trois temps : SUR TERRE / SUR KORÊ / POURQUOI.</p>"
               '<p class="lbl">Science Centre Singapore · NIRVALAB</p></div></div></section>')
    out.append('<section class="quote"><p>This is a fictional planet. Earth is the only world we know. Take care of it.</p></section>')
    body = '<div class="home">%s</div>' % ''.join(out)
    return page('Second Earth', '', 'home', body,
                description="Second Earth : film, salle immersive et exposition pour le Science Centre Singapore. Korê, une planète inventée autour de 61 Cygni A.")


# ---------------------------------------------------------------------------
# Construction
# ---------------------------------------------------------------------------

def main(argv):
    out = ROOT / '_site'
    if '--out' in argv:
        out = Path(argv[argv.index('--out') + 1]).resolve()
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    shutil.copytree(ASSETS, out / 'assets')
    (out / '.nojekyll').write_text('', encoding='utf-8')

    best = load_json('bestiaire.json')
    flore = load_json('flore.json')
    titans = load_json('titans.json')
    planches = load_json('planches.json')
    paysages = load_json('paysages.json')
    palette = load_json('palette-flore.json')

    codes = {}
    for it in best:
        codes[it['code']] = 'bestiaire/index.html#' + it['code']
    for it in titans:
        codes[it['code']] = 'bestiaire/index.html#' + it['code']
    for it in flore:
        codes[it['code']] = 'flore/index.html#' + it['code']

    doc_links = {}
    for slug, _f, name, grp in SECTIONS['biomes']['pages']:
        if slug.startswith('ht-'):
            doc_links['HT · ' + name] = 'biomes/%s.html' % slug
    doc_links['HT · Récifs de silice'] = 'biomes/ht-6-recifs-de-silice.html'

    def ctx_factory(prefix):
        return Ctx(prefix, codes, doc_links)

    written = []

    def write(rel, content):
        p = out / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content, encoding='utf-8')
        written.append(rel)

    # prompts des paysages : id par fichier
    paysage_id = {p['fichier'].replace('docs/', ''): p['id'] for p in paysages}

    # pages de documents
    all_docs = {}
    for key, sec in SECTIONS.items():
        docs = []
        for i, (slug, fname, name, grp) in enumerate(sec['pages']):
            extra = ''
            if key == 'biomes' and fname in paysage_id:
                extra = '<div class="meta"><a class="lbl" href="../prompts/index.html#%s">Prompt du paysage</a></div>' % paysage_id[fname]
            html_, doc = doc_page(key, sec, i, ctx_factory, extra_head=extra)
            write('%s/%s.html' % (key, slug), html_)
            docs.append(doc)
        all_docs[key] = docs

    # index de rubrique
    for key in ('bible', 'film', 'expo'):
        extra_bottom = ''
        extra_top = ''
        if key == 'film':
            extra_bottom = '<section class="quote"><p>This is a fictional planet. Earth is the only world we know. Take care of it.</p></section>'
        if key == 'expo':
            extra_top = ('<div class="duo"><div class="panel"><span class="lbl or">Principe des cartels</span><h3>Sur Terre / Sur Korê / Pourquoi</h3>'
                         "<p>Une expo classique organisée par biome, cartels en trois temps : SUR TERRE / SUR KORÊ / POURQUOI.</p></div>"
                         '<div class="panel"><span class="lbl or">Salle immersive</span><h3>Temps réel, avec BoraBora Studios</h3>'
                         "<p>Narration sans Seed, avec les Robs ; le visiteur est chef de mission, un peu d'interaction, surtout contemplatif, jamais scolaire.</p></div></div>")
        write('%s/index.html' % key, section_index(key, SECTIONS[key], all_docs[key], extra_top, extra_bottom))

    # biomes : index avec palettes
    pal_by_order = palette[:10]
    sec = SECTIONS['biomes']
    parts = []
    head = ('<div class="head accent"><div class="meta"><span class="lbl or">%s</span></div><h1>Biomes</h1><p class="lede">%s</p></div>') % (
        esc(sec['ref']), esc(sec['lede']))
    parts.append(head)
    parts.append('<section class="sec"><div class="sec-h"><h2>Le trajet de Seed</h2><span class="k">10</span><span class="r lbl">dans l\'ordre du voyage</span></div><div class="cards">')
    for n, ((slug, fname, name, grp), doc) in enumerate(zip(sec['pages'][:10], all_docs['biomes'][:10])):
        pal = pal_by_order[n] if n < len(pal_by_order) else None
        pal_html = ('<div class="pal"><span><b>Dominante</b>%s</span></div>' % esc(pal['dominante'])) if pal else ''
        parts.append('<a class="card" href="%s.html"><span class="big">%02d</span><span class="name">%s</span><p>%s</p>%s</a>' % (
            slug, n + 1, esc(name), esc(excerpt(strip_md(doc.lede), 200)), pal_html))
    parts.append('</div></section>')
    parts.append('<section class="sec"><div class="sec-h"><h2>Hors trajet</h2><span class="k">8</span></div><div class="cards">')
    for (slug, fname, name, grp), doc in zip(sec['pages'][10:], all_docs['biomes'][10:]):
        parts.append('<a class="card" href="%s.html"><span class="lbl or">%s</span><span class="name">%s</span><p>%s</p></a>' % (
            slug, 'Vue d\'ensemble' if slug == 'hors-trajet' else 'HT', esc(name), esc(excerpt(strip_md(doc.lede), 200))))
    parts.append('</div></section>')
    write('biomes/index.html', page('Biomes', '../', 'biomes', '<div class="home">%s</div>' % ''.join(parts), description=sec['lede']))

    # planches : ancres par code (pour les liens des fiches)
    planche_codes = {}
    for pl in planches:
        for c in pl.get('codes', []):
            planche_codes[c] = slugify(pl['titre'])

    # bestiaire
    ctx = ctx_factory('../')
    groups = {g: [] for g in GROUP_ORDER}
    for it in best:
        groups.setdefault(it['biome_id'], []).append(it)
    groups['titans'] = titans
    intros_raw = md_sections_intro(DOCS / 'especes/bestiaire-de-kore.md')
    intros = {}
    for it in best:
        if it['section'] in intros_raw and it['biome_id'] not in intros and it['biome_id'] not in ('continent-c', 'continent-d'):
            intros[it['biome_id']] = intros_raw[it['section']]
    n_ready = sum(1 for it in best + titans if it.get('prompt_en'))
    best_doc = Doc(DOCS / 'especes/bestiaire-de-kore.md')
    write('bestiaire/index.html', fiches_page(
        'bestiaire', groups, ctx, 'Bestiaire de Korê', '04_bestiaire', best_doc.lede, intros, {}, 'document.html',
        planche_codes, '%d lignes · %d Titans · %d prompts prêts' % (len(best), len(titans), n_ready)))
    # document complet du bestiaire
    bsec = {'title': 'Bestiaire', 'ref': '04_bestiaire', 'single': True,
            'pages': [('document', 'especes/bestiaire-de-kore.md', 'Bestiaire, document complet', 'Document')]}
    html_, _ = doc_page('bestiaire', bsec, 0, ctx_factory)
    write('bestiaire/document.html', html_)

    # flore
    fgroups = {g: [] for g in GROUP_ORDER}
    for it in flore:
        fgroups.setdefault(it['biome_id'], []).append(it)
    fpal = {}
    for i, g in enumerate(TRAJET_ORDER):
        if i < len(palette):
            fpal[g] = palette[i]
    for row in palette[10:]:
        m = re.match(r'Continent ([BCD])', row['biome'])
        if m:
            fpal['continent-' + m.group(1).lower()] = row
    flore_doc = Doc(DOCS / 'especes/flore-de-kore.md')
    n_ready = sum(1 for it in flore if it.get('prompt_en'))
    write('flore/index.html', fiches_page(
        'flore', fgroups, ctx, 'Flore de Korê', '05_flore', flore_doc.lede, {}, fpal, 'document.html',
        planche_codes, '%d plantes · %d prompts prêts' % (len(flore), n_ready)))
    fsec = {'title': 'Flore', 'ref': '05_flore', 'single': True,
            'pages': [('document', 'especes/flore-de-kore.md', 'Flore, document complet', 'Document')]}
    html_, _ = doc_page('flore', fsec, 0, ctx_factory)
    write('flore/document.html', html_)

    # carte
    carte_src = (ROOT / 'carte/carte-kore.html').read_text(encoding='utf-8')
    write('carte/carte-kore.html', verdantize(carte_src, '../assets/fonts/venus-rising.otf'))
    carte_body = ('<div class="doc"><div class="head accent"><div class="meta"><span class="lbl or">09_carte</span>'
                  '<span class="lbl">v3 · planète et corridor · plaques</span></div><h1>Carte de Korê</h1>'
                  "<p class=\"lede\">La carte interactive : la planète entière et le corridor de Seed, la couche des plaques, les biomes. "
                  "Un clic maintient la fiche d'un lieu, un clic dans le vide la relâche.</p>"
                  '<div class="meta"><a class="lbl" href="carte-kore.html">Ouvrir en plein écran</a>'
                  '<a class="lbl" href="../bible/geologie-et-plaques.html">Géologie et plaques</a>'
                  '<a class="lbl" href="../bible/continents-et-oceans.html">Continents et océans</a></div></div>'
                  '<div style="height:10px"></div><div class="frame"><iframe src="carte-kore.html" title="Carte de Korê" loading="lazy"></iframe></div></div>')
    write('carte/index.html', page('Carte de Korê', '../', 'carte', carte_body, description='Carte interactive de Korê.'))

    # arbitrages
    qcm_src = (DATA / 'arbitrages-second-earth.html').read_text(encoding='utf-8')
    write('arbitrages/qcm.html', verdantize(qcm_src, '../assets/fonts/venus-rising.otf',
                                            backlink='<a class="backlink" href="index.html">Retour au site</a>'))
    arb = ('<div class="home"><div class="head accent"><div class="meta"><span class="lbl or">10_arbitrages</span></div><h1>Arbitrages</h1>'
           "<p class=\"lede\">Chaque élément est « validé » (tranché par Cal, avec son round) ou « proposé ». Un point validé n'est plus remis en question. "
           "Le Registre des décisions fait foi. Les arbitrages se font par QCM dans une page web : options pré-rédigées avec leur conséquence écrite en face, "
           "un champ libre par décision, un bouton qui copie les réponses en texte.</p></div>"
           '<div class="stack">'
           '<a class="blk k2" href="../bible/registre.html"><span class="ref">A</span><span class="main"><span class="name">Registre des décisions</span>'
           '<span class="sub">Toutes les décisions de worldbuilding validées, classées par thème</span></span><span class="val">Lire</span></a>'
           '<a class="blk k4" href="qcm.html"><span class="ref">B</span><span class="main"><span class="name">Page QCM</span>'
           '<span class="sub">Rounds 1 à 16 archivés · aucune question ouverte au 28/09/2026</span></span><span class="val">Ouvrir</span></a>'
           '</div>'
           '<section class="sec"><div class="sec-h"><h2>Les statuts</h2></div><div class="figs">'
           '<div class="fig g"><span class="v"><span class="st st-ok">validé</span></span><span class="d">Tranché par Cal, avec son round.</span></div>'
           '<div class="fig o"><span class="v"><span class="st st-prop">proposé</span></span><span class="d">En attente d\'un arbitrage.</span></div>'
           '<div class="fig"><span class="v"><span class="st st-off">origine</span></span><span class="d">Bestiaire de février 2026, inchangé.</span></div>'
           '<div class="fig"><span class="v"><span class="st st-off">recalé</span></span><span class="d">Modifié pour respecter une règle.</span></div>'
           '<div class="fig"><span class="v"><span class="st st-new">nouveau</span></span><span class="d">Ajouté.</span></div>'
           '</div></section></div>')
    write('arbitrages/index.html', page('Arbitrages', '../', 'arbitrages', arb, description='Registre des décisions et page QCM.'))

    # outil de prompts
    tool = ROOT / 'tools' / 'site' / 'prompts.html'
    if tool.exists():
        sys.path.insert(0, str(ROOT / 'tools'))
        import build_prompts  # noqa: E402
        site_css = (ASSETS / 'site.css').read_text(encoding='utf-8')
        write('prompts/index.html', build_prompts.build(ROOT, header('../', 'prompts'), site_css))
    else:
        write('prompts/index.html', page('Outil de prompts', '../', 'prompts',
                                         '<div class="head"><h1>Outil de prompts</h1><p class="lede">En construction.</p></div>'))

    # accueil et 404
    counts = {'bestiaire': len(best), 'titans': len(titans), 'flore': len(flore), 'planches': len(planches),
              'bible': len(SECTIONS['bible']['pages']), 'fiches': len(best) + len(flore) + len(titans) + len(paysages) + 11}
    write('index.html', home(counts))
    write('404.html', page('Page introuvable', '/SECOND_EARTH/', '',
                           '<div class="head accent"><h1>Page introuvable</h1><p class="lede">Cette adresse ne correspond à aucune page du site.</p>'
                           '<div class="meta"><a class="lbl" href="/SECOND_EARTH/index.html">Retour à l\'accueil</a></div></div>'))

    print('%d pages écrites dans %s' % (len(written), out))


if __name__ == '__main__':
    main(sys.argv[1:])
