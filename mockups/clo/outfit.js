// OutfitRig: put CLO garments on and off one avatar. Framework-free ES module on three.js (0.169, as the app).
//
// CLO garments are exported already draped on the avatar they were simulated on, in metres, in that avatar's
// coordinates (D5: kind "clo", origin "avatar", no rescale). So wearing one is just adding its scene under the
// avatar's root, and taking it off is removing it: no fitting, no rescale. A garment must come from a CLO scene
// with the same avatar in the same pose, or it will not sit on the body.
//
// Slots: one item per slot. Wearing an item replaces whatever is in its slot. Default slots, inner to outer:
//   bottom, top, outer   (an "outer" item such as a coat is worn over a "top"; a "full" item replaces top+bottom)
//
// Layering: an outer garment draped on the bare body clips through bulky clothes under it. An item can list
// variants draped over other items, e.g. { over: ["blouse", "trousers"], glb: "coat_over.glb" }. A variant applies
// only when everything it was draped over is worn (draped over a garment that is not there, it hangs wrong); of
// those, the rig shows the one draped over the most (ties: the first listed), else the item's own glb, and switches
// whenever the outfit changes.
//
// Usage:
//   import { OutfitRig } from "./outfit.js";
//   const rig = new OutfitRig({ loader });             // a GLTFLoader (meshopt decoder optional)
//   scene.add(rig.root);
//   await rig.setAvatar("../team_notion/avatar.glb");
//   rig.register({ id: "ST81190", slot: "outer", glb: "../assets/ST81190_clo_team.glb", label: "Coat" });
//   await rig.wear("ST81190");  await rig.remove("ST81190");  await rig.toggle("ST81190");
//   rig.addEventListener("change", e => console.log(e.detail.worn));
//   rig.material("ST81190", "wool_grey")               // the named panel material, for remix (D5)
import * as THREE from "three";

export const SLOTS = ["bottom", "top", "outer"];
// Depth bias per slot, inner to outer: where two layers touch within a few millimetres the outer one is drawn in
// front instead of flickering through. It hides contact, not real clipping (that is fixed in the CLO drape).
const LAYER_BIAS = { bottom: 0, full: 0, top: 1, outer: 2 };
const CLEARS = { full: ["top", "bottom", "full"], top: ["top", "full"], bottom: ["bottom", "full"], outer: ["outer"] };

export class OutfitRig extends EventTarget {
  constructor({ loader, cacheSize = 8 } = {}) {
    super();
    if (!loader) throw new Error("OutfitRig needs a GLTFLoader");
    this.loader = loader;
    this.root = new THREE.Group();
    this.root.name = "outfit";
    this.avatar = null;
    this.items = new Map();   // id -> { id, slot, glb, label, ... }
    this.cache = new Map();   // id -> loaded THREE.Object3D (most recently used last)
    this.cacheSize = cacheSize;
    this.wornBySlot = new Map();  // slot -> id
    this.pending = new Map();     // key -> Promise of the load in flight
    this.shown = new Map();       // worn id -> cache key of the variant on the avatar
  }

  async setAvatar(url) {
    const gltf = await this.loader.loadAsync(url);
    if (this.avatar) { this.root.remove(this.avatar); dispose(this.avatar); }
    this.avatar = gltf.scene;
    this.avatar.name = "avatar";
    this.root.add(this.avatar);
    this.emit();
    return this.avatar;
  }

  register(...items) {
    for (const item of items.flat()) {
      if (!item.id || !item.glb) throw new Error("an item needs id and glb");
      const slot = item.slot || "top";
      if (!CLEARS[slot]) throw new Error(`unknown slot ${slot} for ${item.id}`);
      this.items.set(item.id, { ...item, slot });
    }
    return this;
  }

  worn() { return [...new Set(this.wornBySlot.values())]; }
  isWorn(id) { return this.worn().includes(id); }

  async wear(id) {
    const item = this.items.get(id);
    if (!item) throw new Error(`unknown item ${id}`);
    await this.load(id);  // fail before changing the outfit if the garment cannot load
    for (const slot of CLEARS[item.slot]) {  // take off whatever this item replaces
      const other = this.wornBySlot.get(slot);
      if (other && other !== id) this.takeOff(other);
    }
    this.wornBySlot.set(item.slot, id);
    if (item.slot === "full") { this.wornBySlot.set("top", id); this.wornBySlot.set("bottom", id); }
    await this.sync();
    this.trim();
    this.emit();
    return this.cache.get(this.shown.get(id));
  }

  async remove(id) {
    if (!this.isWorn(id)) return false;
    this.takeOff(id);
    await this.sync();
    this.emit();
    return true;
  }

  // Which glb to show for a worn item, given what else is worn (see Layering above).
  variantOf(id) {
    const item = this.items.get(id), worn = new Set(this.worn());
    let best = { key: id, glb: item.glb, score: 0 };
    for (const [i, v] of (item.variants || []).entries()) {
      if (!v.over.every((o) => worn.has(o))) continue;
      const score = v.over.length;
      if (score > best.score) best = { key: `${id}#${i}`, glb: v.glb, score };
    }
    return best;
  }

  // Put the right variant of every worn item on the avatar and nothing else.
  async sync() {
    const want = new Map(this.worn().map((id) => [id, this.variantOf(id)]));
    await Promise.all([...want.values()].map((v) => this.loadKey(v.key, v.glb)));
    for (const [id, key] of [...this.shown]) {
      if (want.get(id)?.key !== key) { this.cache.get(key)?.removeFromParent(); this.shown.delete(id); }
    }
    for (const [id, v] of want) {
      const obj = this.cache.get(v.key);
      if (!obj.parent) this.root.add(obj);
      this.shown.set(id, v.key);
    }
  }

  async toggle(id) { return this.isWorn(id) ? (await this.remove(id), false) : (await this.wear(id), true); }

  async clear() { for (const id of this.worn()) this.takeOff(id); await this.sync(); this.emit(); }

  // The material named `name` on the shown variant of a worn item (CLO keeps fabric names: wool_grey, ...).
  material(id, name) {
    const obj = this.cache.get(this.shown.get(id) || id);
    let found = null;
    obj?.traverse((o) => {
      if (found || !o.isMesh) return;
      for (const m of [].concat(o.material)) if (m.name === name) { found = m; break; }
    });
    return found;
  }

  // Load an item's own glb without wearing it (preload); concurrent calls share one request.
  load(id) {
    const item = this.items.get(id);
    if (!item) throw new Error(`unknown item ${id}`);
    return this.loadKey(id, item.glb);
  }

  async loadKey(key, glb) {
    if (this.cache.has(key)) {
      const obj = this.cache.get(key);
      this.cache.delete(key); this.cache.set(key, obj);  // mark as recently used
      return obj;
    }
    if (this.pending.has(key)) return this.pending.get(key);
    const id = key.split("#")[0];
    const p = this.loader.loadAsync(glb).then((gltf) => {
      const obj = gltf.scene;
      obj.name = key;
      const slot = this.items.get(id)?.slot;
      obj.userData.outfit = { id, slot, variant: key };
      const bias = LAYER_BIAS[slot] || 0;
      if (bias) obj.traverse((o) => {
        if (!o.isMesh) return;
        for (const m of [].concat(o.material)) {
          m.polygonOffset = true; m.polygonOffsetFactor = -bias; m.polygonOffsetUnits = -4 * bias;
        }
      });
      this.cache.set(key, obj);
      this.pending.delete(key);
      return obj;
    }, (err) => { this.pending.delete(key); throw err; });
    this.pending.set(key, p);
    return p;
  }

  takeOff(id) {
    for (const [slot, worn] of [...this.wornBySlot]) if (worn === id) this.wornBySlot.delete(slot);
    const key = this.shown.get(id);
    if (key) { this.cache.get(key)?.removeFromParent(); this.shown.delete(id); }
  }

  trim() {  // keep at most cacheSize garments in memory; never drop one that is shown
    const worn = new Set(this.shown.values());
    for (const id of [...this.cache.keys()]) {
      if (this.cache.size <= this.cacheSize) break;
      if (worn.has(id)) continue;
      dispose(this.cache.get(id));
      this.cache.delete(id);
    }
  }

  emit() { this.dispatchEvent(new CustomEvent("change", { detail: { worn: this.worn(), avatar: !!this.avatar } })); }
}

function dispose(obj) {
  obj.traverse((o) => {
    if (!o.isMesh) return;
    o.geometry?.dispose();
    for (const m of [].concat(o.material)) {
      for (const v of Object.values(m)) if (v && v.isTexture) v.dispose();
      m.dispose();
    }
  });
}
