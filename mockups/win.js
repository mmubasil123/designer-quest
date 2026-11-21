/* Win it: the one challenge that turns a room piece into a wardrobe piece. Wearables are won by guessing their year;
   study pieces by finding their details on up-close.html, then both end on the same Won card. Every fact shown comes
   from pieces.json or records.json (D3). Nobody can lose: hints after a miss, and the third miss wins anyway. */
import { stepsHtml, stepIn } from "./steps.js";   // H6: same step line as the story; content swaps in place
import { t, tc, labelHtml } from "./i18n.js";   // D-3

const esc = x => String(x).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const NEAR = 25;   // years: close enough to win
const span = y => y.from === y.to ? `${y.from}` : t("{a} to {b}", { a: y.from, b: y.to });

export function judge(guess, year) {
  const off = guess < year.from ? year.from - guess : guess > year.to ? guess - year.to : 0;
  const won = off <= NEAR;
  return { won, off, hint: won ? null : guess < year.from ? "later" : "earlier" };
}

export function createWin({ PIECES, record, img }) {
  const el = document.createElement("dialog");
  el.className = "win";
  el.setAttribute("aria-labelledby", "winTitle");
  document.body.append(el);
  // H6: Escape and the back gesture act like the dialog's quiet button: Not now while guessing, keep it once won
  let onCancel = null;
  el.addEventListener("cancel", e => { e.preventDefault(); onCancel?.(); });
  const open = html => {
    const swap = el.open;
    el.innerHTML = `<div tabindex="-1" autofocus>${html}</div>`;
    if (!swap) el.showModal(); else { el.firstElementChild.focus(); stepIn(el.firstElementChild); }
  };

  function guess(id) {
    const p = PIECES[id];
    open(`${stepsHtml(1)}<div class="mono">${t("Win it")} · ${esc(id)}</div>
      <h2 id="winTitle">${t("When was it made?")}</h2>
      <img class="pic" src="${img(id)}" alt="">
      <output class="year" id="winYear" aria-live="polite">1900</output>
      <input type="range" id="winSlider" min="1700" max="2025" step="5" value="1900" aria-label="${t("Your guess, year")}">
      <div class="ends mono"><span>1700</span><span>2025</span></div>
      <p class="hint" id="winHint" role="status">${t("Get within {n} years to win the {name}.", { n: NEAR, name: esc(p.name.split(",")[0].toLowerCase()) })}</p>
      <button class="btn press" id="winGo">${t("Guess")}</button>
      <button class="btn ghost press" id="winLater" type="button">${t("Not now")}</button>`);
    const slider = el.querySelector("#winSlider"), out = el.querySelector("#winYear"), hint = el.querySelector("#winHint");
    slider.addEventListener("input", () => { out.textContent = slider.value; });
    let tries = 0;
    return new Promise(resolve => {   // resolves the years off, or null for Not now (the piece stays in the Museum)
      onCancel = () => { onCancel = null; el.close(); resolve(null); };
      el.querySelector("#winLater").addEventListener("click", () => onCancel?.());
      el.querySelector("#winGo").addEventListener("click", function go() {
        const r = judge(+slider.value, p.year);
        tries++;
        if (r.won || tries >= 3) { this.removeEventListener("click", go); onCancel = null; resolve(r.off); return; }
        hint.textContent = `${t(r.hint === "later" ? "Later than {year}." : "Earlier than {year}.", { year: slider.value })} ${tries === 1 ? t("Try again.") : t("One more try.")}`;
        hint.classList.remove("nudge"); void hint.offsetWidth; hint.classList.add("nudge");
      });
    });
  }

  function won(id, { off = null, what = "piece", study = false } = {}) {   // study: the challenge was Up close (step line)
    const p = PIECES[id], r = record(id) || {};
    // the first sentence of MoMu's description (Dutch) in this language; the team's own English where there is one
    const q = r.quote ? tc(`rec:${id}:quote`, r.quote, "nl") : null;
    open(`${stepsHtml(2, { study })}<p class="cheer">${what === "fabric" ? t("You won its fabric!") : t("You won it!")}</p>
      <h2 id="winTitle" class="name">${esc(p.name)}</h2>
      <img class="pic won" src="${img(id)}" alt="">
      <p class="date">${t("Made {span}", { span: esc(span(p.year)) })}${off === null ? "" : off === 0 ? ` · ${t("spot on")}` : ` · ${t("you were {n} years off", { n: off })}`}</p>
      ${q ? `<blockquote>${esc(q.text)}<span class="mono">${t("MoMu says")}</span>${q.tr ? labelHtml(q.by) : ""}${q.tr ? `<q class="orig" lang="nl">${esc(r.quote)}</q>` : ""}</blockquote>` : ""}
      <button class="btn press" id="winAdd" data-pick="wear">${t("Wear it now")}</button>
      <button class="btn ghost press" data-pick="keep">${what === "fabric" ? t("Keep it in my fabrics") : t("Keep it in my wardrobe")}</button>
      ${nextRow(id)}`);
    // resolves "wear", "keep" or "next" (H17: keep it, then open win.next); either way the prize is already the visitor's
    return new Promise(resolve => {   // H6: Escape or back keeps it, like the quiet button
      const done = pick => { onCancel = null; el.close(); resolve(pick); };
      onCancel = () => done("keep");
      el.querySelectorAll("[data-pick]").forEach(b => b.addEventListener("click", () => done(b.dataset.pick), { once: true }));
    });
  }

  /* H15 (the rest of J5): the Won card ends on the next piece to win, so one win leads to the next. A study piece the
     visitor has started comes first, else the next room piece still locked, in pieces.json order. Facts: name, photo
     and detail count from pieces.json only (D3). Nothing shows once every piece is won. */
  function nextPiece(wonId) {
    const left = Object.entries(PIECES).filter(([id, q]) => id !== wonId && q.room && q.locked && (q.glb || q.splat));
    return left.find(([, q]) => q.splat && q.seen) ?? left[0];   // seen: opened up close once, so Museum opens it again
  }
  let next = null;   // H17: the id the row points at, read by the Stage when the pick is "next"
  function nextRow(wonId) {
    const found = nextPiece(wonId); next = found?.[0] ?? null; if (!found) return "";
    const [id, q] = found, n = q.details || 3;
    const how = q.splat && q.seen ? (q.found > 0 ? t("You found {found} of {n} details. Tap to finish up close.", { found: q.found, n })
        : t("Tap to find its {n} details up close.", { n }))
      : q.splat ?t("Find its sticker at MoMu, then find its {n} details up close.", { n })
      : t("Find its sticker at MoMu and guess when it was made.");
    // H17: a button, so one win leads straight to the next; the Stage opens it after keeping this prize
    return `<button class="next press" data-pick="next"><img src="${img(id)}" alt="">
      <span class="txt"><span class="mono">${t("Next to win")}</span><b>${esc(q.name)}</b><span class="how">${esc(how)}</span></span>
      <svg class="go" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
  }

  return { guess, won, get next() { return next; } };
}
