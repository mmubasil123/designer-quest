import { Composition } from "remotion";
import { Teaser } from "./teaser/Teaser";
import { FPS, TOTAL_FRAMES } from "./teaser/script";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition id="MomuTeaser" component={Teaser} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
  );
};
