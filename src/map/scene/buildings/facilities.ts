import * as THREE from 'three'
import { layout, poi, toWorld, type Pt } from '../../layout/layout'
import { PALETTE, type Quality } from '../env'
import { DECK_Y, LAMP, Wd, ZONE_STYLE, emitCamper } from './camper'
import { BAND, Mesher, at, ball, box, cyl, lathe, loft, prism, rbox, sheet, tone, type Part, type Style } from './geo'
import { stripeFreq as F } from './textures'

/**
 * Every facility of the camp, restyled as one finely made model: each place keeps the
 * position, footprint and orientation it had (all taken from the traced layout), but is
 * built from softly bevelled parts that are merged into a handful of shared geometries
 * (one per material), so the whole set costs about a dozen draw calls.
 */
type P3 = [number, number, number]

const K = {
  trim: '#2f3437',
  steel: '#2a2e31',
  roofEdge: '#30363a',
  slate: '#737b7f',
  skirt: '#25282a',
  timber: PALETTE.deck,
  timberLight: '#c39a6b',
  cedar: '#b98a5b',
  cedarDark: '#7b563a',
  cedarLight: PALETTE.cedar,
  walnut: '#5b4636',
  cream: PALETTE.cream,
  white: PALETTE.white,
  stone: '#aaa59a',
  concrete: '#cfcabd',
  gravel: '#dccfab',
  leaf: '#4f8f47',
  leafDark: '#3a7a3f',
  soil: '#5c4a3a',
  brick: '#b0624a',
  ash: '#35312e',
  log: '#7a5a3f',
  logEnd: '#cfae7e',
  canvasTan: '#c6ae86',
  canvasLight: '#e8dec9',
  lounger: '#3a3f42',
  cushion: '#a8a399',
  bulb: '#fff0cf',
  orange: '#ff8f3a',
  kayak: '#f2c230',
  blue: '#3f6fb5',
  green: '#2f9e6a',
  red: '#c4553f',
  alu: '#e2e7ea',
  tyre: '#1f2123',
}
const WARM = '#ffb060'
// finishes: sheet metal and painted steel catch the low sun; canvas, stone and gravel do not
Mesher.finishes({
  [K.steel]: 0.55,
  [K.slate]: 0.48,
  [K.timber]: 0.8,
  [K.timberLight]: 0.7,
  [K.cedar]: 0.8,
  [K.cedarDark]: 0.82,
  [K.cedarLight]: 0.78,
  [K.walnut]: 0.5,
  [K.cream]: 0.8,
  [K.stone]: 0.94,
  [K.concrete]: 0.94,
  [K.gravel]: 0.96,
  [K.leaf]: 0.95,
  [K.leafDark]: 0.95,
  [K.brick]: 0.92,
  [K.canvasTan]: 0.96,
  [K.canvasLight]: 0.96,
  [K.lounger]: 0.6,
  [K.cushion]: 0.96,
  [K.kayak]: 0.4,
  [K.blue]: 0.5,
  [K.red]: 0.6,
  [K.tyre]: 0.92,
})

export interface Pool {
  m: THREE.Matrix4
  color: THREE.Color
}

interface Out {
  mass: Mesher
  detail: Mesher
  glass: Mesher
  hall: Mesher
  metal: Mesher
  glow: Mesher
  pools: Pool[]
  hi: boolean
  q: Quality
}

const site = (name: string): [number, number] => toWorld(poi(name))
const all = (o: Out) => [o.mass, o.detail, o.glass, o.hall, o.metal, o.glow]
/** Enter a local frame in every mesher at once. */
function enter(o: Out, m: THREE.Matrix4) {
  for (const b of all(o)) b.push(m)
  return m
}
function leave(o: Out) {
  for (const b of all(o)) b.pop()
}

/** A soft pool of light (dusk only). `m` places a unit quad lying in XZ. */
function pool(o: Out, frame: THREE.Matrix4 | null, x: number, y: number, z: number, sx: number, sz: number, k: number, color = WARM, rx = 0) {
  const m = at(x, y, z, 0, rx).scale(new THREE.Vector3(sx, 1, sz))
  if (frame) m.premultiply(frame)
  o.pools.push({ m, color: new THREE.Color(color).multiplyScalar(k) })
}

/** Vertical quad facing +Z (for glazing). */
function pane(w: number, h: number): Part {
  return { p: [-w / 2, -h / 2, 0, w / 2, -h / 2, 0, w / 2, h / 2, 0, -w / 2, h / 2, 0], n: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], i: [0, 1, 2, 0, 2, 3] }
}

/** Cedar planter tub with a clipped shrub. */
function planter(o: Out, x: number, z: number, w = 0.46, d = 0.46, h = 0.22, ry = 0) {
  o.mass.add(rbox(w, h, d, 0.025), { color: K.cedarDark, band: BAND.slat, axis: 'x', freq: F(0.05) }, at(x, h / 2, z, ry))
  o.detail.add(box(w - 0.07, 0.02, d - 0.07), { color: K.soil }, at(x, h + 0.002, z, ry))
  const shrub = ball(1, o.hi ? 10 : 7, o.hi ? 6 : 4)
  const n = w > d * 1.5 ? 3 : 1
  for (let k = 0; k < n; k++) {
    const off = n === 1 ? 0 : (k - 1) * (w / 3.2)
    const m = at(x + Math.cos(ry) * off, h + 0.1, z - Math.sin(ry) * off).scale(new THREE.Vector3(Math.min(w, d) * 0.46, 0.17, Math.min(w, d) * 0.46))
    o.mass.add(shrub, { color: k % 2 ? K.leaf : K.leafDark }, m)
  }
}

/** Low bollard path light, as along the camp's roads. */
function bollard(o: Out, x: number, z: number) {
  const seg = o.hi ? 8 : 6
  o.detail.add(cyl(0.036, 0.032, 0.2, seg), { color: K.steel }, at(x, 0, z))
  o.glow.add(cyl(0.04, 0.04, 0.05, seg), { color: K.bulb, a: 1 }, at(x, 0.2, z))
  o.detail.add(cyl(0.05, 0.036, 0.022, seg), { color: K.steel }, at(x, 0.25, z))
  pool(o, null, x, 0.05, z, 2.3, 2.3, 0.3)
}

/** Festoon lights: slim poles with a sagging run of warm bulbs between them. */
function festoon(o: Out, pts: P3[], per: number, sag = 0.14, poles = true) {
  const bulb = ball(0.034, o.hi ? 6 : 4, o.hi ? 4 : 2)
  for (let k = 0; k < pts.length; k++) {
    const [x, y, z] = pts[k]
    if (poles) {
      o.detail.add(cyl(0.022, 0.016, y, 6), { color: K.steel }, at(x, 0, z))
      o.detail.add(cyl(0.07, 0.05, 0.03, 8), { color: K.steel }, at(x, 0, z))
    }
    if (k === pts.length - 1) break
    const b = pts[k + 1]
    const n = o.hi ? per : Math.max(3, Math.round(per * 0.6))
    for (let j = 0; j < n; j++) {
      const t = (j + 0.5) / n
      o.glow.add(bulb, { color: K.bulb, a: 1 }, at(x + (b[0] - x) * t, y + (b[1] - y) * t - sag * Math.sin(Math.PI * t) - 0.03, z + (b[2] - z) * t))
    }
    if (o.hi) {
      // the cable, as a few straight runs
      const cuts = 4
      let prev: P3 = [x, y - 0.01, z]
      for (let j = 1; j <= cuts; j++) {
        const t = j / cuts
        const next: P3 = [x + (b[0] - x) * t, y + (b[1] - y) * t - sag * Math.sin(Math.PI * t) - 0.01, z + (b[2] - z) * t]
        o.detail.beam(prev, next, 0.01, { color: K.steel })
        prev = next
      }
    }
  }
}

/** Finger-post sign: charcoal post, cedar blade, small lamp on top. */
function signPost(o: Out, x: number, z: number, ry: number, plate = K.cedarLight, h = 1.25) {
  o.detail.add(cyl(0.026, 0.022, h, 6), { color: K.steel }, at(x, 0, z))
  o.detail.add(rbox(0.5, 0.2, 0.04, 0.015), { color: plate }, at(x + Math.cos(ry) * 0.27, h - 0.16, z - Math.sin(ry) * 0.27, ry))
  o.glow.add(ball(0.04, o.hi ? 8 : 5, o.hi ? 5 : 3), { color: K.bulb, a: 0.9 }, at(x, h + 0.03, z))
}

/** Slatted garden bench. */
function bench(o: Out, m: THREE.Matrix4, color = K.cedar, w = 0.5) {
  o.detail.push(m)
  o.detail.add(rbox(w, 0.03, 0.15, 0.01), { color, band: BAND.plank, axis: 'z', freq: F(0.05) }, at(0, 0.115, 0))
  o.detail.add(rbox(w, 0.12, 0.025, 0.01), { color }, at(0, 0.21, -0.075, 0, -0.15))
  for (const sx of [-1, 1]) o.detail.add(box(0.025, 0.1, 0.13), { color: K.steel }, at(sx * (w / 2 - 0.05), 0.05, 0))
  o.detail.pop()
}

// --------------------------------------------------------------------------------------------
/** Entrance (入口): timber portal with lanterns, at the place the map marks. */
function gate(o: Out) {
  const [x, z] = site('entrance')
  const f = enter(o, at(x, 0, z))
  for (const s of [-1, 1]) {
    o.mass.add(rbox(0.4, 0.26, 0.4, 0.03), { color: K.stone }, at(0, 0.13, s * 1.1))
    o.mass.add(rbox(0.24, 1.62, 0.24, 0.028, o.hi ? 2 : 1), { color: K.cedarDark }, at(0, 0.26 + 0.81, s * 1.1))
    // lantern on the inner face of each post
    o.detail.add(box(0.05, 0.03, 0.2), { color: K.steel }, at(0, 1.42, s * 0.9))
    o.detail.add(box(0.09, 0.03, 0.09), { color: K.steel }, at(0, 1.37, s * 0.82))
    o.glow.add(rbox(0.075, 0.13, 0.075, 0.015), { color: K.bulb, a: 1 }, at(0, 1.29, s * 0.82))
    o.detail.add(box(0.09, 0.02, 0.09), { color: K.steel }, at(0, 1.215, s * 0.82))
    pool(o, f, 0, 0.05, s * 0.8, 2.6, 2.6, 0.38)
    planter(o, 0, s * 1.62, 0.44, 0.44, 0.24)
  }
  o.mass.add(rbox(0.3, 0.26, 2.9, 0.03, o.hi ? 2 : 1), { color: K.cedar, band: BAND.plank, axis: 'y', freq: F(0.09) }, at(0, 1.85, 0))
  // shallow pitched cap in seamed metal over the beam
  o.mass.add(
    prism(
      [
        [-0.3, 0],
        [0.3, 0],
        [0.3, 0.03],
        [0, 0.13],
        [-0.3, 0.03],
      ],
      3.16,
      0.012,
      0.012,
    ),
    { color: K.slate, band: BAND.seam, axis: 'z', freq: F(0.2) },
    at(0, 1.985, 0),
  )
  // hanging name board (left plain: no lettering)
  o.detail.add(rbox(0.06, 0.26, 1.3, 0.02), { color: K.cedarLight }, at(0, 1.5, 0))
  for (const s of [-1, 1]) o.detail.add(box(0.02, 0.1, 0.02), { color: K.steel }, at(0, 1.68, s * 0.5))
  // lifting barrier beside the portal
  o.detail.add(rbox(0.12, 0.5, 0.12, 0.015), { color: K.steel }, at(0.6, 0.25, 1.1))
  o.detail.add(rbox(0.045, 0.045, 1.5, 0.012), { color: K.white }, at(0.6, 0.52, 0.4))
  for (const k of [0, 1]) o.detail.add(box(0.05, 0.05, 0.16), { color: K.red }, at(0.6, 0.52, -0.1 + k * 0.5))
  leave(o)
}

/** Check-in (報到處): one of the camp's own units serves as the reception. */
function checkIn(o: Out) {
  const [x, z] = site('checkin')
  const f = enter(o, at(x, 0, z, Math.PI))
  emitCamper({ mass: o.mass, detail: o.detail, glass: o.glass, bulbs: o.glow }, o.q, ZONE_STYLE.B)
  pool(o, f, LAMP[0] - 0.12, DECK_Y + 0.016, Wd / 2 + 0.42, 1.6, 1.3, 0.5)
  signPost(o, 1.12, 0.78, 0, K.cedarLight, 1.3)
  bench(o, at(-1.15, 0, 0.62, Math.PI / 2))
  planter(o, 1.12, 0.25, 0.36, 0.36, 0.2)
  leave(o)
}

/**
 * Bambi Grand Dining Hall (斑比大飯店): a dark steel-and-glass hall with floor-to-ceiling
 * windows on a timber terrace. Inside: the buffet counter, tables and hanging bulb lights,
 * which make the whole hall glow at dusk.
 */
export const HALL = { W: 7.6, D: 3.6, H: 1.9, PL: 0.3 }
export const hallCentre = (): P3 => {
  const [x, z] = site('dining')
  return [x, 0, z + 0.6]
}
function diningHall(o: Out) {
  const { W, D, H, PL } = HALL
  const c = hallCentre()
  const f = enter(o, at(c[0], 0, c[2]))
  // terrace
  o.mass.add(box(W + 0.8, PL - 0.04, D + 0.8), { color: K.skirt }, at(0, (PL - 0.04) / 2, 0))
  o.mass.add(rbox(W + 0.9, 0.06, D + 0.9, 0.02), { color: K.timber, band: BAND.plank, axis: 'z', freq: F(0.07) }, at(0, PL - 0.03, 0))
  o.detail.add(box(W - 0.1, 0.014, D - 0.1), { color: K.timberLight, band: BAND.plank, axis: 'x', freq: F(0.09) }, at(0, PL + 0.007, 0))
  // steel frame
  const steel: Style = { color: K.steel }
  const yb = PL
  for (let i = 0; i <= 8; i++) {
    for (const s of [-1, 1]) o.detail.add(box(0.08, H, 0.08), steel, at(-W / 2 + (i * W) / 8, yb + H / 2, (s * D) / 2))
  }
  for (let j = 1; j < 4; j++) {
    for (const s of [-1, 1]) o.detail.add(box(0.08, H, 0.08), steel, at((s * W) / 2, yb + H / 2, -D / 2 + (j * D) / 4))
  }
  for (const [h, t] of [
    [0.04, 0.08],
    [H * 0.6, 0.06],
    [H * 0.8, 0.05],
    [H - 0.05, 0.1],
  ]) {
    for (const s of [-1, 1]) {
      o.detail.add(box(W + 0.08, t, 0.085), steel, at(0, yb + h, (s * D) / 2))
      o.detail.add(box(0.085, t, D + 0.08), steel, at((s * W) / 2, yb + h, 0))
    }
  }
  if (o.hi) {
    // the upper lights are divided once more, as in the real hall
    for (let i = 0; i < 8; i++) {
      for (const s of [-1, 1]) o.detail.add(box(0.045, H * 0.4, 0.06), steel, at(-W / 2 + ((i + 0.5) * W) / 8, yb + H * 0.8, (s * D) / 2))
    }
  }
  // glazing
  const gh = H - 0.04
  for (const s of [-1, 1]) {
    o.hall.add(pane(W, gh), { color: '#ffffff' }, at(0, yb + 0.04 + gh / 2, (s * D) / 2, s > 0 ? 0 : Math.PI))
    o.hall.add(pane(D, gh), { color: '#ffffff' }, at((s * W) / 2, yb + 0.04 + gh / 2, 0, (s * Math.PI) / 2))
  }
  // roof: deep dark fascia, seamed metal on top
  o.mass.add(rbox(W + 1.0, 0.17, D + 1.0, 0.045, o.hi ? 2 : 1), { color: K.roofEdge }, at(0, yb + H + 0.085, 0))
  o.detail.add(box(W + 0.72, 0.03, D + 0.72), { color: K.slate, band: BAND.seam, axis: 'x', freq: F(0.3) }, at(0, yb + H + 0.17 + 0.01, 0))
  // warm timber soffit, seen from below the eaves
  o.detail.add(box(W + 0.9, 0.012, D + 0.9), { color: K.cedar }, at(0, yb + H - 0.012, 0))

  // inside: buffet counter along the north wall, two rows of tables, hanging bulbs
  o.detail.add(rbox(3.0, 0.24, 0.32, 0.02), { color: K.cedar, band: BAND.slat, axis: 'x', freq: F(0.05) }, at(-1.7, yb + 0.12, -D / 2 + 0.5))
  o.detail.add(rbox(3.08, 0.03, 0.38, 0.012), { color: K.walnut }, at(-1.7, yb + 0.255, -D / 2 + 0.5))
  const tableTop = rbox(0.62, 0.03, 0.27, 0.012)
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 6; i++) {
      const tx = -3.0 + i * 1.2
      const tz = 0.05 + row * 0.95
      o.detail.add(tableTop, { color: K.walnut }, at(tx, yb + 0.2, tz))
      for (const s of [-1, 1]) o.detail.add(box(0.03, 0.185, 0.2), { color: K.steel }, at(tx + s * 0.24, yb + 0.0925, tz))
      if (o.hi) {
        for (const sx of [-0.16, 0.16]) {
          for (const sz of [-1, 1]) {
            o.detail.add(box(0.1, 0.012, 0.1), { color: K.canvasLight }, at(tx + sx, yb + 0.115, tz + sz * 0.21))
            o.detail.add(box(0.1, 0.1, 0.012), { color: K.canvasLight }, at(tx + sx, yb + 0.17, tz + sz * 0.26))
          }
        }
      }
    }
  }
  const bulb = ball(0.042, o.hi ? 6 : 4, o.hi ? 4 : 2)
  const nx = o.hi ? 12 : 7
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < 3; j++) {
      const bx = -W / 2 + 0.5 + (i * (W - 1.0)) / (nx - 1)
      const bz = -D / 2 + 0.6 + j * ((D - 1.2) / 2)
      o.glow.add(bulb, { color: K.bulb, a: 1 }, at(bx, yb + H - 0.42 - ((i + j) % 2) * 0.1, bz))
    }
  }
  pool(o, f, 0, yb + 0.03, 0, W * 1.3, D * 1.6, 0.8)
  // light spilling onto the terrace and the lawn around it
  pool(o, f, 0, 0.05, 0, W + 8, D + 8, 0.5)

  // entrance on the road (north) side: canopy, steps and handrails
  const ex = 1.45
  const tz = -(D + 0.9) / 2
  o.detail.add(rbox(1.5, 0.05, 0.55, 0.015), { color: K.roofEdge }, at(ex, yb + H * 0.6 + 0.06, -D / 2 - 0.3))
  for (let k = 0; k < 2; k++) {
    o.mass.add(
      rbox(2.3, 0.1, 0.32, 0.012),
      { color: K.timber, band: BAND.plank, axis: 'z', freq: F(0.07) },
      at(ex, PL - 0.1 * (k + 1) - 0.05 + 0.0, tz - 0.16 - k * 0.3),
    )
  }
  for (const s of [-1, 1]) {
    const hx = ex + s * 1.15
    o.detail.beam([hx, PL + 0.3, tz + 0.1], [hx, 0.3, tz - 0.6], 0.022, steel)
    o.detail.add(box(0.022, 0.3, 0.022), steel, at(hx, PL + 0.15, tz + 0.1))
    o.detail.add(box(0.022, 0.3, 0.022), steel, at(hx, 0.15, tz - 0.6))
  }
  // planters along the south terrace, festoon lights round the terrace edge
  for (const px of [-3.1, -1.05, 1.05, 3.1]) planter(o, px, D / 2 + 0.26, 0.9, 0.2, 0.2)
  const ey = PL + 1.05
  const cx = W / 2 + 0.36
  const cz = D / 2 + 0.36
  festoon(
    o,
    [
      [-cx, ey, -cz],
      [-cx, ey, cz],
      [0, ey, cz],
      [cx, ey, cz],
      [cx, ey, -cz],
    ],
    7,
    0.12,
  )
  leave(o)
}

/** Restrooms and showers, with the AED cabinet on the east wall (洗手間・AED). */
function restrooms(o: Out) {
  const [x1, z1] = site('restroom')
  const [x2] = site('aed')
  const f = enter(o, at((x1 + x2) / 2, 0, z1))
  const W = 3.2
  const D = 1.3
  o.detail.add(box(W + 0.06, 0.07, D + 0.06), { color: K.skirt }, at(0, 0.035, 0))
  o.mass.add(rbox(W, 1.0, D, 0.03, o.hi ? 2 : 1), { color: K.cream }, at(0, 0.06 + 0.5, 0))
  o.mass.add(rbox(W + 0.7, 0.09, D + 0.4, 0.03), { color: K.roofEdge }, at(0, 1.06 + 0.045, 0))
  o.detail.add(box(W + 0.5, 0.02, D + 0.2), { color: K.slate, band: BAND.seam, axis: 'x', freq: F(0.25) }, at(0, 1.15 + 0.012, 0))
  // cedar slat screens at both ends, and a cedar band on the long walls
  for (const s of [-1, 1]) {
    o.mass.add(box(0.05, 0.92, D * 0.8), { color: K.cedar, band: BAND.slat, axis: 'z', freq: F(0.045) }, at(s * (W / 2 + 0.28), 0.06 + 0.46, 0.05))
    o.detail.add(box(W * 0.36, 0.5, 0.03), { color: K.cedar, band: BAND.slat, axis: 'x', freq: F(0.045) }, at(s * 0.85, 0.36, D / 2 + 0.003))
    // high strip windows, both long sides
    for (const sz of [-1, 1]) {
      o.detail.add(box(1.0, 0.2, 0.03), { color: K.steel }, at(s * 0.85, 0.83, sz * (D / 2 + 0.003)))
      o.glass.add(box(0.92, 0.13, 0.02), { color: '#ffffff', a: 0.9 }, at(s * 0.85, 0.83, sz * (D / 2 + 0.022)))
    }
    // doors on the road side, with a lamp over each
    o.detail.add(box(0.3, 0.64, 0.03), { color: K.steel }, at(s * 0.85, 0.06 + 0.32, -(D / 2 + 0.003)))
    o.glow.add(rbox(0.1, 0.035, 0.05, 0.012), { color: K.bulb, a: 1 }, at(s * 0.85, 0.74, -(D / 2 + 0.03)))
    pool(o, f, s * 0.85, 0.05, -(D / 2 + 0.6), 1.9, 1.7, 0.4)
  }
  // AED cabinet: white box with a green cross, on the east wall
  o.detail.add(rbox(0.035, 0.26, 0.2, 0.01), { color: K.white }, at(W / 2 + 0.018, 0.62, 0.3))
  o.detail.add(box(0.02, 0.15, 0.045), { color: K.green }, at(W / 2 + 0.036, 0.62, 0.3))
  o.detail.add(box(0.02, 0.045, 0.15), { color: K.green }, at(W / 2 + 0.036, 0.62, 0.3))
  planter(o, -W / 2 - 0.05, D / 2 + 0.32, 0.4, 0.4, 0.2)
  leave(o)
}

/** Drinking water (飲水機): stainless fountain on a small paved pad. */
function drinkingWater(o: Out) {
  const [x, z] = site('water')
  enter(o, at(x, 0, z))
  o.detail.add(rbox(0.62, 0.035, 0.5, 0.015), { color: K.concrete }, at(0, 0.0175, 0))
  const seg = o.hi ? 12 : 8
  o.metal.add(
    lathe(
      [
        [0.085, 0.03],
        [0.07, 0.34],
        [0.13, 0.46],
        [0.14, 0.5],
        [0.14, 0.5],
        [0.11, 0.5],
        [0.07, 0.465],
        [0, 0.46],
      ],
      seg,
    ),
    { color: K.alu },
  )
  o.metal.add(cyl(0.012, 0.012, 0.06, 5), { color: K.alu }, at(0.07, 0.48, 0))
  o.detail.add(cyl(0.02, 0.018, 0.75, 6), { color: K.steel }, at(-0.24, 0, -0.17))
  o.detail.add(rbox(0.19, 0.19, 0.03, 0.03), { color: K.blue }, at(-0.24, 0.7, -0.17 + 0.02))
  leave(o)
}

// ---- Airstream ---------------------------------------------------------------------------------
const AIR = { half: 1.45, cap: 0.52, w: 0.475, y0: 0.3, y1: 1.15 }
const airMid = (AIR.y0 + AIR.y1) / 2
const airHh = (AIR.y1 - AIR.y0) / 2
/** Cross-section scale along the trailer: 1 on the straight body, down to 0 at the rounded ends. */
function airScale(x: number) {
  const d = (Math.abs(x) - (AIR.half - AIR.cap)) / AIR.cap
  if (d <= 0) return 1
  if (d >= 1) return 0
  return Math.pow(Math.sin(Math.acos(Math.pow(d, 1.25))), 0.8)
}
/** Half-width of the shell at (x, y): rounder roof, squarer belly. */
function airZ(x: number, y: number) {
  const s = airScale(x)
  if (s <= 0) return 0
  const v = (y - airMid) / (airHh * s)
  if (Math.abs(v) >= 1) return 0
  const n = v > 0 ? 2.5 : 4
  return AIR.w * s * Math.pow(1 - Math.pow(Math.abs(v), n), 1 / n)
}
/** A window that follows the shell: a patch over x0..x1, y0..y1 on side `sz`, pushed out a little. */
function airPatch(x0: number, x1: number, y0: number, y1: number, sz: number, nu: number, nv: number, out = 0.016): Part {
  const pos = (x: number, y: number): P3 => [x, y, sz * airZ(x, y)]
  const part = sheet(nu, nv, (u, v) => {
    const x = x0 + (x1 - x0) * u
    const y = y0 + (y1 - y0) * v
    const e = 0.01
    const p = pos(x, y)
    const dx = pos(x + e, y)
    const dy = pos(x, y + e)
    const ax = dx[0] - p[0]
    const az = dx[2] - p[2]
    const by = dy[1] - p[1]
    const bz = dy[2] - p[2]
    // normal = d/dx cross d/dy, flipped to point away from the axis
    let nx = -az * by
    let ny = -ax * bz
    let nz = ax * by
    const l = Math.hypot(nx, ny, nz) || 1
    const flip = nz * sz < 0 ? -1 : 1
    nx = (nx / l) * flip
    ny = (ny / l) * flip
    nz = (nz / l) * flip
    return [p[0] + nx * out, p[1] + ny * out, p[2] + nz * out]
  })
  // make it face outwards
  if (part.n[2] * sz < 0) {
    for (let k = 0; k < part.i.length; k += 3) [part.i[k + 1], part.i[k + 2]] = [part.i[k + 2], part.i[k + 1]]
    for (let k = 0; k < part.n.length; k++) part.n[k] = -part.n[k]
  }
  return part
}

export const SNACK_DECK_Y = 0.16
/** Placement of the snack shop: local +Z faces the pool. */
export function snackFrame(): THREE.Matrix4 {
  const [ax, az] = site('airstreamSpot')
  const face = poi('airstreamFace')
  return at(ax, 0, az, Math.atan2(face[0], face[1]))
}
/** The roof sign's centre, size and frame (a plane facing the pool). */
export const SNACK_SIGN = { y: 1.53, w: 2.4, h: 0.3 }

/**
 * Pool side: the polished-aluminium Airstream snack shop on its timber deck, right at the
 * pool's edge, with the serving hatch facing the water, globe lamps and the roof sign frame;
 * loungers, parasols and chairs around the pool.
 */
function poolSide(o: Out) {
  const f = enter(o, snackFrame())
  const DY = SNACK_DECK_Y
  // deck
  o.mass.add(rbox(3.6, 0.06, 1.9, 0.02), { color: K.timber, band: BAND.plank, axis: 'z', freq: F(0.06) }, at(0, DY - 0.03, 0.2))
  o.detail.add(box(3.54, 0.5, 1.84), { color: K.skirt }, at(0, DY - 0.06 - 0.25, 0.2))
  // shell
  const KR = o.hi ? 22 : 14
  const as = o.hi ? [0.1, 0.24, 0.4, 0.56, 0.72, 0.87, 1] : [0.14, 0.4, 0.7, 1]
  const xs: number[] = []
  for (const a of as) xs.push(-AIR.half + AIR.cap * (1 - Math.pow(Math.cos((a * Math.PI) / 2), 0.8)))
  const stations = [...xs, ...xs.map((v) => -v).reverse()]
  const rings: P3[][] = stations.map((sx) => {
    const s = airScale(sx)
    const ring: P3[] = []
    for (let k = 0; k < KR; k++) {
      const t = (k / KR) * Math.PI * 2
      const cs = Math.cos(t)
      const sn = Math.sin(t)
      const e = 2 / (sn > 0 ? 2.5 : 4)
      ring.push([sx, DY + airMid + airHh * s * Math.sign(sn) * Math.pow(Math.abs(sn), e), AIR.w * s * Math.sign(cs) * Math.pow(Math.abs(cs), e)])
    }
    return ring
  })
  o.metal.add(loft(rings), { color: K.alu, band: BAND.panel, axis: 'x', freq: F(0.34) })
  // windows that follow the shell; the serving hatch glows brightest
  const g = (a: number): Style => ({ color: '#ffffff', a })
  const up = at(0, DY, 0)
  const wy0 = 0.72
  const wy1 = 0.98
  const nu = o.hi ? 6 : 3
  o.glass.add(airPatch(-0.42, 0.78, 0.66, 1.0, 1, nu, 2, 0.02), g(1.0), up) // serving hatch
  o.glass.add(airPatch(-0.86, -0.6, wy0, wy1, 1, 2, 2), g(0.6), up)
  for (const [a, b] of [
    [-0.82, -0.36],
    [-0.16, 0.3],
    [0.5, 0.86],
  ]) {
    o.glass.add(airPatch(a, b, wy0, wy1, -1, 2, 2), g(0.6), up)
  }
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) o.glass.add(airPatch(sx * 1.0, sx * 1.37, wy0, wy1, sz, nu, 2), g(0.6), up) // wrap-round end windows
  }
  // hatch flap propped open over the counter, and the counter shelf
  const hz = airZ(0.18, 0.98)
  o.metal.add(rbox(1.24, 0.02, 0.2, 0.008), { color: K.alu }, at(0.18, DY + 1.035, hz + 0.09, 0, -0.5))
  for (const sx of [-0.4, 0.76]) o.detail.beam([sx, DY + 0.86, airZ(sx, 0.86) + 0.01], [sx, DY + 1.07, hz + 0.17], 0.012, { color: K.steel })
  o.detail.add(rbox(1.26, 0.03, 0.16, 0.01), { color: K.cedar }, at(0.18, DY + 0.645, airZ(0.18, 0.645) + 0.07))
  // running gear
  const seg = o.hi ? 14 : 8
  for (const wx of [-0.17, 0.13]) {
    for (const sz of [-1, 1]) {
      o.detail.add(cyl(0.13, 0.13, 0.07, seg, true), { color: K.tyre }, at(wx, DY + 0.13, sz * 0.42 - 0.035, 0, Math.PI / 2))
      o.metal.add(cyl(0.07, 0.06, 0.012, seg), { color: K.alu }, at(wx, DY + 0.13, sz * 0.455, 0, (sz * Math.PI) / 2))
    }
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) o.detail.add(box(0.04, AIR.y0 + 0.02, 0.04), { color: K.steel }, at(sx * 1.0, DY + (AIR.y0 + 0.02) / 2, sz * 0.3))
  // tow hitch and jockey wheel
  for (const sz of [-1, 1]) o.detail.beam([-1.25, DY + 0.3, sz * 0.22], [-1.72, DY + 0.3, 0], 0.035, { color: K.steel })
  o.detail.add(cyl(0.02, 0.02, 0.3, 6), { color: K.steel }, at(-1.66, DY, 0))
  // roof: vent hoods and the sign's frame (the letters are a separate, glowing plane)
  o.metal.add(rbox(0.34, 0.07, 0.26, 0.03), { color: K.alu }, at(-0.75, DY + AIR.y1 + 0.02, 0))
  o.detail.add(rbox(0.3, 0.06, 0.3, 0.025), { color: K.white }, at(0.7, DY + AIR.y1 + 0.02, 0))
  const sy = SNACK_SIGN.y
  const roofY = DY + AIR.y1 - 0.06
  for (const sx of [-1.05, 1.05]) o.detail.add(box(0.025, sy - 0.18 - roofY, 0.025), { color: K.steel }, at(sx, (sy - 0.18 + roofY) / 2, -0.02))
  o.detail.add(box(SNACK_SIGN.w + 0.06, 0.022, 0.022), { color: K.steel }, at(0, sy - 0.18, -0.02))
  // globe lamps along the deck edge
  const globes: [number, number, number][] = [
    [-1.45, 1.0, 0.15],
    [-1.12, 1.02, 0.09],
    [0.92, 1.0, 0.1],
    [1.22, 1.03, 0.16],
    [1.5, 0.92, 0.08],
  ]
  for (const [gx, gz, r] of globes) {
    o.glow.add(ball(r, o.hi ? 14 : 8, o.hi ? 9 : 5), { color: '#fff4dc', a: 0.6 }, at(gx, DY + r * 0.96, gz))
    pool(o, f, gx, DY + 0.016, gz, r * 9, r * 9, 0.4)
  }
  pool(o, f, 0.18, DY + 0.016, 0.75, 3.2, 1.6, 0.42)
  pool(o, f, 0, 0.05, 0.4, 7, 5.5, 0.3)
  // bench on the deck and a clipped hedge beside it
  bench(o, at(-0.95, DY, 0.7, 0), K.red, 0.46)
  planter(o, 2.05, -0.25, 0.32, 0.32, 0.2)
  planter(o, 2.05, 0.55, 0.32, 0.32, 0.2)
  leave(o)

  // loungers on the west side of the pool (feet toward the water), parasols between them
  for (const p of [
    [580, 463],
    [578, 479],
    [580, 495],
  ] as Pt[]) {
    const [x, z] = toWorld(p)
    enter(o, at(x, 0, z))
    o.mass.add(rbox(0.86, 0.035, 0.3, 0.012), { color: K.lounger }, at(0, 0.15, 0))
    for (const sx of [-0.34, 0.34]) for (const sz of [-0.12, 0.12]) o.detail.add(box(0.025, 0.15, 0.025), { color: K.lounger }, at(sx, 0.075, sz))
    o.detail.add(rbox(0.5, 0.035, 0.26, 0.014), { color: K.cushion }, at(0.16, 0.185, 0))
    o.detail.add(rbox(0.36, 0.035, 0.26, 0.014), { color: K.cushion }, at(-0.24, 0.26, 0, 0, 0, -0.5))
    leave(o)
  }
  const parasol = (x: number, z: number) => {
    const seg = o.hi ? 16 : 8
    o.detail.add(cyl(0.11, 0.09, 0.04, 8), { color: K.concrete }, at(x, 0, z))
    o.detail.add(cyl(0.016, 0.016, 0.95, 6), { color: K.steel }, at(x, 0, z))
    o.mass.add(
      lathe(
        [
          [0.43, 0.8],
          [0.43, 0.815],
          [0.23, 0.9],
          [0.035, 0.96],
          [0, 0.965],
        ],
        seg,
      ),
      { color: K.canvasLight },
      at(x, 0, z),
    )
    o.detail.add(
      lathe(
        [
          [0, 0.95],
          [0.035, 0.945],
          [0.23, 0.885],
          [0.43, 0.8],
        ],
        seg,
      ),
      { color: tone(K.canvasLight, 0.8) },
      at(x, 0, z),
    )
  }
  if (POOL_PARASOLS) {
    parasol(-2.45, 7.1)
    parasol(-2.5, 8.7)
  }
  // festoon lights behind the loungers
  festoon(
    o,
    [
      [-3.15, 1.1, 7.3],
      [-3.25, 1.1, 9.0],
      [-3.15, 1.1, 10.6],
    ],
    6,
  )
  // low chairs on the east side of the pool, facing the water
  for (const p of [
    [656, 466],
    [657, 479],
    [655, 492],
  ] as Pt[]) {
    const [x, z] = toWorld(p)
    enter(o, at(x, 0, z, -Math.PI / 2))
    o.detail.add(rbox(0.17, 0.02, 0.17, 0.008), { color: K.cedarDark }, at(0, 0.085, 0, 0, -0.14))
    o.detail.add(rbox(0.17, 0.2, 0.02, 0.008), { color: K.cedarDark }, at(0, 0.17, -0.1, 0, -0.38))
    for (const sx of [-0.095, 0.095]) {
      o.detail.add(box(0.016, 0.085, 0.016), { color: K.cedarDark }, at(sx, 0.0425, 0.07))
      o.detail.add(box(0.02, 0.014, 0.2), { color: K.cedarDark }, at(sx, 0.135, -0.01))
    }
    leave(o)
  }
}
/** The brief asks for parasols by the loungers; the venue's photos show loungers only. */
export const POOL_PARASOLS = true

/** Campfire circle (營火區): brick fire ring with stacked logs, log seats on the far side. */
export const firePos = (): P3 => {
  const [x, z] = site('campfire')
  return [x, 0.2, z]
}
function campfire(o: Out) {
  const [x, z] = site('campfire')
  const f = enter(o, at(x, 0, z))
  const R = 0.54 // mid radius of the ring wall
  if (o.hi) {
    const courses = 3
    const n = 18
    for (let c = 0; c < courses; c++) {
      for (let k = 0; k < n; k++) {
        const a = ((k + (c % 2) * 0.5) / n) * Math.PI * 2
        const shade = 0.82 + (((k * 7 + c * 13) % 10) / 10) * 0.32
        o.mass.add(box(0.175, 0.078, 0.16), { color: tone(K.brick, shade) }, at(Math.cos(a) * R, 0.04 + c * 0.082, Math.sin(a) * R, -a + Math.PI / 2))
      }
    }
    // capping course laid across the wall
    const m = 26
    for (let k = 0; k < m; k++) {
      const a = (k / m) * Math.PI * 2
      const shade = 0.9 + (((k * 5) % 10) / 10) * 0.28
      o.mass.add(box(0.118, 0.04, 0.2), { color: tone(K.brick, shade) }, at(Math.cos(a) * R, 0.25 + 0.02, Math.sin(a) * R, -a + Math.PI / 2))
    }
  } else {
    o.mass.add(
      lathe(
        [
          [0.63, 0],
          [0.63, 0.28],
          [0.63, 0.28],
          [0.45, 0.28],
          [0.45, 0.28],
          [0.45, 0.05],
        ],
        14,
      ),
      { color: K.brick, band: BAND.brick, axis: 'y', freq: F(0.085) },
    )
  }
  o.detail.add(cyl(0.47, 0.47, 0.06, o.hi ? 18 : 10), { color: K.ash }, at(0, 0, 0))
  // stacked firewood
  const logN = o.hi ? 7 : 5
  for (let k = 0; k < logN; k++) {
    const a = (k / logN) * Math.PI * 2 + 0.3
    const m = at(Math.cos(a) * 0.15, 0.06, Math.sin(a) * 0.15, -a, 0, 1.05)
    o.detail.add(cyl(0.05, 0.042, 0.48, 6, true), { color: tone(K.log, 0.75 + (k % 3) * 0.14) }, m)
  }
  // log seats: an arc on the side away from the screen's chairs
  for (const deg of [-28, 18, 64, 110, 156]) {
    const a = (deg * Math.PI) / 180
    const m = at(Math.cos(a) * 1.32, 0.115, Math.sin(a) * 1.32, -a, Math.PI / 2)
    const seg = o.hi ? 10 : 7
    o.mass.add(
      lathe(
        [
          [0.115, -0.3],
          [0.115, 0.3],
        ],
        seg,
      ),
      { color: K.log },
      m,
    )
    o.detail.add(
      lathe(
        [
          [0.115, 0.3],
          [0, 0.3],
        ],
        seg,
      ),
      { color: K.logEnd },
      m,
    )
    o.detail.add(
      lathe(
        [
          [0, -0.3],
          [0.115, -0.3],
        ],
        seg,
      ),
      { color: K.logEnd },
      m,
    )
  }
  pool(o, f, 0, 0.05, 0, 6.5, 6.5, 0.55, '#ff9a45')
  leave(o)
}

/** Star Cinema (星空電影院): white-framed screen on the lawn, folding camp benches, festoon lights. */
export const SCREEN = { w: 2.56, h: 1.44, y: 1.1 }
export function cinemaFrame(): THREE.Matrix4 {
  const [x, z] = site('cinema')
  return at(x, 0, z - 0.4, 0.35)
}
function cinema(o: Out) {
  const f = enter(o, cinemaFrame())
  const fr: Style = { color: '#ecebe6', r: 0.55 }
  const w = SCREEN.w + 0.24
  const top = SCREEN.y + SCREEN.h / 2 + 0.1
  for (const s of [-1, 1]) {
    o.mass.add(rbox(0.07, top, 0.07, 0.012), fr, at((s * w) / 2, top / 2, 0))
    o.mass.add(rbox(0.09, 0.05, 0.9, 0.012), fr, at((s * w) / 2, 0.025, -0.1))
    o.detail.beam([(s * w) / 2, 0.9, -0.03], [(s * w) / 2, 0.04, -0.5], 0.04, fr)
  }
  o.mass.add(rbox(w + 0.07, 0.07, 0.07, 0.012), fr, at(0, top - 0.035, 0))
  o.detail.add(rbox(w, 0.05, 0.05, 0.01), fr, at(0, SCREEN.y - SCREEN.h / 2 - 0.08, 0))
  // the cloth's shadow caster / back face (the lit front is a separate plane)
  o.mass.add(box(SCREEN.w, SCREEN.h, 0.012), { color: '#dcdad2' }, at(0, SCREEN.y, -0.02))
  // folding two-seat camp benches in loose rows facing the screen
  const rows: [number, number[]][] = [
    [1.85, [-1.3, -0.5, 0.3, 1.1]],
    [2.7, [-1.1, -0.3, 0.5]],
    [3.55, [-1.35, -0.55]],
  ]
  rows.forEach(([rz, xs], r) => {
    xs.forEach((bx, k) => {
      const cloth = (r + k) % 3 === 1 ? K.canvasLight : K.canvasTan
      enter(o, at(bx, 0, rz, Math.PI + Math.atan2(bx, rz) * 0.5))
      o.mass.add(rbox(0.6, 0.02, 0.22, 0.008), { color: cloth }, at(0, 0.13, 0))
      o.mass.add(rbox(0.6, 0.24, 0.02, 0.008), { color: cloth }, at(0, 0.25, -0.13, 0, -0.22))
      if (o.hi) {
        for (const sx of [-0.29, 0.29]) {
          o.detail.beam([sx, 0, 0.12], [sx, 0.36, -0.17], 0.014, { color: K.steel })
          o.detail.beam([sx, 0, -0.14], [sx, 0.14, 0.1], 0.014, { color: K.steel })
        }
      }
      leave(o)
    })
  })
  // festoon lights along the trees to the west
  festoon(
    o,
    [
      [-2.9, 1.3, 0.3],
      [-3.0, 1.3, 2.1],
      [-2.9, 1.3, 3.9],
    ],
    7,
    0.16,
  )
  // projector on its stand, behind the rows
  o.detail.add(cyl(0.02, 0.02, 0.34, 5), { color: K.steel }, at(-0.1, 0, 4.25))
  o.detail.add(rbox(0.16, 0.07, 0.2, 0.012), { color: K.trim }, at(-0.1, 0.375, 4.25))
  // the screen's light on the lawn in front of it
  pool(o, f, 0, 0.05, 1.5, 4.6, 4.2, 0.42, '#bcd0ff')
  leave(o)
}

/** Kayak boarding jetty (乘船處): timber deck on piles with boarding rails, kayak rack on the bank. */
function kayakDock(o: Out) {
  const [x, z] = site('boardingLabel')
  enter(o, at(x, 0, z + 0.9))
  const len = 3.4
  const zc = 1.4
  o.mass.add(rbox(0.62, 0.06, len, 0.012), { color: K.timber, band: BAND.plank, axis: 'z', freq: F(0.06) }, at(0, 0.05, zc))
  for (const s of [-1, 1]) o.detail.add(box(0.05, 0.1, len - 0.1), { color: K.skirt }, at(s * 0.24, -0.03, zc))
  const seg = o.hi ? 8 : 6
  for (let k = 0; k < 4; k++) {
    for (const s of [-1, 1]) o.mass.add(cyl(0.045, 0.04, 1.25, seg), { color: K.cedarDark }, at(s * 0.34, -1.05, 0.25 + k * 0.92))
  }
  // boarding rails at the lake end, both sides
  for (const s of [-1, 1]) {
    for (const rz of [2.35, 2.95]) {
      const rx = s * 0.29
      o.detail.add(box(0.022, 0.36, 0.022), { color: K.steel }, at(rx, 0.08 + 0.18, rz))
      o.detail.add(box(0.022, 0.36, 0.022), { color: K.steel }, at(rx, 0.08 + 0.18, rz + 0.3))
      o.detail.beam([rx, 0.44, rz - 0.01], [rx, 0.44, rz + 0.31], 0.022, { color: K.steel })
    }
  }
  // kayak rack on the bank, two boats waiting
  const hull = (m: THREE.Matrix4) => {
    const KR = o.hi ? 10 : 6
    const st = o.hi ? [-1, -0.92, -0.7, -0.35, 0, 0.35, 0.7, 0.92, 1] : [-1, -0.8, -0.3, 0.3, 0.8, 1]
    const rings: P3[][] = st.map((t) => {
      const s = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(t), 2.6)), 0.6) * 0.96 + 0.04
      const ring: P3[] = []
      for (let k = 0; k < KR; k++) {
        const a = (k / KR) * Math.PI * 2
        const sn = Math.sin(a)
        ring.push([t * 0.38, (sn > 0 ? 0.03 : 0.055) * sn * s + Math.abs(t) * Math.abs(t) * 0.02, Math.cos(a) * 0.105 * s])
      }
      return ring
    })
    o.mass.add(loft(rings), { color: K.kayak }, m)
    o.detail.add(rbox(0.16, 0.012, 0.09, 0.005), { color: K.trim }, m.clone().multiply(at(0.02, 0.034, 0)))
  }
  enter(o, at(-1.35, 0, -0.75, 0.35))
  for (const sx of [-0.2, 0.2]) {
    o.detail.add(box(0.035, 0.34, 0.035), { color: K.cedarDark }, at(sx, 0.17, -0.2))
    o.detail.add(box(0.035, 0.34, 0.035), { color: K.cedarDark }, at(sx, 0.17, 0.2))
    o.detail.add(box(0.03, 0.03, 0.5), { color: K.cedarDark }, at(sx, 0.14, 0))
    o.detail.add(box(0.03, 0.03, 0.5), { color: K.cedarDark }, at(sx, 0.3, 0))
  }
  hull(at(0, 0.2, 0))
  hull(at(0, 0.36, 0))
  leave(o)
  signPost(o, -0.55, -0.55, 0.2, K.cedarLight, 1.05)
  leave(o)
}

/** Parking (P): gravel bays with timber wheel stops, a few parked cars, a blue P post. */
function parking(o: Out) {
  const spots = poi('parking') as unknown as Pt[]
  const paints = ['#eeece6', '#3b4044', '#aeb4b8', '#7d8f86', '#8a3b34', '#e5dfd0', '#56627a']
  spots.forEach((p, i) => {
    const [x, z] = toWorld(p)
    enter(o, at(x, 0, z))
    o.detail.add(rbox(2.7, 0.05, 1.75, 0.02), { color: K.gravel }, at(0, 0.035, 0))
    for (const dx of [-1.2, -0.4, 0.4, 1.2]) o.detail.add(box(0.025, 0.03, 1.35), { color: '#f1ede2' }, at(dx, 0.06, 0.05))
    o.detail.add(rbox(2.5, 0.07, 0.08, 0.015), { color: K.cedarDark }, at(0, 0.09, -0.78))
    ;[-0.8, 0, 0.8].forEach((dx, j) => {
      if ((i + j) % 4 === 3) return // an empty bay
      const paint = paints[(i * 3 + j * 2) % paints.length]
      enter(o, at(dx, 0.06, 0.02))
      o.mass.add(rbox(0.46, 0.17, 1.08, 0.05, o.hi ? 2 : 1), { color: paint, r: 0.32 }, at(0, 0.165, 0))
      o.mass.add(rbox(0.41, 0.15, 0.56, 0.05, o.hi ? 2 : 1), { color: paint, r: 0.32 }, at(0, 0.31, 0.06))
      o.glass.add(box(0.434, 0.085, 0.44), { color: '#ffffff', a: 0 }, at(0, 0.315, 0.06))
      o.glass.add(box(0.31, 0.085, 0.584), { color: '#ffffff', a: 0 }, at(0, 0.315, 0.06))
      for (const sx of [-1, 1]) for (const sz of [-0.33, 0.33]) o.detail.add(cyl(0.075, 0.075, 0.06, o.hi ? 10 : 6, true), { color: K.tyre }, at(sx * 0.2 - 0.03, 0.075, sz, 0, 0, -Math.PI / 2))
      leave(o)
    })
    // P post
    o.detail.add(cyl(0.024, 0.02, 0.95, 6), { color: K.steel }, at(-1.25, 0, -0.95))
    o.detail.add(rbox(0.24, 0.24, 0.035, 0.05, 2), { color: K.blue }, at(-1.25, 0.95, -0.95))
    leave(o)
  })
}

// ---- path lights along the roads ----------------------------------------------------------------
function inside(pt: Pt, poly: Pt[]): boolean {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}
const onRoad = (pt: Pt) => layout.roads.some((r) => inside(pt, r.outer) && !r.holes.some((h) => inside(pt, h)))
const around = (pt: Pt, r: number): Pt[] => Array.from({ length: 8 }, (_, k) => [pt[0] + Math.cos((k * Math.PI) / 4) * r, pt[1] + Math.sin((k * Math.PI) / 4) * r] as Pt)

/** Bollard positions (map px): just off the road edge, clear of units, trees, water and facilities. */
export function pathLightSpots(spacing = 58, minGap = 40): Pt[] {
  const P = layout.pois
  const keep: [number, number, number][] = [
    [406, 586, 54],
    [712, 568, 24],
    [895, 558, 24],
    [806, 564, 30],
    [582, 578, 26],
    [603, 353, 36],
    [629, 381, 22],
    [621, 433, 30],
    [977, 318, 18],
    [578, 510, 9],
    ...(P.parking as Pt[]).map((p) => [p[0], p[1], 22] as [number, number, number]),
  ]
  const lakes = [layout.lakes.wild, layout.lakes.kayak, layout.lakes.pool]
  const out: Pt[] = []
  const rings: Pt[][] = []
  for (const r of layout.roads) rings.push(r.outer, ...r.holes)
  for (const ring of rings) {
    let acc = spacing / 2
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]
      const b = ring[(i + 1) % ring.length]
      const dx = b[0] - a[0]
      const dy = b[1] - a[1]
      const len = Math.hypot(dx, dy)
      if (len < 1e-6) continue
      const ux = dx / len
      const uy = dy / len
      while (acc < len) {
        const px = a[0] + ux * acc
        const py = a[1] + uy * acc
        acc += spacing
        for (const s of [1, -1]) {
          const c: Pt = [px + uy * s * 3.5, py - ux * s * 3.5]
          if (onRoad(c) || around(c, 2).some(onRoad)) continue
          if (!inside(c, layout.land) || !around(c, 8).every((q) => inside(q, layout.land))) continue
          if (lakes.some((l) => inside(c, l) || around(c, 6).some((q) => inside(q, l)))) continue
          if (layout.vans.some((v) => Math.hypot(v.x - c[0], v.y - c[1]) < 17)) continue
          if (layout.trees.some((t) => Math.hypot(t.x - c[0], t.y - c[1]) < 5)) continue
          if (keep.some((k) => Math.hypot(k[0] - c[0], k[1] - c[1]) < k[2])) continue
          if (out.some((q) => Math.hypot(q[0] - c[0], q[1] - c[1]) < minGap)) continue
          out.push(c)
          break
        }
      }
      acc -= len
    }
  }
  return out
}

export interface FacilityBuild {
  mass: THREE.BufferGeometry
  detail: THREE.BufferGeometry
  glass: THREE.BufferGeometry
  hall: THREE.BufferGeometry
  metal: THREE.BufferGeometry
  glow: THREE.BufferGeometry
  pools: Pool[]
  triangles: number
}

export function buildFacilities(q: Quality): FacilityBuild {
  const o: Out = { mass: new Mesher(), detail: new Mesher(), glass: new Mesher(), hall: new Mesher(), metal: new Mesher(), glow: new Mesher(), pools: [], hi: q === 'high', q }
  gate(o)
  checkIn(o)
  diningHall(o)
  restrooms(o)
  drinkingWater(o)
  poolSide(o)
  campfire(o)
  cinema(o)
  kayakDock(o)
  parking(o)
  for (const p of pathLightSpots()) {
    const [x, z] = toWorld(p)
    bollard(o, x, z)
  }
  const triangles = all(o).reduce((n, b) => n + b.triangles, 0)
  return { mass: o.mass.build(), detail: o.detail.build(), glass: o.glass.build(), hall: o.hall.build(), metal: o.metal.build(), glow: o.glow.build(), pools: o.pools, triangles }
}
