import type { L } from '../lib/types'

/** One camp: human-readable dates and the fee per camper in TWD. */
export interface SessionOffer {
  dates: L
  /** ISO date of the first camp day, used by the refund calculator. */
  startDate: string
  /** `null` while the partners still owe the fee: the site then shows "Coming soon". */
  fee: number | null
  /** Set for a pilot camp: its own, smaller limit on campers. */
  pilot?: { maxCampers: number }
}

/**
 * SINGLE CONFIG SOURCE (Doc 3, Part 1).
 *
 * Every date, TWD price, headcount cap, LINE ID and licence number the site
 * displays lives here. Values marked `null` are still owed by a partner —
 * `npm run launch-check` lists them and fails until they are filled in.
 * Nothing in the UI invents a value for a `null` field.
 */
export const campConfig = {
  brand: {
    /** The camp's own name, the same in both languages: "WOW" is 哇. */
    camp: 'Camp WOW',
    campMeaning: 'World of Outdoor Wonders',
    campLine: { en: 'The all-English outdoor camp', zh: '全美語生活環境的戶外營隊' },
    en: 'Genesis Youth Adventures × Bambi Glamping',
    zh: '創世紀青少年戶外探索 × 斑比跳跳',
    enShort: 'Genesis × Bambi',
    zhShort: '創世紀 × 斑比跳跳',
  },

  cohort: {
    ageMin: 10,
    ageMax: 14,
    maxCampersPerSession: 60,
    campersPerVan: 3,
    counselorRatio: '1:4',
    minGroupSize: 24 as number | null, // Doc 2: "Min. [24] campers to run" — partners to confirm
    gateCurfew: '23:00',
  },


  /**
   * Getting to camp. Campers meet at the meeting point on the first morning and ride the
   * charter bus to Sanwan; on the last day the bus brings them back to the same place.
   * Times are local, on the first and last day of the camp.
   */
  transport: {
    meetingPoint: { en: 'The Lin Hotel, Taichung', zh: '台中林酒店' },
    meetingAddress: { en: 'No. 99, Chaofu Rd., Xitun District, Taichung', zh: '臺中市西屯區朝富路 99 號' },
    meetTime: '08:00',
    departTime: '08:30',
    /** The bus leaves camp on the last morning and is back at the meeting point at about this time. */
    leaveCampTime: '10:00',
    returnTime: '11:30',
  },

  /** The camp's days of the week: every "Thursday" and "Sunday" in the copy comes from here. */
  days: {
    first: { en: 'Thursday', zh: '週四' },
    last: { en: 'Sunday', zh: '週日' },
  },

  /**
   * The winter camp menu, as given by the venue kitchen (Bambi Glamping). The kitchen has
   * not said which day each dish is served, so the site lists the dishes and names no day.
   * `allergensProvided` stays false until the kitchen gives the allergen details for each
   * dish: until then the dishes carry no allergen tags and launch-check lists it.
   */
  winterMenu: {
    breakfast: { en: 'eggs, bacon, bread and sandwiches, with milk and soy milk', zh: '雞蛋、培根、麵包與三明治，搭配牛奶與豆漿' },
    lunch: { en: 'curry, pizza, rice balls and donburi rice boxes', zh: '咖哩、披薩、飯糰與丼飯餐盒' },
    dinners: [
      { en: 'meatball pasta with corn soup and bread', zh: '肉丸義大利麵配玉米濃湯與麵包' },
      { en: 'fried chicken and braised pork with vegetables and rice', zh: '炸雞與滷肉配青菜與白飯' },
    ],
    allergensProvided: false,
  },

  /**
   * The papers a family reads, fills in or signs. `final` stays false until the camp's open
   * decisions are filled in, the nurse has confirmed her parts and a lawyer has approved the
   * forms. Until then the site lists the three forms without posting them, and launch-check
   * names it. Once true, `npm run forms-pdf` writes the PDFs to public/documents/ (README).
   */
  documents: { final: false },

  /** Venue partner — verified in Docs 2–4. */
  venue: {
    name: { en: 'Bambi Glamping', zh: '斑比跳跳露營商行' } satisfies L,
    taxId: '88491889',
    address: {
      en: 'No. 27, Xiaobeipu, Beipu Village, Sanwan Township, Miaoli County',
      zh: '苗栗縣三灣鄉北埔村小北埔27號',
    } satisfies L,
    /** Address-based maps link — no coordinates are guessed. */
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent('苗栗縣三灣鄉北埔村小北埔27號'),
    officialSite: 'https://iglamping.tw/',
    hospital: {
      en: 'Wei-Gong Memorial Hospital (Toufen)',
      zh: '頭份為恭紀念醫院',
    } satisfies L,
  },

  /** Activity Co-Organizer (the camp operating company, MOEA-registered). */
  operator: {
    legalName: null as L | null,
    taxId: null as string | null,
    phone: null as string | null,
    address: null as L | null,
    lineId: null as string | null,
    lineUrl: null as string | null,
  },

  /** Licensed Partner Travel Agency — Tourism Act Art. 27 / Travel Agency Regs Art. 30. */
  travelAgency: {
    legalName: null as L | null,
    category: null as L | null, // 甲種旅行業 / 乙種旅行業
    tourismRegNo: null as string | null, // 交觀…號
    tqaaNo: null as string | null, // 品保…號
    phone: null as string | null,
    insuranceNote: null as L | null,
  },

  compliance: {
    moeOrder: '臺教授國字第1135802715號',
  },

  /** Pool facts used by the map (Doc 3: 30–100 cm, Summer sessions, certified lifeguard). */
  pool: {
    depthMinCm: 30,
    depthMaxCm: 100,
  },

  /**
   * Airstream snack shop beside the pool. Snacks and drinks are NOT part of the camp fee
   * (the fee covers three meals a day). Parents may choose a coupon pack; campers are given
   * the coupons at check-in and exchange them at the shop.
   * DRAFT menu: confirm with the camp kitchen before launch. Rule for the menu (enforced by
   * `npm run audit`): no alcohol products, ever.
   */
  snackShop: {
    /** Coupon packs parents can choose, in TWD. */
    couponPacks: [1000, 2000, 3000],
    /** How packs are paid for and what happens to unused coupons — owed by the partners. Shown wherever coupons are offered. */
    couponTerms: null as L | null,
    /** The menu in src/map/areas.ts is a draft until the camp kitchen confirms what coupons buy. */
    menuConfirmed: false,
  },

  /**
   * Star Cinema. Movie nights may be advertised only while the screenings hold a
   * public-performance licence (公播版) — Doc 3, Rule D. Confirmed by the camp operator.
   * Set to false and `npm run audit` fails on any movie-night copy.
   */
  cinema: {
    publicPerformanceLicensed: true,
  },

  /** Venue film on YouTube (Bambi Glamping's official video). Watch once before launch. */
  venueFilmYoutubeId: 'c_8f6E4MU_k' as string | null,

  /** Written permission from Bambi to publish their photos (public/media/bambi). */
  venuePhotoPermissionOnFile: false,

  /**
   * The camp is one kind only: 4 Days / 3 Nights, Thursday to Sunday, one camp a season.
   * `null`: the partners still owe that season's dates and fee.
   * The first camp is the winter one: Thursday 28 to Sunday 31 January 2027, a pilot camp
   * limited to 30 campers, at NT$35,000 per camper.
   */
  sessions: {
    winter: {
      dates: { en: '28–31 January 2027 (Thursday to Sunday)', zh: '2027 年 1 月 28 日至 31 日（週四至週日）' },
      startDate: '2027-01-28',
      fee: 35000, // per camper
      pilot: { maxCampers: 30 },
    } as SessionOffer | null,
    summer: null as SessionOffer | null,
  },
  payment: { deposit: null as number | null, balanceDueDays: null as number | null },

  /** Registration. With no endpoint the form never transmits anything. */
  registration: {
    endpoint: null as string | null,
    contractPdfUrl: null as string | null,
  },
} as const

export type CampConfig = typeof campConfig
