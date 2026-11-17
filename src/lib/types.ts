export type Lang = 'zh-TW' | 'en'
export type Season = 'winter' | 'summer'
export type TimeOfDay = 'day' | 'dusk'

/** A bilingual string. `zh` is Taiwan Traditional Chinese (繁體中文). */
export interface L {
  en: string
  zh: string
}

export type AreaId =
  | 'gate'
  | 'care'
  | 'vans'
  | 'dining'
  | 'pool'
  | 'kayak'
  | 'tram'
  | 'meadow'
  | 'guild'
  | 'campfire'
  | 'trails'

export type Vec3 = [number, number, number]

export function pick(l: L, lang: Lang): string {
  return lang === 'en' ? l.en : l.zh
}
