"""Petit convertisseur Markdown -> page HTML lisible (titres, listes, listes numérotées, gras, code, liens, filets).
Usage : python tools/md_simple.py source.md sortie.html"""
import html, re, sys
src, out = sys.argv[1], sys.argv[2]
L = open(src, encoding="utf-8").read().splitlines()
def inl(s):
    s = html.escape(s, quote=False)
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    s = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"(https?://[^\s<)]+)", r'<a href="\1">\1</a>', s)
    return s
o, stack, title = [], [], "Compte rendu"
def close_to(depth):
    while len(stack) > depth: o.append("</%s>" % stack.pop()[0])
for l in L:
    m = re.match(r"^(\s*)([-*]|\d+\.)\s+(.*)", l)
    if m:
        depth = len(m.group(1)) // 2 + 1; tag = "ol" if m.group(2)[0].isdigit() else "ul"
        close_to(depth)
        if len(stack) < depth: o.append("<%s>" % tag); stack.append((tag,))
        o.append("<li>" + inl(m.group(3)) + "</li>"); continue
    close_to(0)
    if not l.strip(): continue
    h = re.match(r"^(#{1,4})\s+(.*)", l)
    if h:
        n = len(h.group(1)); o.append("<h%d>%s</h%d>" % (n, inl(h.group(2)), n))
        if n == 1: title = h.group(2)
    elif l.strip() == "---": o.append("<hr>")
    else: o.append("<p>" + inl(l) + "</p>")
close_to(0)
css = """:root{color-scheme:dark;--bg:#0a0d0b;--panel:#101413;--ink:#e6eae7;--body:#c9d2cd;--ink3:#7c8884;--cy:#b9cfd8;--or:#e0674a;--line:rgba(185,207,216,.14)}
body{margin:0;background:var(--bg);color:var(--body);font:16px/1.65 'Chakra Petch',system-ui,sans-serif}
main{max-width:860px;margin:0 auto;padding:40px max(16px,env(safe-area-inset-left,0px)) 90px}
h1{font-size:34px;color:var(--ink);text-transform:uppercase;letter-spacing:.03em;margin:0 0 10px}
h2{font-size:22px;color:var(--cy);text-transform:uppercase;letter-spacing:.06em;margin:40px 0 10px}
h3{font-size:17px;color:var(--ink);margin:26px 0 6px}
strong{color:var(--ink)} code{font:13px 'Azeret Mono',ui-monospace,monospace;background:#151a18;padding:1px 6px;border-radius:5px;color:var(--ink);overflow-wrap:anywhere}
a{color:#f0b49b;overflow-wrap:anywhere} hr{border:0;border-top:1px solid var(--line);margin:34px 0}
li{margin:4px 0} ol>li::marker{color:var(--or)} ul>li::marker{color:var(--or)}"""
page = '<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>%s</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600&family=Azeret+Mono&display=swap"><style>%s</style><main>%s</main></html>\n' % (html.escape(title), css, "\n".join(o))
open(out, "w", encoding="utf-8").write(page)
print(out, len(page))
