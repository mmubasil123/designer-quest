"""Make a wearable garment GLB for one piece and register it in pieces.json. Doc: docs/WEARABLE-PIPELINE.md

Usage (repo root):  .venv/bin/python -I mockups/tools/garment.py <piece id> [--preview out.png] [--no-register]

Two routes, picked from the piece's assets in pieces.json:
  splat  The piece has a MoMu Gaussian-splat scan (.sog). Its own capture holds the true cut from every side, so:
         decode the .sog (splat-transform) -> drop the dress form, hands and head by the rules in
         pipeline.mesh.drop -> fuse the splats into a density field -> marching cubes -> simplify and smooth ->
         UV unwrap -> bake colour by compositing the splats along each texel's normal, as a splat renderer would ->
         match the swatch's colour -> GLB with a WebP texture. Free, about 2 minutes, no GPU.
  photo  No scan: hands over to batch_glb.py (garment cut out of the photo, then TRELLIS on Hugging Face ZeroGPU,
         about 2 runs a day per account; needs HF_TOKEN in .env). Its back is a guess.
Then registers assets.glb (kind "scan", units "norm", origin "bbox": the Stage fits it by slot box) and, for a study
piece, `wear` (the slot it is worn in once won), so the app wears it as itself and every fabric remixes onto it.

pipeline.mesh in pieces.json (all optional):
  wear      slot the garment goes in (default: the piece's slot, or "full" for a study piece)
  drop      list of rules; a splat matching every bound of one rule is dropped. Bounds: H (0 floor..1 top of the
            capture), lum, sat, hue (degrees), x, ax (|x|), z. E.g. the wooden hands: {"hue":[15,50],"sat":[0.2,1],"H":[0,0.5]}
  res, blur, pct   density grid cell (capture units), blur in cells, iso level percentile
  faces, tex       triangle budget and texture size
  matchk, satk     colour: luminance gain to swatch median x matchk (default 0.5), saturation boost (default none);
                   splat DC colour is darker and greyer than the photo
  split, sleeveTo  are fit hints, set in `fit`, not here: body/sleeve boundary for the remix zones

Needs (in .venv): numpy scipy scikit-image trimesh xatlas fast-simplification pillow; splat-transform in tools/node.
"""
import argparse
import io
import os
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import trimesh
import xatlas
import fast_simplification
from PIL import Image
from scipy import ndimage
from scipy.spatial import cKDTree
from skimage import measure

sys.path.insert(0, str(Path(__file__).parent))
from glb_io import image, read_glb, write_glb  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
MOCKUPS = ROOT / "mockups"
MANIFEST = MOCKUPS / "pieces.json"
SPLAT_TRANSFORM = Path(os.environ.get("SPLAT_TRANSFORM", ROOT / "tools/node/node_modules/.bin/splat-transform"))


def file_of(pid):
    return pid.replace("/", "_")


# ---- splat route ---------------------------------------------------------------------------------------------------

def read_ply(path):
    with open(path, "rb") as f:
        props, n = [], 0
        while True:
            s = f.readline().decode().strip()
            if s.startswith("element vertex"):
                n = int(s.split()[2])
            elif s.startswith("property"):
                assert s.split()[1] == "float", s
                props.append(s.split()[2])
            elif s == "end_header":
                break
        rows = np.fromfile(f, dtype=np.float32, count=n * len(props)).reshape(n, len(props))
    return {k: rows[:, i] for i, k in enumerate(props)}


def splats(sog):
    """Decode a .sog into centres (y up, z front), colour, opacity and footprint."""
    with tempfile.TemporaryDirectory() as tmp:
        ply = Path(tmp) / "s.ply"
        subprocess.run([str(SPLAT_TRANSFORM), "-q", str(sog), str(ply)], check=True, capture_output=True)
        c = read_ply(ply)
    P = np.stack([c["x"], -c["y"], c["z"]], 1)   # the captures are y-down
    rgb = np.clip(0.5 + 0.2821 * np.stack([c["f_dc_0"], c["f_dc_1"], c["f_dc_2"]], 1), 0, 1)
    op = 1 / (1 + np.exp(-c["opacity"]))
    sigma = np.exp(np.stack([c["scale_0"], c["scale_1"], c["scale_2"]], 1)).max(1)
    return P, rgb, op, sigma


def keep_mask(P, rgb, op, sigma, cfg):
    lum = rgb @ [0.299, 0.587, 0.114]
    sat = (rgb.max(1) - rgb.min(1)) / np.maximum(rgb.max(1), 1e-6)
    r, g, b = rgb.T
    hue = np.degrees(np.arctan2(np.sqrt(3) * (g - b), 2 * r - g - b)) % 360
    y = P[:, 1]
    v = {"H": (y - y.min()) / (y.max() - y.min()), "lum": lum, "sat": sat, "hue": hue,
         "x": P[:, 0], "ax": np.abs(P[:, 0]), "z": P[:, 2]}
    keep = (op > cfg.get("op", 0.04)) & (2 * sigma < cfg.get("reach", 0.02))   # near-invisible and huge splats are fog
    for rule in cfg.get("drop", []):
        m = np.ones(len(P), bool)
        for k, (lo, hi) in rule.items():
            m &= (v[k] >= lo) & (v[k] <= hi)
        keep &= ~m
    return keep


def mesh_from_splats(P, O, cfg):
    res, pad = cfg.get("res", 0.0015), 6
    lo = P.min(0) - pad * res
    dims = np.ceil((P.max(0) + pad * res - lo) / res).astype(int) + 1
    F = np.zeros(dims, np.float32)
    np.add.at(F, tuple(((P - lo) / res).round().astype(int).T), O)
    F = ndimage.gaussian_filter(F, cfg.get("blur", 1.6))
    level = np.percentile(F[F > 1e-4], cfg.get("pct", 55))
    v, f, _, _ = measure.marching_cubes(F, level)
    m = trimesh.Trimesh(v * res + lo, f[:, ::-1], process=True)
    parts = m.split(only_watertight=False)
    big = max(len(p.faces) for p in parts)
    parts = [p for p in parts if len(p.faces) > max(cfg.get("minfaces", 2000), 0.03 * big)]   # loose crumbs (a stray neck ring) out
    m = trimesh.util.concatenate(parts)
    vv, ff = fast_simplification.simplify(m.vertices.astype(np.float32), m.faces.astype(np.int32),
                                          target_reduction=max(0.0, 1 - cfg.get("faces", 40000) / len(m.faces)))
    m = trimesh.Trimesh(vv, ff, process=True)
    trimesh.smoothing.filter_taubin(m, iterations=8)
    return m, res


def raster(uv, ind, V, VN, T):
    """Every texel covered by a triangle in UV space, with its 3D point and normal."""
    U = uv * (T - 1)
    Q, QP, QN = [], [], []
    for t in ind:
        a, b, c = U[t]
        x0, x1 = int(np.floor(min(a[0], b[0], c[0]))), int(np.ceil(max(a[0], b[0], c[0])))
        y0, y1 = int(np.floor(min(a[1], b[1], c[1]))), int(np.ceil(max(a[1], b[1], c[1])))
        M = np.array([[b[0] - a[0], c[0] - a[0]], [b[1] - a[1], c[1] - a[1]]])
        if abs(np.linalg.det(M)) < 1e-9:
            continue
        gx, gy = np.meshgrid(np.arange(x0, x1 + 1), np.arange(y0, y1 + 1))
        q = np.stack([gx.ravel(), gy.ravel()], 1) + 0.5
        w = np.linalg.solve(M, (q - a).T).T
        w0 = 1 - w.sum(1)
        ins = (w >= -0.05).all(1) & (w0 >= -0.05)
        if not ins.any():
            continue
        bc = np.c_[w0[ins], w[ins]]
        Q.append(np.clip(q[ins].astype(int), 0, T - 1))
        QP.append(bc @ V[t]); QN.append(bc @ VN[t])
    QN = np.concatenate(QN)
    return np.concatenate(Q), np.concatenate(QP), QN / (np.linalg.norm(QN, axis=1, keepdims=True) + 1e-9)


def bake(QP, QN, P, C, O, S, res, k=48):
    """Look at each texel along its normal from outside and alpha-composite the splats near that ray, front to back.
    Nearest-splat colour comes out mottled: single splats are noisy, only their blend is the cloth."""
    tree = cKDTree(P)
    col = np.zeros((len(QP), 3))
    for i in range(0, len(QP), 20000):
        qp, qn = QP[i:i + 20000], QN[i:i + 20000]
        _, nn = tree.query(qp, k=k)
        rel = P[nn] - qp[:, None]
        dep = (rel * qn[:, None]).sum(2)   # + is outside
        perp = np.linalg.norm(rel - dep[..., None] * qn[:, None], axis=2)
        a = np.clip(O[nn] * np.exp(-0.5 * (perp / np.maximum(S[nn], res * 0.3)) ** 2), 0, 0.99)
        o = np.argsort(-dep, axis=1)   # outermost first
        a = np.take_along_axis(a, o, 1)
        cc = np.take_along_axis(C[nn], o[..., None], 1)
        w = a * np.cumprod(np.c_[np.ones(len(a)), 1 - a[:, :-1]], axis=1)
        col[i:i + 20000] = (cc * w[..., None]).sum(1) / np.maximum(w.sum(1), 1e-6)[:, None]
    return col


def texture(Q, col, T, cfg):
    img = np.zeros((T, T, 3), np.float32)
    hit = np.zeros((T, T), bool)
    img[Q[:, 1], Q[:, 0]] = col; hit[Q[:, 1], Q[:, 0]] = True
    hit0 = hit.copy()
    for _ in range(8):   # grow charts into the gutters so mipmaps and filters never pull in black
        nb = ndimage.grey_dilation(np.where(hit[..., None], img, -1), size=(3, 3, 1))
        grow = ~hit & (nb[..., 0] >= 0)
        img[grow] = nb[grow]; hit |= grow
    img[~hit] = np.median(col, 0)
    img = np.where(hit0[..., None], ndimage.median_filter(img, size=(3, 3, 1)), img)
    dn = cfg.get("denoise", 7)   # plain cloth is smoothed hard; coloured details (rivets, braid, trim) are kept sharp
    if dn:
        sm = ndimage.median_filter(img, size=(dn, dn, 1))
        detail = ndimage.binary_dilation((img.max(2) - img.min(2)) > cfg.get("detail_sat", 0.12), iterations=1)
        img = np.where((hit0 & ~detail)[..., None], sm, img)
    return Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).transpose(Image.FLIP_TOP_BOTTOM)


def splat_route(piece, out):
    cfg = piece.get("pipeline", {}).get("mesh", {})
    P, rgb, op, sigma = splats(MOCKUPS / piece["assets"]["splat"]["path"])
    g = keep_mask(P, rgb, op, sigma, cfg)
    P, C, O, S = P[g], rgb[g], op[g], sigma[g]
    print(f"  {g.sum()} of {len(g)} splats kept")
    m, res = mesh_from_splats(P, O, cfg)
    c0 = (m.bounds[0] + m.bounds[1]) / 2; sc = 1 / (m.bounds[1] - m.bounds[0]).max()   # unit box, like TRELLIS
    m.apply_translation(-c0); m.apply_scale(sc)
    P, S, res = (P - c0) * sc, S * sc, res * sc
    vmap, ind, uv = xatlas.parametrize(m.vertices, m.faces)
    V, VN, T = m.vertices[vmap], m.vertex_normals[vmap], cfg.get("tex", 1024)
    Q, QP, QN = raster(uv, ind, V, VN, T)
    col = bake(QP, QN, P, C, O, S, res)
    swatch = MOCKUPS / "assets/swatch" / f"{file_of(piece['id'])}.jpg"
    if swatch.exists():   # DC colour leaves out the view-dependent light: bring the median to the photo's
        ref = np.asarray(Image.open(swatch).convert("RGB")).reshape(-1, 3) / 255
        lum = lambda c: np.median(c @ [0.299, 0.587, 0.114])   # one gain for all channels: per-channel would tint multicolour pieces
        col = col * (lum(ref) * cfg.get("matchk", 0.5) / max(lum(col), 1e-3))
    if cfg.get("satk"):   # splat DC colour is also greyer than the cloth: push it back out from its own luminance
        l = (col @ [0.299, 0.587, 0.114])[:, None]
        col = l + (col - l) * cfg["satk"]
    tex = texture(Q, col, T, cfg)
    mat = trimesh.visual.material.PBRMaterial(baseColorTexture=tex, metallicFactor=0.0, roughnessFactor=0.9)
    trimesh.Trimesh(V, ind, visual=trimesh.visual.TextureVisuals(uv=uv, material=mat), process=False).export(out)
    print(f"  {len(ind)} triangles")


def to_webp(path, quality=85):
    j, binb = read_glb(path)
    rgb, view = image(j, binb)
    buf = io.BytesIO(); rgb.save(buf, "WEBP", quality=quality, method=6)
    j["images"][0]["mimeType"] = "image/webp"
    for t in j.get("textures", []):
        if t.get("source") == 0:
            t.pop("source"); t.setdefault("extensions", {})["EXT_texture_webp"] = {"source": 0}
    for key in ("extensionsUsed", "extensionsRequired"):
        j[key] = sorted(set(j.get(key, [])) | {"EXT_texture_webp"})
    write_glb(path, j, binb, view, buf.getvalue())


# ---- photo route ---------------------------------------------------------------------------------------------------

def photo_route(piece, out):
    """The batch_glb.py steps for one piece: MoMu photo -> garment cut out -> TRELLIS (needs HF_TOKEN in .env)."""
    import urllib.request
    from garment_mask import garment_mask
    from img2glb import main as img2glb
    name = file_of(piece["id"])
    src = MOCKUPS / "assets/src" / f"{name}.jpg"
    if not src.exists():
        urllib.request.urlretrieve(f"https://heron.libis.be/momu/files/large/{piece['source']['imgSha']}.jpg", src)
    if piece["pipeline"]["cutout"] == "none":
        img2glb(str(src), str(out))
    else:
        cut = MOCKUPS / "assets/src" / f"{name}_garment.png"
        garment_mask(str(src), piece.get("pipeline", {}).get("mesh", {}).get("wear") or piece["slot"], str(cut))
        img2glb(str(cut), str(out))


# ---- register --------------------------------------------------------------------------------------------------------

def register(pid, path, wear):
    data = json.loads(MANIFEST.read_text())
    for p in data["pieces"]:
        if p["id"] != pid:
            continue
        p["assets"]["glb"] = {"path": str(path.relative_to(MOCKUPS)), "kind": "scan", "units": "norm", "origin": "bbox"}
        if p["slot"] == "study":   # `wear` goes right after slot, so diffs stay readable
            items = [(k, v) for k, v in p.items() if k != "wear"]
            i = [k for k, _ in items].index("slot") + 1
            p.clear(); p.update(items[:i] + [("wear", wear)] + items[i:])
    MANIFEST.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("id"); ap.add_argument("--no-register", action="store_true")
    a = ap.parse_args()
    piece = next(p for p in json.loads(MANIFEST.read_text())["pieces"] if p["id"] == a.id)
    out = MOCKUPS / "assets" / f"{file_of(a.id)}.glb"
    wear = piece.get("pipeline", {}).get("mesh", {}).get("wear") or (piece["slot"] if piece["slot"] != "study" else "full")
    print(a.id, "->", out.relative_to(ROOT))
    if piece["assets"].get("splat"):
        tmp = out.with_suffix(".tmp.glb")
        splat_route(piece, tmp)
        to_webp(tmp); shutil.move(tmp, out)
    else:
        photo_route(piece, out)
    print(f"  {out.stat().st_size / 1e6:.1f} MB")
    if not a.no_register:
        register(a.id, out, wear)
        print(f"  registered (wear: {wear})")


if __name__ == "__main__":
    main()
