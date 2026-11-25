"""Activity maps for the counselor pack, drawn on our 3D picture of the camp.

Positions are given in the traced map's own pixels (1200 x 800, 1 px = 0.4 m, north up), the same
ones the 3D model is built from, and a fitted camera turns them into places on the picture.
So a court that is 30 m long here is 30 m long on the lawn of the model.
"""
import json, math, os
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(HERE + '/../..')
L = json.load(open(ROOT + '/src/map/layout/campLayout.json'))
SPOTS = json.load(open(HERE + '/map-hi.json'))
IW, IH = 1800, 1136
M_PER_PX = 0.4


def _centroid(poly):
    a = cx = cy = 0
    n = len(poly)
    for i in range(n):
        x0, y0 = poly[i]
        x1, y1 = poly[(i + 1) % n]
        c = x0 * y1 - x1 * y0
        a += c
        cx += (x0 + x1) * c
        cy += (y0 + y1) * c
    a *= 0.5
    return [cx / (6 * a), cy / (6 * a)]


def _fit():
    P = L['pois']
    src = {'entrance': (P['entrance'], 3.2), 'checkin': (P['checkin'], 2.2), 'tram': (P['tramStop'], 2.0),
           'dining': (P['dining'], 3.6), 'restroom': ([582, 578], 2.2), 'pool': (_centroid(L['lakes']['pool']), 1.6),
           'snack': (P['airstreamSpot'], 2.6), 'campfire': (P['campfire'], 1.9), 'cinema': (P['cinema'], 3.0),
           'birds': (P['wildLakeLabel'], 1.8), 'kayak': (P['kayakLabel'], 1.8)}
    for z, p in P['zoneLabels'].items():
        src['zone-' + z] = (p, 1.9)
    A = []
    for s in SPOTS['spots']:
        if s['id'] not in src:
            continue
        (mx, my), h = src[s['id']]
        X, Y, Z = (mx - 600) * 0.1, h, (my - 400) * 0.1
        u, v = s['x'] * IW, s['y'] * IH
        A.append([X, Y, Z, 1, 0, 0, 0, 0, -u * X, -u * Y, -u * Z, -u])
        A.append([0, 0, 0, 0, X, Y, Z, 1, -v * X, -v * Y, -v * Z, -v])
    _, _, Vt = np.linalg.svd(np.array(A))
    return Vt[-1].reshape(3, 4)


_M = _fit()


def P(mx, my, h=0.0):
    """Map px -> picture units (1800 x 1136)."""
    u, v, w = _M @ np.array([(mx - 600) * 0.1, h, (my - 400) * 0.1, 1.0])
    return (u / w, v / w)


def m(metres):
    return metres / M_PER_PX


# ---------------------------------------------------------------- named places (map px)
PLACES = {
    'hq': (686, 399), 'north_lawn': (705, 337), 'south_lawn': (708, 478), 'van_village': (812, 300),
    'cinema_lawn': (622, 352), 'campfire': (629, 381), 'airstream': (621, 433), 'pool': (616, 482),
    'dock': (977, 318), 'dock_gate': (922, 291), 'hall': (406, 580), 'reception': (712, 568),
    'tram': (800, 553), 'restrooms': (582, 578), 'gate': (895, 558), 'bird_lookout': (508, 398),
    'kayak_lake': (925, 410), 'bird_lake': (370, 370),
}
OUR_CAMPER_VANS = ['B06', 'B07', 'B08', 'B09', 'B10', 'B11', 'A10', 'A11', 'A12', 'A13', 'A14']
OUR_STAFF_VANS = ['B05', 'B12', 'A08', 'A06']
VAN = {v['id']: (v['x'], v['y']) for v in L['vans']}

# ---------------------------------------------------------------- colours
C = {'navy': '#14324a', 'ink': '#0f2233', 'yellow': '#f5c400', 'orange': '#f08a24', 'green': '#2fa860',
     'red': '#d8392b', 'blue': '#2b7fc4', 'white': '#ffffff', 'teal': '#0e8f8a', 'purple': '#7a4fb5', 'pink': '#e0457b'}


def _pts(poly):
    return ' '.join(f'{x:.1f},{y:.1f}' for x, y in poly)


def rect(cx, cy, w_m, h_m, rot=0.0):
    """A rectangle on the ground: centre in map px, size in metres (w east-west, h north-south)."""
    w, h = m(w_m) / 2, m(h_m) / 2
    c, s = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    return [(cx + x * c - y * s, cy + x * s + y * c) for x, y in ((-w, -h), (w, -h), (w, h), (-w, h))]


def circle(cx, cy, r_m, n=28):
    r = m(r_m)
    return [(cx + r * math.cos(2 * math.pi * i / n), cy + r * math.sin(2 * math.pi * i / n)) for i in range(n)]


VIEWS = {
    # name: (left, top, width, height) in picture units (1800 x 1136)
    'site': (95, 300, 1500, 600),
    'east': (800, 318, 800, 480),
    'lawn': (862, 368, 420, 330),
    'lawnwide': (800, 350, 560, 372),
    'lake': (1040, 330, 560, 372),
    'south': (860, 500, 480, 300),
    'west': (95, 330, 900, 520),
}


class Map:
    """Shapes drawn on one view of the picture. Sizes are in 'page' units: the same on every map.

    Labels are placed last. Each one tries its preferred side first and then the other sides and
    larger gaps, and takes the first place where it covers no pin and no other label. A label that
    still cannot be placed cleanly is listed in .problems, and the build prints it.
    """

    def __init__(self, view='lawn', title=''):
        self.view = VIEWS[view] if isinstance(view, str) else view
        self.title = title
        self.k = self.view[2] / 600.0
        self.under, self.over = [], []
        self.pins, self.labels, self.problems = [], [], []

    # --- shapes
    def zone(self, poly, color='yellow', label=None, fill=0.28, dash=None, lw=2.2, label_at=None, size=12.5):
        pp = [P(*p) for p in poly]
        col = C.get(color, color)
        k = self.k
        d = f' stroke-dasharray="{" ".join(str(float(v) * k) for v in dash.split())}"' if dash else ''
        self.under.append(f'<polygon points="{_pts(pp)}" fill="{col}" fill-opacity="{fill}" stroke="{col}" stroke-width="{lw * k:.2f}" stroke-linejoin="round"{d}/>')
        if label:
            if label_at:
                cx, cy = P(*label_at)
            else:
                cx = sum(x for x, _ in pp) / len(pp)
                cy = sum(y for _, y in pp) / len(pp)
            self._label(cx, cy, label, 'c', 0, size)
        return self

    def line(self, pts, color='red', lw=3, dash='7 5', arrow=False, halo=True):
        pp = [P(*p) for p in pts]
        col = C.get(color, color)
        k = self.k
        d = f' stroke-dasharray="{" ".join(str(float(v) * k) for v in dash.split())}"' if dash else ''
        mk = ' marker-end="url(#arr-%s)"' % color if arrow else ''
        if halo:
            self.under.append(f'<polyline points="{_pts(pp)}" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="{(lw + 2.6) * k:.2f}" stroke-linecap="round" stroke-linejoin="round"/>')
        self.under.append(f'<polyline points="{_pts(pp)}" fill="none" stroke="{col}" stroke-width="{lw * k:.2f}" stroke-linecap="round" stroke-linejoin="round"{d}{mk}/>')
        return self

    def pin(self, at, n, label=None, color='navy', side='r', r=10.5, size=12, text_color=None):
        x, y = P(*at)
        k = self.k
        col = C.get(color, color)
        tc = text_color or ('#14324a' if color in ('yellow', 'white') else '#fff')
        n = str(n)
        fs = r * (1.15 if len(n) < 2 else 0.95 if len(n) < 3 else 0.74) * k
        self.pins.append((x, y, r * k, n,
                          f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r * k:.2f}" fill="{col}" stroke="#fff" stroke-width="{2.2 * k:.2f}"/>'
                          f'<text x="{x:.1f}" y="{y + fs * 0.36:.1f}" text-anchor="middle" font-size="{fs:.2f}" font-weight="800" fill="{tc}">{n}</text>'))
        if label:
            self._label(x, y, label, side, r + 4, size, pinned=True)
        return self

    def text(self, at, label, side='c', size=12, weight=700, color=None):
        x, y = P(*at)
        self._label(x, y, label, side, 0, size, weight, color)
        return self

    def dot(self, at, color='red', r=4):
        x, y = P(*at)
        self.over.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r * self.k:.2f}" fill="{C.get(color, color)}" stroke="#fff" stroke-width="{1.4 * self.k:.2f}"/>')
        return self

    def _label(self, x, y, label, side, off, size, weight=700, color=None, pinned=False):
        self.labels.append(dict(x=x, y=y, label=label, side=side, off=off, size=size, weight=weight, color=color, pinned=pinned))

    def _box(self, lab, side, extra):
        k = self.k
        size, off = lab['size'] * k, (lab['off'] + extra) * k
        lines = lab['label'].split('\n')
        w = max(len(s) for s in lines) * size * 0.57 + 10 * k
        h = len(lines) * size * 1.18 + 5 * k
        x, y = lab['x'], lab['y']
        if side == 'r':
            bx, by = x + off, y - h / 2
        elif side == 'l':
            bx, by = x - off - w, y - h / 2
        elif side == 't':
            bx, by = x - w / 2, y - off - h
        elif side == 'b':
            bx, by = x - w / 2, y + off
        elif side == 'tr':
            bx, by = x + off * 0.75, y - off * 0.75 - h
        elif side == 'tl':
            bx, by = x - off * 0.75 - w, y - off * 0.75 - h
        elif side == 'br':
            bx, by = x + off * 0.75, y + off * 0.75
        elif side == 'bl':
            bx, by = x - off * 0.75 - w, y + off * 0.75
        else:
            bx, by = x - w / 2, y - h / 2
        vx, vy, vw, vh = self.view
        cx = max(vx + 3 * k, min(bx, vx + vw - w - 3 * k))
        cy = max(vy + 3 * k, min(by, vy + vh - h - 3 * k))
        return (cx, cy, cx + w, cy + h), (abs(cx - bx) + abs(cy - by) > 0.5)

    def _place(self):
        k = self.k
        vx, vy, vw, vh = self.view
        taken = [(x - r, y - r, x + r, y + r) for x, y, r, _, _ in self.pins]
        # a north arrow sits top right
        if getattr(self, '_north', False):
            taken.append((vx + vw - 35 * k, vy + 11 * k, vx + vw - 5 * k, vy + 41 * k))
        gap = 1.6 * k

        def hits(b):
            return sum(1 for t in taken if b[0] < t[2] + gap and b[2] > t[0] - gap and b[1] < t[3] + gap and b[3] > t[1] - gap)

        out = []
        order = sorted(range(len(self.labels)), key=lambda i: (not self.labels[i]['pinned'], i))
        boxes = {}
        for i in order:
            lab = self.labels[i]
            pref = lab['side']
            if pref == 'c':
                tries = [('c', 0)] + [(sd, e) for e in (8, 16, 28) for sd in ('b', 't', 'r', 'l')]
            else:
                rest = [sd for sd in ('r', 'l', 't', 'b', 'tr', 'br', 'tl', 'bl') if sd != pref]
                tries = [(pref, 0)] + [(sd, 0) for sd in rest] + [(sd, e) for e in (8, 18, 30, 46) for sd in [pref] + rest]
            best = None
            for sd, extra in tries:
                b, clamped = self._box(lab, sd, extra)
                n = hits(b)
                # a label pushed back inside the frame may land on its own pin: that counts as a hit above
                if n == 0:
                    best = (b, sd, extra)
                    break
            if best is None:
                b, _ = self._box(lab, pref, 0)
                best = (b, pref, 0)
                self.problems.append(f'label "{lab["label"]}" overlaps something')
            b, sd, extra = best
            taken.append(b)
            boxes[i] = (b, sd, extra)
        for i, lab in enumerate(self.labels):
            b, sd, extra = boxes[i]
            size = lab['size'] * k
            lines = lab['label'].split('\n')
            w, h = b[2] - b[0], b[3] - b[1]
            fill = lab['color'] or '#14324a'
            s = ''
            if lab['pinned'] and extra >= 18:
                # a leader from the pin to the label when the label had to move away
                px, py = lab['x'], lab['y']
                lx = min(max(px, b[0]), b[2])
                ly = min(max(py, b[1]), b[3])
                s += f'<line x1="{px:.1f}" y1="{py:.1f}" x2="{lx:.1f}" y2="{ly:.1f}" stroke="#14324a" stroke-width="{1.2 * k:.2f}"/>'
            s += f'<rect x="{b[0]:.1f}" y="{b[1]:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{4 * k:.1f}" fill="#fff" fill-opacity=".94" stroke="#14324a" stroke-opacity=".3" stroke-width="{0.8 * k:.2f}"/>'
            for j, t in enumerate(lines):
                s += f'<text x="{b[0] + w / 2:.1f}" y="{b[1] + 2 * k + size * (j * 1.18 + 0.95):.1f}" text-anchor="middle" font-size="{size:.2f}" font-weight="{lab["weight"]}" fill="{fill}">{t}</text>'
            out.append(s)
        # pins that sit on each other
        for a in range(len(self.pins)):
            for b2 in range(a + 1, len(self.pins)):
                xa, ya, ra, na, _ = self.pins[a]
                xb, yb, rb, nb, _ = self.pins[b2]
                if math.hypot(xa - xb, ya - yb) < (ra + rb) * 0.92:
                    self.problems.append(f'pins {na} and {nb} overlap')
        return out

    def vans(self, show_ids=False, others=False, r=5.2):
        k = self.k
        for vid, (x, y) in VAN.items():
            px, py = P(x, y, 0.8)
            if vid in OUR_CAMPER_VANS:
                col = C['teal']
            elif vid in OUR_STAFF_VANS:
                col = C['purple']
            elif others:
                col = '#8b97a3'
            else:
                continue
            self.over.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{r * k:.2f}" fill="{col}" stroke="#fff" stroke-width="{1.6 * k:.2f}"/>')
            if show_ids:
                self.over.append(f'<text x="{px:.1f}" y="{py - 8 * k:.1f}" text-anchor="middle" font-size="{8.5 * k:.2f}" font-weight="800" fill="#fff" stroke="#14324a" stroke-width="{2.4 * k:.2f}" paint-order="stroke">{vid}</text>')
        return self

    def north(self):
        """A small north arrow, top right (the picture looks north, so north is up the page)."""
        vx, vy, vw, vh = self.view
        k = self.k
        x, y = vx + vw - 20 * k, vy + 26 * k
        self._north = True
        self.over.append(f'<g><circle cx="{x:.1f}" cy="{y:.1f}" r="{13 * k:.1f}" fill="#fff" fill-opacity=".9"/>'
                         f'<path d="M{x:.1f} {y - 10 * k:.1f} L{x + 5 * k:.1f} {y + 5 * k:.1f} L{x:.1f} {y + 1.5 * k:.1f} L{x - 5 * k:.1f} {y + 5 * k:.1f}z" fill="#14324a"/>'
                         f'<text x="{x:.1f}" y="{y + 11.5 * k:.1f}" text-anchor="middle" font-size="{6.5 * k:.1f}" font-weight="800" fill="#14324a">N</text></g>')
        return self

    def scale(self, at, metres=20):
        """A scale bar lying on the ground at this place (map px), east-west."""
        x, y = at
        a, b = P(x, y), P(x + m(metres), y)
        k = self.k
        self.over.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="#fff" stroke-width="{5.5 * k:.1f}" stroke-linecap="round"/>'
                         f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="#14324a" stroke-width="{2.6 * k:.1f}"/>')
        self.pins.append(((a[0] + b[0]) / 2, a[1] - 7 * k, 7 * k, 'scale',
                          f'<text x="{(a[0] + b[0]) / 2:.1f}" y="{a[1] - 5 * k:.1f}" text-anchor="middle" font-size="{9 * k:.1f}" font-weight="800" fill="#fff" stroke="#14324a" stroke-width="{2.6 * k:.1f}" paint-order="stroke">{metres} m</text>'))
        return self

    # --- output
    def svg(self, cls='map'):
        x0, y0, w, h = self.view
        labels = self._place()
        body = ''.join(self.under) + ''.join(self.over) + ''.join(p[4] for p in self.pins) + ''.join(labels)
        PROBLEMS.extend(f'{self.title}: {p}' for p in self.problems)
        return (f'<svg class="{cls}" viewBox="{x0:.1f} {y0:.1f} {w:.1f} {h:.1f}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="{self.title}">'
                f'<use href="#campmap"/>{body}</svg>')


PROBLEMS = []

DEFS = ('<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'
        '<image id="campmap" href="__MAPSRC__" x="0" y="0" width="1800" height="1136" preserveAspectRatio="none"/>'
        + ''.join(f'<marker id="arr-{k}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="{v}"/></marker>' for k, v in C.items())
        + '</defs></svg>')
