import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");
const source = (...segments: string[]) => fs.readFileSync(path.join(root, ...segments), "utf8");

describe("v12 時間帯必須・起動・Today UX", () => {
  it("Todoと習慣は必須の実行時間帯を共通データモデルとして保存する", () => {
    const types = source("lib", "focus-flow", "types.ts");
    const provider = source("lib", "focus-flow", "provider.tsx");
    const utils = source("lib", "focus-flow", "utils.ts");
    expect(types).toContain('export type RequiredWindowMode = "always" | "scheduled"');
    expect(types.match(/requiredScheduleIds\?: string\[\];/g)?.length).toBe(2);
    expect(provider).toContain("normalizedRequiredWindow");
    expect(provider).toContain("availableScheduleIds");
    expect(utils).toContain("isItemRequiredDuringActiveGate");
    expect(utils).toContain("isHabitRequiredForGate");
  });

  it("Todoと習慣のフォームでは必須にした時だけ既存の集中時間帯を選べる", () => {
    const taskForm = source("components", "focus-flow", "task-form.tsx");
    const habitForm = source("components", "focus-flow", "habit-form.tsx");
    const selector = source("components", "focus-flow", "required-window-selector.tsx");
    [taskForm, habitForm].forEach((form) => {
      expect(form).toContain("RequiredWindowSelector");
      expect(form).toContain("requiredWindowMode");
      expect(form).toContain("requiredScheduleIds");
      expect(form).toContain("schedules={gateConfig.schedules}");
    });
    expect(selector).toContain('if (!isRequired) return null');
    expect(selector).toContain("いつでも必須");
    expect(selector).toContain("設定済みの時間帯だけ必須にする");
  });

  it("Todayは現在必要な項目と開始待ちの項目を分け、ウィジェットにも時間帯を渡す", () => {
    const today = source("app", "(tabs)", "index.tsx");
    const androidGate = source("lib", "focus-flow", "android-gate.ts");
    const widgetProvider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    expect(today).toContain('title: t("今やる", "Do now")');
    expect(today).toContain('title: t("この後", "Up next")');
    expect(today).toContain("waitingTodoIds");
    expect(androidGate).toContain("windowLabelFor");
    expect(widgetProvider).toContain('optString("windowLabel", "")');
    expect(widgetProvider).toContain("listOfNotNull");
  });

  it("Todayではチェックが画面遷移を起こさず、本文は一覧タブを経由せず直接詳細を開く", () => {
    const today = source("app", "(tabs)", "index.tsx");

    expect(today).toContain("const [openedTodo, setOpenedTodo]");
    expect(today).toContain("const [openedHabit, setOpenedHabit]");
    expect(today).toContain("onOpen={() => setOpenedTodo(item.todo)}");
    expect(today).toContain("onOpen={() => setOpenedHabit(item.habit)}");
    expect(today).toContain("<TaskForm visible={Boolean(openedTodo)}");
    expect(today).toContain("<HabitForm visible={Boolean(openedHabit)}");
    expect(today).not.toContain('router.push({ pathname: "/(tabs)/todos", params: { open: item.todo.id } })');
    expect(today).not.toContain('router.push({ pathname: "/(tabs)/habits", params: { open: item.habit.id } })');
  });

  it("遮断・ウィジェットのToday遷移と起動画面はルーター互換の全画面導入を使う", () => {
    const gateService = source("plugins", "native", "android", "kotlin", "FocusGateService.kt");
    const widgetProvider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    const layout = source("app", "_layout.tsx");
    expect(gateService).toContain('Uri.parse("$DEEP_LINK_SCHEME:///")');
    expect(widgetProvider).toContain('"todos" -> appendPath("todos")');
    expect(widgetProvider).toContain('Uri.parse("$DEEP_LINK_SCHEME:///")');
    expect(widgetProvider).not.toContain('Uri.parse("$DEEP_LINK_SCHEME://$path")');
    expect(layout).toContain("SplashScreen.preventAutoHideAsync");
    expect(layout).toContain("FocusFlowLaunchShell");
    expect(layout).toContain("今日を、ひとつずつ。");
  });
});
