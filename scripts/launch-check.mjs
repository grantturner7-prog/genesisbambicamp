// Lists what partners still owe before the site can go public (Doc 3, Section 1).
import { createServer } from 'vite'
const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent', optimizeDeps: { noDiscovery: true, include: [] } })
const { campConfig: c } = await vite.ssrLoadModule('/src/config/campConfig.ts')
await vite.close()
const todo = []
const need = (ok, owner, what) => { if (!ok) todo.push(`[${owner}] ${what}`) }
need(c.operator.legalName && c.operator.taxId && c.operator.phone && c.operator.address, 'Camp Operations Lead', 'operator legal name, Tax ID (統編), phone, address')
need(c.operator.lineId && c.operator.lineUrl, 'Camp Operations Lead', 'Official LINE ID and link')
need(c.travelAgency.legalName && c.travelAgency.category && c.travelAgency.tourismRegNo && c.travelAgency.tqaaNo && c.travelAgency.phone, 'Travel Agency Partner', 'legal name, licence tier (甲種/乙種), 交觀 number, 品保 number, phone')
for (const season of ['winter', 'summer']) for (const o of ['optionA', 'optionB']) need(c.sessions[season][o], 'Joint Partners', `${season} ${o}: exact dates, start date and TWD fee`)
need(c.payment.deposit && c.payment.balanceDueDays, 'Joint Partners', 'deposit amount and balance due date')
need(c.cohort.minGroupSize, 'Joint Partners', 'minimum group size')
need(c.venuePhotoPermissionOnFile, 'Bambi Glamping Partner', 'written permission to publish Bambi photos (public/media/bambi) and the venue film')
need(c.registration.endpoint, 'Camp Operations Lead', 'registration endpoint (the form sends nothing until this is set)')
need(c.registration.contractPdfUrl, 'Camp Operations Lead', 'final bilingual contract PDF with all blanks filled')
if (todo.length) {
  console.log(`\nNot ready to launch — ${todo.length} item(s) outstanding:\n` + todo.map((t) => '  ☐ ' + t).join('\n') + '\n\nFill these in src/config/campConfig.ts.\n')
  process.exit(1)
}
console.log('✔ All partner inputs are filled in.')
