#!/usr/bin/env python3
"""Construit BRIEF.html (lisible par Cal) à partir de CLAUDE.md et des spécifications.
Usage : python3 tools/build_brief_html.py
"""
import os, re, html, datetime
from markdown_it import MarkdownIt

MD = MarkdownIt("commonmark", {"html": False}).enable("table")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PARTS = [
    ("brief", "Le brief", "CLAUDE.md"),
    ("outil", "Outil de prompts", "site-spec/outil-prompts.md"),
    ("site", "Le site", "site-spec/site.md"),
    ("charte", "La charte", "site-spec/charte.md"),
]


def md2html(text):
    return MD.render(text)


def slug(s):
    s = re.sub(r"<[^>]+>", "", s).lower()
    s = re.sub(r"[^a-z0-9àâäéèêëîïôöùûüç]+", "-", s).strip("-")
    return s[:60]


def build():
    sections, nav = [], []
    for pid, label, path in PARTS:
        text = open(os.path.join(ROOT, path), encoding="utf-8").read()
        body = md2html(text)
        body = re.sub(r"<li>\[ \] ", '<li class="todo">', body)
        body = re.sub(r"<li>\[x\] ", '<li class="todo done">', body)
        subs = []

        def add_id(m):
            level, inner = m.group(1), m.group(2)
            sid = pid + "-" + slug(inner)
            if level == "2":
                subs.append((sid, re.sub(r"<[^>]+>", "", inner)))
            return '<h%s id="%s">%s</h%s>' % (level, sid, inner, level)

        body = re.sub(r"<h([1-3])>(.*?)</h\1>", add_id, body)
        body = body.replace("<table>", '<div class="tw"><table>').replace("</table>", "</table></div>")
        sections.append('<section class="part" id="%s"><div class="src">%s</div>%s</section>' % (pid, html.escape(path), body))
        nav.append((pid, label, subs))

    nav_html = "".join(
        '<li><a class="top" href="#%s">%s</a><ol>%s</ol></li>' % (
            pid, html.escape(label),
            "".join('<li><a href="#%s">%s</a></li>' % (sid, html.escape(t)) for sid, t in subs))
        for pid, label, subs in nav)

    tpl = open(os.path.join(ROOT, "tools", "brief_template.html"), encoding="utf-8").read()
    out = tpl.replace("{{NAV}}", nav_html).replace("{{BODY}}", "\n".join(sections)).replace(
        "{{DATE}}", "28/09/2026")
    open(os.path.join(ROOT, "BRIEF.html"), "w", encoding="utf-8").write(out)
    print("BRIEF.html", len(out))


if __name__ == "__main__":
    build()
