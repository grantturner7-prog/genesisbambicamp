// Adverts for parents: a brochure, a pamphlet and social-media images, in 繁體中文 and English.
//   node scripts/promo.mjs [outDir]        (default: docs/marketing)
// Every fact (dates, fee, bus times, schedule, what is included, insurance, organizers) is read
// from the site's own modules, so the adverts cannot drift from the website. Every sentence is
// checked against the wording rules in copy-rules.mjs before anything is written.
// Photographs are the venue's real ones (public/media/bambi). No generated images of people.
import { createServer } from 'vite'
import { createRequire } from 'node:module'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { broken } from './copy-rules.mjs'
const { chromium } = createRequire(import.meta.url)('playwright')

const root = process.cwd()
const out = path.resolve(process.argv[2] || 'docs/marketing')
const vite = await createServer({ configFile: false, root, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent', optimizeDeps: { noDiscovery: true, include: [] } })
const load = (p) => vite.ssrLoadModule(p)
const [{ strings }, home, games, { campConfig: c }] = await Promise.all([load('/src/i18n/strings.ts'), load('/src/home/content.ts'), load('/src/home/games.ts'), load('/src/config/campConfig.ts')])
await vite.close()

const offer = c.sessions.winter
if (!offer) throw new Error('The winter camp has no dates: nothing to advertise.')
const zhKey = Object.keys(strings).find((k) => k !== 'en')
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const twd = (n) => `NT$${n.toLocaleString('en-US')}`
// Photographs go into the PDFs as JPEGs of a sensible size, or each brochure weighs over 20 MB.
const PHOTOS = new Set()
const photo = (id) => { PHOTOS.add(id); return `file://${path.join(out, '.photos', id + '.jpg')}` }
const font = (pkg) => `file://${path.join(root, 'node_modules/@fontsource-variable', pkg, 'index.css')}`
const game = (n) => games.GAMES.find((g) => g.n === n).name

// ── Copy that exists only in the adverts (everything else comes from the site) ─────────────
const AD = {
  tagline: { en: 'All in English. All outdoors.', zh: '全美語生活環境・戶外探索營隊' },
  ages: { en: 'Ages 10–14', zh: '10–14 歲' },
  nights: { en: '4 days / 3 nights', zh: '四天三夜' },
  whyTitle: { en: `Why ${c.brand.camp}`, zh: `為什麼選 ${c.brand.camp}` },
  highlights: { en: 'Camp highlights', zh: '營隊亮點' },
  alsoTitle: { en: 'And across the four days', zh: '四天裡還有' },
  stayTitle: { en: 'Camper vans and three meals a day', zh: '豪華露營車與每日三餐' },
  safetyTitle: { en: 'Looked after, day and night', zh: '日夜都有人照顧' },
  insuranceTitle: { en: 'Four layers of insurance', zh: '四重保險' },
  feesTitle: { en: 'Dates and fees', zh: '梯次與費用' },
  travelTitle: { en: 'Meeting point and bus', zh: '集合地點與專車' },
  included: { en: 'Included', zh: '費用包含' },
  excluded: { en: 'Not included', zh: '費用不含' },
  refundTitle: { en: 'If you need to cancel', zh: '如需解約' },
  refundHead: { en: ['When you cancel', 'Refund'], zh: ['解約時間', '退費比例'] },
  joinTitle: { en: 'How to join', zh: '如何報名' },
  join: {
    en: `Registration opens on the camp website. The first ${c.brand.camp} is a pilot camp with ${offer.pilot?.maxCampers ?? c.cohort.maxCampersPerSession} places.`,
    zh: `報名將於營隊官網開放。首梯 ${c.brand.camp} 為試辦營，限額 ${offer.pilot?.maxCampers ?? c.cohort.maxCampersPerSession} 名營員。`,
  },
  packTitle: { en: 'What to pack', zh: '行李清單' },
  whoTitle: { en: 'Who runs the camp', zh: '主辦與承辦單位' },
  roles: { organizer: { en: 'Activity co-organizer', zh: '活動協辦' }, venue: { en: 'Venue', zh: '場地' }, agency: { en: 'Licensed travel agency', zh: '承辦旅行社' } },
  perCamper: { en: 'per camper', zh: '每位營員' },
  where: { en: 'Bambi Glamping, Sanwan, Miaoli', zh: '斑比跳跳・苗栗三灣' },
  swipe: { en: 'Four days at camp', zh: '營隊四天' },
  social: {
    lead: { en: 'An American-style outdoor camp, all in English, in Miaoli.', zh: '在苗栗，過四天美式戶外營隊生活，全程美語。' },
    days: { en: 'Four days, one lake, one campfire', zh: '四天・一座湖・一堆營火' },
    stay: { en: 'Luxury camper vans. Three meals a day.', zh: '頂級豪華露營車・每日三餐' },
    care: { en: 'Counselors at about 1:4. A nurse on site 24/7.', zh: '隊輔與營員約 1:4・24 小時駐點護理師' },
    book: { en: 'Pilot camp: 30 places', zh: '試辦營：限額 30 名營員' },
  },
  photoCredit: { en: 'Photographs: Bambi Glamping', zh: '照片：斑比跳跳' },
}

// ── Facts from the site ─────────────────────────────────────────────────────────────────────
const S = (p) => ({ en: p.split('.').reduce((v, k) => v?.[k], strings.en), zh: p.split('.').reduce((v, k) => v?.[k], strings[zhKey]) })
const T = c.transport
const headline = { en: strings.en.hero.headline.winter, zh: strings[zhKey].hero.headline.winter }
const english = home.FAQ.find((f) => /English/.test(f.q.en))
const act = (re) => home.ACTIVITIES.find((a) => re.test(a.name.en))
const HIGHLIGHTS = [
  { ...act(/Kayak/), photo: 'kayak-jetty' },
  { ...act(/Tram/), photo: 'tram-on-route' },
  { ...act(/Campfire/), photo: 'campfire-burning' },
  { ...act(/Cinema/), photo: 'cinema-night' },
]
const ALSO = [1, 2, 4, 3, 8, 11, 27, 10, 32].map(game)
// The organizers, as the website's legal footer prints them. null = a partner still owes it.
const op = c.operator, ta = c.travelAgency
const agencyLine = (lang) => (ta.legalName && ta.category && ta.tourismRegNo && ta.phone ? [typeof ta.legalName === 'string' ? ta.legalName : ta.legalName[lang === 'en' ? 'en' : 'zh'], typeof ta.category === 'string' ? ta.category : ta.category[lang === 'en' ? 'en' : 'zh'], ta.tourismRegNo, ta.tqaaNo, ta.phone, ta.insuranceNote && (typeof ta.insuranceNote === 'string' ? ta.insuranceNote : ta.insuranceNote[lang === 'en' ? 'en' : 'zh'])].filter(Boolean).join(' · ') : null)
const contactLine = () => [op.lineId && `LINE ${op.lineId}`, op.phone, c.site?.url].filter(Boolean).join(' · ') || null
const MISSING = []
if (!agencyLine('en')) MISSING.push('the travel agency’s name, class, registration number, phone and insurance sums (a travel advertisement must print them)')
if (!contactLine()) MISSING.push('a way to reach the camp: website address, LINE or phone')
if (!c.registration.endpoint) MISSING.push('online registration is not open yet, so the adverts say “opens on the camp website”')
if (!c.venuePhotoPermissionOnFile) MISSING.push('Bambi Glamping’s written permission to publish its photographs')
const PENDING = {
  agency: { en: 'Travel agency name, class, registration number, phone and insurance sums: to be added before this is printed or posted.', zh: '承辦旅行社名稱、種類、註冊編號、電話與保險金額：印製或發布前補上。' },
  contact: { en: 'Website, LINE and phone: to be added.', zh: '官網、LINE 與電話：待補。' },
}

// ── Building blocks ─────────────────────────────────────────────────────────────────────────
const CSS = `
  * { box-sizing: border-box; margin: 0; }
  :root { --pine: #1b4332; --pine9: #0f271d; --moss: #2d6a4f; --cedar: #d4a373; --cedar6: #b9854f; --cedar1: #f3e3d0; --parch: #faf7f2; --parch2: #f1ebe0; --ink: #1c2a23; --line: #d9d2c3; }
  html, body { font-family: 'Inter Variable', 'Noto Sans TC Variable', sans-serif; color: var(--ink); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .d { font-family: 'Fraunces Variable', 'Noto Serif TC Variable', serif; font-weight: 600; letter-spacing: -0.01em; }
  .kick { font-size: .72em; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: var(--cedar6); }
  .pill { display: inline-block; border: 1px solid rgba(255,255,255,.45); background: rgba(255,255,255,.12); border-radius: 999px; padding: .28em .9em; font-weight: 600; font-size: .8em; }
  .pending { border: 1.5px dashed #c0392b; color: #8a2a1b; background: #fff4f1; border-radius: 6px; padding: .5em .8em; font-size: .78em; font-weight: 600; }
  img { display: block; width: 100%; height: 100%; object-fit: cover; }
  ul { padding-left: 1.1em; } li { margin: 0 0 .28em; }
`
const doc = (body, extra = '') => `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${font('inter')}"><link rel="stylesheet" href="${font('noto-sans-tc')}"><link rel="stylesheet" href="${font('fraunces')}"><link rel="stylesheet" href="${font('noto-serif-tc')}"><style>${CSS}${extra}</style></head><body>${body}</body></html>`

/** Everything is written through `t`, so each run also collects the text it printed for the wording check. */
function build(lang) {
  const seen = []
  const t = (l) => { const v = typeof l === 'string' ? l : l[lang === 'en' ? 'en' : 'zh']; seen.push(v); return esc(v) }
  const dates = t(offer.dates)
  const legal = () => (agencyLine(lang) ? `<p class="legal">${esc(agencyLine(lang))}</p>` : `<p class="pending">${t(PENDING.agency)}</p>`)
  const contact = () => (contactLine() ? `<p class="contact">${esc(contactLine())}</p>` : `<p class="pending">${t(PENDING.contact)}</p>`)
  const brandLine = t({ en: c.brand.en, zh: c.brand.zh })

  // ── brochure, A4 ──
  const cover = `
  <section class="page cover">
    <img class="bg" src="${photo('winter-cypress')}" alt="">
    <div class="shade"></div>
    <div class="top">${brandLine}</div>
    <div class="mid">
      <p class="mean">${esc(c.brand.campMeaning)}</p>
      <h1 class="d">${esc(c.brand.camp)}</h1>
      <p class="d head">${t(headline)}</p>
      <p class="tag">${t(AD.tagline)}</p>
      <p class="pills"><span class="pill">${t(AD.ages)}</span><span class="pill">${dates}</span><span class="pill">${t(AD.where)}</span></p>
    </div>
    <ul class="points">${home.HERO.points.map((p) => `<li>${t(p)}</li>`).join('')}</ul>
  </section>`
  const why = `
  <section class="page">
    <p class="kick">${esc(c.brand.camp)}</p><h2 class="d">${t(AD.whyTitle)}</h2>
    <p class="lead">${t(S('hero.subtitle'))}</p>
    <div class="qa"><p class="q">${t(english.q)}</p><p>${t(english.a)}</p></div>
    <h3 class="d">${t(AD.highlights)}</h3>
    <div class="grid2">${HIGHLIGHTS.map((h) => `<figure><div class="ph"><img src="${photo(h.photo)}" alt=""></div><figcaption><b>${t(h.name)}</b><span>${t(h.body)}</span></figcaption></figure>`).join('')}</div>
    <h3 class="d">${t(AD.alsoTitle)}</h3>
    <p class="chips">${ALSO.map((g) => `<span>${t(g)}</span>`).join('')}</p>
  </section>`
  const days = `
  <section class="page">
    <p class="kick">${t(home.SCHEDULE.kicker)}</p><h2 class="d">${t(home.SCHEDULE.title)}</h2>
    <p class="lead">${t(home.SCHEDULE.intro)}</p>
    <div class="days">${home.SCHEDULE.days.map((d, i) => `<div class="day"><p class="n">${i + 1} · ${t(d.day)}</p><h3 class="d">${t(d.theme)}</h3><table>${d.rows.map((r) => `<tr><th>${esc(r.time)}</th><td>${t(r.what)}</td></tr>`).join('')}</table></div>`).join('')}</div>
    <p class="note">${t(home.RAIN_PLAN.title)} ${t(home.RAIN_PLAN.body)}</p>
    <div class="strip"><div class="ph"><img src="${photo('kayak-lake')}" alt=""></div><div class="ph"><img src="${photo('campfire-marshmallow')}" alt=""></div><div class="ph"><img src="${photo('cinema-lawn')}" alt=""></div></div>
  </section>`
  const stay = `
  <section class="page">
    <p class="kick">${t(S('nav.stay'))}</p><h2 class="d">${t(AD.stayTitle)}</h2>
    <div class="row3"><div class="ph"><img src="${photo('lake-cypress')}" alt=""></div><div class="ph"><img src="${photo('van-bunk')}" alt=""></div><div class="ph"><img src="${photo('wagyu-platter')}" alt=""></div></div>
    <div class="cols3">${home.STAY.cards.map((x) => `<div><b>${t(x.title)}</b><p>${t(x.body)}</p></div>`).join('')}</div>
    <div class="cols2 meals"><div><b>${t(home.STAY.mealsTitle)}</b><ul>${home.STAY.meals.map((m) => `<li><b>${t(m.name)}</b> ${t(m.note)}</li>`).join('')}</ul></div><div><b>${t(home.STAY.signature.title)}</b><p>${t(home.STAY.signature.body)}</p><p class="small">${t(home.STAY.snacks.body)}</p></div></div>
    <h2 class="d second">${t(AD.safetyTitle)}</h2>
    <div class="cols2">${home.SAFETY.staff.map((x) => `<div><b>${t(x.title)}</b><p>${t(x.body)}</p></div>`).join('')}</div>
    <h3 class="d">${t(AD.insuranceTitle)}</h3>
    <div class="cols2 ins">${home.SAFETY.insurance.map((x) => `<div><b>${esc(x.n)}. ${t(x.title)}</b> <span class="by">${t(x.by)}</span><p>${t(x.body)}</p></div>`).join('')}</div>
    <p class="small">${t(home.SAFETY.under15)}</p>
  </section>`
  const fees = `
  <section class="page">
    <p class="kick">${t(S('nav.pricing'))}</p><h2 class="d">${t(AD.feesTitle)}</h2>
    <div class="feebox"><div><p class="d fee">${esc(twd(offer.fee))}</p><p>${t(AD.perCamper)}</p></div><div><p class="d when">${dates}</p><p>${t(home.PRICING.camp.name)} · ${t(home.PRICING.camp.when)} · ${t(AD.ages)}${offer.pilot ? ' · ' + t(home.PRICING.pilotLimit(offer.pilot.maxCampers)) : ''}</p></div></div>
    <h3 class="d">${t(AD.travelTitle)}</h3>
    <p>${t(home.PRICING.camp.bus)}</p><p class="small">${t(home.PRICING.bus)}</p>
    <div class="cols2 lists"><div><h3 class="d">${t(AD.included)}</h3><ul>${home.PRICING.included.map((x) => `<li>${t(x)}</li>`).join('')}</ul></div><div><h3 class="d">${t(AD.excluded)}</h3><ul>${home.PRICING.excluded.map((x) => `<li>${t(x)}</li>`).join('')}</ul></div></div>
    <p class="note">${t(home.PRICING.guarantee)}</p>
    <h3 class="d">${t(AD.refundTitle)}</h3>
    <p class="small">${t(home.REFUND.intro)}</p>
    <table class="refund"><tr><th>${t(AD.refundHead[lang === 'en' ? 'en' : 'zh'][0])}</th><th>${t(AD.refundHead[lang === 'en' ? 'en' : 'zh'][1])}</th></tr>${home.REFUND.tiers.map((r) => `<tr><td>${t(r.label)}</td><td>${r.refund}%</td></tr>`).join('')}</table>
  </section>`
  const pending = t(S('footer.pending'))
  const or = (v) => (v ? esc(typeof v === 'string' ? v : v[lang === 'en' ? 'en' : 'zh']) : `<i>${pending}</i>`)
  const join = `
  <section class="page">
    <p class="kick">${esc(c.brand.camp)}</p><h2 class="d">${t(AD.joinTitle)}</h2>
    <p class="lead">${t(AD.join)}</p>
    ${contact()}
    <h3 class="d">${t(AD.packTitle)}</h3>
    <ul class="pack">${home.PACKING.filter((p) => !p.season || p.season === 'winter').map((p) => `<li>${t(p.item)}</li>`).join('')}</ul>
    <h3 class="d">${t(AD.whoTitle)}</h3>
    <div class="cols3 who">
      <div><b>${t(AD.roles.organizer)}</b><p>${or(op.legalName)}</p><p class="small">${t(S('footer.taxId'))}：${or(op.taxId)}<br>${t(S('footer.tel'))}：${or(op.phone)}</p></div>
      <div><b>${t(AD.roles.venue)}</b><p>${t(c.venue.name)}</p><p class="small">${t(S('footer.taxId'))}：${esc(c.venue.taxId)}<br>${t(c.venue.address)}</p></div>
      <div><b>${t(AD.roles.agency)}</b><p>${or(ta.legalName)}</p><p class="small">${or(ta.category)} · ${or(ta.tourismRegNo)} · ${or(ta.tqaaNo)}<br>${t(S('footer.tel'))}：${or(ta.phone)}</p></div>
    </div>
    ${legal()}
    <p class="small duty">${t(home.SAFETY.duty)}</p>
    <div class="closing"><img src="${photo('grounds-palm-road')}" alt=""><div class="shade"></div><p class="d">${esc(c.brand.camp)}</p><span>${t(AD.tagline)}</span></div>
    <p class="credit">${t(AD.photoCredit)}</p>
  </section>`
  const brochure = doc(cover + why + days + stay + fees + join, BROCHURE_CSS)

  // ── pamphlet, A5, two sides ──
  const pamphlet = doc(`
  <section class="page cover">
    <img class="bg" src="${photo('winter-cypress')}" alt=""><div class="shade"></div>
    <div class="top">${brandLine}</div>
    <div class="mid"><p class="mean">${esc(c.brand.campMeaning)}</p><h1 class="d">${esc(c.brand.camp)}</h1><p class="d head">${t(headline)}</p><p class="tag">${t(AD.tagline)}</p>
    <p class="pills"><span class="pill">${t(AD.ages)}</span><span class="pill">${dates}</span></p></div>
    <ul class="points">${home.HERO.points.map((p) => `<li>${t(p)}</li>`).join('')}<li>${t(AD.where)}</li></ul>
  </section>
  <section class="page back">
    <p class="kick">${t(home.SCHEDULE.kicker)}</p><h2 class="d">${t(home.SCHEDULE.title)}</h2>
    <div class="mini">${home.SCHEDULE.days.map((d, i) => `<div><p class="n">${i + 1} · ${t(d.day)}</p><b class="d">${t(d.theme)}</b><ul>${d.rows.filter((r) => !/^(Breakfast|Dinner|Lunch)/.test(r.what.en)).slice(0, 5).map((r) => `<li>${t(r.what)}</li>`).join('')}</ul></div>`).join('')}</div>
    <div class="feebox"><div><p class="d fee">${esc(twd(offer.fee))}</p><p>${t(AD.perCamper)}</p></div><div><p class="d when">${dates}</p><p>${t(home.PRICING.camp.name)} · ${t(AD.ages)}${offer.pilot ? ' · ' + t(home.PRICING.pilotLimit(offer.pilot.maxCampers)) : ''}</p></div></div>
    <p class="bus"><b>${t(AD.travelTitle)}</b> ${t(home.PRICING.camp.bus)}</p>
    <p class="inc"><b>${t(AD.included)}</b> ${home.PRICING.included.map((x) => t(x)).join(lang === 'en' ? '; ' : '；')}${lang === 'en' ? '.' : '。'}</p>
    <p class="small">${t(home.STAY.snacks.title)}${lang === 'en' ? '. ' : '。'}${t(home.PRICING.guarantee)}</p>
    <p class="join"><b>${t(AD.joinTitle)}</b> ${t(AD.join)}</p>
    ${contact()}${legal()}
    <p class="credit">${t(AD.photoCredit)}</p>
  </section>`, PAMPHLET_CSS)

  // ── social images ──
  const foot = `<div class="foot"><span>${brandLine}</span><span>${t(AD.where)}</span></div>`
  const hero = (cls, ph) => `<section class="s ${cls}"><img class="bg" src="${photo(ph)}" alt=""><div class="shade"></div>
    <div class="in"><p class="mean">${esc(c.brand.campMeaning)}</p><h1 class="d">${esc(c.brand.camp)}</h1><p class="d head">${t(headline)}</p><p class="tag">${t(AD.tagline)}</p>
    <p class="pills"><span class="pill">${t(AD.ages)}</span><span class="pill">${dates}</span></p></div>${foot}</section>`
  const slides = [
    hero('cover', 'winter-cypress'),
    `<section class="s light"><div class="in"><p class="kick">${t(AD.swipe)}</p><h2 class="d">${t(AD.social.days)}</h2>
      <div class="tiles">${HIGHLIGHTS.map((h) => `<figure><img src="${photo(h.photo)}" alt=""><figcaption>${t(h.name)}</figcaption></figure>`).join('')}</div>
      <p class="chips">${ALSO.slice(0, 6).map((g) => `<span>${t(g)}</span>`).join('')}</p></div>${foot}</section>`,
    `<section class="s light"><div class="in"><p class="kick">${t(home.SCHEDULE.kicker)}</p><h2 class="d">${t(home.SCHEDULE.title)}</h2>
      <div class="sdays">${home.SCHEDULE.days.map((d, i) => `<div><p class="n">${i + 1} · ${t(d.day)}</p><b class="d">${t(d.theme)}</b><span>${d.rows.filter((r) => !/^(Breakfast|Dinner|Lunch|Meet|Arrive|The bus|Back at)/.test(r.what.en)).slice(0, 3).map((r) => t(r.what)).join(' ')}</span></div>`).join('')}</div>
      <p class="lead">${t(home.SCHEDULE.intro)}</p></div>${foot}</section>`,
    `<section class="s photo"><img class="bg" src="${photo('lake-cypress')}" alt=""><div class="shade"></div><div class="in bottom"><p class="kick">${t(S('nav.stay'))}</p><h2 class="d">${t(AD.social.stay)}</h2>
      <ul>${home.STAY.cards.slice(0, 2).map((x) => `<li>${t(x.title)}</li>`).join('')}<li>${t(home.STAY.signature.title)}</li></ul>
      <h2 class="d second">${t(AD.social.care)}</h2></div>${foot}</section>`,
    `<section class="s dark"><div class="in"><p class="kick">${t(AD.feesTitle)}</p><h2 class="d">${dates}</h2>
      <p class="d fee">${esc(twd(offer.fee))} <small>${t(AD.perCamper)}</small></p>
      <p class="big">${t(AD.social.book)}</p>
      <p class="kick">${t(AD.included)}</p>
      <ul class="inc">${home.PRICING.included.slice(0, 5).map((x) => `<li>${t(x)}</li>`).join('')}</ul>
      <p class="bus">${t(home.PRICING.camp.bus)}</p>
      ${contact()}${legal()}</div>${foot}</section>`,
  ]
  const story = `<section class="s story"><img class="bg" src="${photo('winter-cypress')}" alt=""><div class="shade"></div>
    <div class="in"><p class="mean">${esc(c.brand.campMeaning)}</p><h1 class="d">${esc(c.brand.camp)}</h1><p class="d head">${t(headline)}</p><p class="tag">${t(AD.tagline)}</p>
    <p class="pills"><span class="pill">${t(AD.ages)}</span><span class="pill">${dates}</span></p>
    <ul class="pts">${home.HERO.points.map((p) => `<li>${t(p)}</li>`).join('')}</ul>
    <p class="d fee">${esc(twd(offer.fee))} <small>${t(AD.perCamper)}</small></p><p class="big">${t(AD.social.book)}</p></div>${foot}</section>`
  const wide = hero('wide', 'winter-cypress')
  const square = hero('square', 'lake-cypress')

  // captions for the posts
  const tagList = lang === 'en' ? '#CampWOW #WorldOfOutdoorWonders #OutdoorCamp #WinterCamp #Miaoli #Glamping #KidsCampTaiwan' : '#CampWOW #戶外營隊 #冬令營 #寒假營隊 #苗栗三灣 #斑比跳跳 #全美語生活環境 #豪華露營'
  const cap = (lines) => lines.map((l) => (typeof l === 'string' ? l : l[lang === 'en' ? 'en' : 'zh'])).join('\n')
  const captions = {
    instagram: cap([`${c.brand.camp} · ${c.brand.campMeaning}`, AD.social.lead, '', { en: `${offer.dates.en} · ages 10–14 · Bambi Glamping, Sanwan, Miaoli`, zh: `${offer.dates.zh}・10–14 歲・苗栗三灣斑比跳跳` }, { en: 'Kayaking on the lake, the eco-tram at dusk, the Bambi Amazing Race, a shelter build, campfires and Star Cinema.', zh: '湖畔獨木舟、黃昏遊園車、斑比探索大挑戰、野外庇護所挑戰、營火與星空電影院。' }, { en: 'Luxury camper vans, three meals a day, counselors at about 1:4 and a nurse on site 24/7.', zh: '頂級豪華露營車、每日三餐、隊輔與營員約 1:4、24 小時駐點護理師。' }, { en: `${twd(offer.fee)} per camper, charter bus from Taichung included. Pilot camp: 30 places.`, zh: `每位營員 ${twd(offer.fee)}，含臺中來回遊覽車專車。試辦營限額 30 名營員。` }, '', tagList]),
    facebook: cap([`${c.brand.camp} · ${c.brand.campMeaning}`, AD.social.lead, '', home.SCHEDULE.intro, { en: `Day 1: ${home.SCHEDULE.days[0].theme.en}. Day 2: ${home.SCHEDULE.days[1].theme.en}. Day 3: ${home.SCHEDULE.days[2].theme.en}. Day 4: ${home.SCHEDULE.days[3].theme.en}.`, zh: `第一天：${home.SCHEDULE.days[0].theme.zh}。第二天：${home.SCHEDULE.days[1].theme.zh}。第三天：${home.SCHEDULE.days[2].theme.zh}。第四天：${home.SCHEDULE.days[3].theme.zh}。` }, '', home.PRICING.camp.bus, { en: `${twd(offer.fee)} per camper. ${home.PRICING.pilotLimit(30).en}.`, zh: `每位營員 ${twd(offer.fee)}。${home.PRICING.pilotLimit(30).zh}。` }, home.PRICING.guarantee, '', tagList]),
    tiktok: cap([{ en: `${c.brand.camp}: four days outdoors, all in English. ${offer.dates.en}, ages 10–14, Miaoli.`, zh: `${c.brand.camp}：四天戶外營隊生活，全程美語。${offer.dates.zh}，10–14 歲，苗栗三灣。` }, tagList]),
  }
  captions.all = Object.values(captions).join('\n')
  seen.push(captions.all)
  return { brochure, pamphlet, slides, story, wide, square, captions, seen }
}

const BROCHURE_CSS = `
  @page { size: A4; margin: 0; }
  body { font-size: 9.6pt; line-height: 1.5; }
  .page { width: 210mm; height: 297mm; padding: 17mm 16mm 15mm; position: relative; overflow: hidden; break-after: page; background: var(--parch); }
  .page:last-child { break-after: auto; }
  h2 { font-size: 25pt; line-height: 1.12; color: var(--pine); margin: 2pt 0 9pt; } h2.second { margin-top: 15pt; font-size: 19pt; }
  h3 { font-size: 13pt; color: var(--pine); margin: 12pt 0 5pt; }
  p { margin: 0 0 5pt; } .lead { font-size: 11.6pt; line-height: 1.5; color: #33423a; max-width: 150mm; margin-bottom: 9pt; }
  .small { font-size: 8.3pt; color: #56655c; } .note { background: var(--parch2); border-radius: 8pt; padding: 8pt 11pt; margin: 9pt 0; font-size: 9pt; }
  .cover { padding: 0; color: #fff; background: var(--pine9); } .cover .bg { position: absolute; inset: 0; } .cover .shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(15,39,29,.6) 0%, rgba(15,39,29,.15) 34%, rgba(15,39,29,.72) 70%, rgba(15,39,29,.95) 100%); }
  .cover .top { position: absolute; top: 15mm; left: 16mm; font-weight: 600; font-size: 10.5pt; letter-spacing: .04em; }
  .cover .mid { position: absolute; left: 16mm; right: 16mm; bottom: 66mm; } .cover .mean { font-size: 10.5pt; font-weight: 700; letter-spacing: .26em; text-transform: uppercase; color: var(--cedar); }
  .cover h1 { font-size: 76pt; line-height: 1; margin: 4pt 0 6pt; } .cover .head { font-size: 23pt; line-height: 1.15; } .cover .tag { font-size: 14pt; margin: 8pt 0 12pt; color: #fff; }
  .cover .pills .pill { margin-right: 6pt; font-size: 10pt; }
  .cover .points { position: absolute; left: 16mm; right: 16mm; bottom: 17mm; list-style: none; padding: 12pt 0 0; border-top: 1px solid rgba(255,255,255,.35); font-size: 11.5pt; } .cover .points li { margin-bottom: 4pt; } .cover .points li::before { content: '✓ '; color: var(--cedar); font-weight: 700; }
  .qa { background: #fff; border: 1px solid var(--line); border-radius: 10pt; padding: 10pt 13pt; margin: 4pt 0 6pt; } .qa .q { font-weight: 700; color: var(--pine); }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 9pt; } figure { margin: 0; background: #fff; border: 1px solid var(--line); border-radius: 10pt; overflow: hidden; } figure .ph { height: 40mm; } figcaption { padding: 7pt 10pt 9pt; font-size: 8.8pt; line-height: 1.4; } figcaption b { display: block; font-size: 10.5pt; color: var(--pine); margin-bottom: 2pt; }
  .chips span { display: inline-block; border: 1px solid var(--line); background: #fff; border-radius: 999px; padding: 3pt 10pt; margin: 0 4pt 5pt 0; font-size: 8.8pt; font-weight: 600; color: var(--pine); }
  .days { display: grid; grid-template-columns: 1fr 1fr; gap: 9pt; } .day { background: #fff; border: 1px solid var(--line); border-radius: 10pt; padding: 10pt 12pt; } .day .n, .mini .n, .sdays .n { font-size: 7.8pt; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--cedar6); margin: 0; } .day h3 { margin: 1pt 0 6pt; font-size: 12.5pt; }
  .day table { border-collapse: collapse; width: 100%; font-size: 8.7pt; line-height: 1.35; } .day th { text-align: left; vertical-align: top; width: 30pt; padding: 2pt 6pt 2pt 0; color: var(--pine); font-variant-numeric: tabular-nums; } .day td { padding: 2pt 0; vertical-align: top; }
  .row3 { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 6pt; height: 38mm; margin-bottom: 9pt; } .row3 .ph { border-radius: 8pt; overflow: hidden; }
  .cols3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 11pt; } .cols2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6pt 14pt; } .cols3 b, .cols2 b { color: var(--pine); } .cols3 p, .cols2 p { font-size: 8.9pt; line-height: 1.42; }
  .meals { margin-top: 8pt; } .meals ul { font-size: 8.9pt; } .ins .by { font-size: 8pt; color: var(--cedar6); font-weight: 600; }
  .feebox { display: grid; grid-template-columns: auto 1fr; gap: 16pt; align-items: center; background: var(--pine); color: #fff; border-radius: 12pt; padding: 13pt 17pt; margin: 4pt 0 6pt; } .feebox .fee { font-size: 30pt; line-height: 1; margin: 0; } .feebox .when { font-size: 15pt; margin: 0 0 3pt; } .feebox p { margin: 0; font-size: 9pt; }
  .lists ul { font-size: 8.9pt; } .lists h3 { margin-top: 8pt; }
  table.refund { border-collapse: collapse; width: 100%; font-size: 8.8pt; } table.refund th, table.refund td { text-align: left; padding: 3.5pt 8pt; border-bottom: 1px solid var(--line); } table.refund th { color: var(--pine); } table.refund td:last-child, table.refund th:last-child { text-align: right; width: 70pt; font-variant-numeric: tabular-nums; font-weight: 700; }
  .pack { columns: 2; font-size: 9pt; } .who { margin: 4pt 0 9pt; } .who > div { background: #fff; border: 1px solid var(--line); border-radius: 9pt; padding: 8pt 10pt; } .who i { color: #8a2a1b; font-style: normal; }
  .legal { font-size: 8.5pt; font-weight: 600; } .contact { font-size: 12pt; font-weight: 700; color: var(--pine); } .duty { margin-top: 8pt; } .credit { position: absolute; left: 16mm; bottom: 9mm; font-size: 7.5pt; color: #7c887f; }
  .strip { display: grid; grid-template-columns: 1.3fr 1fr 1.3fr; gap: 6pt; height: 40mm; margin-top: 10pt; } .strip .ph { border-radius: 9pt; overflow: hidden; }
  .closing { position: absolute; left: 16mm; right: 16mm; bottom: 17mm; height: 62mm; border-radius: 12pt; overflow: hidden; color: #fff; } .closing img { position: absolute; inset: 0; } .closing .shade { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(15,39,29,.85), rgba(15,39,29,.15)); } .closing p { position: absolute; left: 14pt; bottom: 26pt; font-size: 30pt; line-height: 1; margin: 0; } .closing span { position: absolute; left: 14pt; bottom: 11pt; font-size: 10pt; font-weight: 600; }
`
const PAMPHLET_CSS = `
  @page { size: A5; margin: 0; }
  body { font-size: 8.3pt; line-height: 1.45; }
  .page { width: 148mm; height: 210mm; padding: 11mm 10mm 10mm; position: relative; overflow: hidden; break-after: page; background: var(--parch); } .page:last-child { break-after: auto; }
  .cover { padding: 0; color: #fff; background: var(--pine9); } .cover .bg { position: absolute; inset: 0; } .cover .shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(15,39,29,.6) 0%, rgba(15,39,29,.15) 34%, rgba(15,39,29,.74) 68%, rgba(15,39,29,.96) 100%); }
  .cover .top { position: absolute; top: 10mm; left: 10mm; font-weight: 600; font-size: 8pt; } .cover .mid { position: absolute; left: 10mm; right: 10mm; bottom: 58mm; } .cover .mean { font-size: 7.6pt; font-weight: 700; letter-spacing: .26em; text-transform: uppercase; color: var(--cedar); }
  .cover h1 { font-size: 54pt; line-height: 1; margin: 3pt 0 5pt; } .cover .head { font-size: 16.5pt; line-height: 1.15; } .cover .tag { font-size: 10.5pt; margin: 6pt 0 9pt; } .cover .pill { margin-right: 4pt; font-size: 8pt; }
  .cover .points { position: absolute; left: 10mm; right: 10mm; bottom: 11mm; list-style: none; padding: 8pt 0 0; border-top: 1px solid rgba(255,255,255,.35); font-size: 8.8pt; } .cover .points li { margin-bottom: 3pt; } .cover .points li::before { content: '✓ '; color: var(--cedar); font-weight: 700; }
  h2 { font-size: 17pt; color: var(--pine); margin: 1pt 0 6pt; line-height: 1.12; } p { margin: 0 0 4pt; } b { color: var(--pine); }
  .mini { display: grid; grid-template-columns: 1fr 1fr; gap: 5pt 9pt; margin-bottom: 7pt; } .mini > div { background: #fff; border: 1px solid var(--line); border-radius: 7pt; padding: 6pt 8pt; } .mini .n { font-size: 6.6pt; } .mini b.d { display: block; font-size: 9.6pt; line-height: 1.2; margin: 1pt 0 3pt; } .mini ul { font-size: 7.5pt; line-height: 1.32; padding-left: 1em; } .mini li { margin-bottom: 1pt; }
  .feebox { display: grid; grid-template-columns: auto 1fr; gap: 11pt; align-items: center; background: var(--pine); color: #fff; border-radius: 9pt; padding: 8pt 11pt; margin: 0 0 6pt; } .feebox .fee { font-size: 21pt; line-height: 1; margin: 0; } .feebox .when { font-size: 11pt; margin: 0 0 2pt; } .feebox p { margin: 0; font-size: 7.6pt; } .feebox b { color: #fff; }
  .small { font-size: 7.2pt; color: #56655c; } .legal { font-size: 7.2pt; font-weight: 600; } .contact { font-size: 9.5pt; font-weight: 700; color: var(--pine); } .pending { font-size: 6.8pt; margin-bottom: 3pt; } .credit { position: absolute; left: 10mm; bottom: 5mm; font-size: 6.2pt; color: #7c887f; }
`
const SOCIAL_CSS = (w, h) => `
  html, body { width: ${w}px; height: ${h}px; overflow: hidden; }
  .s { width: ${w}px; height: ${h}px; position: relative; overflow: hidden; font-size: ${Math.round(w / 36)}px; line-height: 1.4; }
  .s .bg { position: absolute; inset: 0; } .s .shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(15,39,29,.55) 0%, rgba(15,39,29,.12) 30%, rgba(15,39,29,.78) 66%, rgba(15,39,29,.96) 100%); }
  .s .in { position: absolute; left: 7%; right: 7%; bottom: 13%; color: #fff; } .s.light .in, .s.dark .in { top: 6%; bottom: 9%; display: flex; flex-direction: column; justify-content: center; } .s.light { background: var(--parch); } .s.light .in { color: var(--ink); } .s.dark { background: var(--pine); }
  .mean { font-size: .78em; font-weight: 700; letter-spacing: .26em; text-transform: uppercase; color: var(--cedar); margin-bottom: .2em; }
  h1 { font-size: 4.9em; line-height: .98; } .head { font-size: 1.62em; line-height: 1.15; margin-top: .28em; } .tag { font-size: 1.12em; margin: .5em 0 .7em; } .pill { margin-right: .4em; font-size: .84em; }
  h2 { font-size: 2.35em; line-height: 1.1; margin: .12em 0 .5em; } .s.light h2 { color: var(--pine); } h2.second { font-size: 1.6em; margin-top: .9em; }
  .kick { font-size: .78em; } .s.photo .kick, .s.dark .kick { color: var(--cedar); }
  .tiles { display: grid; grid-template-columns: 1fr 1fr; gap: .55em; margin-bottom: .8em; } .tiles figure { margin: 0; position: relative; border-radius: .7em; overflow: hidden; aspect-ratio: 1.2; } .tiles figcaption { position: absolute; left: 0; right: 0; bottom: 0; padding: 1.6em .7em .5em; color: #fff; font-weight: 700; font-size: .86em; line-height: 1.2; background: linear-gradient(180deg, transparent, rgba(15,39,29,.9)); }
  .chips span { display: inline-block; border: 1.5px solid var(--line); background: #fff; border-radius: 999px; padding: .2em .8em; margin: 0 .3em .4em 0; font-size: .82em; font-weight: 600; color: var(--pine); }
  .sdays { display: grid; gap: .55em; margin-bottom: .9em; } .sdays > div { background: #fff; border: 1.5px solid var(--line); border-radius: .7em; padding: .6em .9em; } .sdays .n { font-size: .68em; } .sdays b { display: block; font-size: 1.22em; line-height: 1.2; color: var(--pine); } .sdays span { display: block; font-size: .8em; line-height: 1.4; color: #44534a; margin-top: .25em; } .s.dark .inc { font-size: .92em; margin: .2em 0 .9em; } .s.dark .kick { margin-top: .4em; }
  .lead { font-size: .98em; color: #33423a; } .s ul { list-style: none; padding: 0; font-size: 1.12em; } .s ul li { margin-bottom: .3em; } .s ul li::before { content: '✓ '; color: var(--cedar); font-weight: 700; }
  .fee { font-size: 3.1em; line-height: 1; margin: .15em 0 .2em; color: var(--cedar); } .fee small { font-family: 'Inter Variable', 'Noto Sans TC Variable', sans-serif; font-size: .3em; font-weight: 600; color: #fff; letter-spacing: 0; } .big { font-size: 1.3em; font-weight: 700; margin-bottom: .7em; } .bus { font-size: .9em; opacity: .92; margin-bottom: .8em; }
  .pending { font-size: .66em; margin-top: .4em; } .legal { font-size: .7em; font-weight: 600; margin-top: .4em; } .contact { font-size: 1.15em; font-weight: 700; color: var(--cedar); }
  .foot { position: absolute; left: 7%; right: 7%; bottom: 4.2%; display: flex; justify-content: space-between; font-size: .66em; font-weight: 600; letter-spacing: .03em; color: rgba(255,255,255,.85); } .s.light .foot { color: #6d7a71; }
  .s.story .in { bottom: 12%; } .s.story h1 { font-size: 5.6em; } .s.story .pts { margin: .9em 0 1em; font-size: 1.02em; }
  .s.wide .in { bottom: 14%; } .s.wide h1 { font-size: 3.3em; } .s.wide .head { font-size: 1.1em; } .s.wide .tag { font-size: .8em; } .s.wide .mean { font-size: .52em; } .s.wide .pill { font-size: .56em; } .s.wide .foot { font-size: .46em; } .s.wide { font-size: ${Math.round(w / 26)}px; }
`

// ── Wording check, then render ──────────────────────────────────────────────────────────────
const AD_ONLY = /課程|上課|教學|老師|師資|學費|招生|結業|學員|學生|\bstudents?\b|\btuition\b|classroom|syllabus|learn(ing)? english|\bteach/i
const built = { zh: build('zh-TW'), en: build('en') }
for (const [lang, b] of Object.entries(built)) for (const text of b.seen) {
  const bad = broken(text)
  if (bad.length) throw new Error(`Advert wording (${lang}) breaks “${bad[0][0]}”: “${bad[0][1]}” in “${text.slice(0, 80)}”`)
  const m = text.match(AD_ONLY)
  if (m) throw new Error(`Advert wording (${lang}) uses “${m[0]}”, which reads as teaching: “${text.slice(0, 80)}”`)
}

rmSync(out, { recursive: true, force: true })
mkdirSync(path.join(out, 'social'), { recursive: true })
const tmp = path.join(out, '.tmp.html')
const browser = await chromium.launch()
const page = await browser.newPage()
mkdirSync(path.join(out, '.photos'), { recursive: true })
for (const id of PHOTOS) {
  const src = 'data:image/webp;base64,' + readFileSync(path.join(root, 'public/media/bambi', id + '.webp')).toString('base64')
  const jpeg = await page.evaluate(async (src) => {
    const im = new Image(); im.src = src; await im.decode()
    const k = Math.min(1, 1500 / im.naturalWidth)
    const cv = document.createElement('canvas'); cv.width = Math.round(im.naturalWidth * k); cv.height = Math.round(im.naturalHeight * k)
    cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height)
    return cv.toDataURL('image/jpeg', 0.84).split(',')[1]
  }, src)
  writeFileSync(path.join(out, '.photos', id + '.jpg'), Buffer.from(jpeg, 'base64'))
}
const show = async (html) => { writeFileSync(tmp, html); await page.goto('file://' + tmp); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(250) }
const shot = async (name, html, w, h) => { await page.setViewportSize({ width: w, height: h }); await show(doc(html, SOCIAL_CSS(w, h))); await page.screenshot({ path: path.join(out, 'social', name + '.jpg'), type: 'jpeg', quality: 92 }); console.log('wrote', path.relative(root, path.join(out, 'social', name + '.jpg'))) }
for (const [lang, b] of Object.entries(built)) {
  await page.setViewportSize({ width: 1000, height: 1400 })
  await show(b.brochure); await page.pdf({ path: path.join(out, `brochure-${lang}.pdf`), format: 'A4', printBackground: true }); console.log('wrote', path.relative(root, path.join(out, `brochure-${lang}.pdf`)))
  await show(b.pamphlet); await page.pdf({ path: path.join(out, `pamphlet-${lang}.pdf`), format: 'A5', printBackground: true }); console.log('wrote', path.relative(root, path.join(out, `pamphlet-${lang}.pdf`)))
  for (const [i, s] of b.slides.entries()) await shot(`instagram-${lang}-${i + 1}`, s, 1080, 1350)
  await shot(`story-tiktok-${lang}`, b.story, 1080, 1920)
  await shot(`facebook-${lang}`, b.wide, 1200, 630)
  await shot(`square-${lang}`, b.square, 1080, 1080)
}
await browser.close()
rmSync(tmp, { force: true })
rmSync(path.join(out, '.photos'), { recursive: true, force: true })

const C = (lang) => built[lang].captions
writeFileSync(path.join(out, 'captions.md'), `# ${c.brand.camp}: captions for the posts

Images are in \`social/\`. Instagram: the five \`instagram-*\` images as one carousel. Stories, Reels cover and TikTok: \`story-tiktok-*\`. Facebook link or cover image: \`facebook-*\`. Any square slot: \`square-*\`.

## Instagram (繁體中文)

${C('zh').instagram}

## Instagram (English)

${C('en').instagram}

## Facebook (繁體中文)

${C('zh').facebook}

## Facebook (English)

${C('en').facebook}

## TikTok (繁體中文)

${C('zh').tiktok}

## TikTok (English)

${C('en').tiktok}

## Before anything is printed or posted

${MISSING.map((m) => `- Still needed: ${m}.`).join('\n') || '- Nothing outstanding.'}
`)
console.log('wrote', path.relative(root, path.join(out, 'captions.md')))
if (MISSING.length) console.log('\nNot ready to print or post yet:\n' + MISSING.map((m) => '  ☐ ' + m).join('\n'))
