import { useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { HabitProgressControl } from "@/components/focus-flow/habit-progress-control";
import { ScaledText as Text } from "@/components/focus-flow/scaled-text";
import { COLORS, useFocusPalette } from "@/components/focus-flow/ui";
import type { Habit, Todo } from "@/lib/focus-flow/types";
import { dayKey, dayKeyOffset, formatJapaneseDate, getTodoDueStatus, getTodoSubtasks, habitStreak, isHabitCompleteOn, isTodoAchieved, isTodoEffectiveRequired, shortWeekday, weeklyHabitProgress } from "@/lib/focus-flow/utils";

type Translate = (ja: string, en: string) => string;

function RequiredLabel({ label, color }: { label: string; color: string }) {
  return <Text style={[styles.requiredLabel, { color }]}>{label}</Text>;
}

export function TodoItemCard({ todo, showRequired = todo.isRequired, language, t, onOpen, onToggle, onDelete, onToggleSubtask }: { todo: Todo; showRequired?: boolean; language: "ja" | "en"; t: Translate; onOpen: () => void; onToggle: () => void; onDelete?: () => void; onToggleSubtask?: (subtaskId: string) => void }) {
  const achieved = isTodoAchieved(todo);
  const dueStatus = getTodoDueStatus(todo);
  const effectiveRequired = showRequired || isTodoEffectiveRequired(todo);
  const palette = useFocusPalette();
  const due = !todo.dueDate ? undefined : dueStatus === "overdue" ? t("期限超過", "Overdue") : dueStatus === "today" ? t("今日まで", "Due today") : formatJapaneseDate(todo.dueDate, language);
  const subtasks = getTodoSubtasks(todo); const completedSubtasks = subtasks.filter((subtask) => subtask.completed).length;
  const doneTitleStyle = achieved ? { color: palette.muted, textDecorationLine: "line-through" as const, textDecorationColor: palette.muted } : undefined;
  return <View style={[styles.todoRow, { backgroundColor: achieved ? palette.elevated : palette.surface, borderColor: palette.border }]}>
    <View style={[styles.rail, { backgroundColor: palette.primary }]} />
    <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: achieved }} accessibilityLabel={achieved ? t(`「${todo.title}」を未完了に戻す`, `Reopen “${todo.title}”`) : t(`「${todo.title}」を完了にする`, `Mark “${todo.title}” complete`)} onPress={(event) => { event.stopPropagation(); onToggle(); }} style={styles.todoCheckTouchTarget}><View style={[styles.todoCheck, { borderColor: palette.border }, achieved && { backgroundColor: palette.primary, borderColor: palette.primary }]}>{achieved ? <MaterialIcons name="check" size={15} color={COLORS.white} /> : null}</View></TouchableOpacity>
    <TouchableOpacity accessibilityRole="button" onPress={onOpen} activeOpacity={0.72} style={styles.copy}>
      <View style={styles.todoTitleLine}><Text style={[styles.todoTitle, { color: palette.text }, doneTitleStyle]} numberOfLines={1}>{todo.title}</Text>{due ? <Text numberOfLines={1} style={[styles.todoDue, { color: palette.muted }, dueStatus === "overdue" && styles.overdue]}>{due}</Text> : null}</View>
      <View style={styles.todoMeta}>{effectiveRequired ? <RequiredLabel label={t("必須", "Must-do")} color={palette.primary} /> : null}{todo.memo ? <Text style={[styles.todoMemo, { color: palette.muted }]} numberOfLines={1}>{todo.memo}</Text> : null}{subtasks.length ? <Text style={[styles.todoSubtaskProgress, { color: palette.primary }]}>{t(`サブタスク ${completedSubtasks}/${subtasks.length}`, `Subtasks ${completedSubtasks}/${subtasks.length}`)}</Text> : null}</View>
      {subtasks.length && onToggleSubtask ? <View style={[styles.subtaskPreview, { borderLeftColor: palette.border }]}>{subtasks.slice(0, 2).map((subtask) => <TouchableOpacity key={subtask.id} accessibilityRole="checkbox" accessibilityState={{ checked: subtask.completed }} onPress={() => onToggleSubtask(subtask.id)} style={styles.subtaskPreviewRow}><View style={[styles.miniCheck, { borderColor: palette.border }, subtask.completed && { backgroundColor: palette.primary, borderColor: palette.primary }]}>{subtask.completed ? <MaterialIcons name="check" size={9} color={COLORS.white} /> : null}</View><Text style={[styles.subtaskPreviewText, { color: subtask.completed ? palette.muted : palette.text }, subtask.completed && styles.subtaskPreviewDone]} numberOfLines={1}>{subtask.title}</Text></TouchableOpacity>)}</View> : null}
    </TouchableOpacity>
    {subtasks.length ? <View accessibilityRole="image" accessibilityLabel={t(`サブタスク ${completedSubtasks}/${subtasks.length}`, `Subtasks ${completedSubtasks}/${subtasks.length}`)} style={styles.subtaskIndicator}><MaterialIcons name="subdirectory-arrow-right" size={17} color={palette.primary} /></View> : null}
    <TouchableOpacity accessibilityLabel={t("Todoの詳細を開く", "Open task details")} hitSlop={8} onPress={onOpen} style={styles.trailing}><MaterialIcons name="chevron-right" size={20} color={palette.muted} /></TouchableOpacity>
  </View>;
}

export function HabitItemCard({ habit, showRequired = habit.isRequired, language, t, onOpen, onToggle, onStartTimer, onPauseTimer, onProgress, onDelete }: { habit: Habit; showRequired?: boolean; language: "ja" | "en"; t: Translate; onOpen: () => void; onToggle: (date?: string) => void; onStartTimer: () => void; onPauseTimer: () => void; onProgress: (delta: number) => void; onDelete?: () => void }) {
  const today = dayKey(); const done = isHabitCompleteOn(habit, today); const weekly = weeklyHabitProgress(habit); const week = useMemo(() => Array.from({ length: 7 }, (_, index) => dayKeyOffset(index - 6)), []);
  const palette = useFocusPalette();
  const [expanded, setExpanded] = useState(false);
  const doneTitleStyle = done ? { color: palette.muted, textDecorationLine: "line-through" as const, textDecorationColor: palette.muted } : undefined;
  return <View style={[styles.habitRow, expanded && styles.habitRowExpanded, { backgroundColor: done ? palette.elevated : palette.surface, borderColor: palette.border }]}><View style={[styles.rail, { backgroundColor: habit.color }]} /><TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: done }} accessibilityLabel={t(`「${habit.title}」を今日の習慣として記録`, `Record “${habit.title}” for today`)} onPressIn={(event) => event.stopPropagation()} onPress={() => onToggle()} style={styles.checkTouchTarget}><View style={[styles.check, { borderColor: palette.border }, done && { backgroundColor: habit.color, borderColor: habit.color }]}>{done ? <MaterialIcons name="check" size={17} color={COLORS.white} /> : null}</View></TouchableOpacity><View style={styles.copy}><TouchableOpacity accessibilityRole="button" onPress={onOpen} style={styles.habitSummary}><View style={styles.habitTitleLine}><Text style={[styles.title, { color: palette.text }, doneTitleStyle]} numberOfLines={1}>{habit.title}</Text>{showRequired ? <RequiredLabel label={t("必須", "Must-do")} color={palette.primary} /> : null}<TouchableOpacity accessibilityRole="button" accessibilityLabel={expanded ? t("習慣の詳細を閉じる", "Collapse habit details") : t("習慣の詳細を展開する", "Expand habit details")} hitSlop={8} onPress={(event) => { event.stopPropagation(); setExpanded((value) => !value); }} style={styles.expandButton}><MaterialIcons name={expanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={19} color={palette.muted} /></TouchableOpacity></View><View style={styles.meta}><Text style={[styles.metaText, { color: palette.muted }]}>{t(`週 ${weekly.completed}/${weekly.target}`, `${weekly.completed}/${weekly.target} this week`)} · {habitStreak(habit)}{t("日連続", "-day streak")}</Text></View></TouchableOpacity>{expanded ? <><View style={[styles.detailSurface, { backgroundColor: palette.elevated, borderColor: palette.border }]}><Text style={[styles.detailLabel, { color: palette.muted }]}>{t("曜日", "Days")}</Text><View style={styles.weekRow}>{week.map((key) => { const marked = isHabitCompleteOn(habit, key); const current = key === today; return <TouchableOpacity key={key} accessibilityLabel={t(`${shortWeekday(key)}曜日を記録`, `Record ${shortWeekday(key, language)}`)} hitSlop={7} onPress={() => onToggle(key)} style={[styles.dayDot, { borderColor: palette.border }, current && { borderColor: habit.color }, marked && { backgroundColor: habit.color, borderColor: habit.color }]}>{marked ? <MaterialIcons name="check" size={10} color={COLORS.white} /> : <Text style={[styles.dayLetter, { color: palette.muted }, current && { color: habit.color }]}>{shortWeekday(key, language)}</Text>}</TouchableOpacity>})}</View><HabitProgressControl habit={habit} date={today} language={language} onAdjust={onProgress} onStartTimer={onStartTimer} onPauseTimer={onPauseTimer} /></View></> : null}</View><TouchableOpacity accessibilityLabel={t("習慣の詳細を開く", "Open habit details")} hitSlop={8} onPress={onOpen} style={styles.trailing}><MaterialIcons name="chevron-right" size={21} color={palette.muted} /></TouchableOpacity></View>;
}

const styles = StyleSheet.create({
  todoRow: { position: "relative", minHeight: 66, flexDirection: "row", alignItems: "flex-start", borderWidth: 1, borderRadius: 14, paddingVertical: 7, paddingLeft: 12, paddingRight: 3, marginBottom: 5, overflow: "hidden" },
  habitRow: { position: "relative", minHeight: 62, flexDirection: "row", alignItems: "flex-start", borderWidth: 1, borderRadius: 14, paddingVertical: 6, paddingLeft: 12, paddingRight: 3, marginBottom: 4, overflow: "hidden" },
  habitRowExpanded: { minHeight: 98 },
  rail: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 },
  todoCheckTouchTarget: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginLeft: -8, marginTop: -5, marginRight: 2 },
  checkTouchTarget: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginLeft: -8, marginTop: -5, marginRight: 2 },
  todoCheck: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  check: { width: 28, height: 28, borderRadius: 6, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, minWidth: 0, overflow: "visible" },
  habitSummary: { flex: 1, minWidth: 0 },
  todoTitleLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  habitTitleLine: { flexDirection: "row", alignItems: "center", gap: 5 },
  requiredLabel: { fontSize: 10, lineHeight: 14, fontWeight: "900", letterSpacing: 0.1 },
  expandButton: { width: 30, height: 32, alignItems: "center", justifyContent: "center", marginRight: -4 },
  detailSurface: { marginTop: 5, borderWidth: 1, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 5 },
  detailLabel: { fontSize: 9, lineHeight: 12, fontWeight: "800", marginBottom: 2 },
  todoTitle: { flex: 1, minWidth: 0, fontSize: 14, lineHeight: 19, fontWeight: "800" },
  title: { fontSize: 15, lineHeight: 21, fontWeight: "800" },
  todoMemo: { fontSize: 10, lineHeight: 14, marginTop: 1 },
  memo: { fontSize: 11, lineHeight: 16, marginTop: 2 },
  todoSubtaskProgress: { fontSize: 10, lineHeight: 14, fontWeight: "800" },
  subtaskProgress: { fontSize: 10, lineHeight: 15, fontWeight: "800" },
  subtaskPreview: { marginTop: 2, marginLeft: 4, paddingLeft: 6, borderLeftWidth: 1, gap: 1 },
  subtaskPreviewRow: { minHeight: 19, flexDirection: "row", alignItems: "center", gap: 5 },
  miniCheck: { width: 14, height: 14, borderRadius: 4, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  subtaskPreviewText: { flex: 1, fontSize: 10, lineHeight: 14, fontWeight: "600" },
  subtaskPreviewDone: { textDecorationLine: "line-through" },
  todoMeta: { width: "100%", minHeight: 19, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 5, marginTop: 2 },
  meta: { width: "100%", minHeight: 18, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginTop: 2 },
  todoDue: { maxWidth: "42%", flexShrink: 1, fontSize: 10, lineHeight: 15, fontWeight: "800" },
  due: { flexShrink: 1, fontSize: 11, lineHeight: 17, fontWeight: "800" },
  overdue: { color: COLORS.error },
  metaText: { width: "100%", fontSize: 11, lineHeight: 16, fontWeight: "700" },
  weekRow: { flexDirection: "row", gap: 6, marginTop: 6 },
  dayDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  dayLetter: { fontSize: 9, fontWeight: "800" },
  subtaskIndicator: { width: 28, height: 38, alignItems: "center", justifyContent: "center", marginLeft: 1 },
  trailing: { width: 32, height: 34, alignItems: "center", justifyContent: "center", marginLeft: 1 },
});
