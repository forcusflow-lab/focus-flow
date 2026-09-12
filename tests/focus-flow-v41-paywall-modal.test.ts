import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const root = path.resolve(__dirname, "..");
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf-8");

describe("v41 - Phase 2 Pro Dedicated Paywall System", () => {
  it("PaywallModal exists and implements rich UI components", () => {
    const src = read("components/focus-flow/paywall-modal.tsx");
    // Hero Area
    expect(src).toContain("workspace-premium");
    expect(src).toContain("heroCrownContainer");
    expect(src).toContain("heroCircleA");

    // Pro Feature List
    expect(src).toContain("wallpaper");
    expect(src).toContain("tune");
    expect(src).toContain("all-inclusive");
    expect(src).toContain("lock-clock");

    // Plan selector
    expect(src).toContain("annual");
    expect(src).toContain("monthly");
    expect(src).toContain("bestValueBadge");

    // Purchase & Restore
    expect(src).toContain("purchasePlus");
    expect(src).toContain("restorePlus");

    // Legal / Disclaimers
    expect(src).toContain("/terms");
    expect(src).toContain("/privacy");
    expect(src).toContain("close");
  });

  it("FocusFlowProvider provides global paywall state and controls", () => {
    const src = read("lib/focus-flow/provider.tsx");
    expect(src).toContain("paywallVisible");
    expect(src).toContain("openPaywall");
    expect(src).toContain("closePaywall");
    expect(src).toContain("isPlus");
  });

  it("App shell root layout renders global PaywallModal", () => {
    const src = read("app/_layout.tsx");
    expect(src).toContain("PaywallModal");
    expect(src).toContain("<PaywallModal");
  });

  it("Settings screen wires Pro Paywall to widget opacity, custom backgrounds, and plus panel", () => {
    const src = read("app/(tabs)/settings.tsx");
    expect(src).toContain("PaywallModal");
    expect(src).toContain("onOpenPaywall");
    expect(src).toContain("OpacitySlider");
    expect(src).toContain("👑 Pro");
    expect(src).toContain("onOpenPlus");
  });

  it("I18n string resources define Phase 2 Paywall translations", () => {
    const tsSrc = read("lib/focus-flow/strings.ts");
    expect(tsSrc).toContain("paywall_hero_title");
    expect(tsSrc).toContain("paywall_feature_bg_title");
    expect(tsSrc).toContain("paywall_feature_widget_title");
    expect(tsSrc).toContain("paywall_feature_unlimited_title");
    expect(tsSrc).toContain("paywall_feature_limits_title");
    expect(tsSrc).toContain("paywall_plan_annual_badge");
    expect(tsSrc).toContain("paywall_cta_trial");
    expect(tsSrc).toContain("paywall_cta_start");

    const xmlSrc = read("plugins/native/android/res/values/strings.xml");
    expect(xmlSrc).toContain('name="paywall_hero_title"');
    expect(xmlSrc).toContain('name="paywall_plan_annual_badge"');
    expect(xmlSrc).toContain('name="paywall_restore"');
  });
});
