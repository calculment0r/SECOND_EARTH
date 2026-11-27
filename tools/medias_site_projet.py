"""Pose dans site-projet/content/site-content.json les vidéos et panoramiques en ligne (Cloudflare),
d'après media/inventaire/inventaire.json, et les textes du round 18 sur Seed et Rob1 (27/11/2026).
Ne remplit que les emplacements encore vides ; peut être relancé sans dégât.
À ne plus lancer une fois que Cal a publié sa propre version depuis le site."""
import json
from pathlib import Path

R = Path(__file__).resolve().parent.parent
P = R / "site-projet" / "content" / "site-content.json"
INV = {e["id"]: e for e in json.loads((R / "media/inventaire/inventaire.json").read_text(encoding="utf-8"))["fichiers"]}
C = json.loads(P.read_text(encoding="utf-8"))
S = {s["id"]: s for s in C["sections"]}

def med(i):
    e = INV[i]
    if e["type"] == "video":
        return {"src": e["video_url"], "genre": "video", "attendu": e["description"], "poster": e["affiche_url"], "cadre": "50% 50%"}
    return {"src": e["image_url"], "genre": "image", "attendu": e["description"], "poster": "", "cadre": "50% 50%"}

def poser(section, n_bloc, i):
    b = S[section]["blocs"][n_bloc]
    if not b["media"]["src"]:
        b["media"] = med(i)

# les grandes ouvertures
poser("accueil", 0, "seed--04-lagon-de-nacre")
poser("univers", 0, "space--p")
poser("voyage", 0, "seed--14-escalade")
poser("film", 0, "seed--c20-foret-arbres-rouges-champignons-blancs")
poser("salle", 0, "pano-video--outpaint-00003")
for b in S["pitch"]["blocs"]:
    if b["type"] == "media" and not b["media"]["src"]:
        b["media"] = med("space--d2")

def carrousel(section, cid, titre, ids, apres=None):
    blocs = S[section]["blocs"]
    if any(b["id"] == cid for b in blocs):
        return
    items = [{"id": f"{cid}-{n}", "sur": INV[i]["groupe_nom"], "titre": "", "texte": INV[i]["description"], "media": med(i)} for n, i in enumerate(ids)]
    bloc = {"id": cid, "type": "carrousel", "titre": titre, "format": "21:9", "statut": "", "source": "Inventaire des images et des vidéos du 25/11/2026 (fichiers marqués « bon »).", "items": items}
    blocs.insert(len(blocs) if apres is None else apres, bloc)

bons = [e for e in INV.values() if e["etat"] == "bon"]
panos = sorted((e for e in bons if e["type"] == "image" and "bandeau très large" in e.get("usages", [])), key=lambda e: -e["largeur"])
carrousel("accueil", "car-panos-2711", "Korê en panoramique", [e["id"] for e in panos[:10]])
carrousel("especes", "car-animaux-2711", "Premières images des animaux",
          [e["id"] for e in bons if e["groupe"] == "faune-flore" and "animal" in e.get("a_l_ecran", [])][:10], apres=1)
carrousel("personnages", "car-seedrob-2711", "Seed et Rob1, premières images",
          [i for i in ("seed--23-rob1-refuse-qu-on-le-porte", "seed--09-entre-les-geants", "seed--13-nuit-dans-l-arbre", "seed--17-glissade-neige",
                       "seed--20-feu-de-camp", "seed--21-le-grand-timide", "seed--22-la-flore", "seed--c12-colonne-de-lave-meduses") if INV[i]["etat"] == "bon"])
carrousel("pitch", "car-espace-2711", "Le départ et l'arrivée",
          [i for i in ("space--o", "space--d1", "space--v3", "space--a1", "seed--x1-entree-vue-de-derriere", "space--d", "seed--x2c-interieur-rob1-calme") if INV[i]["etat"] == "bon"])

# Seed et Rob1 : round 18 (W06, W07, P01, P02, P03, P05, P06, P07, P08, P12)
pb = S["personnages"]["blocs"]
if not any(b["id"] == "txt-seedrob-2711" for b in pb):
    pb.insert(1, {"id": "txt-seedrob-2711", "type": "texte", "sur": "", "titre": "Seed et Rob1", "statut": "proposé",
        "source": "Registre des décisions, round 18 (27/11/2026) ; les mots de Cal. Formulation proposée.",
        "corps": "Seed sait sans avoir jamais senti. Sa mémoire lui a été donnée pendant l'incubation : des images, des sons, rien d'autre. Aucun de ses sens n'a encore servi. Au réveil, tout arrive trop fort et dans le désordre. Une simple alarme lui fait mal ; Rob1 la coupe aussitôt. Elle ne parle presque pas : tout passe par le regard et le geste, et c'est ce qui la rapproche des animaux de Korê.\n\nRob1 pense en adulte et a la taille d'un petit enfant. Rien dans sa mission ne prévoyait une adolescente qui ne parle pas : il doit inventer, et il change lui aussi. Il refuse qu'on le porte, il boude, puis il grimpe sur son dos. Parfois c'est elle qui le porte, parfois c'est lui qui la protège.\n\nLe vent dans un massif de fleurs fait une musique qu'elle reconnaît sans l'avoir jamais entendue. Aux lacs salés, quand un oiseau crie le nom de la planète, il danse."})
for b in pb:
    for it in b.get("items", []):
        if it.get("titre") == "Seed" and "mi-longs" in it.get("texte", ""):
            it["texte"] = "1,60 m, quinze ans apparents. Cheveux blancs courts : elle a grandi en accéléré dans la cuve. Tenue blanche, bas jaune. Elle ne dit que quatre mots dans tout le film. Elle porte 23 % de la mémoire d'une autre, Elena : des images et des sons, sans le savoir qui va avec."
        if it.get("titre") == "Rob1" and "tête-écran" in it.get("texte", ""):
            it["texte"] = "1 m, un petit robot sombre, deux yeux bleus sur la visière. Le cerveau de la mission. Il ne parle jamais : il écrit sur sa visière et fait des gestes. Très analytique, il n'a pas été préparé à une enfant qui ne parle pas."

P.write_text(json.dumps(C, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print("médias posés :", sum(1 for s in C["sections"] for b in s["blocs"] for m in ([b.get("media")] + [i.get("media") for i in b.get("items", [])]) if m and m.get("src", "").startswith("https://pub-")))
