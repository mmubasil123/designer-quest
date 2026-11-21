// obj2glb.mjs <scene.obj> <outDir> <name>: split a CLO OBJ export (Multiple Objects, Thin, mm) into
// <name>.glb (garment: patterns, graphics, trims) and <name>_body.glb (the mannequin, without teeth and lashes), in metres.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const req = createRequire(path.join(process.env.TOOLS_NODE || path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "tools", "node"), "package.json"));
const load = (n) => import(pathToFileURL(req.resolve(n)).href);
const { Document, NodeIO } = await load("@gltf-transform/core");
const { ALL_EXTENSIONS } = await load("@gltf-transform/extensions");
const sharp = (await load("sharp")).default;
const [objF, outDir, name] = process.argv.slice(2);
const dir = path.dirname(objF), S = 0.001;
const BODY = /^(body|eye|eyelash|tooth|hair|shoe|nail)/i, DROP = /^(eyelash|tooth)/i;

// materials
const mats = {}; let cm = null;
for (const raw of fs.readFileSync(objF.replace(/\.obj$/, ".mtl"), "utf8").split(/\r?\n/)) {
  const line = raw.trim(), sp = line.indexOf(" "), k = sp < 0 ? line : line.slice(0, sp), v = sp < 0 ? "" : line.slice(sp + 1).trim();
  if (k === "newmtl") cm = mats[v] = { name: v };
  else if (cm && k === "Kd") cm.kd = v.split(/\s+/).map(Number);
  else if (cm && k === "d") cm.d = +v;
  else if (cm && /^map_/i.test(k)) cm[k.toLowerCase()] = path.isAbsolute(v) ? v : path.join(dir, v);
}
// geometry
const V = [], VT = [], VN = [], groups = new Map(); let obj = "default", mtl = "none";
const prim = () => { const k = obj + "\u0000" + mtl; let g = groups.get(k); if (!g) groups.set(k, g = { obj, mtl, map: new Map(), pos: [], uv: [], nor: [], idx: [] }); return g; };
let g = null;
for (const line of fs.readFileSync(objF, "utf8").split("\n")) {
  const c = line.charCodeAt(0);
  if (c === 118) {   // v, vt, vn
    const p = line.split(/\s+/);
    if (p[0] === "v") V.push(+p[1], +p[2], +p[3]); else if (p[0] === "vt") VT.push(+p[1], +p[2]); else if (p[0] === "vn") VN.push(+p[1], +p[2], +p[3]);
  } else if (c === 102 && line[1] === " ") {
    g ??= prim();
    const t = line.trim().split(/\s+/).slice(1).map((s) => {
      let i = g.map.get(s);
      if (i === undefined) {
        const [a, b, n] = s.split("/").map((x) => (x ? +x - 1 : -1));
        i = g.pos.length / 3; g.map.set(s, i);
        g.pos.push(V[a*3]*S, V[a*3+1]*S, V[a*3+2]*S);
        g.uv.push(b >= 0 ? VT[b*2] : 0, b >= 0 ? 1 - VT[b*2+1] : 0);
        if (n >= 0) g.nor.push(VN[n*3], VN[n*3+1], VN[n*3+2]); else g.nor.push(0, 1, 0);
      }
      return i;
    });
    for (let k = 1; k + 1 < t.length; k++) g.idx.push(t[0], t[k], t[k+1]);
  } else if ((c === 111 || c === 103) && line[1] === " ") { obj = line.slice(2).trim(); g = null; }
  else if (line.startsWith("usemtl ")) { mtl = line.slice(7).trim(); g = null; }
}
async function build(filter, file, plain) {
  const doc = new Document(), buf = doc.createBuffer(), scene = doc.createScene(name), root = doc.createNode(name); scene.addChild(root);
  const mcache = new Map(), tcache = new Map();
  const tex = async (f, alphaFrom) => {
    const key = f + "|" + (alphaFrom || ""); if (tcache.has(key)) return tcache.get(key);
    if (!fs.existsSync(f)) { tcache.set(key, null); return null; }
    let img = sharp(f).resize(1024, 1024, { fit: "inside", withoutEnlargement: true });
    const meta = await sharp(f).metadata();
    const out = { t: doc.createTexture(path.basename(f)).setImage(new Uint8Array(await img.png().toBuffer())).setMimeType("image/png"), alpha: !!meta.hasAlpha };
    tcache.set(key, out); return out;
  };
  const material = async (n) => {
    if (mcache.has(n)) return mcache.get(n);
    const m = mats[n] || { name: n }, M = doc.createMaterial(n.replace(/_\d+$/, "")).setDoubleSided(true).setRoughnessFactor(0.9).setMetallicFactor(0);
    if (!plain) {
      M.setBaseColorFactor([...(m.kd || [1, 1, 1]), m.d ?? 1]);
      if (m.map_kd) { const t = await tex(m.map_kd); if (t) { M.setBaseColorTexture(t.t); if (t.alpha) M.setAlphaMode("BLEND"); } }
      if (m.map_bump && /normal/i.test(m.map_bump)) { const t = await tex(m.map_bump); if (t) M.setNormalTexture(t.t); }
      if ((m.d ?? 1) < 1) M.setAlphaMode("BLEND");
    }
    mcache.set(n, M); return M;
  };
  const byObj = new Map(); let tris = 0;
  for (const q of groups.values()) { if (!q.idx.length || !filter(q.obj)) continue; (byObj.get(q.obj) ?? byObj.set(q.obj, []).get(q.obj)).push(q); }
  for (const [o, list] of byObj) {
    const mesh = doc.createMesh(o);
    for (const q of list) {
      tris += q.idx.length / 3;
      mesh.addPrimitive(doc.createPrimitive()
        .setAttribute("POSITION", doc.createAccessor().setType("VEC3").setArray(new Float32Array(q.pos)).setBuffer(buf))
        .setAttribute("NORMAL", doc.createAccessor().setType("VEC3").setArray(new Float32Array(q.nor)).setBuffer(buf))
        .setAttribute("TEXCOORD_0", doc.createAccessor().setType("VEC2").setArray(new Float32Array(q.uv)).setBuffer(buf))
        .setIndices(doc.createAccessor().setType("SCALAR").setArray(new Uint32Array(q.idx)).setBuffer(buf))
        .setMaterial(await material(q.mtl)));
    }
    root.addChild(doc.createNode(o).setMesh(mesh));
  }
  await new NodeIO().registerExtensions(ALL_EXTENSIONS).write(file, doc);
  console.log(path.basename(file), "objects", byObj.size, "triangles", tris, "materials", mcache.size, "textures", [...tcache.values()].filter(Boolean).length);
}
fs.mkdirSync(outDir, { recursive: true });
await build((o) => !BODY.test(o), path.join(outDir, name + ".glb"), false);
await build((o) => BODY.test(o) && !DROP.test(o), path.join(outDir, name + "_body.glb"), true);
