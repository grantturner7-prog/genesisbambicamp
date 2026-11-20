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
const notes = []
need(Object.values(c.sessions).some(Boolean), 'Joint Partners', 'at least one camp with exact dates, start date and TWD fee')
for (const season of ['winter', 'summer']) {
  const offer = c.sessions[season]
  if (!offer) notes.push(`${season} camp: no dates yet, so the site shows "Coming soon" for it and takes no registrations`)
  else need(offer.fee != null, 'Joint Partners', `${season} camp (${offer.dates.en}): TWD fee`)
}
need(c.snackShop.couponTerms, 'Joint Partners', 'snack coupons: how packs are paid for, and what happens to unused coupons')
need(c.winterMenu.allergensProvided, 'Bambi Glamping Partner', 'winter menu: allergen details for each dish (the site promises allergy-safe trays; until then the dining menu carries no allergen tags)')
notes.push('winter menu: the kitchen has not said which day each dish is served, so the site names no day')
need(c.snackShop.menuConfirmed, 'Bambi Glamping Partner', 'the Airstream snack-shop menu that coupons can be exchanged for (src/map/areas.ts holds a draft)')
need(c.payment.deposit && c.payment.balanceDueDays, 'Joint Partners', 'deposit amount and balance due date')
need(c.cohort.minGroupSize, 'Joint Partners', 'minimum group size')
need(c.venuePhotoPermissionOnFile, 'Bambi Glamping Partner', 'written permission to publish Bambi photos (public/media/bambi) and the venue film')
need(c.documents.final, 'Camp Operations Lead', 'forms: lawyer-approved final versions of the Camp Notice and Agreement, Camper Health Form and Check-in Day Form (the site labels them drafts until documents.final is true)')
need(c.registration.endpoint, 'Camp Operations Lead', 'registration endpoint (the form sends nothing until this is set)')
need(c.registration.contractPdfUrl, 'Camp Operations Lead', 'final bilingual contract PDF with all blanks filled')
if (notes.length) console.log('\nBy design, not blocking:\n' + notes.map((t) => '  · ' + t).join('\n'))
if (todo.length) {
  console.log(`\nNot ready to launch — ${todo.length} item(s) outstanding:\n` + todo.map((t) => '  ☐ ' + t).join('\n') + '\n\nFill these in src/config/campConfig.ts.\n')
  process.exit(1)
}
console.log('✔ All partner inputs are filled in.')
