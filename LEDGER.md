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
| A7 | CLO garments in the app: `assets.clo` (kind "clo", origin "avatar"), Archive vs Reconstruction on Up close, worn on the avatar it was draped on | M | `?card=ST81190` -> popup -> Up close -> Compare splat vs CLO -> Wear it, front, side and back; Take it off; console clean | done 2026-11-21 (hassan, PR #26): `reconstruction.js` on Up close, Archive / Compare / Wear it for ST81190; Stage and D1 unchanged; coat remix by named material not built |
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
| E2 | Screen recording of the demo flow as the fallback | S | MP4 of 3 min or less plays offline on the presenter's laptop and shows every beat in the demo script | open |
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
| H3 | Story screen with narration: after a card scan the piece's story (the curator's text, else a draft built only from its MoMu record, D3) with a play button for pre-generated narration, transcript always visible, then Continue to the questions | M | At 390 px: scan -> story -> play -> continue to questions for 4 pieces; a missing audio file falls back to the browser voice; console clean | done 2026-11-21 (hassan, PR #14): story sheet with narration before the questions; 17 stories (1 by the curator, 16 record drafts for her), audio for 11 (2.3 MB); 6 study pieces wait for the TTS quota (`narration.py --audio`) and use the phone voice. Update 2026-11-21 (hassan, PR #25): 19 stories (3 by the curator); blouse and trousers have no audio yet In progress 2026-11-21 (hassan, `hassan/H3-narration-text`): re-voice every story from the story text alone (the style prompt was read out); Picsart text to speech when the Gemini free quota is spent. |
| H4 | MoMu theme: the app follows MoMu's presentation template (red capital headings, white, black) and momu.be for what the template leaves open; all look tokens in `mockups/theme.css`, fonts free and self-hosted | M | At 390 px Stage, wardrobe, fact card, story, Ask, share card and Up close use the theme; AA contrast; console clean; no third-party font request | done 2026-11-21 (hassan, PR #15): look tokens in `mockups/theme.css`, Hanken Grotesk and Source Serif 4 self-hosted; B9 (span as a large number, short tile names) stays open and Mubasil's |
| H5 | Preload on card scan: the scanned piece's 3D asset (`.sog` splat or GLB) starts downloading the moment `?card=<id>` is known, behind the popup, and `mockups/preload.js` tells the popup its progress | S | On Fast 4G with `?card=ST81190`, tapping Study up close shows the splat in less time than before (numbers in the PR); the second request is a cache hit; Save-Data skips it; console clean | done 2026-11-21 (hassan, PR #18): `mockups/preload.js` starts the scanned piece's splat or GLB on `?card=`; cold Up close 19.4 s to 1.9 s with the file preloaded, 16.6 s on a tap at 23% (1.1 MB/s link); not measured on a real phone or venue wifi |
| H6 | Navigation and UX: one navigation model for the phone flow (page vs sheet vs modal, one back behaviour incl. the hardware back button, progress cues, transitions) without changing the story beats or their order | M | At 390 px every beat is reachable in order from a card scan; browser back closes the top sheet or returns one step everywhere; console clean; impeccable audit re-run | hassan, in progress 2026-11-21: audit and map `docs/UX_AUDIT.md` approved; PR 1 merged (PR #28: back gesture closes the top layer, Up close without loops); PR 2 scan flow on `hassan/nav-ux-scan`; next PR 3 sheets, PR 4 Up close header |

## Track J: Polish from the 2026-11-21 audits (basil)
Found by four audits (fabrics and data, 3D quality, speed, buttons and flows). Anything in H6's scope (back behaviour,
onboarding after a sticker, return to the opener, progress cue) stays Hassan's.

| # | Ticket | Size | Acceptance | Status |
|---|---|---|---|---|
| J1 | 3D texture fixes without the GPU: ST80930 and ST80931 (blob-gated white fill, hue-gated tan fill for the wooden hands), ST2407/1-2 beige areas, ST655/1 colour back to its photo | M | Each piece checked front, side and back on the Stage against its photo; bleed % in the PR | basil |
| J2 | Data guards: no crash when a piece lacks `source.imgSha` or `details`; wardrobe count only wearable pieces; a saved look never restores a piece without a GLB | S | `tools/check_pieces.py` passes; each guard exercised once in Chrome; console clean | basil |
| J3 | One asset pipeline: shared GLB read and write, per-piece texture fix recorded in `pieces.json`, a report with bleed % and colour ratio per GLB | M | `check_pieces.py` reports every GLB; a missing swatch, record or narration for a playable piece fails it | basil |
| J4 | Speed outside H5: lazy and smaller tile images, preconnect to the CDN, `pieces.json` and the starter GLBs requested from the head | S | Cold-load bytes and time before and after in the PR | basil |
| J5 | Up close as a game: no order numbers on the details, the found moment shows the record's words large, then "now find it on the real piece", then the next piece to win | M | At 390 px all 3 details found on 2 pieces; console clean | basil |
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
