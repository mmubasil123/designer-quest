// Shrink a CLO GLB export (the team's garments) for the app: weld, simplify the trims, quantize, WebP textures at most 1024 px.
//   node mockups/clo/optimise_glb.mjs <raw.glb> <out.glb> [simplifyRatio=1] [webpQuality=85]
//   SHEEN=<regex> adds a soft sheen to the materials whose name matches (the black denim, whose texture is plain black).
// Used for: blouse.glb -> assets/clo/ST81114AB.glb (ratio 0.1: its buttons are most of its triangles),
//           "trouser glb.glb" -> assets/clo/ST81116.glb (ratio 0.1, SHEEN=Denim).
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
// gltf-transform, meshoptimizer and sharp come from the git-ignored tools/node (npm install @gltf-transform/cli there);
// in a worktree, point TOOLS_NODE at the main checkout's tools/node. Nothing is installed globally.
const req = createRequire(path.join(process.env.TOOLS_NODE || path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "tools", "node"), "package.json"));
const load = (n) => import(pathToFileURL(req.resolve(n)).href);
const { NodeIO } = await load("@gltf-transform/core");
const { ALL_EXTENSIONS, KHRMaterialsSheen } = await load("@gltf-transform/extensions");
const { dedup, prune, weld, simplify, quantize, getBounds } = await load("@gltf-transform/functions");
const { MeshoptSimplifier } = await load("meshoptimizer");
const sharp = (await load("sharp")).default;
const [raw, out, ratio="1", q="85"] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(raw), root = doc.getRoot();
for (const m of root.listMaterials()) m.setName(m.getName().replace(/_\d+$/, ""));
// black cloth with a plain black texture renders as a flat silhouette: a soft, rough sheen lets its folds catch the light
if (process.env.SHEEN) { const ext = doc.createExtension(KHRMaterialsSheen), re = new RegExp(process.env.SHEEN);
  for (const m of root.listMaterials()) if (re.test(m.getName())) m.setExtension("KHR_materials_sheen", ext.createSheen().setSheenColorFactor([0.16, 0.16, 0.16]).setSheenRoughnessFactor(0.8)); }
await MeshoptSimplifier.ready;
const fns=[dedup(), weld()];
if (+ratio<1) fns.push(simplify({simplifier: MeshoptSimplifier, ratio:+ratio, error:0.002,lockBorder:true}));
fns.push(quantize({quantizePosition:14,quantizeNormal:10,quantizeTexcoord:12}), prune());
await doc.transform(...fns);
for (const t of root.listTextures()) {
  const buf = await sharp(Buffer.from(t.getImage())).resize(1024,1024,{fit:"inside"}).webp({quality:+q}).toBuffer();
  t.setImage(new Uint8Array(buf)).setMimeType("image/webp");
}
await io.write(out, doc);
const b=getBounds(root.listScenes()[0]);
console.log(out, "min",b.min.map(x=>+x.toFixed(3)),"max",b.max.map(x=>+x.toFixed(3)));
