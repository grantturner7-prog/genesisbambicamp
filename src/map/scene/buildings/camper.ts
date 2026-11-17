import * as THREE from 'three'
import type { VanSpot } from '../../layout/layout'
import type { Quality } from '../env'
import { BAND, Mesher, at, ball, box, cyl, prism, quads, rbox, sheet, type Style } from './geo'
import { OPT, TINT } from './mats'
import { stripeFreq } from './textures'

/**
 * A Bambi camper unit, modelled from the venue's photos of every zone: a trailer cabin with
 * splayed end walls and lap siding, black corner trim and a dark flat roof, a louvered door
 * with its wall lamp, picture windows in both end walls, the single trailer wheel, a timber
 * deck with two posts, a shade sail, string lights and a bistro set, and the dark bathroom
 * annex with cedar slats behind it.
 *
 * Local frame: +X is the long axis, +Z the deck side, the ground is y = 0 and the cabin is
 * centred on the origin. World size of the cabin ~ 6.5 m x 2.5 m x 2.5 m (1 unit = 4 m).
 */
export const L = 1.62
export const Wd = 0.62
export const H = 0.62
export const FLARE = 0.09
export const FLOOR = 0.14
/** Top of the roof. */
export const ROOF_Y = FLOOR + H + 0.05
/** Deck surface. */
export const DECK_Y = 0.13
/** Where the wall lamp hangs (local), for the pools of light at dusk. */
export const LAMP: [number, number, number] = [-0.03, FLOOR + 0.47, Wd / 2 + 0.03]

type Zone = VanSpot['zone']

/** What differs between the zones in the venue's photos. */
export interface ZoneStyle {
  siding: string
  sail: string
  chair: string
  /** Deck railing (zones A and B). */
  railing: boolean
  /** Steps and handrails down from the deck (zone A, raised on blocks). */
  steps: boolean
}
export const ZONE_STYLE: Record<Zone, ZoneStyle> = {
  A: { siding: '#dccfa9', sail: '#efe8d8', chair: '#2e3133', railing: true, steps: true }, // sand-beige siding
  B: { siding: '#f4f1e8', sail: '#e6e7e1', chair: '#2e3133', railing: true, steps: false }, // white, on the meadow
  D: { siding: '#efe8d6', sail: '#e9dfc6', chair: '#8d9294', railing: false, steps: false }, // warm white, grey chairs
  E: { siding: '#f4f1e8', sail: '#efe9dc', chair: '#8d9294', railing: false, steps: false },
  F: { siding: '#f4f1e8', sail: '#efe9dc', chair: '#2e3133', railing: false, steps: false },
  G: { siding: '#b9ae94', sail: '#6d655a', chair: '#2e3133', railing: false, steps: false }, // greige siding, dark sail
}

const C = {
  trim: '#2f3437',
  roofEdge: '#30363a',
  roofTop: '#8f979b',
  deck: '#a8794e',
  skirt: '#25282a',
  annex: '#3d4649',
  cedar: '#b27a43',
  louver: '#565c60',
  tyre: '#1f2123',
  hub: '#c5cacd',
  shadow: '#191c1d',
  table: '#34383a',
  bulb: '#fff0cf',
}

// painted steel and sheet metal carry a soft sheen; timber, rubber and canvas stay matte
Mesher.finishes({ [C.trim]: 0.6, [C.roofEdge]: 0.6, [C.roofTop]: 0.48, [C.deck]: 0.8, [C.annex]: 0.7, [C.cedar]: 0.8, [C.louver]: 0.55, [C.tyre]: 0.92, [C.hub]: 0.4, [C.table]: 0.55 })
const SLOT_ROUGH = [0.85, 0.62, 0.95, 0.6] // by tint slot: -, siding, sail, chair

export interface CamperOut {
  /** Big forms: cast and receive shadows. */
  mass: Mesher
  /** Trim and furniture: receive only. */
  detail: Mesher
  /** Window glass. */
  glass: Mesher
  /** Wall lamp and string lights. */
  bulbs: Mesher
}

/**
 * Adds one camper to the meshers. Without `baked` the zone colours and optional parts are
 * left to per-instance attributes (the 50 instanced units); with it they are fixed (the
 * check-in unit, merged into the facilities).
 */
export function emitCamper(out: CamperOut, q: Quality, baked?: ZoneStyle) {
  const hi = q === 'high'
  const white = new THREE.Color('#ffffff')
  const tinted = (slot: number, extra: Partial<Style> = {}): Style => {
    if (!baked) return { color: white, a: slot, r: SLOT_ROUGH[slot], ...extra }
    return { color: slot === TINT.siding ? baked.siding : slot === TINT.sail ? baked.sail : baked.chair, r: SLOT_ROUGH[slot], ...extra }
  }
  const opt = (slot: number): Partial<Style> => (baked ? {} : { b: slot })
  const has = (slot: number) => !baked || (slot === OPT.railing ? baked.railing : baked.steps)

  const x0 = L / 2 - FLARE // half length at floor level
  const zf = Wd / 2 // front wall

  // ---- cabin -----------------------------------------------------------------------------
  out.mass.add(
    prism(
      [
        [-x0, FLOOR],
        [x0, FLOOR],
        [L / 2, FLOOR + H],
        [-L / 2, FLOOR + H],
      ],
      Wd,
    ),
    tinted(TINT.siding, { band: BAND.lap, axis: 'y', freq: stripeFreq(0.05) }),
  )
  // roof: dark slab with softly rounded edges, seamed metal sheet on top
  out.mass.add(rbox(L + 0.08, 0.055, Wd + 0.08, 0.026, hi ? 2 : 1), { color: C.roofEdge }, at(0, FLOOR + H + 0.0225, 0))
  out.detail.add(box(L - 0.03, 0.014, Wd - 0.03), { color: C.roofTop, band: BAND.seam, axis: 'x', freq: stripeFreq(0.11) }, at(0, ROOF_Y + 0.004, 0))
  // black base rail, and the dark gap under the floor
  out.detail.add(box(x0 * 2 + 0.03, 0.06, Wd + 0.03), { color: C.trim }, at(0, FLOOR + 0.005, 0))
  out.detail.add(box(x0 * 2 - 0.16, FLOOR - 0.02, Wd - 0.14), { color: C.shadow }, at(0, (FLOOR - 0.02) / 2, 0))
  // slanted black corner posts
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      out.detail.add(
        prism(
          [
            [sx * (x0 - 0.05), FLOOR + 0.03],
            [sx * (x0 + 0.012), FLOOR + 0.03],
            [sx * (L / 2 + 0.012), FLOOR + H - 0.002],
            [sx * (L / 2 - 0.05), FLOOR + H - 0.002],
          ],
          0.05,
          hi ? 0.012 : 0,
          hi ? 0.01 : 0,
        ),
        { color: C.trim },
        at(0, 0, sz * (zf - 0.025 + 0.012)),
      )
    }
  }

  // ---- door, lamp, number plate -----------------------------------------------------------
  const doorY = FLOOR + 0.035 + 0.265
  out.detail.add(box(0.215, 0.53, 0.03), { color: C.trim }, at(0.13, doorY, zf + 0.003))
  out.detail.add(box(0.165, 0.47, 0.02), { color: C.louver, band: BAND.louver, axis: 'y', freq: stripeFreq(0.03) }, at(0.13, doorY - 0.005, zf + 0.022))
  out.detail.add(box(0.032, 0.05, 0.036), { color: C.trim }, at(LAMP[0], LAMP[1] + 0.03, zf + 0.018))
  out.bulbs.add(ball(0.024, hi ? 6 : 4, hi ? 4 : 2), { color: C.bulb, a: 1 }, at(LAMP[0], LAMP[1] - 0.005, zf + 0.034))
  if (hi) out.detail.add(box(0.075, 0.03, 0.02), { color: C.trim }, at(LAMP[0], LAMP[1] - 0.07, zf + 0.008))

  // ---- end-wall windows (black frame, glass in front of it) ------------------------------
  const phi = Math.atan2(FLARE, H)
  const wall = (sx: number, h: number, off: number): [number, number] => [
    sx * (x0 + (FLARE * h) / H + Math.cos(phi) * off),
    FLOOR + h - Math.sin(phi) * off,
  ]
  {
    // -X: the bed's big picture window
    const [fx, fy] = wall(-1, 0.33, 0.004)
    out.detail.add(box(0.036, 0.42, 0.46), { color: C.trim }, at(fx, fy, 0, 0, 0, phi))
    const [gx, gy] = wall(-1, 0.33, 0.026)
    out.glass.add(box(0.02, 0.35, 0.39), { color: white, a: 1 }, at(gx, gy, 0, 0, 0, phi))
  }
  {
    // +X: the bunk end, a tall pane over a low one
    const [fx, fy] = wall(1, 0.33, 0.004)
    out.detail.add(box(0.036, 0.44, 0.36), { color: C.trim }, at(fx, fy, 0, 0, 0, -phi))
    const [ux, uy] = wall(1, 0.42, 0.026)
    out.glass.add(box(0.02, 0.2, 0.29), { color: white, a: 1 }, at(ux, uy, 0, 0, 0, -phi))
    const [lx, ly] = wall(1, 0.215, 0.026)
    out.glass.add(box(0.02, 0.13, 0.29), { color: white, a: 0.8 }, at(lx, ly, 0, 0, 0, -phi))
  }

  // ---- trailer wheel ----------------------------------------------------------------------
  const seg = hi ? 12 : 8
  out.detail.add(cyl(0.085, 0.085, 0.055, seg, true), { color: C.tyre }, at(0.5, 0.085, zf + 0.012, 0, Math.PI / 2))
  out.detail.add(cyl(0.046, 0.04, 0.012, seg), { color: C.hub }, at(0.5, 0.085, zf + 0.067, 0, Math.PI / 2))

  // ---- bathroom annex behind the cabin ----------------------------------------------------
  const aw = 0.8 // annex length, depth, height: clearly smaller than the cabin
  const ad = 0.34
  const ah = 0.48
  const ax = 0.27
  const az = -(zf + ad / 2)
  out.mass.add(box(aw, ah, ad), { color: C.annex, band: BAND.lap, axis: 'y', freq: stripeFreq(0.07) }, at(ax, 0.08 + ah / 2, az))
  out.mass.add(rbox(aw + 0.05, 0.04, ad + 0.05, 0.014), { color: C.roofEdge }, at(ax, 0.08 + ah + 0.018, az - 0.005))
  out.detail.add(box(aw - 0.04, 0.012, ad - 0.03), { color: C.roofTop }, at(ax, 0.08 + ah + 0.044, az - 0.005))
  out.detail.add(box(aw - 0.1, 0.08, ad - 0.1), { color: C.shadow }, at(ax, 0.04, az))
  for (const sx of [-1, 1]) {
    out.detail.add(
      box(0.16, ah - 0.05, 0.03),
      { color: C.cedar, band: BAND.slat, axis: 'x', freq: stripeFreq(0.028) },
      at(ax + sx * (aw / 2 - 0.085), 0.08 + ah / 2 - 0.01, az - ad / 2 - 0.003),
    )
  }

  // ---- deck, posts, shade sail -------------------------------------------------------------
  const dx = -0.24 // deck centre
  const dw = 1.08
  const dd = 0.6
  out.mass.add(box(dw, 0.045, dd), { color: C.deck, band: BAND.plank, axis: 'z', freq: stripeFreq(0.045) }, at(dx, DECK_Y - 0.0225, zf + dd / 2))
  out.detail.add(box(dw - 0.02, 0.5, dd - 0.02), { color: C.skirt }, at(dx, DECK_Y - 0.045 - 0.25, zf + dd / 2))
  const pz = zf + dd - 0.025
  const p0: [number, number, number] = [dx - dw / 2 + 0.025, 0.8, pz]
  const p1: [number, number, number] = [dx + dw / 2 - 0.025, 0.73, pz]
  for (const [px, top] of [
    [p0[0], p0[1]],
    [p1[0], p1[1]],
  ]) {
    out.mass.add(box(0.024, top - DECK_Y, 0.024), { color: C.trim }, at(px, (top + DECK_Y) / 2, pz))
  }
  const a0: [number, number, number] = [dx - dw / 2 - 0.02, ROOF_Y + 0.002, zf + 0.02]
  const a1: [number, number, number] = [dx + dw / 2 + 0.02, ROOF_Y + 0.002, zf + 0.02]
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  out.mass.add(
    sheet(
      hi ? 6 : 4,
      hi ? 4 : 2,
      (u, v) => {
        const s = Math.sin(Math.PI * u)
        const w = Math.sin(Math.PI * v)
        return [
          lerp(lerp(a0[0], a1[0], u), lerp(p0[0], p1[0], u), v) + 0.05 * w * (1 - 2 * u),
          lerp(lerp(a0[1], a1[1], u), lerp(p0[1], p1[1], u), v) - 0.03 * s * w,
          lerp(lerp(a0[2], a1[2], u), lerp(p0[2], p1[2], u), v) - 0.07 * s * v * v,
        ]
      },
      true,
      0.006,
    ),
    tinted(TINT.sail),
  )

  // ---- string lights under the sail --------------------------------------------------------
  const strand = (a: [number, number, number], b: [number, number, number], count: number, sag: number) => {
    for (let k = 0; k < count; k++) {
      const t = (k + 0.5) / count
      out.bulbs.add(ball(0.019, 4, 2), { color: C.bulb, a: 1 }, at(lerp(a[0], b[0], t), lerp(a[1], b[1], t) - sag * Math.sin(Math.PI * t), lerp(a[2], b[2], t)))
    }
  }
  strand([a0[0] + 0.06, ROOF_Y - 0.035, zf + 0.055], [a1[0] - 0.06, ROOF_Y - 0.035, zf + 0.055], hi ? 7 : 4, 0.035)
  if (hi) strand([a0[0] + 0.06, ROOF_Y - 0.035, zf + 0.07], [p0[0], p0[1] - 0.03, pz - 0.03], 4, 0.05)

  // ---- bistro table and chairs --------------------------------------------------------------
  const tx = dx - 0.12
  const tz = zf + 0.33
  out.detail.add(cyl(0.08, 0.08, 0.012, hi ? 10 : 8), { color: C.table }, at(tx, DECK_Y + 0.17, tz))
  out.detail.add(box(0.014, 0.17, 0.014), { color: C.table }, at(tx, DECK_Y + 0.085, tz))
  if (hi) out.detail.add(cyl(0.05, 0.04, 0.008, 8), { color: C.table }, at(tx, DECK_Y, tz))
  const chair = (cx: number, cz: number, ry: number) => {
    const m = at(cx, DECK_Y, cz, ry)
    out.detail.push(m)
    out.detail.add(box(0.085, 0.012, 0.085), tinted(TINT.chair), at(0, 0.11, 0))
    out.detail.add(box(0.085, 0.11, 0.012), tinted(TINT.chair), at(0, 0.17, -0.04, 0, -0.12))
    if (hi) {
      for (const lx of [-0.036, 0.036]) for (const lz of [-0.036, 0.036]) out.detail.add(box(0.009, 0.105, 0.009), tinted(TINT.chair), at(lx, 0.0525, lz))
    }
    out.detail.pop()
  }
  chair(tx - 0.165, tz + 0.02, Math.PI / 2)
  chair(tx + 0.16, tz - 0.03, -Math.PI / 2)
  chair(tx + 0.01, tz + 0.17, Math.PI)

  // ---- zones A and B: deck railing ----------------------------------------------------------
  if (has(OPT.railing)) {
    const rail: Style = { color: C.trim, ...opt(OPT.railing) }
    const rx = dx - dw / 2 + 0.012
    const ex = dx - 0.06
    for (const ry of [DECK_Y + 0.1, DECK_Y + 0.19]) {
      out.detail.beam([rx, ry, zf + 0.03], [rx, ry, pz], 0.011, rail)
      out.detail.beam([p0[0], ry, pz + 0.005], [ex, ry, pz + 0.005], 0.011, rail)
    }
    out.detail.add(box(0.014, 0.2, 0.014), rail, at(ex, DECK_Y + 0.1, pz + 0.005))
  }
  // ---- zone A: steps down from the deck -----------------------------------------------------
  if (has(OPT.steps)) {
    const wood: Style = { color: C.deck, band: BAND.plank, axis: 'z', freq: stripeFreq(0.045), ...opt(OPT.steps) }
    const iron: Style = { color: C.trim, ...opt(OPT.steps) }
    const sx = dx + 0.3
    const fz = zf + dd
    out.detail.add(box(0.3, 0.03, 0.1), wood, at(sx, 0.087 - 0.015, fz + 0.05))
    out.detail.add(box(0.3, 0.03, 0.1), wood, at(sx, 0.045 - 0.015, fz + 0.15))
    for (const hx of [sx - 0.15, sx + 0.15]) {
      out.detail.beam([hx, DECK_Y + 0.2, fz], [hx, 0.045 + 0.2, fz + 0.2], 0.011, iron)
      out.detail.add(box(0.012, 0.2, 0.012), iron, at(hx, 0.045 + 0.1, fz + 0.2))
      out.detail.add(box(0.012, 0.2, 0.012), iron, at(hx, DECK_Y + 0.1, fz))
    }
  }
}

/** The soft light a unit throws at dusk: one pool on the deck, one on the wall by the lamp. */
export function camperWash(): THREE.BufferGeometry {
  const deck = at(LAMP[0] - 0.12, DECK_Y + 0.016, Wd / 2 + 0.42).scale(new THREE.Vector3(1.5, 1, 1.25))
  const wall = at(LAMP[0], FLOOR + 0.36, Wd / 2 + 0.05, 0, Math.PI / 2).scale(new THREE.Vector3(1.15, 1, 0.86))
  return quads([deck, wall])
}
