import { useEffect, useLayoutEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { wx, wz } from '../layout/layout'
import { isDusk, isWinter, type Quality, type SceneEnv } from './env'
import { createAmbient } from './life/ambient'
import { createBirds } from './life/birds'
import { createKayaks } from './life/kayaks'
import { pointAt } from './life/path'
import { surfaceLevel } from './life/probe'
import { createTram } from './life/tram'

/**
 * The animated versions built here replace these static props of the Facilities layer
 * (its parked tram, the kayaks afloat on the kayak lake, the herons of the wild lake).
 */
export const LIFE_REPLACES = { tram: true, kayaks: true, birds: true } as const

/** Surface heights used until (or unless) the scene can be asked: road top and lake water. */
const ROAD_Y = 0.035
const WATER_Y = -0.32
/** Open-water places (world x, z) where the lakes' level is read. */
const WILD_PLACES = ([[380, 350], [420, 380], [330, 362]] as const).map(([x, y]) => [wx(x), wz(y)] as const)
const KAYAK_PLACES = ([[930, 400], [900, 440], [950, 430]] as const).map(([x, y]) => [wx(x), wz(y)] as const)
/** Frames at which the surfaces are looked for: once everything is in place, then again only if something was missing. */
const PROBE_FRAMES = [2, 30, 150]

/** `?life=<seconds>` starts the scene that far into its motion (for stills of a later moment). */
function startOffset(): number {
  if (typeof window === 'undefined') return 0
  const v = Number(new URLSearchParams(window.location.search).get('life'))
  return Number.isFinite(v) && v > 0 ? Math.min(v, 3600) : 0
}

/**
 * Everything that moves. Per tier:
 *  - high: the tram on its round, kayaks with their wake, waders and the gliding flock; at
 *    night the tram's headlights and lanterns, the egrets flying in to roost on the trees
 *    round the wild lake, campfire smoke and sparks, and (summer) fireflies;
 *  - low: tram, kayaks with their wake, a few waders; at night the tram's lights and a
 *    smaller roost.
 * Winter is quieter on the water and busier in the air: one kayak fewer, two more egrets in
 * the flock (they winter here), and no fireflies.
 * Three skinned meshes and a few instanced sprite pools.
 */
function createLife(quality: Quality) {
  const hi = quality === 'high'
  const tram = createTram(hi)
  const kayaks = createKayaks(hi)
  const birds = createBirds(hi)
  const ambient = createAmbient(hi, tram.lamps.length / 5)
  const group = new THREE.Group()
  group.name = 'life'
  group.add(tram.object, tram.pool, kayaks.object, kayaks.wake, birds.object, ambient.glow)
  if (ambient.smoke) group.add(ambient.smoke)

  // "prefers-reduced-motion": hold a composed still (tram at its stop) instead of animating
  const media = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
  let still = !!media?.matches
  const onMedia = (e: MediaQueryListEvent) => {
    still = e.matches
  }

  const level = { road: ROAD_Y, wild: WATER_Y, kayak: WATER_Y }
  const roadPlaces: [number, number][] = [3, 12, 24].map((s) => pointAt(tram.path, s, [0, 0]))
  const noCamera = new THREE.Quaternion()
  const noEye = new THREE.Vector3()
  let frames = 0
  let probing = true
  let sinceInfo = 0

  /**
   * The road and the water belong to the terrain layer: read their heights from the scene
   * rather than assume them. Returns false when some surface could not be found (yet).
   */
  function readLevels(scene: THREE.Scene): boolean {
    const road = surfaceLevel(scene, group, roadPlaces, -0.08, 0.2)
    const wild = surfaceLevel(scene, group, WILD_PLACES, -0.95, -0.02)
    const kayak = surfaceLevel(scene, group, KAYAK_PLACES, -0.95, -0.02)
    if (!Number.isNaN(road)) level.road = road
    if (!Number.isNaN(wild)) level.wild = wild
    if (!Number.isNaN(kayak)) level.kayak = kayak
    return !Number.isNaN(road) && !Number.isNaN(wild) && !Number.isNaN(kayak)
  }

  function step(dt: number, camera: THREE.Quaternion, eye: THREE.Vector3) {
    tram.update(dt, still, level.road)
    kayaks.update(dt, still, level.kayak)
    birds.update(dt, still, level.wild)
    ambient.update(dt, still, camera, eye, tram.lamps, level.wild, level.kayak)
  }
  let begun = false

  return {
    group,
    apply(env: SceneEnv) {
      const dusk = isDusk(env)
      const winter = isWinter(env)
      tram.setDusk(dusk)
      kayaks.setEnv(dusk, winter)
      birds.setEnv(dusk, winter, still)
      ambient.apply(dusk, !winter)
      if (begun) return
      begun = true
      // a requested head start, in small steps so that paths, wakes and the evening return all take part
      for (let left = still ? 0 : startOffset(); left > 0; left -= 0.05) step(0.05, noCamera, noEye)
    },
    tick(delta: number, camera: THREE.Camera, scene: THREE.Scene) {
      frames++
      if (probing && PROBE_FRAMES.includes(frames)) probing = !readLevels(scene) && frames < PROBE_FRAMES[PROBE_FRAMES.length - 1]
      // a stalled tab must not make everything jump
      const dt = Math.min(delta, 0.1)
      step(dt, camera.quaternion, camera.position)
      // positions for the browser checks, twice a second
      sinceInfo += delta
      if (sinceInfo > 0.5) {
        sinceInfo = 0
        const st = tram.state()
        const p = pointAt(tram.path, st.s, [0, 0])
        const k = kayaks.where
        const f = (v: number) => v.toFixed(2)
        let boats = ''
        for (let i = 0; i < k.length; i += 2) boats += `${i ? '|' : ''}${f(k[i])},${f(k[i + 1])}`
        const roost = birds.census()
        document.documentElement.dataset.mapLife = `tram=${f(p[0])},${f(p[1])} s=${f(st.s)} v=${f(st.speed)} waiting=${st.waiting ? 1 : 0} kayaks=${boats} roost=${roost.perched}/${roost.total} flying=${roost.flying} road=${level.road.toFixed(3)} water=${level.wild.toFixed(3)},${level.kayak.toFixed(3)} still=${still ? 1 : 0}`
      }
    },
    /** Follows the visitor's motion preference while mounted; returns the disconnect. */
    connect() {
      if (media) still = media.matches
      media?.addEventListener('change', onMedia)
      return () => media?.removeEventListener('change', onMedia)
    },
    dispose() {
      tram.dispose()
      kayaks.dispose()
      birds.dispose()
      ambient.dispose()
    },
  }
}

/** Moving things: the tram on its round, kayaks on the lake, waterbirds and their evening return, and small lights at night. */
export function Life({ env }: { env: SceneEnv }) {
  const kit = useMemo(() => createLife(env.quality), [env.quality])
  useEffect(() => {
    const disconnect = kit.connect()
    return () => {
      disconnect()
      kit.dispose()
    }
  }, [kit])
  useLayoutEffect(() => kit.apply(env), [kit, env])
  const scene = useThree((s) => s.scene)
  useFrame(({ camera }, delta) => kit.tick(delta, camera, scene))
  return <primitive object={kit.group} />
}
