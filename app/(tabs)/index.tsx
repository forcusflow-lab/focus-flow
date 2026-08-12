import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { TaskForm } from "@/components/focus-flow/task-form";
import { COLORS, IconButton, LoadingScreen, safeHaptic } from "@/components/focus-flow/ui";
import { ScreenContainer } from "@/components/screen-container";
import { useFocusFlow } from "@/lib/focus-flow/provider";
import { dayKey, getGateRuleSummaries, getGateSummary, isGateTimeActive, isHabitCompleteOn } from "@/lib/focus-flow/utils";

export default function TodayScreen() {
  const router = useRouter();
  const { todos, habits, focusSessions, gateConfig, displaySettings, isReady, toggleTodo, toggleHabit, addTodo } = useFocusFlow();
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const today = dayKey();
  const gateSummary = useMemo(() => getGateSummary({ todos, habits, focusSessions, gateConfig, displaySettings }), [todos, habits, focusSessions, gateConfig, displaySettings]);
  const activeRules = useMemo(() => getGateRuleSummaries({ todos, habits, focusSessions, gateConfig, displaySettings }).filter((rule) => rule.isActive), [todos, habits, focusSessions, gateConfig, displaySettings]);
  const timeActive = isGateTimeActive(gateConfig);
  const requiredTodoIds = new Set(activeRules.flatMap((rule) => rule.requiredTodoIds));
  const requiredHabitIds = new Set(activeRules.flatMap((rule) => rule.requiredHabitIds));
  const requiredTodos = todos.filter((todo) => requiredTodoIds.has(todo.id));
  const requiredHabits = habits.filter((habit) => requiredHabitIds.has(habit.id));
  const openTodos = requiredTodos.filter((todo) => !todo.completed);
  const completeHabits = requiredHabits.filter((habit) => isHabitCompleteOn(habit, today)).length;
  const totalRequired = requiredTodos.length + requiredHabits.length;
  const doneRequired = requiredTodos.filter((todo) => todo.completed).length + completeHabits;
  const progress = totalRequired ? Math.round((doneRequired / totalRequired) * 100) : 0;
  const gateLocked = gateConfig.enabled && timeActive && gateSummary.pendingCount > 0;
  const gateTitle = !gateConfig.enabled ? "集中ルールはオフです" : !timeActive ? "この時間帯は制限を休止しています" : gateLocked ? "他のアプリを制限中です" : "今日の必須項目を完了しました";
  const activeRuleNames = activeRules.map((rule) => rule.label).join("・");
  const gateDescription = !gateConfig.enabled ? "設定から集中ルールをオンにすると、選択アプリを制限できます。" : !timeActive ? "次の設定済み時間帯になると、未完了の必須項目に対して制限を開始します。" : gateLocked ? `${activeRuleNames}：${gateSummary.message}` : activeRules.length ? `${activeRuleNames}の解除条件を完了しました。` : "選択したアプリへのアクセスは解除されています。";
  const greeting = new Date().getHours() < 12 ? "おはようございます" : new Date().getHours() < 18 ? "今日の必須項目を進めましょう" : "一日をやさしく締めくくりましょう";

  if (!isReady) return <ScreenContainer><LoadingScreen /></ScreenContainer>;

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <FlatList
        data={[]}
        renderItem={() => null}
        keyExtractor={() => "today"}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={<>
          <View style={styles.topline}><View><Text style={styles.date}>今日</Text><Text style={styles.greeting}>{greeting}</Text></View><IconButton icon="add" label="Todoを追加" onPress={() => setTaskFormOpen(true)} variant="filled" /></View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/settings")} activeOpacity={0.82} style={[styles.gateCard, gateLocked ? styles.gateCardLocked : styles.gateCardOpen]}>
            <View style={styles.gateTop}><View style={[styles.gateIcon, gateLocked ? styles.gateIconLocked : styles.gateIconOpen]}><MaterialIcons name={gateLocked ? "lock" : "lock-open"} size={21} color={gateLocked ? COLORS.warning : COLORS.success} /></View><View style={styles.gateCopy}><Text style={[styles.gateEyebrow, gateLocked ? styles.gateEyebrowLocked : styles.gateEyebrowOpen]}>アプリ制限</Text><Text style={styles.gateTitle}>{gateTitle}</Text></View><MaterialIcons name="chevron-right" size={22} color={gateLocked ? "#E5B75D" : "#7C9B8F"} /></View>
            <Text style={styles.gateDescription}>{gateDescription}</Text>
            <View style={styles.gateFooter}><View style={styles.gateProgressTrack}><View style={[styles.gateProgressFill, { width: `${progress}%` }]} /></View><Text style={styles.gateProgressText}>{doneRequired}/{totalRequired} 完了</Text></View>
          </TouchableOpacity>
          <View style={styles.overviewCard}><View><Text style={styles.overviewLabel}>必須項目の進捗</Text><Text style={styles.overviewValue}>{progress}%</Text><Text style={styles.overviewDetail}>Todo {requiredTodos.filter((todo) => todo.completed).length}/{requiredTodos.length} ・ 習慣 {completeHabits}/{requiredHabits.length}</Text></View><View style={styles.progressCircle}><Text style={styles.progressCircleText}>{gateSummary.pendingCount}</Text><Text style={styles.progressCircleSuffix}>残り</Text></View></View>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>必須Todo</Text><TouchableOpacity onPress={() => router.push("/(tabs)/todos")}><Text style={styles.linkText}>すべて見る</Text></TouchableOpacity></View>
          {openTodos.length ? <View style={styles.listPanel}>{openTodos.slice(0, 3).map((todo) => <View key={todo.id} style={styles.taskRow}><TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: false }} onPress={() => { safeHaptic("success"); toggleTodo(todo.id); }} style={styles.taskCheck} /><TouchableOpacity style={styles.taskCopy} onPress={() => router.push("/(tabs)/todos")}><Text style={styles.taskTitle} numberOfLines={2}>{todo.title}</Text><Text style={styles.taskMeta}>{todo.dueDate ? `${todo.dueDate.replace(/-/g, "/")} まで` : "期限なし"}</Text></TouchableOpacity><MaterialIcons name="chevron-right" size={21} color={COLORS.muted} /></View>)}</View> : <TouchableOpacity onPress={() => setTaskFormOpen(true)} activeOpacity={0.8} style={styles.emptyAction}><MaterialIcons name="add-task" size={22} color={COLORS.forest} /><View><Text style={styles.emptyActionTitle}>必須Todoは完了しました</Text><Text style={styles.emptyActionText}>次の行動を追加することもできます。</Text></View></TouchableOpacity>}
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>必須習慣</Text><TouchableOpacity onPress={() => router.push("/(tabs)/habits")}><Text style={styles.linkText}>記録する</Text></TouchableOpacity></View>
          {requiredHabits.length ? <View style={styles.listPanel}>{requiredHabits.slice(0, 4).map((habit) => { const done = isHabitCompleteOn(habit, today); return <TouchableOpacity key={habit.id} accessibilityRole="checkbox" accessibilityState={{ checked: done }} onPress={() => { safeHaptic(done ? "light" : "success"); toggleHabit(habit.id); }} activeOpacity={0.74} style={styles.habitRow}><View style={[styles.habitCheck, done && { backgroundColor: habit.color, borderColor: habit.color }]}>{done ? <MaterialIcons name="check" size={16} color={COLORS.white} /> : null}</View><View style={[styles.habitColor, { backgroundColor: habit.color }]} /><Text style={[styles.habitName, done && styles.habitNameDone]} numberOfLines={1}>{habit.title}</Text><Text style={styles.habitStatus}>{done ? "完了" : "未完了"}</Text></TouchableOpacity>; })}</View> : <TouchableOpacity onPress={() => router.push("/(tabs)/habits")} activeOpacity={0.8} style={styles.emptyAction}><MaterialIcons name="repeat" size={22} color={COLORS.forest} /><View><Text style={styles.emptyActionTitle}>必須習慣を登録する</Text><Text style={styles.emptyActionText}>登録した習慣はアプリ制限の解除条件にできます。</Text></View></TouchableOpacity>}
        </>}
      />
      <TaskForm visible={taskFormOpen} onClose={() => setTaskFormOpen(false)} onSave={addTodo} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 16, paddingBottom: 28, flexGrow: 1 }, topline: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }, date: { color: COLORS.forest, fontSize: 13, fontWeight: "800", letterSpacing: 0.4 }, greeting: { color: COLORS.text, fontSize: 24, lineHeight: 31, fontWeight: "800", letterSpacing: -0.4, marginTop: 2 }, gateCard: { borderRadius: 23, padding: 18, marginBottom: 14, borderWidth: 1 }, gateCardLocked: { backgroundColor: "#213B33", borderColor: "#365E51" }, gateCardOpen: { backgroundColor: "#E9F4EE", borderColor: "#CAE1D4" }, gateTop: { flexDirection: "row", alignItems: "center" }, gateIcon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", marginRight: 10 }, gateIconLocked: { backgroundColor: "#4E4834" }, gateIconOpen: { backgroundColor: "#D6EDE0" }, gateCopy: { flex: 1 }, gateEyebrow: { fontSize: 12, fontWeight: "800" }, gateEyebrowLocked: { color: "#E5B75D" }, gateEyebrowOpen: { color: COLORS.success }, gateTitle: { color: COLORS.white, fontSize: 17, lineHeight: 22, fontWeight: "800", marginTop: 2 }, gateDescription: { color: "#D7E7E0", fontSize: 12, lineHeight: 18, marginTop: 13 }, gateFooter: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 }, gateProgressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.18)", overflow: "hidden" }, gateProgressFill: { height: "100%", borderRadius: 3, backgroundColor: "#7EC7A3" }, gateProgressText: { color: "#D8E8E1", fontSize: 11, fontWeight: "800" }, overviewCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: COLORS.forest, borderRadius: 23, padding: 20, marginBottom: 23 }, overviewLabel: { color: "#CFE0D8", fontSize: 13, fontWeight: "700" }, overviewValue: { color: COLORS.white, fontSize: 34, lineHeight: 42, fontWeight: "800", letterSpacing: -1, marginTop: 2 }, overviewDetail: { color: "#D6E6DE", fontSize: 12, lineHeight: 18, marginTop: 2 }, progressCircle: { width: 62, height: 62, alignItems: "center", justifyContent: "center", borderRadius: 31, borderWidth: 5, borderColor: "#78AFA0" }, progressCircleText: { color: COLORS.white, fontSize: 19, fontWeight: "800" }, progressCircleSuffix: { color: "#D6E6DE", fontSize: 10, fontWeight: "700", marginTop: -3 }, sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }, sectionTitle: { color: COLORS.text, fontSize: 18, lineHeight: 24, fontWeight: "800" }, linkText: { color: COLORS.forest, fontSize: 13, fontWeight: "800" }, listPanel: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, marginBottom: 22 }, taskRow: { flexDirection: "row", alignItems: "center", minHeight: 62, borderBottomColor: "#EEF2EF", borderBottomWidth: 1 }, taskCheck: { width: 28, height: 28, borderRadius: 10, borderColor: "#AFC0B7", borderWidth: 1.5, marginRight: 12 }, taskCopy: { flex: 1, minWidth: 0 }, taskTitle: { color: COLORS.text, fontSize: 15, lineHeight: 20, fontWeight: "800" }, taskMeta: { color: COLORS.muted, fontSize: 11, marginTop: 3 }, habitRow: { flexDirection: "row", alignItems: "center", minHeight: 51, borderBottomColor: "#EEF2EF", borderBottomWidth: 1 }, habitCheck: { width: 25, height: 25, alignItems: "center", justifyContent: "center", borderRadius: 9, borderColor: "#B8C7BF", borderWidth: 1.3, marginRight: 10 }, habitColor: { width: 8, height: 8, borderRadius: 4, marginRight: 9 }, habitName: { color: COLORS.text, flex: 1, fontSize: 15, fontWeight: "700" }, habitNameDone: { color: COLORS.muted, textDecorationLine: "line-through" }, habitStatus: { color: COLORS.muted, fontSize: 11, fontWeight: "700" }, emptyAction: { flexDirection: "row", alignItems: "center", backgroundColor: "#E8F0EC", borderRadius: 18, padding: 15, gap: 12, marginBottom: 22 }, emptyActionTitle: { color: COLORS.forest, fontSize: 15, fontWeight: "800" }, emptyActionText: { color: "#45675C", fontSize: 12, lineHeight: 17, marginTop: 2 },
});
