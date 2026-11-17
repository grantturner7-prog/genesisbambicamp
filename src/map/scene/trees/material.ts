import * as THREE from 'three'

/** Uniforms shared by the planting material and its shadow material. */
export interface PlantUniforms {
  uTime: { value: number }
  /** Sway amplitude at a crown's top, world units (0 = still). */
  uWind: { value: number }
  /** 0 = summer colours, 1 = winter colours. */
  uSeason: { value: number }
  /** Direction toward the sun, world space. */
  uSunDir: { value: THREE.Vector3 }
  /** Light let through the leaf edges that face the sun. */
  uRimColor: { value: THREE.Color }
  uRim: { value: number }
  /** Sky light that keeps the shaded side of a crown readable. */
  uShadeColor: { value: THREE.Color }
  uShade: { value: number }
}

// aWind = (sway weight, sway phase, grain)
const WIND_PARS = /* glsl */ `
uniform float uTime;
uniform float uWind;
// slow sway of the whole plant plus a little leaf flutter; gusts drift across the camp
vec3 plantSway(vec3 p, vec3 wind) {
  float w = wind.x;
  float ph = wind.y;
  float gust = 0.65 + 0.35 * sin(uTime * 0.27 + p.x * 0.05 + p.z * 0.04);
  float s = sin(uTime * 0.85 + ph + (p.x + p.z) * 0.07) * 0.75 + sin(uTime * 1.9 + ph * 1.7) * 0.25;
  float fl = sin(uTime * 2.9 + ph + p.x * 3.7 + p.y * 2.9 + p.z * 3.3);
  p.xz += vec2(0.8, 0.6) * (s * w * w * uWind * gust);
  p.xz += vec2(fl, -fl) * (0.16 * w * uWind);
  return p;
}
`

/**
 * One material for every tree and plant: per-vertex colour (summer and winter sets blended
 * by `uSeason`), soft light through the leaf edges, a leafy grain close up (high tier) and
 * a gentle wind sway (high tier, unless the visitor prefers reduced motion). Returns the
 * matching shadow material so that the shadows sway with the plants.
 */
export function createPlantMaterial(opts: { wind: boolean; grain: boolean }): { material: THREE.MeshStandardMaterial; depth: THREE.MeshDepthMaterial | null; uniforms: PlantUniforms } {
  const uniforms: PlantUniforms = {
    uTime: { value: 0 },
    uWind: { value: 0 },
    uSeason: { value: 0 },
    uSunDir: { value: new THREE.Vector3(-0.5, 0.7, 0.45).normalize() },
    uRimColor: { value: new THREE.Color('#fff1d8') },
    uRim: { value: 0.5 },
    uShadeColor: { value: new THREE.Color('#cfe3ff') },
    uShade: { value: 0.1 },
  }
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0 })
  const flags = (opts.wind ? '#define PLANT_WIND\n' : '') + (opts.grain ? '#define PLANT_GRAIN\n' : '')
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = (flags + shader.vertexShader)
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
        attribute vec3 aWinter;
        attribute vec3 aWind;
        uniform float uSeason;
        varying vec4 vPlant; // xyz: position at rest, w: grain
        #ifdef PLANT_WIND
        ${WIND_PARS}
        #endif`,
      )
      .replace(
        '#include <color_vertex>',
        /* glsl */ `#include <color_vertex>
        // each plant turns at its own moment while the season changes
        vColor = mix(color, aWinter, smoothstep(0.0, 1.0, clamp(uSeason * 1.5 - fract(aWind.y * 0.618) * 0.5, 0.0, 1.0)));`,
      )
      .replace(
        '#include <begin_vertex>',
        /* glsl */ `#include <begin_vertex>
        vPlant = vec4(position, aWind.z);
        #ifdef PLANT_WIND
        transformed = plantSway(transformed, aWind);
        #endif`,
      )
    shader.fragmentShader = (flags + shader.fragmentShader)
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
        uniform vec3 uSunDir;
        uniform vec3 uRimColor;
        uniform float uRim;
        uniform vec3 uShadeColor;
        uniform float uShade;
        varying vec4 vPlant;
        #ifdef PLANT_GRAIN
        float plantHash(vec3 p) {
          p = fract(p * 0.3183099 + 0.1);
          p *= 17.0;
          return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }
        // value noise (x, -1..1) with its gradient (yzw)
        vec4 plantNoise(vec3 x) {
          vec3 p = floor(x);
          vec3 w = fract(x);
          vec3 u = w * w * w * (w * (w * 6.0 - 15.0) + 10.0);
          vec3 du = 30.0 * w * w * (w * (w - 2.0) + 1.0);
          float a = plantHash(p);
          float b = plantHash(p + vec3(1, 0, 0));
          float c = plantHash(p + vec3(0, 1, 0));
          float d = plantHash(p + vec3(1, 1, 0));
          float e = plantHash(p + vec3(0, 0, 1));
          float f = plantHash(p + vec3(1, 0, 1));
          float g = plantHash(p + vec3(0, 1, 1));
          float h = plantHash(p + vec3(1, 1, 1));
          float k0 = a, k1 = b - a, k2 = c - a, k3 = e - a;
          float k4 = a - b - c + d, k5 = a - c - e + g, k6 = a - b - e + f, k7 = -a + b + c - d + e - f - g + h;
          return vec4(-1.0 + 2.0 * (k0 + k1 * u.x + k2 * u.y + k3 * u.z + k4 * u.x * u.y + k5 * u.y * u.z + k6 * u.z * u.x + k7 * u.x * u.y * u.z),
                      2.0 * du * vec3(k1 + k4 * u.y + k6 * u.z + k7 * u.y * u.z, k2 + k5 * u.z + k4 * u.x + k7 * u.z * u.x, k3 + k6 * u.x + k5 * u.y + k7 * u.x * u.y));
        }
        #endif`,
      )
      .replace(
        '#include <normal_fragment_begin>',
        /* glsl */ `#include <normal_fragment_begin>
        #ifdef PLANT_GRAIN
        {
          // leafy relief, like the flocked foliage of a model tree: clumps and finer leaves,
          // stretched upward where the foliage hangs; fades out with distance
          float fade = 1.0 - smoothstep(34.0, 90.0, length(vViewPosition));
          if (fade > 0.0) {
            vec3 st = vec3(1.0, vPlant.w, 1.0);
            vec4 n1 = plantNoise(vPlant.xyz * st * 5.5);
            vec4 n2 = plantNoise(vPlant.xyz * st * 13.0 + 31.7);
            diffuseColor.rgb *= 1.0 + (n1.x * 0.6 + n2.x * 0.4) * (0.2 * fade);
            vec3 grad = (n1.yzw * 0.6 * 5.5 + n2.yzw * 0.4 * 13.0) * st;
            normal = normalize(normal - mat3(viewMatrix) * grad * (0.017 * fade));
          }
        }
        #endif`,
      )
      .replace(
        '#include <opaque_fragment>',
        /* glsl */ `{
          vec3 sunV = normalize((viewMatrix * vec4(uSunDir, 0.0)).xyz);
          vec3 viewV = normalize(vViewPosition);
          float fres = pow(1.0 - saturate(dot(normal, viewV)), 2.5);
          float wrap = saturate(dot(normal, sunV) * 0.5 + 0.5);
          // sunlight scattered through the leaves along the edges turned toward the sun
          outgoingLight += diffuseColor.rgb * uRimColor * (fres * wrap * wrap * uRim);
          // sky light on the side turned away from it
          outgoingLight += diffuseColor.rgb * uShadeColor * ((1.0 - wrap) * uShade);
        }
        #include <opaque_fragment>`,
      )
  }
  material.customProgramCacheKey = () => `plant-${opts.wind ? 1 : 0}-${opts.grain ? 1 : 0}`

  let depth: THREE.MeshDepthMaterial | null = null
  if (opts.wind) {
    depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking })
    depth.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.uTime
      shader.uniforms.uWind = uniforms.uWind
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>\nattribute vec3 aWind;\n${WIND_PARS}`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>\ntransformed = plantSway(transformed, aWind);`)
    }
    depth.customProgramCacheKey = () => 'plant-depth'
  }
  return { material, depth, uniforms }
}
