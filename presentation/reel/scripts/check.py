"""Measures a rendered reel against style.md: dead spots (nothing changes for over 1 s) and too-busy moments
(most of the picture changing without a scene cut). Frames every 0.5 s via Remotion's bundled ffmpeg.
Run from presentation/reel/: python3 -I scripts/check.py reels/<name>/<name>.mp4 [scene cut seconds...]"""
import subprocess, sys

video, cuts = sys.argv[1], [float(x) for a in sys.argv[2:] for x in a.split()]
W, H = 96, 54
import glob, os, shutil, struct, zlib, tempfile

def png_gray(path):
    """decodes an 8-bit grayscale, non-interlaced PNG (what ffmpeg writes here) with the standard library"""
    d = open(path, "rb").read(); i, idat, w, h = 8, b"", 0, 0
    while i < len(d):
        ln, typ = struct.unpack(">I4s", d[i:i + 8]); body = d[i + 8:i + 8 + ln]; i += 12 + ln
        if typ == b"IHDR": w, h = struct.unpack(">II", body[:8])
        elif typ == b"IDAT": idat += body
    data, out, prev = zlib.decompress(idat), bytearray(), bytearray(w)
    for y in range(h):
        f, row = data[y * (w + 1)], bytearray(data[y * (w + 1) + 1:(y + 1) * (w + 1)])
        for x in range(w):
            a_ = row[x - 1] if x else 0; b_ = prev[x]; c_ = prev[x - 1] if x else 0
            if f == 1: row[x] = (row[x] + a_) & 255
            elif f == 2: row[x] = (row[x] + b_) & 255
            elif f == 3: row[x] = (row[x] + (a_ + b_) // 2) & 255
            elif f == 4:
                pa, pb, pc = abs(b_ - c_), abs(a_ - c_), abs(a_ + b_ - 2 * c_)
                row[x] = (row[x] + (a_ if pa <= pb and pa <= pc else b_ if pb <= pc else c_)) & 255
        out += row; prev = row
    return bytes(out)

tmp = tempfile.mkdtemp()
r = subprocess.run(["npx", "remotion", "ffmpeg", "-y", "-loglevel", "error", "-i", video, "-r", "2", "-vf", f"scale={W}:{H},format=gray",
                    "-c:v", "png", os.path.join(tmp, "f%04d.png")], capture_output=True, text=True)
if r.returncode: sys.exit(r.stderr or r.stdout)
frames = [png_gray(f) for f in sorted(glob.glob(os.path.join(tmp, "*.png")))]
shutil.rmtree(tmp)
n = W * H
print(f"{len(frames)} samples ({len(frames) / 2:.1f} s)")
still, dead, busy = 0, [], []
for i in range(1, len(frames)):
    a, b = frames[i - 1], frames[i]
    changed = sum(1 for x, y in zip(a, b) if abs(x - y) > 12) / n
    t = i / 2
    near_cut = any(abs(t - c) <= 0.5 for c in cuts)
    still = still + 1 if changed < 0.002 else 0
    if still >= 3: dead.append(t)            # 3 half-second steps without change: over 1 s still
    if changed > 0.5 and not near_cut: busy.append((t, round(changed, 2)))
print("dead spots (s):", dead or "none")
print("too busy (s, share changed):", busy or "none")
