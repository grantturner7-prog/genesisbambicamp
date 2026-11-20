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
const OL = (items, mark = false) => `<ol>${items.map(([en, zh]) => `<li>${mark ? NEW + ' ' : ''}${esc(en)}<br><span class="z" lang="zh-Hant">${esc(zh)}</span></li>`).join('')}</ol>`
const UL = (items) => `<ul>${items.map((v) => `<li>${esc(v.en)}<br><span class="z" lang="zh-Hant">${esc(v.zh)}</span></li>`).join('')}</ul>`
/** A labelled blank. `w`: share of the row (1–12). */
const F = (en, zh, w = 6) => `<div class="f" style="grid-column: span ${w}"><label>${B(en, zh)}</label><i></i></div>`
const ROW = (...f) => `<div class="row">${f.join('')}</div>`
const C = (en, zh) => `<span class="c"><b></b>${B(en, zh)}</span>`
const CHECKS = (...c) => `<div class="checks">${c.join('')}</div>`
/** A question answered No / Yes, with room for details. */
const YN = (en, zh) => `<tr><td>${B(en, zh)}</td><td class="yn"><b></b></td><td class="yn"><b></b></td><td></td></tr>`
const YNT = (rows) => `<table class="grid yntable"><tr><th>${B('In the past or now', '過去或目前是否有')}</th><th>${B('No', '否')}</th><th>${B('Yes', '是')}</th><th>${B('If yes: details, and what helps', '若有，請說明狀況與處理方式')}</th></tr>${rows.map((r) => YN(...r)).join('')}</table>`
const TABLE = (heads, n, cls = '') => `<table class="grid ${cls}"><tr>${heads.map(([en, zh]) => `<th>${B(en, zh)}</th>`).join('')}</tr>${Array.from({ length: n }, () => `<tr>${heads.map(() => '<td class="blank"></td>').join('')}</tr>`).join('')}</table>`
const SIGN = (en, zh) => ROW(F(en, zh, 5), F('Signature', '簽名', 4), F('Date', '日期', 3))
const BOX = (title, inner) => `<div class="box"><h4>${title}</h4>${inner}</div>`

const season = Object.entries(c.sessions).filter(([, o]) => o)
const hospital = c.venue.hospital
const fee = season.length ? season.map(([, o]) => (o.fee != null ? `${twd(o.fee)} (${o.dates.en})` : null)).filter(Boolean).join('; ') : ''
const feeZh = season.length ? season.map(([, o]) => (o.fee != null ? `${twd(o.fee)}（${o.dates.zh}）` : null)).filter(Boolean).join('；') : ''
const R = home.REFUND
const consent = (k) => home.CONSENTS.find((x) => x.key === k)
const vanRules = AREAS.find((a) => a.id === 'vans').safety.rules
const faq = (re) => home.FAQ.find((x) => re.test(x.q.en)).a

// ── Form 1: camp notice and agreement ───────────────────────────────────────────────────
const notice = () => `
<section>
<h1>${B('Camp Notice and Agreement', '營隊須知與同意書')}</h1>
<p class="sub">${B(c.brand.en, c.brand.zh)} · ${B(home.PRICING.camp.name.en, home.PRICING.camp.name.zh)} · ${B(home.PRICING.camp.when.en, home.PRICING.camp.when.zh)}</p>
${ROW(F('Camper', '營員姓名', 5), F('Camp dates', '營隊日期', 4), F('Date of birth', '出生年月日', 3))}
${P('This notice explains how the camp runs and what we ask of families. Please read it together with your camper and sign the last page. It is part of your registration, together with the service contract. If the two differ, the service contract applies.', '本須知說明營隊的運作方式，以及需要家長與營員配合的事項。請與孩子一起閱讀，並於最後一頁簽名。本須知與服務契約同為報名文件；兩者如有不一致，以服務契約為準。', true)}

${H(1, 'The camp', '營隊')}
${P(`One camp of ${home.PRICING.camp.name.en}, ${home.PRICING.camp.when.en}, for campers aged ${c.cohort.ageMin} to ${c.cohort.ageMax}. ${home.PRICING.camp.bus.en}`, `營隊為${home.PRICING.camp.name.zh}（${home.PRICING.camp.when.zh}），招收 ${c.cohort.ageMin} 至 ${c.cohort.ageMax} 歲營員。${home.PRICING.camp.bus.zh}`)}

${H(2, 'Fee and payment', '費用與付款')}
${ROW(F('Camp fee, per camper', '營隊費用（每位營員）', 7), F('Snack coupons (optional)', '點心券（自由選購）', 5))}
<p class="hint">${B(fee ? `Published fee: ${fee}.` : 'The fee is published with the camp dates.', feeZh ? `公告費用：${feeZh}。` : '費用將與營隊日期一併公布。')} ${B(`Coupon packs: ${c.snackShop.couponPacks.map(twd).join(', ')}.`, `點心券面額：${c.snackShop.couponPacks.map(twd).join('、')}。`)}</p>
${H3(S('home.included').en, S('home.included').zh)}${UL(home.PRICING.included)}
${H3(S('home.excluded').en, S('home.excluded').zh)}${UL(home.PRICING.excluded)}
${PL(home.PRICING.noExtra)}
${P('Payment: a deposit of NT$ ________ within ____ days of registration, and the balance by ____________. The service contract is given to you to read before any payment.', '付款方式：報名後 ____ 日內繳交訂金 NT$ ________，餘款於 ____________ 前繳清。服務契約將於收費前交付審閱。', true)}

${H(3, 'Cancellation and refunds', '解約與退費')}
${PL(R.intro)}
<table class="grid tiers"><tr><th>${B(S('home.refundWhen').en, S('home.refundWhen').zh)}</th><th>${B('Refunded', '退還')}</th><th>${B('Deducted', '扣除')}</th></tr>${R.tiers.map((t) => `<tr><td>${B(t.label.en, t.label.zh)}</td><td class="num">${t.refund}%</td><td class="num">${100 - t.refund}%</td></tr>`).join('')}</table>
${OL([
  [`${R.reasons.lowEnrollment.en}: ${R.lowEnrollment.en}`, `${R.reasons.lowEnrollment.zh}：${R.lowEnrollment.zh}`],
  [`${R.reasons.forceMajeure.en}: ${R.forceMajeure.en}`, `${R.reasons.forceMajeure.zh}：${R.forceMajeure.zh}`],
  [R.reverse.en, R.reverse.zh],
  [home.PRICING.guarantee.en, home.PRICING.guarantee.zh],
])}
${P('To cancel, tell us in writing by LINE or email. The day we receive your message decides which line of the table applies.', '解約請以書面（LINE 或電子郵件）通知，並以我們收到通知之日，適用上表對應的退費比例。', true)}

${H(4, 'Health and emergency care', '健康與緊急醫療')}
${OL([
  ['A Registered Nurse is on site 24 hours a day, every day of camp.', '營期間每日 24 小時皆有專任護理師駐點。'],
  ['Please fill in the Camper Health Form completely and truthfully, and tell us before camp if anything changes.', '請完整、據實填寫「營員健康調查表」；營隊開始前若有任何變動，請主動告知。'],
])}
${OL([
  ['Hand every medicine to the nurse at check-in, in its original packaging and with your camper’s name on it. Campers do not keep medicine in their camper van. The only exceptions are a reliever inhaler or an adrenaline auto-injector that the nurse has agreed your camper should carry.', '所有藥品請於報到時連同原包裝交給護理師，並標示營員姓名。營員不得自行將藥品放在露營車內；僅經護理師同意隨身攜帶的氣喘吸入劑或腎上腺素自動注射筆除外。'],
  ['Please keep your camper at home, and call us, if in the 24 hours before camp they have had a fever, vomiting or diarrhoea, or any illness that could spread to others.', '營隊開始前 24 小時內，若孩子有發燒、嘔吐、腹瀉或其他可能傳染的症狀，請讓孩子在家休息並與我們聯繫。'],
  ['During camp, at least one guardian, or an adult you have named on the health form, must be reachable by phone at all times and able to come for your camper if they are too unwell to stay.', '營期間，至少須有一位法定代理人或您於健康調查表指定的成年人可隨時以電話聯繫，並能在孩子身體不適無法繼續參加時前來接回。'],
], true)}
${P(`If your camper is hurt or unwell, the nurse gives first aid at once and we contact you straight away: the legal guardian first, then the backup contact. If the situation is urgent and none of you can be reached, you authorise our staff to take your camper to the nearest accredited hospital, such as ${hospital.en}, and the attending physician to give the care that is urgently needed until you can be reached.`, `營員受傷或身體不適時，護理師會立即處理，並第一時間聯繫家長：先聯繫法定代理人，必要時再聯繫緊急聯絡人。若情況危急且一時無法聯繫上任何一位，您同意並授權工作人員將營員護送至鄰近合格醫療院所（如${hospital.zh}），並由主治醫師施行必要之緊急醫療處置，直到聯繫上您為止。`)}
${P(`As listed under “${S('home.excluded').en}”: ${home.PRICING.excluded.find((x) => /medical/i.test(x.en)).en}.`, `如「${S('home.excluded').zh}」所列：${home.PRICING.excluded.find((x) => /medical/i.test(x.en)).zh}。`)}

${H(5, 'Outdoor activities and their risks', '戶外活動與風險告知')}
${P('Camp life is active and out of doors: kayaking on the lake in life jackets, the campfire, team games and challenges, the eco-tram and, in summer, the pool with a certified lifeguard on duty. Counselors supervise every activity and show campers how to take part safely. Even so, outdoor play carries some risk: bumps, scrapes, sprains, insect bites and, rarely, a more serious injury. By signing, you confirm that you understand this, that you have talked it through with your camper, and that your camper will follow the counselors’ safety instructions.', '營隊生活以戶外活動為主：穿著救生衣的湖上獨木舟、營火、團隊遊戲與挑戰、生態導覽遊園車，以及夏季由合格救生員值勤的戲水池。每項活動皆有隊輔在場看顧，並先說明安全的參與方式。儘管如此，戶外活動仍有一定風險，例如碰撞、擦傷、扭傷、蚊蟲叮咬，極少數情況下也可能發生較嚴重的傷害。您簽名即表示已了解上述風險、已向孩子說明，並同意孩子會遵守隊輔的安全指示。', true)}
${PL(home.SAFETY.duty)}

${H(6, 'How campers treat each other', '營員行為約定')}
${P('We ask every camper to treat other campers and the camp team with respect. The following have no place at camp:', '我們期待每位營員都能尊重其他營員與營隊團隊。以下行為在營隊中不被允許：', true)}
${OL([
  ['Teasing, name-calling, threats, discriminatory remarks, bullying, or leaving someone out on purpose.', '嘲笑、取綽號、恐嚇、歧視言語、霸凌，或故意排擠他人。'],
  ['Hitting, pushing or any other violence.', '毆打、推擠或任何暴力行為。'],
  ['Foul language, or talk that is not suitable for children.', '說髒話，或談論不適合兒童的話題。'],
  ['Tobacco, vapes, alcohol, drugs, lighters, knives or anything else that is dangerous.', '攜帶或使用菸品、電子煙、酒類、毒品、打火機、刀械或其他危險物品。'],
  ['Leaving the group, an activity or the camp grounds without a counselor.', '未經隊輔陪同，擅自離開小隊、活動或營區。'],
  ['Going into another camper van without a counselor’s permission.', '未經隊輔同意進入其他露營車。'],
  ['Damaging camp or venue property on purpose.', '故意破壞營隊或場地設施。'],
  ['Keeping a phone or other device instead of handing it in.', '未依規定交出手機或其他電子裝置。'],
  ['Unwanted touching, or any behaviour that makes another camper feel unsafe.', '不當的肢體接觸，或任何讓其他營員感到不安全的行為。'],
], true)}
${P('What happens: a counselor first talks with the camper. If it goes on, or if it is serious, the camp director calls you. Where behaviour puts anyone’s safety at risk, or continues after that call, the camp director may ask you to take your camper home. You would then need to come for your camper promptly, at your own cost, and the fee for the days not attended is settled under the refund article of the service contract.', '處理方式：隊輔會先與營員溝通；若情況持續或情節重大，營隊主任將致電家長。如行為危及任何人的安全，或經聯繫後仍未改善，營隊主任得請家長將營員接回。屆時請家長儘速自費前來接回，未參加日數之費用，依服務契約之退費條款辦理。', true)}

${H(7, 'Phones, food and valuables', '手機、食物與貴重物品')}
${PL(faq(/phone/i))}
${P(`${vanRules.find((r) => /food/i.test(r.title.en)).title.en}: ${vanRules.find((r) => /food/i.test(r.title.en)).body.en} ${home.COUPONS.hint.en}`, `${vanRules.find((r) => /food/i.test(r.title.en)).title.zh}：${vanRules.find((r) => /food/i.test(r.title.en)).body.zh}${home.COUPONS.hint.zh}`)}
${P('Please leave jewellery, larger sums of money and other valuables at home.', '請勿讓孩子攜帶首飾、大額現金或其他貴重物品。', true)}

${H(8, 'Camper vans', '露營車')}
${PL(home.STAY.cards[0].body)}
${UL(vanRules.map((r) => ({ en: `${r.title.en}. ${r.body.en}`, zh: `${r.title.zh}。${r.body.zh}` })))}

${H(9, 'Visits and keeping in touch', '探視與聯繫')}
${PL(faq(/visit/i))}

${H(10, 'What to wear', '服裝')}
${P('Please pack clothes for active outdoor play and closed-toe shoes for activities; the packing list is on the website. Clothing with violent, drug, alcohol or offensive pictures or words should stay at home.', '請準備適合戶外活動的服裝，活動時須穿著包覆腳趾的鞋子；行李清單請見官網。請勿攜帶印有暴力、毒品、酒類或不雅圖文的衣物。', true)}

${H(11, 'Photos and video', '照片與影片')}
${P(`${consent('media').body.en} You record your choice on the signature page.`, `${consent('media').body.zh}請於簽名頁勾選您的決定。`)}

${H(12, 'Your personal data', '個人資料')}
${PL(S('register.healthNote'))}
${P('Notice under the Personal Data Protection Act. Collected by: the organizers named on the signature page, with the partner travel agency and the venue for the parts each of them carries out. Purposes: registration and the service contract, caring for your camper, nursing and safe meals, insurance, and contacting you in an emergency. Data: names, date of birth, gender, contact details and address, and the health, allergy, diet and medication details on the health form. Kept: health details until 30 days after camp, then securely destroyed; registration and contract records for as long as the law requires. Your rights: you may ask to see your data, to have a copy, to have it corrected, to have its collection, processing or use stopped, and to have it deleted, by writing to the camp office. If you choose not to give this information we cannot accept the registration, because we could not care for your camper safely.', '依個人資料保護法告知：蒐集單位為簽名頁所列主辦單位，並由合作旅行社與場地單位就其各自辦理之事項共同蒐集。蒐集目的：報名與服務契約之履行、營員照顧、護理與飲食安全、保險，以及緊急聯絡。資料類別：姓名、出生年月日、性別、聯絡方式與地址，以及健康調查表所載之健康、過敏、飲食與用藥資料。保存期間：健康資料保存至營隊結束後 30 日，屆期安全銷毀；報名與契約紀錄依法令規定之期間保存。您的權利：得以書面向營隊辦公室請求查詢或閱覽、製給複製本、補充或更正、停止蒐集、處理或利用，以及刪除。若您選擇不提供上述資料，我們將無法確保孩子的安全照顧，因此無法受理報名。', true)}

<div class="keep">
${H(13, 'Agreement', '同意與簽名')}
${P(S('register.consentIntro').en, S('register.consentIntro').zh)}
<table class="grid consents">${home.CONSENTS.map((x, i) => `<tr><td class="yn"><b></b></td><td><strong>${i + 1}. ${B(x.title.en, x.title.zh)}</strong><br>${esc(x.body.en)}<br><span class="z" lang="zh-Hant">${esc(x.body.zh)}</span></td></tr>`).join('')}</table>
${P('I have read this notice with my camper and I agree to it.', '本人已與孩子一同閱讀本須知，並同意其內容。', true)}
${SIGN('Legal guardian', '法定代理人')}
${ROW(F('Relationship to camper', '與營員關係', 5), F('Mobile', '聯絡手機', 4), F('LINE or email', 'LINE 或電子信箱', 3))}
${SIGN('Second guardian (if any)', '第二位法定代理人（如有）')}
${P('Camper: I have read the section “How campers treat each other” with my parent and I will follow it.', '營員：我已和家長一起讀過「營員行為約定」，並願意遵守。', true)}
${SIGN('Camper', '營員')}
${ROW(F('Organizer (legal name)', '主辦單位（公司全名）', 7), F('Received by', '收件人', 3), F('Date', '日期', 2))}
</div>
</section>`

// ── Form 2: camper health form ──────────────────────────────────────────────────────────
const health = () => `
<section>
<h1>${B('Camper Health Form', '營員健康調查表')}</h1>
<p class="sub">${B(c.brand.en, c.brand.zh)} · ${B('Confidential: for the camp nurse', '機密文件：供營隊護理師使用')}</p>
${PL(S('register.healthNote'))}
${P('Please fill this in for each camper and return it before camp. Bring a signed copy on check-in day, in a clear zip bag together with any medicine.', '請為每位營員填寫一份，並於營隊開始前交回。報到當日請攜帶已簽名的紙本，連同所有藥品一起放入透明夾鏈袋。', true)}

${H('A', 'Camper', '營員資料')}
${ROW(F('Full name (Chinese)', '中文姓名', 4), F('Name used at camp (English)', '營隊使用的英文名字', 4), F('Date of birth', '出生年月日', 4))}
${ROW(F('Gender', '性別', 2), F('Age', '年齡', 2), F('Height (cm)', '身高', 2), F('Weight (kg)', '體重', 2), F('Blood type (if known)', '血型（如知道）', 4))}
${ROW(F('National ID or passport no.', '身分證字號或護照號碼', 6), F('Camp dates', '營隊日期', 6))}
${CHECKS(C('My camper will bring their National Health Insurance card', '孩子將攜帶健保卡'), C('No NHI card (overseas camper): travel medical insurance details attached', '無健保卡（海外營員）：已附旅遊醫療保險資料'))}

${H('B', 'Guardians and emergency contact', '法定代理人與緊急聯絡人')}
${ROW(F('Legal guardian', '法定代理人', 4), F('Relationship', '關係', 2), F('Mobile', '手機', 3), F('LINE or email', 'LINE 或電子信箱', 3))}
${ROW(F('Second guardian', '第二位法定代理人', 4), F('Relationship', '關係', 2), F('Mobile', '手機', 3), F('LINE or email', 'LINE 或電子信箱', 3))}
${ROW(F('Backup contact in Taiwan', '在臺緊急聯絡人', 4), F('Relationship', '關係', 2), F('Mobile', '手機', 3), F('Second phone', '其他電話', 3))}
${P('The backup contact is an adult who can be reached during camp if we cannot reach you, who can decide about your camper’s care, and who can come for your camper if needed.', '緊急聯絡人須為成年人，在我們聯繫不上您時可於營期間聯絡得上，能就孩子的照顧作決定，並能在必要時前來接回孩子。', true)}
${ROW(F('Family doctor or clinic (optional)', '家庭醫師或診所（選填）', 7), F('Phone', '電話', 5))}

${H('C', 'Health history', '健康狀況')}
${YNT([
  ['Asthma or breathing difficulty', '氣喘或呼吸困難'],
  ['Allergies (give details in section D)', '過敏（請於 D 欄詳填）'],
  ['Epilepsy, seizures or fainting', '癲癇、抽搐或昏厥'],
  ['Diabetes', '糖尿病'],
  ['Heart condition', '心臟疾病'],
  ['Bleeding or clotting disorder, frequent nosebleeds', '凝血異常或經常流鼻血'],
  ['Attention, learning or developmental needs (e.g. ADHD, autism spectrum)', '注意力、學習或發展上的特殊需求（如注意力不足過動、自閉症類群）'],
  ['Anxiety, low mood or other emotional needs', '焦慮、情緒低落或其他情緒上的需求'],
  ['Sleepwalking, night terrors or bed-wetting', '夢遊、夜驚或尿床'],
  ['Motion sickness', '暈車'],
  ['Surgery, fracture or serious injury in the past 6 months', '近 6 個月內曾手術、骨折或重大受傷'],
  ['Hospital stay in the past 12 months', '近 12 個月內曾住院'],
  ['Glasses, contact lenses, hearing aid or dental brace', '配戴眼鏡、隱形眼鏡、助聽器或牙齒矯正器'],
  ['Skin condition (e.g. eczema)', '皮膚狀況（如異位性皮膚炎）'],
  ['Menstruation: would like support or supplies at camp', '生理期：希望營隊提供協助或用品'],
  ['Any activity a doctor has advised against', '醫師曾建議避免的活動'],
  ['Anything else we should know', '其他需要我們知道的狀況'],
])}

${H('D', 'Allergies', '過敏')}
${TABLE([['Allergic to (food, medicine, insect stings, plasters, other)', '過敏原（食物、藥物、蚊蟲叮咬、膠布、其他）'], ['What happens', '反應症狀'], ['What to do', '處理方式']], 3, 'tall')}
${CHECKS(C('Carries an adrenaline auto-injector', '隨身攜帶腎上腺素自動注射筆'), C('Carries a reliever inhaler', '隨身攜帶氣喘吸入劑'), C('Doctor’s action plan attached', '已附醫師處置計畫'))}

${H('E', 'Food', '飲食')}
${CHECKS(C('No restrictions', '無限制'), C(S('register.dietNoBeef').en, S('register.dietNoBeef').zh), C(S('register.dietNoPork').en, S('register.dietNoPork').zh), C(S('register.dietVeg').en, S('register.dietVeg').zh), C('Allergy-safe tray', '過敏專屬餐盤'))}
${ROW(F('Other medical or religious restriction', '其他因健康或宗教的飲食限制', 12))}
${PL(home.STAY.diet)}
${P('This section is for medical and religious needs. Foods your camper simply does not like do not need to be listed.', '本欄請填寫因健康或宗教而需要的飲食調整；單純不喜歡的食物不需列出。', true)}

${H('F', 'Medicine brought to camp', '攜帶至營隊的藥品')}
${TABLE([['Medicine', '藥品名稱'], ['What it is for', '用途'], ['Dose', '劑量'], ['When (times of day)', '服用時間'], ['From – until', '起訖日期'], ['Notes (with food, side effects)', '備註（飯前飯後、副作用）']], 4, 'tall')}
${P('The nurse keeps and gives all medicine. Please send only what is needed for the camp, in the original packaging, labelled with your camper’s name.', '所有藥品由護理師保管並協助給藥。請僅攜帶營期間所需的份量，保留原包裝並標示營員姓名。', true)}

${H('G', 'Common remedies', '常備用品')}
${P('The nurse may use the items you tick, when needed, following the directions on the pack. (To be confirmed with the camp nurse and the lawyer before use.)', '護理師得於必要時，依包裝指示使用您勾選同意的項目。（本欄內容須經營隊護理師與律師確認後方可使用。）', true)}
${CHECKS(C('Fever and pain relief (paracetamol / acetaminophen)', '退燒止痛藥（乙醯胺酚）'), C('Antihistamine for allergy', '抗組織胺（過敏用）'), C('Antiseptic and plasters', '消毒與敷料'), C('Insect-bite cream', '蚊蟲叮咬藥膏'), C('Motion-sickness tablet for the bus', '搭車用暈車藥'), C('Oral rehydration drink', '口服電解質補充液'), C('Sunscreen', '防曬乳'), C('Mosquito repellent', '防蚊液'))}
${ROW(F('Do not give my camper', '請勿給我的孩子使用', 12))}

${H('H', 'Vaccination', '預防接種')}
${CHECKS(C('Routine childhood vaccinations are up to date', '已按時完成常規預防接種'), C('Not up to date (please explain below)', '未完成（請於下方說明）'))}
${ROW(F('Most recent tetanus vaccination (year)', '最近一次破傷風疫苗接種年份', 6), F('Notes', '說明', 6))}

${H('I', 'Water and activities', '水性與活動')}
<p class="q">${B(S('register.water').en, S('register.water').zh)}</p>
${CHECKS(C(S('register.waterNon').en, S('register.waterNon').zh), C(S('register.waterBeginner').en, S('register.waterBeginner').zh), C(S('register.waterComfortable').en, S('register.waterComfortable').zh))}
${ROW(F('Is this your camper’s first time away from home overnight? Anything that helps them settle?', '這是孩子第一次離家過夜嗎？有什麼方式能幫助孩子適應？', 12))}
${ROW(F('Anything else the counselors should know', '其他希望隊輔知道的事', 12))}

<div class="keep">
${H('J', 'Declaration', '聲明與簽名')}
${OL([
  ['The information on this form is complete and true, and I will tell the camp before check-in if anything changes.', '本表所填資料完整且屬實；報到前若有任何變動，本人將主動告知營隊。'],
  ['The nurse may keep and give the medicine listed in section F as I have described, and may use the remedies I have ticked in section G.', '本人同意由護理師保管 F 欄所列藥品並依本人說明給藥，並得使用本人於 G 欄勾選同意的常備用品。'],
  ['If my camper has a fever, vomiting or diarrhoea, or an illness that could spread, in the 24 hours before camp, I will keep them at home and call the camp.', '營隊開始前 24 小時內，若孩子有發燒、嘔吐、腹瀉或其他可能傳染的症狀，本人會讓孩子在家休息並通知營隊。'],
], true)}
${P(`${consent('risk').title.en}: ${consent('risk').body.en}`, `${consent('risk').title.zh}：${consent('risk').body.zh}`)}
${P(`${consent('pdpa').title.en}: ${consent('pdpa').body.en}`, `${consent('pdpa').title.zh}：${consent('pdpa').body.zh}`)}
${SIGN('Legal guardian', '法定代理人')}
${BOX(B('For the nurse', '護理師填寫'), ROW(F('Reviewed by', '審閱人', 4), F('Date', '日期', 3), F('Follow-up with family', '與家長確認事項', 5)))}
</div>
</section>`

// ── Form 3: check-in day ────────────────────────────────────────────────────────────────
const checkin = () => `
<section>
<h1>${B('Check-in Day Form', '報到日確認單')}</h1>
<p class="sub">${B(c.brand.en, c.brand.zh)} · ${B(home.PRICING.camp.bus.en, home.PRICING.camp.bus.zh)}</p>
${P('Please bring this form, signed, on check-in day and hand it to the nurse with any medicine. It takes two minutes and helps every camper start the camp well.', '請於報到當日攜帶本單並簽名，連同藥品一併交給護理師。填寫只需兩分鐘，能幫助每位營員健康地開始營隊生活。', true)}
${ROW(F('Camper', '營員姓名', 5), F('Camp dates', '營隊日期', 4), F('Camper van / team (staff)', '露營車／小隊（工作人員填寫）', 3))}

${H(1, 'Health check today', '今日健康確認')}
<table class="grid yntable"><tr><th>${B('In the past 24 hours, has your camper had', '過去 24 小時內，孩子是否有')}</th><th>${B('No', '否')}</th><th>${B('Yes', '是')}</th><th>${B('Details', '說明')}</th></tr>
${[
  ['A fever, or medicine to bring a fever down', '發燒，或曾服用退燒藥'],
  ['Vomiting or diarrhoea', '嘔吐或腹瀉'],
  ['A cough, sore throat or runny nose that is getting worse', '持續加重的咳嗽、喉嚨痛或流鼻水'],
  ['A new rash, or head lice', '新出現的皮疹，或頭蝨'],
].map((r) => YN(...r)).join('')}
<tr><th>${B('In the past 7 days', '過去 7 日內')}</th><th></th><th></th><th></th></tr>
${[
  ['Close contact with someone who has an illness that spreads (e.g. influenza, enterovirus, chickenpox, COVID-19)', '曾與傳染性疾病患者密切接觸（如流感、腸病毒、水痘、新冠肺炎）'],
  ['A new injury, or anything that changes the health form', '新的受傷，或任何與健康調查表不同之處'],
].map((r) => YN(...r)).join('')}</table>
${P('If any answer is “yes”, the nurse will talk with you before your camper joins the group. A camper with a fever at check-in goes home to rest; we will discuss the options with you under the service contract.', '若有任一項回答「是」，護理師會先與您討論，再安排孩子入隊。報到時若有發燒，須請孩子返家休息；後續處理方式將依服務契約與您討論。', true)}

${H(2, 'Medicine handed to the nurse', '交付護理師的藥品')}
${CHECKS(C('None', '無'), C('As listed on the health form', '同健康調查表所列'), C('Changes or additions (list below)', '有變動或新增（請列於下方）'))}
${TABLE([['Medicine', '藥品名稱'], ['Amount handed over', '交付數量'], ['Dose and times', '劑量與時間'], ['Returned at departure', '離營時交還數量']], 3, 'tall')}

${H(3, 'Phones and devices', '手機與電子裝置')}
${PL(faq(/phone/i))}
${TABLE([['Device', '裝置'], ['Colour, case or other mark', '顏色、保護殼或其他特徵'], ['Returned (staff initials)', '已歸還（工作人員簽名）']], 2)}

${H(4, 'Snack coupons', '點心券')}
${CHECKS(...c.snackShop.couponPacks.map((n) => C(home.COUPONS.pack(n).en, home.COUPONS.pack(n).zh)), C(home.COUPONS.none.en, home.COUPONS.none.zh))}
<p class="hint">${B(home.COUPONS.hint.en, home.COUPONS.hint.zh)}</p>

${H(5, 'Going home on Saturday', '週六返家')}
${P('Your camper rides the Saturday return charter bus. Please name the adults who may meet your camper off the bus. Staff will ask to see photo ID, and will not hand your camper to anyone who is not listed here.', '孩子將搭乘週六回程遊覽車專車。請填寫可至下車地點接孩子的成年人；工作人員將核對附照片之身分證件，未列於此處者恕無法接走孩子。', true)}
${TABLE([['Name', '姓名'], ['Relationship', '與營員關係'], ['Mobile', '手機'], ['ID checked (staff)', '已核對證件（工作人員）']], 3)}
${CHECKS(C('I will collect my camper from the camp myself instead, by arrangement with the camp office', '本人已與營隊辦公室約定，將自行至營地接回孩子'))}

<div class="keep">
${H(6, 'Signature', '簽名')}
${P('What I have written above is true today.', '以上所填內容於今日屬實。', true)}
${SIGN('Legal guardian', '法定代理人')}
${BOX(B('For the camp team', '營隊團隊填寫'), ROW(F('Temperature at check-in (°C)', '報到體溫', 3), F('Time', '時間', 2), F('Nurse', '護理師', 3), F('Notes', '備註', 4)) + ROW(F('Health form received', '已收健康調查表', 3), F('Notice signed', '已簽署營隊須知', 3), F('NHI card seen', '已確認健保卡', 3), F('Counselor', '隊輔', 3)))}
</div>
</section>`

// ── notes for the reviewer ──────────────────────────────────────────────────────────────
const notes = () => `
<section class="notes">
<h1>Camp forms: notes for the reviewer<small lang="zh-Hant">營隊表單：審閱說明</small></h1>
<p>These three forms are first drafts for ${esc(c.brand.en)}. They were written after reading the documents that Camp Taiwan (Camp Taiwan Co., Ltd., Wanli, New Taipei) publishes for its own overnight camps, so that ours cover the same ground. The wording is our own. Nothing has been copied from Camp Taiwan.</p>
<h2>What Camp Taiwan publishes</h2>
<ul>
<li><b>A “Camp Taiwan Notice”</b>: one six-page PDF in Chinese and English, linked from its summer camp page, FAQ and parent handbook. It covers fees and the refund schedule, emergency medical permission, a risk statement with a release, photo use, dismissal, a behaviour code and a dress code. Parents accept it with a tick box when they register online.</li>
<li><b>A parent handbook and FAQ</b> on its website: rules on food, phones, visits and calls; how medicine is handed to the nurse; a health check at the bus on the first day; who can collect a child.</li>
<li><b>A “Medical (Healthy Camper) form”</b>: filled in during online registration and handed in on the first day in a zip bag with any medicine. The form itself sits behind the registration login and <b>could not be read</b>. Our health form is therefore built from what the handbook says the form does, and from the usual content of a camp health form.</li>
</ul>
<h2>How our forms follow theirs</h2>
<table class="grid"><tr><th>Camp Taiwan</th><th>Ours</th></tr>
<tr><td>Fees, payment deadline, refund schedule</td><td>Notice §2–3, using the fee, inclusions and refund tiers already on our website</td></tr>
<tr><td>Emergency medical permission; a guardian must be reachable in Taiwan</td><td>Notice §4; Health form B and J</td></tr>
<tr><td>Risk statement</td><td>Notice §5</td></tr>
<tr><td>Behaviour code and dismissal</td><td>Notice §6</td></tr>
<tr><td>No phones or food; valuables; dress code</td><td>Notice §7 and §10</td></tr>
<tr><td>Photo use</td><td>Notice §11 and consent 5</td></tr>
<tr><td>Health form, medicine handed to the nurse</td><td>Camper Health Form</td></tr>
<tr><td>Health check and temperature at the bus; pick-up ticket</td><td>Check-in Day Form</td></tr>
</table>
<h2>Where ours deliberately differ</h2>
<ol>
<li><b>No release of liability.</b> Camp Taiwan’s notice asks parents to “release and agree to indemnify and hold harmless” the camp. Ours does not. Our website already promises families that we never ask them to sign away our responsibility, and a blanket release in a standard consumer contract may not be enforceable in Taiwan in any case. Ours asks parents to acknowledge the risks and authorise emergency care. <b>Please confirm this is the right approach.</b></li>
<li><b>Refunds.</b> Camp Taiwan uses its own schedule (100% at 30 days down to nothing on the day, with a registration fee that is never returned). Ours keeps the tiers on our website (95 / 90 / 80 / 70 / 50 / 0%), which follow the Standardized Domestic Group Travel Contract because the camp is sold through a licensed travel agency.</li>
<li><b>Dismissal.</b> Camp Taiwan gives no refund to a camper sent home. Ours says the unused days are settled under the refund article of the service contract. <b>A decision is needed here.</b></li>
<li><b>Photos.</b> Camp Taiwan reserves the right to use camper photos for marketing. Ours keeps this optional: the box is unticked unless the parent chooses it.</li>
<li><b>Belongings.</b> Camp Taiwan states it is not responsible for lost or damaged belongings. Ours simply asks families to leave valuables at home.</li>
<li><b>Visits and devices.</b> The same in substance as Camp Taiwan’s, using the wording already on our website.</li>
</ol>
<h2>Marked ◆: new wording that is not yet camp policy</h2>
<p>Anything marked ${NEW} is proposed here for the first time and does not appear on the website. Text without the mark repeats what the website already says. The points that most need a decision:</p>
<ul>
<li>The payment schedule (deposit, balance date): blanks in Notice §2.</li>
<li>How a cancellation is given and which day counts: Notice §3.</li>
<li>Keeping an unwell camper at home, and what happens to the fee if a camper is sent home with a fever at check-in: Notice §4, Check-in form §1.</li>
<li>Whether the nurse may give common remedies with a parent’s tick alone: Health form G. This needs the nurse’s and the lawyer’s view.</li>
<li>The behaviour code and the steps before a camper is sent home: Notice §6.</li>
<li>The personal-data notice, including how long registration records are kept: Notice §12.</li>
<li>Who may collect a camper from the Saturday bus, and the ID check: Check-in form §5.</li>
<li>The organizer’s legal name is still to be filled in on the signature page.</li>
<li>The Chinese text of the five consents uses 學員 where the rest of the documents use 營員. It is copied from the website as it stands.</li>
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
  .f { display: flex; flex-direction: column; } .f label { font-size: 7.6pt; color: #46584f; line-height: 1.25; } .f i { display: block; height: 15pt; border-bottom: .8px solid #55665e; }
  .checks { display: flex; flex-wrap: wrap; gap: 3pt 14pt; margin: 4pt 0; break-inside: avoid; }
  .c { display: inline-flex; align-items: baseline; gap: 4pt; } .c b, .yn b { display: inline-block; width: 8.5pt; height: 8.5pt; border: .9px solid #33443c; border-radius: 1.5pt; flex: none; transform: translateY(1pt); }
  table.grid { width: 100%; border-collapse: collapse; margin: 4pt 0; }
  table.grid th { text-align: left; font-size: 7.8pt; color: #46584f; background: #f2f5f3; padding: 3pt 5pt; border: .6px solid #b9c5be; font-weight: 600; }
  table.grid td { padding: 3pt 5pt; border: .6px solid #b9c5be; vertical-align: top; }
  table.grid tr { break-inside: avoid; }
  td.blank { height: 17pt; } table.tall td.blank { height: 24pt; }
  table.tall, table.tiers, table.consents { break-inside: avoid; }
  td.yn, th.yn { width: 26pt; text-align: center; } .yntable th:nth-child(2), .yntable th:nth-child(3) { width: 30pt; text-align: center; } .yntable td:first-child { width: 46%; } .yntable td { height: 17pt; }
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
