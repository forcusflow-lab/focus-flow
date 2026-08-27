import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const source = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("Focus Flow v22 widget completeness and performance", () => {
  it("keeps mandatory candidates, completed candidates, stable ordering, and a visible overflow affordance in the widget payload", () => {
    const gate = source("lib", "focus-flow", "android-gate.ts");
    const provider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    expect(gate).toContain("isTodoEffectiveRequired(todo)");
    expect(gate).toContain("const completedTodoItems = effectiveRequiredTodos.filter");
    expect(gate).toContain("const completedHabitItems = effectiveRequiredHabits.filter");
    expect(gate).toContain("stableOrder");
    expect(gate).toContain("...completedTodoItems.map");
    expect(gate).toContain("...completedHabitItems.map");
    expect(provider).toContain("val overflow = (candidates - bucket.maxRows).coerceAtLeast(0)");
    expect(provider).toContain('"ほか${overflow}件"');
    expect(provider).toContain("WidgetBucket(1");
    expect(provider).toContain("WidgetBucket(2");
    expect(provider).toContain("WidgetBucket(3");
  });

  it("uses a per-widget completed-visibility key and passes its widget ID in the toggle action", () => {
    const provider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    expect(provider).toContain('private fun completedVisibilityKey(id: Int) = "$WIDGET_SHOW_COMPLETED_PREFIX$id"');
    expect(provider).toContain("widgetCompletedVisible(context, widgetId)");
    expect(provider).toContain("visibleWidgetItems(context, widgetId, all)");
    expect(provider).toContain("putExtra(EXTRA_WIDGET_ID, widgetId)");
    expect(provider).toContain("toggleCompletedVisibility(context, intent.getIntExtra(EXTRA_WIDGET_ID, -1))");
    expect(provider).toContain('"すべて表示（$completedCount）"');
    expect(provider).toContain('"未完了のみ"');
  });

  it("ships every theme-specific mandatory pill as a rounded Android shape and copies the resources in prebuild", () => {
    const plugin = source("plugins", "with-focus-flow-android.js");
    expect(plugin).toContain("const widgetBadgeDrawables");
    expect(plugin).toContain("focus_flow_widget_badge_${theme}_${appearance}.xml");
    for (const theme of ["mist", "slate", "evergreen", "ocean", "orchid", "sunrise"]) {
      for (const mode of ["light", "dark"]) {
        const name = `focus_flow_widget_badge_${theme}_${mode}.xml`;
        const drawable = source("plugins", "native", "android", "res", "drawable", name);
        expect(drawable).toContain('android:shape="rectangle"');
        expect(drawable).toContain('android:radius="999dp"');
      }
    }
  });

  it("avoids redundant Native refreshes and unneeded UI work while virtualizing the installed-app list", () => {
    const module = source("plugins", "native", "android", "kotlin", "FocusGateModule.kt");
    const provider = source("lib", "focus-flow", "provider.tsx");
    const settings = source("app", "(tabs)", "settings.tsx");
    expect(module).toContain("if (preferences.getString(GATE_STATE, null) == serialized)");
    expect(provider).toContain("const hasRunningTimedHabit");
    expect(provider).toContain("if (!hasRunningTimedHabit) return;");
    expect(settings).toContain("<FlatList");
    expect(settings).toContain("initialNumToRender={12}");
    expect(settings).toContain("maxToRenderPerBatch={12}");
    expect(settings).toContain("windowSize={7}");
    expect(settings).toContain("removeClippedSubviews={Platform.OS === \"android\"}");
    expect(settings).toContain("getItemLayout={(_data, index) => ({ length: 72, offset: 72 * index, index })}");
  });
});
