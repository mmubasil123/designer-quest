# Changelog: Museum Atelier mockup

Newest first. Each entry: what changed, why, and the decision behind it.

## HANDOVER.md cut to a current-state page (2026-11-22, H24, branch hassan/H24-handover-trim)
- What: `HANDOVER.md` went from 233 to 39 lines: state, open PRs, half-done work, next step. Its per-ticket history (H2 to H22, B5 to B8,
  E2, E4, D-3, wearable scans, State, Do next, Left, Growth story) is dropped because `LEDGER.md` and this file already hold it; the
  full old text is in `_to_delete/HANDOVER-2026-11-22-full.md` (git-ignored) and in git history. The how-tos moved: splat study
  pieces (`.sog` conversion, `fracAt`, quote check), the splat captures table, the Splat Stage spike lessons, CLO model export and
  the team's pieces, and deploy notes to `ARCHITECTURE.md`; theme, the curator sync, narration re-voicing, languages, Ask, landing stills to
  `README.md` ("Content tools"). Pointers fixed in `AGENTS.md`, `README.md`, `LEDGER.md` (G1, kimono risk), `docs/PROJECT_NOTES.md`
  and `docs/RESEARCH-LOG.md`.
- Why: most of the file was stale since 2026-11-21 (it still called B5, B6 and B8 unmerged and listed done tickets under "Do next"),
  so a fresh agent had to read 233 lines to find 20 that were true.
- Decision: keep the file, because `AGENTS.md` (Start here, End of session) and Mubasil's agents depend on it; from now on an end
  of session replaces its contents instead of appending. Shared contract per the LEDGER change policy: Mubasil gets a heads-up before merge.
  Dropped for being out of date, not moved: the "Housekeeping" loose-files note.

## "Win its fabric" works on every tap: Up close steps back once (2026-11-22, H23, branch hassan/win-fabric-button)
- What: `backTo()` in `nav.js` leaves once per page view; later calls are ignored until the page is shown again from the
  back-forward cache. Cause: "Win its fabric" (and Up close's ←) call `backTo()`, which uses `history.back()` when the
  Stage is the previous entry. Each call queues one more traversal, so a double tap stepped back twice, past the Stage
  (often to the landing page), and the Won card never showed; the claim sat unused in `sessionStorage`. Three taps could
  land on an older Stage entry, which is why it looked intermittent.
- Why: the button felt dead in the demo. One tap always worked; quick or repeated taps (natural while the Stage loads)
  did not.
- Decision: fixed at the source in `backTo()`, not with a disabled state or a retry, so every page that steps back
  (Up close, outfit) is covered. Checked headless (Chromium): all 9 study pieces at 1280 and 390 px with 1, 2, 3 and 5
  quick taps, plus 1 to 3 taps on ←: 75 of 75 pass. The same run against the old `nav.js`: 72 of 75, the misses a double
  tap that landed on the landing page, a 5-tap burst that lost the Won card and a triple ← that left the app. Both runs
  log the same view-transition abort errors (`InvalidStateError`), which come from main, not from this change. Not
  checked on a phone.

## Dutch and French for the curator's jacket story and hints (2026-11-22, D-3, branch hassan/curator-translations)
- What: the 3 story paragraphs and 3 hint lines of ST81190 are in `i18n/content.nl.json` and `content.fr.json` (12 entries,
  `by: machine`, glossary terms kept: klinknagels / rivets, drukknopen / boutons-pression, vilten / feutrage). `i18n_build.py --check`
  passes. The story player (`story.js`) now shows a the curator prose story's captions through the same `q:<id>:story:<n>` lookup,
  labelled as a translation; before, only script-form stories were translated, so the jacket's captions stayed English in NL / FR.
- Why: Hassan asked for the translation. The narration audio stays English (the sheet says so).
- Decision: written by Claude in this session rather than by `i18n_build.py`, which needs an API key from outside this repo;
  same file format and source hashes, so the script treats them as fresh. Her hint line "…nine press-studs are a type of
  button…" is translated for its meaning, not its grammar. the curator or a native speaker should read them.

## the curator's hints on the Win its fabric page (2026-11-22, C2, branch hassan/curator-hints)
- What: her "3 Hints" for the jacket ST81190 are in `questions.json` (`hints`: title and line, copied by `questions_sync.py`).
  On Up close, tapping a clue's Hint now also opens her line under that clue (`up-close.html`), next to the ring on the piece.
  Hints go to the details by position, and only when her list and the piece's details have the same length (3 and 3), so a hint
  never lands on the wrong clue. First letter capitalised on screen; her wording otherwise unchanged. Pieces without hints
  behave as before.
- Why: Hassan asked for her new hint text. `i18n_build.py` now lists the hint lines (`q:<id>:hint:<n>`) for translation.
- Decision: our clue titles in `pieces.json` stay (they match hers apart from "press studs" vs "press-studs"). Dutch and
  French hint lines are untranslated until `i18n_build.py` runs with the Gemini key; they show in English meanwhile.

## Jacket audio follows the curator's more-story text (2026-11-22, C2, branch hassan/curator-story-audio)
- What: ST81190 no longer has an audio-guide script in `narration-scripts.json`, so it is spoken like her blouse and
  trousers: its title and years, then her 3 more-story paragraphs word for word. Captions are those paragraphs.
- Why: Hassan asked for the audio to match her text. The old 46 s H13 script (voice picsart:Adeline) is replaced.
- Voiced (2026-11-22): Picsart AI Audio Generator, voice Adeline (12 credits), MP3 from Picsart's CDN, imported as mono AAC
  (77 s, 472 KB). Transcribed back locally: 96% of the script heard; the differences are spellings ("gray", "center") and
  how the brand name is read. English only; the Dutch and French files for this piece do not exist.

## QA round 2: share card framing and the NL / FR gaps (2026-11-22, H22, branch hassan/H22-qa-round2)
- What: the round 1 suite re-run on main after E4, H6, H20, H21, B5/B6/B8 and D-3, plus their new paths (landing page,
  `/stage`, scan flow, NL / FR at 320 px); cases in `docs/QA-TEST-CASES.md` (Round 2). Fixed: the share card kept H21's
  stage-wide camera view offset, so the look came out squashed (`grabStill` clears it; `resize()` restores it). In NL / FR
  the card's Dress, Shoes, Cloth and "+n more" were English and its story line was the English narration (now the
  translated beats, marked as a translation, or no line). Dutch look names took the adjective ("Groene in …"); Dutch now
  takes the garment word before any "met …" / "in …". The landing page turned partly Dutch with a Dutch browser
  (`data-lang-fixed="en"` pins it). Switching language in the help card left a dead back step (`setLang` now steps back
  over the dialog's history entries first). A Stage restored from the back-forward cache after a language change reloads.
  The focus button label, the "Two centuries in one look" toast and the New badge are translated; Up close escapes the
  translated detail text.
- Why: Hassan asked for a second QA pass after the latest merges.
- Decision: no change to layout, flow or save schema; seven UI strings added to `ui.nl.json` / `ui.fr.json` (team
  wording, as the other UI strings). The landing page stays English only, as written.

## Web address follows the new name (2026-11-22, H-URL, branch basil/H-URL)
- What: the public address in the reel closing card (`presentation/reel/src/teaser/scenes.tsx`, `style.md`),
  `presentation/DEMO_VIDEO.md` and `PRODUCT.md` is now `museum-atelier.vercel.app` instead of `second-skin-ten.vercel.app`.
- Why: the app is called Museum Atelier (H-NAME); Basil wants the address, the deck QR code and the NFC chip to match.
- Decision: `museum-atelier.vercel.app` is added as a domain on the existing Vercel project `second-skin` (Settings >
  Domains), so every prod deploy keeps it; the old address keeps working. The app itself builds share links from
  `location.host`, so no app code changes. The reel MP4 needs a re-render to show the new address.

## the curator's "more story" version for the jacket (2026-11-22, C2, branch hassan/curator-story-import)
- What: ST81190's story is now the curator's "more story-format version" (3 paragraphs, verbatim); her plain description variant is
  gone from `questions.json` and `narration.json`. Her page was re-read: blouse ST81114AB and trousers ST81116 (one story
  version each) and all 11 questions already matched it. The other 16 pieces are not on her page and keep their text.
- Why: the team wants the narrative version shown. `tools/questions_sync.py` now uses the text after a "more story" marker
  in a Story section when there is one; her page was only read, never edited.
- Decision: her wording wins. Dutch and French translations of the jacket story (3 entries each) are stale until
  `i18n_build.py` runs with the Gemini key; they show the old text meanwhile.

## The app is called Museum Atelier (2026-11-22, H-NAME, branch hassan/museum-atelier-rename)
- What: "Museum Atelier" now shows in the tab titles (also "Up close · Museum Atelier", "<piece> · Museum Atelier", "Cycling outfit · Museum Atelier"), next to the MoMu logo in the Stage, Up close, outfit and landing headers (`.app-name` in `theme.css`), in the share card's top row ("Museum Atelier · <date>"), the share sheet title ("My Museum Atelier look", nl and fr too), the landing page's `og:` tags, and the README, AGENTS, LEDGER title, schema comments and current docs. Dutch and French strings that said the old name now say Museum Atelier.
- Why: the team picked the name; the old name was a friend's idea name and must not stay in the product.
- Decision: the page file is now `atelier.html`, the storage keys `atelier.*` and the console handle `window.atelier`; saved looks from before this change do not carry over. Still on the old name because they need Mubasil or a DB restore: the Vercel project and its `*.vercel.app` URLs, and the `second_skin` DB schema (`schema.sql`, `seed/momu_full.dump`). Earlier entries below had only file and key names updated.

## Stage UI bugs: every wardrobe tile reachable, zoom never cut by a box (2026-11-22, H21, branch hassan/stage-ui-bugs)
- What (wardrobe): the tile grid pads its end by the sheet's `--y` (`.wardrobe .grid` in `atelier.html`), so at half the
  last row scrolls fully into view with 24 px (plus the safe area) below it. Cause: the sheet is always 88% of the stage
  tall and sits `--y` px lower at peek and half, so the grid's scroll range ended up to about 280 px below the phone and the
  last rows could never be reached (seen on Fabrics with 3 rows; at full `--y` is 0, so full was fine).
- What (zoom): the Stage canvas now covers the whole stage. Cause: the canvas was the size of the turntable box (220 px wide
  in the pitch layout; between the look title and the peeking sheet on a phone) and zoom magnified inside it, so a zoomed
  look was cut by that box on every side. The box stays the frame the camera fits the look in at zoom 1
  (`camera.setViewOffset`), so zoom 1 looks the same, and stays the drag area; the canvas ignores pointers. The + and -
  buttons now ease to the next step (240 ms, ease-out quart), a new press retargets from the zoom being eased to, and a
  pinch, wheel or drag takes over at once; reduced motion jumps. Opening the wardrobe eases the zoom back to 1. Zoomed in,
  the look name fades out (as in focus) since the look now runs over it, and returns at zoom 1.
- Why: Hassan found both on the Stage (wardrobe Fabrics tab half hidden; the zoomed jacket and trousers in a hard rectangle).
- Decision: fixed at the cause, not the symptom: no change to snap heights or zoom limits. At 2.25x and 3x the look is
  taller than the stage, so it runs off the stage edges and a vertical drag pans it (as before). Checked in the browser
  pane at 390 x 844, 320 x 700 and the pitch layout: every tab at half and full, last tile fully in view; zoom in, out,
  wheel interrupt, front, side and back; console clean; Impeccable detector: only the existing `view3d` finding (also on
  main). Not on a phone; reduced motion not emulated (the code path jumps). Screenshots in `docs/stage-ui-bugs/`.

## D-3 Languages NL / EN / FR, English for the Dutch-only records (2026-11-22, branch hassan/D-3-i18n)

- **What:** `mockups/i18n.js` is the one language layer. UI text is written in English in the code as `t("English", {vars})`; NL and FR are in `mockups/i18n/ui.nl.json` and `ui.fr.json` (an untranslated string shows in English). Facts and stories are translated at build time by `mockups/tools/i18n_build.py` into `i18n/content.<lang>.json`, stamped with a hash of the source: a changed source shows the original again and `--check` fails until the script is rerun. Covered: the fact card (materials, places, the MoMu quote), the Won card quote, Up close (detail quotes, finds, hints, toasts), Ask, the curator's stories and questions, the H13 narration captions, the piece names, the step line, the share card.
- **D-3 acceptance:** every Dutch-only fact on screen has English beside it: the Dutch original stays (fact card, Won card, Up close, Ask) and the translation carries a label, **Our translation** where the team wrote it (65 entries from `records.py` / `pieces.json`), **Machine translation** for the rest. No fact appears in Dutch alone.
- **Switch:** NL EN FR on the first step of the **?** help sheet (with a "Language" caption) and in the Up close header. Default: saved choice, else browser language if nl/en/fr, else EN. Stored as optional `lang` in `atelier.save.v1`.
- **No lost place (H6 audit finding 8):** a switch still reloads (the wardrobe tiles, 3D scenes and dialogs are built once from strings), but `keepPlace()` / `takePlace()` in `i18n.js` carry the place through `sessionStorage`: on the Stage the help sheet, wardrobe height, tab, body/sleeves and grid scroll; on Up close the camera angle (found details are saved already). `nav.js` resets its own history depth on load, so back closes the reopened sheet and never leaves the page.
- **Rebase onto main (H6, H13, E4, B5/B6/B8, H20):** re-applied by hand; the story sheet translates the narration beats (`narr:<id>:<n>`, `:tease`) and keeps the English recording ("Narration in English"); the browser-voice fallback reads the chosen language. The landing page (`index.html`, E4) is not translated.
- **Small CSS:** `i18n.css` keeps the Stage header on one line at 320 px in FR (smaller pills), the Up close header likewise (piece number hidden below 360 px), and puts the label under a fact value. The match chip reads "n/10 gagnées" / "n/10 gewonnen" for width.
- **Counts:** UI NL and FR each cover every `t()` key; content NL 249, FR 439, EN 190 entries (`--check` clean).
- **Decision:** machine translation at build time, never at runtime, always labelled. The 336 entries added in this rebase (narration, the cycling blouse and trousers, 14 EN record sentences) were written by an assistant, not the Gemini setup, because no `ASK_*` env was at hand; they are stored as `machine`. NL and FR UI strings and all machine text need a native read (the curator reviews `i18n/glossary.json`). FR narration uses "vous" while the FR UI uses "tu": to settle.
- **Checked:** Playwright-less, in the browser pane at 390 and 320 px (FR, NL, EN): switch with help open, tab and sheet kept, back closes the sheet and Museum, fact card, story, Won card, Up close header; Impeccable detector: one finding on the wardrobe ("Full" ×3, main's code, not changed). Not on a phone.

## Stage without the dress form (2026-11-22, H20, branch hassan/H20-no-form)
- What: the four form finishes (linen, calico, black jersey, oak) are gone from the Stage header, and the dress form
  (torso, neck, pole, base) is no longer built: the worn scans stand on their own in the room, with the contact shadow
  kept on the floor. `look.skin` is dropped from the look; an old save that still has it restores as before. Copy that
  named the form now says the look ("Dress up", "Two centuries in one look", the zoom and focus labels, the no-JS line).
  The `?demo` avatar toggle is unchanged.
- Why: the finishes only recoloured the form, and the form itself added nothing to the pieces (Hassan).
- Decision: D1 changed to "no body under the pieces". A CLO avatar in its place was not done: the rigid scans clip on a
  body and would each need the A9 fit. Checked in the browser pane at 390 px
  (front, side, back, empty Stage, `?demo`), not on a phone.
- Landing page too: the 13 slider stills (`assets/landing/<year>.webp`, `look.webp`) re-rendered from the new Stage with
  `presentation/reel/scripts/landing-stills.mjs` (unused `bare` stop dropped), the share-card screen re-captured from the
  app (Noor, Jak + football boots), and the copy, alt text and slider labels no longer name a dress form. Left as they
  are: the Jak scan's own baked-in white bust (part of its texture; the `?demo` neck cut only removes the stub), the
  E2 teaser video and its poster, and MoMu's photo of the Jak on its mannequin (`ST503.webp`).

## Phone UI: persistent wardrobe tiles, locked silhouettes, reduced-motion pass (2026-11-22, B5 + B6 + B8, branch hassan/B-phone-ui)
- What (B5): the wardrobe builds each tile and tab chip once (`mockups/wardrobe.js`, `nodeFor`) and a render only reorders
  them and toggles `on`, `new`, `locked` and `aria-pressed`. A tile node now survives tab changes, so the selection
  outline animates (colour and offset, 160 ms) instead of snapping. The Won, Fabrics and slot tabs keep their own nodes.
- What (B6): a locked piece is a silhouette (its photo flattened to ink, the backdrop dropped) with its name and
  "Find card in room N". No room number is recorded in `pieces.json` yet, so the line reads "Find its card in the museum"
  until a piece has an optional `museumRoom` (read by `renderLocker`, not in the schema yet: heads-up first). When a
  piece is won the real photo is revealed with a 600 ms clip-path wipe the first time its tile is on screen
  (IntersectionObserver), once per tile; a tile built after the win shows the photo at once. A tap on a locked tile still
  opens the sticker prompt (J6), now decided by `PIECES[id].locked`, not by the CSS class.
- What (B8): under `prefers-reduced-motion: reduce` the idle turntable spin stops at once when the setting changes (it was
  read once at load), a new garment no longer drops 4 cm onto the form, the tile reveal is a 150 ms opacity crossfade, the
  tile outline and tab chips change colour only, and the scene, story and zoom/credit fades are 150 ms. Checked with
  emulated reduce: no transform animation runs, no tile has a transform, only 150 ms opacity and colour transitions remain.
- Why: B5 is the base for B6 (a reveal needs the node to persist) and for the selection animation; B8 matches the H6
  rule (opacity only, 150 ms, no slides or scale). B9 (Mubasil's) not touched.
- Decision: new code lives in `wardrobe.js` / `wardrobe.css`; `atelier.html` changes only `renderLocker`, `tile()`, the
  tile click and the `REDUCE` media query. Not checked on a real phone.
## H6 Navigation, PR 4: one header and a page transition between Stage and Up close (2026-11-22, H6, branch hassan/H6-nav)
- What: Up close's header now uses the Stage's spacing and logo size, with ← as a round 44 px pill like the Stage's
  "?" (`up-close.html`). A cross-document view transition in `theme.css` (`@view-transition`: old page fades out in
  160 ms, new one fades in with an 8 px rise in 220 ms; fade only under reduced motion) covers every move between the
  Stage, Up close, the outfit page and the landing, so they read as one app; browsers without it just navigate.
  `nav.js` `backTo` treats `/stage` (E4's Vercel rewrite) and `/atelier.html` as the same page, so ← on Up close and
  the outfit page steps back on the deployed site too instead of loading a second Stage. The Stage's phone frame is
  the page's `main` landmark. A one-line `pagereveal` guard in the head of the three pages keeps a skipped transition (a card scan
  rewrites its URL while the page is revealed) from logging an uncaught error.
- Checked (browser pane, 390 x 844): Stage > Up close (ST2435) > ←: back on the existing Stage entry (history grows by
  the forward entry only); headers compared by screenshot; console clean. Impeccable detector: Up close 0 findings
  (1 advisory, as before), outfit page 0, Stage 2 findings that are on `main` already (repeated "Full" label in the
  wardrobe, title contrast over the scene gradient), not from H6.
- Why: `docs/UX_AUDIT.md` findings 2 (moves to and from Up close felt like reloads), 10 (two different headers) and 11
  (landmarks; the page title and `h1` were already fixed by H10).
- Decision: a root cross-fade rather than shared-element morphs: the two headers differ (← only on Up close), and a
  morph of the logo would draw the eye to chrome instead of the piece.

## H6 Navigation, PR 3: layers keep their context; progress in the header (2026-11-22, H6, branch hassan/H6-nav)
- What: one way back for the Stage's layers. A fact card opened from the Museum returns to the Museum when it is
  closed (×, Escape, back, backdrop); Ask and the 3D view return to the fact card they came from; a choice that leaves
  (Wear it, Find it at MoMu, Up close, the outfit page) does not come back. The header's "Museum" pill is now a progress
  chip ("2 of 10 won", opens the Museum; read as "Museum: 2 of 10 pieces won") and "Share look" became a quiet "Share"
  pill, so the last beat is no longer the loudest button. The Museum opens as a bottom sheet like the fact card (opacity
  only under reduced motion). Ask lost its handle, which looked draggable but was not (× closes it); the wardrobe
  handle button is 44 px tall without moving the layout.
- Checked (browser pane, 390 x 844 and 320 x 700): Museum > fact > Ask, then back three times: fact, Museum, Stage;
  the same with ×, × and "Back to my look"; wardrobe ⓘ > fact > See it in 3D > back: fact, then Stage; Museum > fact >
  Find it at MoMu opens only the sticker prompt; history never grows. Header fits at 320 px. Console clean.
- Why: `docs/UX_AUDIT.md` findings 6 (lost context: closing Ask dropped you on the Stage), 7 (Share loudest, progress
  hidden) and 9 (false and thin affordances; the chips' scroll cue was already on main).
- Decision: the dialogs keep their own markup and owners; only the way back changes, through the history entries of
  `nav.js` (a reopened parent reuses its child's entry). The header chip and the Museum as a sheet touch Basil's top
  bar and Museum: heads-up in the PR, easy to revert in CSS.

## H6 Navigation, PR 2: the card scan as one flow with a way out (2026-11-22, H6, branch hassan/H6-nav)
- What: new `mockups/steps.js`. The story and Win it dialogs share a step line (Story · Guess the year or Up close ·
  Yours) and hand over in place: the old card goes at once and the next rises in without the scale-in, so the scrim
  never blinks; Guess the year to You won it swaps content in the same card (fade, 6 px rise, 2 px blur; fade only under
  reduced motion). Every scan step has **Not now**: on the story and on Guess the year, Not now, Escape and the back
  gesture stop there and a toast says the piece waits in the Museum; a backdrop tap no longer starts the challenge. A
  study or CLO card's Not now boots the Stage instead of jumping to Up close or the outfit page. On the Won card, Escape
  and back now keep the prize (as "Keep it in my wardrobe") instead of being refused. Replaying a won piece's story
  keeps its old single button.
- Checked (browser pane, 390 x 844): `?card=ST503` backdrop tap keeps the story, back = Not now (toast, URL clean);
  Win it, Escape on Guess the year = Not now; three misses win, back on the Won card keeps it (`atelier.won.v1`).
  `?card=ST81190` Not now boots the Stage (one canvas, URL clean); Study it up close, all found, back: Won card with the
  step line on Yours. Console clean.
- Why: `docs/UX_AUDIT.md` finding 3 (dismiss meant "continue"; Win it could not be left) and 12 (hard cuts between
  steps). Findings 4 (narration before the guess) and 5 (Wear it now) were already fixed on main by H13 and J8.
- Decision: rebuilt on today's main rather than rebasing the old `hassan/nav-ux-scan` commit, because Basil's J8 Won
  card ("Wear it now" / "Keep it") and H15/H17's next row had replaced that part; both are kept as they are. Nobody can
  lose (D2): Not now leaves the piece exactly as before the scan.

## Landing page at `/`, the Stage at `/stage` (2026-11-22, E4, branch hassan/E4-landing)
- What: `mockups/index.html`, the landing page. The hero is "the year itself": a giant red year fills the screen and the
  dress form stands in front of it; one slider (13 era stops, 1750 to 2005, then "Your look") changes the numeral, the
  outfit and the record quote together. A pausable tour plays once on load and rests on the 255-year look (jak, monpe
  trousers, football boots); it is off under reduced motion. Below: how a visit goes (tap, guess, wear, look closer,
  remix, share) with the app's real screens and a playable year guess on the jak that uses `win.js`'s own `judge()`;
  the E2 teaser; "every word from the museum"; Start. The stills are rendered from the app's own Stage by
  `presentation/reel/scripts/landing-stills.mjs` (transparent PNGs, git-ignored in `assets/landing/raw/`, shipped as
  WebP, about 0.5 MB for all 14). App screens come from the E2 captures; the video poster is the teaser's first
  storyboard frame; `assets/landing/momu-teaser.mp4` is the E2 render (4.4 MB, served with `preload="none"`).
  Routing: `vercel.json` no longer rewrites `/` to the app; `/` serves `index.html` and `/stage` rewrites to
  `atelier.html`. The landing page forwards any `?card=` or `?fabric=` URL to the Stage first, so sticker links work.
  On the Stage the MoMu logo now links to the landing page, and the desktop pitch line is written for visitors.
  `PRODUCT.md` records the product for design work; `.impeccable/surfaces/` holds the page's direction.
- Why: the app had no front door that tells the story; Hassan asked for a landing page with the demo video and a
  mannequin re-dressed by a year slider, at `/`, with the Stage elsewhere.
- Decision: Hassan chose pre-rendered stills over live 3D (light, fast on venue wifi) and the "year itself" layout
  over a museum-label and a phone-promo layout. Facts and quotes come from `pieces.json` and `records.json` (D3).
  The CLO-only pieces (knee breeches, cycling outfit) have no stop: they are worn on the avatar, not the dress form
  (D5). Deploy setting D7 changes: Mubasil deploys it.

## MoMu teaser video, made in code (2026-11-22, E2, branch hassan/E2-demo-video)
- What: `presentation/reel/`, a Remotion project that renders a 44 s, 1920 x 1080 teaser from the app's real screens
  (captured at 390 px with Playwright, `scripts/capture.mjs`) and MoMu's photos: nine scenes, one per caption, with
  small sound effects made in code. `style.md` holds the look (MoMu tokens from `theme.css`, no voice); a `/reel` skill
  (`.claude/skills/reel/`) makes the next one; `scripts/check.py` measures dead spots and busy moments.
  `presentation/DEMO_VIDEO.md` has the script, sources of every fact, the checks and what to re-record.
- Why: feedback 2026-11-21, make a great demo video rather than perfect the meshes.
- Decision: Hassan picked a standalone teaser (16:9 for the projector, no voice, about 45 s, result first) and
  dropped Picsart AI clips; facts only from the collection data (D3), so scene 6 says "the fabric of" the Vandevorst
  coat, a study piece, and scene 7 says "on MoMu's 3D model" (Up close shows the CLO model since H18). Videos, captures and copied assets stay git-ignored. Not shown on the venue projector yet.

## QA bug bash: 8 fixes (2026-11-22, branch hassan/H19-qa-bugbash, H19)
- What: test cases in `docs/QA-TEST-CASES.md` (about 50 scenarios, run headless at 390 and 320 px). Fixed:
  B1 the form finish was not saved (only a look change saved it), so a reload reset it. B2 "your widest" was saved but
  never read back, so it restarted at 0 on every load. B3 re-scanning a piece that is not a museum piece said "is in your
  Won tab" when there is no Won tab for it; it now names its own tab. B4 the 3D view never emptied (model-viewer's `src`
  was set as a property, so `removeAttribute` did nothing): the model stayed in memory and the last piece showed under
  the next one's name while it loaded; a viewer closed or switched mid-load no longer gets a late `src`. B5 the share
  card listed a won study piece worn alone three times (Dress, Cloth, Sleeves); a piece's own fabric on its own cut is
  now no row and one fabric on body and sleeves is one "Cloth" row, as on the Stage. B6 the card's "Won" row missed
  study fabrics won up close. B7 a locked study piece could be worn without winning it: its fact card's "Find it at
  MoMu" put it on the form when the tab matched its `wear` slot (Full tab, Cocktail dress → Black satin dress); locked
  pieces now always go to their sticker or Up close. B8 a non-array `atelier.new.v1` (or a non-array detail list in
  `atelier.found.v1`) threw during boot and stopped the Stage or Up close.
- Why: Hassan asked for a QA pass to make the app bug free before the demo.
- Decision: logic fixes only, no change to look, copy beyond the B3 toast, save schema or URL params. Known and left:
  model-viewer's duplicate three.js warning. Re-checked after rebasing on PR #57 (narration audio): story audio plays.

## MoMu logo at momu.be's own shape (2026-11-21, branch hassan/H10-logo-ratio)
- What: every MoMu logo now has the 1.786:1 shape momu.be shows in its header (measured 718 x 402 px): the large logo's
  polygons, unchanged, stretched vertically by 299/120. `assets/brand/momu-logo.svg` (viewBox 0 0 534 299), the favicon,
  the inline logos in the Stage bar, Up close header, Up close loading and outfit header, and the share card masthead.
  Sizes: headers 64x36 px (no longer needs to shrink in the 340 px frame), Up close loading 86x48, share card 286x160 with
  the date on its foot and the paper fade down to 820 px.
- Why: Hassan, 2026-11-21, with a screenshot of momu.be's logo: "This is the aspect ratio the logo needs to maintain".
  The small 202x42 proportion we used (about 4.8:1) read as a squashed strip.
- Decision: one shape everywhere, taken from the site's own polygons, never redrawn. Checked at 390 px (Stage, Up close,
  outfit) and the 1080x1920 card with no name and a 21-letter name; console clean.

## Share card: the MoMu logo as the masthead (2026-11-21, branch hassan/H10-card-logo)
- What: the card's logo moves from a small 40 px mark at the right end of the date row to the masthead: 72 px tall, top
  left on the text's own left edge, with the date right-aligned on the logo's foot and the title about 64 px below it.
  The paper fade under the header reaches 720 px so the span line stays on white. A title word too wide for the card (a
  long name) shrinks the title font just enough, down to 56 px, instead of running off the edge.
- Why: Hassan, 2026-11-21: the logo looked messy and out of place. At 40 px its hairline diagonals nearly vanished, it
  floated off the text column and competed with the date.
- Decision: set it as momu.be and the hackathon template do, large and top left. Card stays 1080x1920; checked with no
  name, a short name and a 21-letter name; console clean.
## Tappable next piece on the Won card (2026-11-21, branch hassan/H17-next-tap, H17)
- What: the Won card's "Next to win" row (H15) is now a button with a chevron. A tap keeps the prize, just as "Keep
  it" does, then opens that piece. A study piece already started goes straight to Up close; any other piece shows its
  sticker prompt ("Find it at MoMu"), the same path as its Museum tile (`tapCard`). `win.js` resolves "next" and exposes
  `win.next`; `atelier.html` adds one line after each of the two Won-card calls. The study-piece copy now says
  "Tap to finish up close."
- Why: H15 had to leave the row static while `atelier.html` was open in PR #47. Now one win leads straight to the
  next.
- Decision: reuse `tapCard` rather than a new route, so back and the demo sticker behave as everywhere else (H6).
  Checked in Chrome at 390 px: a fabric win on ST2435 opens the half-found coat ST81190 in Up close; a year win on the
  jak ST503 keeps it (New in the wardrobe) and opens the sequin dress's sticker prompt; back closes the prompt; console
  clean. Not on a phone.

## MoMu logo on the outfit page (2026-11-21, H16, branch hassan/H16-outfit-logo)
- What: `outfit.html` has the same header as Up close: back arrow, MoMu's logo (the H10 inline SVG), the piece id on
  the right. The piece's name moved from the header to above the wear buttons. The back arrow replaces the "My look"
  text link and still steps back to the Stage (`backTo`).
- Why: after H10 the outfit page was the one screen without MoMu's logo.
- Decision: copy Up close's header rather than invent one, so the two 3D pages read as siblings. No new tokens.
## Next piece to win on the Won card (2026-11-21, branch hassan/H15-next-piece, H15)
- What: the Won card (`mockups/win.js`, `win.css`) ends on a "Next to win" row with the piece's photo, its name and
  how to win it. A study piece the visitor has already opened up close comes first ("You found 1 of 3 details. Open it
  in Museum to finish."). Otherwise it shows the next locked room piece in `pieces.json` order, either "Find its
  sticker at MoMu and guess when it was made." or "...then find its 3 details up close." Once every piece is won,
  the row is not shown. It shows after both year wins and fabric wins.
- Why: the rest of J5 ("then the next piece to win"), left out of H11. A win now points to the next one.
- Decision: a plain row, not a button. Opening a piece belongs to the Stage in `atelier.html`, which PR #47 had
  open, so this change stays out of it. It uses the same list as Museum (room pieces with a GLB or a splat). Facts come only from
  `pieces.json` (D3). Checked in Chrome at 390 px (fabric win with a half-found coat, year win on the jak) and with
  test data (wearable copy, nothing left); not on a phone.

## MoMu's official logo in the app (2026-11-21, branch hassan/H10-rename)
- What: MoMu's two-M logo replaces the typed "MoMu": `assets/brand/momu-logo.svg` (the small 202x42 proportion, copied
  unchanged from the inline SVG on momu.be), inlined in the Stage bar and Up close header (87x18 px, down to 62 px wide in
  the 340 px pitch frame so it never touches the pills), drawn as polygons on the share card (40 px tall, right end of the
  date row), as the browser-tab icon (`assets/brand/favicon.svg`) on the Stage, Up close and outfit pages, and breathing
  above "Loading MoMu's 3D scan" on Up close (still under reduced motion).
- Why: Hassan, 2026-11-21: take the branding from momu.be and the hackathon presentation template, and use the logo.
- Decision: black on white only, as on momu.be and the template's content slides; never redrawn, stretched or recoloured.
  The template's red, red capital titles and plain grotesque were already the H4 theme, so no token changed. The
  template's partner mark (MASJIEN) is not used.

## The app drops the old name (2026-11-21, branch hassan/H10-rename)
- What: every place a visitor sees the name now says MoMu instead: the Stage bar and Up close header show the "MoMu" mark
  alone (22 px, 44 px row), page titles are "MoMu", "Up close · MoMu", "<piece> · MoMu", "Cycling outfit · MoMu"; the
  share card's top row is the date with MoMu on the right, its footer is the link alone, the shared file is
  `momu-look.png` titled "My MoMu look"; help button label "How it works". README, AGENTS, ARCHITECTURE, TICKETS and the
  pieces schema title call it the MoMu app.
- Why: Hassan, 2026-11-21: the team is changing the name, so the old name goes from everywhere.
- Decision: until a new name is picked the app carries MoMu's name only. Identifiers stay: `atelier.html`, the Vercel
  project, the sticker URLs, the `atelier.*` saved keys, `window.atelier` and the `second_skin` DB
  schema (renaming them would break printed stickers and saved looks, and needs Mubasil for the deploy). History
  (this changelog, past ledger rows, plans) is left as written. Checked in Chrome at 390 px, console clean.
## Find-it game: tap the details on the piece (2026-11-21, branch hassan/H11-find-it, H11 with J5)
- What: in Up close the visitor finds each recorded detail by tapping it on the 3D scan. The list shows the clues
  without numbers, and a line under the count says how to play. "Show me" is now "Hint". It appears only after a first
  wrong tap or 20 s without a find. A hint turns the piece and rings the area around the detail, off-centre, and a tap
  anywhere in the ring counts. A wrong tap gets a ripple and a helpful line ("Close. Look a little nearer.",
  "Nothing left to find on this side. Turn the piece."). A find opens a card on the scan with the record's Dutch words
  large, the English below and "Now find it on the real piece in front of you." The last find's card has "Win its
  fabric". Found marks on the piece are plain dots. Before all are found, the bottom button never shows the answer.
- Why: feedback 2026-11-21. Visitors tapped "Show me" in the list and only then saw the detail on the piece, so the
  list was the way in, not the scan. J5 (no order numbers, the record's words large, then the real piece) is the same
  flow, so Hassan took it over from Basil and it lands here.
- Decision: the scan comes first and the text is a hint. Hints stay so nobody gets stuck (D2). The ring shows an area,
  never the spot. Quotes are the record's own (`details[].quote`, unchanged). Not done: J5's "then the next piece to
  win" belongs on the Won card in `atelier.html`, outside this ticket, so it is left for a follow-up. Checked in Chrome at
  390 px on ST2435 and ST81190, front and back; not on a phone.

## Way in to the CLO models (2026-11-21, H14, branch hassan/H14-clo-links)
- What: a piece with a MoMu CLO model (`assets.clo`) links to its page. Fact card: a "See it on a mannequin" button
  under "See it in 3D", for won pieces (furisode, jak, knee breeches, coat, kaftan). Up close: the same link under
  the fabric button for the two study pieces (coat, kaftan). `outfit.html`: "My look" steps back to the Stage
  (`backTo`) instead of stacking a new one.
- Why: the five pages opened by address only.
- Decision: reuse the fact card's ghost button and Up close's underlined link; no new styles beyond one `.more` rule.
  A locked piece shows no link (it is won first). The card-scan flow is unchanged: a scan leads to the Won tab or Up
  close, and the link is one tap from there.
## MoMu branding on every main screen (2026-11-21, branch hassan/H10-branding)
- What: a stacked "MoMu / old name" lockup replaces the plain old name in the Stage bar and the Up close header
  (`.momu` and `.brand.lockup` in `theme.css`); the share card PNG carries the same "MoMu" wordmark at the right end of its "old name · date" row (H12);
  copy names MoMu where it said "the museum" (Found at MoMu on the story and quiz sheets, Find it at MoMu, Win it at
  MoMu, At MoMu, Win pieces at MoMu); page titles end in "· MoMu"; Up close loads "MoMu's 3D scan".
- Why: feedback round 2026-11-21, "Add more MoMu branding". The app read as the old name with MoMu only in small credits.
- Decision: a typographic wordmark ("MoMu" in its own mixed case, Hanken Grotesk 600, black as on momu.be), not a
  logo: neither the repo nor MoMu's hackathon presentation template holds an official logo file, and we do not draw
  one. Red stays for titles only. Fact card left as it is: it already says MoMu study collection, MoMu says, MoMu record.
  Checked in Chrome at 390 px (Stage, story, fact card, share card, Up close), console clean; not on a phone.
## Personal share card (2026-11-21, branch hassan/H12-share)
- What: the share sheet has an optional name field. The card now reads "<Name>'s look across N years" (without a name:
  "A look across N years"), stands the form in the period room of the look's middle year (`scenes.js`), shows the date,
  the pieces worn with years, the pieces won (`atelier.won.v1`) and one line from a worn piece's story (the curator's text
  first, else the first sentence of the MoMu record in `narration.json`, credited as the record). Name: max 20 characters,
  stored in this browser only (`atelier.name.v1`), the card re-draws 400 ms after typing stops. Still 1080x1920.
  Only `share.js` and `share.css` changed; `atelier.html` is untouched.
- Why: feedback 2026-11-21, sharing should feel personal to the visitor.
- Decision: no account, no upload, no name sent anywhere (D2); every fact still comes from `pieces.json` or the records (D3);
  "Won" lists the pieces won, not "today", because no win date is stored. The sheet does not autofocus the field, so the
  phone keyboard stays down until the visitor taps it.
## Narrated stories on the story sheet (2026-11-21, branch hassan/H13-narration, ticket H13)
- What: every piece (19, the curator's 3 included) has a short spoken story in the new `mockups/narration-scripts.json`:
  an audio-guide scene of about 30 to 40 seconds (a hook, the history, a detail to look closer at), replacing the
  read-out record drafts. The story sheet opens with the photo settling in (scale, blur and fade, 900 ms) and the lines
  rising in one after another; while the story plays the photo drifts slowly and the captions light up word by word
  under a red highlighter stroke, following the voice (audio: timed by word length and pauses, or by `revealAt`; phone
  voice: its own word boundaries). Before a Guess the year the beat that names the date is left out and the narration
  ends on a question (`tease`). "Read the story" opens the full captions and, on the curator's pieces, her own story word for
  word. `tools/narration_facts.py` checks each script against the harvest cache and the curator's text.
- Why: feedback 2026-11-21: narration on the look instead of the amount of text; then Hassan: poetic does not mean a
  poem; make it immersive and entertaining, not the app's text read out, with the voiceover highlighting the text, a
  small animation as the popup opens, and real history (the grey coat's first collection).
- Decision: facts only from each piece's record or the curator's story (D3), each listed beside the source's own words; the
  checker fails if those words are not in the source, a number is not in it, or a wearable says its date before the
  guess. The grey coat's script says "first collection" (record and the curator), not "first fashion show" (in neither). the curator's
  own text is never changed. Old text beside each new script in `docs/H13-NARRATION-REVIEW.md`. Audio: all 19 need
  voicing in the same voice (Picsart Adeline, manual export); until then they play in the phone's voice, highlight
  included. Also: H12's share card credits a narration line to the piece, not to "MoMu's record".
- Reduced motion: no scale, blur, drift or rise; fades only. The muted upcoming words stay at 7:1 (AA).
- Voiced (2026-11-22): all 19 scripts in Picsart's Adeline, the app's one voice (AI Audio Generator, about 115 credits;
  MP3s from Picsart's CDN, converted to mono AAC, 4.1 MB). Each file transcribed back locally (new
  `tools/narration_listen.py`, faster-whisper base.en in `.venv`): 91 to 100% of each script heard, no extra speech
  beyond the transcriber's spellings of names and numbers. The same pass measures each beat's start (`narration.py
  --cues`, kept in `tools/narration-cues.json`), so the caption highlight follows the real voice per beat, and a
  wearable stops right before its date (`revealAt`; the jak stops at 0:34, after "striped white and yellow").

## MoMu's own CLO models on the outfit page (2026-11-21, branch hassan/momu-clo-pieces)
- What: five pieces that have a MoMu CLO project are shown on `outfit.html` on MoMu's mannequin: furisode ST80881,
  jak ST503, knee breeches ST2062, riveted coat ST81190, bridal kaftan ST80998 (`outfit.html?card=<id>`). Each has
  `assets.clo` with its own body file (`assets/clo/<id>.glb` + `<id>_body.glb`, about 10 MB in all). New
  `clo/obj2glb.mjs` splits a CLO OBJ export (Multiple Objects, Thin, mm) into garment and mannequin GLBs; then
  `clo/optimise_glb.mjs`. The page now picks the body from the piece (`assets.clo.avatar`), lists the pieces draped on
  that body, frames a static mannequin by its own box, and takes its title and credit from the piece.
- Why: the team wants every piece it can as a draped CLO garment. MoMu's projects are draped on MoMu's mannequin, sized
  and posed per project (1.55 m to 1.88 m, some arms out), so they do not fit the team avatar as exported.
- Decision: show each on the body it was draped on rather than re-drape (no simulation by us, nothing fitted, D5).
  Exported from CLO by hand-confirmed OBJ export: the clo3d-mcp GLB export fails on CLO 2026.1. Not done: no way in
  from the wardrobe or card scans yet; cavalry uniform ST2431 left out (its project holds part 1 of 4, undraped).
  Caveat: ST81190, ST80998 and ST2431_1 `.zprj` were re-saved on 2026-11-21 while our dropped CLO sessions had them
  open; they carry MoMu's mannequin and pattern names, but a fresh Drive copy would confirm they are unchanged. Coat
  included on Hassan's say. The 11 other pieces have no CLO project.

## the team's cycling outfit on the avatar (2026-11-21, branch hassan/team-models)
- What: the team's CLO blouse (ST81114AB) and trousers (ST81116) are worn on the team avatar on a new page,
  `mockups/outfit.html` (OutfitRig, toggles per piece, front / side / back). Scanning either card shows its story, then
  "See it on the avatar" opens the page with that piece on; before, both cards said "This sticker isn't in the app yet".
  Assets in `assets/clo/`: `ST81114AB.glb` (3.5 MB -> 1.43 MB), `ST81116.glb` (3.3 MB -> 0.72 MB) and
  `ST81114AB_in_ST81116.glb` (1.33 MB, the blouse with its tail cut below the waistband, shown when both are worn).
  Built with `clo/optimise_glb.mjs` and `clo/tuck_glb.mjs` (byte-identical on a rerun). `avatar_web.glb` is unchanged:
  the team's `avatar.glb` is the same body (all 94 shared bones at the same positions).
- Why: the team dropped its own CLO builds; the team's models are the source. His two files come from one drape with the
  blouse tucked in, but worn together in the app the hidden blouse tail showed through the trousers.
- Decision: static GLBs, nothing simulated in the browser. Layering is solved by a variant with the hidden part removed
  (`assets.clo.variants`), not by moving cloth, which tore the meshes. The trousers' colour texture is plain black, so
  a soft sheen (KHR_materials_sheen) is baked in to let the folds read; replace it when the team exports the denim maps.
  Schema: `assets.clo` is back (removed with the coat reconstruction) with an optional `variants` list. The coat is not
  part of this. MoMu's own project `ST81114ab.zprj` holds the same look on a shorter, arms-out mannequin and does not
  fit the team avatar as exported.
## Storytelling backgrounds behind every 3D view (2026-11-21, H7, branch hassan/H7-story-backgrounds)
- **What:** the Stage, the full-screen 3D view and Up close no longer show the piece on white or grey. Each stands in
  one of six period rooms (`mockups/assets/scenes/*.svg`): a candlelit salon (to 1799), a gaslit iron-and-glass arcade
  (to 1889), an art nouveau doorway (to 1919), an art deco proscenium (to 1949), a modernist room (to 1969) and a
  concrete runway (after). `mockups/scenes.js` picks the room from the middle of the piece's dated span in
  `pieces.json` and cross-fades when it changes; `scenes.css` fades the top of the room to paper under the title.
  On the Stage the room follows the look's main piece (full, else top, bottom, feet). Up close's renderer is now
  transparent so the room shows behind the splat.
- **Why:** feedback round 2026-11-21: no white backgrounds; the 3D views should be set in a scene that tells the
  piece's story, to go with the poetic narration.
- **Decision:** hand-drawn SVG rooms, light and low in contrast, so garments stay the brightest, sharpest thing on
  screen and the red titles keep AA contrast; chosen by date only, with no label, because the room is atmosphere, not
  a fact about the piece (D3). No `pieces.json` schema change; a per-piece `scene` override can come later
  (Change policy: heads-up first).
- **Checked:** at 390 x 844 in Chrome: all six rooms behind the furisode on the Stage; wearing the green wool coat
  switches the Stage to the arcade; the coat's 3D view shows the arcade; Up close on the sequin silk dress shows the
  art deco room behind the splat; console clean. Reduced motion shortens the cross-fade to 200 ms.

## Wearable scans (2026-11-21, branch basil/wear-scans)
- What: `mockups/tools/garment.py` turns a piece's splat scan into a wearable GLB (or runs the TRELLIS photo route) and
  registers it. All 9 scan pieces (coat ST81190 as a top, the other 8 as full looks) now wear as themselves once won,
  and appear in their slot's tab. New `wear` field and `fit.split`, `pipeline.mesh` in the schema.
- Why: Basil: a won coat shown on another coat's cut "looks nothing like" the real piece; Higgsfield images for every
  combination would cost about 40x the credit cap.
- Decision: real cut from MoMu's own scans; fabrics stay textures on the mesh. CUT_OF stays as the fallback for
  pieces not run yet. Doc: `docs/WEARABLE-PIPELINE.md`.

## 2026-11-21

### Gamification findings doc in the repo (branch basil/gamification-findings)
- **What:** `docs/GAMIFICATION_FINDINGS.md` (museum gamification research, how the old name maps to it, open ideas) is now tracked, refreshed against `main` at 8fb18f6; the research log row points at it.
- **Why:** the research log listed this doc as "location unknown". Open ideas are for Hassan to pick up or drop; nothing in the app changes.

### Brighter cavalry uniform; unreached texels no longer bake black (branch basil/wear-scans)
- **What:** ST2431/1-4 rebuilt with `satk` 2.0 and `matchk` 0.85, so its blue is close to the photo. `garment.py` now leaves texels no splat reaches (composite weight under 0.05) to the gutter fill instead of baking them black; the other GLBs are unchanged until rebuilt. `requirements.txt` pins the pipeline's packages.
- **Also:** `AGENTS.md` drops the rule against using a second HF account for TRELLIS quota (Basil, 2026-11-21).
- **Checked:** uniform worn on the Stage in desktop Chrome, front and side; console clean.

### Won fabrics go on the nearest cut; the fact card warms the scan (branch basil/won-cut)
- **Problem (Basil's phone):** the won riveted wool coat showed as a dress, because every won study fabric went on the cocktail dress cut. He also asked whether the piece card loads the 3D scan and whether closing it cleans up.
- **What:** `CUT_OF` in `atelier.html` maps each study piece to the wearable whose cut is nearest: the coat and both uniform jackets on the green wool coat, the five dresses and the combinaison on the cocktail dress, the bridal kaftan on the kimono. Still one "Won" chip; its × takes off that cut and its cloth only, so boots added afterwards stay. The fact card of a study piece whose scan you have opened before now starts the scan download quietly after 2 s at low priority ("See it in 3D" opens it); closing the card aborts it. Before, the card loaded nothing.
- **Decision:** the map lives in the page, not in `pieces.json`, to avoid a schema change before the demo; move it to a `cut` field later (Change policy: heads-up to Hassan).
- **Checked** headless Chromium at 390 x 844: coat on the coat cut, sequin dress on the cocktail dress, kaftan on the kimono, each one chip; adding boots then × on Won leaves the boots; fact card requests the `.sog` about 2.9 s after opening on a slowed network and aborts it on close.

### Win and wear: the claim lands, a win goes on alone, the story stays (branch basil/win-and-wear)
- **Problems (Basil's phone):** "Win its fabric" on the riveted wool coat landed on a blank sheet that only said Top; the "you won" card then popped up later on another piece; "Wear it now" put 2 or 3 pieces on ("Jak in riveted") and × took them all off; won pieces only showed under Fabrics; a won piece's audio tour was gone; the scan took about 5 s.
- **Causes:** back from Up close returns to the `?card=` page, which parks before the wardrobe is drawn and before its page-restore handler existed, so the phone showed that frozen copy and the claim waited in sessionStorage for the next boot. A study win is a fabric and was painted onto whatever top was worn. Splat pieces have no GLB, so only the Fabrics tab listed them. A won piece's sticker and Museum tile skipped the story.
- **What:** the page-restore handler now sits before the first `await` (a restore before boot finished, or with a win waiting, reloads). The Won card waits at most 400 ms for `records.json`. "Wear it now", and a tap in the new **Won** tab (first tab, shown once something is won), puts that one piece on by itself: a garment in its slot, a study fabric on the cocktail dress cut (body and sleeves), shown as one chip with one ×. The sticker or Museum tile of a won piece plays its story and audio again, then opens Won. Load order: the popup's scan download waits 2 s and goes at low priority; on a `?card=` page the story's audio file is fetched before the scan, which no longer asks for high priority; Up close releases its splat, controls and WebGL context on `pagehide`; the preloaded GLB blob URL is revoked after loading.
- **Decision:** both games stay (Basil, 2026-11-21: Guess the year for wearables, find 3 details for study pieces). Flow map and bug list: `/mnt/project-files/win-and-wear/flow-map.md`; research log row in `docs/RESEARCH-LOG.md`.
- **Checked** headless Chromium at 390 x 844: study claim shows the Won card, Wear it now gives one "Won Riveted wool coat ×" chip and × leaves nothing on; Jak scan, guess, Wear it now gives "Top Jak" only; rescanning the Jak and the coat's Museum tile replay the story with the player; a simulated restore of the parked page reloads; `.m4a` is requested before `.sog`. Not checked on a real phone or with a real back-forward cache.

### First look: the furisode kimono (branch basil/first-look)
- **Problem (Basil's phone):** the default first look, green wool coat, Monpe trousers and boots, showed scan debris to every new visitor: a torn-looking collar and lapel, stray green fragments at the hem, boots half buried in the trouser hem.
- **What I tried:** the coat's texture shows no cleanable bleed left (a grey-patch rule refilled 1.5% of texels and changed nothing visible), so the torn collar is mesh geometry, which only a regenerated scan fixes (GPU quota, ask first). The red band at the waist is the coat's real red piping in the MoMu photo, so it stays.
- **Decision:** the first look is now the furisode kimono (`full: ST80881`). Checked front, side and back at 390 px: no clipping, no stray fragments, console clean. The wardrobe opens on the Full tab to match, a saved look still wins on later visits, and wearing a top still clears the kimono. Before and after: `docs/first-look/before-after.jpg`.
- **Not changed:** the coat, trousers and boots are still in the wardrobe; their scans are unchanged. The kimono's hem ends above the boots, so no feet are worn by default.

### A7 reconstruction removed: Up close is splat-only again (branch hassan/A7-remove-reconstruction)
- **What:** the Archive / Compare / Wear it control from PR #26 is gone from `up-close.html`; the coat ST81190, like every study piece, shows only MoMu's Gaussian splat with its detail hunt. `pieces.json` drops ST81190's `assets.clo` and `pieces.schema.json` the `clo` field; `preload.js` no longer warms the CLO coat and avatar after the splat. `mockups/reconstruction.js` and `assets/clo/ST81190.glb` moved to `_to_delete/`. Also restores the H6 comment on `up-close.html`'s `nav.js` import, which had absorbed the old A7 comment in a merge.
- **Kept:** `clo/outfit.js` and `assets/clo/avatar_web.glb`, for the team's avatar, blouse and trousers (`hassan/team-models`).
- **Why:** Hassan: the CLO reconstruction changes the fabric, so it misrepresents the piece; the archive object is the splat. The team has also stopped making its own CLO garments: models come only from the team.
- **Decision:** A7 is cut in `LEDGER.md`; D1 and D5 are unchanged (neither named the coat).

### One narration voice throughout (branch hassan/H3-one-voice)
- **What:** the 3 stories still in Gemini's voice (ST81190, ST503, ST80930) are re-made in Picsart's Adeline, so all 19 now share one voice. Made from the story text alone, like the rest.
- **Checked:** every file transcribed back: none contains the old style line ("Read this aloud in a calm, warm voice..."), and the words match the story (83 to 97%; the gaps are numbers like "9th" heard as "ninth").
- **Script:** `narration.py --force` with `--only` treats chosen pieces as missing, so `--scripts` and `--import` can redo them (for example to change voice).

### A9 follow-up: kimono leg gap, dress lift, coat collar (branch basil/A9-avatar-polish)
- **Kimono leg gap:** MetaPerson's body has no legs under its own clothes, and the avatar's outfit was hidden whenever a
  full piece and boots were on. The furisode ends at the shin, so the shins between hem and boots were empty. The outfit
  now hides under a full piece only when its hem reaches the boots (under 10 cm); under the kimono the avatar's jeans
  show at the shin instead of a gap.
- **Also:** the cocktail dress lifts 3 cm on the avatar (its shoulders sat under the avatar's); the coat's neck cut also
  drops pale grey and white texels near the centre line (a rag of the form's cover in its collar), and each piece in
  `FORM_CUT` can set its own colour tolerance.
- **Decision:** dress-form rendering is unchanged (the cut runs only on the avatar).

### Narration from the story text alone (branch hassan/H3-narration-text)
- **What:** `tools/narration.py` now sends the TTS only the story text. The old prompt put a style line before it ("Read this aloud in a calm, warm voice..."), and the model read that out. Every story is re-voiced; durations are shorter because the "unhurried" pace hint is gone.
- **Hash:** the audio hash is now the text alone, so a file is remade only when its story changes, whatever voice made it. Each piece records its `voice` (`gemini:<model>:<voice>` or `picsart:<voice>`).
- **Fallback provider:** `--scripts DIR` writes the exact text for every piece still missing audio, and `--import DIR --voice "picsart:<name>"` adopts files voiced elsewhere (Picsart text to speech when the Gemini free quota is spent), converting them to the same mono AAC 48 kbps.
- **Decision:** no style or pacing instructions in TTS input at all; tone comes from the choice of voice.
- **Result:** all 19 stories voiced (3.2 MB). Gemini free quota covered 3 (ST81190, ST503, ST80930, voice Sulafat); the other 16 were made in Picsart's AI Audio Generator, voice Adeline, exported as MP4 and imported (audio track only). Spot checks by transcribing back: 94 to 97% word match (differences are "9th" read as "ninth" and similar). English only.
### Show only the form (branch basil/focus)
- **What:** a button under the zoom controls hides the header, the look title and the wardrobe so the form fills the screen; the same button (its icon turns to "shrink") or Escape brings them back. Zoom stays available.
- **Why:** owner: an easy way to collapse the menus to see the whole avatar on a phone.

### Lighter, cleaner 3D models (A5, J1, J3; branch basil/ar-button)
- **What:** every wearable GLB's texture is now WebP (q85, `EXT_texture_webp`) via `tools/glb_webp.py`: 12.2 MB to 4.9 MB for the 7 models, the starter look 5.4 MB to 2.3 MB. The monpe ST80931 lost its baked tan mannequin-hand strips and white patches, and the ikat vest ST80930 its large white blobs, with `tools/clean_glb_texture.py` (replaces `clean_glb_white.py`; rules `white`, `blobs` (large patches only, so pale print dots survive) and `tan`; `FIXES` records what each GLB got). `tools/glb_io.py` is the shared GLB reader and writer. Tile images load lazily and the page preconnects to the CDN. Originals are in `_to_delete/`.
- **Why:** the speed audit measured the PNG texture as 60 to 70% of each GLB and the starter look as the critical path; the 3D audit found the bleed. Checked on the Stage front, side and back and in the 3D view; console clean.
- **Decision:** WebP over a GPU rerun or KTX2: no decoder to add, three and model-viewer read it natively. Not done: the jak's mannequin chest (J7, needs a TRELLIS run), the boots' beige areas, the cocktail dress's dark recolour, meshopt geometry.

### Quick fixes and data guards from the audits (J2, J6; branch basil/ar-button)
- **What:** the fact card has a close button; tapping a locked wardrobe tile opens the sticker prompt instead of nothing; a re-tapped study sticker whose fabric is won says it is already in Fabrics instead of replaying the story and challenge; New badges survive a reload (`atelier.new.v1`); "Simulate NFC tap" reads "Demo: tap the sticker"; the fabric toast says Fabrics. Guards: a piece without a photo id falls back to its swatch instead of crashing the app; a splat piece without details still opens Up close; the wardrobe count counts only wearable pieces; a saved look never restores a piece without 3D.
- **Why:** found by the button-map and data audits; each checked at 390 px in Chrome.

### A prize can be worn straight away; every owned piece opens in 3D (branch basil/ar-button)
- **What:** the Won card offers **Wear it now** (primary) or **Keep it in my wardrobe / fabrics**. Wear it now puts a won piece on, or a won fabric on the body of what you wear; on a bare form a fabric first puts on a full-length cut you own (the kimono), so it never needs "put on a top first". Tapping a fabric on a bare form does the same. **See it in 3D** shows for every piece you own: a study piece opens its Up close scan (its only 3D), an unwon room piece stays closed (D2).
- **Why:** owner: you win a whole dress, but its fabric needs something on, so on a bare form the prize went nowhere; and some fabrics opened in 3D while others silently did not.
- **Decision:** a prize always lands somewhere visible; a fabric needs a cut, so the app picks one rather than asking the visitor to.

### AR button centred (branch basil/ar-button)
- **What:** "See it in your room" is our own button below the 3D view (centred with margins, 340 px max), shown when model-viewer reports AR can start, instead of a button in model-viewer's `ar-button` slot.
- **Why:** owner: the black button was not centred; model-viewer positions its slot itself, so our centring did not apply. Margins, not `transform`, because `.press:active` sets `transform`.

### H6 Navigation, PR 1: the back gesture closes the top layer (branch hassan/nav-ux)
- **What:** new `mockups/nav.js`. Every modal `<dialog>` (help, fact card, Ask, share, Museum, NFC popup, story, Win it, See it in 3D, and any dialog a module adds later) gets one browser history entry while it is open, so the phone's back gesture closes that layer instead of leaving the site. Back behaves like Escape: the dialog's `cancel` fires first, so Win it, which refuses Escape, also refuses back. A dialog closed by its own button or the backdrop takes its entry off again; dialogs that hand over in one go (story to Win it, fact card to Ask) share one entry. No module calls it: it watches the `open` attribute. Up close: the story of a study card now leaves the Stage under Up close (its URL cleaned first), so back from Up close lands on the Stage; ← steps back instead of loading a new Stage (back no longer returns into Up close); once all three details are found, Up close steps back to the Stage and hands it the fabric through `sessionStorage` (`atelier.claim`), and `?fabric=` still works when there is no Stage behind it. A Stage shown again from the back-forward cache reloads only if details were found or a fabric won meanwhile. Audit and map: `docs/UX_AUDIT.md`.
- **Checked** (Playwright Chromium, 390 x 844): back on help, fact card, Ask, share, Museum (and Museum closed by its button), 3D view: each closes and the Stage stays; help no longer reappears after leaving by back. `?card=ST503`: back on the story goes on to Win it (as Escape does today, PR 2 changes it), back on Win it stays. `?card=ST81190`: story, Up close, back lands on the Stage; forward, ←, back: no loop. All details found: Won card on the Stage, no leftover entry. Console clean; Impeccable detector 0 findings on both pages.
- **Why:** audit finding 1 and 2: back left the app from every layer and looped through Up close (P0, P1).
- **Decision:** one generic watcher rather than hooks in each module, so other people's dialogs (Basil's NFC popup, Museum, 3D view, Win it) get the behaviour without their code changing. `?fabric=` stays as the URL contract; the claim key is an addition, not a replacement.

### A7 Archive vs Reconstruction: the CLO coat ST81190 on Up close (branch hassan/A7)
- **What:** Up close for the A.F.Vandevorst coat ST81190 gets a segmented control over the 3D view: **Archive** (MoMu's splat, the detail hunt as before), **Compare** (a slider: the splat left of the handle, our CLO reconstruction right of it, through the same camera; the reconstruction is laid over the scan at the same spot and height, and wipes in once when Compare opens) and **Wear it** (the CLO coat on the team avatar it was draped on, front, side and back by dragging; a pill takes it off and puts it back on). New `mockups/reconstruction.js` holds all of it; `up-close.html` gets five one-line hooks. `mockups/clo/outfit.js` (OutfitRig) comes unchanged from `hassan/clo-st81190`.
- **Data:** `pieces.json` ST81190 gains `assets.clo` (`path`, `avatar`, `kind: "clo"`, `units: "m"`, `origin: "avatar"`, `onScan` = where hem and collar sit on the splat box, for the overlay); `pieces.schema.json` allows it (optional, study pieces only use it). Assets: `assets/clo/ST81190.glb` (1.1 MB, byte-identical to the CLO build) and `assets/clo/avatar_web.glb` (0.55 MB: the team's 3.5 MB CLO avatar without teeth and lashes, 40% of its triangles, quantized; still skinned, so it is drawn in the pose the coat was draped on).
- **Preload (H5):** a `?card=` scan of a piece with `assets.clo` also warms the two GLBs after the splat (never beside it) and module-preloads the reconstruction scripts. On Up close itself the GLBs load only once the splat is on screen.
- **Measured** (Playwright, Fast 4G 9 Mbit/s, 60 ms, cache off, 390 px): splat on screen 16.6 s, coat ready 17.6 s, avatar ready 18.2 s, so Compare and Wear it are ready about 1.6 s after the scan; a Wear it tap then takes 0.5 s. Chrome at phone width: card scan, popup, Study it up close, Compare (drag), Wear it, side and back, Take it off, Show me returns to Archive; console clean. Other study pieces (ST2435) show no control; the Stage is unchanged.
- **Why:** the coat is the piece the museum cares about; the demo needs the moment where the archived object and its reconstruction meet, then the visitor wears it.
- **Decision:** the CLO coat lives only on Up close with its own avatar; the Stage keeps the dress form, so D1 is unchanged and `atelier.html` is not touched (no collision with A9). The avatar wears the Stage's calico finish so it reads as a form. The whole CLO rig (avatar and coat together) gets one uniform scale into the splat's units for Compare; the coat is never fitted to a body, as D5 asks. No hand-draping: the known limits in `OUTFIT.md` stand (the coat over the balloon trousers is not used here, only the bare-avatar drape).

### See it in 3D, with AR inside (branch basil/view-3d)
- **What:** every wearable's fact card has **See it in 3D**: the piece full screen in model-viewer 4.0.0 (turn, zoom, auto-rotate). Inside it, model-viewer shows **See it in your room** only where AR can start, with WebXR first (in Chrome on Android), then Scene Viewer, then Quick Look. The hidden 1 px viewer and the phone check are gone; model-viewer loads on the first tap of See it in 3D.
- **Why:** owner on a Pixel 9 with Chrome: the AR button jumped to another screen and went nowhere (Scene Viewer handoff failing). WebXR runs inside Chrome but must draw a visible viewer, which the hidden one was not.
- **Decision:** AR as an extra inside a visible 3D view, so a failed AR start leaves the visitor looking at the piece instead of a dead screen.

### the curator's cycling blouse and trousers in the app (branch hassan/curator-stories)
- **What:** her Notion page "Story and Questions" now has three pieces. `questions.json` adds the blouse ST81114AB (4 questions) and trousers ST81116 (3, all taken: her page has no "pick 3" there); ST81190 is unchanged on her page. Each piece is marked `source: "curator"`, and `questions_sync.py --check` requires it: her answers may be things to observe on the garment (count the seams), not record fields. The parser now reads her new list styles (answers without "Answer:", HTML `<ol><li>` lists). `pieces.json` gets two minimal entries (top and bottom, 1890-1920, record photo, `locked`, no 3D file yet), so `records.json`, `ask-records.json` (Ask the archive) and `narration.json` cover them; `records.py` carries our English for each record's first sentence.
- **Why:** the team's CLO blouse and trousers are being wired in next to the coat (A7); their stories had to be ready.
- **Decision:** no 3D file yet, so the pieces stay hidden from the Museum and their sticker says "isn't in the app yet" until A7 sets `assets.glb`. A7 owns how they are worn; this branch adds no GLB, slot logic or rig. Narration audio for the two is not generated yet (the phone's voice reads them); D-3 (NL / FR) is not on `main` and must re-run for the new text after both merge.

### The wardrobe sheet can no longer be dragged away (branch basil/sheet-drag)
- **What:** a drag below the sheet's peek now meets the same 0.3x resistance as a drag past fully open, and `lostpointercapture` ends a drag like `pointerup`, so the sheet snaps back. model-viewer (AR) loads only on Android or on Safari with Quick Look (`rel="ar"`), not on laptops. "Also in" links skip pieces with no 3D (the hidden knee breeches). AR opens Scene Viewer or Quick Look directly (WebXR dropped: owner tapped "See it in your room" and nothing happened, since WebXR must draw the hidden viewer), and the viewer sits at 1 px instead of display: none.
- **Why:** owner: while moving the sheet it disappeared until a reload; nothing kept a drag above the bottom edge, and a release lost outside the window left it there. The site also felt slower: every fact card loaded model-viewer, a second three.js and a second renderer, even where AR can never start.
- **Decision:** clamp with resistance rather than a hard stop, matching the top edge.

### Design detector findings fixed, design rule in CLAUDE.md (branch hassan/design-findings)
- **Stage look title:** red `#d72f25` on the grey wall was 4.1:1; `.stage .credit .t` now uses `--accent-ink` (`#c00000`, 5.5:1) in `theme.css`. No change to `atelier.html`, which Basil has open in PR #21.
- **`splat-stage-spike.html`:** the cream wall became the app's grey wall `#ededed`, black ink and the theme hairline, so splats are judged on the colour they ship on.
- **`recon/hackathon_assets.html`:** flat type hierarchy and a skipped heading level belong to the saved copy of a momu.be page. It is evidence, so it is not edited; both rules have a narrow ignore for that file in `.impeccable/config.json`.
- **Rule:** `CLAUDE.md` now says to run `/impeccable` and `/emil-design-eng` and follow design best practice for any design decision (Hassan).
### Polish sweep at phone width (branch basil/polish)
- **What:** "See it in your room" (AR via model-viewer 4.0.0) is back, now on every wearable's fact card, shown only when the phone can start AR. The green wool coat ST2434's texture is cleaned of white mannequin bleed by the new `tools/clean_glb_white.py` (12% of texels refilled from nearby cloth; the cutout photo has no white of its own; original kept in `_to_delete/`). An unwon room piece no longer gives its year away: its fact card shows "Win it to find out", hides Ask, and offers "Find it in the museum"; the story hides the narration player before Guess the year. Fact cards lead with our English and show the Dutch original small. Museum: title and "0 of 11 won" on separate lines, tiles say "Still to find" or "Won". Guess hints name the guess ("Later than 1700"). Up close says "Win its fabric". The story title uses the app's name for the piece (the curator's heading "A.F. Vandevorst Jacket" vs "Riveted wool coat" everywhere else). Help step 2 explains winning pieces. The share card uses the Stage's look name and fits a 667 px phone with Close on screen; the fact card's button row wraps. Pieces with no 3D file (the knee breeches ST2062) are hidden from the Museum and the wardrobe: their sticker had nothing to show.
- **Why:** owner asked for a sweep for bugs and inconsistencies until none are left; each item was found in Chrome at 390 px.
- **Decision:** a year is never shown before its guess, anywhere; English first because the audience reads English; AR only where the device supports it, rather than a button that fails.

### A won fabric is easy to find (branch basil/fabrics-clarity)
- **What:** the Remix tab is now **Fabrics** (tab, sheet title, help text, toast "New in Fabrics: ..."); the Won card's button says "Add to my fabrics" or "Add to my wardrobe". A piece or fabric won this visit sorts first in its tab, the grid scrolls to the top, the chosen tab chip scrolls into view, and long toasts wrap.
- **Why:** owner: after "Add its fabric to my wardrobe" it "goes nowhere". The new swatch was the last tile below the fold, the Remix chip was cut off at the right edge, and the toast ran off the phone.
- **Decision:** one name for one thing: the place fabrics live is called Fabrics everywhere it appears.


### Working rule: PRs need no review (branch hassan/drop-review-rule)
- **What:** `AGENTS.md` no longer says the other person reviews and merges a PR. No review is needed, but a PR is merged only on its developer's say, never automatically; agents ask first. Claims and `HANDOVER.md` updates may still go straight to `main`.
- **Why:** Hassan: nobody needs to review. Mubasil still deploys alone (unchanged).

### H5 Preload the scanned piece's 3D file on card scan (branch hassan/nfc-preload)
- **What:** new `mockups/preload.js`. As soon as `?card=<id>` is in the URL it fetches that one piece's 3D file: the `.sog` splat for a study piece, the GLB for a wearable. Study pieces also get `modulepreload` for Up close's two scripts (Spark, OrbitControls). The popup's article image is warmed first (small, high priority) and the 3D file follows right after it (at most 1.5 s later), so the 15 MB file never starves the image. Skipped on Save-Data. Nothing else is preloaded and no splat is parsed early, so memory (A6) is untouched.
- **Study pieces:** the bytes are streamed into the HTTP cache and dropped; Up close's Spark loader then gets a cache hit (Vercel serves `assets/` with `max-age=86400`). Chrome cancels a running download when the page navigates, and `keepalive` does not prevent it (measured), so `atelier.html` awaits `preload.handoff(id)` before jumping to Up close: instant when the file is ready, otherwise a one-line "Getting the scan ready 43%" over the page until it is.
- **Wearables:** the GLB bytes are kept as a `Blob` and `loadGlb` loads that (`preload.glbSource`), because two simultaneous requests for one URL are not merged by Chrome (measured: the file was fetched twice).
- **Hooks in `atelier.html` (3 lines):** one `<script type="module" src="preload.js">` after the import map (it reads `?card=` itself, so it starts before the page's CDN imports resolve), `await window.momuPreload?.handoff(scanned)` before the Up close jump, and `loadGlb` using `glbSource`. The popup's markup and styles are untouched.
- **API for the popup** (`window.momuPreload` or `import { preload } from "./preload.js"`): `status(id)` gives `{ state, kind, loaded, total, fraction }`; `ready(id)` is a promise (true when cached, false when skipped or failed, never rejects); `on(fn)` and the `momu:preload` window event fire on every progress step. States: idle, waiting, loading, ready, error, skipped.
- **Measured** (Chrome, local server throttled to about 1.1 MB/s plus 150 ms latency, a fresh URL per run so the cache is cold, `?card=ST81190`, tap on "Study it up close" to the splat visible): cold Up close 19.4 s; with preload and the tap after the download finished 1.9 s; tap at 23% of the download 16.6 s (19.3 s without the handoff wait, 19.0 s with `keepalive`). The server saw one splat request per run. Wearable `?card=ST2434` (a piece that is not on the default look): on the form at 2.8 s, 3.4 s before; GLBs are small, so the gain there is about 0.6 s. Console clean.
- **Decision:** HTTP cache plus a short handoff wait over a service worker or an in-memory splat (15 MB must not be held on a phone), keeping up-close.html untouched.
### Stage: the form no longer covers the look title (branch basil/stage-overlap)
- **What:** the turntable now starts 8 px below the look title block on every layout (`--credit-h`, set by a ResizeObserver on `.credit`), instead of a fixed 420 px box measured from the sheet. Locked wardrobe tiles say "Win it in the museum".
- **Why:** owner screenshot: with the new starter coat the form's neck drew over "Spans 210 years" in the desktop mockup, and stayed there when the sheet opened, because the title wraps to 3 lines.
- **Decision:** measure the title rather than pick a bigger fixed offset, since look names change length as you remix.

### Win it: one flow from the sticker to the wardrobe (branch basil/study-wardrobe)
- **What:** a sticker on a room piece (`?card=<id>`) now runs story, then one challenge, then a **You won it!** card with the photo, real date and the record's description, then **Add it to my wardrobe**. Wearables are won with **Guess the year** (`mockups/win.js`: a slider, within 25 years wins, "Earlier"/"Later" hints, the third miss wins anyway); study pieces with Up close's find-3, and the claimed fabric gets the same Won card. Won pieces wait in the wardrobe marked New, not on the form. Wins persist in `atelier.won.v1`. The jak ST503 is now a room piece (`locked: true`); the starter look wears the green wool coat ST2434. The story sheet leads with the piece photo, folds long text behind "Read the whole story", and hides the years before Guess the year. Its text is trimmed on screen: a 3-line teaser, a one-line "From the MoMu record" label for drafts, and the drafts' lead-in dropped (the audio is unchanged; the curator's wording is never edited). the curator's questions (C2) are out of the tap flow. The kimono-only Piece screen and its Learn button are removed. Self-check: `node mockups/tools/win_check.mjs`.
- **Why:** owner: the flow needed to be simple and show the vision, gamified finding of pieces that then go into your digital wardrobe; the NFC test on ST81190 showed a long wall of text with no image.
- **Decision:** one challenge per kind of piece, nobody can lose, no points or streaks (findings doc: rewards and immersion drive learning, competition does not). D2 changed. Spec: `docs/superpowers/specs/2026-11-21-win-it-flow-design.md`.

### Study pieces: Museum view, claimed fabric goes to the wardrobe (branch basil/study-wardrobe)
- **What:** the Study tab left the wardrobe sheet; a **Museum** button in the Stage header lists the 9 study pieces (the exhibition, each with an NFC card in the room). An NFC tap (`?card=<study id>`) now shows the story, then the piece's fact card with **Study it up close**, instead of jumping straight to Up close. Finding the 3 details shows **Claim its fabric**; back on the Stage the fabric sits in the Remix tab marked **New** and is not put on the form. Taking off the top (or full look) now clears its fabric with the toast "Its fabric went back to your wardrobe".
- **Why:** owner feedback: claimed fabric went straight onto the current outfit, removing the top silently dropped its fabric (which then came back on the next top), and study pieces are exhibits to find, not wardrobe items.
- **Decision:** the wardrobe holds only what you own (garments and fabrics); the museum is where you find more. A study card now boots the Stage (wearable GLBs load) so its fact card can show; `?fabric=` keeps its name but no longer wears the fabric (D2 row updated).

### H3 Story screen with narration (branch hassan/story-narration)
- **What:** after a card scan the piece's story comes first, on its own sheet: name, years as a large serif number, a play/pause button (48 px) with progress and time, the transcript always on screen, then **Continue to the questions** (the curator's questions, no longer repeating the story) or straight back to the form / Up close when the piece has no questions. Audio never autoplays and downloads only on the first tap (`preload="none"`). Same sheet style as the quiz; reduced-motion safe.
- **Text, one source:** `tools/narration.py` writes `narration.json` (a derived file) from the curator's stories in `questions.json` (her text wins, as written) and, for pieces she has not written yet, a **draft built only from the MoMu record** (`records.json`: date, place, the record's description in our English translation, materials and techniques). Drafts say on screen "Draft built only from the MoMu record; the curator's story is still to come" (D3). Nothing is added from model memory.
- **Narration:** pre-generated at build time with Google Gemini TTS (`gemini-3.8-flash-tts`, voice Sulafat) using the existing Gemini key (`GEMINI_API_KEY` in `.env`, same key as `ASK_API_KEY`); mono AAC 48 kbps `.m4a` via macOS `afconvert`, in `assets/audio/<id>.en.m4a`. Each file carries a hash of model + voice + text, so a rerun only regenerates changed stories; `--check` fails when text changed since the audio was made. `--lang` is ready for NL/FR once translated text exists. Checked one file by transcribing it back: the voice reads the curator's text word for word and does not speak the style instruction.
- **Offline:** playback needs no API, so it works on bad venue wifi; only museum text is sent to the TTS, at build time.
- **Fallback:** a missing or broken audio file switches the button to the phone's own voice (`speechSynthesis`, labelled "Read by your phone's built-in voice"); with neither, the player is hidden and the transcript stays.
- **Also fixed:** `tools/questions_sync.py` read the curator's new "2. Blouse" heading (dot instead of colon) as part of the jacket, so ST81190 would have got the blouse story. Headings now accept both, and "Story:" with a colon. Re-synced her page: ST81190 has her latest wording ("snap buttons", "breast pieces", "their designs"). Her Blouse and Trousers entries are skipped: neither is a piece in the app yet.
- **Hook:** `atelier.html` only loads `story.css`, imports `story.js` and calls `showScan()` at the two card-scan spots (3 changed lines). `quiz.show()` takes `story: false`.
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
- **How:** logic in `mockups/share.js`, styles in `share.css`; `atelier.html` only imports it and wires the button (replaces the old text-only share). The still is an extra frame from the Stage's own WebGL renderer at card width (zoom 1, current angle, transparent), copied to a 2D canvas in the same task, then the renderer is restored; no `preserveDrawingBuffer`. The form takes whatever height the title and piece list leave, so short looks get a bigger form.
- **Facts (D3):** names, ids and years come from `pieces.json` only; a missing year prints "not recorded". The span counts the same pieces as the Stage's "Spans N years" line.
- **Privacy (D2):** the PNG is built in the browser and handed to the share sheet or a download; no upload, server, analytics or storage.
- **Design:** warm paper and the Stage's wall gradient, Newsreader for name and span (a sentence, not a stat tile), IBM Plex Mono for ids and years only, hairline list like a museum label. Sheet is a dialog like the quiz, 44 px targets, reduced-motion safe.
- **Checked:** Chrome, top+bottom+feet look and a full look with remixed cloth and sleeves: PNG decodes as exactly 1080x1920, text readable, console clean. Not yet tried on a real phone share sheet.
### H4 MoMu theme: the app now looks like the museum (branch hassan/B9-momu-theme)
- **What:** a new `mockups/theme.css` holds the whole look as tokens (colour, type, radius, shadow, motion) plus the component skin. `atelier.html` links it after its own style block; `quiz.css`, `ask.css` and `up-close.html` read the same tokens. No flow, layout or engine change.
- **Reference:** two sources. MoMu's hackathon presentation template (the Google Slides file the museum asked teams to use; read only) decides where they differ: white slides, black text, headings in red capitals in a plain grotesque (Arial), red `#d72f25`. momu.be, read on 2026-11-21, fills in what a slide template leaves open: white pill buttons floating on a soft offset shadow, sharp-cornered pictures, hairline rules, dot-and-capitals section labels, red underlines on links, and a serif (Reckless) for editorial text. The template's "MM" mark is MoMu's logo and is not used; the credit stays text.
- **Palette:** paper and sheets `#fff`, gallery grey `#ededed` behind photos and the form (photos still multiply onto it), ink `#000`, muted `#595959` (7:1 on white), hairline `#cbcbcb`, accent `#d72f25` (the template's red, 4.9:1 on white) for titles, underlines and the found-count dot; `#c00000` where the red carries white text (6.5:1). The cream and beige are gone.
- **Type:** every title is red capitals in the sans, regular weight, as in the template. Hanken Grotesk stands in for the template's Arial and the site's Roobert; Source Serif 4 stands in for the site's Reckless and is used only for stories, record quotes and Ask answers. Roobert and Reckless are commercial, so neither is copied; both stand-ins are SIL OFL and self-hosted in `mockups/assets/fonts/` (latin subset, 284 KB, licences beside them). Inter, Newsreader and IBM Plex Mono are dropped, and with them the Google Fonts request (no visitor IP goes to Google). Scale: 11 label, 13 small, 15 body, 17 quote, 18, 22 and 27 px titles. Ids and counts are plain small sans, not mono.
- **Hierarchy:** on the fact card, the story sheet, Ask and Up close the piece's name now leads and its id follows (it sat above as a label). Dialog titles are `h2` and "Look closer" is `h3` (they skipped levels before).
- **Shape:** dialogs 6 px corners, pictures and tiles 2 px, sheets keep 20 px top corners, buttons stay pills. Tile names sit flush in the corner like a caption. Quote blocks lost their side bar; quiz questions are ruled rows, not boxes.
- **Motion (emil-design-eng):** nothing new animates. Dialogs and the Ask sheet now leave faster than they arrive (150 ms and 280 ms); curves, the 160 ms press and reduced-motion rules are unchanged.
- **Also:** the wearing chips and the "also in" links are now 44 px tall; the "3D" badge is 11 px (was 10).
- **Checked:** Chrome at 390 px: Stage (front, side, back), wardrobe sheet, Study tab, fact card, story and questions, Ask, NFC, help, Piece page, Up close. Console: only the old model-viewer "multiple three.js" warning. `impeccable detect` on the served page: no findings. Before and after screenshots are in the session notes folder, not in the repo.
- **Not done:** B9 itself (span as a large number, short tile names) stays open and Mubasil's; this ticket is H4. No dark theme (photos need the light wall).
- **Story screen (H3):** `story.css` reads the tokens too (red capital title first, years in the sans, transcript in the serif); its title is an `h2`.
- **Share card:** `share.js` draws on a canvas, so it cannot read the CSS tokens; its font and colour constants now mirror `theme.css` (change both together). `share.css` reads the tokens.
- **Merge order:** rebased on B7. If A9 (PR #11) merges first, rebase this again: in `atelier.html` it only touches the head, the font names in the style block and four heading tags.
- **Decision:** a separate stylesheet over rewriting the inline CSS, so open branches on `atelier.html` merge cleanly and a brand guide can later be applied by editing one `:root` block.

### H2 Ask the archive: questions answered only from the piece's MoMu record (branch hassan/H2-ask-archive)
- **What:** an **Ask** button on every fact card opens a bottom sheet (wardrobe style, 44 px targets, reduced-motion safe). It offers 3 suggested questions built from the record's filled fields plus free text. Each answer shows "From the MoMu record: <field>", a verbatim quote from that field, and an "AI · AI answer, written only from the MoMu record" badge (EU AI Act transparency for chatbots). Questions the record does not cover get "That is not recorded for this piece."
- **How:** `mockups/api/ask.js` is a Vercel serverless function (`POST /api/ask {pieceId, question}`); the API key (`ANTHROPIC_API_KEY`) lives only there. It sends the Claude API one system prompt, that piece's record and the question, nothing else, and asks for JSON (`answerable`, `answer`, `fields`, `quote`). `ask-core.js` then enforces grounding in code: a field the record lacks turns the answer into "not recorded", and a quote that is not verbatim in the named field is dropped. Shared by the sheet (`ask.js`, `ask.css`), the function and the eval.
- **Records:** `tools/ask_records.py` writes `ask-records.json` from the harvest cache: the full Dutch description, maker, title, date, place, type, materials, size and the "about the maker" text, verbatim, plus the English we already had in `records.json` (marked as our translation). Provenance and acquisition fields are left out on purpose: they can name private donors (D2, data minimisation). `records.json` is unchanged.
- **Model:** Claude (`claude-haiku-5-5`, low effort) when `ANTHROPIC_API_KEY` is set. For the hackathon any OpenAI-compatible API also works through env only: `ASK_PROVIDER` (`gemini`, `openrouter`, `groq`, `mistral`, or `ASK_BASE_URL`), `ASK_API_KEY` and `ASK_MODEL`, so a free-tier key is enough. That path asks for the same JSON schema, steps down to plain JSON for models that refuse schemas, and goes through the same `checkAnswer()` guard. **Demo default: Gemini free tier, `ASK_PROVIDER=gemini`, `ASK_MODEL=gemini-3.5-flash-lite`** (median 1.1 s an answer). Switched from OpenRouter `nvidia/nemotron-3.5-super-vl:free` (median 2.8 s) because OpenRouter caps free models at 50 requests a day per account. Gemini's free limits are per Google Cloud project, reset at midnight Pacific and are shown only in AI Studio (Rate limit page); check them there before the presentation. Past any cap the sheet falls back to field answers.
- **Fallback:** with no key the function answers `{offline: true}` and the sheet answers the suggested questions straight from the fields, labelled "Straight from the record, no AI"; free text says Ask can't reach the archive. Same when the network or function is missing (python `http.server` returns 501), so the demo never breaks on venue wifi.
- **Privacy (D2):** no accounts or cookies; question text and IP are never logged or stored (errors log status and class only); questions capped at 280 characters; a per-instance cap of 30 calls a minute (no IP tracking). The sheet asks visitors to leave out personal details. The provider processes the question outside the EU (GDPR Art. 44), and free tiers may train on prompts; the team chose to accept that for the hackathon and revisit it (EU provider, paid tier, telling MoMu) before real visitors use it.
- **Eval:** `tools/ask_eval/` has 24 cases on ST81190 and ST503 (13 answerable, including two in Dutch, and 11 that must say not recorded, including outside-knowledge traps and a prompt injection). `npm run eval:ask` runs offline checks always and the model cases when a key is set, and writes `RESULTS.md` for the curator. Result on Nemotron: **25 of 25 pass**, every answered question with a verbatim quote. One case was wrong at first, not the model: it expected "not recorded" for when the label closed, but the record says "In 2020 besluiten ze hun label stop te zetten"; the case now expects that answer and a new unrecorded trap replaced it. Two other free models (Gemma 4 31B, Ling 3.2 Flash) were rate-limited and not scored. Gemini 3.5 Flash-Lite, run on a 7-case subset to spare its free quota (Dutch, translation of a detail, a fact only the record has, outside-knowledge and injection traps, a missing maker): **7 of 7 pass** (`RESULTS-gemini-3.5-flash-lite-subset.md`); `--only=` picks the subset.
- **Deploy (Mubasil):** `mockups/` now has a `package.json` (one dependency, `@anthropic-ai/sdk` 1.12.0, pinned), so Vercel installs it and builds `api/ask.js` as a function. Before deploying, set the same env as `.env` in the Vercel project (Settings, Environment Variables, Production and Preview): `ANTHROPIC_API_KEY`, or `ASK_PROVIDER` + `ASK_API_KEY` + `ASK_MODEL`. Without it the site still works in fallback mode. Optional: `ASK_MODEL`, `ASK_MAX_PER_MINUTE`.
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
- **Removed:** `tools/questions_check.py` and `tools/questions_apply.py` (moved to `_to_delete/`), the Remix locked-fabric tiles and `atelierQuiz`. The save schema is back to what is on `main`.
- **Checked** at 390 x 844: jacket card shows her story and all 4 questions, answers reveal, "Study it up close" opens Up close; Jak card shows no sheet; Remix grid fix kept.

### Remix grid overlap fixed; quiz questions reviewed in Notion (branch hassan/C2)
- **Grid:** with the wardrobe at half height the tile grid shrank its rows (about 110 to 140 px) below the tiles' 3:4 height, so tiles overlapped. Cause: the grid is a shrinking flex item and the tiles clip (`overflow: hidden`, so no automatic minimum height), which lets auto rows squeeze. Fix: `grid-auto-rows: max-content` on `.wardrobe .grid`; the grid now scrolls instead. Checked at 390 x 844 on Remix, Study and Top: no overlap, console clean.
- **Review loop for the curator:** the 3 questions are rows in a Notion table "Quiz questions" under the team hub page "Quiz questions: review (the curator)", with the MoMu value and the allowed wrong options beside each row. `mockups/tools/questions_apply.py rows.json` writes her rows back into `questions.json` (Status "Approved" sets `draft: false`) and runs `questions_check.py`; if any row breaks a rule (answer not a MoMu value, made-up wrong option), the file is left unchanged. Decision: rows are fetched with the Notion connector rather than a Notion API token, so no new secret lives in the repo.

### C2 quiz: one question per piece wins its fabric (branch hassan/C2)
- **What:** `mockups/questions.json` holds one multiple-choice question for each of 3 demo pieces: ST503 jak (place), ST80931 monpe trousers (date), ST2407/1-2 Bikkembergs boots (material). `mockups/quiz.js` + `quiz.css` show it as a sheet; `atelier.html` only imports it and has five small hooks (save, restore, Remix tiles, `act`, card scan).
- **Flow:** a card scan (`?card=<id>`) wears the piece and opens its question. Right: "MoMu records its place as Netherlands", the record's description quote with our translation, and the fabric unlocks ("Try the fabric" puts it on the body). Wrong: the right answer shows gently, the piece stays in the wardrobe, the fabric stays locked; scanning the card again gives another go. In Remix, a locked fabric is a grey tile ("Answer its question" or "Scan its card again"); tapping it asks the question (or says to scan again). A right answer is never asked again. No score, timer or streak (D2); study pieces keep their find-3-details question.
- **Facts (D3):** every answer and option is a verbatim value of the field in `records.json`; distractors are the same field from other records. `python3 -I mockups/tools/questions_check.py --cache <harvest cache>` checks this, traces each answer to the raw record in `cache/`, and fails if a prompt gives the answer away. The reveal adds no prose of its own: field value plus the record's description. Question text is marked `draft: true` until the curator rewrites and approves it.
- **Save:** optional `quiz` field in `atelier.save.v1`, `{ "<id>": "right" | "wrong" }`, validated on load. Old saves without it load as before (heads-up to Mubasil in the PR, per the change policy). A restored remix fabric must also be unlocked.
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
- It does not open for a visitor who arrived by a museum card (`?card=`) or back from Up close (`?fabric=`), so it never covers their toast. Seen state is `atelier.help.v1` in localStorage; if storage is blocked it shows each visit.
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
- `atelier.html`: `?card=<splat id>` opens Up close; Remix lists splat fabrics (locked, "Look closer", or won); `?fabric=<id>` wears a won fabric on the body. Progress lives in localStorage `atelier.found.v1`.
- Swatches for both (`make_swatches.py` POINT); `batch_glb.py` skips pieces without a GLB so no GPU run is spent on a splat piece.
- Decision: a separate page on three 0.180 instead of upgrading the main page from 0.169, so the 7 GLB scans are not put at risk before the demo. Splat pieces are studied, not worn (their scans include MoMu's own form), and win their fabric instead (D2: learning unlocks).
- `.sog` for both pieces via `splat-transform` 3.10.3 in `tools/node/` (220 MB `.ply` to 17 MB, same bounds and detail in Chrome); committed, since each is under GitHub's 50 MB warning.
- Verified in Chrome at 1433 px and 390 px: card scan redirect, miss tap, tap-to-find, Show me on the back belt, Wear its fabric, look name "Jak in Polka-dot", Remix tile states, no console errors.

### MoMu Gaussian splats downloaded
- 9 standard `.ply` splats extracted to `splats/` (git-ignored, with `*.zip`); the zip moved to `_to_delete/`. Each piece is matched to its record in `HANDOVER.md`.
- `mockups/splat-viewer.html`: local viewer (three 0.180.0 + Spark 2.4.0) for `splats/`; serve the project root on 8766. Checked in Chrome: MOMU-1, 2, 3 render with no console errors, each about 0.9 to 1 M splats, every capture includes MoMu's dress form.
- Decision: keep splats out of git (about 220 MB each, over GitHub's 100 MB file limit).

### Two-person setup: AGENTS.md, ARCHITECTURE.md
- `AGENTS.md` is now the entry file for every agent and both people (setup, ticket claims, branch per ticket, PR review, one branch on `atelier.html` at a time, handover at session end); `CLAUDE.md` imports it and keeps Claude-only notes.
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
- Deployed `mockups/` as a static site to the Vercel project (team mmubasilbokhari-6857s-projects),
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
- **C6 save:** the look and widest span persist in localStorage (`atelier.save.v1`); restored ids are checked
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
