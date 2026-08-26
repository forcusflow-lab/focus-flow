import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..");
const source = (...segments: string[]) => readFileSync(resolve(root, ...segments), "utf8");

describe("v11 Widget単一リストカードの実機原因回帰契約", () => {
  it("Providerは受信した現在サイズを失わず、MAXサイズだけでバケットを決めない", () => {
    const provider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    expect(provider).toContain("id: Int, options: android.os.Bundle");
    expect(provider).toContain("updatedOptions ?: manager.getAppWidgetOptions(id)");
    expect(provider).toContain("OPTION_APPWIDGET_MIN_HEIGHT");
    expect(provider).toContain("width < 190 || height < 155");
    expect(provider).toContain("height < 270");
  });

  it("レイアウトは余白のある一枚のcard、最大3行、左の丸形完了操作で構成する", () => {
    const layout = source("plugins", "native", "android", "res", "layout", "focus_flow_widget_initial.xml");
    expect(layout).toContain('android:padding="10dp"');
    expect(layout).toContain('android:layout_height="match_parent" android:background="@drawable/focus_flow_widget_card_light_100"');
    expect(layout).toContain('android:layout_width="24dp" android:layout_height="24dp"');
    expect(layout).toContain("focus_flow_widget_static_row_one");
    expect(layout).toContain("focus_flow_widget_static_row_two");
    expect(layout).toContain("focus_flow_widget_static_row_three");
    expect(layout).not.toContain("static_row_four");
    expect(layout).not.toMatch(/<View[\s>]/);
    expect(layout).not.toContain("layout_weight");
    expect(layout).not.toContain('="0dp"');
  });
});
