import type { L, Season } from '../lib/types'
import { campConfig } from '../config/campConfig'
import type { Photo } from '../media/media'

const l = (en: string, zh: string): L => ({ en, zh })
const c = campConfig.cohort

/** Landing-page copy. Every string is scanned by `npm run audit` (Doc 3, Part 6). */

export const HERO = {
  photo: { winter: 'lake-cypress', summer: 'pool-sunset' } as Record<Season, Photo['id']>,
  points: [
    l('All-English camp life, led by international camp counselors', '全美語生活環境，由國際營隊隊輔帶領'),
    l('Luxury camper vans with private bathrooms, three campers each', '頂級豪華露營車，獨立衛浴，三人一車'),
    l('Four meals a day, a 24/7 nurse and four layers of insurance', '一泊四食、24 小時護理師與四重保險'),
  ],
  datesPending: l('Session dates announced soon', '梯次日期即將公布'),
}

export interface Activity {
  icon: string
  name: L
  body: L
  seasons: Season[]
  photo?: Photo['id']
  /** Hotspot id on the Explore the Facilities map. */
  spot?: string
  highlight?: boolean
}
const both: Season[] = ['winter', 'summer']
export const ACTIVITIES: Activity[] = [
  { icon: 'Sailboat', name: l('Lakeside Kayaking', '湖畔獨木舟（跳跳船）'), body: l('Single and double kayaks on the calm east lake, with a coach and a life jacket for every camper.', '在平靜的東側湖面划單人或雙人獨木舟，教練陪同、全員穿救生衣。'), seasons: both, photo: 'kayak-lake', spot: 'kayak' },
  { icon: 'Waves', name: l('Aurora Pool Relays', '極光戲水池接力'), body: l(`Supervised relays in the ${campConfig.pool.depthMinCm}–${campConfig.pool.depthMaxCm} cm Aurora Pool with a Sports Administration–certified lifeguard on duty. Summer sessions.`, `在水深 ${campConfig.pool.depthMinCm}–${campConfig.pool.depthMaxCm} 公分的極光戲水池進行接力，全程由體育署合格救生員值勤。夏季梯次限定。`), seasons: ['summer'], photo: 'pool-jump', spot: 'pool' },
  { icon: 'Film', name: l('Star Cinema Night', '星空電影院'), body: l('A big screen on the lawn beside the campfire. Films are public-performance licensed (公播版) and chosen for ages 10–14.', '營火旁草地上的大螢幕。影片皆為公播版授權，並依 10–14 歲營員挑選。'), seasons: both, photo: 'cinema-screen', spot: 'cinema', highlight: true },
  { icon: 'Flame', name: l('Campfire S’mores, Skits & Trivia', '營火棉花糖、短劇與問答'), body: l('The whole camp around the brick fire pit: toast marshmallows, perform team skits and battle at trivia.', '全營隊圍著磚砌營火圈：烤棉花糖、演出小隊短劇、進行問答對決。'), seasons: both, photo: 'campfire-marshmallow', spot: 'campfire' },
  { icon: 'Bird', name: l('Waterbird Eco-Safari Tram', '歡樂遊園車生態導覽'), body: l('A guided tram loop through forest, meadow and lakeshore, timed to see egrets fly home at dusk.', '搭乘遊園車繞行森林、草原與湖岸，由導覽員解說，黃昏時欣賞鷺鳥歸巢。'), seasons: both, photo: 'lake-cypress', spot: 'tram' },
  { icon: 'Pizza', name: l('Neapolitan Pizza Guild', '拿坡里披薩工坊'), body: l('Shape and top a handmade pizza with the chef, then eat it fresh from the oven at afternoon tea.', '跟著主廚親手整形、鋪料，下午茶時享用剛出爐的手工披薩。'), seasons: both, photo: 'pizza-hands', spot: 'dining' },
  { icon: 'Tent', name: l('Wilderness Shelter & Knot Skills', '野外庇護所與繩結技巧'), body: l('Teams build a shelter that stands up on its own and learn the knots that hold it together.', '小隊合作搭建穩固的庇護所，並學會關鍵繩結。'), seasons: both },
  { icon: 'Leaf', name: l('Paracord & Moss-Ball Craft Studio', '傘繩與苔球手作工坊'), body: l('Braid a paracord keepsake and shape a living moss ball to take home.', '編織傘繩紀念品，再親手做一顆可以帶回家的苔球。'), seasons: both },
  { icon: 'Compass', name: l('Orienteering & Scavenger Hunts', '定向越野與尋寶任務'), body: l('Read the map, find the checkpoints and solve the clues as a team.', '看地圖、找檢查點、解線索，全隊一起完成任務。'), seasons: both },
  { icon: 'Flag', name: l('Capture the Flag & Lawn Challenges', '奪旗大戰與草地挑戰'), body: l('Strategy, speed and teamwork on the open meadow.', '在開闊草原上比策略、比速度，更比團隊默契。'), seasons: both },
  { icon: 'Moon', name: l('Night Ecology Walk & Camp Trivia', '夜間生態散步與營隊問答'), body: l('A counselor-led walk to listen for the night, then trivia on what you noticed.', '由隊輔帶領夜間散步聆聽自然，再用問答檢驗觀察力。'), seasons: both },
  { icon: 'Camera', name: l('Digital Camp Album & Keepsakes', '數位營隊相簿與紀念品'), body: l('A private digital photo album for families, a camp T-shirt and a Camp Participation Award.', '家長專屬數位相簿、營隊紀念 T-Shirt 與營隊參與證明。'), seasons: both },
]

export const SEASON_INTRO: Record<Season, { title: L; body: L }> = {
  winter: {
    title: l('Winter: crisp air, calm water, warm vans', '冬季：清冽空氣、平靜湖面、溫暖露營車'),
    body: l('Lakeside kayaking leads the winter programme, with the eco-tram, outdoor guilds and campfire nights. Every van has its own Hitachi heating.', '冬季以湖畔獨木舟為主打，搭配遊園車生態導覽、戶外工坊與營火之夜。每輛露營車皆有獨立日立暖氣。'),
  },
  summer: {
    title: l('Summer: everything in winter, plus the pool', '夏季：冬季的一切，再加上戲水池'),
    body: l('Summer adds supervised relays in the Aurora Pool with a certified lifeguard on duty, and air-conditioned vans for cool nights.', '夏季加入極光戲水池接力，由合格救生員值勤；露營車冷氣讓夜晚涼爽好眠。'),
  },
}

export const STAY = {
  cards: [
    { photo: 'van-bunk' as Photo['id'], title: l('Three campers per van', '三人一車'), body: l('One double bed and one bunk bed with 100% latex mattresses. Same-gender campers, grouped in age-based cabin teams.', '一張雙人床與一組上下舖，100% 乳膠床墊。同性別營員入住，並依年齡小隊分組。') },
    { photo: 'van-bath' as Photo['id'], title: l('Private wet/dry bathroom', '獨立乾濕分離衛浴'), body: l('Every van has its own bathroom with a separate shower, plus Hitachi heating and air-conditioning.', '每輛露營車皆有獨立衛浴、乾濕分離，並配備日立冷暖空調。') },
    { photo: 'zone-d-1' as Photo['id'], title: l('Twice-daily cabin inspections', '每日早晚兩次檢查'), body: l('Counselors check tidiness, heating/cooling and bathroom safety every morning and evening. Shoes off indoors, no food in the vans.', '隊輔每日早晚檢查內務、空調與衛浴安全。進車脫鞋、車內不飲食。') },
  ],
  mealsTitle: l('Four meals a day (一泊四食)', '一泊四食'),
  meals: [
    { icon: 'Sunrise', time: '08:00', name: l('Buffet breakfast', '自助早餐') },
    { icon: 'Soup', time: '12:00', name: l('Chef-led lunch', '主廚帶領午餐') },
    { icon: 'Pizza', time: '15:30', name: l('Handmade Neapolitan pizza afternoon tea', '手工拿坡里披薩下午茶') },
    { icon: 'Utensils', time: '18:00', name: l('Camp dinner feast', '營隊晚餐盛宴') },
    { icon: 'Flame', time: '19:30', name: l('Campfire snacks', '營火點心') },
  ],
  diet: l('Pre-registered non-beef, pork-free, vegetarian and allergy-safe trays at every meal.', '每餐皆備有事先登記的不吃牛、不吃豬、素食與過敏專屬餐盤。'),
}

export const TIMELINE: { time: string; icon: string; name: L }[] = [
  { time: '08:00', icon: 'Sunrise', name: l('Breakfast & Cabin Inspection', '早餐與內務檢查') },
  { time: '09:00', icon: 'Sun', name: l('Morning Team Huddle & Warm-Up', '晨間團隊集合與暖身') },
  { time: '10:30', icon: 'Sailboat', name: l('Lakeside Kayaking & Field Challenges', '湖畔獨木舟與草地挑戰') },
  { time: '12:00', icon: 'Soup', name: l('Chef-Led Culinary Guild & Lunch', '主廚美食工坊與午餐') },
  { time: '13:30', icon: 'Tent', name: l('Shelter Building & Outdoor Craft Studio', '庇護所搭建與戶外手作工坊') },
  { time: '15:30', icon: 'Pizza', name: l('Handmade Pizza Afternoon Tea', '手工披薩下午茶') },
  { time: '16:00', icon: 'Compass', name: l('Scavenger Hunt & Cabin Reflection', '尋寶任務與小隊回顧') },
  { time: '18:00', icon: 'Utensils', name: l('Camp Dinner', '營隊晚餐') },
  { time: '19:30', icon: 'Flame', name: l('Campfire S’mores, Skits & Trivia, or Star Cinema night', '營火棉花糖、短劇與問答，或星空電影之夜') },
  { time: '21:30', icon: 'Moon', name: l('Evening Cabin Check & Lights Out', '晚間內務檢查與熄燈') },
]
export const RAIN_PLAN = {
  title: l('Rain or a cold front? The day carries on indoors.', '下雨或寒流？行程移到室內照常進行。'),
  body: l('Activities move into the Bambi Grand Dining Hall (斑比大飯店) and the covered activity area for team challenges and craft workshops. Any extra cost of the change is ours, and any saving is refunded to you.', '活動將移至斑比大飯店室內大廳與遮雨棚活動區，進行團隊挑戰與手作工坊。因變更增加的費用由主辦單位負擔，減省的費用核實退還家長。'),
}

export const SAFETY = {
  staff: [
    { icon: 'ShieldCheck', title: l('Background-checked team', '背景查核的團隊'), body: l('Every counselor, coach, nurse and support worker provides a police criminal-record certificate (良民證) and is screened before camp.', '每位隊輔、活動教練、護理師與支援人員皆提供良民證，並於營隊前完成查核。') },
    { icon: 'Users', title: l(`About ${c.counselorRatio} counselors to campers`, `隊輔與營員約 ${c.counselorRatio}`), body: l('Small cabin teams mean every camper is known by name.', '小隊編制，讓每位營員都被叫得出名字。') },
    { icon: 'Stethoscope', title: l('24/7 on-site Registered Nurse', '24 小時駐點專任護理師'), body: l('A camp nurse (營隊專任護理師) manages medications and first aid day and night, backed by CPR + AED trained counselors.', '營隊專任護理師日夜負責給藥與急救，並有具 CPR + AED 訓練的隊輔支援。') },
    { icon: 'Lock', title: l(`${c.gateCurfew} gate curfew`, `${c.gateCurfew} 大門管制`), body: l('The gate is secured every night and outside visitors are not admitted during camp.', '園區大門每晚管制，營期間謝絕外部訪客。') },
  ],
  insuranceTitle: l('Four layers of insurance', '四重保險保障'),
  insurance: [
    { n: '1', title: l('Travel Industry Liability', '旅行業責任保險'), by: l('Licensed Partner Travel Agency', '合作旅行社'), body: l('Statutory cover for every participant, plus Performance Guarantee Insurance.', '依法為每位旅客投保，並含履約保證保險。') },
    { n: '2', title: l('Venue Public Liability', '場地公共意外責任險'), by: l('Bambi Glamping', '斑比跳跳'), body: l('Covers the grounds and facilities of the venue.', '涵蓋園區場地與設施。') },
    { n: '3', title: l('Product / Food Liability', '產品責任險（含食物中毒）'), by: l('Bambi Glamping', '斑比跳跳'), body: l('Covers group meal service and food safety.', '涵蓋團體膳食與食品安全。') },
    { n: '4', title: l('Activity / Travel Safety', '特定活動綜合保險／旅遊平安險'), by: l('Camp organizers', '營隊主辦單位'), body: l('Accidental disability and actual-expense medical reimbursement for every camper.', '涵蓋全體營員意外失能與實支實付傷害醫療。') },
  ],
  under15: l('Insurance Act Art. 107: for minors under 15, death benefits are legally capped at the NT$690,000 funeral-expense limit, so our cover concentrates on disability and medical reimbursement.', '保險法第 107 條：未滿 15 歲之未成年人，身故喪葬費用保險金法定上限為新臺幣 69 萬元，本營隊保單因此重點強化意外失能與實支實付醫療。'),
  duty: l('We never ask families to sign away our responsibility. The organizers are liable for their own negligence and that of everyone they arrange to deliver the camp.', '我們不會要求家長簽署免除主辦責任的條款。主辦單位對自身及所安排履行輔助人的故意或過失，負同一責任。'),
}

export const PRICING = {
  optionA: {
    name: l('Option A · 5 Days / 4 Nights', '方案 A・五天四夜全程梯'),
    when: l('Monday afternoon – Friday morning', '週一下午 至 週五上午'),
    bus: l('Includes round-trip charter bus from Taichung.', '含臺中出發遊覽車專車來回接駁。'),
  },
  optionB: {
    name: l('Option B · 4 Days / 3 Nights', '方案 B・四天三夜彈性梯'),
    when: l('Tuesday afternoon – Friday morning', '週二下午 至 週五上午'),
    bus: l('Tuesday 14:00–14:30 parent drop-off at Sanwan; Friday return charter bus included.', '週二 14:00–14:30 由家長送達三灣園區；週五回程遊覽車專車已含。'),
  },
  feePending: l('Fee announced soon', '費用即將公布'),
  datesPending: l('Dates announced soon', '日期即將公布'),
  shared: l('3 campers per luxury camper van · 4 daily meals · all activities', '三人一輛豪華露營車・一泊四食・全部活動'),
  busTitle: l('Charter bus meeting point', '遊覽車集合地點'),
  bus: l('Designated Tour Bus Zone near National Taichung Theater (Shizheng N. 2nd Rd.). Licensed charter buses under 10 years old, with a pre-departure emergency-exit briefing.', '臺中國家歌劇院周邊指定遊覽車臨停區（市政北二路）。使用車齡十年內合法遊覽車，出發前進行逃生門安全說明。'),
  included: [
    l('Luxury camper van stay', '頂級豪華露營車住宿'),
    l('4 daily meals & snacks (一泊四食)', '每日四餐與點心（一泊四食）'),
    l('Charter bus transfer (round-trip for Option A; Friday return for Option B)', '遊覽車接駁（方案 A 來回；方案 B 週五回程）'),
    l('Activity gear and craft materials', '活動器材與手作材料'),
    l('Counselors at about 1:4 and the 24/7 nurse', '約 1:4 隊輔與 24 小時駐點護理師'),
    l('Camp T-shirt and digital photo album', '營隊紀念 T-Shirt 與數位相簿'),
    l('All statutory insurance described above', '上述各項法定保險'),
  ],
  excluded: [
    l('Private transport to and from the Taichung meeting point (or to Sanwan on Tuesday for Option B)', '往返臺中集合點（或方案 B 週二前往三灣園區）的私人交通費'),
    l('Optional top-up of personal travel insurance', '個人旅遊平安險加保費'),
    l('Medical fees for personal illness, or for accidents not attributable to the organizers', '因個人疾病或非可歸責於主辦單位之意外所生的醫療費用'),
    l('Personal gear', '個人裝備購置'),
    l('Compensation for intentional damage to camper van equipment', '因故意毀損露營車設備所生的賠償'),
  ],
  noExtra: l('Beyond the items listed, no other charge is collected under any name.', '除上列項目外，主辦與承辦單位不以任何名目另行收費。'),
  guaranteeTitle: l('Minimum-group guarantee', '最低成團人數保障'),
  guarantee: l(`Each session runs with at least ${c.minGroupSize} campers. If a session does not reach that number, we notify you at least 7 days before departure and refund 100% of what you paid. If we notify you late, we also pay a penalty of 10% of the camp fee.`, `每梯次最低成團人數為 ${c.minGroupSize} 人。未達人數時，將於出發 7 日前通知並全額退費（100%）；若未於 7 日前通知，另賠償營隊費用總額 10% 之違約金。`),
  agencyTitle: l('Licensed travel agency', '合法旅行社承辦'),
  agency: l('Charter transport, lodging packages and travel liability cover are contracted and receipted through our licensed partner travel agency, under Article 27 of the Act for the Development of Tourism.', '遊覽車接駁、住宿套裝與旅行業責任保險，皆依發展觀光條例第 27 條由合作之合法旅行社簽約並開立代收轉付收據。'),
}

export const REFUND = {
  title: l('Cancellation & refund calculator', '解約退費試算'),
  intro: l('Refunds follow Taiwan’s Standardized Domestic Group Travel Contract. Receipted administrative fees already paid on your behalf are deducted first.', '退費依交通部《國內旅遊定型化契約》辦理；已代繳並具收據之行政規費先行扣除。'),
  tiers: [
    { min: 41, max: Infinity, refund: 95, label: l('41 or more days before', '活動開始前第 41 日以前') },
    { min: 31, max: 40, refund: 90, label: l('31 to 40 days before', '活動開始前第 31 至 40 日') },
    { min: 21, max: 30, refund: 80, label: l('21 to 30 days before', '活動開始前第 21 至 30 日') },
    { min: 2, max: 20, refund: 70, label: l('2 to 20 days before', '活動開始前第 2 至 20 日') },
    { min: 1, max: 1, refund: 50, label: l('1 day before', '活動開始前 1 日') },
    { min: -Infinity, max: 0, refund: 0, label: l('Start day, after start, or no-show', '活動開始當日、開始後或未通知不參加') },
  ],
  reasons: {
    family: l('We need to cancel', '家長提出解約'),
    lowEnrollment: l('Session below minimum group', '未達最低成團人數'),
    forceMajeure: l('Typhoon / earthquake / epidemic order', '颱風、地震或防疫命令'),
  },
  lowEnrollment: l('100% refund. If we notify you less than 7 days before departure, we also pay a 10% penalty.', '全額退費（100%）。若未於出發 7 日前通知，另賠償 10% 違約金。'),
  forceMajeure: l('100% refund, less necessary expenses already paid and supported by receipts. Neither side owes damages.', '全額退費，僅核實扣除已支付且具憑證之必要費用，雙方均不負損害賠償責任。'),
  reverse: l('If the camp cannot run for a reason attributable to the organizers, the same percentages are paid to you as compensation.', '若因可歸責於主辦單位或旅行社之事由致活動無法成行，亦按同比例賠償家長。'),
}

export const PACKING: { item: L; season?: Season }[] = [
  { item: l('Warm winter coat', '保暖冬季外套'), season: 'winter' },
  { item: l('Fleece layers', '刷毛保暖層'), season: 'winter' },
  { item: l('Swimwear', '泳衣'), season: 'summer' },
  { item: l('Sunscreen and a sun hat', '防曬乳與遮陽帽'), season: 'summer' },
  { item: l('Towel (the venue is eco-friendly and does not supply towels)', '毛巾與浴巾（園區響應環保，不提供毛巾）') },
  { item: l('Toiletries', '盥洗用品') },
  { item: l('Water bottle', '水壺') },
  { item: l('Outdoor clothes for each day, plus sleepwear', '每日戶外活動服裝與睡衣') },
  { item: l('Sneakers', '運動鞋') },
  { item: l('Slip-on sandals', '好穿脫的涼鞋') },
  { item: l('Rain gear', '雨具') },
  { item: l('Mosquito repellent', '防蚊液') },
  { item: l('National Health Insurance card', '健保卡') },
  { item: l('Personal medications, labeled, in the original bag (handed to the nurse at check-in)', '個人藥物：裝於原藥袋並標註姓名，報到時交給護理師') },
]

export const FAQ: { q: L; a: L }[] = [
  {
    q: l('My child’s English is not strong. Will they cope?', '孩子英文不太好，能適應嗎？'),
    a: l('Yes. English is simply the language of daily camp life: counselors speak it naturally during activities, meals and games. There are no tests, levels or worksheets. Bilingual counselors step in whenever a camper needs help, especially for safety briefings.', '可以的。英語只是營隊日常生活的語言，隊輔在活動、用餐與遊戲中自然地使用。這裡沒有測驗、沒有分級，也沒有作業。需要時雙語隊輔會隨時協助，安全說明更會確保每位營員都聽懂。'),
  },
  {
    q: l('How are roommates arranged?', '室友怎麼安排？'),
    a: l('Three same-gender campers share each camper van, grouped into age-based cabin teams. If two families both ask for their children to room together, we do our best to arrange it within the same gender and age group.', '每輛露營車安排三名同性別營員，並依年齡小隊分組。若兩個家庭都提出希望同住，我們會在同性別、相近年齡的前提下盡力安排。'),
  },
  {
    q: l('How do you handle allergies and dietary needs?', '過敏與特殊飲食怎麼處理？'),
    a: l('Tell us on the health form. Non-beef, pork-free, vegetarian and allergy-safe trays are prepared for every meal, and the nurse and dining safety lead check each tray against the form. Health details are seen only by the camp director, nurse, dining lead and insurer, and are securely destroyed within 30 days after camp.', '請在健康調查表中告訴我們。每餐皆準備不吃牛、不吃豬、素食與過敏專屬餐盤，並由護理師與餐飲安全主管逐盤核對。健康資料僅限營隊主任、護理師、餐飲主管與保險公司查閱，營隊結束後 30 日內安全銷毀。'),
  },
  {
    q: l('Can my child bring a phone or tablet?', '可以帶手機或平板嗎？'),
    a: l('Camp is screen-free so campers can be fully present. Phones and other devices are kept safely by counselors from check-in until departure. You can reach the camp team at any time, and you will see your child in the private digital photo album.', '營隊期間不使用 3C，讓孩子全心投入。手機等裝置自報到起由隊輔妥善保管，離營時歸還。家長隨時可以聯繫營隊團隊，也能在專屬數位相簿中看到孩子。'),
  },
  {
    q: l('What happens in a medical emergency?', '發生緊急醫療狀況時怎麼處理？'),
    a: l('The Registered Nurse is on site 24 hours a day and gives first aid immediately, and we contact you straight away. If the situation is urgent and neither guardian nor backup contact can be reached, staff take your camper to the nearest accredited hospital, such as Wei-Gong Memorial Hospital in Toufen, as authorized on the signed medical form.', '專任護理師 24 小時駐點，會立即進行急救，並第一時間聯繫家長。若情況危急且一時無法聯繫上家長或緊急聯絡人，將依您簽署的醫療授權書，護送至鄰近合格醫療院所（如頭份為恭紀念醫院）。'),
  },
  {
    q: l('What if it rains?', '下雨怎麼辦？'),
    a: l('Activities move into the Bambi Grand Dining Hall and the covered activity area. Any extra cost of the change is ours, and any saving is refunded.', '活動會移至斑比大飯店與遮雨棚活動區進行。因變更增加的費用由主辦單位負擔，減省的費用核實退還。'),
  },
  {
    q: l('Can I visit during camp?', '營期間可以探視嗎？'),
    a: l('To keep the grounds secure for every camper, outside visitors are not admitted during camp and the gate is closed at 23:00 each night.', '為了全體營員的安全，營期間謝絕外部訪客探視，園區大門每晚 23:00 管制。'),
  },
]

export const CONSENTS: { key: string; required: boolean; title: L; body: L }[] = [
  { key: 'contract', required: true, title: l('Service contract, refunds and court jurisdiction', '服務契約、退費標準與管轄法院'), body: l('I have reviewed and agree to Articles 1–5, including session fees, statutory refund tiers, insurance disclosures, and jurisdiction of the District Court of the Camper’s place of residence.', '本人與學員已完整審閱並同意契約第一條至第五條之活動內容、收退費比例、保險說明，及以學員住居所地方法院為管轄法院之約定。') },
  { key: 'pdpa', required: true, title: l('PDPA Article 6 health and dietary data', '個資法第 6 條健康與飲食特種個資'), body: l('I give explicit written consent under PDPA Article 6 for the collection and use of the Camper’s health, allergy and medication data for camp nursing and dietary safety.', '本人書面同意主辦單位、承辦旅行社與駐點護理師，依告知範圍蒐集、處理及利用學員之過敏、病史與用藥資料。') },
  { key: 'risk', required: true, title: l('Outdoor risk disclosure and emergency medical authorization', '戶外活動風險知情與緊急醫療授權'), body: l('I acknowledge the Informed Outdoor Risk Disclosure and authorize emergency hospital transport and physician-directed emergency care if I cannot be reached immediately.', '本人與學員已詳閱戶外風險說明，並授權危急且無法聯繫時由營隊護送就醫及接受醫師必要緊急醫療處置。') },
  { key: 'van', required: true, title: l('Camper van inspections and intentional damage', '露營車檢查公約與故意毀損賠償'), body: l('Camper and Guardian agree to twice-daily cabin inspections, the indoor camper van rules, and reimbursement for intentional property damage.', '本人與學員同意遵守每日兩次露營車檢查、車內禁食脫鞋規範，並對故意破壞公物負維修賠償責任。') },
  { key: 'media', required: false, title: l('Media and portrait release (optional)', '肖像權與活動影像授權（選填）'), body: l('I agree that camp photos and videos including the Camper may be used in future camp promotion. Leaving this unticked never affects enrollment: photos then stay in the parent album only.', '本人同意營期間含學員肖像之照片與影片可用於未來營隊宣傳。不勾選完全不影響報名資格，照片將僅限家長相簿閱覽。') },
]
