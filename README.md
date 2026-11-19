# Genesis Youth Adventures × Bambi Glamping

Bilingual (繁體中文 / English) website for an American-style winter and summer camp
at Bambi Glamping, Sanwan, Miaoli. There is one kind of camp: 4 days and 3 nights,
Wednesday to Saturday, for ages 10–14.

| Page | Path | What it is |
| --- | --- | --- |
| Landing page | `/` | Hero, activities by season, stay & meals, safety & insurance, dates & fees, refund calculator, packing list, FAQ, registration |
| Explore the Facilities | `/facilities/` | 3D camp map laid out one-to-one from Bambi's official camp map, with click-through panels (photos, features, menus, safety rules) |

## Run it

```bash
npm install
npm run dev          # http://localhost:5173 and /facilities/
npm run build        # compliance audit + type-check + production build → dist/
npm run launch-check # what partners still owe before going public
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

- Three meals a day: buffet breakfast, a DIY lunch with the chef, evening buffet. The
  final evening is the signature family dinner with Wagyu beef. No afternoon tea.
- Snacks are not part of the fee. Parents choose a coupon pack (`snackShop.couponPacks`:
  NT$1,000 / 2,000 / 3,000); campers get the coupons at check-in and exchange them at
  the Airstream snack shop beside the pool.
- There is one kind of camp: 4 Days / 3 Nights, Wednesday to Saturday (parents drop off
  at Sanwan on Wednesday 14:00–14:30; the Saturday return charter bus is included). The
  site never names options: there is nothing to choose between.
- The first camp is the winter one: Wednesday 27 to Saturday 30 January 2027, a pilot
  camp limited to 30 campers, at NT$35,000 per camper (`sessions.winter`). The summer
  camp's dates and fee are still owed (`sessions.summer` is `null`).
- No daily timetable is published yet. Add it (and the list of activities) to
  `src/home/content.ts` when the partners supply it.

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

Run `npm run launch-check`. In particular:

- Photos in `public/media/bambi` come from Bambi Glamping's website
  (© 台灣愛露營科技有限公司). Get Bambi's written permission, then set
  `venuePhotoPermissionOnFile: true`.
- The registration form sends nothing until `registration.endpoint` is set.
- The snack-shop menu and the pool, kayak and campfire rules are drafts for the camp
  kitchen, lifeguard and insurer to confirm.
- The handover documents (Docs 2–4, including the contract) still describe four meals
  a day, Options A and B and Monday/Tuesday starts. Update them to match the camp facts
  above (one 4 Days / 3 Nights camp, Wednesday to Saturday, three meals a day) before the
  contract PDF is linked.
