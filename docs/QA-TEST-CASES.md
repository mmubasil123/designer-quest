# QA test cases: MoMu app (atelier.html, up-close.html, outfit.html)

Bug bash 2026-11-22 (hassan, H19, branch `hassan/H19-qa-bugbash`). Run at 390 x 844 and 320 x 568 in headless Chromium
(Playwright), served by `python3 -m http.server 8765` from `mockups/`. Every case starts from a known
`localStorage` (cleared, or set as stated). "Console clean" means no page error and no console error except the
expected `501` from Ask on the static server (no `api/ask` there).

Result key: **Pass**, **Fixed** (failed, fixed on this branch, re-run and passed), **Known** (open, not a code bug).

## Stage and wardrobe

| # | Scenario | Expected | Result |
|---|---|---|---|
| TC01 | First visit, empty storage | Help opens, 3 steps, "Start dressing" closes it | Pass |
| TC02 | Reload after help was closed or skipped | Help does not open again | Pass |
| TC03 | First look | Furisode kimono on the form, title "Antwerp, any century" | Pass |
| TC04 | Tap a wardrobe tab from the peek | Sheet opens to half | Pass |
| TC05 | Wear a top while a full look is on | Full comes off, top goes on | Pass |
| TC06 | Tap the worn tile again | It comes off | Pass |
| TC07 | Tap a locked tile (Jak) | Sticker prompt opens, nothing is worn | Pass |
| TC08 | Fabrics tab, tap a fabric with no top or full look | A cut is put on, toast names it, fabric on the body | Pass |
| TC09 | Take off the cut that carries a fabric | Fabric goes back, toast says so | Pass |
| TC10 | Top + bottom + shoes, then body and sleeves fabrics | Look name "Coat in Furisode, with Ikat sleeves", span line, Firsts toasts once each | Pass |
| TC11 | Change the form finish, reload | The finish is kept | **Fixed** (B1) |
| TC12 | Build a 210-year span, change the look, reload | "your widest" still says 210 | **Fixed** (B2) |
| TC13 | Zoom in to max, open the wardrobe | Zoom resets to 1, buttons enable/disable at the limits | Pass |
| TC14 | Focus button, then Escape | Menus hide, Escape brings them back | Pass |
| TC15 | Turntable front, side, back | Form and garment render at every angle | Pass |

## Fact card, Ask, 3D view

| # | Scenario | Expected | Result |
|---|---|---|---|
| TC20 | Fact card of a locked room piece (Jak) | Date "Win it to find out", no Ask, no 3D, button "Find it at MoMu" | Pass |
| TC21 | Browser back with a fact card open | Card closes, page stays | Pass |
| TC22 | "Also in" link on a fact card | Opens that piece's card | Pass |
| TC23 | Fact card of a **locked study piece** opened from a link while the Full tab is active (Cocktail dress → Black satin dress), tap "Find it at MoMu" | Sticker prompt "to study it up close"; the piece is **not** put on the form | **Fixed** (B7) |
| TC24 | Ask, suggested question, static server | Answer from the record, "Straight from the record, no AI" | Pass |
| TC25 | Ask, free question, static server | "Ask can't reach the archive right now…" | Pass |
| TC26 | See it in 3D, close, open another piece's 3D | The viewer is emptied on close; the second piece never shows the first one's model | **Fixed** (B4) |

## Card scan and winning

| # | Scenario | Expected | Result |
|---|---|---|---|
| TC30 | `?card=ST503` (room wearable) | Story without the year, "Win it", then Guess the year | Pass |
| TC31 | Back on Guess the year | Stays on the guess (Win it refuses back and Escape) | Pass |
| TC32 | Three wrong guesses | Hints "Later than…", third try wins, card says how far off | Pass |
| TC33 | Right guess, "Keep it" | Won tab appears and is selected, tile marked New, saved in `atelier.won.v1` | Pass |
| TC34 | Reload after a win | No replay of the card, Won tab still there | Pass |
| TC35 | Re-scan a won piece | Story with its years, "Back to my look", toast "… is in your Won tab" | Pass |
| TC36 | `?card=ST80930` (owned piece, not a museum piece) | Story, then toast names the **Top** tab, not the Won tab (there is none) | **Fixed** (B3) |
| TC37 | `?card=XYZ` | Toast "This sticker isn't in the app yet", URL cleaned | Pass |
| TC38 | `?card=ST2435` (study piece) | Story, "Study it up close" opens `up-close.html?id=ST2435` | Pass |
| TC39 | Up close ← | Back on the Stage; a second back does not loop into Up close | Pass |
| TC40 | All details found, "Win its fabric" | Stage shows "You won its fabric!", Keep puts it in Won with New | Pass |
| TC41 | Wear a won study piece from Won | Worn on its own mesh, one chip "Won …", title is its name | Pass |
| TC42 | Museum after wins | "2 of 10 won", a started study piece shows "n of 3 details found" | Pass |
| TC43 | `?card=ST81114AB` / `?card=ST2062` (CLO only) | Story, "See it on the avatar", `outfit.html`, back returns to the Stage | Pass |
| TC44 | `up-close.html?id=ST81190` (CLO-backed study piece) | MoMu's CLO model loads on its mannequin | Pass |
| TC45 | `up-close.html?id=NOPE` | Redirects to the Stage | Pass |

## Share card

| # | Scenario | Expected | Result |
|---|---|---|---|
| TC50 | Share, type a name, Download | `momu-look.png`, 1080 x 1920, name capped at 20 characters, markup stripped | Pass |
| TC51 | Share while wearing a won study piece alone | One "Dress" row, not Dress + Cloth + Sleeves of the same piece | **Fixed** (B5) |
| TC52 | Share after winning a wearable and a study fabric | "Won" row lists both, not only the wearable | **Fixed** (B6) |

## Robustness (storage is user-controlled)

| # | Scenario | Expected | Result |
|---|---|---|---|
| TC60 | `atelier.save.v1` is `{bad`, `[]`, or names a locked piece / finish 9 | Page boots with the default look | Pass |
| TC61 | `atelier.new.v1` is `{}` or `5` | Page boots (was a page error that stopped the Stage) | **Fixed** (B8) |
| TC62 | `atelier.found.v1` is `"str"`, `{"ST2435":"ab"}` or `{"ST2435":[7,8,9]}` | Stage boots with the piece still locked; Up close opens at 0 of 3 | **Fixed** (B8) |
| TC63 | `atelier.won.v1` is not an array | Ignored | Pass |

## Layout

| # | Scenario | Expected | Result |
|---|---|---|---|
| TC70 | Stage, wardrobe half, fact card, Museum, story at 320 x 568 and 390 x 844 | No element past the right edge, no horizontal scroll | Pass |

## Known, not fixed here

- Narration audio: was missing on `main` during the run (every story used the phone voice); PR #57 merged since, and
  after the rebase the Jak story plays its recorded file (0:34). Not listened to end to end here.
- Console warning "Multiple instances of Three.js" when the 3D view opens: model-viewer bundles its own three.js. Harmless.
- `up-close.html?id=<unknown>` logs the deliberate `no splat piece` error after redirecting.
- The share card says "All from 1920" for a single piece dated 1920 to 1925 (it uses the start year). Wording only.
- Not covered headless: tapping details on a real splat, NFC on a phone, AR, the narration voice itself.
