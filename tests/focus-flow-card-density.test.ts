import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const projectFile = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("Focus Flowカード密度", () => {
  it("Todo・習慣・Todayは共通カードの必須Pill専用枠を使い、操作領域を縮めず二文字を保護する", () => {
    const todos = projectFile("app", "(tabs)", "todos.tsx");
    const habits = projectFile("app", "(tabs)", "habits.tsx");
    const cards = projectFile("components", "focus-flow", "item-cards.tsx");
    const today = projectFile("app", "(tabs)", "index.tsx");

    expect(cards).toContain('todoRow: { position: "relative", minHeight: 70');
    expect(cards).toContain('habitRow: { position: "relative", minHeight: 98');
    expect(cards).toContain('requiredPillSlot: { minWidth: 84');
    expect(cards).toContain('checkTouchTarget: { width: 44, height: 44');
    expect(todos).toContain("<TodoItemCard");
    expect(habits).toContain("<HabitItemCard");
    expect(today).toContain("<TodoItemCard");
    expect(today).toContain("<HabitItemCard");
  });

  it("静的Widgetは呼吸感のあるヘッダーと個別51dp mini-cardを最大3行表示し、Collectionなしでも項目の境界と余白を保つ", () => {
    const layout = projectFile("plugins", "native", "android", "res", "layout", "focus_flow_widget_initial.xml");

    expect(layout).toContain('android:id="@+id/focus_flow_widget_header" android:layout_width="match_parent" android:layout_height="40dp" android:layout_marginStart="7dp" android:layout_marginTop="7dp"');
    expect(layout).toContain('android:id="@+id/focus_flow_widget_top_spacer" android:layout_width="match_parent" android:layout_height="4dp"');
    expect(layout).toContain('android:layout_height="51dp"');
    expect(layout).toContain('android:id="@+id/focus_flow_widget_static_row_one_action"');
    expect(layout).toContain('android:id="@+id/focus_flow_widget_static_row_one_check"');
    expect(layout).toContain('android:id="@+id/focus_flow_widget_static_row_one_rail" android:layout_width="4dp"');
    expect(layout).toContain('android:id="@+id/focus_flow_widget_static_row_one_chronometer"');
    expect(layout).toContain('android:layout_width="44dp"');
    expect(layout).toContain('android:layout_width="68dp"');
    expect(layout).toContain('android:layout_width="22dp"');
    expect(layout).toContain('android:layout_height="1dp"');
    expect(layout).toContain('@drawable/focus_flow_widget_surface_mist_light');
    expect(layout).toContain('android:layout_marginTop="4dp" android:layout_marginBottom="4dp"');
    expect(layout).toContain('android:id="@+id/focus_flow_widget_static_row_one_content"');
    expect(layout).toContain('android:id="@+id/focus_flow_widget_static_row_three"');
    expect(layout).not.toContain('android:id="@+id/focus_flow_widget_static_row_four"');
    expect(layout).toContain('android:gravity="center_vertical"');
    expect(layout).toContain('android:maxLines="1"');
    expect(layout).not.toContain("<View");
    expect(layout).not.toContain("ListView");
    expect(layout).not.toContain("android:layout_weight");
  });

  it("時間型WidgetはRemoteViews Chronometerを使い、開始後もホスト側で経過秒を更新する", () => {
    const provider = projectFile("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    expect(provider).toContain("setChronometer(ids.chronometer");
    expect(provider).toContain("SystemClock.elapsedRealtime()");
    expect(provider).toContain("timerStartedAtMillis");
    expect(provider).toContain("ids.chronometer");
  });

  it("完了済み項目は行全体を薄くせず、読みやすい文字色・背景・取り消し線で区別する", () => {
    const cards = projectFile("components", "focus-flow", "item-cards.tsx");
    const widgetProvider = projectFile("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");

    expect(cards).toContain('backgroundColor: achieved ? palette.elevated : palette.surface');
    expect(cards).toContain('textDecorationColor: palette.muted');
    expect(cards).not.toMatch(/taskRowDone: \{ opacity|habitRowDone: \{ opacity/);
    expect(widgetProvider).toContain("if (completed) mutedColor else titleColor");
    expect(widgetProvider).toContain('paletteColor(palette, "muted"');
    expect(widgetProvider).toContain("StyleSpan(Typeface.BOLD)");
  });
});
