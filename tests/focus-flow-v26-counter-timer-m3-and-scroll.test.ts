import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("Focus Flow v26 M3 Counter, Timer Button Unification & Form Scroll Resilience", () => {
  describe("Habit Progress Control (App)", () => {
    const code = source("components", "focus-flow", "habit-progress-control.tsx");

    it("uses Material 3 pill container styling with elevated background and 999 radius", () => {
      expect(code).toContain("borderRadius: 999");
      expect(code).toContain("backgroundColor: palette.elevated");
      expect(code).not.toContain("borderColor: palette.border");
    });

    it("displays current count in bold/prominent color and target count in muted color", () => {
      expect(code).toContain("countCurrent:");
      expect(code).toContain('fontWeight: "900"');
      expect(code).toContain("countTarget:");
      expect(code).toContain("color: palette.muted");
    });

    it("ensures touch target of at least 48x48dp for decrement and increment buttons with hitSlop 8 and 36x36 size", () => {
      expect(code).toContain("hitSlop={8}");
      expect(code).toContain("width: 36");
      expect(code).toContain("height: 36");
    });

    it("uses solid Primary fill pill button with white text and icon for timer", () => {
      expect(code).toContain("backgroundColor: palette.primary");
      expect(code).toContain('color="#FFFFFF"');
      expect(code).toContain('color: "#FFFFFF"');
      expect(code).toContain("borderRadius: 999");
      expect(code).toContain("minHeight: 38");
      expect(code).toContain("play-arrow");
      expect(code).toContain("pause");
      expect(code).toContain("一時停止");
      expect(code).toContain("開始");
    });

    it("triggers safe haptics on counter and timer interactions", () => {
      expect(code).toContain('safeHaptic("light")');
    });
  });

  describe("Widget RemoteViews & Layouts (Android)", () => {
    const templateProvider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    const nativeProvider = source("android", "app", "src", "main", "java", "com", "app", "focusflow", "focusflow", "FocusFlowWidgetProvider.kt");
    const templateLayout = source("plugins", "native", "android", "res", "layout", "focus_flow_widget_initial.xml");
    const nativeLayout = source("android", "app", "src", "main", "res", "layout", "focus_flow_widget_initial.xml");
    const pillDrawable = source("plugins", "native", "android", "res", "drawable", "focus_flow_widget_pill_container.xml");

    it("defines rounded pill container drawable with 999dp corner radius", () => {
      expect(pillDrawable).toContain('<corners android:radius="999dp" />');
      expect(pillDrawable).toContain('<shape xmlns:android="http://schemas.android.com/apk/res/android"');
    });

    it("configures M3 pill container and Spannable bold current count in widget provider", () => {
      for (const provider of [templateProvider, nativeProvider]) {
        expect(provider).toContain("focus_flow_widget_pill_container");
        expect(provider).toContain('views.setInt(ids.controlsBackground, "setColorFilter", colorWithOpacity(elevated, rowOpacity))');
        expect(provider).toContain("StyleSpan(Typeface.BOLD)");
        expect(provider).toContain("ForegroundColorSpan(titleColor)");
        expect(provider).toContain("ForegroundColorSpan(mutedColor)");
        expect(provider).toContain('views.setInt(control, "setBackgroundColor", Color.TRANSPARENT)');
      }
    });

    it("configures solid primary pill background and white text for widget timer", () => {
      for (const provider of [templateProvider, nativeProvider]) {
        expect(provider).toContain('views.setImageViewResource(ids.timerBackground, R.drawable.focus_flow_widget_pill_container)');
        expect(provider).toContain('views.setInt(ids.timerBackground, "setColorFilter", primary)');
        expect(provider).toContain("views.setTextColor(ids.timer, Color.WHITE)");
        expect(provider).toContain('views.setInt(ids.timer, "setBackgroundColor", Color.TRANSPARENT)');
        expect(provider).toContain("❚❚ 一時停止");
        expect(provider).toContain("▶ 再開");
        expect(provider).toContain("▶ 開始");
      }
    });

    it("maintains 34dp height and unified widths for controls and timer containers in XML layout", () => {
      for (const layout of [templateLayout, nativeLayout]) {
        expect(layout).toContain('android:id="@+id/focus_flow_widget_static_row_one_controls"');
        expect(layout).toContain('android:layout_width="82dp"');
        expect(layout).toContain('android:id="@+id/focus_flow_widget_static_row_one_timer_container"');
        expect(layout.includes('android:layout_width="match_parent"') || layout.includes('android:layout_width="78dp"')).toBe(true);
        expect(layout).toContain('android:layout_height="34dp"');
        expect(layout).toContain('android:layout_marginEnd="88dp"');
      }
    });
  });

  describe("Detail Form Scroll Resilience and Async Gate Save", () => {
    const taskForm = source("components", "focus-flow", "task-form.tsx");
    const habitForm = source("components", "focus-flow", "habit-form.tsx");
    const templateGateModule = source("plugins", "native", "android", "kotlin", "FocusGateModule.kt");
    const nativeGateModule = source("android", "app", "src", "main", "java", "com", "app", "focusflow", "focusflow", "FocusGateModule.kt");

    it("prevents Android scroll freeze by omitting removeClippedSubviews and height-based keyboard avoiding", () => {
      for (const form of [taskForm, habitForm]) {
        expect(form).not.toContain("removeClippedSubviews={Platform.OS === 'android'}");
        expect(form).not.toContain('behavior="height"');
        expect(form).toContain('behavior={Platform.OS === "ios" ? "padding" : undefined}');
        expect(form).toContain("requestAnimationFrame");
        expect(form).toContain("scrollToEnd({ animated: true })");
      }
    });

    it("offloads saveGateState disk writes and widget refreshes to background executor", () => {
      for (const gate of [templateGateModule, nativeGateModule]) {
        expect(gate).toContain("java.util.concurrent.Executors.newSingleThreadExecutor()");
        expect(gate).toContain("executor.execute {");
        expect(gate).toContain("FocusFlowWidgetProvider.refreshAll(context)");
      }
    });
  });
});