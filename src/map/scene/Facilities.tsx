import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mulberry32, toWorld, poi, type Pt } from '../layout/layout'
import { M } from './materials'
import { Cabin } from './Cabins'

type V3 = [number, number, number]
const at = (name: string): [number, number] => toWorld(poi(name))

function Box({ p, s, m, r, cast = true }: { p: V3; s: V3; m: THREE.Material; r?: V3; cast?: boolean }) {
  return (
    <mesh position={p} scale={s} rotation={r} material={m} castShadow={cast} receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
    </mesh>
  )
}
function Cyl({ p, r, h, m, seg = 10, rot }: { p: V3; r: number; h: number; m: THREE.Material; seg?: number; rot?: V3 }) {
  return (
    <mesh position={p} rotation={rot} material={m} castShadow receiveShadow>
      <cylinderGeometry args={[r, r, h, seg]} />
    </mesh>
  )
}

/** Entrance gate (入口) across the south-east road. */
function Gate() {
  const [x, z] = at('entrance')
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, 0.9, -1.1]} s={[0.22, 1.8, 0.22]} m={M.woodDark} />
      <Box p={[0, 0.9, 1.1]} s={[0.22, 1.8, 0.22]} m={M.woodDark} />
      <Box p={[0, 1.85, 0]} s={[0.3, 0.26, 2.9]} m={M.wood} />
      <Box p={[0, 2.12, 0]} s={[0.34, 0.08, 3.1]} m={M.charcoal} />
      <Box p={[0.6, 0.55, 0.55]} s={[0.05, 0.05, 1.2]} m={M.red} />
    </group>
  )
}

/** Check-in (報到處): one of the camp's units serves as the reception. */
function CheckIn() {
  const [x, z] = at('checkin')
  return (
    <group position={[x, 0, z]} rotation={[0, Math.PI, 0]}>
      <Cabin zone="B" />
      <Cyl p={[1.1, 1.0, 0.7]} r={0.02} h={2} m={M.charcoal} seg={5} />
      <Box p={[1.35, 1.8, 0.7]} s={[0.5, 0.28, 0.02]} m={M.green} />
    </group>
  )
}

/** Eco-Safari tram (遊園車): red cab and yellow cars. */
function Tram() {
  const [x, z] = at('tramStop')
  const car = (dx: number, m: THREE.Material, len: number) => (
    <group position={[dx, 0, 0]}>
      <Box p={[0, 0.42, 0]} s={[len, 0.5, 0.62]} m={m} />
      <Box p={[0, 0.95, 0]} s={[len, 0.05, 0.7]} m={M.roof} />
      {[-1, 1].map((s) => (
        <Box key={s} p={[s * (len / 2 - 0.05), 0.65, 0]} s={[0.04, 0.55, 0.04]} m={M.charcoal} />
      ))}
      {[-0.25, 0.25].map((w) => (
        <Cyl key={w} p={[w * len, 0.12, 0.34]} r={0.12} h={0.06} m={M.charcoal} rot={[Math.PI / 2, 0, 0]} />
      ))}
    </group>
  )
  return (
    <group position={[x, 0, z]}>
      {car(-1.5, M.red, 1.1)}
      {car(-0.2, M.yellow, 1.2)}
      {car(1.1, M.green, 1.2)}
      <Box p={[-0.2, 0.01, 0.6]} s={[4.2, 0.03, 0.12]} m={M.charcoal} cast={false} />
    </group>
  )
}

/** Bambi Grand Dining Hall (斑比大飯店): a dark steel-and-glass hall with floor-to-ceiling windows, raised on steps. */
function DiningHall() {
  const [x, z] = at('dining')
  const W = 7.6
  const D = 3.6
  const H = 1.9
  return (
    <group position={[x, 0, z + 0.6]}>
      <Box p={[0, 0.15, 0]} s={[W + 0.8, 0.3, D + 0.8]} m={M.rock} />
      {/* glass volume */}
      <Box p={[0, 0.3 + H / 2, 0]} s={[W, H, D]} m={M.hallGlass} />
      {/* black steel frame */}
      {Array.from({ length: 9 }).map((_, i) => (
        <Box key={i} p={[-W / 2 + (i * W) / 8, 0.3 + H / 2, 0]} s={[0.07, H, D + 0.04]} m={M.charcoal} />
      ))}
      {[0.3, 0.3 + H * 0.55, 0.3 + H].map((y) => (
        <Box key={y} p={[0, y, 0]} s={[W + 0.06, 0.07, D + 0.06]} m={M.charcoal} />
      ))}
      <Box p={[0, 0.3 + H + 0.12, 0]} s={[W + 0.7, 0.14, D + 0.7]} m={M.charcoal} />
      {/* warm interior glow + front steps facing the road (north) */}
      <Box p={[0, 0.3 + H * 0.45, 0]} s={[W - 0.5, H * 0.6, D - 0.5]} m={M.glow} cast={false} />
      {[0, 1, 2].map((i) => (
        <Box key={i} p={[0, 0.05 + i * 0.09, -D / 2 - 0.95 + i * 0.28]} s={[2.6, 0.1, 0.3]} m={M.woodDark} />
      ))}
    </group>
  )
}

function Restrooms() {
  const [x1, z1] = at('restroom')
  const [x2] = at('aed')
  const x = (x1 + x2) / 2
  return (
    <group position={[x, 0, z1]}>
      <Box p={[0, 0.55, 0]} s={[3.2, 1.1, 1.3]} m={M.white} />
      <Box p={[0, 1.13, 0]} s={[3.5, 0.08, 1.6]} m={M.roof} />
      <group position={[1.35, 0.7, -0.67]}>
        <Box p={[0, 0, 0]} s={[0.1, 0.34, 0.03]} m={M.green} />
        <Box p={[0, 0, 0]} s={[0.34, 0.1, 0.03]} m={M.green} />
      </group>
    </group>
  )
}

function DrinkingWater() {
  const [x, z] = at('water')
  return (
    <group position={[x, 0, z]}>
      <Cyl p={[0, 0.3, 0]} r={0.12} h={0.6} m={M.silver} />
      <Box p={[0, 0.62, 0]} s={[0.4, 0.06, 0.3]} m={M.charcoal} />
    </group>
  )
}

/**
 * The silver Airstream snack shop, right at the pool's north-east edge, with its orange
 * "Bambi Glamping" roof sign, globe lamps and loungers (as in the venue's photos).
 */
function PoolSide() {
  const [ax, az] = at('airstreamSpot')
  const face = poi('airstreamFace') // unit vector from the trailer toward the pool
  const rot = Math.atan2(face[0], face[1]) // local +Z (serving side) faces the water
  return (
    <group>
      <group position={[ax, 0, az]} rotation={[0, rot, 0]}>
        <Box p={[0, 0.06, 0.2]} s={[3.6, 0.1, 1.9]} m={M.deck} />
        <mesh position={[0, 0.62, 0]} scale={[1.55, 0.5, 0.56]} material={M.silver} castShadow receiveShadow>
          <capsuleGeometry args={[0.9, 1.0, 6, 14]} />
        </mesh>
        <group rotation={[0, 0, Math.PI / 2]} />
        <Box p={[0, 0.24, 0]} s={[2.9, 0.16, 0.95]} m={M.charcoal} />
        {/* serving window + awning on the pool side */}
        <Box p={[0.1, 0.7, 0.5]} s={[1.3, 0.34, 0.06]} m={M.glow} cast={false} />
        <Box p={[0.1, 0.98, 0.78]} s={[1.5, 0.04, 0.6]} m={M.cream} r={[0.28, 0, 0]} />
        {/* orange roof sign */}
        <Box p={[0, 1.42, 0]} s={[2.5, 0.3, 0.05]} m={M.sign} cast={false} />
        {[-1.1, 1.1].map((px) => (
          <Box key={px} p={[px, 1.2, 0]} s={[0.04, 0.3, 0.04]} m={M.charcoal} />
        ))}
        {/* globe lamps */}
        {[[-1.5, 1.2], [-0.7, 1.35], [0.9, 1.35], [1.7, 1.15]].map(([px, pz], i) => (
          <mesh key={i} position={[px, 0.2 + (i % 2) * 0.05, pz]} material={M.lamp}>
            <sphereGeometry args={[0.16 + (i % 2) * 0.05, 12, 10]} />
          </mesh>
        ))}
      </group>
      {/* loungers along the west side of the pool */}
      {([[578, 462], [575, 478], [578, 494]] as Pt[]).map((p, i) => {
        const [x, z] = toWorld(p)
        return <Box key={i} p={[x, 0.14, z]} s={[0.85, 0.1, 0.32]} m={M.white} />
      })}
    </group>
  )
}

/** Campfire circle (營火區): stone ring, log seats, animated flames and glow. */
function Campfire() {
  const [x, z] = at('campfire')
  const flame = useRef<THREE.Group>(null)
  const light = useRef<THREE.PointLight>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (flame.current) {
      flame.current.scale.set(1 + Math.sin(t * 9) * 0.08, 1 + Math.sin(t * 7.3) * 0.18, 1 + Math.cos(t * 8) * 0.08)
    }
    if (light.current) light.current.intensity = 6 + Math.sin(t * 11) * 1.4 + Math.sin(t * 5.3) * 0.8
  })
  return (
    <group position={[x, 0, z]}>
      <Cyl p={[0, 0.14, 0]} r={0.62} h={0.28} m={M.brick} seg={14} />
      <Cyl p={[0, 0.2, 0]} r={0.46} h={0.2} m={M.charcoal} seg={14} />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2
        return <Cyl key={i} p={[Math.cos(a) * 1.4, 0.13, Math.sin(a) * 1.4]} r={0.12} h={0.55} m={M.woodDark} seg={6} rot={[0, 0, Math.PI / 2]} />
      })}
      <group ref={flame} position={[0, 0.16, 0]}>
        <mesh position={[0, 0.3, 0]} material={M.fire}>
          <coneGeometry args={[0.3, 0.75, 7]} />
        </mesh>
        <mesh position={[0, 0.2, 0]} material={M.yellow}>
          <coneGeometry args={[0.17, 0.45, 7]} />
        </mesh>
      </group>
      <pointLight ref={light} position={[0, 0.9, 0]} color="#ff9a3c" distance={9} decay={2} />
    </group>
  )
}

/** Star Cinema (星空電影院): white screen on the lawn, rows of camp chairs, string lights. */
function CinemaScreen() {
  const [x, z] = at('cinema')
  return (
    <group position={[x, 0, z - 0.4]} rotation={[0, 0.35, 0]}>
      <Box p={[0, 1.05, 0]} s={[2.6, 1.5, 0.08]} m={M.screen} />
      <Box p={[0, 1.05, -0.06]} s={[2.8, 1.7, 0.06]} m={M.charcoal} />
      {[-1.25, 1.25].map((px) => (
        <Box key={px} p={[px, 0.2, -0.1]} s={[0.1, 0.4, 0.5]} m={M.charcoal} />
      ))}
      {[0, 1, 2].map((row) =>
        [-1.5, -0.75, 0, 0.75, 1.5].map((px) => (
          <group key={`${row}-${px}`} position={[px, 0, 2.0 + row * 0.85]}>
            <Box p={[0, 0.16, 0]} s={[0.42, 0.05, 0.36]} m={row % 2 ? M.red : M.sail} />
            <Box p={[0, 0.3, 0.19]} s={[0.42, 0.3, 0.04]} m={row % 2 ? M.red : M.sail} />
          </group>
        )),
      )}
      {/* string lights */}
      {[-2.4, 2.4].map((px) => (
        <Cyl key={px} p={[px, 0.9, 3.0]} r={0.03} h={1.8} m={M.charcoal} seg={5} />
      ))}
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={i} position={[-2.4 + i * 0.6, 1.7 - Math.sin((i / 8) * Math.PI) * 0.25, 3.0]} material={M.lamp}>
          <sphereGeometry args={[0.06, 8, 6]} />
        </mesh>
      ))}
    </group>
  )
}

/** Boarding jetty and kayaks on the kayak lake (乘船處 / 跳跳船體驗區). */
function KayakDock() {
  const [x, z] = at('boardingLabel')
  const kayak = (px: number, pz: number, c: THREE.Material, rot = 0) => (
    <group position={[px, -0.2, pz]} rotation={[0, rot, 0]}>
      <mesh scale={[0.95, 0.12, 0.2]} material={c} castShadow>
        <sphereGeometry args={[1, 12, 6]} />
      </mesh>
      <Box p={[0, 0.1, 0]} s={[0.3, 0.05, 0.14]} m={M.charcoal} />
    </group>
  )
  return (
    <group>
      <group position={[x, 0, z + 0.9]}>
        <Box p={[0, 0.02, 1.4]} s={[0.55, 0.1, 3.4]} m={M.deck} />
        {[0, 1, 2, 3].map((i) => (
          <Box key={i} p={[0.3, -0.2, 0.2 + i * 0.9]} s={[0.07, 0.8, 0.07]} m={M.woodDark} />
        ))}
      </group>
      {kayak(x - 0.7, z + 2.4, M.yellow, 1.57)}
      {kayak(x + 0.75, z + 2.9, M.yellow, 1.57)}
      {kayak(x - 1.6, z + 4.4, M.yellow, 0.4)}
      {kayak(x + 1.9, z + 5.4, M.yellow, -0.5)}
      {kayak(x, z + 6.4, M.yellow, 1.2)}
    </group>
  )
}

function Heron({ p, s = 1 }: { p: V3; s?: number }) {
  return (
    <group position={p} scale={s}>
      <Cyl p={[0, 0.28, 0]} r={0.02} h={0.56} m={M.charcoal} seg={4} />
      <mesh position={[0, 0.7, 0]} scale={[0.14, 0.2, 0.34]} material={M.white} castShadow>
        <sphereGeometry args={[1, 8, 6]} />
      </mesh>
      <Cyl p={[0, 0.92, 0.18]} r={0.02} h={0.34} m={M.white} seg={4} rot={[0.5, 0, 0]} />
      <mesh position={[0, 1.07, 0.3]} rotation={[Math.PI / 2, 0, 0]} material={M.yellow}>
        <coneGeometry args={[0.025, 0.2, 4]} />
      </mesh>
    </group>
  )
}

/** Wild waterbird viewing area (野生水鳥觀賞區): herons and egrets along the west lake. */
function Waterbirds() {
  const rnd = mulberry32(5)
  const [hx, hz] = at('heron')
  const [kx, kz] = at('kingfisher')
  const extra = Array.from({ length: 7 }).map((_, i) => {
    const [x, z] = toWorld([300 + rnd() * 150, 300 + rnd() * 150] as Pt)
    return { x, z, s: 0.7 + rnd() * 0.4, k: i }
  })
  return (
    <group>
      <Heron p={[hx, -0.3, hz]} s={1.5} />
      {extra.map((e) => (
        <Heron key={e.k} p={[e.x, -0.3, e.z]} s={e.s} />
      ))}
      <group position={[kx, 0, kz]}>
        <Cyl p={[0, 0.5, 0]} r={0.05} h={1.0} m={M.trunk} seg={5} />
        <mesh position={[0, 1.05, 0]} scale={[0.12, 0.12, 0.2]} material={M.green} castShadow>
          <sphereGeometry args={[1, 8, 6]} />
        </mesh>
      </group>
    </group>
  )
}

/** Five parking areas, as marked P on the map. */
function Parking() {
  const spots = poi('parking') as unknown as Pt[]
  return (
    <group>
      {spots.map((p, i) => {
        const [x, z] = toWorld(p)
        return (
          <group key={i} position={[x, 0, z]}>
            <Box p={[0, 0.03, 0]} s={[2.6, 0.06, 1.7]} m={M.sand} cast={false} />
            {[-0.8, 0, 0.8].map((dx, j) => (
              <Box key={j} p={[dx, 0.22, 0]} s={[0.55, 0.32, 0.3]} m={[M.white, M.red, M.charcoal][(i + j) % 3]} />
            ))}
          </group>
        )
      })}
    </group>
  )
}

export function Facilities() {
  return (
    <group>
      <Gate />
      <CheckIn />
      <Tram />
      <DiningHall />
      <Restrooms />
      <DrinkingWater />
      <PoolSide />
      <Campfire />
      <CinemaScreen />
      <KayakDock />
      <Waterbirds />
      <Parking />
    </group>
  )
}
