import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Play, Snowflake, Sun, X } from 'lucide-react'
import { campConfig } from '../config/campConfig'
import { useCamp } from '../i18n/CampState'
import { AREA_PHOTOS, MENU_PHOTOS, PHOTO_CREDIT, ZONE_PHOTOS, ZONES, photoSize, photoSrc, photoSrcSet, type Photo } from '../media/media'
import { AREA_BY_ID } from './areas'
import type { Hotspot } from './hotspots'
import { Icon } from './icons'
import type { Allergen, Area, TabId } from './types'

const ALLERGEN: Record<Allergen, { en: string; zh: string }> = {
  milk: { en: 'Milk', zh: '奶' },
  gluten: { en: 'Gluten', zh: '麩質' },
  egg: { en: 'Egg', zh: '蛋' },
  soy: { en: 'Soy', zh: '大豆' },
  sesame: { en: 'Sesame', zh: '芝麻' },
}

/** One photo with caption, credit and optional labelled pins. */
function Figure({ photo, tall }: { photo: Photo; tall?: boolean }) {
  const { t } = useCamp()
  // Show each photo in its own shape (square photos stay square), within sensible limits,
  // so the subject is never cropped away and the label pins stay on target.
  const { w, h } = photoSize(photo.id)
  const ratio = Math.min(tall ? 1.5 : 1.6, Math.max(tall ? 1 : 1.25, w / h))
  return (
    <figure className="relative overflow-hidden rounded-2xl bg-pine-900" style={{ aspectRatio: String(ratio) }}>
      <img src={photoSrc(photo.id)} srcSet={photoSrcSet(photo.id)} sizes="(min-width: 768px) 460px, 100vw" alt={t(photo.caption)} loading="lazy" className="h-full w-full object-cover" />
      {photo.pins?.map((p, i) => (
        <span key={i} className="absolute flex -translate-y-1/2 items-center gap-1.5 rounded-full bg-white/95 py-0.5 pl-0.5 pr-2.5 text-[11px] font-bold text-pine-900 shadow-md" style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-11px,-50%)' }}>
          <span className="grid h-5 w-5 place-items-center rounded-full bg-pine text-[10px] text-white">{i + 1}</span>
          {t(p.label)}
        </span>
      ))}
      <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/70 to-transparent px-3.5 pb-2.5 pt-10 text-white">
        <span className="text-[13px] font-semibold">{t(photo.caption)}</span>
        <span className="shrink-0 rounded-full bg-black/40 px-2 py-0.5 text-[10px]">{t(PHOTO_CREDIT)}</span>
      </figcaption>
    </figure>
  )
}

function Gallery({ photos }: { photos: Photo[] }) {
  const { t } = useCamp()
  const [i, setI] = useState(0)
  useEffect(() => setI(0), [photos])
  const cur = photos[Math.min(i, photos.length - 1)]
  if (!cur) return null
  return (
    <div>
      <Figure photo={cur} tall />
      {photos.length > 1 && (
        <div className="thin-scroll mt-2 flex gap-2 overflow-x-auto pb-1">
          {photos.map((p, k) => (
            <button key={p.id + k} type="button" onClick={() => setI(k)} aria-label={t(p.caption)} aria-pressed={k === i} className={`h-14 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${k === i ? 'border-cedar-600' : 'border-transparent opacity-80 hover:opacity-100'}`}>
              <img src={photoSrc(p.id)} srcSet={photoSrcSet(p.id)} sizes="96px" alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Click-to-load YouTube embed: nothing is requested from YouTube until the visitor presses play. */
function VenueFilm() {
  const { s } = useCamp()
  const [on, setOn] = useState(false)
  const id = campConfig.venueFilmYoutubeId
  if (!id) return null
  return (
    <div className="mt-4">
      <h3 className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-cedar-600">{s.panel.venueFilm}</h3>
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-pine-900">
        {on ? (
          <iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`} title={s.panel.venueFilm} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
        ) : (
          <button type="button" onClick={() => setOn(true)} className="group absolute inset-0 grid place-items-center" aria-label={s.panel.play}>
            <img src={photoSrc('pool-sunset')} srcSet={photoSrcSet('pool-sunset')} sizes="(min-width: 768px) 460px, 100vw" alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
            <span className="relative grid h-16 w-16 place-items-center rounded-full bg-white/95 text-pine shadow-xl transition group-hover:scale-105">
              <Play size={26} fill="currentColor" aria-hidden />
            </span>
            <span className="absolute bottom-3 left-3.5 text-[13px] font-semibold text-white">{s.panel.venueFilmBy}</span>
          </button>
        )}
      </div>
    </div>
  )
}

function Highlights({ area, hotspot }: { area: Area; hotspot: Hotspot }) {
  const { t, s, season, lang } = useCamp()
  const zone = hotspot.zone
  const lead = zone ? ZONE_PHOTOS[zone][0] : (AREA_PHOTOS[area.id].find((p) => p.id === hotspot.lead) ?? AREA_PHOTOS[area.id][0])
  const food = MENU_PHOTOS[area.id]
  const note = area.seasonNote?.[season]
  const off = area.summerOnly && season === 'winter'
  const cm = lang === 'en' ? ' cm' : ' 公分'
  return (
    <div>
      {lead && <Figure photo={lead} />}
      {zone && (
        <div className="mt-3 rounded-2xl border border-pine/10 bg-white p-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-display text-xl font-semibold text-pine">{t(hotspot.name)}</p>
            <p className="text-sm font-bold text-cedar-600">{s.panel.units.replace('{n}', String(ZONES[zone].count))}</p>
          </div>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-pine/60">{t(ZONES[zone].setting)}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink/80">{t(ZONES[zone].blurb)}</p>
        </div>
      )}
      {note && (
        <p className={`mt-3 flex items-start gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold ${off ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-900'}`}>
          {season === 'winter' ? <Snowflake size={16} className="mt-0.5 shrink-0" aria-hidden /> : <Sun size={16} className="mt-0.5 shrink-0" aria-hidden />}
          {t(note)}
        </p>
      )}
      <p className="mt-3 text-[15px] leading-relaxed text-ink/85">{t(area.summary)}</p>
      {food && (
        <div className="mt-4">
          <h3 className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-cedar-600">{s.panel.foodHighlights}</h3>
          <ul className="grid grid-cols-3 gap-2">
            {food.slice(0, 6).map((p) => (
              <li key={p.id} className="overflow-hidden rounded-xl bg-white shadow-sm">
                <img src={photoSrc(p.id)} srcSet={photoSrcSet(p.id)} sizes="(min-width: 768px) 220px, 50vw" alt={t(p.caption)} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                <p className="px-2 py-1.5 text-[11px] font-semibold leading-snug text-pine-900">{t(p.caption)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {area.id === 'pool' && (
        <div className="mt-3 rounded-2xl border border-cyan-200 bg-white p-4">
          <div className="flex justify-between text-xs font-bold text-cyan-900">
            <span>{s.panel.depth}</span>
            <span>
              {campConfig.pool.depthMinCm}–{campConfig.pool.depthMaxCm}
              {cm}
            </span>
          </div>
          <div className="my-2 h-3 rounded-full bg-gradient-to-r from-cyan-100 via-cyan-400 to-cyan-700" />
          <div className="flex justify-between text-[11px] font-semibold text-cyan-900/80">
            <span>
              {s.panel.shallow} · {campConfig.pool.depthMinCm}
              {cm}
            </span>
            <span>
              {s.panel.deep} · {campConfig.pool.depthMaxCm}
              {cm}
            </span>
          </div>
        </div>
      )}
      <h3 className="mb-2 mt-5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-cedar-600">{s.panel.keyFeatures}</h3>
      <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {area.features.map((f) => (
          <li key={f.title.en} className="rounded-2xl border border-pine/10 bg-white p-3.5">
            <span className="mb-2 grid h-8 w-8 place-items-center rounded-lg" style={{ background: `${area.accent2}66`, color: area.accent }}>
              <Icon name={f.icon} size={17} />
            </span>
            <p className="text-[13px] font-bold leading-snug text-pine-900">{t(f.title)}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink/70">{t(f.body)}</p>
          </li>
        ))}
      </ul>
      <h3 className="mb-2 mt-5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-cedar-600">{s.panel.quickFacts}</h3>
      <dl className="divide-y divide-pine/10 rounded-2xl border border-pine/10 bg-white">
        {area.facts.map((f) => (
          <div key={f.label.en} className="flex justify-between gap-4 px-4 py-2.5 text-[13px]">
            <dt className="text-ink/60">{t(f.label)}</dt>
            <dd className="text-right font-semibold text-pine-900">{t(f.value)}</dd>
          </div>
        ))}
      </dl>
      {area.parentNote && (
        <p className="mt-4 rounded-2xl bg-cedar-100/70 p-4 text-[13px] leading-relaxed text-pine-900">
          <span className="font-bold">{s.panel.parentNote}：</span>
          {t(area.parentNote)}
        </p>
      )}
    </div>
  )
}

function MenuTab({ area }: { area: Area }) {
  const { t, s, lang } = useCamp()
  const m = area.menu!
  const food = MENU_PHOTOS[area.id]
  return (
    <div>
      {food && (
        <div className="mb-4">
          <Gallery photos={food} />
        </div>
      )}
      <div className="flex items-center gap-3 rounded-2xl p-4 text-white" style={{ background: `linear-gradient(135deg, ${area.accent}, ${area.accent2})` }}>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/25">
          <Icon name={area.id === 'pool' ? 'CupSoda' : 'Utensils'} size={22} />
        </span>
        <div>
          <p className="font-display text-xl font-semibold leading-tight">{t(m.title)}</p>
          <p className="mt-0.5 text-[13px] opacity-95">{t(m.intro)}</p>
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] font-bold">
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-900">{s.panel.alcoholFree}</span>
        {area.id === 'pool' && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-900">{s.panel.coupons}</span>}
      </div>
      {m.sections.map((sec) => (
        <section key={sec.title.en} data-menu-section={sec.highlight ? 'highlight' : ''} className={`mt-3 overflow-hidden rounded-2xl border bg-white ${sec.highlight ? 'border-cedar ring-2 ring-cedar/30' : 'border-pine/10'}`}>
          <h4 className="flex items-center gap-2 bg-parchment-200/70 px-4 py-2.5 text-sm font-bold text-pine-900">
            <Icon name={sec.icon} size={16} className="text-cedar-600" />
            {t(sec.title)}
            {sec.tag && <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold ${sec.highlight ? 'bg-cedar text-pine-900' : 'text-ink/50'}`}>{t(sec.tag)}</span>}
          </h4>
          <ul className="divide-y divide-pine/10">
            {sec.items.map((it) => (
              <li key={it.name.en} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-pine-900">{t(it.name)}</p>
                  {it.note && <p className="text-xs text-ink/60">{t(it.note)}</p>}
                </div>
                <div className="flex max-w-[45%] flex-wrap justify-end gap-1 text-[10px] font-bold">
                  {it.vegetarian && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-900">{lang === 'en' ? 'Veg' : '素'}</span>}
                  {it.allergens?.map((a) => (
                    <span key={a} className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-900">
                      {ALLERGEN[a][lang === 'en' ? 'en' : 'zh']}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-ink/65">
        {m.footnotes.map((f) => (
          <li key={f.en}>• {t(f)}</li>
        ))}
      </ul>
    </div>
  )
}

function SafetyTab({ area }: { area: Area }) {
  const { t, s } = useCamp()
  return (
    <div>
      <p className="font-display text-xl font-semibold text-pine">{t(area.safety!.title)}</p>
      <p className="mt-1 text-[13px] text-ink/65">{s.panel.rulesIntro}</p>
      <ol className="mt-3 space-y-2.5">
        {area.safety!.rules.map((r, i) => (
          <li key={r.title.en} className="flex gap-3 rounded-2xl border border-pine/10 bg-white p-3.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: `${area.accent2}66`, color: area.accent }}>
              <Icon name={r.icon} size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-pine-900">{t(r.title)}</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-ink/70">{t(r.body)}</p>
            </div>
            <span className="font-display text-xl font-semibold text-pine/15">{i + 1}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function AreaPanel({ hotspot, tab, setTab, onClose, onStep, index, total }: { hotspot: Hotspot; tab: TabId; setTab: (t: TabId) => void; onClose: () => void; onStep: (d: 1 | -1) => void; index: number; total: number }) {
  const { t, s } = useCamp()
  const area = AREA_BY_ID[hotspot.area]
  const areaPhotos = AREA_PHOTOS[area.id]
  const photos = hotspot.zone
    ? [...ZONE_PHOTOS[hotspot.zone], ...AREA_PHOTOS.vans.filter((p) => !ZONE_PHOTOS[hotspot.zone!].some((z) => z.id === p.id))]
    : hotspot.lead
      ? [...areaPhotos.filter((p) => p.id === hotspot.lead), ...areaPhotos.filter((p) => p.id !== hotspot.lead)]
      : areaPhotos
  const hasFilm = (area.id === 'gate' || area.id === 'vans') && !!campConfig.venueFilmYoutubeId
  // An area with no exact photo simply has no Photos tab.
  const tabs: TabId[] = ['highlights', ...(photos.length || hasFilm ? (['media'] as TabId[]) : []), ...(area.menu ? (['menu'] as TabId[]) : []), ...(area.safety ? (['safety'] as TabId[]) : [])]
  const active = tabs.includes(tab) ? tab : 'highlights'
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <aside className="panel-in z-30 flex h-[60%] w-full shrink-0 flex-col overflow-hidden rounded-t-3xl bg-parchment shadow-[0_-20px_60px_-20px_rgb(0_0_0/0.5)] md:h-auto md:w-[440px] md:rounded-none md:shadow-[-20px_0_60px_-30px_rgb(0_0_0/0.5)]" aria-label={t(area.name)} data-panel={hotspot.id}>
      <header className="relative shrink-0 px-5 pb-4 pt-4 text-white" style={{ background: `linear-gradient(135deg, ${area.accent}, color-mix(in srgb, ${area.accent} 62%, #0f271d))` }}>
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/30 bg-white/20">
            <Icon name={hotspot.icon} size={19} />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] opacity-90">{s.map.tourStop.replace('{n}', String(index + 1)).replace('{total}', String(total))}</span>
          <span className="ml-auto flex gap-1.5">
            <button type="button" onClick={() => onStep(-1)} aria-label={s.map.prev} className="grid h-8 w-8 place-items-center rounded-full border border-white/30 bg-white/20 hover:bg-white/30">
              <ChevronLeft size={16} />
            </button>
            <button type="button" onClick={() => onStep(1)} aria-label={s.map.next} className="grid h-8 w-8 place-items-center rounded-full border border-white/30 bg-white/20 hover:bg-white/30">
              <ChevronRight size={16} />
            </button>
            <button type="button" onClick={onClose} aria-label={s.map.close} className="ml-1 grid h-8 w-8 place-items-center rounded-full border border-white/40 bg-white/25 hover:bg-white/40">
              <X size={16} />
            </button>
          </span>
        </div>
        <h2 className="font-display mt-2.5 text-2xl font-semibold leading-tight">{hotspot.zone ? `${t(area.name)} · ${t(hotspot.name)}` : t(area.name)}</h2>
        <p className="mt-1 text-sm opacity-95">{t(area.tagline)}</p>
      </header>
      <div role="tablist" className="no-scrollbar flex shrink-0 gap-1 overflow-x-auto border-b border-pine/10 bg-white px-3">
        {tabs.map((id) => (
          <button key={id} role="tab" aria-selected={id === active} type="button" onClick={() => setTab(id)} className={`whitespace-nowrap border-b-[3px] px-3 py-3 text-[13px] font-semibold ${id === active ? 'border-cedar-600 text-pine' : 'border-transparent text-ink/55 hover:text-pine'}`}>
            {s.panel.tabs[id]}
          </button>
        ))}
      </div>
      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-4" key={hotspot.id + active}>
        {active === 'highlights' && <Highlights area={area} hotspot={hotspot} />}
        {active === 'media' && (
          <div>
            <Gallery photos={photos} />
            {hasFilm && <VenueFilm />}
          </div>
        )}
        {active === 'menu' && area.menu && <MenuTab area={area} />}
        {active === 'safety' && area.safety && <SafetyTab area={area} />}
      </div>
    </aside>
  )
}
