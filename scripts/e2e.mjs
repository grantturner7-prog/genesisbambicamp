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
ok('no console or page errors', errs.length === 0, [...new Set(errs)].slice(0, 3).join(' | '))
console.log(results.join('\n'))
await browser.close()
