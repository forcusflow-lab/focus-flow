import { FlatList, StyleSheet, Text, View } from "react-native";

import { COLORS, LoadingScreen, ScreenHeading } from "@/components/focus-flow/ui";
import { ScreenContainer } from "@/components/screen-container";
import { useFocusFlow } from "@/lib/focus-flow/provider";
import { dayKeyOffset, getGateSummary, isGateTimeActive, shortWeekday, weeklyCompletedTodos, weeklyHabitProgress } from "@/lib/focus-flow/utils";

export default function InsightsScreen() {
  const { todos, habits, focusSessions, gateConfig, displaySettings, isReady } = useFocusFlow();
  if (!isReady) return <ScreenContainer><LoadingScreen /></ScreenContainer>;

  const completed = weeklyCompletedTodos(todos);
  const weekTodoCount = completed.reduce((sum, item) => sum + item.count, 0);
  const habitCompletions = habits.reduce((sum, habit) => sum + weeklyHabitProgress(habit).completed, 0);
  const habitTargets = habits.reduce((sum, habit) => sum + habit.goalPerWeek, 0);
  const maxTodos = Math.max(...completed.map((item) => item.count), 1);
  const gate = getGateSummary({ todos, habits, focusSessions, gateConfig, displaySettings });
  const timeActive = isGateTimeActive(gateConfig);

  return <ScreenContainer className="px-5" containerClassName="bg-background"><FlatList data={completed} keyExtractor={(item) => item.key} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
    ListHeaderComponent={<><ScreenHeading eyebrow="続ける仕組みを整える" title="振り返り" /><View style={styles.summaryRow}><Metric label="完了Todo" value={`${weekTodoCount}`} detail="過去7日間" color={COLORS.forest} /><Metric label="習慣" value={habitTargets ? `${habitCompletions}/${habitTargets}` : "—"} detail="今週の記録" color={COLORS.warning} /><Metric label="残り" value={`${gate.pendingCount}`} detail="今日の必須項目" color={gate.pendingCount ? COLORS.error : COLORS.success} /></View><View style={[styles.ruleCard, timeActive ? styles.ruleCardActive : styles.ruleCardPaused]}><Text style={styles.ruleTitle}>{timeActive ? "集中ルールの時間帯です" : "集中ルールは時間外です"}</Text><Text style={styles.ruleText}>{gateConfig.enabled ? gate.pendingCount ? `今日の必須項目はあと${gate.pendingCount}件です。完了すると制限は自動的に解除されます。` : "今日の必須項目は完了しています。選択アプリへの制限は解除されています。" : "集中ルールはオフです。設定画面から有効にできます。"}</Text></View><Text style={styles.sectionTitle}>今週の完了Todo</Text></>}
    renderItem={({ item, index }) => <View style={styles.todoMetric}><View style={styles.todoDay}><Text style={styles.todoDayName}>{shortWeekday(item.key)}</Text><Text style={styles.todoDate}>{dayKeyOffset(index - 6).slice(5).replace("-", "/")}</Text></View><View style={styles.todoTrack}><View style={[styles.todoFill, { width: `${Math.round((item.count / maxTodos) * 100)}%` }]} /></View><Text style={styles.todoCount}>{item.count}件</Text></View>}
    ListFooterComponent={<View style={styles.noteCard}><Text style={styles.noteTitle}>振り返りのヒント</Text><Text style={styles.noteText}>制限を強くするより、毎日完了できる小さなTodoと習慣を必須項目にすることが続けやすさにつながります。時間帯は生活リズムに合わせて調整しましょう。</Text></View>}
  /></ScreenContainer>;
}

function Metric({ label, value, detail, color }: { label: string; value: string; detail: string; color: string }) { return <View style={styles.metric}><View style={[styles.metricMark, { backgroundColor: color }]} /><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue} numberOfLines={1}>{value}</Text><Text style={styles.metricDetail}>{detail}</Text></View>; }

const styles = StyleSheet.create({
  content: { paddingTop: 16, paddingBottom: 28 }, summaryRow: { flexDirection: "row", gap: 8, marginBottom: 18 }, metric: { flex: 1, minWidth: 0, backgroundColor: COLORS.white, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 12 }, metricMark: { width: 22, height: 4, borderRadius: 2, marginBottom: 12 }, metricLabel: { color: COLORS.muted, fontSize: 11, lineHeight: 15, fontWeight: "700" }, metricValue: { color: COLORS.text, fontSize: 17, lineHeight: 23, fontWeight: "800", letterSpacing: -0.4, marginTop: 2 }, metricDetail: { color: COLORS.muted, fontSize: 10, lineHeight: 14, marginTop: 3 }, ruleCard: { borderRadius: 20, padding: 16, marginBottom: 22 }, ruleCardActive: { backgroundColor: "#E8F0EC" }, ruleCardPaused: { backgroundColor: "#EEF1F4" }, ruleTitle: { color: COLORS.text, fontSize: 15, fontWeight: "800" }, ruleText: { color: "#46635A", fontSize: 13, lineHeight: 20, marginTop: 5 }, sectionTitle: { color: COLORS.text, fontSize: 18, lineHeight: 24, fontWeight: "800", marginBottom: 10 }, todoMetric: { flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: COLORS.white, borderRadius: 15, borderColor: COLORS.border, borderWidth: 1, padding: 12, marginBottom: 8 }, todoDay: { width: 41 }, todoDayName: { color: COLORS.text, fontSize: 13, fontWeight: "800" }, todoDate: { color: COLORS.muted, fontSize: 10, marginTop: 2 }, todoTrack: { flex: 1, height: 7, borderRadius: 4, backgroundColor: "#E7EEEA", overflow: "hidden" }, todoFill: { height: "100%", borderRadius: 4, backgroundColor: COLORS.forest }, todoCount: { width: 30, textAlign: "right", color: COLORS.muted, fontSize: 12, fontWeight: "700" }, noteCard: { backgroundColor: "#E8F0EC", borderRadius: 18, padding: 17, marginTop: 14 }, noteTitle: { color: COLORS.forest, fontSize: 14, fontWeight: "800" }, noteText: { color: "#38564C", fontSize: 13, lineHeight: 20, marginTop: 6 },
});
