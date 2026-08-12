import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import type { Priority, Todo } from "@/lib/focus-flow/types";
import { formatJapaneseDate } from "@/lib/focus-flow/utils";
import { DatePicker } from "./date-picker";
import { COLORS, safeHaptic } from "./ui";

const PRIORITIES: { key: Priority; label: string; color: string }[] = [
  { key: "high", label: "高", color: COLORS.error },
  { key: "medium", label: "中", color: COLORS.warning },
  { key: "low", label: "低", color: COLORS.blue },
];

type TaskFormProps = {
  visible: boolean;
  todo?: Todo;
  onClose: () => void;
  onSave: (input: { title: string; priority: Priority; dueDate?: string; isRequired: boolean }) => void;
};

export function TaskForm({ visible, todo, onClose, onSave }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [isRequired, setIsRequired] = useState(false);

  useEffect(() => {
    if (visible) {
      setTitle(todo?.title ?? "");
      setPriority(todo?.priority ?? "medium");
      setDueDate(todo?.dueDate ?? "");
      setIsRequired(todo?.isRequired ?? false);
    }
  }, [todo, visible]);

  const save = () => {
    if (!title.trim()) return;
    safeHaptic("light");
    onSave({ title: title.trim(), priority, dueDate: dueDate || undefined, isRequired });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{todo ? "Todoを編集" : "Todoを追加"}</Text>
            <TouchableOpacity accessibilityLabel="閉じる" onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={21} color={COLORS.muted} />
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>内容</Text>
          <TextInput value={title} onChangeText={setTitle} autoFocus placeholder="たとえば、企画書の構成を作る" placeholderTextColor="#94A19A" style={styles.input} returnKeyType="done" onSubmitEditing={save} />
          <Text style={styles.label}>優先度</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map((item) => (
              <TouchableOpacity key={item.key} onPress={() => setPriority(item.key)} style={[styles.priorityButton, priority === item.key && { borderColor: item.color, backgroundColor: `${item.color}12` }]}>
                <View style={[styles.priorityDot, { backgroundColor: item.color }]} />
                <Text style={[styles.priorityText, priority === item.key && { color: item.color }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>期限（任意）</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="期限をカレンダーから選択" onPress={() => setDatePickerOpen(true)} style={styles.dateButton}><MaterialIcons name="calendar-today" size={18} color={COLORS.forest} /><Text style={[styles.dateText, !dueDate && styles.datePlaceholder]}>{dueDate ? formatJapaneseDate(dueDate) : "カレンダーから選択"}</Text><MaterialIcons name="chevron-right" size={20} color={COLORS.muted} /></TouchableOpacity>
          <Text style={styles.label}>アプリの制限</Text>
          <View style={styles.requiredChoice}><TouchableOpacity onPress={() => setIsRequired(true)} style={[styles.requiredOption, isRequired && styles.requiredOptionSelected]}><MaterialIcons name="lock" size={18} color={isRequired ? COLORS.forest : COLORS.muted} /><View style={styles.requiredCopy}><Text style={[styles.requiredTitle, isRequired && { color: COLORS.forest }]}>必須Todoにする</Text><Text style={styles.requiredDetail}>未完了の間、選択したアプリを使えません</Text></View>{isRequired ? <MaterialIcons name="check-circle" size={20} color={COLORS.forest} /> : null}</TouchableOpacity><TouchableOpacity onPress={() => setIsRequired(false)} style={[styles.requiredOption, !isRequired && styles.requiredOptionSelected]}><MaterialIcons name="check-circle-outline" size={18} color={!isRequired ? COLORS.blue : COLORS.muted} /><View style={styles.requiredCopy}><Text style={[styles.requiredTitle, !isRequired && { color: COLORS.blue }]}>通常のTodoにする</Text><Text style={styles.requiredDetail}>アプリの制限には影響しません</Text></View>{!isRequired ? <MaterialIcons name="check-circle" size={20} color={COLORS.blue} /> : null}</TouchableOpacity></View>
          <TouchableOpacity accessibilityRole="button" onPress={save} activeOpacity={0.8} style={[styles.saveButton, !title.trim() && styles.saveButtonDisabled]} disabled={!title.trim()}>
            <Text style={styles.saveText}>{todo ? "変更を保存" : "Todoを作成"}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
      <DatePicker visible={datePickerOpen} value={dueDate || undefined} onClose={() => setDatePickerOpen(false)} onSelect={(value) => setDueDate(value ?? "")} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(18, 42, 34, 0.38)" },
  sheet: { backgroundColor: COLORS.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: 34 },
  handle: { alignSelf: "center", width: 42, height: 5, borderRadius: 3, backgroundColor: "#C7D1CB", marginTop: 10, marginBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22 },
  title: { color: COLORS.text, fontSize: 20, lineHeight: 27, fontWeight: "800" },
  closeButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#EDF1EE" },
  label: { color: COLORS.text, fontSize: 13, fontWeight: "800", marginBottom: 8, marginTop: 2 },
  input: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, color: COLORS.text, fontSize: 16, paddingHorizontal: 14, marginBottom: 18 },
  dateButton: { minHeight: 50, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, paddingHorizontal: 14, marginBottom: 18 },
  dateText: { color: COLORS.text, flex: 1, fontSize: 15, fontWeight: "700" },
  datePlaceholder: { color: "#94A19A", fontWeight: "600" },
  requiredChoice: { gap: 8, marginBottom: 18 },
  requiredOption: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, paddingHorizontal: 13 },
  requiredOptionSelected: { borderColor: COLORS.forest, backgroundColor: "#EEF6F1" },
  requiredCopy: { flex: 1 },
  requiredTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  requiredDetail: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 2 },
  priorityRow: { flexDirection: "row", gap: 8, marginBottom: 18 },
  priorityButton: { flex: 1, minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 13, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  priorityText: { color: COLORS.muted, fontSize: 14, fontWeight: "800" },
  saveButton: { minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: COLORS.forest, marginTop: 4 },
  saveButtonDisabled: { backgroundColor: "#AAB8B0" },
  saveText: { color: COLORS.white, fontSize: 16, fontWeight: "800" },
});
