import sys, os
from PIL import Image, ImageDraw, ImageFont
Image.MAX_IMAGE_PIXELS = None
raw, small, sheets = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(small, exist_ok=True); os.makedirs(sheets, exist_ok=True)
files = sorted(os.listdir(raw))
ok = []
for f in files:
    out = os.path.join(small, os.path.splitext(f)[0] + ".jpg")
    if not os.path.exists(out):
        try:
            im = Image.open(os.path.join(raw, f)).convert("RGB")
            w = 1024; h = int(im.height * w / im.width)
            im.resize((w, h), Image.LANCZOS).save(out, quality=82)
        except Exception as e:
            print("echec", f, e); continue
    ok.append(out)
# planches contact : 3 colonnes x 3 lignes, vignettes 480 px de large
per = 9
for k in range(0, len(ok), per):
    chunk = ok[k:k+per]
    cw, ch = 480, 300
    sheet = Image.new("RGB", (cw*3, ch*3), (10,13,11))
    d = ImageDraw.Draw(sheet)
    for i, p in enumerate(chunk):
        im = Image.open(p); im.thumbnail((cw-6, ch-26))
        x = (i%3)*cw + 3; y = (i//3)*ch + 22
        sheet.paste(im, (x, y))
        d.text((x+2, y-18), os.path.basename(p)[:2] + " " + os.path.basename(p)[3:38], fill=(255,255,255))
    sheet.save(os.path.join(sheets, "sheet_%02d.jpg" % (k//per+1), ), quality=85)
print(len(ok), "images")
