import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const root = path.resolve(__dirname, "..");
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf-8");

describe("v40 – Phase 1 Micro-interactions", () => {
  it("safeHaptic supports medium type", () => {
    const src = read("components/focus-flow/ui.tsx");
    expect(src).toContain('"medium"');
    expect(src).toContain("ImpactFeedbackStyle.Medium");
  });

  it("TodoItemCard has scale bounce animation on check", () => {
    const src = read("components/focus-flow/item-cards.tsx");
    expect(src).toContain("scaleAnim");
    expect(src).toContain("Animated.sequence");
    expect(src).toContain("Animated.spring");
  });

  it("TodoItemCard has opacity fade for completed title", () => {
    const src = read("components/focus-flow/item-cards.tsx");
    expect(src).toContain("opacityAnim");
    expect(src).toContain("textDecorationLine");
  });

  it("HabitItemCard has animated mini progress bar for count habits", () => {
    const src = read("components/focus-flow/item-cards.tsx");
    expect(src).toContain("miniProgressTrack");
    expect(src).toContain("miniProgressFill");
    expect(src).toContain("progressAnim");
  });

  it("HabitProgressControl fires medium haptic on goal completion", () => {
    const src = read("components/focus-flow/habit-progress-control.tsx");
    expect(src).toContain("willComplete");
    expect(src).toContain('"medium"');
  });

  it("HabitProgressControl has scale bounce on plus button", () => {
    const src = read("components/focus-flow/habit-progress-control.tsx");
    expect(src).toContain("plusScaleAnim");
    expect(src).toContain("triggerPlusScale");
  });

  it("todos screen has AllDonePanel celebratory empty state", () => {
    const src = read("app/(tabs)/todos.tsx");
    expect(src).toContain("AllDonePanel");
    expect(src).toContain("allDoneStyles");
  });

  it("index screen progress bar is animated", () => {
    const src = read("app/(tabs)/index.tsx");
    expect(src).toContain("progressAnim");
    expect(src).toContain("Animated.View");
    expect(src).toContain("Easing.out");
  });

  it("index screen empty panel has entrance animation", () => {
    const src = read("app/(tabs)/index.tsx");
    expect(src).toContain("emptyScaleAnim");
    expect(src).toContain("emptyOpacityAnim");
  });
});
