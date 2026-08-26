import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..");
const source = (...segments: string[]) => readFileSync(resolve(root, ...segments), "utf8");

describe("v10 Widgetのサイズ・テーマ・習慣操作契約", () => {
  it("小・中・大のサイズに応じて安全な静的行数を切り替える", () => {
    const provider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    const layout = source("plugins", "native", "android", "res", "layout", "focus_flow_widget_initial.xml");
    const info = source("plugins", "native", "android", "res", "xml", "focus_flow_widget_initial_info.xml");

    expect(provider).toContain("onAppWidgetOptionsChanged");
    expect(provider).toContain("OPTION_APPWIDGET_MAX_WIDTH");
    expect(provider).toContain("WidgetBucket(1, false, true)");
    expect(provider).toContain("WidgetBucket(2, true, false)");
    expect(provider).toContain("WidgetBucket(4, true, false)");
    expect(provider).toContain("for (index in 0..3)");
    expect(layout).toContain("focus_flow_widget_static_row_four");
    expect(layout).not.toMatch(/<View[\s>]/);
    expect(layout).not.toContain("layout_weight");
    expect(layout).not.toContain('layout_width="0dp"');
    expect(layout).not.toContain('layout_height="0dp"');
    expect(info).toContain('android:minResizeWidth="180dp"');
    expect(info).toContain('android:maxResizeHeight="450dp"');
  });

  it("本体paletteをWidgetヘッダー・文字・必須タグ・操作面へ同期する", () => {
    const bridge = source("lib", "focus-flow", "android-gate.ts");
    const provider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");

    expect(bridge).toContain('widgetTheme: data.displaySettings.appTheme ?? "mist"');
    expect(provider).toContain('paletteColor(palette, "primarySoft"');
    expect(provider).toContain('paletteColor(palette, "text"');
    expect(provider).toContain('paletteColor(palette, "primary"');
    expect(provider).toContain('views.setInt(ids.badge, "setBackgroundColor", primarySoft)');
    expect(provider).not.toContain('setFloat(ids.check, "setAlpha"');
  });

  it("回数と時間の習慣を種別別のWidget操作で本体へ反映する", () => {
    const bridge = source("lib", "focus-flow", "android-gate.ts");
    const provider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    const state = source("lib", "focus-flow", "provider.tsx");

    expect(bridge).toContain('progressUnit: habit.progressUnit ?? "check"');
    expect(bridge).toContain("timerRunning: Boolean(habit.timerStartedAtByDate?.[today])");
    expect(provider).toContain("ACTION_INCREMENT");
    expect(provider).toContain("ACTION_DECREMENT");
    expect(provider).toContain("ACTION_TIMER_START");
    expect(provider).toContain("adjustHabitFromWidget");
    expect(provider).toContain('unit == "count"');
    expect(provider).toContain('unit == "minutes"');
    expect(state).toContain('operation === "increment"');
    expect(state).toContain('operation === "timer_start"');
  });

  it("本体の必須Pillは単一行と十分な幅を持つ", () => {
    const ui = source("components", "focus-flow", "ui.tsx");

    expect(ui).toContain('numberOfLines={1}');
    expect(ui).toContain("minWidth: 54");
    expect(ui).toContain("includeFontPadding: false");
  });
});
