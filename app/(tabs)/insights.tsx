import { FlatList, StyleSheet, View } from "react-native";

import { COLORS, LoadingScreen, ScreenHeading, useFocusPalette } from "@/components/focus-flow/ui";
import { ScaledText as Text } from "@/components/focus-flow/scaled-text";
import { ScreenContainer } from "@/components/screen-container";
import { getAppLanguage, localized } from "@/lib/focus-flow/i18n";
import { useFocusFlow } from "@/lib/focus-flow/provider";
import { dayKeyOffset, getGateRuleSummaries, getGateSummary, shortWeekday, weeklyCompletedTodos, weeklyHabitProgress } from "@/lib/focus-flow/utils";

export default function InsightsScreen() {
  const { todos, habits, memos, focusSessions, gateConfig, displaySettings, isReady } = useFocusFlow();
  const palette = useFocusPalette();
  const language = getAppLanguage(displaySettings); const t = (ja: string, en: string) => localized(language, ja, en);
  if (!isReady) return <ScreenContainer><LoadingScreen /></ScreenContainer>;

  const completed = weeklyCompletedTodos(todos);
  const weekTodoCount = completed.reduce((sum, item) => sum + item.count, 0);
  const habitCompletions = habits.reduce((sum, habit) => sum + weeklyHabitProgress(habit).completed, 0);
  const habitTargets = habits.reduce((sum, habit) => sum + habit.goalPerWeek, 0);
  const maxTodos = Math.max(...completed.map((item) => item.count), 1);
  const gate = getGateSummary({ todos, habits, memos, focusSessions, gateConfig, displaySettings }, new Date(), language);
  const activeRules = getGateRuleSummaries({ todos, habits, memos, focusSessions, gateConfig, displaySettings }, new Date(), language).filter((rule) => rule.isActive);
  const activeWindow = activeRules.find((rule) => Boolean(rule.schedule));
  const hasAlwaysRule = activeRules.some((rule) => rule.id === "always");
  const ruleTitle = !gateConfig.enabled ? t("集中ルールはオフです", "App limits are off") : activeWindow ? t(`「${activeWindow.label}」の時間帯です`, `“${activeWindow.label}” is active`) : hasAlwaysRule ? t("常時の集中ルールです", "Always-on focus rule") : gateConfig.schedules.length ? t("次の実行時間帯を待っています", "Waiting for the next time window") : t("実行時間帯を追加できます", "You can add a time window");
  const ruleText = !gateConfig.enabled ? t("設定画面からオンにすると、選んだアプリを必須項目の完了まで制限できます。", "Turn on App limits in Settings to limit selected apps until must-dos are complete.") : activeWindow || hasAlwaysRule ? gate.pendingCount ? t(`今の解除条件はあと${gate.pendingCount}件です。完了すると制限は自動的に解除されます。`, `${gate.pendingCount} current unlock condition(s) remain. Limits lift automatically when you finish them.`) : t("今の解除条件は完了しています。選択アプリへの制限は解除されています。", "The current unlock conditions are complete. Selected apps are unlocked.") : t("時間帯必須の項目は、選んだ時間帯になるまで「この後」に表示されます。", "Time-window must-dos appear in Up next until their selected time begins.");
  const isActive = Boolean(activeWindow || hasAlwaysRule);

  return <ScreenContainer className="px-5" containerClassName="bg-background"><FlatList data={completed} keyExtractor={(item) => item.key} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
    ListHeaderComponent={<><ScreenHeading eyebrow={t("続ける仕組みを整える", "Strengthen your system")} title={t("振り返り", "Review")} /><View style={styles.summaryRow}><Metric label={t("完了Todo", "Tasks done")} value={`${weekTodoCount}`} detail={t("過去7日間", "Last 7 days")} color={palette.primary} /><Metric label={t("習慣", "Habits")} value={habitTargets ? `${habitCompletions}/${habitTargets}` : "—"} detail={t("今週の記録", "This week")} color={COLORS.warning} /><Metric label={t("残り", "Left")} value={`${gate.pendingCount}`} detail={t("今の解除条件", "Current must-dos")} color={gate.pendingCount ? COLORS.error : COLORS.success} /></View><View style={[styles.ruleCard, { backgroundColor: isActive ? palette.primarySoft : palette.elevated, borderColor: palette.border }]}><Text style={[styles.ruleTitle, { color: palette.text }]}>{ruleTitle}</Text><Text style={[styles.ruleText, { color: palette.muted }]}>{ruleText}</Text></View><Text style={[styles.sectionTitle, { color: palette.text }]}>{t("今週の完了Todo", "Completed tasks this week")}</Text></>}
    renderItem={({ item, index }) => <View style={[styles.todoMetric, { backgroundColor: palette.surface, borderColor: palette.border }]}><View style={styles.todoDay}><Text style={[styles.todoDayName, { color: palette.text }]}>{shortWeekday(item.key, language)}</Text><Text style={[styles.todoDate, { color: palette.muted }]}>{dayKeyOffset(index - 6).slice(5).replace("-", "/")}</Text></View><View style={[styles.todoTrack, { backgroundColor: palette.elevated }]}><View style={[styles.todoFill, { width: `${Math.round((item.count / maxTodos) * 100)}%`, backgroundColor: palette.primary }]} /></View><Text style={[styles.todoCount, { color: palette.muted }]}>{language === "en" ? item.count : `${item.count}件`}</Text></View>}
    ListFooterComponent={<View style={[styles.noteCard, { backgroundColor: palette.primarySoft, borderColor: palette.border }]}><Text style={[styles.noteTitle, { color: palette.primary }]}>{t("振り返りのヒント", "A reflection tip")}</Text><Text style={[styles.noteText, { color: palette.muted }]}>{t("制限を強くするより、毎日完了できる小さなTodoと習慣を必須項目にすることが続けやすさにつながります。時間帯は生活リズムに合わせて調整しましょう。", "Instead of making limits stricter, use small tasks and habits you can finish each day as must-dos. Adjust time windows to your routine.")}</Text></View>}
  /></ScreenContainer>;
}

function Metric({ label, value, detail, color }: { label: string; value: string; detail: string; color: string }) { const palette = useFocusPalette(); return <View style={[styles.metric, { backgroundColor: palette.surface, borderColor: palette.border }]}><View style={[styles.metricMark, { backgroundColor: color }]} /><Text style={[styles.metricLabel, { color: palette.muted }]}>{label}</Text><Text style={[styles.metricValue, { color: palette.text }]} numberOfLines={1}>{value}</Text><Text style={[styles.metricDetail, { color: palette.muted }]}>{detail}</Text></View>; }

const styles = StyleSheet.create({
  content: { paddingTop: 16, paddingBottom: 28 }, summaryRow: { flexDirection: "row", gap: 8, marginBottom: 18 }, metric: { flex: 1, minWidth: 0, borderRadius: 18, borderWidth: 1, padding: 12 }, metricMark: { width: 22, height: 4, borderRadius: 2, marginBottom: 12 }, metricLabel: { color: COLORS.muted, fontSize: 11, lineHeight: 15, fontWeight: "700" }, metricValue: { color: COLORS.text, fontSize: 17, lineHeight: 23, fontWeight: "800", letterSpacing: -0.4, marginTop: 2 }, metricDetail: { color: COLORS.muted, fontSize: 10, lineHeight: 14, marginTop: 3 }, ruleCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 22 }, ruleTitle: { color: COLORS.text, fontSize: 15, fontWeight: "800" }, ruleText: { color: COLORS.muted, fontSize: 13, lineHeight: 20, marginTop: 5 }, sectionTitle: { color: COLORS.text, fontSize: 18, lineHeight: 24, fontWeight: "800", marginBottom: 10 }, todoMetric: { flexDirection: "row", alignItems: "center", gap: 11, borderRadius: 15, borderWidth: 1, padding: 12, marginBottom: 8 }, todoDay: { width: 41 }, todoDayName: { color: COLORS.text, fontSize: 13, fontWeight: "800" }, todoDate: { color: COLORS.muted, fontSize: 10, marginTop: 2 }, todoTrack: { flex: 1, height: 7, borderRadius: 4, overflow: "hidden" }, todoFill: { height: "100%", borderRadius: 4 }, todoCount: { width: 30, textAlign: "right", color: COLORS.muted, fontSize: 12, fontWeight: "700" }, noteCard: { borderRadius: 18, borderWidth: 1, padding: 17, marginTop: 14 }, noteTitle: { color: COLORS.forest, fontSize: 14, fontWeight: "800" }, noteText: { color: COLORS.muted, fontSize: 13, lineHeight: 20, marginTop: 6 },
});
