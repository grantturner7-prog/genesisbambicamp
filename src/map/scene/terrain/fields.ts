import * as THREE from 'three'
import { layout, roads } from '../../layout/layout'
import { fillSdf, makeField, makeNoise, sample, smoothClosed, smoothstep, toWorldPoly, type Field, type V2 } from './geo'

/** Height of the lake surface and of the pool surface (the lawn is y = 0). */
export const WATER_Y = -0.32
export const POOL_WATER_Y = 0.05

/** Ground rectangle covered by the mask texture: the traced map plus a margin all round. */
export const MASK_RECT = { x0: -72, z0: -48, sx: 144, sz: 96 }
/** Half-width (world units) of each distance band stored in the mask. */
export const BAND = { road: 1.25, water: 4, land: 2 }
/** Range of the "distance beyond the tree line" channel. */
export const WOOD_LO = -2
export const WOOD_HI = 10
/** The land stays flat out to this distance beyond the camp boundary, then the woodland rises. */
export const FLAT_MARGIN = 9

export interface Fields {
  /** R road, G water (lakes and pool), B camp boundary, A woodland: see the ground material. */
  mask: THREE.DataTexture
  lakeRings: V2[][]
  poolRing: V2[]
  /** Signed distance to the nearest lake or pool edge (negative in the water), ±BAND.water. */
  water: Field
  /** Signed distance to the nearest road edge (negative on the road), ±BAND.road. */
  road: Field
  /** Distance outside the camp boundary (negative inside), exact to 18 units. */
  landFar: Field
  /** Distance beyond the tree line of the surrounding woodland (negative on open ground). */
  wood: Field
  /** Height of the land around the camp. `far` is the distance beyond the flat margin, when known. */
  heightAt: (x: number, z: number, far?: number) => number
}

/**
 * The access road runs off the edge of the traced map at the camp boundary. Continue it
 * a little way into the woodland, where the trees close over it.
 */
function accessLane(landFar: Field): V2[] | null {
  for (const r of layout.roads) {
    const ring = toWorldPoly(r.outer)
    const end = ring.filter((p) => sample(landFar, p[0], p[1]) > -0.35)
    if (end.length < 2) continue
    const ex = end.reduce((s, p) => s + p[0], 0) / end.length
    const ez = end.reduce((s, p) => s + p[1], 0) / end.length
    const near = ring.filter((p) => !end.includes(p) && Math.hypot(p[0] - ex, p[1] - ez) < 6.5)
    if (!near.length) continue
    const mx = near.reduce((s, p) => s + p[0], 0) / near.length
    const mz = near.reduce((s, p) => s + p[1], 0) / near.length
    let dx = ex - mx
    let dz = ez - mz
    const l = Math.hypot(dx, dz) || 1
    dx /= l
    dz /= l
    // centre line: start inside the traced road, then swing gently toward the east
    const left: V2[] = []
    const right: V2[] = []
    const steps = 14
    let x = ex - dx * 1.6
    let z = ez - dz * 1.6
    let a = Math.atan2(dz, dx)
    const bend = (Math.atan2(0.15, 1) - a) / steps
    for (let i = 0; i <= steps; i++) {
      const hw = 0.82 - 0.3 * (i / steps)
      const nx = -Math.sin(a)
      const nz = Math.cos(a)
      left.push([x + nx * hw, z + nz * hw])
      right.push([x - nx * hw, z - nz * hw])
      x += Math.cos(a) * 1.15
      z += Math.sin(a) * 1.15
      a += bend
    }
    return [...left, ...right.reverse()]
  }
  return null
}

export function buildFields(high: boolean): Fields {
  const lakeRings = [layout.lakes.wild, layout.lakes.kayak].map((p) => smoothClosed(toWorldPoly(p), 4))
  const poolRing = smoothClosed(toWorldPoly(layout.lakes.pool), 6)
  const landRing = smoothClosed(toWorldPoly(layout.land), 3)

  // Far field of the camp boundary on a coarse grid: tree line, flat margin, crown placement.
  const landFar = makeField(-84, -60, 168, 120, 0.5)
  fillSdf(landFar, [[toWorldPoly(layout.land)]], 18)
  const n = makeNoise(7)
  const wood: Field = { ...landFar, d: new Float32Array(landFar.d.length) }
  for (let j = 0; j < wood.h; j++) {
    for (let i = 0; i < wood.w; i++) {
      const x = wood.x0 + (i + 0.5) * wood.cell
      const z = wood.z0 + (j + 0.5) * wood.cell
      // open, rough ground between the lawn and the trees: 1.5 to 5 units wide
      const apron = 1.5 + 3.5 * smoothstep(0.25, 0.8, n.fbm(x / 17, z / 17, 2))
      wood.d[j * wood.w + i] = landFar.d[j * wood.w + i] - apron
    }
  }

  const res = high ? 7 : 5
  const { x0, z0, sx, sz } = MASK_RECT
  const road = makeField(x0, z0, sx, sz, 1 / res)
  const water = makeField(x0, z0, sx, sz, 1 / res)
  const land = makeField(x0, z0, sx, sz, 1 / res)
  const lane = accessLane(landFar)
  const roadShapes = roads.map((r) => [smoothClosed(toWorldPoly(r.outer), 2), ...r.holes.map((h) => smoothClosed(toWorldPoly(h), 2))])
  if (lane) roadShapes.push([smoothClosed(lane, 2)])
  fillSdf(road, roadShapes, BAND.road)
  fillSdf(water, [...lakeRings.map((r) => [r]), [poolRing]], BAND.water)
  fillSdf(land, [[landRing]], BAND.land)

  // Pack the four fields into one texture (the clamped view rounds and clamps on write).
  const { w, h } = road
  const data = new Uint8Array(w * h * 4)
  const px = new Uint8ClampedArray(data.buffer)
  const kRoad = -127.5 / BAND.road
  const kWater = -127.5 / BAND.water
  const kLand = -127.5 / BAND.land
  const woodScale = 255 / (WOOD_HI - WOOD_LO)
  // the woodland field is coarser: precompute where each texel column falls in it
  const ci = new Int32Array(w)
  const ct = new Float32Array(w)
  for (let i = 0; i < w; i++) {
    const fx = Math.max(0, Math.min(wood.w - 1.001, (x0 + (i + 0.5) / res - wood.x0) / wood.cell - 0.5))
    ci[i] = Math.floor(fx)
    ct[i] = fx - ci[i]
  }
  const wd = wood.d
  for (let j = 0, k = 0; j < h; j++) {
    const fz = Math.max(0, Math.min(wood.h - 1.001, (z0 + (j + 0.5) / res - wood.z0) / wood.cell - 0.5))
    const r0 = Math.floor(fz) * wood.w
    const r1 = r0 + wood.w
    const tz = fz - Math.floor(fz)
    for (let i = 0; i < w; i++, k++) {
      const o = k * 4
      px[o] = 127.5 + road.d[k] * kRoad
      px[o + 1] = 127.5 + water.d[k] * kWater
      px[o + 2] = 127.5 + land.d[k] * kLand
      const c = ci[i]
      const tx = ct[i]
      const wv = (wd[r0 + c] * (1 - tx) + wd[r0 + c + 1] * tx) * (1 - tz) + (wd[r1 + c] * (1 - tx) + wd[r1 + c + 1] * tx) * tz
      px[o + 3] = (wv - WOOD_LO) * woodScale
    }
  }
  const mask = new THREE.DataTexture(data, w, h, THREE.RGBAFormat)
  mask.colorSpace = THREE.NoColorSpace
  mask.magFilter = THREE.LinearFilter
  mask.minFilter = THREE.LinearFilter
  mask.generateMipmaps = false
  mask.needsUpdate = true

  // Rolling wooded hills. The camp lies in a shallow valley: the land is level around it, swells
  // into low hills a little way off and into broad ridges toward the horizon. The heights stay
  // under the lowest line of sight the camera can take, so the hills never hide the camp.
  const hn = makeNoise(29)
  const heightAt = (x: number, z: number, far?: number) => {
    const L = far !== undefined ? FLAT_MARGIN + far : sample(landFar, x, z)
    if (L <= FLAT_MARGIN) return 0
    const canopy = 2.3 * smoothstep(FLAT_MARGIN, FLAT_MARGIN + 8, L)
    const rise = 10 * (1 - Math.exp(-Math.max(0, L - 14) / 300))
    const hills = smoothstep(14, 130, L) * (1 - 0.5 * smoothstep(320, 700, L)) * 22 * smoothstep(0.3, 0.72, hn.fbm(x / 118, z / 118, 2))
    const ridges = smoothstep(110, 520, L) * 85 * smoothstep(0.3, 0.72, hn.fbm(x / 380 + 7.3, z / 380 - 2.1, 2))
    return canopy + rise + hills + ridges
  }

  return { mask, lakeRings, poolRing, water, road, landFar, wood, heightAt }
}
