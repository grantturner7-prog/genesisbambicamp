import * as THREE from 'three'
import { wx, wz, type Pt } from '../../layout/layout'
import { perchesOn } from '../trees/placement'
import { Mesher, rod, sheet, sweep, skinned, type BoneDef, type P3 } from './geo'

/**
 * Waterbirds of the wild lake (野生水鳥觀賞區), after the venue's photos: white egrets and
 * buff-headed cattle egrets, a grey heron in the shallows where the camp map draws one, and
 * the kingfisher of the map on a stake. A small flock glides a circuit over the open water
 * by day, and at nightfall the egrets fly in from across the camp to roost on the trees
 * round the lake (the venue's photos show them gathered on the treetops).
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
/** A bird of the roost. It has two bodies, one flying and one perched, and shows one at a time. */
export interface Rooster {
  /** Root bone of the flying body, and its wing bones: inner left, outer left, inner right, outer right. */
  fly: number
  wings: [number, number, number, number]
  /** Root and neck bones of the perched body. */
  stand: number
  neck: number
  /** Its place on a tree: world position of its feet. */
  perch: P3
  /** Heading on the perch, in radians. */
  yaw: number
  size: number
  phase: number
  /** Its place in the daytime flock over the lake (`null`: away from the camp by day). */
  flock: { lag: number; side: number; lift: number; winterOnly: boolean } | null
}
export interface BirdModel {
  geometry: THREE.BufferGeometry
  bones: BoneDef[]
  standing: Standing[]
  roost: Rooster[]
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
 * Where the egrets spend the night: trees round the wild lake, named by the map position
 * (px) of their traced crown, with how many birds settle on each (high tier, low tier).
 * The three cypresses that stand in the water take the most, as at a real roost.
 */
const ROOSTS: [number, number, number, number][] = [
  [317, 299, 3, 2],
  [334, 307, 3, 2],
  [423, 303, 3, 2],
  [402, 256, 2, 1],
  [254, 246, 2, 1],
  [442, 457, 2, 1],
  [439, 255, 1, 1],
  [396, 463, 1, 1],
  [484, 342, 1, 1],
  [354, 240, 1, 0],
  [314, 236, 1, 0],
  [471, 266, 1, 0],
  [464, 432, 1, 0],
]
/** The side of a crown that faces the map's usual viewpoint (south): the lower perches are there. */
const TOWARD_VIEWER = Math.PI / 2

/**
 * The daytime flock over the lake: arc lag behind the leader (world units), sideways
 * offset, height offset and size. The last two winter here and fly with it in winter only.
 */
const FLOCK: [number, number, number, number][] = [
  [0, 0, 0, 1],
  [1.5, 0.75, 0.2, 0.94],
  [1.7, -0.8, -0.14, 0.97],
  [3.1, 1.0, 0.3, 0.9],
  [3.6, -0.35, -0.28, 0.95],
  [5.0, 0.6, 0.12, 0.92],
  [5.5, -0.75, -0.06, 0.96],
]
const FLOCK_SUMMER = 5

/**
 * `hi`: every standing bird and the full roost, part of which glides over the lake by day;
 * otherwise the heron, five egrets round the shore, the kingfisher and a smaller roost
 * that is away by day.
 */
export function buildBirds(hi: boolean): BirdModel {
  const M = new Mesher()
  const bones: BoneDef[] = []
  const standing: Standing[] = []
  const roost: Rooster[] = []
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
  // the roost: every bird has a flying body and a perched one, and shows one of them at a time
  const perches: P3[] = []
  for (const [x, y, all, low] of ROOSTS) perches.push(...perchesOn([x, y], hi ? all : low, TOWARD_VIEWER))
  // dealt round the trees, so that neighbours in the air come down on different trees
  const n = perches.length
  const stride = n % 7 === 0 ? 5 : 7
  for (let i = 0; i < n; i++) {
    const fly = bones.push({ parent: -1, pivot: [0, 0, 0] }) - 1
    const w: number[] = []
    for (const s of [-1, 1]) {
      const inner = bones.push({ parent: fly, pivot: [0.02, 0.012, s * SHOULDER_Z] }) - 1
      const outer = bones.push({ parent: inner, pivot: [0, 0.012, s * (SHOULDER_Z + ELBOW_U * SPAN)] }) - 1
      w.push(inner, outer)
    }
    const wings = w as [number, number, number, number]
    flyingBird(M, fly, wings, hi)
    const stand = bones.push({ parent: -1, pivot: [0, 0, 0] }) - 1
    const neck = bones.push({ parent: stand, pivot: NECK_PIVOT }) - 1
    // cattle egrets and egrets roost together here
    standingBird(M, stand, neck, i % 2 ? 'cattle' : 'egret', hi)
    const flock = hi && i < FLOCK.length ? FLOCK[i] : null
    roost.push({
      fly,
      wings,
      stand,
      neck,
      perch: perches[(i * stride) % n],
      yaw: -TOWARD_VIEWER + ((i * 2.399) % 2.4) - 1.2,
      size: flock ? flock[3] : 0.9 + ((i * 0.37) % 0.16),
      phase: i * 1.7,
      flock: flock ? { lag: flock[0], side: flock[1], lift: flock[2], winterOnly: i >= FLOCK_SUMMER } : null,
    })
  }
  return { geometry: M.build(), bones, standing, roost }
}

/** The flock's circuit over the wild lake, in world units: over open water, clear of the trees. */
const CIRCUIT = { cx: wx(390), cz: wz(370), a: 6.6, b: 3.6, rot: 0.26, height: 5.1, speed: 1.25 }
/** How deep the waders stand. */
const WADE = 0.065
/**
 * Birds are drawn about three times life size against the 1:4 buildings, so that they read
 * from the map's viewing distances while staying small accents. Far out on the way to or
 * from the roost they are drawn larger still, so that the flight shows on the full map.
 */
const SCALE = 1.5
const SCALE_FAR = 2.4
/** Cruising speed on a journey, in world units per second. */
const CRUISE = 7.2
/**
 * Where the egrets come from in the evening and leave for in the morning: far outside the
 * camp to the east, north-east and south-east, so that they cross the whole map on the way
 * to the lake. World x, z and height; the share of the roost that uses each; and how long
 * after nightfall its first bird sets out.
 */
const ORIGINS: { x: number; z: number; y: number; share: number; wait: number }[] = [
  { x: 96, z: -4, y: 15, share: 0.5, wait: 0.4 },
  { x: 74, z: -66, y: 17, share: 0.27, wait: 4.4 },
  { x: 84, z: 50, y: 14, share: 0.23, wait: 8 },
]

const enum Mode {
  /** not at the camp: drawn nowhere */
  Away,
  /** gliding the circuit over the lake with the flock */
  Circuit,
  /** on a journey: to its tree, or away from the camp */
  Flight,
  /** closing in on its place in the flock */
  Join,
  /** on its tree */
  Perched,
}

interface Bird {
  mode: Mode
  /** what it has been told to do next (`null`: nothing), and in how many seconds */
  next: Mode | null
  wait: number
  /** the journey in hand: a cubic from p0 (tangent m0) to p1 (tangent m1), its time so far and in all, and what it ends in */
  p0: THREE.Vector3
  m0: THREE.Vector3
  p1: THREE.Vector3
  m1: THREE.Vector3
  t: number
  dur: number
  to: Mode
  /** where it is, how it moves, its heading and its bank */
  pos: THREE.Vector3
  vel: THREE.Vector3
  yaw: number
  bank: number
  /** seconds since it landed */
  settled: number
}

const _a = new THREE.Vector3()
const _b = new THREE.Vector3()
const _c = new THREE.Vector3()

/**
 * The birds and their motion. Waders turn their heads and now and then reach forward. By
 * day part of the flock glides a circuit over the lake. When night falls the egrets come
 * home: skeins fly in from across the camp, the gliding birds peel away, and one by one
 * they settle on the trees round the wild lake, where they stay until morning.
 */
export function createBirds(hi: boolean) {
  const model = buildBirds(hi)
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0, side: THREE.DoubleSide, emissive: '#aebbe6', emissiveIntensity: 0 })
  const { mesh, bones } = skinned(model.geometry, mat, model.bones)
  mesh.castShadow = true
  mesh.receiveShadow = false
  mesh.raycast = () => {}
  for (const r of model.roost) bones[r.fly].rotation.order = 'YXZ'

  const birds: Bird[] = model.roost.map(() => ({
    mode: Mode.Away,
    next: null,
    wait: 0,
    p0: new THREE.Vector3(),
    m0: new THREE.Vector3(),
    p1: new THREE.Vector3(),
    m1: new THREE.Vector3(),
    t: 0,
    dur: 1,
    to: Mode.Away,
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    yaw: 0,
    bank: 0,
    settled: 99,
  }))
  // which origin each bird uses (filled in proportion to the shares) and its place in that skein
  const origin: number[] = []
  const rank: number[] = []
  {
    const counts = ORIGINS.map(() => 0)
    for (let i = 0; i < birds.length; i++) {
      let best = 0
      for (let k = 1; k < ORIGINS.length; k++) if (counts[k] / ORIGINS[k].share < counts[best] / ORIGINS[best].share) best = k
      origin.push(best)
      rank.push(counts[best]++)
    }
  }

  let theta = 0.6
  let t = 0
  let dusk = false
  let winter = false
  let started = false
  let waterY = -0.32

  const airborne = (b: Bird) => b.mode === Mode.Circuit || b.mode === Mode.Flight || b.mode === Mode.Join
  const inFlock = (i: number) => !!model.roost[i].flock && (winter || !model.roost[i].flock!.winterOnly)

  /** A bird's place in the flock now: position into `pos`, velocity into `vel`; returns its bank. */
  function circuit(i: number, pos: THREE.Vector3, vel: THREE.Vector3): number {
    const r = model.roost[i]
    const f = r.flock!
    const c = CIRCUIT
    const th = theta - f.lag / ((c.a + c.b) / 2)
    const cos = Math.cos(th)
    const sin = Math.sin(th)
    const ex = (c.a + f.side) * cos
    const ez = (c.b + f.side) * sin
    const tx = -(c.a + f.side) * sin
    const tz = (c.b + f.side) * cos
    const cr = Math.cos(c.rot)
    const sr = Math.sin(c.rot)
    pos.set(c.cx + ex * cr - ez * sr, waterY + c.height + f.lift + 0.22 * Math.sin(th * 2 + r.phase), c.cz + ex * sr + ez * cr)
    vel.set(tx * cr - tz * sr, 0, tx * sr + tz * cr).normalize().multiplyScalar(c.speed)
    // tighter turns bank more
    const kappa = (c.a * c.b) / Math.pow(c.a * c.a * sin * sin + c.b * c.b * cos * cos, 1.5)
    return Math.min(0.5, 0.1 + kappa * c.speed * c.speed * 1.1)
  }

  /** Where a bird enters or leaves the scene: its origin, spread into a loose line with the others. */
  function gate(i: number, out: THREE.Vector3): THREE.Vector3 {
    const o = ORIGINS[origin[i]]
    const k = rank[i]
    const row = (k + 1) >> 1
    const side = k % 2 ? 1 : -1
    // behind and beside the leader, as seen flying toward the lake
    let dx = CIRCUIT.cx - o.x
    let dz = CIRCUIT.cz - o.z
    const l = Math.hypot(dx, dz) || 1
    dx /= l
    dz /= l
    return out.set(o.x - dx * row * 2.2 - dz * side * row * 1.8, o.y + ((k * 0.61) % 1) * 1.6 - 0.8, o.z - dz * row * 2.2 + dx * side * row * 1.8)
  }

  /** Begins a journey from where the bird is to its tree (`Mode.Perched`) or out of the scene (`Mode.Away`). */
  function depart(i: number, then: Mode.Perched | Mode.Away) {
    const r = model.roost[i]
    const b = birds[i]
    const flying = airborne(b)
    if (b.mode === Mode.Away) gate(i, b.pos)
    b.p0.copy(b.pos)
    if (then === Mode.Perched) b.p1.set(r.perch[0], r.perch[1], r.perch[2])
    else gate(i, b.p1)
    const len = Math.max(0.5, b.p0.distanceTo(b.p1))
    _a.subVectors(b.p1, b.p0).setY(0).normalize()
    // bowed a little to one side, so that no two birds draw the same line
    const bow = (((i * 0.618) % 1) - 0.5) * 0.5
    const cos = Math.cos(bow)
    const sin = Math.sin(bow)
    _b.set(_a.x * cos - _a.z * sin, 0, _a.x * sin + _a.z * cos)
    _c.set(_a.x * cos + _a.z * sin, 0, -_a.x * sin + _a.z * cos)
    if (flying && b.vel.lengthSq() > 1e-6) b.m0.copy(b.vel).setY(0).normalize().multiplyScalar(len * 0.7)
    else if (then === Mode.Perched) b.m0.copy(_b).multiplyScalar(len * 0.9)
    // off the branch: up first, then out
    else b.m0.copy(_b).multiplyScalar(len * 0.3).setY(Math.min(len * 0.3, 10))
    if (then === Mode.Perched) {
      // level at first, then down onto the tree from above
      b.m1.copy(_c).multiplyScalar(len * 0.36).setY(-Math.min(len * 0.24, 9))
      b.dur = len / (CRUISE * (0.93 + ((i * 0.37) % 1) * 0.14)) + 1.4
    } else {
      b.m1.copy(_b).multiplyScalar(len * 0.9)
      b.dur = len / (CRUISE * 1.15) + 1
    }
    b.t = 0
    b.to = then
    b.mode = Mode.Flight
  }

  /** Begins closing in on the bird's place in the flock from where it is. */
  function join(i: number) {
    const b = birds[i]
    if (b.mode === Mode.Away) gate(i, b.pos)
    b.p0.copy(b.pos)
    circuit(i, _a, _b)
    b.dur = THREE.MathUtils.clamp(b.p0.distanceTo(_a) / 5.2, 4, 18)
    b.t = 0
    b.mode = Mode.Join
  }

  /** Tells a bird what to do next, `wait` seconds from now. */
  function tell(i: number, next: Mode.Perched | Mode.Away | Mode.Circuit, wait: number) {
    birds[i].next = next
    birds[i].wait = wait
  }

  /** Puts every bird where it belongs at this hour without any flying (the first daytime view, or reduced motion). */
  function place() {
    model.roost.forEach((r, i) => {
      const b = birds[i]
      b.next = null
      if (dusk) {
        b.mode = Mode.Perched
        b.pos.set(r.perch[0], r.perch[1], r.perch[2])
        b.settled = 99
      } else b.mode = inFlock(i) ? Mode.Circuit : Mode.Away
    })
  }

  function advance(i: number, dt: number) {
    const b = birds[i]
    if (b.next !== null) {
      b.wait -= dt
      if (b.wait <= 0) {
        const next = b.next
        b.next = null
        if (next === Mode.Circuit) join(i)
        else depart(i, next as Mode.Perched | Mode.Away)
      }
    }
    if (b.mode === Mode.Circuit) {
      b.bank = circuit(i, b.pos, b.vel)
    } else if (b.mode === Mode.Join) {
      b.t += dt
      const u = Math.min(1, b.t / b.dur)
      const w = u * u * u * (u * (u * 6 - 15) + 10)
      const bank = circuit(i, _a, _b)
      _c.copy(b.pos)
      b.pos.lerpVectors(b.p0, _a, w)
      // a little climb on the way, so that it leaves its tree upward
      b.pos.y += Math.sin(Math.PI * Math.min(1, u * 1.3)) * 1.2 * (1 - w)
      if (dt > 0) b.vel.subVectors(b.pos, _c).divideScalar(dt)
      b.bank = bank * w
      if (u >= 1) b.mode = Mode.Circuit
    } else if (b.mode === Mode.Flight) {
      b.t += dt
      const landing = b.to === Mode.Perched
      const x = Math.min(1, b.t / b.dur)
      // to the tree: fast at first, braking into it; leaving: slow off the branch, then away
      const u = landing ? 1 - Math.pow(1 - x, 1.35) : Math.pow(x, 1.35)
      const du = (1.35 * Math.pow(landing ? 1 - x : x, 0.35)) / b.dur
      const u2 = u * u
      const u3 = u2 * u
      _c.copy(b.vel)
      b.pos.set(0, 0, 0).addScaledVector(b.p0, 2 * u3 - 3 * u2 + 1).addScaledVector(b.m0, u3 - 2 * u2 + u).addScaledVector(b.p1, -2 * u3 + 3 * u2).addScaledVector(b.m1, u3 - u2)
      b.vel.set(0, 0, 0).addScaledVector(b.p0, 6 * u2 - 6 * u).addScaledVector(b.m0, 3 * u2 - 4 * u + 1).addScaledVector(b.p1, -6 * u2 + 6 * u).addScaledVector(b.m1, 3 * u2 - 2 * u).multiplyScalar(du)
      // bank into the turn
      const h0 = Math.hypot(_c.x, _c.z)
      const h1 = Math.hypot(b.vel.x, b.vel.z)
      const turn = dt > 0 && h0 > 0.05 && h1 > 0.05 ? (_c.x * b.vel.z - _c.z * b.vel.x) / (h0 * h1) / dt : 0
      b.bank += (THREE.MathUtils.clamp(turn * 0.9, -0.55, 0.55) - b.bank) * Math.min(1, dt * 3)
      if (x >= 1) {
        b.mode = b.to
        b.settled = 0
        b.bank = 0
      }
    } else if (b.mode === Mode.Perched) b.settled += dt
    if (Math.hypot(b.vel.x, b.vel.z) > 0.05) b.yaw = Math.atan2(-b.vel.z, b.vel.x)
  }

  function draw(i: number, still: boolean) {
    const r = model.roost[i]
    const b = birds[i]
    const fly = bones[r.fly]
    const stand = bones[r.stand]
    if (b.mode === Mode.Away) {
      // a bone scaled to nothing draws nothing
      fly.scale.setScalar(0)
      stand.scale.setScalar(0)
      return
    }
    if (b.mode === Mode.Perched) {
      fly.scale.setScalar(0)
      // settles with a little bob as it folds its wings
      const bob = b.settled < 0.7 ? 0.05 * Math.sin((b.settled / 0.7) * Math.PI) : 0
      stand.position.set(b.pos.x, b.pos.y + bob, b.pos.z)
      stand.rotation.y = r.yaw
      stand.scale.setScalar(r.size * SCALE)
      // looks about now and then, less and less as the night goes on
      const calm = THREE.MathUtils.clamp(1.2 - b.settled / 40, 0.25, 1)
      bones[r.neck].rotation.set(0, still ? 0.25 * Math.sin(r.phase) : calm * (0.34 * Math.sin(t * 0.19 + r.phase) + 0.1 * Math.sin(t * 0.57 + r.phase * 2)), 0)
      return
    }
    stand.scale.setScalar(0)
    const journey = b.mode === Mode.Flight
    const x = journey ? Math.min(1, b.t / b.dur) : 0
    // at the tree: the last moments of a landing, the first of a take-off
    let near = 0
    if (journey) near = b.to === Mode.Perched ? THREE.MathUtils.smoothstep(x, 0.9, 1) : 1 - THREE.MathUtils.smoothstep(b.t, 0, 1.1)
    else if (b.mode === Mode.Join) near = 1 - THREE.MathUtils.smoothstep(b.t, 0, 1.3)
    // far out: drawn larger
    const far = journey ? (b.to === Mode.Perched ? 1 - THREE.MathUtils.smoothstep(x, 0.4, 0.9) : THREE.MathUtils.smoothstep(x, 0.1, 0.6)) : 0
    const speed = Math.hypot(b.vel.x, b.vel.z)
    const climb = Math.atan2(b.vel.y, Math.max(0.2, speed))
    fly.position.copy(b.pos)
    fly.scale.setScalar(r.size * (SCALE + (SCALE_FAR - SCALE) * far))
    fly.rotation.set(b.bank, b.yaw, THREE.MathUtils.clamp(climb * 0.6, -0.4, 0.5) + 0.5 * near + 0.03 * Math.sin(t * 0.8 + r.phase))
    // in the flock: a few slow beats, then a glide; on a journey: steady beats; at the tree: quick, deep ones
    let effort: number
    let rate: number
    if (b.mode === Mode.Circuit) {
      const cyc = ((t + r.phase * 1.9) % 7.5) / 7.5
      effort = still ? 0 : THREE.MathUtils.smoothstep(cyc, 0, 0.06) * (1 - THREE.MathUtils.smoothstep(cyc, 0.3, 0.4))
      rate = 7.6
    } else {
      effort = 0.86 + 0.5 * near
      rate = 7.2 + 5 * near
    }
    const beat = still ? 0.7 + r.phase : t * rate + r.phase
    const amp = 0.62 * effort
    const up = Math.sin(beat)
    fly.position.y -= 0.035 * amp * up
    const inner = 0.12 + amp * up + 0.3 * near + 0.05 * Math.sin(t * 0.6 + r.phase) * (1 - Math.min(1, effort))
    const outer = -0.1 + 0.8 * amp * Math.sin(beat - 1.0)
    bones[r.wings[0]].rotation.x = inner
    bones[r.wings[1]].rotation.x = outer
    bones[r.wings[2]].rotation.x = -inner
    bones[r.wings[3]].rotation.x = -outer
  }

  return {
    object: mesh,
    /**
     * Follows the hour and the season. The first time, by day, everything is simply in its
     * place; at night the evening return plays, so that a visitor who arrives after dark
     * sees it too. `still` (reduced motion) never flies anything anywhere.
     */
    setEnv(isDusk: boolean, isWinter: boolean, still: boolean) {
      const first = !started
      const nightfall = isDusk && (first || !dusk)
      const morning = !isDusk && dusk && !first
      const turned = isWinter !== winter && !first
      dusk = isDusk
      winter = isWinter
      started = true
      mat.emissiveIntensity = dusk ? 0.22 : 0
      if (still || (first && !dusk)) return place()
      if (nightfall) {
        // home to the roost: the skeins from across the camp, the flock from over the lake
        let peel = 0
        birds.forEach((b, i) => {
          if (b.mode === Mode.Perched || (b.mode === Mode.Flight && b.to === Mode.Perched)) b.next = null
          else if (b.mode === Mode.Away) tell(i, Mode.Perched, (first ? 1.6 : 0) + ORIGINS[origin[i]].wait + rank[i] * 0.24)
          else if (b.mode === Mode.Flight) tell(i, Mode.Perched, 0)
          else tell(i, Mode.Perched, 1 + peel++ * 1.4)
        })
      } else if (morning) {
        // the flock takes to the air over the lake again; the others leave for the fields
        birds.forEach((b, i) => {
          const lift = b.mode === Mode.Perched ? 0.4 + ((i * 0.77) % 1) * 5.5 : 0
          if (inFlock(i)) {
            // already with the flock: forget any order to roost that had not begun
            if (b.mode === Mode.Circuit || b.mode === Mode.Join) b.next = null
            else tell(i, Mode.Circuit, lift)
          } else if (b.mode === Mode.Away) b.next = null
          else tell(i, Mode.Away, lift)
        })
      } else if (turned && !dusk) {
        // the wintering egrets arrive with the cold and leave with it
        birds.forEach((b, i) => {
          if (!model.roost[i].flock?.winterOnly) return
          if (winter) {
            if (b.mode !== Mode.Circuit && b.mode !== Mode.Join) tell(i, Mode.Circuit, 0.5 + i * 0.4)
          } else if (b.mode !== Mode.Away) tell(i, Mode.Away, 0)
          else b.next = null
        })
      }
    },
    /** How many of the roost are on their trees, on a journey, and in all. */
    census() {
      let perched = 0
      let flying = 0
      for (const b of birds) {
        if (b.mode === Mode.Perched) perched++
        else if (b.mode === Mode.Flight || b.mode === Mode.Join) flying++
      }
      return { perched, flying, total: birds.length }
    },
    update(dt: number, still: boolean, lakeY: number) {
      waterY = lakeY
      if (still) {
        // reduced motion: a still picture, every bird where it belongs at this hour
        if (birds.some((b) => b.next !== null || b.mode === Mode.Flight || b.mode === Mode.Join)) place()
      } else {
        t += dt
        const c = CIRCUIT
        const sin = Math.sin(theta)
        const cos = Math.cos(theta)
        theta = (theta + (c.speed * dt) / Math.sqrt(c.a * c.a * sin * sin + c.b * c.b * cos * cos)) % (Math.PI * 2)
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
      for (let i = 0; i < birds.length; i++) {
        const b = birds[i]
        if (!still) advance(i, dt)
        else if (b.mode === Mode.Circuit) {
          b.bank = circuit(i, b.pos, b.vel)
          b.yaw = Math.atan2(-b.vel.z, b.vel.x)
        }
        draw(i, still)
      }
    },
    dispose() {
      model.geometry.dispose()
      mat.dispose()
      mesh.skeleton.dispose()
    },
  }
}
