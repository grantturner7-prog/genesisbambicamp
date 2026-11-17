import { useEffect, useState, type ReactNode } from 'react'
import { ArrowRight, Check, ChevronDown, MapPin, Star, X } from 'lucide-react'
import { Kicker, SeasonToggle } from '../components/ui'
import { campConfig } from '../config/campConfig'
import { useCamp } from '../i18n/CampState'
import { FACILITIES_URL, ROOT } from '../lib/root'
import { Icon } from '../map/icons'
import { PHOTO_CREDIT, photoSrc } from '../media/media'
import { ACTIVITIES, FAMILY, FAQ, HERO, PACKING, PRICING, SAFETY, SEASON_INTRO, STAY } from './content'

/** Which option a Register button opens the form on. */
export type CampOption = 'A' | 'B' | 'C'

const fmtTWD = (n: number) => `NT$${n.toLocaleString('en-US')}`

export function Section({ id, tone = 'light', children }: { id: string; tone?: 'light' | 'cream' | 'dark'; children: ReactNode }) {
  const bg = tone === 'dark' ? 'bg-pine text-white' : tone === 'cream' ? 'bg-parchment-200/60' : 'bg-parchment'
  return (
    <section id={id} className={`scroll-mt-16 ${bg}`}>
      <div className="mx-auto max-w-[1240px] px-5 py-16 sm:py-24 lg:px-8">{children}</div>
    </section>
  )
}
export function Heading({ kicker, title, intro, dark }: { kicker: string; title: string; intro?: string; dark?: boolean }) {
  return (
    <div className="max-w-2xl">
      <Kicker className={dark ? '!text-cedar' : ''}>{kicker}</Kicker>
      <h2 className={`font-display mt-2 text-3xl font-semibold leading-tight tracking-tight sm:text-[2.6rem] ${dark ? 'text-white' : 'text-pine'}`}>{title}</h2>
      {intro && <p className={`mt-4 text-[17px] leading-relaxed ${dark ? 'text-white/80' : 'text-ink/75'}`}>{intro}</p>}
    </div>
  )
}

/* ───────────────────────────────────────────────────────── Hero */
export function Hero({ onRegister }: { onRegister: () => void }) {
  const { s, t, season } = useCamp()
  const offerA = campConfig.sessions[season].optionA
  const m = s.hero.metrics
  return (
    <section className="relative isolate overflow-hidden bg-pine-900 text-white">
      <img key={season} src={photoSrc(HERO.photo[season])} alt="" className="rise-in absolute inset-0 -z-10 h-full w-full object-cover" fetchPriority="high" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-pine-900/85 via-pine-900/40 to-transparent" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-pine-900/85 via-transparent to-pine-900/30" />
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-[1240px] flex-col justify-end px-5 pb-8 pt-20 lg:px-8">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cedar/60 bg-cedar/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-cedar-100">{s.hero.badge}</span>
            <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">{offerA ? t(offerA.dates) : t(HERO.datesPending)}</span>
            <a href="#family-camp" data-family-pill className="flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur transition hover:bg-white/20">
              {t(HERO.familyCamp)}
              <ArrowRight size={12} aria-hidden />
            </a>
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.24em] text-cedar">{s.hero.kicker}</p>
          <h1 className="font-display mt-2 text-[2.6rem] font-semibold leading-[1.04] tracking-tight sm:text-6xl">{s.hero.headline[season]}</h1>
          <p className="mt-4 text-lg leading-relaxed text-white/90 sm:text-xl">{s.hero.subtitle}</p>
          <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-cedar-100">
            <MapPin size={16} aria-hidden />
            {s.hero.location}
          </p>
          <ul className="mt-5 space-y-1.5 text-[15px] text-white/90">
            {HERO.points.map((p) => (
              <li key={p.en} className="flex items-start gap-2">
                <Check size={17} className="mt-1 shrink-0 text-cedar" aria-hidden />
                {t(p)}
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => onRegister()} className="rounded-full bg-cedar px-6 py-3.5 text-[15px] font-bold text-pine-900 shadow-lg transition hover:brightness-105">
              {s.nav.register}
            </button>
            <a href={FACILITIES_URL} className="flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 py-3.5 text-[15px] font-bold backdrop-blur transition hover:bg-white/20">
              {s.nav.facilities}
              <ArrowRight size={17} aria-hidden />
            </a>
          </div>
        </div>
        <dl className="glass mt-10 grid grid-cols-2 rounded-2xl sm:grid-cols-5">
          {(['campers', 'ratio', 'nurse', 'vans', 'insurance'] as const).map((k, i) => (
            <div key={k} className={`px-5 py-4 ${i ? 'sm:border-l sm:border-white/10' : ''} ${k === 'insurance' ? 'col-span-2 sm:col-span-1' : ''}`}>
              <dd className="font-display text-3xl font-semibold text-cedar-100">{m[k].value}</dd>
              <dt className="mt-1 text-xs leading-snug text-white/75">{m[k].label}</dt>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-right text-[10px] text-white/50">{t(PHOTO_CREDIT)}</p>
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────────────── Season explorer */
export function SeasonExplorer() {
  const { s, t, season } = useCamp()
  const list = ACTIVITIES.filter((a) => a.seasons.includes(season))
  return (
    <Section id="seasons">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <Heading kicker={s.home.seasonsKicker} title={t(SEASON_INTRO[season].title)} intro={t(SEASON_INTRO[season].body)} />
        <SeasonToggle tone="light" />
      </div>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((a) => (
          <li key={a.name.en} className={`group flex flex-col overflow-hidden rounded-3xl border bg-white shadow-sm ${a.highlight ? 'border-cedar ring-2 ring-cedar/30' : 'border-pine/10'}`}>
            {a.photo && (
              <div className="relative aspect-[16/9] overflow-hidden">
                <img src={photoSrc(a.photo)} alt="" loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                {a.highlight && (
                  <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-cedar px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-pine-900">
                    <Star size={11} fill="currentColor" aria-hidden />
                    {s.map.highlight}
                  </span>
                )}
              </div>
            )}
            <div className="flex flex-1 flex-col p-5">
              <span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-pine/8 text-pine">
                <Icon name={a.icon} size={20} />
              </span>
              <h3 className="text-[17px] font-bold leading-snug text-pine-900">{t(a.name)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/70">{t(a.body)}</p>
              {a.spot && (
                <a href={`${FACILITIES_URL}#${a.spot}`} className="mt-auto flex items-center gap-1 pt-4 text-[13px] font-bold text-cedar-600 hover:underline">
                  {s.home.seeOnMap}
                  <ArrowRight size={14} aria-hidden />
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  )
}

/* ───────────────────────────────────────────────────────── Facilities teaser */
export function FacilitiesTeaser() {
  const { s } = useCamp()
  return (
    <section className="bg-pine-900">
      <a href={FACILITIES_URL} className="group relative block overflow-hidden">
        <img src={`${ROOT}media/map-preview.webp`} alt="" loading="lazy" className="h-[420px] w-full object-cover transition duration-700 group-hover:scale-[1.03] sm:h-[520px]" />
        <div className="absolute inset-0 bg-gradient-to-r from-pine-900/90 via-pine-900/45 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-[1240px] px-5 text-white lg:px-8">
            <Kicker className="!text-cedar">{s.map.kicker}</Kicker>
            <h2 className="font-display mt-2 max-w-lg text-3xl font-semibold leading-tight sm:text-5xl">{s.map.title}</h2>
            <p className="mt-4 max-w-md text-[17px] leading-relaxed text-white/85">{s.map.intro}</p>
            <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-cedar px-6 py-3.5 text-[15px] font-bold text-pine-900 shadow-lg">
              {s.home.openMap}
              <ArrowRight size={17} aria-hidden />
            </span>
          </div>
        </div>
      </a>
    </section>
  )
}

/* ───────────────────────────────────────────────────────── Stay & meals */
export function Stay() {
  const { s, t } = useCamp()
  return (
    <Section id="stay" tone="cream">
      <Heading kicker={s.home.stayKicker} title={s.home.stayTitle} intro={s.home.stayIntro} />
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {STAY.cards.map((c) => (
          <article key={c.title.en} className="overflow-hidden rounded-3xl border border-pine/10 bg-white shadow-sm">
            <img src={photoSrc(c.photo)} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
            <div className="p-5">
              <h3 className="text-lg font-bold text-pine-900">{t(c.title)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/70">{t(c.body)}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_1fr]" data-meals>
        <div className="rounded-3xl border border-pine/10 bg-white p-6 shadow-sm">
          <h3 className="font-display text-2xl font-semibold text-pine">{t(STAY.mealsTitle)}</h3>
          <ol className="mt-4 divide-y divide-pine/10">
            {STAY.meals.map((m) => (
              <li key={m.name.en} className="flex items-start gap-4 py-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cedar-100 text-cedar-600">
                  <Icon name={m.icon} size={19} />
                </span>
                <span>
                  <span className="block text-[16px] font-bold text-pine-900">{t(m.name)}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-ink/70">{t(m.note)}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">{t(STAY.diet)}</p>
        </div>
        <article className="relative isolate flex min-h-[27rem] flex-col justify-end overflow-hidden rounded-3xl bg-pine-900 text-white shadow-lg ring-2 ring-cedar/50 lg:min-h-80" data-signature-dinner>
          <img src={photoSrc(STAY.signature.photo)} alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-pine-900 via-pine-900/70 to-pine-900/10" />
          <div className="p-6">
            <span className="inline-flex items-center gap-1 rounded-full bg-cedar px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-pine-900">
              <Star size={11} fill="currentColor" aria-hidden />
              {t(STAY.signature.kicker)}
            </span>
            <h3 className="font-display mt-3 text-2xl font-semibold leading-snug sm:text-[1.75rem]">{t(STAY.signature.title)}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-white/85">{t(STAY.signature.body)}</p>
          </div>
        </article>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <div className="rounded-3xl border border-pine/10 bg-white p-6 shadow-sm" data-snack-coupons>
          <h3 className="flex items-center gap-2.5 font-display text-2xl font-semibold text-pine">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cedar-100 text-cedar-600">
              <Icon name="Ticket" size={19} />
            </span>
            {t(STAY.snacks.title)}
          </h3>
          <p className="mt-3 text-[15px] leading-relaxed text-ink/75">{t(STAY.snacks.body)}</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {campConfig.snackShop.couponPacks.map((n) => (
              <li key={n} className="rounded-full border border-cedar/50 bg-cedar-100/60 px-3.5 py-1.5 text-sm font-bold tabular-nums text-pine-900">
                {fmtTWD(n)}
              </li>
            ))}
          </ul>
          {campConfig.snackShop.couponTerms && <p className="mt-3 text-[13px] leading-relaxed text-ink/65">{t(campConfig.snackShop.couponTerms)}</p>}
          <a href={`${FACILITIES_URL}#snack`} className="mt-4 inline-flex items-center gap-1 text-[13px] font-bold text-cedar-600 hover:underline">
            {t(STAY.snacks.link)}
            <ArrowRight size={14} aria-hidden />
          </a>
        </div>
        {/* on wide screens the photos take the height of the coupon card instead of stretching it */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:h-0 lg:min-h-full lg:grid-cols-2 lg:grid-rows-2">
          {(['buffet-eggs', 'breakfast-plate', 'buffet-fruit-yogurt', 'pizza-fresh'] as const).map((id) => (
            <img key={id} src={photoSrc(id)} alt="" loading="lazy" className="h-full min-h-32 w-full rounded-2xl object-cover lg:min-h-0" />
          ))}
        </div>
      </div>
      <p className="mt-3 text-right text-[11px] text-ink/45">{t(PHOTO_CREDIT)}</p>
    </Section>
  )
}

/* ───────────────────────────────────────────────────────── Safety & insurance */
export function Safety() {
  const { s, t } = useCamp()
  return (
    <Section id="safety" tone="dark">
      <Heading dark kicker={s.home.safetyKicker} title={s.home.safetyTitle} />
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SAFETY.staff.map((x) => (
          <li key={x.title.en} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-cedar/20 text-cedar">
              <Icon name={x.icon} size={22} />
            </span>
            <h3 className="mt-4 text-[17px] font-bold">{t(x.title)}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-white/75">{t(x.body)}</p>
          </li>
        ))}
      </ul>
      <h3 className="font-display mt-12 text-2xl font-semibold">{t(SAFETY.insuranceTitle)}</h3>
      <ol className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {SAFETY.insurance.map((x) => (
          <li key={x.n} className="rounded-3xl bg-parchment p-5 text-pine-900">
            <span className="font-display text-4xl font-semibold text-cedar">{x.n}</span>
            <h4 className="mt-1 text-[16px] font-bold leading-snug">{t(x.title)}</h4>
            <p className="mt-0.5 text-xs font-bold uppercase tracking-wider text-cedar-600">{t(x.by)}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink/75">{t(x.body)}</p>
          </li>
        ))}
      </ol>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <p className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-relaxed text-white/80">{t(SAFETY.under15)}</p>
        <p className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-relaxed text-white/80">{t(SAFETY.duty)}</p>
      </div>
    </Section>
  )
}

/* ───────────────────────────────────────────────────────── Pricing */
export function Pricing({ onRegister, children }: { onRegister: (option?: CampOption) => void; children?: ReactNode }) {
  const { s, t, season } = useCamp()
  const ses = campConfig.sessions[season]
  const ta = campConfig.travelAgency
  const fam = campConfig.familyCamp
  const pending = s.footer.pending
  const card = (key: 'optionA' | 'optionB') => {
    const o = PRICING[key]
    const offer = ses[key]
    return (
      <article key={key} className="flex flex-col rounded-3xl border border-pine/10 bg-white p-6 shadow-sm">
        <h3 className="font-display text-2xl font-semibold text-pine">{t(o.name)}</h3>
        <p className="mt-1 text-sm font-semibold text-ink/60">{t(o.when)}</p>
        <p className="mt-4 text-sm font-semibold text-cedar-600">{offer ? t(offer.dates) : t(PRICING.datesPending)}</p>
        <p className="font-display mt-1 text-4xl font-semibold text-pine-900">{offer ? fmtTWD(offer.fee) : t(PRICING.feePending)}</p>
        <p className="mt-4 text-sm leading-relaxed text-ink/75">{t(PRICING.shared)}</p>
        <p className="mb-5 mt-2 rounded-xl bg-cedar-100/70 px-4 py-3 text-sm font-medium text-pine-900">{t(o.bus)}</p>
        <button type="button" aria-label={`${s.nav.register}: ${t(o.name)}`} data-register-open={key === 'optionA' ? 'A' : 'B'} onClick={() => onRegister(key === 'optionA' ? 'A' : 'B')} className="mt-auto rounded-full bg-pine px-5 py-3 text-[15px] font-bold text-white transition hover:bg-pine-800">
          {s.nav.register}
        </button>
      </article>
    )
  }
  return (
    <Section id="pricing" tone="cream">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <Heading kicker={s.home.pricingKicker} title={s.home.pricingTitle} intro={s.home.pricingIntro} />
        <SeasonToggle tone="light" />
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-2">{(['optionA', 'optionB'] as const).map(card)}</div>
      <article id="family-camp" className="mt-5 scroll-mt-20 overflow-hidden rounded-3xl border-2 border-cedar/60 bg-white shadow-sm" data-family-camp>
        <div className="grid lg:grid-cols-[1fr_1.3fr]">
          <div className="flex flex-col p-6">
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-cedar px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-pine-900">
              <Star size={11} fill="currentColor" aria-hidden />
              {t(FAMILY.badge)}
            </span>
            <h3 className="font-display mt-3 text-2xl font-semibold text-pine">{t(FAMILY.name)}</h3>
            <p className="mt-1 text-sm font-semibold text-ink/60">{t(FAMILY.who)}</p>
            <p className="mt-4 text-sm font-semibold text-cedar-600">{fam.dates ? t(fam.dates) : t(FAMILY.datesPending)}</p>
            {fam.fees?.length ? (
              <ul className="mt-2 divide-y divide-pine/10 text-[15px]">
                {fam.fees.map((x) => (
                  <li key={`${x.adults}-${x.campers}`} className="flex items-baseline justify-between gap-4 py-2">
                    <span className="font-semibold text-ink/75">{t(FAMILY.feeRow(x.adults, x.campers))}</span>
                    <span className="font-display text-2xl font-semibold tabular-nums text-pine-900">{fmtTWD(x.fee)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-display mt-1 text-4xl font-semibold text-pine-900">{t(FAMILY.feePending)}</p>
            )}
            <p className="mt-1.5 text-[13px] font-medium text-ink/60">{t(FAMILY.feeNote)}</p>
            <p className="mb-5 mt-4 text-sm leading-relaxed text-ink/75">{t(FAMILY.intro)}</p>
            <button type="button" aria-label={`${s.nav.register}: ${t(FAMILY.name)}`} data-register-open="C" onClick={() => onRegister('C')} className="mt-auto w-fit rounded-full bg-pine px-6 py-3 text-[15px] font-bold text-white transition hover:bg-pine-800">
              {s.nav.register}
            </button>
          </div>
          <ul className="grid content-center gap-3 bg-parchment-200/60 p-6">
            {FAMILY.facts.map((x) => (
              <li key={x.title.en} className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cedar-100 text-cedar-600">
                  <Icon name={x.icon} size={19} />
                </span>
                <span>
                  <span className="block text-[16px] font-bold text-pine-900">{t(x.title)}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-ink/70">{t(x.body)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </article>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="rounded-3xl border border-pine/10 bg-white p-6">
          <h3 className="flex items-center gap-2 text-lg font-bold text-pine-900">
            <Icon name="Bus" size={20} className="text-cedar-600" />
            {t(PRICING.busTitle)}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink/75">{t(PRICING.bus)}</p>
        </div>
        <div className="rounded-3xl border border-pine/10 bg-white p-6">
          <h3 className="flex items-center gap-2 text-lg font-bold text-pine-900">
            <Icon name="ShieldCheck" size={20} className="text-cedar-600" />
            {t(PRICING.guaranteeTitle)}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink/75">{t(PRICING.guarantee)}</p>
        </div>
        <div className="rounded-3xl border-2 border-cedar/60 bg-white p-6" data-agency-badge>
          <h3 className="flex items-center gap-2 text-lg font-bold text-pine-900">
            <Icon name="BadgeCheck" size={20} className="text-cedar-600" />
            {t(PRICING.agencyTitle)}
          </h3>
          <p className="mt-2 text-[15px] font-semibold text-pine-900">
            {ta.legalName ? t(ta.legalName) : pending}
            {ta.category ? `（${t(ta.category)}）` : ''}
          </p>
          <p className="text-[13px] text-ink/70">
            {s.footer.regNo}：{ta.tourismRegNo ?? pending} · {s.footer.tqaa}：{ta.tqaaNo ?? pending}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink/75">{t(PRICING.agency)}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="rounded-3xl border border-pine/10 bg-white p-6">
          <h3 className="text-lg font-bold text-pine-900">{s.home.included}</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink/80">
            {PRICING.included.map((x) => (
              <li key={x.en} className="flex gap-2">
                <Check size={17} className="mt-0.5 shrink-0 text-emerald-700" aria-hidden />
                {t(x)}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-pine/10 bg-white p-6">
          <h3 className="text-lg font-bold text-pine-900">{s.home.excluded}</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink/80">
            {PRICING.excluded.map((x) => (
              <li key={x.en} className="flex gap-2">
                <X size={17} className="mt-0.5 shrink-0 text-ink/40" aria-hidden />
                {t(x)}
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{t(PRICING.noExtra)}</p>
        </div>
      </div>
      {children}
    </Section>
  )
}

/* ───────────────────────────────────────────────────────── Packing */
export function Packing() {
  const { s, t, season } = useCamp()
  const key = `gya.packing.${season}`
  const [done, setDone] = useState<Record<string, boolean>>({})
  useEffect(() => {
    try {
      setDone(JSON.parse(window.localStorage.getItem(key) || '{}'))
    } catch {
      setDone({})
    }
  }, [key])
  const toggle = (id: string) => {
    const next = { ...done, [id]: !done[id] }
    setDone(next)
    try {
      window.localStorage.setItem(key, JSON.stringify(next))
    } catch {
      /* list still works for this visit */
    }
  }
  const items = PACKING.filter((p) => !p.season || p.season === season)
  const count = items.filter((p) => done[p.item.en]).length
  return (
    <Section id="packing">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <Heading kicker={s.home.packingKicker} title={s.home.packingTitle[season]} />
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold tabular-nums text-ink/60">
            {count} / {items.length}
          </span>
          <SeasonToggle tone="light" />
        </div>
      </div>
      <ul className="mt-8 grid gap-2.5 sm:grid-cols-2">
        {items.map((p) => {
          const id = p.item.en
          return (
            <li key={id}>
              <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${done[id] ? 'border-emerald-300 bg-emerald-50' : 'border-pine/10 bg-white hover:border-pine/30'}`}>
                <input type="checkbox" checked={!!done[id]} onChange={() => toggle(id)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#1b4332]" />
                <span className={`text-[15px] ${done[id] ? 'text-ink/50 line-through' : 'font-medium text-pine-900'}`}>
                  {t(p.item)}
                  {p.season && <span className="ml-2 rounded-full bg-cedar-100 px-2 py-0.5 text-[11px] font-bold text-cedar-600 no-underline">{s.seasons[p.season]}</span>}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}

/* ───────────────────────────────────────────────────────── FAQ */
export function Faq() {
  const { s, t } = useCamp()
  const [open, setOpen] = useState<number | null>(0)
  return (
    <Section id="faq" tone="cream">
      <Heading kicker={s.home.faqKicker} title={s.home.faqTitle} />
      <div className="mt-8 divide-y divide-pine/10 overflow-hidden rounded-3xl border border-pine/10 bg-white">
        {FAQ.map((f, i) => (
          <div key={f.q.en}>
            <h3>
              <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-[17px] font-bold text-pine-900 hover:bg-parchment/60">
                {t(f.q)}
                <ChevronDown size={20} className={`shrink-0 text-cedar-600 transition-transform ${open === i ? 'rotate-180' : ''}`} aria-hidden />
              </button>
            </h3>
            {open === i && <p className="px-6 pb-6 text-[15px] leading-relaxed text-ink/80">{t(f.a)}</p>}
          </div>
        ))}
      </div>
    </Section>
  )
}
