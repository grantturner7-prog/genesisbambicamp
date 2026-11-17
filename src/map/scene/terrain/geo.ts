import { mulberry32, wx, wz, type Pt } from '../../layout/layout'

/** A point on the ground plane, in world units: [x, z]. */
export type V2 = [number, number]

export const toWorldPoly = (poly: Pt[]): V2[] => poly.map((p) => [wx(p[0]), wz(p[1])] as V2)

/**
 * Closed centripetal Catmull-Rom curve through the traced points. The curve passes through
 * every traced point, so the layout stays exact; it only removes the corners between them.
 */
export function smoothClosed(pts: V2[], sub: number): V2[] {
  const n = pts.length
  const out: V2[] = []
  const knot = (a: V2, b: V2) => Math.max(1e-4, Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1])))
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % n]
    const p3 = pts[(i + 2) % n]
    const t1 = knot(p0, p1)
    const t2 = t1 + knot(p1, p2)
    const t3 = t2 + knot(p2, p3)
    for (let s = 0; s < sub; s++) {
      const t = t1 + ((t2 - t1) * s) / sub
      const o: V2 = [0, 0]
      for (let c = 0; c < 2; c++) {
        const a1 = ((t1 - t) / t1) * p0[c] + (t / t1) * p1[c]
        const a2 = ((t2 - t) / (t2 - t1)) * p1[c] + ((t - t1) / (t2 - t1)) * p2[c]
        const a3 = ((t3 - t) / (t3 - t2)) * p2[c] + ((t - t2) / (t3 - t2)) * p3[c]
        const b1 = ((t2 - t) / t2) * a1 + (t / t2) * a2
        const b2 = ((t3 - t) / (t3 - t1)) * a2 + ((t - t1) / (t3 - t1)) * a3
        o[c] = ((t2 - t) / (t2 - t1)) * b1 + ((t - t1) / (t2 - t1)) * b2
      }
      out.push(o)
    }
  }
  return out
}

/** Twice the signed area (positive when the ring runs counter-clockwise in x/z). */
export function area2(pts: V2[]): number {
  let a = 0
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1]
  return a
}

/** Unit normals at every vertex of a closed ring, pointing away from its interior. */
export function outwardNormals(pts: V2[]): V2[] {
  const n = pts.length
  const sign = area2(pts) > 0 ? 1 : -1
  const out: V2[] = []
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 1 + n) % n]
    const b = pts[i]
    const c = pts[(i + 1) % n]
    let nx = 0
    let nz = 0
    for (const [p, q] of [
      [a, b],
      [b, c],
    ] as [V2, V2][]) {
      const ex = q[0] - p[0]
      const ez = q[1] - p[1]
      const l = Math.hypot(ex, ez) || 1
      nx += (ez / l) * sign
      nz += (-ex / l) * sign
    }
    const l = Math.hypot(nx, nz) || 1
    out.push([nx / l, nz / l])
  }
  return out
}

/** Regular grid of samples over a rectangle of the ground plane (sample k sits at the cell centre). */
export interface Field {
  w: number
  h: number
  x0: number
  z0: number
  cell: number
  d: Float32Array
}

export function makeField(x0: number, z0: number, sizeX: number, sizeZ: number, cell: number): Field {
  const w = Math.round(sizeX / cell)
  const h = Math.round(sizeZ / cell)
  return { w, h, x0, z0, cell, d: new Float32Array(w * h) }
}

/** Bilinear lookup, clamped at the border. */
export function sample(f: Field, x: number, z: number): number {
  let fx = (x - f.x0) / f.cell - 0.5
  let fz = (z - f.z0) / f.cell - 0.5
  fx = fx < 0 ? 0 : fx > f.w - 1 ? f.w - 1 : fx
  fz = fz < 0 ? 0 : fz > f.h - 1 ? f.h - 1 : fz
  const i = Math.min(f.w - 2, Math.floor(fx))
  const j = Math.min(f.h - 2, Math.floor(fz))
  const tx = fx - i
  const tz = fz - j
  const k = j * f.w + i
  const d = f.d
  return (d[k] * (1 - tx) + d[k + 1] * tx) * (1 - tz) + (d[k + f.w] * (1 - tx) + d[k + f.w + 1] * tx) * tz
}

/**
 * Signed distance (negative inside) from every sample of `f` to the union of `shapes`,
 * exact within ±band and clamped beyond it. A shape is [outer ring, ...hole rings].
 * Only samples within `band` of an edge are visited, so this stays cheap.
 */
export function fillSdf(f: Field, shapes: V2[][][], band: number): void {
  const { w, h, x0, z0, cell } = f
  const out = f.d
  out.fill(band)
  const d2 = new Float32Array(w * h)
  const inside = new Uint8Array(w * h)
  const xs: number[] = []
  const b2 = band * band
  for (const rings of shapes) {
    // everything below stays inside the shape's bounding box, widened by the band
    let xMin = Infinity
    let xMax = -Infinity
    let zMin = Infinity
    let zMax = -Infinity
    for (const ring of rings) {
      for (const p of ring) {
        if (p[0] < xMin) xMin = p[0]
        if (p[0] > xMax) xMax = p[0]
        if (p[1] < zMin) zMin = p[1]
        if (p[1] > zMax) zMax = p[1]
      }
    }
    const bi0 = Math.max(0, Math.floor((xMin - band - x0) / cell - 0.5))
    const bi1 = Math.min(w - 1, Math.ceil((xMax + band - x0) / cell - 0.5))
    const bj0 = Math.max(0, Math.floor((zMin - band - z0) / cell - 0.5))
    const bj1 = Math.min(h - 1, Math.ceil((zMax + band - z0) / cell - 0.5))
    if (bi1 < bi0 || bj1 < bj0) continue
    for (let j = bj0; j <= bj1; j++) {
      d2.fill(b2, j * w + bi0, j * w + bi1 + 1)
      inside.fill(0, j * w + bi0, j * w + bi1 + 1)
    }
    for (const ring of rings) {
      for (let a = ring.length - 1, b = 0; b < ring.length; a = b++) {
        const ax = ring[a][0]
        const az = ring[a][1]
        const ex = ring[b][0] - ax
        const ez = ring[b][1] - az
        const il = 1 / (ex * ex + ez * ez || 1e-12)
        const i0 = Math.max(bi0, Math.floor((Math.min(ax, ax + ex) - band - x0) / cell - 0.5))
        const i1 = Math.min(bi1, Math.ceil((Math.max(ax, ax + ex) + band - x0) / cell - 0.5))
        const j0 = Math.max(bj0, Math.floor((Math.min(az, az + ez) - band - z0) / cell - 0.5))
        const j1 = Math.min(bj1, Math.ceil((Math.max(az, az + ez) + band - z0) / cell - 0.5))
        for (let j = j0; j <= j1; j++) {
          const pz = z0 + (j + 0.5) * cell - az
          let k = j * w + i0
          for (let i = i0; i <= i1; i++, k++) {
            const px = x0 + (i + 0.5) * cell - ax
            let t = (px * ex + pz * ez) * il
            t = t < 0 ? 0 : t > 1 ? 1 : t
            const dx = px - ex * t
            const dz = pz - ez * t
            const q = dx * dx + dz * dz
            if (q < d2[k]) d2[k] = q
          }
        }
      }
    }
    // even-odd scanline fill at the sample centres
    for (let j = bj0; j <= bj1; j++) {
      const zc = z0 + (j + 0.5) * cell
      if (zc < zMin || zc > zMax) continue
      xs.length = 0
      for (const ring of rings) {
        for (let a = ring.length - 1, b = 0; b < ring.length; a = b++) {
          const za = ring[a][1]
          const zb = ring[b][1]
          if (za <= zc !== zb <= zc) xs.push(ring[a][0] + ((zc - za) / (zb - za)) * (ring[b][0] - ring[a][0]))
        }
      }
      if (xs.length < 2) continue
      xs.sort((p, q) => p - q)
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const i0 = Math.max(0, Math.ceil((xs[k] - x0) / cell - 0.5))
        const i1 = Math.min(w - 1, Math.floor((xs[k + 1] - x0) / cell - 0.5))
        for (let i = i0; i <= i1; i++) inside[j * w + i] = 1
      }
    }
    for (let j = bj0; j <= bj1; j++) {
      for (let k = j * w + bi0, end = j * w + bi1; k <= end; k++) {
        if (inside[k]) {
          const v = d2[k] < b2 ? -Math.sqrt(d2[k]) : -band
          if (v < out[k]) out[k] = v
        } else if (d2[k] < b2) {
          const v = Math.sqrt(d2[k])
          if (v < out[k]) out[k] = v
        }
      }
    }
  }
}

/** Smooth, repeatable value noise in [0, 1]; `fbm` sums a few octaves of it. */
export function makeNoise(seed: number) {
  const rnd = mulberry32(seed)
  const N = 256
  const table = new Float32Array(N * N)
  for (let i = 0; i < table.length; i++) table[i] = rnd()
  const at = (ix: number, iz: number) => table[(iz & 255) * N + (ix & 255)]
  const noise = (x: number, z: number) => {
    const x0 = Math.floor(x)
    const z0 = Math.floor(z)
    const tx = x - x0
    const tz = z - z0
    const sx = tx * tx * (3 - 2 * tx)
    const sz = tz * tz * (3 - 2 * tz)
    return (at(x0, z0) * (1 - sx) + at(x0 + 1, z0) * sx) * (1 - sz) + (at(x0, z0 + 1) * (1 - sx) + at(x0 + 1, z0 + 1) * sx) * sz
  }
  const fbm = (x: number, z: number, octaves = 3) => {
    let v = 0
    let amp = 1
    let total = 0
    for (let o = 0; o < octaves; o++) {
      v += noise(x + o * 17.3, z - o * 9.1) * amp
      total += amp
      amp *= 0.5
      x *= 2.03
      z *= 2.03
    }
    return v / total
  }
  return { noise, fbm }
}

export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
