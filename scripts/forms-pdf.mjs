// Camp forms as printable PDFs, English with 繁體中文: the camp notice and agreement, the
// camper health form, and the check-in day form. DRAFTS for review by a lawyer and the nurse.
//   node scripts/forms-pdf.mjs [outDir]        (default: docs/forms)
// Everything the website already states (fees, refund tiers, consents, rules) is taken from
// the site's own copy, so the forms and the site cannot drift apart. Wording that is new
// here, and is therefore a proposal and not yet camp policy, is marked ◆.
import { createServer } from 'vite'
import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
const { chromium } = createRequire(import.meta.url)('playwright')

const root = process.cwd()
const out = path.resolve(process.argv[2] || 'docs/forms')
const vite = await createServer({ configFile: false, root, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent', optimizeDeps: { noDiscovery: true, include: [] } })
const load = (p) => vite.ssrLoadModule(p)
const [{ AREAS }, { strings }, home, { campConfig: c }] = await Promise.all([load('/src/map/areas.ts'), load('/src/i18n/strings.ts'), load('/src/home/content.ts'), load('/src/config/campConfig.ts')])
await vite.close()

// ── helpers ─────────────────────────────────────────────────────────────────────────────
const zhKey = Object.keys(strings).find((k) => k !== 'en')
const S = (p) => ({ en: p.split('.').reduce((v, k) => v?.[k], strings.en), zh: p.split('.').reduce((v, k) => v?.[k], strings[zhKey]) })
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const twd = (n) => `NT$${n.toLocaleString('en-US')}`
const NEW = '<span class="new" title="proposed">◆</span>'
/** Both languages on one line: a label, a heading, a checkbox caption. */
const B = (en, zh) => `<span class="e">${esc(en)}</span> <span class="z" lang="zh-Hant">${esc(zh)}</span>`
/** A paragraph in both languages, English first. `mark`: new wording, a proposal. */
const P = (en, zh, mark = false) => `<div class="para"><p>${mark ? NEW + ' ' : ''}${esc(en)}</p><p class="z" lang="zh-Hant">${esc(zh)}</p></div>`
const PL = (v, mark = false) => P(v.en, v.zh, mark)
const H = (n, en, zh) => `<h2>${n ? n + '. ' : ''}${B(en, zh)}</h2>`
const H3 = (en, zh) => `<h3>${B(en, zh)}</h3>`
const OL = (items, mark = false, type = '1') => `<ol type="${type}">${items.map(([en, zh]) => `<li>${mark ? NEW + ' ' : ''}${esc(en)}<br><span class="z" lang="zh-Hant">${esc(zh)}</span></li>`).join('')}</ol>`
const UL = (items, mark = false) => `<ul>${items.map((v) => `<li>${mark ? NEW + ' ' : ''}${esc(v.en)}<br><span class="z" lang="zh-Hant">${esc(v.zh)}</span></li>`).join('')}</ul>`
/** A labelled blank. `w`: share of the row (1–12). `val`: printed when the camp already has it. */
const F = (en, zh, w = 6, val = '') => `<div class="f" style="grid-column: span ${w}"><label>${B(en, zh)}</label><i>${esc(val ?? '')}</i></div>`
const ROW = (...f) => `<div class="row">${f.join('')}</div>`
/** A question with `n` ruled lines to write on. */
const LINES = (en, zh, n = 2, mark = false) => `<div class="lines"><label>${mark ? NEW + ' ' : ''}${B(en, zh)}</label>${'<i></i>'.repeat(n)}</div>`
const C = (en, zh) => `<span class="c"><b></b>${B(en, zh)}</span>`
const CHECKS = (...c) => `<div class="checks">${c.join('')}</div>`
/** A question answered No / Yes, with room for details. */
const YN = (en, zh) => `<tr><td>${B(en, zh)}</td><td class="yn"><b></b></td><td class="yn"><b></b></td><td></td></tr>`
const GRP = (en, zh) => `<tr class="grp"><th colspan="4">${B(en, zh)}</th></tr>`
const YNT = (rows) => `<table class="grid yntable"><tr><th>${B('In the past or now', '過去或目前是否有')}</th><th>${B('No', '否')}</th><th>${B('Yes', '是')}</th><th>${B('If yes: details, and what helps', '若有，請說明狀況與處理方式')}</th></tr>${rows.map((r) => YN(...r)).join('')}</table>`
const TABLE = (heads, n, cls = '', widths = null) =>
  `<table class="grid plain ${cls}">${widths ? `<colgroup>${widths.map((w) => `<col style="width:${w}%">`).join('')}</colgroup>` : ''}<tr>${heads.map(([en, zh]) => `<th>${B(en, zh)}</th>`).join('')}</tr>${Array.from({ length: n }, () => `<tr>${heads.map(() => '<td class="blank"></td>').join('')}</tr>`).join('')}</table>`
const SIGN = (en, zh) => ROW(F(en, zh, 5), F('Signature', '簽名', 4), F('Date', '日期', 3))
const BOX = (title, inner) => `<div class="box"><h4>${title}</h4>${inner}</div>`
/** The camp's own contact details: printed when they are in campConfig, blank until then. */
const CONTACT = () =>
  BOX(
    B('Camp contacts (the camp fills these in before the form goes out)', '營隊聯絡方式（由營隊於發送前填寫）'),
    ROW(F('Camp office phone', '營隊辦公室電話', 3, c.operator.phone), F('LINE', 'LINE', 3, c.operator.lineId), F('Email', '電子信箱', 3), F('During camp, day and night', '營期間 24 小時電話', 3)),
  )

const season = Object.entries(c.sessions).filter(([, o]) => o && o.fee != null)
const hospital = c.venue.hospital
const fee = season.map(([, o]) => `${o.dates.en}, ${twd(o.fee)}`).join('; ')
const feeZh = season.map(([, o]) => `${o.dates.zh}，${twd(o.fee)}`).join('；')
const R = home.REFUND
const consent = (k) => home.CONSENTS.find((x) => x.key === k)
const vanRules = AREAS.find((a) => a.id === 'vans').safety.rules
const foodRule = vanRules.find((r) => /food/i.test(r.title.en))
const busHome = AREAS.find((a) => a.id === 'gate').features.find((f) => /return charter bus/i.test(f.title.en)).body
const nurse = home.SAFETY.staff.find((x) => /nurse/i.test(x.title.en))
const faq = (re) => home.FAQ.find((x) => re.test(x.q.en)).a
/** Sections of the notice, so that cross-references follow when one is added. */
const N = { camp: 1, insurance: 2, fee: 3, refund: 4, health: 5, risk: 6, conduct: 7, things: 8, vans: 9, nights: 10, visits: 11, wear: 12, photos: 13, data: 14, sign: 15 }

/** Who in the camp team learns what from the health form: the same words on the notice and the form. */
const needToKnow = () =>
  P(
    'So that your camper is safe day and night, the nurse tells your camper’s own counselors, and the lifeguard or kayak coach where it matters, only what each needs to know: for example an allergy, asthma, seizures, water comfort or a night-time need. In an emergency the form goes with your camper to the hospital. The insurer receives only what a claim needs.',
    '為了孩子日夜的安全，護理師僅會就必要事項告知孩子所屬小隊的隊輔，以及相關活動的救生員或獨木舟教練，例如過敏、氣喘、癲癇、水性或夜間需要協助的狀況。緊急送醫時，本表將隨營員提供醫療院所。保險公司僅取得理賠所需之資料。',
    true,
  )
/** The rule on staying home when unwell: the same words on the notice and the health form. */
const stayHome = {
  en: 'a fever in the 24 hours before camp, vomiting or diarrhoea in the 48 hours before camp, or a doctor’s diagnosis in the 7 days before camp of an illness that can spread to others (for example influenza, enterovirus, chickenpox, COVID-19 or norovirus)',
  zh: '營隊開始前 24 小時內曾發燒、48 小時內曾嘔吐或腹瀉，或 7 日內經醫師診斷罹患可能傳染給他人的疾病（如流感、腸病毒、水痘、新冠肺炎、諾羅病毒）',
}

// ── Form 1: camp notice and agreement ───────────────────────────────────────────────────
const notice = () => `
<section>
<h1>${B('Camp Notice and Agreement', '營隊須知與同意書')}</h1>
<p class="sub">${B(c.brand.en, c.brand.zh)} · ${B(home.PRICING.camp.name.en, home.PRICING.camp.name.zh)} · ${B(home.PRICING.camp.when.en, home.PRICING.camp.when.zh)}</p>
${CONTACT()}
${ROW(F('Camper', '營員姓名', 5), F('Camp dates', '營隊日期', 4), F('Date of birth', '出生年月日（西元）', 3))}
${P('This notice explains how the camp runs and what we ask of families. Please read it together with your camper and sign the last page. It is part of your registration, together with the service contract. If the two differ, the service contract applies.', '本須知說明營隊的運作方式，以及需要家長與營員配合的事項。請與孩子一起閱讀，並於最後一頁簽名。本須知與服務契約同為報名文件；兩者如有不一致，以服務契約為準。', true)}

${H(N.camp, 'The camp', '營隊')}
${P(`One camp of ${home.PRICING.camp.name.en}, ${home.PRICING.camp.when.en}, for campers aged ${c.cohort.ageMin} to ${c.cohort.ageMax}. ${home.PRICING.camp.bus.en}`, `營隊為${home.PRICING.camp.name.zh}（${home.PRICING.camp.when.zh}），招收 ${c.cohort.ageMin} 至 ${c.cohort.ageMax} 歲營員。${home.PRICING.camp.bus.zh}`)}

${H(N.insurance, 'Insurance', '保險')}
${OL(home.SAFETY.insurance.map((x) => [`${x.title.en} (${x.by.en}): ${x.body.en}`, `${x.title.zh}（${x.by.zh}）：${x.body.zh}`]))}
${PL(home.SAFETY.under15)}
${ROW(F('Sums insured, for each of the four (the camp fills this in)', '各項保險金額（由營隊填寫）', 12))}

${H(N.fee, 'Fee and payment', '費用與付款')}
${ROW(F('Camp fee, per camper', '營隊費用（每位營員）', 7), F(home.COUPONS.label.en, home.COUPONS.label.zh, 5))}
<p class="hint">${B(fee ? `Published fee: ${fee}.` : 'The fee is published with the camp dates.', feeZh ? `公告費用：${feeZh}。` : '費用將與營隊日期一併公布。')} ${B(`Coupon packs: ${c.snackShop.couponPacks.map(twd).join(', ')}.`, `點心券面額：${c.snackShop.couponPacks.map(twd).join('、')}。`)}</p>
${H3(S('home.included').en, S('home.included').zh)}${UL(home.PRICING.included)}
${H3(S('home.excluded').en, S('home.excluded').zh)}${UL(home.PRICING.excluded)}
${PL(home.PRICING.noExtra)}
${P(`${home.COUPONS.label.en}: ${home.COUPONS.hint.en}`, `${home.COUPONS.label.zh}：${home.COUPONS.hint.zh}`)}
${P('[To decide: how snack coupons are paid for, and what happens to coupons that are not used: ________]', '〔待決定：點心券之付款方式，以及未使用部分之處理：________〕', true)}
${P('Payment: a deposit of NT$ ________ within ____ days of registration, and the balance by ____________. The service contract is given to you to read before any payment.', '付款方式：報名後 ____ 日內繳交訂金 NT$ ________，餘款於 ____________ 前繳清。服務契約將於收費前交付審閱。', true)}

${H(N.refund, 'Cancellation and refunds', '解約與退費')}
${PL(R.intro)}
<table class="grid tiers"><tr><th>${B(S('home.refundWhen').en, S('home.refundWhen').zh)}</th><th>${B('Refunded', '退還')}</th><th>${B('Deducted', '扣除')}</th></tr>${R.tiers.map((t) => `<tr><td>${B(t.label.en, t.label.zh)}</td><td class="num">${t.refund}%</td><td class="num">${100 - t.refund}%</td></tr>`).join('')}</table>
${P('To cancel, tell us in writing by LINE or email. The day we receive your message decides which line of the table applies.', '解約請以書面（LINE 或電子郵件）通知，並以我們收到通知之日，適用上表對應的退費比例。', true)}
${OL([
  [R.reverse.en, R.reverse.zh],
  [`${R.reasons.lowEnrollment.en}: ${home.PRICING.guarantee.en}`, `${R.reasons.lowEnrollment.zh}：${home.PRICING.guarantee.zh}`],
  [`${R.reasons.forceMajeure.en}: ${R.forceMajeure.en}`, `${R.reasons.forceMajeure.zh}：${R.forceMajeure.zh}`],
])}
${P('In item 1, “the same percentages” are those in the “Deducted” column, for the day our notice reaches you. They are paid in addition to a full refund of what you have paid. [For the lawyer to confirm against the standard contract.]', '第 1 點所稱「同比例」，指上表「扣除」欄之比例，按我方通知到達之日計算；除全額退還已繳費用外另行賠償。〔請律師依定型化契約確認〕', true)}
${P('If your camper cannot come, or has to leave early, because of illness or injury, please tell us at once and send us the doctor’s note. [To decide: what the family then receives, for example ____% of the fee, or the costs we have not yet paid out, under Article ___ of the service contract.]', '營員因疾病或受傷無法參加或須提前離營時，請立即通知我們並提供醫師診斷證明。〔待決定：家長可獲得之處理方式，例如退還費用之 ____%，或退還尚未支出之費用，依服務契約第 ___ 條辦理。〕', true)}
${P('If a camper leaves after camp has started, for any other reason: [to decide: what is returned, for example the costs that are saved because the camper has left, under Article ___ of the service contract. For the lawyer to confirm against the standard contract.]', '營員於營隊開始後因其他原因離營時：〔待決定：退還之範圍，例如因營員離營而節省或無須支出之費用，依服務契約第 ___ 條辦理。請律師依定型化契約確認。〕', true)}
${P('If camp has to end early because of a typhoon, an earthquake or a government order, we tell you by phone and by message, and we keep caring for your camper until they are collected by you or by a person you have named, or travel home on the return charter bus. The fee for the part of camp not held is settled under Article ___ of the service contract.', '營隊如因颱風、地震或政府命令須提前結束，我們會以電話及訊息通知您，並持續照顧營員，直到由您、您指定的人或回程專車接回為止；未進行部分之費用依服務契約第 ___ 條辦理。', true)}

${H(N.health, 'Health and emergency care', '健康與緊急醫療')}
${P(`${nurse.title.en}. ${nurse.body.en}`, `${nurse.title.zh}。${nurse.body.zh}`)}
${OL([
  ['Please fill in the Camper Health Form completely and truthfully, and tell us before check-in if anything changes.', '請完整、據實填寫「營員健康調查表」；報到前若有任何變動，請主動告知。'],
  ['Hand every medicine to the nurse at check-in: prescription and over-the-counter medicine, Chinese medicine, vitamins and supplements, medicated creams and drops, each in its original bag or packaging and with your camper’s name on it. Campers do not keep medicine in their camper van, except what the nurse has agreed your camper should carry or keep close: for example a reliever inhaler, an adrenaline auto-injector, insulin with testing supplies and fast-acting sugar, or a daily skin cream. A phone or other device that is needed for medical reasons (for example a glucose monitor) may stay with your camper; please tell the nurse at check-in.', '所有藥品請於報到時交給護理師，包含處方藥、成藥、中藥、維他命與保健食品、藥膏與眼藥水等，並保留原藥袋或原包裝、標示營員姓名。營員不得自行將藥品放在露營車內；經護理師同意由營員隨身攜帶或放在身邊者除外，例如氣喘急救（緩解型）吸入劑、腎上腺素自動注射筆、胰島素與血糖檢測用品及補充糖分的食品，或每日使用的皮膚藥膏。因醫療需要使用的手機或其他裝置（例如血糖監測器）可由營員自行保管，請於報到時告知護理師。'],
  [`Please keep your camper at home, and call us, if they have had ${stayHome.en}. [The nurse to confirm these periods.] What happens to the fee is set out in section ${N.refund}.`, `${stayHome.zh}者，請讓孩子在家休息並與我們聯繫。〔上述期間請護理師確認〕費用之處理方式見第 ${N.refund} 條。`],
  ['During camp, at least one legal guardian, or the backup contact named on the health form, must be reachable by phone at all times and able to come for your camper if they are too unwell to stay.', '營期間，至少須有一位法定代理人或健康調查表所列的緊急聯絡人可隨時以電話聯繫，並能在孩子身體不適無法繼續參加時前來接回。'],
], true)}
${P('If your camper is hurt or unwell, the nurse looks after them at once.', '營員受傷或身體不適時，護理師會立即處理。', true)}
${OL([
  [`An emergency. If the nurse, or the senior member of the camp team present, judges that your camper needs a hospital without delay, we call 119 or take your camper straight to the nearest accredited hospital, such as ${hospital.en}. We phone you at the same time: the legal guardians first, then the backup contact. We do not wait to reach you before going. A member of the camp team stays with your camper, with the health form and the NHI card, until you or the backup contact arrive.`, `緊急情況：經護理師或現場最高負責人判斷須立即就醫時，我們會立刻撥打 119，或直接將營員送往鄰近合格醫療院所（如${hospital.zh}），並同時以電話聯繫您：先聯繫法定代理人，再聯繫緊急聯絡人。送醫不會等到聯繫上您才進行。營隊人員會攜帶健康調查表與健保卡全程陪同，直到您或緊急聯絡人到場。`],
  ['At the hospital. As soon as one of you is reached, you decide about treatment. If none of you can be reached for the moment, you agree and authorise the attending physician to give the emergency care that cannot wait, until one of you is reached.', '到院後：一經聯繫上其中一位，即由您決定治療方式。若一時無法聯繫上任何一位，您同意並授權主治醫師先施行不能延誤的緊急醫療處置，直到聯繫上其中一位為止。'],
  ['Not an emergency (for example a sprain that needs checking, or a fever that does not settle). The nurse phones you first, and we decide together whether camp staff take your camper to a doctor or you come for your camper.', '非緊急情況（例如扭傷需進一步檢查、發燒未退）：護理師會先以電話與您聯繫，再共同決定由營隊陪同就診，或由您前來接回。'],
  ['You agree and authorise the backup contact named on the health form to make these decisions, and to collect your camper, when we cannot reach you.', '您同意並授權健康調查表所列的緊急聯絡人，在我們聯繫不上您時代為作上述決定，並接回營員。'],
], true, 'a')}
${P(`Medical costs that come from a camper’s own illness, or from an accident that the organizers are not responsible for, are paid by the family, as listed under “${S('home.excluded').en}”. If your camper needs a clinic or a hospital during camp: [to decide: camp staff pay first and the family repays against the receipts]. Costs that come from an accident can be claimed under the camp’s accident insurance (section ${N.insurance}, item 4), and we help you with the claim.`, `因個人疾病或非可歸責於主辦單位之意外所生的醫療費用，如「${S('home.excluded').zh}」所列，由家長負擔。營期間如需就醫：〔待決定：由營隊人員先行代墊，事後檢附收據向家長請款〕。因意外所生之醫療費用，可依營隊投保之意外保險（第 ${N.insurance} 條第 4 項）申請理賠，我們會協助辦理。`, true)}

${H(N.risk, 'Outdoor risk disclosure', '戶外風險說明')}
${P('Camp life is active and out of doors: kayaking on the lake in life jackets, the campfire, team games and challenges, the eco-tram and, in summer, the pool with a certified lifeguard on duty. Counselors supervise every activity and show campers how to take part safely. Even so, outdoor play carries some risk: bumps, scrapes, sprains, insect bites and, rarely, a more serious injury. By signing, you confirm that you understand this, that you have talked it through with your camper, and that your camper will follow the counselors’ safety instructions.', '營隊生活以戶外活動為主：穿著救生衣的湖上獨木舟、營火、團隊遊戲與挑戰、生態導覽遊園車，以及夏季由合格救生員值勤的戲水池。每項活動皆有隊輔在場看顧，並先說明安全的參與方式。儘管如此，戶外活動仍有一定風險，例如碰撞、擦傷、扭傷、蚊蟲叮咬，極少數情況下也可能發生較嚴重的傷害。您簽名即表示已了解上述風險、已向孩子說明，並同意孩子會遵守隊輔的安全指示。', true)}
${PL(home.SAFETY.duty)}

${H(N.conduct, 'How campers treat each other', '營員行為約定')}
${P('We ask every camper to treat other campers and the camp team with respect. The following have no place at camp:', '我們期待每位營員都能尊重其他營員與營隊團隊。以下行為在營隊中不被允許：', true)}
${OL([
  ['Teasing, unkind nicknames, threats, discriminatory remarks, bullying, or leaving someone out on purpose.', '嘲笑、取不雅綽號、恐嚇、歧視性言語、霸凌，或故意排擠他人。'],
  ['Hitting, pushing or any other violence.', '毆打、推擠或任何暴力行為。'],
  ['Foul language, or talk that is not suitable for children.', '說髒話，或談論不適合兒童的話題。'],
  ['Tobacco, vapes, alcohol, drugs, lighters, knives or anything else that is dangerous.', '攜帶或使用菸品、電子煙、酒類、毒品、打火機、刀械或其他危險物品。'],
  ['Leaving the group, an activity or the camp grounds without a counselor.', '未經隊輔陪同，擅自離開小隊、活動或營區。'],
  ['Going into another camper van without a counselor’s permission.', '未經隊輔同意進入其他露營車。'],
  ['Damaging camp or venue property on purpose.', '故意破壞營隊或場地設施。'],
  [`Keeping a phone or other device instead of handing it in (a device needed for medical reasons is the exception: section ${N.health}).`, `未依規定交出手機或其他電子裝置（因醫療需要使用者除外，見第 ${N.health} 條）。`],
  ['Physical contact that the other person does not want or that is too close, dating or sexual behaviour, or any behaviour that makes another camper feel unsafe.', '違反對方意願或過於親密的肢體接觸、交往或與性有關的行為，或任何讓其他營員感到不安全的行為。'],
], true)}
${P(`What happens: a counselor first talks with the camper. If it goes on, or if it is serious, the camp director calls you. Where behaviour puts anyone’s safety at risk, or continues after that call, the camp director may ask you to take your camper home. You would then need to come for your camper promptly, at your own cost, and the fee is settled as set out in section ${N.refund} for a camper who leaves after camp has started.`, `處理方式：隊輔會先與營員溝通；若情況持續或情節重大，營隊主任將致電家長。如行為危及任何人的安全，或經聯繫後仍未改善，營隊主任得請家長將營員接回。屆時請家長儘速自費前來接回，費用依本須知第 ${N.refund} 條關於營隊開始後離營之方式辦理。`, true)}

${H(N.things, 'Phones, food and valuables', '手機、食物與貴重物品')}
${PL(faq(/phone/i))}
${P(`${foodRule.title.en}: ${foodRule.body.en}`, `${foodRule.title.zh}：${foodRule.body.zh}`)}
${P('Please do not send food, sweets or drinks from home. [To decide: what happens to food found at check-in, for example kept safely and handed back on Saturday.]', '請勿讓孩子從家中攜帶食物、糖果或飲料。〔待決定：報到時發現之食物如何處理，例如代為保管並於週六交還〕', true)}
${P('Please leave jewellery, larger sums of money and other valuables at home.', '請勿讓孩子攜帶首飾、大額現金或其他貴重物品。', true)}

${H(N.vans, 'Camper vans', '露營車')}
${PL(home.STAY.cards[0].body)}
${UL(vanRules.map((r) => ({ en: `${r.title.en}. ${r.body.en}`, zh: `${r.title.zh}。${r.body.zh}` })))}

${H(N.nights, 'Nights and looking after each other', '夜間照顧與彼此尊重')}
${P('For the camp to complete and confirm: At night, counselors sleep ________ and a duty counselor is ________ until ________. A camper who needs help at night ________. Campers stay in their own camper van after lights out. Van checks are made by two counselors together, at least one of them of the same gender as the campers; they knock and wait for an answer before going in and, except in an emergency, do not go into a bathroom that is in use. Counselors do not exchange private contact details with campers. A camper who feels unsafe with anyone at camp, another camper or an adult, can tell any counselor, the nurse or the camp director; parents can call ________.', '內容請營隊確認後填寫：夜間隊輔住宿於 ________，並有值夜隊輔於 ________ 值勤至 ________。營員夜間需要協助時，________。熄燈後營員須留在自己的露營車內。露營車檢查由兩位隊輔共同進行，其中至少一位與該車營員同性別；進入前先敲門並等候回應，除緊急情況外，不進入使用中的浴室。隊輔不與營員交換私人聯絡方式。營員在營隊中若對任何人（其他營員或成年人）感到不安全，可告訴任何一位隊輔、護理師或營隊主任；家長可撥打 ________。', true)}

${H(N.visits, 'Visits and keeping in touch', '探視與聯繫')}
${PL(faq(/visit/i))}
${P('A legal guardian or backup contact who comes to collect a camper is admitted at any hour; please phone the camp first. During camp: [to decide: whether campers may phone home; whether and when the camp tells families how their camper is doing; when the photo album is updated]. If your camper is very homesick, we phone you and decide together how to help.', '法定代理人或緊急聯絡人前來接回營員時，不受上述時間限制，請先撥打營隊電話聯繫。營期間：〔待決定：營員可否打電話回家；營隊是否及何時以電話或訊息向家長說明近況；相簿更新時間〕。孩子若非常想家，我們會與您電話聯繫，共同決定如何協助。', true)}

${H(N.wear, 'What to wear', '服裝')}
${P('Please pack clothes for active outdoor play, following the packing list on the website. Clothing with violent, drug, alcohol or offensive pictures or words stays at home.', '請依官網行李清單，準備適合戶外活動的服裝。請勿攜帶印有暴力、毒品、酒類或不雅圖文的衣物。', true)}

${H(N.photos, 'Photos and video', '照片與影片')}
${P(`Photos and videos are taken during camp for the private digital photo album shared with the families of this camp. They are used in future camp promotion only if you tick item 5 on the signature page. Leaving it unticked never affects enrollment.`, '營期間將拍攝照片與影片，放在專屬數位相簿，供本梯次家長閱覽。只有在您於簽名頁勾選第 5 項時，才會用於未來的營隊宣傳；不勾選完全不影響報名資格。', true)}
${CHECKS(C('Please keep my camper out of the shared album as well', '請勿將我的孩子放入共享相簿'))}
<p class="hint">${NEW} ${B('[To decide: whether the camp can offer this, for families who need it.]', '〔待決定：營隊能否提供此選項，供有需要的家庭選擇〕')}</p>

${H(N.data, 'Your personal data', '個人資料')}
${PL(S('register.healthNote'))}
${needToKnow()}
${P('Notice under Article 8 of the Personal Data Protection Act.', '依個人資料保護法第 8 條告知。', true)}
${UL([
  { en: `Collected by: ${c.operator.legalName ?? '________'} (organizer, legal name), ${c.travelAgency.legalName ?? '________'} (partner travel agency) and ${c.venue.name.en} (venue), each for the part of the camp it carries out. Contact for data requests: ________ (address, email, phone).`, zh: `蒐集單位：${c.operator.legalName ?? '________'}（主辦單位公司全名）、${c.travelAgency.legalName ?? '________'}（合作旅行社）與${c.venue.name.zh}（場地單位），各就其辦理之事項蒐集。個資聯絡窗口：________（地址、電子信箱、電話）。` },
  { en: 'Purposes: registration and the service contract; caring for your camper; nursing and safe meals; insurance and claims; contacting you in an emergency and handing your camper over safely; the private album for the families of this camp; and camp promotion only if you tick item 5.', zh: '蒐集目的：報名與服務契約之履行；營員照顧；護理與飲食安全；保險與理賠；緊急聯絡與安全交接；供本梯次家長閱覽之專屬相簿；以及僅於您勾選第 5 項時之營隊宣傳。' },
  { en: 'Data: name, date of birth, gender, national ID or passport number (for insurance and hospital registration), contact details and address, the names and phone numbers of the contacts and collectors you list, the health, allergy, diet, medication and vaccination details on the health form, NHI or other medical insurance details, and photos and videos taken during camp.', zh: '資料類別：姓名、出生年月日、性別、身分證字號或護照號碼（供投保與就醫掛號）、聯絡方式與地址、您所列聯絡人與接送人之姓名與電話、健康調查表所載之健康、過敏、飲食、用藥與預防接種資料、健保或其他醫療保險資料，以及營期間拍攝之照片與影片。' },
  { en: 'Period, place, recipients and manner of use: health details are securely destroyed within 30 days after camp; [to decide: records connected with an injury, an illness or an insurance claim are kept until ________]. Registration and contract records are kept for ________. The data is used in Taiwan by the three collectors above, the camp nurse, the insurers and, in an emergency, the hospital. [To decide: whether any of it is kept on servers outside Taiwan, for example online forms or the photo album.]', zh: '利用期間、地區、對象及方式：健康資料於營隊結束後 30 日內安全銷毀；〔待決定：與受傷、疾病或保險理賠有關之紀錄，保存至 ________ 為止〕。報名與契約紀錄保存 ________。上述資料由前列三個蒐集單位、營隊護理師、承保保險公司，以及緊急情況下之醫療院所，於臺灣地區利用。〔待決定：是否有資料儲存於境外伺服器，例如線上表單或相簿〕' },
  { en: 'Your rights: you may ask to see your data, to have a copy, to have it added to or corrected, to have its collection, processing or use stopped, and to have it deleted, by writing to the contact above.', zh: '您的權利：得以書面向上述聯絡窗口請求查詢或閱覽、製給複製本、補充或更正、停止蒐集、處理或利用，以及刪除。' },
  { en: 'If you choose not to give this information, we cannot care for your camper safely and so cannot accept the registration.', zh: '若您選擇不提供上述資料，我們將無法確保孩子的安全照顧，因此無法受理報名。' },
], true)}

<div class="keep">
${H(N.sign, 'Agreement', '同意與簽名')}
${P(S('register.consentIntro').en, S('register.consentIntro').zh)}
${P(`In item 1, “Articles 1–5” are Articles 1–5 of the service contract, which I received on ____ / ____ / ________. In item 3, the “outdoor risk disclosure” is section ${N.risk} of this notice, and the emergency care is described in section ${N.health}.`, `第 1 項所稱「契約第一條至第五條」，係指服務契約之條文；本人已於 ________ 年 ____ 月 ____ 日收到服務契約。第 3 項所稱「戶外風險說明」，即本須知第 ${N.risk} 條；緊急醫療之處理方式見第 ${N.health} 條。`, true)}
<table class="grid consents">${home.CONSENTS.map((x, i) => `<tr><td class="yn"><b></b></td><td><strong>${i + 1}. ${B(x.title.en, x.title.zh)}</strong><br>${esc(x.body.en)}<br><span class="z" lang="zh-Hant">${esc(x.body.zh)}</span></td></tr>`).join('')}</table>
${P('I have read this notice with my camper. I agree to it and to the items I have ticked above; item 5 applies only if I have ticked it.', '本人已與孩子一同閱讀本須知，同意其內容及本人於上方勾選之事項；第 5 項僅於本人勾選時適用。', true)}
${SIGN('Legal guardian (print name)', '法定代理人（正楷姓名）')}
${ROW(F('Relationship to camper', '與營員關係', 5), F('Mobile', '聯絡手機', 4), F('LINE ID or email', 'LINE ID 或電子信箱', 3))}
${SIGN('Second guardian, if any (print name)', '第二位法定代理人（如有，正楷姓名）')}
${P('Camper: I have read “How campers treat each other” and the camper van rules with my parent, and I will follow them.', '營員：我已和家長一起讀過「營員行為約定」與露營車生活公約，並願意遵守。', true)}
${SIGN('Camper', '營員')}
${ROW(F('Organizer (legal name)', '主辦單位（公司全名）', 5, c.operator.legalName), F('Partner travel agency', '合作旅行社', 4, c.travelAgency.legalName), F('Received by, date', '收件人員、日期', 3))}
</div>
</section>`

// ── Form 2: camper health form ──────────────────────────────────────────────────────────
const health = () => `
<section>
<h1>${B('Camper Health Form', '營員健康調查表')}</h1>
<p class="sub">${B(c.brand.en, c.brand.zh)} · ${B('Confidential', '機密文件')}</p>
${CONTACT()}
${PL(S('register.healthNote'))}
${needToKnow()}
${P('Please fill in one form for each camper and return it to ________________ by ____________ (at least ____ days before camp). On check-in day, bring the signed paper copy in a clear zip bag together with any medicine.', '請為每位營員填寫一份，並於 ____________ 前（至少營隊開始前 ____ 日）交回至 ________________。報到當日請攜帶已簽名的紙本，連同所有藥品一起放入透明夾鏈袋。', true)}

${H('A', 'Camper', '營員資料')}
${ROW(F('Full name (Chinese)', '中文姓名', 4), F('Name used at camp (English)', '營隊使用的英文名字', 4), F('Date of birth (yyyy / mm / dd)', '出生年月日（西元）', 4))}
${ROW(F('Gender', '性別', 2), F('Age', '年齡', 2), F('Height (cm)', '身高', 2), F('Weight (kg)', '體重', 2), F('Blood type (if known)', '血型（如已知）', 4))}
${ROW(F('National ID or passport no.', '身分證字號或護照號碼', 6), F('Camp dates', '營隊日期', 6))}
${CHECKS(C('My camper will bring their National Health Insurance card', '孩子將攜帶健保卡'), C('No NHI card: details of other medical insurance attached', '無健保卡：已附其他醫療保險資料'))}

${H('B', 'Guardians and backup contact', '法定代理人與緊急聯絡人')}
${ROW(F('Legal guardian (print name)', '法定代理人（正楷姓名）', 4), F('Relationship', '關係', 2), F('Mobile', '手機', 3), F('LINE ID or email', 'LINE ID 或電子信箱', 3))}
${ROW(F('Second guardian (print name)', '第二位法定代理人（正楷姓名）', 4), F('Relationship', '關係', 2), F('Mobile', '手機', 3), F('LINE ID or email', 'LINE ID 或電子信箱', 3))}
${ROW(F('Backup contact, in Taiwan during camp', '緊急聯絡人（營期間人在臺灣）', 4), F('Relationship', '關係', 2), F('Mobile', '手機', 3), F('Second phone', '其他電話', 3))}
${P('The backup contact is an adult, other than the guardians above, whom we can reach during camp when we cannot reach you, who can decide about your camper’s care, and who can come for your camper if needed.', '緊急聯絡人須為上列法定代理人以外的成年人，在我們聯繫不上您時可於營期間聯絡得上，能就孩子的照顧作決定，並能在必要時前來接回孩子。', true)}
${ROW(F('Family doctor or clinic (optional)', '家庭醫師或診所（選填）', 7), F('Phone', '電話', 5))}

<div class="pb"></div>
${H('C', 'Health history', '健康狀況')}
${YNT([
  ['Asthma or breathing difficulty', '氣喘或呼吸困難'],
  ['Allergies (give details in section D)', '過敏（請於 D 欄詳填）'],
  ['A severe allergic reaction (anaphylaxis) at any time, or ever given adrenaline', '曾發生嚴重過敏反應（過敏性休克），或曾使用腎上腺素'],
  ['G6PD deficiency (favism)', '蠶豆症（G6PD 缺乏症）'],
  ['Epilepsy, seizures or fainting', '癲癇、抽搐或昏厥'],
  ['Diabetes', '糖尿病'],
  ['Heart condition', '心臟疾病'],
  ['Bleeding or clotting disorder, frequent nosebleeds', '凝血異常或經常流鼻血'],
  ['Migraine or frequent headaches', '偏頭痛或經常頭痛'],
  ['Heat exhaustion or heat stroke in the past', '曾中暑或熱衰竭'],
  ['Ear tubes, a perforated eardrum, or another reason not to put the head under water', '耳朵置管、耳膜破損，或其他頭部不宜入水的狀況'],
  ['Attention, learning or developmental needs (e.g. ADHD, autism spectrum)', '注意力、學習或發展上的特殊需求（如注意力不足過動症、自閉症類群）'],
  ['Anxiety, low mood or other emotional needs', '焦慮、情緒低落或其他情緒上的需求'],
  ['Sleepwalking, night terrors or bed-wetting', '夢遊、夜驚或尿床'],
  ['Motion sickness', '暈車'],
  ['Surgery, fracture or serious injury in the past 6 months', '近 6 個月內曾手術、骨折或重大受傷'],
  ['Hospital stay in the past 12 months', '近 12 個月內曾住院'],
  ['Glasses, contact lenses, hearing aid or dental brace', '配戴眼鏡、隱形眼鏡、助聽器或牙齒矯正器'],
  ['Skin condition (e.g. eczema)', '皮膚狀況（如異位性皮膚炎）'],
  ['Menstruation: would like support or supplies at camp', '生理期：希望營隊提供協助或用品'],
  ['Regular medicine that will NOT come to camp (name and reason)', '平日固定服用、但營期間不攜帶的藥品（藥名與原因）'],
  ['Any activity a doctor has advised against', '醫師曾建議避免的活動'],
  ['Anything else we should know', '其他需要我們知道的狀況'],
])}

${H('D', 'Allergies', '過敏')}
<p class="hint">${B('Food, medicine, latex (the camper van mattresses are latex), bee or wasp stings and other insect bites, plasters, other.', '食物、藥物、乳膠（露營車床墊為乳膠材質）、蜂螫等昆蟲叮螫、膠布、其他。')}</p>
${TABLE([['Allergic to', '過敏原'], ['What happens', '反應症狀'], ['What to do', '處理方式']], 4, 'tall', [34, 33, 33])}
${CHECKS(C('Carries an adrenaline auto-injector', '隨身攜帶腎上腺素自動注射筆'), C('Carries a reliever inhaler', '隨身攜帶氣喘急救（緩解型）吸入劑'), C('Doctor’s action plan attached', '已附醫師處置計畫'))}

${H('E', 'Food', '飲食')}
${CHECKS(C('No restrictions', '無限制'), C(S('register.dietNoBeef').en, S('register.dietNoBeef').zh), C(S('register.dietNoPork').en, S('register.dietNoPork').zh), C(S('register.dietVeg').en, S('register.dietVeg').zh), C('Allergy-safe tray', '過敏專屬餐盤'))}
${LINES('Other medical or religious restriction', '其他因健康或宗教的飲食限制', 2)}
${PL(home.STAY.diet)}
${P('This section is for medical and religious needs. Foods your camper simply does not like do not need to be listed.', '本欄請填寫因健康或宗教而需要的飲食調整；單純不喜歡的食物不需列出。', true)}

${H('F', 'Medicine brought to camp', '攜帶至營隊的藥品')}
${TABLE([['Medicine and strength', '藥品名稱與劑量規格'], ['What it is for', '用途'], ['Dose', '每次劑量'], ['When (times of day)', '服用時間'], ['From – until', '起訖日期'], ['Notes (with food, side effects)', '備註（飯前飯後、副作用）']], 5, 'mid', [24, 16, 12, 16, 12, 20])}
${P('The nurse keeps and gives all medicine, except a reliever inhaler, an adrenaline auto-injector or anything else the nurse has agreed your camper should carry. Please send only what is needed for the camp, in its original bag or packaging, labelled with your camper’s name.', '所有藥品由護理師保管並給藥；氣喘急救（緩解型）吸入劑、腎上腺素自動注射筆或其他經護理師同意由營員隨身攜帶者除外。請僅攜帶營期間所需的份量，保留原藥袋或原包裝並標示營員姓名。', true)}

${H('G', 'Common remedies', '常備藥品')}
${P('First aid is always given. When it is needed, the nurse may also give the medicines you tick below, following the directions on the pack. [For the camp nurse and the lawyer to confirm before this section is used.]', '護理師一律會進行必要的急救與傷口處理。您勾選同意的下列藥品，護理師得於必要時依包裝指示給予。〔本欄須經營隊護理師與律師確認後方可使用〕', true)}
${CHECKS(C('Fever and pain relief (paracetamol / acetaminophen)', '退燒止痛藥（乙醯胺酚）'), C('Antihistamine for allergy', '抗組織胺（過敏用）'), C('Insect-bite cream', '蚊蟲叮咬藥膏'), C('Motion-sickness tablet for the bus', '搭車用暈車藥'), C('Oral rehydration drink', '口服電解質補充液'))}
${ROW(F('Do not give my camper', '請勿給我的孩子使用', 12))}

${H('H', 'Vaccination', '預防接種')}
${CHECKS(C('Routine childhood vaccinations are up to date', '已按時完成常規預防接種'), C('Not up to date', '未完成'))}
${ROW(F('If not up to date: vaccines not yet received', '若未完成：尚未接種的疫苗', 7), F('Most recent tetanus vaccination (year)', '最近一次破傷風疫苗接種年份', 5))}

${H('I', 'Water, nights and activities', '水性、夜間與活動')}
<p class="q">${B(S('register.water').en, S('register.water').zh)}</p>
${CHECKS(C(S('register.waterNon').en, S('register.waterNon').zh), C(S('register.waterBeginner').en, S('register.waterBeginner').zh), C(S('register.waterComfortable').en, S('register.waterComfortable').zh))}
<p class="q">${B('Is this your camper’s first time away from home overnight?', '這是孩子第一次離家過夜嗎？')}</p>
${CHECKS(C('Yes', '是'), C('No', '否'))}
${LINES('What helps your camper settle at night?', '什麼方式能幫助孩子在夜間安心入睡？', 2)}
${LINES('Anything else the counselors should know', '其他希望隊輔知道的事', 2)}
${LINES('Is there anything on this form that you want only the nurse and the camp director to know?', '本表是否有您希望僅限護理師與營隊主任知悉的內容？', 1, true)}
${LINES('A camper your child would like to share a camper van with (both families must ask; same gender, similar age)', '希望同車的營員（須雙方家長皆提出，且為同性別、年齡相近）', 1, true)}

<div class="keep">
${H('J', 'Declaration', '聲明與簽名')}
${OL([
  ['The information on this form is complete and true, and I will tell the camp before check-in if anything changes.', '本表所填資料完整且屬實；報到前若有任何變動，本人將主動告知營隊。'],
  ['The nurse may keep and give the medicine listed in section F, and any I add on the check-in day form, as I have described, and may give the medicines I have ticked in section G.', '本人同意由護理師保管 F 欄所列及本人於報到日確認單增列之藥品，並依本人說明給藥；亦得給予本人於 G 欄勾選同意的常備藥品。'],
  [`If my camper has had ${stayHome.en}, I will keep them at home and call the camp.`, `孩子若於${stayHome.zh}，本人會讓孩子在家休息並通知營隊。`],
  ['I authorise the backup contact named in section B to decide about my camper’s care, and to collect my camper, when the camp cannot reach me.', '本人授權 B 欄所列緊急聯絡人，於營隊聯繫不上本人時，代為決定孩子的照顧事宜並接回孩子。'],
  [`I have read section ${N.health} of the Camp Notice (health and emergency care) and I authorise the emergency care it describes.`, `本人已閱讀營隊須知第 ${N.health} 條（健康與緊急醫療），並授權依該條所述進行緊急醫療處置。`],
], true)}
${P(`${consent('pdpa').title.en}: ${consent('pdpa').body.en}`, `${consent('pdpa').title.zh}：${consent('pdpa').body.zh}`)}
${SIGN('Legal guardian (print name)', '法定代理人（正楷姓名）')}
${BOX(B('For the camp team', '營隊團隊填寫'), ROW(F('Received by', '收件人員', 3), F('Date', '日期', 2), F('Reviewed by (nurse)', '審閱護理師', 3), F('Follow-up with family', '與家長確認事項', 4)))}
</div>
</section>`

// ── Form 3: check-in day ────────────────────────────────────────────────────────────────
const checkin = () => `
<section>
<h1>${B('Check-in Day Form', '報到日確認單')}</h1>
<p class="sub">${B(c.brand.en, c.brand.zh)} · ${B(home.PRICING.camp.bus.en, home.PRICING.camp.bus.zh)}</p>
${CONTACT()}
${P('Please fill in and sign this form at home on the morning of check-in. At the gate, hand it to the check-in desk, where a counselor takes every camper’s temperature and collects devices. Campers who bring medicine, or who have a “yes” in section 1, then see the nurse. Please allow time for this.', '請於報到當日早上在家填妥並簽名。抵達大門後請將本單交給報到櫃檯，由隊輔為每位營員量測體溫並收取電子裝置；有攜帶藥品或第 1 節任一項回答「是」的營員，再由護理師接續確認。請預留時間。', true)}
${ROW(F('Camper', '營員姓名', 5), F('Camp dates', '營隊日期', 4), F('Camper van / team (staff)', '露營車／小隊（工作人員填寫）', 3))}
${ROW(F('Adult bringing the camper today, if not the guardian who signs', '今日送孩子報到的成年人（若非簽名之法定代理人）', 5), F('Relationship', '與營員關係', 2), F('Mobile', '手機', 2), F('Guardian’s phone today, 14:00–15:00', '法定代理人今日 14:00–15:00 電話', 3))}

${H(1, 'Health check today', '今日健康確認')}
<table class="grid yntable short"><tr><th>${B('Has your camper had', '孩子是否有')}</th><th>${B('No', '否')}</th><th>${B('Yes', '是')}</th><th>${B('Details', '說明')}</th></tr>
${GRP('In the past 24 hours', '過去 24 小時內')}
${[
  ['A fever (____ °C or above), or medicine to bring a fever down', '發燒（____ °C 以上），或曾服用退燒藥'],
  ['A cough, sore throat or runny nose that is getting worse', '持續加重的咳嗽、喉嚨痛或流鼻水'],
  ['A new rash, red or sticky eyes, or head lice', '新出現的皮疹、眼睛紅或分泌物增多，或頭蝨'],
].map((r) => YN(...r)).join('')}
${GRP('In the past 48 hours', '過去 48 小時內')}
${YN('Vomiting or diarrhoea', '嘔吐或腹瀉')}
${GRP('In the past 7 days (the nurse to confirm the number of days)', '過去 7 日內（日數由護理師確認）')}
${[
  ['A doctor’s diagnosis of an illness that can spread (e.g. influenza, enterovirus, chickenpox, COVID-19, norovirus)', '經醫師診斷罹患傳染性疾病（如流感、腸病毒、水痘、新冠肺炎、諾羅病毒）'],
  ['Close contact with someone who has one of these illnesses', '曾與上述疾病患者密切接觸'],
  ['A new injury, or anything that changes the health form', '新的受傷，或任何與健康調查表不同之處'],
].map((r) => YN(...r)).join('')}</table>
${ROW(F('Medicine taken today, and at what time', '今日已服用的藥品與時間', 12))}
${P(`If any answer is “yes”, the nurse talks with you before your camper joins the group. A camper whose temperature at check-in is ____ °C or above (taken twice, ____ minutes apart) goes home to rest; what happens to the fee is set out in section ${N.refund} of the Camp Notice.`, `若有任一項回答「是」，護理師會先與您討論，再安排孩子入隊。報到時體溫達 ____ °C 以上（間隔 ____ 分鐘測量兩次）者，須請孩子返家休息；費用之處理方式見營隊須知第 ${N.refund} 條。`, true)}

${H(2, 'Medicine handed to the nurse', '交付護理師的藥品')}
<p class="hint">${B('Please bring the health form and all medicine together in one clear zip bag.', '請將健康調查表與所有藥品一起放入一個透明夾鏈袋。')}</p>
${CHECKS(C('None', '無'), C('As listed on the health form', '同健康調查表所列'), C('Changes or additions (list below)', '有變動或新增（請列於下方）'))}
${TABLE([['Medicine and strength', '藥品名稱與劑量規格'], ['Amount handed over', '交付數量'], ['Dose and times', '劑量與時間'], ['Returned on Saturday (amount)', '週六交還數量']], 3, 'tall', [34, 18, 28, 20])}
${ROW(F('Received by (nurse)', '收藥人（護理師）', 6))}

${H(3, 'Phones and devices', '手機與電子裝置')}
${PL(faq(/phone/i))}
${TABLE([['Device', '裝置'], ['Colour, case or other mark', '顏色、保護殼或其他特徵'], ['Returned (staff initials)', '已歸還（工作人員簽名）']], 2)}

${H(4, 'Snack coupons', '點心券')}
${ROW(F('Coupons chosen at registration and handed to your camper today: NT$', '報名時選購並於今日交付營員之點心券：NT$', 8), F('Staff initials', '工作人員簽名', 4))}
<p class="hint">${B(home.COUPONS.hint.en, home.COUPONS.hint.zh)}</p>

${H(5, 'Going home on Saturday', '週六返家')}
${PL(busHome)}
${P('Expected arrival: about ________. Please list every adult who may meet your camper there, yourself included. Our staff on the bus carry this list, check photo ID, and hand your camper, with any phone, NHI card and leftover medicine, only to a person on it. To change the list, the guardian who signs below messages the camp office before the bus leaves camp. If nobody on the list is at the stop, your camper waits with our staff and we phone you. [To decide: where, and for how long.] Staff phone on the bus on Saturday: ________________.', '預計約 ________ 抵達。請列出所有可至下車地點接孩子的成年人，包含您本人。隨車工作人員將攜帶本名單並核對附照片之身分證件；孩子及其手機、健保卡與剩餘藥品，僅交給名單上的人。如需更改名單，請由下方簽名的法定代理人於遊覽車離開營地前以訊息通知營隊辦公室。若下車地點沒有名單上的人，孩子會由工作人員陪同等候，我們並會以電話與您聯繫。〔待決定：等候地點與時間〕週六隨車工作人員手機：________________。', true)}
${TABLE([['Name', '姓名'], ['Relationship', '與營員關係'], ['Mobile', '手機'], ['ID checked on Saturday (staff)', '週六已核對證件（工作人員）']], 4)}
<p class="q">${NEW} ${B('Is there anyone who must not collect or contact your camper (for example under a custody or protection order)?', '是否有不得接走或接觸孩子的人（例如依監護或保護令之裁定）？')}</p>
${CHECKS(C('No', '無'), C('Yes (name and details): ________________________________', '有（姓名與說明）：________________________________'))}
${CHECKS(C('I will collect my camper from the camp myself instead, by arrangement with the camp office. Time: ________ Collected by: ________________', '本人已與營隊辦公室約定，將自行至營地接回孩子。時間：________ 接回人：________________'))}
<p class="hint">${NEW} ${B('[To decide: whether collecting at the camp is offered.]', '〔待決定：是否開放至營地自行接回〕')}</p>

<div class="keep">
${H(6, 'Signature', '簽名')}
${P('What I have written above is true today. The nurse may keep and give the medicine listed in section 2 as I have described.', '以上所填內容於今日屬實。本人同意由護理師保管第 2 節所列藥品，並依本人說明給藥。', true)}
${SIGN('Legal guardian (print name)', '法定代理人（正楷姓名）')}
${BOX(B('For the camp team', '營隊團隊填寫'), ROW(F('Temperature at check-in (°C)', '報到體溫', 3), F('Time', '時間', 2), F('Taken by', '量測人員', 3), F('Notes', '備註', 4)) + ROW(F('Health form received', '已收健康調查表', 3), F('Notice signed', '已簽署營隊須知', 3), F('NHI card seen', '已確認健保卡', 3), F('Nurse (if seen)', '護理師（如有確認）', 3)))}
</div>
</section>`

// ── notes for the reviewer ──────────────────────────────────────────────────────────────
const notes = () => `
<section class="notes">
<h1>Camp forms: notes for the reviewer<small lang="zh-Hant">營隊表單：審閱說明</small></h1>
<p>These three forms are drafts for ${esc(c.brand.en)}. They were written after reading the documents that Camp Taiwan (Camp Taiwan Co., Ltd., Wanli, New Taipei) publishes for its own overnight camps, so that ours cover the same ground. The wording is our own. Nothing has been copied from Camp Taiwan.</p>
<h2>What Camp Taiwan publishes</h2>
<ul>
<li><b>A “Camp Taiwan Notice”</b>: one six-page PDF in Chinese and English, linked from its summer camp page, FAQ and parent handbook. It covers fees and the refund schedule, emergency medical permission, a risk statement with a release, photo use, dismissal, a behaviour code and a dress code. Parents accept it with a tick box when they register online.</li>
<li><b>A parent handbook and FAQ</b> on its website: rules on food, phones, visits and calls; how medicine is handed to the nurse; a health check at the bus on the first day; who can collect a child.</li>
<li><b>A “Medical (Healthy Camper) form”</b>: filled in during online registration and handed in on the first day in a zip bag with any medicine. The form itself sits behind the registration login and <b>could not be read</b>. Our health form is therefore built from what the handbook says the form does, and from the usual content of a camp health form.</li>
</ul>
<h2>How our forms follow theirs</h2>
<table class="grid"><tr><th>Camp Taiwan</th><th>Ours</th></tr>
<tr><td>Fees, payment deadline, refund schedule</td><td>Notice §${N.fee}–${N.refund}, using the fee, inclusions and refund tiers already on our website</td></tr>
<tr><td>Emergency medical permission; a guardian must be reachable in Taiwan</td><td>Notice §${N.health}; Health form B and J</td></tr>
<tr><td>Risk statement</td><td>Notice §${N.risk}</td></tr>
<tr><td>Behaviour code and dismissal</td><td>Notice §${N.conduct}</td></tr>
<tr><td>No phones or food; valuables; dress code</td><td>Notice §${N.things} and §${N.wear}</td></tr>
<tr><td>Where counselors sleep; help at night</td><td>Notice §${N.nights} (blanks for the camp to complete)</td></tr>
<tr><td>Photo use</td><td>Notice §${N.photos} and consent 5</td></tr>
<tr><td>Health form, medicine handed to the nurse</td><td>Camper Health Form</td></tr>
<tr><td>Health check and temperature on the first day; pick-up ticket</td><td>Check-in Day Form</td></tr>
</table>
<h2>Where ours deliberately differ</h2>
<ol>
<li><b>No release of liability.</b> Camp Taiwan’s notice asks parents to “release and agree to indemnify and hold harmless” the camp. Ours does not. Our website already promises families that we never ask them to sign away our responsibility, and a blanket release in a standard consumer contract may not be enforceable in Taiwan in any case. Ours asks parents to acknowledge the risks and authorise emergency care. <b>Please confirm this is the right approach.</b></li>
<li><b>Refunds.</b> Camp Taiwan uses its own schedule (100% at 30 days down to nothing on the day, with a registration fee that is never returned). Ours keeps the tiers on our website (95 / 90 / 80 / 70 / 50 / 0%), which follow the Standardized Domestic Group Travel Contract because the camp is sold through a licensed travel agency.</li>
<li><b>Dismissal, illness and leaving early.</b> Camp Taiwan gives no refund to a camper sent home. Ours leaves blanks in Notice §${N.refund} for what a family receives when a camper is ill, is sent home or leaves early. <b>A decision is needed here.</b></li>
<li><b>Photos.</b> Camp Taiwan reserves the right to use camper photos for marketing. Ours keeps this optional: the box is unticked unless the parent chooses it.</li>
<li><b>Belongings.</b> Camp Taiwan states it is not responsible for lost or damaged belongings. Ours simply asks families to leave valuables at home.</li>
<li><b>Visits and devices.</b> Camp Taiwan allows no visits, calls or devices, and gives no refund to a camper sent home for breaking those rules. Ours uses the wording already on our website and adds no such penalty.</li>
</ol>
<h2>Marked ◆: new wording that is not yet camp policy</h2>
<p>Anything marked ${NEW} is proposed here for the first time and does not appear on the website. Paragraphs without the mark repeat what the website already says. The form fields, questions and tick boxes are new as well. Square brackets “[To decide: …]” and blanks are points the camp has not yet settled. The ones that most need a decision:</p>
<ul>
<li><b>Contact details.</b> The camp’s phone, LINE, email and 24-hour number are blank at the top of each form; the organizer’s and travel agency’s legal names are blank on the signature page and in the data notice.</li>
<li><b>Payment.</b> Deposit, balance date, and how snack coupons are paid for and unused ones handled: Notice §${N.fee}.</li>
<li><b>Refunds outside the table.</b> A camper who is ill before camp, is sent home with a fever at check-in, falls ill or is sent home during camp, or camp ending early: Notice §${N.refund}. Also how a cancellation is given and which day counts.</li>
<li><b>Staying home when unwell.</b> The 24-hour, 48-hour and 7-day periods and the fever threshold are for the nurse to set: Notice §${N.health}, Health form J, Check-in form §1.</li>
<li><b>Emergency care.</b> The steps in Notice §${N.health} (go first and phone at the same time; who decides; the backup contact’s authority) and who pays first for a clinic visit.</li>
<li><b>Common remedies.</b> Whether the nurse may give them with a parent’s tick alone: Health form G. This needs the nurse’s and the lawyer’s view.</li>
<li><b>Who sees health details.</b> The website says only four roles see them. In practice a camper’s own counselors, the lifeguard and the kayak coach need some of it. The ◆ sentence says so; the website sentence should be changed to match.</li>
<li><b>Nights.</b> Where counselors sleep, the duty counselor, van checks and how a camper asks for help: Notice §${N.nights}.</li>
<li><b>Behaviour.</b> The code and the steps before a camper is sent home: Notice §${N.conduct}.</li>
<li><b>Keeping in touch.</b> Whether campers may phone home and how the camp updates families: Notice §${N.visits}. Food from home: Notice §${N.things}.</li>
<li><b>Photos.</b> Whether a family can keep its child out of the shared album: Notice §${N.photos}.</li>
<li><b>Personal data.</b> The notice under Article 8 of the Personal Data Protection Act, how long records are kept, and whether any data is held outside Taiwan: Notice §${N.data}. Also whether a form with health details may be returned by LINE.</li>
<li><b>Saturday.</b> Where and when the return bus arrives (the website names the bus zone near National Taichung Theater; the time is not set), who may collect a camper, the ID check, what happens if nobody comes, and whether collecting at the camp is offered: Check-in form §5.</li>
<li><b>Campers from overseas.</b> The forms assume a guardian or backup contact in Taiwan and an NHI card or other medical insurance. Whether overseas campers are accepted, and on what terms, is not yet decided.</li>
</ul>
</section>`

// ── pages ───────────────────────────────────────────────────────────────────────────────
const commit = (() => {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim()
  } catch {
    return ''
  }
})()
const today = new Date().toISOString().slice(0, 10)
const font = (pkg) => `file://${path.join(root, 'node_modules/@fontsource-variable', pkg, 'index.css')}`
const CSS = `
  @page { size: A4; margin: 14mm 13mm 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 9pt/1.45 'Inter Variable', 'Noto Sans TC Variable', sans-serif; color: #1c2a24; }
  h1 { font-size: 17pt; line-height: 1.2; margin: 0; color: #1b4332; }
  h1 .z, h1 small { font-size: 13pt; font-weight: 600; color: #46584f; margin-left: 6pt; }
  h1 small { display: block; margin: 2pt 0 0; }
  .sub { margin: 2pt 0 8pt; font-size: 8.6pt; color: #6a5a40; }
  h2 { font-size: 10.6pt; margin: 11pt 0 3pt; padding-bottom: 2pt; border-bottom: 1.1px solid #1b4332; color: #1b4332; break-after: avoid; }
  h2 .z { font-weight: 600; margin-left: 4pt; }
  h3 { font-size: 9pt; margin: 6pt 0 1pt; color: #46584f; break-after: avoid; }
  h4 { margin: 0 0 3pt; font-size: 8.4pt; color: #7a5a22; }
  .z { color: #2c3d35; }
  label .z, th .z, .c .z, .q .z, .sub .z, .hint .z { margin-left: 2pt; }
  .para { margin: 3pt 0; break-inside: avoid; } .para p { margin: 0; } .para p.z { margin-top: 1pt; }
  ol, ul { margin: 3pt 0; padding-left: 15pt; } li { margin: 2.5pt 0; break-inside: avoid; }
  .new { color: #b45f06; font-size: 7.5pt; }
  .hint { font-size: 8pt; color: #6a5a40; margin: 1pt 0 3pt; } .q { margin: 3pt 0 1pt; font-weight: 600; }
  .row { display: grid; grid-template-columns: repeat(12, 1fr); gap: 3pt 10pt; margin: 5pt 0; break-inside: avoid; }
  .f { display: flex; flex-direction: column; justify-content: flex-end; } .f label { font-size: 7.6pt; color: #46584f; line-height: 1.25; } .f i { display: block; height: 15pt; border-bottom: .8px solid #55665e; font-style: normal; font-size: 8.6pt; line-height: 15pt; }
  .lines { margin: 5pt 0; break-inside: avoid; } .lines label { font-size: 7.6pt; color: #46584f; line-height: 1.25; } .lines i { display: block; height: 17pt; border-bottom: .8px solid #55665e; }
  .checks { display: flex; flex-wrap: wrap; gap: 3pt 14pt; margin: 4pt 0; break-inside: avoid; }
  .c { display: inline-flex; align-items: baseline; gap: 4pt; } .c b, .yn b { display: inline-block; width: 8.5pt; height: 8.5pt; border: .9px solid #33443c; border-radius: 1.5pt; flex: none; transform: translateY(1pt); }
  table.grid { width: 100%; border-collapse: collapse; margin: 4pt 0; }
  table.grid th { text-align: left; font-size: 7.8pt; color: #46584f; background: #f2f5f3; padding: 3pt 5pt; border: .6px solid #b9c5be; font-weight: 600; }
  table.grid td { padding: 3pt 5pt; border: .6px solid #b9c5be; vertical-align: top; }
  table.grid tr { break-inside: avoid; }
  td.blank { height: 19pt; } table.tall td.blank { height: 40pt; } table.mid td.blank { height: 34pt; }
  tr.grp th { background: #e6ece8; color: #1b4332; }
  table.tall, table.mid, table.plain, table.tiers, table.consents { break-inside: avoid; }
  .pb { break-before: page; }
  td.yn, th.yn { width: 26pt; text-align: center; } .yntable th:nth-child(2), .yntable th:nth-child(3) { width: 30pt; text-align: center; } .yntable td:first-child { width: 46%; } .yntable td { height: 24pt; } .yntable.short td { height: 19pt; }
  table.tiers td.num { text-align: right; width: 70pt; font-variant-numeric: tabular-nums; }
  table.consents td.yn { width: 22pt; }
  .box { border: 1px dashed #9aa79f; border-radius: 5pt; padding: 6pt 9pt; margin: 8pt 0 0; background: #fafbfa; break-inside: avoid; }
  .keep { break-inside: avoid; }
  section + section { break-before: page; }
  .notes { font-size: 9.4pt; } .notes h2 { border: 0; font-size: 11.5pt; margin-top: 13pt; } .notes li { margin: 4pt 0; }
  .draft { position: fixed; top: -9mm; right: 0; font-size: 7.5pt; color: #b45f06; letter-spacing: .08em; }
`
const doc = (body, title) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title><link rel="stylesheet" href="${font('inter')}"><link rel="stylesheet" href="${font('noto-sans-tc')}"><style>${CSS}</style></head><body>${body}</body></html>`

// wording rules of the site apply to the forms too (the consents copied from the site are checked there)
const all = notes() + notice() + health() + checkin()
const banned = /hold harmless|indemnif|non-?refundable|概不負責|概不退還|for reference only|僅供參考|\bteachers?\b|老師|\bclass(es)?\b|\blessons?\b|課程|sanyi|三義|wooden cabin|小木屋/i
const own = all.replace(/<section class="notes">[\s\S]*?<\/section>/, '').replace(/<[^>]+>/g, ' ') // the text only, without the markup
if (banned.test(own)) throw new Error(`Banned wording in a form: “${own.match(banned)[0]}”`)

mkdirSync(out, { recursive: true })
const tmp = path.join(out, '.tmp.html')
const browser = await chromium.launch()
const tab = await browser.newPage()
async function pdf(name, html, title) {
  writeFileSync(tmp, doc(html, title))
  await tab.goto('file://' + tmp)
  await tab.evaluate(() => document.fonts.ready)
  await tab.pdf({
    path: path.join(out, name + '.pdf'),
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-size:7px;width:100%;padding:0 13mm;color:#b45f06;text-align:right;letter-spacing:.08em">DRAFT FOR LEGAL REVIEW</div>`,
    footerTemplate: `<div style="font-size:7px;width:100%;padding:0 13mm;color:#777;display:flex;justify-content:space-between"><span>${esc(title)} · draft ${today}${commit ? ' · ' + commit : ''}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
  })
  console.log('wrote', path.relative(root, path.join(out, name + '.pdf')))
}
await pdf('0-notes-for-the-reviewer', notes(), 'Genesis × Bambi camp forms: notes')
await pdf('1-camp-notice-and-agreement', notice(), 'Camp Notice and Agreement')
await pdf('2-camper-health-form', health(), 'Camper Health Form')
await pdf('3-check-in-day-form', checkin(), 'Check-in Day Form')
await pdf('camp-forms-all', all, 'Genesis × Bambi camp forms')
await browser.close()
rmSync(tmp, { force: true })
