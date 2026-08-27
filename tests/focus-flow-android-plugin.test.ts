import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const projectFile = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("Focus Flow Androidネイティブプラグイン", () => {
  it("WidgetをRemoteViewsServiceなしのサイズ追従する静的面で更新し、Todo・習慣を安全に操作する", () => {
    const provider = projectFile("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    const moduleSource = projectFile("plugins", "native", "android", "kotlin", "FocusGateModule.kt");

    expect(provider).toContain("class FocusFlowWidgetProvider : AppWidgetProvider()");
    expect(provider).toContain("bindStaticRows");
    expect(provider).toContain("StaticRowIds");
    expect(provider).toContain("uniqueStaticItems");
    expect(provider).toContain("matches.size != 1");
    expect(provider).toContain("compactBadge");
    expect(provider).toContain("widgetCardDrawable");
    expect(provider).toContain("focus_flow_widget_card_light_100");
    expect(provider).toContain("focus_flow_widget_card_dark_100");
    expect(provider).toContain("focus_flow_widget_static_divider");
    expect(provider).toContain("focus_flow_widget_static_row_one");
    expect(provider).toContain("focus_flow_widget_static_row_two");
    expect(provider).toContain("focus_flow_widget_static_row_three");
    expect(provider).not.toContain("focus_flow_widget_static_row_four");
    expect(provider).toContain("ACTION_COMPLETE");
    expect(provider).toContain("ACTION_RESTORE");
    expect(provider).toContain("detailIntent");
    expect(provider).toContain("actionIntent");
    expect(provider).toContain("WIDGET_ACTIONS");
    expect(provider).toContain("forEach { id -> provider.safeUpdateWidget(context, manager, id) }");
    expect(provider).toContain('Uri.parse("$DEEP_LINK_SCHEME:///")');
    expect(provider).toContain('paletteColor(palette, "text"');
    expect(provider).toContain('paletteColor(palette, "muted"');
    expect(provider).toContain("ACTION_INCREMENT");
    expect(provider).toContain("ACTION_TIMER_START");
    expect(provider).not.toContain("setRemoteAdapter");
    expect(provider).not.toContain("setPendingIntentTemplate");
    expect(provider).not.toContain("FocusFlowWidgetItemsService");
    expect(provider).not.toContain("notifyAppWidgetViewDataChanged");
    expect(provider).not.toContain("setFloat(");
    expect(moduleSource).toContain("consumeWidgetActions");
    expect(moduleSource).toContain("WIDGET_ACTIONS");
  });

  it("クリーン生成で段階別カード背景を含む静的Widget資産だけを登録し、RemoteViewsServiceをManifestへ戻さない", () => {
    const plugin = projectFile("plugins", "with-focus-flow-android.js");

    expect(plugin).toContain("focus_flow_widget_initial.xml");
    expect(plugin).toContain("focus_flow_widget_initial_info.xml");
    expect(plugin).toContain("const cardDrawables");
    ["light_0", "light_25", "light_50", "light_75", "light_100", "dark_0", "dark_25", "dark_50", "dark_75", "dark_100"].forEach((name) => expect(plugin).toContain(name));
    expect(plugin).toContain("FocusFlowWidgetProvider");
    expect(plugin).toContain('application.service = (application.service || []).filter');
    expect(plugin).not.toContain('"FocusFlowWidgetItemsService.kt"');
    expect(plugin).not.toContain('"android.permission.BIND_REMOTEVIEWS"');
    expect(plugin).not.toContain('"focus_flow_widget.xml"');
    expect(plugin).not.toContain('"focus_flow_widget_item.xml"');
  });

  it("静的Widget初期面は許容RemoteViewsと直接カード背景だけを使い、生View・weight・0dp高さを含まない", () => {
    const initialLayout = projectFile("plugins", "native", "android", "res", "layout", "focus_flow_widget_initial.xml");
    const initialMetadata = projectFile("plugins", "native", "android", "res", "xml", "focus_flow_widget_initial_info.xml");

    expect(initialMetadata).toContain('@layout/focus_flow_widget_initial');
    expect(initialMetadata).toContain('android:widgetCategory="home_screen"');
    expect(initialLayout).toContain("<FrameLayout");
    expect(initialLayout).toContain("<LinearLayout");
    expect(initialLayout).toContain("<TextView");
    expect(initialLayout).toContain("<ImageView");
    expect(initialLayout).toContain('android:id="@+id/focus_flow_widget_root"');
    expect(initialLayout).toContain('android:id="@+id/focus_flow_widget_card"');
    expect(initialLayout).toContain('android:background="@drawable/focus_flow_widget_card_light_100"');
    expect(initialLayout).toContain('android:id="@+id/focus_flow_widget_static_divider_one"');
    expect(initialLayout).toContain('android:id="@+id/focus_flow_widget_static_row_one"');
    expect(initialLayout).toContain('android:id="@+id/focus_flow_widget_static_row_two"');
    expect(initialLayout).toContain('android:id="@+id/focus_flow_widget_static_row_three"');
    expect(initialLayout).not.toContain('android:id="@+id/focus_flow_widget_static_row_four"');
    expect(initialLayout).toContain('android:id="@+id/focus_flow_widget_static_row_one_check"');
    expect(initialLayout).toContain('android:layout_height="50dp"');
    expect(initialLayout).toContain('android:layout_width="46dp"');
    expect(initialLayout).toContain('android:layout_width="22dp"');
    expect(initialLayout).not.toContain("<View");
    expect(initialLayout).not.toContain("ListView");
    expect(initialLayout).not.toContain("android:layout_weight");
    expect(initialLayout).not.toContain('android:layout_height="0dp"');
  });

  it("テンプレートと生成済みサービスが同じ継続前面監視・遮断オーバーレイ・実行診断を持つ", () => {
    const gateServiceTemplate = projectFile("plugins", "native", "android", "kotlin", "FocusGateService.kt");
    const accessibilityTemplate = projectFile("plugins", "native", "android", "res", "xml", "focus_flow_accessibility_service.xml");

    [accessibilityTemplate].forEach((xml) => {
      expect(xml).toContain('android:accessibilityEventTypes="typeWindowStateChanged|typeWindowsChanged|typeViewFocused|typeWindowContentChanged"');
      expect(xml).toContain('android:accessibilityFlags="flagRetrieveInteractiveWindows"');
    });
    [gateServiceTemplate].forEach((service) => {
      expect(service).toContain("AccessibilityEvent.TYPE_WINDOWS_CHANGED");
      expect(service).toContain("scheduleForegroundRechecks()");
      expect(service).toContain("WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY");
      expect(service).toContain("showGateOverlay(candidatePackage, matchingRule, state)");
      expect(service).toContain("hideGateOverlay()");
    });
  });
});
