# Genesis Youth Adventures × Bambi Glamping

Bilingual (繁體中文 / English) website for an American-style winter and summer camp
at Bambi Glamping, Sanwan, Miaoli. There is one kind of camp: 4 days and 3 nights,
Thursday to Sunday, for ages 10–14. The camp is named **Camp WOW · World of Outdoor Wonders**.

| Page | Path | What it is |
| --- | --- | --- |
| Landing page | `/` | Hero, activities by season, stay & meals, safety & insurance, dates & fees, refund calculator, packing list, forms & documents, FAQ, registration |
| Explore the Facilities | `/facilities/` | 3D camp map laid out one-to-one from Bambi's official camp map, with click-through panels (photos, features, menus, safety rules) |

## Run it

```bash
npm install
npm run dev          # http://localhost:5173 and /facilities/
npm run build        # compliance audit + type-check + production build → dist/
npm run launch-check # what partners still owe before going public
npm run legal-pdf    # every legal notice as bilingual PDFs for a lawyer → docs/legal-review/
npm run forms-pdf    # camp notice and agreement, health form, check-in form (drafts) → docs/forms/
npm run all-pdf      # both of the above, joined into docs/genesis-bambi-camp-documents.pdf
npm run e2e          # browser tests against a running dev server (port 5199)
```

`dist/` is plain static files with relative paths, so it can be hosted anywhere,
including under a sub-path.

## Where things live

- `src/config/campConfig.ts`: the single source for dates, fees, licence numbers,
  LINE, caps. `null` means a partner still owes the value; the site shows "pending"
  and never invents one.
- `src/map/layout/campLayout.json`: the traced camp layout (island, lakes, pool,
  roads, trees, parking and all 50 camper units: A 14, B 12, D 12, E 6, F 4, G 2).
  `scripts/layout-trace/` documents how it was traced.
- `src/map/areas.ts`, `src/home/content.ts`, `src/i18n/strings.ts`: all copy, in both
  languages.
- `src/media/`: photo manifest and the source URL of every photo.
- `scripts/audit-copy.mjs`: fails the build on cram-school wording, banned
  disclaimers, the wrong township, "wooden cabins", alcohol on a menu, unlicensed
  movie-night copy, a missing statutory disclosure, or copy that contradicts the camp
  facts below.

## Camp facts the copy must match

- Three meals a day: breakfast, a DIY lunch with the chef, dinner. None is a buffet, and the audit rejects the word. The
  final evening is the signature family dinner with Wagyu beef. No afternoon tea.
- The winter camp menu comes from the venue kitchen (`WINTER_MENU` in
  `src/home/content.ts`, and the dining hall menu in `src/map/areas.ts`). Breakfast: eggs,
  bacon, bread, sandwiches, milk, soy milk. Lunch: curry, pizza, rice balls, donburi rice
  boxes. Dinner: meatball pasta with corn soup and bread; fried chicken and braised pork
  with vegetables and rice. The kitchen has not said which day each dish is served or
  given allergen details, so the site names no day and the dishes carry no allergen tags.
- Snacks are not part of the fee. Parents choose a coupon pack (`snackShop.couponPacks`:
  NT$1,000 / 2,000 / 3,000); campers get the coupons at check-in and exchange them at
  the Airstream snack shop beside the pool.
- There is one kind of camp: 4 Days / 3 Nights, Thursday to Sunday (`days` in `campConfig.ts`). The site never
  names options: there is nothing to choose between.
- Campers meet at The Lin Hotel, Taichung, at 08:00 on Thursday; the charter bus leaves
  at 08:30. On Sunday it leaves camp at 10:00 and is back there at about 11:30
  (`transport` in `campConfig.ts`). The bus
  both ways is included in the fee (confirmed by the organizer). Nobody is dropped off at the camp gate.
- The first camp is the winter one: Thursday 28 to Sunday 31 January 2027, a pilot
  camp limited to 30 campers, at NT$35,000 per camper (`sessions.winter`). These are the
  only dates on the site. The summer camp has none yet (`sessions.summer` is `null`): it
  is a placeholder that says "Coming soon", prints no date or fee, and cannot be chosen
  in the registration form. Fill in `sessions.summer` to open it.
- The winter camp's day-by-day plan is `SCHEDULE` in `src/home/content.ts`: four days, with
  the anchor times and the named activities, and no dish names. A season with no dates
  shows a short note in its place.
- English is described only as the language of daily camp life (全美語生活環境). The wording
  rules that keep the camp an outdoor recreation camp, and out of cram-school territory,
  are in `scripts/copy-rules.mjs`; the website audit and the adverts both use them.
- Bambi Glamping's own overnight guests are on site on the weekend nights, and the site
  says so (Safety, FAQ and the gate panel).

## The 3D map

`src/map/scene/` holds one file per layer (`Atmosphere`, `Ground`, `Trees`, `Cabins`,
`Facilities`, `Life`); each takes the same `env` (season, time of day, quality tier).

- **Day and night.** Between 18:00 and 06:00 on the visitor's own clock the site opens in
  night mode: evening photos on the landing page and the night map. The Day / Night
  switch overrides it for the rest of the visit.
- **Evening return.** When night mode starts, and for a visitor who arrives after dark,
  the egrets fly in from across the camp and settle on the grove at the north end of the
  west lake. In the morning they leave again. Kayaks are on the water by day only.
- **The grove.** `EXTRA_TREES` in `src/map/layout/layout.ts` are 20 trees that are not on
  the official map: the egret roost at the north end of the west lake, added at the
  client's request after the venue's photos. Every other tree is traced from the map.
- **Tram.** It makes one loop of the whole camp without stopping (south road, west ring,
  waterbird lake, past the Star Cinema, north road, kayak lake; about five minutes a lap).
  Headlights and lanterns are lit at night only.
- **Road links.** `ROAD_LINKS` in `src/map/layout/layout.ts` puts back four short pieces
  of road that labels and tree crowns hide on the official map: three round the kayak lake,
  and the one under the Star Cinema label that joins the north road to the road east of
  the waterbird lake. The traced polygons themselves are unchanged.
- **Quality tiers.** Phones and weak GPUs get the `low` tier (no post effects, lighter
  models); a slow device steps down by itself. Reduced-motion settings give a still
  picture: tram at its stop, birds in place.
- **Address options for testing:** `?time=day|night`, `?quality=high|low`, and
  `?life=<seconds>` to start the scene that far into its motion.
- `node scripts/scene-shots.mjs <baseUrl> <outDir> [views] [quality] [extraQuery]` renders
  clean pictures of the map for visual review.

## Before going public

`docs/legal-review/` holds every legal notice the site publishes (fees and refunds, the
registration consents and data notice, safety and insurance statements, facility rules,
footer disclosures, FAQ commitments) as PDFs, English beside 繁體中文, each line numbered.
They are generated from the site's own copy: run `npm run legal-pdf` again after any
change to the wording, so the lawyer always reviews what is actually published.

`docs/forms/` holds the three paper forms as drafts: the Camp Notice and Agreement, the
Camper Health Form and the Check-in Day Form, with a note for the reviewer. They cover the
same ground as the documents Camp Taiwan publishes for its camps, in our own words and
without a release of liability. Text the website already states is pulled from the site's
copy; wording that is new is marked ◆ and is not camp policy until the camp, the nurse and
the lawyer have agreed it. `npm run all-pdf` joins the forms and the legal notices into one
file with a contents page (it needs poppler's `pdfunite`).

The landing page's **Forms & documents** section lists the paperwork in the order a family
needs it. While `documents.final` is `false` in `campConfig.ts` the three forms are listed
but not posted: the drafts in `docs/forms/` carry notes to the camp, the nurse and the
lawyer, and are not for families. Before setting it to `true`:

1. fill in the camp's open decisions and contact details in `scripts/forms-pdf.mjs`,
2. get the nurse's confirmations and the lawyer's approval,
3. remove every ◆ mark and bracketed note from `scripts/forms-pdf.mjs` (the script refuses
   to build final forms that still have one),
4. run `npm run all-pdf`, which then also writes the three forms to `public/documents/`
   for the section to open.

The forms quote the fee, dates and bus times from `campConfig.ts`, so run
`npm run forms-pdf` again after any change there and before deploying.

Every tab in the header names a section of the landing page and lands on it, from either
page (`src/lib/nav.ts`), moves the keyboard position there, and is a step the Back button
returns from; `npm run e2e` clicks each one and checks where it lands.

Run `npm run launch-check`. In particular:

- Photos in `public/media/bambi` come from Bambi Glamping's website
  (© 台灣愛露營科技有限公司). Get Bambi's written permission, then set
  `venuePhotoPermissionOnFile: true`.
- The registration form sends nothing until `registration.endpoint` is set.
- The snack-shop menu and the pool, kayak and campfire rules are drafts for the camp
  kitchen, lifeguard and insurer to confirm.
- The handover documents (Docs 2–4, including the contract) still describe four meals
  a day, Options A and B and Monday/Tuesday starts. Update them to match the camp facts
  above (one 4 Days / 3 Nights camp, Thursday to Sunday, three meals a day) before the
  contract PDF is linked.
