"""Copy the MoMu record fields the fabric cards show (C1) from the harvest cache into mockups/records.json.

Every value is verbatim from the record (D3); the page adds nothing but layout and "not recorded" for gaps.
Run: .venv/bin/python -I mockups/tools/records.py
"""
import glob
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
# Our English for each record's first description sentence, keyed to that Dutch sentence so a changed record fails
EN = {
    "ST503": ("Het jak reikt tot aan de taille en heeft lange schootpanden",
              "The jacket reaches to the waist and has long skirts, a square neckline and close-fitting sleeves to the elbow."),
    "ST80930": ("Donkerblauwe vest of jasje in ikat", "Dark blue waistcoat or jacket in ikat with light blue spots and red squares."),
    "ST2434": ("Jas in groen laken, met slippen", "Coat in green broadcloth, with tails."),
    "ST80931": ("Donkerblauwe pofbroek", 'Dark blue puffed trousers, or "monpe", in ikat with light blue spots and red squares.'),
    "ST2062": ("Broek, kniebroek voor een man", "Trousers: men's knee breeches in cream woollen broadcloth."),
    "ST2407/1-2": ("Paar voetbalschoenen", "Pair of football boots in white, with leather in blue circular stripes."),
    "ST80881": ("Ecru furisode kimono", "Ecru furisode kimono, painted and with a gold print."),
    "ST655/1": ("Kuit- tot enkellange japon", "Calf- to ankle-length button-through gown, a cocktail dress, in green and black "
                "horizontally striped synthetic material."),
    "ST2435": ("Jurk in ecru zijdeweefsel", "Calf-length dress in ecru woven silk, covered all over in sequin embroidery with "
               "the iridescent effect of pearls."),
    "ST652/1": ("Doorknoopjurk van bedrukte katoen", "Button-through dress of printed cotton, blue with small white and red dots."),
    "ST673/1-2": ("Combinaison in wit katoen", "Combination in white cotton: a bodice without boning, with long open drawers "
                  "buttoned to it."),
    "ST81190": ("Getailleerde jas in grijs wolweefsel", "Fitted coat in grey woven wool with a stand-up collar."),
    "ST80998": ("Bruidskaftan in bordeaux", "Bridal kaftan in burgundy, red, green and black striped velvet, with a round "
                "neckline ending in a point and long pointed sleeves."),
    "ST2431/1-4": ("Militair uniform voor een man", "Military uniform for a man, in light blue and red wool, of a lieutenant "
                   "of the National Guard, in the 9th or 18th regiment of mounted chasseurs (Chasseurs à cheval, France)."),
    "ST2432/1-2": ("Kostuum in de vorm van een militair uniform", "Costume in the form of a military uniform for a man, a "
                   "member of the National Guard: an original coat and trousers made later, both altered."),
    "ST671": ("Lange japon, wandeljapon", "Long gown, a walking gown, in beige silk rep."),
    "ST2203": ("Jurk van zwart zijden satijn", "Dress of black silk satin."),
}
PLACE_EN = {"Japan": "Japan", "Nederland": "Netherlands", "België": "Belgium", "Palestina": "Palestine"}


def values(item, key):
    return [x["@value"] for x in item.get(key, []) if "@value" in x]


def english_medium(rid, item, tagged):
    """English medium terms. Some records leave every term untagged; those list the Dutch terms A to Z, then the English
    ones A to Z, so the English start where the order restarts, checked against how each term is tagged elsewhere."""
    terms = item.get("dcterms:medium", [])
    if all(x.get("@language") for x in terms):
        return [x["@value"] for x in terms if x["@language"] == "en"]
    words = [x["@value"] for x in terms]
    cut = next((i for i in range(1, len(words)) if words[i].lower() < words[i - 1].lower()), len(words))
    assert not set(words[:cut]) & tagged["en"] and not set(words[cut:]) & tagged["nl"], f"{rid}: medium split unclear {words}"
    return words[cut:]


def main():
    ids = [p["id"] for p in json.loads((ROOT / "mockups/pieces.json").read_text())["pieces"]]
    found, tagged = {}, {"nl": set(), "en": set()}
    for f in sorted(glob.glob(str(ROOT / "cache/*/items/page-*.json"))):
        for item in json.loads(Path(f).read_text()):
            for x in item.get("dcterms:medium", []):
                if x.get("@language") in tagged:
                    tagged[x["@language"]].add(x["@value"])
            for rid in values(item, "modsrdf:identifier"):
                if rid in ids:
                    found.setdefault(rid, item)
    missing = sorted(set(ids) - set(found))
    assert not missing, f"no record in cache/ for {missing}"
    out = {}
    for rid in ids:
        item = found[rid]
        # most descriptions carry no language tag; untagged ones are Dutch, as is every one in the demo set
        desc = [x["@value"] for x in item.get("dcterms:description", []) if x.get("@language", "nl") == "nl"]
        quote = desc[0].split(". ")[0].rstrip(".") + "." if desc else None
        start, en = EN.get(rid, (None, None))
        assert quote is None or (start and quote.startswith(start)), f"{rid}: no translation for {quote!r}"
        place = values(item, "dcterms:spatial")
        out[rid] = {
            "uri": next((x["@id"] for k in ("cidoc:P48_has_preferred_identifier", "cidoc:P1_is_identified_by")
                         for x in item.get(k, []) if "@id" in x), None),
            "date": [d.replace("herfst-winter", "autumn-winter") for d in values(item, "dcterms:date")],   # season names are Dutch
            "place": [PLACE_EN[p] for p in place],   # KeyError means a new place name to translate
            "medium": english_medium(rid, item, tagged),
            "quote": quote,
            "quoteEn": en,
        }
    (ROOT / "mockups/records.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
    print(f"{len(out)} records")


if __name__ == "__main__":
    main()
