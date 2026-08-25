import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readProjectFile = (...segments: string[]) => fs.readFileSync(path.join(process.cwd(), ...segments), "utf8");

describe("Focus Flow設定画面の実機UX回帰", () => {
  it("フォント比較はすべて同じ見本文を使う", () => {
    const source = readProjectFile("lib", "focus-flow", "app-fonts.ts");

    expect(source).toContain('const FONT_PREVIEW = { ja: "今日の必須項目", en: "Today’s must-dos" }');
    expect(source.match(/sample: FONT_PREVIEW/g)).toHaveLength(4);
  });

  it("設定は目的別パネルと先頭復帰を備え、端末診断を重複表示しない", () => {
    const source = readProjectFile("app", "(tabs)", "settings.tsx");

    expect(source).toContain('type SettingsPanel = "home" | "limits" | "appearance" | "reminders" | "plus"');
    expect(source).toContain('setPanel("home")');
    expect(source).toContain("homeScrollRef.current?.scrollTo({ y: 0, animated: false })");
    expect(source).toContain("Home screen widget");
    expect(source).toContain("widgetOpacity");
    expect(source).toContain("Follow app theme");
    expect(source).toContain("Used by both the app and home-screen widget.");
    expect(source).toContain("Theme preview");
    expect(source).not.toContain("Tune color, type, and completed items");
    expect(source).not.toContain("function DiagnosticRow");
  });

  it("設定ホームは集中・表示・データ・サポートを目的別に分け、時間帯を一貫した用語で示す", () => {
    const source = readProjectFile("app", "(tabs)", "settings.tsx");

    expect(source).toContain('title={t("集中を整える", "Focus")}');
    expect(source).toContain('title={t("見やすさと通知", "Display & reminders")}');
    expect(source).toContain('title={t("アカウントとデータ", "Plan & data")}');
    expect(source).toContain('title={t("データとプライバシー", "Data & privacy")}');
    expect(source).toContain('title={t("ヘルプとサポート", "Help & support")}');
    expect(source).toContain('label: t(`時間帯 ${gateConfig.schedules.length + 1}`, `Time window ${gateConfig.schedules.length + 1}`)');
    expect(source).toContain('title={t("3. 実行時間帯", "3. Time windows")}');
    expect(source).toContain('accessibilityRole="button" accessibilityLabel={`${title}: ${detail}`}');
    expect(source).toContain('title={t("設定は3つの順番で進めます", "Set up in three steps")}');
    expect(source).toContain('title={t("1. Androidの許可と動作確認", "1. Android permission & status")}');
    expect(source).toContain('title={t("2. 制限するアプリ", "2. Apps to limit")}');
    expect(source).toContain('title={t("3. 実行時間帯", "3. Time windows")}');
  });

  it("初回端末案内をToday画面や管理画面から自動・手動で再表示しない", () => {
    const today = readProjectFile("app", "(tabs)", "index.tsx");
    const manage = readProjectFile("app", "(tabs)", "more.tsx");

    expect(today).not.toContain("DeviceSetupTutorial");
    expect(today).not.toContain("deviceSetupOpen");
    expect(manage).not.toContain('route: "setup"');
  });

  it("タブ外の利用条件・サブスクリプション画面も同じFocus Flowプロバイダー配下で開く", () => {
    const rootLayout = readProjectFile("app", "_layout.tsx");
    const tabsLayout = readProjectFile("app", "(tabs)", "_layout.tsx");

    expect(rootLayout).toContain("<FocusFlowProvider>");
    expect(rootLayout).toContain('<Stack.Screen name="legal" />');
    expect(tabsLayout).not.toContain("<FocusFlowProvider>");
  });
});
