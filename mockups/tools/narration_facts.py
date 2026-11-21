"""H13: check the poetic narration in narration-poems.json against the MoMu records (D3).

For every piece: each `trace` pair's record words must appear verbatim in that record (its Dutch description, or a
`medium:` / `creator:` field), every number in the poem must be in the record, and the poem stays about 40 to 70 words.
Reads the harvest cache (`cache/*/items/page-*.json`, git-ignored): pass its folder if it is not under this checkout.

  python3 -I mockups/tools/narration_facts.py [CACHE_DIR]
"""
import glob
import json
import re
import sys
from pathlib import Path

MOCKUPS = Path(__file__).resolve().parents[1]
NUM = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
       "eleven": 11, "twelve": 12, "fifteen": 15, "twenty": 20, "ninth": 9, "eighteenth": 18}
NL = {1: "een", 2: "twee", 3: "drie", 4: "vier", 5: "vijf", 6: "zes", 8: "acht", 9: "9e", 18: "18e"}


def norm(s):
    return re.sub(r"\s+", " ", s).strip()


def main(argv):
    cache = Path(argv[0]) if argv else MOCKUPS.parent / "cache"
    poems = json.loads((MOCKUPS / "narration-poems.json").read_text())["pieces"]
    records = json.loads((MOCKUPS / "records.json").read_text())
    items = {}
    for f in sorted(glob.glob(str(cache / "*/items/page-*.json"))):
        for item in json.loads(Path(f).read_text()):
            for x in item.get("modsrdf:identifier", []):
                if x.get("@value") in poems:
                    items.setdefault(x["@value"], item)
    if not items:
        sys.exit(f"no records found under {cache}: pass the harvest cache folder")
    errors = 0
    for pid, p in poems.items():
        item = items.get(pid)
        if not item:
            print(f"FAIL {pid}: no record in the cache"); errors += 1; continue
        desc = norm(" ".join(x["@value"] for x in item.get("dcterms:description", []) if x.get("@language", "nl") == "nl"))
        creators = [x["@value"] for x in item.get("dcterms:creator", []) if "@value" in x]
        for ours, theirs in p["trace"]:
            if theirs.startswith("medium: "):
                ok = all(t.strip() in records[pid]["medium"] for t in theirs[8:].split(", "))
            elif theirs.startswith("creator: "):
                ok = theirs[9:] in creators
            else:
                ok = norm(theirs) in desc
            if not ok:
                print(f"FAIL {pid}: not in the record: {theirs!r} (for {ours!r})"); errors += 1
        text = " ".join(p["stanzas"])
        words = len(re.findall(r"[\w'’-]+", text))
        if not 35 <= words <= 75:
            print(f"FAIL {pid}: {words} words (aim 40 to 70)"); errors += 1
        for w in re.findall(r"[A-Za-z]+|\d+", text):
            n = int(w) if w.isdigit() else NUM.get(w.lower())
            if n is None:
                continue
            if not (re.search(rf"(?<!\d){n}(?!\d)", desc) or (NL.get(n) and re.search(rf"\b{NL[n]}\b", desc.lower()))):
                print(f"FAIL {pid}: number {w!r} not in the record"); errors += 1
        print(f"ok   {pid}: {words} words, {len(p['trace'])} facts traced" if not errors else f"     {pid}: {words} words")
    print(f"{len(poems)} poems, {errors} problems")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
