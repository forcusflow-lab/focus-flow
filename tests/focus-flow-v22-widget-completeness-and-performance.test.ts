import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const source = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("Focus Flow v23 widget density, transparency, and app-picker performance", () => {
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
    expect(provider).toContain("WidgetBucket(5");
    expect(provider).toContain("manager.updateAppWidget(id, createWidgetViews");
    expect(provider).not.toContain("SizeF(");
    expect(provider).toContain("for (index in 0..4)");
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

  it("ships every theme-specific mandatory pill at each row-opacity level and copies the resources in prebuild", () => {
    const plugin = source("plugins", "with-focus-flow-android.js");
    expect(plugin).toContain("const widgetBadgeDrawables");
    expect(plugin).toContain("const widgetBadgeOpacityDrawables");
    expect(plugin).toContain("focus_flow_widget_badge_${theme}_${appearance}_${opacity}.xml");
    const provider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    expect(provider).toContain("widgetBadgeDrawable(context, theme, dark, rowOpacity)");
    expect(provider).toContain('"focus_flow_widget_badge_${theme}_${appearance}_$level"');
    expect(plugin).toContain("focus_flow_widget_badge_${theme}_${appearance}.xml");
    for (const theme of ["mist", "slate", "evergreen", "ocean", "orchid", "sunrise"]) {
      for (const mode of ["light", "dark"]) {
        for (const opacity of [0, 25, 50, 75, 100]) {
          const name = `focus_flow_widget_badge_${theme}_${mode}_${opacity}.xml`;
          const drawable = source("plugins", "native", "android", "res", "drawable", name);
          expect(drawable).toContain('android:shape="rectangle"');
          expect(drawable).toContain('android:radius="999dp"');
        }
      }
    }
    expect(source("plugins", "native", "android", "res", "drawable", "focus_flow_widget_badge_mist_light_100.xml")).toContain('android:width="1dp"');
    expect(source("plugins", "native", "android", "res", "drawable", "focus_flow_widget_badge_mist_dark_100.xml")).toContain('android:width="1dp"');
  });

  it("keeps the expanded widget as a RemoteViews-only five-row list with compact in-card controls", () => {
    const provider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    const layout = source("plugins", "native", "android", "res", "layout", "focus_flow_widget_initial.xml");
    expect(layout).toContain("focus_flow_widget_static_row_five");
    expect(layout).toContain("focus_flow_widget_static_divider_four");
    expect(layout).toContain("focus_flow_widget_static_row_one_controls_background");
    expect(layout).toContain("focus_flow_widget_static_row_one_timer_container");
    expect(layout).not.toContain("<View");
    expect(layout).not.toContain("layout_weight");
    expect(layout).not.toContain('="0dp"');
    expect(provider).toContain("views.setImageViewResource(ids.controlsBackground, widgetCardDrawable(dark, rowOpacity))");
    expect(provider).toContain("views.setViewVisibility(ids.timerContainer, View.VISIBLE)");
    expect(provider).toContain("views.setOnClickPendingIntent(ids.controls, actionIntent(context, widgetId, ids.position, timerAction, itemId, kind))");
  });

  it("avoids redundant Native refreshes and unneeded UI work while virtualizing the installed-app list", () => {
    const module = source("plugins", "native", "android", "kotlin", "FocusGateModule.kt");
    const provider = source("lib", "focus-flow", "provider.tsx");
    const settings = source("app", "(tabs)", "settings.tsx");
    expect(module).toContain("if (preferences.getString(GATE_STATE, null) == serialized)");
    expect(provider).toContain("const hasRunningTimedHabit");
    expect(provider).toContain("if (!hasRunningTimedHabit) return;");
    expect(settings).toContain("<FlatList");
    expect(settings).toContain("function appSelectionRowHeight");
    expect(settings).toContain("fontScale === \"large\" ? 76");
    expect(settings).toContain("appSelectionStyles.name");
    expect(settings).toContain("fontSize: 15");
    expect(settings).toContain("initialNumToRender={10}");
    expect(settings).toContain("maxToRenderPerBatch={10}");
    expect(settings).toContain("windowSize={5}");
    expect(settings).toContain("removeClippedSubviews={Platform.OS === \"android\"}");
    expect(settings).toContain("const getItemLayout = useCallback");
    expect(settings).toContain("function RoutineAppPicker");
    expect(settings).toContain("<FlatList data={apps}");
  });
});
