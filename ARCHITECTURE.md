# Architecture

Three independent parts joined by files, not services. Nothing runs a server in production: the mockup is static.

```
MoMu Omeka S APIs ──fetch──> cache/ (JSON pages) ──load──> Postgres (schema.sql) ──dump──> seed/
                                                                  │  facts, ids, photo shas
                                                                  v
heron.libis.be photo ──> garment_mask.py ──> img2glb.py (TRELLIS, HF) ──> mockups/assets/<id>.glb
                                                                  │
mockups/pieces.json  (single source of truth for pieces) ─────────┼──> second-skin.html (three.js, browser)
                                                                  └──> batch_glb.py, make_swatches.py
```

## 1. Collection database
- `harvester/momu_harvest.py` (stdlib + psycopg). `fetch`: Omeka S JSON APIs of studycenter.momu.be and
  heron.libis.be/momu into `cache/<source>/<resource>/page-NNNNN.json`; robots.txt honoured, one request at a time,
  resumable. `load`: cache into Postgres, re-runnable offline. `download-media`: media files.
- `schema.sql`: Omeka model normalised. Core tables `object` (inventory number, year range), `object_value`
  (every property as `term` + value), `concept`/`object_concept`, `agent`/`object_agent`, `media`, `item_set`,
  `showcase_object`.
- `seed/momu_full.dump` (pg_restore) and `seed/momu_seed.sql.gz` (psql): 4622 objects, 9323 media.
- `cache/` is git-ignored (47 MB); `fetch` rebuilds it.

## 2. 3D pipeline (`mockups/tools/`, Python in `.venv`)
- `batch_glb.py`: for every unlocked piece in `pieces.json` without `assets/<id>.glb`, download the photo by
  `source.imgSha`, cut it out (unless `pipeline.cutout` is `none`), run TRELLIS. Skips existing GLBs, so reruns
  resume after the GPU quota runs out.
- `garment_mask.py`: local segformer (`mattmdjaga/segformer_b2_clothes`), keeps the slot's clothing labels only.
- `img2glb.py`: public TRELLIS Space via `gradio_client`, needs `HF_TOKEN` from `.env`.
- `make_swatches.py`: tileable 512 px fabric crops for Remix.
- Output is committed: GLBs are expensive to make (scarce free GPU), cheap to store.

## 3. Second Skin mockup (`mockups/`)
- `second-skin.html`: one file, one `<script type="module">`. three.js 0.169.0 from jsDelivr via import map;
  model-viewer only on the Piece page (to be replaced, A4).
- Boot: `fetch("pieces.json")`, restore save from `localStorage` key `secondSkin.save.v1` (ids validated).
- Engine: `Turntable` class owns one renderer and scene: `makeForm()` procedural dress form, each worn GLB via
  `prepGarment()` + `place()` (auto-fit by slot from the bounding box), `setFabric()` remix (triplanar, body and
  sleeves zones, scaled by `meanLuma`).
- UI: screens via `go(screen)`; wardrobe bottom sheet `setSnap()`/`snapY()`; `renderLocker()`, `renderCredit()`
  (time-span game), `renderTrack()` (knowledge track); `?card=<id>` unlocks and wears a piece.
- Deploy: Vercel project `second-skin`, root `mockups/`, `.vercelignore` drops tools and sources;
  `vercel.json` rewrites `/` to the page.

## Invariants (break one and something silently goes wrong)
- `pieces.json` is the only piece list; page and pipeline both read it. Validate against `pieces.schema.json`.
  An id with `/` maps to a file name with `_`.
- Render order: form, clear depth, garments. Reordering lets the form show through scans.
- A CLO GLB (`kind: "clo"`, `origin: "avatar"`) must skip auto-fit rescaling (D5, A7 not built yet).
- The page never calls an API at runtime except the CDN and its own static files; no accounts, no PII (D2).
- Piece facts on screen trace to a record field; Dutch-only text is marked as a translation.

## Where to go next
Open work and its order: `LEDGER.md`. Planned structure change: A3 splits the script into `src/` modules with
Vite and moves the deploy root to `app/` (D7).
