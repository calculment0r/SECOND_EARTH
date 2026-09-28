#!/usr/bin/env python3
"""Convertit la sortie XML d'une lecture Claude Docs (read, payload {"kind":"view"}) en Markdown.
Usage : xml2md.py <fichier d'entrée (JSON du résultat, ou XML brut)> <fichier .md de sortie> [titre de secours]"""
import sys, json, re, xml.etree.ElementTree as ET

REFS = {'58dbefef-5a5f-4d85-9015-d43a1246e8b2': 'Découpage 25 min', 'ce660212-deac-4bba-8086-662a7c9cacad': 'Journal de Rob1',
        'a2ff4d73-b5ec-473a-8702-4c667b2b77a9': 'Second Earth · Récit v2', '1c3a90ba-19c3-42de-ae72-1357d30b5c80': 'Planches de dessin',
        '81ea35e9-cb42-4db1-a557-935b0ab18fe6': 'Notes pour Nina', '070420b2-d253-4d33-8e96-7ef96fbe720a': 'Bible Second Earth',
        'e5801f9e-be8b-4109-9d7e-f9ec5305d49a': 'Bestiaire de Korê', 'cccd67b7-04ff-4780-aa3c-7a04b5530ef6': 'Flore de Korê',
        '400e2ec1-d1d7-44d2-8725-d23b3793472f': 'Script Second Earth', '4b083fed-4752-4f4a-86b7-c81d898c59d3': 'Phosphore, biomasse et seconde Terre'}

def load(path):
    raw = open(path, encoding='utf-8').read().strip()
    if raw.startswith('['):
        try:
            arr = json.loads(raw)
            raw = arr[-1]['text'].strip()
        except Exception:
            pass
    if raw.startswith('{'):
        try:
            d = json.loads(raw)
            x = d.get('data', {}).get('xml') or d.get('xml')
            if x: return x
        except Exception:
            pass
        m = re.search(r'"xml":"(.*)","complete"', raw, re.S)
        if m: return json.loads('"' + m.group(1) + '"')
    i = raw.find('<doc'); return raw[i:] if i >= 0 else raw

def inline(el):
    """texte d'un bloc (paragraphe) avec gras, italique, liens, mentions, dates"""
    out = []
    def walk(e, marks=()):
        tag = e.tag
        if tag == 'mention':
            lab = e.get('label') or e.get('name') or ''
            if not lab and e.get('ref'):
                lab = REFS.get(e.get('ref').split('/')[-1], '')
            out.append(lab); return
        if tag == 'date':
            out.append(e.get('value', '')); return
        if tag in ('gap', 'pending'): return
        m = marks
        if tag == 'bold': m = m + ('**',)
        if tag == 'italic': m = m + ('*',)
        if tag == 'strike': m = m + ('~~',)
        if tag == 'code': m = m + ('`',)
        link = e.get('href') if tag == 'link' else None
        txt = (e.text or '')
        seg = []
        if txt: seg.append(txt)
        buf_start = len(out)
        if txt:
            t = txt
            for mk in m if tag in ('bold','italic','strike','code') else ():
                pass
        # rendu : on accumule le texte brut puis on enveloppe
        inner = []
        if e.text: inner.append(e.text)
        for c in e:
            sub = []
            save = len(out)
            walk(c, ())
            inner.append(''.join(out[save:])); del out[save:]
            if c.tail: inner.append(c.tail)
        s = ''.join(inner)
        if tag == 'bold' and s.strip(): s = wrap(s, '**')
        elif tag == 'italic' and s.strip(): s = wrap(s, '*')
        elif tag == 'strike' and s.strip(): s = wrap(s, '~~')
        elif tag == 'code' and s.strip(): s = '`' + s + '`'
        if link: s = '[' + s + '](' + link + ')'
        out.append(s)
    for c in el:
        save = len(out)
        walk(c)
        if c.tail: out.append(c.tail)
    s = ''.join(out)
    return s

def wrap(s, mk):
    lead = len(s) - len(s.lstrip()); trail = len(s) - len(s.rstrip())
    core = s.strip()
    return s[:lead] + mk + core + mk + (s[len(s)-trail:] if trail else '')

def cell_text(cell):
    parts = []
    for p in cell:
        if p.tag == 'paragraph': parts.append(inline(p).replace('|', '\\|').replace('\n', ' '))
        elif p.tag == 'list':
            for li in p:
                for q in li:
                    if q.tag == 'paragraph': parts.append('• ' + inline(q).replace('|', '\\|'))
    return '<br>'.join(x for x in parts if x) or ' '

def block(e, depth=0, lines=None):
    tag = e.tag
    if tag == 'paragraph':
        h = e.get('heading')
        t = inline(e).strip()
        if h: lines.append('#' * int(h) + ' ' + t); lines.append('')
        elif t: lines.append(t); lines.append('')
    elif tag == 'list':
        kind = e.get('kind', 'bullet'); n = 0
        for li in e:
            if li.tag != 'listItem': continue
            n += 1
            first = True
            for q in li:
                if q.tag == 'paragraph':
                    t = inline(q).strip()
                    if first:
                        mark = f'{n}.' if kind == 'ordered' else ('- [x]' if (kind == 'check' and li.get('checked') == 'true') else ('- [ ]' if kind == 'check' else '-'))
                        lines.append('    ' * depth + mark + ' ' + t); first = False
                    else:
                        lines.append('    ' * (depth+1) + t)
                elif q.tag == 'list':
                    sub = []; block(q, depth+1, sub); lines.extend([l for l in sub if l != ''])
        lines.append('')
    elif tag == 'table':
        rows = [r for r in e if r.tag == 'row']
        if not rows: return
        mat = [[cell_text(c) for c in r if c.tag == 'cell'] for r in rows]
        w = max(len(r) for r in mat)
        mat = [r + [' '] * (w - len(r)) for r in mat]
        lines.append('| ' + ' | '.join(mat[0]) + ' |')
        lines.append('|' + ' --- |' * w)
        for r in mat[1:]: lines.append('| ' + ' | '.join(r) + ' |')
        lines.append('')
    elif tag == 'blockquote':
        sub = []
        for c in e: block(c, depth, sub)
        lines.extend(['> ' + l if l else '>' for l in sub]); lines.append('')
    elif tag in ('codeBlock', 'code_block', 'code'):
        lines.append('```' + (e.get('lang') or e.get('language') or ''))
        lines.append(''.join(e.itertext())); lines.append('```'); lines.append('')
    elif tag in ('gap', 'pending'):
        lines.append('<!-- ' + tag + ' -->'); lines.append('')
    elif tag in ('hr', 'horizontalRule', 'rule'):
        lines.append('---'); lines.append('')
    else:
        # bloc inconnu : texte brut
        t = ' '.join(''.join(e.itertext()).split())
        if t: lines.append(t); lines.append('')

def convert(xml):
    root = ET.fromstring(xml)
    lines = []
    for e in root: block(e, 0, lines)
    md = '\n'.join(lines)
    md = re.sub(r'\n{3,}', '\n\n', md).strip() + '\n'
    md = md.replace('****', '')          # gras découpé en plusieurs morceaux
    return md

if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    md = convert(load(src))
    open(dst, 'w', encoding='utf-8').write(md)
    gaps = md.count('<!-- gap')
    print(f'{dst}: {len(md)} caractères, {md.count(chr(10))} lignes' + (f', ATTENTION {gaps} gap(s) : lecture incomplète' if gaps else ''))
