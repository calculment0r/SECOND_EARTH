# Prépare l'inventaire : mesures (ffprobe), coupes de plan, images toutes les 2 s,
# planches de lecture pour l'analyse, vignettes légères pour la page.
import json, os, re, subprocess, sys, unicodedata, io
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageDraw, ImageFont

SRC = r"C:\SECOND EARTH\VISUAL"
WORK = r"C:\SECOND EARTH\_travail_inventaire"
OUT = r"C:\SECOND EARTH\repo\media\inventaire"
VIG = os.path.join(OUT, "vignettes")
os.makedirs(VIG, exist_ok=True)
Image.MAX_IMAGE_PIXELS = None

GROUPES = {
    "FAUNE_FLORE": "faune-flore",
    "SEED": "seed",
    "SPACE": "space",
    "SECOND EARTH PANO/VIDEO": "pano-video",
    "SECOND EARTH PANO/STILLS": "pano-images",
}

def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^A-Za-z0-9]+", "-", s).strip("-").lower()
    return s[:60].strip("-")

def run(args):
    return subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="replace")

def fmt_ratio(w, h):
    r = w / h
    for nom, v in (("21:9", 21 / 9), ("16:9", 16 / 9), ("2:1", 2.0), ("4:1", 4.0), ("32:9", 32 / 9)):
        if abs(r - v) / v < 0.03:
            return nom
    return f"{r:.2f}:1"

try:
    FONT = ImageFont.truetype(r"C:\Windows\Fonts\consolab.ttf", 22)
except Exception:
    FONT = ImageFont.load_default()

def save_under(img, path, limit=80_000):
    for q in (82, 76, 70, 64, 58, 52, 46, 40, 34, 28):
        b = io.BytesIO()
        img.save(b, "JPEG", quality=q, optimize=True, progressive=True)
        if b.tell() < limit:
            break
    with open(path, "wb") as f:
        f.write(b.getvalue())
    return b.tell()

def video(entry):
    p, wid = entry["_path"], entry["id"]
    d = os.path.join(WORK, "frames", wid)
    os.makedirs(d, exist_ok=True)
    pr = json.loads(run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", p]).stdout)
    v = next(s for s in pr["streams"] if s["codec_type"] == "video")
    a = [s for s in pr["streams"] if s["codec_type"] == "audio"]
    dur = float(pr["format"]["duration"])
    n, dd = v["r_frame_rate"].split("/")
    entry.update(duree_s=round(dur, 2), largeur=v["width"], hauteur=v["height"],
                 format=fmt_ratio(v["width"], v["height"]), images_par_seconde=round(int(n) / int(dd), 2),
                 poids_octets=int(pr["format"]["size"]), poids_mo=round(int(pr["format"]["size"]) / 1e6, 1),
                 son=bool(a), codec=v["codec_name"])
    # volume moyen du son (pour savoir si la piste est silencieuse)
    if a:
        r = run(["ffmpeg", "-hide_banner", "-i", p, "-vn", "-af", "volumedetect", "-f", "null", "-"])
        m = re.search(r"mean_volume: (-?[\d.]+|-inf) dB", r.stderr)
        entry["son_volume_moyen_db"] = None if not m or m.group(1) == "-inf" else float(m.group(1))
    # coupes de plan détectées
    r = run(["ffmpeg", "-hide_banner", "-i", p, "-an", "-vf", "select='gt(scene,0.30)',showinfo", "-f", "null", "-"])
    cuts = [round(float(x), 2) for x in re.findall(r"pts_time:([\d.]+)", r.stderr)]
    entry["coupes_detectees_s"] = [c for c in cuts if 0.3 < c < dur - 0.3]
    # une image toutes les 2 s
    if not os.path.exists(os.path.join(d, "f_001.jpg")):
        run(["ffmpeg", "-hide_banner", "-y", "-i", p, "-an", "-vf", "fps=1/2:start_time=0:round=down,scale=800:-2", "-q:v", "3",
             os.path.join(d, "f_%03d.jpg")])
    frames = sorted(f for f in os.listdir(d) if f.startswith("f_"))
    # image juste après chaque coupe (pour ne manquer aucun plan)
    for i, c in enumerate(entry["coupes_detectees_s"]):
        fp = os.path.join(d, f"c_{i:02d}.jpg")
        if not os.path.exists(fp):
            run(["ffmpeg", "-hide_banner", "-y", "-ss", f"{c + 0.25:.2f}", "-i", p, "-an", "-frames:v", "1", "-vf", "scale=800:-2", "-q:v", "3", fp])
    # planches de lecture : 2 colonnes, 8 images par planche, minutage incrusté
    items = [(i * 2.0, os.path.join(d, f)) for i, f in enumerate(frames)]
    items += [(c + 0.25, os.path.join(d, f"c_{i:02d}.jpg")) for i, c in enumerate(entry["coupes_detectees_s"])
              if os.path.exists(os.path.join(d, f"c_{i:02d}.jpg"))]
    items.sort()
    sheets = []
    for k in range(0, len(items), 8):
        part = items[k:k + 8]
        im0 = Image.open(part[0][1]); cw, ch = im0.size
        rows = (len(part) + 1) // 2
        sh = Image.new("RGB", (cw * 2 + 6, rows * (ch + 6)), (0, 0, 0))
        dr = ImageDraw.Draw(sh)
        for j, (t, fp) in enumerate(part):
            x, y = (j % 2) * (cw + 6), (j // 2) * (ch + 6)
            sh.paste(Image.open(fp).convert("RGB").resize((cw, ch)), (x, y))
            lab = f"{t:05.2f}s" + ("" if abs(t / 2 - round(t / 2)) < 1e-6 else " apres coupe")
            dr.rectangle([x, y, x + 14 * len(lab) + 10, y + 30], fill=(0, 0, 0))
            dr.text((x + 5, y + 3), lab, fill=(255, 220, 60), font=FONT)
        sp = os.path.join(WORK, "lecture", f"{wid}__{k // 8 + 1}.jpg")
        os.makedirs(os.path.dirname(sp), exist_ok=True)
        sh.save(sp, "JPEG", quality=80)
        sheets.append(sp)
    entry["_lecture"] = sheets
    # vignette : planche de 8 images réparties, 640 px de large
    nb = 8 if len(frames) >= 8 else max(6, len(frames))
    pick = [frames[round(i * (len(frames) - 1) / (nb - 1))] for i in range(nb)] if len(frames) > 1 else frames
    cw = 318; ch = round(cw * v["height"] / v["width"])
    rows = (len(pick) + 1) // 2
    sh = Image.new("RGB", (640, rows * ch + (rows - 1) * 4), (10, 13, 11))
    for j, f in enumerate(pick):
        sh.paste(Image.open(os.path.join(d, f)).convert("RGB").resize((cw, ch), Image.LANCZOS), ((j % 2) * 322, (j // 2) * (ch + 4)))
    entry["vignette"] = f"vignettes/{wid}.jpg"
    entry["vignette_octets"] = save_under(sh, os.path.join(VIG, wid + ".jpg"))
    entry["vignette_minutages_s"] = [(int(f[2:5]) - 1) * 2 for f in pick]
    return entry

def image(entry):
    p, wid = entry["_path"], entry["id"]
    im = Image.open(p); w, h = im.size
    entry.update(largeur=w, hauteur=h, format=fmt_ratio(w, h), poids_octets=os.path.getsize(p),
                 poids_mo=round(os.path.getsize(p) / 1e6, 1))
    rgb = im.convert("RGB")
    lp = os.path.join(WORK, "lecture", wid + ".jpg")
    os.makedirs(os.path.dirname(lp), exist_ok=True)
    big = rgb.resize((1900, round(1900 * h / w)), Image.LANCZOS)
    # image très large : on l'empile en deux moitiés pour qu'elle reste lisible
    half = Image.new("RGB", (1900, big.height * 2 + 6), (0, 0, 0))
    full2 = rgb.resize((3800, round(3800 * h / w)), Image.LANCZOS)
    hh = full2.height
    stack = Image.new("RGB", (1900, big.height + 6 + hh * 2 + 6), (0, 0, 0))
    stack.paste(big, (0, 0))
    stack.paste(full2.crop((0, 0, 1900, hh)), (0, big.height + 6))
    stack.paste(full2.crop((1900, 0, 3800, hh)), (0, big.height + 12 + hh))
    stack.save(lp, "JPEG", quality=82)
    entry["_lecture"] = [lp]
    th = rgb.resize((640, round(640 * h / w)), Image.LANCZOS)
    entry["vignette"] = f"vignettes/{wid}.jpg"
    entry["vignette_octets"] = save_under(th, os.path.join(VIG, wid + ".jpg"))
    return entry

entries, seen = [], set()
for dossier, g in GROUPES.items():
    base = os.path.join(SRC, *dossier.split("/"))
    for f in sorted(os.listdir(base)):
        ext = f.lower().rsplit(".", 1)[-1]
        if ext not in ("mp4", "mov", "webm", "png", "jpg", "jpeg", "webp"):
            continue
        wid = g + "--" + slug(f.rsplit(".", 1)[0]); k = 2
        while wid in seen:
            wid = g + "--" + slug(f.rsplit(".", 1)[0]) + f"-{k}"; k += 1
        seen.add(wid)
        entries.append({"id": wid, "type": "video" if ext in ("mp4", "mov", "webm") else "image",
                        "groupe": g, "dossier": "VISUAL/" + dossier, "fichier": f, "_path": os.path.join(base, f)})

def work(e):
    try:
        return video(e) if e["type"] == "video" else image(e)
    except Exception as ex:
        e["_erreur"] = repr(ex); return e

with ThreadPoolExecutor(6) as ex:
    res = list(ex.map(work, entries))
json.dump(res, open(os.path.join(WORK, "technique.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
err = [e for e in res if "_erreur" in e]
print(len(res), "fichiers ;", len(err), "erreurs")
for e in err: print(e["id"], e["_erreur"])
print("vignette max :", max(e.get("vignette_octets", 0) for e in res))
