import { type TextProps, Text, type TextStyle, StyleSheet } from "react-native";
import { useFocusFlow } from "@/lib/focus-flow/provider";

const FACTORS = { compact: 0.92, standard: 1, large: 1.14 } as const;

export function ScaledText({ style, ...props }: TextProps) {
  const { displaySettings } = useFocusFlow();
  const flattened = StyleSheet.flatten(style) as TextStyle | undefined;
  const factor = FACTORS[displaySettings.fontScale];
  const fontSize = typeof flattened?.fontSize === "number" ? Math.round(flattened.fontSize * factor * 10) / 10 : undefined;
  const lineHeight = typeof flattened?.lineHeight === "number" ? Math.round(flattened.lineHeight * factor * 10) / 10 : undefined;
  return <Text {...props} style={[style, fontSize ? { fontSize, lineHeight } : undefined]} />;
}
