import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const projectFile = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("Focus Flowの起動体験", () => {
  it("ネイティブ起動は控えめなブランド表示と短いフェードで、余分な待機を入れない", () => {
    const layout = projectFile("app", "_layout.tsx");
    const config = projectFile("app.config.ts");

    expect(layout).toContain('SplashScreen.setOptions({ duration: 280, fade: true })');
    expect(layout).not.toContain("preventAutoHideAsync");
    expect(config).toContain("imageWidth: 96");
    expect(config).toContain('backgroundColor: "#F2F7F4"');
    expect(config).toContain('backgroundColor: "#14231E"');
  });
});
