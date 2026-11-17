import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

/**
 * Geometry kit of the Life layer. Every moving thing is one skinned mesh: its parts are
 * merged into a single geometry with vertex colours, and each part follows one bone (or a
 * blend of two), so a whole tram, fleet of kayaks or flock of birds costs one draw call and
 * needs no custom shaders (shadows included).
 */
export type P3 = [number, number, number]
export type Paint = string | ((x: number, y: number, z: number) => string)
/** Bone of a part: one index, or a per-vertex blend `[boneA, boneB, weightOfB]`. */
export type Skin = number | ((x: number, y: number, z: number) => [number, number, number])

const _c = new THREE.Color()
const _v = new THREE.Vector3()
const _n = new THREE.Vector3()
const _nm = new THREE.Matrix3()
const cache = new Map<string, [number, number, number]>()
/** sRGB hex → linear RGB triple (cached; vertex colours are linear). */
export function rgb(hex: string): [number, number, number] {
  let c = cache.get(hex)
  if (!c) {
    _c.set(hex)
    c = [_c.r, _c.g, _c.b]
    cache.set(hex, c)
  }
  return c
}

/** Transform helper: translate, then rotate (Y, X, Z order) and scale. */
export function at(x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, s: number | P3 = 1): THREE.Matrix4 {
  const sc = typeof s === 'number' ? new THREE.Vector3(s, s, s) : new THREE.Vector3(...s)
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), sc)
}

export class Mesher {
  private pos: number[] = []
  private nor: number[] = []
  private col: number[] = []
  private idx: number[] = []
  private si: number[] = []
  private sw: number[] = []
  /** Matrix applied to every part added from now on (the entity's rest pose). */
  base = new THREE.Matrix4()

  get triangles() {
    return this.idx.length / 3
  }

  /** Adds a part. `paint` and `skin` functions receive the vertex position after `m`, before `base`. */
  add(g: THREE.BufferGeometry, paint: Paint, m?: THREE.Matrix4, skin: Skin = 0): this {
    const p = g.getAttribute('position')
    const n = g.getAttribute('normal')
    const start = this.pos.length / 3
    if (m) _nm.getNormalMatrix(m)
    const fixed = typeof paint === 'string' ? rgb(paint) : null
    for (let i = 0; i < p.count; i++) {
      _v.fromBufferAttribute(p, i)
      _n.fromBufferAttribute(n, i)
      if (m) {
        _v.applyMatrix4(m)
        _n.applyMatrix3(_nm).normalize()
      }
      const c = fixed ?? rgb((paint as (x: number, y: number, z: number) => string)(_v.x, _v.y, _v.z))
      if (typeof skin === 'number') {
        this.si.push(skin, 0, 0, 0)
        this.sw.push(1, 0, 0, 0)
      } else {
        const [a, b, w] = skin(_v.x, _v.y, _v.z)
        this.si.push(a, b, 0, 0)
        this.sw.push(1 - w, w, 0, 0)
      }
      _v.applyMatrix4(this.base)
      _n.transformDirection(this.base)
      this.pos.push(_v.x, _v.y, _v.z)
      this.nor.push(_n.x, _n.y, _n.z)
      this.col.push(c[0], c[1], c[2])
    }
    const index = g.getIndex()
    // a mirrored transform flips the winding
    const flip = m ? m.determinant() < 0 : false
    const count = index ? index.count : p.count
    for (let i = 0; i < count; i += 3) {
      const a = start + (index ? index.getX(i) : i)
      const b = start + (index ? index.getX(i + 1) : i + 1)
      const c = start + (index ? index.getX(i + 2) : i + 2)
      if (flip) this.idx.push(a, c, b)
      else this.idx.push(a, b, c)
    }
    g.dispose()
    return this
  }

  build(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3))
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3))
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(this.si, 4))
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(this.sw, 4))
    g.setIndex(this.idx)
    return g
  }
}

// ---- primitives (all smooth shaded) ----------------------------------------------------------

/** Box with rounded edges; `seg` 1 = bevelled with smooth normals, 2 = properly round. */
export const rbox = (w: number, h: number, d: number, r: number, seg = 1): THREE.BufferGeometry => new RoundedBoxGeometry(w, h, d, seg, r)
export const box = (w: number, h: number, d: number): THREE.BufferGeometry => new THREE.BoxGeometry(w, h, d)
/** Upright cylinder / cone frustum. */
export const cyl = (rTop: number, rBot: number, h: number, seg = 8, open = false): THREE.BufferGeometry => new THREE.CylinderGeometry(rTop, rBot, h, seg, 1, open)
export const ball = (r: number, w = 10, h = 7): THREE.BufferGeometry => new THREE.SphereGeometry(r, w, h)
/** Upright capsule: total height = len + 2r. */
export const capsule = (r: number, len: number, radial = 8, cap = 3): THREE.BufferGeometry => new THREE.CapsuleGeometry(r, len, cap, radial)

/** Thin rod between two points. */
export function rod(a: P3, b: P3, r: number, seg = 6, r2 = r): { g: THREE.BufferGeometry; m: THREE.Matrix4 } {
  const va = new THREE.Vector3(...a)
  const vb = new THREE.Vector3(...b)
  const len = va.distanceTo(vb)
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize())
  const m = new THREE.Matrix4().compose(va.clone().add(vb).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1))
  return { g: cyl(r2, r, len, seg, false), m }
}

/**
 * Surface through a series of closed rings (each ring the same number of points), with
 * smooth normals. Both ends are closed with a fan to the ring's centre.
 */
export function loft(rings: P3[][], capStart = true, capEnd = true): THREE.BufferGeometry {
  const k = rings[0].length
  const pos: number[] = []
  const idx: number[] = []
  for (const ring of rings) for (const p of ring) pos.push(p[0], p[1], p[2])
  for (let r = 0; r < rings.length - 1; r++) {
    for (let i = 0; i < k; i++) {
      const a = r * k + i
      const b = r * k + ((i + 1) % k)
      const c = (r + 1) * k + i
      const d = (r + 1) * k + ((i + 1) % k)
      idx.push(a, b, d, a, d, c)
    }
  }
  const centre = (ring: P3[]): P3 => {
    const c: P3 = [0, 0, 0]
    for (const p of ring) {
      c[0] += p[0] / k
      c[1] += p[1] / k
      c[2] += p[2] / k
    }
    return c
  }
  if (capStart) {
    const ci = pos.length / 3
    pos.push(...centre(rings[0]))
    for (let i = 0; i < k; i++) idx.push(ci, (i + 1) % k, i)
  }
  if (capEnd) {
    const ci = pos.length / 3
    const o = (rings.length - 1) * k
    pos.push(...centre(rings[rings.length - 1]))
    for (let i = 0; i < k; i++) idx.push(ci, o + i, o + ((i + 1) % k))
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/**
 * Tube swept along a centre line lying in the XY plane, with an elliptical section at every
 * station: `[x, y, radiusInPlane, radiusAcross]`. Used for hulls, bird bodies and necks.
 */
export function sweep(stations: [number, number, number, number][], sides = 8): THREE.BufferGeometry {
  const rings: P3[][] = []
  const n = stations.length
  for (let s = 0; s < n; s++) {
    const [x, y, ra, rb] = stations[s]
    const a = stations[Math.max(0, s - 1)]
    const b = stations[Math.min(n - 1, s + 1)]
    let tx = b[0] - a[0]
    let ty = b[1] - a[1]
    const tl = Math.hypot(tx, ty) || 1
    tx /= tl
    ty /= tl
    const nx = -ty
    const ny = tx
    const ring: P3[] = []
    for (let i = 0; i < sides; i++) {
      const ang = (i / sides) * Math.PI * 2
      const c = Math.cos(ang) * ra
      ring.push([x + nx * c, y + ny * c, Math.sin(ang) * rb])
    }
    rings.push(ring)
  }
  return loft(rings)
}

/** Flat sheet from a grid of points (rows × cols), smooth normals; render it double sided. */
export function sheet(grid: P3[][]): THREE.BufferGeometry {
  const rows = grid.length
  const cols = grid[0].length
  const pos: number[] = []
  const idx: number[] = []
  for (const row of grid) for (const p of row) pos.push(p[0], p[1], p[2])
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c
      idx.push(a, a + cols, a + 1, a + 1, a + cols, a + cols + 1)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/**
 * Upright panel in the XY plane facing +Z, `w` wide and `h` high (centred on x, y from 0),
 * split into vertical bands whose edges are given by `edge(k, v)` in 0..1 across the width
 * (v = 0 at the bottom, 1 at the top). Band `k` lies between edge k and edge k + 1.
 * Returns one geometry per band so each can take its own colour, with crisp borders.
 */
export function bands(w: number, h: number, count: number, rows: number, edge: (k: number, v: number) => number): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = []
  for (let k = 0; k < count; k++) {
    const pos: number[] = []
    const nor: number[] = []
    const idx: number[] = []
    for (let r = 0; r <= rows; r++) {
      const v = r / rows
      const x0 = (THREE.MathUtils.clamp(edge(k, v), 0, 1) - 0.5) * w
      const x1 = (THREE.MathUtils.clamp(edge(k + 1, v), 0, 1) - 0.5) * w
      pos.push(x0, v * h, 0, x1, v * h, 0)
      nor.push(0, 0, 1, 0, 0, 1)
    }
    for (let r = 0; r < rows; r++) {
      const a = r * 2
      idx.push(a, a + 1, a + 3, a, a + 3, a + 2)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
    g.setIndex(idx)
    out.push(g)
  }
  return out
}

/** Wheel on the Z axis: tyre with rounded shoulders and a lighter hub. Paint by radius. */
export function wheel(r: number, w: number, seg = 12): THREE.BufferGeometry {
  const h = w / 2
  const pts = [
    new THREE.Vector2(0.001, -h * 0.8),
    new THREE.Vector2(r * 0.5, -h * 0.84),
    new THREE.Vector2(r * 0.52, -h),
    new THREE.Vector2(r * 0.86, -h),
    new THREE.Vector2(r, -h * 0.55),
    new THREE.Vector2(r, h * 0.55),
    new THREE.Vector2(r * 0.86, h),
    new THREE.Vector2(r * 0.52, h),
    new THREE.Vector2(r * 0.5, h * 0.84),
    new THREE.Vector2(0.001, h * 0.8),
  ]
  const g = new THREE.LatheGeometry(pts, seg)
  g.rotateX(Math.PI / 2)
  return g
}

/** Soft round sprite texture (white, alpha falls off from the centre); `ring` makes a ripple ring. */
export function spriteTexture(size = 64, ring = 0): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5) / size - 0.5
      const dy = (y + 0.5) / size - 0.5
      const d = Math.hypot(dx, dy) * 2 // 0 centre .. 1 edge
      let a: number
      if (ring > 0) {
        const t = (d - ring) / (1 - ring)
        a = d < ring ? Math.pow(Math.max(0, 1 - (ring - d) / 0.34), 1.6) : Math.pow(Math.max(0, 1 - t), 1.6)
      } else {
        a = Math.pow(Math.max(0, 1 - d), 2.2)
      }
      const i = (y * size + x) * 4
      data[i] = data[i + 1] = data[i + 2] = 255
      data[i + 3] = Math.round(THREE.MathUtils.clamp(a, 0, 1) * 255)
    }
  }
  const tex = new THREE.DataTexture(data, size, size)
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.generateMipmaps = true
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

/** A bone of a rig: its parent (-1 for a root) and where it pivots in the entity's rest frame. */
export interface BoneDef {
  parent: number
  pivot: P3
}

/**
 * A skinned mesh over `g`. Root bones rest at the origin (each entity is modelled around its
 * own origin) and child bones at their pivots, so moving a bone moves the parts bound to it.
 */
export function skinned(g: THREE.BufferGeometry, mat: THREE.Material, defs: BoneDef[]): { mesh: THREE.SkinnedMesh; bones: THREE.Bone[] } {
  const bones = defs.map(() => new THREE.Bone())
  const roots: THREE.Bone[] = []
  defs.forEach((d, i) => {
    if (d.parent < 0) roots.push(bones[i])
    else {
      const pp = defs[d.parent].pivot
      bones[i].position.set(d.pivot[0] - pp[0], d.pivot[1] - pp[1], d.pivot[2] - pp[2])
      bones[d.parent].add(bones[i])
    }
  })
  const mesh = new THREE.SkinnedMesh(g, mat)
  for (const r of roots) mesh.add(r)
  mesh.updateMatrixWorld(true)
  mesh.bind(new THREE.Skeleton(bones))
  // bones move the parts all over the camp, so the rest-pose bounds are meaningless
  mesh.frustumCulled = false
  return { mesh, bones }
}
