import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { TaskForm } from "@/components/focus-flow/task-form";
import { COLORS, IconButton, LoadingScreen, safeHaptic } from "@/components/focus-flow/ui";
import { ScreenContainer } from "@/components/screen-container";
import { useFocusFlow } from "@/lib/focus-flow/provider";
import { dayKey, focusMinutesOnDay, formatMinutes, isHabitCompleteOn } from "@/lib/focus-flow/utils";

const FOCUS_SECONDS = 25 * 60;

export default function TodayScreen() {
  const router = useRouter();
  const { todos, habits, focusSessions, isReady, toggleTodo, toggleHabit, addTodo, addFocusSession } = useFocusFlow();
  const [remaining, setRemaining] = useState(FOCUS_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const today = dayKey();
  const openTodos = useMemo(() => todos.filter((todo) => !todo.completed), [todos]);
  const completedToday = todos.filter((todo) => todo.completed && todo.completedAt && dayKey(new Date(todo.completedAt)) === today).length;
  const habitDone = habits.filter((habit) => isHabitCompleteOn(habit, today)).length;
  const focusToday = focusMinutesOnDay(focusSessions, today);
  const progressDenominator = openTodos.length + completedToday + habits.length;
  const dailyProgress = progressDenominator ? Math.round(((completedToday + habitDone) / progressDenominator) * 100) : 0;
  const nextTodo = openTodos[0];

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setRemaining((value) => Math.max(value - 1, 0)), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (remaining === 0 && isRunning) {
      setIsRunning(false);
      addFocusSession(25);
      safeHaptic("success");
    }
  }, [remaining, isRunning, addFocusSession]);

  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");
  const greeting = new Date().getHours() < 12 ? "おはようございます" : new Date().getHours() < 18 ? "今日の流れを整えましょう" : "一日をやさしく締めくくりましょう";

  if (!isReady) return <ScreenContainer><LoadingScreen /></ScreenContainer>;

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <FlatList
        data={[]}
        renderItem={() => null}
        keyExtractor={() => "content"}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <View style={styles.topline}><View><Text style={styles.date}>今日</Text><Text style={styles.greeting}>{greeting}</Text></View><IconButton icon="add" label="Todoを追加" onPress={() => setTaskFormOpen(true)} variant="filled" /></View>
            <View style={styles.overviewCard}>
              <View><Text style={styles.overviewLabel}>今日の進捗</Text><Text style={styles.overviewValue}>{dailyProgress}%</Text><Text style={styles.overviewDetail}>{completedToday}件のTodo完了 ・ 習慣 {habitDone}/{habits.length}</Text></View>
              <View style={styles.progressCircle}><Text style={styles.progressCircleText}>{dailyProgress}</Text><Text style={styles.progressCircleSuffix}>%</Text></View>
            </View>
            <View style={styles.timerCard}>
              <View style={styles.timerTop}><View style={styles.timerIcon}><MaterialIcons name="timer" size={19} color={COLORS.blue} /></View><View><Text style={styles.timerLabel}>集中セッション</Text><Text style={styles.timerSub}>{focusToday ? `今日は ${formatMinutes(focusToday)} 集中しました` : "静かな25分を始めましょう"}</Text></View></View>
              <Text style={styles.timerText}>{minutes}:{seconds}</Text>
              <View style={styles.timerActions}><TouchableOpacity accessibilityRole="button" onPress={() => { safeHaptic("light"); if (remaining === 0) { setRemaining(FOCUS_SECONDS); setIsRunning(true); } else { setIsRunning((value) => !value); } }} activeOpacity={0.8} style={styles.startButton}><MaterialIcons name={isRunning ? "pause" : "play-arrow"} size={21} color={COLORS.white} /><Text style={styles.startText}>{isRunning ? "一時停止" : remaining === 0 ? "もう一度" : "集中を開始"}</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" accessibilityLabel="タイマーをリセット" onPress={() => { setIsRunning(false); setRemaining(FOCUS_SECONDS); }} style={styles.resetButton}><MaterialIcons name="restart-alt" size={21} color={COLORS.blue} /></TouchableOpacity></View>
            </View>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>次にすること</Text><TouchableOpacity onPress={() => router.push("/(tabs)/todos")}><Text style={styles.linkText}>すべて見る</Text></TouchableOpacity></View>
            {nextTodo ? <View style={styles.nextCard}><TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: false }} onPress={() => { safeHaptic("success"); toggleTodo(nextTodo.id); }} style={styles.nextCheck} /><TouchableOpacity style={styles.nextCopy} onPress={() => router.push("/(tabs)/todos")}><Text style={styles.nextTitle} numberOfLines={2}>{nextTodo.title}</Text><Text style={styles.nextMeta}>{nextTodo.dueDate ? `${nextTodo.dueDate.replace(/-/g, "/")} まで` : "期限なし"}</Text></TouchableOpacity><MaterialIcons name="chevron-right" size={22} color={COLORS.muted} /></View> : <TouchableOpacity onPress={() => setTaskFormOpen(true)} activeOpacity={0.8} style={styles.noTaskCard}><MaterialIcons name="add-task" size={22} color={COLORS.forest} /><View style={styles.noTaskCopy}><Text style={styles.noTaskTitle}>次のTodoを決める</Text><Text style={styles.noTaskText}>小さな一歩を追加して、今日の流れを作りましょう。</Text></View></TouchableOpacity>}
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>今日の習慣</Text><TouchableOpacity onPress={() => router.push("/(tabs)/habits")}><Text style={styles.linkText}>記録する</Text></TouchableOpacity></View>
            {habits.length ? <View style={styles.habitPanel}>{habits.slice(0, 3).map((habit) => { const done = isHabitCompleteOn(habit, today); return <TouchableOpacity key={habit.id} accessibilityRole="checkbox" accessibilityState={{ checked: done }} onPress={() => { safeHaptic(done ? "light" : "success"); toggleHabit(habit.id); }} activeOpacity={0.74} style={styles.habitRow}><View style={[styles.habitCheck, done && { backgroundColor: habit.color, borderColor: habit.color }]}>{done ? <MaterialIcons name="check" size={16} color={COLORS.white} /> : null}</View><View style={[styles.habitColor, { backgroundColor: habit.color }]} /><Text style={[styles.habitName, done && styles.habitNameDone]} numberOfLines={1}>{habit.title}</Text></TouchableOpacity>; })}</View> : <TouchableOpacity onPress={() => router.push("/(tabs)/habits")} activeOpacity={0.8} style={styles.noHabitCard}><MaterialIcons name="repeat" size={22} color={COLORS.forest} /><Text style={styles.noHabitText}>続けたい行動を習慣として登録する</Text></TouchableOpacity>}
          </>
        }
      />
      <TaskForm visible={taskFormOpen} onClose={() => setTaskFormOpen(false)} onSave={addTodo} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 16, paddingBottom: 28, flexGrow: 1 },
  topline: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  date: { color: COLORS.forest, fontSize: 13, fontWeight: "800", letterSpacing: 0.4 },
  greeting: { color: COLORS.text, fontSize: 24, lineHeight: 31, fontWeight: "800", letterSpacing: -0.4, marginTop: 2 },
  overviewCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: COLORS.forest, borderRadius: 23, padding: 20, marginBottom: 14 },
  overviewLabel: { color: "#CFE0D8", fontSize: 13, fontWeight: "700" },
  overviewValue: { color: COLORS.white, fontSize: 34, lineHeight: 42, fontWeight: "800", letterSpacing: -1, marginTop: 2 },
  overviewDetail: { color: "#D6E6DE", fontSize: 12, lineHeight: 18, marginTop: 2 },
  progressCircle: { width: 62, height: 62, alignItems: "center", justifyContent: "center", borderRadius: 31, borderWidth: 5, borderColor: "#78AFA0" },
  progressCircleText: { color: COLORS.white, fontSize: 19, fontWeight: "800" },
  progressCircleSuffix: { color: "#D6E6DE", fontSize: 10, fontWeight: "700", marginTop: -3 },
  timerCard: { backgroundColor: "#F0F4F7", borderRadius: 23, padding: 18, borderWidth: 1, borderColor: "#D9E2EA", marginBottom: 23 },
  timerTop: { flexDirection: "row", alignItems: "center" },
  timerIcon: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#DDE7F0", marginRight: 10 },
  timerLabel: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  timerSub: { color: COLORS.muted, fontSize: 12, lineHeight: 17, marginTop: 1 },
  timerText: { color: COLORS.blue, textAlign: "center", fontSize: 44, lineHeight: 54, fontWeight: "800", letterSpacing: 1, marginVertical: 12 },
  timerActions: { flexDirection: "row", gap: 10 },
  startButton: { flex: 1, minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 15, backgroundColor: COLORS.blue },
  startText: { color: COLORS.white, fontSize: 15, fontWeight: "800" },
  resetButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: COLORS.white, borderColor: "#D4E0E7", borderWidth: 1 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  sectionTitle: { color: COLORS.text, fontSize: 18, lineHeight: 24, fontWeight: "800" },
  linkText: { color: COLORS.forest, fontSize: 13, fontWeight: "800" },
  nextCard: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.white, borderRadius: 18, borderColor: COLORS.border, borderWidth: 1, padding: 14, marginBottom: 22 },
  nextCheck: { width: 28, height: 28, borderRadius: 10, borderColor: "#AFC0B7", borderWidth: 1.5, marginRight: 12 },
  nextCopy: { flex: 1, minWidth: 0 },
  nextTitle: { color: COLORS.text, fontSize: 16, lineHeight: 22, fontWeight: "800" },
  nextMeta: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  noTaskCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#E8F0EC", borderRadius: 18, padding: 15, gap: 12, marginBottom: 22 },
  noTaskCopy: { flex: 1 },
  noTaskTitle: { color: COLORS.forest, fontSize: 15, fontWeight: "800" },
  noTaskText: { color: "#45675C", fontSize: 12, lineHeight: 17, marginTop: 2 },
  habitPanel: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 4 },
  habitRow: { flexDirection: "row", alignItems: "center", minHeight: 51, borderBottomColor: "#EEF2EF", borderBottomWidth: 1 },
  habitCheck: { width: 25, height: 25, alignItems: "center", justifyContent: "center", borderRadius: 9, borderColor: "#B8C7BF", borderWidth: 1.3, marginRight: 10 },
  habitColor: { width: 8, height: 8, borderRadius: 4, marginRight: 9 },
  habitName: { color: COLORS.text, flex: 1, fontSize: 15, fontWeight: "700" },
  habitNameDone: { color: COLORS.muted, textDecorationLine: "line-through" },
  noHabitCard: { flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: "#E8F0EC", borderRadius: 18, padding: 16 },
  noHabitText: { color: COLORS.forest, fontSize: 14, fontWeight: "800" },
});
