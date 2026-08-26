import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from "react-native";

import { HabitForm } from "@/components/focus-flow/habit-form";
import { TaskForm } from "@/components/focus-flow/task-form";
import { ScaledText as Text } from "@/components/focus-flow/scaled-text";
import { COLORS, IconButton, LoadingScreen, Pill, safeHaptic, useFocusPalette } from "@/components/focus-flow/ui";
import { ScreenContainer } from "@/components/screen-container";
import { isEnglish } from "@/lib/focus-flow/i18n";
import { useFocusFlow } from "@/lib/focus-flow/provider";
import type { Habit, Todo } from "@/lib/focus-flow/types";
import { dayKey, formatJapaneseDate, getGateRuleSummaries, getGateSummary, getRequiredWindowMode, getTodoDueStatus, isHabitCompleteOn } from "@/lib/focus-flow/utils";

type HomeListItem =
  | { type: "heading"; id: string; title: string; detail: string; required: boolean }
  | { type: "todo"; id: string; todo: Todo; required: boolean; windowLabel?: string }
  | { type: "habit"; id: string; habit: Habit; required: boolean; windowLabel?: string };

export default function TodayScreen() {
  const router = useRouter();
  const { todos, habits, memos, focusSessions, gateConfig, displaySettings, isReady, toggleTodo, toggleHabit, addTodo, updateTodo, updateHabit } = useFocusFlow();
  const palette = useFocusPalette();
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [newTaskDefaultRequired, setNewTaskDefaultRequired] = useState(false);
  const [openedTodo, setOpenedTodo] = useState<Todo | undefined>();
  const [openedHabit, setOpenedHabit] = useState<Habit | undefined>();
  const english = isEnglish(displaySettings);
  const today = dayKey();
  const t = useCallback((ja: string, en: string) => english ? en : ja, [english]);
  const gateSummary = useMemo(() => getGateSummary({ todos, habits, memos, focusSessions, gateConfig, displaySettings }, new Date(), english ? "en" : "ja"), [todos, habits, memos, focusSessions, gateConfig, displaySettings, english]);
  const activeRules = useMemo(() => getGateRuleSummaries({ todos, habits, memos, focusSessions, gateConfig, displaySettings }, new Date(), english ? "en" : "ja").filter((rule) => rule.isActive), [todos, habits, memos, focusSessions, gateConfig, displaySettings, english]);
  const requiredTodoIds = new Set(activeRules.flatMap((rule) => rule.requiredTodoIds));
  const requiredHabitIds = new Set(activeRules.flatMap((rule) => rule.requiredHabitIds));
  const requiredTodos = todos.filter((todo) => requiredTodoIds.has(todo.id) && !todo.completed);
  const requiredHabits = habits.filter((habit) => requiredHabitIds.has(habit.id) && !isHabitCompleteOn(habit, today));
  const waitingTodoIds = new Set(todos.filter((todo) => getRequiredWindowMode(todo) === "scheduled" && !requiredTodoIds.has(todo.id) && !todo.completed).map((todo) => todo.id));
  const waitingHabitIds = new Set(habits.filter((habit) => getRequiredWindowMode(habit) === "scheduled" && !requiredHabitIds.has(habit.id) && !isHabitCompleteOn(habit, today)).map((habit) => habit.id));
  const waitingTodos = todos.filter((todo) => waitingTodoIds.has(todo.id));
  const waitingHabits = habits.filter((habit) => waitingHabitIds.has(habit.id));
  const regularTodos = todos.filter((todo) => !requiredTodoIds.has(todo.id) && !waitingTodoIds.has(todo.id) && !todo.completed);
  const regularHabits = habits.filter((habit) => !requiredHabitIds.has(habit.id) && !waitingHabitIds.has(habit.id) && !isHabitCompleteOn(habit, today));
  const activeScheduledRule = activeRules.find((rule) => Boolean(rule.schedule));
  const timeActive = Boolean(activeScheduledRule) || activeRules.some((rule) => rule.id === "always");
  const totalRequired = activeRules.flatMap((rule) => [...rule.requiredTodoIds, ...rule.requiredHabitIds]).length;
  const pendingRequired = requiredTodos.length + requiredHabits.length;
  const doneRequired = Math.max(totalRequired - pendingRequired, 0);
  const progress = totalRequired ? Math.round((doneRequired / totalRequired) * 100) : 0;
  const gateLocked = gateConfig.enabled && timeActive && gateSummary.pendingCount > 0;
  const greeting = t("今日の予定", "Today");
  const gateTitle = !gateConfig.enabled ? t("集中制限はオフです", "App limits are off") : !timeActive ? t("次の実行時間帯まで制限は休止中です", "App limits are paused until the next time window") : gateLocked ? t("選択したアプリを制限中です", "Selected apps are limited") : t("今の解除条件を完了しました", "Current unlock conditions are complete");
  const gateDescription = !gateConfig.enabled ? t("設定からオンにすると、選択アプリを必須項目の完了まで制限できます。", "Turn on App limits in Settings to limit selected apps until must-dos are complete.") : !timeActive ? t("「この後」にある項目は、選んだ時間帯になると必須になります。", "Items in Up next become required when their selected time begins.") : gateLocked ? t("残りの必須項目を完了すると、選択したアプリを使えるようになります。", "Complete the remaining must-dos to use your selected apps.") : t("この時間帯の解除条件は完了しています。", "The unlock conditions for this time window are complete.");
  const getWindowLabel = useCallback((item: Todo | Habit) => gateConfig.schedules.filter((schedule) => item.requiredScheduleIds?.includes(schedule.id)).map((schedule) => `${schedule.label} ${schedule.startTime}–${schedule.endTime}`).join(" · "), [gateConfig.schedules]);
  const listItems = useMemo<HomeListItem[]>(() => {
    const result: HomeListItem[] = [];
    const required = [
      ...requiredTodos.map((todo) => ({ type: "todo" as const, id: `required-todo-${todo.id}`, todo, required: true })),
      ...requiredHabits.map((habit) => ({ type: "habit" as const, id: `required-habit-${habit.id}`, habit, required: true })),
    ];
    const waiting = [
      ...waitingTodos.map((todo) => ({ type: "todo" as const, id: `waiting-todo-${todo.id}`, todo, required: false, windowLabel: getWindowLabel(todo) })),
      ...waitingHabits.map((habit) => ({ type: "habit" as const, id: `waiting-habit-${habit.id}`, habit, required: false, windowLabel: getWindowLabel(habit) })),
    ];
    const regular = [
      ...regularTodos.map((todo) => ({ type: "todo" as const, id: `regular-todo-${todo.id}`, todo, required: false })),
      ...regularHabits.map((habit) => ({ type: "habit" as const, id: `regular-habit-${habit.id}`, habit, required: false })),
    ];
    if (required.length) result.push({ type: "heading", id: "required-heading", title: t("今やる", "Do now"), detail: t("この時間帯の解除条件です", "These unlock your selected apps now"), required: true }, ...required);
    if (waiting.length) result.push({ type: "heading", id: "waiting-heading", title: t("この後", "Up next"), detail: t("選んだ時間帯になると必須になります", "These become must-dos at their selected time"), required: false }, ...waiting);
    if (regular.length) result.push({ type: "heading", id: "today-heading", title: t("今日のリスト", "Today’s list"), detail: t("必要に応じて完了にできます", "Mark items done when you’re ready"), required: false }, ...regular);
    return result;
  }, [getWindowLabel, regularHabits, regularTodos, requiredHabits, requiredTodos, t, waitingHabits, waitingTodos]);

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
        {!todos.length && !habits.length ? <View style={[styles.setupCard, { backgroundColor: palette.surface, borderColor: palette.border }]}><View style={[styles.setupIcon, { backgroundColor: palette.primarySoft }]}><MaterialIcons name="flag" size={20} color={palette.primary} /></View><View style={styles.setupCopy}><Text style={styles.setupTitle}>{t("まずは必須項目を1つだけ", "Start with one must-do")}</Text><Text style={styles.setupText}>{t("完了まで制限したいTodoや習慣を登録すると、集中制限を始められます。", "Add a task or habit you want to finish before your selected apps unlock.")}</Text></View><TouchableOpacity onPress={() => openTaskForm(true)} style={[styles.setupButton, { backgroundColor: palette.primary }]}><Text style={styles.setupButtonText}>{t("追加", "Add")}</Text></TouchableOpacity></View> : null}
        <TouchableOpacity onPress={() => router.push("/(tabs)/settings")} activeOpacity={0.82} style={[styles.gateCard, { backgroundColor: gateLocked ? (palette.isDark ? "#4A3A20" : "#FFF7E8") : palette.primarySoft, borderColor: gateLocked ? (palette.isDark ? "#8E7136" : "#F0C678") : palette.border }]}><View style={styles.gateTop}><View style={[styles.gateIcon, { backgroundColor: gateLocked ? (palette.isDark ? "#624A20" : "#FFF0CC") : palette.elevated }]}><MaterialIcons name={gateLocked ? "lock" : "lock-open"} size={21} color={gateLocked ? COLORS.warning : palette.primary} /></View><View style={styles.gateCopy}><Text style={[styles.gateEyebrow, { color: gateLocked ? (palette.isDark ? "#F3D18A" : "#95620C") : palette.primary }]}>{t("アプリ制限", "APP LIMITS")}</Text><Text style={[styles.gateTitle, { color: gateLocked ? (palette.isDark ? "#FFF1CF" : "#5B3B08") : palette.text }]}>{gateTitle}</Text></View><MaterialIcons name="chevron-right" size={22} color={gateLocked ? (palette.isDark ? "#F3D18A" : "#8D6318") : palette.primary} /></View><Text numberOfLines={2} style={[styles.gateDescription, { color: gateLocked ? (palette.isDark ? "#FFF1CF" : "#5B3B08") : palette.text }]}>{gateDescription}</Text></TouchableOpacity>
        {totalRequired ? <View style={[styles.progressCard, { backgroundColor: palette.primary }]}><View style={styles.progressCopy}><Text style={styles.progressLabel}>{t("必須の進み具合", "MUST-DO PROGRESS")}</Text><Text style={styles.progressTitle}>{t(`残り ${pendingRequired}件`, `${pendingRequired} remaining`)}</Text><Text style={styles.progressDetail}>{t(`${doneRequired}/${totalRequired}件を完了`, `${doneRequired}/${totalRequired} complete`)}</Text></View><Text style={styles.progressPercent}>{progress}%</Text><View style={[styles.progressTrack, { backgroundColor: palette.isDark ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.32)" }]}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View></View> : null}
      </>}
      ListEmptyComponent={todos.length || habits.length ? <View style={[styles.emptyPanel, { backgroundColor: palette.elevated }]}><MaterialIcons name="done-all" size={22} color={palette.primary} /><View><Text style={styles.emptyTitle}>{t("今日の未完了項目はありません", "No open items for today")}</Text><Text style={styles.emptyText}>{t("新しいTodoを追加するか、明日の項目を整えましょう。", "Add a new task or plan your next action.")}</Text></View></View> : null}
      renderItem={({ item }) => item.type === "heading" ? <View style={[styles.sectionHeader, item.required && styles.requiredSectionHeader, item.required ? { backgroundColor: palette.primarySoft, borderColor: palette.border } : undefined]}><Text style={[styles.sectionTitle, item.required && styles.requiredSectionTitle]}>{item.title}</Text><Text style={[styles.sectionHint, item.required && styles.requiredSectionHint]}>{item.detail}</Text></View> : item.type === "todo" ? <HomeTodoCard todo={item.todo} required={item.required} windowLabel={item.windowLabel} english={english} onToggle={() => handleTodoToggle(item.todo.id)} onOpen={() => setOpenedTodo(item.todo)} /> : <HomeHabitCard habit={item.habit} required={item.required} windowLabel={item.windowLabel} english={english} onToggle={() => handleHabitToggle(item.habit.id)} onOpen={() => setOpenedHabit(item.habit)} />}
    />
    <TaskForm visible={taskFormOpen} defaultRequired={newTaskDefaultRequired} onClose={() => { setTaskFormOpen(false); setNewTaskDefaultRequired(false); }} onSave={addTodo} />
    <TaskForm visible={Boolean(openedTodo)} todo={openedTodo} onClose={() => setOpenedTodo(undefined)} onSave={(input) => openedTodo ? updateTodo(openedTodo.id, input) : { ok: false }} />
    <HabitForm visible={Boolean(openedHabit)} habit={openedHabit} onClose={() => setOpenedHabit(undefined)} onSave={(input) => openedHabit ? updateHabit(openedHabit.id, input) : { ok: false }} />
  </ScreenContainer>;
}

function HomeTodoCard({ todo, required, windowLabel, english, onToggle, onOpen }: { todo: Todo; required: boolean; windowLabel?: string; english: boolean; onToggle: () => void; onOpen: () => void }) {
  const palette = useFocusPalette();
  const dueStatus = todo.dueDate ? getTodoDueStatus(todo) : undefined;
  const due = todo.dueDate ? dueStatus === "overdue" ? english ? "Overdue" : "期限超過" : dueStatus === "today" ? english ? "Due today" : "今日が期限" : formatJapaneseDate(todo.dueDate, english ? "en" : "ja") : undefined;
  const priorityColor = todo.priority === "high" ? COLORS.error : todo.priority === "medium" ? COLORS.warning : COLORS.blue;
  return <View style={[styles.itemCard, { backgroundColor: required ? palette.primarySoft : palette.surface, borderColor: palette.border }]}><View style={[styles.itemRail, { backgroundColor: priorityColor }]} /><TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: false }} accessibilityLabel={english ? `Complete ${todo.title}` : `「${todo.title}」を完了にする`} onPress={(event) => { event.stopPropagation(); onToggle(); }} style={styles.itemCheckTouchTarget}><View style={[styles.itemCheck, { borderColor: palette.border }]} /></TouchableOpacity><TouchableOpacity onPress={onOpen} style={styles.itemCopy}><Text style={styles.itemTitle} numberOfLines={2}>{todo.title}</Text><View style={styles.meta}>{required ? <Pill label={english ? "Must-do" : "必須"} color={COLORS.forest} /> : null}{windowLabel ? <Text style={styles.windowMeta}>{english ? `From ${windowLabel}` : `${windowLabel}から`}</Text> : due ? <Text style={[styles.itemMeta, dueStatus === "overdue" && styles.overdue]}>{due}</Text> : <Text style={styles.itemMeta}>{english ? "Task" : "Todo"}</Text>}</View></TouchableOpacity><TouchableOpacity accessibilityLabel={english ? `Open ${todo.title}` : `「${todo.title}」をTodo一覧で開く`} onPress={onOpen} style={styles.openControl}><MaterialIcons name="chevron-right" size={21} color={palette.muted} /></TouchableOpacity></View>;
}

function HomeHabitCard({ habit, required, windowLabel, english, onToggle, onOpen }: { habit: Habit; required: boolean; windowLabel?: string; english: boolean; onToggle: () => void; onOpen: () => void }) {
  const palette = useFocusPalette();
  return <View style={[styles.itemCard, { backgroundColor: required ? palette.primarySoft : palette.surface, borderColor: palette.border }]}><View style={[styles.itemRail, { backgroundColor: habit.color }]} /><TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: false }} accessibilityLabel={english ? `Record ${habit.title}` : `「${habit.title}」を今日の習慣として記録`} onPress={(event) => { event.stopPropagation(); onToggle(); }} style={styles.itemCheckTouchTarget}><View style={[styles.itemCheck, { borderColor: habit.color }]} /></TouchableOpacity><TouchableOpacity onPress={onOpen} style={styles.itemCopy}><View style={styles.habitTitleRow}><View style={[styles.habitDot, { backgroundColor: habit.color }]} /><Text style={styles.itemTitle} numberOfLines={2}>{habit.title}</Text></View><View style={styles.meta}>{required ? <Pill label={english ? "Must-do" : "必須"} color={COLORS.forest} /> : null}<Text style={windowLabel ? styles.windowMeta : styles.itemMeta}>{windowLabel ? (english ? `From ${windowLabel}` : `${windowLabel}から`) : (english ? "Habit" : "習慣")}</Text></View></TouchableOpacity><TouchableOpacity accessibilityLabel={english ? `Open ${habit.title}` : `「${habit.title}」を習慣一覧で開く`} onPress={onOpen} style={styles.openControl}><MaterialIcons name="chevron-right" size={21} color={palette.muted} /></TouchableOpacity></View>;
}

const styles = StyleSheet.create({
  content: { paddingTop: 14, paddingBottom: 20, flexGrow: 1 },
  topline: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 13 },
  date: { color: COLORS.forest, fontSize: 13, fontWeight: "800", letterSpacing: 0.4 },
  greeting: { color: COLORS.text, fontSize: 24, lineHeight: 31, fontWeight: "800", letterSpacing: -0.4, marginTop: 2 },
  setupCard: { minHeight: 80, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(255,255,255,0.88)", borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, padding: 12, marginBottom: 10 },
  setupIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: "#E2F0EF" }, setupCopy: { flex: 1, minWidth: 0 }, setupTitle: { color: COLORS.text, fontSize: 15, lineHeight: 21, fontWeight: "800" }, setupText: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 2 }, setupButton: { minHeight: 35, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: COLORS.forest, paddingHorizontal: 11 }, setupButtonText: { color: COLORS.white, fontSize: 12, fontWeight: "800" },
  gateCard: { borderRadius: 18, padding: 13, marginBottom: 10, borderWidth: 1 }, gateCardLocked: { backgroundColor: "#FFF7E8", borderColor: "#F0C678" }, gateCardOpen: { backgroundColor: "#EAF6F3", borderColor: "#B7DED3" }, gateTop: { flexDirection: "row", alignItems: "center" }, gateIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 9 }, gateIconLocked: { backgroundColor: "#FFF0CC" }, gateIconOpen: { backgroundColor: "#D6EEE7" }, gateCopy: { flex: 1, minWidth: 0 }, gateEyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 0.45 }, gateEyebrowLocked: { color: "#95620C" }, gateEyebrowOpen: { color: "#16725C" }, gateTitle: { fontSize: 15, lineHeight: 20, fontWeight: "800", marginTop: 1 }, gateDescription: { fontSize: 12, lineHeight: 17, marginTop: 8 }, gateTextLocked: { color: "#5B3B08" }, gateTextOpen: { color: "#143F38" },
  progressCard: { position: "relative", overflow: "hidden", backgroundColor: COLORS.forest, borderRadius: 18, padding: 13, marginBottom: 14 }, progressCopy: { paddingRight: 56 }, progressLabel: { color: "#D4EFE8", fontSize: 10, fontWeight: "900", letterSpacing: 0.4 }, progressTitle: { color: COLORS.white, fontSize: 19, lineHeight: 25, fontWeight: "900", marginTop: 1 }, progressDetail: { color: "#D4EFE8", fontSize: 11, lineHeight: 16, marginTop: 1 }, progressPercent: { position: "absolute", right: 14, top: 17, color: COLORS.white, fontSize: 21, fontWeight: "900" }, progressTrack: { height: 6, borderRadius: 4, overflow: "hidden", backgroundColor: "#4B9583", marginTop: 11 }, progressFill: { height: "100%", borderRadius: 4, backgroundColor: "#B3E7D9" },
  sectionHeader: { marginTop: 3, marginBottom: 6 }, requiredSectionHeader: { borderRadius: 14, backgroundColor: "#EAF6F1", borderWidth: 1, borderColor: "#B9DDD1", paddingHorizontal: 12, paddingVertical: 8, marginTop: 2, marginBottom: 7 }, sectionTitle: { color: COLORS.text, fontSize: 16, lineHeight: 21, fontWeight: "900" }, requiredSectionTitle: { color: "#173F36" }, sectionHint: { color: COLORS.muted, fontSize: 11, lineHeight: 15, marginTop: 1 }, requiredSectionHint: { color: "#42675D" },
  itemCard: { position: "relative", minHeight: 68, flexDirection: "row", alignItems: "center", overflow: "hidden", backgroundColor: "rgba(255,255,255,0.92)", borderWidth: 1, borderColor: COLORS.border, borderRadius: 15, paddingVertical: 8, paddingLeft: 14, paddingRight: 4, marginBottom: 6 }, requiredItemCard: { backgroundColor: "#F4FBF7", borderColor: "#B9DDD1" }, itemRail: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 }, itemCheckTouchTarget: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginLeft: -8, marginRight: 2 }, itemCheck: { width: 28, height: 28, borderRadius: 6, borderWidth: 1.5, borderColor: "#AFC0B7" }, itemCopy: { flex: 1, minWidth: 0 }, habitTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 }, habitDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 }, itemTitle: { color: COLORS.text, fontSize: 15, lineHeight: 21, fontWeight: "800" }, meta: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 4 }, itemMeta: { color: COLORS.muted, fontSize: 11, lineHeight: 16, fontWeight: "700" }, windowMeta: { color: "#7A5A22", fontSize: 11, lineHeight: 16, fontWeight: "800" }, overdue: { color: COLORS.error }, openControl: { width: 34, height: 40, alignItems: "center", justifyContent: "center", marginLeft: 2 },
  emptyPanel: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 18, backgroundColor: "#E8F3F0", padding: 15, marginTop: 4 }, emptyTitle: { color: COLORS.forest, fontSize: 15, fontWeight: "800" }, emptyText: { color: "#315E55", fontSize: 12, lineHeight: 17, marginTop: 2 },
});
