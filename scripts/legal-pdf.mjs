// Legal notices as PDFs, for review by a lawyer: every notice the site publishes, word for
// word, English beside 繁體中文, taken from the same modules the site is built from.
//   node scripts/legal-pdf.mjs [outDir]        (default: docs/legal-review)
// Writes one PDF per subject and one with everything. Each line has a reference number.
import { createServer } from 'vite'
import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
const { chromium } = createRequire(import.meta.url)('playwright')

const root = process.cwd()
const out = path.resolve(process.argv[2] || 'docs/legal-review')
const vite = await createServer({ configFile: false, root, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent', optimizeDeps: { noDiscovery: true, include: [] } })
const load = (p) => vite.ssrLoadModule(p)
const [{ AREAS }, { strings }, home, { campConfig: c }] = await Promise.all([load('/src/map/areas.ts'), load('/src/i18n/strings.ts'), load('/src/home/content.ts'), load('/src/config/campConfig.ts')])
await vite.close()

// ── helpers ─────────────────────────────────────────────────────────────────────────────
const zhKey = Object.keys(strings).find((k) => k !== 'en')
const get = (o, p) => p.split('.').reduce((v, k) => v?.[k], o)
/** An interface string in both languages. */
const S = (p) => ({ en: get(strings.en, p), zh: get(strings[zhKey], p) })
const l = (en, zh) => ({ en, zh })
const isL = (v) => v && typeof v === 'object' && typeof v.en === 'string' && typeof v.zh === 'string'
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const twd = (n) => `NT$${n.toLocaleString('en-US')}`
const PENDING = S('footer.pending')
/** A value a partner still owes: shown as the site shows it. */
const pend = (v) => (v == null ? { ...PENDING, pending: true } : typeof v === 'string' || typeof v === 'number' ? l(String(v), String(v)) : v)
/** An item with several texts (title, body, note …): the first in bold, the rest below it. */
const item = (o) => {
  const parts = Object.values(o).filter(isL)
  const cell = (k) => parts.map((p, i) => (i ? esc(p[k]) : `<b>${esc(p[k])}</b>`)).join('<br>')
  return { en: cell('en'), zh: cell('zh'), html: true }
}
const row = (label, value) => [label, value]
const list = (label, items) => items.map((x, i) => row(`${label} ${i + 1}`, isL(x) ? x : item(x)))

const op = c.operator
const ta = c.travelAgency
const season = { winter: S('seasons.winterLong'), summer: S('seasons.summerLong') }
const pilotCap = Object.values(c.sessions).find((o) => o?.pilot)?.pilot.maxCampers ?? null
const area = (id) => AREAS.find((a) => a.id === id)

function campRows() {
  const rows = [row('Camp', home.PRICING.camp.name), row('Days', home.PRICING.camp.when), row('Arrival and return', home.PRICING.camp.bus), row('Section intro', S('home.pricingIntro')), row('Every camper gets', home.PRICING.shared)]
  for (const k of ['winter', 'summer']) {
    const o = c.sessions[k]
    rows.push(row(`${season[k].en}: dates`, o ? o.dates : { ...home.PRICING.comingSoon, pending: true }))
    rows.push(row(`${season[k].en}: fee`, o?.fee != null ? l(`${twd(o.fee)} ${home.PRICING.perCamper.en}`, `${twd(o.fee)} ${home.PRICING.perCamper.zh}`) : { ...home.PRICING.comingSoon, pending: true }))
    if (o?.pilot) rows.push(row(`${season[k].en}: limit`, l(`${home.PRICING.pilotBadge.en}. ${home.PRICING.pilotLimit(o.pilot.maxCampers).en}`, `${home.PRICING.pilotBadge.zh}。${home.PRICING.pilotLimit(o.pilot.maxCampers).zh}`)))
  }
  return rows
}

function areaBlocks(ids) {
  return ids.map((id) => {
    const a = area(id)
    const rows = []
    if (a.safety) rows.push(row('Rules heading', a.safety.title), ...list('Rule', a.safety.rules))
    for (const f of a.facts ?? []) rows.push(row(`Fact: ${f.label.en}`, l(`${f.label.en}: ${f.value.en}`, `${f.label.zh}：${f.value.zh}`)))
    for (const [k, v] of Object.entries(a.seasonNote ?? {})) if (isL(v)) rows.push(row(`Season note (${k})`, v))
    if (a.parentNote) rows.push(row('Note to parents', a.parentNote))
    if (a.menu) {
      rows.push(row('Menu introduction', a.menu.intro))
      for (const sec of a.menu.sections) rows.push(row(`Menu: ${sec.title.en}`, l(`${sec.title.en}${sec.tag ? ` (${sec.tag.en})` : ''}: ${sec.items.map((i) => i.name.en + (i.note ? ` (${i.note.en})` : '')).join('; ')}`, `${sec.title.zh}${sec.tag ? `（${sec.tag.zh}）` : ''}：${sec.items.map((i) => i.name.zh + (i.note ? `（${i.note.zh}）` : '')).join('；')}`)))
    }
    ;(a.menu?.footnotes ?? []).forEach((f, i) => rows.push(row(`Menu footnote ${i + 1}`, f)))
    return { title: a.name, where: 'Explore the Facilities › panel of this place', rows }
  })
}

const film = area('cinema')
const year = new Date().getFullYear()

// ── the notices, by subject ─────────────────────────────────────────────────────────────
const SECTIONS = [
  {
    file: '01-fees-refunds-guarantees',
    title: l('Fees, what is included, refunds and guarantees', '費用、費用內容、退費與保障'),
    where: 'Landing page › Dates & Fees, the refund calculator, and Stay & Meals (snack coupons)',
    open: [
      !c.sessions.summer && 'Summer camp: dates and fee are not set yet. The site shows "Coming soon" for it and takes no summer registrations.',
      c.payment.deposit == null && 'No deposit amount or balance due date is set, so the site states no payment schedule.',
      !c.snackShop.couponTerms && 'Snack coupons: how the packs are paid for, and what happens to unused coupons, is not stated anywhere yet.',
      c.cohort.minGroupSize != null && `Minimum group: the guarantee names ${c.cohort.minGroupSize} campers (a figure the partners were still to confirm)${pilotCap ? `, while the first camp is a pilot limited to ${pilotCap} campers` : ''}. Please check the two figures work together.`,
      !c.registration.contractPdfUrl && 'The service contract itself is not linked from the site yet. The refund tiers below are meant to mirror the Domestic Travel Standard Contract; please check them against the final contract.',
    ],
    blocks: [
      { title: l('The camp, its dates and its fee', '營隊、日期與費用'), where: 'Dates & Fees › camp card and section intro', rows: campRows() },
      { title: S('home.included'), where: 'Dates & Fees › Included', rows: list('Included', home.PRICING.included) },
      { title: S('home.excluded'), where: 'Dates & Fees › Not included', rows: [...list('Not included', home.PRICING.excluded), row('No other charges', home.PRICING.noExtra)] },
      { title: home.PRICING.busTitle, where: 'Dates & Fees › bus box', rows: [row('Heading', home.PRICING.busTitle), row('Text', home.PRICING.bus)] },
      { title: l('Guarantees', '保障'), where: 'Dates & Fees › guarantee boxes', rows: [row('Heading', home.PRICING.guaranteeTitle), row('Minimum-group guarantee', home.PRICING.guarantee), row('Heading', home.PRICING.agencyTitle), row('Travel agency statement', home.PRICING.agency)] },
      {
        title: l('Snack coupons', '點心券'),
        where: 'Stay & Meals › snack coupons; registration form',
        rows: [row('Landing page', item(home.STAY.snacks)), row('Form label', home.COUPONS.label), row('Form choice', home.COUPONS.none), ...c.snackShop.couponPacks.map((n) => row('Form choice', home.COUPONS.pack(n))), row('Form note', home.COUPONS.hint)],
      },
      {
        title: home.REFUND.title,
        where: 'Dates & Fees › refund calculator',
        rows: [
          row('Heading', home.REFUND.title),
          row('Intro', home.REFUND.intro),
          ...Object.entries(home.REFUND.reasons).map(([k, v]) => row(`Reason: ${k}`, v)),
          ...home.REFUND.tiers.map((t, i) => row(`Tier ${i + 1}`, l(`${t.label.en}: ${t.refund}% refunded, ${100 - t.refund}% deducted`, `${t.label.zh}：退還 ${t.refund}%，扣除 ${100 - t.refund}%`))),
          row('Below minimum group', home.REFUND.lowEnrollment),
          row('Force majeure', home.REFUND.forceMajeure),
          row('If the organizers cancel', home.REFUND.reverse),
          row('Table headings', l(`${S('home.refundWhen').en} / ${S('home.refundRate').en} / ${S('home.refundDeducted').en}`, `${S('home.refundWhen').zh} / ${S('home.refundRate').zh} / ${S('home.refundDeducted').zh}`)),
        ],
      },
    ],
  },
  {
    file: '02-registration-consents-personal-data',
    title: l('Registration: consents and personal data', '報名：同意事項與個人資料'),
    where: 'Registration form (opens from every "Register" button)',
    open: [
      !c.documents.final && 'The website’s Forms & documents section lists the Camp Notice and Agreement, the Camper Health Form and the Check-in Day Form, and does not offer them for download until they are final. They are the three camp forms sent with these notices (Part 1 of the combined file, genesis-bambi-camp-documents.pdf).',
      !c.registration.endpoint && 'The form does not send anything yet: no receiving address is set, so it only shows the parent a summary to save.',
      !c.registration.contractPdfUrl && 'Consent 1 refers to Articles 1–5 of the service contract, but the contract PDF is not linked yet. The form says it will be given for review before any payment.',
      'Consent 3 asks the parent to confirm they have read an “Informed Outdoor Risk Disclosure” (已詳閱戶外風險說明), but the registration form and the website show no such text. It exists only as the section “Outdoor risk disclosure” of the draft Camp Notice, which the family receives after registering. Please advise whether the disclosure must be shown before this box is ticked. Once the Camp Notice is final, the form links it beside the consents.',
      'Consent 1 names the District Court of the camper’s place of residence as the court of jurisdiction.',
      'The health-data notice promises who sees the data and destruction within 30 days after camp. Please check it against the Personal Data Protection Act and the organizers’ actual practice.',
    ],
    blocks: [
      { title: home.DOCS.kicker, where: 'Landing page › Forms & documents', rows: [
        row('Heading', home.DOCS.title),
        row('Introduction', home.DOCS.intro),
        row('Added to the introduction once the forms are final', home.DOCS.introFinal),
        ...(c.documents.final ? [] : [row('Shown while the forms are not final', home.DOCS.pending), row('On each of the three form cards, in place of the PDF link', home.DOCS.whenFinal)]),
        ...(c.registration.endpoint ? [] : [row('Card 1 while online registration is not open', l(`${home.DOCS.registerClosed.when.en}. ${home.DOCS.registerClosed.body.en} Button: ${home.DOCS.registerClosed.button.en}`, `${home.DOCS.registerClosed.when.zh}。${home.DOCS.registerClosed.body.zh} 按鈕：${home.DOCS.registerClosed.button.zh}`))]),
        ...home.DOCS.items.map((d) => row(`Document: ${d.title.en}`, l(`${d.when.en}. ${d.title.en}: ${d.body.en}`, `${d.when.zh}。${d.title.zh}：${d.body.zh}`))),
      ] },
      { title: l('Before the consents', '同意事項前的說明'), where: 'Form › step 3', rows: [
        ...(c.registration.endpoint ? [] : [row('At the top of the form while online registration is not open', S('register.preview'))]),
        row('Instruction', S('register.consentIntro')),
        row('Contract link text', S('register.contractPdf')),
        row('Shown while no contract is linked', S('register.contractPending')),
        row('Shown once the Camp Notice is final, with a link to it', l(`${S('register.riskDisclosure').en} ${S('register.noticePdf').en}`, `${S('register.riskDisclosure').zh}${S('register.noticePdf').zh}`)),
      ] },
      { title: l('The consents', '同意事項'), where: 'Form › step 3, one checkbox each, all unticked by default', rows: home.CONSENTS.map((x, i) => row(`Consent ${i + 1} (${x.required ? 'required' : 'optional'})`, item({ title: x.title, body: x.body }))) },
      { title: l('Health-data notice', '健康資料告知'), where: 'Form › step 2', rows: [row('Notice', S('register.healthNote'))] },
      {
        title: l('Personal data the form asks for', '報名表蒐集的個人資料'),
        where: 'Form › steps 1 and 2 (field labels)',
        rows: ['session', 'camper', 'dob', 'gender', 'guardian', 'relation', 'mobile', 'email', 'address', 'backup', 'diet', 'dietNoBeef', 'dietNoPork', 'dietVeg', 'dietOther', 'allergies', 'conditions', 'medications', 'water', 'waterNon', 'waterBeginner', 'waterComfortable'].map((k) => row('Field', S(`register.${k}`))),
      },
      { title: l('Messages the form shows', '報名表顯示的訊息'), where: 'Form › after "Submit", and errors', rows: [row('Registration received', S('register.sent')), row('Registration not open yet', S('register.notOpen')), row('Sending failed', S('register.sendFailed')), row('Missing answers', S('register.missing')), row('Missing consents', S('register.consentMissing'))] },
    ],
  },
  {
    file: '03-safety-insurance-liability',
    title: l('Safety, insurance and liability', '安全、保險與責任'),
    where: 'Landing page › Safety; Explore the Facilities › nurse station panel',
    open: [
      (!ta.legalName || !ta.tourismRegNo) && 'The travel agency that carries the travel liability and performance insurance is not named on the site yet.',
      'These are factual promises (background checks, staff ratio, a nurse on site at all hours, four insurances). Please confirm each can be evidenced before launch.',
      'The under-15 statement relies on Article 107 of the Insurance Act.',
    ],
    blocks: [
      { title: l('Care and supervision', '照顧與安全'), where: 'Safety › four cards', rows: list('Statement', home.SAFETY.staff) },
      { title: home.SAFETY.insuranceTitle, where: 'Safety › insurance', rows: [...home.SAFETY.insurance.map((x) => row(`Layer ${x.n}`, item({ title: x.title, by: x.by, body: x.body }))), row('Campers under 15', home.SAFETY.under15), row('No waiver of liability', home.SAFETY.duty)] },
      ...areaBlocks(['care']),
    ],
  },
  {
    file: '04-camp-and-facility-rules',
    title: l('Camp and facility rules', '營隊與設施守則'),
    where: 'Explore the Facilities › panel of each place; Landing page › Stay & Meals',
    open: [
      'The pool, kayak and campfire rules and the snack-shop menu are drafts written for the site. The lifeguard, the venue, the camp kitchen and the insurer have not confirmed them yet.',
      'Camper vans: intentional damage is charged to the family at the venue’s actual repair cost (also listed under "Not included").',
      'Phones and devices are kept by counselors for the whole camp (see the FAQ).',
    ],
    blocks: [
      { title: l('Camper vans and meals (landing page)', '露營車與餐飲（首頁）'), where: 'Stay & Meals', rows: [...list('Card', home.STAY.cards), row('Dietary needs', home.STAY.diet)] },
      ...areaBlocks(AREAS.filter((a) => a.id !== 'care').map((a) => a.id)),
    ],
  },
  {
    file: '05-legal-and-licensing-disclosures',
    title: l('Legal and licensing disclosures', '法定揭露與營業資訊'),
    where: 'Footer of every page; Star Cinema panel',
    open: [
      (!op.legalName || !op.taxId) && 'Activity co-organizer: legal name, tax ID, phone and address are not filled in. The site shows "Pending partner details".',
      (!ta.legalName || !ta.tourismRegNo || !ta.tqaaNo) && 'Travel agency: legal name, licence class, Tourism Administration registration number, TQAA number and phone are not filled in.',
      !c.venuePhotoPermissionOnFile && 'Venue photos come from Bambi Glamping’s own website. Written permission to publish them is not on file yet.',
      'The footer cites a Ministry of Education order number. Please confirm it is the right reference and is quoted correctly.',
      'Films: the site states every film is shown under a public-performance licence. Please confirm the licence covers these screenings.',
    ],
    blocks: [
      {
        title: S('footer.legalTitle'),
        where: 'Footer › three columns',
        rows: [
          row(S('footer.coOrganizer').en, pend(op.legalName)),
          row(`· ${S('footer.taxId').en}`, pend(op.taxId)),
          row(`· ${S('footer.tel').en}`, pend(op.phone)),
          row(`· ${S('footer.address').en}`, pend(op.address)),
          row(S('footer.venuePartner').en, c.venue.name),
          row(`· ${S('footer.taxId').en}`, pend(c.venue.taxId)),
          row(`· ${S('footer.address').en}`, c.venue.address),
          row(S('footer.travelOrganizer').en, pend(ta.legalName)),
          row('· Licence class', pend(ta.category)),
          row(`· ${S('footer.regNo').en}`, pend(ta.tourismRegNo)),
          row(`· ${S('footer.tqaa').en}`, pend(ta.tqaaNo)),
          row(`· ${S('footer.tel').en}`, pend(ta.phone)),
          row('Insurance line', S('footer.insured')),
          row('Column headings', l([S('footer.coOrganizer').en, S('footer.venuePartner').en, S('footer.travelOrganizer').en].join(' / '), [S('footer.coOrganizer').zh, S('footer.venuePartner').zh, S('footer.travelOrganizer').zh].join(' / '))),
        ],
      },
      {
        title: l('Footer notices', '頁尾聲明'),
        where: 'Footer › last lines',
        rows: [
          row('Minimum enrolment and order number', l(`${S('footer.minEnroll').en} ${S('footer.moe').en}: ${c.compliance.moeOrder}`, `${S('footer.minEnroll').zh} ${S('footer.moe').zh}：${c.compliance.moeOrder}`)),
          row('Copyright and photo credit', l(`© ${year} ${c.brand.en}. ${S('footer.rights').en} ${S('footer.photoCredit').en}`, `© ${year} ${c.brand.zh}。${S('footer.rights').zh}${S('footer.photoCredit').zh}`)),
        ],
      },
      {
        title: l('Film licence statement', '影片授權聲明'),
        where: 'Explore the Facilities › Star Cinema; Landing page › activities',
        rows: [row('Panel summary', film.summary), ...film.features.filter((f) => /licen|公播/i.test(f.title.en + f.title.zh + f.body.zh)).map((f) => row('Panel feature', item({ title: f.title, body: f.body }))), ...home.ACTIVITIES.filter((a) => /公播/.test(a.body.en + a.body.zh)).map((a) => row('Activity card', item({ name: a.name, body: a.body })))],
      },
    ],
  },
  {
    file: '06-faq-and-other-commitments',
    title: l('FAQ and other commitments', '常見問題與其他承諾'),
    where: 'Landing page › hero, Stay & Meals, activities, FAQ',
    open: [
      'These are not notices as such, but they are promises a parent may rely on. They are included so that nothing a parent reads is left out of the review.',
      'Activity descriptions and the 32 named games are not reproduced here. They can be exported the same way on request.',
    ],
    blocks: [
      { title: S('home.faqTitle'), where: 'FAQ', rows: home.FAQ.map((x, i) => row(`Question ${i + 1}`, item({ q: x.q, a: x.a }))) },
      {
        title: l('Headline claims', '首頁主要宣稱'),
        where: 'Hero › checklist and figures',
        rows: [...list('Checklist line', home.HERO.points), ...Object.keys(strings.en.hero.metrics).map((k) => row('Figure', l(`${S(`hero.metrics.${k}`).en.value}: ${S(`hero.metrics.${k}`).en.label}`, `${S(`hero.metrics.${k}`).zh.value}：${S(`hero.metrics.${k}`).zh.label}`))), ...(pilotCap ? [row('Figure (season with a pilot camp)', l(`${pilotCap}: ${home.HERO.pilotMetric.en}`, `${pilotCap}：${home.HERO.pilotMetric.zh}`))] : [])],
      },
      { title: home.STAY.mealsTitle, where: 'Stay & Meals › meals', rows: [...list('Meal', home.STAY.meals), row('Note under the meals', home.STAY.mealsNote), row('Final evening', item({ kicker: home.STAY.signature.kicker, title: home.STAY.signature.title, body: home.STAY.signature.body }))] },
      { title: l('Schedule and rainy days', '行程與雨天備案'), where: 'Games & challenges › closing boxes', rows: [row('Daily schedule', item(home.SCHEDULE_PENDING)), row('Rain plan', item(home.RAIN_PLAN))] },
    ],
  },
]

// ── pages ───────────────────────────────────────────────────────────────────────────────
const commit = (() => {
  try {
    const head = execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim()
    // a stamp must never name a version the text does not match: mark a build made from uncommitted sources
    const dirty = execSync("git status --porcelain -- . ':(exclude)docs'", { cwd: root }).toString().trim()
    return head + (dirty ? '+uncommitted' : '')
  } catch {
    return ''
  }
})()
const today = new Date().toISOString().slice(0, 10)
const font = (pkg) => `file://${path.join(root, 'node_modules/@fontsource-variable', pkg, 'index.css')}`
const CSS = `
  @page { size: A4; margin: 16mm 14mm 18mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 9.4pt/1.5 'Inter Variable', 'Noto Sans TC Variable', sans-serif; color: #1c2a24; }
  h1 { font-size: 19pt; line-height: 1.2; margin: 0 0 2pt; color: #1b4332; }
  h1 small { display: block; font-size: 13pt; font-weight: 600; color: #46584f; margin-top: 3pt; }
  h2 { font-size: 12pt; margin: 16pt 0 2pt; color: #1b4332; break-after: avoid; }
  h2 small { font-weight: 600; color: #46584f; margin-left: 6pt; }
  .where { font-size: 8.4pt; color: #6a5a40; margin: 0 0 5pt; break-after: avoid; }
  .meta { font-size: 8.6pt; color: #46584f; margin: 6pt 0 0; }
  .box { border: 1px solid #d9c9a8; background: #fbf6ec; border-radius: 6pt; padding: 8pt 11pt; margin: 10pt 0 4pt; }
  .box h3 { margin: 0 0 4pt; font-size: 9.6pt; color: #7a5a22; }
  .box ul { margin: 0; padding-left: 13pt; } .box li { margin: 2pt 0; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th { text-align: left; font-size: 7.8pt; letter-spacing: .06em; text-transform: uppercase; color: #6a5a40; padding: 3pt 6pt; border-bottom: 1.2px solid #1b4332; }
  td { vertical-align: top; padding: 4.5pt 6pt; border-bottom: .6px solid #dfe5e1; overflow-wrap: anywhere; }
  tr { break-inside: avoid; }
  td.id { font-size: 8pt; color: #6a5a40; font-variant-numeric: tabular-nums; white-space: nowrap; }
  td.label { font-size: 8.4pt; color: #46584f; }
  td.zh { font-size: 9.6pt; }
  .pending { color: #a15c00; font-style: italic; }
  section + section { break-before: page; }
  .toc td { border: 0; padding: 2pt 6pt; }
`
function sectionHtml(sec, n) {
  const open = (sec.open ?? []).filter(Boolean)
  let html = `<section><h1>${n}. ${esc(sec.title.en)}<small>${esc(sec.title.zh)}</small></h1><p class="meta">Where it appears on the site: ${esc(sec.where)}</p>`
  if (open.length) html += `<div class="box"><h3>Points for the reviewer</h3><ul>${open.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`
  sec.blocks.forEach((b, bi) => {
    html += `<h2>${n}.${bi + 1} ${esc(b.title.en)}<small>${esc(b.title.zh)}</small></h2><p class="where">${esc(b.where)}</p><table><colgroup><col style="width:8%"><col style="width:15%"><col style="width:39%"><col style="width:38%"></colgroup><tr><th>Ref.</th><th>What it is</th><th>English</th><th>繁體中文</th></tr>`
    b.rows.forEach(([label, v], ri) => {
      const cell = (k) => (v.html ? v[k] : esc(v[k]))
      html += `<tr><td class="id">${n}.${bi + 1}.${ri + 1}</td><td class="label">${esc(label)}</td><td class="en${v.pending ? ' pending' : ''}">${cell('en')}</td><td class="zh${v.pending ? ' pending' : ''}" lang="zh-Hant">${cell('zh')}</td></tr>`
    })
    html += '</table>'
  })
  return html + '</section>'
}
const cover = (sections) => `<section><h1>${esc(c.brand.en)}<small>${esc(c.brand.zh)}</small></h1>
  <h2>Legal notices for review<small>法律文字審閱稿</small></h2>
  <p class="meta">Text exactly as the website publishes it, English beside 繁體中文. Generated ${today}${commit ? ` from site version ${commit}` : ''}.</p>
  <div class="box"><h3>How to read this</h3><ul>
    <li>Every line has a reference number (for example 1.3.2) so that comments can point to it.</li>
    <li>The English and Chinese are the two published versions of the same line. Both are shown to visitors, who choose the language.</li>
    <li><span class="pending">Text in this style</span> is a placeholder the site shows because a partner has not supplied the detail yet.</li>
    <li>"Points for the reviewer" at the head of each part lists what is still open or assumed.</li>
    <li>The service contract itself is a separate document and is not part of the website yet.</li>
  </ul></div>
  <table class="toc"><colgroup><col style="width:6%"><col style="width:47%"><col style="width:47%"></colgroup>${sections.map((s, i) => `<tr><td class="id">${i + 1}</td><td>${esc(s.title.en)}</td><td lang="zh-Hant">${esc(s.title.zh)}</td></tr>`).join('')}</table></section>`
const page = (body, title) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title><link rel="stylesheet" href="${font('inter')}"><link rel="stylesheet" href="${font('noto-sans-tc')}"><style>${CSS}</style></head><body>${body}</body></html>`

mkdirSync(out, { recursive: true })
const tmp = path.join(out, '.tmp.html')
const browser = await chromium.launch()
const tab = await browser.newPage()
async function pdf(name, html, title) {
  writeFileSync(tmp, page(html, title))
  await tab.goto('file://' + tmp)
  await tab.evaluate(() => document.fonts.ready)
  await tab.pdf({
    path: path.join(out, name + '.pdf'),
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: `<div style="font-size:7px;width:100%;padding:0 14mm;color:#777;display:flex;justify-content:space-between"><span>${esc(title)} · legal notices for review · ${today}${commit ? ' · ' + commit : ''}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
  })
  console.log('wrote', path.relative(root, path.join(out, name + '.pdf')))
}
await pdf('00-all-legal-notices', cover(SECTIONS) + SECTIONS.map((s, i) => sectionHtml(s, i + 1)).join(''), 'Genesis × Bambi camp')
for (const [i, s] of SECTIONS.entries()) await pdf(s.file, sectionHtml(s, i + 1), `Genesis × Bambi camp: ${s.title.en}`)
await browser.close()
rmSync(tmp, { force: true })
