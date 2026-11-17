import { useEffect, useLayoutEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { isDusk, type Quality, type SceneEnv } from './env'
import { SCREEN, SNACK_SIGN, buildFacilities, cinemaFrame, firePos, snackFrame } from './buildings/facilities'
import { Mesher, at, lathe, quads } from './buildings/geo'
import { createBuildingMats } from './buildings/mats'
import { screenTexture, signTexture } from './buildings/textures'


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

export function Facilities({ env }: { env: SceneEnv }) {
  const kit = useMemo(() => buildKit(env.quality), [env.quality])
  useEffect(() => () => kit.dispose(), [kit])
  useLayoutEffect(() => kit.apply(env), [kit, env])
  useFrame(({ clock, camera, controls }) => {
    const target = (controls as unknown as { target?: THREE.Vector3 } | null)?.target
    kit.tick(clock.elapsedTime, target ? camera.position.distanceTo(target) : camera.position.length())
  })
  return <primitive object={kit.group} />
}
