// End-to-end checks against a running server: node scripts/e2e.mjs [baseUrl]
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:5199'
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
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
{
  const page = await newPage('en')
  const posts = []
  page.on('request', (r) => { if (r.method() === 'POST') posts.push(r.url()) })
  await page.goto(BASE + '/')
  ok('home: English headline', (await page.textContent('h1')).includes('American-Style Summer Adventure Camp'))
  await page.getByRole('button', { name: '繁中' }).first().click()
  ok('home: switches to 繁體中文', (await page.textContent('h1')).includes('美式夏季戶外探索營') && (await page.evaluate(() => document.documentElement.lang)) === 'zh-TW')
  await page.reload()
  ok('home: language persists after reload', (await page.textContent('h1')).includes('美式夏季戶外探索營'))
  await page.getByRole('button', { name: 'EN' }).first().click()
  await page.getByRole('button', { name: 'Winter' }).first().click()
  ok('home: season switch → winter headline', (await page.textContent('h1')).includes('Winter'))
  ok('home: pool relays hidden in winter', !(await page.textContent('#seasons')).includes('Aurora Pool Relays'))
  await page.getByRole('button', { name: 'Summer' }).first().click()
  ok('home: pool relays shown in summer', (await page.textContent('#seasons')).includes('Aurora Pool Relays'))
  const body = await page.textContent('body')
  ok('home: venue address present', body.includes('No. 27, Xiaobeipu, Beipu Village, Sanwan Township, Miaoli County'))
  ok('home: travel agency badge in pricing', (await page.locator('[data-agency-badge]').count()) === 1)
  ok('home: footer has three legal blocks', ['Activity Co-Organizer', 'Venue Partner', 'Travel & Transport Organizer', '88491889'].every((x) => body.includes(x)))

  // meals, snack coupons, session days, family camp
  ok('home: three meals a day, no fourth meal or afternoon tea', body.includes('Three meals a day') && !/four meals|4 daily|afternoon tea|campfire snacks/i.test(body))
  const meals = await page.textContent('[data-meals]')
  ok('home: buffet breakfast, DIY lunch with the chef, evening buffet', ['Buffet breakfast', 'DIY lunch with the chef', 'Evening buffet'].every((x) => meals.includes(x)))
  ok('home: no clock times on the meals (no schedule published yet)', !/\d\d:\d\d/.test(meals), meals.match(/\d\d:\d\d/)?.[0])
  ok('home: final-evening Wagyu dinner highlighted with its photo', (await page.textContent('[data-signature-dinner]')).includes('Wagyu') && (await page.locator('[data-signature-dinner] img').getAttribute('src')).includes('wagyu-platter'))
  const coupons = await page.textContent('[data-snack-coupons]')
  ok('home: snack coupon packs of NT$1,000, NT$2,000 and NT$3,000 at the Airstream', ['NT$1,000', 'NT$2,000', 'NT$3,000', 'Airstream', 'not part of the camp fee'].every((x) => coupons.includes(x)))
  const pricing = await page.textContent('#pricing')
  ok('home: Option A Tuesday to Saturday, Option B Wednesday to Saturday', pricing.includes('Tuesday to Saturday') && pricing.includes('Wednesday to Saturday') && pricing.includes('Wednesday 14:00–14:30') && pricing.includes('Saturday return') && !/Monday|Friday/.test(body))
  ok('home: snack coupons listed under Not included', /Not included[\s\S]*Snacks and drinks at the Airstream snack shop/.test(pricing))
  const fam = await page.textContent('[data-family-camp]')
  const famNeeds = ['3 Days / 2 Nights', 'Ages 7–9', 'with an accompanying adult', 'sleeps 4', 'one adult with up to three campers', 'two parents with up to two campers', 'responsible for their campers until 09:00', 'from 19:00', 'Dates announced soon', 'Fees announced soon']
  ok('home: family camp card (ages 7–9 with an adult, van sleeps four)', famNeeds.every((x) => fam.includes(x)), famNeeds.filter((x) => !fam.includes(x)).join(' | '))
  ok('home: hero links to the family camp', (await page.locator('[data-family-pill]').getAttribute('href')) === '#family-camp' && (await page.locator('#family-camp').count()) === 1)
  ok('home: no made-up timetable; schedule marked as coming, rain plan kept', (await page.locator('#day').count()) === 0 && (await page.locator('[data-schedule-pending]').count()) === 1 && (await page.textContent('[data-rain-plan]')).includes('Grand Dining Hall'))

  // camp games: the partners' 32 named activities, names kept as given
  const GAME_NAMES = ['Bambi Amazing Race', 'Orienteering Quest', 'Glow Night Quest', 'Shelter Build Challenge', 'Campcraft Survival Circuit', 'Nature Photo Safari', 'Kayak Skills Relay', 'Capture the Flag',
    'Mission Impossible Circuit', 'Tug-of-War Tournament', 'Camp Olympics Relay Medley', 'Giant Rope Jump Challenge', 'Spider Web Challenge', 'Pipeline Challenge', 'Island Hop', 'Blind Maze',
    'Toxic Waste Transfer', 'Giant Ski Race', 'Crate Crossing', 'Indoor Escape Room Race', 'Minute-to-Win-It Mega Tournament', 'Mentos Geyser Challenge', 'Foam Explosion Spectacular', 'Giant Bubble Lab',
    'Balloon Rocket Grand Prix', 'Bridge & Tower Build Challenge', 'Egg Drop Build Challenge', 'Oobleck Olympics', 'Vortex Cannon Target Challenge', 'Campfire Skit & Talent Showdown', 'Team Banner & Mascot Workshop', 'Color War Opening Ceremony']
  const cards = await page.$$eval('[data-games] > li', (els) => els.map((e) => ({ title: e.querySelector('h3').textContent, alt: e.querySelector('h3 + p').textContent, body: e.querySelector('h3 + p + p').textContent })))
  ok('games: all 32 activities listed in order, names as given', cards.length === 32 && GAME_NAMES.every((n, i) => cards[i].title === n), cards.map((c) => c.title).filter((t, i) => t !== GAME_NAMES[i]).join(' | '))
  ok('games: every card also carries its Chinese name and a description', cards.every((c) => /[\u4e00-\u9fff]/.test(c.alt) && c.body.length > 30) && cards[0].alt === '斑比探索大挑戰')
  ok('games: line icons only, no photos or drawings of people', (await page.locator('#games img').count()) === 0 && (await page.locator('[data-games] > li svg').count()) === 32)
  ok('games: introduced as some of the fun activities campers take part in', (await page.textContent('#games h2')) === 'Some of the fun activities campers take part in')
  await page.locator('[data-game-filter="team"]').click()
  ok('games: filter by type (Team Challenges → 7)', (await page.locator('[data-games] > li').count()) === 7 && (await page.textContent('[data-games]')).includes('Spider Web Challenge') && !(await page.textContent('[data-games]')).includes('Tug-of-War'))
  await page.locator('[data-game-filter="all"]').click()
  ok('games: back to all 32', (await page.locator('[data-games] > li').count()) === 32)
  ok('games: the seasonal highlights no longer repeat them', !/Orienteering & Scavenger|Capture the Flag & Lawn|Wilderness Shelter/.test(await page.textContent('#seasons')) && (await page.textContent('#seasons')).includes('Star Cinema Night'))
  ok('games: the schedule note and rain plan close the section', (await page.locator('#games [data-schedule-pending]').count()) === 1 && (await page.locator('#games [data-rain-plan]').count()) === 1)

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
  const opt = m.locator('[data-register-option]')
  ok('register: three options, including the family camp', (await opt.locator('option').count()) === 3 && (await opt.inputValue()) === 'A')
  ok('register: Option A shows no family fields', (await m.locator('[data-register-adults]').count()) === 0)
  await opt.selectOption('C')
  ok('register: family camp note and group fields', (await m.locator('[data-register-note]').textContent()).includes('one camper van per group') && await m.locator('[data-register-adults]').isVisible())
  ok('register: one adult → up to three campers', (await m.locator('[data-register-group]').locator('option').count()) === 3)
  await m.locator('[data-register-group]').selectOption('3')
  await m.locator('[data-register-adults]').selectOption('2')
  ok('register: two parents → at most two campers', (await m.locator('[data-register-group]').locator('option').count()) === 2 && (await m.locator('[data-register-group]').inputValue()) === '2')
  ok('register: coupon packs offered, none by default', (await m.locator('[data-register-coupon] option').count()) === 4 && (await m.locator('[data-register-coupon]').inputValue()) === '')
  await m.locator('[data-register-coupon]').selectOption('2000')
  await fill('Camper full name', 'Test Camper'); await fill('Date of birth', '2014-05-01')
  await m.getByLabel('Gender').first().selectOption({ index: 1 })
  await fill('Legal guardian name', 'Test Parent'); await fill('Relationship to camper', 'Mother'); await fill('Mobile number', '0900000000'); await fill('Residential address', 'Taichung')
  await page.click('[data-register-next]')
  ok('register: a family group of two must give the second camper’s details', await m.locator('[role=alert]').isVisible() && await m.locator('[data-register-others]').isVisible())
  await m.locator('[data-register-others]').fill('Second Camper, 2017-03-02, girl, no allergies')
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
  ok('register: summary records the family camp group and the coupon pack', summary.includes('3 Days / 2 Nights Family Camp') && summary.includes('Accompanying adults: 2') && summary.includes('Campers in your group: 2') && summary.includes('Second Camper, 2017-03-02') && summary.includes('NT$2,000 pack'), summary.slice(0, 300))
  for (const o of ['B', 'C', 'A']) {
    await page.goto(BASE + '/'); await page.reload(); await page.locator(`[data-register-open="${o}"]`).click()
    ok(`register: the Option ${o} card opens the form on Option ${o}`, (await page.locator('[data-register-option]').inputValue()) === o)
  }
  ok('register: the three card buttons have distinct names', (await page.locator('[data-register-open]').evaluateAll((els) => new Set(els.map((e) => e.getAttribute('aria-label'))).size)) === 3)
  await page.context().close()
  const dl = await newPage('en')
  await dl.goto(BASE + '/#register'); await dl.waitForSelector('[data-register-modal]', { timeout: 5000 }).catch(() => {})
  ok('home: #register deep link opens the form, on Option A', (await dl.locator('[data-register-modal]').count()) === 1 && (await dl.locator('[data-register-option]').inputValue()) === 'A')
  await dl.context().close()
}

// ── Facilities: every hotspot opens its panel
{
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
for (const vp of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'phone', width: 390, height: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.width < 600 })
  await ctx.addInitScript(() => { localStorage.setItem('gya.lang', 'en'); localStorage.setItem('gya.season', 'summer') })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  await page.goto(BASE + '/facilities/')
  await page.waitForSelector('html[data-map-ready="1"]', { timeout: 90000 })
  await page.waitForTimeout(1500)
  const zoom = () => page.evaluate(() => Number(document.documentElement.dataset.mapZoom))
  const settle = async () => { let last = -1, same = 0; for (let i = 0; i < 80 && same < 4; i++) { await page.waitForTimeout(400); const z = await zoom(); same = z === last ? same + 1 : 0; last = z } }
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
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript(() => { localStorage.setItem('gya.lang', 'en'); localStorage.setItem('gya.season', 'summer') })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  await page.goto(BASE + '/facilities/'); await page.waitForSelector('html[data-map-ready="1"]', { timeout: 90000 }); await page.waitForTimeout(1500)
  const zoom = () => page.evaluate(() => Number(document.documentElement.dataset.mapZoom))
  const settle = async () => { let last = -1, same = 0; for (let i = 0; i < 80 && same < 4; i++) { await page.waitForTimeout(400); const z = await zoom(); same = z === last ? same + 1 : 0; last = z } }
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
    let last = '', same = 0; for (let i = 0; i < 60 && same < 4; i++) { await pp.waitForTimeout(400); const z = await pp.evaluate(() => document.documentElement.dataset.mapZoom); same = z === last ? same + 1 : 0; last = z }
    clear = clear && await pp.evaluate((i) => { const a = document.querySelector(`[data-hotspot="${i}"] [data-marker-name]`).getBoundingClientRect(); const b = document.querySelector('[data-full-map]').getBoundingClientRect(); return a.top >= b.bottom || a.left >= b.right || a.right <= b.left }, id)
  }
  ok('fix: on a phone the chosen name does not sit on the Full map button', clear)
  await ph.close()
}
// ── Games in 繁體中文 on a phone
{
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
  const first = await page.$eval('[data-game="1"]', (e) => [e.querySelector('h3').textContent, e.querySelector('h3 + p').textContent])
  ok('games/zh: the Chinese name leads with the English name beneath', first[0] === '斑比探索大挑戰' && first[1] === 'Bambi Amazing Race', first.join(' / '))
  ok('games/zh: Color War keeps its English name', (await page.$eval('[data-game="32"] h3', (e) => e.textContent)) === 'Color War 開幕式')
  ok('games/phone: no sideways scrolling', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1))
  await ctx.close()
}
// ── Photos: every image loads, and each place shows a photo of that place
{
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
  ok('photos: cards with no exact photo stay photo-free', (await cardImg('Night Ecology Walk')) === null && (await cardImg('Digital Camp Album')) === null)
  ok('photos: dining grid shows buffet food', (await page.evaluate(() => [...document.querySelectorAll('#stay img')].map((i) => i.src.split('/').pop()))).includes('buffet-eggs.webp'))

  await page.goto(BASE + '/facilities/'); await page.waitForSelector('html[data-map-ready="1"]', { timeout: 90000 })
  const open = async (id) => { await page.evaluate((i) => document.querySelector(`[data-hotspot="${i}"]`).click(), id); await page.waitForSelector(`[data-panel="${id}"]`) }
  const lead = (id) => page.evaluate((i) => { const im = document.querySelector(`[data-panel="${i}"] figure img`); return im ? im.src.split('/').pop() : null }, id)
  const tabs = (id) => page.evaluate((i) => [...document.querySelectorAll(`[data-panel="${i}"] [role=tab]`)].map((t) => t.textContent), id)
  await open('tram'); ok('photos: tram panel leads with the tram photo', (await lead('tram')) === 'tram-on-route.webp', String(await lead('tram')))
  await open('birds'); ok('photos: waterbird lake leads with the egret roost', (await lead('birds')) === 'birds-roost-lake.webp')
  await open('restroom'); ok('photos: restrooms have no photo, so no Photos tab', (await lead('restroom')) === null && !(await tabs('restroom')).includes('Photos & Video'), JSON.stringify(await tabs('restroom')))
  await open('dining')
  const food = await page.evaluate(() => [...document.querySelectorAll('[data-panel="dining"] ul img')].map((i) => i.src.split('/').pop()))
  ok('photos: dining hall highlights the buffet food', food.includes('buffet-eggs.webp') && food.includes('breakfast-plate.webp') && food.length >= 6, JSON.stringify(food))
  await page.getByRole('tab', { name: 'Menu' }).click()
  ok('photos: dining menu opens with food photos', (await lead('dining')) === 'buffet-eggs.webp')
  const menu = await page.textContent('[data-panel="dining"]')
  ok('menu: three meals and the final-evening signature dinner, no afternoon tea', ['Buffet breakfast', 'DIY lunch with the chef', 'Evening buffet', 'Signature family dinner', 'Final evening', 'Wagyu beef'].every((x) => menu.includes(x)) && !/afternoon tea|campfire snacks|\d\d:\d\d/i.test(menu))
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
