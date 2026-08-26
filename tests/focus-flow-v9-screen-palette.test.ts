import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const read = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("Focus Flow v9 全画面palette契約", () => {
  it("振り返り・その他・メモはカードと入力面を動的paletteへ渡す", () => {
    const insights = read("app", "(tabs)", "insights.tsx");
    const more = read("app", "(tabs)", "more.tsx");
    const notes = read("app", "(tabs)", "notes.tsx");

    [insights, more, notes].forEach((source) => expect(source).toContain("useFocusPalette"));
    expect(insights).toContain("backgroundColor: palette.surface, borderColor: palette.border");
    expect(insights).toContain("backgroundColor: palette.primarySoft, borderColor: palette.border");
    expect(more).toContain("backgroundColor: palette.surface, borderColor: palette.border");
    expect(notes).toContain("backgroundColor: palette.surface, borderColor: palette.border");
    expect(notes).toContain("backgroundColor: palette.background");
    expect(notes).toContain("placeholderTextColor={palette.muted}");
  });

  it("設定ホーム・集中制限・開示モーダルの主要surfaceはpaletteで解決する", () => {
    const settings = read("app", "(tabs)", "settings.tsx");

    expect(settings).toContain("function SettingsEntry");
    expect(settings).toContain("backgroundColor: palette.surface, borderColor: palette.border");
    expect(settings).toContain("function InfoCard");
    expect(settings).toContain("backgroundColor: palette.primarySoft, borderColor: palette.border");
    expect(settings).toContain("function SettingRow");
    expect(settings).toContain("borderBottomColor: palette.border");
    expect(settings).toContain("function LimitsPanel");
    expect(settings).toContain("const palette = useFocusPalette();");
    expect(settings).toContain("style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}");
    expect(settings).toContain("style={[styles.modalCard, { backgroundColor: palette.surface, borderColor: palette.border }]}");
  });
});
