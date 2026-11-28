import json, os, subprocess
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
W = r"C:\SECOND EARTH\_travail_inventaire"
T = [e for e in json.load(open(W + r"\technique.json", encoding="utf-8")) if e["type"] == "image"]
os.makedirs(W + r"\envoi\pano", exist_ok=True)
def put(key, f, ct):
    for _ in range(3):
        r = subprocess.run(f'npx wrangler r2 object put "nirvalab/{key}" --file "{f}" --content-type {ct} --cache-control "public, max-age=31536000" --remote',
                           shell=True, capture_output=True, text=True, encoding="utf-8", errors="replace", cwd=W)
        if "Upload complete" in r.stdout + r.stderr: return True
    print("ECHEC", key, flush=True); return False
def go(e):
    n = e["id"].split("--", 1)[1]
    im = Image.open(e["_path"]).convert("RGB")
    if im.width > 4096: im = im.resize((4096, round(4096 * im.height / im.width)), Image.LANCZOS)
    j = os.path.join(W, "envoi", "pano", n + ".jpg"); im.save(j, "JPEG", quality=88, optimize=True, progressive=True)
    a = put(f"second-earth/pano/{n}.jpg", j, "image/jpeg"); b = put(f"second-earth/pano/original/{n}.png", e["_path"], "image/png")
    print("ok" if a and b else "KO", e["id"], flush=True)
with ThreadPoolExecutor(4) as ex: list(ex.map(go, T))
print("FINI")
