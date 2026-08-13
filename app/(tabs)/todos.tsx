import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo, useState } from "react";
import { Alert, FlatList, Platform, StyleSheet, TouchableOpacity, View } from "react-native";

import { TaskForm } from "@/components/focus-flow/task-form";
import { ScaledText as Text } from "@/components/focus-flow/scaled-text";
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
                <View style={styles.metaRow}>{item.isRequired ? <Pill label="必須" color={COLORS.forest} /> : dueStatus === "today" ? <Pill label="今日" color={COLORS.warning} /> : null}<Pill label={`優先 ${priority.label}`} color={priority.color} />{item.dueDate ? <Text numberOfLines={1} style={[styles.dueText, dueStatus === "today" && styles.dueToday, dueStatus === "overdue" && styles.dueOverdue]}>{dueStatus === "today" ? "今日が期限" : dueStatus === "overdue" ? "期限超過" : formatJapaneseDate(item.dueDate)}</Text> : null}</View>
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
  deleteButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center", marginLeft: 4 },
});
