import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("Focus Flow v25 回数Habit Widget表示", () => {
  it("全5行の回数Habit操作は存在する静的IDだけを使い、TextViewへの不安定な反射呼出をしない", () => {
    const provider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    const layout = source("plugins", "native", "android", "res", "layout", "focus_flow_widget_initial.xml");
    expect(provider).toContain("for (index in 0..4)");
    expect(provider).toContain("views.setOnClickPendingIntent(ids.decrement");
    expect(provider).toContain("views.setOnClickPendingIntent(ids.increment");
    expect(provider).not.toContain('setIncludeFontPadding');
    for (const row of ["one", "two", "three", "four", "five"]) {
      expect(layout).toContain(`focus_flow_widget_static_row_${row}_decrement`);
      expect(layout).toContain(`focus_flow_widget_static_row_${row}_increment`);
    }
  });
});
