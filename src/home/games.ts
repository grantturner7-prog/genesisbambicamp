import type { L } from '../lib/types'

export { GAME_DETAILS, type GameDetail } from './gameDetails'

const l = (en: string, zh: string): L => ({ en, zh })

/**
 * Camp games and challenges: "some of the fun activities campers take part in".
 * Names and order follow the partners' activity sheet (01–32); keep the names as given.
 * Every string is scanned by `npm run audit` (Doc 3, Part 6).
 */
export type GameGroupId = 'quest' | 'outdoor' | 'games' | 'team' | 'lab' | 'spirit'

/** Each group has a quiet accent from the site palette (icon tile and label). */
export const GAME_GROUPS: { id: GameGroupId; name: L; fg: string; bg: string }[] = [
  { id: 'quest', name: l('Quests & Exploration', '探索任務'), fg: '#1b4332', bg: '#e4ede6' },
  { id: 'outdoor', name: l('Outdoor Skills', '戶外技能'), fg: '#4a6b2a', bg: '#ecf1df' },
  { id: 'games', name: l('Games & Tournaments', '競賽活動'), fg: '#9a6a35', bg: '#f6e9d8' },
  { id: 'team', name: l('Team Challenges', '團隊挑戰'), fg: '#23707e', bg: '#e0eef0' },
  { id: 'lab', name: l('Experiments & Builds', '實驗與動手做'), fg: '#4a4f8f', bg: '#e9eaf5' },
  { id: 'spirit', name: l('Camp Spirit', '營隊精神'), fg: '#b9562a', bg: '#fbe8dc' },
]

export interface Game {
  /** Number on the partners' activity sheet. */
  n: number
  name: L
  body: L
  /** lucide-react icon name, resolved in `src/map/icons.tsx`. Objects only: no people. */
  icon: string
  group: GameGroupId
  /** How the day-by-day plan names this activity, where it differs from the name on the card. */
  alias?: string
}

export const GAMES: Game[] = [
  { n: 1, group: 'quest', icon: 'Route', name: l('Bambi Amazing Race', '斑比探索大挑戰'), body: l('A camp-wide team adventure of checkpoints, clues and quick problem-solving.', '跑遍全營區的團隊冒險：找檢查點、解線索、快速動腦過關。') },
  { n: 2, group: 'quest', icon: 'Compass', name: l('Orienteering Quest', '定向越野探索'), body: l('Teams read the map, follow the markers and find every control point along approved camp paths.', '看地圖、認標記，小隊合作沿著指定的營區步道找出每一個檢查點。') },
  { n: 3, group: 'quest', icon: 'Flashlight', name: l('Glow Night Quest', '夜光任務'), body: l('A low-light quest with glowing clues and team challenges across the camp.', '在昏暗的光線下，跟著夜光線索，完成一關關小隊挑戰。') },
  { n: 4, group: 'outdoor', icon: 'Tent', name: l('Shelter Build Challenge', '野外庇護所挑戰'), body: l('Teams design and build a simple shelter that stands up to the weather.', '小隊動手設計並搭建一座能遮風擋雨的簡易庇護所。') },
  { n: 5, group: 'outdoor', icon: 'Backpack', name: l('Campcraft Survival Circuit', '戶外生存技能巡迴'), body: l('A rotating circuit of practical campcraft: knots, safety and teamwork.', '分站輪流體驗實用的野外技能：繩結、安全觀念與團隊合作。') },
  { n: 6, group: 'quest', icon: 'Camera', name: l('Nature Photo Safari', '自然攝影探索'), body: l('Teams explore the grounds to photograph plants, textures, scenery and small details of nature.', '小隊走遍營區，用鏡頭捕捉植物、紋理、風景與大自然的小細節。') },
  { n: 7, group: 'outdoor', icon: 'Kayak', name: l('Kayak Skills Relay', '獨木舟技巧接力'), body: l('A supervised lake relay built on paddling basics, balance and teamwork, with life jackets on.', '在專人看顧下進行的湖上接力，練習划槳基本功、平衡感與團隊默契，全程穿著救生衣。') },
  { n: 8, group: 'games', icon: 'Flag', name: l('Capture the Flag', '奪旗大戰'), body: l('Two teams guard their flags, plan their strategy and go all out in a fast field game.', '兩隊各自守護隊旗、擬定策略，在草地上展開快節奏的攻防。') },
  { n: 9, group: 'team', icon: 'Fingerprint', name: l('Mission Impossible Circuit', '不可能任務闖關'), body: l('A timed team mission of obstacle-style tasks, movement challenges and problem-solving.', '限時完成的小隊任務：障礙關卡、肢體挑戰，加上動腦解題。') },
  { n: 10, group: 'games', icon: 'MoveHorizontal', name: l('Tug-of-War Tournament', '拔河錦標賽'), body: l('The classic test of rhythm, coordination and pulling together.', '經典的拔河對決，比節奏、比協調，更比誰最齊心。') },
  { n: 11, group: 'games', icon: 'Medal', name: l('Camp Olympics Relay Medley', '營隊奧運接力'), body: l('Eight stations of relays, target games, coordination and creative challenges.', '八個關卡連續挑戰：接力、投準遊戲、協調力與創意任務。') },
  { n: 12, group: 'games', icon: 'Lasso', name: l('Giant Rope Jump Challenge', '大繩跳躍挑戰'), body: l('Teams work up through levels of group rope-jumping, where rhythm and encouragement win.', '全隊一起跳大繩、逐級挑戰，靠的是節奏與彼此加油。') },
  { n: 13, group: 'team', icon: 'Waypoints', name: l('Spider Web Challenge', '蜘蛛網合作挑戰'), body: l('Teams plan how to get everyone through a rope web, with clear communication and safe support.', '小隊一起規劃路線，靠清楚的溝通與安全的互相扶持，讓每個人都穿越繩網。') },
  { n: 14, group: 'team', icon: 'Cylinder', name: l('Pipeline Challenge', '管道運送挑戰'), body: l('With short sections of pipe, teams keep a ball rolling all the way from start to target.', '用一段段短管子，全隊接力讓球一路滾到終點。') },
  { n: 15, group: 'team', icon: 'LandPlot', name: l('Island Hop', '島嶼跨越'), body: l('Teams cross a marked “river” using a few safe islands and careful group planning.', '只靠幾座安全的「小島」，全隊計畫好步驟，一起越過畫定的「河流」。') },
  { n: 16, group: 'team', icon: 'EyeOff', name: l('Blind Maze', '蒙眼迷宮'), body: l('A listening-and-trust challenge: one teammate calls the directions to guide a blindfolded partner through a safe cone maze.', '考驗傾聽與信任：一位隊友下口令，引導蒙眼的夥伴走出安全的角錐迷宮。') },
  { n: 17, group: 'team', icon: 'Biohazard', name: l('Toxic Waste Transfer', '危險物質轉移'), body: l('Using ropes and steady tension, teams move a lightweight container without stepping into the restricted zone.', '只靠繩索與穩定的拉力，在不踏進禁區的情況下，把輕巧的容器運送到定點。') },
  { n: 18, group: 'games', icon: 'Footprints', name: l('Giant Ski Race', '團隊大腳板競賽'), body: l('Small groups step together on shared team skis, keeping rhythm, balance and the count.', '幾個人同踩一副大腳板，喊口令、抓節奏、保持平衡一起前進。') },
  { n: 19, group: 'team', icon: 'Boxes', name: l('Crate Crossing', '低箱跨越'), body: l('Teams cross a marked zone using low crates as safe stepping platforms, without stacking them.', '把低矮的箱子當作安全的踏板，不能疊高，全隊一起通過指定區域。') },
  { n: 20, group: 'quest', icon: 'KeyRound', name: l('Indoor Escape Room Race', '室內密室解謎賽'), body: l('Teams crack a sequence of clues and puzzles to unlock the final mission box.', '小隊連續破解線索與謎題，打開最後的任務寶箱。') },
  { n: 21, group: 'games', icon: 'Timer', name: l('Minute-to-Win-It Mega Tournament', '一分鐘挑戰大賽'), body: l('A fast indoor tournament of short, funny skill challenges, with teams rotating between stations.', '快節奏的室內大賽：一關一分鐘的趣味技巧挑戰，各隊輪流闖關。') },
  { n: 22, group: 'lab', icon: 'Droplets', name: l('Mentos Geyser Challenge', '曼陀珠噴泉探索'), body: l('An adult-led outdoor demonstration: campers predict, observe and compare the results.', '由成人帶領的戶外示範：營員先預測、再觀察，最後比較結果。') },
  { n: 23, group: 'lab', icon: 'FlaskConical', name: l('Foam Explosion Spectacular', '泡沫爆發示範'), body: l('A controlled, adult-led foam demonstration that shows what a catalyst and a little gas can do.', '由成人操作、全程控管的泡沫示範，看看催化劑與氣體能變出什麼。') },
  { n: 24, group: 'lab', icon: 'Bubbles', name: l('Giant Bubble Lab', '巨型泡泡探索'), body: l('Teams experiment with giant bubble wands: smooth movement, shape, size and how long a bubble lasts.', '用巨型泡泡棒做實驗：放慢動作，玩形狀、比大小，看泡泡能撐多久。') },
  { n: 25, group: 'lab', icon: 'Rocket', name: l('Balloon Rocket Grand Prix', '氣球火箭大獎賽'), body: l('Teams build balloon-powered rockets, race them, change one thing in the design and race again.', '小隊製作氣球動力火箭並比賽，每次只改一處設計，再比一次。') },
  { n: 26, group: 'lab', icon: 'Blocks', name: l('Bridge & Tower Build Challenge', '橋樑與高塔建造挑戰'), body: l('Teams design, build, test and improve a structure from a limited kit of materials.', '用有限的材料設計、搭建、測試，再一步步改良作品。') },
  { n: 27, group: 'lab', icon: 'Egg', name: l('Egg Drop Build Challenge', '雞蛋防摔建造挑戰'), body: l('Teams build a device to protect an egg, test it in an adult-controlled drop, then redesign.', '小隊設計雞蛋保護裝置，在成人操作的落下測試後再改良。') },
  { n: 28, group: 'lab', icon: 'Beaker', name: l('Oobleck Olympics', '神奇澱粉泥奧運'), body: l('A hands-on materials lab: teams test how oobleck behaves under slow and sudden force.', '動手玩材料：測試澱粉泥在慢慢施力與突然施力時的不同反應。') },
  { n: 29, group: 'lab', icon: 'Tornado', name: l('Vortex Cannon Target Challenge', '渦流空氣砲目標挑戰'), body: l('Teams use safe air-vortex cannons to knock over lightweight targets and see how moving air travels.', '用安全的渦流空氣砲擊倒輕巧的目標，觀察空氣是怎麼流動的。') },
  { n: 30, group: 'spirit', icon: 'MicVocal', alias: 'Skit & Talent Showdown', name: l('Campfire Skit & Talent Showdown', '營火短劇與才藝秀'), body: l('Teams prepare short skits, music, comedy or other acts for a supportive camp showcase.', '小隊準備短劇、音樂、搞笑或創意表演，在大家的掌聲中登台。') },
  { n: 31, group: 'spirit', icon: 'Paintbrush', name: l('Team Banner & Mascot Workshop', '隊旗與吉祥物工作坊'), body: l('Teams create their banner, crest, chant, mascot pose and a short team introduction.', '小隊設計隊旗、隊徽、口號與吉祥物姿勢，再準備一段小隊介紹。') },
  { n: 32, group: 'spirit', icon: 'PartyPopper', name: l('Color War Opening Ceremony', 'Color War 開幕式'), body: l('A high-energy launch with banners, chants, mascot poses and the first spirit points.', '活力滿點的開幕式：隊旗、口號、吉祥物姿勢，還有第一批精神積分。') },
]

export const GAMES_COPY = {
  kicker: l('Games & challenges', '遊戲與挑戰'),
  title: l('Some of the fun activities campers take part in', '營員會參與的部分精彩活動'),
  intro: l(
    'Camp-wide quests, tournaments, team challenges and hands-on experiments: here is a taste of what campers get up to.',
    '從全營區的探索任務、競賽、團隊挑戰到動手實驗，先來看看營員在營隊裡會玩到哪些活動。',
  ),
  filterLabel: l('Show activities by type', '依類型瀏覽活動'),
  all: l('All', '全部'),
  showAll: (n: number) => l(`Show all ${n} activities`, `顯示全部 ${n} 項活動`),
  /** The turned-over card. */
  hint: l('Tap a card to see what happens in it.', '點一下卡片，看看活動怎麼進行。'),
  open: l('See what happens', '看看怎麼進行'),
  happens: l('What happens', '活動流程'),
  note: l('Good to know', '貼心提醒'),
  winter: l('Winter camp', '冬季營隊'),
  plan: l('Which activities run at each camp is shown in the day-by-day plan.', '每梯次實際進行的活動，請見每日行程。'),
  close: l('Close', '關閉'),
  prev: l('Previous activity', '上一項活動'),
  next: l('Next activity', '下一項活動'),
}
