import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { Star } from 'lucide-react'
import { useCamp } from '../i18n/CampState'
import { HOTSPOTS, type Hotspot } from './hotspots'
import { Icon } from './icons'
import { layout, toWorld } from './layout/layout'
import { Atmosphere } from './scene/Atmosphere'
import { Cabins } from './scene/Cabins'
import { Facilities } from './scene/Facilities'
import { Island, Lakes, PoolBasin, Roads } from './scene/Ground'
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
const HALF_X = (MAX_X - MIN_X) / 2
const HALF_Z = (MAX_Z - MIN_Z) / 2
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
function poseInto(goal: Goal, aspect: number, pos: THREE.Vector3, target: THREE.Vector3) {
  if (goal.kind === 'overview') {
    const dir = aspect >= 0.9 ? DIR_LANDSCAPE : DIR_PORTRAIT
    target.copy(CENTER)
    pos.copy(dir).multiplyScalar(fitDistance(dir, aspect)).add(CENTER)
  } else {
    target.set(goal.h.pos[0], 0.4, goal.h.pos[2])
    const dist = Math.min(goal.h.dist, fitDistance(DIR_FOCUS, aspect) * 0.6)
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
function CameraRig({ focus, resetKey, onZoomedChange, onInteract }: { focus: Hotspot | null; resetKey: number; onZoomedChange: (z: boolean) => void; onInteract: () => void }) {
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
  const dir = useMemo(() => new THREE.Vector3(), [])
  const shift = useMemo(() => new THREE.Vector3(), [])
  const gPos = useMemo(() => new THREE.Vector3(), [])
  const gTarget = useMemo(() => new THREE.Vector3(), [])
  const focusId = focus?.id ?? null

  // First frame: the full map, or the deep-linked place.
  useEffect(() => {
    if (!controls || snapped.current) return
    poseInto(focus ? { kind: 'focus', h: focus } : { kind: 'overview' }, aspectRef.current, gPos, gTarget)
    camera.position.copy(gPos)
    controls.target.copy(gTarget)
    controls.update()
    snapped.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controls])

  // Selecting a place flies there. Closing its panel leaves the camera where it is.
  useEffect(() => {
    if (snapped.current && focus) goal.current = { kind: 'focus', h: focus }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId])

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
      poseInto(g, aspectRef.current, gPos, gTarget)
      controls.maxDistance = Infinity
      // exponential ease, independent of frame rate (dt capped so a stalled tab cannot jump)
      const k = 1 - Math.exp(-Math.min(dt, 0.25) * 3.4)
      camera.position.lerp(gPos, k)
      controls.target.lerp(gTarget, k)
      if (camera.position.distanceTo(gPos) < 0.08) {
        camera.position.copy(gPos)
        controls.target.copy(gTarget)
        goal.current = null
      }
      controls.update()
    }
    dir.subVectors(camera.position, controls.target)
    const d = Math.max(dir.length(), 1e-3)
    dir.multiplyScalar(1 / d)
    const dMax = fitDistance(dir, aspectRef.current)
    if (!goal.current) {
      controls.maxDistance = dMax
      // The further out, the closer the look-at point must stay to the island centre.
      const f = THREE.MathUtils.clamp((1 - d / dMax) * 1.2, 0, 1)
      const t = controls.target
      shift.set(
        THREE.MathUtils.clamp(t.x, CENTER.x - HALF_X * f, CENTER.x + HALF_X * f) - t.x,
        THREE.MathUtils.clamp(t.y, 0, 1.2) - t.y,
        THREE.MathUtils.clamp(t.z, CENTER.z - HALF_Z * f, CENTER.z + HALF_Z * f) - t.z,
      )
      if (shift.lengthSq() > 1e-8) {
        t.add(shift)
        camera.position.add(shift)
      }
    }
    const z = d < dMax * 0.94
    if (z !== zoomed.current) {
      zoomed.current = z
      onZoomedChange(z)
    }
    const ratio = (d / dMax).toFixed(2)
    if (ratio !== lastZoom.current) {
      lastZoom.current = ratio
      document.documentElement.dataset.mapZoom = ratio // read by the browser tests
    }
  })
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
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
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
            className={`group absolute left-0 top-0 flex cursor-pointer flex-col items-center transition-opacity duration-200 will-change-transform hover:!z-[99998] focus-visible:!z-[99998] ${sel ? '!z-[99999]' : ''}`}
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
  onSelect,
  resetKey,
  onZoomedChange,
  onInteract,
}: {
  selected: Hotspot | null
  onSelect: (id: string) => void
  resetKey: number
  onZoomedChange: (zoomedIn: boolean) => void
  onInteract: () => void
}) {
  const { season, time, s } = useCamp()
  const sky =
    time === 'dusk'
      ? 'linear-gradient(180deg,#1d2452 0%,#4a3f7a 45%,#d9825c 100%)'
      : season === 'winter'
        ? 'linear-gradient(180deg,#a9c6e2 0%,#e9eef0 100%)'
        : 'linear-gradient(180deg,#8fcbf5 0%,#e3f4fd 100%)'
  return (
    <div className="absolute inset-0" style={{ background: sky }} role="application" aria-label={s.map.mapOf}>
      <Canvas shadows dpr={[1, 1.75]} camera={{ position: [0, 78, 92], fov: FOV, near: 1, far: 900 }} gl={{ antialias: true, alpha: true, toneMapping: THREE.NeutralToneMapping }}>
        <Suspense fallback={null}>
          <Atmosphere season={season} time={time} />
          <Island />
          <Lakes />
          <PoolBasin />
          <Roads />
          <Trees />
          <Cabins />
          <Facilities />
          <MarkerDriver selectedId={selected?.id ?? null} />
        </Suspense>
        <CameraRig focus={selected} resetKey={resetKey} onZoomedChange={onZoomedChange} onInteract={onInteract} />
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} screenSpacePanning={false} minDistance={MIN_DISTANCE} maxDistance={400} minPolarAngle={0.2} maxPolarAngle={1.25} />
      </Canvas>
      <MarkerLayer selectedId={selected?.id ?? null} onSelect={onSelect} />
    </div>
  )
}
