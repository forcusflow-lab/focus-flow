import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getTodoAccentColor } from "../lib/focus-flow/utils";
import { R, stringResource } from "../lib/focus-flow/strings";

const source = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("Focus Flow v31 M3 Color Palette, Card Slimming & Top 3 Screens Dashboard Unification", () => {
  const uiSource = source("components", "focus-flow", "ui.tsx");
  const itemCards = source("components", "focus-flow", "item-cards.tsx");
  const taskForm = source("components", "focus-flow", "task-form.tsx");
  const habitForm = source("components", "focus-flow", "habit-form.tsx");
  const todayScreen = source("app", "(tabs)", "index.tsx");
  const todosScreen = source("app", "(tabs)", "todos.tsx");
  const habitsScreen = source("app", "(tabs)", "habits.tsx");
  const androidGate = source("lib", "focus-flow", "android-gate.ts");
  const stringsXml = source("plugins", "native", "android", "res", "values", "strings.xml");
  const nativeXml = source("android", "app", "src", "main", "res", "values", "strings.xml");

  describe("1. Material 3 カラーパレット刷新 & レール着色ロジック", () => {
    it("HABIT_COLORSがM3トーンの5色（ミント、ブルー、アンバー、パープル、ローズ）で定義されている", () => {
      expect(uiSource).toContain('export const HABIT_COLORS = ["#388E77", "#3D6E9B", "#BA7238", "#7E5E94", "#A65E68"];');
    });

    it("getTodoAccentColorが個別色および優先度M3トーン（高:#C05746, 中:#BA7238, 低:#3D6E9B）を正しく解決する", () => {
      expect(getTodoAccentColor({ color: "#7E5E94", priority: "medium" })).toBe("#7E5E94");
      expect(getTodoAccentColor({ priority: "high" })).toBe("#C05746");
      expect(getTodoAccentColor({ priority: "medium" })).toBe("#BA7238");
      expect(getTodoAccentColor({ priority: "low" })).toBe("#3D6E9B");
    });

    it("TodoItemCardがgetTodoAccentColorで左端レールを着色する", () => {
      expect(itemCards).toContain("const railColor = getTodoAccentColor(todo);");
      expect(itemCards).toContain("<View style={[styles.rail, { backgroundColor: railColor }]} />");
    });

    it("android-gate.tsがTodoのウィジェットaccentColorにgetTodoAccentColorを使用する", () => {
      expect(androidGate).toContain("accentColor: getTodoAccentColor(todo)");
    });
  });

  describe("2. UIガイド明示 & 選択UI統一（TaskForm & HabitForm）", () => {
    it("TaskFormとHabitFormの両方にガイドテキスト「カード左端の識別カラーとして表示されます」が存在する", () => {
      expect(taskForm).toContain('t("カード左端の識別カラーとして表示されます"');
      expect(habitForm).toContain('t("カード左端の識別カラーとして表示されます"');
    });

    it("TaskFormとHabitFormの両方がHABIT_COLORSを用いたカラー選択アコーディオンを持つ", () => {
      expect(taskForm).toContain("{HABIT_COLORS.map((item) =>");
      expect(habitForm).toContain("{HABIT_COLORS.map((item) =>");
      expect(taskForm).toContain("styles.colorButton");
      expect(habitForm).toContain("styles.colorButton");
    });
  });

  describe("3. タスク・習慣カードの情報スリム化", () => {
    it("RequiredLabelが極小ロックアイコン（14dp）を採用し、テキストピルを撤去している", () => {
      expect(itemCards).toContain("requiredLock: { width: 16, height: 16");
      expect(itemCards).toContain('<MaterialIcons name="lock" size={14} color={color} />');
    });

    it("習慣カードの折りたたみ状態ではタイトルと本日の進捗のみ表示し、週次・ストリークは展開領域へ移動している", () => {
      expect(itemCards).toContain("styles.expandedStatsRow");
      expect(itemCards).toContain("habitProgressPill");
    });
  });

  describe("4. トップ3画面（今日 / Todo / 習慣）のダッシュボード統一", () => {
    it("今日、Todo、習慣の3画面すべてでサマリーカードがelevated背景と18dp角丸を採用している", () => {
      expect(todayScreen).toContain("backgroundColor: palette.elevated");
      expect(todayScreen).toContain("borderRadius: 18");
      expect(todosScreen).toContain("backgroundColor: palette.elevated");
      expect(todosScreen).toContain("borderRadius: 18");
      expect(habitsScreen).toContain("backgroundColor: palette.elevated");
      expect(habitsScreen).toContain("borderRadius: 18");
    });

    it("3画面すべてでプログレスバーの高さが6dp、角丸が999に統一されている", () => {
      expect(todayScreen).toContain("height: 6");
      expect(todayScreen).toContain("borderRadius: 999");
      expect(todosScreen).toContain("height: 6");
      expect(todosScreen).toContain("borderRadius: 999");
      expect(habitsScreen).toContain("height: 6");
      expect(habitsScreen).toContain("borderRadius: 999");
    });
  });

  describe("5. 文字列リソースの集約", () => {
    it("strings.xmlとstrings.tsに新規文字列が集約されている", () => {
      for (const xml of [stringsXml, nativeXml]) {
        expect(xml).toContain('<string name="color_theme_title">テーマカラー</string>');
        expect(xml).toContain('<string name="color_theme_guide">カード左端の識別カラーとして表示されます</string>');
        expect(xml).toContain('<string name="color_choose_label">色を選択</string>');
      }

      expect(stringResource(R.string.color_theme_title, "ja")).toBe("テーマカラー");
      expect(stringResource(R.string.color_theme_title, "en")).toBe("Color theme");
      expect(stringResource(R.string.color_theme_guide, "ja")).toBe("カード左端の識別カラーとして表示されます");
      expect(stringResource(R.string.color_choose_label, "ja")).toBe("色を選択");
    });
  });
});
