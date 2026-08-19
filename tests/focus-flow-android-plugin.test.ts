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

const generatedGateService = path.join(process.cwd(), "android", "app", "src", "main", "java", "com", "app", "focusflow", "focusflow", "FocusGateService.kt");
const generatedGateModule = path.join(process.cwd(), "android", "app", "src", "main", "java", "com", "app", "focusflow", "focusflow", "FocusGateModule.kt");
const generatedAccessibilityServiceXml = path.join(process.cwd(), "android", "app", "src", "main", "res", "xml", "focus_flow_accessibility_service.xml");

describe("Focus Flow Androidネイティブプラグイン", () => {
  it("ウィジェットが親アプリの生成Rクラスを明示的に読み込む", () => {
    const source = fs.readFileSync(widgetTemplate, "utf8");

    expect(source).toContain("import $PACKAGE_NAME.R");
    expect(source).toContain("abstract class FocusFlowBaseWidgetProvider");
    expect(source).not.toContain("internal abstract class FocusFlowBaseWidgetProvider");
  });

  it("テンプレートと生成済みサービスが同じ前面化検出・短い重複抑制・実行診断を持つ", () => {
    const services = [gateServiceTemplate, generatedGateService].map((file) => fs.readFileSync(file, "utf8"));
    const xmlFiles = [accessibilityServiceXml, generatedAccessibilityServiceXml].map((file) => fs.readFileSync(file, "utf8"));

    xmlFiles.forEach((xml) => {
      expect(xml).toContain('android:accessibilityEventTypes="typeWindowStateChanged|typeWindowsChanged"');
      expect(xml).toContain('android:accessibilityFlags="flagRetrieveInteractiveWindows"');
    });
    services.forEach((service) => {
      expect(service).toContain("AccessibilityEvent.TYPE_WINDOWS_CHANGED");
      expect(service).toContain("android.accessibilityservice.AccessibilityServiceInfo");
      expect(service).toContain("now - lastBlockedAt < 250");
      expect(service).toContain("GATE_LAST_EVENT_AT");
      expect(service).not.toContain("now - lastBlockedAt < 900");
    });
    const module = fs.readFileSync(generatedGateModule, "utf8");
    expect(module).toContain("configuredBlockedPackageCount");
    expect(module).toContain("JSONObject(saved)");
  });
});
