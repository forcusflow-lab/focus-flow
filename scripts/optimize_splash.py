from pathlib import Path

from PIL import Image


asset = Path("assets/images/splash-icon.png")

with Image.open(asset) as source:
    image = source.convert("RGBA")
    image.thumbnail((512, 512), Image.Resampling.LANCZOS)
    optimized = image.quantize(colors=128, method=Image.Quantize.FASTOCTREE)
    optimized.save(asset, format="PNG", optimize=True, compress_level=9)

print(f"optimized {asset} to {asset.stat().st_size} bytes")
