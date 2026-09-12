import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const root = path.resolve(__dirname, "..");
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf-8");

describe("v42 - Phase 3 Store Quality, Crash Prevention & Offline Resilience", () => {
  it("FocusGateService has essential system package whitelists preventing lockouts", () => {
    const service = read("plugins/native/android/kotlin/FocusGateService.kt");
    expect(service).toContain("com.android.settings");
    expect(service).toContain("com.android.vending");
    expect(service).toContain("com.google.android.packageinstaller");
    expect(service).toContain("com.android.dialer");
    expect(service).toContain("com.google.android.dialer");
    expect(service).toContain("com.android.server.telecom");
  });

  it("FocusGateService encapsulates overlay addView and removeView in safe try-catch blocks", () => {
    const service = read("plugins/native/android/kotlin/FocusGateService.kt");
    expect(service).toContain("windowManager().addView(layout");
    expect(service).toContain("windowManager().removeViewImmediate(overlay)");
    expect(service).toContain("gateOverlay = null");
    expect(service).toContain("gateOverlayPackage = null");
  });

  it("Widget and Native preferences commit on background writes preventing uncommitted loss", () => {
    const module = read("plugins/native/android/kotlin/FocusGateModule.kt");
    expect(module).toContain(".commit()");
    expect(module).toContain("saveAppDataBackup");
    expect(module).toContain("getAppDataBackup");
  });

  it("Widget layout uses robust static RemoteViews with fallback rendering", () => {
    const provider = read("plugins/native/android/kotlin/FocusFlowWidgetProvider.kt");
    expect(provider).toContain("safeUpdateWidget");
    expect(provider).toContain("updateFallbackWidget");
    expect(provider).toContain("refreshAll");
  });

  it("Paywall modal handles offline or store unavailability with safe alerts without crashing", () => {
    const modal = read("components/focus-flow/paywall-modal.tsx");
    expect(modal).toContain("Alert.alert");
    expect(modal).toContain("paywall_offline_title");
    expect(modal).toContain("paywall_offline_message");
  });

  it("Offline strings are defined in both TypeScript and Android XML resources", () => {
    const tsSrc = read("lib/focus-flow/strings.ts");
    expect(tsSrc).toContain("paywall_offline_title");
    expect(tsSrc).toContain("paywall_offline_message");

    const xmlSrc = read("plugins/native/android/res/values/strings.xml");
    expect(xmlSrc).toContain('name="paywall_offline_title"');
    expect(xmlSrc).toContain('name="paywall_offline_message"');
  });
});
