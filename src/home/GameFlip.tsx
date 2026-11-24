import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, ChevronLeft, ChevronRight, Info, X } from 'lucide-react'
import { useCamp } from '../i18n/CampState'
import type { L } from '../lib/types'
import { Icon } from '../map/icons'
import { SCHEDULE } from './content'
import { GAMES, GAMES_COPY, GAME_DETAILS, GAME_GROUPS, type Game } from './games'

const PERSPECTIVE = 'perspective(1500px)'
const cardOf = (n: number) => document.querySelector<HTMLElement>(`[data-games] > [data-game="${n}"]`)
/** A card the visitor can see: on the page, not folded away by the filter or "show all", and inside the window. */
const shown = (el: HTMLElement | null): el is HTMLElement => {
  if (!el || el.offsetParent === null) return false
  const r = el.getBoundingClientRect()
  return r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth
}

/**
 * When an activity runs at the winter camp. Read from the published day-by-day plan,
 * so the card and the plan cannot say different things.
 */
export const gameSlots = (g: Game) =>
  SCHEDULE.days.flatMap((d) => d.rows.filter((r) => r.what.en.includes(g.alias ?? g.name.en)).map((r) => ({ day: d.day, time: r.time })))

/**
 * An activity card, flipped over and brought forward as a pane of glass.
 *
 * The card the visitor tapped lifts out of the grid, turns on its edge and comes back round as
 * the panel: two halves of one turn, so each face can be laid out at its own size. Closing plays
 * the same turn backwards and sets the card down where it came from. With reduced motion the
 * panel simply fades.
 */
export function GameFlip({ n, order, onGo, onClose }: { n: number; order: number[]; onGo: (n: number) => void; onClose: () => void }) {
  const { t, lang, season } = useCamp()
  const game = GAMES.find((g) => g.n === n)!
  const grp = GAME_GROUPS.find((x) => x.id === game.group)!
  const detail = GAME_DETAILS[n]
  const slot = season === 'winter' ? gameSlots(game)[0] : undefined
  const other = (x: L) => (lang === 'en' ? x.zh : x.en)

  const front = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const backdrop = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const current = useRef(n)
  const closing = useRef(false)
  /** The turn has finished: the panel may start to float. */
  const [settled, setSettled] = useState(false)
  /** The first activity shown waits for the turn before its steps arrive; later ones do not. */
  const [first, setFirst] = useState(true)
  const reduce = useRef(typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches).current

  /** Lay a copy of the card exactly over the card, and say how far it is from the panel. */
  const stageFront = (card: HTMLElement) => {
    const f = front.current!
    const p = panel.current!
    const r = card.getBoundingClientRect()
    const copy = card.cloneNode(true) as HTMLElement
    copy.removeAttribute('data-game')
    copy.removeAttribute('data-flipped')
    copy.querySelectorAll('button').forEach((b) => b.remove())
    copy.querySelectorAll('[tabindex]').forEach((e) => e.removeAttribute('tabindex'))
    copy.style.cssText = 'margin:0;width:100%;height:100%;transform:none;visibility:visible;list-style:none;'
    f.replaceChildren(copy)
    Object.assign(f.style, { display: 'block', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` })
    // offset* ignores transforms, so this holds while the panel is turned on its edge
    const cx = p.offsetLeft + p.offsetWidth / 2
    const cy = p.offsetTop + p.offsetHeight / 2
    return { dx: cx - (r.left + r.width / 2), dy: cy - (r.top + r.height / 2), s: Math.min(1.7, Math.max(1, p.offsetWidth / r.width)) }
  }
  const away = ({ dx, dy, s }: { dx: number; dy: number; s: number }) => `${PERSPECTIVE} translate3d(${dx}px, ${dy}px, 0) scale(${s}) rotateY(90deg)`
  const home = `${PERSPECTIVE} translate3d(0, 0, 0) scale(1) rotateY(0deg)`

  // Open: lift the card, turn it, bring the panel round.
  useLayoutEffect(() => {
    const card = cardOf(n)
    const p = panel.current!
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    const before = { overflow: document.body.style.overflow, pad: document.body.style.paddingRight }
    document.body.style.overflow = 'hidden'
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px` // or the grid shifts under the card as the scrollbar goes
    let cancelled = false
    const done = () => {
      if (cancelled) return
      p.style.opacity = '1'
      setSettled(true)
      closeBtn.current?.focus({ preventScroll: true })
    }
    backdrop.current!.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reduce ? 120 : 340, easing: 'ease-out', fill: 'both' })
    if (reduce || !shown(card)) {
      card?.setAttribute('data-flipped', '')
      p.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, fill: 'both' }).finished.then(done, () => {})
    } else {
      const to = stageFront(card)
      card.setAttribute('data-flipped', '')
      const f = front.current!
      f.animate([{ transform: home }, { transform: away(to) }], { duration: 330, easing: 'cubic-bezier(.45,.05,.75,.35)', fill: 'forwards' }).finished.then(
        () => {
          if (cancelled) return
          f.style.display = 'none'
          p.animate(
            [
              { opacity: 1, transform: `${PERSPECTIVE} scale(.9) rotateY(-90deg)` },
              { opacity: 1, transform: `${PERSPECTIVE} scale(1) rotateY(0deg)` },
            ],
            { duration: 480, easing: 'cubic-bezier(.16,.9,.28,1.1)', fill: 'forwards' },
          ).finished.then(
            (a) => {
              p.style.opacity = '1'
              a.cancel() // hand the transform back to CSS, so the panel can float
              done()
            },
            () => {},
          )
        },
        () => {},
      )
    }
    return () => {
      cancelled = true
      document.body.style.overflow = before.overflow
      document.body.style.paddingRight = before.pad
      document.querySelectorAll('[data-flipped]').forEach((e) => e.removeAttribute('data-flipped'))
    }
    // The opening turn belongs to the card that was tapped; later activities swap in place.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Previous / next: the card that is "out of the grid" follows the activity on show.
  useEffect(() => {
    if (current.current === n) return
    cardOf(current.current)?.removeAttribute('data-flipped')
    cardOf(n)?.setAttribute('data-flipped', '')
    current.current = n
    setFirst(false)
    panel.current?.querySelector('[data-game-scroll]')?.scrollTo({ top: 0 })
  }, [n])

  /** `plain` skips the turn back, for when the page is about to move away from the card. */
  const close = useCallback((plain = false) => {
    if (closing.current) return
    closing.current = true
    setSettled(false)
    const p = panel.current!
    const f = front.current!
    const card = cardOf(current.current)
    const finish = () => {
      card?.removeAttribute('data-flipped')
      // hand the keyboard back to the card before the panel goes, so focus never falls to the page
      card?.querySelector<HTMLButtonElement>('[data-game-open]')?.focus({ preventScroll: true })
      onClose()
    }
    backdrop.current!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduce ? 120 : 460, easing: 'ease-in', fill: 'forwards' })
    if (plain || reduce || !shown(card)) {
      p.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' }).finished.then(finish, finish)
      return
    }
    p.animate([{ transform: `${PERSPECTIVE} scale(1) rotateY(0deg)` }, { transform: `${PERSPECTIVE} scale(.9) rotateY(-90deg)` }], {
      duration: 250,
      easing: 'cubic-bezier(.5,0,.8,.4)',
      fill: 'forwards',
    }).finished.then(() => {
      p.style.opacity = '0'
      const from = stageFront(card)
      f.animate([{ transform: away(from) }, { transform: home }], { duration: 360, easing: 'cubic-bezier(.2,.8,.25,1)', fill: 'forwards' }).finished.then(finish, finish)
    }, finish)
  }, [onClose, reduce])

  const step = useCallback(
    (by: number) => {
      const i = order.indexOf(n)
      if (i < 0 || order.length < 2) return
      onGo(order[(i + by + order.length) % order.length])
    },
    [n, order, onGo],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      } else if (e.key === 'ArrowRight') step(1)
      else if (e.key === 'ArrowLeft') step(-1)
      else if (e.key === 'Tab') {
        // keep the keyboard inside the panel while it is open
        const stops = [...(panel.current?.querySelectorAll<HTMLElement>('button, a[href]') ?? [])]
        if (!stops.length) return
        const at = stops.indexOf(document.activeElement as HTMLElement)
        if (at < 0 || (e.shiftKey && at === 0) || (!e.shiftKey && at === stops.length - 1)) {
          e.preventDefault()
          stops[e.shiftKey ? stops.length - 1 : 0].focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [close, step])

  const at = order.indexOf(n)
  const wait = first && !reduce ? 620 : 60 // ms before the first step arrives
  const accent = { '--accent': grp.fg, '--tint': grp.bg } as CSSProperties

  return createPortal(
    <div className="fixed inset-0 z-[80]" data-game-dialog>
      <div ref={backdrop} className="game-backdrop absolute inset-0" onClick={() => close()} />
      <div ref={front} aria-hidden className="pointer-events-none fixed hidden [transform-origin:50%_50%]" />
      <div className="pointer-events-none absolute inset-0 grid place-items-center p-3 sm:p-6">
        <div
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-labelledby="game-dialog-title"
          data-settled={settled || undefined}
          style={{ ...accent, opacity: 0 }}
          className={`game-glass pointer-events-auto flex max-h-[min(90svh,46rem)] w-full max-w-[35rem] flex-col rounded-[2rem] ${settled ? 'game-float' : ''}`}
        >
          <span aria-hidden className="game-blob -right-10 -top-12 h-48 w-48" />
          <span aria-hidden className="game-blob game-blob-2 -bottom-16 -left-12 h-56 w-56" />
          {settled && <span aria-hidden className="game-sheen" />}
          <button
            ref={closeBtn}
            type="button"
            onClick={() => close()}
            data-game-close
            aria-label={t(GAMES_COPY.close)}
            className="absolute right-3.5 top-3.5 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/70 bg-white/55 text-pine-900 shadow-sm backdrop-blur transition hover:bg-white focus-visible:!outline-pine"
          >
            <X size={18} aria-hidden />
          </button>
          <div data-game-scroll className="thin-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-6 sm:px-8 sm:pb-7 sm:pt-8">
            <div key={n} className={first ? '' : 'game-swap'}>
              <div className="flex items-center gap-4 pr-12">
                <span className="game-orb grid h-[4.5rem] w-[4.5rem] shrink-0 place-items-center rounded-[1.6rem]" style={{ color: grp.fg }}>
                  <Icon name={game.icon} size={34} strokeWidth={1.5} />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: grp.fg }}>
                    <span className="font-display mr-2 text-[15px] tabular-nums tracking-normal text-cedar-600">{String(game.n).padStart(2, '0')}</span>
                    {t(grp.name)}
                  </p>
                  <h2 id="game-dialog-title" className="font-display mt-1 text-[1.65rem] font-semibold leading-[1.12] text-pine-900 sm:text-[1.9rem]">
                    {t(game.name)}
                  </h2>
                  <p lang={lang === 'en' ? 'zh-TW' : 'en'} className="mt-1 text-[13px] font-semibold leading-snug text-ink/65">
                    {other(game.name)}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-[16px] leading-relaxed text-ink/85">{t(game.body)}</p>

              {(slot || detail?.takes.length) && (
                <ul className="mt-4 flex flex-wrap items-center gap-2" data-game-chips>
                  {slot && (
                    <li data-game-slot className="flex items-center gap-1.5 rounded-full bg-pine px-3 py-1.5 text-[12.5px] font-bold text-white shadow-sm">
                      <CalendarDays size={14} aria-hidden className="text-cedar" />
                      {t(GAMES_COPY.winter)} · {t(slot.day)} {slot.time}
                    </li>
                  )}
                  {detail?.takes.map((x) => (
                    <li key={x.en} className="rounded-full border border-white/80 bg-white/60 px-3 py-1.5 text-[12.5px] font-semibold text-pine-900 shadow-[inset_0_1px_0_rgb(255_255_255/0.9)]">
                      {t(x)}
                    </li>
                  ))}
                </ul>
              )}

              {detail && (
                <>
                  <h3 className="mt-6 text-[11px] font-bold uppercase tracking-[0.16em] text-ink/60">{t(GAMES_COPY.happens)}</h3>
                  <ol className="mt-3" data-game-steps>
                    {detail.steps.map((s, i) => (
                      <li key={s.en} className="game-step relative flex gap-3.5 pb-4 last:pb-0" style={{ animationDelay: `${wait + i * 80}ms` }}>
                        {i < detail.steps.length - 1 && <span aria-hidden className="absolute bottom-0 left-[0.84rem] top-7 w-px opacity-30" style={{ background: grp.fg }} />}
                        <span aria-hidden className="relative grid h-7 w-7 shrink-0 place-items-center rounded-full text-[13px] font-bold text-white shadow-sm" style={{ background: grp.fg }}>
                          {i + 1}
                        </span>
                        <p className="pt-[0.15rem] text-[15.5px] leading-relaxed text-ink/90">{t(s)}</p>
                      </li>
                    ))}
                  </ol>
                  {detail.note && (
                    <p data-game-note className="game-step mt-4 flex gap-2.5 rounded-2xl border border-white/80 bg-white/55 px-4 py-3 text-[14px] leading-relaxed text-ink/85" style={{ animationDelay: `${wait + detail.steps.length * 80}ms` }}>
                      <Info size={17} aria-hidden className="mt-[0.2rem] shrink-0" style={{ color: grp.fg }} />
                      <span>
                        <b className="font-bold text-pine-900">{t(GAMES_COPY.note)}</b>
                        {lang === 'en' ? ': ' : '：'}
                        {t(detail.note)}
                      </span>
                    </p>
                  )}
                </>
              )}

              <p className="mt-5 text-[12.5px] leading-relaxed text-ink/65">
                {t(GAMES_COPY.plan)}{' '}
                <a href="#schedule" onClick={() => close(true)} className="font-bold text-pine underline decoration-pine/30 underline-offset-2 hover:decoration-pine">
                  {t(SCHEDULE.teaserLink)}
                </a>
              </p>
            </div>
          </div>
          {order.length > 1 && (
            <div className="relative z-10 flex shrink-0 items-center justify-between gap-3 border-t border-white/60 bg-white/35 px-4 py-3 sm:px-6">
              <button type="button" data-game-prev onClick={() => step(-1)} aria-label={t(GAMES_COPY.prev)} className="game-nav">
                <ChevronLeft size={18} aria-hidden />
              </button>
              <p className="text-[12.5px] font-bold tabular-nums text-ink/65" aria-live="polite">
                {at + 1} / {order.length}
              </p>
              <button type="button" data-game-next onClick={() => step(1)} aria-label={t(GAMES_COPY.next)} className="game-nav">
                <ChevronRight size={18} aria-hidden />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
