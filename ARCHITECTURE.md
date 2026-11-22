# Architecture

Three independent parts joined by files, not services. Nothing runs a server in production: the mockup is static.

```
MoMu Omeka S APIs ──fetch──> cache/ (JSON pages) ──load──> Postgres (schema.sql) ──dump──> seed/
                                                                  │  facts, ids, photo shas
                                                                  v
heron.libis.be photo ──> garment_mask.py ──> img2glb.py (TRELLIS, HF) ──> mockups/assets/<id>.glb
                                                                  │
mockups/pieces.json  (single source of truth for pieces) ─────────┼──> atelier.html (three.js, browser)
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

## 3. MoMu app mockup (`mockups/`)
- `atelier.html`: one file, one `<script type="module">`. three.js 0.169.0 from jsDelivr via import map;
  model-viewer only on the Piece page (to be replaced, A4).
- Boot: `fetch("pieces.json")`, restore save from `localStorage` key `atelier.save.v1` (ids validated).
- Story and questions (C2): on a card scan only, `quiz.js` loads `questions.json` (the curator's Notion page, copied by `tools/questions_sync.py`) and shows that piece's story and questions before the Stage or Up close; nothing is saved or locked.
- Engine: `Turntable` class owns one renderer and scene: `makeForm()` procedural dress form, each worn GLB via
  `prepGarment()` + `place()` (auto-fit by slot from the bounding box), `setFabric()` remix (triplanar, body and
  sleeves zones, scaled by `meanLuma`).
- UI: screens via `go(screen)`; wardrobe bottom sheet `setSnap()`/`snapY()`; `renderLocker()`, `renderCredit()`
  (time-span game); `?card=<id>` unlocks and wears a piece. Learning happens on Up close (the Levels track was removed).
- Study tab in the wardrobe sheet lists every `study` piece with its state (card not scanned, n of 3 found, fabric won); a scanned one opens Up close. Won fabrics appear in Remix.
- `up-close.html`: separate page for splat pieces (three 0.180.0 + Spark 2.4.0, while the main page stays on
  0.169.0). Detail hunt; progress in localStorage `atelier.found.v1` (`{id: [detail index]}`), which the main
  page reads to unlock a splat piece's fabric. `splat-viewer.html` is a local-only viewer for `splats/`.
- Deploy: Vercel project (still on its early name, Mubasil renames it), root `mockups/`, `.vercelignore` drops tools and sources;
  `/` serves the landing page `index.html` (E4), `vercel.json` rewrites `/stage` to the Stage (`atelier.html`);
  the landing page forwards `?card=` and `?fabric=` links to the Stage before anything renders, so sticker URLs keep working.
- Ask the archive (H2): fact card **Ask** opens `ask.js`'s sheet, which POSTs `{pieceId, question}` to
  `api/ask.js` (Vercel function, key in env `ANTHROPIC_API_KEY`) or, offline, answers suggested questions from
  `ask-records.json` fields. Local stand-in for Vercel: `tools/ask_dev_server.mjs`; eval: `tools/ask_eval/`.

## Invariants (break one and something silently goes wrong)
- `pieces.json` is the only piece list; page and pipeline both read it. Validate against `pieces.schema.json`.
  An id with `/` maps to a file name with `_`.
- Render order: form, clear depth, garments. Reordering lets the form show through scans.
- A `study` piece (has `assets.splat`, `glb: null`) is never worn: it is studied on `up-close.html`, and only its
  fabric reaches the main page. `batch_glb.py` skips it.
- A CLO GLB (`kind: "clo"`, `origin: "avatar"`) is never auto-fitted or rescaled against a body (D5). CLO models come only from the team, worn on his avatar via `clo/outfit.js`; a study piece is shown only as its splat (A7 reconstruction cut 2026-11-21).
- The page never calls an API at runtime except the CDN, its own static files and its own `/api/ask` (H2); no
  accounts, no PII (D2). `/api/ask` sends only the question and one public record to the Claude API (outside the EU)
  and stores nothing.
- Ask answers come only from `ask-records.json` (verbatim record fields); `ask-core.js` `checkAnswer()` drops any field
  or quote not in that record (D3).
- Piece facts on screen trace to a record field; Dutch-only text is marked as a translation.

## How-tos (moved from `HANDOVER.md`, 2026-11-22)

### Study piece from a splat (Up close)
- Raw `.ply` captures sit in the git-ignored `splats/` (about 220 MB each, from MoMu's Splatting_FOLDER on Google Drive or
  from Mubasil; MOMU-5 was never in the download). Convert with PlayCanvas `splat-transform` 3.10.3 from the git-ignored
  `tools/node/`: `tools/node/node_modules/.bin/splat-transform -q splats/MOMU-3_st2435.ply mockups/assets/splat/ST2435.sog`.
  Commit only the `.sog` (about 17 MB), never a `.ply`.
- Add the piece to `pieces.json` with `slot: "study"`, `assets.splat` and 3 `details`; place each `details[].at` with
  `upClose.fracAt(x, y, fz)` in the console on `up-close.html` (screen point to bounding-box fraction; the front of the scan
  is low `fz`), checking front and back. Each `quote` is cut verbatim from the record's `dcterms:description`; check it
  with a script. Then add a `POINT` in `make_swatches.py` (ticket A2 moves it into `pipeline` hints).
- Captures so far (record, type, date): MOMU-1 ST673/1-2 combinaison 1880-1900; MOMU-2 ST81190 coat 1998-99; MOMU-3 ST2435
  dress 1920-25; MOMU-4 ST80998 bridal kaftan 1900-25; MOMU-6 ST2431/1-4 uniform 1870-1900; MOMU-7 ST2432/1-2 uniform
  1800-1940; MOMU-8 ST671 dress 1900-15; MOMU-9 ST2203 dress 1937-48; MOMU-10 ST652/1 dress 1940-45. All are standard
  `.ply`, about 0.9 M splats, SH degree 3.

### Splat Stage (approach A, tickets G2 to G4): what the spike taught
Spike page `mockups/splat-stage-spike.html` (`window.spike`); parts cut by `mockups/tools/splat_spike_cut.py` (rules for
ST2431 and ST2432 only; commands in its docstring) into `mockups/assets/splat/spike/`, garments decimated to 30%, all SH 1.
- One look is 5.5 to 6.8 MB. Both uniforms were shot on the same MoMu form, so parts swap with no scaling and Spark sorts
  splats across meshes. Fabric remix is a Spark dyno `objectModifier` that keeps luminance and swaps hue (cream above 0.45
  stays undyed; a uniform change needs `mesh.updateVersion()`).
- Carry into the build: (1) Spark still draws a SplatMesh with `visible = false`, so add and remove it. (2) The form's arms
  differ per capture, so hands travel with their top as an undyed part. (3) Cut by splat footprint, not centre, or blurry
  splats drag coat tails into the trousers. (4) Hidden garment areas are missing, so a look always needs a top.
- Known flaws: ST2432 keeps its own waistband in the coat opening; its trousers have white knee streaks; the dye is strong
  on indigo. Not yet checked on a phone; three 0.169 to 0.180 is needed for Spark in the Stage.

### CLO models on the outfit page (`outfit.html`, `clo/`)
- MoMu's own CLO projects (ST80881, ST503, ST2062, ST81190, ST80998), each on MoMu's mannequin at `outfit.html?card=<id>`.
  To add one: open its `.zprj` in CLO, File > Export > OBJ with patterns, avatars and trims selected, Multiple Objects,
  Thin, mm; run `node clo/obj2glb.mjs <scene.obj> <outDir> <id>`; `clo/optimise_glb.mjs` on both files (garment ratio 0.5,
  body 0.4); add `assets.clo` with `avatar` = its `_body.glb`. Eleven pieces have no CLO project; the cavalry ST2431
  project is part 1 of 4 and undraped. Linked from the fact card and Up close ("See it on a mannequin", H14, H18).
- the team's pieces (blouse ST81114AB, trousers ST81116, cycling outfit) on the team avatar: run `clo/optimise_glb.mjs` on his
  GLB into `assets/clo/`, add `assets.clo` with the same `avatar`; if it overlaps a piece already worn, cut a variant with
  `clo/tuck_glb.mjs` and list it under `variants`. They are reached only from their card scans, not the wardrobe.
- Engine rule (D5): a CLO garment is `assets.glb.kind: "clo"`, `origin: "avatar"`, `units: "m"`, never rescaled. The team
  makes no CLO garments of its own (A7 cut). For new CLO work on a personal machine: pattern files from MoMu and
  `Lilbonner/clo3d-mcp` (read its listener first; WeTransfer is blocked on the work laptop).

### Deploy
Vercel project from `mockups/` (its name and `*.vercel.app` URL still carry the early idea name), on Mubasil's account.
Production tracks `main`: Mubasil redeploys after pushes to `main` (`cd mockups && npx vercel deploy --prod`; a preview
is `npx vercel deploy`, confirm `target`). Only Mubasil deploys. Ask needs `ANTHROPIC_API_KEY` (or `ASK_PROVIDER` +
`ASK_API_KEY` + `ASK_MODEL`) set in the Vercel project first.

## Where to go next
Open work and its order: `LEDGER.md`. Planned structure change: A3 splits the script into `src/` modules with
Vite and moves the deploy root to `app/` (D7).
