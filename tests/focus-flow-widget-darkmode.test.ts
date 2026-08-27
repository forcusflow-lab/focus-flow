import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const read = (...segments: string[]) => fs.readFileSync(path.join(process.cwd(), ...segments), "utf8");

describe("Focus Flow 高密度Widgetとダークモード", () => {
  it("静的Widgetはアプリ文字サイズを本文と補足に同じ比率で反映し、必須タグを時間帯から分離する", () => {
    const source = read("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    const layout = read("plugins", "native", "android", "res", "layout", "focus_flow_widget_initial.xml");

    expect(source).toContain('state.optString("widgetTextScale", "standard")');
    expect(source).toContain('13f * scale');
    expect(source).toContain('12f * scale');
    expect(source).toContain('10f * scale');
    expect(source).toContain('11f * scale');
    expect(source).toContain('val meta = when {');
    expect(source).toContain("val timerRunning = item.optBoolean");
    expect(source).toContain("val timerPaused = item.optBoolean");
    expect(source).toContain('View.GONE');
    expect(source).toContain('compactBadge');
    expect(source).toContain('required -> if (english) "MUST" else "必須"');
    expect(layout).toContain('android:layout_height="54dp"');
    expect(layout).toContain('android:layout_marginBottom="3dp"');
    expect(layout).toContain('android:layout_marginStart="6dp"');
    expect(layout).toContain('android:gravity="center_vertical"');
    expect(layout).toContain('android:maxLines="1"');
  });

  it("静的Widgetはライト・ダークの明示コントラストと5段階カードdrawableを使い、RemoteViews動的alphaに依存しない", () => {
    const provider = read("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    const plugin = read("plugins", "with-focus-flow-android.js");

    expect(provider).toContain('paletteColor(palette, "text"');
    expect(provider).toContain('paletteColor(palette, "muted"');
    expect(provider).toContain('paletteColor(palette, "primarySoft"');
    expect(provider).toContain('R.id.focus_flow_widget_card, "setBackgroundResource"');
    expect(provider).toContain('widgetCardDrawable');
    ["light_0", "light_25", "light_50", "light_75", "light_100", "dark_0", "dark_25", "dark_50", "dark_75", "dark_100"].forEach((name) => {
      expect(provider).toContain(`focus_flow_widget_card_${name}`);
      expect(plugin).toContain(name);
    });
    expect(provider).not.toContain('R.id.focus_flow_widget_card_background');
    expect(provider).not.toContain('setFloat(');
    expect(provider).toContain('Color.parseColor("#C8D9D1")');
    expect(provider).toContain('Color.parseColor("#526B61")');
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

    expect(ui).toContain('backgroundColor: variant === "filled" ? palette.primary : palette.surface');
    expect(ui).toContain("backgroundColor: palette.surface, borderColor: palette.border");
    expect(ui).toContain("backgroundColor: palette.primarySoft");
    expect(ui).not.toContain('backgroundColor: "rgba(255,255,255,0.74)"');
    expect(ui).not.toContain('backgroundColor: "rgba(255,255,255,0.72)"');
  });
});
