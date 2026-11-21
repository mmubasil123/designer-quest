/* H7 storytelling backgrounds: every 3D view stands its piece in a scene from the piece's own time, never a blank wall.
   Six period rooms in assets/scenes/, chosen from the middle of the piece's dated span in pieces.json (D3: the date is
   the record's; the room is atmosphere, so no label claims it). The top of each scene fades to paper under any title
   (--scene-clear), so the red headings keep their contrast. Used by the Stage, the 3D view and Up close. */
const ERAS = [
  ["salon", 1799],        // candlelit panelled salon
  ["arcade", 1889],       // gaslit iron-and-glass arcade
  ["nouveau", 1919],      // art nouveau doorway
  ["deco", 1949],         // art deco proscenium
  ["midcentury", 1969],   // modernist room
  ["runway", Infinity],   // concrete show space
];
export function eraOf(year) {
  const mid = year ? ((year.from ?? year.to) + (year.to ?? year.from)) / 2 : NaN;
  return Number.isFinite(mid) ? ERAS.find(([, until]) => mid <= until)[0] : "runway";
}
/* Mounts a scene as the first child of host; set(year) cross-fades to that era's room (two layers, so it never blinks). */
export function mountScene(host) {
  const el = document.createElement("div");
  el.className = "scene"; el.setAttribute("aria-hidden", "true");
  el.innerHTML = "<i></i><i></i>";
  host.prepend(el);
  const layers = [...el.children];
  let current = null, front = 0;
  return {
    el,
    set(year) {
      const era = typeof year === "string" ? year : eraOf(year);
      if (era === current) return era;
      current = era;
      const next = layers[front ^= 1], prev = layers[front ^ 1];
      next.style.backgroundImage = `url("assets/scenes/${era}.svg")`;
      next.classList.add("on"); prev.classList.remove("on");
      el.dataset.era = era;
      return era;
    },
  };
}
