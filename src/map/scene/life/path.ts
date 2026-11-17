import { wx, wz, type Pt } from '../../layout/layout'

/** A closed, smooth path in world coordinates, sampled at a uniform spacing for cheap lookups. */
export interface Path {
  /** Number of samples; sample i is at arc length i * step. */
  n: number
  step: number
  length: number
  /** x0, z0, x1, z1, ... */
  xz: Float32Array
}

/**
 * Closed Catmull-Rom spline through control points given in map pixels, resampled every
 * `step` world units.
 */
export function closedPath(px: readonly number[] | readonly Pt[], step = 0.05, perSpan = 8): Path {
  const pts: number[] = []
  if (typeof px[0] === 'number') {
    const flat = px as readonly number[]
    for (let i = 0; i < flat.length; i += 2) pts.push(wx(flat[i]), wz(flat[i + 1]))
  } else {
    for (const p of px as readonly Pt[]) pts.push(wx(p[0]), wz(p[1]))
  }
  const n = pts.length / 2
  const fine: number[] = []
  for (let i = 0; i < n; i++) {
    const i0 = ((i - 1 + n) % n) * 2
    const i1 = i * 2
    const i2 = ((i + 1) % n) * 2
    const i3 = ((i + 2) % n) * 2
    for (let k = 0; k < perSpan; k++) {
      const t = k / perSpan
      const t2 = t * t
      const t3 = t2 * t
      for (let c = 0; c < 2; c++) {
        const p0 = pts[i0 + c]
        const p1 = pts[i1 + c]
        const p2 = pts[i2 + c]
        const p3 = pts[i3 + c]
        fine.push(0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
      }
    }
  }
  const m = fine.length / 2
  const cum = new Float64Array(m + 1)
  for (let i = 0; i < m; i++) {
    const j = ((i + 1) % m) * 2
    cum[i + 1] = cum[i] + Math.hypot(fine[j] - fine[i * 2], fine[j + 1] - fine[i * 2 + 1])
  }
  const length = cum[m]
  const count = Math.max(8, Math.round(length / step))
  const xz = new Float32Array(count * 2)
  let j = 0
  for (let k = 0; k < count; k++) {
    const s = (k / count) * length
    while (cum[j + 1] < s) j++
    const t = (s - cum[j]) / (cum[j + 1] - cum[j] || 1)
    const a = j * 2
    const b = ((j + 1) % m) * 2
    xz[k * 2] = fine[a] + (fine[b] - fine[a]) * t
    xz[k * 2 + 1] = fine[a + 1] + (fine[b + 1] - fine[a + 1]) * t
  }
  return { n: count, step: length / count, length, xz }
}

/** Position on the path at arc length `s` (wraps around). Writes into `out` and returns it. */
export function pointAt(p: Path, s: number, out: [number, number]): [number, number] {
  let f = (s / p.step) % p.n
  if (f < 0) f += p.n
  const i = Math.floor(f)
  const t = f - i
  const a = (i % p.n) * 2
  const b = ((i + 1) % p.n) * 2
  out[0] = p.xz[a] + (p.xz[b] - p.xz[a]) * t
  out[1] = p.xz[a + 1] + (p.xz[b + 1] - p.xz[a + 1]) * t
  return out
}

/** Curvature (1 / radius) at every sample, measured over a chord of about `span` world units. */
export function curvature(p: Path, span = 0.4): Float32Array {
  const k = Math.max(1, Math.round(span / p.step))
  const out = new Float32Array(p.n)
  for (let i = 0; i < p.n; i++) {
    const a = ((i - k + p.n) % p.n) * 2
    const b = i * 2
    const c = ((i + k) % p.n) * 2
    const abx = p.xz[b] - p.xz[a]
    const abz = p.xz[b + 1] - p.xz[a + 1]
    const bcx = p.xz[c] - p.xz[b]
    const bcz = p.xz[c + 1] - p.xz[b + 1]
    const cax = p.xz[a] - p.xz[c]
    const caz = p.xz[a + 1] - p.xz[c + 1]
    const area2 = Math.abs(abx * -caz - abz * -cax)
    const d = Math.hypot(abx, abz) * Math.hypot(bcx, bcz) * Math.hypot(cax, caz)
    out[i] = d > 1e-9 ? (2 * area2) / d : 0
  }
  return out
}

/** Arc length of the sample nearest to a world point, searched between two arc lengths. */
export function nearestS(p: Path, x: number, z: number, from = 0, to = p.length): number {
  let best = Infinity
  let bi = 0
  const i0 = Math.floor(from / p.step)
  const i1 = Math.ceil(to / p.step)
  for (let i = i0; i <= i1; i++) {
    const a = (((i % p.n) + p.n) % p.n) * 2
    const d = (p.xz[a] - x) * (p.xz[a] - x) + (p.xz[a + 1] - z) * (p.xz[a + 1] - z)
    if (d < best) {
      best = d
      bi = i
    }
  }
  return bi * p.step
}

/**
 * Speed limit along a closed path for a train: slow enough in bends (lateral acceleration
 * `aLat`) for the whole length of the train, never above `vMax`, zero at `stopS`, and reached
 * with gentle acceleration `acc` and braking `brake`.
 */
export function speedProfile(p: Path, opts: { vMax: number; aLat: number; acc: number; brake: number; stopS: number; trainLength: number }): Float32Array {
  const kappa = curvature(p)
  const raw = new Float32Array(p.n)
  for (let i = 0; i < p.n; i++) raw[i] = Math.min(opts.vMax, Math.sqrt(opts.aLat / Math.max(kappa[i], 1e-4)))
  // the limit applies while any part of the train is in the bend
  const win = Math.round(opts.trainLength / p.step)
  const v = new Float32Array(p.n)
  for (let i = 0; i < p.n; i++) {
    let m = raw[i]
    for (let k = 1; k <= win; k += 2) m = Math.min(m, raw[(i - k + p.n * 2) % p.n])
    v[i] = m
  }
  const stop = Math.round(opts.stopS / p.step) % p.n
  v[stop] = 0
  for (let pass = 0; pass < 2; pass++) {
    for (let k = 0; k < p.n; k++) {
      const i = (stop + k) % p.n
      const j = (i + 1) % p.n
      if (j !== stop) v[j] = Math.min(v[j], Math.sqrt(v[i] * v[i] + 2 * opts.acc * p.step))
    }
    for (let k = 0; k < p.n; k++) {
      const i = (stop - k + p.n) % p.n
      const j = (i - 1 + p.n) % p.n
      if (j !== stop) v[j] = Math.min(v[j], Math.sqrt(v[i] * v[i] + 2 * opts.brake * p.step))
    }
  }
  return v
}
