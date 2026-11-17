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
  await fill('Camper full name', 'Test Camper'); await fill('Date of birth', '2014-05-01')
  await m.getByLabel('Gender').selectOption({ index: 1 })
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
  await page.goto(BASE + '/#register'); await page.waitForTimeout(400)
  ok('home: #register deep link opens the modal', await page.locator('[data-register-modal]').isVisible())
  await page.context().close()
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
  await page.waitForSelector('[data-panel="pool"]'); await page.waitForTimeout(4500)
  const names = await shownNames()
  ok(T + 'chosen marker shows its name, and only that one', names.length === 1 && names[0].includes('Aurora Pool'), JSON.stringify(names))
  ok(T + 'camera moved in to the place', (await zoom()) < 0.6, String(await zoom()))
  ok(T + 'Full map button appears', await page.locator('[data-full-map]').isVisible())

  // Full map pressed while the panel is still open must land exactly on the full map
  await page.click('[data-full-map]'); await page.waitForTimeout(4500)
  ok(T + 'Full map with the panel open lands on the full map', Math.abs((await zoom()) - 1) <= 0.01 && (await page.locator('[data-panel]').count()) === 0, `zoom ${await zoom()}`)
  await page.evaluate(() => document.querySelector('[data-hotspot="pool"]').click())
  await page.waitForSelector('[data-panel="pool"]'); await page.waitForTimeout(4500)

  // closing the panel keeps the view; Full map goes back out
  await page.keyboard.press('Escape'); await page.waitForTimeout(800)
  ok(T + 'closing the panel keeps the view at the place', (await zoom()) < 0.6 && (await page.locator('[data-full-map]').isVisible()))
  await page.click('[data-full-map]'); await page.waitForTimeout(4500)
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
  await page.click('[data-full-map]'); await page.waitForTimeout(4500)
  const overlaps = await page.evaluate(() => {
    const els = [...document.querySelectorAll('[data-hotspot]:not([data-hidden])')].map((e) => e.getBoundingClientRect())
    let n = 0
    for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) { const a = els[i], b = els[j]; if (Math.hypot(a.left + a.width / 2 - (b.left + b.width / 2), a.bottom - b.bottom) < 20) n++ }
    return { visible: els.length, stacked: n }
  })
  ok(T + 'no markers stacked on each other on the full map', overlaps.stacked === 0 && overlaps.visible >= 8, JSON.stringify(overlaps))
  await ctx.close()
}
ok('no console or page errors', errs.length === 0, [...new Set(errs)].slice(0, 3).join(' | '))
console.log(results.join('\n'))
await browser.close()
