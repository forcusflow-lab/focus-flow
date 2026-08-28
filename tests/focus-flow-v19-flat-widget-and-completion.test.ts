import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectFile = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("Focus Flow v19 flat Widget and completion quality contract", () => {
  it("auto-selects due-today-or-earlier Todo requirements while keeping manual requirements independent", () => {
    const form = projectFile("components", "focus-flow", "task-form.tsx");
    const utils = projectFile("lib", "focus-flow", "utils.ts");
    expect(form).toContain('const dueAutoRequired = useMemo(() => Boolean(dueDate && dueDate <= dayKey()), [dueDate])');
    expect(form).toContain('const effectiveRequired = isRequired || dueAutoRequired');
    expect(form).toContain('disabled: dueAutoRequired');
    expect(form).toContain('今日までのTodoは必須として自動適用されます');
    expect(utils).toContain('const dueTodayOrEarlierIsAlwaysRequired = Boolean(todo.dueDate && todo.dueDate <= today)');
    expect(utils).not.toContain('autoRequireDueToday && Boolean(todo.dueDate');
  });

  it("treats a Todo as a one-tap completion rather than a Habit-style progress workflow", () => {
    const provider = projectFile("lib", "focus-flow", "provider.tsx");
    const cards = projectFile("components", "focus-flow", "item-cards.tsx");
    const form = projectFile("components", "focus-flow", "task-form.tsx");
    const todoCard = cards.split("export function HabitItemCard")[0];
    expect(provider).toContain('return Boolean(todo.completed);');
    expect(provider).toContain('progressUnit: "check", targetValue: 1');
    expect(provider).toContain('const completed = !todo.completed;');
    expect(todoCard).not.toContain('onProgress');
    expect(todoCard).not.toContain('subtasks');
    expect(form).not.toContain('回数・時間・繰り返し・サブタスク');
  });

  it("places completed-item controls on Today, Todo, and Habit screens without a Settings switch", () => {
    const today = projectFile("app", "(tabs)", "index.tsx");
    const todos = projectFile("app", "(tabs)", "todos.tsx");
    const habits = projectFile("app", "(tabs)", "habits.tsx");
    const settings = projectFile("app", "(tabs)", "settings.tsx");
    [today, todos, habits].forEach((source) => {
      expect(source).toContain('setShowCompleted((value) => !value)');
      expect(source).toContain('完了済みを非表示');
      expect(source).toContain('完了済みを表示');
    });
    expect(settings).not.toContain('CompletedItemsToggle');
    expect(settings).not.toContain('Today画面');
    expect(settings).not.toContain('Widgetの完了済み');
  });

  it("uses a theme-colored, gapless static Widget list with separate background and row opacity", () => {
    const gate = projectFile("lib", "focus-flow", "android-gate.ts");
    const provider = projectFile("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    const layout = projectFile("plugins", "native", "android", "res", "layout", "focus_flow_widget_initial.xml");
    const settings = projectFile("app", "(tabs)", "settings.tsx");
    expect(gate).toContain('widgetBackgroundOpacity');
    expect(gate).toContain('widgetCardOpacity');
    expect(gate).toContain('const widgetCompletedDisplay = "local"');
    expect(provider).toContain('colorWithOpacity');
    expect(provider).toContain('setBackgroundColor');
    expect(provider).not.toContain('itemCardDrawable(theme, dark');
    expect(layout).toContain('android:layout_height="52dp"');
    expect(layout).toContain('android:layout_height="48dp"');
    expect(layout).not.toContain('android:layout_marginStart="7dp"');
    expect(layout).not.toContain('android:layout_marginTop="4dp"');
    expect(layout).not.toContain('android:layout_weight');
    expect(layout).not.toContain('<ListView');
    expect(settings).toContain('function OpacitySlider');
    expect(settings).toContain('Math.round(((clampedX - thumbRadius) / usableTrackWidth) * 100)');
  });

  it("keeps the normal and personal Android version codes separated for the current build", () => {
    const config = projectFile("app.config.ts");
    expect(config).toContain('versionCode: isPersonalUnlimitedBuild ? 24 : 34');
    expect(config).toContain('"com.app.focusflow.personal"');
    expect(config).toContain('"manusfocusflowpersonal"');
  });
});
