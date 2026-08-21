import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { isStrictGateActive } from "../lib/focus-flow/utils";
import type { FocusFlowData } from "../lib/focus-flow/types";

function dataForStrictMode(strictMode: boolean, enabled = true): FocusFlowData {
  return {
    todos: [{ id: "required", title: "必須", priority: "high", isRequired: true, completed: false, createdAt: "2026-08-20T00:00:00.000Z" }],
    habits: [], memos: [], focusSessions: [],
    gateConfig: { enabled, strictMode, blockedPackages: ["com.example.video"], requiredTodoIds: [], requiredHabitIds: [], autoRequireDueToday: true, schedules: [] },
    displaySettings: { fontScale: "standard", theme: "mist", cardOpacity: "solid" },
  };
}

describe("厳格モード", () => {
  it("集中制限が有効で必須項目が残る時だけアプリ内解除を保護する", () => {
    expect(isStrictGateActive(dataForStrictMode(true))).toBe(true);
    expect(isStrictGateActive(dataForStrictMode(false))).toBe(false);
    expect(isStrictGateActive(dataForStrictMode(true, false))).toBe(false);
    const complete = dataForStrictMode(true);
    complete.todos[0].completed = true;
    expect(isStrictGateActive(complete)).toBe(false);
  });

  it("設定とAndroid同期がstrictModeを保持し、遮断オーバーレイに反映する", () => {
    const settings = fs.readFileSync(path.join(process.cwd(), "app", "(tabs)", "settings.tsx"), "utf8");
    const bridge = fs.readFileSync(path.join(process.cwd(), "lib", "focus-flow", "android-gate.ts"), "utf8");
    expect(settings).toContain("厳格モード");
    expect(settings).toContain("setGateConfig({ strictMode: true })");
    expect(bridge).toContain("strictMode: Boolean(data.gateConfig.strictMode)");
  });
});
