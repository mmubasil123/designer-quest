// Captures the app's real screens at 390 x 844 (x2) for the reel, into public/shots/ (git-ignored).
// Serve the mockup first: cd mockups && python3 -m http.server 8791 --bind 127.0.0.1
// Run: node scripts/capture.mjs [only-shot-name]
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE || "http://127.0.0.1:8791";
const OUT = new URL("../public/shots/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const only = process.argv[2];

const browser = await chromium.launch({
  channel: "chrome", headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"],
});

// one fresh phone per shot; `storage` is written before the app's scripts run
async function phone(storage = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript(s => { if (location.pathname.endsWith(".html") && !sessionStorage.getItem("seeded")) {
    for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); sessionStorage.setItem("seeded", "1"); } }, { "atelier.help.v1": "1", ...storage });
  const page = await ctx.newPage();
  page.on("pageerror", e => console.log("  pageerror:", e.message));
  return { ctx, page };
}
const shot = (page, name) => page.screenshot({ path: `${OUT}${name}.png`, timeout: 180000 }).then(() => console.log("  ->", name));
const settle = (page, ms = 1500) => page.waitForTimeout(ms);
const save = look => JSON.stringify({ v: 1, look: { top: null, bottom: null, feet: null, full: null, fabric: { body: null, sleeves: null }, ...look } });

const shots = {
  // sticker scan of the jak: story, the year guess with a miss, the win
  async win() {
    const { ctx, page } = await phone();
    await page.goto(`${BASE}/atelier.html?card=ST503`);
    await page.waitForSelector("dialog.story[open]"); await settle(page, 2500);
    await shot(page, "story");
    await page.click("dialog.story [data-close]");
    await page.waitForSelector("#winSlider"); await settle(page, 800);
    await shot(page, "guess");
    await page.$eval("#winSlider", s => { s.value = "1900"; s.dispatchEvent(new Event("input")); });
    await page.click("#winGo"); await settle(page, 900);
    await shot(page, "guess-earlier");
    await page.$eval("#winSlider", s => { s.value = "1760"; s.dispatchEvent(new Event("input")); });
    await page.click("#winGo"); await page.waitForSelector("#winAdd"); await settle(page, 1200);
    await shot(page, "won");
    await page.click("[data-pick=keep]"); await settle(page, 4000);
    await shot(page, "wardrobe-new");
    await ctx.close();
  },
  // the 255-year look: jak and football boots on the form
  async look() {
    const { ctx, page } = await phone({ "atelier.won.v1": '["ST503"]', "atelier.save.v1": save({ top: "ST503", feet: "ST2407/1-2" }) });
    await page.goto(`${BASE}/atelier.html`); await settle(page, 9000);
    await shot(page, "look-jak-boots");
    await ctx.close();
  },
  async kimono() {
    const { ctx, page } = await phone({ "atelier.save.v1": save({ full: "ST80881", feet: "ST2407/1-2" }) });
    await page.goto(`${BASE}/atelier.html`); await settle(page, 9000);
    await shot(page, "look-kimono");
    await ctx.close();
  },
  async upclose() {
    const { ctx, page } = await phone();
    await page.goto(`${BASE}/up-close.html?id=ST81190`); await settle(page, 20000);
    await shot(page, "upclose");
    await ctx.close();
  },
  async share() {
    const { ctx, page } = await phone({ "atelier.won.v1": '["ST503"]', "atelier.save.v1": save({ top: "ST503", feet: "ST2407/1-2" }) });
    await page.goto(`${BASE}/atelier.html`); await settle(page, 9000);
    await page.$eval("#shareBtn", b => b.click()); await settle(page, 5000);
    await shot(page, "share-sheet");
    await page.fill("#shareName", "Noor"); await page.keyboard.press("Enter"); await settle(page, 4000);
    await shot(page, "share-sheet-noor");
    const png = await page.evaluate(async () => { const i = document.getElementById("shareImg"); if (!i?.src) return null;
      const b = await (await fetch(i.src)).blob(); return await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); }); });
    if (png) { (await import("node:fs")).writeFileSync(`${OUT}share-card.png`, Buffer.from(png.split(",")[1], "base64")); console.log("  -> share-card"); }
    else console.log("  share card image not found");
    await ctx.close();
  },
};

for (const [name, run] of Object.entries(shots)) {
  if (only && only !== name) continue;
  console.log(name);
  try { await run(); } catch (e) { console.log("  FAILED:", e.message.split("\n")[0]); }
}
await browser.close();
