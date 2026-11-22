/* H6: the card scan is one short flow (story, then its challenge, then the piece is yours), shown in two dialogs
   (story.js, win.js). This keeps them reading as one: the same step line on each, and a handover that swaps the
   content in place instead of closing one card and opening another. Styles: `.steps` in story.css. */
const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const reduce = matchMedia("(prefers-reduced-motion: reduce)");

// i: 0 story, 1 challenge, 2 won. study: the challenge is Up close (its own page), not Guess the year.
export function stepsHtml(i, { study = false } = {}) {
  const names = ["Story", study ? "Up close" : "Guess the year", "Yours"];
  return `<ol class="steps" aria-label="Step ${i + 1} of 3">${names.map((n, k) =>
    `<li${k === i ? ' aria-current="step"' : ""}${k < i ? ' class="done"' : ""}>${esc(n)}</li>`).join("")}</ol>`;
}

// Called right before a step's dialog closes to hand over to the next one: the next dialog then opens without its
// scale-in and the old one leaves at once, so the scrim stays put and only the content changes.
export function handover() {
  const root = document.documentElement;
  root.dataset.scan = "step";
  clearTimeout(handover.t);
  handover.t = setTimeout(() => { delete root.dataset.scan; }, 400);
}

// New content in a dialog that is already open (Guess the year -> You won it): a short rise and fade, not a hard cut.
export function stepIn(el) {
  if (!el?.animate) return;
  const kf = reduce.matches ? [{ opacity: 0 }, { opacity: 1 }]
    : [{ opacity: 0, transform: "translateY(6px)", filter: "blur(2px)" }, { opacity: 1, transform: "none", filter: "blur(0)" }];
  el.animate(kf, { duration: reduce.matches ? 150 : 200, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
}
