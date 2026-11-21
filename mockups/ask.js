/* H2 Ask the archive: a bottom sheet where a visitor asks about one piece. Answers come from POST /api/ask, which reads
   only that piece's MoMu record (D3) and labels the answer as AI (EU AI Act transparency). With no key, no network or a
   busy server, the three suggested questions are answered straight from the record's fields, with no model, so the
   demo never breaks on venue wifi. Nothing is stored: the conversation lives in this sheet until it closes (D2). */
import { LABEL, MAX_QUESTION, NOT_RECORDED, cleanQuestion, fieldAnswer, fieldLabel, suggestions } from "./ask-core.js";

const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export function createAsk({ endpoint = "api/ask" } = {}) {
  let records = null;
  const recordsOf = () => records ??= fetch("ask-records.json").then(r => r.json()).catch(() => ({}));

  const el = document.createElement("dialog");
  el.className = "ask"; el.setAttribute("aria-labelledby", "askName");
  el.innerHTML = `<div class="ask-in">
    <span class="handle" aria-hidden="true"></span>
    <div class="ask-head">
      <div><div class="mono" id="askId"></div><h3 id="askName"></h3></div>
      <button class="ask-x press" data-close aria-label="Close Ask the archive">×</button>
    </div>
    <p class="ask-note">AI answers, written only from MoMu's record of this piece. If the record is silent, so is the answer.</p>
    <div class="ask-log" id="askLog" role="log" aria-live="polite"></div>
    <div class="ask-sugg" id="askSugg" role="group" aria-label="Suggested questions"></div>
    <form class="ask-form" id="askForm" autocomplete="off">
      <label class="vh" for="askQ">Your question about this piece</label>
      <input id="askQ" name="q" type="text" maxlength="${MAX_QUESTION}" enterkeyhint="send" placeholder="Ask about this piece">
      <button class="btn press" id="askGo" type="submit">Ask</button>
    </form>
    <p class="ask-privacy">Please leave out names and personal details. Questions go to an AI service and we do not keep them.</p>
  </div>`;
  document.body.append(el);
  const $ = id => el.querySelector(`#${id}`);
  el.addEventListener("click", e => {
    if (e.target === el || e.target.closest("[data-close]")) el.close();
    const s = e.target.closest("[data-q]");
    if (s) send(s.dataset.q, s.dataset.key);
  });
  $("askForm").addEventListener("submit", e => { e.preventDefault(); send($("askQ").value); });

  let piece = null, busy = false, offline = false;

  async function open(id, name) {
    piece = id; offline = false;
    $("askId").textContent = `Ask the archive · ${id}`;
    $("askName").textContent = name;
    $("askLog").innerHTML = "";
    $("askQ").value = "";
    const rec = (await recordsOf())[id];
    $("askSugg").innerHTML = suggestions(rec).map(s => `<button class="chip press" data-q="${esc(s.q)}" data-key="${s.key}">${esc(s.q)}</button>`).join("");
    if (!el.open) el.showModal();
    $("askQ").focus({ preventScroll: true });
  }

  function bubble(cls, html) {
    const d = document.createElement("div");
    d.className = `ask-msg ${cls}`; d.innerHTML = html;
    $("askLog").append(d);
    d.scrollIntoView({ block: "end", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    return d;
  }

  function answerHtml(rec, a, { ai }) {
    const from = a.fields.length ? `<p class="ask-from">From the MoMu record: ${a.fields.map(k => esc(fieldLabel(rec, k))).join(", ")}</p>` : "";
    const dutch = a.quote && rec?.fields.some(f => f.values.join("; ").replace(/\s+/g, " ").includes(a.quote));   // values are MoMu's Dutch; en is ours
    const quote = a.quote ? `<q class="ask-quote"${dutch ? ' lang="nl"' : ""}>${esc(a.quote)}</q>` : "";
    const badge = ai ? `<span class="ask-badge">${esc(LABEL)}</span>` : `<span class="ask-badge plain">Straight from the record, no AI</span>`;
    return `<p>${esc(a.answer)}</p>${from}${quote}${badge}`;
  }

  async function send(raw, key) {
    const q = cleanQuestion(raw);
    if (!q || busy || !piece) return;
    const id = piece, rec = (await recordsOf())[id];
    busy = true; $("askGo").disabled = true; $("askQ").value = "";
    bubble("q", esc(q));
    const wait = bubble("a pending", `<p>Reading the record…</p>`);
    let a = null, ai = true;
    if (!offline) {
      try {
        const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pieceId: id, question: q }) });
        if (r.ok) { a = await r.json(); if (a.offline) { a = null; offline = true; } }
        else if (r.status === 405 || r.status === 501) offline = true;   // no key, or a static server with no function: stop trying
      } catch { /* no network: answer from fields for this question */ }
    }
    if (id !== piece) { busy = false; $("askGo").disabled = false; return; }   // the sheet moved to another piece meanwhile
    if (!a) {
      ai = false;
      a = key ? fieldAnswer(rec, key)
        : { answerable: false, fields: [], quote: "", answer: "Ask can't reach the archive right now. The suggested questions still answer from the record." };
    }
    wait.classList.remove("pending");
    wait.innerHTML = answerHtml(rec, a, { ai });
    if (!a.answerable && a.answer === NOT_RECORDED) wait.classList.add("nr");
    busy = false; $("askGo").disabled = false;
  }

  return { open, close: () => el.close() };
}
