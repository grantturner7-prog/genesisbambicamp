import { campConfig } from '../config/campConfig'
import { useCamp } from '../i18n/CampState'
import { Logo } from './Header'

function Row({ k, v }: { k: string; v: string }) {
  return (
    <p className="text-[13px] leading-relaxed text-white/75">
      <span className="text-white/50">{k}：</span>
      {v}
    </p>
  )
}

/**
 * Global LegalFooter (Doc 3 §10): separate disclosures for the Activity Co-Organizer,
 * the Venue Partner and the Licensed Travel Agency (交觀 / 品保 numbers).
 * Fields still owed by partners render as "pending" and are listed by `npm run launch-check`.
 */
export function LegalFooter() {
  const { s, t } = useCamp()
  const { operator: op, travelAgency: ta, venue, cohort, compliance } = campConfig
  const pending = s.footer.pending
  return (
    <footer className="bg-pine-900 text-white">
      <div className="mx-auto max-w-[1400px] px-5 py-12 lg:px-8">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <p className="font-display text-lg font-semibold">{t({ en: campConfig.brand.en, zh: campConfig.brand.zh })}</p>
            <p className="text-xs text-white/60">{t(venue.address)}</p>
          </div>
        </div>
        <h2 id="legal" className="mt-8 scroll-mt-24 text-xs font-bold uppercase tracking-[0.2em] text-cedar">{s.footer.legalTitle}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="mb-2 text-sm font-bold text-cedar">{s.footer.coOrganizer}</h3>
            <p className="mb-1 text-[15px] font-semibold">{op.legalName ? t(op.legalName) : pending}</p>
            <Row k={s.footer.taxId} v={op.taxId ?? pending} />
            <Row k={s.footer.tel} v={op.phone ?? pending} />
            <Row k={s.footer.address} v={op.address ? t(op.address) : pending} />
            <Row k="LINE" v={op.lineId ?? pending} />
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="mb-2 text-sm font-bold text-cedar">{s.footer.venuePartner}</h3>
            <p className="mb-1 text-[15px] font-semibold">{t(venue.name)}</p>
            <Row k={s.footer.taxId} v={venue.taxId} />
            <Row k={s.footer.address} v={t(venue.address)} />
          </section>
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="mb-2 text-sm font-bold text-cedar">{s.footer.travelOrganizer}</h3>
            <p className="mb-1 text-[15px] font-semibold">
              {ta.legalName ? t(ta.legalName) : pending}
              {ta.category ? `（${t(ta.category)}）` : ''}
            </p>
            <Row k={s.footer.regNo} v={ta.tourismRegNo ?? pending} />
            <Row k={s.footer.tqaa} v={ta.tqaaNo ?? pending} />
            <Row k={s.footer.tel} v={ta.phone ?? pending} />
            <p className="mt-2 text-[13px] text-white/75">{s.footer.insured}</p>
          </section>
        </div>
        <p className="mt-6 text-[13px] leading-relaxed text-white/70">
          {s.footer.minEnroll.replace('{n}', String(cohort.minGroupSize ?? '—'))} {s.footer.moe}：{compliance.moeOrder}
        </p>
        <p className="mt-2 text-xs text-white/45">
          © {new Date().getFullYear()} {t({ en: campConfig.brand.en, zh: campConfig.brand.zh })}. {s.footer.rights} {s.footer.photoCredit}
        </p>
      </div>
    </footer>
  )
}
