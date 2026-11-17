import { useEffect, useLayoutEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mulberry32, toWorld, poi, type Pt } from '../layout/layout'
import { isDusk, type Quality, type SceneEnv } from './env'
import { M } from './materials'
import { SCREEN, SNACK_SIGN, buildFacilities, cinemaFrame, firePos, snackFrame } from './buildings/facilities'
import { Mesher, at, lathe, quads } from './buildings/geo'
import { createBuildingMats } from './buildings/mats'
import { screenTexture, signTexture } from './buildings/textures'

type V3 = [number, number, number]
const atPoi = (name: string): [number, number] => toWorld(poi(name))

/**
 * Every facility of the camp. All static parts are merged into six geometries that share
 * the layer's materials (see `buildings/facilities.ts`); on top come the pools of light
 * (one instanced mesh, dusk only), the cinema screen, the snack shop's roof sign and the
 * campfire's flames. About 13 draw calls in total, shadows included, plus one real light
 * (the fire).
 */
function buildKit(quality: Quality) {
  const hi = quality === 'high'
  const mats = createBuildingMats()
  const b = buildFacilities(quality)
  const group = new THREE.Group()
  group.name = 'facilities'
  const add = (g: THREE.BufferGeometry, mat: THREE.Material, cast: boolean, receive: boolean) => {
    const m = new THREE.Mesh(g, mat)
    m.castShadow = cast
    m.receiveShadow = receive
    group.add(m)
    return m
  }
  add(b.mass, mats.matte, true, true)
  add(b.detail, mats.matte, false, true)
  add(b.metal, mats.metal, true, true)
  add(b.glass, mats.glass, false, false)
  add(b.glow, mats.glow, false, false)
  const hall = add(b.hall, mats.hallGlass, false, false)
  hall.renderOrder = 2

  // pools of light
  const poolGeo = quads([new THREE.Matrix4()])
  const pools = new THREE.InstancedMesh(poolGeo, mats.pool, b.pools.length)
  b.pools.forEach((p, i) => {
    pools.setMatrixAt(i, p.m)
    pools.setColorAt(i, p.color)
  })
  pools.instanceMatrix.needsUpdate = true
  if (pools.instanceColor) pools.instanceColor.needsUpdate = true
  pools.computeBoundingSphere()
  pools.renderOrder = 1
  group.add(pools)

  // Star Cinema: the lit face of the screen
  const screenTex = screenTexture()
  const screenMat = new THREE.MeshStandardMaterial({ color: '#f6f4ee', roughness: 0.95, emissive: '#ffffff', emissiveMap: screenTex, emissiveIntensity: 0 })
  const screenGeo = new THREE.PlaneGeometry(SCREEN.w, SCREEN.h)
  const screen = new THREE.Mesh(screenGeo, screenMat)
  screen.applyMatrix4(cinemaFrame().multiply(at(0, SCREEN.y, 0.004)))
  screen.receiveShadow = true
  group.add(screen)

  // snack shop roof sign: the venue's name in marquee letters, as on the real Airstream
  const signTex = signTexture('Bambi Glamping')
  const signMat = new THREE.MeshBasicMaterial({ map: signTex, color: '#ff8a3a', transparent: true, alphaTest: 0.06, depthWrite: false, side: THREE.DoubleSide })
  const signGeo = new THREE.PlaneGeometry(SNACK_SIGN.w, SNACK_SIGN.h)
  const sign = new THREE.Mesh(signGeo, signMat)
  sign.applyMatrix4(snackFrame().multiply(at(0, SNACK_SIGN.y, -0.02)))
  sign.renderOrder = 3
  sign.visible = !!signTex
  group.add(sign)

  // campfire: flames (dusk only) and the one real light of the layer
  const fm = new Mesher()
  const seg = hi ? 10 : 7
  const tongue = (r: number, h: number): [number, number][] => [
    [0, 0],
    [r, h * 0.18],
    [r * 0.82, h * 0.45],
    [r * 0.36, h * 0.8],
    [0, h],
  ]
  fm.add(lathe(tongue(0.2, 0.62), seg), { color: '#ff5a12' })
  fm.add(lathe(tongue(0.15, 0.5), seg), { color: '#ff8c1f' }, at(0.03, 0.01, -0.02))
  fm.add(lathe(tongue(0.085, 0.34), seg), { color: '#ffd166' }, at(-0.01, 0.02, 0.02))
  fm.add(lathe(tongue(0.1, 0.4), seg), { color: '#ff7a1a' }, at(-0.13, 0, 0.07, 0, 0, 0.25))
  fm.add(lathe(tongue(0.09, 0.36), seg), { color: '#ff7a1a' }, at(0.12, 0, 0.09, 0, 0.2, -0.25))
  const flameGeo = fm.build()
  const flameMat = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false })
  const flames = new THREE.Mesh(flameGeo, flameMat)
  const fp = firePos()
  flames.position.set(fp[0], fp[1] - 0.06, fp[2])
  group.add(flames)
  const emberGeo = new THREE.CircleGeometry(0.36, hi ? 16 : 10)
  emberGeo.rotateX(-Math.PI / 2)
  const emberMat = new THREE.MeshBasicMaterial({ color: '#ff6a1c', fog: false })
  const emberBase = new THREE.Color('#ff6a1c')
  const embers = new THREE.Mesh(emberGeo, emberMat)
  embers.position.set(fp[0], 0.075, fp[2])
  group.add(embers)
  const fireLight = new THREE.PointLight('#ff9a3c', 0, 10, 2)
  fireLight.position.set(fp[0], 0.95, fp[2])
  group.add(fireLight)

  let dusk = false
  return {
    group,
    apply(env: SceneEnv) {
      dusk = isDusk(env)
      mats.apply(env)
      pools.visible = dusk
      screenMat.emissiveIntensity = dusk ? 1.25 : 0
      screenMat.color.set(dusk ? '#8d8f96' : '#f6f4ee')
      signMat.color.set(dusk ? '#ff8a3a' : '#f07a26').multiplyScalar(dusk ? 2.3 : 1)
      flames.visible = dusk
      embers.visible = dusk
      if (!dusk) fireLight.intensity = 0
    },
    /** Per-frame motion: the fire flickers and far-away bulbs dim. No React state involved. */
    tick(t: number, d: number) {
      if (!dusk) return
      const a = Math.sin(t * 9.1) * 0.5 + Math.sin(t * 13.7 + 1.3) * 0.3 + Math.sin(t * 5.3 + 0.4) * 0.2
      const b2 = Math.sin(t * 7.3 + 2.1) * 0.6 + Math.sin(t * 11.9) * 0.4
      flames.scale.set(1 + b2 * 0.07, 1 + a * 0.16, 1 - b2 * 0.07)
      flames.rotation.y = t * 0.9
      flameMat.color.setScalar(2.1 + a * 0.35)
      emberMat.color.copy(emberBase).multiplyScalar(1.5 + b2 * 0.3)
      fireLight.intensity = 7.5 + a * 1.9 + b2 * 1.0
      const near = THREE.MathUtils.clamp(1 - (d - 55) / 70, 0, 1)
      mats.glow.emissiveIntensity = 1.1 + 1.9 * near
    },
    dispose() {
      for (const g of [b.mass, b.detail, b.metal, b.glass, b.glow, b.hall, poolGeo, screenGeo, signGeo, flameGeo, emberGeo]) g.dispose()
      for (const m of [screenMat, signMat, flameMat, emberMat]) m.dispose()
      screenTex.dispose()
      signTex?.dispose()
      pools.dispose()
      mats.dispose()
    },
  }
}

// ---- kept as they were: the tram, the floating kayaks and the waterbirds are being replaced
// ---- by animated versions in the Life layer -------------------------------------------------

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

/**
 * Eco-Safari tram (遊園車), as in the venue's photos: a cream golf cart towing four small
 * open cars in alternating liveries, zebra (white, green roof) and tiger (orange, yellow roof).
 */
function Tram() {
  const [x, z] = atPoi('tramStop')
  const car = (dx: number, body: THREE.Material, roof: THREE.Material) => (
    <group position={[dx, 0, 0]}>
      <Box p={[0, 0.3, 0]} s={[0.62, 0.3, 0.46]} m={body} />
      {[-0.26, 0.26].map((px) => [-0.19, 0.19].map((pz) => <Box key={`${px}${pz}`} p={[px, 0.62, pz]} s={[0.05, 0.4, 0.05]} m={roof} />))}
      <Box p={[0, 0.85, 0]} s={[0.7, 0.07, 0.54]} m={roof} />
      {[-0.2, 0.2].map((w) => (
        <Cyl key={w} p={[w, 0.09, 0.25]} r={0.09} h={0.05} m={M.charcoal} rot={[Math.PI / 2, 0, 0]} />
      ))}
      <Box p={[0.36, 0.2, 0]} s={[0.12, 0.03, 0.03]} m={M.woodDark} cast={false} />
    </group>
  )
  return (
    <group position={[x, 0, z]}>
      {/* golf cart */}
      <group position={[1.75, 0, 0]}>
        <Box p={[0, 0.28, 0]} s={[0.78, 0.26, 0.46]} m={M.cream} />
        <Box p={[0.32, 0.44, 0]} s={[0.14, 0.14, 0.44]} m={M.cream} />
        {[-0.3, 0.3].map((px) => [-0.2, 0.2].map((pz) => <Box key={`${px}${pz}`} p={[px, 0.62, pz]} s={[0.03, 0.46, 0.03]} m={M.charcoal} />))}
        <Box p={[0, 0.87, 0]} s={[0.86, 0.05, 0.54]} m={M.cream} />
        {[-0.25, 0.25].map((w) => (
          <Cyl key={w} p={[w, 0.1, 0.25]} r={0.1} h={0.05} m={M.charcoal} rot={[Math.PI / 2, 0, 0]} />
        ))}
      </group>
      {car(0.85, M.white, M.green)}
      {car(0.05, M.tiger, M.yellow)}
      {car(-0.75, M.white, M.green)}
      {car(-1.55, M.tiger, M.yellow)}
    </group>
  )
}

/** Kayaks afloat on the kayak lake (跳跳船體驗區). The jetty itself is part of the merged facilities. */
function FloatingKayaks() {
  const [x, z] = atPoi('boardingLabel')
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
  const [hx, hz] = atPoi('heron')
  const [kx, kz] = atPoi('kingfisher')
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

export function Facilities({ env }: { env: SceneEnv }) {
  const kit = useMemo(() => buildKit(env.quality), [env.quality])
  useEffect(() => () => kit.dispose(), [kit])
  useLayoutEffect(() => kit.apply(env), [kit, env])
  useFrame(({ clock, camera, controls }) => {
    const target = (controls as unknown as { target?: THREE.Vector3 } | null)?.target
    kit.tick(clock.elapsedTime, target ? camera.position.distanceTo(target) : camera.position.length())
  })
  return (
    <group>
      <primitive object={kit.group} />
      <Tram />
      <FloatingKayaks />
      <Waterbirds />
    </group>
  )
}
