# Demo video (E2): the MoMu teaser

A 44-second, 16:9 teaser of the app, made in code (Remotion, `presentation/reel/`), from the app's real screens and
MoMu's own photos. Decided with Hassan on 2026-11-21 (grill): a standalone teaser, not the backup walkthrough; 1920 x
1080, played full-screen from the laptop (the deck is 4:3, so it is not embedded); no voice, captions and small sound
effects only; it opens on the result (the 255-year look) and then goes back to the sticker. Picsart AI clips were tried
and dropped (Hassan, 2026-11-21).

**File:** `presentation/reel/reels/momu-teaser/momu-teaser.mp4` (git-ignored, about 4 MB; H.264 + AAC, plays offline
in QuickTime, PowerPoint and any browser). Rebuild it with the commands in `presentation/reel/README.md`.

## Script (approved 2026-11-21; scenes 6 and 7 corrected with Hassan)

| # | Time | Caption | On screen | Source of every fact |
|---|---|---|---|---|
| 1 | 0.0 | A jak from 1750 and football boots from 2005, worn as one look. | Both photos, years counting up; the phone with the look; ring on the app's "Spans 255 years" | `pieces.json` ST503, ST2407/1-2; the app's own span |
| 2 | 5.5 | It started with a sticker beside a piece at MoMu. | The jak's photo, a MoMu sticker, a tap ring | ST503 |
| 3 | 9.8 | Tap it, and the piece tells you its story. | Story sheet; the record's words, key phrases turning red | `records.json` ST503 quoteEn |
| 4 | 13.8 | Guess when it was made, and you win it. | Guess 1900, "Earlier", 1760, "You won it! Made 1750 to 1780" | ST503 year |
| 5 | 17.8 | Every piece you win goes into your wardrobe. | Wardrobe with the jak marked New, "7 in your wardrobe", then the jak on the form | the app |
| 6 | 21.3 | Dress up across the centuries: a 1979 furisode kimono, the fabric of a 1998 Vandevorst coat. | A timeline drawing itself, 1750, 1979, 1998, 2005; the kimono look (no dress form since H20) | ST80881, ST81190, ST2407/1-2 |
| 7 | 28.0 | Look closer, and find the metal rivets the record describes, on MoMu's 3D model. | Up close on the coat (MoMu's CLO model since H18), zoom to a rivet, "Found 1 of 3: Rivets instead of seams", a sentence of the curator's story, words cut with an ellipsis | `narration.json` ST81190 (verbatim, since C2) |
| 8 | 33.9 | Your look spans 255 years, and every share credits MoMu. | 255 counting up; Noor's share card, ring on its MoMu masthead | the app's share card (H12) |
| 9 | 38.2 | The rest of the collection is waiting for you. | MoMu logo, designer-quest-momu.vercel.app, @momuantwerp / #momuantwerp | the deck's closing slide |

Scene 6 first said "a 1998 Vandevorst coat" as if worn on the form; the coat is a study piece whose fabric you win,
so the caption says "the fabric of". Scene 7 said "on a 3D scan"; since H18 Up close shows MoMu's CLO model of the
coat, so it says "on MoMu's 3D model" (Hassan, 2026-11-22). After H20 removed the dress form, scene 6 says "Dress up" (the app's own
words); after C2 replaced the jacket's story with the curator's text, scene 7 quotes "Rather than sewing the pieces together,
the designers used rivets … to attach the separate parts." (2026-11-22, re-render).

## Checks on the last render (2026-11-22, re-render after H-URL, H-NAME, H20, H25, H26, C2)
- Length 44.0 s (one word shorter in scene 6).
- Dead spots (nothing changes for over 1 s, frames every 0.5 s): the end card's 1.8 s hold, kept on purpose so the
  address can be read, and about 1 s at the end of scene 6 (after the red span draws), left as is.
- Too busy (over half the picture changing without a cut): none.
- Reading sheet at 12 moments: no text cut off or outside the 80 px safe area; smallest text 24 px at 1080p.
- Audio length not re-measured (no ffprobe on this machine); Remotion renders both to the composition length.
- Not yet checked on the venue projector or with the presenter's laptop speakers.

## Re-record after merges
The screens were re-captured from `main` on 2026-11-22 (second time, after H-NAME, H20, H25, H26, C2 and H27; the
rings in scenes 1, 7 and 8 were moved to match) and before that after H10 (logo and masthead), H11, H12, H13 (poetic
narration and its audio, PR #46 and #57, on the story sheet and share card), H15 and H18 (Up close shows MoMu's CLO model for the coat). Re-run
`node scripts/capture.mjs`, then render, after any change to the story sheet, the Won card, the wardrobe, Up close or
the share card (scenes 3, 4, 5, 7, 8).
