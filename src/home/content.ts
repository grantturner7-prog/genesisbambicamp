import type { L, Season } from '../lib/types'
import { campConfig } from '../config/campConfig'
import type { Photo } from '../media/media'

const l = (en: string, zh: string): L => ({ en, zh })
/** The meeting point and bus times: stated once, in campConfig. */
const BUS = campConfig.transport
const DAYS = campConfig.days
const CAMP = campConfig.brand.camp
const c = campConfig.cohort
const twd = (n: number) => `NT$${n.toLocaleString('en-US')}`
/** "NT$1,000, NT$2,000 or NT$3,000" */
const packs = campConfig.snackShop.couponPacks.map(twd)
const PACKS = l(packs.slice(0, -1).join(', ') + ' or ' + packs[packs.length - 1], packs.slice(0, -1).join('、') + ' 或 ' + packs[packs.length - 1])

/** Landing-page copy. Every string is scanned by `npm run audit` (Doc 3, Part 6). */

/** The winter camp menu from the venue kitchen: stated once, in campConfig. */
export const WINTER_MENU = campConfig.winterMenu
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

export const HERO = {
  photo: { winter: 'winter-cypress', summer: 'pool-sunset' } as Record<Season, Photo['id']>,
  /** Shown to visitors who arrive after dark (see `defaultTime` in CampState). */
  photoNight: { winter: 'van-dusk', summer: 'cinema-night' } as Record<Season, Photo['id']>,
  points: [
    l('All-English camp life, led by international camp counselors', '全美語生活環境，由國際營隊隊輔帶領'),
    l('Luxury camper vans with private bathrooms, three campers each', '頂級豪華露營車，獨立衛浴，三人一車'),
    l('Three meals a day, a 24/7 nurse and four layers of insurance', '每日三餐、24 小時護理師與四重保險'),
  ],
  /** The hero's camper figure, when the season's first camp is a pilot. */
  pilotMetric: l('campers at most in the pilot camp', '試辦營名額上限'),
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
/** Seasonal highlights tied to the venue. The named camp games live in `games.ts`. */
export const ACTIVITIES: Activity[] = [
  { icon: 'Sailboat', name: l('Lakeside Kayaking', '湖畔獨木舟（跳跳船）'), body: l('Single and double kayaks on the calm east lake, with a coach and a life jacket for every camper.', '在平靜的東側湖面划單人或雙人獨木舟，教練陪同、全員穿救生衣。'), seasons: both, photo: 'kayak-lake', spot: 'kayak' },
  { icon: 'Waves', name: l('Aurora Pool Relays', '極光戲水池接力'), body: l(`Supervised relays in the ${campConfig.pool.depthMinCm}–${campConfig.pool.depthMaxCm} cm Aurora Pool with a Sports Administration–certified lifeguard on duty. Summer sessions.`, `在水深 ${campConfig.pool.depthMinCm}–${campConfig.pool.depthMaxCm} 公分的極光戲水池進行接力，全程由體育署合格救生員值勤。夏季梯次限定。`), seasons: ['summer'], photo: 'pool-swim', spot: 'pool' },
  { icon: 'Film', name: l('Star Cinema Night', '星空電影院'), body: l('A big screen on the lawn beside the campfire. Films are public-performance licensed (公播版) and chosen to suit the campers’ ages.', '營火旁草地上的大螢幕。影片皆為公播版授權，並依營員年齡挑選。'), seasons: both, photo: 'cinema-night', spot: 'cinema', highlight: true },
  { icon: 'Flame', name: l('Campfire S’mores, Skits & Trivia', '營火棉花糖、短劇與問答'), body: l('The whole camp around the brick fire pit: toast marshmallows, perform team skits and battle at trivia.', '全營隊圍著磚砌營火圈：烤棉花糖、演出小隊短劇、進行問答對決。'), seasons: both, photo: 'campfire-marshmallow', spot: 'campfire' },
  { icon: 'Bird', name: l('Waterbird Eco-Safari Tram', '歡樂遊園車生態導覽'), body: l('A guided tram loop through forest, meadow and lakeshore, timed to see egrets fly home at dusk.', '搭乘遊園車繞行森林、草原與湖岸，由導覽員解說，黃昏時欣賞鷺鳥歸巢。'), seasons: both, photo: 'tram-on-route', spot: 'tram' },
  { icon: 'ChefHat', name: l('Chef-Led Culinary Guild', '主廚美食工坊'), body: l(`Lunch is hands-on. The chef shows campers how to make that day’s lunch themselves, and everyone eats what they made. On the winter camp menu: ${WINTER_MENU.lunch.en}.`, `午餐自己動手做。由主廚帶著營員親手完成當日午餐，做完就是大家的午餐。冬季營隊的菜色有${WINTER_MENU.lunch.zh}。`), seasons: both, photo: 'pizza-hands', spot: 'dining' },
  { icon: 'Leaf', name: l('Paracord & Moss-Ball Craft Studio', '傘繩與苔球手作工坊'), body: l('Braid a paracord keepsake and shape a living moss ball to take home.', '編織傘繩紀念品，再親手做一顆可以帶回家的苔球。'), seasons: both, photo: 'moss-ball' },
  { icon: 'Moon', name: l('Night Ecology Walk & Camp Trivia', '夜間生態散步與營隊問答'), body: l('A counselor-led walk to listen for the night, then trivia on what you noticed.', '由隊輔帶領夜間散步聆聽自然，再用問答檢驗觀察力。'), seasons: both },
  { icon: 'Camera', name: l('Digital Camp Album & Keepsakes', '數位營隊相簿與紀念品'), body: l('A private digital photo album for families, a camp T-shirt and a Camp Participation Award.', '家長專屬數位相簿、營隊紀念 T-Shirt 與營隊參與證明。'), seasons: both },
]

export const SEASON_INTRO: Record<Season, { title: L; body: L }> = {
  winter: {
    title: l('Winter: crisp air, calm water, warm vans', '冬季：清冽空氣、平靜湖面、溫暖露營車'),
    body: l('Lakeside kayaking leads the winter programme, with the eco-tram, outdoor games and challenges, and campfire nights. Every van has its own Hitachi heating.', '冬季以湖畔獨木舟為主打，搭配遊園車生態導覽、戶外遊戲與挑戰，以及營火之夜。每輛露營車皆有獨立日立暖氣。'),
  },
  summer: {
    title: l('Summer: everything in winter, plus the pool', '夏季：冬季的一切，再加上戲水池'),
    body: l('Summer adds supervised relays in the Aurora Pool with a certified lifeguard on duty, and air-conditioned vans for cool nights.', '夏季加入極光戲水池接力，由合格救生員值勤；露營車冷氣讓夜晚涼爽好眠。'),
  },
}

export const STAY = {
  cards: [
    { photo: 'van-bunk' as Photo['id'], title: l('Three campers per van', '三人一車'), body: l('One double bed and one bunk bed with 100% latex mattresses. Three same-gender campers share a van, grouped in age-based teams.', '一張雙人床與一組上下舖，100% 乳膠床墊。每車三名同性別營員，並依年齡小隊分組。') },
    { photo: 'van-bath' as Photo['id'], title: l('Private wet/dry bathroom', '獨立乾濕分離衛浴'), body: l('Every van has its own bathroom with a separate shower, plus Hitachi heating and air-conditioning.', '每輛露營車皆有獨立衛浴、乾濕分離，並配備日立冷暖空調。') },
    { photo: 'zone-d-1' as Photo['id'], title: l('Twice-daily van inspections', '每日早晚兩次檢查'), body: l('Counselors check tidiness, heating/cooling and bathroom safety every morning and evening. Shoes off indoors, no food in the vans.', '隊輔每日早晚檢查內務、空調與衛浴安全。進車脫鞋、車內不飲食。') },
  ],
  mealsTitle: l('Three meals a day', '每日三餐'),
  meals: [
    { icon: 'Sunrise', name: l('Breakfast', '早餐'), note: l(`${cap(WINTER_MENU.breakfast.en)}.`, `${WINTER_MENU.breakfast.zh}。`) },
    { icon: 'ChefHat', name: l('DIY lunch with the chef', '主廚帶領的 DIY 午餐'), note: l(`Campers make their own lunch with the chef. On the menu: ${WINTER_MENU.lunch.en}.`, `營員跟著主廚親手做午餐，菜色有${WINTER_MENU.lunch.zh}。`) },
    { icon: 'Utensils', name: l('Dinner', '晚餐'), note: l(`One evening, ${WINTER_MENU.dinners[0].en}; another, ${WINTER_MENU.dinners[1].en}.`, `一晚是${WINTER_MENU.dinners[0].zh}；另一晚是${WINTER_MENU.dinners[1].zh}。`) },
  ],
  /** Under the three meals: whose menu it is, and that no day is named. */
  mealsNote: WINTER_MENU.allergensProvided
    ? l('These are the dishes on the winter camp menu. Which dish is served on which day is not set yet.', '以上為冬季營隊的菜色，各菜色的供應日尚未排定。')
    : l('These are the dishes on the winter camp menu. Which dish is served on which day is not set yet, and the kitchen has not yet given the allergen details for each dish.', '以上為冬季營隊的菜色，各菜色的供應日尚未排定；廚房也尚未提供各菜色的過敏原資訊。'),
  /** The final evening of every session. */
  signature: {
    photo: 'wagyu-platter' as Photo['id'],
    kicker: l('The final evening', '最後一晚'),
    title: l('Signature family dinner with Wagyu beef', '招牌家宴：和牛登場'),
    body: l('Camp ends on a high note: the last evening’s dinner is Bambi Glamping’s signature family dinner, with Wagyu beef at the centre of the table. Campers registered as non-beef or vegetarian have their own alternative.', '營隊的壓軸之夜：最後一晚的晚餐，是斑比跳跳的招牌家宴，主角是和牛。事先登記不吃牛或素食的營員，另有專屬餐點。'),
  },
  /** Snacks are not part of the fee: coupons at the Airstream snack shop. */
  snacks: {
    title: l('Snacks: by coupon at the Airstream', '點心：憑點心券到 Airstream 兌換'),
    body: l(`Snacks between meals are not part of the camp fee. If you would like your camper to have them, choose a coupon pack of ${PACKS.en}. The coupons are handed to your camper at check-in and exchanged for snacks and soft drinks at the Airstream snack shop beside the pool.`, `正餐之間的點心不包含在營隊費用內。若希望孩子可以買點心，家長可選購 ${PACKS.zh} 的點心券；點心券於報到時交給營員，可在戲水池旁的 Airstream 點心站兌換點心與無酒精飲品。`),
    link: l('See the snack shop menu', '查看點心站菜單'),
  },
  diet: l('Pre-registered non-beef, pork-free, vegetarian and allergy-safe trays at every meal.', '每餐皆備有事先登記的不吃牛、不吃豬、素食與過敏專屬餐盤。'),
}

/** Shown until the partners publish the day-by-day schedule. */
/** Forms & documents: everything a family reads, fills in or signs, in the order it is needed. */
export const DOCS = {
  kicker: l('Forms & documents', '表單與文件'),
  title: l('Everything to read, fill in and sign', '需要閱讀、填寫與簽名的文件'),
  intro: l('The camp’s papers in one place, in the order you will need them.', '營隊相關文件都在這裡，依使用順序排列。'),
  /** Added to the introduction once the forms are final and posted. */
  introFinal: l('Each PDF is in English and 繁體中文 and ready to print.', '每份 PDF 皆為中英對照，可直接列印。'),
  /** Shown while `campConfig.documents.final` is false: the three forms are listed but not posted. */
  pending: l('The Camp Notice and Agreement, the Camper Health Form and the Check-in Day Form are still being finalized and are not posted yet. They will appear here when they are final.', '《營隊須知與同意書》、《營員健康調查表》與《報到日確認單》仍在定稿中，暫未提供下載；定稿後將於此處公布。'),
  whenFinal: l('Posted here when final.', '定稿後於此提供。'),
  openPdf: l('Open the PDF', '開啟 PDF'),
  /** Card 1 while `campConfig.registration.endpoint` is null: the form can be tried, and sends nothing. */
  registerClosed: {
    when: l('Not open yet', '尚未開放'),
    body: l('Online registration is not open yet. You can already try the three steps (your camper’s details, health and diet, and the consents) and save a summary; nothing is sent.', '線上報名尚未開放。您可以先試填三個步驟（營員資料、健康與飲食、同意事項）並儲存摘要；填寫的內容不會送出。'),
    button: l('Preview the form', '預覽報名表'),
  },
  items: [
    { id: 'register', when: l('To start', '第一步'), title: l('Online registration', '線上報名'), body: l('Three short steps: your camper’s details, health and diet, and the consents.', '三個簡短步驟：營員資料、健康與飲食，以及同意事項。') },
    { id: 'contract', when: l('Before any payment', '收費前'), title: l('Service contract', '服務契約'), body: l('The bilingual service contract is given to you for review before any payment.', '中英雙語服務契約將於收費前交付審閱。') },
    { id: 'notice', when: l('With your registration', '報名時'), title: l('Camp Notice and Agreement', '營隊須知與同意書'), body: l('How the camp runs and what we ask of families: fee and refunds, health and emergency care, how campers treat each other, phones, photos and personal data. Read it with your camper and sign the last page.', '說明營隊的運作方式與需要家長配合的事項：費用與退費、健康與緊急醫療、營員行為約定、手機、照片與個人資料。請與孩子一起閱讀，並於最後一頁簽名。'), file: 'documents/camp-notice-and-agreement.pdf' },
    { id: 'health', when: l('Before camp', '營隊開始前'), title: l('Camper Health Form', '營員健康調查表'), body: l('Health history, allergies, diet, medicine and emergency contacts, for the camp nurse.', '健康狀況、過敏、飲食、用藥與緊急聯絡人，供營隊護理師使用。'), file: 'documents/camper-health-form.pdf' },
    { id: 'checkin', when: l('On the morning of departure', '出發當日早上'), title: l('Check-in Day Form', '報到日確認單'), body: l(`A short health check for that morning, the medicine you hand in, and who will meet your camper on ${DAYS.last.en}. Bring it signed to the meeting point at ${BUS.meetingPoint.en}.`, `當日早上的簡短健康確認、交付的藥品，以及${DAYS.last.zh}接孩子的人。請簽名後帶到集合地點（${BUS.meetingPoint.zh}）。`), file: 'documents/check-in-day-form.pdf' },
  ] as { id: 'register' | 'contract' | 'notice' | 'health' | 'checkin'; when: L; title: L; body: L; file?: string }[],
  /** Other things on this page that families look for with the paperwork. */
  alsoTitle: l('Also on this page', '本頁其他資訊'),
  also: [
    { href: '#refund', label: l('Refund rules and calculator', '退費標準與試算') },
    { href: '#safety', label: l('Insurance and safety', '保險與安全') },
    { href: '#packing', label: l('Packing checklist', '行李清單') },
    { href: '#faq', label: l('Parent FAQ', '家長常見問題') },
    { href: '#legal', label: l('Legal & licensing disclosures', '法定揭露與營業資訊') },
  ],
}

/**
 * The winter camp, day by day. Times are the anchors of each day; the named activities are
 * the ones in `ACTIVITIES` and `games.ts`. Nothing here depends on a day the kitchen has not
 * confirmed: meals carry no dish names.
 */
export const SCHEDULE = {
  kicker: l('Day by day', '每日行程'),
  title: l(`Four days at ${CAMP}`, `${CAMP} 的四天三夜`),
  intro: l(
    `The winter camp runs ${DAYS.first.en} to ${DAYS.last.en}. Campers wake at 06:30, the day starts after breakfast, and lights go out at 21:15. On a wet day the same day carries on under cover.`,
    `冬季營隊為${DAYS.first.zh}至${DAYS.last.zh}。每天 06:30 起床，早餐後展開活動，21:15 熄燈。遇雨時，行程移至室內照常進行。`,
  ),
  /** Shown for a season whose camp has no dates yet. */
  pending: l('The day-by-day plan for this camp will be published here with its dates.', '本營隊的每日行程將與日期一併公布於此。'),
  teaser: l('See what happens on each of the four days.', '看看四天裡每天做些什麼。'),
  teaserLink: l('Open the day-by-day plan', '查看每日行程'),
  days: [
    {
      day: l('Thursday', '週四'),
      theme: l('Arrival, the lake and the opening fire', '抵達、湖畔與開營營火'),
      rows: [
        { time: BUS.meetTime, what: l(`Meet at ${BUS.meetingPoint.en}. The charter bus leaves at ${BUS.departTime}.`, `於${BUS.meetingPoint.zh}集合，遊覽車專車 ${BUS.departTime} 出發。`) },
        { time: '10:00', what: l('Arrive at camp: welcome circle, a walk round the camp, camper van check-in.', '抵達營地：開營圍圈、營地導覽、露營車分配。') },
        { time: '12:00', what: l('Lunch made with the chef.', '跟著主廚親手做午餐。') },
        { time: '13:30', what: l('Kayaking on the lake with the coach, the Team Banner & Mascot Workshop, and cornhole.', '教練帶領的湖畔獨木舟、隊旗與吉祥物工作坊，還有沙包投擲（Cornhole）。') },
        { time: '16:40', what: l('The eco-tram at dusk, to watch the egrets fly home.', '黃昏搭遊園車，看白鷺歸巢。') },
        { time: '18:00', what: l('Dinner.', '晚餐。') },
        { time: '19:00', what: l('Opening campfire and the Color War Opening Ceremony, with s’mores.', '開營營火與 Color War 開幕式，一起烤棉花糖夾心餅。') },
      ],
    },
    {
      day: l('Friday', '週五'),
      theme: l('Explorers’ day', '探索日'),
      rows: [
        { time: '07:15', what: l('Breakfast.', '早餐。') },
        { time: '08:15', what: l('Orienteering Quest: a map, a compass and ten control points.', '定向越野探索：地圖、指北針與十個檢查點。') },
        { time: '10:00', what: l('Bambi Amazing Race across the camp.', '斑比探索大挑戰，跑遍全營區。') },
        { time: '12:00', what: l('Lunch made with the chef.', '跟著主廚親手做午餐。') },
        { time: '13:45', what: l('Multi-sports: ultimate frisbee, mini-football and dodgeball.', '多項運動：飛盤爭奪、迷你足球與躲避球。') },
        { time: '14:40', what: l('Shelter Build Challenge.', '野外庇護所挑戰。') },
        { time: '17:00', what: l('Dinner.', '晚餐。') },
        { time: '18:00', what: l('Star Cinema on the lawn.', '草地上的星空電影院。') },
        { time: '19:10', what: l('Glow Night Quest, then board games.', '夜光任務，接著是桌遊時間。') },
      ],
    },
    {
      day: l('Saturday', '週六'),
      theme: l('Games and makers’ day, and the final night', '競賽與動手做的一天，以及結營之夜'),
      rows: [
        { time: '07:15', what: l('Breakfast.', '早餐。') },
        { time: '08:15', what: l('Multi-sports league and the Camp Olympics Relay Medley.', '多項運動聯賽與營隊奧運接力。') },
        { time: '10:30', what: l('Paracord survival bracelets and the Giant Bubble Lab.', '傘繩求生手環與巨型泡泡探索。') },
        { time: '12:30', what: l('Lunch made with the chef.', '跟著主廚親手做午餐。') },
        { time: '14:00', what: l('Oobleck Olympics, the Mentos Geyser demonstration and the Egg Drop Build Challenge.', '神奇澱粉泥奧運、曼陀珠噴泉示範與雞蛋防摔建造挑戰。') },
        { time: '16:00', what: l('Games arcade and the cornhole final.', '遊戲闖關與 Cornhole 決賽。') },
        { time: '17:00', what: l('Final campfire: the Skit & Talent Showdown.', '惜別營火：短劇與才藝秀。') },
        { time: '18:00', what: l('Signature family dinner with Wagyu beef.', '和牛招牌家宴。') },
        { time: '19:30', what: l('Treasure hunt: the counselors hide treasures around the camp for the last game of the evening.', '尋寶之夜：隊輔把寶物藏在營地各處，全營出動尋寶，作為最後一晚的壓軸遊戲。') },
      ],
    },
    {
      day: l('Sunday', '週日'),
      theme: l('Finale and home', '總決賽與返家'),
      rows: [
        { time: '07:15', what: l('Breakfast.', '早餐。') },
        { time: '08:30', what: l('Color War Finale: the Tug-of-War Tournament and the Giant Rope Jump Challenge.', 'Color War 總決賽：拔河錦標賽與大繩跳躍挑戰。') },
        { time: '09:20', what: l('Prize-giving and the Camp Participation Awards.', '頒獎與營隊參與證明。') },
        { time: BUS.leaveCampTime, what: l('The bus leaves camp.', '專車自營地出發。') },
        { time: BUS.returnTime, what: l(`Back at ${BUS.meetingPoint.en}, at about this time.`, `約此時返抵${BUS.meetingPoint.zh}。`) },
      ],
    },
  ] as { day: L; theme: L; rows: { time: string; what: L }[] }[],
}
export const RAIN_PLAN = {
  title: l('Rain or a cold front? The day carries on indoors.', '下雨或寒流？行程移到室內照常進行。'),
  body: l('Activities move into the Bambi Grand Dining Hall (斑比大飯店) and the covered activity area for team challenges and craft workshops. Any extra cost of the change is ours, and any saving is refunded to you.', '活動將移至斑比大飯店室內大廳與遮雨棚活動區，進行團隊挑戰與手作工坊。因變更增加的費用由主辦單位負擔，減省的費用核實退還家長。'),
}

export const SAFETY = {
  staff: [
    { icon: 'ShieldCheck', title: l('Background-checked team', '背景查核的團隊'), body: l('Every counselor, coach, nurse and support worker provides a police criminal-record certificate (良民證) and is screened before camp.', '每位隊輔、活動教練、護理師與支援人員皆提供良民證，並於營隊前完成查核。') },
    { icon: 'Users', title: l(`About ${c.counselorRatio} counselors to campers`, `隊輔與營員約 ${c.counselorRatio}`), body: l('Small teams mean every camper is known by name.', '小隊編制，讓每位營員都被叫得出名字。') },
    { icon: 'Stethoscope', title: l('24/7 on-site Registered Nurse', '24 小時駐點專任護理師'), body: l('A camp nurse (營隊專任護理師) manages medications and first aid day and night, backed by CPR + AED trained counselors.', '營隊專任護理師日夜負責給藥與急救，並有具 CPR + AED 訓練的隊輔支援。') },
    { icon: 'Lock', title: l(`${c.gateCurfew} gate curfew`, `${c.gateCurfew} 大門管制`), body: l('The gate is closed every night. Bambi Glamping’s own overnight guests are also on site on the weekend nights; parents and other visitors are not admitted during camp.', '園區大門每晚管制。週末夜晚園區另有斑比跳跳的住宿旅客；營期間謝絕家長與其他訪客探視。') },
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
  /** The camp. There is one kind only, so it has no option letter. */
  camp: {
    name: l('4 Days / 3 Nights', '四天三夜'),
    when: l(`${DAYS.first.en} to ${DAYS.last.en}`, `${DAYS.first.zh} 至 ${DAYS.last.zh}`),
    bus: l(`${DAYS.first.en}: meet at ${BUS.meetingPoint.en}, at ${BUS.meetTime}; the charter bus leaves at ${BUS.departTime}. ${DAYS.last.en}: the bus leaves camp at ${BUS.leaveCampTime} and returns to ${BUS.meetingPoint.en}, at about ${BUS.returnTime}. The charter bus both ways is included.`, `${DAYS.first.zh} ${BUS.meetTime} 於${BUS.meetingPoint.zh}集合，遊覽車專車 ${BUS.departTime} 出發；${DAYS.last.zh} ${BUS.leaveCampTime} 自營地出發，約 ${BUS.returnTime} 返抵${BUS.meetingPoint.zh}。來回遊覽車專車已含。`),
  },
  /** A season whose camp has no dates yet: a placeholder, nothing to register for. */
  comingSoon: l('Coming soon', '敬請期待'),
  comingSoonBody: l('Dates and fee for this camp are not set yet. They will be announced here.', '本營隊的日期與費用尚未確定，確定後將公布於此。'),
  seeCamp: { winter: l('See the Winter Camp', '查看冬季營隊'), summer: l('See the Summer Camp', '查看夏季營隊') },
  /** Beside a fee: it is charged for each camper. */
  perCamper: l('per camper', '每位營員'),
  /** Shown on a session that is a pilot camp. */
  pilotBadge: l('First camp · Pilot', '首梯・試辦營'),
  pilotLimit: (n: number) => l(`Pilot camp, limited to ${n} campers`, `試辦營，限額 ${n} 名營員`),
  shared: l('3 campers per luxury camper van · 3 meals a day · all activities', '三人一輛豪華露營車・每日三餐・全部活動'),
  busTitle: l('Charter bus from Taichung, both ways', '臺中來回遊覽車專車'),
  bus: l(`Meeting point: ${BUS.meetingPoint.en} (${BUS.meetingAddress.en}). Licensed charter buses under 10 years old, with a pre-departure emergency-exit briefing.`, `集合地點：${BUS.meetingPoint.zh}（${BUS.meetingAddress.zh}）。使用車齡十年內合法遊覽車，出發前進行逃生門安全說明。`),
  included: [
    l('Luxury camper van stay', '頂級豪華露營車住宿'),
    l('Three meals a day: breakfast, DIY lunch with the chef and dinner, with the signature Wagyu dinner on the final evening', '每日三餐：早餐、主廚帶領的 DIY 午餐與晚餐，最後一晚為和牛招牌家宴'),
    l(`Charter bus from ${BUS.meetingPoint.en}, to camp and back`, `${BUS.meetingPoint.zh}至營地的來回遊覽車專車`),
    l('Activity gear and craft materials', '活動器材與手作材料'),
    l('Counselors at about 1:4 and the 24/7 nurse', '約 1:4 隊輔與 24 小時駐點護理師'),
    l('Camp T-shirt and digital photo album', '營隊紀念 T-Shirt 與數位相簿'),
    l('All statutory insurance described above', '上述各項法定保險'),
  ],
  excluded: [
    l(`Snacks and drinks at the Airstream snack shop (optional coupon packs of ${PACKS.en})`, `Airstream 點心站的點心與飲品（可自由選購 ${PACKS.zh} 的點心券）`),
    l(`Travel between home and the meeting point at ${BUS.meetingPoint.en}`, `住家往返集合地點（${BUS.meetingPoint.zh}）的交通費`),
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

/** Optional snack coupons, chosen at registration. */
export const COUPONS = {
  label: l('Snack coupons (optional)', '點心券（自由選購）'),
  none: l('No coupons', '不購買'),
  pack: (n: number) => l(`${twd(n)} pack`, `${twd(n)} 點心券`),
  hint: l('Handed to your camper at check-in and exchanged at the Airstream snack shop beside the pool. Snacks are not part of the camp fee.', '於報到時交給營員，可在戲水池旁的 Airstream 點心站兌換。點心不包含在營隊費用內。'),
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
  { item: l('Rain gear and a folding umbrella', '雨具與摺疊傘') },
  { item: l('Torch or headlamp, with spare batteries', '手電筒或頭燈（含備用電池）') },
  { item: l('A spare set of dry clothes and shoes for the lake', '湖上活動用的備用乾衣物與鞋子') },
  { item: l('Mosquito repellent', '防蚊液') },
  { item: l('National Health Insurance card', '健保卡') },
  { item: l('Personal medications, labeled, in the original bag (handed in at check-in at the meeting point; the nurse keeps them during camp)', '個人藥物：裝於原藥袋並標註姓名，於集合地點報到時交付，營期間由護理師保管') },
]

export const FAQ: { q: L; a: L }[] = [
  {
    q: l('My child’s English is not strong. Will they cope?', '孩子英文不太好，能適應嗎？'),
    a: l('Yes. English is simply the language of daily camp life: counselors speak it naturally during activities, meals and games. There are no tests, levels or worksheets. Bilingual counselors step in whenever a camper needs help, especially for safety briefings.', '可以的。英語只是營隊日常生活的語言，隊輔在活動、用餐與遊戲中自然地使用。這裡沒有測驗、沒有分級，也沒有作業。需要時雙語隊輔會隨時協助，安全說明更會確保每位營員都聽懂。'),
  },
  {
    q: l('How are roommates arranged?', '室友怎麼安排？'),
    a: l('Three same-gender campers share each camper van, grouped into age-based teams. If two families both ask for their children to room together, we do our best to arrange it within the same gender and age group.', '每輛露營車安排三名同性別營員，並依年齡小隊分組。若兩個家庭都提出希望同住，我們會在同性別、相近年齡的前提下盡力安排。'),
  },
  {
    q: l('How do you handle allergies and dietary needs?', '過敏與特殊飲食怎麼處理？'),
    a: l(`Tell us on the health form. Non-beef, pork-free, vegetarian and allergy-safe trays are prepared for every meal, and the nurse and dining safety lead check each tray against the form. Health details are seen only by the camp director, nurse, dining lead and insurer, and are securely destroyed within 30 days after camp.${WINTER_MENU.allergensProvided ? '' : ' The kitchen has not yet given the allergen details for each dish on the winter menu.'}`, `請在健康調查表中告訴我們。每餐皆準備不吃牛、不吃豬、素食與過敏專屬餐盤，並由護理師與餐飲安全主管逐盤核對。健康資料僅限營隊主任、護理師、餐飲主管與保險公司查閱，營隊結束後 30 日內安全銷毀。${WINTER_MENU.allergensProvided ? '' : '廚房尚未提供冬季營隊各菜色的過敏原資訊。'}`),
  },
  {
    q: l('Which meals are included, and what about snacks?', '費用包含哪些餐點？點心呢？'),
    a: l(`Three meals a day are included: breakfast, a DIY lunch that campers make with the chef, and dinner. The final evening is the signature family dinner with Wagyu beef. On the winter camp menu: at breakfast, ${WINTER_MENU.breakfast.en}; at lunch, ${WINTER_MENU.lunch.en}; at dinner, ${WINTER_MENU.dinners[0].en}, and ${WINTER_MENU.dinners[1].en}. Snacks between meals are not included. If you would like your camper to have them, choose a coupon pack of ${PACKS.en}; the coupons are handed to your camper at check-in and exchanged at the Airstream snack shop beside the pool, which serves no alcohol.`, `費用包含每日三餐：早餐、營員與主廚一起動手做的 DIY 午餐，以及晚餐；最後一晚則是和牛招牌家宴。冬季營隊的菜色：早餐有${WINTER_MENU.breakfast.zh}；午餐有${WINTER_MENU.lunch.zh}；晚餐有${WINTER_MENU.dinners[0].zh}，以及${WINTER_MENU.dinners[1].zh}。正餐之間的點心不包含在內。若希望孩子可以買點心，家長可選購 ${PACKS.zh} 的點心券，於報到時交給營員，在戲水池旁的 Airstream 點心站兌換；點心站不販售任何含酒精飲品。`),
  },
  {
    q: l('Can my child bring a phone or tablet?', '可以帶手機或平板嗎？'),
    a: l('Camp is screen-free so campers can be fully present. Phones and other devices are kept safely by counselors from check-in until departure. You can reach the camp team at any time, and you will see your child in the private digital photo album.', '營隊期間不使用 3C，讓孩子全心投入。手機等裝置自報到起由隊輔妥善保管，離營時歸還。家長隨時可以聯繫營隊團隊，也能在專屬數位相簿中看到孩子。'),
  },
  {
    q: l('What happens in a medical emergency?', '發生緊急醫療狀況時怎麼處理？'),
    a: l('The Registered Nurse is on site 24 hours a day and gives first aid immediately, and we contact you straight away. If the situation is urgent and neither guardian nor backup contact can be reached, staff take your camper to the nearest accredited hospital, such as Wei-Gong Memorial Hospital in Toufen, as you authorize in consent 3 of the registration form.', '專任護理師 24 小時駐點，會立即進行急救，並第一時間聯繫家長。若情況危急且一時無法聯繫上家長或緊急聯絡人，將依您於報名表同意事項第 3 項的緊急醫療授權，護送至鄰近合格醫療院所（如頭份為恭紀念醫院）。'),
  },
  {
    q: l('What if it rains?', '下雨怎麼辦？'),
    a: l('Activities move into the Bambi Grand Dining Hall and the covered activity area. Any extra cost of the change is ours, and any saving is refunded.', '活動會移至斑比大飯店與遮雨棚活動區進行。因變更增加的費用由主辦單位負擔，減省的費用核實退還。'),
  },
  {
    q: l('Can I visit during camp?', '營期間可以探視嗎？'),
    a: l('To keep camp life settled for every camper, parents and other visitors are not admitted during camp, and the gate is closed at 23:00 each night.', '為了讓全體營員安心投入營隊生活，營期間謝絕家長與其他訪客探視，園區大門每晚 23:00 管制。'),
  },
  {
    q: l('Are there other guests at the venue during camp?', '營期間園區還有其他旅客嗎？'),
    a: l(`On the first day and night the camp has the venue to itself. On the weekend nights Bambi Glamping’s own overnight guests are on site as well. Campers have their own camper vans and their own programme, and their counselors are with them throughout.`, `營隊第一天與第一晚，園區由營隊專用。週末夜晚園區另有斑比跳跳的住宿旅客；營員有專屬的露營車與活動安排，隊輔全程陪伴。`),
  },
]

export const CONSENTS: { key: string; required: boolean; title: L; body: L }[] = [
  { key: 'contract', required: true, title: l('Service contract, refunds and court jurisdiction', '服務契約、退費標準與管轄法院'), body: l('I have reviewed and agree to Articles 1–5, including session fees, statutory refund tiers, insurance disclosures, and jurisdiction of the District Court of the Camper’s place of residence.', '本人與營員已完整審閱並同意契約第一條至第五條之活動內容、收退費比例、保險說明，及以營員住居所地方法院為管轄法院之約定。') },
  { key: 'pdpa', required: true, title: l('PDPA Article 6 health and dietary data', '個資法第 6 條健康與飲食特種個資'), body: l('I give explicit written consent under PDPA Article 6 for the collection and use of the Camper’s health, allergy and medication data for camp nursing and dietary safety.', '本人書面同意主辦單位、承辦旅行社與駐點護理師，依告知範圍蒐集、處理及利用營員之過敏、病史與用藥資料。') },
  { key: 'risk', required: true, title: l('Outdoor risk disclosure and emergency medical authorization', '戶外活動風險知情與緊急醫療授權'), body: l('I acknowledge the Informed Outdoor Risk Disclosure and authorize emergency hospital transport and physician-directed emergency care if I cannot be reached immediately.', '本人與營員已詳閱戶外風險說明，並授權危急且無法聯繫時由營隊護送就醫及接受醫師必要緊急醫療處置。') },
  { key: 'van', required: true, title: l('Camper van inspections and intentional damage', '露營車檢查公約與故意毀損賠償'), body: l('Camper and Guardian agree to twice-daily camper van inspections, the indoor camper van rules, and reimbursement for intentional property damage.', '本人與營員同意遵守每日兩次露營車檢查、車內禁食脫鞋規範，並對故意破壞公物負維修賠償責任。') },
  { key: 'media', required: false, title: l('Media and portrait release (optional)', '肖像權與活動影像授權（選填）'), body: l('I agree that camp photos and videos including the Camper may be used in future camp promotion. Leaving this unticked never affects enrollment: photos then stay in the parent album only.', '本人同意營期間含營員肖像之照片與影片可用於未來營隊宣傳。不勾選完全不影響報名資格，照片將僅限家長相簿閱覽。') },
]
