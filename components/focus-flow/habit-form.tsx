import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLayoutEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getAppLanguage, localized } from "@/lib/focus-flow/i18n";
import { useFocusFlow } from "@/lib/focus-flow/provider";
import type { Habit, ProgressUnit } from "@/lib/focus-flow/types";
import { RequiredWindowSelector } from "./required-window-selector";
import { ScaledText as Text } from "./scaled-text";
import { COLORS, HABIT_COLORS, safeHaptic, useFocusPalette } from "./ui";

type HabitInput = { title: string; color: string; goalPerWeek: number; isRequired: boolean; requiredWindowMode: "always" | "scheduled"; requiredScheduleIds: string[]; progressUnit: ProgressUnit; targetValue: number };
type HabitFormProps = { visible: boolean; habit?: Habit; defaultRequired?: boolean; onClose: () => void; onSave: (input: HabitInput) => { ok: boolean }; onDelete?: () => void };

export function HabitForm({ visible, habit, defaultRequired = false, onClose, onSave, onDelete }: HabitFormProps) {
  const { displaySettings, gateConfig } = useFocusFlow();
  const palette = useFocusPalette();
  const insets = useSafeAreaInsets();
  const language = getAppLanguage(displaySettings);
  const t = (ja: string, en: string) => localized(language, ja, en);
  const units: { key: ProgressUnit; label: string }[] = [{ key: "check", label: t("完了チェック", "Check off") }, { key: "count", label: t("回数", "Count") }, { key: "minutes", label: t("分", "Minutes") }];
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const [goal, setGoal] = useState(5);
  const [isRequired, setIsRequired] = useState(false);
  const [requiredWindowMode, setRequiredWindowMode] = useState<"always" | "scheduled">("always");
  const [requiredScheduleIds, setRequiredScheduleIds] = useState<string[]>([]);
  const [progressUnit, setProgressUnit] = useState<ProgressUnit>("check");
  const [targetValue, setTargetValue] = useState("1");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [limitsOpen, setLimitsOpen] = useState(false);

  useLayoutEffect(() => { if (visible) { const required = habit?.isRequired ?? defaultRequired; setTitle(habit?.title ?? ""); setColor(habit?.color ?? HABIT_COLORS[0]); setGoal(habit?.goalPerWeek ?? 5); setIsRequired(required); setRequiredWindowMode(habit?.requiredWindowMode === "scheduled" && (habit.requiredScheduleIds?.length ?? 0) ? "scheduled" : "always"); setRequiredScheduleIds(habit?.requiredScheduleIds ?? []); setProgressUnit(habit?.progressUnit ?? "check"); setTargetValue(String(habit?.targetValue ?? 1)); setDetailsOpen(Boolean(habit?.progressUnit && habit.progressUnit !== "check")); setLimitsOpen(required); } }, [defaultRequired, habit, visible]);
  const save = () => { if (!title.trim()) return; safeHaptic("light"); const result = onSave({ title: title.trim(), color, goalPerWeek: goal, isRequired, requiredWindowMode, requiredScheduleIds, progressUnit, targetValue: Math.max(Number(targetValue) || 1, 1) }); if (result.ok) onClose(); };
  const remove = () => { if (!habit || !onDelete) return; const confirm = () => { safeHaptic("light"); onDelete(); onClose(); }; if (Platform.OS === "web") confirm(); else Alert.alert(t("習慣を削除しますか？", "Delete habit?"), t(`「${habit.title}」の記録も削除されます。`, `The records for “${habit.title}” will also be deleted.`), [{ text: t("キャンセル", "Cancel"), style: "cancel" }, { text: t("削除", "Delete"), style: "destructive", onPress: confirm }]); };

  return <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}><KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboardAvoider}><Pressable style={styles.backdrop} onPress={onClose}><Pressable style={[styles.sheet, { backgroundColor: palette.background }]} onPress={() => undefined}><View style={[styles.handle, { backgroundColor: palette.primarySoft }]} /><View style={styles.header}><Text style={[styles.title, { color: palette.text }]}>{habit ? t("習慣を編集", "Edit habit") : t("習慣を作る", "Create habit")}</Text><TouchableOpacity accessibilityLabel={t("閉じる", "Close")} onPress={onClose} style={[styles.closeButton, { backgroundColor: palette.elevated }]}><MaterialIcons name="close" size={21} color={palette.muted} /></TouchableOpacity></View><ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
    <Text style={[styles.label, { color: palette.text }]}>{t("習慣の名前", "Habit name")}</Text>
    <TextInput value={title} onChangeText={setTitle} autoFocus placeholder={t("たとえば、朝に10分読む", "For example, read for 10 minutes")} placeholderTextColor={palette.muted} style={[styles.input, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]} returnKeyType="done" onSubmitEditing={save} />

    <View style={styles.compactSection}>
      <View style={styles.sectionHeader}><Text style={[styles.compactLabel, { color: palette.muted }]}>{t("週の目標", "Weekly goal")}</Text><Text style={[styles.selectionHint, { color: palette.primary }]}>{t(`${goal}日`, `${goal} days`)}</Text></View>
      <View style={styles.optionRow}>{[3, 5, 7].map((value) => <TouchableOpacity key={value} onPress={() => setGoal(value)} style={[styles.smallOption, { backgroundColor: palette.surface, borderColor: palette.border }, goal === value && { borderColor: palette.primary, backgroundColor: palette.primarySoft }]}><Text style={[styles.smallOptionText, { color: palette.muted }, goal === value && { color: palette.primary }]}>{t(`${value}日`, `${value} days`)}</Text></TouchableOpacity>)}</View>
      <View style={styles.sectionHeader}><Text style={[styles.compactLabel, { color: palette.muted }]}>{t("色", "Color")}</Text></View>
      <View style={styles.colorRow}>{HABIT_COLORS.map((item) => <TouchableOpacity key={item} accessibilityLabel={t("習慣の色を選択", "Choose habit color")} onPress={() => setColor(item)} style={[styles.colorButton, { backgroundColor: item, borderColor: item }, color === item && { borderColor: palette.text }]}>{color === item ? <MaterialIcons name="check" size={14} color={COLORS.white} /> : null}</TouchableOpacity>)}</View>
    </View>

    <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: limitsOpen }} onPress={() => setLimitsOpen((value) => !value)} style={[styles.disclosureRow, { backgroundColor: palette.elevated }]}><MaterialIcons name="shield" size={18} color={palette.primary} /><View style={styles.disclosureCopy}><Text style={[styles.disclosureTitle, { color: palette.text }]}>{isRequired ? t("必須の習慣", "Must-do habit") : t("アプリの制限", "App limits")}</Text><Text style={[styles.disclosurePreview, { color: palette.muted }]}>{isRequired ? t("解除条件に含まれています", "Included in unlock conditions") : t("通常の習慣として設定", "Use as a regular habit")}</Text></View><MaterialIcons name={limitsOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={20} color={palette.muted} /></TouchableOpacity>
    {limitsOpen ? <View style={styles.limitsContent}><TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: isRequired }} onPress={() => setIsRequired((value) => !value)} style={[styles.requiredOption, { backgroundColor: palette.surface, borderColor: palette.border }, isRequired && { borderColor: palette.primary, backgroundColor: palette.primarySoft }]}><View style={[styles.requiredCheck, { borderColor: palette.border }, isRequired && { borderColor: palette.primary, backgroundColor: palette.primary }]}>{isRequired ? <MaterialIcons name="check" size={15} color={palette.isDark ? palette.background : COLORS.white} /> : null}</View><View style={styles.requiredCopy}><Text style={[styles.requiredTitle, { color: palette.text }]}>{t("必須にする", "Make it a must-do")}</Text><Text style={[styles.requiredDetail, { color: palette.muted }]}>{isRequired ? t("今日の目標達成まで対象アプリの解除条件に含めます", "Included in selected-app unlock conditions until today's goal is met") : t("通常の習慣として作成します", "Creates a regular habit")}</Text></View></TouchableOpacity><RequiredWindowSelector english={language === "en"} isRequired={isRequired} mode={requiredWindowMode} selectedIds={requiredScheduleIds} schedules={gateConfig.schedules} onChange={(mode, ids) => { setRequiredWindowMode(mode); setRequiredScheduleIds(ids); }} /></View> : null}

    <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: detailsOpen }} onPress={() => setDetailsOpen((value) => !value)} style={[styles.detailsToggle, { backgroundColor: palette.elevated }]}><MaterialIcons name={detailsOpen ? "tune" : "tune"} size={18} color={palette.primary} /><Text style={[styles.detailsText, { color: palette.primary }]}>{detailsOpen ? t("数値目標を閉じる", "Hide numeric goal") : t("回数・時間の目標を設定", "Set a count or time goal")}</Text><MaterialIcons name={detailsOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={20} color={palette.muted} /></TouchableOpacity>{detailsOpen ? <View style={[styles.details, { backgroundColor: palette.elevated }]}><Text style={[styles.label, { color: palette.text }]}>{t("今日の達成基準", "Today's completion")}</Text><View style={styles.segmentRow}>{units.map((item) => <TouchableOpacity key={item.key} onPress={() => setProgressUnit(item.key)} style={[styles.segment, { backgroundColor: palette.surface, borderColor: palette.border }, progressUnit === item.key && { borderColor: palette.primary, backgroundColor: palette.primarySoft }]}><Text style={[styles.segmentText, { color: palette.muted }, progressUnit === item.key && { color: palette.primary }]}>{item.label}</Text></TouchableOpacity>)}</View>{progressUnit !== "check" ? <View style={styles.targetRow}><Text style={[styles.targetText, { color: palette.text }]}>{t("1日の目標", "Daily target")}</Text><TextInput value={targetValue} onChangeText={setTargetValue} keyboardType="number-pad" style={[styles.targetInput, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]} /><Text style={[styles.targetText, { color: palette.text }]}>{progressUnit === "minutes" ? t("分", "min") : t("回", "times")}</Text></View> : null}</View> : null}
  </ScrollView><View style={[styles.footer, { backgroundColor: palette.background, borderTopColor: palette.border, paddingBottom: Math.max(insets.bottom, 12) }]}>{habit && onDelete ? <TouchableOpacity accessibilityRole="button" onPress={remove} style={[styles.deleteButton, { borderColor: palette.border }]}><MaterialIcons name="delete-outline" size={18} color={COLORS.error} /><Text style={[styles.deleteButtonText, { color: COLORS.error }]}>{t("この習慣を削除", "Delete habit")}</Text></TouchableOpacity> : null}<TouchableOpacity accessibilityRole="button" onPress={save} activeOpacity={0.8} style={[styles.saveButton, { backgroundColor: !title.trim() ? palette.elevated : palette.primary }]} disabled={!title.trim()}><Text style={[styles.saveText, { color: !title.trim() ? palette.muted : palette.isDark ? palette.background : COLORS.white }]}>{habit ? t("変更を保存", "Save changes") : t("習慣を作る", "Create habit")}</Text></TouchableOpacity></View></Pressable></Pressable></KeyboardAvoidingView></Modal>;
}

const styles = StyleSheet.create({
  keyboardAvoider: { flex: 1 },
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(18, 42, 34, 0.38)" },
  sheet: { width: "100%", maxHeight: "94%", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20 },
  handle: { alignSelf: "center", width: 42, height: 5, borderRadius: 3, marginTop: 10, marginBottom: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  title: { fontSize: 20, lineHeight: 27, fontWeight: "800" },
  closeButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14 },
  scroll: { flexShrink: 1 },
  body: { paddingBottom: 16 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, gap: 8 },
  label: { fontSize: 12, fontWeight: "800", marginBottom: 6, marginTop: 2 },
  input: { minHeight: 48, borderRadius: 13, borderWidth: 1, fontSize: 16, paddingHorizontal: 13, marginBottom: 10 },
  compactSection: { marginBottom: 4 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  compactLabel: { fontSize: 11, fontWeight: "800", marginBottom: 5, marginTop: 1 },
  selectionHint: { fontSize: 11, fontWeight: "800", marginBottom: 5 },
  optionRow: { flexDirection: "row", gap: 6, marginBottom: 9 },
  smallOption: { flex: 1, minHeight: 40, alignItems: "center", justifyContent: "center", borderRadius: 11, borderWidth: 1, paddingHorizontal: 3 },
  smallOptionText: { fontSize: 11, fontWeight: "800" },
  colorRow: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 7 },
  colorButton: { width: 29, height: 29, borderRadius: 15, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  disclosureRow: { minHeight: 46, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, paddingHorizontal: 12, marginBottom: 7 },
  disclosureCopy: { flex: 1, minWidth: 0 },
  disclosureTitle: { fontSize: 13, lineHeight: 18, fontWeight: "800" },
  disclosurePreview: { fontSize: 10, lineHeight: 14, marginTop: 1 },
  limitsContent: { marginBottom: 3 },
  requiredOption: { minHeight: 55, flexDirection: "row", alignItems: "center", gap: 9, borderRadius: 13, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 8 },
  requiredCheck: { width: 21, height: 21, borderRadius: 6, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  requiredCopy: { flex: 1 },
  requiredTitle: { fontSize: 13, fontWeight: "800" },
  requiredDetail: { fontSize: 10, lineHeight: 15, marginTop: 1 },
  detailsToggle: { minHeight: 45, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, paddingHorizontal: 12, marginBottom: 7 },
  detailsText: { flex: 1, fontSize: 13, fontWeight: "800" },
  details: { borderRadius: 14, padding: 10, marginBottom: 10 },
  segmentRow: { flexDirection: "row", gap: 5, marginBottom: 10 },
  segment: { flex: 1, minHeight: 41, alignItems: "center", justifyContent: "center", borderRadius: 10, borderWidth: 1, paddingHorizontal: 3 },
  segmentText: { fontSize: 10, textAlign: "center", fontWeight: "800" },
  targetRow: { minHeight: 42, flexDirection: "row", alignItems: "center", gap: 7 },
  targetText: { fontSize: 12, fontWeight: "800" },
  targetInput: { width: 66, minHeight: 38, borderRadius: 10, borderWidth: 1, paddingHorizontal: 9, fontSize: 14, fontWeight: "700" },
  saveButton: { minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: 15 },
  deleteButton: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderWidth: 1, borderRadius: 13 },
  deleteButtonText: { fontSize: 13, fontWeight: "800" },
  saveText: { color: COLORS.white, fontSize: 15, fontWeight: "800" },
});
