from pathlib import Path

from PIL import Image


SOURCE = Path("/home/ubuntu/webdev-static-assets/focus-flow-feature-graphic-16x9.png")
DESTINATION = Path("/home/ubuntu/focus-flow/release/store-assets/focus-flow-feature-graphic-1024x500.png")
TARGET_WIDTH = 1024
TARGET_HEIGHT = 500


def main() -> None:
    image = Image.open(SOURCE).convert("RGB")
    source_width, source_height = image.size
    target_ratio = TARGET_WIDTH / TARGET_HEIGHT
    cropped_height = round(source_width / target_ratio)
    if cropped_height > source_height:
        raise ValueError("Source image is too narrow for the required crop.")

    top = (source_height - cropped_height) // 2
    cropped = image.crop((0, top, source_width, top + cropped_height))
    resized = cropped.resize((TARGET_WIDTH, TARGET_HEIGHT), Image.Resampling.LANCZOS)
    DESTINATION.parent.mkdir(parents=True, exist_ok=True)
    resized.save(DESTINATION, format="PNG", optimize=True)
    print(f"Wrote {DESTINATION} ({TARGET_WIDTH}x{TARGET_HEIGHT})")


if __name__ == "__main__":
    main()
