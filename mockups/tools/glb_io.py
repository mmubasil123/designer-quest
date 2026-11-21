"""Read and write a single-buffer GLB and swap its base-colour texture; shared by the texture tools.

Contract: `read_glb` returns (json, binary chunk); `write_glb` repacks every bufferView 4-byte aligned, replacing one
image's bytes (and mime type), so the file stays valid glTF 2.0.
"""
import io
import json
import struct

from PIL import Image


def read_glb(path):
    b = open(path, "rb").read()
    n = struct.unpack("<I", b[12:16])[0]
    j = json.loads(b[20:20 + n])
    binlen = struct.unpack("<I", b[20 + n:24 + n])[0]
    return j, b[28 + n:28 + n + binlen]


def image(j, binb, k=0):
    """The k-th image as RGB, with its bufferView index."""
    view = j["images"][k]["bufferView"]; v = j["bufferViews"][view]
    start = v.get("byteOffset", 0)
    return Image.open(io.BytesIO(binb[start:start + v["byteLength"]])).convert("RGB"), view


def write_glb(path, j, binb, image_view, data):
    parts, pos = [], 0
    for k in sorted(range(len(j["bufferViews"])), key=lambda k: j["bufferViews"][k].get("byteOffset", 0)):
        v = j["bufferViews"][k]
        chunk = data if k == image_view else binb[v.get("byteOffset", 0):v.get("byteOffset", 0) + v["byteLength"]]
        pad = (-pos) % 4
        parts.append(b"\0" * pad); pos += pad
        v["byteOffset"], v["byteLength"] = pos, len(chunk)
        parts.append(chunk); pos += len(chunk)
    nb = b"".join(parts); nb += b"\0" * ((-len(nb)) % 4)
    j["buffers"][0]["byteLength"] = len(nb)
    js = json.dumps(j, separators=(",", ":")).encode(); js += b" " * ((-len(js)) % 4)
    open(path, "wb").write(b"glTF" + struct.pack("<II", 2, 28 + len(js) + len(nb)) + struct.pack("<I", len(js)) + b"JSON" + js
                           + struct.pack("<I", len(nb)) + b"BIN\0" + nb)
