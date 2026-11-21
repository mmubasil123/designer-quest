"""Crop a tileable fabric swatch for every piece, for the Remix tab: mockups/assets/swatch/<id>.jpg (512 px).

Usage: .venv/bin/python -I mockups/tools/make_swatches.py
Uses the garment cutout (assets/src/<id>_garment.png) when there is one, so the crop never lands on a mannequin;
otherwise a hand-picked point on the photo. Rerunning overwrites.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
import json  # noqa: E402

from batch_glb import MOCKUPS, pieces  # noqa: E402

# pieces with no usable cutout (segformer misses shoes and the kimono): centre of a plain fabric area, as fractions
POINT = {"ST80881": (0.2, 0.4), "ST2407/1-2": (0.62, 0.62), "ST2435": (0.5, 0.75), "ST652/1": (0.4, 0.63)}


# side to crop from, as a fraction of garment width left of centre; the double-breasted coat buttons on the left
SHIFT = {"ST2434": -0.25}


def square_in_mask(alpha, shift=0.22):
    """Largest square that is at least 97% garment, on a side panel: centre front carries buttons and openings."""
    ys, xs = np.nonzero(alpha > 128)
    cy, cx = int(ys.mean()), int(xs.mean() - shift * np.ptp(xs))
    side = int(0.45 * min(np.ptp(xs), np.ptp(ys)))
    while side > 32:
        y0, x0 = cy - side // 2, cx - side // 2
        win = alpha[max(y0, 0):y0 + side, max(x0, 0):x0 + side]
        if win.size == side * side and (win > 128).mean() >= 0.97:
            return x0, y0, side
        side = int(side * 0.85)
    raise ValueError("no clean square of fabric in the mask")


def main():
    out_dir = MOCKUPS / "assets" / "swatch"
    out_dir.mkdir(exist_ok=True)
    # splat pieces stay locked until found on up-close.html, but their fabric still needs a swatch
    splats = [p for p in json.loads((MOCKUPS / "pieces.json").read_text())["pieces"] if p["assets"].get("splat")]
    for p in pieces() + splats:
        pid = p["id"]
        name = pid.replace("/", "_")
        cut = MOCKUPS / "assets" / "src" / f"{name}_garment.png"
        if pid not in POINT and cut.exists():
            im = Image.open(cut)
            x0, y0, side = square_in_mask(np.asarray(im)[:, :, 3], SHIFT.get(pid, 0.22))
        else:
            im = Image.open(MOCKUPS / "assets" / "src" / f"{name}.jpg")
            fx, fy = POINT[pid]
            side = int(0.12 * min(im.size))
            x0, y0 = int(im.width * fx - side / 2), int(im.height * fy - side / 2)
        tile = im.convert("RGB").crop((x0, y0, x0 + side, y0 + side)).resize((512, 512), Image.LANCZOS)
        tile.save(out_dir / f"{name}.jpg", quality=88)
        print(f"{pid}: {side}px crop -> swatch/{name}.jpg")


if __name__ == "__main__":
    main()
