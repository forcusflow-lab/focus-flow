import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("Google Play向けEASビルド設定", () => {
  it("Publishが使うproduction-apkプロファイルでAABを出力する", () => {
    const configPath = path.join(process.cwd(), "eas.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as {
      build?: { [profile: string]: { android?: { buildType?: string } } };
    };

    expect(config.build?.["production-apk"]?.android?.buildType).toBe("app-bundle");
  });
});
