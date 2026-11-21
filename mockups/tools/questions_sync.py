"""Build mockups/questions.json from the curator's Notion page "Story and Questions" (C2). Her page is the source; we only read it.

Her format, per piece: a numbered heading linked to the piece's Heron page, "Label: value" facts, a "Story" section, and a
"Questions" section with numbered questions, each with a nested "Answer: ...". Her text is copied as written (tags stripped).
The Heron link (heron.libis.be/momu/.../item/<id>) maps the piece to its inventory number via records.json `heron`.

1. Fetch the page's Notion-flavoured Markdown with the Notion connector (page 41f8b3bb922780c1be22c63ccd5cb7c1) to a file.
2. python3 -I mockups/tools/questions_sync.py page.md     # writes questions.json, then checks it
   python3 -I mockups/tools/questions_sync.py --check     # checks questions.json only
A piece whose link maps to no app piece is skipped with a note; nothing is invented to fill a gap.
"""
import html
import json
import re
import sys
from pathlib import Path

MOCKUPS = Path(__file__).resolve().parents[1]
SOURCE = "https://www.notion.so/41f8b3bb922780c1be22c63ccd5cb7c1"
HEAD = re.compile(r"\[(?:\s*<[^>]+>)*\s*(\d+)\s*[:.]\s*(.*?)(?:<[^>]+>\s*)*\]\((https?://[^)\s]+)\)")   # "1: Title" or "2. Title"


def text(s):
    """Her rich text as plain text: drop tags, keep words."""
    return html.unescape(re.sub(r"\s+", " ", re.sub(r"<br\s*/?>", " ", re.sub(r"<(?!br)[^>]+>", "", s)))).strip()


def parse(md, heron):
    heads = list(HEAD.finditer(md))
    out = []
    for i, h in enumerate(heads):
        body = md[h.end(): heads[i + 1].start() if i + 1 < len(heads) else len(md)]
        title, link = text(h.group(2)), h.group(3)
        item = re.search(r"/item/(\w+)", link)
        pid = heron.get(item.group(1)) if item else None
        if not pid:
            print(f"SKIP {title!r}: its link {link} matches no piece in the app")
            continue
        parts = re.split(r"<u>\s*(Story|Questions)[^<]*</u>", body)   # "Story", "Story:", "Questions (pick 3)"
        intro, sections = parts[0], dict(zip(parts[1::2], parts[2::2]))
        facts = [[text(k).rstrip(":").strip(), text(v)] for k, v in re.findall(r"<b>([^<]+?:)\s*</b>(.*?)(?=<br\s*/?>|<b>|\n|$)", intro)]
        story = [text(p) for p in re.split(r"\n\s*\n", sections.get("Story", "")) if text(p)]
        qtext = next((v for k, v in sections.items() if k.startswith("Questions")), "")
        out.append({"id": pid, "title": title, "link": link, "source": "curator", "facts": facts, "story": story,
                    "questions": questions_from(qtext)})
    return out


def questions_from(qtext):
    """Her numbered questions, each with its answer one list level deeper. She writes the lists as Markdown ("1. ...",
    indented 3 spaces per level, the answer sometimes prefixed "Answer:") or as HTML <ol><li>, mixed within one list."""
    questions, ols, cur = [], [], None   # ols: the Markdown indent level of each open <ol>; cur: level of the open <li>
    for line in qtext.splitlines():
        s, indent = line.strip(), (len(line) - len(line.lstrip(" "))) // 3
        depth = len(ols) + sum(ols)   # list level that a <li> of the innermost open <ol> sits at
        if s == "<ol>":
            ols.append(indent)
        elif s == "</ol>":
            ols and ols.pop()
        elif s == "<li>":
            cur = depth
        elif s == "</li>":
            cur = None
        elif m := re.match(r"^\d+\.\s+(.+)", s):
            put(questions, depth + indent + 1, m.group(1))
        elif text(s) and cur:
            put(questions, cur, s)
    return questions


def put(questions, level, s):
    s = re.sub(r"^Answer:\s*", "", text(s))
    if level == 1:
        questions.append({"q": s, "a": None})
    elif level == 2 and questions:
        q = questions[-1]
        q["a"] = f"{q['a']} {s}" if q["a"] else s


def check(doc, pieces):
    errors = []
    for p in doc.get("pieces", []):
        err = lambda m: errors.append(f"{p.get('id')}: {m}")
        if p.get("id") not in pieces:
            err("not a piece in pieces.json")
        # Her answers may be things to observe on the garment ("count the seams"), not record fields: allowed because
        # her text is the curated source (D3 exception). Any other source would need each answer tied to a record field.
        if p.get("source") != "curator":
            err(f"source must be 'curator' (got {p.get('source')!r})")
        if not p.get("story") and not p.get("questions"):
            err("no story and no questions")
        for q in p.get("questions", []):
            if not q.get("q") or not q.get("a"):
                err(f"question without an answer: {q}")
        if p.get("link") and not p["link"].startswith("https://"):
            err("source link must be https")
    ids = [p.get("id") for p in doc.get("pieces", [])]
    if len(ids) != len(set(ids)):
        errors.append("a piece appears twice")
    for e in errors:
        print("FAIL", e)
    print(f"{len(ids)} pieces, {sum(len(p.get('questions', [])) for p in doc.get('pieces', []))} questions, {len(errors)} errors")
    return 1 if errors else 0


def main(argv):
    pieces = {p["id"] for p in json.loads((MOCKUPS / "pieces.json").read_text())["pieces"]}
    path = MOCKUPS / "questions.json"
    if argv[:1] == ["--check"]:
        return check(json.loads(path.read_text()), pieces)
    if not argv:
        print(__doc__)
        return 2
    records = json.loads((MOCKUPS / "records.json").read_text())
    heron = {r["heron"]: rid for rid, r in records.items() if r.get("heron")}
    doc = {"version": 2, "source": SOURCE,
           "about": "C2: the curator's stories and questions, copied from her Notion page by tools/questions_sync.py. Edit them there, not here.",
           "pieces": parse(Path(argv[0]).read_text(), heron)}
    if check(doc, pieces):
        print("questions.json left unchanged")
        return 1
    path.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
