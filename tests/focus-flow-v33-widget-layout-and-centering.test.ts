import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("Focus Flow v33 ホーム画面ウィジェット レイアウト再調整（余白解消・文字切れ防止・上下センタリング）", () => {
  const pluginLayout = source("plugins", "native", "android", "res", "layout", "focus_flow_widget_initial.xml");
  const nativeLayout = source("android", "app", "src", "main", "res", "layout", "focus_flow_widget_initial.xml");
  const pluginProvider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
  const nativeProvider = source("android", "app", "src", "main", "java", "com", "app", "focusflow", "focusflow", "FocusFlowWidgetProvider.kt");

  describe("1. ヘッダー文字切れの解消（paddingEnd最適化 & 横幅確保）", () => {
    it("XMLのヘッダーテキスト領域にidが付与され、デフォルトpaddingEndが48dpに最適化されている", () => {
      for (const layout of [pluginLayout, nativeLayout]) {
        expect(layout).toContain('android:id="@+id/focus_flow_widget_header_text"');
        expect(layout).toContain('android:paddingEnd="48dp"');
        expect(layout).not.toContain('android:paddingEnd="160dp"');
      }
    });

    it("Providerが動的パディング制御を行い、完了トグル非表示時は48dp、表示時のみ120dpを確保する", () => {
      for (const provider of [pluginProvider, nativeProvider]) {
        expect(provider).toContain('views.setViewPadding(R.id.focus_flow_widget_header_text, (14f * density).toInt(), 0, (120f * density).toInt(), 0)');
        expect(provider).toContain('views.setViewPadding(R.id.focus_flow_widget_header_text, (14f * density).toInt(), 0, (48f * density).toInt(), 0)');
      }
    });
  });

  describe("2. 回数カウンター（およびタイマーボタン）の上下センタリング", () => {
    it("全行のcontrolsコンテナがcenter_vertical|endで垂直中央配置され、marginBottomが撤去されている", () => {
      for (const layout of [pluginLayout, nativeLayout]) {
        for (const row of ["one", "two", "three", "four", "five"]) {
          expect(layout).toContain(`focus_flow_widget_static_row_${row}_controls" android:layout_width="82dp" android:layout_height="22dp" android:layout_gravity="center_vertical|end" android:layout_marginEnd="6dp"`);
          expect(layout).not.toContain(`focus_flow_widget_static_row_${row}_controls" android:layout_width="82dp" android:layout_height="22dp" android:layout_gravity="bottom|end"`);
          expect(layout).not.toContain(`focus_flow_widget_static_row_${row}_controls" android:layout_width="82dp" android:layout_height="22dp" android:layout_gravity="center_vertical|end" android:layout_marginBottom="3dp"`);
        }
      }
    });
  });

  describe("3. 下部の過剰な空白の解消 ＆ 表示件数最適化", () => {
    it("WidgetBucketに4行バケットが追加され、1/2/3/4/5行の全階層が定義されている", () => {
      for (const provider of [pluginProvider, nativeProvider]) {
        expect(provider).toContain("WidgetBucket(1, false, true)");
        expect(provider).toContain("WidgetBucket(2, true, false)");
        expect(provider).toContain("WidgetBucket(3, true, false)");
        expect(provider).toContain("WidgetBucket(4, true, false)");
        expect(provider).toContain("WidgetBucket(5, true, false)");
      }
    });

    it("高さ閾値が最適化され、247dp以上で4行、296dp以上で5行が割り当てられる", () => {
      for (const provider of [pluginProvider, nativeProvider]) {
        expect(provider).toContain("height < 149f -> WidgetBucket(1, false, true)");
        expect(provider).toContain("height < 198f -> WidgetBucket(2, true, false)");
        expect(provider).toContain("height < 247f -> WidgetBucket(3, true, false)");
        expect(provider).toContain("height < 296f -> WidgetBucket(4, true, false)");
        expect(provider).toContain("else -> WidgetBucket(5, true, false)");
      }
    });
  });

  describe("4. プラグインとAndroidネイティブ実装の完全同期", () => {
    const normalize = (content: string) => content.replace(/\r\n/g, "\n").trim();

    it("layout XMLがpluginsとandroid/appで完全一致する", () => {
      expect(normalize(pluginLayout)).toEqual(normalize(nativeLayout));
    });

    it("ProviderのKotlinコードがpluginsとandroid/appで完全一致する", () => {
      expect(normalize(pluginProvider)).toEqual(normalize(nativeProvider));
    });
  });
});
