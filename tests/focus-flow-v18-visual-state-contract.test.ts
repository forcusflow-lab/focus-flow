import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectFile = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("Focus Flow v18 visual-state quality contract", () => {
  it("places Todo and Habit save actions above Android system navigation with a safe-area footer", () => {
    const taskForm = projectFile("components", "focus-flow", "task-form.tsx");
    const habitForm = projectFile("components", "focus-flow", "habit-form.tsx");
    [taskForm, habitForm].forEach((source) => {
      expect(source).toContain('useSafeAreaInsets');
      expect(source).toContain('paddingBottom: Math.max(insets.bottom, 12)');
      expect(source).toContain('style={[styles.footer');
      expect(source).toContain('style={styles.scroll}');
    });
  });

  it("uses short due labels and the same effective-required pill in Todo, Today, and Widget sync", () => {
    const cards = projectFile("components", "focus-flow", "item-cards.tsx");
    const today = projectFile("app", "(tabs)", "index.tsx");
    const gate = projectFile("lib", "focus-flow", "android-gate.ts");
    expect(cards).toContain('t("今日まで", "Due today")');
    expect(cards).toContain('showRequired || isTodoEffectiveRequired(todo)');
    expect(today).toContain('isTodoEffectiveRequired(todo)');
    expect(gate).toContain('isTodoEffectiveRequired(todo)');
  });

  it("keeps completed items in stable order and provides a temporary reveal path without changing saved display settings", () => {
    const todos = projectFile("app", "(tabs)", "todos.tsx");
    const today = projectFile("app", "(tabs)", "index.tsx");
    const gate = projectFile("lib", "focus-flow", "android-gate.ts");
    const provider = projectFile("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    expect(todos).toContain('setShowHiddenCompleted(true)');
    expect(todos).toContain('const openTodos');
    expect(todos).toContain('const doneTodos');
    expect(todos).not.toContain('setUndo');
    expect(today).toContain('params.completed');
    expect(today).toContain('setShowHiddenCompleted(true)');
    expect(gate).toContain('stableOrder');
    expect(gate).toContain('widgetHiddenCompletedCount');
    expect(provider).toContain('showCompleted = showCompleted');
    expect(provider).toContain('appendQueryParameter("completed", "1")');
  });

  it("binds Widget headers and mini-cards to every app theme, with rounded rails clipped inside the card", () => {
    const provider = projectFile("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    const plugin = projectFile("plugins", "with-focus-flow-android.js");
    const layout = projectFile("plugins", "native", "android", "res", "layout", "focus_flow_widget_initial.xml");
    expect(provider).toContain('widgetSurfaceDrawable(state.optString("widgetTheme", "mist"), dark)');
    expect(provider).toContain('itemCardDrawable(theme, dark');
    expect(provider).toContain('"sunrise" ->');
    expect(plugin).toContain('widgetThemeSurfaces');
    expect(layout).toContain('android:layout_marginTop="4dp" android:layout_marginBottom="4dp"');
    expect(layout).toContain('@drawable/focus_flow_widget_surface_mist_light');
    expect(layout).not.toContain('android:layout_weight');
    expect(layout).not.toContain('<ListView');
  });

  it("uses aligned, explicit completed-display Switch copy for both independently persisted display targets", () => {
    const settings = projectFile("app", "(tabs)", "settings.tsx");
    expect(settings).toContain('visible ? "完了済みを残す" : "完了済みを非表示"');
    expect(settings).toContain('Today画面');
    expect(settings).toContain('Widgetの完了済み');
    expect(settings).toContain('completedToggleRow: { minHeight: 64');
    expect(settings).toContain('thumbColor={COLORS.white}');
  });
});
