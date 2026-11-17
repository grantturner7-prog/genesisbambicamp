import { useEffect, useLayoutEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import type { SceneEnv } from './env'
import { buildFields } from './terrain/fields'
import { CANOPY_CROWNS, CANOPY_TILE, makeCopingMaterial, makeCrownMaterial, makeGroundMaterial } from './terrain/groundMaterial'
import { buildGround, buildLakeSurface, buildWoodland } from './terrain/landscape'
import { buildPool } from './terrain/pool'
import { buildReeds } from './terrain/reeds'
import { canopyTexture, groundNoiseTexture, rippleTexture } from './terrain/textures'
import { makeLakeMaterial, makePoolMaterial } from './terrain/waterMaterial'

export { POOL_WATER_Y, WATER_Y } from './terrain/fields'

/**
 * Everything underfoot, built once per quality tier: the camp's lawn, lanes, lakes and pool,
 * and the wooded hills it sits in. Nothing here allocates or changes React state per frame.
 */
function buildTerrain(high: boolean) {
  const fields = buildFields(high)
  const noise = groundNoiseTexture(256, high)
  const ripple = rippleTexture(high ? 256 : 128, high)
  const canopy = canopyTexture(high ? 512 : 256, CANOPY_CROWNS, CANOPY_TILE, high)
  const pool = buildPool(fields)

  const ground = makeGroundMaterial({ mask: fields.mask, noise, canopy }, pool.bounds, high)
  const lake = makeLakeMaterial({ mask: fields.mask, ripple }, high)
  const poolWater = makePoolMaterial({ mask: fields.mask, ripple }, pool.steps, pool.lights, high)
  const coping = makeCopingMaterial({ mask: fields.mask, noise })
  const crown = makeCrownMaterial(high)

  const groundGeo = buildGround(fields, high)
  const lakeGeo = buildLakeSurface(fields)
  const woodland = buildWoodland(fields, high, crown.material)
  const reeds = buildReeds(fields, high)

  return {
    groundGeo,
    lakeGeo,
    pool,
    woodland,
    reeds: reeds.mesh,
    materials: { ground: ground.material, lake: lake.material, pool: poolWater.material, coping: coping.material },
    setEnv(env: SceneEnv) {
      ground.setEnv(env)
      lake.setEnv(env)
      poolWater.setEnv(env)
      coping.setEnv(env)
      crown.setEnv(env)
      reeds.setEnv(env)
    },
    tick(dt: number) {
      lake.uniforms.uTime.value += dt
      poolWater.uniforms.uTime.value += dt
      reeds.uniforms.uTime.value += dt
    },
    dispose() {
      for (const t of [fields.mask, noise, ripple, canopy]) t.dispose()
      for (const g of [groundGeo, lakeGeo, pool.coping, pool.water]) g.dispose()
      for (const m of [ground.material, lake.material, poolWater.material, coping.material, crown.material]) m.dispose()
      woodland.dispose()
      reeds.dispose()
    },
  }
}

/** Ground, lanes, water and the surrounding landscape. */
export function Terrain({ env }: { env: SceneEnv }) {
  const high = env.quality === 'high'
  const t = useMemo(() => buildTerrain(high), [high])
  useLayoutEffect(() => t.setEnv(env), [t, env])
  useEffect(() => () => t.dispose(), [t])
  useFrame((_, dt) => t.tick(Math.min(dt, 0.1)))
  return (
    <group>
      <mesh geometry={t.groundGeo} material={t.materials.ground} receiveShadow />
      <mesh geometry={t.lakeGeo} material={t.materials.lake} receiveShadow />
      <mesh geometry={t.pool.coping} material={t.materials.coping} receiveShadow />
      <mesh geometry={t.pool.water} material={t.materials.pool} receiveShadow />
      {t.woodland.front && <primitive object={t.woodland.front} />}
      <primitive object={t.woodland.back} />
      <primitive object={t.reeds} />
    </group>
  )
}
