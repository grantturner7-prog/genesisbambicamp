"""Front and back matter of the counselor pack."""

INTRO = [
    'This is the plan for the four days, written for the people who run them. Every activity has its own sheet: where it happens on the camp, what to set up and when, what to say to the campers, what happens minute by minute, who does what, how it scores, and every piece of kit it needs.',
    'The times are fixed and they add up: each sheet fills its slot in the schedule exactly. Every map is drawn to scale on our 3D model, which is traced from Bambi’s own camp map. It has not been measured on the ground, so pace out each court and station on Thursday morning and move any that do not fit.',
]

PLACES = [
    ('HQ', 'HQ Palms', 'The two palms in the middle of the Big Lawn. The Director’s base, the nurse’s table, water, the day’s kit. Three short whistles mean: come here.'),
    ('6, 7', 'The Big Lawn', 'Our playing field, between the vans and the main path. The North Lawn is about 44 × 30 m and the South Lawn about 42 × 44 m.'),
    ('8', 'Van Village', 'Our 15 vans at the north-east corner: 11 camper vans (teal dots) and 4 staff vans (purple dots). The counselors sleep in B05, B12 and A08, and the nurse and the Director in A06. The deck of B05 is the kit store.'),
    ('9, 10', 'Dock Gate and the Dock', 'Dock Gate is where our path meets the lake lane. Teams line up there. Campers go on the Dock only with a counselor or the coach.'),
    ('11, 12', 'Campfire Circle and Cinema Lawn', 'Side by side, about 25 m west of HQ Palms.'),
    ('13', 'Airstream', 'The silver snack trailer beside the pool. The pool itself is closed to the camp, and a flag line on the lawn marks the edge.'),
    ('1, 2', 'The Hall and the Restrooms', 'The Hall is where we eat and where every wet-weather activity goes. It is 200 m from the vans, a four-minute walk along the main path.'),
    ('3, 4, 5', 'Reception, Tram Stop, Main Gate', 'The bus stops at Reception. The Main Gate is the edge of camp.'),
    ('14', 'Bird Lake Lookout', 'On the lane east of the Wild Waterbird Lake. Used once, in the Orienteering Quest.'),
]

TEAMS = [
    'Thirty campers make three teams of ten: Yellow, Orange and Green, the colors of the Decathlon bibs. Each team chooses its own name and mascot on Thursday afternoon.',
    'Each team is two squads of five: Y1 and Y2, O1 and O2, G1 and G2. Team games are played ten against ten. Squad games give six squads, which means three matches at once or six stations with nobody waiting.',
    'The Director sets the squads before camp, balanced for age, and every camper has a buddy inside their squad.',
]

STAFF = [
    ('Camp Director', 'Runs the day. Keeps the one clock and the whistle at every timed activity, hosts the evenings, makes the weather call. Base: HQ Palms.'),
    ('Nurse', 'Health, medicine and first aid, day and night. At the Dock Gate whenever boats are on the water, otherwise at HQ Palms or with the largest group.'),
    ('Six squad counselors', 'One for each squad, called by the squad’s name: “Y1’s counselor”. With their five campers from the wake-up knock to lights out. They count, coach, time and score their own squad.'),
    ('Floater 1', 'Kit and set-up. Lays out each activity before it starts, referees, tends the fire, keeps the shore watch on the Dock.'),
    ('Floater 2', 'Scores and set-up. Works with Floater 1 on every set-up, hosts craft stations, collects every score slip and keeps the Color War board.'),
    ('Bambi’s team', 'The kayak coach, the tram driver, the kitchen, the Star Cinema projector, and the front desk.'),
]

RADIOS = 'Eight radios: the Director, the nurse, Floater 1, Floater 2, and the counselors of Y1, O1 and G1, with one spare that goes to the Dock on lake days. Every adult also carries a phone, a whistle and a lanyard with the day’s timetable, and each squad counselor carries the squad first-aid kit.'

SCORING_RULES = [
    ('Squad games', '6, 5, 4, 3, 2, 1', 'The six squads are ranked and each squad’s points go to its team.'),
    ('Team games', '10, 7, 4', 'The three teams are ranked.'),
    ('Sports league', '3, 1, 0 and fair play 1', 'A win is 3, a draw 1. Each squad can also earn 1 fair-play point a game.'),
    ('Van check', '0 to 5 a van', 'Friday and Saturday at 07:30. Each camper takes their van’s score to their own team: 50 at most a team each day.'),
    ('Spirit award', '5', 'To one team for each of Thursday, Friday and Saturday. The counselors vote at the evening huddle.'),
    ('Sunday finale', '20, 14, 8', 'Three team events at double points.'),
]

SCORED = [
    ('Thu', 'Team banner and chant, at the campfire', 'Team', '10, 7, 4'),
    ('Fri', 'Van check', 'Van', '0 to 5'),
    ('Fri', 'Orienteering Quest', 'Squad', '6 to 1'),
    ('Fri', 'Bambi Amazing Race', 'Squad', '6 to 1'),
    ('Fri', 'Multi-sports league, round 1', 'Squad', '3, 1, 0 + 1'),
    ('Fri', 'Shelter Build Challenge', 'Squad', '6 to 1'),
    ('Fri', 'Board-Game Café', 'Table', '2, 1'),
    ('Fri', 'Glow Night Quest', 'Squad', '6 to 1'),
    ('Sat', 'Van check', 'Van', '0 to 5'),
    ('Sat', 'Multi-sports league, round 2', 'Squad', '3, 1, 0 + 1'),
    ('Sat', 'Camp Olympics Relay Medley', 'Squad', '6 to 1'),
    ('Sat', 'Kayak Skills Relay', 'Team', '10, 7, 4'),
    ('Sat', 'Oobleck Olympics', 'Squad', '6 to 1'),
    ('Sat', 'Egg Drop Build Challenge', 'Squad', '6 to 1'),
    ('Sat', 'Games Arcade', 'Squad', '6 to 1'),
    ('Sat', 'Skit & Talent Showdown', 'Team', '10, 7, 4'),
    ('Sat', 'Treasure Hunt', 'Squad', '6 to 1'),
    ('Sun', 'Tug-of-War Tournament', 'Team', '20, 14, 8'),
    ('Sun', 'Giant Rope Jump Challenge', 'Team', '20, 14, 8'),
    ('Sun', 'The final relay', 'Team', '20, 14, 8'),
]

BOARD = [
    'The Color War board is three columns on poster paper on the Hall wall, beside the door. Floater 2 adds every result at the next meal.',
    'Counselors hand score slips to Floater 2 straight after each activity. A slip names the activity, the squads or teams, and the result. Nothing is added up in anyone’s head.',
    'Tied squads or teams both take the points of the higher place.',
    'From Saturday dinner the board is covered. The final totals are shown for the first time at the prize-giving.',
]

BASICS = [
    ('Count before you move', 'Each squad counselor counts five before every move and after it. When the Director calls “Squads?”, six counselors answer “Five!”. A count by name from the roster is done three times a day: at the morning van check, at lights out, and whenever we board the bus.'),
    ('Two whistle signals', 'One long whistle: stop and look at the Director. Three short whistles: walk to HQ Palms.'),
    ('Water', 'No camper is at a lake edge, on the Dock or past the flag line by the pool without a counselor. On the water, life jackets stay clipped and Bambi’s coach is in charge.'),
    ('Fire', 'Counselors light, feed and put out the fire. Campers sit on the logs.'),
    ('After dark', 'Campers carry a torch. Counselors wear a headlamp and a bright vest. Groups walk together with a counselor at the back.'),
    ('Adults and campers', 'No counselor is alone with one camper out of sight of others. Van checks are done by two counselors.'),
    ('Hurt or unwell', 'Small things are treated on the spot from the squad kit. For anything else the counselor radios the nurse. The nurse and the Director decide together whether to phone the family.'),
    ('A camper is not at a count', 'It is nearly always the toilet, the van or another squad. The squad counselor says the name on the radio. Every counselor checks their own group, one floater checks the vans and toilets, and the other walks the lake side and the pool side. The program carries on. If the camper has not turned up once the camp has been checked, the Director takes over and decides what happens next with Bambi’s front desk.'),
    ('Thunder', 'Everyone walks to the Hall or the vans and waits there until the Director gives the all-clear.'),
    ('A real emergency', 'Phone 119, then tell the Director, who phones Bambi’s duty number to have the gate opened. The camp’s address and the phone numbers are on the back of every lanyard.'),
]

ROUTINE = dict(
    id='routine', day='Every day', title='The daily rhythm: wake-up to lights out',
    where='Van Village, HQ Palms and the Hall', who='Everyone', lead='Director', score='Van check: 0 to 5',
    map='routine', mapcap='The three places every day turns on: the Van Village, HQ Palms on the Big Lawn, and the Hall, 200 m away along the main path.',
    idea='The same simple frame holds Friday, Saturday and Sunday morning. Campers always know what comes next, and counselors always know where to be.',
    setup=[], say=[],
    run=[],
    blocks=[
        dict(type='table', title='The frame of every day', head=['Time', 'What happens', 'Who'], rows=[
            ['06:45', 'Counselors up.', 'All counselors'],
            ['07:00', 'Wake by a counselor’s knock on every van door.', 'Squad counselors'],
            ['07:30', 'Van check. Campers stand at their own van door and are counted by name. Two pairs score the vans: Floater 1 and a counselor in row B, Floater 2 and a counselor in row A.', 'Floater 1, Floater 2'],
            ['07:50', 'Walk to the Hall by squad.', 'Squad counselors'],
            ['08:00', 'Breakfast. Squads sit together and their counselor eats with them.', 'Everyone'],
            ['08:50', 'Morning circle at HQ Palms, ten minutes, on Friday and Saturday: yesterday’s scores and the van scores, the spirit award, the weather call and what to wear, and the day in three sentences. On Sunday there is no circle: the Director makes the weather call at 07:30, at the van check.', 'Director'],
            ['Meals', 'The walk from the lawn or the vans starts ten minutes before the meal. Floater 2 updates the Color War board. The nurse checks the plates of campers with allergies against the kitchen’s list.', ''],
            ['After lunch', 'Rest in the vans, 30 to 40 minutes. Quiet, on the beds, no visiting other vans. Counselors sit on the decks.', 'Squad counselors'],
            ['Showers', 'In the camper’s own van, three in turn. Counselors stay outside on the deck.', ''],
            ['21:30', 'Torch walk to the vans. Teeth, pajamas, quiet time.', 'Squad counselors'],
            ['21:45', 'Evening van check by name: two counselors knock, see every face and say goodnight.', 'Two counselors a row'],
            ['22:00', 'Lights out.', ''],
            ['22:10', 'Counselor huddle on the deck of van B05, ten minutes: score slips to Floater 2, the spirit vote, tomorrow’s bins, the weather.', 'Director'],
        ]),
        dict(type='table', title='The van check: 5 points a van', head=['1 point for', 'It means'], rows=[
            ['Beds', 'Covers pulled up, pillows on top.'], ['Bags', 'Closed and against the wall.'], ['Floor', 'Nothing on it but shoes, in a row by the door.'],
            ['Bathroom', 'Towels hung up, nothing in the basin.'], ['Wet things', 'On the drying line or the deck rail, not inside.'],
        ]),
        dict(type='list', title='At night', items=[
            'The counselors of Y1, O1 and G1 sleep one in each of the three counselor vans, B05, B12 and A08, and keep their radios on. A lantern burns on each of those three decks and on the nurse’s, A06, so that a camper who needs an adult knows which door to knock on.',
            'The Director keeps Bambi’s night duty number.',
            'Campers’ phones were handed in at the hotel on Thursday and are kept by the Director in their own lock box. They come back at boarding on Sunday.',
        ]),
    ],
    roles=[], scoring=['Each van is scored 0 to 5 on Friday and Saturday morning. Every camper takes their van’s score to their own team.'],
    kit=[('Van score sheets on a clipboard', '2', 'print', '1'), ('Printed roster', '10', 'print', '1'), ('Lanterns, for the four staff decks', '4', 'E8b', '3'), ('Twine and pegs: one drying line a row', '2', 'D14c, D14b', '2'), ('Spare batteries for headlamps, radios and lanterns', '1 pack of each', 'C10', '1')],
    rain='The morning circle moves into the Hall, straight after breakfast.', watch=[],
)

DAYS = [
    ('Thursday 28 January', 'Arrival, the lake and the opening fire', [
        ('08:00', 'Meet at The Lin Hotel, Taichung. Roster, medicine and phones handed in, team bibs on. The bus leaves at 08:30.', 'Taichung', None),
        ('10:00–10:55', 'Arrival, welcome circle and the orientation walk', 'Bus Point, South Lawn, six stops', 'arrival'),
        ('10:55–11:40', 'Check-in rotation', 'Vans, HQ Palms, South Lawn', 'checkin'),
        ('12:00–12:50', 'Lunch. The walk starts at 11:45.', 'The Hall', None),
        ('13:00–13:30', 'Rest in the vans. All three teams dress for the lake.', 'Van Village', None),
        ('13:30–15:55', 'Lake rotation: kayaking, banner workshop, lawn games', 'The Dock, North Lawn, South Lawn', 'lake1'),
        ('16:00–17:40', 'Warm drink, then the eco-tram at dusk', 'HQ Palms, Tram Stop', 'tram'),
        ('18:00–18:45', 'Dinner. The walk starts at 17:45.', 'The Hall', None),
        ('19:00–20:30', 'Opening Campfire and Color War Opening Ceremony', 'Campfire Circle', 'campfire'),
        ('20:30–22:00', 'Torch walk, showers 20:45 to 21:30, quiet time, van check 21:45, lights out 22:00.', 'Van Village', 'routine'),
    ]),
    ('Friday 29 January', 'Explorers’ day', [
        ('07:00–09:00', 'Wake 07:00, van check 07:30, breakfast 08:00, morning circle 08:50.', 'Vans, the Hall, HQ Palms', 'routine'),
        ('09:00–10:30', 'Orienteering Quest', 'The whole camp', 'orienteering'),
        ('10:30–10:45', 'Water and snack.', 'HQ Palms', None),
        ('10:45–12:25', 'Bambi Amazing Race', 'Seven checkpoints round the Big Lawn', 'race'),
        ('12:30–13:20', 'Lunch.', 'The Hall', None),
        ('13:30–14:10', 'Rest in the vans.', 'Van Village', None),
        ('14:15–15:00', 'Multi-sports league, round 1', 'Three courts on the Big Lawn', 'sports'),
        ('15:10–16:40', 'Shelter Build Challenge', 'North Lawn', 'shelter'),
        ('16:45–17:50', 'Showers, then the Board-Game Café', 'Vans, the Hall', 'cafe'),
        ('18:00–18:45', 'Dinner.', 'The Hall', None),
        ('19:00–20:00', 'Glow Night Quest', 'The Big Lawn', 'glow'),
        ('20:00–21:30', 'Star Cinema on the lawn', 'Cinema Lawn', 'cinema'),
        ('21:30–22:00', 'Torch walk, van check 21:45, lights out 22:00.', 'Van Village', 'routine'),
    ]),
    ('Saturday 30 January', 'Games and makers’ day, and the final night', [
        ('07:00–09:00', 'Wake 07:00, van check 07:30, breakfast 08:00, morning circle 08:50.', 'Vans, the Hall, HQ Palms', 'routine'),
        ('09:00–10:00', 'Multi-sports league, round 2', 'Three courts on the Big Lawn', 'sports'),
        ('10:00–10:15', 'Water, fruit and a cereal bar.', 'HQ Palms', None),
        ('10:15–11:00', 'Camp Olympics Relay Medley', 'South Lawn', 'olympics'),
        ('11:10–12:40', 'Lake session 2: kayak relay, bracelets, bubble lab', 'The Dock, North Lawn, South Lawn', 'lake2'),
        ('12:45–13:35', 'Lunch.', 'The Hall', None),
        ('13:40–14:10', 'Rest in the vans.', 'Van Village', None),
        ('14:15–14:55', 'Science hands-on: Oobleck Olympics and the Mentos Geyser', 'South Lawn', 'science'),
        ('15:00–16:00', 'Egg Drop Build Challenge', 'North Lawn, main path', 'eggdrop'),
        ('16:00–16:15', 'Break.', 'HQ Palms', None),
        ('16:15–16:55', 'Games Arcade', 'North Lawn', 'arcade'),
        ('17:00–17:55', 'Skit run-through to 17:15, then showers and the camp T-shirt.', 'Van Village', 'finalfire'),
        ('18:00–19:15', 'Signature family dinner with Wagyu.', 'The Hall', None),
        ('19:30–20:25', 'Final Campfire: the Skit & Talent Showdown', 'Campfire Circle', 'finalfire'),
        ('20:30–21:20', 'Saturday Treasure Hunt', 'The Big Lawn and the Van Village', 'treasure'),
        ('21:20–22:00', 'Walk back, bags packed for Sunday, van check 21:45, lights out 22:00.', 'Van Village', 'routine'),
    ]),
    ('Sunday 31 January', 'The finale and home', [
        ('07:00–08:30', 'Pack-out, keys and breakfast', 'Vans, Bus Point, the Hall', 'packout'),
        ('08:40–09:20', 'Color War Finale', 'South Lawn', 'finale'),
        ('09:20–10:00', 'Prize-giving, and the bus home at 10:00', 'South Lawn, Bus Point', 'prizes'),
        ('≈ 11:30', 'The Lin Hotel, Taichung. Families collect until 12:00.', 'Taichung', None),
    ]),
]

DECIDED = [
    ('Team colors', 'Yellow, Orange and Green. Buy the bibs in those three colors.'),
    ('Staff', 'Ten adults: the Director, the nurse, six squad counselors and two floaters with fixed jobs (kit, and scores).'),
    ('Vans', 'Fifteen: eleven for campers, B05, B12 and A08 for the eight counselors, and A06 for the nurse and the Director.'),
    ('The scoring scale', 'Squad games 6 to 1, team games 10, 7, 4, the finale at double points, a spirit award of 5. The van check and the sports league score as in the working plan.'),
    ('The advance car', 'The two floaters drive the kit up early on Thursday and are on site by 08:30. The deck of van B05 is the kit store.'),
    ('Every position on the maps', 'Drawn on our 3D model, traced from Bambi’s map and not measured on the ground. Pace the stations out on Thursday morning and move any that do not fit.'),
    ('Turn orders', 'Thursday kayak order Yellow, Green, Orange; tram order Yellow, Orange, Green; Saturday kayak order Green, Orange, Yellow.'),
    ('The Orienteering word', 'ADVENTURES, with the ten control places listed on the sheet. The bonus bearing is measured on the morning.'),
    ('The Amazing Race tasks', 'The seven tasks, their places, and the gold times.'),
    ('Sports fixtures', 'Each squad plays each sport twice over the two days and never plays its own team’s other squad.'),
    ('The skit theme', 'How our mascot saved Camp WOW, with three props a team.'),
    ('The Glow Night Quest', 'Six stations, a six-word sentence, and the cinema tickets in the treasure box.'),
    ('The Egg Drop', 'A 2 m drop onto the main path, and the kit in each bag.'),
    ('Phones and medicine', 'Phones come back at boarding on Sunday. Medicine goes back to families at the hotel.'),
    ('The health form', 'It needs one more line, “can swim 25 m: yes or no”, so that the coach knows who paddles beside the coach’s own boat.'),
]

ASK_BAMBI = [
    'The fifteen vans in one group for all three nights: B05 to B12, A06, A08 and A10 to A14.',
    'The kayak coach on Thursday 13:00 to 15:55 and Saturday 11:00 to 12:40, with ten life jackets in junior sizes and one turn buoy on Saturday. Are the boats singles or doubles?',
    'The eco-tram on Thursday: three runs of 20 minutes at 16:40, 17:00 and 17:20.',
    'Firewood for Thursday and Saturday evening.',
    'The Star Cinema projector and sound on Friday at 20:00, and an evening snack for 30, ready to collect from the kitchen at 18:20.',
    'A hot-water urn at the Dock Gate on Thursday and Saturday, and hot drinks and a snack for 30 brought to HQ Palms on Thursday at 15:45.',
    'Two folding tables from Thursday 09:00 to Sunday 10:00, and the use of an outside tap by our vans. One table stays at HQ Palms. The other serves the s’mores, the cinema and the Arcade.',
    'A yes to soft balls and frisbees on the lawn, and to 60 tent pegs on Friday afternoon.',
    'A yes to moving the Hall tables on a wet day.',
    'Ten campers and four adults arrive ten minutes late for Saturday lunch.',
    'Where the bus should wait on Sunday at 09:30.',
    'The number that is answered at night, and who opens the Main Gate for an ambulance after 23:00.',
]

PRINT = [
    ('Every day', 'Rosters by squad (10 copies), the van list (12 copies) and the key list, van score sheets, score slips (60), the Color War board on poster paper.'),
    ('Thursday', 'Wristbands written with first names and the Director’s number. Two copies of the list of campers who cannot swim 25 m, for the coach and Floater 1.'),
    ('Friday', 'Six laminated A3 camper maps (the last page of this pack), six control cards, six bonus cards, ten control markers and the star; seven Amazing Race task cards and six passports; nine fixture cards (three referees, six squad counselors) and 18 result slips; 30 café tickets and six table numbers; glow station cards, 36 word slips in invisible ink (and the 36 rain-version slips), the riddle card, six squad cards, 30 cinema tickets.'),
    ('Saturday', 'Olympics lane cards and squad cards, Arcade squad cards, judges’ slips for the skits.'),
    ('Sunday', '30 named certificates.'),
    ('Rain bag', 'Six sets of cipher sheets, alphabet strips and race clues; six ESCAPED cards; the three ciphers drawn large on poster paper; six Minute-to-Win-It squad cards.'),
]
