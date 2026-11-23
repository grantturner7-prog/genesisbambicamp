// Wording rules shared by the website audit (audit-copy.mjs) and the printed and social adverts
// (promo.mjs). They keep the camp an outdoor recreation camp in every sentence: no cram-school
// (buxiban) wording, no banned disclaimers, the right township, camper vans, three meals a day.
export const RULES = [
  // Rule A — zero cram-school (buxiban) triggers
  ['A cram-school wording', /education group|教育集團|學院|補習班|\bESL\b|foreign teachers?|外籍教師|外師|美語課程|english class(es)?|english immersion|\bSTEM\b|\bSTEAM\b|placement test|程度分班|結業證書|修業證明|completion certificate|講義|教材|\bteachers?\b|老師|授課|\blessons?\b|curriculum|課程|tutoring|課業輔導/i],
  // Rule C — banned disclaimers
  ['C banned disclaimer', /for reference only|僅供參考|保有最終修改權|reserves? (the )?(final )?right to (modify|change)|概不負責|not responsible for accidents|概不退還|non-?refundable/i],
  // Rule D — truth in advertising
  ['D wrong township', /sanyi|三義/i],
  // Campers meet at the meeting point in Taichung and ride the bus both ways: no drop-off at the camp gate.
  ['D stale arrival plan (campers meet at the meeting point in Taichung; nobody is dropped off at the camp)', /(thursday|週四)[^.。]{0,40}14:[03]0|drop(ped|s)?[- ]?(off|their|them)[^.。]{0,40}(sanwan|\bgate\b)|(送達|送到|送至|送抵)[^。]{0,12}(三灣|園區|大門|營地)|(大門|園區)[^。]{0,8}報到|arrive relaxed|taichung theater|歌劇院|shizheng|市政北二路|tour bus zone|臨停區/i],
  ['D wooden cabins', /wooden cabin|log cabin|小木屋|木屋/i],
  // Meals: three a day (breakfast, DIY lunch with the chef, dinner). None of them is a buffet.
  ['D the camp’s meals are not buffets (breakfast, DIY lunch with the chef, dinner)', /(?<![\w-])buffets?(?![\w-])|自助式|自助餐|吃到飽/i],
  ['D stale meal plan (the camp serves three meals a day)', /\bfour[- ](daily )?meals?\b|(?<![\d.,])4[- ](daily )?meals?\b|一泊四食|四食|(?<![十\d])四餐|(?<!\d)4 ?餐|宵夜|(campfire|evening) snacks?|營火點心|晚間點心/i],
]

/** Returns the rules a text breaks, as [ruleName, matchedText] pairs. */
export const broken = (text) => RULES.flatMap(([name, re]) => { const m = text.match(re); return m ? [[name, m[0]]] : [] })
