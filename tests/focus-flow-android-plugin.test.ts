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
  it("統合ウィジェットが親アプリの生成Rクラスを明示的に読み込み、Todo・習慣の完了操作を扱う", () => {
    const source = fs.readFileSync(widgetTemplate, "utf8");

    expect(source).toContain("import $PACKAGE_NAME.R");
    expect(source).toContain("class FocusFlowWidgetProvider : AppWidgetProvider()");
    expect(source).toContain("widgetItems");
    expect(source).toContain("focus_flow_widget_item_4");
    expect(source).toContain("widgetTransparency");
    expect(source).toContain("ACTION_COMPLETE");
  });

  it("テンプレートと生成済みサービスが同じ継続前面監視・遮断オーバーレイ・実行診断を持つ", () => {
    const services = [gateServiceTemplate, generatedGateService].map((file) => fs.readFileSync(file, "utf8"));
    const xmlFiles = [accessibilityServiceXml, generatedAccessibilityServiceXml].map((file) => fs.readFileSync(file, "utf8"));

    xmlFiles.forEach((xml) => {
      expect(xml).toContain('android:accessibilityEventTypes="typeWindowStateChanged|typeWindowsChanged|typeViewFocused|typeWindowContentChanged"');
      expect(xml).toContain('android:accessibilityFlags="flagRetrieveInteractiveWindows"');
    });
    services.forEach((service) => {
      expect(service).toContain("AccessibilityEvent.TYPE_WINDOWS_CHANGED");
      expect(service).toContain("AccessibilityEvent.TYPE_VIEW_FOCUSED");
      expect(service).toContain("AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED");
      expect(service).toContain("android.accessibilityservice.AccessibilityServiceInfo");
      expect(service).toContain("activeWindowPackage()");
      expect(service).toContain("scheduleForegroundRechecks()");
      expect(service).toContain("foregroundRecheckDelays");
      expect(service).toContain("WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY");
      expect(service).toContain("WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE");
      expect(service).toContain("showGateOverlay(candidatePackage, matchingRule, state)");
      expect(service).toContain("hideGateOverlay()");
      expect(service).toContain("state.strictMode");
      expect(service).toContain("json.optBoolean(\"strictMode\")");
      expect(service).toContain("if (matchingRule == null)");
      expect(service).toContain("GATE_LAST_EVENT_AT");
      expect(service).not.toContain("FocusGateActivity::class.java");
    });
    const module = fs.readFileSync(generatedGateModule, "utf8");
    expect(module).toContain("configuredBlockedPackageCount");
    expect(module).toContain("JSONObject(saved)");
  });
});
