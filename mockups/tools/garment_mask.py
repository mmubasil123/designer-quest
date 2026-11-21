"""Cut the garment out of a museum photo: RGBA PNG whose alpha keeps only the slot's clothing.

Usage: .venv/bin/python -I mockups/tools/garment_mask.py <photo> <slot> <out.png>
Runs mattmdjaga/segformer_b2_clothes locally (the HF token has no Inference Providers access).
Mannequin neck, arms, legs, stand and backdrop are never kept; exits non-zero on an empty mask.
"""
import sys
from functools import lru_cache

import numpy as np
import torch
from PIL import Image
from transformers import AutoModelForSemanticSegmentation, SegformerImageProcessor

MODEL = "mattmdjaga/segformer_b2_clothes"
CLOTHING = {"Upper-clothes", "Dress", "Skirt", "Pants", "Belt", "Scarf", "Hat"}
SHOES = {"Left-shoe", "Right-shoe"}
KEEP = {
    "top": CLOTHING - {"Pants", "Skirt"},
    "bottom": {"Pants", "Skirt", "Belt"},
    "feet": SHOES,
    "full": CLOTHING,
}


@lru_cache(maxsize=1)
def _model():
    return SegformerImageProcessor.from_pretrained(MODEL), AutoModelForSemanticSegmentation.from_pretrained(MODEL).eval()


def garment_mask(src: str, slot: str, out: str) -> None:
    if slot not in KEEP:
        sys.exit(f"unknown slot {slot!r}: use {', '.join(KEEP)}")
    proc, model = _model()
    img = Image.open(src).convert("RGB")
    with torch.no_grad():
        logits = model(**proc(images=img, return_tensors="pt")).logits
    up = torch.nn.functional.interpolate(logits, size=img.size[::-1], mode="bilinear", align_corners=False)
    labels = up.argmax(dim=1)[0].numpy()
    ids = [i for i, name in model.config.id2label.items() if name in KEEP[slot]]
    mask = np.isin(labels, ids)
    if not mask.any():
        raise ValueError(f"empty {slot} mask for {src}: no {sorted(KEEP[slot])} pixels found")
    rgba = np.dstack([np.asarray(img), mask.astype(np.uint8) * 255])
    Image.fromarray(rgba, "RGBA").save(out)
    print(f"saved {out} ({mask.mean():.0%} of pixels)")


if __name__ == "__main__":
    try:
        garment_mask(*sys.argv[1:4])
    except ValueError as e:
        sys.exit(str(e))
