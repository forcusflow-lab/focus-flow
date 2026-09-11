import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("Focus Flow v36 ウィジェット幾何学模様背景スタイル", () => {
  it("Vector Drawable リソースがライト・ダーク両方で定義されている", () => {
    const lightVector = source("plugins", "native", "android", "res", "drawable", "widget_bg_geometric.xml");
    const darkVector = source("plugins", "native", "android", "res", "drawable", "widget_bg_geometric_dark.xml");
    const nightVector = source("plugins", "native", "android", "res", "drawable-night", "widget_bg_geometric.xml");
    const appLight = source("android", "app", "src", "main", "res", "drawable", "widget_bg_geometric.xml");
    const appDark = source("android", "app", "src", "main", "res", "drawable", "widget_bg_geometric_dark.xml");

    expect(lightVector).toContain("<vector");
    expect(lightVector).toContain('android:viewportWidth="320"');
    expect(lightVector).toContain('android:viewportHeight="200"');
    expect(lightVector).toContain("<clip-path");
    expect(lightVector).toContain("#FFF7F8F5");
    expect(lightVector).toContain("#FFB8D4E8");
    expect(lightVector).toContain("#FFD4C4E0");

    expect(darkVector).toContain("<vector");
    expect(darkVector).toContain("#FF14231F");
    expect(darkVector).toContain("#FF2A4060");
    expect(darkVector).toContain("#FF3D2D50");

    expect(nightVector).toBe(darkVector);
    expect(appLight).toBe(lightVector);
    expect(appDark).toBe(darkVector);
  });

  it("layout XML に focus_flow_widget_bg_geometric が定義され、plugins と android/app で一致する", () => {
    const pluginLayout = source("plugins", "native", "android", "res", "layout", "focus_flow_widget_initial.xml");
    const appLayout = source("android", "app", "src", "main", "res", "layout", "focus_flow_widget_initial.xml");

    expect(pluginLayout).toContain("@+id/focus_flow_widget_bg_geometric");
    expect(pluginLayout).toContain("@drawable/widget_bg_geometric");
    expect(pluginLayout).toContain('android:visibility="gone"');
    expect(appLayout).toBe(pluginLayout);
  });

  it("FocusFlowWidgetProvider が幾何学背景とアルファ透過率を適用し、plugins と android/app で一致する", () => {
    const pluginProvider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    const appProvider = source("android", "app", "src", "main", "java", "com", "app", "focusflow", "focusflow", "FocusFlowWidgetProvider.kt");

    expect(pluginProvider).toContain('state.optString("widgetBackgroundStyle", "solid")');
    expect(pluginProvider).toContain('backgroundStyle == "geometric"');
    expect(pluginProvider).toContain("R.id.focus_flow_widget_bg_geometric");
    expect(pluginProvider).toContain("R.drawable.widget_bg_geometric");
    expect(pluginProvider).toContain("R.drawable.widget_bg_geometric_dark");
    expect(pluginProvider).toContain('"setImageAlpha"');
    expect(pluginProvider).toContain("Color.TRANSPARENT");
    expect(appProvider).toBe(pluginProvider);
  });

  it("プラグインコピーリストに幾何学ドローアブルが含まれている", () => {
    const plugin = source("plugins", "with-focus-flow-android.js");
    expect(plugin).toContain('"widget_bg_geometric.xml"');
    expect(plugin).toContain('"widget_bg_geometric_dark.xml"');
  });

  it("型定義・プロバイダー・AndroidGateに widgetBackgroundStyle が統合されている", () => {
    const types = source("lib", "focus-flow", "types.ts");
    const provider = source("lib", "focus-flow", "provider.tsx");
    const gate = source("lib", "focus-flow", "android-gate.ts");

    expect(types).toContain('export type WidgetBackgroundStyle = "solid" | "geometric";');
    expect(types).toContain("widgetBackgroundStyle?: WidgetBackgroundStyle;");
    expect(provider).toContain('const widgetBackgroundStyle = savedDisplaySettings.widgetBackgroundStyle === "geometric" ? "geometric" : "solid"');
    expect(provider).toContain("widgetBackgroundStyle }");
    expect(gate).toContain('const widgetBackgroundStyle = data.displaySettings.widgetBackgroundStyle ?? "solid"');
    expect(gate).toContain("widgetBackgroundStyle,");
  });

  it("設定画面に背景スタイル選択UIがあり、スライダー引き戻り防止の committedValue を持つ", () => {
    const settings = source("app", "(tabs)", "settings.tsx");

    expect(settings).toContain("onBackgroundStyle");
    expect(settings).toContain("背景スタイル");
    expect(settings).toContain('key: "solid", label: t("無地", "Solid")');
    expect(settings).toContain('key: "geometric", label: t("幾何学模様", "Geometric")');
    expect(settings).toContain("setCommittedValue(finalVal)");
    expect(settings).toContain("backgroundStyle = \"solid\"");
    expect(settings).toContain("widgetPreviewGeometricBase");
  });

  it("strings.xml および strings.ts に背景スタイル関連文言が集約されている", () => {
    const stringsXml = source("plugins", "native", "android", "res", "values", "strings.xml");
    const appStringsXml = source("android", "app", "src", "main", "res", "values", "strings.xml");
    const stringsTs = source("lib", "focus-flow", "strings.ts");

    expect(stringsXml).toContain('name="widget_bg_style_title">背景スタイル<');
    expect(stringsXml).toContain('name="widget_bg_style_solid">無地<');
    expect(stringsXml).toContain('name="widget_bg_style_geometric">幾何学模様<');
    expect(appStringsXml).toBe(stringsXml);

    expect(stringsTs).toContain('widget_bg_style_title: "widget_bg_style_title"');
    expect(stringsTs).toContain('widget_bg_style_solid: "widget_bg_style_solid"');
    expect(stringsTs).toContain('widget_bg_style_geometric: "widget_bg_style_geometric"');
    expect(stringsTs).toContain('ja: "幾何学模様"');
    expect(stringsTs).toContain('en: "Geometric"');
  });
});
