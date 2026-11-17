import type { Season, TimeOfDay } from '../../lib/types'

/**
 * Shared scene contract. Every scene layer (Terrain, Trees, Cabins, Facilities, Life)
 * receives one `env` prop and styles itself from it, so the layers stay independent.
 */
export type Quality = 'high' | 'low'

export interface SceneEnv {
  season: Season
  time: TimeOfDay
  /** 'high': desktop-class GPU (ambient occlusion, bloom, soft shadows). 'low': phones and weak GPUs. */
  quality: Quality
}

export const isDusk = (e: SceneEnv) => e.time === 'dusk'
export const isWinter = (e: SceneEnv) => e.season === 'winter'

/**
 * ART DIRECTION: a finely made architectural model of the camp in late-afternoon light.
 * Smooth, softly lit forms (no faceted low-poly look), natural greens, warm cedar and cream
 * buildings with charcoal trim, glassy water, and warm practical lights at dusk.
 * Brand anchors: pine #1B4332, cedar gold #D4A373, parchment #FAF7F2.
 */
export const PALETTE = {
  // lawn and planting
  lawn: '#6fa24a',
  lawnWinter: '#86a05c',
  lawnDark: '#4f8a3c',
  meadowStripe: '#7fb155',
  forestFloor: '#4d7a3e',
  canopy: '#2f5d3a', // woodland outside the camp
  canopyDeep: '#234a30',
  // trees
  leaf: '#4c9447',
  leafLight: '#6bb05a',
  leafDark: '#33743b',
  palm: '#4f9d52',
  pine: '#2f6b47',
  cypress: '#4a8f4f',
  cypressWinter: '#c06a2c', // bald cypress turns copper in winter
  trunk: '#7a5a3f',
  // ground materials
  road: '#d9c9a0',
  roadEdge: '#c2b083',
  sand: '#e8d9b0',
  soil: '#8a6a49',
  stone: '#bdb7aa',
  deck: '#a8794e',
  // water
  lakeShallow: '#7fc4c9',
  lakeDeep: '#2f7f95',
  lakeDusk: '#2b4a78',
  pool: '#3fc9e0',
  poolDeep: '#1a9fc4',
  poolTile: '#e9f6f7',
  // buildings
  white: '#f4f1e8',
  cream: '#eadfc6',
  taupe: '#c7b89c',
  charcoal: '#2f3437',
  roof: '#8f979b',
  glass: '#2e4750',
  silver: '#dfe5e9',
  cedar: '#d4a373',
  // lights
  warmLight: '#ffd08a',
  fire: '#ff8a2a',
} as const

/**
 * Sky per mood: zenith, horizon band (strongest toward the sun), haze (the colour distant
 * land fades to, and the fog colour), sun glow, sun light and ambient level.
 */
export const SKY = {
  day: { top: '#4f9fe6', horizon: '#d3e8f8', haze: '#d2e3ec', glow: '#fff3d6', sun: '#fff1d8', sunIntensity: 3.0, ambient: 0.85 },
  winter: { top: '#7fa3cc', horizon: '#e6ebef', haze: '#dde5ea', glow: '#fff0dc', sun: '#ffeeda', sunIntensity: 2.6, ambient: 0.9 },
  dusk: { top: '#101a44', horizon: '#e58e5e', haze: '#3d3a5e', glow: '#ffb070', sun: '#ffb27a', sunIntensity: 1.5, ambient: 0.95 },
} as const
export const skyFor = (e: SceneEnv) => (e.time === 'dusk' ? SKY.dusk : e.season === 'winter' ? SKY.winter : SKY.day)

/**
 * Starting quality tier. `?quality=high|low` overrides it (used by the screenshot tool).
 * Phones and tablets start on 'low' unless they are clearly high-end.
 */
export function detectQuality(): Quality {
  if (typeof window === 'undefined') return 'high'
  const forced = new URLSearchParams(window.location.search).get('quality')
  if (forced === 'high' || forced === 'low') return forced
  const coarse = window.matchMedia?.('(pointer: coarse)').matches
  const cores = navigator.hardwareConcurrency || 4
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4
  if (coarse) return cores >= 8 && mem >= 8 ? 'high' : 'low'
  return cores >= 4 ? 'high' : 'low'
}
export const qualityForced = () => typeof window !== 'undefined' && /[?&]quality=(high|low)/.test(window.location.search)
