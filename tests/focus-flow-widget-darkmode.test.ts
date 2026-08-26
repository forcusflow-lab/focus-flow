import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const read = (...segments: string[]) => fs.readFileSync(path.join(process.cwd(), ...segments), "utf8");

describe("Focus Flow 高密度Widgetとダークモード", () => {
  it("Widgetはアプリ文字サイズを本文と補足に同じ比率で反映し、必須表示で行高を増やさない", () => {
    const source = read("plugins", "native", "android", "kotlin", "FocusFlowWidgetItemsService.kt");
    const layout = read("plugins", "native", "android", "res", "layout", "focus_flow_widget_item.xml");

    expect(source).toContain('state.optString("widgetTextScale", "standard")');
    expect(source).toContain('13f * scale');
    expect(source).toContain('10f * scale');
    expect(source).toContain('View.GONE');
    expect(source).toContain('joinToString(" · ")');
    expect(layout).toContain('android:layout_height="48dp"');
    expect(layout).toContain('android:gravity="center"');
    expect(layout).toContain('android:maxLines="1"');
  });

  it("外観設定をアプリ全体のテーマへ橋渡しし、共通テキストが意味色を動的パレットへ解決する", () => {
    const rootLayout = read("app", "_layout.tsx");
    const text = read("components", "focus-flow", "scaled-text.tsx");

    expect(rootLayout).toContain("FocusFlowThemeBridge");
    expect(rootLayout).toContain("resolveAppearance(displaySettings, systemScheme)");
    expect(rootLayout).toContain("setColorScheme(resolved)");
    expect(text).toContain("semanticTextColor");
    expect(text).toContain("getAppPalette(displaySettings, systemScheme)");
    expect(text).toContain("palette.primary");
    expect(text).toContain("palette.text");
    expect(text).toContain("palette.muted");
  });

  it("主要画面・公開情報・操作モーダルが固定の白い面ではなく動的パレットを利用する", () => {
    const targets = [
      read("app", "(tabs)", "index.tsx"),
      read("app", "(tabs)", "todos.tsx"),
      read("app", "(tabs)", "habits.tsx"),
      read("app", "privacy.tsx"),
      read("app", "support.tsx"),
      read("components", "public-information-page.tsx"),
      read("components", "focus-flow", "task-form.tsx"),
    ];

    targets.forEach((source) => {
      expect(source).toContain("useFocusPalette");
      expect(source.includes("palette.surface") || source.includes("palette.primarySoft")).toBe(true);
      expect(source).toContain("palette.border");
    });
  });
});
