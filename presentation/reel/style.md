# Reel style (MoMu)

The look every reel in `presentation/reel/` starts from. Edit this file, or ask the agent to, and the next reel
follows it. Decided by Hassan on 2026-11-21 (E2 grill); the look itself is MoMu's, from `mockups/theme.css`.

## Format
- 1920 x 1080 at 30 fps (16:9): shown full-screen from the presenter's laptop, not embedded in the 4:3 deck.
- About 45 seconds. Standalone: no presenter talks over it.

## Voice
- None. Music-free; a few small sound effects made in code. The on-screen captions carry every line.
- Word times: a natural reading speed of 2.6 words a second, plus 0.5 s after each sentence.
- To add a voice later: Kokoro (local, free) or ElevenLabs; change this section and the skill uses it.

## Colours (MoMu template)
- Background: `#ffffff`; gallery grey behind photos: `#ededed`.
- Text: `#000000`; secondary text: `#595959`.
- Accent: `#d72f25` (MoMu red), only on what matters: titles and the one number in a scene.

## Type
- One font: Hanken Grotesk (OFL, `public/fonts/hanken-grotesk.woff2`), regular weight.
- Titles in red capitals, tracked +0.01em, like the template. Record quotes may use Source Serif 4 italic.

## Brand
- MoMu's official two-M logo (`public/brand/momu-logo.svg`) on the first and last frame. No product name: the app
  is presented as MoMu's (H10).
- Closing card as the deck's: `second-skin-ten.vercel.app`, `@momuantwerp / #momuantwerp`.

## Facts (D3)
- Every name, date and quote comes from `mockups/pieces.json`, `mockups/narration.json` or `mockups/records.json`.
  Missing: "not recorded". Pictures are MoMu's own photos (`mockups/assets/src/`) or the app's real screens.

## Checks (the skill measures these)
- Nothing still for more than 1 second.
- No more than 2 things moving at once.
- Safe area: everything that must be read stays 80 px inside every edge (projector overscan).
