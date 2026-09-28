#!/usr/bin/env python3
"""Extrait les tables du Bestiaire, de la Flore, des planches de dessin et des biomes
vers data/*.json, pour l'outil de prompts Midjourney et le site.

Usage : python3 tools/build_data.py   (depuis la racine du dossier)
"""
import json, re, os, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = lambda *p: os.path.join(ROOT, *p)


def strip_md(s):
    s = re.sub(r"<br>", " / ", s)
    s = s.replace("**", "").replace("\\|", "|")
    s = re.sub(r"(?<!\w)\*([^*]+)\*(?!\w)", r"\1", s)
    s = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", s)
    return re.sub(r"\s+", " ", s).strip()


def split_row(line):
    line = line.strip()
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|"):
        line = line[:-1]
    cells, cur, i = [], "", 0
    while i < len(line):
        c = line[i]
        if c == "\\" and i + 1 < len(line) and line[i + 1] == "|":
            cur += "|"; i += 2; continue
        if c == "|":
            cells.append(cur.strip()); cur = ""
        else:
            cur += c
        i += 1
    cells.append(cur.strip())
    return cells


def tables_by_section(path):
    """-> liste de (section, intro, headers, rows[list[str]])"""
    out, sec, intro = [], None, []
    lines = open(path, encoding="utf-8").read().splitlines()
    i = 0
    while i < len(lines):
        l = lines[i]
        if l.startswith("## "):
            sec, intro = l[3:].strip(), []
        elif l.startswith("|") and i + 1 < len(lines) and re.match(r"^\|\s*-{3}", lines[i + 1]):
            headers = [strip_md(h) for h in split_row(l)]
            rows = []
            i += 2
            while i < len(lines) and lines[i].startswith("|"):
                rows.append(split_row(lines[i]))
                i += 1
            out.append((sec, " ".join(intro), headers, rows))
            continue
        elif l.strip() and not l.startswith("<!--"):
            intro.append(strip_md(l))
        i += 1
    return out


NAME_RE = re.compile(r"^([A-Z]{2,3}(?:-[A-Z]{2})?-[0-9A-Z]+)\s*·\s*(.+?)\s*\((.+?)\)\s*$")
NAME_RE2 = re.compile(r"^(.+?)\s*\((.+?)\)\s*(?:—\s*(.+))?$")


def parse_name(cell):
    raw = cell.strip()
    plain = strip_md(raw)
    m = NAME_RE.match(plain)
    if m:
        return m.group(1), m.group(2).strip(), m.group(3).strip()
    m = NAME_RE2.match(plain)
    if m:
        return None, m.group(1).strip(), m.group(2).strip()
    return None, plain, ""


KEYMAP = {
    "Taille": "taille", "À dessiner": "a_dessiner", "Vie": "vie",
    "Jumeau terrestre": "jumeau", "Statut": "statut", "Biome": "biome",
    "Continent, biome": "biome", "Forme et taille": "taille",
    "Couleurs": "couleurs", "Ce qui l'explique": "explication",
    "Dans le film": "role", "Où": "biome", "Où, et qui en vit": "biome",
    "Ce qu'il en reste": "vestiges", "Descendant actuel": "descendant",
    "Dominante": "dominante", "Accents": "accents", "Ce qui bouge": "mouvement",
}

SEC_BIOME = {
    "Jungle primordiale": "jungle", "Pitons karstiques": "pitons",
    "Terres rocheuses et cavernes": "cavernes", "Massifs et glaciers": "massifs",
    "Forêt bioluminescente": "foret-bio", "Hautes Plaines": "hautes-plaines",
    "Forêt ancienne": "foret-ancienne",
    "Course volcanique et zones de transition": "volcanique",
    "Mer d'arsenic et fosse": "mer-arsenic", "Lacs salés pourpres": "lacs-sales",
}
PREFIX_BIOME = {
    "JP": "jungle", "PK": "pitons", "TR": "cavernes", "MG": "massifs",
    "FB": "foret-bio", "HP": "hautes-plaines", "FA": "foret-ancienne",
    "ZT": "volcanique", "VC": "volcanique", "MA": "mer-arsenic",
    "LS": "lacs-sales", "HT": "hors-trajet", "CB": "continent-b",
    "CC": "continent-c", "CD": "continent-d", "TX": "transversal",
}


def group_of(code, sec):
    if not code:
        return "titans"
    p = code.split("-")[1] if code.startswith("FL-") else code.split("-")[0]
    if p in ("HT",):
        return "hors-trajet"
    if p in ("CB", "CC", "CD"):
        return "continents"
    if p == "TX":
        return "transversal"
    return "trajet"


def build_species(path, kind):
    items = []
    for sec, intro, headers, rows in tables_by_section(path):
        if not headers or not (headers[0].startswith("Code") or headers[0] == "Titan"):
            continue
        for r in rows:
            if len(r) < 2:
                continue
            code, nom, latin = parse_name(r[0])
            rec = {"code": code, "nom": nom, "latin": latin, "section": sec}
            extra = None
            if not code:
                m = re.search(r"—\s*(.+)$", strip_md(r[0]))
                if m:
                    extra = m.group(1)
            for h, v in zip(headers[1:], r[1:]):
                k = KEYMAP.get(h, re.sub(r"\W+", "_", h.lower()).strip("_"))
                rec[k] = strip_md(v)
            if headers[0] == "Titan" or not code:
                rec["statut"] = extra or ""
                rec["groupe"] = "titans"
                slug = re.sub(r"[^a-z]+", "-", rec["nom"].lower().replace("é", "e").replace("ê", "e")).strip("-")
                rec["code"] = "TI-" + slug.replace("titan-", "").upper()[:10]
            else:
                rec["groupe"] = group_of(code, sec)
                pre = code.split("-")[1] if code.startswith("FL-") else code.split("-")[0]
                rec.setdefault("biome_id", SEC_BIOME.get(sec) or PREFIX_BIOME.get(pre, ""))
                if rec["groupe"] in ("hors-trajet", "continents"):
                    rec["biome_id"] = PREFIX_BIOME.get(pre, rec.get("biome_id", ""))
            items.append(rec)
    return items


def build_palette(path):
    for sec, intro, headers, rows in tables_by_section(path):
        if headers and headers[0] == "Biome":
            return [dict(zip(["biome", "dominante", "accents", "mouvement"], [strip_md(c) for c in r])) for r in rows]
    return []


def build_planches(path):
    txt = open(path, encoding="utf-8").read()
    out = []
    parts = re.split(r"^(#{2,3}) (.+)$", txt, flags=re.M)
    # parts: [pre, level, title, body, level, title, body, ...]
    for j in range(1, len(parts), 3):
        level, title, body = parts[j], parts[j + 1].strip(), parts[j + 2]
        m = re.search(r"```[a-z]*\n(.*?)\n```", body, flags=re.S)
        if not m:
            continue
        prompt = m.group(1).strip()
        lab = re.findall(r"\*\*(Prompt[^*]*)\.\*\*", body)
        prompt_label = lab[0] if lab else "Prompt"
        codes = re.findall(r"\b((?:FL-)?[A-Z]{2}-\d{2}[A-Z]?)\b", title)
        fields = {}
        for lab, key in [("Silhouette", "silhouette"), ("Matières et couleurs", "matieres"),
                         ("Trois traits", "traits"), ("Poses et états", "poses"),
                         ("Invariants", "invariants")]:
            found = re.findall(r"\*\*" + re.escape(lab) + r"(?:\s*\(([^)]*)\))?\.\*\*\s*(.+)", body)
            if found:
                fields[key] = " / ".join((("(" + q + ") ") if q else "") + strip_md(v) for q, v in found)
        cat = "personnage" if title in ("Seed",) or title.startswith("Rob") and "," not in title else None
        if title.startswith("Rob") and ("," in title):
            cat = "machine"
        if title in ("Le drone porteur", "Le robopod", "Le XENOPOD-01", "PERSEPHORA"):
            cat = "machine"
        if title.startswith("Rob") and cat is None:
            cat = "personnage"
        if codes:
            cat = "plante" if codes[0].startswith("FL-") else "animal"
        out.append({"titre": title, "codes": codes, "categorie": cat or "personnage",
                    "prompt_en": prompt, "prompt_label": prompt_label, **split_prompt(prompt), **fields, "statut": "proposé"})
    return out


STYLE_RE = re.compile(r"^painterly science-fiction concept art,(?: realistic proportions,)?\s*(.*?),\s*no text, no watermark\.\s*(.*)$", re.S)


def split_prompt(prompt):
    """Sépare le prompt d'origine en : lumière (propre au sujet) et corps (le sujet).
    La phrase de style commune et « no text, no watermark » deviennent des réglages globaux de l'outil."""
    m = STYLE_RE.match(prompt.strip())
    if not m:
        return {"prompt_lumiere": "", "prompt_corps": prompt.strip()}
    return {"prompt_lumiere": m.group(1).strip(), "prompt_corps": m.group(2).strip()}


def first_para_after(md, heading):
    m = re.search(r"^## " + re.escape(heading) + r"\s*$\n+(.+?)(?=\n## |\Z)", md, flags=re.M | re.S)
    return strip_md(m.group(1)) if m else ""


def build_paysages():
    out = []
    files = sorted(glob.glob(D("docs/bible/1[0-9]-biome-*.md")))
    for i, f in enumerate(files):
        md = open(f, encoding="utf-8").read()
        title = re.search(r"^# (.+)$", md, flags=re.M).group(1)
        secs = re.findall(r"^## (.+)$", md, flags=re.M)
        rec = {"id": os.path.basename(f)[3:-3], "ordre_trajet": i + 1, "groupe": "trajet",
               "titre": title, "fichier": os.path.relpath(f, ROOT).replace("\\", "/"),
               "sections": {}}
        for s in secs:
            rec["sections"][s] = first_para_after(md, s)[:1600]
        out.append(rec)
    for f in sorted(glob.glob(D("docs/bible/hors-trajet/ht-*.md"))):
        md = open(f, encoding="utf-8").read()
        title = re.search(r"^# (.+)$", md, flags=re.M).group(1)
        secs = re.findall(r"^## (.+)$", md, flags=re.M)
        rec = {"id": os.path.basename(f)[:-3], "groupe": "hors-trajet", "titre": title,
               "fichier": os.path.relpath(f, ROOT).replace("\\", "/"), "sections": {}}
        for s in secs:
            rec["sections"][s] = first_para_after(md, s)[:1600]
        out.append(rec)
    return out


def main():
    os.makedirs(D("data"), exist_ok=True)
    faune = build_species(D("docs/especes/bestiaire-de-kore.md"), "animal")
    titans = [t for t in faune if t["groupe"] == "titans"]
    faune = [t for t in faune if t["groupe"] != "titans"]
    flore = build_species(D("docs/especes/flore-de-kore.md"), "plante")
    # statuts absents des tables : complétés d'après le Registre des décisions
    for r in faune:
        if not r.get("statut"):
            r["statut"] = {"continents": "Validé (round 15, S06)"}.get(r["groupe"], "Non indiqué (voir Registre)")
    for t in titans:
        if not t.get("statut"):
            t["statut"] = "Validé (galerie, round 8)"
    palette = build_palette(D("docs/especes/flore-de-kore.md"))
    planches = build_planches(D("docs/especes/planches-de-dessin.md"))
    paysages = build_paysages()

    # rattacher les prompts existants aux fiches
    by_code = {}
    for p in planches:
        for c in p["codes"]:
            by_code.setdefault(c, p)
    for rec in faune + flore:
        p = by_code.get(rec["code"])
        if p:
            rec["prompt_en"] = p["prompt_en"]
            rec["prompt_lumiere"] = p["prompt_lumiere"]
            rec["prompt_corps"] = p["prompt_corps"]
            rec["prompt_statut"] = "proposé (Planches de dessin)"
        else:
            rec["prompt_en"] = rec["prompt_lumiere"] = rec["prompt_corps"] = ""
            rec["prompt_statut"] = "à rédiger"
    for t in titans:
        t["prompt_en"] = t["prompt_lumiere"] = t["prompt_corps"] = ""
        t["prompt_statut"] = "à rédiger"

    # renvois entre fichiers : une même chose décrite à deux endroits
    VOIR_AUSSI = {"TR-05": "FL-TR-01", "FL-TR-01": "TR-05", "TR-F": "TI-VOLANT", "TI-VOLANT": "TR-F"}
    idx = {r["code"]: r for r in faune + flore + titans}
    for code, other in VOIR_AUSSI.items():
        if code in idx:
            idx[code]["voir_aussi"] = other
    # TR-05 (plantes-chant au Bestiaire) reprend le prompt de sa fiche Flore FL-TR-01
    if not idx["TR-05"]["prompt_en"] and idx["FL-TR-01"]["prompt_en"]:
        for k in ("prompt_en", "prompt_lumiere", "prompt_corps", "prompt_statut"):
            idx["TR-05"][k] = idx["FL-TR-01"][k]
    # écarts connus entre la planche (proposé) et le Bestiaire (validé au round 8)
    ECARTS = {
        "JP-01": "Planche : 10–15 cm, posées ailes à plat sur les arbustes-perchoirs, pourpre clair à cœur blanc. Bestiaire : 5–8 cm, fleur violette fermée sur une tige, ailes pourpres à reflets or.",
        "HP-01": "Planche : ~2,5 m au garrot, deux cornes courtes en crochet. Bestiaire : 3–4 m au garrot, ~4 t, cornes larges incurvées.",
        "LS-01": "Planche : ~60 cm, plumage gris clair qui rosit aux ailes, pattes noires. Bestiaire : 1,4 m de haut, 2,2 m d'envergure, plumage pourpre, pattes grises.",
        "FB-03": "Planche : ~40 cm, ailes membraneuses, écailles vert-bronze, bec corné. Bestiaire : 15–25 cm, ailes à plumes courtes, écailles irisées, crête lumineuse.",
    }
    for code, txt in ECARTS.items():
        idx[code]["ecart_planche"] = txt

    dump = lambda name, obj: json.dump(obj, open(D("data", name), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    dump("bestiaire.json", faune)
    dump("titans.json", titans)
    dump("flore.json", flore)
    dump("palette-flore.json", palette)
    dump("planches.json", planches)
    dump("paysages.json", paysages)
    print("faune", len(faune), "titans", len(titans), "flore", len(flore), "palette", len(palette),
          "planches", len(planches), "paysages", len(paysages))
    print("prompts rattachés :", sum(1 for r in faune + flore if r["prompt_en"]))
    for p in planches:
        print(" -", p["categorie"], p["titre"], p["codes"], "| lumière :", p["prompt_lumiere"][:60])


if __name__ == "__main__":
    main()
