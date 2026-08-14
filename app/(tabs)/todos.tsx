import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo, useState } from "react";
import { Alert, FlatList, Platform, StyleSheet, TouchableOpacity, View } from "react-native";

import { TaskForm } from "@/components/focus-flow/task-form";
import { ScaledText as Text } from "@/components/focus-flow/scaled-text";
import { COLORS, EmptyState, IconButton, LoadingScreen, Pill, safeHaptic, ScreenHeading } from "@/components/focus-flow/ui";
import { ScreenContainer } from "@/components/screen-container";
import { getAppLanguage, localized } from "@/lib/focus-flow/i18n";
import { useFocusFlow } from "@/lib/focus-flow/provider";
import type { Todo } from "@/lib/focus-flow/types";
import { formatJapaneseDate, getTodoDueStatus, getTodoSubtasks, isTodoAchieved, todoProgressLabel } from "@/lib/focus-flow/utils";

type Filter = "open" | "done";
const priorityMeta = { high: { label: "高", color: COLORS.error }, medium: { label: "中", color: COLORS.warning }, low: { label: "低", color: COLORS.blue } };

export default function TodosScreen() {
  const { todos, displaySettings, isReady, addTodo, updateTodo, toggleTodo, adjustTodoProgress, toggleSubtask, deleteTodo } = useFocusFlow();
  const language = getAppLanguage(displaySettings);
  const t = (ja: string, en: string) => localized(language, ja, en);
  const [filter, setFilter] = useState<Filter>("open");
  const [formOpen, setFormOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | undefined>();

  const displayed = useMemo(() => todos.filter((todo) => (filter === "done" ? todo.completed : !todo.completed)), [filter, todos]);
  const openForm = (todo?: Todo) => {
    setEditingTodo(todo);
    setFormOpen(true);
  };
  const remove = (todo: Todo) => {
    const confirm = () => deleteTodo(todo.id);
    if (Platform.OS === "web") confirm();
    else Alert.alert(t("Todoを削除しますか？", "Delete this task?"), t(`「${todo.title}」は復元できません。`, `“${todo.title}” cannot be restored.`), [{ text: t("キャンセル", "Cancel"), style: "cancel" }, { text: t("削除", "Delete"), style: "destructive", onPress: confirm }]);
  };

  if (!isReady) return <ScreenContainer><LoadingScreen /></ScreenContainer>;

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <FlatList
        data={displayed}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <ScreenHeading eyebrow={t("行動を整える", "Plan your day")} title="Todo" action={<IconButton icon="add" label={t("Todoを追加", "Add task")} onPress={() => openForm()} variant="filled" />} />
            <View style={styles.filters}>
              <TouchableOpacity onPress={() => setFilter("open")} style={[styles.filter, filter === "open" && styles.filterActive]}><Text style={[styles.filterText, filter === "open" && styles.filterTextActive]}>{t("未完了", "Open")} {todos.filter((todo) => !todo.completed).length}</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setFilter("done")} style={[styles.filter, filter === "done" && styles.filterActive]}><Text style={[styles.filterText, filter === "done" && styles.filterTextActive]}>{t("完了", "Done")} {todos.filter((todo) => todo.completed).length}</Text></TouchableOpacity>
            </View>
            <View style={styles.explainer}><MaterialIcons name="lock-outline" size={17} color={COLORS.forest} /><Text style={styles.explainerText}>{t(`必須 ${todos.filter((todo) => todo.isRequired).length}件は、集中ルール中の基本解除条件です。`, `${todos.filter((todo) => todo.isRequired).length} must-do task(s) are the default unlock condition.`)}</Text></View>
          </>
        }
        ListEmptyComponent={<EmptyState icon="playlist-add" title={filter === "open" ? t("最初のTodoを追加しましょう", "Add your first task") : t("完了したTodoはまだありません", "No completed tasks yet")} description={filter === "open" ? t("追加時に「必須」を選ぶと、日課ルールに含めなくてもアプリ制限の解除条件になります。", "Choose Must-do when you add a task to make it an unlock condition.") : t("完了したTodoはここで振り返れます。", "Your finished tasks will appear here.")} actionLabel={filter === "open" ? t("Todoを追加", "Add task") : t("未完了を表示", "Show open")} onAction={() => (filter === "open" ? openForm() : setFilter("open"))} />}
        renderItem={({ item }) => {
          const priority = priorityMeta[item.priority];
          const dueStatus = getTodoDueStatus(item);
          const achieved = isTodoAchieved(item);
          const progressLabel = todoProgressLabel(item, language);
          const subtasks = getTodoSubtasks(item);
          return (
            <View style={[styles.todoCard, achieved && styles.todoCardCompleted]}>
              <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: achieved }} onPress={() => { safeHaptic(achieved ? "light" : "success"); toggleTodo(item.id); }} style={[styles.check, achieved && styles.checkDone]}>
                {achieved ? <MaterialIcons name="check" size={17} color={COLORS.white} /> : null}
              </TouchableOpacity>
              <View style={styles.todoCopy}>
                <TouchableOpacity accessibilityRole="button" onPress={() => openForm(item)} activeOpacity={0.72}><Text style={[styles.todoTitle, achieved && styles.todoTitleCompleted]} numberOfLines={2}>{item.title}</Text></TouchableOpacity>
                <View style={styles.metaRow}>{item.isRequired ? <Pill label={t("必須", "Must-do")} color={COLORS.forest} /> : dueStatus === "today" ? <Pill label={t("今日", "Today")} color={COLORS.warning} /> : null}<Pill label={t(`優先 ${priority.label}`, `Priority ${item.priority}`)} color={priority.color} />{item.dueDate ? <Text numberOfLines={1} style={[styles.dueText, dueStatus === "today" && styles.dueToday, dueStatus === "overdue" && styles.dueOverdue]}>{dueStatus === "today" ? t("今日が期限", "Due today") : dueStatus === "overdue" ? t("期限超過", "Overdue") : formatJapaneseDate(item.dueDate, language)}</Text> : null}</View>
                {progressLabel ? <View style={styles.progressRow}><TouchableOpacity accessibilityLabel={t("進捗を減らす", "Decrease progress")} onPress={() => adjustTodoProgress(item.id, -1)} style={styles.progressButton}><MaterialIcons name="remove" size={16} color={COLORS.forest} /></TouchableOpacity><Text style={styles.progressText}>{progressLabel}</Text><TouchableOpacity accessibilityLabel={t("進捗を増やす", "Increase progress")} onPress={() => { safeHaptic("light"); adjustTodoProgress(item.id, 1); }} style={styles.progressButton}><MaterialIcons name="add" size={16} color={COLORS.forest} /></TouchableOpacity></View> : null}
                {subtasks.length ? <View style={styles.subtaskList}>{subtasks.map((subtask) => <TouchableOpacity key={subtask.id} accessibilityRole="checkbox" accessibilityState={{ checked: subtask.completed }} onPress={() => { safeHaptic(subtask.completed ? "light" : "success"); toggleSubtask(item.id, subtask.id); }} style={styles.subtaskRow}><View style={[styles.subtaskCheck, subtask.completed && styles.subtaskCheckDone]}>{subtask.completed ? <MaterialIcons name="check" size={12} color={COLORS.white} /> : null}</View><Text style={[styles.subtaskTitle, subtask.completed && styles.subtaskTitleDone]} numberOfLines={1}>{subtask.title}</Text></TouchableOpacity>)}</View> : null}
              </View>
              <TouchableOpacity accessibilityLabel={t("Todoを削除", "Delete task")} onPress={() => remove(item)} style={styles.deleteButton}><MaterialIcons name="more-horiz" size={22} color={COLORS.muted} /></TouchableOpacity>
            </View>
          );
        }}
      />
      <TaskForm visible={formOpen} todo={editingTodo} onClose={() => { setFormOpen(false); setEditingTodo(undefined); }} onSave={(input) => editingTodo ? updateTodo(editingTodo.id, input) : addTodo(input)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 16, paddingBottom: 24, flexGrow: 1 },
  filters: { flexDirection: "row", gap: 8, marginBottom: 12 },
  filter: { flex: 1, minHeight: 42, alignItems: "center", justifyContent: "center", paddingHorizontal: 12, borderRadius: 14, backgroundColor: "#E7EEF7" },
  filterActive: { backgroundColor: COLORS.forest },
  filterText: { color: COLORS.muted, fontSize: 14, fontWeight: "800" },
  filterTextActive: { color: COLORS.white },
  explainer: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#E9F4F1", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  explainerText: { color: "#245D52", flex: 1, fontSize: 12, lineHeight: 18, fontWeight: "700" },
  todoCard: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.86)", borderColor: COLORS.border, borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 9 },
  todoCardCompleted: { opacity: 0.7 },
  check: { width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 10, borderWidth: 1.5, borderColor: "#AFC0B7", marginRight: 12 },
  checkDone: { borderColor: COLORS.success, backgroundColor: COLORS.success },
  todoCopy: { flex: 1, minWidth: 0 },
  todoTitle: { color: COLORS.text, fontSize: 16, lineHeight: 23, fontWeight: "800" },
  todoTitleCompleted: { color: COLORS.muted, textDecorationLine: "line-through" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 6, rowGap: 6, marginTop: 8 },
  dueText: { color: COLORS.muted, fontSize: 12, lineHeight: 18, fontWeight: "700", marginLeft: 2 },
  dueToday: { color: "#A96515", fontWeight: "800" },
  dueOverdue: { color: COLORS.error, fontWeight: "800" },
  progressRow: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 8, marginTop: 9, borderRadius: 10, backgroundColor: "#EAF4F1", paddingHorizontal: 6, paddingVertical: 3 },
  progressButton: { width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: COLORS.white },
  progressText: { minWidth: 52, textAlign: "center", color: COLORS.forest, fontSize: 12, fontWeight: "800" },
  subtaskList: { marginTop: 9, gap: 5 },
  subtaskRow: { minHeight: 30, flexDirection: "row", alignItems: "center", gap: 7 },
  subtaskCheck: { width: 18, height: 18, alignItems: "center", justifyContent: "center", borderRadius: 6, borderWidth: 1, borderColor: "#AFC0B7" },
  subtaskCheckDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  subtaskTitle: { flex: 1, color: COLORS.muted, fontSize: 12, fontWeight: "600" },
  subtaskTitleDone: { textDecorationLine: "line-through" },
  deleteButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center", marginLeft: 4 },
});
