# Ticket ledger: Second Skin (hackathon build)

Consolidated 2026-11-21 from six agents (product lead, collection and narrative, fabric facts, architecture,
avatar, phone UI) and reviewed by a product-owner agent for the presentation and for teammates changing it.
Earlier work is in `TICKETS.md` (T1 to T12) and `CHANGELOG.md`. Owner column: anyone may take an open ticket;
write your name in it. Size: S (under 2 h), M (half a day), L (a day or more).

## Decisions (with the reason; change one by editing this list and noting why)
| # | Decision | Why |
|---|---|---|
| D1 | Avatar stays a dress form for the demo; finishes (linen, calico, black jersey, oak) replace skin tones | Rigid TRELLIS scans were shot on forms and clip on a human body; a form reads as "this museum" (product lead). The avatar agent preferred a stylised CC0 mannequin; kept as A7 for after |
| D2 | Room pieces (a sticker in the museum; `locked: true` in `pieces.json`) are won by one challenge after their story, then go to the wardrobe (changed 2026-11-21 by Basil, owner call: the demo must show gamified finding; Hassan's earlier version had nothing locked behind questions). Wearables: Guess the year, within 25 years, the third miss wins anyway. Study pieces: find the 3 recorded details on Up close to win the fabric. Starter pieces stay unlocked | The visit is the point; nobody can lose, so it stays learning, not grinding. No streaks, timers, points, purchases, leaderboards, accounts or PII |
| D3 | Facts come only from MoMu metadata; a missing field shows "not recorded". Exception (2026-11-21, Hassan): the curator's stories and questions show as she wrote them, with a source link where her page gives one | Truthfulness; several descriptions are Dutch only. the curator (fashion background) writes the stories; her text is the team's source for them |
| D4 | `pieces.json` + `fabrics.json` become the single source of truth, validated at the pipeline and at build | Today the pipeline regex-parses the HTML; CLO pieces need typed fields (`kind`, `units`, `origin`) |
| D5 | CLO garments load with `kind: "clo"`, `origin: "avatar"`: no rescale; remix swaps named panel materials | Draped garments are already sized; scans keep auto-fit and the triplanar shader |
| D6 | One renderer for the whole app; the Locker becomes a bottom sheet on the Stage | Three WebGL contexts today; a separate Locker shrinks the form to 116 px while choosing |
| D7 | Deploy target Vercel, Root Directory `app/`; nothing deploys without the owner saying so | Keeps `.venv`, `cache/`, `seed/`, `_to_delete/` out of the deploy |
| D8 | The 8 current pieces stay as the demo set; a 20-piece season "Fibres and Hands, 1750 to 2009" is the growth story | All 8 are MoMu's own item set 413025 "All Hackathon Assets (objects)"; the DB has 2075 ST objects with images and 87 with linked pattern records |

## Track A: Architecture and engine
| # | Ticket | Size | Acceptance | Status |
|---|---|---|---|---|
| A1 | Move `PIECES` to `pieces.json` (schema in D4); page fetches it; `batch_glb.py` reads JSON | M | `grep -n "PIECES\|regex" mockups/second-skin.html batch_glb.py` finds no inline array or HTML parsing; all 8 pieces still load on Stage | done 2026-11-21: `mockups/pieces.json` + `pieces.schema.json`; page fetches it; pipeline reads it |
| A2 | Add `year`, pipeline hints (`cutout`, `swatchPoint`, `swatchShift`, `sleeveTo`, `hideStand`), `fabrics.json`; delete `yearOf`, `NO_CUTOUT`, `POINT`, `SHIFT` | S | Credit line and swatches unchanged | open |
| A3 | Split the module script into `src/` modules, then Vite with three 0.169.0 from npm | M | `npm run build` passes; page identical | open |
| A4 | One shared `WebGLRenderer`; remove model-viewer (Piece page uses the engine) | M | Run `document.querySelectorAll("canvas").length` on Stage, Wardrobe and Piece page: each returns 1 | done 2026-11-21: one renderer; the Piece page (and model-viewer) was removed with the Win it flow |
| A5 | Pipeline optimise step (meshopt + webp, 1024 px; 512 for feet) and `meanLuma` computed in the pipeline; meshopt decoder in the loader | M | GLBs under 700 KB; remix brightness unchanged | basil, in progress: WebP textures (measured 1 MB to about 0.1 MB per GLB) |
| A6 | LRU of about 8 GLBs with dispose; render on demand; pause when `document.hidden`; DPR cap 1.5 | S | After 30 piece swaps on a mid-range phone, no tab reload and heap within 20% of swap 1 (Chrome remote devtools) | basil, in review on `basil/A6`: LRU of 8, spin pauses when hidden or off screen, DPR 1.5; real-phone check still open |
| A7 | CLO garments in the app: `assets.clo` (kind "clo", origin "avatar"), Archive vs Reconstruction on Up close, worn on the avatar it was draped on | M | `?card=ST81190` -> popup -> Up close -> Compare splat vs CLO -> Wear it, front, side and back; Take it off; console clean | cut 2026-11-21 (Hassan): the Archive vs Reconstruction view (PR #26) is removed; Up close shows only MoMu's splat for ST81190 and every study piece, because our CLO coat changes the fabric and so misrepresents the piece. The team no longer makes its own CLO garments: CLO models come only from the team (`hassan/team-models`, on `clo/outfit.js` and `assets/clo/avatar_web.glb`, both kept) |
| A8 | `scripts/check-manifest.mjs`: schema + every referenced file exists; runs in `npm run build` | S | A missing GLB fails the build | open |
| A9 | Demo avatar on the Stage behind `?demo`: the presenter's MetaPerson avatar as a second body, pieces fitted to it (arms, conform, boots per foot, neck cut) | M | `?demo` shows an Avatar toggle; every piece sits on the avatar front, side and back; without `?demo` the page is unchanged and no avatar file loads | Basil, in progress 2026-11-21 (branch basil/A9-live-avatar) |

## Track B: Phone UI
| # | Ticket | Size | Acceptance | Status |
|---|---|---|---|---|
| B1 | Remove the two unlabeled "+" buttons | S | No unlabeled buttons on Stage | done 2026-11-21 |
| B2 | 44 px touch targets (finishes, chips, back button) | S | Tap-target audit passes at 390 px | done for Stage chips, finishes, back |
| B3 | Bottom-sheet wardrobe (peek 96 px, half 48%, full 88%) replacing the Locker screen; form slides up 18% and scales 0.82 at half; 420 ms `cubic-bezier(0.32,0.72,0,1)` | M | On a 390 px phone: open sheet, equip a piece, remix a fabric, close; the URL never changes and the form stays visible | done 2026-11-21: sheet on the Stage, peek 124 px / half 48% / full 88%, Locker screen removed |
| B4 | Sheet velocity snap and friction past the top | S | A flick reaches the next snap | done 2026-11-21 with B3: flick over 0.11 px/ms moves one snap; 0.3x resistance past full |
| B5 | Persistent tiles: toggle classes, no `innerHTML` rerender, so selection animates | S | Tile nodes survive tab changes | open |
| B6 | Locked pieces as silhouettes with name and room; unlock clip-path reveal 600 ms, once | M | Locked tile shows "Find card in room N" | open |
| B7 | Share card 9:16: still of the form, look name, span, MoMu credit | M | Exported PNG is 1080x1920 and shows the form still, look name, span in years and MoMu credit line | done 2026-11-21 (hassan, PR #12): Share image (file share where supported) and Download image; PNG 1080x1920 checked in Chrome; real-phone share sheet not yet tried |
| B8 | Reduced-motion pass: no idle spin, 150 ms crossfades | S | Emulated reduce shows no transforms | open |
| B9 | Hierarchy: span as a large serif number; tiles show short names, ids move to the fact card; drop IBM Plex Mono | S | Stage reads name, then span, then credit | open |

## Track C: Game and facts
| # | Ticket | Size | Acceptance | Status |
|---|---|---|---|---|
| C1 | Fabric cards (Locker tab): title built from fields, "MoMu says" quotes, "not recorded" gaps, "Seen on" list | S | Every card field traces to a record id | done 2026-11-21 (basil): ⓘ on every wardrobe tile; `records.json` from `tools/records.py`; "also in" links stand in for "Seen on" |
| C2 | the curator's story and questions per piece, from her Notion page "Story and Questions", shown after the card scan; optional, answers on a tap, nothing locked (D2 changed 2026-11-21) | M | Scanning a piece with a story shows it with all its questions; each answer shows on a tap; the piece is collected either way | done 2026-11-21 (hassan, PR #6): ST81190 so far (her page's only piece); `tools/questions_sync.py` copies her page into `questions.json`. Update 2026-11-21 (hassan, PR #25): her blouse ST81114AB and trousers ST81116 added, each piece marked `source: curator` (her answers may be observed, not from the record) |
| C3 | Card scan via URL `?card=ST503` (and a "tap to scan" demo button; QR later) | S | Opening `/?card=ST503` on a phone over 4G puts that piece on the form within 10 s; an unknown id shows "card not found" and leaves the form unchanged | done 2026-11-21: `?card=<id>` unlocks and wears the piece with a toast; unknown ids ignored |
| C4 | Remix connection reveal only when two records share a field (technique, country, decade) | M | No fact shown for pairs with nothing in common | open |
| C5 | Guess-the-decade slider before the reveal; shows your gap in years, no score | S | Works on the 8 demo pieces | open |
| C6 | Save to localStorage (`save` schema v1); restore on load | S | Reload keeps the look and unlocks | done 2026-11-21: `secondSkin.save.v1` in localStorage, ids validated on restore |

## Track D: Data and narrative
| # | Ticket | Size | Acceptance | Status |
|---|---|---|---|---|
| D-1 | Export the 20-piece season from the DB into `pieces.json` rows (ids in the narrative report below), quoting `dcterms:medium` and dates | M | 20 rows validate; every fact quotes a field | open |
| D-2 | Eyeball full-garment photo quality for the 20; swap any without a clean shot | S | 20 usable photos | open |
| D-3 | English text for Dutch-only descriptions, marked as translation | S | No untranslated fact on screen | hassan, in progress (branch `hassan/D-3-i18n`); also adds the NL / EN / FR language toggle |
| D-4 | Generate GLBs for the 12 new pieces (about 2 to 3 per GPU refill per account) | L | 20 GLBs, garment-only cutouts | open |

Season shortlist (from the narrative agent; verify each before use): tops ST503, ST2218, ST80930, ST81114AB,
ST80436, ST852; bottoms ST2062, ST80931, ST81116, ST657/2, ST80069; feet ST2439/1-2, ST2407/1-2; full ST80881,
ST655/1, ST81299, ST2202, ST2434, ST81234/1-2, ST2435.

## Track E: Presentation (editable by any teammate)
| # | Ticket | Size | Acceptance | Status |
|---|---|---|---|---|
| E1 | Markdown slide outline in `presentation/` with one slide per beat: card scan, wear, learn, remix, share, CLO path | S | Any teammate can edit and reorder | Mubasil: done as a 6-slide pptx, `presentation/` |
| E2 | Screen recording of the demo flow as the fallback | S | MP4 of 3 min or less plays offline on the presenter's laptop and shows every beat in the demo script | hassan, in progress 2026-11-21 (branch `hassan/E2-demo-video`) |
| E3 | Vercel preview deploy, only on the owner's go | S | Preview URL opens on a phone off the venue wifi and `?card=ST503` works | done 2026-11-21 (went out as production, see CHANGELOG): https://second-skin-ten.vercel.app |

## Track G: Splat Stage (approach A, picked 2026-11-21)
| # | Ticket | Size | Acceptance | Status |
|---|---|---|---|---|
| G1 | Spike: splat form, ST2431 and ST2432 tops and trousers cut and mixed, one fabric tint, on its own page | S | Every top and bottom pairing reads as one outfit front, side and back; a look loads under 8 MB | done 2026-11-21 (basil, on main): `mockups/splat-stage-spike.html`, 5.5 to 6.8 MB a look; findings in `HANDOVER.md` |
| G2 | Phone check of the spike: load time on 4G and frame rate while turning | S | Look on screen under 10 s over 4G; turning stays smooth on a mid-range phone | open |
| G3 | Cut rules as `pieces.json` hints; parts for ST81190 and the full looks | M | Each splat piece has parts that pass the G1 acceptance | open |
| G4 | Splat engine in the Stage (three 0.180, Spark) replacing the GLB form | L | Stage wears splat parts from the wardrobe sheet; remix works on splats | open |

## Track H: AI
| # | Ticket | Size | Acceptance | Status |
|---|---|---|---|---|
| H2 | Ask the archive: a visitor asks about a piece and gets an answer built only from that piece's MoMu record (D3), labelled as AI; serverless `api/ask` keeps the key off the browser; field-only fallback with no key or network | M | At 390 px: ask, answer shows its field line; an unrecorded question says "That is not recorded for this piece"; with no key the suggested questions still answer from fields; eval script passes on 2 pieces x 10 questions | done 2026-11-21 (hassan, PR #10): Ask on every fact card; Gemini 3.5 Flash-Lite free tier by default, eval 25/25 (Nemotron) and 7/7 subset (Gemini); live answers need the `ASK_*` env in Vercel |
| H3 | Story screen with narration: after a card scan the piece's story (the curator's text, else a draft built only from its MoMu record, D3) with a play button for pre-generated narration, transcript always visible, then Continue to the questions | M | At 390 px: scan -> story -> play -> continue to questions for 4 pieces; a missing audio file falls back to the browser voice; console clean | done 2026-11-21 (hassan, PR #14): story sheet with narration before the questions; 17 stories (1 by the curator, 16 record drafts for her), audio for 11 (2.3 MB); 6 study pieces wait for the TTS quota (`narration.py --audio`) and use the phone voice. Update 2026-11-21 (hassan, PR #25): 19 stories (3 by the curator); blouse and trousers have no audio yet Update 2026-11-21 (hassan, PR #29): every story re-voiced from the story text alone (the style prompt was read out); all 19 have English audio (3 Gemini, 16 Picsart Adeline, 3.2 MB). Update 2026-11-21 (hassan, PR #32): one voice throughout, all 19 stories in Picsart Adeline; every file transcribed back, none reads the style line. |
| H4 | MoMu theme: the app follows MoMu's presentation template (red capital headings, white, black) and momu.be for what the template leaves open; all look tokens in `mockups/theme.css`, fonts free and self-hosted | M | At 390 px Stage, wardrobe, fact card, story, Ask, share card and Up close use the theme; AA contrast; console clean; no third-party font request | done 2026-11-21 (hassan, PR #15): look tokens in `mockups/theme.css`, Hanken Grotesk and Source Serif 4 self-hosted; B9 (span as a large number, short tile names) stays open and Mubasil's |
| H5 | Preload on card scan: the scanned piece's 3D asset (`.sog` splat or GLB) starts downloading the moment `?card=<id>` is known, behind the popup, and `mockups/preload.js` tells the popup its progress | S | On Fast 4G with `?card=ST81190`, tapping Study up close shows the splat in less time than before (numbers in the PR); the second request is a cache hit; Save-Data skips it; console clean | done 2026-11-21 (hassan, PR #18): `mockups/preload.js` starts the scanned piece's splat or GLB on `?card=`; cold Up close 19.4 s to 1.9 s with the file preloaded, 16.6 s on a tap at 23% (1.1 MB/s link); not measured on a real phone or venue wifi |
| H6 | Navigation and UX: one navigation model for the phone flow (page vs sheet vs modal, one back behaviour incl. the hardware back button, progress cues, transitions) without changing the story beats or their order | M | At 390 px every beat is reachable in order from a card scan; browser back closes the top sheet or returns one step everywhere; console clean; impeccable audit re-run | hassan, in progress 2026-11-21: audit and map `docs/UX_AUDIT.md` approved; PR 1 merged (PR #28: back gesture closes the top layer, Up close without loops); PR 2 scan flow on `hassan/nav-ux-scan`; next PR 3 sheets, PR 4 Up close header |
| H7 | Storytelling backgrounds: no white or grey behind the 3D views (Stage, 3D view, Up close); each piece stands in a scene that fits its story and era, from feedback 2026-11-21 | M | At 390 px Stage, 3D view and Up close show a scene behind the piece for every era in `pieces.json`; piece stays readable (AA on overlaid text); reduced-motion respected; console clean | done 2026-11-21 (hassan, PR #42): six period rooms (salon, arcade, art nouveau, art deco, mid-century, runway) picked by date in `scenes.js`; checked in Chrome at 390 px, not yet on a phone |
| H8 | the team's cycling outfit on the avatar: his CLO blouse (ST81114AB) and trousers (ST81116) worn on the team avatar, reached from their card scans | M | At 390 px: `?card=ST81114AB` and `?card=ST81116` show the story, then "See it on the avatar" opens `outfit.html` with the piece on; both together front, side and back with nothing poking through; console clean | done 2026-11-21 (hassan, PR #41): `outfit.html` (OutfitRig), three GLBs in `assets/clo/` built with `clo/optimise_glb.mjs` and `clo/tuck_glb.mjs`; blouse tucked by a cut variant; `assets.clo` back in the schema with `variants`; not in the wardrobe, trousers' sheen stands in for the missing denim maps; checked in the browser pane at 390 px, not on a phone |
| H9 | MoMu's own CLO models on the outfit page: the pieces that have a MoMu CLO project (furisode ST80881, jak ST503, knee breeches ST2062, coat ST81190, kaftan ST80998) shown on MoMu's mannequin, as exported | M | At 390 px `outfit.html?card=<id>` shows each piece on its mannequin, front, side and back; the cycling outfit is unchanged; console clean | done 2026-11-21 (hassan, PR #43): furisode ST80881, jak ST503, knee breeches ST2062, coat ST81190 and kaftan ST80998 on MoMu's mannequins at `outfit.html?card=<id>`, built with `clo/obj2glb.mjs`; cycling outfit unchanged; not linked from the wardrobe or card scans; cavalry ST2431 left out (project is part 1 of 4, undraped); the MoMu Drive holds no CLO project for the other 11 pieces; checked in the browser pane at 390 px, not on a phone |
| H10 | MoMu branding: the app reads as a MoMu experience on every main screen (feedback 2026-11-21: "Add more MoMu branding"); typographic MoMu wordmark in the theme fonts unless an official logo is in our MoMu material, one MoMu credit line, MoMu tone on Stage, fact card, story, share card, Up close and loading screens | S | At 390 px Stage, fact card, story, Up close and share card carry the MoMu mark or credit; AA contrast; console clean | hassan, in progress 2026-11-21: PR #44 merged (MoMu mark in the headers and on the share card, "at MoMu" in the copy); PR #47 open, drops the name "Second Skin" everywhere a visitor sees it (files, URLs, Vercel project and saved keys keep `second-skin`) |
| H11 | Find-it game in Up close: look at the splat, search, and tap a recorded detail on the piece itself; the list gives the record's words as clues without saying where, "Show me" only becomes a hint after a try or a wait (D2: nobody gets stuck). From feedback 2026-11-21; takes in J5 | M | At 390 px all 3 details found by tapping on the piece on 2 study pieces (ST2435, ST81190), front and back; wrong taps get gentle feedback; quotes verbatim; console clean | done 2026-11-21 (hassan, PR #48): tap the detail on the piece, list as clues without numbers, Hint after a miss or 20 s rings the area, the record's words large on a find; J5 folded in except "next piece to win" on the Won card; checked in Chrome at 390 px on ST2435 and ST81190, not on a phone |
| H12 | Personal share: the share sheet takes an optional name (kept on the device only) and the card becomes that visitor's: "<Name>'s look across N years", their form in its period room, the pieces worn with years, the pieces won today, one line from a worn piece's story; still 1080x1920, facts from `pieces.json` and the records only (D3), nothing uploaded (D2) | M | At 390 px two different looks give visibly different cards, with and without a name; PNG exactly 1080x1920; the name never leaves the device; console clean | done 2026-11-21 (hassan, PR #45): optional name kept on the device (`secondSkin.name.v1`), card titled "<Name>'s look across N years" with the look's period room, pieces worn and won, one story line; all in `share.js`/`share.css`; checked in Chrome (window floor 570 px, not 390), not on a phone |
| H13 | Poetic narration: each record-built story retold as short poetic narration (a scene or a few lines of verse, about 40 to 70 words, facts only from the MoMu record, D3); the curator's stories unchanged; the story sheet leads with play and a few lines, full transcript behind "Read the story"; changed stories re-voiced in the same voice (Picsart Adeline), from feedback 2026-11-21 | M | At 390 px on 4 pieces (one of the curator's): sheet shows play and a short lead, transcript opens on request; every fact in a new text traced to its record; new audio transcribed back reads the story and no style prompt; console clean | hassan, in progress 2026-11-21 |
| H14 | Way in to the CLO models: the five pieces with a MoMu CLO model (ST80881, ST503, ST2062, ST81190, ST80998) link to `outfit.html` from their fact card and, for the two study pieces, from Up close | S | At 390 px: fact card of each won piece shows "See it on a mannequin" and opens `outfit.html?card=<id>`; Up close for ST81190 and ST80998 has the same link; back returns to where it came from; console clean | hassan, in progress 2026-11-21 (branch hassan/H14-clo-links) |

## Track J: Polish from the 2026-11-21 audits (basil)
Found by four audits (fabrics and data, 3D quality, speed, buttons and flows). Anything in H6's scope (back behaviour,
onboarding after a sticker, return to the opener, progress cue) stays Hassan's.

| # | Ticket | Size | Acceptance | Status |
|---|---|---|---|---|
| J1 | 3D texture fixes without the GPU: ST80930 and ST80931 (blob-gated white fill, hue-gated tan fill for the wooden hands), ST2407/1-2 beige areas, ST655/1 colour back to its photo | M | Each piece checked front, side and back on the Stage against its photo; bleed % in the PR | basil |
| J2 | Data guards: no crash when a piece lacks `source.imgSha` or `details`; wardrobe count only wearable pieces; a saved look never restores a piece without a GLB | S | `tools/check_pieces.py` passes; each guard exercised once in Chrome; console clean | basil |
| J3 | One asset pipeline: shared GLB read and write, per-piece texture fix recorded in `pieces.json`, a report with bleed % and colour ratio per GLB | M | `check_pieces.py` reports every GLB; a missing swatch, record or narration for a playable piece fails it | basil |
| J4 | Speed outside H5: lazy and smaller tile images, preconnect to the CDN, `pieces.json` and the starter GLBs requested from the head | S | Cold-load bytes and time before and after in the PR | basil |
| J5 | Up close as a game: no order numbers on the details, the found moment shows the record's words large, then "now find it on the real piece", then the next piece to win | M | At 390 px all 3 details found on 2 pieces; console clean | moved to H11 2026-11-21: Hassan took it over (same file and flow as the find-it feedback fix) |
| J6 | Quick fixes from the button map: close button on the fact card, a locked tile opens the sticker prompt, one word set (win, wardrobe, fabrics, sticker), "Simulate NFC tap" only with `?demo`, a loading state on Share, New badges survive a reload, a won study piece does not replay | S | Each item checked at 390 px; console clean | basil |
| J7 | The jak ST503 rescanned without its mannequin chest (TRELLIS from a cleaner cutout; one GPU run) | S | Jak front, side and back show no cream form | open: needs the owner's go for the GPU run |
| J8 | A prize is wearable at once: Won card "Wear it now"; a fabric on a bare form gets a cut; every owned piece opens in 3D | S | Checked at 390 px for a wearable and a fabric | done 2026-11-21 (basil) |

## Track F: Later (after the hackathon)
| # | Ticket |
|---|---|
| F1 | CLO pipeline on a personal machine: pattern files from MoMu, `Lilbonner/clo3d-mcp`, export per piece |
| F2 | Stylised CC0 mannequin (Quaternius or similar, licence to verify) in an A-pose, garments parented to bones |
| F3 | Home "piece of the day" from the full collection, wearable after its question |
| F4 | Metric: learn-to-wear rate (target 40%), guardrail: questions answered per piece unlocked |

## Product-owner review

**Hackathon cut, in build order** (DEMO-BLOCKER marked):
1. A1 pieces.json (blocks C2, C3).
2. E3 deploy, early, to prove phone loading (DEMO-BLOCKER, needs owner go).
3. B3 bottom sheet (DEMO-BLOCKER: no sheet, no phone flow).
4. C3 card URL (DEMO-BLOCKER: the 30 s opener).
5. A4 one renderer, A6 LRU (phone memory), A5 GLB size (venue wifi).
6. C2 for 3 pieces, C1 fabric cards.
7. B7 share card, E2 recording (DEMO-BLOCKER: the fallback), E1 slides.

Cut for the day: A2, A3, A7, A8, B4 to B6, B8, B9, C4 to C6, D-1 to D-4, all of F. D-2 to D-4 are the growth story, not the demo.

**Lanes (parallel)**
- Engine: A1, A4, A6, A5, then C3 wiring.
- UI: B3, then B7.
- Data and facts: three questions for C2 and C1 text, each quoting a MoMu field; curator check.
- Presentation: E1 now, E3 once engine lands, E2 last on the final build.

**Rewritten acceptance**: changed in place for A1, A4, A6, B3, B7, C2, C3, E2, E3 (each now names a command, device or observable).

**Risks**
- Venue wifi: A5 plus a service-worker-free fallback; presenter phone on a hotspot and E2 MP4 ready.
- GPU quota: demo set is the 8 existing GLBs; D-4 is out of the cut.
- QR permission from MoMu: C3 uses a URL and a "tap to scan" button; QR is printed only if MoMu agrees.
- Curator sign-off: show only fields quoted from MoMu records (D3); if unsigned, label facts "from MoMu metadata".
- Kimono stand (HANDOVER item 2): keep `hideStand` or leave kimono off the demo path.

**Change policy**
Safe without asking: Track E files, fact and question text (still quoting a field), copy, CSS, colours, finish names, the order of pieces in the demo.
Heads-up first: `pieces.json` and `fabrics.json` schema (A1, A8, C2 and C3 read it), `save` schema, URL params (`?card=`), GLB file names, anything in D1 to D8, the demo script order, and deploy settings (D7).
