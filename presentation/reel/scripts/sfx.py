"""Writes the reel's few sound effects into public/sfx/ (git-ignored): short tones made in code, no downloads.
Run from presentation/reel/: python3 -I scripts/sfx.py"""
import math, os, struct, wave

RATE = 44100
os.makedirs("public/sfx", exist_ok=True)

def tone(name, notes, decay=18.0, vol=0.35):
    """notes: list of (start_s, freq_hz, length_s); each a sine with a soft attack and an exponential tail."""
    end = max(s + l for s, _, l in notes)
    buf = [0.0] * int(end * RATE)
    for start, f, length in notes:
        for i in range(int(length * RATE)):
            t = i / RATE
            env = min(1.0, t / 0.004) * math.exp(-decay * t)
            buf[int(start * RATE) + i] += vol * env * (math.sin(2 * math.pi * f * t) + 0.25 * math.sin(4 * math.pi * f * t))
    with wave.open(f"public/sfx/{name}.wav", "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, v)) * 32767)) for v in buf))

tone("tick", [(0, 1800, 0.08)], decay=60, vol=0.18)          # a year lands, a marker pops
tone("pop", [(0, 660, 0.18)], decay=28, vol=0.3)              # a tap, a phone screen
tone("miss", [(0, 220, 0.22)], decay=20, vol=0.3)             # "Earlier"
tone("win", [(0, 784, 0.5), (0.11, 1175, 0.6)], decay=7, vol=0.25)   # you won it, found, 255
tone("close", [(0, 392, 1.2), (0, 587, 1.2)], decay=3, vol=0.18)     # the end card
print("public/sfx ready")
