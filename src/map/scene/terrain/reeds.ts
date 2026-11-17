import * as THREE from 'three'
import { layout, mulberry32, poi, toWorld, type Pt } from '../../layout/layout'
import { isWinter, type SceneEnv } from '../env'
import { WATER_Y, type Fields } from './fields'
import { makeNoise, outwardNormals, sample } from './geo'

/** One clump of rushes: a fan of thin, tapering blades leaning outward. */
function clumpGeometry(blades: number): THREE.BufferGeometry {
  const rnd = mulberry32(73)
  const pos: number[] = []
  const nrm: number[] = []
  const col: number[] = []
  const idx: number[] = []
  for (let b = 0; b < blades; b++) {
    const a = (b / blades) * Math.PI * 2 + rnd() * 0.7
    const lean = 0.12 + rnd() * 0.34
    const h = 0.7 + rnd() * 0.3
    const r0 = 0.08 + rnd() * 0.22
    const dx = Math.cos(a)
    const dz = Math.sin(a)
    // across the blade
    const sx = -dz
    const sz = dx
    const base = pos.length / 3
    const at = (t: number, half: number, side: number) => {
      const out = r0 + lean * t * t
      pos.push(dx * out + sx * half * side, h * t, dz * out + sz * half * side)
      // normals point mostly up, so the clump is lit softly from every side
      const l = Math.hypot(dx * 0.45, 1, dz * 0.45)
      nrm.push((dx * 0.45) / l, 1 / l, (dz * 0.45) / l)
      const shade = 0.66 + 0.34 * t
      col.push(shade, shade, shade)
    }
    at(0, 0.06, -1)
    at(0, 0.06, 1)
    at(0.55, 0.05, -1)
    at(0.55, 0.05, 1)
    at(1, 0, 0)
    idx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2, base + 2, base + 3, base + 4)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  geo.setIndex(idx)
  return geo
}

/** Height of the lake bank at a distance inside the lake outline (see the bank profile in landscape.ts). */
function bankHeight(d: number): number {
  if (d < 0.07) return (-0.035 * d) / 0.07
  if (d < 0.2) return -0.035 - (0.165 * (d - 0.07)) / 0.13
  return Math.max(WATER_Y - 0.05, -0.2 - (0.32 * (d - 0.2)) / 0.24)
}

/**
 * Rushes along stretches of the lake shores, standing at the water line. They keep clear of
 * the lakeside units, the boarding jetty and the lanes, and sway a little in the breeze.
 */
export function buildReeds(f: Fields, high: boolean) {
  const rnd = mulberry32(57)
  const n = makeNoise(13)
  const vans = layout.vans.map((v) => toWorld([v.x, v.y] as Pt))
  const [jx, jz] = toWorld(poi('boardingLabel'))
  const keepOut: [number, number, number][] = [
    [jx, jz + 2.6, 4.6],
    ...(['heron', 'kingfisher', 'kayakBoat'] as const).map((k) => [...toWorld(poi(k)), 1.6] as [number, number, number]),
  ]
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const e = new THREE.Euler()
  const v = new THREE.Vector3()
  const sc = new THREE.Vector3()
  const mats: THREE.Matrix4[] = []
  const tints: THREE.Color[] = []
  const every = high ? 1 : 2
  for (const lake of f.lakeRings) {
    const normals = outwardNormals(lake)
    for (let i = 0; i < lake.length; i += every) {
      const [px, pz] = lake[i]
      const pick = rnd()
      const inset = rnd()
      const size = rnd()
      const turn = rnd()
      const tone = rnd()
      // rushes grow in stands, with open bank between them
      const stand = n.fbm(px / 6.5, pz / 6.5, 2)
      if (stand < 0.5 || pick > (stand - 0.5) * 5.5) continue
      const d = 0.16 + inset * 0.3
      const x = px - normals[i][0] * d
      const z = pz - normals[i][1] * d
      if (sample(f.water, x, z) > -0.08) continue // the bank is too narrow here
      if (sample(f.road, x, z) < 0.7) continue
      if (vans.some((c) => Math.hypot(c[0] - x, c[1] - z) < 2.3)) continue
      if (keepOut.some((c) => Math.hypot(c[0] - x, c[1] - z) < c[2])) continue
      const s = 0.42 + size * 0.34
      v.set(x, bankHeight(d) - 0.02, z)
      sc.set(s * (0.8 + tone * 0.4), s, s * (0.8 + tone * 0.4))
      m.compose(v, q.setFromEuler(e.set(0, turn * Math.PI * 2, 0)), sc)
      mats.push(m.clone())
      tints.push(new THREE.Color().setScalar(0.85 + tone * 0.3))
    }
  }

  const uniforms = { uTime: { value: 0 } }
  const material = new THREE.MeshStandardMaterial({ color: '#86a252', roughness: 0.85, metalness: 0, side: THREE.DoubleSide, vertexColors: true })
  material.customProgramCacheKey = () => 'terrain-reeds'
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;').replace(
      '#include <begin_vertex>',
      /* glsl */ `#include <begin_vertex>
      #ifdef USE_INSTANCING
        float phase = instanceMatrix[3].x * 1.7 + instanceMatrix[3].z * 1.3;
        float bend = position.y * position.y * 0.07;
        transformed.x += sin(uTime * 1.1 + phase) * bend;
        transformed.z += cos(uTime * 0.8 + phase * 1.3) * bend;
      #endif`,
    )
    // blades are lit the same from both sides (no flipped normals on their backs)
    shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = normalize(vNormal);')
  }
  const geo = clumpGeometry(high ? 7 : 5)
  const mesh = new THREE.InstancedMesh(geo, material, mats.length)
  mats.forEach((mm, i) => {
    mesh.setMatrixAt(i, mm)
    mesh.setColorAt(i, tints[i])
  })
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  mesh.receiveShadow = true
  mesh.computeBoundingSphere()

  return {
    mesh,
    uniforms,
    setEnv(env: SceneEnv) {
      material.color.set(isWinter(env) ? '#a89e62' : '#86a252')
    },
    dispose() {
      geo.dispose()
      material.dispose()
      mesh.dispose()
    },
  }
}
