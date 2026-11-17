import { useMemo } from 'react'
import * as THREE from 'three'
import { centroid, layout, shapeFrom, wx, wz, type Pt } from '../layout/layout'
import type { SceneEnv } from './env'
import { M } from './materials'

const TOP = 0.9 // thickness of the grass layer; lake beds sit at -TOP
const BASE = 2.2

function scaleAbout(poly: Pt[], k: number): Pt[] {
  const [cx, cy] = centroid(poly)
  return poly.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k] as Pt)
}

function extrude(shape: THREE.Shape, depth: number, top: number) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1 })
  g.translate(0, 0, top - depth) // top cap at `top`
  return g
}

/** The island: grass layer with lake/pool cut-outs over a solid soil base. */
export function Island() {
  const { grass, base, rock } = useMemo(() => {
    const holes = [layout.lakes.wild, layout.lakes.kayak, layout.lakes.pool]
    return {
      grass: extrude(shapeFrom(layout.land, holes), TOP, 0),
      base: extrude(shapeFrom(layout.land), BASE, -TOP),
      rock: extrude(shapeFrom(scaleAbout(layout.land, 0.9)), 2.4, -TOP - BASE),
    }
  }, [])
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh geometry={grass} material={[M.grass, M.soil]} receiveShadow castShadow />
      <mesh geometry={base} material={[M.bed, M.soil]} receiveShadow />
      <mesh geometry={rock} material={M.rock} receiveShadow />
    </group>
  )
}

/** Both lakes. Water surface sits just below the grass line. */
export function Lakes() {
  const geos = useMemo(
    () => [layout.lakes.wild, layout.lakes.kayak].map((p) => new THREE.ShapeGeometry(shapeFrom(p), 1)),
    [],
  )
  return (
    <>
      {geos.map((g, i) => (
        <mesh key={i} geometry={g} material={M.water} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.32, 0]} receiveShadow />
      ))}
    </>
  )
}

/** Aurora pool: stone rim around turquoise water. */
export function PoolBasin() {
  const { rim, water } = useMemo(() => {
    const outer = scaleAbout(layout.lakes.pool, 1.2)
    const rimShape = shapeFrom(outer, [layout.lakes.pool])
    return {
      rim: new THREE.ExtrudeGeometry(rimShape, { depth: 0.12, bevelEnabled: false, curveSegments: 1 }),
      water: new THREE.ShapeGeometry(shapeFrom(layout.lakes.pool), 1),
    }
  }, [])
  return (
    <group>
      <mesh geometry={rim} material={M.poolRim} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow castShadow />
      <mesh geometry={water} material={M.pool} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]} />
    </group>
  )
}

/** Gravel road network, traced from the map. */
export function Roads() {
  const geos = useMemo(
    () => layout.roads.map((r) => new THREE.ShapeGeometry(shapeFrom(r.outer, r.holes), 1)),
    [],
  )
  return (
    <>
      {geos.map((g, i) => (
        <mesh key={i} geometry={g} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]} receiveShadow>
          <primitive object={M.road} attach="material" />
        </mesh>
      ))}
    </>
  )
}

/** Everything underfoot: island, lakes, pool, roads (and, later, the land around the camp). */
export function Terrain(_props: { env: SceneEnv }) {
  return (
    <>
      <Island />
      <Lakes />
      <PoolBasin />
      <Roads />
    </>
  )
}

export { wx, wz }
