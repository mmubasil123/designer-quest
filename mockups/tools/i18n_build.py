"""D-3: build the translated facts and stories (mockups/i18n/content.<lang>.json) at build time, never at runtime.

What is translated (source language in brackets), and where it comes from:
  rec:<id>:quote        the record's first description sentence [nl]          records.json
  rec:<id>:desc:<n>     every sentence of the full description [nl]           ask-records.json (Ask shows quotes from it)
  det:<id>:<i>:quote    Up close detail quote [nl]; :find the prompt [en]     pieces.json
  q:<id>:story:<n> / :q:<n> / :a:<n> / :fact:<n>   the curator's story, questions, answers, fact values [en]   questions.json
  name:<id>             the piece's name on pieces.json [en]
  term:<english>        material, technique and place words [en]              records.json
Our existing English for the Dutch first sentence and detail quotes (records.py EN, pieces.json `en`) is kept as is
(by "team"); everything else is machine-translated (by "machine") with the project's Gemini setup, using
i18n/glossary.json so fashion terms stay consistent. Each entry stores a hash of its source text: when a source changes,
the client shows the original again and `--check` fails until this script is rerun (only changed entries are redone).
Every entry is stored under the language it is shown in; the original language needs no entry.

  python3 -I mockups/tools/i18n_build.py --env ../momu-h2/.env     # translate what is missing or changed
  python3 -I mockups/tools/i18n_build.py --check                   # every source has a fresh translation in every language
  python3 -I mockups/tools/i18n_build.py --report                  # counts per language, machine vs team

Settings come from the git-ignored .env (never printed): ASK_PROVIDER (gemini, openrouter, groq, mistral) or ASK_BASE_URL,
ASK_API_KEY and ASK_MODEL, the same as api/ask.js; I18N_MODEL overrides the model. Only museum text is sent. If the quota
runs out the script saves what is done and lists what is missing; rerun later.
"""
import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

MOCKUPS = Path(__file__).resolve().parents[1]
ROOT = MOCKUPS.parent
OUT = MOCKUPS / "i18n"
LANGS = ["nl", "en", "fr"]
NAME = {"nl": "Dutch (Belgian, Flanders)", "en": "English", "fr": "French (Belgium)"}
BASE = {"gemini": "https://generativelanguage.googleapis.com/v1beta/openai", "openrouter": "https://openrouter.ai/api/v1",
        "groq": "https://api.groq.com/openai/v1", "mistral": "https://api.mistral.ai/v1"}


def h(text):
    """FNV-1a 32 over the UTF-8 of the whitespace-normalised text: the same as hash() in i18n.js."""
    import unicodedata
    x = 0x811C9DC5
    for b in unicodedata.normalize("NFC", re.sub(r"\s+", " ", str(text)).strip()).encode():
        x = ((x ^ b) * 0x01000193) & 0xFFFFFFFF
    return f"{x:08x}"


def sentences(text):
    return [s for s in re.split(r"(?<=[.!?])\s+(?=[A-ZÀ-ÝÉ])", re.sub(r"\s+", " ", text).strip()) if s]


def sources():
    """[(key, source text, source lang, {lang: team text})] for everything that needs a translation."""
    rec = json.loads((MOCKUPS / "records.json").read_text())
    ask = json.loads((MOCKUPS / "ask-records.json").read_text())
    pieces = json.loads((MOCKUPS / "pieces.json").read_text())["pieces"]
    qs = json.loads((MOCKUPS / "questions.json").read_text())["pieces"]
    out, terms = [], []
    for pid, r in rec.items():
        if r.get("quote"):
            out.append((f"rec:{pid}:quote", r["quote"], "nl", {"en": r["quoteEn"]} if r.get("quoteEn") else {}))
        for t in (r.get("medium") or []) + (r.get("place") or []):
            if t not in terms:
                terms.append(t)
    for pid, a in ask.items():
        d = next((f["values"][0] for f in a["fields"] if f["key"] == "description"), "")
        for n, s in enumerate(sentences(d)):
            team = {"en": a_en} if n == 0 and (a_en := next((f.get("en", [None])[0] for f in a["fields"] if f["key"] == "description"), None)) else {}
            out.append((f"rec:{pid}:desc:{n}", s, "nl", team))
    for p in pieces:
        out.append((f"name:{p['id']}", p["name"], "en", {}))   # the team's English piece names
        for i, d in enumerate(p.get("details") or []):
            out.append((f"det:{p['id']}:{i}:quote", d["quote"], "nl", {"en": d["en"]} if d.get("en") else {}))
            out.append((f"det:{p['id']}:{i}:find", d["find"], "en", {}))
    for q in qs:
        out.append((f"q:{q['id']}:title", q["title"], "en", {}))
        for n, s in enumerate(q.get("story") or []):
            out.append((f"q:{q['id']}:story:{n}", s, "en", {}))
        for n, x in enumerate(q.get("questions") or []):
            out.append((f"q:{q['id']}:q:{n}", x["q"], "en", {}))
            out.append((f"q:{q['id']}:a:{n}", x["a"], "en", {}))
        for n, (k, v) in enumerate(q.get("facts") or []):
            out.append((f"q:{q['id']}:fact:{n}", v, "en", {}))
    for t in terms:
        out.append((f"term:{t}", t, "en", {}))
    return out


def load(lang):
    f = OUT / f"content.{lang}.json"
    return json.loads(f.read_text()) if f.exists() else {}


def save(lang, data):
    OUT.mkdir(exist_ok=True)
    meta = {"_about": f"D-3: {lang} text for facts and stories, built by mockups/tools/i18n_build.py. Do not hand-edit; "
                      "change the glossary or the source and rerun. h = hash of the source text; by = team or machine."}
    body = {k: v for k, v in sorted(data.items()) if not k.startswith("_")}
    (OUT / f"content.{lang}.json").write_text(json.dumps({**meta, **body}, ensure_ascii=False, indent=1) + "\n")


def todo(srcs, stores):
    """Per target language, the sources that still need a translation (missing or stale)."""
    need = {l: [] for l in LANGS}
    for key, text, frm, team in srcs:
        for l in LANGS:
            if l == frm:
                continue
            e = stores[l].get(key)
            if e and e.get("h") == h(text):
                continue
            if l in team:
                stores[l][key] = {"h": h(text), "t": team[l], "by": "team", "s": text}
                continue
            need[l].append((key, text, frm))
    return need


def env_file(arg):
    cands = [Path(arg)] if arg else []
    cands += [ROOT / ".env"]
    try:
        import subprocess
        common = subprocess.run(["git", "-C", str(ROOT), "rev-parse", "--git-common-dir"], capture_output=True, text=True).stdout.strip()
        if common:
            cands.append((ROOT / common).resolve().parent / ".env")
    except OSError:
        pass
    for c in cands:
        if c.exists() and "ASK_API_KEY=" in c.read_text():
            return c
    sys.exit("no .env with ASK_API_KEY found (git-ignored); pass --env PATH. Not translating.")


def settings(path):
    v = {}
    for line in path.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, val = line.split("=", 1)
            v[k.strip()] = val.strip().strip('"')
    url = (v.get("ASK_BASE_URL") or BASE.get(v.get("ASK_PROVIDER", ""), "")).rstrip("/")
    model = v.get("I18N_MODEL") or v.get("ASK_MODEL")
    if not (url and model and v.get("ASK_API_KEY")):
        sys.exit("ASK_PROVIDER/ASK_BASE_URL, ASK_MODEL and ASK_API_KEY must be set in the .env")
    return url, model, v["ASK_API_KEY"]


def glossary_text(lang):
    g = json.loads((OUT / "glossary.json").read_text())
    lines = []
    for e in g["terms"]:
        if "keep" in e:
            lines.append(f"- keep '{e['keep']}' as it is in every language")
        elif e.get(lang):
            lines.append(f"- {e.get('en') or e.get('nl')} -> {e[lang]}")
    return "\n".join(lines)


def call(url, model, key, lang, batch):
    """One request: {id: text} in, {id: translation} out. Returns None when the daily quota is spent."""
    items = {str(i): t for i, (_, t, _) in enumerate(batch)}
    system = (f"You translate short texts of a fashion museum app (MoMu, Antwerp) into {NAME[lang]} for visitors aged 15 to 25. "
              "Translate faithfully: add nothing, leave nothing out, do not explain, keep numbers, years, object numbers, "
              "proper names and brand names unchanged, keep sentence count and register (plain, warm, not stiff). "
              "Texts are Dutch or English; some are fragments or single words (materials, techniques, places): translate them as the same kind of fragment, lower case where the source is. "
              f"Use this glossary for fashion terms:\n{glossary_text(lang)}\n"
              'Reply with one JSON object only: {"<id>": "<translation>", ...} with exactly the ids you were given.')
    body = json.dumps({"model": model, "temperature": 0, "response_format": {"type": "json_object"},
                       "messages": [{"role": "system", "content": system}, {"role": "user", "content": json.dumps(items, ensure_ascii=False)}]}).encode()
    for attempt in range(5):
        req = urllib.request.Request(f"{url}/chat/completions", body, {"Content-Type": "application/json", "Authorization": f"Bearer {key}"})
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                text = json.load(r)["choices"][0]["message"]["content"]
            got = json.loads(text[text.index("{"): text.rindex("}") + 1])
            if set(got) != set(items) or not all(isinstance(v, str) and v.strip() for v in got.values()):
                raise ValueError("ids or values wrong")
            return {batch[int(i)][0]: v.strip() for i, v in got.items()}
        except urllib.error.HTTPError as e:
            msg = e.read().lower()
            if e.code == 429 and (b"per day" in msg or b"daily" in msg):
                return None
            if e.code in (429, 500, 503) and attempt < 4:
                time.sleep(20 * (attempt + 1)); continue
            if e.code == 429:
                return None
            sys.exit(f"translation failed: HTTP {e.code}")
        except (ValueError, KeyError, json.JSONDecodeError):
            if attempt == 4:
                print("  a batch came back malformed; skipped, rerun to retry")
                return {}
        except (urllib.error.URLError, TimeoutError):
            time.sleep(10)
    return {}


def ui_missing():
    """UI strings wrapped in t("...") in the pages and modules that NL or FR files do not have yet (literal calls only)."""
    keys = set()
    for f in [*MOCKUPS.glob("*.js"), MOCKUPS / "second-skin.html", MOCKUPS / "up-close.html"]:
        if f.name == "i18n.js":
            continue
        src = f.read_text()
        for m in re.finditer(r"""\bt\(\s*(?:[^()"'`?]*\?\s*)?"((?:[^"\\]|\\.)*)"(?:\s*:\s*"((?:[^"\\]|\\.)*)")?""", src):
            keys |= {k.replace('\\"', '"') for k in m.groups() if k}
    return {l: sorted(k for k in keys if k not in json.loads((OUT / f"ui.{l}.json").read_text())) for l in ("nl", "fr")}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--report", action="store_true")
    ap.add_argument("--env")
    ap.add_argument("--batch", type=int, default=20)
    a = ap.parse_args()
    srcs = sources()
    stores = {l: load(l) for l in LANGS}
    need = todo(srcs, stores)
    if a.report or a.check:
        live = {k for k, *_ in srcs}
        for l in LANGS:
            vals = [v for k, v in stores[l].items() if not k.startswith("_") and k in live]
            print(f"{l}: {len(vals)} entries ({sum(v['by'] == 'team' for v in vals)} team, {sum(v['by'] == 'machine' for v in vals)} machine), {len(need[l])} missing or stale")
        um = ui_missing()
        for l, ks in um.items():
            print(f"ui.{l}.json: {len(ks)} UI strings missing" + (f": {ks[:10]}" if ks else ""))
        if a.check and (any(need.values()) or any(um.values())):
            sys.exit("missing or stale translations; run without --check, and add UI strings to i18n/ui.<lang>.json")
        return
    pending = {l: list(v) for l, v in need.items() if v}
    if not pending:
        for l in LANGS:
            save(l, stores[l])
        print("nothing to translate"); return
    url, model, key = settings(env_file(a.env))
    for l, items in pending.items():
        for i in range(0, len(items), a.batch):
            batch = items[i: i + a.batch]
            got = call(url, model, key, l, batch)
            if got is None:
                print(f"{l}: quota spent after {i} of {len(items)}; saving what is done")
                break
            for k, text, _ in batch:
                if k in got:
                    stores[l][k] = {"h": h(text), "t": got[k], "by": "machine", "s": text}
            print(f"{l}: {min(i + a.batch, len(items))}/{len(items)}")
        save(l, stores[l])
    left = {l: [k for k, *_ in v if k not in stores[l]] for l, v in need.items()}
    for l, ks in left.items():
        if ks:
            print(f"MISSING {l} ({len(ks)}): {', '.join(ks[:40])}{' ...' if len(ks) > 40 else ''}")


if __name__ == "__main__":
    main()
