import { Appearance, NativeModules, Platform } from "react-native";
import { dayKey, formatJapaneseDate, getGateRuleSummaries, getGateSummary, weeklyHabitProgress, getHabitTimerProgress, getTodoDueStatus, getTodoSubtasks, habitStreak, habitTimerEndsAt, isHabitCompleteOn, isHabitTimeReady, isTimedTodo, isTodoAchieved, isTodoEffectiveRequired, isTodoTimeReady, todoTimerEndsAt } from "./utils";
import type { FocusFlowData } from "./types";
import { getAppLanguage } from "./i18n";
import { getAppPalette } from "./app-themes";
import { uniqueWidgetItems } from "./widget-items";

type LaunchableApp = { packageName: string; label: string };
export type WidgetOperation = "complete" | "restore" | "increment" | "decrement" | "timer_start" | "timer_pause";
export type WidgetAction = { id: string; kind: "todo" | "habit"; operation: WidgetOperation; startedAt?: string; elapsedSeconds?: number };
export type GateDiagnostics = { accessibilityEnabled: boolean; batteryOptimizationIgnored: boolean | null; backgroundRestricted: boolean; apiLevel: number; manufacturer: string; model: string; lastGateStateUpdatedAt: number; lastGateEventAt: number; lastGateEventPackage: string; lastBlockedAt: number; lastBlockedPackage: string; gateStateActive: boolean; configuredRuleCount: number; configuredBlockedPackageCount: number };

type FocusGateNativeModule = {
  saveGateState: (serialized: string) => Promise<void>;
  consumeWidgetActions: () => Promise<WidgetAction[]>;
  getAccessibilityStatus: () => Promise<boolean>;
  openAccessibilitySettings: () => Promise<void>;
  openAppDetailsSettings: () => Promise<void>;
  getGateDiagnostics: () => Promise<GateDiagnostics>;
  getLaunchableApps: () => Promise<LaunchableApp[]>;
};

function nativeModule() { return Platform.OS === "android" ? (NativeModules.FocusGate as FocusGateNativeModule | undefined) : undefined; }
export function isNativeGateAvailable() { return Boolean(nativeModule()); }

export async function syncAndroidGate(data: FocusFlowData) {
  const module = nativeModule();
  if (!module) return;
  const language = getAppLanguage(data.displaySettings);
  const widgetPalette = getAppPalette(data.displaySettings, Appearance.getColorScheme() === "dark" ? "dark" : "light");
  const summary = getGateSummary(data, new Date(), language);
  const rules = getGateRuleSummaries(data, new Date(), language);
  const today = dayKey();
  const activeRules = rules.filter((rule) => rule.isActive);
  const requiredTodoIds = new Set(activeRules.flatMap((rule) => rule.requiredTodoIds));
  const requiredHabitIds = new Set(activeRules.flatMap((rule) => rule.requiredHabitIds));
  const effectiveRequiredTodos = data.todos.filter((todo) => isTodoEffectiveRequired(todo));
  const effectiveRequiredHabits = data.habits.filter((habit) => habit.isRequired);
  const gateRequiredTodos = data.todos.filter((todo) => requiredTodoIds.has(todo.id));
  const gateRequiredHabits = data.habits.filter((habit) => requiredHabitIds.has(habit.id));
  const pendingTodoItems = effectiveRequiredTodos.filter((todo) => !isTodoAchieved(todo));
  const pendingHabitItems = effectiveRequiredHabits.filter((habit) => !isHabitCompleteOn(habit, today));
  const priorityRank = { high: 0, medium: 1, low: 2 } as const;
  const orderedPendingTodos = [...pendingTodoItems].sort((left, right) => priorityRank[left.priority] - priorityRank[right.priority] || (left.dueDate ?? "9999-12-31").localeCompare(right.dueDate ?? "9999-12-31"));
  const nextTodo = orderedPendingTodos[0];
  const nextHabit = pendingHabitItems[0];
  const timedUnlocks = new Map<string, number>();
  gateRequiredTodos.forEach((todo) => { const endsAt = todoTimerEndsAt(todo); if (isTimedTodo(todo) && !isTodoTimeReady(todo) && endsAt && getTodoSubtasks(todo).every((subtask) => subtask.completed)) timedUnlocks.set(todo.id, endsAt); });
  gateRequiredHabits.forEach((habit) => { const endsAt = habitTimerEndsAt(habit, today); if ((habit.progressUnit ?? "check") === "minutes" && !isHabitTimeReady(habit, today) && endsAt) timedUnlocks.set(habit.id, endsAt); });
  const rulesWithTimedUnlocks = rules.map((rule) => ({ ...rule, timedUnlocks: [...new Set([...rule.pendingTodoIds, ...rule.pendingHabitIds])].flatMap((id) => timedUnlocks.has(id) ? [{ id, endsAt: timedUnlocks.get(id) }] : []) }));
  const timedLockedTodoIds = gateRequiredTodos.filter((todo) => !isTodoAchieved(todo) && isTimedTodo(todo) && !isTodoTimeReady(todo)).map((todo) => todo.id);
  const timedLockedHabitIds = gateRequiredHabits.filter((habit) => !isHabitCompleteOn(habit, today) && (habit.progressUnit ?? "check") === "minutes" && !isHabitTimeReady(habit, today)).map((habit) => habit.id);
  const activeRoutine = rulesWithTimedUnlocks.find((rule) => rule.isActive);
  // 完了済みはNative Widget側の一時表示状態で切り替える。同期payloadには
  // 未完了・完了の双方を含め、再同期後もWidget側が現在の表示状態を保てるようにする。
  const widgetCompletedDisplay = "local";
  const completedTodoItems = effectiveRequiredTodos.filter((todo) => isTodoAchieved(todo));
  const completedHabitItems = effectiveRequiredHabits.filter((habit) => isHabitCompleteOn(habit, today));
  const windowLabelFor = (item: { requiredScheduleIds?: string[] }) => data.gateConfig.schedules.filter((schedule) => item.requiredScheduleIds?.includes(schedule.id)).map((schedule) => `${schedule.label} ${schedule.startTime}–${schedule.endTime}`).join(" · ");
  const todoWidgetMeta = (todo: (typeof data.todos)[number]) => { const dueStatus = getTodoDueStatus(todo); const subtasks = getTodoSubtasks(todo); return { hasMemo: Boolean(todo.memo?.trim()), dueLabel: !todo.dueDate ? "" : dueStatus === "overdue" ? (language === "en" ? "Overdue" : "期限切れ") : dueStatus === "today" ? (language === "en" ? "Due today" : "今日まで") : formatJapaneseDate(todo.dueDate, language), subtaskCount: subtasks.length, completedSubtaskCount: subtasks.filter((subtask) => subtask.completed).length }; };
  const habitWidgetMeta = (habit: (typeof data.habits)[number]) => { const weekly = weeklyHabitProgress(habit); return { habitMeta: language === "en" ? `${weekly.completed}/${weekly.target} this week · ${habitStreak(habit)}-day streak` : `週 ${weekly.completed}/${weekly.target} · ${habitStreak(habit)}日連続` }; };
  const widgetItems = uniqueWidgetItems([
    ...orderedPendingTodos.map((todo) => ({ id: todo.id, title: todo.title, kind: "todo", required: true, gateRequired: requiredTodoIds.has(todo.id), stableOrder: data.todos.indexOf(todo) * 2, accentColor: todo.priority === "high" ? "#C24756" : todo.priority === "medium" ? "#B96B13" : "#3566B7", windowLabel: windowLabelFor(todo), ...todoWidgetMeta(todo), timedLocked: timedLockedTodoIds.includes(todo.id), completed: false, canToggle: !timedLockedTodoIds.includes(todo.id) && todo.repeatRule === "none", progressUnit: todo.progressUnit ?? "check", progressValue: todo.progressValue ?? 0, targetValue: todo.targetValue ?? 1 })),
    ...pendingHabitItems.map((habit) => { const timer = getHabitTimerProgress(habit, today); const startedAtMillis = habit.timerStartedAtByDate?.[today] ? new Date(habit.timerStartedAtByDate[today]).getTime() : 0; return { id: habit.id, title: habit.title, kind: "habit", required: true, gateRequired: requiredHabitIds.has(habit.id), stableOrder: data.habits.indexOf(habit) * 2 + 1, accentColor: habit.color, windowLabel: windowLabelFor(habit), ...habitWidgetMeta(habit), timedLocked: false, completed: false, canToggle: true, progressUnit: habit.progressUnit ?? "check", progressValue: habit.dailyProgress?.[today] ?? 0, targetValue: habit.targetValue ?? 1, timerRunning: timer.running, timerPaused: timer.paused, timerElapsedSeconds: timer.elapsedSeconds, timerTargetSeconds: timer.targetSeconds, timerStartedAtMillis: Number.isFinite(startedAtMillis) ? startedAtMillis : 0 }; }),
    ...completedTodoItems.map((todo) => ({ id: todo.id, title: todo.title, kind: "todo", required: true, gateRequired: requiredTodoIds.has(todo.id), stableOrder: data.todos.indexOf(todo) * 2, accentColor: todo.priority === "high" ? "#C24756" : todo.priority === "medium" ? "#B96B13" : "#3566B7", windowLabel: windowLabelFor(todo), ...todoWidgetMeta(todo), timedLocked: false, completed: true, canToggle: todo.repeatRule === "none", progressUnit: "check", progressValue: 1, targetValue: 1 })),
    ...completedHabitItems.map((habit) => { const timer = getHabitTimerProgress(habit, today); const startedAtMillis = habit.timerStartedAtByDate?.[today] ? new Date(habit.timerStartedAtByDate[today]).getTime() : 0; return { id: habit.id, title: habit.title, kind: "habit", required: true, gateRequired: requiredHabitIds.has(habit.id), stableOrder: data.habits.indexOf(habit) * 2 + 1, accentColor: habit.color, windowLabel: windowLabelFor(habit), ...habitWidgetMeta(habit), timedLocked: false, completed: true, canToggle: true, progressUnit: habit.progressUnit ?? "check", progressValue: habit.dailyProgress?.[today] ?? habit.targetValue ?? 1, targetValue: habit.targetValue ?? 1, timerRunning: false, timerPaused: timer.paused, timerElapsedSeconds: timer.elapsedSeconds, timerTargetSeconds: timer.targetSeconds, timerStartedAtMillis: Number.isFinite(startedAtMillis) ? startedAtMillis : 0 }; }),
  ]).sort((left, right) => Number(left.stableOrder ?? Number.MAX_SAFE_INTEGER) - Number(right.stableOrder ?? Number.MAX_SAFE_INTEGER));
  const legacyOpacity = data.displaySettings.widgetTransparency === "clear" ? 68 : data.displaySettings.widgetTransparency === "solid" ? 100 : 86;
  const widgetOpacity = Math.max(0, Math.min(100, Number(data.displaySettings.widgetOpacity ?? legacyOpacity)));
  const widgetBackgroundOpacity = Math.max(0, Math.min(100, Number(data.displaySettings.widgetBackgroundOpacity ?? widgetOpacity)));
  const widgetCardOpacity = Math.max(0, Math.min(100, Number(data.displaySettings.widgetCardOpacity ?? 100)));
  await module.saveGateState(JSON.stringify({ active: data.gateConfig.enabled, strictMode: Boolean(data.gateConfig.strictMode), language, pendingCount: summary.pendingCount, pendingTodos: summary.pendingTodos, pendingHabits: summary.pendingHabits, message: summary.message, rules: rulesWithTimedUnlocks, timedLockedTodoIds, timedLockedHabitIds, widgetPalette, widgetTheme: data.displaySettings.appTheme ?? "mist", widgetTextScale: data.displaySettings.fontScale, fontFamily: data.displaySettings.fontFamily ?? "system", widgetOpacity, widgetBackgroundOpacity, widgetCardOpacity, widgetCompletedDisplay, widgetHiddenCompletedCount: completedTodoItems.length + completedHabitItems.length, widgetItems, requiredTodoTotal: gateRequiredTodos.length, requiredHabitTotal: gateRequiredHabits.length, completedTodoTotal: gateRequiredTodos.filter((todo) => isTodoAchieved(todo)).length, completedHabitTotal: gateRequiredHabits.filter((habit) => isHabitCompleteOn(habit, today)).length, todoQueue: orderedPendingTodos.filter((todo) => requiredTodoIds.has(todo.id)).map((todo) => ({ id: todo.id, title: todo.title })), habitQueue: pendingHabitItems.filter((habit) => requiredHabitIds.has(habit.id)).map((habit) => ({ id: habit.id, title: habit.title })), nextTodoId: nextTodo?.id ?? "", nextTodoTitle: nextTodo?.title ?? "", nextHabitId: nextHabit?.id ?? "", nextHabitTitle: nextHabit?.title ?? "", nextRequiredId: nextTodo?.id ?? nextHabit?.id ?? "", nextRequiredTitle: nextTodo?.title ?? nextHabit?.title ?? "", nextRequiredKind: nextTodo ? "todo" : nextHabit ? "habit" : "", routineActive: Boolean(activeRoutine?.isActive), routineLabel: activeRoutine?.label ?? "" }));
}

export async function getAccessibilityStatus() { return (await nativeModule()?.getAccessibilityStatus()) ?? false; }
export async function openAccessibilitySettings() { await nativeModule()?.openAccessibilitySettings(); }
export async function openAppDetailsSettings() { await nativeModule()?.openAppDetailsSettings(); }
export async function getGateDiagnostics() { return await nativeModule()?.getGateDiagnostics(); }
export async function getLaunchableApps() { return (await nativeModule()?.getLaunchableApps()) ?? [] as LaunchableApp[]; }
export async function consumeWidgetActions() { return (await nativeModule()?.consumeWidgetActions()) ?? [] as WidgetAction[]; }
export type { LaunchableApp };
