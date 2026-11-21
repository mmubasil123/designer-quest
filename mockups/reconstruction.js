/* A7: Archive vs Reconstruction, on up-close.html, for a study piece with `assets.clo` in pieces.json.

   Three views of one piece, picked with a segmented control over the 3D view:
     Archive  MoMu's Gaussian splat (the page's own scene); the detail hunt works only here.
     Compare  a slider: the splat on the left of the handle, the CLO reconstruction on the right, seen through the same
              camera. The reconstruction is placed over the splat (centred on it, scaled to the scan's height), so
              dragging the handle wipes one into the other on the same spot.
     Wear it  the CLO coat on the avatar it was draped on (D5: kind "clo", origin "avatar", no fitting), via OutfitRig.
              A pill takes it off and puts it back on.
   The whole CLO rig (avatar and garment together) gets one uniform scale into the splat's units; the garment is never
   fitted or rescaled relative to the body, which is what D5 forbids. The Stage and its dress form (D1) are untouched.

   One renderer, two scenes: the page's splat scene and this module's mesh scene. In Compare the canvas is split with
   the scissor test, so there is still one WebGL context (D6).

   Hook (all of it, in up-close.html):
     const recon = piece.assets.clo ? await createReconstruction({ ... }) : null;
     render loop: recon ? recon.render(scene, camera) : renderer.render(scene, camera)
     detail hunt: skip pins and taps while recon.hunting() is false; "Show me" calls recon.setMode("archive")
   window.upClose.recon exposes { mode, setMode, worn, wear, takeOff } for checks from the console. */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { OutfitRig } from "./clo/outfit.js";

const MODES = [["archive", "Archive"], ["compare", "Compare"], ["worn", "Wear it"]];
const FORM = 0xe4ddd2;   // the avatar wears the Stage's calico finish (D1), so it reads as a museum form, not a person
const SWEEP_MS = 900;    // the one authored moment: the reconstruction wipes in over the scan

export async function createReconstruction({ renderer, view, camera, controls, piece, splatBox, reduce }) {
  const clo = piece.assets.clo;
  const $ = (s, el = document) => el.querySelector(s);

  /* ---------- UI: segmented control, slider handle, labels, the wear pill, a note under the panel ---------- */
  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.append(style);
  const ui = document.createElement("div");
  ui.className = "recon";
  ui.innerHTML = `
    <div class="seg" role="radiogroup" aria-label="What to show">
      ${MODES.map(([m, label]) => `<button class="press" role="radio" data-mode="${m}" aria-checked="false">${label}</button>`).join("")}
    </div>
    <span class="side l" aria-hidden="true">Archive</span><span class="side r" aria-hidden="true">Reconstruction</span>
    <div class="split" aria-hidden="true"><i></i></div>
    <button class="grip" role="slider" aria-label="Archive scan or reconstruction" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 6 3 12l6 6M15 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <button class="wear press" hidden></button>
    <div class="wait mono" role="status"></div>`;
  view.append(ui);
  const note = document.createElement("p");
  note.className = "credit recon-note";
  note.textContent = "Reconstruction: our pattern, drafted from MoMu's photos and record, sewn in CLO 3D and draped on the team avatar. Archive: MoMu's 3D scan of the coat.";
  note.hidden = true;
  $("aside .credit")?.after(note);

  /* ---------- Mesh scene, placed over the splat ---------- */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue("--wall").trim());
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9a948c, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(-1, 2, -2);   // in front of the piece (the scan faces -z), above and to its right
  scene.add(key);

  const loader = new GLTFLoader();
  const rig = new OutfitRig({ loader, cacheSize: 2 });
  rig.register({ id: piece.id, slot: "outer", glb: clo.path, label: piece.name });
  const place = new THREE.Group();   // splat units: one uniform scale and an offset, set once the coat is in
  const turn = new THREE.Group();    // CLO exports face +z; the captures face -z
  turn.rotation.y = Math.PI;
  turn.add(rig.root);
  place.add(turn);
  scene.add(place);

  let coat = null, avatarReady = null, failed = false;
  const coatReady = rig.load(piece.id).then(obj => {
    coat = obj;
    // overlay the coat on the scan: its hem and collar top land where they are on the splat (`onScan`, fractions of the
    // splat box's height, since the scan also shows MoMu's form below the hem), centred on the scan in x and z
    const [lo, hi] = clo.onScan ?? [0, 1];
    const b = new THREE.Box3().setFromObject(obj), cs = b.getSize(new THREE.Vector3()), cc = b.getCenter(new THREE.Vector3());
    const ss = splatBox.getSize(new THREE.Vector3()), sc = splatBox.getCenter(new THREE.Vector3());
    const s = (hi - lo) * ss.y / cs.y;
    place.scale.setScalar(s);
    cc.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    place.position.copy(sc).addScaledVector(cc, -s);
    place.position.y = splatBox.min.y + lo * ss.y - b.min.y * s;
    rig.root.add(obj);   // shown alone in Compare; on the avatar it is OutfitRig's to show
    return obj;
  });
  coatReady.catch(() => { failed = true; draw(); });
  function loadAvatar() {
    return avatarReady ??= rig.setAvatar(clo.avatar).then(av => {
      av.traverse(o => {   // a matte form colour instead of skin
        if (!o.isMesh) return;
        o.material = new THREE.MeshStandardMaterial({ color: FORM, roughness: 0.85, metalness: 0 });
        o.frustumCulled = false;   // skinned: its bind-pose box is not where it is drawn
      });
      av.visible = false;
      return av;
    }).catch(err => { avatarReady = null; throw err; });
  }

  /* ---------- State ---------- */
  let mode = "archive", split = 0.5, worn = true, sweep = null, frameTween = null;
  const home = { min: controls.minDistance, max: controls.maxDistance };

  async function setMode(m) {
    if (!MODES.some(([k]) => k === m) || m === mode) return draw();
    mode = m;
    if (m === "compare") {
      split = 1; sweep = reduce ? null : { t0: performance.now(), from: 1, to: 0.5 };
      if (reduce) split = 0.5;
    }
    draw();
    if (m === "worn") {
      worn = true;   // choosing Wear it always puts it on; the pill takes it off
      try { await coatReady; await loadAvatar(); } catch { failed = true; return draw(); }
      if (mode !== "worn") return;
      rig.avatar.visible = true;
      if (coat.parent === rig.root && !rig.isWorn(piece.id)) coat.removeFromParent();
      if (worn) await rig.wear(piece.id);
      frame(rig.avatar, 0.3);
    } else {
      if (rig.avatar) rig.avatar.visible = false;
      if (coat && !coat.parent) rig.root.add(coat);   // the bare coat, for Compare
      frameHome();
    }
    draw();
  }
  async function setWorn(on) {
    worn = on;
    if (mode !== "worn") return draw();
    await (on ? rig.wear(piece.id) : rig.remove(piece.id));
    draw();
  }

  /* camera: Wear it frames the body from mid-thigh up, every other view the page's own framing of the scan */
  const homeTarget = controls.target.clone();
  function frame(obj, fromFrac) {
    scene.updateMatrixWorld(true);   // this scene has not been drawn yet the first time
    const b = new THREE.Box3().setFromObject(obj);
    b.min.y += (b.max.y - b.min.y) * fromFrac;
    const c = b.getCenter(new THREE.Vector3()), h = b.max.y - b.min.y;
    c.y -= h * 0.08;   // the controls cover the bottom of the view: sit the body a little higher
    controls.minDistance = h * 0.45; controls.maxDistance = h * 2.4;
    tweenTo(c, h * 1.75);
  }
  function frameHome() {
    controls.minDistance = home.min; controls.maxDistance = home.max;
    tweenTo(homeTarget, splatBox.getSize(new THREE.Vector3()).y * 1.55);
  }
  function tweenTo(target, dist) {
    const dir = camera.position.clone().sub(controls.target).normalize();
    const to = { target: target.clone(), pos: target.clone().addScaledVector(dir, dist) };
    if (reduce) { controls.target.copy(to.target); camera.position.copy(to.pos); return; }
    frameTween = { t0: performance.now(), from: { target: controls.target.clone(), pos: camera.position.clone() }, to };
  }
  controls.addEventListener("start", () => { frameTween = null; });

  /* ---------- DOM state ---------- */
  function draw() {
    view.dataset.recon = mode;
    ui.querySelectorAll("[data-mode]").forEach(b => b.setAttribute("aria-checked", String(b.dataset.mode === mode)));
    const loading = (mode === "compare" && !coat) || (mode === "worn" && !(rig.avatar && coat));
    $(".wait", ui).textContent = failed && mode !== "archive" ? "The reconstruction didn't load. Try again later."
      : loading ? "Loading the reconstruction" : "";
    const w = $(".wear", ui);
    w.hidden = mode !== "worn" || loading || failed;
    w.textContent = worn ? "Take it off" : "Put it on";
    note.hidden = mode === "archive";
    placeSplit();
  }
  function placeSplit() {
    const x = split * view.clientWidth;
    $(".split", ui).style.transform = `translateX(${x}px)`;
    $(".grip", ui).style.transform = `translate(${x}px, -50%)`;
    $(".grip", ui).setAttribute("aria-valuenow", String(Math.round((1 - split) * 100)));
  }

  ui.addEventListener("click", e => {
    const b = e.target.closest("[data-mode]");
    if (b) setMode(b.dataset.mode);
    if (e.target.closest(".wear")) setWorn(!worn);
  });
  ui.querySelector(".seg").addEventListener("keydown", e => {   // radiogroup: arrows move the choice
    const i = MODES.findIndex(([k]) => k === mode), d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!d) return;
    e.preventDefault();
    const next = MODES[(i + d + MODES.length) % MODES.length][0];
    setMode(next); ui.querySelector(`[data-mode="${next}"]`).focus();
  });

  /* slider: drag the grip (the canvas keeps orbit), arrows nudge it */
  const grip = $(".grip", ui);
  let dragging = false;
  grip.addEventListener("pointerdown", e => { if (dragging) return; dragging = true; sweep = null; grip.setPointerCapture(e.pointerId); });
  grip.addEventListener("pointermove", e => {
    if (!dragging) return;
    const r = view.getBoundingClientRect();
    split = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    placeSplit();
  });
  const end = () => { dragging = false; };
  grip.addEventListener("pointerup", end); grip.addEventListener("pointercancel", end);
  grip.addEventListener("keydown", e => {
    const d = { ArrowLeft: -0.05, ArrowRight: 0.05, Home: -1, End: 1 }[e.key];
    if (d === undefined) return;
    e.preventDefault(); sweep = null; split = Math.min(1, Math.max(0, split + d)); placeSplit();
  });
  new ResizeObserver(placeSplit).observe(view);

  // start fetching once the scan is on screen: the splat (15 MB) never shares the link with these
  coatReady.then(() => loadAvatar()).catch(() => {}).finally(draw);
  draw();

  /* ---------- Render ---------- */
  const ease = k => 1 - Math.pow(1 - k, 3);
  function render(splatScene, cam) {
    const now = performance.now();
    if (sweep) {
      const k = Math.min(1, (now - sweep.t0) / SWEEP_MS);
      split = sweep.from + (sweep.to - sweep.from) * ease(k);
      placeSplit();
      if (k === 1) sweep = null;
    }
    if (frameTween) {
      const k = Math.min(1, (now - frameTween.t0) / 600), e = ease(k);
      controls.target.lerpVectors(frameTween.from.target, frameTween.to.target, e);
      camera.position.lerpVectors(frameTween.from.pos, frameTween.to.pos, e);
      if (k === 1) frameTween = null;
    }
    if (mode === "archive" || (mode === "compare" && !coat)) return renderer.render(splatScene, cam);
    if (mode === "worn") return renderer.render(scene, cam);
    const w = view.clientWidth, h = view.clientHeight, x = Math.round(split * w);
    renderer.setScissorTest(true);
    renderer.setScissor(0, 0, x, h); renderer.render(splatScene, cam);
    renderer.setScissor(x, 0, w - x, h); renderer.render(scene, cam);
    renderer.setScissorTest(false);
  }

  return {
    render, setMode,
    get mode() { return mode; },
    hunting: () => mode === "archive",
    get worn() { return worn; },
    wear: () => setWorn(true), takeOff: () => setWorn(false),
    rig,
  };
}

const CSS = `
.recon { position: absolute; inset: 0; pointer-events: none; }
.recon > * { pointer-events: auto; }
.recon .seg { position: absolute; z-index: 2; bottom: 12px; left: 50%; transform: translateX(-50%); display: flex; padding: 3px;
  background: var(--paper); border-radius: 999px; box-shadow: var(--shadow-pill); }
.recon .seg button { min-height: 44px; padding: 0 16px; border-radius: 999px; font: 500 14px/1 var(--sans); color: var(--ink);
  white-space: nowrap; transition: background-color 200ms ease, color 200ms ease, transform 160ms var(--ease-out); }
.recon .seg button[aria-checked="true"] { background: var(--ink); color: var(--paper); }
.recon .side { position: absolute; top: 12px; font: var(--t-label); letter-spacing: var(--track-label); text-transform: uppercase;
  color: var(--ink); background: var(--paper); padding: 5px 8px; border-radius: var(--r-pic); opacity: 0; pointer-events: none;
  transition: opacity 200ms var(--ease-out); }
.recon .side.l { left: 12px; } .recon .side.r { right: 12px; }
.recon .split { position: absolute; top: 0; bottom: 0; left: -1px; width: 2px; background: var(--paper); opacity: 0;
  pointer-events: none; box-shadow: 0 0 0 .5px rgb(0 0 0 / .12); transition: opacity 200ms var(--ease-out); }
.recon .grip { position: absolute; top: 50%; left: -24px; width: 48px; height: 48px; border-radius: 50%; display: grid;
  place-items: center; background: var(--paper); color: var(--ink); box-shadow: var(--shadow-pill); touch-action: none;
  cursor: ew-resize; opacity: 0; visibility: hidden; transition: opacity 200ms var(--ease-out), visibility 0s 200ms; }
#view[data-recon="compare"] .recon :is(.side, .split) { opacity: 1; }
#view[data-recon="compare"] .recon .grip { opacity: 1; visibility: visible; transition: opacity 200ms var(--ease-out); }
.recon .wear { position: absolute; left: 50%; bottom: 74px; transform: translateX(-50%); min-height: 48px; padding: 0 22px;
  border-radius: 999px; background: var(--ink); color: var(--paper); font: 500 15px/1 var(--sans); box-shadow: var(--shadow-pill); }
.recon .wear:active { transform: translateX(-50%) scale(0.97); }
.recon .wear[hidden] { display: none; }
.recon .wait { position: absolute; left: 0; right: 0; bottom: 84px; text-align: center; pointer-events: none; }
.recon .wait:empty { display: none; }
.recon-note[hidden] { display: none; }
#view[data-recon] #toast { bottom: 74px; }   /* above the segmented control */
@media (prefers-reduced-motion: reduce) { .recon * { transition-duration: 0s !important; } }
`;
