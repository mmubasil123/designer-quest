/* D-3 language layer: NL / EN / FR. One module every screen reads from; no screen translates anything itself.

   Two kinds of text:
   - UI strings (buttons, labels, toasts): written in English in the code and wrapped in t("English text", {vars}).
     The English text is the key, so a string nobody has translated yet simply shows in English. NL and FR live in
     i18n/ui.nl.json and i18n/ui.fr.json (key = the English string). To add a string: wrap it in t(), add one line to
     each file. Static markup needs no wrapping: localize(root) swaps any text node, aria-label, title, placeholder
     or alt whose whole text is a key.
   - Facts and stories (MoMu records, the curator's stories and questions): translated at BUILD time by
     tools/i18n_build.py into i18n/content.<lang>.json, keyed by what the text is (e.g. "rec:ST503:quote") and stamped
     with a hash of the source text. tc() only returns a translation whose hash still matches the source; a changed
     source shows the original until the script is rerun. Nothing is translated at runtime and nothing is sent anywhere.
   Every item returned by tc() says whether it is a translation, so the screen can show the "Translation" label.

   Language: the saved choice (field `lang` in the shared save, localStorage "secondSkin.save.v1"), else the browser's
   language if it is nl, en or fr, else English. Switching reloads the page (the look is already saved), so every screen
   renders once, in one language. Narration audio is English only for now. */

export const LANGS = ["nl", "en", "fr"];
export const NAMES = { nl: "Nederlands", en: "English", fr: "Français" };
const SAVE_KEY = "secondSkin.save.v1";   // shared with second-skin.html; `lang` is an optional extra field

const readSaved = () => { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || "null")?.lang; } catch { return undefined; } };
function pick() {
  const saved = readSaved();
  if (LANGS.includes(saved)) return saved;
  for (const l of navigator.languages || [navigator.language]) {
    const short = String(l).toLowerCase().slice(0, 2);
    if (LANGS.includes(short)) return short;
  }
  return "en";
}
export const lang = pick();

const getJson = async url => { try { const r = await fetch(url); return r.ok ? await r.json() : {}; } catch { return {}; } };
const [ui, content] = await Promise.all([
  lang === "en" ? {} : getJson(`i18n/ui.${lang}.json`),
  getJson(`i18n/content.${lang}.json`),
]);
document.documentElement.lang = lang;

/* UI string: English key in, this language out; {name} placeholders filled from vars. */
export function t(en, vars) {
  let s = ui[en] ?? en;
  if (vars) for (const k in vars) s = s.replaceAll(`{${k}}`, vars[k]);
  return s;
}

/* FNV-1a 32-bit over the UTF-8 of the whitespace-normalised text; tools/i18n_build.py computes the same. */
export function hash(text) {
  let h = 0x811c9dc5;
  for (const b of new TextEncoder().encode(String(text).normalize("NFC").replace(/\s+/g, " ").trim())) { h ^= b; h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, "0");
}

/* Content text. key: what it is; source: the text as the record or the curator wrote it; from: its language.
   Returns { text, tr } where tr is true when text is our machine translation (show the label). */
export function tc(key, source, from) {
  if (!source || from === lang) return { text: source ?? "", tr: false };
  const e = content[key];
  if (e && e.h === hash(source)) return { text: e.t, tr: true, by: e.by };
  return { text: source, tr: false, missing: true };   // not translated yet (or the source changed): the original, never a stale translation
}

/* "1750 to 1780" (as narration.json writes it) in this language. */
export const years = s => String(s).replace(/(\d{3,4}) to (\d{3,4})/, (_, a, b) => t("{a} to {b}", { a, b }));

/* A Dutch record passage (an Ask quote) in this language: the translated sentences of the description it overlaps. */
export function tcQuote(id, quote) {
  const q = String(quote).replace(/\s+/g, " ").trim();
  const hits = Object.entries(content).filter(([k, e]) => k.startsWith(`rec:${id}:desc:`) && e.s && e.h === hash(e.s) && (e.s.includes(q) || q.includes(e.s)));
  return hits.length ? { text: hits.sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })).map(([, e]) => e.t).join(" "), tr: true } : null;
}

/* A piece's display name: the team's English name from pieces.json in this language (build-time, i18n/content). */
export const pieceName = (id, en) => { const x = tc(`name:${id}`, en, "en").text; return x[0].toUpperCase() + x.slice(1); };

export const labelText = () => t("Translation");
/* The small label beside every translated fact or story (UI strings need none). */
export const labelHtml = () => `<span class="tr-label" title="${t("Translated by a machine; the original stays one tap away")}">${labelText()}</span>`;

/* Swap static English text for this language: text nodes and a few attributes whose whole text is a UI key. */
const ATTRS = ["aria-label", "title", "placeholder", "alt"];
export function localize(root = document.body) {
  if (lang === "en") return root;
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => /^(SCRIPT|STYLE)$/.test(n.parentElement?.tagName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  for (let n; (n = walk.nextNode());) {
    const s = n.nodeValue.trim();
    if (s && ui[s]) n.nodeValue = n.nodeValue.replace(s, ui[s]);
  }
  for (const el of root.querySelectorAll("*")) for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (v && ui[v.trim()]) el.setAttribute(a, ui[v.trim()]);
  }
  return root;
}

export function setLang(next) {
  if (!LANGS.includes(next) || next === lang) return;
  try {
    const old = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...(old && typeof old === "object" ? old : {}), lang: next }));
  } catch { /* storage blocked: the choice lasts only until the page is left; the browser language applies again */ }
  location.reload();
}

/* The switch: three small buttons (NL EN FR). Self-contained, so it can sit in any bar or sheet; style it in i18n.css. */
export function mountSwitch(into, { className = "" } = {}) {
  const el = document.createElement("div");
  el.className = `langsw ${className}`.trim();
  el.setAttribute("role", "group"); el.setAttribute("aria-label", t("Language"));
  el.innerHTML = LANGS.map(l => `<button type="button" class="press" lang="${l}" data-lang="${l}" aria-pressed="${l === lang}" aria-label="${NAMES[l]}">${l.toUpperCase()}</button>`).join("");
  el.addEventListener("click", e => { const b = e.target.closest("[data-lang]"); if (b) setLang(b.dataset.lang); });
  into.append(el);
  return el;
}

{   // the label and switch styles load with the module, so a page needs no extra <link>
  const l = document.createElement("link"); l.rel = "stylesheet"; l.href = new URL("i18n.css", import.meta.url).href;
  document.head.append(l);
}
if (document.readyState === "loading") addEventListener("DOMContentLoaded", () => localize(), { once: true }); else localize();
