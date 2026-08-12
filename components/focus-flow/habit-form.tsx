import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import type { Habit } from "@/lib/focus-flow/types";
import { COLORS, HABIT_COLORS, safeHaptic } from "./ui";

type HabitFormProps = {
  visible: boolean;
  habit?: Habit;
  onClose: () => void;
  onSave: (input: { title: string; color: string; goalPerWeek: number; isRequired: boolean }) => void;
};

export function HabitForm({ visible, habit, onClose, onSave }: HabitFormProps) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const [goal, setGoal] = useState(5);
  const [isRequired, setIsRequired] = useState(false);

  useEffect(() => {
    if (visible) {
      setTitle(habit?.title ?? "");
      setColor(habit?.color ?? HABIT_COLORS[0]);
      setGoal(habit?.goalPerWeek ?? 5);
      setIsRequired(habit?.isRequired ?? false);
    }
  }, [habit, visible]);

  const save = () => {
    if (!title.trim()) return;
    safeHaptic("light");
    onSave({ title: title.trim(), color, goalPerWeek: goal, isRequired });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{habit ? "習慣を編集" : "習慣を作る"}</Text>
            <TouchableOpacity accessibilityLabel="閉じる" onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={21} color={COLORS.muted} />
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>習慣の名前</Text>
          <TextInput value={title} onChangeText={setTitle} autoFocus placeholder="たとえば、朝に10分読む" placeholderTextColor="#94A19A" style={styles.input} returnKeyType="done" onSubmitEditing={save} />
          <Text style={styles.label}>週の目標日数</Text>
          <View style={styles.goalRow}>
            {[3, 5, 7].map((value) => (
              <TouchableOpacity key={value} onPress={() => setGoal(value)} style={[styles.goalButton, goal === value && styles.goalButtonSelected]}>
                <Text style={[styles.goalText, goal === value && styles.goalTextSelected]}>{value}日</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>色</Text>
          <View style={styles.colorRow}>
            {HABIT_COLORS.map((item) => (
              <TouchableOpacity key={item} accessibilityLabel="習慣の色を選択" onPress={() => setColor(item)} style={[styles.colorButton, { backgroundColor: item }, color === item && styles.colorButtonSelected]}>
                {color === item ? <MaterialIcons name="check" size={18} color={COLORS.white} /> : null}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>アプリ制限との関係</Text>
          <View style={styles.requiredChoice}><TouchableOpacity onPress={() => setIsRequired(true)} style={[styles.requiredOption, isRequired && styles.requiredOptionSelected]}><MaterialIcons name="lock" size={18} color={isRequired ? COLORS.forest : COLORS.muted} /><View style={styles.requiredCopy}><Text style={[styles.requiredTitle, isRequired && { color: COLORS.forest }]}>必須の習慣</Text><Text style={styles.requiredDetail}>集中ルール中の基本解除条件にする</Text></View>{isRequired ? <MaterialIcons name="check-circle" size={20} color={COLORS.forest} /> : null}</TouchableOpacity><TouchableOpacity onPress={() => setIsRequired(false)} style={[styles.requiredOption, !isRequired && styles.requiredOptionSelected]}><MaterialIcons name="check-circle-outline" size={18} color={!isRequired ? COLORS.blue : COLORS.muted} /><View style={styles.requiredCopy}><Text style={[styles.requiredTitle, !isRequired && { color: COLORS.blue }]}>任意の習慣</Text><Text style={styles.requiredDetail}>日課ルールで選んだ時だけ解除条件にする</Text></View>{!isRequired ? <MaterialIcons name="check-circle" size={20} color={COLORS.blue} /> : null}</TouchableOpacity></View>
          <TouchableOpacity accessibilityRole="button" onPress={save} activeOpacity={0.8} style={[styles.saveButton, !title.trim() && styles.saveButtonDisabled]} disabled={!title.trim()}>
            <Text style={styles.saveText}>{habit ? "変更を保存" : "習慣を作成"}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
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
  goalRow: { flexDirection: "row", gap: 8, marginBottom: 18 },
  goalButton: { flex: 1, minHeight: 46, alignItems: "center", justifyContent: "center", borderRadius: 13, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white },
  goalButtonSelected: { borderColor: COLORS.forest, backgroundColor: "#E8F0EC" },
  goalText: { color: COLORS.muted, fontSize: 14, fontWeight: "800" },
  goalTextSelected: { color: COLORS.forest },
  colorRow: { flexDirection: "row", gap: 12, marginBottom: 18 },
  colorButton: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  colorButtonSelected: { borderWidth: 3, borderColor: COLORS.white, outlineWidth: 2, outlineColor: COLORS.forest },
  requiredChoice: { gap: 8, marginBottom: 20 },
  requiredOption: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, paddingHorizontal: 13 },
  requiredOptionSelected: { borderColor: COLORS.forest, backgroundColor: "#EEF6F1" },
  requiredCopy: { flex: 1 },
  requiredTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  requiredDetail: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 2 },
  saveButton: { minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: COLORS.forest },
  saveButtonDisabled: { backgroundColor: "#AAB8B0" },
  saveText: { color: COLORS.white, fontSize: 16, fontWeight: "800" },
});
