"""H13: listen back to voiced narration, locally (faster-whisper, base.en; audio never leaves the laptop).

For every audio file in DIR named like the import (<id>.en.mp3|m4a|wav|mp4): transcribe it, say which story it reads
and how much of that script it heard (recall), list the words heard that are not in the script (a style line read out
would show here), and measure each beat's start time. Writes DIR/cues.json for `narration.py --cues`.

  .venv/bin/python -I mockups/tools/narration_listen.py DIR
  python3 -I mockups/tools/narration.py --import DIR --voice "picsart:Adeline"
  python3 -I mockups/tools/narration.py --cues DIR/cues.json
"""
import difflib
import json
import re
import sys
from pathlib import Path

from faster_whisper import WhisperModel

MOCKUPS = Path(__file__).resolve().parents[1]
norm = lambda w: re.sub(r"[^a-z0-9]", "", w.lower().replace("’", "'"))


def main(argv):
    d = Path(argv[0])
    doc = json.loads((MOCKUPS / "narration.json").read_text())["pieces"]
    by_slug = {re.sub(r"[^A-Za-z0-9-]+", "_", pid) + ".en": pid for pid in doc}
    model = WhisperModel("base.en", device="cpu", compute_type="int8")
    cues, low = {}, 0
    for f in sorted(p for p in d.iterdir() if p.suffix.lower() in (".mp3", ".m4a", ".wav", ".mp4")):
        pid = by_slug.get(f.stem)
        if not pid:
            print(f"{f.name}: not named after a story, skipped"); continue
        segs, _ = model.transcribe(str(f), word_timestamps=True, beam_size=5)
        heard = [(norm(w.word), w.start) for s in segs for w in s.words if norm(w.word)]
        script, beat_of = [], []
        for k, b in enumerate(doc[pid].get("beats") or [{"t": doc[pid]["text"]}]):
            for w in b["t"].split():
                if norm(w):
                    script.append(norm(w)); beat_of.append(k)
        hw = {h[0] for h in heard}
        recall = sum(1 for w in script if w in hw) / len(script)
        extra = [h[0] for h in heard if h[0] not in set(script)]
        low += recall < 0.85
        print(f"{pid:12s} recall {recall:.0%}  heard {len(heard)} / script {len(script)} words"
              + (f"  not in script: {' '.join(extra[:10])}" if extra else ""))
        sm = difflib.SequenceMatcher(a=script, b=[h[0] for h in heard], autojunk=False)
        t_of = {a + i: heard[b + i][1] for a, b, n in sm.get_matching_blocks() for i in range(n)}
        starts = []
        for k in range(max(beat_of) + 1):
            idx = [i for i, bk in enumerate(beat_of) if bk == k]
            first = next((i for i in idx if i in t_of), None)
            # first matched word of the beat; if earlier words of the beat were misheard, step back about 0.4 s each
            starts.append(None if first is None else round(max(0.0, t_of[first] - 0.4 * idx.index(first)), 2))
        if doc[pid].get("beats"):
            cues[pid] = starts
    (d / "cues.json").write_text(json.dumps(cues, indent=1) + "\n")
    print(f"cues for {len(cues)} stories in {d / 'cues.json'}; {low} files under 85% recall (listen to those)")
    return 1 if low else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
