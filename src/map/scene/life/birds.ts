import * as THREE from 'three'
import { wx, wz, type Pt } from '../../layout/layout'
import { Mesher, rod, sheet, sweep, skinned, type BoneDef, type P3 } from './geo'

/**
 * Waterbirds of the wild lake (野生水鳥觀賞區), after the venue's photos: white egrets and
 * buff-headed cattle egrets, a grey heron in the shallows where the camp map draws one, and
 * the kingfisher of the map on a stake. A small flock glides a circuit over the open water.
 *
 */
const C = {
  white: '#f5f3ea',
  buff: '#e8bc8c',
  grey: '#8f9aa3',
  greyLight: '#e4e5e0',
  bill: '#e6a631',
  leg: '#2b2b29',
  legHeron: '#7d7355',
  stake: '#6b5a47',
  teal: '#1c8aa3',
  rust: '#de7b34',
}

type Kind = 'egret' | 'cattle' | 'heron'

export interface Standing {
  /** Where it stands, in map pixels (inside `layout.lakes.wild`, a few px from the shore). */
  at: Pt
  kind: Kind | 'kingfisher'
  /** Heading in radians (0 = facing +X / east, counter-clockwise seen from above). */
  yaw: number
  size: number
  root: number
  /** Bone of the neck and head, or -1. */
  neck: number
}
export interface Flyer {
  root: number
  /** inner left, outer left, inner right, outer right */
  wings: [number, number, number, number]
  /** Which circuit it flies: the gliding flock, or the pair that crosses low at dusk. */
  group: 'flock' | 'low'
  /** Arc lag behind the leader (world units), sideways offset and height offset. */
  lag: number
  side: number
  lift: number
  size: number
  phase: number
  /** Egrets that winter here: they join the flock in winter only. */
  winterOnly: boolean
}
export interface BirdModel {
  geometry: THREE.BufferGeometry
  bones: BoneDef[]
  standing: Standing[]
  flying: Flyer[]
}

const NECK_PIVOT: P3 = [0.07, 0.322, 0]

function standingBird(M: Mesher, root: number, neck: number, kind: Kind, hi: boolean) {
  const sides = hi ? 8 : 6
  const body: [number, number, number, number][] = [
    [-0.132, 0.203, 0.004, 0.006],
    [-0.09, 0.214, 0.026, 0.022],
    [-0.04, 0.235, 0.046, 0.04],
    [0.01, 0.262, 0.05, 0.043],
    [0.05, 0.292, 0.04, 0.034],
    [0.072, 0.325, 0.024, 0.021],
    [0.085, 0.36, 0.015, 0.014],
    [0.08, 0.395, 0.012, 0.012],
    [0.066, 0.425, 0.0115, 0.0115],
    [0.062, 0.452, 0.012, 0.012],
    [0.072, 0.475, 0.015, 0.014],
    [0.092, 0.486, 0.017, 0.015],
    [0.112, 0.484, 0.01, 0.009],
  ]
  const paint =
    kind === 'heron'
      ? (x: number, y: number) => (y < 0.318 ? C.grey : y > 0.488 && x < 0.1 ? '#3b4147' : C.greyLight)
      : kind === 'cattle'
        ? (x: number, y: number) => (y > 0.31 || (x > 0.035 && y > 0.262) ? C.buff : C.white)
        : () => C.white
  // the neck bends smoothly: weights run from the body to the neck bone along its lower part
  M.add(sweep(hi ? body : body.filter((_, i) => i !== 7 && i !== 9), sides), paint, undefined, (_x, y) => [root, neck, THREE.MathUtils.smoothstep(y, 0.325, 0.4)])
  const bill = rod([0.114, 0.484, 0], [0.19, 0.473, 0], 0.0065, hi ? 6 : 4, 0.0012)
  M.add(bill.g, C.bill, bill.m, neck)
  const leg = kind === 'heron' ? C.legHeron : C.leg
  for (const s of [-1, 1]) {
    if (hi) {
      const a = rod([-0.004, -0.02, s * 0.015], [0.012, 0.1, s * 0.015], 0.0048, 4)
      const b = rod([0.012, 0.1, s * 0.015], [-0.012, 0.212, s * 0.013], 0.0052, 4)
      M.add(a.g, leg, a.m, root)
      M.add(b.g, leg, b.m, root)
    } else {
      const a = rod([0.002, -0.02, s * 0.015], [-0.008, 0.212, s * 0.013], 0.0055, 4)
      M.add(a.g, leg, a.m, root)
    }
  }
}

function kingfisher(M: Mesher, root: number, hi: boolean) {
  const stake = rod([0, -0.6, 0], [0.004, 0.425, 0], 0.013, hi ? 6 : 5, 0.01)
  M.add(stake.g, C.stake, stake.m, root)
  const body: [number, number, number, number][] = [
    [-0.062, 0.428, 0.003, 0.008],
    [-0.03, 0.445, 0.016, 0.016],
    [0, 0.463, 0.024, 0.022],
    [0.022, 0.486, 0.02, 0.019],
    [0.031, 0.506, 0.017, 0.016],
    [0.043, 0.512, 0.008, 0.008],
  ]
  M.add(sweep(body, hi ? 8 : 6), (x, y) => (x > 0.004 && y < 0.492 && y < 0.452 + x * 1.9 ? C.rust : C.teal), undefined, root)
  const bill = rod([0.044, 0.512, 0], [0.098, 0.506, 0], 0.005, 4, 0.001)
  M.add(bill.g, '#2a2d30', bill.m, root)
}

const SHOULDER_Z = 0.018
const SPAN = 0.385
const ELBOW_U = 0.5

function flyingBird(M: Mesher, root: number, wings: [number, number, number, number], hi: boolean) {
  const sides = hi ? 8 : 6
  const body: [number, number, number, number][] = [
    [-0.152, 0, 0.003, 0.012],
    [-0.11, 0.002, 0.014, 0.027],
    [-0.05, 0, 0.032, 0.036],
    [0.01, 0, 0.037, 0.038],
    [0.06, 0.004, 0.031, 0.03],
    [0.095, 0.013, 0.024, 0.02],
    [0.118, 0.021, 0.016, 0.014],
    [0.138, 0.021, 0.015, 0.013],
    [0.156, 0.017, 0.008, 0.007],
  ]
  M.add(sweep(body, sides), C.white, undefined, root)
  const bill = rod([0.158, 0.017, 0], [0.228, 0.008, 0], 0.0055, hi ? 5 : 4, 0.001)
  M.add(bill.g, C.bill, bill.m, root)
  for (const s of [-1, 1]) {
    const leg = rod([-0.1, -0.012, s * 0.01], [-0.275, -0.02, s * 0.008], 0.0042, 4, 0.003)
    M.add(leg.g, C.leg, leg.m, root)
  }
  const us = hi ? [0, 0.1, 0.26, 0.42, 0.6, 0.78, 0.92, 1] : [0, 0.1, 0.42, 0.6, 0.85, 1]
  const vs = hi ? [0, 0.3, 0.65, 1] : [0, 0.5, 1]
  ;[-1, 1].forEach((s, side) => {
    const inner = wings[side * 2]
    const outer = wings[side * 2 + 1]
    const grid: P3[][] = us.map((u) => {
      const le = 0.058 - 0.05 * Math.pow(u, 2.2)
      const chord = 0.128 * (1 - 0.28 * u) * Math.sqrt(Math.max(0, 1 - Math.pow(u, 6))) + 0.006
      return vs.map((v): P3 => [le - v * chord, 0.012 + 0.013 * Math.sin(Math.PI * Math.min(1, v * 1.15)) * (1 - 0.6 * u), s * (SHOULDER_Z + u * SPAN)])
    })
    M.add(sheet(grid), C.white, undefined, (_x, _y, z) => {
      const u = (Math.abs(z) - SHOULDER_Z) / SPAN
      if (u < 0.1) return [root, inner, Math.max(0, u / 0.1)]
      if (u < ELBOW_U - 0.08) return [inner, inner, 0]
      if (u < ELBOW_U + 0.1) return [inner, outer, (u - (ELBOW_U - 0.08)) / 0.18]
      return [outer, outer, 0]
    })
  })
}

/** Standing places in the shallows, nearest the default camera first. */
const SPOTS: { at: Pt; kind: Standing['kind']; yaw: number; size: number; low?: boolean }[] = [
  { at: [397, 441], kind: 'heron', yaw: 0.5, size: 1.28, low: true },
  { at: [437, 440], kind: 'egret', yaw: 2.5, size: 1, low: true },
  { at: [473, 417], kind: 'egret', yaw: 2.9, size: 1.04, low: true },
  { at: [470, 300], kind: 'egret', yaw: 2.2, size: 0.96, low: true },
  { at: [366, 272], kind: 'cattle', yaw: -1.3, size: 0.82, low: true },
  { at: [268, 338], kind: 'egret', yaw: -0.4, size: 1, low: true },
  { at: [375, 325], kind: 'kingfisher', yaw: -0.5, size: 1, low: true },
  { at: [421, 457], kind: 'egret', yaw: 1.2, size: 0.92 },
  { at: [444, 434], kind: 'cattle', yaw: 3.6, size: 0.8 },
  { at: [345, 438], kind: 'egret', yaw: 0.2, size: 0.96 },
]

/**
 * `hi`: every standing bird plus the flock and the dusk pair; otherwise the heron, five
 * egrets around the shore and the kingfisher only.
 */
export function buildBirds(hi: boolean): BirdModel {
  const M = new Mesher()
  const bones: BoneDef[] = []
  const standing: Standing[] = []
  const flying: Flyer[] = []
  for (const spot of SPOTS) {
    if (!hi && !spot.low) continue
    const root = bones.push({ parent: -1, pivot: [0, 0, 0] }) - 1
    if (spot.kind === 'kingfisher') {
      kingfisher(M, root, hi)
      standing.push({ at: spot.at, kind: spot.kind, yaw: spot.yaw, size: spot.size, root, neck: -1 })
    } else {
      const neck = bones.push({ parent: root, pivot: NECK_PIVOT }) - 1
      standingBird(M, root, neck, spot.kind, hi)
      standing.push({ at: spot.at, kind: spot.kind, yaw: spot.yaw, size: spot.size, root, neck })
    }
  }
  if (hi) {
    const flock: [number, number, number, number][] = [
      [0, 0, 0, 1],
      [1.5, 0.75, 0.2, 0.94],
      [1.7, -0.8, -0.14, 0.97],
      [3.1, 1.0, 0.3, 0.9],
      [3.6, -0.35, -0.28, 0.95],
      // winter only
      [5.0, 0.6, 0.12, 0.92],
      [5.5, -0.75, -0.06, 0.96],
    ]
    const low: [number, number, number, number][] = [
      [0, 0, 0, 1],
      [1.9, 0.5, 0.12, 0.95],
    ]
    const addFlyer = (group: Flyer['group'], [lag, side, lift, size]: [number, number, number, number], i: number) => {
      const root = bones.push({ parent: -1, pivot: [0, 0, 0] }) - 1
      const w: number[] = []
      for (const s of [-1, 1]) {
        const inner = bones.push({ parent: root, pivot: [0.02, 0.012, s * SHOULDER_Z] }) - 1
        const outer = bones.push({ parent: inner, pivot: [0, 0.012, s * (SHOULDER_Z + ELBOW_U * SPAN)] }) - 1
        w.push(inner, outer)
      }
      const wings = w as [number, number, number, number]
      flyingBird(M, root, wings, hi)
      flying.push({ root, wings, group, lag, side, lift, size, phase: i * 1.7 + (group === 'low' ? 0.6 : 0), winterOnly: group === 'flock' && i >= 5 })
    }
    flock.forEach((f, i) => addFlyer('flock', f, i))
    low.forEach((f, i) => addFlyer('low', f, i))
  }
  return { geometry: M.build(), bones, standing, flying }
}

/** Circuits over the wild lake, in world units; both stay over open water, clear of the trees. */
const CIRCUITS = {
  /** the gliding flock, high over the middle of the lake */
  flock: { cx: wx(390), cz: wz(370), a: 6.6, b: 3.6, rot: 0.26, height: 5.1, speed: 1.25 },
  /** the pair that crosses low over the water at dusk */
  low: { cx: wx(388), cz: wz(372), a: 7.8, b: 2.2, rot: 0.2, height: 0.95, speed: 1.2 },
}
const GROUPS = ['flock', 'low'] as const
/** How deep the waders stand. */
const WADE = 0.065
/**
 * Birds are drawn about three times life size against the 1:4 buildings, so that they read
 * from the map's viewing distances while staying small accents.
 */
const SCALE = 1.5

/**
 * The birds and their motion: waders turn their heads and now and then reach forward, the
 * flock glides its circuit with a few slow wingbeats, and at dusk two egrets cross low.
 */
export function createBirds(hi: boolean) {
  const model = buildBirds(hi)
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0, side: THREE.DoubleSide })
  const { mesh, bones } = skinned(model.geometry, mat, model.bones)
  mesh.castShadow = true
  mesh.receiveShadow = false
  mesh.raycast = () => {}
  for (const f of model.flying) bones[f.root].rotation.order = 'YXZ'

  const theta = { flock: 0.6, low: 2.4 }
  let t = 0
  let dusk = false
  let winter = false

  function fly(f: Flyer, waterY: number, still: boolean) {
    const c = CIRCUITS[f.group]
    const root = bones[f.root]
    if ((f.group === 'low' && !dusk) || (f.winterOnly && !winter)) {
      // not out now: a bone scaled to nothing draws nothing
      root.scale.setScalar(0)
      return
    }
    const th = theta[f.group] - f.lag / ((c.a + c.b) / 2)
    const cos = Math.cos(th)
    const sin = Math.sin(th)
    const ex = (c.a + f.side) * cos
    const ez = (c.b + f.side) * sin
    const tx = -(c.a + f.side) * sin
    const tz = (c.b + f.side) * cos
    const cr = Math.cos(c.rot)
    const sr = Math.sin(c.rot)
    const dx = tx * cr - tz * sr
    const dz = tx * sr + tz * cr
    // flap a few slow beats, then glide; the low pair flaps all the way
    const beat = still ? 0.7 + f.phase : t * (f.group === 'low' ? 6.6 : 7.6) + f.phase
    const cyc = ((t + f.phase * 1.9) % 7.5) / 7.5
    const effort = still ? 0 : f.group === 'low' ? 0.85 : THREE.MathUtils.smoothstep(cyc, 0, 0.06) * (1 - THREE.MathUtils.smoothstep(cyc, 0.3, 0.4))
    const amp = 0.62 * effort
    const up = Math.sin(beat)
    // tighter turns bank more
    const kappa = (c.a * c.b) / Math.pow(c.a * c.a * sin * sin + c.b * c.b * cos * cos, 1.5)
    root.position.set(c.cx + ex * cr - ez * sr, waterY + c.height + f.lift + 0.22 * Math.sin(th * 2 + f.phase) - 0.035 * amp * up, c.cz + ex * sr + ez * cr)
    root.rotation.set(Math.min(0.5, 0.1 + kappa * c.speed * c.speed * 1.1), Math.atan2(-dz, dx), 0.03 * Math.sin(t * 0.8 + f.phase))
    root.scale.setScalar(f.size * SCALE)
    const inner = 0.12 + amp * up + 0.05 * Math.sin(t * 0.6 + f.phase) * (1 - effort)
    const outer = -0.1 + 0.8 * amp * Math.sin(beat - 1.0)
    bones[f.wings[0]].rotation.x = inner
    bones[f.wings[1]].rotation.x = outer
    bones[f.wings[2]].rotation.x = -inner
    bones[f.wings[3]].rotation.x = -outer
  }

  return {
    object: mesh,
    setEnv(isDusk: boolean, isWinter: boolean) {
      dusk = isDusk
      winter = isWinter
    },
    update(dt: number, still: boolean, waterY: number) {
      if (!still) {
        t += dt
        for (const g of GROUPS) {
          const c = CIRCUITS[g]
          const sin = Math.sin(theta[g])
          const cos = Math.cos(theta[g])
          theta[g] = (theta[g] + (c.speed * dt) / Math.sqrt(c.a * c.a * sin * sin + c.b * c.b * cos * cos)) % (Math.PI * 2)
        }
      }
      for (let i = 0; i < model.standing.length; i++) {
        const b = model.standing[i]
        const root = bones[b.root]
        root.position.set(wx(b.at[0]), b.kind === 'kingfisher' ? waterY : waterY - WADE * b.size * SCALE, wz(b.at[1]))
        root.rotation.y = b.yaw
        root.scale.setScalar(b.size * SCALE)
        if (b.neck < 0) continue
        const neck = bones[b.neck]
        const ph = i * 2.4
        if (still) {
          neck.rotation.set(0, 0.28 * Math.sin(ph * 1.3), 0)
        } else {
          // look about slowly; every so often reach forward toward the water
          const cycle = 13 + (i % 3) * 5
          const u = ((t + ph * 3) % cycle) / cycle
          const reach = u < 0.16 ? Math.pow(Math.sin((Math.PI * u) / 0.16), 2) : 0
          neck.rotation.set(0, 0.3 * Math.sin(t * 0.21 + ph) + 0.1 * Math.sin(t * 0.63 + ph * 2), -0.5 * reach)
        }
      }
      for (const f of model.flying) fly(f, waterY, still)
    },
    dispose() {
      model.geometry.dispose()
      mat.dispose()
      mesh.skeleton.dispose()
    },
  }
}
