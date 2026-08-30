import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
const source = (...segments: string[]) => readFileSync(resolve(__dirname, "..", ...segments), "utf8");
describe("Widgetのサイズ・連続リスト・必須表示契約", () => {
  it("リサイズCallbackと単一RemoteViewsでsmall・medium・largeを1/2/3行へ切り替える", () => { const provider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt"); ["onAppWidgetOptionsChanged", "rememberWidgetBucket", "createWidgetViews", "manager.updateAppWidget(id, createWidgetViews", "WidgetBucket(1", "WidgetBucket(2", "WidgetBucket(3", "WidgetBucket(5"].forEach((text) => expect(provider).toContain(text)); expect(provider).not.toContain("RemoteViews(mappings)"); });
  it("本体palette・有効必須・Habit計測を静的Widgetへ同期する", () => { const bridge = source("lib", "focus-flow", "android-gate.ts"); const provider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt"); ["isTodoEffectiveRequired(todo)", "widgetBackgroundOpacity", "widgetCardOpacity", "timerElapsedSeconds"].forEach((text) => expect(bridge).toContain(text)); ["paletteColor(palette, \"primary\"", "setChronometer", "unit == \"count\"", "unit == \"minutes\""].forEach((text) => expect(provider).toContain(text)); });
});
