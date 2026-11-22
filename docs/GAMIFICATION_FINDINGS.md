# Gamification findings for Designer Quest (2026-11-21)

Handover for another agent. Research on museum gamification, how Designer Quest scores against it, and what can
change before the 5-minute hackathon pitch (1.5 days left). Claims about our code cite `origin/main` as of
commit `8fb18f6`; re-check them if `main` has moved.

## Sources read

1. **García-Milon, tom Dieck, Jung (2026), "Gamification in digital museum experiences: an affordance
   perspective", Current Issues in Tourism.** https://doi.org/10.1080/13683500.2026.2657925. The PDF is on Basil's laptop only (not in git); use the DOI.
   - Setting: one interactive table in a 19th-century match factory museum, where visitors play as factory workers.
     Interviews first, then a survey of 252 visitors (Feb to Mar 2022), PLSc-SEM.
   - Four affordances: rewards, competition, immersion, empathy.
   - **Empathy is the only driver of enjoyment** (and also drives flow). Enjoyment then drives perceived memorability
     and attitude reinforcement.
   - **Rewards and immersion drive learning perception.** Learning perception drives intention to donate.
   - **Competition drives flow only, not learning.**
   - Limits: one site, one exhibit, 2022 data; learning perception R² is only 12.9%. Use it as direction, not proof.
2. **Cuseum blog, "Implementing gamification in museums" (Feb 2025).** A vendor post that closes with a sales pitch
   and gives almost no evidence. Useful points: game elements must serve the mission and support learning rather
   than replace it; QR trivia in the room works; keep content fresh. Pitfall: visitors chase the mechanics instead
   of the collection.
3. **MuseumNext, Charr, "Games and play in museums" (Mar 2025).** No data. Useful points: "inviting visitors to do
   things, not just look at them"; once the urge to collect points fades, visitors ask "what was the point of
   that?"; Bletchley Park put silhouettes of real staff beside its codebreaking stations (an empathy device);
   judge play by watching people use it (where they pause, when they ask for help), not by dwell time; "Play isn't
   a panacea."

## How Designer Quest maps to the four affordances

| Affordance | What we have | Rating |
|---|---|---|
| Immersion | 3D Stage, splat Up close, card scan in the room, wear and remix | Strong |
| Rewards | Win it (D2): Guess the year wins a wearable, finding 3 details on Up close wins a study piece, which is now worn as itself. Firsts toasts reward range but name no fact. C2 questions stay optional and win nothing | Good |
| Empathy | You wear the piece, but nothing puts you in a maker's or wearer's place. `records.json` has no wearer field; it has `date`, `place`, `medium` (e.g. `handmade`, `sewing`) and a description quote | Weak |
| Competition | None, by design (D2: no leaderboards, streaks or timers). The paper backs leaving it out | Fine by choice |
| Facts from the collection | D3: only MoMu fields, "not recorded" for gaps; the curator's text for C2 stories | Strong |

Overall about 6.5/10 against the three sources. 8.5 to 9 is reachable in the time left. A 10 needs real visitor
testing and curator sign-off, which only come after the hackathon.

## Current state (verified on `origin/main`, 8fb18f6)

- **D2 now locks room pieces behind one challenge** (`LEDGER.md` D2, changed by Basil): Guess the year for wearables,
  find 3 details on Up close for study pieces. Nobody can lose; no points, streaks or timers.
- **C2 questions** (the curator's stories and questions) exist for 3 pieces: ST81190, ST81114AB, ST81116. Optional, answers
  on a tap, nothing locked.
- **H3** (story screen with narration) is done: 19 stories, one voice.
- **The demo script** (`presentation/STORYLINE.md`) already follows Win it: beat 3 Guess the year, beat 5 Up close on
  ST81190. The earlier contradiction is gone.
- **All 9 study pieces are wearable as themselves** (PR #37), so a study win now goes on as the garment.

## Still open (for Hassan to pick up or drop)

1. **Firsts toasts that name a fact** (MuseumNext's "what was the point" pitfall): e.g. "First 18th-century piece:
   silk taffeta, 1750 to 1780". `FIRSTS` in `atelier.html` names no fact today. Build only from `records.json`
   fields (`date`, `place`, `medium`), D3.
2. **Empathy line when a piece goes on**, built only from fields: "Sewn by hand in the Netherlands, 1750 to 1780".
   It must not invent a person (D3). Ties in with the season name "Fibres and Hands".
3. **Toast when every answer of a piece is revealed** ("Looked closer: 4 questions on the jacket"): a reward with
   nothing locked, so D2 holds. `quiz.js` emits an event; `atelier.html` reuses the `FIRSTS` toast.
4. **Hallway test:** hand the phone to 3 to 5 people at the hackathon and note where they stall. A real line for the
   pitch and a list of fixes.
5. **Pitch framing:** structure the 5 minutes on the paper's chain: empathy leads to enjoyment and memorability;
   rewards plus immersion lead to learning, and learning to intention to donate. Close with "Play isn't a panacea"
   and the next step: visitor testing and curator sign-off.

1 and 2 are small and need no new data; both touch `atelier.html`, so only one open branch at a time.
