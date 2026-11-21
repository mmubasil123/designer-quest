"""H13: check the narration scripts in narration-scripts.json against their sources (D3).

For every piece: each `trace` pair's source words must appear verbatim in that source: the record's Dutch description
(no prefix), a record field (`date:`, `place:`, `creator:`, `title:`, `medium:`) or the curator's own story (`curator:`, from
questions.json). Every number in the script must appear in the record or in the curator's story. Wearables (no splat) are
won by guessing their year, so their dates may only be said in `reveal` beats, and they need a `tease`. Spoken length
stays about 50 to 110 words (30 to 45 seconds).
Reads the harvest cache (`cache/*/items/page-*.json`, git-ignored): pass its folder if it is not under this checkout.

  python3 -I mockups/tools/narration_facts.py [CACHE_DIR]
"""
import glob
import json
import re
import sys
from pathlib import Path

MOCKUPS = Path(__file__).resolve().parents[1]
NUM = {"two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "eight": 8, "nine": 9, "ten": 10, "eleven": 11,
       "twelve": 12, "fifteen": 15, "twenty": 20, "ninth": 9, "eighteenth": 18}
NL = {2: ["twee"], 3: ["drie"], 4: ["vier"], 5: ["vijf"], 6: ["zes"], 8: ["acht"], 9: ["negen", "9e"], 18: ["18e"]}


def norm(s):
    return re.sub(r"\s+", " ", s).strip()


def vals(item, key):
    return [x["@value"] for x in item.get(key, []) if "@value" in x]


def main(argv):
    cache = Path(argv[0]) if argv else MOCKUPS.parent / "cache"
    scripts = json.loads((MOCKUPS / "narration-scripts.json").read_text())["pieces"]
    records = json.loads((MOCKUPS / "records.json").read_text())
    pieces = {p["id"]: p for p in json.loads((MOCKUPS / "pieces.json").read_text())["pieces"]}
    curator = {p["id"]: norm(" ".join(p["story"])) for p in json.loads((MOCKUPS / "questions.json").read_text())["pieces"] if p.get("story")}
    items = {}
    for f in sorted(glob.glob(str(cache / "*/items/page-*.json"))):
        for item in json.loads(Path(f).read_text()):
            for x in item.get("modsrdf:identifier", []):
                if x.get("@value") in scripts:
                    items.setdefault(x["@value"], item)
    if not items:
        sys.exit(f"no records found under {cache}: pass the harvest cache folder")
    errors = 0

    def fail(msg):
        nonlocal errors
        print("FAIL", msg); errors += 1

    for pid, s in scripts.items():
        item = items.get(pid)
        if not item:
            fail(f"{pid}: no record in the cache"); continue
        desc = norm(" ".join(x["@value"] for x in item.get("dcterms:description", []) if x.get("@language", "nl") == "nl"))
        fields = {"date": vals(item, "dcterms:date"), "creator": vals(item, "dcterms:creator"), "title": vals(item, "dcterms:title"),
                  "place": records[pid].get("place") or []}
        for ours, src in s["trace"]:
            kind, _, words = src.partition(": ")
            if kind == "medium":
                ok = all(t in records[pid]["medium"] for t in words.split(", "))
            elif kind == "curator":
                ok = norm(words) in curator.get(pid, "")
            elif kind in fields:
                ok = words in fields[kind]
            else:
                ok = norm(src) in desc
            if not ok:
                fail(f"{pid}: not in the source: {src!r} (for {ours!r})")
        spoken = [b["t"] for b in s["beats"]]
        words = len(re.findall(r"[\w'’-]+", " ".join(spoken)))
        if not 45 <= words <= 115:
            fail(f"{pid}: {words} spoken words (aim 50 to 110)")
        pool = desc + " " + " ".join(fields["date"]) + " " + curator.get(pid, "")
        for b in s["beats"]:
            for w in re.findall(r"[A-Za-z]+|\d+", b["t"]):
                n = int(w) if w.isdigit() else NUM.get(w.lower())
                if n is None:
                    continue
                if not (re.search(rf"(?<!\d){n}(?!\d)", pool) or any(re.search(rf"\b{x}\b", pool.lower()) for x in NL.get(n, []))):
                    fail(f"{pid}: number {w!r} not in the record or the curator's story")
        guessed = not (pieces[pid].get("splat") or (pieces[pid].get("assets") or {}).get("splat"))   # study pieces are won Up close, not by year
        if guessed:
            for b in s["beats"]:
                if not b.get("reveal") and re.search(r"\b1[6-9]\d\d|\b20\d\d", b["t"]):
                    fail(f"{pid}: a date outside a reveal beat gives away the Guess the year: {b['t']!r}")
            if not any(b.get("reveal") for b in s["beats"]) or not s.get("tease"):
                fail(f"{pid}: a wearable needs a reveal beat and a tease")
            if re.search(r"\d{4}", s.get("tease", "")):
                fail(f"{pid}: the tease names a year")
        print(f"     {pid}: {words} words, {len(s['trace'])} facts traced{', guess' if guessed else ''}")
    missing = [pid for pid in pieces if pid not in scripts and (pid in records or pid in curator)]
    for pid in missing:
        fail(f"{pid}: no narration script")
    print(f"{len(scripts)} scripts, {errors} problems")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
