import { useEffect, useMemo, useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import type { Habit } from "@/lib/focus-flow/types";
import { getHabitTimerProgress, habitProgressLabel, isHabitCompleteOn } from "@/lib/focus-flow/utils";
import { ScaledText as Text } from "./scaled-text";
import { useFocusPalette } from "./ui";

type HabitProgressControlProps = {
  habit: Habit;
  date: string;
  language: "ja" | "en";
  onAdjust: (delta: number) => void;
  onStartTimer: () => void;
  onPauseTimer: () => void;
};

/** 回数型と時間型を同じ± UIに混在させない、一覧専用の進捗操作。 */
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
    const progress = habitProgressLabel(habit, date, language);
    return <View style={[styles.countControl, { backgroundColor: palette.elevated }]}>
      <TouchableOpacity accessibilityLabel={language === "en" ? "Decrease today's progress" : "今日の進捗を減らす"} hitSlop={7} onPress={() => onAdjust(-1)} style={[styles.countButton, { backgroundColor: palette.surface }]}><MaterialIcons name="remove" size={17} color={habit.color} /></TouchableOpacity>
      <Text style={[styles.countValue, { color: habit.color }]}>{progress}</Text>
      <TouchableOpacity accessibilityLabel={language === "en" ? "Increase today's progress" : "今日の進捗を増やす"} hitSlop={7} onPress={() => onAdjust(1)} style={[styles.countButton, { backgroundColor: palette.surface }]}><MaterialIcons name="add" size={17} color={habit.color} /></TouchableOpacity>
    </View>;
  }

  const status = timer.running ? (language === "en" ? "Timing" : "計測中") : timer.paused ? (language === "en" ? "Paused" : "一時停止") : timer.ready ? (language === "en" ? "Goal reached" : "目標達成") : (language === "en" ? "Time goal" : "時間目標");
  const action = timer.running ? (language === "en" ? "Pause" : "停止") : timer.paused ? (language === "en" ? "Resume" : "再開") : (language === "en" ? "Start" : "開始");
  return <View style={[styles.timerControl, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
    <View style={styles.timerCopy}><Text style={[styles.timerStatus, { color: timer.running ? habit.color : palette.muted }]}>{status}</Text><Text style={[styles.timerValue, { color: palette.text }]}>{timer.label}</Text></View>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={timer.running ? (language === "en" ? `Pause ${habit.title} timer` : `「${habit.title}」の計測を停止`) : (language === "en" ? `Start ${habit.title} timer` : `「${habit.title}」の計測を${timer.paused ? "再開" : "開始"}`)} onPress={timer.running ? onPauseTimer : onStartTimer} style={[styles.timerButton, { backgroundColor: timer.running ? palette.surface : habit.color, borderColor: timer.running ? habit.color : habit.color }]}><MaterialIcons name={timer.running ? "pause" : "play-arrow"} size={16} color={timer.running ? habit.color : "#FFFFFF"} /><Text style={[styles.timerButtonText, { color: timer.running ? habit.color : "#FFFFFF" }]}>{action}</Text></TouchableOpacity>
  </View>;
}

const styles = StyleSheet.create({
  countControl: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, marginTop: 7, paddingHorizontal: 5, paddingVertical: 4 },
  countButton: { width: 30, height: 30, alignItems: "center", justifyContent: "center", borderRadius: 9 },
  countValue: { minWidth: 54, textAlign: "center", fontSize: 12, fontWeight: "900" },
  timerControl: { alignSelf: "stretch", minHeight: 47, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, borderWidth: 1, borderRadius: 13, marginTop: 8, paddingLeft: 10, paddingRight: 6, paddingVertical: 5 },
  timerCopy: { flex: 1, minWidth: 0 },
  timerStatus: { fontSize: 10, lineHeight: 14, fontWeight: "900", letterSpacing: 0.25 },
  timerValue: { fontSize: 13, lineHeight: 18, fontVariant: ["tabular-nums"], fontWeight: "900" },
  timerButton: { minWidth: 68, minHeight: 34, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3, borderRadius: 10, borderWidth: 1, paddingHorizontal: 8 },
  timerButtonText: { fontSize: 11, fontWeight: "900" },
});
