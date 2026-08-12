import { FlatList, StyleSheet, Text, View } from "react-native";

import { COLORS, LoadingScreen, ScreenHeading } from "@/components/focus-flow/ui";
import { ScreenContainer } from "@/components/screen-container";
import { useFocusFlow } from "@/lib/focus-flow/provider";
import { dayKeyOffset, formatMinutes, shortWeekday, totalFocusMinutes, weeklyCompletedTodos, weeklyFocusMinutes, weeklyHabitProgress } from "@/lib/focus-flow/utils";

export default function InsightsScreen() {
  const { todos, habits, focusSessions, isReady } = useFocusFlow();
  if (!isReady) return <ScreenContainer><LoadingScreen /></ScreenContainer>;

  const focus = weeklyFocusMinutes(focusSessions);
  const completed = weeklyCompletedTodos(todos);
  const maxFocus = Math.max(...focus.map((item) => item.minutes), 1);
  const totalWeekFocus = focus.reduce((sum, item) => sum + item.minutes, 0);
  const weekTodoCount = completed.reduce((sum, item) => sum + item.count, 0);
  const habitCompletions = habits.reduce((sum, habit) => sum + weeklyHabitProgress(habit).completed, 0);
  const habitTargets = habits.reduce((sum, habit) => sum + habit.goalPerWeek, 0);

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <FlatList
        data={completed}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <ScreenHeading eyebrow="小さな前進を見つける" title="振り返り" />
            <View style={styles.summaryRow}>
              <Metric label="集中" value={formatMinutes(totalWeekFocus)} detail="過去7日間" color={COLORS.blue} />
              <Metric label="完了Todo" value={`${weekTodoCount}`} detail="過去7日間" color={COLORS.forest} />
              <Metric label="習慣" value={habitTargets ? `${habitCompletions}/${habitTargets}` : "—"} detail="今週の記録" color={COLORS.warning} />
            </View>
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}><View><Text style={styles.cardTitle}>集中のリズム</Text><Text style={styles.cardDescription}>完了した集中セッションの合計時間</Text></View><Text style={styles.cardNumber}>{formatMinutes(totalFocusMinutes(focusSessions))}</Text></View>
              <View style={styles.chart}>
                {focus.map((item) => <View key={item.key} style={styles.barColumn}><View style={styles.barArea}><View style={[styles.bar, { height: `${Math.max((item.minutes / maxFocus) * 100, item.minutes ? 8 : 2)}%` }]} /></View><Text style={styles.barLabel}>{shortWeekday(item.key)}</Text></View>)}
              </View>
            </View>
            <Text style={styles.sectionTitle}>今週のTodo</Text>
          </>
        }
        renderItem={({ item, index }) => <View style={styles.todoMetric}><View style={styles.todoDay}><Text style={styles.todoDayName}>{shortWeekday(item.key)}</Text><Text style={styles.todoDate}>{dayKeyOffset(index - 6).slice(5).replace("-", "/")}</Text></View><View style={styles.todoTrack}><View style={[styles.todoFill, { width: `${Math.min(item.count * 25, 100)}%` }]} /></View><Text style={styles.todoCount}>{item.count}件</Text></View>}
        ListFooterComponent={<View style={styles.noteCard}><Text style={styles.noteTitle}>振り返りのヒント</Text><Text style={styles.noteText}>「集中した時間」「終えた行動」「続けた習慣」のいずれか一つが増えていれば、今週は前進しています。次週は、最も続けやすかった行動を一つだけ残してみましょう。</Text></View>}
      />
    </ScreenContainer>
  );
}

function Metric({ label, value, detail, color }: { label: string; value: string; detail: string; color: string }) {
  return <View style={styles.metric}><View style={[styles.metricMark, { backgroundColor: color }]} /><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue} numberOfLines={1}>{value}</Text><Text style={styles.metricDetail}>{detail}</Text></View>;
}

const styles = StyleSheet.create({
  content: { paddingTop: 16, paddingBottom: 28 },
  summaryRow: { flexDirection: "row", gap: 8, marginBottom: 18 },
  metric: { flex: 1, minWidth: 0, backgroundColor: COLORS.white, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 12 },
  metricMark: { width: 22, height: 4, borderRadius: 2, marginBottom: 12 },
  metricLabel: { color: COLORS.muted, fontSize: 11, lineHeight: 15, fontWeight: "700" },
  metricValue: { color: COLORS.text, fontSize: 17, lineHeight: 23, fontWeight: "800", letterSpacing: -0.4, marginTop: 2 },
  metricDetail: { color: COLORS.muted, fontSize: 10, lineHeight: 14, marginTop: 3 },
  chartCard: { backgroundColor: COLORS.white, borderRadius: 20, borderColor: COLORS.border, borderWidth: 1, padding: 16, marginBottom: 22 },
  chartHeader: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: "800" },
  cardDescription: { color: COLORS.muted, fontSize: 12, lineHeight: 17, marginTop: 3, maxWidth: 220 },
  cardNumber: { color: COLORS.blue, fontSize: 15, fontWeight: "800" },
  chart: { height: 154, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 16 },
  barColumn: { flex: 1, alignItems: "center", height: "100%" },
  barArea: { flex: 1, width: 18, justifyContent: "flex-end", backgroundColor: "#ECF0F4", borderRadius: 9, overflow: "hidden" },
  bar: { width: "100%", backgroundColor: COLORS.blue, borderRadius: 9 },
  barLabel: { color: COLORS.muted, fontSize: 11, marginTop: 8, fontWeight: "700" },
  sectionTitle: { color: COLORS.text, fontSize: 18, lineHeight: 24, fontWeight: "800", marginBottom: 10 },
  todoMetric: { flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: COLORS.white, borderRadius: 15, borderColor: COLORS.border, borderWidth: 1, padding: 12, marginBottom: 8 },
  todoDay: { width: 41 },
  todoDayName: { color: COLORS.text, fontSize: 13, fontWeight: "800" },
  todoDate: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  todoTrack: { flex: 1, height: 7, borderRadius: 4, backgroundColor: "#E7EEEA", overflow: "hidden" },
  todoFill: { height: "100%", borderRadius: 4, backgroundColor: COLORS.forest },
  todoCount: { width: 30, textAlign: "right", color: COLORS.muted, fontSize: 12, fontWeight: "700" },
  noteCard: { backgroundColor: "#E8F0EC", borderRadius: 18, padding: 17, marginTop: 14 },
  noteTitle: { color: COLORS.forest, fontSize: 14, fontWeight: "800" },
  noteText: { color: "#38564C", fontSize: 13, lineHeight: 20, marginTop: 6 },
});
