// tuck_glb.mjs <under.glb> <out.glb> <upper.glb>: cut one garment along a smooth line that follows another, so the part
// hidden beneath it is gone and the cut edge is clean. Triangles crossing the line are split.
//   SIDE=above  keep the first garment above the top edge of the second (a blouse tucked into trousers: its tail,
//               which sits inside the trousers in the CLO drape, is removed below the waistband). MARGIN (m) is how far
//               into the waistband it still reaches; TORSO_R (m) keeps sleeves, which hang lower, out of the cut.
//   default     keep the first garment below the hem of the second.
// Used for: SIDE=above MARGIN=0.02 TORSO_R=0.19 blouse.glb + "trouser glb.glb" -> (optimise_glb.mjs) ->
//           assets/clo/ST81114AB_in_ST81116.glb
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
// gltf-transform, meshoptimizer and sharp come from the git-ignored tools/node (npm install @gltf-transform/cli there);
// in a worktree, point TOOLS_NODE at the main checkout's tools/node. Nothing is installed globally.
const req = createRequire(path.join(process.env.TOOLS_NODE || path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "tools", "node"), "package.json"));
const load = (n) => import(pathToFileURL(req.resolve(n)).href);
const { NodeIO } = await load("@gltf-transform/core");
const { ALL_EXTENSIONS } = await load("@gltf-transform/extensions");
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const [underF, outF, upperF] = process.argv.slice(2);
const MARGIN = +(process.env.MARGIN || 0.004), BINS = 72, TORSO_R = +(process.env.TORSO_R || 0.2);
const TUCK = process.env.SIDE === "above";
const GRAPHIC = /^(Button|brass|red_cross)/;
const xf = (w, [x,y,z]) => [w[0]*x+w[4]*y+w[8]*z+w[12], w[1]*x+w[5]*y+w[9]*z+w[13], w[2]*x+w[6]*y+w[10]*z+w[14]];

const doc = await io.read(underF), root = doc.getRoot(), work = [];
for (const n of root.listNodes()) {
  const m = n.getMesh(); if (!m) continue; const w = n.getWorldMatrix();
  const graphic = GRAPHIC.test(m.getName()) || GRAPHIC.test(n.getName());
  for (const p of m.listPrimitives()) work.push({ n, m, p, w, graphic });
}
// body axis: centre of the top 6 cm (the waistband) of the trousers (the under garment, or the upper one when tucking)
let top = -1e9; const all = [];
if (TUCK) { const u0 = await io.read(upperF); for (const n of u0.getRoot().listNodes()) { const m = n.getMesh(); if (!m || GRAPHIC.test(m.getName()) || GRAPHIC.test(n.getName())) continue; const w = n.getWorldMatrix();
  for (const p of m.listPrimitives()) { const pos = p.getAttribute("POSITION"); for (let i=0;i<pos.getCount();i++){ const o=xf(w,pos.getElement(i,[0,0,0])); all.push(o); top=Math.max(top,o[1]); } } } }
else for (const { p, w, graphic } of work) { if (graphic) continue; const pos = p.getAttribute("POSITION"); for (let i=0;i<pos.getCount();i++){ const o=xf(w,pos.getElement(i,[0,0,0])); all.push(o); top=Math.max(top,o[1]); } }
const band = all.filter(o => o[1] > top - 0.06), ax = band.reduce((a,o)=>a+o[0],0)/band.length, az = band.reduce((a,o)=>a+o[2],0)/band.length;
const bin = (x, z) => ((Math.atan2(z - az, x - ax) / (2*Math.PI) + 1) % 1) * BINS;
// upper hem: lowest torso vertex per angle (sleeves are outside TORSO_R of the axis)
const hem = new Float64Array(BINS).fill(TUCK ? -1e9 : 1e9), up = await io.read(upperF);
for (const n of up.getRoot().listNodes()) {
  const m = n.getMesh(); if (!m || GRAPHIC.test(m.getName()) || GRAPHIC.test(n.getName())) continue; const w = n.getWorldMatrix();
  for (const p of m.listPrimitives()) { const pos = p.getAttribute("POSITION"); for (let i=0;i<pos.getCount();i++){ const o=xf(w,pos.getElement(i,[0,0,0]));
    if (Math.hypot(o[0]-ax, o[2]-az) > TORSO_R) continue; const b = Math.floor(bin(o[0], o[2])) % BINS; hem[b] = TUCK ? Math.max(hem[b], o[1]) : Math.min(hem[b], o[1]); } }
}
for (let b=0;b<BINS;b++) if (Math.abs(hem[b]) > 1e8) hem[b] = NaN;
let h = Array.from(hem); const med = h.filter(v=>!isNaN(v)).sort((a,b)=>a-b)[Math.floor(BINS/2)]; h = h.map(v => isNaN(v) ? med : v);
if (TUCK) h = h.map((_,b)=>Math.max(...[-2,-1,0,1,2].map(d=>h[(b+d+BINS)%BINS])));   // a sparse bin reads too low
if (!TUCK) h = h.map((_,b)=>Math.min(...[-3,-2,-1,0,1,2,3].map(d=>h[(b+d+BINS)%BINS])));   // a bin that missed the hem reads too high
for (let r=0;r<6;r++) h = h.map((_,b)=>(h[(b+BINS-1)%BINS]+2*h[b]+h[(b+1)%BINS])/4);
console.log("axis", ax.toFixed(3), az.toFixed(3), "hem min/max raw", Math.min(...hem.filter(v=>!isNaN(v))).toFixed(3), Math.max(...hem.filter(v=>!isNaN(v))).toFixed(3), "smoothed", Math.min(...h).toFixed(3), Math.max(...h).toFixed(3));
const cutAt = (o) => { const t = bin(o[0], o[2]), b0 = Math.floor(t) % BINS, f = t - Math.floor(t); return h[b0]*(1-f) + h[(b0+1)%BINS]*f + (TUCK ? -MARGIN : MARGIN); };
const sd = (o) => TUCK ? (Math.hypot(o[0]-ax, o[2]-az) > TORSO_R ? -1 : cutAt(o) - o[1]) : o[1] - cutAt(o);

let split = 0, dropped = 0, kept = 0, gDrop = 0;
for (const { m, p, w, graphic } of work) {
  const sems = p.listSemantics(), accs = sems.map(s => p.getAttribute(s)), pos = p.getAttribute("POSITION"), N = pos.getCount();
  if (graphic) {
    const c=[0,0,0]; for (let i=0;i<N;i++){ const o=xf(w,pos.getElement(i,[0,0,0])); c[0]+=o[0];c[1]+=o[1];c[2]+=o[2]; } c.forEach((_,q)=>c[q]/=N);
    if (sd(c) > -0.01) { m.removePrimitive(p); gDrop++; } continue;
  }
  const sizes = accs.map(a => a.getElementSize()), data = accs.map((a, k) => { const out = []; const t = new Array(sizes[k]).fill(0); for (let i=0;i<N;i++) out.push(a.getElement(i, t).slice()); return out; });
  const pi = sems.indexOf("POSITION"), s = data[pi].map(e => { const o = xf(w, e); return sd(o); });
  const cache = new Map();
  const mid = (a, b) => { const k = a < b ? `${a},${b}` : `${b},${a}`; if (cache.has(k)) return cache.get(k);
    const t = s[a] / (s[a] - s[b]), id = data[pi].length; data.forEach((d, q) => { let e = d[a].map((v, j) => v + (d[b][j] - v) * t);
      if (sems[q] === "NORMAL") { const l = Math.hypot(...e) || 1; e = e.map(v => v / l); } d.push(e); }); s.push(0); cache.set(k, id); return id; };
  const idx = p.getIndices(), src = idx ? idx.getArray() : Uint32Array.from({ length: N }, (_, i) => i), out = [];
  for (let i = 0; i < src.length; i += 3) {
    const t = [src[i], src[i+1], src[i+2]], inside = t.map(v => s[v] <= 0), n = inside.filter(Boolean).length;
    if (n === 3) { out.push(...t); kept++; continue; } if (n === 0) { dropped++; continue; }
    split++; const poly = [];
    for (let k = 0; k < 3; k++) { const a = t[k], b = t[(k+1)%3]; if (inside[k]) poly.push(a); if (inside[k] !== inside[(k+1)%3]) poly.push(mid(a, b)); }
    for (let k = 1; k + 1 < poly.length; k++) out.push(poly[0], poly[k], poly[k+1]);
  }
  if (!out.length) { m.removePrimitive(p); continue; }
  sems.forEach((sem, q) => { const a = accs[q], Arr = a.getArray().constructor, flat = new Arr(data[q].length * sizes[q]); data[q].forEach((e, i) => flat.set(e, i * sizes[q]));
    p.setAttribute(sem, doc.createAccessor().setType(a.getType()).setNormalized(a.getNormalized()).setArray(flat)); });
  p.setIndices(doc.createAccessor().setType("SCALAR").setArray(new Uint32Array(out)));
}
for (const n of root.listNodes()) { const m = n.getMesh(); if (m && !m.listPrimitives().length) n.setMesh(null); }
console.log("kept", kept, "dropped", dropped, "split", split, "graphics dropped", gDrop);
await io.write(outF, doc);
