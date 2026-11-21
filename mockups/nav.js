/* H6: one back behaviour for the whole app. Every modal <dialog> that opens (fact card, Ask, share, Museum, help, story,
   Win it, 3D view, NFC popup, including dialogs other modules create later) gets one browser history entry, so the
   phone's back gesture closes the top layer instead of leaving the site. Back works like Escape: the dialog's `cancel`
   event fires first, so a dialog that refuses Escape (Win it) also refuses back, and its entry comes straight back.
   Closing a dialog any other way (its button, a backdrop tap) takes its entry off again.

   No module needs to call this: it watches the `open` attribute. Dialogs that hand over to each other in one go
   (story -> Win it, fact card -> Ask) reuse the same entry, so back never has to be pressed twice for one layer.
   Loaded once per page: `import "./nav.js"`. */

const KEY = "h6";              // history.state[KEY] = how many of our layers are on top of the page's own entry
const HANDOVER_MS = 80;        // a dialog opening this soon after another closed takes over its entry

const open = [];               // open modal dialogs, oldest first
let depth = 0;                 // our entries above the page entry right now
let ignorePops = 0;            // pops we caused ourselves (history.go) and must not treat as the visitor's back
let settle = null, pending = false;   // pending: a reconcile is waiting for a handover

const layer = () => history.state?.[KEY] ?? 0;

// The page can be reloaded or restored while one of our entries is current; nothing is open then, so start clean.
if (layer() > 0) history.replaceState({ ...history.state, [KEY]: 0 }, "");

function reconcile() {         // make the entries match the open dialogs, after any handover has had its chance
  clearTimeout(settle);
  pending = true;
  settle = setTimeout(() => {
    pending = false;
    const want = open.length;
    if (want > depth) {
      while (depth < want) { depth++; history.pushState({ ...history.state, [KEY]: depth }, ""); }
    } else if (want < depth) {
      ignorePops++;
      history.go(want - depth);   // one traversal for every layer that closed; its popstate is ours
      depth = want;
    }
  }, HANDOVER_MS);
}

function watch(d) {
  if (d.__h6) return;
  d.__h6 = true;
  new MutationObserver(() => {
    const i = open.indexOf(d);
    if (d.open && i < 0 && d.matches(":modal")) open.push(d);
    else if (!d.open && i >= 0) open.splice(i, 1);
    else return;
    reconcile();
  }).observe(d, { attributes: true, attributeFilter: ["open"] });
}

document.querySelectorAll("dialog").forEach(watch);
new MutationObserver(records => {
  for (const r of records) for (const n of r.addedNodes) {
    if (n.nodeType !== 1) continue;
    if (n.matches("dialog")) watch(n);
    n.querySelectorAll?.("dialog").forEach(watch);
  }
}).observe(document.documentElement, { childList: true, subtree: true });

addEventListener("popstate", () => {
  if (ignorePops) { ignorePops--; depth = layer(); return; }
  const now = layer();
  if (now > depth) {            // forward button: a closed layer cannot be reopened, so step back to where we are
    ignorePops++; history.go(depth - now); return;
  }
  depth = now;
  clearTimeout(settle); pending = false;
  while (open.length > depth) {
    const top = open[open.length - 1];
    const ok = top.dispatchEvent(new Event("cancel", { cancelable: true }));
    if (!ok) { reconcile(); return; }   // this layer only closes by its own choice (Win it): put its entry back
    open.pop();                         // the observer will see it closed; it must not push or pop again
    top.close();
  }
});

/* Leave for another page once our own history steps have landed: navigating while a history.go() is still travelling
   can cancel one or the other. `replace` swaps the current entry (a card scan's URL) instead of adding one. */
export async function settled() {
  for (let t = 0; t < 1500 && (pending || ignorePops); t += 20) await new Promise(r => setTimeout(r, 20));
}
export async function go(href, { replace = false } = {}) {
  await settled();
  replace ? location.replace(href) : location.assign(href);
}

/* A page link that should behave like a back step when the previous entry is the page it points at (Up close's ←):
   go back instead of piling a new entry on top, which made back return into Up close. */
export function backTo(href, { from } = {}) {
  const ref = document.referrer && new URL(document.referrer);
  const target = new URL(href, location.href);
  if (ref && ref.origin === location.origin && ref.pathname === target.pathname && history.length > 1
      && (!from || from === ref.pathname)) { history.back(); return; }
  location.replace(target);
}
