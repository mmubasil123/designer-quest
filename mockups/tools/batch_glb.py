"""Make a GLB for every unlocked piece in second-skin.html that lacks one.

Usage: .venv/bin/python -I mockups/tools/batch_glb.py
Reads mockups/pieces.json, the manifest the page also loads, so the piece list lives in one place.
Cuts the garment out of each photo first (garment_mask.py, by slot) and feeds that PNG to TRELLIS.
Writes mockups/assets/<id>.glb ("/" in an id becomes "_"); skips pieces whose GLB exists,
so a run cut short by the Hugging Face GPU quota resumes where it stopped.
"""
import json
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from garment_mask import garment_mask  # noqa: E402
from img2glb import main as img2glb  # noqa: E402

MOCKUPS = Path(__file__).resolve().parents[1]
def pieces():
    """Unlocked pieces from the manifest (mockups/pieces.json), the same file the page loads."""
    manifest = json.loads((MOCKUPS / "pieces.json").read_text())
    return [p for p in manifest["pieces"] if not p["locked"] and p["assets"]["glb"]]   # splat pieces get no GLB


def run():
    failed = []
    for p in pieces():
        pid, slot, sha = p["id"], p["slot"], p["source"]["imgSha"]
        name = pid.replace("/", "_")
        out = MOCKUPS / "assets" / f"{name}.glb"
        if out.exists():
            print(f"skip {pid}: {out.name} exists")
            continue
        src = MOCKUPS / "assets" / "src" / f"{name}.jpg"
        if not src.exists():
            urllib.request.urlretrieve(f"https://heron.libis.be/momu/files/large/{sha}.jpg", f"{src}.tmp")
            Path(f"{src}.tmp").replace(src)
        print(f"{pid}: generating", flush=True)
        try:
            if p["pipeline"]["cutout"] == "none":   # segformer drops shoes and the kimono's sleeves
                img2glb(str(src), str(out))
            else:
                cut = MOCKUPS / "assets" / "src" / f"{name}_garment.png"
                garment_mask(str(src), slot, str(cut))
                img2glb(str(cut), str(out))
        except Exception as e:  # one refused run (quota, Space busy) must not stop the batch
            failed.append(pid)
            print(f"{pid}: FAILED {e}", flush=True)
    if failed:
        sys.exit(f"failed: {', '.join(failed)} (rerun to retry)")


if __name__ == "__main__":
    run()
