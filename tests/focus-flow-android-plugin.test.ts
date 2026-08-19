import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const widgetTemplate = path.join(
  process.cwd(),
  "plugins",
  "native",
  "android",
  "kotlin",
  "FocusFlowWidgetProvider.kt",
);

const gateServiceTemplate = path.join(
  process.cwd(),
  "plugins",
  "native",
  "android",
  "kotlin",
  "FocusGateService.kt",
);

const accessibilityServiceXml = path.join(
  process.cwd(),
  "plugins",
  "native",
  "android",
  "res",
  "xml",
  "focus_flow_accessibility_service.xml",
);

describe("Focus Flow Androidネイティブプラグイン", () => {
  it("ウィジェットが親アプリの生成Rクラスを明示的に読み込む", () => {
    const source = fs.readFileSync(widgetTemplate, "utf8");

    expect(source).toContain("import $PACKAGE_NAME.R");
    expect(source).toContain("abstract class FocusFlowBaseWidgetProvider");
    expect(source).not.toContain("internal abstract class FocusFlowBaseWidgetProvider");
  });

  it("集中制限サービスが前面化とウィンドウ切替の両方を監視し、短い重複抑制だけで選択アプリを遮断する", () => {
    const service = fs.readFileSync(gateServiceTemplate, "utf8");
    const xml = fs.readFileSync(accessibilityServiceXml, "utf8");

    expect(xml).toContain('android:accessibilityEventTypes="typeWindowStateChanged|typeWindowsChanged"');
    expect(service).toContain("AccessibilityEvent.TYPE_WINDOWS_CHANGED");
    expect(service).toContain("now - lastBlockedAt < 250");
    expect(service).not.toContain("now - lastBlockedAt < 900");
  });
});
