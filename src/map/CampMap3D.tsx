import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { Star } from 'lucide-react'
import { useCamp } from '../i18n/CampState'
import { HOTSPOTS, type Hotspot } from './hotspots'
import { Icon } from './icons'
import { layout, toWorld } from './layout/layout'
import { Atmosphere } from './scene/Atmosphere'
import { Cabins } from './scene/Cabins'
import { Facilities } from './scene/Facilities'
import { detectQuality, qualityForced, type Quality, type SceneEnv } from './scene/env'
import { Terrain } from './scene/Ground'
import { Life } from './scene/Life'
import { Trees } from './scene/Trees'

const FOV = 32
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2))
const UP = new THREE.Vector3(0, 1, 0)
/** Share of the canvas the full map may fill, leaving room for the controls around it. */
const PAD_H = 0.94
const PAD_V = 0.8
const MIN_DISTANCE = 10

/** Island centre, half-extents and the outline the "full map" framing must contain. */
const LAND = layout.land.map(toWorld)
const MIN_X = Math.min(...LAND.map((p) => p[0]))
const MAX_X = Math.max(...LAND.map((p) => p[0]))
const MIN_Z = Math.min(...LAND.map((p) => p[1]))
const MAX_Z = Math.max(...LAND.map((p) => p[1]))
const CENTER = new THREE.Vector3((MIN_X + MAX_X) / 2, 0, (MIN_Z + MAX_Z) / 2)
/** Island outline relative to its centre, used to keep the look-at point over land. */
const LAND_REL: [number, number][] = LAND.map(([x, z]) => [x - CENTER.x, z - CENTER.z])
const LAND_INSET = 0.86

function insideLand(px: number, pz: number, k: number): boolean {
  let inside = false
  for (let i = 0, j = LAND_REL.length - 1; i < LAND_REL.length; j = i++) {
    const xi = LAND_REL[i][0] * k
    const zi = LAND_REL[i][1] * k
    const xj = LAND_REL[j][0] * k
    const zj = LAND_REL[j][1] * k
    if (zi > pz !== zj > pz && px < ((xj - xi) * (pz - zi)) / (zj - zi) + xi) inside = !inside
  }
  return inside
}

/**
 * Nearest point to (px, pz) that lies on the island outline scaled by `k` about the centre
 * (all coordinates relative to CENTER). Returns the point unchanged when it is already inside.
 */
function clampToLand(px: number, pz: number, k: number, out: [number, number]) {
  if (k <= 1e-4) {
    out[0] = 0
    out[1] = 0
    return
  }
  if (insideLand(px, pz, k)) {
    out[0] = px
    out[1] = pz
    return
  }
  let best = Infinity
  for (let i = 0, j = LAND_REL.length - 1; i < LAND_REL.length; j = i++) {
    const ax = LAND_REL[j][0] * k
    const az = LAND_REL[j][1] * k
    const bx = LAND_REL[i][0] * k
    const bz = LAND_REL[i][1] * k
    const ex = bx - ax
    const ez = bz - az
    const len = ex * ex + ez * ez || 1
    const t = Math.max(0, Math.min(1, ((px - ax) * ex + (pz - az) * ez) / len))
    const qx = ax + ex * t
    const qz = az + ez * t
    const d = (px - qx) * (px - qx) + (pz - qz) * (pz - qz)
    if (d < best) {
      best = d
      out[0] = qx
      out[1] = qz
    }
  }
}

const OUTLINE = LAND.filter((_, i) => i % 2 === 0).flatMap(([x, z]) => [
  new THREE.Vector3(x - CENTER.x, 0, z - CENTER.z),
  new THREE.Vector3(x - CENTER.x, 2.4, z - CENTER.z), // tree tops
])

/** Default viewing directions (from the map toward the camera). Landscape matches the printed map. */
const DIR_LANDSCAPE = new THREE.Vector3(0, 0.64, 0.77).normalize()
const DIR_PORTRAIT = new THREE.Vector3(0.52, 0.84, 0.14).normalize()
const DIR_FOCUS = new THREE.Vector3(0.16, 0.6, 0.78).normalize()

const _r = new THREE.Vector3()
const _u = new THREE.Vector3()
/**
 * Distance at which the whole island exactly fits the canvas when viewed from direction `n`
 * (unit vector from the island centre toward the camera). This is the furthest the camera
 * may ever be: zooming out stops at the full map.
 */
function fitDistance(n: THREE.Vector3, aspect: number): number {
  _r.crossVectors(UP, n)
  if (_r.lengthSq() < 1e-6) _r.set(1, 0, 0)
  else _r.normalize()
  _u.crossVectors(n, _r)
  const th = TAN * Math.max(aspect, 0.01) * PAD_H
  const tv = TAN * PAD_V
  let d = MIN_DISTANCE
  for (const p of OUTLINE) {
    const depth = p.dot(n)
    d = Math.max(d, depth + Math.abs(p.dot(_r)) / th, depth + Math.abs(p.dot(_u)) / tv)
  }
  return d
}

/** Where the camera is heading: the whole camp, or one place. */
type Goal = { kind: 'overview' } | { kind: 'focus'; h: Hotspot }

/**
 * Camera pose for a goal at the current canvas shape. It is recomputed every frame of a
 * flight, because the canvas changes size while a detail panel opens or closes.
 */
function poseInto(goal: Goal, aspect: number, pos: THREE.Vector3, target: THREE.Vector3, short = false) {
  if (goal.kind === 'overview') {
    const dir = aspect >= 0.9 ? DIR_LANDSCAPE : DIR_PORTRAIT
    target.copy(CENTER)
    pos.copy(dir).multiplyScalar(fitDistance(dir, aspect)).add(CENTER)
  } else {
    const dist = Math.min(goal.h.dist, fitDistance(DIR_FOCUS, aspect) * 0.6)
    // Looking a little past the place (away from the camera) moves it down the screen,
    // clear of the buttons along the top of a short map.
    const beyond = short ? dist * 0.2 : 0
    target.set(goal.h.pos[0] - DIR_FOCUS.x * beyond, 0.4, goal.h.pos[2] - DIR_FOCUS.z * beyond)
    pos.copy(DIR_FOCUS).multiplyScalar(dist).add(target)
  }
}

interface Controls {
  target: THREE.Vector3
  maxDistance: number
  update: () => void
  addEventListener: (e: string, f: () => void) => void
  removeEventListener: (e: string, f: () => void) => void
}

/**
 * Camera behaviour:
 *  - flies to the selected place; "Full map" (resetKey) flies back out;
 *  - zoom-out is capped at the full-map framing for the current viewing angle;
 *  - the look-at point is kept over the island, in a zone that shrinks to the centre
 *    as the camera zooms out, so the map can never be dragged off the board.
 */
function CameraRig({ focus, flyKey, resetKey, onZoomedChange, onInteract }: { focus: Hotspot | null; flyKey: number; resetKey: number; onZoomedChange: (z: boolean) => void; onInteract: () => void }) {
  const camera = useThree((st) => st.camera)
  const size = useThree((st) => st.size)
  const controls = useThree((st) => st.controls) as unknown as Controls | null
  const goal = useRef<Goal | null>(null)
  const snapped = useRef(false)
  const zoomed = useRef(false)
  const lastZoom = useRef('')
  const aspect = size.width / Math.max(1, size.height)
  const aspectRef = useRef(aspect)
  aspectRef.current = aspect
  const shortRef = useRef(false)
  shortRef.current = size.height < 400
  const spot = useMemo<[number, number]>(() => [0, 0], [])
  const off = useMemo(() => new THREE.Vector3(), [])
  const sphNow = useMemo(() => new THREE.Spherical(), [])
  const sphGoal = useMemo(() => new THREE.Spherical(), [])
  const prevDir = useMemo(() => new THREE.Vector3(), [])
  const prevD = useRef(0)
  /** True while the view is the full map; rotating then keeps the whole camp framed. */
  const pinnedFull = useRef(true)
  const dir = useMemo(() => new THREE.Vector3(), [])
  const shift = useMemo(() => new THREE.Vector3(), [])
  const gPos = useMemo(() => new THREE.Vector3(), [])
  const gTarget = useMemo(() => new THREE.Vector3(), [])
  const focusId = focus?.id ?? null

  // First frame: the full map, or the deep-linked place.
  useEffect(() => {
    if (!controls || snapped.current) return
    poseInto(focus ? { kind: 'focus', h: focus } : { kind: 'overview' }, aspectRef.current, gPos, gTarget, shortRef.current)
    camera.position.copy(gPos)
    controls.target.copy(gTarget)
    controls.update()
    pinnedFull.current = !focus // a deep link starts at its place, not on the full map
    snapped.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controls])

  // Selecting a place flies there, also when it is clicked again after the view was moved.
  // Closing its panel leaves the camera where it is.
  useEffect(() => {
    if (snapped.current && focus) goal.current = { kind: 'focus', h: focus }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, flyKey])

  // "Full map".
  const firstReset = useRef(true)
  useEffect(() => {
    if (firstReset.current) {
      firstReset.current = false
      return
    }
    if (snapped.current) goal.current = { kind: 'overview' }
  }, [resetKey])

  // Window resized or phone rotated while on the full map: re-frame it.
  const aspectBucket = Math.round(aspect * 16)
  useEffect(() => {
    if (snapped.current && !focus && !zoomed.current) goal.current = { kind: 'overview' }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspectBucket])

  // A drag, pinch or scroll cancels any flight in progress.
  useEffect(() => {
    if (!controls) return
    const start = () => {
      goal.current = null
      onInteract()
    }
    controls.addEventListener('start', start)
    return () => controls.removeEventListener('start', start)
  }, [controls, onInteract])

  useFrame((_, dt) => {
    if (!controls || !snapped.current) return
    const g = goal.current
    if (g) {
      poseInto(g, aspectRef.current, gPos, gTarget, shortRef.current)
      controls.maxDistance = Infinity
      // exponential ease, independent of frame rate (dt capped so a stalled tab cannot jump)
      const k = 1 - Math.exp(-Math.min(dt, 0.25) * 3.4)
      // Fly in orbit coordinates: ease the look-at point, the distance, the tilt and the
      // heading (the short way round) separately, so the camera swings around the camp
      // instead of cutting across the top of it.
      sphNow.setFromVector3(off.subVectors(camera.position, controls.target))
      sphGoal.setFromVector3(off.subVectors(gPos, gTarget))
      let dTheta = sphGoal.theta - sphNow.theta
      dTheta = ((((dTheta + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI
      sphNow.radius *= Math.pow(sphGoal.radius / Math.max(sphNow.radius, 1e-3), k)
      sphNow.phi += (sphGoal.phi - sphNow.phi) * k
      sphNow.theta += dTheta * k
      sphNow.makeSafe()
      controls.target.lerp(gTarget, k)
      camera.position.setFromSpherical(sphNow).add(controls.target)
      if (camera.position.distanceTo(gPos) < 0.08 && controls.target.distanceTo(gTarget) < 0.05) {
        camera.position.copy(gPos)
        controls.target.copy(gTarget)
        pinnedFull.current = g.kind === 'overview'
        goal.current = null
      }
      controls.update()
    }
    dir.subVectors(camera.position, controls.target)
    let d = Math.max(dir.length(), 1e-3)
    dir.multiplyScalar(1 / d)
    const dMax = fitDistance(dir, aspectRef.current)
    if (!goal.current) {
      // On the full map, turning the view must keep the whole camp framed: the fitting
      // distance changes with the heading, so follow it. Only a zoom-in (distance drops
      // while the heading stays put) leaves the full map.
      const turned = prevDir.angleTo(dir) > 0.002
      const zoomedIn = prevD.current > 0 && d < prevD.current * 0.99 && !turned
      if (pinnedFull.current && zoomedIn) pinnedFull.current = false
      else if (!pinnedFull.current && d >= dMax * 0.985) pinnedFull.current = true
      if (pinnedFull.current && Math.abs(d - dMax) > 1e-3) {
        camera.position.copy(controls.target).addScaledVector(dir, dMax)
        d = dMax
      }
      controls.maxDistance = dMax
      // The further out, the closer the look-at point must stay to the island centre.
      const f = THREE.MathUtils.clamp((1 - d / dMax) * 1.2, 0, 1)
      const t = controls.target
      clampToLand(t.x - CENTER.x, t.z - CENTER.z, f * LAND_INSET, spot)
      shift.set(spot[0] + CENTER.x - t.x, THREE.MathUtils.clamp(t.y, 0, 1.2) - t.y, spot[1] + CENTER.z - t.z)
      if (shift.lengthSq() > 1e-8) {
        t.add(shift)
        camera.position.add(shift)
      }
    }
    prevDir.copy(dir)
    prevD.current = d
    const home = aspectRef.current >= 0.9 ? DIR_LANDSCAPE : DIR_PORTRAIT
    const z = d < dMax * 0.94 || dir.angleTo(home) > 0.14
    if (z !== zoomed.current) {
      zoomed.current = z
      onZoomedChange(z)
    }
    const ratio = (d / dMax).toFixed(2)
    if (ratio !== lastZoom.current) {
      lastZoom.current = ratio
      document.documentElement.dataset.mapZoom = ratio // read by the browser tests
    }
    const onLand = insideLand(controls.target.x - CENTER.x, controls.target.z - CENTER.z, 1.02) ? '1' : '0'
    if (document.documentElement.dataset.mapOnLand !== onLand) document.documentElement.dataset.mapOnLand = onLand
    // frames drawn so far: lets the browser tests tell "the camera has come to rest" from "no frame was drawn"
    const w = window as unknown as { __mapFrame?: number }
    w.__mapFrame = (w.__mapFrame ?? 0) + 1
  })
  return null
}

/** Publishes draw-call and triangle counts for the performance checks (document.documentElement.dataset.mapInfo). */
function RenderStats({ quality }: { quality: Quality }) {
  const gl = useThree((st) => st.gl)
  const t = useRef(0)
  useEffect(() => {
    gl.info.autoReset = false
    return () => {
      gl.info.autoReset = true
    }
  }, [gl])
  // Runs before the frame is drawn: read what the previous frame cost, then start counting afresh.
  useFrame((_, dt) => {
    t.current += dt
    if (t.current > 0.5) {
      t.current = 0
      document.documentElement.dataset.mapInfo = `quality=${quality} calls=${gl.info.render.calls} tris=${gl.info.render.triangles} geos=${gl.info.memory.geometries} tex=${gl.info.memory.textures}`
    }
    gl.info.reset()
  }, -100)
  return null
}

/** DOM marker registry: the render loop positions these every frame. */
const markerEls = new Map<string, HTMLElement>()
/** Markers closer than this (px) would sit on top of each other, so only the more important one shows. */
const CLEAR_PX = 25
const CLEAR_AGAIN_PX = 30

/**
 * Projects every hotspot to the screen and moves its DOM marker there. When the view is
 * far enough out that markers would overlap, the lower-priority one is hidden until the
 * visitor zooms in; the place list under the map always offers every place.
 */
function MarkerDriver({ selectedId }: { selectedId: string | null }) {
  const camera = useThree((st) => st.camera)
  const size = useThree((st) => st.size)
  const v = useMemo(() => new THREE.Vector3(), [])
  const hidden = useRef(new Set<string>())
  // Priority: the selected place, then highlights, then facilities, then zone letters.
  const order = useMemo(() => {
    const rank = (h: Hotspot) => (h.id === selectedId ? 0 : h.highlight ? 1 : h.kind === 'place' ? 2 : 3)
    return [...HOTSPOTS].sort((a, b) => rank(a) - rank(b))
  }, [selectedId])
  const placed = useMemo<number[]>(() => [], [])
  useFrame(() => {
    placed.length = 0
    for (const h of order) {
      const el = markerEls.get(h.id)
      if (!el) continue
      v.set(h.pos[0], h.pos[1], h.pos[2]).project(camera)
      const x = (v.x * 0.5 + 0.5) * size.width
      const y = (-v.y * 0.5 + 0.5) * size.height
      let show = v.z > -1 && v.z < 1 && x > -30 && x < size.width + 30 && y > -10 && y < size.height + 50
      if (show && h.id !== selectedId) {
        // hysteresis keeps a marker from flickering at the threshold
        const need = hidden.current.has(h.id) ? CLEAR_AGAIN_PX : CLEAR_PX
        for (let i = 0; i < placed.length; i += 2) {
          if (Math.hypot(placed[i] - x, placed[i + 1] - y) < need) {
            show = false
            break
          }
        }
      }
      if (show) {
        placed.push(x, y)
        hidden.current.delete(h.id)
      } else hidden.current.add(h.id)
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`
      el.style.opacity = show ? '1' : '0'
      el.style.visibility = show ? 'visible' : 'hidden' // also removes it from the Tab order
      el.style.pointerEvents = show ? 'auto' : 'none'
      el.style.zIndex = String(Math.max(1, Math.round((1 - v.z) * 5000)))
      if (show) el.removeAttribute('data-hidden')
      else el.setAttribute('data-hidden', '1')
    }
    document.documentElement.dataset.mapReady = '1'
  })
  return null
}

/**
 * Compact icon markers. The name appears when a marker is selected, and on hover or
 * keyboard focus, so the map itself stays visible.
 */
function MarkerLayer({ selectedId, onSelect }: { selectedId: string | null; onSelect: (id: string) => void }) {
  const { t, s } = useCamp()
  const layer = useRef<HTMLDivElement>(null)
  // The markers are DOM buttons above the canvas, so pass scroll-wheel zooming through to the map.
  useEffect(() => {
    const el = layer.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      const canvas = el.parentElement?.querySelector('canvas')
      if (!canvas) return
      e.preventDefault()
      canvas.dispatchEvent(new WheelEvent('wheel', { deltaX: e.deltaX, deltaY: e.deltaY, deltaMode: e.deltaMode, clientX: e.clientX, clientY: e.clientY, ctrlKey: e.ctrlKey, bubbles: true, cancelable: true }))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])
  return (
    <div ref={layer} className="pointer-events-none absolute inset-0 overflow-clip">
      {HOTSPOTS.map((h) => {
        const sel = h.id === selectedId
        const zone = h.kind === 'zone'
        const pin = sel
          ? 'border-white bg-cedar text-pine-900 ring-4 ring-cedar/40 scale-110'
          : h.highlight
            ? 'border-amber-100 bg-gradient-to-b from-amber-300 to-cedar text-pine-900'
            : zone
              ? 'border-white/60 bg-pine text-white group-hover:bg-moss'
              : 'border-white/70 bg-pine-900/85 text-cedar-100 group-hover:bg-pine-800'
        return (
          <button
            key={h.id}
            type="button"
            ref={(el) => {
              if (el) markerEls.set(h.id, el)
              else markerEls.delete(h.id)
            }}
            onClick={() => onSelect(h.id)}
            aria-pressed={sel}
            aria-label={t(h.name)}
            title={t(h.name)}
            data-hotspot={h.id}
            data-selected={sel || undefined}
            className={`group absolute left-0 top-0 flex cursor-pointer touch-none flex-col items-center transition-opacity duration-200 will-change-transform hover:!z-[99998] focus-visible:!z-[99998] ${sel ? '!z-[99999]' : ''}`}
            style={{ opacity: 0 }}
          >
            {/* name: selected, hovered or focused markers only */}
            <span
              data-marker-name
              className={`pointer-events-none absolute bottom-full mb-1 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold shadow-lg backdrop-blur-md ${
                sel ? 'flex border-white/60 bg-cedar text-pine-900' : 'hidden border-white/25 bg-pine-900/90 text-white group-hover:flex group-focus-visible:flex'
              }`}
            >
              {t(h.name)}
              {h.highlight && (
                <span className="flex items-center gap-0.5 rounded-full bg-pine-900/85 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-200">
                  <Star size={9} fill="currentColor" aria-hidden />
                  {s.map.highlight}
                </span>
              )}
            </span>
            <span className={`relative grid place-items-center rounded-full border shadow-md backdrop-blur-sm transition-[transform,background-color] duration-200 ${zone ? 'h-6 w-6 text-[11px] font-bold' : 'h-7 w-7'} ${pin}`}>
              {zone ? h.zone : <Icon name={h.icon} size={14} strokeWidth={2.2} />}
              {h.highlight && !sel && (
                <span className="absolute -right-1.5 -top-1.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-pine-900 text-amber-300">
                  <Star size={8} fill="currentColor" aria-hidden />
                </span>
              )}
            </span>
            {/* pointer: its tip sits exactly on the place */}
            <span className={`-mt-px h-0 w-0 border-x-[4px] border-t-[5px] border-x-transparent ${sel ? 'border-t-cedar' : h.highlight ? 'border-t-cedar' : zone ? 'border-t-pine' : 'border-t-pine-900/85'}`} />
          </button>
        )
      })}
    </div>
  )
}

export function CampMap3D({
  selected,
  flyKey,
  onSelect,
  resetKey,
  onZoomedChange,
  onInteract,
}: {
  selected: Hotspot | null
  /** Bumped on every place click, so clicking the current place again flies back to it. */
  flyKey: number
  onSelect: (id: string) => void
  resetKey: number
  onZoomedChange: (zoomedIn: boolean) => void
  onInteract: () => void
}) {
  const { season, time, s } = useCamp()
  // Capable devices get ambient occlusion, bloom and large soft shadows; phones and weak
  // GPUs get a lighter version. If a 'high' device cannot keep up, it steps down by itself.
  const [quality, setQuality] = useState<Quality>(detectQuality)
  const env = useMemo<SceneEnv>(() => ({ season, time, quality }), [season, time, quality])
  const high = quality === 'high'
  return (
    <div className="absolute inset-0 isolate bg-pine-900" role="application" aria-label={s.map.mapOf}>
      {/*
        The canvas, camera and controls are never re-created when the quality tier changes, so a
        device that steps down keeps its place on the map. `flat` hands tone mapping to the
        effect composer on the high tier; resolution and tone mapping switch in place.
      */}
      <Canvas shadows="soft" flat={high} dpr={high ? [1, 2] : [1, 1.5]} camera={{ position: [0, 78, 92], fov: FOV, near: 1, far: 1600 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
        {high && !qualityForced() && <PerformanceMonitor ms={300} iterations={8} bounds={() => [28, 61]} flipflops={2} onDecline={() => setQuality('low')} />}
        <Suspense fallback={null}>
          <Atmosphere env={env} />
          {/* only the scene layers are rebuilt for the other tier */}
          <group key={quality}>
            <Terrain env={env} />
            <Trees env={env} />
            <Cabins env={env} />
            <Facilities env={env} />
            <Life env={env} />
          </group>
          <MarkerDriver selectedId={selected?.id ?? null} />
          <RenderStats quality={quality} />
        </Suspense>
        <CameraRig focus={selected} flyKey={flyKey} resetKey={resetKey} onZoomedChange={onZoomedChange} onInteract={onInteract} />
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} screenSpacePanning={false} minDistance={MIN_DISTANCE} maxDistance={400} minPolarAngle={0.2} maxPolarAngle={1.25} />
      </Canvas>
      <MarkerLayer selectedId={selected?.id ?? null} onSelect={onSelect} />
    </div>
  )
}
