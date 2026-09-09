import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Focus Flow v28: Today screen unified dashboard and flat section headers", () => {
  const indexPath = path.join(process.cwd(), "app", "(tabs)", "index.tsx");
  const source = fs.readFileSync(indexPath, "utf8");

  it("integrates gate status and progress into a single unified dashboard card", () => {
    // Single container card
    expect(source).toContain("styles.dashboardCard");
    expect(source).toContain("styles.gateRow");
    expect(source).toContain("styles.progressSection");
    expect(source).toContain("styles.breakdownRow");

    // Top: Gate status with navigation to settings
    expect(source).toContain('router.push("/(tabs)/settings"');
    expect(source).toContain("gateStatusLabel");
    expect(source).toContain("chevron-right");

    // Middle: Progress with title, count, and bar
    expect(source).toContain('t("本日のタスク", "Today’s tasks")');
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

  it("simplifies section headers to flat text without bulky container or redundant hints", () => {
    expect(source).toContain("styles.sectionHeaderFlat");
    expect(source).toContain("styles.sectionTitleFlat");
    // No sectionHint or sectionHeader card styling in flat header
    expect(source).not.toContain("styles.sectionHint");
  });
});
