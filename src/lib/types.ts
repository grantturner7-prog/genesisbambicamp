export type Lang = 'zh-TW' | 'en'
export type Season = 'winter' | 'summer'
/** 'dusk' is the site's night mode: the evening camp with its lights on. */
export type TimeOfDay = 'day' | 'dusk'

/** A bilingual string. `zh` is Taiwan Traditional Chinese (繁體中文). */
export interface L {
  en: string
  zh: string
}

export type AreaId = 'gate' | 'vans' | 'dining' | 'pool' | 'cinema' | 'campfire' | 'kayak' | 'birds' | 'tram' | 'care'

export type Zone = 'A' | 'B' | 'D' | 'E' | 'F' | 'G'

export type Vec3 = [number, number, number]

export function pick(l: L, lang: Lang): string {
  return lang === 'en' ? l.en : l.zh
}
