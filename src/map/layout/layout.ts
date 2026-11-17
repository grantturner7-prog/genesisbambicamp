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
