// The nine scenes of the MoMu teaser, one per sentence of script.ts. Frame 0 of each component is its scene start.
// Every fact on screen comes from mockups/pieces.json, narration.json or records.json (D3).
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ARRIVE, arrive, C, Caption, countUp, Label, Logo, Phone, PHONE, Photo, pt, SANS, SERIF } from "./ui";
import type { TimedScene } from "./script";

type P = { scene: TimedScene };
const PX = 1920 - 120 - (PHONE.w + 2 * PHONE.bezel);   // phone column, right
const PY = Math.round((1080 - (PHONE.h + 2 * PHONE.bezel)) / 2);
const s = (sec: number) => Math.round(sec * 30);

// the phone slides up into place at `at`, quick and settled
const usePhoneIn = (at = 0) => {
  const p = arrive(useCurrentFrame(), at, 12);
  return { opacity: p, translate: `0px ${(1 - p) * 120}px` };
};
// a screen swap: the next capture lands over the last at `at`
const Swap: React.FC<{ src: string; at: number }> = ({ src, at }) => {
  const p = arrive(useCurrentFrame(), at, 7);
  return <Img src={staticFile(`shots/${src}`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: p, translate: `${(1 - p) * 40}px 0px` }} />;
};
// a red ring that draws itself around a point on the phone screen
const Ring: React.FC<{ x: number; y: number; w: number; h: number; at: number; round?: boolean }> = ({ x, y, w, h, at, round }) => {
  const p = arrive(useCurrentFrame(), at, 10);
  return <div style={{ position: "absolute", left: pt(x), top: pt(y), width: pt(w), height: pt(h), border: `5px solid ${C.accent}`,
    borderRadius: round ? "50%" : 10, opacity: p, scale: `${1.25 - 0.25 * p}` }} />;
};

// 1. The result first: two pieces, 255 years apart, in one look
export const Hook: React.FC<P> = ({ scene }) => {
  const f = useCurrentFrame();
  const a = arrive(f, 0, 10), b = arrive(f, scene.phrases[1].at, 10);
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <div style={{ position: "absolute", left: 120, top: SAFE_TOP }}><Logo width={150} /></div>
      <Caption phrases={scene.phrases} top={170} />
      <div style={{ position: "absolute", left: 120, top: 470, display: "flex", gap: 48 }}>
        <div style={{ opacity: a, translate: `0px ${(1 - a) * 40}px` }}>
          <Photo src="ST503.jpg" w={300} h={330} />
          <div style={{ fontFamily: SANS, fontSize: 84, color: C.accent, marginTop: 14 }}>{countUp(f, 0, s(1.1), 1700, 1750)}</div>
          <Label>Jak · ST503</Label>
        </div>
        <div style={{ opacity: b, translate: `0px ${(1 - b) * 40}px` }}>
          <Photo src="ST2407_1-2.jpg" w={300} h={330} />
          <div style={{ fontFamily: SANS, fontSize: 84, color: C.accent, marginTop: 14 }}>{countUp(f, scene.phrases[1].at, s(1.1), 1950, 2005)}</div>
          <Label>Football boots · ST2407/1-2</Label>
        </div>
      </div>
      <Phone src="look-jak-boots.png" x={PX} y={PY} style={usePhoneIn(scene.phrases[2].at - 6)}>
        <Ring x={14} y={103} w={240} h={24} at={scene.phrases[2].at + s(0.9)} />
      </Phone>
    </AbsoluteFill>
  );
};
const SAFE_TOP = 80;

// 2. The sticker beside the jak at MoMu, and a phone that taps it
export const Sticker: React.FC<P> = ({ scene }) => {
  const f = useCurrentFrame();
  const card = arrive(f, s(0.4), 10), tap = arrive(f, scene.phrases[1].at + s(0.3), 10);
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <Caption phrases={scene.phrases} />
      <Photo src="ST503.jpg" w={620} h={780} style={{ position: "absolute", left: 1180, top: 150 }} />
      <div style={{ position: "absolute", left: 1000, top: 760, width: 300, padding: "26px 28px", background: C.paper, boxShadow: "3px 5px 22px rgb(0 0 0 / .16)",
        opacity: card, translate: `0px ${(1 - card) * 30}px` }}>
        <Logo width={92} />
        <div style={{ fontFamily: SANS, fontSize: 30, marginTop: 16, color: C.ink }}>Tap to meet this piece</div>
        <div style={{ fontFamily: SANS, fontSize: 20, marginTop: 8, letterSpacing: "0.06em", color: C.muted }}>JAK · ST503</div>
      </div>
      {/* the tap: a ring that opens around the whole sticker (centre 1150, 845), never across its words */}
      <div style={{ position: "absolute", left: 1150 - (60 + 140 * tap), top: 845 - (60 + 80 * tap), width: 2 * (60 + 140 * tap), height: 2 * (60 + 80 * tap), borderRadius: "50%",
        border: `5px solid ${C.accent}`, opacity: tap * (1 - interpolate(f, [scene.phrases[1].at + s(0.8), scene.phrases[1].at + s(1.6)], [0, 0.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })) }} />
    </AbsoluteFill>
  );
};

// a phrase of a quote that turns MoMu red at `at`
const Hi: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) =>
  <span style={{ color: useCurrentFrame() >= at ? C.accent : C.ink }}>{children}</span>;

// 3. The story sheet, and the record's own words
export const Story: React.FC<P> = ({ scene }) => {
  const f = useCurrentFrame();
  const q = arrive(f, scene.phrases[1].at + s(0.4), 10);
  const hi = [0, 1, 2, 3].map(i => scene.phrases[1].at + s(1.1 + 0.55 * i));
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <Caption phrases={scene.phrases} />
      <div style={{ position: "absolute", left: 120, top: 470, width: 980, borderLeft: `6px solid ${C.accent}`, paddingLeft: 36, opacity: q, translate: `0px ${(1 - q) * 30}px` }}>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 50, lineHeight: 1.25, color: C.ink }}>
          “The jacket reaches to the <Hi at={hi[0]}>waist</Hi> and has <Hi at={hi[1]}>long skirts</Hi>, a <Hi at={hi[2]}>square neckline</Hi> and close-fitting <Hi at={hi[3]}>sleeves to the elbow</Hi>.”
        </div>
        <div style={{ marginTop: 22 }}><Label>MoMu record · ST503</Label></div>
      </div>
      <Phone src="story.png" x={PX} y={PY} style={usePhoneIn(0)} />
    </AbsoluteFill>
  );
};

// 4. Guess the year: a miss, then the win
export const Guess: React.FC<P> = ({ scene }) => {
  const f = useCurrentFrame();
  const miss = s(1.2), win = scene.phrases[1].at + s(0.3);
  const year = f < miss ? 1900 : countUp(f, miss + s(0.5), s(0.8), 1900, 1760);
  const won = arrive(f, win, 9);
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <Caption phrases={scene.phrases} />
      <div style={{ position: "absolute", left: 120, top: 430 }}>
        <div style={{ fontFamily: SANS, fontSize: 200, lineHeight: 1, color: f < win ? C.ink : C.accent }}>{year}</div>
        <div style={{ fontFamily: SANS, fontSize: 44, marginTop: 18, color: C.muted, opacity: arrive(f, miss, 6) * (1 - won) }}>Earlier than 1900. Try again.</div>
        <div style={{ fontFamily: SANS, fontSize: 44, marginTop: -54, color: C.ink, opacity: won, translate: `0px ${(1 - won) * 20}px` }}>You won it! Made 1750 to 1780</div>
      </div>
      <Phone src="guess.png" x={PX} y={PY}>
        <Swap src="guess-earlier.png" at={miss} />
        <Swap src="won.png" at={win} />
      </Phone>
    </AbsoluteFill>
  );
};

// 5. The wardrobe opens on the jak, marked New
export const Wardrobe: React.FC<P> = ({ scene }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <Caption phrases={scene.phrases} />
      <div style={{ position: "absolute", left: 120, top: 480, display: "flex", gap: 22, alignItems: "baseline" }}>
        <div style={{ fontFamily: SANS, fontSize: 160, lineHeight: 1, color: C.accent }}>{countUp(f, s(0.6), s(0.7), 6, 7)}</div>
        <div style={{ fontFamily: SANS, fontSize: 48, color: C.ink }}>in your wardrobe</div>
      </div>
      <Phone src="wardrobe-new.png" x={PX} y={PY}>
        <Ring x={8} y={666} w={124} h={150} at={scene.phrases[1].at} />
        <Swap src="look-jak-boots.png" at={scene.phrases[1].at + s(1.0)} />
      </Phone>
    </AbsoluteFill>
  );
};

// 6. A timeline that draws itself: four pieces, 1750 to 2005
const PIECES_ON_LINE = [
  { year: 1750, src: "ST503.jpg", name: "Jak" },
  { year: 1979, src: "ST80881_1024.jpg", name: "Furisode kimono" },
  { year: 1998, src: "ST81190.jpg", name: "A.F. Vandevorst coat" },
  { year: 2005, src: "ST2407_1-2.jpg", name: "Football boots" },
];
export const Centuries: React.FC<P> = ({ scene }) => {
  const f = useCurrentFrame();
  const L = 120, W = 1060, Y = 760, x = (i: number) => L + 90 + i * ((W - 180) / 3);   // evenly spaced: the years carry the scale
  const line = interpolate(f, [0, s(1.0)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const at = [s(0.3), scene.phrases[1].at, scene.phrases[2].at, scene.phrases[2].at + s(0.6)];
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <Caption phrases={scene.phrases} size={58} width={1080} />
      <div style={{ position: "absolute", left: L, top: Y, width: W * line, height: 3, background: C.ink }} />
      <div style={{ position: "absolute", left: x(0), top: Y - 2, height: 7, background: C.accent,
        width: (x(3) - x(0)) * interpolate(f, [at[3] + s(0.7), at[3] + s(1.4)], [0, 1], { easing: ARRIVE, extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }} />
      {PIECES_ON_LINE.map((p, i) => {
        const a = arrive(f, at[i], 9);
        return (
          <div key={p.year} style={{ position: "absolute", left: x(i) - 70, top: Y - 210, width: 140, opacity: a, translate: `0px ${(1 - a) * 30}px` }}>
            <Photo src={p.src} w={140} h={170} />
            <div style={{ position: "absolute", left: 64, top: 202, width: 12, height: 12, borderRadius: 6, background: C.accent }} />
            <div style={{ fontFamily: SANS, fontSize: 38, color: C.accent, marginTop: 50 }}>{p.year}</div>
            <div style={{ fontFamily: SANS, fontSize: 24, color: C.muted, width: 230 }}>{p.name}</div>
          </div>
        );
      })}
      <Phone src="look-kimono.png" x={PX} y={PY} style={usePhoneIn(scene.phrases[1].at - 6)} />
    </AbsoluteFill>
  );
};

// 7. Up close: find the rivets the record describes
export const Closer: React.FC<P> = ({ scene }) => {
  const f = useCurrentFrame();
  const found = scene.phrases[1].at + s(0.2), chip = arrive(f, found, 9);
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <Caption phrases={scene.phrases} size={62} />
      <div style={{ position: "absolute", left: 120, top: 520, padding: "22px 30px", border: `2px solid ${chip > 0.5 ? C.accent : C.line}`, opacity: chip, translate: `0px ${(1 - chip) * 24}px` }}>
        <Label color={C.accent}>Found 1 of 3</Label>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 46, marginTop: 10 }}>Rivets instead of seams</div>
      </div>
      <div style={{ position: "absolute", left: 120, top: 730, width: 980, fontFamily: SERIF, fontStyle: "italic", fontSize: 36, lineHeight: 1.3, color: C.muted,
        opacity: arrive(f, found + s(1.2), 9), translate: `0px ${(1 - arrive(f, found + s(1.2), 9)) * 20}px` }}>
        “Rather than sewing the pieces together, the designers used rivets … to attach the separate parts.”
        <div style={{ marginTop: 14 }}><Label>The piece's story · ST81190</Label></div>
      </div>
      <Phone src="upclose.png" x={PX} y={PY} style={usePhoneIn(0)}
        screen={{ transformOrigin: `${pt(232)}px ${pt(178)}px`, scale: `${1 + 0.7 * arrive(f, s(1.1), 12)}` }}>
        <Ring x={210} y={156} w={44} h={44} at={found} round />
      </Phone>
    </AbsoluteFill>
  );
};

// 8. The share card: 255 years, credited to MoMu
export const Share: React.FC<P> = ({ scene }) => {
  const f = useCurrentFrame();
  const card = arrive(f, 0, 12);
  const CROP = 0.925, H = 900, Wc = Math.round((H * 1080) / 1920 / CROP), k = Wc / 1080;
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <Caption phrases={scene.phrases} />
      <div style={{ position: "absolute", left: 120, top: 420, display: "flex", alignItems: "baseline", gap: 24 }}>
        <div style={{ fontFamily: SANS, fontSize: 220, lineHeight: 1, color: C.accent }}>{countUp(f, s(0.2), s(1.3), 0, 255)}</div>
        <div style={{ fontFamily: SANS, fontSize: 56 }}>years</div>
      </div>
      <div style={{ position: "absolute", left: 120, top: 690, opacity: arrive(f, scene.phrases[1].at, 9) }}>
        <Label>Collection: MoMu Fashion Museum Antwerp</Label>
      </div>
      {/* the card cropped above its last lines (the capture shows the local test address there); the ring marks MoMu's masthead */}
      <div style={{ position: "absolute", left: 1920 - 120 - Wc, top: 90, width: Wc, height: H, overflow: "hidden", boxShadow: "0 30px 70px rgb(0 0 0 / .2)",
        opacity: card, translate: `0px ${(1 - card) * 80}px` }}>
        <Img src={staticFile("shots/share-card.png")} style={{ width: Wc, display: "block" }} />
        <div style={{ position: "absolute", left: 44 * k, top: 36 * k, width: 274 * k, height: 181 * k, border: `5px solid ${C.accent}`, borderRadius: 10,
          opacity: arrive(f, scene.phrases[1].at + s(0.8), 9), scale: `${1.15 - 0.15 * arrive(f, scene.phrases[1].at + s(0.8), 9)}` }} />
      </div>
    </AbsoluteFill>
  );
};

// 9. End card, as the deck's closing slide
export const End: React.FC<P> = ({ scene }) => {
  const f = useCurrentFrame();
  const { width } = useVideoConfig();
  const logo = arrive(f, 0, 12), meta = arrive(f, scene.phrases[1].at + s(0.7), 9), tag = arrive(f, scene.phrases[1].at + s(1.4), 9);
  return (
    <AbsoluteFill style={{ background: C.paper, alignItems: "center" }}>
      <div style={{ position: "absolute", top: 220, scale: `${0.9 + 0.1 * logo}`, opacity: logo }}><Logo width={520} /></div>
      <div style={{ position: "absolute", top: 470, width, textAlign: "center", fontFamily: SANS, fontSize: 66, color: C.ink }}>
        {scene.phrases.map(p => <div key={p.text} style={{ opacity: arrive(f, p.at + s(0.4), 9), translate: `0px ${(1 - arrive(f, p.at + s(0.4), 9)) * 24}px` }}>{p.text}</div>)}
      </div>
      <div style={{ position: "absolute", top: 760, width, textAlign: "center", opacity: meta }}>
        <div style={{ fontFamily: SANS, fontSize: 40, color: C.accent }}>museum-atelier.vercel.app</div>
        <div style={{ marginTop: 18, opacity: tag }}><Label>@momuantwerp / #momuantwerp</Label></div>
      </div>
    </AbsoluteFill>
  );
};

export const SCENES = { hook: Hook, sticker: Sticker, story: Story, guess: Guess, wardrobe: Wardrobe, centuries: Centuries, closer: Closer, share: Share, end: End };
