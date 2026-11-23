/* B7 Share card: a 1080x1920 PNG of the current look. The form still is an extra frame from the Stage's own WebGL
   renderer at card size (no preserveDrawingBuffer: it is copied in the same task it is drawn). Names, ids and years
   come from pieces.json only (D3). The image is built, shared and dropped in the browser: no upload, no server, no
   tracking (D2). Phones that can share files get the share sheet, everything else gets a download. */

import { eraOf } from "./scenes.js";
import { t, tc, lang, labelText } from "./i18n.js";   // D-3
/* H12 personal card: the visitor may type a name (kept in this browser only, never sent anywhere, D2). The card shows their
   look in the period room of its middle year (scenes.js), the pieces they wear, the pieces they won, and one line from a worn
   piece's story (narration.json: the curator's text, else a sentence of the MoMu record, D3). */
const NAME_KEY = "atelier.name.v1", WON_KEY = "atelier.won.v1";
const cleanName = x => String(x || "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 20);
const readName = () => { try { return cleanName(localStorage.getItem(NAME_KEY)); } catch { return ""; } };
const writeName = n => { try { n ? localStorage.setItem(NAME_KEY, n) : localStorage.removeItem(NAME_KEY); } catch { /* blocked: the name lasts this visit */ } };
const readWon = () => { try { const w = JSON.parse(localStorage.getItem(WON_KEY) || "[]"); return Array.isArray(w) ? w : []; } catch { return []; } };
const loadImg = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });

export function cardTitle(name, facts, fallback) {
  if (name) return facts.span ? t("{name}'s look across {n} years", { name, n: facts.span }) : t("{name}'s look", { name });
  return facts.span ? t("A look across {n} years", { n: facts.span }) : fallback;
}

/* One line from the story of a worn piece. Prefer the curator's own text; a record draft gives its first sentence of the record;
   an H13 narration script (form "script", facts from the record but our words) is credited to the piece, not to the record. */
export function pickQuote(facts, stories) {
  const worn = facts.rows.filter(r => stories?.[r.id]);
  worn.sort((a, b) => (stories[a.id].source === "curator" ? 0 : 1) - (stories[b.id].source === "curator" ? 0 : 1) || (a.year ?? 9999) - (b.year ?? 9999));
  for (const r of worn) {
    const s = stories[r.id];
    let src = s.paragraphs?.[0] || "", by = null;
    if (lang !== "en") {   // D-3: the story in the card's language, as story.js shows it, and marked as a translation; never English on a NL/FR card
      const parts = s.form === "script" && s.beats?.length ? s.beats.map((b, n) => tc(`narr:${r.id}:${n}`, b.t, "en")) : [tc(`q:${r.id}:story:0`, src, "en")];
      if (!parts.every(x => x.tr)) continue;
      src = parts.map(x => x.text).join(" "); by = parts[0].by;
    }
    let q = src.replace(/^The museum's record describes it like this:\s*/, "").replace(/\s*\n\s*/g, " ").trim();   // line breaks joined
    const m = q.match(/^(.{40,170}?[.!?])(\s|$)/);
    q = m ? m[1] : q.length > 170 ? q.slice(0, 170).replace(/\s*\S*$/, "") + "…" : q;
    if (q.length < 20) continue;
    const yrs = r.year ? (r.to && r.to !== r.year ? `${r.year}–${r.to}` : `${r.year}`) : "";
    const credit = s.source === "curator" || s.form === "script" ? `${r.name}${yrs ? ", " + yrs : ""}` : t("MoMu's record of the {name}", { name: r.name.toLowerCase() });
    return { text: q, by: lang !== "en" ? `${credit} · ${labelText(by)}` : credit };
  }
  return null;
}

export const CARD_W = 1080, CARD_H = 1920;
const CREDIT = () => t("Collection: MoMu Fashion Museum Antwerp");
// MoMu's official logo, the two polygons of momu.be's large logo (x 0..534, y 0..120); drawn stretched to 1.786:1 like
// assets/brand/momu-logo.svg and momu.be's header
const MOMU_LOGO = [
  [247.449335, 0, 132.331383, 115.359336, 12.7377802, 0, 0, 0, 0, 120, 68.4655685, 120, 68.4655685, 56.4509346, 133.794221, 120, 196.889009, 120, 260.934378, 56.4509346, 260.934378, 120, 264, 120, 264, 0],
  [517.451645, 0, 402.326108, 115.359336, 282.738035, 0, 270, 0, 270, 120, 338.464298, 120, 338.464298, 56.4509346, 403.794257, 120, 466.890307, 120, 530.939597, 56.4509346, 530.939597, 120, 534, 120, 534, 0],
];
const MOMU_RATIO = 534 / 299;
// the canvas cannot read CSS variables per draw call cheaply, so these mirror theme.css (fonts and colour tokens): change both together
const SERIF = '"Source Serif 4", Georgia, serif', MONO = '"Hanken Grotesk", "Helvetica Neue", Arial, sans-serif';   // MONO: the small label face (was a mono)
const INK = "#000", MUTED = "#595959", LINE = "#cbcbcb", PAPER = "#fff", WALL = "#ededed", RED = "#d72f25";
const FOOT_Y = 1740;   // the credit block starts here; the form and the list share the space between the title and this line

const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/* What the card says about the look: the same pieces and years the Stage's "Spans N years" line counts. */
export function lookFacts(look, PIECES) {
  const main = look.full ? [["Dress", look.full]] : [["Top", look.top], ["Bottom", look.bottom]];
  // as on the Stage: a piece's own fabric on its own cut is the original, not a remix, and one fabric on body and
  // sleeves is one row (a won study piece worn alone used to fill Dress, Cloth and Sleeves with the same name)
  const cut = look.full || look.top, { body, sleeves } = look.fabric;
  const own = f => f && f !== cut ? f : null;
  const cloth = own(body) && own(body) === own(sleeves) ? [["Cloth", own(body)]] : [["Cloth", own(body)], ["Sleeves", own(sleeves)]];
  const rows = [...main, ["Shoes", look.feet], ...cloth]
    .filter(([, id]) => id && PIECES[id])
    .map(([role, id]) => ({ role, id, name: PIECES[id].name, year: PIECES[id].year?.from ?? null, to: PIECES[id].year?.to ?? null }));
  const years = rows.map(r => r.year).filter(Boolean);
  const oldest = years.length ? Math.min(...years) : null, newest = years.length ? Math.max(...years) : null;
  return { rows, oldest, newest, span: years.length > 1 ? newest - oldest : 0 };
}

function wrap(ctx, text, maxW, maxLines) {   // greedy word wrap; the last line gets an ellipsis if it still overflows
  const words = text.split(" "), lines = [];
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width <= maxW || !line) line = t; else { lines.push(line); line = w; }
  }
  lines.push(line);
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, "") + "…"; }
  return lines;
}
function fit(ctx, text, maxW) {   // one line, cut with an ellipsis
  if (ctx.measureText(text).width <= maxW) return text;
  while (text.length > 1 && ctx.measureText(text + "…").width > maxW) text = text.slice(0, -1);
  return text.trimEnd() + "…";
}

/* Draw the card. grab(height) returns a CARD_W x height canvas with the form (or null without WebGL). The form takes the
   height left between the title and the piece list, so a short name and few pieces give a bigger form. */
export function drawCard({ grab, name, facts, url, scene, quote, won, kicker }) {
  const cv = document.createElement("canvas"); cv.width = CARD_W; cv.height = CARD_H;
  const ctx = cv.getContext("2d");
  const pad = 88;
  const wall = ctx.createLinearGradient(0, 0, 0, CARD_H);   // the Stage's wall: white at the top, gallery grey from 72%
  wall.addColorStop(0, PAPER); wall.addColorStop(.72, WALL); wall.addColorStop(1, WALL);
  ctx.fillStyle = wall; ctx.fillRect(0, 0, CARD_W, CARD_H);
  if (scene) {   // the period room of the look, as behind the Stage (H7); paper under the title keeps the red capitals at AA
    ctx.drawImage(scene, 0, 0, CARD_W, CARD_H);
    const clear = ctx.createLinearGradient(0, 0, 0, 520);   // reaches below the masthead, title and span line
    clear.addColorStop(0, PAPER); clear.addColorStop(.62, PAPER); clear.addColorStop(1, "rgb(255 255 255 / 0)");
    ctx.fillStyle = clear; ctx.fillRect(0, 0, CARD_W, 520);
  }
  // H10 masthead: MoMu's official logo (assets/brand/momu-logo.svg) top left on the text's own edge, at momu.be's 1.786:1
  // shape and large enough (160 px) that its hairlines hold. The date sits right, on the logo's foot.
  const logoH = 104, logoW = logoH * MOMU_RATIO, logoTop = 72, foot = logoTop + logoH;
  ctx.save(); ctx.translate(pad, logoTop); ctx.scale(logoW / 534, logoH / 120); ctx.fillStyle = INK;
  for (const pts of MOMU_LOGO) { ctx.beginPath(); for (let i = 0; i < pts.length; i += 2) ctx[i ? "lineTo" : "moveTo"](pts[i], pts[i + 1]); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  ctx.textBaseline = "alphabetic"; ctx.fillStyle = MUTED; ctx.font = `500 24px ${MONO}`; ctx.textAlign = "right";
  ctx.fillText(fit(ctx, kicker.toUpperCase(), CARD_W - 2 * pad - logoW - 40), CARD_W - pad, foot); ctx.textAlign = "left";

  // H26: the garment is the point of the card, so the heading is small: one line of red capitals, shrunk to fit down to
  // 44 px; a name too long even for that (or a long word) wraps to at most two lines at 48 px
  ctx.fillStyle = RED;
  const up = name.toUpperCase(), inner = CARD_W - 2 * pad;
  let size = 64;
  const setT = px => { size = px; ctx.font = `400 ${px}px ${MONO}`; };
  setT(64);
  while (size > 44 && ctx.measureText(up).width > inner) setT(size - 2);
  let lines;
  if (ctx.measureText(up).width <= inner) lines = [up];
  else {
    setT(48);
    const widest = Math.max(...up.split(" ").map(w => ctx.measureText(w).width));
    if (widest > inner) setT(Math.max(36, Math.floor(48 * inner / widest)));
    lines = wrap(ctx, up, inner, 2);
  }
  const lead = Math.round(size * 1.16);
  let y = foot + 48 + Math.round(size * .74);   // about 48 px from the logo's foot to the title's top
  lines.forEach(l => { ctx.fillText(l, pad, y); y += lead; });

  const { oldest, newest, span } = facts;   // the span is a sentence, not a stat tile
  ctx.font = `italic 400 36px ${SERIF}`; ctx.fillStyle = INK;
  const spanText = span ? t("From {a} to {b}", { a: oldest, b: newest }) : oldest ? t("All from {year}", { year: oldest }) : t("Years not recorded");
  ctx.fillText(spanText, pad, y + 2);

  const rows = [...facts.rows];
  if (won.length) rows.push({ role: t("Won"), name: won.join(", "), id: "", year: null, to: null, right: "" });
  const rowH = rows.length > 3 ? 68 : 84, formY = y + 20;
  const quoteLines = quote ? (ctx.font = `italic 400 34px ${SERIF}`, wrap(ctx, `“${quote.text}”`, CARD_W - 2 * pad - 34, 3)) : [];
  const blockH = quote ? quoteLines.length * 46 + 74 : 0;
  const formH = Math.max(420, FOOT_Y - 24 - (rows.length * rowH + 8) - blockH - formY);
  const still = grab(formH);
  if (still) ctx.drawImage(still, 0, formY, CARD_W, formH);

  if (scene) { ctx.fillStyle = "rgb(255 255 255 / .9)"; ctx.fillRect(0, formY + formH + 4, CARD_W, CARD_H); }   // the list and credit sit on paper, not on the room
  ctx.strokeStyle = LINE; ctx.lineWidth = 2;
  let ry = formY + formH + 16;
  rows.forEach(r => {
    ctx.beginPath(); ctx.moveTo(pad, ry); ctx.lineTo(CARD_W - pad, ry); ctx.stroke();
    ctx.font = `500 24px ${MONO}`; ctx.fillStyle = MUTED; ctx.textAlign = "left";
    ctx.fillText(t(r.role).toUpperCase(), pad, ry + rowH / 2 - 4);
    const right = r.right ?? (r.year ? (r.to && r.to !== r.year ? `${r.year}–${r.to}` : `${r.year}`) : t("not recorded"));
    ctx.textAlign = "right"; ctx.fillText(right, CARD_W - pad, ry + rowH / 2 - 4);
    const rightW = ctx.measureText(right).width;
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `400 34px ${SERIF}`;
    ctx.fillText(fit(ctx, r.name, CARD_W - 2 * pad - 150 - rightW - 24), pad + 150, ry + rowH / 2 - (r.id ? 2 : -8));
    if (r.id) { ctx.font = `400 22px ${MONO}`; ctx.fillStyle = MUTED; ctx.fillText(r.id, pad + 150, ry + rowH / 2 + 26); }
    ry += rowH;
  });
  ctx.beginPath(); ctx.moveTo(pad, ry); ctx.lineTo(CARD_W - pad, ry); ctx.stroke();

  if (quote) {   // one line from the story of a piece they wear
    let qy = ry + 52;
    ctx.fillStyle = RED; ctx.fillRect(pad, qy - 32, 6, quoteLines.length * 46 + 4);
    ctx.fillStyle = INK; ctx.font = `italic 400 34px ${SERIF}`;
    quoteLines.forEach(l => { ctx.fillText(l, pad + 34, qy); qy += 46; });
    ctx.font = `500 22px ${MONO}`; ctx.fillStyle = MUTED;
    ctx.fillText(fit(ctx, quote.by.toUpperCase(), CARD_W - 2 * pad - 34), pad + 34, qy + 6);
  }

  ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `400 38px ${SERIF}`;
  ctx.fillText(CREDIT(), pad, FOOT_Y + 90);
  ctx.font = `400 26px ${MONO}`; ctx.fillStyle = MUTED;
  ctx.fillText(fit(ctx, url, CARD_W - 2 * pad), pad, FOOT_Y + 142);
  return cv;
}

/* A still of the stage form at card size: the whole form (zoom 1), the current angle, transparent so the wall shows.
   The renderer is resized, drawn and copied in one task, so nothing is painted at the odd size; resize() restores it. */
export function grabStill(tt, h) {
  const r = tt.renderer, cam = tt.camera, { zoom, focusY, onScreen } = tt;
  try {
    tt.onScreen = true;
    tt.setZoom(1);
    r.setPixelRatio(1); r.setSize(CARD_W, h, false);
    cam.clearViewOffset();   // H21's stage-wide view offset would squash and shift the look on the card; resize() below puts it back
    cam.aspect = CARD_W / h; cam.updateProjectionMatrix();
    tt.render();
    const out = document.createElement("canvas"); out.width = CARD_W; out.height = h;
    out.getContext("2d").drawImage(r.domElement, 0, 0);
    return out;
  } catch { return null; }   // no WebGL frame: the card still carries the facts
  finally { tt.onScreen = onScreen; tt.setZoom(zoom, 0, focusY); tt.resize(); }
}

export function createShare({ tt, look, PIECES, getName, toast }) {
  const el = document.createElement("dialog");
  el.className = "share"; el.setAttribute("aria-labelledby", "shareTitle");
  el.innerHTML = `<div class="share-in">
    <h2 id="shareTitle">${t("Your look, as a card")}</h2>
    <label class="share-name"><span>${t("Your name")} <i>${t("(optional)")}</i></span><input id="shareName" type="text" maxlength="20" autocomplete="off" autocapitalize="words" spellcheck="false" enterkeyhint="done" placeholder="${t("Put your name on it")}"></label>
    <img class="share-img" id="shareImg" alt="" width="270" height="480">
    <p class="share-note" id="shareNote"></p>
    <div class="row"><button class="btn press" id="shareGo" hidden>${t("Share")}</button><a class="btn ghost press" id="shareSave" download="momu-look.png">${t("Download image")}</a></div>
    <button class="share-x press" data-close aria-label="${t("Close")}" autofocus>×</button>
  </div>`;
  document.body.append(el);
  const img = el.querySelector("#shareImg"), go = el.querySelector("#shareGo"), save = el.querySelector("#shareSave"), note = el.querySelector("#shareNote"), input = el.querySelector("#shareName");
  let file = null, stories = null, run = 0, timer = 0;
  el.addEventListener("click", e => { if (e.target === el || e.target.closest("[data-close]")) el.close(); });
  el.addEventListener("close", () => { clearTimeout(timer); run++; URL.revokeObjectURL(img.src); img.removeAttribute("src"); save.removeAttribute("href"); file = null; });
  go.addEventListener("click", async () => {
    if (!file) return;
    try { await navigator.share({ files: [file], title: t("My Designer Quest look") }); }
    catch (err) { if (err.name !== "AbortError") toast(t("Couldn't share from this browser, use Download")); }
  });
  save.addEventListener("click", () => toast(t("Saved to your downloads")));   // the link itself downloads the blob
  input.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(render, 400); });   // the card follows the typing, once the hand pauses
  input.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); clearTimeout(timer); render(); input.blur(); } });
  input.addEventListener("change", () => { clearTimeout(timer); render(); });

  async function render() {
    const mine = ++run, name = cleanName(input.value);
    writeName(name);
    const facts = lookFacts(look, PIECES);
    if (!stories) stories = await fetch("narration.json").then(r => r.json()).then(j => j.pieces || {}).catch(() => ({}));   // same-origin file; a miss only drops the quote
    const era = eraOf(facts.oldest ? { from: facts.oldest, to: facts.newest } : null);
    const scene = await loadImg(`assets/scenes/${era}.svg`);
    if (mine !== run) return;   // a newer keystroke or a close took over
    const wornIds = new Set(facts.rows.map(r => r.id));
    // every museum win: wearables (Win it) and study fabrics (Up close); PIECES already holds both as unlocked room pieces
    const won = [...new Set([...readWon(), ...Object.keys(PIECES)])].filter(id => PIECES[id]?.room && !PIECES[id].locked && !wornIds.has(id)).map(id => PIECES[id].name);
    const shown = won.length > 2 ? [...won.slice(0, 2), t("+{n} more", { n: won.length - 2 })] : won;
    const title = cardTitle(name, facts, getName());
    const kicker = "Designer Quest · " + new Date().toLocaleDateString({ nl: "nl-BE", fr: "fr-BE" }[lang] || "en-GB", { day: "numeric", month: "long", year: "numeric" });
    const url = location.host + location.pathname.replace(/\/(index|atelier)\.html$/, "/");
    const canvas = drawCard({ grab: h => grabStill(tt, h), name: title, facts, url, scene, quote: pickQuote(facts, stories), won: shown, kicker });
    const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
    if (mine !== run) return;
    if (!blob) { toast(t("Couldn't make the card in this browser")); return; }
    URL.revokeObjectURL(img.src);
    file = new File([blob], "momu-look.png", { type: "image/png" });
    img.src = URL.createObjectURL(file);
    img.alt = `${t("Share card:")} ${title}, ${facts.span ? t("from {a} to {b}", { a: facts.oldest, b: facts.newest }) : t("years as recorded")}, ${CREDIT()}`;
    const canShare = !!navigator.canShare?.({ files: [file] });
    go.hidden = !canShare; save.href = img.src;
    save.classList.toggle("ghost", canShare);   // on a laptop, where nothing can share a file, Download is the main action
    note.textContent = t("PNG, 1080 × 1920. Your name stays on this device.");
    if (!el.open) el.showModal();
  }
  async function open() {
    try { await Promise.all(['400 34px "Source Serif 4"', 'italic 400 34px "Source Serif 4"', '400 84px "Hanken Grotesk"', '500 26px "Hanken Grotesk"', '400 26px "Hanken Grotesk"'].map(f => document.fonts.load(f))); } catch { /* system fonts */ }
    input.value = readName();
    await render();
  }
  return { open };
}
