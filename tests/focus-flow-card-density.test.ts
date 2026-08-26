import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const projectFile = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("Focus Flowカード密度", () => {
  it("Todo・習慣は必須ラベルの有無で操作領域を縮めず、必須ラベルは折返し可能なメタへ収める", () => {
    const todos = projectFile("app", "(tabs)", "todos.tsx");
    const habits = projectFile("app", "(tabs)", "habits.tsx");
    const ui = projectFile("components", "focus-flow", "ui.tsx");
    const today = projectFile("app", "(tabs)", "index.tsx");

    expect(todos).toContain('taskRow: { position: "relative", minHeight: 70');
    expect(todos).toContain('meta: { minHeight: 19');
    expect(habits).toContain('habitRow: { position: "relative", minHeight: 98');
    expect(habits).toContain('meta: { minHeight: 48, flexDirection: "column"');
    expect(habits).not.toContain("requiredSlot:");
    expect(ui).toContain("minWidth: 68");
    expect(ui).toContain("flexShrink: 0");
    expect(today).toContain('itemCard: { position: "relative", minHeight: 68');
  });

  it("静的Widgetは48dpの最大3行単一リストで、Collectionなしでもカードの重なり・過剰な空白を防ぐ", () => {
    const layout = projectFile("plugins", "native", "android", "res", "layout", "focus_flow_widget_initial.xml");

    expect(layout).toContain('android:layout_height="48dp"');
    expect(layout).toContain('android:id="@+id/focus_flow_widget_static_row_one_action"');
    expect(layout).toContain('android:id="@+id/focus_flow_widget_static_row_one_check"');
    expect(layout).toContain('android:layout_width="48dp"');
    expect(layout).toContain('android:layout_width="24dp"');
    expect(layout).toContain('android:id="@+id/focus_flow_widget_static_row_one_content"');
    expect(layout).toContain('android:id="@+id/focus_flow_widget_static_row_three"');
    expect(layout).not.toContain('android:id="@+id/focus_flow_widget_static_row_four"');
    expect(layout).toContain('android:gravity="center_vertical"');
    expect(layout).toContain('android:maxLines="1"');
    expect(layout).not.toContain("<View");
    expect(layout).not.toContain("ListView");
    expect(layout).not.toContain("android:layout_weight");
  });

  it("完了済み項目は行全体を薄くせず、読みやすい文字色・背景・取り消し線で区別する", () => {
    const todos = projectFile("app", "(tabs)", "todos.tsx");
    const habits = projectFile("app", "(tabs)", "habits.tsx");
    const widgetProvider = projectFile("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");

    [todos, habits].forEach((source) => {
      expect(source).toContain('backgroundColor: "#F1F4F2"');
      expect(source).toContain('color: "#75827C", textDecorationLine: "line-through"');
      expect(source).not.toMatch(/taskRowDone: \{ opacity|habitRowDone: \{ opacity/);
    });
    expect(widgetProvider).toContain("if (completed) mutedColor else titleColor");
    expect(widgetProvider).toContain('paletteColor(palette, "muted"');
    expect(widgetProvider).toContain("StyleSpan(Typeface.BOLD)");
  });
});
