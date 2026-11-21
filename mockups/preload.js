/* H5: start downloading the scanned piece's 3D asset the moment a card is known, so "Study up close" (or wearing the
   piece) finds it already in the browser's HTTP cache.

   What it fetches: the `.sog` splat for a study piece, the GLB for a wearable, and nothing else. One piece only (A6 memory
   limits: the bytes are streamed and dropped, nothing is parsed or kept in memory; the real loader (Spark, GLTFLoader)
   fetches the same URL later and is served from cache). Study pieces also get the Up close page's two scripts via
   modulepreload.
   Order: the popup's article image first (a small request, started high priority), the 3D file right after it, or after
   1.5 s at the latest, so a 15 MB download never starves the image on a slow link.
   Skipped on Save-Data. Never throws; a failed or skipped preload only means the real loader fetches the file itself.

   Loaded by one `<script type="module" src="preload.js">` in the head of second-skin.html. It reads `?card=<id>` itself, so
   it starts before the big module has resolved its CDN imports. Any other page can call `preload.start(id)`.

   API (also on `window.momuPreload`):
     preload.start(id, { image })  idempotent; image: url to warm first, `false` for none; returns preload.ready(id)
     preload.status(id)            { id, state, kind, url, loaded, total, fraction } synchronous; state is one of
                                   "idle" | "waiting" | "loading" | "ready" | "error" | "skipped"; total/fraction are 0
                                   when the server sent no Content-Length
     preload.ready(id)             promise: true once the file is in cache, false if skipped or failed; never rejects
     preload.handoff(id, maxMs)    for the moment before leaving the page (second-skin.html -> up-close.html): Chrome cancels a
                                   running download on navigation (keepalive does not help; measured), so a visitor who taps
                                   "Study up close" early would lose the part already fetched. handoff resolves at once if
                                   the file is ready, skipped or failed; otherwise it shows a one-line progress text over
                                   the page and resolves when ready, failed, or after maxMs (default 30 s). Await it before
                                   navigating. Never rejects.
     preload.glbSource(id, url)    for a wearable's GLTFLoader: waits for this piece's preload and returns a blob: URL of the
                                   bytes it fetched, so the loader does not download the file a second time; any other id, or
                                   a failed preload, gives `url` back unchanged
     preload.on(fn)                fn(status) on every progress step and state change; returns an unsubscribe function;
                                   the same status also fires as a `momu:preload` event on window (detail = status)
*/

const HERE = import.meta.url;
const UPCLOSE_MODULES = ["https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js",
  "https://cdn.jsdelivr.net/npm/@sparkjsdev/spark@2.4.0/dist/spark.module.js"];   // same pins as up-close.html's import map
const IMAGE_FIRST_MAX_MS = 1500;
const IMG = sha => `https://heron.libis.be/momu/files/large/${sha}.jpg`;   // the size second-skin.html uses for a piece

const jobs = new Map();   // id -> { s: status, done: Promise<boolean> }
const listeners = new Set();
let manifest = null;

const saveData = () => !!navigator.connection?.saveData;
const snapshot = j => ({ ...j.s, fraction: j.s.total ? Math.min(1, j.s.loaded / j.s.total) : j.s.state === "ready" ? 1 : 0 });
function emit(j) {
  const s = snapshot(j);
  for (const fn of listeners) { try { fn(s); } catch { /* a listener must not stop the download */ } }
  try { window.dispatchEvent(new CustomEvent("momu:preload", { detail: s })); } catch { /* no window */ }
}
function set(j, patch) { Object.assign(j.s, patch); emit(j); }

function warmImage(url) {   // resolves when the image is in cache, fails, or the cap passes; never rejects
  return new Promise(res => {
    const l = document.createElement("link");
    Object.assign(l, { rel: "preload", as: "image", href: url, fetchPriority: "high" });
    const end = () => res();
    l.onload = l.onerror = end;
    document.head.append(l);
    setTimeout(end, IMAGE_FIRST_MAX_MS);
  });
}
const AUDIO_FIRST_MAX_MS = 1500;
async function warmNarration(id) {   // fetch the story's audio file into the HTTP cache (100 to 450 KB), 1.5 s at most
  try {
    const doc = await (await fetch(new URL("narration.json", HERE))).json();   // story.js asks for the same file: one cache entry
    const audio = doc.pieces?.[id]?.audio;
    if (!audio) return;
    const ctl = new AbortController(), cap = setTimeout(() => ctl.abort(), AUDIO_FIRST_MAX_MS);
    try { const r = await fetch(new URL(audio, HERE), { priority: "high", signal: ctl.signal }); await r.arrayBuffer(); }
    finally { clearTimeout(cap); }
  } catch { /* no narration, or slow: the scan goes on anyway */ }
}
function hintModules() {
  for (const href of UPCLOSE_MODULES) {
    const l = document.createElement("link"); l.rel = "modulepreload"; l.href = href; document.head.append(l);
  }
}
async function drain(j, url) {   // stream into the HTTP cache and drop the bytes
  const r = await fetch(url, { priority: j.s.kind === "glb" ? "high" : "low" });   // a study scan must not hold up the story's audio
  if (!r.ok || !r.body) throw new Error(String(r.status));
  set(j, { state: "loading", total: +r.headers.get("content-length") || 0 });
  const reader = r.body.getReader();
  let step = 0;
  const keep = j.s.kind === "glb" ? [] : null;   // a GLB is about 2 MB: keep it as a Blob so the loader can reuse these bytes
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    keep?.push(value);
    j.s.loaded += value.length;
    if (j.s.loaded - step > 262144) { step = j.s.loaded; emit(j); }   // about 60 updates for a 15 MB file, not one per chunk
  }
  if (keep) j.blob = new Blob(keep, { type: r.headers.get("content-type") || "model/gltf-binary" });
}

async function run(j, id, imageOpt) {
  try {
    manifest ??= await (await fetch(new URL("pieces.json", HERE))).json();
    const p = manifest.pieces.find(x => x.id === id);
    const splat = p?.assets.splat?.path, glb = p?.assets.glb?.path;
    const path = splat && p.assets.clo ? p.assets.clo.path : splat ?? glb;   // Up close shows MoMu's CLO model where a study piece has one
    if (!path) return set(j, { state: "skipped" }), false;   // unknown card, or a piece with no 3D file
    const url = new URL(path, HERE).href;
    Object.assign(j.s, { kind: splat ? "splat" : "glb", url });
    if (saveData()) return set(j, { state: "skipped" }), false;
    set(j, { state: "waiting" });
    if (splat) hintModules();
    const img = imageOpt === false ? null : typeof imageOpt === "string" ? imageOpt : p.source?.imgSha ? IMG(p.source.imgSha) : null;
    if (img) await warmImage(img);
    if (splat) await warmNarration(id);   // the story (and its audio) shows before Up close, so its audio goes before the 15 MB scan
    await drain(j, url);
    set(j, { state: "ready", loaded: j.s.total || j.s.loaded });
    return true;
  } catch {
    set(j, { state: "error" });
    return false;
  }
}

function handoff(id, maxMs = 30000) {
  const j = jobs.get(id);
  if (!j || ["ready", "skipped", "error", "idle"].includes(j.s.state)) return Promise.resolve();
  const el = document.createElement("div");
  el.setAttribute("role", "status");
  el.style.cssText = "position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:var(--paper,#fff);color:var(--ink,#000);font:var(--t-label,500 11px/1.3 sans-serif);letter-spacing:.08em;text-transform:uppercase";
  document.body.append(el);
  // D-3: the page imports i18n.js anyway; loading it here without waiting keeps the preload itself fast (English until it arrives)
  let tr = x => x; import("./i18n.js").then(m => { tr = m.t; }).catch(() => {});
  const draw = s => { el.textContent = s.fraction ? `${tr("Getting the scan ready")} ${Math.floor(s.fraction * 100)}%` : tr("Getting the scan ready"); };
  draw(snapshot(j));
  const off = preload.on(s => { if (s.id === id) draw(s); });
  return Promise.race([j.done, new Promise(r => setTimeout(r, maxMs))]).then(() => { off(); el.remove(); });
}

/* For a wearable's loader: resolves to the URL to load. When this piece's GLB is being preloaded it waits for it and
   returns a blob: URL of the same bytes (one request, not two); otherwise it returns `fallbackUrl` unchanged. */
async function glbSource(id, fallbackUrl) {
  const j = jobs.get(id);
  if (!j || j.s.kind !== "glb") return fallbackUrl;
  await j.done;
  if (!j.blob) return fallbackUrl;
  const u = URL.createObjectURL(j.blob);
  j.blob = null;   // handed over once: the caller revokes the URL after loading, and the bytes are not kept twice
  return u;
}

export const preload = {
  handoff, glbSource,
  start(id, { image } = {}) {
    if (!id) return Promise.resolve(false);
    let j = jobs.get(id);
    if (!j) {
      j = { s: { id, state: "idle", kind: null, url: null, loaded: 0, total: 0 } };
      jobs.set(id, j);
      j.done = run(j, id, image);
    }
    return j.done;
  },
  status: id => jobs.has(id) ? snapshot(jobs.get(id)) : { id, state: "idle", kind: null, url: null, loaded: 0, total: 0, fraction: 0 },
  ready: id => jobs.get(id)?.done ?? Promise.resolve(false),
  on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};
window.momuPreload = preload;

preload.start(new URLSearchParams(location.search).get("card"));   // the hook: a card in the URL starts it at once
