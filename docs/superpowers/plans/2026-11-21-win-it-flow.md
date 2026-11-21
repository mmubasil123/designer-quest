# Win it flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A room piece is won with one challenge after its NFC tap, then added to the wardrobe; one simple flow for the demo.

**Architecture:** New `mockups/win.js` + `win.css` (a dialog, same pattern as `quiz.js`/`story.js`) exports `judge()` and
`createWin()`. `second-skin.html` calls it after `showScan()` for wearables and on `?fabric=` for study pieces, keeps
wins in `secondSkin.won.v1`, and loses the kimono-only Piece screen.

**Tech Stack:** static ES modules, three.js page as is; Node 22 for the self-check.

**Spec:** `docs/superpowers/specs/2026-11-21-win-it-flow-design.md`

## Global Constraints
- Facts only from `records.json` / `pieces.json` (D3). No points, stars, streaks, timers.
- Do not edit `story.js` or `quiz.js` (H3, Hassan).
- 44 px targets, reduced-motion safe, no em or en dashes in new copy.

## Review Focus
- A won wearable must survive reload (restore check rejects locked ids otherwise).
- An old save wearing the now-locked jak must fall back to the starter look, not crash.
- `?card=` for an already won piece: no second challenge, just open its slot.
- Year range with from == to (ST80931 1965) judges correctly.
- Museum dialog lists wearable room pieces too.

---

### Task 1: `judge()` and its self-check
**Files:** Create `mockups/win.js`, `mockups/tools/win_check.mjs`
**Produces:** `judge(guess: number, year: {from, to}) -> { won: boolean, off: number, hint: "earlier"|"later"|null }`;
`off` is 0 inside the range, else the distance to the nearest end; won when `off <= 25`.
- [ ] `win_check.mjs` asserts: `judge(1765,{from:1750,to:1780})` -> won, off 0; `judge(1700,...)` -> off 50, hint "later", not won;
  `judge(1806,...)` -> off 26, hint "earlier"; `judge(1990,{from:1965,to:1965})` -> won, off 25.
- [ ] Run `node mockups/tools/win_check.mjs`: prints `ok`.

### Task 2: Win dialog
**Files:** `mockups/win.js`, create `mockups/win.css`
**Produces:** `createWin({ PIECES, records, img }) -> { guess(id): Promise<number|null>, won(id, { off }): Promise<boolean> }`.
`guess` shows the slider (1700 to 2025, step 5, starts 1900), Guess button, "Earlier"/"Later" hints, third miss wins.
`won` shows photo, date, "You were N years off" (only when off given), `quoteEn` else `quote`, Add to wardrobe (resolves true).

### Task 3: Wire the flow into `second-skin.html`
- `pieces.json`: `ST503.locked = true`; starter `look.top = "ST2434"`.
- `secondSkin.won.v1` unlocks won ids at boot, before the save restore.
- `?card=<wearable>`: locked -> showScan(next "Win it") -> guess -> won -> unlock, save, open its slot, New. Unlocked -> open its slot.
- `?card=<study>`: back to the original redirect to Up close (story first). `?fabric=` -> won() then Remix tab, New.
- Museum lists every `locked` room piece; tap -> NFC dialog (wearable) or Up close (seen study).
- Remove the Piece screen, Learn button, VARIANTS, model-viewer, wearBtn.
- Verify in Chrome at 390 px: tap jak flow, study claim flow, reload keeps the jak, console clean.

### Task 4: Docs
CHANGELOG entry, LEDGER D2 row, STORYLINE demo beats, HANDOVER line, draft heads-up to Hassan.
