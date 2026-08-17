import { NativeModules, Platform } from "react-native";

import { dayKey, getGateRuleSummaries, getGateSummary, isHabitCompleteOn, isTodoAchieved, isTodoRequiredForGate } from "./utils";
import type { GateConfig } from "./types";
import type { FocusFlowData } from "./types";
import { getAppLanguage } from "./i18n";

type LaunchableApp = { packageName: string; label: string };
export type GateDiagnostics = { accessibilityEnabled: boolean; batteryOptimizationIgnored: boolean | null; backgroundRestricted: boolean; apiLevel: number; manufacturer: string; model: string; lastGateStateUpdatedAt: number; safetyPauseUntil: number };

type FocusGateNativeModule = {
  saveGateState: (serialized: string) => Promise<void>;
  consumeWidgetCompletions: () => Promise<Array<{ id: string; kind: "todo" | "habit" }>>;
  getAccessibilityStatus: () => Promise<boolean>;
  openAccessibilitySettings: () => Promise<void>;
  openAppDetailsSettings: () => Promise<void>;
  getGateDiagnostics: () => Promise<GateDiagnostics>;
  getLaunchableApps: () => Promise<LaunchableApp[]>;
};

function nativeModule() {
  return Platform.OS === "android" ? (NativeModules.FocusGate as FocusGateNativeModule | undefined) : undefined;
}

export function isNativeGateAvailable() { return Boolean(nativeModule()); }

export async function syncAndroidGate(data: FocusFlowData) {
  const module = nativeModule();
  if (!module) return;
  const language = getAppLanguage(data.displaySettings);
  const summary = getGateSummary(data, new Date(), language);
  const rules = getGateRuleSummaries(data, new Date(), language);
  const today = dayKey();
  const requiredTodos = data.todos.filter((todo) => isTodoRequiredForGate(todo, data.gateConfig.autoRequireDueToday));
  const requiredHabits = data.habits.filter((habit) => habit.isRequired);
  const pendingTodoItems = requiredTodos.filter((todo) => !isTodoAchieved(todo));
  const pendingHabitItems = requiredHabits.filter((habit) => !isHabitCompleteOn(habit, today));
  const priorityRank = { high: 0, medium: 1, low: 2 } as const;
  const nextTodo = [...pendingTodoItems].sort((left, right) => priorityRank[left.priority] - priorityRank[right.priority] || (left.dueDate ?? "9999-12-31").localeCompare(right.dueDate ?? "9999-12-31"))[0];
  const nextHabit = pendingHabitItems[0];
  const activeRoutine = rules.find((rule) => rule.isActive);
  await module.saveGateState(JSON.stringify({ active: data.gateConfig.enabled, language, pendingCount: summary.pendingCount, pendingTodos: summary.pendingTodos, pendingHabits: summary.pendingHabits, message: summary.message, rules, widgetThemes: data.displaySettings.widgetThemes ?? {}, widgetTextSizes: data.displaySettings.widgetTextSizes ?? {}, requiredTodoTotal: requiredTodos.length, requiredHabitTotal: requiredHabits.length, completedTodoTotal: requiredTodos.length - pendingTodoItems.length, completedHabitTotal: requiredHabits.length - pendingHabitItems.length, todoQueue: [...pendingTodoItems].sort((left, right) => priorityRank[left.priority] - priorityRank[right.priority] || (left.dueDate ?? "9999-12-31").localeCompare(right.dueDate ?? "9999-12-31")).map((todo) => ({ id: todo.id, title: todo.title })), habitQueue: pendingHabitItems.map((habit) => ({ id: habit.id, title: habit.title })), nextTodoId: nextTodo?.id ?? "", nextTodoTitle: nextTodo?.title ?? "", nextHabitId: nextHabit?.id ?? "", nextHabitTitle: nextHabit?.title ?? "", nextRequiredId: nextTodo?.id ?? nextHabit?.id ?? "", nextRequiredTitle: nextTodo?.title ?? nextHabit?.title ?? "", nextRequiredKind: nextTodo ? "todo" : nextHabit ? "habit" : "", routineActive: Boolean(activeRoutine?.isActive), routineLabel: activeRoutine?.label ?? "" }));
}

export async function getAccessibilityStatus() { return (await nativeModule()?.getAccessibilityStatus()) ?? false; }
export async function openAccessibilitySettings() { await nativeModule()?.openAccessibilitySettings(); }
export async function openAppDetailsSettings() { await nativeModule()?.openAppDetailsSettings(); }
export async function getGateDiagnostics() { return await nativeModule()?.getGateDiagnostics(); }
export async function getLaunchableApps() { return (await nativeModule()?.getLaunchableApps()) ?? [] as LaunchableApp[]; }
export async function consumeWidgetCompletions() { return (await nativeModule()?.consumeWidgetCompletions()) ?? [] as Array<{ id: string; kind: "todo" | "habit" }>;
}
export type { LaunchableApp };
