import { useCallback, useEffect, useMemo, useState } from 'react'
import { RotateCcw, Route } from 'lucide-react'
import { Header } from '../components/Header'
import { LegalFooter } from '../components/LegalFooter'
import { SeasonToggle, TimeToggle } from '../components/ui'
import { useCamp } from '../i18n/CampState'
import { AreaPanel } from '../map/AreaPanel'
import { CampMap3D } from '../map/CampMap3D'
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
  const selected = selId ? HOTSPOT_BY_ID[selId] : null

  const select = useCallback((id: string | null) => {
    setSelId(id)
    setTab((id && HOTSPOT_BY_ID[id].tab) || 'highlights')
    window.history.replaceState(null, '', id ? `#${id}` : window.location.pathname + window.location.search)
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
  const close = useCallback(() => select(null), [select])
  const places = useMemo(() => HOTSPOTS, [])

  return (
    <div className="bg-pine-900">
      <Header page="facilities" />
      <main id="main" className="relative flex h-[calc(100svh-4rem)] min-h-[520px] flex-col md:flex-row">
        <div className="relative min-h-0 flex-1">
          <CampMap3D selected={selected} onSelect={select} resetKey={resetKey} />

          {/* intro card */}
          {!selected && (
            <div className="rise-in glass pointer-events-none absolute left-3 top-3 max-w-[min(22rem,calc(100%-1.5rem))] rounded-2xl p-4 text-white sm:left-5 sm:top-5 sm:p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cedar">{s.map.kicker}</p>
              <h1 className="font-display mt-1 text-xl font-semibold leading-tight sm:text-2xl">{s.map.title}</h1>
              <p className="mt-2 hidden text-[13px] leading-relaxed text-white/85 sm:block">{s.map.intro}</p>
              <p className="mt-2 text-[11px] text-white/60">
                {s.map.hintDrag} · {s.map.hintZoom} · {s.map.hintTap}
              </p>
            </div>
          )}

          {/* controls */}
          <div className="absolute right-3 top-3 flex flex-col items-end gap-2 sm:right-5 sm:top-5">
            <TimeToggle />
            <div className={`md:hidden ${selected ? 'hidden' : ''}`}>
              <SeasonToggle />
            </div>
            <div className={`gap-2 ${selected ? 'hidden md:flex' : 'flex'}`}>
              <button type="button" onClick={() => select(HOTSPOTS[0].id)} className="glass flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold text-white hover:brightness-125">
                <Route size={15} aria-hidden />
                {s.map.tour}
              </button>
              <button
                type="button"
                onClick={() => {
                  select(null)
                  setResetKey((k) => k + 1)
                }}
                className="glass flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold text-white hover:brightness-125"
              >
                <RotateCcw size={15} aria-hidden />
                {s.map.reset}
              </button>
            </div>
          </div>

          {/* place chips */}
          <nav aria-label={s.map.places} className="no-scrollbar absolute inset-x-0 bottom-0 flex gap-2 overflow-x-auto px-3 pb-3 pt-8 sm:px-5 sm:pb-4" style={{ background: 'linear-gradient(transparent, rgb(15 39 29 / 0.55))' }}>
            {places.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => select(h.id)}
                aria-pressed={h.id === selId}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-[12.5px] font-semibold backdrop-blur-md transition ${h.id === selId ? 'border-white/60 bg-cedar text-pine-900' : 'border-white/20 bg-pine-900/70 text-white hover:bg-pine-800/90'}`}
              >
                <Icon name={h.icon} size={14} />
                {t(h.name)}
              </button>
            ))}
          </nav>
          <p className="pointer-events-none absolute bottom-[4.2rem] right-3 hidden text-[10px] text-white/70 sm:right-5 sm:block">{s.map.stylizedNote}</p>
        </div>
        {selected && <AreaPanel hotspot={selected} tab={tab} setTab={setTab} onClose={close} onStep={step} index={index} total={HOTSPOTS.length} />}
      </main>
      <LegalFooter />
    </div>
  )
}
