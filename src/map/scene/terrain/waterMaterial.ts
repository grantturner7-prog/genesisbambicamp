import * as THREE from 'three'
import { isDusk, isWinter, PALETTE, skyFor, type SceneEnv } from '../env'
import { BAND, MASK_RECT } from './fields'

const color = (hex: string) => ({ value: new THREE.Color(hex) })

/** Sky colour seen in a reflection, matching the sky dome (zenith, horizon band, sun glow). */
const SKY_GLSL = /* glsl */ `
  uniform vec3 cSkyTop; uniform vec3 cSkyHorizon; uniform vec3 cSkyHaze; uniform vec3 cSkyGlow;
  vec3 terrainSunDir() {
    #if NUM_DIR_LIGHTS > 0
      return inverseTransformDirection(directionalLights[0].direction, viewMatrix);
    #else
      return vec3(0.0, 1.0, 0.0);
    #endif
  }
  vec3 terrainSky(vec3 r, vec3 sun) {
    float side = pow(max(dot(normalize(r.xz + 1e-5), normalize(sun.xz + 1e-5)), 0.0), 1.5);
    vec3 band = mix(cSkyHaze, cSkyHorizon, 0.3 + 0.7 * side);
    vec3 c = mix(band, cSkyTop, pow(smoothstep(0.0, 0.85, r.y), 0.55));
    float s = max(dot(r, sun), 0.0);
    return c + cSkyGlow * (pow(s, 5.0) * 0.28 + pow(s, 48.0) * 0.55);
  }`

const setSky = (u: { cSkyTop: { value: THREE.Color }; cSkyHorizon: { value: THREE.Color }; cSkyHaze: { value: THREE.Color }; cSkyGlow: { value: THREE.Color } }, env: SceneEnv) => {
  const sky = skyFor(env)
  u.cSkyTop.value.set(sky.top)
  u.cSkyHorizon.value.set(sky.horizon)
  u.cSkyHaze.value.set(sky.haze)
  u.cSkyGlow.value.set(sky.glow)
}

const MASK_UNIFORM = () => ({ value: new THREE.Vector4(MASK_RECT.x0, MASK_RECT.z0, 1 / MASK_RECT.sx, 1 / MASK_RECT.sz) })
const VERTEX = (shader: { vertexShader: string }) => {
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vWpos;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWpos = (modelMatrix * vec4(transformed, 1.0)).xyz;')
}

/**
 * Lake water: clear shallows over the bank, deeper colour toward the middle, slow ripples,
 * a Fresnel reflection of the current sky with the dark tree line mirrored along the far
 * shore, and the sun's glint. No reflection pass: everything is computed in the material.
 */
export function makeLakeMaterial(tex: { mask: THREE.Texture; ripple: THREE.Texture }, high: boolean) {
  const uniforms = {
    tMask: { value: tex.mask },
    tRipple: { value: tex.ripple },
    uMaskRect: MASK_UNIFORM(),
    uTime: { value: 0 },
    uReflect: { value: 1 },
    uFlatten: { value: 1 },
    uSunset: { value: 0 },
    cShallow: color(PALETTE.lakeShallow),
    cDeep: color(PALETTE.lakeDeep),
    cBed: color('#8a8a62'),
    cTreeRefl: color('#2c4a33'),
    cSkyTop: color('#000000'),
    cSkyHorizon: color('#000000'),
    cSkyHaze: color('#000000'),
    cSkyGlow: color('#000000'),
  }
  const material = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.28, metalness: 0 })
  material.customProgramCacheKey = () => `terrain-lake-${high ? 'high' : 'low'}`
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    VERTEX(shader)
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
        ${high ? '#define TERRAIN_HIGH' : ''}
        varying vec3 vWpos;
        uniform sampler2D tMask; uniform sampler2D tRipple; uniform vec4 uMaskRect; uniform float uTime; uniform float uReflect; uniform float uFlatten; uniform float uSunset;
        uniform vec3 cShallow; uniform vec3 cDeep; uniform vec3 cBed; uniform vec3 cTreeRefl;
        vec3 gWaterN; vec3 gWaterRefl;
        float lakeSd(vec2 p) { return (0.5 - texture2D(tMask, (p - uMaskRect.xy) * uMaskRect.zw).g) * ${(2 * BAND.water).toFixed(2)}; }`,
      )
      .replace('#include <lights_pars_begin>', `#include <lights_pars_begin>\n${SKY_GLSL}`)
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        {
          vec2 wp = vWpos.xz;
          float inD = max(-lakeSd(wp), 0.0);
          // colour through the water: pale over the shallow bank, deepening toward the middle
          vec3 body = mix(cShallow, cDeep, 1.0 - exp(-max(inD - 0.3, 0.0) * 1.15));
          body = mix(cBed, body, smoothstep(0.24, 0.66, inD));

          // fine, low ripples, with broad calm and ruffled patches drifting across
          vec2 rip = texture2D(tRipple, wp * 0.33 + uTime * vec2(0.014, 0.008)).rg - 0.5;
          #ifdef TERRAIN_HIGH
            rip += (texture2D(tRipple, wp * 0.81 + uTime * vec2(-0.019, 0.023) + 0.5).rg - 0.5) * 0.6;
          #endif
          float ruffle = texture2D(tRipple, wp * 0.04 + uTime * 0.0015).b;
          rip *= 0.35 + 1.1 * ruffle;
          gWaterN = normalize(vec3(rip.x * 0.2, 1.0, rip.y * 0.2));
          vec3 wV = normalize(cameraPosition - vWpos);
          float fres = min(clamp(0.06 + 0.94 * pow(1.0 - max(dot(gWaterN, wV), 0.0), 2.3), 0.0, 1.0) * uReflect, 0.86);
          vec3 wR = reflect(-wV, gWaterN);
          wR.y = abs(wR.y);
          vec3 sun = terrainSunDir();
          // a rippled surface gathers light from lower in the sky than a mirror would
          vec3 refl = terrainSky(normalize(vec3(wR.x, wR.y * uFlatten, wR.z)), sun);
          refl += cSkyGlow * pow(max(dot(wR, sun), 0.0), 10.0) * 0.25;
          // the ruffled lanes catch the bright horizon: silver by day, the sunset at dusk
          refl += cSkyHorizon * smoothstep(0.5, 0.9, ruffle) * uSunset;
          // the far bank and its trees, mirrored toward the viewer
          vec2 rh = normalize(wR.xz + 1e-4);
          float reach = 2.4 * length(wR.xz) / max(wR.y, 0.24);
          float bank = 1.0 - smoothstep(-0.1, 1.1, -lakeSd(wp + rh * reach + rip * 0.7));
          #ifdef TERRAIN_HIGH
            bank = max(bank, 1.0 - smoothstep(-0.1, 0.9, -lakeSd(wp + rh * reach * 0.5 + rip * 0.7)));
          #endif
          refl = mix(refl, cTreeRefl, bank * 0.9);
          gWaterRefl = refl * fres;
          diffuseColor.rgb = body * (1.0 - fres * 0.85);
        }`,
      )
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += gWaterRefl;')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = normalize((viewMatrix * vec4(gWaterN, 0.0)).xyz);')
  }
  const setEnv = (env: SceneEnv) => {
    const dusk = isDusk(env)
    const winter = isWinter(env)
    setSky(uniforms, env)
    uniforms.cShallow.value.set(dusk ? '#4d6a7c' : winter ? '#94c4bd' : '#8fd0bd')
    uniforms.cDeep.value.set(dusk ? '#1a3462' : winter ? '#2f6a70' : '#1c665f')
    uniforms.cBed.value.set(dusk ? '#4c4e4a' : '#a39d77')
    uniforms.cTreeRefl.value.set(dusk ? '#10171d' : winter ? '#35492f' : '#27452e')
    // at dusk the water mirrors more, and more of the low, glowing part of the sky
    uniforms.uReflect.value = dusk ? 1.5 : 1.25
    uniforms.uFlatten.value = dusk ? 1.0 : 0.8
    uniforms.uSunset.value = dusk ? 0.42 : 0.1
  }
  return { material, uniforms, setEnv }
}

/**
 * The Aurora pool: pale mosaic tiles seen through clear turquoise water, the curved entry
 * steps at the shallow end, a moving caustic shimmer, and a glow from the underwater lights
 * at dusk.
 */
export function makePoolMaterial(tex: { mask: THREE.Texture; ripple: THREE.Texture }, steps: [number, number, number, number], lights: [number, number][], high: boolean) {
  const uniforms = {
    tMask: { value: tex.mask },
    tRipple: { value: tex.ripple },
    uMaskRect: MASK_UNIFORM(),
    uTime: { value: 0 },
    /** x, z of the shallow entry, radius of the entry platform, depth of the stepped band */
    uSteps: { value: new THREE.Vector4(...steps) },
    uLights: { value: lights.map((l) => new THREE.Vector2(l[0], l[1])) },
    uSelfLight: { value: 0 },
    uLamps: { value: 0 },
    uCaustic: { value: 1 },
    cShallow: color('#b4f0f0'),
    cMid: color(PALETTE.pool),
    cDeep: color(PALETTE.poolDeep),
    cGlowA: color('#1c64d8'),
    cGlowB: color('#63c8ff'),
    cSkyTop: color('#000000'),
    cSkyHorizon: color('#000000'),
    cSkyHaze: color('#000000'),
    cSkyGlow: color('#000000'),
  }
  const material = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.12, metalness: 0 })
  material.customProgramCacheKey = () => `terrain-pool-${high ? 'high' : 'low'}-${lights.length}`
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    VERTEX(shader)
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
        #define POOL_LIGHTS ${lights.length}
        varying vec3 vWpos;
        uniform sampler2D tMask; uniform sampler2D tRipple; uniform vec4 uMaskRect; uniform float uTime;
        uniform vec4 uSteps; uniform vec2 uLights[POOL_LIGHTS]; uniform float uSelfLight; uniform float uLamps; uniform float uCaustic;
        uniform vec3 cShallow; uniform vec3 cMid; uniform vec3 cDeep; uniform vec3 cGlowA; uniform vec3 cGlowB;
        vec3 gWaterN; vec3 gWaterGlow;
        float poolHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`,
      )
      .replace('#include <lights_pars_begin>', `#include <lights_pars_begin>\n${SKY_GLSL}`)
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        {
          vec2 wp = vWpos.xz;
          float wall = max((texture2D(tMask, (wp - uMaskRect.xy) * uMaskRect.zw).g - 0.5) * ${(2 * BAND.water).toFixed(2)}, 0.0);
          vec4 ra = texture2D(tRipple, wp * 0.19 + uTime * vec2(0.014, 0.009));
          vec4 rb = texture2D(tRipple, wp * 0.43 - uTime * vec2(0.011, 0.017) + 0.37);
          vec2 rip = ra.rg + rb.rg - 1.0;

          // depth: entry platform, three curved steps, then a gentle slope to the deep end
          float rs = distance(wp, uSteps.xy);
          float band = (rs - uSteps.z) / uSteps.w;
          float stepped = clamp(floor(band * 3.0) + 1.0, 0.0, 3.0) / 3.0;
          float depth = stepped * 0.6 + 0.4 * smoothstep(uSteps.z + uSteps.w, uSteps.z + uSteps.w + 2.6, rs);
          float e = fract(band * 3.0);
          float nosing = (1.0 - smoothstep(0.0, 0.1, min(e, 1.0 - e))) * step(-0.02, band) * step(band, 1.02);

          vec3 col = mix(cShallow, cMid, smoothstep(0.0, 0.55, depth));
          col = mix(col, cDeep, smoothstep(0.5, 1.0, depth));
          col = mix(col, cShallow, nosing * 0.5);

          // mosaic tiles on the floor, wobbling with the ripples
          vec2 tuv = (wp + rip * (0.03 + 0.05 * depth)) * 5.0;
          float tileFade = 1.0 - smoothstep(0.2, 0.75, fwidth(tuv.x) + fwidth(tuv.y));
          vec2 tf = fract(tuv);
          float grout = 1.0 - smoothstep(0.04, 0.11, min(min(tf.x, 1.0 - tf.x), min(tf.y, 1.0 - tf.y)));
          col *= 1.0 + ((poolHash(floor(tuv)) - 0.5) * 0.12 - grout * 0.1) * tileFade;

          // caustic shimmer: bright threads where two drifting ripple fields cross
          float caustic = pow(clamp(1.0 - abs(ra.b - rb.a) * 5.0, 0.0, 1.0), 5.0) + pow(clamp(1.0 - abs(ra.a - rb.b) * 5.0, 0.0, 1.0), 5.0) * 0.6;
          col += vec3(0.75, 1.0, 0.95) * caustic * 0.16 * uCaustic * (1.0 - 0.4 * depth);
          // shade under the coping
          col *= mix(0.78, 1.0, smoothstep(0.0, 0.2, wall));

          gWaterN = normalize(vec3(rip.x * 0.2, 1.0, rip.y * 0.2));
          vec3 wV = normalize(cameraPosition - vWpos);
          float fres = clamp(0.03 + 0.6 * pow(1.0 - max(dot(gWaterN, wV), 0.0), 3.0), 0.0, 1.0);
          vec3 wR = reflect(-wV, gWaterN);
          wR.y = abs(wR.y);
          float lamps = 0.0;
          for (int i = 0; i < POOL_LIGHTS; i++) lamps += exp(-distance(wp, uLights[i]) * 1.5);
          vec3 glow = mix(cGlowA, cGlowB, clamp(lamps * 0.75 + caustic * 0.18, 0.0, 1.0)) * (0.6 + lamps * 0.5 + caustic * 0.16);
          gWaterGlow = terrainSky(wR, terrainSunDir()) * fres + col * uSelfLight + glow * uLamps;
          diffuseColor.rgb = col * (1.0 - fres);
        }`,
      )
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += gWaterGlow;')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = normalize((viewMatrix * vec4(gWaterN, 0.0)).xyz);')
  }
  const setEnv = (env: SceneEnv) => {
    const dusk = isDusk(env)
    const winter = isWinter(env)
    setSky(uniforms, env)
    uniforms.cShallow.value.set(dusk ? '#7fb6e6' : winter ? '#b8e9ec' : '#b4f0f0')
    uniforms.cMid.value.set(dusk ? '#2f7fd0' : PALETTE.pool)
    uniforms.cDeep.value.set(dusk ? '#1c56b4' : PALETTE.poolDeep)
    // by day a trace of self-light keeps the water luminous in shade; at dusk the lamps take over
    uniforms.uSelfLight.value = dusk ? 0 : 0.1
    uniforms.uLamps.value = dusk ? 1.05 : 0
    uniforms.uCaustic.value = dusk ? 0.5 : 1
  }
  return { material, uniforms, setEnv }
}
