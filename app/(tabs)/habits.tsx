import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo, useState } from "react";
import { Alert, FlatList, Platform, StyleSheet, TouchableOpacity, View } from "react-native";

import { HabitForm } from "@/components/focus-flow/habit-form";
import { ScaledText as Text } from "@/components/focus-flow/scaled-text";
import { COLORS, EmptyState, IconButton, LoadingScreen, Pill, safeHaptic, ScreenHeading } from "@/components/focus-flow/ui";
import { ScreenContainer } from "@/components/screen-container";
import { useFocusFlow } from "@/lib/focus-flow/provider";
import type { Habit } from "@/lib/focus-flow/types";
import { dayKey, dayKeyOffset, habitStreak, isHabitCompleteOn, shortWeekday, weeklyHabitProgress } from "@/lib/focus-flow/utils";

export default function HabitsScreen() {
  const { habits, isReady, addHabit, updateHabit, toggleHabit, deleteHabit } = useFocusFlow();
  const [formOpen, setFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>();
  const week = useMemo(() => Array.from({ length: 7 }, (_, index) => dayKeyOffset(index - 6)), []);
  const openForm = (habit?: Habit) => { setEditingHabit(habit); setFormOpen(true); };
  const remove = (habit: Habit) => {
    const confirm = () => deleteHabit(habit.id);
    if (Platform.OS === "web") confirm();
    else Alert.alert("習慣を削除しますか？", `「${habit.title}」の記録も削除されます。`, [{ text: "キャンセル", style: "cancel" }, { text: "削除", style: "destructive", onPress: confirm }]);
  };
  if (!isReady) return <ScreenContainer><LoadingScreen /></ScreenContainer>;

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<><ScreenHeading eyebrow="続ける仕組み" title="習慣" action={<IconButton icon="add" label="習慣を追加" onPress={() => openForm()} variant="filled" />} /><View style={styles.explainer}><MaterialIcons name="lock-outline" size={17} color={COLORS.forest} /><Text style={styles.explainerText}>必須の習慣は、アプリ制限を解除する条件になります。</Text></View></>}
        ListEmptyComponent={<EmptyState icon="repeat" title="最初の習慣を作りましょう" description="登録時に「必須の習慣」を選ぶと、毎日のアプリ制限の解除条件にできます。" actionLabel="習慣を作る" onAction={() => openForm()} />}
        renderItem={({ item }) => {
          const progress = weeklyHabitProgress(item);
          const todayDone = isHabitCompleteOn(item, dayKey());
          return (
            <View style={styles.habitCard}>
              <View style={styles.cardTop}>
                <TouchableOpacity onPress={() => openForm(item)} activeOpacity={0.72} style={styles.habitTitleArea}>
                  <View style={[styles.habitMark, { backgroundColor: `${item.color}18` }]}><MaterialIcons name="auto-awesome" size={18} color={item.color} /></View>
                  <View style={styles.habitTitleCopy}><Text style={styles.habitTitle} numberOfLines={1}>{item.title}</Text><View style={styles.habitMetaRow}>{item.isRequired ? <Pill label="必須" color={COLORS.forest} /> : null}<Text style={styles.habitMeta} numberOfLines={1}>週 {progress.completed}/{progress.target} ・ {habitStreak(item)}日連続</Text></View></View>
                </TouchableOpacity>
                <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: todayDone }} accessibilityLabel="今日の習慣を記録" onPress={() => { safeHaptic(todayDone ? "light" : "success"); toggleHabit(item.id); }} style={[styles.todayCheck, todayDone && { backgroundColor: item.color, borderColor: item.color }]}>
                  {todayDone ? <MaterialIcons name="check" size={19} color={COLORS.white} /> : <Text style={[styles.todayCheckText, { color: item.color }]}>今日</Text>}
                </TouchableOpacity>
              </View>
              <View style={styles.daysRow}>
                {week.map((key) => {
                  const done = isHabitCompleteOn(item, key);
                  const isToday = key === dayKey();
                  return (
                    <TouchableOpacity key={key} accessibilityLabel={`${shortWeekday(key)}曜日を記録`} onPress={() => { safeHaptic(done ? "light" : "success"); toggleHabit(item.id, key); }} style={styles.dayButton}>
                      <Text style={[styles.dayLabel, isToday && { color: item.color }]}>{shortWeekday(key)}</Text>
                      <View style={[styles.dayDot, done && { backgroundColor: item.color, borderColor: item.color }, isToday && !done && { borderColor: item.color }]}>{done ? <MaterialIcons name="check" size={13} color={COLORS.white} /> : null}</View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.round(progress.ratio * 100)}%`, backgroundColor: item.color }]} /></View>
              <TouchableOpacity accessibilityLabel="習慣を削除" onPress={() => remove(item)} style={styles.removeLink}><Text style={styles.removeLinkText}>削除</Text></TouchableOpacity>
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
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: "#E7EEEA", overflow: "hidden", marginTop: 16 },
  progressFill: { height: "100%", borderRadius: 3 },
  removeLink: { minHeight: 30, alignSelf: "flex-end", justifyContent: "flex-end", marginTop: 4 },
  removeLinkText: { color: COLORS.error, fontSize: 12, fontWeight: "700" },
});
