import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const projectFile = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("Focus Flowの起動体験", () => {
  it("ネイティブ起動から全画面ブランド導入へ自然につなぎ、状態復元後に短くフェードする", () => {
    const layout = projectFile("app", "_layout.tsx");
    const config = projectFile("app.config.ts");

    expect(layout).toContain('SplashScreen.setOptions({ duration: 280, fade: true })');
    expect(layout).toContain("SplashScreen.preventAutoHideAsync");
    expect(layout).toContain("SplashScreen.hideAsync");
    expect(layout).toContain("FocusFlowLaunchShell");
    expect(layout).toContain("今日を、ひとつずつ。");
    expect(layout).toContain("duration: 300");
    expect(config).toContain("imageWidth: 118");
    expect(config).toContain('backgroundColor: "#163E35"');
  });
});
