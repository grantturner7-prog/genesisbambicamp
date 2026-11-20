import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Check, Download, X } from 'lucide-react'
import { campConfig } from '../config/campConfig'
import { useCamp } from '../i18n/CampState'
import type { Season } from '../lib/types'
import { CONSENTS, COUPONS, PRICING, REFUND } from './content'

const fmtTWD = (n: number) => `NT$${Math.round(n).toLocaleString('en-US')}`

/* ───────────────────────────────────────────────────────── Refund calculator */
type Reason = 'family' | 'lowEnrollment' | 'forceMajeure'

/** Statutory refund calculator (Domestic Travel Standard Contract, Art. 12/13). */
export function RefundCalculator() {
  const { s, t, season } = useCamp()
  const offer = campConfig.sessions[season]
  const [fee, setFee] = useState<string>(offer?.fee != null ? String(offer.fee) : '')
  const [days, setDays] = useState<string>('45')
  const [reason, setReason] = useState<Reason>('family')
  const feeN = Math.max(0, Number(fee) || 0)
  const daysN = Math.floor(Number(days))
  const tier = REFUND.tiers.find((x) => daysN >= x.min && daysN <= x.max) ?? REFUND.tiers[REFUND.tiers.length - 1]
  const pct = reason === 'family' ? tier.refund : 100
  const valid = fee !== '' && days !== '' && Number.isFinite(daysN)
  const input = 'mt-1 w-full rounded-xl border border-pine/20 bg-white px-3.5 py-2.5 text-[15px] font-semibold text-pine-900 outline-none focus:border-cedar-600'
  return (
    <div id="refund" className="mt-5 scroll-mt-20 rounded-3xl border border-pine/10 bg-white p-6 shadow-sm">
      <h3 className="font-display text-2xl font-semibold text-pine">{t(REFUND.title)}</h3>
      <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-ink/70">{t(REFUND.intro)}</p>
      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <fieldset>
            <legend className="text-[13px] font-bold text-ink/70">{s.home.refundReason}</legend>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {(Object.keys(REFUND.reasons) as Reason[]).map((r) => (
                <button key={r} type="button" aria-pressed={reason === r} onClick={() => setReason(r)} className={`rounded-full border px-3.5 py-2 text-[13px] font-semibold ${reason === r ? 'border-pine bg-pine text-white' : 'border-pine/20 text-pine hover:border-pine/50'}`}>
                  {t(REFUND.reasons[r])}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="text-[13px] font-bold text-ink/70">
              {s.home.refundFee}
              <input className={input} inputMode="numeric" value={fee} onChange={(e) => setFee(e.target.value.replace(/[^\d]/g, ''))} placeholder="0" />
            </label>
            <label className={`text-[13px] font-bold text-ink/70 ${reason !== 'family' ? 'opacity-40' : ''}`}>
              {s.home.refundDays}
              <input className={input} type="number" min={0} value={days} disabled={reason !== 'family'} onChange={(e) => setDays(e.target.value)} />
            </label>
          </div>
          <div className="mt-4 rounded-2xl bg-pine p-5 text-white" aria-live="polite">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cedar">{s.home.refundResult}</p>
            <p className="font-display mt-1 text-4xl font-semibold" data-refund-amount>
              {valid ? fmtTWD((feeN * pct) / 100) : '—'}
              <span className="ml-2 text-xl text-cedar-100">{pct}%</span>
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/80">
              {reason === 'family' ? `${t(tier.label)} · ${s.home.refundDeducted} ${valid ? fmtTWD((feeN * (100 - pct)) / 100) : '—'}（${100 - pct}%）` : t(REFUND[reason])}
            </p>
          </div>
        </div>
        <div>
          <table className="w-full overflow-hidden rounded-2xl text-left text-sm">
            <thead className="bg-parchment-200 text-xs uppercase tracking-wider text-ink/60">
              <tr>
                <th className="px-4 py-2.5 font-bold">{s.home.refundWhen}</th>
                <th className="px-4 py-2.5 text-right font-bold">{s.home.refundRate}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pine/10">
              {REFUND.tiers.map((x) => (
                <tr key={x.refund} className={reason === 'family' && x === tier ? 'bg-cedar-100/70 font-bold text-pine-900' : 'text-ink/80'}>
                  <td className="px-4 py-2.5">{t(x.label)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{x.refund}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-[13px] leading-relaxed text-ink/65">{t(REFUND.reverse)}</p>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────────────────────────────────────── Registration modal */
interface Form {
  season: Season
  /** Optional snack coupon pack in TWD ('' = none). */
  coupon: string
  camper: string
  dob: string
  gender: string
  guardian: string
  relation: string
  mobile: string
  email: string
  address: string
  backup: string
  diet: string[]
  dietOther: string
  allergies: string
  conditions: string
  medications: string
  water: string
}

function Field({ label, children, required }: { label: string; children: ReactNode; required?: boolean }) {
  return (
    <label className="block text-[13px] font-bold text-ink/70">
      {label}
      {required && <span className="text-red-700"> *</span>}
      {children}
    </label>
  )
}

const SEASONS: Season[] = ['winter', 'summer']

/** 3-step registration with five separate consent boxes (Doc 3, Part 5). Nothing is transmitted without an endpoint. */
export function RegisterModal({ onClose }: { onClose: () => void }) {
  const { s, t, season, lang } = useCamp()
  const R = s.register
  const [step, setStep] = useState(1)
  // only a camp with dates can be registered for
  const open = SEASONS.filter((k) => campConfig.sessions[k])
  const [f, setF] = useState<Form>({ season: campConfig.sessions[season] ? season : (open[0] ?? season), coupon: '', camper: '', dob: '', gender: '', guardian: '', relation: '', mobile: '', email: '', address: '', backup: '', diet: [], dietOther: '', allergies: '', conditions: '', medications: '', water: '' })
  // Consent 5 (media) is optional and unchecked by default.
  const [consent, setConsent] = useState<Record<string, boolean>>({})
  const [err, setErr] = useState('')
  const [state, setState] = useState<'form' | 'sending' | 'sent' | 'local'>('form')
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }))
  const input = 'mt-1 w-full rounded-xl border border-pine/20 bg-white px-3.5 py-2.5 text-[15px] font-medium text-pine-900 outline-none focus:border-cedar-600'
  const endpoint = campConfig.registration.endpoint
  const pdf = campConfig.registration.contractPdfUrl
  // the dated camp of the chosen season, if its dates are set
  const chosen = campConfig.sessions[f.season]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const summary = useMemo(() => {
    const L = (k: string, v: string) => `${k}: ${v || '-'}`
    return [
      campConfig.brand[lang === 'en' ? 'en' : 'zh'],
      L(R.session, `${s.seasons[f.season]} · ${t(PRICING.camp.name)}`),
      L(t(COUPONS.label), f.coupon ? t(COUPONS.pack(Number(f.coupon))) : t(COUPONS.none)),
      L(R.camper, f.camper),
      L(R.dob, f.dob),
      L(R.gender, f.gender),
      L(R.guardian, `${f.guardian} (${f.relation})`),
      L(R.mobile, f.mobile),
      L(R.email, f.email),
      L(R.address, f.address),
      L(R.backup, f.backup),
      L(R.diet, [...f.diet, f.dietOther].filter(Boolean).join(', ')),
      L(R.allergies, f.allergies),
      L(R.conditions, f.conditions),
      L(R.medications, f.medications),
      L(R.water, f.water),
      ...CONSENTS.map((c, i) => `[${consent[c.key] ? 'x' : ' '}] ${i + 1}. ${t(c.title)}`),
    ].join('\n')
  }, [f, consent, lang, R, s, t])

  const next = () => {
    if (step === 1 && !(f.camper && f.dob && f.gender && f.guardian && f.relation && f.mobile && f.address)) return setErr(R.missing)
    if (step === 2 && !f.water) return setErr(R.missing)
    setErr('')
    setStep(step + 1)
  }
  const submit = async () => {
    if (CONSENTS.some((c) => c.required && !consent[c.key])) return setErr(R.consentMissing)
    setErr('')
    if (!endpoint) return setState('local')
    setState('sending')
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...f, consent, lang }) })
      if (!res.ok) throw new Error(String(res.status))
      setState('sent')
    } catch {
      setState('form')
      setErr(R.sendFailed)
    }
  }
  const download = () => {
    const url = URL.createObjectURL(new Blob([summary], { type: 'text/plain;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'camp-registration-summary.txt'
    a.click()
    URL.revokeObjectURL(url)
  }
  const diets = [R.dietNoBeef, R.dietNoPork, R.dietVeg]

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-pine-900/70 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={R.title} data-register-modal>
      <div className="flex max-h-[94svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-parchment shadow-2xl sm:rounded-3xl">
        <header className="flex items-center gap-4 bg-pine px-6 py-4 text-white">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-semibold">{R.title}</h2>
            <ol className="mt-2 flex gap-2 text-[11px] font-bold uppercase tracking-wider">
              {[R.step1, R.step2, R.step3].map((n, i) => (
                <li key={n} className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${step === i + 1 ? 'bg-cedar text-pine-900' : step > i + 1 ? 'bg-white/20' : 'bg-white/10 text-white/60'}`}>
                  {step > i + 1 ? <Check size={12} aria-hidden /> : i + 1}
                  <span className="hidden sm:inline">{n}</span>
                </li>
              ))}
            </ol>
          </div>
          <button type="button" onClick={onClose} aria-label={s.map.close} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 hover:bg-white/25">
            <X size={18} />
          </button>
        </header>

        <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {state === 'sent' && <p className="rounded-2xl bg-emerald-50 p-5 text-[15px] font-semibold text-emerald-900">{R.sent}</p>}
          {state === 'local' && (
            <div>
              <p className="rounded-2xl bg-amber-50 p-5 text-[15px] leading-relaxed text-amber-950">{R.notOpen}</p>
              <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-2xl border border-pine/10 bg-white p-4 text-xs leading-relaxed text-ink/80">{summary}</pre>
              <button type="button" onClick={download} className="mt-4 flex items-center gap-2 rounded-full bg-pine px-5 py-3 text-sm font-bold text-white">
                <Download size={16} aria-hidden />
                {R.download}
              </button>
            </div>
          )}
          {(state === 'form' || state === 'sending') && step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={R.session} required>
                <select className={input} value={f.season} onChange={(e) => set('season', e.target.value as Season)}>
                  {SEASONS.map((k) => {
                    const name = k === 'winter' ? s.seasons.winterLong : s.seasons.summerLong
                    const soon = t(PRICING.comingSoon)
                    return (
                      <option key={k} value={k} disabled={!campConfig.sessions[k]}>
                        {campConfig.sessions[k] ? name : lang === 'en' ? `${name} (${soon})` : `${name}（${soon}）`}
                      </option>
                    )
                  })}
                </select>
              </Field>
              <p className="self-end pb-2.5 text-[13px] font-semibold text-pine" data-register-dates>
                {chosen ? `${t(chosen.dates)}${chosen.pilot ? ` · ${t(PRICING.pilotLimit(chosen.pilot.maxCampers))}` : ''}` : t(PRICING.comingSoon)}
              </p>
              <p className="rounded-xl bg-cedar-100/70 px-4 py-3 text-[13px] font-medium leading-relaxed text-pine-900 sm:col-span-2" data-register-note>
                {t(PRICING.camp.bus)}
              </p>
              <Field label={R.camper} required>
                <input className={input} value={f.camper} onChange={(e) => set('camper', e.target.value)} autoComplete="off" />
              </Field>
              <Field label={R.dob} required>
                <input className={input} type="date" value={f.dob} onChange={(e) => set('dob', e.target.value)} />
              </Field>
              <Field label={R.gender} required>
                <select className={input} value={f.gender} onChange={(e) => set('gender', e.target.value)}>
                  <option value="" />
                  <option>{R.girl}</option>
                  <option>{R.boy}</option>
                </select>
              </Field>
              <Field label={R.guardian} required>
                <input className={input} value={f.guardian} onChange={(e) => set('guardian', e.target.value)} autoComplete="name" />
              </Field>
              <Field label={R.relation} required>
                <input className={input} value={f.relation} onChange={(e) => set('relation', e.target.value)} />
              </Field>
              <Field label={R.mobile} required>
                <input className={input} type="tel" value={f.mobile} onChange={(e) => set('mobile', e.target.value)} autoComplete="tel" />
              </Field>
              <Field label={R.email}>
                <input className={input} value={f.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" />
              </Field>
              <Field label={R.backup}>
                <input className={input} value={f.backup} onChange={(e) => set('backup', e.target.value)} />
              </Field>
              <div className="sm:col-span-2">
                <Field label={R.address} required>
                  <input className={input} value={f.address} onChange={(e) => set('address', e.target.value)} autoComplete="street-address" />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label={t(COUPONS.label)}>
                  <select className={input} value={f.coupon} data-register-coupon onChange={(e) => set('coupon', e.target.value)}>
                    <option value="">{t(COUPONS.none)}</option>
                    {campConfig.snackShop.couponPacks.map((n) => (
                      <option key={n} value={n}>
                        {t(COUPONS.pack(n))}
                      </option>
                    ))}
                  </select>
                </Field>
                <p className="mt-1.5 text-[12px] leading-relaxed text-ink/60">{t(COUPONS.hint)}</p>
                {campConfig.snackShop.couponTerms && <p className="mt-1 text-[12px] leading-relaxed text-ink/60">{t(campConfig.snackShop.couponTerms)}</p>}
              </div>
            </div>
          )}
          {(state === 'form' || state === 'sending') && step === 2 && (
            <div className="grid gap-4">
              <p className="rounded-xl bg-emerald-50 px-4 py-3 text-[13px] leading-relaxed text-emerald-900">{R.healthNote}</p>
              <fieldset>
                <legend className="text-[13px] font-bold text-ink/70">{R.diet}</legend>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {diets.map((d) => (
                    <label key={d} className={`cursor-pointer rounded-full border px-3.5 py-2 text-[13px] font-semibold ${f.diet.includes(d) ? 'border-pine bg-pine text-white' : 'border-pine/20 text-pine'}`}>
                      <input type="checkbox" className="sr-only" checked={f.diet.includes(d)} onChange={() => set('diet', f.diet.includes(d) ? f.diet.filter((x) => x !== d) : [...f.diet, d])} />
                      {d}
                    </label>
                  ))}
                </div>
                <input className={input} placeholder={R.dietOther} value={f.dietOther} onChange={(e) => set('dietOther', e.target.value)} />
              </fieldset>
              <Field label={R.allergies}>
                <textarea className={input} rows={2} value={f.allergies} onChange={(e) => set('allergies', e.target.value)} placeholder={R.noneHint} />
              </Field>
              <Field label={R.conditions}>
                <textarea className={input} rows={2} value={f.conditions} onChange={(e) => set('conditions', e.target.value)} placeholder={R.noneHint} />
              </Field>
              <Field label={R.medications}>
                <textarea className={input} rows={2} value={f.medications} onChange={(e) => set('medications', e.target.value)} placeholder={R.noneHint} />
              </Field>
              <Field label={R.water} required>
                <select className={input} value={f.water} onChange={(e) => set('water', e.target.value)}>
                  <option value="" />
                  <option>{R.waterNon}</option>
                  <option>{R.waterBeginner}</option>
                  <option>{R.waterComfortable}</option>
                </select>
              </Field>
            </div>
          )}
          {(state === 'form' || state === 'sending') && step === 3 && (
            <div>
              <p className="text-sm leading-relaxed text-ink/75">
                {R.consentIntro}{' '}
                {pdf ? (
                  <a href={pdf} target="_blank" rel="noreferrer" className="font-bold text-cedar-600 underline">
                    {R.contractPdf}
                  </a>
                ) : (
                  <span className="font-semibold text-ink/60">{R.contractPending}</span>
                )}
              </p>
              <ul className="mt-4 space-y-3">
                {CONSENTS.map((c, i) => (
                  <li key={c.key}>
                    <label className={`flex cursor-pointer gap-3 rounded-2xl border p-4 ${consent[c.key] ? 'border-emerald-300 bg-emerald-50' : 'border-pine/15 bg-white'}`}>
                      <input type="checkbox" data-consent={c.key} checked={!!consent[c.key]} onChange={() => setConsent((p) => ({ ...p, [c.key]: !p[c.key] }))} className="mt-0.5 h-5 w-5 shrink-0 accent-[#1b4332]" />
                      <span>
                        <span className="block text-[15px] font-bold text-pine-900">
                          {i + 1}. {t(c.title)}
                          <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${c.required ? 'bg-pine text-white' : 'bg-cedar-100 text-cedar-600'}`}>{c.required ? R.required : R.optional}</span>
                        </span>
                        <span className="mt-1 block text-[13px] leading-relaxed text-ink/70">{t(c.body)}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {err && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
              {err}
            </p>
          )}
        </div>

        {(state === 'form' || state === 'sending') && (
          <footer className="flex items-center justify-between gap-3 border-t border-pine/10 bg-white px-6 py-4">
            <button type="button" onClick={() => (step === 1 ? onClose() : (setErr(''), setStep(step - 1)))} className="rounded-full px-4 py-2.5 text-sm font-bold text-pine hover:bg-pine/5">
              {step === 1 ? s.map.close : R.back}
            </button>
            {step < 3 ? (
              <button type="button" onClick={next} data-register-next className="rounded-full bg-pine px-6 py-3 text-sm font-bold text-white hover:bg-pine-800">
                {R.next}
              </button>
            ) : (
              <button type="button" onClick={submit} disabled={state === 'sending'} data-register-submit className="rounded-full bg-cedar px-6 py-3 text-sm font-bold text-pine-900 hover:brightness-105 disabled:opacity-60">
                {R.submit}
              </button>
            )}
          </footer>
        )}
      </div>
    </div>
  )
}
