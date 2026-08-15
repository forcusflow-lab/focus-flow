import { type TextProps, Text, type TextStyle, StyleSheet } from "react-native";
import { getAppLanguage, translateStaticText } from "@/lib/focus-flow/i18n";
import { getAppFontStyle } from "@/lib/focus-flow/app-fonts";
import { useFocusFlow } from "@/lib/focus-flow/provider";

const FACTORS = { compact: 0.92, standard: 1, large: 1.14 } as const;

export function ScaledText({ style, ...props }: TextProps) {
  const { displaySettings } = useFocusFlow();
  const language = getAppLanguage(displaySettings);
  const flattened = StyleSheet.flatten(style) as TextStyle | undefined;
  const factor = FACTORS[displaySettings.fontScale];
  const fontSize = typeof flattened?.fontSize === "number" ? Math.round(flattened.fontSize * factor * 10) / 10 : undefined;
  const lineHeight = typeof flattened?.lineHeight === "number" ? Math.round(flattened.lineHeight * factor * 10) / 10 : undefined;
  const children = typeof props.children === "string" ? translateStaticText(language, props.children) : props.children;
  return <Text {...props} style={[getAppFontStyle(displaySettings.fontFamily ?? "system"), style, fontSize ? { fontSize, lineHeight } : undefined]}>{children}</Text>;
}
