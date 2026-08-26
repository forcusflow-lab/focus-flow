import { Appearance, NativeModules, Platform } from "react-native";
import { dayKey, getGateRuleSummaries, getGateSummary, getTodoSubtasks, habitTimerEndsAt, isHabitCompleteOn, isHabitTimeReady, isTimedTodo, isTodoAchieved, isTodoTimeReady, todoTimerEndsAt } from "./utils";
import type { FocusFlowData } from "./types";
import { getAppLanguage } from "./i18n";
import { getAppPalette } from "./app-themes";

type LaunchableApp = { packageName: string; label: string };
export type GateDiagnostics = { accessibilityEnabled: boolean; batteryOptimizationIgnored: boolean | null; backgroundRestricted: boolean; apiLevel: number; manufacturer: string; model: string; lastGateStateUpdatedAt: number; lastGateEventAt: number; lastGateEventPackage: string; lastBlockedAt: number; lastBlockedPackage: string; gateStateActive: boolean; configuredRuleCount: number; configuredBlockedPackageCount: number };

type FocusGateNativeModule = {
  saveGateState: (serialized: string) => Promise<void>;
  consumeWidgetActions: () => Promise<Array<{ id: string; kind: "todo" | "habit"; operation: "complete" | "restore" }>>;
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
  const requiredTodos = data.todos.filter((todo) => requiredTodoIds.has(todo.id));
  const requiredHabits = data.habits.filter((habit) => requiredHabitIds.has(habit.id));
  const pendingTodoItems = requiredTodos.filter((todo) => !isTodoAchieved(todo));
  const pendingHabitItems = requiredHabits.filter((habit) => !isHabitCompleteOn(habit, today));
  const regularTodos = data.todos.filter((todo) => !requiredTodos.some((required) => required.id === todo.id) && !isTodoAchieved(todo));
  const regularHabits = data.habits.filter((habit) => !requiredHabits.some((required) => required.id === habit.id) && !isHabitCompleteOn(habit, today));
  const priorityRank = { high: 0, medium: 1, low: 2 } as const;
  const orderedPendingTodos = [...pendingTodoItems].sort((left, right) => priorityRank[left.priority] - priorityRank[right.priority] || (left.dueDate ?? "9999-12-31").localeCompare(right.dueDate ?? "9999-12-31"));
  const nextTodo = orderedPendingTodos[0];
  const nextHabit = pendingHabitItems[0];
  const timedUnlocks = new Map<string, number>();
  requiredTodos.forEach((todo) => { const endsAt = todoTimerEndsAt(todo); if (isTimedTodo(todo) && !isTodoTimeReady(todo) && endsAt && getTodoSubtasks(todo).every((subtask) => subtask.completed)) timedUnlocks.set(todo.id, endsAt); });
  requiredHabits.forEach((habit) => { const endsAt = habitTimerEndsAt(habit, today); if ((habit.progressUnit ?? "check") === "minutes" && !isHabitTimeReady(habit, today) && endsAt) timedUnlocks.set(habit.id, endsAt); });
  const rulesWithTimedUnlocks = rules.map((rule) => ({ ...rule, timedUnlocks: [...new Set([...rule.pendingTodoIds, ...rule.pendingHabitIds])].flatMap((id) => timedUnlocks.has(id) ? [{ id, endsAt: timedUnlocks.get(id) }] : []) }));
  const timedLockedTodoIds = pendingTodoItems.filter((todo) => isTimedTodo(todo) && !isTodoTimeReady(todo)).map((todo) => todo.id);
  const timedLockedHabitIds = pendingHabitItems.filter((habit) => (habit.progressUnit ?? "check") === "minutes" && !isHabitTimeReady(habit, today)).map((habit) => habit.id);
  const activeRoutine = rulesWithTimedUnlocks.find((rule) => rule.isActive);
  const widgetCompletedDisplay = data.displaySettings.widgetCompletedDisplay ?? "dim";
  const completedTodoItems = data.todos.filter((todo) => isTodoAchieved(todo) && todo.completedAt?.startsWith(today));
  const completedHabitItems = data.habits.filter((habit) => isHabitCompleteOn(habit, today));
  const windowLabelFor = (item: { requiredScheduleIds?: string[] }) => data.gateConfig.schedules.filter((schedule) => item.requiredScheduleIds?.includes(schedule.id)).map((schedule) => `${schedule.label} ${schedule.startTime}–${schedule.endTime}`).join(" · ");
  const widgetItems = [
    ...orderedPendingTodos.map((todo) => ({ id: todo.id, title: todo.title, kind: "todo", required: true, windowLabel: windowLabelFor(todo), timedLocked: timedLockedTodoIds.includes(todo.id), completed: false, canToggle: !timedLockedTodoIds.includes(todo.id) && todo.repeatRule === "none" })),
    ...pendingHabitItems.map((habit) => ({ id: habit.id, title: habit.title, kind: "habit", required: true, windowLabel: windowLabelFor(habit), timedLocked: timedLockedHabitIds.includes(habit.id), completed: false, canToggle: !timedLockedHabitIds.includes(habit.id) })),
    ...regularTodos.sort((left, right) => priorityRank[left.priority] - priorityRank[right.priority]).map((todo) => ({ id: todo.id, title: todo.title, kind: "todo", required: false, windowLabel: windowLabelFor(todo), timedLocked: isTimedTodo(todo) && !isTodoTimeReady(todo), completed: false, canToggle: !(isTimedTodo(todo) && !isTodoTimeReady(todo)) && todo.repeatRule === "none" })),
    ...regularHabits.map((habit) => ({ id: habit.id, title: habit.title, kind: "habit", required: false, windowLabel: windowLabelFor(habit), timedLocked: (habit.progressUnit ?? "check") === "minutes" && !isHabitTimeReady(habit, today), completed: false, canToggle: !((habit.progressUnit ?? "check") === "minutes" && !isHabitTimeReady(habit, today)) })),
    ...(widgetCompletedDisplay === "dim" ? [
      ...completedTodoItems.map((todo) => ({ id: todo.id, title: todo.title, kind: "todo", required: requiredTodoIds.has(todo.id), windowLabel: windowLabelFor(todo), timedLocked: false, completed: true, canToggle: todo.repeatRule === "none" })),
      ...completedHabitItems.map((habit) => ({ id: habit.id, title: habit.title, kind: "habit", required: requiredHabitIds.has(habit.id), windowLabel: windowLabelFor(habit), timedLocked: false, completed: true, canToggle: true })),
    ] : []),
  ];
  const legacyOpacity = data.displaySettings.widgetTransparency === "clear" ? 68 : data.displaySettings.widgetTransparency === "solid" ? 100 : 86;
  const widgetOpacity = Math.max(0, Math.min(100, Number(data.displaySettings.widgetOpacity ?? legacyOpacity)));
  await module.saveGateState(JSON.stringify({ active: data.gateConfig.enabled, strictMode: Boolean(data.gateConfig.strictMode), language, pendingCount: summary.pendingCount, pendingTodos: summary.pendingTodos, pendingHabits: summary.pendingHabits, message: summary.message, rules: rulesWithTimedUnlocks, timedLockedTodoIds, timedLockedHabitIds, widgetPalette, widgetTextScale: data.displaySettings.fontScale, widgetOpacity, widgetCompletedDisplay, widgetItems, requiredTodoTotal: requiredTodos.length, requiredHabitTotal: requiredHabits.length, completedTodoTotal: requiredTodos.length - pendingTodoItems.length, completedHabitTotal: requiredHabits.length - pendingHabitItems.length, todoQueue: orderedPendingTodos.map((todo) => ({ id: todo.id, title: todo.title })), habitQueue: pendingHabitItems.map((habit) => ({ id: habit.id, title: habit.title })), nextTodoId: nextTodo?.id ?? "", nextTodoTitle: nextTodo?.title ?? "", nextHabitId: nextHabit?.id ?? "", nextHabitTitle: nextHabit?.title ?? "", nextRequiredId: nextTodo?.id ?? nextHabit?.id ?? "", nextRequiredTitle: nextTodo?.title ?? nextHabit?.title ?? "", nextRequiredKind: nextTodo ? "todo" : nextHabit ? "habit" : "", routineActive: Boolean(activeRoutine?.isActive), routineLabel: activeRoutine?.label ?? "" }));
}

export async function getAccessibilityStatus() { return (await nativeModule()?.getAccessibilityStatus()) ?? false; }
export async function openAccessibilitySettings() { await nativeModule()?.openAccessibilitySettings(); }
export async function openAppDetailsSettings() { await nativeModule()?.openAppDetailsSettings(); }
export async function getGateDiagnostics() { return await nativeModule()?.getGateDiagnostics(); }
export async function getLaunchableApps() { return (await nativeModule()?.getLaunchableApps()) ?? [] as LaunchableApp[]; }
export async function consumeWidgetActions() { return (await nativeModule()?.consumeWidgetActions()) ?? [] as Array<{ id: string; kind: "todo" | "habit"; operation: "complete" | "restore" }>; }
export type { LaunchableApp };
