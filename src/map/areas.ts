import type { AreaId } from '../lib/types'
import { campConfig } from '../config/campConfig'
import type { Area } from './types'

const { cohort, pool, transport, venue, winterMenu } = campConfig

const twd = (n: number) => `NT$${n.toLocaleString('en-US')}`
const packs = campConfig.snackShop.couponPacks.map(twd)
/** "NT$1,000, NT$2,000 or NT$3,000" */
const COUPON_PACKS = { en: packs.slice(0, -1).join(', ') + ' or ' + packs[packs.length - 1], zh: packs.slice(0, -1).join('、') + ' 或 ' + packs[packs.length - 1] }

/**
 * Area content. Every string is bilingual (en + zh-TW) and is scanned by
 * `npm run audit` against the Taiwan regulatory guardrails (Doc 3, Part 2).
 *
 * House style:
 *  - "Camper vans" / 露營車 — never wooden cabins.
 *  - "Counselors" / 隊輔 — never teachers.
 *  - English is the language of camp life, never a subject taught.
 *  - No alcohol anywhere, and no promises we cannot keep in writing.
 */
export const AREAS: Area[] = [
  // ───────────────────────────────────────────────────────────── GATE
  {
    id: 'gate',
    name: { en: 'Welcome Gate & Reception', zh: '歡迎大門與接待處' },
    tagline: {
      en: 'Where every camper’s adventure begins.',
      zh: '每位營員的冒險，從這裡開始。',
    },
    summary: {
      en: `Campers arrive by charter bus at the Bambi gate in Sanwan, Miaoli, where counselors welcome them at the reception unit just inside. The bus leaves ${transport.meetingPoint.en}, at ${transport.departTime} on Wednesday and brings campers back there at ${transport.returnTime} on Saturday.`,
      zh: `營員搭乘遊覽車專車抵達苗栗三灣斑比跳跳大門，隊輔會在入口旁的接待處迎接。專車於週三 ${transport.departTime} 自${transport.meetingPoint.zh}出發，週六 ${transport.returnTime} 返抵${transport.meetingPoint.zh}。`,
    },
    icon: 'DoorClosed',
    accent: '#8a6a43',
    accent2: '#d4a373',
    features: [
      {
        icon: 'Bus',
        title: { en: 'Charter bus from Taichung, both ways', zh: '臺中來回遊覽車專車' },
        body: {
          en: `Campers meet at ${transport.meetingPoint.en}, at ${transport.meetTime} on Wednesday, and the charter bus leaves at ${transport.departTime}. On Saturday it returns to ${transport.meetingPoint.en}, at ${transport.returnTime}. The bus both ways is included in the fee.`,
          zh: `週三 ${transport.meetTime} 於${transport.meetingPoint.zh}集合，遊覽車專車 ${transport.departTime} 出發；週六 ${transport.returnTime} 返抵${transport.meetingPoint.zh}。來回專車費用已含。`,
        },
      },
      {
        icon: 'MapPin',
        title: { en: 'Meeting point', zh: '集合地點' },
        body: {
          en: `${transport.meetingPoint.en} (${transport.meetingAddress.en}). Families bring campers there on Wednesday morning and meet them there on Saturday.`,
          zh: `${transport.meetingPoint.zh}（${transport.meetingAddress.zh}）。週三早上由家長送孩子至此集合，週六也在此接回。`,
        },
      },
      {
        icon: 'Pill',
        title: { en: 'Medication handover', zh: '藥物交接' },
        body: {
          en: 'Medicines are handed in at check-in at the meeting point in Taichung, in their original bag with your camper’s name on it. The Registered Nurse keeps them during camp.',
          zh: '個人藥物請裝於原藥袋並標註姓名，於臺中集合地點報到時交付，營期間由駐點護理師統一保管。',
        },
      },
      {
        icon: 'Users',
        title: { en: 'Walked to the vans', zh: '隊輔陪同入住' },
        body: {
          en: 'Counselors walk every camper to their camper van and age-based team.',
          zh: '隊輔會陪同每位營員前往露營車，並依年齡小隊分組。',
        },
      },
      {
        icon: 'Lock',
        title: { en: `${cohort.gateCurfew} gate curfew`, zh: `${cohort.gateCurfew} 大門管制` },
        body: {
          en: 'The gate is secured every night at 23:00, and outside visitors are not admitted during camp.',
          zh: '園區大門每晚 23:00 管制，營期間謝絕外部訪客探視。',
        },
      },
    ],
    facts: [
      { label: { en: 'Venue', zh: '營地' }, value: { en: 'Bambi Glamping, Sanwan, Miaoli', zh: '斑比跳跳・苗栗三灣' } },
      { label: { en: 'Bus from Taichung', zh: '臺中專車' }, value: { en: `Leaves Wednesday ${transport.departTime} · back Saturday ${transport.returnTime}`, zh: `週三 ${transport.departTime} 出發・週六 ${transport.returnTime} 返抵` } },
      { label: { en: 'Gate curfew', zh: '大門管制' }, value: { en: 'Nightly at 23:00', zh: '每晚 23:00' } },
      { label: { en: 'Address', zh: '地址' }, value: venue.address },
    ],
    parentNote: {
      en: `Say your goodbyes at ${transport.meetingPoint.en}, on Wednesday morning. When the bus reaches camp, counselors take care of luggage and camper van assignments.`,
      zh: `週三早上請在${transport.meetingPoint.zh}與孩子道別；專車抵達營地後，行李與露營車分配都交給隊輔。`,
    },
  },

  // ───────────────────────────────────────────────────────────── VANS
  {
    id: 'vans',
    name: { en: 'Luxury Camper Vans', zh: '頂級豪華露營車' },
    tagline: {
      en: 'Hotel comfort in every camper van.',
      zh: '每一輛露營車，都是飯店等級的舒適小窩。',
    },
    summary: {
      en: 'Campers sleep in Bambi’s climate-controlled luxury camper vans, each with a double bed, a bunk bed and its own wet/dry bathroom. Three same-gender campers share a van and counselors check every van each morning and evening. The camp has 50 units in six zones (A to G) across lakeside, meadow and forest settings.',
      zh: '營員入住斑比跳跳的冷暖空調頂級豪華露營車，每車配備一張雙人床、一組上下舖與獨立乾濕分離衛浴。每車三名同性別營員，隊輔每日早晚各檢查一次。全區共 50 輛，分為 A 到 G 六區，分佈於湖畔、草地與森林之間。',
    },
    icon: 'BedDouble',
    accent: '#3e6f8f',
    accent2: '#bcd7e6',
    features: [
      {
        icon: 'Users',
        title: { en: '3 campers per van', zh: '每車三名營員' },
        body: {
          en: 'Three same-gender campers share each van, grouped in age-based teams.',
          zh: '每車三名同性別營員，並依年齡小隊分組。',
        },
      },
      {
        icon: 'BedDouble',
        title: { en: 'Double bed + bunk bed', zh: '雙人床加上下舖' },
        body: {
          en: 'One double bed and one bunk bed, with 100% latex mattresses for a proper night’s sleep.',
          zh: '一張雙人床與一組上下舖，搭配 100% 乳膠床墊，睡得安穩。',
        },
      },
      {
        icon: 'Snowflake',
        title: { en: 'Hitachi heating & A/C', zh: '日立冷暖空調' },
        body: {
          en: 'Each van has its own Hitachi heating and air-conditioning, so winter nights stay cozy and summer nights stay cool.',
          zh: '每輛露營車皆有獨立日立冷暖空調，冬夜溫暖、夏夜涼爽。',
        },
      },
      {
        icon: 'Bath',
        title: { en: 'Private wet/dry bathroom', zh: '獨立乾濕分離衛浴' },
        body: {
          en: 'A private bathroom inside the van, with a separate shower area.',
          zh: '車內附獨立衛浴，淋浴區與盥洗區乾濕分離。',
        },
      },
      {
        icon: 'GlassWater',
        title: { en: 'Comforts included', zh: '貼心設備' },
        body: {
          en: 'Bottled water, a kettle and a hair dryer are provided. Please pack your own towels — Bambi keeps things eco-friendly.',
          zh: '備有瓶裝水、快煮壺與吹風機。毛巾請自備，一起配合園區環保政策。',
        },
      },
      {
        icon: 'ShieldCheck',
        title: { en: 'Twice-daily inspections', zh: '早晚兩次檢查' },
        body: {
          en: 'Counselors check tidiness, heating/cooling and bathroom safety every morning and evening.',
          zh: '隊輔每日早晚各檢查一次內務整潔、空調與衛浴安全。',
        },
      },
    ],
    facts: [
      { label: { en: 'Campers per van', zh: '每車人數' }, value: { en: `${cohort.campersPerVan}, same gender`, zh: `${cohort.campersPerVan} 人，同性別` } },
      { label: { en: 'Beds', zh: '床鋪' }, value: { en: '1 double + 1 bunk', zh: '雙人床 1 張＋上下舖 1 組' } },
      { label: { en: 'Settings', zh: '營位環境' }, value: { en: 'Lakeside · Meadow · Forest', zh: '湖畔・草地・森林' } },
      { label: { en: 'Inspections', zh: '檢查' }, value: { en: 'Morning and evening', zh: '每日早晚各一次' } },
    ],
    seasonNote: {
      winter: { en: 'Winter nights: heating keeps every van warm.', zh: '冬季夜晚：暖氣讓每輛露營車都溫暖舒適。' },
      summer: { en: 'Summer nights: air-conditioning keeps every van cool.', zh: '夏季夜晚：冷氣讓每輛露營車都涼爽舒適。' },
    },
    safety: {
      title: { en: 'The Camper Van Code', zh: '露營車生活公約' },
      rules: [
        {
          icon: 'Footprints',
          title: { en: 'Shoes off indoors', zh: '進車脫鞋' },
          body: {
            en: 'Shoes stay at the door, which keeps every van clean and cozy.',
            zh: '鞋子留在門口，讓每輛露營車保持乾淨舒適。',
          },
        },
        {
          icon: 'Ban',
          title: { en: 'No food or sugary drinks inside', zh: '車內禁止飲食' },
          body: {
            en: 'Food stays in the dining hall, which keeps ants and insects out of the vans.',
            zh: '食物與含糖飲料只在餐廳享用，避免山林昆蟲與螞蟻進入車內。',
          },
        },
        {
          icon: 'BedDouble',
          title: { en: 'Bunks are for sleeping', zh: '上下舖只用來睡覺' },
          body: {
            en: 'No climbing on the bunk frame and no jumping on beds.',
            zh: '禁止在床架上攀爬跳躍。',
          },
        },
        {
          icon: 'DoorClosed',
          title: { en: 'Bathroom doors stay unlocked', zh: '浴室門不反鎖' },
          body: {
            en: 'A counselor can always help if someone slips or feels unwell.',
            zh: '萬一有人滑倒或不舒服，隊輔隨時都能協助。',
          },
        },
        {
          icon: 'Clock',
          title: { en: 'Lights out after the evening check', zh: '晚間檢查後熄燈' },
          body: {
            en: 'An evening van check wraps up the day before lights out.',
            zh: '隊輔進行晚間內務檢查後熄燈就寢。',
          },
        },
        {
          icon: 'Receipt',
          title: { en: 'Care for the van', zh: '愛惜設備' },
          body: {
            en: 'Only intentional damage is reimbursed by the family, at the venue’s actual repair cost.',
            zh: '僅針對故意毀損，由家長依園區實際維修單據負擔賠償。',
          },
        },
      ],
    },
  },

  // ───────────────────────────────────────────────────────────── DINING
  {
    id: 'dining',
    name: { en: 'Bambi Grand Dining Hall', zh: '斑比大飯店（餐廳）' },
    tagline: {
      en: 'Three meals a day — and our rainy-day headquarters.',
      zh: '每日三餐的美味基地，也是雨天備案大本營。',
    },
    summary: {
      en: 'The Grand Dining Hall (斑比大飯店) is a glass-walled hall with floor-to-ceiling windows onto the palms. Three meals a day are served here: a buffet breakfast, a lunch that campers make themselves with the chef, and an evening buffet. The final evening is the signature family dinner with Wagyu beef. When rain or a cold front arrives, the hall and the covered activity area host team challenges and craft workshops, so the day carries on.',
      zh: '每日三餐都在斑比大飯店享用：自助式早餐、營員跟著主廚親手做的午餐，以及自助式晚餐；最後一晚則是和牛招牌家宴。餐廳的大面落地窗外就是棕櫚樹景。遇到下雨或寒流時，大廳與遮雨棚活動區會化身團隊挑戰與手作工坊，讓一天的行程照常進行。',
    },
    icon: 'Utensils',
    accent: '#a8652f',
    accent2: '#f0c58f',
    features: [
      {
        icon: 'Utensils',
        title: { en: 'Three meals a day', zh: '每日三餐' },
        body: {
          en: 'A buffet breakfast, a DIY lunch that campers make with the chef, and an evening buffet. Snacks are separate: campers use snack coupons at the Airstream snack shop.',
          zh: '自助式早餐、營員跟著主廚親手做的 DIY 午餐，以及自助式晚餐。點心另計：營員憑點心券到 Airstream 點心站兌換。',
        },
      },
      {
        icon: 'Star',
        title: { en: 'Signature family dinner on the final evening', zh: '最後一晚：招牌家宴' },
        body: {
          en: 'The last night ends with Bambi Glamping’s signature family dinner, with Wagyu beef at the centre of the table. Campers registered as non-beef or vegetarian have their own alternative.',
          zh: '營隊最後一晚，由斑比跳跳的招牌家宴壓軸，主角是和牛。事先登記不吃牛或素食的營員，另有專屬餐點。',
        },
      },
      {
        icon: 'ChefHat',
        title: { en: 'Chef-Led Culinary Guild', zh: '主廚美食工坊' },
        body: {
          en: `The chef shows campers how to make that day’s lunch, and campers eat what they cook. On the winter camp menu: ${winterMenu.lunch.en}.`,
          zh: `由主廚帶著營員親手完成當日午餐，自己做的就是當天的午餐。冬季營隊的菜色有${winterMenu.lunch.zh}。`,
        },
      },
      {
        icon: 'Salad',
        title: { en: 'Special diets, handled', zh: '特殊飲食都照顧' },
        body: {
          en: 'Pre-registered non-beef, pork-free, vegetarian and allergy-safe trays for every meal.',
          zh: '事先登記不吃牛、不吃豬、蛋奶素與過敏者專屬餐盤，每餐都有妥善準備。',
        },
      },
      {
        icon: 'CloudRain',
        title: { en: 'Rainy-day headquarters', zh: '雨天備案大本營' },
        body: {
          en: 'Rain or cold front? Activities move into the hall and covered pavilion. Any extra cost is ours; any savings are refunded.',
          zh: '下雨或寒流時，活動移至大廳與遮雨棚。因變更所增加的費用由主辦單位負擔，所減省的費用核實退還。',
        },
      },
    ],
    facts: [
      { label: { en: 'Meals', zh: '餐點' }, value: { en: 'Breakfast buffet · DIY lunch · Evening buffet', zh: '自助式早餐・DIY 午餐・自助式晚餐' } },
      { label: { en: 'Final evening', zh: '最後一晚' }, value: { en: 'Signature family dinner with Wagyu beef', zh: '和牛招牌家宴' } },
      { label: { en: 'Dietary trays', zh: '特殊餐盤' }, value: { en: 'Non-beef · Pork-free · Vegetarian · Allergy-safe', zh: '不吃牛・不吃豬・蛋奶素・過敏專盤' } },
      { label: { en: 'Rain plan', zh: '雨天備案' }, value: { en: 'Dining hall + covered pavilion', zh: '斑比大飯店＋遮雨棚' } },
    ],
    menu: {
      title: { en: 'A day at the table', zh: '一日餐桌' },
      intro: {
        en: 'Three meals a day, with a signature dinner to finish. These are the dishes on the winter camp menu. Which dish is served on which day is not set yet.',
        zh: '每日三餐，最後一晚以招牌家宴壓軸。以下為冬季營隊的菜色，各菜色的供應日尚未排定。',
      },
      sections: [
        {
          title: { en: 'Breakfast', zh: '早餐' },
          icon: 'Sunrise',
          tag: { en: 'Buffet breakfast', zh: '自助式早餐' },
          items: [
            { name: { en: 'Eggs', zh: '雞蛋' } },
            { name: { en: 'Bacon', zh: '培根' } },
            { name: { en: 'Bread and sandwiches', zh: '麵包與三明治' } },
            { name: { en: 'Milk and soy milk', zh: '牛奶與豆漿' } },
          ],
        },
        {
          title: { en: 'Lunch', zh: '午餐' },
          icon: 'ChefHat',
          tag: { en: 'DIY lunch with the chef', zh: '主廚帶領的 DIY 午餐' },
          items: [
            { name: { en: 'Curry', zh: '咖哩' } },
            { name: { en: 'Handmade pizza', zh: '手工披薩' }, note: { en: 'On pizza day, campers make their own.', zh: '披薩日由營員親手製作。' } },
            { name: { en: 'Rice balls', zh: '飯糰' } },
            { name: { en: 'Donburi rice box', zh: '丼飯餐盒' } },
          ],
        },
        {
          title: { en: 'Dinner', zh: '晚餐' },
          icon: 'Utensils',
          tag: { en: 'Evening buffet', zh: '自助式晚餐' },
          items: [
            { name: { en: 'Meatball pasta, corn soup and bread', zh: '肉丸義大利麵、玉米濃湯與麵包' } },
            { name: { en: 'Fried chicken and braised pork, with vegetables and rice', zh: '炸雞與滷肉，搭配青菜與白飯' } },
          ],
        },
        {
          title: { en: 'Signature family dinner', zh: '招牌家宴' },
          icon: 'Star',
          tag: { en: 'Final evening', zh: '最後一晚' },
          highlight: true,
          items: [
            { name: { en: 'Wagyu beef', zh: '和牛' }, note: { en: 'The centrepiece of the last evening of camp.', zh: '營隊最後一晚的主角。' } },
            { name: { en: 'Non-beef and vegetarian alternatives', zh: '不吃牛與素食專屬餐點' }, note: { en: 'For campers who registered them on the health form.', zh: '提供給已在健康調查表登記的營員。' } },
          ],
        },
      ],
      footnotes: [
        {
          en: 'Non-beef, pork-free, vegetarian and allergy trays are pre-registered on the health form.',
          zh: '不吃牛、不吃豬、蛋奶素與過敏餐盤，請於健康調查表事先登記。',
        },
        ...(winterMenu.allergensProvided
          ? []
          : [
              {
                en: 'The kitchen has not yet given the allergen details for each dish, so the dishes carry no allergen tags. If your camper has a food allergy, please be sure to write it on the health form.',
                zh: '廚房尚未提供各菜色的過敏原資訊，因此菜單上暫不標示過敏原。孩子若有食物過敏，請務必於健康調查表中填寫。',
              },
            ]),
        {
          en: 'Snacks between meals are not part of the camp fee: campers use snack coupons at the Airstream snack shop beside the pool.',
          zh: '正餐之間的點心不包含在營隊費用內：營員憑點心券到戲水池旁的 Airstream 點心站兌換。',
        },
      ],
    },
  },

  // ───────────────────────────────────────────────────────────── POOL
  {
    id: 'pool',
    name: { en: 'Aurora Pool & Airstream Snack Shop', zh: '極光戲水池與 Airstream 點心站' },
    tagline: {
      en: 'A palm-fringed pool, watched over by a certified lifeguard.',
      zh: '棕櫚環繞的戲水池，由合格救生員守護。',
    },
    summary: {
      en: `Bambi’s Aurora Pool is an open-air, palm-fringed pool that is ${pool.depthMinCm} cm at the shallow end and ${pool.depthMaxCm} cm at its deepest. In Summer sessions, campers join supervised pool relays and splash time with a Sports Administration–certified lifeguard on duty, and the silver Airstream snack shop sits right at the pool’s edge. The pool has three depth levels, with curved steps and rounded edges throughout.`,
      zh: `斑比跳跳的極光戲水池是一座棕櫚環繞的露天泳池，水深從最淺 ${pool.depthMinCm} 公分到最深 ${pool.depthMaxCm} 公分。夏季梯次期間，營員在體育署合格救生員值勤下進行戲水接力與戲水時光，銀色 Airstream 點心站就在池畔邊。泳池設計三段水深，並以弧形階梯與圓潤邊緣打造。`,
    },
    icon: 'Waves',
    accent: '#0f8f9d',
    accent2: '#8ef0e6',
    summerOnly: true,
    features: [
      {
        icon: 'Waves',
        title: { en: `${pool.depthMinCm}–${pool.depthMaxCm} cm water`, zh: `${pool.depthMinCm}–${pool.depthMaxCm} 公分水深` },
        body: {
          en: `A gentle ${pool.depthMinCm} cm shallow end and nothing deeper than ${pool.depthMaxCm} cm. There is no deep end.`,
          zh: `最淺 ${pool.depthMinCm} 公分，最深也只有 ${pool.depthMaxCm} 公分，沒有深水區。`,
        },
      },
      {
        icon: 'LifeBuoy',
        title: { en: 'Certified lifeguard on duty', zh: '合格救生員值勤' },
        body: {
          en: 'A Sports Administration–certified lifeguard (體育署合格救生員) is on duty for every Summer pool session.',
          zh: '夏季每場戲水活動皆有體育署合格救生員（救生員證）值勤。',
        },
      },
      {
        icon: 'Users',
        title: { en: 'Counselors on the deck', zh: '隊輔在池畔陪同' },
        body: {
          en: 'Counselors stay on the pool deck and do headcounts throughout.',
          zh: '隊輔全程在池畔陪同，並隨時清點人數。',
        },
      },
      {
        icon: 'ShowerHead',
        title: { en: 'Changing rooms & showers', zh: '更衣室與淋浴間' },
        body: {
          en: 'Changing rooms, showers, a hot-and-cold drinking-water dispenser and a spin-dryer for wet swimwear sit beside the pool.',
          zh: '池畔設有更衣室、淋浴間、飲水機，並備有泳衣脫水機。',
        },
      },
      {
        icon: 'CupSoda',
        title: { en: 'Airstream snack shop', zh: 'Airstream 點心站' },
        body: {
          en: 'The classic silver Airstream right at the pool’s edge is the camp snack shop. Campers exchange their snack coupons here for soft drinks and snacks. No alcohol is served during camp.',
          zh: '池畔邊那輛經典銀色 Airstream 就是營隊點心站，營員憑點心券在這裡兌換無酒精飲品與點心。營期間不供應任何含酒精飲品。',
        },
      },
      {
        icon: 'Sun',
        title: { en: 'Sun-smart by design', zh: '防曬補水不馬虎' },
        body: {
          en: 'Sunscreen, hats, shade and scheduled water breaks are part of every pool session.',
          zh: '每場戲水活動都納入防曬、帽子、遮陰與定時補水。',
        },
      },
    ],
    facts: [
      { label: { en: 'Water depth', zh: '水深' }, value: { en: `${pool.depthMinCm}–${pool.depthMaxCm} cm`, zh: `${pool.depthMinCm}–${pool.depthMaxCm} 公分` } },
      { label: { en: 'When', zh: '開放梯次' }, value: { en: 'Summer sessions', zh: '夏季梯次' } },
      { label: { en: 'Lifeguard', zh: '救生員' }, value: { en: 'Sports Administration–certified', zh: '體育署合格救生員' } },
      { label: { en: 'Pack', zh: '請自備' }, value: { en: 'Swimwear, towel, sunscreen', zh: '泳衣、毛巾、防曬用品' } },
    ],
    seasonNote: {
      winter: {
        en: 'In Winter camp the pool is scenery, not part of the schedule. Winter’s water adventure is lakeside kayaking; pool relays belong to Summer sessions.',
        zh: '冬季營隊不安排戲水活動，戲水池是園區風景。冬季的水上冒險是湖畔獨木舟，戲水接力屬於夏季梯次。',
      },
      summer: {
        en: 'Summer sessions: supervised pool relays with a certified lifeguard on duty.',
        zh: '夏季梯次：合格救生員值勤下的戲水接力。',
      },
    },
    menu: {
      title: { en: 'Airstream Snack Shop', zh: 'Airstream 點心站' },
      intro: {
        en: 'Cold drinks and light bites, exchanged for snack coupons. A kid-friendly menu with no alcohol.',
        zh: '憑點心券兌換的冰涼飲品與輕食。兒童友善菜單，完全不含酒精。',
      },
      sections: [
        {
          title: { en: 'Cool drinks', zh: '冰涼飲品' },
          icon: 'CupSoda',
          items: [
            { name: { en: 'Fresh lemonade', zh: '鮮榨檸檬水' }, vegetarian: true, caffeineFree: true },
            { name: { en: 'Iced barley tea', zh: '冰麥茶' }, note: { en: 'Roasted-barley tea, naturally caffeine-free.', zh: '烘焙大麥茶，天然無咖啡因。' }, allergens: ['gluten'], vegetarian: true, caffeineFree: true },
            { name: { en: 'Orange or apple juice', zh: '柳橙汁或蘋果汁' }, vegetarian: true, caffeineFree: true },
            { name: { en: 'Chilled milk or chocolate milk', zh: '冰鮮乳或巧克力牛奶' }, allergens: ['milk'], vegetarian: true },
          ],
        },
        {
          title: { en: 'Frozen treats', zh: '冰涼甜點' },
          icon: 'IceCreamCone',
          items: [
            { name: { en: 'Fruit ice pops', zh: '水果冰棒' }, note: { en: 'Watermelon, mango and lemon.', zh: '西瓜、芒果與檸檬口味。' }, vegetarian: true },
            { name: { en: 'Frozen yogurt cup', zh: '優格冰杯' }, allergens: ['milk'], vegetarian: true },
            { name: { en: 'Shaved ice with fresh fruit', zh: '水果剉冰' }, vegetarian: true },
          ],
        },
        {
          title: { en: 'Poolside bites', zh: '池畔輕食' },
          icon: 'Sandwich',
          items: [
            { name: { en: 'Fresh fruit cup', zh: '新鮮水果杯' }, note: { en: 'Whatever is in season.', zh: '依當季水果供應。' }, vegetarian: true },
            { name: { en: 'Margherita pizza slice', zh: '瑪格麗特披薩切片' }, allergens: ['gluten', 'milk'], vegetarian: true },
            { name: { en: 'Grilled corn', zh: '烤玉米' }, vegetarian: true },
            { name: { en: 'Sweet potato fries', zh: '地瓜薯條' }, vegetarian: true },
            { name: { en: 'Popcorn', zh: '爆米花' }, vegetarian: true },
          ],
        },
      ],
      footnotes: [
        { en: `Snacks are not part of the camp fee. Parents can choose a coupon pack of ${COUPON_PACKS.en}; the coupons are handed to campers at check-in.`, zh: `點心不包含在營隊費用內。家長可選購 ${COUPON_PACKS.zh} 的點心券，於報到時交給營員。` },
        { en: 'Drinking water is free at the water dispenser by the pool. Items on this menu vary with the season.', zh: '池畔飲水機免費供應飲用水。點心站供應品項依季節調整。' },
        { en: 'Allergies and dietary needs recorded on the health form are checked by the nurse and dining lead.', zh: '健康調查表登記的過敏與飲食需求，由護理師與餐飲安全主管核對。' },
      ],
    },
    safety: {
      title: { en: 'Pool Safety Rules', zh: '戲水池安全守則' },
      rules: [
        {
          icon: 'LifeBuoy',
          title: { en: 'Lifeguard and counselors, always', zh: '救生員與隊輔全程在場' },
          body: {
            en: 'Pool time happens only when a certified lifeguard is on duty and counselors are on the deck. At every other time the pool is closed and off-limits.',
            zh: '只有在合格救生員值勤、隊輔在池畔陪同時才開放戲水；其他時間戲水池一律關閉，不得靠近。',
          },
        },
        {
          icon: 'Users',
          title: { en: 'Buddy system and headcounts', zh: '夥伴制與清點人數' },
          body: {
            en: 'Campers swim in pairs. Counselors count heads when entering, midway through and when leaving.',
            zh: '營員兩兩一組結伴戲水，隊輔會在入池、中途與離池時清點人數。',
          },
        },
        {
          icon: 'ShieldCheck',
          title: { en: 'We know every camper’s water comfort', zh: '掌握每位營員的水性' },
          body: {
            en: 'Parents tell us on the health form whether a camper is a non-swimmer, a beginner or comfortable in water. Non-swimmers and beginners wear a life jacket and stay at the shallow end.',
            zh: '家長在健康調查表填寫營員為不諳水性、初學或熟悉水性。不諳水性與初學者穿著救生衣，並留在淺水區。',
          },
        },
        {
          icon: 'Footprints',
          title: { en: 'Walk, never run', zh: '池畔只能走路' },
          body: {
            en: 'The pool deck is slippery when wet, so walking only.',
            zh: '池畔濕滑，請勿奔跑嬉鬧。',
          },
        },
        {
          icon: 'Ban',
          title: { en: 'No diving or rough play', zh: '禁止跳水與推擠' },
          body: {
            en: `The water is ${pool.depthMinCm}–${pool.depthMaxCm} cm deep, so no diving, flips from the edge, dunking or pushing.`,
            zh: `水深僅 ${pool.depthMinCm}–${pool.depthMaxCm} 公分，禁止跳水、邊緣翻滾、按壓他人入水或推擠。`,
          },
        },
        {
          icon: 'Volume2',
          title: { en: 'One long whistle means freeze', zh: '長哨聲代表立即停止' },
          body: {
            en: 'Everyone stops, looks at the lifeguard and leaves the water calmly when told.',
            zh: '聽到長哨聲，所有人立刻停止動作、看向救生員，待指示後有秩序離開水池。',
          },
        },
        {
          icon: 'ShowerHead',
          title: { en: 'Rinse first, swimwear only', zh: '先沖澡、穿泳裝入池' },
          body: {
            en: 'A quick shower before entering. Swimwear only in the water, and no glass or food on the pool deck.',
            zh: '入池前先沖澡，僅限穿泳裝下水，池畔禁止攜帶玻璃製品與食物。',
          },
        },
        {
          icon: 'Sun',
          title: { en: 'Sun and water breaks', zh: '防曬與補水' },
          body: {
            en: 'Sunscreen is reapplied, hats go on and water breaks are scheduled so nobody overheats.',
            zh: '定時補擦防曬、戴帽子，並安排補水休息，避免中暑。',
          },
        },
        {
          icon: 'CloudRain',
          title: { en: 'Weather call', zh: '天候應變' },
          body: {
            en: 'At the first thunder or lightning, or in heavy rain, everyone leaves the water and the day moves to the dining hall’s indoor plan.',
            zh: '一聽到雷聲、看見閃電或遇到大雨，所有人立即離水，行程轉至斑比大飯店的室內備案。',
          },
        },
      ],
    },
  },

  // ───────────────────────────────────────────────────────────── CINEMA
  {
    id: 'cinema',
    name: { en: 'Star Cinema', zh: '星空電影院' },
    tagline: { en: 'Movie night under the stars — a camp highlight.', zh: '星空下的電影之夜，營隊亮點。' },
    summary: {
      en: 'When night falls, the lawn beside the campfire becomes an open-air cinema: a big screen, rows of camp chairs, string lights overhead and the fire crackling close by. Every film is shown under a public-performance licence (公播版) and is chosen to suit the campers’ ages.',
      zh: '夜幕低垂後，營火旁的草地化身露天電影院：大螢幕、成排的露營椅、頭頂的串燈，還有一旁劈啪作響的營火。所有影片皆為取得公開播映授權的公播版，並依營員年齡挑選。',
    },
    icon: 'Film',
    accent: '#3b3f7a',
    accent2: '#c9c2ff',
    features: [
      { icon: 'Film', title: { en: 'Big screen on the lawn', zh: '草地上的大螢幕' }, body: { en: 'An outdoor screen with camp chairs set out in rows on the grass.', zh: '戶外大螢幕，草地上整齊排好露營椅。' } },
      { icon: 'BadgeCheck', title: { en: 'Licensed films only', zh: '只播公播版影片' }, body: { en: 'Films are public-performance licensed (公播版) and age-appropriate for the campers.', zh: '影片皆為公播版授權，內容適合營員年齡。' } },
      { icon: 'Flame', title: { en: 'Campfire alongside', zh: '營火相伴' }, body: { en: 'The campfire circle is only a few steps away.', zh: '營火區就在旁邊，幾步路就到。' } },
      { icon: 'Users', title: { en: 'Seated with your team', zh: '與小隊同坐' }, body: { en: 'Teams sit together with their counselors.', zh: '各小隊與隊輔坐在一起。' } },
    ],
    facts: [
      { label: { en: 'Show time', zh: '放映時間' }, value: { en: 'After dark', zh: '天黑之後' } },
      { label: { en: 'Where', zh: '地點' }, value: { en: 'Lawn beside the campfire', zh: '營火區旁草地' } },
      { label: { en: 'Films', zh: '影片' }, value: { en: 'Public-performance licensed', zh: '公播版授權' } },
    ],
    seasonNote: {
      winter: { en: 'Winter nights: bring your warm coat and a fleece layer.', zh: '冬季夜晚：請穿上保暖外套與刷毛外層。' },
      summer: { en: 'Summer nights: mosquito repellent before the show.', zh: '夏季夜晚：開演前先噴防蚊液。' },
    },
    safety: {
      title: { en: 'Cinema Night Rules', zh: '電影之夜守則' },
      rules: [
        { icon: 'Users', title: { en: 'Stay with your team', zh: '與小隊同行' }, body: { en: 'Walk to and from the lawn with your counselor, and tell them before you leave your seat.', zh: '由隊輔帶隊往返草地，離開座位前先告訴隊輔。' } },
        { icon: 'Flame', title: { en: 'Chairs stay clear of the fire', zh: '座椅遠離營火' }, body: { en: 'Seating stays in the marked area, away from the campfire circle.', zh: '座椅擺放在標示範圍內，與營火區保持距離。' } },
        { icon: 'Moon', title: { en: 'Torch for the walk back', zh: '回程使用手電筒' }, body: { en: 'Counselors light the path back to the vans.', zh: '隊輔會照亮回露營車的路。' } },
      ],
    },
  },

  // ───────────────────────────────────────────────────────────── CAMPFIRE
  {
    id: 'campfire',
    name: { en: 'Starlight Campfire Circle', zh: '星空營火圈' },
    tagline: {
      en: 'S’mores, skits and trivia under the stars.',
      zh: '在星空下烤棉花糖、演短劇、玩問答。',
    },
    summary: {
      en: 'On campfire nights the whole camp gathers around the fire for S’mores, team skits and trivia. It is the loudest, funniest and warmest part of the day, with counselors tending the fire throughout.',
      zh: '營火之夜，全營隊圍坐營火旁，一起烤棉花糖夾心餅、演出團隊短劇、玩問答。這是一天中最熱鬧、最歡樂也最溫暖的時刻，營火全程由隊輔看顧。',
    },
    icon: 'Flame',
    accent: '#c4561f',
    accent2: '#ffc27a',
    features: [
      { icon: 'Flame', title: { en: 'Campfire S’mores', zh: '營火棉花糖夾心餅' }, body: { en: 'Toast, sandwich, repeat — with long sticks and a counselor close by.', zh: '用長長的烤叉烤棉花糖，隊輔就在身邊。' } },
      { icon: 'Sparkles', title: { en: 'Skits & Trivia Night', zh: '短劇與問答之夜' }, body: { en: 'Teams write, rehearse and perform their own skits, then go head to head in camp trivia.', zh: '小隊自己編劇、排練、演出，接著進行營隊知識問答對決。' } },
      { icon: 'Moon', title: { en: 'Night ecology walk', zh: '夜間生態散步' }, body: { en: 'A short, counselor-led walk to listen for night sounds.', zh: '由隊輔帶領的夜間散步，一起聆聽夜晚的聲音。' } },
      { icon: 'Clock', title: { en: 'Evening check, then lights out', zh: '晚間檢查後熄燈' }, body: { en: 'An evening van check wraps up the day.', zh: '晚間內務檢查後熄燈就寢。' } },
    ],
    facts: [
      { label: { en: 'Evening', zh: '時段' }, value: { en: 'Campfire S’mores, Skits & Trivia', zh: '營火棉花糖、短劇與問答' } },
    ],
    seasonNote: {
      winter: { en: 'Winter evenings: a warm coat and fleece layers are on the packing list.', zh: '冬季夜晚：行李清單包含保暖外套與刷毛外層。' },
      summer: { en: 'Summer evenings: mosquito repellent is on the packing list.', zh: '夏季夜晚：行李清單包含防蚊液。' },
    },
    safety: {
      title: { en: 'Campfire Safety', zh: '營火安全守則' },
      rules: [
        { icon: 'Flame', title: { en: 'Counselors tend the fire', zh: '營火由隊輔看顧' }, body: { en: 'Only counselors add wood or adjust the fire, and it never burns unattended.', zh: '只有隊輔能添柴與調整火勢，營火絕不無人看守。' } },
        { icon: 'Users', title: { en: 'Sit on the logs', zh: '坐在原木座位上' }, body: { en: 'Everyone stays seated on the log ring, outside the stone circle.', zh: '大家坐在原木圈上，保持在石圈之外。' } },
        { icon: 'Shirt', title: { en: 'Tie back hair and loose sleeves', zh: '綁好頭髮、收好衣袖' }, body: { en: 'Long hair and loose clothing stay clear of the flames.', zh: '長髮與寬鬆衣物遠離火焰。' } },
        { icon: 'Ban', title: { en: 'Nothing thrown into the fire', zh: '不可丟東西進火堆' }, body: { en: 'Only counselor-approved firewood goes in.', zh: '只有隊輔同意的木柴可以放入火堆。' } },
        { icon: 'Droplets', title: { en: 'Water stays within reach', zh: '隨時備妥滅火水源' }, body: { en: 'A water source and extinguisher stay beside the circle.', zh: '營火圈旁隨時備有水源與滅火器。' } },
      ],
    },
  },

  // ───────────────────────────────────────────────────────────── KAYAK
  {
    id: 'kayak',
    name: { en: 'Kayak Lake (Tiao-Tiao Boats)', zh: '跳跳船體驗區（獨木舟）' },
    tagline: {
      en: 'Paddle the lake with a coach beside you.',
      zh: '在教練陪伴下，划向湖心。',
    },
    summary: {
      en: 'Bambi calls its kayaks “Tiao-Tiao boats” (跳跳船). Coaches brief campers on the dock, then campers paddle single or double kayaks on the calm lake — always in a properly fitted life jacket. Lakeside kayaking is the highlight of Winter camp and a favorite in Summer too.',
      zh: '斑比跳跳把獨木舟叫做「跳跳船」。教練先在碼頭向營員說明，再由營員划著單人或雙人獨木舟在平靜的湖面探索，全程穿著合身的救生衣。湖畔獨木舟是冬季營隊的重頭戲，夏季同樣受歡迎。',
    },
    icon: 'Sailboat',
    accent: '#2a7f8e',
    accent2: '#9fd8e0',
    features: [
      {
        icon: 'Sailboat',
        title: { en: 'Single and double kayaks', zh: '單人與雙人獨木舟' },
        body: {
          en: 'Paddle solo or share a double with a friend.',
          zh: '可以獨自划一艘，也可以跟朋友同乘雙人艇。',
        },
      },
      {
        icon: 'LifeBuoy',
        title: { en: 'Life jacket, every time', zh: '全程穿著救生衣' },
        body: {
          en: 'Every camper wears a fitted life jacket from the dock to the shore. Child-size jackets are provided.',
          zh: '從碼頭上船到回岸，所有營員全程穿著合身救生衣，園區備有兒童尺寸。',
        },
      },
      {
        icon: 'Compass',
        title: { en: 'Coach-led first paddle', zh: '教練帶領的第一次划槳' },
        body: {
          en: 'A short dock briefing covers sitting, paddling and steering before anyone launches.',
          zh: '下水前先在碼頭簡報坐姿、划槳與轉向，所有人準備好才出發。',
        },
      },
      {
        icon: 'Bird',
        title: { en: 'Share the lake with waterbirds', zh: '與水鳥共享湖面' },
        body: {
          en: 'Egrets and other waterbirds feed along the shoreline — a quiet paddle gets you closest.',
          zh: '白鷺等水鳥在岸邊覓食，放輕划槳的聲音，就能靠得最近。',
        },
      },
    ],
    facts: [
      { label: { en: 'Boats', zh: '船型' }, value: { en: 'Single & double kayaks', zh: '單人與雙人獨木舟' } },
      { label: { en: 'Life jackets', zh: '救生衣' }, value: { en: 'Required for everyone', zh: '全員必穿' } },
      { label: { en: 'Highlight', zh: '亮點' }, value: { en: 'Winter camp headline activity', zh: '冬季營隊主打活動' } },
    ],
    seasonNote: {
      winter: {
        en: 'Winter highlight: crisp air, calm water and copper-toned cypress along the shore.',
        zh: '冬季亮點：清冽空氣、平靜湖面，與岸邊泛著銅色的落羽松。',
      },
    },
    safety: {
      title: { en: 'Kayak Safety Rules', zh: '獨木舟安全守則' },
      rules: [
        {
          icon: 'LifeBuoy',
          title: { en: 'Life jacket on and buckled', zh: '穿妥並扣緊救生衣' },
          body: {
            en: 'Before anyone steps onto the dock, the jacket is fitted and checked by a counselor.',
            zh: '踏上碼頭前，由隊輔確認救生衣合身並扣緊。',
          },
        },
        {
          icon: 'Users',
          title: { en: 'Never at the lake alone', zh: '絕不單獨靠近湖邊' },
          body: {
            en: 'Campers go to the lake only with a counselor.',
            zh: '未經隊輔陪同，不得單獨靠近湖泊。',
          },
        },
        {
          icon: 'ShieldCheck',
          title: { en: 'Water comfort comes first', zh: '依水性安排' },
          body: {
            en: 'Non-swimmers and beginners paddle in doubles beside a coach or counselor.',
            zh: '不諳水性與初學的營員，由教練或隊輔陪同，搭乘雙人艇。',
          },
        },
        {
          icon: 'Anchor',
          title: { en: 'Stay seated', zh: '全程坐穩' },
          body: {
            en: 'No standing and no rocking the boat — it keeps everyone dry and safe.',
            zh: '不站起來、不搖晃船身，大家才能安全又不落水。',
          },
        },
        {
          icon: 'Map',
          title: { en: 'Stay inside the marked area', zh: '待在標示範圍內' },
          body: {
            en: 'Paddle only inside the zone the coach marks, and return when the whistle blows.',
            zh: '只在教練標示的水域內划行，聽到哨聲就回岸。',
          },
        },
        {
          icon: 'Hand',
          title: { en: 'Kind paddling', zh: '友善划船' },
          body: {
            en: 'No splashing or bumping other boats.',
            zh: '不潑水、不碰撞其他船隻。',
          },
        },
        {
          icon: 'Shirt',
          title: { en: 'Dress for the water', zh: '穿著與裝備' },
          body: {
            en: 'Secure sandals or sneakers that can get wet, a hat, and a water bottle clipped on. Loose items stay ashore.',
            zh: '穿可以弄濕、不易脫落的鞋子，戴帽子，水壺扣好；零散物品請留在岸上。',
          },
        },
        {
          icon: 'Wind',
          title: { en: 'Weather call', zh: '天候應變' },
          body: {
            en: 'Strong wind or lightning? Paddling pauses and everyone heads ashore.',
            zh: '遇強風或閃電，立即暫停划船並回岸。',
          },
        },
      ],
    },
  },

  // ───────────────────────────────────────────────────────────── BIRDS
  {
    id: 'birds',
    name: { en: 'Wild Waterbird Lake', zh: '野生水鳥觀賞區' },
    tagline: { en: 'Hundreds of egrets fly home here at dusk.', zh: '黃昏時分，上百隻鷺鳥在這裡歸巢。' },
    summary: {
      en: 'The west lake is a wildlife habitat, kept quiet for the birds. Cattle egrets (黃頭鷺) roost in the trees at its centre, and between about 4 and 6 pm they return in flocks — a sight campers watch from the shore and from the eco-tram. Ducks and geese roam the grounds, and bald cypress trees line the bank.',
      zh: '西側的湖是野生動物棲地，特別為鳥類保持安靜。黃頭鷺在湖心的樹叢棲息，約下午四點到六點成群歸巢，營員可以在岸邊或遊園車上觀賞。園區裡還有鴨群與大白鵝，岸邊則是成排的落羽松。',
    },
    icon: 'Bird',
    accent: '#3f7f6a',
    accent2: '#bfe6d2',
    features: [
      { icon: 'Bird', title: { en: 'Egrets returning at dusk', zh: '黃昏鷺鳥歸巢' }, body: { en: 'Cattle egrets come home in flocks between about 16:00 and 18:00.', zh: '黃頭鷺約在 16:00 到 18:00 之間成群歸巢。' } },
      { icon: 'Binoculars', title: { en: 'Watch from shore or tram', zh: '岸邊或遊園車觀賞' }, body: { en: 'The lakeside path and the eco-tram both give a clear view without disturbing the birds.', zh: '湖畔步道與遊園車都能清楚觀賞，又不打擾鳥類。' } },
      { icon: 'TreePine', title: { en: 'Bald cypress shoreline', zh: '落羽松湖岸' }, body: { en: 'Bald cypress trees line the bank and turn copper in winter.', zh: '岸邊成排落羽松，冬季會轉為紅銅色。' } },
      { icon: 'Leaf', title: { en: 'A habitat, kept quiet', zh: '安靜的棲地' }, body: { en: 'No boats and no swimming here. Kayaking happens on the east lake.', zh: '這裡不划船、不戲水；獨木舟活動在東側的湖進行。' } },
    ],
    facts: [
      { label: { en: 'Best time', zh: '最佳時段' }, value: { en: 'About 16:00–18:00', zh: '約 16:00–18:00' } },
      { label: { en: 'Residents', zh: '常見生態' }, value: { en: 'Cattle egrets, ducks, geese', zh: '黃頭鷺、鴨、大白鵝' } },
      { label: { en: 'Lakeside units', zh: '湖畔露營車' }, value: { en: 'Zones F and G', zh: 'F 區與 G 區' } },
    ],
    seasonNote: {
      winter: { en: 'Winter: the bald cypress along the shore turns copper.', zh: '冬季：岸邊落羽松轉為紅銅色。' },
    },
    safety: {
      title: { en: 'Lakeside Rules', zh: '湖畔守則' },
      rules: [
        { icon: 'Users', title: { en: 'Never at the lake alone', zh: '絕不單獨靠近湖邊' }, body: { en: 'Campers go to the lakeshore only with a counselor.', zh: '未經隊輔陪同，不得單獨靠近湖泊。' } },
        { icon: 'Volume2', title: { en: 'Quiet voices', zh: '放低音量' }, body: { en: 'Calm voices keep the birds settled, so everyone sees more.', zh: '輕聲細語讓鳥兒安心，大家也能看到更多。' } },
        { icon: 'Ban', title: { en: 'No feeding, no chasing', zh: '不餵食、不追逐' }, body: { en: 'We watch wildlife from the path and leave it undisturbed.', zh: '在步道上觀察野生動物，不打擾牠們。' } },
      ],
    },
  },

  // ───────────────────────────────────────────────────────────── TRAM
  {
    id: 'tram',
    name: { en: 'Eco-Safari Tram', zh: '生態導覽遊園車' },
    tagline: {
      en: 'A guided loop through forest, meadow and lakeshore.',
      zh: '穿越森林、草原與湖畔的導覽小旅行。',
    },
    summary: {
      en: 'The eco-tram boards beside the reception unit and circles the grounds while a guide introduces the landscape and its wildlife. Egrets and other waterbirds gather around the lakes, and at dusk flocks return to roost — a sight campers don’t forget.',
      zh: '遊園車在接待處旁搭車，繞行整座營地，由導覽人員介紹地景與生態。白鷺等水鳥聚集在湖畔，黃昏時成群歸巢，是營員難忘的畫面。',
    },
    icon: 'Bird',
    accent: '#5b7f3a',
    accent2: '#cfe3a8',
    features: [
      {
        icon: 'Bus',
        title: { en: 'Guided loop', zh: '導覽環繞' },
        body: {
          en: 'A relaxed ride around the grounds with a guide explaining plants, birds and habitats along the way.',
          zh: '輕鬆繞行營地一圈，沿途由導覽人員介紹植物、鳥類與棲地。',
        },
      },
      {
        icon: 'Binoculars',
        title: { en: 'Waterbird watching', zh: '水鳥觀察' },
        body: {
          en: 'Spot egrets and other waterbirds at the lakes, then watch them fly home at dusk.',
          zh: '在湖畔找找白鷺等水鳥，黃昏時看牠們成群飛回棲地。',
        },
      },
      {
        icon: 'Leaf',
        title: { en: 'A restored habitat', zh: '重新復育的棲地' },
        body: {
          en: 'The 20,000-ping grounds were once a gravel quarry and have been restored into forest, meadow and lakes.',
          zh: '佔地約兩萬坪的營地前身為砂石場，經多年復育，如今有森林、草原與湖泊。',
        },
      },
    ],
    facts: [
      { label: { en: 'Grounds', zh: '園區規模' }, value: { en: 'About 20,000 ping (≈ 6.6 ha)', zh: '約兩萬坪（約 6.6 公頃）' } },
      { label: { en: 'Highlight', zh: '亮點' }, value: { en: 'Waterbirds returning at dusk', zh: '黃昏水鳥歸巢' } },
    ],
    seasonNote: {
      winter: { en: 'Bring a warm layer for the dusk ride.', zh: '黃昏搭車請多帶一件保暖外套。' },
    },
    safety: {
      title: { en: 'Tram Rules', zh: '搭乘守則' },
      rules: [
        { icon: 'Users', title: { en: 'Board only at the stop', zh: '只在站牌上下車' }, body: { en: 'A counselor lines up the team and counts everyone on and off.', zh: '由隊輔帶隊排隊，上下車時清點人數。' } },
        { icon: 'Hand', title: { en: 'Stay seated, hands inside', zh: '坐穩、手腳不外伸' }, body: { en: 'Hold the handrail while moving and keep arms and legs inside.', zh: '行進中請抓緊扶手，手腳都放在車內。' } },
        { icon: 'Volume2', title: { en: 'Quiet voices near the birds', zh: '靠近水鳥時放低音量' }, body: { en: 'Calm voices let us see more wildlife. We never feed or chase animals.', zh: '輕聲細語才能看到更多動物；我們不餵食、不追逐野生動物。' } },
      ],
    },
  },

  // ───────────────────────────────────────────────────────────── CARE
  {
    id: 'care',
    name: { en: 'Restrooms, AED & First Aid', zh: '洗手間・AED 與急救' },
    tagline: {
      en: 'A Registered Nurse on site, day and night.',
      zh: '日夜駐點的專任護理師。',
    },
    summary: {
      en: 'The service block beside the Grand Dining Hall has the public restrooms and the camp’s AED. A licensed Registered Nurse is stationed at camp around the clock to look after everyday scrapes, medications and anything unexpected. Every counselor, nurse and support worker provides a police criminal-record certificate (良民證) before camp begins.',
      zh: '斑比大飯店旁的服務區設有公共洗手間與 AED。營隊全天候駐點一位合格的專任護理師，照顧日常外傷、給藥與任何突發狀況。每位隊輔、護理師與支援人員，在營隊開始前都會提供警察刑事紀錄證明（良民證）。',
    },
    icon: 'HeartPulse',
    accent: '#2f7d6b',
    accent2: '#8fd3b6',
    features: [
      {
        icon: 'Stethoscope',
        title: { en: '24/7 Registered Nurse', zh: '24 小時專任護理師' },
        body: {
          en: 'A dedicated camp nurse (營隊專任護理師) lives on site for the whole session, including overnight.',
          zh: '營隊專任護理師全程駐點，夜間同樣在營地待命。',
        },
      },
      {
        icon: 'Pill',
        title: { en: 'Medication custody', zh: '藥物統一保管' },
        body: {
          en: 'Prescriptions are stored by the nurse and given at the times you write on the health form.',
          zh: '處方藥由護理師統一保管，並依您在健康調查表填寫的時間給藥。',
        },
      },
      {
        icon: 'ShieldCheck',
        title: { en: 'Background-checked team', zh: '背景查核的團隊' },
        body: {
          en: 'Counselors, nurse and support workers are screened, with a clean 良民證 on file for each.',
          zh: '隊輔、護理師與支援人員皆經查核，並備有良民證。',
        },
      },
      {
        icon: 'HeartPulse',
        title: { en: 'CPR + AED trained counselors', zh: 'CPR + AED 急救訓練隊輔' },
        body: {
          en: 'Counselors hold CPR + AED / first-aid certification and know exactly who to call.',
          zh: '隊輔具備 CPR + AED／急救訓練，清楚知道第一時間該聯繫誰。',
        },
      },
      {
        icon: 'Lock',
        title: { en: 'Private health records', zh: '健康資料保密' },
        body: {
          en: 'Medical and allergy details are seen only by the camp director, nurse, dining safety lead and insurer, and are securely destroyed within 30 days after camp.',
          zh: '過敏與病史資料僅限營隊主任、護理師、餐飲安全主管與承保保險公司於必要範圍內查閱，營隊結束後 30 日內安全銷毀。',
        },
      },
    ],
    facts: [
      { label: { en: 'Nurse on site', zh: '駐點護理師' }, value: { en: '24 hours, every day of camp', zh: '營期間每日 24 小時' } },
      { label: { en: 'Nearest hospital', zh: '就近醫院' }, value: venue.hospital },
      { label: { en: 'Counselor ratio', zh: '隊輔比例' }, value: { en: `About ${cohort.counselorRatio}`, zh: `約 ${cohort.counselorRatio}` } },
    ],
    safety: {
      title: { en: 'If your camper feels unwell', zh: '營員不舒服時' },
      rules: [
        {
          icon: 'Hand',
          title: { en: '1 · Tell any counselor', zh: '1 · 告訴任何一位隊輔' },
          body: {
            en: 'Any counselor can bring your camper to the nurse right away.',
            zh: '任何一位隊輔都能立刻陪營員找護理師。',
          },
        },
        {
          icon: 'Stethoscope',
          title: { en: '2 · The nurse checks and treats', zh: '2 · 護理師評估與處置' },
          body: {
            en: 'First aid, rest and medication are handled on site according to your health form.',
            zh: '依據您填寫的健康調查表，在營地內完成急救、休息與給藥。',
          },
        },
        {
          icon: 'Phone',
          title: { en: '3 · You hear from us first', zh: '3 · 第一時間聯繫家長' },
          body: {
            en: 'We contact the legal guardian first, then the backup contact if needed.',
            zh: '我們會先聯繫法定代理人，必要時再聯繫第二緊急聯絡人。',
          },
        },
        {
          icon: 'Siren',
          title: { en: '4 · Urgent? Straight to hospital', zh: '4 · 情況危急，立即送醫' },
          body: {
            en: 'If it is urgent and no guardian can be reached, staff take your camper to the nearest accredited hospital, as you authorize when you register.',
            zh: '若情況危急且一時無法聯繫上家長，依您報名時的緊急醫療授權，由營隊人員護送至鄰近合格醫療院所。',
          },
        },
      ],
    },
  },
]

export const AREA_BY_ID: Record<AreaId, Area> = Object.fromEntries(AREAS.map((a) => [a.id, a])) as Record<AreaId, Area>
