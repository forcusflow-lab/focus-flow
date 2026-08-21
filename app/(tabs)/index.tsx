import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from "react-native";

import { TaskForm } from "@/components/focus-flow/task-form";
import { ScaledText as Text } from "@/components/focus-flow/scaled-text";
import { COLORS, IconButton, LoadingScreen, safeHaptic } from "@/components/focus-flow/ui";
import { ScreenContainer } from "@/components/screen-container";
import { isEnglish } from "@/lib/focus-flow/i18n";
import { useFocusFlow } from "@/lib/focus-flow/provider";
import type { Habit, Todo } from "@/lib/focus-flow/types";
import { dayKey, getGateRuleSummaries, getGateSummary, isGateTimeActive, isHabitCompleteOn } from "@/lib/focus-flow/utils";

type HomeListItem =
  | { type: "heading"; id: string; title: string; detail: string }
  | { type: "todo"; id: string; todo: Todo; required: boolean; position: "single" | "first" | "middle" | "last" }
  | { type: "habit"; id: string; habit: Habit; required: boolean; position: "single" | "first" | "middle" | "last" };

function rowPositions<T>(items: T[], toItem: (item: T, position: "single" | "first" | "middle" | "last") => HomeListItem) {
  return items.map((item, index) => toItem(item, items.length === 1 ? "single" : index === 0 ? "first" : index === items.length - 1 ? "last" : "middle"));
}

export default function TodayScreen() {
  const router = useRouter();
  const { todos, habits, memos, focusSessions, gateConfig, displaySettings, isReady, toggleTodo, toggleHabit, addTodo } = useFocusFlow();
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [newTaskDefaultRequired, setNewTaskDefaultRequired] = useState(false);
  const english = isEnglish(displaySettings);
  const today = dayKey();
  const t = (ja: string, en: string) => english ? en : ja;
  const gateSummary = useMemo(() => getGateSummary({ todos, habits, memos, focusSessions, gateConfig, displaySettings }, new Date(), english ? "en" : "ja"), [todos, habits, memos, focusSessions, gateConfig, displaySettings, english]);
  const activeRules = useMemo(() => getGateRuleSummaries({ todos, habits, memos, focusSessions, gateConfig, displaySettings }, new Date(), english ? "en" : "ja").filter((rule) => rule.isActive), [todos, habits, memos, focusSessions, gateConfig, displaySettings, english]);
  const timeActive = isGateTimeActive(gateConfig);
  const requiredTodoIds = new Set(activeRules.flatMap((rule) => rule.requiredTodoIds));
  const requiredHabitIds = new Set(activeRules.flatMap((rule) => rule.requiredHabitIds));
  const requiredTodos = todos.filter((todo) => requiredTodoIds.has(todo.id) && !todo.completed);
  const requiredHabits = habits.filter((habit) => requiredHabitIds.has(habit.id) && !isHabitCompleteOn(habit, today));
  const regularTodos = todos.filter((todo) => !requiredTodoIds.has(todo.id) && !todo.completed);
  const regularHabits = habits.filter((habit) => !requiredHabitIds.has(habit.id) && !isHabitCompleteOn(habit, today));
  const totalRequired = activeRules.flatMap((rule) => [...rule.requiredTodoIds, ...rule.requiredHabitIds]).length;
  const pendingRequired = requiredTodos.length + requiredHabits.length;
  const doneRequired = Math.max(totalRequired - pendingRequired, 0);
  const progress = totalRequired ? Math.round((doneRequired / totalRequired) * 100) : 0;
  const gateLocked = gateConfig.enabled && timeActive && gateSummary.pendingCount > 0;
  const greeting = new Date().getHours() < 12 ? t("おはようございます", "Good morning") : new Date().getHours() < 18 ? t("今日のことを進めましょう", "Make progress today") : t("一日をやさしく締めくくりましょう", "Close your day with intention");
  const gateTitle = !gateConfig.enabled ? t("集中制限はオフです", "App limits are off") : !timeActive ? t("この時間帯は制限を休止しています", "App limits are paused outside scheduled hours") : gateLocked ? t("選択したアプリを制限中です", "Selected apps are limited") : t("今日の必須項目を完了しました", "Today's must-dos are complete");
  const gateDescription = !gateConfig.enabled ? t("設定からオンにすると、選択アプリを必須項目の完了まで制限できます。", "Turn on App limits in Settings to limit selected apps until must-dos are complete.") : !timeActive ? t("次の設定済み時間帯になると制限を再開します。", "App limits resume during your next scheduled window.") : gateLocked ? t("残りの必須項目を完了すると、選択したアプリを使えるようになります。", "Complete the remaining must-dos to use your selected apps.") : t("解除条件は完了しています。", "Your unlock conditions are complete.");
  const listItems = useMemo<HomeListItem[]>(() => {
    const result: HomeListItem[] = [];
    const required = [...rowPositions(requiredTodos, (todo, position) => ({ type: "todo", id: `required-todo-${todo.id}`, todo, required: true, position })), ...rowPositions(requiredHabits, (habit, position) => ({ type: "habit", id: `required-habit-${habit.id}`, habit, required: true, position }))];
    const regular = [...rowPositions(regularTodos, (todo, position) => ({ type: "todo", id: `regular-todo-${todo.id}`, todo, required: false, position })), ...rowPositions(regularHabits, (habit, position) => ({ type: "habit", id: `regular-habit-${habit.id}`, habit, required: false, position }))];
    if (required.length) result.push({ type: "heading", id: "required-heading", title: t("必須項目", "Must-dos"), detail: t("完了するとアプリ制限の解除条件が進みます", "Complete these to move your app-unlock condition forward") }, ...required);
    if (regular.length) result.push({ type: "heading", id: "regular-heading", title: t("そのほかの今日の項目", "Other items for today"), detail: t("通常のTodoと習慣", "Regular tasks and habits") }, ...regular);
    return result;
  }, [regularHabits, regularTodos, requiredHabits, requiredTodos, english]);

  const openTaskForm = (defaultRequired = false) => { setNewTaskDefaultRequired(defaultRequired); setTaskFormOpen(true); };
  const explainTimedResult = (reason: string | undefined, destination: "/(tabs)/todos" | "/(tabs)/habits") => {
    if (reason === "TIMER_STARTED") Alert.alert(t("計測を開始しました", "Timer started"), t("設定した時間が経過すると、自動で完了になります。", "This item completes automatically when its scheduled time has elapsed."), [{ text: t("確認", "OK") }]);
    if (reason === "TIME_NOT_READY") Alert.alert(t("設定時間を計測中です", "Time is still running"), t("設定時間の経過を待つか、一覧画面から1回限りのストア商品で早期完了できます。", "Wait for the timer, or finish early from the item list with the one-time store product."), [{ text: t("あとで", "Not now"), style: "cancel" }, { text: t("項目を開く", "Open item"), onPress: () => router.push(destination) }]);
  };
  const handleTodoToggle = (id: string) => { const result = toggleTodo(id); safeHaptic(result.ok ? "success" : "light"); explainTimedResult(result.reason, "/(tabs)/todos"); };
  const handleHabitToggle = (id: string) => { const result = toggleHabit(id); safeHaptic(result.ok ? "success" : "light"); explainTimedResult(result.reason, "/(tabs)/habits"); };

  if (!isReady) return <ScreenContainer><LoadingScreen /></ScreenContainer>;

  return <ScreenContainer className="px-5" containerClassName="bg-background">
    <FlatList
      data={listItems}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
      ListHeaderComponent={<>
        <View style={styles.topline}><View><Text style={styles.date}>{t("今日", "TODAY")}</Text><Text style={styles.greeting}>{greeting}</Text></View><IconButton icon="add" label={t("Todoを追加", "Add task")} onPress={() => openTaskForm()} variant="filled" /></View>
        {!todos.length && !habits.length ? <View style={styles.setupCard}><View style={styles.setupIcon}><MaterialIcons name="flag" size={20} color={COLORS.forest} /></View><View style={styles.setupCopy}><Text style={styles.setupTitle}>{t("まずは必須項目を1つだけ", "Start with one must-do")}</Text><Text style={styles.setupText}>{t("完了まで制限したいTodoや習慣を登録すると、集中制限を始められます。", "Add a task or habit you want to finish before your selected apps unlock.")}</Text></View><TouchableOpacity onPress={() => openTaskForm(true)} style={styles.setupButton}><Text style={styles.setupButtonText}>{t("追加", "Add")}</Text></TouchableOpacity></View> : null}
        <TouchableOpacity onPress={() => router.push("/(tabs)/settings")} activeOpacity={0.82} style={[styles.gateCard, gateLocked ? styles.gateCardLocked : styles.gateCardOpen]}><View style={styles.gateTop}><View style={[styles.gateIcon, gateLocked ? styles.gateIconLocked : styles.gateIconOpen]}><MaterialIcons name={gateLocked ? "lock" : "lock-open"} size={21} color={gateLocked ? COLORS.warning : COLORS.success} /></View><View style={styles.gateCopy}><Text style={[styles.gateEyebrow, gateLocked ? styles.gateEyebrowLocked : styles.gateEyebrowOpen]}>{t("アプリ制限", "APP LIMITS")}</Text><Text style={[styles.gateTitle, gateLocked ? styles.gateTextLocked : styles.gateTextOpen]}>{gateTitle}</Text></View><MaterialIcons name="chevron-right" size={22} color={gateLocked ? "#8D6318" : "#23675D"} /></View><Text style={[styles.gateDescription, gateLocked ? styles.gateTextLocked : styles.gateTextOpen]}>{gateDescription}</Text></TouchableOpacity>
        <View style={styles.progressCard}><View style={styles.progressCopy}><Text style={styles.progressLabel}>{t("必須項目の進捗", "MUST-DO PROGRESS")}</Text><Text style={styles.progressTitle}>{totalRequired ? t(`残り ${pendingRequired}件`, `${pendingRequired} remaining`) : t("必須項目を追加しましょう", "Add a must-do to begin")}</Text><Text style={styles.progressDetail}>{totalRequired ? t(`${doneRequired}/${totalRequired}件を完了`, `${doneRequired}/${totalRequired} complete`) : t("集中制限の解除条件になります", "They become your App limits unlock condition")}</Text></View><Text style={styles.progressPercent}>{totalRequired ? `${progress}%` : "—"}</Text><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View></View>
      </>}
      ListEmptyComponent={todos.length || habits.length ? <View style={styles.emptyPanel}><MaterialIcons name="done-all" size={22} color={COLORS.forest} /><View><Text style={styles.emptyTitle}>{t("今日の未完了項目はありません", "No open items for today")}</Text><Text style={styles.emptyText}>{t("新しいTodoを追加するか、明日の項目を整えましょう。", "Add a new task or plan your next action.")}</Text></View></View> : null}
      renderItem={({ item }) => item.type === "heading" ? <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{item.title}</Text><Text style={styles.sectionHint}>{item.detail}</Text></View> : item.type === "todo" ? <HomeTodoRow todo={item.todo} required={item.required} position={item.position} english={english} onToggle={() => handleTodoToggle(item.todo.id)} onOpen={() => router.push("/(tabs)/todos")} /> : <HomeHabitRow habit={item.habit} required={item.required} position={item.position} english={english} onToggle={() => handleHabitToggle(item.habit.id)} onOpen={() => router.push("/(tabs)/habits")} />}
    />
    <TaskForm visible={taskFormOpen} defaultRequired={newTaskDefaultRequired} onClose={() => { setTaskFormOpen(false); setNewTaskDefaultRequired(false); }} onSave={addTodo} />
  </ScreenContainer>;
}

function HomeTodoRow({ todo, required, position, english, onToggle, onOpen }: { todo: Todo; required: boolean; position: "single" | "first" | "middle" | "last"; english: boolean; onToggle: () => void; onOpen: () => void }) {
  return <View style={[styles.itemRow, styles[position]]}><TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: false }} accessibilityLabel={english ? `Complete ${todo.title}` : `「${todo.title}」を完了にする`} onPress={onToggle} style={styles.itemCheck} /><TouchableOpacity onPress={onOpen} style={styles.itemCopy}><View style={styles.itemTitleRow}><Text style={styles.itemTitle} numberOfLines={1}>{todo.title}</Text><Badge required={required} english={english} /></View><Text style={styles.itemDetail} numberOfLines={1}>{todo.dueDate ? english ? `Due ${todo.dueDate.replace(/-/g, "/")}` : `${todo.dueDate.replace(/-/g, "/")}まで` : english ? "Todo" : "Todo"}</Text></TouchableOpacity><MaterialIcons name="chevron-right" size={20} color={COLORS.muted} /></View>;
}

function HomeHabitRow({ habit, required, position, english, onToggle, onOpen }: { habit: Habit; required: boolean; position: "single" | "first" | "middle" | "last"; english: boolean; onToggle: () => void; onOpen: () => void }) {
  return <View style={[styles.itemRow, styles[position]]}><TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: false }} accessibilityLabel={english ? `Record ${habit.title}` : `「${habit.title}」を今日の習慣として記録`} onPress={onToggle} style={[styles.itemCheck, { borderColor: habit.color }]} /><TouchableOpacity onPress={onOpen} style={styles.itemCopy}><View style={styles.itemTitleRow}><View style={[styles.habitDot, { backgroundColor: habit.color }]} /><Text style={styles.itemTitle} numberOfLines={1}>{habit.title}</Text><Badge required={required} english={english} /></View><Text style={styles.itemDetail}>{english ? "Habit" : "習慣"}</Text></TouchableOpacity><MaterialIcons name="chevron-right" size={20} color={COLORS.muted} /></View>;
}

function Badge({ required, english }: { required: boolean; english: boolean }) { return <Text style={[styles.badge, required ? styles.requiredBadge : styles.regularBadge]}>{required ? english ? "Must" : "必須" : english ? "Regular" : "通常"}</Text>; }

const styles = StyleSheet.create({
  content: { paddingTop: 16, paddingBottom: 24, flexGrow: 1 },
  topline: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  date: { color: COLORS.forest, fontSize: 13, fontWeight: "800", letterSpacing: 0.4 },
  greeting: { color: COLORS.text, fontSize: 24, lineHeight: 31, fontWeight: "800", letterSpacing: -0.4, marginTop: 2 },
  setupCard: { minHeight: 86, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(255,255,255,0.88)", borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, padding: 14, marginBottom: 12 },
  setupIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: "#E2F0EF" },
  setupCopy: { flex: 1, minWidth: 0 },
  setupTitle: { color: COLORS.text, fontSize: 15, lineHeight: 21, fontWeight: "800" },
  setupText: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 2 },
  setupButton: { minHeight: 35, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: COLORS.forest, paddingHorizontal: 11 },
  setupButtonText: { color: COLORS.white, fontSize: 12, fontWeight: "800" },
  gateCard: { borderRadius: 22, padding: 16, marginBottom: 12, borderWidth: 1 },
  gateCardLocked: { backgroundColor: "#FFF7E8", borderColor: "#F0C678" },
  gateCardOpen: { backgroundColor: "#EAF6F3", borderColor: "#B7DED3" },
  gateTop: { flexDirection: "row", alignItems: "center" },
  gateIcon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", marginRight: 10 },
  gateIconLocked: { backgroundColor: "#FFF0CC" }, gateIconOpen: { backgroundColor: "#D6EEE7" }, gateCopy: { flex: 1, minWidth: 0 },
  gateEyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 0.45 }, gateEyebrowLocked: { color: "#95620C" }, gateEyebrowOpen: { color: "#16725C" },
  gateTitle: { fontSize: 16, lineHeight: 22, fontWeight: "800", marginTop: 2 }, gateDescription: { fontSize: 12, lineHeight: 18, marginTop: 11 }, gateTextLocked: { color: "#5B3B08" }, gateTextOpen: { color: "#143F38" },
  progressCard: { position: "relative", overflow: "hidden", backgroundColor: COLORS.forest, borderRadius: 20, padding: 16, marginBottom: 18 },
  progressCopy: { paddingRight: 60 }, progressLabel: { color: "#D4EFE8", fontSize: 11, fontWeight: "900", letterSpacing: 0.4 }, progressTitle: { color: COLORS.white, fontSize: 21, lineHeight: 28, fontWeight: "900", marginTop: 2 }, progressDetail: { color: "#D4EFE8", fontSize: 12, lineHeight: 17, marginTop: 1 }, progressPercent: { position: "absolute", right: 16, top: 20, color: COLORS.white, fontSize: 22, fontWeight: "900" }, progressTrack: { height: 7, borderRadius: 4, overflow: "hidden", backgroundColor: "#4B9583", marginTop: 15 }, progressFill: { height: "100%", borderRadius: 4, backgroundColor: "#B3E7D9" },
  sectionHeader: { marginTop: 3, marginBottom: 8 }, sectionTitle: { color: COLORS.text, fontSize: 18, lineHeight: 24, fontWeight: "900" }, sectionHint: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 1 },
  itemRow: { minHeight: 66, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.92)", paddingHorizontal: 14, borderColor: COLORS.border, borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1 },
  single: { borderTopWidth: 1, borderRadius: 18 }, first: { borderTopWidth: 1, borderTopLeftRadius: 18, borderTopRightRadius: 18 }, middle: {}, last: { borderBottomLeftRadius: 18, borderBottomRightRadius: 18, marginBottom: 18 },
  itemCheck: { width: 27, height: 27, borderRadius: 9, borderWidth: 1.5, borderColor: "#9CB7B0", marginRight: 11 }, itemCopy: { flex: 1, minWidth: 0 }, itemTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 }, itemTitle: { color: COLORS.text, flexShrink: 1, fontSize: 15, lineHeight: 21, fontWeight: "800" }, itemDetail: { color: COLORS.muted, fontSize: 11, lineHeight: 15, marginTop: 2 }, habitDot: { width: 8, height: 8, borderRadius: 4 }, badge: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, fontSize: 9, fontWeight: "900", overflow: "hidden" }, requiredBadge: { color: "#1B6C58", backgroundColor: "#DFF0E9" }, regularBadge: { color: "#4E6983", backgroundColor: "#E7EFF8" },
  emptyPanel: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 18, backgroundColor: "#E8F3F0", padding: 15, marginTop: 4 }, emptyTitle: { color: COLORS.forest, fontSize: 15, fontWeight: "800" }, emptyText: { color: "#315E55", fontSize: 12, lineHeight: 17, marginTop: 2 },
});
