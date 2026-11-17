import * as THREE from 'three'
import { layout, mulberry32, poi, toWorld, wx, wz, type Pt } from '../../layout/layout'
import { rgb, spriteTexture } from './geo'
import { Sprites } from './sprites'

const FIREFLIES = 56
const SPARKS = 10
const SMOKE = 16
const SMOKE_LIFE = 8.5

function inside(poly: Pt[], x: number, y: number): boolean {
  let inPoly = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0]
    const yi = poly[i][1]
    const xj = poly[j][0]
    const yj = poly[j][1]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inPoly = !inPoly
  }
  return inPoly
}

/** Places along a lake's margin, from just over the water to a few steps up the bank. */
function margin(poly: Pt[], count: number, rnd: () => number, out: number[]) {
  const cum = [0]
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % poly.length]
    cum.push(cum[i] + Math.hypot(b[0] - a[0], b[1] - a[1]))
  }
  const total = cum[poly.length]
  for (let k = 0; k < count; k++) {
    const s = ((k + rnd() * 0.8) / count) * total
    let i = 0
    while (cum[i + 1] < s) i++
    const a = poly[i]
    const b = poly[(i + 1) % poly.length]
    const t = (s - cum[i]) / (cum[i + 1] - cum[i] || 1)
    const x = a[0] + (b[0] - a[0]) * t
    const y = a[1] + (b[1] - a[1]) * t
    let nx = -(b[1] - a[1])
    let ny = b[0] - a[0]
    const nl = Math.hypot(nx, ny) || 1
    nx /= nl
    ny /= nl
    if (inside(poly, x + nx * 2, y + ny * 2)) {
      nx = -nx
      ny = -ny
    }
    const d = -5 + rnd() * 16 // map px: negative = over the water
    out.push(wx(x + nx * d), 0.22 + rnd() * 0.7, wz(y + ny * d), rnd() * 6.28, 2.6 + rnd() * 3.4)
  }
}

/**
 * Small lights and the campfire's smoke: fireflies along the lake margins on summer
 * evenings, sparks rising from the fire, the tram's lamps. All glow points share one draw
 * call and are bright enough to bloom on the high tier; the smoke is a second one.
 */
export function createAmbient(hi: boolean, lampCount: number) {
  const dot = spriteTexture(64)
  const glowCount = lampCount + (hi ? FIREFLIES + SPARKS : 0)
  const glow = new Sprites(glowCount, dot, { additive: true, renderOrder: 6 })
  glow.mesh.raycast = () => {}
  const smoke = hi ? new Sprites(SMOKE, dot, { additive: false, renderOrder: 5 }) : null
  if (smoke) smoke.mesh.raycast = () => {}

  // fireflies: x, height, z, phase, period
  const flies: number[] = []
  if (hi) {
    const rnd = mulberry32(77)
    margin(layout.lakes.wild, Math.round(FIREFLIES * 0.55), rnd, flies)
    margin(layout.lakes.kayak, FIREFLIES - Math.round(FIREFLIES * 0.55), rnd, flies)
  }
  const [fx, fz] = toWorld(poi('campfire'))
  const warm = rgb('#c49a78')
  const cool = rgb('#8b90a6')
  let t = 0
  let dusk = false
  let summer = true
  // camera position of the current frame, and the distance of a point from it
  let ex = 0
  let ey = 0
  let ez = 0
  const far = (x: number, y: number, z: number) => Math.hypot(x - ex, y - ey, z - ez)

  return {
    glow: glow.mesh,
    smoke: smoke?.mesh ?? null,
    apply(isDusk: boolean, isSummer: boolean) {
      dusk = isDusk
      summer = isSummer
      glow.mesh.visible = dusk
      if (smoke) smoke.mesh.visible = dusk
    },
    /**
     * `eye` is the camera's position: far away, a light keeps a minimum apparent size so the
     * tram's lamps and the fireflies still read as points of light on the full map.
     */
    update(dt: number, still: boolean, camera: THREE.Quaternion, eye: THREE.Vector3, lamps: Float32Array, waterWild: number, waterKayak: number) {
      if (!dusk) return
      if (!still) t += dt
      glow.face(camera)
      ex = eye.x
      ey = eye.y
      ez = eye.z
      let k = 0
      for (let i = 0; i < lampCount; i++) {
        const o = i * 5
        const head = lamps[o + 4] === 0
        const size = Math.max(lamps[o + 3], far(lamps[o], lamps[o + 1], lamps[o + 2]) * (head ? 0.0034 : 0.0024))
        if (head) glow.put(k++, lamps[o], lamps[o + 1], lamps[o + 2], size, 3.6, 3.0, 1.9, 1)
        else glow.put(k++, lamps[o], lamps[o + 1], lamps[o + 2], size, 2.3, 1.5, 0.65, 0.95)
      }
      if (hi) {
        const nWild = Math.round(FIREFLIES * 0.55)
        for (let i = 0; i < FIREFLIES; i++) {
          if (!summer) {
            glow.hide(k++)
            continue
          }
          const o = i * 5
          const ph = flies[o + 3]
          // a slow blink, most of the time dark
          const b = still ? 0.55 : Math.pow(Math.max(0, Math.sin((t / flies[o + 4]) * 6.283 + ph)), 3)
          const x = flies[o] + 0.3 * Math.sin(t * 0.31 + ph)
          const y = (i < nWild ? waterWild : waterKayak) + 0.32 + flies[o + 1] + 0.1 * Math.sin(t * 0.7 + ph)
          const z = flies[o + 2] + 0.3 * Math.cos(t * 0.27 + ph * 1.7)
          glow.put(k++, x, y, z, Math.max(0.1 + 0.07 * b, far(x, y, z) * 0.0024), 2.1, 2.8, 0.8, b)
        }
        for (let i = 0; i < SPARKS; i++) {
          const life = 1.5 + (i % 4) * 0.35
          const age = (t + i * 0.47) % life
          const u = age / life
          const a = i * 2.4 + age * 1.6
          const r = 0.05 + 0.2 * u
          const f = still ? 0.7 : Math.pow(1 - u, 1.4) * Math.min(1, age / 0.1)
          glow.put(k++, fx + r * Math.cos(a), 0.5 + age * (0.5 + (i % 3) * 0.14), fz + r * Math.sin(a), 0.05 + 0.035 * (1 - u), 3.8, 1.8, 0.5, f)
        }
      }
      glow.commit()
      if (smoke) {
        smoke.face(camera)
        for (let i = 0; i < SMOKE; i++) {
          const age = (t + (i / SMOKE) * SMOKE_LIFE) % SMOKE_LIFE
          const u = age / SMOKE_LIFE
          const fade = 0.19 * THREE.MathUtils.smoothstep(u, 0, 0.1) * Math.pow(1 - u, 1.2)
          const sway = 0.1 * Math.sin(age * 0.9 + i * 1.3) * (0.4 + u)
          smoke.put(
            i,
            fx + 0.16 * age * (0.6 + u) + sway,
            0.8 + 0.3 * age + 0.012 * age * age,
            fz - 0.05 * age + sway * 0.6,
            0.24 + 0.11 * age,
            warm[0] + (cool[0] - warm[0]) * Math.min(1, u * 2.2),
            warm[1] + (cool[1] - warm[1]) * Math.min(1, u * 2.2),
            warm[2] + (cool[2] - warm[2]) * Math.min(1, u * 2.2),
            fade,
          )
        }
        smoke.commit()
      }
    },
    dispose() {
      glow.dispose()
      smoke?.dispose()
      dot.dispose()
    },
  }
}
