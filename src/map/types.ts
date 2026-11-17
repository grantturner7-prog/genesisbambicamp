import type { AreaId, L, Vec3 } from '../lib/types'

/** Name of a lucide-react icon, resolved in `icons.ts`. */
export type IconKey = string

export interface Feature {
  icon: IconKey
  title: L
  body: L
}

export interface Fact {
  label: L
  value: L
}

export type Allergen = 'milk' | 'gluten' | 'egg' | 'soy' | 'sesame'

export interface MenuItem {
  name: L
  note?: L
  allergens?: Allergen[]
  vegetarian?: boolean
  caffeineFree?: boolean
}

export interface MenuSection {
  title: L
  icon: IconKey
  time?: string
  items: MenuItem[]
}

export interface Rule {
  icon: IconKey
  title: L
  body: L
}

export type TabId = 'highlights' | 'media' | 'menu' | 'safety'

export interface Area {
  id: AreaId
  name: L
  tagline: L
  summary: L
  icon: IconKey
  /** Accent used for the panel header and placeholder art (hex). */
  accent: string
  accent2: string
  features: Feature[]
  facts: Fact[]
  parentNote?: L
  seasonNote?: { winter?: L; summer?: L }
  /** Programme runs in Summer sessions only (never promoted as a Winter activity). */
  summerOnly?: boolean
  menu?: {
    title: L
    intro: L
    sections: MenuSection[]
    footnotes: L[]
  }
  safety?: {
    title: L
    rules: Rule[]
  }
}

/** A clickable label on the 3D map. Several hotspots can open the same area. */
export interface Hotspot {
  id: string
  area: AreaId
  /** Panel tab to open on click. */
  tab?: TabId
  /** Optional label override (e.g. the snack shop next to the pool). */
  label?: L
  icon?: IconKey
  /** World position of the floating label. */
  labelPos: Vec3
  /** Camera framing when this hotspot is selected. */
  view: { target: Vec3; distance: number; azimuth: number; polar: number }
}
