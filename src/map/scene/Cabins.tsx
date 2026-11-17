import { useEffect, useLayoutEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { layout, mulberry32, toWorld } from '../layout/layout'
import { isDusk, type Quality, type SceneEnv } from './env'
import { ZONE_STYLE, camperWash, emitCamper } from './buildings/camper'
import { Mesher } from './buildings/geo'
import { createBuildingMats } from './buildings/mats'

/**
 * All 50 camper units as five instanced meshes (about seven draw calls with their shadow
 * pass), at their exact map positions with the deck side facing the way it was traced.
 * Zone differences seen in the venue's photos (siding, sail and chair colours, deck railing,
 * steps) are per-instance attributes of one shared model: see `buildings/camper.ts`.
 */
function buildCabins(quality: Quality) {
  const mats = createBuildingMats()
  const out = { mass: new Mesher(), detail: new Mesher(), glass: new Mesher(), bulbs: new Mesher() }
  emitCamper(out, quality)
  const geo = { mass: out.mass.build(), detail: out.detail.build(), glass: out.glass.build(), bulbs: out.bulbs.build(), wash: camperWash() }

  const vans = layout.vans
  const N = vans.length
  const siding = new Float32Array(N * 3)
  const sail = new Float32Array(N * 3)
  const chair = new Float32Array(N * 3)
  const opts = new Float32Array(N * 2)
  const glow = new Float32Array(N)
  const rnd = mulberry32(2024)
  const c = new THREE.Color()
  const m = new THREE.Matrix4()
  const matrices: THREE.Matrix4[] = []
  const levels: number[] = []
  vans.forEach((v, i) => {
    const st = ZONE_STYLE[v.zone]
    // a hair of tone variation between neighbours keeps a row from looking stamped out
    const k = 0.965 + rnd() * 0.05
    c.set(st.siding).multiplyScalar(k).toArray(siding, i * 3)
    c.set(st.sail).toArray(sail, i * 3)
    c.set(st.chair).toArray(chair, i * 3)
    opts[i * 2] = st.railing ? 1 : 0
    opts[i * 2 + 1] = st.steps ? 1 : 0
    glow[i] = 0.55 + rnd() * 0.45
    const [x, z] = toWorld([v.x, v.y])
    // A few units stand so close on the map that their roofs touch: give every unit a
    // height step (a centimetre or two) that none of its near neighbours uses, so
    // touching surfaces never z-fight.
    const taken = new Set<number>()
    for (let j = 0; j < i; j++) if (Math.hypot(vans[j].x - v.x, vans[j].y - v.y) < 24) taken.add(levels[j])
    let level = 0
    while (taken.has(level)) level++
    levels.push(level)
    // local +Z (deck side) -> world (faceX, faceY)
    m.makeRotationY(Math.atan2(v.faceX, v.faceY)).setPosition(x, level * 0.004, z)
    matrices.push(m.clone())
  })
  const iSiding = new THREE.InstancedBufferAttribute(siding, 3)
  const iSail = new THREE.InstancedBufferAttribute(sail, 3)
  const iChair = new THREE.InstancedBufferAttribute(chair, 3)
  const iOpt = new THREE.InstancedBufferAttribute(opts, 2)
  const iGlow = new THREE.InstancedBufferAttribute(glow, 1)
  for (const g of [geo.mass, geo.detail]) {
    g.setAttribute('iSiding', iSiding)
    g.setAttribute('iSail', iSail)
    g.setAttribute('iChair', iChair)
    g.setAttribute('iOpt', iOpt)
  }
  geo.glass.setAttribute('iGlow', iGlow)
  geo.bulbs.setAttribute('iGlow', iGlow)

  const mesh = (g: THREE.BufferGeometry, mat: THREE.Material, cast: boolean, receive: boolean) => {
    const im = new THREE.InstancedMesh(g, mat, N)
    matrices.forEach((mm, i) => im.setMatrixAt(i, mm))
    im.instanceMatrix.needsUpdate = true
    im.castShadow = cast
    im.receiveShadow = receive
    im.computeBoundingSphere()
    return im
  }
  const mass = mesh(geo.mass, mats.camper, true, true)
  const detail = mesh(geo.detail, mats.camper, false, true)
  const glass = mesh(geo.glass, mats.camperGlass, false, false)
  const bulbs = mesh(geo.bulbs, mats.camperGlow, false, false)
  const wash = mesh(geo.wash, mats.pool, false, false)
  vans.forEach((_, i) => wash.setColorAt(i, c.set('#ffae5e').multiplyScalar(0.5 * glow[i])))
  if (wash.instanceColor) wash.instanceColor.needsUpdate = true
  wash.renderOrder = 1

  const group = new THREE.Group()
  group.name = 'camper-units'
  group.add(mass, detail, glass, bulbs, wash)
  const meshes = [mass, detail, glass, bulbs, wash]
  return {
    group,
    mats,
    wash,
    dispose() {
      for (const im of meshes) im.dispose()
      for (const g of Object.values(geo)) g.dispose()
      mats.dispose()
    },
  }
}

export function Cabins({ env }: { env: SceneEnv }) {
  const kit = useMemo(() => buildCabins(env.quality), [env.quality])
  useEffect(() => () => kit.dispose(), [kit])
  const dusk = isDusk(env)
  useLayoutEffect(() => {
    kit.mats.apply(env)
    kit.wash.visible = dusk
  }, [kit, env, dusk])
  // String-light bulbs are smaller than a pixel from far away: fade their glow out with
  // distance so they do not sparkle, and let the windows and the pools of light carry the
  // dusk mood in the full-map view.
  useFrame(({ camera, controls }) => {
    const target = (controls as unknown as { target?: THREE.Vector3 } | null)?.target
    const d = target ? camera.position.distanceTo(target) : camera.position.length()
    const near = THREE.MathUtils.clamp(1 - (d - 45) / 60, 0, 1)
    kit.mats.camperGlow.emissiveIntensity = dusk ? 0.35 + 2.65 * near : 0.04
  })
  return <primitive object={kit.group} />
}
