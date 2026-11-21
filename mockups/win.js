/* Win it: the one challenge that turns a room piece into a wardrobe piece. Wearables are won by guessing their year;
   study pieces by finding their details on up-close.html, then both end on the same Won card. Every fact shown comes
   from pieces.json or records.json (D3). Nobody can lose: hints after a miss, and the third miss wins anyway. */
const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const NEAR = 25;   // years: close enough to win
const span = y => y.from === y.to ? `${y.from}` : `${y.from} to ${y.to}`;

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
  el.addEventListener("cancel", e => e.preventDefault());   // the challenge ends with a choice, not Escape
  const open = html => { el.innerHTML = `<div tabindex="-1" autofocus>${html}</div>`; if (!el.open) el.showModal(); };

  function guess(id) {
    const p = PIECES[id];
    open(`<div class="mono">Win it · ${esc(id)}</div>
      <h2 id="winTitle">When was it made?</h2>
      <img class="pic" src="${img(id)}" alt="">
      <output class="year" id="winYear" aria-live="polite">1900</output>
      <input type="range" id="winSlider" min="1700" max="2025" step="5" value="1900" aria-label="Your guess, year">
      <div class="ends mono"><span>1700</span><span>2025</span></div>
      <p class="hint" id="winHint" role="status">Get within ${NEAR} years to win the ${esc(p.name.split(",")[0].toLowerCase())}.</p>
      <button class="btn press" id="winGo">Guess</button>`);
    const slider = el.querySelector("#winSlider"), out = el.querySelector("#winYear"), hint = el.querySelector("#winHint");
    slider.addEventListener("input", () => { out.textContent = slider.value; });
    let tries = 0;
    return new Promise(resolve => el.querySelector("#winGo").addEventListener("click", function go() {
      const r = judge(+slider.value, p.year);
      tries++;
      if (r.won || tries >= 3) { this.removeEventListener("click", go); resolve(r.off); return; }
      hint.textContent = `${r.hint === "later" ? "Later" : "Earlier"} than ${slider.value}. ${tries === 1 ? "Try again." : "One more try."}`;
      hint.classList.remove("nudge"); void hint.offsetWidth; hint.classList.add("nudge");
    }));
  }

  function won(id, { off = null, what = "piece" } = {}) {
    const p = PIECES[id], r = record(id) || {};
    const quote = r.quoteEn || r.quote;
    open(`<p class="cheer">You won ${what === "fabric" ? "its fabric" : "it"}!</p>
      <h2 id="winTitle" class="name">${esc(p.name)}</h2>
      <img class="pic won" src="${img(id)}" alt="">
      <p class="date">Made ${esc(span(p.year))}${off === null ? "" : off === 0 ? " · spot on" : ` · you were ${off} years off`}</p>
      ${quote ? `<blockquote>${esc(quote)}<span class="mono">MoMu says${r.quoteEn ? ", our translation" : ""}</span></blockquote>` : ""}
      <button class="btn press" id="winAdd" data-pick="wear">Wear it now</button>
      <button class="btn ghost press" data-pick="keep">Keep it in my ${what === "fabric" ? "fabrics" : "wardrobe"}</button>`);
    // resolves "wear" or "keep"; either way the prize is already the visitor's
    return new Promise(resolve => el.querySelectorAll("[data-pick]").forEach(b => b.addEventListener("click", () => { el.close(); resolve(b.dataset.pick); }, { once: true })));
  }

  return { guess, won };
}
