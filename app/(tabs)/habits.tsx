import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo, useState } from "react";
import { Alert, FlatList, Platform, StyleSheet, TouchableOpacity, View } from "react-native";

import { HabitForm } from "@/components/focus-flow/habit-form";
import { ScaledText as Text } from "@/components/focus-flow/scaled-text";
import { COLORS, EmptyState, IconButton, LoadingScreen, Pill, safeHaptic, ScreenHeading } from "@/components/focus-flow/ui";
import { ScreenContainer } from "@/components/screen-container";
import { getAppLanguage, localized } from "@/lib/focus-flow/i18n";
import { useFocusFlow } from "@/lib/focus-flow/provider";
import type { Habit } from "@/lib/focus-flow/types";
import { dayKey, dayKeyOffset, habitProgressLabel, habitStreak, isHabitCompleteOn, shortWeekday, weeklyHabitProgress } from "@/lib/focus-flow/utils";

export default function HabitsScreen() {
  const { habits, displaySettings, isReady, addHabit, updateHabit, toggleHabit, adjustHabitProgress, deleteHabit } = useFocusFlow();
  const language = getAppLanguage(displaySettings);
  const t = (ja: string, en: string) => localized(language, ja, en);
  const [formOpen, setFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>();
  const week = useMemo(() => Array.from({ length: 7 }, (_, index) => dayKeyOffset(index - 6)), []);
  const openForm = (habit?: Habit) => { setEditingHabit(habit); setFormOpen(true); };
  const remove = (habit: Habit) => {
    const confirm = () => deleteHabit(habit.id);
    if (Platform.OS === "web") confirm();
    else Alert.alert(t("習慣を削除しますか？", "Delete this habit?"), t(`「${habit.title}」の記録も削除されます。`, `The records for “${habit.title}” will also be deleted.`), [{ text: t("キャンセル", "Cancel"), style: "cancel" }, { text: t("削除", "Delete"), style: "destructive", onPress: confirm }]);
  };
  if (!isReady) return <ScreenContainer><LoadingScreen /></ScreenContainer>;

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<><ScreenHeading eyebrow={t("続ける仕組み", "Build consistency")} title={t("習慣", "Habits")} action={<IconButton icon="add" label={t("習慣を追加", "Add habit")} onPress={() => openForm()} variant="filled" />} /><View style={styles.explainer}><MaterialIcons name="lock-outline" size={17} color={COLORS.forest} /><Text style={styles.explainerText}>{t("必須の習慣は、アプリ制限を解除する条件になります。", "Must-do habits become an unlock condition for your selected apps.")}</Text></View></>}
        ListEmptyComponent={<EmptyState icon="repeat" title={t("最初の習慣を作りましょう", "Create your first habit")} description={t("登録時に「必須の習慣」を選ぶと、毎日のアプリ制限の解除条件にできます。", "Choose Must-do when you create a habit to use it as a daily unlock condition.")} actionLabel={t("習慣を作る", "Create habit")} onAction={() => openForm()} />}
        renderItem={({ item }) => {
          const progress = weeklyHabitProgress(item);
          const todayDone = isHabitCompleteOn(item, dayKey());
          const progressLabel = habitProgressLabel(item, dayKey(), language);
          return (
            <View style={styles.habitCard}>
              <View style={styles.cardTop}>
                <TouchableOpacity onPress={() => openForm(item)} activeOpacity={0.72} style={styles.habitTitleArea}>
                  <View style={[styles.habitMark, { backgroundColor: `${item.color}18` }]}><MaterialIcons name="auto-awesome" size={18} color={item.color} /></View>
                  <View style={styles.habitTitleCopy}><Text style={styles.habitTitle} numberOfLines={1}>{item.title}</Text><View style={styles.habitMetaRow}>{item.isRequired ? <Pill label={t("必須", "Must-do")} color={COLORS.forest} /> : null}<Text style={styles.habitMeta} numberOfLines={1}>{t(`週 ${progress.completed}/${progress.target} ・ ${habitStreak(item)}日連続`, `${progress.completed}/${progress.target} this week · ${habitStreak(item)}-day streak`)}</Text></View></View>
                </TouchableOpacity>
                <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: todayDone }} accessibilityLabel={t("今日の習慣を記録", "Record today's habit")} onPress={() => { safeHaptic(todayDone ? "light" : "success"); toggleHabit(item.id); }} style={[styles.todayCheck, todayDone && { backgroundColor: item.color, borderColor: item.color }]}>
                  {todayDone ? <MaterialIcons name="check" size={19} color={COLORS.white} /> : <Text style={[styles.todayCheckText, { color: item.color }]}>{t("今日", "Today")}</Text>}
                </TouchableOpacity>
              </View>
              <View style={styles.daysRow}>
                {week.map((key) => {
                  const done = isHabitCompleteOn(item, key);
                  const isToday = key === dayKey();
                  return (
                    <TouchableOpacity key={key} accessibilityLabel={t(`${shortWeekday(key)}曜日を記録`, `Record ${shortWeekday(key, language)}`)} onPress={() => { safeHaptic(done ? "light" : "success"); toggleHabit(item.id, key); }} style={styles.dayButton}>
                      <Text style={[styles.dayLabel, isToday && { color: item.color }]}>{shortWeekday(key, language)}</Text>
                      <View style={[styles.dayDot, done && { backgroundColor: item.color, borderColor: item.color }, isToday && !done && { borderColor: item.color }]}>{done ? <MaterialIcons name="check" size={13} color={COLORS.white} /> : null}</View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {progressLabel ? <View style={[styles.dailyProgress, { backgroundColor: `${item.color}14` }]}><TouchableOpacity accessibilityLabel={t("今日の進捗を減らす", "Decrease today's progress")} onPress={() => adjustHabitProgress(item.id, -1)} style={styles.progressButton}><MaterialIcons name="remove" size={16} color={item.color} /></TouchableOpacity><Text style={[styles.dailyProgressText, { color: item.color }]}>{t("今日", "Today")} {progressLabel}</Text><TouchableOpacity accessibilityLabel={t("今日の進捗を増やす", "Increase today's progress")} onPress={() => { safeHaptic("light"); adjustHabitProgress(item.id, 1); }} style={styles.progressButton}><MaterialIcons name="add" size={16} color={item.color} /></TouchableOpacity></View> : null}
              <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.round(progress.ratio * 100)}%`, backgroundColor: item.color }]} /></View>
              <TouchableOpacity accessibilityLabel={t("習慣を削除", "Delete habit")} onPress={() => remove(item)} style={styles.removeLink}><Text style={styles.removeLinkText}>{t("削除", "Delete")}</Text></TouchableOpacity>
            </View>
          );
        }}
      />
      <HabitForm visible={formOpen} habit={editingHabit} onClose={() => { setFormOpen(false); setEditingHabit(undefined); }} onSave={(input) => editingHabit ? updateHabit(editingHabit.id, input) : addHabit(input)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 16, paddingBottom: 24, flexGrow: 1 },
  habitCard: { backgroundColor: "rgba(255,255,255,0.86)", borderColor: COLORS.border, borderWidth: 1, borderRadius: 20, padding: 15, marginBottom: 10 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  habitTitleArea: { flexDirection: "row", alignItems: "center", flex: 1, minWidth: 0 },
  habitMark: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 13, marginRight: 11 },
  habitTitleCopy: { flex: 1, minWidth: 0 },
  habitTitle: { color: COLORS.text, fontSize: 16, lineHeight: 22, fontWeight: "800" },
  habitMetaRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 5 },
  habitMeta: { color: COLORS.muted, flex: 1, minWidth: 0, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  explainer: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#E9F4F1", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, marginTop: -6, marginBottom: 12 },
  explainerText: { color: "#245D52", flex: 1, fontSize: 12, lineHeight: 18, fontWeight: "700" },
  todayCheck: { minWidth: 50, height: 38, borderRadius: 13, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  todayCheckText: { fontSize: 12, fontWeight: "800" },
  daysRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 18 },
  dayButton: { width: 30, alignItems: "center", gap: 6 },
  dayLabel: { color: COLORS.muted, fontSize: 11, lineHeight: 14, fontWeight: "800" },
  dayDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: "#CBD7D0", alignItems: "center", justifyContent: "center" },
  dailyProgress: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 3, marginTop: 14 },
  progressButton: { width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: COLORS.white },
  dailyProgressText: { minWidth: 58, textAlign: "center", fontSize: 12, fontWeight: "800" },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: "#E7EEEA", overflow: "hidden", marginTop: 16 },
  progressFill: { height: "100%", borderRadius: 3 },
  removeLink: { minHeight: 30, alignSelf: "flex-end", justifyContent: "flex-end", marginTop: 4 },
  removeLinkText: { color: COLORS.error, fontSize: 12, fontWeight: "700" },
});
