import * as THREE from 'three'
import { isDusk, isWinter, PALETTE, type SceneEnv } from '../env'
import { BAND, MASK_RECT, WOOD_HI, WOOD_LO } from './fields'

/** World size of one repeat of the canopy texture, and the number of crowns across it. */
export const CANOPY_TILE = 38
export const CANOPY_CROWNS = 14

const color = (hex: string) => ({ value: new THREE.Color(hex) })

/**
 * One material for all the land. It reads the mask texture (distance to the roads, the water,
 * the camp boundary and the tree line) and paints lawn, gravel lanes, lake banks, rough
 * ground and woodland canopy from it, so every edge is soft and nothing tiles.
 */
export function makeGroundMaterial(tex: { mask: THREE.Texture; noise: THREE.Texture; canopy: THREE.Texture }, pool: [number, number, number], high: boolean) {
  const uniforms = {
    tMask: { value: tex.mask },
    tNoise: { value: tex.noise },
    tCanopy: { value: tex.canopy },
    uMaskRect: { value: new THREE.Vector4(MASK_RECT.x0, MASK_RECT.z0, 1 / MASK_RECT.sx, 1 / MASK_RECT.sz) },
    uPool: { value: new THREE.Vector3(...pool) },
    uPoolSpill: { value: 0 },
    cPoolSpill: color('#2f8fff'),
    cLawn: color(PALETTE.lawn),
    cLawnDark: color(PALETTE.lawnDark),
    cLawnDry: color('#9aa85a'),
    cRough: color('#668a45'),
    cFloor: color('#3a5c31'),
    cCanopy: color(PALETTE.canopy),
    cCanopyDeep: color(PALETTE.canopyDeep),
    cCanopyLight: color('#45763a'),
    cRoad: color(PALETTE.road),
    cRoadEdge: color(PALETTE.roadEdge),
    cMud: color('#6a5f43'),
    cReed: color('#4c6f36'),
  }
  const material = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.92, metalness: 0 })
  material.customProgramCacheKey = () => `terrain-ground-${high ? 'high' : 'low'}`
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWpos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWpos = (modelMatrix * vec4(transformed, 1.0)).xyz;')
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
        ${high ? '#define TERRAIN_HIGH' : ''}
        varying vec3 vWpos;
        uniform sampler2D tMask; uniform sampler2D tNoise; uniform sampler2D tCanopy;
        uniform vec4 uMaskRect; uniform vec3 uPool; uniform float uPoolSpill; uniform vec3 cPoolSpill;
        uniform vec3 cLawn; uniform vec3 cLawnDark; uniform vec3 cLawnDry; uniform vec3 cRough; uniform vec3 cFloor;
        uniform vec3 cCanopy; uniform vec3 cCanopyDeep; uniform vec3 cCanopyLight;
        uniform vec3 cRoad; uniform vec3 cRoadEdge; uniform vec3 cMud; uniform vec3 cReed;
        float gRough; float gCanopy; vec2 gBump; float gSpill;`,
      )
      .replace(
        '#include <lights_pars_begin>',
        /* glsl */ `#include <lights_pars_begin>
        vec2 terrainSunXZ() {
          #if NUM_DIR_LIGHTS > 0
            return normalize(inverseTransformDirection(directionalLights[0].direction, viewMatrix).xz + 1e-4);
          #else
            return vec2(0.0, 1.0);
          #endif
        }`,
      )
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        {
          vec2 gp = vWpos.xz;
          vec4 mk = texture2D(tMask, (gp - uMaskRect.xy) * uMaskRect.zw);
          float sdRoad = (0.5 - mk.r) * ${(2 * BAND.road).toFixed(2)};
          float sdWater = (0.5 - mk.g) * ${(2 * BAND.water).toFixed(2)};
          float sdLand = (0.5 - mk.b) * ${(2 * BAND.land).toFixed(2)};
          float wood = mk.a * ${(WOOD_HI - WOOD_LO).toFixed(2)} + ${WOOD_LO.toFixed(2)};
          vec4 nA = texture2D(tNoise, gp * 0.0125);
          vec4 nB = texture2D(tNoise, gp * 0.083 + vec2(0.37, 0.11));
          vec4 nC = texture2D(tNoise, gp * 0.71);
          vec4 nD = texture2D(tNoise, gp * 0.27 + vec2(0.13, 0.61));
          float grain = nC.b;
          float tuft = nD.b * 0.55 + nD.g * 0.45;
          float nearPool = 1.0 - smoothstep(uPool.z - 1.2, uPool.z, distance(gp, uPool.xy));
          float sdLake = mix(sdWater, ${BAND.water.toFixed(1)}, nearPool);
          gSpill = exp(-max(sdWater, 0.0) * 1.3) * nearPool;

          // lawn: darker and lusher toward the lakes, a little drier where it is worn,
          // faintly striped by the mower, with a fine pile
          float lush = (1.0 - smoothstep(0.15, 3.6, sdLake)) * 0.6 + (nA.r - 0.5) * 0.8 + (nB.g - 0.5) * 0.3 + 0.2;
          vec3 lawn = mix(cLawn, cLawnDark, clamp(lush, 0.0, 1.0));
          float roadSide = 1.0 - smoothstep(0.0, 1.1, sdRoad);
          float dry = smoothstep(0.55, 0.95, nB.a * 0.7 + nA.a * 0.3 + roadSide * 0.3 + nearPool * 0.2);
          lawn = mix(lawn, cLawnDry, dry * 0.3);
          float ph = dot(gp, vec2(0.819, 0.574)) * 3.9 + (nA.g - 0.5) * 3.0;
          float stripeFade = 1.0 - smoothstep(0.25, 0.9, fwidth(ph));
          lawn *= 1.0 + (smoothstep(-0.4, 0.4, sin(ph)) - 0.5) * 0.085 * stripeFade;
          lawn *= 0.83 + grain * 0.22 + tuft * 0.12;

          // rough natural ground outside the camp boundary
          float edge = sdLand + (nB.r - 0.5) * 0.55 + (nC.a - 0.5) * 0.14;
          float outside = smoothstep(-0.14, 0.16, edge);
          vec3 rough = mix(cRough, cFloor, clamp(0.25 + (nA.a - 0.5) * 1.3 + smoothstep(-1.0, 2.5, wood) * 0.45, 0.0, 1.0));
          rough *= (0.8 + grain * 0.2 + tuft * 0.2) * (1.0 + (nB.g - 0.5) * 0.3);
          vec3 col = mix(lawn, rough, outside);
          // a slightly deeper tone right at the boundary keeps the edge of the camp legible
          col *= 1.0 - 0.08 * (1.0 - smoothstep(0.0, 0.5, abs(edge - 0.1)));
          gRough = mix(0.9, 0.96, outside);
          gBump = (nC.ra - 0.5) * 0.3 + (nD.ra - 0.5) * 0.22;

          // gravel lanes with soft, slightly ragged edges
          float rw = sdRoad + (nB.b - 0.5) * 0.16 + (nC.r - 0.5) * 0.1;
          float aa = max(fwidth(sdRoad) * 0.8, 0.035);
          float roadM = 1.0 - smoothstep(-aa, aa + 0.05, rw);
          vec3 road = mix(cRoadEdge, cRoad, smoothstep(0.0, 0.55, -rw));
          road *= (0.86 + grain * 0.28) * (1.0 + (nB.a - 0.5) * 0.1 + (nA.g - 0.5) * 0.08);
          road *= 1.0 + (step(0.78, nC.g) - step(nC.g, 0.22)) * 0.07;
          col *= 1.0 - 0.2 * (1.0 - smoothstep(0.0, 0.2, rw)) * (1.0 - roadM);
          col = mix(col, road, roadM);
          gRough = mix(gRough, 0.97, roadM);
          gBump *= 1.0 - roadM * 0.6;

          // lake banks: clumps of sedge at the top, grass down the slope, wet earth at the water line
          float clump = smoothstep(0.35, 0.7, nB.g * 0.55 + nD.a * 0.45);
          float reed = (1.0 - smoothstep(0.0, 0.45, sdLake)) * (0.3 + 0.7 * clump) * (1.0 - roadM);
          col = mix(col, cReed * (0.8 + grain * 0.2 + tuft * 0.2), reed * 0.6);
          float slope = smoothstep(-0.015, -0.1, vWpos.y);
          col = mix(col, cReed * (0.72 + tuft * 0.3), slope * 0.75);
          float mud = smoothstep(-0.15, -0.27, vWpos.y);
          col = mix(col, cMud * (0.85 + grain * 0.3), mud * 0.9);
          col *= 1.0 - 0.3 * smoothstep(-0.27, -0.36, vWpos.y);
          gRough = mix(gRough, 0.5, mud);

          // woodland: shaded floor under the first trees, then a continuous canopy
          float under = smoothstep(-0.3, 1.6, wood);
          col = mix(col, cFloor * (0.78 + grain * 0.2 + tuft * 0.15), under * 0.7 * (1.0 - roadM * 0.6));
          gCanopy = smoothstep(2.2, 5.6, wood + (nB.r - 0.5) * 1.6);
          vec2 cuv = gp / ${CANOPY_TILE.toFixed(1)};
          // crowns per pixel: far away and at grazing angles the canopy settles into a calm, even surface
          float crownsPerPixel = max(length(dFdx(cuv)), length(dFdy(cuv))) * ${CANOPY_CROWNS.toFixed(1)};
          float crownDetail = 1.0 - smoothstep(0.2, 0.75, crownsPerPixel);
          float standDetail = 1.0 - smoothstep(0.5, 2.2, crownsPerPixel);
          #ifdef TERRAIN_HIGH
            // the crowns have height: shift them with the viewing angle so the canopy has depth
            vec3 toEye = normalize(cameraPosition - vWpos);
            cuv += toEye.xz / max(toEye.y, 0.4) * (texture2D(tCanopy, cuv).a - 0.6) * (crownDetail * ${(1.1 / CANOPY_TILE).toFixed(4)});
          #endif
          vec4 cn = texture2D(tCanopy, cuv);
          float crownH = mix(0.62, cn.a, crownDetail);
          vec3 canopy = mix(cCanopyDeep, cCanopy, smoothstep(0.1, 0.9, crownH));
          #ifdef TERRAIN_HIGH
            // and each crown shades its neighbour on the side away from the sun
            float taller = texture2D(tCanopy, cuv + terrainSunXZ() * ${(1.0 / CANOPY_TILE).toFixed(4)}).a - cn.a;
            canopy *= 1.0 - 0.4 * mix(0.22, smoothstep(0.03, 0.32, taller), crownDetail);
          #endif
          // here and there a stand of lighter trees
          float lightStand = smoothstep(0.7, 1.0, cn.b) * 0.3 * crownDetail + mix(0.12, smoothstep(0.52, 0.85, nA.a) * 0.4, standDetail);
          canopy = mix(canopy, cCanopyLight, lightStand * crownH);
          canopy *= mix(0.5, 1.0, smoothstep(0.0, 0.5, crownH)) * (1.0 + (nA.g - 0.5) * 0.24 * standDetail) * (0.95 + cn.b * 0.1);
          col = mix(col, canopy, gCanopy);
          gBump = mix(gBump, (cn.rg * 2.0 - 1.0) * (1.3 * crownDetail), gCanopy);
          gRough = mix(gRough, 0.88, gCanopy);

          diffuseColor.rgb = col;
        }`,
      )
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = gRough;')
      // light from the pool's underwater lamps spilling onto the grass around it
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += cPoolSpill * diffuseColor.rgb * (gSpill * uPoolSpill);')
      .replace(
        '#include <normal_fragment_maps>',
        /* glsl */ `#include <normal_fragment_maps>
        {
          vec3 nW = inverseTransformDirection(normal, viewMatrix);
          nW = normalize(nW + vec3(gBump.x, 0.0, gBump.y));
          normal = normalize((viewMatrix * vec4(nW, 0.0)).xyz);
        }`,
      )
  }

  const setEnv = (env: SceneEnv) => {
    const winter = isWinter(env)
    uniforms.cLawn.value.set(winter ? PALETTE.lawnWinter : PALETTE.lawn)
    uniforms.cLawnDark.value.set(winter ? '#6c8a4c' : PALETTE.lawnDark)
    uniforms.cLawnDry.value.set(winter ? '#a9a56c' : '#9aa85a')
    uniforms.cRough.value.set(winter ? '#7b8650' : '#668a45')
    uniforms.cFloor.value.set(winter ? '#465a36' : '#3a5c31')
    uniforms.cCanopy.value.set(winter ? '#3a5f3c' : PALETTE.canopy)
    uniforms.cCanopyDeep.value.set(winter ? '#2a4a31' : PALETTE.canopyDeep)
    uniforms.cCanopyLight.value.set(winter ? '#66743f' : '#45763a')
    uniforms.cReed.value.set(winter ? '#77783f' : '#4c6f36')
    uniforms.uPoolSpill.value = isDusk(env) ? 0.7 : 0
  }

  return { material, uniforms, setEnv }
}

/**
 * Pale stone coping around the pool: a faint terrazzo fleck, and at dusk the blue of the
 * underwater lamps along its inner edge.
 */
export function makeCopingMaterial(tex: { mask: THREE.Texture; noise: THREE.Texture }) {
  const uniforms = {
    tMask: { value: tex.mask },
    tNoise: { value: tex.noise },
    uMaskRect: { value: new THREE.Vector4(MASK_RECT.x0, MASK_RECT.z0, 1 / MASK_RECT.sx, 1 / MASK_RECT.sz) },
    uPoolSpill: { value: 0 },
    cPoolSpill: color('#2f8fff'),
  }
  const material = new THREE.MeshStandardMaterial({ color: '#ece4d3', roughness: 0.8, metalness: 0 })
  material.customProgramCacheKey = () => 'terrain-coping'
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWpos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWpos = (modelMatrix * vec4(transformed, 1.0)).xyz;')
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
        varying vec3 vWpos;
        uniform sampler2D tMask; uniform sampler2D tNoise; uniform vec4 uMaskRect; uniform float uPoolSpill; uniform vec3 cPoolSpill;
        float gSpill;`,
      )
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        {
          vec4 n1 = texture2D(tNoise, vWpos.xz * 0.9);
          vec4 n2 = texture2D(tNoise, vWpos.xz * 0.12);
          diffuseColor.rgb *= 0.93 + n1.b * 0.09 + (n2.g - 0.5) * 0.06;
          float sd = (0.5 - texture2D(tMask, (vWpos.xz - uMaskRect.xy) * uMaskRect.zw).g) * ${(2 * BAND.water).toFixed(2)};
          gSpill = exp(-max(sd, 0.0) * 1.3);
        }`,
      )
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += cPoolSpill * diffuseColor.rgb * (gSpill * uPoolSpill);')
  }
  const setEnv = (env: SceneEnv) => {
    uniforms.uPoolSpill.value = isDusk(env) ? 0.7 : 0
  }
  return { material, setEnv }
}

/** Woodland crowns: one tinted, softly shaded material, darker underneath. */
export function makeCrownMaterial() {
  const material = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, metalness: 0 })
  material.customProgramCacheKey = () => 'terrain-crown'
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vCrownY;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCrownY = position.y;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vCrownY;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= mix(0.5, 1.0, smoothstep(-0.55, 0.7, vCrownY));')
  }
  const setEnv = (env: SceneEnv) => {
    material.color.set(isWinter(env) ? '#f2ecd0' : '#ffffff')
  }
  return { material, setEnv }
}
