# Écrit la sélection de départ dans le brief Claude Design et régénère docs/site/briefs.html
import json, re, html
from pathlib import Path
R = Path(r"C:\SECOND EARTH\repo")
d = json.load(open(R / "media/inventaire/inventaire.json", encoding="utf-8"))["fichiers"]
bons = [e for e in d if e["etat"] == "bon"]

def nom(e):
    return f"`{e['dossier'].replace('VISUAL/', '')}/{e['fichier']}`"
def ligne(e, extra=""):
    mm = ", ".join(f"{m['t_s']:g} s" for m in e.get("meilleurs_moments", [])[:2])
    url = f" En ligne : {e['video_url']} (image d'attente : {e['affiche_url']})." if e.get("video_url") else ""
    return f"  - {nom(e)} : {e['description']}" + (f" Images fixes : {mm}." if mm and e["type"] == "video" else "") + url + extra

def pick(cond, n=None):
    l = [e for e in bons if cond(e)]
    return l[:n] if n else l

ouv = pick(lambda e: e["type"] == "video" and "grande vidéo d'ouverture" in e.get("usages", []))
espace = pick(lambda e: e["groupe"] in ("space",) or (e["type"] == "video" and e.get("biome") == "Espace"))
seedrob = pick(lambda e: e["type"] == "video" and "Seed" in e.get("a_l_ecran", []))
faune = pick(lambda e: e["groupe"] == "faune-flore" and "animal" in e.get("a_l_ecran", []))
bandeaux = pick(lambda e: e["type"] == "image" and "bandeau très large" in e.get("usages", []))
partiel = [e for e in d if e["type"] == "video" and e["etat"] == "bon en partie" and "Seed" in e.get("a_l_ecran", [])]

S = ["", "### Sélection de départ (tirée de l'inventaire du 25/11/2026)", "",
     "Chemins dans les dossiers de Cal. Les vidéos font 1470 × 630 (21:9), 15 ou 30 s, avec son. Elles sont en ligne sur Cloudflare (adresse donnée pour chacune, avec une image d'attente au meilleur moment) ; toutes les vidéos sauf les 2 ratées y sont, rangées sous `second-earth/video/<dossier>/`. Les vignettes sont dans `media/inventaire/vignettes/`, la page complète dans `media/inventaire/index.html` (filtres par état, personnage, lieu).",
     "Toutes les vidéos ci-dessous sont marquées « bon ». Rob1 est trop grand dans beaucoup de vidéos avec Seed : ne pas utiliser une vidéo « bon en partie » hors du passage indiqué dans sa fiche.", "",
     f"- **Grande vidéo d'ouverture** ({len(ouv)} possibles) :"] + [ligne(e) for e in ouv] + ["",
     f"- **L'espace, le vaisseau, l'arrivée** ({len(espace)}) :"] + [ligne(e) for e in espace] + ["",
     f"- **Seed et Rob1** ({len(seedrob)}) :"] + [ligne(e) for e in seedrob] + ["",
     f"- **Bestiaire** ({len(faune)} vidéos d'animaux) :"] + [ligne(e) for e in faune] + ["",
     f"- **Bandeaux très larges** ({len(bandeaux)} images, rapport d'environ 4,7:1, 2900 à 6700 px de large) :"] + [ligne(e) for e in bandeaux] + ["",
     f"- **Seed et Rob1, à utiliser seulement sur le passage indiqué** ({len(partiel)}) : voir la page d'inventaire, filtre « Bon en partie ».",
     "- **Ce qui manque** : aucun fichier sur la naissance de Seed, la capsule qui tombe dans le gouffre, les lacs roses et pourpres, les Titans, le message vers la Terre ; une seule bonne vidéo avec le grand robot (20_feu_de_camp). Prévoir des emplacements vides pour ces moments.", ""]
sel = "\n".join(S)

p = R / "docs/site/BRIEF-CLAUDE-DESIGN.md"
t = p.read_text(encoding="utf-8")
t = re.sub(r"\n### Sélection de départ.*?(?=\n## 5\.)", "\n", t, flags=re.S)
t = t.replace("- L'inventaire complet avec vignettes : `media/inventaire/` (en cours ; s'il n'est pas encore là, travailler avec des emplacements au bon format).",
              "- L'inventaire complet avec vignettes : `media/inventaire/` (fait le 25/11/2026 : 98 vidéos, 60 images ; page publiée sous `inventaire-medias/`).")
t = t.replace("\n## 5. Le contenu", sel + "\n## 5. Le contenu", 1)
p.write_text(t, encoding="utf-8")

b = R / "docs/site/briefs.html"
h = b.read_text(encoding="utf-8")
for tid, f in (("t1", "BRIEF-INVENTAIRE-MEDIAS.md"), ("t2", "BRIEF-CLAUDE-DESIGN.md")):
    txt = html.escape((R / "docs/site" / f).read_text(encoding="utf-8"))
    h, n = re.subn(rf'(<textarea id="{tid}" readonly>).*?(</textarea>)', lambda m: m.group(1) + txt + m.group(2), h, flags=re.S)
    assert n == 1, tid
b.write_text(h, encoding="utf-8")
print(len(ouv), len(espace), len(seedrob), len(faune), len(bandeaux), len(partiel))
