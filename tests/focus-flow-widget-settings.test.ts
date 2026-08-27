import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("Focus Flow統合ウィジェットの設定", () => {
  it("TodayとWidgetの完了表示を独立したワンタップSwitchでローカル設定からWidget状態へ同期する", () => {
    const types = fs.readFileSync(path.join(process.cwd(), "lib", "focus-flow", "types.ts"), "utf8");
    const bridge = fs.readFileSync(path.join(process.cwd(), "lib", "focus-flow", "android-gate.ts"), "utf8");
    const settings = fs.readFileSync(path.join(process.cwd(), "app", "(tabs)", "settings.tsx"), "utf8");

    expect(types).toContain('export type WidgetCompletedDisplay = "hide" | "dim"');
    expect(types).toContain('export type TodayCompletedDisplay = "hide" | "dim"');
    expect(types).toContain('widgetCompletedDisplay: "dim"');
    expect(types).toContain("widgetOpacity: 86");
    expect(bridge).toContain('const widgetCompletedDisplay = data.displaySettings.widgetCompletedDisplay ?? "dim"');
    expect(bridge).toContain('const widgetOpacity = Math.max(0, Math.min(100, Number(data.displaySettings.widgetOpacity ?? legacyOpacity)))');
    expect(bridge).toContain("const widgetPalette = getAppPalette");
    expect(bridge).toContain('widgetPalette, widgetTheme: data.displaySettings.appTheme ?? "mist", widgetTextScale: data.displaySettings.fontScale, widgetOpacity, widgetCompletedDisplay');
    expect(bridge).toContain('widgetTextScale: data.displaySettings.fontScale');
    expect(bridge).toContain('completed: true');
    expect(settings).toContain("onTodayCompletedDisplay");
    expect(settings).toContain("onWidgetCompletedDisplay");
    expect(settings).toContain("function CompletedItemsToggle");
    expect(settings).toContain('accessibilityLabel={english ? `${title}: ${status}`');
    expect(settings).toContain('onValueChange={(next) => onChange(next ? "dim" : "hide")}');
    expect(settings).toContain('value={displaySettings.todayCompletedDisplay ?? "hide"}');
    expect(settings).toContain('value={displaySettings.widgetCompletedDisplay ?? "dim"}');
    expect(settings).toContain("onOpacity");
    expect(settings).toContain("Home screen widget");
    expect(settings).toContain("Background strength");
    expect(settings).toContain("本体のテーマを使用");
    expect(settings).toContain("Follow app theme");
    expect(settings).toContain('visible ? "完了済みを残す" : "完了済みを非表示"');
    expect(settings).not.toContain("残して線を引く");
  });
});
