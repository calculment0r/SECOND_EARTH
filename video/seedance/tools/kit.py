import json, os, sys, shutil, zipfile, re, unicodedata
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
S = sys.argv[1]
seqs = json.load(open(f"{S}/seedance/prompts_all.json"))
IMGS = os.environ.get("SEEDANCE_REFS", f"{S}/refs")
CHAR = {"board": (f"{IMGS}/4_seed_rob1.jpg", "Planche-echelle"), "board_full": (f"{IMGS}/4.jpg", "Planche-echelle"), "seed": (f"{IMGS}/3.jpg", "Seed"), "rob1": (f"{IMGS}/2.webp", "Rob1"), "big": (f"{IMGS}/1.webp", "Grand-robot"), "xeno": (f"{IMGS}/5.webp", "XENOPOD")}
raw = {int(f.split("_")[0]): os.path.join(f"{S}/mj/raw", f) for f in os.listdir(f"{S}/mj/raw")}
out = f"{S}/kit/Seedance_SecondEarth"
shutil.rmtree(f"{S}/kit", ignore_errors=True); os.makedirs(out)
def save(src, dst):
    im = Image.open(src).convert("RGB")
    if im.width > 2048: im = im.resize((2048, int(im.height * 2048 / im.width)), Image.LANCZOS)
    im.save(dst, "JPEG", quality=90)
for s in seqs:
    d = os.path.join(out, f"{s['id']}_{re.sub(r"[^A-Za-z0-9]+", "-", unicodedata.normalize("NFKD", s["titre"]).encode("ascii", "ignore").decode()).strip('-')}")
    os.makedirs(d)
    for n, k in enumerate(s["refs"], 1):
        if k in CHAR:
            src, lab = CHAR[k]
        else:
            idx = int(k[1:]); src = raw[idx]; lab = f"image{idx:02d}"
        save(src, os.path.join(d, f"{n}_{lab}.jpg"))
    open(os.path.join(d, "prompt.txt"), "w", encoding="utf-8").write(s["prompt"] + "\n")
    open(os.path.join(d, "reglages.txt"), "w", encoding="utf-8").write("Seedance 2.5 - mode omni_reference - 30 s - 720p - 16:9 - audio active\nJoindre les images dans l'ordre des numeros (1, 2, 3...), puis coller prompt.txt.\n")
z = f"{S}/kit/Seedance_SecondEarth.zip"
with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as zf:
    for root, _, files in os.walk(out):
        for f in sorted(files):
            p = os.path.join(root, f); zf.write(p, os.path.relpath(p, f"{S}/kit"))
print(z, os.path.getsize(z) // 1024 // 1024, "Mo")
for s in sorted(os.listdir(out)): print(s, sorted(os.listdir(os.path.join(out, s))))
