import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..");
const source = (...segments: string[]) => readFileSync(resolve(root, ...segments), "utf8");

describe("v10 Today・習慣タブのカード仕様統一", () => {
  it("Todayの習慣カードは習慣タブと同じ必須・週次・進捗・完了状態を持つ", () => {
    const today = source("app", "(tabs)", "index.tsx");
    const habits = source("app", "(tabs)", "habits.tsx");

    [today, habits].forEach((screen) => {
      expect(screen).toContain("weeklyHabitProgress");
      expect(screen).toContain("HabitProgressControl");
      expect(screen).toContain('label={t("必須", "Must-do")}');
      expect(screen).toContain("isHabitCompleteOn");
      expect(screen).toContain("onProgress");
      expect(screen).toContain("onStartTimer");
      expect(screen).toContain("startHabitTimer");
    });
    expect(today).toContain("todayWeekRow");
    expect(today).toContain("todayHabitTitleDone");
    expect(today).toContain("adjustHabitProgress");
    expect(today).toContain("onToggle={(date) => handleHabitToggle(item.habit.id, date)}");
  });
});
