import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("Focus Flow アクセシビリティサービス耐障害性・例外安全・省電力除外", () => {
  it("FocusGateServiceは全ライフサイクル・イベント処理をThrowable例外安全にし、ノード参照を安全に解放する", () => {
    const service = source("plugins", "native", "android", "kotlin", "FocusGateService.kt");

    // 全体的なThrowableガード
    expect(service).toContain("catch (_: Throwable)");
    expect(service).toContain("super.onServiceConnected()");
    expect(service).toContain("override fun onInterrupt()");

    // activeRoot / sourceNode / root の安全解放
    expect(service).toContain("activeRoot.recycle()");
    expect(service).toContain("sourceNode.recycle()");
    expect(service).toContain("root.recycle()");
  });

  it("FocusGateModuleおよびwith-focus-flow-androidはREQUEST_IGNORE_BATTERY_OPTIMIZATIONSを要求・処理する", () => {
    const module = source("plugins", "native", "android", "kotlin", "FocusGateModule.kt");
    const plugin = source("plugins", "with-focus-flow-android.js");
    const bridge = source("lib", "focus-flow", "android-gate.ts");

    expect(plugin).toContain("android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS");
    expect(module).toContain("requestIgnoreBatteryOptimizations");
    expect(module).toContain("ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS");
    expect(bridge).toContain("requestIgnoreBatteryOptimizations");
  });

  it("設定画面はバッテリー最適化無効化の要求導線と状態表示を備える", () => {
    const settings = source("app", "(tabs)", "settings.tsx");

    expect(settings).toContain("requestIgnoreBatteryOptimizations");
    expect(settings).toContain("confirmBatteryOptimization");
    expect(settings).toContain("バッテリー最適化を無効化");
    expect(settings).toContain("onRequestBatteryOptimization");
  });
});
