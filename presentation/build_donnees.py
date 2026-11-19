#!/usr/bin/env python3
"""Écrit presentation/donnees.js à partir des données du dépôt (rien n'est inventé ici).

Entrées : data/bestiaire.json, data/titans.json, data/flore.json, data/palette-flore.json,
carte/map_meta.json et carte/build_map_page_v3.py (le tracé du trajet), docs/film/21-journal-de-rob1.md.
Usage : python3 presentation/build_donnees.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'presentation' / 'donnees.js'
CROP = (640, 440, 2440, 1440)   # recadrage de carte/corridor.png -> presentation/img/corridor.jpg


def load(p):
    return json.loads((ROOT / p).read_text(encoding='utf-8'))


def trail():
    """Le tracé et les marques d'acte, calculés par le générateur de la carte lui-même."""
    src = (ROOT / 'carte/build_map_page_v3.py').read_text(encoding='utf-8')
    src = src[:src.index('# world: corridor box')]
    src = src.replace("open('map_meta.json')", "open(%r)" % str(ROOT / 'carte/map_meta.json'))
    src = src.replace("open('world.png','rb')", "open(%r,'rb')" % str(ROOT / 'carte/world.png'))
    src = src.replace("open('corridor.png','rb')", "open(%r,'rb')" % str(ROOT / 'carte/corridor.png'))
    ns = {}
    exec(src, ns)
    x0, y0 = CROP[0], CROP[1]
    path = [[round(p[0] - x0, 1), round(p[1] - y0, 1)] for p in ns['pathpx']]
    acts = [{'id': m['id'], 'p': [round(m['p'][0] - x0, 1), round(m['p'][1] - y0, 1)], 't': m['t'], 'd': m['d']} for m in ns['markers']]
    robs = [{'id': m['id'], 'p': [round(m['p'][0] - x0, 1), round(m['p'][1] - y0, 1)], 'd': m['d']} for m in ns['robm']]
    return {'w': CROP[2] - CROP[0], 'h': CROP[3] - CROP[1], 'path': path, 'cum': [round(c) for c in ns['cum']],
            'acts': acts, 'robs': robs}


UNIT = {'mm': 0.001, 'cm': 0.01, 'm': 1.0}


def bornes(taille):
    """(plus petite, plus grande) dimension écrite en tête de la taille, en mètres (« 1,5–3 m » -> 1,5 et 3)."""
    m = re.search(r'(\d+(?:,\d+)?)(?:\s*(mm|cm|m)?\s*(?:[–-]|à)\s*(\d+(?:,\d+)?))?\s*(mm|cm|m)\b', taille)
    if not m:
        return None, None
    u2 = UNIT[m.group(4)]
    u1 = UNIT[m.group(2)] if m.group(2) else u2
    a = float(m.group(1).replace(',', '.')) * u1
    b = float(m.group(3).replace(',', '.')) * u2 if m.group(3) else a
    return a, b


def metres(taille):
    """Plus grande dimension écrite en tête de la taille (« 1,5–3 m » -> 3)."""
    m = re.search(r'(\d+(?:,\d+)?)(?:\s*[–-]\s*(\d+(?:,\d+)?))?\s*(mm|cm|m)\b', taille)
    if not m:
        return None
    v = float((m.group(2) or m.group(1)).replace(',', '.'))
    return v * UNIT[m.group(3)]


def journal():
    rows = []
    for line in (ROOT / 'docs/film/21-journal-de-rob1.md').read_text(encoding='utf-8').splitlines():
        m = re.match(r'\|\s*([P0-9]+-\d+)\s*\|\s*([^|]+?)\s*\|\s*(.+?)\s*\|\s*$', line)
        if m:
            rows.append({'plan': m.group(1), 'ecran': m.group(2), 'texte': m.group(3)})
    return rows


def acte_ix():
    """Acte IX du Récit v2, du message de PERSEPHORA à « Je suis Seed », tel quel."""
    txt = (ROOT / 'docs/film/00-recit-v2.md').read_text(encoding='utf-8')
    debut = txt.index('Rob1 entre pour vérifier les systèmes.')
    fin = txt.index('« Je suis Seed », dit-elle distinctement.') + len('« Je suis Seed », dit-elle distinctement.')
    return [p.strip() for p in txt[debut:fin].split('\n\n') if p.strip()]


def recit():
    """Le Récit v2, partie par partie, en paragraphes (les marques [E…] du 55 et l'avant-propos retirés)."""
    txt = (ROOT / 'docs/film/00-recit-v2.md').read_text(encoding='utf-8')
    parts = re.split(r'^## ', txt, flags=re.M)[1:]
    actes = []
    for p in parts:
        titre, _, corps = p.partition('\n')
        if titre.startswith('Ce qui change'):
            continue
        pars = []
        for q in corps.split('\n\n'):
            q = q.strip()
            if not q or q.startswith('**[E') or q.startswith('<!--'):
                continue
            q = re.sub(r'\*\*|\*', '', q)
            pars.append(q)
        actes.append({'titre': titre.strip(), 'pars': pars})
    return actes


def decoupage():
    """Les 150 plans du découpage 25 min : numéro, durée en secondes, cadre, action, fabrication, note."""
    plans = []
    for line in (ROOT / 'docs/film/20-decoupage-25-min.md').read_text(encoding='utf-8').splitlines():
        c = [x.strip() for x in line.split('|')]
        if len(c) > 9 and re.match(r'^[P0-9]+-\d+$', c[1]) and c[2].isdigit():
            plans.append({'n': c[1], 's': int(c[2]), 'cadre': c[3], 'action': c[4], 'son': c[5], 'fab': c[6], 'tags': c[7], 'note': c[8]})
    return plans


def main():
    meta = load('carte/map_meta.json')
    best = load('data/bestiaire.json')
    especes = [{'code': b['code'], 'nom': b['nom'], 'taille': b['taille'], 'm': metres(b['taille']), 'b': bornes(b['taille']),
                'biome': b['biome_id'], 'statut': b['statut']} for b in best]
    titans = [{'code': t['code'], 'nom': t['nom'], 'taille': t['taille'], 'm': metres(t['taille']),
               'descendant': t['descendant'], 'vestiges': t['vestiges'], 'statut': t['statut']} for t in load('data/titans.json')]
    flore = [{'code': f['code'], 'nom': f['nom'], 'biome': f['biome_id'], 'statut': f['statut']} for f in load('data/flore.json')]
    data = {
        'trajet': trail(),
        'couleurs': meta['colors'],
        'noms': meta['names'],
        'palette': load('data/palette-flore.json'),
        'especes': especes,
        'titans': titans,
        'flore': flore,
        'journal': journal(),
        'acte_ix': acte_ix(),
        'recit': recit(),
        'plans': decoupage(),
    }
    OUT.write_text('// Produit par presentation/build_donnees.py, ne pas modifier à la main.\nwindow.SE = '
                   + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
    print('écrit', OUT.relative_to(ROOT), len(especes), 'espèces', len(data['journal']), 'écrans')


if __name__ == '__main__':
    main()
