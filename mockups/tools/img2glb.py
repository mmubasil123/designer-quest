"""Turn one garment photo into a textured GLB via the public TRELLIS Hugging Face Space.

Usage: .venv/bin/python -I mockups/tools/img2glb.py <photo.jpg> <out.glb>
Reads HF_TOKEN from the project .env (anonymous ZeroGPU quota is too small for one run).
Refuses to run without a token rather than burning the anonymous quota on a doomed request.
"""
import os
import shutil
import sys
from pathlib import Path

from gradio_client import Client, handle_file

ENV = Path(__file__).resolve().parents[2] / ".env"


def hf_token() -> str:
    if ENV.exists():
        for line in ENV.read_text().splitlines():
            if line.startswith("HF_TOKEN="):
                return line.split("=", 1)[1].strip()
    sys.exit(f"HF_TOKEN missing: add it to {ENV} (chmod 600)")


def main(src: str, out: str) -> None:
    c = Client("trellis-community/TRELLIS", token=hf_token(), verbose=False)
    c.predict(api_name="/start_session")
    pre = c.predict(image=handle_file(src), api_name="/preprocess_image")  # removes the backdrop
    _, _, glb = c.predict(
        image=handle_file(pre), multiimages=[], seed=0,
        ss_guidance_strength=7.5, ss_sampling_steps=12, slat_guidance_strength=3, slat_sampling_steps=12,
        multiimage_algo="stochastic", mesh_simplify=0.95, texture_size=1024,
        api_name="/generate_and_extract_glb",
    )
    # write beside the target, then rename: batch_glb skips any existing file, so a half-written GLB would stick
    shutil.copy(glb if isinstance(glb, str) else glb["value"], f"{out}.tmp")
    os.replace(f"{out}.tmp", out)
    print(f"saved {out}")


if __name__ == "__main__":
    main(*sys.argv[1:3])
