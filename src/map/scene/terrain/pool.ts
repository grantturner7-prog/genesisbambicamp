import * as THREE from 'three'
import { POOL_WATER_Y, type Fields } from './fields'
import { area2, outwardNormals, type V2 } from './geo'
import { fillFlat, offsetRing } from './landscape'

export interface PoolParts {
  /** Light stone coping around the pool, with a soft outer edge and a lip over the water. */
  coping: THREE.BufferGeometry
  water: THREE.BufferGeometry
  /** x, z of the shallow entry; radius of its platform; width of the band of curved steps. */
  steps: [number, number, number, number]
  /** Underwater lamps along the wall. */
  lights: V2[]
  /** x, z and radius of a circle around the pool and its coping. */
  bounds: [number, number, number]
}

export function buildPool(f: Fields): PoolParts {
  const ring = f.poolRing
  const n = ring.length
  const normals = outwardNormals(ring)
  const flip = area2(ring) > 0

  // profile from the lawn, over the coping, down the inside wall: [offset outward, height]
  const profile: [number, number][] = [
    [0.62, -0.02],
    [0.56, 0.05],
    [0.49, 0.085],
    [0.05, 0.085],
    [0, 0.066],
    [0, -0.12],
  ]
  const pos: number[] = []
  const idx: number[] = []
  profile.forEach(([d, y], k) => {
    const pts = d === 0 ? ring : offsetRing(ring, normals, d)
    for (const p of pts) pos.push(p[0], y, p[1])
    if (k > 0) {
      const a0 = (k - 1) * n
      const b0 = k * n
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n
        if (flip) idx.push(a0 + i, b0 + i, a0 + j, a0 + j, b0 + i, b0 + j)
        else idx.push(a0 + i, a0 + j, b0 + i, a0 + j, b0 + j, b0 + i)
      }
    }
  })
  const coping = new THREE.BufferGeometry()
  coping.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  coping.setIndex(idx)
  coping.computeVertexNormals()

  const wpos: number[] = []
  const widx: number[] = []
  fillFlat(wpos, widx, ring, [], POOL_WATER_Y)
  const water = new THREE.BufferGeometry()
  water.setAttribute('position', new THREE.Float32BufferAttribute(wpos, 3))
  water.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(wpos.length).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3))
  water.setIndex(widx)

  const cx = ring.reduce((s, p) => s + p[0], 0) / n
  const cz = ring.reduce((s, p) => s + p[1], 0) / n
  const reach = Math.max(...ring.map((p) => Math.hypot(p[0] - cx, p[1] - cz)))

  // The shallow, stepped entry is at the tail of the pool (its southern tip), as at the venue.
  const tip = ring.reduce((a, p) => (p[1] > a[1] ? p : a), ring[0])
  const toC = Math.hypot(cx - tip[0], cz - tip[1]) || 1
  const steps: [number, number, number, number] = [tip[0] + ((cx - tip[0]) / toC) * 0.45, tip[1] + ((cz - tip[1]) / toC) * 0.45, 1.05, 1.25]

  // Lamps: evenly spaced along the wall, just inside it.
  const inner = offsetRing(ring, normals, -0.3)
  let total = 0
  const len = ring.map((p, i) => {
    const q = ring[(i + 1) % n]
    const l = Math.hypot(q[0] - p[0], q[1] - p[1])
    total += l
    return l
  })
  const lights: V2[] = []
  const COUNT = 7
  let acc = 0
  let next = total / COUNT / 2
  for (let i = 0; i < n && lights.length < COUNT; i++) {
    acc += len[i]
    if (acc >= next) {
      lights.push(inner[i])
      next += total / COUNT
    }
  }
  while (lights.length < COUNT) lights.push(inner[0])

  return { coping, water, steps, lights, bounds: [cx, cz, reach + 1.8] }
}
