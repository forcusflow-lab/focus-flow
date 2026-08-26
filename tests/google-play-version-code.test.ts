import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("Google Play向けAndroidバージョンコード", () => {
  it("既に内部テストへ配布済みのコード15を再利用せず、今回の通常版16と本人用6を設定する", () => {
    const configPath = path.join(process.cwd(), "app.config.ts");
    const configSource = fs.readFileSync(configPath, "utf8");

    expect(configSource).toContain("versionCode: isPersonalUnlimitedBuild ? 6 : 16");
  });
});
