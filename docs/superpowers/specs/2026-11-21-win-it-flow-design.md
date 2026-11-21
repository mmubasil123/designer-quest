# Win it: one flow from the room to the wardrobe (2026-11-21)

## Intent
Show judges, in a 5-minute demo, how Second Skin brings new audiences to MoMu: you play with a starter wardrobe,
then the pieces in the room are something you hunt and win, and every win lands in your digital wardrobe.
Approved by Mubasil in chat on 2026-11-21.

## Flow
```
Open app: Stage with the starter wardrobe (pieces with locked: false)
Tap an NFC sticker in the room (?card=<id>)
  wearable: Stage boots, story (H3, Hassan's), Guess the year, Won, Add to wardrobe
  study:    story, Up close (find 3 details), Claim its fabric, Stage, Won, Add to wardrobe
Wardrobe opens on the new piece, marked New (not put on the form); wear, remix, share
Museum button: every room piece, won or still to find
```

## Decisions
- Room pieces are the ones with `locked: true` in `pieces.json`: the jak ST503 (wearable; the knee breeches ST2062 stay hidden until they have a GLB)
  plus the 9 study pieces. The starter look moves from the jak to the green wool coat ST2434.
- Guess the year: one slider. A guess within 25 years of the record's range wins. Otherwise "Earlier" or "Later" and
  try again; the third miss wins anyway. You always win; the game is the guess, not a gate you can fail.
- Won card (shared by both kinds): photo, the real date, how far off you were (wearables), the record's description in
  our English (`records.json` `quoteEn`, else the Dutch `quote`), Add to wardrobe. Facts only from records (D3).
- Wins are saved in `secondSkin.won.v1` (array of ids); study fabrics keep `secondSkin.found.v1`.
- The kimono-only Piece screen and its Learn button are removed; the ⓘ fact card is the one place to read a piece.
- D2 changes: winning a room piece is now one challenge after its story. Hassan gets a heads-up (Change policy).

## Approaches considered
- Three rounds with stars: rejected by Mubasil as too much; the flow must stay simple.
- Spot-the-detail on photos for wearables: needs 6 hand-placed, verbatim-quoted details; no time.
- One challenge per kind of piece (picked): Guess the year for wearables, Up close for study pieces.

## Non-goals
No points, stars, streaks, timers or leaderboards (D2, and the findings doc: competition does not drive learning).
No change to story.js or quiz.js (H3 is Hassan's).
