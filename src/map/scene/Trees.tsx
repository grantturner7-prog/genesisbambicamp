import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { isDusk, isWinter, skyFor, type SceneEnv } from './env'
import { Builder } from './trees/geom'
import { createPlantMaterial } from './trees/material'
import { planPlanting, planTrees } from './trees/placement'
import { addAraucaria, addBed, addBroadleaf, addCypress, addFanPalm, addShrub, addTuft, BANK_GRASS, REED, TI_PLANT } from './trees/species'

/**
 * Every plant is modelled once, for its own spot, and merged with its kind, so the layer
 * is five meshes however many plants there are:
 *  - crowns: the broadleaf trees and cypresses, in full detail; they cast no shadow themselves;
 *  - shade: a much simpler copy of each crown, never drawn in colour, that casts its shadow;
 *  - specimens: the palms and Norfolk Island pines (few, and their shadows are part of their look);
 *  - beds: shrubs on their mulch; tufts: reeds, bank grass and ti plants (no shadow).
 */
function buildPlants(high: boolean) {
  const crowns = new Builder()
  const shade = new Builder()
  const specimens = new Builder()
  for (const t of planTrees()) {
    if (t.species === 'cypress') addCypress(crowns, shade, t, high)
    else if (t.species === 'palm') addFanPalm(specimens, t, high)
    else if (t.species === 'araucaria') addAraucaria(specimens, t, high)
    else addBroadleaf(crowns, shade, t, high)
  }
  const beds = new Builder()
  const tufts = new Builder()
  const plan = planPlanting(high)
  for (const d of plan.beds) addBed(beds, d.x0, d.z0, d.x1, d.z1, d.w, d.seed)
  for (const s of plan.shrubs) addShrub(beds, s.x, s.z, s.rad, s.h, s.kind, s.seed, high)
  for (const t of plan.tufts) addTuft(tufts, t.x, t.y, t.z, t.rad, t.h, t.blades, t.kind === 'reed' ? REED : t.kind === 'ti' ? TI_PLANT : BANK_GRASS, t.seed, high)
  return [crowns, shade, specimens, beds, tufts].map((x) => x.toGeometry())
}

const prefersStill = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Trees and planting. One tree per crown drawn on the official map, at the same position
 * and within the same crown radius: bald cypress along the lakes (copper in winter),
 * broadleaf shade trees on the lawns, fan palms and Norfolk Island pines where the venue's
 * photos show them; reeds on the lake margins and low beds by the buildings and the pool.
 */
export function Trees({ env }: { env: SceneEnv }) {
  const high = env.quality === 'high'
  const scene = useThree((s) => s.scene)
  const still = useMemo(prefersStill, [])
  const [crowns, shade, specimens, beds, tufts] = useMemo(() => buildPlants(high), [high])
  const { material, depth, uniforms } = useMemo(() => createPlantMaterial({ wind: high && !still, grain: high }), [high, still])
  // the shade mesh only exists for the shadow pass: it writes neither colour nor depth
  const unseen = useMemo(() => new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }), [])
  useEffect(
    () => () => {
      for (const g of [crowns, shade, specimens, beds, tufts]) g.dispose()
    },
    [crowns, shade, specimens, beds, tufts],
  )
  useEffect(
    () => () => {
      material.dispose()
      depth?.dispose()
    },
    [material, depth],
  )
  useEffect(() => () => unseen.dispose(), [unseen])

  const season = useRef<number | null>(null)
  const sunPending = useRef(true)
  useLayoutEffect(() => {
    const dusk = isDusk(env)
    const sky = skyFor(env)
    // warm light through the leaf edges; much stronger against the low dusk sun
    uniforms.uRimColor.value.set(sky.sun)
    uniforms.uRim.value = dusk ? 2.0 : 0.5
    uniforms.uShadeColor.value.set(dusk ? '#8f9cf0' : '#cfe3ff')
    uniforms.uShade.value = dusk ? 0.2 : 0.07
    uniforms.uWind.value = 0.04
    sunPending.current = true
    // the first season is shown as it is; later changes sweep across the camp
    if (season.current === null || still) uniforms.uSeason.value = isWinter(env) ? 1 : 0
    season.current = isWinter(env) ? 1 : 0
  }, [env, uniforms, still])

  useFrame((state, dt) => {
    uniforms.uTime.value = state.clock.elapsedTime
    const target = season.current ?? 0
    const s = uniforms.uSeason.value
    if (s !== target) uniforms.uSeason.value = Math.abs(target - s) < 0.004 ? target : s + (target - s) * (1 - Math.exp(-Math.min(dt, 0.1) * 3.2))
    if (sunPending.current) {
      // follow the scene's sun (Atmosphere owns it) so the rim light comes from the right side
      sunPending.current = false
      scene.traverse((o) => {
        const l = o as THREE.DirectionalLight
        if (l.isDirectionalLight && l.castShadow) uniforms.uSunDir.value.copy(l.position).normalize()
      })
    }
  })

  return (
    <group>
      <mesh geometry={crowns} material={material} receiveShadow />
      <mesh geometry={shade} material={unseen} customDepthMaterial={depth ?? undefined} castShadow />
      <mesh geometry={specimens} material={material} customDepthMaterial={depth ?? undefined} castShadow receiveShadow />
      <mesh geometry={beds} material={material} customDepthMaterial={depth ?? undefined} castShadow={high} receiveShadow />
      <mesh geometry={tufts} material={material} receiveShadow />
    </group>
  )
}
