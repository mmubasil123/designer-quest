"""Apply the curator's reviewed quiz questions from the team Notion table back to mockups/questions.json (C2).

The table "Quiz questions" (team Notion hub > "Quiz questions: review (the curator)") has one row per piece. Export its rows as a
JSON list of objects with the keys "Piece ID", "Field", "Question", "Correct answer", "Wrong options", "Status", "Notes"
(an agent can do this with the Notion connector: a SQL query on the table's data source, saved to a file). Then:
  python3 -I mockups/tools/questions_apply.py rows.json [--cache ../cache]
Rows with Status "Approved" get draft false; any other status keeps draft true. The result must pass questions_check.py
(answers are MoMu values, wrong options are real values of the same field); if it does not, questions.json is left as it was.
"""
import json
import subprocess
import sys
from pathlib import Path

MOCKUPS = Path(__file__).resolve().parents[1]
FIELD = {"place": "place", "date": "date", "material": "medium"}   # Notion label -> records.json field


def main(argv):
    if not argv:
        print(__doc__)
        return 2
    rows = json.loads(Path(argv[0]).read_text())
    path = MOCKUPS / "questions.json"
    before = path.read_text()
    doc = json.loads(before)
    by_id = {q["id"]: q for q in doc["questions"]}
    for row in rows:
        rid = (row.get("Piece ID") or "").strip()
        if rid not in by_id:
            print(f"SKIP {rid!r}: no question for this piece in questions.json (ask Hassan to add one)")
            continue
        q = by_id[rid]
        answer = (row.get("Correct answer") or "").strip()
        wrong = [w.strip() for w in (row.get("Wrong options") or "").split("|") if w.strip()]
        options = wrong[:]
        options.insert(sum(map(ord, rid)) % (len(wrong) + 1), answer)   # fixed but not always-first place for the answer
        new = {**q, "field": FIELD.get((row.get("Field") or "").strip(), row.get("Field")), "prompt": (row.get("Question") or "").strip(),
               "answer": answer, "options": options, "draft": (row.get("Status") or "").strip() != "Approved"}
        changed = [k for k in new if new[k] != q[k]]
        print(f"{rid}: {row.get('Status') or 'no status'}; changed {', '.join(changed) or 'nothing'}"
              + (f"; notes: {row['Notes']}" if row.get("Notes") else ""))
        q.update(new)
    path.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n")
    check = subprocess.run([sys.executable, "-I", str(MOCKUPS / "tools/questions_check.py"), *argv[1:]], capture_output=True, text=True)
    print(check.stdout, end="")
    if check.returncode:
        path.write_text(before)
        print("questions.json left unchanged: fix the rows above in Notion and run again")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
