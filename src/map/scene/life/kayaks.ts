import * as THREE from 'three'
import type { Pt } from '../../layout/layout'
import { Mesher, at, ball, capsule, loft, rbox, rod, skinned, spriteTexture, type BoneDef, type P3 } from './geo'
import { closedPath, pointAt } from './path'
import { Sprites } from './sprites'

/**
 * Kayaks out on the kayak lake (跳跳船體驗區), as in the venue's photos: yellow sit-on-top
 * boats (one red), paddlers in life vests with dark double-bladed paddles.
 *
 * Each boat is modelled in its own frame (origin on the waterline amidships, +X toward the
 * bow). The hull and the seated paddlers follow the boat's bone; every paddle has a bone of
 * its own, and the arms stretch between the two.
 */
const C = {
  yellow: '#f2c230',
  red: '#d5533b',
  pad: '#3a3d3f',
  paddle: '#26292b',
  legs: '#34404f',
  skin: '#e2b896',
  hair: '#2c2521',
}

export interface KayakSpec {
  /** Closed route in map pixels, always well inside `layout.lakes.kayak`. */
  loop: Pt[]
  seats: number[]
  hull: string
  half: number
  vests: string[]
  shirts: string[]
  hats: string[]
  /** Cruising speed in world units per second, and where on its loop the boat starts (0..1). */
  speed: number
  start: number
  /** Seconds between rests, and the phase of that rhythm (0..1). */
  rhythm: number
  phase: number
  /** Out on the water in summer only. */
  summerOnly?: boolean
}

/**
 * Three boats, each keeping to its own part of the lake so they never meet: the open water
 * in front of the jetty, the west bay, and the south of the main basin. Every loop keeps at
 * least 10 map px (1 world unit) from the shore and 15 px from the jetty.
 */
export const KAYAKS: KayakSpec[] = [
  {
    loop: [[897, 374], [912, 352], [938, 340], [960, 352], [972, 376], [958, 396], [926, 399], [902, 392]],
    seats: [0.13, -0.2],
    hull: C.yellow,
    half: 0.47,
    vests: ['#ef6a22', '#ef6a22'],
    shirts: ['#f1eee6', '#4c6a8c'],
    hats: ['#f1eee6', C.hair],
    speed: 0.34,
    start: 0.08,
    rhythm: 31,
    phase: 0.1,
  },
  {
    loop: [[848, 438], [866, 436], [879, 449], [872, 465], [852, 466], [839, 454]],
    seats: [-0.05],
    hull: C.red,
    half: 0.39,
    vests: ['#f3b21f'],
    shirts: ['#39475a'],
    hats: [C.hair],
    speed: 0.26,
    start: 0.55,
    rhythm: 24,
    phase: 0.6,
    summerOnly: true,
  },
  {
    loop: [[903, 432], [930, 419], [963, 421], [979, 436], [965, 448], [936, 446], [908, 455], [897, 446]],
    seats: [0.13, -0.2],
    hull: C.yellow,
    half: 0.47,
    vests: ['#e9502c', '#ef6a22'],
    shirts: ['#7d9a78', '#f1eee6'],
    hats: [C.hair, '#5f81a6'],
    speed: 0.3,
    start: 0.42,
    rhythm: 37,
    phase: 0.35,
  },
]

export interface KayakRig {
  /** Bone of the boat. */
  bone: number
  /** Bones of its paddles and where each pivots in the boat's frame. */
  paddles: { bone: number; pivot: P3; phase: number }[]
  spec: KayakSpec
}
export interface KayakModel {
  geometry: THREE.BufferGeometry
  rigs: KayakRig[]
  bones: BoneDef[]
}

const DECK = 0.047

function hull(half: number, hi: boolean): THREE.BufferGeometry {
  const K = hi ? 12 : 8
  const st = hi ? [-1, -0.96, -0.86, -0.66, -0.36, 0, 0.36, 0.66, 0.86, 0.96, 1] : [-1, -0.9, -0.55, 0, 0.55, 0.9, 1]
  const rings: P3[][] = st.map((t) => {
    const s = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(t), 2.6)), 0.6) * 0.96 + 0.04
    const ring: P3[] = []
    for (let k = 0; k < K; k++) {
      const a = (k / K) * Math.PI * 2
      const sn = Math.sin(a)
      // flatter deck, rounder bottom; the ends rise a little
      ring.push([t * half, (sn > 0 ? 0.042 : 0.05) * sn * s + 0.005 + t * t * 0.022, -Math.cos(a) * 0.105 * s])
    }
    return ring
  })
  return loft(rings)
}

function paddler(M: Mesher, boat: number, paddle: number, x: number, vest: string, shirt: string, hat: string, hi: boolean): P3 {
  const rad = hi ? 8 : 6
  const cap = hi ? 2 : 1
  // seat pad, legs stretched forward, torso in the vest, head
  M.add(rbox(0.13, 0.012, 0.115, 0.005), C.pad, at(x, DECK + 0.002, 0), boat)
  M.add(capsule(0.02, 0.11, hi ? 7 : 5, cap), C.legs, at(x + 0.095, DECK + 0.02, 0, 0, 0, Math.PI / 2, [1, 1, 1.9]), boat)
  M.add(capsule(0.04, 0.07, rad, cap), vest, at(x + 0.004, DECK + 0.078, 0, 0, 0, -0.09), boat)
  const headY = DECK + 0.184
  M.add(ball(0.031, rad, hi ? 6 : 4), (_x, y) => (y > headY + 0.004 ? hat : C.skin), at(x + 0.014, headY, 0), boat)
  // paddle across the boat in front of the chest
  const pivot: P3 = [x + 0.095, DECK + 0.118, 0]
  const reach = 0.265
  const shaft = rod([pivot[0], pivot[1], -reach], [pivot[0], pivot[1], reach], 0.0065, hi ? 6 : 4)
  M.add(shaft.g, C.paddle, shaft.m, paddle)
  for (const s of [-1, 1]) {
    M.add(ball(1, hi ? 8 : 6, hi ? 5 : 4), C.paddle, at(pivot[0], pivot[1], s * (reach + 0.05), 0, 0, 0, [0.006, 0.034, 0.066]), paddle)
    // the arm stretches from the shoulder (boat) to the hand on the shaft (paddle)
    const sx = x + 0.012
    const hx = pivot[0]
    const arm = rod([sx, DECK + 0.142, s * 0.046], [hx, pivot[1] + 0.004, s * 0.105], 0.013, hi ? 6 : 4, 0.011)
    M.add(arm.g, shirt, arm.m, (px) => [boat, paddle, THREE.MathUtils.clamp((px - sx) / (hx - sx), 0, 1)])
  }
  return pivot
}

export function buildKayaks(hi: boolean): KayakModel {
  const M = new Mesher()
  const rigs: KayakRig[] = []
  const bones: BoneDef[] = []
  for (const spec of KAYAKS) {
    const boat = bones.push({ parent: -1, pivot: [0, 0, 0] }) - 1
    M.add(hull(spec.half, hi), spec.hull, undefined, boat)
    const paddles = spec.seats.map((x, i) => {
      // the paddle's pivot is only known once the paddler is built, so reserve the bone first
      const pb = bones.push({ parent: boat, pivot: [0, 0, 0] }) - 1
      const pivot = paddler(M, boat, pb, x, spec.vests[i], spec.shirts[i], spec.hats[i], hi)
      bones[pb].pivot = pivot
      return { bone: pb, pivot, phase: i * 0.5 }
    })
    rigs.push({ bone: boat, paddles, spec })
  }
  return { geometry: M.build(), rigs, bones }
}

const RINGS = 9
const RING_LIFE = 5.2
const RING_GAP = 0.3
const smooth = (a: number, b: number, x: number) => THREE.MathUtils.smoothstep(x, a, b)

/**
 * The boats and their motion: each follows its loop at an easy pace, paddles dipping left
 * and right, rests now and then and drifts, and leaves a faint trail of widening ripples.
 */
export function createKayaks(hi: boolean) {
  const model = buildKayaks(hi)
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0 })
  const { mesh, bones } = skinned(model.geometry, mat, model.bones)
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.raycast = () => {}
  for (const b of bones) b.rotation.order = 'YXZ'

  const ringTex = spriteTexture(64, 0.74)
  const wake = new Sprites(model.rigs.length * RINGS, ringTex, { additive: true, flat: true, renderOrder: 3 })
  wake.mesh.raycast = () => {}

  const n = model.rigs.length
  const paths = model.rigs.map((r) => closedPath(r.spec.loop, 0.05, 12))
  const s = new Float32Array(n)
  const stroke = new Float32Array(n)
  const sinceRing = new Float32Array(n)
  const nextRing = new Int32Array(n)
  /** x, z, birth time and heading of every ripple (unused ones were born long ago) */
  const rings = new Float32Array(n * RINGS * 4).fill(-1e9)
  /** x, z of every boat, for the checks */
  const where = new Float32Array(n * 2)
  const p: [number, number] = [0, 0]
  const q: [number, number] = [0, 0]
  let t = 0
  let winter = false
  /** After dark nobody is on the water: the boats are ashore on their rack. */
  let night = false
  /** Leaves a ripple at the stern of boat `i` (which is at arc length `at`), as ring `k` of its pool. */
  function drop(i: number, k: number, at: number, birth: number) {
    const half = model.rigs[i].spec.half
    pointAt(paths[i], at - half * 0.85, p)
    pointAt(paths[i], at - half * 0.85 + 0.3, q)
    const o = (i * RINGS + k) * 4
    rings[o] = p[0]
    rings[o + 1] = p[1]
    rings[o + 2] = birth
    rings[o + 3] = Math.atan2(-(q[1] - p[1]), q[0] - p[0])
  }

  model.rigs.forEach((rig, i) => {
    s[i] = rig.spec.start * paths[i].length
    // a trail already lies behind every boat on the first frame (and in the still pose)
    for (let k = 0; k < 6; k++) {
      const age = 0.4 + k * 0.8
      drop(i, k, s[i] - rig.spec.speed * age, -age)
    }
    nextRing[i] = 6
  })

  function drawWake(waterY: number) {
    for (let k = 0; k < n * RINGS; k++) {
      const o = k * 4
      const age = t - rings[o + 2]
      if (night || age > RING_LIFE || (winter && model.rigs[Math.floor(k / RINGS)].spec.summerOnly)) {
        wake.hide(k)
        continue
      }
      // each ripple widens and fades; drawn longer than wide, a string of them reads as a wake
      const u = age / RING_LIFE
      const fade = 0.27 * Math.pow(1 - u, 1.4) * Math.min(1, age / 0.4)
      const width = 0.22 + 0.8 * Math.pow(u, 0.8)
      wake.putFlat(k, rings[o], waterY + 0.012, rings[o + 1], width * 1.55, width, rings[o + 3], 0.86, 0.96, 0.97, fade)
    }
    wake.commit()
  }

  return {
    object: mesh,
    wake: wake.mesh,
    where,
    setEnv(dusk: boolean, isWinter: boolean) {
      night = dusk
      winter = isWinter
    },
    update(dt: number, still: boolean, waterY: number) {
      if (!still) t += dt
      for (let i = 0; i < n; i++) {
        const rig = model.rigs[i]
        const spec = rig.spec
        const path = paths[i]
        const boat = bones[rig.bone]
        // ashore for the night or the season: a bone scaled to nothing draws nothing
        boat.scale.setScalar(night || (spec.summerOnly && winter) ? 0 : 1)
        // paddle for a while, then rest and drift
        const u = (t / spec.rhythm + spec.phase) % 1
        const effort = still ? 1 : smooth(0, 0.07, u) * (1 - smooth(0.74, 0.84, u))
        const pace = 0.22 + 0.78 * effort
        if (!still) {
          const step = spec.speed * pace * dt
          s[i] = (s[i] + step) % path.length
          stroke[i] = (stroke[i] + dt * (1.1 + 1.5 * effort)) % (Math.PI * 2)
          sinceRing[i] += step + dt * 0.06
          if (sinceRing[i] > RING_GAP) {
            sinceRing[i] = 0
            drop(i, nextRing[i], s[i], t)
            nextRing[i] = (nextRing[i] + 1) % RINGS
          }
        }
        pointAt(path, s[i], p)
        pointAt(path, s[i] + 0.4, q)
        where[i * 2] = p[0]
        where[i * 2 + 1] = p[1]
        const ph = still ? 0.9 + i * 1.3 : stroke[i]
        boat.position.set(p[0], waterY + 0.004 * Math.sin(t * 1.6 + i * 2.1), p[1])
        boat.rotation.set(-0.035 * Math.sin(ph) * effort + 0.012 * Math.sin(t * 0.9 + i), Math.atan2(-(q[1] - p[1]), q[0] - p[0]), 0.008 * Math.sin(t * 1.3 + i * 1.7))
        for (const pd of rig.paddles) {
          const a = ph + pd.phase
          // the blade on one side dips and sweeps back, then the other
          bones[pd.bone].rotation.set(0.6 * Math.sin(a) * effort + 0.07 * (1 - effort), 0.34 * Math.cos(a) * effort, 0)
        }
      }
      drawWake(waterY)
    },
    dispose() {
      model.geometry.dispose()
      mat.dispose()
      mesh.skeleton.dispose()
      wake.dispose()
      ringTex.dispose()
    },
  }
}
