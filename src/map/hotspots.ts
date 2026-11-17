import type { L } from '../lib/types'
import { centroid, layout, poi, toWorld, type Pt } from './layout/layout'

export interface Hotspot {
  id: string
  name: L
  /** World position [x, y, z] of the floating label. */
  pos: [number, number, number]
  kind: 'place' | 'zone'
}

const at = (p: Pt, y: number): [number, number, number] => {
  const [x, z] = toWorld(p)
  return [x, y, z]
}

/**
 * Hotspots follow the labels printed on Bambi's official camp map, in the same places.
 */
export const HOTSPOTS: Hotspot[] = [
  { id: 'entrance', name: { en: 'Entrance', zh: '入口' }, pos: at(poi('entrance'), 3.4), kind: 'place' },
  { id: 'checkin', name: { en: 'Check-in', zh: '報到處' }, pos: at(poi('checkin'), 2.6), kind: 'place' },
  { id: 'tram', name: { en: 'Tram Boarding', zh: '遊園車搭車處' }, pos: at(poi('tramStop'), 2.2), kind: 'place' },
  { id: 'dining', name: { en: 'Bambi Grand Dining Hall', zh: '斑比大飯店' }, pos: at(poi('dining'), 4.6), kind: 'place' },
  { id: 'restroom', name: { en: 'Restrooms & AED', zh: '洗手間・AED' }, pos: at([582, 578], 2.4), kind: 'place' },
  { id: 'pool', name: { en: 'Aurora Pool', zh: '戲水池' }, pos: at(centroid(layout.lakes.pool), 2.2), kind: 'place' },
  { id: 'snack', name: { en: 'Poolside Snack Shop', zh: '池畔點心站' }, pos: at(poi('airstream'), 2.6), kind: 'place' },
  { id: 'campfire', name: { en: 'Campfire Circle', zh: '營火區' }, pos: at(poi('campfire'), 2.6), kind: 'place' },
  { id: 'cinema', name: { en: 'Star Cinema', zh: '星空電影院' }, pos: at(poi('cinema'), 2.6), kind: 'place' },
  { id: 'birds', name: { en: 'Wild Waterbird Viewing Area', zh: '野生水鳥觀賞區' }, pos: at(poi('wildLakeLabel'), 2.4), kind: 'place' },
  { id: 'kayak', name: { en: 'Kayak Experience (Tiao-Tiao Boats)', zh: '跳跳船體驗區' }, pos: at(poi('kayakLabel'), 2.4), kind: 'place' },
  ...(['A', 'B', 'D', 'E', 'F', 'G'] as const).map((z) => ({
    id: `zone-${z}`,
    name: { en: `Zone ${z}`, zh: `${z} 區` },
    pos: at((poi('zoneLabels') as unknown as Record<string, Pt>)[z], 2.0),
    kind: 'zone' as const,
  })),
]
