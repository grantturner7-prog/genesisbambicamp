import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { Star } from 'lucide-react'
import { useCamp } from '../i18n/CampState'
import { HOTSPOTS, type Hotspot } from './hotspots'
import { Icon } from './icons'
import { Atmosphere } from './scene/Atmosphere'
import { Cabins } from './scene/Cabins'
import { Facilities } from './scene/Facilities'
import { Island, Lakes, PoolBasin, Roads } from './scene/Ground'
import { Trees } from './scene/Trees'

const FOV = 32
interface Pose {
  pos: THREE.Vector3
  target: THREE.Vector3
}

/** Whole-camp view. Landscape looks north like the printed map; portrait looks in from the entrance side. */
function overviewPose(aspect: number): Pose {
  const tv = Math.tan(THREE.MathUtils.degToRad(FOV / 2))
  const th = tv * aspect
  if (aspect >= 0.9) {
    const d = THREE.MathUtils.clamp(Math.max(63 / th, 37 / tv), 95, 300)
    return { target: new THREE.Vector3(0, 0, 3), pos: new THREE.Vector3(0, 0.64, 0.77).normalize().multiplyScalar(d).add(new THREE.Vector3(0, 0, 3)) }
  }
  const d = THREE.MathUtils.clamp(Math.max(36 / th, 60 / tv), 120, 330)
  return { target: new THREE.Vector3(0, 0, 1), pos: new THREE.Vector3(0.52, 0.84, 0.14).normalize().multiplyScalar(d).add(new THREE.Vector3(0, 0, 1)) }
}

function focusPose(h: Hotspot): Pose {
  const target = new THREE.Vector3(h.pos[0], 0.4, h.pos[2])
  return { target, pos: new THREE.Vector3(0.16, 0.6, 0.78).normalize().multiplyScalar(h.dist).add(target) }
}

/** Flies the camera to the selected hotspot (or back to the overview). Dragging cancels the flight. */
function CameraRig({ focus, resetKey }: { focus: Hotspot | null; resetKey: number }) {
  const camera = useThree((st) => st.camera)
  const size = useThree((st) => st.size)
  const controls = useThree((st) => st.controls) as unknown as { target: THREE.Vector3; update: () => void; addEventListener: (e: string, f: () => void) => void; removeEventListener: (e: string, f: () => void) => void } | null
  const goal = useRef<Pose | null>(null)
  const snapped = useRef(false)
  const aspect = size.width / Math.max(1, size.height)
  const portrait = aspect < 0.9

  useEffect(() => {
    if (!controls) return
    const g = focus ? focusPose(focus) : overviewPose(aspect)
    if (!snapped.current) {
      camera.position.copy(g.pos)
      controls.target.copy(g.target)
      controls.update()
      snapped.current = true
    } else goal.current = g
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, resetKey, controls, portrait])

  useEffect(() => {
    if (!controls) return
    const stop = () => {
      goal.current = null
    }
    controls.addEventListener('start', stop)
    return () => controls.removeEventListener('start', stop)
  }, [controls])

  useFrame((_, dt) => {
    const g = goal.current
    if (!g || !controls) return
    const k = 1 - Math.exp(-Math.min(dt, 0.05) * 3.6)
    camera.position.lerp(g.pos, k)
    controls.target.lerp(g.target, k)
    controls.update()
    if (camera.position.distanceTo(g.pos) < 0.06) goal.current = null
  })
  return null
}

/** DOM label registry: the render loop positions these every frame. */
const labelEls = new Map<string, HTMLElement>()

function LabelDriver() {
  const camera = useThree((st) => st.camera)
  const size = useThree((st) => st.size)
  const v = useMemo(() => new THREE.Vector3(), [])
  useFrame(() => {
    for (const h of HOTSPOTS) {
      const el = labelEls.get(h.id)
      if (!el) continue
      v.set(h.pos[0], h.pos[1], h.pos[2]).project(camera)
      const x = (v.x * 0.5 + 0.5) * size.width
      const y = (-v.y * 0.5 + 0.5) * size.height
      const visible = v.z > -1 && v.z < 1 && x > -60 && x < size.width + 60 && y > -30 && y < size.height + 30
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`
      el.style.opacity = visible ? '1' : '0'
      el.style.pointerEvents = visible ? 'auto' : 'none'
      el.style.zIndex = String(Math.max(1, Math.round((1 - v.z) * 5000)))
    }
    if (typeof document !== 'undefined') document.documentElement.dataset.mapReady = '1'
  })
  return null
}

function LabelLayer({ selectedId, onSelect }: { selectedId: string | null; onSelect: (id: string) => void }) {
  const { t, s } = useCamp()
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {HOTSPOTS.map((h) => {
        const sel = h.id === selectedId
        const base = 'flex items-center whitespace-nowrap rounded-full border font-semibold shadow-lg backdrop-blur-md transition-[background-color,color,box-shadow] duration-200'
        const tone = sel
          ? 'border-white/70 bg-cedar text-pine-900 ring-4 ring-cedar/30'
          : h.highlight
            ? 'border-amber-200/80 bg-gradient-to-b from-amber-300 to-cedar text-pine-900'
            : 'border-white/25 bg-pine-900/75 text-white hover:bg-pine-800/90'
        return (
          <button
            key={h.id}
            type="button"
            ref={(el) => {
              if (el) labelEls.set(h.id, el)
              else labelEls.delete(h.id)
            }}
            onClick={() => onSelect(h.id)}
            aria-pressed={sel}
            aria-label={t(h.name)}
            data-hotspot={h.id}
            className="absolute left-0 top-0 cursor-pointer pb-2 will-change-transform"
            style={{ opacity: 0 }}
          >
            {h.kind === 'zone' ? (
              <span className={`${base} ${tone} gap-1 px-2.5 py-1 text-[11px] tracking-wide`}>{t(h.name)}</span>
            ) : (
              <span className={`${base} ${tone} gap-1.5 py-1 pl-1 pr-1 text-xs sm:pr-3`}>
                <span className={`relative grid h-6 w-6 place-items-center rounded-full ${sel || h.highlight ? 'bg-pine-900 text-cedar' : 'bg-cedar text-pine-900'}`}>
                  {!sel && <span className="pin-pulse absolute inset-0 rounded-full border-2 border-cedar/70" />}
                  <Icon name={h.icon} size={13} strokeWidth={2.2} />
                </span>
                <span className={sel || h.highlight ? 'pr-2 sm:pr-0' : 'hidden sm:inline'}>{t(h.name)}</span>
                {h.highlight && !sel && (
                  <span className="ml-0.5 mr-1 hidden items-center gap-0.5 rounded-full bg-pine-900/85 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-200 sm:flex">
                    <Star size={9} fill="currentColor" aria-hidden />
                    {s.map.highlight}
                  </span>
                )}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function CampMap3D({ selected, onSelect, resetKey }: { selected: Hotspot | null; onSelect: (id: string) => void; resetKey: number }) {
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
          <LabelDriver />
        </Suspense>
        <CameraRig focus={selected} resetKey={resetKey} />
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={8} maxDistance={340} maxPolarAngle={1.4} />
      </Canvas>
      <LabelLayer selectedId={selected?.id ?? null} onSelect={onSelect} />
    </div>
  )
}
