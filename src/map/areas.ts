import type { AreaId } from '../lib/types'
import { campConfig } from '../config/campConfig'
import type { Area } from './types'

const { cohort, pool, venue } = campConfig

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
    name: { en: 'Welcome Gate & Check-in', zh: '歡迎大門與報到處' },
    tagline: {
      en: 'Where every camper’s adventure begins.',
      zh: '每位營員的冒險，從這裡開始。',
    },
    summary: {
      en: 'Campers arrive at the Bambi gate in Sanwan, Miaoli, where counselors greet every family. Option A campers ride the round-trip charter bus from the Designated Tour Bus Zone near National Taichung Theater. Option B families drop off on Tuesday between 14:00 and 14:30, and campers ride the charter bus back on Friday.',
      zh: '營員抵達苗栗三灣斑比跳跳大門後，隊輔會親切迎接每個家庭。方案 A 營員搭乘由臺中國家歌劇院周邊指定遊覽車臨停區出發的專車往返；方案 B 家長於週二 14:00–14:30 送達園區，週五由遊覽車專車返回。',
    },
    icon: 'DoorClosed',
    accent: '#8a6a43',
    accent2: '#d4a373',
    features: [
      {
        icon: 'Bus',
        title: { en: 'Charter bus (Option A)', zh: '遊覽車專車（方案 A）' },
        body: {
          en: 'Round-trip charter bus from the Designated Tour Bus Zone near National Taichung Theater (Shizheng N. 2nd Rd.).',
          zh: '由臺中國家歌劇院周邊指定遊覽車臨停區（市政北二路）出發，專車來回接駁。',
        },
      },
      {
        icon: 'Car',
        title: { en: 'Parent drop-off (Option B)', zh: '家長送達（方案 B）' },
        body: {
          en: 'Tuesday 14:00–14:30 at the Sanwan gate. The Friday return charter bus is included.',
          zh: '週二 14:00–14:30 於三灣園區大門報到；週五搭乘遊覽車專車返回，費用已含。',
        },
      },
      {
        icon: 'Pill',
        title: { en: 'Medication handover', zh: '藥物交接' },
        body: {
          en: 'Medicines go to the Registered Nurse at check-in, in their original bag with your camper’s name on it.',
          zh: '報到時，個人藥物請裝於原藥袋並標註姓名，交由駐點護理師統一保管。',
        },
      },
      {
        icon: 'Users',
        title: { en: 'Walked to the vans', zh: '隊輔陪同入住' },
        body: {
          en: 'Counselors walk every camper to their camper van and age-based cabin team.',
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
      { label: { en: 'Option B drop-off', zh: '方案 B 報到' }, value: { en: 'Tuesday 14:00–14:30', zh: '週二 14:00–14:30' } },
      { label: { en: 'Gate curfew', zh: '大門管制' }, value: { en: 'Nightly at 23:00', zh: '每晚 23:00' } },
      { label: { en: 'Address', zh: '地址' }, value: venue.address },
    ],
    parentNote: {
      en: 'Arrive relaxed: counselors handle luggage and van assignments while you say your goodbyes.',
      zh: '輕鬆抵達：行李與露營車分配交給隊輔，您只需要好好跟孩子道別。',
    },
  },

  // ───────────────────────────────────────────────────────────── CARE
  {
    id: 'care',
    name: { en: 'Care Station', zh: '護理照護站' },
    tagline: {
      en: 'A Registered Nurse on site, day and night.',
      zh: '日夜駐點的專任護理師。',
    },
    summary: {
      en: 'A licensed Registered Nurse is stationed at camp around the clock to look after everyday scrapes, medications and anything unexpected. Every counselor, nurse and support worker provides a police criminal-record certificate (良民證) before camp begins.',
      zh: '營隊全天候駐點一位合格的專任護理師，照顧日常外傷、給藥與任何突發狀況。每位隊輔、護理師與支援人員，在營隊開始前都會提供警察刑事紀錄證明（良民證）。',
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
            en: 'Any counselor can bring your camper to the Care Station right away.',
            zh: '任何一位隊輔都能立刻陪營員前往護理照護站。',
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
            en: 'If it is urgent and no guardian can be reached, staff take your camper to the nearest accredited hospital, as authorized on the signed form.',
            zh: '若情況危急且一時無法聯繫上家長，依您簽署的授權書，由營隊人員護送至鄰近合格醫療院所。',
          },
        },
      ],
    },
  },

  // ───────────────────────────────────────────────────────────── VANS
  {
    id: 'vans',
    name: { en: 'Luxury Camper Vans', zh: '頂級豪華露營車' },
    tagline: {
      en: 'Hotel comfort, three campers to a van.',
      zh: '三人一車，飯店等級的舒適小窩。',
    },
    summary: {
      en: 'Campers sleep in Bambi’s climate-controlled luxury camper vans: three same-gender campers per van, each van with a double bed, a bunk bed and its own wet/dry bathroom. Vans sit in lakeside, meadow and forest settings, and counselors check every van each morning and evening.',
      zh: '營員入住斑比跳跳的冷暖空調頂級豪華露營車：每車三名同性別營員，配備一張雙人床、一組上下舖與獨立乾濕分離衛浴。露營車分佈於湖畔、草地與森林之間，隊輔每日早晚各檢查一次。',
    },
    icon: 'BedDouble',
    accent: '#3e6f8f',
    accent2: '#bcd7e6',
    features: [
      {
        icon: 'Users',
        title: { en: '3 campers per van', zh: '每車三名營員' },
        body: {
          en: 'Three same-gender campers share each van, grouped in age-based cabin teams.',
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
          title: { en: 'Lights out at 21:30', zh: '21:30 熄燈' },
          body: {
            en: 'An evening cabin check wraps up the day before lights out.',
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
      en: 'Four meals a day — and our rainy-day headquarters.',
      zh: '一泊四食的美味基地，也是雨天備案大本營。',
    },
    summary: {
      en: 'Breakfast, lunch, pizza afternoon tea and dinner are served in the Grand Dining Hall (斑比大飯店), with campfire snacks in the evening. When rain or a cold front arrives, the hall and the covered activity area host team challenges and craft workshops, so the day carries on.',
      zh: '早餐、午餐、披薩下午茶與晚餐都在斑比大飯店享用，晚間再加上營火點心。遇到下雨或寒流時，大廳與遮雨棚活動區會化身團隊挑戰與手作工坊，讓一天的行程照常進行。',
    },
    icon: 'Utensils',
    accent: '#a8652f',
    accent2: '#f0c58f',
    features: [
      {
        icon: 'Utensils',
        title: { en: 'Four daily meals (一泊四食)', zh: '一泊四食' },
        body: {
          en: 'Buffet breakfast, chef-led lunch, handmade Neapolitan pizza afternoon tea and a dinner feast — plus campfire snacks.',
          zh: '自助早餐、主廚帶領午餐、手工拿坡里披薩下午茶與晚餐盛宴，晚上還有營火點心。',
        },
      },
      {
        icon: 'Pizza',
        title: { en: 'Neapolitan Pizza Guild', zh: '拿坡里披薩工坊' },
        body: {
          en: 'Campers shape their own pizza with the chef, then enjoy it fresh-baked at afternoon tea.',
          zh: '營員跟著主廚親手整形披薩，下午茶時享用現烤美味。',
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
      { label: { en: 'Meals', zh: '餐點' }, value: { en: '4 daily + campfire snacks', zh: '每日四餐＋營火點心' } },
      { label: { en: 'Dietary trays', zh: '特殊餐盤' }, value: { en: 'Non-beef · Pork-free · Vegetarian · Allergy-safe', zh: '不吃牛・不吃豬・蛋奶素・過敏專盤' } },
      { label: { en: 'Rain plan', zh: '雨天備案' }, value: { en: 'Dining hall + covered pavilion', zh: '斑比大飯店＋遮雨棚' } },
    ],
    menu: {
      title: { en: 'A day at the table', zh: '一日餐桌' },
      intro: {
        en: 'The rhythm of meals across a camp day. Daily dishes change with the chef and the season.',
        zh: '營隊一日的用餐節奏。每日菜色會依主廚安排與季節調整。',
      },
      sections: [
        {
          title: { en: 'Breakfast', zh: '早餐' },
          icon: 'Sunrise',
          time: '08:00',
          items: [
            { name: { en: 'Buffet breakfast', zh: '自助早餐' }, note: { en: 'Hot and cold choices, fruit and drinks to start the day.', zh: '冷熱餐點、水果與飲品，元氣開場。' } },
          ],
        },
        {
          title: { en: 'Lunch', zh: '午餐' },
          icon: 'Soup',
          time: '12:00',
          items: [
            { name: { en: 'Chef-led lunch', zh: '主廚帶領午餐' }, note: { en: 'Prepared with the Culinary Guild.', zh: '與美食工坊一同完成。' } },
          ],
        },
        {
          title: { en: 'Afternoon tea', zh: '下午茶' },
          icon: 'Pizza',
          time: '15:30',
          items: [
            { name: { en: 'Handmade Neapolitan pizza', zh: '手工拿坡里披薩' }, note: { en: 'Shaped by campers, baked fresh.', zh: '營員親手整形，現烤上桌。' }, allergens: ['gluten', 'milk'] },
          ],
        },
        {
          title: { en: 'Dinner', zh: '晚餐' },
          icon: 'Utensils',
          time: '18:00',
          items: [
            { name: { en: 'Camp dinner feast', zh: '營隊晚餐盛宴' }, note: { en: 'A shared, family-style evening meal.', zh: '大家一起圍桌共享的豐盛晚餐。' } },
          ],
        },
        {
          title: { en: 'Campfire snacks', zh: '營火點心' },
          icon: 'Flame',
          time: '19:30',
          items: [
            { name: { en: 'S’mores by the fire', zh: '營火棉花糖夾心餅' }, allergens: ['gluten', 'milk', 'soy'], vegetarian: true },
          ],
        },
      ],
      footnotes: [
        {
          en: 'Non-beef, pork-free, vegetarian and allergy trays are pre-registered on the health form.',
          zh: '不吃牛、不吃豬、蛋奶素與過敏餐盤，請於健康調查表事先登記。',
        },
      ],
    },
  },

  // ───────────────────────────────────────────────────────────── POOL
  {
    id: 'pool',
    name: { en: 'Aurora Pool & Snack Shop', zh: '極光戲水池與點心站' },
    tagline: {
      en: 'A palm-fringed pool, watched over by a certified lifeguard.',
      zh: '棕櫚環繞的戲水池，由合格救生員守護。',
    },
    summary: {
      en: `Bambi’s Aurora Pool is an open-air, palm-fringed pool that is ${pool.depthMinCm} cm at the shallow end and ${pool.depthMaxCm} cm at its deepest. In Summer sessions, campers join supervised pool relays and splash time with a Sports Administration–certified lifeguard on duty, and the snack shop right beside the pool keeps everyone refueled.`,
      zh: `斑比跳跳的極光戲水池是一座棕櫚環繞的露天泳池，水深從最淺 ${pool.depthMinCm} 公分到最深 ${pool.depthMaxCm} 公分。夏季梯次期間，營員在體育署合格救生員值勤下進行戲水接力與戲水時光，緊鄰池畔的點心站隨時補充體力。`,
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
          en: 'Changing rooms, showers, a drinking-water station and a spin-dryer for wet swimwear sit beside the pool.',
          zh: '池畔設有更衣室、淋浴間、飲水機，並備有泳衣脫水機。',
        },
      },
      {
        icon: 'CupSoda',
        title: { en: 'Poolside snack shop', zh: '池畔點心站' },
        body: {
          en: 'A silver retro trailer serving cold drinks and fresh snacks — every item alcohol-free.',
          zh: '復古銀色露營拖車改造的點心站，提供冰涼飲品與新鮮點心，全部不含酒精。',
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
      title: { en: 'Poolside Snack Shop', zh: '池畔點心站' },
      intro: {
        en: 'Cold drinks and light bites for after the splash. A kid-friendly menu with no alcohol.',
        zh: '戲水之後的冰涼飲品與輕食。兒童友善菜單，完全不含酒精。',
      },
      sections: [
        {
          title: { en: 'Cool drinks', zh: '冰涼飲品' },
          icon: 'CupSoda',
          items: [
            { name: { en: 'Chilled water', zh: '冰鎮飲用水' }, note: { en: 'Free refills at the water station.', zh: '飲水機可無限續杯。' }, vegetarian: true, caffeineFree: true },
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
        { en: 'Included in your camper’s fee — no spending money needed.', zh: '已含在營隊費用中，孩子不需要另外準備零用錢。' },
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

  // ───────────────────────────────────────────────────────────── KAYAK
  {
    id: 'kayak',
    name: { en: 'Lakeside Kayak Dock', zh: '湖畔獨木舟碼頭（跳跳船）' },
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
          en: 'Every camper wears a fitted life jacket from the dock to the shore.',
          zh: '從碼頭上船到回岸，所有營員全程穿著合身救生衣。',
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

  // ───────────────────────────────────────────────────────────── TRAM
  {
    id: 'tram',
    name: { en: 'Waterbird Eco-Safari Tram', zh: '歡樂遊園車生態導覽' },
    tagline: {
      en: 'A guided loop through forest, meadow and lakeshore.',
      zh: '穿越森林、草原與湖畔的導覽小旅行。',
    },
    summary: {
      en: 'The Happy Garden Tram circles the grounds while a guide introduces the landscape and its wildlife. Egrets and other waterbirds gather around the lakes, and at dusk flocks return to roost — a sight campers don’t forget.',
      zh: '歡樂遊園車繞行整座營地，由導覽人員介紹地景與生態。白鷺等水鳥聚集在湖畔，黃昏時成群歸巢，是營員難忘的畫面。',
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

  // ───────────────────────────────────────────────────────────── MEADOW
  {
    id: 'meadow',
    name: { en: 'Great Meadow', zh: '大草原挑戰場' },
    tagline: {
      en: 'Room to run, and a whole team cheering.',
      zh: '寬闊草地，整個小隊一起吶喊。',
    },
    summary: {
      en: 'The open meadow is home base for the morning team huddle and warm-up, Capture the Flag and lawn team challenges. Age-based cabin teams plan, cheer and play together, all in English.',
      zh: '開闊的大草原是晨間團隊集合與暖身、奪旗大戰與草地團隊挑戰的主場。依年齡分組的小隊在這裡一起討論、加油、玩，全程使用英語溝通。',
    },
    icon: 'Flag',
    accent: '#5d8f3a',
    accent2: '#d3ee9f',
    features: [
      { icon: 'Flag', title: { en: 'Capture the Flag', zh: '奪旗大戰' }, body: { en: 'Strategy, speed and teamwork across the full meadow.', zh: '在整片草原上比策略、比速度，更比團隊默契。' } },
      { icon: 'Zap', title: { en: 'Lawn challenges', zh: '草地團隊挑戰' }, body: { en: 'Relays and team puzzles led by counselors.', zh: '由隊輔帶領的接力賽與團隊任務。' } },
      { icon: 'Sun', title: { en: 'Morning Team Huddle & Warm-Up', zh: '晨間團隊集合與暖身' }, body: { en: 'A 09:00 team huddle to stretch, set goals and get moving.', zh: '09:00 小隊集合，伸展暖身、設定今日目標。' } },
      { icon: 'Compass', title: { en: 'Scavenger hunts', zh: '尋寶任務' }, body: { en: 'Clue-by-clue hunts that start and finish on the meadow.', zh: '從草原出發、在草原集合的線索尋寶。' } },
    ],
    facts: [
      { label: { en: 'Teams', zh: '分組' }, value: { en: 'Age-based cabin teams', zh: '依年齡小隊分組' } },
      { label: { en: 'Morning huddle', zh: '晨間集合' }, value: { en: '09:00', zh: '09:00' } },
    ],
    seasonNote: {
      winter: { en: 'Winter mornings start with extra warm-up and fleece layers.', zh: '冬季清晨多一點暖身，也別忘了穿保暖的刷毛外套。' },
      summer: { en: 'Summer play comes with shade, sunscreen and water breaks.', zh: '夏季遊戲搭配遮陰、防曬與補水休息。' },
    },
    safety: {
      title: { en: 'Field Rules', zh: '草地活動守則' },
      rules: [
        { icon: 'Footprints', title: { en: 'Closed shoes', zh: '穿包鞋' }, body: { en: 'Sneakers on the field keep feet safe on uneven ground.', zh: '草地凹凸不平，請穿運動鞋保護雙腳。' } },
        { icon: 'Flag', title: { en: 'Stay inside the flags', zh: '待在旗標範圍內' }, body: { en: 'Boundary flags mark the play area.', zh: '旗標標出活動範圍，請勿超出。' } },
        { icon: 'Smile', title: { en: 'Fair play, kind words', zh: '公平競賽、友善鼓勵' }, body: { en: 'We cheer teammates, thank opponents and help anyone who falls.', zh: '為隊友加油、感謝對手，並主動幫助跌倒的人。' } },
        { icon: 'GlassWater', title: { en: 'Water breaks', zh: '定時補水' }, body: { en: 'Everyone drinks regularly; tell a counselor if you feel dizzy or sore.', zh: '請定時補充水分，頭暈或疼痛時立刻告訴隊輔。' } },
      ],
    },
  },

  // ───────────────────────────────────────────────────────────── GUILD
  {
    id: 'guild',
    name: { en: 'Guild Grove & Covered Pavilion', zh: '戶外工坊與遮雨棚' },
    tagline: {
      en: 'Hands-on making under the trees — rain or shine.',
      zh: '在樹蔭下動手做，晴雨都不受影響。',
    },
    summary: {
      en: 'Outdoor guilds meet here: wilderness shelter and knot skills, paracord and moss-ball crafts, and the covered pavilion that keeps everything going when the weather turns.',
      zh: '戶外工坊在這裡集合：野外庇護所與繩結技巧、傘繩與苔球手作，還有遮雨棚，天氣轉變時活動也能照常進行。',
    },
    icon: 'Tent',
    accent: '#7a5a34',
    accent2: '#e2c391',
    features: [
      { icon: 'Tent', title: { en: 'Wilderness Shelter & Knot Skills', zh: '野外庇護所與繩結技巧' }, body: { en: 'Teams build a lean-to shelter and learn the knots that hold it together.', zh: '小隊合作搭建庇護所，並學會讓它穩固的繩結。' } },
      { icon: 'Link2', title: { en: 'Paracord Studio', zh: '傘繩工坊' }, body: { en: 'Braid a keepsake bracelet or key fob to take home.', zh: '編織手環或鑰匙圈，帶回家當紀念。' } },
      { icon: 'Leaf', title: { en: 'Moss-Ball Craft Studio', zh: '苔球手作工坊' }, body: { en: 'Shape a living moss ball from natural materials.', zh: '用天然素材親手做一顆有生命的苔球。' } },
      { icon: 'Umbrella', title: { en: 'Covered pavilion', zh: '遮雨棚活動區' }, body: { en: 'Crafts and team challenges continue in the shade or in the rain.', zh: '無論遮陽或遇雨，手作與團隊挑戰都能照常進行。' } },
    ],
    facts: [
      { label: { en: 'Afternoon guild', zh: '午後工坊' }, value: { en: '13:30 Shelter & Craft Studio', zh: '13:30 庇護所與手作工坊' } },
      { label: { en: 'Rain plan', zh: '雨天備案' }, value: { en: 'Covered pavilion + dining hall', zh: '遮雨棚＋斑比大飯店' } },
    ],
    safety: {
      title: { en: 'Workshop Rules', zh: '工坊守則' },
      rules: [
        { icon: 'Hand', title: { en: 'Tools with a counselor', zh: '工具由隊輔協助' }, body: { en: 'Cutting tools are handled only by counselors or with one beside you.', zh: '裁切工具只由隊輔操作，或在隊輔陪同下使用。' } },
        { icon: 'Ban', title: { en: 'Cord stays off necks', zh: '繩索不繞頸' }, body: { en: 'Cords and ropes are never wrapped around necks or other people.', zh: '繩索不可繞在脖子上，也不可綁人。' } },
        { icon: 'Leaf', title: { en: 'Look first, then collect', zh: '先觀察再採集' }, body: { en: 'We gather only the natural materials a counselor approves and leave habitats as we found them.', zh: '只採集隊輔同意的天然素材，並讓棲地保持原樣。' } },
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
      en: 'Each evening the whole camp gathers around the fire for S’mores, team skits and trivia night. It is the loudest, funniest and warmest part of the day, with counselors tending the fire throughout.',
      zh: '每天晚上全營隊圍坐營火旁，一起烤棉花糖夾心餅、演出團隊短劇、玩問答之夜。這是一天中最熱鬧、最歡樂也最溫暖的時刻，營火全程由隊輔看顧。',
    },
    icon: 'Flame',
    accent: '#c4561f',
    accent2: '#ffc27a',
    features: [
      { icon: 'Flame', title: { en: 'Campfire S’mores', zh: '營火棉花糖夾心餅' }, body: { en: 'Toast, sandwich, repeat — with long sticks and a counselor close by.', zh: '用長長的烤叉烤棉花糖，隊輔就在身邊。' } },
      { icon: 'Sparkles', title: { en: 'Skits & Trivia Night', zh: '短劇與問答之夜' }, body: { en: 'Teams write, rehearse and perform their own skits, then go head to head in camp trivia.', zh: '小隊自己編劇、排練、演出，接著進行營隊知識問答對決。' } },
      { icon: 'Moon', title: { en: 'Night ecology walk', zh: '夜間生態散步' }, body: { en: 'A short, counselor-led walk to listen for night sounds.', zh: '由隊輔帶領的夜間散步，一起聆聽夜晚的聲音。' } },
      { icon: 'Clock', title: { en: 'Lights out at 21:30', zh: '21:30 熄燈' }, body: { en: 'An evening cabin check wraps up the day.', zh: '晚間內務檢查後熄燈就寢。' } },
    ],
    facts: [
      { label: { en: 'Evening', zh: '時段' }, value: { en: '19:30 Campfire S’mores, Skits & Trivia', zh: '19:30 營火棉花糖、短劇與問答' } },
      { label: { en: 'Lights out', zh: '熄燈' }, value: { en: cohort.lightsOut, zh: cohort.lightsOut } },
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

  // ───────────────────────────────────────────────────────────── TRAILS
  {
    id: 'trails',
    name: { en: 'Forest Trails & Orienteering', zh: '森林步道與定向越野' },
    tagline: {
      en: 'Maps, clues and a night walk under the canopy.',
      zh: '地圖、線索，與林蔭下的夜間散步。',
    },
    summary: {
      en: 'Forest trails link the vans, the meadow and the lake. Teams read maps and follow clues in orienteering and scavenger hunts, and after dark a counselor-led night ecology walk reveals a different forest.',
      zh: '森林步道串起露營車、草原與湖畔。小隊透過定向越野與尋寶任務練習看地圖、找線索，入夜後還有隊輔帶領的夜間生態散步，看見不一樣的森林。',
    },
    icon: 'TreePine',
    accent: '#2f6b4a',
    accent2: '#9ccfa6',
    features: [
      { icon: 'Compass', title: { en: 'Orienteering & scavenger hunts', zh: '定向越野與尋寶' }, body: { en: 'Teams use a map to find checkpoints and solve clues.', zh: '小隊利用地圖尋找檢查點、解開線索。' } },
      { icon: 'Moon', title: { en: 'Night Ecology Walk & Camp Trivia', zh: '夜間生態散步與營隊問答' }, body: { en: 'Listen for frogs and night insects, then test what you noticed.', zh: '聆聽蛙鳴與夜行昆蟲，再用問答檢驗大家的觀察。' } },
      { icon: 'TreePine', title: { en: 'Forest, meadow and lake edge', zh: '森林、草原與湖畔' }, body: { en: 'Trails wind through very different habitats within minutes.', zh: '短短幾分鐘就能穿越截然不同的棲地。' } },
      { icon: 'Footprints', title: { en: 'Steps and slopes', zh: '階梯與坡道' }, body: { en: 'Natural terrain with steps and gentle slopes — sneakers recommended.', zh: '自然地形含階梯與緩坡，建議穿運動鞋。' } },
    ],
    facts: [
      { label: { en: 'Terrain', zh: '地形' }, value: { en: 'Forest paths, steps and slopes', zh: '森林小徑、階梯與坡道' } },
      { label: { en: 'Pack', zh: '請自備' }, value: { en: 'Sneakers, mosquito repellent, water bottle', zh: '運動鞋、防蚊液、水壺' } },
    ],
    safety: {
      title: { en: 'Trail Rules', zh: '步道守則' },
      rules: [
        { icon: 'Users', title: { en: 'Stay with your team', zh: '與小隊同行' }, body: { en: 'Walk with your buddy and your counselor, never off alone.', zh: '與夥伴及隊輔同行，不單獨離隊。' } },
        { icon: 'Route', title: { en: 'Stay on the marked trail', zh: '走在標示步道上' }, body: { en: 'Trail markers show the safe route; we stay on it.', zh: '沿著步道標示前進，不擅自離開。' } },
        { icon: 'Hand', title: { en: 'If you are separated, stay put', zh: '走散時原地等待' }, body: { en: 'Stay where you are and call out. Counselors will come to you.', zh: '留在原地大聲呼喊，隊輔會來找你。' } },
        { icon: 'Leaf', title: { en: 'Look, don’t pick', zh: '只看不採' }, body: { en: 'We leave plants and animals as we found them.', zh: '不傷害植物與動物，讓自然保持原貌。' } },
      ],
    },
  },
]

export const AREA_BY_ID: Record<AreaId, Area> = Object.fromEntries(AREAS.map((a) => [a.id, a])) as Record<AreaId, Area>
