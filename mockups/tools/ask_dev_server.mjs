/* Local stand-in for Vercel: serves mockups/ statically and runs api/ask.js like Vercel would (parsed JSON body,
   res.status().json()). No Vercel login or project link needed. Reads ANTHROPIC_API_KEY from the repo's .env via
   `npm run dev:ask`; without a key the function answers 503 and the sheet shows its field-only fallback.
   Run from mockups/: npm run dev:ask   (or PORT=8768 node tools/ask_dev_server.mjs) */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import handler from "../api/ask.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PORT = Number(process.env.PORT || 8768);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".glb": "model/gltf-binary", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp",
  ".svg": "image/svg+xml", ".sog": "application/octet-stream" };

createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/ask") {
    let raw = "";
    for await (const chunk of req) { raw += chunk; if (raw.length > 8192) break; }
    req.body = raw && (req.headers["content-type"] || "").includes("json") ? safeJson(raw) : raw;
    res.status = code => { res.statusCode = code; return res; };
    res.json = obj => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(obj)); };
    return handler(req, res);
  }
  const rel = url.pathname === "/" ? "second-skin.html" : decodeURIComponent(url.pathname.slice(1));
  const path = normalize(join(ROOT, rel));
  if (!path.startsWith(ROOT) || rel.split("/").some(s => s.startsWith(".")) || path.includes(`${sep}node_modules${sep}`)) {
    res.writeHead(404).end(); return;
  }
  try {
    const data = await readFile(path);
    res.writeHead(200, { "Content-Type": TYPES[extname(path)] || "application/octet-stream" }).end(data);
  } catch { res.writeHead(404).end(); }
}).listen(PORT, "127.0.0.1", () => console.log(`Second Skin + /api/ask on http://127.0.0.1:${PORT}/ (key ${process.env.ANTHROPIC_API_KEY ? "set" : "not set: fallback mode"})`));

function safeJson(s) { try { return JSON.parse(s); } catch { return null; } }
