import type { L } from '../lib/types'

/** One bookable option: human-readable dates and the all-in fee in TWD. */
export interface SessionOffer {
  dates: L
  /** ISO date of the first camp day, used by the refund calculator. */
  startDate: string
  fee: number
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
    lightsOut: '21:30',
  },

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
   * Poolside snack shop. DRAFT menu: confirm with the camp kitchen before launch.
   * Rules for this list (enforced by `npm run audit`): no alcohol products, ever.
   * `includedInFee` mirrors the contract promise that no extra charges are collected
   * beyond the itemised fee — confirm this is how the shop will really run.
   */
  snackShop: {
    includedInFee: true,
  },

  /**
   * Star Cinema. Movie nights may be advertised only while the screenings hold a
   * public-performance licence (公播版) — Doc 3, Rule D. Confirmed by the camp operator.
   * Set to false and `npm run audit` fails on any movie-night copy.
   */
  cinema: {
    publicPerformanceLicensed: true,
    startTime: '19:30',
  },

  /** Venue film on YouTube (Bambi Glamping's official video). Watch once before launch. */
  venueFilmYoutubeId: 'c_8f6E4MU_k' as string | null,

  /** Written permission from Bambi to publish their photos (public/media/bambi). */
  venuePhotoPermissionOnFile: false,

  /** Session dates and fees — owed by the partners (Doc 3, Section 1). */
  sessions: {
    winter: { optionA: null as SessionOffer | null, optionB: null as SessionOffer | null },
    summer: { optionA: null as SessionOffer | null, optionB: null as SessionOffer | null },
  },
  payment: { deposit: null as number | null, balanceDueDays: null as number | null },

  /** Registration. With no endpoint the form never transmits anything. */
  registration: {
    endpoint: null as string | null,
    contractPdfUrl: null as string | null,
  },
} as const

export type CampConfig = typeof campConfig
