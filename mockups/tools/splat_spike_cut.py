"""Spike: cut MoMu splat captures into wearable parts (avatar, tops, hands, bottoms) by height, depth and colour.

Throwaway rules for ST2431/1-4 and ST2432/1-2 only; writes raw .ply parts that splat-transform turns into .sog.
Run: .venv/bin/python -I mockups/tools/splat_spike_cut.py <out_dir>
Then, with T=tools/node/node_modules/.bin/splat-transform, each part to mockups/assets/splat/spike/<name>.sog:
  garments (*_top, *_bottom): $T <out>/<name>.ply -d 30% <tmp>/<name>.ply, then $T <tmp>/<name>.ply -H 1 <name>.sog
  avatar and hands:           $T <out>/<name>.ply -H 1 <name>.sog
"""
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]


def load(path):
    with open(path, "rb") as f:
        header, props, n = [], [], 0
        while True:
            line = f.readline()
            header.append(line)
            s = line.decode().strip()
            if s.startswith("element vertex"):
                n = int(s.split()[2])
            elif s.startswith("property"):
                assert s.split()[1] == "float", s   # the MoMu captures are all-float; anything else needs a dtype map
                props.append(s.split()[2])
            elif s == "end_header":
                break
        rows = np.fromfile(f, dtype=np.float32, count=n * len(props)).reshape(n, len(props))
    return header, props, rows


def save(path, header, rows):
    with open(path, "wb") as f:
        for line in header:
            s = line.decode()
            f.write(f"element vertex {len(rows)}\n".encode() if s.startswith("element vertex") else line)
        rows.astype(np.float32).tofile(f)


def fields(props, rows):
    c = {k: rows[:, i] for i, k in enumerate(props)}
    rgb = np.clip(0.5 + 0.2821 * np.stack([c["f_dc_0"], c["f_dc_1"], c["f_dc_2"]], 1), 0, 1)
    lum = rgb @ [0.299, 0.587, 0.114]
    sat = rgb.max(1) - rgb.min(1)
    # y is up and z is front (+) once negated back from the y-down capture; x is unchanged
    reach = 2 * np.exp(np.stack([c["scale_0"], c["scale_1"], c["scale_2"]], 1)).max(1)   # 2 sigma, upper bound on any axis
    return c["x"], -c["y"], c["z"], rgb, lum, sat, reach


def cut(out):
    out.mkdir(parents=True, exist_ok=True)
    parts = {}

    # arms were posed per capture (ST2431 hands 5 cm wider): hands ship with their top, the avatar is head and feet
    h, p, r = load(ROOT / "splats/MOMU-6_st2431.ply")
    x, y, z, rgb, lum, sat, reach = fields(p, r)
    cream = (lum > 0.48) & (sat < 0.25)                               # the mannequin; every garment is darker
    red = (rgb[:, 0] > 1.8 * rgb[:, 1]) & (rgb[:, 0] > 1.8 * rgb[:, 2])
    hands = (y > -0.16) & (y < -0.085) & (np.abs(x) > 0.14)          # wooden hands below the braided cuffs
    parts["avatar"] = (h, r[cream & (((y > 0.22) & (y < 0.33) & (np.abs(x) < 0.07)) | (y < -0.42))])   # kepi from 0.33
    parts["ST2431_hands"] = (h, r[hands])
    parts["ST2431_top"] = (h, r[~cream & ~hands & (y > -0.12) & (y < 0.28) & ~(red & (y < -0.03))])
    parts["ST2431_bottom"] = (h, r[~cream & (y <= -0.1) & (np.abs(x) < 0.1)])

    h, p, r = load(ROOT / "splats/MOMU-7_st2432.ply")
    x, y, z, rgb, lum, sat, reach = fields(p, r)
    cream = (lum > 0.48) & (sat < 0.25)
    red = (rgb[:, 0] > 1.8 * rgb[:, 1]) & (rgb[:, 0] > 1.8 * rgb[:, 2])
    # the coat tails hang behind the trousers to -0.27; a blurry splat counts as tail if its footprint reaches there,
    # and so does red near the back centre (the trouser stripes sit on the side seams, |x - 0.01| about 0.09)
    tails = (y > -0.28) & (y < -0.04) & ((z - reach < -0.04) | (red & (z < -0.02) & (np.abs(x - 0.01) < 0.085)))
    side = (np.abs(x - 0.01) > 0.09) & (y > -0.2)                     # sleeves and hands hang outside the trouser legs
    hands = side & (y > -0.175) & (y < -0.105) & ~red                 # wooden hands below the red cuffs
    waist = -0.04                                                     # trouser waistband, seen through the open coat
    parts["ST2432_hands"] = (h, r[hands])
    parts["ST2432_top"] = (h, r[((y >= waist) | tails | side) & ~hands])
    parts["ST2432_bottom"] = (h, r[(y < waist) & ~tails & ~side & ~cream])

    for name, (h, rows) in parts.items():
        save(out / f"{name}.ply", h, rows)
        print(f"{name}: {len(rows)} splats")


if __name__ == "__main__":
    cut(Path(sys.argv[1]))
