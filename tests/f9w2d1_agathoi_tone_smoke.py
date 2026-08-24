from PIL import Image
from pathlib import Path
import math

root = Path(__file__).resolve().parents[1]
agathoi = Image.open(root / "assets/ui/faction_skins/agathoi_kleos/material.webp").convert("RGB").resize((96, 144))
pixels = list(agathoi.getdata())
mean_luma = sum((0.2126*r + 0.7152*g + 0.0722*b) / 255.0 for r,g,b in pixels) / len(pixels)

# F9W2d original generated asset was ~0.81 mean luma.
# The hotfix should materially reduce that dominance while remaining a light/organic skin.
if not (0.45 <= mean_luma <= 0.62):
    raise SystemExit(f"Agathoi material luma out of hotfix range: {mean_luma:.4f}")

print(f"F9W2d1 Agathoi tone smoke: PASS (mean_luma={mean_luma:.4f})")
