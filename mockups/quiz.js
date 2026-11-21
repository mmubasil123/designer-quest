/* C2: after a card scan, the piece's story and questions from the curator (questions.json, synced from her Notion page by
   tools/questions_sync.py). Optional and on top: the piece is collected by the scan itself, nothing is locked behind a
   question, and there is no score, timer or streak (D2). Each question shows its answer on a tap. */

import { t, tc, labelHtml } from "./i18n.js";   // D-3

const esc = x => String(x).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

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
    const T = (k, x) => tc(`q:${id}:${k}`, x, "en");   // her English text in the chosen language (build-time translation)
    const anyTr = [...p.story.map((x, n) => T(`story:${n}`, x)), ...qs.flatMap((q, n) => [T(`q:${n}`, q.q), T(`a:${n}`, q.a)])].some(g => g.tr);
    el.innerHTML = `<div tabindex="-1" autofocus>
      <div class="mono">${found ? t("Found at MoMu") : story ? t("Story") : t("Questions")} · ${esc(id)}</div>
      <h2 id="quizName">${esc(T("title", p.title).text)}</h2>
      ${p.facts.length ? `<dl>${p.facts.map(([k, v], n) => `<dt>${esc(t(k))}</dt><dd>${esc(T(`fact:${n}`, v).text)}</dd>`).join("")}</dl>` : ""}
      ${(story ? p.story : []).map((x, n) => `<p class="story">${esc(T(`story:${n}`, x).text)}</p>`).join("")}
      ${p.link ? `<p class="cite"><a href="${esc(p.link)}" target="_blank" rel="noopener">${t("Source: MoMu Study Collection")} ↗</a></p>` : ""}
      ${qs.length ? `<h3>${t("Look closer")}</h3><ol class="qs">${qs.map((q, i) => `<li><p>${esc(T(`q:${i}`, q.q).text)}</p>
        <button class="reveal press" data-reveal aria-controls="quizA${i}">${t("Show answer")}</button>
        <p class="ans" id="quizA${i}" tabindex="-1" hidden>${esc((a => a[0].toUpperCase() + a.slice(1))(T(`a:${i}`, q.a).text))}</p></li>`).join("")}</ol>` : ""}
      ${anyTr ? `<p class="tr-row">${labelHtml("machine")}</p>` : ""}
      <div class="row"><button class="btn press" data-close>${esc(t(next))}</button></div>
    </div>`;
    if (!el.open) el.showModal();
    return new Promise(resolve => el.addEventListener("close", resolve, { once: true }));
  }

  return { has: id => !!byId[id], show };
}
