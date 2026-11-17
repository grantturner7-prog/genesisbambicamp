import type { AreaId, L, Zone } from '../lib/types'
import { centroid, layout, poi, toWorld, type Pt } from './layout/layout'
import type { TabId } from './types'

export interface Hotspot {
  id: string
  name: L
  /** World position [x, y, z] of the floating label. */
  pos: [number, number, number]
  kind: 'place' | 'zone'
  area: AreaId
  zone?: Zone
  /** Panel tab opened on click. */
  tab?: TabId
  /** Featured label styling (camp highlight). */
  highlight?: boolean
  icon: string
  /** Camera distance when focused. */
  dist: number
  /** Photo shown first for this hotspot (defaults to the area's first photo). */
  lead?: string
}

const at = (p: Pt, y: number): [number, number, number] => {
  const [x, z] = toWorld(p)
  return [x, y, z]
}
const zoneLabel = (z: Zone) => (poi('zoneLabels') as unknown as Record<string, Pt>)[z]

/** Hotspots follow the labels printed on Bambi's official camp map, in the same places. */
export const HOTSPOTS: Hotspot[] = [
  { id: 'entrance', name: { en: 'Entrance', zh: '入口' }, pos: at(poi('entrance'), 3.2), kind: 'place', area: 'gate', icon: 'DoorClosed', dist: 26 },
  { id: 'checkin', name: { en: 'Check-in', zh: '報到處' }, pos: at(poi('checkin'), 2.2), kind: 'place', area: 'gate', icon: 'MapPin', dist: 22 },
  { id: 'tram', name: { en: 'Eco-Tram Boarding', zh: '遊園車搭車處' }, pos: at(poi('tramStop'), 2.0), kind: 'place', area: 'tram', icon: 'Bus', dist: 22 },
  { id: 'dining', name: { en: 'Bambi Grand Dining Hall', zh: '斑比大飯店' }, pos: at(poi('dining'), 3.6), kind: 'place', area: 'dining', icon: 'Utensils', dist: 28 },
  { id: 'restroom', name: { en: 'Restrooms · AED', zh: '洗手間・AED' }, pos: at([582, 578], 2.2), kind: 'place', area: 'care', icon: 'HeartPulse', dist: 22 },
  { id: 'pool', name: { en: 'Aurora Pool', zh: '極光戲水池' }, pos: at(centroid(layout.lakes.pool), 1.6), kind: 'place', area: 'pool', icon: 'Waves', dist: 24 },
  { id: 'snack', name: { en: 'Airstream Snack Shop', zh: 'Airstream 點心站' }, pos: at(poi('airstreamSpot'), 2.6), kind: 'place', area: 'pool', tab: 'menu', icon: 'CupSoda', dist: 20, lead: 'pool-airstream' },
  { id: 'campfire', name: { en: 'Campfire Circle', zh: '營火區' }, pos: at(poi('campfire'), 1.9), kind: 'place', area: 'campfire', icon: 'Flame', dist: 22 },
  { id: 'cinema', name: { en: 'Star Cinema', zh: '星空電影院' }, pos: at(poi('cinema'), 3.0), kind: 'place', area: 'cinema', highlight: true, icon: 'Film', dist: 24 },
  { id: 'birds', name: { en: 'Wild Waterbird Lake', zh: '野生水鳥觀賞區' }, pos: at(poi('wildLakeLabel'), 1.8), kind: 'place', area: 'birds', icon: 'Bird', dist: 40 },
  { id: 'kayak', name: { en: 'Kayak Lake', zh: '跳跳船體驗區' }, pos: at(poi('kayakLabel'), 1.8), kind: 'place', area: 'kayak', icon: 'Sailboat', dist: 36 },
  ...(['A', 'B', 'D', 'E', 'F', 'G'] as const).map((z) => ({
    id: `zone-${z}`,
    name: { en: `Zone ${z}`, zh: `${z} 區` },
    pos: at(zoneLabel(z), 1.9),
    kind: 'zone' as const,
    area: 'vans' as const,
    zone: z,
    icon: 'BedDouble',
    dist: 26,
  })),
]

export const HOTSPOT_BY_ID = Object.fromEntries(HOTSPOTS.map((h) => [h.id, h])) as Record<string, Hotspot>
