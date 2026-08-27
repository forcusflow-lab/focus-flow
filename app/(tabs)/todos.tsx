import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, FlatList, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { TaskForm } from "@/components/focus-flow/task-form";
import { TodoItemCard } from "@/components/focus-flow/item-cards";
import { ScaledText as Text } from "@/components/focus-flow/scaled-text";
import { EmptyState, IconButton, LoadingScreen, ScreenHeading, safeHaptic, useFocusPalette } from "@/components/focus-flow/ui";
import { ScreenContainer } from "@/components/screen-container";
import { getAppLanguage, localized } from "@/lib/focus-flow/i18n";
import { useFocusFlow, type EarlyCompletionTarget, type MutationResult } from "@/lib/focus-flow/provider";
import type { Todo } from "@/lib/focus-flow/types";
import { getTodoDueStatus, getTodoSubtasks, isTodoAchieved, isTodoEffectiveRequired } from "@/lib/focus-flow/utils";

const priorityRank = { high: 0, medium: 1, low: 2 } as const;
const dueRank = (todo: Todo) => { const status = todo.dueDate ? getTodoDueStatus(todo) : undefined; return status === "overdue" ? 0 : status === "today" ? 1 : todo.dueDate ? 2 : 3; };

export default function TodosScreen() {
  const { todos, displaySettings, isReady, addTodo, updateTodo, toggleTodo, adjustTodoProgress, toggleSubtask, deleteTodo, purchaseEarlyCompletion, earlyCompletionPrice } = useFocusFlow();
  const palette = useFocusPalette();
  const language = getAppLanguage(displaySettings);
  const t = useCallback((ja: string, en: string) => localized(language, ja, en), [language]);
  const router = useRouter();
  const params = useLocalSearchParams<{ open?: string | string[] }>();
  const [formOpen, setFormOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | undefined>();
  const [showHiddenCompleted, setShowHiddenCompleted] = useState(false);
  const widgetOpenedTodo = useRef<string | undefined>(undefined);
  const completedDisplay = displaySettings.todayCompletedDisplay ?? "dim";

  const openTodos = useMemo(() => todos.filter((todo) => !isTodoAchieved(todo)).sort((left, right) => dueRank(left) - dueRank(right) || priorityRank[left.priority] - priorityRank[right.priority] || (left.dueDate ?? "9999-12-31").localeCompare(right.dueDate ?? "9999-12-31") || left.createdAt.localeCompare(right.createdAt)), [todos]);
  const doneTodos = useMemo(() => todos.filter((todo) => isTodoAchieved(todo)).sort((left, right) => left.createdAt.localeCompare(right.createdAt)), [todos]);
  const showCompleted = completedDisplay === "dim" || showHiddenCompleted;
  const listItems = useMemo(() => showCompleted ? [...openTodos, ...doneTodos] : openTodos, [doneTodos, openTodos, showCompleted]);
  const completedMustDos = todos.filter((todo) => isTodoEffectiveRequired(todo) && isTodoAchieved(todo)).length;
  const totalMustDos = todos.filter((todo) => isTodoEffectiveRequired(todo)).length;
  const mustProgress = totalMustDos ? Math.round((completedMustDos / totalMustDos) * 100) : 0;

  const openForm = (todo?: Todo) => { setEditingTodo(todo); setFormOpen(true); };
  useEffect(() => {
    const id = Array.isArray(params.open) ? params.open[0] : params.open;
    if (!id || widgetOpenedTodo.current === id) return;
    const todo = todos.find((item) => item.id === id);
    if (!todo) return;
    widgetOpenedTodo.current = id;
    if (isTodoAchieved(todo)) setShowHiddenCompleted(true);
    openForm(todo);
  }, [params.open, todos]);
  const showMutationResult = (result: MutationResult, target?: EarlyCompletionTarget) => {
    if (result.ok) return;
    if (result.reason === "FREE_LIMIT_REACHED") { Alert.alert(t("無料版の上限です", "Free plan limit"), t("Todoは無料版では2件までです。Plusでは無制限に追加できます。", "The free plan allows up to 2 tasks. Plus removes this limit.")); return; }
    if (result.reason === "TIMER_STARTED") { Alert.alert(t("計測を開始しました", "Timer started"), t("設定した時間が経過すると完了扱いになります。", "This item becomes complete after its scheduled time has elapsed.")); return; }
    if (result.reason === "TIME_NOT_READY" && target) Alert.alert(t("設定時間がまだ経過していません", "The scheduled time has not elapsed"), t("時間管理項目は設定時間が経過すると完了扱いになります。今すぐ完了する場合は、1回限りの早期完了を購入できます。", "Timed items become complete after their scheduled time. To finish now, you can buy one early completion."), [{ text: t("待つ", "Wait"), style: "cancel" }, { text: t(`${earlyCompletionPrice ?? "¥100"} で早期完了`, `Finish early for ${earlyCompletionPrice ?? "¥100"}`), onPress: () => void purchaseEarlyCompletion(target) }]);
  };
  const remove = (todo: Todo) => { const confirm = () => deleteTodo(todo.id); if (Platform.OS === "web") confirm(); else Alert.alert(t("Todoを削除しますか？", "Delete this task?"), t(`「${todo.title}」は復元できません。`, `“${todo.title}” cannot be restored.`), [{ text: t("キャンセル", "Cancel"), style: "cancel" }, { text: t("削除", "Delete"), style: "destructive", onPress: confirm }]); };
  const renderTodo = (item: Todo) => <TodoItemCard todo={item} language={language} t={t} onOpen={() => openForm(item)} onToggle={() => { const wasComplete = isTodoAchieved(item); const result = toggleTodo(item.id); if (result.ok) safeHaptic(wasComplete ? "light" : "success"); showMutationResult(result, { kind: "todo", id: item.id }); }} onProgress={(delta) => { const result = adjustTodoProgress(item.id, delta); if (result.ok && delta > 0) safeHaptic("light"); showMutationResult(result, { kind: "todo", id: item.id }); }} onSubtask={(subtaskId) => { const subtask = getTodoSubtasks(item).find((candidate) => candidate.id === subtaskId); const result = toggleSubtask(item.id, subtaskId); if (result.ok) safeHaptic(subtask?.completed ? "light" : "success"); showMutationResult(result, { kind: "todo", id: item.id }); }} onDelete={() => remove(item)} />;

  if (!isReady) return <ScreenContainer><LoadingScreen /></ScreenContainer>;

  return <ScreenContainer className="px-5" containerClassName="bg-background"><FlatList data={listItems} keyExtractor={(item) => item.id} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}
    ListHeaderComponent={<><ScreenHeading eyebrow={t("今日の実行リスト", "Your action list")} title={t("Todo", "Tasks")} action={<IconButton icon="add" label={t("Todoを追加", "Add task")} onPress={() => openForm()} variant="filled" />} /><View style={[styles.summary, { backgroundColor: palette.primarySoft, borderColor: palette.border }]}><View style={styles.summaryTop}><View style={[styles.summaryIcon, { backgroundColor: palette.elevated }]}><MaterialIcons name="lock-outline" size={19} color={palette.primary} /></View><View style={styles.summaryCopy}><Text style={[styles.summaryEyebrow, { color: palette.primary }]}>{t("アプリ解除の進捗", "UNLOCK PROGRESS")}</Text><Text style={[styles.summaryTitle, { color: palette.text }]}>{totalMustDos ? t(`必須 ${completedMustDos}/${totalMustDos}件を完了`, `${completedMustDos}/${totalMustDos} must-dos complete`) : t("必須Todoを追加して開始", "Add a must-do to get started")}</Text></View><Text style={[styles.summaryPercent, { color: palette.primary }]}>{mustProgress}%</Text></View><View style={[styles.progressTrack, { backgroundColor: palette.elevated }]}><View style={[styles.progressFill, { width: `${mustProgress}%`, backgroundColor: palette.primary }]} /></View><Text style={[styles.summaryHint, { color: palette.muted }]}>{t("必須Todoを完了すると、選択したアプリの解除条件を満たせます。", "Complete must-dos to meet the unlock condition for your selected apps.")}</Text></View><View style={styles.groupHeading}><Text style={[styles.groupTitle, { color: palette.text }]}>{t("未完了", "Open")}</Text><Text style={[styles.groupCount, { color: palette.primary, backgroundColor: palette.primarySoft }]}>{openTodos.length}</Text></View></>}
    ListEmptyComponent={<EmptyState icon="playlist-add" title={t("未完了のTodoはありません", "No open tasks")} description={t("完了済みは下の入口からいつでも確認できます。", "You can review completed tasks from the entry below.")} actionLabel={t("Todoを追加", "Add task")} onAction={() => openForm()} />}
    renderItem={({ item, index }) => <>{showCompleted && index === openTodos.length ? <View style={styles.groupHeading}><Text style={[styles.groupTitle, { color: palette.text }]}>{t("完了", "Done")}</Text><Text style={[styles.groupCount, { color: palette.muted, backgroundColor: palette.elevated }]}>{doneTodos.length}</Text></View> : null}{renderTodo(item)}</>}
    ListFooterComponent={completedDisplay === "hide" && doneTodos.length > 0 && !showHiddenCompleted ? <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("完了済みのTodoを一時表示", "Show completed tasks temporarily")} onPress={() => setShowHiddenCompleted(true)} style={[styles.revealButton, { backgroundColor: palette.elevated, borderColor: palette.border }]}><MaterialIcons name="visibility" size={18} color={palette.primary} /><Text style={[styles.revealText, { color: palette.primary }]}>{t(`完了済みを表示（${doneTodos.length}件）`, `Show completed (${doneTodos.length})`)}</Text></TouchableOpacity> : null}
  /><TaskForm visible={formOpen} todo={editingTodo} onClose={() => { setFormOpen(false); setEditingTodo(undefined); if (widgetOpenedTodo.current) { widgetOpenedTodo.current = undefined; router.replace("/(tabs)" as never); } }} onSave={(input) => { const result = editingTodo ? updateTodo(editingTodo.id, input) : addTodo(input); showMutationResult(result); return result; }} /></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { paddingTop: 14, paddingBottom: 28, flexGrow: 1 }, summary: { borderWidth: 1, borderRadius: 20, padding: 14, marginTop: -4, marginBottom: 14 }, summaryTop: { flexDirection: "row", alignItems: "center", gap: 10 }, summaryIcon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" }, summaryCopy: { flex: 1, minWidth: 0 }, summaryEyebrow: { fontSize: 10, letterSpacing: 0.5, fontWeight: "900" }, summaryTitle: { fontSize: 14, lineHeight: 20, fontWeight: "800", marginTop: 1 }, summaryPercent: { fontSize: 22, fontWeight: "900" }, progressTrack: { height: 6, borderRadius: 4, overflow: "hidden", marginTop: 12 }, progressFill: { height: "100%", borderRadius: 4 }, summaryHint: { fontSize: 11, lineHeight: 16, marginTop: 8 }, groupHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4, marginBottom: 7 }, groupTitle: { fontSize: 15, lineHeight: 21, fontWeight: "900" }, groupCount: { minWidth: 25, height: 25, textAlign: "center", textAlignVertical: "center", overflow: "hidden", borderRadius: 13, fontSize: 12, fontWeight: "800" }, revealButton: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, borderWidth: 1, marginTop: 8 }, revealText: { fontSize: 13, fontWeight: "800" },
});
