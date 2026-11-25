"""Makes the smaller copies of every venue photo that the site serves to phones and narrow panels.

    python3 scripts/photo-sizes.py

For public/media/bambi/<id>.webp this writes <id>-480.webp and <id>-800.webp (only when the
original is clearly wider), keeping the aspect ratio. The site picks one with `srcset`
(`photoSrcSet` in src/media/media.ts). Run it again after adding or replacing a photo.
Needs Pillow with WebP support.
"""
import os, sys
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'media', 'bambi')
SIZES = (480, 800)
made = skipped = 0
for name in sorted(os.listdir(ROOT)):
    base, ext = os.path.splitext(name)
    if ext != '.webp' or base.rsplit('-', 1)[-1] in {str(s) for s in SIZES}:
        continue
    im = Image.open(os.path.join(ROOT, name))
    w, h = im.size
    for s in SIZES:
        out = os.path.join(ROOT, f'{base}-{s}.webp')
        if w <= s * 1.15:  # not worth a copy: the original is barely larger
            if os.path.exists(out): os.remove(out)
            skipped += 1
            continue
        im.convert('RGB').resize((s, round(h * s / w)), Image.LANCZOS).save(out, 'WEBP', quality=80, method=6)
        made += 1
print(f'wrote {made} smaller photos, skipped {skipped}', file=sys.stderr)
