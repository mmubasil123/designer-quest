import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { SCENES } from "./scenes";
import { TIMELINE, type TimedScene } from "./script";

type Sfx = "tick" | "pop" | "miss" | "win" | "close";
const s = (sec: number) => Math.round(sec * 30);

// A few small sounds on the moments that land (scripts/sfx.py makes them). The frames mirror scenes.tsx.
const cues = (sc: TimedScene): [number, Sfx][] => {
  const p = sc.phrases.map(x => x.at);
  switch (sc.id) {
    case "hook": return [[s(1.1), "tick"], [p[1] + s(1.1), "tick"], [p[2] - 6, "pop"]];
    case "sticker": return [[s(0.4), "pop"], [p[1] + s(0.3), "pop"]];
    case "story": return [[0, "pop"], [p[1] + s(0.4), "tick"]];
    case "guess": return [[s(1.2), "miss"], [p[1] + s(0.3), "win"]];
    case "wardrobe": return [[s(1.3), "tick"], [p[1], "pop"]];
    case "centuries": return [[s(0.3), "tick"], [p[1], "tick"], [p[2], "tick"], [p[2] + s(0.6), "tick"]];
    case "closer": return [[0, "pop"], [p[1] + s(0.2), "win"]];
    case "share": return [[s(1.5), "win"]];
    case "end": return [[0, "close"]];
  }
};

// The MoMu teaser: the nine scenes back to back, each as long as its sentence takes to read
export const Teaser: React.FC = () => (
  <AbsoluteFill style={{ background: "#fff" }}>
    {TIMELINE.map(scene => {
      const Scene = SCENES[scene.id];
      return (
        <Sequence key={scene.id} name={scene.id} from={scene.from} durationInFrames={scene.duration}>
          <Scene scene={scene} />
          {cues(scene).map(([at, sfx], i) => (
            <Sequence key={i} name={`sfx ${sfx}`} from={at} layout="none">
              <Audio src={staticFile(`sfx/${sfx}.wav`)} />
            </Sequence>
          ))}
        </Sequence>
      );
    })}
  </AbsoluteFill>
);
