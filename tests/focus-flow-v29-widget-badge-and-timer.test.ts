import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("Focus Flow v29/v30 Widgetバッジ右端固定（パターンA）・文言同期・タイマーボタン調和", () => {
  it("ウィジェットXMLのバッジはパターンA右端配置(top|end)を適用し、省略表示を廃止して十分な表示幅を確保する", () => {
    const layout = source("plugins", "native", "android", "res", "layout", "focus_flow_widget_initial.xml");
    for (const row of ["one", "two", "three", "four", "five"]) {
      expect(layout).toContain(`focus_flow_widget_static_row_${row}_title" android:layout_width="match_parent"`);
      expect(layout).toContain(`focus_flow_widget_static_row_${row}_badge_container" android:layout_width="wrap_content" android:layout_height="18dp" android:layout_gravity="top|end"`);
      expect(layout).toContain(`focus_flow_widget_static_row_${row}_badge" android:layout_width="wrap_content" android:layout_height="match_parent" android:gravity="center" android:includeFontPadding="false" android:maxLines="1" android:minWidth="32dp"`);
      expect(layout).not.toContain(`focus_flow_widget_static_row_${row}_badge" android:layout_width="wrap_content" android:layout_height="match_parent" android:ellipsize="end"`);
    }
  });

  it("タイマーボタンは回数カウンターと同一のピル型コンテナ幅(match_parent)とドローアブルを適用する", () => {
    const layout = source("plugins", "native", "android", "res", "layout", "focus_flow_widget_initial.xml");
    for (const row of ["one", "two", "three", "four", "five"]) {
      expect(layout).toContain(`focus_flow_widget_static_row_${row}_timer_container" android:layout_width="match_parent"`);
      expect(layout).toContain(`focus_flow_widget_static_row_${row}_timer_background" android:layout_width="match_parent" android:layout_height="match_parent" android:contentDescription="" android:src="@drawable/focus_flow_widget_pill_container"`);
    }
  });

  it("ProviderのcompactBadgeは必須習慣を終日と上書きせず、アプリ本体と同一の必須タグを返す", () => {
    const provider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    expect(provider).toContain('val required = item.optBoolean("required", false) || item.optBoolean("gateRequired", false)');
    expect(provider).toContain('required -> if (english) "MUST" else "必須"');
    expect(provider).not.toContain('return if (required) (if (english) "ALL-DAY" else "終日") else badge');
  });

  it("期限なしTodoのWidgetサブテキストは汎用Todoではなく今日までを表示し、本体と同期する", () => {
    const gate = source("lib", "focus-flow", "android-gate.ts");
    const provider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    expect(gate).toContain('!todo.dueDate ? (language === "en" ? "Due today" : "今日まで")');
    expect(provider).toContain('val dueText = item.optString("dueLabel").ifBlank { if (english) "Due today" else "今日まで" }');
    expect(provider).not.toContain('else -> if (english) "Todo" else "Todo"');
  });
});
