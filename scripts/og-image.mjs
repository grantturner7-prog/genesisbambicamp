// The picture that appears when the site's link is shared in LINE, Facebook, Instagram or a chat:
//   node scripts/og-image.mjs        → public/og-camp-wow.jpg (1200 × 630)
// The name, dates and age range come from the site's own settings. When the travel agency's details
// are filled in (campConfig.travelAgency), they are printed on the picture too, as on the adverts;
// until then it shows none, so run this again once they are in.
import { createServer } from 'vite'
import { createRequire } from 'node:module'
import { writeFileSync, rmSync } from 'node:fs'
import path from 'node:path'
const { chromium } = createRequire(import.meta.url)('playwright')
const root = process.cwd()
const vite = await createServer({ configFile: false, root, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent', optimizeDeps: { noDiscovery: true, include: [] } })
const { campConfig: c } = await vite.ssrLoadModule('/src/config/campConfig.ts')
await vite.close()
const offer = c.sessions.winter
if (!offer) throw new Error('The winter camp has no dates: nothing to show.')
const ta = c.travelAgency
const pick = (v, lang) => (v && typeof v === 'object' ? v[lang] : v)
const agency = ta.legalName && ta.category && ta.tourismRegNo && ta.phone && ta.insuranceNote
  ? [pick(ta.legalName, 'zh'), pick(ta.category, 'zh'), ta.tourismRegNo, ta.tqaaNo, ta.phone, pick(ta.insuranceNote, 'zh')].filter(Boolean).join(' · ')
  : null
const font = (pkg) => `file://${path.join(root, 'node_modules/@fontsource-variable', pkg, 'index.css')}`
const photo = `file://${path.join(root, 'public/media/bambi/lake-cypress.webp')}`
const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="${font('inter')}"><link rel="stylesheet" href="${font('noto-sans-tc')}"><link rel="stylesheet" href="${font('fraunces')}"><link rel="stylesheet" href="${font('noto-serif-tc')}">
<style>
* { box-sizing: border-box; margin: 0; } html, body { width: 1200px; height: 630px; overflow: hidden; font-family: 'Inter Variable', 'Noto Sans TC Variable', sans-serif; color: #fff; }
.bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 6%; }
.shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(15,39,29,.55) 0%, rgba(15,39,29,.04) 30%, rgba(15,39,29,.18) 50%, rgba(15,39,29,.88) 100%); }
.in { position: absolute; left: 64px; right: 64px; bottom: ${agency ? 70 : 52}px; }
.mean { font-size: 22px; font-weight: 700; letter-spacing: .28em; text-transform: uppercase; color: #f3e3d0; text-shadow: 0 1px 10px rgba(15,39,29,.7); }
h1 { font-family: 'Fraunces Variable', 'Noto Serif TC Variable', serif; font-weight: 600; font-size: 132px; line-height: 1; letter-spacing: -.01em; margin: 6px 0 4px; text-shadow: 0 2px 22px rgba(15,39,29,.55); }
.line { font-family: 'Fraunces Variable', 'Noto Serif TC Variable', serif; font-weight: 600; font-size: 38px; }
.pills { margin-top: 22px; display: flex; gap: 12px; }
.pill { border: 1.5px solid rgba(255,255,255,.55); background: rgba(255,255,255,.14); border-radius: 999px; padding: 8px 22px; font-size: 24px; font-weight: 600; }
.legal { position: absolute; left: 64px; right: 64px; bottom: 22px; font-size: 15px; font-weight: 600; color: rgba(255,255,255,.88); }
</style></head><body>
<img class="bg" src="${photo}" alt=""><div class="shade"></div>
<div class="in"><p class="mean">${c.brand.campMeaning}</p><h1>${c.brand.camp}</h1><p class="line">${c.brand.campLine.en} · ${c.brand.campLine.zh}</p>
<div class="pills"><span class="pill">${offer.dates.en.replace(/ \(.*\)/, '')}</span><span class="pill">${c.cohort.ageMin}–${c.cohort.ageMax} 歲 · Ages ${c.cohort.ageMin}–${c.cohort.ageMax}</span><span class="pill">Bambi Glamping · 苗栗三灣</span></div></div>
${agency ? `<p class="legal">${agency}</p>` : ''}
</body></html>`
const tmp = path.join(root, 'scripts/.og.tmp.html')
writeFileSync(tmp, html)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.goto('file://' + tmp); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300)
await page.screenshot({ path: path.join(root, 'public/og-camp-wow.jpg'), type: 'jpeg', quality: 88 })
await browser.close(); rmSync(tmp, { force: true })
console.log('wrote public/og-camp-wow.jpg', agency ? '(with the travel agency line)' : '(no travel agency line yet: run again once campConfig.travelAgency is filled in)')
