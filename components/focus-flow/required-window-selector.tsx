import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { Modal, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

import { ScaledText as Text } from "@/components/focus-flow/scaled-text";
import type { GateSchedule, RequiredWindowMode } from "@/lib/focus-flow/types";
import { COLORS, safeHaptic, useFocusPalette } from "./ui";

type RequiredWindowSelectorProps = {
  english: boolean;
  isRequired: boolean;
  mode: RequiredWindowMode;
  selectedIds: string[];
  schedules: GateSchedule[];
  onChange: (mode: RequiredWindowMode, selectedIds: string[]) => void;
  onCreateSchedule?: (schedule: GateSchedule) => void;
};

export function RequiredWindowSelector({
  english,
  isRequired,
  mode,
  selectedIds,
  schedules,
  onChange,
  onCreateSchedule,
}: RequiredWindowSelectorProps) {
  const palette = useFocusPalette();
  const [modalOpen, setModalOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("18:00");

  if (!isRequired) return null;
  const t = (ja: string, en: string) => (english ? en : ja);

  const toggleSchedule = (id: string) => {
    safeHaptic("light");
    const selected = selectedIds.includes(id);
    const next = selected ? selectedIds.filter((value) => value !== id) : [...selectedIds, id];
    onChange("scheduled", next);
  };

  const handleSelectAlways = () => {
    safeHaptic("light");
    onChange("always", []);
  };

  const handleSelectScheduled = () => {
    safeHaptic("light");
    if (selectedIds.length === 0 && schedules.length > 0) {
      onChange("scheduled", [schedules[0].id]);
    } else {
      onChange("scheduled", selectedIds);
    }
  };

  const handleCreateSchedule = () => {
    safeHaptic("light");
    const defaultName = t(`時間帯 ${schedules.length + 1}`, `Time window ${schedules.length + 1}`);
    const finalLabel = newLabel.trim() || defaultName;
    const newSchedule: GateSchedule = {
      id: `schedule-${Date.now()}`,
      label: finalLabel,
      enabled: true,
      days: [0, 1, 2, 3, 4, 5, 6],
      startTime: newStart || "09:00",
      endTime: newEnd || "18:00",
      requiredTodoIds: [],
      requiredHabitIds: [],
      blockedPackages: [],
    };
    if (onCreateSchedule) {
      onCreateSchedule(newSchedule);
    } else {
      onChange("scheduled", [...selectedIds, newSchedule.id]);
    }
    setNewLabel("");
    setNewStart("09:00");
    setNewEnd("18:00");
    setModalOpen(false);
  };

  return (
    <View style={[styles.wrap, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
      <Text style={[styles.label, { color: palette.text }]}>{t("制限するタイミング", "When to limit")}</Text>
      <Text style={[styles.detail, { color: palette.muted }]}>
        {t("アプリを制限するタイミングを選択します。", "Choose when apps should be limited.")}
      </Text>

      {/* 選択肢1: 終日 */}
      <TouchableOpacity
        accessibilityRole="radio"
        accessibilityState={{ selected: mode === "always" }}
        onPress={handleSelectAlways}
        style={[
          styles.choice,
          { backgroundColor: palette.surface, borderColor: palette.border },
          mode === "always" && { borderColor: palette.primary, backgroundColor: palette.primarySoft },
        ]}
      >
        <View style={[styles.radio, { borderColor: palette.border }, mode === "always" && { borderColor: palette.primary }]}>
          {mode === "always" ? <View style={[styles.radioDot, { backgroundColor: palette.primary }]} /> : null}
        </View>
        <View style={styles.choiceCopy}>
          <Text style={[styles.choiceTitle, { color: palette.text }]}>{t("終日", "All day")}</Text>
          <Text style={[styles.choiceDetail, { color: palette.muted }]}>
            {t("今日の達成までアプリを制限", "Limit apps until completed today")}
          </Text>
        </View>
      </TouchableOpacity>

      {/* 選択肢2: 指定の時間帯 */}
      <TouchableOpacity
        accessibilityRole="radio"
        accessibilityState={{ selected: mode === "scheduled" }}
        onPress={handleSelectScheduled}
        style={[
          styles.choice,
          { backgroundColor: palette.surface, borderColor: palette.border, marginTop: 8 },
          mode === "scheduled" && { borderColor: palette.primary, backgroundColor: palette.primarySoft },
        ]}
      >
        <View style={[styles.radio, { borderColor: palette.border }, mode === "scheduled" && { borderColor: palette.primary }]}>
          {mode === "scheduled" ? <View style={[styles.radioDot, { backgroundColor: palette.primary }]} /> : null}
        </View>
        <View style={styles.choiceCopy}>
          <Text style={[styles.choiceTitle, { color: palette.text }]}>{t("指定の時間帯", "Specific time window")}</Text>
          <Text style={[styles.choiceDetail, { color: palette.muted }]}>
            {t("設定した時間帯（朝・夜など）の間だけブロック", "Block only during selected time windows (morning, night, etc.)")}
          </Text>
        </View>
      </TouchableOpacity>

      {/* 時間帯一覧 (指定の時間帯選択時) */}
      {mode === "scheduled" ? (
        <View style={styles.scheduleGroup}>
          {schedules.length > 0 ? (
            schedules.map((schedule) => {
              const selected = selectedIds.includes(schedule.id);
              return (
                <TouchableOpacity
                  key={schedule.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  onPress={() => toggleSchedule(schedule.id)}
                  style={[
                    styles.schedule,
                    { borderBottomColor: palette.border },
                    selected && { backgroundColor: palette.primarySoft },
                  ]}
                >
                  <View
                    style={[
                      styles.check,
                      { borderColor: palette.border },
                      selected && { borderColor: palette.primary, backgroundColor: palette.primary },
                    ]}
                  >
                    {selected ? (
                      <MaterialIcons
                        name="check"
                        size={15}
                        color={palette.isDark ? palette.background : COLORS.white}
                      />
                    ) : null}
                  </View>
                  <View style={styles.scheduleCopy}>
                    <Text style={[styles.scheduleTitle, { color: palette.text }]}>{schedule.label}</Text>
                    <Text style={[styles.scheduleDetail, { color: palette.muted }]}>
                      {schedule.startTime}–{schedule.endTime}
                      {schedule.enabled ? "" : t("（オフ）", " (off)")}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={[styles.empty, { backgroundColor: palette.surface }]}>
              <MaterialIcons name="schedule" size={18} color={palette.primary} />
              <Text style={[styles.emptyText, { color: palette.text }]}>
                {t("時間帯がまだありません。下のボタンから作成できます。", "No time windows yet. Create one below.")}
              </Text>
            </View>
          )}

          {/* 追加導線: + 新しい時間帯を作成 */}
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => {
              safeHaptic("light");
              setModalOpen(true);
            }}
            style={[styles.addWindowButton, { borderColor: palette.primary, backgroundColor: palette.surface }]}
          >
            <MaterialIcons name="add" size={18} color={palette.primary} />
            <Text style={[styles.addWindowButtonText, { color: palette.primary }]}>
              {t("+ 新しい時間帯を作成", "+ Create new time window")}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* 新しい時間帯作成モーダル */}
      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: palette.text }]}>
                {t("新しい時間帯を作成", "Create new time window")}
              </Text>
            </View>
            <Text style={[styles.modalFieldLabel, { color: palette.muted }]}>
              {t("時間帯の名前", "Window name")}
            </Text>
            <TextInput
              value={newLabel}
              onChangeText={setNewLabel}
              placeholder={t("例: 朝の集中", "e.g. Morning focus")}
              placeholderTextColor={palette.muted}
              style={[
                styles.modalInput,
                { color: palette.text, backgroundColor: palette.elevated, borderColor: palette.border },
              ]}
            />
            <View style={styles.modalTimeRow}>
              <View style={styles.modalTimeCol}>
                <Text style={[styles.modalFieldLabel, { color: palette.muted }]}>{t("開始時刻", "Start")}</Text>
                <TextInput
                  value={newStart}
                  onChangeText={setNewStart}
                  placeholder="09:00"
                  placeholderTextColor={palette.muted}
                  style={[
                    styles.modalInput,
                    { color: palette.text, backgroundColor: palette.elevated, borderColor: palette.border },
                  ]}
                />
              </View>
              <View style={styles.modalTimeCol}>
                <Text style={[styles.modalFieldLabel, { color: palette.muted }]}>{t("終了時刻", "End")}</Text>
                <TextInput
                  value={newEnd}
                  onChangeText={setNewEnd}
                  placeholder="18:00"
                  placeholderTextColor={palette.muted}
                  style={[
                    styles.modalInput,
                    { color: palette.text, backgroundColor: palette.elevated, borderColor: palette.border },
                  ]}
                />
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setModalOpen(false)}
                style={[styles.modalCancelButton, { borderColor: palette.border }]}
              >
                <Text style={[styles.modalCancelText, { color: palette.muted }]}>{t("キャンセル", "Cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateSchedule}
                style={[styles.modalSubmitButton, { backgroundColor: palette.primary }]}
              >
                <Text style={styles.modalSubmitText}>{t("作成する", "Create")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "900" },
  detail: { fontSize: 11, lineHeight: 16, marginTop: 3, marginBottom: 9 },
  choice: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 13, paddingHorizontal: 11 },
  radio: { width: 21, height: 21, alignItems: "center", justifyContent: "center", borderRadius: 11, borderWidth: 1.5 },
  radioDot: { width: 11, height: 11, borderRadius: 6 },
  choiceCopy: { flex: 1, minWidth: 0 },
  choiceTitle: { fontSize: 13, fontWeight: "800" },
  choiceDetail: { fontSize: 10, lineHeight: 15, marginTop: 1 },
  scheduleGroup: { marginTop: 10, paddingTop: 4 },
  schedule: { minHeight: 46, flexDirection: "row", alignItems: "center", gap: 9, borderBottomWidth: 1, paddingHorizontal: 3, borderRadius: 8 },
  check: { width: 21, height: 21, alignItems: "center", justifyContent: "center", borderRadius: 7, borderWidth: 1.4 },
  scheduleCopy: { flex: 1, minWidth: 0 },
  scheduleTitle: { fontSize: 13, fontWeight: "800" },
  scheduleDetail: { fontSize: 10, marginTop: 1 },
  empty: { minHeight: 46, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, paddingHorizontal: 10, marginTop: 6, marginBottom: 8 },
  emptyText: { flex: 1, fontSize: 11, lineHeight: 16, fontWeight: "700" },
  addWindowButton: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    marginTop: 8,
  },
  addWindowButtonText: { fontSize: 12, fontWeight: "800" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalCard: { width: "100%", maxWidth: 360, borderRadius: 20, borderWidth: 1, padding: 18 },
  modalHeader: { marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: "900" },
  modalFieldLabel: { fontSize: 11, fontWeight: "800", marginTop: 8, marginBottom: 4 },
  modalInput: { minHeight: 40, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 13, fontWeight: "700" },
  modalTimeRow: { flexDirection: "row", gap: 10 },
  modalTimeCol: { flex: 1 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16 },
  modalCancelButton: { minHeight: 40, paddingHorizontal: 16, justifyContent: "center", alignItems: "center", borderRadius: 10, borderWidth: 1 },
  modalCancelText: { fontSize: 12, fontWeight: "800" },
  modalSubmitButton: { minHeight: 40, paddingHorizontal: 18, justifyContent: "center", alignItems: "center", borderRadius: 10 },
  modalSubmitText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
});
