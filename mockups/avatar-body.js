// A9: a person under the pieces instead of the dress form. Used by the Stage only when the URL has ?demo.
// The scans are rigid and were shot on a dress form, so on a person they are fitted in four steps:
// 1. the slot boxes are scaled to the body (shoulder line and deltoid width measured from the posed mesh),
// 2. the arms are posed to hang inside the worn top's sleeves (measured per scan, or a preset below),
// 3. cloth that sits inside the body is pushed out along the body's normal (conform),
// 4. a pair of shoes is split and each shoe goes on its own foot.
// Prototyped and tuned in avatar-lab.html (branch basil/A9-avatar-lab).
import * as THREE from "three";

export const AVATAR_URL = "assets/avatar/demo.glb";   // the presenter's own likeness, used with consent; deploy-only
// per piece on the demo body: size multiplier, lift in m, arm angle in degrees from vertical (null: measured)
export const AVATAR_FIT = { ST80881: { arms: 14 }, ST2434: { arms: 8 }, ST80930: { arms: 18 }, "ST655/1": { lift: 0.03 } };
// colour of the dress form TRELLIS baked into a scan's neck (sRGB 0..255); on a person those texels are cut near the centre line
// optional: [3] how far (linear RGB) a texel may be from that colour and still count as the form; [4] also cut any pale
// grey or white (the coat's collar holds a white rag of the form's cover, far from the sampled grey)
export const FORM_CUT = { ST503: [184, 180, 169], ST80930: [179, 178, 173, 0.12], ST2434: [198, 199, 199, 0.12, 1] };
const RELAXED = 9;   // arm angle with no top on

const findBone = (root, re) => { let hit = null; root.traverse(o => { if (!hit && o.isBone && re.test(o.name)) hit = o; }); return hit; };
function aim(bone, dir) {   // turn a bone so the segment to its first child bone points along a world direction
  const child = bone.children.find(c => c.isBone); if (!child) return;
  bone.updateWorldMatrix(true, true);
  const a = bone.getWorldPosition(new THREE.Vector3()), b = child.getWorldPosition(new THREE.Vector3());
  const q = new THREE.Quaternion().setFromUnitVectors(b.sub(a).normalize(), dir.clone().normalize());
  const wq = bone.getWorldQuaternion(new THREE.Quaternion()), pq = bone.parent.getWorldQuaternion(new THREE.Quaternion());
  bone.quaternion.copy(pq.invert().multiply(q.multiply(wq))); bone.updateWorldMatrix(true, true);
}
function poseArms(av, deg) {
  const a = THREE.MathUtils.degToRad(deg);
  for (const { upper, fore, out } of av.arms) {
    aim(upper, new THREE.Vector3(Math.sin(a) * out, -Math.cos(a), 0));
    if (fore) aim(fore, new THREE.Vector3(Math.sin(a * 0.8) * out, -Math.cos(a * 0.8), 0.1));
  }
  av.armDeg = deg;
  av.root.updateWorldMatrix(true, true);
  av.root.traverse(o => { if (o.isSkinnedMesh) o.skeleton.update(); });   // bone matrices otherwise update only at render
}
const NOT_SURFACE = /eye|lash|brow|teeth|tooth|tongue|cornea|hair/i;
function posedPoints(av) {   // every posed vertex of the body and its own clothes, in the avatar's space
  const pts = [], v = new THREE.Vector3();
  av.root.traverse(o => {
    if (!o.isMesh || NOT_SURFACE.test(o.name)) return;
    for (let i = 0, n = o.geometry.attributes.position.count; i < n; i++) { o.getVertexPosition(i, v); v.applyMatrix4(o.matrixWorld); pts.push(v.x, v.y, v.z); }
  });
  return pts;
}

// Prepare a loaded avatar: scale to metres, stand it at the origin, lower the arms, measure it.
// `base` is the dress form's slot boxes (SLOT_FIT); the result's `fit` is the same boxes for this body.
export function prepAvatar(root, base) {
  root.updateWorldMatrix(true, true);
  let box = new THREE.Box3().setFromObject(root);
  const h0 = box.max.y - box.min.y;
  if (h0 > 3 || h0 < 0.5) root.scale.multiplyScalar(1.7 / h0);   // centimetre exports or odd units
  root.updateWorldMatrix(true, true); box = new THREE.Box3().setFromObject(root);
  root.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
  root.traverse(o => { if (o.isMesh) o.frustumCulled = false; });   // skinned bounds do not follow the pose
  // the Stage light is tuned for dark museum cloth and washes the skin out; tone only the skin, not the garments
  root.traverse(o => { if (o.isMesh && /Body|Head/.test(o.name)) { o.material.envMapIntensity = 0.5; o.material.color.setScalar(0.8); } });
  const av = { root, arms: [] };
  for (const side of ["Left", "Right"]) {
    const upper = findBone(root, new RegExp(`(${side}Arm$|${side}UpperArm|${side[0]}_?UpperArm|upperarm_${side[0].toLowerCase()})`, "i"));
    if (upper) av.arms.push({ upper, fore: upper.children.find(c => c.isBone), out: Math.sign(upper.getWorldPosition(new THREE.Vector3()).x) || 1 });
  }
  poseArms(av, RELAXED);
  box = new THREE.Box3().setFromObject(root);
  const height = box.max.y - box.min.y, hip = findBone(root, /hips|pelvis/i);
  av.hipY = hip ? hip.getWorldPosition(new THREE.Vector3()).y : height * 0.53;
  // measure the body, not a rule of thumb: a neck-bone guess put every top 12 to 15 cm low on a 1.83 m avatar
  const pts = posedPoints(av), v = new THREE.Vector3();
  const joints = av.arms.map(a => a.upper.getWorldPosition(new THREE.Vector3()));
  const jointY = joints.length ? joints.reduce((t, j) => t + j.y, 0) / joints.length : height * 0.82;
  const jointX = joints.length ? Math.max(...joints.map(j => Math.abs(j.x))) : 0.18;
  let shoulderTop = 0, shoulderW = 0;
  for (let i = 0; i < pts.length; i += 3) {
    const ax = Math.abs(pts[i]), y = pts[i + 1];
    if (ax > jointX * 0.6 && ax < jointX && y < jointY + 0.1) shoulderTop = Math.max(shoulderTop, y);   // top of the shoulder, beside the neck
    if (y > jointY - 0.08 && y < jointY - 0.02) shoulderW = Math.max(shoulderW, ax * 2);                // across the deltoids
  }
  if (!shoulderTop) shoulderTop = height * 0.82; if (!shoulderW) shoulderW = 0.34 * shoulderTop / 1.37;
  // each foot's footprint: whatever the avatar has on its feet, below the ankle
  av.feet = [-1, 1].map(side => {
    const b = new THREE.Box3();
    for (let i = 0; i < pts.length; i += 3) if (pts[i + 1] < 0.07 && Math.sign(pts[i]) === side) b.expandByPoint(v.set(pts[i], pts[i + 1], pts[i + 2]));
    if (b.isEmpty()) b.set(new THREE.Vector3(Math.min(side * 0.13, side * 0.07), 0, -0.08), new THREE.Vector3(Math.max(side * 0.13, side * 0.07), 0.07, 0.18));
    return { x: (b.min.x + b.max.x) / 2, z: (b.min.z + b.max.z) / 2, len: b.max.z - b.min.z };
  });
  // the form's boxes, scaled: height from the shoulder line (the form's is 1.37 m beside its neck), width from the deltoids
  // (form: 0.34 m; capped at 1.3x, since a T-shirt sleeve over the deltoid made the coat hang off a 1.83 m avatar)
  const kV = shoulderTop / 1.37, kW = THREE.MathUtils.clamp(shoulderW / 0.34, 0.8, 1.3);
  av.fit = Object.fromEntries(Object.entries(base).map(([s, f]) => [s, { ...f, width: f.width * kW,
    top: f.top && (s === "bottom" ? f.top * kV : shoulderTop + 0.01), floor: f.floor && f.floor * kV }]));
  // the avatar's own clothes (MetaPerson merges them into one mesh): hidden once pieces cover top, legs and feet
  av.own = [];
  root.traverse(o => { if (o.isMesh && /outfit|cloth|shirt|pant|jean|shoe|sneaker|dress|skirt|top|bottom/i.test(o.name) && !/body|head/i.test(o.name)) av.own.push(o); });
  av.height = height;
  av.dims = { height, jointY, shoulderTop, shoulderW, kV, kW, feet: av.feet };
  return av;
}

// A shoe scan is the pair side by side: split at its centre line, each shoe on its own foot, a little longer than the shoe it covers.
const pairs = new Map();
function splitPair(model) {
  if (pairs.has(model)) return pairs.get(model);
  let mesh; model.traverse(o => { if (o.isMesh && !mesh) mesh = o; });
  const g = mesh.geometry, pos = g.attributes.position, idx = g.index;
  g.computeBoundingBox(); const cx = (g.boundingBox.min.x + g.boundingBox.max.x) / 2;
  const tri = idx ? idx.count / 3 : pos.count / 3, sides = [[], []];
  for (let t = 0; t < tri; t++) {
    const v = [0, 1, 2].map(k => idx ? idx.getX(t * 3 + k) : t * 3 + k);
    sides[(pos.getX(v[0]) + pos.getX(v[1]) + pos.getX(v[2])) / 3 < cx ? 0 : 1].push(...v);
  }
  model.updateWorldMatrix(true, true);
  const out = sides.map(list => {
    const geo = g.clone(); geo.setIndex(list);
    const m = new THREE.Mesh(geo, mesh.material); m.applyMatrix4(mesh.matrixWorld);   // keep the scan's own orientation
    const grp = new THREE.Group(); grp.add(m); return grp;
  });
  pairs.set(model, out);
  return out;
}
export function placeFeet(av, model, { size = 1, lift = 0 } = {}) {
  const wrap = new THREE.Group();
  splitPair(model).forEach((shoe, i) => {
    const foot = av.feet[i];
    shoe.position.set(0, 0, 0); shoe.scale.setScalar(1); shoe.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(shoe), c = box.getCenter(new THREE.Vector3()), dim = box.getSize(new THREE.Vector3());
    const s = (foot.len * 1.1 / dim.z) * size;
    shoe.scale.setScalar(s);
    shoe.position.set(foot.x - c.x * s, -box.min.y * s + lift, foot.z - c.z * s);
    wrap.add(shoe);
  });
  return wrap;
}

const meshOf = obj => { let m; obj?.traverse(o => { if (o.isMesh && !m) m = o; }); return m; };
const worldVerts = (mesh, src) => {
  const out = new Float32Array(src.length), v = new THREE.Vector3();
  mesh.updateWorldMatrix(true, false);
  for (let i = 0; i < src.length; i += 3) { v.set(src[i], src[i + 1], src[i + 2]).applyMatrix4(mesh.matrixWorld); out[i] = v.x; out[i + 1] = v.y; out[i + 2] = v.z; }
  return out;
};
function sleeveAngle(av, obj) {   // how far the scan's sleeves stand out from the shoulders, in degrees from vertical
  const mesh = meshOf(obj), w = worldVerts(mesh, mesh.geometry.userData.orig ?? mesh.geometry.attributes.position.array), angles = [];
  for (const { upper, out } of av.arms) {
    const sh = upper.getWorldPosition(new THREE.Vector3());
    let best = null, far = 0;
    for (let i = 0; i < w.length; i += 3) {
      const x = w[i] * out, y = w[i + 1];
      if (x < sh.x * out + 0.03 || y > sh.y + 0.02 || y < Math.max(av.hipY - 0.05, sh.y - 0.6)) continue;
      const d = Math.hypot(x - sh.x * out, sh.y - y);
      if (d > far) { far = d; best = [x - sh.x * out, sh.y - y]; }
    }
    if (best && far > 0.15) angles.push(THREE.MathUtils.radToDeg(Math.atan2(best[0], best[1])));
  }
  return angles.length ? THREE.MathUtils.clamp(angles.reduce((p, q) => p + q) / angles.length, 4, 55) : RELAXED;
}
function bodySurface(av) {   // posed body vertices and normals, hashed on a 4 cm grid
  const pts = [], nrm = [], v = new THREE.Vector3();
  av.root.traverse(m => {
    if (!m.isSkinnedMesh || NOT_SURFACE.test(m.name)) return;
    const g = m.geometry, n = g.attributes.position.count, tmp = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { m.getVertexPosition(i, v); v.applyMatrix4(m.matrixWorld); tmp[i * 3] = v.x; tmp[i * 3 + 1] = v.y; tmp[i * 3 + 2] = v.z; }
    const posed = new THREE.BufferGeometry(); posed.setAttribute("position", new THREE.BufferAttribute(tmp, 3)); if (g.index) posed.setIndex(g.index);
    posed.computeVertexNormals();
    const nn = posed.attributes.normal.array;
    for (let i = 0; i < n * 3; i++) { pts.push(tmp[i]); nrm.push(nn[i]); }
  });
  const C = 0.04, grid = new Map(), key = (x, y, z) => `${Math.floor(x / C)},${Math.floor(y / C)},${Math.floor(z / C)}`;
  for (let i = 0; i < pts.length / 3; i++) { const k = key(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]); (grid.get(k) || grid.set(k, []).get(k)).push(i); }
  const nearest = (x, y, z, r = 0.08) => {
    let best = -1, bd = r * r; const cx = Math.floor(x / C), cy = Math.floor(y / C), cz = Math.floor(z / C), R = Math.ceil(r / C);
    for (let i = -R; i <= R; i++) for (let j = -R; j <= R; j++) for (let k = -R; k <= R; k++) {
      for (const p of grid.get(`${cx + i},${cy + j},${cz + k}`) || []) {
        const dx = pts[p * 3] - x, dy = pts[p * 3 + 1] - y, dz = pts[p * 3 + 2] - z, d = dx * dx + dy * dy + dz * dz;
        if (d < bd) { bd = d; best = p; }
      }
    }
    return best;
  };
  return { pts, nrm, nearest };
}
function conform(mesh, surf, margin = 0.012) {   // push cloth that sits inside the body out along the body's normal (at most 6 cm)
  const w = worldVerts(mesh, mesh.geometry.userData.orig), inv = mesh.matrixWorld.clone().invert(), pos = mesh.geometry.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < w.length; i += 3) {
    const p = surf.nearest(w[i], w[i + 1], w[i + 2]);
    if (p >= 0) {
      const nx = surf.nrm[p * 3], ny = surf.nrm[p * 3 + 1], nz = surf.nrm[p * 3 + 2];
      const d = (w[i] - surf.pts[p * 3]) * nx + (w[i + 1] - surf.pts[p * 3 + 1]) * ny + (w[i + 2] - surf.pts[p * 3 + 2]) * nz;
      if (d < margin) { const k = Math.min(margin - d, 0.06); w[i] += nx * k; w[i + 1] += ny * k; w[i + 2] += nz * k; }
    }
    v.set(w[i], w[i + 1], w[i + 2]).applyMatrix4(inv); pos.setXYZ(i / 3, v.x, v.y, v.z);
  }
  pos.needsUpdate = true; mesh.geometry.computeVertexNormals(); mesh.geometry.computeBoundingSphere();
}
// Scans share geometry with the loader's cache, so a conformed shape is kept per key and the scan's own shape restored after.
export function restoreShape(obj) {
  const g = meshOf(obj)?.geometry; if (!g?.userData.orig) return;
  g.attributes.position.array.set(g.userData.orig); g.attributes.position.needsUpdate = true;
  g.computeVertexNormals(); g.computeBoundingSphere();
}
export function keepShape(obj) {   // remember the scan's own vertices once, before anything moves them
  const g = meshOf(obj)?.geometry; if (g && !g.userData.orig) g.userData.orig = g.attributes.position.array.slice();
}
const shapes = new Map();
// Fit what is worn (`worn`: slot -> { id, obj }) to the avatar. Call with the avatar and garments in the same
// parent, unrotated (the caller zeroes the turntable's spin for the call).
export function fitWorn(av, worn) {
  const upper = worn.full?.obj ? worn.full : worn.top?.obj ? worn.top : null;
  // MetaPerson's body has no legs or chest under its clothes, so its outfit hides only where pieces truly cover it:
  // separates head to toe, or a full piece whose hem reaches the boots (a kimono ending at the shin would leave a gap)
  const hem = worn.full?.obj && new THREE.Box3().setFromObject(worn.full.obj).min.y;
  const covered = !!(worn.feet?.obj && (worn.full?.obj ? hem < 0.1 : worn.top?.obj && worn.bottom?.obj));
  av.own.forEach(m => { m.visible = !covered; });
  poseArms(av, upper ? (AVATAR_FIT[upper.id]?.arms ?? sleeveAngle(av, upper.obj)) : RELAXED);
  let surf = null;
  for (const [slot, e] of Object.entries(worn)) {
    if (!e?.obj || slot === "feet") continue;
    const m = meshOf(e.obj), k = `${e.id}|${Math.round(av.armDeg)}`, hit = shapes.get(k);
    if (hit) { m.geometry.attributes.position.array.set(hit); m.geometry.attributes.position.needsUpdate = true; m.geometry.computeVertexNormals(); m.geometry.computeBoundingSphere(); }
    else { conform(m, surf ??= bodySurface(av)); shapes.set(k, m.geometry.attributes.position.array.slice()); }
  }
}
