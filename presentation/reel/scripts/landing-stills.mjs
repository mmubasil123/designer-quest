// E4: renders each era's piece (H20: on its own, no dress form), straight from the app's own three.js Stage, as transparent PNGs
// for the landing page's year slider (mockups/index.html). Same scene, lights and fit as the app; nothing redrawn.
// Serve the mockup first: cd mockups && python3 -m http.server 8765 --bind 127.0.0.1
// Run (from presentation/reel, after npm install): node scripts/landing-stills.mjs [only-stop-id]
// Then, from mockups/assets/landing: for f in raw/*.png; do cwebp -quiet -q 80 -alpha_q 85 -resize 720 0 "$f" -o "$(basename "$f" .png).webp"; done
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.env.BASE || "http://127.0.0.1:8765";
const OUT = new URL("../../../mockups/assets/landing/raw/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const only = process.argv[2];

// one stop per era on the slider; ids and slots from mockups/pieces.json. CLO-only pieces (ST2062, the cycling outfit)
// are worn on the avatar, never the dress form (D5), so they have no stop.
export const STOPS = [
  { id: "1750", look: { top: "ST503" } },
  { id: "1795", look: { top: "ST2434" } },
  { id: "1870", look: { full: "ST2431/1-4" } },
  { id: "1900", look: { full: "ST671" } },
  { id: "1920", look: { full: "ST2435" } },
  { id: "1937", look: { full: "ST2203" } },
  { id: "1947", look: { full: "ST655/1" } },
  { id: "1950", look: { top: "ST80930" } },
  { id: "1965", look: { bottom: "ST80931" } },
  { id: "1979", look: { full: "ST80881" } },
  { id: "1998", look: { full: "ST81190" } },
  { id: "2005", look: { feet: "ST2407/1-2" } },
  { id: "look", look: { top: "ST503", bottom: "ST80931", feet: "ST2407/1-2" } },   // the 255-year look
];

const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await browser.newContext({ viewport: { width: 1200, height: 1400 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
await ctx.addInitScript(() => { try { localStorage.setItem("atelier.help.v1", "1"); } catch {} });
const page = await ctx.newPage();
page.on("pageerror", e => console.log("  pageerror:", e.message));
await page.goto(`${BASE}/atelier.html`);
await page.waitForFunction(() => window.atelier?.turntables?.[0]);
// a tall, high-resolution stage of its own, outside the phone frame
await page.evaluate(() => {
  const el = document.getElementById("stageTT");
  Object.assign(el.style, { position: "fixed", left: "0", top: "0", width: "600px", height: "1100px", zIndex: 9999 });
  devicePixelRatio;   // the renderer caps the ratio at 1.5
});
await page.waitForTimeout(500);

for (const stop of STOPS) {
  if (only && stop.id !== only) continue;
  const data = await page.evaluate(async look => {
    const { look: L, turntables: [tt] } = window.atelier;
    Object.assign(L, { top: null, bottom: null, feet: null, full: null, fabric: { body: null, sleeves: null } }, look);
    tt.setFrame(0); tt.setZoom?.(1);
    tt.draw();
    // wait until every worn slot has its model, then for the drop-in to settle
    const t0 = performance.now();
    while (Object.values(tt.worn).some(e => !e.obj) && performance.now() - t0 < 90000) await new Promise(r => setTimeout(r, 200));
    await new Promise(r => setTimeout(r, 1600));
    tt.resize(); tt.render();
    return tt.renderer.domElement.toDataURL("image/png");
  }, stop.look);
  writeFileSync(`${OUT}${stop.id}.png`, Buffer.from(data.split(",")[1], "base64"));
  console.log("  ->", stop.id);
}
await browser.close();
