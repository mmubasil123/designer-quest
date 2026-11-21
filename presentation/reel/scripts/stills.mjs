// Renders each scene at its fullest moment (all phrases in) and puts them on one storyboard sheet.
// node scripts/stills.mjs <outdir>
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
const out = process.argv[2] || "reels/momu-teaser/storyboard";
mkdirSync(out, { recursive: true });
const { TIMELINE } = await import("../src/teaser/script.ts");
const files = [], env = { ...process.env, COLS: "3", W: "620" };
TIMELINE.forEach((s, i) => {
  const frame = s.from + s.duration - 6, file = `${out}/${String(i + 1).padStart(2, "0")}-${s.id}.png`;
  execFileSync("npx", ["remotion", "still", "src/index.ts", "MomuTeaser", file, `--frame=${frame}`], { stdio: "ignore" });
  files.push(file);
  env["L" + (i + 1)] = `${s.id} · ${(s.from / 30).toFixed(1)}–${((s.from + s.duration) / 30).toFixed(1)} s · ` + s.phrases.map(p => p.text.replace(/\*/g, "")).join(" ");
});
execFileSync("node", ["scripts/sheet.mjs", `${out}/storyboard.png`, ...files], { env, stdio: "inherit" });
console.log(`${out}/storyboard.png`);
