# Handover: next session (2026-11-21, late night)

Read this, then `LEDGER.md` (tickets, decisions D1 to D8, product-owner cut and lanes). `CHANGELOG.md` has every
change with its reason. Agent rule (both people): work autonomously within your claimed ticket, inspect screenshots critically
before calling anything done. Never deploy, push to `main` or publish without your person's explicit go.

## State
- `mockups/second-skin.html` + `mockups/pieces.json` (schema `pieces.schema.json`): one three.js scene per
  turntable, a procedural dress form, 7 GLB scans auto-fitted by slot and drawn in dressing order, fabric remix on
  body and sleeves, look names, time span, Firsts toasts, card scan (`?card=<id>`), save in localStorage.
- All 7 wearable scans are garment-only except the kimono (stand hidden by the `hideStand` shortcut).
- Live at https://second-skin-ten.vercel.app (Vercel project `second-skin`, deployed from `mockups/`; the first
  deploy went out as production). Redeploy: `cd mockups && npx vercel deploy` (preview) and confirm `target`.
- Phone app build is on preview https://second-skin-ar90y2hhq-mmubasilbokhari-6857s-projects.vercel.app
  (production not updated). Promote with `npx vercel deploy --prod` from `mockups/` only on the owner's go.
- Serve: `cd mockups && python3 -m http.server 8765 --bind 127.0.0.1`; console handle `window.secondSkin`.

## Done tonight (from the ledger)
A1 manifest, B1 "+" buttons removed, B2 44 px targets, B3/B4 wardrobe sheet, C3 card scan, C6 save; plus remix,
two-zone mixing, calmer motion, look names, Firsts, mannequin-free rescans, readable pattern scans, floor-length
trousers, plinth removed, dressing-order render.

## Do next, in the product-owner's order
1. Done: **B3 wardrobe sheet** and B4 snapping (one canvas now). Next: test the drag on a real phone, then finish
   **A4** by replacing model-viewer on the Piece page with the engine.
2. **E3 Vercel preview**, only after the owner says go: Root Directory should become `app/` once A3 lands; until
   then deploy `mockups/` as a static site and exclude nothing else.
3. **A6 LRU + render on demand**, **A5 GLB optimisation** (meshopt + webp, keep `gltf-transform` inside the project).
4. **C2** questions for 3 pieces quoting MoMu fields, **C1** fabric cards.
5. **B7** share card, **E2** screen recording, **E1** slides in `presentation/`.

## Left / known issues
- Kimono rescan without its stand (TRELLIS from the photo with `assets/ST80881_cutout.png` as alpha), then drop
  `fit.hideStand` in `pieces.json`.
- Jak cutout left a cream mannequin patch inside its front opening and a gold sliver at its side.
- TRELLIS guesses backs from one photo; busy remix fabrics show projection seams; fabric scale is fixed.
- Stage header is still crowded at phone width (name wraps beside the finishes): B9 fixes the hierarchy.
- `make_swatches.py` still uses its own `POINT`/`SHIFT` dicts (ticket A2 moves them into `pipeline` hints).
- GPU: free ZeroGPU is a few minutes a day per account (about 2 TRELLIS runs), refilling about 24 h after first use
  (community reports). The owner uses a second account for MoMu research work.

## Growth story (for the pitch)
The 8 pieces are MoMu's own "All Hackathon Assets" garments (item set 413025). The DB has 2075 ST objects with
images and 87 garments linked to pattern records, enough for a 20-piece season "Fibres and Hands, 1750 to 2009"
(shortlist in `LEDGER.md`, verify each photo and fact before use).

## 3D Gaussian Splats (MoMu, 2026-11-19)
From the hackathon page's Splatting_FOLDER (Google Drive). `splats/` is git-ignored: each file is about 220 MB,
so share it outside git. Standard .ply only so far: about 0.9 M splats each, SH degree 3 (45 `f_rest`).
MOMU-5 is missing (Drive may have split the download into a second zip). The `.sog` and compressed `.ply`
folders hold the same pieces, smaller.

| File | Record | Type (dcterms:subject) | Date (dcterms:date) |
|---|---|---|---|
| MOMU-1_st673 | ST673/1-2 | combinaison | 1880-1900 |
| MOMU-2_st81190 | ST81190 | jas (coat) | herfst-winter 1998-1999 |
| MOMU-3_st2435 | ST2435 | jurk (dress) | 1920-1925 |
| MOMU-4_st80998 | ST80998 | japon (bridal kaftan) | 1900-1925 |
| MOMU-6_st2431 | ST2431/1-4 | uniform | 1870-1900 |
| MOMU-7_st2432 | ST2432/1-2 | uniform | 1800-1940 |
| MOMU-8_st671 | ST671 | japon | 1900-1915 |
| MOMU-9_st2203 | ST2203 | jurk | 1937-1948 |
| MOMU-10_st652 | ST652/1 (+ /2 slip) | jurk | 1940-1945 |

None of the 8 demo pieces has a splat; ST2435 is on the season shortlist. Splats are not meshes: no remix shader,
and they need a splat renderer (e.g. Spark for three.js, unverified) beside the dress form. 220 MB is too big
for a phone page: test the `.sog` or compressed `.ply` size before any engine work.

## Up close (branch basil/splats, not deployed)
`mockups/up-close.html?id=ST2435` or `?id=ST652/1`; demo entry is `second-skin.html?card=ST652/1`.
`.sog` files (17 MB each, committed) are made from the raw `.ply` with PlayCanvas `splat-transform` 3.10.3,
installed in the git-ignored `tools/node/`:
`tools/node/node_modules/.bin/splat-transform -q splats/MOMU-3_st2435.ply mockups/assets/splat/ST2435.sog`.
Adding a splat piece: an entry with `slot: "study"`, `assets.splat`, and `details[].at` from `upClose.fracAt(x, y, fz)` in the console
(screen point to bounding-box fraction, front of the scan is low fz), then a `POINT` in `make_swatches.py`.

## CLO path
CLO on a personal machine (WeTransfer is blocked here), pattern files from MoMu, `Lilbonner/clo3d-mcp` (read its
listener first). In `pieces.json` a CLO garment is `assets.glb.kind: "clo"`, `origin: "avatar"`, `units: "m"`;
ticket A7 adds the engine branch (no rescale, remix by named panel material).

## Housekeeping
Loose large files in the project root: `artcraft-launcher-0.19.2-macos-universal.dmg` (git-ignored),
`1764243536153.gif`. Repo: github.com/mmubasil123/momu-collection-db; collaboration rules are in `AGENTS.md`.
