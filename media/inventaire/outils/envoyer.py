import json, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
L = json.load(open(r"C:\SECOND EARTH\_travail_inventaire\envoi\liste.json", encoding="utf-8"))
def put(key, f, ct):
    for essai in range(3):
        r = subprocess.run(f'npx wrangler r2 object put "nirvalab/{key}" --file "{f}" --content-type {ct} --cache-control "public, max-age=31536000" --remote',
                           shell=True, capture_output=True, text=True, encoding="utf-8", errors="replace", cwd=r"C:\SECOND EARTH\_travail_inventaire")
        if "Upload complete" in r.stdout + r.stderr: return True
    print("ECHEC", key, (r.stdout + r.stderr)[-300:], flush=True); return False
def go(x):
    a = put(x["cle_video"], x["video"], "video/mp4"); b = put(x["cle_affiche"], x["affiche"], "image/jpeg")
    print("ok" if a and b else "KO", x["id"], flush=True); return a and b
with ThreadPoolExecutor(4) as ex: res = list(ex.map(go, L))
print("FINI", sum(res), "/", len(L))
