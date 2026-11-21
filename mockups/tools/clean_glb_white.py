"""Paint out white mannequin and background bleed in a TRELLIS GLB's baked texture.

TRELLIS guesses a garment's back from one front photo and bakes leftovers of the white form or backdrop into the
texture. This fills every near-white, low-saturation texel from its coloured neighbours, so use it only on garments
that have no white of their own (check the cutout photo first).
Run from the repo root: .venv/bin/python -I mockups/tools/clean_glb_white.py mockups/assets/ST2434.glb out.glb
"""
import io
import json
import struct
import sys

import numpy as np
from PIL import Image

LUM, SAT = 0.40, 0.20   # above this luminance and below this saturation a texel counts as bleed
HALO = 2                # texels: the anti-aliased grey rim around each patch goes too


def read_glb(path):
    b = open(path, "rb").read()
    n = struct.unpack("<I", b[12:16])[0]
    j = json.loads(b[20:20 + n])
    binlen = struct.unpack("<I", b[20 + n:24 + n])[0]
    return j, b[28 + n:28 + n + binlen]


def write_glb(path, j, binb, image_view, png):
    parts, pos = [], 0
    for k in sorted(range(len(j["bufferViews"])), key=lambda k: j["bufferViews"][k].get("byteOffset", 0)):
        v = j["bufferViews"][k]
        data = png if k == image_view else binb[v.get("byteOffset", 0):v.get("byteOffset", 0) + v["byteLength"]]
        pad = (-pos) % 4
        parts.append(b"\0" * pad); pos += pad
        v["byteOffset"], v["byteLength"] = pos, len(data)
        parts.append(data); pos += len(data)
    nb = b"".join(parts); nb += b"\0" * ((-len(nb)) % 4)
    j["buffers"][0]["byteLength"] = len(nb)
    js = json.dumps(j, separators=(",", ":")).encode(); js += b" " * ((-len(js)) % 4)
    open(path, "wb").write(b"glTF" + struct.pack("<II", 2, 28 + len(js) + len(nb)) + struct.pack("<I", len(js)) + b"JSON" + js
                           + struct.pack("<I", len(nb)) + b"BIN\0" + nb)


def bleed_mask(rgb):
    mx, mn = rgb.max(-1), rgb.min(-1)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    return (rgb @ [0.2126, 0.7152, 0.0722] > LUM) & (sat < SAT)


def box(a, r):
    """Sum over a (2r+1)-square window, edges clamped, via cumulative sums."""
    pad = np.pad(a, [(r + 1, r)] * 2 + [(0, 0)] * (a.ndim - 2), mode="edge").cumsum(0).cumsum(1)
    return pad[2 * r + 1:, 2 * r + 1:] - pad[:-2 * r - 1, 2 * r + 1:] - pad[2 * r + 1:, :-2 * r - 1] + pad[:-2 * r - 1, :-2 * r - 1]


def grow(mask, r):
    return box(mask.astype(float), r) > 0


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


def main(src, dst):
    j, binb = read_glb(src)
    view = j["images"][0]["bufferView"]; v = j["bufferViews"][view]
    rgb = np.asarray(Image.open(io.BytesIO(binb[v.get("byteOffset", 0):v.get("byteOffset", 0) + v["byteLength"]])).convert("RGB")) / 255.0
    mask = grow(bleed_mask(rgb), HALO)
    out = fill(rgb, mask)
    buf = io.BytesIO(); Image.fromarray((out * 255).round().astype(np.uint8)).save(buf, "PNG", optimize=True)
    write_glb(dst, j, binb, view, buf.getvalue())
    print(f"{mask.mean():.1%} of texels repainted")


if __name__ == "__main__":
    assert bleed_mask(np.array([[[1.0, 1.0, 1.0], [0.2, 0.4, 0.1]]])).tolist() == [[True, False]]   # white is bleed, green is cloth
    main(*sys.argv[1:3])
