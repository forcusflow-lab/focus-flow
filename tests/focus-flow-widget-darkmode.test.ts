import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const read = (...segments: string[]) => fs.readFileSync(path.join(process.cwd(), ...segments), "utf8");

describe("Focus Flow 高密度Widgetとダークモード", () => {
  it("静的Widgetはアプリ文字サイズを本文と補足に同じ比率で反映し、必須表示で行高を増やさない", () => {
    const source = read("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    const layout = read("plugins", "native", "android", "res", "layout", "focus_flow_widget_initial.xml");

    expect(source).toContain('state.optString("widgetTextScale", "standard")');
    expect(source).toContain('13f * scale');
    expect(source).toContain('12f * scale');
    expect(source).toContain('10f * scale');
    expect(source).toContain('View.GONE');
    expect(source).toContain('compactBadge');
    expect(source).toContain('"MUST · TIME"');
    expect(layout).toContain('android:layout_height="48dp"');
    expect(layout).toContain('android:gravity="center_vertical"');
    expect(layout).toContain('android:maxLines="1"');
  });

  it("静的Widget行とヘッダーはライト・ダークで明示した高コントラスト本文色を使い、可変パレットの本文色を直接流用しない", () => {
    const provider = read("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");

    expect(provider).toContain('Color.parseColor("#13251F")');
    expect(provider).toContain('Color.parseColor("#F4FBF7")');
    expect(provider).toContain('Color.parseColor("#4E655B")');
    expect(provider).toContain('Color.parseColor("#B7CCC2")');
    expect(provider).not.toContain('paletteColor(palette, "text"');
    expect(provider).not.toContain('paletteColor(palette, "muted"');
    expect(provider).toContain('R.drawable.focus_flow_widget_card_light');
    expect(provider).toContain('R.drawable.focus_flow_widget_card_dark');
    expect(provider).toContain('R.id.focus_flow_widget_card_background');
    expect(provider).not.toContain('setFloat(R.id.focus_flow_widget_card, "setAlpha"');
    expect(provider).toContain('Color.parseColor("#D8E3DC")');
    expect(provider).toContain('Color.parseColor("#355047")');
  });

  it("外観設定をアプリ全体のテーマへ橋渡しし、共通テキストが意味色を動的パレットへ解決する", () => {
    const rootLayout = read("app", "_layout.tsx");
    const text = read("components", "focus-flow", "scaled-text.tsx");

    expect(rootLayout).toContain("FocusFlowThemeBridge");
    expect(rootLayout).toContain("resolveAppearance(displaySettings, systemScheme)");
    expect(rootLayout).toContain("setColorScheme(resolved)");
    expect(rootLayout).toContain("getAppPalette(displaySettings, systemScheme)");
    expect(rootLayout).toContain('backgroundColor: palette.background');
    expect(rootLayout).toContain('palette.isDark ? "light" : "dark"');
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

  it("共通UIの空状態とアイコン操作は固定ライトsurfaceを持ち込まず、paletteで面・境界・文字色を決める", () => {
    const ui = read("components", "focus-flow", "ui.tsx");

    expect(ui).toContain("backgroundColor: variant === \"filled\" ? palette.primary : palette.surface");
    expect(ui).toContain("backgroundColor: palette.surface, borderColor: palette.border");
    expect(ui).toContain("backgroundColor: palette.primarySoft");
    expect(ui).not.toContain('backgroundColor: "rgba(255,255,255,0.74)"');
    expect(ui).not.toContain('backgroundColor: "rgba(255,255,255,0.72)"');
  });
});
