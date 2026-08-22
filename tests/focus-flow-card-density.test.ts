import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const projectFile = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("Focus Flowカード密度", () => {
  it("Todo・習慣は必須ラベルの有無でカードの基準高を変えない", () => {
    const todos = projectFile("app", "(tabs)", "todos.tsx");
    const habits = projectFile("app", "(tabs)", "habits.tsx");

    const today = projectFile("app", "(tabs)", "index.tsx");
    expect(todos).toContain('taskRow: { position: "relative", minHeight: 70');
    expect(todos).toContain('meta: { minHeight: 19');
    expect(habits).toContain('habitRow: { position: "relative", minHeight: 98');
    expect(habits).toContain('requiredSlot: { width: 38, minHeight: 19');
    expect(today).toContain('itemCard: { position: "relative", minHeight: 68');
  });

  it("ウィジェットは固定行高と不可視の必須ラベルレーンを使う", () => {
    const layout = projectFile("plugins", "native", "android", "res", "layout", "focus_flow_widget_item.xml");
    const service = projectFile("plugins", "native", "android", "kotlin", "FocusFlowWidgetItemsService.kt");

    expect(layout).toContain('android:layout_height="56dp"');
    expect(layout).toContain('android:id="@+id/focus_flow_widget_item_check"');
    expect(layout).toContain('android:layout_width="20dp"');
    expect(layout).toContain('android:layout_height="20dp"');
    expect(layout).toContain('android:id="@+id/focus_flow_widget_item_action"');
    expect(layout).toContain('android:layout_width="48dp"');
    expect(layout).toContain('android:id="@+id/focus_flow_widget_item_content"');
    expect(service).toContain('View.INVISIBLE');
  });

  it("完了済み項目は行全体を薄くせず、読みやすい文字色・背景・取り消し線で区別する", () => {
    const todos = projectFile("app", "(tabs)", "todos.tsx");
    const habits = projectFile("app", "(tabs)", "habits.tsx");
    const widgetService = projectFile("plugins", "native", "android", "kotlin", "FocusFlowWidgetItemsService.kt");

    [todos, habits].forEach((source) => {
      expect(source).toContain('backgroundColor: "#F1F4F2"');
      expect(source).toContain('color: "#75827C", textDecorationLine: "line-through"');
      expect(source).not.toMatch(/taskRowDone: \{ opacity|habitRowDone: \{ opacity/);
    });
    expect(widgetService).toContain('"#C2D0CA" else "#66736D"');
    expect(widgetService).toContain("StyleSpan(Typeface.BOLD)");
  });
});
