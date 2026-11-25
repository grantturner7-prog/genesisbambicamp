"""Sunday 31 January: the finale and home. And the rain sheets."""
from content.fri import carousel

SHEETS = [
    dict(
        id='packout', day='Sunday', start='07:00', end='08:30', title='Pack-out, keys and breakfast',
        where='Van Village → Bus Point → the Hall', who='All 30, by van', lead='Floater 1 and Floater 2', score='Not scored',
        map='packout', mapcap='Bags go from the vans to the Bus Point on the way to breakfast. The finale and the prize-giving are on the South Lawn, and the bus is boarded at B.',
        idea='By breakfast every van is empty, checked and locked, and every bag is at the Bus Point. That leaves the rest of the morning free for the finale.',
        setup=[
            ('Saturday 21:20', 'Squad counselors', 'Bags are packed before lights out. Only wash things and tomorrow’s clothes stay out.'),
            ('07:10', 'Floater 1, Floater 2', 'Walk the three treasure zones and pick up any pieces missed last night.'),
            ('07:25', 'Floater 1', 'Three rows of flat markers on the grass at the Bus Point, one a team, for the bags.'),
        ],
        say=[
            'Bags closed and out on the deck by 07:30. Then stand by your van door.',
            'We check each van with you: under the beds, in the bathroom, behind the door, and every socket for a charger.',
            'You carry your own bag to the Bus Point and put it in your team’s row. Then we walk on to breakfast.',
        ],
        run=[
            ('07:00', '07:30', 'Wake by a counselor’s knock. Dress in the camp T-shirt. Last things into the bags. Bags out on the deck.'),
            ('07:30', '07:55', 'Final van check. The two floaters go van to van with the campers of that van: every cupboard, the bathroom, under the beds, the sockets. Lost things go in the lost-property bag. The key is handed over and ticked on the key list. Each checked van’s campers walk to the Bus Point with a squad counselor and put their bags in the team row.'),
            ('07:55', '08:00', 'Walk on from the Bus Point to the Hall, 120 m.'),
            ('08:00', '08:30', 'Breakfast. At 08:30 the Director takes the keys and the key list to Reception.'),
        ],
        blocks=[
            dict(type='list', title='Good to know', items=[
                'The van check is not scored today. The last van scores were Saturday’s.',
                'The site is ours, so the bags can wait at the Bus Point by themselves. If rain is likely, two tarps go over them.',
                'Wet towels and bedding stay in the van, as Bambi’s housekeeping asks.',
            ]),
        ],
        roles=[('Floater 1, Floater 2', 'Check every van together and collect the keys.'), ('Squad counselors', 'Walk campers and bags to the Bus Point in van groups, then on to the Hall.'), ('Director', 'Returns the keys at 08:30.'), ('Nurse', 'Packs the medicine box: every camper’s medicine goes back to the family at the hotel.')],
        scoring=[],
        kit=[('Key list', '1', 'print', '1'), ('Lost-property bag', '1', 'E9b', '1'), ('Flat markers', '6', 'A1', '7'), ('Tarps, if rain is likely', '2', 'B4', '6')],
        rain='Bags stay on the van decks, under cover, until 09:30, and the two floaters carry them to the bus with the driver.',
        watch=['Chargers left in sockets and shoes left under beds are what families phone about.'],
    ),
    dict(
        id='finale', day='Sunday', start='08:40', end='09:20', title='Color War Finale',
        where='South Lawn', who='Three teams of ten', lead='Director', score='Double points: 20, 14, 8 for each event',
        map='finale', mapcap='The tug-of-war rope lies east to west on the South Lawn. The rope jump is in the middle and the three relay lanes are to the south.',
        idea='Three events, all thirty campers, and double points for each: enough to change the order of the board. The tug-of-war, the giant rope jump, and one relay that every camper runs.',
        setup=[
            ('08:20', 'Floater 1, Floater 2', 'Leave breakfast. Lay the tug rope east to west. One flat marker under the centre tape and one 2 m either side. Twenty pairs of gloves in two piles. Three relay lanes: start markers and far markers 20 m apart. Both jump ropes by the middle.'),
        ],
        say=[
            'Three events, and every one is worth double. Nothing is decided yet.',
            'Tug-of-war: gloves on. You never wrap the rope round your hand or your waist. When the whistle goes, everyone lowers the rope together. Nobody lets go suddenly.',
            'Rope jump: the count is the number of jumps in a row before anyone misses.',
            'Relay: every one of you runs. The last runner carries your banner over the line.',
        ],
        run=[
            ('08:40', '08:43', 'Gloves on. The Director shows the grip and the stance, and the three markers.'),
            ('08:43', '08:48', 'Tug-of-war, match 1: Yellow against Orange. Best of three pulls, changing ends after each.'),
            ('08:48', '08:49', 'Change teams.'),
            ('08:49', '08:54', 'Match 2: Green against Yellow.'),
            ('08:54', '08:55', 'Change teams.'),
            ('08:55', '09:00', 'Match 3: Orange against Green.'),
            ('09:00', '09:02', 'Gloves off, water. The tug-of-war result.'),
            ('09:02', '09:10', 'Giant rope jump. Two minutes of practice on both ropes. Then two tries a team, in the order Green, Orange, Yellow, with the whole camp counting aloud.'),
            ('09:10', '09:12', 'Teams line up in their relay lanes in running order.'),
            ('09:12', '09:16', 'The final relay.'),
            ('09:16', '09:20', 'The relay result. Teams walk to the horseshoe for the prize-giving.'),
        ],
        blocks=[
            dict(type='cards', title='The three events', cards=[
                ('1', 'Tug-of-War Tournament', 'Ten a side · every team pulls twice',
                 'The centre tape starts over the middle marker. A pull is won when the centre tape passes the marker on your side, or by whoever is ahead after 30 seconds. A match is the best of three pulls. Most matches won is first. If the teams are level on matches, the team that won more pulls is ahead.'),
                ('2', 'Giant Rope Jump Challenge', 'A 7 m rope, turned by two counselors',
                 'Six campers jump inside the rope while the other four count. For the second try the four swap in, so that every camper jumps. A try lasts 45 seconds at most. The team’s score is its longest run of jumps without a miss.'),
                ('3', 'The final relay', 'Three lanes of 20 m · all 30 run',
                 'Each camper runs to the far marker and back, 40 m, carrying the team’s rolled bib, and hands it to the next. The tenth runner picks up the team banner at the start line and carries it out and back over the line.'),
            ]),
        ],
        roles=[('Director', 'Referee and host for all three events.'), ('Floater 1, Floater 2', 'Line judges for the tug-of-war. They turn the rope for the official jumps. They leave at 09:30 to load the bus.'), ('Squad counselors', 'With their teams. They set the pulling order, big at the back, and the running order.'), ('Nurse', 'At HQ Palms with water.')],
        scoring=['Each of the three events gives double team points: 20 for first, 14 for second, 8 for third.', 'Teams level in an event share the points of the places they hold.', 'Floater 2 adds the three results to the covered board before 09:30.'],
        kit=[('Tug-of-war rope, 20 m', '1', 'E3', '12'), ('Cotton gloves', '20 pairs', 'E7b', '12'), ('Group jump ropes, 7 m', '2', 'A12', '12'), ('Flat markers', '9', 'A1', '7'), ('Team bibs, as batons', '3', 'A2', 'bag'),
             ('The three team banners', '3', 'E9a', 'loose'), ('Stopwatch and whistle', '1 + 1', 'A10, A10b', '1'), ('Cloth tape, for the centre mark', '1 roll', 'D2b', '12')],
        rain='The Minute-to-Win-It Finals in the Hall: three team events at double points (rain sheet R3).',
        watch=['Wet grass and tug-of-war do not mix: if the lawn is slippery, the tug moves to the driest strip or is dropped, and the other two events still run.', 'The rope goes down on the whistle, together.'],
    ),
    dict(
        id='prizes', day='Sunday', start='09:20', end='10:00', title='Prize-giving, and the bus home',
        where='South Lawn, then the Bus Point', who='All 30', lead='Director', score='The final Color War result',
        map='prizes', mapcap='Teams sit in a horseshoe on the South Lawn, facing the trophy table and the banner at HQ Palms.',
        idea='Every camper is called up by name. Then the board is uncovered and the Color War champions lift the trophy. The whole camp takes one photo together and walks to the bus.',
        setup=[
            ('Saturday 22:15', 'All counselors', 'Each squad counselor writes one sentence about each of their five campers on the back of the certificate: something that camper did this week.'),
            ('08:25', 'Floater 2', 'Trophy table at HQ Palms: the trophy, 30 medals, 30 named certificates in squad order, the covered scoreboard brought from the Hall, the speaker.'),
            ('09:30', 'Floater 1, Floater 2', 'Meet the bus at the Bus Point and load the bags with the driver.'),
        ],
        say=[
            'Before the scores, something more important. Every one of you did something this week that your counselor wants the camp to hear.',
            'When your squad is called, come up together.',
        ],
        run=[
            ('09:20', '09:22', 'The Director thanks the campers, the counselors, the nurse and Bambi’s team.'),
            ('09:22', '09:31', 'Camp Participation Awards, squad by squad, 90 seconds a squad. The squad counselor reads each camper’s sentence and gives the certificate and the medal.'),
            ('09:31', '09:36', 'The board is uncovered. Third place, second place, and the Color War champions. The champions lift the trophy and lead their chant.'),
            ('09:36', '09:40', 'The whole-camp photo: three team banners, the welcome banner, everyone in the camp T-shirt.'),
            ('09:40', '09:50', 'Toilets at the Restrooms on the way. Walk to the Bus Point.'),
            ('09:50', '10:00', 'Boarding. The Director reads the roster at the door. Phones come back to each camper as they board. The bus leaves at 10:00.'),
        ],
        blocks=[
            dict(type='list', title='Who goes where at 10:00', items=[
                'On the bus: the Director, the nurse and the six squad counselors.', 'In the kit car: the two floaters, with the twelve bins, after a last walk round the lawns and the kit store.',
                'At The Lin Hotel at about 11:30: families collect until 12:00. The nurse hands each camper’s medicine to the family.',
            ]),
        ],
        roles=[('Director', 'Hosts. Reads the roster at the bus door.'), ('Squad counselors', 'Present their own five. Count five at the bus door.'), ('Floater 2', 'Keeps the board covered until 09:31. Then to the bus.'), ('Floater 1', 'Loads the bus from 09:30.'), ('Nurse', 'At the horseshoe, then at the bus door with the medicine box.')],
        scoring=['The final totals are every Color War point of the four days, with the finale’s double points added last.', 'If two teams finish level, they share the trophy and both chant.'],
        kit=[('Trophy', '1', 'F3b', '12'), ('Medals', '30 + 6 spare', 'F3a', '12'), ('Certificates, named', '30 + 5 spare', 'F4a', '12'), ('Welcome banner and group-photo banner', '2', 'F6', '12'), ('Speaker', '1', 'C13', '10'),
             ('The Color War board and its cover', '1', 'D4c', '—'), ('Campers’ phones, in the lock box', '', 'E12', '1'), ('Printed roster', '1', 'print', '1')],
        rain='The prize-giving is in the Hall straight after the indoor finale. The bus comes as close to the Hall as the driver can bring it.',
        watch=['A camper whose name is hard to say: the counselor checks it with them on Saturday.'],
    ),
]

RAIN = [
    dict(
        id='rain1', day='Rain plan', start='09:00', end='10:30', title='R1 · Cipher Camp and the Indoor Escape Room Race',
        where='The Hall, six table islands', who='Six squads of five', lead='Director', score='Squad placings: 6 to 1', replaces='Friday 09:00, the Orienteering Quest',
        hall='islands',
        idea='The wet-weather swap for orienteering. Squads crack three kinds of secret code, invent their own, and then use all three to open a locked pouch before the other squads do.',
        setup=[
            ('Before camp', 'Director', 'Print six sets of the cipher sheets, six alphabet strips and six clue sets, and seal them in the RAIN bag in bin 5. Set all six padlocks to 573. In each pouch put a card that says ESCAPED and five glow bracelets, and lock it.'),
            ('08:40', 'Floater 1, Floater 2', 'Six table islands, well apart. On each: pencils, paper, one alphabet strip.'),
        ],
        say=[
            'A cipher is a rule for hiding a message. If you know the rule, you can read it.',
            'First you crack three messages. Then you write one of your own for another squad.',
            'At 09:45 every squad gets a locked pouch and five clues. The first squad to open its pouch wins.',
        ],
        run=[
            ('09:00', '09:05', 'The Director shows the three ciphers on the whiteboard: the shift cipher with the alphabet strip, the pigpen grid, and mirror writing.'),
            ('09:05', '09:20', 'Crack. Each squad has one sheet with three messages, one in each cipher. 1 point for each one read.'),
            ('09:20', '09:35', 'Invent. The squad writes a six-word message about camp in a cipher of its own choice.'),
            ('09:35', '09:45', 'Swap with the next table and crack theirs. 1 point for cracking it, and 1 for writing a message that could be cracked.'),
            ('09:45', '10:25', 'Escape Room Race. Clues A, B and C are three coded questions. Each answer is one digit. Clue D is a card that looks blank: the invisible-ink pen shows the order of the digits. The three digits open the padlock. The squad brings its ESCAPED card to the Director.'),
            ('10:25', '10:30', 'Results. The glow bracelets are for tonight.'),
        ],
        blocks=[
            dict(type='table', title='The race clues (answer key)', head=['Clue', 'Cipher', 'It says', 'Answer'], rows=[
                ['A', 'Pigpen', 'HOW MANY CAMPERS IN A SQUAD', '5'], ['B', 'Mirror writing', 'HOW MANY TEAMS AT CAMP WOW', '3'],
                ['C', 'Shift of three', 'HOW MANY LETTERS IN WOW PLUS FOUR', '7'], ['D', 'Invisible ink', 'A THEN C THEN B', '573'],
            ]),
            dict(type='note', title='Hints', text='A squad that is stuck for five minutes may ask its counselor for one hint a clue. A hint costs nothing: the point is that everyone gets the pouch open.'),
        ],
        roles=[('Director', 'Shows the ciphers, starts the race, records the finishing order.'), ('Squad counselors', 'At their squad’s table. They give hints and keep all five involved.'), ('Floater 1, Floater 2', 'Set the Hall for the next activity from 10:15.'), ('Nurse', 'In the Hall.')],
        scoring=['Squads are ranked by the order in which they open the pouch. Cipher Camp points break a tie.', 'Squad placings: 6, 5, 4, 3, 2, 1.'],
        kit=[('Cipher sheets, alphabet strips, clue sets', '6 sets', 'print', '5'), ('Combination padlocks, set to 573', '6', 'E13a', '5'), ('Zipped pouches', '6', 'E13b', '5'), ('Invisible-ink pens', '6', 'D7b', '10'),
             ('Glow bracelets', '30', 'D7a', '10'), ('Pencils and A4 paper', '12 + 30 sheets', 'D5c, D4a', '5'), ('A4 whiteboards and markers', '6', 'D11a, D11b', '7')],
        rain='', watch=['Six tables close together means squads overhear answers: use the whole Hall.'],
    ),
    dict(
        id='rain2', day='Rain plan', start='10:45', end='12:25', title='R2 · The Amazing Race in the wet',
        where='Light rain: the paths, under umbrellas. Heavy rain: the Hall', who='Six squads of five', lead='Director', score='Squad placings: 6 to 1', replaces='Friday 10:45, the Bambi Amazing Race',
        hall='loop',
        idea='Two versions. In light rain with no thunder, squads go out for forty minutes under their own umbrellas and then finish indoors. In heavy rain all seven checkpoints run in the Hall on the normal clock.',
        setup=[
            ('10:30', 'Director', 'The weather call, with the nurse: light rain, or heavy.'),
            ('10:30', 'Floater 1, Floater 2', 'Heavy rain: seven checkpoints round the walls of the Hall, in number order. Light rain: checkpoints 1, 2, 5 and 6 only, at four tables.'),
        ],
        say=[
            'Light rain: umbrellas up and ponchos on. We walk, and your squad shares its umbrellas.',
            'Heavy rain: the race is in here. Same seven tasks, same ten minutes.',
        ],
        run=[
            ('10:45', '10:50', 'Briefing in the Hall.'),
            ('10:50', '11:30', 'Light rain: the Umbrella Treasure Hunt, forty minutes. Heavy rain: rounds 1 to 3 of the Hall race, starting at 10:50, 11:02 and 11:14.'),
            ('11:30', '11:40', 'Light rain: back in the Hall, ponchos off, a warm drink. Heavy rain: round 4, starting at 11:26.'),
            ('11:40', '12:15', 'Light rain: four indoor checkpoints of eight minutes each, with a minute to move, for knots, memory, the team photo and the puzzle. Heavy rain: rounds 5 to 7, starting at 11:38, 11:50 and 12:02.'),
            ('12:15', '12:25', 'Passports in. The tables are set for lunch at 12:30.'),
        ],
        blocks=[
            dict(type='list', title='The Umbrella Treasure Hunt', items=[
                'If the morning’s orienteering was rained off, its ten markers are still hanging. Squads walk to the six nearest ones (controls 1, 2, 3, 5, 6 and 7) and collect the letters. 1 point a letter.',
                'If the orienteering was played, squads walk to the same six places and take a squad photo under umbrellas at each. 1 point a photo.',
                'Walking only, on the paths. Every squad is back in the Hall by 11:30.',
            ]),
            dict(type='list', title='The Hall race', items=[
                'The checkpoints stand in number order round the walls. The rotation table and the scoring are the same as on the race sheet.',
                'Pipeline runs along the longest wall. The Blindfold Trail is a lane between two rows of chairs. Toxic Waste needs a clear circle 4 m across.',
            ]),
        ],
        roles=[('Director', 'Weather call, clock and whistle.'), ('Squad counselors', 'With their squad, outdoors and in.'), ('Floater 1, Floater 2', 'Set the Hall. In light rain they walk the paths with the squads.'), ('Nurse', 'In the Hall with the warm drinks.')],
        scoring=['Light rain: hunt points plus checkpoint points are added and ranked.', 'Heavy rain: as on the race sheet.', 'Squad placings: 6, 5, 4, 3, 2, 1.'],
        kit=[('The seven checkpoint bags', '7', 'bin 5', '5'), ('Ponchos', '40', 'B11', 'bag'), ('Campers’ own folding umbrellas', '30', 'own', '—'), ('Hot chocolate and cups', 'for 40', 'C7a, C7b', '2')],
        rain='', watch=['Thunder ends anything outdoors at once: everyone walks to the Hall and stays there until the Director says so.'],
    ),
    dict(
        id='rain3', day='Rain plan', start='14:15', end='15:00', title='R3 · Indoor Games Arcade and the Minute-to-Win-It Tournament',
        where='The Hall, six stations in a loop', who='Six squads of five', lead='Director', score='Squad placings: 6 to 1', replaces='The lake station on Thursday, multi-sports on Friday and Saturday, the Camp Olympics, and the Sunday finale',
        hall='loop',
        idea='Two indoor programmes that use the same six tables. The Arcade is the Saturday Games Arcade moved inside. Minute-to-Win-It is six one-minute challenges in which every camper has a go at every table.',
        setup=[
            ('30 minutes before', 'Floater 1, Floater 2', 'Six stations in a loop round the Hall, numbered 1 to 6. The Mölkky goes on a picnic blanket. The table-tennis net goes on a dining table.'),
        ],
        say=[
            'Six stations. At each one, everyone in your squad has a go.',
            'In Minute-to-Win-It each of you gets one minute. Your squad’s score is how many of you beat the challenge.',
        ],
        run=[
            ('14:15', '14:17', 'Briefing. Squads go to their first station.'),
            ('14:17', '14:59', 'Six rounds of seven minutes: six at the station and one to move. Rounds start at 14:17, 14:24, 14:31, 14:38, 14:45 and 14:52.'),
            ('14:59', '15:00', 'Squad cards to Floater 2.'),
        ],
        blocks=[
            dict(type='table', title='When each programme is used', head=['Rained-off activity', 'Runs instead', 'Clock'], rows=[
                ['Thursday 13:30, the kayak station', 'Indoor Arcade', 'Each team plays three stations in its 45-minute turn.'],
                ['Friday 14:15, multi-sports round 1', 'Indoor Arcade', 'As above, 14:15 to 15:00.'],
                ['Saturday 09:00, multi-sports round 2', 'Minute-to-Win-It Tournament', '09:05 to 09:50, the same seven-minute rounds.'],
                ['Saturday 10:15, Camp Olympics', 'Indoor Arcade', '10:17 to 10:59.'],
                ['Sunday 08:40, the finale', 'Minute-to-Win-It Finals', 'Three team events, double points, 08:40 to 09:20.'],
            ]),
            dict(type='cards', title='Minute-to-Win-It: the six challenges', cards=[
                ('1', 'Cup pyramid', 'Beat it: built and cleared', 'Stack ten cups 4-3-2-1 and slide them back into one stack, inside a minute.'),
                ('2', 'Ball bounce', 'Beat it: 3 in the cup', 'From 1 m, bounce a table-tennis ball once on the table and into a cup.'),
                ('3', 'Balloon keep-up', 'Beat it: the full minute', 'Keep two balloons in the air for a minute, using one hand.'),
                ('4', 'Straw lift', 'Beat it: 8 squares', 'Suck through a straw to lift paper squares, one at a time, from the table into a cup. Each camper has a fresh straw.'),
                ('5', 'Cup flip', 'Beat it: 5 flips', 'Flick a cup from the table edge so that it lands upside down.'),
                ('6', 'Spoon run', 'Beat it: 6 marbles', 'Carry marbles one at a time on a soup spoon to a cup 4 m away.'),
            ]),
            dict(type='list', title='Minute-to-Win-It Finals, for a wet Sunday', items=[
                'Cup pyramid relay: all ten campers, one after another. The fastest team wins.',
                'Balloon keep-up: all ten keep ten balloons up. The team with the most still in the air after a minute wins.',
                'Ball bounce: all ten have three tries each. The most balls in the cup wins.',
                'Each event gives 20, 14 and 8 points, like the outdoor finale.',
            ]),
        ],
        roles=[('Director', 'Clock and whistle.'), ('Squad counselors', 'With their squad: they time each camper’s minute and count.'), ('Floater 1, Floater 2', 'Reset stations and collect cards.'), ('Nurse', 'In the Hall.')],
        scoring=['Arcade: as on the Games Arcade sheet.', 'Minute-to-Win-It: a squad’s score at a station is the number of campers who beat the challenge, 5 at most. Six stations make 30. The totals are ranked. Squad placings: 6, 5, 4, 3, 2, 1.'],
        kit=[('The Arcade kit', 'bin 8', 'A14–A18', '8'), ('Plastic cups', '60', 'C8', '8'), ('Table-tennis balls', '12', 'A17c', '8'), ('Balloons and pumps', '40 + 6', 'D9a, D9b', '11'), ('Drinking straws', '40', 'D9c', '11'),
             ('Marbles and soup spoons', '12 + 2', 'E6b, D12e', '11'), ('A4 paper, cut into squares', '4 sheets', 'D4a', '5'), ('Picnic blanket, under the Mölkky', '1', 'B8', 'bag')],
        rain='', watch=['Balloons and a latex allergy: check with the nurse, and swap station 3 for a second cup-flip table if needed.'],
    ),
    dict(
        id='rain4', day='Rain plan', start='19:00', end='21:30', title='R4 · Wet evenings in the Hall',
        where='The Hall', who='All 30', lead='Director', score='As on the outdoor sheets', replaces='The two campfires, the Glow Night Quest, the film and the treasure hunt',
        hall='stage',
        idea='Every evening has an indoor version, and none of them needs new kit. The tables are pushed to the walls after dinner while the campers stand and stretch.',
        setup=[
            ('18:45', 'All counselors', 'After dinner, tables to the walls and chairs in three team blocks facing the stage end. It takes ten minutes with everyone helping.'),
        ],
        say=['Tonight is indoors. Same programme, drier feet.'],
        run=[
            ('19:00', '20:30', 'Thursday: the Color War Opening Ceremony. Banners, chants and the judging run exactly as at the fire. The s’mores wait for Saturday.'),
            ('20:30', '21:30', 'Thursday: torch walk to the vans in ponchos, showers, van check at 21:45.'),
        ],
        blocks=[
            dict(type='table', title='The other evenings', head=['Evening', 'In the Hall'], rows=[
                ['Friday 19:00, Glow Night Quest', 'Lights down. Six stations at six tables, with the ring toss and the bowling along a wall. The second set of word slips is used: LOOK INSIDE THE BIG BLUE BIN.'],
                ['Friday 20:10, Star Cinema', 'Chairs or blankets facing the screen end. Bambi sets up the projector. Throws and the snack as planned.'],
                ['Saturday 19:30, the Skit & Talent Showdown', 'The stage end of the Hall. The same judging. No fire and no marshmallows.'],
                ['Saturday 20:30, the treasure hunt', 'Lights down. The floaters scatter the pieces at one end during the closing circle. One search of 20 minutes.'],
            ]),
        ],
        roles=[('Director', 'Hosts each evening.'), ('Floater 1, Floater 2', 'Lights, sound and kit.'), ('Squad counselors', 'With their squads.'), ('Nurse', 'In the Hall.')],
        scoring=['Unchanged from the outdoor sheets.'],
        kit=[('Speaker', '1', 'C13', '10'), ('Ponchos, for the walk back', '40', 'B11', 'bag'), ('Lanterns', '4', 'E8b', '3')],
        rain='', watch=['The walk back to the vans in the rain is 200 m: squads leave two minutes apart so that nobody waits in the wet.'],
    ),
]
