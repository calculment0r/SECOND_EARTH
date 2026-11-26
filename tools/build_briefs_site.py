"""Construit docs/site/briefs.html : les briefs du nouveau site, chacun avec un bouton Copier.
Lancer après toute modification d'un brief : python tools/build_briefs_site.py"""
import html
from pathlib import Path

D = Path(__file__).resolve().parent.parent / "docs" / "site"
BRIEFS = [
    ("BRIEF-CLAUDE-DESIGN.md", "Le brief général", "À coller en premier dans Claude Design : le projet, le matériel, les pages, ce qu'on attend, dans l'ordre."),
    ("BRIEF-AXE-1-ATLAS.md", "Axe 1 · L'Atlas", "Clair, éditorial : un grand atlas illustré, l'image et la donnée sur la même page."),
    ("BRIEF-AXE-2-ECRAN.md", "Axe 2 · L'Écran", "Noir, cinéma : l'image panoramique occupe tout, l'interface se fait oublier."),
    ("BRIEF-AXE-3-SALLE.md", "Axe 3 · La Salle", "Un lieu en 3D qu'on visite : la planète au centre, des objets à manipuler."),
]
parts = []
for i, (f, titre, quoi) in enumerate(BRIEFS, 1):
    parts.append('<h2>%d. %s</h2><p>%s</p>\n<button data-c="t%d">Copier ce brief</button><span class="ok"></span>'
                 '<textarea id="t%d" readonly>%s</textarea>' % (i, html.escape(titre), html.escape(quoi), i, i, html.escape((D / f).read_text(encoding="utf-8"))))
tout = "\n\n".join((D / f).read_text(encoding="utf-8") for f, _, _ in BRIEFS)
page = """<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Briefs du site</title>
<style>body{margin:0;background:#0a0d0b;color:#e8ece9;font:16px/1.6 system-ui,sans-serif}main{max-width:900px;margin:0 auto;padding:40px 20px 80px}
h1{font-size:34px;margin:0 0 8px}h2{font-size:22px;margin:40px 0 6px}p{color:#b9cfd8;margin:0 0 12px}
button{background:#e0674a;color:#0a0d0b;border:0;border-radius:6px;padding:12px 18px;font:600 15px system-ui;cursor:pointer;margin:6px 0 12px}
textarea{width:100%;height:320px;box-sizing:border-box;background:#111614;color:#e8ece9;border:1px solid #2a332e;border-radius:6px;padding:14px;font:13px/1.5 ui-monospace,monospace}
a{color:#f0b49b}.ok{color:#7fd6a4;margin-left:10px}</style><main>
<h1>Les briefs pour Claude Design</h1><p>Un brief général et trois axes de design. Un bouton copie le texte ; tu le colles dans Claude Design. Le premier bouton copie les quatre d'un coup.</p>
<button data-c="t0">Copier les quatre briefs d'un coup</button><span class="ok"></span><textarea id="t0" readonly style="height:90px">""" + html.escape(tout) + """</textarea>
""" + "\n".join(parts) + """
<p><a href="inventaire-medias/index.html">L'inventaire des images et des vidéos</a> · <a href="index.html">Retour au site</a></p></main>
<script>document.querySelectorAll('button').forEach(function(b){b.onclick=function(){var t=document.getElementById(b.dataset.c);t.select();
(navigator.clipboard?navigator.clipboard.writeText(t.value):Promise.reject()).catch(function(){document.execCommand('copy')});
b.nextElementSibling.textContent='Copié';}});</script></html>
"""
(D / "briefs.html").write_text(page, encoding="utf-8")
print("briefs.html :", len(page), "caractères")
