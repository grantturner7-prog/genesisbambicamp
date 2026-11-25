// The welcome message to send parents when registration opens, in 繁體中文 and English:
//   node scripts/parent-message.mjs        → docs/marketing/parent-welcome-message.md
// Dates, times, fee, what is included and the refund rules are read from the site's own settings, so the
// message cannot disagree with the website. Anything still undecided is left as a [bracketed] blank, and
// the script lists them. Every sentence is checked against the wording rules in copy-rules.mjs.
import { createServer } from 'vite'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { broken } from './copy-rules.mjs'

const root = process.cwd()
const vite = await createServer({ configFile: false, root, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent', optimizeDeps: { noDiscovery: true, include: [] } })
const [{ campConfig: c }, home] = await Promise.all([vite.ssrLoadModule('/src/config/campConfig.ts'), vite.ssrLoadModule('/src/home/content.ts')])
await vite.close()

const o = c.sessions.winter
const T = c.transport
const twd = (n) => `NT$${n.toLocaleString('en-US')}`
const BLANKS = []
const need = (text) => BLANKS.push(text)

const siteEn = c.site.url || (need('website address'), '[website address]')
const siteZh = c.site.url || '〔官網網址〕'
const lineEn = c.operator.lineId ? `LINE ${c.operator.lineId}` : (need('LINE ID'), '[LINE ID]')
const lineZh = c.operator.lineId ? `LINE ${c.operator.lineId}` : '〔LINE ID〕'
const dep = c.payment.deposit
const payEn = dep ? `Deposit ${twd(dep)}; the balance is due ${c.payment.balanceDueDays} days before camp.` : (need('deposit amount and balance date'), '[Deposit amount and the date the balance is due.]')
const payZh = dep ? `訂金 ${twd(dep)}；尾款於營隊開始前 ${c.payment.balanceDueDays} 日繳清。` : '〔訂金金額與尾款繳費日期〕'
const agency = typeof c.travelAgency.legalName === 'string' ? c.travelAgency.legalName : null
const agencyEn = agency || (need('travel agency name'), '[travel agency name]')
const agencyZh = agency || '〔承辦旅行社名稱〕'
const pack = home.PACKING.filter((p) => !p.season || p.season === 'winter').slice(0, 5)
const packEn = pack.map((p) => p.item.en.toLowerCase().replace(/ \(.*?\)/g, '')).join(', ')
const packZh = pack.map((p) => p.item.zh.replace(/（.*?）/g, '').replace(/，.*$/, '')).join('、')

const en = `**Subject: Camp WOW, ${o.dates.en.replace(/ \(.*?\)/, '')}: registration is open**

Dear parents,

Thank you for your interest in ${c.brand.camp} (${c.brand.campMeaning}). Registration for our first camp is now open.

**The camp**
- ${o.dates.en}, for campers aged ${c.cohort.ageMin} to ${c.cohort.ageMax}, at Bambi Glamping in Sanwan, Miaoli. The camp has the whole venue to itself.
- ${twd(o.fee)} per camper, with the charter bus from Taichung included. This first camp is a pilot with ${o.pilot.maxCampers} places.
- Campers stay in camper vans, three to a van, with three meals a day. A registered nurse is on site day and night, and counselors are with the campers throughout.

**Getting there**
- Meet at ${T.meetingPoint.en} at ${T.meetTime} on ${c.days.first.en}. The bus leaves at ${T.departTime}. On ${c.days.last.en} the bus leaves camp at ${T.leaveCampTime} and is back at about ${T.returnTime}.

**To register**
1. Fill in the registration form at ${siteEn}.
2. Read the service contract and the Camp Notice and Agreement with your child, and sign the last page.
3. Complete the Camper Health Form for our nurse.
4. ${payEn}

**What to know**
- Campers with a fever at check-in do not board the bus. Campers with severe asthma or another serious medical condition cannot join this camp. If you are unsure, ask us before you register.
- Phones and other devices are kept safely by counselors during camp. You can reach us at any time, and you will see photos of your child in a private album.
- If the camp is cancelled for any reason, or a typhoon, earthquake or other natural disaster stops it, you receive a full refund. If your family needs to cancel, the refund follows the table on our website.
- The packing list is on the website. The essentials: ${packEn}.

Questions? Message us on ${lineEn} or reply to this message. The camp is organized with ${agencyEn}, our licensed travel agency.

We look forward to meeting your child.

The Camp WOW team
Genesis Youth Adventures × Bambi Glamping`

const zh = `**主旨：Camp WOW 開放報名（${o.dates.zh.replace(/（.*?）/, '')}）**

各位家長您好：

感謝您對 ${c.brand.camp}（${c.brand.campMeaning}）的關注。我們的第一梯營隊現在開放報名。

**營隊資訊**
- ${o.dates.zh}，招收 ${c.cohort.ageMin}–${c.cohort.ageMax} 歲營員，地點在苗栗三灣的斑比跳跳。營隊期間由我們包場。
- 每位營員 ${twd(o.fee)}，已含臺中來回遊覽車專車。首梯為試辦營，限額 ${o.pilot.maxCampers} 名營員。
- 營員住在露營車，三人一車，每日三餐。駐點護理師日夜在營，隊輔全程陪伴營員。

**集合與返程**
- ${c.days.first.zh} ${T.meetTime} 在${T.meetingPoint.zh}集合，遊覽車專車 ${T.departTime} 出發。${c.days.last.zh} ${T.leaveCampTime} 自營地出發，預計約 ${T.returnTime} 返抵集合地點。

**報名方式**
1. 請至 ${siteZh} 填寫報名表。
2. 請與孩子一起閱讀服務契約與營隊須知，並在最後一頁簽名。
3. 請填寫營員健康調查表，供護理師使用。
4. ${payZh}

**請您留意**
- 報到時發燒的營員不上車。患有嚴重氣喘或其他重大疾病的孩子無法參加本營隊；若不確定，請在報名前先與我們聯繫。
- 營隊期間手機等裝置由隊輔妥善保管。您隨時可以聯繫我們，也能在專屬相簿中看到孩子的照片。
- 營隊若因任何原因取消，或因颱風、地震等天災而無法舉辦，已繳費用全額退還。若是家長需要解約，則依官網公布的退費表辦理。
- 行李清單請見官網。主要物品：${packZh}。

有任何問題，請透過 ${lineZh} 或直接回覆此訊息與我們聯繫。本營隊與持有執照的旅行社 ${agencyZh} 合作辦理。

期待與孩子見面！

Camp WOW 營隊團隊
創世紀青少年戶外探索 × 斑比跳跳`

for (const [lang, text] of [['zh', zh], ['en', en]]) {
  const plain = text.replace(/\[[^\]]*\]|〔[^〕]*〕/g, '')
  const bad = broken(plain)
  if (bad.length) throw new Error(`The ${lang} message breaks “${bad[0][0]}”: “${bad[0][1]}”`)
  if (/課程|上課|教學|老師|師資|學費|招生|結業|學員|學生|\bstudents?\b|\btuition\b|\bclass(es)?\b|\blessons?\b|\bteach/i.test(plain)) throw new Error(`The ${lang} message uses a word that reads as teaching`)
}

const out = path.join(root, 'docs/marketing')
mkdirSync(out, { recursive: true })
const blanks = [...new Set(BLANKS)]
writeFileSync(
  path.join(out, 'parent-welcome-message.md'),
  `# Camp WOW: welcome message to parents

To send when registration opens, by LINE or email. Anything in [square brackets] is still to be decided; the rest comes from the website's settings.
${blanks.length ? `\nStill to fill in: ${blanks.join('; ')}.\n` : ''}
## 繁體中文

${zh}

---

## English

${en}
`,
)
console.log('wrote docs/marketing/parent-welcome-message.md', blanks.length ? `(blanks: ${blanks.join('; ')})` : '')
