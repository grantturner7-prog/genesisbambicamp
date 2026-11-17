import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { L, Lang, Season, TimeOfDay } from '../lib/types'
import { strings, type Strings } from './strings'

interface CampState {
  lang: Lang
  setLang: (l: Lang) => void
  season: Season
  setSeason: (s: Season) => void
  time: TimeOfDay
  setTime: (t: TimeOfDay) => void
  /** Resolve a bilingual string for the active language. */
  t: (l: L) => string
  /** UI strings for the active language. */
  s: Strings
}

const Ctx = createContext<CampState | null>(null)

const LANG_KEY = 'gya.lang'
const SEASON_KEY = 'gya.season'
const TIME_KEY = 'gya.time'

function readStore(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}
function writeStore(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* private mode / blocked storage: state still works for the session */
  }
}

function readSession(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}
function writeSession(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    /* blocked storage: the choice still holds for this page */
  }
}

/**
 * Night falls on the site when it does for the visitor: between 18:00 and 06:00 on their own
 * clock the map opens in night mode and the landing page shows its evening photos.
 * A choice made with the Day / Night switch holds for the rest of the visit, and
 * `?time=day|night` overrides both (used by the screenshot and test tools).
 */
function defaultTime(): TimeOfDay {
  if (typeof window === 'undefined') return 'day'
  const forced = new URLSearchParams(window.location.search).get('time')
  if (forced === 'day') return 'day'
  if (forced === 'night') return 'dusk'
  const chosen = readSession(TIME_KEY)
  if (chosen === 'day' || chosen === 'dusk') return chosen
  const h = new Date().getHours()
  return h >= 18 || h < 6 ? 'dusk' : 'day'
}

/** Next camp season by calendar: Nov–Mar → winter camp, otherwise summer camp. */
function defaultSeason(): Season {
  const m = new Date().getMonth() + 1
  return m >= 11 || m <= 3 ? 'winter' : 'summer'
}

export function CampStateProvider({ children, page = 'home' }: { children: ReactNode; page?: 'home' | 'facilities' }) {
  // Doc 3: default to idiomatic Taiwan Traditional Chinese, persisted in localStorage.
  const [lang, setLangState] = useState<Lang>(() => (readStore(LANG_KEY) === 'en' ? 'en' : 'zh-TW'))
  const [season, setSeasonState] = useState<Season>(() => {
    const v = readStore(SEASON_KEY)
    return v === 'summer' || v === 'winter' ? v : defaultSeason()
  })
  const [time, setTimeState] = useState<TimeOfDay>(defaultTime)

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    writeStore(LANG_KEY, l)
  }, [])
  const setSeason = useCallback((s: Season) => {
    setSeasonState(s)
    writeStore(SEASON_KEY, s)
  }, [])
  const setTime = useCallback((t: TimeOfDay) => {
    setTimeState(t)
    writeSession(TIME_KEY, t)
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dataset.time = time === 'dusk' ? 'night' : 'day'
    const st = strings[lang]
    document.title = page === 'facilities' ? `${st.nav.facilities}｜${st.meta.title}` : st.meta.title
  }, [lang, page, time])

  const value = useMemo<CampState>(
    () => ({
      lang,
      setLang,
      season,
      setSeason,
      time,
      setTime,
      t: (l: L) => (lang === 'en' ? l.en : l.zh),
      s: strings[lang === 'en' ? 'en' : 'zh-TW'],
    }),
    [lang, setLang, season, setSeason, time, setTime],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCamp(): CampState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useCamp must be used inside <CampStateProvider>')
  return v
}
