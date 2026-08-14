import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { dayKey, dayKeyToDate } from "@/lib/focus-flow/utils";
import { getAppLanguage, localized } from "@/lib/focus-flow/i18n";
import { useFocusFlow } from "@/lib/focus-flow/provider";
import { COLORS } from "./ui";

type DatePickerProps = { visible: boolean; value?: string; onClose: () => void; onSelect: (value?: string) => void };

export function DatePicker({ visible, value, onClose, onSelect }: DatePickerProps) {
  const { displaySettings } = useFocusFlow(); const language = getAppLanguage(displaySettings); const t = (ja: string, en: string) => localized(language, ja, en); const weekdays = language === "en" ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] : ["日", "月", "火", "水", "木", "金", "土"];
  const [month, setMonth] = useState(() => startOfMonth(value ? dayKeyToDate(value) : new Date()));
  useEffect(() => { if (visible) setMonth(startOfMonth(value ? dayKeyToDate(value) : new Date())); }, [value, visible]);
  const cells = useMemo(() => getCalendarCells(month), [month]);
  const selected = value ?? "";
  const today = dayKey();

  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable style={styles.backdrop} onPress={onClose}>
      <Pressable style={styles.sheet} onPress={() => undefined}>
        <View style={styles.header}><Text style={styles.title}>{t("期限を選択", "Select due date")}</Text><TouchableOpacity accessibilityLabel={t("閉じる", "Close")} onPress={onClose} style={styles.iconButton}><MaterialIcons name="close" color={COLORS.muted} size={20} /></TouchableOpacity></View>
        <View style={styles.monthRow}><TouchableOpacity accessibilityLabel={t("前の月", "Previous month")} onPress={() => setMonth(addMonths(month, -1))} style={styles.iconButton}><MaterialIcons name="chevron-left" color={COLORS.forest} size={24} /></TouchableOpacity><Text style={styles.monthTitle}>{language === "en" ? new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(month) : `${month.getFullYear()}年 ${month.getMonth() + 1}月`}</Text><TouchableOpacity accessibilityLabel={t("次の月", "Next month")} onPress={() => setMonth(addMonths(month, 1))} style={styles.iconButton}><MaterialIcons name="chevron-right" color={COLORS.forest} size={24} /></TouchableOpacity></View>
        <View style={styles.weekRow}>{weekdays.map((weekday, index) => <Text key={weekday} style={[styles.weekday, index === 0 && styles.sunday, index === 6 && styles.saturday]}>{weekday}</Text>)}</View>
        <View style={styles.grid}>{cells.map((cell, index) => cell ? <TouchableOpacity key={cell.key} accessibilityRole="button" accessibilityLabel={language === "en" ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric" }).format(cell.date) : `${cell.date.getMonth() + 1}月${cell.date.getDate()}日`} onPress={() => { onSelect(cell.key); onClose(); }} style={[styles.day, selected === cell.key && styles.daySelected, today === cell.key && selected !== cell.key && styles.dayToday]}><Text style={[styles.dayText, cell.date.getDay() === 0 && styles.sunday, cell.date.getDay() === 6 && styles.saturday, selected === cell.key && styles.dayTextSelected]}>{cell.date.getDate()}</Text></TouchableOpacity> : <View key={`empty-${index}`} style={styles.day} />)}</View>
        <View style={styles.actions}><TouchableOpacity onPress={() => { onSelect(); onClose(); }} style={styles.clearButton}><Text style={styles.clearText}>{t("期限を外す", "Clear due date")}</Text></TouchableOpacity><TouchableOpacity onPress={() => { onSelect(dayKey()); onClose(); }} style={styles.todayButton}><Text style={styles.todayText}>{t("今日", "Today")}</Text></TouchableOpacity></View>
      </Pressable>
    </Pressable>
  </Modal>;
}

function startOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0, 0); }
function addMonths(date: Date, amount: number) { return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12, 0, 0, 0); }
function getCalendarCells(month: Date) { const cells: ({ date: Date; key: string } | null)[] = Array.from({ length: month.getDay() }, () => null); const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(); for (let date = 1; date <= days; date += 1) { const value = new Date(month.getFullYear(), month.getMonth(), date, 12, 0, 0, 0); cells.push({ date: value, key: dayKey(value) }); } while (cells.length % 7) cells.push(null); return cells; }

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "center", backgroundColor: "rgba(18,42,34,0.40)", padding: 22 }, sheet: { backgroundColor: COLORS.background, borderRadius: 25, padding: 18 }, header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, title: { color: COLORS.text, fontSize: 18, fontWeight: "800" }, iconButton: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#EDF2EF" }, monthRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 }, monthTitle: { color: COLORS.text, fontSize: 16, fontWeight: "800" }, weekRow: { flexDirection: "row", marginTop: 12 }, weekday: { width: "14.2857%", textAlign: "center", color: COLORS.muted, fontSize: 12, fontWeight: "800" }, sunday: { color: COLORS.error }, saturday: { color: COLORS.blue }, grid: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 }, day: { width: "14.2857%", aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 15 }, daySelected: { backgroundColor: COLORS.forest }, dayToday: { borderWidth: 1.5, borderColor: COLORS.forest }, dayText: { color: COLORS.text, fontSize: 14, fontWeight: "700" }, dayTextSelected: { color: COLORS.white }, actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 14 }, clearButton: { minHeight: 42, justifyContent: "center", paddingHorizontal: 12 }, clearText: { color: COLORS.error, fontSize: 13, fontWeight: "800" }, todayButton: { minHeight: 42, justifyContent: "center", paddingHorizontal: 16, borderRadius: 13, backgroundColor: "#E7F0EC" }, todayText: { color: COLORS.forest, fontSize: 13, fontWeight: "800" },
});
