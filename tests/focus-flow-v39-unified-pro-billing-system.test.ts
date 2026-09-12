import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("Focus Flow v39 統一Pro課金アーキテクチャ & 標準Paywall体験", () => {
  it("設定画面のフォント選択に 👑 Pro バッジがあり、未課金時のPaywallガードとPlus誘導を持つ", () => {
    const settings = source("app", "(tabs)", "settings.tsx");

    // FontChoice の Pro 判定とバッジ表示
    expect(settings).toContain('const isPro = item.id !== "system"');
    expect(settings).toContain("👑 Pro");
    expect(settings).toContain("fontChoiceLabelRow");

    // 未課金ユーザーがタップした際のPaywallアラートと「Plusを確認」アクション
    expect(settings).toContain('item.id !== "system" && !isPlus');
    expect(settings).toContain("onOpenPlus?.()");
    expect(settings).toContain('t("Plus限定の機能です", "Plus Feature")');
  });

  it("制限アプリの選択上限時に「Plusを確認」アクション付きのアラートを表示する", () => {
    const settings = source("app", "(tabs)", "settings.tsx");

    expect(settings).toContain("!canSelectBlockedApp(packageName)");
    expect(settings).toContain('setPanel("plus")');
    expect(settings).toContain('t("Plusを確認", "View Plus")');
  });

  it("Todo、習慣、メモの作成上限時に「Plusを確認」から設定のPlus画面へ直接遷移できる", () => {
    const todos = source("app", "(tabs)", "todos.tsx");
    const habits = source("app", "(tabs)", "habits.tsx");
    const notes = source("app", "(tabs)", "notes.tsx");

    expect(todos).toContain('pathname: "/(tabs)/settings", params: { panel: "plus" }');
    expect(todos).toContain('t("Plusを確認", "View Plus")');

    expect(habits).toContain('pathname: "/(tabs)/settings", params: { panel: "plus" }');
    expect(habits).toContain('t("Plusを確認", "View Plus")');

    expect(notes).toContain('pathname: "/(tabs)/settings", params: { panel: "plus" }');
    expect(notes).toContain('t("Plusを確認", "View Plus")');
  });

  it("設定画面が URL パラメータ panel=plus に連動して直接Plusパネルを開く", () => {
    const settings = source("app", "(tabs)", "settings.tsx");

    expect(settings).toContain("useLocalSearchParams<{ panel?: SettingsPanel }>()");
    expect(settings).toContain('params.panel && ["limits", "appearance", "reminders", "plus", "home"].includes(params.panel)');
    expect(settings).toContain("setPanel(params.panel)");
  });

  it("PlusPanel のプラン比較表が無料とPlusの全特典を明確に対比し、テーマセットに 👑 Pro が付与されている", () => {
    const settings = source("app", "(tabs)", "settings.tsx");

    // 無料プランの項目
    expect(settings).toContain('t("Todo・習慣・メモ 各2件", "2 tasks, habits & notes")');
    expect(settings).toContain('t("制限アプリ 5件", "5 limited apps")');
    expect(settings).toContain('t("標準フォントのみ", "Standard font only")');
    expect(settings).toContain('t("無地背景のみ", "Solid background only")');
    expect(settings).toContain('t("基本カラーテーマ", "Basic color themes")');

    // Plusプランの項目
    expect(settings).toContain('t("すべて無制限", "Unlimited items")');
    expect(settings).toContain('t("制限アプリ 無制限", "Unlimited limited apps")');
    expect(settings).toContain('t("厳選フォント（3種）", "3 premium fonts")');
    expect(settings).toContain('t("カスタム背景（3種）", "3 custom backgrounds")');
    expect(settings).toContain('t("テーマセットの保存", "Saved theme sets")');

    // テーマセットセクションの 👑 Pro 表記と早期完了の明記
    expect(settings).toContain('t("テーマセット（👑 Pro）", "Theme sets (👑 Pro)")');
    expect(settings).toContain("earlyNoticeText");
  });

  it("多言語リソース（strings.xml, strings.ts）にフォントProおよびPaywall関連文字列が集約されている", () => {
    const stringsXml = source("plugins", "native", "android", "res", "values", "strings.xml");
    const stringsTs = source("lib", "focus-flow", "strings.ts");

    expect(stringsXml).toContain('name="plus_feature_font_title"');
    expect(stringsXml).toContain('name="plus_feature_font_message"');
    expect(stringsXml).toContain('name="free_limit_todo_message"');
    expect(stringsXml).toContain('name="free_limit_habit_message"');
    expect(stringsXml).toContain('name="free_limit_app_message"');

    expect(stringsTs).toContain("plus_feature_font_title:");
    expect(stringsTs).toContain("plus_feature_font_message:");
    expect(stringsTs).toContain("free_limit_todo_message:");
    expect(stringsTs).toContain("free_limit_habit_message:");
    expect(stringsTs).toContain("free_limit_app_message:");
  });
});
