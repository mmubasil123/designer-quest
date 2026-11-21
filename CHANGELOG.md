# Changelog: Second Skin mockup

Newest first. Each entry: what changed, why, and the decision behind it.

## 2026-11-21

### H3 Story screen with narration (branch hassan/story-narration)
- **What:** after a card scan the piece's story comes first, on its own sheet: name, years as a large serif number, a play/pause button (48 px) with progress and time, the transcript always on screen, then **Continue to the questions** (the curator's questions, no longer repeating the story) or straight back to the form / Up close when the piece has no questions. Audio never autoplays and downloads only on the first tap (`preload="none"`). Same sheet style as the quiz; reduced-motion safe.
- **Text, one source:** `tools/narration.py` writes `narration.json` (a derived file) from the curator's stories in `questions.json` (her text wins, as written) and, for pieces she has not written yet, a **draft built only from the MoMu record** (`records.json`: date, place, the record's description in our English translation, materials and techniques). Drafts say on screen "Draft built only from the MoMu record; the curator's story is still to come" (D3). Nothing is added from model memory.
- **Narration:** pre-generated at build time with Google Gemini TTS (`gemini-3.8-flash-tts`, voice Sulafat) using the existing Gemini key (`GEMINI_API_KEY` in `.env`, same key as `ASK_API_KEY`); mono AAC 48 kbps `.m4a` via macOS `afconvert`, in `assets/audio/<id>.en.m4a`. Each file carries a hash of model + voice + text, so a rerun only regenerates changed stories; `--check` fails when text changed since the audio was made. `--lang` is ready for NL/FR once translated text exists. Checked one file by transcribing it back: the voice reads the curator's text word for word and does not speak the style instruction.
- **Offline:** playback needs no API, so it works on bad venue wifi; only museum text is sent to the TTS, at build time.
- **Fallback:** a missing or broken audio file switches the button to the phone's own voice (`speechSynthesis`, labelled "Read by your phone's built-in voice"); with neither, the player is hidden and the transcript stays.
- **Also fixed:** `tools/questions_sync.py` read the curator's new "2. Blouse" heading (dot instead of colon) as part of the jacket, so ST81190 would have got the blouse story. Headings now accept both, and "Story:" with a colon. Re-synced her page: ST81190 has her latest wording ("snap buttons", "breast pieces", "their designs"). Her Blouse and Trousers entries are skipped: neither is a piece in the app yet.
- **Hook:** `second-skin.html` only loads `story.css`, imports `story.js` and calls `showScan()` at the two card-scan spots (3 changed lines). `quiz.show()` takes `story: false`.
- **Decision:** a separate story step before the questions (flow step 3, "narration, heritage bit"), with the audio built ahead of time instead of live TTS: no key in the browser, no runtime cost, no wifi risk.
### E1 Presentation deck: 6 slides for a 5 to 6 minute talk (branch basil/E1)
- **What:** `presentation/TEAM C BLANCO_MoMu Hackathon presentation.pptx`, built on the MoMu template the team saved: QR code to https://second-skin-ten.vercel.app with the team names, concept, live demo beats (scan, wear, learn, remix, share), how it works, what is next (CLO), thank you. Every slide has speaker notes with a time budget (5:40 in total) and a `[presenter]` placeholder.
- **Facts:** piece names and dates come from `pieces.json`; collection counts from `README.md`. No roles are given because the repo records none.
- **Tooling:** the QR is made with `segno` (pinned in `requirements.txt`) and checked to decode to the exact URL.
- **Decision:** a pptx on the museum's template over the Markdown outline the ticket named, because the talk is given from PowerPoint; the template's palette (black, red D72F25, Arial) wins over the mockup's cream and Newsreader.

### Demo avatar on the Stage, presenter only (branch basil/A9-live-avatar)
- **What:** opening the app with `?demo` shows an "Avatar" button beside the form finishes. It swaps the dress form for
  Basil's own avatar (`mockups/assets/avatar/demo.glb`, a MetaPerson export, used with his consent) and refits every worn
  piece to it. Without `?demo` nothing changes and the file is never downloaded.
- **How the fit works** (new `mockups/avatar-body.js`, tuned in `avatar-lab.html`): the slot boxes are scaled from the
  avatar's measured shoulder line and deltoid width (capped at 1.3x the form); the arms hang at the angle of the worn
  top's sleeves (presets in `AVATAR_FIT`); cloth inside the body is pushed out along its normal; boots are split and put
  one per foot; the baked dress-form neck in the jak, ikat vest and coat is cut on a person; the avatar's own clothes are
  hidden once top, legs and feet are all covered. The rig steps back to 85% so the head fits the frame.
- **Shader:** garments now read their object-space position from a copy of the scan's vertices (`aObj`), so the remix
  fabric and the neck cut stay put when conform moves the cloth. Dress-form rendering is unchanged.
- **Decision:** presenter-only behind `?demo`, no selfie flow and no MetaPerson keys in production (GDPR, and the setup
  takes minutes). Basil chose to commit the avatar file to the repo.
- **One look on the avatar:** switching to the avatar puts on the furisode kimono (ST80881) and football boots
  (ST2407/1-2) and switching back restores the form's look. Checked every wearable piece on the avatar: the rigid scans
  cannot drape, so the jak and coat show the avatar's T-shirt, the monpe hangs off the hip and the knee breeches vanish
  under its jeans. Only this pair reads as worn from front, side and back. The wardrobe still works; the presenter keeps
  to this look. Real fitting stays with CLO (A7).
- **Skin tone:** the Stage light is tuned for dark museum cloth and washed the avatar's skin out. Its body and head
  materials now get half the environment light and 80% colour; garments are unchanged.

### B7 Share card: the look as a 1080x1920 PNG, shared or downloaded (branch hassan/B7)
- **What:** **Share look** now opens a preview of a 9:16 card with two actions: **Share** (Web Share API with the PNG file, shown only where `navigator.canShare({files})` is true, i.e. most phones) and **Download image** (always there, the main action on a laptop). The card shows the look name (existing `lookName()`, "My look" when unremixed), "Worn across N years" with the oldest to newest year, the form still, every piece worn with its inventory id and years (cloth and sleeve remixes included), the credit "Collection: MoMu Fashion Museum Antwerp" and the app URL.
- **How:** logic in `mockups/share.js`, styles in `share.css`; `second-skin.html` only imports it and wires the button (replaces the old text-only share). The still is an extra frame from the Stage's own WebGL renderer at card width (zoom 1, current angle, transparent), copied to a 2D canvas in the same task, then the renderer is restored; no `preserveDrawingBuffer`. The form takes whatever height the title and piece list leave, so short looks get a bigger form.
- **Facts (D3):** names, ids and years come from `pieces.json` only; a missing year prints "not recorded". The span counts the same pieces as the Stage's "Spans N years" line.
- **Privacy (D2):** the PNG is built in the browser and handed to the share sheet or a download; no upload, server, analytics or storage.
- **Design:** warm paper and the Stage's wall gradient, Newsreader for name and span (a sentence, not a stat tile), IBM Plex Mono for ids and years only, hairline list like a museum label. Sheet is a dialog like the quiz, 44 px targets, reduced-motion safe.
- **Checked:** Chrome, top+bottom+feet look and a full look with remixed cloth and sleeves: PNG decodes as exactly 1080x1920, text readable, console clean. Not yet tried on a real phone share sheet.
### B9 MoMu theme: the app now looks like the museum (branch hassan/B9-momu-theme)
- **What:** a new `mockups/theme.css` holds the whole look as tokens (colour, type, radius, shadow, motion) plus the component skin. `second-skin.html` links it after its own style block; `quiz.css`, `ask.css` and `up-close.html` read the same tokens. No flow, layout or engine change.
- **Reference:** momu.be, read in the browser on 2026-11-21 (the "MoMu design folder" from the kit was not at hand; if it turns up it overrides this). The site is white and black with one signal red (`#e32118`), a grotesque for the interface (Roobert), a serif for titles (Reckless), white pill buttons floating on a soft offset shadow, sharp-cornered pictures, hairline rules, dot-and-capitals section labels, and red underlines on links.
- **Palette:** paper and sheets `#fff`, gallery grey `#ededed` behind photos and the form (photos still multiply onto it), ink `#000`, muted `#595959` (7:1 on white), hairline `#cbcbcb`, accent `#e32118` for underlines, the found-count dot and pins; `#c4170d` where the red carries white text (5.9:1). The cream and beige are gone.
- **Type:** Hanken Grotesk stands in for Roobert and Source Serif 4 for Reckless. Both MoMu faces are commercial, so neither is copied; both stand-ins are SIL OFL and self-hosted in `mockups/assets/fonts/` (latin subset, 284 KB, licences beside them). Inter, Newsreader and IBM Plex Mono are dropped, and with them the Google Fonts request (no visitor IP goes to Google). Scale: 11 label, 13 small, 15 body, 17 quote, 22, 28 and 32 px titles. Ids and counts are plain small sans, not mono.
- **Hierarchy:** on the fact card, the story sheet, Ask and Up close the piece's name now leads and its id follows (it sat above as a label). The look name is 32 px serif. Dialog titles are `h2` and "Look closer" is `h3` (they skipped levels before).
- **Shape:** dialogs 6 px corners, pictures and tiles 2 px, sheets keep 20 px top corners, buttons stay pills. Tile names sit flush in the corner like a caption. Quote blocks lost their side bar; quiz questions are ruled rows, not boxes.
- **Motion (emil-design-eng):** nothing new animates. Dialogs and the Ask sheet now leave faster than they arrive (150 ms and 280 ms); curves, the 160 ms press and reduced-motion rules are unchanged.
- **Also:** the wearing chips and the "also in" links are now 44 px tall; the "3D" badge is 11 px (was 10).
- **Checked:** Chrome at 390 px: Stage (front, side, back), wardrobe sheet, Study tab, fact card, story and questions, Ask, NFC, help, Piece page, Up close. Console: only the old model-viewer "multiple three.js" warning. `impeccable detect` on the served page: no findings. Before and after screenshots are in the session notes folder, not in the repo.
- **Not done:** the span is still a text line, not a large serif number (B9 asked for it; it needs a change in `renderCredit()`, left out to keep the diff in the one shared HTML file small). No dark theme (photos need the light wall).
- **Share card:** `share.js` draws on a canvas, so it cannot read the CSS tokens; its font and colour constants now mirror `theme.css` (change both together). `share.css` reads the tokens.
- **Merge order:** rebased on B7. If A9 (PR #11) merges first, rebase this again: in `second-skin.html` it only touches the head, the font names in the style block and four heading tags.
- **Decision:** a separate stylesheet over rewriting the inline CSS, so open branches on `second-skin.html` merge cleanly and a brand guide can later be applied by editing one `:root` block.

### H2 Ask the archive: questions answered only from the piece's MoMu record (branch hassan/H2-ask-archive)
- **What:** an **Ask** button on every fact card opens a bottom sheet (wardrobe style, 44 px targets, reduced-motion safe). It offers 3 suggested questions built from the record's filled fields plus free text. Each answer shows "From the MoMu record: <field>", a verbatim quote from that field, and an "AI · AI answer, written only from the MoMu record" badge (EU AI Act transparency for chatbots). Questions the record does not cover get "That is not recorded for this piece."
- **How:** `mockups/api/ask.js` is a Vercel serverless function (`POST /api/ask {pieceId, question}`); the API key (`ANTHROPIC_API_KEY`) lives only there. It sends the Claude API one system prompt, that piece's record and the question, nothing else, and asks for JSON (`answerable`, `answer`, `fields`, `quote`). `ask-core.js` then enforces grounding in code: a field the record lacks turns the answer into "not recorded", and a quote that is not verbatim in the named field is dropped. Shared by the sheet (`ask.js`, `ask.css`), the function and the eval.
- **Records:** `tools/ask_records.py` writes `ask-records.json` from the harvest cache: the full Dutch description, maker, title, date, place, type, materials, size and the "about the maker" text, verbatim, plus the English we already had in `records.json` (marked as our translation). Provenance and acquisition fields are left out on purpose: they can name private donors (D2, data minimisation). `records.json` is unchanged.
- **Model:** Claude (`claude-haiku-5-5`, low effort) when `ANTHROPIC_API_KEY` is set. For the hackathon any OpenAI-compatible API also works through env only: `ASK_PROVIDER` (`gemini`, `openrouter`, `groq`, `mistral`, or `ASK_BASE_URL`), `ASK_API_KEY` and `ASK_MODEL`, so a free-tier key is enough. That path asks for the same JSON schema, steps down to plain JSON for models that refuse schemas, and goes through the same `checkAnswer()` guard. **Demo default: Gemini free tier, `ASK_PROVIDER=gemini`, `ASK_MODEL=gemini-3.5-flash-lite`** (median 1.1 s an answer). Switched from OpenRouter `nvidia/nemotron-3.5-super-vl:free` (median 2.8 s) because OpenRouter caps free models at 50 requests a day per account. Gemini's free limits are per Google Cloud project, reset at midnight Pacific and are shown only in AI Studio (Rate limit page); check them there before the presentation. Past any cap the sheet falls back to field answers.
- **Fallback:** with no key the function answers `{offline: true}` and the sheet answers the suggested questions straight from the fields, labelled "Straight from the record, no AI"; free text says Ask can't reach the archive. Same when the network or function is missing (python `http.server` returns 501), so the demo never breaks on venue wifi.
- **Privacy (D2):** no accounts or cookies; question text and IP are never logged or stored (errors log status and class only); questions capped at 280 characters; a per-instance cap of 30 calls a minute (no IP tracking). The sheet asks visitors to leave out personal details. The provider processes the question outside the EU (GDPR Art. 44), and free tiers may train on prompts; the team chose to accept that for the hackathon and revisit it (EU provider, paid tier, telling MoMu) before real visitors use it.
- **Eval:** `tools/ask_eval/` has 24 cases on ST81190 and ST503 (13 answerable, including two in Dutch, and 11 that must say not recorded, including outside-knowledge traps and a prompt injection). `npm run eval:ask` runs offline checks always and the model cases when a key is set, and writes `RESULTS.md` for the curator. Result on Nemotron: **25 of 25 pass**, every answered question with a verbatim quote. One case was wrong at first, not the model: it expected "not recorded" for when the label closed, but the record says "In 2020 besluiten ze hun label stop te zetten"; the case now expects that answer and a new unrecorded trap replaced it. Two other free models (Gemma 4 31B, Ling 3.2 Flash) were rate-limited and not scored. Gemini 3.5 Flash-Lite, run on a 7-case subset to spare its free quota (Dutch, translation of a detail, a fact only the record has, outside-knowledge and injection traps, a missing maker): **7 of 7 pass** (`RESULTS-gemini-3.5-flash-lite-subset.md`); `--only=` picks the subset.
- **Deploy (Mubasil):** `mockups/` now has a `package.json` (one dependency, `@anthropic-ai/sdk` 1.12.0, pinned), so Vercel installs it and builds `api/ask.js` as a function. Before deploying, set the same env as `.env` in the Vercel project `second-skin` (Settings, Environment Variables, Production and Preview): `ANTHROPIC_API_KEY`, or `ASK_PROVIDER` + `ASK_API_KEY` + `ASK_MODEL`. Without it the site still works in fallback mode. Optional: `ASK_MODEL`, `ASK_MAX_PER_MINUTE`.
- **Fixed while testing:** a double tap could send two questions at once (busy flag set after an await); the function retries once after a free-tier 429.
- **Local:** `cd mockups && npm install && npm run dev:ask` serves the page and the function on http://127.0.0.1:8768 (reads the key from the repo's `.env`); no Vercel login needed.
- **Decision:** a function in the static site's own Vercel project over a separate backend (one deploy, one domain, key server-side). Grounding is enforced twice, in the prompt and in code, because the visitor cannot check the archive themselves.

### Cocktail dress (ST655/1): texture recoloured to follow its photo (branch basil/fix-cocktail-dress-texture)
- **Problem:** after the metalness fix the dress was no longer black on Basil's phone, but still dark grey-brown with no green. The TRELLIS bake lost the colour: the baked texture's mean is 16,15,14 (near black, no hue), while the photo of the dress is dark green and olive-gold stripes (mean 60,61,54).
- **Fix (no GPU, no credits):** `tools/recolor_glb_texture.py` re-colours the baked texture by matching each texel's luminance rank to the colour ramp of the garment cutout photo, then scales the light so the lit render matches (factor 0.15). Same mesh and UVs, so the shape does not change. Rendered mean sRGB of the dress alone: before 55,52,48; after 64,65,55; photo 60,61,54.
- **File name:** the GLB is now `assets/ST655_1_v2.glb` (pieces.json updated) because /assets is cached for a day on Vercel, so a phone that already holds the old file would not see the fix under the old name. The old file is removed from the tree (still in git history).
- **Limits:** the horizontal stripes of the real fabric are not reproduced; the dress reads green-black rather than grey-brown. A true fix needs a regenerated GLB (GPU quota).

### Fix: Piece photo missing on desktop (branch basil/piece-photo-desktop)
- **Bug:** the faster-loading change made the Piece screen photo (and the 3D viewer) wait for the first visit to that screen. On a window wider than 600 px the Piece screen is shown beside the Stage and is never "visited", so its photo stayed empty and showed only the alt text.
- **Fix:** `enterPiece()` also runs at boot when the window is wider than a phone, and when a narrow window is widened. Phones keep the lazy load.
- **Learn button:** hidden above 600 px on purpose (`.app-only`), because the Piece screen is already beside the Stage there. Not changed.

### Stage exposure 1.1 to 1.0 (branch basil/stage-exposure)
- **What:** ACES tone-mapping exposure on the Stage goes from 1.1 to 1.0. Nothing else changes (environment map, contact shadow and `metalness = 0` were already in).
- **Why:** after the colour fix, the palest piece (ST503) still rendered about 1.3x brighter than its photo. Measured mean sRGB of the garment alone against its cutout photo: ST503 photo 97,110,114, at 1.1 it is 134,146,143, at 1.0 it is 127,140,137; ST2434 photo 69,82,50, now 78,89,59, at 1.0 73,84,55; ST80930 photo 59,60,67, now 68,72,79, at 1.0 63,68,74; ST80931 photo 58,59,66, now 52,59,66, at 1.0 48,55,62; ST655 photo 60,61,54, now 59,57,53, at 1.0 55,53,49.
- **Decision (Basil):** exposure 1.0, small gain. Khronos Neutral was tested against model-viewer and rejected: it crushes dark pieces (black dress 48,45,40 against a photo of 60,61,54). Per-piece exposure is possible later. Headless Chromium only; real phones not checked.

### C2 switched to the curator's stories and questions (branch hassan/C2)
- **What:** our 3 drafted multiple-choice questions (ST503, ST80931, ST2407/1-2), the fabric lock and the `quiz` save field are gone. `questions.json` now holds the curator's text from her Notion page "Story and Questions", copied as written by `mockups/tools/questions_sync.py` (her Heron link maps to the inventory number through a new `heron` field in `records.json`, added by `records.py`). Her page has one piece so far: the A.F. Vandevorst jacket ST81190.
- **Flow:** a card scan of a piece with a story shows a sheet: her facts, her story, a "Source: MoMu Study Collection" link to the Heron page, and every question on her page in her order (all 4 for the jacket; Hassan chose all over her "pick 3"), each with "Show answer". For a study piece the sheet comes first and "Study it up close" then opens Up close as before; find-3-details is unchanged. A plain visit does not load `questions.json`.
- **Decisions (Hassan, 2026-11-21):** the quiz is optional and on top; interacting with a piece collects it and nothing is locked behind a question (D2 edited). the curator's text is the source for stories and questions and is shown as written, with a citation where her page gives a reference (D3 exception added). Her Notion page is read only for us. Our Notion review page was moved to Notion's Trash.
- **Removed:** `tools/questions_check.py` and `tools/questions_apply.py` (moved to `_to_delete/`), the Remix locked-fabric tiles and `secondSkinQuiz`. The save schema is back to what is on `main`.
- **Checked** at 390 x 844: jacket card shows her story and all 4 questions, answers reveal, "Study it up close" opens Up close; Jak card shows no sheet; Remix grid fix kept.

### Remix grid overlap fixed; quiz questions reviewed in Notion (branch hassan/C2)
- **Grid:** with the wardrobe at half height the tile grid shrank its rows (about 110 to 140 px) below the tiles' 3:4 height, so tiles overlapped. Cause: the grid is a shrinking flex item and the tiles clip (`overflow: hidden`, so no automatic minimum height), which lets auto rows squeeze. Fix: `grid-auto-rows: max-content` on `.wardrobe .grid`; the grid now scrolls instead. Checked at 390 x 844 on Remix, Study and Top: no overlap, console clean.
- **Review loop for the curator:** the 3 questions are rows in a Notion table "Quiz questions" under the team hub page "Quiz questions: review (the curator)", with the MoMu value and the allowed wrong options beside each row. `mockups/tools/questions_apply.py rows.json` writes her rows back into `questions.json` (Status "Approved" sets `draft: false`) and runs `questions_check.py`; if any row breaks a rule (answer not a MoMu value, made-up wrong option), the file is left unchanged. Decision: rows are fetched with the Notion connector rather than a Notion API token, so no new secret lives in the repo.

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
