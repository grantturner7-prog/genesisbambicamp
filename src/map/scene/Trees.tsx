import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { layout, mulberry32, S, toWorld, type Pt } from '../layout/layout'
import { M } from './materials'

const nearestWater = (px: number, py: number) => {
  let d = Infinity
  for (const poly of [layout.lakes.wild, layout.lakes.kayak]) for (const [x, y] of poly) d = Math.min(d, Math.hypot(px - x, py - y))
  return d
}

interface T { x: number; z: number; r: number; cy: boolean; k: number }

/** One tree per crown drawn on the official map, at the same position and size. */
export function Trees() {
  const trees = useMemo<T[]>(() => {
    const rnd = mulberry32(11)
    return layout.trees.map((t) => {
      const [x, z] = toWorld([t.x, t.y] as Pt)
      return { x, z, r: t.r * S, cy: nearestWater(t.x, t.y) < 42, k: rnd() }
    })
  }, [])
  const broad = trees.filter((t) => !t.cy)
  const cyp = trees.filter((t) => t.cy)

  const crownRef = useRef<THREE.InstancedMesh>(null)
  const crownRef2 = useRef<THREE.InstancedMesh>(null)
  const coneRef = useRef<THREE.InstancedMesh>(null)
  const trunkRef = useRef<THREE.InstancedMesh>(null)
  const m = useMemo(() => new THREE.Matrix4(), [])
  const q = useMemo(() => new THREE.Quaternion(), [])

  useLayoutEffect(() => {
    const put = (ref: THREE.InstancedMesh | null, list: T[], fn: (t: T) => [number, number, number, number, number, number]) => {
      if (!ref) return
      list.forEach((t, i) => {
        const [px, py, pz, sx, sy, sz] = fn(t)
        m.compose(new THREE.Vector3(px, py, pz), q.setFromEuler(new THREE.Euler(0, t.k * 6, 0)), new THREE.Vector3(sx, sy, sz))
        ref.setMatrixAt(i, m)
      })
      ref.instanceMatrix.needsUpdate = true
    }
    const a = broad.filter((t) => t.k < 0.5)
    const b = broad.filter((t) => t.k >= 0.5)
    put(crownRef.current, a, (t) => [t.x, 0.9 + t.r * 1.0, t.z, t.r * 1.05, t.r * 0.95, t.r * 1.05])
    put(crownRef2.current, b, (t) => [t.x, 0.9 + t.r * 1.0, t.z, t.r * 1.05, t.r * 0.95, t.r * 1.05])
    put(coneRef.current, cyp, (t) => [t.x, 0.5 + t.r * 1.9, t.z, t.r * 0.85, t.r * 3.8, t.r * 0.85])
    put(trunkRef.current, trees, (t) => [t.x, 0.45 + t.r * 0.3, t.z, 0.07 + t.r * 0.05, 0.9 + t.r * 0.6, 0.07 + t.r * 0.05])
  }, [trees, broad, cyp, m, q])

  const a = broad.filter((t) => t.k < 0.5).length
  const b = broad.length - a
  return (
    <group>
      <instancedMesh ref={crownRef} args={[undefined, undefined, a]} material={M.crown} castShadow receiveShadow>
        <icosahedronGeometry args={[1, 1]} />
      </instancedMesh>
      <instancedMesh ref={crownRef2} args={[undefined, undefined, b]} material={M.crown2} castShadow receiveShadow>
        <icosahedronGeometry args={[1, 1]} />
      </instancedMesh>
      <instancedMesh ref={coneRef} args={[undefined, undefined, cyp.length]} material={M.cypress} castShadow receiveShadow>
        <coneGeometry args={[1, 1, 7]} />
      </instancedMesh>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, trees.length]} material={M.trunk} castShadow>
        <cylinderGeometry args={[1, 1.25, 1, 6]} />
      </instancedMesh>
    </group>
  )
}
