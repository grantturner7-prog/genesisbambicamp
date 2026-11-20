// Compliance self-check (Doc 3, Part 6). Scans every published string, in both languages,
// against the Taiwan regulatory guardrails. A violation fails the build.
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent', optimizeDeps: { noDiscovery: true, include: [] } })
const load = (p) => vite.ssrLoadModule(p)
const [{ AREAS }, { strings }, home, { campConfig }, media] = await Promise.all([
  load('/src/map/areas.ts'), load('/src/i18n/strings.ts'), load('/src/home/content.ts'), load('/src/config/campConfig.ts'), load('/src/media/media.ts'),
])
const { HOTSPOTS } = await load('/src/map/hotspots.ts')
const games = await load('/src/home/games.ts')

/** Collect every string with its path. */
const all = []
const walk = (v, path) => {
  if (typeof v === 'string') all.push({ path, text: v })
  else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`))
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`)
}
walk(AREAS, 'areas'); walk(strings, 'strings'); walk(home, 'home'); walk(games, 'games'); walk(games.GAMES_COPY.showAll(games.GAMES.length), 'games.GAMES_COPY.showAll()'); walk(home.PRICING.pilotLimit(30), 'home.PRICING.pilotLimit()'); walk(HOTSPOTS.map((h) => h.name), 'hotspots')
walk({ AREA_PHOTOS: media.AREA_PHOTOS, ZONE_PHOTOS: media.ZONE_PHOTOS, ZONES: media.ZONES }, 'media')
const { readFileSync } = await import('node:fs')
for (const f of ['index.html', 'facilities/index.html']) for (const m of readFileSync(f, 'utf8').matchAll(/<title>([^<]*)<\/title>|content="([^"]*)"/g)) walk((m[1] ?? m[2]).replace(/&amp;/g, '&'), `${f} <head>`)
walk({ sessions: campConfig.sessions, snackShop: { couponTerms: campConfig.snackShop.couponTerms } }, 'config')

const RULES = [
  // Rule A — zero cram-school (buxiban) triggers
  ['A cram-school wording', /education group|教育集團|學院|補習班|\bESL\b|foreign teachers?|外籍教師|外師|美語課程|english class(es)?|english immersion|\bSTEM\b|\bSTEAM\b|placement test|程度分班|結業證書|修業證明|completion certificate|講義|教材|\bteachers?\b|老師|授課|\blessons?\b|curriculum|課程|tutoring|課業輔導/i],
  // Rule C — banned disclaimers
  ['C banned disclaimer', /for reference only|僅供參考|保有最終修改權|reserves? (the )?(final )?right to (modify|change)|概不負責|not responsible for accidents|概不退還|non-?refundable/i],
  // Rule D — truth in advertising
  ['D wrong township', /sanyi|三義/i],
  // Campers meet at the meeting point in Taichung and ride the bus both ways: no drop-off at the camp gate.
  ['D stale arrival plan (campers meet at the meeting point in Taichung; nobody is dropped off at the camp)', /(wednesday|週三)[^.。]{0,40}14:[03]0|drop(ped|s)?[- ]?(off|their|them)[^.。]{0,40}(sanwan|\bgate\b)|(送達|送到|送至|送抵)[^。]{0,12}(三灣|園區|大門|營地)|(大門|園區)[^。]{0,8}報到|arrive relaxed|taichung theater|歌劇院|shizheng|市政北二路|tour bus zone|臨停區/i],
  ['D wooden cabins', /wooden cabin|log cabin|小木屋|木屋/i],
  // Meals: three a day (buffet breakfast, DIY lunch with the chef, evening buffet).
  ['D stale meal plan (the camp serves three meals a day)', /\bfour[- ](daily )?meals?\b|(?<![\d.,])4[- ](daily )?meals?\b|一泊四食|四食|(?<![十\d])四餐|(?<!\d)4 ?餐|宵夜|(campfire|evening) snacks?|營火點心|晚間點心/i],
]
const errors = []
const fail = (name, path, text) => errors.push(`${name}: ${path} → "${text.slice(0, 90)}"`)
for (const { path, text } of all) for (const [name, re] of RULES) if (re.test(text)) fail(name, path, text)

// There is no afternoon tea in the meal plan: it may only be mentioned as something coupons buy.
for (const { path, text } of all) if (/afternoon tea|午茶/i.test(text) && !/coupon|點心券/i.test(text)) fail('D afternoon tea is not part of the meal plan', path, text)

// Snacks are bought with coupons at the Airstream snack shop: never "included" or "free".
{
  const pool = AREAS.findIndex((a) => a.id === 'pool')
  const SNACK_PATH = new RegExp(`^areas\\[${pool}\\]\\.(menu|features)`)
  const INCL = /\bincluded\b|no spending money|free of charge|已含|已包含|零用錢/i
  const NOT_INCL = /not (included|part of)|不包含|不含/i
  const SNACK_SUBJECT = /(snacks?|drinks? at the airstream)[^.?!]*\b(is|are) (included|free)\b|點心[^。；]*(已含|已包含|免費)/i
  for (const { path, text } of all) {
    if (SNACK_PATH.test(path) && INCL.test(text) && !NOT_INCL.test(text)) fail('D snacks are not included in the fee', path, text)
    else if (SNACK_SUBJECT.test(text) && !NOT_INCL.test(text)) fail('D snacks are not included in the fee', path, text)
  }
}

// One kind of camp: 4 Days / 3 Nights, Wednesday to Saturday. No option letters, no other
// lengths, no family camp, and no other camp days anywhere in the copy.
{
  const STALE = /\boptions? [abc]\b|方案 ?[ABC]|family camp|親子梯|5 days|五天四夜|3 days \/ 2 nights|三天兩夜|\b(mon|tues|fri)day\b|(週|星期|禮拜)[一二五]/i
  for (const { path, text } of all) if (STALE.test(text)) fail('D stale option or camp day (one camp: 4 Days / 3 Nights, Wednesday to Saturday)', path, text)
  for (const [season, o] of Object.entries(campConfig.sessions)) {
    if (o && new Date(o.startDate + 'T00:00:00Z').getUTCDay() !== 3) errors.push(`The ${season} camp must start on a Wednesday: ${o.startDate}`)
  }
}

// No alcohol products on any menu.
const ALCOHOL = /beer|wine|cocktail|liquor|sake|cider|sangria|mojito|whisk|vodka|啤酒|紅酒|白酒|調酒|雞尾酒|清酒|燒酒|高粱|酒/i
for (const a of AREAS) for (const sec of a.menu?.sections ?? []) for (const it of sec.items) for (const lang of ['en', 'zh']) if (ALCOHOL.test(it.name[lang])) errors.push(`Alcohol on a menu: ${a.id} → "${it.name[lang]}"`)

// Movie nights only while the screenings are public-performance licensed.
const movie = all.filter(({ text }) => /movie|cinema|film|電影/i.test(text))
if (movie.length && !campConfig.cinema.publicPerformanceLicensed) errors.push(`Movie-night copy present (${movie.length} strings) but campConfig.cinema.publicPerformanceLicensed is false`)
if (movie.length && !all.some(({ text }) => text.includes('公播'))) errors.push('Movie-night copy must state the public-performance licence (公播版)')

// Pool relays are Summer-only and name the certified lifeguard.
if (!AREAS.find((a) => a.id === 'pool')?.summerOnly) errors.push('Pool must be flagged summerOnly')
for (const act of home.ACTIVITIES) if (/pool|戲水池/i.test(act.name.en + act.name.zh) && (act.seasons.includes('winter') || !/lifeguard/i.test(act.body.en) || !act.body.zh.includes('救生員'))) errors.push('Pool activity must be Summer-only and name the certified lifeguard')

// Required disclosures.
const text = all.map((x) => x.text).join('\n')
const need = [
  ['venue address (zh)', '苗栗縣三灣鄉北埔村小北埔27號', campConfig.venue.address.zh],
  ['venue address (en)', 'Sanwan Township, Miaoli County', campConfig.venue.address.en],
  ['rainy-day plan (斑比大飯店)', '斑比大飯店', text],
  ['minimum-group 7-day 100% guarantee', '100%', home.PRICING.guarantee.en + home.PRICING.guarantee.zh],
  ['Insurance Act Art. 107', '107', home.SAFETY.under15.en + home.SAFETY.under15.zh],
  ['Wednesday meeting point and time', `meet at ${campConfig.transport.meetingPoint.en}, at ${campConfig.transport.meetTime}`, home.PRICING.camp.bus.en],
  ['Wednesday bus departure time', `leaves at ${campConfig.transport.departTime}`, home.PRICING.camp.bus.en],
  ['Saturday return time and place', `returns to ${campConfig.transport.meetingPoint.en}, at ${campConfig.transport.returnTime}`, home.PRICING.camp.bus.en],
  ['meeting point and times (zh)', `週三 ${campConfig.transport.meetTime} 於${campConfig.transport.meetingPoint.zh}集合`, home.PRICING.camp.bus.zh],
  ['Saturday return (zh)', `週六 ${campConfig.transport.returnTime} 返抵${campConfig.transport.meetingPoint.zh}`, home.PRICING.camp.bus.zh],
  ['meeting point address', campConfig.transport.meetingAddress.en, home.PRICING.bus.en],
  ['both bus journeys under "Included"', 'to camp and back', home.PRICING.included.map((x) => x.en).join(' ')],
  ['the camp is 4 Days / 3 Nights', '4 Days / 3 Nights', home.PRICING.camp.name.en],
  ['the camp runs Wednesday to Saturday', 'Wednesday to Saturday', home.PRICING.camp.when.en],
  ['three meals a day', 'Three meals a day', home.STAY.mealsTitle.en],
  ['signature Wagyu dinner on the final evening', 'Wagyu', home.STAY.signature.title.en + home.STAY.signature.body.en],
  ...campConfig.snackShop.couponPacks.map((n) => [`snack coupon pack NT$${n.toLocaleString('en-US')}`, `NT$${n.toLocaleString('en-US')}`, home.STAY.snacks.body.en]),
  ['snack coupons listed under "Not included"', 'coupon', home.PRICING.excluded.map((x) => x.en).join(' ')],
  ['Venue tax ID 88491889', '88491889', campConfig.venue.taxId],
]
// The winter menu from the venue kitchen: the landing page and the dining hall menu both carry every dish.
const DISHES = [['egg', '雞蛋'], ['bacon', '培根'], ['bread', '麵包'], ['sandwich', '三明治'], ['milk', '牛奶'], ['soy milk', '豆漿'], ['curry', '咖哩'], ['pizza', '披薩'], ['rice ball', '飯糰'], ['donburi', '丼飯'], ['meatball pasta', '肉丸義大利麵'], ['corn soup', '玉米濃湯'], ['fried chicken', '炸雞'], ['braised pork', '滷肉'], ['vegetables', '青菜'], ['rice', '白飯']]
const MENUS = {
  'landing page meals': (lang) => home.STAY.meals.map((m) => m.note[lang]).join(' '),
  'meals FAQ': (lang) => home.FAQ.find((x) => /which meals/i.test(x.q.en)).a[lang],
  'dining hall menu': (lang) => AREAS.find((a) => a.id === 'dining').menu.sections.flatMap((x) => x.items.map((i) => i.name[lang])).join(' '),
}
for (const [where, text] of Object.entries(MENUS)) for (const [en, zh] of DISHES) {
  if (!text('en').toLowerCase().includes(en)) errors.push(`Winter menu: “${en}” is missing from the ${where}`)
  if (!text('zh').includes(zh)) errors.push(`Winter menu: 「${zh}」 is missing from the ${where} (zh)`)
}
// A season with no dates is a placeholder: no date, month or year may be printed for it.
for (const season of ['winter', 'summer']) if (!campConfig.sessions[season]) for (const { path, text } of all) if (new RegExp(`${season}[^.。]{0,60}(20\\d\\d|january|february|march|april|may \\d|june|july|august|september|october|november|december)`, 'i').test(text)) fail(`D a date is printed for the ${season} camp, which has none yet`, path, text)
for (const [name, needle, hay] of need) if (!String(hay).includes(needle)) errors.push(`Missing required disclosure: ${name}`)

// en / zh parity: no empty side.
for (const { path, text: t } of all) if (!t.trim()) errors.push(`Empty string: ${path}`)

await vite.close()
if (errors.length) {
  console.error(`\n✖ Compliance audit failed (${errors.length}):\n` + errors.map((e) => '  - ' + e).join('\n') + '\n')
  process.exit(1)
}
console.log(`✔ Compliance audit passed: ${all.length} strings checked (en + zh-TW).`)
