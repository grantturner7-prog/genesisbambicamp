# Tracing the official camp map

`src/map/layout/campLayout.json` is traced from Bambi Glamping's official camp map
(`斑比跳跳營地圖202507.jpg`, published on iglamping.tw). The map artwork itself is
© 台灣愛露營科技有限公司 and is **not stored in this repo**; only the traced geometry is.

Pipeline (Python 3 with numpy, opencv-python-headless, scipy, Pillow), run in this order
with the map saved as `bambi-site/photos/35_…202507.jpg`:

1. `count_vans2.py` — find the unit icons (seed set)
2. `match_vans.py` — template-match all unit icons → 50 units
3. `extract_layout.py` — island outline, lakes, pool, first road mask
4. `roads2.py` — final road mask
5. `build_layout.py` — zones, facing direction, trees, points of interest → `layout.json`

Result: 50 units — A 14, B 12, D 12, E 6, F 4, G 2 (the website's zone text lists A as 13).
Map pixel → world: `x = (px-600)/10`, `z = (py-400)/10` (1 unit ≈ 4 m, north = −Z).
