import { useMemo } from 'react'
import * as THREE from 'three'
import { layout, toWorld, type VanSpot } from '../layout/layout'
import type { SceneEnv } from './env'
import { M } from './materials'

/**
 * A Bambi camper unit, modelled from the venue's own photos: a boxy trailer cabin with
 * splayed end walls and lap siding, black trim and flat roof, louvered door, a wooden
 * deck with posts, shade sail and bistro chairs, a small trailer wheel, and a dark
 * bathroom annex. Local +X is the long axis, local +Z is the deck side.
 * World size ≈ 9 m × 2.6 m (1 unit = 4 m).
 */
const L = 1.62
const Wd = 0.62
const H = 0.62
const FLARE = 0.09
const ANNEX = 0.52

const SIDING: Record<VanSpot['zone'], THREE.Material> = { A: M.cream, B: M.white, D: M.cream, E: M.white, F: M.white, G: M.taupe }

export function Cabin({ zone }: { zone: VanSpot['zone'] }) {
  const body = useMemo(() => {
    // side profile (x along length, y up): bottom narrower than the roof line = splayed ends
    const s = new THREE.Shape()
    s.moveTo(-L / 2 + FLARE, 0)
    s.lineTo(L / 2 - FLARE, 0)
    s.lineTo(L / 2, H)
    s.lineTo(-L / 2, H)
    s.closePath()
    const g = new THREE.ExtrudeGeometry(s, { depth: Wd, bevelEnabled: false })
    g.translate(0, 0, -Wd / 2)
    return g
  }, [])
  const sail = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const v = new Float32Array([
      -0.55, 0.0, 0.0, 0.45, 0.0, 0.0, 0.5, -0.17, 0.52, -0.5, -0.1, 0.52,
    ])
    g.setAttribute('position', new THREE.BufferAttribute(v, 3))
    g.setIndex([0, 1, 2, 0, 2, 3])
    g.computeVertexNormals()
    return g
  }, [])
  const siding = SIDING[zone]
  const x0 = -ANNEX / 2 // main cabin centre; annex on +x
  return (
    <group>
      <group position={[x0, 0.14, 0]}>
        <mesh geometry={body} material={siding} castShadow receiveShadow />
        {/* roof slab + dark parapet */}
        <mesh position={[0, H + 0.03, 0]} material={M.roof} castShadow>
          <boxGeometry args={[L + FLARE * 2 + 0.1, 0.06, Wd + 0.1]} />
        </mesh>
        {/* black end-wall frames + windows */}
        {[-1, 1].map((s) => (
          <group key={s} position={[(s * (L / 2 - FLARE * 0.45)), H * 0.5, 0]} rotation={[0, 0, -s * 0.15]}>
            <mesh material={M.charcoal}>
              <boxGeometry args={[0.03, H * 0.98, Wd * 0.98]} />
            </mesh>
            <mesh material={M.glass} position={[s * 0.02, 0.02, 0]}>
              <boxGeometry args={[0.02, H * 0.52, Wd * 0.62]} />
            </mesh>
          </group>
        ))}
        {/* louvered door + lamp */}
        <mesh position={[-0.22, H * 0.46, Wd / 2 + 0.012]} material={M.charcoal}>
          <boxGeometry args={[0.2, H * 0.86, 0.025]} />
        </mesh>
        {/* skirt */}
        <mesh position={[0, -0.06, 0]} material={M.charcoal}>
          <boxGeometry args={[L - 0.1, 0.1, Wd - 0.06]} />
        </mesh>
        {/* small trailer wheel */}
        <mesh position={[-L / 2 + 0.14, 0.0, Wd / 2 + 0.01]} rotation={[Math.PI / 2, 0, 0]} material={M.charcoal} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.07, 10]} />
        </mesh>
        {/* deck, posts, shade sail, chairs */}
        <mesh position={[-0.12, -0.04, Wd / 2 + 0.27]} material={M.deck} receiveShadow castShadow>
          <boxGeometry args={[1.0, 0.05, 0.55]} />
        </mesh>
        {[-0.58, 0.34].map((px) => (
          <mesh key={px} position={[px, 0.2, Wd / 2 + 0.5]} material={M.charcoal} castShadow>
            <cylinderGeometry args={[0.012, 0.012, 0.52, 5]} />
          </mesh>
        ))}
        <mesh geometry={sail} material={M.sail} position={[-0.12, H * 0.82, Wd / 2]} castShadow />
        {[-0.3, 0.05].map((px) => (
          <mesh key={px} position={[px, 0.05, Wd / 2 + 0.34]} material={M.charcoal}>
            <boxGeometry args={[0.1, 0.14, 0.1]} />
          </mesh>
        ))}
      </group>
      {/* bathroom annex */}
      <group position={[L / 2 - ANNEX / 2 + x0 + ANNEX * 0.55, 0.14, 0]}>
        <mesh material={M.annex} position={[0, (H - 0.06) / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[ANNEX, H - 0.06, Wd - 0.04]} />
        </mesh>
        <mesh material={M.woodDark} position={[0, (H - 0.06) / 2, Wd / 2 - 0.015]}>
          <boxGeometry args={[ANNEX * 0.7, H * 0.8, 0.02]} />
        </mesh>
        <mesh material={M.roof} position={[0, H - 0.03, 0]}>
          <boxGeometry args={[ANNEX + 0.06, 0.05, Wd + 0.04]} />
        </mesh>
      </group>
    </group>
  )
}

/** All 50 units at their exact map positions, decks facing the water/lawn as traced. */
export function Cabins(_props: { env: SceneEnv }) {
  return (
    <group>
      {layout.vans.map((v) => {
        const [x, z] = toWorld([v.x, v.y])
        // local +Z (deck side) → world direction (faceX, faceY); map y maps to world z
        const rot = Math.atan2(v.faceX, v.faceY)
        return (
          <group key={v.id} position={[x, 0, z]} rotation={[0, rot, 0]} userData={{ unit: v.id }}>
            <Cabin zone={v.zone} />
          </group>
        )
      })}
    </group>
  )
}
