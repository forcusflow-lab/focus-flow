import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("Focus Flow統合ウィジェットの設定", () => {
  it("完了表示の選択をローカル設定からAndroidのウィジェット状態へ同期する", () => {
    const types = fs.readFileSync(path.join(process.cwd(), "lib", "focus-flow", "types.ts"), "utf8");
    const bridge = fs.readFileSync(path.join(process.cwd(), "lib", "focus-flow", "android-gate.ts"), "utf8");
    const settings = fs.readFileSync(path.join(process.cwd(), "app", "(tabs)", "settings.tsx"), "utf8");

    expect(types).toContain('export type WidgetCompletedDisplay = "hide" | "dim"');
    expect(types).toContain('widgetCompletedDisplay: "dim"');
    expect(bridge).toContain('const widgetCompletedDisplay = data.displaySettings.widgetCompletedDisplay ?? "dim"');
    expect(bridge).toContain('completed: true');
    expect(settings).toContain("onCompletedDisplay");
    expect(settings).toContain("残して線を引く");
    expect(settings).toContain("表示しない");
  });
});
