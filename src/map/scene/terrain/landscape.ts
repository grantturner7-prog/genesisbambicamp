import * as THREE from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { layout, mulberry32, wx, wz } from '../../layout/layout'
import { PALETTE } from '../env'
import { FLAT_MARGIN, WATER_Y, type Fields } from './fields'
import { outwardNormals, sample, type V2 } from './geo'

/** Distance from `p` to a closed ring. */
export function ringDistance(ring: V2[], x: number, z: number): number {
  let best = Infinity
  for (let a = ring.length - 1, b = 0; b < ring.length; a = b++) {
    const ax = ring[a][0]
    const az = ring[a][1]
    const ex = ring[b][0] - ax
    const ez = ring[b][1] - az
    let t = ((x - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez || 1e-12)
    t = t < 0 ? 0 : t > 1 ? 1 : t
    const q = (x - ax - ex * t) ** 2 + (z - az - ez * t) ** 2
    if (q < best) best = q
  }
  return Math.sqrt(best)
}

/**
 * The ring moved `dist` along its normals (positive = outward). Where the shape is too narrow
 * for the full distance the offset stops short, so the result never folds over itself.
 */
export function offsetRing(ring: V2[], normals: V2[], dist: number, distance: (x: number, z: number) => number = (x, z) => ringDistance(ring, x, z)): V2[] {
  const sign = Math.sign(dist)
  const want = Math.abs(dist)
  return ring.map((p, i) => {
    let t = want
    for (let k = 0; k < 6; k++) {
      const qx = p[0] + normals[i][0] * t * sign
      const qz = p[1] + normals[i][1] * t * sign
      if (distance(qx, qz) >= t * 0.9) return [qx, qz] as V2
      t *= 0.7
    }
    return [p[0] + normals[i][0] * t * sign, p[1] + normals[i][1] * t * sign] as V2
  })
}

/** Triangulates a ring (with holes) lying flat at height `y`; appends to `pos`/`idx`. */
export function fillFlat(pos: number[], idx: number[], outer: V2[], holes: V2[][], y: number): void {
  const v2 = (p: V2) => new THREE.Vector2(p[0], -p[1])
  const base = pos.length / 3
  const all = [outer, ...holes].flat()
  for (const p of all) pos.push(p[0], y, p[1])
  const faces = THREE.ShapeUtils.triangulateShape(outer.map(v2), holes.map((h) => h.map(v2)))
  for (const f of faces) {
    // keep every face pointing up, whatever winding the triangulator returns
    const [a, b, c] = f.map((i) => all[i])
    const up = (b[1] - a[1]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[1] - a[1])
    if (up >= 0) idx.push(base + f[0], base + f[1], base + f[2])
    else idx.push(base + f[0], base + f[2], base + f[1])
  }
}

/** Joins consecutive closed rings (same vertex count) with quads; appends to `idx`. */
function stitch(idx: number[], a0: number, b0: number, n: number, flip: boolean): void {
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    if (flip) idx.push(a0 + i, b0 + i, a0 + j, a0 + j, b0 + i, b0 + j)
    else idx.push(a0 + i, a0 + j, b0 + i, a0 + j, b0 + j, b0 + i)
  }
}

const LAND_C: V2 = (() => {
  const xs = layout.land.map((p) => wx(p[0]))
  const zs = layout.land.map((p) => wz(p[1]))
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...zs) + Math.max(...zs)) / 2] as V2
})()

/**
 * All the land in one mesh: the flat camp ground with the lakes cut out, the sloping lake
 * banks, and the hills around the camp out to where the haze swallows them.
 */
export function buildGround(f: Fields, high: boolean): THREE.BufferGeometry {
  const pos: number[] = []
  const idx: number[] = []

  // Edge of the flat ground: the camp boundary pushed out by FLAT_MARGIN, as a radius per heading.
  const N = high ? 168 : 120
  const radius = new Float32Array(N)
  const dirs: V2[] = []
  for (let j = 0; j < N; j++) {
    const a = (j / N) * Math.PI * 2
    const u: V2 = [Math.cos(a), Math.sin(a)]
    dirs.push(u)
    let r = 110
    while (r > 20 && sample(f.landFar, LAND_C[0] + u[0] * r, LAND_C[1] + u[1] * r) > FLAT_MARGIN) r -= 0.5
    radius[j] = r
  }
  for (let pass = 0; pass < 3; pass++) {
    const prev = radius.slice()
    for (let j = 0; j < N; j++) radius[j] = Math.max(prev[j] * 0.5 + (prev[(j + 1) % N] + prev[(j + N - 1) % N]) * 0.25, prev[j] - 0.4)
  }
  const frame: V2[] = dirs.map((u, j) => [LAND_C[0] + u[0] * radius[j], LAND_C[1] + u[1] * radius[j]] as V2)
  fillFlat(pos, idx, frame, f.lakeRings, 0)

  // Hills: rings marching outward from the frame, wider apart with distance.
  const growth = high ? 1.09 : 1.125
  let prevRing = 0 // the frame is the first N vertices
  let s = 0
  let step = 2.2
  while (s < 900) {
    s += step
    step *= growth
    const ring = pos.length / 3
    for (let j = 0; j < N; j++) {
      const x = LAND_C[0] + dirs[j][0] * (radius[j] + s)
      const z = LAND_C[1] + dirs[j][1] * (radius[j] + s)
      pos.push(x, f.heightAt(x, z, s), z)
    }
    stitch(idx, prevRing, ring, N, true)
    prevRing = ring
  }

  // Lake banks: from the lawn edge down under the water.
  const bankTop: number[] = []
  const profile: [number, number][] = [
    [0, 0],
    [-0.07, -0.035],
    [-0.2, -0.2],
    [-0.44, WATER_Y - 0.2],
  ]
  for (const lake of f.lakeRings) {
    const normals = outwardNormals(lake)
    let prev = -1
    for (const [d, y] of profile) {
      const ring = pos.length / 3
      const pts = d === 0 ? lake : offsetRing(lake, normals, d, (x, z) => Math.abs(sample(f.water, x, z)) + 0.02)
      for (const p of pts) pos.push(p[0], y, p[1])
      if (prev < 0) for (let i = 0; i < lake.length; i++) bankTop.push(ring + i)
      else stitch(idx, prev, ring, lake.length, false)
      prev = ring
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setIndex(idx)
  fixWinding(geo)
  geo.computeVertexNormals()
  const nrm = geo.getAttribute('normal') as THREE.BufferAttribute
  for (const i of bankTop) nrm.setXYZ(i, 0, 1, 0)
  return geo
}

/** Flips any triangle whose face normal points down (every surface here is seen from above). */
function fixWinding(geo: THREE.BufferGeometry): void {
  const p = geo.getAttribute('position') as THREE.BufferAttribute
  const index = geo.getIndex()!
  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i)
    const b = index.getX(i + 1)
    const c = index.getX(i + 2)
    const ny = (p.getZ(b) - p.getZ(a)) * (p.getX(c) - p.getX(a)) - (p.getX(b) - p.getX(a)) * (p.getZ(c) - p.getZ(a))
    if (ny < 0) {
      index.setX(i + 1, c)
      index.setX(i + 2, b)
    }
  }
}

/** Both lake surfaces as one flat mesh at the water level. */
export function buildLakeSurface(f: Fields): THREE.BufferGeometry {
  const pos: number[] = []
  const idx: number[] = []
  for (const lake of f.lakeRings) fillFlat(pos, idx, lake, [], WATER_Y)
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(pos.length).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3))
  geo.setIndex(idx)
  return geo
}

/** One soft, slightly lumpy crown (open underneath), shared by every woodland tree. */
function crownGeometry(segW: number, segH: number): THREE.BufferGeometry {
  const raw = new THREE.SphereGeometry(1, segW, segH, 0, Math.PI * 2, 0, Math.PI * 0.7)
  raw.deleteAttribute('uv')
  raw.deleteAttribute('normal')
  const geo = mergeVertices(raw, 1e-4)
  raw.dispose()
  const p = geo.getAttribute('position') as THREE.BufferAttribute
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const y = p.getY(i)
    const z = p.getZ(i)
    // broad, shallow swellings only: the crown stays a smooth, rounded form
    const k = 1 + 0.07 * Math.sin(2.3 * x + 1.3) * Math.sin(2.1 * z + 0.4) + 0.05 * Math.sin(2.9 * y + 1.6 * x)
    p.setXYZ(i, x * k, y * k, z * k)
  }
  geo.computeVertexNormals()
  return geo
}

export interface Woodland {
  /** Crowns along the tree line (these cast shadows onto the camp on the high tier). */
  front: THREE.InstancedMesh | null
  /** The rest of the woodland edge. */
  back: THREE.InstancedMesh
  dispose: () => void
}

/**
 * Tree crowns for the edge of the woodland around the clearing. Further back the canopy is
 * part of the ground surface (see the ground material), so only the edge needs real trees.
 */
export function buildWoodland(f: Fields, high: boolean, material: THREE.Material): Woodland {
  const rnd = mulberry32(41)
  const cell = high ? 2.1 : 3.1
  const wMax = high ? 12 : 9.5
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const e = new THREE.Euler()
  const v = new THREE.Vector3()
  const sc = new THREE.Vector3()
  const col = new THREE.Color()
  const deep = new THREE.Color(PALETTE.canopyDeep)
  const mid = new THREE.Color(PALETTE.canopy)
  const warm = new THREE.Color('#4a7a3c')
  const front: { m: THREE.Matrix4; c: THREE.Color }[] = []
  const back: { m: THREE.Matrix4; c: THREE.Color }[] = []
  for (let gz = -60; gz < 60; gz += cell) {
    for (let gx = -84; gx < 84; gx += cell) {
      const x = gx + (0.1 + rnd() * 0.8) * cell
      const z = gz + (0.1 + rnd() * 0.8) * cell
      const keep = rnd()
      const size = rnd()
      const squash = rnd()
      const turn = rnd()
      const tone = rnd()
      const shade = rnd()
      const w = sample(f.wood, x, z)
      if (w < 0.45 || w > wMax) continue
      if (w > 5 && keep > 1 - (0.6 * (w - 5)) / (wMax - 5)) continue
      if (w < 7 && sample(f.road, x, z) < 1.0) continue // keep the access lane open
      // mostly middling crowns with the odd big one, a little larger further into the wood
      const r = (high ? 0.95 : 1.45) + size * size * 1.05 + Math.min(w, 9) * 0.045
      const sy = 0.8 + squash * 0.4
      v.set(x, f.heightAt(x, z) + 0.25 + r * sy * 0.6, z)
      sc.set(r, r * sy, r)
      m.compose(v, q.setFromEuler(e.set(0, turn * Math.PI * 2, 0)), sc)
      // a narrow range of deep woodland greens, the odd warmer crown among them
      col.copy(deep).lerp(mid, 0.35 + tone * 0.65)
      if (shade > 0.72) col.lerp(warm, (shade - 0.72) * 2.2)
      col.multiplyScalar(1.14 + size * 0.14)
      // Only crowns whose late-afternoon or dusk shadow lands on open ground need to cast one.
      const casts = high && w < 3.4 && (sample(f.wood, x + 2.2, z - 2.0) < 0.7 || sample(f.wood, x + 5.2, z - 1.4) < 0.7)
      ;(casts ? front : back).push({ m: m.clone(), c: col.clone() })
    }
  }
  const geoFront = high ? crownGeometry(13, 7) : null
  const geoBack = high ? crownGeometry(11, 5) : crownGeometry(9, 4)
  const make = (geo: THREE.BufferGeometry, list: { m: THREE.Matrix4; c: THREE.Color }[]) => {
    const mesh = new THREE.InstancedMesh(geo, material, list.length)
    list.forEach((t, i) => {
      mesh.setMatrixAt(i, t.m)
      mesh.setColorAt(i, t.c)
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.receiveShadow = true
    mesh.computeBoundingSphere()
    return mesh
  }
  const frontMesh = geoFront && front.length ? make(geoFront, front) : null
  if (frontMesh) frontMesh.castShadow = true
  const backMesh = make(geoBack, back)
  return {
    front: frontMesh,
    back: backMesh,
    dispose: () => {
      geoFront?.dispose()
      geoBack.dispose()
      frontMesh?.dispose()
      backMesh.dispose()
    },
  }
}
