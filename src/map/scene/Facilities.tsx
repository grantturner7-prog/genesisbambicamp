import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { layout, mulberry32, toWorld, poi, type Pt } from '../layout/layout'
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
function Gable({ w, d, h, rh, wall, roof, p }: { w: number; d: number; h: number; rh: number; wall: THREE.Material; roof: THREE.Material; p: V3 }) {
  const shape = new THREE.Shape()
  shape.moveTo(-d / 2 - 0.15, 0)
  shape.lineTo(d / 2 + 0.15, 0)
  shape.lineTo(0, rh)
  shape.closePath()
  return (
    <group position={p}>
      <Box p={[0, h / 2, 0]} s={[w, h, d]} m={wall} />
      <mesh position={[-w / 2 - 0.15, h, 0]} rotation={[0, Math.PI / 2, 0]} material={roof} castShadow>
        <extrudeGeometry args={[shape, { depth: w + 0.3, bevelEnabled: false }]} />
      </mesh>
    </group>
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
      {car(1.1, M.yellow, 1.2)}
      <Box p={[-0.2, 0.01, 0.6]} s={[4.2, 0.03, 0.12]} m={M.charcoal} cast={false} />
    </group>
  )
}

/** Bambi Grand Dining Hall (斑比大飯店). Massing only — refine from photos. */
function DiningHall() {
  const [x, z] = at('dining')
  return (
    <group position={[x, 0, z]}>
      <Gable w={7.2} d={2.8} h={1.3} rh={1.1} wall={M.cream} roof={M.roofGold} p={[0, 0, 0]} />
      <Box p={[0, 0.07, -2.1]} s={[6.9, 0.14, 1.4]} m={M.deck} />
      {[-2.7, -0.9, 0.9, 2.7].map((px) => (
        <Box key={px} p={[px, 0.7, -1.42]} s={[0.9, 0.7, 0.04]} m={M.glass} />
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

/** Poolside silver trailer (the camp's snack-shop spot) with loungers and umbrellas. */
function PoolSide() {
  const [ax, az] = at('airstream')
  return (
    <group>
      <group position={[ax, 0, az]}>
        <mesh position={[0, 0.55, 0]} scale={[1.9, 0.62, 0.72]} material={M.silver} castShadow receiveShadow>
          <sphereGeometry args={[1, 18, 12]} />
        </mesh>
        <Box p={[0, 0.2, 0]} s={[3.0, 0.14, 1.1]} m={M.charcoal} />
        <Box p={[0, 0.78, 0.74]} s={[1.5, 0.05, 0.6]} m={M.cream} r={[0.3, 0, 0]} />
        {[-0.8, 0.8].map((px) => (
          <Cyl key={px} p={[px, 0.2, 1.1]} r={0.12} h={0.4} m={M.wood} />
        ))}
      </group>
      {/* umbrellas + loungers on the pool deck */}
      {layout.lakes.pool.length > 0 &&
        ([[602, 420], [585, 455]] as Pt[]).map(([px, py], i) => {
          const [x, z] = toWorld([px, py])
          return (
            <group key={i} position={[x, 0, z]}>
              <Cyl p={[0, 0.7, 0]} r={0.02} h={1.4} m={M.charcoal} seg={5} />
              <mesh position={[0, 1.42, 0]} material={i ? M.red : M.yellow} castShadow>
                <coneGeometry args={[0.7, 0.28, 10]} />
              </mesh>
              <Box p={[0.6, 0.12, 0.4]} s={[0.9, 0.1, 0.35]} m={M.white} />
            </group>
          )
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
      <Cyl p={[0, 0.08, 0]} r={0.55} h={0.16} m={M.rock} seg={12} />
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

/** Open-air screen beside the campfire (星空電影院). */
function CinemaScreen() {
  const [x, z] = at('cinema')
  return (
    <group position={[x, 0, z]} rotation={[0, 0.5, 0]}>
      <Box p={[0, 0.85, 0]} s={[1.9, 1.0, 0.05]} m={M.white} />
      <Box p={[-1.0, 0.5, 0]} s={[0.07, 1.0, 0.07]} m={M.charcoal} />
      <Box p={[1.0, 0.5, 0]} s={[0.07, 1.0, 0.07]} m={M.charcoal} />
      {[-0.7, 0, 0.7].map((px) => (
        <Box key={px} p={[px, 0.12, 1.6]} s={[0.6, 0.18, 0.28]} m={M.wood} />
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
      {kayak(x - 0.7, z + 2.4, M.red, 1.57)}
      {kayak(x + 0.75, z + 2.9, M.yellow, 1.57)}
      {kayak(x - 1.6, z + 4.4, M.green, 0.4)}
      {kayak(x + 1.9, z + 5.4, M.red, -0.5)}
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
