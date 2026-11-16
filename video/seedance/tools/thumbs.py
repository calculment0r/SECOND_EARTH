import os, sys, json, base64, io
from PIL import Image
small = sys.argv[1]; out = sys.argv[2]
files = sorted(os.listdir(small))
def enc(path, w, q):
    im = Image.open(path).convert("RGB"); h = int(im.height * w / im.width)
    im = im.resize((w, h), Image.LANCZOS); b = io.BytesIO(); im.save(b, "JPEG", quality=q, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()
g, names = {}, {}
for f in files:
    idx = f.split("_")[0]
    n = int(idx)
    key = "%02d" % n
    names[key] = os.path.splitext(f[len(idx)+1:])[0]
    g[key] = enc(os.path.join(small, f), 260, 58)
big = {}
USED = "05 95 85 48 40 55 45 60 58 14 12 09 42 97 46 28 36 38 18 43 74 26".split()
for f in files:
    idx = f.split("_")[0]; key = "%02d" % int(idx)
    if key in USED:
        big[key] = enc(os.path.join(small, f), 520, 70)
json.dump({"g": g, "big": big, "names": names}, open(out, "w"))
print(len(g), "vignettes,", len(big), "grandes", sum(len(v) for v in g.values())//1024, "Ko +", sum(len(v) for v in big.values())//1024, "Ko")
