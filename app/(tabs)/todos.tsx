import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo, useState } from "react";
import { Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { TaskForm } from "@/components/focus-flow/task-form";
import { COLORS, EmptyState, IconButton, LoadingScreen, Pill, safeHaptic, ScreenHeading } from "@/components/focus-flow/ui";
import { ScreenContainer } from "@/components/screen-container";
import { useFocusFlow } from "@/lib/focus-flow/provider";
import type { Todo } from "@/lib/focus-flow/types";
import { formatJapaneseDate, getTodoDueStatus } from "@/lib/focus-flow/utils";

type Filter = "open" | "done";
const priorityMeta = { high: { label: "高", color: COLORS.error }, medium: { label: "中", color: COLORS.warning }, low: { label: "低", color: COLORS.blue } };

export default function TodosScreen() {
  const { todos, isReady, addTodo, updateTodo, toggleTodo, deleteTodo } = useFocusFlow();
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
    else Alert.alert("Todoを削除しますか？", `「${todo.title}」は復元できません。`, [{ text: "キャンセル", style: "cancel" }, { text: "削除", style: "destructive", onPress: confirm }]);
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
            <ScreenHeading eyebrow="行動を整える" title="Todo" action={<IconButton icon="add" label="Todoを追加" onPress={() => openForm()} variant="filled" />} />
            <View style={styles.filters}>
              <TouchableOpacity onPress={() => setFilter("open")} style={[styles.filter, filter === "open" && styles.filterActive]}><Text style={[styles.filterText, filter === "open" && styles.filterTextActive]}>未完了 {todos.filter((todo) => !todo.completed).length}</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setFilter("done")} style={[styles.filter, filter === "done" && styles.filterActive]}><Text style={[styles.filterText, filter === "done" && styles.filterTextActive]}>完了 {todos.filter((todo) => todo.completed).length}</Text></TouchableOpacity>
            </View>
            <View style={styles.explainer}><MaterialIcons name="lock-outline" size={17} color={COLORS.forest} /><Text style={styles.explainerText}>必須 {todos.filter((todo) => todo.isRequired).length}件は、集中ルール中の基本解除条件です。</Text></View>
          </>
        }
        ListEmptyComponent={<EmptyState icon="playlist-add" title={filter === "open" ? "最初のTodoを追加しましょう" : "完了したTodoはまだありません"} description={filter === "open" ? "追加時に「必須」を選ぶと、日課ルールに含めなくてもアプリ制限の解除条件になります。" : "完了したTodoはここで振り返れます。"} actionLabel={filter === "open" ? "Todoを追加" : "未完了を表示"} onAction={() => (filter === "open" ? openForm() : setFilter("open"))} />}
        renderItem={({ item }) => {
          const priority = priorityMeta[item.priority];
          const dueStatus = getTodoDueStatus(item);
          return (
            <View style={[styles.todoCard, item.completed && styles.todoCardCompleted]}>
              <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: item.completed }} onPress={() => { safeHaptic(item.completed ? "light" : "success"); toggleTodo(item.id); }} style={[styles.check, item.completed && styles.checkDone]}>
                {item.completed ? <MaterialIcons name="check" size={17} color={COLORS.white} /> : null}
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" onPress={() => openForm(item)} activeOpacity={0.72} style={styles.todoCopy}>
                <Text style={[styles.todoTitle, item.completed && styles.todoTitleCompleted]} numberOfLines={2}>{item.title}</Text>
                <View style={styles.metaRow}>{item.isRequired ? <Pill label="必須・アプリ制限あり" color={COLORS.forest} /> : dueStatus === "today" ? <Pill label="今日・自動必須" color={COLORS.warning} /> : null}<Pill label={`${priority.label}優先`} color={priority.color} /><Text style={[styles.dueText, dueStatus === "today" && styles.dueToday, dueStatus === "overdue" && styles.dueOverdue]}>{dueStatus === "today" ? "今日が期限" : dueStatus === "overdue" ? `${formatJapaneseDate(item.dueDate)}・期限超過` : formatJapaneseDate(item.dueDate)}</Text></View>
              </TouchableOpacity>
              <TouchableOpacity accessibilityLabel="Todoを削除" onPress={() => remove(item)} style={styles.deleteButton}><MaterialIcons name="more-horiz" size={22} color={COLORS.muted} /></TouchableOpacity>
            </View>
          );
        }}
      />
      <TaskForm visible={formOpen} todo={editingTodo} onClose={() => { setFormOpen(false); setEditingTodo(undefined); }} onSave={(input) => editingTodo ? updateTodo(editingTodo.id, input) : addTodo(input)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 16, paddingBottom: 28, flexGrow: 1 },
  filters: { flexDirection: "row", gap: 8, marginBottom: 16 },
  filter: { minHeight: 38, justifyContent: "center", paddingHorizontal: 14, borderRadius: 19, backgroundColor: "#E8EEEA" },
  filterActive: { backgroundColor: COLORS.forest },
  filterText: { color: COLORS.muted, fontSize: 13, fontWeight: "800" },
  filterTextActive: { color: COLORS.white },
  explainer: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#EAF3EE", borderRadius: 12, paddingHorizontal: 11, paddingVertical: 9, marginBottom: 14 },
  explainerText: { color: "#416558", flex: 1, fontSize: 11, lineHeight: 16, fontWeight: "700" },
  todoCard: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.white, borderColor: COLORS.border, borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 10 },
  todoCardCompleted: { opacity: 0.7 },
  check: { width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 10, borderWidth: 1.5, borderColor: "#AFC0B7", marginRight: 12 },
  checkDone: { borderColor: COLORS.success, backgroundColor: COLORS.success },
  todoCopy: { flex: 1, minWidth: 0 },
  todoTitle: { color: COLORS.text, fontSize: 16, lineHeight: 22, fontWeight: "800" },
  todoTitleCompleted: { color: COLORS.muted, textDecorationLine: "line-through" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  dueText: { color: COLORS.muted, fontSize: 12, fontWeight: "600" },
  dueToday: { color: "#A96515", fontWeight: "800" },
  dueOverdue: { color: COLORS.error, fontWeight: "800" },
  deleteButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center", marginLeft: 4 },
});
