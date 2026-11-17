// Screenshot helper: node scripts/shot.mjs <path+query> <out.png> [width] [height] [click-selector] [lang]
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
const [url = '/', out = '/tmp/shot.png', w = '1440', h = '900', click = '', lang = 'en', full = ''] = process.argv.slice(2)
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, hasTouch: +w < 600, isMobile: +w < 600 })
await ctx.addInitScript(([l, season]) => { try { localStorage.setItem('gya.lang', l); if (season) localStorage.setItem('gya.season', season) } catch {} }, [lang, process.env.SEASON || 'summer'])
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 240)) })
await page.goto(`http://127.0.0.1:${process.env.PORT || 5199}${url}`)
if (url.includes('facilities')) { await page.waitForSelector('html[data-map-ready="1"]', { timeout: 60000 }); await page.waitForTimeout(2500) } else await page.waitForTimeout(1200)
for (const sel of click.split('|').filter(Boolean)) { await page.click(sel, { timeout: 8000 }); await page.waitForTimeout(url.includes('facilities') ? 3500 : 500) }
await page.screenshot({ path: out, fullPage: !!full })
console.log('saved', out, errs.length ? '\n' + [...new Set(errs)].slice(0, 6).join('\n') : '(no console errors)')
await browser.close()
