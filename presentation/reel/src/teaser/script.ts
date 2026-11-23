// The approved script (E2, 2026-11-21), one scene per sentence. No voice: each sentence is the caption, shown in
// phrases at the reading speed in style.md. *word* marks the accent (MoMu red). Facts: pieces.json, narration.json.
export const FPS = 30;
const WORDS_PER_SECOND = 2.6;
const PAUSE = 0.5;   // seconds after each sentence
const MIN_SECONDS = 3.2;
const END_HOLD = 1.8;   // the end card stays long enough to read the address: the one sanctioned still moment

export type SceneId = "hook" | "sticker" | "story" | "guess" | "wardrobe" | "centuries" | "closer" | "share" | "end";

export const SCRIPT: { id: SceneId; phrases: string[] }[] = [
  { id: "hook", phrases: ["A jak from *1750*", "and football boots from *2005*,", "worn as one look."] },
  { id: "sticker", phrases: ["It started with a sticker", "beside a piece at MoMu."] },
  { id: "story", phrases: ["Tap it,", "and the piece tells you its story."] },
  { id: "guess", phrases: ["Guess when it was made,", "and you *win* it."] },
  { id: "wardrobe", phrases: ["Every piece you win", "goes into your wardrobe."] },
  { id: "centuries", phrases: ["Dress up across the centuries:", "a *1979* furisode kimono,", "the fabric of a *1998* Vandevorst coat."] },
  { id: "closer", phrases: ["Look closer, and find the metal rivets", "the record describes,", "on MoMu's 3D model."] },
  { id: "share", phrases: ["Your look spans *255* years,", "and every share credits MoMu."] },
  { id: "end", phrases: ["The rest of the collection", "is waiting for you."] },
];

const count = (s: string) => s.split(/\s+/).filter(Boolean).length;

export type TimedScene = { id: SceneId; from: number; duration: number; phrases: { text: string; at: number }[] };

// frames: each phrase appears when its first word would be read; the scene lasts its reading time plus the pause
export const TIMELINE: TimedScene[] = (() => {
  let from = 0;
  return SCRIPT.map(({ id, phrases }) => {
    let words = 0;
    const timed = phrases.map(text => {
      const at = Math.round((words / WORDS_PER_SECOND) * FPS);
      words += count(text);
      return { text, at };
    });
    const hold = id === "end" ? END_HOLD : 0;
    const duration = Math.round((Math.max(MIN_SECONDS, words / WORDS_PER_SECOND + PAUSE) + hold) * FPS);
    const scene = { id, from, duration, phrases: timed };
    from += duration;
    return scene;
  });
})();

export const TOTAL_FRAMES = TIMELINE.reduce((n, s) => n + s.duration, 0);
