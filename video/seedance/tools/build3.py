import json, os, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import data3 as data

HERE = pathlib.Path(__file__).parent
WORK = HERE.parent / "_work"
thumbs = json.load(open(WORK / "thumbs.json"))
import base64, io
from PIL import Image as _I
def _th(p):
    im = _I.open(p).convert('RGB'); im.thumbnail((640, 640)); b = io.BytesIO(); im.save(b, 'JPEG', quality=72); return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()
_IM = os.environ.get('SEEDANCE_REFS', str(HERE.parent / '_work' / 'refs'))
thumbs['board'] = _th(_IM + '/4_seed_rob1.jpg'); thumbs['board_full'] = _th(_IM + '/4.jpg')
imgt = json.load(open(WORK / "imgthumbs.json"))

RESUME = {
 "S01": "Rob1 refuse d'être porté, marche seul sur ses petites jambes, se prend les pieds dans une liane et reste coincé dans l'argile. Seed le laisse attendre un instant, le délivre, et il finit sur son dos, en capitaine, jusqu'à une rivière bordée d'arbres roses.",
 "S02": "Une crevasse ouverte par le séisme est la seule voie. Seed descend sur une liane avec Rob1 sanglé sur la poitrine : il a le vertige et éteint ses yeux. Un brin cède, ils se balancent, puis atterrissent dans une caverne éclairée de l'intérieur.",
 "S03": "Dans la caverne, le grand robot tourne en rond, bloqué. Rob1 grimpe sur son dos et s'y connecte en trois clics : il se redresse, Rob1 gonfle d'orgueil. Dehors, il escalade une paroi avec Seed accrochée, et une prise cède.",
 "S04": "Seed dort, Rob1 veille. Ses réserves baissent, il efface les alertes dès qu'elle bouge. Une perturbation magnétique passe : il se place en bouclier. Avant l'aube, ils descendent dans une vallée d'herbe bleue où une nuée d'insectes lumineux les entoure.",
 "S05": "Infiltration à deux au crépuscule dans un troupeau de géants blancs endormis : signes de la main, pointes de pieds, un ronflement qui souffle ses cheveux, une patte qui retombe et que Rob1 retient, un oeil énorme qui s'entrouvre. Ils s'en sortent et s'effondrent dans l'herbe.",
 "S06": "Seed, seule au lever du jour, essaie de siffler. Un séisme ouvre le sol entre elle et Rob1 : une dalle bascule, il la retient d'une seule poussée, puis se secoue les mains. Ils glissent ensemble dans une forêt sombre et rient dans la mousse.",
 "S07": "Dans un canyon orange, une perturbation magnétique colle Rob1 à la paroi comme un aimant ; Seed rit, tire, abandonne. Le canyon s'ouvre sur une baie dorée où de hautes colonnes de nuée brillent, calmes, au loin.",
 "S08": "Seed court sur une pente volcanique avec Rob1 sur le dos jusqu'à une plage de sable noir. Le plancton s'allume sous son pied, il se met à danser, elle le rejoint. Puis il lit une alerte sur son avant-bras et la cache d'un geste.",
 "S09": "Première aube ambrée. Rob1 glisse sur la fine pellicule d'eau des lacs salés, Seed patine derrière lui. Il s'arrête au milieu d'une colonie d'oiseaux pourpres qui décolle en criant « Ko-rê ». Il rejoue le cri, les oiseaux répondent, Seed murmure « Korê ».",
 "S10": "Retour au sinkhole. Rob1 prépare la manoeuvre, le grand robot descend sur un câble accrocher la capsule, et les trois tirent ensemble. Le câble glisse, Rob1 est projeté, puis la capsule bosselée passe le bord et tous les trois fêtent ça.",
}
SPEECH = {
 "S06": "One spoken word only: Seed cries \"Rob!\" at 10.5 seconds; no other speech.",
 "S09": "One whispered word only: Seed says \"Korê\" at 28.5 seconds; no other speech.",
}
for _s in data.SEQ:
    _s["resume"] = RESUME[_s["id"]]
    _s["speech"] = SPEECH.get(_s["id"], "No speech at all.")

# Les 100 images de Cal, rangées par couleur (numéros = ordre de mes planches)
GALLERY = [
 ("Rouge", "#c0392b", [1,2,3,5,11,17,19,22,23,24,43,50,51,52,63,71,72,92,98,99]),
 ("Rose et magenta", "#c45a9e", [18,21,95]),
 ("Orange et feu", "#d9782b", [15,16,39,42,44,46,88]),
 ("Ocre et jaune", "#d4b13a", [20,25,31,36,57,66,67,89,96,97]),
 ("Or, plaines", "#d9a441", [12,14,62]),
 ("Vert", "#6aa84f", [8,10,13,37,38,84,85]),
 ("Bleu, turquoise, violet", "#3d7bff", [28,40,48,55,56,58,59,60,61,64,65,91]),
 ("Brume gris-bleu et blanc", "#8da4ae", [4,34,35,41,45,47,53,54,90,94]),
 ("Sombre", "#4a4a52", [9]),
 ("Animaux", "#e0674a", [6,7,26,27,29,30,32,33,49,68,69,70] + list(range(73, 84)) + [86,87,93,100]),
]
SILH = [22,23,24,55,56,57,58,60,62,67,71]
_seen = [i for g in GALLERY for i in g[2]]
_missing = sorted(set(range(1, 101)) - set(_seen))
_dups = sorted(i for i in set(_seen) if _seen.count(i) > 1)
print("manquants:", _missing, "doublons:", _dups)
USED_BY = {}
for _s in data.SEQ:
    for _r in _s["refs"]:
        if _r.startswith("i"):
            USED_BY.setdefault(int(_r[1:]), []).append(_s["id"])
gal = [{"nom": n, "col": c, "items": [{"i": "%02d" % i, "n": imgt["names"].get("%02d" % i, ""), "silh": i in SILH, "seq": USED_BY.get(i, [])} for i in ids]} for n, c, ids in GALLERY]

payload = {
    "style": data.GLOBAL_STYLE,
    "neg": data.NEGATIVES,
    "refs": {k: {"name": v["name"], "desc": v["desc"], "img": v.get("img", False), "idx": v.get("idx", ""), "title": v.get("title", "")} for k, v in data.REFS.items()},
    "seq": data.SEQ,
    "gal": gal,
}
js_data = json.dumps(payload, ensure_ascii=False).replace("</", "<\\/")
js_thumbs = json.dumps(thumbs).replace("</", "<\\/")
js_img = json.dumps({"g": imgt["g"], "big": imgt["big"]}).replace("</", "<\\/")

TEMPLATE = r"""<title>Séquences Seedance</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Azeret+Mono:wght@400;500&family=Chakra+Petch:wght@400;500;600;700&display=swap">
<style>
/* Mise en page : une colonne de lecture, bandeau de réglages, galerie par couleur, cartes de prompts à copier. Thème Verdant de Cal, sombre uniquement. */
:root{
  --bg:#0a0d0b; --panel:#111814; --panel2:#16201a; --well:#070a08;
  --line:rgba(47,107,74,.55); --line2:rgba(185,207,216,.16);
  --ink:#c4d6de; --ink2:#8da4ae; --ink3:#647c86; --head:#eef4f1;
  --accent:#e0674a; --accent-ink:#1b0d08; --green:#2f6b4a; --green-ink:#8fd0a8; --warn:#f0b49b;
  --text:"Chakra Petch","Segoe UI",system-ui,sans-serif; --mono:"Azeret Mono",ui-monospace,"SFMono-Regular",Menlo,monospace;
  color-scheme:dark;
}
html{background:var(--bg)}
body{background:var(--bg);color:var(--ink);font-family:var(--text);font-size:15px;line-height:1.6;
  padding-block:28px 64px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
.wrap{max-width:1040px;margin:0 auto;display:flex;flex-direction:column;gap:28px;min-width:0}
h1,h2,h3{font-family:var(--text);color:var(--head);margin:0;text-wrap:balance;line-height:1.15}
h1{font-size:clamp(28px,5vw,44px);font-weight:700;letter-spacing:.01em}
h2{font-size:12px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;font-family:var(--mono);color:var(--accent)}
h3{font-size:clamp(20px,3vw,26px);font-weight:600}
p{margin:0}
a{color:var(--green-ink);text-underline-offset:3px}
.eyebrow{font-family:var(--mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink3)}
.lead{max-width:68ch;color:var(--ink);font-size:16px}
.head{display:flex;flex-direction:column;gap:12px}
section{display:flex;flex-direction:column;gap:12px;min-width:0}

.settings{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1px;background:var(--line);border-radius:12px;overflow:hidden;box-shadow:0 0 0 1px var(--line)}
.settings div{background:var(--panel);padding:12px 14px;display:flex;flex-direction:column;gap:2px;min-width:0}
.settings .k{font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink3)}
.settings .v{font-size:17px;font-weight:600;color:var(--head);font-variant-numeric:tabular-nums}

.check{background:var(--panel);border-radius:12px;box-shadow:inset 0 0 0 1px var(--line2);padding:16px 18px;display:flex;flex-direction:column;gap:10px}
.check ul{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:8px}
.check li::marker{color:var(--accent)}
.check b{color:var(--head);font-weight:600}

.refs{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
.ref{background:var(--panel);border-radius:12px;box-shadow:inset 0 0 0 1px var(--line2);overflow:hidden;display:flex;flex-direction:column;min-width:0}
.ref img{display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;background:var(--well)}
.ref .cap{padding:10px 14px 14px;display:flex;flex-direction:column;gap:4px}
.ref .cap b{color:var(--head);font-weight:600}
.ref .cap span{font-size:13px;color:var(--ink2)}
.num{display:inline-grid;place-items:center;min-width:22px;height:22px;padding:0 6px;border-radius:999px;background:var(--accent);color:var(--accent-ink);font-family:var(--mono);font-size:11px;font-weight:500;margin-right:8px}

.gal{display:flex;flex-direction:column;gap:18px}
.gal h4{margin:0;font-family:var(--mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--head);font-weight:500;display:flex;align-items:center;gap:10px}
.gal h4 i{width:14px;height:14px;border-radius:4px;display:inline-block}
.gal h4 span{color:var(--ink3)}
.gg{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:8px}
.gi{margin:0;background:var(--panel);border-radius:10px;box-shadow:inset 0 0 0 1px var(--line2);overflow:hidden;display:flex;flex-direction:column;min-width:0}
.gi img{display:block;width:100%;height:auto;aspect-ratio:16/10;object-fit:cover;background:var(--well)}
.gi figcaption{padding:6px 8px 8px;display:flex;flex-direction:column;gap:2px;font-size:11.5px;color:var(--ink2);line-height:1.35}
.gi b{font-family:var(--mono);font-weight:500;color:var(--head);font-size:11px}
.gi .tag{font-family:var(--mono);font-size:10px;letter-spacing:.06em;color:var(--accent)}
.gi .tag.s{color:var(--warn)}

.shared{background:var(--panel);border-radius:12px;box-shadow:inset 0 0 0 1px var(--line2);padding:16px 18px;display:flex;flex-direction:column;gap:14px}
.shared label{display:flex;flex-direction:column;gap:6px;font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink3)}
textarea{width:100%;background:var(--well);color:var(--ink);border:0;border-radius:10px;box-shadow:inset 0 0 0 1px var(--line);font-family:var(--mono);font-size:12.5px;line-height:1.65;padding:10px 12px;resize:vertical;min-height:96px}
textarea:focus-visible,button:focus-visible,a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}

button{font-family:var(--text);font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;border:0;border-radius:999px;cursor:pointer;min-height:40px;padding:0 20px}
.btn{background:var(--accent);color:var(--accent-ink)}
.btn:hover{background:#ec7a5e}
.btn.done{background:var(--green);color:#e8f6ee}
.ghost{background:transparent;color:var(--ink);box-shadow:inset 0 0 0 1px var(--line)}
.ghost:hover{background:var(--panel2)}

.nav{display:flex;flex-wrap:wrap;gap:8px}
.nav a{font-family:var(--mono);font-size:11px;letter-spacing:.08em;text-decoration:none;color:var(--ink);padding:6px 12px;border-radius:999px;box-shadow:inset 0 0 0 1px var(--line);display:inline-flex;gap:8px}
.nav a:hover{background:var(--panel2)}
.nav a i{font-style:normal;color:var(--accent)}

.card{background:var(--panel);border-radius:14px;box-shadow:inset 0 0 0 1px var(--line2);display:flex;flex-direction:column;min-width:0;scroll-margin-top:16px;overflow:hidden}
.card .band{height:6px}
.card header{padding:20px 22px 14px;display:flex;flex-direction:column;gap:8px;border-bottom:1px solid var(--line2)}
.meta{display:flex;flex-wrap:wrap;gap:6px 16px;font-family:var(--mono);font-size:11px;letter-spacing:.08em;color:var(--ink2);text-transform:uppercase}
.meta b{color:var(--accent);font-weight:500}
.card .body{padding:16px 22px 22px;display:flex;flex-direction:column;gap:14px;min-width:0}
.lbl{font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink3)}
.joins{display:flex;flex-direction:column;gap:10px}
.jrow{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px}
.jc{display:flex;flex-direction:column;gap:6px;background:var(--well);border-radius:10px;box-shadow:inset 0 0 0 1px var(--line2);padding:8px;min-width:0}
.jc img{display:block;width:100%;height:auto;aspect-ratio:16/10;object-fit:cover;border-radius:6px;background:var(--bg)}
.jc .t{font-size:13px;color:var(--head);display:flex;align-items:flex-start;gap:0}
.jc code{font-family:var(--mono);font-size:10.5px;color:var(--ink2);overflow-wrap:anywhere;line-height:1.5;user-select:all}
.jchip{display:inline-flex;align-items:center;padding:3px 12px 3px 4px;border-radius:999px;box-shadow:inset 0 0 0 1px var(--line);color:var(--head);font-size:14px}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.ecart{font-size:13px;color:var(--warn);background:rgba(240,180,155,.07);border-radius:10px;padding:10px 12px;box-shadow:inset 0 0 0 1px rgba(240,180,155,.22)}
pre.prompt{margin:0;background:var(--well);border-radius:10px;box-shadow:inset 0 0 0 1px var(--line);padding:14px 16px;font-family:var(--mono);font-size:12.5px;line-height:1.7;color:var(--ink);white-space:pre-wrap;overflow-wrap:anywhere;min-width:0}
.resume{color:var(--ink);max-width:70ch}
ol.shots{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px;font-size:13px;color:var(--ink2)}
ol.shots li{display:grid;grid-template-columns:64px 1fr;gap:10px;align-items:baseline;min-width:0}
ol.shots .t{font-family:var(--mono);font-size:11px;color:var(--accent);font-variant-numeric:tabular-nums;letter-spacing:.04em}
details.full summary{cursor:pointer;font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--green-ink);padding:4px 0}
details.full pre.prompt{margin-top:10px}
.count{font-family:var(--mono);font-size:11px;color:var(--ink3);letter-spacing:.06em}
details.how{background:var(--panel);border-radius:12px;box-shadow:inset 0 0 0 1px var(--line2);padding:14px 18px}
details.how summary{cursor:pointer;font-weight:600;color:var(--head)}
details.how ul{margin:12px 0 0;padding-left:18px;display:flex;flex-direction:column;gap:6px;color:var(--ink2)}
.opt{font-size:13px;color:var(--ink2)}
@media (max-width:560px){ .card header,.card .body{padding-left:16px;padding-right:16px} button{width:100%} .row button{flex:1 1 100%} .gg{grid-template-columns:repeat(auto-fill,minmax(120px,1fr))} }
@media (prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}
</style>

<div class="wrap">
  <div class="head">
    <div class="eyebrow">Second Earth · Seedance 2.5 sur Higgsfield</div>
    <h1>Dix séquences de 30 secondes, deux paysages chacune</h1>
    <p class="lead">Seed et Rob1 : le petit robot qui pense en adulte, rieur, inquiet, prêt à tout pour elle. Chaque séquence relie deux de tes images, d'une couleur à l'autre, avec de l'action, de l'humour et de la tendresse, jamais effrayante. Les images à joindre sont affichées sur chaque carte, dans l'ordre.</p>
  </div>

  <section aria-labelledby="h-reglages">
    <h2 id="h-reglages">Réglages Higgsfield</h2>
    <div class="settings">
      <div><span class="k">Modèle</span><span class="v">Seedance 2.5</span></div>
      <div><span class="k">Mode</span><span class="v">omni_reference</span></div>
      <div><span class="k">Durée</span><span class="v">30 s</span></div>
      <div><span class="k">Résolution</span><span class="v">720p</span></div>
      <div><span class="k">Format</span><span class="v">16:9</span></div>
      <div><span class="k">Audio</span><span class="v">activé</span></div>
    </div>
  </section>

  <section aria-labelledby="h-verif">
    <h2 id="h-verif">À vérifier avant de lancer</h2>
    <div class="check">
      <ul>
        <li><b>Silhouettes dans tes images</b> : 55 (S03), 60 (S04) et 58 (S05) montrent deux petites silhouettes. Les prompts demandent de les ignorer, mais l'image pèse plus que le texte : recadre-les ou accepte qu'elles apparaissent au loin.</li>
        <li><b>Rob1</b> : j'ai pris le petit humanoïde (planche à 4 vues, yeux cyan). Le grand robot bipède joue Rob2 dans S03 et S10.</li>
        <li><b>Drapeau du XENOPOD</b> (S10) : l'image porte un drapeau américain et des lettres. Les prompts demandent de les effacer, mais mieux vaut retirer le drapeau de l'image avant de la joindre.</li>
        <li><b>Écarts avec la Bible</b> : chaque carte les liste. Le principal : les lacs de ton image 38 sont vert acide (S09), la Bible les dit rose et pourpre. Tes images décident, je signale seulement.</li>
        <li><b>Longueur</b> : les prompts font entre 1 280 et 1 500 mots (compteur sur chaque carte). Les exemples de 30 secondes du guide Higgsfield font de 950 à 1 350 mots ; aucune limite n'y est indiquée. Si l'interface refuse un prompt, envoie-moi le message affiché et je coupe.</li>
        <li><b>Brouillon</b> : Higgsfield propose un brouillon en 480p, finalisable pendant sept jours. Pratique pour tester le découpage avant de payer le rendu complet.</li>
      </ul>
    </div>
  </section>

  <section aria-labelledby="h-refs">
    <h2 id="h-refs">Personnages et machines</h2>
    <div class="refs" id="refs"></div>
  </section>

  <section aria-labelledby="h-gal">
    <h2 id="h-gal">Tes 100 images, rangées par couleur</h2>
    <p class="opt">Le numéro est l'ordre de mes planches, pas celui de ton dossier. Les images marquées « S01 », « S05 »… sont attachées à cette séquence. « silhouette » indique une personne visible dans l'image. Les 27 animaux ne sont pas encore placés : ils sont pour la suite.</p>
    <div class="gal" id="gal"></div>
  </section>

  <section aria-labelledby="h-style">
    <h2 id="h-style">Style commun aux dix prompts</h2>
    <div class="shared">
      <p class="opt">Ces deux blocs sont recopiés tels quels dans chaque prompt : le guide Higgsfield conseille de garder le même look d'un plan à l'autre. Modifie-les ici et les dix prompts changent.</p>
      <label for="st-style">Look photographique<textarea id="st-style" rows="7" spellcheck="false" lang="en"></textarea></label>
      <label for="st-neg">Interdits<textarea id="st-neg" rows="3" spellcheck="false" lang="en"></textarea></label>
      <div class="row"><button type="button" class="ghost" id="st-reset">Revenir au style d'origine</button></div>
    </div>
  </section>

  <section aria-labelledby="h-seq">
    <h2 id="h-seq">Les séquences</h2>
    <nav class="nav" id="nav" aria-label="Aller à une séquence"></nav>
  </section>

  <div id="cards" style="display:flex;flex-direction:column;gap:22px"></div>

  <details class="how">
    <summary>D'où vient la structure des prompts</summary>
    <ul>
      <li>Seedance 2.5 sur Higgsfield : jusqu'à 30 secondes par génération, 720p ou 1080p, jusqu'à 50 images de référence, son généré dans la même passe.</li>
      <li>Le guide Higgsfield écrit le prompt en blocs nommés (style global, scène, références, lieu, premier plan et placement, plans minutés, optique, physique, lumière, son) et marque chaque coupe « Hard cut ». Ses exemples de 30 secondes ajoutent FORMAT MODE (nombre de plans, de coupes, règle de parole) et POSITIVE LOCKS (ce qui reste identique d'une coupe à l'autre) : repris ici.</li>
      <li>Les références sont décrites une par une (« Reference image 3 is … »), chacune avec son rôle. Le lieu est figé dans son propre bloc : un lieu vague est la première cause de dérive entre deux plans.</li>
      <li>Un seul mouvement de caméra par plan, le même bloc de style dans chaque prompt, et une ligne de son à la fin.</li>
      <li>Pour un rendu photoréaliste : nommer le format de capture, l'optique, le grain organique, et interdire le lissage, la retouche et l'aspect de synthèse.</li>
      <li>Aucun nom de marque, de studio ou d'oeuvre n'entre dans les prompts (règle du projet).</li>
    </ul>
    <p class="opt" style="margin-top:12px">Sources : <a href="https://higgsfield.ai/blog/seedance-2-5-prompting-guide" target="_blank" rel="noopener">guide Higgsfield Seedance 2.5</a>, <a href="https://runway.com/resources/seedance-2-0-prompt-guide" target="_blank" rel="noopener">guide Seedance 2.0 (références, plans numérotés)</a>, <a href="https://www.krea.ai/blog/seedance-2-5-prompt-guide" target="_blank" rel="noopener">guide Krea Seedance 2.5</a>.</p>
  </details>
</div>

<script>
var D = __DATA__;
var THUMBS = __THUMBS__;
var IMGT = __IMGT__;
var DEFAULTS = { style: D.style, neg: D.neg };
var store = { get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) {} } };
var $ = function (s, r) { return (r || document).querySelector(s); };
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

var styleEl = $('#st-style'), negEl = $('#st-neg');
styleEl.value = store.get('sd3-style') || DEFAULTS.style;
negEl.value = store.get('sd3-neg') || DEFAULTS.neg;

function fmt(n) { return n.toFixed(1) + 's'; }
var NUM = ['zero','one','two','three','four','five','six','seven','eight','nine','ten'];
function locks(s) {
  var L = [];
  var n = function (k) { return s.refs.indexOf(k) + 1; };
  L.push("Seed's face, freckles, white buzz-cut hair, white hooded bodysuit and yellow over-trousers stay identical across every cut (Reference image " + n('seed') + ").");
  L.push("Rob1 keeps the same small body, about one metre tall with the top of his helmet at Seed's waist, clearly much smaller than Seed in every shot where both appear, the same helmet-head, side pods and backpack across every cut (Reference image " + n('rob1') + "); his visor only ever shows simple cyan or amber shapes, never text or a human face.");
  if (s.refs.indexOf('big') >= 0) L.push('The big robot keeps the same design and size, about 2.5 metres tall, across every cut (Reference image ' + n('big') + ').');
  if (s.refs.indexOf('xeno') >= 0) L.push('The XENOPOD-01 capsule keeps its shape (Reference image ' + n('xeno') + '), with no flag and no lettering.');
  var places = s.refs.filter(function (k) { return D.refs[k].img && /^a location/.test(D.refs[k].desc); });
  if (places.length === 2) L.push('LOCATION A always follows Reference image ' + n(places[0]) + ' and LOCATION B always follows Reference image ' + n(places[1]) + ': same shapes, materials and colours as the references.');
  var beasts = s.refs.filter(function (k) { return D.refs[k].img && !/^a location/.test(D.refs[k].desc); });
  if (beasts.length) L.push('The giant animals follow Reference images ' + beasts.map(n).join(' and ') + ' for build, fur and horns.');
  var bd = s.refs.indexOf('board') >= 0 ? 'board' : (s.refs.indexOf('board_full') >= 0 ? 'board_full' : '');
  if (bd) L.push('Relative sizes always follow the scale board (Reference image ' + n(bd) + '): ' + (bd === 'board_full' ? 'Seed, Rob1 and the big robot' : 'Seed and Rob1') + ' keep exactly the proportions shown there.');
  var cast = 2 + (s.refs.indexOf('big') >= 0 ? 1 : 0);
  L.push('Only these ' + NUM[cast] + ' characters appear: no other people, no extra robots.');
  L.push('Exactly ' + NUM[s.shots.length] + ' shots and ' + NUM[s.shots.length - 1] + ' hard cuts, no dissolves.');
  return L.join(' ');
}
function compose(s) {
  var out = [];
  out.push('GLOBAL STYLE: ' + styleEl.value.trim());
  out.push('FORMAT MODE: Controlled ' + NUM[s.shots.length] + '-shot sequence, ' + NUM[s.shots.length - 1] + ' HARD CUTs, ' + s.duree.toFixed(1) + ' seconds total, real-time motion with no slow motion. ' + s.speech + ' No music.');
  out.push('SCENE: ' + s.scene);
  var ch = s.refs.map(function (k, i) { return 'Reference image ' + (i + 1) + ' is ' + D.refs[k].desc; }).join(' ');
  out.push('REFERENCES: ' + ch.trim());
  if (s.animals) out.push('ANIMALS AND PROPS: ' + s.animals);
  out.push('LOCATION: ' + s.location);
  out.push('FIRST FRAME AND BLOCKING: ' + s.first);
  var lines = ['SHOTS (' + s.duree + ' seconds, ' + s.shots.length + ' shots, hard cuts):'];
  s.shots.forEach(function (sh, i) {
    lines.push(fmt(sh[0]) + ' to ' + fmt(sh[1]) + ', SHOT ' + (i + 1) + ', ' + sh[2] + '. ' + sh[3]);
    if (i < s.shots.length - 1) lines.push('HARD CUT.');
  });
  out.push(lines.join('\n'));
  out.push('CAPTURE FORMAT AND OPTICS: ' + s.optics);
  out.push('PHYSICS: ' + s.physics);
  out.push('LIGHTING: ' + s.lighting);
  out.push('AUDIO: ' + s.audio + ' No music, no narration, no subtitles.');
  out.push('POSITIVE LOCKS: ' + locks(s));
  out.push('TEXTURE AND REALISM: ' + negEl.value.trim());
  return out.join('\n\n');
}

function renderRefs() {
  var items = [
    { k: 'seed', n: 'Seed', t: 'Planche 3 vues et 4 visages. Identité, cheveux, combinaison. Dans les dix séquences.' },
    { k: 'rob1', n: 'Rob1', t: 'Petit humanoïde, 4 vues. Yeux cyan, sac sur le dos. Dans les dix séquences.' },
    { k: 'rob_big', n: 'Grand robot bipède', t: 'Joue Rob2 dans S03 et S10.' },
    { k: 'xeno', n: 'XENOPOD-01', t: 'Capsule posée, dans S10. Retirer le drapeau avant de joindre.' }
  ];
  $('#refs').innerHTML = items.map(function (r) {
    return '<figure class="ref" style="margin:0"><img alt="' + esc(r.n) + '" src="' + THUMBS[r.k] + '"><figcaption class="cap"><b>' + esc(r.n) + '</b><span>' + esc(r.t) + '</span></figcaption></figure>';
  }).join('');
}

function renderGal() {
  $('#gal').innerHTML = D.gal.map(function (g) {
    var cells = g.items.map(function (it) {
      var tags = '';
      if (it.seq.length) tags += '<span class="tag">' + it.seq.join(', ') + '</span>';
      if (it.silh) tags += '<span class="tag s">silhouette</span>';
      return '<figure class="gi"><img loading="lazy" alt="Image ' + it.i + '" src="' + IMGT.g[it.i] + '"><figcaption><b>' + it.i + '</b><span>' + esc(it.n.replace(/_/g, ' ')) + '</span>' + tags + '</figcaption></figure>';
    }).join('');
    return '<div><h4><i style="background:' + g.col + '"></i>' + esc(g.nom) + ' <span>' + g.items.length + '</span></h4><div class="gg">' + cells + '</div></div>';
  }).join('');
}

function renderNav() {
  $('#nav').innerHTML = D.seq.map(function (s) {
    return '<a href="#' + s.id.toLowerCase() + '"><i>' + s.id + '</i>' + esc(s.titre) + '</a>';
  }).join('');
}

function words(t) { return t.trim().split(/\s+/).length; }

function joinCell(k, i) {
  var r = D.refs[k];
  if (r.img) {
    return '<div class="jc"><img alt="' + esc(r.name) + '" src="' + IMGT.big[r.idx] + '"><div class="t"><span class="num">' + (i + 1) + '</span><span>Image ' + r.idx + ' : ' + esc(r.name) + '</span></div><code>' + esc(r.title) + '</code></div>';
  }
  var th = { seed: 'seed', rob1: 'rob1', big: 'rob_big', xeno: 'xeno', board: 'board', board_full: 'board_full' }[k];
  return '<div class="jc"><img alt="' + esc(r.name) + '" src="' + THUMBS[th] + '"><div class="t"><span class="num">' + (i + 1) + '</span><span>' + esc(r.name) + '</span></div></div>';
}

function renderCards() {
  $('#cards').innerHTML = D.seq.map(function (s) {
    var joins = s.refs.map(joinCell).join('');
    var plan = s.shots.map(function (sh) { return '<li><span class="t">' + Math.round(sh[0]) + '–' + Math.round(sh[1]) + ' s</span><span>' + esc(sh[2]) + '</span></li>'; }).join('');
    return '<article class="card" id="' + s.id.toLowerCase() + '" data-id="' + s.id + '">' +
      '<div class="band" style="background:linear-gradient(90deg,' + s.grad[0] + ',' + s.grad[1] + ')"></div>' +
      '<header><div class="meta"><b>' + s.id + '</b><span>' + esc(s.trajet) + '</span><span>Plans ' + esc(s.plans) + '</span><span>' + s.duree + ' s · ' + s.shots.length + ' plans</span></div><h3>' + esc(s.titre) + '</h3><p class="resume">' + esc(s.resume) + '</p><p class="count">Palette : ' + esc(s.palette) + '</p></header>' +
      '<div class="body"><div class="joins"><span class="lbl">Joindre dans cet ordre</span><div class="jrow">' + joins + '</div></div>' +
      '<p class="ecart">' + esc(s.ecart) + '</p>' +
      '<ol class="shots" aria-label="Plans">' + plan + '</ol>' +
      '<div class="row"><button type="button" class="btn" data-copy="' + s.id + '">Copier le prompt</button><span class="count" data-count="' + s.id + '"></span></div>' +
      '<details class="full"><summary>Voir le prompt complet</summary><pre class="prompt" data-pre="' + s.id + '"></pre></details></div></article>';
  }).join('');
  fill();
}

function fill() {
  D.seq.forEach(function (s) {
    var t = compose(s);
    $('[data-pre="' + s.id + '"]').textContent = t;
    $('[data-count="' + s.id + '"]').textContent = words(t) + ' mots';
  });
}

function copy(text, btn) {
  function ok() { var l = btn.textContent; btn.textContent = 'Copié'; btn.classList.add('done'); setTimeout(function () { btn.textContent = l; btn.classList.remove('done'); }, 1800); }
  function fallback() {
    var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0';
    document.body.appendChild(ta); ta.select();
    var done = false; try { done = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    if (done) ok(); else { var l = btn.textContent; btn.textContent = 'Sélectionne le texte'; setTimeout(function () { btn.textContent = l; }, 2200); }
  }
  if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(ok, fallback); } else fallback();
}

document.addEventListener('click', function (ev) {
  var b = ev.target.closest('[data-copy]');
  if (b) { var s = D.seq.filter(function (x) { return x.id === b.getAttribute('data-copy'); })[0]; copy(compose(s), b); }
});
styleEl.addEventListener('input', function () { store.set('sd3-style', styleEl.value); fill(); });
negEl.addEventListener('input', function () { store.set('sd3-neg', negEl.value); fill(); });
$('#st-reset').addEventListener('click', function () { styleEl.value = DEFAULTS.style; negEl.value = DEFAULTS.neg; store.set('sd3-style', ''); store.set('sd3-neg', ''); fill(); });

renderRefs(); renderGal(); renderNav(); renderCards();
</script>
"""

html = TEMPLATE.replace("__DATA__", js_data).replace("__THUMBS__", js_thumbs).replace("__IMGT__", js_img)
out = WORK / "seedance-sequences.html"
out.write_text(html, encoding="utf-8")
print("écrit", out, len(html) // 1024, "Ko")
