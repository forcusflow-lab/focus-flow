import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { R, stringResource } from "../lib/focus-flow/strings";

describe("Focus Flow v28: Today screen unified dashboard, dynamic date header, and resource consolidation", () => {
  const indexPath = path.join(process.cwd(), "app", "(tabs)", "index.tsx");
  const source = fs.readFileSync(indexPath, "utf8");
  const pluginStringsXml = fs.readFileSync(
    path.join(process.cwd(), "plugins", "native", "android", "res", "values", "strings.xml"),
    "utf8"
  );
  const androidStringsXml = fs.readFileSync(
    path.join(process.cwd(), "android", "app", "src", "main", "res", "values", "strings.xml"),
    "utf8"
  );

  it("abolishes redundant 今日/今日の予定 and establishes dynamic date header", () => {
    // Large date heading replaces dual 今日 / 今日の予定
    expect(source).toContain("dateHeaderLabel");
    expect(source).toContain("styles.dateHeading");
    expect(source).not.toContain('styles.greeting');
    expect(source).not.toContain('styles.date,');

    // Dynamic date format resolution
    expect(source).toContain("today_date_format");
  });

  it("integrates gate status and progress into a single unified dashboard card with 進捗 label", () => {
    // Single container card
    expect(source).toContain("styles.dashboardCard");
    expect(source).toContain("styles.gateRow");
    expect(source).toContain("styles.progressSection");
    expect(source).toContain("styles.breakdownRow");

    // Top: Gate status with navigation to settings
    expect(source).toContain('router.push("/(tabs)/settings"');
    expect(source).toContain("gateStatusLabel");
    expect(source).toContain("chevron-right");

    // Middle: Progress with 進捗 label (today_progress_label), count, and bar
    expect(source).toContain("today_progress_label");
    expect(source).toContain("doneRequired");
    expect(source).toContain("totalRequired");
    expect(source).toContain("progressBarTrack");
    expect(source).toContain("progressBarFill");

    // Bottom: Breakdown row with Todo and Habits
    expect(source).toContain("breakdownRow");
    expect(source).toContain("breakdownItem");
    expect(source).toContain('name="check-box"');
    expect(source).toContain('name="repeat"');
  });

  it("maintains 今日のタスク list heading with flat text without bulky container or redundant hints", () => {
    expect(source).toContain("styles.sectionHeaderFlat");
    expect(source).toContain("styles.sectionTitleFlat");
    expect(source).toContain('t("今日のタスク", "Today’s tasks")');
    expect(source).not.toContain("styles.sectionHint");
  });

  it("consolidates today_date_format and today_progress_label in strings.xml and strings.ts", () => {
    // strings.xml validation
    expect(pluginStringsXml).toContain('<string name="today_date_format">%1$d月%2$d日 (%3$s)</string>');
    expect(pluginStringsXml).toContain('<string name="today_progress_label">進捗</string>');
    expect(androidStringsXml).toContain('<string name="today_date_format">%1$d月%2$d日 (%3$s)</string>');
    expect(androidStringsXml).toContain('<string name="today_progress_label">進捗</string>');

    // stringResource translation
    expect(stringResource(R.string.today_progress_label, "ja")).toBe("進捗");
    expect(stringResource(R.string.today_progress_label, "en")).toBe("Progress");
    expect(stringResource(R.string.today_date_format, "ja", 9, 9, "水")).toBe("9月9日 (水)");
    expect(stringResource(R.string.today_date_format, "en", "Sep", 9, "Wed")).toBe("Wed, Sep 9");
  });
});
