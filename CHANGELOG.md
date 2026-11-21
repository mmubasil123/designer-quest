# Changelog: Second Skin mockup

Newest first. Each entry: what changed, why, and the decision behind it.

## 2026-11-21

### All 9 MoMu splats, Study tab, flow fixes (branch basil/splats-7)
- 7 more study pieces: ST673/1-2, ST81190, ST80998, ST2431/1-4, ST2432/1-2, ST671, ST2203. `.sog` 14 to 17 MB each; 3 details per piece quoted verbatim from `dcterms:description` (checked by script), placed with `upClose.fracAt` on front and back views; swatches cropped clear of buttons, lace and background.
- Study chip in the wardrobe sheet (after an analysis-agent review of placement): tiles show name, date and state; a scanned piece opens Up close; an unscanned one stays put (D2). Remix now shows only won fabrics. "Full look" chip is "Full" so 6 chips fit at 390 px; the "6 of 20 pieces found" line is computed.
- `?card=<study id>` redirects before the Stage boots (no GLB downloads); unknown or 3D-less cards toast "This card isn't in the app yet"; `?card` is cleared from the URL so a reload doesn't re-apply it; a won fabric opens the sheet on Remix.
- Up close: a scan that fails or takes over 45 s shows "The scan didn't load" with Try again instead of loading forever.
- LEDGER D2 updated: for study pieces the detail hunt is the question that wins the fabric.
- Checked in Chrome at 390 px: Study tiles and states, seen/unseen taps, early redirect (0 GLB requests), unknown card toast and clean URL, fabric arrival on Remix, failure state with a hidden scan, all 9 scans load.

### No dead buttons: Up close CTA and Share look
- Up close: the CTA was disabled with no reason until every detail was found (reported as "button doesn't work"). It now reads "Find N more to wear its fabric" and turns the camera to the next detail; once all are found it fills and reads "Wear its fabric". Show me and the CTA share one `showMe()`.
- Share look had no handler. It now shares the look name, span and link (Web Share, or the clipboard with a toast); "My look" when nothing is remixed. Shortcut until B7 makes the 9:16 image.
- Every button checked in Chrome: finishes, wardrobe handle, Top/Bottom/Feet/Full/Remix, wear and unwear, Body/Sleeves, locked and Look closer tiles, Piece variants, Wear it, Read the story, Learn/Levels/back (390 px), Up close back, Show me, tap to find, CTA in both states, Share both paths, unknown `?card` and non-splat `?id`. No console errors.

### Up close: Look closer on MoMu splats (branch basil/splats)
- `mockups/up-close.html`: a MoMu Gaussian splat (three 0.180.0 + Spark 2.4.0) with a detail hunt. Each detail quotes the record's `dcterms:description` (verbatim, checked by script; an ellipsis marks a cut) with our English marked as translation. Tap it on the scan, or "Show me" turns the camera to it. All found unlocks the piece's fabric for Remix.
- Two splat pieces in `pieces.json`: ST2435 (1920-1925) and ST652/1 (1940-1945), new slot `study`, `assets.splat`, `details[].at` as fractions of the scan's bounding box (placed by hand in Chrome).
- `second-skin.html`: `?card=<splat id>` opens Up close; Remix lists splat fabrics (locked, "Look closer", or won); `?fabric=<id>` wears a won fabric on the body. Progress lives in localStorage `secondSkin.found.v1`.
- Swatches for both (`make_swatches.py` POINT); `batch_glb.py` skips pieces without a GLB so no GPU run is spent on a splat piece.
- Decision: a separate page on three 0.180 instead of upgrading the main page from 0.169, so the 7 GLB scans are not put at risk before the demo. Splat pieces are studied, not worn (their scans include MoMu's own form), and win their fabric instead (D2: learning unlocks).
- `.sog` for both pieces via `splat-transform` 3.10.3 in `tools/node/` (220 MB `.ply` to 17 MB, same bounds and detail in Chrome); committed, since each is under GitHub's 50 MB warning.
- Verified in Chrome at 1433 px and 390 px: card scan redirect, miss tap, tap-to-find, Show me on the back belt, Wear its fabric, look name "Jak in Polka-dot", Remix tile states, no console errors.

### MoMu Gaussian splats downloaded
- 9 standard `.ply` splats extracted to `splats/` (git-ignored, with `*.zip`); the zip moved to `_to_delete/`. Each piece is matched to its record in `HANDOVER.md`.
- `mockups/splat-viewer.html`: local viewer (three 0.180.0 + Spark 2.4.0) for `splats/`; serve the project root on 8766. Checked in Chrome: MOMU-1, 2, 3 render with no console errors, each about 0.9 to 1 M splats, every capture includes MoMu's dress form.
- Decision: keep splats out of git (about 220 MB each, over GitHub's 100 MB file limit).

### Two-person setup: AGENTS.md, ARCHITECTURE.md
- `AGENTS.md` is now the entry file for every agent and both people (setup, ticket claims, branch per ticket, PR review, one branch on `second-skin.html` at a time, handover at session end); `CLAUDE.md` imports it and keeps Claude-only notes.
- `ARCHITECTURE.md` maps the DB, the 3D pipeline and the mockup, and lists the invariants that break silently.
- `requirements.txt` (pip freeze of `.venv`), `.env.example`, and relative paths in `.mcp.json` so a second machine can set up without this laptop's paths.
- `AGENTS.md` points to the ledger's Change policy and no longer claims a demo flow in `HANDOVER.md` (none is written yet); the handover's single-owner rule now covers both people.
- Decision: tool-neutral `AGENTS.md` over a Claude-only file because the second person's agents may not be Claude; deploys stay with Mubasil because the Vercel project is on Mubasil's account.

### Git repo on GitHub
- Project is now a private repo, github.com/mmubasil123/momu-collection-db, pushed with the personal `mubasil123_github` SSH key (repo-local `core.sshCommand`), never the GitLab key.
- `.gitignore` keeps out `.env`, `.venv/`, `cache/`, `_to_delete/`, `tools/craft/` binaries and the `.dmg`: secrets, reproducible downloads and files over GitHub's 100 MB limit.

### Single full-screen phone app
- On screens up to 600 px wide the page is now one full-screen app: one screen at a time (`body[data-screen]`),
  no page scroll, safe-area insets for notches, `viewport-fit=cover`, theme colour and home-screen meta tags.
  Wider screens keep the side-by-side pitch layout. Why: the deployed site showed the three mock phones stacked.
- Navigation: Stage top bar "Learn" opens the kimono page; its back button returns; "Levels" opens the knowledge
  track (back returns to the piece); "Wear it" puts the kimono on the form and returns to the Stage.
- The phone turntable fills the space between the look credit and the peeking wardrobe, and the camera now frames
  the floor to just above the neck (fov 19, was 22), so the form is larger everywhere. At half the phone form
  scales to 0.5 so all of it sits above the sheet.
- Tested in a 390 x 844 frame in Chrome (no page scroll, nav both ways, remix at half, console clean); the browser
  window itself would not resize, so a real phone check is still due.
- Deployed as a **preview** (`target: null`):
  https://second-skin-ar90y2hhq-mmubasilbokhari-6857s-projects.vercel.app. Production
  (https://second-skin-ten.vercel.app) still serves the earlier build.

### Vercel deploy (E3)
- Deployed `mockups/` as a static site to the Vercel project `second-skin` (team mmubasilbokhari-6857s-projects),
  on the owner's request for a preview. **It went out as production**: on a project with no git connection the CLI
  made the first `vercel deploy` a production deploy. Live and public at https://second-skin-ten.vercel.app
  (deployment `dpl_62q4AA6PLHaTF1zpVhH1WHKarbGm`). Next deploys: `npx vercel deploy` from `mockups/` now creates
  previews; check `target` in `npx vercel inspect <url>` before sharing.
- `mockups/.vercelignore` keeps the pipeline (`tools/`), source photos and cutouts (`assets/src/`), trace files and
  the schema out; verified 404 on all of them. `mockups/vercel.json` rewrites `/` to the page and caches `/assets/`
  for a day. GLBs are served as stored (about 2 MB each; A5 will shrink them).
- Checked in Chrome on the live URL: pieces load, one canvas on the Stage, console clean. The page is still the
  multi-phone presentation layout, not a single full-screen phone app.

### Bottom-sheet wardrobe (B3, B4)
- The Locker screen is gone: the wardrobe is a bottom sheet on the Stage with three snap points (peek 124 px with
  title and chips, half 48%, full 88%), 420 ms on the iOS sheet curve. Why: choosing pieces on a separate screen
  shrank the form to a 116 px preview, and the second turntable was a second WebGL context.
- Drag the handle area: under 6 px stays a tap (chips still work), a flick over 0.11 px/ms moves one snap, past
  fully open the sheet resists at 0.3x. Tapping the handle toggles peek and half; choosing a chip from peek opens it.
- At half and full the form steps back (scale 0.6) and the credit lines fade, so the form stays fully visible
  above the sheet. Reduced motion: no slide.
- "Share look" moved to the top bar as a 44 px pill (the share card itself is B7). Screens renumbered: Stage,
  Piece, Knowledge track.
- Tested in Chrome with synthetic pointer drags and taps; a real phone touch test is still to do.

### Team review and first demo tickets
- **Six-agent review** (product lead, collection and narrative, fabric facts, architecture, avatar, phone UI)
  consolidated into `LEDGER.md`, then cut for the hackathon by a product-owner agent. Decisions D1 to D8 there.
- **Why these 8 pieces:** they are exactly the 8 garments in MoMu item set 413025 "All Hackathon Assets (objects)".
  The DB holds 2075 ST objects with an image and 87 garments linked to pattern records, so a 20-piece season
  ("Fibres and Hands, 1750 to 2009") is possible (shortlist in `LEDGER.md`).
- **Avatar decision:** dress form for the demo (rigid scans were shot on forms and clip on a human body); a stylised
  CC0 mannequin and CLO's avatar are later tickets. A bigger AI model would not help: rigid scans need fitting,
  cloth simulation or CLO.
- **A1 manifest.** `mockups/pieces.json` with `pieces.schema.json` is now the single source of truth: typed `slot`,
  `year`, `assets.glb.kind` (`scan` or `clo`), `units`, `origin`, fit hints and `pipeline.cutout`. The page fetches
  it; `batch_glb.py` and `make_swatches.py` read it. Removed the HTML regex, `NO_CUTOUT` and the name-parsing `yearOf`.
  Why: CLO pieces need typed fields, and teammates should edit data, not code.
- **C3 card scan:** `?card=<inventory id>` unlocks the piece, puts it on the form and toasts "Found in the museum".
  Unknown or malformed ids are ignored.
- **C6 save:** the look and widest span persist in localStorage (`secondSkin.save.v1`); restored ids are checked
  against the manifest because storage is user-controlled.
- **UI quick wins:** removed the two unlabeled "+" buttons and the live degree readout; skin tones became dress-form
  finishes (linen, calico, black jersey, oak); 44 px hit areas for finishes, chips and the back button.
- Vercel CLI is signed in; nothing is deployed (owner's go needed).

### Fixes from the user's screenshot (I had signed off too early)
- **Removed the 2D plinth** under both turntables: the 3D scene has its own base and shadow, and the leftover box
  read as an empty input field.
- **Trousers reach the base.** Bottoms are now sized by length, waist to 4 cm above the base (`floor`), with width
  only as a cap. Width-based fit left the wide monpe at mid-calf, floating.
- **Pattern scans readable.** They are under 1% light-grey pencil on white, so CSS contrast washed them out. An SVG
  gamma-10 filter (`#ink`) keeps the paper white and pulls the pencil dark, on the hero and the thumbnails.
- **Dressing-order render.** Feet, then bottoms, then tops each draw over a cleared depth buffer (`LAYER`). Rigid
  scans never nest, so plain depth let the monpe's waist ties poke through the jak.
- Known: the jak cutout kept a cream patch of mannequin inside its front opening and a gold sliver at its side.

### Mannequin-free scans
- Regenerated the coat (ST2434), trousers (ST80931), vest (ST80930) and dress (ST655/1) from garment-only
  cutouts, on the user's second Hugging Face account (their MoMu research account, for this MoMu project).
  Why: the old scans carried wooden mannequin arms and hands ("4 hands") and the dress's grey neck form.
  Checked in Chrome: coat, vest and dress show no mannequin parts. Old GLBs are in `_to_delete/`.
- Still to redo: the kimono without its stand (`hideStand` shortcut stays until then).

### Motion, game, docs (night)
- **Calmer turn.** Idle spin 72 -> 22 degrees a second (one turn in about 16 s), easing up to speed after a drag.
  Why: the user did not like the animation; a full turn every 5 s read as restless.
- **Pieces settle in.** A newly loaded garment drops 4 cm onto the form and scales from 97% over 360 ms, instead
  of popping in.
- **Light.** ACES filmic tone mapping (pale silks no longer clip), a back rim light to separate dark cloth from the
  wall, and a soft contact shadow under the base.
- **Look names.** A remixed look gets a title from its pieces ("Jak in Furisode, with Ikat sleeves").
- **Firsts.** One-time toasts: first remix, two fabrics in one look, a century apart, two centuries. Why: tiny,
  demoable rewards for range and curiosity; deliberately no streaks, timers or counts of time spent. The opening
  look earns nothing, so the visitor's first change can.
- **Docs.** `README.md`, project `CLAUDE.md`, `HANDOVER.md`; row added to the personal `AGENTS.md` registry.
- **GPU quota facts** (community reports, unverified): free ZeroGPU is a few minutes a day, refilling about 24 h
  after first use; each TRELLIS run requests 120 s. Extra accounts to dodge it are against the terms; PRO is the fix.

### Two-zone fabric mixing
- **Body and Sleeves** toggle in the Remix tab: each zone takes its own fabric (or stays original).
  Decision: split in the shader by distance from the garment's centre line (`uSplit`, half the scan's width) and
  above a cuff height (`uSleeveY`, default 40% of the scan's height). Why: TRELLIS scans have no labelled regions,
  and sleeves are the classic contrast zone. The seam is soft (smoothstep), not a hard cut.
- `sleeveTo: 0.6` on the jak: its elbow sleeves end high and its skirt flares wider than the split, so without it
  the hips took the sleeve fabric.
- Known limit: on a coat the outer edges of the front panels can fall in the sleeve zone. Real panels need CLO.

### Remix across time
- **Fabric remix (Locker > Remix tab).** Any unlocked piece's cloth can be worn as your top or full look.
  Why: Fortnite-style self-expression, so every visitor's look is unique.
  Decision: project the swatch in object space with a triplanar shader and multiply by the scan's own brightness.
  TRELLIS UVs are 234 to 368 scattered islands per garment, so a swatch on the UVs comes out chopped. Projection keeps
  the scan's folds and shading. True per-panel fabrics need CLO pattern pieces (later).
- **Swatches** (`mockups/tools/make_swatches.py`, `assets/swatch/*.jpg`): 512 px tiles cropped from the garment
  cutouts on a side panel. Why: centre front carries buttons and openings (the coat, dress and jak crops showed them).
  The kimono and boots use a hand-picked point because segformer misses them.
- **Time-span game.** The Stage credit line shows how many years the look spans and your widest so far.
  Why: one tiny, honest mechanic for the evening demo ("who can build the look that spans the most centuries?")
  that teaches dates without streaks or timers.
- **Piece page thumbnails.** Pattern thumbnails zoom into the scan's labelled top-left corner (red MoMu header); the 3D tile shows the kimono
  cutout with a badge. Why: the scans are tall sheets of hairline pencil, so a centre crop read as an empty tile.
  A contrast filter (washed out to white) and a top-edge crop (still near-empty) were tried first.

### Engine fixes from the architecture review
- Fixed a crash this session introduced: an empty slot with nothing worn compared `undefined === undefined` and
  read `.obj` of nothing, stopping the whole page script.
- Vertex normals computed on load: TRELLIS GLBs ship none, so they rendered faceted.
- Spin speed uses elapsed time: per-frame steps doubled the speed on 120 Hz screens.
- Pixel ratio capped at 2 and zero-size elements skipped: 3x phones and hidden tabs.
- Turntables stop rendering when scrolled off screen (IntersectionObserver).
- A failed GLB load is dropped from the cache so it can retry; errors are logged with their real cause.
- The form's torso hides only once a top has loaded, not as soon as one is chosen.
- The stand-hiding cutoff moved into the shared garment shader at 0.03 linear (the stand's near-black), below any
  fabric's darkest dye. It only applies to pieces flagged `hideStand` (the kimono).
- Pipeline: `garment_mask` raises instead of exiting, so one empty mask no longer kills the batch; GLB and photo
  downloads are written to `.tmp` and renamed, so a crash cannot leave a truncated file that later runs skip.
- Not taken (yet): one shared WebGL context for both turntables, a `pieces.json` manifest, percentile-based fit,
  a metric "no rescale" mode for CLO drapes. Recorded in `TICKETS.md` territory; worth doing past the hackathon.
- Rejected: the review's "remix needs CLO UVs" verdict. Object-space projection does not use UVs.

### Dress-form engine (TICKETS T1 to T6)
- **One three.js scene with a dress form**, replacing the drawn 2D figure and per-slot `<model-viewer>` boxes.
  Why: separate boxes could not hide each other or the body, so stands and skin showed through ("everything over
  each other"). Dress form because every MoMu photo is shot on one, so scans match its pose.
- **Two-pass render** (form, clear depth, garments): rigid scans never line up with the form, so the form must never
  show through a garment.
- **Torso hidden under a top or full look**, neck kept: scan shoulders rarely match the form's (the dress showed
  the form beside its collar).
- **Auto-fit by slot** from each GLB's bounding box (width-based; shoes by their longest side). Why: TRELLIS
  normalises every model to about 1 unit, so real size is lost; hand-set boxes did not scale to more pieces.
- **Garment-only cutouts** before TRELLIS (local segformer in the project `.venv`, about 1 GB). Why: scans carried
  neck forms, wooden arms and stands. Local because the HF Read token cannot call Inference Providers (403).
  Shoes and the kimono skip it: the model is trained on people and drops them.
- **Kimono stand** hidden in the shader (`hideStand`): a shortcut until the scan can be redone without the stand.

### 3D pipeline
- **TRELLIS via the public Hugging Face Space** (`img2glb.py`, `batch_glb.py`) for real 3D from one museum photo.
  Why: CLO needs pattern files and a licence on another machine; TRELLIS works now. Each GLB is generated once and
  stored in `mockups/assets/`; the page only loads local files. The GPU quota is spent only when (re)generating.
- **CLO path kept open**: the CLO MCP candidate is `Lilbonner/clo3d-mcp` (MIT); `gregor124/clo-mcp` is a stub.
  WeTransfer is blocked on this work laptop, so CLO goes on a personal machine.

## 2026-11-20
- **Kimono cutout** (VectorCraft): deleted 123 backdrop and stand shapes from the trace, exported
  `ST80881_cutout.svg` and a 4x transparent PNG. A beige backing fills the stand's slit (invented, not traced).
- **Fabric swatches at native resolution**: the old 60 px tile was upscaled about 1.4x on retina and blurred;
  the jak's sample point moved off a white background corner.
