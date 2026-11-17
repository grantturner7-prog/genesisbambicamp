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

export const AREA_PHOTOS: Record<AreaId, Photo[]> = {
  gate: [
    P('zone-b-2', 'Camper units across the meadow, just inside the gate', '進入園區後，草原上的露營車'),
    P('lake-cypress', 'Lakeside units under the bald cypress', '落羽松下的湖畔露營車'),
  ],
  vans: [
    P('van-bunk', 'Inside a camper unit', '露營車內部', [
      pin(51, 50, 'Bunk bed', '上下舖'),
      pin(35, 35, 'Hitachi heating & A/C', '日立冷暖空調'),
      pin(22, 52, 'Private bathroom', '獨立衛浴'),
      pin(50, 90, 'Double bed', '雙人床'),
    ]),
    P('zone-d-1', 'A camper unit and its deck', '露營車與專屬露臺', [
      pin(25, 37, 'Shade sail', '遮陽天幕'),
      pin(35, 60, 'Louvered door', '百葉門'),
      pin(33, 82, 'Private deck', '專屬露臺'),
    ]),
    P('van-window-kids', 'Picture window over the lake', '看得見湖景的大窗'),
    P('van-bed', 'Double bed with a 100% latex mattress', '雙人床，100% 乳膠床墊'),
    P('van-bath', 'Private wet/dry bathroom', '獨立乾濕分離衛浴'),
    P('van-deck', 'Deck with table and chairs', '露臺桌椅'),
    P('van-dusk', 'Evening lights at a lakeside unit', '湖畔露營車的夜晚燈光'),
  ],
  dining: [
    P('hall-exterior', 'The Grand Dining Hall among the palms', '棕櫚樹間的斑比大飯店'),
    P('hall-windows', 'Floor-to-ceiling windows', '大面落地窗'),
    P('hall-interior', 'Evening in the hall', '夜晚的用餐空間'),
    P('hall-buffet', 'The buffet line', '自助餐檯'),
    P('pizza-hands', 'Topping a handmade pizza', '手工披薩鋪料'),
    P('pizza-oven', 'Pizzas heading for the oven', '準備進爐的披薩'),
    P('pizza-fresh', 'Fresh from the pizza oven', '剛出爐的披薩'),
    P('breakfast', 'Buffet breakfast', '自助早餐'),
  ],
  pool: [
    P('pool-sunset', 'Aurora Pool at sunset', '夕陽下的極光戲水池', [
      pin(43, 53, 'Airstream snack shop', 'Airstream 點心站'),
      pin(58, 80, 'Curved steps, shallow end', '弧形階梯・淺水區'),
      pin(13, 63, 'Loungers', '池畔躺椅'),
    ]),
    P('pool-jump', 'Splash time beside the Airstream', 'Airstream 旁的戲水時光'),
    P('pool-swim', 'Clear, shallow water', '清澈的淺水池'),
    P('pool-splash', 'Shallow-end fun', '淺水區玩水'),
    P('pool-dusk', 'The pool at dusk', '黃昏的戲水池'),
    P('pool-night', 'The Airstream lit up at night', '夜晚點燈的 Airstream'),
  ],
  cinema: [
    P('cinema-screen', 'The Star Cinema screen at dusk', '黃昏的星空電影院螢幕'),
    P('cinema-lawn', 'Camp chairs on the lawn', '草地上的露營椅'),
    P('campfire-marshmallow', 'Marshmallows by the fire next door', '隔壁營火烤棉花糖'),
  ],
  campfire: [
    P('campfire-pit', 'The brick fire pit', '磚砌營火圈'),
    P('campfire-marshmallow', 'Toasting marshmallows', '烤棉花糖'),
    P('campfire-snacks', 'Evening snacks', '晚間點心'),
  ],
  kayak: [
    P('kayak-lake', 'Paddling the east lake', '在東側湖面划行'),
    P('kayak-shore', 'Kayaks ready at the shore', '岸邊待命的獨木舟'),
    P('kayak-pair', 'A double kayak, life jackets on', '雙人艇，全程穿救生衣'),
    P('kayak-family', 'Child-size life jackets', '兒童尺寸救生衣'),
  ],
  birds: [
    P('lake-cypress', 'Bald cypress along the west lake', '西側湖岸的落羽松'),
    P('zone-f-1', 'The lake from Zone F', '從 F 區望向湖面'),
    P('zone-f-2', 'Lakeside units among the trees', '樹林間的湖畔露營車'),
  ],
  tram: [P('zone-b-2', 'The open meadow on the tram loop', '遊園車路線上的大草原'), P('lake-cypress', 'Lakeshore on the tram loop', '遊園車路線上的湖岸')],
  care: [P('hall-exterior', 'The service block is beside the dining hall', '服務區位於斑比大飯店旁')],
}

export const ZONE_PHOTOS: Record<Zone, Photo[]> = {
  A: [P('zone-a-1', 'Zone A', 'A 區'), P('zone-a-2', 'Zone A', 'A 區'), P('zone-a-3', 'Zone A', 'A 區')],
  B: [P('zone-b-1', 'Zone B', 'B 區'), P('zone-b-2', 'Zone B', 'B 區'), P('zone-b-3', 'Zone B', 'B 區')],
  D: [P('zone-d-1', 'Zone D', 'D 區'), P('zone-d-2', 'Zone D', 'D 區'), P('van-exterior', 'Zone D', 'D 區')],
  E: [P('zone-e-1', 'Zone E', 'E 區'), P('zone-e-2', 'Zone E', 'E 區'), P('lake-cypress', 'Zone E from across the lake', '從湖對岸看 E 區')],
  F: [P('zone-f-1', 'Zone F', 'F 區'), P('zone-f-2', 'Zone F', 'F 區'), P('van-dusk-2', 'Zone F at dusk', '黃昏的 F 區')],
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
