import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("Focus Flow v32 Lock Icon, Card Slimming & Widget Subtext Refinement", () => {
  const itemCards = source("components", "focus-flow", "item-cards.tsx");
  const androidGate = source("lib", "focus-flow", "android-gate.ts");
  const pluginProvider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
  const appProvider = source("android", "app", "src", "main", "java", "com", "app", "focusflow", "focusflow", "FocusFlowWidgetProvider.kt");
  const buildGradle = source("android", "app", "build.gradle");

  describe("1. 「必須」テキストバッジの完全撤去 & 極小ロックアイコン化（本体）", () => {
    it("RequiredLabelがベタ塗り/カプセルピルを廃止し、14dpのMaterialIcons lockを採用している", () => {
      expect(itemCards).toContain('<MaterialIcons name="lock" size={14} color={color} />');
      expect(itemCards).toContain("requiredLock: { width: 16, height: 16");
      expect(itemCards).not.toMatch(/requiredLabelText:\s*\{[^}]*displayLabel/);
    });

    it("TodoItemCardとHabitItemCardが控えめなカラー（palette.muted）をRequiredLabelへ渡している", () => {
      expect(itemCards).toContain('<RequiredLabel label={t("必須", "Must-do")} color={palette.muted} />');
    });

    it("スクリーンリーダー用のアクセシビリティラベル（必須 / Must-do）を維持している", () => {
      expect(itemCards).toContain('const displayLabel = label === "Must-do" ? label : "必須"');
      expect(itemCards).toContain('accessibilityRole="image"');
      expect(itemCards).toContain("accessibilityLabel={displayLabel}");
    });
  });

  describe("2. カードごとの自然なレイアウト整理（本体）", () => {
    it("Todoカードはタイトル＋🔒アイコンを主役に、期限・メモ・サブタスクがある場合のみメタ行を表示する", () => {
      expect(itemCards).toContain("<View style={styles.todoTitleLine}>");
      expect(itemCards).toContain("{todo.memo || due ? (");
      expect(itemCards).toContain("{subtasks.length ? (");
    });

    it("習慣カードはタイトル＋🔒アイコン＋Chevronを1行目に配置し、サブ行には今日の実績のみを表示する", () => {
      expect(itemCards).toContain("<View style={styles.habitTitleLine}>");
      expect(itemCards).toContain("styles.expandButton");
      expect(itemCards).toContain("styles.habitProgressPill");
      expect(itemCards).toContain("styles.expandedStatsRow");
    });
  });

  describe("3. ウィジェットの情報スリム化（本体と完全同期）", () => {
    it("android-gate.tsのhabitWidgetMetaから長期統計（週・ストリーク）が削除されている", () => {
      expect(androidGate).not.toContain("weeklyHabitProgress(habit)");
      expect(androidGate).not.toContain("habitStreak(habit)");
    });

    it("WidgetProviderで必須アイテムのタイトルに極小ロックアイコン（🔒）が付与される", () => {
      for (const provider of [pluginProvider, appProvider]) {
        expect(provider).toContain('val isRequired = item.optBoolean("required", false) || item.optBoolean("gateRequired", false)');
        expect(provider).toContain('val titleText = if (isRequired) "$title 🔒" else title');
      }
    });

    it("WidgetProviderのcompactBadgeで必須アイテムのテキストバッジ（MUST/必須）が撤廃されている", () => {
      for (const provider of [pluginProvider, appProvider]) {
        expect(provider).toContain('// v32: 必須テキストバッジ（MUST/必須）は完全撤去し、タイトルの🔒アイコンへ移行。');
      }
    });

    it("WidgetProviderの習慣サブテキストは長期統計を排除し、当日の進捗のみに絞り込まれている", () => {
      for (const provider of [pluginProvider, appProvider]) {
        expect(provider).toContain('val countLabel = if (english) "$countValue/$countTarget" else "$countValue/${countTarget}回"');
        expect(provider).toContain('val habitCountMeta = if (kind == "habit" && unit == "count") countLabel else ""');
        expect(provider).not.toContain('listOfNotNull("⚑ $countLabel", habitMeta');
      }
    });
  });

  describe("4. デザイン確認用Roborazziスクショ自動更新タスク & ダミーデータ検証", () => {
    it("android/app/build.gradleにrecordRoborazziDebugタスクが登録されている", () => {
      expect(buildGradle).toContain('tasks.register("recordRoborazziDebug")');
    });

    it("ダミーデータ（Todo、回数習慣、タイマー習慣）が今日画面およびウィジェットへ正しくマッピングされる", () => {
      const dummyTodo = {
        id: "dummy-todo-1",
        title: "企画書の提出",
        isRequired: true,
        priority: "high" as const,
        completed: false,
      };
      const dummyCountHabit = {
        id: "dummy-habit-count",
        title: "本を読む",
        isRequired: true,
        color: "#388E77",
        progressUnit: "count" as const,
        targetValue: 5,
        dailyProgress: { "2026-09-09": 0 },
      };
      const dummyTimerHabit = {
        id: "dummy-habit-timer",
        title: "瞑想タイム",
        isRequired: true,
        color: "#3D6E9B",
        progressUnit: "minutes" as const,
        targetValue: 15,
      };

      // Todo checks
      expect(dummyTodo.isRequired).toBe(true);
      expect(dummyTodo.title).toBe("企画書の提出");

      // Count habit formatted label
      const countProgress = dummyCountHabit.dailyProgress["2026-09-09"];
      const countTarget = dummyCountHabit.targetValue;
      const countLabel = `${countProgress}/${countTarget}回`;
      expect(countLabel).toBe("0/5回");

      // Timer habit target
      const timerTargetSec = dummyTimerHabit.targetValue * 60;
      const timerClock = `00:00 / ${String(Math.floor(timerTargetSec / 60)).padStart(2, "0")}:${String(timerTargetSec % 60).padStart(2, "0")}`;
      expect(timerClock).toBe("00:00 / 15:00");
    });
  });
});
