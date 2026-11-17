import { Suspense, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useCamp } from '../i18n/CampState'
import { HOTSPOTS } from './hotspots'
import { Atmosphere } from './scene/Atmosphere'
import { Cabins } from './scene/Cabins'
import { Facilities } from './scene/Facilities'
import { Island, Lakes, PoolBasin, Roads } from './scene/Ground'
import { Trees } from './scene/Trees'
import { toWorld, type Pt } from './layout/layout'

type V3 = [number, number, number]
interface Pose { pos: V3; target: V3 }

const w = (p: Pt, y = 0): V3 => {
  const [x, z] = toWorld(p)
  return [x, y, z]
}

/** Camera presets. The default looks north from the south side, matching the printed map. */
const POSES: Record<string, Pose> = {
  overview: { pos: [0, 78, 92], target: [0, 0, 2] },
  top: { pos: [0, 150, 0.01], target: [0, 0, 0] },
  west: { pos: [-38, 24, 26], target: w([220, 430]) },
  east: { pos: [50, 26, 30], target: w([840, 400]) },
  pool: { pos: [10, 14, 14], target: w([620, 450]) },
  kayak: { pos: [46, 16, 14], target: w([930, 380]) },
  dining: { pos: [-14, 10, 33], target: w([406, 570]) },
  cabin: { pos: [-24, 6.5, 21], target: [-36, 0.5, 9] },
}

/** DOM label registry: the render loop positions these every frame. */
const labelEls = new Map<string, HTMLElement>()

/** Projects each hotspot into screen space and moves its DOM label (runs inside <Canvas>). */
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
      const visible = v.z > -1 && v.z < 1 && x > -80 && x < size.width + 80 && y > -40 && y < size.height + 40
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`
      el.style.opacity = visible ? '1' : '0'
      el.style.zIndex = String(Math.max(1, Math.round((1 - v.z) * 5000)))
    }
  })
  return null
}

function LabelLayer() {
  const { t } = useCamp()
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {HOTSPOTS.map((h, i) => (
        <div
          key={h.id}
          ref={(el) => {
            if (el) labelEls.set(h.id, el)
            else labelEls.delete(h.id)
          }}
          className="absolute left-0 top-0 will-change-transform"
          style={{ opacity: 0 }}
        >
          <div
            className={
              h.kind === 'zone'
                ? 'flex items-center whitespace-nowrap rounded-full border border-white/30 bg-pine-900/70 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white backdrop-blur-md'
                : 'flex items-center gap-2 whitespace-nowrap rounded-full border border-white/25 bg-pine-900/75 py-1 pl-1 pr-3 text-xs font-semibold text-white shadow-lg backdrop-blur-md'
            }
          >
            {h.kind === 'place' && (
              <span className="grid h-5 w-5 place-items-center rounded-full bg-cedar text-[10px] font-extrabold text-pine-900">{i + 1}</span>
            )}
            {t(h.name)}
          </div>
        </div>
      ))}
    </div>
  )
}

export function CampMap3D() {
  const pose = useMemo(() => {
    const key = new URLSearchParams(window.location.search).get('view') || 'overview'
    return POSES[key] ?? POSES.overview
  }, [])
  const hideLabels = useMemo(() => new URLSearchParams(window.location.search).get('labels') === '0', [])
  return (
    <div className="absolute inset-0">
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: pose.pos, fov: 32, near: 1, far: 800 }}
      gl={{ antialias: true, toneMapping: THREE.NeutralToneMapping }}
    >
      <Suspense fallback={null}>
        <Atmosphere />
        <Island />
        <Lakes />
        <PoolBasin />
        <Roads />
        <Trees />
        <Cabins />
        <Facilities />
        <LabelDriver />
      </Suspense>
      <OrbitControls makeDefault target={pose.target} enableDamping minDistance={6} maxDistance={170} maxPolarAngle={1.42} />
    </Canvas>
    {!hideLabels && <LabelLayer />}
    </div>
  )
}
