import { describe, expect, it } from "vitest";

import { FREE_BLOCKED_APP_LIMIT, FREE_ITEM_LIMIT } from "../lib/focus-flow/billing";
import { canSelectBlockedApp, capBlockedApps, countBlockedApps, isFreeItemLimitReached } from "../lib/focus-flow/limits";
import type { GateConfig } from "../lib/focus-flow/types";

const config: GateConfig = {
  enabled: true,
  blockedPackages: ["one", "two", "three"],
  requiredTodoIds: [],
  requiredHabitIds: [],
  autoRequireDueToday: true,
  schedules: [{ id: "morning", label: "Morning", enabled: true, days: [1], startTime: "08:00", endTime: "09:00", blockedPackages: ["four", "five"] }],
};

describe("無料版とPlusの上限", () => {
  it("無料版のTodo・習慣・メモは2件で上限、Plusでは上限なし", () => {
    expect(FREE_ITEM_LIMIT).toBe(2);
    expect(isFreeItemLimitReached(1, false)).toBe(false);
    expect(isFreeItemLimitReached(2, false)).toBe(true);
    expect(isFreeItemLimitReached(999, true)).toBe(false);
  });

  it("無料版の制限対象アプリは全ルール合計5件、Plusでは無制限", () => {
    expect(FREE_BLOCKED_APP_LIMIT).toBe(5);
    expect(countBlockedApps(config)).toBe(5);
    expect(canSelectBlockedApp(config, "six", false)).toBe(false);
    expect(canSelectBlockedApp(config, "six", true)).toBe(true);
  });

  it("無料版に既存データが多い場合、先頭5件を残して安全に上限へ収める", () => {
    const overflow = { ...config, schedules: [...config.schedules, { id: "night", label: "Night", enabled: true, days: [1], startTime: "22:00", endTime: "23:00", blockedPackages: ["six", "seven"] }] };
    expect(countBlockedApps(capBlockedApps(overflow, false))).toBe(5);
    expect(countBlockedApps(capBlockedApps(overflow, true))).toBe(7);
  });
});
