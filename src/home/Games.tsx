import { useEffect, useRef, useState } from 'react'
import { ChevronDown, CloudRain } from 'lucide-react'
import { useCamp } from '../i18n/CampState'
import type { L } from '../lib/types'
import { Icon } from '../map/icons'
import { RAIN_PLAN, SCHEDULE_PENDING } from './content'
import { GAMES, GAMES_COPY, GAME_GROUPS, type GameGroupId } from './games'
import { Heading, Section } from './Sections'

/** Below the three-column layout the full list is long: show this many until the visitor asks for the rest. */
const PREVIEW = 8

/**
 * Camp games and challenges. Each activity is a quiet card with a line icon (objects only,
 * never people), its name in both languages and one sentence on what the teams do.
 */
export function Games() {
  const { t, lang } = useCamp()
  const [group, setGroup] = useState<GameGroupId | 'all'>('all')
  const [open, setOpen] = useState(false)
  // "Show all" removes its own button, so hand keyboard and screen-reader focus to the first new card.
  const firstRevealed = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (open) firstRevealed.current?.focus()
  }, [open])
  const list = group === 'all' ? GAMES : GAMES.filter((g) => g.group === group)
  const other = (x: L) => (lang === 'en' ? x.zh : x.en)
  const collapsed = group === 'all' && !open
  const chip = (id: GameGroupId | 'all', label: string, count: number) => (
    <button
      key={id}
      type="button"
      aria-pressed={group === id}
      data-game-filter={id}
      onClick={() => setGroup(id)}
      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors focus-visible:!outline-pine ${group === id ? 'border-pine bg-pine text-white' : 'border-pine/20 bg-white text-pine hover:border-pine/50'}`}
    >
      {label}
      <span className={`tabular-nums ${group === id ? 'text-cedar-100' : 'text-ink/65'}`}>{count}</span>
    </button>
  )
  return (
    <Section id="games" tone="cream">
      <Heading kicker={t(GAMES_COPY.kicker)} title={t(GAMES_COPY.title)} intro={t(GAMES_COPY.intro)} />
      <div role="group" aria-label={t(GAMES_COPY.filterLabel)} className="mt-8 flex flex-wrap gap-2">
        {chip('all', t(GAMES_COPY.all), GAMES.length)}
        {GAME_GROUPS.map((g) => chip(g.id, t(g.name), GAMES.filter((x) => x.group === g.id).length))}
      </div>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-games>
        {list.map((g, i) => {
          const grp = GAME_GROUPS.find((x) => x.id === g.group)!
          return (
            <li
              key={g.n}
              data-game={g.n}
              className={`${collapsed && i >= PREVIEW ? 'hidden lg:flex' : 'flex'} relative gap-4 rounded-3xl border border-pine/10 bg-white p-4 shadow-sm transition duration-300 hover:shadow-md motion-safe:hover:-translate-y-0.5 sm:flex-col sm:gap-0 sm:p-5`}
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl" style={{ background: grp.bg, color: grp.fg }}>
                <Icon name={g.icon} size={24} strokeWidth={1.6} />
              </span>
              <span className="font-display absolute right-4 top-4 text-xl font-semibold leading-none tabular-nums text-cedar/70 sm:right-5 sm:top-5 sm:text-[1.6rem]" aria-hidden>
                {String(g.n).padStart(2, '0')}
              </span>
              {/* phones: icon beside the text; wider screens: icon above it */}
              <div className="flex min-w-0 flex-1 flex-col sm:mt-4">
                <h3 ref={i === PREVIEW ? firstRevealed : undefined} tabIndex={i === PREVIEW ? -1 : undefined} className="pr-9 text-[17px] font-bold leading-snug text-pine-900 sm:pr-0">
                  {t(g.name)}
                </h3>
                <p lang={lang === 'en' ? 'zh-TW' : 'en'} className="mt-0.5 text-[13px] font-semibold leading-snug text-ink/65">
                  {other(g.name)}
                </p>
                <p className="mt-2 text-[14px] leading-relaxed text-ink/70 sm:mt-2.5">{t(g.body)}</p>
                <p className="mt-auto pt-3 text-[11px] font-bold uppercase tracking-[0.12em] sm:pt-4" style={{ color: grp.fg }}>
                  {t(grp.name)}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
      {collapsed && (
        <button
          type="button"
          data-games-more
          onClick={() => setOpen(true)}
          className="mx-auto mt-5 flex items-center gap-2 rounded-full border border-pine/25 bg-white px-5 py-3 text-sm font-bold text-pine shadow-sm focus-visible:!outline-pine lg:hidden"
        >
          {t(GAMES_COPY.showAll(GAMES.length))}
          <ChevronDown size={16} aria-hidden />
        </button>
      )}
      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1.5fr]">
        <aside className="rounded-3xl border border-dashed border-pine/25 bg-white/70 p-6" data-schedule-pending>
          <Icon name="Clock" size={26} className="text-cedar-600" />
          <h3 className="font-display mt-3 text-2xl font-semibold leading-snug text-pine">{t(SCHEDULE_PENDING.title)}</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-ink/70">{t(SCHEDULE_PENDING.body)}</p>
        </aside>
        <aside className="rounded-3xl bg-pine p-6 text-white shadow-lg" data-rain-plan>
          <CloudRain size={26} className="text-cedar" aria-hidden />
          <h3 className="font-display mt-3 text-2xl font-semibold leading-snug">{t(RAIN_PLAN.title)}</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-white/85">{t(RAIN_PLAN.body)}</p>
        </aside>
      </div>
    </Section>
  )
}
