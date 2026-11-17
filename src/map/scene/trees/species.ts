import { PALETTE } from '../env'
import { mulberry32 } from '../kit'
import { Builder, clamp, fbm, frame, lerp, lin, mix, scale, smooth, smoothNormals, sphereTemplate, vnoise, type Frame, type RGB } from './geom'

/** One plant to build: world position of its foot, traced crown radius (world units), seed. */
export interface Plant {
  x: number
  z: number
  /** Height of the foot (0 on land; below the water line for the cypresses that stand in the lake). */
  y: number
  r: number
  seed: number
}

const TAU = Math.PI * 2

// ── colours ──────────────────────────────────────────────────────────────────────────────
const BARK = lin('#75604c')
const BARK_CYPRESS = lin('#7d5f4c')
const BARK_PALM = lin('#8d7c68')
const BARK_DARK = lin('#4a3a2e')

/** Evergreen broadleaf families seen at the camp: mid green, deep banyan green, fresh young green. */
const LEAF = [
  { top: lin('#7dbb62'), mid: lin(PALETTE.leaf), under: lin('#235238') },
  { top: lin('#68a556'), mid: lin('#3a7c41'), under: lin('#1d4534') },
  { top: lin('#9cc566'), mid: lin('#62a04b'), under: lin('#2c6039') },
]
const WARM_DRIFT = lin('#8aa848')
const COOL_DRIFT = lin('#2c6a52')
const WINTER_LEAF = lin('#5d6f45')

const CY_DEEP = lin('#27583d')
const CY_MID = lin(PALETTE.cypress)
const CY_TIP = lin('#9bcb6b')
// bald cypress in winter: from deep rust through copper to gold
const CY_W = [lin('#8a3d1e'), lin(PALETTE.cypressWinter), lin('#d98a2e'), lin('#e8b24c')]
const CY_W_DEEP = lin('#5c2c18')
const CY_W_OLIVE = lin('#98993f')

const PALM_YOUNG = lin('#8cc25e')
const PALM_MID = lin(PALETTE.palm)
const PALM_OLD = lin('#3a7543')
const PALM_DRY = lin('#a8965c')

const PINE = lin(PALETTE.pine)
const PINE_TIP = lin('#6aa66a')
const PINE_DEEP = lin('#1c4432')

function ramp(stops: RGB[], u: number): RGB {
  const t = clamp(u) * (stops.length - 1)
  const i = Math.min(stops.length - 2, Math.floor(t))
  return mix(stops[i], stops[i + 1], t - i)
}

// ── shared pieces ────────────────────────────────────────────────────────────────────────
interface Ring {
  y: number
  r: number
  ox: number
  oz: number
}

/**
 * A tapered tube through `rings` (bottom to top), open at both ends: trunks.
 * `flute` ripples the radius of the lowest two rings for a buttressed foot.
 */
function addTube(b: Builder, f: Frame, rings: Ring[], sides: number, colour: (j: number) => RGB, sway: (y: number) => number, phase: number, flute = 0) {
  const base = b.nv
  b.grain = 0.25
  for (let j = 0; j < rings.length; j++) {
    const g = rings[j]
    const lo = rings[Math.max(0, j - 1)]
    const hi = rings[Math.min(rings.length - 1, j + 1)]
    const slope = (hi.r - lo.r) / Math.max(1e-3, hi.y - lo.y)
    const c = colour(j)
    for (let k = 0; k < sides; k++) {
      const a = (k / sides) * TAU
      const rr = g.r * (1 + (j < 2 && flute ? flute * (k % 2 ? 1 : -1) * (j === 0 ? 1 : 0.6) : 0))
      const nx = Math.cos(a)
      const nz = Math.sin(a)
      b.vert(f, g.ox + nx * rr, g.y, g.oz + nz * rr, nx, -slope, nz, c, c, sway(g.y), phase)
    }
  }
  b.grain = 1
  for (let j = 0; j < rings.length - 1; j++) {
    for (let k = 0; k < sides; k++) {
      const k1 = (k + 1) % sides
      const A = base + j * sides + k
      const B = base + j * sides + k1
      const C = base + (j + 1) * sides + k1
      const D = base + (j + 1) * sides + k
      b.tri(A, D, B)
      b.tri(B, D, C)
    }
  }
}

/**
 * Triangles of a spire: `rows` rings of `cols` vertices, each ring turned half a step from
 * the one below, closed by an apex vertex that follows the last ring.
 */
function spireIndex(rows: number, cols: number): number[] {
  const idx: number[] = []
  for (let j = 0; j < rows - 1; j++) {
    for (let c = 0; c < cols; c++) {
      const c1 = (c + 1) % cols
      const A = j * cols + c
      const B = j * cols + c1
      const C = (j + 1) * cols + c1
      const D = (j + 1) * cols + c
      // staggered rows: each quad splits along its shorter diagonal
      if (j % 2 === 0) idx.push(A, D, B, B, D, C)
      else idx.push(A, D, C, A, C, B)
    }
  }
  for (let c = 0; c < cols; c++) idx.push((rows - 1) * cols + c, rows * cols, (rows - 1) * cols + ((c + 1) % cols))
  return idx
}

/**
 * A crown's shadow is cast by a simpler copy of it, scaled by this much so that it stays
 * inside the crown and never shades the crown's own sunlit side.
 */
const SHADOW_INSET = 0.86
const BLACK: RGB = [0, 0, 0]

interface Lobe {
  x: number
  y: number
  z: number
  r: number
  tint: number
}
// results of the last blob() call
let blobR = 0
let blobCrease = 0
let blobTint = 0
/**
 * Radius of a soft union of spheres seen from the origin along (dx, dy, dz): the lobes melt
 * into each other with rounded valleys between them. Also reports how close the direction
 * is to a valley (`blobCrease`) and the blended tint of the lobes it touches.
 */
function blob(lobes: Lobe[], dx: number, dy: number, dz: number, k: number) {
  let tmax = 0
  for (const l of lobes) {
    const bq = dx * l.x + dy * l.y + dz * l.z
    const disc = bq * bq - (l.x * l.x + l.y * l.y + l.z * l.z) + l.r * l.r
    const t = disc > 0 ? Math.max(0, bq + Math.sqrt(disc)) : 0
    if (t > tmax) tmax = t
  }
  let sum = 0
  let wmax = 0
  let tint = 0
  for (const l of lobes) {
    const bq = dx * l.x + dy * l.y + dz * l.z
    const disc = bq * bq - (l.x * l.x + l.y * l.y + l.z * l.z) + l.r * l.r
    const t = disc > 0 ? Math.max(0, bq + Math.sqrt(disc)) : 0
    const w = Math.exp(k * (t - tmax))
    sum += w
    tint += w * l.tint
    if (w > wmax) wmax = w
  }
  blobR = tmax + Math.log(sum) / k
  blobCrease = clamp((1 - wmax / sum) * 2.6)
  blobTint = tint / sum
}

// ── broadleaf shade tree ─────────────────────────────────────────────────────────────────
/**
 * Evergreen shade tree of the lawns (banyan, camphor and the like): a full, layered crown
 * of soft lobes that fills the traced radius, on a short stout trunk. A much simpler copy
 * of the crown, drawn just inside it, goes to `shadow`: it casts the tree's shadow.
 */
export function addBroadleaf(b: Builder, shadow: Builder, pl: Plant, high: boolean) {
  const rnd = mulberry32(pl.seed)
  const r = pl.r
  const Rc = r * (0.97 + rnd() * 0.03)
  const H = (1.15 + 1.5 * r) * (0.94 + rnd() * 0.12)
  const clear = (0.48 + 0.2 * r) * (0.9 + rnd() * 0.2)
  const crownH = H - clear
  const up = crownH * 0.62
  const down = crownH * 0.38
  const cy = clear + down
  const f = frame(pl.x, pl.y, pl.z, rnd() * TAU, (rnd() - 0.5) * 0.08, (rnd() - 0.5) * 0.08)
  const phase = rnd() * TAU
  const fam = LEAF[rnd() < 0.42 ? 0 : rnd() < 0.55 ? 1 : 2]
  const bright = 0.9 + rnd() * 0.2
  const drift = rnd() // per-tree hue drift: toward yellow-green or toward blue-green
  const tone = (c: RGB): RGB => scale(drift > 0.5 ? mix(c, WARM_DRIFT, (drift - 0.5) * 0.3) : mix(c, COOL_DRIFT, (0.5 - drift) * 0.3), bright)
  const top = tone(fam.top)
  const mid = tone(fam.mid)
  const under = tone(fam.under)

  // lobes: a core, a lower ring that carries the outline, an upper ring and a crowning lobe
  const lobes: Lobe[] = [{ x: 0, y: 0, z: 0, r: 0.6, tint: -0.2 }]
  const n1 = 6 + Math.floor(rnd() * 2)
  const a0 = rnd() * TAU
  for (let i = 0; i < n1; i++) {
    const a = a0 + ((i + (rnd() - 0.5) * 0.45) / n1) * TAU
    const rho = 0.36 + rnd() * 0.08
    const d = 0.95 + rnd() * 0.05 - rho
    lobes.push({ x: Math.cos(a) * d, y: -0.2 + rnd() * 0.24, z: Math.sin(a) * d, r: rho, tint: (rnd() - 0.5) * 0.9 })
  }
  const n2 = 3 + Math.floor(rnd() * 2)
  const b0 = rnd() * TAU
  for (let i = 0; i < n2; i++) {
    const a = b0 + ((i + (rnd() - 0.5) * 0.5) / n2) * TAU
    const rho = 0.34 + rnd() * 0.08
    const d = 0.36 + rnd() * 0.12
    lobes.push({ x: Math.cos(a) * d, y: 0.24 + rnd() * 0.18, z: Math.sin(a) * d, r: rho, tint: (rnd() - 0.3) * 0.9 })
  }
  const ta = rnd() * TAU
  lobes.push({ x: Math.cos(ta) * 0.1, y: 0.54 + rnd() * 0.1, z: Math.sin(ta) * 0.1, r: 0.36 + rnd() * 0.06, tint: 0.3 + rnd() * 0.3 })

  const tpl = high
    ? r >= 1.2
      ? sphereTemplate('ico', 6)
      : r >= 0.9
        ? sphereTemplate('octa', 8)
        : r >= 0.7
          ? sphereTemplate('octa', 7)
          : sphereTemplate('octa', 6)
    : r >= 1.1
      ? sphereTemplate('ico', 3)
      : sphereTemplate('octa', 4)
  const nvt = tpl.p.length / 3
  const P = new Float32Array(nvt * 3)
  const crease = new Float32Array(nvt)
  const tint = new Float32Array(nvt)
  let maxH = 0
  let maxY = 0
  let minY = 0
  const ns = pl.seed * 0.137
  const k = high ? 24 : 16
  for (let v = 0; v < nvt; v++) {
    const dx = tpl.p[v * 3]
    const dy = tpl.p[v * 3 + 1]
    const dz = tpl.p[v * 3 + 2]
    blob(lobes, dx, dy, dz, k)
    const R = blobR * (1 + (fbm(dx * 2.6 + ns, dy * 2.6, dz * 2.6 - ns) - 0.5) * 0.1)
    P[v * 3] = dx * R
    P[v * 3 + 1] = dy * R
    P[v * 3 + 2] = dz * R
    crease[v] = blobCrease
    tint[v] = blobTint
    maxH = Math.max(maxH, Math.hypot(dx * R, dz * R))
    maxY = Math.max(maxY, dy * R)
    minY = Math.min(minY, dy * R)
  }
  // fit: the widest point reaches the crown radius; flatter underside than top
  const fitY = (y: number) => (y > 0 ? (y / maxY) * up : (y / -minY) * down)
  for (let v = 0; v < nvt; v++) {
    P[v * 3] *= Rc / maxH
    P[v * 3 + 2] *= Rc / maxH
    P[v * 3 + 1] = cy + fitY(P[v * 3 + 1])
  }
  const N = smoothNormals(P, tpl.i, new Float32Array(nvt * 3))
  const sway = (x: number, y: number, z: number) => Math.pow(clamp(y / H), 1.5) * (0.55 + 0.45 * (Math.hypot(x, z) / Rc))
  const base = b.nv
  for (let v = 0; v < nvt; v++) {
    const x = P[v * 3]
    const y = P[v * 3 + 1]
    const z = P[v * 3 + 2]
    // soften the shading a little: lean each normal toward the direction out of the crown centre
    const nx = N[v * 3] * 0.86 + (x / Rc) * 0.14
    const ny = N[v * 3 + 1] * 0.86 + ((y - cy) / (y > cy ? up : down)) * 0.14
    const nz = N[v * 3 + 2] * 0.86 + (z / Rc) * 0.14
    const h = (y - (cy - down)) / crownH
    const g = clamp(smooth(0.05, 0.95, h) + 0.16 * tint[v])
    let c = g < 0.5 ? mix(under, mid, g * 2) : mix(mid, top, (g - 0.5) * 2)
    const mottle = 0.94 + 0.12 * vnoise(x * 3.1 + ns, y * 3.1, z * 3.1)
    c = scale(c, (1 - 0.45 * crease[v]) * (1 + 0.1 * tint[v]) * mottle * (N[v * 3 + 1] < 0 ? 1 + 0.35 * N[v * 3 + 1] : 1))
    const w = scale(mix(c, WINTER_LEAF, 0.28), 0.92) // evergreen, but duller and more olive in winter
    b.vert(f, x, y, z, nx, ny, nz, c, w, sway(x, y, z), phase)
  }
  for (let t = 0; t < tpl.i.length; t += 3) b.tri(base + tpl.i[t], base + tpl.i[t + 1], base + tpl.i[t + 2])

  // the shadow caster: the same lobes, coarser and drawn a little inside the crown
  {
    const st = sphereTemplate('octa', high ? 2 : 1)
    const sb = shadow.nv
    for (let v = 0; v < st.p.length / 3; v++) {
      const dx = st.p[v * 3]
      const dy = st.p[v * 3 + 1]
      const dz = st.p[v * 3 + 2]
      blob(lobes, dx, dy, dz, 8)
      const x = dx * blobR * (Rc / maxH) * SHADOW_INSET
      const z = dz * blobR * (Rc / maxH) * SHADOW_INSET
      const y = cy + fitY(dy * blobR) * SHADOW_INSET
      shadow.vert(f, x, y, z, dx, dy, dz, BLACK, BLACK, sway(x, y, z), phase)
    }
    for (let t = 0; t < st.i.length; t += 3) shadow.tri(sb + st.i[t], sb + st.i[t + 1], sb + st.i[t + 2])
  }

  // trunk: flared foot, slight bend, disappears into the crown
  const rt = 0.04 + 0.055 * r
  const bx = (rnd() - 0.5) * 0.08
  const bz = (rnd() - 0.5) * 0.08
  const rings: Ring[] = high
    ? [
        { y: -0.3, r: rt * 1.9, ox: 0, oz: 0 },
        { y: 0.04, r: rt * 1.6, ox: 0, oz: 0 },
        { y: 0.2, r: rt * 1.05, ox: bx * 0.4, oz: bz * 0.4 },
        { y: cy, r: rt * 0.95, ox: bx, oz: bz },
      ]
    : [
        { y: -0.3, r: rt * 1.7, ox: 0, oz: 0 },
        { y: 0.1, r: rt * 1.2, ox: 0, oz: 0 },
        { y: cy, r: rt * 0.9, ox: bx, oz: bz },
      ]
  const bark = scale(BARK, 0.9 + rnd() * 0.2)
  addTube(b, f, rings, high ? 8 : 5, (j) => (rings[j].y > clear * 0.5 ? mix(bark, BARK_DARK, 0.6) : bark), (y) => Math.pow(clamp(y / H), 1.5) * 0.5, phase)
}

// ── bald cypress ─────────────────────────────────────────────────────────────────────────
/**
 * Bald cypress (落羽松) of the lake margins: a tall, slender, feathery spire built from soft
 * plumes of foliage that spiral up a straight trunk with a flared, fluted foot. Fresh green
 * in summer; from deep rust in the folds to gold at the tips in winter. A simpler copy of
 * the spire, drawn just inside it, goes to `shadow`: it casts the tree's shadow.
 */
export function addCypress(b: Builder, shadow: Builder, pl: Plant, high: boolean) {
  const rnd = mulberry32(pl.seed)
  const r = pl.r
  const Rc = clamp(0.55 * r + 0.12, 0.42, 0.86) * (0.94 + rnd() * 0.06)
  const H = (2.0 + 2.0 * r) * (0.92 + rnd() * 0.16)
  const y0 = H * (0.2 + rnd() * 0.06)
  const span = H - y0
  const f = frame(pl.x, pl.y, pl.z, rnd() * TAU, (rnd() - 0.5) * 0.06, (rnd() - 0.5) * 0.06)
  const phase = rnd() * TAU
  const rows = high ? 20 : 9
  const cols = high ? 12 : 8
  const sq = 0.92 + rnd() * 0.16 // slightly oval in plan
  const turn = rnd() // how far this tree has turned: 0 deep rust … 1 gold
  const olive = rnd() < 0.3 ? 0.35 + rnd() * 0.3 : 0 // some keep a little green low down
  const bright = 0.92 + rnd() * 0.16
  const ns = pl.seed * 0.173
  const tm = 0.12 // where the skirt is widest
  // envelope: a skirt swelling out above the bare trunk, then a slim ogive to the tip
  const env = (t: number) => Rc * (t < tm ? lerp(0.3, 1, Math.pow(Math.sin((t / tm) * Math.PI * 0.5), 0.8)) : Math.pow(1 - Math.pow((t - tm) / (1 - tm), 1.2), 0.84))
  const sway = (y: number) => Math.pow(clamp(y / H), 1.6) * 0.9

  // plumes: soft lobes spiralling up the trunk, each reaching the envelope
  const count = high ? 17 : 10
  const a0 = rnd() * TAU
  const plumes: { t: number; x: number; z: number; r: number; e: number; tint: number }[] = []
  for (let i = 0; i < count; i++) {
    const u = (i + 0.5) / count
    const t = 0.03 + 0.85 * Math.pow(u, 1.12) + (rnd() - 0.5) * 0.02
    const a = a0 + i * 2.39996 + (rnd() - 0.5) * 0.5
    const R = env(t) * (0.92 + rnd() * 0.16)
    const rho = R * 0.56 + 0.03
    const d = R - rho
    plumes.push({ t, x: Math.cos(a) * d, z: Math.sin(a) * d, r: rho, e: 1.15 + rnd() * 0.5, tint: rnd() - 0.5 })
  }
  // radius of the soft union of the trunk-hugging core and every plume, along (dx, dz) at height t
  let uCrease = 0
  let uTint = 0
  const union = (dx: number, dz: number, t: number, k: number) => {
    const core = env(t) * 0.5
    let tmax = core
    for (const p of plumes) {
      const bq = dx * p.x + dz * p.z
      const dy = ((p.t - t) * span) / p.e
      const disc = bq * bq - (p.x * p.x + p.z * p.z + dy * dy) + p.r * p.r
      if (disc > 0) tmax = Math.max(tmax, bq + Math.sqrt(disc))
    }
    let sum = Math.exp(k * (core - tmax))
    let wmax = sum
    let tn = 0
    for (const p of plumes) {
      const bq = dx * p.x + dz * p.z
      const dy = ((p.t - t) * span) / p.e
      const disc = bq * bq - (p.x * p.x + p.z * p.z + dy * dy) + p.r * p.r
      if (disc <= 0) continue
      const w = Math.exp(k * (bq + Math.sqrt(disc) - tmax))
      sum += w
      tn += w * p.tint
      if (w > wmax) wmax = w
    }
    uCrease = clamp((1 - wmax / sum) * 2.4)
    uTint = tn / sum
    return tmax + Math.log(sum) / k
  }

  const nvt = rows * cols + 1
  const P = new Float32Array(nvt * 3)
  const lum = new Float32Array(nvt)
  for (let j = 0; j < rows; j++) {
    const t = Math.pow(j / rows, 1.08)
    for (let c = 0; c < cols; c++) {
      const a = ((c + (j % 2) * 0.5) / cols) * TAU
      const dx = Math.cos(a)
      const dz = Math.sin(a)
      const rad = union(dx, dz, t, high ? 26 : 16) * (j === 0 ? 0.55 : 1) * (1 + (fbm(dx * 1.6 + ns, t * 5 + ns, dz * 1.6 - ns) - 0.5) * 0.12)
      const v = j * cols + c
      P[v * 3] = dx * rad * sq
      // the further a plume reaches from the trunk, the more it hangs
      P[v * 3 + 1] = y0 + span * t - (j === 0 ? 0 : 0.22 * rad)
      P[v * 3 + 2] = (dz * rad) / sq
      lum[v] = clamp(0.1 + 0.55 * clamp(rad / Math.max(0.05, env(t))) + 0.3 * t - 0.45 * uCrease + 0.18 * uTint + (j === 0 ? -0.35 : 0))
    }
  }
  const apex = rows * cols
  P[apex * 3] = (rnd() - 0.5) * 0.04
  P[apex * 3 + 1] = H
  P[apex * 3 + 2] = (rnd() - 0.5) * 0.04
  lum[apex] = 0.95
  const idx = spireIndex(rows, cols)
  const N = smoothNormals(P, idx, new Float32Array(nvt * 3))
  const base = b.nv
  b.grain = 0.4 // hanging needles
  for (let v = 0; v < nvt; v++) {
    const x = P[v * 3]
    const y = P[v * 3 + 1]
    const z = P[v * 3 + 2]
    const hl = Math.hypot(x, z) || 1
    const L = lum[v]
    const patch = fbm(x * 1.7 + ns, y * 1.1, z * 1.7 - ns)
    let sc = mix(CY_DEEP, CY_MID, smooth(0, 0.5, L))
    sc = scale(mix(sc, CY_TIP, smooth(0.4, 1, L) * 0.85), bright * (0.94 + 0.12 * patch))
    const u = clamp(turn * 0.8 + 0.1 + (patch - 0.5) * 0.9 + (L - 0.5) * 0.5)
    let wc = ramp(CY_W, u)
    if (olive) wc = mix(wc, CY_W_OLIVE, olive * smooth(0.55, 0.05, (y - y0) / span))
    wc = scale(mix(wc, CY_W_DEEP, (1 - L) * 0.6), bright * (0.84 + 0.34 * L))
    b.vert(f, x, y, z, N[v * 3] * 0.85 + (x / hl) * 0.15, N[v * 3 + 1] * 0.85 + 0.08, N[v * 3 + 2] * 0.85 + (z / hl) * 0.15, sc, wc, sway(y), phase)
  }
  b.grain = 1
  for (let t = 0; t < idx.length; t += 3) b.tri(base + idx[t], base + idx[t + 1], base + idx[t + 2])

  // the shadow caster: the same spire, coarser and drawn a little inside it
  {
    const sr = high ? 7 : 5
    const sc = high ? 6 : 5
    const sb = shadow.nv
    for (let j = 0; j < sr; j++) {
      const t = Math.pow(j / sr, 1.08)
      for (let c = 0; c < sc; c++) {
        const a = ((c + (j % 2) * 0.5) / sc) * TAU
        const dx = Math.cos(a)
        const dz = Math.sin(a)
        const rad = union(dx, dz, t, 8) * (j === 0 ? 0.55 : 1) * SHADOW_INSET
        const y = y0 + span * t - (j === 0 ? 0 : 0.22 * rad)
        shadow.vert(f, dx * rad * sq, y, (dz * rad) / sq, dx, 0.3, dz, BLACK, BLACK, sway(y), phase)
      }
    }
    shadow.vert(f, 0, H - 0.08, 0, 0, 1, 0, BLACK, BLACK, sway(H), phase) // apex, right after the rings
    const si = spireIndex(sr, sc)
    for (let t = 0; t < si.length; t += 3) shadow.tri(sb + si[t], sb + si[t + 1], sb + si[t + 2])
  }

  // trunk with the cypress's buttressed foot
  const rt = 0.045 + 0.011 * H
  const rings: Ring[] = high
    ? [
        { y: -0.6, r: rt * 2.6, ox: 0, oz: 0 },
        { y: 0.0, r: rt * 2.3, ox: 0, oz: 0 },
        { y: 0.12, r: rt * 1.5, ox: 0, oz: 0 },
        { y: 0.36, r: rt * 1.1, ox: 0, oz: 0 },
        { y: y0 + 0.08, r: rt * 0.95, ox: 0, oz: 0 },
      ]
    : [
        { y: -0.5, r: rt * 2.3, ox: 0, oz: 0 },
        { y: 0.08, r: rt * 1.6, ox: 0, oz: 0 },
        { y: y0 + 0.08, r: rt, ox: 0, oz: 0 },
      ]
  const bark = scale(BARK_CYPRESS, 0.9 + rnd() * 0.2)
  addTube(b, f, rings, high ? 8 : 5, (j) => (rings[j].y > y0 * 0.7 ? mix(bark, BARK_DARK, 0.5) : bark), sway, phase, high ? 0.13 : 0)
}

// ── Chinese fan palm ─────────────────────────────────────────────────────────────────────
/**
 * Fan palm (蒲葵) as it grows by the pool, the dining hall and along the roads: a slender,
 * slightly leaning trunk under a dense rounded head of fans whose ends hang, with a skirt
 * of dry leaves beneath.
 */
export function addFanPalm(b: Builder, pl: Plant, high: boolean) {
  const rnd = mulberry32(pl.seed)
  const Rc = clamp(0.45 + 0.28 * pl.r, 0.58, 0.85)
  const Ht = clamp(1.25 + 1.2 * pl.r, 1.7, 2.95) * (0.94 + rnd() * 0.12)
  const leanA = rnd() * TAU
  const leanL = Ht * (0.04 + rnd() * 0.13)
  const f = frame(pl.x, pl.y, pl.z)
  const phase = rnd() * TAU
  const bright = 0.92 + rnd() * 0.16
  const hx = Math.cos(leanA) * leanL
  const hz = Math.sin(leanA) * leanL

  // trunk: curves away from the foot, ringed with old leaf scars
  const nr = high ? 5 : 3
  const rings: Ring[] = [{ y: -0.4, r: 0.11, ox: 0, oz: 0 }]
  for (let j = 0; j <= nr; j++) {
    const s = j / nr
    const off = Math.pow(s, 1.6)
    rings.push({ y: s * Ht, r: lerp(0.075, 0.055, s) * (1 + 0.45 * Math.exp(-s * 9)), ox: hx * off, oz: hz * off })
  }
  const sway = (y: number) => Math.pow(clamp(y / Ht), 2) * 0.7
  addTube(b, f, rings, high ? 6 : 5, (j) => (j >= rings.length - 2 ? mix(BARK_PALM, BARK_DARK, 0.6) : scale(BARK_PALM, j % 2 ? 1.04 : 0.92)), sway, phase)

  b.grain = 0.45
  // the heart of the head: the mass of overlapping fans, as one soft form
  {
    const tpl = sphereTemplate('octa', high ? 2 : 1)
    const base = b.nv
    const ns = pl.seed * 0.21
    for (let v = 0; v < tpl.p.length / 3; v++) {
      const x = tpl.p[v * 3]
      const y = tpl.p[v * 3 + 1]
      const z = tpl.p[v * 3 + 2]
      const R = 1 + (fbm(x * 2.4 + ns, y * 2.4, z * 2.4) - 0.5) * 0.5
      const c = scale(mix(PALM_OLD, PALM_MID, smooth(-0.6, 0.9, y)), bright * (0.62 + 0.3 * smooth(-0.2, 1, y)))
      const wc = scale(mix(c, WINTER_LEAF, 0.15), 0.96)
      b.vert(f, hx + x * R * Rc * 0.46, Ht + 0.1 + y * R * Rc * (y > 0 ? 0.42 : 0.3), hz + z * R * Rc * 0.46, x, y + 0.2, z, c, wc, 0.75, phase)
    }
    for (let t = 0; t < tpl.i.length; t += 3) b.tri(base + tpl.i[t], base + tpl.i[t + 1], base + tpl.i[t + 2])
  }
  // the fans: young ones stand up in the middle, older ones arch out, their broad ends hanging
  const count = high ? 17 : 10
  const seg = high ? 3 : 2
  const S = seg === 3 ? [0, 0.42, 0.78, 1] : [0, 0.6, 1]
  const Wd = seg === 3 ? [0.05, 0.3, 0.44, 0.32] : [0.06, 0.44, 0.3]
  const a0 = rnd() * TAU
  const nv = (seg + 1) * 3
  const P = new Float32Array(nv * 3)
  const N = new Float32Array(nv * 3)
  const idx: number[] = []
  for (let j = 0; j < seg; j++) {
    const L0 = j * 3
    idx.push(L0, L0 + 1, L0 + 3, L0 + 1, L0 + 4, L0 + 3, L0 + 1, L0 + 2, L0 + 4, L0 + 2, L0 + 5, L0 + 4)
  }
  for (let k = 0; k < count; k++) {
    const u = k / (count - 1)
    const dry = u > 0.86
    const az = a0 + k * 2.39996
    const el = ((72 - 118 * Math.pow(u, 0.8) + (rnd() - 0.5) * 12) * Math.PI) / 180
    const Lf = Rc * (0.88 + rnd() * 0.12) * (0.72 + 0.28 * Math.cos(el)) * (dry ? 0.82 : 1)
    const sag = Lf * (0.14 + 0.26 * u)
    const dx = Math.cos(az)
    const dz = Math.sin(az)
    for (let j = 0; j <= seg; j++) {
      const s = S[j]
      const end = j === seg ? Lf * 0.2 : 0 // the fan's fringe hangs
      const cxp = hx + dx * Lf * s * Math.cos(el)
      const cyp = Ht + 0.08 + Lf * s * Math.sin(el) - sag * s * s - end
      const czp = hz + dz * Lf * s * Math.cos(el)
      const w = Wd[j] * Lf * 0.5
      const fold = w * (0.3 + 0.5 * s)
      P.set([cxp + dz * w, cyp - fold, czp - dx * w, cxp, cyp, czp, cxp - dz * w, cyp - fold, czp + dx * w], j * 9)
    }
    smoothNormals(P, idx, N)
    const tone = dry ? mix(PALM_OLD, PALM_DRY, 0.8) : u < 0.4 ? mix(PALM_YOUNG, PALM_MID, u / 0.4) : mix(PALM_MID, PALM_OLD, (u - 0.4) / 0.46)
    for (let side = 0; side < 2; side++) {
      const base = b.nv
      const sg = side ? -1 : 1
      for (let v = 0; v < nv; v++) {
        const s = S[Math.floor(v / 3)]
        const c = scale(tone, bright * (0.6 + 0.55 * s) * (side ? 0.6 : 1) * (v % 3 === 1 ? 0.86 : 1.06))
        const wc = scale(mix(c, WINTER_LEAF, 0.15), 0.96)
        b.vert(f, P[v * 3] - N[v * 3] * 0.012 * side, P[v * 3 + 1] - N[v * 3 + 1] * 0.012 * side, P[v * 3 + 2] - N[v * 3 + 2] * 0.012 * side, N[v * 3] * sg, N[v * 3 + 1] * sg, N[v * 3 + 2] * sg, c, wc, 0.75 + 0.85 * s, phase)
      }
      for (let t = 0; t < idx.length; t += 3) {
        if (side) b.tri(base + idx[t], base + idx[t + 2], base + idx[t + 1])
        else b.tri(base + idx[t], base + idx[t + 1], base + idx[t + 2])
      }
    }
  }
  b.grain = 1
}

// ── Norfolk Island pine ──────────────────────────────────────────────────────────────────
/**
 * Norfolk Island pine (南洋杉), the tall tiered conifers that stand over the pool in the
 * venue's photos: a straight mast carrying evenly spaced whorls of branches, each whorl a
 * soft scalloped plate with upswept tips.
 */
export function addAraucaria(b: Builder, pl: Plant, high: boolean) {
  const rnd = mulberry32(pl.seed)
  const H = clamp(2.7 + 1.9 * pl.r, 3.2, 4.6) * (0.96 + rnd() * 0.08)
  const Rmax = clamp(0.86 * pl.r, 0.45, 0.8)
  const f = frame(pl.x, pl.y, pl.z, rnd() * TAU, (rnd() - 0.5) * 0.03, (rnd() - 0.5) * 0.03)
  const phase = rnd() * TAU
  const tiers = high ? 10 : 7
  const arms = high ? 6 : 5
  const na = arms * 2
  const bright = 0.94 + rnd() * 0.12
  const sway = (y: number) => Math.pow(clamp(y / H), 1.7) * 0.8
  const winter = (c: RGB) => scale(mix(c, WINTER_LEAF, 0.12), 0.96)
  b.grain = 0.6
  for (let i = 0; i < tiers; i++) {
    const u = i / (tiers - 1)
    const y = H * (0.19 + 0.73 * Math.pow(u, 0.95))
    const R = Rmax * Math.pow(1 - 0.86 * u, 0.9) + 0.035
    const rot = i * 0.71 + rnd() * 0.4
    const thick = (0.045 + R * 0.16) * (high ? 1 : 1.5)
    const tipC = scale(mix(PINE, PINE_TIP, 0.5 + 0.4 * u), bright)
    const midC = scale(mix(PINE_DEEP, PINE, 0.55 + 0.35 * u), bright)
    const underC = scale(PINE_DEEP, bright * 0.75)
    const base = b.nv
    const sw = sway(y)
    // top centre, [mid ring], outer ring, bottom centre
    b.vert(f, 0, y + thick, 0, 0, 1, 0, midC, winter(midC), sw, phase)
    if (high) {
      for (let k = 0; k < na; k++) {
        const a = rot + (k / na) * TAU
        const rr = R * (k % 2 ? 0.46 : 0.58)
        const c = mix(midC, tipC, 0.45)
        b.vert(f, Math.cos(a) * rr, y + thick * 0.7, Math.sin(a) * rr, Math.cos(a) * 0.4, 0.92, Math.sin(a) * 0.4, c, winter(c), sw, phase)
      }
    }
    for (let k = 0; k < na; k++) {
      const a = rot + (k / na) * TAU
      const tip = k % 2 === 0
      const rr = R * (tip ? 1 : high ? 0.7 : 0.78) * (0.94 + rnd() * 0.12)
      const yy = y + (tip ? 0.1 * R : -0.04 * R) - thick * 0.25
      const c = tip ? tipC : midC
      b.vert(f, Math.cos(a) * rr, yy, Math.sin(a) * rr, Math.cos(a) * 0.85, 0.5, Math.sin(a) * 0.85, c, winter(c), sw * (tip ? 1.25 : 1), phase)
    }
    b.vert(f, 0, y - thick * 1.4, 0, 0, -1, 0, underC, winter(underC), sw, phase)
    const outer = base + 1 + (high ? na : 0)
    const bottom = outer + na
    for (let k = 0; k < na; k++) {
      const k1 = (k + 1) % na
      if (high) {
        const midr = base + 1
        b.tri(base, midr + k1, midr + k)
        b.tri(midr + k, midr + k1, outer + k)
        b.tri(outer + k, midr + k1, outer + k1)
      } else {
        b.tri(base, outer + k1, outer + k)
      }
      b.tri(bottom, outer + k, outer + k1)
    }
  }
  // leader shoot
  const base = b.nv
  const tipC = scale(PINE_TIP, bright)
  const sides = 5
  for (let k = 0; k < sides; k++) {
    const a = (k / sides) * TAU
    b.vert(f, Math.cos(a) * 0.08, H * 0.89, Math.sin(a) * 0.08, Math.cos(a), 0.3, Math.sin(a), PINE, winter(PINE), sway(H * 0.9), phase)
  }
  b.vert(f, 0, H, 0, 0, 1, 0, tipC, winter(tipC), sway(H), phase)
  for (let k = 0; k < sides; k++) b.tri(base + k, base + sides, base + ((k + 1) % sides))
  b.grain = 1
  const rt = 0.05 + 0.009 * H
  const rings: Ring[] = [
    { y: -0.4, r: rt * 1.8, ox: 0, oz: 0 },
    { y: 0.05, r: rt * 1.5, ox: 0, oz: 0 },
    { y: H * 0.3, r: rt, ox: 0, oz: 0 },
    { y: H * 0.92, r: rt * 0.35, ox: 0, oz: 0 },
  ]
  addTube(b, f, rings, high ? 6 : 5, (j) => (j >= 2 ? mix(BARK, BARK_DARK, 0.5) : BARK), sway, phase)
}

// ── planting ─────────────────────────────────────────────────────────────────────────────
const SHRUB = [
  { top: lin('#6fa955'), under: lin('#25503a') }, // clipped evergreen
  { top: lin('#a4c05c'), under: lin('#4f7f3a') }, // golden duranta
  { top: lin('#528f5c'), under: lin('#1c4636') }, // deep glossy green
]
const MULCH = lin('#6b5743')

/** A low rounded shrub (clipped evergreen mound) sitting on the ground. */
export function addShrub(b: Builder, x: number, z: number, rad: number, height: number, kind: number, seed: number, high: boolean) {
  const rnd = mulberry32(seed)
  const f = frame(x, 0, z, rnd() * TAU)
  const tpl = sphereTemplate('octa', high ? 2 : 1)
  const lobes: Lobe[] = [{ x: 0, y: 0.05, z: 0, r: 0.7, tint: 0 }]
  const n = 3 + Math.floor(rnd() * 2)
  const a0 = rnd() * TAU
  for (let i = 0; i < n; i++) {
    const a = a0 + ((i + (rnd() - 0.5) * 0.5) / n) * TAU
    lobes.push({ x: Math.cos(a) * 0.5, y: -0.1 + rnd() * 0.35, z: Math.sin(a) * 0.5, r: 0.4 + rnd() * 0.1, tint: rnd() - 0.5 })
  }
  const pal = SHRUB[kind % SHRUB.length]
  const bright = 0.9 + rnd() * 0.2
  const phase = rnd() * TAU
  const base = b.nv
  for (let v = 0; v < tpl.p.length / 3; v++) {
    const dx = tpl.p[v * 3]
    const dy = tpl.p[v * 3 + 1]
    const dz = tpl.p[v * 3 + 2]
    blob(lobes, dx, dy, dz, 14)
    const R = blobR
    // a dome: the lower part tucks under the ground
    const y = height * (0.34 + (dy * R > 0 ? dy * R * 0.7 : dy * R * 0.5))
    const g = smooth(0.0, 0.95, y / height)
    const c = scale(mix(pal.under, pal.top, g), bright * (1 - 0.34 * blobCrease) * (1 + 0.14 * blobTint))
    const w = scale(mix(c, WINTER_LEAF, 0.18), 0.95)
    b.vert(f, dx * R * rad, y, dz * R * rad, dx * 0.85, dy * 0.85 + 0.4, dz * 0.85, c, w, clamp(y / height) * 0.3, phase)
  }
  for (let t = 0; t < tpl.i.length; t += 3) b.tri(base + tpl.i[t], base + tpl.i[t + 1], base + tpl.i[t + 2])
}

/**
 * The mulched bed a drift of shrubs grows from: a very low, round-ended strip from
 * (x0, z0) to (x1, z1), `w` wide to each side.
 */
export function addBed(b: Builder, x0: number, z0: number, x1: number, z1: number, w: number, seed: number) {
  const rnd = mulberry32(seed)
  const f = frame(0, 0, 0)
  const len = Math.hypot(x1 - x0, z1 - z0)
  const ux = len > 1e-4 ? (x1 - x0) / len : 1
  const uz = len > 1e-4 ? (z1 - z0) / len : 0
  const steps = Math.max(8, Math.min(14, Math.round((len + 2 * w) / 0.22)))
  const base = b.nv
  for (let i = 0; i <= steps; i++) {
    const s = i / steps
    const along = -w + s * (len + 2 * w)
    // rounded ends: the half-width follows a circle within `w` of either end
    const e = along < 0 ? -along : along > len ? along - len : 0
    const hw = Math.sqrt(Math.max(0, w * w - e * e)) * (0.94 + rnd() * 0.12)
    const cx = x0 + ux * along
    const cz = z0 + uz * along
    const edge = scale(MULCH, 0.82)
    b.vert(f, cx - uz * hw, 0.014, cz + ux * hw, -uz * 0.2, 1, ux * 0.2, edge, edge, 0, 0)
    b.vert(f, cx, hw > 0.02 ? 0.05 : 0.014, cz, 0, 1, 0, MULCH, MULCH, 0, 0)
    b.vert(f, cx + uz * hw, 0.014, cz - ux * hw, uz * 0.2, 1, -ux * 0.2, edge, edge, 0, 0)
  }
  for (let i = 0; i < steps; i++) {
    const q = base + i * 3
    b.tri(q, q + 3, q + 1)
    b.tri(q + 1, q + 3, q + 4)
    b.tri(q + 1, q + 4, q + 2)
    b.tri(q + 2, q + 4, q + 5)
  }
}

export interface TuftLook {
  baseS: RGB
  tipS: RGB
  baseW: RGB
  tipW: RGB
  /** Outward lean of the blades (0 upright … 1 splayed). */
  splay: number
  /** Blade width at the foot, world units. */
  width: number
}
/** Reeds and tall grass of the lake margins: green in summer, straw in winter. */
export const REED: TuftLook = { baseS: lin('#4a7a3c'), tipS: lin('#a9c46c'), baseW: lin('#7d7444'), tipW: lin('#dccb90'), splay: 0.36, width: 0.042 }
/** Lawn-edge grass clumps on the banks. */
export const BANK_GRASS: TuftLook = { baseS: lin('#4d8440'), tipS: lin('#93bb5c'), baseW: lin('#6f8046'), tipW: lin('#b9b874'), splay: 0.8, width: 0.04 }
/** Red-leaved ti plants (朱蕉) that mark the planting beds in the venue's photos. */
export const TI_PLANT: TuftLook = { baseS: lin('#4f2030'), tipS: lin('#a83e52'), baseW: lin('#4d2231'), tipW: lin('#9c3f52'), splay: 0.66, width: 0.05 }

/** A tuft of tapering blades fanning out from one root. */
export function addTuft(b: Builder, x: number, y: number, z: number, rad: number, height: number, blades: number, look: TuftLook, seed: number, high: boolean) {
  const rnd = mulberry32(seed)
  const f = frame(x, y, z)
  const phase = rnd() * TAU
  const a0 = rnd() * TAU
  b.grain = 0.2
  for (let i = 0; i < blades; i++) {
    const a = a0 + (i / blades) * TAU + (rnd() - 0.5) * 0.9
    const q = i === 0 ? 0 : Math.sqrt(rnd())
    const bx = Math.cos(a) * rad * q * 0.6
    const bz = Math.sin(a) * rad * q * 0.6
    const len = height * (0.7 + rnd() * 0.3) * (1 - 0.25 * q)
    const tilt = look.splay * (0.25 + 0.75 * q) * (0.7 + rnd() * 0.5)
    const dx = Math.cos(a) * Math.sin(tilt)
    const dz = Math.sin(a) * Math.sin(tilt)
    const dy = Math.cos(tilt)
    const w = look.width * (0.8 + rnd() * 0.5)
    const k = 0.85 + rnd() * 0.3
    const cb = scale(look.baseS, k)
    const ct = scale(look.tipS, k)
    const wb = scale(look.baseW, k)
    const wt = scale(look.tipW, k)
    const base = b.nv
    const ring = (s: number, ww: number, bend: number, cs: RGB, cw: RGB) => {
      const px = bx + dx * len * s + Math.cos(a) * bend
      const py = dy * len * s - bend * 0.6
      const pz = bz + dz * len * s + Math.sin(a) * bend
      for (let c = 0; c < 3; c++) {
        const ca = a + (c / 3) * TAU
        b.vert(f, px + Math.cos(ca) * ww, py, pz + Math.sin(ca) * ww, Math.cos(ca) * 0.6 + dx * 0.4, 0.55, Math.sin(ca) * 0.6 + dz * 0.4, cs, cw, s * 1.5, phase + i)
      }
    }
    // the few tall blades in the middle arch over; the rest are simple spikes
    const arched = high && i < 3
    ring(0, w, 0, cb, wb)
    if (arched) ring(0.55, w * 0.72, len * 0.04 * look.splay, mix(cb, ct, 0.55), mix(wb, wt, 0.55))
    const bend = len * 0.16 * look.splay
    const tip = b.vert(f, bx + dx * len + Math.cos(a) * bend, dy * len - bend * 0.6, bz + dz * len + Math.sin(a) * bend, dx, 0.8, dz, ct, wt, 1.5, phase + i)
    const top = arched ? base + 3 : base
    if (arched) {
      for (let c = 0; c < 3; c++) {
        const c1 = (c + 1) % 3
        b.tri(base + c, base + 3 + c, base + c1)
        b.tri(base + c1, base + 3 + c, base + 3 + c1)
      }
    }
    for (let c = 0; c < 3; c++) b.tri(top + c, tip, top + ((c + 1) % 3))
  }
  b.grain = 1
}
