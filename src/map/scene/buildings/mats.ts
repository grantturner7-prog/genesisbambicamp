import * as THREE from 'three'
import { isDusk, isWinter, type SceneEnv } from '../env'
import { ATLAS_MEAN, glowTexture, reflectionKey, reflectionMap, stripeAtlas } from './textures'

/** Slots of the camper's per-instance colours and optional parts (see `camper.ts`). */
export const TINT = { none: 0, siding: 1, sail: 2, chair: 3 } as const
export const OPT = { always: 0, railing: 1, steps: 2 } as const

type Std = THREE.MeshStandardMaterial

/**
 * Lets one emissive material serve many emitters: the emitted colour is the vertex colour
 * (when `byColour`), scaled per vertex by `aux.x` and, for instanced meshes, per instance
 * by `iGlow`. By day the same surfaces are simply lit like any other.
 */
function patchGlow(m: Std, key: string, o: { byColour?: boolean; instanced?: boolean }) {
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
attribute vec3 aux;
${o.instanced ? 'attribute float iGlow;' : ''}
varying float vGlow;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
vGlow = aux.x${o.instanced ? ' * iGlow' : ''};`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying float vGlow;`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
totalEmissiveRadiance *= vGlow${o.byColour ? ' * vColor.rgb' : ''};`,
      )
  }
  m.customProgramCacheKey = () => key
}

/** The camper's matte material: per-instance siding / sail / chair colours and optional parts. */
function patchCamper(m: Std) {
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
attribute vec3 aux;
attribute vec3 iSiding;
attribute vec3 iSail;
attribute vec3 iChair;
attribute vec2 iOpt;
varying float vRough;`,
      )
      .replace(
        '#include <color_vertex>',
        `#include <color_vertex>
vColor.xyz *= aux.x < 0.5 ? vec3( 1.0 ) : ( aux.x < 1.5 ? iSiding : ( aux.x < 2.5 ? iSail : iChair ) );`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
vRough = aux.z;
if ( aux.y > 0.5 ) transformed *= ( aux.y < 1.5 ? iOpt.x : iOpt.y );`,
      )
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vRough;').replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor *= vRough;')
  }
  m.customProgramCacheKey = () => 'camper-tint'
}

/** Matte material with per-vertex roughness (aux.z): metal roofs, paint and timber differ. */
function patchRough(m: Std) {
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 aux;\nvarying float vRough;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRough = aux.z;')
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vRough;').replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor *= vRough;')
  }
  m.customProgramCacheKey = () => 'bld-matte'
}

export interface BuildingMats {
  /** Vertex-coloured matte surfaces (timber, render, steel trim, fabric). */
  matte: Std
  /** As `matte`, with the camper's per-instance colours and optional parts. */
  camper: Std
  /** Dark window glass that glows warm at dusk (facilities: per vertex). */
  glass: Std
  /** Same, for the instanced camper windows (per instance). */
  camperGlass: Std
  /** The dining hall's glazing: see-through, glowing from inside at dusk. */
  hallGlass: Std
  /** Polished aluminium (Airstream, drinking fountain). */
  metal: Std
  /** Lamps, bulbs and signs: emit their vertex colour at dusk. */
  glow: Std
  /** Same, for the instanced camper bulbs. */
  camperGlow: Std
  /** Additive pools of light on the ground and walls (dusk only). */
  pool: THREE.MeshBasicMaterial
  apply: (env: SceneEnv) => void
  dispose: () => void
}

export function createBuildingMats(): BuildingMats {
  const atlas = stripeAtlas()
  const glowTex = glowTexture()
  const gain = new THREE.Color(1 / ATLAS_MEAN, 1 / ATLAS_MEAN, 1 / ATLAS_MEAN)
  const base = { vertexColors: true, map: atlas, color: gain }

  const matte = new THREE.MeshStandardMaterial({ ...base, roughness: 1, metalness: 0 })
  patchRough(matte)
  const camper = new THREE.MeshStandardMaterial({ ...base, roughness: 1, metalness: 0 })
  patchCamper(camper)

  const glassBase = { color: '#31444d', roughness: 0.1, metalness: 0.45, emissive: '#ffb964', emissiveIntensity: 0, envMapIntensity: 1.1 }
  const glass = new THREE.MeshStandardMaterial(glassBase)
  patchGlow(glass, 'bld-glass', {})
  const camperGlass = new THREE.MeshStandardMaterial(glassBase)
  patchGlow(camperGlass, 'bld-glass-inst', { instanced: true })

  const hallGlass = new THREE.MeshStandardMaterial({
    color: '#4a6468',
    roughness: 0.06,
    metalness: 0.25,
    transparent: true,
    opacity: 0.4,
    emissive: '#ffb765',
    emissiveIntensity: 0,
    envMapIntensity: 1.2,
    side: THREE.DoubleSide,
  })

  const metal = new THREE.MeshStandardMaterial({ ...base, roughness: 0.2, metalness: 1, envMapIntensity: 1.15 })

  const glowBase = { vertexColors: true, roughness: 0.5, metalness: 0, emissive: '#ffffff', emissiveIntensity: 0 }
  const glow = new THREE.MeshStandardMaterial(glowBase)
  patchGlow(glow, 'bld-glow', { byColour: true })
  const camperGlow = new THREE.MeshStandardMaterial(glowBase)
  patchGlow(camperGlow, 'bld-glow-inst', { byColour: true, instanced: true })

  const pool = new THREE.MeshBasicMaterial({
    map: glowTex,
    color: '#ffffff',
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  })

  const reflections = new Map<string, THREE.DataTexture>()
  const apply = (env: SceneEnv) => {
    const dusk = isDusk(env)
    const key = reflectionKey(env)
    let refl = reflections.get(key)
    if (!refl) {
      refl = reflectionMap(env)
      reflections.set(key, refl)
    }
    for (const m of [glass, camperGlass, hallGlass, metal]) m.envMap = refl
    glass.emissiveIntensity = camperGlass.emissiveIntensity = dusk ? 1.7 : 0
    glass.color.set(dusk ? '#3a3a36' : '#31444d')
    camperGlass.color.copy(glass.color)
    hallGlass.emissiveIntensity = dusk ? 0.85 : 0
    hallGlass.opacity = dusk ? 0.34 : 0.4
    metal.envMapIntensity = dusk ? 1.5 : isWinter(env) ? 1.05 : 1.15
    glow.emissiveIntensity = camperGlow.emissiveIntensity = dusk ? 3 : 0.04
    pool.opacity = dusk ? 1 : 0
  }

  const dispose = () => {
    for (const m of [matte, camper, glass, camperGlass, hallGlass, metal, glow, camperGlow, pool]) m.dispose()
    atlas.dispose()
    glowTex.dispose()
    for (const t of reflections.values()) t.dispose()
    reflections.clear()
  }
  return { matte, camper, glass, camperGlass, hallGlass, metal, glow, camperGlow, pool, apply, dispose }
}
