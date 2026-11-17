// Screenshot helper: node scripts/shot.mjs <view> [out.png] [width] [height]
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
const [view = 'overview', out = `/tmp/shot-${view}.png`, w = '1440', h = '900'] = process.argv.slice(2)
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] })
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 })
const errs = []
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message))
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.type() + ' ' + m.text().slice(0, 300)) })
await page.goto(`http://127.0.0.1:5199/?view=${view}${process.env.LABELS === '0' ? '&labels=0' : ''}`)
await page.waitForSelector('canvas', { timeout: 30000 })
await page.waitForTimeout(6000)
await page.screenshot({ path: out })
console.log('saved', out, errs.length ? '\n' + errs.slice(0, 8).join('\n') : '(no console errors)')
await browser.close()
