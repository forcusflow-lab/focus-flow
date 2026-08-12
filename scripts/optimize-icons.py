from pathlib import Path

from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ICON_PATHS = [
    PROJECT_ROOT / "assets/images/icon.png",
    PROJECT_ROOT / "assets/images/splash-icon.png",
    PROJECT_ROOT / "assets/images/favicon.png",
    PROJECT_ROOT / "assets/images/android-icon-foreground.png",
]

for icon_path in ICON_PATHS:
    with Image.open(icon_path) as source:
        image = source.convert("RGBA")
        image.thumbnail((512, 512), Image.Resampling.LANCZOS)
        image.save(icon_path, "PNG", optimize=True, compress_level=9)
        print(f"optimized {icon_path.name}: {image.size[0]}x{image.size[1]}")
