"""Check mockups/questions.json (C2) against the MoMu records, so no question rests on an invented fact (D3).

For each question: the piece is in pieces.json and wearable, the record is in records.json, `answer` is a verbatim value of
`field` in that record, every other option is a value of the same field in another record and not true of this one, there
are 3 or 4 distinct options, and the prompt does not give the answer away. With --cache DIR (the git-ignored harvest
cache), the answer is also traced to the raw record there, not only to records.json.
Run: python3 -I mockups/tools/questions_check.py [--cache ../cache]
"""
import glob
import json
import sys
from pathlib import Path

MOCKUPS = Path(__file__).resolve().parents[1]
FIELDS = {"date": "dcterms:date", "place": "dcterms:spatial", "medium": "dcterms:medium"}
# records.py translates places (its PLACE_EN); the raw record holds the Dutch name
PLACE_NL = {"Japan": "Japan", "Netherlands": "Nederland", "Belgium": "België", "Palestine": "Palestina"}
KEYS = {"id", "record", "field", "draft", "prompt", "answer", "options"}


def raw_values(cache, rid, field):
    """Every @value of the field in the cached record, in any language (records.json keeps the English or translated one)."""
    for f in sorted(glob.glob(str(Path(cache) / "*/items/page-*.json"))):
        for item in json.loads(Path(f).read_text()):
            if rid in [x.get("@value") for x in item.get("modsrdf:identifier", [])]:
                return [x["@value"] for x in item.get(FIELDS[field], []) if "@value" in x]
    return None


def main(argv):
    cache = argv[argv.index("--cache") + 1] if "--cache" in argv else None
    records = json.loads((MOCKUPS / "records.json").read_text())
    pieces = {p["id"]: p for p in json.loads((MOCKUPS / "pieces.json").read_text())["pieces"]}
    doc = json.loads((MOCKUPS / "questions.json").read_text())
    errors, seen = [], set()
    if doc.get("version") != 1:
        errors.append("version must be 1")
    for q in doc.get("questions", []):
        qid = q.get("id")
        err = lambda m: errors.append(f"{qid}: {m}")
        if set(q) != KEYS:
            err(f"keys must be exactly {sorted(KEYS)}, got {sorted(q)}")
            continue
        if qid in seen:
            err("more than one question for this piece")
        seen.add(qid)
        if qid not in pieces or pieces[qid]["slot"] == "study":
            err("not a wearable piece in pieces.json (study pieces use find-3-details, D2)")
        if q["record"] != qid:
            err("record must be the piece's own record")
        rec = records.get(q["record"])
        if rec is None or q["field"] not in FIELDS:
            err(f"no record {q['record']!r} in records.json, or field {q['field']!r} not in {sorted(FIELDS)}")
            continue
        own = rec.get(q["field"]) or []
        if not own:
            err(f"record has no {q['field']}: no question for it (D3)")
        if q["answer"] not in own:
            err(f"answer {q['answer']!r} is not a recorded {q['field']} {own}")
        opts = q["options"]
        if not 3 <= len(opts) <= 4 or len(set(opts)) != len(opts) or q["answer"] not in opts:
            err("needs 3 or 4 distinct options including the answer")
        others = {v for r, o in records.items() if r != q["record"] for v in o.get(q["field"]) or []}
        for o in opts:
            if o != q["answer"] and (o in own or o not in others):
                err(f"distractor {o!r} must be another record's {q['field']} and not true of this one")
        if q["answer"].lower() in q["prompt"].lower():
            err("prompt gives the answer away")
        if not isinstance(q["draft"], bool):
            err("draft must be true or false")
        if cache:
            raw = raw_values(cache, q["record"], q["field"])
            want = PLACE_NL.get(q["answer"]) if q["field"] == "place" else q["answer"]
            if raw is None:
                err(f"record not found in {cache}")
            elif want not in raw:
                err(f"answer {q['answer']!r} not in the raw record's {FIELDS[q['field']]} {raw}")
    for e in errors:
        print("FAIL", e)
    drafts = sum(q.get("draft") is True for q in doc.get("questions", []))
    print(f"{len(seen)} questions, {len(errors)} errors, {drafts} still draft{' (cache checked)' if cache else ''}")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
