/* B5/B6: persistent wardrobe tiles. A tile is built once per key and reused: a render only toggles its classes and
   aria, so a selection can animate and the node survives tab changes. B6: a locked piece shows as a silhouette (an
   `.sil` copy of its photo, flattened to ink) and is revealed with a clip-path wipe the first time the tile is seen
   after the piece is won; the node remembers it was revealed, so it plays once. */
const nodes = new Map();

export function nodeFor(key, html) {
  let n = nodes.get(key);
  if (!n) {
    const t = document.createElement("template");
    t.innerHTML = html().trim();
    n = t.content.firstElementChild;
    nodes.set(key, n);
  }
  return n;
}

const seen = typeof IntersectionObserver === "function" ? new IntersectionObserver(entries => {
  for (const e of entries) {
    if (!e.isIntersecting || !e.target.matches(".veiled:not(.locked)")) continue;
    seen.unobserve(e.target);
    requestAnimationFrame(() => e.target.classList.remove("veiled"));   // the next frame, so the clip-path change transitions
  }
}, { threshold: 0.6 }) : null;

/* state: { on, locked, fresh, aria }; a tile without a `.sil` layer (never locked) skips the veil */
export function syncTile(n, { on, locked, fresh, aria }) {
  const pick = n.querySelector(".pick");
  n.classList.toggle("on", !!on);
  n.classList.toggle("new", !!fresh);
  n.classList.toggle("locked", !!locked);
  if (n.querySelector(".sil")) {
    if (locked) n.classList.add("veiled");
    else if (n.classList.contains("veiled")) { if (seen) seen.observe(n); else n.classList.remove("veiled"); }
  }
  pick.setAttribute("aria-pressed", String(!!on));
  pick.setAttribute("aria-label", aria);
  return n;
}

/* put `list` into `parent` in order, moving only what is out of place and dropping what left; a node that stays is
   never detached, so its transitions keep running */
export function show(parent, list) {
  list.forEach((n, i) => { if (parent.children[i] !== n) parent.insertBefore(n, parent.children[i] ?? null); });
  while (parent.children.length > list.length) parent.lastElementChild.remove();
}
