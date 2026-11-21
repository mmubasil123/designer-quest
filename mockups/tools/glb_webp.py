"""Re-encode a GLB's PNG base-colour texture as WebP (ticket A5), declared through EXT_texture_webp.

The PNG is 60 to 70% of each TRELLIS GLB; WebP at q85 cuts it about tenfold with no visible change at Stage size.
three's GLTFLoader and model-viewer both read EXT_texture_webp. Already-WebP files are left alone.
Run from the repo root: .venv/bin/python -I mockups/tools/glb_webp.py mockups/assets/ST2434.glb [more.glb ...]
"""
import io
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from glb_io import image, read_glb, write_glb  # noqa: E402

QUALITY = 85


def to_webp(path):
    j, binb = read_glb(path)
    if j["images"][0].get("mimeType") == "image/webp":
        return None
    before = os.path.getsize(path)
    rgb, view = image(j, binb)
    buf = io.BytesIO(); rgb.save(buf, "WEBP", quality=QUALITY, method=6)
    img = j["images"][0]; img["mimeType"] = "image/webp"
    for t in j.get("textures", []):   # the WebP image moves into the extension; no PNG fallback is kept
        if t.get("source") == 0:
            t.pop("source"); t.setdefault("extensions", {})["EXT_texture_webp"] = {"source": 0}
    for key in ("extensionsUsed", "extensionsRequired"):
        j[key] = sorted(set(j.get(key, [])) | {"EXT_texture_webp"})
    write_glb(path, j, binb, view, buf.getvalue())
    return before, os.path.getsize(path)


if __name__ == "__main__":
    for p in sys.argv[1:]:
        r = to_webp(p)
        print(f"{p}: already WebP" if r is None else f"{p}: {r[0] / 1e6:.2f} MB -> {r[1] / 1e6:.2f} MB")
