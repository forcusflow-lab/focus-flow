import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const source = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("v21 制限一覧・遮断画面・起動体験", () => {
  it("制限対象アプリを72dpの情報階層付き行で表示し、選択操作を維持する", () => {
    const settings = source("app", "(tabs)", "settings.tsx");
    expect(settings).toContain("const AppSelectionRow = memo(function AppSelectionRow");
    expect(settings).toContain('accessibilityRole="checkbox"');
    expect(settings).toContain("appTile: { width: 36, height: 36");
    expect(settings).toContain("row: { height: 72");
    expect(settings).toContain("numberOfLines={1}>{app.label}");
    expect(settings).toContain("numberOfLines={1}>{app.packageName}");
    expect(settings).toContain("<FlatList");
    expect(settings).toContain("initialNumToRender={12}");
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
