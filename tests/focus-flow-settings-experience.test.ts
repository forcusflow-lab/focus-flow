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

    expect(source).toContain('type SettingsPanel = "home" | "limits" | "appearance" | "reminders" | "widgets" | "plus"');
    expect(source).toContain('setPanel("home")');
    expect(source).toContain("homeScrollRef.current?.scrollTo({ y: 0, animated: false })");
    expect(source).not.toContain("function DiagnosticRow");
  });

  it("初回端末案内をToday画面や管理画面から自動・手動で再表示しない", () => {
    const today = readProjectFile("app", "(tabs)", "index.tsx");
    const manage = readProjectFile("app", "(tabs)", "more.tsx");

    expect(today).not.toContain("DeviceSetupTutorial");
    expect(today).not.toContain("deviceSetupOpen");
    expect(manage).not.toContain('route: "setup"');
  });
});
