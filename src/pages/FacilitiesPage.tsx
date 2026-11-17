import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Map as MapIcon, Route } from 'lucide-react'
import { Header } from '../components/Header'
import { LegalFooter } from '../components/LegalFooter'
import { TimeToggle } from '../components/ui'
import { useCamp } from '../i18n/CampState'
import { AreaPanel } from '../map/AreaPanel'
import { CampMap3D } from '../map/CampMap3D'
import { setUrl } from '../lib/root'
import { HOTSPOTS, HOTSPOT_BY_ID } from '../map/hotspots'
import { Icon } from '../map/icons'
import type { TabId } from '../map/types'

/** "Explore the Facilities": the 3D camp map with click-through detail panels. */
export function FacilitiesPage() {
  const { s, t } = useCamp()
  const [selId, setSelId] = useState<string | null>(() => {
    const h = window.location.hash.slice(1)
    return HOTSPOT_BY_ID[h] ? h : null
  })
  const [tab, setTab] = useState<TabId>(() => HOTSPOT_BY_ID[window.location.hash.slice(1)]?.tab ?? 'highlights')
  const [resetKey, setResetKey] = useState(0)
  const [flyKey, setFlyKey] = useState(0)
  // True once the camera is closer than the full-map framing (by a click, scroll or pinch).
  const [zoomedIn, setZoomedIn] = useState(false)
  const [introSeen, setIntroSeen] = useState(false)
  const onInteract = useCallback(() => setIntroSeen(true), [])
  const selected = selId ? HOTSPOT_BY_ID[selId] : null

  const select = useCallback((id: string | null) => {
    setSelId(id)
    if (id) {
      setIntroSeen(true)
      setFlyKey((k) => k + 1)
    }
    setTab((id && HOTSPOT_BY_ID[id].tab) || 'highlights')
    setUrl(id ? `#${id}` : window.location.pathname + window.location.search)
  }, [])
  // Deep links such as /facilities/#cinema also work while the page is already open.
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.slice(1)
      if (HOTSPOT_BY_ID[h]) {
        setSelId(h)
        setTab(HOTSPOT_BY_ID[h].tab ?? 'highlights')
      }
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const index = selected ? HOTSPOTS.indexOf(selected) : -1
  const step = useCallback((d: 1 | -1) => select(HOTSPOTS[(index + d + HOTSPOTS.length) % HOTSPOTS.length].id), [index, select])
  // Closing a panel keeps the camera where it is; "Full map" is the way back out.
  const close = useCallback(() => select(null), [select])
  const fullMap = useCallback(() => {
    select(null)
    setResetKey((k) => k + 1)
  }, [select])
  const places = useMemo(() => HOTSPOTS, [])

  // Place list under the map: a normal mouse wheel scrolls it sideways, and the chosen place is kept in view.
  const chips = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = chips.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])
  useEffect(() => {
    const el = chips.current
    const chip = selId ? el?.querySelector<HTMLElement>(`[data-chip="${selId}"]`) : null
    if (el && chip) el.scrollTo({ left: chip.offsetLeft - (el.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' })
  }, [selId])
  const nudge = (dir: 1 | -1) => chips.current?.scrollBy({ left: dir * chips.current.clientWidth * 0.7, behavior: 'smooth' })

  return (
    <div className="bg-pine-900">
      <Header page="facilities" />
      <main id="main" className="relative flex h-[calc(100svh-4rem)] min-h-[300px] flex-col md:flex-row">
        <div className="relative min-h-0 flex-1">
          <CampMap3D selected={selected} flyKey={flyKey} onSelect={select} resetKey={resetKey} onZoomedChange={setZoomedIn} onInteract={onInteract} />

          {/* intro card: shown until the visitor first touches the map */}
          {!selected && !zoomedIn && !introSeen && (
            <div className="rise-in glass pointer-events-none absolute left-3 top-3 z-10 max-w-[calc(100%-11.5rem)] rounded-2xl p-3.5 text-white sm:left-5 sm:top-5 sm:max-w-80 sm:p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cedar">{s.map.kicker}</p>
              <h1 className="font-display mt-1 text-lg font-semibold leading-tight sm:text-xl">{s.map.title}</h1>
              <p className="mt-1.5 text-[11px] leading-relaxed text-white/70">
                {s.map.hintTap}
                <span className="hidden sm:inline">
                  {' '}
                  · {s.map.hintDrag} · {s.map.hintZoom}
                </span>
              </p>
            </div>
          )}

          {/* Full map: appears once the view is closer than the whole camp */}
          {(selected || zoomedIn) && (
            <button type="button" onClick={fullMap} data-full-map className="rise-in absolute left-3 top-3 z-10 flex items-center gap-2 rounded-full bg-cedar px-4 py-2.5 text-sm font-bold text-pine-900 shadow-lg transition hover:brightness-105 sm:left-5 sm:top-5">
              <MapIcon size={16} aria-hidden />
              {s.map.fullMap}
            </button>
          )}

          {/* controls */}
          <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-2 sm:right-5 sm:top-5">
            {/* on a phone with a panel open the map is short: keep its top clear for the place name */}
            <div className={selected ? 'hidden md:block' : ''}>
              <TimeToggle />
            </div>
            <div className={`gap-2 ${selected ? 'hidden md:flex' : 'flex'}`}>
              <button type="button" onClick={() => select(HOTSPOTS[0].id)} className="glass flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold text-white hover:brightness-125">
                <Route size={15} aria-hidden />
                {s.map.tour}
              </button>
            </div>
          </div>

          {/* place chips */}
          <nav ref={chips} aria-label={s.map.places} className="no-scrollbar absolute inset-x-0 bottom-0 z-10 flex gap-2 overflow-x-auto px-3 pb-3 pt-8 sm:px-5 sm:pb-4 md:px-14" style={{ background: 'linear-gradient(transparent, rgb(15 39 29 / 0.55))' }}>
            {places.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => select(h.id)}
                aria-pressed={h.id === selId}
                data-chip={h.id}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-[12.5px] font-semibold backdrop-blur-md transition ${h.id === selId ? 'border-white/60 bg-cedar text-pine-900' : 'border-white/20 bg-pine-900/70 text-white hover:bg-pine-800/90'}`}
              >
                <Icon name={h.icon} size={14} />
                {t(h.name)}
              </button>
            ))}
          </nav>
          {/* arrows for mouse users: the place list is wider than the map */}
          {([-1, 1] as const).map((dir) => (
            <button
              key={dir}
              type="button"
              onClick={() => nudge(dir)}
              aria-label={dir < 0 ? s.map.prev : s.map.next}
              data-chips-arrow={dir}
              className={`glass absolute bottom-3 z-20 hidden h-9 w-9 place-items-center rounded-full text-white hover:brightness-125 md:grid sm:bottom-4 ${dir < 0 ? 'left-3' : 'right-3'}`}
            >
              {dir < 0 ? <ChevronLeft size={18} aria-hidden /> : <ChevronRight size={18} aria-hidden />}
            </button>
          ))}
          <p className="pointer-events-none absolute bottom-[4.2rem] right-3 z-10 hidden text-[10px] text-white/70 sm:right-5 sm:block">{s.map.stylizedNote}</p>
        </div>
        {selected && <AreaPanel hotspot={selected} tab={tab} setTab={setTab} onClose={close} onStep={step} index={index} total={HOTSPOTS.length} />}
      </main>
      <LegalFooter />
    </div>
  )
}
