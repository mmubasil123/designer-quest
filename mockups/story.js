/* H3: the piece's story with narration, shown after a card scan and before its questions (quiz.js).
   Text and audio come from narration.json (built by tools/narration.py from the curator's questions.json, else a draft from
   the piece's MoMu record, D3). Audio is pre-generated, so playback needs no API; it never autoplays. If a file is
   missing or fails, the browser's own voice reads the same text; with neither, the play button is hidden. The
   transcript is always on screen. */

const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const clock = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const ICON = {
  play: `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>`,
  pause: `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg>`,
};

export async function createStory({ img, name } = {}) {   // img(id): the piece's photo, which leads the sheet; name(id): its name everywhere else in the app
  let doc = { pieces: {} };
  try { doc = await (await fetch("narration.json")).json(); } catch { /* no stories: card scans work as before */ }
  const speech = "speechSynthesis" in window ? window.speechSynthesis : null;

  const el = document.createElement("dialog");
  el.className = "story"; el.setAttribute("aria-labelledby", "storyName");
  document.body.append(el);
  let stop = () => {};
  el.addEventListener("close", () => stop());
  el.addEventListener("click", e => {
    if (e.target.closest("[data-more]")) { el.querySelector(".transcript").classList.remove("clamp"); e.target.closest("[data-more]").remove(); return; }
    if (e.target === el || e.target.closest("[data-close]")) el.close();
  });

  function player(p) {
    const btn = el.querySelector("[data-play]"), bar = el.querySelector("progress"), time = el.querySelector("[data-time]");
    const label = el.querySelector("[data-voice]");
    const set = playing => {
      btn.innerHTML = playing ? ICON.pause : ICON.play;
      btn.setAttribute("aria-label", playing ? "Pause narration" : "Play narration");
      btn.setAttribute("aria-pressed", String(playing));
    };
    const hide = () => { el.querySelector(".player").hidden = true; };

    // Fallback: the phone's own voice reads the transcript (no progress, just play and stop)
    const browserVoice = () => {
      if (!speech) return hide();
      label.textContent = "Read by your phone's built-in voice";
      bar.hidden = true; time.hidden = true;
      let speaking = false;
      btn.onclick = () => {
        if (speaking) { speech.cancel(); return; }
        const u = new SpeechSynthesisUtterance(p.text);
        u.lang = p.lang || "en"; u.rate = 0.95;
        u.onend = u.onerror = () => { speaking = false; set(false); };
        speech.cancel(); speech.speak(u); speaking = true; set(true);
      };
      stop = () => speech.cancel();
    };

    set(false);
    if (!p.audio) return browserVoice();
    const audio = new Audio();
    audio.preload = "none";   // nothing downloads until the visitor asks for it
    audio.src = p.audio;
    if (p.seconds) time.textContent = `0:00 / ${clock(p.seconds)}`;
    audio.addEventListener("timeupdate", () => {
      const d = audio.duration || p.seconds || 0;
      bar.max = d || 1; bar.value = audio.currentTime;
      time.textContent = `${clock(audio.currentTime)} / ${clock(d)}`;
    });
    audio.addEventListener("play", () => set(true));
    audio.addEventListener("pause", () => set(false));
    audio.addEventListener("ended", () => { set(false); audio.currentTime = 0; });
    let wanted = false;   // the visitor pressed play: if the file fails, the phone's voice takes over on that same tap
    audio.addEventListener("error", () => {
      audio.removeAttribute("src"); browserVoice(); set(false);
      if (wanted) btn.onclick();
    }, { once: true });
    btn.onclick = () => {
      wanted = audio.paused;
      return audio.paused ? audio.play().catch(() => {}) : audio.pause();
    };
    stop = () => audio.pause();
  }

  function show(id, { found = false, next = "Continue", years = true } = {}) {   // years: false before Guess the year, so the story does not give it away
    const p = doc.pieces[id];
    if (!p) return Promise.resolve();
    // shortcut: drops the drafts' lead-in on screen only (the audio still says it); move it into tools/narration.py at the next audio run
    const paras = p.paragraphs.map(t => t.replace(/^The museum's record describes it like this: /, ""));
    const long = paras.join(" ").length > 140;   // past about 3 lines the sheet shows a teaser; the audio carries the rest
    el.innerHTML = `<div tabindex="-1" autofocus>
      ${img ? `<img class="pic" src="${img(id)}" alt="">` : ""}
      <div class="mono">${found ? "Found at MoMu" : "Story"} · ${esc(id)}</div>
      <h2 id="storyName">${esc(name?.(id) ?? p.title)}</h2>
      ${years && p.years ? `<p class="years">${esc(p.years)}</p>` : ""}
      ${p.draft ? `<p class="draft">From the MoMu record</p>` : ""}
      <div class="player">
        <button class="play press" data-play type="button"></button>
        <div class="meta">
          <progress value="0" max="1" aria-label="Narration progress"></progress>
          <div class="mono"><span data-voice></span> <span data-time></span></div>
        </div>
      </div>
      <div class="transcript${long ? " clamp" : ""}" aria-label="Transcript">${paras.map(t => `<p>${esc(t)}</p>`).join("")}</div>
      ${long ? `<button class="more press" data-more type="button">Read the whole story</button>` : ""}
      <div class="row"><button class="btn press" data-close type="button">${esc(next)}</button></div>
    </div>`;
    player(p);
    if (!years) el.querySelector(".player").hidden = true;   // the narration opens with the years
    if (!el.open) el.showModal();
    return new Promise(resolve => el.addEventListener("close", resolve, { once: true }));
  }

  return { has: id => !!doc.pieces[id], show };
}

/* After a card scan: story first, then the curator's questions (without repeating the story), then `next`. */
export async function showScan({ story, quiz, id, next, years }) {
  const hasQuiz = !!quiz?.has(id), hasStory = !!story?.has(id);
  if (hasStory) await story.show(id, { found: true, next: hasQuiz ? "Continue to the questions" : next, years });
  if (hasQuiz) await quiz.show(id, { found: !hasStory, next, story: !hasStory });
}
