import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLayoutEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getAppLanguage, localized } from "@/lib/focus-flow/i18n";
import { useFocusFlow } from "@/lib/focus-flow/provider";
import type { Priority, Todo, TodoSubtask } from "@/lib/focus-flow/types";
import { createId, dayKey, formatJapaneseDate, getTodoSubtasks } from "@/lib/focus-flow/utils";
import { DatePicker } from "./date-picker";
import { RequiredWindowSelector } from "./required-window-selector";
import { ScaledText as Text } from "./scaled-text";
import { COLORS, safeHaptic, useFocusPalette } from "./ui";

export type TaskInput = {
  title: string;
  priority: Priority;
  dueDate?: string;
  isRequired: boolean;
  requiredWindowMode: "always" | "scheduled";
  requiredScheduleIds: string[];
  memo?: string;
  subtasks: TodoSubtask[];
};

type TaskFormProps = {
  visible: boolean;
  todo?: Todo;
  defaultRequired?: boolean;
  onClose: () => void;
  onSave: (input: TaskInput) => { ok: boolean };
};

export function TaskForm({ visible, todo, defaultRequired = false, onClose, onSave }: TaskFormProps) {
  const { displaySettings, gateConfig } = useFocusFlow();
  const palette = useFocusPalette();
  const insets = useSafeAreaInsets();
  const language = getAppLanguage(displaySettings);
  const t = (ja: string, en: string) => localized(language, ja, en);
  const priorities: { key: Priority; label: string; color: string }[] = [
    { key: "high", label: t("高", "High"), color: COLORS.error },
    { key: "medium", label: t("中", "Medium"), color: COLORS.warning },
    { key: "low", label: t("低", "Low"), color: COLORS.blue },
  ];
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [isRequired, setIsRequired] = useState(false);
  const [requiredWindowMode, setRequiredWindowMode] = useState<"always" | "scheduled">("always");
  const [requiredScheduleIds, setRequiredScheduleIds] = useState<string[]>([]);
  const [memo, setMemo] = useState("");
  const [subtasks, setSubtasks] = useState<TodoSubtask[]>([]);
  const [subtaskDraft, setSubtaskDraft] = useState("");
  const dueAutoRequired = useMemo(() => Boolean(dueDate && dueDate <= dayKey()), [dueDate]);
  const effectiveRequired = isRequired || dueAutoRequired;

  useLayoutEffect(() => {
    if (!visible) return;
    setTitle(todo?.title ?? "");
    setPriority(todo?.priority ?? "medium");
    setDueDate(todo?.dueDate ?? "");
    setIsRequired(todo?.isRequired ?? defaultRequired);
    setRequiredWindowMode(todo?.requiredWindowMode === "scheduled" && (todo.requiredScheduleIds?.length ?? 0) ? "scheduled" : "always");
    setRequiredScheduleIds(todo?.requiredScheduleIds ?? []);
    setMemo(todo?.memo ?? "");
    setSubtasks(todo ? getTodoSubtasks(todo) : []);
    setSubtaskDraft("");
  }, [defaultRequired, todo, visible]);

  const save = () => {
    if (!title.trim()) return;
    safeHaptic("light");
    const result = onSave({ title: title.trim(), memo: memo.trim() || undefined, priority, dueDate: dueDate || undefined, isRequired, requiredWindowMode, requiredScheduleIds, subtasks });
    if (result.ok) onClose();
  };

  const selectDate = (value?: string) => {
    setDueDate(value ?? "");
    setDatePickerOpen(false);
  };

  return <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboardAvoider}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: palette.background }]} onPress={() => undefined}>
          <View style={[styles.handle, { backgroundColor: palette.primarySoft }]} />
          <View style={styles.header}>
            <Text style={[styles.title, { color: palette.text }]}>{todo ? t("Todoを編集", "Edit task") : t("Todoを追加", "Add task")}</Text>
            <TouchableOpacity accessibilityLabel={t("閉じる", "Close")} onPress={onClose} style={[styles.closeButton, { backgroundColor: palette.elevated }]}>
              <MaterialIcons name="close" size={21} color={palette.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
            <Text style={[styles.label, { color: palette.text }]}>{t("内容", "Task")}</Text>
            <TextInput value={title} onChangeText={setTitle} autoFocus placeholder={t("たとえば、企画書の構成を作る", "For example, outline a proposal")} placeholderTextColor={palette.muted} style={[styles.input, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]} returnKeyType="done" onSubmitEditing={save} />
            <Text style={[styles.label, { color: palette.text }]}>{t("メモ", "Note")}</Text>
            <TextInput value={memo} onChangeText={setMemo} placeholder={t("補足や完了条件をメモ", "Add context or a definition of done")} placeholderTextColor={palette.muted} style={[styles.memoInput, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]} multiline textAlignVertical="top" />
            <View style={styles.subtaskHeader}><Text style={[styles.label, styles.subtaskLabel, { color: palette.text }]}>{t("サブタスク", "Subtasks")}</Text><Text style={[styles.subtaskCount, { color: palette.muted }]}>{subtasks.length}</Text></View>
            {subtasks.map((subtask) => <View key={subtask.id} style={[styles.subtaskRow, { backgroundColor: palette.surface, borderColor: palette.border }]}><TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: subtask.completed }} onPress={() => setSubtasks((items) => items.map((item) => item.id === subtask.id ? { ...item, completed: !item.completed } : item))} style={styles.subtaskCheck}><View style={[styles.subtaskBox, { borderColor: palette.border }, subtask.completed && { backgroundColor: palette.primary, borderColor: palette.primary }]}>{subtask.completed ? <MaterialIcons name="check" size={13} color={palette.isDark ? palette.background : COLORS.white} /> : null}</View></TouchableOpacity><Text style={[styles.subtaskText, { color: subtask.completed ? palette.muted : palette.text }, subtask.completed && styles.subtaskDone]} numberOfLines={2}>{subtask.title}</Text><TouchableOpacity accessibilityLabel={t("サブタスクを削除", "Delete subtask")} onPress={() => setSubtasks((items) => items.filter((item) => item.id !== subtask.id))} style={styles.subtaskDelete}><MaterialIcons name="close" size={17} color={palette.muted} /></TouchableOpacity></View>)}
            <View style={styles.subtaskAddRow}><TextInput value={subtaskDraft} onChangeText={setSubtaskDraft} placeholder={t("サブタスクを追加", "Add a subtask")} placeholderTextColor={palette.muted} style={[styles.subtaskInput, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]} returnKeyType="done" onSubmitEditing={() => { const value = subtaskDraft.trim(); if (!value) return; setSubtasks((items) => [...items, { id: createId("subtask"), title: value, completed: false }]); setSubtaskDraft(""); }} /><TouchableOpacity accessibilityLabel={t("サブタスクを追加", "Add subtask")} onPress={() => { const value = subtaskDraft.trim(); if (!value) return; setSubtasks((items) => [...items, { id: createId("subtask"), title: value, completed: false }]); setSubtaskDraft(""); }} style={[styles.subtaskAddButton, { backgroundColor: palette.primary }]}><MaterialIcons name="add" size={20} color={palette.isDark ? palette.background : COLORS.white} /></TouchableOpacity></View>
            <Text style={[styles.label, { color: palette.text }]}>{t("優先度", "Priority")}</Text>
            <View style={styles.optionRow}>{priorities.map((item) => <TouchableOpacity key={item.key} onPress={() => setPriority(item.key)} style={[styles.smallOption, { backgroundColor: palette.surface, borderColor: palette.border }, priority === item.key && { borderColor: item.color, backgroundColor: `${item.color}24` }]}><View style={[styles.priorityDot, { backgroundColor: item.color }]} /><Text style={[styles.smallOptionText, { color: palette.muted }, priority === item.key && { color: item.color }]}>{item.label}</Text></TouchableOpacity>)}</View>
            <Text style={[styles.label, { color: palette.text }]}>{t("期限", "Due date")}</Text>
            <TouchableOpacity accessibilityRole="button" onPress={() => setDatePickerOpen(true)} style={[styles.dateButton, { backgroundColor: palette.surface, borderColor: palette.border }]}><MaterialIcons name="calendar-today" size={18} color={palette.primary} /><Text style={[styles.dateText, { color: palette.text }, !dueDate && { color: palette.muted }]}>{dueDate ? formatJapaneseDate(dueDate, language) : t("必要な場合だけ選択", "Choose only if needed")}</Text><MaterialIcons name="chevron-right" size={20} color={palette.muted} /></TouchableOpacity>
            <Text style={[styles.label, { color: palette.text }]}>{t("アプリの制限", "App limits")}</Text>
            <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: effectiveRequired, disabled: dueAutoRequired }} accessibilityLabel={dueAutoRequired ? t("期限により必須です", "Required because of due date") : t("必須にする", "Make it a must-do")} onPress={() => { if (!dueAutoRequired) setIsRequired((value) => !value); }} activeOpacity={dueAutoRequired ? 1 : 0.72} style={[styles.requiredOption, { backgroundColor: palette.surface, borderColor: palette.border }, effectiveRequired && { borderColor: palette.primary, backgroundColor: palette.primarySoft }]}><View style={[styles.requiredCheck, { borderColor: palette.border }, effectiveRequired && { borderColor: palette.primary, backgroundColor: palette.primary }]}>{effectiveRequired ? <MaterialIcons name="check" size={15} color={palette.isDark ? palette.background : COLORS.white} /> : null}</View><View style={styles.requiredCopy}><Text style={[styles.requiredTitle, { color: palette.text }]}>{t("必須にする", "Make it a must-do")}</Text><Text style={[styles.requiredDetail, { color: palette.muted }]}>{dueAutoRequired ? t("今日までのTodoは必須として自動適用されます", "Tasks due today or earlier are automatically required") : effectiveRequired ? t("完了まで対象アプリの解除条件に含めます", "Included in selected-app unlock conditions until complete") : t("通常のTodoとして作成します", "Creates a regular task")}</Text></View></TouchableOpacity>
            <RequiredWindowSelector english={language === "en"} isRequired={isRequired && !dueAutoRequired} mode={requiredWindowMode} selectedIds={requiredScheduleIds} schedules={gateConfig.schedules} onChange={(mode, ids) => { setRequiredWindowMode(mode); setRequiredScheduleIds(ids); }} />
          </ScrollView>
          <View style={[styles.footer, { backgroundColor: palette.background, borderTopColor: palette.border, paddingBottom: Math.max(insets.bottom, 12) }]}>
            <TouchableOpacity accessibilityRole="button" onPress={save} activeOpacity={0.8} style={[styles.saveButton, { backgroundColor: !title.trim() ? palette.elevated : palette.primary }]} disabled={!title.trim()}><Text style={[styles.saveText, { color: !title.trim() ? palette.muted : palette.isDark ? palette.background : COLORS.white }]}>{todo ? t("変更を保存", "Save changes") : t("Todoを作成", "Create task")}</Text></TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </KeyboardAvoidingView>
    <DatePicker visible={datePickerOpen} value={dueDate || undefined} onClose={() => setDatePickerOpen(false)} onSelect={selectDate} />
  </Modal>;
}

const styles = StyleSheet.create({
  keyboardAvoider: { flex: 1 },
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(18, 42, 34, 0.38)" },
  sheet: { width: "100%", maxHeight: "94%", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20 },
  handle: { alignSelf: "center", width: 42, height: 5, borderRadius: 3, marginTop: 10, marginBottom: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  title: { fontSize: 20, lineHeight: 27, fontWeight: "800" },
  closeButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14 },
  scroll: { flexShrink: 1 },
  body: { paddingBottom: 20 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12 },
  label: { fontSize: 13, fontWeight: "800", marginBottom: 8, marginTop: 2 },
  input: { minHeight: 50, borderRadius: 14, borderWidth: 1, fontSize: 16, paddingHorizontal: 14, marginBottom: 16 },
  memoInput: { minHeight: 78, borderRadius: 14, borderWidth: 1, fontSize: 14, lineHeight: 20, paddingHorizontal: 14, paddingTop: 12, marginBottom: 16 },
  subtaskHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  subtaskLabel: { marginBottom: 8 },
  subtaskCount: { fontSize: 12, fontWeight: "800", marginBottom: 8 },
  subtaskRow: { minHeight: 42, flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, marginBottom: 6, paddingRight: 5 },
  subtaskCheck: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  subtaskBox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  subtaskText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: "700" },
  subtaskDone: { textDecorationLine: "line-through" },
  subtaskDelete: { width: 32, height: 36, alignItems: "center", justifyContent: "center" },
  subtaskAddRow: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 16 },
  subtaskInput: { flex: 1, minHeight: 44, borderRadius: 12, borderWidth: 1, fontSize: 14, paddingHorizontal: 12 },
  subtaskAddButton: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  optionRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  smallOption: { flex: 1, minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 13, borderWidth: 1, paddingHorizontal: 4 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  smallOptionText: { fontSize: 12, fontWeight: "800" },
  dateButton: { minHeight: 50, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, marginBottom: 16 },
  dateText: { flex: 1, fontSize: 15, fontWeight: "700" },
  requiredOption: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 7, marginBottom: 10 },
  requiredCheck: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  requiredCopy: { flex: 1 },
  requiredTitle: { fontSize: 14, fontWeight: "800" },
  requiredDetail: { fontSize: 11, lineHeight: 16, marginTop: 1 },
  saveButton: { minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  saveButtonDisabled: { backgroundColor: "#AAB8B0" },
  saveText: { color: COLORS.white, fontSize: 16, fontWeight: "800" },
});
