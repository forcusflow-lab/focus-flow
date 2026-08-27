import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { ScaledText as Text } from "@/components/focus-flow/scaled-text";
import type { GateSchedule, RequiredWindowMode } from "@/lib/focus-flow/types";
import { COLORS, useFocusPalette } from "./ui";

type RequiredWindowSelectorProps = {
  english: boolean;
  isRequired: boolean;
  mode: RequiredWindowMode;
  selectedIds: string[];
  schedules: GateSchedule[];
  onChange: (mode: RequiredWindowMode, selectedIds: string[]) => void;
};

export function RequiredWindowSelector({ english, isRequired, mode, selectedIds, schedules, onChange }: RequiredWindowSelectorProps) {
  const palette = useFocusPalette();
  if (!isRequired) return null;
  const t = (ja: string, en: string) => english ? en : ja;
  const toggleSchedule = (id: string) => {
    const selected = selectedIds.includes(id);
    const next = selected ? selectedIds.filter((value) => value !== id) : [...selectedIds, id];
    onChange(next.length ? "scheduled" : "always", next);
  };
  return <View style={[styles.wrap, { backgroundColor: palette.elevated, borderColor: palette.border }]}>
    <Text style={[styles.label, { color: palette.text }]}>{t("実行時間帯", "Required time")}</Text>
    <Text style={[styles.detail, { color: palette.muted }]}>{t("この時間帯は、完了するまで選んだアプリを使えません。", "During this time, selected apps stay limited until it is done.")}</Text>
    <TouchableOpacity accessibilityRole="radio" accessibilityState={{ selected: mode === "always" }} onPress={() => onChange("always", [])} style={[styles.choice, { backgroundColor: palette.surface, borderColor: palette.border }, mode === "always" && { borderColor: palette.primary, backgroundColor: palette.primarySoft }]}>
      <View style={[styles.radio, { borderColor: palette.border }, mode === "always" && { borderColor: palette.primary }]}>{mode === "always" ? <View style={[styles.radioDot, { backgroundColor: palette.primary }]} /> : null}</View>
      <View style={styles.choiceCopy}><Text style={[styles.choiceTitle, { color: palette.text }]}>{t("いつでも必須", "Required anytime")}</Text><Text style={[styles.choiceDetail, { color: palette.muted }]}>{t("時間帯に関係なく、解除条件に含めます。", "Always included in the unlock condition.")}</Text></View>
    </TouchableOpacity>
    {schedules.length ? <View style={styles.scheduleGroup}>
      <Text style={[styles.groupLabel, { color: palette.muted }]}>{t("設定済みの時間帯だけ必須にする", "Require only in selected time windows")}</Text>
      {schedules.map((schedule) => {
        const selected = mode === "scheduled" && selectedIds.includes(schedule.id);
        return <TouchableOpacity key={schedule.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={() => toggleSchedule(schedule.id)} style={[styles.schedule, { borderBottomColor: palette.border }, selected && { backgroundColor: palette.primarySoft }]}>
          <View style={[styles.check, { borderColor: palette.border }, selected && { borderColor: palette.primary, backgroundColor: palette.primary }]}>{selected ? <MaterialIcons name="check" size={15} color={palette.isDark ? palette.background : COLORS.white} /> : null}</View>
          <View style={styles.scheduleCopy}><Text style={[styles.scheduleTitle, { color: palette.text }]}>{schedule.label}</Text><Text style={[styles.scheduleDetail, { color: palette.muted }]}>{schedule.startTime}–{schedule.endTime}{schedule.enabled ? "" : t("（オフ）", " (off)")}</Text></View>
        </TouchableOpacity>;
      })}
    </View> : <View style={[styles.empty, { backgroundColor: palette.primarySoft }]}><MaterialIcons name="schedule" size={18} color={palette.primary} /><Text style={[styles.emptyText, { color: palette.text }]}>{t("時間帯はまだありません。集中制限の設定で追加すると、ここで選べます。", "No time windows yet. Add one in App limits to choose it here.")}</Text></View>}
  </View>;
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "900" },
  detail: { fontSize: 11, lineHeight: 16, marginTop: 3, marginBottom: 9 },
  choice: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 13, paddingHorizontal: 11 },
  radio: { width: 21, height: 21, alignItems: "center", justifyContent: "center", borderRadius: 11, borderWidth: 1.5 },
  radioDot: { width: 11, height: 11, borderRadius: 6 },
  choiceCopy: { flex: 1, minWidth: 0 }, choiceTitle: { fontSize: 13, fontWeight: "800" }, choiceDetail: { fontSize: 10, lineHeight: 15, marginTop: 1 },
  scheduleGroup: { marginTop: 10 }, groupLabel: { fontSize: 11, fontWeight: "800", marginBottom: 6 },
  schedule: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 9, borderBottomWidth: 1, paddingHorizontal: 3 },
  check: { width: 21, height: 21, alignItems: "center", justifyContent: "center", borderRadius: 7, borderWidth: 1.4 },
  scheduleCopy: { flex: 1, minWidth: 0 }, scheduleTitle: { fontSize: 13, fontWeight: "800" }, scheduleDetail: { fontSize: 10, marginTop: 1 },
  empty: { minHeight: 46, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, paddingHorizontal: 10, marginTop: 9 }, emptyText: { flex: 1, fontSize: 10, lineHeight: 15, fontWeight: "700" },
});
