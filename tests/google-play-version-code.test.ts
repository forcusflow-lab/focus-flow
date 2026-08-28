import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("Google Play向けAndroidバージョンコード", () => {
  it("既存コードを再利用せず、v27の通常版35と本人用25を設定する", () => {
    const configPath = path.join(process.cwd(), "app.config.ts");
    const configSource = fs.readFileSync(configPath, "utf8");

    expect(configSource).toContain("versionCode: isPersonalUnlimitedBuild ? 25 : 35");
  });
});
