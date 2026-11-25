// A sharper capture of the 3D camp map for the counselor pack maps (same camera as scripts/map-shot.mjs).
//   node scripts/counselor-pack/map-shot-hi.mjs <baseUrl of a vite preview> <output folder> 3
// writes map-hi.png and map-hi.json. Save the picture as docs/planning/camp-wow-map.jpg and copy the JSON here.
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
const { chromium } = createRequire(import.meta.url)('playwright')
const [base, out, dsf = '2'] = process.argv.slice(2)
const W = 1800, H = 1200
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: +dsf })
await ctx.addInitScript(() => { localStorage.setItem('gya.lang', 'en'); localStorage.setItem('gya.season', 'winter') })
const page = await ctx.newPage()
await page.goto(`${base}/facilities/?quality=high&time=day`)
await page.waitForSelector('html[data-map-ready="1"]', { timeout: 900000 })
await page.addStyleTag({ content: 'main > div > *:not(:first-child), main > aside { display: none !important }' })
let last = '', frame = -1, same = 0
for (let i = 0; i < 400 && same < 5; i++) { await page.waitForTimeout(500); const [z, f] = await page.evaluate(() => [document.documentElement.dataset.mapZoom, window.__mapFrame || 0]); if (f === frame) continue; frame = f; same = z === last ? same + 1 : 0; last = z }
await page.waitForTimeout(2500)
const spots = await page.evaluate(() => {
  const c = document.querySelector('main canvas').getBoundingClientRect()
  return { width: Math.round(c.width), height: Math.round(c.height), spots: [...document.querySelectorAll('[data-hotspot]')].map((el) => {
    const r = el.getBoundingClientRect()
    return { id: el.dataset.hotspot, name: el.getAttribute('title'), x: +(((r.left + r.right) / 2 - c.left) / c.width).toFixed(4), y: +((r.bottom - c.top) / c.height).toFixed(4) }
  }) }
})
await page.addStyleTag({ content: '[data-hotspot] { display: none !important }' })
await page.waitForTimeout(1500)
await page.locator('main canvas').screenshot({ path: path.join(out, 'map-hi.png'), timeout: 600000 })
writeFileSync(path.join(out, 'map-hi.json'), JSON.stringify(spots, null, 1) + '\n')
console.log('done', spots.width, spots.height, spots.spots.length)
await browser.close()
