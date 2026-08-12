import { describe, expect, it } from "vitest";

import type { FocusFlowData, GateSchedule, Habit } from "../lib/focus-flow/types";
import { dayKey, getGateRuleSummaries, getGateSummary, habitStreak, isScheduleActive, weeklyHabitProgress, weeklyFocusMinutes } from "../lib/focus-flow/utils";

const base = new Date(2026, 7, 13, 12, 0, 0);

describe("Focus Flowの日付・習慣計算", () => {
  it("ローカル日付をYYYY-MM-DD形式で生成する", () => {
    expect(dayKey(base)).toBe("2026-08-13");
  });

  it("連続した習慣記録からストリークを返す", () => {
    const habit: Habit = { id: "h-1", title: "読書", color: "#246B5A", goalPerWeek: 5, isRequired: false, createdAt: "2026-08-10T00:00:00.000Z", completedDates: ["2026-08-11", "2026-08-12", "2026-08-13"] };
    expect(habitStreak(habit, base)).toBe(3);
  });

  it("週目標に対する達成率を上限1で計算する", () => {
    const habit: Habit = { id: "h-1", title: "読書", color: "#246B5A", goalPerWeek: 3, isRequired: false, createdAt: "2026-08-10T00:00:00.000Z", completedDates: ["2026-08-09", "2026-08-10", "2026-08-11", "2026-08-12", "2026-08-13"] };
    expect(weeklyHabitProgress(habit, base)).toEqual({ completed: 5, target: 3, ratio: 1 });
  });

  it("完了済み集中セッションを曜日別に集計する", () => {
    const sessions = [
      { id: "f-1", startedAt: "2026-08-13T01:00:00.000Z", durationMinutes: 25, completed: true },
      { id: "f-2", startedAt: "2026-08-13T02:00:00.000Z", durationMinutes: 25, completed: false },
    ];
    expect(weeklyFocusMinutes(sessions, base).at(-1)).toEqual({ key: "2026-08-13", minutes: 25 });
  });

  it("必須にしたTodo・習慣だけを集中制限の未完了数へ反映する", () => {
    const data: FocusFlowData = {
      todos: [
        { id: "t-required", title: "必須Todo", priority: "high", isRequired: true, completed: false, createdAt: "2026-08-13T00:00:00.000Z" },
        { id: "t-normal", title: "通常Todo", priority: "low", isRequired: false, completed: false, createdAt: "2026-08-13T00:00:00.000Z" },
      ],
      habits: [
        { id: "h-required", title: "必須習慣", color: "#246B5A", goalPerWeek: 5, isRequired: true, createdAt: "2026-08-10T00:00:00.000Z", completedDates: [] },
        { id: "h-normal", title: "通常習慣", color: "#315B8C", goalPerWeek: 3, isRequired: false, createdAt: "2026-08-10T00:00:00.000Z", completedDates: ["2026-08-13"] },
      ],
      focusSessions: [],
      gateConfig: { enabled: true, blockedPackages: ["com.example.video"], requiredTodoIds: [], requiredHabitIds: [], autoRequireDueToday: true, schedules: [] },
      displaySettings: { fontScale: "standard", theme: "mist", cardOpacity: "solid" },
    };
    expect(getGateSummary(data, base)).toMatchObject({ pendingTodos: 1, pendingHabits: 1, pendingCount: 2 });
  });

  it("曜日と開始・終了時刻に応じて集中ルールを有効にする", () => {
    const schedule: GateSchedule = { id: "weekday", label: "平日", enabled: true, days: [1, 2, 3, 4, 5], startTime: "09:00", endTime: "18:00" };
    expect(isScheduleActive(schedule, new Date(2026, 7, 10, 10, 0, 0))).toBe(true);
    expect(isScheduleActive(schedule, new Date(2026, 7, 10, 18, 0, 0))).toBe(false);
    expect(isScheduleActive(schedule, new Date(2026, 7, 9, 10, 0, 0))).toBe(false);
  });

  it("日をまたぐ時間帯は翌日未明まで有効にする", () => {
    const schedule: GateSchedule = { id: "night", label: "夜", enabled: true, days: [1], startTime: "22:00", endTime: "06:00" };
    expect(isScheduleActive(schedule, new Date(2026, 7, 10, 23, 0, 0))).toBe(true);
    expect(isScheduleActive(schedule, new Date(2026, 7, 11, 5, 30, 0))).toBe(true);
    expect(isScheduleActive(schedule, new Date(2026, 7, 11, 6, 0, 0))).toBe(false);
  });

  it("時間帯ごとに制限アプリは変えられるが、解除条件は必須項目に統一する", () => {
    const data: FocusFlowData = {
      todos: [
        { id: "t-morning", title: "必須Todo", priority: "high", isRequired: true, completed: false, createdAt: "2026-08-10T00:00:00.000Z" },
        { id: "t-work", title: "通常Todo", priority: "medium", isRequired: false, completed: false, createdAt: "2026-08-10T00:00:00.000Z" },
      ],
      habits: [{ id: "h-morning", title: "必須習慣", color: "#246B5A", goalPerWeek: 5, isRequired: true, createdAt: "2026-08-10T00:00:00.000Z", completedDates: [] }],
      focusSessions: [],
      gateConfig: {
        enabled: true, blockedPackages: [], requiredTodoIds: [], requiredHabitIds: [], autoRequireDueToday: true,
        schedules: [
          { id: "morning", label: "朝の準備", enabled: true, days: [1], startTime: "06:00", endTime: "09:00", requiredTodoIds: ["t-work"], requiredHabitIds: [], blockedPackages: ["com.example.news"] },
          { id: "work", label: "日中の作業", enabled: true, days: [1], startTime: "09:00", endTime: "18:00", requiredTodoIds: ["t-work"], requiredHabitIds: [], blockedPackages: ["com.example.video"] },
        ],
      },
      displaySettings: { fontScale: "standard", theme: "mist", cardOpacity: "solid" },
    };
    const morning = new Date(2026, 7, 10, 7, 30, 0);
    expect(getGateSummary(data, morning)).toMatchObject({ pendingTodos: 1, pendingHabits: 1, pendingCount: 2 });
    expect(getGateRuleSummaries(data, morning).filter((rule) => rule.isActive)[0]).toMatchObject({ label: "朝の準備", blockedPackages: ["com.example.news"] });
    const daytime = new Date(2026, 7, 10, 10, 0, 0);
    expect(getGateSummary(data, daytime)).toMatchObject({ pendingTodos: 1, pendingHabits: 1, pendingCount: 2 });
    expect(getGateRuleSummaries(data, daytime).filter((rule) => rule.isActive)[0]).toMatchObject({ label: "日中の作業", blockedPackages: ["com.example.video"] });
  });

  it("登録時に必須にしたTodo・習慣は日課ルールに追加しなくても基本解除条件になる", () => {
    const data: FocusFlowData = {
      todos: [{ id: "t-core", title: "薬を飲む", priority: "high", isRequired: true, completed: false, createdAt: "2026-08-13T00:00:00.000Z" }],
      habits: [{ id: "h-optional", title: "散歩", color: "#246B5A", goalPerWeek: 3, isRequired: false, createdAt: "2026-08-10T00:00:00.000Z", completedDates: [] }],
      focusSessions: [],
      gateConfig: { enabled: true, blockedPackages: ["com.example.video"], requiredTodoIds: [], requiredHabitIds: [], autoRequireDueToday: true, schedules: [] },
      displaySettings: { fontScale: "standard", theme: "mist", cardOpacity: "solid" },
    };
    expect(getGateSummary(data, base)).toMatchObject({ pendingTodos: 1, pendingHabits: 0, pendingCount: 1 });
  });

  it("期限当日の未完了Todoだけを自動で必須にし、期限翌日・期限超過・完了済みを混同しない", () => {
    const data: FocusFlowData = {
      todos: [
        { id: "t-today", title: "今日が期限", priority: "high", dueDate: "2026-08-13", isRequired: false, completed: false, createdAt: "2026-08-10T00:00:00.000Z" },
        { id: "t-tomorrow", title: "明日が期限", priority: "medium", dueDate: "2026-08-14", isRequired: false, completed: false, createdAt: "2026-08-10T00:00:00.000Z" },
        { id: "t-overdue", title: "期限超過", priority: "high", dueDate: "2026-08-12", isRequired: false, completed: false, createdAt: "2026-08-10T00:00:00.000Z" },
        { id: "t-done", title: "完了済み", priority: "low", dueDate: "2026-08-13", isRequired: false, completed: true, completedAt: "2026-08-13T02:00:00.000Z", createdAt: "2026-08-10T00:00:00.000Z" },
      ],
      habits: [], focusSessions: [],
      gateConfig: { enabled: true, blockedPackages: ["com.example.video"], requiredTodoIds: [], requiredHabitIds: [], autoRequireDueToday: true, schedules: [] },
      displaySettings: { fontScale: "standard", theme: "mist", cardOpacity: "solid" },
    };
    expect(getGateSummary(data, base)).toMatchObject({ pendingTodos: 1, pendingHabits: 0, pendingCount: 1 });
    data.gateConfig.autoRequireDueToday = false;
    expect(getGateSummary(data, base)).toMatchObject({ pendingTodos: 0, pendingHabits: 0, pendingCount: 0 });
  });
});
