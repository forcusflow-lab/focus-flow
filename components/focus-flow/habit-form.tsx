import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useRef } from "react";
import { useLayoutEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getAppLanguage, localized } from "@/lib/focus-flow/i18n";
import { useFocusFlow } from "@/lib/focus-flow/provider";
import type { Habit, ProgressUnit } from "@/lib/focus-flow/types";
import { RequiredWindowSelector } from "./required-window-selector";
import { ScaledText as Text } from "./scaled-text";
import { COLORS, HABIT_COLORS, safeHaptic, useFocusPalette } from "./ui";

type HabitInput = {
  title: string;
  color: string;
  goalPerWeek: number;
  targetDays?: number[];
  isRequired: boolean;
  requiredWindowMode: "always" | "scheduled";
  requiredScheduleIds: string[];
  progressUnit: ProgressUnit;
  targetValue: number;
};
type HabitFormProps = { visible: boolean; habit?: Habit; defaultRequired?: boolean; onClose: () => void; onSave: (input: HabitInput) => { ok: boolean }; onDelete?: () => void };

const WEEKDAYS = [
  { day: 1, label: "月", en: "M" },
  { day: 2, label: "火", en: "T" },
  { day: 3, label: "水", en: "W" },
  { day: 4, label: "木", en: "T" },
  { day: 5, label: "金", en: "F" },
  { day: 6, label: "土", en: "S" },
  { day: 0, label: "日", en: "S" },
] as const;

const EVERYDAY = [1, 2, 3, 4, 5, 6, 0];
const WEEKDAYS_ONLY = [1, 2, 3, 4, 5];
const WEEKEND_ONLY = [6, 0];

const MINUTE_PRESETS = [10, 15, 30, 60] as const;

export function HabitForm({ visible, habit, defaultRequired = false, onClose, onSave, onDelete }: HabitFormProps) {
  const { displaySettings, gateConfig } = useFocusFlow();
  const palette = useFocusPalette();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const isSubmitting = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const language = getAppLanguage(displaySettings);
  const t = (ja: string, en: string) => localized(language, ja, en);
  const units: { key: ProgressUnit; label: string }[] = [{ key: "check", label: t("完了チェック", "Check off") }, { key: "count", label: t("回数", "Count") }, { key: "minutes", label: t("分", "Minutes") }];
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const [targetDays, setTargetDays] = useState<number[]>(EVERYDAY);
  const [isRequired, setIsRequired] = useState(false);
  const [requiredWindowMode, setRequiredWindowMode] = useState<"always" | "scheduled">("always");
  const [requiredScheduleIds, setRequiredScheduleIds] = useState<string[]>([]);
  const [progressUnit, setProgressUnit] = useState<ProgressUnit>("check");
  const [targetValue, setTargetValue] = useState("15");
  const [customMinutesMode, setCustomMinutesMode] = useState(false);
  const [colorSectionOpen, setColorSectionOpen] = useState(false);

  useLayoutEffect(() => {
    if (visible) {
      isSubmitting.current = false;
      setIsSaving(false);
      const required = habit?.isRequired ?? defaultRequired;
      setTitle(habit?.title ?? "");
      setColor(habit?.color ?? HABIT_COLORS[0]);
      setTargetDays(habit?.targetDays && habit.targetDays.length > 0 ? habit.targetDays : EVERYDAY);
      setIsRequired(required);
      setRequiredWindowMode(habit?.requiredWindowMode === "scheduled" && (habit.requiredScheduleIds?.length ?? 0) ? "scheduled" : "always");
      setRequiredScheduleIds(habit?.requiredScheduleIds ?? []);
      const unit = habit?.progressUnit ?? "check";
      setProgressUnit(unit);
      const initialTarget = habit?.targetValue ?? (unit === "minutes" ? 15 : 1);
      setTargetValue(String(initialTarget));
      setCustomMinutesMode(unit === "minutes" && !MINUTE_PRESETS.includes(initialTarget as any));
      setColorSectionOpen(false);
    }
  }, [defaultRequired, habit, visible]);

  const isEveryday = targetDays.length === 7;
  const isWeekdays = targetDays.length === 5 && WEEKDAYS_ONLY.every((d) => targetDays.includes(d));
  const isWeekend = targetDays.length === 2 && WEEKEND_ONLY.every((d) => targetDays.includes(d));

  const toggleDay = (day: number) => {
    safeHaptic("light");
    setTargetDays((prev) => {
      if (prev.includes(day)) {
        if (prev.length <= 1) return prev;
        return prev.filter((d) => d !== day);
      } else {
        return [...prev, day].sort((a, b) => ((a === 0 ? 7 : a) - (b === 0 ? 7 : b)));
      }
    });
  };

  const selectPreset = (preset: readonly number[]) => {
    safeHaptic("light");
    setTargetDays([...preset]);
  };

  const save = () => {
    if (isSubmitting.current || !title.trim()) return;
    isSubmitting.current = true;
    setIsSaving(true);
    safeHaptic("light");
    try {
      const result = onSave({
        title: title.trim(),
        color,
        goalPerWeek: targetDays.length,
        targetDays,
        isRequired,
        requiredWindowMode,
        requiredScheduleIds,
        progressUnit,
        targetValue: Math.max(Number(targetValue) || 1, 1),
      });
      if (result.ok) {
        onClose();
      } else {
        isSubmitting.current = false;
        setIsSaving(false);
      }
    } catch {
      isSubmitting.current = false;
      setIsSaving(false);
    }
  };

  const remove = () => {
    if (!habit || !onDelete || isSubmitting.current) return;
    const confirm = () => {
      isSubmitting.current = true;
      setIsSaving(true);
      try {
        safeHaptic("light");
        onDelete();
        onClose();
      } finally {
        isSubmitting.current = false;
        setIsSaving(false);
      }
    };
    if (Platform.OS === "web") confirm();
    else Alert.alert(t("習慣を削除しますか？", "Delete habit?"), t(`「${habit.title}」の記録も削除されます。`, `The records for “${habit.title}” will also be deleted.`), [{ text: t("キャンセル", "Cancel"), style: "cancel" }, { text: t("削除", "Delete"), style: "destructive", onPress: confirm }]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoider}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={[styles.sheet, { backgroundColor: palette.background }]} onPress={() => undefined}>
            <View style={[styles.handle, { backgroundColor: palette.primarySoft }]} />
            <View style={styles.header}>
              <Text style={[styles.title, { color: palette.text }]}>{habit ? t("習慣を編集", "Edit habit") : t("習慣を作成", "Create habit")}</Text>
              <TouchableOpacity accessibilityLabel={t("閉じる", "Close")} onPress={onClose} style={[styles.closeButton, { backgroundColor: palette.elevated }]}>
                <MaterialIcons name="close" size={21} color={palette.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView
              ref={scrollRef}
              style={styles.scroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              automaticallyAdjustKeyboardInsets={true}
              removeClippedSubviews={Platform.OS === "android"}
              nestedScrollEnabled={true}
              scrollEventThrottle={16}
              contentContainerStyle={styles.body}
            >
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

              {/* Frequency Setting (Day-of-Week Toggle) */}
              <View style={[styles.cardSection, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <View style={styles.cardHeader}>
                  <MaterialIcons name="event-repeat" size={16} color={palette.primary} />
                  <Text style={[styles.cardTitle, { color: palette.text }]}>{t("頻度・実行曜日", "Frequency & Days")}</Text>
                  <Text style={[styles.cardHeaderHint, { color: palette.primary }]}>{t(`週${targetDays.length}日`, `${targetDays.length} days/week`)}</Text>
                </View>

                {/* Preset Chips */}
                <View style={styles.presetRow}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => selectPreset(EVERYDAY)}
                    style={[
                      styles.presetChip,
                      { backgroundColor: palette.elevated, borderColor: palette.border },
                      isEveryday && { backgroundColor: palette.primarySoft, borderColor: palette.primary },
                    ]}
                  >
                    <Text style={[styles.presetChipText, { color: palette.muted }, isEveryday && { color: palette.primary, fontWeight: "800" }]}>
                      {t("毎日", "Every day")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => selectPreset(WEEKDAYS_ONLY)}
                    style={[
                      styles.presetChip,
                      { backgroundColor: palette.elevated, borderColor: palette.border },
                      isWeekdays && { backgroundColor: palette.primarySoft, borderColor: palette.primary },
                    ]}
                  >
                    <Text style={[styles.presetChipText, { color: palette.muted }, isWeekdays && { color: palette.primary, fontWeight: "800" }]}>
                      {t("平日のみ", "Weekdays")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => selectPreset(WEEKEND_ONLY)}
                    style={[
                      styles.presetChip,
                      { backgroundColor: palette.elevated, borderColor: palette.border },
                      isWeekend && { backgroundColor: palette.primarySoft, borderColor: palette.primary },
                    ]}
                  >
                    <Text style={[styles.presetChipText, { color: palette.muted }, isWeekend && { color: palette.primary, fontWeight: "800" }]}>
                      {t("週末のみ", "Weekends")}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Circular Day Toggles */}
                <View style={styles.dayToggleRow}>
                  {WEEKDAYS.map((item) => {
                    const isSelected = targetDays.includes(item.day);
                    return (
                      <TouchableOpacity
                        key={item.day}
                        accessibilityRole="button"
                        accessibilityLabel={t(`${item.label}曜日`, item.en)}
                        accessibilityState={{ selected: isSelected }}
                        onPress={() => toggleDay(item.day)}
                        style={[
                          styles.dayCircle,
                          { backgroundColor: palette.elevated, borderColor: palette.border },
                          isSelected && { backgroundColor: palette.primary, borderColor: palette.primary },
                        ]}
                      >
                        <Text style={[styles.dayCircleText, { color: palette.muted }, isSelected && { color: palette.isDark ? palette.background : COLORS.white }]}>
                          {language === "en" ? item.en : item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
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
                      onPress={() => {
                        safeHaptic("light");
                        setProgressUnit(item.key);
                        if (item.key === "minutes" && (!targetValue || Number(targetValue) <= 1)) {
                          setTargetValue("15");
                        }
                      }}
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

                {/* Minutes Quick Chips & Custom Input */}
                {progressUnit === "minutes" ? (
                  <View style={styles.minuteGoalSection}>
                    <Text style={[styles.fieldLabel, { color: palette.muted }]}>{t("1日の目標時間", "Daily target time")}</Text>
                    <View style={styles.minuteChipsRow}>
                      {MINUTE_PRESETS.map((minutes) => {
                        const isSelected = !customMinutesMode && Number(targetValue) === minutes;
                        return (
                          <TouchableOpacity
                            key={minutes}
                            accessibilityRole="button"
                            onPress={() => {
                              safeHaptic("light");
                              setTargetValue(String(minutes));
                              setCustomMinutesMode(false);
                            }}
                            style={[
                              styles.minuteChip,
                              { backgroundColor: palette.elevated, borderColor: palette.border },
                              isSelected && { backgroundColor: palette.primarySoft, borderColor: palette.primary },
                            ]}
                          >
                            <Text style={[styles.minuteChipText, { color: palette.muted }, isSelected && { color: palette.primary, fontWeight: "800" }]}>
                              {t(`${minutes}分`, `${minutes}m`)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={() => {
                          safeHaptic("light");
                          setCustomMinutesMode(true);
                        }}
                        style={[
                          styles.minuteChip,
                          { backgroundColor: palette.elevated, borderColor: palette.border },
                          (customMinutesMode || !MINUTE_PRESETS.includes(Number(targetValue) as any)) && { backgroundColor: palette.primarySoft, borderColor: palette.primary },
                        ]}
                      >
                        <Text style={[styles.minuteChipText, { color: palette.muted }, (customMinutesMode || !MINUTE_PRESETS.includes(Number(targetValue) as any)) && { color: palette.primary, fontWeight: "800" }]}>
                          {t("カスタム", "Custom")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {customMinutesMode || !MINUTE_PRESETS.includes(Number(targetValue) as any) ? (
                      <View style={[styles.targetRow, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
                        <Text style={[styles.targetText, { color: palette.text }]}>{t("手動入力", "Custom minutes")}</Text>
                        <View style={styles.targetInputWrapper}>
                          <TextInput
                            value={targetValue}
                            onChangeText={setTargetValue}
                            onFocus={() => { setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150); }}
                            keyboardType="number-pad"
                            style={[styles.targetInput, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]}
                          />
                          <Text style={[styles.targetUnit, { color: palette.muted }]}>{t("分", "min")}</Text>
                        </View>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {/* Count Input */}
                {progressUnit === "count" ? (
                  <View style={[styles.targetRow, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
                    <Text style={[styles.targetText, { color: palette.text }]}>{t("1日の目標回数", "Daily target count")}</Text>
                    <View style={styles.targetInputWrapper}>
                      <TextInput
                        value={targetValue}
                        onChangeText={setTargetValue}
                        onFocus={() => { setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150); }}
                        keyboardType="number-pad"
                        style={[styles.targetInput, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }]}
                      />
                      <Text style={[styles.targetUnit, { color: palette.muted }]}>{t("回", "times")}</Text>
                    </View>
                  </View>
                ) : null}
              </View>

              {/* App Limits and Must-do */}
              <View style={[styles.cardSection, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <View style={styles.cardHeader}>
                  <MaterialIcons name="shield" size={16} color={palette.primary} />
                  <Text style={[styles.cardTitle, { color: palette.text }]}>{t("アプリの制限", "App limits")}</Text>
                </View>
                <TouchableOpacity
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isRequired }}
                  onPress={() => {
                    safeHaptic("light");
                    setIsRequired((value) => !value);
                  }}
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

              {/* Color Selection Accordion */}
              <View style={[styles.cardSection, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ expanded: colorSectionOpen }}
                  onPress={() => setColorSectionOpen((v) => !v)}
                  style={styles.colorDisclosure}
                >
                  <View style={styles.colorDisclosureLeft}>
                    <View style={[styles.colorPreviewDot, { backgroundColor: color }]} />
                    <Text style={[styles.cardTitle, { color: palette.text }]}>{t("テーマカラー", "Color theme")}</Text>
                  </View>
                  <MaterialIcons name={colorSectionOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={20} color={palette.muted} />
                </TouchableOpacity>
                {colorSectionOpen ? (
                  <View style={styles.colorRow}>
                    {HABIT_COLORS.map((item) => (
                      <TouchableOpacity
                        key={item}
                        accessibilityLabel={t("習慣の色を選択", "Choose habit color")}
                        onPress={() => {
                          safeHaptic("light");
                          setColor(item);
                        }}
                        style={[styles.colorButton, { backgroundColor: item, borderColor: item }, color === item && { borderColor: palette.text }]}
                      >
                        {color === item ? <MaterialIcons name="check" size={14} color={COLORS.white} /> : null}
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
              </View>
            </ScrollView>
            <View style={[styles.footer, { backgroundColor: palette.background, borderTopColor: palette.border, paddingBottom: Math.max(insets.bottom, 12) }]}>
              {habit && onDelete ? (
                <TouchableOpacity accessibilityRole="button" onPress={remove} activeOpacity={0.8} style={[styles.deleteButton, { backgroundColor: palette.elevated, borderColor: palette.border }]} disabled={isSaving}>
                  <MaterialIcons name="delete-outline" size={18} color={COLORS.error} />
                  <Text style={[styles.deleteButtonText, { color: COLORS.error }]}>{t("習慣を削除", "Delete habit")}</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                accessibilityRole="button"
                onPress={save}
                activeOpacity={0.8}
                style={[styles.saveButton, { backgroundColor: !title.trim() || isSaving ? palette.elevated : palette.primary }]}
                disabled={!title.trim() || isSaving}
              >
                <Text style={[styles.saveText, { color: !title.trim() || isSaving ? palette.muted : palette.isDark ? palette.background : COLORS.white }]}>
                  {isSaving ? (habit ? t("保存中...", "Saving...") : t("作成中...", "Creating...")) : habit ? t("変更を保存", "Save changes") : t("習慣を作成", "Create habit")}
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
  cardHeaderHint: { marginLeft: "auto", fontSize: 11, fontWeight: "800" },
  cardTitle: { fontSize: 13, fontWeight: "800" },
  fieldLabel: { fontSize: 11, fontWeight: "700", marginBottom: 4 },
  presetRow: { flexDirection: "row", gap: 6, marginBottom: 2 },
  presetChip: { flex: 1, minHeight: 34, alignItems: "center", justifyContent: "center", borderRadius: 9, borderWidth: 1, paddingHorizontal: 4 },
  presetChipText: { fontSize: 11, fontWeight: "700" },
  dayToggleRow: { flexDirection: "row", justifyContent: "space-between", gap: 4, marginTop: 4 },
  dayCircle: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  dayCircleText: { fontSize: 12, fontWeight: "800" },
  colorDisclosure: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 2 },
  colorDisclosureLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  colorPreviewDot: { width: 14, height: 14, borderRadius: 7 },
  colorRow: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 4 },
  colorButton: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  segmentRow: { flexDirection: "row", gap: 5 },
  segment: { flex: 1, minHeight: 38, alignItems: "center", justifyContent: "center", borderRadius: 10, borderWidth: 1, paddingHorizontal: 3 },
  segmentText: { fontSize: 11, textAlign: "center", fontWeight: "800" },
  minuteGoalSection: { gap: 6, marginTop: 2 },
  minuteChipsRow: { flexDirection: "row", gap: 5, flexWrap: "wrap" },
  minuteChip: { minWidth: 48, flex: 1, minHeight: 34, alignItems: "center", justifyContent: "center", borderRadius: 8, borderWidth: 1, paddingHorizontal: 6 },
  minuteChipText: { fontSize: 11, fontWeight: "700" },
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
