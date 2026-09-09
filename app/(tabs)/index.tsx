import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { HabitForm } from "@/components/focus-flow/habit-form";
import { HabitItemCard, TodoItemCard } from "@/components/focus-flow/item-cards";
import { TaskForm } from "@/components/focus-flow/task-form";
import { ScaledText as Text } from "@/components/focus-flow/scaled-text";
import { IconButton, LoadingScreen, safeHaptic, useFocusPalette } from "@/components/focus-flow/ui";
import { ScreenContainer } from "@/components/screen-container";
import { isEnglish } from "@/lib/focus-flow/i18n";
import { R, stringResource } from "@/lib/focus-flow/strings";
import { useFocusFlow } from "@/lib/focus-flow/provider";
import type { Habit, Todo } from "@/lib/focus-flow/types";
import {
  dayKey,
  getGateRuleSummaries,
  getGateSummary,
  isHabitCompleteOn,
  isHabitScheduledOn,
  isTodoAchieved,
  isTodoEffectiveRequired,
} from "@/lib/focus-flow/utils";

type HomeListItem =
  | { type: "heading"; id: string; title: string; detail?: string }
  | { type: "todo"; id: string; todo: Todo }
  | { type: "habit"; id: string; habit: Habit };

export default function TodayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ completed?: string | string[] }>();
  const {
    todos,
    habits,
    memos,
    focusSessions,
    gateConfig,
    displaySettings,
    isReady,
    toggleTodo,
    toggleSubtask,
    toggleHabit,
    startHabitTimer,
    pauseHabitTimer,
    adjustHabitProgress,
    addTodo,
    updateTodo,
    deleteTodo,
    updateHabit,
    deleteHabit,
  } = useFocusFlow();

  const palette = useFocusPalette();
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [newTaskDefaultRequired, setNewTaskDefaultRequired] = useState(false);
  const [openedTodo, setOpenedTodo] = useState<Todo | undefined>();
  const [openedHabit, setOpenedHabit] = useState<Habit | undefined>();
  const [showCompleted, setShowCompleted] = useState(false);

  const english = isEnglish(displaySettings);
  const today = dayKey();
  const t = useCallback((ja: string, en: string) => (english ? en : ja), [english]);

  const dateHeaderLabel = useMemo(() => {
    const current = new Date();
    const month = current.getMonth() + 1;
    const day = current.getDate();
    const JA_WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
    const EN_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    if (english) {
      return stringResource(
        R.string.today_date_format,
        "en",
        EN_MONTHS[current.getMonth()],
        day,
        EN_WEEKDAYS[current.getDay()]
      );
    }
    return stringResource(
      R.string.today_date_format,
      "ja",
      month,
      day,
      JA_WEEKDAYS[current.getDay()]
    );
  }, [english, today]);

  useEffect(() => {
    const reveal = Array.isArray(params.completed) ? params.completed[0] : params.completed;
    if (reveal === "1") setShowCompleted(true);
  }, [params.completed]);

  const gateSummary = useMemo(
    () =>
      getGateSummary(
        { todos, habits, memos, focusSessions, gateConfig, displaySettings },
        new Date(),
        english ? "en" : "ja"
      ),
    [todos, habits, memos, focusSessions, gateConfig, displaySettings, english]
  );

  const activeRules = useMemo(
    () =>
      getGateRuleSummaries(
        { todos, habits, memos, focusSessions, gateConfig, displaySettings },
        new Date(),
        english ? "en" : "ja"
      ).filter((rule) => rule.isActive),
    [todos, habits, memos, focusSessions, gateConfig, displaySettings, english]
  );

  const effectiveTodos = useMemo(() => todos.filter((todo) => isTodoEffectiveRequired(todo)), [todos]);
  const effectiveHabits = useMemo(
    () => habits.filter((habit) => habit.isRequired && isHabitScheduledOn(habit)),
    [habits]
  );

  const openTodos = effectiveTodos.filter((todo) => !isTodoAchieved(todo));
  const openHabits = effectiveHabits.filter((habit) => !isHabitCompleteOn(habit, today));
  const doneTodos = useMemo(() => effectiveTodos.filter((todo) => isTodoAchieved(todo)), [effectiveTodos]);
  const doneHabits = useMemo(
    () => effectiveHabits.filter((habit) => isHabitCompleteOn(habit, today)),
    [effectiveHabits, today]
  );

  const hiddenCompletedCount = doneTodos.length + doneHabits.length;
  const pendingRequired = openTodos.length + openHabits.length;
  const totalRequired = effectiveTodos.length + effectiveHabits.length;
  const doneRequired = Math.max(totalRequired - pendingRequired, 0);
  const timeActive = activeRules.some((rule) => rule.id === "always" || Boolean(rule.schedule));
  const gateLocked = gateConfig.enabled && timeActive && gateSummary.pendingCount > 0;
  const activeScheduledRule = activeRules.find((rule) => Boolean(rule.schedule && rule.pendingCount > 0));

  const listItems = useMemo<HomeListItem[]>(() => {
    const result: HomeListItem[] = [];
    const allDayTodos = openTodos.filter(
      (todo) => todo.requiredWindowMode !== "scheduled" || !(todo.requiredScheduleIds?.length)
    );
    const allDayHabits = openHabits.filter(
      (habit) => habit.requiredWindowMode !== "scheduled" || !(habit.requiredScheduleIds?.length)
    );
    const scheduledTodos = openTodos.filter(
      (todo) => todo.requiredWindowMode === "scheduled" && (todo.requiredScheduleIds?.length ?? 0) > 0
    );
    const scheduledHabits = openHabits.filter(
      (habit) => habit.requiredWindowMode === "scheduled" && (habit.requiredScheduleIds?.length ?? 0) > 0
    );

    // 今日の対象: フラットなテキスト見出し
    if (allDayTodos.length || allDayHabits.length) {
      result.push(
        { type: "heading", id: "today-open", title: t("今日のタスク", "Today’s tasks") },
        ...allDayTodos.map((todo) => ({ type: "todo" as const, id: `todo-${todo.id}`, todo })),
        ...allDayHabits.map((habit) => ({ type: "habit" as const, id: `habit-${habit.id}`, habit }))
      );
    }
    if (scheduledTodos.length || scheduledHabits.length) {
      result.push(
        { type: "heading", id: "today-scheduled", title: t("指定時間帯のタスク", "Scheduled tasks") },
        ...scheduledTodos.map((todo) => ({ type: "todo" as const, id: `todo-${todo.id}`, todo })),
        ...scheduledHabits.map((habit) => ({ type: "habit" as const, id: `habit-${habit.id}`, habit }))
      );
    }
    if (showCompleted && hiddenCompletedCount) {
      result.push(
        {
          type: "heading",
          id: "today-completed",
          title: stringResource(R.string.today_completed_heading, english ? "en" : "ja"),
        },
        ...doneTodos.map((todo) => ({ type: "todo" as const, id: `done-todo-${todo.id}`, todo })),
        ...doneHabits.map((habit) => ({ type: "habit" as const, id: `done-habit-${habit.id}`, habit }))
      );
    }
    return result;
  }, [doneHabits, doneTodos, english, hiddenCompletedCount, openHabits, openTodos, showCompleted, t]);

  const openTaskForm = (defaultRequired = false) => {
    setNewTaskDefaultRequired(defaultRequired);
    setTaskFormOpen(true);
  };

  if (!isReady) {
    return (
      <ScreenContainer>
        <LoadingScreen />
      </ScreenContainer>
    );
  }

  // 統合ダッシュボード: 制限ステータス文言
  // (today_banner_locked, today_banner_locked_window, today_banner_unlocked, today_banner_subtext, today_progress_heading を統合集約)
  const gateStatusLabel = !gateConfig.enabled
    ? stringResource(R.string.today_banner_off, english ? "en" : "ja")
    : gateLocked
    ? activeScheduledRule?.schedule
      ? stringResource(
          R.string.today_banner_locked_window,
          english ? "en" : "ja",
          activeScheduledRule.schedule.startTime,
          activeScheduledRule.schedule.endTime
        )
      : t("アプリ制限中", "App limits active")
    : stringResource(R.string.today_banner_unlocked, english ? "en" : "ja");

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <FlatList
        data={listItems}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <View style={styles.topline}>
              <Text style={[styles.dateHeading, { color: palette.text }]}>
                {dateHeaderLabel}
              </Text>
              <IconButton icon="add" label={t("Todoを追加", "Add task")} onPress={() => openTaskForm()} variant="filled" />
            </View>

            {/* 統合ダッシュボードカード (2枚を1枚に集約) */}
            <View
              style={[
                styles.dashboardCard,
                {
                  backgroundColor: palette.elevated,
                  borderColor: palette.border,
                },
              ]}
            >
              {/* カード上部: 制限状態 & 設定遷移導線 */}
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/settings" as never)}
                activeOpacity={0.75}
                style={styles.gateRow}
                accessibilityRole="button"
                accessibilityLabel={t("アプリ制限の設定を開く", "Open app limits settings")}
              >
                <View style={styles.gateStatusGroup}>
                  <MaterialIcons
                    name={!gateConfig.enabled ? "lock-clock" : gateLocked ? "lock" : "lock-open"}
                    size={16}
                    color={gateLocked ? palette.primary : palette.muted}
                  />
                  <Text
                    style={[
                      styles.gateStatusText,
                      { color: gateLocked ? palette.text : palette.muted },
                    ]}
                    numberOfLines={1}
                  >
                    {gateStatusLabel}
                  </Text>
                </View>
                <View style={styles.gateArrowGroup}>
                  <Text style={[styles.gateSettingsHint, { color: palette.muted }]}>
                    {t("設定", "Settings")}
                  </Text>
                  <MaterialIcons name="chevron-right" size={18} color={palette.muted} />
                </View>
              </TouchableOpacity>

              {/* 区切り線 */}
              <View style={[styles.dashboardDivider, { backgroundColor: palette.border }]} />

              {/* カード中央: 進捗 & 完了数 & フル幅プログレスバー */}
              <View style={styles.progressSection}>
                <View style={styles.progressHeaderRow}>
                  <Text style={[styles.progressTitleText, { color: palette.text }]}>
                    {stringResource(R.string.today_progress_label, english ? "en" : "ja")}
                  </Text>
                  <Text style={styles.progressCountText}>
                    <Text style={[styles.progressCountCurrent, { color: palette.primary }]}>
                      {doneRequired}
                    </Text>
                    <Text style={{ color: palette.muted, fontSize: 13 }}> / {totalRequired} </Text>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: palette.muted }}>
                      {t("完了", "complete")}
                    </Text>
                  </Text>
                </View>

                <View style={[styles.progressBarTrack, { backgroundColor: palette.surface }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${totalRequired ? Math.round((doneRequired / totalRequired) * 100) : 0}%`,
                        backgroundColor: palette.primary,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* カード下部: Todo/習慣の内訳 */}
              <View style={[styles.breakdownRow, { borderTopColor: palette.border }]}>
                <View style={styles.breakdownItem}>
                  <MaterialIcons name="check-box" size={13} color={palette.primary} />
                  <Text style={[styles.breakdownText, { color: palette.muted }]}>
                    {t(`Todo ${openTodos.length}件`, `Tasks: ${openTodos.length}`)}
                  </Text>
                </View>
                <View style={[styles.breakdownDot, { backgroundColor: palette.border }]} />
                <View style={styles.breakdownItem}>
                  <MaterialIcons name="repeat" size={13} color={palette.primary} />
                  <Text style={[styles.breakdownText, { color: palette.muted }]}>
                    {t(`習慣 ${openHabits.length}件`, `Habits: ${openHabits.length}`)}
                  </Text>
                </View>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={[styles.emptyPanel, { backgroundColor: palette.elevated }]}>
            <MaterialIcons name="done-all" size={22} color={palette.primary} />
            <View>
              <Text style={[styles.emptyTitle, { color: palette.text }]}>
                {t("今日の未完了項目はありません", "No open items for today")}
              </Text>
              <Text style={[styles.emptyText, { color: palette.muted }]}>
                {t("新しいTodoを追加するか、明日の項目を整えましょう。", "Add a new task or plan your next action.")}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) =>
          item.type === "heading" ? (
            <View style={styles.sectionHeaderFlat}>
              <Text style={[styles.sectionTitleFlat, { color: palette.text }]}>{item.title}</Text>
            </View>
          ) : item.type === "todo" ? (
            <TodoItemCard
              todo={item.todo}
              showRequired
              language={english ? "en" : "ja"}
              t={t}
              onToggle={() => {
                const result = toggleTodo(item.todo.id);
                safeHaptic(result.ok ? "success" : "light");
              }}
              onOpen={() => setOpenedTodo(item.todo)}
              onToggleSubtask={(subtaskId) => {
                toggleSubtask(item.todo.id, subtaskId);
              }}
            />
          ) : (
            <HabitItemCard
              habit={item.habit}
              showRequired
              language={english ? "en" : "ja"}
              t={t}
              onToggle={(date) => {
                const result = toggleHabit(item.habit.id, date);
                safeHaptic(result.ok ? "success" : "light");
              }}
              onStartTimer={() => {
                const result = startHabitTimer(item.habit.id);
                if (result.ok) safeHaptic("light");
              }}
              onPauseTimer={() => {
                const result = pauseHabitTimer(item.habit.id);
                if (result.ok) safeHaptic("light");
              }}
              onProgress={(delta) => {
                const result = adjustHabitProgress(item.habit.id, delta);
                if (result.ok && delta > 0) safeHaptic("light");
              }}
              onOpen={() => setOpenedHabit(item.habit)}
            />
          )
        }
        ListFooterComponent={
          hiddenCompletedCount ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ expanded: showCompleted }}
              onPress={() => setShowCompleted((value) => !value)}
              style={[
                styles.revealCompleted,
                { backgroundColor: palette.elevated, borderColor: palette.border },
              ]}
            >
              <MaterialIcons
                name={showCompleted ? "visibility-off" : "visibility"}
                size={18}
                color={palette.primary}
              />
              <Text style={[styles.revealCompletedText, { color: palette.primary }]}>
                {showCompleted
                  ? t("完了済みを非表示", "Hide completed")
                  : t(`完了済みを表示（${hiddenCompletedCount}件）`, `Show completed (${hiddenCompletedCount})`)}
              </Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <TaskForm
        visible={taskFormOpen}
        defaultRequired={newTaskDefaultRequired}
        onClose={() => {
          setTaskFormOpen(false);
          setNewTaskDefaultRequired(false);
        }}
        onSave={addTodo}
      />
      <TaskForm visible={Boolean(openedTodo)}
        todo={openedTodo}
        onClose={() => setOpenedTodo(undefined)}
        onSave={(input) => (openedTodo ? updateTodo(openedTodo.id, input) : { ok: false })}
        onDelete={openedTodo ? () => deleteTodo(openedTodo.id) : undefined}
      />
      <HabitForm visible={Boolean(openedHabit)}
        habit={openedHabit}
        onClose={() => setOpenedHabit(undefined)}
        onSave={(input) => (openedHabit ? updateHabit(openedHabit.id, input) : { ok: false })}
        onDelete={openedHabit ? () => deleteHabit(openedHabit.id) : undefined}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 10,
    paddingBottom: 24,
    flexGrow: 1,
  },
  topline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dateHeading: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  dashboardCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: 11,
    marginBottom: 10,
  },
  gateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 1,
  },
  gateStatusGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  gateStatusText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
  },
  gateArrowGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  gateSettingsHint: {
    fontSize: 11,
    fontWeight: "700",
  },
  dashboardDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 9,
  },
  progressSection: {
    gap: 7,
  },
  progressHeaderRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  progressTitleText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
  },
  progressCountText: {
    fontSize: 13,
    lineHeight: 18,
    fontVariant: ["tabular-nums"],
  },
  progressCountCurrent: {
    fontSize: 15,
    fontWeight: "900",
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 999,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 9,
    paddingTop: 7,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  breakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  breakdownText: {
    fontSize: 11,
    fontWeight: "700",
  },
  breakdownDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  sectionHeaderFlat: {
    paddingTop: 10,
    paddingBottom: 4,
    marginTop: 4,
    marginBottom: 4,
  },
  sectionTitleFlat: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  emptyPanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 15,
    padding: 14,
    marginTop: 3,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  emptyText: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  revealCompleted: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 13,
    borderWidth: 1,
    marginTop: 8,
  },
  revealCompletedText: {
    fontSize: 12,
    fontWeight: "800",
  },
});
