import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import { isDusk, isWinter, skyFor, type SceneEnv } from './env'
import { M } from './materials'

/**
 * Sky dome: zenith-to-horizon gradient with a soft sun glow and, at dusk, stars.
 * It follows the camera, and its horizon colour is also the haze colour, so distant
 * ground melts into the sky.
 */
function SkyDome({ env, sunDir }: { env: SceneEnv; sunDir: THREE.Vector3 }) {
  const ref = useRef<THREE.Mesh>(null)
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        depthTest: false,
        fog: false,
        uniforms: {
          top: { value: new THREE.Color() },
          horizon: { value: new THREE.Color() },
          haze: { value: new THREE.Color() },
          glow: { value: new THREE.Color() },
          sunDir: { value: new THREE.Vector3(0, 1, 0) },
          stars: { value: 0 },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 top; uniform vec3 horizon; uniform vec3 haze; uniform vec3 glow; uniform vec3 sunDir; uniform float stars;
          varying vec3 vDir;
          float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          void main() {
            vec3 d = normalize(vDir);
            vec3 sd = normalize(sunDir);
            // the horizon band is brightest toward the sun and fades to haze away from it
            float side = pow(max(dot(normalize(vec3(d.x, 0.0, d.z)), normalize(vec3(sd.x, 0.0, sd.z))), 0.0), 1.5);
            vec3 band = mix(haze, horizon, 0.3 + 0.7 * side);
            float t = pow(smoothstep(0.0, 0.85, d.y), 0.55);
            vec3 col = mix(band, top, t);
            float s = max(dot(d, sd), 0.0);
            col += glow * (pow(s, 5.0) * 0.28 + pow(s, 48.0) * 0.55) * step(0.0, d.y + 0.05);
            col = mix(col, haze, smoothstep(0.0, -0.18, d.y));
            if (stars > 0.0 && d.y > 0.08) {
              vec2 g = floor(vec2(atan(d.z, d.x), asin(d.y)) * 140.0);
              col += vec3(step(0.9965, hash(g))) * stars * smoothstep(0.08, 0.45, d.y) * (0.5 + 0.5 * hash(g + 3.0));
            }
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      }),
    [],
  )
  useLayoutEffect(() => {
    const sky = skyFor(env)
    mat.uniforms.top.value.set(sky.top)
    mat.uniforms.horizon.value.set(sky.horizon)
    mat.uniforms.haze.value.set(sky.haze)
    mat.uniforms.glow.value.set(sky.glow)
    mat.uniforms.sunDir.value.copy(sunDir)
    mat.uniforms.stars.value = isDusk(env) ? 0.9 : 0
  }, [env, mat, sunDir])
  useFrame(({ camera }) => ref.current?.position.copy(camera.position))
  return (
    <mesh ref={ref} material={mat} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[700, 32, 20]} />
    </mesh>
  )
}

/**
 * Haze that starts just beyond the camp, however far the camera is, so the camp itself
 * stays crisp while the woodland and hills around it soften toward the horizon.
 */
function Haze({ env }: { env: SceneEnv }) {
  const scene = useThree((s) => s.scene)
  const controls = useThree((s) => s.controls) as unknown as { target: THREE.Vector3 } | null
  const fog = useMemo(() => new THREE.Fog('#ffffff', 200, 900), [])
  useLayoutEffect(() => {
    fog.color.set(skyFor(env).haze)
    scene.fog = fog
    return () => {
      scene.fog = null
    }
  }, [env, fog, scene])
  useFrame(({ camera }) => {
    const d = controls ? camera.position.distanceTo(controls.target) : 150
    fog.near = d + 70
    fog.far = d + 70 + (isDusk(env) ? 420 : 560)
  })
  return null
}

/** Sky, sun, fill light, haze and (on capable devices) ambient occlusion, bloom and vignette. */
export function Atmosphere({ env }: { env: SceneEnv }) {
  const dusk = isDusk(env)
  const winter = isWinter(env)
  const sky = skyFor(env)
  const high = env.quality === 'high'
  // Late-afternoon sun from the south-west: faces toward the default camera are lit and
  // shadows fall away to the north-east. At dusk the sun sits low in the west.
  const sunPos = useMemo<[number, number, number]>(() => (dusk ? [-110, 34, 30] : [-70, 95, 62]), [dusk])
  const sunDir = useMemo(() => new THREE.Vector3(...sunPos).normalize(), [sunPos])

  // Legacy shared materials (still used by layers that have not been restyled).
  useLayoutEffect(() => {
    M.grass.color.set(winter ? '#6f9654' : '#5f9a45')
    M.crown.color.set(winter ? '#5b8f4c' : '#4f9a4f')
    M.crown2.color.set(winter ? '#4b7f52' : '#3e8a52')
    M.cypress.color.set(winter ? '#b5652f' : '#3f8a4a')
    M.glow.emissiveIntensity = dusk ? 2.4 : 0.15
    M.lamp.emissiveIntensity = dusk ? 3.2 : 0.4
    M.sign.emissiveIntensity = dusk ? 2.6 : 0.5
    M.screen.emissiveIntensity = dusk ? 1.6 : 0.05
    M.glass.emissive.set(dusk ? '#ffc56b' : '#000000')
    M.glass.emissiveIntensity = dusk ? 1.5 : 0
    M.pool.emissiveIntensity = dusk ? 0.75 : 0.25
    M.water.color.set(dusk ? '#4a6f9a' : winter ? '#77b4cc' : '#7cc7de')
  }, [winter, dusk])

  return (
    <>
      <SkyDome env={env} sunDir={sunDir} />
      <Haze env={env} />
      <hemisphereLight args={dusk ? ['#93a0f2', '#33443a', sky.ambient] : ['#e4f1ff', '#7d9a62', sky.ambient]} />
      <directionalLight
        position={sunPos}
        intensity={sky.sunIntensity}
        color={sky.sun}
        castShadow
        shadow-mapSize={high ? [4096, 4096] : [1024, 1024]}
        shadow-camera-left={-85}
        shadow-camera-right={85}
        shadow-camera-top={75}
        shadow-camera-bottom={-75}
        shadow-camera-near={1}
        shadow-camera-far={320}
        shadow-bias={-0.0003}
        shadow-normalBias={0.35}
      />
      {/* cool fill from the opposite side keeps shaded faces readable */}
      <directionalLight position={[80, 55, -70]} intensity={dusk ? 0.6 : 0.55} color={dusk ? '#7f8ff0' : '#cfe3ff'} />
      {high && (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <N8AO aoRadius={1.6} distanceFalloff={1.1} intensity={dusk ? 1.6 : 2.4} quality="medium" halfRes color="#14241a" />
          <Bloom mipmapBlur luminanceThreshold={dusk ? 0.72 : 0.96} luminanceSmoothing={0.18} intensity={dusk ? 0.95 : 0.16} radius={0.72} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <SMAA />
          <Vignette offset={0.28} darkness={dusk ? 0.55 : 0.38} />
        </EffectComposer>
      )}
    </>
  )
}
