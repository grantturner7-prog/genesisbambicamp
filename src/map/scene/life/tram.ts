import * as THREE from 'three'
import { poi, toWorld } from '../../layout/layout'
import { Mesher, at, ball, bands, box, capsule, cyl, rbox, rod, skinned, spriteTexture } from './geo'
import { closedPath, nearestS, pointAt, speedProfile } from './path'
import { TRAM_ROUTE_PX } from './tramRoute'

/**
 * Waterbird Eco-Safari tram (遊園車), from the venue's photo: a cream six-seat cart with a
 * beige canopy towing four small open carriages in alternating liveries: zebra panels on a
 * green frame under a teal canopy, tiger panels on an orange frame under a yellow canopy.
 *
 * Every vehicle is modelled in its own frame (origin on the road midway between its axles,
 * +X forward) and follows one bone, so the whole train is a single skinned mesh.
 */
const C = {
  cream: '#ebe1c8',
  canopy: '#e2d6b8',
  seat: '#8b7d68',
  dark: '#2b2e30',
  tyre: '#232527',
  hub: '#e6dfcc',
  glass: '#cddde2',
  lamp: '#fff3d2',
  zebraBase: '#f3f1ea',
  zebraStripe: '#222325',
  green: '#2b9370',
  teal: '#2f9d86',
  tigerBase: '#e98a2b',
  tigerStripe: '#231c17',
  orange: '#e0802a',
  yellow: '#edc04c',
  floor: '#6f5a45',
  skin: '#e2b896',
  hair: '#2c2521',
}
const SHIRTS = ['#5f81a6', '#f1eee6', '#7d9a78', '#d9836a', '#e6c66a', '#8a8fa8']

export interface Vehicle {
  /** Distance of the front and rear axle behind the train's reference point (the cart's front axle). */
  front: number
  rear: number
  /** Glow points in the vehicle's frame, lit at dusk: [x, y, z, size, kind] (kind 0 = headlight, 1 = lantern). */
  lamps: [number, number, number, number, number][]
}
/** Wheel radius and width; every vehicle's origin sits on the road surface. */
const WHEEL_R = 0.07
const WHEEL_W = 0.045
/** Coupling gap between vehicles: wide enough for the canopies to clear each other in the turning loop. */
const GAP = 0.2
const CART = { len: 0.84, wheelbase: 0.52 }
const CAR = { len: 0.52, wheelbase: 0.3 }

/** Bends a part upward across its width (z), fixing its normals: y += rise * (1 - (z / half)^2). */
function arch(g: THREE.BufferGeometry, rise: number, half: number): THREE.BufferGeometry {
  const p = g.getAttribute('position')
  const n = g.getAttribute('normal')
  const v = new THREE.Vector3()
  for (let i = 0; i < p.count; i++) {
    const z = p.getZ(i)
    p.setY(i, p.getY(i) + rise * (1 - (z / half) * (z / half)))
    const slope = (-2 * rise * z) / (half * half)
    v.set(n.getX(i), n.getY(i), n.getZ(i))
    v.z -= slope * v.y
    v.normalize()
    n.setXYZ(i, v.x, v.y, v.z)
  }
  return g
}

function wheels(M: Mesher, bone: number, xs: number[], zOut: number, hubColor: string, hi: boolean) {
  for (const x of xs) {
    for (const s of [-1, 1]) {
      const m = at(x, WHEEL_R, s * (zOut - WHEEL_W / 2), 0, Math.PI / 2)
      M.add(cyl(WHEEL_R, WHEEL_R, WHEEL_W, hi ? 12 : 8), C.tyre, m, bone)
      const hub = new THREE.CircleGeometry(WHEEL_R * 0.52, hi ? 10 : 6)
      // disc on the outer face of the tyre
      M.add(hub, hubColor, at(x, WHEEL_R, s * (zOut + 0.002), s > 0 ? 0 : Math.PI), bone)
    }
  }
}

/** Seated figure: torso and head, simple and calm like the scale figures of a model. */
function figure(M: Mesher, bone: number, x: number, y: number, z: number, shirt: string, hi: boolean) {
  const r = 0.036
  M.add(capsule(r, 0.07, hi ? 7 : 6, hi ? 2 : 1), shirt, at(x, y + 0.07, z), bone)
  const headY = y + 0.178
  M.add(ball(0.031, hi ? 8 : 6, hi ? 6 : 4), (_x, py) => (py > headY + 0.006 ? C.hair : C.skin), at(x + 0.004, headY, z), bone)
}

/**
 * Livery panel: `w` wide, `h` high, facing +Z of `m`. Dark stripes over the base colour;
 * zebra stripes are broad and wavy, tiger stripes are narrow and taper to a point.
 */
function liveryPanel(M: Mesher, bone: number, w: number, h: number, m: THREE.Matrix4, kind: 'zebra' | 'tiger', hi: boolean, seed: number) {
  const zebra = kind === 'zebra'
  const stripes = Math.max(2, Math.round((w / 0.52) * (zebra ? (hi ? 7 : 4) : hi ? 6 : 4)))
  const rows = hi ? 3 : 1
  const pitch = 1 / stripes
  const centre = (j: number, v: number) => (j + 0.5) * pitch + pitch * (zebra ? 0.22 : 0.16) * Math.sin(v * (zebra ? 3.4 : 2.2) + j * 1.9 + seed) + pitch * 0.25 * (v - 0.5) * (((j + seed) % 3) - 1)
  const half = (j: number, v: number) => {
    if (zebra) return pitch * (0.24 + 0.06 * Math.sin(v * 5 + j * 2.3 + seed))
    const t = (j + seed) % 2 === 0 ? v : 1 - v // taper from one end
    return pitch * (0.04 + 0.2 * t)
  }
  const edge = (k: number, v: number) => {
    if (k <= 0) return 0
    if (k >= stripes * 2 + 1) return 1
    const j = Math.floor((k - 1) / 2)
    return (k - 1) % 2 === 0 ? centre(j, v) - half(j, v) : centre(j, v) + half(j, v)
  }
  const base = zebra ? C.zebraBase : C.tigerBase
  const stripe = zebra ? C.zebraStripe : C.tigerStripe
  bands(w, h, stripes * 2 + 1, rows, edge).forEach((g, k) => M.add(g, k % 2 === 0 ? base : stripe, m, bone))
}

function cart(M: Mesher, bone: number, hi: boolean): Vehicle {
  const seg = hi ? 2 : 1
  M.add(hi ? rbox(0.8, 0.04, 0.3, 0.012) : box(0.8, 0.04, 0.3), C.dark, at(0, 0.1, 0), bone)
  M.add(rbox(0.84, 0.1, 0.36, 0.032, seg), C.cream, at(0, 0.165, 0), bone)
  // front cowl with the dashboard
  M.add(rbox(0.2, 0.15, 0.34, 0.05, seg), C.cream, at(0.31, 0.262, 0), bone)
  M.add(hi ? rbox(0.03, 0.036, 0.33, 0.012) : box(0.03, 0.036, 0.33), C.dark, at(0.427, 0.118, 0), bone)
  for (const s of [-1, 1]) M.add(ball(0.022, hi ? 8 : 6, hi ? 6 : 4), C.lamp, at(0.408, 0.222, s * 0.115, 0, 0, 0, [0.6, 1, 1]), bone)
  // two benches and the rear deck
  for (const x of [0.06, -0.19]) {
    M.add(hi ? rbox(0.15, 0.055, 0.31, 0.02) : box(0.15, 0.055, 0.31), C.seat, at(x, 0.262, 0), bone)
    M.add(hi ? rbox(0.04, 0.15, 0.31, 0.016) : box(0.04, 0.15, 0.31), C.seat, at(x - 0.088, 0.355, 0, 0, 0, 0.14), bone)
  }
  M.add(hi ? rbox(0.13, 0.05, 0.32, 0.018) : box(0.13, 0.05, 0.32), C.cream, at(-0.35, 0.235, 0), bone)
  // canopy on four struts, windscreen between the front pair
  M.add(arch(rbox(0.78, 0.028, 0.39, 0.013, 1), 0.018, 0.195), C.canopy, at(-0.02, 0.598, 0), bone)
  for (const s of [-1, 1]) {
    const f = rod([0.385, 0.33, s * 0.158], [0.345, 0.594, s * 0.17], 0.009, hi ? 6 : 4)
    M.add(f.g, C.dark, f.m, bone)
    const b = rod([-0.375, 0.21, s * 0.165], [-0.385, 0.594, s * 0.17], 0.009, hi ? 6 : 4)
    M.add(b.g, C.dark, b.m, bone)
  }
  M.add(box(0.006, 0.235, 0.3), C.glass, at(0.366, 0.455, 0, 0, 0, 0.15), bone)
  wheels(M, bone, [CART.wheelbase / 2, -CART.wheelbase / 2], 0.18, C.hub, hi)
  // the driver sits front left
  figure(M, bone, 0.065, 0.285, -0.075, '#3f5d7d', hi)
  if (hi) {
    figure(M, bone, -0.185, 0.285, 0.075, SHIRTS[1], hi)
    figure(M, bone, -0.185, 0.285, -0.08, SHIRTS[3], hi)
  }
  return {
    front: 0,
    rear: CART.wheelbase,
    lamps: [
      [0.435, 0.222, 0.115, 0.26, 0],
      [0.435, 0.222, -0.115, 0.26, 0],
    ],
  }
}

function carriage(M: Mesher, bone: number, kind: 'zebra' | 'tiger', hi: boolean, index: number, front: number): Vehicle {
  const zebra = kind === 'zebra'
  const frame = zebra ? C.green : C.orange
  const roof = zebra ? C.teal : C.yellow
  const L = CAR.len
  const W = 0.36
  const wallH = 0.16
  const y0 = 0.105
  M.add(hi ? rbox(L - 0.02, 0.035, W - 0.07, 0.012) : box(L - 0.02, 0.035, W - 0.07), C.dark, at(0, 0.095, 0), bone)
  M.add(box(L - 0.03, 0.012, W - 0.03), C.floor, at(0, y0 + 0.012, 0), bone)
  // walls: a plain core with the livery on its outer face
  for (const s of [-1, 1]) {
    M.add(box(L, wallH, 0.014), frame, at(0, y0 + wallH / 2, s * (W / 2 - 0.012)), bone)
    liveryPanel(M, bone, L - 0.01, wallH, at(0, y0, s * (W / 2 - 0.001), s > 0 ? 0 : Math.PI), kind, hi, index * 2 + (s > 0 ? 0 : 1))
    M.add(box(0.014, wallH, W - 0.02), frame, at(s * (L / 2 - 0.012), y0 + wallH / 2, 0), bone)
    liveryPanel(M, bone, W - 0.02, wallH, at(s * (L / 2 - 0.001), y0, 0, (s * Math.PI) / 2), kind, hi, index * 2 + 5 + (s > 0 ? 0 : 1))
  }
  // top rail and corner posts in the frame colour
  const yr = y0 + wallH + 0.004
  const rs = hi ? 6 : 4
  for (const s of [-1, 1]) {
    const a = rod([-L / 2, yr, s * (W / 2 - 0.006)], [L / 2, yr, s * (W / 2 - 0.006)], 0.012, rs)
    M.add(a.g, frame, a.m, bone)
    const b = rod([s * (L / 2 - 0.006), yr, -W / 2], [s * (L / 2 - 0.006), yr, W / 2], 0.012, rs)
    M.add(b.g, frame, b.m, bone)
    for (const t of [-1, 1]) {
      const p = rod([s * (L / 2 - 0.012), y0, t * (W / 2 - 0.012)], [s * (L / 2 - 0.012), 0.54, t * (W / 2 - 0.012)], 0.011, rs)
      M.add(p.g, frame, p.m, bone)
    }
  }
  M.add(arch(rbox(L + 0.03, 0.028, W + 0.04, 0.013, 1), 0.02, (W + 0.04) / 2), roof, at(0, 0.548, 0), bone)
  // two benches facing forward
  for (const x of [0.085, -0.125]) {
    M.add(hi ? rbox(0.1, 0.035, W - 0.08, 0.012) : box(0.1, 0.035, W - 0.08), C.seat, at(x, 0.185, 0), bone)
    M.add(box(0.018, 0.1, W - 0.08), C.seat, at(x - 0.058, 0.25, 0, 0, 0, 0.1), bone)
  }
  wheels(M, bone, [CAR.wheelbase / 2, -CAR.wheelbase / 2], W / 2, frame, hi)
  // drawbar to the vehicle in front
  const d = rod([L / 2 - 0.02, 0.085, 0], [L / 2 + GAP + 0.02, 0.085, 0], 0.01, 4)
  M.add(d.g, C.dark, d.m, bone)
  if (hi) {
    const seats: [number, number][] = [
      [0.085, 0.075],
      [0.085, -0.075],
      [-0.125, 0.075],
      [-0.125, -0.075],
    ]
    // a few passengers, not every seat taken
    const taken = [[0, 3], [1], [0, 2], [2, 3]][index % 4]
    taken.forEach((k, i) => figure(M, bone, seats[k][0], 0.2, seats[k][1], SHIRTS[(index * 2 + i) % SHIRTS.length], hi))
  }
  return {
    front,
    rear: front + CAR.wheelbase,
    lamps: [
      [0, 0.5, W / 2 + 0.035, 0.2, 1],
      [0, 0.5, -W / 2 - 0.035, 0.2, 1],
    ],
  }
}

export interface TramModel {
  geometry: THREE.BufferGeometry
  vehicles: Vehicle[]
  /** How far the train reaches ahead of and behind its reference point. */
  ahead: number
  behind: number
}

export function buildTram(hi: boolean): TramModel {
  const M = new Mesher()
  const vehicles: Vehicle[] = [cart(M, 0, hi)]
  // rear end of the cart, measured back from its front axle
  let tail = CART.wheelbase / 2 + CART.len / 2
  const kinds: ('zebra' | 'tiger')[] = ['zebra', 'tiger', 'zebra', 'tiger']
  kinds.forEach((kind, i) => {
    const front = tail + GAP + (CAR.len - CAR.wheelbase) / 2
    vehicles.push(carriage(M, i + 1, kind, hi, i, front))
    tail = front + CAR.wheelbase + (CAR.len - CAR.wheelbase) / 2
  })
  return { geometry: M.build(), vehicles, ahead: (CART.len - CART.wheelbase) / 2, behind: tail }
}

/** Cruising speed in world units per second: an unhurried 11 km/h or so at the map's scale. */
const V_MAX = 0.82
const V_MIN = 0.3

/**
 * The tram and its drive. It is always on its round, one loop of the whole camp: from the
 * tram stop west along the south road, round the west ring, along the waterbird lake, up
 * past the Star Cinema, over the north road and back down past the kayak lake, slowing for
 * the bends and never stopping (about five minutes a lap).
 * Carriages keep both axles on the route, so the train bends through every curve.
 * Its headlights and lanterns are lit at night only.
 */
export function createTram(hi: boolean) {
  const model = buildTram(hi)
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0 })
  const { mesh, bones } = skinned(
    model.geometry,
    mat,
    model.vehicles.map(() => ({ parent: -1, pivot: [0, 0, 0] })),
  )
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.raycast = () => {}

  const path = closedPath(TRAM_ROUTE_PX, 0.05, 6)
  // the route starts just east of the stop, heading west: park with the train centred on it
  const [stopX, stopZ] = toWorld(poi('tramStop'))
  const stopS = nearestS(path, stopX, stopZ, 0, 8) + (model.behind - model.ahead) / 2
  const profile = speedProfile(path, { vMax: V_MAX, aLat: 0.42, acc: 0.12, brake: 0.16, trainLength: model.behind + model.ahead })
  const speedAt = (s: number) => {
    const f = (s / path.step) % path.n
    const i = Math.floor(f)
    return profile[i] + (profile[(i + 1) % path.n] - profile[i]) * (f - i)
  }

  // the headlights' beam on the road ahead (night only)
  const poolTex = spriteTexture(48)
  const poolGeo = new THREE.PlaneGeometry(3.0, 1.3, 10, 1)
  poolGeo.rotateX(-Math.PI / 2)
  {
    // brightest just ahead of the lamps, widening and fading along the road
    const pos = poolGeo.getAttribute('position')
    const col = new Float32Array(pos.count * 3)
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i) / 3.0 + 0.5 // 0 at the cart, 1 at the far end
      pos.setZ(i, pos.getZ(i) * (0.55 + 0.75 * u))
      const k = 1.9 * Math.pow(1 - u, 1.3)
      col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = k
    }
    poolGeo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  }
  const poolMat = new THREE.MeshBasicMaterial({ map: poolTex, color: '#ffd89c', vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })
  const pool = new THREE.Mesh(poolGeo, poolMat)
  pool.renderOrder = 3
  pool.raycast = () => {}
  pool.visible = false

  const lampCount = model.vehicles.reduce((n, v) => n + v.lamps.length, 0)
  /** World position, size and kind of every lamp, refreshed by `update`: x, y, z, size, kind. */
  const lamps = new Float32Array(lampCount * 5)
  const f: [number, number] = [0, 0]
  const r: [number, number] = [0, 0]
  let s = stopS
  let speed = 0
  let parked = false

  function pose(roadY: number) {
    let li = 0
    for (let i = 0; i < model.vehicles.length; i++) {
      const v = model.vehicles[i]
      pointAt(path, s - v.front, f)
      pointAt(path, s - v.rear, r)
      const cx = (f[0] + r[0]) / 2
      const cz = (f[1] + r[1]) / 2
      const yaw = Math.atan2(-(f[1] - r[1]), f[0] - r[0])
      const b = bones[i]
      b.position.set(cx, roadY, cz)
      b.rotation.y = yaw
      const cos = Math.cos(yaw)
      const sin = Math.sin(yaw)
      for (const l of v.lamps) {
        lamps[li++] = cx + l[0] * cos + l[2] * sin
        lamps[li++] = roadY + l[1]
        lamps[li++] = cz - l[0] * sin + l[2] * cos
        lamps[li++] = l[3]
        lamps[li++] = l[4]
      }
      if (i === 0) {
        pool.position.set(cx + 1.7 * cos, roadY + 0.014, cz - 1.7 * sin)
        pool.rotation.y = yaw
      }
    }
  }

  return {
    object: mesh,
    pool,
    lamps,
    path,
    /** Where the train's reference point is along the route, its speed, and whether it is held at the stop (reduced motion). */
    state: () => ({ s, speed, waiting: parked, stopS }),
    setDusk(dusk: boolean) {
      pool.visible = dusk
    },
    update(dt: number, still: boolean, roadY: number) {
      parked = still
      if (still) {
        // reduced motion: a still picture with the tram at its stop
        s = stopS
        speed = 0
      } else {
        speed = Math.max(speedAt(s), V_MIN)
        s = (s + speed * dt) % path.length
      }
      pose(roadY)
    },
    dispose() {
      model.geometry.dispose()
      mat.dispose()
      mesh.skeleton.dispose()
      poolGeo.dispose()
      poolMat.dispose()
      poolTex.dispose()
    },
  }
}
