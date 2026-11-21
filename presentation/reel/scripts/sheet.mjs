// Puts images on one numbered sheet: node scripts/sheet.mjs out.png img1 img2 ... (labels = file names)
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
import { basename } from "node:path";
const [out, ...imgs] = process.argv.slice(2);
const cols = Number(process.env.COLS || 4), w = Number(process.env.W || 300);
const cells = imgs.map((p, i) => `<figure><img src="data:image/png;base64,${readFileSync(p).toString("base64")}"><figcaption>${i + 1}. ${process.env["L" + (i + 1)] || basename(p)}</figcaption></figure>`).join("");
const b = await chromium.launch({ channel: "chrome" });
const pg = await b.newPage({ viewport: { width: cols * (w + 16) + 16, height: 400 } });
await pg.setContent(`<style>body{margin:8px;font:14px/1.3 sans-serif;display:grid;grid-template-columns:repeat(${cols},${w}px);gap:16px 16px}img{width:${w}px;border:1px solid #ccc;display:block}figure{margin:0}</style>${cells}`);
await pg.screenshot({ path: out, fullPage: true }); await b.close();
