/* H2 Ask the archive: POST /api/ask {pieceId, question} -> {answerable, answer, fields, quote, label, model}.
   Vercel serverless function (Node). The key stays here, in env; the browser never sees it.
   Provider: Claude when ANTHROPIC_API_KEY is set (default model claude-haiku-5-5); otherwise any OpenAI-compatible API
   when ASK_API_KEY is set, chosen by ASK_PROVIDER (gemini, openrouter, groq, mistral) or ASK_BASE_URL, with ASK_MODEL
   naming the model (free tiers work for the demo; see the PR). With neither key the sheet answers from fields.
   Privacy (D2): no accounts, no cookies; the question text and the caller's IP are never logged or stored here. Only the
   question and that piece's public MoMu record go to the provider, usually outside the EU (GDPR Art. 44: to revisit
   after the hackathon). Grounding (D3): the model sees one record and nothing else; checkAnswer() drops any field or
   quote that is not in it. */
import Anthropic from "@anthropic-ai/sdk";
import RECORDS from "../ask-records.json" with { type: "json" };
import { ANSWER_SCHEMA, LABEL, SYSTEM_PROMPT, checkAnswer, cleanQuestion, recordText } from "../ask-core.js";

const BASE_URLS = {
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
  openrouter: "https://openrouter.ai/api/v1",
  groq: "https://api.groq.com/openai/v1",
  mistral: "https://api.mistral.ai/v1",
};
export const PROVIDER = process.env.ANTHROPIC_API_KEY ? "anthropic" : process.env.ASK_API_KEY ? (process.env.ASK_PROVIDER || "openrouter") : null;
export const MODEL = process.env.ASK_MODEL || (PROVIDER === "anthropic" ? "claude-haiku-5-5" : "");
const configured = () => PROVIDER === "anthropic" || (PROVIDER && MODEL && (process.env.ASK_BASE_URL || BASE_URLS[PROVIDER]));

// A per-instance cap on calls per minute (no IP, so nobody is tracked): a cost and abuse brake for a hackathon demo.
const WINDOW_MS = 60_000, MAX_PER_WINDOW = Number(process.env.ASK_MAX_PER_MINUTE || 30);
const recent = [];
function overLimit(now = Date.now()) {
  while (recent.length && now - recent[0] > WINDOW_MS) recent.shift();
  if (recent.length >= MAX_PER_WINDOW) return true;
  recent.push(now);
  return false;
}

let client = null;

/* The model call alone, so the eval runs exactly what the function runs. Returns the checked answer. */
export async function askModel(pieceId, question, { model = MODEL } = {}) {
  const rec = RECORDS[pieceId];
  if (PROVIDER !== "anthropic") return checkAnswer(rec, await askCompatible(pieceId, rec, question, model));
  client ??= new Anthropic({ maxRetries: 1, timeout: 20_000 });
  const sonnet = model.startsWith("claude-sonnet-5-5");
  const res = await client.beta.messages.create({
    model,
    max_tokens: 2000,
    output_config: { effort: "low", format: { type: "json_schema", schema: ANSWER_SCHEMA } },
    // Sonnet 5.5 can hand a safety decline to another model inside the same call; Haiku has no server-side fallback
    ...(sonnet ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" } : {}),
    system: [
      { type: "text", text: SYSTEM_PROMPT },
      { type: "text", text: `<record>\n${recordText(pieceId, rec)}\n</record>` },
    ],
    messages: [{ role: "user", content: `<question>${question}</question>` }],
  });
  if (res.stop_reason === "refusal" || res.stop_reason === "max_tokens") return checkAnswer(rec, null);
  const text = res.content.find(b => b.type === "text")?.text ?? "";
  let out = null;
  try { out = JSON.parse(text); } catch { /* not JSON: treated as not recorded */ }
  return checkAnswer(rec, out);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "method" }); }
  const body = typeof req.body === "string" ? safeJson(req.body) : req.body;
  const pieceId = typeof body?.pieceId === "string" ? body.pieceId : "";
  const question = cleanQuestion(body?.question);
  if (!Object.hasOwn(RECORDS, pieceId)) return res.status(404).json({ error: "piece" });
  if (!question) return res.status(400).json({ error: "question" });
  // no key: a normal reply, not an error, so the visitor's console stays clean; the sheet answers from fields instead
  if (!configured()) return res.status(200).json({ offline: true });
  if (overLimit()) return res.status(429).json({ error: "busy" });
  try {
    const answer = await askModel(pieceId, question);
    return res.status(200).json({ ...answer, label: LABEL, model: MODEL });
  } catch (e) {
    // status and class only: the error may echo the request, and the request holds the visitor's question
    console.error("ask: model call failed", e?.status ?? "", e?.constructor?.name ?? "Error");
    const status = e instanceof Anthropic.RateLimitError || e?.status === 429 ? 429 : 502;
    return res.status(status).json({ error: status === 429 ? "busy" : "upstream" });
  }
}

/* OpenAI-compatible chat completions (Gemini, OpenRouter, Groq, Mistral). Asks for the same JSON schema; a provider or
   free model that rejects schema output is asked again for plain JSON, then for text with the JSON pulled out. */
async function askCompatible(pieceId, rec, question, model) {
  const url = `${(process.env.ASK_BASE_URL || BASE_URLS[PROVIDER]).replace(/\/$/, "")}/chat/completions`;
  const messages = [
    { role: "system", content: `${SYSTEM_PROMPT}\n\nReply with one JSON object only, with exactly these keys: answerable (boolean), answer (string), fields (array of field keys), quote (string).\n\n<record>\n${recordText(pieceId, rec)}\n</record>` },
    { role: "user", content: `<question>${question}</question>` },
  ];
  const formats = [{ type: "json_schema", json_schema: { name: "answer", strict: true, schema: ANSWER_SCHEMA } }, { type: "json_object" }, null];
  for (const response_format of formats) {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.ASK_API_KEY}` },
      body: JSON.stringify({ model, messages, temperature: 0, max_tokens: 1500, ...(response_format ? { response_format } : {}) }),
      signal: AbortSignal.timeout(25_000),
    });
    if (r.status === 400 && response_format) continue;   // this model does not take that output format: try a looser one
    if (!r.ok) throw Object.assign(new Error("provider"), { status: r.status });
    const text = (await r.json()).choices?.[0]?.message?.content ?? "";
    const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    return safeJson(json);
  }
  return null;
}

function safeJson(s) { try { return JSON.parse(s); } catch { return null; } }
