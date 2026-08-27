import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import type { Habit } from "../lib/focus-flow/types";
import { getHabitTimerProgress, habitProgressLabel, isHabitCompleteOn } from "../lib/focus-flow/utils";

const root = resolve(__dirname, "..");
const source = (...segments: string[]) => readFileSync(resolve(root, ...segments), "utf8");
const date = "2026-08-27";
const startedAt = "2026-08-27T10:00:00.000Z";
const timedHabit: Habit = { id: "run", title: "ランニング", color: "#16725C", goalPerWeek: 5, isRequired: true, completedDates: [], progressUnit: "minutes", targetValue: 30, timerStartedAtByDate: { [date]: startedAt }, createdAt: startedAt };

describe("v14 時間型Habitの計測・完了・Widget契約", () => {
  it("開始時刻から秒単位の経過と完了時刻を導出し、dailyProgressの0表示に依存しない", () => {
    expect(getHabitTimerProgress(timedHabit, date, new Date("2026-08-27T10:05:07.000Z"))).toMatchObject({ started: true, running: true, ready: false, elapsedSeconds: 307, remainingSeconds: 1493, label: "05:07 / 30:00" });
    expect(habitProgressLabel(timedHabit, date)).toBe("00:00 / 30:00");
    expect(isHabitCompleteOn(timedHabit, date, new Date("2026-08-27T10:30:00.000Z"))).toBe(true);
  });

  it("本体のTodayとHabitは開始専用コントロールを共通利用し、時間型を±操作として描画しない", () => {
    const today = source("app", "(tabs)", "index.tsx");
    const habits = source("app", "(tabs)", "habits.tsx");
    [today, habits].forEach((screen) => {
      expect(screen).toContain("HabitProgressControl");
      expect(screen).toContain("startHabitTimer");
      expect(screen).not.toContain("habitProgressLabel");
      expect(screen).toContain("onPressIn={(event) => event.stopPropagation()}");
    });
    const control = source("components", "focus-flow", "habit-progress-control.tsx");
    expect(control).toContain('unit === "minutes"');
    expect(control).toContain('name={timer.running ? "timer" : "play-arrow"}');
    expect(control).toContain("timer.label");
  });

  it("Widgetの中・大サイズで時間型の開始／計測中を表示し、未達成チェックはToday遷移にしない", () => {
    const provider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    const gate = source("plugins", "native", "android", "kotlin", "FocusGateModule.kt");
    const bridge = source("lib", "focus-flow", "android-gate.ts");
    expect(provider).toContain("WidgetBucket(2, true, false)");
    expect(provider).toContain("WidgetBucket(3, true, false)");
    expect(provider).toContain("R.drawable.focus_flow_widget_check_empty");
    expect(provider).toContain("noOpIntent(context, widgetId, ids.position, itemId, kind)");
    expect(provider).toContain("ACTION_NOOP");
    expect(provider).toContain('"計測中"');
    expect(provider).not.toContain("if (timedLocked) R.drawable.focus_flow_widget_check_locked");
    expect(gate).toContain('action.optString("startedAt")');
    expect(bridge).toContain("timerElapsedSeconds");
    expect(bridge).toContain("type WidgetAction");
  });
});
