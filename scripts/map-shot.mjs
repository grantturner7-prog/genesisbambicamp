// Captures the 3D camp map for the adverts: one clean winter picture (no header, panels or markers)
// and where each area's marker sits on it. scripts/promo.mjs draws the labelled map from these.
//   node scripts/map-shot.mjs <baseUrl>       e.g. after `vite preview`, http://127.0.0.1:4173
// Run it again whenever the map or its camera changes; the results are kept in scripts/promo-assets/.
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const { chromium } = createRequire(import.meta.url)('playwright')
const [base = 'http://127.0.0.1:4173'] = process.argv.slice(2)
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), 'promo-assets')
mkdirSync(out, { recursive: true })
const W = 1800, H = 1200

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
await ctx.addInitScript(() => { localStorage.setItem('gya.lang', 'en'); localStorage.setItem('gya.season', 'winter') })
const page = await ctx.newPage()
await page.goto(`${base}/facilities/?quality=high&time=day`)
await page.waitForSelector('html[data-map-ready="1"]', { timeout: 420000 })
// the map alone, filling the window, so the picture has no header or side panel in it
await page.addStyleTag({ content: 'main > div > *:not(:first-child), main > aside { display: none !important }' })
let last = '', frame = -1, same = 0
for (let i = 0; i < 240 && same < 5; i++) { await page.waitForTimeout(500); const [z, f] = await page.evaluate(() => [document.documentElement.dataset.mapZoom, window.__mapFrame || 0]); if (f === frame) continue; frame = f; same = z === last ? same + 1 : 0; last = z }
await page.waitForTimeout(1500)
const spots = await page.evaluate(() => {
  const c = document.querySelector('main canvas').getBoundingClientRect()
  return { width: Math.round(c.width), height: Math.round(c.height), spots: [...document.querySelectorAll('[data-hotspot]')].map((el) => {
    const r = el.getBoundingClientRect()
    return { id: el.dataset.hotspot, name: el.getAttribute('title'), x: +(((r.left + r.right) / 2 - c.left) / c.width).toFixed(4), y: +((r.bottom - c.top) / c.height).toFixed(4), shown: getComputedStyle(el).opacity !== '0' }
  }) }
})
await page.addStyleTag({ content: '[data-hotspot] { display: none !important }' })
await page.waitForTimeout(800)
await page.locator('main canvas').screenshot({ path: path.join(out, 'map-winter.jpg'), type: 'jpeg', quality: 90, timeout: 180000 })
writeFileSync(path.join(out, 'map-winter.json'), JSON.stringify(spots, null, 1) + '\n')
console.log('wrote map-winter.jpg', spots.width + 'x' + spots.height, spots.spots.map((s) => `${s.id}@${s.x},${s.y}${s.shown ? '' : ' (hidden)'}`).join('  '))
await browser.close()
