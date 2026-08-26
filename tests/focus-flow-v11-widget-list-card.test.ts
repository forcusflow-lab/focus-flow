import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..");
const source = (...segments: string[]) => readFileSync(resolve(root, ...segments), "utf8");

describe("v12 Widget単一リストカードの実機原因回帰契約", () => {
  it("Android 12以降はランチャー提供の実サイズごとにRemoteViewsを対応付ける", () => {
    const provider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    expect(provider).toContain("id: Int, options: android.os.Bundle");
    expect(provider).toContain("updatedOptions ?: manager.getAppWidgetOptions(id)");
    expect(provider).toContain("OPTION_APPWIDGET_SIZES");
    expect(provider).toContain("getParcelableArrayList<SizeF>");
    expect(provider).toContain("RemoteViews(mappings)");
    expect(provider).toContain("OPTION_APPWIDGET_MIN_HEIGHT");
    expect(provider).toContain("width < 190f || height < 150f");
    expect(provider).toContain("height < 250f");
  });

  it("レイアウトは外側を透明に保ち、内容高の一枚カードを最大3行まで描画する", () => {
    const layout = source("plugins", "native", "android", "res", "layout", "focus_flow_widget_initial.xml");
    expect(layout).toContain('android:padding="6dp"');
    expect(layout).toContain('android:layout_height="wrap_content" android:layout_gravity="top" android:background="@drawable/focus_flow_widget_card_light_100"');
    expect(layout).toContain('android:layout_height="38dp"');
    expect(layout).toContain('android:layout_height="44dp"');
    expect(layout).toContain('android:layout_width="22dp" android:layout_height="22dp"');
    expect(layout).toContain('android:minWidth="42dp"');
    expect(layout).toContain("focus_flow_widget_static_row_one");
    expect(layout).toContain("focus_flow_widget_static_row_two");
    expect(layout).toContain("focus_flow_widget_static_row_three");
    expect(layout).not.toContain("static_row_four");
    expect(layout).not.toMatch(/<View[\s>]/);
    expect(layout).not.toContain("layout_weight");
    expect(layout).not.toContain('="0dp"');
  });
});
