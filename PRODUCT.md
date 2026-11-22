# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Primary:** 15 to 25 year olds visiting MoMu (Antwerp's fashion museum) and its Study Collection, on their phone,
  often brought by a friend; they thrift, follow fashion online and have never heard of the Study Collection
  (persona Noor, 19, in `presentation/STORYLINE.md`). Second persona: Sam, 23, a fashion student who wants the rare
  study pieces.
- **Also:** the hackathon jury, who see the same screens during the pitch.

## Product Purpose
Make MoMu's Study Collection accessible and interesting to young people: tap a sticker beside a real piece, hear its
story, win it by guessing when it was made, wear it on a museum dress form, remix fabrics across centuries and share
the look. Success: visitors leave with a wardrobe and a look they want to show, and remember the dates they guessed.

## Positioning
Real MoMu records and real garments (scans and MoMu's CLO models) on one dress form, so a single look can span 255
years (a 1750 jak with 2005 football boots). Every fact quotes the museum's record; every share credits MoMu.

## Operating Context
In the museum on the visitor's own phone (no app store, no account), stickers or NFC tags beside the pieces; at home
afterwards via a shared link. Static web app on Vercel (`museum-atelier.vercel.app`).

## Capabilities and Constraints
- Stage with a turnable dress form and a wardrobe sheet; story sheet with narration; guess-the-year win; Up close
  (find the recorded details on a 3D model); Remix (one piece's fabric on another); 9:16 share card.
- 19 pieces in `mockups/pieces.json`; the harvested DB holds 4622 objects (2075 with images).
- Facts only from the collection data; a missing field says "not recorded" (decision D3).
- No account, nothing stored on a server; progress lives on the phone.
- App name not decided: the app carries MoMu's name only.

## Brand Commitments
- MoMu's hackathon presentation template (required by the museum): white ground, black text, headings in red
  capitals in a plain grotesque, red #d72f25. MoMu's own logo, black, never recoloured or squashed.
- Tokens and fonts in `mockups/theme.css` (Hanken Grotesk, Source Serif 4 for stories and record quotes).

## Evidence on Hand
- Piece photos and garment cutouts `mockups/assets/src/`, GLBs `mockups/assets/*.glb`, fabric swatches.
- 44 s teaser video (E2), `presentation/DEMO_VIDEO.md`.
- No testimonials, visitor numbers or press exist: never invent them.

## Product Principles
1. The museum's own words: every fact quotes a record.
2. Play before reading: you win a piece by noticing something about it.
3. Wearable across time: the delight is a look no century could have made.
4. Zero friction: no install, no account.
5. Credit MoMu everywhere a look travels.

## Accessibility & Inclusion
AA contrast, 44 px targets, reduced motion respected, readable at 320 px; English text for Dutch-only records is
marked as a translation.
