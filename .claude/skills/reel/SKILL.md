---
name: reel
description: Make a finished MoMu reel (1920 x 1080 by default, captions, motion graphics in code, Remotion) from one line. Use when someone types /reel or asks for a reel, a teaser, a demo video or an animated explainer of the app.
---

# Make a reel

Adapted for this repo from the "/reel" setup prompt (2026-11-21, ticket E2). One line in, one finished video out,
saved as `presentation/reel/reels/<short-name>/<short-name>.mp4` (git-ignored). The Remotion project is
`presentation/reel/`; its agent skills are in `presentation/reel/.agents/skills/` (start at
`remotion-best-practices/SKILL.md`). Read `presentation/reel/style.md` first, every time. The person approves two
things, the script and the storyboard. Never skip either.

**Before you start.** Reels come out best on Claude Opus 5.5 or newer at high effort. If that is what you are
running, say nothing; otherwise say how to switch and ask whether to switch first.

1. **The idea.** If the line doesn't make clear what the reel should say or who it is for, ask two or three short
   questions first. `presentation/STORYLINE.md` holds the story, persona (Noor, 19) and demo order.
2. **Script.** 70 to 130 words (25 to 45 seconds).
   - The first line says what the reel is for and gives a reason to stay. Real value starts by 10 seconds.
   - Complete sentences a person would say. Specific, true numbers. Every fact about a MoMu piece comes from the
     collection data (`mockups/pieces.json`, `narration.json`, `records.json`), never from memory (D3).
   - One idea per sentence, because each sentence becomes one picture. End on the last idea, with no summary.
   - Show the script and wait. Go on only when the person approves it.
3. **Voice.** Use the voice in `style.md`. With no voice, time the words at the reading speed it gives. With
   Kokoro, speak a sentence at a time into one file and time words with Remotion's Whisper tooling (the script is
   the truth; take only the times). With ElevenLabs, use the "with timestamps" endpoint and the key in `.env`
   (never print it).
4. **Plan.** Write `plan.md` in the reel's folder: one scene per sentence, its words, start and end, what is on
   screen. Check it against "Make it look good" before drawing.
5. **Storyboard.** Render each scene as one still at its fullest moment (`npx remotion still`) onto one numbered
   sheet with its words under each. Show it and wait for approval; redraw what they want changed.
6. **Build.** Animate each approved scene in Remotion, following its agent skills.
   - Every movement is calculated from the current frame. No CSS animations or transitions.
   - Each change on screen lands on the word it belongs to.
7. **Captions.** With a voice: each word appears when spoken and the spoken word is highlighted, two to five words
   a line. With no voice: the sentence is the caption, revealed in short phrases on its reading time.
8. **Sound.** A few small effects on the moments that land, generated in code (no downloaded assets). Any voice is
   always the loudest thing.
9. **Render** to MP4 (H.264) at the size in `style.md`.
10. **Check your own work:** measure first, then look.
    - **Dead spots:** a frame every half second, each compared with the one before; a stretch longer than
      `style.md` allows with almost no change is a dead spot.
    - **Too busy:** more things moving at once than `style.md` allows, or most of the picture changing with no scene
      change.
    - **Reading:** the frames on one sheet with their times: text blurred, cut off, too small, or outside the safe area.
    - **Sound:** the audio plays to the end of the last line.
    - Fix what fails and render again, three rounds at most. Say what you measured, what failed and what you changed.
11. **Hand over.** Give the file's path and one thing you'd improve next. Log it in `CHANGELOG.md`.

When the person asks for a change ("make the hook bigger"), change only that and render again. When they say how it
should feel ("calmer", "bigger text"), change the reel, then the numbers and rules in `style.md` to match, and say
what you changed there.

## Make it look good

- Show the idea as a drawing: a diagram, a timeline, an object, the app's screen at work. Few words on screen.
- One focus at a time. Change what is already there (grow it, fill it, break it) before replacing it.
- The picture changes with every sentence, always with motion. Nothing sits still while the words move on.
- Moves are short and land with weight: things arrive fast and settle. No slow fades, no spinning, no drifting.
- Numbers count up. Lines draw themselves. When the words are about the app, show its real screen and make it move.
- One font, the colours in `style.md`, the accent only on what matters. No gradients, glows, emoji or stock icons.
- The first frame already shows the hook as text, and something is moving.
- Everything that must be read stays inside the safe area in `style.md`.
- If a frame could belong to any video, make it belong to MoMu: its pieces, its photos, its red.
