import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const androidPlugin = path.join(process.cwd(), "plugins", "with-focus-flow-android.js");
const androidWorkflow = path.join(process.cwd(), ".github", "workflows", "android-build.yml");

describe("GitHub Actions Android AABビルド", () => {
  it("prebuild後のreleaseビルドにCI環境変数から署名を注入する", () => {
    const source = fs.readFileSync(androidPlugin, "utf8");

    expect(source).toContain("withAppBuildGradle");
    expect(source).toContain("FOCUS_FLOW_UPLOAD_STORE_FILE");
    expect(source).toContain("FOCUS_FLOW_UPLOAD_STORE_PASSWORD");
    expect(source).toContain("signingConfigs.release");
    expect(source).toContain("project.hasProperty(\"FOCUS_FLOW_UPLOAD_STORE_FILE\")");
    expect(source).toContain("/(\\n\\s*release\\s*\\{[\\s\\S]*?\\n\\s*)signingConfig = signingConfigs\\.debug/");
  });

  it("秘密情報をGitHub Secretsから復元し、署名済みAABだけを成果物にする", () => {
    const source = fs.readFileSync(androidWorkflow, "utf8");

    expect(source).toContain("workflow_dispatch:");
    expect(source).toContain("CI=1 pnpm exec expo prebuild --platform android --clean");
    expect(source).toContain("secrets.ANDROID_KEYSTORE_BASE64");
    expect(source).toContain("secrets.ANDROID_KEYSTORE_PASSWORD");
    expect(source).toContain("secrets.ANDROID_KEY_ALIAS");
    expect(source).toContain("secrets.ANDROID_KEY_PASSWORD");
    expect(source).toContain("-PFOCUS_FLOW_UPLOAD_STORE_FILE=\"$FOCUS_FLOW_UPLOAD_STORE_FILE\"");
    expect(source).toContain("Verify Google Play upload certificate");
    expect(source).toContain("EXPECTED_UPLOAD_CERT_SHA1");
    expect(source).toContain("android/app/build/outputs/bundle/release/app-release.aab");
    expect(source).not.toContain("git add android/app/focus-flow-upload.jks");
  });
});
