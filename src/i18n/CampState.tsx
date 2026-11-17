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
  const [time, setTime] = useState<TimeOfDay>('day')

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    writeStore(LANG_KEY, l)
  }, [])
  const setSeason = useCallback((s: Season) => {
    setSeasonState(s)
    writeStore(SEASON_KEY, s)
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    const st = strings[lang]
    document.title = page === 'facilities' ? `${st.nav.facilities}｜${st.meta.title}` : st.meta.title
  }, [lang, page])

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
    [lang, setLang, season, setSeason, time],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCamp(): CampState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useCamp must be used inside <CampStateProvider>')
  return v
}
