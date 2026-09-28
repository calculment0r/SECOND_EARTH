"""Carte v3 : couche des plaques (round 15, G02-A).
Partition en plaques (graines pondérées + bruit), recalage sur les continents et sur le corridor,
classement des limites d'après les vitesses relatives, vectorisation en polylignes pour le SVG."""
import numpy as np, json
from scipy import ndimage
from scipy.spatial import cKDTree
from skimage import measure

a = np.load('world_arrays.npz')
land, cont, ocean = a['land'], a['cont'], a['ocean']
H, W = land.shape
lat1 = np.linspace(90, -90, H); lon1 = np.linspace(-180, 180, W)
LAT, LON = np.meshgrid(lat1, lon1, indexing='ij')
RK = 7330.0   # rayon de Korê, km

def xyz(lon, lat):
    lo, la = np.deg2rad(lon), np.deg2rad(lat)
    return np.stack([np.cos(la)*np.cos(lo), np.cos(la)*np.sin(lo), np.sin(la)], -1)

def noise(shape, octaves=(3,6,12,24), persistence=0.55, seed=0):
    r = np.random.default_rng(seed); Hh, Ww = shape; out = np.zeros(shape); amp = 1.0; tot = 0
    for o in octaves:
        g = r.random((o, 2*o)); z = ndimage.zoom(g, (Hh/o, Ww/(2*o)), order=3)[:Hh,:Ww]
        out += amp*z; tot += amp; amp *= persistence
    out /= tot; return (out-out.min())/(out.max()-out.min())

# ---------- lignes imposées par la Bible ----------
# rift du Golfe 1 : axe mesuré dans l'eau du golfe (lat -4,5..23), prolongé au sud jusqu'à la côte
water = ~land
axis = {}
for j in range(H):
    la = lat1[j]
    if -4.5 <= la <= 23:
        sel = water[j] & (lon1 > 26) & (lon1 < 40)
        if sel.any(): axis[round(la, 2)] = float(lon1[sel].mean())
ax_lat = np.array(sorted(axis)); ax_lon = np.array([axis[k] for k in ax_lat])
ax_lon = ndimage.gaussian_filter1d(ax_lon, 6)
wig = noise((H, W), octaves=(4,8,16), seed=71)
def rift_lon(la):
    lo_min, lo_max = ax_lat.min(), ax_lat.max()
    if lo_min <= la <= lo_max: return float(np.interp(la, ax_lat, ax_lon))
    if la < lo_min:   # au sud du golfe : le rift serpente vers le sud-est
        t = lo_min - la
        return ax_lon[0] + 0.10*t + 2.6*np.sin(t/7.0) + 1.2*np.sin(t/2.3+1)
    t = la - lo_max   # au nord : il traverse la baie vers la côte de D
    return ax_lon[-1] - 0.15*t + 2.0*np.sin(t/5.0+0.5)
RIFT = np.array([rift_lon(la) for la in lat1])[:, None] + 1.2*(wig-0.5)
# fosse : axe dessiné du corridor (design x = 925 km), converti en longitude, prolongé hors du corridor
R0, KF, WS, KM = 260.0, 4.0, 30.0, 128.0
def _Tr(r): return r + (KF-1)*WS*np.log1p(np.exp(np.clip((r-R0)/WS, -50, 50)))
_yd = np.linspace(-700, 1200, 2000); _r = np.hypot(925.0, _yd); _f = _Tr(_r)/_r
_lat_t = 1 + (_yd*_f)/KM; _lon_t = 48 + (925.0*_f)/KM
def trench_lon(la):
    if _lat_t.min() <= la <= _lat_t.max(): return float(np.interp(la, _lat_t, _lon_t))
    return float(_lon_t[0] if la < _lat_t.min() else _lon_t[-1])
TRENCH = np.array([trench_lon(la) for la in lat1])[:, None] + np.where(np.abs(LAT-7.5) > 12.5, 0.8*np.sin(np.deg2rad(LAT)*9)+0.5*(wig-0.5), 0)
RIDGE_O2 = 77.8 + 0.9*np.sin(np.deg2rad(LAT)*7+1) + 0.8*(wig-0.5)     # dorsale courte à l'est de l'Océan 2

# ---------- plaques : code, nom, vitesse (est, nord) en cm/an, graines ----------
# vitesses : A ~8 vers l'ouest (validé) ; ouverture du rift ~3 ; Océan 2 ~15 ; Océan 1 ~12 ; B ~6 ; C ~2 ; D ~4
PL = [
 ('A',  'Plaque A',                (-8.0,  0.0)),
 ('G1', 'Plaque ouest (rift du Golfe 1)', (-11.0, 0.0)),
 ('O2', "Plaque de l'Océan 2",     (-15.0, 0.0)),
 ('O1', "Plaque de l'Océan 1",     (10.0, -6.0)),
 ('B',  'Plaque B',                (-6.0,  0.0)),
 ('C',  'Plaque C',                (-2.0,  0.0)),
 ('D',  'Plaque D',                (0.0,   4.0)),
 ('X',  'Plaque centrale',         (4.0,   0.0)),
 ('s1', 'Petite plaque', (6.0, 4.0)),  ('s2', 'Petite plaque', (7.0, -8.0)),  ('s3', 'Petite plaque', (-3.0, 4.0)),
 ('s4', 'Petite plaque', (-4.0, -2.0)), ('s5', 'Petite plaque', (-8.5, 3.0)), ('s6', 'Petite plaque', (2.0, 4.5)),
 ('s7', 'Petite plaque', (3.0, -4.0)), ('s8', 'Petite plaque', (-6.0, -4.0)), ('s9', 'Petite plaque', (-4.0, -5.0)),
 ('s10','Petite plaque', (-2.0, 3.0)), ('s11','Petite plaque', (5.0, 2.0)),  ('s12','Petite plaque', (-10.0, -2.0)),
]
codes = [p[0] for p in PL]; ci = {c:i for i,c in enumerate(codes)}
VEL = np.array([p[2] for p in PL])

# graines : (plaque, 'land'/'pt', données, poids, rayon max km)
landA = (cont == 1) & (np.abs(LAT) <= 62)
seeds = [
 ('A',  'mask', landA & (LON > RIFT) & (LON < TRENCH), 1.0, None),
 ('A',  'pts', [(110,20),(125,-20),(100,40),(140,50),(80,-45),(150,-60),(60,70),(120,75),(168,12),(170,-12),(168,-30),(160,25)], 1.0, None),
 ('G1', 'mask', landA & (LON <= RIFT), 2.4, None),
 ('G1', 'pts', [(5,-55),(10,40)], 1.4, None),
 ('O1', 'pts', [(-171,5),(-170,-25),(-172,30),(-175,52),(-168,-52),(-166,-10)], 1.0, None),
 ('B',  'mask', cont == 2, 2.4, None),
 ('B',  'pts', [(-72,20),(-70,0),(-75,40),(-78,-5),(-160,85)], 1.0, None),
 ('C',  'mask', cont == 3, 2.4, None),
 ('C',  'pts', [(-62,-28),(-70,-55),(-95,-25)], 1.0, None),
 ('D',  'mask', cont == 4, 1.0, None),
 ('D',  'pts', [(-30,88)], 1.0, None),
 ('X',  'pts', [(-30,0),(-28,-20),(-35,20),(-25,-40)], 1.0, None),
 ('s1', 'pts', [(160,36),(166,42),(172,47)], 1.0, 1300), ('s2', 'pts', [(-179,-30),(-176,-37),(-172,-43)], 1.0, 1200),
 ('s3', 'pts', [(118,18),(126,24),(133,29)], 1.0, 1100), ('s4', 'pts', [(-136,-12)], 1.0, 900),
 ('s5', 'pts', [(6,30),(13,33),(20,35)], 1.0, 1000), ('s6', 'pts', [(-58,28),(-52,33),(-46,37)], 1.0, 1200),
 ('s7', 'pts', [(-52,-38),(-47,-44),(-42,-49)], 1.0, 1200), ('s8', 'pts', [(15,-55),(22,-58),(30,-60)], 1.0, 1200),
 ('s9', 'pts', [(92,-55),(100,-58),(108,-61)], 1.0, 1200), ('s10','pts', [(-100,76),(-92,79)], 1.0, 1000),
 ('s11','pts', [(-40,8),(-37,2),(-34,-4)], 1.0, 900), ('s12','pts', [(48,-57),(56,-59),(63,-61)], 1.0, 1000),
]

# ---------- partition sur une grille à 0,5° ----------
st = 2
G = xyz(LON[::st, ::st], LAT[::st, ::st]).reshape(-1, 3)
gh, gw = LAT[::st, ::st].shape
D = np.full((len(PL), gh*gw), np.inf)
for code, kind, dat, w, rmax in seeds:
    if kind == 'mask':
        pts = xyz(LON[dat], LAT[dat])[::3]
    else:
        pts = xyz(np.array([p[0] for p in dat], float), np.array([p[1] for p in dat], float))
    d, _ = cKDTree(pts).query(G)
    d = 2*RK*np.arcsin(np.clip(d/2, 0, 1))
    i = ci[code]
    if rmax:
        nz = noise((gh, gw), octaves=(6,12,24), seed=500+i).ravel()
        d = np.where(d <= rmax*(0.55+0.9*nz), d, np.inf)
    D[i] = np.minimum(D[i], w*d)
for i in range(len(PL)):
    D[i] += 520*(noise((gh, gw), seed=200+i).ravel()-0.5)*2
# vitesses des petites plaques : celle de la grande plaque qui les porte, plus un écart de ~4 cm/an
big = [ci[c] for c in ('A','G1','O2','O1','B','C','D','X')]
host = np.array(big)[np.argmin(D[big], 0)]
rng = np.random.default_rng(15)
for c in codes:
    if c.startswith('s'):
        i = ci[c]; m = np.isfinite(D[i]) & (np.argmin(D, 0) == i)
        h = np.bincount(host[m]).argmax() if m.any() else ci['O1']
        ang = rng.uniform(0, 2*np.pi); VEL[i] = VEL[h] + 4.5*np.array([np.cos(ang), np.sin(ang)])
lab = np.argmin(D, 0).reshape(gh, gw)
L = np.repeat(np.repeat(lab, st, 0), st, 1)[:H, :W]

# ---------- recalage ----------
L[(cont == 2)] = ci['B']; L[(cont == 3)] = ci['C']; L[(cont == 4)] = ci['D']
L[landA & (LON <= RIFT)] = ci['G1']; L[landA & (LON > RIFT)] = ci['A']
# terres polaires de A : seulement des plaques continentales
contp = [ci[c] for c in ('A','G1','B','C','D')]
Dc = D[contp].reshape(len(contp), gh, gw).argmin(0)
Lc = np.array(contp)[np.repeat(np.repeat(Dc, st, 0), st, 1)[:H, :W]]
polarA = (cont == 1) & ~landA
L[polarA] = Lc[polarA]
# Océan 2 : la plaque ne tient que la bande entre la fosse et la dorsale ; le reste de la mer est à A
o2 = (ocean == 2)
L[o2] = ci['A']
L[o2 & (LON >= TRENCH) & (LON <= RIDGE_O2)] = ci['O2']
# le Golfe 1 : moitié ouest à G1, moitié est à A (le rift passe au milieu)
g1w = water & (np.abs(LAT) < 30) & (LON > 20) & (LON < 40) & (LAT > -5)
L[g1w & (LON <= RIFT)] = ci['G1']; L[g1w & (LON > RIFT)] = ci['A']
# mer fermée (Océan 3) : une petite plaque
L[ocean == 3] = ci['s4']

# nettoyage : composantes trop petites absorbées par leur voisinage
for _ in range(2):
    for i in range(len(PL)):
        m = L == i
        cc, n = ndimage.label(m)
        if n == 0: continue
        sizes = ndimage.sum(np.ones_like(cc), cc, range(1, n+1))
        for k, s in enumerate(sizes):
            if s < 900:
                comp = cc == (k+1)
                ring = ndimage.binary_dilation(comp, iterations=2) & ~comp
                vals = L[ring]
                if vals.size: L[comp] = np.bincount(vals).argmax()
L = ndimage.median_filter(L, size=5, mode='wrap')
# re-imposer les recalages après le filtre
L[(cont == 2)] = ci['B']; L[(cont == 3)] = ci['C']; L[(cont == 4)] = ci['D']
L[landA & (LON <= RIFT)] = ci['G1']; L[landA & (LON > RIFT)] = ci['A']
L[o2] = ci['A']; L[o2 & (LON >= TRENCH) & (LON <= RIDGE_O2)] = ci['O2']
L[g1w & (LON <= RIFT)] = ci['G1']; L[g1w & (LON > RIFT)] = ci['A']
L[ocean == 3] = ci['s4']

# ---------- limites : contours, voisin, type ----------
near_land = ndimage.binary_dilation(land, iterations=4)
segs = []
def classify(p, q, r, c, n_e, n_n):
    dv = VEL[q] - VEL[p]; mag = np.hypot(*dv)
    rate = dv[0]*n_e + dv[1]*n_n     # > 0 : ouverture
    if mag < 1e-6: return 'transform', None
    if rate > 0.35*mag:
        onland = land[min(max(int(round(r)),0),H-1), int(round(c)) % W]
        both = side_land(p, r, c, -n_e, -n_n) and side_land(q, r, c, n_e, n_n)
        return ('rift' if (onland or both) else 'ridge'), None
    if rate < -0.35*mag:
        lp, lq = side_land(p, r, c, -n_e, -n_n), side_land(q, r, c, n_e, n_n)
        if lp and lq: return 'collision', None
        if lp: return 'subduction', p
        if lq: return 'subduction', q
        cp, cq = codes[p] in CONT, codes[q] in CONT
        if cp and not cq: return 'subduction', p      # l'océan plonge sous la plaque continentale
        if cq and not cp: return 'subduction', q
        tp = VEL[p][0]*n_e + VEL[p][1]*n_n; tq = -(VEL[q][0]*n_e + VEL[q][1]*n_n)
        return 'subduction', (q if tp >= tq else p)    # la plus rapide vers la limite plonge
    return 'transform', None
def lab_land(p, q, r, c):
    return True
CONT = {'A','G1','B','C','D'}
def side_land(pl, r, c, de, dn, steps=(2,4,6,8,12,16)):
    """terre dans les 1,5° du côté de la plaque pl"""
    for s in steps:
        rr = int(round(r - dn*s)); cc_ = int(round(c + de*s/np.maximum(np.cos(np.deg2rad(lat1[int(r)])), 0.2)))
        rr = min(max(rr, 0), H-1); cc_ = cc_ % W
        if L[rr, cc_] == pl and land[rr, cc_]: return True
    return False

out = []
for p in range(len(PL)):
    m = np.pad((L == p).astype(float), 1, constant_values=0)
    for cont_ in measure.find_contours(m, 0.5):
        cont_ = cont_ - 1
        if len(cont_) < 6: continue
        # voisin q et normale (de p vers q) en chaque point
        d = np.gradient(cont_, axis=0)
        tan_r, tan_c = d[:,0], d[:,1]
        nrm = np.hypot(tan_r, tan_c)+1e-9
        # normale écran candidate ; on choisit le côté qui n'est pas p
        nr, nc = -tan_c/nrm, tan_r/nrm
        qs = []; nes = []; nns = []
        for (r, c), a1, b1 in zip(cont_, nr, nc):
            r1, c1 = int(round(r + 1.2*a1)), int(round(c + 1.2*b1))
            r2, c2 = int(round(r - 1.2*a1)), int(round(c - 1.2*b1))
            r1 = min(max(r1,0),H-1); r2 = min(max(r2,0),H-1); c1 %= W; c2 %= W
            if L[r1, c1] != p: q, sr, sc = L[r1, c1], a1, b1
            elif L[r2, c2] != p: q, sr, sc = L[r2, c2], -a1, -b1
            else: q, sr, sc = -1, a1, b1
            qs.append(q)
            # normale géographique (est, nord) de p vers q
            coslat = max(np.cos(np.deg2rad(90 - r*180/(H-1))), 0.15)
            ne, nn = sc*coslat, -sr; k = np.hypot(ne, nn)+1e-9
            nes.append(ne/k); nns.append(nn/k)
        qs = np.array(qs)
        # tronçons de voisin constant, seulement p < q
        i0 = 0
        for i in range(1, len(qs)+1):
            if i == len(qs) or qs[i] != qs[i0]:
                q = qs[i0]
                if q > p and i - i0 >= 4:
                    pts = cont_[i0:i]
                    # rupture au passage du bord de carte
                    jumps = np.where(np.abs(np.diff(pts[:,1])) > W/2)[0]
                    for sub_pts, sl in ((pts, slice(i0, i)),) if len(jumps) == 0 else ((pts, slice(i0, i)),):
                        types = []; overs = []
                        for k_ in range(i0, i):
                            t, ov = classify(p, q, cont_[k_,0], cont_[k_,1], nes[k_], nns[k_])
                            types.append(t); overs.append(ov)
                        out.append({'p': p, 'q': int(q), 'pts': pts, 'types': types, 'overs': overs,
                                    'ne': np.array(nes[i0:i]), 'nn': np.array(nns[i0:i])})
                i0 = i

# lissage des types le long de chaque tronçon puis découpe
from collections import Counter
lines = []
for s in out:
    T = s['types']; n = len(T); win = 12
    sm = []
    for i in range(n):
        c = Counter(T[max(0,i-win):i+win+1]); sm.append(c.most_common(1)[0][0])
    Ov = s['overs']
    i0 = 0
    for i in range(1, n+1):
        if i == n or sm[i] != sm[i0]:
            if i - i0 >= 3:
                pts = s['pts'][i0:i]
                t = sm[i0]
                ov = None
                if t == 'subduction':
                    c = Counter([o for o in Ov[i0:i] if o is not None]); ov = c.most_common(1)[0][0] if c else s['q']
                # orientation : plaque chevauchante à gauche (écran, y vers le bas)
                if t == 'subduction':
                    tr, tc = pts[-1] - pts[0]
                    # côté de la plaque chevauchante : on regarde la normale du milieu
                    k = len(pts)//2; mid = pts[k]
                    seg = pts[min(k+1, len(pts)-1)] - pts[max(k-1, 0)]
                    left_r, left_c = -seg[1], seg[0]      # gauche écran : (dy, -dx) en (x,y) -> en (r,c) : (-dc, dr)
                    left_r, left_c = -seg[1], seg[0]
                    rr = int(round(mid[0] + 3*left_r/ (np.hypot(*seg)+1e-9))); cc_ = int(round(mid[1] + 3*left_c/(np.hypot(*seg)+1e-9)))
                    rr = min(max(rr,0),H-1); cc_ %= W
                    if L[rr, cc_] != ov: pts = pts[::-1]
                # coupe aux sauts de bord de carte
                latp = 90 - pts[:,0]*180/(H-1)
                pts = pts.copy(); pts[np.abs(latp) > 72] = np.nan
                cut = np.where((np.abs(np.diff(pts[:,1])) > 5) | np.isnan(np.diff(pts[:,1])))[0]
                parts = np.split(pts, cut+1) if len(cut) else [pts]
                for pp in parts:
                    pp = pp[~np.isnan(pp).any(1)]
                    if len(pp) >= 3:
                        dv = VEL[s['q']] - VEL[s['p']]; nm = np.array([s['ne'][i0:i].mean(), s['nn'][i0:i].mean()]); nm /= (np.hypot(*nm)+1e-9)
                        lines.append({'t': t, 'a': codes[s['p']], 'b': codes[s['q']], 'over': (codes[ov] if ov is not None else None),
                                      'rate': round(float(dv @ nm), 1), 'rel': round(float(np.hypot(*dv)), 1),
                                      'pts': [[round(float(c_)+0.5, 1), round(float(r_)+0.5, 1)] for r_, c_ in pp[::2]]})
            i0 = i

# simplification (Douglas-Peucker léger)
def simplify(P, tol=0.6):
    P = np.array(P)
    if len(P) < 3: return P.tolist()
    keep = measure.approximate_polygon(P, tolerance=tol)
    return keep.tolist()
for l in lines: l['pts'] = simplify(l['pts'])

# ---------- étiquettes de plaque : pôle d'inaccessibilité ----------
labels = []
for i, (c, name, v) in enumerate(PL):
    m = L == i
    if m.sum() < 200: continue
    dt = ndimage.distance_transform_edt(m)
    r, cc_ = np.unravel_index(np.argmax(dt), dt.shape)
    labels.append({'code': c, 'name': name, 'x': float(cc_)+0.5, 'y': float(r)+0.5, 'v': [float(v[0]), float(v[1])],
                   'area': float((np.cos(np.deg2rad(LAT))[m]).sum()/np.cos(np.deg2rad(LAT)).sum()*100)})

stats = Counter(l['t'] for l in lines)
lens = {t: round(sum(np.hypot(*np.diff(np.array(l['pts']), axis=0).T).sum() for l in lines if l['t']==t)) for t in stats}
print('trench lon at lat 0/8/19:', [round(trench_lon(x),2) for x in (0,8,19)])
print('segments', dict(stats), 'longueurs px', lens, 'plaques', len(labels))
json.dump({'lines': lines, 'labels': labels}, open('plates.json', 'w'), ensure_ascii=False)
np.save('plates_L.npy', L.astype(np.int8))
# aperçu
from PIL import Image, ImageDraw
img = Image.open('world.png').convert('RGB').resize((W*2, H*2), Image.NEAREST)
dr = ImageDraw.Draw(img)
col = {'ridge': (220,30,60), 'rift': (220,30,60), 'subduction': (20,20,30), 'transform': (90,90,110), 'collision': (120,60,20)}
for l in lines:
    P = [(x*2, y*2) for x, y in l['pts']]
    dr.line(P, fill=col[l['t']], width=(4 if l['t'] in ('ridge','subduction') else 2))
    if l['t'] == 'subduction':
        P = np.array(P)
        for k in range(0, len(P)-1, 3):
            a_, b_ = P[k], P[k+1]; d_ = b_-a_; n_ = np.hypot(*d_)+1e-9; d_ /= n_
            left = np.array([d_[1], -d_[0]])
            m_ = (a_+b_)/2
            dr.polygon([tuple(m_ - 4*d_), tuple(m_ + 4*d_), tuple(m_ + 7*left)], fill=(20,20,30))
for lb in labels:
    dr.text((lb['x']*2, lb['y']*2), lb['code'], fill=(0,0,0))
img.save('plates_preview.png')
