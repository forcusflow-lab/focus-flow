import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..");
const source = (...segments: string[]) => readFileSync(resolve(root, ...segments), "utf8");

describe("v9 実機視覚品質の静的契約", () => {
  it("WidgetはRemoteViewsが許容するViewだけで構成し、動的alphaを使わない", () => {
    const layout = source("plugins", "native", "android", "res", "layout", "focus_flow_widget_initial.xml");
    const provider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");

    expect(layout).not.toMatch(/<View[\s>]/);
    expect(layout).toContain("<TextView android:id=\"@+id/focus_flow_widget_static_divider\"");
    expect(layout).toContain('android:id="@+id/focus_flow_widget_card"');
    expect(provider).not.toContain('setFloat(R.id.focus_flow_widget_card_background, "setAlpha"');
    expect(provider).not.toContain('setFloat(ids.check, "setAlpha"');
    expect(provider).toContain("widgetCardDrawable");
  });

  it("必須バッジは日本語と英語で切れない最小幅を持ち、習慣行に固定38dp枠を残さない", () => {
    const ui = source("components", "focus-flow", "ui.tsx");
    const habits = source("app", "(tabs)", "habits.tsx");

    expect(ui).toContain("minWidth: 42");
    expect(ui).toContain("flexShrink: 0");
    expect(habits).not.toContain("requiredSlot: { width: 38");
    expect(habits).toContain("label={t(\"必須\", \"Must-do\")}");
  });

  it("表示と言語はpaletteを入力・選択肢・カードへ渡し、固定白背景を残さない", () => {
    const settings = source("app", "(tabs)", "settings.tsx");

    expect(settings).toContain("const palette = useFocusPalette()");
    expect(settings).toContain("backgroundColor: palette.surface");
    expect(settings).toContain("borderColor: palette.border");
    expect(settings).not.toContain("fontChoice: { width: \"100%\", minHeight: 66, flexDirection: \"row\", alignItems: \"center\", justifyContent: \"space-between\", borderRadius: 14, borderWidth: 1, borderColor: \"#D8E2DC\", backgroundColor: COLORS.white");
  });
});
