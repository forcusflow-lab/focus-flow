import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { ScaledText as Text } from "@/components/focus-flow/scaled-text";
import type { GateSchedule, RequiredWindowMode } from "@/lib/focus-flow/types";
import { COLORS } from "./ui";

type RequiredWindowSelectorProps = {
  english: boolean;
  isRequired: boolean;
  mode: RequiredWindowMode;
  selectedIds: string[];
  schedules: GateSchedule[];
  onChange: (mode: RequiredWindowMode, selectedIds: string[]) => void;
};

export function RequiredWindowSelector({ english, isRequired, mode, selectedIds, schedules, onChange }: RequiredWindowSelectorProps) {
  if (!isRequired) return null;
  const t = (ja: string, en: string) => english ? en : ja;
  const toggleSchedule = (id: string) => {
    const selected = selectedIds.includes(id);
    const next = selected ? selectedIds.filter((value) => value !== id) : [...selectedIds, id];
    onChange(next.length ? "scheduled" : "always", next);
  };
  return <View style={styles.wrap}>
    <Text style={styles.label}>{t("実行時間帯", "Required time")}</Text>
    <Text style={styles.detail}>{t("この時間帯は、完了するまで選んだアプリを使えません。", "During this time, selected apps stay limited until it is done.")}</Text>
    <TouchableOpacity accessibilityRole="radio" accessibilityState={{ selected: mode === "always" }} onPress={() => onChange("always", [])} style={[styles.choice, mode === "always" && styles.choiceSelected]}>
      <View style={[styles.radio, mode === "always" && styles.radioSelected]}>{mode === "always" ? <View style={styles.radioDot} /> : null}</View>
      <View style={styles.choiceCopy}><Text style={styles.choiceTitle}>{t("いつでも必須", "Required anytime")}</Text><Text style={styles.choiceDetail}>{t("時間帯に関係なく、解除条件に含めます。", "Always included in the unlock condition.")}</Text></View>
    </TouchableOpacity>
    {schedules.length ? <View style={styles.scheduleGroup}>
      <Text style={styles.groupLabel}>{t("設定済みの時間帯だけ必須にする", "Require only in selected time windows")}</Text>
      {schedules.map((schedule) => {
        const selected = mode === "scheduled" && selectedIds.includes(schedule.id);
        return <TouchableOpacity key={schedule.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={() => toggleSchedule(schedule.id)} style={[styles.schedule, selected && styles.scheduleSelected]}>
          <View style={[styles.check, selected && styles.checkSelected]}>{selected ? <MaterialIcons name="check" size={15} color={COLORS.white} /> : null}</View>
          <View style={styles.scheduleCopy}><Text style={styles.scheduleTitle}>{schedule.label}</Text><Text style={styles.scheduleDetail}>{schedule.startTime}–{schedule.endTime}{schedule.enabled ? "" : t("（オフ）", " (off)")}</Text></View>
        </TouchableOpacity>;
      })}
    </View> : <View style={styles.empty}><MaterialIcons name="schedule" size={18} color={COLORS.warning} /><Text style={styles.emptyText}>{t("時間帯はまだありません。集中制限の設定で追加すると、ここで選べます。", "No time windows yet. Add one in App limits to choose it here.")}</Text></View>}
  </View>;
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 16, backgroundColor: "#F2F7F4", borderWidth: 1, borderColor: "#D3E5DE", padding: 12, marginBottom: 14 },
  label: { color: COLORS.text, fontSize: 13, fontWeight: "900" },
  detail: { color: "#597168", fontSize: 11, lineHeight: 16, marginTop: 3, marginBottom: 9 },
  choice: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: "#D8E3DE", backgroundColor: COLORS.white, borderRadius: 13, paddingHorizontal: 11 },
  choiceSelected: { borderColor: COLORS.forest, backgroundColor: "#E8F4EF" },
  radio: { width: 21, height: 21, alignItems: "center", justifyContent: "center", borderRadius: 11, borderWidth: 1.5, borderColor: "#AFC0B7" },
  radioSelected: { borderColor: COLORS.forest }, radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: COLORS.forest },
  choiceCopy: { flex: 1, minWidth: 0 }, choiceTitle: { color: COLORS.text, fontSize: 13, fontWeight: "800" }, choiceDetail: { color: COLORS.muted, fontSize: 10, lineHeight: 15, marginTop: 1 },
  scheduleGroup: { marginTop: 10 }, groupLabel: { color: "#42675D", fontSize: 11, fontWeight: "800", marginBottom: 6 },
  schedule: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 9, borderBottomWidth: 1, borderBottomColor: "#DFEAE5", paddingHorizontal: 3 },
  scheduleSelected: { backgroundColor: "#E8F4EF" }, check: { width: 21, height: 21, alignItems: "center", justifyContent: "center", borderRadius: 7, borderWidth: 1.4, borderColor: "#AFC0B7" }, checkSelected: { borderColor: COLORS.forest, backgroundColor: COLORS.forest },
  scheduleCopy: { flex: 1, minWidth: 0 }, scheduleTitle: { color: COLORS.text, fontSize: 13, fontWeight: "800" }, scheduleDetail: { color: COLORS.muted, fontSize: 10, marginTop: 1 },
  empty: { minHeight: 46, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, backgroundColor: "#FFF7E8", paddingHorizontal: 10, marginTop: 9 }, emptyText: { flex: 1, color: "#7A5A22", fontSize: 10, lineHeight: 15, fontWeight: "700" },
});
