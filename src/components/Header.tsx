import { useState } from 'react'
import { Menu, MessageCircle, X } from 'lucide-react'
import { campConfig } from '../config/campConfig'
import { useCamp } from '../i18n/CampState'
import { FACILITIES_URL, HOME_URL } from '../lib/root'
import { LangToggle, SeasonToggle } from './ui'

export function Logo() {
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cedar/50 bg-pine">
      <svg width="22" height="22" viewBox="0 0 64 64" aria-hidden>
        <path d="M32 8 18 34h8L16 50h32L38 34h8z" fill="#D4A373" />
        <rect x="29" y="48" width="6" height="9" fill="#FAF7F2" />
      </svg>
    </span>
  )
}

/** Sticky site header (Doc 3 §1): co-brand, nav, season switcher, 繁中/EN, LINE, Register. */
export function Header({ page, onRegister }: { page: 'home' | 'facilities'; onRegister?: () => void }) {
  const { s } = useCamp()
  const [open, setOpen] = useState(false)
  const home = page === 'home'
  const sec = (id: string) => (home ? `#${id}` : `${HOME_URL}#${id}`)
  const links = [
    { href: sec('seasons'), label: s.nav.activities },
    { href: sec('stay'), label: s.nav.stay },
    { href: sec('safety'), label: s.nav.safety },
    { href: sec('pricing'), label: s.nav.pricing },
    { href: sec('faq'), label: s.nav.faq },
  ]
  const lineUrl = campConfig.operator.lineUrl
  const register = onRegister ? (
    <button type="button" onClick={onRegister} className="rounded-full bg-cedar px-4 py-2 text-sm font-bold text-pine-900 shadow-sm transition hover:brightness-105">
      {s.nav.register}
    </button>
  ) : (
    <a href={`${HOME_URL}#register`} className="rounded-full bg-cedar px-4 py-2 text-sm font-bold text-pine-900 shadow-sm transition hover:brightness-105">
      {s.nav.register}
    </a>
  )
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-pine-900/95 text-white backdrop-blur-md">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-pine">
        {s.header.skip}
      </a>
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 lg:px-6">
        <a href={HOME_URL} className="flex min-w-0 items-center gap-3">
          <Logo />
          <span className="min-w-0 leading-tight">
            <span className="font-display block truncate text-[15px] font-semibold sm:text-[17px]">{s.header.brand}</span>
            <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-cedar sm:text-[11px]">{s.header.brandSub}</span>
          </span>
        </a>
        <nav aria-label="Primary" className="ml-4 hidden items-center gap-0.5 text-sm font-medium xl:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="rounded-full px-3 py-2 text-white/80 transition hover:bg-white/10 hover:text-white">
              {l.label}
            </a>
          ))}
          <a
            href={FACILITIES_URL}
            aria-current={home ? undefined : 'page'}
            className={`ml-1 rounded-full px-3 py-2 font-semibold transition ${home ? 'text-cedar hover:bg-white/10' : 'bg-white/15 text-white'}`}
          >
            {s.nav.facilities}
          </a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:block">
            <SeasonToggle />
          </div>
          <LangToggle />
          {lineUrl && (
            <a href={lineUrl} className="hidden items-center gap-1.5 rounded-full bg-[#06c755] px-3.5 py-2 text-sm font-bold text-white sm:flex">
              <MessageCircle size={16} aria-hidden />
              {s.header.line}
            </a>
          )}
          <div className="hidden sm:block">{register}</div>
          <button type="button" className="grid h-10 w-10 place-items-center rounded-full border border-white/20 xl:hidden" aria-expanded={open} aria-label={s.nav.menu} onClick={() => setOpen(!open)}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-white/10 bg-pine-900 px-4 pb-5 pt-3 xl:hidden">
          <nav aria-label="Mobile" className="grid gap-1 text-[15px] font-medium">
            <a href={FACILITIES_URL} className="rounded-xl bg-white/10 px-4 py-3 font-semibold text-cedar" onClick={() => setOpen(false)}>
              {s.nav.facilities}
            </a>
            {links.map((l) => (
              <a key={l.href} href={l.href} className="rounded-xl px-4 py-3 text-white/90 hover:bg-white/10" onClick={() => setOpen(false)}>
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <SeasonToggle />
            {register}
          </div>
        </div>
      )}
    </header>
  )
}
