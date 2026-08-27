import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..");
const source = (...segments: string[]) => readFileSync(resolve(root, ...segments), "utf8");

describe("v13 Widget単一リストカードの実機原因回帰契約", () => {
  it("Android 12以降はランチャーごとのexact-size提供に依存せず、responsive mapを維持する", () => {
    const provider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    expect(provider).toContain("id: Int, options: android.os.Bundle");
    expect(provider).toContain("responsiveWidgetViews");
    expect(provider).toContain("SizeF(130f, 155f)");
    expect(provider).toContain("SizeF(130f, 250f)");
    expect(provider).toContain("rememberWidgetBucket");
    expect(provider).toContain("WIDGET_SIZE_PREFIX");
    expect(provider).toContain("RemoteViews(mappings)");
    expect(provider).toContain("OPTION_APPWIDGET_MIN_HEIGHT");
    expect(provider).toContain("width < 190f || height < 150f");
    expect(provider).toContain("height < 250f");
  });

  it("レイアウトは外側を透明に保ち、ホスト高へ追従する個別mini-cardを最大3行まで描画する", () => {
    const layout = source("plugins", "native", "android", "res", "layout", "focus_flow_widget_initial.xml");
    expect(layout).toContain('android:id="@+id/focus_flow_widget_card" android:layout_width="match_parent" android:layout_height="match_parent"');
    expect(layout).toContain('android:layout_height="40dp"');
    expect(layout).toContain('android:layout_height="51dp"');
    expect(layout).toContain('android:id="@+id/focus_flow_widget_top_spacer" android:layout_width="match_parent" android:layout_height="4dp"');
    expect(layout).toContain('android:layout_width="22dp" android:layout_height="22dp"');
    expect(layout).toContain('android:minWidth="42dp"');
    expect(layout).toContain("focus_flow_widget_static_row_one");
    expect(layout).toContain("focus_flow_widget_static_row_two");
    expect(layout).toContain("focus_flow_widget_static_row_three");
    expect(layout).toContain("focus_flow_widget_static_row_one_timer");
    expect(layout).toContain('android:layout_width="68dp"');
    expect(layout).toContain('android:layout_height="1dp"');
    expect(layout).toContain('<Chronometer');
    expect(layout).toContain('@drawable/focus_flow_widget_surface_mist_light');
    expect(layout).not.toContain("static_row_four");
    expect(layout).not.toMatch(/<View[\s>]/);
    expect(layout).not.toContain("layout_weight");
    expect(layout).not.toContain('="0dp"');
  });
});
