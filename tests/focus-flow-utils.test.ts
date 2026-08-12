import { describe, expect, it } from "vitest";

import type { Habit } from "../lib/focus-flow/types";
import { dayKey, habitStreak, weeklyHabitProgress, weeklyFocusMinutes } from "../lib/focus-flow/utils";

const base = new Date(2026, 7, 13, 12, 0, 0);

describe("Focus Flowの日付・習慣計算", () => {
  it("ローカル日付をYYYY-MM-DD形式で生成する", () => {
    expect(dayKey(base)).toBe("2026-08-13");
  });

  it("連続した習慣記録からストリークを返す", () => {
    const habit: Habit = { id: "h-1", title: "読書", color: "#246B5A", goalPerWeek: 5, createdAt: "2026-08-10T00:00:00.000Z", completedDates: ["2026-08-11", "2026-08-12", "2026-08-13"] };
    expect(habitStreak(habit, base)).toBe(3);
  });

  it("週目標に対する達成率を上限1で計算する", () => {
    const habit: Habit = { id: "h-1", title: "読書", color: "#246B5A", goalPerWeek: 3, createdAt: "2026-08-10T00:00:00.000Z", completedDates: ["2026-08-09", "2026-08-10", "2026-08-11", "2026-08-12", "2026-08-13"] };
    expect(weeklyHabitProgress(habit, base)).toEqual({ completed: 5, target: 3, ratio: 1 });
  });

  it("完了済み集中セッションを曜日別に集計する", () => {
    const sessions = [
      { id: "f-1", startedAt: "2026-08-13T01:00:00.000Z", durationMinutes: 25, completed: true },
      { id: "f-2", startedAt: "2026-08-13T02:00:00.000Z", durationMinutes: 25, completed: false },
    ];
    expect(weeklyFocusMinutes(sessions, base).at(-1)).toEqual({ key: "2026-08-13", minutes: 25 });
  });
});
