import type { FocusFlowData, FocusSession, GateConfig, GateSchedule, Habit, Todo } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function dayKey(date = new Date()) {
  const local = new Date(date);
  return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`;
}

export function dayKeyOffset(offset: number, base = new Date()) {
  const date = new Date(base);
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return dayKey(date);
}

export function dayKeyToDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function formatJapaneseDate(value?: string) {
  if (!value) return "期限なし";
  const date = dayKeyToDate(value);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function isHabitCompleteOn(habit: Habit, value: string) {
  return habit.completedDates.includes(value);
}

export function habitStreak(habit: Habit, base = new Date()) {
  let streak = 0;
  let offset = 0;
  while (isHabitCompleteOn(habit, dayKeyOffset(offset, base))) {
    streak += 1;
    offset -= 1;
  }
  return streak;
}

export function weeklyHabitProgress(habit: Habit, base = new Date()) {
  const completed = Array.from({ length: 7 }, (_, index) => dayKeyOffset(index - 6, base)).filter((key) =>
    isHabitCompleteOn(habit, key),
  ).length;
  return { completed, target: habit.goalPerWeek, ratio: habit.goalPerWeek ? Math.min(completed / habit.goalPerWeek, 1) : 0 };
}

export function focusMinutesOnDay(sessions: FocusSession[], key: string) {
  return sessions
    .filter((session) => session.completed && dayKey(new Date(session.startedAt)) === key)
    .reduce((total, session) => total + session.durationMinutes, 0);
}

export function weeklyFocusMinutes(sessions: FocusSession[], base = new Date()) {
  return Array.from({ length: 7 }, (_, index) => {
    const key = dayKeyOffset(index - 6, base);
    return { key, minutes: focusMinutesOnDay(sessions, key) };
  });
}

export function completedTodosOnDay(todos: Todo[], key: string) {
  return todos.filter((todo) => todo.completed && todo.completedAt && dayKey(new Date(todo.completedAt)) === key).length;
}

export function weeklyCompletedTodos(todos: Todo[], base = new Date()) {
  return Array.from({ length: 7 }, (_, index) => {
    const key = dayKeyOffset(index - 6, base);
    return { key, count: completedTodosOnDay(todos, key) };
  });
}

export function totalFocusMinutes(sessions: FocusSession[]) {
  return sessions.filter((session) => session.completed).reduce((total, session) => total + session.durationMinutes, 0);
}

export function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}分`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}時間${remainder}分` : `${hours}時間`;
}

export function shortWeekday(key: string) {
  return ["日", "月", "火", "水", "木", "金", "土"][dayKeyToDate(key).getDay()];
}

export function daysBetween(a: string, b: string) {
  return Math.round((dayKeyToDate(b).getTime() - dayKeyToDate(a).getTime()) / DAY_MS);
}

export type GateSummary = { pendingTodos: number; pendingHabits: number; pendingCount: number; message: string };

export type GateRuleSummary = GateSummary & { id: string; label: string; isActive: boolean; blockedPackages: string[]; requiredTodoIds: string[]; requiredHabitIds: string[]; pendingTodoIds: string[]; pendingHabitIds: string[]; schedule?: GateSchedule };

function getRuleSummary(data: FocusFlowData, schedule: GateSchedule | undefined, base: Date): GateRuleSummary {
  const explicitTodoIds = schedule?.requiredTodoIds;
  const explicitHabitIds = schedule?.requiredHabitIds;
  const todoIds = explicitTodoIds ?? data.gateConfig.requiredTodoIds;
  const habitIds = explicitHabitIds ?? data.gateConfig.requiredHabitIds;
  const requiredTodos = todoIds.length ? data.todos.filter((todo) => todoIds.includes(todo.id)) : explicitTodoIds ? [] : data.todos;
  const requiredHabits = habitIds.length ? data.habits.filter((habit) => habitIds.includes(habit.id)) : explicitHabitIds ? [] : data.habits;
  const pendingTodoIds = requiredTodos.filter((todo) => !todo.completed).map((todo) => todo.id);
  const pendingHabitIds = requiredHabits.filter((habit) => !isHabitCompleteOn(habit, dayKey(base))).map((habit) => habit.id);
  const pendingTodos = pendingTodoIds.length;
  const pendingHabits = pendingHabitIds.length;
  const pendingCount = pendingTodos + pendingHabits;
  const fragments = [pendingTodos ? `Todo ${pendingTodos}件` : "", pendingHabits ? `習慣 ${pendingHabits}件` : ""].filter(Boolean);
  return { id: schedule?.id ?? "always", label: schedule?.label ?? "常時の集中ルール", isActive: schedule ? isScheduleActive(schedule, base) : true, blockedPackages: schedule?.blockedPackages ?? data.gateConfig.blockedPackages, requiredTodoIds: requiredTodos.map((todo) => todo.id), requiredHabitIds: requiredHabits.map((habit) => habit.id), pendingTodoIds, pendingHabitIds, pendingTodos, pendingHabits, pendingCount, schedule, message: pendingCount ? `未完了：${fragments.join("・")}` : "このルールの必須項目を完了しました" };
}

export function getGateRuleSummaries(data: FocusFlowData, base = new Date()) {
  const schedules = data.gateConfig.schedules.length ? data.gateConfig.schedules : [undefined];
  return schedules.map((schedule) => getRuleSummary(data, schedule, base));
}

export function getGateSummary(data: FocusFlowData, base = new Date()): GateSummary {
  const activeRules = getGateRuleSummaries(data, base).filter((rule) => rule.isActive);
  const todoIds = new Set(activeRules.flatMap((rule) => rule.pendingTodoIds));
  const habitIds = new Set(activeRules.flatMap((rule) => rule.pendingHabitIds));
  const pendingTodos = todoIds.size;
  const pendingHabits = habitIds.size;
  const pendingCount = pendingTodos + pendingHabits;
  const fragments = [pendingTodos ? `Todo ${pendingTodos}件` : "", pendingHabits ? `習慣 ${pendingHabits}件` : ""].filter(Boolean);
  return { pendingTodos, pendingHabits, pendingCount, message: pendingCount ? `必須項目が未完了です：${fragments.join("・")}` : activeRules.length ? "この時間帯の必須項目を完了しました" : "現在は制限時間外です" };
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return Math.min(Math.max((Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0), 0), 1439);
}

export function isScheduleActive(schedule: GateSchedule, base = new Date()) {
  if (!schedule.enabled || !schedule.days.length) return false;
  const minutes = base.getHours() * 60 + base.getMinutes();
  const today = base.getDay();
  const yesterday = (today + 6) % 7;
  const start = timeToMinutes(schedule.startTime);
  const end = timeToMinutes(schedule.endTime);
  if (start === end) return schedule.days.includes(today);
  if (start < end) return schedule.days.includes(today) && minutes >= start && minutes < end;
  return (schedule.days.includes(today) && minutes >= start) || (schedule.days.includes(yesterday) && minutes < end);
}

export function isGateTimeActive(config: GateConfig, base = new Date()) {
  return config.schedules.length === 0 || config.schedules.some((schedule) => isScheduleActive(schedule, base));
}
