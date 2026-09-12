import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import type { AppPalette } from "@/lib/focus-flow/app-themes";
import type { WidgetBackgroundStyle } from "@/lib/focus-flow/types";

interface AppBackgroundProps {
  style?: WidgetBackgroundStyle;
  palette: AppPalette;
}

export const AppBackground = memo(function AppBackground({ style = "solid", palette }: AppBackgroundProps) {
  if (style === "solid") return null;

  const isDark = palette.isDark;

  if (style === "geometric") {
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View
          style={[
            styles.geometricCircleA,
            { backgroundColor: isDark ? "#2A4060" : "#B8D4E8", opacity: isDark ? 0.22 : 0.42 },
          ]}
        />
        <View
          style={[
            styles.geometricCircleB,
            { backgroundColor: isDark ? "#3D2D50" : "#D4C4E0", opacity: isDark ? 0.18 : 0.36 },
          ]}
        />
      </View>
    );
  }

  if (style === "aurora") {
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View
          style={[
            styles.auroraWaveA,
            { backgroundColor: isDark ? "#1D3F38" : "#BCE3DB", opacity: isDark ? 0.25 : 0.40 },
          ]}
        />
        <View
          style={[
            styles.auroraWaveB,
            { backgroundColor: isDark ? "#2D2545" : "#D5C8E8", opacity: isDark ? 0.22 : 0.38 },
          ]}
        />
        <View
          style={[
            styles.auroraWaveC,
            { backgroundColor: isDark ? "#382035" : "#F0D4DC", opacity: isDark ? 0.18 : 0.32 },
          ]}
        />
      </View>
    );
  }

  if (style === "grid") {
    const gridLineColor = isDark ? "rgba(255, 255, 255, 0.045)" : "rgba(0, 0, 0, 0.045)";
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={[styles.gridPattern, { borderColor: gridLineColor }]}>
          {Array.from({ length: 14 }).map((_, i) => (
            <View
              key={`h-${i}`}
              style={[styles.gridHorizontalLine, { top: (i + 1) * 56, borderColor: gridLineColor }]}
            />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <View
              key={`v-${i}`}
              style={[styles.gridVerticalLine, { left: (i + 1) * 48, borderColor: gridLineColor }]}
            />
          ))}
        </View>
      </View>
    );
  }

  return null;
});

const styles = StyleSheet.create({
  geometricCircleA: {
    position: "absolute",
    top: -60,
    right: -50,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  geometricCircleB: {
    position: "absolute",
    bottom: 80,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  auroraWaveA: {
    position: "absolute",
    top: -40,
    left: -40,
    width: 320,
    height: 280,
    borderRadius: 140,
    transform: [{ rotate: "-15deg" }, { scaleX: 1.4 }],
  },
  auroraWaveB: {
    position: "absolute",
    top: 220,
    right: -60,
    width: 300,
    height: 260,
    borderRadius: 130,
    transform: [{ rotate: "25deg" }, { scaleX: 1.3 }],
  },
  auroraWaveC: {
    position: "absolute",
    bottom: -30,
    left: 40,
    width: 280,
    height: 200,
    borderRadius: 100,
    transform: [{ rotate: "10deg" }],
  },
  gridPattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  gridHorizontalLine: {
    position: "absolute",
    left: 0,
    right: 0,
    borderBottomWidth: StyleSheet.hairlineWidth * 1.5,
  },
  gridVerticalLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderRightWidth: StyleSheet.hairlineWidth * 1.5,
  },
});
