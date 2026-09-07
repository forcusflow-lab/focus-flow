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
});
