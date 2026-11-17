import * as THREE from 'three'

/**
 * Small modelling kit for the buildings layer. Shapes are built as plain arrays ("parts"),
 * coloured and placed by a `Mesher`, and come out as ONE BufferGeometry per material group,
 * so a whole building (or all of them) costs a single draw call.
 *
 * Normals are "face weighted": flat faces stay perfectly flat and only the narrow edge
 * bevels blend between them, which gives the soft, machined edges of an architectural model
 * for very few triangles.
 */
export interface Part {
  /** positions (xyz) */
  p: number[]
  /** normals (xyz) */
  n: number[]
  /** triangle indices */
  i: number[]
}

type P2 = [number, number]
type P3 = [number, number, number]

const len2 = (x: number, y: number) => Math.hypot(x, y) || 1

/**
 * Prism: a polygon in the XY plane extruded along Z (centred on z = 0).
 * `r` rounds the polygon's corners, `b` bevels the two cap edges; with both 0 the prism is
 * hard-edged. `rs` = segments per rounded corner (1 = chamfer, 2+ = arc).
 */
export function prism(poly: P2[], depth: number, r = 0, b = 0, rs = 1): Part {
  // counter-clockwise
  let area = 0
  for (let k = 0; k < poly.length; k++) {
    const [x0, y0] = poly[k]
    const [x1, y1] = poly[(k + 1) % poly.length]
    area += x0 * y1 - x1 * y0
  }
  const pts = area < 0 ? [...poly].reverse() : poly
  const N = pts.length
  const p: number[] = []
  const n: number[] = []
  const i: number[] = []
  const hz = depth / 2

  if (r <= 0 && b <= 0) {
    // hard edges: every face owns its vertices
    for (let k = 0; k < N; k++) {
      const [x0, y0] = pts[k]
      const [x1, y1] = pts[(k + 1) % N]
      const l = len2(x1 - x0, y1 - y0)
      const nx = (y1 - y0) / l
      const ny = -(x1 - x0) / l
      const o = p.length / 3
      p.push(x0, y0, -hz, x1, y1, -hz, x1, y1, hz, x0, y0, hz)
      n.push(nx, ny, 0, nx, ny, 0, nx, ny, 0, nx, ny, 0)
      i.push(o, o + 1, o + 2, o, o + 2, o + 3)
    }
    const tris = THREE.ShapeUtils.triangulateShape(
      pts.map(([x, y]) => new THREE.Vector2(x, y)),
      [],
    )
    for (const s of [1, -1]) {
      const o = p.length / 3
      for (const [x, y] of pts) {
        p.push(x, y, s * hz)
        n.push(0, 0, s)
      }
      for (const t of tris) {
        if (s > 0) i.push(o + t[0], o + t[1], o + t[2])
        else i.push(o + t[0], o + t[2], o + t[1])
      }
    }
    return { p, n, i }
  }

  // rounded profile: each corner becomes rs + 1 points; every point carries an outward normal
  const q: P2[] = []
  const qn: P2[] = []
  for (let k = 0; k < N; k++) {
    const [vx, vy] = pts[k]
    const [ax0, ay0] = pts[(k + N - 1) % N]
    const [bx0, by0] = pts[(k + 1) % N]
    const la = len2(ax0 - vx, ay0 - vy)
    const lb = len2(bx0 - vx, by0 - vy)
    const ax = (ax0 - vx) / la
    const ay = (ay0 - vy) / la
    const bx = (bx0 - vx) / lb
    const by = (by0 - vy) / lb
    // outward normals of the incoming and outgoing edges
    const n0: P2 = [-ay, ax] // edge (prev -> v): direction = -a
    const n1: P2 = [by, -bx] // edge (v -> next): direction = b
    const t = Math.min(r, la * 0.45, lb * 0.45)
    if (t <= 1e-6) {
      q.push([vx, vy], [vx, vy])
      qn.push(n0, n1)
      continue
    }
    const cos = ax * bx + ay * by
    const cx = vx + ((ax + bx) * t) / (1 + cos)
    const cy = vy + ((ay + by) * t) / (1 + cos)
    const A: P2 = [vx + ax * t, vy + ay * t]
    const B: P2 = [vx + bx * t, vy + by * t]
    const rho = Math.hypot(A[0] - cx, A[1] - cy)
    const a0 = Math.atan2(A[1] - cy, A[0] - cx)
    let a1 = Math.atan2(B[1] - cy, B[0] - cx)
    while (a1 < a0) a1 += Math.PI * 2 // counter-clockwise sweep
    for (let s = 0; s <= rs; s++) {
      if (s === 0) {
        q.push(A)
        qn.push(n0)
      } else if (s === rs) {
        q.push(B)
        qn.push(n1)
      } else {
        const a = a0 + ((a1 - a0) * s) / rs
        q.push([cx + Math.cos(a) * rho, cy + Math.sin(a) * rho])
        qn.push([Math.cos(a), Math.sin(a)])
      }
    }
  }
  const Q = q.length
  const zs = hz - b
  // rings: 0 back side, 1 front side, 2 back cap, 3 front cap
  const ring = (z: number, inset: number, nz: number) => {
    const o = p.length / 3
    for (let k = 0; k < Q; k++) {
      p.push(q[k][0] - qn[k][0] * inset, q[k][1] - qn[k][1] * inset, z)
      if (nz === 0) n.push(qn[k][0], qn[k][1], 0)
      else n.push(0, 0, nz)
    }
    return o
  }
  const sb = ring(-zs, 0, 0)
  const sf = ring(zs, 0, 0)
  const cb = ring(-hz, b, -1)
  const cf = ring(hz, b, 1)
  for (let k = 0; k < Q; k++) {
    const k1 = (k + 1) % Q
    i.push(sb + k, sb + k1, sf + k1, sb + k, sf + k1, sf + k) // sides
    i.push(sf + k, sf + k1, cf + k1, sf + k, cf + k1, cf + k) // front bevel
    i.push(cb + k, cb + k1, sb + k1, cb + k, sb + k1, sb + k) // back bevel
  }
  const capPts: THREE.Vector2[] = []
  for (let k = 0; k < Q; k++) capPts.push(new THREE.Vector2(q[k][0] - qn[k][0] * b, q[k][1] - qn[k][1] * b))
  // drop coincident points before triangulating (un-rounded corners), keep an index map
  const keep: number[] = []
  for (let k = 0; k < Q; k++) {
    const prev = capPts[(k + Q - 1) % Q]
    if (prev.distanceToSquared(capPts[k]) > 1e-12) keep.push(k)
  }
  const tris = THREE.ShapeUtils.triangulateShape(
    keep.map((k) => capPts[k]),
    [],
  )
  for (const t of tris) {
    i.push(cf + keep[t[0]], cf + keep[t[1]], cf + keep[t[2]])
    i.push(cb + keep[t[0]], cb + keep[t[2]], cb + keep[t[1]])
  }
  return { p, n, i }
}

const rect = (w: number, h: number): P2[] => [
  [-w / 2, -h / 2],
  [w / 2, -h / 2],
  [w / 2, h / 2],
  [-w / 2, h / 2],
]

/** Hard-edged box centred on the origin (12 triangles). */
export const box = (w: number, h: number, d: number): Part => prism(rect(w, h), d)

/** Box with softly rounded edges, centred on the origin. */
export const rbox = (w: number, h: number, d: number, r: number, rs = 1): Part => {
  const rr = Math.min(r, w * 0.45, h * 0.45, d * 0.45)
  return prism(rect(w, h), d, rr, rr, rs)
}

/**
 * Surface of revolution about Y. `profile` lists [radius, y] from the bottom up (and inwards
 * for a closed top). Repeat a point to make a hard crease there. Smooth elsewhere.
 */
export function lathe(profile: P2[], seg: number): Part {
  const p: number[] = []
  const n: number[] = []
  const i: number[] = []
  const M = profile.length
  const same = (a: P2, b: P2) => Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9
  const nrm: P2[] = []
  for (let j = 0; j < M; j++) {
    const hasPrev = j > 0 && !same(profile[j - 1], profile[j])
    const hasNext = j < M - 1 && !same(profile[j + 1], profile[j])
    const a = hasPrev ? profile[j - 1] : profile[j]
    const b = hasNext ? profile[j + 1] : profile[j]
    const tr = b[0] - a[0]
    const ty = b[1] - a[1]
    const l = len2(tr, ty)
    nrm.push([ty / l, -tr / l])
  }
  for (let j = 0; j < M; j++) {
    for (let s = 0; s <= seg; s++) {
      const a = (s / seg) * Math.PI * 2
      const c = Math.cos(a)
      const sn = Math.sin(a)
      p.push(profile[j][0] * c, profile[j][1], profile[j][0] * sn)
      n.push(nrm[j][0] * c, nrm[j][1], nrm[j][0] * sn)
    }
  }
  const W = seg + 1
  for (let j = 0; j < M - 1; j++) {
    if (same(profile[j], profile[j + 1])) continue
    for (let s = 0; s < seg; s++) {
      const v00 = j * W + s
      const v01 = j * W + s + 1
      const v10 = (j + 1) * W + s
      const v11 = (j + 1) * W + s + 1
      if (profile[j][0] > 1e-9) i.push(v00, v10, v01)
      if (profile[j + 1][0] > 1e-9) i.push(v01, v10, v11)
    }
  }
  return { p, n, i }
}

/** Upright cylinder / cone standing on y = 0, closed on top (and underneath if `bottom`). */
export function cyl(rBottom: number, rTop: number, h: number, seg: number, bottom = false): Part {
  const prof: P2[] = []
  if (bottom) prof.push([0, 0], [rBottom, 0])
  prof.push([rBottom, 0], [rTop, h], [rTop, h], [0, h])
  return lathe(prof, seg)
}

/** Sphere centred on the origin. */
export function ball(r: number, seg: number, rings = Math.max(3, Math.round(seg / 2))): Part {
  const prof: P2[] = []
  for (let j = 0; j <= rings; j++) {
    const a = -Math.PI / 2 + (j / rings) * Math.PI
    prof.push([Math.max(0, Math.cos(a)) * r, Math.sin(a) * r])
  }
  const part = lathe(prof, seg)
  // exact sphere normals
  for (let k = 0; k < part.p.length; k += 3) {
    const l = Math.hypot(part.p[k], part.p[k + 1], part.p[k + 2]) || 1
    part.n[k] = part.p[k] / l
    part.n[k + 1] = part.p[k + 1] / l
    part.n[k + 2] = part.p[k + 2] / l
  }
  return part
}

/** Recompute smooth, area-weighted normals of an indexed part (for free-form surfaces). */
export function smooth(part: Part): Part {
  const n = new Array<number>(part.p.length).fill(0)
  const p = part.p
  for (let k = 0; k < part.i.length; k += 3) {
    const a = part.i[k] * 3
    const b = part.i[k + 1] * 3
    const c = part.i[k + 2] * 3
    const ux = p[b] - p[a]
    const uy = p[b + 1] - p[a + 1]
    const uz = p[b + 2] - p[a + 2]
    const vx = p[c] - p[a]
    const vy = p[c + 1] - p[a + 1]
    const vz = p[c + 2] - p[a + 2]
    const nx = uy * vz - uz * vy
    const ny = uz * vx - ux * vz
    const nz = ux * vy - uy * vx
    for (const o of [a, b, c]) {
      n[o] += nx
      n[o + 1] += ny
      n[o + 2] += nz
    }
  }
  for (let k = 0; k < n.length; k += 3) {
    const l = Math.hypot(n[k], n[k + 1], n[k + 2]) || 1
    n[k] /= l
    n[k + 1] /= l
    n[k + 2] /= l
  }
  return { p: part.p, n, i: part.i }
}

/**
 * Grid surface from a function (u, v in 0..1) -> point. Counter-clockwise when u runs along
 * +X and v along +Z seen from above means the surface faces up; `twoSided` adds the back.
 */
export function sheet(nu: number, nv: number, f: (u: number, v: number) => P3, twoSided = false, thickness = 0): Part {
  const p: number[] = []
  const i: number[] = []
  for (let b = 0; b <= nv; b++) for (let a = 0; a <= nu; a++) p.push(...f(a / nu, b / nv))
  const W = nu + 1
  for (let b = 0; b < nv; b++) {
    for (let a = 0; a < nu; a++) {
      const v00 = b * W + a
      const v10 = v00 + 1
      const v01 = v00 + W
      const v11 = v01 + 1
      i.push(v00, v01, v10, v10, v01, v11)
    }
  }
  const top = smooth({ p, n: [], i })
  if (!twoSided) return top
  const cnt = p.length / 3
  const p2 = [...top.p]
  const n2 = [...top.n]
  const i2 = [...top.i]
  for (let k = 0; k < cnt; k++) {
    p2.push(top.p[k * 3] - top.n[k * 3] * thickness, top.p[k * 3 + 1] - top.n[k * 3 + 1] * thickness, top.p[k * 3 + 2] - top.n[k * 3 + 2] * thickness)
    n2.push(-top.n[k * 3], -top.n[k * 3 + 1], -top.n[k * 3 + 2])
  }
  for (let k = 0; k < top.i.length; k += 3) i2.push(top.i[k] + cnt, top.i[k + 2] + cnt, top.i[k + 1] + cnt)
  return { p: p2, n: n2, i: i2 }
}

/** Skin stretched over a list of rings (each ring: same number of points, closed loop). */
export function loft(rings: P3[][], capStart = true, capEnd = true): Part {
  const p: number[] = []
  const i: number[] = []
  const R = rings.length
  const K = rings[0].length
  for (const ring of rings) for (const pt of ring) p.push(pt[0], pt[1], pt[2])
  for (let a = 0; a < R - 1; a++) {
    for (let k = 0; k < K; k++) {
      const k1 = (k + 1) % K
      const v00 = a * K + k
      const v01 = a * K + k1
      const v10 = (a + 1) * K + k
      const v11 = (a + 1) * K + k1
      i.push(v00, v10, v01, v01, v10, v11)
    }
  }
  const cap = (ringIndex: number, flip: boolean) => {
    const ring = rings[ringIndex]
    const c: P3 = [0, 0, 0]
    for (const pt of ring) {
      c[0] += pt[0] / K
      c[1] += pt[1] / K
      c[2] += pt[2] / K
    }
    const o = p.length / 3
    p.push(c[0], c[1], c[2])
    for (let k = 0; k < K; k++) {
      const a = ringIndex * K + k
      const b = ringIndex * K + ((k + 1) % K)
      if (flip) i.push(o, b, a)
      else i.push(o, a, b)
    }
  }
  if (capStart) cap(0, false)
  if (capEnd) cap(R - 1, true)
  // make the skin face outwards whatever the ring order was
  let vol = 0
  for (let k = 0; k < i.length; k += 3) {
    const a = i[k] * 3
    const b = i[k + 1] * 3
    const c = i[k + 2] * 3
    vol +=
      p[a] * (p[b + 1] * p[c + 2] - p[b + 2] * p[c + 1]) -
      p[a + 1] * (p[b] * p[c + 2] - p[b + 2] * p[c]) +
      p[a + 2] * (p[b] * p[c + 1] - p[b + 1] * p[c])
  }
  if (vol < 0) for (let k = 0; k < i.length; k += 3) [i[k + 1], i[k + 2]] = [i[k + 2], i[k + 1]]
  return smooth({ p, n: [], i })
}

/** Transform helper: translate, then rotate about Y, X, Z (radians). */
export function at(x: number, y: number, z: number, ry = 0, rx = 0, rz = 0): THREE.Matrix4 {
  const m = new THREE.Matrix4()
  if (ry || rx || rz) m.makeRotationFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ'))
  m.setPosition(x, y, z)
  return m
}

const _a = new THREE.Vector3()
const _b = new THREE.Vector3()
const _x = new THREE.Vector3()
const _y = new THREE.Vector3()
const _z = new THREE.Vector3()

/** Matrix that lays a part's local X axis along the segment a -> b, centred on its middle. */
export function along(a: P3, b: P3): THREE.Matrix4 {
  _a.set(a[0], a[1], a[2])
  _b.set(b[0], b[1], b[2])
  _x.subVectors(_b, _a).normalize()
  _y.set(0, 1, 0)
  if (Math.abs(_x.y) > 0.99) _y.set(1, 0, 0)
  _z.crossVectors(_x, _y).normalize()
  _y.crossVectors(_z, _x).normalize()
  const m = new THREE.Matrix4().makeBasis(_x, _y, _z)
  m.setPosition((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2)
  return m
}

/** Straight bar between two points (hard box, `w` wide and `h` tall across its length). */
export function beamPart(a: P3, b: P3, w: number, h = w): { part: Part; m: THREE.Matrix4 } {
  const l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
  return { part: box(l, h, w), m: along(a, b) }
}

/** Stripe bands of the detail atlas (see textures.ts). */
export const BAND = { flat: 0, lap: 1, plank: 2, louver: 3, seam: 4, slat: 5, brick: 6, panel: 7 } as const
export const BANDS = 8
const bandU = (band: number) => (band + 0.5) / BANDS

export interface Style {
  color: string | THREE.Color
  /** Stripe band of the detail atlas (default: flat). */
  band?: number
  /** Local axis (of the part, before placement) along which the stripes repeat. */
  axis?: 'x' | 'y' | 'z'
  /** Stripe periods per local unit. */
  freq?: number
  /** First auxiliary value (camper: tint slot; emissive meshes: glow strength). */
  a?: number
  /** Second auxiliary value (camper: optional-part slot). */
  b?: number
  /** Roughness of the surface (matte materials; default 0.85). */
  r?: number
}

const _c = new THREE.Color()
const _v = new THREE.Vector3()
const _nm = new THREE.Matrix3()
const _m = new THREE.Matrix4()

/** Collects coloured parts into one indexed BufferGeometry (position, normal, color, uv, aux = [a, b, roughness]). */
export class Mesher {
  private pos: number[] = []
  private nor: number[] = []
  private col: number[] = []
  private uv: number[] = []
  private aux: number[] = []
  private idx: number[] = []
  private stack: THREE.Matrix4[] = [new THREE.Matrix4()]
  /** Roughness by surface colour: lets a palette entry stand for a material (metal sheet, paint, canvas). */
  private static finish: Record<string, number> = {}
  static finishes(table: Record<string, number>) {
    Object.assign(Mesher.finish, table)
  }

  /** Enter a local frame (composed with the current one). */
  push(m: THREE.Matrix4): this {
    this.stack.push(new THREE.Matrix4().multiplyMatrices(this.stack[this.stack.length - 1], m))
    return this
  }
  pop(): this {
    if (this.stack.length > 1) this.stack.pop()
    return this
  }
  get triangles() {
    return this.idx.length / 3
  }

  add(part: Part, style: Style, m?: THREE.Matrix4): this {
    const top = this.stack[this.stack.length - 1]
    if (m) _m.multiplyMatrices(top, m)
    else _m.copy(top)
    _nm.getNormalMatrix(_m)
    const o = this.pos.length / 3
    if (typeof style.color === 'string') _c.set(style.color)
    else _c.copy(style.color)
    const u = bandU(style.band ?? 0)
    const ax = style.axis === 'x' ? 0 : style.axis === 'z' ? 2 : 1
    const f = style.freq ?? 0
    const rough = style.r ?? (typeof style.color === 'string' ? Mesher.finish[style.color] : undefined) ?? 0.85
    for (let k = 0; k < part.p.length; k += 3) {
      this.uv.push(u, part.p[k + ax] * f)
      _v.set(part.p[k], part.p[k + 1], part.p[k + 2]).applyMatrix4(_m)
      this.pos.push(_v.x, _v.y, _v.z)
      _v.set(part.n[k], part.n[k + 1], part.n[k + 2]).applyMatrix3(_nm).normalize()
      this.nor.push(_v.x, _v.y, _v.z)
      this.col.push(_c.r, _c.g, _c.b)
      this.aux.push(style.a ?? 0, style.b ?? 0, rough)
    }
    for (const k of part.i) this.idx.push(o + k)
    return this
  }

  /** Shorthand: a bar between two points. */
  beam(a: P3, b: P3, w: number, style: Style, h = w): this {
    const { part, m } = beamPart(a, b, w, h)
    return this.add(part, style, m)
  }

  build(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3))
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2))
    g.setAttribute('aux', new THREE.Float32BufferAttribute(this.aux, 3))
    const count = this.pos.length / 3
    g.setIndex(count > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1))
    g.computeBoundingSphere()
    g.computeBoundingBox()
    return g
  }
}

/** Shade a colour toward black (k < 1) or white (k > 1) in linear space. */
export function tone(color: string, k: number): THREE.Color {
  const c = new THREE.Color(color)
  if (k <= 1) return c.multiplyScalar(k)
  return c.lerp(new THREE.Color('#ffffff'), Math.min(1, k - 1))
}

/**
 * Unit quads (1 x 1 in the XZ plane, facing +Y, UV 0..1), one per matrix, as one geometry:
 * the carriers of the additive "pools of light".
 */
export function quads(mats: THREE.Matrix4[]): THREE.BufferGeometry {
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  const corners: [number, number][] = [
    [-0.5, -0.5],
    [0.5, -0.5],
    [0.5, 0.5],
    [-0.5, 0.5],
  ]
  mats.forEach((m, q) => {
    for (const [x, z] of corners) {
      _v.set(x, 0, z).applyMatrix4(m)
      pos.push(_v.x, _v.y, _v.z)
      uv.push(x + 0.5, z + 0.5)
    }
    const o = q * 4
    idx.push(o, o + 2, o + 1, o, o + 3, o + 2)
  })
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeBoundingSphere()
  return g
}
