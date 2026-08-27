import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const source = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("v21 制限一覧・遮断画面・起動体験", () => {
  it("制限対象アプリを48dpのチェック領域、64dpの揃った二行で表示する", () => {
    const settings = source("app", "(tabs)", "settings.tsx");
    expect(settings).toContain("function AppSelectionRow");
    expect(settings).toContain('accessibilityRole="checkbox"');
    expect(settings).toContain("checkHitbox: { width: 48, minHeight: 64");
    expect(settings).toContain("row: { minHeight: 64");
    expect(settings).toContain("numberOfLines={1}>{app.label}");
    expect(settings).toContain("numberOfLines={1}>{app.packageName}");
    expect(settings).toContain("<AppSelectionRow key={app.packageName}");
  });

  it("遮断オーバーレイとフォールバック画面に同期済みテーマとToday導線を適用する", () => {
    const service = source("plugins", "native", "android", "kotlin", "FocusGateService.kt");
    const activity = source("plugins", "native", "android", "kotlin", "FocusGateActivity.kt");
    expect(service).toContain("GatePalette.from(json.optJSONObject(\"widgetPalette\"))");
    expect(service).toContain("roundedBackground(palette.elevated, 28)");
    expect(service).toContain('"今日の項目を確認する"');
    expect(service).toContain("focusFlowTodayIntent");
    expect(activity).toContain("gatePalette()");
    expect(activity).toContain("GateActivityPalette");
    expect(activity).toContain('"今日の項目を確認する"');
    expect(activity).toContain("$DEEP_LINK_SCHEME:///");
  });

  it("起動時は小さいOS Splashからテーマ連動のフルスクリーン導入へ短く遷移する", () => {
    const layout = source("app", "_layout.tsx");
    const config = source("app.config.ts");
    expect(layout).toContain("FocusFlowLaunchShell");
    expect(layout).toContain("Animated.timing(opacity");
    expect(layout).toContain("haloOne");
    expect(layout).toContain("haloTwo");
    expect(config).toContain("imageWidth: 72");
    expect(config).toContain('backgroundColor: "#0F2623"');
  });
});
