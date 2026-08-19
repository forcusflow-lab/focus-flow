import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const widgetTemplate = path.join(
  process.cwd(),
  "plugins",
  "native",
  "android",
  "kotlin",
  "FocusFlowWidgetProvider.kt",
);

describe("Focus Flow Androidネイティブプラグイン", () => {
  it("ウィジェットが親アプリの生成Rクラスを明示的に読み込む", () => {
    const source = fs.readFileSync(widgetTemplate, "utf8");

    expect(source).toContain("import $PACKAGE_NAME.R");
    expect(source).toContain("abstract class FocusFlowBaseWidgetProvider");
    expect(source).not.toContain("internal abstract class FocusFlowBaseWidgetProvider");
  });
});
