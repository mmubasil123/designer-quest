# Changelog: Second Skin mockup

Newest first. Each entry: what changed, why, and the decision behind it.

## 2026-11-21

### C2 quiz: one question per piece wins its fabric (branch hassan/C2)
- **What:** `mockups/questions.json` holds one multiple-choice question for each of 3 demo pieces: ST503 jak (place), ST80931 monpe trousers (date), ST2407/1-2 Bikkembergs boots (material). `mockups/quiz.js` + `quiz.css` show it as a sheet; `second-skin.html` only imports it and has five small hooks (save, restore, Remix tiles, `act`, card scan).
- **Flow:** a card scan (`?card=<id>`) wears the piece and opens its question. Right: "MoMu records its place as Netherlands", the record's description quote with our translation, and the fabric unlocks ("Try the fabric" puts it on the body). Wrong: the right answer shows gently, the piece stays in the wardrobe, the fabric stays locked; scanning the card again gives another go. In Remix, a locked fabric is a grey tile ("Answer its question" or "Scan its card again"); tapping it asks the question (or says to scan again). A right answer is never asked again. No score, timer or streak (D2); study pieces keep their find-3-details question.
- **Facts (D3):** every answer and option is a verbatim value of the field in `records.json`; distractors are the same field from other records. `python3 -I mockups/tools/questions_check.py --cache <harvest cache>` checks this, traces each answer to the raw record in `cache/`, and fails if a prompt gives the answer away. The reveal adds no prose of its own: field value plus the record's description. Question text is marked `draft: true` until the curator rewrites and approves it.
- **Save:** optional `quiz` field in `secondSkin.save.v1`, `{ "<id>": "right" | "wrong" }`, validated on load. Old saves without it load as before (heads-up to Mubasil in the PR, per the change policy). A restored remix fabric must also be unlocked.
- **Checked:** in Chrome (window 570 px, the narrowest it goes here) and at 390 x 844 in the app browser: right and wrong for all 3 pieces, retry by re-scan, no re-ask after right, reload keeps state, console clean.
- **Seen, not fixed (pre-existing):** with the sheet at half height the Remix grid squeezes its rows to about 110 px while tiles stay 230 px tall, so tiles overlap; it happens with or without the quiz classes.

### Garment colours: scans were rendering as solid metal (branch basil/fix-garment-colors)
Basil's phone showed the cocktail dress near black and brown with a mirror-like sheen, while its photo is green and black stripes.
- **Root cause:** the TRELLIS GLBs write a material with a base colour texture and `roughnessFactor` but no `metallicFactor`, and the glTF default for that is 1. Every wearable loaded as solid metal. Metal has no diffuse colour, only reflections, so cloth went dark with a glossy sheen; the room environment added in the Turntable only hid the worst of it. This is in our loader code, not in the GLBs.
- **Fix:** `prepGarment` sets `metalness = 0` on every scan material. No change to lights, exposure or tone mapping: a sweep of ACES, Khronos Neutral and none at several exposures against the photos found the current ACES 1.1 settings fit best once the metal was gone.
- **Evidence (headless Chromium, garment alone, mean sRGB over its pixels, against the mean of its garment cutout photo):** cocktail dress 13,11,8 before, 59,57,53 after, photo 60,60,53. Monpe trousers 8,13,19 before, 52,59,66 after, photo 56,58,64. Top ST80930 18,22,27 before, 68,72,79 after, photo 58,59,66. Green coat ST2434 27,35,14 before, 78,89,59 after, photo 68,81,49. Jak ST503 70,82,79 before, 134,146,143 after, photo 97,110,113 (still about 1.3x too bright). Kimono 172,149,124 before, 213,194,175 after, photo 195,163,140. Side by side for all 7 wearables: `docs/color-check/before-after.jpg`.
- **What this does not fix:** the cocktail dress texture itself is browner and less green than its photo (TRELLIS lost the green in the bake), so it now renders dark olive-brown, not striped green. That needs a regenerated GLB, which costs GPU quota, so it is not done here. The kimono's rescan without its stand is ticket T11.
- **Study (splat) pieces:** they do not use this material, so this bug cannot affect them. I could not render them here (software WebGL stalls on the 17 MB scans), so their colours are not checked against the photos; that needs your phone.

### Faster loading, study preload and avatar zoom (branch basil/load-and-zoom, on top of basil/onboarding)
Raised by Basil after a phone test: 3D scans take about 10 s, and the main avatar is also slow.

**What the boot was doing (measured in headless Chromium, local files only; jsDelivr, Google Fonts and heron.libis.be are blocked from the cloud container, so their timings are unmeasured):**
- At first paint the page requested the three default GLBs (2.0 + 1.7 + 2.1 MB, all at once, sharing the connection), plus `pieces.json`, `records.json`, the `ST80881_cutout.png` (243 KB), up to 8 full-size photos from heron.libis.be (the three Piece-page variants, which sit on a screen nobody is looking at, plus tile photos) and the whole model-viewer library from jsDelivr (never used until the Piece page).
- The splat pages are a separate load: one 15 to 17.6 MB `.sog` per piece, plus a fresh three 0.180 and Spark from jsDelivr, a HEAD request before the real one, and nothing fetched ahead. So the 10 s scan load and the slow avatar are two different downloads that only share the phone's connection; they do not block each other.
- Neither GLBs nor `.sog` files are compressed beyond what the pipeline gave them (A5, meshopt and webp, is open and is the team's ticket). Production caches `/assets` for one day.

**Changes:**
- Piece-page photos, the cutout and the model-viewer library now load on the first visit to the Piece screen (`enterPiece`). Tile and wearing-row photos decode async. `records.json` no longer blocks anything: the fact card waits for it.
- Background warm-up: once the first look is on the form, the other wearable GLBs are fetched at low priority, one at a time, streamed and dropped (nothing parsed, nothing held in memory), so wardrobe taps find them in the HTTP cache. Skipped on Save-Data and on 2g/3g.
- Study preload: tapping a study tile that still needs its card starts the `.sog` download and `modulepreload` hints for Up close's OrbitControls and Spark. The popup shows "Getting the scan ready… n%", then "Scan ready". Not now, Escape or a backdrop tap aborts the fetch and removes the hints. Tapping Simulate NFC tap navigates, and a navigation cancels a download still in flight, so a visitor who taps before it finishes gets a partial head start only.
- `up-close.html`: the HEAD request is only made on a dev machine; the deployed site always has the `.sog`.
- Zoom on the main avatar: pinch, mouse wheel and trackpad pinch, plus + and − buttons (44 px, hidden while the wardrobe is open). 1x to 3x, zooms toward the fingers or cursor, a vertical drag moves the view when zoomed, and the view is clamped to the form's height. Opening the wardrobe resets to 1x. The turntable is now `touch-action: none`, so on a phone a pinch or drag on the avatar never scrolls the page.
- Checked in headless Chromium at 390 px: boot requests, warm-up skipping loaded pieces, wheel clamps (1x to 3x), buttons, synthetic two-pointer pinch, study preload progress, abort on Not now with the hints removed, console clean. Not checked on a real phone, with a real two-finger pinch, or on real mobile bandwidth.
- Decision: no change to file formats here. The biggest remaining lever is file size (A5 for GLBs, and a smaller `.sog` for the splats), which needs the pipeline and the raw captures on Basil's or the team's machine.

### Onboarding help pop-up and help button (branch basil/onboarding; Notion task "Onboarding help pop-up (with skip) + help button", no ledger ticket)
- A three-step card (dress the form, remix a fabric, read the record) opens once on a first visit with Next and Skip; the last step's button is "Start dressing". A "?" button in the top bar (44 px) reopens it any time. The backdrop and Escape close it.
- It does not open for a visitor who arrived by a museum card (`?card=`) or back from Up close (`?fabric=`), so it never covers their toast. Seen state is `secondSkin.help.v1` in localStorage; if storage is blocked it shows each visit.
- Why: the Ideation page lists "first-time help pop-up with a skip button" and a help button as UX must-haves. The copy only describes what the app does today and makes no claim about MoMu facts (D3).
- Checked in headless Chromium at 390 px: opens on first visit, steps through, closes on Start, stays closed on reload, "?" reopens at step 1, Skip closes, no popup on a `?card=ST503` arrival, no horizontal overflow, console clean. Not checked on a real phone or with a screen reader.

### Team notes and storyline (branch hassan/docs-storyline)
- New `docs/PROJECT_NOTES.md`: problem statement, Lotus Blossom outcomes, the visitor flow with what is built,
  team decisions, roles for all four of us, open questions.
- New `presentation/STORYLINE.md`: one-line pitch, persona, 7-beat story arc, demo script mapped to what works
  today, demo pieces from `pieces.json`, jury questions.
- README layout table and the Delivery line in `AGENTS.md` now point to both.
- Why: the idea and the pitch lived only on paper and in Notion; everyone (and every agent) needs one place to
  refer back to. Decision: facts on stage stay placeholders (`[fact: ...]`) until filled from the record (D3).
  The ideation's optional selfie and sign-up conflict with D1 and D2; recorded as an open team decision, not
  changed in the ledger.

### A6: phone memory (branch basil/A6)
- GLB cache is now an LRU of 8 parsed scans: the oldest one not on the form is disposed (geometry, textures, material) after each load. Before, every piece ever worn stayed in GPU memory for the session.
- The idle spin stops when the tab is hidden or the Stage is off screen (Piece screen), and restarts on return; before it kept running a loop that rendered nothing. Reduced motion still never spins.
- Pixel ratio cap 2 to 1.5: 44% fewer pixels at 3x phones, not visible on a scan at Stage size.
- Checked in headless Chromium at 390 px with three from npm (the cloud container cannot reach jsDelivr): cycling all 7 GLBs, a cap of 2 left 20 geometries and 6 textures on the GPU against 24 and 10 with no cap, the worn look intact, spin pausing on a hidden tab and resuming, no page errors. Not yet checked on a real phone: that is still the A6 acceptance (30 swaps, heap within 20%).
- Decision: render-on-demand is only partly done. The idle spin is the one thing that needs frames, so it was gated rather than the whole loop rewritten; a still Stage with reduced motion already draws nothing.

### Wardrobe: see and take off what is worn; C1 fact cards (branch basil/c1-wardrobe)
- A "Wearing" row in the sheet's peek lists the top, bottom, feet (or full look) and the body and sleeve fabrics, each with a thumbnail, name and ×. Tapping a chip opens that category; × takes it off. A worn tile tapped again also takes it off (before, top, bottom and feet could only be replaced). Tiles show short names instead of inventory ids; the id line under the look name went, since the row says the same.
- Picking a fabric with no top or full look used to change nothing visible (and still fired the First remix toast): Remix now says to put a top on first, and a pick sends you to Tops.
- C1: every tile has an ⓘ that opens a fact card: materials and techniques, date and place, the record's first description sentence in Dutch with our English translation, up to two "also in" material links to other pieces' cards, the card's own action (Wear it, Take it off, Use on the body, Study it up close) and a link to the MoMu record. Missing fields say "not recorded" (D3).
- The card reads `mockups/records.json`, written by `mockups/tools/records.py` from the harvest cache (every value verbatim; translations are keyed to the Dutch sentence so a changed record fails the script). Five records leave their medium terms untagged; those list Dutch then English terms, each A to Z, and the script splits at the restart, checked against the tags the same terms have elsewhere.
- Checked in Chrome in a 390 px frame: wear, take off by × and by tile, Remix with and without a top, cards for top, full, remix and study pieces, card-to-card links, desktop layout; console clean.

### Splat Stage spike (ticket G1, pushed straight to main on the owner's go)
- New throwaway page `mockups/splat-stage-spike.html`: a splat dress form wearing the ST2431 cavalry jacket or ST2432 tailcoat over either uniform's trousers, with a fabric tint on the top. Parts come from `mockups/tools/splat_spike_cut.py` (rules for these two scans only) into `mockups/assets/splat/spike/` (12 MB for all 7 parts).
- Why: the owner picked approach A (all-splat Stage with mixed parts); the spike tests cut quality, fit and fabric on splats before any engine work.
- Decisions: hands ship with their top (the form's arms were posed differently per capture); garment parts at 30% splats and SH 1 (looked the same as full at Stage distance, a look drops from 16 MB to under 7 MB); the dye keeps luminance and skips cream so the form stays undyed; parts are added and removed because Spark ignores `visible`.
- Checked in Chrome: all four pairings front, side and back, tint switching, console clean. Not checked on a phone.

### NFC popup: Simulate NFC tap
- The popup's OK only closed it, so a grey Study piece was unreachable while the screens are being designed. Primary button is now "Simulate NFC tap", which opens `?card=<id>`, the same URL a real card will open; "Not now" closes.
- Checked in Chrome at 390 px: Simulate opens that piece's Up close, coming back shows it as "0 of 3 found", Not now closes.

### Levels (knowledge track) removed
- Deleted the third screen, its Levels button on the Piece page, and its CSS and JS (`STEPS`, `renderTrack`, the flip card). Piece page footer is now one "Wear it" button.
- Why: it was kimono-only, its two stories were not quoted from the MoMu record (D3), and its "Rebuilt in CLO 3D" step was never built. Up close now does the learning for 9 pieces with record quotes. Decision by the owner.
- Checked in Chrome: desktop shows Stage and Piece; at 390 px Learn, Piece 3D (model-viewer kimono), Back and Wear it work with no horizontal scroll.

### NFC placeholder popup on grey Study tiles (branch basil/nfc-popup)
- Tapping a Study piece whose card hasn't been scanned opens a popup: "Find it in the museum. Hold your phone to the NFC card beside the <piece> to study it up close." OK, the backdrop or Escape close it.
- Why: the demo will use NFC cards (each opens `?card=<id>`), but they don't exist yet while the pages are designed; a grey tile that did nothing read as broken. Native `<dialog>` for focus and Escape handling; fades and scales in over 200 ms, opacity only under reduced motion.
- Checked in Chrome at 390 px: centred, text per piece, OK, backdrop and Escape close it, a tap inside does not.

### AGENTS.md: splat setup and rules
- First-time setup now says where the raw splats come from and how to install `splat-transform` in `tools/node/`; Rules say to commit only `.sog`, quote records verbatim and place details with `fracAt`. Why: the second person's agents had no way to learn this from the entry file.

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
