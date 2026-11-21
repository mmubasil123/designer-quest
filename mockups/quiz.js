/* C2: after a card scan, the piece's story and questions from the curator (questions.json, synced from her Notion page by
   tools/questions_sync.py). Optional and on top: the piece is collected by the scan itself, nothing is locked behind a
   question, and there is no score, timer or streak (D2). Each question shows its answer on a tap. */

const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export async function createQuiz({ pieces }) {
  let byId = {};
  try {
    const doc = await (await fetch("questions.json")).json();
    byId = Object.fromEntries(doc.pieces.filter(p => pieces[p.id]).map(p => [p.id, p]));
  } catch { /* no questions file: card scans work as before */ }

  const el = document.createElement("dialog");
  el.className = "quiz"; el.setAttribute("aria-labelledby", "quizName");
  document.body.append(el);
  el.addEventListener("click", e => {
    if (e.target === el) { el.close(); return; }   // backdrop tap closes, like the fact card
    const b = e.target.closest("[data-reveal]");
    if (b) {
      const ans = el.querySelector(`#${b.getAttribute("aria-controls")}`);
      ans.hidden = false; b.hidden = true; ans.focus();
    }
    if (e.target.closest("[data-close]")) el.close();
  });

  function show(id, { found = false, next = "Close", story = true } = {}) {   // story: false when story.js already showed it
    const p = byId[id];
    if (!p) return Promise.resolve();
    const qs = p.questions;   // every question on her page, in her order
    el.innerHTML = `<div tabindex="-1" autofocus>
      <div class="mono">${found ? "Found in the museum" : story ? "Story" : "Questions"} · ${esc(id)}</div>
      <h2 id="quizName">${esc(p.title)}</h2>
      ${p.facts.length ? `<dl>${p.facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>` : ""}
      ${(story ? p.story : []).map(t => `<p class="story">${esc(t)}</p>`).join("")}
      ${p.link ? `<p class="cite"><a href="${esc(p.link)}" target="_blank" rel="noopener">Source: MoMu Study Collection ↗</a></p>` : ""}
      ${qs.length ? `<h3>Look closer</h3><ol class="qs">${qs.map((q, i) => `<li><p>${esc(q.q)}</p>
        <button class="reveal press" data-reveal aria-controls="quizA${i}">Show answer</button>
        <p class="ans" id="quizA${i}" tabindex="-1" hidden>${esc(q.a[0].toUpperCase() + q.a.slice(1))}</p></li>`).join("")}</ol>` : ""}
      <div class="row"><button class="btn press" data-close>${esc(next)}</button></div>
    </div>`;
    if (!el.open) el.showModal();
    return new Promise(resolve => el.addEventListener("close", resolve, { once: true }));
  }

  return { has: id => !!byId[id], show };
}
