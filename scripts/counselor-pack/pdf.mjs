// Prints the counselor pack to PDF:  node scripts/counselor-pack/pdf.mjs
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const { chromium } = createRequire(import.meta.url)('playwright')
const docs = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs/planning')
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 794, height: 1123 } }); await p.emulateMedia({ media: 'print' })
await p.goto('file://' + docs + '/camp-wow-counselor-pack.html'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1500)
await p.pdf({ path: docs + '/camp-wow-counselor-pack.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true, headerTemplate: '<div></div>',
  footerTemplate: '<div style="font-size:7px;width:100%;padding:0 11mm;color:#777;display:flex;justify-content:space-between;font-family:Inter,Arial,sans-serif"><span>Camp WOW · The Activity Plan and Counselor Pack · Thursday 28 to Sunday 31 January 2027</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>' })
await b.close(); console.log('pdf ok')
