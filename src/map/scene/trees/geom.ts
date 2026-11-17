import * as THREE from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/** Linear-space colour triple (what a three.js `color` vertex attribute holds). */
export type RGB = [number, number, number]

const _c = new THREE.Color()
/** '#rrggbb' (sRGB) to a linear colour triple. */
export function lin(hex: string): RGB {
  _c.set(hex)
  return [_c.r, _c.g, _c.b]
}
export const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
export const scale = (a: RGB, k: number): RGB => [a[0] * k, a[1] * k, a[2] * k]
export const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v)
export const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Cheap repeatable lattice hash in 0..1. */
function hash3(x: number, y: number, z: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
/** Smooth 3D value noise in 0..1. */
export function vnoise(x: number, y: number, z: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const zi = Math.floor(z)
  const fx = x - xi
  const fy = y - yi
  const fz = z - zi
  const u = fx * fx * (3 - 2 * fx)
  const v = fy * fy * (3 - 2 * fy)
  const w = fz * fz * (3 - 2 * fz)
  const a = lerp(lerp(hash3(xi, yi, zi), hash3(xi + 1, yi, zi), u), lerp(hash3(xi, yi + 1, zi), hash3(xi + 1, yi + 1, zi), u), v)
  const b = lerp(lerp(hash3(xi, yi, zi + 1), hash3(xi + 1, yi, zi + 1), u), lerp(hash3(xi, yi + 1, zi + 1), hash3(xi + 1, yi + 1, zi + 1), u), v)
  return lerp(a, b, w)
}
/** Two octaves of value noise, 0..1, centred on 0.5. */
export const fbm = (x: number, y: number, z: number) => vnoise(x, y, z) * 0.65 + vnoise(x * 2.1 + 7.3, y * 2.1 + 1.7, z * 2.1 + 4.1) * 0.35

/** Unit sphere with shared vertices: flat arrays of positions (= outward directions) and triangle indices. */
export interface Template {
  p: Float32Array
  i: Uint32Array | Uint16Array
}
const templates = new Map<string, Template>()
/** Indexed unit sphere; 'ico' has 20·(d+1)² triangles, 'octa' has 8·(d+1)². */
export function sphereTemplate(kind: 'ico' | 'octa', detail: number): Template {
  const key = kind + detail
  let t = templates.get(key)
  if (!t) {
    const raw = kind === 'ico' ? new THREE.IcosahedronGeometry(1, detail) : new THREE.OctahedronGeometry(1, detail)
    raw.deleteAttribute('uv')
    raw.deleteAttribute('normal')
    const g = mergeVertices(raw, 1e-4)
    t = { p: g.getAttribute('position').array as Float32Array, i: g.getIndex()!.array as Uint32Array | Uint16Array }
    templates.set(key, t)
    raw.dispose()
  }
  return t
}

/** Area-weighted smooth vertex normals for an indexed triangle soup. */
export function smoothNormals(p: ArrayLike<number>, idx: ArrayLike<number>, out: Float32Array, triCount = idx.length / 3): Float32Array {
  out.fill(0, 0, (p.length / 3) * 3)
  for (let t = 0; t < triCount; t++) {
    const a = idx[t * 3] * 3
    const b = idx[t * 3 + 1] * 3
    const c = idx[t * 3 + 2] * 3
    const e1x = p[b] - p[a]
    const e1y = p[b + 1] - p[a + 1]
    const e1z = p[b + 2] - p[a + 2]
    const e2x = p[c] - p[a]
    const e2y = p[c + 1] - p[a + 1]
    const e2z = p[c + 2] - p[a + 2]
    const nx = e1y * e2z - e1z * e2y
    const ny = e1z * e2x - e1x * e2z
    const nz = e1x * e2y - e1y * e2x
    out[a] += nx
    out[a + 1] += ny
    out[a + 2] += nz
    out[b] += nx
    out[b + 1] += ny
    out[b + 2] += nz
    out[c] += nx
    out[c + 1] += ny
    out[c + 2] += nz
  }
  for (let v = 0; v < p.length; v += 3) {
    const l = Math.hypot(out[v], out[v + 1], out[v + 2]) || 1
    out[v] /= l
    out[v + 1] /= l
    out[v + 2] /= l
  }
  return out
}

/**
 * Where a plant stands: local +Y is up; the local frame is turned about Y, sheared for a
 * slight lean (the base stays flat on the ground) and moved to its spot.
 */
export interface Frame {
  x: number
  y: number
  z: number
  cos: number
  sin: number
  leanX: number
  leanZ: number
}
export function frame(x: number, y: number, z: number, rotY = 0, leanX = 0, leanZ = 0): Frame {
  return { x, y, z, cos: Math.cos(rotY), sin: Math.sin(rotY), leanX, leanZ }
}

/**
 * Collects every plant of one kind into a single static mesh: positions, smooth normals,
 * a summer and a winter colour per vertex, and per-vertex data for the material
 * (sway weight, sway phase, grain).
 */
export class Builder {
  private pos = new Float32Array(3 * 8192)
  private nor = new Float32Array(3 * 8192)
  private cs = new Float32Array(3 * 8192)
  private cw = new Float32Array(3 * 8192)
  private wind = new Float32Array(3 * 8192)
  private idx = new Uint32Array(3 * 16384)
  nv = 0
  ni = 0
  /**
   * Grain of the surface being added (read by the material): 1 = even leafy clumps,
   * below 1 = stretched upward into hanging needles or along a frond.
   */
  grain = 1

  private growV() {
    const grow = (a: Float32Array) => {
      const b = new Float32Array(a.length * 2)
      b.set(a)
      return b
    }
    this.pos = grow(this.pos)
    this.nor = grow(this.nor)
    this.cs = grow(this.cs)
    this.cw = grow(this.cw)
    this.wind = grow(this.wind)
  }

  /** Adds a vertex given in the plant's local frame; returns its index. */
  vert(f: Frame, lx: number, ly: number, lz: number, nx: number, ny: number, nz: number, summer: RGB, winter: RGB, sway: number, phase: number): number {
    if ((this.nv + 1) * 3 > this.pos.length) this.growV()
    const v = this.nv++
    const rx = lx * f.cos + lz * f.sin
    const rz = -lx * f.sin + lz * f.cos
    this.pos[v * 3] = f.x + rx + f.leanX * ly
    this.pos[v * 3 + 1] = f.y + ly
    this.pos[v * 3 + 2] = f.z + rz + f.leanZ * ly
    const nl = Math.hypot(nx, ny, nz) || 1
    this.nor[v * 3] = (nx * f.cos + nz * f.sin) / nl
    this.nor[v * 3 + 1] = ny / nl
    this.nor[v * 3 + 2] = (-nx * f.sin + nz * f.cos) / nl
    this.cs[v * 3] = summer[0]
    this.cs[v * 3 + 1] = summer[1]
    this.cs[v * 3 + 2] = summer[2]
    this.cw[v * 3] = winter[0]
    this.cw[v * 3 + 1] = winter[1]
    this.cw[v * 3 + 2] = winter[2]
    this.wind[v * 3] = sway
    this.wind[v * 3 + 1] = phase
    this.wind[v * 3 + 2] = this.grain
    return v
  }

  tri(a: number, b: number, c: number) {
    if (this.ni + 3 > this.idx.length) {
      const n = new Uint32Array(this.idx.length * 2)
      n.set(this.idx)
      this.idx = n
    }
    this.idx[this.ni++] = a
    this.idx[this.ni++] = b
    this.idx[this.ni++] = c
  }

  get triangles() {
    return this.ni / 3
  }

  toGeometry(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(this.pos.slice(0, this.nv * 3), 3))
    g.setAttribute('normal', new THREE.BufferAttribute(this.nor.slice(0, this.nv * 3), 3))
    g.setAttribute('color', new THREE.BufferAttribute(this.cs.slice(0, this.nv * 3), 3))
    g.setAttribute('aWinter', new THREE.BufferAttribute(this.cw.slice(0, this.nv * 3), 3))
    g.setAttribute('aWind', new THREE.BufferAttribute(this.wind.slice(0, this.nv * 3), 3))
    g.setIndex(new THREE.BufferAttribute(this.nv > 65535 ? this.idx.slice(0, this.ni) : Uint16Array.from(this.idx.subarray(0, this.ni)), 1))
    g.computeBoundingSphere()
    g.computeBoundingBox()
    return g
  }
}
