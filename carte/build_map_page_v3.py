import json, base64, math
import numpy as np
meta = json.load(open('map_meta.json'))
w64 = base64.b64encode(open('world.png','rb').read()).decode()
c64 = base64.b64encode(open('corridor.png','rb').read()).decode()
cx0,cx1,cy0,cy1 = meta['corridor_box_km']; CW,CH = meta['corridor_size']; W,H = meta['world_size']
KM = meta['km_per_deg']
TR = meta['transform']; R0, KF, WS = TR['R0'], TR['k'], TR['w']

# ---- two-scale transform (same as korea_map.py): design km -> physical km ----
def Tr(r): return r + (KF-1)*WS*math.log1p(math.exp(max(min((r-R0)/WS, 50), -50)))
def phys(x, y):
    r = math.hypot(x, y)
    if r == 0: return (0.0, 0.0)
    f = Tr(r)/r; return (x*f, y*f)

INFO = {
 'ocean':     ("Océan profond", "Korê n'a que ~40 % d'eau : ses océans sont plus petits que les nôtres, et il n'y a pas de calotte polaire.", "Océans terrestres", "Rob4 y hiberne dans la fosse"),
 'recifs':    ("Mers peu profondes et récifs de silice", "Un océan à pH ~7,3 dissout le calcaire : les récifs sont bâtis en verre par des éponges.", "Récifs d'éponges siliceuses de Colombie-Britannique", ""),
 'remontees': ("Zones de remontée océanique", "L'eau froide du fond remonte avec son phosphore : les mers les plus fertiles, face à des côtes désertiques.", "Courant de Humboldt, Atacama", "Îlots à guano repérés par PERSEPHORA"),
 'fosse':     ("Fosse océanique", "Là où la plaque de l'Océan 2 plonge sous A, en pente très douce : l'arc volcanique est ~1 200 km en arrière (subduction plane). À 10 km de fond, ~1 200 fois la pression de l'air.", "Fosse des Mariannes", "Vue à travers Rob4"),
 'arsenic':   ("Mer d'arsenic", "Un golfe volcanique chargé d'arsenic ; la vie y sait trier l'arsenic du phosphore.", "Lac Mono (Californie)", "Rob4 : phosphore marin, guérison de Seed (Acte VII)"),
 'jungle':    ("Jungle primordiale", "Rare sur une planète sèche : elle ne vit que là où un fleuve déborde, sur un sol calcaire creux.", "Forêts inondables d'Amazonie, karst d'Asie du Sud-Est", "Rob1, XENOPOD-01, naissance de Seed, sinkhole (Acte I)"),
 'pitons':    ("Pitons karstiques", "Des tours de calcaire rongées par la pluie acide ; chaque tour est une île avec ses espèces.", "Guilin, Ninh Binh", "Acte II : Seed et Rob1 remontent le fleuve, qui se perd dans les tours"),
 'cavernes':  ("Terres rocheuses et cavernes", "Karst creusé de grottes géantes ; guano et os d'un Titan volant.", "Son Doong, grotte de Movile", "Rob2 : le phosphore (Actes II–III)"),
 'massifs':   ("Massifs et glaciers", "Chaîne de collision ; les sommets plafonnent ~12 % plus bas que sur Terre.", "Himalaya, Andes", "Acte IV : le col, la panne de Rob2"),
 'glaciers':  ("Glaciers", "Neige permanente au-dessus de ~4 500 m ; leur fonte alimente le fleuve de la jungle.", "Glaciers andins", "Source du fleuve"),
 'biolum':    ("Forêt bioluminescente", "Une forêt qui vit de sources tièdes soufrées, sans lumière : lente, clairsemée, millénaire.", "Sources hydrothermales", "Rob3 : soufre et métaux (Acte V)"),
 'plaines':   ("Hautes Plaines", "Prairies tenues ouvertes par le feu et les buffles albinos.", "Grandes plaines, Serengeti", "Acte VI : la horde"),
 'ancienne':  ("Forêt ancienne", "Vallée-refuge d'arbres-cathédrales qui boivent le brouillard ; rivière rouge acide, affluent clair.", "Séquoias côtiers, Rio Tinto", "Acte VII : Seed seule, le fruit toxique"),
 'canyon':    ("Canyon ocre", "Parois rayées de fer : l'histoire de l'oxygène écrite dans la roche.", "Karijini (Australie)", "Course vers Rob4"),
 'cristal':   ("Forêts cristallines", "Arbres vivants qui stockent la silice des sols volcaniques ; écorces qui réfractent la lumière.", "Prêles, forêt pétrifiée d'Arizona", "Course vers Rob4"),
 'arc':       ("Arc volcanique", "Volcans nés de la subduction ; geysers, soufre, flammes bleues la nuit, poches de CO₂.", "Kawah Ijen, El Tatio", "Course vers Rob4"),
 'lave':      ("Plaines de lave et tunnels", "Coulées récentes, galeries vides, premiers lichens.", "Islande, Hawaï", "Course vers Rob4"),
 'sel':       ("Lacs salés pourpres", "Bassins fermés où l'eau s'évapore ; des microbes pourpres colorent le sel.", "Lac Retba, salar d'Uyuni", "Retour : le cri « Korê » d'une colonie entière"),
 'lac':       ("Lac salé", "Eau très salée, rose à pourpre, crevettes du sel et oiseaux des salins.", "Lac Retba", "Retour : le cri « Korê »"),
 'desert':    ("Grands déserts continentaux", "Le biome le plus étendu : loin de mers trop petites, la pluie n'arrive pas.", "Sahara, Namib", ""),
 'savane':    ("Savanes à feu", "À 30 % d'oxygène, le feu passe presque chaque année ; des graines attendent la cendre.", "Savanes australiennes, cerrado", ""),
 'saison':    ("Forêts des moyennes latitudes", "Des saisons de 4 semaines trop courtes pour être senties : feuilles pourpres persistantes.", "Laurisylve, forêts du sud de la Chine", ""),
 'toundra':   ("Toundra polaire", "Pas de calotte sur une planète chaude ; deux mois de nuit, deux mois de jour.", "Toundra arctique", ""),
 'mangrove':  ("Mangroves et côtes à marées", "Deux lunes et une étoile proche lèvent la mer : haute mer toutes les ~21 h, vives-eaux sept fois celles de la Terre tous les 10,5 jours de Korê.", "Sungei Buloh (Singapour)", ""),
 'fleuve':    ("Fleuve", "Né des glaciers, il traverse les cavernes, les pitons et la jungle, se perd en partie dans le karst, et rejoint le Golfe 1.", "Danube (pertes karstiques)", "Le fil du trajet de Seed"),
 'rouge':     ("Rivière rouge", "Eau acide et métallique : Seed ne peut pas la boire, et c'est ce qui la pousse vers le fruit.", "Rio Tinto (Espagne)", "Acte VII"),
}
colors = meta['colors']; stats = meta['stats']
biomes = {}
for k,(n,d,t,r) in INFO.items():
    st = stats.get(k, {})
    biomes[k] = {'name':n,'desc':d,'twin':t,'role':r,'color':colors[k],
                 'pct':round(st.get('pct_planet') or 0,1), 'pctland': (round(st['pct_land'],1) if st.get('pct_land') is not None else None)}

def px(x,y): return [round((x-cx0)/(cx1-cx0)*CW,1), round((cy1-y)/(cy1-cy0)*CH,1)]
def dpx(x,y): return px(*phys(x,y))     # design km -> corridor px

# path (design km), densified then transformed; cumulative distance in physical km
path_d = [(0,0),(-18,115),(12,222),(32,362),(95,478),(265,430),(425,290),(500,195),(560,135),(610,80),(700,40),(560,-60),(335,-125),(120,-90),(0,0)]
dense = []
for a,b in zip(path_d[:-1], path_d[1:]):
    for t in np.linspace(0,1,40,endpoint=False): dense.append((a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t))
dense.append(path_d[-1])
pp = [phys(*p) for p in dense]
cum = [0.0]
for a,b in zip(pp[:-1], pp[1:]): cum.append(cum[-1] + math.hypot(b[0]-a[0], b[1]-a[1]))
def dist_at(xd, yd):
    """cumulative trail distance at the path point nearest to a design point (first passage)"""
    P = phys(xd, yd); best = min(range(len(pp)), key=lambda i: math.hypot(pp[i][0]-P[0], pp[i][1]-P[1]))
    return cum[best]
loop_km = cum[-1]
d_rob2 = dist_at(12,222); d_col = dist_at(32,362); d_rob3 = dist_at(95,478); d_rob4 = dist_at(700,40); d_sel = dist_at(335,-125)
def km(v): return f"{int(round(v/10.0)*10):,}".replace(',', ' ')

acts = [
 ('P',  0,0,   'Prologue · XENOPOD-01', 'Atterrissage dans la jungle. PERSEPHORA a choisi le site depuis l’orbite : le XENOPOD-01 se pose avec Rob1 et lâche ses trois collecteurs : Rob2 à 250 km, Rob3 et Rob4 à des milliers de kilomètres.'),
 ('I',  48,-34,'Acte I · Naissance de Seed', 'Incubateur, lumières sismiques, le sinkhole avale le XENOPOD, ses drones et son relais radio.'),
 ('II', -18,115,'Acte II · Pitons', 'Seed porte Rob1 le long du fleuve, entre les tours de calcaire. À pied.'),
 ('III',12,222,f'Actes II–III · Cavernes de Rob2 (~{km(d_rob2)} km)', 'Rob2 piégé ; fusion Rob1+Rob2 ; la Créature ; le Titan volant dans la voûte. À partir d’ici, le Rob fusionné court sur deux jambes et porte Seed.'),
 ('IV', 32,362,f'Acte IV · Le col, ~4 000 m (~{km(d_col)} km)', 'Le froid vide les batteries ; l’organisme-batterie sauve la traversée.'),
 ('V',  95,478,f'Acte V · Forêt bioluminescente (~{km(d_rob3)} km)', 'Rob3 colonisé par la mousse, la famille de rongeurs, le feu de camp.'),
 ('VI', 265,430,'Acte VI · Hautes Plaines', 'La horde de buffles albinos fuit un feu et sépare Seed des Robs.'),
 ('VII',425,290,'Acte VII · Forêt ancienne', 'Seed seule ; rivière rouge acide ; le fruit toxique ; visions d’Elena.'),
 ('C',  545,150,'Acte VII · La course', 'Canyon ocre, forêts cristallines, arc volcanique : le tank fonce vers Rob4.'),
 ('R4', 700,40,f'Acte VII · Mer d’arsenic (~{km(d_rob4)} km)', 'Rob4 hybride ; Seed guérie dans son liquide ; cicatrices lumineuses.'),
 ('K',  335,-125,f'Retour · Lacs salés pourpres (~{km(d_sel)} km)', 'Le cri « Ko-rê » d’une colonie d’oiseaux des salins : Rob1 et Seed rebaptisent la planète.'),
 ('IX', -48,34,f'Actes IX–X · Sinkhole (boucle ~{km(loop_km)} km)', 'Extraction du XENOPOD ; le message de PERSEPHORA ; le mensonge de Rob1 ; CAIN.'),
]
robs = [('Rob1',0,0,'Carbone, eau, azote · jungle · posé avec le XENOPOD'),
        ('Rob2',12,222,f'Phosphore : guano et os du Titan · cavernes · ~{km(math.hypot(*phys(12,222)))} km du XENOPOD, posé avec lui'),
        ('Rob3',95,478,f'Soufre, fer, métaux · forêt bioluminescente · largué d’orbite, ~{km(math.hypot(*phys(95,478)))} km du XENOPOD à vol d’oiseau'),
        ('Rob4',900,60,f'Phosphore marin, tri phosphore/arsenic · fosse · largué d’orbite, ~{km(math.hypot(*phys(900,60)))} km du XENOPOD à vol d’oiseau')]
markers = [{'id':a,'p':dpx(x,y),'t':t,'d':d} for a,x,y,t,d in acts]
robm = [{'id':a,'p':dpx(x,y),'d':d} for a,x,y,d in robs]
pathpx = [px(*p) for p in pp]
labels = [(k, dpx(x,y)) for k,(x,y) in {
 'jungle':(-70,-70),'pitons':(-85,125),'cavernes':(110,205),'massifs':(-420,300),'glaciers':(-100,372),'biolum':(95,520),'plaines':(320,500),
 'ancienne':(425,365),'canyon':(462,235),'cristal':(600,92),'arc':(640,235),'lave':(590,-70),'sel':(330,-195),'arsenic':(830,-70),
 'fosse':(925,325),'desert':(-420,560),'savane':(300,60),'mangrove':(705,-225)}.items()]
# world: corridor box in world px
def wpx(lon,lat): return [round((lon+180)/360*W,1), round((90-lat)/180*H,1)]
lon0 = 48+cx0/KM; lon1 = 48+cx1/KM; lat0 = 1+cy0/KM; lat1 = 1+cy1/KM
box = wpx(lon0,lat1)+wpx(lon1,lat0)
PLACE_INFO = {
 'A': {'t':'le continent du corridor', 'd':"60 % des terres. De l'équateur aux moyennes latitudes : jungle de fleuve, savanes, grands déserts intérieurs (le tiers du continent), forêts pourpres au nord. Le corridor de Seed est sur sa côte ouest, entre le Golfe 1 et le Golfe 2 : massif, karst, arc volcanique et remontée marine côte à côte.", 'm':"Mesuré depuis l'orbite : eau, carbone, azote, phosphore (guano), soufre, métaux, remontée, dans un rayon de ~3 000 km. Choisi.", 'w':''},
 'B': {'t':'les grands fleuves', 'd':"20 % des terres. Nord-ouest, tempéré : saisons émoussées, forêts à feuilles pourpres persistantes, côtes à mangroves. Les plus grands fleuves de Korê coulent vers l'Océan 1 ; la plus grande forêt de la planète.", 'm':"Mesuré : eau et carbone en abondance, phosphore diffus, aucun gisement concentré. Pas choisi : tout y est, mais dispersé.", 'w':''},
 'C': {'t':'le continent austral', 'd':"12 % des terres. Sud-ouest : toundra sans calotte, nuits de deux mois, massifs anciens ; le plus vieux socle de la planète, des métaux à nu.", 'm':"Mesuré : métaux et soufre ; peu d'eau liquide une partie de l'année. Pas choisi : trop froid, trop sombre la moitié de l'année pour une gestation à l'énergie solaire.", 'w':''},
 'D': {'t':'le continent polaire', 'd':"8 % des terres. Nord polaire : toundra, marées fortes, grandes migrations d'herbivores vers le pôle au début de l'été.", 'm':"Mesuré : vie abondante en été, absente en hiver. Pas choisi.", 'w':''},
 'Océan 1': {'t':'le grand océan', 'd':"~39 % du globe : presque toute l'eau de Korê, entre B, C et la côte ouest de A. Récifs de silice sur ses bords, remontées face aux côtes désertiques, îles à guano.", 'm':'', 'w':''},
 'Océan 2': {'t':'la mer de la fosse', 'd':"~1 % du globe : la mer intérieure à l'est du corridor, dans laquelle s'ouvre le Golfe 2. La fosse (10 km), Rob4, les os du Titan des mers dans ses falaises.", 'm':'', 'w':''},
 'Océan 3': {'t':'mer fermée', 'd':"~1 % du globe : une mer fermée au sud de B, sans rôle dans le film.", 'm':'', 'w':''},
 'Golfe 1': {'t':"l'embouchure", 'd':"À l'ouest du corridor ; le fleuve de la jungle s'y jette. Un rift qui s'ouvre de ~3 cm/an depuis ~20 Ma. En entonnoir : 10 à 15 m de marée aux vives-eaux, des estrans de plusieurs kilomètres, un mascaret dans le fleuve.", 'm':'', 'w':''},
 'Golfe 2': {'t':"la mer d'arsenic", 'd':"À l'est ; la mer d'arsenic, fermée par l'arc volcanique : moins d'un mètre de marée, une mer calme. L'arsenic vient des volcans ; la vie y sait trier l'arsenic du phosphore.", 'm':"Rob4 ; la guérison de Seed (Acte VII).", 'w':''},
}
places = []
for p in meta['places']:
    q = {'code':p['code'],'kind':p['kind'],'w':wpx(p['lon'],p['lat']),'info':PLACE_INFO.get(p['code'],{})}
    if p['kind']=='continent': q['pct'] = round(p['pct_land'])
    if p['kind']=='gulf': q['c'] = px((p['lon']-48)*KM, (p['lat']-1)*KM)
    places.append(q)

# ---------- v3 : plaques ----------
PJ = json.load(open('plates.json'))
PLATE_INFO = {
 'A':  ('Plaque A', "Le continent A : le corridor, les déserts intérieurs, la côte est jusqu'à la dorsale de l'Océan 1.", "Ouest : le rift du Golfe 1. À l'est du corridor : la fosse où plonge la plaque de l'Océan 2. Au nord du corridor : la suture du bloc des Plaines, collision achevée.", 'validé (round 15)'),
 'G1': ('Plaque ouest', "Le bloc qui s'écarte de A à l'ouest du rift du Golfe 1, depuis ~20 Ma (ligne « Rift du Golfe 1 » du tableau de la Bible).", "Est : le rift du Golfe 1, 3 cm/an d'ouverture. Ouest : le fond de la plaque centrale plonge sous sa côte.", 'validé (rounds 15 et 16)'),
 'O2': ("Plaque de l'Océan 2", "Le fond de l'Océan 2 et du Golfe 2, entre la fosse et une courte dorsale à l'est : ce que la dorsale fabrique, la fosse l'avale.", "Ouest : plonge sous A le long de la fosse de 10 km (validé). Est : courte dorsale. Subduction plane : la plaque plonge en pente très douce, l'arc s'ouvre ~1 200 km en arrière de la fosse.", 'validé (rounds 15 et 16)'),
 'O1': ("Plaque de l'Océan 1", "Le fond de l'Océan 1 entre la dorsale qui le sépare de A et les côtes ouest de B et de C.", "Dorsale de l'Océan 1 ; plonge sous B et C : arcs, archipels, îles à guano.", 'validé (round 15)'),
 'B':  ('Plaque B', "Le continent B et le fond de l'Océan 1 jusqu'à la dorsale centrale : marge passive à l'est, avec ses grands fleuves et ses mangroves.", "Ouest : l'Océan 1 plonge sous sa côte (arc). Nord : le rift polaire avec D. Sud : faille transformante avec C.", 'validé (round 15)'),
 'C':  ('Plaque C', "Le continent C, le socle le plus vieux ; un bouclier stable.", "Ouest : l'Océan 1 plonge sous sa côte. Est : la dorsale centrale. Nord : faille transformante avec B.", 'validé (round 15)'),
 'D':  ('Plaque D', "Le continent D ; marges basses où la marée entre loin.", "Rift polaire avec B ; dorsale centrale au sud.", 'validé (round 15)'),
 'X':  ('Plaque centrale', "Le fond est de l'Océan 1, né à la dorsale centrale, au milieu de l'Océan 1.", "Plonge sous la côte ouest de la plaque ouest. Elle est ce qui permet à la dorsale centrale d'exister avec les vitesses validées (A et la plaque ouest vont vers l'ouest plus vite que B).", 'validé (round 16)'),
}
VALID = {('A','G1','rift'), ('A','O2','subduction'), ('B','O1','subduction'), ('C','O1','subduction'), ('B','D','rift'), ('A','O1','ridge')}
def pname(c): return PLATE_INFO[c][0] if c in PLATE_INFO else 'Petite plaque océanique'
plines = []
for l in PJ['lines']:
    key = tuple(sorted((l['a'], l['b']))) + (l['t'],)
    st = 'validé (round 15)' if key in VALID else 'validé (round 16)'
    under = None
    if l['t'] == 'subduction': under = l['b'] if l['over'] == l['a'] else l['a']
    plines.append({'t': l['t'], 'pts': l['pts'], 'a': pname(l['a']), 'b': pname(l['b']), 'r': abs(l['rate']), 'rel': l['rel'],
                   'over': pname(l['over']) if l['over'] else None, 'under': pname(under) if under else None, 'st': st})
# position des étiquettes : pôle d'inaccessibilité, loin des pôles et des bords de carte
from scipy import ndimage as _nd
_L = np.load('plates_L.npy'); _codes = ['A','G1','O2','O1','B','C','D','X']+['s%d'%i for i in range(1,13)]
_lat = np.linspace(90, -90, _L.shape[0])[:, None]*np.ones((1, _L.shape[1]))
_ok = (np.abs(_lat) <= 52); _ok[:, :30] = False; _ok[:, -30:] = False
_pos = {}
for _i, _c in enumerate(_codes):
    _m = (_L == _i) & _ok
    if _m.sum() < 50: continue
    _dt = _nd.distance_transform_edt(_m); _r, _cc = np.unravel_index(np.argmax(_dt), _dt.shape)
    _pos[_c] = [float(_cc)+0.5, float(_r)+0.5]
plabels = []
for lb in PJ['labels']:
    if lb['code'] in _pos: lb['x'], lb['y'] = _pos[lb['code']]
    if lb['code'] in PLATE_INFO:
        n, d, lim, st = PLATE_INFO[lb['code']]
        v = lb['v']; sp = math.hypot(*v)
        plabels.append({'code': lb['code'], 'n': n, 'd': d, 'lim': lim, 'st': st, 'p': [lb['x'], lb['y']], 'v': v, 'sp': round(sp),
                        'dy': {'O2': 70}.get(lb['code'], 0)})
# corridor : lignes du monde converties + failles dessinées
def w2c(x, y):
    lon = x/W*360 - 180; lat = 90 - y/H*180
    return px((lon-48)*KM, (lat-1)*KM)
cpl = []
for l in plines:
    P = [w2c(*q) for q in l['pts']]
    run = []
    for q in P:
        if -60 <= q[0] <= CW+60 and -60 <= q[1] <= CH+60: run.append(q)
        else:
            if len(run) >= 2: cpl.append(dict(l, pts=run))
            run = []
    if len(run) >= 2: cpl.append(dict(l, pts=run))
def dline(pts, n=24):
    out = []
    for a_, b_ in zip(pts[:-1], pts[1:]):
        for t in np.linspace(0, 1, n, endpoint=False): out.append(dpx(a_[0]+(b_[0]-a_[0])*t, a_[1]+(b_[1]-a_[1])*t))
    out.append(dpx(*pts[-1])); return out
suture = dline([(-560, 358), (-300, 368), (0, 380), (250, 390), (430, 398)])
faille = dline([(-120, -190), (-80, -80), (-48, 34), (-15, 130), (12, 222), (30, 285)])
cpl.append({'t': 'suture', 'pts': suture, 'a': 'Plaque A', 'b': 'bloc des Plaines', 'r': 0, 'rel': 0, 'over': None, 'under': None, 'st': 'validé (Géologie, round 15)'})
cpl.append({'t': 'faille', 'pts': faille, 'a': 'Plaque A', 'b': '', 'r': 0, 'rel': 0, 'over': None, 'under': None, 'st': 'validé (round 16)'})
clabels = [
 {'n': 'Suture du bloc des Plaines', 'p': dpx(-250, 395)},
 {'n': 'Faille de la jungle', 'p': dpx(-150, 60)},
]
data_plates = {'lines': plines, 'labels': plabels, 'clines': cpl, 'clabels': clabels}

data = {'biomes':biomes, 'plates': data_plates,'markers':markers,'robs':robm,'path':pathpx,'labels':[{'k':k,'p':p,'n':INFO[k][0]} for k,p in labels],
        'box':box,'W':W,'H':H,'CW':CW,'CH':CH,'landpct':round(stats['_land_pct'],1),'kmpx':round((cx1-cx0)/CW,2),
        'bk':[cx0,cx1,cy0,cy1], 'boxlabel': f"Corridor de Seed · ~{km(cx1-cx0)} × {km(cy1-cy0)} km", 'places': places,
        'dist': {'rob2':km(d_rob2),'col':km(d_col),'rob3':km(d_rob3),'rob4':km(d_rob4),'sel':km(d_sel),'loop':km(loop_km)}}

html = open('map_template_v3.html', encoding='utf-8').read()
html = html.replace('__WORLD__', 'data:image/png;base64,'+w64).replace('__CORRIDOR__','data:image/png;base64,'+c64).replace('__DATA__', json.dumps(data, ensure_ascii=False))
open('carte-kore.html','w',encoding='utf-8').write(html)
print('lignes', len(plines), 'corridor', len(cpl), 'étiquettes', [p['code']+str([round(v) for v in p['p']]) for p in plabels])
print(len(html)//1024, 'KB', data['dist'], 'straight:', {r[0]: round(math.hypot(*phys(r[1],r[2]))) for r in robs})
