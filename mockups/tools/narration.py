"""H3: build the story text and narration audio for every piece; writes mockups/narration.json and assets/audio/.

The story text is not written here; this script only collects it:
  - the curator's story from questions.json (synced from her Notion page by questions_sync.py) wins whenever she wrote one;
  - otherwise a draft built only from the piece's MoMu record (records.json, D3): date, place, the record's own
    description (English translation of the Dutch record) and its materials and techniques. Marked draft: true for her.

Narration is pre-generated, so playback needs no API at runtime and works on bad venue wifi. Each file is regenerated
only when its text changes (sha256 of the text in narration.json). Only the story text itself is sent to the voice, no
style instructions: TTS models read such instructions out loud. Provider: Google Gemini TTS (key GEMINI_API_KEY in the
git-ignored .env, never printed). When its free quota is spent, voice the rest elsewhere (Picsart text to speech) from
the exported scripts and import the files. Audio: mono AAC (.m4a, 48 kbps) through macOS afconvert.

  python3 -I mockups/tools/narration.py                 # rebuild narration.json text only (no API calls)
  python3 -I mockups/tools/narration.py --audio         # also (re)generate audio whose text changed or is missing
  python3 -I mockups/tools/narration.py --audio --only ST503,ST81190 --lang en
  python3 -I mockups/tools/narration.py --check         # narration.json matches its sources and every file exists
  python3 -I mockups/tools/narration.py --scripts DIR   # write DIR/<id>.en.txt: the exact text to voice, for any missing audio
  python3 -I mockups/tools/narration.py --scripts DIR --only ST503 --force   # redo chosen pieces (say, to change voice)
  python3 -I mockups/tools/narration.py --import DIR --voice "picsart:<voice name>"
                                                        # adopt DIR/<id>.en.(mp3|wav|m4a|mp4) made elsewhere for missing audio
"""
import base64
import hashlib
import json
import re
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
import wave
from pathlib import Path

MOCKUPS = Path(__file__).resolve().parents[1]
ROOT = MOCKUPS.parent
OUT = MOCKUPS / "narration.json"
AUDIO = MOCKUPS / "assets" / "audio"
MODEL = "gemini-3.8-flash-tts"
VOICE = "Sulafat"   # Gemini prebuilt voice described as "warm"
LANGS = {"en"}      # only English text exists so far; NL and FR need the curator's (or a marked) translation first


def years(s):
    """'1750-1780' -> '1750 to 1780' for the ear; other text untouched."""
    return re.sub(r"(\d{4})\s*-\s*(\d{4})", r"\1 to \2", s)


def term(t):
    """'cotton (fiber)' -> 'cotton': the record's term without its thesaurus qualifier."""
    return re.sub(r"\s*\([^)]*\)", "", t).strip()


def draft_from_record(piece, rec):
    """Only the record's own fields; nothing added from memory (D3)."""
    when = years(rec["date"][0]) if rec.get("date") else None
    where = ", ".join(rec.get("place") or [])
    first = f"{piece['name']}" + (f", {when}" if when else "") + (f", {where}" if where else "") + "."
    paras = [first]
    if rec.get("quoteEn"):
        paras.append(f"The museum's record describes it like this: {rec['quoteEn']}")
    terms = list(dict.fromkeys(term(t) for t in rec.get("medium") or []))
    if terms:
        paras.append("Materials and techniques in the record: " + ", ".join(terms) + ".")
    return paras


def build(lang="en"):
    pieces = json.loads((MOCKUPS / "pieces.json").read_text())["pieces"]
    records = json.loads((MOCKUPS / "records.json").read_text())
    curator = {p["id"]: p for p in json.loads((MOCKUPS / "questions.json").read_text())["pieces"] if p.get("story")}
    out = {}
    for piece in pieces:
        pid, rec = piece["id"], records.get(piece["id"]) or {}
        y = piece.get("year") or {}
        span = (f"{y['from']}" if y.get("from") == y.get("to") else f"{y.get('from')} to {y.get('to')}") if y else None
        if pid in curator:
            m = curator[pid]
            date = dict(m.get("facts") or []).get("Date")
            title, when, paras, source = m["title"], years(date) if date else span, m["story"], "curator"
            spoken = [f"{title}, {when}." if when else f"{title}."] + paras
        elif rec:
            title, when, source = piece["name"], span, "record"
            paras = draft_from_record(piece, rec)
            spoken = paras
        else:
            continue   # no story and no record: no story screen, nothing invented
        text = "\n\n".join(spoken)
        out[pid] = {
            "title": title, "years": when, "source": source, "draft": source != "curator",
            "paragraphs": paras if source == "curator" else paras[1:],   # the draft's first line is the heading itself
            "lang": lang, "text": text,
            "hash": hashlib.sha256(text.encode()).hexdigest()[:16],
            "audio": None,
        }
    return out


def slug(pid, lang):
    return re.sub(r"[^A-Za-z0-9-]+", "_", pid) + f".{lang}.m4a"


def key():
    env = ROOT / ".env"
    for line in env.read_text().splitlines() if env.exists() else []:
        if line.startswith("GEMINI_API_KEY="):
            return line.split("=", 1)[1].strip().strip('"')
    sys.exit("GEMINI_API_KEY missing in .env (git-ignored); not generating audio")


def tts(text, api_key):
    body = json.dumps({
        "contents": [{"parts": [{"text": text}]}],   # the story only: any instruction here gets read out
        "generationConfig": {"responseModalities": ["AUDIO"],
                             "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": VOICE}}}},
    }).encode()
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"
    for attempt in range(5):
        req = urllib.request.Request(url, body, {"Content-Type": "application/json", "x-goog-api-key": api_key})
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                part = json.load(r)["candidates"][0]["content"]["parts"][0]["inlineData"]
                rate = int(re.search(r"rate=(\d+)", part.get("mimeType", "")).group(1)) if "rate=" in part.get("mimeType", "") else 24000
                return base64.b64decode(part["data"]), rate
        except urllib.error.HTTPError as e:
            if e.code == 429 and b"quota" in (msg := e.read()).lower() and b"per day" in msg.lower():
                return None, None   # daily free quota spent: stop, keep what is done, rerun tomorrow
            if e.code in (429, 500, 503) and attempt < 4:
                wait = 20 * (attempt + 1)
                print(f"  HTTP {e.code}, retrying in {wait} s")
                time.sleep(wait)
                continue
            if e.code == 429:
                return None, None
            sys.exit(f"TTS failed: HTTP {e.code}")


def encode(pcm, rate, dest):
    """16-bit mono PCM -> mono AAC 48 kbps .m4a (macOS afconvert); returns seconds."""
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / "a.wav"
        with wave.open(str(wav), "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate); w.writeframes(pcm)
        subprocess.run(["afconvert", str(wav), str(dest), "-f", "m4af", "-d", "aac", "-b", "48000", "-c", "1"], check=True)
    return round(len(pcm) / 2 / rate, 1)


def main(argv):
    lang = argv[argv.index("--lang") + 1] if "--lang" in argv else "en"
    if lang not in LANGS:
        sys.exit(f"no {lang} text yet: add the translation (marked as one) before narrating it")
    only = set(argv[argv.index("--only") + 1].split(",")) if "--only" in argv else None
    old = json.loads(OUT.read_text())["pieces"] if OUT.exists() else {}
    new = build(lang)
    if "--check" in argv:
        errors = [f"{pid}: text changed since narration.json was built" for pid, e in new.items() if old.get(pid, {}).get("hash") != e["hash"]]
        errors += [f"{pid}: {e['audio']} missing" for pid, e in old.items() if e.get("audio") and not (MOCKUPS / e["audio"]).exists()]
        errors += [f"{pid}: audio was made for older text" for pid, e in old.items() if e.get("audio") and e.get("audioHash") != e["hash"]]
        for e in errors:
            print("FAIL", e)
        print(f"{len(old)} stories, {sum(1 for e in old.values() if e.get('audio'))} with audio, {len(errors)} errors")
        return 1 if errors else 0
    for pid, e in new.items():   # keep audio that still matches its text
        prev = old.get(pid, {})
        if prev.get("audio") and prev.get("audioHash") == e["hash"] and (MOCKUPS / prev["audio"]).exists():
            e.update(audio=prev["audio"], audioHash=prev["audioHash"], seconds=prev.get("seconds"), bytes=prev.get("bytes"),
                     voice=prev.get("voice"))
    if "--force" in argv and only:   # redo these pieces (e.g. to move them to another voice): treat their audio as missing
        for pid in only & set(new):
            new[pid].update(audio=None, audioHash=None, seconds=None, bytes=None, voice=None)
    if "--scripts" in argv:
        d = Path(argv[argv.index("--scripts") + 1]); d.mkdir(parents=True, exist_ok=True)
        todo = [(pid, e) for pid, e in new.items() if not e["audio"] and (not only or pid in only)]
        for pid, e in todo:
            (d / slug(pid, lang).replace(".m4a", ".txt")).write_text(e["text"] + "\n")
        print(f"{len(todo)} scripts in {d}")
        return 0
    if "--import" in argv:
        d = Path(argv[argv.index("--import") + 1])
        voice = argv[argv.index("--voice") + 1] if "--voice" in argv else "imported"
        for pid, e in new.items():
            if e["audio"] or (only and pid not in only):
                continue
            key_ = re.sub(r"[^a-z0-9]", "", slug(pid, lang)[:-4].lower())   # export tools drop dots and slashes from names
            src = next((f for f in sorted(d.iterdir()) if f.suffix.lower() in (".mp3", ".wav", ".m4a", ".mp4")
                        and re.sub(r"[^a-z0-9]", "", f.stem.lower()) == key_), None)
            if not src:
                continue
            dest = AUDIO / slug(pid, lang)
            with tempfile.TemporaryDirectory() as tmp:   # decode (also the audio track of an .mp4) to mono WAV, then AAC
                wav = Path(tmp) / "a.wav"
                subprocess.run(["afconvert", str(src), str(wav), "-f", "WAVE", "-d", "LEI16@24000", "-c", "1", "--mix"], check=True)
                subprocess.run(["afconvert", str(wav), str(dest), "-f", "m4af", "-d", "aac", "-b", "48000", "-c", "1"], check=True)
            info = subprocess.run(["afinfo", str(dest)], capture_output=True, text=True).stdout
            sec = round(float(re.search(r"estimated duration: ([\d.]+)", info).group(1)), 1)
            e.update(audio=str(dest.relative_to(MOCKUPS)), audioHash=e["hash"], seconds=sec, bytes=dest.stat().st_size, voice=voice)
            print(f"{pid}: imported {src.name}, {sec} s, {dest.stat().st_size // 1024} KB")
    if "--audio" in argv:
        AUDIO.mkdir(parents=True, exist_ok=True)
        api_key = key()
        for pid, e in new.items():
            if (only and pid not in only) or e["audio"]:
                continue
            dest = AUDIO / slug(pid, lang)
            print(f"{pid}: narrating {len(e['text'])} chars")
            pcm, rate = tts(e["text"], api_key)
            if pcm is None:
                print("  quota spent for today: stopping; rerun later and only the missing files are made")
                break
            seconds = encode(pcm, rate, dest)
            e.update(audio=str(dest.relative_to(MOCKUPS)), audioHash=e["hash"], seconds=seconds, bytes=dest.stat().st_size,
                     voice=f"gemini:{MODEL}:{VOICE}")
            print(f"  {dest.name}: {seconds} s, {dest.stat().st_size // 1024} KB")
            save(new)   # after every file, so a stop keeps what is done
            time.sleep(7)   # stay under the free tier's requests per minute
    save(new)
    print(f"{len(new)} stories ({sum(1 for e in new.values() if not e['draft'])} by the curator), "
          f"{sum(1 for e in new.values() if e['audio'])} with audio")
    return 0


def save(new):
    doc = {"version": 1, "about": "H3: story text and narration per piece, built by tools/narration.py from questions.json "
           "(the curator) and records.json (MoMu). Derived file: edit the sources, then rerun the script.",
           "voices": "per piece in `voice`: gemini:<model>:<voice> or picsart:<voice>", "pieces": new}
    OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
