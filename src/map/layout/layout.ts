import * as THREE from 'three'
import raw from './campLayout.json'

/**
 * One-to-one layout of Bambi Glamping, traced from the official camp map
 * (斑比跳跳營地圖202507). Coordinates in the JSON are map pixels (1200 × 800, y down).
 *
 * World mapping: 1 world unit = 10 map px ≈ 4 m. North is -Z, so the default
 * camera (south of the camp, looking north) shows the same orientation as the
 * printed map: entrance bottom-right, kayak lake right, wild-waterbird lake left.
 */
export type Pt = [number, number]

export interface VanSpot {
  id: string
  zone: 'A' | 'B' | 'D' | 'E' | 'F' | 'G'
  x: number
  y: number
  /** Unit vector (map space) of the side the deck faces. */
  faceX: number
  faceY: number
  waterDist: number
  roadDist: number
}
export interface TreeSpot {
  x: number
  y: number
  r: number
  /** Set only for trees added by hand; traced trees get their species from where they stand. */
  kind?: 'broadleaf' | 'cypress'
}
export interface Layout {
  size: [number, number]
  land: Pt[]
  lakes: { wild: Pt[]; kayak: Pt[]; pool: Pt[] }
  roads: { outer: Pt[]; holes: Pt[][] }[]
  vans: VanSpot[]
  trees: TreeSpot[]
  pois: Record<string, Pt | Pt[] | Record<string, Pt>>
}

export const layout = raw as unknown as Layout

/**
 * Road that the official map draws but covers. The trace stops wherever something is printed
 * over the road, so these short pieces (map px) put the hidden road back:
 *  - two tree crowns stand over the lane round the kayak lake, and the boarding label
 *    overlaps its edge: with them the lane is one circuit again;
 *  - the Star Cinema label (星空電影院) covers the place where the north road comes down to
 *    the road east of the wild lake: with it the roads form one loop round the whole camp.
 */
export const ROAD_LINKS: Pt[][] = [
  [[804, 381], [812, 386], [829, 361], [821, 355]],
  [[1025, 352], [1043, 350], [1053, 387], [1035, 389]],
  [[934, 283], [992, 281], [997, 291], [936, 295]],
  [[607, 283], [618, 297], [576, 331], [558, 350], [553, 364], [538, 360], [530, 338], [560, 317]],
]
/**
 * Trees that are NOT on the official map, added at the client's request: a grove at the north
 * end of the wild waterbird lake, on the bank between the lane and the water and standing in
 * the shallows round the three trees the map draws in the lake. It is the egret roost of the
 * venue's photos (a dense thicket at the water's edge, white with birds) and it is where the
 * egrets settle at night. Map px; crowns stay clear of the lane, the kingfisher's stake and
 * the places where the waders stand.
 */
export const EXTRA_TREES: TreeSpot[] = [
  // on the bank
  { x: 292, y: 251, r: 8, kind: 'broadleaf' },
  { x: 307, y: 251, r: 7, kind: 'broadleaf' },
  { x: 330, y: 254, r: 9, kind: 'broadleaf' },
  { x: 346, y: 259, r: 6.5, kind: 'cypress' },
  { x: 374, y: 258, r: 9, kind: 'broadleaf' },
  { x: 389, y: 269, r: 9, kind: 'broadleaf' },
  { x: 420, y: 269, r: 10, kind: 'broadleaf' },
  // in the shallows, round the two cypresses of the map
  { x: 300, y: 290, r: 12, kind: 'broadleaf' },
  { x: 322, y: 282, r: 10, kind: 'broadleaf' },
  { x: 345, y: 289, r: 12, kind: 'broadleaf' },
  { x: 353, y: 309, r: 10, kind: 'broadleaf' },
  { x: 318, y: 318, r: 11, kind: 'broadleaf' },
  { x: 299, y: 309, r: 8, kind: 'cypress' },
  { x: 285, y: 275, r: 10, kind: 'broadleaf' },
  { x: 365, y: 292, r: 8, kind: 'cypress' },
  { x: 338, y: 328, r: 10, kind: 'broadleaf' },
  { x: 281, y: 297, r: 9, kind: 'broadleaf' },
  // and round the third
  { x: 407, y: 296, r: 10, kind: 'broadleaf' },
  { x: 421, y: 319, r: 10, kind: 'broadleaf' },
  { x: 438, y: 299, r: 8, kind: 'broadleaf' },
]
/** Every tree of the model: the 157 traced from the official map, then the grove. */
export const trees: TreeSpot[] = [...layout.trees, ...EXTRA_TREES]

/** Every piece of road: the traced polygons and the links under the crowns. */
export const roads: Layout['roads'] = [...layout.roads, ...ROAD_LINKS.map((outer) => ({ outer, holes: [] }))]

export const S = 0.1
export const CX = 600
export const CY = 400

export const wx = (px: number) => (px - CX) * S
export const wz = (py: number) => (py - CY) * S
/** Map pixel → world [x, z]. */
export const toWorld = (p: Pt): [number, number] => [wx(p[0]), wz(p[1])]
export const poi = (name: string): Pt => layout.pois[name] as Pt

/** THREE.Shape in XY (to be rotated -90° about X so that shape-Y becomes world -Z). */
export function shapeFrom(poly: Pt[], holes: Pt[][] = []): THREE.Shape {
  const v = (p: Pt) => new THREE.Vector2(wx(p[0]), -wz(p[1]))
  const s = new THREE.Shape(poly.map(v))
  for (const h of holes) s.holes.push(new THREE.Path(h.map(v)))
  return s
}

export function centroid(poly: Pt[]): Pt {
  let x = 0
  let y = 0
  for (const p of poly) {
    x += p[0]
    y += p[1]
  }
  return [x / poly.length, y / poly.length]
}

/** Deterministic PRNG so scenery never shuffles between renders. */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
