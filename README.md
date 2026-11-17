# Genesis Youth Adventures × Bambi Glamping

Bilingual (繁體中文 / English) website for an American-style winter and summer camp
for ages 10–14 at Bambi Glamping, Sanwan, Miaoli.

| Page | Path | What it is |
| --- | --- | --- |
| Landing page | `/` | Hero, activities by season, stay & meals, daily schedule, safety & insurance, dates & fees, refund calculator, packing list, FAQ, registration |
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
  movie-night copy, or a missing statutory disclosure.

## Before going public

Run `npm run launch-check`. In particular:

- Photos in `public/media/bambi` come from Bambi Glamping's website
  (© 台灣愛露營科技有限公司). Get Bambi's written permission, then set
  `venuePhotoPermissionOnFile: true`.
- The registration form sends nothing until `registration.endpoint` is set.
- The snack-shop menu and the pool, kayak and campfire rules are drafts for the camp
  kitchen, lifeguard and insurer to confirm.
