import type { DisplaySettings, WidgetAccentTheme, WidgetBackgroundTheme, WidgetThemeKind, WidgetThemeSelection } from "./types";

export const WIDGET_THEME_KINDS: WidgetThemeKind[] = ["unified"];
export const DEFAULT_WIDGET_THEME: WidgetThemeSelection = { background: "default", accent: "auto" };

export function getWidgetTheme(settings: DisplaySettings, kind: WidgetThemeKind): WidgetThemeSelection {
  return { ...DEFAULT_WIDGET_THEME, ...(settings.widgetThemes?.[kind] ?? {}) };
}

export const WIDGET_BACKGROUND_OPTIONS: WidgetBackgroundTheme[] = ["default", "forest", "ocean", "violet", "amber", "blush", "ink"];
export const WIDGET_ACCENT_OPTIONS: WidgetAccentTheme[] = ["auto", "mint", "sky", "violet", "coral", "gold", "ink"];

export const WIDGET_BACKGROUND_SWATCH: Record<WidgetBackgroundTheme, string> = {
  default: "#4E7C71",
  forest: "#1E6B5A",
  ocean: "#2D5F8D",
  violet: "#6B4F8B",
  amber: "#F2D28A",
  blush: "#C85266",
  ink: "#263744",
};

export const WIDGET_ACCENT_SWATCH: Record<WidgetAccentTheme, string> = {
  auto: "#246B5A",
  mint: "#246B5A",
  sky: "#2563A6",
  violet: "#7758A7",
  coral: "#B84856",
  gold: "#A66E00",
  ink: "#263744",
};
