/* C2 quiz: one question per wearable piece, from questions.json (checked by tools/questions_check.py).
   The answer is a MoMu record field (D3). Right: the record's fact shows and the piece's fabric unlocks for Remix.
   Wrong: the right answer shows gently, the piece stays unlocked, the fabric stays locked until the card is scanned
   again. No score, timer or streak (D2). State is the optional `quiz` field of the page's save: { "<id>": "right" | "wrong" }. */

const FIELD_LABEL = { date: "date", place: "place", medium: "material" };
const plain = t => t.replace(/ \([^)]*\)$/, "");   // "cotton (fiber)" -> "cotton", as on the fact card
const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export async function createQuiz({ pieces, saveKey, onAnswer, onClose }) {
  let questions = {};
  try {
    const doc = await (await fetch("questions.json")).json();
    questions = Object.fromEntries(doc.questions.filter(q => pieces[q.id]?.glb).map(q => [q.id, q]));
  } catch { /* no questions file: every fabric stays open, as before C2 */ }

  const state = {};
  try {   // storage is user-controlled: keep only known ids with a known result
    const saved = JSON.parse(localStorage.getItem(saveKey) || "null")?.quiz;
    for (const [id, r] of Object.entries(saved && typeof saved === "object" ? saved : {})) if (questions[id] && (r === "right" || r === "wrong")) state[id] = r;
  } catch { /* corrupt or blocked save: no answers yet */ }
  const sync = () => { for (const id of Object.keys(questions)) pieces[id].fabricLocked = state[id] !== "right"; };
  sync();

  let records = null;
  const recordsOf = () => records ??= fetch("records.json").then(r => r.json()).catch(() => ({}));

  const el = document.createElement("dialog");
  el.className = "quiz"; el.setAttribute("aria-labelledby", "quizName");
  el.innerHTML = `<div tabindex="-1" autofocus>
    <div class="mono" id="quizId"></div>
    <h3 id="quizName"></h3>
    <p class="prompt" id="quizPrompt"></p>
    <div class="opts" id="quizOpts" role="group" aria-labelledby="quizPrompt"></div>
    <div class="result" id="quizResult" role="status" aria-live="polite"></div>
    <div class="row" id="quizRow"></div>
  </div>`;
  document.body.append(el);
  el.addEventListener("click", e => { if (e.target === el) el.close(); });   // backdrop tap closes, like the fact card
  const $ = id => el.querySelector(`#${id}`);
  let current = null, answered = null, tryFabric = false;

  function ask(id, { found = false } = {}) {
    const q = questions[id];
    if (!q) return false;
    current = id; answered = null; tryFabric = false;
    const p = pieces[id];
    $("quizId").textContent = found ? `Found in the museum · ${id}` : `${id} · one question`;
    $("quizName").textContent = p.name;
    $("quizPrompt").textContent = q.prompt;
    $("quizOpts").innerHTML = q.options.map(o => `<button class="opt press" data-opt="${esc(o)}">${esc(cap(plain(o)))}</button>`).join("");
    $("quizResult").innerHTML = "";
    $("quizRow").innerHTML = `<button class="btn ghost press" data-close>Not now</button>`;
    if (!el.open) el.showModal();
    return true;
  }

  async function answer(choice) {
    const id = current, q = questions[id], right = choice === q.answer;
    el.querySelectorAll("[data-opt]").forEach(b => {
      b.disabled = true;
      b.classList.toggle("right", b.dataset.opt === q.answer);
      b.classList.toggle("picked", b.dataset.opt === choice);
    });
    if (state[id] !== "right") state[id] = right ? "right" : "wrong";   // a right answer stays won
    sync();
    const name = pieces[id].name.split(",")[0].toLowerCase();
    const said = `MoMu records its ${FIELD_LABEL[q.field]} as <b>${esc(cap(plain(q.answer)))}</b>.`;
    if (right) {
      const r = (await recordsOf())[q.record] || {};
      $("quizResult").innerHTML = `<p class="verdict">Right. ${said}</p>` + (r.quote
        ? `<blockquote><div class="mono">MoMu says</div><q lang="nl">${esc(r.quote)}</q><p>${esc(r.quoteEn)} <span class="mono">Our translation</span></p></blockquote>` : "")
        + `<p class="won">The fabric of the ${esc(name)} is yours to remix.</p>`;
      $("quizRow").innerHTML = `<button class="btn press" data-try>Try the fabric</button><button class="btn ghost press" data-close>Later</button>`;
    } else {
      $("quizResult").innerHTML = `<p class="verdict">Not this time. ${said}</p>
        <p class="won">You keep the ${esc(name)} in your wardrobe. The fabric waits in the museum: scan the card again for another go.</p>`;
      $("quizRow").innerHTML = `<button class="btn press" data-close>Back to the form</button>`;
    }
    $("quizRow").querySelector("button").focus();
    answered = right;
    onAnswer?.(id, right);   // the page saves now; toasts wait for onClose, since the open sheet would cover them
  }

  el.addEventListener("click", e => {
    const o = e.target.closest("[data-opt]");
    if (o && !o.disabled) { answer(o.dataset.opt); return; }
    if (e.target.closest("[data-close]")) el.close();
    if (e.target.closest("[data-try]")) { tryFabric = true; el.close(); }
  });
  el.addEventListener("close", () => onClose?.(current, { answered, tryFabric }));

  return {
    has: id => !!questions[id],
    result: id => state[id] ?? null,
    state,   // saved by the page as the optional `quiz` field of its save
    ask,
    reset() { for (const id of Object.keys(state)) delete state[id]; sync(); },
  };
}
const cap = t => t[0].toUpperCase() + t.slice(1);
