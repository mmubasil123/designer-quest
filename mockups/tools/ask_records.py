"""Copy the MoMu record fields "Ask the archive" (H2) may answer from into mockups/ask-records.json.

Ask grounds every answer in one piece's record (D3), so it needs more than the fact card's records.json: the full Dutch
description, maker, title, size and type. Every value here is verbatim from the harvested record; the only English is
what records.json already carries (the card's date, place and medium terms and our translation of the description's
first sentence), copied across and marked as ours. Provenance and acquisition fields are left out on purpose: they can
name private donors, and visitors do not need them (D2, data minimisation).

Run: .venv/bin/python -I mockups/tools/ask_records.py [--cache PATH]   (PATH defaults to the repo's cache/)
"""
import argparse
import glob
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
# (key, record property, label shown as "From the MoMu record: <label>"), in the order the model reads them
FIELDS = [
    ("title", "dcterms:title", "Title"),
    ("creator", "dcterms:creator", "Maker"),
    ("date", "dcterms:date", "Date"),
    ("place", "dcterms:spatial", "Place"),
    ("subject", "dcterms:subject", "Type of object"),
    ("medium", "dcterms:medium", "Materials and techniques"),
    ("extent", "dcterms:extent", "Size"),
    ("description", "dcterms:description", "Description"),
    ("shortDescription", "bibo:shortDescription", "About the maker or collection"),
]


def literals(item, prop):
    """(value, language) pairs, literal values only; a vocabulary URI's label counts as an untagged literal."""
    out = []
    for x in item.get(prop, []):
        v = x.get("@value", x.get("o:label"))
        if v:
            out.append((v.strip(), x.get("@language")))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cache", type=Path, default=ROOT / "cache")
    cache = ap.parse_args().cache
    cards = json.loads((ROOT / "mockups/records.json").read_text())
    ids = list(cards)
    found = {}
    for f in sorted(glob.glob(str(cache / "*/items/page-*.json"))):
        for item in json.loads(Path(f).read_text()):
            for x in item.get("modsrdf:identifier", []):
                if x.get("@value") in ids:
                    found.setdefault(x["@value"], item)
    missing = sorted(set(ids) - set(found))
    assert not missing, f"no record in {cache} for {missing}"

    out = {}
    for rid in ids:
        item, card = found[rid], cards[rid]
        assert card["quote"] is None or any(card["quote"].rstrip(".") in v for v, _ in literals(item, "dcterms:description")), \
            f"{rid}: records.json quote is not in the record any more; rerun tools/records.py"
        fields = []
        for key, prop, label in FIELDS:
            vals = literals(item, prop)
            if key == "medium":   # Dutch terms only here; the English terms come from records.json
                nl_terms = [v for v, lang in vals if lang == "nl"]
                vals = [(v, "nl") for v in nl_terms] if nl_terms else [(v, None) for v, _ in vals if v not in card["medium"]]
            if not vals:
                continue
            f = {"key": key, "label": label, "property": prop, "values": [v for v, _ in vals]}
            en = {"date": card["date"], "place": card["place"], "medium": card["medium"]}.get(key)
            if en and en != f["values"]:
                f["en"] = en
            if key == "description" and card.get("quoteEn"):
                f["en"] = [card["quoteEn"]]
                f["enNote"] = "our translation of the first sentence only"
            fields.append(f)
        out[rid] = {"uri": card["uri"], "fields": fields}
    (ROOT / "mockups/ask-records.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
    print(f"{len(out)} records, {sum(len(r['fields']) for r in out.values())} fields")


if __name__ == "__main__":
    main()
