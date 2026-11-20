import type { AreaId, L, Zone } from '../lib/types'
import sources from './sources.json'
import { ROOT } from '../lib/root'

/**
 * Photo manifest. Every file in public/media/bambi was taken from Bambi Glamping's
 * own website (iglamping.tw); `sources.json` records each original URL.
 * © 台灣愛露營科技有限公司 — publish only with Bambi's written permission
 * (`campConfig.venuePhotoPermissionOnFile`, checked by `npm run launch-check`).
 */
export interface Pin {
  /** Position in % of the image. */
  x: number
  y: number
  label: L
}
export interface Photo {
  id: keyof typeof sources
  caption: L
  pins?: Pin[]
}

export const PHOTO_CREDIT: L = { en: 'Photo: Bambi Glamping', zh: '照片：斑比跳跳' }
export const photoSrc = (id: string) => `${ROOT}media/bambi/${id}.webp`
export const photoSize = (id: Photo['id']) => sources[id]

const P = (id: Photo['id'], en: string, zh: string, pins?: Pin[]): Photo => ({ id, caption: { en, zh }, pins })
const pin = (x: number, y: number, en: string, zh: string): Pin => ({ x, y, label: { en, zh } })

/**
 * Every photo below was checked against its caption in the photo audit (docs/PHOTO-AUDIT.md):
 * it must show exactly the place or activity it is attached to. Where the venue has no
 * such photo, the slot is left empty instead of showing something merely nearby.
 */
export const AREA_PHOTOS: Record<AreaId, Photo[]> = {
  // The venue has no photo of the gate or the check-in unit; these are honest views inside the grounds.
  gate: [
    P('grounds-palm-road', 'A road inside the grounds, under the palms', '園區內棕櫚樹下的道路'),
    P('zone-b-2', 'The big meadow and its camper vans', '大草原與露營車'),
  ],
  vans: [
    P('van-bunk', 'Inside a camper van', '露營車內部', [
      pin(51, 50, 'Bunk bed', '上下舖'),
      pin(35, 35, 'Hitachi heating & A/C', '日立冷暖空調'),
      pin(22, 52, 'Private bathroom', '獨立衛浴'),
      pin(50, 90, 'Double bed', '雙人床'),
    ]),
    P('van-bed-ac', 'Double bed on a raised platform, with A/C and fan', '架高平台上的雙人床，配有空調與風扇'),
    P('van-bath', 'Private wet/dry bathroom', '獨立乾濕分離衛浴'),
    P('zone-d-1', 'A camper van and its deck', '露營車與專屬露臺', [
      pin(25, 37, 'Shade sail', '遮陽天幕'),
      pin(35, 60, 'Louvered door', '百葉門'),
      pin(33, 82, 'Private deck', '專屬露臺'),
    ]),
    P('van-deck', 'Deck with table and chairs', '露臺桌椅'),
    P('van-lake-window', 'Lake view from the bed in a lakeside unit', '湖畔露營車：從床上望見窗外湖景'),
    P('van-bed', 'Double bed beside the picture window of a lakeside unit', '湖畔露營車的雙人床與景觀大窗'),
    P('van-dusk', 'Evening lights at a lakeside unit', '湖畔露營車的夜晚燈光'),
  ],
  dining: [
    P('hall-exterior', 'The Grand Dining Hall among the palms', '棕櫚樹間的斑比大飯店'),
    P('hall-windows', 'Floor-to-ceiling windows', '大面落地窗'),
    P('hall-tables', 'Tables under the hall’s hanging bulb lights', '燈泡串燈下的用餐座位'),
    P('hall-buffet', 'The buffet counter under the fairy lights', '燈串下的自助餐檯'),
    P('buffet-eggs', 'Scrambled eggs, kept warm on the buffet line', '自助餐檯上保溫的炒蛋'),
    P('buffet-fruit-yogurt', 'Fresh fruit and yogurt on the buffet', '自助餐檯上的水果與優格'),
    P('breakfast-plate', 'A full plate from the breakfast buffet', '自助式早餐盛好的一盤'),
    P('breakfast-closeup', 'French toast, scrambled eggs and fruit yogurt', '法式吐司、炒蛋與水果優格'),
    P('pizza-hands', 'Topping a handmade pizza with cheese', '為手工披薩鋪上起司'),
    P('pizza-oven', 'Pizzas heading for the oven', '準備進爐的披薩'),
    P('pizza-fresh', 'Fresh from the pizza oven', '剛出爐的披薩'),
    P('pizza-counter', 'Handmade pizzas on the serving counter', '餐檯上的手工披薩'),
    P('wagyu-platter', 'Wagyu beef for the signature family dinner on the final evening', '最後一晚招牌家宴的和牛'),
    P('moss-ball-table', 'Making moss balls at a table in the dining hall', '在斑比大飯店的餐桌上做苔球'),
  ],
  pool: [
    P('pool-sunset', 'Aurora Pool at sunset', '夕陽下的極光戲水池', [
      pin(43, 53, 'Airstream snack shop', 'Airstream 點心站'),
      pin(58, 80, 'Curved steps, shallow end', '弧形階梯・淺水區'),
      pin(13, 63, 'Loungers', '池畔躺椅'),
    ]),
    P('pool-airstream', 'The Airstream beside the pool at twilight', '暮色中，戲水池旁的 Airstream', [pin(26, 65, 'Airstream snack shop', 'Airstream 點心站')]),
    P('pool-swim', 'Splash time in the Aurora Pool', '極光戲水池的戲水時光'),
    P('pool-steps', 'Curved steps under the water, loungers beyond', '水面下的弧形階梯，後方是池畔躺椅', [
      pin(38, 70, 'Curved steps', '弧形階梯'),
      pin(25, 55, 'Loungers', '池畔躺椅'),
    ]),
    P('pool-splash', 'Shallow-end fun', '淺水區玩水'),
  ],
  cinema: [
    P('cinema-night', 'Film night at the Star Cinema on the lawn', '草地上的星空電影院，夜間放映中'),
    P('cinema-screen', 'The Star Cinema screen and camp chairs at dusk', '黃昏時的星空電影院螢幕與露營椅'),
    P('cinema-lawn', 'Camp chairs and the fire pit at dusk', '黃昏草地上的露營椅與營火圈'),
    P('cinema-day', 'By day: the screen, camp chairs and fire pit', '白天的電影院：螢幕、露營椅與營火圈'),
  ],
  campfire: [
    P('campfire-burning', 'The brick fire pit alight', '點燃的磚砌營火圈'),
    P('campfire-marshmallow', 'Toasting marshmallows over the fire pit', '在營火圈上烤棉花糖'),
    P('campfire-pit', 'The brick fire pit, logs stacked and ready', '磚砌營火圈，柴火已堆好'),
  ],
  kayak: [
    P('kayak-lake', 'Paddling the east lake', '在東側湖面划行'),
    P('kayak-jetty', 'Kayaks moored at the boarding deck', '停靠在乘船處的獨木舟', [
      pin(67, 77, 'Boarding deck', '乘船處'),
      pin(73, 66, 'Single and double kayaks', '單人與雙人獨木舟'),
    ]),
    P('kayak-double', 'A double kayak, life jackets on', '雙人艇，穿好救生衣'),
    P('kayak-shore', 'Kayaks ready at the shore', '岸邊待命的獨木舟'),
    P('kayak-calm', 'The calm kayak lake, boats waiting at the far bank', '平靜的跳跳船湖面，遠處岸邊停著獨木舟'),
  ],
  birds: [
    P('birds-roost-lake', 'Egrets roosting in the trees beside the waterbird lake', '水鳥湖畔樹叢上棲息的鷺鳥'),
    P('birds-treetop', 'Egrets gathered in the treetops', '聚集在樹梢的鷺鳥'),
    P('birds-flight', 'A cattle egret in flight above the trees', '飛過樹梢的黃頭鷺'),
    P('birds-cattle-egrets', 'Cattle egrets perched in the branches', '停在枝頭的黃頭鷺'),
    P('birds-ducks-geese', 'Ducks and geese on the grounds', '園區裡的鴨與鵝'),
    P('birds-ducks-lawn', 'Ducks on the lawn at the water’s edge', '水邊草地上的鴨子'),
    P('winter-cypress', 'Bald cypress in copper colour by the lakeside camper vans', '轉為紅銅色的落羽松與湖畔露營車'),
  ],
  tram: [P('tram-on-route', 'The eco-tram on its loop, with the lake behind', '遊園車繞行園區，後方就是湖泊')],
  // The venue has no photo of the restrooms, showers or AED. No photo is better than a wrong one.
  care: [],
}

/** Food photos shown with the menu and on the dining highlights. */
export const MENU_PHOTOS: Partial<Record<AreaId, Photo[]>> = {
  // Shown as the highlights strip: only dishes on the kitchen's menu (eggs, pizza, the signature dinner).
  dining: (['buffet-eggs', 'pizza-hands', 'pizza-oven', 'pizza-fresh', 'pizza-counter', 'wagyu-platter'] as const).map(
    (id) => AREA_PHOTOS.dining.find((p) => p.id === id)!,
  ),
}

/** Unit numbers on the walls were read in every zone photo (A05, B07, D03, E01, F02, G01 ...). */
export const ZONE_PHOTOS: Record<Zone, Photo[]> = {
  A: [P('zone-a-1', 'Zone A', 'A 區'), P('zone-a-2', 'Zone A', 'A 區'), P('zone-a-3', 'Zone A', 'A 區')],
  B: [P('zone-b-1', 'Zone B', 'B 區'), P('zone-b-2', 'Zone B', 'B 區'), P('zone-b-3', 'Zone B', 'B 區')],
  D: [P('zone-d-1', 'Zone D', 'D 區'), P('zone-d-2', 'Zone D', 'D 區'), P('van-exterior', 'Zone D', 'D 區')],
  E: [P('zone-e-1', 'Zone E', 'E 區'), P('zone-e-2', 'Zone E', 'E 區'), P('zone-e-3', 'Zone E: unit E01 and its deck under the trees', 'E 區：樹下的 E01 露營車與露臺')],
  F: [
    P('zone-f-1', 'Zone F', 'F 區'),
    P('lake-cypress', 'Zone F: unit F02 seen across the lake', '從湖對岸看 F 區的 F02 露營車'),
    P('zone-f-3', 'Zone F: the deck of unit F03 by the lake at dusk', 'F 區：黃昏時湖畔 F03 露營車的露臺'),
  ],
  G: [P('zone-g-1', 'Zone G', 'G 區'), P('zone-g-2', 'Zone G', 'G 區'), P('zone-g-3', 'Zone G', 'G 區')],
}

/** Zone facts from Bambi's official zone guide; counts from the official camp map. */
export const ZONES: Record<Zone, { count: number; setting: L; blurb: L }> = {
  A: {
    count: 14,
    setting: { en: 'Lakeside · by the kayak lake', zh: '湖畔・鄰近跳跳船' },
    blurb: {
      en: 'Beside the kayak lake, with wide lake views and shade from the surrounding trees.',
      zh: '鄰近跳跳船活動空間，視野開闊、湖景優美，四周樹林環繞。',
    },
  },
  B: {
    count: 12,
    setting: { en: 'Meadow · near the activity areas', zh: '草原・鄰近活動區' },
    blurb: {
      en: 'Set on the big open meadow, close to the pool, campfire and cinema.',
      zh: '座落於偌大的草原上，鄰近戲水池、營火區與星空電影院。',
    },
  },
  D: {
    count: 12,
    setting: { en: 'Forest · shared rest area', zh: '森林・公共休憩區' },
    blurb: {
      en: 'Ringed by woodland, with an outdoor rest area at the centre of the zone.',
      zh: '樹林環繞，區域中央設有戶外休憩空間。',
    },
  },
  E: {
    count: 6,
    setting: { en: 'Under the trees · near dining', zh: '樹林下・鄰近餐廳' },
    blurb: {
      en: 'Tucked under the trees and the closest zone to the Grand Dining Hall.',
      zh: '座落於樹林下方，也是最靠近斑比大飯店的一區。',
    },
  },
  F: {
    count: 4,
    setting: { en: 'Lakeside front row · bald cypress', zh: '湖岸第一排・落羽松' },
    blurb: {
      en: 'Front row on the waterbird lake under the bald cypress, where egrets fly home at dusk.',
      zh: '落羽松下的湖岸第一排，黃昏時可以看見水鳥歸巢。',
    },
  },
  G: {
    count: 2,
    setting: { en: 'Lakeside front row · most secluded', zh: '湖岸第一排・最隱密' },
    blurb: {
      en: 'The most secluded spot: two units next to Zone F on the lake’s front row.',
      zh: '最為隱密，與 F 區為鄰，僅有兩輛，同樣位於湖岸第一排。',
    },
  },
}
