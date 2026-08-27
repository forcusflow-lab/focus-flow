import { describe, expect, it } from "vitest";

import type { FocusFlowData, GateSchedule, Habit } from "../lib/focus-flow/types";
import { dayKey, getGateRuleSummaries, getGateSummary, habitStreak, isHabitCompleteOn, isHabitTimeReady, isItemRequiredDuringActiveGate, isScheduleActive, isTodoAchieved, nextRecurringDueDate, reorderSubtasks, weeklyHabitProgress, weeklyFocusMinutes } from "../lib/focus-flow/utils";

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
      memos: [],
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

  it("時間帯必須のTodo・習慣は選択した時間帯内だけ解除条件になる", () => {
    const evening: GateSchedule = { id: "evening", label: "夜の集中", enabled: true, days: [1], startTime: "19:00", endTime: "21:00" };
    const todo = { id: "t-evening", title: "復習", priority: "high" as const, isRequired: true, requiredWindowMode: "scheduled" as const, requiredScheduleIds: ["evening"], completed: false, createdAt: "2026-08-10T00:00:00.000Z" };
    const habit: Habit = { id: "h-evening", title: "読書", color: "#246B5A", goalPerWeek: 5, isRequired: true, requiredWindowMode: "scheduled", requiredScheduleIds: ["evening"], completedDates: [], createdAt: "2026-08-10T00:00:00.000Z" };
    const data: FocusFlowData = { todos: [todo], habits: [habit], memos: [], focusSessions: [], gateConfig: { enabled: true, blockedPackages: ["com.example.video"], requiredTodoIds: [], requiredHabitIds: [], autoRequireDueToday: false, schedules: [evening] }, displaySettings: { fontScale: "standard", theme: "mist", cardOpacity: "solid" } };
    const before = new Date(2026, 7, 10, 18, 59, 0);
    const during = new Date(2026, 7, 10, 19, 0, 0);
    const after = new Date(2026, 7, 10, 21, 0, 0);
    expect(isItemRequiredDuringActiveGate(todo, data.gateConfig, before)).toBe(false);
    expect(getGateSummary(data, before)).toMatchObject({ pendingCount: 0, message: "現在は制限時間外です" });
    expect(isItemRequiredDuringActiveGate(todo, data.gateConfig, during)).toBe(true);
    expect(getGateSummary(data, during)).toMatchObject({ pendingTodos: 1, pendingHabits: 1, pendingCount: 2 });
    expect(getGateSummary(data, after)).toMatchObject({ pendingCount: 0, message: "現在は制限時間外です" });
  });

  it("時間帯ごとに制限アプリは変えられるが、解除条件は必須項目に統一する", () => {
    const data: FocusFlowData = {
      todos: [
        { id: "t-morning", title: "必須Todo", priority: "high", isRequired: true, completed: false, createdAt: "2026-08-10T00:00:00.000Z" },
        { id: "t-work", title: "通常Todo", priority: "medium", isRequired: false, completed: false, createdAt: "2026-08-10T00:00:00.000Z" },
      ],
      habits: [{ id: "h-morning", title: "必須習慣", color: "#246B5A", goalPerWeek: 5, isRequired: true, createdAt: "2026-08-10T00:00:00.000Z", completedDates: [] }],
      memos: [],
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
    data.gateConfig.blockedPackages = ["com.example.global"];
    expect(getGateRuleSummaries(data, morning).filter((rule) => rule.isActive).find((rule) => rule.label === "朝の準備")).toMatchObject({ label: "朝の準備", blockedPackages: ["com.example.global", "com.example.news"] });
    const daytime = new Date(2026, 7, 10, 10, 0, 0);
    expect(getGateSummary(data, daytime)).toMatchObject({ pendingTodos: 1, pendingHabits: 1, pendingCount: 2 });
    expect(getGateRuleSummaries(data, daytime).filter((rule) => rule.isActive).find((rule) => rule.label === "日中の作業")).toMatchObject({ label: "日中の作業", blockedPackages: ["com.example.global", "com.example.video"] });
  });

  it("時間帯を追加しても常時に選んだアプリは終日有効なルールとして残す", () => {
    const data: FocusFlowData = { todos: [{ id: "t-core", title: "必須", priority: "high", isRequired: true, completed: false, createdAt: "2026-08-13T00:00:00.000Z" }], habits: [], memos: [], focusSessions: [], gateConfig: { enabled: true, blockedPackages: ["com.example.always"], requiredTodoIds: [], requiredHabitIds: [], autoRequireDueToday: true, schedules: [{ id: "morning", label: "朝", enabled: true, days: [1], startTime: "06:00", endTime: "09:00", blockedPackages: ["com.example.news"] }] }, displaySettings: { fontScale: "standard", theme: "mist", cardOpacity: "solid" } };
    const outsideSchedule = new Date(2026, 7, 10, 22, 0, 0);
    const alwaysRule = getGateRuleSummaries(data, outsideSchedule).find((rule) => rule.id === "always");
    expect(alwaysRule).toMatchObject({ isActive: true, blockedPackages: ["com.example.always"], pendingCount: 1 });
  });

  it("登録時に必須にしたTodo・習慣は日課ルールに追加しなくても基本解除条件になる", () => {
    const data: FocusFlowData = {
      todos: [{ id: "t-core", title: "薬を飲む", priority: "high", isRequired: true, completed: false, createdAt: "2026-08-13T00:00:00.000Z" }],
      habits: [{ id: "h-optional", title: "散歩", color: "#246B5A", goalPerWeek: 3, isRequired: false, createdAt: "2026-08-10T00:00:00.000Z", completedDates: [] }],
      memos: [],
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
      habits: [], memos: [], focusSessions: [],
      gateConfig: { enabled: true, blockedPackages: ["com.example.video"], requiredTodoIds: [], requiredHabitIds: [], autoRequireDueToday: true, schedules: [] },
      displaySettings: { fontScale: "standard", theme: "mist", cardOpacity: "solid" },
    };
    expect(getGateSummary(data, base)).toMatchObject({ pendingTodos: 1, pendingHabits: 0, pendingCount: 1 });
    data.gateConfig.autoRequireDueToday = false;
    expect(getGateSummary(data, base)).toMatchObject({ pendingTodos: 0, pendingHabits: 0, pendingCount: 0 });
  });

  it("必須Todoは時間目標とサブタスクの両方を満たすまで制限を解除しない", () => {
    const todo = { id: "t-progress", title: "報告書", priority: "high" as const, isRequired: true, completed: false, progressUnit: "minutes" as const, targetValue: 20, progressValue: 20, repeatRule: "none" as const, subtasks: [{ id: "s-1", title: "下書き", completed: false }], createdAt: "2026-08-13T00:00:00.000Z", timerStartedAt: "2026-08-13T01:00:00.000Z" };
    const data: FocusFlowData = { todos: [todo], habits: [], memos: [], focusSessions: [], gateConfig: { enabled: true, blockedPackages: [], requiredTodoIds: [], requiredHabitIds: [], autoRequireDueToday: true, schedules: [] }, displaySettings: { fontScale: "standard", theme: "mist", cardOpacity: "solid" } };
    expect(isTodoAchieved(todo)).toBe(false);
    expect(getGateSummary(data, base).pendingCount).toBe(1);
    todo.subtasks[0].completed = true;
    todo.completed = true;
    expect(isTodoAchieved(todo)).toBe(true);
    expect(getGateSummary(data, base).pendingCount).toBe(0);
  });

  it("必須習慣は回数目標に到達するまで制限を解除しない", () => {
    const habit: Habit = { id: "h-count", title: "水を飲む", color: "#246B5A", goalPerWeek: 5, isRequired: true, completedDates: [], progressUnit: "count", targetValue: 3, dailyProgress: { "2026-08-13": 2 }, createdAt: "2026-08-10T00:00:00.000Z" };
    const data: FocusFlowData = { todos: [], habits: [habit], memos: [], focusSessions: [], gateConfig: { enabled: true, blockedPackages: [], requiredTodoIds: [], requiredHabitIds: [], autoRequireDueToday: true, schedules: [] }, displaySettings: { fontScale: "standard", theme: "mist", cardOpacity: "solid" } };
    expect(getGateSummary(data, base).pendingCount).toBe(1);
    habit.dailyProgress!["2026-08-13"] = 3;
    expect(getGateSummary(data, base).pendingCount).toBe(0);
  });

  it("時間管理Todoは設定時間の経過前には完了扱いにしない", () => {
    const todo = { id: "t-timer", title: "読書", priority: "medium" as const, isRequired: true, completed: true, progressUnit: "minutes" as const, targetValue: 20, timerStartedAt: "2026-08-13T02:00:00.000Z", createdAt: "2026-08-13T00:00:00.000Z" };
    expect(isTodoAchieved(todo, new Date("2026-08-13T02:10:00.000Z"))).toBe(false);
    expect(isTodoAchieved(todo, new Date("2026-08-13T02:20:00.000Z"))).toBe(true);
    expect(isTodoAchieved({ ...todo, earlyCompletionAt: "2026-08-13T02:05:00.000Z" })).toBe(true);
  });

  it("時間管理習慣は計測時間を進捗として保持し、行頭チェックで予定前でも手動達成できる", () => {
    const habit: Habit = { id: "h-timer", title: "散歩", color: "#246B5A", goalPerWeek: 5, isRequired: true, completedDates: [], progressUnit: "minutes", targetValue: 15, timerStartedAtByDate: { "2026-08-13": "2026-08-13T02:00:00.000Z" }, createdAt: "2026-08-13T00:00:00.000Z" };
    expect(isHabitCompleteOn(habit, "2026-08-13", new Date("2026-08-13T02:10:00.000Z"))).toBe(false);
    expect(isHabitTimeReady(habit, "2026-08-13", new Date("2026-08-13T02:15:00.000Z"))).toBe(true);
    expect(isHabitCompleteOn(habit, "2026-08-13", new Date("2026-08-13T02:15:00.000Z"))).toBe(false);
    expect(isHabitCompleteOn({ ...habit, completedDates: ["2026-08-13"] }, "2026-08-13")).toBe(true);
  });

  it("毎日・毎週の反復Todoは完了後に次回の将来日へ進む", () => {
    expect(nextRecurringDueDate("2026-08-13", "daily", base)).toBe("2026-08-14");
    expect(nextRecurringDueDate("2026-08-13", "weekly", base)).toBe("2026-08-20");
    expect(nextRecurringDueDate("2026-08-10", "daily", base)).toBe("2026-08-14");
  });

  it("サブタスクの並べ替えは順序と完了状態を保持する", () => {
    const source = [{ id: "one", title: "最初", completed: false }, { id: "two", title: "次", completed: true }, { id: "three", title: "最後", completed: false }];
    expect(reorderSubtasks(source, 2, 0)).toEqual([{ id: "three", title: "最後", completed: false }, { id: "one", title: "最初", completed: false }, { id: "two", title: "次", completed: true }]);
  });
});
