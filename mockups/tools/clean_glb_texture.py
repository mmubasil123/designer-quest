"""Paint out mannequin and background bleed in a TRELLIS GLB's baked texture, per piece, by rule.

TRELLIS guesses a garment's back from one front photo and bakes leftovers of the form, its wooden hands or the backdrop
into the texture. Each rule marks texels and refills them from the surrounding cloth:
  white      near-white, low-saturation texels; only for garments with no white of their own (check the cutout)
  blobs      the same, but only connected patches of at least MIN_BLOB texels, so pale dots in a print survive
  tan        warm wood-coloured texels (hue 15 to 45 degrees), the mannequin's hands
FIXES records what each committed GLB received, so a rerun of TRELLIS knows what to apply again.
Run from the repo root: .venv/bin/python -I mockups/tools/clean_glb_texture.py mockups/assets/ST80931.glb out.glb
"""
import io
import os
import sys
from collections import deque

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from glb_io import image, read_glb, write_glb  # noqa: E402

FIXES = {   # GLB file -> rules applied, in order
    "ST2434.glb": ["white"],
    "ST80931.glb": ["tan", "blobs"],
    "ST80930.glb": ["blobs"],
}
LUM, SAT = 0.40, 0.20   # above this luminance and below this saturation a texel counts as white bleed
MIN_BLOB = 400          # texels: smaller pale patches are taken to be the print, not the form
HALO = 2                # texels: the anti-aliased rim around each patch goes too


def hsv(rgb):
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = np.maximum(mx - mn, 1e-6)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    return h, np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0), mx


def white(rgb):
    _, s, _ = hsv(rgb)
    return (rgb @ [0.2126, 0.7152, 0.0722] > LUM) & (s < SAT)


def tan(rgb):
    h, s, v = hsv(rgb)
    return (h > 15) & (h < 45) & (s > 0.25) & (v > 0.25)


def big_only(mask, min_size=MIN_BLOB):
    """Keep the 4-connected patches of at least min_size texels."""
    keep, seen = np.zeros_like(mask), np.zeros_like(mask)
    H, W = mask.shape
    for y0, x0 in zip(*np.nonzero(mask)):
        if seen[y0, x0]:
            continue
        q, comp = deque([(y0, x0)]), []
        seen[y0, x0] = True
        while q:
            y, x = q.popleft(); comp.append((y, x))
            for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= ny < H and 0 <= nx < W and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True; q.append((ny, nx))
        if len(comp) >= min_size:
            ys, xs = zip(*comp); keep[list(ys), list(xs)] = True
    return keep


def box(a, r):
    """Sum over a (2r+1)-square window, edges clamped, via cumulative sums."""
    pad = np.pad(a, [(r + 1, r)] * 2 + [(0, 0)] * (a.ndim - 2), mode="edge").cumsum(0).cumsum(1)
    return pad[2 * r + 1:, 2 * r + 1:] - pad[:-2 * r - 1, 2 * r + 1:] - pad[2 * r + 1:, :-2 * r - 1] + pad[:-2 * r - 1, :-2 * r - 1]


def fill(rgb, mask):
    """Each masked texel takes the mean colour of the known texels around it, widening the window until some are found."""
    rgb, known = rgb.copy(), ~mask
    for r in (3, 6, 12, 24, 48, 96, 192):
        cnt = box(known.astype(float), r)
        acc = box(rgb * known[..., None], r)
        take = ~known & (cnt > 0)
        rgb[take] = acc[take] / cnt[take][:, None]
        known = known | take
        if known.all():
            break
    return rgb


RULES = {"white": white, "blobs": lambda rgb: big_only(white(rgb)), "tan": tan}


def clean(src, dst, rules):
    j, binb = read_glb(src)
    img, view = image(j, binb)
    rgb = np.asarray(img) / 255.0
    for rule in rules:
        mask = box(RULES[rule](rgb).astype(float), HALO) > 0
        rgb = fill(rgb, mask)
        print(f"{rule}: {mask.mean():.1%} of texels refilled")
    fmt = "WEBP" if j["images"][0].get("mimeType") == "image/webp" else "PNG"
    buf = io.BytesIO(); Image.fromarray((rgb * 255).round().astype(np.uint8)).save(buf, fmt, **({"quality": 85} if fmt == "WEBP" else {"optimize": True}))
    write_glb(dst, j, binb, view, buf.getvalue())


if __name__ == "__main__":
    px = np.array([[[1.0, 1.0, 1.0], [0.2, 0.4, 0.1], [0.6, 0.45, 0.3]]])
    assert white(px).tolist() == [[True, False, False]] and tan(px).tolist() == [[False, False, True]]   # white, cloth green, wood
    src, dst = sys.argv[1:3]
    clean(src, dst, sys.argv[3:] or FIXES[os.path.basename(src)])
