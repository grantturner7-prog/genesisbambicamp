# The counselor pack

The Camp WOW activity plan and counselor pack is built from the files here.

- `content/`: the words. One file a day (`thu.py`, `fri.py`, `sat.py`, `sun.py` with the rain sheets) and `front.py` for teams, scoring, camp basics, the day timetables and the lists at the back.
- `sheet_maps.py`: one map for each sheet. Positions are in the traced camp map's own pixels (0.4 m each), the same numbers the 3D model is built from.
- `maps.py`: draws those positions on the 3D picture of the camp (`docs/planning/camp-wow-map.jpg`, captured by `map-shot-hi.mjs`) and places every label so that none covers another.
- `shop.json`: the shopping list from the working plan. Every kit code on a sheet must exist in it.
- `build.py`: checks and builds. It fails loudly if a sheet's steps do not fill its time slot, a kit code is unknown, a map label overlaps, or a wording rule is broken.

To rebuild after a change:

    python3 scripts/counselor-pack/build.py
    node scripts/counselor-pack/pdf.mjs
    python3 scripts/counselor-pack/pages.py     # page numbers for the contents
    python3 scripts/counselor-pack/build.py && node scripts/counselor-pack/pdf.mjs
