import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..");
const source = (...segments: string[]) => readFileSync(resolve(root, ...segments), "utf8");

describe("v12 Widgetのサイズ・単一リストカード・必須表示契約", () => {
  it("リサイズCallbackとAndroid 12の実サイズから小・標準・大を1/2/3行へ切り替える", () => {
    const provider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    const layout = source("plugins", "native", "android", "res", "layout", "focus_flow_widget_initial.xml");
    const info = source("plugins", "native", "android", "res", "xml", "focus_flow_widget_initial_info.xml");

    expect(provider).toContain("onAppWidgetOptionsChanged");
    expect(provider).toContain("safeUpdateWidget(context, manager, id, options)");
    expect(provider).toContain("updatedOptions ?: manager.getAppWidgetOptions(id)");
    expect(provider).toContain("OPTION_APPWIDGET_SIZES");
    expect(provider).toContain("RemoteViews(mappings)");
    expect(provider).toContain("OPTION_APPWIDGET_MIN_WIDTH");
    expect(provider).toContain("WidgetBucket(1, false, true)");
    expect(provider).toContain("WidgetBucket(2, false, false)");
    expect(provider).toContain("WidgetBucket(3, false, false)");
    expect(provider).toContain("for (index in 0..2)");
    expect(layout).toContain('android:id="@+id/focus_flow_widget_card" android:layout_width="match_parent" android:layout_height="wrap_content"');
    expect(layout).toContain("focus_flow_widget_static_row_three");
    expect(layout).not.toContain("focus_flow_widget_static_row_four");
    expect(layout).not.toMatch(/<View[\s>]/);
    expect(layout).not.toContain("layout_weight");
    expect(layout).not.toContain('layout_width="0dp"');
    expect(layout).not.toContain('layout_height="0dp"');
    expect(info).toContain('android:minResizeWidth="130dp"');
    expect(info).toContain('android:targetCellWidth="4"');
    expect(info).toContain('android:maxResizeHeight="450dp"');
  });

  it("本体paletteを単一カード、丸角必須Pill、丸形チェックへ同期する", () => {
    const bridge = source("lib", "focus-flow", "android-gate.ts");
    const provider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");

    expect(bridge).toContain('widgetTheme: data.displaySettings.appTheme ?? "mist"');
    expect(provider).toContain('paletteColor(palette, "primarySoft"');
    expect(provider).toContain('paletteColor(palette, "text"');
    expect(provider).toContain('paletteColor(palette, "primary"');
    expect(provider).toContain('R.drawable.focus_flow_widget_badge_dark');
    expect(provider).toContain('R.drawable.focus_flow_widget_badge_light');
    expect(provider).toContain('R.drawable.focus_flow_widget_check_circle');
    expect(provider).not.toContain('setFloat(ids.check, "setAlpha"');
  });

  it("回数と時間の習慣データは本体と同期するが、Widgetでは読みやすい単一リストを優先する", () => {
    const bridge = source("lib", "focus-flow", "android-gate.ts");
    const provider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    const state = source("lib", "focus-flow", "provider.tsx");

    expect(bridge).toContain('progressUnit: habit.progressUnit ?? "check"');
    expect(bridge).toContain("timerRunning: Boolean(habit.timerStartedAtByDate?.[today])");
    expect(provider).toContain("WidgetBucket(3, false, false)");
    expect(provider).toContain("val supportsControls = showControls");
    expect(provider).toContain('unit == "count"');
    expect(provider).toContain('unit == "minutes"');
    expect(state).toContain('operation === "increment"');
    expect(state).toContain('operation === "timer_start"');
  });

  it("Todo・習慣・Todayの必須Pillは単独行と実端末幅を確保し、文字列を省略しない", () => {
    const ui = source("components", "focus-flow", "ui.tsx");
    const habits = source("app", "(tabs)", "habits.tsx");
    const today = source("app", "(tabs)", "index.tsx");

    expect(ui).toContain("allowFontScaling={false}");
    expect(ui).toContain("minWidth: 76");
    expect(ui).toContain("minWidth: 38");
    expect(ui).toContain("includeFontPadding: false");
    expect(habits).toContain('requiredPillSlot: { minWidth: 84');
    expect(habits).toContain('meta: { width: "100%", minHeight: 52, flexDirection: "column"');
    expect(habits).toContain('metaText: { width: "100%"');
    expect(today).toContain('requiredPillSlot: { minWidth: 84');
    expect(today).toContain('meta: { width: "100%", minHeight: 52, flexDirection: "column"');
    expect(today).toContain('itemMeta: { width: "100%"');
  });
});
