import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, FlatList, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { TaskForm } from "@/components/focus-flow/task-form";
import { ScaledText as Text } from "@/components/focus-flow/scaled-text";
import { COLORS, EmptyState, IconButton, LoadingScreen, Pill, safeHaptic, ScreenHeading } from "@/components/focus-flow/ui";
import { ScreenContainer } from "@/components/screen-container";
import { getAppLanguage, localized } from "@/lib/focus-flow/i18n";
import { useFocusFlow, type EarlyCompletionTarget, type MutationResult } from "@/lib/focus-flow/provider";
import type { Todo } from "@/lib/focus-flow/types";
import { formatJapaneseDate, getTodoDueStatus, getTodoSubtasks, isTodoAchieved, todoProgressLabel } from "@/lib/focus-flow/utils";

type ViewMode = "open" | "done";

const priorityRank = { high: 0, medium: 1, low: 2 } as const;
const dueRank = (todo: Todo) => { const status = todo.dueDate ? getTodoDueStatus(todo) : undefined; return status === "overdue" ? 0 : status === "today" ? 1 : todo.dueDate ? 2 : 3; };

export default function TodosScreen() {
  const { todos, displaySettings, isReady, addTodo, updateTodo, toggleTodo, adjustTodoProgress, toggleSubtask, deleteTodo, purchaseEarlyCompletion, earlyCompletionPrice } = useFocusFlow();
  const language = getAppLanguage(displaySettings);
  const t = useCallback((ja: string, en: string) => localized(language, ja, en), [language]);
  const router = useRouter();
  const params = useLocalSearchParams<{ open?: string | string[] }>();
  const [viewMode, setViewMode] = useState<ViewMode>("open");
  const [formOpen, setFormOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | undefined>();
  const [undoTodo, setUndoTodo] = useState<Todo | undefined>();
  const widgetOpenedTodo = useRef<string | undefined>(undefined);

  const openTodos = useMemo(() => todos.filter((todo) => !todo.completed).sort((left, right) => {
    return dueRank(left) - dueRank(right) || priorityRank[left.priority] - priorityRank[right.priority] || (left.dueDate ?? "9999-12-31").localeCompare(right.dueDate ?? "9999-12-31") || left.createdAt.localeCompare(right.createdAt);
  }), [todos]);
  const doneTodos = useMemo(() => todos.filter((todo) => todo.completed).sort((left, right) => (right.completedAt ?? right.createdAt).localeCompare(left.completedAt ?? left.createdAt)), [todos]);
  const completedMustDos = todos.filter((todo) => todo.isRequired && todo.completed).length;
  const totalMustDos = todos.filter((todo) => todo.isRequired).length;
  const mustProgress = totalMustDos ? Math.round((completedMustDos / totalMustDos) * 100) : 0;

  const listItems = useMemo(() => viewMode === "done" ? doneTodos : openTodos, [doneTodos, openTodos, viewMode]);

  const openForm = (todo?: Todo) => { setEditingTodo(todo); setFormOpen(true); };
  useEffect(() => {
    const id = Array.isArray(params.open) ? params.open[0] : params.open;
    if (!id || widgetOpenedTodo.current === id) return;
    const todo = todos.find((item) => item.id === id);
    if (!todo) return;
    widgetOpenedTodo.current = id;
    setViewMode(todo.completed ? "done" : "open");
    openForm(todo);
  }, [params.open, todos]);
  useEffect(() => { if (!undoTodo) return; const timer = setTimeout(() => setUndoTodo(undefined), 6000); return () => clearTimeout(timer); }, [undoTodo]);
  const showMutationResult = (result: MutationResult, target?: EarlyCompletionTarget) => {
    if (result.ok) return;
    if (result.reason === "FREE_LIMIT_REACHED") { Alert.alert(t("無料版の上限です", "Free plan limit"), t("Todoは無料版では2件までです。Plusでは無制限に追加できます。", "The free plan allows up to 2 tasks. Plus removes this limit.")); return; }
    if (result.reason === "TIMER_STARTED") { Alert.alert(t("計測を開始しました", "Timer started"), t("設定した時間が経過すると完了扱いになります。", "This item becomes complete after its scheduled time has elapsed.")); return; }
    if (result.reason === "TIME_NOT_READY" && target) Alert.alert(t("設定時間がまだ経過していません", "The scheduled time has not elapsed"), t("時間管理項目は設定時間が経過すると完了扱いになります。今すぐ完了する場合は、1回限りの早期完了を購入できます。", "Timed items become complete after their scheduled time. To finish now, you can buy one early completion."), [{ text: t("待つ", "Wait"), style: "cancel" }, { text: t(`${earlyCompletionPrice ?? "¥100"} で早期完了`, `Finish early for ${earlyCompletionPrice ?? "¥100"}`), onPress: () => void purchaseEarlyCompletion(target) }]);
  };
  const remove = (todo: Todo) => {
    const confirm = () => deleteTodo(todo.id);
    if (Platform.OS === "web") confirm();
    else Alert.alert(t("Todoを削除しますか？", "Delete this task?"), t(`「${todo.title}」は復元できません。`, `“${todo.title}” cannot be restored.`), [{ text: t("キャンセル", "Cancel"), style: "cancel" }, { text: t("削除", "Delete"), style: "destructive", onPress: confirm }]);
  };

  if (!isReady) return <ScreenContainer><LoadingScreen /></ScreenContainer>;

  return <ScreenContainer className="px-5" containerClassName="bg-background"><FlatList
    data={listItems}
    keyExtractor={(item) => item.id}
    showsVerticalScrollIndicator={false}
    contentContainerStyle={styles.content}
    ListHeaderComponent={<><ScreenHeading eyebrow={t("今日の実行リスト", "Your action list")} title={t("Todo", "Tasks")} action={<IconButton icon="add" label={t("Todoを追加", "Add task")} onPress={() => openForm()} variant="filled" />} />
      <View style={styles.summary}><View style={styles.summaryTop}><View style={styles.summaryIcon}><MaterialIcons name="lock-outline" size={19} color={COLORS.forest} /></View><View style={styles.summaryCopy}><Text style={styles.summaryEyebrow}>{t("アプリ解除の進捗", "UNLOCK PROGRESS")}</Text><Text style={styles.summaryTitle}>{totalMustDos ? t(`必須 ${completedMustDos}/${totalMustDos}件を完了`, `${completedMustDos}/${totalMustDos} must-dos complete`) : t("必須Todoを追加して開始", "Add a must-do to get started")}</Text></View><Text style={styles.summaryPercent}>{mustProgress}%</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${mustProgress}%` }]} /></View><Text style={styles.summaryHint}>{t("必須Todoを完了すると、選択したアプリの解除条件を満たせます。", "Complete must-dos to meet the unlock condition for your selected apps.")}</Text></View>
      <View style={styles.segmented}>{([{ key: "open", label: t("未完了", "Open"), count: openTodos.length }, { key: "done", label: t("完了", "Done"), count: doneTodos.length }] as const).map((tab) => <TouchableOpacity key={tab.key} accessibilityRole="button" accessibilityState={{ selected: viewMode === tab.key }} onPress={() => setViewMode(tab.key)} style={[styles.segment, viewMode === tab.key && styles.segmentActive]}><Text style={[styles.segmentText, viewMode === tab.key && styles.segmentTextActive]}>{tab.label}</Text><Text style={[styles.segmentCount, viewMode === tab.key && styles.segmentCountActive]}>{tab.count}</Text></TouchableOpacity>)}</View>
    </>}
    ListEmptyComponent={<EmptyState icon={viewMode === "done" ? "task-alt" : "playlist-add"} title={viewMode === "done" ? t("完了したTodoはまだありません", "No completed tasks yet") : t("最初のTodoを追加しましょう", "Add your first task")} description={viewMode === "done" ? t("完了したTodoはここで振り返れます。", "Finished tasks will appear here.") : t("必須にすると、対象アプリの解除条件にできます。", "Choose Must-do to make a task an unlock condition.")} actionLabel={viewMode === "done" ? t("未完了を表示", "Show open") : t("Todoを追加", "Add task")} onAction={() => viewMode === "done" ? setViewMode("open") : openForm()} />}
    renderItem={({ item }) => <TaskRow todo={item} language={language} t={t} onEdit={() => openForm(item)} onToggle={() => { const wasComplete = isTodoAchieved(item); const result = toggleTodo(item.id); if (result.ok) { safeHaptic(wasComplete ? "light" : "success"); if (!wasComplete) setUndoTodo(item); } showMutationResult(result, { kind: "todo", id: item.id }); }} onProgress={(delta) => { const result = adjustTodoProgress(item.id, delta); if (result.ok && delta > 0) safeHaptic("light"); showMutationResult(result, { kind: "todo", id: item.id }); }} onSubtask={(subtaskId) => { const subtask = getTodoSubtasks(item).find((candidate) => candidate.id === subtaskId); const result = toggleSubtask(item.id, subtaskId); if (result.ok) safeHaptic(subtask?.completed ? "light" : "success"); showMutationResult(result, { kind: "todo", id: item.id }); }} onDelete={() => remove(item)} />}
  />
  {undoTodo ? <View style={undoStyles.bar}><Text style={undoStyles.copy}>{t("Todoを完了しました", "Task completed")}</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel={t("完了を元に戻す", "Undo completion")} onPress={() => { const result = toggleTodo(undoTodo.id); if (result.ok) { safeHaptic("light"); setUndoTodo(undefined); } }} style={undoStyles.action}><Text style={undoStyles.actionLabel}>{t("元に戻す", "Undo")}</Text></TouchableOpacity></View> : null}
  <TaskForm visible={formOpen} todo={editingTodo} onClose={() => { setFormOpen(false); setEditingTodo(undefined); if (widgetOpenedTodo.current) { widgetOpenedTodo.current = undefined; router.replace("/"); } }} onSave={(input) => { const result = editingTodo ? updateTodo(editingTodo.id, input) : addTodo(input); showMutationResult(result); return result; }} />
  </ScreenContainer>;
}

function TaskRow({ todo, language, t, onEdit, onToggle, onProgress, onSubtask, onDelete }: { todo: Todo; language: "ja" | "en"; t: (ja: string, en: string) => string; onEdit: () => void; onToggle: () => void; onProgress: (delta: number) => void; onSubtask: (id: string) => void; onDelete: () => void }) {
  const achieved = isTodoAchieved(todo); const dueStatus = getTodoDueStatus(todo); const subtasks = getTodoSubtasks(todo); const progress = todoProgressLabel(todo, language); const priorityColor = todo.priority === "high" ? COLORS.error : todo.priority === "medium" ? COLORS.warning : COLORS.blue;
  const due = !todo.dueDate ? undefined : dueStatus === "overdue" ? t("期限超過", "Overdue") : dueStatus === "today" ? t("今日が期限", "Due today") : formatJapaneseDate(todo.dueDate, language);
  return <View style={[styles.taskRow, achieved && styles.taskRowDone]}><View style={[styles.priorityRail, { backgroundColor: priorityColor }]} /><TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: achieved }} accessibilityLabel={t(`「${todo.title}」を完了にする`, `Mark “${todo.title}” complete`)} hitSlop={8} onPress={onToggle} style={[styles.check, achieved && styles.checkDone]}>{achieved ? <MaterialIcons name="check" size={17} color={COLORS.white} /> : null}</TouchableOpacity><View style={styles.taskCopy}><TouchableOpacity accessibilityRole="button" onPress={onEdit} activeOpacity={0.72}><Text style={[styles.taskTitle, achieved && styles.taskTitleDone]} numberOfLines={2}>{todo.title}</Text><View style={styles.meta}>{todo.isRequired ? <Pill label={t("必須", "Must-do")} color={COLORS.forest} /> : null}{due ? <Text style={[styles.due, dueStatus === "overdue" && styles.overdue]}>{due}</Text> : null}{subtasks.length ? <Text style={styles.metaText}>{subtasks.filter((subtask) => subtask.completed).length}/{subtasks.length} {t("手順", "steps")}</Text> : null}</View></TouchableOpacity>{progress ? <View style={styles.progressControl}><TouchableOpacity accessibilityLabel={t("進捗を減らす", "Decrease progress")} hitSlop={7} onPress={() => onProgress(-1)} style={styles.progressButton}><MaterialIcons name="remove" size={15} color={COLORS.forest} /></TouchableOpacity><Text style={styles.progressText}>{progress}</Text><TouchableOpacity accessibilityLabel={t("進捗を増やす", "Increase progress")} hitSlop={7} onPress={() => onProgress(1)} style={styles.progressButton}><MaterialIcons name="add" size={15} color={COLORS.forest} /></TouchableOpacity></View> : null}{subtasks.length ? <View style={styles.subtasks}>{subtasks.slice(0, 2).map((subtask) => <TouchableOpacity key={subtask.id} accessibilityRole="checkbox" accessibilityState={{ checked: subtask.completed }} onPress={() => onSubtask(subtask.id)} style={styles.subtask}><View style={[styles.subtaskCheck, subtask.completed && styles.subtaskCheckDone]}>{subtask.completed ? <MaterialIcons name="check" size={10} color={COLORS.white} /> : null}</View><Text style={[styles.subtaskText, subtask.completed && styles.subtaskTextDone]} numberOfLines={1}>{subtask.title}</Text></TouchableOpacity>)}{subtasks.length > 2 ? <TouchableOpacity onPress={onEdit}><Text style={styles.moreSteps}>+{subtasks.length - 2} {t("件の手順", "more steps")}</Text></TouchableOpacity> : null}</View> : null}</View><TouchableOpacity accessibilityLabel={t("Todoを削除", "Delete task")} hitSlop={8} onPress={onDelete} style={styles.delete}><MaterialIcons name="delete-outline" size={20} color={COLORS.muted} /></TouchableOpacity></View>;
}

const styles = StyleSheet.create({ content: { paddingTop: 16, paddingBottom: 24, flexGrow: 1 }, summary: { backgroundColor: "#EAF6F1", borderWidth: 1, borderColor: "#B9DDD1", borderRadius: 20, padding: 14, marginTop: -4, marginBottom: 13 }, summaryTop: { flexDirection: "row", alignItems: "center", gap: 10 }, summaryIcon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#D8EEE6" }, summaryCopy: { flex: 1, minWidth: 0 }, summaryEyebrow: { color: "#397765", fontSize: 10, letterSpacing: 0.5, fontWeight: "900" }, summaryTitle: { color: "#173F36", fontSize: 14, lineHeight: 20, fontWeight: "800", marginTop: 1 }, summaryPercent: { color: COLORS.forest, fontSize: 22, fontWeight: "900" }, progressTrack: { height: 6, borderRadius: 4, overflow: "hidden", backgroundColor: "#C9E7DD", marginTop: 12 }, progressFill: { height: "100%", borderRadius: 4, backgroundColor: COLORS.forest }, summaryHint: { color: "#42675D", fontSize: 11, lineHeight: 16, marginTop: 8 }, segmented: { flexDirection: "row", gap: 7, marginBottom: 13 }, segment: { flex: 1, minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 13, backgroundColor: "#E8EEF0" }, segmentActive: { backgroundColor: COLORS.forest }, segmentText: { color: COLORS.muted, fontSize: 12, fontWeight: "800" }, segmentTextActive: { color: COLORS.white }, segmentCount: { color: "#6F817A", fontSize: 11, fontWeight: "800" }, segmentCountActive: { color: "#D7EEE6" }, groupHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 9, marginBottom: 7 }, groupTitle: { color: COLORS.text, fontSize: 16, lineHeight: 22, fontWeight: "900" }, groupCount: { minWidth: 23, height: 23, textAlign: "center", textAlignVertical: "center", overflow: "hidden", borderRadius: 12, color: COLORS.forest, backgroundColor: "#E4F1EB", fontSize: 12, fontWeight: "800" }, taskRow: { position: "relative", minHeight: 78, flexDirection: "row", alignItems: "flex-start", backgroundColor: "rgba(255,255,255,0.9)", borderColor: COLORS.border, borderWidth: 1, borderRadius: 17, paddingVertical: 13, paddingLeft: 14, paddingRight: 4, marginBottom: 8, overflow: "hidden" }, taskRowDone: { opacity: 0.68 }, priorityRail: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 }, check: { width: 28, height: 28, borderRadius: 6, borderWidth: 1.5, borderColor: "#AFC0B7", alignItems: "center", justifyContent: "center", marginTop: 1, marginRight: 10 }, checkDone: { borderColor: COLORS.success, backgroundColor: COLORS.success }, taskCopy: { flex: 1, minWidth: 0 }, taskTitle: { color: COLORS.text, fontSize: 15, lineHeight: 21, fontWeight: "800" }, taskTitleDone: { color: COLORS.muted, textDecorationLine: "line-through" }, meta: { minHeight: 21, flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 6 }, due: { color: COLORS.muted, fontSize: 11, lineHeight: 16, fontWeight: "800" }, overdue: { color: COLORS.error }, metaText: { color: COLORS.muted, fontSize: 11, lineHeight: 16, fontWeight: "700" }, progressControl: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 10, backgroundColor: "#EAF4F1", marginTop: 8, paddingHorizontal: 5, paddingVertical: 3 }, progressButton: { width: 25, height: 25, alignItems: "center", justifyContent: "center", borderRadius: 7, backgroundColor: COLORS.white }, progressText: { minWidth: 48, color: COLORS.forest, textAlign: "center", fontSize: 11, fontWeight: "900" }, subtasks: { marginTop: 8, gap: 5 }, subtask: { minHeight: 26, flexDirection: "row", alignItems: "center", gap: 6 }, subtaskCheck: { width: 16, height: 16, borderRadius: 5, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#AFC0B7" }, subtaskCheckDone: { borderColor: COLORS.success, backgroundColor: COLORS.success }, subtaskText: { flex: 1, color: COLORS.muted, fontSize: 11, fontWeight: "700" }, subtaskTextDone: { textDecorationLine: "line-through" }, moreSteps: { color: COLORS.forest, fontSize: 11, fontWeight: "800", marginLeft: 22 }, delete: { width: 34, height: 38, alignItems: "center", justifyContent: "center", marginLeft: 2 } });
const undoStyles = StyleSheet.create({ bar: { position: "absolute", left: 20, right: 20, bottom: 16, minHeight: 56, flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 17, backgroundColor: "#27312E", paddingLeft: 16, paddingRight: 8, shadowColor: "#10241D", shadowOpacity: 0.22, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 6 }, copy: { flex: 1, color: COLORS.white, fontSize: 14, fontWeight: "800" }, action: { minHeight: 40, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#3A4742", paddingHorizontal: 12 }, actionLabel: { color: "#FFB7B1", fontSize: 13, fontWeight: "900" } });
