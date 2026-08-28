import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (...parts: string[]) => fs.readFileSync(path.join(process.cwd(), ...parts), "utf8");

describe("Focus Flow v20 Widget controls and dark-form quality contract", () => {
  it("uses one local-coordinate conversion for Slider taps and drags", () => {
    const settings = source("app", "(tabs)", "settings.tsx");
    expect(settings).toContain("valueFromLocationX");
    expect(settings).toContain("const usableTrackWidth = Math.max(1, trackWidth - thumbRadius * 2)");
    expect(settings).toContain("Math.round(((clampedX - thumbRadius) / usableTrackWidth) * 100)");
    expect(settings).toContain("onPanResponderRelease");
    expect(settings).toContain("Math.max(0, Math.min(100");
    expect(settings).toContain('pointerEvents="none"');
  });

  it("keeps complete and pending items in the Widget payload for a local display toggle", () => {
    const gate = source("lib", "focus-flow", "android-gate.ts");
    const provider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    const layout = source("plugins", "native", "android", "res", "layout", "focus_flow_widget_initial.xml");
    expect(gate).toContain('const widgetCompletedDisplay = "local"');
    expect(gate).toContain("...completedTodoItems.map");
    expect(gate).toContain("...completedHabitItems.map");
    expect(provider).toContain("ACTION_TOGGLE_COMPLETED");
    expect(provider).toContain("WIDGET_SHOW_COMPLETED");
    expect(provider).toContain("visibleWidgetItems(context, widgetId, all)");
    expect(provider).toContain("WIDGET_SHOW_COMPLETED_PREFIX");
    expect(provider).toContain("EXTRA_WIDGET_ID");
    expect(provider).toContain("completedToggleIntent(context, widgetId)");
    expect(layout).toContain("focus_flow_widget_completed_toggle");
    expect(provider).not.toContain("RemoteViewsService()");
    expect(provider).not.toContain('"setRemoteAdapter"');
  });

  it("applies row opacity separately and makes the mandatory pill and count controls theme-owned", () => {
    const provider = source("plugins", "native", "android", "kotlin", "FocusFlowWidgetProvider.kt");
    expect(provider).toContain('val rowOpacity = state.optInt("widgetCardOpacity", 100)');
    expect(provider).toContain('"setBackgroundColor", colorWithOpacity(if (completed) elevated else surface, rowOpacity)');
    expect(provider).toContain('views.setImageViewResource(ids.badgeBackground, widgetBadgeDrawable(context, theme, dark, rowOpacity))');
    expect(provider).toContain('views.setImageViewResource(ids.controlsBackground, widgetCardDrawable(dark, rowOpacity))');
    expect(provider).toContain('views.setImageViewResource(ids.timerBackground, widgetCardDrawable(dark, rowOpacity))');
  });

  it("removes fixed light form surfaces from the required-window selector", () => {
    const selector = source("components", "focus-flow", "required-window-selector.tsx");
    expect(selector).toContain("const palette = useFocusPalette()");
    expect(selector).toContain("backgroundColor: palette.elevated");
    expect(selector).toContain("backgroundColor: palette.surface");
    expect(selector).toContain("backgroundColor: palette.primarySoft");
    expect(selector).not.toContain('backgroundColor: "#F2F7F4"');
    expect(selector).not.toContain('backgroundColor: COLORS.white');
  });

  it("uses a safe-area fixed save footer and theme-owned memo actions", () => {
    const notes = source("app", "(tabs)", "notes.tsx");
    expect(notes).toContain("useSafeAreaInsets");
    expect(notes).toContain("const insets = useSafeAreaInsets()");
    expect(notes).toContain("styles.saveFooter");
    expect(notes).toContain("paddingBottom: Math.max(insets.bottom, 12)");
    expect(notes).toContain("backgroundColor: palette.primarySoft");
    expect(notes).toContain("color: palette.primary");
  });
});
