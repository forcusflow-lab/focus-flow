import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("Focus Flow v38 カスタム背景システム & Pro連携", () => {
  it("Vector Drawable リソース（Aurora, Grid）がライト・ダーク両方で定義されている", () => {
    const auroraLight = source("plugins", "native", "android", "res", "drawable", "widget_bg_aurora.xml");
    const auroraDark = source("plugins", "native", "android", "res", "drawable", "widget_bg_aurora_dark.xml");
    const auroraNight = source("plugins", "native", "android", "res", "drawable-night", "widget_bg_aurora.xml");
    const appAuroraLight = source("android", "app", "src", "main", "res", "drawable", "widget_bg_aurora.xml");
    const appAuroraDark = source("android", "app", "src", "main", "res", "drawable", "widget_bg_aurora_dark.xml");

    expect(auroraLight).toContain("<vector");
    expect(auroraLight).toContain("<clip-path");
    expect(auroraLight).toContain("#FFBCE3DB");
    expect(auroraLight).toContain("#FFD5C8E8");
    expect(auroraDark).toContain("#FF1D3F38");
    expect(auroraDark).toContain("#FF2D2545");
    expect(auroraNight).toBe(auroraDark);
    expect(appAuroraLight).toBe(auroraLight);
    expect(appAuroraDark).toBe(auroraDark);

    const gridLight = source("plugins", "native", "android", "res", "drawable", "widget_bg_grid.xml");
    const gridDark = source("plugins", "native", "android", "res", "drawable", "widget_bg_grid_dark.xml");
    const gridNight = source("plugins", "native", "android", "res", "drawable-night", "widget_bg_grid.xml");
    const appGridLight = source("android", "app", "src", "main", "res", "drawable", "widget_bg_grid.xml");
    const appGridDark = source("android", "app", "src", "main", "res", "drawable", "widget_bg_grid_dark.xml");

    expect(gridLight).toContain("<vector");
    expect(gridLight).toContain("<clip-path");
    expect(gridLight).toContain('android:strokeColor="#FFDCE5E0"');
    expect(gridDark).toContain('android:strokeColor="#FF233830"');
    expect(gridNight).toBe(gridDark);
    expect(appGridLight).toBe(gridLight);
    expect(appGridDark).toBe(gridDark);
  });

  it("プラグインコピーマニフェストに Aurora と Grid のドローアブルが含まれている", () => {
    const plugin = source("plugins", "with-focus-flow-android.js");
    expect(plugin).toContain('"widget_bg_aurora.xml"');
    expect(plugin).toContain('"widget_bg_aurora_dark.xml"');
    expect(plugin).toContain('"widget_bg_grid.xml"');
    expect(plugin).toContain('"widget_bg_grid_dark.xml"');
  });

  it("FocusFlowWidgetProvider が solid, geometric, aurora, grid をサポートしプラグインと同期している", () => {
    const pluginProvider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    const appProvider = source("android", "app", "src", "main", "java", "com", "app", "focusflow", "focusflow", "FocusFlowWidgetProvider.kt");

    expect(pluginProvider).toContain('backgroundStyle == "geometric"');
    expect(pluginProvider).toContain('backgroundStyle == "aurora"');
    expect(pluginProvider).toContain('backgroundStyle == "grid"');
    expect(pluginProvider).toContain("R.drawable.widget_bg_aurora");
    expect(pluginProvider).toContain("R.drawable.widget_bg_aurora_dark");
    expect(pluginProvider).toContain("R.drawable.widget_bg_grid");
    expect(pluginProvider).toContain("R.drawable.widget_bg_grid_dark");
    expect(pluginProvider).toContain('"setImageAlpha"');
    expect(appProvider).toBe(pluginProvider);
  });

  it("AppBackground コンポーネントが存在し ScreenContainer に統合されている", () => {
    const appBg = source("components", "app-background.tsx");
    const screenContainer = source("components", "screen-container.tsx");

    expect(appBg).toContain("export const AppBackground");
    expect(appBg).toContain('pointerEvents="none"');
    expect(appBg).toContain("StyleSheet.absoluteFill");
    expect(appBg).toContain('style === "geometric"');
    expect(appBg).toContain('style === "aurora"');
    expect(appBg).toContain('style === "grid"');

    expect(screenContainer).toContain("<AppBackground");
  });

  it("ミニプレビューで無地選択時に壁紙の円が非表示になり、カスタム背景が描画される", () => {
    const settings = source("app", "(tabs)", "settings.tsx");

    expect(settings).toContain('backgroundStyle !== "solid"');
    expect(settings).toContain("widgetPreviewGeometricBase");
    expect(settings).toContain("widgetPreviewAuroraA");
    expect(settings).toContain("widgetPreviewGridLine");
  });

  it("Pro連携: 👑 バッジが表示され、無料ユーザーが選択した場合はPaywall警告が動作する", () => {
    const settings = source("app", "(tabs)", "settings.tsx");

    expect(settings).toContain("bgStyleProBadge");
    expect(settings).toContain("👑 Pro");
    expect(settings).toContain("option.isPro && !isPlus");
    expect(settings).toContain("onOpenPlus?.()");
    expect(settings).toContain('key: "solid"');
    expect(settings).toContain('key: "geometric"');
    expect(settings).toContain('key: "aurora"');
    expect(settings).toContain('key: "grid"');
  });

  it("多言語リソース（strings.xml, strings.ts）に背景テーマ関連のキーが追加されている", () => {
    const stringsXml = source("plugins", "native", "android", "res", "values", "strings.xml");
    const stringsTs = source("lib", "focus-flow", "strings.ts");

    expect(stringsXml).toContain('name="widget_bg_style_aurora"');
    expect(stringsXml).toContain('name="widget_bg_style_grid"');
    expect(stringsXml).toContain('name="bg_theme_title"');
    expect(stringsXml).toContain('name="bg_theme_detail"');
    expect(stringsXml).toContain('name="pro_badge"');

    expect(stringsTs).toContain("widget_bg_style_aurora:");
    expect(stringsTs).toContain("widget_bg_style_grid:");
    expect(stringsTs).toContain("bg_theme_title:");
    expect(stringsTs).toContain("bg_theme_detail:");
  });
});
