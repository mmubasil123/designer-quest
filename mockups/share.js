/* B7 Share card: a 1080x1920 PNG of the current look. The form still is an extra frame from the Stage's own WebGL
   renderer at card size (no preserveDrawingBuffer: it is copied in the same task it is drawn). Names, ids and years
   come from pieces.json only (D3). The image is built, shared and dropped in the browser: no upload, no server, no
   tracking (D2). Phones that can share files get the share sheet, everything else gets a download. */

export const CARD_W = 1080, CARD_H = 1920;
const CREDIT = "Collection: MoMu Fashion Museum Antwerp";
// the canvas cannot read CSS variables per draw call cheaply, so these mirror theme.css (fonts and colour tokens): change both together
const SERIF = '"Source Serif 4", Georgia, serif', MONO = '"Hanken Grotesk", "Helvetica Neue", Arial, sans-serif';   // MONO: the small label face (was a mono)
const INK = "#000", MUTED = "#595959", LINE = "#cbcbcb", PAPER = "#fff", WALL = "#ededed", RED = "#d72f25";
const FOOT_Y = 1740;   // the credit block starts here; the form and the list share the space between the title and this line

const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/* What the card says about the look: the same pieces and years the Stage's "Spans N years" line counts. */
export function lookFacts(look, PIECES) {
  const main = look.full ? [["Dress", look.full]] : [["Top", look.top], ["Bottom", look.bottom]];
  const rows = [...main, ["Shoes", look.feet], ["Cloth", look.fabric.body], ["Sleeves", look.fabric.sleeves]]
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
export function drawCard({ grab, name, facts, url }) {
  const cv = document.createElement("canvas"); cv.width = CARD_W; cv.height = CARD_H;
  const ctx = cv.getContext("2d");
  const pad = 88;
  const wall = ctx.createLinearGradient(0, 0, 0, CARD_H);   // the Stage's wall: white at the top, gallery grey from 72%
  wall.addColorStop(0, PAPER); wall.addColorStop(.72, WALL); wall.addColorStop(1, WALL);
  ctx.fillStyle = wall; ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.textBaseline = "alphabetic"; ctx.fillStyle = INK;

  ctx.fillStyle = RED; ctx.font = `400 84px ${MONO}`;   // titles are red capitals, as in MoMu's template
  const lines = wrap(ctx, name.toUpperCase(), CARD_W - 2 * pad, 3);
  let y = 214;
  lines.forEach(l => { ctx.fillText(l, pad, y); y += 100; });

  const { oldest, newest, span } = facts;   // the span is a sentence, not a stat tile: the pitch line is "a 250-year look"
  ctx.font = `italic 400 52px ${SERIF}`; ctx.fillStyle = INK;
  const spanText = span ? `Worn across ${span} years` : oldest ? `All from ${oldest}` : "Years not recorded";
  ctx.fillText(spanText, pad, y + 20);
  if (span) { ctx.font = `500 28px ${MONO}`; ctx.fillStyle = MUTED; ctx.fillText(`${oldest} to ${newest}`, pad, y + 68); }

  const rowH = facts.rows.length > 3 ? 68 : 84, formY = y + 100, formH = Math.max(480, FOOT_Y - 24 - (facts.rows.length * rowH + 8) - formY);
  const still = grab(formH);
  if (still) ctx.drawImage(still, 0, formY, CARD_W, formH);

  ctx.strokeStyle = LINE; ctx.lineWidth = 2;
  let ry = formY + formH + 16;
  facts.rows.forEach(r => {
    ctx.beginPath(); ctx.moveTo(pad, ry); ctx.lineTo(CARD_W - pad, ry); ctx.stroke();
    ctx.font = `500 24px ${MONO}`; ctx.fillStyle = MUTED; ctx.textAlign = "left";
    ctx.fillText(r.role.toUpperCase(), pad, ry + rowH / 2 - 4);
    const right = r.year ? (r.to && r.to !== r.year ? `${r.year}–${r.to}` : `${r.year}`) : "not recorded";
    ctx.textAlign = "right"; ctx.fillText(right, CARD_W - pad, ry + rowH / 2 - 4);
    const rightW = ctx.measureText(right).width;
    ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `400 34px ${SERIF}`;
    ctx.fillText(fit(ctx, r.name, CARD_W - 2 * pad - 150 - rightW - 24), pad + 150, ry + rowH / 2 - 2);
    ctx.font = `400 22px ${MONO}`; ctx.fillStyle = MUTED;
    ctx.fillText(r.id, pad + 150, ry + rowH / 2 + 26);
    ry += rowH;
  });
  ctx.beginPath(); ctx.moveTo(pad, ry); ctx.lineTo(CARD_W - pad, ry); ctx.stroke();

  ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `400 38px ${SERIF}`;
  ctx.fillText(CREDIT, pad, FOOT_Y + 90);
  ctx.font = `400 26px ${MONO}`; ctx.fillStyle = MUTED;
  ctx.fillText("Made in Second Skin · " + fit(ctx, url, CARD_W - 2 * pad - 330), pad, FOOT_Y + 142);
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
    <h2 id="shareTitle">Your look, as a card</h2>
    <img class="share-img" id="shareImg" alt="" width="270" height="480">
    <p class="share-note" id="shareNote"></p>
    <div class="row"><button class="btn press" id="shareGo" hidden>Share</button><a class="btn ghost press" id="shareSave" download="second-skin-look.png">Download image</a></div>
    <button class="share-x press" data-close aria-label="Close">×</button>
  </div>`;
  document.body.append(el);
  const img = el.querySelector("#shareImg"), go = el.querySelector("#shareGo"), save = el.querySelector("#shareSave"), note = el.querySelector("#shareNote");
  let file = null;
  el.addEventListener("click", e => { if (e.target === el || e.target.closest("[data-close]")) el.close(); });
  el.addEventListener("close", () => { URL.revokeObjectURL(img.src); img.removeAttribute("src"); save.removeAttribute("href"); file = null; });
  go.addEventListener("click", async () => {
    if (!file) return;
    try { await navigator.share({ files: [file], title: "Second Skin" }); }
    catch (err) { if (err.name !== "AbortError") toast("Couldn't share from this browser, use Download"); }
  });
  save.addEventListener("click", () => toast("Saved to your downloads"));   // the link itself downloads the blob

  async function open() {
    try { await Promise.all(['400 34px "Source Serif 4"', 'italic 400 44px "Source Serif 4"', '400 84px "Hanken Grotesk"', '500 26px "Hanken Grotesk"', '400 26px "Hanken Grotesk"'].map(f => document.fonts.load(f))); } catch { /* system fonts */ }
    const facts = lookFacts(look, PIECES), name = getName();
    const url = location.host + location.pathname.replace(/\/(index|second-skin)\.html$/, "/");
    const canvas = drawCard({ grab: h => grabStill(tt, h), name, facts, url });
    const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
    if (!blob) { toast("Couldn't make the card in this browser"); return; }
    file = new File([blob], "second-skin-look.png", { type: "image/png" });
    img.src = URL.createObjectURL(file);
    img.alt = `Share card: ${name}, ${facts.span ? `${facts.span} years from ${facts.oldest} to ${facts.newest}` : "years as recorded"}, ${CREDIT}`;
    const canShare = !!navigator.canShare?.({ files: [file] });
    go.hidden = !canShare; save.href = img.src;
    save.classList.toggle("ghost", canShare);   // on a laptop, where nothing can share a file, Download is the main action
    note.textContent = "PNG, 1080 × 1920. It stays on your device.";
    if (!el.open) el.showModal();
  }
  return { open };
}
