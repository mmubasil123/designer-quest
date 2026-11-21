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
All 9 scan pieces are meshed, registered and checked on the Stage at 390 px (headless; not on a phone yet):
coat ST81190 (top), cavalry ST2431/1-4, tailcoat ST2432/1-2, sequin dress ST2435, polka-dot ST652/1, combinaison
ST673/1-2, kaftan ST80998, walking dress ST671, black satin ST2203 (all full).
Known flaws: coat wool a bit mottled; tailcoat keeps the wooden hands and a hole where the open front shows the
(uncaptured) form torso; sequin dress keeps slivers of the form's arms; black dress has ragged gaps at the hem.
Photo route still to run (on a machine with HF_TOKEN): ST81114AB, ST81116, ST2062.
