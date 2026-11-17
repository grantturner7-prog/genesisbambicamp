// Renders clean pictures of the 3D map (no header, panels or markers) for before/after
// comparison and visual review.
//   node scripts/scene-shots.mjs <baseUrl> <outDir> [view,view,...] [quality] [extraQuery]
// extraQuery is added to the page address, e.g. life=20 to picture the scene 20 s into its motion.
// Views: overview-day, overview-dusk, overview-winter, pool, snack, vans-b, vans-f, dining,
//        kayak, cinema-dusk, campfire-dusk, tram, birds, entrance, phone-overview, phone-pool,
//        birds-dusk, tram-dusk, kayak-dusk, phone-overview-dusk
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
const { chromium } = createRequire(import.meta.url)('playwright')
const [base = 'http://127.0.0.1:5199', out = '/tmp/scene-shots', only = '', quality = '', extra = ''] = process.argv.slice(2)
mkdirSync(out, { recursive: true })

const VIEWS = {
  'overview-day': {},
  'overview-dusk': { dusk: true },
  'overview-winter': { season: 'winter' },
  pool: { spot: 'pool' },
  snack: { spot: 'snack' },
  'vans-b': { spot: 'zone-B' },
  'vans-f': { spot: 'zone-F' },
  dining: { spot: 'dining' },
  kayak: { spot: 'kayak' },
  'cinema-dusk': { spot: 'cinema', dusk: true },
  'campfire-dusk': { spot: 'campfire', dusk: true },
  tram: { spot: 'tram' },
  birds: { spot: 'birds' },
  'birds-dusk': { spot: 'birds', dusk: true },
  'tram-dusk': { spot: 'tram', dusk: true },
  'kayak-dusk': { spot: 'kayak', dusk: true },
  entrance: { spot: 'entrance' },
  'phone-overview': { phone: true },
  'phone-overview-dusk': { phone: true, dusk: true },
  'phone-pool': { phone: true, spot: 'pool' },
}
const names = only ? only.split(',') : Object.keys(VIEWS)
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
for (const name of names) {
  const v = VIEWS[name]
  if (!v) { console.error('unknown view', name); continue }
  const ctx = await browser.newContext({ viewport: v.phone ? { width: 390, height: 844 } : { width: 1440, height: 900 }, deviceScaleFactor: 1, hasTouch: !!v.phone })
  await ctx.addInitScript((season) => { localStorage.setItem('gya.lang', 'en'); localStorage.setItem('gya.season', season) }, v.season || 'summer')
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)) })
  const q = `?quality=${quality || (v.phone ? 'low' : 'high')}&time=${v.dusk ? 'night' : 'day'}${extra ? '&' + extra : ''}`
  await page.goto(`${base}/facilities/${q}${v.spot ? '#' + v.spot : ''}`)
  await page.waitForSelector('html[data-map-ready="1"]', { timeout: 420000 })
  // hide everything except the canvas; the camera keeps its pose
  await page.addStyleTag({ content: 'main > div > *:not(:first-child), main > aside, [data-hotspot] { display: none !important }' })
  // wait for the camera (and any resize) to come to rest
  let last = '', same = 0
  for (let i = 0; i < 90 && same < 5; i++) { await page.waitForTimeout(500); const z = await page.evaluate(() => document.documentElement.dataset.mapZoom + '|' + (document.documentElement.dataset.mapFrame || '')); same = z.split('|')[0] === last ? same + 1 : 0; last = z.split('|')[0] }
  await page.waitForTimeout(1500)
  await page.locator('main canvas').screenshot({ path: `${out}/${name}.png`, timeout: 180000 }) // software rendering can take a while per frame
  const info = await page.evaluate(() => document.documentElement.dataset.mapInfo || '')
  console.log('shot', name, info, errs.length ? 'ERRORS: ' + [...new Set(errs)].slice(0, 3).join(' | ') : '')
  await ctx.close()
}
await browser.close()
