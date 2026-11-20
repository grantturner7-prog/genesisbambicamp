// Every document for the lawyer in one PDF: a contents page, the camp forms, then the legal
// notices the website publishes.
//   npm run all-pdf        (runs legal-pdf and forms-pdf first; joining needs poppler's pdfunite)
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
const { chromium } = createRequire(import.meta.url)('playwright')

const root = process.cwd()
const out = path.join(root, 'docs/genesis-bambi-camp-documents.pdf')
const PARTS = [
  ['Part 1 · Camp forms (drafts) 營隊表單（草稿）', [
    ['docs/forms/0-notes-for-the-reviewer.pdf', 'Notes for the reviewer: how the forms were drawn up, and the points to decide', '審閱說明'],
    ['docs/forms/1-camp-notice-and-agreement.pdf', 'Camp Notice and Agreement', '營隊須知與同意書'],
    ['docs/forms/2-camper-health-form.pdf', 'Camper Health Form', '營員健康調查表'],
    ['docs/forms/3-check-in-day-form.pdf', 'Check-in Day Form', '報到日確認單'],
  ]],
  ['Part 2 · Legal notices published on the website 官網刊載之法律告知事項', [
    ['docs/legal-review/00-all-legal-notices.pdf', 'Fees and refunds; registration consents and personal data; safety, insurance and liability; camp and facility rules; legal and licensing disclosures; FAQ and other commitments', '費用與退費、報名同意事項與個資、安全保險與責任、營隊與設施規範、法定揭露、常見問題'],
  ]],
]
const pages = (f) => Number(execFileSync('pdfinfo', [path.join(root, f)]).toString().match(/Pages:\s+(\d+)/)[1])
let at = 2 // the contents page is page 1
const rows = PARTS.map(([title, files]) => `<h2>${title}</h2><table>${files.map(([f, en, zh]) => { const from = at; at += pages(f); return `<tr><td>${en}<br><span lang="zh-Hant">${zh}</span></td><td class="n">${from}–${at - 1}</td></tr>` }).join('')}</table>`).join('')
const font = (pkg) => `file://${path.join(root, 'node_modules/@fontsource-variable', pkg, 'index.css')}`
const today = new Date().toISOString().slice(0, 10)
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="stylesheet" href="${font('inter')}"><link rel="stylesheet" href="${font('noto-sans-tc')}"><style>
  @page { size: A4; margin: 24mm 20mm; } body { margin: 0; font: 10.5pt/1.5 'Inter Variable', 'Noto Sans TC Variable', sans-serif; color: #1c2a24; }
  .tag { color: #b45f06; font-size: 8.5pt; letter-spacing: .1em; } h1 { font-size: 22pt; line-height: 1.2; color: #1b4332; margin: 6pt 0 2pt; } h1 small { display: block; font-size: 14pt; font-weight: 600; color: #46584f; margin-top: 4pt; }
  h2 { font-size: 11.5pt; color: #1b4332; border-bottom: 1.1px solid #1b4332; padding-bottom: 3pt; margin: 22pt 0 4pt; }
  table { width: 100%; border-collapse: collapse; } td { padding: 6pt 0; border-bottom: .6px solid #cdd6d0; vertical-align: top; } td.n { width: 60pt; text-align: right; font-variant-numeric: tabular-nums; color: #46584f; }
  span[lang] { color: #46584f; font-size: 9.5pt; } p { margin: 8pt 0; } .small { font-size: 9pt; color: #46584f; }
</style></head><body>
<div class="tag">DRAFT FOR LEGAL REVIEW</div>
<h1>Genesis Youth Adventures × Bambi Glamping<small lang="zh-Hant">創世紀青少年戶外探索 × 斑比跳跳</small></h1>
<p>Camp documents for review by a lawyer, in one file. ${today}.</p>
${rows}
<p class="small" style="margin-top:22pt">The page numbers above are the pages of this PDF. Each document also keeps its own page numbers in its footer.<br>In Part 1, wording marked ◆ is proposed for the first time and is not yet camp policy; blanks and “[To decide: …]” are points the camp has not yet settled. Part 2 reproduces what the website says today, line by line, with points for the reviewer in each section.</p>
</body></html>`
const tmpHtml = path.join(root, 'docs/.contents.html')
const tmpPdf = path.join(root, 'docs/.contents.pdf')
writeFileSync(tmpHtml, html)
const browser = await chromium.launch()
const tab = await browser.newPage()
await tab.goto('file://' + tmpHtml)
await tab.evaluate(() => document.fonts.ready)
await tab.pdf({ path: tmpPdf, format: 'A4', printBackground: true })
await browser.close()
execFileSync('pdfunite', [tmpPdf, ...PARTS.flatMap(([, files]) => files.map(([f]) => path.join(root, f))), out])
rmSync(tmpHtml, { force: true })
rmSync(tmpPdf, { force: true })
console.log('wrote', path.relative(root, out), `(${at - 1} pages)`)
