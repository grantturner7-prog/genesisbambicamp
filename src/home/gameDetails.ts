import type { L } from '../lib/types'

const l = (en: string, zh: string): L => ({ en, zh })

/** What a visitor reads when an activity card is turned over. */
export interface GameDetail {
  /** What the teams do, in the order it happens: three or four steps. */
  steps: L[]
  /** What the activity asks of a team: two or three short labels. */
  takes: L[]
  /** One safety or practical fact, where one clearly applies. */
  note?: L
}

/**
 * Keyed by the number on the partners’ activity sheet. Every string is scanned by `npm run audit`.
 * The steps describe how each game is ordinarily played; anything the day-by-day plan settles (times, days)
 * is read from the plan, not written here.
 */
export const GAME_DETAILS: Record<number, GameDetail> = {
  1: {
    steps: [
      l('Seven checkpoints are spread across the camp. All teams start together, each at a different one.', '七個檢查點分布在營區各處，各小隊同時從不同的檢查點出發。'),
      l('Three tasks keep hands busy: knots, the Pipeline Challenge and the Toxic Waste Transfer.', '其中三個任務要動手：打繩結、管道運送挑戰、危險物質轉移。'),
      l('The other four are a puzzle, a blindfold guide task, a memory task and a team photo.', '另外四個是解謎、蒙眼引導任務、記憶力任務，還有小隊合照。'),
      l('The team passport gets a stamp at each checkpoint, then the team moves clockwise to the next one.', '每到一個檢查點，小隊護照就蓋一個章，再依順時針方向前往下一個。'),
    ],
    takes: [l('Quick thinking', '腦筋動得快'), l('Clear communication', '溝通清楚'), l('Steady hands', '手要穩')],
  },
  2: {
    steps: [
      l('Each team gets a map, two compasses and a control card.', '每個小隊拿到一張地圖、兩個指北針和一張檢查卡。'),
      l('A quick warm-up: turn the map to match the ground and find north.', '先暖身：把地圖轉到和眼前的方向一致，找出北方。'),
      l('Teams follow approved camp paths to find ten control points, with a counselor alongside.', '小隊沿著指定步道尋找十個檢查點，隊輔全程同行。'),
      l('Every control found scores points, with a bonus for teamwork.', '每找到一個檢查點就得分，團隊合作再加分。'),
    ],
    takes: [l('Map reading', '看懂地圖'), l('Teamwork', '團隊默契'), l('A cool head', '冷靜判斷')],
  },
  3: {
    steps: [
      l('After dark, every camper puts on a glow bracelet and teams set out with their counselors.', '天黑之後，每位營員戴上夜光手環，小隊和隊輔一起出發。'),
      l('Teams shine a UV flashlight on each clue, and the words in invisible ink show up.', '小隊拿紫外線手電筒一照，隱形墨水寫的線索就現形了。'),
      l('Each clue sends the team walking to a glow-marked station, where a team challenge waits.', '跟著線索走到有夜光標記的關卡，那裡有一項小隊挑戰等著。'),
      l('Clue by clue, the goal is to track down the treasure box.', '線索一條接一條，最後的目標是找出寶箱。'),
    ],
    takes: [l('Sharp eyes', '敏銳觀察'), l('Clue solving', '解讀線索'), l('Staying together', '全隊不走散')],
    note: l('Walking only, and counselors are with the teams.', '全程只用走的，隊輔陪著各小隊一起行動。'),
  },
  4: {
    steps: [
      l('Counselors go first and show how a tarp shelter goes up.', '隊輔先示範怎麼用防水布搭出庇護所。'),
      l('Each team gets one tarp, four poles, six lengths of rope and ten pegs, then agrees on a design.', '每隊拿到一塊防水布、四根營柱、六條繩子和十支營釘，再一起決定設計。'),
      l('Teams raise the poles, stretch the tarp and peg it down, with room for the whole team to sit inside.', '立起營柱、拉開防水布、打好營釘，裡面要坐得下全隊。'),
      l('A watering-can “storm” tests each shelter, then the judging begins.', '用灑水壺下一場「暴風雨」測試每座庇護所，接著評分。'),
    ],
    takes: [l('A clear plan', '計畫清楚'), l('Sharing the work', '分工合作'), l('Careful rope work', '細心綁繩')],
  },
  5: {
    steps: [
      l('Teams spread out, each starting at a different campcraft station.', '各小隊分散開來，從不同的野外技能站開始。'),
      l('Each station is a short, practical task, such as tying knots or packing a day bag.', '每一站都是一項簡短又實用的任務，像是打繩結，或打包一日出遊的背包。'),
      l('Teams work through each task together, talking safety through along the way.', '全隊合力完成每項任務，過程中也一起聊聊安全觀念。'),
      l('On the signal, every team moves on to the next station and a new skill.', '口令一下，各隊換到下一站，挑戰另一項技能。'),
    ],
    takes: [l('Nimble fingers', '靈巧的雙手'), l('Thinking ahead', '未雨綢繆'), l('Helping each other', '互相幫忙')],
  },
  6: {
    steps: [
      l('Each team picks up a camp camera and a list of things to find and photograph.', '每個小隊領一台營隊的相機，還有一張要找、要拍的清單。'),
      l('Teams roam the grounds for each item, such as a leaf, a pattern, a wide view or a tiny detail.', '小隊在營區裡一項一項找，像是一片葉子、一種紋路、一處風景，或容易錯過的小細節。'),
      l('Teammates take turns behind the camera and try different angles and distances.', '隊友輪流掌鏡，試試不同的角度和遠近。'),
      l('Back together, each team chooses its best shots and shares them with everyone.', '回來集合後，各隊挑出最滿意的幾張，和大家分享。'),
    ],
    takes: [l('A curious eye', '好奇的眼睛'), l('Patience', '耐心'), l('Taking turns', '輪流合作')],
    note: l('Campers do not keep their own phones at camp, so teams use the camp’s camera.', '營隊期間，營員的手機不帶在身上，所以拍照用營隊的相機。'),
  },
  7: {
    steps: [
      l('It starts at the dock with a briefing, before anyone gets on the water.', '一開始先在碼頭集合聽行前說明，之後才上船。'),
      l('Every camper puts on a life jacket, and a counselor checks each one.', '每位營員穿上救生衣，由隊輔逐一檢查。'),
      l('On the calm kayak lake, with the venue’s kayak coach, teammates paddle in turn inside the coach’s marked area.', '在平靜的獨木舟湖上，有園區的獨木舟教練在場，隊友輪流在教練標示的範圍內划行。'),
      l('Paddle straight, sit steady, hand over smoothly: that keeps a team’s relay moving.', '划得直、坐得穩、交接順，小隊的接力才能一棒接一棒。'),
    ],
    takes: [l('Balance', '平衡感'), l('Paddling rhythm', '划槳節奏'), l('Careful listening', '專心聆聽')],
    note: l('The relay does not run in rain, thunder or strong wind.', '下雨、打雷或強風時，這項活動不進行。'),
  },
  8: {
    steps: [
      l('The lawn is split into two halves, and each team places its flag in its own half.', '草地分成兩個半場，兩隊各自把隊旗放在自己的半場。'),
      l('Each team huddles to plan who guards its flag and who goes after the other one.', '兩隊各自圍成一圈討論戰術：誰留守護旗，誰出擊奪旗。'),
      l('Raiders cross into the other half and dodge the defenders trying to tag them.', '進攻的隊員跑進對方半場，閃躲防守隊員，不讓對方碰到。'),
      l('The first team to bring the other flag back to its own half takes the round.', '先把對方的隊旗帶回自己半場的一隊，拿下這一局。'),
    ],
    takes: [l('Strategy', '戰術頭腦'), l('Quick feet', '腳步敏捷'), l('Fair play', '運動家精神')],
    note: l('Tagging is by touch only, with no grabbing or pushing.', '抓人只能用手碰，不拉扯、不推擠。'),
  },
  9: {
    steps: [
      l('The team hears its mission, and the clock starts.', '小隊聽完任務說明，計時開始。'),
      l('Tasks come one after another: obstacle-style tasks and movement challenges.', '關卡一個接一個：有障礙關卡，也有肢體挑戰。'),
      l('Some tasks take many hands. Others take a sharp mind.', '有的關卡靠大家一起出力，有的靠動腦解題。'),
      l('When the last task is done, the clock stops. That is the team’s time.', '最後一關完成，計時停止，這就是小隊的完成時間。'),
    ],
    takes: [l('Quick thinking', '腦筋動得快'), l('Coordination', '肢體協調'), l('Teamwork', '團隊合作')],
  },
  10: {
    steps: [
      l('In the Color War finale, each team meets every other team once on the rope.', '在 Color War（小隊對抗賽）總決賽，每個小隊都會和其他各隊各拔一場。'),
      l('The two teams line up along the rope, find their grip and set their feet.', '兩隊沿著繩子排好，握緊繩子、站穩腳步。'),
      l('On the signal, everyone leans back and pulls to the same beat.', '口令一下，全隊重心往後，跟著同一個節拍一起拉。'),
      l('A pull ends when the rope’s center mark crosses one team’s line.', '繩子中央的記號拉過其中一邊的線，這一局就結束。'),
    ],
    takes: [l('A shared rhythm', '節奏一致'), l('Firm footing', '下盤要穩'), l('Team spirit', '團隊士氣')],
  },
  11: {
    steps: [
      l('Each team starts at one station, then moves on to the next at the signal.', '每個小隊從一個關卡開始，信號一響就換到下一關。'),
      l('At relay stations, teammates go one after another: hopping in a sack, or carrying a cup of water.', '接力關一棒接一棒：套著麻布袋往前跳，或是端著一杯水往前送。'),
      l('At target stations, aim is everything: tossing rings, or throwing a frisbee at a target.', '投準關比的是準頭：套圈圈，或是把飛盤丟向目標。'),
      l('Every station’s score goes up on the Color War board.', '每一關的分數都會記上 Color War（小隊對抗賽）計分板。'),
    ],
    takes: [l('Quick feet', '腳步敏捷'), l('Good aim', '瞄得準'), l('Cheering teammates on', '為隊友加油')],
  },
  12: {
    steps: [
      l('The long rope starts to turn, and the team watches its beat before anyone jumps in.', '大繩甩起來了，小隊先看準節拍，再跳進去。'),
      l('Teams work up through levels of group jumping, finding the rhythm as they go.', '小隊一級一級往上挑戰，邊跳邊抓節奏。'),
      l('Then the whole team jumps together, and everyone counts the jumps.', '接著全隊一起跳，大家一起數跳了幾下。'),
      l('In the Color War finale, each team goes for its highest count of jumps together.', '到了 Color War（小隊對抗賽）總決賽，每個小隊都要挑戰全隊一起跳的最高次數。'),
    ],
    takes: [l('Good timing', '抓準時機'), l('Jumping as one', '全隊同步'), l('Never giving up', '不輕言放棄')],
  },
  13: {
    steps: [
      l('A web of rope stands between the team and the far side.', '一張用繩子拉成的網擋在小隊面前，對面就是終點。'),
      l('Before anyone moves, the team looks the web over and plans who goes through where.', '行動之前，全隊先把整張網看清楚，商量誰從哪裡通過。'),
      l('Campers go through one at a time. Teammates call out and give safe support.', '營員一次一位通過，隊友在旁邊出聲提醒，並給予安全的協助。'),
      l('The goal: the whole team on the far side, with nobody touching the rope.', '目標是全隊都到對面，而且沒有人碰到繩子。'),
    ],
    takes: [l('Planning ahead', '事先規劃'), l('Speaking up', '主動開口'), l('Patience', '耐心')],
  },
  14: {
    steps: [
      l('Each camper holds a short half-pipe, and the team lines up from the start toward the target.', '每位營員拿一段半圓形的短管，全隊從起點往終點排成一列。'),
      l('The ball rolls from pipe to pipe along the line.', '球從一段管子滾到下一段管子。'),
      l('Once the ball has rolled on, campers move forward to keep the pipeline going.', '球滾過去之後，營員往前補位，讓管道一路接下去。'),
      l('The run is done when the ball reaches the target without falling off the pipes.', '球順利滾到終點、中途沒有掉落，就算完成。'),
    ],
    takes: [l('Steady hands', '手要穩'), l('Smooth handoffs', '銜接順暢'), l('Constant communication', '隨時溝通')],
    note: l('This is also one of the Bambi Amazing Race checkpoints.', '這項挑戰也是斑比探索大挑戰的檢查點之一。'),
  },
  15: {
    steps: [
      l('Two lines on the ground mark the “river.” The team gets a few flat mats or boards as “islands.”', '地上兩條線之間就是「河流」，小隊拿到幾塊扁平的墊子或板子當「小島」。'),
      l('There are fewer islands than campers, so the team plans how to share them before setting out.', '小島比人少，出發前全隊先商量怎麼共用。'),
      l('Campers step from island to island, then pass the last one forward and lay it down ahead.', '營員踩著小島一步步前進，再把最後面那塊傳到前面放好。'),
      l('The crossing is done when the whole team reaches the far bank.', '全隊都踏上對岸，就算過河成功。'),
    ],
    takes: [l('Thinking ahead', '想好下一步'), l('Good balance', '平衡感'), l('Helping each other', '互相照應')],
  },
  16: {
    steps: [
      l('Campers pair up. One puts on a blindfold, and the other becomes the guide.', '營員兩兩一組，一人戴上眼罩，另一人當引導員。'),
      l('The guide uses only words: forward, stop, two small steps left.', '引導員只能用說的：往前、停、向左兩小步。'),
      l('The blindfolded partner walks slowly through the cones, listening only for the guide’s voice.', '蒙眼的夥伴慢慢穿過角錐之間，專心聽引導員的聲音。'),
      l('At the end of the maze, partners swap roles and go again.', '走出迷宮後，兩人交換角色，再走一次。'),
    ],
    takes: [l('Careful listening', '專心聆聽'), l('Clear directions', '口令清楚'), l('Trust', '互相信任')],
    note: l('Walking pace only, on flat grass.', '全程用走的，場地是平坦的草地。'),
  },
  17: {
    steps: [
      l('The “toxic waste” is pretend: a light container inside a no-go zone.', '「危險物質」是假的：其實是個輕巧的容器，擺在禁區裡。'),
      l('Campers stand outside the zone, each holding a rope that leads to the container.', '營員站在禁區外，每人拉住一條通往容器的繩子。'),
      l('Pulling together with steady, even tension, the team picks the container up without anyone stepping into the zone.', '大家用穩定又平均的力道一起拉，在沒有人踏進禁區的情況下，把容器提起來。'),
      l('The team moves the container out of the zone and sets it down at the target.', '全隊把容器移出禁區，穩穩放到定點。'),
    ],
    takes: [l('Steady hands', '手要穩'), l('Clear communication', '清楚溝通'), l('Patience', '耐心')],
    note: l('This is also one of the Bambi Amazing Race checkpoints.', '這項挑戰也是斑比探索大挑戰的檢查點之一。'),
  },
  18: {
    steps: [
      l('Several campers line up on one pair of long skis on the lawn, one foot on each ski.', '幾位營員在草地上排成一列，踩上同一副長長的大腳板，左右腳各踩一邊。'),
      l('The group agrees on a call, such as “left, right,” and tries a few steps in place.', '全組先約好口令，像是「左、右」，在原地試踩幾步。'),
      l('At the start signal, groups step down a short, straight lane, every foot moving on the same count.', '出發信號一響，各組沿著短短的直線賽道前進，大家的腳步都跟著同一個口令。'),
      l('If the rhythm slips, the skis stall. The group resets its count and steps on to the finish line.', '節奏一亂，大腳板就卡住；重新喊好口令，再一起踏向終點線。'),
    ],
    takes: [l('Moving as one', '步伐一致'), l('Balance', '平衡感'), l('Listening', '專心聆聽')],
  },
  19: {
    steps: [
      l('Inside the marked zone the ground is off limits. The only places to stand are a few low crates.', '指定區域裡，地面不能踩，能站的只有幾個低矮的箱子。'),
      l('The team plans first: who steps where, and how the crates are moved along.', '小隊先商量好：誰踩哪個箱子、箱子怎麼一路往前傳。'),
      l('Campers step from crate to crate, moving the crates along to keep the path going.', '營員踩著箱子一個個前進，邊走邊把箱子往前挪，讓路一直接下去。'),
      l('The crossing counts once every camper is standing on the far side.', '全隊每個人都到了對面，才算過關。'),
    ],
    takes: [l('Planning ahead', '事先規劃'), l('Careful steps', '腳步踩穩'), l('Teamwork', '團隊合作')],
    note: l('Crates stay flat on the ground and are never stacked.', '箱子一律平放在地面，絕不疊高。'),
  },
  20: {
    steps: [
      l('Each team gets its first clue and one goal: open the locked mission box.', '每個小隊拿到第一道線索，目標只有一個：打開上鎖的任務寶箱。'),
      l('Each solved puzzle leads to the next clue, such as a code to crack or a pattern to spot.', '每解開一題，就得到下一道線索，像是破解密碼或找出規律。'),
      l('Teammates split up the work, check each other’s answers and keep the clues in order.', '隊員分工合作、互相核對答案，把線索依序排好。'),
      l('The last answer opens the lock. The first team to open the mission box wins the race.', '最後的答案就能開鎖，最先打開任務寶箱的小隊贏得比賽。'),
    ],
    takes: [l('Sharp eyes', '敏銳觀察'), l('Logic', '邏輯推理'), l('Sharing the work', '分工合作')],
    note: l('A wet-weather activity, indoors in the main dining hall. Only the box is locked; campers are never locked in.', '雨天活動之一，在室內的主餐廳進行；上鎖的只有寶箱，營員不會被鎖在房間裡。'),
  },
  21: {
    steps: [
      l('Each station in the main dining hall has a challenge that uses everyday objects: cups, balls, cards.', '主餐廳裡設好一個個關卡，每一關都用杯子、球、紙牌這類日常小物來挑戰。'),
      l('A team has one minute per challenge, such as stacking cups into a tower or bouncing a ball into a cup.', '每個挑戰只有一分鐘，像是把杯子疊成高塔，或把球彈進杯子裡。'),
      l('Teammates cheer and count down the last seconds until time is up.', '隊友在旁邊加油，一起倒數最後幾秒，直到時間到。'),
      l('Teams rotate to the next station, and the scores go on the Color War board.', '各小隊輪流換到下一關，成績記上 Color War（小隊對抗賽）計分板。'),
    ],
    takes: [l('Quick hands', '眼明手快'), l('Focus', '專注力'), l('Good humor', '幽默感')],
    note: l('One of the wet-weather activities, held indoors in the main dining hall.', '雨天活動之一，在室內的主餐廳進行。'),
  },
  22: {
    steps: [
      l('Soda bottles stand in a row on open ground outdoors, and campers take their places behind a line.', '幾瓶汽水在戶外空地上排成一列，營員站到標線後方。'),
      l('Each team guesses which geyser will shoot highest and calls out its pick.', '各小隊先猜哪一道噴泉會衝得最高，大聲喊出答案。'),
      l('An adult sets off every geyser by dropping candy into the bottle, and soda foam shoots into the air.', '成人把糖果投進瓶中，啟動每一道噴泉，汽水泡沫瞬間衝向空中。'),
      l('Campers compare the heights and see which team’s guess was right.', '營員比一比每道噴泉的高度，看看哪一隊猜對了。'),
    ],
    takes: [l('A bold guess', '大膽預測'), l('Careful watching', '仔細觀察'), l('Comparing results', '比較結果')],
    note: l('Outdoors only. An adult sets off every geyser, and campers watch from behind a line.', '只在戶外進行；每一道噴泉都由成人啟動，營員在標線後方觀看。'),
  },
  23: {
    steps: [
      l('Campers gather behind a line, facing the adult who runs the demonstration.', '營員在標線後方集合，面向負責示範的成人。'),
      l('The adult sets everything up and adds the last ingredient.', '成人把一切準備好，加入最後一樣材料。'),
      l('Thick foam surges up and spills over the top while campers watch from behind the line.', '濃密的泡沫立刻往上竄、從容器口滿出來，營員在標線後方看得清清楚楚。'),
    ],
    takes: [l('Curiosity', '好奇心'), l('Watching closely', '專心觀看'), l('Standing back', '保持距離')],
    note: l('An adult does the whole demonstration; campers watch from behind a line and handle no ingredients.', '全程由成人操作示範；營員在標線後方觀看，不接觸任何材料。'),
  },
  24: {
    steps: [
      l('Each team sets up on the lawn with giant wands and a tray of bubble mix.', '每個小隊在草地上就定位，拿到巨型泡泡棒和一盤泡泡水。'),
      l('Campers take turns dipping a wand, lifting it slowly and drawing a big bubble out through the air.', '營員輪流把泡泡棒沾滿泡泡水，慢慢提起，在空中拉出一個大泡泡。'),
      l('Teams try one change at a time: a slower pull, a new angle, a gentle twist to close the bubble.', '每次只換一種做法再試：拉慢一點、換個角度，或輕輕一轉把泡泡收口。'),
      l('Then teams race for the biggest bubble and the longest-lasting one, counting the seconds out loud.', '最後比一比誰的泡泡最大、誰的撐最久，大家一起大聲數秒。'),
    ],
    takes: [l('A gentle touch', '動作輕柔'), l('Trying again', '反覆嘗試'), l('Taking turns', '輪流上場')],
  },
  25: {
    steps: [
      l('Each team threads a straw onto a string line and tapes a balloon to the straw.', '每個小隊先把細繩穿過吸管，再用膠帶把氣球黏在吸管上。'),
      l('Teams blow up the balloon, let go and watch their rocket zip along the string.', '把氣球吹飽、手一放，看自己的火箭沿著細繩咻地衝出去。'),
      l('After the first race, each team changes one thing, such as how much air goes in or where the tape sits.', '第一輪比完，每隊只改一個地方，像是氣吹多飽、膠帶貼哪裡。'),
      l('Teams race again and compare: did the change make the rocket faster?', '再比一次，比比看：改了之後，火箭有沒有更快？'),
    ],
    takes: [l('Hands-on building', '動手製作'), l('Sharp eyes', '敏銳觀察'), l('Trying again', '反覆嘗試')],
  },
  26: {
    steps: [
      l('Every team gets the same small kit, such as paper, straws, tape and craft sticks.', '每個小隊拿到一份相同的小材料包，像是紙、吸管、膠帶和冰棒棍。'),
      l('Teams agree on a plan, then build a bridge or a tower using only what is in the kit.', '小隊先討論好做法，再只用材料包裡的東西，搭出一座橋或一座高塔。'),
      l('Test time: teams see how well their structure holds up.', '測試時間到：看看自己的作品撐不撐得住。'),
      l('Teams find the weak spot, rebuild and test again.', '小隊找出弱點，動手改良，再測一次。'),
    ],
    takes: [l('Planning ahead', '事先規劃'), l('Steady hands', '手穩心細'), l('Sharing the work', '分工合作')],
  },
  27: {
    steps: [
      l('Every team gets the same kit and one egg.', '每個小隊拿到一份相同的材料包和一顆雞蛋。'),
      l('Teams build a carrier to keep their egg in one piece.', '小隊動手做出護蛋裝置，想辦法讓雞蛋完好無缺。'),
      l('Teams guess how their egg will do, then hand the carrier to a counselor for the drop.', '先猜猜雞蛋撐不撐得住，再把裝置交給隊輔做落下測試。'),
      l('After the drop, teams check the egg, talk over what worked and redesign.', '落地後檢查雞蛋，一起聊聊哪些做法有用，再重新設計。'),
    ],
    takes: [l('Clever design', '巧妙設計'), l('Careful hands', '細心製作'), l('Talking it over', '一起討論')],
    note: l('A counselor does every drop, from a fixed height onto a tarp.', '每一次落下都由隊輔操作，從固定高度落到防水布上。'),
  },
  28: {
    steps: [
      l('Teams dig their hands into oobleck, a mix of cornstarch and water.', '小隊把手伸進用玉米粉加水調成的澱粉泥裡。'),
      l('They move a hand through it slowly and watch it run like a liquid.', '慢慢把手划過去，看它像液體一樣流動。'),
      l('Then they give it a quick slap, and it feels solid.', '接著快速一拍，它摸起來卻像固體一樣硬。'),
      l('Teams try a few playful challenges, guessing first and comparing slow moves with sudden ones.', '小隊試玩幾個趣味挑戰，先猜結果，再比比看慢慢來和突然用力有什麼不同。'),
    ],
    takes: [l('Curiosity', '好奇心'), l('Bold guesses', '大膽猜測'), l('Happy getting messy', '不怕弄髒')],
    note: l('Messy play, so old clothes are best.', '會玩得髒兮兮，建議穿舊衣服。'),
  },
  29: {
    steps: [
      l('Teams pick up an air cannon: a box or bucket with a hole in front and a flexible back.', '小隊拿起空氣砲：一個前面開洞、背面有彈性的箱子或桶子。'),
      l('They tap the back, and a ring of air puffs out of the hole.', '往背面一拍，洞口就噴出一圈空氣。'),
      l('Teams aim at paper cup targets and try to knock them over.', '瞄準當靶子的紙杯，試著把它們一一吹倒。'),
      l('Teams compare soft taps with hard ones, near with far, and watch how far the air ring travels.', '小隊比比看輕拍和重拍、站近和站遠，看這圈空氣能跑多遠。'),
    ],
    takes: [l('Good aim', '瞄得準'), l('Comparing results', '比較結果'), l('Taking turns', '輪流上場')],
    note: l('The cannons fire nothing but air, and the targets are paper cups.', '空氣砲噴出的只有空氣，靶子是紙杯。'),
  },
  30: {
    steps: [
      l('Teams hear the theme the day before the final campfire.', '最後一場營火的前一天，各小隊會先知道表演主題。'),
      l('Each team picks one act, maybe a skit, a song or a comedy bit, and rehearses it once.', '每隊選定一個節目，短劇、歌曲或搞笑表演都可以，然後排練一次。'),
      l('On the last evening, teams take turns performing around the fire, one act each.', '最後一晚，各小隊圍著營火輪流登場，每隊表演一個節目。'),
      l('After the last act, it’s time for s’mores.', '最後一個節目結束後，就是 s’mores（烤棉花糖夾心餅）時間。'),
    ],
    takes: [l('Courage on stage', '上台的勇氣'), l('Fresh ideas', '創意點子'), l('Teamwork', '團隊默契')],
  },
  31: {
    steps: [
      l('On the first afternoon, each team agrees on a mascot and works out a mascot pose.', '第一天下午，各小隊一起決定吉祥物，再設計吉祥物姿勢。'),
      l('Teams design a crest and make their banner.', '小隊設計隊徽，動手做出自己的隊旗。'),
      l('They write a chant and practice a short team introduction.', '接著編出口號，再練習一段簡短的小隊介紹。'),
      l('That evening, teams use the banner and chant at the Color War Opening Ceremony.', '當天晚上，隊旗和口號就在 Color War 開幕式登場。'),
    ],
    takes: [l('Imagination', '想像力'), l('Reaching agreement', '凝聚共識'), l('Team pride', '小隊榮譽感')],
  },
  32: {
    steps: [
      l('Teams gather at the opening campfire on the first evening.', '第一天晚上，各小隊在開營營火旁集合。'),
      l('Each team presents its banner and chant and strikes its mascot pose.', '各小隊亮出隊旗、喊出口號，再擺出吉祥物姿勢。'),
      l('Teams earn the first spirit points, and Color War begins.', '各小隊拿下第一批精神積分，Color War 正式展開。'),
      l('After the ceremony, it’s time for s’mores.', '開幕式結束後，就是 s’mores（烤棉花糖夾心餅）時間。'),
    ],
    takes: [l('Team spirit', '團隊精神'), l('A loud voice', '聲音宏亮'), l('Confidence', '自信上場')],
    note: l('Color War is the camp-long friendly contest between the teams; team scores from the games add up to it.', 'Color War（小隊對抗賽）是貫穿整個營期的小隊友誼賽，各項遊戲的得分都會累計。'),
  },
}
