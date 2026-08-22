import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const projectFile = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("本人専用の制限なしAPK", () => {
  it("通常のPlay版と別パッケージ・別Deep Linkで、本人専用ビルドだけにPlus権限を与える", () => {
    const config = projectFile("app.config.ts");
    const provider = projectFile("lib", "focus-flow", "provider.tsx");
    const plugin = projectFile("plugins", "with-focus-flow-android.js");

    expect(config).toContain('process.env.FOCUS_FLOW_PERSONAL_UNLIMITED === "1"');
    expect(config).toContain('"com.app.focusflow.personal"');
    expect(config).toContain('"manusfocusflowpersonal"');
    expect(config).toContain("personalUnlimitedBuild: isPersonalUnlimitedBuild");
    expect(provider).toContain("const PERSONAL_UNLIMITED_BUILD");
    expect(provider).toContain("const isPlus = PERSONAL_UNLIMITED_BUILD ||");
    expect(provider).toContain("if (PERSONAL_UNLIMITED_BUILD) { applyPlusStatus(PERSONAL_PLUS_STATUS)");
    expect(plugin).toContain('replaceAll("$DEEP_LINK_SCHEME", deepLinkScheme)');
  });

  it("手動実行だけの署名済みAPKを成果物として出力し、通常のPlay AABは作らない", () => {
    const workflow = projectFile(".github", "workflows", "personal-unlimited-apk.yml");

    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain('FOCUS_FLOW_PERSONAL_UNLIMITED: "1"');
    expect(workflow).toContain(":app:assembleRelease");
    expect(workflow).toContain("focus-flow-personal-unlimited-apk");
    expect(workflow).toContain("app-release.apk");
    expect(workflow).not.toContain(":app:bundleRelease");
  });
});
