import json, os
D = os.path.dirname(os.path.abspath(__file__))
def j(n):
    p = os.path.join(D, n)
    return json.load(open(p, encoding="utf-8")) if os.path.exists(p) else {}
data = {"moi": j("moi.json"), "perso": j("personnages.json"), "solaris": j("solaris.json")}
t = open(os.path.join(D, "page.html"), encoding="utf-8").read()
out = t.replace("/*__DATA__*/null", json.dumps(data, ensure_ascii=False).replace("</", "<\\/"))
for dest in (os.path.join(D, "chantiers-2026-11-27.html"), r"C:\SECOND EARTH\repo\data\chantiers-2026-11-27.html"):
    open(dest, "w", encoding="utf-8").write(out)
print(len(out), "caractères ;", {k: len(v.get("questions", v.get("questions_site", []))) for k, v in data.items()})
