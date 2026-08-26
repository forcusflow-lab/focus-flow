import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ReactNode } from "react";
import { ActivityIndicator, Platform, StyleSheet, TouchableOpacity, useColorScheme, View } from "react-native";
import { ScaledText } from "./scaled-text";
import { getAppPalette } from "@/lib/focus-flow/app-themes";
import { useFocusFlow } from "@/lib/focus-flow/provider";

type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

export const COLORS = {
  forest: "#1B6B62",
  blue: "#3566B7",
  background: "#F2F6FC",
  text: "#15233B",
  muted: "#617089",
  border: "#D7E1F0",
  success: "#198A68",
  warning: "#B96B13",
  error: "#C24756",
  white: "#FFFFFF",
};

export const HABIT_COLORS = ["#246B5A", "#315B8C", "#A76439", "#76569B", "#4B9B72"];

export function useFocusPalette() {
  const { displaySettings } = useFocusFlow();
  return getAppPalette(displaySettings, useColorScheme() === "dark" ? "dark" : "light");
}

export function ScreenHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  const { displaySettings } = useFocusFlow();
  const palette = getAppPalette(displaySettings, useColorScheme() === "dark" ? "dark" : "light");
  return (
    <View style={styles.heading}>
      <View style={styles.headingCopy}>
        {eyebrow ? <ScaledText style={[styles.eyebrow, { color: palette.primary }]}>{eyebrow}</ScaledText> : null}
        <ScaledText style={[styles.headingTitle, { color: palette.text }]}>{title}</ScaledText>
      </View>
      {action}
    </View>
  );
}

export function IconButton({ icon, label, onPress, variant = "plain" }: { icon: IconName; label: string; onPress: () => void; variant?: "plain" | "filled" }) {
  const palette = useFocusPalette();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      activeOpacity={0.72}
      style={[styles.iconButton, { backgroundColor: variant === "filled" ? palette.primary : palette.surface, borderColor: palette.border }]}
    >
      <MaterialIcons name={icon} size={22} color={variant === "filled" ? (palette.isDark ? palette.background : COLORS.white) : palette.primary} />
    </TouchableOpacity>
  );
}

export function LoadingScreen() {
  const palette = useFocusPalette();
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="small" color={palette.primary} />
      <ScaledText style={[styles.loadingText, { color: palette.muted }]}>あなたの記録を読み込んでいます</ScaledText>
    </View>
  );
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: { icon: IconName; title: string; description: string; actionLabel: string; onAction: () => void }) {
  const palette = useFocusPalette();
  return (
    <View style={[styles.empty, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <View style={[styles.emptyIcon, { backgroundColor: palette.primarySoft }]}>
        <MaterialIcons name={icon} size={28} color={palette.primary} />
      </View>
      <ScaledText style={[styles.emptyTitle, { color: palette.text }]}>{title}</ScaledText>
      <ScaledText style={[styles.emptyDescription, { color: palette.muted }]}>{description}</ScaledText>
      <TouchableOpacity accessibilityRole="button" onPress={onAction} activeOpacity={0.8} style={[styles.emptyAction, { backgroundColor: palette.primary }]}>
        <ScaledText style={[styles.emptyActionText, { color: palette.isDark ? palette.background : COLORS.white }]}>{actionLabel}</ScaledText>
      </TouchableOpacity>
    </View>
  );
}

export function Pill({ label, color = COLORS.forest, muted = false }: { label: string; color?: string; muted?: boolean }) {
  const palette = useFocusPalette();
  const resolvedColor = color === COLORS.forest ? palette.primary : color;
  return (
    <View style={[styles.pill, { backgroundColor: muted ? palette.elevated : `${resolvedColor}24` }]}>
      <ScaledText numberOfLines={1} ellipsizeMode="clip" style={[styles.pillText, { color: muted ? palette.muted : resolvedColor }]}>{label}</ScaledText>
    </View>
  );
}

export function safeHaptic(type: "light" | "success") {
  if (Platform.OS === "web") return;
  void import("expo-haptics").then((Haptics) => {
    if (type === "success") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  });
}

const styles = StyleSheet.create({
  heading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 15 },
  headingCopy: { flexShrink: 1 },
  eyebrow: { color: COLORS.forest, fontSize: 13, fontWeight: "700", letterSpacing: 0.5, marginBottom: 3 },
  headingTitle: { color: COLORS.text, fontSize: 26, lineHeight: 31, fontWeight: "800", letterSpacing: -0.6 },
  iconButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, borderWidth: 1 },
  iconButtonFilled: { backgroundColor: COLORS.forest },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: COLORS.muted, fontSize: 14 },
  empty: { alignItems: "center", justifyContent: "center", paddingHorizontal: 28, paddingVertical: 28, borderWidth: 1, borderRadius: 20, marginTop: 8 },
  emptyIcon: { width: 50, height: 50, borderRadius: 17, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyTitle: { color: COLORS.text, fontSize: 17, lineHeight: 24, fontWeight: "800", textAlign: "center" },
  emptyDescription: { color: COLORS.muted, fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 7 },
  emptyAction: { minHeight: 44, justifyContent: "center", paddingHorizontal: 18, borderRadius: 22, marginTop: 18 },
  emptyActionText: { fontSize: 14, fontWeight: "800" },
  pill: { minWidth: 68, minHeight: 30, paddingHorizontal: 14, justifyContent: "center", alignItems: "center", borderRadius: 15, alignSelf: "flex-start", flexShrink: 0, overflow: "visible" },
  pillText: { fontSize: 13, lineHeight: 18, fontWeight: "800", flexShrink: 0, includeFontPadding: false },
});
