#!/usr/bin/env python3
"""Prépare le contenu de départ du site du projet : site-projet/content/site-content.json.

Tout vient du dépôt (CLAUDE.md section 2 et 3, docs/, data/). Rien ne s'invente : ce qui n'est pas
écrit tel quel dans un document est marqué « proposé ».

Ce fichier ne sert qu'UNE FOIS. Dès que Cal a publié depuis le site, site-content.json est la
référence et ce script refuse de l'écraser (ajouter --force pour repartir de zéro).
Usage : python3 tools/prepa_site_projet.py [--force]
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'data'
DOCS = ROOT / 'docs'
CIBLE = ROOT / 'site-projet' / 'content' / 'site-content.json'

_n = [0]


def bid(prefixe):
    _n[0] += 1
    return '%s-%03d' % (prefixe, _n[0])


def media(attendu, genre='image', src=''):
    return {'src': src, 'genre': genre, 'attendu': attendu, 'poster': '', 'cadre': '50% 50%'}


def ouverture(sur, titre, chapo, attendu, genre='image', statut='', src=''):
    return {'id': bid('ouv'), 'type': 'ouverture', 'sur': sur, 'titre': titre, 'chapo': chapo,
            'media': media(attendu, genre, src), 'statut': statut}


def texte(titre, corps, statut='', source='', sur=''):
    if isinstance(corps, (list, tuple)):
        corps = '\n\n'.join(corps)
    return {'id': bid('txt'), 'type': 'texte', 'sur': sur, 'titre': titre, 'corps': corps,
            'statut': statut, 'source': source}


def bande(attendu, legende='', genre='image', src=''):
    return {'id': bid('med'), 'type': 'media', 'media': media(attendu, genre, src), 'legende': legende}


def carrousel(titre, items, fmt='21:9', statut='', source=''):
    return {'id': bid('car'), 'type': 'carrousel', 'titre': titre, 'format': fmt, 'statut': statut,
            'source': source, 'items': items}


def tuile(sur, titre, txt, attendu, genre='image', src=''):
    return {'id': bid('tu'), 'sur': sur, 'titre': titre, 'texte': txt, 'media': media(attendu, genre, src)}


def chiffres(items, source=''):
    return {'id': bid('chi'), 'type': 'chiffres', 'source': source,
            'items': [{'id': bid('c'), 'v': v, 'u': u, 't': t} for v, u, t in items]}


def citation(txt, source=''):
    return {'id': bid('cit'), 'type': 'citation', 'texte': txt, 'source': source}


def liens(items):
    return {'id': bid('lie'), 'type': 'liens',
            'items': [{'id': bid('l'), 'nom': n, 'href': h, 'texte': t} for n, h, t in items]}


def table_md(chemin):
    """Lignes de la première table Markdown d'un fichier, en listes de cellules."""
    lignes = []
    for l in (DOCS / chemin).read_text(encoding='utf-8').splitlines():
        if l.startswith('|') and not re.match(r'^\|\s*-', l):
            lignes.append([c.strip() for c in l.strip().strip('|').split('|')])
    return lignes[1:]


def sans_md(s):
    return re.sub(r'\*\*|\[(validé|proposé)[^\]]*\]', '', s).strip()


def construire():
    j = lambda n: json.loads((DATA / n).read_text(encoding='utf-8'))
    paysages, palette = j('paysages.json'), j('palette-flore.json')
    best, flore, planches = j('bestiaire.json'), j('flore.json'), j('planches.json')
    S = []

    # ------------------------------------------------------------------ accueil
    S.append({'id': 'accueil', 'nom': 'Second Earth', 'blocs': [
        ouverture('Un film, une salle immersive, une exposition · Science Centre Singapore',
                  'Second Earth',
                  "Un film de 25 minutes, puis de 55. Une planète inventée, Korê, construite comme un système physique avant d'être un décor.",
                  "ici : l'image du film. Seed et Rob1 devant un paysage de Korê, vue large, 21:9 (ou la vidéo d'ouverture, muette, en boucle)",
                  genre='video'),
    ]})

    # ------------------------------------------------------------------ logline
    S.append({'id': 'logline', 'nom': 'Logline', 'blocs': [
        texte('',
              "Sur une planète inconnue, à 11,4 années-lumière de la Terre, une adolescente née d'une machine et un petit robot traversent un monde entier pour retrouver trois robots perdus. Au bout du voyage, le robot ment à la Terre pour protéger ce qu'ils ont trouvé.",
              statut='proposé', source="Rédigée à partir du résumé du brief (CLAUDE.md, section 2). Aucune logline n'est écrite dans les documents du projet.",
              sur='Logline'),
    ]})

    # ------------------------------------------------------------------ pitch
    S.append({'id': 'pitch', 'nom': 'Pitch', 'blocs': [
        texte('Le pitch', [
            "2045 : le vaisseau-semeur PERSEPHORA quitte le système solaire. Il ne prend rien à la Terre : il porte des embryons et des machines. 2098 : il arrive à 61 Cygni A.",
            "Quatre robots, les Robs, vérifient que la planète possède toutes les briques de la vie. Seed naît : quinze ans apparents, cheveux blancs, presque muette. Sa capsule tombe dans un gouffre. Avec Rob1, elle part chercher les trois autres robots à travers le continent.",
            "Ils donnent un nom à la planète : Korê, le cri d'un oiseau des salins. La mission réussit : Korê a tout. Rob1 envoie pourtant « NON VIABLE » vers la Terre.",
        ], statut='proposé', source="Rédigé à partir du résumé du brief (CLAUDE.md, section 2) et du récit de référence. Aucun pitch n'est écrit dans les documents du projet."),
        bande("ici : PERSEPHORA en approche de 61 Cygni A, l'étoile orange, vue large, 21:9",
              'PERSEPHORA, la semeuse'),
    ]})

    # ------------------------------------------------------------------ synopsis
    actes = table_md('film/11-sequencier-25-min.md')
    tu_actes = []
    for r in actes:
        m = re.match(r'\*\*(.+?)\*\*\s*·\s*([\d:]+)', r[0])
        nom, duree = (m.group(1), m.group(2)) if m else (sans_md(r[0]), '')
        nom = nom if nom == 'Prologue' else 'Acte ' + nom
        tu_actes.append(tuile(duree, nom, sans_md(r[1]),
                              "ici : une image %s, 21:9" % ('du prologue' if nom == 'Prologue' else "de l'" + nom[0].lower() + nom[1:])))
    S.append({'id': 'synopsis', 'nom': 'Synopsis', 'blocs': [
        texte('Synopsis court', [
            "2045 : le vaisseau-semeur PERSEPHORA quitte le système solaire. Il ne prend rien à la Terre : il porte des embryons et des machines. 2098 : il arrive à 61 Cygni A, à 11,4 années-lumière. Il largue le XENOPOD-01, la capsule qui porte l'embryon, et des collecteurs. Quatre robots, les Robs, vérifient en une seule sortie que la planète possède toutes les briques de la vie : carbone, eau, azote, phosphore, soufre, métaux.",
            "Seed naît : quinze ans apparents, cheveux blancs, presque muette. Quatre mots dans tout le film : « Rob ! », « Seed », « Korê », « Je suis Seed ». Le XENOPOD tombe dans un sinkhole. Seed et Rob1 partent chercher Rob2, Rob3 et Rob4, rebaptisent la planète Korê d'après le cri d'un oiseau des salins, puis reviennent.",
            "La Phase 1 réussit : Korê a tout. Rob1 envoie pourtant « NON VIABLE » vers la Terre : « Terre : réception dans 11,4 ans ». Son mensonge protège un monde complet. Puis il modifie le protocole du second embryon, CAIN, ingénieur de terraformation de 35 ans, ramené à 14 ans et à 21 % de mémoire transférée.",
        ], statut='proposé', source="Le résumé du brief (CLAUDE.md, section 2), découpé en trois paragraphes. Le récit de référence (docx) fait foi."),
        carrousel('Synopsis long, acte par acte', tu_actes, fmt='21:9', statut='proposé',
                  source="Les séquences-cœur du Séquencier 25 min (docs/film/11), reprises telles quelles, avec leur durée."),
    ]})

    # ------------------------------------------------------------------ note d'intention
    S.append({'id': 'intention', 'nom': "Note d'intention", 'blocs': [
        texte("Note d'intention", [
            "Second Earth est une fiction, et le film le dit dans son dernier carton. Mais chaque élément du monde tient sur un fait, une extrapolation déclarée ou un choix de fiction assumé.",
            "Ce que le film ne prétend pas : que 61 Cygni ait une planète, qu'un warp existe, qu'un clone puisse recevoir une mémoire. Ce que le film affirme : que les éléments de la vie sont les mêmes partout, que le phosphore est rare et fini, et que la Terre est le seul monde que nous connaissons.",
            "La charte de PERSEPHORA : ne rien prendre à la Terre. Tout ce qui fera un corps humain, puis une colonie, doit venir de la planète.",
            "Quatre mots parlés, pas un de plus : Rob, Seed, Korê, Je suis Seed. L'autre, soi, le monde, soi dans le monde. Pas de doublage, pas de synchro labiale : un film qui voyage tel quel.",
        ], statut='proposé', source="Assemblée à partir des Notes pour Nina (note science), du Registre (la charte) et de l'Architecture 25 / 55 (règle 3). Cal n'a pas écrit de note d'intention dans le dépôt : celle-ci tient la place."),
        citation('This is a fictional planet. Earth is the only world we know. Take care of it.',
                 'Carton final du film'),
    ]})

    # ------------------------------------------------------------------ univers
    S.append({'id': 'univers', 'nom': "L'univers", 'blocs': [
        ouverture("L'univers", 'Korê',
                  "61 Cygni Ab, à 11,4 années-lumière. Une naine orange, deux lunes, un air de Carbonifère, deux lignées végétales : pourpre en haut, vert dessous.",
                  "ici : Korê vue de l'orbite, la grande lune et l'étoile orange, 21:9"),
        chiffres([
            ('11,4', 'années-lumière', '61 Cygni A, naine orange K5V, 4 400 K, 15 % de la luminosité du Soleil'),
            ('1,13', 'g', '~1,5 masse terrestre ; sauts ~12 % moins hauts, chutes ~6 % plus rapides'),
            ('30', '% O₂', 'Air de type Carbonifère : 30 % O₂, 2 % CO₂, 1,3 bar'),
            ('~40', 'heures', 'Le jour de Korê ; Seed dort deux fois par jour'),
            ('~116', 'jours', "L'année : orbite ~0,41 UA, 69,6 jours de Korê"),
            ('~40', "% d'eau", 'Déserts ~30 % des terres, jungles ~4 à 5 %'),
            ('2', 'lunes', 'La grande : même diamètre apparent que l\'étoile ; la petite : une seconde marée'),
            ('~60', "millions d'années", 'Les Titans éteints par une pluie de comètes'),
        ], source='Chiffres validés (Registre des décisions), sauf la lumière, proposée.'),
        bande('', 'La planète entière : continents A à D, océans 1 à 3. Carte du projet.', src='../carte/world.png'),
        liens([
            ('La carte interactive', '../carte/index.html', 'La planète et le corridor de Seed, les plaques, les biomes'),
            ('La Bible', '../bible/index.html', 'Le registre des décisions, la planète, les Titans, le glossaire'),
        ]),
    ]})

    # ------------------------------------------------------------------ personnages
    pl = {p['titre']: p for p in planches}
    ordre = [('Seed', 'Seed'), ('Rob1', 'Rob1'), ('Rob2', 'Rob2'), ('Rob3', 'Rob3'), ('Rob4', 'Rob4'), ('PERSEPHORA', 'PERSEPHORA')]
    tu_p = []
    for titre, nom in ordre:
        p = pl[titre]
        tu_p.append(tuile(p['categorie'], nom, p['silhouette'],
                          'ici : la planche de %s, portrait en pied, 4:5' % nom))
    tu_p.insert(5, tuile('embryon, alvéole H-02', 'CAIN',
                         "Ingénieur de terraformation, 35 ans, mémoire transférée à 100 % ; Rob1 le ramène à 14 ans et à 21 % à la fin.",
                         'ici : le compartiment cryogénique, les alvéoles H-01 et H-02, 4:5'))
    S.append({'id': 'personnages', 'nom': 'Les personnages', 'blocs': [
        texte('Les personnages',
              "Seed, quatre robots, un embryon qui attend, et le vaisseau qui les a semés. La relation de Seed et de Rob1 tient le film.",
              source='Silhouettes : Planches de dessin (document au statut proposé) ; CAIN : Glossaire, validé (docx).'),
        carrousel('', tu_p, fmt='4:5', statut='proposé'),
    ]})

    # ------------------------------------------------------------------ voyage
    noms = ['Jungle primordiale', 'Pitons karstiques', 'Terres rocheuses et cavernes', 'Massifs et glaciers',
            'Forêt bioluminescente', 'Hautes Plaines', 'Forêt ancienne', 'Course vers la mer',
            "Mer d'arsenic et fosse", 'Lacs salés pourpres']
    tu_b = []
    for i, p in enumerate(paysages[:10]):
        premier = list(p['sections'].values())[0]
        accroche = sans_md(re.split(r' - | \| ', premier)[0])
        pal = palette[i]
        tu_b.append(tuile('%02d · %s' % (i + 1, pal['dominante']), noms[i], accroche,
                          'ici : %s, vue large, 21:9' % noms[i].lower()))
    S.append({'id': 'voyage', 'nom': 'Le voyage', 'blocs': [
        ouverture('Le voyage', 'Dix biomes',
                  "Environ 5 500 km à travers le continent A, de la jungle de la naissance aux lacs salés où la planète reçoit son nom.",
                  'ici : Seed qui porte Rob1 sur le dos, le fleuve entre les pitons au crépuscule, 21:9'),
        carrousel('Dans l\'ordre du trajet', tu_b, fmt='21:9',
                  source='Fiches de biome de la Bible (première phrase de chaque fiche) et palette de la Flore (couleur dominante).'),
        bande('', 'Le corridor de Seed. Carte du projet.', src='../presentation/img/corridor.jpg'),
        liens([('Les dix biomes, fiche par fiche', '../biomes/index.html', 'Le milieu, les espèces, les scènes, les cartels')]),
    ]})

    # ------------------------------------------------------------------ bestiaire et flore
    vus, tu_e = set(), []
    for it in best:
        if it['groupe'] == 'trajet' and it['biome_id'] not in vus:
            vus.add(it['biome_id'])
            tu_e.append(tuile('%s · %s' % (it['code'], it['taille']), it['nom'], it['a_dessiner'],
                              'ici : %s, planche ou image en situation, 4:5' % it['nom'].lower()))
    vus, tu_f = set(), []
    for it in flore:
        if it['groupe'] == 'trajet' and it['biome_id'] not in vus:
            vus.add(it['biome_id'])
            tu_f.append(tuile('%s · %s' % (it['code'], it['couleurs']), it['nom'], it['taille'],
                              'ici : %s, 4:5' % it['nom'].lower()))
    S.append({'id': 'especes', 'nom': 'Le bestiaire et la flore', 'blocs': [
        texte('Le bestiaire et la flore',
              "%d lignes au Bestiaire, %d plantes, sept Titans éteints. Chaque espèce a un jumeau terrestre et une raison d'être là. Ici, la première espèce de chaque biome du trajet." % (len(best), len(flore)),
              source="Bestiaire de Korê (règles, noms latins et Titans validés au round 8) ; Flore de Korê. Extraits pris dans l'ordre des documents, sans choix."),
        carrousel('Animaux', tu_e, fmt='4:5'),
        carrousel('Plantes', tu_f, fmt='4:5'),
        liens([('Le Bestiaire entier', '../bestiaire/index.html', 'Toutes les fiches, par biome'),
               ('La Flore entière', '../flore/index.html', 'Pourpre en haut, vert dessous')]),
    ]})

    # ------------------------------------------------------------------ science
    S.append({'id': 'science', 'nom': 'La science', 'blocs': [
        ouverture('La science', 'Le phosphore',
                  "Les briques de la vie ne se transportent pas. Une planète ne vaut que par ce qu'elle possède déjà, et c'est ce que les Robs vont vérifier.",
                  "ici : Rob2 dans la grotte, le guano et les os du Titan dans la voûte, 21:9"),
        texte('La thèse', [
            "Le phosphore est irremplaçable, rare dans le cosmos, en quantité fixe sur Terre, et il plafonne la biomasse sur le temps long.",
            "Aucune cellule connue ne fonctionne sans phosphore : l'ossature de l'ADN, l'ATP, les membranes, les os. Dans l'univers, il est environ mille fois moins abondant que le carbone.",
            "Ce qui manque à Mars, c'est surtout l'azote et l'atmosphère.",
        ], source='Étude « Phosphore, biomasse et seconde Terre » (résumé).'),
        chiffres([
            ('106 : 16 : 1', '', 'Carbone, azote, phosphore dans le plancton marin (rapport de Redfield)'),
            ('~1 000', 'fois', 'Le phosphore est plus rare que le carbone dans le cosmos'),
            ('500', 'g', 'Le phosphore dans un corps de 50 kg'),
            ('11,4', 'ans', 'Le temps que met le rapport de Rob1 pour atteindre la Terre'),
        ], source='Étude Phosphore ; Cartels par acte.'),
        liens([("L'étude entière", '../science/index.html', 'Les sources, les verdicts, ce que cela change pour Korê')]),
    ]})

    # ------------------------------------------------------------------ film
    S.append({'id': 'film', 'nom': 'Le film', 'blocs': [
        ouverture('Le film', '25, puis 55',
                  "Le 25 minutes est la colonne vertébrale, complète, avec l'arc entier. Le 55 s'obtient en ouvrant des emplacements déjà prévus dans le 25, jamais en le remontant.",
                  'ici : une image du film, plan large, 21:9 (ou un extrait vidéo)', genre='video'),
        chiffres([
            ('25:00', '', 'Le cœur : dix actes, 150 plans au découpage'),
            ('27:00', '', 'Neuf modules ajoutés aux charnières'),
            ('52:00', '', 'Le format long ; 55 avec les génériques'),
            ('4', 'mots', 'Rob, Seed, Korê, Je suis Seed'),
        ], source='Architecture 25 / 55 ; Découpage 25 min.'),
        texte('Une colonne vertébrale et des modules', [
            "Chaque acte du 25 est fait de séquences-cœur, fixes, séparées par des charnières : un fondu au noir, une ellipse, un carton de jour. Dans le 25, une charnière dure 20 à 40 secondes. Dans le 55, la même charnière s'ouvre sur un module de 2 à 5 minutes.",
            "Les actes I, III et IX ne reçoivent aucun module : ce sont les trois scènes où tout se joue entre Seed et Rob1 dans un lieu clos.",
            "Deux chaînes de fabrication, une direction artistique : les séquences avec Seed passent par le pipeline génératif de NIRVALAB ; les séquences sans Seed sont construites dans Unreal avec BoraBora.",
        ], source='Architecture 25 / 55 (A01 validé) ; Notes pour Nina.'),
        liens([
            ('Architecture 25 / 55', '../film/architecture-25-55.html', 'Les neuf emplacements, les durées, la production'),
            ('Séquencier 25 min', '../film/sequencier-25-min.html', 'Acte par acte'),
            ('Découpage 25 min', '../film/decoupage-25-min.html', '150 plans'),
        ]),
    ]})

    # ------------------------------------------------------------------ script
    S.append({'id': 'script', 'nom': 'Le script', 'blocs': [
        texte('Le script',
              "Le récit de référence de Cal, mis en page pour être lu, annoté dans la marge et corrigé sur place.",
              source='SECOND_EARTH_STORY (docx), qui fait foi.'),
        liens([
            ('Lire, commenter, corriger le script', 'script.html', 'Chaque paragraphe se commente ; en mode édition, il se corrige'),
            ('Récit v2', '../film/recit-v2.html', 'Le récit réécrit avec le monde, en attente de relecture'),
            ('Journal de Rob1', '../film/journal-de-rob1.html', 'La seule voix du film'),
        ]),
    ]})

    # ------------------------------------------------------------------ salle immersive
    temps = table_md('film/15-salle-immersive-esquisse.md')
    tu_s = [tuile(r[1], r[0], r[2], 'ici : %s, vue de la salle, 21:9' % r[0].split('·')[-1].strip().lower()) for r in temps]
    S.append({'id': 'salle', 'nom': 'La salle immersive', 'blocs': [
        ouverture('La salle immersive', 'Chef de mission',
                  "Temps réel dans Unreal, avec BoraBora Studios. Le visiteur voit ce que les Robs envoient. Il ne voit jamais Seed : il voit ses traces, et il entend le journal de Rob1.",
                  'ici : la salle, le public devant la projection à 360 degrés, 21:9', genre='video'),
        carrousel('Six temps, 12 à 15 minutes', tu_s, fmt='21:9', statut='proposé',
                  source='Salle immersive, esquisse (rien n\'est décidé ; les principes sont validés : sans Seed, chef de mission, contemplatif).'),
    ]})

    # ------------------------------------------------------------------ exposition
    cartels = table_md('bible/32-cartels-par-acte.md')
    tu_c = [tuile(r[0] if r[0] == 'Prologue' else 'Acte ' + r[0], r[1],
                  'SUR TERRE. %s\n\nSUR KORÊ. %s\n\nPOURQUOI. %s' % (r[2], r[3], r[4]),
                  'ici : %s, image du cartel, 4:5' % r[1].lower()) for r in cartels[:6]]
    S.append({'id': 'exposition', 'nom': "L'exposition", 'blocs': [
        texte("L'exposition",
              "Une exposition organisée par biome. Chaque cartel se lit en trois temps : SUR TERRE, SUR KORÊ, POURQUOI. La Terre en premier, la planète en contraste, la raison en dernier.",
              source='Registre (format validé) ; Cartels par acte (textes proposés, round 12).'),
        carrousel('Six cartels sur quatorze', tu_c, fmt='4:5', statut='proposé'),
        liens([('Les quatorze cartels', '../expo/cartels-par-acte.html', "Dans l'ordre du film")]),
    ]})

    # ------------------------------------------------------------------ équipe
    S.append({'id': 'equipe', 'nom': "L'équipe et les partenaires", 'blocs': [
        texte("L'équipe et les partenaires", ''),
        carrousel('', [
            tuile('auteur et réalisateur', 'Cal · NIRVALAB',
                  "Écriture et réalisation. Pipeline génératif de NIRVALAB pour les séquences avec Seed. Écriture et conception avec Medhi Mejri (d'après Cal).",
                  'ici : portrait ou logo, 4:5'),
            tuile('commanditaire', 'Science Centre Singapore',
                  "Le film de 25 minutes, puis de 55 ; la salle immersive ; l'exposition.",
                  'ici : le Science Centre, ou son logo, 4:5'),
            tuile('porte le projet à Singapour', 'Nina Albani · aïo Creative Group',
                  'aïo Creative Group, Singapour.',
                  'ici : portrait ou logo, 4:5'),
            tuile('salle immersive, temps réel', 'BoraBora Studios',
                  "La salle immersive dans Unreal ; les séquences sans Seed du film : paysages, Robs, Titans, course.",
                  'ici : logo ou image du studio, 4:5'),
        ], fmt='4:5', source='Brief du projet (CLAUDE.md, section 2).'),
    ]})

    # ------------------------------------------------------------------ calendrier
    S.append({'id': 'calendrier', 'nom': 'Le calendrier et le financement', 'blocs': [
        texte('Le calendrier et le financement', [
            "Un film de 25 minutes maintenant, puis un film de 55 minutes fabriqué par ajout.",
            "Financement visé : une aide IA singapourienne qui ouvre en décembre, d'environ 120 k€, combinée à une licence anticipée du Science Centre (d'après Cal). Les documents parlent de l'« aide IA ~120 k€ » et du « dossier de décembre ».",
            "Le calendrier est à écrire : il dépend du format de projection (master 16:9 et adaptation dôme, validé A04) et de BoraBora.",
        ], source='Propositions (P6), Notes pour Nina, brief du projet. Aucun calendrier n\'est écrit dans le dépôt.'),
    ]})

    # ------------------------------------------------------------------ contact
    S.append({'id': 'contact', 'nom': 'Contact', 'blocs': [
        texte('Contact', '', statut='manque',
              source="Aucun contact n'est écrit dans le dépôt : à remplir par Cal en mode édition (nom, adresse, lien)."),
        liens([
            ('La présentation à la molette', '../presentation/index.html', 'Tout Second Earth, à lire en faisant défiler'),
            ('Le site de travail', '../index.html', 'La Bible, les espèces, la carte, les outils'),
        ]),
    ]})

    return {'version': 1, 'prepare_le': '19/11/2026', 'sections': S}


if __name__ == '__main__':
    if CIBLE.exists() and '--force' not in sys.argv:
        sys.exit('%s existe déjà : je ne l\'écrase pas (ajouter --force pour repartir du contenu de départ).' % CIBLE.relative_to(ROOT))
    CIBLE.parent.mkdir(parents=True, exist_ok=True)
    d = construire()
    CIBLE.write_text(json.dumps(d, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print('%d sections, %d blocs -> %s' % (len(d['sections']), sum(len(s['blocs']) for s in d['sections']), CIBLE.relative_to(ROOT)))
