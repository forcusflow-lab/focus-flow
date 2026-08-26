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

const widgetItemsTemplate = path.join(
  process.cwd(),
  "plugins",
  "native",
  "android",
  "kotlin",
  "FocusFlowWidgetItemsService.kt",
);

const gateModuleTemplate = path.join(
  process.cwd(),
  "plugins",
  "native",
  "android",
  "kotlin",
  "FocusGateModule.kt",
);

const gateServiceTemplate = path.join(
  process.cwd(),
  "plugins",
  "native",
  "android",
  "kotlin",
  "FocusGateService.kt",
);

const gateActivityTemplate = path.join(
  process.cwd(),
  "plugins",
  "native",
  "android",
  "kotlin",
  "FocusGateActivity.kt",
);

const accessibilityServiceXml = path.join(
  process.cwd(),
  "plugins",
  "native",
  "android",
  "res",
  "xml",
  "focus_flow_accessibility_service.xml",
);

const generatedGateService = path.join(process.cwd(), "android", "app", "src", "main", "java", "com", "app", "focusflow", "focusflow", "FocusGateService.kt");
const generatedGateModule = path.join(process.cwd(), "android", "app", "src", "main", "java", "com", "app", "focusflow", "focusflow", "FocusGateModule.kt");
const generatedAccessibilityServiceXml = path.join(process.cwd(), "android", "app", "src", "main", "res", "xml", "focus_flow_accessibility_service.xml");
const androidPlugin = path.join(process.cwd(), "plugins", "with-focus-flow-android.js");
const widgetShellLayout = path.join(process.cwd(), "plugins", "native", "android", "res", "layout", "focus_flow_widget.xml");
const widgetItemLayout = path.join(process.cwd(), "plugins", "native", "android", "res", "layout", "focus_flow_widget_item.xml");
const widgetInfoXml = path.join(process.cwd(), "plugins", "native", "android", "res", "xml", "focus_flow_widget_info.xml");
const widgetInitialLayout = path.join(process.cwd(), "plugins", "native", "android", "res", "layout", "focus_flow_widget_initial.xml");
const widgetInitialInfoXml = path.join(process.cwd(), "plugins", "native", "android", "res", "xml", "focus_flow_widget_initial_info.xml");

describe("Focus Flow Androidネイティブプラグイン", () => {
  it("統合ウィジェットがスクロール可能なコレクション、独立透過、Todo・習慣の操作を扱う", () => {
    const source = fs.readFileSync(widgetTemplate, "utf8");
    const itemsSource = fs.readFileSync(widgetItemsTemplate, "utf8");
    const moduleSource = fs.readFileSync(gateModuleTemplate, "utf8");

    expect(source).toContain("import $PACKAGE_NAME.R");
    expect(source).toContain("class FocusFlowWidgetProvider : AppWidgetProvider()");
    expect(source).toContain("setRemoteAdapter");
    expect(source).toContain("focus_flow_widget_list");
    expect(source).toContain("widgetOpacity");
    expect(source).toContain("WIDGET_ACTIONS");
    expect(source).toContain("ACTION_COMPLETE");
    expect(source).toContain("ACTION_RESTORE");
    expect(source).toContain("ACTION_OPEN_ITEM");
    expect(source).not.toContain("ACTION_UNDO");
    expect(source).not.toContain("WIDGET_UNDO");
    expect(source).toContain("setPendingIntentTemplate");
    expect(source).toContain("PendingIntent.FLAG_MUTABLE");
    expect(source).toContain("widgetPalette");
    expect(source).toContain("forEach { id -> provider.safeUpdateWidget(context, manager, id) }");
    expect(source).toContain("override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) { ids.forEach { updateInitialWidget(context, manager, it) } }");
    expect(source).toContain("private fun updateFallbackWidget");
    expect(source).toContain("private fun updateInitialWidget");
    expect(source).toContain("R.layout.focus_flow_widget_initial");
    expect(source).toContain('Color.parseColor("#13251F")');
    expect(source).toContain('Color.parseColor("#F4FBF7")');
    expect(source).toContain("deepLink(context, if (kind == \"habit\") \"habits\" else \"todos\", targetId)");
    expect(source).toContain("todayIntent");
    expect(source).toContain('Uri.parse("$DEEP_LINK_SCHEME:///")');
    expect(source).toContain('"todos" -> appendPath("todos")');
    expect(source).toContain('"habits" -> appendPath("habits")');
    expect(source).not.toContain('Uri.parse("$DEEP_LINK_SCHEME://$path")');
    expect(itemsSource).toContain("RemoteViewsService.RemoteViewsFactory");
    expect(itemsSource).toContain("focus_flow_widget_checkbox");
    expect(itemsSource).toContain("StrikethroughSpan");
    expect(itemsSource).toContain('"MUST" else "必須"');
    expect(itemsSource).toContain("focus_flow_widget_item_content");
    expect(itemsSource).toContain("action = FocusFlowWidgetProvider.ACTION_OPEN_ITEM");
    expect(itemsSource).toContain("focus_flow_widget_item_action");
    expect(itemsSource).toContain("action = FocusFlowWidgetProvider.ACTION_COMPLETE");
    expect(itemsSource).toContain("action = FocusFlowWidgetProvider.ACTION_RESTORE");
    expect(itemsSource).toContain("View.GONE");
    expect(itemsSource).toContain("paletteColor(palette, \"primary\"");
    expect(itemsSource).toContain('Color.parseColor("#13251F")');
    expect(itemsSource).toContain('Color.parseColor("#F4FBF7")');
    expect(itemsSource).toContain("setImageViewResource");
    expect(itemsSource).toContain("focus_flow_widget_check_mark");
    expect(itemsSource).toContain("setTextViewTextSize(R.id.focus_flow_widget_item_badge");
    expect(moduleSource).toContain("consumeWidgetActions");
    expect(moduleSource).toContain("WIDGET_ACTIONS");
  });

  it("クリーン生成時にも統合ウィジェットの必須・通常・完了カードDrawableをコピーする", () => {
    const source = fs.readFileSync(androidPlugin, "utf8");

    expect(source).toContain("focus_flow_widget_item_background.xml");
    expect(source).toContain("focus_flow_widget_item_required.xml");
    expect(source).toContain("focus_flow_widget_item_done.xml");
    expect(source).toContain("focus_flow_widget_item.xml");
    expect(source).toContain("focus_flow_widget_initial.xml");
    expect(source).toContain("focus_flow_widget_initial_info.xml");
    expect(source).toContain("focus_flow_widget_checkbox.xml");
    expect(source).toContain("focus_flow_widget_check_mark.xml");
    expect(source).toContain("FocusFlowWidgetItemsService.kt");
    expect(source).toContain("android.permission.BIND_REMOTEVIEWS");
  });

  it("Widgetは高密度48dp行と48dpのチェック領域を維持し、本文・補足・小さいセルで重ならない", () => {
    const shell = fs.readFileSync(widgetShellLayout, "utf8");
    const item = fs.readFileSync(widgetItemLayout, "utf8");
    const metadata = fs.readFileSync(widgetInfoXml, "utf8");

    expect(item).toContain('android:layout_height="48dp"');
    expect(item).toContain('android:minHeight="48dp"');
    expect(item).toContain('android:layout_width="48dp"');
    expect(item).toContain('android:layout_width="0dp"');
    expect(item).toContain('android:gravity="center_vertical"');
    expect(item).toContain('android:maxLines="1"');
    expect(item).toContain('android:layout_gravity="bottom"');
    expect(shell).toContain('android:id="@+id/focus_flow_widget_header"');
    expect(shell).toContain('android:layout_height="36dp"');
    expect(shell).toContain('android:dividerHeight="0dp"');
    expect(shell).not.toContain("android:layout_weight");
    expect(shell).not.toContain('android:layout_height="0dp"');
    expect(metadata).toContain('android:minHeight="132dp"');
    expect(metadata).toContain('android:targetCellHeight="2"');
  });

  it("Widget追加時はCollection Serviceに依存しない最小初期面を使い、Provider失敗時もTodayへ戻れる", () => {
    const initialLayout = fs.readFileSync(widgetInitialLayout, "utf8");
    const initialMetadata = fs.readFileSync(widgetInitialInfoXml, "utf8");

    expect(initialMetadata).toContain('@layout/focus_flow_widget_initial');
    expect(initialMetadata).toContain('android:widgetCategory="home_screen"');
    expect(initialLayout).toContain('android:id="@+id/focus_flow_widget_root"');
    expect(initialLayout).toContain('android:id="@+id/focus_flow_widget_title"');
    expect(initialLayout).toContain('android:id="@+id/focus_flow_widget_status"');
    expect(initialLayout).toContain('android:id="@+id/focus_flow_widget_empty"');
    expect(initialLayout).not.toContain("ListView");
    expect(initialLayout).not.toContain("android:layout_weight");
    expect(initialLayout).not.toContain('android:layout_height="0dp"');
  });

  it("テンプレートと生成済みサービスが同じ継続前面監視・遮断オーバーレイ・実行診断を持つ", () => {
    const services = [gateServiceTemplate, generatedGateService].map((file) => fs.readFileSync(file, "utf8"));
    const xmlFiles = [accessibilityServiceXml, generatedAccessibilityServiceXml].map((file) => fs.readFileSync(file, "utf8"));

    xmlFiles.forEach((xml) => {
      expect(xml).toContain('android:accessibilityEventTypes="typeWindowStateChanged|typeWindowsChanged|typeViewFocused|typeWindowContentChanged"');
      expect(xml).toContain('android:accessibilityFlags="flagRetrieveInteractiveWindows"');
    });
    services.forEach((service) => {
      expect(service).toContain("AccessibilityEvent.TYPE_WINDOWS_CHANGED");
      expect(service).toContain("AccessibilityEvent.TYPE_VIEW_FOCUSED");
      expect(service).toContain("AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED");
      expect(service).toContain("android.accessibilityservice.AccessibilityServiceInfo");
      expect(service).toContain("activeWindowPackage()");
      expect(service).toContain("scheduleForegroundRechecks()");
      expect(service).toContain("foregroundRecheckDelays");
      expect(service).toContain("WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY");
      expect(service).toContain("WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE");
      expect(service).toContain("showGateOverlay(candidatePackage, matchingRule, state)");
      expect(service).toContain("hideGateOverlay()");
      expect(service).toContain("state.strictMode");
      expect(service).toContain("json.optBoolean(\"strictMode\")");
      expect(service).toContain("if (matchingRule == null)");
      expect(service).toContain("GATE_LAST_EVENT_AT");
      expect(service).not.toContain("FocusGateActivity::class.java");
    });
    expect(services[0]).toContain('Uri.parse("$DEEP_LINK_SCHEME:///")');
    expect(services[1]).toContain('Uri.parse("manusfocusflow:///")');
    expect(services[0]).toContain("Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP");
    const fallbackActivity = fs.readFileSync(gateActivityTemplate, "utf8");
    expect(fallbackActivity).toContain('Uri.parse("$DEEP_LINK_SCHEME:///")');
    expect(fallbackActivity).toContain("Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP");
    const module = fs.readFileSync(generatedGateModule, "utf8");
    expect(module).toContain("configuredBlockedPackageCount");
    expect(module).toContain("JSONObject(saved)");
  });
});
