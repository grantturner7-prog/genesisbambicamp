// End-to-end checks against a running server: node scripts/e2e.mjs [baseUrl] [only]
// `only` runs just the sections whose title contains it, e.g. "map life" or "problems found".
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:5199'
const ONLY = (process.argv[3] || '').toLowerCase()
const section = (title) => !ONLY || title.toLowerCase().includes(ONLY)
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
// Night mode follows the visitor's clock, so every test runs at midday unless it says otherwise.
const newContext = browser.newContext.bind(browser)
browser.newContext = async (opts) => { const ctx = await newContext(opts); ctx.setDefaultNavigationTimeout(120000); await ctx.addInitScript(() => { if (!window.__clock) Date.prototype.getHours = () => 12 }); return ctx }
const results = []
const errs = []
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!cond) process.exitCode = 1 }
const newPage = async (lang = 'en') => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript((l) => { if (!sessionStorage.getItem('init')) { localStorage.setItem('gya.lang', l); localStorage.setItem('gya.season', 'summer'); sessionStorage.setItem('init', '1') } }, lang)
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)) })
  return page
}

// ── Home: language + registration + refund calculator
if (section("Home: language + registration + refund calculator")) {
  const page = await newPage('en')
  const posts = []
  page.on('request', (r) => { if (r.method() === 'POST') posts.push(r.url()) })
  await page.goto(BASE + '/')
  ok('home: English headline', (await page.textContent('[data-hero-headline]')).includes('American-Style Summer Adventure Camp'))
  await page.getByRole('button', { name: '繁中' }).first().click()
  ok('home: switches to 繁體中文', (await page.textContent('[data-hero-headline]')).includes('美式夏季戶外探索營') && (await page.evaluate(() => document.documentElement.lang)) === 'zh-TW')
  await page.reload()
  ok('home: language persists after reload', (await page.textContent('[data-hero-headline]')).includes('美式夏季戶外探索營'))
  await page.getByRole('button', { name: 'EN' }).first().click()
  await page.getByRole('button', { name: 'Winter' }).first().click()
  ok('home: season switch → winter headline', (await page.textContent('[data-hero-headline]')).includes('Winter'))
  const card = await page.textContent('[data-camp-card]')
  ok('home: the winter camp card: 4 days / 3 nights, its dates, pilot, 30 campers, fee', ['4 Days / 3 Nights', 'Thursday to Sunday', '28–31 January 2027 (Thursday to Sunday)', 'First camp · Pilot', 'Pilot camp, limited to 30 campers', 'meet at The Lin Hotel, Taichung, at 08:00; the charter bus leaves at 08:30', 'returns to The Lin Hotel, Taichung, at about 11:30', 'NT$35,000', 'per camper'].every((x) => card.includes(x)), card.slice(0, 200))
  ok('home: one camp only: no option letters, no other lengths, no family camp', (await page.locator('[data-camp-card]').count()) === 1 && (await page.locator('[data-family-camp], [data-family-pill], [data-option-card]').count()) === 0 && !/Option [ABC]\b|Options A|family camp|5 Days|3 Days \/ 2 Nights|Tuesday/i.test(await page.textContent('body')))
  await page.locator('header').getByRole('button', { name: 'Register' }).first().click()
  const regNote = await page.textContent('[data-register-note]')
  ok('home: winter registration shows the camp dates, the meeting point and the bus times, with no option to choose', (await page.locator('[data-register-option]').count()) === 0 && (await page.textContent('[data-register-dates]')).includes('28–31 January 2027') && ['meet at The Lin Hotel, Taichung, at 08:00', 'leaves at 08:30', 'returns to The Lin Hotel, Taichung, at about 11:30'].every((x) => regNote.includes(x)))
  await page.keyboard.press('Escape')
  const heroTop = await page.locator('section').first().textContent()
  ok('home: the hero carries the first camp', heroTop.includes('28–31 January 2027') && (await page.textContent('[data-pilot-pill]')).includes('limited to 30 campers') && heroTop.includes('campers at most in the pilot camp'), heroTop.slice(0, 160))
  ok('home: pool relays hidden in winter', !(await page.textContent('#seasons')).includes('Aurora Pool Relays'))
  await page.getByRole('button', { name: 'Summer' }).first().click()
  const summerCard = await page.textContent('[data-camp-card]')
  ok('home: summer is a placeholder: coming soon, with no dates, no fee and nothing to register for', (await page.locator('[data-camp-card]').count()) === 1 && summerCard.includes('Summer Camp') && summerCard.includes('Coming soon') && !/\d{4}|NT\$|January|4 Days|Wednesday|\d\d:\d\d/.test(summerCard) && (await page.locator('[data-camp-card] [data-register-open]').count()) === 0, summerCard)
  const heroSummer = await page.locator('section').first().textContent()
  ok('home: summer hero says coming soon, with no date and no pilot', (await page.locator('[data-pilot-pill]').count()) === 0 && heroSummer.includes('Summer Camp · Coming soon') && !/2027|January/.test(heroSummer) && heroSummer.includes('campers per session, max'))
  await page.locator('header').getByRole('button', { name: 'Register' }).first().click()
  ok('home: registration offers only the camp that has dates', (await page.locator('[data-register-modal] select').first().inputValue()) === 'winter' && (await page.locator('[data-register-modal] select').first().locator('option[value=summer]').evaluate((o) => o.disabled)) && (await page.locator('[data-register-modal] select').first().locator('option[value=summer]').textContent()).includes('Coming soon') && (await page.textContent('[data-register-dates]')).includes('28–31 January 2027'))
  await page.keyboard.press('Escape')
  ok('refund calculator: no fee is shown under the camp that has none', (await page.locator('#refund input').first().inputValue()) === '', await page.locator('#refund input').first().inputValue())
  await page.click('[data-see-dated-camp]')
  ok('refund calculator: the dated camp brings its fee back', (await page.locator('#refund input').first().inputValue()) === '35000')
  ok('home: the placeholder leads back to the dated camp', (await page.textContent('[data-camp-card]')).includes('28–31 January 2027') && (await page.textContent('[data-hero-headline]')).includes('Winter'))
  await page.getByRole('button', { name: 'Summer' }).first().click()
  ok('home: pool relays shown in summer', (await page.textContent('#seasons')).includes('Aurora Pool Relays'))
  const body = await page.textContent('body')
  ok('home: venue address present', body.includes('No. 27, Xiaobeipu, Beipu Village, Sanwan Township, Miaoli County'))
  ok('home: travel agency badge in pricing', (await page.locator('[data-agency-badge]').count()) === 1)
  ok('home: footer has three legal blocks', ['Activity Co-Organizer', 'Venue Partner', 'Travel & Transport Organizer', '88491889'].every((x) => body.includes(x)))

  // meals, snack coupons, camp days
  ok('home: three meals a day, no fourth meal or afternoon tea', body.includes('Three meals a day') && !/four meals|4 daily|afternoon tea|campfire snacks/i.test(body))
  const meals = await page.textContent('[data-meals]')
  const mealsCount = await page.textContent('[data-meals-count]')
  ok('home: breakfast, DIY lunch with the chef and dinner, and no buffet wording', ['Breakfast', 'DIY lunch with the chef', 'Dinner'].every((x) => meals.includes(x)) && !/buffet/i.test(meals))
  ok('home: the winter menu from the venue kitchen, with no day named', ['Eggs, bacon, bread and sandwiches, with milk and soy milk', 'curry, pizza, rice balls and donburi rice boxes', 'meatball pasta with corn soup and bread', 'fried chicken and braised pork with vegetables and rice', 'not set yet'].every((x) => meals.includes(x)) && !/monday|tuesday|wednesday|thursday|friday|saturday|sunday/i.test(meals.replace(mealsCount, '')), meals)
  ok('home: the nine meals are counted, so three meals a day is not read as twelve', mealsCount.startsWith('Nine meals in all') && mealsCount.includes('Thursday') && mealsCount.includes('Sunday'), mealsCount)
  ok('home: no clock times on the meals (no schedule published yet)', !/\d\d:\d\d/.test(meals), meals.match(/\d\d:\d\d/)?.[0])
  ok('home: final-evening Wagyu dinner highlighted with its photo', (await page.textContent('[data-signature-dinner]')).includes('Wagyu') && (await page.locator('[data-signature-dinner] img').getAttribute('src')).includes('wagyu-platter'))
  const coupons = await page.textContent('[data-snack-coupons]')
  ok('home: snack coupon packs of NT$1,000, NT$2,000 and NT$3,000 at the Airstream', ['NT$1,000', 'NT$2,000', 'NT$3,000', 'Airstream', 'not part of the camp fee'].every((x) => coupons.includes(x)))
  const pricing = await page.textContent('#pricing')
  ok('home: the bus box names the meeting point and both journeys are included; nothing of the old drop-off is left', pricing.includes('Thursday to Sunday') && pricing.includes('Meeting point: The Lin Hotel, Taichung (No. 99, Chaofu Rd., Xitun District, Taichung)') && pricing.includes('Charter bus from The Lin Hotel, Taichung, to camp and back') && pricing.includes('Travel between home and the meeting point at The Lin Hotel, Taichung') && !/Monday|Tuesday|Wednesday|14:00|Taichung Theater|drop-off/.test(body))
  ok('home: snack coupons listed under Not included', /Not included[\s\S]*Snacks and drinks at the Airstream snack shop/.test(pricing))
  {
    await page.getByRole('button', { name: 'Summer' }).first().click(); await page.waitForTimeout(200)
    ok('home: the summer camp has no day-by-day plan yet', (await page.locator('#schedule [data-day]').count()) === 0 && (await page.textContent('#schedule')).includes('will be published here with its dates'))
    await page.getByRole('button', { name: 'Winter' }).first().click(); await page.waitForTimeout(200)
    const sched = await page.textContent('#schedule')
    const days = await page.locator('#schedule [data-day]').evaluateAll((els) => els.map((e) => e.dataset.day))
    ok('home: the day-by-day plan shows the four camp days, from the meeting point to the bus home', JSON.stringify(days) === JSON.stringify(['Thursday', 'Friday', 'Saturday', 'Sunday']) && ['Four days at Camp WOW', 'Meet at The Lin Hotel, Taichung. The charter bus leaves at 08:30', 'Kayaking on the lake', 'Orienteering Quest', 'Bambi Amazing Race', 'Shelter Build Challenge', 'Multi-sports', 'Star Cinema', 'Glow Night Quest', 'Signature family dinner with Wagyu beef', 'Tug-of-War Tournament', 'Prize-giving', 'The bus leaves camp', 'Back at The Lin Hotel, Taichung', 'lights go out at 21:15'].every((x) => sched.includes(x)) && (await page.textContent('[data-rain-plan]')).includes('Grand Dining Hall'), JSON.stringify(days))
    ok('home: the camp is named in the hero and the header', (await page.textContent('h1')).trim() === 'Camp WOW' && (await page.locator('header a .font-display').first().textContent()).trim() === 'Camp WOW' && (await page.title()).includes('Camp WOW'))
    ok('home: other guests of the venue are disclosed, and visitors are not admitted', (await page.textContent('#safety')).includes('On Friday and Saturday nights Bambi Glamping’s own overnight guests are also on site') && (await page.textContent('#faq')).includes('Are there other guests at the venue during camp?'))
  }

  // camp games: the partners' 32 named activities, names kept as given
  const GAME_NAMES = ['Bambi Amazing Race', 'Orienteering Quest', 'Glow Night Quest', 'Shelter Build Challenge', 'Campcraft Survival Circuit', 'Nature Photo Safari', 'Kayak Skills Relay', 'Capture the Flag',
    'Mission Impossible Circuit', 'Tug-of-War Tournament', 'Camp Olympics Relay Medley', 'Giant Rope Jump Challenge', 'Spider Web Challenge', 'Pipeline Challenge', 'Island Hop', 'Blind Maze',
    'Toxic Waste Transfer', 'Giant Ski Race', 'Crate Crossing', 'Indoor Escape Room Race', 'Minute-to-Win-It Mega Tournament', 'Mentos Geyser Challenge', 'Foam Explosion Spectacular', 'Giant Bubble Lab',
    'Balloon Rocket Grand Prix', 'Bridge & Tower Build Challenge', 'Egg Drop Build Challenge', 'Oobleck Olympics', 'Vortex Cannon Target Challenge', 'Campfire Skit & Talent Showdown', 'Team Banner & Mascot Workshop', 'Color War Opening Ceremony']
  const cards = await page.$$eval('[data-games] > li', (els) => els.map((e) => ({ title: e.querySelector('h3').textContent, alt: e.querySelector('h3 + p').textContent, body: e.querySelector('h3 + p + p').textContent })))
  ok('games: all 32 activities shown in order, names as given', cards.length === 32 && (await page.locator('[data-games] > li:visible').count()) === 32 && GAME_NAMES.every((n, i) => cards[i].title === n), cards.map((c) => c.title).filter((t, i) => t !== GAME_NAMES[i]).join(' | '))
  ok('games: every card also carries its Chinese name and a description', cards.every((c) => /[\u4e00-\u9fff]/.test(c.alt) && c.body.length > 30) && cards[0].alt === '斑比探索大挑戰')
  // the icon reviewed for each card (objects only): a misspelt or swapped icon name fails here
  const GAME_ICONS = ['route', 'compass', 'flashlight', 'tent', 'backpack', 'camera', 'kayak', 'flag', 'fingerprint-pattern', 'move-horizontal', 'medal', 'lasso', 'waypoints', 'cylinder', 'land-plot', 'eye-off',
    'biohazard', 'footprints', 'boxes', 'key-round', 'timer', 'droplets', 'flask-conical', 'bubbles', 'rocket', 'blocks', 'egg', 'beaker', 'tornado', 'mic-vocal', 'paintbrush', 'party-popper']
  const icons = await page.$$eval('[data-games] > li', (els) => els.map((e) => [...e.querySelectorAll('svg')].map((s) => (s.getAttribute('class').match(/lucide-([a-z0-9-]+)/) || [])[1]).join('+')))
  ok('games: one reviewed object icon per card, no photos, no pictures of people', (await page.locator('#games :is(img, picture, video, canvas, image)').count()) === 0 && icons.length === 32 && icons.every((x, i) => x === GAME_ICONS[i]), icons.filter((x, i) => x !== GAME_ICONS[i]).join(' | '))
  ok('games: introduced as some of the fun activities campers take part in', (await page.textContent('#games h2')) === 'Some of the fun activities campers take part in')
  await page.locator('[data-game-filter="team"]').click()
  ok('games: filter by type (Team Challenges → 7)', (await page.locator('[data-games] > li').count()) === 7 && (await page.textContent('[data-games]')).includes('Spider Web Challenge') && !(await page.textContent('[data-games]')).includes('Tug-of-War'))
  await page.locator('[data-game-filter="all"]').click()
  ok('games: back to all 32', (await page.locator('[data-games] > li:visible').count()) === 32)
  ok('games: the seasonal highlights no longer repeat them', !/Orienteering & Scavenger|Capture the Flag & Lawn|Wilderness Shelter/.test(await page.textContent('#seasons')) && (await page.textContent('#seasons')).includes('Star Cinema Night'))
  ok('games: the schedule note and rain plan close the section', (await page.locator('#games [data-games] ~ div [data-schedule-teaser]').count()) === 1 && (await page.locator('#games [data-games] ~ div [data-rain-plan]').count()) === 1)

  // refund calculator
  const fee = page.locator('#refund input').first(); const days = page.locator('#refund input').nth(1)
  await fee.fill('20000')
  const expect = { 45: 'NT$19,000', 35: 'NT$18,000', 25: 'NT$16,000', 10: 'NT$14,000', 1: 'NT$10,000', 0: 'NT$0' }
  for (const [d, amt] of Object.entries(expect)) { await days.fill(d); const t = await page.textContent('[data-refund-amount]'); ok(`refund: ${d} days → ${amt}`, t.startsWith(amt), t) }
  await page.getByRole('button', { name: 'Session below minimum group' }).click()
  ok('refund: low enrollment → 100%', (await page.textContent('[data-refund-amount]')).startsWith('NT$20,000'))

  // registration
  await page.locator('header').getByRole('button', { name: 'Register' }).click()
  await page.waitForSelector('[data-register-modal]')
  await page.click('[data-register-next]')
  ok('register: step 1 blocks empty form', await page.locator('[data-register-modal] [role=alert]').isVisible())
  const m = page.locator('[data-register-modal]')
  const fill = async (label, v) => m.getByLabel(label, { exact: false }).first().fill(v)
  ok('register: one camp, so no option to choose and no group fields', (await m.locator('[data-register-option], [data-register-adults], [data-register-group], [data-register-others]').count()) === 0 && (await m.locator('[data-register-note]').textContent()).includes('The Lin Hotel, Taichung, at 08:00'))
  ok('register: coupon packs offered, none by default', (await m.locator('[data-register-coupon] option').count()) === 4 && (await m.locator('[data-register-coupon]').inputValue()) === '')
  await m.locator('[data-register-coupon]').selectOption('2000')
  await fill('Camper full name', 'Test Camper'); await fill('Date of birth', '2014-05-01')
  await m.getByLabel('Gender').first().selectOption({ index: 1 })
  await fill('Legal guardian name', 'Test Parent'); await fill('Relationship to camper', 'Mother'); await fill('Mobile number', '0900000000'); await fill('Residential address', 'Taichung')
  await page.click('[data-register-next]')
  await m.getByLabel('Water comfort').selectOption({ index: 2 })
  await page.click('[data-register-next]')
  const boxes = m.locator('input[data-consent]')
  ok('register: five separate consent boxes', (await boxes.count()) === 5)
  ok('register: all consents unchecked by default (incl. optional media)', (await m.locator('input[data-consent]:checked').count()) === 0)
  await page.click('[data-register-submit]')
  ok('register: cannot submit without consents 1–4', await m.locator('[role=alert]').isVisible())
  for (const k of ['contract', 'pdpa', 'risk', 'van']) await m.locator(`input[data-consent="${k}"]`).check()
  await page.click('[data-register-submit]')
  await page.waitForTimeout(300)
  ok('register: no endpoint → nothing transmitted, summary shown', posts.length === 0 && (await m.textContent()).includes('Nothing you entered has left this device'))
  ok('register: media consent recorded as not given', (await m.textContent()).includes('[ ] 5.'))
  const summary = await m.locator('pre').textContent()
  ok('register: summary records the camp and the coupon pack', summary.includes('Winter') && summary.includes('4 Days / 3 Nights') && !/Option [ABC]|Family Camp|Summer/.test(summary) && summary.includes('NT$2,000 pack'), summary.slice(0, 300))
  await page.goto(BASE + '/'); await page.reload(); await page.getByRole('button', { name: 'Winter' }).first().click(); await page.locator('[data-register-open]').click()
  ok('register: the dated camp’s card opens the form', (await page.locator('[data-register-modal]').count()) === 1)
  await page.context().close()
  const dl = await newPage('en')
  await dl.goto(BASE + '/#register'); await dl.waitForSelector('[data-register-modal]', { timeout: 5000 }).catch(() => {})
  ok('home: #register deep link opens the form', (await dl.locator('[data-register-modal]').count()) === 1)
  await dl.context().close()
}

// ── Facilities: every hotspot opens its panel
if (section("Facilities: every hotspot opens its panel")) {
  const page = await newPage('en')
  await page.goto(BASE + '/facilities/')
  await page.waitForSelector('html[data-map-ready="1"]', { timeout: 90000 })
  const ids = await page.$$eval('[data-hotspot]', (els) => els.map((e) => e.dataset.hotspot))
  ok('map: 17 hotspots (11 places + 6 zones)', ids.length === 17, String(ids.length))
  let opened = 0
  for (const id of ids) {
    await page.evaluate((i) => document.querySelector(`[data-hotspot="${i}"]`).click(), id)
    await page.waitForSelector(`[data-panel="${id}"]`, { timeout: 5000 }).then(() => opened++).catch(() => {})
  }
  ok('map: every hotspot opens a panel', opened === ids.length, `${opened}/${ids.length}`)
  await page.evaluate(() => document.querySelector('[data-hotspot="snack"]').click())
  const snack = await page.textContent('[data-panel="snack"]')
  ok('map: snack shop opens on the Menu tab', snack.includes('Cool drinks') && snack.includes('100% alcohol-free'))
  ok('map: snack shop is paid with coupons, not included in the fee', snack.includes('Paid with snack coupons') && ['NT$1,000', 'NT$2,000', 'NT$3,000'].every((x) => snack.includes(x)) && !/included in/i.test(snack))
  await page.getByRole('tab', { name: 'Safety' }).click()
  ok('map: pool safety rules listed', (await page.textContent('[data-panel="snack"]')).includes('Lifeguard and counselors, always'))
  await page.getByRole('tab', { name: 'Photos & Video' }).click()
  const img = page.locator('[data-panel="snack"] figure img').first()
  await img.waitFor()
  ok('map: gallery photo loads', await img.evaluate((el) => el.complete && el.naturalWidth > 0 || new Promise((r) => { el.onload = () => r(true); el.onerror = () => r(false) })))
  await page.keyboard.press('Escape')
  ok('map: Escape closes the panel', (await page.locator('[data-panel]').count()) === 0)
  await page.goto(BASE + '/facilities/#cinema'); await page.waitForSelector('html[data-map-ready="1"]', { timeout: 90000 })
  const cin = await page.textContent('[data-panel="cinema"]')
  ok('map: #cinema deep link + licence statement', cin.includes('Star Cinema') && cin.includes('公播版'))
  await page.waitForTimeout(6000)
  ok('map: a deep link opens zoomed in on its place', Number(await page.evaluate(() => document.documentElement.dataset.mapZoom)) < 0.6, await page.evaluate(() => document.documentElement.dataset.mapZoom))
  await page.evaluate(() => document.querySelector('[data-hotspot="zone-A"]').click())
  ok('map: Zone A shows 14 camper vans', (await page.textContent('[data-panel="zone-A"]')).includes('14 camper vans'))
  await page.context().close()
}
// ── Facilities: the map stays on the board, icon markers, Full map button
for (const vp of section('Facilities: the map stays on the board, icon markers, Full map button') ? [{ name: 'desktop', width: 1440, height: 900 }, { name: 'phone', width: 390, height: 844 }] : []) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.width < 600 })
  await ctx.addInitScript(() => { localStorage.setItem('gya.lang', 'en'); localStorage.setItem('gya.season', 'summer') })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  await page.goto(BASE + '/facilities/')
  await page.waitForSelector('html[data-map-ready="1"]', { timeout: 90000 })
  await page.waitForTimeout(1500)
  const zoom = () => page.evaluate(() => Number(document.documentElement.dataset.mapZoom))
  const settle = async () => { let last = -1, frame = -1, same = 0; for (let i = 0; i < 240 && same < 4; i++) { await page.waitForTimeout(400); const f = await page.evaluate(() => window.__mapFrame || 0); if (f === frame) continue; frame = f; const z = await zoom(); same = z === last ? same + 1 : 0; last = z } } // at rest = unchanged over four drawn frames
  // spread of the markers relative to the canvas = how much of the board the map covers
  const spread = () => page.evaluate(() => {
    const c = document.querySelector('main canvas').getBoundingClientRect()
    const pts = [...document.querySelectorAll('[data-hotspot]')].map((e) => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2 - c.left, r.bottom - c.top] })
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
    const inside = pts.filter(([x, y]) => x >= 0 && x <= c.width && y >= 0 && y <= c.height).length
    return { w: (Math.max(...xs) - Math.min(...xs)) / c.width, h: (Math.max(...ys) - Math.min(...ys)) / c.height, cx: (Math.max(...xs) + Math.min(...xs)) / 2 / c.width, cy: (Math.max(...ys) + Math.min(...ys)) / 2 / c.height, inside, total: pts.length }
  })
  const shownNames = () => page.evaluate(() => [...document.querySelectorAll('[data-marker-name]')].filter((e) => getComputedStyle(e).display !== 'none').map((e) => e.textContent))
  const T = `map/${vp.name}: `
  const box = await page.locator('main canvas').boundingBox()
  const mid = [box.x + box.width / 2, box.y + box.height / 2]

  ok(T + 'opens on the full map', (await zoom()) >= 0.99, String(await zoom()))
  const s0 = await spread()
  ok(T + 'full map fills the board and every marker is on it', s0.inside === s0.total && Math.max(s0.w, s0.h) >= 0.4, JSON.stringify(s0))
  ok(T + 'markers are icons: no names shown until one is chosen', (await shownNames()).length === 0)
  ok(T + 'no Full map button while already on the full map', (await page.locator('[data-full-map]').count()) === 0)

  // try hard to zoom out
  await page.mouse.move(...mid)
  for (let i = 0; i < 40; i++) await page.mouse.wheel(0, 400)
  await page.waitForTimeout(1200)
  const s1 = await spread()
  ok(T + 'cannot zoom out past the full map', (await zoom()) <= 1.0 && Math.abs(Math.max(s1.w, s1.h) - Math.max(s0.w, s0.h)) < 0.04, `zoom ${await zoom()} spread ${JSON.stringify(s1)}`)

  // try hard to drag the map away (pan = right mouse button)
  await page.mouse.move(...mid); await page.mouse.down({ button: 'right' })
  await page.mouse.move(mid[0] + box.width * 0.9, mid[1] + box.height * 0.6, { steps: 12 }); await page.mouse.up({ button: 'right' })
  await page.waitForTimeout(1200)
  const s2 = await spread()
  ok(T + 'cannot drag the full map off the board', s2.inside === s2.total && Math.abs(s2.cx - s0.cx) < 0.06 && Math.abs(s2.cy - s0.cy) < 0.06, JSON.stringify(s2))

  // choose a place
  await page.evaluate(() => document.querySelector('[data-hotspot="pool"]').click())
  await page.waitForSelector('[data-panel="pool"]'); await settle()
  const names = await shownNames()
  ok(T + 'chosen marker shows its name, and only that one', names.length === 1 && names[0].includes('Aurora Pool'), JSON.stringify(names))
  ok(T + 'camera moved in to the place', (await zoom()) < 0.6, String(await zoom()))
  ok(T + 'Full map button appears', await page.locator('[data-full-map]').isVisible())

  // Full map pressed while the panel is still open must land exactly on the full map
  await page.click('[data-full-map]'); await settle()
  ok(T + 'Full map with the panel open lands on the full map', Math.abs((await zoom()) - 1) <= 0.01 && (await page.locator('[data-panel]').count()) === 0, `zoom ${await zoom()}`)
  await page.evaluate(() => document.querySelector('[data-hotspot="pool"]').click())
  await page.waitForSelector('[data-panel="pool"]'); await settle()

  // closing the panel keeps the view; Full map goes back out
  await page.keyboard.press('Escape'); await page.waitForTimeout(800)
  ok(T + 'closing the panel keeps the view at the place', (await zoom()) < 0.6 && (await page.locator('[data-full-map]').isVisible()))
  await page.click('[data-full-map]'); await settle()
  const s3 = await spread()
  ok(T + 'Full map returns to the whole camp', (await zoom()) >= 0.99 && s3.inside === s3.total && (await page.locator('[data-panel]').count()) === 0, `zoom ${await zoom()}`)
  ok(T + 'Full map button hides again', (await page.locator('[data-full-map]').count()) === 0)

  // zooming in by hand also offers Full map, and panning while zoomed stays over the camp
  await page.mouse.move(...mid)
  for (let i = 0; i < 6; i++) await page.mouse.wheel(0, -300)
  await page.waitForTimeout(1000)
  ok(T + 'zooming in by hand offers Full map', await page.locator('[data-full-map]').isVisible())
  for (let k = 0; k < 4; k++) { await page.mouse.move(...mid); await page.mouse.down({ button: 'right' }); await page.mouse.move(mid[0] - box.width * 0.9, mid[1] - box.height * 0.8, { steps: 8 }); await page.mouse.up({ button: 'right' }) }
  await page.waitForTimeout(1200)
  const s4 = await spread()
  ok(T + 'panning far while zoomed in still leaves the camp on screen', s4.inside >= 1, JSON.stringify(s4))

  // overlapping markers are thinned out, never stacked
  await page.click('[data-full-map]'); await settle()
  const overlaps = await page.evaluate(() => {
    const els = [...document.querySelectorAll('[data-hotspot]:not([data-hidden])')].map((e) => e.getBoundingClientRect())
    let n = 0
    for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) { const a = els[i], b = els[j]; if (Math.hypot(a.left + a.width / 2 - (b.left + b.width / 2), a.bottom - b.bottom) < 20) n++ }
    return { visible: els.length, stacked: n }
  })
  ok(T + 'no markers stacked on each other on the full map', overlaps.stacked === 0 && overlaps.visible >= 8, JSON.stringify(overlaps))
  await ctx.close()
}
// ── Facilities: problems found by independent testing stay fixed
if (section("Facilities: problems found by independent testing stay fixed")) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript(() => { localStorage.setItem('gya.lang', 'en'); localStorage.setItem('gya.season', 'summer') })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  await page.goto(BASE + '/facilities/'); await page.waitForSelector('html[data-map-ready="1"]', { timeout: 90000 }); await page.waitForTimeout(1500)
  const zoom = () => page.evaluate(() => Number(document.documentElement.dataset.mapZoom))
  const settle = async () => { let last = -1, frame = -1, same = 0; for (let i = 0; i < 240 && same < 4; i++) { await page.waitForTimeout(400); const f = await page.evaluate(() => window.__mapFrame || 0); if (f === frame) continue; frame = f; const z = await zoom(); same = z === last ? same + 1 : 0; last = z } } // at rest = unchanged over four drawn frames
  const box = await page.locator('main canvas').boundingBox(); const mid = [box.x + box.width / 2, box.y + box.height / 2]

  // scroll wheel over an icon zooms the map and does not scroll the page
  const m = await page.evaluate(() => { const r = document.querySelector('[data-hotspot="dining"]').getBoundingClientRect(); return [r.left + r.width / 2, r.top + 14] })
  await page.mouse.move(m[0], m[1]); for (let i = 0; i < 4; i++) await page.mouse.wheel(0, -300)
  await settle()
  ok('fix: wheel over an icon zooms the map, page stays put', (await zoom()) < 0.95 && (await page.evaluate(() => window.scrollY)) === 0, `zoom ${await zoom()}`)
  await page.click('[data-full-map]'); await settle()

  // hidden markers are out of the Tab order
  ok('fix: thinned-out markers cannot take keyboard focus', await page.evaluate(() => [...document.querySelectorAll('[data-hotspot][data-hidden]')].every((e) => getComputedStyle(e).visibility === 'hidden')))

  // a marker under the Full map button must not steal its click
  await page.evaluate(() => document.querySelector('[data-hotspot="checkin"]').click()); await page.waitForSelector('[data-panel="checkin"]'); await settle()
  const fb = await page.locator('[data-full-map]').boundingBox()
  await page.mouse.click(fb.x + fb.width - 8, fb.y + fb.height / 2); await settle()
  ok('fix: Full map button is never covered by an icon', (await page.locator('[data-panel]').count()) === 0 && Math.abs((await zoom()) - 1) <= 0.01, `zoom ${await zoom()}`)
  ok('fix: intro card does not come back after a place was opened', !(await page.textContent('main')).includes('Walk the camp before you arrive'))

  // hard panning while zoomed in keeps the look-at point over the island
  for (const id of ['zone-G', 'entrance', 'zone-D']) {
    await page.evaluate((i) => document.querySelector(`[data-hotspot="${i}"]`).click(), id); await settle(); await page.keyboard.press('Escape')
    for (const [dx, dy] of [[0.6, 0.55], [-0.6, -0.55], [0.6, -0.55]]) for (let k = 0; k < 3; k++) { await page.mouse.move(...mid); await page.mouse.down({ button: 'right' }); await page.mouse.move(mid[0] + box.width * dx, mid[1] + box.height * dy, { steps: 6 }); await page.mouse.up({ button: 'right' }) }
    await page.waitForTimeout(1200)
    ok(`fix: cannot drag into empty sky when zoomed in (${id})`, (await page.evaluate(() => document.documentElement.dataset.mapOnLand)) === '1')
    await page.click('[data-full-map]'); await settle()
  }

  // clicking the place that is already chosen flies back to it
  await page.evaluate(() => document.querySelector('[data-hotspot="pool"]').click()); await page.waitForSelector('[data-panel="pool"]'); await settle()
  const z0 = await zoom()
  await page.mouse.move(mid[0] - 220, mid[1]); for (let i = 0; i < 5; i++) await page.mouse.wheel(0, 300)
  await settle(); const z1 = await zoom()
  await page.evaluate(() => document.querySelector('[data-hotspot="pool"]').click()); await settle()
  ok('fix: clicking the chosen place again flies back to it', z1 > z0 + 0.03 && Math.abs((await zoom()) - z0) <= 0.02, `${z0} -> ${z1} -> ${await zoom()}`)
  await page.click('[data-full-map]'); await settle()

  // rotated full map offers Full map, which restores the standard view
  await page.mouse.move(...mid); await page.mouse.down(); await page.mouse.move(mid[0] + 420, mid[1], { steps: 8 }); await page.mouse.up(); await settle()
  ok('fix: a rotated full map offers Full map', await page.locator('[data-full-map]').isVisible())
  for (let k = 0; k < 2; k++) { await page.mouse.move(...mid); await page.mouse.down(); await page.mouse.move(mid[0] + 300, mid[1] + 40, { steps: 8 }); await page.mouse.up(); await settle() }
  const rot = await page.evaluate(() => { const c = document.querySelector('main canvas').getBoundingClientRect(); return [...document.querySelectorAll('[data-hotspot]')].filter((e) => { const r = e.getBoundingClientRect(); const x = r.left + r.width / 2; return x >= c.left && x <= c.right && r.bottom >= c.top && r.bottom <= c.bottom }).length })
  ok('fix: turning the full map keeps the whole camp framed', Math.abs((await zoom()) - 1) <= 0.01 && rot === 17, `zoom ${await zoom()} markers on canvas ${rot}/17`)
  await page.click('[data-full-map]'); await settle()
  // the turn back keeps the zoom at 1, so wait for the view itself: the button leaves once the standard view is reached
  for (let i = 0; i < 150 && (await page.locator('[data-full-map]').count()) > 0; i++) await page.waitForTimeout(400)
  ok('fix: Full map restores the standard view', (await page.locator('[data-full-map]').count()) === 0 && Math.abs((await zoom()) - 1) <= 0.01)

  // place list: mouse wheel scrolls it sideways, arrows work, chosen place is brought into view
  const chips = page.locator('main nav')
  const cb = await chips.boundingBox(); await page.mouse.move(cb.x + cb.width / 2, cb.y + cb.height - 20); await page.mouse.wheel(0, 500); await page.waitForTimeout(500)
  ok('fix: mouse wheel scrolls the place list sideways', (await chips.evaluate((e) => e.scrollLeft)) > 100 && (await page.evaluate(() => window.scrollY)) === 0)
  await page.evaluate(() => document.querySelector('[data-hotspot="zone-G"]').click())
  const chipInView = () => page.evaluate(() => { const n = document.querySelector('main nav').getBoundingClientRect(); const c = document.querySelector('[data-chip="zone-G"]').getBoundingClientRect(); return c.left >= n.left && c.right <= n.right })
  for (let i = 0; i < 20 && !(await chipInView()); i++) await page.waitForTimeout(400)
  ok('fix: chosen place is scrolled into view in the place list', await chipInView())
  await ctx.close()

  // phone held sideways: the whole map area fits on the screen
  const land = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true })
  const lp = await land.newPage(); await lp.goto(BASE + '/facilities/'); await lp.waitForSelector('html[data-map-ready="1"]', { timeout: 90000 }); await lp.waitForTimeout(3000)
  const cv = await lp.locator('main canvas').boundingBox()
  const inside = await lp.evaluate(() => { const c = document.querySelector('main canvas').getBoundingClientRect(); return [...document.querySelectorAll('[data-hotspot]')].every((e) => { const r = e.getBoundingClientRect(); return r.bottom <= Math.min(c.bottom, innerHeight) + 1 }) })
  ok('fix: phone landscape shows the whole map without scrolling', cv.y + cv.height <= 391 && inside, JSON.stringify(cv))
  await land.close()

  // phone portrait with a panel open: the chosen name stays clear of the Full map button
  const ph = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })
  await ph.addInitScript(() => { localStorage.setItem('gya.lang', 'en') })
  const pp = await ph.newPage(); await pp.goto(BASE + '/facilities/'); await pp.waitForSelector('html[data-map-ready="1"]', { timeout: 90000 }); await pp.waitForTimeout(1500)
  let clear = true
  for (const id of ['dining', 'cinema', 'snack']) {
    await pp.evaluate((i) => document.querySelector(`[data-hotspot="${i}"]`).click(), id); await pp.waitForSelector(`[data-panel="${id}"]`)
    let last = '', frame = -1, same = 0; for (let i = 0; i < 200 && same < 4; i++) { await pp.waitForTimeout(400); const [z, f] = await pp.evaluate(() => [document.documentElement.dataset.mapZoom, window.__mapFrame || 0]); if (f === frame) continue; frame = f; same = z === last ? same + 1 : 0; last = z }
    clear = clear && await pp.evaluate((i) => { const a = document.querySelector(`[data-hotspot="${i}"] [data-marker-name]`).getBoundingClientRect(); const b = document.querySelector('[data-full-map]').getBoundingClientRect(); return a.top >= b.bottom || a.left >= b.right || a.right <= b.left }, id)
  }
  ok('fix: on a phone the chosen name does not sit on the Full map button', clear)
  await ph.close()
}
// ── Games in 繁體中文 on a phone
if (section("Games in 繁體中文 on a phone")) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true })
  await ctx.addInitScript(() => { localStorage.setItem('gya.lang', 'zh-TW'); localStorage.setItem('gya.season', 'summer') })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  await page.goto(BASE + '/')
  await page.waitForSelector('[data-games]')
  const visible = () => page.$$eval('[data-games] > li', (els) => els.filter((e) => getComputedStyle(e).display !== 'none').length)
  ok('games/phone: the first eight are shown, the rest wait behind a button', (await visible()) === 8 && await page.locator('[data-games-more]').isVisible())
  await page.locator('[data-games-more]').click()
  ok('games/phone: the button shows all 32', (await visible()) === 32 && (await page.locator('[data-games-more]').count()) === 0)
  ok('games/phone: focus moves to the first newly shown activity', (await page.evaluate(() => document.activeElement?.closest('[data-game]')?.getAttribute('data-game'))) === '9')
  const first = await page.$eval('[data-game="1"]', (e) => [e.querySelector('h3').textContent, e.querySelector('h3 + p').textContent])
  ok('games/zh: the Chinese name leads with the English name beneath', first[0] === '斑比探索大挑戰' && first[1] === 'Bambi Amazing Race', first.join(' / '))
  ok('games/zh: Color War keeps its English name', (await page.$eval('[data-game="32"] h3', (e) => e.textContent)) === 'Color War 開幕式')
  ok('games/phone: no sideways scrolling', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1))
  await ctx.close()
}
// ── Night: visitors who arrive after dark get the evening site
if (section("Night: visitors who arrive after dark get the evening site")) {
  const ctx = await newContext({ viewport: { width: 1440, height: 900 } })
  ctx.setDefaultNavigationTimeout(120000)
  await ctx.addInitScript(() => { window.__clock = 21; Date.prototype.getHours = () => 21; localStorage.setItem('gya.lang', 'en'); localStorage.setItem('gya.season', 'summer') })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  await page.goto(BASE + '/')
  ok('night: the landing page opens with its evening photo', (await page.locator('[data-hero-photo]').getAttribute('src')).includes('cinema-night') && (await page.evaluate(() => document.documentElement.dataset.time)) === 'night')
  await page.locator('[data-map-preview]').scrollIntoViewIfNeeded()
  const prev = page.locator('[data-map-preview]')
  ok('night: the map teaser shows the night picture, and it loads', (await prev.getAttribute('src')).includes('map-preview-night') && await prev.evaluate((el) => el.complete && el.naturalWidth > 0 || new Promise((r) => { el.onload = () => r(true); el.onerror = () => r(false) })))
  await page.goto(BASE + '/facilities/'); await page.waitForSelector('html[data-map-ready="1"]', { timeout: 90000 })
  ok('night: the map opens in night mode', (await page.getByRole('button', { name: 'Night' }).first().getAttribute('aria-pressed')) === 'true')
  await page.getByRole('button', { name: 'Day' }).first().click()
  await page.goto(BASE + '/')
  ok('night: choosing Day holds for the rest of the visit', (await page.evaluate(() => document.documentElement.dataset.time)) === 'day' && (await page.locator('[data-hero-photo]').getAttribute('src')).includes('pool-sunset'))
  await page.goto(BASE + '/facilities/?time=night'); await page.waitForSelector('html[data-map-ready="1"]', { timeout: 90000 })
  ok('night: ?time=night overrides', (await page.evaluate(() => document.documentElement.dataset.time)) === 'night')
  await ctx.close()
  const day = await newPage('en')
  await day.goto(BASE + '/')
  ok('day: daytime visitors get the daytime site', (await day.evaluate(() => document.documentElement.dataset.time)) === 'day' && (await day.locator('[data-hero-photo]').getAttribute('src')).includes('pool-sunset') && (await day.locator('[data-map-preview]').getAttribute('src')).endsWith('map-preview.webp'))
  await day.context().close()
}
// ── Map life: the tram never stops and lights up at night; the egrets come home to roost
if (section("Map life: the tram never stops and lights up at night; the egrets come home to roost")) {
  const read = async (page) => {
    const s = await page.evaluate(() => document.documentElement.dataset.mapLife || '')
    const g = (k) => (s.match(new RegExp('(?:^| )' + k + '=([^ ]+)')) || [])[1]
    return { raw: s, s: Number(g('s')), v: Number(g('v')), waiting: g('waiting'), roost: g('roost'), flying: Number(g('flying')), lights: g('lights'), still: g('still') }
  }
  const until = async (page, test, ms = 150000) => { const t0 = Date.now(); for (;;) { const l = await read(page); if (l.raw && test(l)) return l; if (Date.now() - t0 > ms) return l; await page.waitForTimeout(700) } }
  const open = async (page, query) => { await page.goto(BASE + '/facilities/' + query); await page.waitForSelector('html[data-map-ready="1"]', { timeout: 180000 }); return until(page, () => true) }

  const page = await newPage('en')
  const a = await open(page, '?quality=high&life=20')
  const b = await until(page, (l) => Math.abs(l.s - a.s) > 0.12)
  ok('tram: on its round by day, never waiting', a.v > 0 && b.v > 0 && a.waiting === '0' && Math.abs(b.s - a.s) > 0.12, `${a.raw} -> s=${b.s}`)
  ok('tram: no lights by day', a.lights === '0', a.raw)
  ok('birds: by day none of the roost is on the trees', /^0\/\d+$/.test(a.roost) && a.flying === 0, a.raw)
  await page.getByRole('button', { name: 'Night' }).first().click()
  const c = await until(page, (l) => l.flying > 0)
  ok('birds: when night mode starts the egrets set out for the roost', c.flying > 0, c.raw)
  ok('tram: headlights on at night, still moving', c.lights === '1' && c.v > 0 && c.waiting === '0', c.raw)
  await page.getByRole('button', { name: 'Day' }).first().click()
  const d = await until(page, (l) => l.lights === '0')
  ok('tram: lights go out again by day', d.lights === '0', d.raw)
  await page.context().close()

  // a visitor who arrives after dark, a little later: every egret is on its tree
  const night = await newPage('en')
  const n = await open(night, '?quality=high&time=night&life=75')
  ok('night: the whole roost has settled on the trees', n.roost === '30/30' && n.flying === 0, n.raw)
  ok('night: the tram is lit and on its round', n.lights === '1' && n.v > 0 && n.waiting === '0', n.raw)
  await night.context().close()
  const phone = await newPage('en')
  const p = await open(phone, '?quality=low&time=night&life=75')
  ok('night/low tier: a smaller roost settles too', p.roost === '14/14' && p.flying === 0 && p.lights === '1', p.raw)
  await phone.context().close()

  // reduced motion: a still picture
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  await ctx.addInitScript(() => { localStorage.setItem('gya.lang', 'en'); localStorage.setItem('gya.season', 'summer') })
  const calm = await ctx.newPage()
  calm.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  const r = await open(calm, '?quality=high&time=night')
  ok('reduced motion: tram parked at its stop, egrets already on the trees', r.still === '1' && r.waiting === '1' && r.v === 0 && r.roost === '30/30' && r.flying === 0, r.raw)
  await ctx.close()
}
// ── Photos: every image loads, and each place shows a photo of that place
// ── Tabs: every tab in the header opens the section it names, from either page; forms & documents
if (section("Tabs: every tab in the header lands on its section; forms and documents")) {
  const TABS = [['seasons', 'Activities'], ['stay', 'Vans & Meals'], ['safety', 'Safety'], ['pricing', 'Dates & Fees'], ['documents', 'Forms'], ['faq', 'FAQ']]
  const rest = async (page) => { let last = -1, same = 0; for (let i = 0; i < 60 && same < 3; i++) { const y = await page.evaluate(() => Math.round(scrollY)); same = y === last ? same + 1 : 0; last = y; await page.waitForTimeout(200) } }
  // how far the section's top is from the bottom of the sticky header, and whether its heading is in view
  const landed = (page, id) => page.evaluate((id) => { const hb = document.querySelector('header').getBoundingClientRect().bottom; const el = document.getElementById(id); const h = el?.querySelector('h2'); return el && h ? { top: Math.round(el.getBoundingClientRect().top - hb), heading: Math.round(h.getBoundingClientRect().top - hb), vh: innerHeight } : null }, id)
  const good = (w) => !!w && Math.abs(w.top) <= 6 && w.heading >= 0 && w.heading < w.vh * 0.6
  for (const vp of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'phone', width: 390, height: 844 }]) {
    const ctx = await browser.newContext({ viewport: vp })
    await ctx.addInitScript(() => { localStorage.setItem('gya.lang', 'en'); localStorage.setItem('gya.season', 'winter') })
    const page = await ctx.newPage()
    page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
    const tab = async (id) => { if (vp.name === 'phone') await page.locator('header button[aria-expanded]').click(); return page.locator(`header nav [data-nav=${id}]`).locator('visible=true').first() }
    await page.goto(BASE + '/'); await page.waitForTimeout(600)
    if (vp.name === 'desktop') ok('tabs: no label in the bar wraps onto a second line', await page.evaluate(() => [...document.querySelectorAll('header nav[aria-label=Primary] a, header button, header a.rounded-full')].filter((e) => e.offsetParent).every((e) => e.getBoundingClientRect().height < 48)))
    if (vp.name === 'desktop') ok('tabs: the header shows each tab once, in page order, named as its section', JSON.stringify(await page.locator('header nav[aria-label=Primary] [data-nav]:not([data-nav=facilities])').allTextContents()) === JSON.stringify(TABS.map((x) => x[1])) && (await page.locator('header nav[aria-label=Primary] [data-nav=facilities]').innerText()).trim() === 'Facilities' && JSON.stringify(await page.evaluate((ids) => ids.map((id) => document.getElementById(id)).sort((a, b) => a.offsetTop - b.offsetTop).map((e) => e.id), TABS.map((x) => x[0]))) === JSON.stringify(TABS.map((x) => x[0])))
    for (const [id, label] of TABS) {
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
      const link = await tab(id)
      const text = (await link.textContent()).trim()
      await link.click(); await page.waitForTimeout(500); await rest(page)
      const w = await landed(page, id)
      ok(`tabs/${vp.name}: "${label}" lands on its section`, text === label && good(w), JSON.stringify(w))
      // the keyboard and screen-reader position goes with it, without a ring around the whole section
      const at = await page.evaluate(() => ({ id: document.activeElement?.id, outline: getComputedStyle(document.activeElement).outlineStyle }))
      ok(`tabs/${vp.name}: "${label}" moves the keyboard position to its section`, at.id === id && at.outline === 'none', JSON.stringify(at))
    }
    if (vp.name === 'desktop') {
      ok('tabs: "Activities" lands under a heading that says so', (await page.locator('#seasons').innerText()).slice(0, 200).toLowerCase().includes('activities'))
      // keyboard: Enter on a tab, then Tab goes into that section, not on along the header
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
      await page.locator('header nav[aria-label=Primary] [data-nav=documents]').focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(500); await rest(page)
      await page.keyboard.press('Tab'); await page.waitForTimeout(200)
      ok('tabs: after Enter on "Forms", the next Tab key is inside that section', await page.evaluate(() => !!document.activeElement?.closest('#documents') && document.activeElement.id !== 'documents'), await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 80)))
      // Back returns to the section read before, and does not leave the site
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
      await page.locator('header nav[aria-label=Primary] [data-nav=pricing]').click(); await page.waitForTimeout(500); await rest(page)
      await page.locator('header nav[aria-label=Primary] [data-nav=documents]').click(); await page.waitForTimeout(500); await rest(page)
      await page.goBack(); await page.waitForTimeout(800); await rest(page)
      const back = { hash: await page.evaluate(() => location.hash), w: await landed(page, 'pricing') }
      ok('tabs: Back after "Dates & Fees" then "Forms" returns to Dates & Fees', back.hash === '#pricing' && !!back.w && Math.abs(back.w.top) <= 40, JSON.stringify(back))
      // the camp's name in the bar is never cut off, whatever the width and language
      const cut = []
      for (const lang of ['en', 'zh-TW']) for (const width of [1280, 1366, 1440, 1536, 1920]) {
        const c2 = await browser.newContext({ viewport: { width, height: 800 } })
        await c2.addInitScript((l) => localStorage.setItem('gya.lang', l), lang)
        const p2 = await c2.newPage()
        for (const url of ['/', '/facilities/?quality=low']) {
          await p2.goto(BASE + url); await p2.waitForTimeout(500); await p2.evaluate(() => document.fonts.ready)
          const b = await p2.evaluate(() => { const e = document.querySelector('header a .font-display'); return { need: e.scrollWidth, has: e.clientWidth, wraps: [...document.querySelectorAll('header nav[aria-label=Primary] a')].some((a) => a.getBoundingClientRect().height >= 48) } })
          if (b.need > b.has || b.wraps) cut.push(`${lang} ${width} ${url} ${b.has}/${b.need}${b.wraps ? ' wraps' : ''}`)
        }
        await c2.close()
      }
      ok('tabs: the camp name in the bar is whole and no tab wraps, 1280 to 1920 wide, both languages, both pages', cut.length === 0, cut.join(' | '))
    }
    // from the Facilities page the same tabs open the landing page at that section
    for (const [id, label] of vp.name === 'desktop' ? TABS : [TABS[3], TABS[4]]) {
      await page.goto(BASE + '/facilities/?quality=low'); await page.waitForTimeout(500)
      const link = await tab(id)
      await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), link.click()])
      await page.waitForTimeout(3000); await rest(page)
      const w = await landed(page, id)
      ok(`tabs/${vp.name}: from the Facilities page, "${label}" lands on its section`, good(w), JSON.stringify(w))
    }
    if (vp.name === 'desktop') {
      // "open in a new tab" on the Facilities page must not steer the next visit to the landing page
      await page.goto(BASE + '/facilities/?quality=low'); await page.waitForTimeout(500)
      const [popup] = await Promise.all([page.context().waitForEvent('page'), page.locator('header nav[aria-label=Primary] [data-nav=documents]').click({ modifiers: ['Control'] })])
      await popup.close()
      await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.locator('header a:has(.font-display)').first().click()])
      await page.waitForTimeout(3000)
      ok('tabs: after Ctrl+click on a tab, the logo still opens the landing page at the top', (await page.evaluate(() => Math.round(scrollY))) === 0 && (await page.locator('[data-register-modal]').count()) === 0, String(await page.evaluate(() => Math.round(scrollY))))
      await page.goto(BASE + '/facilities/?quality=low'); await page.waitForTimeout(500)
      await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.locator('header').getByRole('link', { name: 'Register' }).first().click()])
      await page.waitForSelector('[data-register-modal]', { timeout: 10000 }).catch(() => {})
      ok('tabs: Register on the Facilities page opens the registration form', (await page.locator('[data-register-modal]').count()) === 1)
      await page.waitForTimeout(400); await page.keyboard.press('Escape'); await page.waitForTimeout(300)
      ok('tabs: Escape closes the form again', (await page.locator('[data-register-modal]').count()) === 0)
      await page.locator('header nav[aria-label=Primary] [data-nav=facilities]').click(); await page.waitForURL(/facilities/)
      ok('tabs: "Facilities" opens the Explore the Facilities page', page.url().includes('/facilities/') && (await page.locator('[data-nav=facilities]').first().getAttribute('aria-current')) === 'page')
      await page.goto(BASE + '/#documents'); await page.waitForTimeout(3000); await rest(page)
      ok('tabs: a link straight to #documents lands on the section', good(await landed(page, 'documents')), JSON.stringify(await landed(page, 'documents')))
      // forms and documents
      const docs = await page.textContent('#documents')
      ok('documents: the five papers, in the order they are needed', JSON.stringify(await page.locator('#documents [data-doc]').evaluateAll((els) => els.map((e) => e.dataset.doc))) === JSON.stringify(['register', 'contract', 'notice', 'health', 'checkin']) && ['Online registration', 'Service contract', 'Camp Notice and Agreement', 'Camper Health Form', 'Check-in Day Form'].every((x) => docs.includes(x)))
      // the three forms are listed, and posted only once they are final
      const final = (await page.locator('[data-docs-pending]').count()) === 0
      if (final) {
        ok('documents: final forms each open as a PDF, named for the screen reader', (await page.locator('#documents [data-doc-link]').count()) >= 3 && (await page.locator('#documents [data-doc-link]').evaluateAll((els) => els.map((a) => a.getAttribute('aria-label')))).filter((x) => /Camp Notice|Health Form|Check-in Day/.test(x || '')).length === 3)
        for (const href of await page.locator('#documents [data-doc]:not([data-doc=contract]) [data-doc-link]').evaluateAll((els) => els.map((a) => a.href))) {
          const r = await page.request.get(href)
          ok(`documents: ${href.split('/').pop()} opens as a PDF`, r.status() === 200 && (r.headers()['content-type'] || '').includes('pdf') && (await r.body()).subarray(0, 5).toString() === '%PDF-', `${r.status()} ${r.headers()['content-type']}`)
        }
      } else {
        ok('documents: while the forms are not final, the section says so and offers no draft', docs.includes('are still being finalized and are not posted yet') && (await page.locator('#documents [data-doc-link]').count()) === 0 && (await page.locator('#documents [data-doc-pending]').count()) === 3 && !/ready to print|sign them|draft/i.test(docs), docs.slice(0, 300))
        for (const f of ['camp-notice-and-agreement', 'camper-health-form', 'check-in-day-form']) {
          const r = await page.request.get(`${BASE}/documents/${f}.pdf`)
          ok(`documents: no draft of ${f} is served`, !(r.headers()['content-type'] || '').includes('pdf') && (await r.body()).subarray(0, 5).toString() !== '%PDF-', `${r.status()} ${r.headers()['content-type']}`)
        }
      }
      ok('documents: the service contract has no link until it is ready', (await page.locator('#documents [data-doc=contract] a').count()) === 0 && docs.includes('given to you for review before any payment'))
      // registration is not open: the first card and the form say so before anything is typed
      const card1 = await page.locator('#documents [data-doc=register]').innerText()
      ok('documents: card 1 says online registration is not open yet', /not open yet/i.test(card1) && card1.includes('nothing is sent') && (await page.locator('[data-doc-register]').innerText()).trim() === 'Preview the form', card1.replace(/\n/g, ' | '))
      await page.click('[data-doc-register]')
      ok('documents: "Preview the form" opens the form, which says at the top that nothing is sent', (await page.locator('[data-register-modal]').count()) === 1 && (await page.locator('[data-register-modal] [data-register-preview]').innerText()).includes('nothing you enter is sent'))
      await page.waitForTimeout(400); await page.keyboard.press('Escape'); await page.waitForTimeout(300)
      for (const [href, id] of [['#refund', 'refund'], ['#packing', 'packing'], ['#legal', 'legal']]) {
        await page.locator(`[data-docs-also] a[href="${href}"]`).click(); await page.waitForTimeout(500); await rest(page)
        const top = await page.evaluate((id) => Math.round(document.getElementById(id).getBoundingClientRect().top - document.querySelector('header').getBoundingClientRect().bottom), id)
        // (the legal disclosures are at the foot of the page, which cannot scroll any further up)
        ok(`documents: "Also on this page" ${href} scrolls to it`, id === 'legal' ? top >= -6 && top < 700 : top >= -6 && top <= 30, String(top))
        await page.evaluate(() => document.getElementById('documents').scrollIntoView({ behavior: 'instant' })); await page.waitForTimeout(300)
      }
      await page.getByRole('button', { name: '繁中' }).first().click()
      const zhDocs = await page.textContent('#documents')
      ok('documents: 繁體中文', ['表單與文件', '營隊須知與同意書', '營員健康調查表', '報到日確認單', '暫未提供下載', '定稿後於此提供', '尚未開放', '預覽報名表'].every((x) => zhDocs.includes(x)) && (await page.locator('header nav[aria-label=Primary] [data-nav=documents]').textContent()).trim() === '表單文件')
    }
    await ctx.close()
  }
}

if (section("Photos: every image loads, and each place shows a photo of that place")) {
  const page = await newPage('en')
  const bad = []
  page.on('response', (r) => { if (r.status() >= 400 && /\.(webp|jpg|png)/.test(r.url())) bad.push(r.status() + ' ' + r.url().split('/').pop()) })
  await page.goto(BASE + '/')
  for (let y = 0; y < 12000; y += 600) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(80) }
  await page.waitForTimeout(800)
  const broken = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src.split('/').pop()))
  ok('photos: every landing-page image loads', broken.length === 0 && bad.length === 0, JSON.stringify([...broken, ...bad]))
  const cardImg = (title) => page.evaluate((t) => { const li = [...document.querySelectorAll('#seasons li')].find((l) => l.textContent.includes(t)); const im = li && li.querySelector('img'); return im ? im.src.split('/').pop() : null }, title)
  ok('photos: tram card shows the tram', (await cardImg('Waterbird Eco-Safari Tram')) === 'tram-on-route.webp', String(await cardImg('Waterbird Eco-Safari Tram')))
  ok('photos: cinema card shows a screening', (await cardImg('Star Cinema Night')) === 'cinema-night.webp')
  const seasonsText = await page.textContent('#seasons')
  ok('photos: cards with no exact photo stay photo-free', ['Night Ecology Walk', 'Digital Camp Album'].every((x) => seasonsText.includes(x)) && (await cardImg('Night Ecology Walk')) === null && (await cardImg('Digital Camp Album')) === null)
  ok('photos: dining grid shows the breakfast eggs', (await page.evaluate(() => [...document.querySelectorAll('#stay img')].map((i) => i.src.split('/').pop()))).includes('buffet-eggs.webp'))

  await page.goto(BASE + '/facilities/'); await page.waitForSelector('html[data-map-ready="1"]', { timeout: 90000 })
  const open = async (id) => { await page.evaluate((i) => document.querySelector(`[data-hotspot="${i}"]`).click(), id); await page.waitForSelector(`[data-panel="${id}"]`) }
  const lead = (id) => page.evaluate((i) => { const im = document.querySelector(`[data-panel="${i}"] figure img`); return im ? im.src.split('/').pop() : null }, id)
  const tabs = (id) => page.evaluate((i) => [...document.querySelectorAll(`[data-panel="${i}"] [role=tab]`)].map((t) => t.textContent), id)
  await open('tram'); ok('photos: tram panel leads with the tram photo', (await lead('tram')) === 'tram-on-route.webp', String(await lead('tram')))
  await open('birds'); ok('photos: waterbird lake leads with the egret roost', (await lead('birds')) === 'birds-roost-lake.webp')
  await open('restroom'); ok('photos: restrooms have no photo, so no Photos tab', (await lead('restroom')) === null && !(await tabs('restroom')).includes('Photos & Video'), JSON.stringify(await tabs('restroom')))
  await open('dining')
  const food = await page.evaluate(() => [...document.querySelectorAll('[data-panel="dining"] ul img')].map((i) => i.src.split('/').pop()))
  ok('photos: dining hall highlights the food on the menu', food.includes('buffet-eggs.webp') && food.includes('pizza-hands.webp') && food.includes('wagyu-platter.webp') && food.length >= 6 && !food.some((x) => /fruit|closeup|breakfast-plate/.test(x)), JSON.stringify(food))
  await page.getByRole('tab', { name: 'Menu' }).click()
  ok('photos: dining menu opens with food photos', (await lead('dining')) === 'buffet-eggs.webp')
  const menu = await page.textContent('[data-panel="dining"]')
  ok('menu: three meals and the final-evening signature dinner, no afternoon tea', ['Breakfast', 'DIY lunch with the chef', 'Dinner', 'Signature family dinner', 'Final evening', 'Wagyu beef', 'Eggs', 'Bacon', 'Bread and sandwiches', 'Milk and soy milk', 'Curry', 'Handmade pizza', 'Rice balls', 'Donburi rice box', 'Meatball pasta, corn soup and bread', 'Fried chicken and braised pork, with vegetables and rice'].every((x) => menu.includes(x)) && !/afternoon tea|campfire snacks|\d\d:\d\d/i.test(menu))
  const hl = page.locator('[data-panel="dining"] [data-menu-section="highlight"]')
  ok('menu: the signature dinner is the highlighted section, with its photo among the highlights', (await hl.count()) === 1 && (await hl.textContent()).includes('Signature family dinner') && (await hl.textContent()).includes('Final evening') && food.includes('wagyu-platter.webp'), JSON.stringify(food))
  await open('snack')
  await page.getByRole('tab', { name: 'Highlights' }).click()
  ok('photos: snack shop leads with the Airstream', (await lead('snack')) === 'pool-airstream.webp', String(await lead('snack')))
  await open('zone-E'); await page.getByRole('tab', { name: 'Photos & Video' }).click()
  const zoneE = await page.evaluate(() => [...document.querySelectorAll('[data-panel="zone-E"] button img')].map((i) => i.src.split('/').pop()))
  ok('photos: Zone E gallery starts with Zone E photos only', zoneE.slice(0, 3).join() === 'zone-e-1.webp,zone-e-2.webp,zone-e-3.webp', zoneE.slice(0, 4).join())
  ok('photos: no image request failed on the map page', bad.length === 0, bad.join(' '))
  await page.context().close()
}
ok('no console or page errors', errs.length === 0, [...new Set(errs)].slice(0, 3).join(' | '))
console.log(results.join('\n'))
await browser.close()
