import { HOTSPOTS } from '../../hotspots'
import { layout, mulberry32, poi, roads, S, toWorld, trees, type Pt } from '../../layout/layout'
import { vnoise } from './geom'
import { crownPerches, type Plant } from './species'

/**
 * Where every plant goes. Trees stand exactly on the crowns traced from the official map;
 * only their species is decided here. The planting (reeds, shrubs, ti plants) is placed by
 * hand or along the shores and then checked against everything that must stay clear.
 */
type P2 = [number, number]
const world = (poly: Pt[]): P2[] => poly.map(toWorld)

const LAND = world(layout.land)
const WILD = world(layout.lakes.wild)
const KAYAK = world(layout.lakes.kayak)
const POOL = world(layout.lakes.pool)
const ROADS = roads.map((r) => ({ outer: world(r.outer), holes: r.holes.map(world) }))

function inPoly(x: number, z: number, poly: P2[]): boolean {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i]
    const [xj, zj] = poly[j]
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c
  }
  return c
}
/** Distance from a point to a polygon's outline. */
function edgeDist(x: number, z: number, poly: P2[]): number {
  let d = Infinity
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, az] = poly[j]
    const [bx, bz] = poly[i]
    const ex = bx - ax
    const ez = bz - az
    const t = Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez || 1)))
    d = Math.min(d, Math.hypot(x - ax - ex * t, z - az - ez * t))
  }
  return d
}
function scaled(poly: P2[], k: number): P2[] {
  let cx = 0
  let cz = 0
  for (const p of poly) {
    cx += p[0]
    cz += p[1]
  }
  cx /= poly.length
  cz /= poly.length
  return poly.map(([x, z]) => [cx + (x - cx) * k, cz + (z - cz) * k])
}
const POOL_RIM = scaled(POOL, 1.2)

// ── trees ────────────────────────────────────────────────────────────────────────────────
export type Species = 'broadleaf' | 'cypress' | 'palm' | 'araucaria'
export interface TreePlan extends Plant {
  species: Species
}

/** Height of the foot of a cypress standing in the lake: just under the water line. */
const WATER_FOOT = -0.42
/** The grove's broadleaf trees stand a little deeper, so that their foliage hangs down to the water as in the venue's photos. */
const THICKET_FOOT = -0.72

/**
 * Trees that the venue's photos show to be fan palms or Norfolk Island pines, named by the
 * map position (px) of their traced crown: palms behind the Airstream and beside the pool,
 * in front of the dining hall, by the zone E units, along the tram road and on the kayak
 * lake's east shore; the tall tiered pines that stand over the pool.
 */
const PALMS: Pt[] = [[668, 388], [699, 406], [654, 535], [400, 545], [345, 553], [317, 589], [307, 493], [563, 542], [525, 333], [938, 298], [1007, 335], [1004, 372]]
const ARAUCARIAS: Pt[] = [[592, 379], [557, 383], [573, 461]]
const isAt = (t: { x: number; y: number }, list: Pt[]) => list.some(([x, y]) => Math.hypot(t.x - x, t.y - y) < 4)

/** Same rule as before: a crown within 42 px of a lake's traced outline is a lakeside tree. */
function lakeside(px: number, py: number): boolean {
  for (const poly of [layout.lakes.wild, layout.lakes.kayak]) for (const [x, y] of poly) if (Math.hypot(px - x, py - y) < 42) return true
  return false
}

export function planTrees(): TreePlan[] {
  return trees.map((t, i) => {
    const [x, z] = toWorld([t.x, t.y])
    const species: Species = t.kind ?? (isAt(t, PALMS) ? 'palm' : isAt(t, ARAUCARIAS) ? 'araucaria' : lakeside(t.x, t.y) ? 'cypress' : 'broadleaf')
    const wet = inPoly(x, z, WILD) || inPoly(x, z, KAYAK)
    return { x, z, y: wet ? (t.kind === 'broadleaf' ? THICKET_FOOT : WATER_FOOT) : 0, r: t.r * S, seed: 977 + i * 7919, species }
  })
}

/**
 * Places for birds to settle on the crown of the tree traced nearest to a map position (px):
 * world positions of their feet, the top of the crown first. `toward` is the side of the
 * crown the lower places face, as an angle in the ground plane from +X toward +Z.
 */
export function perchesOn(px: Pt, count: number, toward: number): [number, number, number][] {
  let best: TreePlan | null = null
  let bestD = Infinity
  const [x, z] = toWorld(px)
  for (const t of planTrees()) {
    if (t.species !== 'cypress' && t.species !== 'broadleaf') continue
    const d = Math.hypot(t.x - x, t.z - z)
    if (d < bestD) {
      bestD = d
      best = t
    }
  }
  return best ? crownPerches(best, best.species as 'cypress' | 'broadleaf', count, toward) : []
}

// ── keep-clear zones ─────────────────────────────────────────────────────────────────────
const at = (name: string): P2 => toWorld(poi(name))

/** Camper units (and the check-in unit): footprint plus deck, in the unit's own frame. */
const UNITS = [
  ...layout.vans.map((v) => {
    const [x, z] = toWorld([v.x, v.y])
    const rot = Math.atan2(v.faceX, v.faceY)
    return { x, z, cos: Math.cos(rot), sin: Math.sin(rot) }
  }),
  { x: at('checkin')[0], z: at('checkin')[1], cos: -1, sin: 0 },
]
/** True within a unit's footprint or deck, widened by `side` and by `front` on the deck side. */
function nearUnit(x: number, z: number, side: number, front: number): boolean {
  for (const u of UNITS) {
    const dx = x - u.x
    const dz = z - u.z
    const lx = dx * u.cos - dz * u.sin
    const lz = dx * u.sin + dz * u.cos
    if (lx > -1.2 - side && lx < 0.9 + side && lz > -0.4 - side && lz < 0.9 + front) return true
  }
  return false
}

const [hallX, hallZ] = at('dining')
const [gateX, gateZ] = at('entrance')
const [tramX, tramZ] = at('tramStop')
const [dockX, dockZ] = at('boardingLabel')
/** Axis-aligned keep-outs [cx, cz, halfX, halfZ]: buildings and fixtures, with a little air around them. */
const RECTS: [number, number, number, number][] = [
  [hallX, hallZ + 0.6, 4.55, 2.55], // dining hall on its plinth
  [hallX, hallZ - 2.1, 1.7, 1.0], // its front steps
  [(at('restroom')[0] + at('aed')[0]) / 2, at('restroom')[1], 2.05, 1.1],
  [gateX, gateZ, 0.5, 1.6],
  [tramX + 0.1, tramZ, 2.7, 0.8],
  [dockX, dockZ + 2.3, 1.0, 2.4],
  ...(poi('parking') as unknown as Pt[]).map((p): [number, number, number, number] => [toWorld(p)[0], toWorld(p)[1], 1.6, 1.15]),
]
/** Round keep-outs [cx, cz, radius]. */
const CIRCLES: [number, number, number][] = [
  [...at('airstreamSpot'), 2.5],
  [...at('campfire'), 2.2],
  [at('cinema')[0], at('cinema')[1] + 1.2, 4.2],
  [...at('water'), 0.6],
  [...at('heron'), 1.0],
  [...at('kingfisher'), 1.0],
  [dockX, dockZ + 4.6, 2.8], // moored kayaks
  ...([[578, 462], [575, 478], [578, 494]] as Pt[]).map((p): [number, number, number] => [...toWorld(p), 0.8]), // pool loungers
  ...HOTSPOTS.map((h): [number, number, number] => [h.pos[0], h.pos[2], 1.0]), // where the map markers point
]
function inKeepOut(x: number, z: number): boolean {
  for (const [cx, cz, hx, hz] of RECTS) if (Math.abs(x - cx) < hx && Math.abs(z - cz) < hz) return true
  for (const [cx, cz, r] of CIRCLES) if (Math.hypot(x - cx, z - cz) < r) return true
  return false
}
function onRoad(x: number, z: number, margin: number): boolean {
  for (const r of ROADS) {
    if (inPoly(x, z, r.outer) && !r.holes.some((h) => inPoly(x, z, h))) return true
    if (edgeDist(x, z, r.outer) < margin || r.holes.some((h) => edgeDist(x, z, h) < margin)) return true
  }
  return false
}
const inWater = (x: number, z: number) => inPoly(x, z, WILD) || inPoly(x, z, KAYAK)

/** Dry lawn that nothing else occupies: the only place a shrub or bank tuft may stand. */
function freeLawn(x: number, z: number, roadMargin = 0.3, unitFront = 0.6): boolean {
  if (!inPoly(x, z, LAND) || edgeDist(x, z, LAND) < 0.6) return false
  if (inWater(x, z) || edgeDist(x, z, WILD) < 0.05 || edgeDist(x, z, KAYAK) < 0.05) return false
  if (inPoly(x, z, POOL_RIM) || edgeDist(x, z, POOL_RIM) < 0.3) return false
  if (onRoad(x, z, roadMargin)) return false
  if (nearUnit(x, z, 0.45, unitFront)) return false
  return !inKeepOut(x, z)
}

// ── planting ─────────────────────────────────────────────────────────────────────────────
export interface ShrubPlan {
  x: number
  z: number
  rad: number
  h: number
  /** 0 clipped evergreen, 1 golden duranta, 2 deep glossy green. */
  kind: number
  seed: number
}
/** A mulched bed under a drift of shrubs: a round-ended strip, `w` wide to each side. */
export interface BedPlan {
  x0: number
  z0: number
  x1: number
  z1: number
  w: number
  seed: number
}
export interface TuftPlan {
  x: number
  y: number
  z: number
  rad: number
  h: number
  blades: number
  /** 'reed' stands in the shallows, 'grass' on the bank, 'ti' is the red-leaved bed plant. */
  kind: 'reed' | 'grass' | 'ti'
  seed: number
}

/**
 * Planting beds as they appear in the venue's photos: drifts of low clipped shrubs, each
 * [x0, y0, x1, y1 (map px), number of shrubs, radius (world)]. Foundation planting around
 * the dining hall and the restrooms, low beds beside the pool and the Airstream, the
 * check-in unit and the entrance gate.
 */
const DRIFTS: [number, number, number, number, number, number][] = [
  // dining hall: either side of the front steps, along the south front, the two ends
  [367, 558, 386, 558, 4, 0.34], [426, 558, 445, 558, 4, 0.34],
  [370, 615, 395, 615, 5, 0.37], [427, 615, 445, 615, 4, 0.36],
  [357.5, 573, 357.5, 603, 6, 0.35], [454.5, 571, 454.5, 594, 5, 0.34],
  // restrooms
  [568, 592, 596, 592, 6, 0.32],
  // pool: beside the Airstream, the east lawn edge, the north-west corner
  [646, 437, 652, 445, 3, 0.31], [652, 470, 655, 485, 4, 0.33], [582, 442, 589, 435, 3, 0.31],
  // check-in
  [702, 579, 722, 579, 5, 0.29],
  // entrance gate, outside each post
  [892, 541, 899, 537, 3, 0.29], [892, 575, 899, 579, 3, 0.29],
]
/** Red ti plants that punctuate the beds: [x, y] in map px. */
const TI: Pt[] = [[389, 555.5], [423, 555.5], [364, 613], [450, 613], [399, 616], [423, 616], [563.5, 590.5], [600.5, 590.5], [659, 477], [591, 432], [697.5, 580], [726.5, 580]]

/** Reeds: how often clumps occur along each lake (the wild lake is the reedier one). */
const SHORES: { poly: P2[]; density: number; seed: number }[] = [
  { poly: WILD, density: 0.62, seed: 31 },
  { poly: KAYAK, density: 0.5, seed: 57 },
]

export function planPlanting(high: boolean): { shrubs: ShrubPlan[]; beds: BedPlan[]; tufts: TuftPlan[] } {
  const shrubs: ShrubPlan[] = []
  const beds: BedPlan[] = []
  const tufts: TuftPlan[] = []
  const rnd = mulberry32(4242)

  DRIFTS.forEach(([x0, y0, x1, y1, n, rad], d) => {
    const placed: ShrubPlan[] = []
    for (let i = 0; i < n; i++) {
      const t = n > 1 ? i / (n - 1) : 0.5
      const [x, z] = toWorld([x0 + (x1 - x0) * t + (rnd() - 0.5) * 1.6, y0 + (y1 - y0) * t + (rnd() - 0.5) * 1.6])
      const size = rad * (0.85 + rnd() * 0.35)
      if (freeLawn(x, z)) placed.push({ x, z, rad: size, h: size * (1.1 + rnd() * 0.45), kind: (i + d) % 3, seed: 5000 + d * 131 + i * 17 })
    }
    if (!placed.length) return
    shrubs.push(...placed)
    const a = placed[0]
    const b = placed[placed.length - 1]
    beds.push({ x0: a.x, z0: a.z, x1: b.x, z1: b.z, w: rad * 1.3, seed: 5900 + d })
  })
  TI.forEach((p, i) => {
    const [x, z] = toWorld(p)
    if (freeLawn(x, z)) tufts.push({ x, y: 0, z, rad: 0.16, h: 0.36 + rnd() * 0.12, blades: high ? 8 : 5, kind: 'ti', seed: 6000 + i * 173 })
  })

  // a little underplanting at the foot of the roadside and poolside palms
  for (const t of planTrees()) {
    if (t.species !== 'palm') continue
    const a0 = rnd() * 6.283
    let placed = 0
    for (let k = 0; k < 6 && placed < 3; k++) {
      const a = a0 + k * 1.05
      const d = 0.42 + rnd() * 0.2
      const x = t.x + Math.cos(a) * d
      const z = t.z + Math.sin(a) * d
      if (!freeLawn(x, z, 0.35)) continue
      if (placed === 2) tufts.push({ x, y: 0, z, rad: 0.14, h: 0.32 + rnd() * 0.1, blades: high ? 7 : 4, kind: 'ti', seed: 6500 + shrubs.length * 17 + k })
      else {
        const size = 0.21 + rnd() * 0.08
        shrubs.push({ x, z, rad: size, h: size * (1.1 + rnd() * 0.4), kind: placed ? 1 : 2, seed: 5600 + shrubs.length * 37 + k })
        beds.push({ x0: x, z0: z, x1: x, z1: z, w: size * 1.3, seed: 5950 + shrubs.length })
      }
      placed++
    }
  }

  // reeds in the shallows and grass clumps on the bank, in drifts along the lake margins
  const trunks = trees.map((t) => toWorld([t.x, t.y]))
  for (const shore of SHORES) {
    const poly = shore.poly
    let area = 0
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) area += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1]
    const out = area > 0 ? 1 : -1 // which way the outward normal of an edge points
    const step = high ? 0.34 : 0.6
    let s = 0
    let next = 0
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [ax, az] = poly[j]
      const [bx, bz] = poly[i]
      const len = Math.hypot(bx - ax, bz - az)
      const nx = ((bz - az) / (len || 1)) * out
      const nz = (-(bx - ax) / (len || 1)) * out
      while (next <= s + len) {
        const t = (next - s) / (len || 1)
        const px = ax + (bx - ax) * t
        const pz = az + (bz - az) * t
        const drift = vnoise(next * 0.21 + shore.seed, shore.seed * 1.7, 0.5)
        next += step * (0.75 + rnd() * 0.5)
        if (drift < 1 - shore.density * 0.72) continue
        const strength = (drift - (1 - shore.density * 0.72)) / (shore.density * 0.72)
        // leave the water in front of the units, the jetty and the bird perches open
        if (nearUnit(px, pz, 1.3, 3.2) || inKeepOut(px, pz)) continue
        if (rnd() < 0.7 + 0.3 * strength) {
          const d = 0.1 + rnd() * (0.25 + 0.35 * strength)
          const x = px - nx * d
          const z = pz - nz * d
          if (inWater(x, z) && !trunks.some(([tx, tz]) => Math.hypot(tx - x, tz - z) < 0.45))
            tufts.push({ x, y: -0.55, z, rad: 0.18 + rnd() * 0.1, h: 0.82 + rnd() * 0.28 + 0.12 * strength, blades: high ? 7 + Math.floor(rnd() * 3) : 4, kind: 'reed', seed: 7000 + tufts.length * 53 })
        }
        if (rnd() < 0.34) {
          const d = 0.1 + rnd() * 0.22
          const x = px + nx * d
          const z = pz + nz * d
          if (freeLawn(x, z, 0.2, 2.6) && !trunks.some(([tx, tz]) => Math.hypot(tx - x, tz - z) < 0.4))
            tufts.push({ x, y: -0.12, z, rad: 0.13 + rnd() * 0.07, h: 0.36 + rnd() * 0.16, blades: high ? 6 + Math.floor(rnd() * 3) : 4, kind: 'grass', seed: 7000 + tufts.length * 53 })
        }
      }
      s += len
    }
  }
  return { shrubs, beds, tufts }
}
