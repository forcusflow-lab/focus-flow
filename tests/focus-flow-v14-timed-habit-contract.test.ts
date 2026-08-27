import fs from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import type { Habit } from "../lib/focus-flow/types";
import { getHabitTimerProgress, isHabitCompleteOn, isHabitTimeReady } from "../lib/focus-flow/utils";

const root = resolve(__dirname, "..");
const source = (...segments: string[]) => fs.readFileSync(resolve(root, ...segments), "utf8");
const date = "2026-08-27";
const startedAt = "2026-08-27T10:00:00.000Z";
const runningHabit: Habit = { id: "run", title: "ランニング", color: "#16725C", goalPerWeek: 5, isRequired: true, completedDates: [], progressUnit: "minutes", targetValue: 30, timerStartedAtByDate: { [date]: startedAt }, timerElapsedSecondsByDate: {}, createdAt: startedAt };
const pausedHabit: Habit = { ...runningHabit, timerStartedAtByDate: {}, timerElapsedSecondsByDate: { [date]: 307 } };

describe("v15 時間型Habitの計測・手動完了・Widget契約", () => {
  it("実時間と停止済み時間を合算し、停止中は経過せず再開可能な状態を導出する", () => {
    expect(getHabitTimerProgress(runningHabit, date, new Date("2026-08-27T10:05:07.000Z"))).toMatchObject({ started: true, running: true, paused: false, ready: false, elapsedSeconds: 307, remainingSeconds: 1493, label: "05:07 / 30:00" });
    expect(getHabitTimerProgress(pausedHabit, date, new Date("2026-08-27T11:10:00.000Z"))).toMatchObject({ started: true, running: false, paused: true, ready: false, elapsedSeconds: 307, label: "05:07 / 30:00" });
    expect(isHabitTimeReady(runningHabit, date, new Date("2026-08-27T10:30:00.000Z"))).toBe(true);
    expect(isHabitCompleteOn(runningHabit, date, new Date("2026-08-27T10:30:00.000Z"))).toBe(false);
  });

  it("本体のTodayとHabitは手動完了を維持しつつ、共通の開始・停止・再開コントロールを利用する", () => {
    const today = source("app", "(tabs)", "index.tsx");
    const habits = source("app", "(tabs)", "habits.tsx");
    [today, habits].forEach((screen) => {
      expect(screen).toContain("HabitProgressControl");
      expect(screen).toContain("startHabitTimer");
      expect(screen).toContain("pauseHabitTimer");
      expect(screen).toContain("onPauseTimer");
      expect(screen).toContain("onPressIn={(event) => event.stopPropagation()}");
    });
    const control = source("components", "focus-flow", "habit-progress-control.tsx");
    expect(control).toContain('unit === "minutes"');
    expect(control).toContain("timer.paused");
    expect(control).toContain('name={timer.running ? "pause" : "play-arrow"}');
    expect(control).toContain("onPauseTimer");
    const state = source("lib", "focus-flow", "provider.tsx");
    expect(state).toContain("timerElapsedSecondsByDate");
    expect(state).toContain("const pauseHabitTimer");
    expect(state).toContain("habit.completedDates.includes(date)");
  });

  it("Widgetの全Habitで手動完了を許可し、時間型は開始・停止・再開と保存済み経過を扱う", () => {
    const provider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    const gate = source("plugins", "native", "android", "kotlin", "FocusGateModule.kt");
    const bridge = source("lib", "focus-flow", "android-gate.ts");
    expect(provider).toContain("ACTION_TIMER_PAUSE");
    expect(provider).toContain('"timer_pause"');
    expect(provider).toContain("timerPaused");
    expect(provider).toContain("timerElapsedSeconds");
    expect(provider).toContain('if (english) "Timing" else "計測中"');
    expect(provider).toContain("一時停止 $timerClock");
    expect(provider).toContain("item.put(\"timerStartedAtMillis\"");
    expect(provider).toContain("setChronometer(ids.chronometer");
    expect(gate).toContain('action.takeIf { it.has("elapsedSeconds") }');
    expect(bridge).toContain('"timer_pause"');
    expect(bridge).toContain("timerPaused: timer.paused");
    expect(bridge).toContain("canToggle: true");
  });
});
