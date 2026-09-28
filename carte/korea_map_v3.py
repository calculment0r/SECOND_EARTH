import numpy as np, json
from scipy import ndimage
from PIL import Image
from matplotlib.path import Path

rng = np.random.default_rng(61)

# ---------- palette (exact colors, no antialiasing) ----------
B = {
 'ocean':        ('Océan profond',                '#b8c9d9'),
 'recifs':       ('Mers peu profondes et récifs de silice', '#c4e2ea'),
 'remontees':    ('Zones de remontée océanique',  '#a3bfd2'),
 'fosse':        ('Fosse océanique',              '#7f93a8'),
 'arsenic':      ("Mer d'arsenic",                '#9fb8a6'),
 'jungle':       ('Jungle primordiale',           '#7a3c8a'),
 'pitons':       ('Pitons karstiques',            '#b58cc2'),
 'cavernes':     ('Terres rocheuses et cavernes', '#8c7f78'),
 'massifs':      ('Massifs et glaciers',          '#aaa6b4'),
 'glaciers':     ('Glaciers',                     '#f2f1f5'),
 'biolum':       ('Forêt bioluminescente',        '#4f7f8f'),
 'plaines':      ('Hautes Plaines',               '#9fb0b8'),
 'ancienne':     ('Forêt ancienne',               '#3f5a3a'),
 'canyon':       ('Canyon ocre',                  '#c98a5a'),
 'cristal':      ('Forêts cristallines',          '#d9c9e0'),
 'arc':          ('Arc volcanique',               '#4a3f43'),
 'lave':         ('Plaines de lave et tunnels',   '#2f2b2e'),
 'sel':          ('Lacs salés pourpres',          '#d98cc0'),
 'desert':       ('Grands déserts continentaux',  '#e3c48f'),
 'savane':       ('Savanes à feu',                '#c9a86a'),
 'saison':       ('Forêts des moyennes latitudes','#8a5a86'),
 'toundra':      ('Toundra polaire',              '#c8c3b0'),
 'mangrove':     ('Mangroves et côtes à marées',  '#5f7f5a'),
 'fleuve':       ('Fleuve',                       '#6fa7c9'),
 'rouge':        ('Rivière rouge (acide)',        '#c0392b'),
 'lac':          ('Lac salé (eau)',               '#e9b8dc'),
}
keys = list(B.keys()); idx = {k:i for i,k in enumerate(keys)}
pal = np.array([[int(B[k][1][1:3],16),int(B[k][1][3:5],16),int(B[k][1][5:7],16)] for k in keys], dtype=np.uint8)

def hexrgb(k): return B[k][1]

# ---------- noise ----------
def noise(shape, octaves=(4,8,16,32,64,128), persistence=0.55, seed=0):
    r = np.random.default_rng(seed)
    H,W = shape; out = np.zeros(shape); amp=1.0; tot=0
    for o in octaves:
        g = r.random((o, 2*o))
        z = ndimage.zoom(g, (H/o, W/(2*o)), order=3)
        z = z[:H,:W]
        out += amp*z; tot += amp; amp *= persistence
    out /= tot
    out = (out-out.min())/(out.max()-out.min())
    return out

H, W = 720, 1440   # 0.25° cells, equirectangular
lat = np.linspace(90, -90, H)[:,None]*np.ones((1,W))
lon = np.linspace(-180, 180, W)[None,:]*np.ones((H,1))

base = noise((H,W), seed=61)
# corridor continent: force a big landmass around lon 48, lat 3
# the corridor continent is part of the main landmass; two gulfs frame it (west and east)
wob_w = noise((H,W), octaves=(3,6,12,24), seed=31)
ell = (((lon-56)/25.0)**2 + ((lat-7)/18.0)**2) * (1 + 0.5*(wob_w-0.5))
gw = np.exp(-(((lon-33.5)/3.0)**2 + ((lat-7)/11.0)**2)) * (1 + 0.6*(wob_w-0.5))
ge = np.exp(-(((lon-73.0)/6.0)**2 + ((lat-6)/12.0)**2)) * (1 + 0.6*(wob_w-0.5))
field = base + 0.5*np.clip(1-ell,0,1) - 0.9*gw - 0.9*ge
# ---------- corridor (hand designed, local km frame, warped coordinates for organic edges) ----------
KM = 128.0   # km per degree
def to_lonlat(x,y): return 48 + x/KM, 1 + y/KM
# Two scales (round 10, R01-C): the shapes are designed in a compact "design" frame (km around the XENOPOD);
# the physical map stretches everything beyond ~250 km radially by a factor k, so that Rob1 and Rob2 stay
# within ~250 km while Rob3 and Rob4 end up thousands of km away, with the validated layout kept.
R0, KF, WS = 260.0, 4.0, 30.0
def Tr(r):  return r + (KF-1)*WS*np.log1p(np.exp(np.clip((r-R0)/WS, -50, 50)))     # design radius -> physical radius
_rd = np.linspace(0, 6000, 12001); _rp = Tr(_rd)
def Tinv(rp): return np.interp(rp, _rp, _rd)
def to_phys(x, y):
    r = np.hypot(x, y); rp = Tr(r); f = np.where(r>0, rp/np.maximum(r,1e-9), 1.0); return x*f, y*f
def to_design(xp, yp):
    rp = np.hypot(xp, yp); rd = Tinv(rp); f = np.where(rp>0, rd/np.maximum(rp,1e-9), 1.0); return xp*f, yp*f
dx0, dx1, dy0, dy1 = -640, 1150, -320, 700   # design km box (as in v1)
DW, DH = 1400, 800
kmpx_d = (dx1-dx0)/DW
CW, CH = 2950, 1550
cx0, cx1, cy0, cy1 = -1900, 4000, -700, 2400   # physical km box
kmpx = (cx1-cx0)/CW
gx = np.linspace(cx0, cx1, CW); gy = np.linspace(cy1, cy0, CH)
Xp, Yp = np.meshgrid(gx, gy)
n1 = noise((CH,CW), octaves=(4,8,16,32,64,128), persistence=0.5, seed=21)
n2 = noise((CH,CW), octaves=(4,8,16,32,64,128), persistence=0.5, seed=22)
X, Y = to_design(Xp, Yp)                                   # design coords of each physical pixel
_f = np.maximum(np.hypot(Xp,Yp),1e-9)/np.maximum(np.hypot(X,Y),1e-9)   # local stretch factor
Xw, Yw = to_design(Xp + 55*_f*(n1-0.5)*2, Yp + 55*_f*(n2-0.5)*2) # warped (organic edges, proportional to the stretch)
fine = noise((CH,CW), octaves=(16,32,64,128), persistence=0.5, seed=23)

def ellipse(cxk, cyk, rx, ry, rot=0.0, warp=1.0):
    c, s_ = np.cos(rot), np.sin(rot)
    xx = X + warp*(Xw-X); yy = Y + warp*(Yw-Y)
    xr = (xx-cxk)*c + (yy-cyk)*s_; yr = -(xx-cxk)*s_ + (yy-cyk)*c
    return (xr/rx)**2 + (yr/ry)**2 <= 1
def poly(pts, warp=1.0):
    xx = X + warp*(Xw-X); yy = Y + warp*(Yw-Y)
    return Path(pts).contains_points(np.c_[xx.ravel(), yy.ravel()]).reshape(CH,CW)
from PIL import ImageDraw
def linemask(pts, width):
    """wide band drawn in the design frame (width in design px), sampled on the physical grid"""
    img = Image.new('L', (DW,DH), 0); d = ImageDraw.Draw(img)
    def px(pt): return ((pt[0]-dx0)/(dx1-dx0)*DW, (dy1-pt[1])/(dy1-dy0)*DH)
    d.line([px(pt) for pt in pts], fill=255, width=width, joint='curve')
    m = np.array(img)>0
    ci = np.round((X-dx0)/(dx1-dx0)*DW).astype(int); cj = np.round((dy1-Y)/(dy1-dy0)*DH).astype(int)
    ok = (ci>=0)&(ci<DW)&(cj>=0)&(cj<DH)
    out = np.zeros((CH,CW), bool); out[ok] = m[cj[ok], ci[ok]]
    return out
def densify(pts, n=16):
    out = []
    for (a,b) in zip(pts[:-1], pts[1:]):
        for t in np.linspace(0,1,n,endpoint=False): out.append((a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t))
    out.append(pts[-1]); return out
def linemask_phys(pts, width):
    """thin line: design points -> physical frame, drawn with a fixed pixel width"""
    img = Image.new('L', (CW,CH), 0); d = ImageDraw.Draw(img)
    pp = [to_phys(np.array(p[0]), np.array(p[1])) for p in densify(pts)]
    def px(pt): return (float((pt[0]-cx0)/(cx1-cx0)*CW), float((cy1-pt[1])/(cy1-cy0)*CH))
    d.line([px(pt) for pt in pp], fill=255, width=width, joint='curve')
    return np.array(img)>0

cm = np.full((CH,CW), idx['savane'], dtype=np.int16)
# deserts: north-west beyond the massif, and south-west (as validated in v1), organic edges
cm[(Xw<-150-60*np.sin(Yw/70.0))&(Yw>450+40*np.sin(Xw/60.0))] = idx['desert']
cm[(Xw<-280+50*np.sin(Yw/80.0))&(Yw<-60+40*np.sin(Xw/75.0))] = idx['desert']
# deserts: north-west beyond the massif, and south-west
# high plains north-east of the massif
cm[poly([(140,330),(470,300),(560,420),(545,560),(430,640),(260,615),(150,530),(120,430)])] = idx['plaines']
# river (jungle follows it): from the glaciers, through the karst, the jungle, to the west coast
river = [(40,380),(25,300),(10,225),(-5,170),(-20,120),(-10,60),(0,0),(-60,-60),(-160,-110),(-300,-150),(-450,-190),(-560,-205)]
rv = linemask_phys(river, int(150/kmpx))       # 150 km wide wet corridor (physical km, constant width)
rv = ndimage.binary_dilation(rv, iterations=int(20/kmpx)) & (n1>0.30)
jungle = rv & (Y<250) & ~((Xw<-300)&(Yw<-60))
cm[jungle] = idx['jungle']
cm[ellipse(0,0,175,105,warp=0.8)] = idx['jungle']
# massif range: thick band, wider west, tapering east; ridges inside
mass = poly([(-560,345),(-450,290),(-300,255),(0,285),(250,300),(390,330),(430,365),(390,405),(250,440),(0,450),(-300,470),(-450,455),(-560,410)])
cm[mass] = idx['massifs']
crest = np.abs(Yw - (368 + (Xw+300)*0.04)) < (18 + 30*fine)
cm[mass & crest & (Xw<280)] = idx['glaciers']
# cavernes / karst foothills, pitons along the river
cm[ellipse(15,222,90,62,rot=0.2)] = idx['cavernes']
cm[ellipse(-15,112,62,58)] = idx['pitons']
# bioluminescent forest north of the col, on the springs
cm[ellipse(95,478,90,48,rot=0.15)] = idx['biolum']
# ancient forest: sheltered valley east of the massif end
cm[ellipse(425,285,62,75,rot=-0.4)] = idx['ancienne']
# canyon and crystal forests on the way to the arc
cm[ellipse(498,192,55,48,rot=0.3)] = idx['canyon']
cm[ellipse(560,132,48,42,rot=0.3)] = idx['cristal']
# lava plains and the volcanic arc (north-south line of cones)
cm[poly([(545,-60),(620,-80),(650,70),(645,160),(600,165),(548,80)])] = idx['lave']
arcpoly = poly([(590,-110),(640,-110),(660,60),(662,180),(648,300),(605,310),(592,180),(588,60)])
cm[arcpoly] = idx['arc']
# salt lake basin on the way back
cm[ellipse(330,-125,125,78,rot=0.1)] = idx['sel']
for (lx,ly,rx,ry) in [(290,-130,45,22),(360,-100,38,20),(345,-165,30,16),(400,-135,22,12)]:
    cm[ellipse(lx,ly,rx,ry,warp=0.4)] = idx['lac']
# arsenic gulf east of the arc, opening to the eastern ocean
sea = ellipse(840, 85, 205, 265, rot=0.15)
ocean_e = (Xw > 770 + 45*np.sin(Yw/95.0))
cm[ocean_e] = idx['ocean']
cm[ocean_e & (Xw < 815)] = idx['recifs']
cm[sea] = idx['arsenic']
cm[sea & (Xw<730)] = idx['recifs']
cm[(Xw>905)&(Xw<945)&(Yw>-130)&(Yw<290)&(sea|ocean_e)] = idx['fosse']
water = sea | ocean_e
mang = ndimage.binary_dilation(water, iterations=int(14/kmpx)) & ~water & ~arcpoly
cm[mang] = idx['mangrove']
# western gulf
west = Xw < -560
cm[west] = idx['ocean']; cm[west&(Xw>-600)] = idx['recifs']
cm[ndimage.binary_dilation(west, iterations=int(12/kmpx))&~west&(Y<230)] = idx['mangrove']
water = water | west
# rivers drawn last
cm[linemask_phys(river, 3)] = idx['fleuve']
cm[linemask_phys([(458,335),(432,292),(420,240),(438,200),(470,182)], 3)] = idx['rouge']
cm[linemask_phys([(300,335),(320,400),(360,470),(400,545)], 3)] = idx['fleuve']

# corridor land/water carved into the world field
lon0, lat1 = to_lonlat(cx0, cy1); lon1, lat0 = to_lonlat(cx1, cy0)
water_ids = (idx['ocean'], idx['recifs'], idx['fosse'], idx['arsenic'], idx['remontees'])
inbox = (lon>=lon0)&(lon<=lon1)&(lat>=lat0)&(lat<=lat1)
ci = np.clip(((lon-48)*KM-cx0)/(cx1-cx0)*CW, 0, CW-1).astype(int)
cj = np.clip((cy1-(lat-1)*KM)/(cy1-cy0)*CH, 0, CH-1).astype(int)
cval = cm[cj, ci]
# only the part of the physical box that maps back into the design box is authoritative
xd_w, yd_w = to_design((lon-48)*KM, (lat-1)*KM)
inbox = inbox & (xd_w>=dx0)&(xd_w<=dx1)&(yd_w>=dy0)&(yd_w<=dy1)
cwater = np.isin(cval, water_ids)
field = np.where(inbox, np.where(cwater, -1.0, 2.0), field)
# 60 % land
thr = np.quantile(field, 0.40)
land = field > thr
# clean tiny islands/lakes
land = ndimage.binary_opening(land, iterations=2)
land = ndimage.binary_closing(land, iterations=4)
land = np.where(inbox, ~cwater, land)

# distance to coast (in degrees)
d_land = ndimage.distance_transform_edt(land)*0.25      # land cells: distance to ocean
d_sea  = ndimage.distance_transform_edt(~land)*0.25     # ocean cells: distance to land

# ridges / mountains
rn = noise((H,W), octaves=(3,6,12,24), persistence=0.5, seed=7)
ridge = 1 - np.abs(rn*2-1)
pb = noise((H,W), octaves=(2,4,8), seed=17)
ridge_line = (ridge > 0.965) & (pb > 0.48) & ~ndimage.binary_dilation(inbox, iterations=14)   # no world ridges in or near the designed corridor
d_ridge = ndimage.distance_transform_edt(~ridge_line)*0.25
elev = np.where(land, 6.5*np.exp(-(d_ridge/0.9)**2) + 0.6*base, 0)
massif = land & (elev > 3.2)
glacier = land & (elev > 6.4)

# volcanic arcs: ridge lines near coast
arcline = land & (d_ridge < 0.3) & (d_land < 4.0) & (d_land > 0.3)
arcline = ndimage.binary_dilation(arcline, iterations=1)
lave = land & ndimage.binary_dilation(arcline, iterations=3) & ~arcline
near_arc_sea = ndimage.binary_dilation(arcline, iterations=10) & ~land
fosse = near_arc_sea & (d_sea > 1.2) & (d_sea < 2.6)

# climate
T = 36 - 38*(np.abs(lat)/90)**1.5 - 6.5*elev
mn = noise((H,W), octaves=(3,6,12,24), seed=99)
jit = noise((H,W), octaves=(2,4,8), seed=3)
lat_eff = lat + 8*(jit-0.5)*2
alat = np.abs(lat_eff)
moist = np.exp(-d_land/7.0)*(0.5+0.5*mn)
moist += 0.38*np.exp(-(alat/13)**2)
moist -= 0.22*np.exp(-((alat-26)/7)**2)
moist -= 0.30*np.clip(1.3-ell,0,1)
ell2 = ((lon-52)/17.0)**2 + ((lat-6)/11.0)**2
moist += 0.24*np.clip(1.25-ell2,0,1)   # orographic rain around the corridor massif: savane and plains, not desert
moist = np.clip(moist,0,1)

# upwelling: ocean with land to the east (within 3°), not to the west
land_east = np.zeros_like(land)
for sh in range(1,8):
    land_east |= np.roll(land, -sh, axis=1)
land_west = np.zeros_like(land)
for sh in range(1,8):
    land_west |= np.roll(land, sh, axis=1)
upwell = (~land) & land_east & ~land_west & (alat>8) & (alat<42) & (d_sea<1.8)

# ---------- classify world ----------
bm = np.full((H,W), idx['ocean'], dtype=np.int16)
bm[(~land)&(d_sea<0.8)&(alat<50)] = idx['recifs']
bm[upwell] = idx['remontees']
bm[fosse] = idx['fosse']

L = land
bm[L] = idx['plaines']
bm[L&(alat<38)&(moist<0.40)&(d_land>3)] = idx['desert']
bm[L&(alat<52)&(d_land>11)] = idx['desert']
bm[L&(alat<38)&(moist>=0.40)&(moist<0.62)] = idx['savane']
bm[L&(alat<14)&(moist>=0.74)] = idx['jungle']
bm[L&(alat>=38)&(alat<=66)&(moist>0.33)] = idx['saison']
bm[L&(alat>66)] = idx['toundra']
# salt lakes in deserts
sn = noise((H,W), octaves=(12,24,48), seed=5)
bm[(bm==idx['desert'])&(sn<0.24)&(d_land>4)] = idx['sel']
# mangroves
bm[L&(d_land<=0.5)&(alat<30)&(moist>0.45)] = idx['mangrove']
# volcanic
bm[lave] = idx['lave']
bm[arcline] = idx['arc']
# bioluminescent forests near arcs, ancient forests near massifs
fn = noise((H,W), octaves=(16,32,64), seed=13)
bm[L&ndimage.binary_dilation(arcline, iterations=8)&~arcline&~lave&(moist>0.4)&(fn<0.42)] = idx['biolum']
near_massif = ndimage.binary_dilation(massif, iterations=5)&~massif&L
bm[near_massif&(moist>0.5)&(fn>0.66)] = idx['ancienne']
bm[massif] = idx['massifs']
bm[glacier] = idx['glaciers']

# paste the corridor into the world (only where it is authoritative, and only its specific biomes:
# the background (savane by default in the design) is left to the world's climate classification)
v = cval.copy()
v[v==idx['fleuve']] = idx['jungle']; v[v==idx['rouge']] = idx['ancienne']; v[v==idx['lac']] = idx['sel']
bg = (v == idx['savane'])
bm[inbox & np.isin(bm, (idx['sel'], idx['mangrove'], idx['biolum'], idx['ancienne'], idx['lave'], idx['arc'], idx['massifs'], idx['glaciers']))] = idx['savane']
bm_world = bm.copy()
bm = np.where(inbox, v, bm).astype(np.int16)
# corridor image: background sampled from the world classification (so both views agree), softened
wi = np.clip(((48 + Xp/KM) + 180)/360*W, 0, W-1).astype(int)
wj = np.clip((90 - (1 + Yp/KM))/180*H, 0, H-1).astype(int)
cbg = bm_world[wj, wi]
cbg = ndimage.median_filter(cbg, size=13)
in_design = (X>=dx0)&(X<=dx1)&(Y>=dy0)&(Y<=dy1)
cm = np.where(in_design, cm, cbg).astype(np.int16)   # outside the designed box, the world's classes
# far background inside the box: let the world's land climate through (hides the box edge)
land_bg = np.isin(cbg, (idx['desert'], idx['savane'], idx['plaines'], idx['saison']))
far_bg = in_design & np.isin(cm, (idx['savane'], idx['desert'])) & (np.hypot(X,Y) > 330) & land_bg
cm = np.where(far_bg, cbg, cm).astype(np.int16)
# and the same on the world side, so both views agree
xd_w2, yd_w2 = xd_w, yd_w
far_w = inbox & np.isin(bm, (idx['savane'], idx['desert'])) & (np.hypot(xd_w2, yd_w2) > 330) & np.isin(bm_world, (idx['desert'], idx['savane'], idx['plaines'], idx['saison']))
bm = np.where(far_w, bm_world, bm).astype(np.int16)

# ---------- mission codes (round 9, Q04-A): continents A–F by area, oceans numbered, two corridor gulfs ----------
def pole(mask):
    """label anchor = point of the mask farthest from its edge (pole of inaccessibility), as lon/lat"""
    dt = ndimage.distance_transform_edt(mask)
    j, i = np.unravel_index(np.argmax(dt), dt.shape)
    return float(lon[j,i]), float(lat[j,i])
cell_area_w = np.cos(np.deg2rad(lat))
for _it in (12, 18, 24, 30, 36, 44):
    core = ndimage.binary_erosion(land, iterations=_it)
    lab, nlab = ndimage.label(core)
    areas = ndimage.sum(cell_area_w, lab, index=range(1, nlab+1))
    keep = [i+1 for i in np.argsort(areas)[::-1][:6] if areas[i] > 0.02*cell_area_w[land].sum()]
    print('erosion', _it, 'cores', len(keep), [round(100*areas[k-1]/cell_area_w[land].sum(),1) for k in keep])
    if len(keep) >= 4: break
core2 = np.isin(lab, keep)
# every land pixel joins the nearest kept core
_, (ii, jj) = ndimage.distance_transform_edt(~core2, return_indices=True)
region = np.where(land, lab[ii, jj], 0)
rareas = ndimage.sum(cell_area_w, region, index=keep)
order = np.argsort(rareas)[::-1]
places = []
for n, oi in enumerate(order):
    m = region == keep[oi]
    lo, la = pole(m)
    places.append({'code': 'ABCDEF'[n], 'kind': 'continent', 'lon': lo, 'lat': la,
                   'pct_land': float(100*rareas[oi]/cell_area_w[land].sum())})
olab, onl = ndimage.label(~land)
oareas = ndimage.sum(cell_area_w, olab, index=range(1, onl+1))
oorder = np.argsort(oareas)[::-1]
for n, li in enumerate(oorder[:3]):
    m = olab == (li+1)
    lo, la = pole(m)
    places.append({'code': 'Océan %d' % (n+1), 'kind': 'ocean', 'lon': lo, 'lat': la,
                   'pct_planet': float(100*oareas[li]/cell_area_w.sum())})
# the two gulfs that frame the corridor (physical km -> lon/lat)
for code, (xk, yk) in (('Golfe 1', to_phys(np.array(-600.0), np.array(-100.0))), ('Golfe 2', to_phys(np.array(880.0), np.array(80.0)))):
    lo, la = to_lonlat(float(xk), float(yk))
    places.append({'code': code, 'kind': 'gulf', 'lon': lo, 'lat': la})

# ---------- stats ----------
cell_area = np.cos(np.deg2rad(lat))
tot = cell_area.sum(); land_area = cell_area[land].sum()
stats = {}
for k in keys:
    a = cell_area[bm==idx[k]].sum()
    stats[k] = {'pct_planet': float(100*a/tot), 'pct_land': float(100*a/land_area) if k not in ('ocean','recifs','remontees','fosse','arsenic') else None}
stats['_land_pct'] = float(100*land_area/tot)

# ---------- output ----------
Image.fromarray(pal[bm]).save('world.png', optimize=True)
Image.fromarray(pal[cm]).save('corridor.png', optimize=True)
meta = {'keys': keys, 'names': {k:B[k][0] for k in keys}, 'colors': {k:B[k][1] for k in keys},
        'stats': stats, 'corridor_box_km': [cx0,cx1,cy0,cy1], 'design_box_km': [dx0,dx1,dy0,dy1],
        'transform': {'R0': R0, 'k': KF, 'w': WS}, 'km_per_deg': KM, 'origin_lonlat': [48,1],
        'world_size':[W,H], 'corridor_size':[CW,CH], 'places': places}
json.dump(meta, open('map_meta.json','w'), ensure_ascii=False, indent=1)
print('land %', round(stats['_land_pct'],1))
for k in keys: print(k, round(stats[k]['pct_planet'],2), stats[k]['pct_land'] and round(stats[k]['pct_land'],2))

# ---------- v3: save arrays for the plates layer ----------
cont_code = np.zeros((H,W), dtype=np.int8)   # 0 sea, 1..4 = A..D
for n, oi in enumerate(order):
    cont_code[region == keep[oi]] = n+1
ocean_code = np.zeros((H,W), dtype=np.int8)  # 1..3 = Océan 1..3, 9 = other water
ocean_code[~land] = 9
for n, li in enumerate(oorder[:3]):
    ocean_code[olab == (li+1)] = n+1
np.savez_compressed('world_arrays.npz', land=land, cont=cont_code, ocean=ocean_code, arcline=arcline, fosse=fosse,
                    massif=massif, bm=bm, inbox=inbox, d_land=d_land, d_sea=d_sea)
print('saved world_arrays.npz')
