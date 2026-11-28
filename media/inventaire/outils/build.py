# Assemble technique.json + analyse/*.json -> media/inventaire/inventaire.json et index.html
import json, os, glob, html, datetime, sys

WORK = r"C:\SECOND EARTH\_travail_inventaire"
OUT = r"C:\SECOND EARTH\repo\media\inventaire"
tech = json.load(open(os.path.join(WORK, "technique.json"), encoding="utf-8"))
ana = {}
for f in glob.glob(os.path.join(WORK, "analyse", "*.json")):
    for e in json.load(open(f, encoding="utf-8")):
        ana[e["id"]] = e

NOMS = {"faune-flore": "Faune / flore", "seed": "Seed", "space": "SPACE",
        "pano-video": "Panoramiques · vidéos", "pano-images": "Panoramiques · images"}
BIOMES = ["Jungle", "Pitons karstiques", "Cavernes", "Massifs et glaciers", "Forêt bioluminescente", "Hautes Plaines",
          "Forêt ancienne", "Course volcanique", "Mer d'arsenic et fosse", "Lacs salés pourpres"]
PERSOS = ["Seed", "Rob1", "grand robot", "XENOPOD", "PERSEPHORA", "MOTHER", "animal", "plante", "paysage seul"]

items, manquants = [], []
for t in tech:
    e = {k: v for k, v in t.items() if not k.startswith("_") and k not in ("poids_octets", "vignette_octets", "codec")}
    e["poids_octets"] = t["poids_octets"]
    e["groupe_nom"] = NOMS[t["groupe"]]
    a = ana.get(t["id"])
    if not a:
        manquants.append(t["id"]); a = {}
    for k, v in a.items():
        if k != "id":
            e[k] = v
    if e["type"] == "video":
        e.setdefault("plans", "pas clair")
    items.append(e)
if manquants:
    print("SANS FICHE :", len(manquants), manquants[:10])

PUB = "https://pub-34c30250aeb24f53b99da979a52a6c52.r2.dev/"
envoi = os.path.join(WORK, "envoi", "liste.json")
if os.path.exists(envoi):
    ok = set()
    jr = os.path.join(WORK, "envoi", "journal.txt")
    if os.path.exists(jr):
        ok = {l.split()[1] for l in open(jr, encoding="utf-8", errors="replace") if l.startswith("ok ")}
    ok.add("space--o")
    for x in json.load(open(envoi, encoding="utf-8")):
        if x["id"] in ok:
            e = next(i for i in items if i["id"] == x["id"])
            e["video_url"] = PUB + x["cle_video"]; e["affiche_url"] = PUB + x["cle_affiche"]
jp = os.path.join(WORK, "envoi", "journal-panos.txt")
if os.path.exists(jp):
    okp = {l.split()[1] for l in open(jp, encoding="utf-8", errors="replace") if l.startswith("ok ")}
    for e in items:
        if e["id"] in okp:
            n = e["id"].split("--", 1)[1]
            e["image_url"] = PUB + "second-earth/pano/" + n + ".jpg"; e["original_url"] = PUB + "second-earth/pano/original/" + n + ".png"
vid = [e for e in items if e["type"] == "video"]
img = [e for e in items if e["type"] == "image"]
def nb(l, etat): return sum(1 for e in l if e.get("etat") == etat)
def bons(l): return [e for e in l if e.get("etat") == "bon"]

resume = {
    "date": datetime.date.today().isoformat(),
    "videos": len(vid), "images": len(img),
    "videos_par_etat": {s: nb(vid, s) for s in ("bon", "bon en partie", "raté")},
    "images_par_etat": {s: nb(img, s) for s in ("bon", "bon en partie", "raté")},
    "videos_duree_totale_s": round(sum(e["duree_s"] for e in vid)),
    "poids_total_go": round(sum(e["poids_octets"] for e in items) / 1e9, 2),
    "par_dossier": {NOMS[g]: {"fichiers": sum(1 for e in items if e["groupe"] == g),
                              "bons": sum(1 for e in items if e["groupe"] == g and e.get("etat") == "bon")} for g in NOMS},
    "bonnes_videos_par_biome": {b: sum(1 for e in bons(vid) if e.get("biome") == b) for b in BIOMES + ["Espace", "Hors trajet", "Pas clair"]},
    "bonnes_images_par_biome": {b: sum(1 for e in bons(img) if e.get("biome") == b) for b in BIOMES + ["Espace", "Hors trajet", "Pas clair"]},
    "bonnes_videos_par_personnage": {p: sum(1 for e in bons(vid) if p in e.get("a_l_ecran", [])) for p in PERSOS},
    "non_trouve_sur_l_ordinateur": [
        "les 100 images du dossier « seedance input » (le brief les dit dans Google Drive)",
        "les 5 planches de personnages (Seed, Rob1, grand robot, planche d'échelle, XENOPOD-01)"],
    "methode": "Chaque vidéo a été regardée sur des images fixes : une toutes les 2 secondes, plus une image après chaque changement de plan détecté. Un défaut de mouvement entre deux images peut avoir échappé. Le son n'a pas été écouté.",
}
manque = []
for b in BIOMES:
    v, i = resume["bonnes_videos_par_biome"][b], resume["bonnes_images_par_biome"][b]
    if v == 0 and i == 0: manque.append(f"{b} : aucune vidéo et aucune image marquée « bon »")
    elif v == 0: manque.append(f"{b} : aucune vidéo marquée « bon » ({i} image{'s' if i > 1 else ''})")
for p in ("Seed", "Rob1", "grand robot", "XENOPOD", "PERSEPHORA", "MOTHER"):
    if resume["bonnes_videos_par_personnage"][p] == 0: manque.append(f"{p} : aucune vidéo marquée « bon »")
ouv = [e for e in bons(vid) if "grande vidéo d'ouverture" in e.get("usages", [])]
resume["videos_possibles_en_ouverture"] = [e["id"] for e in ouv]
if not ouv: manque.append("Aucune vidéo marquée « bon » ne convient comme grande vidéo d'ouverture")
if all(e["hauteur"] < 1080 for e in vid): manque.append(f"Toutes les vidéos font {max(e['hauteur'] for e in vid)} pixels de haut ou moins : aucune en haute définition pour un grand écran")
manque += ["Non trouvé sur cet ordinateur : " + x for x in resume["non_trouve_sur_l_ordinateur"]]
extra = os.path.join(WORK, "manques_histoire.json")
if os.path.exists(extra): manque = json.load(open(extra, encoding="utf-8")) + manque
resume["ce_qui_manque"] = manque

os.makedirs(OUT, exist_ok=True)
json.dump({"resume": resume, "fichiers": items}, open(os.path.join(OUT, "inventaire.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

tpl = open(os.path.join(WORK, "page.html"), encoding="utf-8").read()
data = json.dumps({"resume": resume, "fichiers": items}, ensure_ascii=False).replace("</", "<\\/")
open(os.path.join(OUT, "index.html"), "w", encoding="utf-8").write(tpl.replace("/*__DATA__*/null", data))
print(json.dumps({k: resume[k] for k in ("videos", "images", "videos_par_etat", "images_par_etat")}, ensure_ascii=False))
print("\n".join(manque))
