import { type TextProps, Text, type TextStyle, StyleSheet, useColorScheme } from "react-native";
import { getAppLanguage, translateStaticText } from "@/lib/focus-flow/i18n";
import { getAppFontStyle } from "@/lib/focus-flow/app-fonts";
import { getAppPalette, type AppPalette } from "@/lib/focus-flow/app-themes";
import { useFocusFlow } from "@/lib/focus-flow/provider";

const FACTORS = { compact: 0.92, standard: 1, large: 1.14 } as const;
const PRIMARY_COLORS = new Set(["#1b6b62", "#246b5a", "#215b83", "#23724d", "#28769f", "#7a5195", "#b35f35"]);
const TEXT_COLORS = new Set(["#15233b", "#1a2925", "#173f36", "#173b59", "#153126", "#153044", "#32233d", "#412d1e"]);
const MUTED_COLORS = new Set(["#617089", "#64736d", "#46645b", "#3c617a", "#42675d", "#416a5d", "#315e55", "#75827c", "#66736d"]);

function semanticTextColor(color: TextStyle["color"] | undefined, palette: AppPalette) {
  if (typeof color !== "string") return undefined;
  const normalized = color.toLowerCase();
  if (PRIMARY_COLORS.has(normalized)) return palette.primary;
  if (TEXT_COLORS.has(normalized)) return palette.text;
  if (MUTED_COLORS.has(normalized)) return palette.muted;
  if (normalized === "#ffffff" || normalized === "#fff") return undefined;
  if (/^#[0-9a-f]{6}$/.test(normalized)) return palette.text;
  return undefined;
}

export function ScaledText({ style, ...props }: TextProps) {
  const { displaySettings } = useFocusFlow();
  const systemScheme = useColorScheme() === "dark" ? "dark" : "light";
  const palette = getAppPalette(displaySettings, systemScheme);
  const language = getAppLanguage(displaySettings);
  const flattened = StyleSheet.flatten(style) as TextStyle | undefined;
  const factor = FACTORS[displaySettings.fontScale];
  const fontSize = typeof flattened?.fontSize === "number" ? Math.round(flattened.fontSize * factor * 10) / 10 : undefined;
  const lineHeight = typeof flattened?.lineHeight === "number" ? Math.round(flattened.lineHeight * factor * 10) / 10 : undefined;
  const color = semanticTextColor(flattened?.color, palette);
  const children = typeof props.children === "string" ? translateStaticText(language, props.children) : props.children;
  return <Text {...props} style={[getAppFontStyle(displaySettings.fontFamily ?? "system"), style, color ? { color } : undefined, fontSize ? { fontSize, lineHeight } : undefined]}>{children}</Text>;
}
