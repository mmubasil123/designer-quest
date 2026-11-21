/* H2 Ask the archive eval. Runs every case in cases.json through the same askModel() the function uses, checks it,
   and writes results-<model>.json plus RESULTS.md for the curator's review. Without a key it runs only the offline checks
   (cases are sound against the records, the grounding guard drops invented fields and quotes, fallback answers).
   Run from mockups/: npm run eval:ask   (ASK_MODEL=claude-sonnet-5-5 npm run eval:ask to compare models) */
import { readFileSync, writeFileSync } from "node:fs";
import RECORDS from "../../ask-records.json" with { type: "json" };
import { NOT_RECORDED, checkAnswer, fieldAnswer, suggestions } from "../../ask-core.js";

const here = new URL(".", import.meta.url);
const { cases } = JSON.parse(readFileSync(new URL("cases.json", here), "utf8"));
const low = s => s.toLowerCase();
let offlineFail = 0;
const ok = (cond, msg) => { if (!cond) { offlineFail++; console.log(`  FAIL ${msg}`); } };

/* 1. Offline checks: no key, no network. */
console.log("Offline checks");
for (const c of cases) {
  ok(RECORDS[c.piece], `${c.piece}: no record`);
  const text = low(JSON.stringify(RECORDS[c.piece]));
  if (c.expect === "answer") {
    ok(c.fields.some(k => RECORDS[c.piece].fields.some(f => f.key === k)), `${c.piece} "${c.q}": expected field not in record`);
    ok(c.include.some(w => text.includes(low(w))),
      `${c.piece} "${c.q}": no include term is in the record`);
  }
}
const rec = RECORDS.ST81190;
ok(checkAnswer(rec, { answerable: true, answer: "Made in Antwerp.", fields: ["place"], quote: "" }).answer === NOT_RECORDED,
  "guard: an answer citing a field the record lacks must become not recorded");
ok(checkAnswer(rec, { answerable: true, answer: "Grey wool.", fields: ["description"], quote: "invented words" }).quote === "",
  "guard: a quote not in the record must be dropped");
ok(checkAnswer(rec, { answerable: true, answer: "Grey wool.", fields: ["description"], quote: "grijs wolweefsel" }).quote === "grijs wolweefsel",
  "guard: a verbatim quote must be kept");
for (const id of Object.keys(RECORDS)) {
  const s = suggestions(RECORDS[id]);
  ok(s.length >= 1, `${id}: no suggested question`);
  for (const { key } of s) ok(fieldAnswer(RECORDS[id], key).answerable, `${id}: fallback for ${key} empty`);
}
console.log(offlineFail ? `${offlineFail} offline check(s) failed` : "all offline checks passed");

/* 2. Model run. */
if (!process.env.ANTHROPIC_API_KEY && !(process.env.ASK_API_KEY && process.env.ASK_MODEL)) {
  console.log("\nNo model key: model cases skipped. Put ANTHROPIC_API_KEY, or ASK_PROVIDER + ASK_API_KEY + ASK_MODEL, in the repo's .env and rerun.");
  process.exit(offlineFail ? 1 : 0);
}
const { askModel, MODEL, PROVIDER } = await import("../../api/ask.js");
console.log(`\nModel cases on ${PROVIDER} ${MODEL}`);
const results = [];
for (const c of cases) {
  const t0 = Date.now();
  let a, err = null;
  try { a = await askModel(c.piece, c.q); } catch (e) { err = `${e?.status ?? ""} ${e?.constructor?.name ?? "Error"}`.trim(); a = null; }
  const ms = Date.now() - t0, why = [];
  if (err) why.push(`error ${err}`);
  else if (c.expect === "not_recorded") { if (a.answerable) why.push("answered, expected not recorded"); }
  else {
    if (!a.answerable) why.push("said not recorded, expected an answer");
    else {
      if (!c.fields.some(k => a.fields.includes(k))) why.push(`fields ${JSON.stringify(a.fields)}, expected one of ${JSON.stringify(c.fields)}`);
      if (!c.include.some(w => low(a.answer).includes(low(w)))) why.push(`answer lacks any of ${JSON.stringify(c.include)}`);
      if (!a.quote) why.push("no verbatim quote (soft)");
    }
  }
  for (const w of c.exclude ?? []) if (a && low(a.answer).includes(low(w))) why.push(`answer contains "${w}"`);
  const hard = why.filter(w => !w.endsWith("(soft)"));
  results.push({ ...c, got: a, ms, pass: !hard.length, notes: why });
  console.log(`${hard.length ? "FAIL" : "pass"} ${String(ms).padStart(5)} ms  ${c.piece}  ${c.q}${why.length ? `  [${why.join("; ")}]` : ""}`);
}
const passed = results.filter(r => r.pass).length, ms = results.map(r => r.ms).sort((x, y) => x - y);
const summary = { model: MODEL, date: new Date().toISOString().slice(0, 10), passed, total: results.length,
  medianMs: ms[Math.floor(ms.length / 2)], maxMs: ms.at(-1), offlineChecks: offlineFail ? "failed" : "passed" };
console.log(`\n${passed}/${results.length} passed · median ${summary.medianMs} ms · max ${summary.maxMs} ms`);
writeFileSync(new URL(`results-${MODEL.replace(/[^\w.-]+/g, "_")}.json`, here), JSON.stringify({ summary, results }, null, 1) + "\n");

const md = [`# Ask the archive: eval results (${MODEL}, ${summary.date})`, "",
  `${passed} of ${results.length} cases pass · median ${summary.medianMs} ms, slowest ${summary.maxMs} ms · offline checks ${summary.offlineChecks}.`, "",
  "**For the curator:** please read each answer against the MoMu record (the quote is copied from it) and mark anything that says more than the record, translates it wrongly, or reads badly. Cases and expectations live in `cases.json`.", "",
  "| # | Piece | Question | Expected | Answer | Field | Quote from the record | Check |", "|---|---|---|---|---|---|---|---|",
  ...results.map((r, i) => `| ${i + 1} | ${r.piece} | ${cell(r.q)} | ${r.expect === "answer" ? "answer" : "not recorded"} | ${cell(r.got?.answer ?? "(error)")} | ${(r.got?.fields ?? []).join(", ")} | ${cell(r.got?.quote ?? "")} | ${r.pass ? "pass" : "**FAIL**"}${r.notes.length ? `: ${cell(r.notes.join("; "))}` : ""} |`)];
writeFileSync(new URL("RESULTS.md", here), md.join("\n") + "\n");
process.exit(offlineFail || passed < results.length ? 1 : 0);

function cell(s) { return String(s).replace(/\|/g, "\\|").replace(/\n/g, " "); }
