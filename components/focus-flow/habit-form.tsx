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

  useLayoutEffect(() => {
    if (visible) {
      const required = habit?.isRequired ?? defaultRequired;
      setTitle(habit?.title ?? "");
      setColor(habit?.color ?? HABIT_COLORS[0]);
      setGoal(habit?.goalPerWeek ?? 5);
      setIsRequired(required);
      setRequiredWindowMode(habit?.requiredWindowMode === "scheduled" && (habit.requiredScheduleIds?.length ?? 0) ? "scheduled" : "always");
      setRequiredScheduleIds(habit?.requiredScheduleIds ?? []);
      setProgressUnit(habit?.progressUnit ?? "check");
      setTargetValue(String(habit?.targetValue ?? 1));
    }
  }, [defaultRequired, habit, visible]);

  const save = () => {
    if (!title.trim()) return;
    safeHaptic("light");
    const result = onSave({
      title: title.trim(),
      color,
      goalPerWeek: goal,
      isRequired,
      requiredWindowMode,
      requiredScheduleIds,
      progressUnit,
      targetValue: Math.max(Number(targetValue) || 1, 1),
    });
    if (result.ok) onClose();
  };

  const remove = () => {
    if (!habit || !onDelete) return;
    const confirm = () => {
      safeHaptic("light");
      onDelete();
      onClose();
    };
    if (Platform.OS === "web") confirm();
    else Alert.alert(t("習慣を削除しますか？", "Delete habit?"), t(`「${habit.title}」の記録も削除されます。`, `The records for “${habit.title}” will also be deleted.`), [{ text: t("キャンセル", "Cancel"), style: "cancel" }, { text: t("削除", "Delete"), style: "destructive", onPress: confirm }]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboardAvoider}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={[styles.sheet, { backgroundColor: palette.background }]} onPress={() => undefined}>
            <View style={[styles.handle, { backgroundColor: palette.primarySoft }]} />
            <View style={styles.header}>
              <Text style={[styles.title, { color: palette.text }]}>{habit ? t("習慣を編集", "Edit habit") : t("習慣を作る", "Create habit")}</Text>
              <TouchableOpacity accessibilityLabel={t("閉じる", "Close")} onPress={onClose} style={[styles.closeButton, { backgroundColor: palette.elevated }]}>
                <MaterialIcons name="close" size={21} color={palette.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
              {/* Habit Name */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: palette.text }]}>{t("習慣の名前", "Habit name")}</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  autoFocus
                  placeholder={t("たとえば、朝に10分読む", "For example, read for 10 minutes")}
                  placeholderTextColor={palette.muted}
                  style={[styles.input, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]}
                  returnKeyType="done"
                  onSubmitEditing={save}
                />
              </View>

              {/* Basic Settings */}
              <View style={[styles.cardSection, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <View style={styles.cardHeader}>
                  <MaterialIcons name="tune" size={16} color={palette.primary} />
                  <Text style={[styles.cardTitle, { color: palette.text }]}>{t("基本設定", "Basic settings")}</Text>
                </View>
                <View style={styles.subField}>
                  <View style={styles.subFieldHeader}>
                    <Text style={[styles.fieldLabel, { color: palette.muted }]}>{t("週の目標", "Weekly goal")}</Text>
                    <Text style={[styles.fieldValue, { color: palette.primary }]}>{t(`${goal}日`, `${goal} days`)}</Text>
                  </View>
                  <View style={styles.optionRow}>
                    {[3, 5, 7].map((value) => (
                      <TouchableOpacity
                        key={value}
                        onPress={() => setGoal(value)}
                        style={[
                          styles.smallOption,
                          { backgroundColor: palette.elevated, borderColor: palette.border },
                          goal === value && { borderColor: palette.primary, backgroundColor: palette.primarySoft },
                        ]}
                      >
                        <Text style={[styles.smallOptionText, { color: palette.muted }, goal === value && { color: palette.primary }]}>
                          {t(`${value}日`, `${value} days`)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.subField}>
                  <Text style={[styles.fieldLabel, { color: palette.muted }]}>{t("色", "Color")}</Text>
                  <View style={styles.colorRow}>
                    {HABIT_COLORS.map((item) => (
                      <TouchableOpacity
                        key={item}
                        accessibilityLabel={t("習慣の色を選択", "Choose habit color")}
                        onPress={() => setColor(item)}
                        style={[styles.colorButton, { backgroundColor: item, borderColor: item }, color === item && { borderColor: palette.text }]}
                      >
                        {color === item ? <MaterialIcons name="check" size={14} color={COLORS.white} /> : null}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Completion Criteria (Goals) */}
              <View style={[styles.cardSection, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <View style={styles.cardHeader}>
                  <MaterialIcons name="flag" size={16} color={palette.primary} />
                  <Text style={[styles.cardTitle, { color: palette.text }]}>{t("達成基準", "Completion criteria")}</Text>
                </View>
                <View style={styles.segmentRow}>
                  {units.map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      onPress={() => setProgressUnit(item.key)}
                      style={[
                        styles.segment,
                        { backgroundColor: palette.elevated, borderColor: palette.border },
                        progressUnit === item.key && { borderColor: palette.primary, backgroundColor: palette.primarySoft },
                      ]}
                    >
                      <Text style={[styles.segmentText, { color: palette.muted }, progressUnit === item.key && { color: palette.primary }]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {progressUnit !== "check" ? (
                  <View style={[styles.targetRow, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
                    <Text style={[styles.targetText, { color: palette.text }]}>{t("1日の目標", "Daily target")}</Text>
                    <View style={styles.targetInputWrapper}>
                      <TextInput
                        value={targetValue}
                        onChangeText={setTargetValue}
                        keyboardType="number-pad"
                        style={[styles.targetInput, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]}
                      />
                      <Text style={[styles.targetUnit, { color: palette.muted }]}>{progressUnit === "minutes" ? t("分", "min") : t("回", "times")}</Text>
                    </View>
                  </View>
                ) : null}
              </View>

              {/* App Limits and Must-do */}
              <View style={[styles.cardSection, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <View style={styles.cardHeader}>
                  <MaterialIcons name="shield" size={16} color={palette.primary} />
                  <Text style={[styles.cardTitle, { color: palette.text }]}>{t("実行条件（アプリ制限）", "Execution & App limits")}</Text>
                </View>
                <TouchableOpacity
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isRequired }}
                  onPress={() => setIsRequired((value) => !value)}
                  style={[
                    styles.requiredOption,
                    { backgroundColor: palette.elevated, borderColor: palette.border },
                    isRequired && { borderColor: palette.primary, backgroundColor: palette.primarySoft },
                  ]}
                >
                  <View style={[styles.requiredCheck, { borderColor: palette.border }, isRequired && { borderColor: palette.primary, backgroundColor: palette.primary }]}>
                    {isRequired ? <MaterialIcons name="check" size={15} color={palette.isDark ? palette.background : COLORS.white} /> : null}
                  </View>
                  <View style={styles.requiredCopy}>
                    <Text style={[styles.requiredTitle, { color: palette.text }]}>{t("必須にする", "Make it a must-do")}</Text>
                    <Text style={[styles.requiredDetail, { color: palette.muted }]}>
                      {isRequired
                        ? t("今日の目標達成まで対象アプリの解除条件に含めます", "Included in selected-app unlock conditions until today's goal is met")
                        : t("通常の習慣として作成します", "Creates a regular habit")}
                    </Text>
                  </View>
                </TouchableOpacity>
                {isRequired ? (
                  <View style={styles.requiredSelectorWrapper}>
                    <RequiredWindowSelector
                      english={language === "en"}
                      isRequired={isRequired}
                      mode={requiredWindowMode}
                      selectedIds={requiredScheduleIds}
                      schedules={gateConfig.schedules}
                      onChange={(mode, ids) => {
                        setRequiredWindowMode(mode);
                        setRequiredScheduleIds(ids);
                      }}
                    />
                  </View>
                ) : null}
              </View>
            </ScrollView>
            <View style={[styles.footer, { backgroundColor: palette.background, borderTopColor: palette.border, paddingBottom: Math.max(insets.bottom, 12) }]}>
              {habit && onDelete ? (
                <TouchableOpacity accessibilityRole="button" onPress={remove} activeOpacity={0.8} style={[styles.deleteButton, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
                  <MaterialIcons name="delete-outline" size={18} color={COLORS.error} />
                  <Text style={[styles.deleteButtonText, { color: COLORS.error }]}>{t("習慣を削除", "Delete habit")}</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                accessibilityRole="button"
                onPress={save}
                activeOpacity={0.8}
                style={[styles.saveButton, { backgroundColor: !title.trim() ? palette.elevated : palette.primary }]}
                disabled={!title.trim()}
              >
                <Text style={[styles.saveText, { color: !title.trim() ? palette.muted : palette.isDark ? palette.background : COLORS.white }]}>
                  {habit ? t("変更を保存", "Save changes") : t("習慣を作る", "Create habit")}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoider: { flex: 1 },
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(18, 42, 34, 0.38)" },
  sheet: { width: "100%", maxHeight: "94%", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20 },
  handle: { alignSelf: "center", width: 42, height: 5, borderRadius: 3, marginTop: 10, marginBottom: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  title: { fontSize: 20, lineHeight: 26, fontWeight: "800" },
  closeButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  scroll: { flexShrink: 1 },
  body: { paddingBottom: 16, gap: 10 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, gap: 8 },
  section: { marginBottom: 2 },
  sectionTitle: { fontSize: 12, fontWeight: "800", marginBottom: 6, marginTop: 2 },
  input: { minHeight: 46, borderRadius: 13, borderWidth: 1, fontSize: 15, paddingHorizontal: 13 },
  cardSection: { borderRadius: 16, borderWidth: 1, padding: 12, gap: 8 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  cardTitle: { fontSize: 13, fontWeight: "800" },
  subField: { gap: 4 },
  subFieldHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  fieldLabel: { fontSize: 11, fontWeight: "700" },
  fieldValue: { fontSize: 11, fontWeight: "800" },
  optionRow: { flexDirection: "row", gap: 6 },
  smallOption: { flex: 1, minHeight: 38, alignItems: "center", justifyContent: "center", borderRadius: 10, borderWidth: 1, paddingHorizontal: 3 },
  smallOptionText: { fontSize: 11, fontWeight: "800" },
  colorRow: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 2 },
  colorButton: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  segmentRow: { flexDirection: "row", gap: 5 },
  segment: { flex: 1, minHeight: 38, alignItems: "center", justifyContent: "center", borderRadius: 10, borderWidth: 1, paddingHorizontal: 3 },
  segmentText: { fontSize: 11, textAlign: "center", fontWeight: "800" },
  targetRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, marginTop: 2 },
  targetText: { fontSize: 12, fontWeight: "800" },
  targetInputWrapper: { flexDirection: "row", alignItems: "center", gap: 6 },
  targetInput: { width: 60, minHeight: 36, borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, fontSize: 14, fontWeight: "700", textAlign: "center" },
  targetUnit: { fontSize: 12, fontWeight: "700" },
  requiredOption: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 9, borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  requiredCheck: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  requiredCopy: { flex: 1 },
  requiredTitle: { fontSize: 13, fontWeight: "800" },
  requiredDetail: { fontSize: 10, lineHeight: 14, marginTop: 1 },
  requiredSelectorWrapper: { marginTop: 2 },
  saveButton: { minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 14 },
  saveText: { color: COLORS.white, fontSize: 15, fontWeight: "800" },
  deleteButton: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderWidth: 1, borderRadius: 13 },
  deleteButtonText: { fontSize: 13, fontWeight: "800" },
});
