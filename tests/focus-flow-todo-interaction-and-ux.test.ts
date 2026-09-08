import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { R, stringResource } from "../lib/focus-flow/strings";

const readProjectFile = (...segments: string[]) => fs.readFileSync(path.join(process.cwd(), ...segments), "utf8");

describe("Todoカードのインタラクション刷新とサブタスク展開制御", () => {
  it("サブタスク保持タスクはタップでアコーディオン開閉し、長押しまたは詳細ボタンで詳細画面へ遷移する", () => {
    const cards = readProjectFile("components", "focus-flow", "item-cards.tsx");

    // アコーディオン開閉ロジック
    expect(cards).toContain("hasSubtasks ? toggleSubtasks : onOpen");
    expect(cards).toContain("onLongPress={onOpen}");
    expect(cards).toContain("delayLongPress={350}");
    expect(cards).toContain("toggleSubtasks");
    expect(cards).toContain("LayoutAnimation.configureNext");
    expect(cards).toContain("Animated.timing(chevronAnim");
    expect(cards).toContain('outputRange: ["0deg", "180deg"]');

    // 展開時の詳細ボタン
    expect(cards).toContain("subtaskDetailButton");
    expect(cards).toContain("subtaskControls");
  });

  it("チェックボックスは最小48x48dpの専用領域を確保し、タップ時に画面遷移を起こさない", () => {
    const cards = readProjectFile("components", "focus-flow", "item-cards.tsx");

    expect(cards).toContain("todoCheckTouchTarget: { width: 48, height: 48");
    expect(cards).toContain("event.stopPropagation(); onToggle();");
    expect(cards).toContain("hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}");
  });

  it("サブタスクのチェックボックス操作時にも触覚フィードバックを付与する", () => {
    const cards = readProjectFile("components", "focus-flow", "item-cards.tsx");

    expect(cards).toContain('safeHaptic("light"); onToggleSubtask(subtask.id);');
  });

  it("習慣カードの連続日数はflexShrink: 0を適用し、文字サイズ拡大時にも末尾文字切れを防ぐ", () => {
    const cards = readProjectFile("components", "focus-flow", "item-cards.tsx");

    expect(cards).toContain("styles.metaText, { color: palette.muted, flexShrink: 0 }");
  });
});

describe("UXライティング刷新とstrings.xml集約", () => {
  it("strings.xmlにアプリ全体の統一文言が集約定義されている", () => {
    const stringsXml = readProjectFile("plugins", "native", "android", "res", "values", "strings.xml");

    expect(stringsXml).toContain('<string name="today_banner_locked">制限中（残り %1$d 件）</string>');
    expect(stringsXml).toContain('<string name="today_banner_unlocked">すべての制限を解除中</string>');
    expect(stringsXml).toContain('<string name="today_banner_subtext">今日の必須タスクを完了すると制限が解除されます</string>');
    expect(stringsXml).toContain('<string name="today_progress_heading">本日の進捗（残り %1$d 件 / 完了 %2$d/%3$d 件）</string>');
    expect(stringsXml).toContain('<string name="today_tasks_heading">今日のタスク</string>');
    expect(stringsXml).toContain('<string name="settings_switch_limit_tasks">タスク完了までアプリを制限</string>');
    expect(stringsXml).toContain('<string name="settings_strict_mode_description">制限中の設定変更やアプリ削除を防止し、うっかり解除を防ぎます。</string>');
  });

  it("stringResource関数が位置指定プレースホルダーと多言語展開を正常に行う", () => {
    // 日本語展開
    expect(stringResource(R.string.today_banner_locked, "ja", 3)).toBe("制限中（残り 3 件）");
    expect(stringResource(R.string.today_banner_unlocked, "ja")).toBe("すべての制限を解除中");
    expect(stringResource(R.string.today_progress_heading, "ja", 2, 1, 3)).toBe("本日の進捗（残り 2 件 / 完了 1/3 件）");
    expect(stringResource(R.string.settings_switch_limit_tasks, "ja")).toBe("タスク完了までアプリを制限");

    // 英語展開
    expect(stringResource(R.string.today_banner_locked, "en", 3)).toBe("App limits active (3 remaining)");
    expect(stringResource(R.string.today_banner_unlocked, "en")).toBe("All app limits unlocked");
  });

  it("画面コンポーネントが新しいUXライティングを採用している", () => {
    const today = readProjectFile("app", "(tabs)", "index.tsx");
    const habits = readProjectFile("app", "(tabs)", "habits.tsx");
    const settings = readProjectFile("app", "(tabs)", "settings.tsx");

    // 今日画面
    expect(today).toContain("today_banner_locked");
    expect(today).toContain("today_banner_unlocked");
    expect(today).toContain("today_banner_subtext");
    expect(today).toContain("today_progress_heading");
    expect(today).toContain('title: t("今日のタスク", "Today’s tasks")');

    // 習慣画面: 仕様文言が削除されている
    expect(habits).not.toContain("回数・時間・継続記録は習慣だけで管理します");

    // 設定画面
    expect(settings).toContain('title={t("タスク完了までアプリを制限", "Limit apps until tasks are done")}');
    expect(settings).toContain("制限中の設定変更やアプリ削除を防止");
    expect(settings).toContain("1. 権限許可 → 2. アプリ選択 → 3. 時間帯設定");
  });

  it("Todo解除判定ロジック（案2）: 通常Todoは期限超過でもゲート解除ブロッカーにならない", async () => {
    const { isTodoEffectiveRequired, isTodoRequiredForGate } = await import("../lib/focus-flow/utils");
    const testDate = new Date(2026, 7, 27, 12, 0, 0); // 2026-08-27

    // 通常タスク（isRequired: false）
    const normalOverdue = { id: "t-1", title: "通常期限切れ", isRequired: false, dueDate: "2026-08-20", completed: false, createdAt: "2026-08-15T00:00:00.000Z", priority: "medium" as const };
    const normalDueToday = { id: "t-2", title: "通常今日まで", isRequired: false, dueDate: "2026-08-27", completed: false, createdAt: "2026-08-27T00:00:00.000Z", priority: "medium" as const };
    expect(isTodoEffectiveRequired(normalOverdue, testDate)).toBe(false);
    expect(isTodoEffectiveRequired(normalDueToday, testDate)).toBe(false);
    expect(isTodoRequiredForGate(normalOverdue, true, testDate)).toBe(false);
    expect(isTodoRequiredForGate(normalDueToday, true, testDate)).toBe(false);

    // 必須タスク（isRequired: true）
    const requiredOverdue = { id: "t-3", title: "必須期限切れ", isRequired: true, dueDate: "2026-08-20", completed: false, createdAt: "2026-08-15T00:00:00.000Z", priority: "high" as const };
    const requiredDueToday = { id: "t-4", title: "必須今日まで", isRequired: true, dueDate: "2026-08-27", completed: false, createdAt: "2026-08-27T00:00:00.000Z", priority: "high" as const };
    const requiredFuture = { id: "t-5", title: "必須明日以降", isRequired: true, dueDate: "2026-08-30", completed: false, createdAt: "2026-08-27T00:00:00.000Z", priority: "high" as const };
    const requiredNoDueToday = { id: "t-6", title: "必須期限なし今日作成", isRequired: true, completed: false, createdAt: "2026-08-27T08:00:00.000Z", priority: "medium" as const };
    const requiredNoDuePast = { id: "t-7", title: "必須期限なし過去作成", isRequired: true, completed: false, createdAt: "2026-08-25T08:00:00.000Z", priority: "medium" as const };

    expect(isTodoEffectiveRequired(requiredOverdue, testDate)).toBe(true);
    expect(isTodoEffectiveRequired(requiredDueToday, testDate)).toBe(true);
    expect(isTodoEffectiveRequired(requiredFuture, testDate)).toBe(false);
    expect(isTodoEffectiveRequired(requiredNoDueToday, testDate)).toBe(true);
    expect(isTodoEffectiveRequired(requiredNoDuePast, testDate)).toBe(false);

    expect(isTodoRequiredForGate(requiredOverdue, true, testDate)).toBe(true);
    expect(isTodoRequiredForGate(requiredDueToday, true, testDate)).toBe(true);
    expect(isTodoRequiredForGate(requiredFuture, true, testDate)).toBe(false);
  });

  it("習慣の曜日スケジュール判定: 非対象曜日の習慣はゲート解除判定から除外される", async () => {
    const { isHabitScheduledOn, isHabitRequiredForGate } = await import("../lib/focus-flow/utils");
    // 2026-08-27 は 木曜日（getDay() === 4）
    const thursday = new Date(2026, 7, 27, 12, 0, 0);
    // 2026-08-29 は 土曜日（getDay() === 6）
    const saturday = new Date(2026, 7, 29, 12, 0, 0);

    const weekdayHabit = { id: "h-wd", title: "平日読書", color: "#123456", goalPerWeek: 5, targetDays: [1, 2, 3, 4, 5], isRequired: true, completedDates: [], createdAt: "2026-08-01T00:00:00.000Z" };
    const weekendHabit = { id: "h-we", title: "週末運動", color: "#654321", goalPerWeek: 2, targetDays: [6, 0], isRequired: true, completedDates: [], createdAt: "2026-08-01T00:00:00.000Z" };

    // 木曜日の判定
    expect(isHabitScheduledOn(weekdayHabit, thursday)).toBe(true);
    expect(isHabitScheduledOn(weekendHabit, thursday)).toBe(false);
    expect(isHabitRequiredForGate(weekdayHabit, undefined, thursday)).toBe(true);
    expect(isHabitRequiredForGate(weekendHabit, undefined, thursday)).toBe(false);

    // 土曜日の判定
    expect(isHabitScheduledOn(weekdayHabit, saturday)).toBe(false);
    expect(isHabitScheduledOn(weekendHabit, saturday)).toBe(true);
    expect(isHabitRequiredForGate(weekdayHabit, undefined, saturday)).toBe(false);
    expect(isHabitRequiredForGate(weekendHabit, undefined, saturday)).toBe(true);
  });

  it("習慣入力フォームとタスク入力フォームが刷新されたUI契約を満たす", () => {
    const habitForm = readProjectFile("components", "focus-flow", "habit-form.tsx");
    const taskForm = readProjectFile("components", "focus-flow", "task-form.tsx");

    // 習慣フォーム: 曜日トグルとプリセットチップ
    expect(habitForm).toContain("targetDays");
    expect(habitForm).toContain("selectPreset");
    expect(habitForm).toContain("toggleDay");
    expect(habitForm).toContain("dayCircle");
    expect(habitForm).toContain("EVERYDAY");
    expect(habitForm).toContain("WEEKDAYS_ONLY");
    expect(habitForm).toContain("WEEKEND_ONLY");

    // 習慣フォーム: 分目標クイックチップ
    expect(habitForm).toContain("MINUTE_PRESETS");
    expect(habitForm).toContain("customMinutesMode");
    expect(habitForm).toContain("minuteChip");

    // 習慣フォーム: カラー詳細設定アコーディオン
    expect(habitForm).toContain("colorSectionOpen");
    expect(habitForm).toContain("colorDisclosure");

    // CTAボタンと制限文言の統一（「作る」の廃止と「アプリの制限」）
    expect(habitForm).toContain('t("習慣を作成", "Create habit")');
    expect(habitForm).toContain('t("アプリの制限", "App limits")');
    expect(habitForm).not.toContain("習慣を作る");

    expect(taskForm).toContain('t("Todoを作成", "Create task")');
    expect(taskForm).toContain('t("アプリの制限", "App limits")');
  });
});
