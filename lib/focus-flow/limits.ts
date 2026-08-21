import { FREE_BLOCKED_APP_LIMIT, FREE_ITEM_LIMIT } from "./billing";
import type { GateConfig } from "./types";
import type { Todo } from "./types";
import { isTodoAchieved } from "./utils";

export function isFreeItemLimitReached(itemCount: number, isPlus: boolean) {
  return !isPlus && itemCount >= FREE_ITEM_LIMIT;
}

/** 無料版のTodo上限は、完了済みの履歴を除いた未完了項目だけで判定する。 */
export function countUncompletedTodos(todos: Todo[]) {
  return todos.filter((todo) => !isTodoAchieved(todo)).length;
}

export function countBlockedApps(config: GateConfig) {
  return new Set([...(config.blockedPackages ?? []), ...config.schedules.flatMap((schedule) => schedule.blockedPackages ?? [])]).size;
}

export function canSelectBlockedApp(config: GateConfig, packageName: string, isPlus: boolean) {
  return isPlus || config.blockedPackages.includes(packageName) || config.schedules.some((schedule) => schedule.blockedPackages?.includes(packageName)) || countBlockedApps(config) < FREE_BLOCKED_APP_LIMIT;
}

export function capBlockedApps(config: GateConfig, isPlus: boolean): GateConfig {
  if (isPlus) return config;
  const allowed = new Set<string>();
  const allow = (value: string) => { if (allowed.has(value) || allowed.size < FREE_BLOCKED_APP_LIMIT) allowed.add(value); };
  (config.blockedPackages ?? []).forEach(allow);
  config.schedules.forEach((schedule) => (schedule.blockedPackages ?? []).forEach(allow));
  return { ...config, blockedPackages: (config.blockedPackages ?? []).filter((packageName) => allowed.has(packageName)), schedules: config.schedules.map((schedule) => ({ ...schedule, blockedPackages: (schedule.blockedPackages ?? []).filter((packageName) => allowed.has(packageName)) })) };
}
