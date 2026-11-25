"""One map per sheet of the counselor pack. Every position is in traced-map pixels (0.4 m each)."""
import math
from maps import Map, P, PLACES, VAN, VIEWS, L, rect, circle, m

VIEWS.update({
    'site': (150, 262, 1420, 560),
    'east': (850, 404, 656, 360),
    'lawn': (872, 412, 470, 286),
    'north': (930, 418, 380, 200),
    'southl': (900, 545, 400, 190),
    'lake': (1085, 380, 470, 258),
    'fire': (872, 474, 200, 110),
    'cine': (880, 462, 220, 121),
    'westwalk': (540, 400, 800, 440),
    'camper': (150, 190, 1420, 800),
})

HQ = PLACES['hq']
NL = [(652, 302), (760, 300), (760, 372), (652, 374)]   # North Lawn, clear grass
SL = [(658, 424), (760, 420), (760, 530), (658, 530)]   # South Lawn, clear grass
POOL_LINE = [(650, 436), (650, 526)]
LAKE_GAP_N = [(822, 318), (838, 350)]      # the gap between B12 and A10 that leads down to the lake lane
EAST_EDGE = [(806, 322), (792, 352), (774, 396), (764, 440), (766, 482), (790, 520)]
LAKE_LANE = [(806, 372), (790, 402), (784, 440), (790, 480), (806, 505)]


def base(view='lawn', title='', hq=True, vans=True, pool=True, north=True):
    mp = Map(view, title)
    if pool:
        mp.zone(L['lakes']['pool'], 'red', fill=0.22, lw=1.6, dash='5 4')
        mp.text((616, 486), 'Pool: closed', size=9.5, color='#b3261e')
    if vans:
        mp.vans()
    if hq:
        mp.pin(HQ, 'HQ', color='red', r=10)
    if north:
        mp.north()
    return mp


SITE_KEY = [
    (1, 'The Hall', 'hall'), (2, 'Restrooms', 'restrooms'), (3, 'Reception · Bus Point', 'reception'), (4, 'Tram Stop', 'tram'),
    (5, 'Main Gate', 'gate'), (6, 'South Lawn', None), (7, 'North Lawn', None), (8, 'Van Village', None), (9, 'Dock Gate', 'dock_gate'),
    (10, 'The Dock', 'dock'), (11, 'Campfire Circle', 'campfire'), (12, 'Cinema Lawn', None), (13, 'Airstream', 'airstream'),
    (14, 'Bird Lake Lookout', 'bird_lookout'),
]
_SITE_AT = {6: (712, 480), 7: (712, 336), 8: (850, 284), 12: (600, 340), 11: (640, 384), 13: (618, 436)}


def site():
    mp = Map('site', 'The whole camp')
    mp.zone(NL, 'yellow', fill=0.25, lw=1.4)
    mp.zone(SL, 'yellow', fill=0.25, lw=1.4)
    mp.zone(L['lakes']['pool'], 'red', fill=0.25, lw=1.4, dash='5 4')
    mp.vans(r=3.4)
    for n, name, key in SITE_KEY:
        at = _SITE_AT.get(n) or PLACES[key]
        mp.pin(at, n, color='teal' if n == 8 else 'navy', r=9)
    mp.pin(HQ, 'HQ', color='red', r=9)
    mp.text((925, 425), 'Kayak Lake', size=10, color='#1d5f96')
    mp.text((365, 372), 'Wild Waterbird Lake', size=10, color='#1d5f96')
    mp.text((612, 500), 'Pool: closed', side='b', size=8.5, color='#b3261e')
    mp.text((190, 440), 'West vans D to G (not used)', size=9, color='#55616d')
    mp.scale((300, 640), 50).north()
    return mp.svg('map site')


# ------------------------------------------------------------------ Thursday
def arrival():
    mp = base('east', 'Arrival, welcome circle and the orientation walk', hq=False)
    mp.zone(circle(708, 474, 7), 'yellow', 'Welcome circle', fill=0.4, label_at=(708, 498), size=10.5)
    mp.zone(rect(722, 302, 22, 3.5), 'white', fill=0.7, lw=1.6)
    mp.text((722, 302), 'Luggage Line', side='l', size=10)
    stops = [(790, 284), (922, 291), (650, 372), (650, 436), (585, 562), (762, 552)]
    loop = [(790, 284), (850, 276), (922, 291), (850, 276), (760, 262), (690, 282), (650, 372), (650, 436), (648, 540), (585, 562), (700, 552), (762, 552), (748, 500), (752, 400), (772, 300), (790, 284)]
    mp.line(loop, 'navy', lw=2.2, dash='2 5')
    names = ['Van Village', 'Dock Gate', 'Campfire, Cinema', 'Airstream, pool line', 'Restrooms,\nway to the Hall', 'Reception, Tram Stop,\nMain Gate']
    sides = ['t', 't', 'r', 'r', 'r', 'r']
    for i, (s, n, sd) in enumerate(zip(stops, names, sides)):
        mp.pin(s, i + 1, n, side=sd, size=10.5)
    mp.pin((706, 574), 'B', 'Bus Point', color='red', side='l', size=10.5)
    mp.pin(HQ, 'HQ', color='red', r=9)
    return mp.svg()


def checkin():
    mp = base('lawn', 'Check-in rotation')
    mp.zone(rect(722, 302, 22, 3.5), 'white', fill=0.7, lw=1.6)
    mp.text((722, 302), 'Luggage Line', side='l', size=10)
    mp.pin((694, 386), 'N', 'Nurse’s table', color='pink', side='l')
    mp.pin((812, 292), 'V', 'Vans and keys', color='teal', side='t')
    mp.zone(circle(708, 474, 7), 'yellow', fill=0.4)
    mp.pin((708, 474), 'G', 'Name games\nand snack', color='orange', side='r')
    return mp.svg()


def lake_rotation(second=False):
    mp = base('east', 'Lake rotation: three stations')
    mp.zone([(905, 330), (1005, 332), (1012, 392), (930, 405), (880, 380)], 'blue', fill=0.22, lw=1.6)
    mp.pin((977, 322), 'K', 'Kayak: the Dock', color='blue', side='r')
    mp.pin(PLACES['dock_gate'], 'DG', 'Dock Gate: wait here', color='navy', side='t', size=10.5)
    mp.line([(830, 322), (865, 300), (922, 291), (970, 300)], 'blue', lw=2.2, dash='2 5')
    if second:
        mp.zone(rect(728, 322, 10, 7), 'purple', fill=0.4)
        mp.pin((728, 322), 'P', 'Paracord bracelets', color='purple', side='l')
        mp.zone(rect(708, 478, 16, 12), 'orange', fill=0.4)
        mp.pin((708, 478), 'L', 'Giant Bubble Lab', color='orange', side='r')
    else:
        mp.zone(rect(700, 332, 12, 8), 'purple', fill=0.4)
        mp.pin((700, 332), 'B', 'Banner workshop', color='purple', side='l')
        mp.zone(rect(708, 478, 24, 22), 'orange', fill=0.3)
        mp.pin((708, 478), 'C', 'Cornhole and lawn games', color='orange', side='r')
    mp.text((770, 250), 'Change at the vans', side='t', size=10)
    return mp.svg()


def kayak(relay=False):
    mp = Map('lake', 'Kayaking')
    mp.vans()
    mp.zone([(900, 328), (1005, 332), (1014, 395), (935, 408), (872, 378)], 'blue', 'Paddling area\n(the coach sets it)', fill=0.2, lw=1.8, label_at=(950, 372), size=10.5)
    mp.zone([(835, 400), (880, 398), (940, 425), (1010, 420), (1015, 480), (900, 492), (835, 470)], 'red', 'Far end: no boats', fill=0.16, lw=1.2, dash='5 4', label_at=(925, 458), size=10)
    mp.pin((980, 322), 'D', 'The Dock: coach, boats', color='blue', side='r', size=10.5)
    mp.pin(PLACES['dock_gate'], 'DG', 'Dock Gate: line up here', color='navy', side='l', size=10.5)
    mp.pin((1000, 296), 'F1', 'Floater 1: shore watch', color='orange', side='t', size=10.5, r=9)
    mp.pin((948, 284), 'N', 'Nurse, cold kit (bin 2)', color='pink', side='t', size=10.5)
    mp.line([(830, 322), (865, 300), (922, 291)], 'navy', lw=2.2, dash='2 5')
    if relay:
        mp.line([(972, 332), (930, 372)], 'yellow', lw=2.6, dash=None, arrow=True)
        mp.line([(938, 380), (980, 340)], 'yellow', lw=2.6, dash=None, arrow=True)
        mp.pin((928, 380), '●', 'Turn buoy', color='yellow', side='b', r=6, size=10)
    mp.north()
    return mp.svg()


def banner():
    mp = base('lawn', 'Team Banner and Mascot Workshop')
    mp.zone(rect(690, 330, 8, 6), 'purple', fill=0.45)
    mp.zone(rect(722, 336, 8, 6), 'purple', fill=0.45)
    mp.pin((690, 330), 1, 'Banner tarp:\nsquad 1 paints', color='purple', side='l', size=10.5)
    mp.pin((722, 336), 2, 'Chant tarp:\nsquad 2 writes', color='purple', side='b', size=10.5)
    mp.pin((748, 276), 'D', 'Drying: deck of van B05', color='teal', side='t', size=10.5)
    return mp.svg()


def cornhole():
    mp = base('lawn', 'Cornhole and lawn games')
    mp.zone(rect(690, 452, 3, 8), 'orange', fill=0.5)
    mp.zone(rect(712, 452, 3, 8), 'orange', fill=0.5)
    mp.zone(rect(738, 456, 5, 10), 'green', fill=0.45)
    mp.zone(rect(706, 500, 12, 4), 'blue', fill=0.45)
    mp.pin((690, 436), 1, 'Cornhole 1', color='orange', side='l', size=10.5)
    mp.pin((712, 436), 2, 'Cornhole 2', color='orange', side='t', size=10.5)
    mp.pin((738, 440), 3, 'Mölkky', color='green', side='r', size=10.5)
    mp.pin((706, 500), 4, 'Soft pétanque', color='blue', side='b', size=10.5)
    mp.line(POOL_LINE, 'red', lw=2.6)
    mp.text((650, 532), 'Flag line', side='b', size=9.5, color='#b3261e')
    return mp.svg()


def tram():
    mp = base('east', 'Warm drink and the eco-tram at dusk')
    mp.pin(PLACES['tram'], 'T', 'Tram Stop: board here', color='green', side='r')
    mp.zone(rect(708, 478, 24, 22), 'orange', fill=0.3)
    mp.pin((708, 478), 'W', 'Waiting teams:\ncornhole, Mölkky', color='orange', side='r', size=10.5)
    mp.text((700, 386), 'Warm drink 16:00', side='r', size=10.5)
    mp.line([(720, 520), (760, 545), (800, 553)], 'green', lw=2.4, dash='2 5', arrow=True)
    return mp.svg()


def _fire_ring(mp, labels=True):
    cx, cy = PLACES['campfire']
    cols = ['yellow', 'orange', 'green']
    names = ['Yellow', 'Orange', 'Green']
    for i, (a0, a1) in enumerate([(-60, 40), (50, 150), (160, 260)]):
        poly = []
        for a in range(a0, a1 + 1, 10):
            poly.append((cx + m(4.2) * math.cos(math.radians(a)), cy + m(4.2) * math.sin(math.radians(a))))
        for a in range(a1, a0 - 1, -10):
            poly.append((cx + m(7.4) * math.cos(math.radians(a)), cy + m(7.4) * math.sin(math.radians(a))))
        mid = math.radians((a0 + a1) / 2)
        mp.zone(poly, cols[i], names[i] if labels else None, fill=0.55, lw=1.4,
                label_at=(cx + m(5.8) * math.cos(mid), cy + m(5.8) * math.sin(mid)), size=9)
    mp.zone(circle(cx, cy, 2.6), 'red', fill=0.0, lw=1.6, dash='3 3')


def campfire(skits=False):
    mp = Map('fire', 'Campfire Circle')
    _fire_ring(mp)
    cx, cy = PLACES['campfire']
    mp.text((cx, cy), 'Fire', size=9, color='#b3261e')
    mp.pin((cx - m(1), cy - m(9.5)), 'S', 'Stage: skits here' if skits else 'Stage: teams present here', color='navy', side='t', size=10)
    mp.pin((cx + m(12), cy - m(5)), 'M', 'S’mores table', color='purple', side='r', size=10)
    mp.pin((cx - m(6.5), cy - m(6)), 'W', 'Water buckets', color='blue', side='l', size=10)
    if skits:
        mp.pin((cx + m(1), cy + m(11.5)), 'J', 'Judges', color='pink', side='r', size=10)
    mp.line([(596, 440), (604, 412), (612, 396)], 'navy', lw=2, dash='2 5', arrow=True)
    mp.text((596, 436), 'From the Hall', side='l', size=9.5)
    mp.north()
    return mp.svg()


# ------------------------------------------------------------------ Friday
CONTROLS = [
    ((712, 562), 'A', 'Reception sign', 'b'), ((800, 553), 'D', 'Tram Stop', 'b'), ((922, 291), 'V', 'Dock Gate post', 't'),
    ((812, 222), 'E', 'North bend of the lane', 't'), ((603, 350), 'N', 'Back of the cinema screen', 'l'),
    ((621, 430), 'T', 'Airstream deck rail', 'r'), ((582, 574), 'U', 'Restrooms wall', 'b'), ((412, 566), 'R', 'Hall porch', 'b'),
    ((510, 400), 'E', 'Bird Lake Lookout', 'l'), ((300, 470), 'S', 'West loop, zone E sign', 'b'),
]


def orienteering(view='site'):
    mp = Map(view, 'Orienteering Quest: the ten controls')
    mp.zone(L['lakes']['pool'], 'red', fill=0.25, lw=1.4, dash='5 4')
    mp.vans(r=3.4)
    for i, (at, letter, name, side) in enumerate(CONTROLS):
        mp.pin(at, i + 1, color='orange', r=9.5)
    mp.pin(HQ, 'HQ', 'Start and finish', color='red', side='r', size=10)
    mp.pin((650, 396), '★', color='yellow', r=7.5)
    mp.scale((300, 640), 50).north()
    return mp.svg('map site')


CPS = [((752, 300), 'Knots', 't'), ((752, 392), 'Memory', 'r'), ((728, 462), 'Blindfold Trail', 'r'), ((700, 512), 'Toxic Waste', 'b'),
       ((626, 428), 'Team Photo', 'l'), ((633, 378), 'Puzzle', 'l'), ((690, 326), 'Pipeline', 't')]


def race():
    mp = base('lawn', 'Bambi Amazing Race: seven checkpoints')
    loop = [c[0] for c in CPS] + [CPS[0][0]]
    mp.line(loop, 'navy', lw=2.2, dash='2 5')
    for i, (at, name, side) in enumerate(CPS):
        mp.pin(at, i + 1, name, color='orange', side=side, size=10.5)
    mp.line(POOL_LINE, 'red', lw=2.4)
    return mp.svg()


COURT_A, COURT_B, COURT_C = (705, 336), (710, 452), (710, 508)


def sports():
    mp = base('lawn', 'Multi-sports league: three courts')
    mp.zone(rect(*COURT_A, 30, 15), 'blue', fill=0.3)
    for dx in (-11, 11):
        x = COURT_A[0] + m(dx)
        mp.line([(x, COURT_A[1] - m(7.5)), (x, COURT_A[1] + m(7.5))], 'blue', lw=1.6, dash='3 3', halo=False)
    mp.text(COURT_A, 'A  Ultimate frisbee\n30 × 15 m', size=10.5)
    mp.zone(rect(*COURT_B, 24, 14), 'green', fill=0.3)
    mp.text(COURT_B, 'B  Mini-football\n24 × 14 m', size=10.5)
    mp.zone(rect(*COURT_C, 14, 8), 'orange', fill=0.35)
    mp.line([(COURT_C[0], COURT_C[1] - m(4)), (COURT_C[0], COURT_C[1] + m(4))], 'orange', lw=1.6, dash=None, halo=False)
    mp.text((COURT_C[0], COURT_C[1] + m(8)), 'C  Dodgeball 14 × 8 m', size=10.5)
    mp.line(POOL_LINE, 'red', lw=2.4)
    mp.scale((664, 548), 20)
    return mp.svg()


PLOTS = [((672, 322), 'Y1'), ((705, 322), 'O1'), ((738, 322), 'G1'), ((672, 352), 'Y2'), ((705, 352), 'O2'), ((738, 352), 'G2')]
TEAMCOL = {'Y': 'yellow', 'O': 'orange', 'G': 'green'}


def shelter():
    mp = base('lawn', 'Shelter Build Challenge: six plots')
    for at, sq in PLOTS:
        mp.zone(rect(at[0], at[1], 6, 6), TEAMCOL[sq[0]], fill=0.55, lw=1.6)
        mp.pin(at, sq, color=TEAMCOL[sq[0]], r=9)
    mp.pin((705, 292), 'D', 'Demo shelter and kit line', color='navy', side='l', size=10.5)
    mp.pin((772, 344), 'W', 'Water for the storm test', color='blue', side='r', size=10.5)
    mp.scale((664, 548), 20)
    return mp.svg()


def cafe():
    mp = Map('westwalk', 'To the Hall')
    mp.vans(r=3.6)
    mp.line([(790, 300), (762, 400), (748, 500), (730, 540), (690, 548), (640, 548), (590, 554), (530, 556), (470, 556), (430, 562), (412, 570)], 'navy', lw=2.6, dash='2 5', arrow=True)
    mp.pin((412, 574), 'H', 'The Hall: Board-Game Café, 17:15', color='purple', side='b', size=10.5)
    mp.pin((812, 292), 'V', 'Showers 16:45 to 17:05', color='teal', side='t', size=10.5)
    mp.text((640, 566), '200 m, 4 minutes', side='b', size=10)
    mp.north()
    return mp.svg()


GLOW = [((672, 322), 'Ring toss'), ((738, 318), 'Silent line-up'), ((754, 372), 'Firefly code'), ((738, 452), 'Glow bowling'), ((702, 508), 'Memory lights'), ((676, 448), 'Invisible riddle')]


def glow():
    mp = base('lawn', 'Glow Night Quest: six stations')
    for i, (at, name) in enumerate(GLOW):
        mp.pin(at, i + 1, name, color='green', side='r' if i in (1, 2, 3) else 'l' if i in (0, 5) else 'b', size=10.5)
    mp.line(POOL_LINE, 'red', lw=2.6)
    mp.pin((650, 452), 'F1', 'Floater 1,\nlantern', color='orange', side='t', size=9.5, r=8)
    mp.line(EAST_EDGE, 'red', lw=2.6)
    mp.pin((790, 352), 'F2', 'Floater 2, lantern:\nnobody past the vans', color='orange', side='r', size=9.5, r=8)
    mp.pin((606, 356), '★', 'Treasure box:\nunder the screen', color='yellow', side='b', size=9.5, r=8)
    return mp.svg()


def cinema():
    mp = Map('cine', 'Star Cinema')
    cx, cy = 603, 350
    mp.line([(596, 340), (612, 362)], 'navy', lw=4, dash=None)
    mp.text((596, 334), 'Screen', side='t', size=10)
    spots = [((622, 342), 'Y1'), ((630, 353), 'O1'), ((638, 364), 'G1'), ((638, 334), 'Y2'), ((646, 345), 'O2'), ((654, 356), 'G2')]
    for at, sq in spots:
        mp.zone(rect(at[0], at[1], 3.4, 2.8, 35), TEAMCOL[sq[0]], fill=0.65, lw=1.2)
        mp.text(at, sq, size=8.5)
    mp.pin((664, 330), 'C', 'Counselors behind', color='navy', side='t', size=10)
    mp.pin((640, 318), 'S', 'Snack and throws table', color='purple', side='t', size=10)
    mp.line([(672, 356), (720, 330), (770, 300)], 'navy', lw=2, dash='2 5', arrow=True)
    mp.text((700, 352), 'To the vans, 21:30', side='b', size=9.5)
    mp.north()
    return mp.svg()


# ------------------------------------------------------------------ Saturday
OLY = ['Sack race', 'Cornhole toss', 'Ring toss', 'Skipping relay', 'Sponge relay', 'Frisbee target']


def olympics():
    mp = base('lawn', 'Camp Olympics Relay Medley: six lanes')
    x0 = 668
    for i, name in enumerate(OLY):
        cx = x0 + i * m(6.4)
        mp.zone(rect(cx, 478, 5, 16), 'orange' if i % 2 == 0 else 'blue', fill=0.4, lw=1.4)
        mp.pin((cx, 478 - m(8)), i + 1, color='navy', r=8.5)
    mp.text((708, 425), '1 Sack race · 2 Cornhole toss · 3 Ring toss', side='t', size=9.5)
    mp.text((708, 536), '4 Skipping relay · 5 Sponge relay · 6 Frisbee target', side='b', size=9.5)
    mp.line(POOL_LINE, 'red', lw=2.4)
    return mp.svg()


BASINS = [((680, 452), 'Y1'), ((708, 452), 'O1'), ((736, 452), 'G1'), ((680, 484), 'Y2'), ((708, 484), 'O2'), ((736, 484), 'G2')]


def science():
    mp = base('lawn', 'Science hands-on')
    for at, sq in BASINS:
        mp.zone(rect(at[0], at[1], 4, 4), TEAMCOL[sq[0]], fill=0.6, lw=1.4)
        mp.pin(at, sq, color=TEAMCOL[sq[0]], r=8.5)
    mp.text((708, 432), 'Oobleck: one basin a squad', side='t', size=10)
    mp.pin((708, 524), 'G', 'Geyser launch pad', color='red', side='r', size=10.5)
    mp.line([(672, 503), (748, 503)], 'red', lw=2.6)
    mp.text((760, 503), 'Viewing line, 8 m back', side='r', size=9.5, color='#b3261e')
    mp.line(POOL_LINE, 'red', lw=2.4)
    return mp.svg()


def eggdrop():
    mp = base('lawn', 'Egg Drop Build Challenge')
    for at, sq in PLOTS:
        mp.zone(rect(at[0], at[1], 4, 3.4), TEAMCOL[sq[0]], fill=0.6, lw=1.4)
        mp.pin(at, sq, color=TEAMCOL[sq[0]], r=8.5)
    mp.text((705, 300), 'Build: one blanket a squad', side='t', size=10)
    mp.zone(rect(706, 543, 4, 3), 'red', fill=0.5)
    mp.pin((706, 543), 'D', 'Drop Zone: on the path', color='red', side='r', size=10.5)
    mp.line([(686, 530), (728, 530)], 'red', lw=2.4)
    mp.text((672, 528), 'Watch from here', side='l', size=9.5, color='#b3261e')
    mp.line([(705, 372), (706, 520)], 'navy', lw=2, dash='2 5', arrow=True)
    return mp.svg()


ARC = [((668, 318), 'Cornhole', 'l'), ((705, 314), 'Soft pétanque', 't'), ((742, 318), 'Mölkky', 'r'), ((742, 356), 'Table tennis', 'r'), ((705, 362), 'Safe darts', 'b'), ((668, 356), 'Minute-to-Win-It', 'l')]


def arcade():
    mp = base('lawn', 'Games Arcade: six stations')
    loop = [a[0] for a in ARC] + [ARC[0][0]]
    mp.line(loop, 'navy', lw=2, dash='2 5')
    for i, (at, name, side) in enumerate(ARC):
        mp.pin(at, i + 1, name, color='orange', side=side, size=10.5)
    return mp.svg()


def skit_spots():
    mp = base('lawn', 'Skit run-through by the vans')
    mp.pin((690, 312), 'Y', 'Yellow', color='yellow', side='l', size=10.5)
    mp.pin((742, 312), 'O', 'Orange', color='orange', side='t', size=10.5)
    mp.pin((752, 372), 'G', 'Green', color='green', side='r', size=10.5)
    mp.pin(PLACES['campfire'], 'F', 'Final campfire 19:30', color='red', side='b', size=10.5)
    return mp.svg()


def treasure():
    mp = base('lawn', 'Saturday Treasure Hunt: three zones')
    mp.zone(NL, 'blue', 'Zone A\nNorth Lawn', fill=0.3)
    mp.zone([(664, 424), (760, 420), (760, 530), (664, 530)], 'green', 'Zone B\nSouth Lawn', fill=0.3)
    mp.zone([(736, 252), (826, 244), (912, 276), (905, 306), (840, 322), (822, 366), (792, 366), (770, 345), (770, 298), (738, 292)], 'purple', 'Zone C\nVan Village', fill=0.3, label_at=(808, 290))
    mp.line(POOL_LINE, 'red', lw=2.6)
    mp.pin((650, 452), 'F1', 'Floater 1,\nlantern', color='orange', side='t', size=9.5, r=8)
    mp.line([(912, 282), (902, 312)], 'red', lw=2.6)
    mp.line([(826, 330), (800, 372), (774, 396), (764, 440), (766, 482), (790, 520)], 'red', lw=2.6)
    mp.pin((842, 338), 'F2', 'Floater 2, lantern:\nnobody past the vans', color='orange', side='r', size=9.5, r=8)
    return mp.svg()


# ------------------------------------------------------------------ Sunday and every day
def packout():
    mp = base('east', 'Sunday pack-out and the bus', hq=False)
    mp.line([(800, 300), (770, 400), (745, 520), (712, 560)], 'navy', lw=2.6, dash='2 5', arrow=True)
    mp.zone(rect(742, 560, 14, 4), 'white', fill=0.75, lw=1.6)
    mp.pin((742, 560), 'L', 'Luggage by team,\nwith Floater 1', color='navy', side='r', size=10.5)
    mp.pin((700, 572), 'B', 'Bus Point: board 09:50', color='red', side='l', size=10.5)
    mp.pin((812, 292), 'V', 'Vans checked 07:30 to 07:55', color='teal', side='t', size=10.5)
    mp.zone(circle(708, 474, 8), 'yellow', fill=0.35)
    mp.text((708, 474), 'Finale and\nprize-giving', size=10)
    return mp.svg()


def finale():
    mp = base('lawn', 'Color War Finale')
    mp.line([(683, 440), (733, 440)], 'navy', lw=4, dash=None)
    mp.text((708, 428), '1  Tug-of-war: rope 20 m', side='t', size=10)
    for dx in (-5, 0, 5):
        mp.line([(708 + dx, 434), (708 + dx, 446)], 'red', lw=1.6, dash=None, halo=False)
    mp.zone(circle(708, 466, 4.5), 'purple', fill=0.4, lw=1.4)
    mp.text((740, 466), '2  Giant rope jump', side='r', size=10)
    for i, c in enumerate(['yellow', 'orange', 'green']):
        y = 496 + i * m(3.2)
        mp.zone(rect(708, y, 20, 2.4), c, fill=0.55, lw=1.2)
    mp.text((708, 524), '3  Final relay: three lanes of 20 m', side='b', size=10)
    mp.line(POOL_LINE, 'red', lw=2.4)
    return mp.svg()


def prizes():
    mp = base('lawn', 'Prize-giving')
    cx, cy = 708, 470
    cols = ['yellow', 'orange', 'green']
    for i, (a0, a1) in enumerate([(20, 70), (70, 120), (120, 170)]):
        poly = []
        for a in range(a0, a1 + 1, 10):
            poly.append((cx + m(8) * math.cos(math.radians(a)), cy + m(8) * math.sin(math.radians(a))))
        for a in range(a1, a0 - 1, -10):
            poly.append((cx + m(12.5) * math.cos(math.radians(a)), cy + m(12.5) * math.sin(math.radians(a))))
        mp.zone(poly, cols[i], fill=0.55, lw=1.4)
    mp.pin((708, 452), 'T', 'Trophy table, banner, speaker', color='navy', side='t', size=10.5)
    mp.text((708, 512), 'Teams sit in a horseshoe', side='b', size=10)
    mp.line(POOL_LINE, 'red', lw=2.4)
    return mp.svg()


def routine():
    mp = Map('westwalk', 'Every day: vans, lawn and the Hall')
    mp.vans(r=3.8)
    mp.zone(L['lakes']['pool'], 'red', fill=0.22, lw=1.4, dash='5 4')
    mp.line([(790, 300), (762, 400), (748, 500), (730, 540), (690, 548), (640, 548), (590, 554), (530, 556), (470, 556), (430, 562), (412, 570)], 'navy', lw=2.6, dash='2 5')
    mp.pin((412, 574), 'H', 'The Hall: meals', color='purple', side='b', size=10.5)
    mp.pin((812, 292), 'V', 'Van Village', color='teal', side='t', size=10.5)
    mp.pin(HQ, 'HQ', 'Morning circle 08:50', color='red', side='l', size=10.5)
    mp.text((842, 352), 'Counselor vans (purple):\nlantern on the deck at night', side='r', size=9.5)
    mp.text((640, 566), 'Hall walk: 200 m, 4 minutes', side='b', size=10)
    mp.north()
    return mp.svg()


ALL = {
    'site': site, 'arrival': arrival, 'checkin': checkin, 'lake1': lake_rotation, 'kayak': kayak, 'banner': banner,
    'cornhole': cornhole, 'tram': tram, 'campfire': campfire, 'orienteering': orienteering, 'race': race, 'sports': sports,
    'shelter': shelter, 'cafe': cafe, 'glow': glow, 'cinema': cinema, 'olympics': olympics,
    'lake2': lambda: lake_rotation(True), 'kayakrelay': lambda: kayak(True), 'science': science, 'eggdrop': eggdrop,
    'arcade': arcade, 'skits': skit_spots, 'finalfire': lambda: campfire(True), 'treasure': treasure, 'packout': packout,
    'finale': finale, 'prizes': prizes, 'routine': routine,
}
