import { describe, expect, it } from "vitest";

import { APP_THEMES } from "../lib/focus-flow/app-themes";

function luminance(hex: string) {
  const pairs = hex.replace("#", "").match(/.{2}/g) ?? [];
  const values = pairs.map((pair) => Number.parseInt(pair, 16) / 255).map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
}

function contrast(foreground: string, background: string) {
  const [bright, dark] = [luminance(foreground), luminance(background)].sort((left, right) => right - left);
  return (bright + 0.05) / (dark + 0.05);
}

describe("Focus Flow v18 theme contrast", () => {
  it("keeps primary text and supporting text readable on every visible app surface", () => {
    Object.values(APP_THEMES).forEach(({ light, dark }) => {
      [light, dark].forEach((palette) => {
        [palette.background, palette.surface, palette.elevated, palette.primarySoft].forEach((surface) => {
          expect(contrast(palette.text, surface)).toBeGreaterThanOrEqual(4.5);
          expect(contrast(palette.muted, surface)).toBeGreaterThanOrEqual(3.7);
        });
      });
    });
  });

  it("keeps the active primary color distinct from each neutral surface", () => {
    Object.values(APP_THEMES).forEach(({ light, dark }) => {
      [light, dark].forEach((palette) => {
        [palette.background, palette.surface, palette.elevated].forEach((surface) => {
          expect(contrast(palette.primary, surface)).toBeGreaterThanOrEqual(2.8);
        });
      });
    });
  });
});
