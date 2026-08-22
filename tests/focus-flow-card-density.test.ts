import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const projectFile = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("Focus Flowカード密度", () => {
  it("Todo・習慣は必須ラベルの有無でカードの基準高を変えない", () => {
    const todos = projectFile("app", "(tabs)", "todos.tsx");
    const habits = projectFile("app", "(tabs)", "habits.tsx");

    expect(todos).toContain('taskRow: { position: "relative", minHeight: 78');
    expect(todos).toContain('meta: { minHeight: 21');
    expect(habits).toContain('habitRow: { position: "relative", minHeight: 112');
    expect(habits).toContain('requiredSlot: { width: 38, minHeight: 21');
  });

  it("ウィジェットは固定行高と不可視の必須ラベルレーンを使う", () => {
    const layout = projectFile("plugins", "native", "android", "res", "layout", "focus_flow_widget_item.xml");
    const service = projectFile("plugins", "native", "android", "kotlin", "FocusFlowWidgetItemsService.kt");

    expect(layout).toContain('android:layout_height="64dp"');
    expect(layout).toContain('<ImageView android:id="@+id/focus_flow_widget_item_check" android:layout_width="20dp" android:layout_height="20dp"');
    expect(service).toContain('View.INVISIBLE');
  });
});
