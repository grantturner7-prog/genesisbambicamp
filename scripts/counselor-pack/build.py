"""Builds the Camp WOW activity plan and counselor pack: a print page (for the PDF) and a web page.

  python3 scripts/counselor-pack/build.py
      -> docs/planning/camp-wow-counselor-pack.html   (print page; needs camp-wow-map.jpg beside it)
      -> scripts/counselor-pack/out/pack-web.html      (the page published as an Artifact, with camp-map.jpg)
  node scripts/counselor-pack/pdf.mjs                  -> docs/planning/camp-wow-counselor-pack.pdf
  python3 scripts/counselor-pack/pages.py              -> page numbers for the contents; then build and pdf once more
Everything is checked on the way: each sheet's steps must fill its time slot exactly, every kit
code must exist on the shopping list, no map label may cover another, and the wording rules hold.
"""
import html, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import maps, sheet_maps
from content import thu, fri, sat, sun, front

e = html.escape
SHOP = json.load(open(HERE + '/shop.json'))
DOCS = os.path.abspath(HERE + '/../../docs/planning')
ITEMS = {r['id']: r for g in SHOP['groups'] for r in g['rows']}
OK_CODES = {'Bambi', 'print', 'own', 'bin 5', 'A14–A18', ''}
PROBLEMS = []
PAGES = {}

SHEETS = thu.SHEETS + fri.SHEETS + sat.SHEETS + sun.SHEETS
RAIN = sun.RAIN
ALL = [front.ROUTINE] + SHEETS + RAIN
BY_ID = {s['id']: s for s in ALL}
DAYCLASS = {'Thursday': 'thu', 'Friday': 'fri', 'Friday and Saturday': 'fri', 'Saturday': 'sat', 'Sunday': 'sun', 'Rain plan': 'rain', 'Every day': 'any'}


def mins(t):
    h, m_ = t.split(':')
    return int(h) * 60 + int(m_)


def dur(a, b):
    return mins(b) - mins(a)


# ---------------------------------------------------------------- checks
def check():
    for s in ALL:
        run = s.get('run') or []
        if s.get('turn'):
            t = 0
            for a, b, _ in run:
                if int(a) != t:
                    PROBLEMS.append(f'{s["id"]}: step starts at minute {a}, expected {t}')
                t = int(b)
            if t != s['turn']:
                PROBLEMS.append(f'{s["id"]}: steps end at minute {t}, the turn is {s["turn"]}')
        elif s.get('start') and run:
            t = mins(s['start'])
            for a, b, _ in run:
                if mins(a) != t:
                    PROBLEMS.append(f'{s["id"]}: step {a} does not follow on (expected {t // 60:02d}:{t % 60:02d})')
                if mins(b) <= mins(a):
                    PROBLEMS.append(f'{s["id"]}: step {a}–{b} has no length')
                t = mins(b)
            if t != mins(s['end']):
                PROBLEMS.append(f'{s["id"]}: steps end at {t // 60:02d}:{t % 60:02d}, the slot ends {s["end"]}')
        for item, qty, code, bin_ in s.get('kit', []):
            for c in [x.strip() for x in code.split(',')]:
                if c not in ITEMS and c not in OK_CODES:
                    PROBLEMS.append(f'{s["id"]}: kit code {c} is not on the shopping list')
    # day timetable rows must agree with the sheets
    for _, _, rows in front.DAYS:
        for when, what, where, sid in rows:
            if sid and sid in BY_ID and BY_ID[sid].get('start') and '–' in when and sid not in ('routine', 'finalfire', 'sports'):
                a, b = when.split('–')
                s = BY_ID[sid]
                if (a, b) != (s['start'], s['end']):
                    PROBLEMS.append(f'timetable {when} does not match sheet {sid} ({s["start"]}–{s["end"]})')
    # wording rules
    banned = re.compile(r'\b(class(es|room)?|lessons?|courses?|curriculum|teach(er|ers|ing|es)?|students?|tuition|school|cabins?|immersion|ESL|STEM|STEAM|police|110(?! m)|non-refundable|buffet|learn(ing|ed|s)?)\b', re.I)
    text = json.dumps([ALL, front.INTRO, front.PLACES, front.TEAMS, front.STAFF, front.BASICS, front.DECIDED, front.ASK_BAMBI, front.PRINT, front.BOARD, front.SCORING_RULES], ensure_ascii=False, default=str)
    for mt in banned.finditer(text):
        ctx = text[max(0, mt.start() - 40):mt.end() + 40]
        if 'course' in mt.group(0).lower() and 'of course' in ctx.lower():
            continue
        PROBLEMS.append(f'wording: "{mt.group(0)}" in …{ctx}…')


# ---------------------------------------------------------------- pieces
def chip(txt):
    """Squad and team names get their colour."""
    t = txt.strip()
    mm = re.fullmatch(r'([YOG])([12])', t)
    if mm:
        return f'<span class="sq {mm.group(1)}">{t}</span>'
    if t in ('Yellow', 'Orange', 'Green'):
        return f'<span class="tm {t[0]}">{t}</span>'
    out = e(txt)
    out = re.sub(r'\b([YOG][12])\b', lambda q: f'<span class="sq {q.group(1)[0]}">{q.group(1)}</span>', out)
    return out


def table(b):
    head = ''.join(f'<th>{e(h)}</th>' for h in b['head'])
    rows = ''.join('<tr>' + ''.join(f'<td>{chip(c)}</td>' for c in r) + '</tr>' for r in b['rows'])
    narrow = ' narrow' if len(b['head']) >= 6 else ''
    return f'<div class="blk"><h3>{e(b["title"])}</h3><div class="tw"><table class="t{narrow}"><thead><tr>{head}</tr></thead><tbody>{rows}</tbody></table></div></div>'


def cards(b):
    out = ''
    for tag, name, sub, text in b['cards']:
        out += f'<div class="card"><div class="ch"><span class="tag">{e(tag)}</span><div><b>{e(name)}</b><span class="sub">{e(sub)}</span></div></div><p>{chip(text)}</p></div>'
    return f'<div class="blk"><h3>{e(b["title"])}</h3><div class="cards n{min(len(b["cards"]), 3)}">{out}</div></div>'


def block(b):
    if b['type'] == 'table':
        return table(b)
    if b['type'] == 'cards':
        return cards(b)
    if b['type'] == 'list':
        return f'<div class="blk"><h3>{e(b["title"])}</h3><ul>{"".join(f"<li>{chip(x)}</li>" for x in b["items"])}</ul></div>'
    if b['type'] == 'note':
        return f'<div class="blk note"><b>{e(b["title"])}.</b> {chip(b["text"])}</div>'
    raise ValueError(b['type'])


def hall_svg(kind):
    """A simple sketch of how the Hall is set. Not to scale."""
    W, H = 600, 210
    s = f'<svg class="hall" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Hall layout">'
    s += f'<rect x="6" y="6" width="{W - 12}" height="{H - 12}" rx="8" class="hw"/><text x="{W / 2}" y="{H - 14}" text-anchor="middle" class="hl">Door</text><rect x="{W / 2 - 36}" y="{H - 9}" width="72" height="6" class="hd"/>'
    cols = ['Y', 'O', 'G', 'Y', 'O', 'G']
    names = ['Y1', 'O1', 'G1', 'Y2', 'O2', 'G2']
    if kind == 'islands':
        for i in range(6):
            x = 105 + (i % 3) * 195
            y = 62 + (i // 3) * 78
            s += f'<rect x="{x - 42}" y="{y - 20}" width="84" height="40" rx="5" class="ht {cols[i]}"/><text x="{x}" y="{y + 5}" text-anchor="middle" class="hn">{names[i]}</text>'
        s += f'<text x="{W / 2}" y="24" text-anchor="middle" class="hl">Six table islands, one a squad, as far apart as the Hall allows</text>'
    elif kind == 'loop':
        pts = [(110, 62), (300, 52), (490, 62), (490, 140), (300, 150), (110, 140)]
        for i, (x, y) in enumerate(pts):
            a, b = pts[i], pts[(i + 1) % 6]
            s += f'<line x1="{a[0]}" y1="{a[1]}" x2="{b[0]}" y2="{b[1]}" class="hp"/>'
        for i, (x, y) in enumerate(pts):
            s += f'<circle cx="{x}" cy="{y}" r="17" class="hs"/><text x="{x}" y="{y + 5}" text-anchor="middle" class="hsn">{i + 1}</text>'
        s += f'<text x="{W / 2}" y="24" text-anchor="middle" class="hl">Six stations round the walls, numbered clockwise. The middle stays clear.</text>'
    else:
        s += f'<rect x="60" y="34" width="{W - 120}" height="30" rx="5" class="hstage"/><text x="{W / 2}" y="54" text-anchor="middle" class="hn">Stage end</text>'
        for i, (c, n) in enumerate(zip('YOG', ['Yellow', 'Orange', 'Green'])):
            x = 130 + i * 170
            s += f'<rect x="{x - 62}" y="84" width="124" height="70" rx="6" class="ht {c}"/><text x="{x}" y="124" text-anchor="middle" class="hn">{n}</text>'
        s += f'<text x="{W / 2}" y="24" text-anchor="middle" class="hl">Tables to the walls, chairs in three team blocks</text>'
    return s + '</svg>'


def kit_list(s):
    rows = ''
    for item, qty, code, bin_ in s.get('kit', []):
        src = ''
        if code and code not in ('',):
            src = f'<span class="code">{e(code)}</span>'
        b = f'<span class="bin">{"bin " + e(bin_) if bin_.isdigit() else e(bin_)}</span>' if bin_ and bin_ != '—' else ''
        rows += f'<li><span class="q">{e(qty)}</span><span class="it">{e(item)}</span>{src}{b}</li>'
    return f'<ul class="kit">{rows}</ul>'


def when_of(s):
    if s.get('turn'):
        return f'{s["turn"]}-minute turn'
    if s.get('start'):
        return f'{s["start"]}–{s["end"]}'
    return 'Every day'


def sheet(s, n=None):
    dc = DAYCLASS[s['day']]
    facts = [('Where', s['where']), ('Who', s['who']), ('Led by', s['lead']), ('Scores', s['score'])]
    if s.get('replaces'):
        facts.insert(0, ('Replaces', s['replaces']))
    if s.get('turns'):
        facts.insert(0, ('Turns', s['turns']))
    length = f' · {dur(s["start"], s["end"])} minutes' if s.get('start') else ''
    h = f'<section class="sheet {dc}" id="{s["id"]}"><header class="sh"><div class="when"><span class="day">{e(s["day"])}</span><span class="time">{e(when_of(s))}{length}</span></div><h2>{e(s["title"])}</h2>'
    h += '<dl class="facts">' + ''.join(f'<div><dt>{e(k)}</dt><dd>{chip(v)}</dd></div>' for k, v in facts) + '</dl></header>'
    h += f'<p class="idea">{e(s["idea"])}</p>'
    if s.get('map'):
        h += f'<figure class="mapfig"><div class="ms">{sheet_maps.ALL[s["map"]]()}</div><figcaption>{e(s["mapcap"])}</figcaption></figure>'
    if s.get('hall'):
        h += f'<figure class="mapfig hallfig">{hall_svg(s["hall"])}<figcaption>A sketch of the Hall set-up, not to scale.</figcaption></figure>'
    pre = ''
    if s.get('setup'):
        pre += '<div class="blk"><h3>Set up</h3><table class="setup">' + ''.join(f'<tr><td class="t">{e(w)}</td><td><b>{e(who)}.</b> {chip(what)}</td></tr>' for w, who, what in s['setup']) + '</table></div>'
    if s.get('say'):
        pre += '<div class="blk say"><h3>Tell the campers</h3><ul>' + ''.join(f'<li>{e(x)}</li>' for x in s['say']) + '</ul></div>'
    if pre:
        h += f'<div class="flow">{pre}</div>'
    if s.get('run'):
        unit = ' min' if s.get('turn') else ''
        rows = ''.join(f'<tr><td class="t">{e(a)}–{e(b)}{unit}</td><td>{chip(w)}</td></tr>' for a, b, w in s['run'])
        h += f'<div class="blk"><h3>Minute by minute</h3><table class="run">{rows}</table></div>'
    for b in s.get('blocks', []):
        h += block(b)
    if s.get('map2'):
        h += f'<figure class="mapfig"><div class="ms">{sheet_maps.ALL[s["map2"]]()}</div><figcaption>{e(s["map2cap"])}</figcaption></figure>'
    bottom = ''
    if s.get('roles'):
        bottom += '<div class="blk"><h3>Who does what</h3><table class="roles">' + ''.join(f'<tr><td class="t">{e(w)}</td><td>{chip(d)}</td></tr>' for w, d in s['roles']) + '</table></div>'
    sc = ''
    if s.get('scoring'):
        sc = '<div class="blk"><h3>Scoring</h3><ul>' + ''.join(f'<li>{chip(x)}</li>' for x in s['scoring']) + '</ul></div>'
    elif 'scoring' in s:
        sc = '<div class="blk"><h3>Scoring</h3><p>Not scored.</p></div>'
    if bottom or sc:
        h += f'<div class="flow">{bottom}{sc}</div>'
    if s.get('kit'):
        h += f'<div class="blk"><h3>Equipment</h3>{kit_list(s)}</div>'
    tail = ''
    if s.get('rain'):
        tail += f'<div class="rainbox"><b>If it rains.</b> {e(s["rain"])}</div>'
    if s.get('watch'):
        tail += '<div class="watch"><b>Keep an eye on.</b><ul>' + ''.join(f'<li>{e(x)}</li>' for x in s['watch']) + '</ul></div>'
    if tail:
        h += f'<div class="two tail">{tail}</div>'
    return h + '</section>'


def day_tables():
    out = ''
    for (title, sub, rows), dc in zip(front.DAYS, ['thu', 'fri', 'sat', 'sun']):
        trs = ''
        for when, what, where, sid in rows:
            link = f'<a href="#{sid}">{e(what)}</a>' if sid else e(what)
            if sid in PAGES:
                link += f' <span class="pg">p. {PAGES[sid]}</span>'
            bins = ''
            if sid and sid in BY_ID:
                ids = [sid] + ({'lake1': ['kayak', 'banner', 'cornhole'], 'lake2': ['kayakrelay', 'bracelets', 'bubbles']}.get(sid, []))
                bs = sorted({b for i in ids for _, _, _, b in BY_ID[i].get('kit', []) if b.isdigit()}, key=int)
                bins = ', '.join(bs)
            trs += f'<tr class="{"act" if sid else ""}"><td class="t">{e(when)}</td><td>{link}</td><td>{e(where)}</td><td class="b">{e(bins)}</td></tr>'
        out += f'<div class="daytable {dc}"><h3><span>{e(title)}</span> {e(sub)}</h3><div class="tw"><table class="t"><thead><tr><th>Time</th><th>What</th><th>Where</th><th>Bins</th></tr></thead><tbody>{trs}</tbody></table></div></div>'
    return out


def master_kit():
    use = {}
    order = []
    for s in SHEETS + RAIN + [front.ROUTINE]:
        for item, qty, code, bin_ in s.get('kit', []):
            for c in [x.strip() for x in code.split(',')]:
                if c in ITEMS:
                    if c not in use:
                        use[c] = {'bin': bin_, 'acts': []}
                        order.append(c)
                    short = s['title'].split(':')[0].replace('R1 · ', '').replace('R2 · ', '').replace('R3 · ', '').replace('R4 · ', '')
                    if short not in use[c]['acts']:
                        use[c]['acts'].append(short)
    def key(c):
        b = use[c]['bin']
        return (int(b) if b.isdigit() else 99, b, c)
    rows = ''
    for c in sorted(order, key=key):
        it = ITEMS[c]
        b = use[c]['bin']
        rows += f'<tr><td class="b">{"bin " + b if b.isdigit() else e(b)}</td><td class="code">{e(c)}</td><td>{it["item"]}</td><td>{e(str(it["qty"]))}</td><td class="acts">{e("; ".join(use[c]["acts"]))}</td></tr>'
    unused = [c for c in ITEMS if c not in use]
    return rows, unused


CSS_COMMON = r'''
/* layout: an A4 field manual. One sheet per activity, map first, then two columns of working detail. */
:root{--bg:#eef2f1;--paper:#ffffff;--ink:#14212b;--muted:#566570;--line:#d3dcdf;--soft:#eef4f2;--accent:#0f6e63;--warn:#fff3d6;--warnl:#d9a93a;--rain:#e7eff9;--rainl:#7fa3cf;
--thu:#0e7c86;--fri:#c8641a;--sat:#2f8a52;--sun:#3d4d9c;--rainc:#4a6889;--any:#14324a;--Y:#f5c400;--O:#f08a24;--G:#2fa860;
--body:'Inter','Noto Sans','Helvetica Neue',Arial,sans-serif;--head:'Space Grotesk','Inter Display','Inter',Arial,sans-serif}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--body);font-size:15px;line-height:1.45}
h1,h2,h3{font-family:var(--head);text-wrap:balance;margin:0}
a{color:inherit}
.wrap{max-width:980px;margin:0 auto}
.sheet,.front{background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:18px 20px;margin:0 0 18px}
.sheet{--dc:var(--any)}.sheet.thu{--dc:var(--thu)}.sheet.fri{--dc:var(--fri)}.sheet.sat{--dc:var(--sat)}.sheet.sun{--dc:var(--sun)}.sheet.rain{--dc:var(--rainc)}
.sh{border-top:5px solid var(--dc);margin:-18px -20px 10px;padding:12px 20px 0;border-radius:10px 10px 0 0}
.when{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap;font-family:var(--head);font-weight:700;color:var(--dc);font-size:.9em;letter-spacing:.02em}
.when .day{text-transform:uppercase;letter-spacing:.08em}
.when .time{font-variant-numeric:tabular-nums}
.sh h2{font-size:1.55em;line-height:1.15;margin:2px 0 8px}
.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:6px 14px;margin:0;padding:8px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.facts div{min-width:0}.facts dt{font-size:.72em;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:700}.facts dd{margin:0;font-size:.92em}
.idea{font-size:1.02em;margin:10px 0}
.mapfig{margin:10px 0}.mapfig svg{display:block;width:100%;height:auto;border-radius:8px;border:1px solid var(--line)}
.mapfig svg text{font-family:'Inter','Noto Sans',Arial,sans-serif}
.mapfig figcaption{font-size:.84em;color:var(--muted);margin-top:4px}
.two{display:grid;grid-template-columns:1fr 1fr;gap:4px 22px}.two>div{min-width:0}
.flow{columns:2;column-gap:24px}.flow .blk{break-inside:avoid;margin-top:0;padding-top:10px}
.blk{margin:10px 0}.blk h3{font-size:.8em;text-transform:uppercase;letter-spacing:.09em;color:var(--dc,var(--accent));margin-bottom:4px}
.blk ul{margin:0;padding-left:1.1em}.blk li{margin:2px 0}.blk p{margin:0}
table{border-collapse:collapse;width:100%}td,th{vertical-align:top;text-align:left;padding:3px 8px 3px 0}
table.run td,table.setup td,table.roles td{border-top:1px solid var(--line);padding:4px 8px 4px 0}
td.t{white-space:nowrap;font-weight:700;font-variant-numeric:tabular-nums;width:1%;padding-right:12px}
table.roles td.t{white-space:normal;width:26%}
table.setup td.t{color:var(--muted)}
.say{background:var(--soft);border-radius:8px;padding:8px 12px}.say li{font-style:italic}
.tw{overflow-x:auto}
table.t{font-size:.93em}table.t th{font-size:.78em;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:2px solid var(--line);padding:4px 10px 4px 0}
table.t td{border-bottom:1px solid var(--line);padding:4px 10px 4px 0}table.t.narrow td,table.t.narrow th{text-align:center;padding:4px 4px}table.t.narrow td:first-child,table.t.narrow th:first-child{text-align:left}
table.t td:first-child{font-weight:600}
.sq,.tm{display:inline-block;font-weight:800;font-size:.86em;border-radius:5px;padding:0 5px;color:#14212b;line-height:1.5}
.sq.Y,.tm.Y{background:var(--Y)}.sq.O,.tm.O{background:var(--O)}.sq.G,.tm.G{background:var(--G);color:#fff}
.cards{display:grid;gap:8px}.cards.n3{grid-template-columns:repeat(3,1fr)}.cards.n2{grid-template-columns:repeat(2,1fr)}
.card{border:1px solid var(--line);border-radius:8px;padding:8px 10px;min-width:0;break-inside:avoid}
.ch{display:flex;gap:8px;align-items:flex-start;margin-bottom:4px}.ch b{display:block;font-family:var(--head);line-height:1.2}.ch .sub{display:block;font-size:.8em;color:var(--muted)}
.tag{flex:none;min-width:26px;height:26px;border-radius:13px;background:var(--dc,var(--accent));color:#fff;font-weight:800;font-size:.85em;display:grid;place-items:center;padding:0 6px}
.card p{margin:0;font-size:.93em}
.note{background:var(--soft);border-left:4px solid var(--dc,var(--accent));border-radius:0 8px 8px 0;padding:7px 12px}
.kit{list-style:none;margin:0;padding:0;columns:2;column-gap:22px}.kit li{break-inside:avoid;display:flex;gap:6px;align-items:baseline;border-top:1px solid var(--line);padding:3px 0;font-size:.93em}
.kit .q{flex:none;min-width:3.2em;font-weight:700;font-variant-numeric:tabular-nums}.kit .it{flex:1;min-width:0}
.code,.bin{flex:none;font-size:.74em;border-radius:4px;padding:0 5px;white-space:nowrap;font-variant-numeric:tabular-nums}
.code{color:var(--muted);border:1px solid var(--line)}.bin{background:var(--ink);color:var(--paper);font-weight:700}
.tail{margin-top:8px}.rainbox,.watch{border-radius:8px;padding:8px 12px;font-size:.93em;min-width:0}
.rainbox{background:var(--rain);border:1px solid var(--rainl)}.watch{background:var(--warn);border:1px solid var(--warnl)}.watch ul{margin:2px 0 0;padding-left:1.1em}
.hall{background:var(--soft)}.hall .hw{fill:none;stroke:var(--muted);stroke-width:2}.hall .hd{fill:var(--muted)}.hall .hl{font-size:12px;fill:var(--muted);font-weight:600}
.hall .ht{stroke:#14212b;stroke-opacity:.35}.hall .ht.Y{fill:#f5c400}.hall .ht.O{fill:#f08a24}.hall .ht.G{fill:#2fa860}.hall .hn{font-size:14px;font-weight:800;fill:#14212b}
.hall .hs{fill:#14324a}.hall .hsn{font-size:15px;font-weight:800;fill:#fff}.hall .hp{stroke:#14324a;stroke-width:2;stroke-dasharray:3 5}.hall .hstage{fill:#c9d6de;stroke:#14212b;stroke-opacity:.35}
.cover{background:var(--any);color:#fff;border-radius:10px;padding:26px 24px 18px;margin-bottom:18px}
.cover .eyebrow{font-family:var(--head);text-transform:uppercase;letter-spacing:.14em;font-size:.8em;opacity:.85}
.cover h1{font-size:2.3em;line-height:1.05;margin:6px 0 8px}.cover p{margin:4px 0;max-width:62ch;opacity:.95}
.cover .meta{display:flex;gap:6px 18px;flex-wrap:wrap;margin-top:12px;font-size:.9em;opacity:.9}
.front h2{font-size:1.4em;margin-bottom:8px}.front h3{font-size:.8em;text-transform:uppercase;letter-spacing:.09em;color:var(--accent);margin:12px 0 4px}
.front p{margin:6px 0;max-width:75ch}
.key{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:4px 14px;list-style:none;margin:8px 0 0;padding:0;font-size:.92em}
.key li{display:flex;gap:6px;align-items:center}.key .n{flex:none;width:22px;height:22px;border-radius:11px;background:#14324a;color:#fff;font-size:.74em;font-weight:800;display:grid;place-items:center}
.key .n.hq{background:#d8392b}.key .n.v{background:#0e8f8a}.key .dot{flex:none;width:12px;height:12px;border-radius:6px;border:2px solid #fff;box-shadow:0 0 0 1px var(--line)}
.daytable{margin:12px 0}.daytable h3{font-size:1em;text-transform:none;letter-spacing:0;color:var(--ink);border-left:6px solid var(--dc);padding-left:8px}.daytable h3 span{font-weight:800}
.daytable.thu{--dc:var(--thu)}.daytable.fri{--dc:var(--fri)}.daytable.sat{--dc:var(--sat)}.daytable.sun{--dc:var(--sun)}
.daytable tr.act td{background:var(--soft)}.daytable td.b{white-space:nowrap;color:var(--muted);font-variant-numeric:tabular-nums}.daytable a{font-weight:700;text-decoration-color:var(--dc)}
.toc{columns:2;column-gap:26px;font-size:.95em;padding:0;margin:6px 0 0;list-style:none}.toc li{break-inside:avoid;padding:2px 0;display:flex;gap:8px}.toc .w{flex:none;width:7.2em;color:var(--muted);font-variant-numeric:tabular-nums;font-size:.9em}
.toc .d{font-family:var(--head);font-weight:800;margin-top:8px;display:block}
.toc a{flex:1;min-width:0}.pg{flex:none;color:var(--muted);font-variant-numeric:tabular-nums;font-size:.9em}
.divider{font-family:var(--head);border-radius:10px;padding:16px 20px;margin:0 0 18px;color:#fff;background:var(--dc)}
.divider.thu{--dc:var(--thu)}.divider.fri{--dc:var(--fri)}.divider.sat{--dc:var(--sat)}.divider.sun{--dc:var(--sun)}.divider.rain{--dc:var(--rainc)}
.divider h2{font-size:1.5em}.divider p{margin:2px 0 0;opacity:.92;font-family:var(--body)}
table.kitall td{border-bottom:1px solid var(--line);font-size:.9em;padding:3px 8px 3px 0}table.kitall td.b{white-space:nowrap;font-weight:700}table.kitall td.code{border:0;color:var(--muted)}table.kitall td.acts{color:var(--muted)}
.dl2{display:grid;grid-template-columns:minmax(120px,22%) 1fr;gap:0 14px;margin:0}.dl2 dt{font-weight:700;border-top:1px solid var(--line);padding:4px 0}.dl2 dd{margin:0;border-top:1px solid var(--line);padding:4px 0}
'''

CSS_WEB = r'''
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#0e1417;--paper:#162027;--ink:#e6edf0;--muted:#9db0b9;--line:#2a3a43;--soft:#1c2a31;--accent:#4cc3b3;--warn:#3a2e12;--warnl:#8a6b1e;--rain:#182838;--rainl:#3c5f86;--thu:#35b3bd;--fri:#f0933f;--sat:#55bd7f;--sun:#8795ea;--rainc:#86a8cf;--any:#1b3f5c;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#0e1417;--paper:#162027;--ink:#e6edf0;--muted:#9db0b9;--line:#2a3a43;--soft:#1c2a31;--accent:#4cc3b3;--warn:#3a2e12;--warnl:#8a6b1e;--rain:#182838;--rainl:#3c5f86;--thu:#35b3bd;--fri:#f0933f;--sat:#55bd7f;--sun:#8795ea;--rainc:#86a8cf;--any:#1b3f5c;color-scheme:dark}
body{padding-block:18px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
.bin{background:#14324a;color:#fff}
.jump{position:sticky;top:env(safe-area-inset-top,0px);z-index:5;background:var(--bg);padding:8px 0;margin-bottom:8px;display:flex;gap:6px;flex-wrap:wrap;font-family:var(--head);font-size:.9em}
.jump a{text-decoration:none;font-weight:700;border-radius:999px;padding:4px 12px;background:var(--paper);border:1px solid var(--line)}
.jump a:focus-visible,.toc a:focus-visible,.daytable a:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:10;background:var(--bg)}
.sheet,.front,.divider{scroll-margin-top:60px}
.flow .blk:first-child{padding-top:10px}
@media (max-width:760px){.ms{overflow-x:auto;border-radius:8px}.ms svg{width:700px;max-width:none}.mapfig figcaption::after{content:' Swipe the map sideways to see all of it.'}.flow{columns:1}.two,.cards.n3,.cards.n2{grid-template-columns:1fr}.kit,.toc{columns:1}.cover h1{font-size:1.7em}.sheet,.front{padding:14px 14px}.sh{margin:-14px -14px 10px;padding:12px 14px 0}.dl2{grid-template-columns:1fr}.dl2 dd{border-top:0;padding-top:0}}
'''

CSS_PRINT = r'''
@page{size:A4;margin:11mm 11mm 13mm}
@page wide{size:A4 landscape;margin:10mm}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{background:#fff;font-size:9.1pt;line-height:1.36}
.wrap{max-width:none}
.sheet,.front{border:0;border-radius:0;padding:0;margin:0;break-before:page}
.sh{margin:0 0 6px;padding:6px 0 0;border-radius:0}
.cover{border-radius:6px;break-after:avoid}
.divider{break-before:page;break-after:avoid;border-radius:6px;margin-bottom:8px}
.divider + .sheet,.cover + .front,#contents{break-before:avoid}
#contents{margin-top:14px}
.card,.note,.rainbox,.watch,.mapfig,tr,li,.say{break-inside:avoid}
.sheet .mapfig svg{max-height:98mm}
h2,h3{break-after:avoid}
.mapfig svg{border-radius:4px}
.jump{display:none}
.widepage{page:wide;break-before:page}.widepage .mapfig svg{max-height:none}
.toc{font-size:9pt}
a{text-decoration:none}
'''


def build(kind):
    src = '__MAPSRC__'
    key = ''.join(f'<li><span class="n{" v" if n == 8 else ""}">{n}</span>{e(name)}</li>' for n, name, _ in sheet_maps.SITE_KEY)
    key = '<li><span class="n hq">HQ</span>HQ Palms</li>' + key + '<li><span class="dot" style="background:#0e8f8a"></span>Camper vans</li><li><span class="dot" style="background:#7a4fb5"></span>Counselor vans</li>'
    toc = ''
    for day, group in [('Thursday', thu.SHEETS), ('Friday', fri.SHEETS), ('Saturday', sat.SHEETS), ('Sunday', sun.SHEETS), ('Rain plan', sun.RAIN)]:
        toc += f'<li><span class="d">{day}</span></li>'
        for s in group:
            pg = f'<span class="pg">{PAGES[s["id"]]}</span>' if s["id"] in PAGES else ''
            toc += f'<li><span class="w">{e(when_of(s))}</span><a href="#{s["id"]}">{e(s["title"])}</a>{pg}</li>'
    kit_rows, unused = master_kit()
    body = f'''<div class="wrap">
<header class="cover"><div class="eyebrow">Camp WOW · World of Outdoor Wonders · Winter camp 2027</div>
<h1>The Activity Plan and Counselor Pack</h1>
<p>Every activity of the four days: where it happens, how it runs minute by minute, who does what, and the kit it needs.</p>
<div class="meta"><span>Thursday 28 to Sunday 31 January 2027</span><span>Bambi Glamping, Sanwan, Miaoli</span><span>30 campers aged 10 to 14 · three teams of ten</span><span>Genesis Youth Adventures × Bambi Glamping</span></div></header>
__JUMP__
<section class="front" id="camp-map"><h2>The camp on one map</h2>
{''.join(f'<p>{e(p)}</p>' for p in front.INTRO)}
<figure class="mapfig"><div class="ms">{sheet_maps.site()}</div><figcaption>Looking north across Bambi Glamping. The camp has the whole site to itself. The two yellow areas are the Big Lawn, where most of the programme happens.</figcaption></figure>
<ul class="key">{key}</ul>
<h3>The places, by the names used in this pack</h3>
<dl class="dl2">{''.join(f'<dt>{e(n)}</dt><dd>{e(t)}</dd>' for _, n, t in front.PLACES)}</dl>
</section>
<section class="front" id="contents"><h2>Contents</h2><ul class="toc">{toc}</ul></section>
<section class="front" id="people"><h2>Teams, squads and who does what</h2>
{''.join(f'<p>{chip(p)}</p>' for p in front.TEAMS)}
<h3>The ten adults</h3><dl class="dl2">{''.join(f'<dt>{e(n)}</dt><dd>{e(t)}</dd>' for n, t in front.STAFF)}</dl>
<p>{e(front.RADIOS)}</p>
<h3>Camp basics</h3><dl class="dl2">{''.join(f'<dt>{e(n)}</dt><dd>{e(t)}</dd>' for n, t in front.BASICS)}</dl>
</section>
<section class="front" id="scoring"><h2>Color War: how every point is scored</h2>
<div class="tw"><table class="t"><thead><tr><th>Kind of game</th><th>Points</th><th>How</th></tr></thead><tbody>{''.join(f'<tr><td>{e(a)}</td><td>{e(b)}</td><td>{e(c)}</td></tr>' for a, b, c in front.SCORING_RULES)}</tbody></table></div>
<h3>Everything that scores</h3>
<div class="tw"><table class="t"><thead><tr><th>Day</th><th>Activity</th><th>Ranked by</th><th>Points</th></tr></thead><tbody>{''.join(f'<tr><td>{e(a)}</td><td>{e(b)}</td><td>{e(c)}</td><td>{e(d)}</td></tr>' for a, b, c, d in front.SCORED)}</tbody></table></div>
<h3>The board</h3><ul>{''.join(f'<li>{e(x)}</li>' for x in front.BOARD)}</ul>
</section>
<section class="front" id="days"><h2>The four days at a glance</h2><p>Shaded rows have their own sheet. The bins column shows which numbered kit bins the activity uses.</p>{day_tables()}</section>
{sheet(front.ROUTINE)}
'''
    for day, sub, group, dc in [('Thursday 28 January', 'Arrival, the lake and the opening fire', thu.SHEETS, 'thu'), ('Friday 29 January', 'Explorers’ day', fri.SHEETS, 'fri'),
                                ('Saturday 30 January', 'Games and makers’ day, and the final night', sat.SHEETS, 'sat'), ('Sunday 31 January', 'The finale and home', sun.SHEETS, 'sun')]:
        body += f'<div class="divider {dc}" id="{dc}"><h2>{e(day)}</h2><p>{e(sub)}</p></div>'
        body += ''.join(sheet(s) for s in group)
    body += '<div class="divider rain" id="rain"><h2>The rain plan</h2><p>Every wet-weather activity is in the Hall. The Director makes the weather call before breakfast, at 12:45, and before any evening activity outdoors.</p></div>'
    body += ''.join(sheet(s) for s in sun.RAIN)
    body += f'''<section class="front" id="kit"><h2>All the equipment, by bin</h2><p>Every item below is on the shopping list in the working plan, with the same code. The last column shows which activities use it.</p>
<div class="tw"><table class="kitall"><thead><tr><th>Where</th><th>Code</th><th>Item</th><th>Buy</th><th>Used in</th></tr></thead><tbody>{kit_rows}</tbody></table></div>
<h3>Lent by Bambi</h3><p>Kayaks, paddles, life jackets, a throw line and a turn buoy; the eco-tram; firewood; the Star Cinema screen, projector and sound; a hot-water urn; one folding table; an outside tap.</p>
</section>
<section class="front" id="before-camp"><h2>Before camp</h2>
<h3>To print and prepare</h3><dl class="dl2">{''.join(f'<dt>{e(n)}</dt><dd>{e(t)}</dd>' for n, t in front.PRINT)}</dl>
<h3>To settle with Bambi</h3><ul>{''.join(f'<li>{e(x)}</li>' for x in front.ASK_BAMBI)}</ul>
<h3>What this plan fixes, so that you can change it</h3><p>The working plan left these open. They are now decided, and each one can be changed without touching the rest.</p>
<dl class="dl2">{''.join(f'<dt>{e(n)}</dt><dd>{e(t)}</dd>' for n, t in front.DECIDED)}</dl>
</section>
<section class="front widepage" id="camper-map"><h2>The camper map</h2><p>Print six at A3 and laminate them. The numbers are the ten orienteering controls. The same map serves the Amazing Race.</p>
<figure class="mapfig"><div class="ms">{sheet_maps.orienteering("camper")}</div></figure></section>
</div>'''
    defs = maps.DEFS
    fonts = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Space+Grotesk:wght@600;700&display=swap">'
    if kind == 'web':
        jump = '<nav class="jump" aria-label="Jump to"><a href="#camp-map">Map</a><a href="#days">Timetable</a><a href="#thu">Thursday</a><a href="#fri">Friday</a><a href="#sat">Saturday</a><a href="#sun">Sunday</a><a href="#rain">Rain plan</a><a href="#kit">Equipment</a></nav>'
        return ('<title>Camp WOW Counselor Pack</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n' + fonts + '\n<style>' + CSS_COMMON + CSS_WEB + '</style>\n'
                + defs.replace(src, 'camp-map.jpg') + body.replace('__JUMP__', jump))
    return ('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Camp WOW: the Activity Plan and Counselor Pack</title>' + fonts + '<style>' + CSS_COMMON + CSS_PRINT + '</style></head><body>'
            + defs.replace(src, 'camp-wow-map.jpg') + body.replace('__JUMP__', '') + '</body></html>')


if __name__ == '__main__':
    check()
    os.makedirs(HERE + '/out', exist_ok=True)
    if not os.path.exists(HERE + '/out/camp-map.jpg'):
        # the web page uses a lighter copy of the camp picture
        from PIL import Image
        Image.open(DOCS + '/camp-wow-map.jpg').resize((3600, 2272), Image.LANCZOS).save(HERE + '/out/camp-map.jpg', quality=80, optimize=True, progressive=True)
    for kind in ('print', 'web'):
        maps.PROBLEMS.clear()
        PAGES.clear()
        if kind == 'print' and os.path.exists(HERE + '/out/pages.json'):
            PAGES.update(json.load(open(HERE + '/out/pages.json')))
        dest = f'{DOCS}/camp-wow-counselor-pack.html' if kind == 'print' else f'{HERE}/out/pack-web.html'
        open(dest, 'w', encoding='utf-8').write(build(kind))
    PROBLEMS.extend(sorted(set(maps.PROBLEMS)))
    _, unused = master_kit()
    json.dump({'sheets': len(SHEETS), 'rain': len(RAIN), 'problems': PROBLEMS, 'unused_shop_items': unused}, open(HERE + '/out/summary.json', 'w'), indent=1, ensure_ascii=False)
    print('sheets', len(SHEETS), '+ rain', len(RAIN), '| problems', len(PROBLEMS))
    for p in PROBLEMS:
        print(' -', p)
    print('shop items not used on any sheet:', ', '.join(unused))
