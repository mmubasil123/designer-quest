/* H3 + H13: the piece's story with narration, shown after a card scan and before its questions (quiz.js).
   Text and audio come from narration.json (built by tools/narration.py). H13: the narration is a short spoken scene
   (`beats`), shown as captions that light up word by word as the voice reads them; the sheet opens with the piece's
   photo settling in, and the photo drifts slowly while the story plays. Before a Guess the year (`years: false`) the
   beats that name the date are left out and the narration ends on a `tease` instead. the curator's own text is shown word
   for word under "Read the story". Audio is pre-generated and never autoplays; if a file is missing or fails, the
   browser's own voice reads the same captions (its word boundaries drive the highlight). */

const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const clock = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const ICON = {
  play: `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>`,
  pause: `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg>`,
};
// Reading time of a word, in arbitrary units: its letters, plus the pause a voice leaves after punctuation
const weight = (word, beatEnd) => word.length + (/[.!?:]$/.test(word) ? 9 : /[,;]$/.test(word) ? 4 : 0) + (beatEnd ? 6 : 0);

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
    const more = e.target.closest("[data-more]");
    if (more) { toggle(more); return; }
    if (e.target === el || e.target.closest("[data-close]")) el.close();
  });

  function toggle(btn) {   // "Read the story": the whole caption text, and the curator's own story for her pieces
    const open = btn.getAttribute("aria-expanded") !== "true";
    btn.setAttribute("aria-expanded", String(open));
    btn.textContent = open ? "Show less" : "Read the story";
    el.querySelector(".captions").classList.toggle("clamp", !open);
    const rest = el.querySelector(".rest");
    if (rest) { rest.classList.toggle("open", open); rest.inert = !open; }
    if (open) el.querySelector(".tease")?.classList.add("show");
  }

  /* Captions: every word is a span with its place in the spoken text (for the browser voice's boundary events) and
     its start time as a share of the whole narration (for an audio file, which has no word timings). */
  function captions(p, guess) {
    const beats = p.form === "script" ? p.beats : p.paragraphs.map(t => ({ t }));
    const words = []; let total = 0, at = 0, cut = null;
    const beatStarts = [];
    const html = beats.map(b => {
      beatStarts.push(total);
      const parts = b.t.split(/\s+/);
      if (guess && b.reveal) { if (cut === null) cut = total; parts.forEach((w, i) => { total += weight(w, i === parts.length - 1); }); return ""; }
      const spans = parts.map((w, i) => {
        words.push({ at, start: total, beat: words.length && i === 0 });
        at += w.length + 1; total += weight(w, i === parts.length - 1);
        return `<span class="w">${esc(w)}</span>`;
      });
      return `<span class="beat">${spans.join(" ")}</span>`;
    }).join(" ");
    const spoken = beats.filter(b => !(guess && b.reveal)).map(b => b.t).join(" ");
    return { html, words, total, cut, spoken, beatStarts };
  }

  function player(p, cap, guess) {
    const btn = el.querySelector("[data-play]"), bar = el.querySelector("progress"), time = el.querySelector("[data-time]");
    const label = el.querySelector("[data-voice]"), box = el.querySelector(".captions");
    const spans = [...box.querySelectorAll(".w")];
    let lit = -1;
    const set = playing => {
      btn.innerHTML = playing ? ICON.pause : ICON.play;
      btn.setAttribute("aria-label", playing ? "Pause narration" : "Play narration");
      btn.setAttribute("aria-pressed", String(playing));
      el.classList.toggle("playing", playing);
      if (playing) box.classList.add("live");
    };
    const light = i => {   // words up to i are said; i is the one being said; the caption window follows its line
      if (i === lit) return;
      if (i < lit) spans.forEach(s => s.classList.remove("said", "now"));
      for (let k = Math.max(0, lit); k <= i && k < spans.length; k++) spans[k].classList.add("said");
      spans[lit]?.classList.remove("now"); spans[i]?.classList.add("now");
      lit = i;
      const s = spans[i];
      if (s && box.classList.contains("clamp")) {
        const top = s.offsetTop - box.clientHeight / 3;
        if (Math.abs(box.scrollTop - top) > s.offsetHeight) box.scrollTo({ top: Math.max(0, top), behavior: reduced() ? "auto" : "smooth" });
        box.classList.toggle("scrolled", top > 0);   // a soft top edge once lines have scrolled away
      }
    };
    const finish = () => {   // after the last word: captions back to plain reading, from the top
      set(false); box.classList.remove("live"); spans.forEach(s => s.classList.remove("said", "now")); lit = -1;
      if (box.classList.contains("clamp")) box.scrollTo({ top: 0 });
      box.classList.remove("scrolled");
      if (guess) el.querySelector(".tease")?.classList.add("show");
    };
    const hide = () => { el.querySelector(".player").hidden = true; };
    const indexAt = share => { let i = -1; while (i + 1 < cap.words.length && cap.words[i + 1].start <= share) i++; return i; };
    /* With measured beat starts (`cues`), each beat's words are spread over that beat's own time; without them, over
       the whole file by word length (an estimate that drifts a little on long stories). */
    const beatStarts = cap.beatStarts;
    const shareAt = (t, d) => {
      if (!p.cues || p.cues.length !== beatStarts.length) return (t + 0.15) / d * cap.total;
      let k = 0; while (k + 1 < p.cues.length && p.cues[k + 1] <= t) k++;
      const t0 = p.cues[k], t1 = p.cues[k + 1] ?? d, w0 = beatStarts[k], w1 = beatStarts[k + 1] ?? cap.total;
      return w0 + Math.min(1, Math.max(0, (t - t0 + 0.1) / Math.max(0.1, t1 - t0))) * (w1 - w0);
    };

    // Fallback: the phone's own voice reads the captions; its word boundaries drive the highlight (estimated if it sends none)
    const browserVoice = () => {
      if (!speech) return hide();
      label.textContent = "Read by your phone's built-in voice";
      bar.hidden = true; time.hidden = true;
      let speaking = false, raf = 0;
      btn.onclick = () => {
        if (speaking) { speech.cancel(); return; }
        const u = new SpeechSynthesisUtterance(cap.spoken);
        u.lang = p.lang || "en"; u.rate = 0.95;
        let bounded = false; const t0 = performance.now(), cps = 13.5 * u.rate;   // about 13.5 characters a second at rate 1
        u.onboundary = e => { if (e.name !== "word") return; bounded = true; let i = -1; while (i + 1 < cap.words.length && cap.words[i + 1].at <= e.charIndex) i++; light(i); };
        const tick = () => { if (!bounded) { const c = (performance.now() - t0) / 1000 * cps; let i = -1; while (i + 1 < cap.words.length && cap.words[i + 1].at <= c) i++; light(i); } raf = requestAnimationFrame(tick); };
        u.onend = u.onerror = () => { cancelAnimationFrame(raf); speaking = false; finish(); };
        speech.cancel(); speech.speak(u); speaking = true; set(true); raf = requestAnimationFrame(tick);
      };
      stop = () => speech.cancel();
    };

    set(false);
    if (!p.audio) return browserVoice();
    const audio = new Audio();
    audio.preload = "none";   // nothing downloads until the visitor asks for it
    audio.src = p.audio;
    const length = () => audio.duration || p.seconds || 0;
    // before a guess the file plays only up to the first beat that names the date (cue from the import, else estimated)
    const stopAt = () => guess && cap.cut !== null ? (p.revealAt ?? cap.cut / cap.total * length() - 0.3) : Infinity;
    if (p.seconds) time.textContent = `0:00 / ${clock(guess && cap.cut !== null ? (p.revealAt ?? cap.cut / cap.total * p.seconds) : p.seconds)}`;
    let raf = 0;
    const tick = () => {
      const d = length(), t = audio.currentTime, end = Math.min(d, stopAt());
      bar.max = end || 1; bar.value = t;
      time.textContent = `${clock(t)} / ${clock(end || 0)}`;
      if (d) light(indexAt(shareAt(t, d)));
      if (t >= end) { audio.pause(); audio.currentTime = 0; finish(); return; }
      if (!audio.paused) raf = requestAnimationFrame(tick);
    };
    audio.addEventListener("play", () => { set(true); raf = requestAnimationFrame(tick); });
    audio.addEventListener("pause", () => { cancelAnimationFrame(raf); if (audio.currentTime) set(false); });
    audio.addEventListener("ended", () => { cancelAnimationFrame(raf); audio.currentTime = 0; finish(); });
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
    const guess = !years;
    const cap = captions(p, guess);
    const curator = p.source === "curator" && p.form === "script" ? p.paragraphs : null;   // her own words, never changed
    const seconds = p.seconds || Math.max(25, cap.total / 14);   // the photo drifts for about as long as the story lasts
    let i = 0; const n = () => `style="--i:${i++}"`;   // stagger order for the opening
    el.innerHTML = `<div tabindex="-1" autofocus>
      ${img ? `<figure class="pic"><img src="${img(id)}" alt="" style="--drift:${seconds}s"></figure>` : ""}
      <div class="mono rise" ${n()}>${found ? "Found in the museum" : "Story"} · ${esc(id)}</div>
      <h2 id="storyName" class="rise" ${n()}>${esc(name?.(id) ?? p.title)}</h2>
      ${years && p.years ? `<p class="years rise" ${n()}>${esc(p.years)}</p>` : ""}
      ${p.draft ? `<p class="draft rise" ${n()}>Told from the MoMu record</p>` : ""}
      <div class="player rise" ${n()}>
        <button class="play press" data-play type="button"></button>
        <div class="meta">
          <progress value="0" max="1" aria-label="Narration progress"></progress>
          <div class="mono"><span data-voice></span> <span data-time></span></div>
        </div>
      </div>
      <div class="captions clamp rise" ${n()} aria-label="Narration text">${cap.html}</div>
      ${guess && p.tease ? `<p class="tease rise" ${n()}>${esc(p.tease)}</p>` : ""}
      ${curator ? `<div class="rest" id="storyRest" inert><div><h3 class="more-title">More about this piece</h3>${curator.map(t => `<p>${esc(t)}</p>`).join("")}</div></div>` : ""}
      <button class="more press rise" ${n()} data-more type="button" aria-expanded="false" ${curator ? `aria-controls="storyRest"` : ""}>Read the story</button>
      <div class="row rise" ${n()}><button class="btn press" data-close type="button">${esc(next)}</button></div>
    </div>`;
    player(p, cap, guess);
    if (!el.open) el.showModal();
    const box = el.querySelector(".captions");
    if (!curator && box.scrollHeight <= box.clientHeight + 2) { box.classList.remove("clamp"); el.querySelector("[data-more]").remove(); }   // it all fits: nothing to open
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
