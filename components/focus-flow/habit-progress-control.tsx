import { useEffect, useMemo, useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import type { Habit } from "@/lib/focus-flow/types";
import { getHabitTimerProgress, isHabitCompleteOn } from "@/lib/focus-flow/utils";
import { ScaledText as Text } from "./scaled-text";
import { safeHaptic, useFocusPalette } from "./ui";

type HabitProgressControlProps = {
  habit: Habit;
  date: string;
  language: "ja" | "en";
  onAdjust: (delta: number) => void;
  onStartTimer: () => void;
  onPauseTimer: () => void;
};

/** 回数型と時間型を同じ± UIに混在させない、Material 3基準の進捗操作。 */
export function HabitProgressControl({ habit, date, language, onAdjust, onStartTimer, onPauseTimer }: HabitProgressControlProps) {
  const palette = useFocusPalette();
  const [now, setNow] = useState(() => new Date());
  const unit = habit.progressUnit ?? "check";
  const timer = useMemo(() => getHabitTimerProgress(habit, date, now), [date, habit, now]);
  const isTimed = unit === "minutes";

  useEffect(() => {
    if (!isTimed || !timer.running) return;
    const interval = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(interval);
  }, [isTimed, timer.running]);

  if (unit === "check" || isHabitCompleteOn(habit, date, now)) return null;

  if (unit === "count") {
    const value = habit.dailyProgress?.[date] ?? 0;
    const target = Math.max(habit.targetValue ?? 1, 1);
    const unitLabel = language === "en" ? "" : "回";
    return (
      <View style={[styles.countContainer, { backgroundColor: palette.elevated }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={language === "en" ? "Decrease today's progress" : "今日の進捗を減らす"}
          hitSlop={8}
          onPress={() => {
            safeHaptic("light");
            onAdjust(-1);
          }}
          style={[styles.countButton, { backgroundColor: palette.surface }]}
        >
          <MaterialIcons name="remove" size={18} color={habit.color} />
        </TouchableOpacity>
        <View style={styles.countTextContainer}>
          <Text style={[styles.countCurrent, { color: palette.text }]}>{value}</Text>
          <Text style={[styles.countTarget, { color: palette.muted }]}> / {target}{unitLabel}</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={language === "en" ? "Increase today's progress" : "今日の進捗を増やす"}
          hitSlop={8}
          onPress={() => {
            safeHaptic("light");
            onAdjust(1);
          }}
          style={[styles.countButton, { backgroundColor: palette.surface }]}
        >
          <MaterialIcons name="add" size={18} color={habit.color} />
        </TouchableOpacity>
      </View>
    );
  }

  const status = timer.running
    ? (language === "en" ? "Timing" : "計測中")
    : timer.paused
    ? (language === "en" ? "Paused" : "一時停止")
    : timer.ready
    ? (language === "en" ? "Goal reached" : "目標達成")
    : (language === "en" ? "Time goal" : "時間目標");

  const action = timer.running
    ? (language === "en" ? "Pause" : "一時停止")
    : timer.paused
    ? (language === "en" ? "Resume" : "再開")
    : (language === "en" ? "Start" : "開始");

  return (
    <View style={[styles.timerControl, { backgroundColor: palette.elevated }]}>
      <View style={styles.timerCopy}>
        <Text style={[styles.timerStatus, { color: timer.running ? palette.primary : palette.muted }]}>
          {status}
        </Text>
        <Text style={[styles.timerValue, { color: palette.text }]}>
          {timer.label}
        </Text>
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={
          timer.running
            ? (language === "en" ? `Pause ${habit.title} timer` : `「${habit.title}」の計測を一時停止`)
            : (language === "en" ? `Start ${habit.title} timer` : `「${habit.title}」の計測を${timer.paused ? "再開" : "開始"}`)
        }
        onPress={() => {
          safeHaptic("light");
          if (timer.running) {
            onPauseTimer();
          } else {
            onStartTimer();
          }
        }}
        activeOpacity={0.8}
        style={[
          styles.timerButton,
          {
            backgroundColor: palette.primary,
          },
          !timer.running && {
            backgroundColor: palette.elevated,
          },
        ]}
      >
        <MaterialIcons
          name={timer.running ? "pause" : "play-arrow"}
          size={18}
          color={timer.running ? "#FFFFFF" : palette.primary}
        />
        {/* color="#FFFFFF" */}
        <Text
          style={[
            styles.timerButtonText,
            { color: palette.primary },
            timer.running && { color: "#FFFFFF" },
          ]}
        >
          {action}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  countContainer: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    marginTop: 8,
    paddingHorizontal: 4,
    paddingVertical: 3,
    minHeight: 44,
  },
  countButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  countTextContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    paddingHorizontal: 10,
    minWidth: 56,
    justifyContent: "center",
  },
  countCurrent: {
    fontSize: 15,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  countTarget: {
    fontSize: 12,
    fontWeight: "700",
  },
  timerControl: {
    alignSelf: "stretch",
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 16,
    marginTop: 8,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
  },
  timerCopy: {
    flex: 1,
    minWidth: 0,
  },
  timerStatus: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "900",
    letterSpacing: 0.25,
  },
  timerValue: {
    fontSize: 13,
    lineHeight: 18,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
  },
  timerButton: {
    minWidth: 84,
    minHeight: 38,
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 12,
  },
  timerButtonText: {
    fontSize: 12,
    fontWeight: "900",
  },
});
