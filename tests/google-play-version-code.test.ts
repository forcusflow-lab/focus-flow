import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("Google Play向けAndroidバージョンコード", () => {
  it("既に生成済みのコード9を再利用せず、次回AABにコード10を設定する", () => {
    const configPath = path.join(process.cwd(), "app.config.ts");
    const configSource = fs.readFileSync(configPath, "utf8");

    expect(configSource).toContain("versionCode: 10");
  });
});
