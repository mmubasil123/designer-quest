# Wearable garment pipeline

Goal: every MoMu piece gets a wearable GLB, so any piece can be worn and any fabric remixed onto it (fabrics stay
textures, so combinations cost nothing). One command per piece:

```
.venv/bin/python -I mockups/tools/garment.py <piece id>      # e.g. ST81190, "ST2431/1-4"
```

It writes `mockups/assets/<id>.glb` (WebP texture, about 1 to 1.4 MB, 40k triangles) and registers it in
`pieces.json` (`assets.glb`, and `wear` for a study piece: the slot it is worn in once won).

## Routes
- **Splat route** (piece has a `.sog` scan): true cut from every side, free, about 2 min on a laptop CPU, no GPU.
  Decode (splat-transform) -> drop form, hands, head by `pipeline.mesh.drop` rules -> density field -> marching
  cubes -> simplify/smooth -> UV unwrap (xatlas) -> bake colour by compositing splats along each texel's normal ->
  denoise plain cloth, keep coloured details -> luminance match to the swatch -> WebP.
- **Photo route** (no scan): the `batch_glb.py` steps for one piece (garment cut-out, TRELLIS on HF ZeroGPU, about
  2 runs a day, needs `HF_TOKEN`). Its back is a guess.

## Tuning a piece (`pipeline.mesh` in pieces.json)
`wear`, `drop` (rules on H 0..1 height, lum, sat, hue, x, ax=|x|, z), `pct` (iso level, lower fills holes),
`matchk` (brightness vs swatch, default 0.5), `satk` (saturation boost), `faces`, `tex`, `denoise`.
Fit hints live in `fit`: `sleeveTo`, `split` (body/sleeve remix boundary, fraction of half width).
Check with a front/side/back render and on the Stage at 390 px.

## Setup
`.venv`: `numpy scipy scikit-image trimesh xatlas fast-simplification pillow`.
`splat-transform` in `tools/node` (see AGENTS.md), or point `SPLAT_TRANSFORM` at it.

## Status (2026-11-21)
- ST81190 Riveted wool coat: done, worn as a top (collar, yoke, rivets, red cross all show). Cloth still a bit mottled.
- ST2431/1-4 cavalry uniform: done as a full look (frogging, back braid, sleeve knots). Colours duller than the photo.
- To run: ST2432/1-2, ST2435, ST652/1, ST673/1-2, ST80998, ST671, ST2203 (each needs its drop rules for form/hands).
- Photo route still to run for pieces with no 3D: ST81114AB, ST81116, ST2062.
