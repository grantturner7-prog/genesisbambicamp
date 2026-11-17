// Renders the design mockups to PNG with Playwright (headless Chromium).
import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')

const PORT = 8099
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 900))

const shots = [
  { f: '01-desktop-hero-summer-en', q: 'scene=hero&season=summer&lang=en' },
  { f: '02-desktop-pool-menu-en', q: 'scene=area&area=pool&hs=snack&tab=menu&season=summer&lang=en' },
  { f: '03-desktop-pool-safety-en', q: 'scene=area&area=pool&tab=safety&season=summer&lang=en' },
  { f: '04-desktop-vans-en', q: 'scene=area&area=vans&tab=highlights&season=summer&lang=en' },
  { f: '05-desktop-winter-dusk-hero-zh', q: 'scene=hero&season=winter&time=dusk&lang=zh' },
  { f: '06-desktop-winter-kayak-zh', q: 'scene=area&area=kayak&tab=highlights&season=winter&time=dusk&lang=zh' },
  { f: '07-mobile-hero-zh', q: 'scene=hero&season=winter&lang=zh&mobile=1', mobile: true },
  { f: '08-mobile-pool-menu-en', q: 'scene=area&area=pool&hs=snack&tab=menu&season=summer&lang=en&mobile=1', mobile: true },
]
const only = process.argv[2]
const browser = await chromium.launch()
for (const s of shots) {
  if (only && !s.f.startsWith(only)) continue
  const vp = s.mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.error('PAGEERROR', s.f, e.message))
  page.on('console', (m) => { if (m.type() === 'error') console.error('CONSOLE', s.f, m.text()) })
  await page.goto(`http://127.0.0.1:${PORT}/docs/mockups/mockup.html?${s.q}`)
  await page.waitForSelector('body[data-ready="1"]', { timeout: 20000 })
  await page.waitForTimeout(400)
  await page.screenshot({ path: `docs/mockups/${s.f}.png` })
  console.log('rendered', s.f)
  await ctx.close()
}
await browser.close()
server.kill()
